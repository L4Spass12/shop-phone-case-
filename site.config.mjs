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
  name: 'Moroji',
  // ⚠️ Sert de base aux URL canoniques, au sitemap et aux hreflang. Le domaine
  // doit donc être enregistré et pointer sur le site avant l'indexation.
  url: 'https://moroji.com',

  // Logo textuel, rendu en capitales espacées par le Header.
  // `logoSuffix` permet un accent de couleur sur la fin du nom ; laissé VIDE
  // ici volontairement : un nom coupé en deux teintes lit « startup » et casse
  // la lecture du mot, à l'opposé du registre maison visé.
  logoPrefix: 'Moroji',
  logoSuffix: '',

  // La police des TITRES n'est plus un réglage : Plus Jakarta Sans est arrêtée.
  // Elle est déclarée une fois pour toutes dans src/styles/global.css, avec
  // ses trois graisses, et distribuée par --font-display. Elle habille les
  // titres, les libellés des boutons, les prix et le pied de page.
  description:
    "Moroji : coques de téléphone imprimées à l'unité dans notre atelier en France, à plat ou en relief. Motifs exclusifs ou votre propre design, pour iPhone et Samsung Galaxy.",

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
    tiktok: 'https://www.tiktok.com/@bymoroji',
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
    context: "Moroji, un atelier français qui imprime à l'unité des coques iPhone transparentes, à plat ou en relief",
    theme: "les coques iPhone, la personnalisation, l'impression en relief et l'entretien d'une coque",
    cta: 'Découvrir les coques',
    author: "L'équipe Moroji",
    unsplashContext: 'iphone case',
    coverFallbackKeyword: 'iphone case',
  },

  // ─── Catégories produits ─────────────────────────────────────────
  // Chaque entrée génère une page /product-category/<slug>/.
  // Un fichier src/content/productCategories/<slug>.md (optionnel) y ajoute
  // le contenu SEO (intro, guide d'achat, FAQ).
  // `theme: true` : catégorie de style, proposée en filtre dans la boutique.
  // ─── Pinterest : épingles automatiques (flux RSS par catégorie) ─────
  // /pinterest/<catégorie>.xml, à relier chacun à un tableau Pinterest
  // (Paramètres > Publication automatique > flux RSS). Une épingle = un design
  // sur un modèle précis. `startDate` vide = flux vides (rien ne part) : la
  // poser le jour du branchement, sinon Pinterest publierait tout l'arriéré.
  pinterest: {
    startDate: '2026-10-13',
    perDay: 4,
    // Balise Pinterest (conversions des campagnes), chargée après accord
    // cookies seulement : src/components/PinterestTag.astro.
    tagId: '2613207327157',
  },

  // Pixel Meta (ensemble de données « Moroji », portefeuille AMAT), chargé
  // après accord cookies seulement : src/components/MetaPixel.astro.
  meta: {
    pixelId: '1495819775709520',
  },

  productCategories: [
    { slug: 'coques-iphone', label: 'Coques iPhone' },
    { slug: 'coques-animaux', label: 'Animaux', labels: { en: 'Animals', de: 'Tiere' }, theme: true },
    { slug: 'coques-romantique', label: 'Romantique', labels: { en: 'Romantic', de: 'Romantisch' }, theme: true },
    { slug: 'coques-kawaii', label: 'Mignon & kawaii', labels: { en: 'Cute & kawaii', de: 'Süß & Kawaii' }, theme: true },
    { slug: 'coques-fleurs', label: 'Fleurs & nature', labels: { en: 'Flowers & nature', de: 'Blumen & Natur' }, theme: true },
    { slug: 'coques-paysages', label: 'Paysages & art', labels: { en: 'Landscapes & art', de: 'Landschaften & Kunst' }, theme: true },
    { slug: 'coques-riviera', label: 'Riviera & dolce vita', labels: { en: 'Riviera & dolce vita', de: 'Riviera & Dolce Vita' }, theme: true },
    { slug: 'coques-zen', label: 'Zen & estampes', labels: { en: 'Zen & Asian prints', de: 'Zen & Holzschnitte' }, theme: true },
    { slug: 'coques-motifs', label: 'Motifs & imprimés', labels: { en: 'Patterns & prints', de: 'Muster & Prints' }, theme: true },
    { slug: 'coques-auto', label: 'Auto & moto', labels: { en: 'Cars & bikes', de: 'Autos & Motorräder' }, theme: true },
    { slug: 'coques-citations', label: 'Citations', labels: { en: 'Quotes', de: 'Sprüche' }, theme: true },
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
    // Stock de départ (commande du 29/09/2026, 10 coques par modèle, 11 modèles) : on ne
    // propose QUE ces modèles. En ajouter un ici quand il entre en stock.
    // Tous `popular` : la liste est courte, elle s'affiche en entier.
    brands: [
      {
        id: 'apple',
        label: 'iPhone',
        // Du plus récent au plus ancien : un visiteur a plus de chances
        // d'avoir un téléphone récent, autant lui éviter de faire défiler.
        models: [
          // Même gabarit que les 17 Pro / Pro Max (src/data/model-aliases.json).
          { label: 'iPhone 18 Pro Max', popular: true },
          { label: 'iPhone 18 Pro', popular: true },
          { label: 'iPhone 17 Pro Max', popular: true },
          { label: 'iPhone 17 Pro', popular: true },
          { label: 'iPhone 17', popular: true },
          { label: 'iPhone 16 Pro Max', popular: true },
          { label: 'iPhone 16 Pro', popular: true },
          { label: 'iPhone 16 Plus', popular: true },
          { label: 'iPhone 16', popular: true },
          { label: 'iPhone 15 Pro Max', popular: true },
          { label: 'iPhone 15 Pro', popular: true },
          { label: 'iPhone 15 Plus', popular: true },
          { label: 'iPhone 15', popular: true },
          { label: 'iPhone 14', popular: true },
          { label: 'iPhone 13', popular: true },
          { label: 'iPhone 12', popular: true },
          { label: 'iPhone 11', popular: true },
        ],
      },
      {
        // Stock Samsung (commande du 06/10/2026) : coques transparentes « Aura ».
        id: 'samsung',
        label: 'Samsung Galaxy',
        models: [
          { label: 'Galaxy S26 Ultra', popular: true },
          { label: 'Galaxy S26', popular: true },
          { label: 'Galaxy S25 Ultra', popular: true },
          { label: 'Galaxy S25', popular: true },
          { label: 'Galaxy S24 Ultra', popular: true },
          { label: 'Galaxy S24', popular: true },
          { label: 'Galaxy A56 5G', popular: true },
          { label: 'Galaxy A36 5G', popular: true },
        ],
      },
    ],
    // Modèles SUR COMMANDE (18/10/2026) : catalogue du fournisseur de coques
    // vierges pas encore en stock. Le fournisseur livre en ~1 jour, on les
    // propose donc au même prix avec un délai allongé de `delayDays`.
    // Lus UNIQUEMENT par le sélecteur (badge « Sur commande »), la fiche
    // produit (encadré délai) et le studio (rectangle + zone caméra) : ils
    // n'ont ni photos, ni pages modèle, ni épingles Pinterest. Un modèle qui
    // entre en stock passe dans `brands` ci-dessus et sort de cette liste.
    onDemand: {
      delayDays: 2,
      brands: [
        {
          id: 'apple',
          label: 'iPhone',
          models: [
            'iPhone 17 Air', 'iPhone 17e', 'iPhone 16e',
            'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus',
            'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 mini',
            'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 mini',
          ],
        },
        {
          id: 'samsung',
          label: 'Samsung Galaxy',
          models: [
            'Galaxy S26+', 'Galaxy S26 Edge',
            'Galaxy S25+', 'Galaxy S25 Edge', 'Galaxy S25 FE',
            'Galaxy S24+', 'Galaxy S24 FE',
            'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
            'Galaxy S22',
            'Galaxy A57', 'Galaxy A55', 'Galaxy A37', 'Galaxy A35 5G', 'Galaxy A34 5G',
            'Galaxy A26 5G', 'Galaxy A25 5G', 'Galaxy A18', 'Galaxy A17',
            'Galaxy A16 5G', 'Galaxy A15', 'Galaxy A07', 'Galaxy A06 5G', 'Galaxy A05s',
          ],
        },
        {
          id: 'xiaomi',
          label: 'Xiaomi',
          models: [
            'Xiaomi 17 Pro', 'Xiaomi 17', 'Xiaomi 17T Pro', 'Xiaomi 17T',
            'Redmi Note 15 Pro 5G', 'Redmi Note 15 Pro 4G', 'Redmi Note 15 5G', 'Redmi Note 15 4G',
            'Redmi Note 14 Pro 5G', 'Redmi Note 14 Pro 4G', 'Redmi Note 14 5G', 'Redmi Note 14 4G',
            'Redmi Note 13 Pro 5G', 'Redmi Note 13 4G',
            'Redmi 15C', 'Redmi 14C', 'Redmi 13C 4G', 'Redmi A7 Pro', 'Redmi A5',
          ],
        },
        {
          id: 'google',
          label: 'Google Pixel',
          models: ['Pixel 9', 'Pixel 9a', 'Pixel 8', 'Pixel 8a'],
        },
        {
          id: 'honor',
          label: 'Honor',
          models: [
            'Honor 600 Pro', 'Honor 600', 'Honor 400', 'Honor 400 Lite',
            'Honor Magic 8 Lite', 'Honor Magic 7 Lite', 'Honor X5C Plus', 'Honor X5C',
          ],
        },
      ],
    },
  },

  // ─── Formulaires (Web3Forms) ─────────────────────────────────────
  // Service gratuit, 100% côté client, aucun backend requis.
  // 1. Compte sur https://web3forms.com  2. Colle l'Access Key ici.
  forms: {
    web3formsKey: '',                    // TODO
    contactEmail: 'contact@moroji.com', // TODO: créer la boîte chez ton hébergeur
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
    // Compte client (/compte) : connexion par code reçu par e-mail, sans mot
    // de passe. Projet Supabase du worker (le même pour toutes les boutiques,
    // commandes cloisonnées par shop_id). Clé « publishable » : publique par
    // conception, elle ne sert qu'à vérifier le code ; les commandes passent
    // par le worker, qui contrôle le jeton.
    account: {
      supabaseUrl: 'https://hkrgukmzrgqnjwhsypft.supabase.co',
      supabaseAnonKey: 'sb_publishable_f8ZX9qmxxE3eZF3uLqRNlQ_qntlTe4s',
    },
    currency: 'EUR',
    // Exemples du rendu en relief, montrés sur les fiches qui n'ont pas
    // encore leur propre photo relief (vignette « Exemple » et lien).
    // video : chemin d'une courte vidéo verticale (mp4), vide tant qu'absente.
    reliefExample: {
      video: '/videos/exemple-relief.mp4',
      poster: '/images/exemple-relief-poster.webp',
      photos: [
        '/images/products/coque-paysage-sakura-relief-v2.webp',
        '/images/products/coque-mosaique-soleil-relief.webp',
        '/images/products/coque-tigres-lune-relief.webp',
        '/images/products/coque-tourbillon-lune-relief.webp',
      ],
    },
    // Prix de la coque personnalisée du studio, en CENTIMES.
    // Source unique : le studio l'affiche, le manifeste /seamless-items.json le
    // déclare, et le serveur de paiement s'appuie sur ce manifeste pour refuser
    // un prix falsifié. Le changer ici suffit.
    customCasePriceCents: 1990,
    // Impression EN RELIEF : l'encre est déposée en plusieurs passes, le motif
    // se sent sous le doigt. Plus long à imprimer, donc plus cher. Le studio
    // fait choisir entre les deux avant l'ajout au panier, et envoie la clé
    // « custom-relief » quand c'est ce mode qui est retenu.
    customCaseReliefPriceCents: 2490,
    // Supplément RELIEF sur les coques du CATALOGUE (le studio, lui, a ses
    // deux prix complets ci-dessus). Ajouté au prix du produit quand l'acheteur
    // choisit le relief sur la fiche.
    // Comme le reste : le manifeste /seamless-items.json déclare les deux prix,
    // et le serveur de paiement refuse un relief payé au tarif du plat.
    catalogueReliefSurchargeCents: 500,
    // Offre de lancement (studio et catalogue) : à plat 19,90 €, relief
    // 24,90 €. Prix qui s'appliqueront ensuite, annoncés à côté (« puis
    // 24,90 € », « puis 31,90 € »). Un prix barré exigerait d'avoir déjà vendu
    // à ce prix dans les 30 derniers jours (règle des annonces de réduction) :
    // on annonce donc le prix à venir. null pour retirer la mention à la fin
    // de l'offre.
    launchNextCents: { flat: 2490, relief: 3190 },
    // Sticker décoratif posé sur la photo produit. Chemin d'image, ou null
    // pour ne rien afficher : la fiche ne doit pas dépendre d'un fichier qui
    // n'existerait pas encore.
    // Purement décoratif, donc alt vide et pointer-events désactivés : il ne
    // doit ni être annoncé par un lecteur d'écran, ni gêner le balayage de la
    // galerie sur mobile.
    // Sticker posé dans le coin haut droit de la carte produit.
    stickerCoin: '/images/sticker-angel-ombre.webp',
    // Ange accroché au bord haut du panneau des tiroirs, comme s'il se
    // cachait derrière. Image recadrée sur la ligne où ses mains s'agrippent.
    angePanneau: '/images/ange-panneau-2.webp',
    // Même principe sur l'accueil : l'ange s'accroche au bord haut de la
    // section « Personnalisez votre coque », une coque à personnaliser dans
    // une main et un stylet dans l'autre. Recadrée elle aussi sur sa ligne de
    // coupe, à 79,68 % de sa hauteur : c'est cette valeur que reprend le
    // calage en CSS.
    angeStudio: '/images/ange-studio-2.webp',
    // Marge, en MILLIMÈTRES, retirée sur tout le pourtour du fichier
    // d'impression. Les coques vierges sont transparentes et imprimées à plat :
    // le dos est plan, mais les bords remontent en s'arrondissant et l'encre y
    // accroche mal. 0 = à fond perdu.
    // ⚠️ À CALIBRER : imprime une coque, regarde jusqu'où l'encre tient
    // proprement, et mets la valeur ici. C'est le seul chiffre à changer.
    printInsetMm: 0,
    // Slug de la page catalogue. DOIT correspondre au nom des fichiers
    // src/pages/<path>.astro et src/pages/[lang]/<path>.astro.
    path: 'boutique',
  },
};

export default config;
