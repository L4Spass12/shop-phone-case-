/**
 * Ré-encode les variantes -400w.webp et -800w.webp à qualité 70
 * (PSI recommande +30% de compression sur les listings).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const IMAGES = path.join(root, 'public', 'images');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/-\d+w\.webp$/i.test(e.name)) out.push(p);
  }
  return out;
}

console.log('🗜  Recompression variants q=70…\n');
const files = walk(IMAGES);
let before = 0, after = 0;

for (const f of files) {
  const buf = fs.readFileSync(f);
  const out = await sharp(buf).webp({ quality: 70, effort: 6 }).toBuffer();
  if (out.length < buf.length) {
    fs.writeFileSync(f, out);
    before += buf.length;
    after += out.length;
  }
}

console.log(`✅ Avant ${(before/1024/1024).toFixed(1)} Mo → Après ${(after/1024/1024).toFixed(1)} Mo  (−${((1-after/before)*100).toFixed(0)}%)`);
