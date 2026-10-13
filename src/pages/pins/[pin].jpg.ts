// Images des épingles Pinterest : la photo du design sur le modèle (WebP à
// fond transparent) posée sur le fond crème de la boutique, en JPEG 1000×1500
// (format 2:3 recommandé par Pinterest). Générées au build, seulement pour
// les épingles déjà dues.
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { CSV_DAYS, duePins } from '../../lib/pinterest';

export async function getStaticPaths() {
  return (await duePins(new Date(), 2 * CSV_DAYS + 1)).map((p) => ({ params: { pin: p.id }, props: { source: p.source } }));
}

export const GET: APIRoute = async ({ props }) => {
  const jpg = await sharp(`public${(props as { source: string }).source}`)
    .resize(1000, 1500, { fit: 'contain', background: '#f6f1ee' })
    .flatten({ background: '#f6f1ee' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return new Response(jpg, { headers: { 'Content-Type': 'image/jpeg' } });
};
