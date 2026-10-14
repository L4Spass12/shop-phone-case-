// Rendus réalistes du studio, sur fond TRANSPARENT, pour les visuels réseaux
// sociaux (carrousels TikTok / Instagram, voir carousel.mjs).
//
// Capture le vrai studio (aperçu réaliste) : coques du catalogue (?base=slug)
// et modèles Maillot (?tpl=maillot-id). Le studio doit tourner en local.
//
//   node scripts/social/capture.mjs [--model "iPhone 17 Pro"] [--out ~/Downloads/moroji-contenu/rendus]
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { JERSEYS } from '../../src/data/jerseys.mjs';
import { SAMPLES } from '../../src/data/foot-samples.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const BASE = opt('--base', 'http://localhost:4324');
const MODEL = opt('--model', 'iPhone 17 Pro');
const OUT = opt('--out', `${homedir()}/Downloads/moroji-contenu/rendus`);
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync(OUT, { recursive: true });

// Toutes les coques du catalogue qui ont un motif HD (comme le studio).
const slugs = readdirSync('public/images/designs')
  .filter((f) => f.endsWith('.webp') && !f.endsWith('-thumb.webp'))
  .map((f) => f.replace(/\.webp$/, ''));
const jobs = [
  ...slugs.map((s) => ({ id: s, q: `base=${s}` })),
  ...JERSEYS.map((j) => ({ id: `maillot-${j.id}`, q: `tpl=maillot-${j.id}`, sample: SAMPLES[j.id] })),
].filter((j) => !existsSync(`${OUT}/${j.id}.png`) || args.includes('--force'));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 3 })).newPage();
await page.goto(BASE + '/personnaliser/', { waitUntil: 'load' });

for (const j of jobs) {
  await page.evaluate((m) => { localStorage.removeItem('vareska:studio-design'); localStorage.setItem('vareska:phone-model', m); }, MODEL);
  await page.goto(`${BASE}/personnaliser/?${j.q}`, { waitUntil: 'load' });
  await page.waitForSelector('.case[data-real]', { timeout: 15000 });
  if (j.sample) {
    await page.evaluate(([n, k]) => {
      const t = [...document.querySelectorAll('.case .el[data-type="text"] .el-content')];
      if (t[0]) t[0].textContent = n;
      if (t[1]) t[1].textContent = k;
    }, j.sample);
  }
  // Tout est transparent sauf la coque : interface masquée.
  await page.addStyleTag({ content: `
    html, body, .studio, .canvas, [data-canvas], .canvas::before { background: transparent !important; background-image: none !important; }
    .gizmo, .toast, [data-toast] { display: none !important; }
    .case { box-shadow: none !important; filter: none !important; }
  ` });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const rect = await page.evaluate(() => {
    const els = [document.querySelector('.case'), ...document.querySelectorAll('[data-real-layers] img')].filter(Boolean);
    const r = els.map((e) => e.getBoundingClientRect());
    const x0 = Math.min(...r.map((q) => q.left)), y0 = Math.min(...r.map((q) => q.top));
    const x1 = Math.max(...r.map((q) => q.right)), y1 = Math.max(...r.map((q) => q.bottom));
    return { x: Math.floor(x0) - 2, y: Math.floor(y0) - 2, width: Math.ceil(x1 - x0) + 4, height: Math.ceil(y1 - y0) + 4 };
  });
  const png = await page.screenshot({ clip: rect, omitBackground: true });
  await sharp(png).trim({ threshold: 1 }).png().toFile(`${OUT}/${j.id}.png`);
  console.log('ok', j.id);
}
await browser.close();
