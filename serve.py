#!/usr/bin/env python3
"""
Sira local server.

Serves the static app AND exposes a /say endpoint that speaks text using the
Mac's built-in `say` command. This is far more reliable than the browser's
Web Speech API for newly-installed Indic system voices.

Run:  python3 serve.py     then open  http://localhost:8000/aac.html
"""
import http.server
import socketserver
import urllib.parse
import subprocess
import shutil
import tempfile
import os
import json

PORT = 8000

# Language -> installed macOS `say` voice. Run `say -v '?'` to see what's on
# this machine. Add a line here if you install a new voice.
VOICE = {
    "ta": "Vani",     # Tamil
    "te": "Geeta",    # Telugu
    "bn": "Piya",     # Bengali
    "mr": "Ananya",   # Marathi
    "kn": "Soumya",   # Kannada
    "hi": "Lekha",    # Hindi
    "en": "Samantha", # English
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Languages with no macOS voice, spoken offline via Piper (natural, neural).
# Models live in ./piper/ ; synthesis runs in the local ./piper-venv.
PIPER_PY = os.path.join(BASE_DIR, "piper-venv", "bin", "python")
PIPER_MODELS = {
    "ml": os.path.join(BASE_DIR, "piper", "ml_IN-meera-medium.onnx"),  # Malayalam (Meera)
}
PIPER_OK = os.path.exists(PIPER_PY)

# eSpeak NG — robotic fallback if a Piper model/venv is missing.
ESPEAK = {
    "ml": "ml",       # Malayalam
}
ESPEAK_BIN = shutil.which("espeak-ng") or "/opt/homebrew/bin/espeak-ng"

_current = None  # the in-flight speech process, so we can cancel/overlap-stop


def _stop_current():
    global _current
    if _current and _current.poll() is None:
        _current.terminate()


def _say_mac(voice, text):
    global _current
    _stop_current()
    _current = subprocess.Popen(["say", "-v", voice, text])
    return True


def _say_piper(model, text):
    global _current
    if not (PIPER_OK and os.path.exists(model)):
        return False
    _stop_current()
    wav = tempfile.mktemp(suffix=".wav")
    subprocess.run(
        [PIPER_PY, "-m", "piper", "-m", model, "-f", wav],
        input=text.encode("utf-8"),
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    if os.path.exists(wav) and os.path.getsize(wav) > 0:
        _current = subprocess.Popen(["afplay", wav])
        return True
    return False


def _say_espeak(code, text):
    global _current
    if not os.path.exists(ESPEAK_BIN):
        return False
    _stop_current()
    wav = tempfile.mktemp(suffix=".wav")
    # synthesize (fast), then play; -s speed, -p pitch (child-like)
    subprocess.run([ESPEAK_BIN, "-v", code, "-s", "150", "-p", "70", "-w", wav, text])
    _current = subprocess.Popen(["afplay", wav])
    return True


class Handler(http.server.SimpleHTTPRequestHandler):
    def _json(self, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        # Which languages can this machine speak (Mac voices + Piper + eSpeak)?
        if parsed.path == "/sayvoices":
            langs = list(VOICE.keys())
            for l in list(PIPER_MODELS.keys()) + list(ESPEAK.keys()):
                if l not in langs:
                    langs.append(l)
            return self._json({"langs": langs})

        # Speak some text.
        if parsed.path == "/say":
            q = urllib.parse.parse_qs(parsed.query)
            text = (q.get("text") or [""])[0]
            lang = (q.get("lang") or ["en"])[0]
            ok = False
            if text:
                try:
                    if lang in VOICE:
                        ok = _say_mac(VOICE[lang], text)
                    elif lang in PIPER_MODELS and _say_piper(PIPER_MODELS[lang], text):
                        ok = True
                    elif lang in ESPEAK:
                        ok = _say_espeak(ESPEAK[lang], text)
                except Exception:
                    ok = False
            return self._json({"ok": ok})

        return super().do_GET()

    def log_message(self, *args):
        pass  # quiet


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("================================================")
        print(f"  Sira hosted at http://localhost:{PORT}/aac.html")
        print(f"  Speech via Mac voices: {', '.join(VOICE.keys())}")
        print("  Press Ctrl+C to stop.")
        print("================================================")
        httpd.serve_forever()
