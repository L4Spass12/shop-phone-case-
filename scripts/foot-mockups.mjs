// Rendus réalistes des coques « maillot » pour la page /coque-foot-personnalisee/.
//
// Même calcul que l'aperçu réaliste du studio : rendu = K + M × design, avec
// les calques K/M de public/images/studio/real/ (voir studio-bases.mjs). Le
// design = fond maillot du studio + nom et numéro en Anton, aux positions du
// modèle Maillot du studio (nom 46 %, numéro 68 %, tailles en % de la largeur).
//
//   node scripts/foot-mockups.mjs [--model iphone-17-pro-max]
// Sortie : public/images/foot/<maillot>.webp (+ -800w), fond blanc.
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, mkdirSync } from 'node:fs';
import { JERSEYS } from '../src/data/jerseys.mjs';
import { SAMPLES } from '../src/data/foot-samples.mjs';

const args = process.argv.slice(2);
const mi = args.indexOf('--model');
const MODEL = mi > -1 ? args[mi + 1] : 'iphone-17-pro-max';
const real = JSON.parse(readFileSync('src/data/studio-real.json', 'utf8'))[MODEL];
if (!real) throw new Error('Modèle sans calques réalistes : ' + MODEL);
const [px, py, pw, ph, pr] = real.panel;
const [bx, by, bw, bh] = real.box;
const OUT = 'public/images/foot';
mkdirSync(OUT, { recursive: true });

const buf = readFileSync('node_modules/@fontsource/anton/files/anton-latin-400-normal.woff');
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

// Texte centré sur (cx, cy), contour dessous (comme le studio : 0,11 em).
function text(str, cx, cy, size, fill, stroke) {
  const p = font.getPath(str, 0, 0, size);
  const bb = p.getBoundingBox();
  const dx = cx - (bb.x1 + bb.x2) / 2, dy = cy - (bb.y1 + bb.y2) / 2;
  const d = font.getPath(str, dx, dy, size).toPathData(2);
  return (stroke ? `<path d="${d}" fill="${stroke}" stroke="${stroke}" stroke-width="${size * .11}" stroke-linejoin="round"/>` : '') +
    `<path d="${d}" fill="${fill}"/>`;
}

// Calques RGBA : comme le navigateur, on tient compte de leur opacité.
// M (multiply) : D × (1 − a + a·M) ; K (plus-lighter) : + a·K.
const rgba = (f) => sharp(`public/images/studio/real/${MODEL}-${f}.webp`).resize(bw, bh).ensureAlpha().raw().toBuffer();
const K4 = await rgba('k'), M4 = await rgba('m');

for (const j of JERSEYS) {
  const [name, num] = SAMPLES[j.id] ?? ['TON NOM', '10'];
  const bg = await sharp(`public/images/studio-bg/maillot-${j.id}.webp`).resize(pw, ph, { fit: 'cover' }).png().toBuffer();
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}">
    ${text(name, pw / 2, ph * .46, pw * .105, j.ink, j.outline)}
    ${text(num, pw / 2, ph * .68, pw * .58, j.ink, j.outline)}
  </svg>`;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" rx="${pr}" ry="${pr}" fill="#fff"/></svg>`);
  const design = await sharp(bg).composite([{ input: Buffer.from(overlay) }, { input: mask, blend: 'dest-in' }]).png().toBuffer();
  // Design posé dans la zone imprimable, fond blanc autour (la page est blanche).
  const D = await sharp({ create: { width: bw, height: bh, channels: 3, background: '#ffffff' } })
    .composite([{ input: design, left: px - bx, top: py - by }]).removeAlpha().raw().toBuffer();
  const out = Buffer.alloc(D.length);
  for (let px3 = 0, px4 = 0; px3 < D.length; px3 += 3, px4 += 4) {
    const am = M4[px4 + 3] / 255, ak = K4[px4 + 3] / 255;
    for (let c = 0; c < 3; c++) {
      const m = 1 - am + am * (M4[px4 + c] / 255);
      out[px3 + c] = Math.min(255, Math.round(D[px3 + c] * m + K4[px4 + c] * ak));
    }
  }
  // Hors de la coque (coins du cadre), blanc pur : la page est blanche.
  const r = pr + Math.min(px - bx, py - by);
  const edge = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><rect width="${bw}" height="${bh}" rx="${r}" ry="${r}" fill="#000"/></svg>`);
  const cut = await sharp({ create: { width: bw, height: bh, channels: 4, background: '#ffffff' } })
    .composite([{ input: edge, blend: 'dest-out' }]).png().toBuffer();
  const flat = await sharp(out, { raw: { width: bw, height: bh, channels: 3 } }).composite([{ input: cut }]).png().toBuffer();
  const img = sharp(flat);
  await img.clone().webp({ quality: 86 }).toFile(`${OUT}/${j.id}.webp`);
  await img.clone().resize(400).webp({ quality: 84 }).toFile(`${OUT}/${j.id}-400w.webp`);
  console.log('ok', j.id);
}
