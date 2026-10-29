import { accountsEnabled } from '../domain/account-api.js';
import { renderItinerary, attachItinerary } from '../components/itinerary.js';
import { renderNightTiming, attachNightTiming, liveTimingForNight } from '../components/night-timing.js';
import { store } from '../domain/store.js';
import { computePlanningOutput } from '../logic/planning.js';
import { currentPlanResult, hasServerSeat } from '../domain/plan-view.js';
import { openBookFirstSheet } from '../components/bring-in-sheet.js';

export function renderSoloNight(sessionId = 'aarav') {
  const state = store.getState();
  const nights = computePlanningOutput(state, sessionId).selectedNights;
  const item = nights.find(item => item.night.id === state.sessionA.activeNightId) || nights[0];
  const overrides = state.sessionA.soloItineraryOverrides?.[item.night.id] || {};
  const night = { ...item.night, beats: item.night.beats.map((beat, i) => overrides[i] || beat) };
  const timingStep = state.sessionA.soloTimingStep === night.id;
  if (timingStep) return `<div class="milo-s7-container milo-closing-state" data-session-id="${sessionId}">
    <header class="milo-header"><button class="milo-header-back" id="miloSoloTimingBack" aria-label="Back to itinerary">←</button><span class="milo-wordmark">milo.</span></header>
    <div class="milo-s7-body">${renderNightTiming(night.id, sessionId, { solo: true })}
      ${liveTimingForNight(night.id, { solo: true }) ? '<div class="milo-s7-actions"><button class="milo-cta-button" id="miloSoloContinue">Continue</button></div>' : ''}
    </div>
  </div>`;
  return `<div class="milo-s7-container milo-visual-plan" data-session-id="${sessionId}">
    <div class="milo-s7-hero">
      <button class="milo-s7-back-btn" id="miloSoloBack" aria-label="Back to your nights"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button>
      <div class="milo-s7-hero-text"><h1 class="milo-s7-night-name">${night.name}</h1></div>
    </div>
    <div class="milo-s7-body">
      <div class="milo-plan-grid">${renderItinerary(night, item.night, { stacked: true, editable: true })}</div>
      <details class="milo-plan-why"><summary>Why this night fits <span aria-hidden="true">+</span></summary><p>${night.reasonLine}</p><p>Skip this one if ${night.skipIf}</p></details>
      <div class="milo-s7-actions">
        <button class="milo-cta-button" id="miloSoloSave">Book this night</button>
      </div>
    </div>
  </div>`;
}

export function attachSoloNightListeners(container, sessionId = 'aarav') {
  const state = store.getState();
  const nights = computePlanningOutput(state, sessionId).selectedNights;
  const item = nights.find(item => item.night.id === state.sessionA.activeNightId) || nights[0];
  if (state.sessionA.soloTimingStep === item.night.id) {
    attachNightTiming(container, item.night.id, sessionId, { solo: true });
    container.querySelector('#miloSoloContinue')?.addEventListener('click', () => {
      const user = store.getState()[sessionId === 'sneha' ? 'sessionB' : 'sessionA']?.user;
      // With real accounts, sign-in is asked for at booking instead.
      if (!accountsEnabled() && !user?.loggedIn) {
        store.updateSession(sessionId, { returnScreen: 's4_waiting', loginReason: 'save_plan' });
        store.setSessionScreen(sessionId, 'login');
      } else {
        store.setSessionScreen(sessionId, 's4_waiting');
      }
    });
    container.querySelector('#miloSoloTimingBack')?.addEventListener('click', () => store.updateSession(sessionId, { soloTimingStep: null }));
    return;
  }
  attachItinerary(container, () => {
    const overrides = store.getState().sessionA.soloItineraryOverrides?.[item.night.id] || {};
    return { original: item.night, night: { ...item.night, beats: item.night.beats.map((beat, i) => overrides[i] || beat) }, locked: false };
  }, (slot, option) => {
    const scrollTop = container.querySelector('.milo-s7-container').scrollTop;
    const overrides = store.getState().sessionA.soloItineraryOverrides || {};
    store.updateSession(sessionId, { soloItineraryOverrides: { ...overrides, [item.night.id]: { ...overrides[item.night.id], [slot]: option } } });
    const replacement = document.getElementById(`viewport-${sessionId}`);
    const itinerary = replacement?.querySelector('.milo-s7-container');
    if (itinerary) itinerary.scrollTop = scrollTop;
    replacement?.querySelector(`[data-customise-slot="${slot}"]`)?.focus({ preventScroll: true });
  });
  container.querySelector('#miloSoloBack')?.addEventListener('click', () => store.setSessionScreen(sessionId, 's6'));
  // Book this night: the same next step as saving the draft (date and time, then booking).
  const book = () => {
    const state = store.getState();
    const nights = computePlanningOutput(state, sessionId).selectedNights;
    const item = nights.find(item => item.night.id === state.sessionA.activeNightId) || nights[0];
    store.updateSession(sessionId, { savedSoloNightId: item.night.id, soloTimingStep: item.night.id });
  };
  container.querySelector('#miloSoloSave')?.addEventListener('click', () => {
    // Someone was invited from the three nights and their picks aren't in yet: ask first.
    const state = store.getState();
    if (state.sessionA.bringIn?.prepared && hasServerSeat() && !currentPlanResult(state)) {
      openBookFirstSheet(sessionId, { triggerId: 'miloSoloSave', onBook: book });
      return;
    }
    book();
  });
}
