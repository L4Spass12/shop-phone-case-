/**
 * Bibliothèque de polices de TITRAGE à essayer, et le commutateur qui permet
 * de les voir sur le vrai site sans rien y changer.
 *
 * Pourquoi cet outil existe : `--font-display` habille beaucoup plus que les
 * titres. Elle tient aussi les libellés des boutons, les prix et les titres du
 * pied de page (cf. global.css). Changer de police à l'aveugle dans le fichier
 * de style, c'est donc modifier la moitié du caractère du site d'un coup,
 * puis recharger, puis se souvenir de ce qu'on avait avant.
 *
 * Deux façons de s'en servir :
 *
 *  · À L'ESSAI, sans rien casser. On ajoute `?typo=<id>` à n'importe quelle
 *    adresse du site : la police s'applique et SUIT la navigation, page après
 *    page, jusqu'à la fermeture de l'onglet. `?typo=off` revient à l'état
 *    normal. Rien n'est modifié sur le site, rien n'est visible pour les
 *    visiteurs, et aucun fichier de police n'est téléchargé tant que personne
 *    ne demande d'essai. La page /typo liste les candidates.
 *
 *  · UNE FOIS DÉCIDÉ. On écrit l'identifiant dans `titreFont` de
 *    site.config.mjs. La police devient celle du site, chargée proprement
 *    comme les autres, et cet outil n'a plus de rôle.
 *
 * Les fichiers viennent de @fontsource, jeu latin, et vivent dans
 * public/fonts/titres/. Nommage : <id>-<graisse>[-italic].woff2
 */

/** Regroupement du menu : trois directions, pas quinze noms en vrac. */
export type Style = 'grotesque' | 'geometrique' | 'serif' | 'affirmee';

export const STYLES: Record<Style, string> = {
  grotesque: 'Grotesques contemporaines',
  geometrique: 'Géométriques',
  serif: 'Serifs contemporaines',
  affirmee: 'Affirmées',
};

export type Candidate = {
  id: string;
  style: Style;
  /** Nom de famille CSS, celui de la fonte réelle. */
  famille: string;
  /** Graisse du fichier fourni. */
  poids: number;
  /** Une italique existe-t-elle ? Les boutons du thème sont en italique : les
   *  polices qui n'en ont pas la font imiter par le navigateur, ce qui se
   *  voit. C'est un critère de choix, pas un détail. */
  italique: boolean;
  /** Ce que la police apporte, en une ligne, pour s'y retrouver. */
  note: string;
  /** Poids total des fichiers, en Ko. */
  ko: number;
};

export const CANDIDATES: Candidate[] = [
  // ─── Grotesques contemporaines : linéales à l'ancienne, mais redessinées
  //     récemment. Du caractère sans effet de manche, c'est le registre des
  //     marques de design d'aujourd'hui.
  { id: 'spacegrotesk', style: 'grotesque', famille: 'Space Grotesk',       poids: 700, italique: false, ko: 13, note: 'Terminaisons coupées, formes un peu sèches. La favorite des studios depuis quelques années.' },
  { id: 'schibsted',    style: 'grotesque', famille: 'Schibsted Grotesk',   poids: 800, italique: true,  ko: 50, note: 'Nette et dense, taillée pour la presse. Moderne sans chercher à se faire remarquer.' },
  { id: 'epilogue',     style: 'grotesque', famille: 'Epilogue',            poids: 700, italique: true,  ko: 29, note: 'Grotesque au dessin nerveux, un peu resserré. Parle fort en petit.' },
  { id: 'bricolage',    style: 'grotesque', famille: 'Bricolage Grotesque', poids: 700, italique: false, ko: 22, note: 'Volontairement irrégulière. Ni tout à fait serif ni tout à fait linéale.' },

  // ─── Géométriques : cercles et lignes droites. Le registre de la bannière,
  //     qui est déjà composée en Poppins.
  { id: 'poppins',   style: 'geometrique', famille: 'Poppins',           poids: 700, italique: true,  ko: 16, note: 'La même que la bannière : tout le site parlerait d\u2019une seule voix.' },
  { id: 'outfit',    style: 'geometrique', famille: 'Outfit',            poids: 700, italique: false, ko: 14, note: 'Cousine sobre de Poppins, un peu plus resserrée. Très propre.' },
  { id: 'urbanist',  style: 'geometrique', famille: 'Urbanist',          poids: 800, italique: true,  ko: 24, note: 'Géométrique basse et large. Douce, presque ronde.' },
  { id: 'jakarta',   style: 'geometrique', famille: 'Plus Jakarta Sans', poids: 800, italique: true,  ko: 24, note: 'Chaleureuse et lisible. Le compromis le plus sûr de la liste.' },
  { id: 'figtree',   style: 'geometrique', famille: 'Figtree',           poids: 800, italique: true,  ko: 23, note: 'Ronde et amicale, un peu plus tendre que Poppins.' },
  { id: 'sora',      style: 'geometrique', famille: 'Sora',              poids: 700, italique: false, ko: 15, note: 'Anguleuse et technique. Donne un ton produit plutôt que boutique.' },
  { id: 'montserrat',style: 'geometrique', famille: 'Montserrat',        poids: 700, italique: true,  ko: 38, note: 'Neutre et sûre, sans relief particulier.' },

  // ─── Serifs contemporaines : des empattements, mais dessinés aujourd'hui.
  { id: 'fraunces',   style: 'serif', famille: 'Fraunces',         poids: 600, italique: true,  ko: 40, note: 'Serif un peu insolente, aux formes molles. Celle des marques récentes.' },
  { id: 'instrument', style: 'serif', famille: 'Instrument Serif', poids: 400, italique: true,  ko: 42, note: 'Fine et haute, très éditoriale. Élégante sans être sage.' },
  { id: 'newsreader', style: 'serif', famille: 'Newsreader',       poids: 600, italique: true,  ko: 49, note: 'Serif de lecture, chaleureuse. Rassure plus qu\u2019elle n\u2019impressionne.' },
  { id: 'youngserif', style: 'serif', famille: 'Young Serif',      poids: 400, italique: false, ko: 26, note: 'Empattements épais et courts. Serif, mais franchement contemporaine.' },
  { id: 'dmserif',    style: 'serif', famille: 'DM Serif Display', poids: 400, italique: true,  ko: 48, note: 'Serif de titrage lisible et chaleureuse.' },

  // ─── Affirmées : elles prennent toute la place. À réserver aux titres
  //     courts, ce qui est justement le cas ici.
  { id: 'unbounded', style: 'affirmee', famille: 'Unbounded', poids: 700, italique: false, ko: 21, note: 'Large, ronde, impossible à ignorer. Très forte personnalité.' },
  { id: 'syne',      style: 'affirmee', famille: 'Syne',      poids: 700, italique: false, ko: 14, note: 'Formes inattendues, presque bizarres. Un parti pris de studio.' },
  { id: 'oswald',    style: 'affirmee', famille: 'Oswald',    poids: 600, italique: false, ko: 12, note: 'Condensée et haute. Gagne de la place, donne un ton sportif.' },
];



export function candidate(id: string | undefined): Candidate | undefined {
  return id ? CANDIDATES.find((c) => c.id === id) : undefined;
}

/** Chemin du fichier d'une candidate. */
export function fichier(c: Candidate, style: 'normal' | 'italic'): string {
  return `/fonts/titres/${c.id}-${c.poids}${style === 'italic' ? '-italic' : ''}.woff2`;
}

/** Les deux @font-face d'une candidate, prêts à être posés dans une balise style. */
export function faceCss(c: Candidate): string {
  const face = (style: 'normal' | 'italic') =>
    `@font-face{font-family:'${c.famille}';font-style:${style};font-weight:${c.poids};` +
    `font-display:swap;src:url('${fichier(c, style)}') format('woff2')}`;
  return face('normal') + (c.italique ? face('italic') : '');
}

/** Table minimale passée au navigateur pour l'essai : id, famille, graisse, italique. */
export const TABLE_ESSAI = Object.fromEntries(
  CANDIDATES.map((c) => [c.id, [c.famille, c.poids, c.italique ? 1 : 0]])
);
