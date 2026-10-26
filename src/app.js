// ==========================================================
// MILO — MASTER APPLICATION CONTROLLER
// Orchestrates desktop dual-phone presentation shell,
// standalone mobile viewport, and domain store subscriptions.
// ==========================================================

import { openPlanningSheet } from './components/planning-sheet.js';
import { renderPlanningPath, attachPlanningPathListeners } from './screens/planning-path.js';
import { loadPersonalSynthesis, mountSynthesisLoader } from './components/synthesis-loader.js';
import { store } from './domain/store.js';
import { attachJourneyHistory } from './domain/journey-history.js';
import { inviteFromParams, renderInviteError } from './domain/invite.js';
import { attachStorageAdapter } from './domain/storage-adapter.js';
import { isPhase1Enabled, attachNetworkSync } from './domain/network-adapter.js';
import { showPartnerJoin } from './screens/partner-join.js';
import { renderScreen00, attachScreen00Listeners } from './screens/s0-invitation.js';
import { renderScreen01, attachScreen01Listeners, patchScreen01 } from './screens/s1-intent.js';
import { renderThreshold, attachThresholdListeners } from './screens/threshold.js';
import { renderScreen02, attachScreen02Listeners } from './screens/s2-deck.js';
import { renderScreen03, attachScreen03Listeners } from './screens/s3-synthesis.js';
import { renderScreen04, attachScreen04Listeners, patchScreen04 } from './screens/s4-invite-wait.js';
import { renderScreen05, attachScreen05Listeners, confirmReturnToMoods } from './screens/s5-shared.js';
import { renderScreen06, attachScreen06Listeners } from './screens/s6-nights.js';
import { renderScreen07, attachScreen07Listeners } from './screens/s7-your-night.js';
import { renderPlan, attachPlanListeners } from './screens/plan.js';
import { renderHome, attachHomeListeners } from './screens/home.js';
import { renderNights, attachNightsListeners } from './screens/nights-tab.js';
import { renderYou, attachYouListeners } from './screens/you-tab.js';
import { renderLogin, attachLoginListeners } from './screens/login.js';
import { shouldShowHome } from './logic/home.js';
import { renderRequests, attachRequestsListeners } from './screens/requests.js';
import { renderBooked, attachBookedListeners } from './screens/booked.js';
import { renderGroupSoon, attachGroupSoonListeners } from './screens/group-soon.js';
import { renderSealedWaiting, attachSealedWaitingListeners } from './screens/sealed-waiting.js';
import { planScreenApplies, renderPlanScreen, attachPlanScreenListeners } from './screens/plan-screen.js';
import { refreshPlan } from './domain/plan-view.js';
import { refreshGifts } from './domain/gifts.js';
import { refreshConcierge } from './domain/concierge.js';

// Partner A waits on the sealed screen until the partner's half lands.
function showSealedWaiting() {
  return !['s5', 's6', 's7'].includes(store.getState().sessionB?.screen);
}

// Screens that can update in place when only state (not the screen) changes.
// Screens without a patcher fall back to a full re-render, as before.
const SCREEN_PATCHERS = {
  s1: patchScreen01
};

function focusHeading(viewport) {
  const heading = viewport.querySelector('h1, h2');
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function getCurrentScreen(sessionId) {
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey] || {};
  return sessionData.screen || (sessionId === 'sneha' ? 's0' : 's1');
}

function renderSessionContent(sessionId) {
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey] || {};
  const screen = sessionData.screen || (sessionId === 'sneha' ? (state.shared.inviteSent ? 's0' : 's0') : 's1');

  // Phase 1 together: the creator's post-share screens render as the plan screen.
  if (planScreenApplies(sessionId, screen)) return renderPlanScreen(sessionId);

  switch (screen) {
    case 's0':
      return renderScreen00(sessionId);
    case 'planning_path_review':
      return renderPlanningPath(sessionId);
    case 'threshold':
      return renderThreshold(sessionId);
    case 's2':
      return renderScreen02(sessionId);
    case 's3':
      return sessionId === 'sneha' ? renderScreen05(sessionId) : renderScreen03(sessionId);
    case 's4_invite':
      return renderScreen04(sessionId);
    case 's4_waiting':
      return showSealedWaiting() ? renderSealedWaiting(sessionId) : renderScreen04(sessionId);
    case 's5':
      return renderScreen05(sessionId);
    case 's6':
      return renderScreen06(sessionId);
    case 'plan':
      return renderPlan(sessionId);
    case 'home':
      return renderHome(sessionId);
    case 'nights':
      return renderNights(sessionId);
    case 'you':
      return renderYou(sessionId);
    case 'login':
      return renderLogin(sessionId);
    case 'group':
      return renderGroupSoon(sessionId);
    case 'requests':
      return renderRequests(sessionId);
    case 'booked':
      return renderBooked(sessionId);
    case 's7':
      return renderScreen07(sessionId);
    case 's1':
    default:
      return renderScreen01(sessionId);
  }
}

function attachSessionListeners(container, sessionId) {
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey] || {};
  const screen = sessionData.screen || (sessionId === 'sneha' ? 's0' : 's1');

  if (planScreenApplies(sessionId, screen)) { attachPlanScreenListeners(container, sessionId); return; }

  switch (screen) {
    case 's0':
      attachScreen00Listeners(container, sessionId);
      break;
    case 'planning_path_review':
      attachPlanningPathListeners(container, sessionId);
      break;
    case 'threshold':
      attachThresholdListeners(container, sessionId);
      break;
    case 's2':
      attachScreen02Listeners(container, sessionId);
      break;
    case 's3':
      if (sessionId === 'sneha') attachScreen05Listeners(container, sessionId);
      else attachScreen03Listeners(container, sessionId);
      break;
    case 's4_invite':
      attachScreen04Listeners(container, sessionId);
      break;
    case 's4_waiting':
      if (showSealedWaiting()) attachSealedWaitingListeners(container, sessionId);
      else attachScreen04Listeners(container, sessionId);
      break;
    case 's5':
      attachScreen05Listeners(container, sessionId);
      break;
    case 's6':
      attachScreen06Listeners(container, sessionId);
      break;
    case 'plan':
      attachPlanListeners(container, sessionId);
      break;
    case 'home':
      attachHomeListeners(container, sessionId);
      break;
    case 'nights':
      attachNightsListeners(container, sessionId);
      break;
    case 'you':
      attachYouListeners(container, sessionId);
      break;
    case 'login':
      attachLoginListeners(container, sessionId);
      break;
    case 'group':
      attachGroupSoonListeners(container, sessionId);
      break;
    case 'requests':
      attachRequestsListeners(container, sessionId);
      break;
    case 'booked':
      attachBookedListeners(container, sessionId);
      break;
    case 's7':
      attachScreen07Listeners(container, sessionId);
      break;
    case 's1':
    default:
      attachScreen01Listeners(container, sessionId);
      break;
  }
}

export function initApp(container, { loadSynthesis = loadPersonalSynthesis } = {}) {
  // Attach storage adapter for cross-window sync
  attachStorageAdapter(store);

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const asParam = urlParams.get('as'); // 'aarav' or 'sneha'
  const isReset = urlParams.get('reset');
  const isGolden = urlParams.get('golden');
  const vpParam = urlParams.get('vp');
  const screenParam = urlParams.get('screen');

  // Server invite (/app/?invite=<token>, no ?as): the partner joins a real plan. Only with the launch flag.
  if (isPhase1Enabled() && urlParams.has('invite') && !urlParams.has('as')) {
    showPartnerJoin(container, urlParams.get('invite'));
    return;
  }
  if (isPhase1Enabled()) attachNetworkSync(store);
  // Plan state refreshes on app open and on return to the tab only - no timers,
  // no repeated checks while the screen stays open.
  // Gifts follow the plan: their reveal times depend on the confirmed night and time.
  const refreshAll = () => refreshPlan().then(() => Promise.all([refreshGifts(), refreshConcierge()]));
  const onVisibilityRefresh = () => { if (document.visibilityState === 'visible') refreshAll(); };
  const onFocusRefresh = () => refreshAll();
  if (isPhase1Enabled()) {
    refreshAll();
    document.addEventListener('visibilitychange', onVisibilityRefresh);
    window.addEventListener('focus', onFocusRefresh);
  }
  // After sharing, the creator stays on their plan screen instead of the waiting screen.
  store.subscribe(() => {
    if (store.getState().sessionA.screen === 's4_waiting' && planScreenApplies('aarav', 's4_waiting')) {
      store.setSessionScreen('aarav', 's7');
    }
  });

  const inviteStatus = inviteFromParams(urlParams);
  if (inviteStatus === 'invalid' || inviteStatus === 'expired') {
    container.innerHTML = `<div class="milo-stage"><div class="milo-viewport">${renderInviteError(inviteStatus)}</div></div>`;
    return;
  }
  if (inviteStatus === 'valid') {
    const token = urlParams.get('invite');
    if (store.getState().shared.acceptedInviteToken !== token) {
      store.updateShared({ inviteSent: true, acceptedInviteToken: token });
      store.setSessionScreen('sneha', 's0');
    }
  }

  if (vpParam) {
    document.body.setAttribute('data-viewport', vpParam);
  } else {
    document.body.removeAttribute('data-viewport');
  }

  if (isReset === '1') {
    store.reset();
    window.history.replaceState({}, '', window.location.pathname + (asParam ? `?as=${asParam}` : ''));
  } else if (isGolden === '1') {
    // Populate golden path inputs
    store.updateSession('aarav', {
      intents: ['intimate', 'novelty', 'low-key'],
      reactions: [
        { cardId: 'tiny-bar', reaction: 'into_it' },
        { cardId: 'long-walk', reaction: 'into_it' },
        { cardId: 'rooftop-drinks', reaction: 'not_tonight' },
        { cardId: 'board-games', reaction: 'maybe' },
        { cardId: 'neighbourhood-wander', reaction: 'into_it' },
        { cardId: 'live-music', reaction: 'not_tonight' },
        { cardId: 'sunset-cosy', reaction: 'into_it' },
        { cardId: 'creative-activity', reaction: 'maybe' }
      ],
      currentCardIndex: 8,
      screen: screenParam || 's3'
    });

    store.updateSession('sneha', {
      intents: ['intimate', 'fun', 'special'],
      reactions: [
        { cardId: 'live-music', reaction: 'into_it' },
        { cardId: 'courtyard-dinner', reaction: 'into_it' },
        { cardId: 'street-food-film', reaction: 'not_tonight' },
        { cardId: 'dressed-up', reaction: 'not_tonight' },
        { cardId: 'creative-activity', reaction: 'into_it' },
        { cardId: 'board-games', reaction: 'maybe' },
        { cardId: 'rooftop-drinks', reaction: 'into_it' },
        { cardId: 'sunset-cosy', reaction: 'not_tonight' }
      ],
      currentCardIndex: 8,
      screen: screenParam || 's0'
    });
  }

  if (screenParam === 'planning_path' || screenParam === 'planning_path_review') {
    store.setSessionScreen('aarav', screenParam);
  }

  if (screenParam) {
    if (screenParam === 's2') {
      store.updateSession('aarav', {
        intents: ['intimate', 'novelty', 'low-key'],
        screen: 's2'
      });
      store.updateSession('sneha', {
        intents: ['intimate', 'fun', 'special'],
        screen: 's2'
      });
    } else if (screenParam === 'threshold') {
      store.setSessionScreen('aarav', 'threshold');
      store.setSessionScreen('sneha', 'threshold');
    } else if (screenParam === 's3') {
      store.setSessionScreen('aarav', 's3');
      store.setSessionScreen('sneha', 's5');
    } else if (screenParam === 's4') {
      store.setSessionScreen('aarav', 's4_invite');
      store.setSessionScreen('sneha', 's0');
    } else if (screenParam === 's4_waiting') {
      store.updateShared({ invitePrepared: true });
      if (new URLSearchParams(location.search).has('demo')) store.updateSession('aarav', { intents: ['intimate', 'fun'], savedSoloNightId: 'middle-ground', soloTimings: { 'middle-ground': { nightId: 'middle-ground', date: '2026-10-17', time: '19:30', timeZone: 'Asia/Calcutta' } } });
      store.setSessionScreen('aarav', 's4_waiting');
      store.setSessionScreen('sneha', 's0');
    } else if (screenParam === 's5') {
      store.setSessionScreen('aarav', 's5');
      store.setSessionScreen('sneha', 's5');
    } else if (screenParam === 's6') {
      store.setSessionScreen('aarav', 's6');
      store.setSessionScreen('sneha', 's6');
    } else if (screenParam === 's7') {
      store.setSessionScreen('aarav', 's7');
      store.setSessionScreen('sneha', 's7');
    } else if (screenParam === 'suggested') {
      store.updateShared({
        suggestion: { by: 'sneha', nightId: 'middle-ground' }
      });
      store.updateSession('aarav', { screen: 's6' });
      store.updateSession('sneha', { screen: 's7' });
    } else if (screenParam === 'booked') {
      store.updateSession('aarav', { screen: 'booked', savedSoloNightId: 'middle-ground', activeNightId: 'middle-ground', soloTimings: { 'middle-ground': { nightId: 'middle-ground', date: '2026-10-17', time: '19:30', timeZone: 'Asia/Calcutta' } } });
    } else if (screenParam === 'closed') {
      store.updateShared({
        confirmedNightId: 'middle-ground'
      });
      store.updateSession('aarav', { screen: 's7' });
      store.updateSession('sneha', { screen: 's7' });
    } else if (['login', 'you', 'home', 'nights', 'plan', 'requests', 'group'].includes(screenParam)) {
      store.setSessionScreen(asParam === 'sneha' ? 'sneha' : 'aarav', screenParam);
    }
  }

  // Old fork links and saved sessions reopen the choices over Home instead.
  const legacyPlanningPath = store.getState()[asParam === 'sneha' ? 'sessionB' : 'sessionA'].screen === 'planning_path';
  if (legacyPlanningPath) store.setSessionScreen(asParam === 'sneha' ? 'sneha' : 'aarav', 'home');

  // Open on the homepage on every ordinary open; a mid-journey plan keeps its
  // step in pausedScreen so Home's Resume card returns to the exact saved step.
  if (!screenParam && isGolden !== '1' && asParam !== 'sneha' && inviteStatus !== 'valid' && shouldShowHome(store.getState())) {
    const sessA = store.getState().sessionA;
    if (['s1', 'threshold', 's2', 's3', 's4_invite'].includes(sessA.screen) && ((sessA.intents || []).length > 0 || (sessA.reactions || []).length > 0 || sessA.planningMode)) {
      store.updateSession('aarav', { pausedScreen: sessA.screen });
    }
    store.setSessionScreen('aarav', 'home');
  }

  let mountedKey = null;
  let synthesisKey = null;
  let disposeSynthesis = null;

  function render() {
    const activeSessionId = asParam === 'sneha' ? 'sneha' : 'aarav';
    const screen = getCurrentScreen(activeSessionId);
    const key = `${activeSessionId}:${screen}`;
    const patch = SCREEN_PATCHERS[screen];
    const viewport = container.querySelector(`#viewport-${activeSessionId}`);

    const inviteFamily = ['s4_invite', 's4_waiting'];
    if (viewport && inviteFamily.includes(screen) && inviteFamily.some(s => mountedKey === `${activeSessionId}:${s}`) && patchScreen04(viewport)) {
      mountedKey = key;
      return;
    }
    viewport?.inviteCleanup?.();

    // Preserve one gate across unrelated store updates. Restart for changed inputs,
    // cancel on exit, and never let a late response write into another screen.
    const session = store.getState()[activeSessionId === 'sneha' ? 'sessionB' : 'sessionA'];
    const nextSynthesisKey = screen === 's3' && activeSessionId !== 'sneha'
      ? JSON.stringify([session.intents || [], session.reactions || []]) : null;
    if (viewport && mountedKey === key && synthesisKey === nextSynthesisKey && disposeSynthesis) return;
    disposeSynthesis?.();
    disposeSynthesis = null;
    synthesisKey = nextSynthesisKey;

    // Same screen, state-only change: patch the existing DOM so CSS
    // transitions run and entry animations do not replay.
    if (patch && viewport && mountedKey === key) {
      patch(viewport, activeSessionId);
      return;
    }

    viewport?.planningSheetCleanup?.();
    viewport?.deckCleanup?.();
    viewport?.thresholdCleanup?.();
    const isNavigation = mountedKey !== null && mountedKey !== key;
    const previousFocus = viewport?.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = previousFocus?.id || previousFocus?.getAttribute('data-customise-slot');
    const focusSlot = previousFocus?.hasAttribute('data-customise-slot');
    mountedKey = key;
    container.innerHTML = `
      <div class="milo-stage">
        <div class="milo-viewport" id="viewport-${activeSessionId}" data-session-id="${activeSessionId}">
          ${nextSynthesisKey !== null ? '' : renderSessionContent(activeSessionId)}
        </div>
      </div>
    `;

    const currentViewport = container.querySelector(`#viewport-${activeSessionId}`);
    if (nextSynthesisKey !== null) {
      // Do not mount pills or CTAs until the adapter has resolved.
      disposeSynthesis = mountSynthesisLoader(currentViewport, {
        session: structuredClone(session),
        load: loadSynthesis,
        renderReady: observations => renderScreen03(activeSessionId, observations),
        attachReady: destination => {
          attachScreen03Listeners(destination, activeSessionId);
          if (isNavigation) focusHeading(destination);
        },
        onBack: () => store.setSessionScreen(activeSessionId, 's2')
      });
    } else {
      attachSessionListeners(currentViewport, activeSessionId);
      if (isNavigation) focusHeading(currentViewport);
      else if (focusKey != null) {
        const target = focusSlot
          ? currentViewport.querySelector(`[data-customise-slot="${focusKey}"]`)
          : document.getElementById(focusKey);
        target?.focus({ preventScroll: true });
      }
    }
  }

  const activeSessionId = asParam === 'sneha' ? 'sneha' : 'aarav';
  const detachHistory = attachJourneyHistory(store, {
    sessionId: activeSessionId, root: container,
    confirmPartnerBack: () => confirmReturnToMoods(container.querySelector('#viewport-sneha'))
  });

  // Initial render
  render();
  if (legacyPlanningPath) openPlanningSheet(container.querySelector(`#viewport-${activeSessionId}`), activeSessionId);

  // Re-render on store updates
  const stopRender = store.subscribe(() => {
    render();
  });
  return () => {
    stopRender(); detachHistory(); disposeSynthesis?.();
    document.removeEventListener('visibilitychange', onVisibilityRefresh);
    window.removeEventListener('focus', onFocusRefresh);
    const viewport = container.querySelector(`#viewport-${activeSessionId}`);
    viewport?.planningSheetCleanup?.(); viewport?.deckCleanup?.(); viewport?.inviteCleanup?.(); viewport?.thresholdCleanup?.();
  };
}
