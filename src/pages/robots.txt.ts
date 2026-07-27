import siteConfig from '../../site.config.mjs';

export async function GET() {
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.url}/sitemap-index.xml\n\nContent-Signal: ai-train=no, search=yes, ai-input=yes\n`
  );
}
