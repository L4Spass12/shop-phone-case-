// Avis clients publiés, lus au moment du build (pages statiques, étoiles
// Google). Le site est reconstruit chaque nuit (workflow hostinger-branch) :
// un avis publié dans l'admin apparaît au plus tard le lendemain.
// En cas d'échec réseau, aucun avis : le site se construit quand même.
import siteConfig from '../../site.config.mjs';

export type Review = {
  id: string;
  rating: number;
  body: string;
  author: string;
  photo: string | null;
  lang: string;
  products: string[];
  date: string;
};

let cache: Promise<Review[]> | null = null;

export function getReviews(): Promise<Review[]> {
  if (cache) return cache;
  const atelier = siteConfig.shop?.atelier ?? {};
  cache = (async () => {
    // Test local : REVIEWS_MOCK=chemin.json npm run build (aucun appel réseau).
    if (process.env.REVIEWS_MOCK) {
      const { readFileSync } = await import('node:fs');
      return JSON.parse(readFileSync(process.env.REVIEWS_MOCK, 'utf8')) as Review[];
    }
    try {
      const origin = new URL(atelier.widgetUrl ?? '').origin;
      const res = await fetch(`${origin}/api/public/reviews?shop_id=${atelier.shopId}`);
      if (!res.ok) return [];
      const body = await res.json();
      return Array.isArray(body?.reviews) ? (body.reviews as Review[]) : [];
    } catch {
      return [];
    }
  })();
  return cache;
}

export function summary(list: Review[]) {
  const count = list.length;
  const avg = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { count, avg: Math.round(avg * 10) / 10 };
}
