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
  // ⚠️ Ces valeurs sont la liste de référence du champ `category:` d'un article
  // (validation dans src/content/config.ts). La comparaison est tolérante aux
  // écarts invisibles — apostrophe typographique ’ vs droite ', accent
  // décomposé, espace insécable, casse — et l'article hérite du libellé écrit
  // ICI. Corollaire : deux catégories qui ne diffèrent QUE par ces caractères
  // sont ambiguës et arrêtent le build.
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

  // ─── Modèles de téléphone compatibles ────────────────────────────
  // Le modèle n'est PAS une variation produit (comme la couleur) mais une
  // CONFIGURATION : même coque, même prix, même stock, moule différent. Le
  // mettre en variation obligerait à écrire 3 coloris × 50 modèles = 150
  // lignes dans CHAQUE fiche. Il vit donc ici, une seule fois, et le choix
  // du client est transmis au panier avec la commande.
  //
  // ⚠️ À VÉRIFIER AVANT MISE EN LIGNE. Cette liste est un point de départ :
  // ne garde QUE les modèles pour lesquels tu as réellement le moule. Un
  // modèle listé mais non fournissable = commande impossible à honorer.
  // `popular: true` remonte le modèle dans la liste courte affichée par
  // défaut (le chemin rapide pour la majorité des visiteurs).
  phoneModels: {
    // Ordre d'affichage des marques dans le sélecteur.
    brands: [
      {
        id: 'apple',
        label: 'iPhone',
        // Du plus récent au plus ancien : un visiteur a plus de chances
        // d'avoir un téléphone récent, autant lui éviter de faire défiler.
        models: [
          { label: 'iPhone 17 Pro Max' },
          { label: 'iPhone 17 Pro' },
          { label: 'iPhone 17', popular: true },
          { label: 'iPhone 16 Pro Max', popular: true },
          { label: 'iPhone 16 Pro', popular: true },
          { label: 'iPhone 16 Plus' },
          { label: 'iPhone 16', popular: true },
          { label: 'iPhone 15 Pro Max' },
          { label: 'iPhone 15 Pro', popular: true },
          { label: 'iPhone 15 Plus' },
          { label: 'iPhone 15', popular: true },
          { label: 'iPhone 14 Pro Max' },
          { label: 'iPhone 14 Pro' },
          { label: 'iPhone 14 Plus' },
          { label: 'iPhone 14', popular: true },
          { label: 'iPhone 13 Pro Max' },
          { label: 'iPhone 13 Pro' },
          { label: 'iPhone 13', popular: true },
          { label: 'iPhone 13 mini' },
          { label: 'iPhone 12 Pro Max' },
          { label: 'iPhone 12 Pro' },
          { label: 'iPhone 12' },
          { label: 'iPhone 12 mini' },
          { label: 'iPhone 11 Pro Max' },
          { label: 'iPhone 11 Pro' },
          { label: 'iPhone 11', popular: true },
          { label: 'iPhone SE (2022)' },
          { label: 'iPhone XR' },
          { label: 'iPhone XS Max' },
          { label: 'iPhone XS' },
        ],
      },
      {
        id: 'samsung',
        label: 'Samsung Galaxy',
        models: [
          { label: 'Galaxy S25 Ultra', popular: true },
          { label: 'Galaxy S25+' },
          { label: 'Galaxy S25' },
          { label: 'Galaxy S24 Ultra', popular: true },
          { label: 'Galaxy S24+' },
          { label: 'Galaxy S24', popular: true },
          { label: 'Galaxy S23 Ultra' },
          { label: 'Galaxy S23+' },
          { label: 'Galaxy S23' },
          { label: 'Galaxy S22 Ultra' },
          { label: 'Galaxy S22+' },
          { label: 'Galaxy S22' },
          { label: 'Galaxy A56' },
          { label: 'Galaxy A55' },
          { label: 'Galaxy A36' },
          { label: 'Galaxy A35' },
          { label: 'Galaxy A26' },
          { label: 'Galaxy A25' },
          { label: 'Galaxy A16' },
          { label: 'Galaxy A15' },
        ],
      },
      {
        id: 'google',
        label: 'Google Pixel',
        models: [
          { label: 'Pixel 9 Pro XL' },
          { label: 'Pixel 9 Pro' },
          { label: 'Pixel 9', popular: true },
          { label: 'Pixel 8 Pro' },
          { label: 'Pixel 8' },
          { label: 'Pixel 8a' },
          { label: 'Pixel 7 Pro' },
          { label: 'Pixel 7' },
          { label: 'Pixel 7a' },
        ],
      },
      {
        id: 'xiaomi',
        label: 'Xiaomi',
        models: [
          { label: 'Xiaomi 15' },
          { label: 'Xiaomi 14' },
          { label: 'Redmi Note 14 Pro' },
          { label: 'Redmi Note 14' },
          { label: 'Redmi Note 13 Pro' },
          { label: 'Redmi Note 13' },
        ],
      },
    ],
  },

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
      widgetUrl: 'https://tanstack-start-app.seamless-cart.workers.dev/api/public/widget.js',
      shopId: '7fa02d12-6ebc-47ae-85ad-7767ebba8cf7',
    },
    currency: 'EUR',
    // Prix de la coque personnalisée du studio, en CENTIMES.
    // Source unique : le studio l'affiche, le manifeste /seamless-items.json le
    // déclare, et le serveur de paiement s'appuie sur ce manifeste pour refuser
    // un prix falsifié. Le changer ici suffit.
    customCasePriceCents: 2990,
    // Slug de la page catalogue. DOIT correspondre au nom des fichiers
    // src/pages/<path>.astro et src/pages/[lang]/<path>.astro.
    path: 'boutique',
  },
};

export default config;
