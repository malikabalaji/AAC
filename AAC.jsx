import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================================
   PREDICTIVE MULTILINGUAL AAC BOARD
   ----------------------------------------------------------------------------
   A communication board for non-verbal children in Indian languages.
   Tap symbols to build a sentence; the engine predicts what comes next.

   The ML is real and runs live in the browser:
     1. N-gram model (bigram + trigram) trained on a synthetic AAC corpus
     2. Context re-ranker (time-of-day, recency, frequency)
     3. Per-child personalization that adapts as you tap
   Voice output uses the browser SpeechSynthesis API (Indic voices when present).
   ============================================================================ */

/* ----------------------------------------------------------------------------
   1. SYMBOL VOCABULARY
   Each symbol has a glyph (emoji stand-in for a real AAC pictogram), an English
   id used by the model, and translations + speakable text per language.
---------------------------------------------------------------------------- */
const SYMBOLS = [
  // Pronouns / people
  { id: "i",       glyph: "🧒", cat: "people",  en: "I",      ta: "நான்",     te: "నేను",     hi: "मैं",   bn: "আমি",    mr: "मी",    gu: "હું",    kn: "ನಾನು",   or: "ମୁଁ",    ml: "ഞാൻ" },
  { id: "you",     glyph: "🫵", cat: "people",  en: "you",    ta: "நீ",       te: "నువ్వు",   hi: "तुम",   bn: "তুমি",   mr: "तू",    gu: "તું",    kn: "ನೀನು",   or: "ତୁମେ",   ml: "നീ" },
  { id: "amma",    glyph: "👩", cat: "people",  en: "mother", ta: "அம்மா",    te: "అమ్మ",     hi: "माँ",   bn: "মা",     mr: "आई",    gu: "મા",     kn: "ಅಮ್ಮ",    or: "ମା",     ml: "അമ്മ" },
  { id: "appa",    glyph: "👨", cat: "people",  en: "father", ta: "அப்பா",    te: "నాన్న",    hi: "पापा",  bn: "বাবা",   mr: "बाबा",  gu: "પપ્પા",  kn: "ಅಪ್ಪ",    or: "ବାପା",   ml: "അച്ഛൻ" },
  { id: "teacher", glyph: "🧑‍🏫", cat: "people", en: "teacher", ta: "ஆசிரியர்", te: "టీచర్",   hi: "टीचर",  bn: "শিক্ষক",  mr: "शिक्षक", gu: "શિક્ષક",  kn: "ಶಿಕ್ಷಕ",  or: "ଶିକ୍ଷକ",  ml: "അധ്യാപകൻ" },
  // Actions
  { id: "want",    glyph: "🙌", cat: "actions", en: "want",   ta: "வேண்டும்", te: "కావాలి",   hi: "चाहिए", bn: "চাই",    mr: "हवं",   gu: "જોઈએ",   kn: "ಬೇಕು",    or: "ଦରକାର",  ml: "വേണം" },
  { id: "go",      glyph: "🚶", cat: "actions", en: "go",     ta: "போக",      te: "వెళ్ళు",   hi: "जाना",  bn: "যাওয়া",  mr: "जाणे",  gu: "જવું",   kn: "ಹೋಗು",   or: "ଯିବା",   ml: "പോകുക" },
  { id: "eat",     glyph: "🍽️", cat: "actions", en: "eat",    ta: "சாப்பிட",  te: "తిను",     hi: "खाना",  bn: "খাওয়া",  mr: "खाणे",  gu: "ખાવું",  kn: "ತಿನ್ನು",   or: "ଖାଇବା",   ml: "കഴിക്കുക" },
  { id: "drink",   glyph: "🥤", cat: "actions", en: "drink",  ta: "குடிக்க",  te: "తాగు",     hi: "पीना",  bn: "পান করা", mr: "पिणे",  gu: "પીવું",  kn: "ಕುಡಿ",    or: "ପିଇବା",   ml: "കുടിക്കുക" },
  { id: "play",    glyph: "🧸", cat: "actions", en: "play",   ta: "விளையாட", te: "ఆడు",      hi: "खेलना", bn: "খেলা",   mr: "खेळणे", gu: "રમવું",  kn: "ಆಟ",      or: "ଖେଳିବା",  ml: "കളിക്കുക" },
  { id: "sleep",   glyph: "😴", cat: "actions", en: "sleep",  ta: "தூங்க",    te: "నిద్ర",    hi: "सोना",  bn: "ঘুম",     mr: "झोपणे", gu: "સૂવું",  kn: "ನಿದ್ರೆ",   or: "ଶୋଇବା",   ml: "ഉറങ്ങുക" },
  { id: "stop",    glyph: "✋", cat: "actions", en: "stop",   ta: "நிறுத்து", te: "ఆపు",      hi: "रुको",  bn: "থামো",   mr: "थांब",  gu: "રોકો",   kn: "ನಿಲ್ಲಿಸು", or: "ଅଟକ",    ml: "നിർത്തുക" },
  { id: "more",    glyph: "➕", cat: "actions", en: "more",   ta: "மேலும்",   te: "ఇంకా",     hi: "और",    bn: "আরও",    mr: "अजून",  gu: "વધારે",  kn: "ಇನ್ನೂ",   or: "ଅଧିକ",   ml: "കൂടുതൽ" },
  { id: "help",    glyph: "🆘", cat: "actions", en: "help",   ta: "உதவி",     te: "సహాయం",   hi: "मदद",   bn: "সাহায্য",  mr: "मदत",   gu: "મદદ",    kn: "ಸಹಾಯ",    or: "ସାହାଯ୍ୟ",  ml: "സഹായം" },
  // Food & Drink
  { id: "water",   glyph: "💧", cat: "food",    en: "water",  ta: "தண்ணீர்",  te: "నీళ్ళు",   hi: "पानी",  bn: "জল",     mr: "पाणी",  gu: "પાણી",   kn: "ನೀರು",    or: "ପାଣି",    ml: "വെള്ളം" },
  { id: "food",    glyph: "🍚", cat: "food",    en: "food",   ta: "உணவு",     te: "అన్నం",    hi: "खाना",  bn: "খাবার",  mr: "जेवण",  gu: "ખોરાક",  kn: "ಆಹಾರ",    or: "ଖାଦ୍ୟ",   ml: "ഭക്ഷണം" },
  { id: "milk",    glyph: "🥛", cat: "food",    en: "milk",   ta: "பால்",     te: "పాలు",     hi: "दूध",   bn: "দুধ",     mr: "दूध",   gu: "દૂધ",    kn: "ಹಾಲು",    or: "ଦୁଧ",     ml: "പാൽ" },
  // Places
  { id: "toilet",  glyph: "🚽", cat: "places",  en: "toilet", ta: "கழிப்பறை", te: "టాయిలెట్", hi: "टॉयलेट", bn: "টয়লেট",  mr: "टॉयलेट", gu: "ટોઇલેટ",  kn: "ಟಾಯ್ಲೆಟ್", or: "ଟଏଲେଟ୍",  ml: "ടോയ്‌ലറ്റ്" },
  { id: "school",  glyph: "🏫", cat: "places",  en: "school", ta: "பள்ளி",    te: "స్కూల్",   hi: "स्कूल",  bn: "স্কুল",   mr: "शाळा",  gu: "શાળા",   kn: "ಶಾಲೆ",    or: "ସ୍କୁଲ୍",   ml: "സ്കൂൾ" },
  { id: "home",    glyph: "🏠", cat: "places",  en: "home",   ta: "வீடு",     te: "ఇల్లు",    hi: "घर",    bn: "বাড়ি",   mr: "घर",    gu: "ઘર",     kn: "ಮನೆ",     or: "ଘର",     ml: "വീട്" },
  // Things
  { id: "toy",     glyph: "🪀", cat: "things",  en: "toy",    ta: "பொம்மை",   te: "ఆటబొమ్మ",  hi: "खिलौना", bn: "খেলনা",  mr: "खेळणं", gu: "રમકડું",  kn: "ಆಟಿಕೆ",   or: "ଖେଳନା",   ml: "കളിപ്പാട്ടം" },
  { id: "book",    glyph: "📖", cat: "things",  en: "book",   ta: "புத்தகம்", te: "పుస్తకం",  hi: "किताब", bn: "বই",     mr: "पुस्तक", gu: "પુસ્તક",  kn: "ಪುಸ್ತಕ",   or: "ବହି",     ml: "പുസ്തകം" },
  // Feelings
  { id: "happy",   glyph: "😊", cat: "feelings", en: "happy", ta: "மகிழ்ச்சி", te: "సంతోషం",  hi: "खुश",   bn: "খুশি",   mr: "आनंदी", gu: "ખુશ",    kn: "ಸಂತೋಷ",   or: "ଖୁସି",    ml: "സന്തോഷം" },
  { id: "sad",     glyph: "😢", cat: "feelings", en: "sad",   ta: "சோகம்",    te: "బాధ",      hi: "दुखी",  bn: "দুঃখ",   mr: "दुःखी", gu: "ઉદાસ",   kn: "ದುಃಖ",    or: "ଦୁଃଖ",    ml: "സങ്കടം" },
  { id: "hungry",  glyph: "🤤", cat: "feelings", en: "hungry", ta: "பசி",     te: "ఆకలి",     hi: "भूख",   bn: "ক্ষুধা",  mr: "भूक",   gu: "ભૂખ",    kn: "ಹಸಿವು",   or: "ଭୋକ",    ml: "വിശപ്പ്" },
  { id: "tired",   glyph: "🥱", cat: "feelings", en: "tired", ta: "சோர்வு",   te: "అలసట",     hi: "थका",   bn: "ক্লান্ত",  mr: "थकलो",  gu: "થાક",    kn: "ಸುಸ್ತು",   or: "ଥକା",    ml: "ക്ഷീണം" },
  { id: "pain",    glyph: "🤕", cat: "feelings", en: "pain",  ta: "வலி",      te: "నొప్పి",   hi: "दर्द",  bn: "ব্যথা",   mr: "वेदना", gu: "દુખાવો",  kn: "ನೋವು",    or: "ବ୍ୟଥା",   ml: "വേദന" },
  // Quick words
  { id: "yes",     glyph: "✅", cat: "quick",   en: "yes",    ta: "ஆம்",      te: "అవును",    hi: "हाँ",   bn: "হ্যাঁ",   mr: "हो",    gu: "હા",     kn: "ಹೌದು",    or: "ହଁ",     ml: "അതെ" },
  { id: "no",      glyph: "❌", cat: "quick",   en: "no",     ta: "இல்லை",    te: "కాదు",     hi: "नहीं",  bn: "না",     mr: "नाही",  gu: "ના",     kn: "ಇಲ್ಲ",    or: "ନା",     ml: "അല്ല" },
  { id: "thanks",  glyph: "🙏", cat: "quick",   en: "thank you", ta: "நன்றி", te: "ధన్యవాదాలు", hi: "धन्यवाद", bn: "ধন্যবাদ", mr: "धन्यवाद", gu: "આભાર",   kn: "ಧನ್ಯವಾದ",  or: "ଧନ୍ୟବାଦ",  ml: "നന്ദി" },
  { id: "hello",   glyph: "👋", cat: "quick",   en: "hello",  ta: "வணக்கம்",  te: "నమస్తే",   hi: "नमस्ते", bn: "নমস্কার", mr: "नमस्कार", gu: "નમસ્તે",  kn: "ನಮಸ್ಕಾರ",  or: "ନମସ୍କାର",  ml: "നമസ്കാരം" },
];

const SYMBOL_BY_ID = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));

const CATEGORIES = {
  people:   { label: "People",       color: "#2563EB" }, // blue
  actions:  { label: "Actions",      color: "#0F766E" }, // teal
  food:     { label: "Food & Drink", color: "#B45309" }, // amber (AA on white)
  places:   { label: "Places",       color: "#0369A1" }, // sky   (AA on white)
  things:   { label: "Things",       color: "#7C3AED" }, // purple
  feelings: { label: "Feelings",     color: "#DB2777" }, // pink
  quick:    { label: "Quick Words",  color: "#15803D" }, // green (AA on white)
};

const LANGUAGES = {
  en: { label: "English", native: "English", field: "en", flag: "🌐", voice: ["en-IN", "en-US", "en-GB", "en"] },
  ta: { label: "Tamil",   native: "தமிழ்",   field: "ta", flag: "🇮🇳", voice: ["ta-IN", "ta"] },
  hi: { label: "Hindi",   native: "हिन्दी",  field: "hi", flag: "🇮🇳", voice: ["hi-IN", "hi"] },
  te: { label: "Telugu",  native: "తెలుగు",  field: "te", flag: "🇮🇳", voice: ["te-IN", "te"] },
  bn: { label: "Bengali",   native: "বাংলা",    field: "bn", flag: "🇮🇳", voice: ["bn-IN", "bn-BD", "bn"] },
  mr: { label: "Marathi",   native: "मराठी",    field: "mr", flag: "🇮🇳", voice: ["mr-IN", "mr"] },
  kn: { label: "Kannada",   native: "ಕನ್ನಡ",     field: "kn", flag: "🇮🇳", voice: ["kn-IN", "kn"] },
};

/* ----------------------------------------------------------------------------
   OPENMOJI RENDERING
   We render the friendly, consistent OpenMoji pictograms (color SVGs) instead
   of relying on each device's native emoji font. An emoji string is converted
   to OpenMoji's hex-codepoint filename (variation selectors stripped, ZWJ kept).
---------------------------------------------------------------------------- */
const OPENMOJI_BASE = "icons/"; // local OpenMoji SVGs, bundled for offline use

function openmojiUrl(emoji) {
  const cps = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfe0f) continue; // OpenMoji filenames drop the VS16 selector
    cps.push(cp.toString(16).toUpperCase());
  }
  return OPENMOJI_BASE + cps.join("-") + ".svg";
}

function Om({ ch, size = 40, style }) {
  return (
    <img
      src={openmojiUrl(ch)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    />
  );
}

/* Sira logo — a sharp speech bubble holding three symbol dots (a board in a
   bubble). White mark on a blue gradient tile. */
function Logo({ size = 44 }) {
  return (
    <span
      style={{
        width: size, height: size, flexShrink: 0,
        borderRadius: Math.round(size * 0.2),
        background: "linear-gradient(135deg, #3B82F6, #2563EB)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 6px rgba(37,99,235,0.35)",
      }}
    >
      <svg viewBox="0 0 32 32" width={Math.round(size * 0.62)} height={Math.round(size * 0.62)} aria-hidden="true">
        <path d="M5 5 H27 V21 H13 L7 27 V21 H5 Z" fill="#fff" />
        <circle cx="11.5" cy="13" r="2" fill="#2563EB" />
        <circle cx="16" cy="13" r="2" fill="#2563EB" />
        <circle cx="20.5" cy="13" r="2" fill="#2563EB" />
      </svg>
    </span>
  );
}

/* ----------------------------------------------------------------------------
   2. SYNTHETIC TRAINING CORPUS
   Real Tamil/Telugu AAC sequence data does not exist publicly, so we construct
   a synthetic corpus from core AAC sentence frames. This is an honest,
   documented choice: the N-gram model genuinely learns from these sequences.
---------------------------------------------------------------------------- */
const CORPUS = [
  // wants
  ["i", "want", "water"], ["i", "want", "milk"], ["i", "want", "food"],
  ["i", "want", "toy"], ["i", "want", "book"], ["i", "want", "more"],
  ["i", "want", "more", "milk"], ["i", "want", "more", "food"],
  ["i", "want", "play"], ["i", "want", "help"], ["i", "want", "amma"],
  ["i", "want", "go", "home"], ["i", "want", "go", "toilet"],
  // needs / states
  ["i", "hungry"], ["i", "hungry", "want", "food"], ["i", "want", "eat", "food"],
  ["i", "tired"], ["i", "tired", "want", "sleep"], ["i", "want", "sleep"],
  ["i", "happy"], ["i", "sad"], ["i", "pain"], ["i", "pain", "help"],
  ["i", "want", "drink", "water"], ["i", "want", "drink", "milk"],
  // going places
  ["i", "go", "school"], ["i", "go", "home"], ["i", "go", "toilet"],
  ["i", "want", "go", "school"], ["go", "home"], ["go", "toilet"],
  // social
  ["hello", "teacher"], ["hello", "amma"], ["thanks", "amma"],
  ["yes", "more"], ["no", "more"], ["no", "stop"], ["stop", "play"],
  ["i", "want", "play", "toy"], ["i", "want", "play", "more"],
  // mother/father directed
  ["amma", "help"], ["amma", "i", "hungry"], ["appa", "i", "want", "go", "home"],
  ["amma", "i", "want", "milk"], ["amma", "i", "pain"],
  ["teacher", "help"], ["teacher", "i", "want", "toilet"],
  // repeats to weight common transitions
  ["i", "want", "water"], ["i", "want", "water"], ["i", "want", "milk"],
  ["i", "hungry"], ["i", "want", "food"], ["i", "want", "go", "home"],
  ["i", "want", "play"], ["i", "tired"], ["i", "want", "sleep"],
];

/* ----------------------------------------------------------------------------
   3. N-GRAM MODEL
   Builds bigram and trigram frequency tables from the corpus. Prediction
   interpolates trigram (context of last two symbols) with bigram (last one)
   and a unigram floor, so it always returns sensible suggestions.
---------------------------------------------------------------------------- */
function buildNgramModel(corpus) {
  const uni = {}, bi = {}, tri = {};
  const bump = (table, key, next) => {
    table[key] = table[key] || {};
    table[key][next] = (table[key][next] || 0) + 1;
  };
  for (const seq of corpus) {
    const s = ["<s>", ...seq];
    for (let i = 0; i < s.length; i++) {
      const tok = s[i];
      if (tok !== "<s>") uni[tok] = (uni[tok] || 0) + 1;
      if (i >= 1) bump(bi, s[i - 1], s[i]);
      if (i >= 2) bump(tri, s[i - 2] + "|" + s[i - 1], s[i]);
    }
  }
  return { uni, bi, tri };
}

function ngramScores(model, history) {
  // history = array of symbol ids already chosen
  const last = history[history.length - 1] || "<s>";
  const prev = history[history.length - 2] || "<s>";
  const scores = {};
  const add = (table, key, weight) => {
    const row = table[key];
    if (!row) return;
    const total = Object.values(row).reduce((a, b) => a + b, 0);
    for (const [tok, c] of Object.entries(row)) {
      scores[tok] = (scores[tok] || 0) + weight * (c / total);
    }
  };
  // interpolation weights: trigram strongest, then bigram, then unigram floor
  add(model.tri, prev + "|" + last, 0.6);
  add(model.bi, last, 0.3);
  // unigram floor
  const uniTotal = Object.values(model.uni).reduce((a, b) => a + b, 0) || 1;
  for (const [tok, c] of Object.entries(model.uni)) {
    scores[tok] = (scores[tok] || 0) + 0.1 * (c / uniTotal);
  }
  return scores;
}

/* ----------------------------------------------------------------------------
   4. CONTEXT RE-RANKER
   Adjusts raw n-gram scores using situational signals:
     - time of day  (morning -> breakfast/milk; night -> sleep/tired)
     - recency      (recently used symbols get a small boost)
     - personal frequency (this child's own history, learned live)
---------------------------------------------------------------------------- */
const TIME_BOOSTS = {
  morning: { milk: 1.6, food: 1.4, school: 1.5, hungry: 1.4, hello: 1.3 },
  midday:  { food: 1.6, water: 1.4, play: 1.3, toilet: 1.2 },
  evening: { play: 1.4, toy: 1.4, home: 1.5, book: 1.3 },
  night:   { sleep: 1.8, tired: 1.7, milk: 1.3, amma: 1.3 },
};

function timeOfDay(hour) {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "midday";
  if (hour >= 16 && hour < 20) return "evening";
  return "night";
}

function rerank(rawScores, { tod, recent, personalFreq, todFreq }) {
  const out = {};
  const recentSet = new Set(recent.slice(-4));
  const timeMap = TIME_BOOSTS[tod] || {};                       // built-in time priors
  const personalTotal = Object.values(personalFreq).reduce((a, b) => a + b, 0) || 1;
  const todMap = (todFreq && todFreq[tod]) || {};               // learned: this child, this time
  const todTotal = Object.values(todMap).reduce((a, b) => a + b, 0) || 1;
  for (const [tok, base] of Object.entries(rawScores)) {
    let s = base;
    if (timeMap[tok]) s *= timeMap[tok];                        // time-of-day priors
    if (recentSet.has(tok)) s *= 1.25;                          // recency
    const pf = (personalFreq[tok] || 0) / personalTotal;        // overall personalization
    s *= 1 + pf * 2.5;
    const tf = (todMap[tok] || 0) / todTotal;                   // what they usually ask now
    s *= 1 + tf * 3.0;
    out[tok] = s;
  }
  return out;
}

function topPredictions(scores, n, exclude) {
  const ex = new Set(exclude);
  return Object.entries(scores)
    .filter(([tok]) => !ex.has(tok) && SYMBOL_BY_ID[tok])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tok]) => tok);
}

/* ----------------------------------------------------------------------------
   5. SPEECH
---------------------------------------------------------------------------- */
function useVoices() {
  const [voices, setVoices] = useState(() => window.speechSynthesis?.getVoices() || []);
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices() || [];
      if (v.length) setVoices(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    // Some browsers populate the voice list late (or only after a newly
    // installed voice registers) — poll a few times so we don't miss it.
    let tries = 0;
    const id = setInterval(() => {
      load();
      if (++tries > 12) clearInterval(id);
    }, 300);
    return () => {
      clearInterval(id);
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  return voices;
}

// Always work off the freshest voice list available, merging the live
// getVoices() result with whatever React state we were handed.
function liveVoices(voices) {
  const live = window.speechSynthesis?.getVoices() || [];
  return live.length >= (voices?.length || 0) ? live : voices;
}

// Find the best installed voice for a language, or null if none exists.
// Matches on region tag first (ta-IN), then the base language (ta), and
// normalises underscores so "ta_IN" / "ta-IN" both match.
function pickVoice(langKey, voices) {
  const list = liveVoices(voices);
  const norm = (s) => (s || "").toLowerCase().replace(/_/g, "-");
  const prefs = LANGUAGES[langKey].voice;
  for (const p of prefs) {
    const v = list.find((v) => norm(v.lang).startsWith(norm(p)));
    if (v) return v;
  }
  return null;
}

// Speak via the browser's Web Speech API (used as a fallback).
function browserSpeak(text, langKey, voices) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const chosen = pickVoice(langKey, voices);
  if (chosen) { u.voice = chosen; u.lang = chosen.lang; }
  else { u.lang = LANGUAGES[langKey].voice[0]; } // no installed voice — browser may stay silent
  u.rate = 0.85;
  u.pitch = 1.25; // child-like
  window.speechSynthesis.speak(u);
}

// Speak. Prefer the local Mac `say` bridge (serve.py) when it's reachable —
// it reliably uses installed system voices — and fall back to the browser.
function speak(text, langKey, voices) {
  fetch("/say?lang=" + langKey + "&text=" + encodeURIComponent(text))
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => { if (!d.ok) browserSpeak(text, langKey, voices); })
    .catch(() => browserSpeak(text, langKey, voices));
}

/* ----------------------------------------------------------------------------
   6. PERSISTENCE + SOS DEFAULTS
   The child's learned usage, name, and the guardian's emergency phrases are
   saved in the browser so they survive across sessions and work offline.
---------------------------------------------------------------------------- */
function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

/* Switch scanning (single-switch linear access).
   A highlight auto-steps through one button at a time (left-to-right,
   top-to-bottom). Pressing the switch (Space or Enter) activates the currently
   highlighted button. Works on whatever is on screen (the board, or an open
   dialog), re-measuring each step so it adapts. */
function useSwitchScanning(enabled, dwellMs) {
  useEffect(() => {
    if (!enabled) return;
    let idx = 0, items = [];

    const clearHL = () =>
      document.querySelectorAll(".scan-item").forEach((el) => el.classList.remove("scan-item"));

    const collect = () => {
      const root = document.querySelector('[role="dialog"]') || document.getElementById("scan-root");
      if (!root) return [];
      // every visible, enabled button, ordered top-to-bottom then left-to-right
      return [...root.querySelectorAll("button")]
        .filter((b) => !b.disabled && b.offsetParent !== null)
        .sort((a, b) => {
          const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          const dy = Math.round(ra.top / 8) - Math.round(rb.top / 8);
          return dy !== 0 ? dy : ra.left - rb.left;
        });
    };

    const paint = () => {
      clearHL();
      items = collect();
      if (!items.length) return;
      idx = idx % items.length;
      items[idx].classList.add("scan-item");
    };

    const tick = () => {
      items = collect();
      if (!items.length) { paint(); return; }
      idx = (idx + 1) % items.length;
      paint();
    };

    const select = () => {
      items = collect();
      if (!items.length) return;
      const el = items[idx % items.length];
      clearHL();
      if (el) el.click();
      idx = 0; // restart from the top after a choice
      paint();
    };

    const onKey = (e) => {
      const t = document.activeElement;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return; // let the guardian type
      if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); select(); }
    };

    paint();
    const id = setInterval(tick, dwellMs);
    window.addEventListener("keydown", onKey, true);
    return () => { clearInterval(id); window.removeEventListener("keydown", onKey, true); clearHL(); };
  }, [enabled, dwellMs]);
}

// Default emergency phrases, pre-translated so changing a phrase's language
// actually speaks it in that language (not English with another accent).
const SOS_PHRASES = {
  help: {
    en: "I need help!", ta: "எனக்கு உதவி வேண்டும்!", hi: "मुझे मदद चाहिए!",
    te: "నాకు సహాయం కావాలి!", bn: "আমার সাহায্য দরকার!", mr: "मला मदत हवी आहे!", kn: "ನನಗೆ ಸಹಾಯ ಬೇಕು!",
  },
  mother: {
    en: "Please call my mother.", ta: "தயவுசெய்து என் அம்மாவை அழைக்கவும்.", hi: "कृपया मेरी माँ को बुलाओ।",
    te: "దయచేసి మా అమ్మను పిలవండి.", bn: "দয়া করে আমার মাকে ডাকুন।", mr: "कृपया माझ्या आईला बोलवा.", kn: "ದಯವಿಟ್ಟು ನನ್ನ ಅಮ್ಮನನ್ನು ಕರೆಯಿರಿ.",
  },
  pain: {
    en: "I am in pain.", ta: "எனக்கு வலிக்கிறது.", hi: "मुझे दर्द हो रहा है।",
    te: "నాకు నొప్పిగా ఉంది.", bn: "আমার ব্যথা হচ্ছে।", mr: "मला वेदना होत आहेत.", kn: "ನನಗೆ ನೋವಾಗುತ್ತಿದೆ.",
  },
  toilet: {
    en: "I need the toilet.", ta: "எனக்கு கழிப்பறை வேண்டும்.", hi: "मुझे टॉयलेट जाना है।",
    te: "నాకు టాయిలెట్ కావాలి.", bn: "আমার টয়লেট দরকার।", mr: "मला टॉयलेटला जायचे आहे.", kn: "ನನಗೆ ಟಾಯ್ಲೆಟ್ ಬೇಕು.",
  },
  home: {
    en: "Please take me home.", ta: "தயவுசெய்து என்னை வீட்டிற்கு அழைத்துச் செல்லுங்கள்.", hi: "कृपया मुझे घर ले चलो।",
    te: "దయచేసి నన్ను ఇంటికి తీసుకెళ్లండి.", bn: "দয়া করে আমাকে বাড়ি নিয়ে চলুন।", mr: "कृपया मला घरी घेऊन चला.", kn: "ದಯವಿಟ್ಟು ನನ್ನನ್ನು ಮನೆಗೆ ಕರೆದೊಯ್ಯಿರಿ.",
  },
  doctor: {
    en: "Call a doctor.", ta: "ஒரு மருத்துவரை அழைக்கவும்.", hi: "डॉक्टर को बुलाओ।",
    te: "డాక్టర్‌ను పిలవండి.", bn: "একজন ডাক্তার ডাকুন।", mr: "डॉक्टरला बोलवा.", kn: "ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ.",
  },
};

// A phrase is either a built-in (has an id → translated) or custom (has text).
const DEFAULT_SOS = Object.keys(SOS_PHRASES).map((id) => ({ id, lang: "en" }));

// The text to show/speak for a phrase in its chosen language.
function sosText(p) {
  if (p.id && SOS_PHRASES[p.id]) return SOS_PHRASES[p.id][p.lang] || SOS_PHRASES[p.id].en;
  return p.text || "";
}

// Upgrade old saved phrases (plain English text, no id) so they translate.
function withSosIds(arr) {
  return arr.map((p) => {
    if (p.id) return p;
    const t = (p.text || "").trim();
    for (const id in SOS_PHRASES) {
      if (Object.values(SOS_PHRASES[id]).some((v) => v === t)) return { id, lang: p.lang || "en" };
    }
    return p; // genuinely custom
  });
}

/* ----------------------------------------------------------------------------
   7. APP
---------------------------------------------------------------------------- */
export default function App() {
  const model = useMemo(() => buildNgramModel(CORPUS), []);
  const voices = useVoices();

  const [lang, setLang] = useState("en");
  const [langChosen, setLangChosen] = useState(false); // show picker until a language is chosen
  const [childName, setChildName] = usePersistentState("sira.name", ""); // saved across visits
  const [showName, setShowName] = useState(false);     // big "my name" overlay
  const [showLang, setShowLang] = useState(false);     // language chooser overlay
  const [sentence, setSentence] = useState([]);      // array of symbol ids
  const [personalFreq, setPersonalFreq] = usePersistentState("sira.freq", {});      // overall usage
  const [todFreq, setTodFreq] = usePersistentState("sira.todFreq", {});             // usage per time of day
  const [recent, setRecent] = useState([]);
  const [hour, setHour] = useState(new Date().getHours());
  const [activeCat, setActiveCat] = useState("all");
  const [showPredInfo, setShowPredInfo] = useState(false);

  // keep the time of day current (drives time-aware prediction)
  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(id);
  }, []);

  // SOS (emergency phrases, set up by a guardian — saved on the device)
  const [sosPhrases, setSosPhrases] = usePersistentState("sira.sos", DEFAULT_SOS);
  const [sosPin, setSosPin] = usePersistentState("sira.pin", "");  // guardian PIN ("" = not set)
  const [showSOS, setShowSOS] = useState(false);
  const [sosView, setSosView] = useState("phrases"); // "phrases" | "pin" | "edit"
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [clearedSentence, setClearedSentence] = useState(null); // for Undo after Clear

  // Switch-scanning accessibility (single-switch row/column access)
  const [scanOn, setScanOn] = usePersistentState("sira.scan", false);
  const [dwellMs, setDwellMs] = usePersistentState("sira.dwell", 1500);
  useSwitchScanning(langChosen && scanOn, dwellMs);

  // Close any open overlay with the Escape key (basic dialog behaviour).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (showSOS) closeSOS();
      else if (showName) setShowName(false);
      else if (showLang) setShowLang(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const field = LANGUAGES[lang].field;
  const tod = timeOfDay(hour);

  // Languages the local Mac `say` bridge (serve.py) can speak, if reachable.
  const [serverLangs, setServerLangs] = useState(null);
  useEffect(() => {
    fetch("/sayvoices")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d.langs)) setServerLangs(d.langs); })
      .catch(() => {});
  }, []);

  // Can the current language be spoken — by the Mac bridge or a browser voice?
  const voiceReady = useMemo(() => {
    if (serverLangs) return serverLangs.includes(lang) || !!pickVoice(lang, voices);
    return voices.length === 0 || !!pickVoice(lang, voices);
  }, [lang, voices, serverLangs]);

  // live prediction — n-gram, re-ranked by time-of-day priors, recency,
  // overall usage, and what this child usually asks at this time of day.
  const predictions = useMemo(() => {
    const raw = ngramScores(model, sentence);
    const ranked = rerank(raw, { tod, recent, personalFreq, todFreq });
    return topPredictions(ranked, 6, sentence.slice(-1));
  }, [model, sentence, tod, recent, personalFreq, todFreq]);

  const addSymbol = (id) => {
    setClearedSentence(null); // a new tap supersedes any undo
    setSentence((s) => [...s, id]);
    setRecent((r) => [...r, id].slice(-12));
    setPersonalFreq((f) => ({ ...f, [id]: (f[id] || 0) + 1 }));
    // learn what they ask at this time of day
    setTodFreq((tf) => {
      const bucket = { ...(tf[tod] || {}) };
      bucket[id] = (bucket[id] || 0) + 1;
      return { ...tf, [tod]: bucket };
    });
    const sym = SYMBOL_BY_ID[id];
    if (sym) speak(sym[field], lang, voices); // speak each tapped word
  };

  // Speak an emergency phrase in its chosen language (translated text + voice).
  const speakSos = (phrase) => speak(sosText(phrase), phrase.lang || lang, voices);

  // One-time upgrade of any previously-saved phrases so they translate.
  useEffect(() => { setSosPhrases((arr) => withSosIds(arr)); }, []);

  const speakSentence = () => {
    if (!sentence.length) return;
    const text = sentence.map((id) => SYMBOL_BY_ID[id][field]).join(" ");
    speak(text, lang, voices);
  };

  const backspace = () => { setClearedSentence(null); setSentence((s) => s.slice(0, -1)); };
  const clearAll = () => {
    if (sentence.length) setClearedSentence(sentence); // keep a copy so Clear is undoable
    setSentence([]);
  };
  const undoClear = () => {
    if (clearedSentence) { setSentence(clearedSentence); setClearedSentence(null); }
  };

  // SOS open/close + guardian PIN gate
  const openSOS = () => { setShowSOS(true); setSosView("phrases"); };
  const closeSOS = () => { setShowSOS(false); setSosView("phrases"); setPinInput(""); setPinError(""); };
  const openGuardian = () => { setPinInput(""); setPinError(""); setSosView("pin"); };
  const submitPin = () => {
    if (!sosPin) {                                   // first time — create a PIN
      if (pinInput.length >= 4) { setSosPin(pinInput); setSosView("edit"); }
      else setPinError("Choose a PIN of at least 4 digits.");
    } else if (pinInput === sosPin) {                // unlock
      setSosView("edit");
    } else {
      setPinError("Incorrect PIN.");
    }
  };

  const chooseLang = (k) => {
    setLang(k);
    setLangChosen(true);
  };

  const visibleSymbols =
    activeCat === "all" ? SYMBOLS : SYMBOLS.filter((s) => s.cat === activeCat);

  /* ---- Language picker screen (shown first) ---- */
  if (!langChosen) {
    return (
      <div style={st.pickerPage}>
        <style>{globalCss}</style>
        <div style={st.pickerCard}>
          <div style={st.pickerLogo}><Logo size={72} /></div>
          <h1 style={st.pickerBrand}>Sira</h1>

          <div style={st.nameField}>
            <label style={st.nameLabel} htmlFor="childName">Your name</label>
            <input
              id="childName"
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Type your name"
              style={st.nameInput}
            />
          </div>

          <h2 style={st.pickerTitle}>Choose a language</h2>
          <div style={st.pickerGrid}>
            {Object.entries(LANGUAGES).map(([k, v]) => (
              <button key={k} onClick={() => chooseLang(k)} className="tile-press lang-tile" style={st.pickerTile}>
                <span style={st.pickerNative}>{v.native}</span>
                <span style={st.pickerLabel}>{v.label}</span>
              </button>
            ))}
          </div>
          <p style={st.pickerHint}>You can switch languages anytime from the top bar.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={st.page} id="scan-root">
      <style>{globalCss}</style>

      {/* Header */}
      <header style={st.header}>
        <div style={st.brandRow}>
          <Logo size={44} />
          <div>
            <h1 style={st.title}>Sira</h1>
            <p style={st.subtitle}>Tap · Talk · Connect</p>
          </div>
        </div>
        <div style={st.headerRight}>
          <button
            style={st.sosBtn}
            className="sos-btn"
            onClick={openSOS}
            aria-label="Emergency phrases"
            title="Emergency"
          >
            <Om ch="🆘" size={20} style={{ marginRight: 6 }} />
            SOS
          </button>
          {childName.trim() && (
            <button
              style={st.nameChip}
              onClick={() => { setShowName(true); speak(childName.trim(), lang, voices); }}
              title="Show my name"
            >
              <Om ch="👤" size={18} style={{ marginRight: 6 }} />
              <span style={st.nameChipText}>{childName.trim()}</span>
            </button>
          )}
          <button
            style={st.langBtn}
            onClick={() => setShowLang(true)}
            aria-label="Change language"
            title="Change language"
          >
            <Om ch="🌐" size={16} style={{ marginRight: 6 }} />
            {LANGUAGES[lang].native}
            <span style={st.langBtnCaret}>▾</span>
          </button>
        </div>
      </header>

      {/* Language chooser — buttons so it works with switch scanning too */}
      {showLang && (
        <div style={st.langOverlay} onClick={() => setShowLang(false)}>
          <div
            style={st.langCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Choose a language"
          >
            <div style={st.langCardHead}>
              <span style={st.langCardTitle}>Choose a language</span>
              <button style={st.sosCloseBtn} onClick={() => setShowLang(false)} aria-label="Close">✕</button>
            </div>
            <div style={st.langCardGrid}>
              {Object.entries(LANGUAGES).map(([k, v]) => (
                <button
                  key={k}
                  className="tile-press lang-tile"
                  style={{ ...st.pickerTile, ...(k === lang ? { borderColor: ACCENT, borderWidth: 2 } : {}) }}
                  onClick={() => { setLang(k); setShowLang(false); }}
                >
                  <span style={st.pickerNative}>{v.native}</span>
                  <span style={st.pickerLabel}>{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOS overlay — large emergency phrases; guardian (PIN) can set them up */}
      {showSOS && (
        <div style={st.sosOverlay} onClick={closeSOS}>
          <div
            style={st.sosCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Emergency phrases"
          >
            <div style={st.sosHead}>
              <span style={st.sosTitle}><Om ch="🆘" size={26} style={{ marginRight: 8 }} /> Emergency</span>
              <div style={{ display: "flex", gap: 8 }}>
                {sosView === "phrases" && (
                  <button style={st.sosSetupBtn} onClick={openGuardian}>⚙ Guardian setup</button>
                )}
                {sosView === "edit" && (
                  <button style={st.sosSetupBtn} onClick={() => setSosView("phrases")}>Done</button>
                )}
                {sosView === "pin" && (
                  <button style={st.sosSetupBtn} onClick={() => setSosView("phrases")}>Cancel</button>
                )}
                <button style={st.sosCloseBtn} onClick={closeSOS} aria-label="Close">✕</button>
              </div>
            </div>

            {sosView === "phrases" && (
              /* EMERGENCY MODE — tap a phrase to say it loudly */
              <div style={st.sosGrid}>
                {sosPhrases.length === 0 && (
                  <p style={st.sosEmpty}>No phrases yet. Tap “Guardian setup” to add some.</p>
                )}
                {sosPhrases.map((p, i) => (
                  <button key={i} style={st.sosPhrase} className="tile-press" lang={p.lang || lang} onClick={() => speakSos(p)}>
                    <Om ch="🔊" size={22} style={{ marginRight: 10, flexShrink: 0 }} />
                    <span>{sosText(p)}</span>
                  </button>
                ))}
              </div>
            )}

            {sosView === "pin" && (
              /* GUARDIAN GATE — enter (or first-time create) a PIN */
              <div style={st.pinWrap}>
                <p style={st.sosEditHint}>
                  {sosPin
                    ? "Enter the guardian PIN to edit emergency phrases."
                    : "Set a guardian PIN (4+ digits) to protect the emergency phrases."}
                </p>
                <input
                  style={st.pinInput}
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={pinInput}
                  placeholder="••••"
                  onChange={(e) => { setPinInput(e.target.value); setPinError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") submitPin(); }}
                />
                {pinError && <p style={st.pinError}>{pinError}</p>}
                <button style={st.pinSubmit} onClick={submitPin}>
                  {sosPin ? "Unlock" : "Set PIN & continue"}
                </button>
              </div>
            )}

            {sosView === "edit" && (
              /* GUARDIAN SETUP — add / edit / remove phrases */
              <div style={st.sosEditWrap}>
                <p style={st.sosEditHint}>
                  Add short emergency sentences. Pick the language each one should be spoken in.
                </p>
                {sosPhrases.map((p, i) => (
                  <div key={i} style={st.sosEditRow}>
                    <input
                      style={st.sosEditInput}
                      value={sosText(p)}
                      placeholder="Emergency sentence"
                      lang={p.lang || lang}
                      aria-label={"Emergency phrase " + (i + 1)}
                      onChange={(e) =>
                        // editing the text makes it a custom phrase (drops the built-in translation)
                        setSosPhrases((arr) => arr.map((x, j) => (j === i ? { text: e.target.value, lang: x.lang || lang } : x)))
                      }
                    />
                    <select
                      style={st.sosEditSelect}
                      value={p.lang || lang}
                      aria-label="Phrase language"
                      onChange={(e) =>
                        // for built-ins this re-translates; for custom it changes only the voice
                        setSosPhrases((arr) => arr.map((x, j) => (j === i ? { ...x, lang: e.target.value } : x)))
                      }
                    >
                      {Object.entries(LANGUAGES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <button style={st.sosTestBtn} title="Test" aria-label="Test phrase" onClick={() => speakSos(p)}>
                      <Om ch="🔊" size={18} />
                    </button>
                    <button
                      style={st.sosDelBtn}
                      title="Remove"
                      aria-label="Remove phrase"
                      onClick={() => setSosPhrases((arr) => arr.filter((_, j) => j !== i))}
                    >
                      <Om ch="🗑️" size={18} />
                    </button>
                  </div>
                ))}
                <button
                  style={st.sosAddBtn}
                  onClick={() => setSosPhrases((arr) => [...arr, { text: "", lang }])}
                >
                  ＋ Add phrase
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice-not-installed notice */}
      {!voiceReady && (
        <div style={st.voiceWarn}>
          <Om ch="🔇" size={18} style={{ marginRight: 8, flexShrink: 0 }} />
          <span>
            No <b>{LANGUAGES[lang].label}</b> speech voice is installed on this device, so taps won’t be
            spoken aloud. Symbols and text still work. On Mac: <b>System Settings → Accessibility → Spoken
            Content → System Voice → Manage Voices</b>, then download {LANGUAGES[lang].label}.
          </span>
        </div>
      )}

      {/* "My name" overlay — for when someone asks the child their name */}
      {showName && (
        <div style={st.nameOverlay} onClick={() => setShowName(false)}>
          <div
            style={st.nameOverlayCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="My name"
          >
            <span style={st.nameOverlayLabel}>My name is</span>
            <span style={st.nameOverlayName}>{childName.trim()}</span>
            <div style={st.nameOverlayActions}>
              <button
                style={st.nameOverlaySpeak}
                onClick={() => speak(childName.trim(), lang, voices)}
              >
                <Om ch="🔊" size={20} style={{ marginRight: 8 }} /> Speak
              </button>
              <button style={st.nameOverlayClose} onClick={() => setShowName(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sentence strip */}
      <section style={st.sentenceBar}>
        <div style={st.sentenceScroll} lang={field}>
          {sentence.length === 0 ? (
            <span style={st.placeholder}>Tap symbols to build a sentence</span>
          ) : (
            sentence.map((id, i) => {
              const s = SYMBOL_BY_ID[id];
              return (
                <div key={i} style={st.sentChip}>
                  <Om ch={s.glyph} size={28} />
                  <span style={st.sentWord}>{s[field]}</span>
                </div>
              );
            })
          )}
        </div>
        <div style={st.sentActions}>
          {clearedSentence && !sentence.length && (
            <button onClick={undoClear} style={st.undoBtn} title="Undo clear" aria-label="Undo clear">↩ Undo</button>
          )}
          <button onClick={backspace} style={st.iconBtn} title="Delete last" aria-label="Delete last word" disabled={!sentence.length}><Om ch="⬅️" size={22} /></button>
          <button onClick={clearAll} style={st.iconBtn} title="Clear" aria-label="Clear sentence" disabled={!sentence.length}><Om ch="🗑️" size={22} /></button>
          <button onClick={speakSentence} style={st.speakBtn} aria-label="Speak sentence" disabled={!sentence.length}>
            <Om ch="🔊" size={20} style={{ marginRight: 8 }} /> Speak
          </button>
        </div>
      </section>

      {/* Prediction row */}
      <section style={st.predSection}>
        <div style={st.predHead}>
          <span style={st.predLabel}>
            Suggested next
            <button style={st.infoBtn} onClick={() => setShowPredInfo((v) => !v)}>?</button>
          </span>
          <span style={st.todTag}><Om ch="🕒" size={15} style={{ marginRight: 5 }} /> {tod}</span>
        </div>
        {showPredInfo && (
          <div style={st.infoBox}>
            Predictions come from an N-gram model trained on AAC sentence frames, then
            re-ranked by time of day, recency, and this child's own usage. Keep tapping
            and the order adapts to the child.
          </div>
        )}
        <div style={st.predRow} lang={field}>
          {predictions.map((id) => {
            const s = SYMBOL_BY_ID[id];
            return (
              <button key={id} onClick={() => addSymbol(id)} style={st.predTile}>
                <Om ch={s.glyph} size={32} />
                <span style={st.predWord}>{s[field]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Category filter */}
      <div style={st.catRow}>
        <button
          onClick={() => setActiveCat("all")}
          style={{ ...st.catChip, ...(activeCat === "all" ? st.catChipActive : {}) }}
        >
          All
        </button>
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setActiveCat(k)}
            style={{
              ...st.catChip,
              ...(activeCat === k ? { ...st.catChipActive, background: v.color, borderColor: v.color } : {}),
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Main board */}
      <section style={st.board} lang={field}>
        {visibleSymbols.map((s) => (
          <button
            key={s.id}
            onClick={() => addSymbol(s.id)}
            style={{ ...st.tile, borderColor: CATEGORIES[s.cat].color }}
          >
            <span style={{ ...st.tileBar, background: CATEGORIES[s.cat].color }} />
            <Om ch={s.glyph} size={44} style={st.tileGlyph} />
            <span style={st.tileWord}>{s[field]}</span>
            {field !== "en" && <span style={st.tileEn}>{s.en}</span>}
          </button>
        ))}
      </section>

      {/* Time simulator + personalization peek */}
      <footer style={st.footer}>
        <div style={st.footBlock}>
          <label style={st.footLabel}>Time of day (adapts predictions)</label>
          <span style={st.footValue}>{String(hour).padStart(2, "0")}:00 · {tod}</span>
        </div>
        <div style={st.footBlock}>
          <label style={st.footLabel}>Switch scanning (accessibility)</label>
          <label style={st.scanToggle}>
            <input type="checkbox" checked={scanOn} onChange={(e) => setScanOn(e.target.checked)} />
            Enable single-switch scanning
          </label>
          {scanOn && (
            <>
              <input
                type="range" min="600" max="4000" step="100" value={dwellMs}
                onChange={(e) => setDwellMs(Number(e.target.value))}
                style={st.slider} aria-label="Scan speed"
              />
              <span style={st.footValue}>
                {(dwellMs / 1000).toFixed(1)}s per step · press <b>Space</b> or <b>Enter</b> to select
              </span>
            </>
          )}
        </div>
        <div style={st.footBlock}>
          <label style={st.footLabel}>Child's top used symbols (learned live)</label>
          <div style={st.freqRow}>
            {Object.entries(personalFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, c]) => (
              <span key={id} style={st.freqPill}><Om ch={SYMBOL_BY_ID[id].glyph} size={18} style={{ marginRight: 4 }} /> {c}</span>
            ))}
            {Object.keys(personalFreq).length === 0 && (
              <span style={st.freqEmpty}>Nothing yet. Start tapping.</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   STYLES
---------------------------------------------------------------------------- */
const ACCENT  = "#2563EB"; // Deep Blue — primary / navigation / main actions
const ACCENT2 = "#3B82F6"; // lighter blue for gradients
const TEAL    = "#0F766E"; // Teal — communication / Speak
const INK     = "#374151"; // neutral text
const MUTED   = "#6B7280"; // secondary text
const LINE    = "#E5E7EB"; // hairline borders
const PAPER   = "#F3F4F6"; // neutral gray background
const SOS_RED = "#DC2626"; // emergency

const globalCss = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${PAPER}; font-family: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  button { font-family: inherit; cursor: pointer; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  button:focus-visible { outline: 3px solid ${ACCENT}; outline-offset: 2px; }
  .tile-press:active { transform: scale(0.96); }
  .sos-btn:hover { filter: brightness(1.06); }
  /* switch-scanning highlight (one box at a time) */
  .scan-item { outline: 5px solid #2563EB !important; outline-offset: 2px; box-shadow: 0 0 0 3px rgba(37,99,235,0.25) !important; }
  .lang-tile { transition: border-color 0.15s, box-shadow 0.15s, transform 0.12s; }
  .lang-tile:hover {
    border-color: ${ACCENT};
    box-shadow: 0 6px 18px rgba(37,99,235,0.14);
    transform: translateY(-3px);
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

const CARD_SHADOW = "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)";

const st = {
  page: {
    minHeight: "100vh", background: PAPER, color: INK,
    fontFamily: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif",
    maxWidth: 1100, margin: "0 auto", padding: "16px 16px 40px",
  },

  /* Language picker screen — clean white landing */
  pickerPage: {
    minHeight: "100vh", color: INK,
    fontFamily: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif",
    background: "#FFFFFF",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  },
  pickerCard: {
    width: "100%", maxWidth: 880, background: "#fff",
    padding: "8px 4px 24px", textAlign: "center",
  },
  pickerLogo: { display: "inline-block", marginBottom: 4 },
  pickerBrand: { margin: "8px 0 4px", fontSize: 48, fontWeight: 700, color: ACCENT, letterSpacing: "-2px" },

  nameField: { maxWidth: 380, margin: "18px auto 34px", textAlign: "left" },
  nameLabel: { display: "block", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: MUTED, marginBottom: 6 },
  nameInput: { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 16, fontWeight: 700, fontFamily: "inherit", color: INK, background: "#fff", border: `1.5px solid ${LINE}`, borderRadius: 8, outline: "none" },

  pickerTitle: { margin: "0 0 22px", fontSize: 40, fontWeight: 700, color: INK, letterSpacing: "-1px" },
  pickerGrid: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: 680, margin: "0 auto" },
  pickerTile: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
    width: 150, minHeight: 96, padding: "16px 8px", borderRadius: 10, border: `1.5px solid ${LINE}`,
    background: "#fff",
  },
  pickerNative: { fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.15 },
  pickerLabel: { fontSize: 13, fontWeight: 500, color: MUTED, letterSpacing: "0.2px" },
  pickerHint: { margin: "26px 0 0", fontSize: 13, color: "#9CA3AF", fontWeight: 600 },

  voiceWarn: { display: "flex", alignItems: "flex-start", gap: 2, background: "#FFFBEB", border: "1.5px solid #FDE68A", color: "#92400E", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 },

  /* Header name chip + "my name" overlay */
  headerRight: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  nameChip: { display: "flex", alignItems: "center", background: "#EFF6FF", border: `1.5px solid #BFDBFE`, borderRadius: 8, padding: "8px 14px" },
  nameChipText: { fontSize: 16, fontWeight: 900, color: ACCENT, letterSpacing: "-0.2px" },
  nameOverlay: { position: "fixed", inset: 0, background: "rgba(17,24,39,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 50 },
  nameOverlayCard: { background: "#fff", borderRadius: 12, padding: "40px 48px", textAlign: "center", maxWidth: 640, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.30)" },
  nameOverlayLabel: { display: "block", fontSize: 18, fontWeight: 700, color: MUTED, marginBottom: 8 },
  nameOverlayName: { display: "block", fontSize: 88, fontWeight: 700, color: ACCENT, letterSpacing: "-3px", lineHeight: 1.05, wordBreak: "break-word" },
  nameOverlayActions: { display: "flex", gap: 10, justifyContent: "center", marginTop: 28 },
  nameOverlaySpeak: { display: "flex", alignItems: "center", height: 48, padding: "0 24px", borderRadius: 8, border: "none", background: TEAL, color: "#fff", fontWeight: 800, fontSize: 17, boxShadow: "0 4px 10px rgba(15,118,110,0.30)" },
  nameOverlayClose: { height: 48, padding: "0 24px", borderRadius: 8, border: `1.5px solid ${LINE}`, background: "#fff", color: INK, fontWeight: 800, fontSize: 17 },

  /* SOS button + overlay */
  sosBtn: { display: "flex", alignItems: "center", height: 40, padding: "0 16px", borderRadius: 8, border: "none", background: SOS_RED, color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: "0.5px", boxShadow: "0 4px 10px rgba(220,38,38,0.35)" },
  sosOverlay: { position: "fixed", inset: 0, background: "rgba(127,29,29,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 },
  sosCard: { background: "#fff", borderRadius: 12, padding: 20, width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", borderTop: `6px solid ${SOS_RED}` },
  sosHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sosTitle: { display: "flex", alignItems: "center", fontSize: 24, fontWeight: 900, color: SOS_RED, letterSpacing: "-0.5px" },
  sosSetupBtn: { height: 38, padding: "0 14px", borderRadius: 8, border: `1.5px solid ${LINE}`, background: "#fff", color: INK, fontWeight: 700, fontSize: 14 },
  sosCloseBtn: { width: 38, height: 38, borderRadius: 8, border: `1.5px solid ${LINE}`, background: "#fff", color: INK, fontWeight: 900, fontSize: 16 },
  sosGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  sosEmpty: { gridColumn: "1 / -1", color: MUTED, fontWeight: 600, textAlign: "center", padding: "20px 0" },
  sosPhrase: { display: "flex", alignItems: "center", textAlign: "left", padding: "20px 18px", borderRadius: 10, border: `2px solid ${SOS_RED}`, background: "#FEF2F2", color: "#7F1D1D", fontWeight: 800, fontSize: 19, lineHeight: 1.25 },
  sosEditWrap: { display: "flex", flexDirection: "column", gap: 10 },
  sosEditHint: { margin: 0, fontSize: 13.5, color: MUTED, fontWeight: 600 },
  sosEditRow: { display: "flex", gap: 8, alignItems: "center" },
  sosEditInput: { flex: 1, minWidth: 0, padding: "10px 12px", fontSize: 15, fontFamily: "inherit", fontWeight: 600, color: INK, border: `1.5px solid ${LINE}`, borderRadius: 8, outline: "none" },
  sosEditSelect: { padding: "10px 8px", fontSize: 14, fontFamily: "inherit", fontWeight: 700, color: INK, border: `1.5px solid ${LINE}`, borderRadius: 8, background: "#fff" },
  sosTestBtn: { width: 40, height: 40, flexShrink: 0, borderRadius: 8, border: `1.5px solid ${LINE}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  sosDelBtn: { width: 40, height: 40, flexShrink: 0, borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" },
  sosAddBtn: { marginTop: 4, height: 44, borderRadius: 8, border: `2px dashed ${SOS_RED}`, background: "#FEF2F2", color: SOS_RED, fontWeight: 800, fontSize: 15 },
  pinWrap: { display: "flex", flexDirection: "column", gap: 12, alignItems: "stretch", maxWidth: 320, margin: "0 auto", padding: "12px 0" },
  pinInput: { height: 52, textAlign: "center", letterSpacing: "8px", fontSize: 24, fontWeight: 800, fontFamily: "inherit", color: INK, border: `1.5px solid ${LINE}`, borderRadius: 10, outline: "none" },
  pinError: { margin: 0, color: SOS_RED, fontWeight: 700, fontSize: 14, textAlign: "center" },
  pinSubmit: { height: 48, borderRadius: 8, border: "none", background: ACCENT, color: "#fff", fontWeight: 800, fontSize: 16 },

  undoBtn: { height: 44, padding: "0 16px", borderRadius: 8, border: `1.5px solid ${ACCENT}`, background: "#EFF6FF", color: ACCENT, fontWeight: 800, fontSize: 15 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14, background: "#fff", borderRadius: 8, padding: "12px 16px", border: `1px solid ${LINE}`, boxShadow: CARD_SHADOW },
  brandRow: { display: "flex", alignItems: "center", gap: 12 },
  title: { margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: "-1.5px", color: ACCENT },
  subtitle: { margin: 0, fontSize: 13, color: MUTED, fontWeight: 500, letterSpacing: "0.4px" },

  langBtn: { display: "inline-flex", alignItems: "center", height: 44, padding: "0 14px", borderRadius: 6, border: `1px solid ${LINE}`, background: "#fff", color: INK, fontFamily: "inherit", fontWeight: 800, fontSize: 15 },
  langBtnCaret: { marginLeft: 8, color: ACCENT, fontSize: 12, fontWeight: 900 },
  langOverlay: { position: "fixed", inset: 0, background: "rgba(17,24,39,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 55 },
  langCard: { background: "#fff", borderRadius: 12, padding: 20, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.30)" },
  langCardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  langCardTitle: { fontSize: 22, fontWeight: 900, color: INK, letterSpacing: "-0.5px" },
  langCardGrid: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 },

  sentenceBar: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 8, padding: 12, marginBottom: 14, boxShadow: CARD_SHADOW },
  sentenceScroll: { flex: 1, display: "flex", gap: 8, overflowX: "auto", minHeight: 64, alignItems: "center" },
  placeholder: { color: "#6B7280", fontWeight: 600, fontSize: 15, paddingLeft: 6 },
  sentChip: { display: "flex", flexDirection: "column", alignItems: "center", background: PAPER, borderRadius: 8, padding: "6px 12px", minWidth: 62 },
  sentWord: { fontSize: 13, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap" },
  sentActions: { display: "flex", gap: 6, alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  speakBtn: { display: "flex", alignItems: "center", height: 44, padding: "0 20px", borderRadius: 8, border: "none", background: TEAL, color: "#fff", fontWeight: 800, fontSize: 16, boxShadow: "0 4px 10px rgba(15,118,110,0.30)" },

  predSection: { marginBottom: 16 },
  predHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  predLabel: { fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: MUTED, display: "flex", alignItems: "center", gap: 6 },
  infoBtn: { width: 28, height: 28, borderRadius: 999, border: "none", background: "#DBEAFE", color: ACCENT, fontSize: 14, fontWeight: 900, lineHeight: 1 },
  infoBox: { background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#1E3A8A", marginBottom: 10, lineHeight: 1.5 },
  todTag: { display: "flex", alignItems: "center", fontSize: 13, fontWeight: 700, color: TEAL, background: "#CCFBF1", padding: "4px 10px", borderRadius: 6 },
  predRow: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 },
  predTile: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 6px", borderRadius: 8, border: `1.5px dashed ${ACCENT}`, background: "#EFF6FF", transition: "transform 0.08s" },
  predWord: { fontSize: 14, fontWeight: 800, textAlign: "center", color: INK },

  catRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  catChip: { display: "inline-flex", alignItems: "center", height: 44, padding: "0 16px", borderRadius: 6, border: `1px solid ${LINE}`, background: "#fff", fontWeight: 700, fontSize: 15, color: INK },
  catChipActive: { background: ACCENT, color: "#fff", borderColor: ACCENT },

  board: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 10, marginBottom: 22 },
  tile: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "18px 6px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", overflow: "hidden", transition: "transform 0.08s", boxShadow: CARD_SHADOW },
  tileBar: { position: "absolute", top: 0, left: 0, right: 0, height: 5 },
  tileGlyph: { marginTop: 2 },
  tileWord: { fontSize: 18, fontWeight: 700, textAlign: "center", marginTop: 6, color: INK },
  tileEn: { fontSize: 11, color: "#6B7280", fontWeight: 600 },

  footer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 8, padding: 16, boxShadow: CARD_SHADOW },
  scanToggle: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: INK },
  footBlock: { display: "flex", flexDirection: "column", gap: 8 },
  footLabel: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: MUTED },
  slider: { width: "100%", accentColor: ACCENT },
  footValue: { fontSize: 14, fontWeight: 700, color: ACCENT },
  freqRow: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" },
  freqPill: { display: "flex", alignItems: "center", background: PAPER, borderRadius: 6, padding: "4px 10px", fontSize: 14, fontWeight: 700 },
  freqEmpty: { color: "#9CA3AF", fontSize: 14, fontWeight: 600 },
};