// Pages « coques par modèle » (/coques/<id>/) : les modèles viennent des
// photos générées par l'atelier (src/data/variants.json → _models), donc une
// page n'existe que pour un modèle dont on a les photos de toutes les coques.
import variants from '../data/variants.json';
import aliases from '../data/model-aliases.json';
import siteConfig from '../../site.config.mjs';
import type { Locale } from './i18n';

type Variants = Record<string, Record<string, { plat?: string; relief?: string }>> & { _models: Record<string, string> };
const V = variants as unknown as Variants;

export type PhoneModel = {
  /** Identifiant d'URL : iphone-16-pro-max, galaxy-s25-ultra… */
  id: string;
  /** Libellé du site (sélecteur de modèle, panier) : « Galaxy S25 Ultra ». */
  label: string;
  /** Nom complet pour les textes : « Samsung Galaxy S25 Ultra ». */
  fullName: string;
  brand: 'apple' | 'samsung';
  /** Modèle au même gabarit dont il reprend photos et calques (iPhone 18 Pro
   *  → 17 Pro, voir src/data/model-aliases.json). Libellé du modèle d'origine. */
  sameAs?: string;
};

export const PHONE_MODELS: PhoneModel[] = Object.entries(V._models).map(([id, label]) => {
  const samsung = id.startsWith('galaxy');
  const alias = (aliases as { id: string; from: string }[]).find((a) => a.id === id);
  return {
    id, label, fullName: samsung ? `Samsung ${label}` : label, brand: samsung ? 'samsung' : 'apple',
    ...(alias ? { sameAs: V._models[alias.from] } : {}),
  };
});

/** Modèles qui ont vraiment leurs photos (les alias reprennent celles d'un
 *  autre modèle et n'ont pas de fichiers à eux). */
const ALIAS_FROM = new Map((aliases as { id: string; from: string }[]).map((a) => [a.id, a.from]));
const PHOTO_IDS = new Set(Object.keys(V._models).filter((id) => !ALIAS_FROM.has(id)));
const premier = (ids: string[]) => ids.find((id) => PHOTO_IDS.has(id)) ?? null;

/** Modèle dont on montre les photos pour un libellé du sélecteur : le modèle
 *  lui-même, sinon le plus proche (iPhone 12 Pro → iPhone 12, Galaxy S25+ →
 *  Galaxy S25), pour que TOUTES les cartes montrent le même téléphone.
 *  Autres marques (Xiaomi, Pixel, Honor…) : un Galaxy, au module photo proche. */
export function photoModelId(label: string): string {
  const id = Object.entries(V._models).find(([, l]) => l === label)?.[0];
  if (id) return ALIAS_FROM.get(id) ?? id;
  const ip = /^iPhone (\d+)/i.exec(label);
  if (ip) {
    const n = ip[1];
    const suite = /pro max/i.test(label) ? ['-pro-max', '-pro', '-plus', '']
      : /pro/i.test(label) ? ['-pro', ''] : /plus/i.test(label) ? ['-plus', ''] : [''];
    return premier(suite.map((s) => `iphone-${n}${s}`)) ?? 'iphone-17-pro';
  }
  const s = /^Galaxy S(\d+)/i.exec(label);
  if (s) return premier([...(/ultra/i.test(label) ? [`galaxy-s${s[1]}-ultra`] : []), `galaxy-s${s[1]}`]) ?? (/ultra/i.test(label) ? 'galaxy-s24-ultra' : 'galaxy-s24');
  const a = /^Galaxy A(\d+)/i.exec(label);
  if (a) return Number(a[1]) >= 50 ? 'galaxy-a56-5g' : 'galaxy-a36-5g';
  return 'galaxy-s25';
}

/** Tous les libellés du sélecteur (catalogue et modèles sur commande), avec
 *  le modèle dont on montre les photos. */
export const PHOTO_ID_BY_LABEL: Record<string, string> = Object.fromEntries(
  [
    ...(siteConfig.phoneModels?.brands ?? []).flatMap((b: { models: { label: string }[] }) => b.models.map((m) => m.label)),
    ...(siteConfig.phoneModels?.onDemand?.brands ?? []).flatMap((b: { models: string[] }) => b.models),
  ].map((label: string) => [label, photoModelId(label)]),
);

/** « l'iPhone 17 », « le Galaxy S25 ». */
const leFr = (label: string) => (/^[aeiouyh]/i.test(label) ? `l'${label}` : `le ${label}`);

/** Photo d'une coque sur ce modèle (rendu à plat), ou null. */
export function modelPhoto(productSlug: string, modelId: string): string | null {
  return V[productSlug]?.[modelId]?.plat ?? null;
}

/** Textes des pages modèle, par langue. Volontairement sans parler de
 *  personnalisation : ces pages répondent à « coque <modèle> ». */
export const MODEL_TEXT: Record<Locale, {
  title: (m: PhoneModel) => string;
  h1: (m: PhoneModel) => string;
  description: (m: PhoneModel, n: number) => string;
  intro: (m: PhoneModel, n: number) => string;
  count: (n: number) => string;
  from: (price: string) => string;
  faqTitle: string;
  faq: (m: PhoneModel) => { q: string; a: string }[];
  otherModels: string;
  home: string;
  shop: string;
  /** Titre de la liste des modèles dans le pied de page. */
  footer: string;
}> = {
  fr: {
    title: (m) => `Coques ${m.fullName} imprimées en France`,
    h1: (m) => `Coques ${m.fullName}`,
    description: (m, n) => `${n} coques pour ${m.fullName} : animaux, fleurs, citations, motifs… Imprimées à l'unité en France, à plat ou en relief. Livraison suivie.`,
    intro: (m, n) => `Toutes nos coques pour ${m.fullName}, soit ${n} designs, ${m.sameAs ? `présentées sur ${leFr(m.sameAs)}, au gabarit identique` : `photographiées sur ${leFr(m.label)} lui-même`}. Chaque coque transparente est moulée pour ce modèle et imprimée à l'unité dans notre atelier en France, à plat ou en relief.`,
    count: (n) => `${n} coque${n > 1 ? 's' : ''}`,
    from: (p) => `À partir de ${p}`,
    faqTitle: 'Questions fréquentes',
    faq: (m) => [
      { q: `Ces coques sont-elles bien compatibles avec mon ${m.label} ?`, a: `Oui : toutes les coques de cette page sont moulées pour le ${m.fullName}, et uniquement lui. Vérifiez le nom exact de votre téléphone dans ${m.brand === 'apple' ? 'Réglages, Général, Informations' : 'Paramètres, À propos du téléphone'} avant de commander.` },
      { q: 'Quelle différence entre l’impression à plat et en relief ?', a: 'À plat, l’encre affleure la coque : surface lisse et couleurs franches. En relief, l’encre est déposée en plusieurs couches : le motif se sent sous le doigt.' },
      { q: 'Quel est le délai de livraison ?', a: 'Chaque coque est imprimée à la commande puis expédiée sous 1 à 2 jours ouvrés, puis livrée par La Poste en 3 jours ouvrés à domicile en France. En point relais, comptez 4 à 7 jours ouvrés au total.' },
    ],
    otherModels: 'Autres modèles',
    home: 'Accueil',
    shop: 'Boutique',
    footer: 'Coques par modèle',
  },
  en: {
    title: (m) => `${m.fullName} cases printed in France`,
    h1: (m) => `${m.fullName} cases`,
    description: (m, n) => `${n} cases for the ${m.fullName}: animals, flowers, quotes, patterns… Printed one at a time in France, flat or raised. Tracked shipping.`,
    intro: (m, n) => `All our cases for the ${m.fullName}, ${n} designs in all, ${m.sameAs ? `shown on the ${m.sameAs}, which has the same dimensions` : `photographed on the ${m.label} itself`}. Each clear case is moulded for this model and printed one at a time in our workshop in France, flat or raised.`,
    count: (n) => `${n} case${n > 1 ? 's' : ''}`,
    from: (p) => `From ${p}`,
    faqTitle: 'Frequently asked questions',
    faq: (m) => [
      { q: `Will these cases fit my ${m.label}?`, a: `Yes: every case on this page is moulded for the ${m.fullName}, and only for it. Check the exact name of your phone in ${m.brand === 'apple' ? 'Settings, General, About' : 'Settings, About phone'} before ordering.` },
      { q: 'What is the difference between flat and raised printing?', a: 'Flat printing sits flush with the case: smooth surface, bold colours. Raised printing builds the ink up in several layers, so you can feel the design under your finger.' },
      { q: 'How long is delivery?', a: 'Each case is printed to order and shipped within 1 to 2 working days. Delivery times depend on your country.' },
    ],
    otherModels: 'Other models',
    home: 'Home',
    shop: 'Shop',
    footer: 'Cases by model',
  },
  de: {
    title: (m) => `${m.fullName} Hüllen, in Frankreich bedruckt`,
    h1: (m) => `${m.fullName} Hüllen`,
    description: (m, n) => `${n} Hüllen für das ${m.fullName}: Tiere, Blumen, Sprüche, Muster… Einzeln in Frankreich bedruckt, flach oder mit Relief.`,
    intro: (m, n) => `Alle unsere Hüllen für das ${m.fullName}, insgesamt ${n} Designs, ${m.sameAs ? `gezeigt am ${m.sameAs} mit identischen Maßen` : `fotografiert am ${m.label} selbst`}. Jede transparente Hülle ist für dieses Modell geformt und wird einzeln in unserem Atelier in Frankreich bedruckt, flach oder mit Relief.`,
    count: (n) => `${n} ${n > 1 ? 'Hüllen' : 'Hülle'}`,
    from: (p) => `Ab ${p}`,
    faqTitle: 'Häufige Fragen',
    faq: (m) => [
      { q: `Passen diese Hüllen auf mein ${m.label}?`, a: `Ja: Alle Hüllen auf dieser Seite sind für das ${m.fullName} geformt, und nur dafür. Prüfe vor der Bestellung den genauen Namen deines Handys unter ${m.brand === 'apple' ? 'Einstellungen, Allgemein, Info' : 'Einstellungen, Telefoninfo'}.` },
      { q: 'Was ist der Unterschied zwischen flachem Druck und Relief?', a: 'Beim flachen Druck liegt die Farbe bündig auf der Hülle: glatte Oberfläche, kräftige Farben. Beim Relief wird die Farbe in mehreren Schichten aufgetragen, das Motiv ist fühlbar.' },
      { q: 'Wie lange dauert die Lieferung?', a: 'Jede Hülle wird auf Bestellung bedruckt und innerhalb von 1 bis 2 Werktagen verschickt. Die Lieferzeit hängt von deinem Land ab.' },
    ],
    otherModels: 'Weitere Modelle',
    home: 'Startseite',
    shop: 'Shop',
    footer: 'Hüllen nach Modell',
  },
};
