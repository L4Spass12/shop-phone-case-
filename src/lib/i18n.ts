/**
 * Helpers d'internationalisation (i18n).
 *
 * Stratégie : sous-dossier (la locale par défaut reste à la racine, les autres
 * prennent /<lang>/...). Les chaînes UI sont dans src/i18n/<lang>.json et accédées
 * via la fonction `t(key, lang, vars?)` avec interpolation simple {var}.
 *
 * Le dictionnaire est importé statiquement à la compilation : aucune charge réseau
 * runtime, et les clés inexistantes lèvent un warning au build.
 */
import siteConfig from '../../site.config.mjs';
import fr from '../i18n/fr.json';
import en from '../i18n/en.json';
import de from '../i18n/de.json';

export type Locale = 'fr' | 'en' | 'de';

const dictionaries: Record<Locale, Record<string, unknown>> = { fr, en, de };

const DEFAULT_LOCALE: Locale = (siteConfig.i18n?.defaultLocale ?? 'fr') as Locale;
export const ACTIVE_LOCALES: Locale[] = (siteConfig.i18n?.locales ?? ['fr']) as Locale[];
export const ALL_LOCALES: Locale[] = [
  ...ACTIVE_LOCALES,
  ...((siteConfig.i18n?.plannedLocales ?? []) as Locale[]),
];

/** Locale de la page courante en lisant l'URL (ex: "/en/foo/" → "en"). */
export function localeFromPath(pathname: string): Locale {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg && (ACTIVE_LOCALES as string[]).includes(seg)) return seg as Locale;
  return DEFAULT_LOCALE;
}

/** Préfixe URL d'une locale (ex: 'en' → '/en', 'fr' → '' car défaut sans préfixe). */
export function localePrefix(lang: Locale): string {
  return lang === DEFAULT_LOCALE ? '' : `/${lang}`;
}

/**
 * Réécrit une URL pour la cibler vers une autre locale.
 * Ex: localizeUrl('/blog/', 'en') → '/en/blog/'
 *     localizeUrl('/en/blog/', 'fr') → '/blog/'
 */
export function localizeUrl(path: string, target: Locale): string {
  // 1. Strip le préfixe locale courant s'il existe
  let stripped = path;
  for (const l of ALL_LOCALES) {
    if (l === DEFAULT_LOCALE) continue;
    if (path === `/${l}` || path === `/${l}/`) { stripped = '/'; break; }
    if (path.startsWith(`/${l}/`)) { stripped = path.slice(l.length + 1); break; }
  }
  // 2. Préfixe avec la locale cible
  const prefix = localePrefix(target);
  if (!prefix) return stripped;
  return prefix + (stripped.startsWith('/') ? stripped : `/${stripped}`);
}

/** Récupère récursivement une clé dot-path dans un dictionnaire. */
function getByPath(obj: Record<string, unknown>, path: string): string | undefined {
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

/**
 * Traduit une clé (ex: "nav.home") avec interpolation optionnelle ({var} → vars.var).
 * Fallback : locale demandée → locale par défaut → clé brute (loggue un warning).
 */
export function t(key: string, lang: Locale = DEFAULT_LOCALE, vars?: Record<string, string | number>): string {
  let s = getByPath(dictionaries[lang] as Record<string, unknown>, key);
  if (s === undefined && lang !== DEFAULT_LOCALE) {
    s = getByPath(dictionaries[DEFAULT_LOCALE] as Record<string, unknown>, key);
  }
  if (s === undefined) {
    if (typeof console !== 'undefined') console.warn(`[i18n] clé manquante : "${key}" (locale: ${lang})`);
    return key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}

/** Métadonnées d'une locale (label, htmlLang, currency…). */
export function localeMeta(lang: Locale) {
  return (siteConfig.i18n?.locale ?? {})[lang] ?? {
    label: lang.toUpperCase(),
    short: lang.toUpperCase(),
    htmlLang: lang,
    currency: 'EUR',
  };
}

/** Devise ISO 4217 (3 lettres) active pour la locale donnée. */
export function currencyForLocale(lang: Locale): string {
  return (localeMeta(lang).currency ?? 'EUR').toUpperCase();
}

/**
 * Extrait la locale et le "vrai" slug d'une content entry Astro.
 *
 * Convention : si l'entry est dans un sous-dossier dont le nom correspond à
 * une locale connue (ex: src/content/blog/en/foo.md → entry.slug = 'en/foo'),
 * on considère que c'est la version localisée. Sinon, c'est la locale par
 * défaut (FR), entièrement à plat (src/content/blog/foo.md → slug 'foo').
 *
 * Permet aux routes existantes de continuer à fonctionner exactement comme
 * avant pour les fichiers FR, tout en supportant les versions EN/DE quand
 * elles arrivent (phase 5).
 */
export function parseEntrySlug(entrySlug: string): { lang: Locale; slug: string } {
  const parts = entrySlug.split('/');
  const first = parts[0];
  if (first && (ALL_LOCALES as string[]).includes(first)) {
    return { lang: first as Locale, slug: parts.slice(1).join('/') };
  }
  return { lang: DEFAULT_LOCALE, slug: entrySlug };
}

/**
 * Construit l'URL publique d'une content entry.
 * - FR (locale par défaut) : pas de préfixe → URLs SEO existantes préservées.
 * - EN / DE : préfixe /<lang>/.
 *
 * `base` est le segment de route (ex: 'product', 'product-category', '' pour blog à la racine).
 */
export function entryRoutePath(entrySlug: string, base = ''): string {
  const { lang, slug } = parseEntrySlug(entrySlug);
  const prefix = localePrefix(lang);
  const segs = [base, slug].filter(Boolean).join('/');
  return `${prefix}/${segs}/`.replace(/\/+/g, '/');
}

/** Format prix selon la locale (utilise Intl.NumberFormat natif). */
export function formatPrice(value: number, lang: Locale = DEFAULT_LOCALE): string {
  const meta = localeMeta(lang);
  const intlLocale = lang === 'en' ? 'en-GB' : lang === 'de' ? 'de-DE' : 'fr-FR';
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: meta.currency || 'EUR',
  }).format(value);
}
