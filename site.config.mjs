/**
 * ============================================================
 *  CONFIGURATION DU SITE — le SEUL fichier à modifier pour
 *  rebrander ce starter sur un nouveau shop.
 *
 *  Tout ce qui est marqué « TODO » doit être renseigné.
 *  Après modification : `node scripts/init.mjs` (met à jour le
 *  nom du package et vérifie la config).
 * ============================================================
 */
const config = {
  // ─── Identité ────────────────────────────────────────────────────
  name: 'Vareska',
  // ⚠️ Sert de base aux URL canoniques, au sitemap et aux hreflang. Le domaine
  // doit donc être enregistré et pointer sur le site avant l'indexation.
  url: 'https://vareska.com',

  // Logo textuel, rendu en capitales espacées par le Header.
  // `logoSuffix` permet un accent de couleur sur la fin du nom ; laissé VIDE
  // ici volontairement : un nom coupé en deux teintes lit « startup » et casse
  // la lecture du mot, à l'opposé du registre maison visé.
  logoPrefix: 'Vareska',
  logoSuffix: '',
  description:
    'Vareska - coques et accessoires pour téléphone. Des pièces choisies pour durer, expédiées depuis la France.', // TODO: affiner le pitch (150-160 car.)

  // ─── Internationalisation ────────────────────────────────────────
  // Stratégie : sous-dossier, la locale par défaut n'a PAS de préfixe
  // (/mon-article/ en FR, /en/mon-article/ en EN).
  // Contenu localisé : src/content/<collection>/<lang>/<slug>.md
  i18n: {
    defaultLocale: 'fr',
    // Pour désactiver une langue, retire-la simplement de cette liste.
    locales: ['fr', 'en', 'de'],
    plannedLocales: [],
    locale: {
      fr: { label: 'Français', short: 'FR', htmlLang: 'fr-FR', ogLocale: 'fr_FR', currency: 'EUR' },
      en: { label: 'English',  short: 'EN', htmlLang: 'en',    ogLocale: 'en_US', currency: 'EUR' },
      de: { label: 'Deutsch',  short: 'DE', htmlLang: 'de-DE', ogLocale: 'de_DE', currency: 'EUR' },
    },
    // Taux figés au build. `node scripts/i18n-update-prices.mjs` les rafraîchit
    // (taux BCE) et régénère les prix des produits localisés depuis les prix FR.
    fxRates: {
      EUR: 1,
    },
    fxUpdatedAt: null,
  },

  // ─── Réseaux sociaux (laisser '' si inexistant) ───────────────────
  socials: {
    instagram: '',
    tiktok: '',
    youtube: '',
  },

  // ─── Catégories du blog ──────────────────────────────────────────
  // ⚠️ Ces valeurs alimentent un `z.enum` dans src/content/config.ts : le champ
  // `category:` d'un article doit correspondre EXACTEMENT à l'une d'elles
  // (attention aux apostrophes typographiques ’ vs droites ' — un écart casse le build).
  categories: ['Guides', 'Conseils', 'Actualités'],

  // Mapping explicite nom → slug d'URL (/category/<slug>/).
  categorySlugs: {
    'Guides': 'guides',
    'Conseils': 'conseils',
    'Actualités': 'actualites',
  },

  // ─── Génération d'articles IA (scripts/generate-article.mjs) ──────
  // Sert à construire le prompt. Plus c'est précis, meilleur est l'article.
  article: {
    context: 'une boutique en ligne', // TODO: ex. "un site français spécialisé dans les coques de téléphone"
    theme: "les produits de la boutique et les conseils d'achat associés", // TODO
    cta: 'Découvrir la sélection', // TODO
    author: "L'équipe MyShop", // TODO
    unsplashContext: 'product', // TODO: mot-clé ajouté aux recherches d'images
    coverFallbackKeyword: 'product', // TODO
  },

  // ─── Catégories produits ─────────────────────────────────────────
  // Chaque entrée génère une page /product-category/<slug>/.
  // Un fichier src/content/productCategories/<slug>.md (optionnel) y ajoute
  // le contenu SEO (intro, guide d'achat, FAQ).
  productCategories: [
    { slug: 'categorie-exemple', label: 'Catégorie exemple' },
  ],

  // ─── Formulaires (Web3Forms) ─────────────────────────────────────
  // Service gratuit, 100% côté client, aucun backend requis.
  // 1. Compte sur https://web3forms.com  2. Colle l'Access Key ici.
  forms: {
    web3formsKey: '',                    // TODO
    contactEmail: 'contact@vareska.com', // TODO: créer la boîte chez ton hébergeur
  },

  // ─── Boutique ────────────────────────────────────────────────────
  shop: {
    enabled: true,
    provider: 'atelier',   // widget de checkout (voir README)
    // Identifiants du widget Atelier. Tant que shopId est vide, AUCUN widget
    // n'est injecté (le site fonctionne en vitrine sans checkout).
    atelier: {
      widgetUrl: '',       // TODO: URL du script widget.js de ton instance
      shopId: '',          // TODO: ID de ton shop Atelier
    },
    currency: 'EUR',
    // Slug de la page catalogue. DOIT correspondre au nom des fichiers
    // src/pages/<path>.astro et src/pages/[lang]/<path>.astro.
    path: 'boutique',
  },
};

export default config;
