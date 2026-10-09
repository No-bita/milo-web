// Browser history records navigation only. Preferences, drafts and consent stay live.
const SESSION_KEYS = { aarav: 'sessionA', sneha: 'sessionB' };
const SCREENS = new Set(['s0', 's1', 'planning_path', 'planning_path_review', 's2', 's3', 's4_invite', 's4_waiting', 's5', 's6', 's7']);

export function journeyRoute(state, sessionId) {
  const session = state[SESSION_KEYS[sessionId]];
  const screen = session.screen === 'threshold' ? 's2' : session.screen;
  // Preparing an invite is one page; copying/sharing isn't another Back step.
  const route = { screen: screen === 's4_waiting' ? 's4_invite' : screen };
  if (screen === 's7') {
    route.activeNightId = session.activeNightId || null;
    route.soloTimingStep = session.planningMode === 'solo' ? session.soloTimingStep || null : null;
  }
  return route;
}

export function routePatch(route, state, sessionId) {
  if (!route || !SCREENS.has(route.screen)) return null;
  const patch = { screen: route.screen };
  if (route.screen === 's4_invite' && state.shared.invitePrepared) patch.screen = 's4_waiting';
  if (route.screen === 's7') {
    if (route.activeNightId) patch.activeNightId = route.activeNightId;
    if (state[SESSION_KEYS[sessionId]].planningMode === 'solo') patch.soloTimingStep = route.soloTimingStep || null;
  }
  return patch;
}

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function attachJourneyHistory(store, { sessionId, root, confirmPartnerBack, target = window }) {
  const history = target.history;
  const owner = `milo:${sessionId}`;
  let entries = [];
  let index = 0;
  let applying = false;
  let moving = false;
  let bouncing = false;
  let deckUndo = false;
  let browserGuard = false;
  let activeDialog = null;
  let disposed = false;
  const initial = journeyRoute(store.getState(), sessionId);
  const address = new URL(target.location.href);
  ['screen', 'golden', 'reset'].forEach(key => address.searchParams.delete(key));
  const journeyUrl = address.href;
  const stamp = entry => ({ ...history.state, miloJourney: { owner, ...entry } });
  // Start a fresh, bounded history at the current/resumed page. No fake exit trap.
  entries = [{ index: 0, kind: 'route', route: initial }];
  history.replaceState(stamp(entries[0]), '', journeyUrl);

  function push(kind, route) {
    entries = entries.slice(0, index + 1);
    const entry = { index: ++index, kind, route };
    entries.push(entry);
    history.pushState(stamp(entry), '', journeyUrl);
  }

  // A resumed/direct deck still has the arrow's first-card exit destination.
  if (initial.screen === 's2') {
    entries[0] = { index: 0, kind: 'route', route: { screen: sessionId === 'sneha' ? 's1' : 'planning_path' } };
    history.replaceState(stamp(entries[0]), '', journeyUrl);
    push('route', initial);
  }

  const stop = store.subscribe(state => {
    if (applying || disposed) return;
    const route = journeyRoute(state, sessionId);
    const current = entries[index];
    if (!current || equal(route, current.route)) return;
    // In-app Back and “see the other two” reuse their earlier history entry.
    const earlier = entries.slice(0, index).findLastIndex(entry => entry.kind === 'route' && equal(entry.route, route));
    if (earlier >= 0) {
      moving = true;
      history.go(earlier - index);
    } else {
      activeDialog = null;
      push('route', route);
    }
  });

  function closeDialog() {
    const dialog = activeDialog;
    activeDialog = null;
    if (!dialog?.open) return;
    const cancel = new Event('cancel', { cancelable: true });
    if (dialog.dispatchEvent(cancel)) dialog.close();
  }

  function onPop(event) {
    const entry = event.state?.miloJourney;
    if (!entry || entry.owner !== owner || !entries[entry.index] || disposed) return;
    if (deckUndo) {
      deckUndo = false;
      index = entry.index;
      // Use the arrow's cleanup + undo path, including cancelling an in-flight vote.
      root.querySelector(`#miloDeckUndo-${sessionId}`)?.click();
      return;
    }
    if (bouncing) {
      bouncing = false;
      index = entry.index;
      browserGuard = true;
      confirmPartnerBack();
      return;
    }
    const current = entries[index];
    const state = store.getState();
    if (!moving && current?.kind === 'route' && entry.index < index
      && state[SESSION_KEYS[sessionId]].screen === 's2'
      && state[SESSION_KEYS[sessionId]].currentCardIndex > 0) {
      deckUndo = true;
      history.go(index - entry.index);
      return;
    }
    if (!moving && current?.kind === 'route' && entry.index < index
      && sessionId === 'sneha' && state.sessionB.screen === 's5'
      && ['s0', 's1', 's2', 's3'].includes(entry.route.screen)) {
      // Browser Back keeps the same review-before-restarting guard as the arrow.
      bouncing = true;
      history.go(index - entry.index);
      return;
    }
    moving = false;
    applying = true;
    if (current?.kind === 'dialog' && entry.kind === 'route') closeDialog();
    index = entry.index;
    if (entry.kind === 'dialog') {
      // Closed overlays are not replayed by Forward. Keep the live page instead.
      history.replaceState(stamp({ ...entry, kind: 'route' }), '', journeyUrl);
      entries[index] = { ...entry, kind: 'route' };
    }
    const patch = routePatch(entry.route, state, sessionId);
    if (patch && !equal(journeyRoute(state, sessionId), entry.route)) store.updateSession(sessionId, patch);
    applying = false;
  }
  target.addEventListener('popstate', onPop);

  // Native dialog dismissal is a navigation layer, not a plan mutation.
  const observer = new MutationObserver(() => {
    if (disposed || applying || moving || bouncing || deckUndo) return;
    const dialog = root.querySelector('dialog[open]');
    if (browserGuard) {
      if (!dialog) browserGuard = false;
      return;
    }
    if (dialog && dialog !== activeDialog) {
      activeDialog = dialog;
      push('dialog', journeyRoute(store.getState(), sessionId));
    } else if (!dialog && activeDialog) {
      activeDialog = null;
      if (entries[index]?.kind === 'dialog') { moving = true; history.back(); }
    }
  });
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  return () => {
    disposed = true;
    stop();
    observer.disconnect();
    target.removeEventListener('popstate', onPop);
  };
}
