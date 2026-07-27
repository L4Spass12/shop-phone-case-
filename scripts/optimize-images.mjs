/**
 * ============================================================
 *  Optimise toutes les images de public/images/
 *   - PNG → WebP (qualité 82, lossless=false)
 *   - Resize si largeur > MAX_W
 *   - Ré-encode les WebP déjà trop lourds (>200 Ko)
 *   - Met à jour import/image-map.json pour remapper les .png → .webp
 *
 *  IMPORTANT : modifie les fichiers sur place. Commit avant.
 * ============================================================
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const IMAGES = path.join(root, 'public', 'images');
const IMPORT = path.join(root, 'import');
const MAP_FILE = path.join(IMPORT, 'image-map.json');

const MAX_W = 1600;
const WEBP_QUALITY = 82;
const HEAVY_WEBP_THRESHOLD = 200 * 1024; // 200 Ko

let imageMap = {};
if (fs.existsSync(MAP_FILE)) imageMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) out.push(p);
  }
  return out;
}

async function optimize(file) {
  const ext = path.extname(file).toLowerCase();
  const rel = '/' + path.relative(path.join(root, 'public'), file).split(path.sep).join('/');
  const statBefore = fs.statSync(file);
  const buf = fs.readFileSync(file);
  const meta = await sharp(buf).metadata();

  const needResize = meta.width && meta.width > MAX_W;
  const needConvert = ext === '.png' || ext === '.jpg' || ext === '.jpeg';
  const needReencode = ext === '.webp' && statBefore.size > HEAVY_WEBP_THRESHOLD;

  if (!needResize && !needConvert && !needReencode) return null;

  let pipeline = sharp(buf);
  if (needResize) pipeline = pipeline.resize({ width: MAX_W, withoutEnlargement: true });
  pipeline = pipeline.webp({ quality: WEBP_QUALITY, effort: 5 });

  const outBuf = await pipeline.toBuffer();
  const outFile = needConvert ? file.replace(/\.(png|jpe?g)$/i, '.webp') : file;
  const outRel = '/' + path.relative(path.join(root, 'public'), outFile).split(path.sep).join('/');

  // N'écrit que si ça réduit réellement (sécurité)
  if (outBuf.length >= statBefore.size && !needConvert) {
    return { file: rel, skipped: true, reason: 'no gain' };
  }

  fs.writeFileSync(outFile, outBuf);
  if (needConvert && outFile !== file) fs.unlinkSync(file);

  // Update image-map (toutes les entrées qui pointaient vers l'ancien path)
  if (rel !== outRel) {
    for (const [wp, local] of Object.entries(imageMap)) {
      if (local === rel) imageMap[wp] = outRel;
    }
  }

  return {
    file: rel,
    out: outRel,
    before: statBefore.size,
    after: outBuf.length,
    saved: statBefore.size - outBuf.length,
  };
}

console.log('🗜  Optimisation des images…\n');
const files = walk(IMAGES);
let totalBefore = 0, totalAfter = 0, changed = 0;

for (const f of files) {
  const r = await optimize(f);
  if (!r) continue;
  if (r.skipped) continue;
  totalBefore += r.before;
  totalAfter += r.after;
  changed++;
  const pct = Math.round((1 - r.after / r.before) * 100);
  console.log(`  ${pct.toString().padStart(3)}% • ${(r.after/1024).toFixed(0).padStart(4)} Ko • ${r.out}`);
}

// Sauvegarde image-map mis à jour
fs.writeFileSync(MAP_FILE, JSON.stringify(imageMap, null, 2));

console.log(`\n✅ ${changed} images optimisées`);
console.log(`   Avant : ${(totalBefore/1024/1024).toFixed(1)} Mo`);
console.log(`   Après : ${(totalAfter/1024/1024).toFixed(1)} Mo`);
console.log(`   Gain  : ${((1-totalAfter/totalBefore)*100).toFixed(0)}% (−${((totalBefore-totalAfter)/1024/1024).toFixed(1)} Mo)`);

// Note : après ce script, il faut remplacer les refs .png dans le contenu
console.log('\n⚠️  Remplace aussi les .png → .webp dans src/content/ si besoin :');
console.log('    grep -r "\\.png" src/content/');
