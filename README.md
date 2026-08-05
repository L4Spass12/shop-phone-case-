# 🛍️ Shop Starter — Astro e-commerce multilingue

Starter e-commerce complet basé sur **Astro** : multilingue (FR/EN/DE), responsive,
SEO-ready (JSON-LD, sitemap, RSS, hreflang), blog intégré, fiches produit avec
variantes, checkout léger via widget, et pipeline de déploiement FTP (Hostinger
ou tout hébergement statique).

> Ce repo est une base **neutre** : 1 produit exemple, 1 catégorie exemple,
> 1 article exemple (dans les 3 langues), style clair minimal. Tout se rebrande
> depuis **un seul fichier** : `site.config.mjs`.

---

## 🚀 Démarrage

```bash
npm install
npm run dev        # http://localhost:4321
```

## 🏷️ Rebrander en 4 étapes

1. **`site.config.mjs`** — renseigne tous les champs marqués `TODO`
   (nom, domaine, description, catégories blog & produits, email, etc.)
2. `node scripts/init.mjs` — synchronise le nom du package.
3. **`tailwind.config.mjs`** — la palette est 100 % tokenisée : change les
   valeurs (`terracotta` = couleur d'accent de marque) sans toucher aux
   composants. Pour un thème sombre, inverse `dark`/`cream` et remets
   `white: '#FFFFFF'` (voir commentaires dans le fichier).
4. **Pages légales** — remplace les placeholders `[NOM DE LA SOCIÉTÉ]`,
   `[SIRET]`, `[ADRESSE]`, etc. Elles existent dans les 3 langues :
   - FR : `src/pages/{mentions-legales,conditions-generales-de-vente-cgv,politique-de-confidentialite,livraisons-et-retours}.astro`
   - EN/DE : les mêmes noms sous `src/pages/[lang]/`
   - Gabarit commun : `src/components/LegalPage.astro`

   ⚠️ **Un texte juridique traduit n'est pas un texte juridique valide** dans une
   autre juridiction. Les versions EN/DE fournissent la *structure* attendue par
   chaque marché (la version DE est un squelette d'`Impressum` structuré selon
   le §5 DDG, les CGV reprennent les droits harmonisés UE), mais **pas** un
   contenu opposable. À faire valider par un juriste avant de vendre à
   l'étranger — et à réécrire complètement pour un marché hors UE (UK, US, CH).

### Couleur d'accent (une seule couleur à changer)

Tout ce qui est coloré sur le site dérive de **3 variables** définies dans
`:root` au début de `src/styles/global.css` :

```css
--accent-rgb:        166 44 226;   /* teinte principale  */
--accent-light-rgb:  192 69 252;   /* variante claire    */
--accent-dark-rgb:   129 34 176;   /* variante foncée    */
```

Les changer suffit à re-brander : le bouton « Ajouter au panier », les badges
Promo / Bestseller / remise, les anneaux de focus clavier et la sélection de
texte. Elles sont exposées à Tailwind via `colors.accent`
(`tailwind.config.mjs`), ce qui donne les utilitaires `bg-accent`,
`text-accent`, `bg-accent/10`, `ring-accent/40`…

> Valeurs en **canaux RVB sans `rgb()`** : c'est ce qui permet à Tailwind de
> gérer les opacités. Ne pas les remplacer par des `#hex`.

**Hiérarchie des boutons** — volontairement, tous les CTA ne partagent PAS le
même style : un bouton ne ressort que s'il est le seul à ressembler à ça.

| Niveau | Classe | Usage |
|---|---|---|
| Primaire commercial | `.btn-atc` | uniquement l'ajout au panier |
| Primaire | `.btn-primary` | actions importantes (Découvrir, Envoyer) |
| Secondaire | `.btn-outline` | actions optionnelles |

⚠️ Convention du thème : `white` est remappé sur l'encre foncée et `dark` sur le
blanc (voir `tailwind.config.mjs`). Sur un fond `bg-accent`, le texte blanc
s'écrit donc **`text-dark`**, pas `text-white`.

### Bouton « Ajouter au panier »

Le CTA d'achat (`.btn-atc` dans `src/styles/global.css`) est un bouton dégradé
avec liseré, icône panier, reflet au survol et léger soulèvement. Ses couleurs
dérivent automatiquement de l'accent ci-dessus — rien à changer dans la règle.

Détails d'implémentation (à connaître avant de le modifier) :
- Tout tient dans **un seul `<button>`** (technique `padding-box`/`border-box`)
  et l'**icône est injectée en CSS** (`mask-image`), car le JS du sélecteur de
  variantes réécrit l'`innerHTML` du bouton : un `<span>` interne ou une icône
  en HTML seraient effacés au changement de variante.
- Déclinaisons : `.btn-atc--sm` (barre sticky desktop), `.btn-atc--block`
  (pleine largeur), et pleine largeur automatique sous 640px pour le CTA principal.

## 📦 Ajouter du contenu

| Quoi | Où | Notes |
|------|-----|-------|
| Produit | `src/content/products/<slug>.md` | Voir `produit-exemple.md` (schéma variantes inclus) |
| Catégorie produit | 1) `site.config.mjs` → `productCategories` 2) (optionnel) `src/content/productCategories/<slug>.md` pour le contenu SEO | La page `/product-category/<slug>/` est générée automatiquement |
| Article blog | `src/content/blog/<slug>.md` | `category:` doit correspondre à une entrée de `siteConfig.categories` — à l'apostrophe, aux accents, aux espaces et à la casse près (voir ci-dessous) |
| Traductions | `src/content/<collection>/<en|de>/<slug>.md` | Même slug que le fichier FR |

**⚠️ Un frontmatter invalide casse le build → plus aucun déploiement ne passe**
(la branche `hostinger-deploy` n'est réécrite que si `npm run build` réussit).
Vérifie donc toujours avec `npm run build` avant de pousser.

Le cas le plus fréquent — le `category:` d'un article qui diffère de
`siteConfig.categories` par un caractère qu'on ne voit pas — est désormais
absorbé : `src/content/config.ts` compare sur une forme normalisée, donc
apostrophe typographique `’` au lieu de `'`, accent décomposé, espace
insécable, espaces en trop et différence de casse passent tous. La valeur est
réécrite avec le libellé exact de la config, ce qui garde l'article sur sa page
de catégorie. Une catégorie réellement inexistante échoue toujours, mais avec
un message qui nomme le fichier et liste les valeurs autorisées.

⚠️ Corollaire côté `site.config.mjs` : deux catégories qui ne diffèrent que par
ces caractères-là (`Guide d'achat` et `Guide d’achat`) sont ambiguës et
arrêtent le build avec un message explicite. Il faut en renommer une.

## 🌍 i18n

- Locale par défaut : FR sans préfixe (`/mon-article/`), autres locales
  préfixées (`/en/mon-article/`).
- UI : `src/i18n/{fr,en,de}.json`.
- Traduction automatique du contenu :
  `node scripts/translate-content.mjs --lang en --collection blog`
  (idempotent — ne traduit que les fichiers manquants). Nécessite
  `ANTHROPIC_API_KEY`. Personnalise `seoGuidance` dans `site.config.mjs`
  avec la terminologie de TA niche pour des traductions SEO de qualité.
- Prix localisés : `node scripts/i18n-update-prices.mjs` (taux BCE).

## ✍️ Génération d'articles IA (optionnel)

- Alimente `scripts/topics.json` : `[{"title": "Sujet de l'article"}, ...]`
- `node scripts/generate-article.mjs` (nécessite `ANTHROPIC_API_KEY`,
  `UNSPLASH_ACCESS_KEY` pour les images).
- Le workflow GitHub `Generate Article` peut tourner en cron (désactivé par
  défaut — voir `.github/workflows/generate-article.yml`).

## 🚢 Déploiement (GitHub → branche `hostinger-deploy` → Hostinger)

Le déploiement se fait via l'**intégration Git de Hostinger (hPanel)**, branchée
sur la branche **`hostinger-deploy`** qui contient le site **déjà compilé**.

En bref : un push sur `main` déclenche le workflow `hostinger-branch.yml`, qui
build le site et force-push le contenu de `dist/` sur `hostinger-deploy` ;
Hostinger récupère cette branche dans `public_html`.

👉 **Procédure complète, réglages hPanel et dépannage : voir [`DEPLOIEMENT.md`](./DEPLOIEMENT.md).**

Secrets à configurer dans le repo GitHub (`Settings → Secrets → Actions`) :

| Secret | Usage |
|--------|-------|
| `FTP_SERVER` / `FTP_USERNAME` / `FTP_PASSWORD` | Repli FTP manuel (`deploy.yml`) |
| `ANTHROPIC_API_KEY` | Génération d'articles + traductions (optionnel) |
| `UNSPLASH_ACCESS_KEY` | Images des articles générés (optionnel) |

## 🧰 Scripts utiles

| Script | Rôle |
|--------|------|
| `scripts/init.mjs` | Init après clonage (nom du package) |
| `scripts/translate-content.mjs` | Traduit une collection vers EN/DE |
| `scripts/translate-all.mjs` | Traduit tout ce qui manque |
| `scripts/generate-article.mjs` | Génère un article SEO depuis topics.json |
| `scripts/optimize-images.mjs` | PNG→WebP + compression |
| `scripts/generate-responsive.mjs` | Variantes -400w / -800w |
| `scripts/i18n-update-prices.mjs` | Prix localisés via taux BCE |

## 🛒 Checkout

Le starter est câblé pour le widget **Atelier** (paiement Stripe 1 étape,
`shop.provider` dans `site.config.mjs`). Remplaçable par tout autre widget
de checkout statique (Snipcart, etc.) — le wiring est dans
`src/pages/product/[slug].astro` et le header (icône panier).
