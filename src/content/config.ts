import { defineCollection, z } from 'astro:content';
import siteConfig from '../../site.config.mjs';

const categories = siteConfig.categories as [string, ...string[]];

/**
 * Le champ `category:` d'un article était validé par un `z.enum`, donc par
 * égalité STRICTE avec siteConfig.categories. En pratique l'écart vient
 * toujours de caractères qu'on ne voit pas : apostrophe typographique ’ au
 * lieu de ', accent décomposé (e + ́ ) recopié depuis un traitement de texte,
 * espace insécable, casse. Et le seul symptôme est un build cassé — donc plus
 * AUCUN déploiement, puisque la branche hostinger-deploy n'est réécrite que si
 * `npm run build` passe : une faute de frappe invisible gelait tout le site.
 *
 * On compare donc sur une forme normalisée. Les diacritiques sont retirés au
 * passage : « Actualites » n'est pas invisible, mais c'est la même faute au
 * même endroit, et la garde de collision ci-dessous rend l'opération sûre.
 */
const normalizeCategory = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[‘’ʼ´`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * Forme normalisée → libellé EXACT de la config.
 *
 * Le retour canonique n'est pas cosmétique : tout le site compare
 * `post.data.category` par `===` à siteConfig.categories et s'en sert comme
 * clé de `categorySlugs`. Accepter « actualités » sans le réécrire en
 * « Actualités » ferait bâtir le site sans erreur mais l'article disparaîtrait
 * de sa page de catégorie et du fil d'articles liés — une panne silencieuse,
 * donc pire que le build cassé qu'on corrige ici.
 */
const canonicalCategory = new Map<string, string>();
for (const label of categories) {
  const key = normalizeCategory(label);
  const clash = canonicalCategory.get(key);
  if (clash) {
    throw new Error(
      `site.config.mjs → categories : « ${clash} » et « ${label} » sont ` +
        `indistinguables une fois normalisés. Un article ne pourrait pas ` +
        `désigner l'un plutôt que l'autre : renomme-en un.`,
    );
  }
  canonicalCategory.set(key, label);
}

const category = z.string().transform((value, ctx) => {
  const canonical = canonicalCategory.get(normalizeCategory(value));
  if (canonical) return canonical;

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message:
      `catégorie inconnue : « ${value} ». Valeurs autorisées ` +
      `(site.config.mjs → categories) : ${categories.map((c) => `« ${c} »`).join(', ')}.`,
  });
  return z.NEVER;
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default(siteConfig.article.author),
    category,
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageTitle: z.string().optional(),
    featured: z.boolean().default(false),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

/**
 * Une valeur d'attribut (ex. "XL", "Bleu foncé")
 */
const attrValue = z.object({
  label: z.string(),  // "Bleu foncé"
  slug: z.string(),   // "bleu-fonce"
});

/**
 * Un attribut de produit (ex. "Dimensions" avec 3 valeurs)
 */
const attribute = z.object({
  name: z.string(),              // "Dimensions"
  values: z.array(attrValue),    // [{label:"45 × 35 cm", slug:"45-x-35-cm"}, ...]
});

/**
 * Une variante = une combinaison spécifique d'attributs, avec son prix/stock/image propres
 */
const variation = z.object({
  id: z.union([z.number(), z.string()]),
  sku: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  inStock: z.boolean().default(true),
  stock: z.number().int().nonnegative().nullable().optional(),
  // quelle combinaison d'attributs cette variation représente
  // ex: {"Dimensions": "45-x-35-cm", "Couleurs": "bleu-fonce"}
  attributes: z.record(z.string(), z.string()),
  // image propre à la variante (optionnelle)
  image: z.string().optional(),
});

const products = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    // Prix affichés par défaut (= prix min si plusieurs variantes)
    price: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    // Si le produit a plusieurs variantes avec des prix différents,
    // on affiche "dès X €" sur les listings
    priceRange: z.object({
      min: z.number().positive(),
      max: z.number().positive(),
    }).optional(),
    image: z.string(),
    imageAlt: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    // Plusieurs catégories possibles (ex. gaming + manga-anime)
    categories: z.array(z.string()).default([]),
    shortDescription: z.string(),
    weight: z.number().int().positive().optional(),
    stock: z.number().int().nonnegative().nullable().optional(),
    sku: z.string().optional(),
    featured: z.boolean().default(false),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Style du bouton "Ajouter au panier" (test A/B) :
    //  - 'gradient' (défaut) : bouton dégradé accent .btn-atc
    //  - 'ink'               : le MÊME bouton en noir
    //  - 'ink-flat'          : noir plat, relief léger, flèche qui glisse
    //  - 'ink-glow'          : noir avec une lueur qui suit le curseur
    //  - 'ink-frame'         : biseau + cadre qui se dessine au survol
    //  - 'blob'              : bouton glassmorphism .btn-atc-blob
    // ⚠️ 'blob' repose sur des éléments enfants (blobs + couche verre) : il
    // n'est appliqué QU'AUX produits SANS variations, car le JS du sélecteur
    // de variantes réécrit l'innerHTML du bouton et détruirait ces enfants.
    // Les variantes 'ink*' n'ont pas cette limite : ce sont de simples classes
    // CSS posées sur le bouton, que la réécriture de l'innerHTML ne touche pas.
    // ⚠️ Cette liste est volontairement longue le temps du test A/B : ne garder
    // que le style retenu une fois le choix fait.
    atcVariant: z
      .enum(['gradient', 'ink', 'ink-flat', 'ink-glow', 'ink-frame', 'blob'])
      .default('gradient'),
    // ─── Variantes ───
    attributes: z.array(attribute).default([]),
    variations: z.array(variation).default([]),
  }),
});

/**
 * Contenu SEO des pages /product-category/<slug>/
 *  - frontmatter = métadonnées + intro courte + FAQ structurée
 *  - body markdown = guide d'achat (H2/H3), affiché sous la grille produits
 */
const productCategories = defineCollection({
  type: 'content',
  // NB: le slug est dérivé automatiquement du nom de fichier par Astro.
  // Le fichier `boutique-kawaii.md` → entry.slug === 'boutique-kawaii'.
  schema: z.object({
    title: z.string(),                // H1 + <title>
    metaDescription: z.string(),      // <meta name="description">
    intro: z.string(),                // paragraphe sous le H1, au-dessus de la grille (plaintext)
    // Titre du toggle "guide d'achat" — doit contenir le mot-clé cible
    // ex: "Tout savoir sur les produits de cette categorie"
    guideHeading: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    updatedDate: z.coerce.date().optional(),
  }),
});

export const collections = { blog, products, productCategories };
