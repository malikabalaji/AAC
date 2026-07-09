/* Collects every glyph used in the app data, then ensures a local OpenMoji
   color SVG exists in public/symbols/ — copying from the old prototype's
   icon folder when available, otherwise downloading from the OpenMoji repo.
   OpenMoji is CC BY-SA 4.0 (credited on the About page).
   Run: node scripts/fetch-symbols.mjs */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';

const DATA_FILES = ['src/data/vocabulary.js', 'src/data/phrases.js'];
const EXTRA_GLYPHS = ['🔊', '⭐', '🕒', '🔇']; // UI glyphs rendered as symbols
const LEGACY_DIR = '../mynah/icons';
const OUT_DIR = 'public/symbols';
const RAW = 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg';

const emojiRe = /glyph:\s*'([^']+)'/g;
const glyphs = new Set(EXTRA_GLYPHS);
for (const f of DATA_FILES) {
  for (const m of readFileSync(f, 'utf8').matchAll(emojiRe)) glyphs.add(m[1]);
}

// OpenMoji filenames: hex codepoints joined by '-', VS16 (FE0F) dropped, ZWJ kept.
function fileName(emoji) {
  const cps = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfe0f) continue;
    cps.push(cp.toString(16).toUpperCase());
  }
  return cps.join('-') + '.svg';
}

let copied = 0, downloaded = 0, failed = [];
for (const g of glyphs) {
  const name = fileName(g);
  const dest = `${OUT_DIR}/${name}`;
  if (existsSync(dest)) continue;
  if (existsSync(`${LEGACY_DIR}/${name}`)) {
    copyFileSync(`${LEGACY_DIR}/${name}`, dest);
    copied++;
    continue;
  }
  try {
    const res = await fetch(`${RAW}/${name}`);
    if (!res.ok) throw new Error(res.status);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    downloaded++;
  } catch (e) {
    failed.push(`${g} (${name}): ${e.message}`);
  }
}
console.log(`glyphs: ${glyphs.size}, copied: ${copied}, downloaded: ${downloaded}`);
if (failed.length) {
  console.log('FAILED (app will fall back to native emoji for these):');
  failed.forEach((f) => console.log('  ' + f));
}
