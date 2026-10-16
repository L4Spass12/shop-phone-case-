// Modèles « alias » : un téléphone au même gabarit qu'un modèle existant
// (iPhone 18 Pro = 17 Pro, mêmes cotes et même plateau caméra). Il reprend
// les photos, le calque réaliste du studio et le fichier d'impression du
// modèle d'origine : pas de nouvelle génération.
//
// Liste : src/data/model-aliases.json. applyAliases() les (ré)inscrit dans
// src/data/variants.json, en tête de _models (les plus récents d'abord) ;
// generate.mjs l'appelle après chaque génération pour ne pas les perdre.
//
//   node scripts/mockups/model-aliases.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ALIASES = JSON.parse(readFileSync(new URL('../../src/data/model-aliases.json', import.meta.url), 'utf8'));

export function applyAliases(manifest) {
  const models = Object.fromEntries(Object.entries(manifest._models ?? {}).filter(([id]) => !ALIASES.some((a) => a.id === id)));
  manifest._models = { ...Object.fromEntries(ALIASES.filter((a) => models[a.from]).map((a) => [a.id, a.label])), ...models };
  for (const [slug, byModel] of Object.entries(manifest)) {
    if (slug === '_models') continue;
    for (const a of ALIASES) {
      if (byModel[a.from]) byModel[a.id] = { ...byModel[a.from] };
      else delete byModel[a.id];
    }
  }
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = 'src/data/variants.json';
  const manifest = applyAliases(JSON.parse(readFileSync(path, 'utf8')));
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
  console.log('alias appliqués :', ALIASES.map((a) => a.id).join(', '));
}
