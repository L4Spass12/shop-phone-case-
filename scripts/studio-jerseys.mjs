// Fonds « maillot de foot » du studio (modèles Maillot).
// Génère public/images/studio-bg/maillot-<id>.webp (1000 × 2000, le format
// des autres fonds) et sa vignette -thumb.webp (180 × 360).
//
// Couleurs seulement : aucun écusson, logo, sponsor ni nom de club (marques
// déposées). Les maillots « de club » sont nommés par leurs couleurs.
//
//   node scripts/studio-jerseys.mjs
import sharp from 'sharp';
import { JERSEYS } from '../src/data/jerseys.mjs';

const W = 1000, H = 2000;
const OUT = 'public/images/studio-bg';

function pattern(k) {
  const [a, b, c] = k.colors;
  switch (k.pattern) {
    case 'stripes': { // rayures verticales
      const n = k.n ?? 7, w = W / n;
      return Array.from({ length: n }, (_, i) => i % 2 ? `<rect x="${i * w}" y="0" width="${w}" height="${H}" fill="${b}"/>` : '').join('');
    }
    case 'hoops': { // bandes horizontales
      const n = k.n ?? 10, h = H / n;
      return Array.from({ length: n }, (_, i) => i % 2 ? `<rect x="0" y="${i * h}" width="${W}" height="${h}" fill="${b}"/>` : '').join('');
    }
    case 'halves':
      return `<rect x="${W / 2}" y="0" width="${W / 2}" height="${H}" fill="${b}"/>`;
    case 'band': // bande verticale centrale, liserés
      return `<rect x="${W * .34}" y="0" width="${W * .32}" height="${H}" fill="${c ?? b}"/>
        <rect x="${W * .31}" y="0" width="${W * .03}" height="${H}" fill="${b}"/>
        <rect x="${W * .66}" y="0" width="${W * .03}" height="${H}" fill="${b}"/>`;
    case 'sash': // écharpe en diagonale
      return `<polygon points="${W * .85},${H * .12} ${W * 1.1},${H * .12} ${W * .15},${H * .78} ${-W * .1},${H * .78}" fill="${b}"/>`;
    case 'chest': // bande horizontale sur la poitrine (dos : haut du maillot)
      return `<rect x="0" y="${H * .14}" width="${W}" height="${H * .035}" fill="${b}"/>
        <rect x="0" y="${H * .175}" width="${W}" height="${H * .035}" fill="${c ?? b}"/>
        <rect x="0" y="${H * .21}" width="${W}" height="${H * .035}" fill="${k.colors[3] ?? b}"/>`;
    case 'sides': // empiècements sur les côtés
      return `<rect x="0" y="0" width="${W * .12}" height="${H}" fill="${b}"/><rect x="${W * .88}" y="0" width="${W * .12}" height="${H}" fill="${b}"/>`;
    default:
      return '';
  }
}

function svg(k) {
  const [a] = k.colors;
  const trim = k.trim ?? k.colors[1] ?? '#ffffff';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="mesh" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="3.5" cy="3.5" r="2.2" fill="#000" opacity=".07"/>
      <circle cx="10.5" cy="10.5" r="2.2" fill="#000" opacity=".07"/>
    </pattern>
    <linearGradient id="light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
      <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".22"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="38"/></filter>
    <radialGradient id="vig" cx=".5" cy=".45" r=".75">
      <stop offset=".6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".25"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${a}"/>
  ${pattern(k)}
  <rect width="${W}" height="${H}" fill="url(#mesh)"/>
  <!-- plis du tissu -->
  <g filter="url(#soft)">
    <path d="M140 300 C 280 700, 200 1200, 320 1900" stroke="#000" stroke-opacity=".10" stroke-width="110" fill="none"/>
    <path d="M760 200 C 680 800, 840 1300, 720 1950" stroke="#fff" stroke-opacity=".12" stroke-width="100" fill="none"/>
  </g>
  <!-- col rond, côté dos -->
  <path d="M330 -20 Q 500 140 670 -20" stroke="#000" stroke-opacity=".18" stroke-width="18" fill="none" transform="translate(0,26)" filter="url(#soft)"/>
  <path d="M330 -20 Q 500 140 670 -20" stroke="${trim}" stroke-width="30" fill="none"/>
  <rect width="${W}" height="${H}" fill="url(#light)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

for (const k of JERSEYS) {
  const buf = await sharp(Buffer.from(svg(k))).webp({ quality: 88 }).toBuffer();
  await sharp(buf).toFile(`${OUT}/maillot-${k.id}.webp`);
  await sharp(buf).resize(180, 360).webp({ quality: 80 }).toFile(`${OUT}/maillot-${k.id}-thumb.webp`);
  console.log('ok', k.id);
}
