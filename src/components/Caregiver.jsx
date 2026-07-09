/* ============================================================================
   BOARD EDITOR — add custom words (photo + recorded audio), star favourites,
   hide words, reorder category tabs. Reached from the Settings menu.
   ============================================================================ */
import { useRef, useState } from 'react';
import { Modal } from './Modal.jsx';
import { SymbolIcon, CustomImage } from './SymbolIcon.jsx';
import { CATEGORIES, WORDS, POS_LABELS } from '../data/vocabulary.js';
import { LANGUAGES } from '../data/languages.js';
import { mediaPut, mediaDelete, newMediaKey } from '../lib/idb.js';
import { boardCategories } from './Board.jsx';
import { wordLabel } from './Tile.jsx';

/* Downscale an uploaded photo to a small square blob so IndexedDB stays lean. */
async function processImage(file, size = 256) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
}

function AddWordForm({ langField, onAdd, onCancel }) {
  const [labelNative, setLabelNative] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [cat, setCat] = useState('things');
  const [pos, setPos] = useState('noun');
  const [imageBlob, setImageBlob] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const recRef = useRef(null);

  const record = async () => {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: rec.mimeType }));
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      setError('Microphone unavailable. You can still add the word — it will use the app voice.');
    }
  };

  const save = async () => {
    const en = labelEn.trim() || labelNative.trim();
    if (!en) return setError('Give the word a label.');
    const word = {
      id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      cat,
      pos,
      glyph: null,
      labels: { en, [langField]: labelNative.trim() || en },
    };
    if (imageBlob) {
      word.imageKey = newMediaKey('img');
      await mediaPut(word.imageKey, imageBlob);
    }
    if (audioBlob) {
      word.audioKey = newMediaKey('aud');
      await mediaPut(word.audioKey, audioBlob);
    }
    onAdd(word);
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
      <h4 style={{ marginBottom: 'var(--sp-3)', color: 'var(--ac-primary)' }}>New word</h4>
      <div className="row">
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label htmlFor="aw-native">Label ({LANGUAGES[langField]?.label || 'board language'})</label>
          <input id="aw-native" value={labelNative} onChange={(e) => setLabelNative(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label htmlFor="aw-en">Label (English)</label>
          <input id="aw-en" value={labelEn} onChange={(e) => setLabelEn(e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label htmlFor="aw-cat">Category</label>
          <select id="aw-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label htmlFor="aw-pos">Word type (color)</label>
          <select id="aw-pos" value={pos} onChange={(e) => setPos(e.target.value)}>
            {Object.entries(POS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 'var(--sp-3)' }}>
        <label className="btn" style={{ cursor: 'pointer' }}>
          {imageBlob ? 'Photo added ✓' : 'Add photo'}
          <input
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setImageBlob(await processImage(f));
            }}
          />
        </label>
        <button type="button" className={`btn${recording ? ' btn-danger' : ''}`} onClick={record}>
          {recording ? 'Stop recording' : audioBlob ? 'Re-record voice' : 'Record voice'}
        </button>
        {audioBlob && !recording && (
          <button type="button" className="btn btn-ghost" onClick={() => new Audio(URL.createObjectURL(audioBlob)).play()}>
            ▶ Play
          </button>
        )}
      </div>
      {error && (
        <p role="alert" style={{ color: 'var(--ac-danger)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
          {error}
        </p>
      )}
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={save}>
          Add word
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function BoardEditor({ profile, langField, updateProfile, onClose }) {
  const [cat, setCat] = useState('social');
  const [adding, setAdding] = useState(false);
  const cats = boardCategories(profile);
  const hidden = new Set(profile.hiddenWords || []);
  const favs = new Set(profile.favorites || []);
  const words = [...WORDS.filter((w) => w.cat === cat), ...(profile.customWords || []).filter((w) => w.cat === cat)];

  const toggleFav = (id) =>
    updateProfile(profile.id, (p) => ({
      favorites: p.favorites.includes(id) ? p.favorites.filter((f) => f !== id) : [...p.favorites, id],
    }));

  const toggleHide = (word) => {
    if (word.core) return; // core vocabulary can never be hidden — AAC rule
    updateProfile(profile.id, (p) => ({
      hiddenWords: p.hiddenWords.includes(word.id)
        ? p.hiddenWords.filter((h) => h !== word.id)
        : [...p.hiddenWords, word.id],
    }));
  };

  const removeCustom = async (word) => {
    if (word.imageKey) await mediaDelete(word.imageKey);
    if (word.audioKey) await mediaDelete(word.audioKey);
    updateProfile(profile.id, (p) => ({
      customWords: p.customWords.filter((w) => w.id !== word.id),
      favorites: p.favorites.filter((f) => f !== word.id),
      recents: p.recents.filter((r) => r !== word.id),
    }));
  };

  const moveCat = (idx, dir) => {
    const order = [...cats];
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    [order[idx], order[j]] = [order[j], order[idx]];
    updateProfile(profile.id, { catOrder: order });
  };

  return (
    <Modal title="Edit board" onClose={onClose} wide>
      <p className="hint" style={{ marginBottom: 'var(--sp-4)' }}>
        Star words to add them to Favourites, hide fringe words your child doesn’t need yet, or add your own
        words with a photo and your voice. Core words can’t be hidden and never move — that consistency is how
        children learn the board by muscle memory.
      </p>

      <div className="field">
        <label htmlFor="be-cat">Category</label>
        <div className="row">
          <select id="be-cat" value={cat} onChange={(e) => setCat(e.target.value)} style={{ flex: 1 }}>
            {cats.map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c].label}
              </option>
            ))}
          </select>
          <button type="button" className="icon-btn" onClick={() => moveCat(cats.indexOf(cat), -1)} aria-label="Move category earlier">
            ↑
          </button>
          <button type="button" className="icon-btn" onClick={() => moveCat(cats.indexOf(cat), 1)} aria-label="Move category later">
            ↓
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            + Add word
          </button>
        </div>
      </div>

      {adding && (
        <AddWordForm
          langField={langField}
          onCancel={() => setAdding(false)}
          onAdd={(word) => {
            updateProfile(profile.id, (p) => ({ customWords: [...p.customWords, word] }));
            setAdding(false);
            setCat(word.cat);
          }}
        />
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        {words.map((w) => (
          <li key={w.id} className="card row" style={{ padding: 'var(--sp-2) var(--sp-3)' }}>
            {w.imageKey ? <CustomImage imageKey={w.imageKey} size={34} /> : <SymbolIcon glyph={w.glyph} size={34} />}
            <span style={{ flex: 1, fontWeight: 700 }}>
              {wordLabel(w, langField)}
              <span className="tile-sub" style={{ marginLeft: 8 }}>
                {w.core ? 'core · always visible' : POS_LABELS[w.pos]}
              </span>
            </span>
            <button
              type="button"
              className="icon-btn"
              aria-pressed={favs.has(w.id)}
              aria-label={favs.has(w.id) ? `Remove ${wordLabel(w, langField)} from favourites` : `Add ${wordLabel(w, langField)} to favourites`}
              onClick={() => toggleFav(w.id)}
              style={favs.has(w.id) ? { background: 'var(--ac-accent)' } : undefined}
            >
              ★
            </button>
            {!w.core &&
              (String(w.id).startsWith('c_') ? (
                <button type="button" className="btn btn-danger" onClick={() => removeCustom(w)}>
                  Delete
                </button>
              ) : (
                <button type="button" className="btn" aria-pressed={hidden.has(w.id)} onClick={() => toggleHide(w)}>
                  {hidden.has(w.id) ? 'Show' : 'Hide'}
                </button>
              ))}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
