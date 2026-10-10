// Who the user is planning with. The name only shows once there is a real invite.
export function isInvited(state) {
  const shared = state.shared || {};
  return Boolean(shared.invitePrepared || shared.inviteSent || shared.confirmedNightId);
}

export function partnerLabel(state, sessionId = 'aarav') {
  if (sessionId === 'sneha') return 'Aarav';
  return isInvited(state) ? (state.sessionA.partnerName || 'your person') : 'your person';
}
