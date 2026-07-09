/* ============================================================================
   ROW-COLUMN SWITCH SCANNING
   Two-stage single-switch access: the highlight steps through ROWS at the
   dwell interval; pressing the switch (Space/Enter, or any switch hardware
   that emulates them) enters the row, then steps through its ITEMS; a second
   press activates the item and scanning returns to row stage.

   Rows are derived from actual on-screen geometry (grouped by top edge), so
   the same code scans the board, quick phrases, and any open dialog.
   Scanning pauses while a text input has focus so caregivers can type.
   ============================================================================ */
import { useEffect, useRef } from 'react';

const SCAN_SCOPE_SELECTOR = '[data-scan-scope]';

function collectRows() {
  // an open modal scopes scanning to itself; otherwise the main scope
  const dialogs = [...document.querySelectorAll('[role="dialog"]')];
  const root = dialogs[dialogs.length - 1] || document.querySelector(SCAN_SCOPE_SELECTOR) || document.body;
  const items = [...root.querySelectorAll('button, [role="button"]')].filter(
    (b) => !b.disabled && b.offsetParent !== null && !b.hasAttribute('data-scan-skip')
  );
  const rows = new Map();
  for (const el of items) {
    const top = Math.round(el.getBoundingClientRect().top / 24) * 24;
    if (!rows.has(top)) rows.set(top, []);
    rows.get(top).push(el);
  }
  return [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, els]) => els.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left));
}

export function useSwitchScan(enabled, dwellMs) {
  const stateRef = useRef({ stage: 'rows', rowIdx: 0, itemIdx: 0, rows: [] });

  useEffect(() => {
    if (!enabled) return;
    const st = stateRef.current;
    st.stage = 'rows';
    st.rowIdx = 0;
    st.itemIdx = 0;

    const clear = () => {
      document.querySelectorAll('.scan-row').forEach((el) => el.classList.remove('scan-row'));
      document.querySelectorAll('.scan-item').forEach((el) => el.classList.remove('scan-item'));
    };

    const paint = () => {
      clear();
      st.rows = collectRows();
      if (!st.rows.length) return;
      st.rowIdx %= st.rows.length;
      const row = st.rows[st.rowIdx];
      if (st.stage === 'rows') {
        row.forEach((el) => el.classList.add('scan-row'));
      } else {
        st.itemIdx %= row.length;
        row[st.itemIdx].classList.add('scan-item');
      }
    };

    const tick = () => {
      st.rows = collectRows();
      if (!st.rows.length) return;
      if (st.stage === 'rows') st.rowIdx = (st.rowIdx + 1) % st.rows.length;
      else st.itemIdx = (st.itemIdx + 1) % st.rows[st.rowIdx % st.rows.length].length;
      paint();
    };

    const select = () => {
      st.rows = collectRows();
      if (!st.rows.length) return;
      if (st.stage === 'rows') {
        st.stage = 'items';
        st.itemIdx = 0;
      } else {
        const row = st.rows[st.rowIdx % st.rows.length];
        const el = row[st.itemIdx % row.length];
        st.stage = 'rows';
        st.rowIdx = 0;
        st.itemIdx = 0;
        clear();
        el?.click();
      }
      paint();
      restartTimer();
    };

    let timer = null;
    const restartTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(tick, dwellMs);
    };

    const onKey = (e) => {
      const t = document.activeElement;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return; // caregiver typing
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        select();
      }
    };

    paint();
    restartTimer();
    window.addEventListener('keydown', onKey, true);
    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('keydown', onKey, true);
      clear();
    };
  }, [enabled, dwellMs]);
}
