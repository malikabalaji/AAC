# Sira 💬

**Tap · Talk · Connect** — a predictive, multilingual AAC (Augmentative and Alternative Communication) board for non-verbal children.

Tap picture symbols to build a sentence; an on-device n-gram model predicts what comes next, re-ranked by time of day, recency, and the child's own usage. Speech is spoken aloud through the device's voices. **Runs fully offline.**

## Languages

English · Tamil · Hindi · Telugu · Bengali · Marathi · Kannada — pick one on the start screen or switch anytime from the dropdown.

## Run it

The app is a single React component (`AAC.jsx`) loaded by `aac.html`, compiled in the browser. A small Python server (`serve.py`) serves it **and** speaks text aloud using the Mac's voices.

```bash
# easiest: double-click Start-Sira.command, or:
python3 serve.py
```

Then open <http://localhost:8000/aac.html>.

Everything it needs (React, fonts, the OpenMoji symbol SVGs) is vendored locally in `vendor/`, `fonts/`, and `icons/`, so it works with no internet.

## Speech / voices

Speech routes through the local server's `/say` endpoint, which uses the Mac's
built-in `say` command — far more reliable than the browser's Web Speech API for
Indic voices. If the server isn't running, the app falls back to the browser's
built-in voices.

Install the voices once via **System Settings → Accessibility → Spoken Content →
System Voice → Manage Voices** (Tamil, Telugu, Bengali, Marathi, Kannada, Hindi).
Once installed they work offline.

## Offline

After installing the voices, **nothing touches the internet at runtime** — `say`
and audio playback run locally. Turn off Wi-Fi and it still works.

## How it works

- **Symbol vocabulary** — OpenMoji pictograms with translations + speakable text per language.
- **N-gram model** — bigram + trigram tables trained on a synthetic AAC sentence corpus.
- **Context re-ranker** — adjusts predictions by time of day, recency, and live per-child frequency.
- **Speech** — local server speaks via macOS `say`, with a browser fallback.

## Files

| Path | Purpose |
|---|---|
| `AAC.jsx` | the whole app (React component) |
| `aac.html` / `index.html` | loads + compiles the app in the browser |
| `serve.py` | static server + `/say` speech bridge |
| `Start-Sira.command` | double-click launcher |
| `vendor/` `fonts/` `icons/` | local assets for offline use |
| `voices.html` | browser voice diagnostic page |
