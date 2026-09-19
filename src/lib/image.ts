/**
 * Helpers srcset responsive.
 * Supporte :
 *  - Unsplash : rewrites `w=` param
 *  - WebP local : utilise les variantes -400w.webp / -800w.webp générées
 *    par scripts/generate-responsive.mjs
 *  - Autre (png/jpg externes) : fallback gracieux (pas de srcset)
 */
import fs from 'node:fs';
import path from 'node:path';

const UNSPLASH_WIDTHS = [400, 600, 800, 1200, 1600];

/** Le même visuel revient sur toutes les pages : on n'interroge le disque qu'une fois. */
const variantCache = new Map<string, boolean>();
function variantExists(urlPath: string): boolean {
  const cached = variantCache.get(urlPath);
  if (cached !== undefined) return cached;
  const ok = fs.existsSync(path.join(process.cwd(), 'public', urlPath.replace(/^\//, '')));
  variantCache.set(urlPath, ok);
  return ok;
}

function isLocalWebp(src: string): boolean {
  return !!src && !src.startsWith('http') && /\.webp$/i.test(src);
}

function isUnsplash(src: string): boolean {
  return !!src && src.includes('images.unsplash.com');
}

export function unsplashSrcset(src: string, widths: number[] = UNSPLASH_WIDTHS): string {
  if (!src) return '';

  // WebP local → variantes pré-générées (-400w, -800w), mais UNIQUEMENT
  // celles qui existent vraiment sur le disque. Annoncer une source absente
  // n'affiche pas l'image d'origine à la place : le navigateur laisse un
  // cadre vide. Une image déposée sans passer par generate-responsive.mjs
  // retombe donc simplement sur son fichier d'origine.
  if (isLocalWebp(src)) {
    const base = src.replace(/\.webp$/i, '');
    const sources = [
      variantExists(`${base}-400w.webp`) ? `${base}-400w.webp 400w` : null,
      variantExists(`${base}-800w.webp`) ? `${base}-800w.webp 800w` : null,
      `${src} 1200w`,
    ].filter(Boolean);
    return sources.length > 1 ? sources.join(', ') : '';
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
    // Sert la variante la plus proche comme base, si elle existe.
    const base = src.replace(/\.webp$/i, '');
    if (w <= 500 && variantExists(`${base}-400w.webp`)) return `${base}-400w.webp`;
    if (w <= 900 && variantExists(`${base}-800w.webp`)) return `${base}-800w.webp`;
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
