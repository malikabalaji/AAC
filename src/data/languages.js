/* Languages supported by AACASH boards.
   `voice` lists BCP-47 tags tried in order when picking a speech voice.
   `field` is the translation key on vocabulary/phrase entries. */

export const LANGUAGES = {
  en: { label: 'English', native: 'English', field: 'en', voice: ['en-IN', 'en-GB', 'en-US', 'en'] },
  ta: { label: 'Tamil', native: 'தமிழ்', field: 'ta', voice: ['ta-IN', 'ta'] },
  hi: { label: 'Hindi', native: 'हिन्दी', field: 'hi', voice: ['hi-IN', 'hi'] },
  te: { label: 'Telugu', native: 'తెలుగు', field: 'te', voice: ['te-IN', 'te'] },
  bn: { label: 'Bengali', native: 'বাংলা', field: 'bn', voice: ['bn-IN', 'bn-BD', 'bn'] },
  mr: { label: 'Marathi', native: 'मराठी', field: 'mr', voice: ['mr-IN', 'mr'] },
  kn: { label: 'Kannada', native: 'ಕನ್ನಡ', field: 'kn', voice: ['kn-IN', 'kn'] },
};

export const LANGUAGE_KEYS = Object.keys(LANGUAGES);
