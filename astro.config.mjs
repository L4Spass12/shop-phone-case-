import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import siteConfig from './site.config.mjs';
import rehypeImageOptim from './src/lib/rehype-image-optim.mjs';

export default defineConfig({
  site: siteConfig.url,
  // ─── Internationalisation ────────────────────────────────────────
  // Routing en sous-dossier : la locale par défaut (fr) reste à la racine
  // pour préserver les URLs SEO existantes ; les autres prennent /<lang>/.
  // Tant que les traductions ne sont pas prêtes, on garde uniquement `fr`
  // dans `locales` (les pages /en/* et /de/* ne sont donc pas générées).
  i18n: {
    defaultLocale: siteConfig.i18n.defaultLocale,
    locales: siteConfig.i18n.locales,
    routing: {
      prefixDefaultLocale: false,
      // Fallback redirect : si une page /en/foo n'existe pas, redirige vers /foo
      // (la version FR par défaut). Évite les 404 sur les pages non encore
      // mirorées en EN/DE (contact, blog index, produits…).
      fallbackType: 'redirect',
    },
    // Pour que le fallback fonctionne sans dupliquer les routes déjà émises
    // explicitement par [lang]/[...slug].astro, on liste les locales mais SANS
    // configurer `fallback` : on s'appuie uniquement sur `prefixDefaultLocale:
    // false` qui laisse les pages racines comme version par défaut.
    // (fallback explicite = doublons /de/en/<slug>/ sur slugs déjà préfixés.)
  },
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Exclut les produits internes/test qui ne doivent pas être indexés
      // (slug commençant par `produit-test-` ou `test-`).
      filter: (page) => !/\/product\/(produit-)?test[-/]/.test(page),
      // Priorité différenciée par type de page (signal de hiérarchie pour les
      // crawlers). On retire d'abord le préfixe de locale (/en, /de) pour que
      // les versions traduites héritent de la même priorité que la FR.
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/^\/(en|de)(\/|$)/, '/');
        let priority = 0.7; // défaut : articles de blog (root /<slug>/) + reste
        if (path === '/') {
          priority = 1.0; // page d'accueil
        } else if (/^\/product\//.test(path) || /^\/product-category\//.test(path)) {
          priority = 0.9; // produits & catégories produits (cible commerciale)
        } else if (/^\/category\//.test(path) || path === '/boutique/' || path === '/blog/') {
          priority = 0.8; // listings (boutique, catégories blog, index blog)
        } else if (/^\/(mentions-legales|conditions-generales-de-vente-cgv|livraisons-et-retours|politique-de-confidentialite|contact)\/?$/.test(path)) {
          priority = 0.3; // pages légales & contact
        }
        item.priority = priority;
        return item;
      },
      // Multilingue : @astrojs/sitemap émet automatiquement les xhtml:link
      // alternates par locale dès qu'il y a au moins 2 locales actives.
      // Tant que `siteConfig.i18n.locales` ne contient que `fr`, l'option est
      // ignorée et le sitemap reste mono-langue (comportement actuel).
      ...(siteConfig.i18n.locales.length > 1
        ? {
            i18n: {
              defaultLocale: siteConfig.i18n.defaultLocale,
              locales: Object.fromEntries(
                siteConfig.i18n.locales.map((l) => [l, siteConfig.i18n.locale[l].htmlLang])
              ),
            },
          }
        : {}),
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeImageOptim],
  },
  prefetch: {
    // hover (au lieu de viewport) : prefetch uniquement sur survol/focus,
    // jamais automatiquement à l'apparition dans le viewport. Évite la
    // saturation réseau qui empêchait le load event de se compléter
    // (WebPageTest "Page Load Timeout" + Lighthouse "NO_LCP").
    // L'UX reste excellente : prefetch démarre dès le hover (~80ms avant clic).
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  compressHTML: true,
});
