/* A single word tile. Symbol + text always (text-only mode drops the symbol).
   Fitzgerald Key color is applied via the pos-* class — border + pale tint,
   documented in tokens.css. Labels carry the correct lang attribute so
   screen readers switch language. */
import { SymbolIcon, CustomImage } from './SymbolIcon.jsx';

export function wordLabel(word, langField) {
  if (word.labels) return word.labels[langField] || word.labels.en || ''; // custom word
  return word[langField] || word.en;
}

export function Tile({ word, langField, langCode, textOnly, showEnglish, symbolSize = 44, onTap }) {
  const label = wordLabel(word, langField);
  const english = word.labels ? word.labels.en : word.en;
  const showSub = showEnglish && langField !== 'en' && english && english !== label;
  return (
    <button
      type="button"
      className={`tile pressable pos-${word.pos}`}
      onClick={() => onTap(word)}
      aria-label={english && english !== label ? `${label} (${english})` : label}
    >
      {!textOnly &&
        (word.imageKey ? (
          <CustomImage imageKey={word.imageKey} size={symbolSize} />
        ) : (
          <SymbolIcon glyph={word.glyph} size={symbolSize} />
        ))}
      <span className="tile-label" lang={langCode}>
        {label}
      </span>
      {showSub && (
        <span className="tile-sub" lang="en" aria-hidden="true">
          {english}
        </span>
      )}
    </button>
  );
}
