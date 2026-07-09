import { useEffect, useMemo, useState } from 'react';
import { useStore } from './lib/store.jsx';
import { LANGUAGES } from './data/languages.js';
import { WORD_BY_ID } from './data/vocabulary.js';
import { PHRASES } from './data/phrases.js';
import { predictNext, predictPhrases, learnTap, learnPhrase } from './lib/prediction.js';
import { speak, speakSequence, voiceStatus, onVoicesChanged, playBlob, stopSpeaking } from './lib/tts.js';
import { mediaGet } from './lib/idb.js';
import { useSwitchScan } from './hooks/useSwitchScan.js';
import { AacashWordmark } from './components/Logo.jsx';
import { SymbolIcon } from './components/SymbolIcon.jsx';
import { SentenceStrip } from './components/SentenceStrip.jsx';
import { Board } from './components/Board.jsx';
import { wordLabel } from './components/Tile.jsx';
import { QuickPhrases } from './components/QuickPhrases.jsx';
import { Onboarding } from './components/Onboarding.jsx';
import { SosCall } from './components/SosCall.jsx';
import { BoardEditor } from './components/Caregiver.jsx';
import { Settings } from './components/Settings.jsx';
import { About } from './components/About.jsx';
import { Modal } from './components/Modal.jsx';

function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2.5 v2.7 M12 18.8 v2.7 M2.5 12 h2.7 M18.8 12 h2.7 M5 5 l1.9 1.9 M17.1 17.1 L19 19 M19 5 l-1.9 1.9 M6.9 17.1 L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 14.5 A8.5 8.5 0 1 1 9.5 4 a7 7 0 0 0 10.5 10.5 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5 h16 v11 H10 l-4.5 4 V16 H4 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="9" cy="10.5" r="1.3" fill="currentColor" />
      <circle cx="12.5" cy="10.5" r="1.3" fill="currentColor" />
      <circle cx="16" cy="10.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

export default function App() {
  const store = useStore();
  const { state, activeProfile, setSettings, updateProfile, addProfile } = store;

  const [sentence, setSentence] = useState([]); // array of word objects
  const [cleared, setCleared] = useState(null);
  const [activeCat, setActiveCat] = useState('people');
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null); // 'phrases' | 'menu' | 'edit' | 'settings' | 'about'
  const [speaking, setSpeaking] = useState(false);
  const [, voiceTick] = useState(0);

  useEffect(() => onVoicesChanged(() => voiceTick((t) => t + 1)), []);

  const p = activeProfile;
  const scanEnabled = !!p?.scan.on && !modal;
  useSwitchScan(scanEnabled, p?.scan.dwellMs || 1500);

  const langField = p ? LANGUAGES[p.lang].field : 'en';
  const predictions = useMemo(
    () => (p ? predictNext(sentence.map((w) => w.id), p, 4) : []),
    [sentence, p]
  );
  // whole-request prediction: only offered before the child starts a sentence
  const phraseIdeas = useMemo(
    () => (p && sentence.length === 0 ? predictPhrases(p, 2) : []),
    [sentence.length, p]
  );

  if (!state.settings.onboarded || !p) {
    return (
      <Onboarding
        onDone={(profile) => {
          addProfile(profile);
          setSettings({ onboarded: true, activeProfileId: profile.id });
        }}
      />
    );
  }

  const vStatus = voiceStatus(p.lang, p.voiceURI);
  const isDark = state.settings.theme
    ? state.settings.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;

  const speakWord = async (word) => {
    if (word.audioKey) {
      const blob = await mediaGet(word.audioKey).catch(() => null);
      if (blob) return playBlob(blob);
    }
    speak(wordLabel(word, langField), p.lang, p);
  };

  const onTap = (word) => {
    setCleared(null);
    const prev = sentence[sentence.length - 1]?.id;
    setSentence((s) => [...s, word]);
    updateProfile(p.id, (prof) => ({
      ...learnTap(prof, word.id, prev),
      recents: word.core
        ? prof.recents
        : [word.id, ...prof.recents.filter((r) => r !== word.id)].slice(0, 16),
    }));
    speakWord(word);
  };

  const speakPhrase = (phraseId) => {
    const phrase = PHRASES[phraseId];
    if (!phrase) return;
    updateProfile(p.id, (prof) => learnPhrase(prof, phraseId));
    speak(phrase[langField] || phrase.en, p.lang, p);
  };

  const speakAll = () => {
    if (!sentence.length) return;
    setSpeaking(true);
    speakSequence(
      sentence.map((w) => wordLabel(w, langField)),
      p.lang,
      { rate: p.rate, pitch: p.pitch, voiceURI: p.voiceURI, onend: () => setSpeaking(false) }
    );
    // safety: clear the speaking flag even if onend never fires (Safari quirk)
    setTimeout(() => setSpeaking(false), 15000);
  };

  const closeModal = () => setModal(null);

  return (
    <div className="app-shell" data-scan-scope>
      <a href="#board" className="visually-hidden">
        Skip to communication board
      </a>
      <header className="topbar">
        <h1 className="visually-hidden">AACASH communication board</h1>
        <AacashWordmark markSize={42} />
        <div className="topbar-actions">
          <span className="user-pill" aria-label={`Current user: ${p.name}`}>
            <span className="user-avatar" aria-hidden="true">
              {(p.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <span className="user-name">{p.name}</span>
          </span>
          <button type="button" className="btn btn-primary" onClick={() => setModal('phrases')}>
            <ChatIcon />
            <span>Quick phrases</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettings({ theme: isDark ? 'light' : 'dark' })}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
            data-scan-skip
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setModal('menu')}
            aria-label="Settings and board editing"
            data-scan-skip
          >
            <GearIcon />
          </button>
        </div>
      </header>

      {vStatus === 'missing' && (
        <div className="banner banner-warn" role="status">
          No {LANGUAGES[p.lang].label} voice is installed on this device, so taps won’t be spoken aloud.
          Symbols and text still work — open Settings for help adding voices.
        </div>
      )}
      {vStatus === 'unsupported' && (
        <div className="banner banner-warn" role="status">
          This browser can’t speak text aloud. AACASH still works as a silent symbol board.
        </div>
      )}

      <SentenceStrip
        sentence={sentence}
        langField={langField}
        langCode={p.lang}
        canUndo={!!cleared}
        speaking={speaking}
        onSpeak={speakAll}
        onBackspace={() => {
          stopSpeaking();
          setSentence((s) => s.slice(0, -1));
        }}
        onClear={() => {
          stopSpeaking();
          if (sentence.length) setCleared(sentence);
          setSentence([]);
        }}
        onUndo={() => {
          setSentence(cleared || []);
          setCleared(null);
        }}
      />

      {(predictions.length > 0 || phraseIdeas.length > 0) && (
        <section className="pred-row" aria-label="Suggestions">
          <span className="pred-label" aria-hidden="true">
            Ideas
          </span>
          {phraseIdeas.map((pid) => {
            const phrase = PHRASES[pid];
            return (
              <button
                key={pid}
                type="button"
                className="pred-tile pred-phrase pressable"
                lang={p.lang}
                onClick={() => speakPhrase(pid)}
              >
                {!p.textOnly && <SymbolIcon glyph={phrase.glyph} size={26} />}
                <span>{phrase[langField] || phrase.en}</span>
              </button>
            );
          })}
          {predictions.map((id) => {
            const w = WORD_BY_ID[id];
            return (
              <button
                key={id}
                type="button"
                className="pred-tile pressable"
                lang={p.lang}
                onClick={() => onTap(w)}
              >
                {!p.textOnly && <SymbolIcon glyph={w.glyph} size={30} />}
                <span>{wordLabel(w, langField)}</span>
              </button>
            );
          })}
        </section>
      )}

      <main id="board" style={{ display: 'contents' }}>
        <Board
          profile={p}
          langField={langField}
          langCode={p.lang}
          activeCat={activeCat}
          onSelectCat={(c) => {
            setActiveCat(c);
            setPage(0);
          }}
          page={page}
          onPage={setPage}
          onTap={onTap}
        />
      </main>

      {modal === 'phrases' && (
        <QuickPhrases
          profile={p}
          langField={langField}
          langCode={p.lang}
          onClose={closeModal}
          onSpeak={speakPhrase}
        />
      )}
      {modal === 'menu' && (
        <Modal title="Settings" onClose={closeModal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <button type="button" className="btn btn-danger" onClick={() => setModal('sos')}>
              SOS — call guardian
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setModal('edit')}>
              Edit board
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setModal('settings')}>
              Preferences
            </button>
            <button type="button" className="btn" onClick={() => setModal('about')}>
              About
            </button>
          </div>
        </Modal>
      )}
      {modal === 'sos' && (
        <SosCall profile={p} updateProfile={updateProfile} onClose={() => setModal('menu')} />
      )}
      {modal === 'edit' && (
        <BoardEditor profile={p} langField={langField} updateProfile={updateProfile} onClose={() => setModal('menu')} />
      )}
      {modal === 'settings' && <Settings store={store} onClose={() => setModal('menu')} />}
      {modal === 'about' && <About onClose={() => setModal('menu')} />}
    </div>
  );
}
