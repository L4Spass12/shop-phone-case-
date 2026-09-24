/**
 * Réduit la police du logotype aux SEULES lettres du nom de la boutique.
 *
 * Pinyon Script est une calligraphie : ses contours sont lourds et le jeu
 * complet « latin » pèse 38 Ko, téléchargés sur chacune des 56 pages… pour
 * afficher sept lettres dans l'en-tête et sept dans le pied de page. Réduit
 * au nom, le fichier tombe sous 4 Ko.
 *
 * À relancer APRÈS avoir changé `logoPrefix` ou `logoSuffix` dans
 * site.config.mjs :
 *
 *     node scripts/subset-logo-font.mjs
 *
 * L'oubli ne passe pas inaperçu : la construction du site s'arrête tant que
 * le fichier ne correspond pas au nom (voir src/layouts/BaseLayout.astro).
 *
 * Dépendance : fonttools (Python). `pip3 install fonttools brotli`.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import siteConfig from '../site.config.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'node_modules/@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff2');
const outMeta = path.join(root, 'src/lib/logo-font.json');

const texte = `${siteConfig.logoPrefix ?? ''}${siteConfig.logoSuffix ?? ''}`;
if (!texte) throw new Error('site.config.mjs : logoPrefix est vide.');

// Le nom du fichier change avec le texte. Les polices sont gardées 7 jours
// par les navigateurs : sous un nom fixe, un visiteur garderait l'ancien
// fichier, qui ne contient que les lettres de l'ancien nom, et le nouveau
// s'afficherait à moitié en police de secours (vécu au passage de Vareska
// à Moroji).
const empreinte = crypto.createHash('sha256').update(texte).digest('hex').slice(0, 8);
const fichier = `/fonts/pinyon-script-logo-${empreinte}.woff2`;
const outFont = path.join(root, 'public', fichier);
const dossier = path.dirname(outFont);
for (const f of fs.readdirSync(dossier)) {
  if (/^pinyon-script-logo(-[0-9a-f]+)?\.woff2$/.test(f)) fs.unlinkSync(path.join(dossier, f));
}

fs.mkdirSync(path.dirname(outFont), { recursive: true });
execFileSync('python3', [
  '-m', 'fontTools.subset', source,
  `--text=${texte}`,
  '--flavor=woff2',
  `--output-file=${outFont}`,
], { stdio: 'inherit' });

// Empreinte lue au build : elle dit pour quel nom ce fichier a été fabriqué.
fs.writeFileSync(outMeta, JSON.stringify({ texte, fichier }, null, 2) + '\n');

const ko = (fs.statSync(outFont).size / 1024).toFixed(1);
console.log(`✅ ${fichier} : « ${texte} », ${ko} Ko`);
