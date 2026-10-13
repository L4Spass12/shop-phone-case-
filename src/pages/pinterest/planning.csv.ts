// Import groupé Pinterest (Création d'Épingles en masse > fichier .csv) :
// les épingles déjà dues partent tout de suite, les suivantes sont programmées
// sur CSV_DAYS jours. À réimporter quand le planning arrive à son terme.
import type { APIRoute } from 'astro';
import { CSV_DAYS, duePins } from '../../lib/pinterest';

// Noms exacts des tableaux créés sur le compte Pinterest Moroji.
const NAMES: Record<string, string> = {
  'coques-animaux': 'Coques Animaux',
  'coques-romantique': 'Coques Romantiques',
  'coques-kawaii': 'Coques Kawaii',
  'coques-fleurs': 'Coques Fleurs',
  'coques-paysages': 'Coques Paysages',
  'coques-motifs': 'Coques Motifs',
  'coques-auto': 'Coques Auto',
  'coques-citations': 'Coques Citations',
};

const c = (v: string) => `"${v.replace(/"/g, '""')}"`;

export const GET: APIRoute = async () => {
  const now = new Date();
  const rows = (await duePins(now, CSV_DAYS)).map((p) => [
    p.title.slice(0, 100),
    p.image,
    NAMES[p.board] ?? '',
    '',
    p.description.slice(0, 500),
    p.link,
    p.date.getTime() > now.getTime() ? p.date.toISOString().slice(0, 19) : '',
    '',
  ].map(c).join(','));
  const head = 'Title,Media URL,Pinterest board,Thumbnail,Description,Link,Publish date,Keywords';
  return new Response([head, ...rows].join('\n') + '\n', { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
