---
# ─── PRODUIT DE TEST — bouton noir à cadre ────────────────────────────────
# Page de comparaison A/B : biseau en relief + cadre qui se dessine au survol
# (atcVariant: ink-frame). Adapté d'un bouton Uiverse (AqFox) — cf. les notes
# détaillées dans src/styles/global.css, section --ink-frame.
# Conventions du starter exploitées :
#   - `categories: []`      → masqué de la boutique + noindex + pas de hreflang
#   - slug `produit-test-*` → exclu du sitemap et de la traduction auto
# Variations CONSERVÉES : les quatre filets du cadre sont dessinés sur le seul
# ::after, sans élément enfant — la réécriture de l'innerHTML par le sélecteur
# de variantes ne peut donc rien casser.
# URL directe : /product/produit-test-noir-cadre/
# À SUPPRIMER une fois le style choisi (ou promouvoir via atcVariant).
name: "Produit test - bouton noir a cadre"
price: 19.90
image: "/images/products/produit-exemple.webp"
gallery:
  - "/images/products/produit-exemple-b.webp"
  - "/images/products/produit-exemple-c.webp"
imageAlt: "Produit de démonstration du bouton noir à cadre"
categories: []
shortDescription: "Page de test A/B : bouton noir en relief dont un cadre fin se dessine depuis les coins au survol."
featured: false
pubDate: 2026-07-30
atcVariant: ink-frame
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

Page de test interne. Deux choses se passent au survol : une bande claire
traverse le bouton en diagonale, et **quatre filets poussent depuis les coins**
jusqu'à former un cadre complet.

Le relief vient d'un biseau — arête haut-gauche éclairée, arête bas-droite dans
l'ombre — plutôt que d'un dégradé. Les coins sont volontairement peu arrondis
(6px) : des filets droits sur un coin très arrondi seraient rognés et
laisseraient des trous aux angles.

À comparer avec la [version plate](/product/produit-test-noir-plat/), la
[version dégradée](/product/produit-test-noir/), la
[version lueur](/product/produit-test-noir-lueur/) et la
[version violette](/product/produit-exemple/).

## Caractéristiques

- Caractéristique 1 : valeur à remplacer
- Caractéristique 2 : valeur à remplacer
- Caractéristique 3 : valeur à remplacer
