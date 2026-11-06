// Délai d'expédition exceptionnel (novembre 2026 : réassort des encres de
// l'imprimante). Même réglage que le widget de paiement
// (seamless-cart-stripe, src/lib/shipping-notice.ts) : changer les deux
// ensemble. null = délais normaux. Passé `deliveryTo`, les fiches produit
// reviennent d'elles-mêmes au délai habituel (contrôle fait dans le navigateur).
export const SHIPPING_NOTICE: { shipAround: string; deliveryFrom: string; deliveryTo: string } | null = {
  shipAround: '2026-11-20',
  deliveryFrom: '2026-11-22',
  deliveryTo: '2026-11-25',
};
