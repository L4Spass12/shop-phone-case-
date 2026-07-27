#!/usr/bin/env node
/**
 * Met à jour les prix des produits localisés (EN, DE, …) en convertissant
 * depuis les prix FR via les taux BCE (Banque centrale européenne), puis en
 * appliquant un arrondi psychologique (.99 le plus proche).
 *
 * Source des taux : https://www.frankfurter.app — API gratuite, sans clé,
 * basée sur les taux de référence quotidiens de la BCE.
 *
 * Workflow :
 *   1. Pour chaque locale ≠ FR avec une devise ≠ EUR, on fetch le taux du jour.
 *   2. On met à jour `site.config.mjs` (i18n.fxRates) pour que ça soit traçable.
 *   3. On itère sur tous les produits FR de src/content/products/*.md
 *   4. Pour chaque correspondant <lang>/<slug>.md, on régénère :
 *      - price, compareAtPrice, priceRange.min/max
 *      - variations[].price / variations[].compareAtPrice
 *   5. Si le frontmatter contient `prices_manual: true` on saute (override).
 *
 * Idempotent et safe : si la conversion donne le même prix arrondi que
 * l'existant, on n'écrit pas le fichier.
 *
 * Usage :
 *   node scripts/i18n-update-prices.mjs              # tous les produits
 *   node scripts/i18n-update-prices.mjs --dry-run    # sans écrire
 *   node scripts/i18n-update-prices.mjs --no-fetch   # taux figés (offline)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import siteConfig from '../site.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/content/products');
const CONFIG_FILE = path.join(ROOT, 'site.config.mjs');

const argv = new Set(process.argv.slice(2));
const DRY_RUN = argv.has('--dry-run');
const NO_FETCH = argv.has('--no-fetch');

const DEFAULT_LOCALE = siteConfig.i18n?.defaultLocale ?? 'fr';
const PRIMARY_CURRENCY = (siteConfig.i18n?.locale?.[DEFAULT_LOCALE]?.currency ?? 'EUR').toUpperCase();
const FALLBACK_RATES = siteConfig.i18n?.fxRates ?? { EUR: 1.0, USD: 1.08 };

// ---------- Psychological rounding ----------

/**
 * Snap à .99 le plus proche (convention universelle e-com).
 * Exemples :
 *   53.89 → 53.99  (snap up 0.10)
 *   53.20 → 52.99  (snap down 0.21 — paraît moins cher, < 0.40 décimale)
 *   100.50 → 99.99 (snap down 0.51)
 *   19.05 → 18.99
 *
 * Si la valeur est < 1 (très petite), on garde le centime près.
 */
function psychoRound(amount) {
  if (amount < 1) return Math.round(amount * 100) / 100;
  const intPart = Math.floor(amount);
  const decPart = amount - intPart;
  // Si la décimale est élevée (≥ .40), on snap au .99 de l'entier courant.
  // Sinon on snap à (intPart - 1).99 — paraît plus accessible.
  if (decPart >= 0.4) {
    return intPart + 0.99;
  }
  return Math.max(0, intPart - 1) + 0.99;
}

/** Convertit un montant FR (en `PRIMARY_CURRENCY`) vers la devise cible. */
function convert(amountFr, rate) {
  return psychoRound(amountFr * rate);
}

// ---------- FX fetch ----------

async function fetchFxRate(targetCurrency) {
  if (targetCurrency === PRIMARY_CURRENCY) return 1.0;
  const url = `https://api.frankfurter.app/latest?from=${PRIMARY_CURRENCY}&to=${targetCurrency}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const data = await res.json();
  const rate = data?.rates?.[targetCurrency];
  if (!rate) throw new Error(`No rate for ${targetCurrency}`);
  return rate;
}

async function resolveRates(localeMap) {
  const rates = { [PRIMARY_CURRENCY]: 1.0 };
  for (const [lang, meta] of Object.entries(localeMap)) {
    const cur = (meta.currency || 'EUR').toUpperCase();
    if (rates[cur] != null) continue;
    if (NO_FETCH) {
      rates[cur] = FALLBACK_RATES[cur] ?? 1.0;
      continue;
    }
    try {
      const r = await fetchFxRate(cur);
      rates[cur] = r;
      console.log(`[fx] ${PRIMARY_CURRENCY} → ${cur} = ${r}`);
    } catch (e) {
      const fb = FALLBACK_RATES[cur] ?? 1.0;
      console.warn(`[fx] failed for ${cur} (${e.message}), fallback ${fb}`);
      rates[cur] = fb;
    }
  }
  return rates;
}

// ---------- Update site.config.mjs ----------

function persistRates(rates) {
  if (DRY_RUN) return;
  let src = fs.readFileSync(CONFIG_FILE, 'utf8');
  // Rebuild the fxRates block. Conservative regex: matches `fxRates: { ... },`
  // (single-level JSON-ish). Preserves indentation.
  const ratesJs = Object.entries(rates)
    .map(([k, v]) => `      ${k}: ${v},`)
    .join('\n');
  const block = `fxRates: {\n${ratesJs}\n    }`;
  const fxNow = new Date().toISOString();
  src = src.replace(/fxRates:\s*\{[^}]*\}/m, block);
  src = src.replace(/fxUpdatedAt:\s*[^,]+,/m, `fxUpdatedAt: '${fxNow}',`);
  fs.writeFileSync(CONFIG_FILE, src);
  console.log(`[config] updated site.config.mjs (fxRates + fxUpdatedAt)`);
}

// ---------- Products walk ----------

function readProductsByLocale() {
  const all = {}; // { 'fr': { slug: filepath, ... }, 'en': {...}, ... }
  function walk(dir, locale) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Sub-locale directory (en/, de/, etc.)
        walk(full, entry.name);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = entry.name.replace(/\.md$/, '');
        (all[locale] ??= {})[slug] = full;
      }
    }
  }
  walk(SRC, DEFAULT_LOCALE);
  return all;
}

function updateProductPrices(filepath, rate, currency) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data;

  if (data.prices_manual === true) {
    return { skipped: 'manual_override' };
  }

  let dirty = false;
  function setIfChanged(obj, key, newVal) {
    if (obj[key] == null) return;
    const rounded = Math.round(newVal * 100) / 100;
    if (Math.abs((obj[key] || 0) - rounded) > 0.001) {
      obj[key] = rounded;
      dirty = true;
    }
  }

  // We need the SOURCE (FR) prices to convert from. The current file's prices
  // are already in the target currency — we can't reconvert from them. So
  // the caller passes us the source data.
  return { dirty, data };
}

function applyConversion(srcData, dstData, rate) {
  let dirty = false;
  function copy(srcKey, dstKey = srcKey) {
    if (srcData[srcKey] == null) return;
    const rounded = convert(Number(srcData[srcKey]), rate);
    if (Math.abs((dstData[dstKey] ?? -1) - rounded) > 0.001) {
      dstData[dstKey] = rounded;
      dirty = true;
    }
  }
  copy('price');
  copy('compareAtPrice');
  if (srcData.priceRange && typeof srcData.priceRange === 'object') {
    dstData.priceRange ??= {};
    if (srcData.priceRange.min != null) {
      const r = convert(Number(srcData.priceRange.min), rate);
      if (Math.abs((dstData.priceRange.min ?? -1) - r) > 0.001) { dstData.priceRange.min = r; dirty = true; }
    }
    if (srcData.priceRange.max != null) {
      const r = convert(Number(srcData.priceRange.max), rate);
      if (Math.abs((dstData.priceRange.max ?? -1) - r) > 0.001) { dstData.priceRange.max = r; dirty = true; }
    }
  }
  if (Array.isArray(srcData.variations)) {
    dstData.variations ??= [];
    srcData.variations.forEach((srcVar, i) => {
      const dstVar = dstData.variations[i] ??= {};
      // Preserve id/attribute identity from src (they're language-agnostic).
      if (srcVar.id != null && dstVar.id !== srcVar.id) { dstVar.id = srcVar.id; dirty = true; }
      if (srcVar.price != null) {
        const r = convert(Number(srcVar.price), rate);
        if (Math.abs((dstVar.price ?? -1) - r) > 0.001) { dstVar.price = r; dirty = true; }
      }
      if (srcVar.compareAtPrice != null) {
        const r = convert(Number(srcVar.compareAtPrice), rate);
        if (Math.abs((dstVar.compareAtPrice ?? -1) - r) > 0.001) { dstVar.compareAtPrice = r; dirty = true; }
      }
    });
  }
  return dirty;
}

// ---------- Main ----------

async function main() {
  const localeMap = siteConfig.i18n?.locale ?? {};
  const rates = await resolveRates(localeMap);
  persistRates(rates);

  const byLocale = readProductsByLocale();
  const frProducts = byLocale[DEFAULT_LOCALE] || {};
  console.log(`[products] ${Object.keys(frProducts).length} FR products`);

  let touched = 0, skipped = 0, missing = 0;
  for (const [lang, meta] of Object.entries(localeMap)) {
    if (lang === DEFAULT_LOCALE) continue;
    const currency = (meta.currency || 'EUR').toUpperCase();
    const rate = rates[currency] ?? 1.0;
    if (currency === PRIMARY_CURRENCY) {
      // Same currency, no conversion. Skip entirely — text translation is
      // handled by other scripts.
      console.log(`[${lang}] same currency (${currency}) — skipping price update`);
      continue;
    }
    const dstProducts = byLocale[lang] || {};
    for (const [slug, frPath] of Object.entries(frProducts)) {
      const dstPath = dstProducts[slug];
      if (!dstPath) { missing++; continue; }
      const srcRaw = fs.readFileSync(frPath, 'utf8');
      const dstRaw = fs.readFileSync(dstPath, 'utf8');
      const srcParsed = matter(srcRaw);
      const dstParsed = matter(dstRaw);
      if (dstParsed.data.prices_manual === true) {
        skipped++; continue;
      }
      const changed = applyConversion(srcParsed.data, dstParsed.data, rate);
      if (changed) {
        if (!DRY_RUN) {
          const newRaw = matter.stringify(dstParsed.content, dstParsed.data, { lineWidth: -1 });
          fs.writeFileSync(dstPath, newRaw);
        }
        touched++;
        console.log(`[${lang}] ${DRY_RUN ? '[dry] ' : ''}updated ${slug}`);
      }
    }
  }
  console.log(`\nDone — touched: ${touched}, skipped (manual): ${skipped}, missing dst: ${missing}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
