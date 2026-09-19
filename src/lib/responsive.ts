/**
 * Helper pour les images responsive (variantes générées par
 * scripts/generate-responsive.mjs : -400w.webp, -800w.webp en sibling).
 *
 * Renvoie un srcset utilisable directement dans <img srcset={...}>.
 * Pour les URL externes ou non-webp, retourne une chaîne vide.
 */
import fs from 'node:fs';
import path from 'node:path';

const variantCache = new Map<string, boolean>();
function variantExists(urlPath: string): boolean {
  const cached = variantCache.get(urlPath);
  if (cached !== undefined) return cached;
  const ok = fs.existsSync(path.join(process.cwd(), 'public', urlPath.replace(/^\//, '')));
  variantCache.set(urlPath, ok);
  return ok;
}

export function responsiveSrcset(src: string | undefined): string {
  if (!src) return '';
  if (src.startsWith('http')) return '';
  if (!src.endsWith('.webp')) return '';

  // Même prudence que dans lib/image.ts : on n'annonce que les variantes
  // réellement présentes. Un srcset qui pointe vers un fichier absent laisse
  // un cadre vide, il ne retombe pas sur `src`.
  const base = src.replace(/\.webp$/, '');
  const sources = [
    variantExists(`${base}-400w.webp`) ? `${base}-400w.webp 400w` : null,
    variantExists(`${base}-800w.webp`) ? `${base}-800w.webp 800w` : null,
    `${src} 1200w`,
  ].filter(Boolean);
  return sources.length > 1 ? sources.join(', ') : '';
}
