// Manifeste des configurations ACHETABLES de la boutique, consommé par le
// back-office Seamless pour proposer un menu déroulant à l'écran « Fournisseur »
// (au lieu de faire saisir une clé à la main, que l'opérateur ne peut pas
// deviner puisque c'est la vitrine qui la fabrique).
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

export const GET: APIRoute = async () => {
  const products = await getCollection('products');

  const items = products
    // Une seule locale : la clé d'article ne dépend pas de la langue, énumérer
    // les traductions produirait des doublons.
    .filter((p) => parseEntrySlug(p.slug).lang === 'fr')
    // Les produits de test internes n'ont pas à apparaître dans un back-office.
    .filter((p) => !p.slug.startsWith('produit-test-'))
    .flatMap((p) => {
      const { name, image, variations, attributes } = p.data;

      if (!variations?.length) {
        return [{ key: p.slug, label: name, image: image ?? null }];
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
        label: labelFor(v),
        image: v.image ?? image ?? null,
      }));
    });

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
