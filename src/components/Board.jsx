/* ============================================================================
   THE COMMUNICATION BOARD
   One formatted grid: category tabs sit above the board; below them the core
   block (left) and fringe block (right) share identical row heights and
   column widths, separated by the same gap as between tiles — so the whole
   board reads as a single uniform cols×rows grid.

   Core vocabulary is ALWAYS visible, fixed positions, column-major from
   CORE_ORDER (prefix rule per grid size). Never reorders. Never pages.
   Fringe is the active category, canonical order, paged.
   See vocabulary.js for the motor-planning contract.
   ============================================================================ */
import { useMemo } from 'react';
import { CATEGORIES, CORE_ORDER, GRID_BY_ID, WORD_BY_ID, categoryWords } from '../data/vocabulary.js';
import { Tile } from './Tile.jsx';
import { SymbolIcon } from './SymbolIcon.jsx';

const PSEUDO_TABS = [
  { id: 'fav', label: 'Favourites', glyph: '⭐' },
  { id: 'recent', label: 'Recents', glyph: '🕒' },
];

export function boardCategories(profile) {
  const order = profile.catOrder?.length ? profile.catOrder : Object.keys(CATEGORIES);
  return order.filter((c) => CATEGORIES[c]);
}

/* Fringe words for a category tab, canonical order, hidden filtered,
   custom words appended (append-only ⇒ stable positions). */
export function fringeWords(profile, cat) {
  const hidden = new Set(profile.hiddenWords || []);
  const custom = (profile.customWords || []).filter((w) => w.cat === cat);
  if (cat === 'fav') {
    return (profile.favorites || [])
      .map((id) => WORD_BY_ID[id] || (profile.customWords || []).find((w) => w.id === id))
      .filter(Boolean)
      .filter((w) => !hidden.has(w.id));
  }
  if (cat === 'recent') {
    return (profile.recents || [])
      .map((id) => WORD_BY_ID[id] || (profile.customWords || []).find((w) => w.id === id))
      .filter(Boolean);
  }
  return [...categoryWords(cat).filter((w) => !w.core && !hidden.has(w.id)), ...custom];
}

export function Board({ profile, langField, langCode, activeCat, onSelectCat, page, onPage, onTap }) {
  const grid = GRID_BY_ID[profile.gridId] || GRID_BY_ID['6x4'];
  const { cols, rows, coreCols } = grid;
  const fringeCols = cols - coreCols;

  const coreWords = useMemo(
    () => CORE_ORDER.slice(0, coreCols * rows).map((id) => WORD_BY_ID[id]),
    [coreCols, rows]
  );

  const words = useMemo(() => fringeWords(profile, activeCat), [profile, activeCat]);
  const pageSize = fringeCols * rows;
  const pageCount = Math.max(1, Math.ceil(words.length / pageSize || 1));
  const safePage = Math.min(page, pageCount - 1);
  const pageWords = words.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const cellCount = cols * rows;
  const tileProps = {
    langField,
    langCode,
    textOnly: profile.textOnly,
    showEnglish: profile.showEnglish,
    // fewer, larger cells → larger symbols
    symbolSize: cellCount <= 9 ? 88 : cellCount <= 24 ? 56 : 44,
    onTap,
  };

  const rowTemplate = `repeat(${rows}, minmax(76px, 1fr))`;
  const tabs = [...boardCategories(profile).map((c) => ({ id: c, ...CATEGORIES[c] })), ...PSEUDO_TABS];

  return (
    <div className="board" style={{ '--tile-gap': `${profile.tileGap}px` }}>
      {fringeCols > 0 && (
        <div className="cat-tabs" role="tablist" aria-label="Word categories">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeCat === t.id}
              className="cat-tab"
              onClick={() => onSelectCat(t.id)}
            >
              <SymbolIcon glyph={t.glyph} size={22} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="board-wrap">
        <section
          className="core-grid"
          aria-label="Core words"
          style={{
            flex: fringeCols > 0 ? coreCols : 1,
            gridTemplateColumns: `repeat(${coreCols}, 1fr)`,
            gridTemplateRows: rowTemplate,
          }}
        >
          {coreWords.map((w) => (
            <Tile key={w.id} word={w} {...tileProps} />
          ))}
        </section>

        {fringeCols > 0 &&
          (pageWords.length === 0 ? (
            <div
              className="card"
              style={{ flex: fringeCols, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <p className="hint" style={{ textAlign: 'center' }}>
                {activeCat === 'fav'
                  ? 'No favourites yet. Star words under Edit board.'
                  : activeCat === 'recent'
                    ? 'No recent words yet. Tap some symbols!'
                    : 'No words in this category.'}
              </p>
            </div>
          ) : (
            <div
              className="fringe-grid"
              role="tabpanel"
              aria-label={tabs.find((t) => t.id === activeCat)?.label}
              style={{
                flex: fringeCols,
                gridTemplateColumns: `repeat(${fringeCols}, 1fr)`,
                gridTemplateRows: rowTemplate,
              }}
            >
              {pageWords.map((w) => (
                <Tile key={w.id} word={w} {...tileProps} />
              ))}
              {/* pad the page with placeholder cells so the grid is always
                  complete — no ragged gaps when a category has few words */}
              {Array.from({ length: pageSize - pageWords.length }, (_, i) => (
                <div key={`empty-${i}`} className="tile-empty" aria-hidden="true" />
              ))}
            </div>
          ))}
      </div>

      {pageCount > 1 && (
        <nav className="pager" aria-label="More words">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M12.5 4 L6.5 10 L12.5 16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span aria-live="polite">
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            aria-label="Next page"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M7.5 4 L13.5 10 L7.5 16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </nav>
      )}
    </div>
  );
}
