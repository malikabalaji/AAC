/* Sentence strip: taps build the sentence here; speak / backspace / clear
   (with undo). Chips echo the tile's symbol + word for pre-literate users. */
import { SymbolIcon, CustomImage } from './SymbolIcon.jsx';
import { wordLabel } from './Tile.jsx';

function SpeakIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9 v6 h4 l5 4 V5 L8 9 Z" fill="currentColor" />
      <path d="M16.5 8.5 a5 5 0 0 1 0 7 M19 6 a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SentenceStrip({ sentence, langField, langCode, canUndo, onSpeak, onBackspace, onClear, onUndo, speaking }) {
  return (
    <section className="strip" aria-label="Sentence">
      <div className="strip-chips" lang={langCode} aria-live="polite">
        {sentence.length === 0 ? (
          <span className="strip-placeholder" lang="en">
            {canUndo ? 'Sentence cleared.' : 'Tap symbols to build a sentence'}
          </span>
        ) : (
          sentence.map((word, i) => (
            <span key={i} className="strip-chip">
              {word.imageKey ? (
                <CustomImage imageKey={word.imageKey} size={28} />
              ) : (
                <SymbolIcon glyph={word.glyph} size={28} />
              )}
              <span className="strip-chip-word">{wordLabel(word, langField)}</span>
            </span>
          ))
        )}
      </div>
      <div className="strip-actions">
        {canUndo && sentence.length === 0 && (
          <button type="button" className="btn" onClick={onUndo}>
            Undo
          </button>
        )}
        <button type="button" className="icon-btn" onClick={onBackspace} disabled={!sentence.length} aria-label="Delete last word">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 5 h11 a2 2 0 0 1 2 2 v10 a2 2 0 0 1-2 2 H8 L2.5 12 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M11 9.5 l5 5 M16 9.5 l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button type="button" className="icon-btn" onClick={onClear} disabled={!sentence.length} aria-label="Clear sentence">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 7 h14 M10 7 V5 h4 v2 M7 7 l1 13 h8 l1-13 M10.5 11 v5 M13.5 11 v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="btn btn-primary" onClick={onSpeak} disabled={!sentence.length} aria-label="Speak sentence">
          <SpeakIcon />
          <span>{speaking ? 'Speaking…' : 'Speak'}</span>
        </button>
      </div>
    </section>
  );
}
