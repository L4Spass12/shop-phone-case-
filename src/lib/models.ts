// Pages « coques par modèle » (/coques/<id>/) : les modèles viennent des
// photos générées par l'atelier (src/data/variants.json → _models), donc une
// page n'existe que pour un modèle dont on a les photos de toutes les coques.
import variants from '../data/variants.json';
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
};

export const PHONE_MODELS: PhoneModel[] = Object.entries(V._models).map(([id, label]) => {
  const samsung = id.startsWith('galaxy');
  return { id, label, fullName: samsung ? `Samsung ${label}` : label, brand: samsung ? 'samsung' : 'apple' };
});

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
  hubTitle: string;
  hubH1: string;
  hubDescription: string;
  hubIntro: string;
  hubLink: string;
  otherModels: string;
  home: string;
  hub: string;
}> = {
  fr: {
    title: (m) => `Coques ${m.fullName} imprimées en France`,
    h1: (m) => `Coques ${m.fullName}`,
    description: (m, n) => `${n} coques pour ${m.fullName} : animaux, fleurs, citations, motifs… Imprimées à l'unité en France, à plat ou en relief. Livraison suivie.`,
    intro: (m, n) => `Toutes nos coques pour ${m.fullName}, soit ${n} designs, photographiées sur le ${m.label} lui-même. Chaque coque transparente est moulée pour ce modèle et imprimée à l'unité dans notre atelier en France, à plat ou en relief.`,
    count: (n) => `${n} coque${n > 1 ? 's' : ''}`,
    from: (p) => `À partir de ${p}`,
    faqTitle: 'Questions fréquentes',
    faq: (m) => [
      { q: `Ces coques sont-elles bien compatibles avec mon ${m.label} ?`, a: `Oui : toutes les coques de cette page sont moulées pour le ${m.fullName}, et uniquement lui. Vérifiez le nom exact de votre téléphone dans ${m.brand === 'apple' ? 'Réglages, Général, Informations' : 'Paramètres, À propos du téléphone'} avant de commander.` },
      { q: 'Quelle différence entre l’impression à plat et en relief ?', a: 'À plat, l’encre affleure la coque : surface lisse et couleurs franches. En relief, l’encre est déposée en plusieurs couches : le motif se sent sous le doigt.' },
      { q: 'Quel est le délai de livraison ?', a: 'Chaque coque est imprimée à la commande puis expédiée sous 1 à 2 jours ouvrés. Comptez 4 à 7 jours en point relais en France.' },
    ],
    hubTitle: 'Coques par modèle : iPhone et Samsung Galaxy',
    hubH1: 'Coques par modèle',
    hubDescription: 'Choisissez votre téléphone et découvrez toutes nos coques pour iPhone 13 à 17 Pro Max et Samsung Galaxy S24, S25, S26, A36 et A56, imprimées en France.',
    hubIntro: 'Choisissez votre téléphone : vous verrez chaque coque photographiée sur votre modèle.',
    hubLink: 'Voir les coques par modèle',
    otherModels: 'Autres modèles',
    home: 'Accueil',
    hub: 'Coques par modèle',
  },
  en: {
    title: (m) => `${m.fullName} cases printed in France`,
    h1: (m) => `${m.fullName} cases`,
    description: (m, n) => `${n} cases for the ${m.fullName}: animals, flowers, quotes, patterns… Printed one at a time in France, flat or raised. Tracked shipping.`,
    intro: (m, n) => `All our cases for the ${m.fullName}, ${n} designs in all, photographed on the ${m.label} itself. Each clear case is moulded for this model and printed one at a time in our workshop in France, flat or raised.`,
    count: (n) => `${n} case${n > 1 ? 's' : ''}`,
    from: (p) => `From ${p}`,
    faqTitle: 'Frequently asked questions',
    faq: (m) => [
      { q: `Will these cases fit my ${m.label}?`, a: `Yes: every case on this page is moulded for the ${m.fullName}, and only for it. Check the exact name of your phone in ${m.brand === 'apple' ? 'Settings, General, About' : 'Settings, About phone'} before ordering.` },
      { q: 'What is the difference between flat and raised printing?', a: 'Flat printing sits flush with the case: smooth surface, bold colours. Raised printing builds the ink up in several layers, so you can feel the design under your finger.' },
      { q: 'How long is delivery?', a: 'Each case is printed to order and shipped within 1 to 2 working days. Delivery times depend on your country.' },
    ],
    hubTitle: 'Cases by model: iPhone and Samsung Galaxy',
    hubH1: 'Cases by model',
    hubDescription: 'Pick your phone and browse all our cases for iPhone 13 to 17 Pro Max and Samsung Galaxy S24, S25, S26, A36 and A56, printed in France.',
    hubIntro: 'Pick your phone: every case is shown on your exact model.',
    hubLink: 'Browse cases by model',
    otherModels: 'Other models',
    home: 'Home',
    hub: 'Cases by model',
  },
  de: {
    title: (m) => `${m.fullName} Hüllen, in Frankreich bedruckt`,
    h1: (m) => `${m.fullName} Hüllen`,
    description: (m, n) => `${n} Hüllen für das ${m.fullName}: Tiere, Blumen, Sprüche, Muster… Einzeln in Frankreich bedruckt, flach oder mit Relief.`,
    intro: (m, n) => `Alle unsere Hüllen für das ${m.fullName}, insgesamt ${n} Designs, fotografiert am ${m.label} selbst. Jede transparente Hülle ist für dieses Modell geformt und wird einzeln in unserem Atelier in Frankreich bedruckt, flach oder mit Relief.`,
    count: (n) => `${n} ${n > 1 ? 'Hüllen' : 'Hülle'}`,
    from: (p) => `Ab ${p}`,
    faqTitle: 'Häufige Fragen',
    faq: (m) => [
      { q: `Passen diese Hüllen auf mein ${m.label}?`, a: `Ja: Alle Hüllen auf dieser Seite sind für das ${m.fullName} geformt, und nur dafür. Prüfe vor der Bestellung den genauen Namen deines Handys unter ${m.brand === 'apple' ? 'Einstellungen, Allgemein, Info' : 'Einstellungen, Telefoninfo'}.` },
      { q: 'Was ist der Unterschied zwischen flachem Druck und Relief?', a: 'Beim flachen Druck liegt die Farbe bündig auf der Hülle: glatte Oberfläche, kräftige Farben. Beim Relief wird die Farbe in mehreren Schichten aufgetragen, das Motiv ist fühlbar.' },
      { q: 'Wie lange dauert die Lieferung?', a: 'Jede Hülle wird auf Bestellung bedruckt und innerhalb von 1 bis 2 Werktagen verschickt. Die Lieferzeit hängt von deinem Land ab.' },
    ],
    hubTitle: 'Hüllen nach Modell: iPhone und Samsung Galaxy',
    hubH1: 'Hüllen nach Modell',
    hubDescription: 'Wähle dein Handy und entdecke alle unsere Hüllen für iPhone 13 bis 17 Pro Max und Samsung Galaxy S24, S25, S26, A36 und A56, in Frankreich bedruckt.',
    hubIntro: 'Wähle dein Handy: Jede Hülle wird an deinem Modell gezeigt.',
    hubLink: 'Hüllen nach Modell ansehen',
    otherModels: 'Weitere Modelle',
    home: 'Startseite',
    hub: 'Hüllen nach Modell',
  },
};
