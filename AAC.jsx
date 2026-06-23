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
  // Objects
  { id: "water",   glyph: "💧", cat: "objects", en: "water",  ta: "தண்ணீர்",  te: "నీళ్ళు",   hi: "पानी",  bn: "জল",     mr: "पाणी",  gu: "પાણી",   kn: "ನೀರು",    or: "ପାଣି",    ml: "വെള്ളം" },
  { id: "food",    glyph: "🍚", cat: "objects", en: "food",   ta: "உணவு",     te: "అన్నం",    hi: "खाना",  bn: "খাবার",  mr: "जेवण",  gu: "ખોરાક",  kn: "ಆಹಾರ",    or: "ଖାଦ୍ୟ",   ml: "ഭക്ഷണം" },
  { id: "milk",    glyph: "🥛", cat: "objects", en: "milk",   ta: "பால்",     te: "పాలు",     hi: "दूध",   bn: "দুধ",     mr: "दूध",   gu: "દૂધ",    kn: "ಹಾಲು",    or: "ଦୁଧ",     ml: "പാൽ" },
  { id: "toilet",  glyph: "🚽", cat: "objects", en: "toilet", ta: "கழிப்பறை", te: "టాయిలెట్", hi: "टॉयलेट", bn: "টয়লেট",  mr: "टॉयलेट", gu: "ટોઇલેટ",  kn: "ಟಾಯ್ಲೆಟ್", or: "ଟଏଲେଟ୍",  ml: "ടോയ്‌ലറ്റ്" },
  { id: "school",  glyph: "🏫", cat: "objects", en: "school", ta: "பள்ளி",    te: "స్కూల్",   hi: "स्कूल",  bn: "স্কুল",   mr: "शाळा",  gu: "શાળા",   kn: "ಶಾಲೆ",    or: "ସ୍କୁଲ୍",   ml: "സ്കൂൾ" },
  { id: "home",    glyph: "🏠", cat: "objects", en: "home",   ta: "வீடு",     te: "ఇల్లు",    hi: "घर",    bn: "বাড়ি",   mr: "घर",    gu: "ઘર",     kn: "ಮನೆ",     or: "ଘର",     ml: "വീട്" },
  { id: "toy",     glyph: "🪀", cat: "objects", en: "toy",    ta: "பொம்மை",   te: "ఆటబొమ్మ",  hi: "खिलौना", bn: "খেলনা",  mr: "खेळणं", gu: "રમકડું",  kn: "ಆಟಿಕೆ",   or: "ଖେଳନା",   ml: "കളിപ്പാട്ടം" },
  { id: "book",    glyph: "📖", cat: "objects", en: "book",   ta: "புத்தகம்", te: "పుస్తకం",  hi: "किताब", bn: "বই",     mr: "पुस्तक", gu: "પુસ્તક",  kn: "ಪುಸ್ತಕ",   or: "ବହି",     ml: "പുസ്തകം" },
  // Feelings
  { id: "happy",   glyph: "😊", cat: "feelings", en: "happy", ta: "மகிழ்ச்சி", te: "సంతోషం",  hi: "खुश",   bn: "খুশি",   mr: "आनंदी", gu: "ખુશ",    kn: "ಸಂತೋಷ",   or: "ଖୁସି",    ml: "സന്തോഷം" },
  { id: "sad",     glyph: "😢", cat: "feelings", en: "sad",   ta: "சோகம்",    te: "బాధ",      hi: "दुखी",  bn: "দুঃখ",   mr: "दुःखी", gu: "ઉદાસ",   kn: "ದುಃಖ",    or: "ଦୁଃଖ",    ml: "സങ്കടം" },
  { id: "hungry",  glyph: "🤤", cat: "feelings", en: "hungry", ta: "பசி",     te: "ఆకలి",     hi: "भूख",   bn: "ক্ষুধা",  mr: "भूक",   gu: "ભૂખ",    kn: "ಹಸಿವು",   or: "ଭୋକ",    ml: "വിശപ്പ്" },
  { id: "tired",   glyph: "🥱", cat: "feelings", en: "tired", ta: "சோர்வு",   te: "అలసట",     hi: "थका",   bn: "ক্লান্ত",  mr: "थकलो",  gu: "થાક",    kn: "ಸುಸ್ತು",   or: "ଥକା",    ml: "ക്ഷീണം" },
  { id: "pain",    glyph: "🤕", cat: "feelings", en: "pain",  ta: "வலி",      te: "నొప్పి",   hi: "दर्द",  bn: "ব্যথা",   mr: "वेदना", gu: "દુખાવો",  kn: "ನೋವು",    or: "ବ୍ୟଥା",   ml: "വേദന" },
  // Social
  { id: "yes",     glyph: "✅", cat: "social",  en: "yes",    ta: "ஆம்",      te: "అవును",    hi: "हाँ",   bn: "হ্যাঁ",   mr: "हो",    gu: "હા",     kn: "ಹೌದು",    or: "ହଁ",     ml: "അതെ" },
  { id: "no",      glyph: "❌", cat: "social",  en: "no",     ta: "இல்லை",    te: "కాదు",     hi: "नहीं",  bn: "না",     mr: "नाही",  gu: "ના",     kn: "ಇಲ್ಲ",    or: "ନା",     ml: "അല്ല" },
  { id: "thanks",  glyph: "🙏", cat: "social",  en: "thank you", ta: "நன்றி", te: "ధన్యవాదాలు", hi: "धन्यवाद", bn: "ধন্যবাদ", mr: "धन्यवाद", gu: "આભાર",   kn: "ಧನ್ಯವಾದ",  or: "ଧନ୍ୟବାଦ",  ml: "നന്ദി" },
  { id: "hello",   glyph: "👋", cat: "social",  en: "hello",  ta: "வணக்கம்",  te: "నమస్తే",   hi: "नमस्ते", bn: "নমস্কার", mr: "नमस्कार", gu: "નમસ્તે",  kn: "ನಮಸ್ಕಾರ",  or: "ନମସ୍କାର",  ml: "നമസ്കാരം" },
];

const SYMBOL_BY_ID = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));

const CATEGORIES = {
  people:   { label: "People",   color: "#2563EB" }, // deep blue  — primary
  actions:  { label: "Actions",  color: "#0F766E" }, // teal       — communication
  objects:  { label: "Things",   color: "#D97706" }, // amber      — attention
  feelings: { label: "Feelings", color: "#7C3AED" }, // purple     — emotions
  social:   { label: "Social",   color: "#7C3AED" }, // purple     — social
};

const LANGUAGES = {
  en: { label: "English", native: "English", field: "en", flag: "🌐", voice: ["en-IN", "en-US", "en-GB", "en"] },
  ta: { label: "தமிழ்",   native: "தமிழ்",   field: "ta", flag: "🇮🇳", voice: ["ta-IN", "ta"] },
  hi: { label: "हिन्दी",  native: "हिन्दी",  field: "hi", flag: "🇮🇳", voice: ["hi-IN", "hi"] },
  te: { label: "Telugu",  native: "తెలుగు",  field: "te", flag: "🇮🇳", voice: ["te-IN", "te"] },
  bn: { label: "Bengali",   native: "বাংলা",    field: "bn", flag: "🇮🇳", voice: ["bn-IN", "bn-BD", "bn"] },
  mr: { label: "Marathi",   native: "मराठी",    field: "mr", flag: "🇮🇳", voice: ["mr-IN", "mr"] },
  gu: { label: "Gujarati",  native: "ગુજરાતી",  field: "gu", flag: "🇮🇳", voice: ["gu-IN", "gu"] },
  kn: { label: "Kannada",   native: "ಕನ್ನಡ",     field: "kn", flag: "🇮🇳", voice: ["kn-IN", "kn"] },
  or: { label: "Odia",      native: "ଓଡ଼ିଆ",     field: "or", flag: "🇮🇳", voice: ["or-IN", "or"] },
  ml: { label: "Malayalam", native: "മലയാളം",   field: "ml", flag: "🇮🇳", voice: ["ml-IN", "ml"] },
};

/* ----------------------------------------------------------------------------
   OPENMOJI RENDERING
   We render the friendly, consistent OpenMoji pictograms (color SVGs) instead
   of relying on each device's native emoji font. An emoji string is converted
   to OpenMoji's hex-codepoint filename (variation selectors stripped, ZWJ kept).
---------------------------------------------------------------------------- */
const OPENMOJI_BASE = "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/";

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
  const [childName, setChildName] = useState("");      // child's name, entered on the landing page
  const [showName, setShowName] = useState(false);     // big "my name" overlay
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
    <div style={st.page}>
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
          <div style={st.langSelectWrap}>
            <Om ch="🌐" size={16} style={st.langGlobe} />
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
        </div>
      </header>

      {/* "My name" overlay — for when someone asks the child their name */}
      {showName && (
        <div style={st.nameOverlay} onClick={() => setShowName(false)}>
          <div style={st.nameOverlayCard} onClick={(e) => e.stopPropagation()}>
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
        <div style={st.sentenceScroll}>
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
          <button onClick={backspace} style={st.iconBtn} title="Delete last" disabled={!sentence.length}><Om ch="⬅️" size={22} /></button>
          <button onClick={clearAll} style={st.iconBtn} title="Clear" disabled={!sentence.length}><Om ch="🗑️" size={22} /></button>
          <button onClick={speakSentence} style={st.speakBtn} disabled={!sentence.length}>
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
        <div style={st.predRow}>
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
      <section style={st.board}>
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

const globalCss = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${PAPER}; font-family: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  button { font-family: inherit; cursor: pointer; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  button:focus-visible { outline: 3px solid ${ACCENT}; outline-offset: 2px; }
  .tile-press:active { transform: scale(0.96); }
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
  pickerGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, maxWidth: 800, margin: "0 auto" },
  pickerTile: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
    minHeight: 96, padding: "16px 8px", borderRadius: 10, border: `1.5px solid ${LINE}`,
    background: "#fff",
  },
  pickerNative: { fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.15 },
  pickerLabel: { fontSize: 13, fontWeight: 500, color: MUTED, letterSpacing: "0.2px" },
  pickerHint: { margin: "26px 0 0", fontSize: 13, color: "#9CA3AF", fontWeight: 600 },

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

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14, background: "#fff", borderRadius: 8, padding: "12px 16px", border: `1px solid ${LINE}`, boxShadow: CARD_SHADOW },
  brandRow: { display: "flex", alignItems: "center", gap: 12 },
  title: { margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: "-1.5px", color: ACCENT },
  subtitle: { margin: 0, fontSize: 13, color: MUTED, fontWeight: 500, letterSpacing: "0.4px" },

  langSelectWrap: { position: "relative", display: "flex", alignItems: "center", background: "#fff", border: `1px solid ${LINE}`, borderRadius: 6, padding: "0 34px 0 12px" },
  langGlobe: { marginRight: 6 },
  langSelect: { appearance: "none", WebkitAppearance: "none", MozAppearance: "none", border: "none", background: "transparent", color: INK, fontFamily: "inherit", fontWeight: 800, fontSize: 15, padding: "10px 4px", cursor: "pointer", outline: "none" },
  langCaret: { position: "absolute", right: 14, color: ACCENT, fontSize: 12, fontWeight: 900, pointerEvents: "none" },

  sentenceBar: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 8, padding: 12, marginBottom: 14, boxShadow: CARD_SHADOW },
  sentenceScroll: { flex: 1, display: "flex", gap: 8, overflowX: "auto", minHeight: 64, alignItems: "center" },
  placeholder: { color: "#9CA3AF", fontWeight: 600, fontSize: 15, paddingLeft: 6 },
  sentChip: { display: "flex", flexDirection: "column", alignItems: "center", background: PAPER, borderRadius: 8, padding: "6px 12px", minWidth: 62 },
  sentWord: { fontSize: 13, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap" },
  sentActions: { display: "flex", gap: 6, alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  speakBtn: { display: "flex", alignItems: "center", height: 44, padding: "0 20px", borderRadius: 8, border: "none", background: TEAL, color: "#fff", fontWeight: 800, fontSize: 16, boxShadow: "0 4px 10px rgba(15,118,110,0.30)" },

  predSection: { marginBottom: 16 },
  predHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  predLabel: { fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: MUTED, display: "flex", alignItems: "center", gap: 6 },
  infoBtn: { width: 20, height: 20, borderRadius: 6, border: "none", background: "#DBEAFE", color: ACCENT, fontSize: 12, fontWeight: 900, lineHeight: 1 },
  infoBox: { background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#1E3A8A", marginBottom: 10, lineHeight: 1.5 },
  todTag: { display: "flex", alignItems: "center", fontSize: 13, fontWeight: 700, color: TEAL, background: "#CCFBF1", padding: "4px 10px", borderRadius: 6 },
  predRow: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 },
  predTile: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 6px", borderRadius: 8, border: `1.5px dashed ${ACCENT}`, background: "#EFF6FF", transition: "transform 0.08s" },
  predWord: { fontSize: 14, fontWeight: 800, textAlign: "center", color: INK },

  catRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  catChip: { padding: "7px 14px", borderRadius: 6, border: `1px solid ${LINE}`, background: "#fff", fontWeight: 700, fontSize: 14, color: INK },
  catChipActive: { background: ACCENT, color: "#fff", borderColor: ACCENT },

  board: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 10, marginBottom: 22 },
  tile: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "18px 6px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", overflow: "hidden", transition: "transform 0.08s", boxShadow: CARD_SHADOW },
  tileBar: { position: "absolute", top: 0, left: 0, right: 0, height: 5 },
  tileGlyph: { marginTop: 2 },
  tileWord: { fontSize: 18, fontWeight: 700, textAlign: "center", marginTop: 6, color: INK },
  tileEn: { fontSize: 11, color: "#9CA3AF", fontWeight: 600 },

  footer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 8, padding: 16, boxShadow: CARD_SHADOW },
  footBlock: { display: "flex", flexDirection: "column", gap: 8 },
  footLabel: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: MUTED },
  slider: { width: "100%", accentColor: ACCENT },
  footValue: { fontSize: 14, fontWeight: 700, color: ACCENT },
  freqRow: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" },
  freqPill: { display: "flex", alignItems: "center", background: PAPER, borderRadius: 6, padding: "4px 10px", fontSize: 14, fontWeight: 700 },
  freqEmpty: { color: "#9CA3AF", fontSize: 14, fontWeight: 600 },
};