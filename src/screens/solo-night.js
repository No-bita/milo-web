import { renderItinerary, attachItinerary } from '../components/itinerary.js';
import { renderNightTiming, attachNightTiming } from '../components/night-timing.js';
import { store } from '../domain/store.js';
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
    <div class="milo-s7-body">${renderNightTiming(night.id, sessionId, { solo: true })}</div>
  </div>`;
  return `<div class="milo-s7-container" data-session-id="${sessionId}">
    <div class="milo-s7-hero">
      <img src="${night.defaultImage}" alt="${night.name}" class="milo-s7-hero-img"><div class="milo-s7-scrim"></div>
      <button class="milo-s7-back-btn" id="miloSoloBack" aria-label="Back to your nights"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button>
      <div class="milo-s7-hero-text"><div class="milo-s7-num-row"><span class="milo-s7-num">${item.num}</span></div><h1 class="milo-s7-night-name">${night.name}</h1></div>
    </div>
    <div class="milo-s7-body">
      <p class="milo-s7-reason">${night.reasonLine}</p>
      <div class="milo-timeline-section">${renderItinerary(night, item.night)}</div>
      <p class="milo-s7-skip-line">Skip this one if ${night.skipIf}</p>
      <div class="milo-s7-actions">
        <button class="milo-secondary-link" id="miloSoloOther">See the other two</button>
        <button class="milo-cta-button" id="miloSoloSave">${saved ? 'Continue to date &amp; time' : 'Save this draft'}</button>
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
