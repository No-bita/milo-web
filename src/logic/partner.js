// Who the user is planning with. Names are typed by the initiator. Until then, "your person".
export function isInvited(state) {
  const shared = state.shared || {};
  return Boolean(shared.invitePrepared || shared.inviteSent || shared.confirmedNightId);
}

export const FALLBACK_PARTNER = 'your person';
const FALLBACK_INVITER = 'your date';

// The other person's name as the given seat should see it.
export function partnerLabel(state, sessionId = 'aarav') {
  if (sessionId === 'sneha') return state.sessionB?.partnerName || FALLBACK_INVITER;
  return isInvited(state) ? (state.sessionA.partnerName || FALLBACK_PARTNER) : FALLBACK_PARTNER;
}

export const hasPartnerName = (label) => label !== FALLBACK_PARTNER && label !== FALLBACK_INVITER;

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Safe for HTML, capitalised when the name opens a sentence ("Your person").
export const sentenceName = (label) => escapeHtml(label.charAt(0).toUpperCase() + label.slice(1));

// First letter of a typed name for the monogram circles; a neutral dot until a name exists.
export const initialOf = (name) => {
  const first = String(name || '').trim().charAt(0);
  return first ? escapeHtml(first.toUpperCase()) : '\u00b7';
};

// [initiator, partner] monograms as the given seat sees them.
export function monograms(state, sessionId = 'aarav') {
  if (sessionId === 'sneha') return [initialOf(state.sessionB?.partnerName), initialOf(state.sessionB?.name)];
  return [initialOf(state.sessionA?.name), initialOf(isInvited(state) ? state.sessionA?.partnerName : '')];
}
