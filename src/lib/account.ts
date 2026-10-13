/**
 * Compte client : connexion par code (reçu par e-mail) et lecture des commandes.
 *
 * Repris de Jellyxia, à une différence près : le code n'est pas envoyé par
 * Supabase (son modèle d'e-mail est commun à toutes les boutiques) mais par le
 * worker, sous la marque Moroji (POST /api/public/account-code). Le code est
 * ensuite vérifié directement auprès de Supabase, et les commandes lues via le
 * worker, qui contrôle le jeton et cloisonne par boutique et par adresse.
 *
 * Pas de `@supabase/supabase-js` : ~40 Ko compressés pour trois appels HTTP.
 * Aucun mot de passe : posséder la boîte mail EST la preuve d'identité. Les
 * commandes passées avant la création du compte apparaissent donc aussi.
 */

const STORE_KEY = 'moroji-session';

export type Session = { access_token: string; refresh_token: string; expires_at: number; email: string };

export type Order = {
  reference: string;
  placed_at: string;
  state: 'pending_payment' | 'confirmed' | 'preparing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled';
  shipped_at: string | null;
  delivered_at: string | null;
  carrier_updated_at: string | null;
  eta: { from: string; to: string } | null;
  total: { amount_cents: number; currency: string };
  items: Array<{ name: string; quantity: number; image: string | null }>;
  shipping: { name: string; address: string; city: string; zip: string; country: string };
  relay: { name: string; address: string; zip: string; city: string } | null;
  tracking: { number: string; url: string } | null;
};

export type Config = { supabaseUrl: string; supabaseKey: string; workerUrl: string; shopId: string; lang: string };

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s?.refresh_token ? s : null;
  } catch {
    return null;
  }
}

export function writeSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(STORE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORE_KEY);
  } catch {
    /* navigation privée, stockage bloqué : on reste simplement déconnecté */
  }
}

function toSession(payload: any): Session | null {
  if (!payload?.access_token || !payload?.refresh_token) return null;
  const ttl = Number(payload.expires_in) || 3600;
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Date.now() + (ttl - 60) * 1000,
    email: payload.user?.email ?? '',
  };
}

/** Lien « un clic » de l'e-mail : #email=…&code=… dans le FRAGMENT (jamais
 *  envoyé au serveur). On le lit puis on l'efface de la barre d'adresse. */
export function consumeUrlCode(): { email: string; code: string } | null {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;
  const params = new URLSearchParams(hash.slice(1));
  const email = params.get('email') || '';
  const code = params.get('code') || '';
  if (!email && !code) return null;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  return email && code ? { email, code } : null;
}

/** Demande au worker d'envoyer le code (e-mail aux couleurs de la boutique). */
export async function sendCode(cfg: Config, email: string): Promise<void> {
  const res = await fetch(`${cfg.workerUrl}/api/public/account-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_id: cfg.shopId, email, lang: cfg.lang }),
  });
  if (!res.ok) throw new Error(`code_failed:${res.status}`);
}

/** Vérifie le code auprès de Supabase. `email` couvre les comptes existants,
 *  `signup` le tout premier passage (adresse jamais vue). */
export async function verifyCode(cfg: Config, email: string, code: string): Promise<Session | null> {
  const token = code.replace(/\D/g, '');
  if (token.length < 6 || token.length > 8) return null;
  for (const type of ['email', 'magiclink', 'signup'] as const) {
    const res = await fetch(`${cfg.supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.supabaseKey },
      body: JSON.stringify({ email, token, type }),
    });
    if (res.ok) return toSession(await res.json());
  }
  return null;
}

async function refresh(cfg: Config, session: Session): Promise<Session | null> {
  const res = await fetch(`${cfg.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: cfg.supabaseKey },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) return null;
  return toSession(await res.json());
}

/** Session utilisable (renouvelée si besoin) ; `null` = il faut se reconnecter. */
export async function ensureFresh(cfg: Config, session: Session): Promise<Session | null> {
  if (session.access_token && session.expires_at > Date.now()) return session;
  const next = await refresh(cfg, session);
  writeSession(next ? { ...next, email: next.email || session.email } : null);
  return next;
}

export async function signOut(cfg: Config, session: Session | null) {
  if (session?.access_token) {
    try {
      await fetch(`${cfg.supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: cfg.supabaseKey, Authorization: `Bearer ${session.access_token}` },
      });
    } catch {
      /* hors ligne : nettoyage local seulement */
    }
  }
  writeSession(null);
}

export type OrdersResult = { ok: true; email: string; orders: Order[] } | { ok: false; reason: 'unauthorized' | 'error' };

export async function fetchOrders(cfg: Config, session: Session): Promise<OrdersResult> {
  const res = await fetch(`${cfg.workerUrl}/api/public/account-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ shop_id: cfg.shopId }),
  });
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (!res.ok) return { ok: false, reason: 'error' };
  const body = await res.json().catch(() => null);
  if (!body?.ok) return { ok: false, reason: 'error' };
  return { ok: true, email: body.email, orders: body.orders ?? [] };
}
