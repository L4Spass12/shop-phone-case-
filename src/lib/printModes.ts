// Rendus d'impression proposés pour une coque du catalogue : à plat et/ou en
// relief. Le relief coûte un supplément (site.config.mjs →
// shop.catalogueReliefSurchargeCents). Une fiche qui ne propose QUE le relief
// s'affiche donc, dans les listes, à son prix relief.
import siteConfig from '../../site.config.mjs';

export type PrintMode = 'flat' | 'relief';

export const reliefSurcharge = (siteConfig.shop?.catalogueReliefSurchargeCents ?? 0) / 100;

type Priced = {
  price: number;
  priceRange?: { min: number; max: number };
  printModes?: PrintMode[];
};

/** Rendu coché d'entrée : le relief quand il est proposé et facturé à part. */
export function defaultPrintMode(modes: PrintMode[] = ['flat', 'relief']): PrintMode {
  if (!modes.includes('flat')) return 'relief';
  if (!modes.includes('relief')) return 'flat';
  return reliefSurcharge > 0 ? 'relief' : 'flat';
}

/** Supplément du rendu le moins cher proposé (0 si le rendu à plat existe). */
export function minModeExtra(d: Priced): number {
  return (d.printModes ?? ['flat', 'relief']).includes('flat') ? 0 : reliefSurcharge;
}

/** Prix « à partir de » pour les listes produits. */
export function listPrice(d: Priced): number {
  return (d.priceRange?.min ?? d.price) + minModeExtra(d);
}
