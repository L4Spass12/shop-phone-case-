/**
 * Choix de la BONNE TAILLE de fichier pour une image locale.
 *
 * Le problème que ça résout : une vignette de 74 px affichait le fichier
 * d'origine en 1200x1500. Le navigateur téléchargeait 95 Ko puis décodait
 * 1,8 million de pixels pour en peindre 5 500 — trois fois de suite sur la
 * fiche produit. C'est invisible sur un Mac relié à la fibre, et c'est
 * exactement ce qui fait saccader un téléphone.
 *
 * `scripts/generate-responsive.mjs` produit déjà des variantes `-400w.webp`
 * et `-800w.webp` à côté de chaque image. On s'en sert ici, mais SEULEMENT
 * après avoir vérifié que le fichier existe vraiment sur le disque : une
 * image déposée à la main sans passer par le script n'a pas de variante, et
 * pointer vers un fichier absent afficherait un cadre vide (le navigateur ne
 * revient pas à `src` quand une URL de `srcset` renvoie 404).
 *
 * Module réservé à la construction du site : il lit le disque, donc il ne
 * doit jamais être importé depuis un script de navigateur.
 */
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

/** Mémo : le même visuel revient sur toutes les pages, inutile de réinterroger le disque. */
const existsCache = new Map<string, boolean>();

function existsInPublic(urlPath: string): boolean {
  const cached = existsCache.get(urlPath);
  if (cached !== undefined) return cached;
  const ok = fs.existsSync(path.join(PUBLIC_DIR, urlPath.replace(/^\//, '')));
  existsCache.set(urlPath, ok);
  return ok;
}

/**
 * Renvoie la variante de `width` pixels de large si elle existe, sinon
 * l'image d'origine inchangée. Les URL externes et les formats autres que
 * WebP passent au travers sans modification.
 *
 * Le suffixe de cache (`?v=3`) est préservé : les images du feed Instagram
 * en portent un, et le perdre servirait une version périmée.
 */
export function smallerVariant(src: string | undefined, width: 400 | 800): string {
  if (!src || src.startsWith('http')) return src ?? '';
  const [file, query] = src.split('?');
  if (!/\.webp$/i.test(file)) return src;
  const candidate = file.replace(/\.webp$/i, `-${width}w.webp`);
  if (!existsInPublic(candidate)) return src;
  return query ? `${candidate}?${query}` : candidate;
}
