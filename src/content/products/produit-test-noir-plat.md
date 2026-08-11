---
# ─── PRODUIT DE TEST — bouton noir plat ───────────────────────────────────
# Page de comparaison A/B : noir plat sans relief, flèche qui glisse au survol
# (atcVariant: ink-flat). Registre éditorial / maison.
# Conventions du starter exploitées :
#   - `categories: []`      → masqué de la boutique + noindex + pas de hreflang
#   - slug `produit-test-*` → exclu du sitemap et de la traduction auto
# Variations CONSERVÉES : 'ink-flat' n'est qu'une classe CSS, que la réécriture
# de l'innerHTML par le sélecteur de variantes ne touche pas.
# URL directe : /product/produit-test-noir-plat/
# À SUPPRIMER une fois le style choisi (ou promouvoir via atcVariant).
name: "Produit test - bouton noir plat"
price: 19.90
image: "/images/products/produit-exemple.webp"
gallery:
  - "/images/products/produit-exemple-b.webp"
  - "/images/products/produit-exemple-c.webp"
imageAlt: "Produit de démonstration du bouton noir plat"
categories: []
shortDescription: "Page de test A/B : bouton noir plat, sans relief, avec flèche qui glisse au survol."
featured: false
pubDate: 2026-07-30
atcVariant: ink-flat
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

Page de test interne. Le bouton est ici **noir plat** : pas de dégradé, pas de
liseré, pas de reflet, pas de soulèvement au survol. Le seul mouvement est la
flèche qui avance de trois pixels, et le fond qui s'éclaircit légèrement.

L'icône panier est remplacée par une flèche : le panier décrit une mécanique,
la flèche décrit une direction. Sur une page où le bouton est déjà le seul bloc
plein, la mécanique n'a pas besoin d'être illustrée.

À comparer avec la [version dégradée noire](/product/produit-test-noir/), la
[version lueur](/product/produit-test-noir-lueur/) et la
[version violette](/product/produit-exemple/).

## Caractéristiques

- Caractéristique 1 : valeur à remplacer
- Caractéristique 2 : valeur à remplacer
- Caractéristique 3 : valeur à remplacer
