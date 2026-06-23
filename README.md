# Mynah 🐦

**Tap · Talk · Connect** — a predictive, multilingual AAC (Augmentative and Alternative Communication) board for non-verbal children.

Tap picture symbols to build a sentence; an on-device n-gram model predicts what comes next, re-ranked by time of day, recency, and the child's own usage. Speech output uses the browser's SpeechSynthesis API.

## Languages

English · Tamil · Hindi · Telugu · Bengali · Marathi — pick one on the start screen or switch anytime from the dropdown.

## Run it locally

The app is a single React component (`AAC.jsx`) loaded by `index.html`, which compiles the JSX in the browser. Because it uses `fetch`, it needs to be served over HTTP (not opened as a `file://`):

```bash
cd mynah
python3 -m http.server 8000
```

Then open <http://localhost:8000/> in Chrome or Safari.

## How it works

- **Symbol vocabulary** — emoji pictograms with translations + speakable text per language.
- **N-gram model** — bigram + trigram tables trained on a synthetic AAC sentence corpus.
- **Context re-ranker** — adjusts predictions by time of day, recency, and live per-child frequency.
- **Speech** — picks an Indic voice when the browser provides one.
