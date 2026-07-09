/* ============================================================================
   AACASH VOCABULARY
   ----------------------------------------------------------------------------
   MOTOR-PLANNING CONTRACT (the most important AAC rule in this file):
     1. CORE_ORDER is append-only. Never reorder, never insert in the middle.
        A core word's position on screen is derived from its index here, so
        reordering would move buttons a child has already motor-learned.
     2. Each category's fringe list is append-only for the same reason.
     3. Smaller grids show a PREFIX of these lists — words disappear from the
        end, the remaining ones keep their positions.
     4. Custom caregiver words are appended at the end of their category.

   FITZGERALD KEY (modified) — every word carries `pos`, which maps to a fixed
   color in tokens.css:
     pronoun → yellow   verb → green    noun → orange
     adjective → blue   social → pink   negation → red

   TRANSLATIONS: entries carried over from the Sira prototype plus new ones.
   All non-English strings still require native-speaker review before
   clinical use — see VERIFICATION.md.
   ============================================================================ */

export const POS_LABELS = {
  pronoun: 'Pronoun',
  verb: 'Verb',
  noun: 'Noun',
  adjective: 'Describing word',
  social: 'Social word',
  negation: 'Negation',
};

/* Category metadata. `order` of keys here is the tab order (append-only). */
export const CATEGORIES = {
  social: { label: 'Social', glyph: '👋' },
  people: { label: 'People', glyph: '👩' },
  actions: { label: 'Actions', glyph: '🚶' },
  food: { label: 'Food & Drink', glyph: '🍛' },
  feelings: { label: 'Feelings', glyph: '😊' },
  places: { label: 'Places', glyph: '🏠' },
  things: { label: 'Things', glyph: '🧸' },
  nature: { label: 'Animals & Nature', glyph: '🐦' },
};

/* ---- Core vocabulary — always visible, fixed positions ---- */
export const CORE_ORDER = [
  'i', 'you', 'help', 'want',
  'like', 'more', 'not', 'dont_want',
  'yes', 'no', 'go', 'come',
  'stop', 'eat', 'drink', 'play',
];

export const WORDS = [
  /* -------- core -------- */
  { id: 'i',        glyph: '🧒', pos: 'pronoun',  cat: 'people',  core: true, en: 'I',          ta: 'நான்',     hi: 'मैं',        te: 'నేను',      bn: 'আমি',      mr: 'मी',       kn: 'ನಾನು' },
  { id: 'you',      glyph: '🫵', pos: 'pronoun',  cat: 'people',  core: true, en: 'you',        ta: 'நீ',        hi: 'तुम',        te: 'నువ్వు',     bn: 'তুমি',      mr: 'तू',        kn: 'ನೀನು' },
  { id: 'help',     glyph: '🤝', pos: 'verb',     cat: 'actions', core: true, en: 'help',       ta: 'உதவி',     hi: 'मदद',       te: 'సహాయం',    bn: 'সাহায্য',    mr: 'मदत',      kn: 'ಸಹಾಯ' },
  { id: 'want',     glyph: '🙌', pos: 'verb',     cat: 'actions', core: true, en: 'want',       ta: 'வேண்டும்', hi: 'चाहिए',     te: 'కావాలి',    bn: 'চাই',       mr: 'हवं',       kn: 'ಬೇಕು' },
  { id: 'like',     glyph: '👍', pos: 'verb',     cat: 'actions', core: true, en: 'like',       ta: 'பிடிக்கும்', hi: 'पसंद',      te: 'ఇష్టం',     bn: 'পছন্দ',     mr: 'आवडतं',    kn: 'ಇಷ್ಟ' },
  { id: 'more',     glyph: '➕', pos: 'adjective', cat: 'actions', core: true, en: 'more',       ta: 'மேலும்',   hi: 'और',        te: 'ఇంకా',      bn: 'আরও',      mr: 'अजून',     kn: 'ಇನ್ನೂ' },
  { id: 'not',      glyph: '🚫', pos: 'negation', cat: 'actions', core: true, en: 'not',        ta: 'இல்லை',    hi: 'नहीं',       te: 'కాదు',      bn: 'না',        mr: 'नाही',      kn: 'ಇಲ್ಲ' },
  { id: 'dont_want', glyph: '🙅', pos: 'negation', cat: 'actions', core: true, en: "don't want", ta: 'வேண்டாம்', hi: 'नहीं चाहिए', te: 'వద్దు',      bn: 'চাই না',    mr: 'नको',       kn: 'ಬೇಡ' },
  { id: 'yes',      glyph: '✅', pos: 'social',   cat: 'social',  core: true, en: 'yes',        ta: 'ஆம்',       hi: 'हाँ',        te: 'అవును',     bn: 'হ্যাঁ',      mr: 'हो',        kn: 'ಹೌದು' },
  { id: 'no',       glyph: '❌', pos: 'negation', cat: 'social',  core: true, en: 'no',         ta: 'இல்லை',    hi: 'नहीं',       te: 'కాదు',      bn: 'না',        mr: 'नाही',      kn: 'ಇಲ್ಲ' },
  { id: 'go',       glyph: '🚶', pos: 'verb',     cat: 'actions', core: true, en: 'go',         ta: 'போக',      hi: 'जाना',      te: 'వెళ్ళు',     bn: 'যাওয়া',     mr: 'जाणे',      kn: 'ಹೋಗು' },
  { id: 'come',     glyph: '🏃', pos: 'verb',     cat: 'actions', core: true, en: 'come',       ta: 'வா',        hi: 'आओ',        te: 'రా',        bn: 'এসো',      mr: 'ये',        kn: 'ಬಾ' },
  { id: 'stop',     glyph: '✋', pos: 'verb',     cat: 'actions', core: true, en: 'stop',       ta: 'நிறுத்து',  hi: 'रुको',       te: 'ఆపు',       bn: 'থামো',     mr: 'थांब',      kn: 'ನಿಲ್ಲಿಸು' },
  { id: 'eat',      glyph: '🍽️', pos: 'verb',     cat: 'actions', core: true, en: 'eat',        ta: 'சாப்பிட',   hi: 'खाना',      te: 'తిను',      bn: 'খাওয়া',    mr: 'खाणे',      kn: 'ತಿನ್ನು' },
  { id: 'drink',    glyph: '🥤', pos: 'verb',     cat: 'actions', core: true, en: 'drink',      ta: 'குடிக்க',   hi: 'पीना',       te: 'తాగు',      bn: 'পান করা',  mr: 'पिणे',      kn: 'ಕುಡಿ' },
  { id: 'play',     glyph: '🧸', pos: 'verb',     cat: 'actions', core: true, en: 'play',       ta: 'விளையாட', hi: 'खेलना',     te: 'ఆడు',       bn: 'খেলা',      mr: 'खेळणे',     kn: 'ಆಟ' },

  /* -------- social -------- */
  { id: 'hello',    glyph: '🙋', pos: 'social', cat: 'social', en: 'hello',     ta: 'வணக்கம்', hi: 'नमस्ते',   te: 'నమస్తే',      bn: 'নমস্কার',  mr: 'नमस्कार', kn: 'ನಮಸ್ಕಾರ' },
  { id: 'bye',      glyph: '👋', pos: 'social', cat: 'social', en: 'bye',       ta: 'டாட்டா',   hi: 'टाटा',     te: 'టాటా',        bn: 'টাটা',     mr: 'टाटा',    kn: 'ಟಾಟಾ' },
  { id: 'thanks',   glyph: '🙏', pos: 'social', cat: 'social', en: 'thank you', ta: 'நன்றி',    hi: 'धन्यवाद', te: 'ధన్యవాదాలు', bn: 'ধন্যবাদ', mr: 'धन्यवाद', kn: 'ಧನ್ಯವಾದ' },

  /* -------- people -------- */
  { id: 'amma',    glyph: '👩',    pos: 'noun', cat: 'people', en: 'mother',      ta: 'அம்மா',    hi: 'माँ',    te: 'అమ్మ',        bn: 'মা',      mr: 'आई',     kn: 'ಅಮ್ಮ' },
  { id: 'appa',    glyph: '👨',    pos: 'noun', cat: 'people', en: 'father',      ta: 'அப்பா',    hi: 'पापा',   te: 'నాన్న',       bn: 'বাবা',    mr: 'बाबा',    kn: 'ಅಪ್ಪ' },
  { id: 'paati',   glyph: '👵',    pos: 'noun', cat: 'people', en: 'grandmother', ta: 'பாட்டி',    hi: 'दादी',   te: 'అమ్మమ్మ',    bn: 'দিদা',    mr: 'आजी',    kn: 'ಅಜ್ಜಿ' },
  { id: 'thatha',  glyph: '👴',    pos: 'noun', cat: 'people', en: 'grandfather', ta: 'தாத்தா',   hi: 'दादा',   te: 'తాతయ్య',     bn: 'দাদু',    mr: 'आजोबा',  kn: 'ಅಜ್ಜ' },
  { id: 'teacher', glyph: '🧑‍🏫', pos: 'noun', cat: 'people', en: 'teacher',     ta: 'ஆசிரியர்', hi: 'टीचर',   te: 'టీచర్',       bn: 'শিক্ষক',   mr: 'शिक्षक',  kn: 'ಶಿಕ್ಷಕ' },
  { id: 'friend',  glyph: '🧑‍🤝‍🧑', pos: 'noun', cat: 'people', en: 'friend',   ta: 'நண்பர்',   hi: 'दोस्त',   te: 'స్నేహితుడు', bn: 'বন্ধু',    mr: 'मित्र',    kn: 'ಸ್ನೇಹಿತ' },

  /* -------- more actions (fringe) -------- */
  { id: 'sleep',  glyph: '😴', pos: 'verb',      cat: 'actions', en: 'sleep',    ta: 'தூங்க',     hi: 'सोना',   te: 'నిద్ర',          bn: 'ঘুম',   mr: 'झोपणे',  kn: 'ನಿದ್ರೆ' },
  { id: 'give',   glyph: '🤲', pos: 'verb',      cat: 'actions', en: 'give',     ta: 'கொடு',     hi: 'दो',     te: 'ఇవ్వు',          bn: 'দাও',   mr: 'दे',      kn: 'ಕೊಡು' },
  { id: 'look',   glyph: '👀', pos: 'verb',      cat: 'actions', en: 'look',     ta: 'பார்',      hi: 'देखो',   te: 'చూడు',          bn: 'দেখো',  mr: 'बघ',     kn: 'ನೋಡು' },
  { id: 'bathe',  glyph: '🛁', pos: 'verb',      cat: 'actions', en: 'bathe',    ta: 'குளிக்க',   hi: 'नहाना',  te: 'స్నానం',        bn: 'স্নান',   mr: 'आंघोळ',  kn: 'ಸ್ನಾನ' },
  { id: 'done',   glyph: '🏁', pos: 'adjective', cat: 'actions', en: 'finished', ta: 'முடிந்தது', hi: 'हो गया', te: 'అయిపోయింది', bn: 'শেষ',   mr: 'झालं',    kn: 'ಆಯಿತು' },

  /* -------- food & drink -------- */
  { id: 'water',   glyph: '💧', pos: 'noun', cat: 'food', en: 'water',   ta: 'தண்ணீர்', hi: 'पानी',     te: 'నీళ్ళు',    bn: 'জল',      mr: 'पाणी',    kn: 'ನೀರು' },
  { id: 'milk',    glyph: '🥛', pos: 'noun', cat: 'food', en: 'milk',    ta: 'பால்',     hi: 'दूध',      te: 'పాలు',     bn: 'দুধ',      mr: 'दूध',     kn: 'ಹಾಲು' },
  { id: 'food',    glyph: '🍛', pos: 'noun', cat: 'food', en: 'food',    ta: 'உணவு',    hi: 'खाना',     te: 'అన్నం',    bn: 'খাবার',   mr: 'जेवण',    kn: 'ಆಹಾರ' },
  { id: 'fruit',   glyph: '🍎', pos: 'noun', cat: 'food', en: 'fruit',   ta: 'பழம்',     hi: 'फल',       te: 'పండు',     bn: 'ফল',      mr: 'फळ',     kn: 'ಹಣ್ಣು' },
  { id: 'biscuit', glyph: '🍪', pos: 'noun', cat: 'food', en: 'biscuit', ta: 'பிஸ்கட்',  hi: 'बिस्कुट',   te: 'బిస్కెట్',   bn: 'বিস্কুট',   mr: 'बिस्कीट',  kn: 'ಬಿಸ್ಕತ್ತು' },

  /* -------- feelings (descriptors → adjective/blue) -------- */
  { id: 'happy',  glyph: '😊', pos: 'adjective', cat: 'feelings', en: 'happy',  ta: 'மகிழ்ச்சி', hi: 'खुश',  te: 'సంతోషం', bn: 'খুশি',    mr: 'आनंदी', kn: 'ಸಂತೋಷ' },
  { id: 'sad',    glyph: '😢', pos: 'adjective', cat: 'feelings', en: 'sad',    ta: 'சோகம்',    hi: 'दुखी',  te: 'బాధ',     bn: 'দুঃখ',    mr: 'दुःखी',  kn: 'ದುಃಖ' },
  { id: 'hungry', glyph: '🤤', pos: 'adjective', cat: 'feelings', en: 'hungry', ta: 'பசி',       hi: 'भूख',  te: 'ఆకలి',    bn: 'ক্ষুধা',   mr: 'भूक',    kn: 'ಹಸಿವು' },
  { id: 'tired',  glyph: '🥱', pos: 'adjective', cat: 'feelings', en: 'tired',  ta: 'சோர்வு',   hi: 'थका',  te: 'అలసట',   bn: 'ক্লান্ত',   mr: 'थकलो',  kn: 'ಸುಸ್ತು' },
  { id: 'pain',   glyph: '🤕', pos: 'adjective', cat: 'feelings', en: 'pain',   ta: 'வலி',       hi: 'दर्द',  te: 'నొప్పి',   bn: 'ব্যথা',    mr: 'वेदना',  kn: 'ನೋವು' },
  { id: 'scared', glyph: '😨', pos: 'adjective', cat: 'feelings', en: 'scared', ta: 'பயம்',     hi: 'डर',    te: 'భయం',    bn: 'ভয়',      mr: 'भीती',   kn: 'ಭಯ' },
  { id: 'angry',  glyph: '😠', pos: 'adjective', cat: 'feelings', en: 'angry',  ta: 'கோபம்',   hi: 'गुस्सा', te: 'కోపం',    bn: 'রাগ',     mr: 'राग',    kn: 'ಕೋಪ' },
  { id: 'hot',    glyph: '🥵', pos: 'adjective', cat: 'feelings', en: 'hot',    ta: 'சூடு',      hi: 'गरम',  te: 'వేడి',     bn: 'গরম',    mr: 'गरम',    kn: 'ಬಿಸಿ' },
  { id: 'cold',   glyph: '🥶', pos: 'adjective', cat: 'feelings', en: 'cold',   ta: 'குளிர்',    hi: 'ठंड',   te: 'చలి',      bn: 'ঠান্ডা',   mr: 'थंड',     kn: 'ಚಳಿ' },

  /* -------- places -------- */
  { id: 'home',    glyph: '🏠', pos: 'noun', cat: 'places', en: 'home',    ta: 'வீடு',      hi: 'घर',     te: 'ఇల్లు',      bn: 'বাড়ি',   mr: 'घर',     kn: 'ಮನೆ' },
  { id: 'school',  glyph: '🏫', pos: 'noun', cat: 'places', en: 'school',  ta: 'பள்ளி',     hi: 'स्कूल',   te: 'స్కూల్',     bn: 'স্কুল',    mr: 'शाळा',   kn: 'ಶಾಲೆ' },
  { id: 'toilet',  glyph: '🚽', pos: 'noun', cat: 'places', en: 'toilet',  ta: 'கழிப்பறை', hi: 'टॉयलेट', te: 'టాయిలెట్', bn: 'টয়লেট', mr: 'टॉयलेट', kn: 'ಟಾಯ್ಲೆಟ್' },
  { id: 'outside', glyph: '🌳', pos: 'noun', cat: 'places', en: 'outside', ta: 'வெளியே',  hi: 'बाहर',   te: 'బయట',      bn: 'বাইরে',  mr: 'बाहेर',   kn: 'ಹೊರಗೆ' },

  /* -------- things -------- */
  { id: 'toy',      glyph: '🪀', pos: 'noun', cat: 'things', en: 'toy',      ta: 'பொம்மை',  hi: 'खिलौना', te: 'ఆటబొమ్మ', bn: 'খেলনা',  mr: 'खेळणं',   kn: 'ಆಟಿಕೆ' },
  { id: 'ball',     glyph: '⚽', pos: 'noun', cat: 'things', en: 'ball',     ta: 'பந்து',     hi: 'गेंद',     te: 'బంతి',      bn: 'বল',      mr: 'चेंडू',     kn: 'ಚೆಂಡು' },
  { id: 'book',     glyph: '📖', pos: 'noun', cat: 'things', en: 'book',     ta: 'புத்தகம்',  hi: 'किताब',   te: 'పుస్తకం',   bn: 'বই',      mr: 'पुस्तक',   kn: 'ಪುಸ್ತಕ' },
  { id: 'tv',       glyph: '📺', pos: 'noun', cat: 'things', en: 'TV',       ta: 'டிவி',      hi: 'टीवी',    te: 'టీవీ',      bn: 'টিভি',    mr: 'टीव्ही',    kn: 'ಟಿವಿ' },
  { id: 'music',    glyph: '🎵', pos: 'noun', cat: 'things', en: 'music',    ta: 'பாட்டு',    hi: 'गाना',    te: 'పాట',      bn: 'গান',     mr: 'गाणं',     kn: 'ಹಾಡು' },
  { id: 'medicine', glyph: '💊', pos: 'noun', cat: 'things', en: 'medicine', ta: 'மருந்து',   hi: 'दवा',     te: 'మందు',     bn: 'ওষুধ',    mr: 'औषध',    kn: 'ಔಷಧಿ' },

  /* -------- animals & nature -------- */
  { id: 'dog',  glyph: '🐕', pos: 'noun', cat: 'nature', en: 'dog',  ta: 'நாய்',    hi: 'कुत्ता',   te: 'కుక్క',      bn: 'কুকুর',  mr: 'कुत्रा',  kn: 'ನಾಯಿ' },
  { id: 'cat',  glyph: '🐈', pos: 'noun', cat: 'nature', en: 'cat',  ta: 'பூனை',   hi: 'बिल्ली',   te: 'పిల్లి',      bn: 'বিড়াল', mr: 'मांजर',  kn: 'ಬೆಕ್ಕು' },
  { id: 'cow',  glyph: '🐄', pos: 'noun', cat: 'nature', en: 'cow',  ta: 'மாடு',    hi: 'गाय',     te: 'ఆవు',       bn: 'গরু',    mr: 'गाय',    kn: 'ಹಸು' },
  { id: 'bird', glyph: '🐦', pos: 'noun', cat: 'nature', en: 'bird', ta: 'பறவை',  hi: 'चिड़िया',  te: 'పక్షి',       bn: 'পাখি',   mr: 'पक्षी',   kn: 'ಹಕ್ಕಿ' },
  { id: 'moon', glyph: '🌙', pos: 'noun', cat: 'nature', en: 'moon', ta: 'நிலா',    hi: 'चाँद',     te: 'చందమామ', bn: 'চাঁদ',    mr: 'चांदोबा', kn: 'ಚಂದ್ರ' },
  { id: 'rain', glyph: '🌧️', pos: 'noun', cat: 'nature', en: 'rain', ta: 'மழை',    hi: 'बारिश',   te: 'వర్షం',     bn: 'বৃষ্টি',   mr: 'पाऊस',   kn: 'ಮಳೆ' },
];

export const WORD_BY_ID = Object.fromEntries(WORDS.map((w) => [w.id, w]));

/* Fringe words of a category, in canonical (append-only) order.
   Core words also appear in their home category so a category view is
   complete, but they are listed first and never move. */
export function categoryWords(cat) {
  return WORDS.filter((w) => w.cat === cat);
}

/* ---- Grid presets ----
   cols×rows is the WHOLE board grid. `coreCols` columns on the left are
   reserved for core words (column-major fill from CORE_ORDER, prefix rule).
   The rest is the fringe area for the active category (row-major, paged).
   Preset list is append-only; a profile stores the preset id. */
export const GRID_PRESETS = [
  { id: '2x2', label: '2 × 2 (core only)', cols: 2, rows: 2, coreCols: 2 },
  { id: '3x3', label: '3 × 3', cols: 3, rows: 3, coreCols: 1 },
  { id: '4x3', label: '4 × 3', cols: 4, rows: 3, coreCols: 2 },
  { id: '5x4', label: '5 × 4', cols: 5, rows: 4, coreCols: 2 },
  { id: '6x4', label: '6 × 4', cols: 6, rows: 4, coreCols: 2 },
  { id: '7x5', label: '7 × 5', cols: 7, rows: 5, coreCols: 2 },
  { id: '8x6', label: '8 × 6', cols: 8, rows: 6, coreCols: 2 },
  { id: '10x8', label: '10 × 8', cols: 10, rows: 8, coreCols: 2 },
];

export const GRID_BY_ID = Object.fromEntries(GRID_PRESETS.map((g) => [g.id, g]));
export const DEFAULT_GRID = '6x4';
