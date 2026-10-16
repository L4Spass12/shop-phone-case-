// Planning des épingles Pinterest (flux RSS /pinterest/<catégorie>.xml).
//
// Une épingle = un design de la boutique sur UN modèle de téléphone (photo de
// l'atelier), soit 152 × 19 combinaisons. Ordre fixe et reproductible :
//   - les designs sont mélangés une fois (graine fixe), pour alterner les
//     catégories ;
//   - tour r, design p : modèle (r + 5p) mod 19. Deux épingles qui se suivent
//     n'ont donc jamais le même design ni le même modèle, et chaque design
//     passe par les 19 modèles.
// `perDay` épingles deviennent « dues » chaque jour à partir de `startDate` ;
// le site étant reconstruit chaque nuit, les flux avancent seuls.
import { getCollection } from 'astro:content';
import siteConfig from '../../site.config.mjs';
import { parseEntrySlug } from './i18n';
import { PHONE_MODELS, modelPhoto } from './models';

/** Modèles du planning Pinterest, dans l'ordre du premier import (oct. 2026). */
const PINTEREST_MODELS = ["iphone-17-pro-max", "iphone-17-pro", "iphone-17", "iphone-16-pro-max", "iphone-16-pro", "iphone-16", "iphone-15-pro-max", "iphone-15-pro", "iphone-15", "iphone-14", "iphone-13", "galaxy-s26-ultra", "galaxy-s26", "galaxy-s25-ultra", "galaxy-s25", "galaxy-s24-ultra", "galaxy-s24", "galaxy-a56-5g", "galaxy-a36-5g"];

export type Pin = {
  id: string;
  board: string;
  title: string;
  description: string;
  link: string;
  /** Photo source (WebP, fond transparent) dans public/. */
  source: string;
  /** Image servie à Pinterest (JPEG). */
  image: string;
  date: Date;
};

type Cat = { slug: string; label: string; theme?: boolean };
export const BOARDS = ((siteConfig.productCategories ?? []) as Cat[]).filter((c) => c.theme);

const TAGS: Record<string, string> = {
  'coques-animaux': '#coqueanimaux #animaux',
  'coques-romantique': '#coqueromantique #ideecadeau',
  'coques-kawaii': '#coquekawaii #kawaii',
  'coques-fleurs': '#coquefleurie #fleurs',
  'coques-paysages': '#coqueart #paysage',
  'coques-motifs': '#coquemotif #pattern',
  'coques-auto': '#coquevoiture #voiture',
  'coques-citations': '#coquecitation #citation',
};

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
/** Jours couverts par /pinterest/planning.csv : 50 x 4 = 200 épingles, le maximum d'un import groupé Pinterest. */
export const CSV_DAYS = 50;

/** Épingles dues aujourd'hui ou avant (toutes catégories), de la plus ancienne à la plus récente. */
export async function duePins(now = new Date(), aheadDays = 1): Promise<Pin[]> {
  const cfg = (siteConfig as any).pinterest ?? {};
  if (!cfg.startDate) return [];
  const start = new Date(`${cfg.startDate}T06:00:00Z`).getTime();
  if (!Number.isFinite(start) || now.getTime() < start) return [];
  const perDay = Math.max(1, Math.min(20, Number(cfg.perDay) || 4));
  const due = (Math.floor((now.getTime() - start) / DAY) + aheadDays) * perDay;

  const themes = new Set(BOARDS.map((b) => b.slug));
  const products = (await getCollection('products'))
    .filter((p) => parseEntrySlug(p.slug).lang === 'fr')
    .map((p) => ({ p, board: (p.data.categories ?? []).find((c) => themes.has(c)) }))
    .filter((x): x is { p: (typeof x)['p']; board: string } => !!x.board)
    .sort((a, b) => a.p.slug.localeCompare(b.p.slug));
  const r = rng(20261020);
  for (let i = products.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [products[i], products[j]] = [products[j], products[i]];
  }

  const SITE = siteConfig.url;
  // Liste FIGÉE : le planning dépend des modèles et de leur ordre. Ajouter un
  // modèle au site (iPhone 18 Pro, 16 Plus…) décalerait toutes les épingles
  // des fichiers CSV déjà importés dans Pinterest.
  const M = PINTEREST_MODELS.map((id) => PHONE_MODELS.find((m) => m.id === id)).filter((m): m is (typeof PHONE_MODELS)[number] => !!m);
  const pins: Pin[] = [];
  for (let k = 0; k < products.length * M.length; k++) {
    const pi = k % products.length;
    const round = Math.floor(k / products.length);
    const model = M[(round + 5 * pi) % M.length];
    const { p, board } = products[pi];
    const slug = parseEntrySlug(p.slug).slug;
    const photo = modelPhoto(slug, model.id);
    if (!photo) continue;
    const idx = pins.length;
    const modelTag = `#coque${model.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    pins.push({
      id: `${slug}--${model.id}`,
      board,
      title: `${p.data.name} pour ${model.fullName}`,
      description:
        `${p.data.shortDescription} Coque transparente pour ${model.fullName}, imprimée à l'unité dans notre atelier en France, à plat ou en relief. Livraison suivie. ` +
        `${modelTag} #coquetelephone ${TAGS[board] ?? ''} #moroji`.replace(/\s+/g, ' ').trim(),
      link: `${SITE}/product/${slug}/?modele=${model.id}&utm_source=pinterest&utm_medium=social&utm_campaign=${board}`,
      source: photo,
      image: `${SITE}/pins/${slug}--${model.id}.jpg`,
      // Réparties dans la journée (toutes les 4 h) : des dates distinctes
      // aident Pinterest à les traiter comme des publications successives.
      date: new Date(start + Math.floor(idx / perDay) * DAY + (idx % perDay) * 4 * 3_600_000),
    });
  }
  // Pinterest refuse de connecter un flux vide : chaque tableau reçoit dès
  // le premier jour sa première épingle prévue, le reste suit le rythme.
  const out = pins.slice(0, due);
  const boards = new Set(out.map((p) => p.board));
  for (const p of pins.slice(due)) {
    if (boards.has(p.board)) continue;
    boards.add(p.board);
    out.push({ ...p, date: new Date(start) });
  }
  return out
    .filter((p) => p.date.getTime() <= now.getTime() + aheadDays * DAY)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
