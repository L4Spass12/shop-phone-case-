// Carrousels TikTok / Instagram : slides de 7 coques disposées 2 / 3 / 2 sur
// fond clair, à partir des rendus transparents de capture.mjs.
//
//   node scripts/social/carousel.mjs [--in ~/Downloads/moroji-contenu/rendus] [--out ~/Downloads/moroji-contenu/carrousels]
// Sortie, par carrousel : tiktok-01.jpg… (1080 × 1920) et insta-01.jpg… (1080 × 1350),
// plus legende.txt (texte et hashtags à coller).
import sharp from 'sharp';
import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { JERSEYS } from '../../src/data/jerseys.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const IN = opt('--in', `${homedir()}/Downloads/moroji-contenu/rendus`);
const OUT = opt('--out', `${homedir()}/Downloads/moroji-contenu/carrousels`);

// Thèmes du catalogue : catégorie de style de chaque produit (front matter).
const THEMES = {
  'coques-animaux': { name: 'Animaux', hook: 'Laquelle tu choisis ? 🐾', tags: '#coqueanimaux #coquechat #coquechien' },
  'coques-romantique': { name: 'Romantique', hook: 'Pour elle ou pour toi ? 💗', tags: '#coqueromantique #ideecadeau #saintvalentin' },
  'coques-kawaii': { name: 'Kawaii', hook: 'Team kawaii, laquelle ? 🎀', tags: '#coquekawaii #kawaii #cute' },
  'coques-fleurs': { name: 'Fleurs', hook: 'Laquelle va avec ton style ? 🌸', tags: '#coquefleurs #floral #aesthetic' },
  'coques-paysages': { name: 'Paysages', hook: 'Choisis ton paysage 🌅', tags: '#coquepaysage #art #aesthetic' },
  'coques-riviera': { name: 'Riviera', hook: 'La Riviera dans ta poche ☀️ Laquelle tu prends ?', tags: '#dolcevita #riviera #summervibes #coqueaesthetic' },
  'coques-motifs': { name: 'Motifs', hook: 'Laquelle tu prends ? ✨', tags: '#coquemotif #pattern #aesthetic' },
  'coques-auto': { name: 'Auto', hook: 'Pour les fans de voitures 🏎️', tags: '#coquevoiture #carlovers #jdm' },
  'coques-citations': { name: 'Citations', hook: 'Ta phrase préférée ? ✍️', tags: '#coquecitation #quotes #motivation' },
};
const COMMON = '#coquetelephone #iphonecase #coqueiphone #moroji #madeinfrance';

// Toutes les catégories de style d'une coque : elle figure dans chaque
// carrousel de thème auquel elle appartient (Kawaii, Romantique… seraient
// sinon presque vides, leurs coques étant d'abord rangées ailleurs).
function themesOf(slug) {
  const f = `src/content/products/${slug}.md`;
  if (!existsSync(f)) return [];
  const m = /categories:\s*\[([^\]]*)\]/.exec(readFileSync(f, 'utf8'));
  const cats = m ? m[1].split(',').map((s) => s.trim().replace(/["']/g, '')) : [];
  return cats.filter((c) => THEMES[c]);
}

const renders = readdirSync(IN).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, ''));
const groups = {};
for (const id of renders) {
  if (id.startsWith('maillot-')) continue;
  for (const t of themesOf(id)) (groups[t] ||= []).push(id);
}
const NATIONS = ['france', 'espagne', 'portugal', 'italie', 'bresil', 'argentine', 'allemagne', 'angleterre', 'pays-bas', 'belgique', 'maroc', 'algerie'];
const carousels = [
  { id: 'foot-pays', items: NATIONS.map((n) => `maillot-${n}`), hook: 'Ta coque aux couleurs de ton pays ⚽ Avec TON nom et TON numéro',
    tags: '#coquefoot #coquepersonnalisee #maillotdefoot #equipedefrance #football' },
  { id: 'foot-clubs', items: JERSEYS.filter((j) => !NATIONS.includes(j.id)).map((j) => `maillot-${j.id}`),
    hook: 'Les couleurs de ton club, ton nom, ton numéro ⚽ Laquelle tu choisis ?', tags: '#coquefoot #coquepersonnalisee #maillot #football #foot' },
  ...Object.entries(groups).map(([k, items]) => ({ id: k.replace('coques-', ''), items, hook: THEMES[k].hook, tags: THEMES[k].tags })),
];

// Carrousels sur mesure (--extra fichier.json) : [{ id, items: [slug…], hook, tags }].
const EXTRA = opt('--extra', '');
if (EXTRA) carousels.push(...JSON.parse(readFileSync(EXTRA, 'utf8')));

// Placement 2 / 3 / 2 (comme les carrousels « wishlist »), rangées décalées.
const LAYOUT = [[0, 1], [0, 1, 2], [0, 1]];
async function slide(items, W, H, file) {
  const caseH = Math.round(H * (H > W * 1.5 ? .285 : .27));
  const top = Math.round(H * (H > W * 1.5 ? .095 : .065));
  const rowGap = Math.round(caseH * (H > W * 1.5 ? .08 : .04));
  const comps = [];
  let k = 0;
  for (let r = 0; r < LAYOUT.length; r++) {
    const row = LAYOUT[r];
    const y = top + r * (caseH + rowGap);
    for (let c = 0; c < row.length && k < items.length; c++, k++) {
      const img = await sharp(`${IN}/${items[k]}.png`).resize({ height: caseH }).png().toBuffer();
      const { width: w } = await sharp(img).metadata();
      const gap = Math.round(W * .035);
      const rowW = row.length * w + (row.length - 1) * gap;
      const x = Math.round((W - rowW) / 2 + c * (w + gap));
      // Ombre douce sous la coque.
      // Ombre = silhouette de la coque (son alpha), en noir à 25 %, floutée.
      const { data: a, info } = await sharp(img).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
      const rgba = Buffer.alloc(info.width * info.height * 4);
      for (let i = 0; i < a.length; i++) rgba[i * 4 + 3] = Math.round(a[i] * .25);
      const pad = 30;
      const shadow = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
        .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .blur(16).png().toBuffer();
      comps.push({ input: shadow, left: x + 6 - pad, top: y + 18 - pad }, { input: img, left: x, top: y });
    }
  }
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><radialGradient id="g" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#fbfbfb"/><stop offset="1" stop-color="#e9e9ea"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
  await sharp(bg).composite(comps).jpeg({ quality: 90 }).toFile(file);
}

for (const c of carousels) {
  const dir = `${OUT}/${c.id}`;
  mkdirSync(dir, { recursive: true });
  const items = c.items.filter((i) => renders.includes(i));
  const pages = [];
  for (let i = 0; i < items.length; i += 7) pages.push(items.slice(i, i + 7));
  // Dernière slide incomplète : complétée avec le début (une slide pleine fait mieux).
  const last = pages[pages.length - 1];
  if (last && last.length < 7 && items.length >= 7) last.push(...items.slice(0, 7 - last.length));
  for (let p = 0; p < Math.min(pages.length, 10); p++) {
    const n = String(p + 1).padStart(2, '0');
    await slide(pages[p], 1080, 1920, `${dir}/tiktok-${n}.jpg`);
    await slide(pages[p], 1080, 1350, `${dir}/insta-${n}.jpg`);
  }
  writeFileSync(`${dir}/legende.txt`, `${c.hook}\n\nImprimées à l'unité en France · iPhone & Samsung · lien en bio 🔗\n\n${c.tags} ${COMMON}\n`);
  console.log('ok', c.id, items.length, 'coques,', Math.min(pages.length, 10), 'slides');
}
