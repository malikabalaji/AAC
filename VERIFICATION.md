# AACASH — pre-deployment human verification checklist

AACASH passes automated checks (Lighthouse 98/100/100/100, keyboard/switch operability, ARIA,
contrast, offline). The items below **cannot be automated** and must be checked by a human
before the app is used by a real child.

## 1. Translations (native-speaker review) ⚠ safety-critical

Board words and phrases were machine-authored/carried over and need a fluent speaker of each
language (Tamil, Hindi, Telugu, Bengali, Marathi, Kannada) to confirm they are correct, natural,
and child-appropriate:

- [ ] All board words in [src/data/vocabulary.js](src/data/vocabulary.js)
- [ ] All quick phrases in [src/data/phrases.js](src/data/phrases.js) — **the emergency group
      first** (a wrong emergency phrase is worse than none)
- [ ] Listen to spoken output for each — TTS can mispronounce even correct text

## 2. Speech on the real device

- [ ] Test on the child's actual device (tablet recommended). Voice availability differs:
      Chrome desktop bundles online voices; Safari/iOS and Android only speak languages whose
      system voice is installed (iOS: Settings → Accessibility → Spoken Content → Voices;
      Android: install Google TTS language data).
- [ ] Confirm the board language actually speaks aloud, then turn off Wi-Fi and retest.
- [ ] If the "no voice installed" banner shows, install the voice — don't ship silence.

## 3. With the child and their team

- [ ] Have an SLP review the core word set and grid size choice for this child.
- [ ] Confirm switch scanning dwell time suits the child's motor abilities.
- [ ] Record caregiver audio for words the TTS mispronounces (Settings → Edit board → Record voice).
- [ ] Export a backup (Settings → Export) and store it somewhere safe.
