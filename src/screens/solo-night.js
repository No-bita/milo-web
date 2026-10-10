import { renderItinerary, attachItinerary } from '../components/itinerary.js';
import { renderNightTiming, attachNightTiming, timingForNight } from '../components/night-timing.js';
import { store } from '../domain/store.js';
import { partnerLabel } from '../logic/partner.js';
import { computePlanningOutput } from '../logic/planning.js';

export function renderSoloNight(sessionId = 'aarav') {
  const state = store.getState();
  const nights = computePlanningOutput(state, sessionId).selectedNights;
  const item = nights.find(item => item.night.id === state.sessionA.activeNightId) || nights[0];
  const overrides = state.sessionA.soloItineraryOverrides?.[item.night.id] || {};
  const night = { ...item.night, beats: item.night.beats.map((beat, i) => overrides[i] || beat) };
  const saved = state.sessionA.savedSoloNightId === night.id;
  const timingStep = state.sessionA.soloTimingStep === night.id;
  if (timingStep) return `<div class="milo-s7-container milo-closing-state" data-session-id="${sessionId}">
    <header class="milo-header"><button class="milo-header-back" id="miloSoloTimingBack" aria-label="Back to itinerary">←</button><span class="milo-wordmark">milo.</span></header>
    <div class="milo-s7-body">${renderNightTiming(night.id, sessionId, { solo: true })}
      ${timingForNight(night.id, { solo: true }) ? '<div class="milo-s7-actions"><button class="milo-cta-button" id="miloSoloContinue">Seal it</button></div>' : ''}
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
        <button class="milo-secondary-link" id="miloSoloOther">See the other two</button>
        <button class="milo-cta-button" id="miloSoloSave">${saved ? 'Continue to date &amp; time' : 'Save this draft'}</button>
      </div>
      <button type="button" class="milo-text-button milo-bring-in" id="miloSoloBringIn">Bring ${partnerLabel(state)} in</button>
    </div>
  </div>`;
}

export function attachSoloNightListeners(container, sessionId = 'aarav') {
  const state = store.getState();
  const nights = computePlanningOutput(state, sessionId).selectedNights;
  const item = nights.find(item => item.night.id === state.sessionA.activeNightId) || nights[0];
  if (state.sessionA.soloTimingStep === item.night.id) {
    attachNightTiming(container, item.night.id, sessionId, { solo: true });
    container.querySelector('#miloSoloContinue')?.addEventListener('click', () => store.setSessionScreen(sessionId, 's4_waiting'));
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
  container.querySelector('#miloSoloBringIn')?.addEventListener('click', () => store.updateSession(sessionId, { planningMode: 'together', screen: 's4_invite' }));
  const back = () => store.setSessionScreen(sessionId, 's6');
  container.querySelector('#miloSoloBack')?.addEventListener('click', back);
  container.querySelector('#miloSoloOther')?.addEventListener('click', back);
  container.querySelector('#miloSoloSave')?.addEventListener('click', () => {
    const state = store.getState();
    const nights = computePlanningOutput(state, sessionId).selectedNights;
    const item = nights.find(item => item.night.id === state.sessionA.activeNightId) || nights[0];
    store.updateSession(sessionId, { savedSoloNightId: item.night.id, soloTimingStep: item.night.id });
  });
}
