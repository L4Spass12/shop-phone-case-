// Catalogue produits Meta (Commerce Manager > Catalogue > Sources de données >
// Flux de données programmé, URL https://moroji.com/catalogue-meta.csv).
// Une ligne par coque, régénérée à chaque déploiement : Meta relit le fichier
// tous les jours, une nouvelle coque entre donc seule dans le catalogue.
//
// id = slug du produit, le même que les content_ids envoyés par le pixel
// (MetaPixel.astro, pid()) et l'API de conversions : c'est ce qui permet à
// Meta de remontrer à un visiteur la coque exacte qu'il a regardée.
// Le modèle de téléphone n'est pas une variante (voir site.config.mjs,
// phoneModels) : même prix, même photo, donc une seule ligne par coque.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import siteConfig from '../../site.config.mjs';
import { parseEntrySlug } from '../lib/i18n';

const SITE = siteConfig.url;
// Taxonomie Google 2353 : Mobile Phone Cases.
const GOOGLE_CATEGORY = '2353';

const c = (v: string) => `"${v.replace(/"/g, '""')}"`;
const eur = (n: number) => `${n.toFixed(2)} EUR`;

export const GET: APIRoute = async () => {
  const labels = new Map(
    (siteConfig.productCategories as { slug: string; label: string; theme?: boolean }[])
      .filter((cat) => cat.theme)
      .map((cat) => [cat.slug, cat.label]),
  );
  const products = (await getCollection('products'))
    .filter((p) => parseEntrySlug(p.slug).lang === 'fr')
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const rows = products.map((p) => {
    const d = p.data;
    const theme = d.categories.map((s) => labels.get(s)).find(Boolean) ?? 'Coques';
    const promo = d.compareAtPrice && d.compareAtPrice > d.price;
    return [
      p.slug,
      d.name.slice(0, 150),
      d.shortDescription,
      'in stock',
      'new',
      eur(promo ? d.compareAtPrice! : d.price),
      promo ? eur(d.price) : '',
      `${SITE}/product/${p.slug}/`,
      `${SITE}/catalogue/${p.slug}.jpg`,
      siteConfig.name,
      GOOGLE_CATEGORY,
      `Coques de téléphone > ${theme}`,
      theme,
      d.printModes.includes('relief') ? 'relief' : 'plat',
    ].map(c).join(',');
  });
  const head = 'id,title,description,availability,condition,price,sale_price,link,image_link,brand,google_product_category,product_type,custom_label_0,custom_label_1';
  return new Response([head, ...rows].join('\n') + '\n', { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
