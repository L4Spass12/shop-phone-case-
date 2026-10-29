/**
 * Génère des variantes responsive -400w.webp et -800w.webp (plus -600w.webp
 * à côté d'une -800w) pour chaque
 * image de public/images/ plus large que 500px.
 *
 * Les fichiers existants sont préservés (version originale = la plus grande).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const IMAGES = path.join(root, 'public', 'images');

const WIDTHS = [400, 800];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.webp$/i.test(e.name) && !/-\d+w\.webp$/i.test(e.name)) out.push(p);
  }
  return out;
}

console.log('🔧 Génération des variantes responsive…\n');
const files = walk(IMAGES);
let generated = 0;

for (const file of files) {
  const buf = fs.readFileSync(file);
  const meta = await sharp(buf).metadata();
  if (!meta.width || meta.width < 500) continue;

  for (const w of WIDTHS) {
    if (w >= meta.width) continue;
    const out = file.replace(/\.webp$/, `-${w}w.webp`);
    if (fs.existsSync(out)) continue;
    const resized = await sharp(buf)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toBuffer();
    fs.writeFileSync(out, resized);
    generated++;
  }

  // 600 : une vignette en 72vw sur un Android courant (~520 px réels) prenait
  // la 800 faute d'intermédiaire. Seulement à côté d'une 800 existante.
  const out600 = file.replace(/\.webp$/, '-600w.webp');
  if (meta.width > 600 && fs.existsSync(file.replace(/\.webp$/, '-800w.webp')) && !fs.existsSync(out600)) {
    const resized = await sharp(buf)
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toBuffer();
    fs.writeFileSync(out600, resized);
    generated++;
  }
}

console.log(`\n✅ ${generated} variantes générées`);
