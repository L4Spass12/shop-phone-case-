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
export type Style = 'mode' | 'contemporaine' | 'sans';

export const STYLES: Record<Style, string> = {
  mode: 'Serifs de mode',
  contemporaine: 'Serifs contemporaines',
  sans: 'Sans empattement',
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
  // ─── Serifs de mode : contraste marqué, l'esprit couverture de magazine.
  { id: 'playfair',   style: 'mode', famille: 'Playfair Display', poids: 700, italique: true,  ko: 45, note: "Celle que le thème réclame depuis le début sans jamais l'avoir eue." },
  { id: 'bodoni',     style: 'mode', famille: 'Bodoni Moda',      poids: 700, italique: true,  ko: 31, note: 'Le contraste maximal. Très mode, un peu froide.' },
  { id: 'gloock',     style: 'mode', famille: 'Gloock',           poids: 400, italique: false, ko: 26, note: 'Serif de titrage large et affirmée, taillée pour les grands mots.' },
  { id: 'cormorant',  style: 'mode', famille: 'Cormorant Garamond', poids: 700, italique: true, ko: 44, note: 'Fine et haute, très près du logotype calligraphique.' },
  { id: 'marcellus',  style: 'mode', famille: 'Marcellus',        poids: 400, italique: false, ko: 14, note: 'Romaine classique, calme. Le sérieux sans la raideur.' },
  { id: 'abril',      style: 'mode', famille: 'Abril Fatface',    poids: 400, italique: false, ko: 13, note: 'Grasse et assumée. Beaucoup de caractère, peu de discrétion.' },

  // ─── Serifs contemporaines : le même registre, en plus actuel.
  { id: 'fraunces',   style: 'contemporaine', famille: 'Fraunces',         poids: 600, italique: true, ko: 40, note: 'Serif un peu insolente, celle des marques récentes.' },
  { id: 'instrument', style: 'contemporaine', famille: 'Instrument Serif', poids: 400, italique: true, ko: 42, note: 'Fine et haute, très éditoriale. Élégante sans être sage.' },
  { id: 'dmserif',    style: 'contemporaine', famille: 'DM Serif Display', poids: 400, italique: true, ko: 48, note: 'Serif de titrage lisible et chaleureuse.' },
  { id: 'bricolage',  style: 'contemporaine', famille: 'Bricolage Grotesque', poids: 700, italique: false, ko: 22, note: 'Ni tout à fait serif ni tout à fait linéale. Singulière, très 2026.' },

  // ─── Sans empattement : le parti de la sobriété, ou de la cohérence avec
  //     la bannière, qui est déjà composée en Poppins.
  { id: 'poppins',    style: 'sans', famille: 'Poppins',    poids: 700, italique: true,  ko: 16, note: 'La même que la bannière : tout le site parlerait d\u2019une seule voix.' },
  { id: 'syne',       style: 'sans', famille: 'Syne',       poids: 700, italique: false, ko: 14, note: 'Géométrique aux formes inattendues. Un parti pris de studio.' },
  { id: 'outfit',     style: 'sans', famille: 'Outfit',     poids: 700, italique: false, ko: 14, note: 'Géométrique nette et ronde, cousine sobre de Poppins.' },
  { id: 'montserrat', style: 'sans', famille: 'Montserrat', poids: 700, italique: true,  ko: 38, note: 'Neutre et sûre, sans relief particulier.' },
  { id: 'oswald',     style: 'sans', famille: 'Oswald',     poids: 600, italique: false, ko: 12, note: 'Condensée et haute. Gagne de la place, donne un ton sportif.' },
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
