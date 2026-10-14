// Modèles « Maillot de foot » du studio : un fond (généré par
// scripts/studio-jerseys.mjs) + le nom et le numéro du client.
//
// Règle : des COULEURS, jamais d'écusson, de logo, de sponsor ni de nom de
// club (marques déposées). Les sélections nationales sont nommées par le pays
// (couleurs nationales, sans emblème) ; les autres par leurs couleurs.
//
// colors : [fond, motif, (motif secondaire)] ; ink : couleur du nom et du
// numéro ; outline : contour du texte ('' = aucun).
export const JERSEYS = [
  // Sélections nationales
  { id: 'france', name: { fr: 'France', en: 'France', de: 'Frankreich' }, colors: ['#17255c', '#ffffff'], pattern: 'solid', trim: '#ffffff', ink: '#ffffff', outline: '#c8102e' },
  { id: 'espagne', name: { fr: 'Espagne', en: 'Spain', de: 'Spanien' }, colors: ['#c60b1e', '#ffc400'], pattern: 'solid', trim: '#ffc400', ink: '#ffc400', outline: '#7a0010' },
  { id: 'portugal', name: { fr: 'Portugal', en: 'Portugal', de: 'Portugal' }, colors: ['#9b1b30', '#0b6b3a'], pattern: 'sides', trim: '#e8c35a', ink: '#e8c35a', outline: '#3d0a12' },
  { id: 'italie', name: { fr: 'Italie', en: 'Italy', de: 'Italien' }, colors: ['#1f5fbf', '#ffffff'], pattern: 'solid', trim: '#ffffff', ink: '#ffffff', outline: '#0d2f66' },
  { id: 'bresil', name: { fr: 'Brésil', en: 'Brazil', de: 'Brasilien' }, colors: ['#ffd800', '#009440'], pattern: 'solid', trim: '#009440', ink: '#0b4fa0', outline: '#ffffff' },
  { id: 'argentine', name: { fr: 'Argentine', en: 'Argentina', de: 'Argentinien' }, colors: ['#ffffff', '#75aadb'], pattern: 'stripes', n: 7, trim: '#1b2a5c', ink: '#1b2a5c', outline: '#ffffff' },
  { id: 'allemagne', name: { fr: 'Allemagne', en: 'Germany', de: 'Deutschland' }, colors: ['#f4f4f4', '#111111', '#dd0000', '#ffce00'], pattern: 'chest', trim: '#111111', ink: '#111111', outline: '' },
  { id: 'angleterre', name: { fr: 'Angleterre', en: 'England', de: 'England' }, colors: ['#f6f6f6', '#1b2a5c'], pattern: 'solid', trim: '#1b2a5c', ink: '#1b2a5c', outline: '' },
  { id: 'pays-bas', name: { fr: 'Pays-Bas', en: 'Netherlands', de: 'Niederlande' }, colors: ['#f36c21', '#111111'], pattern: 'solid', trim: '#111111', ink: '#111111', outline: '' },
  { id: 'belgique', name: { fr: 'Belgique', en: 'Belgium', de: 'Belgien' }, colors: ['#c8102e', '#111111'], pattern: 'solid', trim: '#fdda24', ink: '#fdda24', outline: '#111111' },
  { id: 'maroc', name: { fr: 'Maroc', en: 'Morocco', de: 'Marokko' }, colors: ['#c1272d', '#006233'], pattern: 'solid', trim: '#006233', ink: '#ffffff', outline: '#006233' },
  { id: 'algerie', name: { fr: 'Algérie', en: 'Algeria', de: 'Algerien' }, colors: ['#ffffff', '#006233'], pattern: 'sides', trim: '#006233', ink: '#006233', outline: '' },
  // Couleurs de grands clubs, sans aucun emblème
  { id: 'bleu-nuit-bande-rouge', name: { fr: 'Bleu nuit, bande rouge', en: 'Navy, red band', de: 'Nachtblau, rotes Band' }, colors: ['#1a2350', '#ffffff', '#d4121e'], pattern: 'band', trim: '#d4121e', ink: '#ffffff', outline: '#1a2350' },
  { id: 'blanc', name: { fr: 'Blanc', en: 'White', de: 'Weiß' }, colors: ['#ffffff', '#c9a227'], pattern: 'solid', trim: '#c9a227', ink: '#1a1a1a', outline: '#c9a227' },
  { id: 'raye-bleu-grenat', name: { fr: 'Rayé bleu et grenat', en: 'Blue & garnet stripes', de: 'Blau-granat gestreift' }, colors: ['#a50044', '#004d98'], pattern: 'stripes', n: 7, trim: '#edbb00', ink: '#edbb00', outline: '#3a0018' },
  { id: 'rouge', name: { fr: 'Rouge', en: 'Red', de: 'Rot' }, colors: ['#d01012', '#ffffff'], pattern: 'solid', trim: '#ffffff', ink: '#ffffff', outline: '' },
  { id: 'bleu-ciel', name: { fr: 'Bleu ciel', en: 'Sky blue', de: 'Himmelblau' }, colors: ['#6cabdd', '#1c2c5b'], pattern: 'solid', trim: '#1c2c5b', ink: '#1c2c5b', outline: '#ffffff' },
  { id: 'raye-noir-blanc', name: { fr: 'Rayé noir et blanc', en: 'Black & white stripes', de: 'Schwarz-weiß gestreift' }, colors: ['#ffffff', '#111111'], pattern: 'stripes', n: 9, trim: '#111111', ink: '#ffffff', outline: '#111111' },
  { id: 'raye-rouge-noir', name: { fr: 'Rayé rouge et noir', en: 'Red & black stripes', de: 'Rot-schwarz gestreift' }, colors: ['#d10a11', '#111111'], pattern: 'stripes', n: 9, trim: '#111111', ink: '#ffffff', outline: '#111111' },
  { id: 'raye-bleu-noir', name: { fr: 'Rayé bleu et noir', en: 'Blue & black stripes', de: 'Blau-schwarz gestreift' }, colors: ['#0068b4', '#111111'], pattern: 'stripes', n: 9, trim: '#111111', ink: '#ffd34d', outline: '#111111' },
  { id: 'vert', name: { fr: 'Vert', en: 'Green', de: 'Grün' }, colors: ['#00843d', '#ffffff'], pattern: 'solid', trim: '#ffffff', ink: '#ffffff', outline: '' },
  { id: 'jaune-noir', name: { fr: 'Jaune et noir', en: 'Yellow & black', de: 'Gelb-schwarz' }, colors: ['#fde100', '#111111'], pattern: 'solid', trim: '#111111', ink: '#111111', outline: '' },
  { id: 'blanc-bleu-ciel', name: { fr: 'Blanc et bleu ciel', en: 'White & sky blue', de: 'Weiß-himmelblau' }, colors: ['#ffffff', '#2fa4e7'], pattern: 'sash', trim: '#2fa4e7', ink: '#0b2a4a', outline: '' },
];
