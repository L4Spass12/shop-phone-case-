// Import groupé Pinterest (Création d'Épingles en masse > fichier .csv).
// Le planning est découpé en périodes fixes de CSV_DAYS jours (après un
// 1er import de FIRST_IMPORT_DAYS jours) : le fichier ne contient QUE la période en cours, donc deux
// imports successifs ne se chevauchent jamais. Dans la période, ce qui est
// déjà passé part tout de suite, le reste est programmé.
import type { APIRoute } from 'astro';
import siteConfig from '../../../site.config.mjs';
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

const FIRST_IMPORT_DAYS = 25;

const c = (v: string) => `"${v.replace(/"/g, '""')}"`;

export const GET: APIRoute = async () => {
  const now = new Date();
  const start = new Date(`${(siteConfig as any).pinterest?.startDate}T06:00:00Z`).getTime();
  const span = CSV_DAYS * 86_400_000;
  // Le 1er import (13/10/2026) couvrait 25 jours ; les périodes suivantes
  // s'enchaînent à partir de là. Avant la 2e période, le fichier la propose
  // déjà (import à l'avance) ; ensuite, c'est la période en cours.
  const base = start + FIRST_IMPORT_DAYS * 86_400_000;
  const from = now.getTime() < base ? base : base + Math.floor((now.getTime() - base) / span) * span;
  const pins = (await duePins(now, Math.ceil((from + span - now.getTime()) / 86_400_000) + 1))
    .filter((p) => p.date.getTime() >= from && p.date.getTime() < from + span);
  const rows = pins.map((p) => [
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
