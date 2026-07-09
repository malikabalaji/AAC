/* ============================================================================
   ON-DEVICE PREDICTION ENGINE
   Words: n-gram model (bigram + trigram) over a seed corpus of AAC sentence
   frames, blended with the child's own learned bigrams, then re-ranked by:
     - hour-of-day usage with kernel smoothing (what this child asks at ~this
       hour, with neighbouring hours contributing at reduced weight)
     - weekday/weekend usage (school-day routines differ from home days)
     - coarse time-of-day priors as a cold-start fallback
     - recency of use in this session
   Phrases: the same hour-kernel learning applied to quick phrases, so the
   app anticipates whole requests ("I am hungry" before mealtimes) — see
   predictPhrases()/learnPhrase().
   Everything is learned live and stored only in the child's profile on this
   device. No data leaves the device.
   ============================================================================ */
import { WORD_BY_ID } from '../data/vocabulary.js';
import { PHRASES, PHRASE_GROUPS } from '../data/phrases.js';

/* Seed corpus of core AAC sentence frames (symbol ids). The child's own
   sentences are learned on top of this via profile bigrams. */
const CORPUS = [
  ['i', 'want', 'water'], ['i', 'want', 'milk'], ['i', 'want', 'food'],
  ['i', 'want', 'toy'], ['i', 'want', 'book'], ['i', 'want', 'more'],
  ['i', 'want', 'more', 'milk'], ['i', 'want', 'more', 'food'],
  ['i', 'want', 'play'], ['i', 'want', 'help'], ['i', 'want', 'amma'],
  ['i', 'want', 'go', 'home'], ['i', 'want', 'go', 'toilet'],
  ['i', 'hungry'], ['i', 'hungry', 'want', 'food'], ['i', 'want', 'eat', 'food'],
  ['i', 'tired'], ['i', 'tired', 'want', 'sleep'], ['i', 'want', 'sleep'],
  ['i', 'happy'], ['i', 'sad'], ['i', 'pain'], ['i', 'pain', 'help'],
  ['i', 'scared'], ['i', 'angry'], ['i', 'not', 'like'], ['i', 'dont_want'],
  ['i', 'want', 'drink', 'water'], ['i', 'want', 'drink', 'milk'],
  ['i', 'go', 'school'], ['i', 'go', 'home'], ['i', 'go', 'toilet'],
  ['i', 'want', 'go', 'school'], ['go', 'home'], ['go', 'toilet'],
  ['i', 'want', 'go', 'outside'], ['i', 'want', 'play', 'ball'],
  ['hello', 'teacher'], ['hello', 'amma'], ['thanks', 'amma'], ['bye', 'amma'],
  ['yes', 'more'], ['no', 'more'], ['no', 'stop'], ['stop', 'play'],
  ['i', 'want', 'play', 'toy'], ['i', 'want', 'play', 'more'],
  ['amma', 'help'], ['amma', 'i', 'hungry'], ['appa', 'i', 'want', 'go', 'home'],
  ['amma', 'i', 'want', 'milk'], ['amma', 'i', 'pain'], ['paati', 'i', 'want', 'food'],
  ['teacher', 'help'], ['teacher', 'i', 'want', 'toilet'],
  ['i', 'want', 'tv'], ['i', 'want', 'music'], ['i', 'like', 'music'],
  ['i', 'want', 'fruit'], ['i', 'want', 'biscuit'], ['i', 'like', 'dog'],
  ['come', 'play'], ['give', 'water'], ['give', 'toy'], ['look', 'bird'],
  ['i', 'done'], ['done', 'eat'],
  // repeats weight the most common frames
  ['i', 'want', 'water'], ['i', 'want', 'water'], ['i', 'want', 'milk'],
  ['i', 'hungry'], ['i', 'want', 'food'], ['i', 'want', 'go', 'home'],
  ['i', 'want', 'play'], ['i', 'tired'], ['i', 'want', 'sleep'],
];

function buildModel(corpus) {
  const uni = {}, bi = {}, tri = {};
  const bump = (table, key, next) => {
    (table[key] = table[key] || {})[next] = (table[key][next] || 0) + 1;
  };
  for (const seq of corpus) {
    const s = ['<s>', ...seq];
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== '<s>') uni[s[i]] = (uni[s[i]] || 0) + 1;
      if (i >= 1) bump(bi, s[i - 1], s[i]);
      if (i >= 2) bump(tri, s[i - 2] + '|' + s[i - 1], s[i]);
    }
  }
  return { uni, bi, tri };
}

const MODEL = buildModel(CORPUS);

const TIME_BOOSTS = {
  morning: { milk: 1.6, food: 1.4, school: 1.5, hungry: 1.4, hello: 1.3, bathe: 1.4 },
  midday: { food: 1.6, water: 1.4, play: 1.3, toilet: 1.2 },
  evening: { play: 1.4, toy: 1.4, home: 1.5, book: 1.3, outside: 1.3 },
  night: { sleep: 1.8, tired: 1.7, milk: 1.3, amma: 1.3, moon: 1.2 },
};

export function timeOfDay(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'midday';
  if (hour >= 16 && hour < 20) return 'evening';
  return 'night';
}

/* Weekday vs weekend bucket — school-day patterns differ from home days. */
export function dayType(d = new Date()) {
  const day = d.getDay();
  return day === 0 || day === 6 ? 'we' : 'wd';
}

/* Hour-kernel: how much each learned hour contributes to a prediction at the
   current hour. ±2h window, triangular falloff — enough smoothing that a
   snack asked at 3:40pm still boosts 4pm, without bleeding into evening. */
const HOUR_KERNEL = [1, 0.55, 0.2];

function hourKernelScore(hourTable, id, nowHour) {
  let s = 0;
  for (let d = -2; d <= 2; d++) {
    const h = (nowHour + d + 24) % 24;
    const c = hourTable?.[h]?.[id];
    if (c) s += c * HOUR_KERNEL[Math.abs(d)];
  }
  return s;
}

function tableTotal(hourTable, nowHour) {
  let t = 0;
  for (let d = -2; d <= 2; d++) {
    const h = (nowHour + d + 24) % 24;
    const row = hourTable?.[h];
    if (row) {
      const k = HOUR_KERNEL[Math.abs(d)];
      for (const c of Object.values(row)) t += c * k;
    }
  }
  return t || 1;
}

/* history: symbol ids in the sentence strip.
   profile: { freq, todFreq, bigrams } — this child's on-device usage.
   Returns up to n symbol ids, best first. */
export function predictNext(history, profile, n = 4) {
  const last = history[history.length - 1] || '<s>';
  const prev = history[history.length - 2] || '<s>';
  const scores = {};
  const add = (row, weight) => {
    if (!row) return;
    const total = Object.values(row).reduce((a, b) => a + b, 0);
    for (const [tok, c] of Object.entries(row)) {
      scores[tok] = (scores[tok] || 0) + weight * (c / total);
    }
  };
  add(MODEL.tri[prev + '|' + last], 0.5);
  add(MODEL.bi[last], 0.25);
  add(profile.bigrams?.[last], 0.35); // the child's own transitions weigh most per-unit
  const uniTotal = Object.values(MODEL.uni).reduce((a, b) => a + b, 0) || 1;
  for (const [tok, c] of Object.entries(MODEL.uni)) {
    scores[tok] = (scores[tok] || 0) + 0.08 * (c / uniTotal);
  }

  // ---- re-rank with situational signals ----
  const now = new Date();
  const hour = now.getHours();
  const tod = timeOfDay(hour);
  const dt = dayType(now);
  const boosts = TIME_BOOSTS[tod] || {};
  const freq = profile.freq || {};
  const freqTotal = Object.values(freq).reduce((a, b) => a + b, 0) || 1;
  const hourTotal = tableTotal(profile.hourFreq, hour);
  const dowMap = profile.dowFreq?.[dt] || {};
  const dowTotal = Object.values(dowMap).reduce((a, b) => a + b, 0) || 1;
  const recent = new Set((profile.recents || []).slice(0, 4));

  for (const tok of Object.keys(scores)) {
    if (boosts[tok]) scores[tok] *= boosts[tok];                 // cold-start priors
    scores[tok] *= 1 + ((freq[tok] || 0) / freqTotal) * 1.6;     // overall personal
    scores[tok] *= 1 + (hourKernelScore(profile.hourFreq, tok, hour) / hourTotal) * 3.0; // ~this hour
    scores[tok] *= 1 + ((dowMap[tok] || 0) / dowTotal) * 1.2;    // weekday/weekend
    if (recent.has(tok)) scores[tok] *= 1.2;                     // recency
  }

  const exclude = new Set(history.slice(-1));
  return Object.entries(scores)
    .filter(([tok]) => !exclude.has(tok) && WORD_BY_ID[tok])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tok]) => tok);
}

/* Learn from a tap: returns the profile usage fields updated immutably. */
export function learnTap(profile, wordId, prevWordId) {
  const now = new Date();
  const hour = now.getHours();
  const tod = timeOfDay(hour);
  const dt = dayType(now);
  const freq = { ...(profile.freq || {}) };
  freq[wordId] = (freq[wordId] || 0) + 1;
  const todFreq = { ...(profile.todFreq || {}) };
  todFreq[tod] = { ...(todFreq[tod] || {}) };
  todFreq[tod][wordId] = (todFreq[tod][wordId] || 0) + 1;
  const hourFreq = { ...(profile.hourFreq || {}) };
  hourFreq[hour] = { ...(hourFreq[hour] || {}) };
  hourFreq[hour][wordId] = (hourFreq[hour][wordId] || 0) + 1;
  const dowFreq = { ...(profile.dowFreq || {}) };
  dowFreq[dt] = { ...(dowFreq[dt] || {}) };
  dowFreq[dt][wordId] = (dowFreq[dt][wordId] || 0) + 1;
  const bigrams = { ...(profile.bigrams || {}) };
  const key = prevWordId || '<s>';
  bigrams[key] = { ...(bigrams[key] || {}) };
  bigrams[key][wordId] = (bigrams[key][wordId] || 0) + 1;
  return { freq, todFreq, hourFreq, dowFreq, bigrams };
}

/* ============================================================================
   ADAPTIVE QUICK-PHRASE PREDICTION
   Cold-start priors say which whole requests are typical at each time of day;
   the child's own phrase usage (hour-kernel smoothed) quickly dominates, so
   the app learns e.g. that THIS child asks for the toilet at 7pm.
   ============================================================================ */
const PHRASE_TIME_PRIORS = {
  morning: { hungry: 1.6, toilet: 1.4, water: 1.2, sick: 1.1 },
  midday: { hungry: 1.6, water: 1.4, toilet: 1.3 },
  evening: { home: 1.5, water: 1.3, hungry: 1.2, rest: 1.1 },
  night: { rest: 1.7, toilet: 1.3, scared: 1.2, water: 1.1 },
};

const ALL_PHRASE_IDS = PHRASE_GROUPS.flatMap((g) => g.phrases).filter((id) => PHRASES[id]);

export function learnPhrase(profile, phraseId) {
  const hour = new Date().getHours();
  const phraseFreq = { ...(profile.phraseFreq || {}) };
  phraseFreq[hour] = { ...(phraseFreq[hour] || {}) };
  phraseFreq[hour][phraseId] = (phraseFreq[hour][phraseId] || 0) + 1;
  return { phraseFreq };
}

/* Top n phrases the child is likely to need right now. */
export function predictPhrases(profile, n = 2) {
  const hour = new Date().getHours();
  const priors = PHRASE_TIME_PRIORS[timeOfDay(hour)] || {};
  const learnedTotal = tableTotal(profile.phraseFreq, hour);
  return ALL_PHRASE_IDS.map((id) => {
    let s = priors[id] || 1;
    s *= 1 + (hourKernelScore(profile.phraseFreq, id, hour) / learnedTotal) * 4.0;
    return [id, s];
  })
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id);
}
