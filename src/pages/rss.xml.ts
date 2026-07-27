import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import siteConfig from '../../site.config.mjs';
import { parseEntrySlug } from '../lib/i18n';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog');
  const defaultLocale = siteConfig.i18n.defaultLocale;
  return rss({
    title: `Blog ${siteConfig.name}`,
    description: siteConfig.description,
    site: context.site ?? siteConfig.url,
    items: posts
      // Flux = locale par défaut uniquement (les traductions EN/DE vivent
      // sous /en/ et /de/, elles n'ont pas leur place dans le feed FR).
      .filter((post) => parseEntrySlug(post.slug).lang === defaultLocale)
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/${post.slug}/`,
        categories: [post.data.category, ...post.data.tags],
        author: post.data.author,
      })),
    customData: `<language>${siteConfig.i18n.locale[defaultLocale]?.htmlLang ?? 'fr-FR'}</language>`,
    stylesheet: undefined,
  });
}
