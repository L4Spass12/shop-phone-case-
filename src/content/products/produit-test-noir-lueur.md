---
# ─── PRODUIT DE TEST — bouton noir à lueur ────────────────────────────────
# Page de comparaison A/B : noir dégradé avec une lueur qui suit le curseur
# (atcVariant: ink-glow). Registre premium tech.
# Conventions du starter exploitées :
#   - `categories: []`      → masqué de la boutique + noindex + pas de hreflang
#   - slug `produit-test-*` → exclu du sitemap et de la traduction auto
# Variations CONSERVÉES : 'ink-glow' n'est qu'une classe CSS, que la réécriture
# de l'innerHTML par le sélecteur de variantes ne touche pas.
# URL directe : /product/produit-test-noir-lueur/
# À SUPPRIMER une fois le style choisi (ou promouvoir via atcVariant).
name: "Produit test - bouton noir a lueur"
price: 19.90
image: "/images/products/produit-exemple.webp"
imageAlt: "Produit de démonstration du bouton noir à lueur"
categories: []
shortDescription: "Page de test A/B : bouton noir dont la lueur suit le curseur au survol."
featured: false
pubDate: 2026-07-30
atcVariant: ink-glow
attributes:
  - name: "Couleur"
    values:
      - label: "Noir"
        slug: "noir"
      - label: "Blanc"
        slug: "blanc"
variations:
  - id: 1
    price: 19.90
    inStock: true
    attributes:
      Couleur: "noir"
  - id: 2
    price: 19.90
    inStock: true
    attributes:
      Couleur: "blanc"
---

Page de test interne. Le bouton porte une **lueur qui suit le curseur** :
promène la souris dessus, la tache lumineuse se déplace avec elle.

Au repos — et sur mobile, où il n'y a pas de curseur — la lueur reste haute et
centrée, comme une lumière posée au-dessus du bouton. L'effet doit donc être
réussi à l'arrêt autant qu'en mouvement, ce n'est pas un effet réservé au
desktop.

À comparer avec la [version dégradée noire](/product/produit-test-noir/), la
[version plate](/product/produit-test-noir-plat/) et la
[version violette](/product/produit-exemple/).

## Caractéristiques

- Caractéristique 1 : valeur à remplacer
- Caractéristique 2 : valeur à remplacer
- Caractéristique 3 : valeur à remplacer
