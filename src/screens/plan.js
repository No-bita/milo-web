import { store } from '../domain/store.js';
import { renderTabBar, attachTabBar } from '../components/tab-bar.js';
import { OCCASIONS } from '../data/occasions.js';
import '../styles/plan.css';

// Plan v14. Occasion taps open moods; planning mode and occasion carry-forward stay unchanged.
export function renderPlan() {
  return `
<div class="milo-home milo-tabscreen milo-plan">
<header class="milo-header milo-home-header"><div class="milo-home-place"><button class="milo-home-place-btn" type="button" id="miloPlanCity" aria-label="Change city: Bengaluru" aria-expanded="false" aria-controls="miloPlanCities"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>Bengaluru</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><div id="miloPlanCities" class="milo-city-dropdown" role="region" aria-label="Choose your city" hidden><button type="button" class="milo-city-option" aria-current="true" data-city="Bengaluru"><span>Bengaluru</span><span aria-hidden="true">✓</span></button><p class="milo-city-soon">More cities soon</p></div></div><span class="milo-wordmark">milo.</span></header>
<div class="milo-home-body"><h1 class="milo-headline milo-home-headline">What are you planning?</h1><ul class="milo-plan-card-grid" aria-label="Occasions">${OCCASIONS.map((occasion, index) => `<li style="display:contents"><button type="button" class="milo-plan-card milo-plan-card-${index + 1}" style="font:inherit"><svg class="milo-plan-card-art" viewBox="0 0 80 64" aria-hidden="true">${occasion.art}</svg><span class="milo-plan-title">${occasion.name}</span><span class="milo-plan-copy">${occasion.copy}</span></button></li>`).join('')}</ul></div>
${renderTabBar('plan')}
</div>`;
}

export function attachPlanListeners(container, sessionId = 'aarav') {
  attachTabBar(container, sessionId);
  container.querySelectorAll('.milo-plan-card').forEach(card => {
    card.addEventListener('click', () => store.setSessionScreen(sessionId, 's1'));
  });
  const trigger = container.querySelector('#miloPlanCity');
  const dropdown = container.querySelector('#miloPlanCities');
  const setOpen = open => {
    dropdown.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
  };
  trigger.addEventListener('click', () => setOpen(dropdown.hidden));
  dropdown.querySelector('[data-city]').addEventListener('click', event => {
    const city = event.currentTarget.dataset.city;
    trigger.querySelector('span').textContent = city;
    trigger.setAttribute('aria-label', `Change city: ${city}`);
    setOpen(false);
    trigger.focus({ preventScroll: true });
  });
  container.addEventListener('click', event => {
    if (!event.target.closest('.milo-home-place')) setOpen(false);
  });
  container.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dropdown.hidden) {
      event.preventDefault();
      setOpen(false);
      trigger.focus({ preventScroll: true });
    }
  });
  container.addEventListener('focusout', event => {
    if (!event.relatedTarget?.closest('.milo-home-place')) setOpen(false);
  });
  // Bengaluru is the only selectable city. No plan filtering or backend changes.
  // Occasion taps carry no occasion and assign no solo/together default.
}
