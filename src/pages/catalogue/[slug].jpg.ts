// Images du catalogue produits Meta : la photo principale de la coque (WebP à
// fond transparent ou blanc) posée sur un fond blanc, en JPEG carré
// 1080×1080, le format le plus sûr pour les publicités catalogue.
// Voir catalogue-meta.csv.ts.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';
import { parseEntrySlug } from '../../lib/i18n';

export async function getStaticPaths() {
  const products = await getCollection('products');
  return products
    .filter((p) => parseEntrySlug(p.slug).lang === 'fr')
    .map((p) => ({ params: { slug: p.slug }, props: { source: p.data.image } }));
}

export const GET: APIRoute = async ({ props }) => {
  const jpg = await sharp(`public${(props as { source: string }).source}`)
    .resize(1080, 1080, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return new Response(jpg, { headers: { 'Content-Type': 'image/jpeg' } });
};
