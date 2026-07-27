#!/usr/bin/env node
/**
 * Lance translate-content.mjs en boucle sur toutes les combinaisons :
 *   { blog, products, productCategories } × { en, de }
 *
 * Usage:
 *   node scripts/translate-all.mjs               # toutes les paires manquantes
 *   node scripts/translate-all.mjs --force       # regénère TOUT (attention coût Anthropic)
 *   node scripts/translate-all.mjs --langs en    # une seule langue
 *
 * Idempotent — ne retraduit que les fichiers absents (sauf --force).
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, 'translate-content.mjs');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { force: false, langs: ['en', 'de'], collections: ['blog', 'products', 'productCategories'] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--force') opts.force = true;
    else if (args[i] === '--langs') opts.langs = args[++i].split(',');
    else if (args[i] === '--collections') opts.collections = args[++i].split(',');
  }
  return opts;
}

function run(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('node', [SCRIPT, ...args], { stdio: 'inherit' });
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
  });
}

async function main() {
  const opts = parseArgs();
  for (const collection of opts.collections) {
    for (const lang of opts.langs) {
      const args = ['--collection', collection, '--lang', lang];
      if (opts.force) args.push('--force');
      console.log(`\n══ ${collection} → ${lang.toUpperCase()} ══`);
      await run(args);
    }
  }
  console.log('\n🎉 Batch complet.');
}

main().catch(e => { console.error(e); process.exit(1); });
