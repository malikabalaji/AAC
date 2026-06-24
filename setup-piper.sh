#!/bin/bash
# One-time setup for the natural (neural) Malayalam voice.
# Creates a local Python venv and installs Piper TTS. The voice model is
# already in ./piper/ , so this only needs internet to install piper-tts.
#
# Requires Python 3.10+ (e.g. `brew install python@3.12`).
set -e
cd "$(dirname "$0")"

PY="$(command -v python3.12 || command -v python3)"
echo "Using Python: $PY ($($PY --version))"

echo "Creating virtual environment ./piper-venv ..."
"$PY" -m venv piper-venv
./piper-venv/bin/pip install --quiet --upgrade pip
echo "Installing piper-tts (downloads onnxruntime) ..."
./piper-venv/bin/pip install --quiet piper-tts

echo ""
echo "Testing Malayalam synthesis ..."
echo "നമസ്കാരം" | ./piper-venv/bin/python -m piper -m piper/ml_IN-meera-medium.onnx -f /tmp/sira_piper_test.wav
[ -s /tmp/sira_piper_test.wav ] && echo "✅ Piper Malayalam is ready." || echo "⚠️ Synthesis test produced no audio."
echo "Done. Start the app with ./Start-Sira.command"
