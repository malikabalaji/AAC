# Sira 💬

**Tap · Talk · Connect** — a predictive, multilingual AAC (Augmentative and Alternative Communication) board for non-verbal children.

Tap picture symbols to build a sentence; an on-device n-gram model predicts what comes next, re-ranked by time of day, recency, and the child's own usage. Speech is spoken aloud through the device's voices. **Runs fully offline.**

## Languages

English · Tamil · Hindi · Telugu · Bengali · Marathi · Kannada · Malayalam — pick one on the start screen or switch anytime from the dropdown.

## Run it

The app is a single React component (`AAC.jsx`) loaded by `aac.html`, compiled in the browser. A small Python server (`serve.py`) serves it **and** speaks text aloud using the Mac's voices.

```bash
# easiest: double-click Start-Sira.command, or:
python3 serve.py
```

Then open <http://localhost:8000/aac.html>.

Everything it needs (React, fonts, the OpenMoji symbol SVGs) is vendored locally in `vendor/`, `fonts/`, and `icons/`, so it works with no internet.

## Speech / voices

Speech routes through the local server's `/say` endpoint, which is far more reliable than the browser's Web Speech API for Indic voices:

| Languages | Engine | Setup |
|---|---|---|
| Tamil, Telugu, Bengali, Marathi, Kannada, Hindi, English | macOS `say` | Install voices: **System Settings → Accessibility → Spoken Content → System Voice → Manage Voices** |
| Malayalam | **Piper** (neural, natural) | run `./setup-piper.sh` (model included in `piper/`) |

If the Piper venv is missing, Malayalam falls back to **eSpeak NG** (`brew install espeak-ng`, robotic). If the server isn't running at all, the app falls back to the browser's built-in voices.

### Natural Malayalam (Piper) — one-time setup

The neural voice model (`piper/ml_IN-meera-medium.onnx`) is included. You only need to create the Python environment once:

```bash
brew install python@3.12     # if you don't have Python 3.10+
./setup-piper.sh             # creates ./piper-venv and installs piper-tts
```

(`piper-venv/` is git-ignored because it's large and machine-specific — recreate it with the script above.)

## Offline

After the one-time setup above, **nothing touches the internet at runtime** — `say`, Piper, and audio playback all run locally. Turn off Wi-Fi and it still works.

## How it works

- **Symbol vocabulary** — OpenMoji pictograms with translations + speakable text per language.
- **N-gram model** — bigram + trigram tables trained on a synthetic AAC sentence corpus.
- **Context re-ranker** — adjusts predictions by time of day, recency, and live per-child frequency.
- **Speech** — local server speaks via macOS `say` / Piper / eSpeak, with a browser fallback.

## Files

| Path | Purpose |
|---|---|
| `AAC.jsx` | the whole app (React component) |
| `aac.html` / `index.html` | loads + compiles the app in the browser |
| `serve.py` | static server + `/say` speech bridge |
| `Start-Sira.command` | double-click launcher |
| `setup-piper.sh` | one-time Piper (Malayalam) setup |
| `vendor/` `fonts/` `icons/` | local assets for offline use |
| `piper/` | neural Malayalam voice model |
| `voices.html` | browser voice diagnostic page |
