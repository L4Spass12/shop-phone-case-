#!/usr/bin/env node
/**
 * Traduit un fichier de content collection (FR → EN ou DE) avec Claude
 * en respectant le SEO du marché cible.
 *
 * Usage:
 *   node scripts/translate-content.mjs --lang en --collection blog
 *   node scripts/translate-content.mjs --lang de --collection products --slug boutique-blanc
 *   node scripts/translate-content.mjs --lang en --collection productCategories --force
 *
 * Sortie : src/content/<collection>/<lang>/<slug>.md
 *
 * Idempotent : skip si la cible existe déjà (--force pour regénérer).
 *
 * Optimisation : prompt caching d'Anthropic — les règles SEO et le contexte
 * site sont marqués cache_control:ephemeral, donc la 2e requête réutilise
 * jusqu'à ~85 % du prompt sans le re-tokeniser (gain ~5x sur la latence et
 * le coût pour les batchs de 30+ articles).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import Anthropic from '@anthropic-ai/sdk';
import siteConfig from '../site.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── Configuration : champs à traduire par collection ────────────────────
const TRANSLATABLE_FIELDS = {
  blog: {
    strings: ['title', 'description', 'imageAlt', 'imageTitle'],
    arrays: ['tags'],
    faq: true,
  },
  products: {
    strings: ['name', 'imageAlt', 'shortDescription'],
    arrays: [],
    faq: false,
    // Champs nested spécifiques aux produits : attribute names + value labels
    productAttributes: true,
  },
  productCategories: {
    strings: ['title', 'metaDescription', 'intro', 'guideHeading'],
    arrays: ['keywords'],
    faq: true,
  },
};

const LANG_NAMES = { fr: 'French', en: 'English', de: 'German' };

/**
 * Consignes SEO par langue cible.
 * Surchargeables par shop via `seoGuidance: { en: '...', de: '...' }` dans
 * site.config.mjs — mets-y la terminologie métier de TES produits (le
 * vocabulaire que tes clients tapent réellement dans Google), c'est ce qui
 * fait la qualité des traductions. Les valeurs ci-dessous sont un fallback
 * générique.
 */
const SEO_GUIDANCE = {
  en: siteConfig.seoGuidance?.en ?? `Use the natural English search terms that
shoppers of this product type actually type into Google (US/UK). Prefer the
dominant spelling/phrasing of the niche over literal translations from French.
Adapt cultural references: Amazon.fr -> Amazon, TVA -> tax/VAT, currency stays €.
Default to US English (color, customize, behavior).`,

  de: siteConfig.seoGuidance?.de ?? `Use the natural German search terms that
shoppers of this product type actually type into Google.de. Prefer the dominant
German phrasing of the niche over literal translations from French.
Use the informal "du"-form - never "Sie". Adapt cultural references:
Amazon.fr -> Amazon, TVA -> MwSt., currency stays €.`,
};

// Le system prompt : volumineux et identique pour TOUTES les requêtes →
// parfait candidat pour le prompt caching d'Anthropic.
function buildSystemPrompt(targetLang) {
  return `You are an expert SEO translator for ${siteConfig.name},
${siteConfig.article.context}.

Your task is to translate French marketing/editorial content to ${LANG_NAMES[targetLang]}
for the ${siteConfig.name} e-commerce store. The translations must read as
if originally written in ${LANG_NAMES[targetLang]} for the local market — never
as a literal word-for-word translation from French.

## CRITICAL RULES (apply to every translation)

1. Output ONLY the translated text. No preamble. No quotes. No explanations.
   No "Here is the translation:". Pure translated content.

2. Preserve markdown formatting EXACTLY:
   - **bold**, *italic*, \`code\`, [link text](url)
   - Headings (##, ###, ####)
   - Lists (-, *, 1.), tables (| ... |)
   - HTML blocks: <details>, <summary>, <p>, <strong>, <em>, <br>
   - Image markdown: ![alt](src) — translate alt only
   - Blockquotes (>)

3. Preserve proper nouns AS-IS:
   - Brand names: ${siteConfig.name}, Razer, Logitech, Corsair, SteelSeries,
     HyperX, Stripe, Amazon, Atelier, Web3Forms
   - Product model names (Goliathus, QcK, Gigantus, MM700, etc.)
   - Place names that aren't being adapted
   - The site name "${siteConfig.name}" is invariable

4. Preserve technical units verbatim: DPI, mm, cm, €, %, kg

5. Convert INTERNAL markdown links by adding the locale prefix:
   - /blog/ → /${targetLang}/blog/
   - /product/<slug>/ → /${targetLang}/product/<slug>/
   - /product-category/<slug>/ → /${targetLang}/product-category/<slug>/
   - /<slug>/ → /${targetLang}/<slug>/
   - /category/<slug>/ → /${targetLang}/category/<slug>/
   Do NOT prefix external links (anything starting with http:// or https://).
   The slug AFTER the prefix stays unchanged (we use shared slugs across locales).

6. Adapt SEO keywords to the target market. This is the CORE of your job —
   do not translate keywords literally. Find the natural search terms.
${SEO_GUIDANCE[targetLang]}

7. Adapt cultural references when relevant:
   - Amazon France → Amazon
   - TVA → tax (EN) / MwSt. (DE)
   - "France métropolitaine" → omit or adapt to "domestic"
   - Currency stays € (the store charges EUR)

8. Keep tone, length and structure close to the original. Don't pad.
   Don't summarize. Match paragraph counts.

9. Never use the em-dash "—" or en-dash "–". Always use a regular hyphen "-".

10. If you encounter the sentinel "{{NO_TRANSLATE}}", return the input unchanged.`;
}

const MODEL_BODY   = 'claude-sonnet-4-5';   // body article — qualité maximale
const MODEL_FIELDS = 'claude-haiku-4-5-20251001'; // petits champs (titre, tags, FAQ…)

// Traduit le body de l'article (Sonnet — qualité maximale).
async function translate(client, text, kind, targetLang, systemPrompt) {
  const trimmed = (text ?? '').toString().trim();
  if (!trimmed) return text;

  const userPrompt = `## CONTENT TYPE
${kind}

## TARGET LANGUAGE
${LANG_NAMES[targetLang]}

## SOURCE (French)

${trimmed}

## OUTPUT (translated ${kind} only)`;

  const msg = await client.messages.create({
    model: MODEL_BODY,
    max_tokens: 8192,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  });
  return msg.content[0].text.trim().replace(/[—–]/g, '-');
}

// Traduit tous les petits champs (titre, tags, FAQ…) en un seul appel Haiku.
// fieldsMap : { "clé": "texte FR" }  →  retourne { "clé": "texte traduit" }
// Fallback : null si le JSON retourné est invalide (l'appelant revient aux appels individuels).
async function translateBatch(client, fieldsMap, targetLang, systemPrompt) {
  const entries = Object.entries(fieldsMap).filter(([, v]) => v && String(v).trim());
  if (entries.length === 0) return {};

  const userPrompt = `Translate every value in the JSON below from French to ${LANG_NAMES[targetLang]}.
Return ONLY a valid JSON object with identical keys and translated values.
Apply all system rules (brand names, markdown, units, links, no em-dash).

${JSON.stringify(Object.fromEntries(entries), null, 2)}`;

  const msg = await client.messages.create({
    model: MODEL_FIELDS,
    max_tokens: 2048,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = msg.content[0].text.trim().replace(/^```json\n?|\n?```$/g, '');
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('translateBatch: JSON invalide, fallback appels individuels.');
    return null;
  }
}

/** Préfixe `/<lang>` aux liens markdown internes du body qui n'en ont pas. */
function localizeInternalLinks(text, targetLang) {
  return text.replace(/\]\((\/[^\s)]*)\)/g, (m, p) => {
    // Déjà préfixé locale ?
    if (/^\/(en|de|fr)(\/|$)/.test(p)) return m;
    // Path absolu sans locale → préfixe.
    if (p === '/') return `](/${targetLang}/)`;
    return `](/${targetLang}${p})`;
  });
}

// ─── Args CLI ────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { lang: null, collection: null, slug: null, force: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--lang') opts.lang = args[++i];
    else if (a === '--collection') opts.collection = args[++i];
    else if (a === '--slug') opts.slug = args[++i];
    else if (a === '--force') opts.force = true;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/translate-content.mjs --lang <en|de> --collection <blog|products|productCategories> [--slug <slug>] [--force]');
      process.exit(0);
    }
  }
  if (!opts.lang || !TRANSLATABLE_FIELDS[opts.collection]) {
    console.error('Args invalides. --help pour l\'usage.');
    process.exit(1);
  }
  if (!['en', 'de'].includes(opts.lang)) {
    console.error(`Langue non supportée : ${opts.lang}`);
    process.exit(1);
  }
  return opts;
}

async function translateOneEntry(client, srcPath, opts, systemPrompt) {
  const { lang, collection } = opts;
  const targetDir = path.join(path.dirname(srcPath), lang);
  const targetPath = path.join(targetDir, path.basename(srcPath));

  if (fs.existsSync(targetPath) && !opts.force) {
    console.log(`  ⊙ skip (existe) ${path.relative(ROOT, targetPath)}`);
    return;
  }

  const raw = fs.readFileSync(srcPath, 'utf8');
  const { data, content } = matter(raw);

  const fields = TRANSLATABLE_FIELDS[collection];
  const newData = JSON.parse(JSON.stringify(data));

  // ── Étape 1 : batch Haiku pour tous les petits champs ─────────────────
  // On construit un objet plat { clé: texte } pour l'envoi en une seule requête.
  const batchMap = {};

  for (const f of fields.strings) {
    if (newData[f]) batchMap[`s:${f}`] = newData[f];
  }
  for (const f of fields.arrays) {
    if (Array.isArray(newData[f])) {
      newData[f].forEach((item, i) => { if (item) batchMap[`a:${f}[${i}]`] = item; });
    }
  }
  if (fields.faq && Array.isArray(newData.faq)) {
    newData.faq.forEach((item, i) => {
      if (item.q) batchMap[`faq[${i}].q`] = item.q;
      if (item.a) batchMap[`faq[${i}].a`] = item.a;
    });
  }
  if (fields.productAttributes && Array.isArray(newData.attributes)) {
    newData.attributes.forEach((attr, ai) => {
      if (attr.name) batchMap[`attr[${ai}].name`] = attr.name;
      if (Array.isArray(attr.values)) {
        attr.values.forEach((v, vi) => {
          if (v.label) batchMap[`attr[${ai}].v[${vi}]`] = v.label;
        });
      }
    });
  }

  const batchResult = await translateBatch(client, batchMap, lang, systemPrompt);

  if (batchResult) {
    // Applique les résultats du batch
    for (const f of fields.strings) {
      if (batchResult[`s:${f}`]) newData[f] = batchResult[`s:${f}`];
    }
    for (const f of fields.arrays) {
      if (Array.isArray(newData[f])) {
        newData[f] = newData[f].map((item, i) => batchResult[`a:${f}[${i}]`] ?? item);
      }
    }
    if (fields.faq && Array.isArray(newData.faq)) {
      newData.faq.forEach((item, i) => {
        if (batchResult[`faq[${i}].q`]) item.q = batchResult[`faq[${i}].q`];
        if (batchResult[`faq[${i}].a`]) item.a = batchResult[`faq[${i}].a`];
      });
    }
    if (fields.productAttributes && Array.isArray(newData.attributes)) {
      newData.attributes.forEach((attr, ai) => {
        if (batchResult[`attr[${ai}].name`]) attr.name = batchResult[`attr[${ai}].name`];
        if (Array.isArray(attr.values)) {
          attr.values.forEach((v, vi) => {
            if (batchResult[`attr[${ai}].v[${vi}]`]) v.label = batchResult[`attr[${ai}].v[${vi}]`];
          });
        }
      });
    }
    console.log(`  ✓ batch Haiku (${Object.keys(batchMap).length} champs)`);
  } else {
    // Fallback : appels individuels Sonnet si le batch échoue
    for (const f of fields.strings) {
      if (newData[f]) newData[f] = await translate(client, newData[f], f, lang, systemPrompt);
    }
    for (const f of fields.arrays) {
      if (Array.isArray(newData[f])) {
        const out = [];
        for (const item of newData[f]) out.push(await translate(client, item, `${f} item`, lang, systemPrompt));
        newData[f] = out;
      }
    }
    if (fields.faq && Array.isArray(newData.faq)) {
      for (const item of newData.faq) {
        if (item.q) item.q = await translate(client, item.q, 'FAQ question', lang, systemPrompt);
        if (item.a) item.a = await translate(client, item.a, 'FAQ answer', lang, systemPrompt);
      }
    }
    if (fields.productAttributes && Array.isArray(newData.attributes)) {
      for (const attr of newData.attributes) {
        if (attr.name) attr.name = await translate(client, attr.name, 'product attribute name', lang, systemPrompt);
        if (Array.isArray(attr.values)) {
          for (const v of attr.values) {
            if (v.label) v.label = await translate(client, v.label, 'product attribute value', lang, systemPrompt);
          }
        }
      }
    }
  }

  // ── Normalisation des champs traduits ─────────────────────────────────
  // translateBatch (Haiku) renvoie du JSON brut qui ne passe PAS par le strip
  // d'em-dash de translate() : on le force ici. On borne aussi la longueur des
  // meta descriptions (l'allemand notamment dépasse souvent 160 chars).
  const stripDash = s => (typeof s === 'string' ? s.replace(/[—–]/g, '-') : s);
  for (const f of fields.strings) newData[f] = stripDash(newData[f]);
  for (const f of fields.arrays) {
    if (Array.isArray(newData[f])) newData[f] = newData[f].map(stripDash);
  }
  if (Array.isArray(newData.faq)) {
    newData.faq.forEach(it => { it.q = stripDash(it.q); it.a = stripDash(it.a); });
  }
  for (const descField of ['description', 'metaDescription']) {
    const d = newData[descField];
    if (typeof d === 'string' && d.length > 160) {
      let cut = d.slice(0, 160).replace(/\s+\S*$/, '').trim();
      if (!/[.!?]$/.test(cut)) cut += '.';
      newData[descField] = cut;
      console.warn(`  ⚠ ${descField} ${lang} tronquée (${d.length}→${cut.length} chars)`);
    }
  }

  // ── Étape 2 : body avec Sonnet (qualité préservée) ─────────────────────
  let translatedBody = content;
  if (content && content.trim()) {
    translatedBody = await translate(client, content, 'article body', lang, systemPrompt);
    translatedBody = localizeInternalLinks(translatedBody, lang);
  }

  // Écriture
  fs.mkdirSync(targetDir, { recursive: true });
  const out = matter.stringify(translatedBody, newData);
  fs.writeFileSync(targetPath, out, 'utf8');
  console.log(`  ✓ ${path.relative(ROOT, targetPath)}`);
}

async function main() {
  const opts = parseArgs();
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY manquant.');
    process.exit(1);
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const collDir = path.join(ROOT, 'src', 'content', opts.collection);
  if (!fs.existsSync(collDir)) {
    console.error(`Collection introuvable : ${collDir}`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(collDir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => path.join(collDir, e.name));

  const targets = opts.slug
    ? allFiles.filter(f => path.basename(f, '.md') === opts.slug)
    : allFiles;

  if (targets.length === 0) {
    console.error('Aucun fichier source à traduire.');
    process.exit(1);
  }

  const systemPrompt = buildSystemPrompt(opts.lang);

  console.log(`📚 ${opts.collection} → ${opts.lang.toUpperCase()} (${targets.length} fichier(s))\n`);

  let ok = 0, skipped = 0, failed = 0;
  for (const f of targets) {
    if (path.basename(f).startsWith('produit-test-')) {
      console.log(`  ⊙ skip (interne) ${path.basename(f)}`);
      skipped++;
      continue;
    }
    process.stdout.write(`▶ ${path.basename(f)}\n`);
    try {
      const before = fs.existsSync(path.join(path.dirname(f), opts.lang, path.basename(f)));
      await translateOneEntry(client, f, opts, systemPrompt);
      const after = fs.existsSync(path.join(path.dirname(f), opts.lang, path.basename(f)));
      if (before && !opts.force) skipped++;
      else if (after) ok++;
    } catch (e) {
      console.error(`  ✗ ÉCHEC : ${e.message}`);
      failed++;
    }
  }

  console.log(`\n✅ ${ok} traduit(s), ⊙ ${skipped} skippé(s), ✗ ${failed} échec(s)`);
}

main().catch(e => { console.error(e); process.exit(1); });
