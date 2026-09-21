---
name: "Example product"
price: 19.90
image: "/images/products/coque-paysage.webp"
imageAlt: "Clear phone case with a painted landscape: blue mountains, pink clouds and blossoming cherry trees touched with gold"
gallery:
  # Trois visuels pour ÉPROUVER le carrousel : même cliché recadré, ça suffit
  # à distinguer les vignettes. À remplacer par de vraies vues du produit.
  - "/images/products/coque-paysage-angle.webp"
  - "/images/products/coque-paysage-troisquarts.webp"
categories: ["categorie-exemple"]
shortDescription: "A demo product to replace with your first real product."
featured: true
pubDate: 2026-01-01
attributes:
  - name: "Color"
    values:
      - label: "Black"
        slug: "noir"
      - label: "White"
        slug: "blanc"
variations:
  - id: 1
    price: 19.90
    inStock: true
    attributes:
      Color: "noir"
  - id: 2
    price: 19.90
    inStock: true
    attributes:
      Color: "blanc"
---

This is an example product shipped with the starter. Replace this text with the description of your own product: highlight its strengths, its use case and what makes it stand out.

This product also demonstrates the variants mechanism: a "Color" attribute with two values, each linked to a variation with its own price and stock. Duplicate this file to create your real products.

## Specifications

- Specification 1: value to replace
- Specification 2: value to replace
- Specification 3: value to replace
