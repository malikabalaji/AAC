/* Quick phrases — whole sentences reachable in one tap from anywhere.
   The six emergency phrases are carried over from the Sira prototype
   (pre-translated, 7 languages); needs/feelings phrases are new.
   ⚠ SAFETY-CRITICAL: all non-English strings need native-speaker review
   before use with a real child — see VERIFICATION.md. */

export const PHRASE_GROUPS = [
  { id: 'emergency', label: 'Emergency', tone: 'danger', phrases: ['help', 'pain', 'mother', 'doctor'] },
  { id: 'needs', label: 'I need…', tone: 'default', phrases: ['toilet', 'water', 'hungry', 'home', 'rest'] },
  { id: 'feelings', label: 'I feel…', tone: 'default', phrases: ['scared', 'sick', 'tired_p'] },
];

export const PHRASES = {
  help: {
    glyph: '🆘',
    en: 'I need help!', ta: 'எனக்கு உதவி வேண்டும்!', hi: 'मुझे मदद चाहिए!',
    te: 'నాకు సహాయం కావాలి!', bn: 'আমার সাহায্য দরকার!', mr: 'मला मदत हवी आहे!', kn: 'ನನಗೆ ಸಹಾಯ ಬೇಕು!',
  },
  pain: {
    glyph: '🤕',
    en: 'I am in pain.', ta: 'எனக்கு வலிக்கிறது.', hi: 'मुझे दर्द हो रहा है।',
    te: 'నాకు నొప్పిగా ఉంది.', bn: 'আমার ব্যথা হচ্ছে।', mr: 'मला वेदना होत आहेत.', kn: 'ನನಗೆ ನೋವಾಗುತ್ತಿದೆ.',
  },
  mother: {
    glyph: '👩',
    en: 'Please call my mother.', ta: 'தயவுசெய்து என் அம்மாவை அழைக்கவும்.', hi: 'कृपया मेरी माँ को बुलाओ।',
    te: 'దయచేసి మా అమ్మను పిలవండి.', bn: 'দয়া করে আমার মাকে ডাকুন।', mr: 'कृपया माझ्या आईला बोलवा.', kn: 'ದಯವಿಟ್ಟು ನನ್ನ ಅಮ್ಮನನ್ನು ಕರೆಯಿರಿ.',
  },
  doctor: {
    glyph: '🧑‍⚕️',
    en: 'Call a doctor.', ta: 'ஒரு மருத்துவரை அழைக்கவும்.', hi: 'डॉक्टर को बुलाओ।',
    te: 'డాక్టర్‌ను పిలవండి.', bn: 'একজন ডাক্তার ডাকুন।', mr: 'डॉक्टरला बोलवा.', kn: 'ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ.',
  },
  toilet: {
    glyph: '🚽',
    en: 'I need the toilet.', ta: 'எனக்கு கழிப்பறை வேண்டும்.', hi: 'मुझे टॉयलेट जाना है।',
    te: 'నాకు టాయిలెట్ కావాలి.', bn: 'আমার টয়লেট দরকার।', mr: 'मला टॉयलेटला जायचे आहे.', kn: 'ನನಗೆ ಟಾಯ್ಲೆಟ್ ಬೇಕು.',
  },
  water: {
    glyph: '💧',
    en: 'I want water.', ta: 'எனக்கு தண்ணீர் வேண்டும்.', hi: 'मुझे पानी चाहिए।',
    te: 'నాకు నీళ్ళు కావాలి.', bn: 'আমার জল চাই।', mr: 'मला पाणी हवं आहे.', kn: 'ನನಗೆ ನೀರು ಬೇಕು.',
  },
  hungry: {
    glyph: '🍚',
    en: 'I am hungry.', ta: 'எனக்கு பசிக்கிறது.', hi: 'मुझे भूख लगी है।',
    te: 'నాకు ఆకలిగా ఉంది.', bn: 'আমার খিদে পেয়েছে।', mr: 'मला भूक लागली आहे.', kn: 'ನನಗೆ ಹಸಿವಾಗಿದೆ.',
  },
  home: {
    glyph: '🏠',
    en: 'Please take me home.', ta: 'தயவுசெய்து என்னை வீட்டிற்கு அழைத்துச் செல்லுங்கள்.', hi: 'कृपया मुझे घर ले चलो।',
    te: 'దయచేసి నన్ను ఇంటికి తీసుకెళ్లండి.', bn: 'দয়া করে আমাকে বাড়ি নিয়ে চলুন।', mr: 'कृपया मला घरी घेऊन चला.', kn: 'ದಯವಿಟ್ಟು ನನ್ನನ್ನು ಮನೆಗೆ ಕರೆದೊಯ್ಯಿರಿ.',
  },
  rest: {
    glyph: '😴',
    en: 'I want to rest.', ta: 'எனக்கு ஓய்வு வேண்டும்.', hi: 'मुझे आराम करना है।',
    te: 'నాకు విశ్రాంతి కావాలి.', bn: 'আমি বিশ্রাম নিতে চাই।', mr: 'मला विश्रांती हवी आहे.', kn: 'ನನಗೆ ವಿಶ್ರಾಂತಿ ಬೇಕು.',
  },
  scared: {
    glyph: '😨',
    en: 'I am scared.', ta: 'எனக்கு பயமாக இருக்கிறது.', hi: 'मुझे डर लग रहा है।',
    te: 'నాకు భయంగా ఉంది.', bn: 'আমার ভয় করছে।', mr: 'मला भीती वाटत आहे.', kn: 'ನನಗೆ ಭಯವಾಗುತ್ತಿದೆ.',
  },
  sick: {
    glyph: '🤒',
    en: 'I feel sick.', ta: 'எனக்கு உடம்பு சரியில்லை.', hi: 'मेरी तबीयत ठीक नहीं है।',
    te: 'నాకు ఒంట్లో బాగోలేదు.', bn: 'আমার শরীর খারাপ লাগছে।', mr: 'मला बरं वाटत नाही.', kn: 'ನನಗೆ ಹುಷಾರಿಲ್ಲ.',
  },
  tired_p: {
    glyph: '🥱',
    en: 'I am tired.', ta: 'எனக்கு சோர்வாக இருக்கிறது.', hi: 'मैं थक गया हूँ।',
    te: 'నాకు అలసటగా ఉంది.', bn: 'আমি ক্লান্ত।', mr: 'मी थकलो आहे.', kn: 'ನನಗೆ ಸುಸ್ತಾಗಿದೆ.',
  },
};
