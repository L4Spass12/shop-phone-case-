// Produits d'une langue, pour les listes (boutique, catégories).
//
// La fiche FRANÇAISE est la référence : prix, images, catégories, options.
// Une traduction (src/content/products/<lang>/<slug>.md) ne fournit que les
// textes (nom, accroche, texte alternatif). Hors français, un produit sans
// traduction n'a pas de page : il n'est pas listé.
import { getCollection, type CollectionEntry } from 'astro:content';
import { parseEntrySlug, type Locale } from './i18n';

export type LocalizedProduct = {
  /** Slug de la fiche FR (sans préfixe de langue). */
  slug: string;
  data: CollectionEntry<'products'>['data'];
};

export async function localizedProducts(lang: Locale): Promise<LocalizedProduct[]> {
  const all = await getCollection('products');
  const bySlug = new Map(all.map(p => [p.slug, p]));
  return all
    .filter(p => parseEntrySlug(p.slug).lang === 'fr')
    .flatMap(p => {
      if (lang === 'fr') return [{ slug: p.slug, data: p.data }];
      const tr = bySlug.get(`${lang}/${p.slug}`);
      if (!tr) return [];
      return [{
        slug: p.slug,
        data: {
          ...p.data,
          name: tr.data.name,
          shortDescription: tr.data.shortDescription,
          imageAlt: tr.data.imageAlt ?? p.data.imageAlt,
        },
      }];
    });
}
