import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import siteConfig from '../site.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOPICS_FILE = path.join(__dirname, 'topics.json');

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function parseTopics() {
  const raw = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
  // Accepte "titre simple" ou { title, publishedAt }
  const topics = raw.map(t => typeof t === 'string' ? { title: t } : t);
  const todo = topics.filter(t => !t.publishedAt).map(t => t.title);
  return { todo };
}

function markAsDone(title, date) {
  const raw = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
  const updated = raw.map(t => {
    const currentTitle = typeof t === 'string' ? t : t.title;
    if (currentTitle === title) return { title, publishedAt: date };
    return t;
  });
  fs.writeFileSync(TOPICS_FILE, JSON.stringify(updated, null, 2), 'utf8');
}

async function fetchUnsplashImage(query, filename, width = 1200, excludeIds = []) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) { console.warn('UNSPLASH_ACCESS_KEY manquant.'); return null; }

  const ctx = siteConfig.article.unsplashContext;
  const pickPhoto = (results) => (results ?? []).find(p => !excludeIds.includes(p.id));

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' ' + ctx)}&per_page=10&orientation=landscape&content_filter=high`;
  console.log(`Unsplash search: "${query + ' ' + ctx}"${excludeIds.length ? ` (exclude ${excludeIds.length})` : ''}`);

  let searchRes;
  try { searchRes = await fetch(url, { headers: { Authorization: `Client-ID ${accessKey}` } }); }
  catch (e) { console.warn(`Unsplash fetch error: ${e.message}`); return null; }

  if (!searchRes.ok) {
    const body = await searchRes.text();
    console.warn(`Unsplash API ${searchRes.status}: ${body}`);
    return null;
  }

  const data = await searchRes.json();
  let photo = pickPhoto(data.results);

  // Fallback : réessaie avec les 2 premiers mots si aucun résultat (non-exclus)
  if (!photo) {
    console.warn(`Aucun résultat pour "${query}", tentative avec requête simplifiée...`);
    const fallbackQuery = encodeURIComponent(query.split(' ').slice(0, 2).join(' ') + ' ' + ctx);
    const fallbackRes = await fetch(
      `https://api.unsplash.com/search/photos?query=${fallbackQuery}&per_page=10&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    ).catch(() => null);
    const fallbackData = fallbackRes?.ok ? await fallbackRes.json() : null;
    photo = pickPhoto(fallbackData?.results);
    if (!photo) { console.warn(`Aucune photo Unsplash même en fallback pour "${query}"`); return null; }
  }

  // Demande directement le WebP à Unsplash
  const webpUrl = `${photo.urls.raw}&w=${width}&fm=webp&q=82`;
  let imgRes;
  try { imgRes = await fetch(webpUrl); }
  catch (e) { console.warn(`Download error: ${e.message}`); return null; }
  if (!imgRes.ok) { console.warn(`Image download ${imgRes.status}`); return null; }

  const webpFilename = filename.replace(/\.jpg$/, '.webp');
  const imgDir = path.join(__dirname, '..', 'public', 'images', 'blog');
  fs.mkdirSync(imgDir, { recursive: true });
  fs.writeFileSync(path.join(imgDir, webpFilename), Buffer.from(await imgRes.arrayBuffer()));

  // Obligatoire selon les CGU Unsplash
  await fetch(photo.links.download_location, { headers: { Authorization: `Client-ID ${accessKey}` } }).catch(() => {});

  console.log(`✓ Image téléchargée : ${webpFilename} (${photo.user.name}) [${width}px]`);
  return { id: photo.id, filename: webpFilename, photographer: photo.user.name, photographerUrl: photo.user.links.html, width };
}

async function generateImageSeo(title, kw, context, client) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Pour une image illustrant un article de blog intitulé "${title}" (mot-clé : "${kw}"), dans la section "${context}", génère en JSON sans markdown :
{"alt": "texte alt SEO, 10-15 mots, inclut le mot-clé naturellement", "title": "attribut title HTML, 8-12 mots, complémentaire à l'alt"}`
    }]
  });
  try { return JSON.parse(msg.content[0].text.trim()); }
  catch { return { alt: `${kw} - ${context}`, title: title }; }
}

function extractH2Headings(content) {
  return [...content.matchAll(/^## (.+)$/gm)].map(m => m[1]);
}

function injectAfterSection(content, sectionIndex, imageHtml) {
  // Split on H2 headings, inject at end of target section
  const parts = content.split(/(?=\n## )/);
  if (sectionIndex >= parts.length) return content;
  // Inject before the next section (append to end of this section)
  parts[sectionIndex] = parts[sectionIndex].trimEnd() + '\n\n' + imageHtml + '\n';
  return parts.join('');
}

function buildImageHtml(webPath, alt, title, photographer, photographerUrl, width = 1200) {
  const height = Math.round(width * 2 / 3); // ratio 3:2 landscape
  const utmSource = siteConfig.name.toLowerCase().replace(/\s+/g, '');
  return `<figure>
<img src="${webPath}" alt="${alt}" title="${title}" width="${width}" height="${height}" loading="lazy" />
<figcaption>Photo de <a href="${photographerUrl}?utm_source=${utmSource}&utm_medium=referral" rel="nofollow" target="_blank">${photographer}</a> sur <a href="https://unsplash.com?utm_source=${utmSource}&utm_medium=referral" rel="nofollow" target="_blank">Unsplash</a></figcaption>
</figure>`;
}

async function generateArticle() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let { todo } = parseTopics();

  if (todo.length === 0) {
    console.log('Liste vide — génération automatique d\'un nouveau sujet...');

    const raw = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
    const doneTitles = raw
      .filter(t => typeof t === 'object' && t.publishedAt)
      .map(t => `"${t.title}"`)
      .join(', ');

    const topicMsg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Tu es expert SEO pour ${siteConfig.name}, ${siteConfig.article.context}.

Propose UN nouveau sujet d'article de blog original, en français, optimisé SEO, en lien avec ${siteConfig.article.theme}.

Sujets déjà traités : ${doneTitles}

Retourne UNIQUEMENT le titre du sujet, sans guillemets ni ponctuation finale.`
      }]
    });

    const newTitle = topicMsg.content[0].text.trim();
    console.log(`Nouveau sujet généré : "${newTitle}"`);

    const updated = raw.concat([newTitle]);
    fs.writeFileSync(TOPICS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    todo = [newTitle];
  }

  const title = todo[0];
  const today = todayISO();
  // Slug provisoire — sert juste à détecter les topics déjà traités via
  // l'ancien slug long pour éviter une régénération.
  const provisionalSlug = slugify(title);
  const provisionalPath = path.join(__dirname, '..', 'src', 'content', 'blog', `${provisionalSlug}.md`);
  if (fs.existsSync(provisionalPath)) {
    console.log(`Fichier déjà existant (slug long): ${provisionalSlug}.md — marqué comme fait.`);
    markAsDone(title, today);
    process.exit(0);
  }

  console.log(`Génération : "${title}"`);

  // Claude définit catégorie, tags, mot-clé ET titre SEO court (≤ 60 chars)
  // depuis le topic. Le topic peut être un brouillon long ("Sujet long
  // de souris XXL : lequel choisir pour votre bureau en 2026 ? (gaming &
  // télétravail)" = 101 chars) — Claude en tire un titre SEO punchy.
  const metaMsg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    messages: [{
      role: 'user',
      content: `Pour cet article de blog sur ${siteConfig.name} (${siteConfig.article.context}) :
Topic original : "${title}"

Réponds en JSON uniquement, sans markdown :
{
  "seoTitle": "titre SEO accrocheur, MAX 60 caractères espaces inclus, contient le mot-clé principal, capitalisation Title Case française (1re lettre + noms propres uniquement)",
  "category": "une valeur parmi : ${siteConfig.categories.join(', ')}",
  "tags": ["tag1", "tag2", "tag3"],
  "kw": "mot-clé principal SEO (3-5 mots, le plus recherché sur Google)"
}

Règle absolue : seoTitle doit faire ≤ 60 caractères. Si le topic est trop long, condense-le sans perdre le mot-clé ni l'angle.`
    }]
  });

  let meta = { seoTitle: title.slice(0, 60), category: siteConfig.categories[0], tags: [], kw: title };
  try {
    const raw = metaMsg.content[0].text.replace(/```json\n?|\n?```/g, '').trim();
    meta = { ...meta, ...JSON.parse(raw) };
  } catch {
    console.warn('Métadonnées par défaut utilisées.');
  }

  // Garde-fou : si Claude dépasse 60 chars, on tronque proprement à un mot.
  if (meta.seoTitle && meta.seoTitle.length > 60) {
    console.warn(`seoTitle trop long (${meta.seoTitle.length} chars) → troncature à 60.`);
    meta.seoTitle = meta.seoTitle.slice(0, 60).replace(/\s+\S*$/, '').trim();
  }
  const seoTitle = meta.seoTitle || title;

  // Slug FINAL dérivé du seoTitle court → URL propre + SEO-friendly.
  const slug = slugify(seoTitle);
  const filePath = path.join(__dirname, '..', 'src', 'content', 'blog', `${slug}.md`);
  if (fs.existsSync(filePath)) {
    console.log(`Fichier déjà existant (slug court): ${slug}.md — marqué comme fait.`);
    markAsDone(title, today);
    process.exit(0);
  }
  console.log(`Slug final : ${slug}  (seoTitle: "${seoTitle}", ${seoTitle.length} chars)`);

  // Snap la catégorie sur la valeur canonique du site.config (insensible aux variantes
  // d'apostrophe ' / ' / ` et à la casse) pour respecter strictement le schéma Astro.
  const normCat = s => String(s).normalize('NFKC').replace(/[‘’ʼ`']/g, '').toLowerCase().trim();
  const canonicalCat = siteConfig.categories.find(c => normCat(c) === normCat(meta.category));
  if (!canonicalCat) console.warn(`Catégorie "${meta.category}" inconnue → fallback "${siteConfig.categories[0]}"`);
  meta.category = canonicalCat || siteConfig.categories[0];

  // Maillage interne dynamique — liste des articles existants
  const blogDir = path.join(__dirname, '..', 'src', 'content', 'blog');
  const existingArticles = fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.md') && !f.includes(slug))
    .map(f => {
      const content = fs.readFileSync(path.join(blogDir, f), 'utf8');
      const titleMatch = content.match(/^title:\s*"(.+)"/m);
      const articleSlug = f.replace('.md', '');
      return titleMatch ? { title: titleMatch[1], slug: articleSlug } : null;
    })
    .filter(Boolean);

  // Maillage interne unifié — articles existants + catégories produits
  // (commerce > blog, donc on PRIORISE les catégories produits dans le mix).
  const productCats = (siteConfig.productCategories || []).map(c => ({
    slug: c.slug,
    label: c.labels?.fr ?? c.label ?? c.slug,
  }));

  let internalLinks = `- [${siteConfig.name}](/) — page d'accueil du site\n- [notre boutique](/${siteConfig.shop?.path ?? 'shop'}/) — toutes nos catégories produits\n- [notre blog](/blog/) — tous nos articles`;

  if (existingArticles.length > 0 || productCats.length > 0) {
    const articleList = existingArticles.length > 0
      ? `## Articles de blog existants :\n${existingArticles.map(a => `"${a.title}" -> /${a.slug}/`).join('\n')}`
      : '## Aucun autre article de blog.';
    const catList = productCats.length > 0
      ? `## Catégories produits du shop :\n${productCats.map(c => `"${c.label}" -> /product-category/${c.slug}/`).join('\n')}`
      : '';

    const linkMsg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Nouvel article : "${seoTitle}" (mot-clé principal : "${meta.kw}")

${articleList}

${catList}

Choisis 4 liens internes pertinents à intégrer naturellement dans le nouvel article.
RÈGLE DE MIX : au moins **2 catégories produits** (priorité commerce) + 1 à 2 articles de blog (renforcement thématique). Les catégories produits sont la cible commerciale principale : elles convertissent en ventes, donc privilégie-les si pertinent.

Pour chaque lien, propose une ancre 3-5 mots naturelle, descriptive, intégrable dans une phrase.

Réponds en JSON sans markdown :
[{"type": "category|article", "path": "/...", "anchor": "ancre naturelle", "title": "titre/label original"}]`
      }]
    });

    try {
      const raw = linkMsg.content[0].text.replace(/```json\n?|\n?```/g, '').trim();
      const picks = JSON.parse(raw);
      const validated = picks.map(p => {
        // Catégorie produit
        if (p.type === 'category' || p.path?.startsWith('/product-category/')) {
          const slug = p.path?.replace(/^\/product-category\//, '').replace(/\/$/, '');
          const match = productCats.find(c => c.slug === slug);
          if (!match) {
            console.warn(`Catégorie produit introuvable : ${p.path}`);
            return null;
          }
          return { anchor: p.anchor, path: `/product-category/${match.slug}/`, title: match.label };
        }
        // Article de blog
        const match = existingArticles.find(a =>
          p.path?.includes(a.slug) || p.title === a.title
        );
        if (!match) {
          console.warn(`Article introuvable : ${p.path ?? p.title}`);
          return null;
        }
        return { anchor: p.anchor, path: `/${match.slug}/`, title: match.title };
      }).filter(Boolean);
      if (validated.length > 0) {
        const dynamicLinks = validated.map(p => `- [${p.anchor}](${p.path}) — ${p.title}`).join('\n');
        internalLinks += '\n' + dynamicLinks;
      }
      console.log(`Liens internes construits :\n${internalLinks}`);
    } catch (e) {
      console.warn(`Maillage dynamique échoué (${e.message}), réponse : ${linkMsg.content[0].text.slice(0, 200)}`);
    }
  }

  const prompt = `Tu es un rédacteur SEO expert spécialisé dans la thématique suivante : ${siteConfig.article.theme}. Tu travailles pour **${siteConfig.name}**, ${siteConfig.article.context}.

## MISSION
Rédige un article de blog long-format, de haute qualité éditoriale, optimisé pour le référencement Google selon les critères **E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness).

## SUJET
- **Titre SEO** (= titre H1 et balise <title>) : ${seoTitle}
- **Angle / topic original** : ${title}
- **Mot-clé principal** : ${meta.kw}
- **Catégorie** : ${meta.category}

## STRUCTURE OBLIGATOIRE (dans cet ordre)
1. **Introduction** (150-180 mots) - PAS de titre/heading pour l'intro, commence directement par le 1er paragraphe. Accroche avec un constat ou une question, inclure le mot-clé principal dans les 100 premiers mots.
2. **3 à 4 sections H2 thématiques** - chaque section avec 150-200 mots, sous-titres H3 si pertinent. Les H2 doivent être DISTINCTS du titre de l'article (interdit de réutiliser le titre comme H2).
3. **Section FAQ** - titre H2 "Questions fréquentes", puis 3 accordéons HTML avec ce format EXACT (pas de markdown, HTML pur) :
<details>
<summary>La question ici ?</summary>
<p>La réponse complète ici en une ou deux phrases.</p>
</details>
   ⚠️ INTERDIT à l'intérieur des balises HTML <p>, <summary>, <details> : les caractères ** (gras markdown) et * (italique markdown) — ils ne seront PAS rendus. Si tu veux du gras, utilise <strong>texte</strong>. Si tu veux de l'italique, utilise <em>texte</em>.
4. **Conclusion + CTA** (80-100 mots) - synthèse et invitation à ${siteConfig.article.cta}

## RÈGLES E-E-A-T
- **Expertise** : chiffres concrets, vocabulaire technique (gaming, ergonomie, périphériques, matériaux)
- **Experience** : "chez ${siteConfig.name}, nous avons constaté...", retour d'expérience réel
- **Autorité** : structure claire, contenu actionnable et non générique
- **Confiance** : ton honnête, nuances quand pertinent

## MAILLAGE INTERNE — RÈGLE ABSOLUE
Tu DOIS intégrer CHACUN de ces liens dans le corps du texte (pas en liste, de manière naturelle dans une phrase) :
${internalLinks}

Aucun lien ne peut être omis. Chaque lien doit apparaître une fois dans le texte rédigé.

## BALISAGE MARKDOWN
- **Gras** : termes clés, chiffres importants, conseils actionnables (3-5 fois par section)
- *Italique* : termes techniques ou étrangers
- Listes : quand 3+ éléments énumérés
- > Citations : pour un conseil fort ou une stat marquante
- Interdiction absolue d'utiliser le caractère "—" (tiret cadratin), utilise "-" à la place

## LONGUEUR
800 à 1000 mots.

## INTERDICTIONS ABSOLUES
- Pas de titre H1 (le H1 est généré depuis le frontmatter)
- Pas de H2/H3 qui reprend le titre de l'article
- Pas de heading "## Introduction" ni "### Introduction" - démarre directement par le 1er paragraphe
- Pas de séparateurs horizontaux \`---\` entre les sections (les H2 séparent suffisamment)
- Pas de heading "## Conclusion" - la conclusion peut être nommée différemment (ex: "## Pour aller plus loin", "## Notre sélection") ou démarrer directement sans titre`;

  const articleMsg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  let rawContent = articleMsg.content[0].text.replace(/—/g, '-');

  // Valide les liens internes vers les articles. Les articles sont à la racine
  // (/<slug>/, pas /blog/<slug>/). On accepte les 2 formats en entrée pour rattraper
  // les hallucinations du LLM, et on normalise systématiquement vers /<slug>/.
  const validSlugs = new Set(existingArticles.map(a => a.slug));
  rawContent = rawContent.replace(/\]\(\/(?:blog\/)?([a-z0-9-]+)\/?\)/g, (fullMatch, slug) => {
    // Slugs réservés non-blog (homepage, listing, etc.) : on laisse passer le match d'origine.
    const reserved = new Set(['blog', 'contact', 'boutique', 'category', 'product', 'product-category']);
    if (reserved.has(slug)) return fullMatch;
    if (validSlugs.has(slug)) return `](/${slug}/)`;
    // Correspondance approximative (chars en commun à la même position)
    const best = existingArticles
      .map(a => ({ slug: a.slug, score: [...slug].filter((c, i) => a.slug[i] === c).length / Math.max(slug.length, a.slug.length) }))
      .sort((a, b) => b.score - a.score)[0];
    if (best && best.score > 0.7) {
      console.log(`🔗 Lien corrigé : ${fullMatch} → /${best.slug}/`);
      return `](/${best.slug}/)`;
    }
    console.warn(`⚠ Lien cassé non corrigé : ${fullMatch}`);
    return `](/blog/)`;
  });

  // Extraire les Q&A pour le schema FAQ
  const faqItems = [];
  const detailsRegex = /<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g;
  let match;
  while ((match = detailsRegex.exec(rawContent)) !== null) {
    faqItems.push({
      q: match[1].trim(),
      a: match[2].trim().replace(/<[^>]+>/g, '').trim(),
    });
  }

  // --- Images Unsplash ---
  const headings = extractH2Headings(rawContent);

  // Image de couverture — recherche ciblée avec le mot-clé SEO, repli sur le mot-clé
  // générique du site (siteConfig.article.coverFallbackKeyword) si Unsplash ne renvoie rien.
  let coverData = await fetchUnsplashImage(meta.kw, `${slug}.jpg`);
  if (!coverData && siteConfig.article.coverFallbackKeyword) {
    console.warn(`Cover Unsplash absente pour "${meta.kw}" → retry avec "${siteConfig.article.coverFallbackKeyword}"`);
    coverData = await fetchUnsplashImage(siteConfig.article.coverFallbackKeyword, `${slug}.jpg`);
  }
  let coverSeo = null;
  if (coverData) {
    coverSeo = await generateImageSeo(title, meta.kw, 'couverture', client);
  }

  // Image contenu 1 — après la 1ère section H2 (900px)
  const img1Query = headings[0] ?? meta.kw;
  const img1Data = await fetchUnsplashImage(img1Query, `${slug}-1.jpg`, 900, coverData ? [coverData.id] : []);
  let img1Seo = null;
  if (img1Data) {
    img1Seo = await generateImageSeo(title, meta.kw, headings[0] ?? 'section 1', client);
    const img1Html = buildImageHtml(`/images/blog/${img1Data.filename}`, img1Seo.alt, img1Seo.title, img1Data.photographer, img1Data.photographerUrl, 900);
    rawContent = injectAfterSection(rawContent, 1, img1Html);
  }

  // Image contenu 2 — après la 3ème section H2 (900px)
  const img2Heading = headings[2] ?? headings[1] ?? meta.kw;
  const usedIds = [coverData?.id, img1Data?.id].filter(Boolean);
  const img2Data = await fetchUnsplashImage(img2Heading, `${slug}-2.jpg`, 900, usedIds);
  let img2Seo = null;
  if (img2Data) {
    img2Seo = await generateImageSeo(title, meta.kw, img2Heading, client);
    const img2Html = buildImageHtml(`/images/blog/${img2Data.filename}`, img2Seo.alt, img2Seo.title, img2Data.photographer, img2Data.photographerUrl, 900);
    rawContent = injectAfterSection(rawContent, 3, img2Html);
  }

  const descMsg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Rédige une meta description SEO pour cet article de blog.

Titre : ${seoTitle}
Mot-clé principal : ${meta.kw}

RÈGLES STRICTES :
- Longueur IMPÉRATIVE : entre 140 et 160 caractères espaces inclus (jamais moins de 140, jamais plus de 160)
- Le mot-clé principal "${meta.kw}" doit apparaître dans les 60 premiers caractères
- Commence par un verbe d'action ou un constat (Découvrez, Optez pour, Le guide…, Tout savoir sur…)
- Termine par un CTA implicite ou explicite (notre guide complet, à découvrir, etc.)
- Pas de guillemets autour du texte, pas de markdown

Retourne UNIQUEMENT la meta description.`
    }]
  });

  // Meta description : 140-160 chars idéal, 165 absolu (Google tronque ~920px ≈ 160 chars).
  let description = descMsg.content[0].text.trim().replace(/"/g, "'");
  if (description.length > 160) {
    console.warn(`Description trop longue (${description.length} chars) → troncature à un mot.`);
    description = description.slice(0, 160).replace(/\s+\S*$/, '').trim();
    if (!/[.!?]$/.test(description)) description += '.';
  }
  if (description.length < 120) {
    console.warn(`Description trop courte (${description.length} chars) — risque de Google la réécrire.`);
  }

  const faqYaml = faqItems.length > 0
    ? `faq:\n${faqItems.map(f => `  - q: "${f.q.replace(/"/g, "'")}"\n    a: "${f.a.replace(/"/g, "'")}"`).join('\n')}\n`
    : '';

  // Cover image avec fallback : si l'Unsplash de la cover a échoué (mot-clé sans résultat),
  // on réutilise l'image 1 du contenu pour ne jamais publier d'article sans vignette.
  let coverFile = null, coverAlt = null, coverTitle = null;
  if (coverData && coverSeo) {
    coverFile = coverData.filename;
    coverAlt = coverSeo.alt;
    coverTitle = coverSeo.title;
  } else if (img1Data && img1Seo) {
    console.warn('Cover Unsplash absente → fallback sur image 1 du contenu.');
    coverFile = img1Data.filename;
    coverAlt = img1Seo.alt;
    coverTitle = img1Seo.title;
  } else if (img2Data && img2Seo) {
    console.warn('Cover + image 1 absentes → fallback sur image 2 du contenu.');
    coverFile = img2Data.filename;
    coverAlt = img2Seo.alt;
    coverTitle = img2Seo.title;
  }
  const imageFrontmatter = coverFile
    ? `image: "/images/blog/${coverFile}"\nimageAlt: "${coverAlt}"\nimageTitle: "${coverTitle}"\n`
    : '';

  // Le titre du frontmatter = seoTitle court (≤ 60 chars), utilisé pour H1 + <title>.
  // Le topic long d'origine reste dans topics.json comme référence éditoriale.
  const frontmatter = `---
title: "${seoTitle.replace(/"/g, "'")}"
description: "${description}"
pubDate: ${today}
author: "${siteConfig.article.author}"
category: ${meta.category}
tags: [${meta.tags.map(t => `"${t}"`).join(', ')}]
featured: false
${imageFrontmatter}${faqYaml}---

`;

  // Normalisation finale du fichier complet (frontmatter + body).
  let finalFile = frontmatter + rawContent;

  // 1. Tirets cadratin/demi-cadratin → tiret simple
  finalFile = finalFile.replace(/[—–]/g, '-');

  // 2. Markdown inline à l'intérieur des blocs HTML <details>…</details> :
  //    le parseur CommonMark ne traite PAS le markdown dans les blocs HTML, donc
  //    "**gras**" reste tel quel sur la page. On convertit ici en <strong>/<em>/<code>.
  finalFile = finalFile.replace(/<details>[\s\S]*?<\/details>/g, (block) => block
    .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*<])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`\n]+?)`/g, '<code>$1</code>')
  );

  fs.writeFileSync(filePath, finalFile, 'utf8');
  markAsDone(title, today);

  console.log(`Article sauvegardé : ${filePath}`);
  console.log(`Mots : ~${rawContent.split(/\s+/).length}`);
}

generateArticle().catch(err => {
  console.error(err);
  process.exit(1);
});
