/* Quick phrases — whole sentences one tap away from anywhere.
   A "Right now" section leads with the phrases the prediction engine expects
   at this time of day, learned from this child's own usage. */
import { useMemo } from 'react';
import { Modal } from './Modal.jsx';
import { SymbolIcon } from './SymbolIcon.jsx';
import { PHRASE_GROUPS, PHRASES } from '../data/phrases.js';
import { predictPhrases } from '../lib/prediction.js';

export function QuickPhrases({ profile, langField, langCode, onSpeak, onClose }) {
  const suggested = useMemo(() => predictPhrases(profile, 3), [profile]);

  const renderPhrase = (pid, tone) => {
    const p = PHRASES[pid];
    if (!p) return null;
    const text = p[langField] || p.en;
    return (
      <button
        key={pid}
        type="button"
        className={`phrase-btn pressable${tone === 'danger' ? ' tone-danger' : ''}`}
        lang={langCode}
        onClick={() => onSpeak(pid)}
      >
        <SymbolIcon glyph={p.glyph} size={36} />
        <span>{text}</span>
      </button>
    );
  };

  return (
    <Modal title="Quick phrases" onClose={onClose} wide labelledBy="qp-title">
      <section aria-label="Suggested right now">
        <h3 className="phrases-group-title">Right now</h3>
        <div className="phrases-grid">{suggested.map((pid) => renderPhrase(pid))}</div>
      </section>
      {PHRASE_GROUPS.map((group) => (
        <section key={group.id} aria-label={group.label}>
          <h3 className="phrases-group-title">{group.label}</h3>
          <div className="phrases-grid">
            {group.phrases.map((pid) => renderPhrase(pid, group.tone))}
          </div>
        </section>
      ))}
      <p className="hint" style={{ marginTop: 'var(--sp-4)' }} lang="en">
        Tap any phrase to speak it aloud. “Right now” adapts to the time of day and what is asked most often.
      </p>
    </Modal>
  );
}
