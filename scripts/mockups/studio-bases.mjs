// Calques « réalistes » du studio, extraits de l'atelier coques.
//
// Le rendu de l'atelier est linéaire par rapport au motif (vérifié : écart
// max 2/255) : rendu(motif) = K + M × motif, avec K = rendu avec un motif
// noir et M = rendu blanc − rendu noir. Le studio reproduit donc exactement
// l'atelier en direct, avec deux images par modèle posées sur le design :
//   M en mix-blend-mode: multiply, puis K en mix-blend-mode: plus-lighter.
//
// Usage : node scripts/mockups/studio-bases.mjs [--models iphone-16,galaxy-s25]
// Sortie : public/images/studio/real/<id>-k.webp, <id>-m.webp
//          src/data/studio-real.json (zone imprimable et cadre, en px de la base)
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';

setTimeout(() => { console.error('Délai dépassé'); process.exit(2); }, 600000);
const ATELIER = process.env.ATELIER_HTML ||
  '/Users/amatquentin/Documents/Codex/2026-10-06/genere-moi-image-produit-de-cette/outputs/atelier-coques/index.html';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const i = args.indexOf('--models');
const only = i > -1 ? args[i + 1].split(',') : null;

const OUT = 'public/images/studio/real';
mkdirSync(OUT, { recursive: true });
const manifestPath = 'src/data/studio-real.json';
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[atelier] ' + e.message));
await page.goto('file://' + ATELIER, { waitUntil: 'load' });
await page.waitForFunction('typeof photoReady !== "undefined"');
await page.evaluate('photoReady');

// Rendu dans l'espace de la base (1024 × 1536), sans la mise à l'échelle
// de l'export : même fonction render(), transformation retirée.
await page.evaluate(() => {
  const src = render.toString().replace(/c\.save\(\);c\.translate\([^;]*\);c\.scale\(sx,sy\);/, 'c.save();');
  if (src === render.toString()) throw new Error('render() a changé : transformation introuvable');
  window.renderRaw = (0, eval)('(' + src + ')');
  window.solid = (color) => { const c = document.createElement('canvas'); c.width = 1000; c.height = 2000; const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, 1000, 2000); return c; };
});

const models = await page.evaluate(() => models.map((m) => ({ id: m.id, name: m.name, panel: photoMasks[m.id][0].slice(0, 5) })));
const raw = async (idx, color) => {
  const b64 = await page.evaluate(({ idx, color }) => {
    design = solid(color); states[idx] = { ...states[idx], zoom: 1, x: 0, y: 0 };
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1536;
    renderRaw(idx, c);
    return c.toDataURL('image/png').split(',')[1];
  }, { idx, color });
  return sharp(Buffer.from(b64, 'base64')).ensureAlpha().raw().toBuffer();
};

for (let idx = 0; idx < models.length; idx++) {
  const m = models[idx];
  if (only && !only.includes(m.id)) continue;
  const K = await raw(idx, '#000'), W = await raw(idx, '#fff');
  const [px, py, pw, ph] = m.panel.map(Math.round);
  // Cadre utile : boîte des pixels non transparents.
  let x0 = 1024, y0 = 1536, x1 = 0, y1 = 0;
  for (let y = 0; y < 1536; y++) for (let x = 0; x < 1024; x++) {
    if (K[(y * 1024 + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px + pw - 1); y1 = Math.max(y1, py + ph - 1);
  const Mbuf = Buffer.alloc(K.length);
  for (let p = 0; p < K.length; p += 4) {
    const x = (p / 4) % 1024, y = Math.floor(p / 4 / 1024);
    const inPanel = x >= px && x < px + pw && y >= py && y < py + ph;
    for (let j = 0; j < 3; j++) Mbuf[p + j] = Math.max(0, W[p + j] - K[p + j]);
    Mbuf[p + 3] = inPanel ? K[p + 3] : 0; // rien hors de la coque (coins)
  }
  const box = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const opts = { raw: { width: 1024, height: 1536, channels: 4 } };
  await sharp(K, opts).extract(box).webp({ quality: 88, alphaQuality: 95 }).toFile(`${OUT}/${m.id}-k.webp`);
  await sharp(Mbuf, opts).extract(box).webp({ quality: 90, alphaQuality: 100 }).toFile(`${OUT}/${m.id}-m.webp`);
  manifest[m.id] = { label: m.name, panel: [px, py, pw, ph, Math.round(m.panel[4] ?? 0)], box: [x0, y0, box.width, box.height] };
  console.log('✓ ' + m.id);
}
await browser.close();
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
process.exit(0);
