// Recommandations « Vous aimerez aussi » d'une fiche produit, calculées au
// build (pages statiques) :
//  - ressemblance : catégories communes, thème du nom, couleurs du design
//    (src/data/design-palettes.json, scripts/design-palettes.mjs) ;
//  - popularité : vues, ajouts au panier et ventes des 60 derniers jours
//    (API /api/public/popularity du widget). Sans réseau : 0 partout, le
//    classement se fait alors sur la seule ressemblance.
// La fiche reçoit une réserve classée ; un petit script la fait tourner pour
// ne pas montrer toujours les mêmes produits (voir ProductPage).
import siteConfig from '../../site.config.mjs';
import palettes from '../data/design-palettes.json';

type Swatch = [number, number, number, number]; // L, a, b, poids
type Candidate = { slug: string; name: string; categories: string[] };

// Catégorie commune à toutes les coques : elle ne distingue rien.
const GENERIC = new Set(['coques-iphone']);
const STOP = new Set(['coque', 'de', 'des', 'du', 'la', 'le', 'les', 'et', 'en', 'aux', 'au', 'a', 'sur', 'dans', 'un', 'une', 'd', 'l']);

let popularity: Promise<Record<string, number>> | null = null;

export function getPopularity(): Promise<Record<string, number>> {
  if (popularity) return popularity;
  const atelier = siteConfig.shop?.atelier ?? {};
  popularity = (async () => {
    try {
      const origin = new URL(atelier.widgetUrl ?? '').origin;
      const res = await fetch(`${origin}/api/public/popularity?shop_id=${atelier.shopId}`);
      if (!res.ok) return {};
      const body = await res.json();
      return body?.scores && typeof body.scores === 'object' ? (body.scores as Record<string, number>) : {};
    } catch {
      return {};
    }
  })();
  return popularity;
}

/** « Coque Chats amoureux » → {chat, amoureux} : accents et pluriels retirés. */
function themeWords(name: string): Set<string> {
  return new Set(
    name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 1 && !STOP.has(w))
      .map((w) => (w.length > 3 ? w.replace(/(x|s)$/, '') : w)),
  );
}

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const x of a) if (b.has(x)) common++;
  return common / (a.size + b.size - common);
}

/** Proximité de deux palettes (0 à 1) : pour chaque couleur de l'une, la plus
 *  proche de l'autre, pondérée par sa place dans le design, dans les deux sens. */
function colorCloseness(a?: Swatch[], b?: Swatch[]): number {
  if (!a?.length || !b?.length) return 0;
  const one = (x: Swatch[], y: Swatch[]) =>
    x.reduce((s, p) => s + p[3] * Math.min(...y.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]))), 0) /
    x.reduce((s, p) => s + p[3], 0);
  const d = (one(a, b) + one(b, a)) / 2;
  return Math.max(0, 1 - d / 45);
}

/**
 * Réserve classée de produits à recommander pour `current` : environ deux
 * tiers de produits ressemblants, un tiers de produits populaires, mêlés
 * (deux ressemblants, un populaire…). `size` produits au plus.
 */
export function recommend<T extends Candidate>(current: Candidate, candidates: T[], pop: Record<string, number>, size = 20): T[] {
  const pal = palettes as Record<string, Swatch[]>;
  const cats = new Set(current.categories.filter((c) => !GENERIC.has(c)));
  const words = themeWords(current.name);
  const maxPop = Math.max(1, ...candidates.map((c) => pop[c.slug] ?? 0));
  const popOf = (slug: string) => Math.log1p(pop[slug] ?? 0) / Math.log1p(maxPop);

  const scored = candidates
    .filter((c) => c.slug !== current.slug)
    .map((c) => {
      const similar =
        0.45 * jaccard(cats, new Set(c.categories.filter((x) => !GENERIC.has(x)))) +
        0.2 * jaccard(words, themeWords(c.name)) +
        0.35 * colorCloseness(pal[current.slug], pal[c.slug]);
      // Un peu de popularité départage deux produits aussi ressemblants.
      return { c, similar: similar + 0.1 * popOf(c.slug), popular: popOf(c.slug) + 0.15 * similar };
    });

  const bySimilar = [...scored].sort((x, y) => y.similar - x.similar);
  const byPopular = [...scored].filter((s) => (pop[s.c.slug] ?? 0) > 0).sort((x, y) => y.popular - x.popular);
  const out: T[] = [];
  const seen = new Set<string>();
  const take = (list: typeof scored) => {
    const next = list.find((s) => !seen.has(s.c.slug));
    if (next) { seen.add(next.c.slug); out.push(next.c); }
    return !!next;
  };
  for (let i = 0; out.length < size && i < size * 3; i++) {
    if (i % 3 === 2 && take(byPopular)) continue;
    take(bySimilar);
  }
  return out;
}
