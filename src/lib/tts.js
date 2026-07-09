/* ============================================================================
   SPEECH — Web Speech API only (no server), honest about availability.
   Chrome exposes Google voices (good Indic coverage online); Safari/iOS only
   speak languages whose system voice is installed. Voice lists also load
   late on both, so we poll briefly and re-check on `voiceschanged`.
   When no voice exists for a language we SAY SO in the UI (voiceStatus) —
   never fail silently.
   ============================================================================ */
import { LANGUAGES } from '../data/languages.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

let cachedVoices = [];
const listeners = new Set();

function refreshVoices() {
  if (!synth) return;
  const v = synth.getVoices() || [];
  if (v.length !== cachedVoices.length) {
    cachedVoices = v;
    listeners.forEach((fn) => fn(v));
  }
}

if (synth) {
  refreshVoices();
  synth.onvoiceschanged = refreshVoices;
  // Safari/Chrome sometimes populate the list late with no event.
  let tries = 0;
  const poll = setInterval(() => {
    refreshVoices();
    if (++tries > 20 || cachedVoices.length) clearInterval(poll);
  }, 250);
}

export function onVoicesChanged(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getVoices() {
  if (synth) {
    const live = synth.getVoices() || [];
    if (live.length > cachedVoices.length) cachedVoices = live;
  }
  return cachedVoices;
}

const norm = (s) => (s || '').toLowerCase().replace(/_/g, '-');

/* Best installed voice for a language; honors an explicit per-profile
   voiceURI choice when that voice still exists. */
export function pickVoice(langKey, voiceURI) {
  const list = getVoices();
  if (voiceURI) {
    const chosen = list.find((v) => v.voiceURI === voiceURI);
    if (chosen) return chosen;
  }
  for (const pref of LANGUAGES[langKey]?.voice || []) {
    const v = list.find((v) => norm(v.lang).startsWith(norm(pref)));
    if (v) return v;
  }
  return null;
}

export function voicesForLang(langKey) {
  const prefs = (LANGUAGES[langKey]?.voice || []).map(norm);
  return getVoices().filter((v) => prefs.some((p) => norm(v.lang).startsWith(p)));
}

/* 'ok' | 'missing' | 'unsupported' — drives the visible voice warning. */
export function voiceStatus(langKey, voiceURI) {
  if (!synth) return 'unsupported';
  if (getVoices().length === 0) return 'ok'; // list not loaded yet — don't cry wolf
  return pickVoice(langKey, voiceURI) ? 'ok' : 'missing';
}

export function stopSpeaking() {
  synth?.cancel();
}

/* Speak one text chunk. opts: { rate, pitch, voiceURI, onend } */
export function speak(text, langKey, opts = {}) {
  if (!synth || !text) return;
  synth.cancel();
  queueUtterance(text, langKey, opts);
}

/* Speak a sentence as one utterance per word/chunk. The engine's natural
   inter-utterance gap gives the sentence its pauses. */
export function speakSequence(chunks, langKey, opts = {}) {
  if (!synth || !chunks.length) return;
  synth.cancel();
  chunks.forEach((c, i) =>
    queueUtterance(c, langKey, i === chunks.length - 1 ? opts : { ...opts, onend: null })
  );
}

function queueUtterance(text, langKey, { rate = 0.9, pitch = 1.1, voiceURI, onend } = {}) {
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(langKey, voiceURI);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = LANGUAGES[langKey]?.voice[0] || 'en';
  }
  u.rate = rate;
  u.pitch = pitch;
  if (onend) u.onend = onend;
  synth.speak(u);
}

/* Caregiver-recorded audio takes precedence over TTS for a word. */
let activeAudio = null;
export function playBlob(blob) {
  stopSpeaking();
  if (activeAudio) {
    activeAudio.pause();
    URL.revokeObjectURL(activeAudio.src);
  }
  const url = URL.createObjectURL(blob);
  activeAudio = new Audio(url);
  activeAudio.play().catch(() => {});
  activeAudio.onended = () => {
    URL.revokeObjectURL(url);
    activeAudio = null;
  };
}
