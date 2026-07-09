/* Generates the favicon + PWA icon set from public/aacash-mark.svg.
   Run: node scripts/make-icons.mjs */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/aacash-mark.svg', import.meta.url));

// Maskable icons need the mark inside an 80% safe zone on a solid background.
const maskable = (size) =>
  sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#1d5f5f',
    },
  })
    .composite([
      {
        input: svg,
        // sharp rasterizes SVG at its natural density; resize the mark to 78%
        // of the tile and center it.
        top: Math.round(size * 0.11),
        left: Math.round(size * 0.11),
      },
    ]);

async function run() {
  await sharp(svg, { density: 300 }).resize(512, 512).png().toFile('public/icon-512.png');
  await sharp(svg, { density: 300 }).resize(192, 192).png().toFile('public/icon-192.png');
  await sharp(svg, { density: 300 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  await sharp(svg, { density: 300 }).resize(64, 64).png().toFile('public/favicon-64.png');

  const inner512 = await sharp(svg, { density: 300 }).resize(400, 400).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: '#1d5f5f' } })
    .composite([{ input: inner512, top: 56, left: 56 }])
    .png()
    .toFile('public/icon-512-maskable.png');

  const inner192 = await sharp(svg, { density: 300 }).resize(150, 150).png().toBuffer();
  await sharp({ create: { width: 192, height: 192, channels: 4, background: '#1d5f5f' } })
    .composite([{ input: inner192, top: 21, left: 21 }])
    .png()
    .toFile('public/icon-192-maskable.png');

  // Social share card: mark on cream with room for the crawler crop.
  const inner = await sharp(svg, { density: 300 }).resize(420, 420).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#fbf3e4' } })
    .composite([{ input: inner, top: 105, left: 390 }])
    .png()
    .toFile('public/og-card.png');

  console.log('icons written');
}
run();
