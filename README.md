# AACASH

**Augmentative and Alternative Communication · Autism Spectrum Helper**

AACASH is a free, offline-first AAC web app for children and non-speaking people in India.
Tap picture symbols to build sentences and speak them aloud in **English, Tamil, Hindi,
Telugu, Bengali, Marathi, or Kannada**. Light and dark themes.

## Getting started

On first run, a split-screen **landing page** collects a username, a caregiver's phone number
(for SOS), and a board language (choose from tappable script chips — English · தமிழ் · हिन्दी ·
తెలుగు · বাংলা · मराठी · ಕನ್ನಡ). From then on it opens straight to the board. Everything else —
grid size, voice, extra guardian numbers, more children — is under the **⚙ Settings** gear in
the top-right; there is no PIN.

## AAC principles followed

- **Core vocabulary first** — high-frequency words (I, you, want, help, more, not, …) are always
  visible in a dedicated block.
- **Motor-planning consistency** — button positions are derived from append-only lists
  ([src/data/vocabulary.js](src/data/vocabulary.js) documents the contract). Buttons never
  reshuffle between sessions, categories, or updates; smaller grids show a *prefix* of the same
  layout.
- **Fitzgerald Key (modified)** — every tile is colour-coded by part of speech: pronouns yellow,
  verbs green, nouns orange, adjectives blue, social words pink, negations red
  (see [src/styles/tokens.css](src/styles/tokens.css)).
- **Sentence strip** with speak (word-by-word pauses), backspace, clear, and undo.
- **Adjustable grids** from 2×2 (core only) to 10×8, per child.
- **Symbol + text** on every button; text-only mode for literate users.
- **Access methods** — full keyboard support, row–column switch scanning with adjustable dwell
  time (Space/Enter as the switch), ≥48px touch targets, adjustable spacing for keyguards.
- **No timeouts, nothing auto-dismisses**, motion respects `prefers-reduced-motion` plus an
  in-app reduce-motion setting; high-contrast mode; adjustable text size.
- **Honest TTS** — language-correct voices via the Web Speech API with per-child rate/pitch;
  when a language has no installed voice the app says so visibly instead of failing silently.

## Features

- **Landing / setup page** — username, caregiver phone, and language in one screen.
- **Formatted board** — core block + category fringe share one uniform grid; empty cells are
  kept as placeholders so a category with few words never looks ragged and positions stay fixed.
- **Guardian SOS** — a red **SOS — call guardian** action (in Settings) with a *slide-to-the-end-
  and-hold-3-seconds* control so it can't fire by accident. Supports **multiple** guardian
  numbers, each with its own slider; on a phone it opens the dialer, on desktop it shows the
  number to dial manually. (Note: `tel:` only places a call on a device with a phone dialer.)
- **On-device word and phrase prediction** — an n-gram model blended with the child's own usage,
  learned per hour of day (kernel-smoothed) and weekday/weekend, so the app anticipates whole
  requests like "I am hungry" before mealtimes. Quick phrases include an adaptive "Right now"
  section.
- **Per-child profiles** · board editor (add words with photos and recorded audio, hide words,
  favourites, reorder categories) · recents & favourites.
- **Dark / light mode** toggle in the top bar · offline-first PWA · JSON backup & restore.

## Privacy

Everything is stored locally (localStorage + IndexedDB). **No accounts, no analytics, no
tracking, no server.** Backups are files the caregiver creates and keeps. See the in-app About
page.

## Local development

```bash
npm install
npm run dev        # dev server
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

Optional maintenance scripts:

```bash
node scripts/fetch-symbols.mjs   # sync OpenMoji SVGs after vocabulary changes
node scripts/make-icons.mjs      # regenerate favicon/PWA icons from the logo
```

## Deployment (Netlify)

The app is fully static; [netlify.toml](netlify.toml) configures the build, SPA fallback,
and caching headers.

```bash
npm install -g netlify-cli
netlify login
netlify init          # first time: create/link the site
netlify deploy --build --prod
```

(Any static host works — deploy the `dist/` folder.)

## Before using with a real child

Read [VERIFICATION.md](VERIFICATION.md). Translations — especially the **emergency phrases** —
must be reviewed by native speakers, and speech output must be tested on the actual device.

## Credits

Symbols: [OpenMoji](https://openmoji.org) (CC BY-SA 4.0) · Type: Inter and Noto Sans (SIL OFL)
· Prediction engine and translations carried forward from the Sira prototype.
AACASH is not a medical device and does not replace guidance from a speech-language pathologist.
