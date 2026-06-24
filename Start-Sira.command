#!/bin/bash
# Double-click this file to host Sira locally (with Mac voices) and open it.
cd "$(dirname "$0")"
( sleep 1; open "http://localhost:8000/aac.html" ) &
python3 serve.py
