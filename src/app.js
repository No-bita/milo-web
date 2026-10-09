// ==========================================================
// MILO — MASTER APPLICATION CONTROLLER
// Orchestrates desktop dual-phone presentation shell,
// standalone mobile viewport, and domain store subscriptions.
// ==========================================================

import { renderPlanningPath, attachPlanningPathListeners } from './screens/planning-path.js';
import { loadPersonalSynthesis, mountSynthesisLoader } from './components/synthesis-loader.js';
import { store } from './domain/store.js';
import { attachJourneyHistory } from './domain/journey-history.js';
import { inviteFromParams, renderInviteError } from './domain/invite.js';
import { attachStorageAdapter } from './domain/storage-adapter.js';
import { renderScreen00, attachScreen00Listeners } from './screens/s0-invitation.js';
import { renderScreen01, attachScreen01Listeners, patchScreen01 } from './screens/s1-intent.js';
import { renderThreshold, attachThresholdListeners } from './screens/threshold.js';
import { renderScreen02, attachScreen02Listeners } from './screens/s2-deck.js';
import { renderScreen03, attachScreen03Listeners } from './screens/s3-synthesis.js';
import { renderScreen04, attachScreen04Listeners, patchScreen04 } from './screens/s4-invite-wait.js';
import { renderScreen05, attachScreen05Listeners, confirmReturnToMoods } from './screens/s5-shared.js';
import { renderScreen06, attachScreen06Listeners } from './screens/s6-nights.js';
import { renderScreen07, attachScreen07Listeners } from './screens/s7-your-night.js';
import { renderHome, attachHomeListeners } from './screens/home.js';
import { renderNights, attachNightsListeners } from './screens/nights-tab.js';
import { renderYou, attachYouListeners } from './screens/you-tab.js';
import { shouldShowHome } from './logic/home.js';
import { renderBooked, attachBookedListeners } from './screens/booked.js';
import { renderGroupSoon, attachGroupSoonListeners } from './screens/group-soon.js';
import { renderSealedWaiting, attachSealedWaitingListeners } from './screens/sealed-waiting.js';

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

  switch (screen) {
    case 's0':
      return renderScreen00(sessionId);
    case 'planning_path':
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
    case 'home':
      return renderHome(sessionId);
    case 'nights':
      return renderNights(sessionId);
    case 'you':
      return renderYou(sessionId);
    case 'group':
      return renderGroupSoon(sessionId);
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

  switch (screen) {
    case 's0':
      attachScreen00Listeners(container, sessionId);
      break;
    case 'planning_path':
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
    case 'home':
      attachHomeListeners(container, sessionId);
      break;
    case 'nights':
      attachNightsListeners(container, sessionId);
      break;
    case 'you':
      attachYouListeners(container, sessionId);
      break;
    case 'group':
      attachGroupSoonListeners(container, sessionId);
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
    }
  }

  // Open on the homepage unless a link or invite points somewhere specific.
  if (!screenParam && isGolden !== '1' && asParam !== 'sneha' && inviteStatus !== 'valid' && shouldShowHome(store.getState())) {
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

  // Re-render on store updates
  const stopRender = store.subscribe(() => {
    render();
  });
  return () => {
    stopRender(); detachHistory(); disposeSynthesis?.();
    const viewport = container.querySelector(`#viewport-${activeSessionId}`);
    viewport?.deckCleanup?.(); viewport?.inviteCleanup?.(); viewport?.thresholdCleanup?.();
  };
}
