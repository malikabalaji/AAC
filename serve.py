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

        # Which languages can this machine speak via `say`?
        if parsed.path == "/sayvoices":
            return self._json({"langs": list(VOICE.keys())})

        # Speak some text.
        if parsed.path == "/say":
            q = urllib.parse.parse_qs(parsed.query)
            text = (q.get("text") or [""])[0]
            lang = (q.get("lang") or ["en"])[0]
            ok = False
            if text and lang in VOICE:
                try:
                    ok = _say_mac(VOICE[lang], text)
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
