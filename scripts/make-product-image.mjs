/**
 * Fabrique les visuels produits responsive au format 4:5 depuis un packshot.
 *
 *   node scripts/make-product-image.mjs <source.png> [slug]
 *
 * Detecte le sujet reel (le packshot a de larges marges blanches), le recentre
 * sur un cadre 4:5 et sort les trois largeurs attendues par unsplashSrcset()
 * dans src/lib/image.ts : <slug>.webp (1200), -800w et -400w.
 */
import sharp from 'sharp';
import path from 'node:path';

const SRC = process.argv[2];
const OUT = 'public/images/products';
const BASE = process.argv[3] ?? 'produit-exemple';

// 4:5 — format portrait retenu pour les visuels produits : sur une coque de
// téléphone, un cadre vertical laisse le produit occuper toute la hauteur.
const RATIO = 4 / 5;
const WIDTHS = [1200, 800, 400];
// Marge autour du sujet, en fraction de la hauteur du cadre. 6% de chaque côté
// laisse respirer sans que le produit paraisse perdu.
const MARGIN = 0.06;
// Fond BLANC, identique a celui du packshot source : le sujet extrait porte de
// toute facon son propre fond blanc, un canevas gris aurait juste deplace le
// liseré au bord du sujet. C'est donc aux conteneurs qui laissent apparaitre du
// fond (lettre-boite) d'etre blancs — cf. bg-dark dans les gabarits.

// 1. Détection du sujet réel : la source a de larges bandes blanches en haut et
//    en bas. On les mesure au lieu de rogner « au centre » à l'aveugle, sinon
//    le recadrage 2:3 → 4:5 mordrait sur la coque.
const src = sharp(SRC);
const meta = await src.metadata();
const { data, info } = await src
  .clone()
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });

const SEUIL = 247; // en-dessous = pixel de sujet (le fond est blanc pur)
let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (data[y * info.width + x] < SEUIL) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const sujet = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
console.log(`source        ${meta.width}x${meta.height} (${(meta.width/meta.height).toFixed(3)})`);
console.log(`sujet detecte ${sujet.width}x${sujet.height} a (${sujet.left},${sujet.top})`);

// 2. Recomposition sur un cadre 4:5 blanc, sujet centré.
const decoupe = await sharp(SRC).extract(sujet).toBuffer();

for (const W of WIDTHS) {
  const H = Math.round(W / RATIO);
  const hMax = Math.round(H * (1 - 2 * MARGIN));
  const wMax = Math.round(W * (1 - 2 * MARGIN));
  // `inside` : le sujet tient dans la boite sans etre deforme ni rogne.
  const redim = await sharp(decoupe)
    .resize({ width: wMax, height: hMax, fit: 'inside', withoutEnlargement: false })
    .toBuffer();
  const rm = await sharp(redim).metadata();

  const suffixe = W === 1200 ? '' : `-${W}w`;
  const dest = path.join(OUT, `${BASE}${suffixe}.webp`);
  await sharp({
    create: { width: W, height: H, channels: 3, background: '#ffffff' },
  })
    .composite([{
      input: redim,
      left: Math.round((W - rm.width) / 2),
      top: Math.round((H - rm.height) / 2),
    }])
    .webp({ quality: 82, effort: 6 })
    .toFile(dest);

  const out = await sharp(dest).metadata();
  console.log(`${dest.padEnd(48)} ${out.width}x${out.height}  ratio ${(out.width/out.height).toFixed(3)}`);
}
