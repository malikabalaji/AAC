/* Settings: per-child voice/language/grid/access settings,
   global display settings, profile management, backup & restore. */
import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal.jsx';
import { LANGUAGES } from '../data/languages.js';
import { GRID_PRESETS } from '../data/vocabulary.js';
import { voicesForLang, voiceStatus, speak, onVoicesChanged } from '../lib/tts.js';
import { exportProfile, importProfile, deleteProfileMedia, newProfile } from '../lib/store.jsx';

const TEST_LINE = {
  en: 'Hello! I can talk with AACASH.',
  ta: 'வணக்கம்! நான் பேச முடியும்.',
  hi: 'नमस्ते! मैं बोल सकता हूँ।',
  te: 'నమస్తే! నేను మాట్లాడగలను.',
  bn: 'নমস্কার! আমি কথা বলতে পারি।',
  mr: 'नमस्कार! मी बोलू शकतो.',
  kn: 'ನಮಸ್ಕಾರ! ನಾನು ಮಾತನಾಡಬಲ್ಲೆ.',
};

export function Settings({ store, onClose }) {
  const { state, activeProfile, setSettings, updateProfile, addProfile, removeProfile } = store;
  const p = activeProfile;
  const [, setVoiceTick] = useState(0);
  const [importError, setImportError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => onVoicesChanged(() => setVoiceTick((t) => t + 1)), []);

  if (!p) return null;
  const voices = voicesForLang(p.lang);
  const status = voiceStatus(p.lang, p.voiceURI);
  const up = (patch) => updateProfile(p.id, patch);

  const doExport = async () => {
    const json = await exportProfile(p);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aacash-${(p.name || 'profile').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doImport = async (file) => {
    try {
      setImportError('');
      const profile = await importProfile(await file.text());
      addProfile(profile);
    } catch (e) {
      setImportError('Could not import: ' + e.message);
    }
  };

  return (
    <Modal title="Preferences" onClose={onClose} wide>
      {/* ---- Profile picker ---- */}
      <section className="card" style={{ marginBottom: 'var(--sp-4)' }} aria-label="Children">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label htmlFor="st-profile">Child</label>
            <select
              id="st-profile"
              value={p.id}
              onChange={(e) => setSettings({ activeProfileId: e.target.value })}
            >
              {state.profiles.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name || 'Unnamed'}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => addProfile(newProfile('New child', p.lang))}
          >
            + Add child
          </button>
          {state.profiles.length > 1 && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                if (confirm(`Delete ${p.name || 'this profile'}? This removes their words and history from this device.`)) {
                  await deleteProfileMedia(p);
                  removeProfile(p.id);
                }
              }}
            >
              Delete child
            </button>
          )}
        </div>
        <div className="row" style={{ marginTop: 'var(--sp-3)' }}>
          <button type="button" className="btn" onClick={doExport}>
            Export
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
          />
        </div>
        {importError && (
          <p role="alert" style={{ color: 'var(--ac-danger)', fontWeight: 700, marginTop: 'var(--sp-2)' }}>
            {importError}
          </p>
        )}
      </section>

      {/* ---- This child's board ---- */}
      <section className="card" style={{ marginBottom: 'var(--sp-4)' }} aria-label="Board settings">
        <div className="row">
          <div className="field" style={{ flex: 1, minWidth: 170 }}>
            <label htmlFor="st-name">Name</label>
            <input id="st-name" value={p.name} onChange={(e) => up({ name: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 170 }}>
            <label htmlFor="st-lang">Board language</label>
            <select id="st-lang" value={p.lang} onChange={(e) => up({ lang: e.target.value, voiceURI: null })}>
              {Object.entries(LANGUAGES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.native} ({v.label})
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1, minWidth: 170 }}>
            <label htmlFor="st-grid">Grid size</label>
            <select id="st-grid" value={p.gridId} onChange={(e) => up({ gridId: e.target.value })}>
              {GRID_PRESETS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <label className="row" style={{ gap: 'var(--sp-2)', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={p.showEnglish}
              onChange={(e) => up({ showEnglish: e.target.checked })}
              style={{ minHeight: 24, width: 24 }}
            />
            Show English
          </label>
          <label className="row" style={{ gap: 'var(--sp-2)', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={p.textOnly}
              onChange={(e) => up({ textOnly: e.target.checked })}
              style={{ minHeight: 24, width: 24 }}
            />
            Text-only tiles
          </label>
        </div>
      </section>

      {/* ---- Voice ---- */}
      <section className="card" style={{ marginBottom: 'var(--sp-4)' }} aria-label="Voice settings">
        {status === 'missing' && (
          <div className="banner banner-warn" style={{ marginBottom: 'var(--sp-3)' }}>
            No {LANGUAGES[p.lang].label} voice is installed on this device, so words can’t be spoken aloud in this
            language. Symbols and text still work. On iOS/Mac add voices under Settings → Accessibility → Spoken
            Content; on Android install Google Text-to-Speech language data; Chrome desktop includes online voices.
          </div>
        )}
        {status === 'unsupported' && (
          <div className="banner banner-warn" style={{ marginBottom: 'var(--sp-3)' }}>
            This browser does not support speech output at all. AACASH will work silently.
          </div>
        )}
        <div className="row">
          <div className="field" style={{ flex: 2, minWidth: 220 }}>
            <label htmlFor="st-voice">Voice</label>
            <select
              id="st-voice"
              value={p.voiceURI || ''}
              onChange={(e) => up({ voiceURI: e.target.value || null })}
            >
              <option value="">Automatic (best match)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1, minWidth: 150 }}>
            <label htmlFor="st-rate">Speed: {p.rate.toFixed(2)}</label>
            <input
              id="st-rate"
              type="range"
              min="0.5"
              max="1.4"
              step="0.05"
              value={p.rate}
              onChange={(e) => up({ rate: Number(e.target.value) })}
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 150 }}>
            <label htmlFor="st-pitch">Pitch: {p.pitch.toFixed(2)}</label>
            <input
              id="st-pitch"
              type="range"
              min="0.6"
              max="1.6"
              step="0.05"
              value={p.pitch}
              onChange={(e) => up({ pitch: Number(e.target.value) })}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => speak(TEST_LINE[p.lang] || TEST_LINE.en, p.lang, p)}
          >
            ▶ Test voice
          </button>
        </div>
      </section>

      {/* ---- Access ---- */}
      <section className="card" style={{ marginBottom: 'var(--sp-4)' }} aria-label="Access settings">
        <div className="row">
          <label className="row" style={{ gap: 'var(--sp-2)', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={p.scan.on}
              onChange={(e) => up({ scan: { ...p.scan, on: e.target.checked } })}
              style={{ minHeight: 24, width: 24 }}
            />
            Switch scanning
          </label>
          {p.scan.on && (
            <div className="field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label htmlFor="st-dwell">Scan step: {(p.scan.dwellMs / 1000).toFixed(1)}s</label>
              <input
                id="st-dwell"
                type="range"
                min="600"
                max="4000"
                step="100"
                value={p.scan.dwellMs}
                onChange={(e) => up({ scan: { ...p.scan, dwellMs: Number(e.target.value) } })}
              />
            </div>
          )}
          <div className="field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label htmlFor="st-gap">Spacing: {p.tileGap}px</label>
            <input
              id="st-gap"
              type="range"
              min="6"
              max="28"
              step="2"
              value={p.tileGap}
              onChange={(e) => up({ tileGap: Number(e.target.value) })}
            />
          </div>
        </div>
        {p.scan.on && (
          <p className="hint" style={{ marginTop: 'var(--sp-2)' }}>
            Press <b>Space</b> or <b>Enter</b> (or a switch that sends them) to select. First press picks the row,
            second press picks the button.
          </p>
        )}
      </section>

      {/* ---- Display (global) ---- */}
      <section className="card" style={{ marginBottom: 'var(--sp-4)' }} aria-label="Display settings">
        <div className="row">
          <div className="field" style={{ flex: 1, minWidth: 170 }}>
            <label htmlFor="st-scale">Text size: {Math.round(state.settings.textScale * 100)}%</label>
            <input
              id="st-scale"
              type="range"
              min="0.85"
              max="1.5"
              step="0.05"
              value={state.settings.textScale}
              onChange={(e) => setSettings({ textScale: Number(e.target.value) })}
            />
          </div>
          <label className="row" style={{ gap: 'var(--sp-2)', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={state.settings.contrast === 'high'}
              onChange={(e) => setSettings({ contrast: e.target.checked ? 'high' : 'normal' })}
              style={{ minHeight: 24, width: 24 }}
            />
            High contrast
          </label>
          <label className="row" style={{ gap: 'var(--sp-2)', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={state.settings.motion === 'reduced'}
              onChange={(e) => setSettings({ motion: e.target.checked ? 'reduced' : 'auto' })}
              style={{ minHeight: 24, width: 24 }}
            />
            Reduce motion
          </label>
        </div>
      </section>

    </Modal>
  );
}
