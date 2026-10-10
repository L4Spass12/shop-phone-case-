// Génération automatique des mockups de coques par modèle de téléphone.
//
// Pilote l'application « atelier coques » (index.html autonome, bases images
// intégrées) dans Chrome sans interface, et appelle SON PROPRE moteur de rendu
// (loadImage, png) : les images sont identiques à celles de l'application.
//
// Usage :
//   node scripts/mockups/generate.mjs <slug> [--design chemin] [--mode plat|relief]
//        [--models iphone-15,galaxy-s25] [--crop crop.json] [--gloss 55]
//
//   slug      : produit de la boutique (ex. coque-vache). Design par défaut :
//               public/images/designs/<slug>.webp
//   --crop    : JSON { "<model-id>": { "zoom": 1.2, "x": 0, "y": -0.3 }, "*": {...} }
//               (mêmes valeurs que les curseurs de l'application, zoom 1 à 2,5,
//               x et y de -1 à 1). Défaut : centré, comme l'application.
//
// Sortie : public/images/products/variants/<slug>/<model-id>-<mode>.webp
//          (1000 px de large, + -500w) et src/data/variants.json, qui
//          associe chaque fichier au modèle EXACT du site (libellés de
//          site.config.mjs → phoneModels ; le script s'arrête si un modèle de
//          l'atelier n'y figure pas).
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import sharp from 'sharp';
import siteConfig from '../../site.config.mjs';

const ATELIER = process.env.ATELIER_HTML ||
  '/Users/amatquentin/Documents/Codex/2026-10-06/genere-moi-image-produit-de-cette/outputs/atelier-coques/index.html';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const slug = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
if (!slug || slug.startsWith('--')) { console.error('Usage : node scripts/mockups/generate.mjs <slug> [options]'); process.exit(1); }

const designPath = resolve(opt('design', `public/images/designs/${slug}.webp`));
const mode = opt('mode', 'plat');
const only = opt('models', '') ? opt('models', '').split(',') : null;
const crop = opt('crop', '') ? JSON.parse(readFileSync(opt('crop', ''), 'utf8')) : {};
const gloss = Number(opt('gloss', '55')) / 100;
const keepPng = args.includes('--png');
if (!existsSync(designPath)) { console.error('Design introuvable : ' + designPath); process.exit(1); }

const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[extname(designPath).toLowerCase()];
const designUrl = `data:${mime};base64,${readFileSync(designPath).toString('base64')}`;

const outDir = `public/images/products/variants/${slug}`;
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[atelier] ' + e.message));
await page.goto('file://' + ATELIER, { waitUntil: 'load' });
await page.waitForFunction('typeof photoReady !== "undefined"');
await page.evaluate('photoReady');

// Design, finition et cadrages, via les variables de l'application.
const siteLabels = new Set((siteConfig.phoneModels?.brands ?? []).flatMap((b) => (b.models ?? []).map((m) => m.label)));
const ids = await page.evaluate(async ({ designUrl, g, crop }) => {
  await loadImage(designUrl, 'design');
  // loadImage remet les cadrages à zéro : on applique les nôtres ensuite.
  gloss = g;
  return models.map((m, i) => {
    const c = crop[m.id] || crop['*'];
    if (c) Object.assign(states[i], { zoom: c.zoom ?? 1, x: c.x ?? 0, y: c.y ?? 0 });
    return { id: m.id, name: m.name };
  });
}, { designUrl, g: gloss, crop }).catch(async (e) => { await browser.close(); throw e; });

const manifestPath = 'src/data/variants.json';
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
manifest[slug] ??= {};

const unknown = ids.filter((m) => !siteLabels.has(m.name)).map((m) => m.name);
if (unknown.length) { await browser.close(); throw new Error('Modèles absents de site.config.mjs : ' + unknown.join(', ')); }
manifest._models = Object.fromEntries(ids.map((m) => [m.id, m.name]));

for (let i = 0; i < ids.length; i++) {
  const id = ids[i].id;
  if (only && !only.includes(id)) continue;
  // png(i) : l'export 1600 × 2400 de l'application, à l'identique.
  const b64 = await page.evaluate(async (i) => {
    const blob = await png(i);
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = ''; for (let k = 0; k < buf.length; k += 0x8000) s += String.fromCharCode(...buf.subarray(k, k + 0x8000));
    return btoa(s);
  }, i);
  const pngBuf = Buffer.from(b64, 'base64');
  const base = `${outDir}/${id}-${mode}`;
  if (keepPng) writeFileSync(base + '.png', pngBuf);
  // 1000 px suffisent à l'écran ; l'export 1600 px reste disponible avec --png.
  await sharp(pngBuf).resize(1000).webp({ quality: 80, alphaQuality: 90 }).toFile(base + '.webp');
  await sharp(pngBuf).resize(500).webp({ quality: 78, alphaQuality: 90 }).toFile(`${base}-500w.webp`);
  manifest[slug][id] ??= {};
  manifest[slug][id][mode] = `/${base.replace(/^public\//, '')}.webp`;
  console.log('✓ ' + id);
}

await browser.close();
mkdirSync('src/data', { recursive: true });
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`${slug} : ${Object.keys(manifest[slug]).length} modèles dans ${manifestPath}`);
