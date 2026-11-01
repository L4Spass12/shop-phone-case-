// Palette de couleurs de chaque design du catalogue, pour les recommandations
// « Vous aimerez aussi » (coques aux couleurs proches).
//
//   node scripts/design-palettes.mjs
// Lit public/images/designs/<slug>.webp, écrit src/data/design-palettes.json :
// { "<slug>": [[L, a, b, poids], …] }, 5 couleurs dominantes en Lab (L 0-100).
// À relancer quand des designs sont ajoutés.
import sharp from 'sharp';
import { readdirSync, writeFileSync } from 'node:fs';

const DIR = 'public/images/designs';
const OUT = 'src/data/design-palettes.json';
const K = 5;

// sRGB → Lab (D65) : une distance en Lab suit à peu près l'œil.
function toLab([r, g, b]) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const x = f((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047);
  const y = f(R * 0.2126 + G * 0.7152 + B * 0.0722);
  const z = f((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

// k-moyennes sur les pixels d'une vignette 32 x 64, départ déterministe.
function kmeans(px) {
  let c = Array.from({ length: K }, (_, i) => px[Math.floor((i + 0.5) * px.length / K)]);
  let assign = new Array(px.length).fill(0);
  for (let it = 0; it < 12; it++) {
    assign = px.map((p) => c.reduce((best, q, j) => (dist(p, q) < dist(p, c[best]) ? j : best), 0));
    c = c.map((q, j) => {
      const m = px.filter((_, i) => assign[i] === j);
      if (!m.length) return q;
      return [0, 1, 2].map((k) => m.reduce((s, p) => s + p[k], 0) / m.length);
    });
  }
  return c
    .map((q, j) => [...q.map((v) => Math.round(v * 10) / 10), Math.round(assign.filter((a) => a === j).length / px.length * 100) / 100])
    .filter((q) => q[3] > 0)
    .sort((a, b) => b[3] - a[3]);
}

const out = {};
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.webp') && !f.endsWith('-thumb.webp')).sort()) {
  const { data, info } = await sharp(`${DIR}/${f}`).resize(32, 64, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += info.channels) px.push(toLab([data[i], data[i + 1], data[i + 2]]));
  out[f.replace(/\.webp$/, '')] = kmeans(px);
}
writeFileSync(OUT, JSON.stringify(out));
console.log(`${Object.keys(out).length} palettes → ${OUT}`);
