// Frontend prototype contract. Unsigned metadata is not authentication.
// Replace these helpers with a server-issued ID and validation when connected.
export const INVITE_LIFETIME_MS = 48 * 60 * 60 * 1000;

export function createInvite(now = Date.now()) {
  return btoa(JSON.stringify({ v: 1, createdAt: now, expiresAt: now + INVITE_LIFETIME_MS }))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function validateInvite(token, now = Date.now()) {
  try {
    if (!token || token.length > 512 || !/^[A-Za-z0-9_-]+$/.test(token)) return 'invalid';
    const value = JSON.parse(atob(token.replaceAll('-', '+').replaceAll('_', '/')));
    if (value.v !== 1 || !Number.isSafeInteger(value.createdAt) || !Number.isSafeInteger(value.expiresAt)
      || value.createdAt < 0 || value.createdAt > now + 5 * 60 * 1000
      || value.expiresAt - value.createdAt !== INVITE_LIFETIME_MS) return 'invalid';
    return now >= value.expiresAt ? 'expired' : 'valid';
  } catch { return 'invalid'; }
}

export function inviteFromParams(params) {
  if (!params.has('invite')) return null; // Keep existing prototype/demo routes usable.
  if (params.getAll('invite').length !== 1 || params.get('as') !== 'sneha' || params.getAll('as').length !== 1) return 'invalid';
  return validateInvite(params.get('invite'));
}

export function renderInviteError(reason) {
  const expired = reason === 'expired';
  return `<section class="milo-invite-error">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-invite-error-content">
      <div class="milo-invite-seal" aria-hidden="true">m.</div>
      <h1 class="milo-headline">${expired ? 'This invite has expired.' : "This invite isn't quite right."}</h1>
      <p class="milo-body-text">Ask your date to send a fresh invite link.</p>
      <p class="milo-invite-error-note">${expired ? 'Invite links last 48 hours.' : 'The link may be incomplete or damaged.'}</p>
    </div>
  </section>`;
}
