// Rendus des coques « maillot » pour la page /coque-foot-personnalisee/.
//
// Capture d'écran du VRAI studio (aperçu réaliste) : le rendu est exactement
// celui que voit le client, coque, reflets et contour compris. Le studio doit
// tourner en local (npm run dev).
//
//   node scripts/foot-mockups.mjs [--base http://localhost:4324] [--model "iPhone 17 Pro Max"]
// Sortie : public/images/foot-studio-v2/<maillot>.webp (+ -400w), fond blanc.
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { JERSEYS } from '../src/data/jerseys.mjs';
import { SAMPLES } from '../src/data/foot-samples.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const BASE = opt('--base', 'http://localhost:4324');
const MODEL = opt('--model', 'iPhone 17 Pro Max');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = 'public/images/foot-studio-v2';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto(BASE + '/personnaliser/', { waitUntil: 'load' });

for (const j of JERSEYS) {
  const [name, num] = SAMPLES[j.id] ?? ['TON NOM', '10'];
  await page.evaluate((m) => {
    localStorage.removeItem('vareska:studio-design');
    localStorage.setItem('vareska:phone-model', m);
  }, MODEL);
  await page.goto(`${BASE}/personnaliser/?tpl=maillot-${j.id}`, { waitUntil: 'load' });
  await page.waitForSelector('.case[data-real]', { timeout: 15000 });
  // Exemple de nom et de numéro (affichage seulement) sur les deux textes.
  await page.evaluate(([n, k]) => {
    const t = [...document.querySelectorAll('.case .el[data-type="text"] .el-content')];
    if (t[0]) t[0].textContent = n;
    if (t[1]) t[1].textContent = k;
  }, [name, num]);
  // Plan de travail blanc, interface masquée : seule la coque reste.
  await page.addStyleTag({ content: `
    body, .studio, .canvas, [data-canvas], .canvas::before { background: #fff !important; background-image: none !important; }
    .gizmo, .toast, [data-toast] { display: none !important; }
    .case { box-shadow: none !important; filter: none !important; }
  ` });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const rect = await page.evaluate(() => {
    const els = [document.querySelector('.case'), ...document.querySelectorAll('[data-real-layers] img')].filter(Boolean);
    const r = els.map((e) => e.getBoundingClientRect());
    const x0 = Math.min(...r.map((q) => q.left)), y0 = Math.min(...r.map((q) => q.top));
    const x1 = Math.max(...r.map((q) => q.right)), y1 = Math.max(...r.map((q) => q.bottom));
    return { x: Math.floor(x0) - 2, y: Math.floor(y0) - 2, width: Math.ceil(x1 - x0) + 4, height: Math.ceil(y1 - y0) + 4 };
  });
  const png = await page.screenshot({ clip: rect });
  const img = sharp(png).flatten({ background: '#ffffff' });
  await img.clone().resize({ width: 737 }).webp({ quality: 86 }).toFile(`${OUT}/${j.id}.webp`);
  await img.clone().resize({ width: 400 }).webp({ quality: 84 }).toFile(`${OUT}/${j.id}-400w.webp`);
  console.log('ok', j.id, rect.width, 'x', rect.height);
}
await browser.close();
