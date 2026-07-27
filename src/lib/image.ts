/**
 * Helpers srcset responsive.
 * Supporte :
 *  - Unsplash : rewrites `w=` param
 *  - WebP local : utilise les variantes -400w.webp / -800w.webp générées
 *    par scripts/generate-responsive.mjs
 *  - Autre (png/jpg externes) : fallback gracieux (pas de srcset)
 */
const UNSPLASH_WIDTHS = [400, 600, 800, 1200, 1600];

function isLocalWebp(src: string): boolean {
  return !!src && !src.startsWith('http') && /\.webp$/i.test(src);
}

function isUnsplash(src: string): boolean {
  return !!src && src.includes('images.unsplash.com');
}

export function unsplashSrcset(src: string, widths: number[] = UNSPLASH_WIDTHS): string {
  if (!src) return '';

  // WebP local → variantes pré-générées (-400w, -800w)
  if (isLocalWebp(src)) {
    const base = src.replace(/\.webp$/i, '');
    return `${base}-400w.webp 400w, ${base}-800w.webp 800w, ${src} 1200w`;
  }

  if (!isUnsplash(src)) return '';
  try {
    const url = new URL(src);
    return widths
      .map((w) => {
        url.searchParams.set('w', String(w));
        return `${url.toString()} ${w}w`;
      })
      .join(', ');
  } catch {
    return '';
  }
}

/** Base src — width spécifique pour Unsplash, sinon src tel quel. */
export function unsplashAt(src: string, w: number): string {
  if (!src) return src;
  if (isLocalWebp(src)) {
    // Sert la variante la plus proche comme base
    const base = src.replace(/\.webp$/i, '');
    if (w <= 500) return `${base}-400w.webp`;
    if (w <= 900) return `${base}-800w.webp`;
    return src;
  }
  if (!isUnsplash(src)) return src;
  try {
    const url = new URL(src);
    url.searchParams.set('w', String(w));
    return url.toString();
  } catch {
    return src;
  }
}
