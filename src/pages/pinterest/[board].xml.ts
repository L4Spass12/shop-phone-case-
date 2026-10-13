// Flux RSS d'un tableau Pinterest (une catégorie de coques). Voir lib/pinterest.ts.
import type { APIRoute } from 'astro';
import siteConfig from '../../../site.config.mjs';
import { BOARDS, duePins } from '../../lib/pinterest';

export function getStaticPaths() {
  return BOARDS.map((b) => ({ params: { board: b.slug }, props: { label: b.label } }));
}

const x = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ params, props }) => {
  // 50 dernières : Pinterest ne reprend que les nouveautés du flux.
  const pins = (await duePins()).filter((p) => p.board === params.board).slice(-50).reverse();
  const label = (props as { label: string }).label.toLowerCase();
  const items = pins.map((p) => `
    <item>
      <title>${x(p.title)}</title>
      <link>${x(p.link)}</link>
      <guid isPermaLink="false">${x(p.id)}</guid>
      <pubDate>${p.date.toUTCString()}</pubDate>
      <description>${x(p.description)}</description>
      <enclosure url="${x(p.image)}" type="image/jpeg" length="0" />
      <media:content url="${x(p.image)}" medium="image" type="image/jpeg" />
    </item>`).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${x(`Coques ${label} | ${siteConfig.name}`)}</title>
    <link>${siteConfig.url}/product-category/${params.board}/</link>
    <description>${x(`Coques ${label} pour iPhone et Samsung, imprimées en France.`)}</description>
    <language>fr-FR</language>${items}
  </channel>
</rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
