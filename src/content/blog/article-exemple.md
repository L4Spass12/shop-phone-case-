---
title: "Article exemple : découvrez le blog du starter"
description: "Un article de démonstration qui montre les conventions markdown, FAQ et i18n du starter. À remplacer par votre premier vrai contenu."
pubDate: 2026-01-01
author: "L'équipe MyShop"
category: "Guides"
tags:
  - "exemple"
  - "starter"
featured: false
faq:
  - q: "Comment créer un nouvel article ?"
    a: "Dupliquez ce fichier dans src/content/blog/, changez le nom du fichier (il devient le slug de l'URL), puis remplissez le frontmatter et le contenu."
---

Bienvenue sur le blog du starter MyShop. Cet article est un exemple : il montre comment un contenu est structuré, du frontmatter YAML jusqu'au corps en markdown. Remplacez-le par votre premier vrai article dès que votre boutique prend forme.

## Section exemple

Voici les conventions à connaître pour rédiger vos articles :

- Le champ category doit correspondre exactement à une des valeurs de site.config.mjs (Guides, Conseils, Actualités).
- La FAQ du frontmatter est optionnelle et s'affiche en fin d'article avec un balisage adapté au SEO.
- Pour traduire un article, créez le même fichier dans blog/en/ ou blog/de/ avec le même nom.

En résumé, ce fichier sert de modèle : gardez sa structure, remplacez son contenu. Un article bien structuré, avec des titres clairs et une FAQ utile, sera plus lisible pour vos visiteurs comme pour les moteurs de recherche.
