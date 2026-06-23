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
  { id: "i",       glyph: "🧒", cat: "people",  en: "I",      ta: "நான்",     te: "నేను",     hi: "मैं",   bn: "আমি",    mr: "मी" },
  { id: "you",     glyph: "🫵", cat: "people",  en: "you",    ta: "நீ",       te: "నువ్వు",   hi: "तुम",   bn: "তুমি",   mr: "तू" },
  { id: "amma",    glyph: "👩", cat: "people",  en: "mother", ta: "அம்மா",    te: "అమ్మ",     hi: "माँ",   bn: "মা",     mr: "आई" },
  { id: "appa",    glyph: "👨", cat: "people",  en: "father", ta: "அப்பா",    te: "నాన్న",    hi: "पापा",  bn: "বাবা",   mr: "बाबा" },
  { id: "teacher", glyph: "🧑‍🏫", cat: "people", en: "teacher", ta: "ஆசிரியர்", te: "టీచర్",   hi: "टीचर",  bn: "শিক্ষক",  mr: "शिक्षक" },
  // Actions
  { id: "want",    glyph: "🙌", cat: "actions", en: "want",   ta: "வேண்டும்", te: "కావాలి",   hi: "चाहिए", bn: "চাই",    mr: "हवं" },
  { id: "go",      glyph: "🚶", cat: "actions", en: "go",     ta: "போக",      te: "వెళ్ళు",   hi: "जाना",  bn: "যাওয়া",  mr: "जाणे" },
  { id: "eat",     glyph: "🍽️", cat: "actions", en: "eat",    ta: "சாப்பிட",  te: "తిను",     hi: "खाना",  bn: "খাওয়া",  mr: "खाणे" },
  { id: "drink",   glyph: "🥤", cat: "actions", en: "drink",  ta: "குடிக்க",  te: "తాగు",     hi: "पीना",  bn: "পান করা", mr: "पिणे" },
  { id: "play",    glyph: "🧸", cat: "actions", en: "play",   ta: "விளையாட", te: "ఆడు",      hi: "खेलना", bn: "খেলা",   mr: "खेळणे" },
  { id: "sleep",   glyph: "😴", cat: "actions", en: "sleep",  ta: "தூங்க",    te: "నిద్ర",    hi: "सोना",  bn: "ঘুম",     mr: "झोपणे" },
  { id: "stop",    glyph: "✋", cat: "actions", en: "stop",   ta: "நிறுத்து", te: "ఆపు",      hi: "रुको",  bn: "থামো",   mr: "थांब" },
  { id: "more",    glyph: "➕", cat: "actions", en: "more",   ta: "மேலும்",   te: "ఇంకా",     hi: "और",    bn: "আরও",    mr: "अजून" },
  { id: "help",    glyph: "🆘", cat: "actions", en: "help",   ta: "உதவி",     te: "సహాయం",   hi: "मदद",   bn: "সাহায্য",  mr: "मदत" },
  // Objects
  { id: "water",   glyph: "💧", cat: "objects", en: "water",  ta: "தண்ணீர்",  te: "నీళ్ళు",   hi: "पानी",  bn: "জল",     mr: "पाणी" },
  { id: "food",    glyph: "🍚", cat: "objects", en: "food",   ta: "உணவு",     te: "అన్నం",    hi: "खाना",  bn: "খাবার",  mr: "जेवण" },
  { id: "milk",    glyph: "🥛", cat: "objects", en: "milk",   ta: "பால்",     te: "పాలు",     hi: "दूध",   bn: "দুধ",     mr: "दूध" },
  { id: "toilet",  glyph: "🚽", cat: "objects", en: "toilet", ta: "கழிப்பறை", te: "టాయిలెట్", hi: "टॉयलेट", bn: "টয়লেট",  mr: "टॉयलेट" },
  { id: "school",  glyph: "🏫", cat: "objects", en: "school", ta: "பள்ளி",    te: "స్కూల్",   hi: "स्कूल",  bn: "স্কুল",   mr: "शाळा" },
  { id: "home",    glyph: "🏠", cat: "objects", en: "home",   ta: "வீடு",     te: "ఇల్లు",    hi: "घर",    bn: "বাড়ি",   mr: "घर" },
  { id: "toy",     glyph: "🪀", cat: "objects", en: "toy",    ta: "பொம்மை",   te: "ఆటబొమ్మ",  hi: "खिलौना", bn: "খেলনা",  mr: "खेळणं" },
  { id: "book",    glyph: "📖", cat: "objects", en: "book",   ta: "புத்தகம்", te: "పుస్తకం",  hi: "किताब", bn: "বই",     mr: "पुस्तक" },
  // Feelings
  { id: "happy",   glyph: "😊", cat: "feelings", en: "happy", ta: "மகிழ்ச்சி", te: "సంతోషం",  hi: "खुश",   bn: "খুশি",   mr: "आनंदी" },
  { id: "sad",     glyph: "😢", cat: "feelings", en: "sad",   ta: "சோகம்",    te: "బాధ",      hi: "दुखी",  bn: "দুঃখ",   mr: "दुःखी" },
  { id: "hungry",  glyph: "🤤", cat: "feelings", en: "hungry", ta: "பசி",     te: "ఆకలి",     hi: "भूख",   bn: "ক্ষুধা",  mr: "भूक" },
  { id: "tired",   glyph: "🥱", cat: "feelings", en: "tired", ta: "சோர்வு",   te: "అలసట",     hi: "थका",   bn: "ক্লান্ত",  mr: "थकलो" },
  { id: "pain",    glyph: "🤕", cat: "feelings", en: "pain",  ta: "வலி",      te: "నొప్పి",   hi: "दर्द",  bn: "ব্যথা",   mr: "वेदना" },
  // Social
  { id: "yes",     glyph: "✅", cat: "social",  en: "yes",    ta: "ஆம்",      te: "అవును",    hi: "हाँ",   bn: "হ্যাঁ",   mr: "हो" },
  { id: "no",      glyph: "❌", cat: "social",  en: "no",     ta: "இல்லை",    te: "కాదు",     hi: "नहीं",  bn: "না",     mr: "नाही" },
  { id: "thanks",  glyph: "🙏", cat: "social",  en: "thank you", ta: "நன்றி", te: "ధన్యవాదాలు", hi: "धन्यवाद", bn: "ধন্যবাদ", mr: "धन्यवाद" },
  { id: "hello",   glyph: "👋", cat: "social",  en: "hello",  ta: "வணக்கம்",  te: "నమస్తే",   hi: "नमस्ते", bn: "নমস্কার", mr: "नमस्कार" },
];

const SYMBOL_BY_ID = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));

const CATEGORIES = {
  people:   { label: "People",   color: "#F2C14E" },
  actions:  { label: "Actions",  color: "#7FB069" },
  objects:  { label: "Things",   color: "#6EC6CA" },
  feelings: { label: "Feelings", color: "#E8836F" },
  social:   { label: "Social",   color: "#B58DB6" },
};

const LANGUAGES = {
  en: { label: "English", native: "English", field: "en", flag: "🌐", voice: ["en-IN", "en-US", "en-GB", "en"] },
  ta: { label: "தமிழ்",   native: "தமிழ்",   field: "ta", flag: "🇮🇳", voice: ["ta-IN", "ta"] },
  hi: { label: "हिन्दी",  native: "हिन्दी",  field: "hi", flag: "🇮🇳", voice: ["hi-IN", "hi"] },
  te: { label: "Telugu",  native: "తెలుగు",  field: "te", flag: "🇮🇳", voice: ["te-IN", "te"] },
  bn: { label: "Bengali", native: "বাংলা",   field: "bn", flag: "🇮🇳", voice: ["bn-IN", "bn-BD", "bn"] },
  mr: { label: "Marathi", native: "मराठी",   field: "mr", flag: "🇮🇳", voice: ["mr-IN", "mr"] },
};

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

function rerank(rawScores, { tod, recent, personalFreq }) {
  const out = {};
  const recentSet = new Set(recent.slice(-4));
  const timeMap = TIME_BOOSTS[tod] || {};
  const personalTotal = Object.values(personalFreq).reduce((a, b) => a + b, 0) || 1;
  for (const [tok, base] of Object.entries(rawScores)) {
    let s = base;
    if (timeMap[tok]) s *= timeMap[tok];                       // time of day
    if (recentSet.has(tok)) s *= 1.25;                         // recency
    const pf = (personalFreq[tok] || 0) / personalTotal;       // personalization
    s *= 1 + pf * 2.5;
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
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() || []);
    load();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = load;
  }, []);
  return voices;
}

function speak(text, langKey, voices) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const prefs = LANGUAGES[langKey].voice;
  let chosen = null;
  for (const p of prefs) {
    chosen = voices.find((v) => v.lang?.toLowerCase().startsWith(p.toLowerCase()));
    if (chosen) break;
  }
  if (chosen) { u.voice = chosen; u.lang = chosen.lang; }
  else { u.lang = prefs[0]; }
  u.rate = 0.85;
  u.pitch = 1.25; // child-like
  window.speechSynthesis.speak(u);
}

/* ----------------------------------------------------------------------------
   6. APP
---------------------------------------------------------------------------- */
export default function App() {
  const model = useMemo(() => buildNgramModel(CORPUS), []);
  const voices = useVoices();

  const [lang, setLang] = useState("en");
  const [langChosen, setLangChosen] = useState(false); // show picker until a language is chosen
  const [sentence, setSentence] = useState([]);      // array of symbol ids
  const [personalFreq, setPersonalFreq] = useState({});
  const [recent, setRecent] = useState([]);
  const [simHour, setSimHour] = useState(new Date().getHours());
  const [activeCat, setActiveCat] = useState("all");
  const [showPredInfo, setShowPredInfo] = useState(false);

  const field = LANGUAGES[lang].field;
  const tod = timeOfDay(simHour);

  // live prediction
  const predictions = useMemo(() => {
    const raw = ngramScores(model, sentence);
    const ranked = rerank(raw, { tod, recent, personalFreq });
    return topPredictions(ranked, 6, sentence.slice(-1));
  }, [model, sentence, tod, recent, personalFreq]);

  const addSymbol = (id) => {
    setSentence((s) => [...s, id]);
    setRecent((r) => [...r, id].slice(-12));
    setPersonalFreq((f) => ({ ...f, [id]: (f[id] || 0) + 1 }));
    const sym = SYMBOL_BY_ID[id];
    if (sym) speak(sym[field], lang, voices); // speak each tapped word
  };

  const speakSentence = () => {
    if (!sentence.length) return;
    const text = sentence.map((id) => SYMBOL_BY_ID[id][field]).join(" ");
    speak(text, lang, voices);
  };

  const backspace = () => setSentence((s) => s.slice(0, -1));
  const clearAll = () => setSentence([]);

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
          <span style={st.pickerLogo}>🐦</span>
          <h1 style={st.pickerBrand}>Mynah</h1>
          <h2 style={st.pickerTitle}>Choose a language</h2>
          <p style={st.pickerSub}>உங்கள் மொழியைத் தேர்ந்தெடுக்கவும் · अपनी भाषा चुनें</p>
          <div style={st.pickerGrid}>
            {Object.entries(LANGUAGES).map(([k, v]) => (
              <button key={k} onClick={() => chooseLang(k)} className="tile-press" style={st.pickerTile}>
                <span style={st.pickerFlag}>{v.flag}</span>
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
    <div style={st.page}>
      <style>{globalCss}</style>

      {/* Header */}
      <header style={st.header}>
        <div style={st.brandRow}>
          <span style={st.logoDot}>🐦</span>
          <div>
            <h1 style={st.title}>Mynah</h1>
            <p style={st.subtitle}>Tap · Talk · Connect</p>
          </div>
        </div>
        <div style={st.langSelectWrap}>
          <span style={st.langGlobe}>🌐</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={st.langSelect}
            aria-label="Language"
          >
            {Object.entries(LANGUAGES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.native} · {v.label}
              </option>
            ))}
          </select>
          <span style={st.langCaret}>▾</span>
        </div>
      </header>

      {/* Sentence strip */}
      <section style={st.sentenceBar}>
        <div style={st.sentenceScroll}>
          {sentence.length === 0 ? (
            <span style={st.placeholder}>Tap symbols to build a sentence</span>
          ) : (
            sentence.map((id, i) => {
              const s = SYMBOL_BY_ID[id];
              return (
                <div key={i} style={st.sentChip}>
                  <span style={st.sentGlyph}>{s.glyph}</span>
                  <span style={st.sentWord}>{s[field]}</span>
                </div>
              );
            })
          )}
        </div>
        <div style={st.sentActions}>
          <button onClick={backspace} style={st.iconBtn} title="Delete last" disabled={!sentence.length}>⌫</button>
          <button onClick={clearAll} style={st.iconBtn} title="Clear" disabled={!sentence.length}>🗑️</button>
          <button onClick={speakSentence} style={st.speakBtn} disabled={!sentence.length}>🔊 Speak</button>
        </div>
      </section>

      {/* Prediction row */}
      <section style={st.predSection}>
        <div style={st.predHead}>
          <span style={st.predLabel}>
            Suggested next
            <button style={st.infoBtn} onClick={() => setShowPredInfo((v) => !v)}>?</button>
          </span>
          <span style={st.todTag}>🕒 {tod}</span>
        </div>
        {showPredInfo && (
          <div style={st.infoBox}>
            Predictions come from an N-gram model trained on AAC sentence frames, then
            re-ranked by time of day, recency, and this child's own usage. Keep tapping
            and the order adapts to the child.
          </div>
        )}
        <div style={st.predRow}>
          {predictions.map((id) => {
            const s = SYMBOL_BY_ID[id];
            return (
              <button key={id} onClick={() => addSymbol(id)} style={st.predTile}>
                <span style={st.predGlyph}>{s.glyph}</span>
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
      <section style={st.board}>
        {visibleSymbols.map((s) => (
          <button
            key={s.id}
            onClick={() => addSymbol(s.id)}
            style={{ ...st.tile, borderColor: CATEGORIES[s.cat].color }}
          >
            <span style={{ ...st.tileBar, background: CATEGORIES[s.cat].color }} />
            <span style={st.tileGlyph}>{s.glyph}</span>
            <span style={st.tileWord}>{s[field]}</span>
            {field !== "en" && <span style={st.tileEn}>{s.en}</span>}
          </button>
        ))}
      </section>

      {/* Time simulator + personalization peek */}
      <footer style={st.footer}>
        <div style={st.footBlock}>
          <label style={st.footLabel}>Simulate time of day (demo)</label>
          <input
            type="range" min="0" max="23" value={simHour}
            onChange={(e) => setSimHour(Number(e.target.value))}
            style={st.slider}
          />
          <span style={st.footValue}>{String(simHour).padStart(2, "0")}:00 · {tod}</span>
        </div>
        <div style={st.footBlock}>
          <label style={st.footLabel}>Child's top used symbols (learned live)</label>
          <div style={st.freqRow}>
            {Object.entries(personalFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, c]) => (
              <span key={id} style={st.freqPill}>{SYMBOL_BY_ID[id].glyph} {c}</span>
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
const ACCENT = "#00A6A6";
const ACCENT2 = "#3DC2EC";
const INK = "#1E2A45";
const PAPER = "#F4FBFF";

const globalCss = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #F4FBFF; }
  button { font-family: inherit; cursor: pointer; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  button:focus-visible { outline: 3px solid ${ACCENT}; outline-offset: 2px; }
  .tile-press:active { transform: scale(0.95); }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

const st = {
  page: {
    minHeight: "100vh", background: `linear-gradient(180deg, #EAF9FF 0%, ${PAPER} 40%)`, color: INK,
    fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
    maxWidth: 1100, margin: "0 auto", padding: "16px 16px 40px",
  },

  /* Language picker screen */
  pickerPage: {
    minHeight: "100vh", color: INK,
    fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
    background: `linear-gradient(135deg, ${ACCENT2} 0%, ${ACCENT} 100%)`,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  pickerCard: {
    width: "100%", maxWidth: 640, background: "#fff", borderRadius: 28,
    padding: "36px 28px 28px", textAlign: "center",
    boxShadow: "0 24px 60px rgba(0,80,90,0.30)",
  },
  pickerLogo: { fontSize: 52, lineHeight: 1, display: "inline-block" },
  pickerBrand: { margin: "8px 0 0", fontSize: 36, fontWeight: 900, color: ACCENT, letterSpacing: "-1px" },
  pickerTitle: { margin: "10px 0 4px", fontSize: 22, fontWeight: 800, color: INK, letterSpacing: "-0.3px" },
  pickerSub: { margin: "0 0 22px", fontSize: 15, color: "#6B7A90", fontWeight: 700 },
  pickerGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 },
  pickerTile: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "20px 8px", borderRadius: 20, border: "2px solid #E6F4F6",
    background: "linear-gradient(180deg, #FFFFFF, #F2FBFC)", transition: "transform 0.08s, box-shadow 0.15s",
    boxShadow: "0 4px 14px rgba(0,120,130,0.08)",
  },
  pickerFlag: { fontSize: 34, lineHeight: 1 },
  pickerNative: { fontSize: 20, fontWeight: 900, color: INK, marginTop: 2 },
  pickerLabel: { fontSize: 13, fontWeight: 700, color: "#7A8AA0" },
  pickerHint: { margin: "22px 0 0", fontSize: 13, color: "#9AA4B2", fontWeight: 600 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14, background: "#fff", borderRadius: 20, padding: "14px 18px", boxShadow: "0 6px 20px rgba(0,120,130,0.08)" },
  brandRow: { display: "flex", alignItems: "center", gap: 12 },
  logoDot: { width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT2}, ${ACCENT})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 4px 12px rgba(0,166,166,0.35)" },
  title: { margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: "-1px", color: ACCENT },
  subtitle: { margin: 0, fontSize: 13, color: "#6B7A90", fontWeight: 700, letterSpacing: "0.3px" },

  langSelectWrap: { position: "relative", display: "flex", alignItems: "center", background: "#fff", border: "2px solid #DCEFF1", borderRadius: 999, padding: "0 34px 0 12px", boxShadow: "0 2px 8px rgba(0,120,130,0.06)" },
  langGlobe: { fontSize: 16, marginRight: 6 },
  langSelect: { appearance: "none", WebkitAppearance: "none", MozAppearance: "none", border: "none", background: "transparent", color: INK, fontFamily: "inherit", fontWeight: 800, fontSize: 15, padding: "10px 4px", cursor: "pointer", outline: "none" },
  langCaret: { position: "absolute", right: 14, color: ACCENT, fontSize: 12, fontWeight: 900, pointerEvents: "none" },

  sentenceBar: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "2px solid #E1F1F3", borderRadius: 18, padding: 12, marginBottom: 14, boxShadow: "0 4px 16px rgba(0,120,130,0.07)" },
  sentenceScroll: { flex: 1, display: "flex", gap: 8, overflowX: "auto", minHeight: 64, alignItems: "center" },
  placeholder: { color: "#A6AFBD", fontWeight: 600, fontSize: 15, paddingLeft: 6 },
  sentChip: { display: "flex", flexDirection: "column", alignItems: "center", background: "#EAF9FB", borderRadius: 12, padding: "6px 12px", minWidth: 62 },
  sentGlyph: { fontSize: 26, lineHeight: 1 },
  sentWord: { fontSize: 13, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap" },
  sentActions: { display: "flex", gap: 6, alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 12, border: "2px solid #E1F1F3", background: "#fff", fontSize: 18 },
  speakBtn: { height: 44, padding: "0 18px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${ACCENT2}, ${ACCENT})`, color: "#fff", fontWeight: 800, fontSize: 16, boxShadow: "0 4px 12px rgba(0,166,166,0.35)" },

  predSection: { marginBottom: 16 },
  predHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  predLabel: { fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6B7A90", display: "flex", alignItems: "center", gap: 6 },
  infoBtn: { width: 20, height: 20, borderRadius: 999, border: "none", background: "#CFEAEC", color: ACCENT, fontSize: 12, fontWeight: 900, lineHeight: 1 },
  infoBox: { background: "#EAF9FB", border: "1px solid #BEE7EA", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#3A4A5E", marginBottom: 10, lineHeight: 1.5 },
  todTag: { fontSize: 13, fontWeight: 700, color: ACCENT, background: "#E0F7F8", padding: "4px 10px", borderRadius: 999 },
  predRow: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 },
  predTile: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 6px", borderRadius: 16, border: "2px dashed " + ACCENT, background: "linear-gradient(180deg, #F0FCFD, #E2F8FA)", transition: "transform 0.08s", boxShadow: "0 4px 12px rgba(0,166,166,0.10)" },
  predGlyph: { fontSize: 30 },
  predWord: { fontSize: 14, fontWeight: 800, textAlign: "center" },

  catRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  catChip: { padding: "7px 14px", borderRadius: 999, border: "2px solid #DCEFF1", background: "#fff", fontWeight: 700, fontSize: 14, color: INK },
  catChipActive: { background: ACCENT, color: "#fff", borderColor: ACCENT },

  board: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 10, marginBottom: 22 },
  tile: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "16px 6px 12px", borderRadius: 18, border: "2px solid", background: "#fff", overflow: "hidden", transition: "transform 0.08s", boxShadow: "0 4px 14px rgba(0,120,130,0.08)" },
  tileBar: { position: "absolute", top: 0, left: 0, right: 0, height: 6 },
  tileGlyph: { fontSize: 38, lineHeight: 1, marginTop: 4 },
  tileWord: { fontSize: 16, fontWeight: 800, textAlign: "center", marginTop: 4 },
  tileEn: { fontSize: 11, color: "#9AA4B2", fontWeight: 600 },

  footer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#fff", border: "2px solid #E1F1F3", borderRadius: 18, padding: 16, boxShadow: "0 4px 16px rgba(0,120,130,0.06)" },
  footBlock: { display: "flex", flexDirection: "column", gap: 8 },
  footLabel: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6B7A90" },
  slider: { width: "100%", accentColor: ACCENT },
  footValue: { fontSize: 14, fontWeight: 700, color: ACCENT },
  freqRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  freqPill: { background: "#EAF9FB", borderRadius: 999, padding: "4px 10px", fontSize: 14, fontWeight: 700 },
  freqEmpty: { color: "#A6AFBD", fontSize: 14, fontWeight: 600 },
};