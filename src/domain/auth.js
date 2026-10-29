// Sign-in for accounts v1: email code and Google. The session lives in an HttpOnly cookie
// the page never sees; this module only calls the routes and updates the store.
// Off unless VITE_MILO_ACCOUNTS=true. Contract: docs/accounts-api.md. Never logs bodies.
import { store } from './store.js';
import { accountsEnabled, refreshAccount } from './account-api.js';
import { readSeat } from './network-adapter.js';
import { readSoloSeat } from './solo.js';

export const googleClientId = () => import.meta.env?.VITE_GOOGLE_CLIENT_ID || '';

async function send(method, path, body) {
  try {
    const res = await fetch(path, { method, credentials: 'same-origin',
      headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, data } : { ok: false, status: res.status, code: typeof data.error === 'string' ? data.error : 'unavailable' };
  } catch { return { ok: false, status: 0, code: 'offline' }; }
}

export const signedIn = (state = store.getState()) => accountsEnabled() && Boolean(state.account?.me);

export const startEmail = (email) => send('POST', '/api/auth/email/start', { email });

// After any sign-in: hand this phone's seats to the account, then load You and Nights.
async function afterSignIn(sessionId) {
  const seats = [readSeat(), readSoloSeat()].filter(Boolean).map(s => ({ plan_id: s.planId, seat_key: s.seatKey }));
  const claim = await send('POST', '/api/me/claim', { seats });
  await refreshAccount(store);
  const me = (claim.ok && claim.data.account) || store.getState().account?.me;
  if (me) store.setSessionUser(sessionId, { email: me.email, loggedIn: true });
  return { ok: Boolean(me), account: me || null };
}

export async function verifyEmail(sessionId, email, code) {
  const r = await send('POST', '/api/auth/email/verify', { email, code });
  return r.ok ? afterSignIn(sessionId) : r;
}

export async function verifyEmailLink(sessionId, token) {
  const r = await send('POST', '/api/auth/email/link', { token });
  return r.ok ? afterSignIn(sessionId) : r;
}

export async function googleSignIn(sessionId, credential) {
  const r = await send('POST', '/api/auth/google', { credential });
  return r.ok ? afterSignIn(sessionId) : r;
}

export async function setAccountName(name) {
  const r = await send('PATCH', '/api/me', { name });
  if (r.ok) await refreshAccount(store);
  return r;
}

export async function signOut(sessionId) {
  const result = await send('POST', '/api/auth/logout');
  if (!result.ok) return result;
  store.setSessionUser(sessionId, null);
  store.setAccount({ status: 'signed_out', me: null, people: [], nights: [] });
  return result;
}

// Loads Google's sign-in script once, only when a client id is configured.
let gis = null;
export function loadGoogle() {
  if (!googleClientId()) return Promise.resolve(null);
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  gis ||= new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve(window.google?.accounts?.id ? window.google : null);
    script.onerror = () => { gis = null; resolve(null); };
    document.head.appendChild(script);
  });
  return gis;
}

// Booking needs an account when accounts are on. Sends the person to sign in and back to
// this screen; returns true when it did, so the caller stops.
export function sendToSignInForBooking(sessionId) {
  if (!accountsEnabled() || signedIn()) return false;
  const live = store.getState()[sessionId === 'sneha' ? 'sessionB' : 'sessionA'] || {};
  store.updateSession(sessionId, { returnScreen: live.screen, originScreen: live.screen, loginReason: 'booking', screen: 'login' });
  return true;
}

// On app open and return: refresh the account, and while signed in hand any new seats on
// this phone (a plan made or joined since) to it.
export async function syncAccount() {
  if (!accountsEnabled()) return;
  const first = await refreshAccount(store);
  if (!first?.me) return;
  const seats = [readSeat(), readSoloSeat()].filter(Boolean).map(s => ({ plan_id: s.planId, seat_key: s.seatKey }));
  if (!seats.length) return;
  const claim = await send('POST', '/api/me/claim', { seats });
  if (claim.ok && claim.data.claimed > 0) await refreshAccount(store);
  }
