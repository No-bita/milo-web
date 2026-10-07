import { store } from '../domain/store.js';
import { computePlanningOutput } from '../logic/planning.js';

export function renderSoloNight(sessionId = 'aarav') {
  const state = store.getState();
  const nights = computePlanningOutput(state, sessionId).selectedNights;
  const item = nights.find(item => item.night.id === state.sessionA.activeNightId) || nights[0];
  const night = item.night;
  const saved = state.sessionA.savedSoloNightId === night.id;
  return `<div class="milo-s7-container" data-session-id="${sessionId}">
    <div class="milo-s7-hero">
      <img src="${night.defaultImage}" alt="${night.name}" class="milo-s7-hero-img"><div class="milo-s7-scrim"></div>
      <button class="milo-s7-back-btn" id="miloSoloBack" aria-label="Back to your nights"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button>
      <div class="milo-s7-hero-text"><div class="milo-s7-num-row"><span class="milo-s7-num">${item.num}</span></div><h1 class="milo-s7-night-name">${night.name}</h1></div>
    </div>
    <div class="milo-s7-body">
      <p class="milo-s7-reason">${night.reasonLine}</p>
      <div class="milo-s7-why-works"><p class="milo-s7-why-text">${item.whyItWorks}</p></div>
      <div class="milo-timeline-section">${night.beats.map((beat, i) => `<div class="milo-timeline-item"><div class="milo-timeline-track"><div class="milo-timeline-dot"></div>${i < night.beats.length - 1 ? '<div class="milo-timeline-line"></div>' : ''}</div><div class="milo-timeline-content"><span class="milo-timeline-name">${beat.name}</span><span class="milo-timeline-desc">${beat.desc}</span></div></div>`).join('')}</div>
      <p class="milo-s7-skip-line">Skip this one if ${night.skipIf}</p>
      <div class="milo-s7-actions">
        <button class="milo-secondary-link" id="miloSoloOther">See the other two</button>
        ${saved ? '<p class="milo-path-footnote" role="status">Draft saved in this browser. Nothing booked or sent to your partner.</p>' : '<button class="milo-cta-button" id="miloSoloSave">Save this draft</button>'}
      </div>
    </div>
  </div>`;
}

export function attachSoloNightListeners(container, sessionId = 'aarav') {
  const back = () => store.setSessionScreen(sessionId, 's6');
  container.querySelector('#miloSoloBack')?.addEventListener('click', back);
  container.querySelector('#miloSoloOther')?.addEventListener('click', back);
  container.querySelector('#miloSoloSave')?.addEventListener('click', () => {
    const state = store.getState();
    const nights = computePlanningOutput(state, sessionId).selectedNights;
    const item = nights.find(item => item.night.id === state.sessionA.activeNightId) || nights[0];
    store.updateSession(sessionId, { savedSoloNightId: item.night.id });
  });
}
