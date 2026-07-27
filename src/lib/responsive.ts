/**
 * Helper pour les images responsive (variantes générées par
 * scripts/generate-responsive.mjs : -400w.webp, -800w.webp en sibling).
 *
 * Renvoie un srcset utilisable directement dans <img srcset={...}>.
 * Pour les URL externes ou non-webp, retourne une chaîne vide.
 */
export function responsiveSrcset(src: string | undefined): string {
  if (!src) return '';
  if (src.startsWith('http')) return '';
  if (!src.endsWith('.webp')) return '';

  const base = src.replace(/\.webp$/, '');
  return `${base}-400w.webp 400w, ${base}-800w.webp 800w, ${src} 1200w`;
}
