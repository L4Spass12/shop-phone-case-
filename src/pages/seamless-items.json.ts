// Manifeste des configurations ACHETABLES de la boutique. Il sert à deux
// choses, et la seconde est la plus importante :
//
//  1. le menu déroulant de l'écran « Fournisseur » du back-office (au lieu de
//     faire saisir une clé à la main, que l'opérateur ne peut pas deviner
//     puisque c'est la vitrine qui la fabrique) ;
//  2. le PRIX FAISANT FOI. Le panier envoie un prix au serveur de paiement,
//     mais un prix venu du navigateur se modifie dans les outils de
//     développement : sans référence côté serveur, on pouvait payer une coque
//     un centime. Le serveur relit donc le prix ICI avant d'encaisser.
//
// Corollaire du point 2 : un article absent de ce manifeste devient
// INACHETABLE. Tout ce que la boutique vend doit y figurer, produits de test
// internes compris — d'où leur présence, signalée par un libellé préfixé
// plutôt qu'exclue.
//
// Pourquoi un manifeste et pas un scraping du HTML : les clés de variante sont
// écrites par le JS au clic (le sélecteur réécrit data-item-id), donc une lecture
// du HTML ne verrait que la première. Ici les données viennent des collections
// de contenu — la vitrine DÉCLARE ce qu'elle vend, on ne le devine pas.
//
// La clé doit rester identique à celle envoyée au panier :
//   · produit sans variantes  → <slug>
//   · produit avec variantes  → <slug>-v<id de variation>
// Le modèle de téléphone n'est PAS énuméré : la résolution côté Seamless essaie
// « <clé>::<modèle> » puis « <clé> » seule, donc une entrée par variante suffit
// tant que le SKU fournisseur ne dépend pas du modèle. Les énumérer produirait
// des centaines de lignes (2 coloris × 65 modèles) pour aucun gain.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { parseEntrySlug } from '../lib/i18n';
import siteConfig from '../../site.config.mjs';

export const GET: APIRoute = async () => {
  const products = await getCollection('products');

  const items = products
    // Une seule locale : la clé d'article ne dépend pas de la langue, énumérer
    // les traductions produirait des doublons.
    .filter((p) => parseEntrySlug(p.slug).lang === 'fr')
    .flatMap((p) => {
      const { name, image, variations, attributes } = p.data;
      // Les produits de test restent achetables (cf. en-tête) mais se
      // reconnaissent au premier coup d'œil dans le menu du back-office.
      const prefix = p.slug.startsWith('produit-test-') ? '[test] ' : '';
      // En centimes, comme le panier et Stripe. Les prix du contenu sont en
      // euros : une conversion unique ici évite les écarts d'arrondi.
      const cents = (v: number) => Math.round(v * 100);

      if (!variations?.length) {
        return [{ key: p.slug, label: prefix + name, price: cents(p.data.price), image: image ?? null }];
      }

      // Libellé lisible de la variation : « Noir », « Noir / XL »… reconstruit
      // depuis les attributs, comme le fait la fiche produit.
      const labelFor = (v: (typeof variations)[number]) => {
        const parts = Object.entries(v.attributes ?? {}).map(([attrName, slug]) => {
          const attr = attributes?.find((a) => a.name === attrName);
          return attr?.values.find((val) => val.slug === slug)?.label ?? slug;
        });
        return parts.length ? `${name} — ${parts.join(' / ')}` : name;
      };

      return variations.map((v) => ({
        key: `${p.slug}-v${v.id}`,
        label: prefix + labelFor(v),
        price: cents(v.price),
        image: v.image ?? image ?? null,
      }));
    });

  // La coque personnalisée n'est pas un produit du catalogue : elle est
  // fabriquée au clic dans le studio. Sans cette entrée, le serveur la
  // refuserait. La clé « custom » est celle que le studio place devant le
  // design (custom::<design_id>), et que le serveur retrouve en coupant au « :: ».
  if (siteConfig.shop?.customCasePriceCents) {
    items.push({
      key: 'custom',
      label: 'Coque personnalisée',
      price: siteConfig.shop.customCasePriceCents,
      image: null,
    });
  }

  return new Response(JSON.stringify({ items }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Lu par un back-office sur un autre domaine.
      'Access-Control-Allow-Origin': '*',
      // Court : le manifeste change à chaque ajout de produit, et il n'est lu
      // que ponctuellement depuis l'admin.
      'Cache-Control': 'public, max-age=300',
    },
  });
};
