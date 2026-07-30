---
# ─── PRODUIT DE TEST — bouton ATC noir ────────────────────────────────────
# Page de comparaison A/B : le bouton dégradé décliné en noir (atcVariant: ink)
# face à la version violette du produit exemple.
# Conventions du starter exploitées :
#   - `categories: []`      → masqué de la boutique + noindex + pas de hreflang
#   - slug `produit-test-*` → exclu du sitemap et de la traduction auto
# Contrairement au test « blob », les variations sont CONSERVÉES : le style
# 'ink' n'est qu'un jeu de variables CSS sur le bouton, que la réécriture de
# l'innerHTML par le sélecteur de variantes ne touche pas. La page est donc un
# duplicata fidèle du produit exemple — seule la couleur du CTA change.
# URL directe : /product/produit-test-noir/
# À SUPPRIMER une fois le style choisi (ou promouvoir via atcVariant).
name: "Produit test - bouton noir"
price: 19.90
image: "/images/products/produit-exemple.webp"
imageAlt: "Produit de démonstration du bouton noir"
categories: []
shortDescription: "Page de test A/B : bouton « Ajouter au panier » en noir, à comparer à la version violette."
featured: false
pubDate: 2026-07-30
atcVariant: ink
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

Page de test interne : ce produit sert uniquement à comparer le bouton
« Ajouter au panier » en **noir** avec la version dégradée violette visible sur
[le produit exemple](/product/produit-exemple/), et avec la version
[blob glassmorphism](/product/produit-test-blob/).

Le reste de la page est identique au produit exemple (mêmes variantes, même
prix, même image) pour que seule la couleur du CTA change d'une page à l'autre.

Il est masqué de la boutique, exclu du sitemap et non indexé.

## Caractéristiques

- Caractéristique 1 : valeur à remplacer
- Caractéristique 2 : valeur à remplacer
- Caractéristique 3 : valeur à remplacer
