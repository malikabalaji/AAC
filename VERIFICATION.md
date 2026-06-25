# Sira — Pre-Deployment Verification Checklist

Sira passes the automated accessibility checks (contrast, touch targets, keyboard/switch
operability, ARIA, privacy). The items below **cannot be automated** and must be checked by
a human before the app is used by a real child. Treat the SOS items as **safety-critical**.

---

## 1. Translations (native-speaker review)

The symbol words and emergency phrases were generated and need a fluent speaker of each
language to confirm they are correct, natural, and child-appropriate.

- [ ] **Symbol words** — review all symbols in: Tamil, Hindi, Telugu, Bengali, Marathi, Kannada.
- [ ] **SOS emergency phrases** ⚠️ **safety-critical** — confirm the 6 default phrases in every
      language (a wrong emergency phrase is worse than none):
      help · call my mother · I am in pain · I need the toilet · take me home · call a doctor.
- [ ] **Spoken output** — listen to each word/phrase; confirm the voice pronounces it correctly
      (TTS can mispronounce even correct text).

## 2. Speech on the real device

Indic voices are produced by the **local Mac server** (`serve.py`). On other devices the app
falls back to the browser's built-in voices, which may be silent for Indic languages.

- [ ] Decide the **actual device** (Mac / tablet / Chromebook) and test speech there.
- [ ] On a Mac: install voices (System Settings → Accessibility → Spoken Content → Manage Voices)
      and launch via `Start-Sira.command` so the `/say` bridge is used.
- [ ] Confirm every language the child will use **actually speaks aloud** on that device.
- [ ] Confirm it works **offline** (turn off Wi-Fi and retest).

## 3. Screen reader

- [ ] Test with **VoiceOver** (Mac/iOS) or **TalkBack** (Android): tab/swipe through the board,
      predictions, categories, Speak, SOS, and the language chooser.
- [ ] Confirm every control announces a sensible name and the spoken words are read correctly.

## 4. Switch access (if the child uses a switch)

- [ ] Enable **single-switch scanning** (footer) and set a comfortable speed.
- [ ] Confirm the switch device emits **Space/Enter** and that one press selects the highlighted box.
- [ ] Confirm the child can reach the board, predictions, **SOS**, and **language** by scanning.

## 5. SOS / guardian setup

- [ ] Set a **guardian PIN** (SOS → Guardian setup) so the child can't edit emergency phrases.
- [ ] Customize phrases for the child (e.g. parent's name/number, medical needs, address).
- [ ] For custom phrases, **type them in the target language** (custom text is not auto-translated).
- [ ] Test every SOS phrase aloud in its chosen language.

## 6. Clinical / SLP review

- [ ] Have a Speech-Language Pathologist review **vocabulary**, **layout**, and **symbol set**.
- [ ] Note: symbols are **emoji** (OpenMoji), not a clinical AAC symbol system (ARASAAC / PCS /
      SymbolStix). Confirm the child understands them, or plan a symbol-set swap.

## 7. Real-user trial

- [ ] Trial with the child **and** guardian present; observe and adjust speed, vocabulary, and
      categories before relying on it.

---

### Notes
- All data (name, learned usage, SOS phrases, PIN) is stored **only in the browser** on the
  device — nothing is sent anywhere. Clearing the browser's site data resets it.
- The app is designed to run **fully offline** after one-time setup.
