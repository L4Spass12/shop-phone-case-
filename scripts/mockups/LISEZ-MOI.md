# Mockups par modèle de téléphone

Génère, pour un design de la boutique, l'image de la coque sur chacun des
19 modèles, avec le moteur de rendu de l'application « atelier coques »
(index.html autonome). Les images sont identiques au pixel près à celles que
l'application exporte (vérifié sur coque-vache : 19/19 identiques).

## Prérequis
- Google Chrome installé (`/Applications/Google Chrome.app`), ou `CHROME_PATH`.
- L'application atelier : chemin par défaut dans `generate.mjs`, ou `ATELIER_HTML`.
- Le design vertical sans trou : `public/images/designs/<slug>.webp` (ou `--design`).

## Utilisation
    npm run mockups -- coque-vache
    npm run mockups -- coque-vache --models iphone-15,galaxy-s25
    npm run mockups -- coque-vache --crop scripts/mockups/crops/coque-vache.json
    npm run mockups -- coque-vache --mode relief --design chemin/vers/design-relief.png

Toute la collection :
    for f in public/images/designs/*-thumb.webp; do s=$(basename "$f" -thumb.webp); npm run mockups -- "$s"; done

## Cadrage
Par défaut, cadrage centré (comme à l'ouverture de l'application). Pour un
réglage par modèle, un JSON avec les valeurs des curseurs de l'application :
`{ "*": { "zoom": 1.1 }, "iphone-17-pro-max": { "zoom": 1.2, "y": -0.3 } }`
(zoom de 1 à 2,5 ; x et y de -1 à 1).

## Sortie
- `public/images/products/variants/<slug>/<modele>-<mode>.webp` (1200 px) + `-800w`, `-400w`
- `src/data/variants.json` : `<slug> → <modele> → <mode> → image`, et `_models`
  qui associe chaque identifiant au libellé EXACT de `site.config.mjs`
  (le script refuse un modèle absent du site).
