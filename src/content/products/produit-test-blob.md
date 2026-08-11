---
# ─── PRODUIT DE TEST — bouton ATC « blob » ────────────────────────────────
# Page de comparaison A/B des styles de bouton (atcVariant: blob vs gradient).
# Conventions du starter exploitées :
#   - `categories: []`      → masqué de la boutique + noindex + pas de hreflang
#   - slug `produit-test-*` → exclu du sitemap et de la traduction auto
#   - PAS de `variations`   → le JS des variantes ne réécrit pas le bouton,
#                             condition nécessaire au style blob (enfants DOM).
# URL directe : /product/produit-test-blob/
# À SUPPRIMER une fois le style choisi (ou promouvoir via atcVariant).
name: "Produit test - bouton blob"
price: 19.90
image: "/images/products/produit-exemple.webp"
gallery:
  - "/images/products/produit-exemple-b.webp"
  - "/images/products/produit-exemple-c.webp"
imageAlt: "Produit de démonstration du bouton blob"
categories: []
shortDescription: "Page de test A/B : bouton « blob glassmorphism » à comparer au bouton dégradé standard."
featured: false
pubDate: 2026-07-28
stock: 10
atcVariant: blob
---

Page de test interne : ce produit sert uniquement à comparer le bouton
« Ajouter au panier » en version **blob glassmorphism** avec la version
dégradée standard visible sur [le produit exemple](/product/produit-exemple/).

Il est masqué de la boutique, exclu du sitemap et non indexé.
