import { store } from '../domain/store.js';
import { renderTabBar, attachTabBar } from '../components/tab-bar.js';
import '../styles/plan.css';

// Plan v14. Occasion taps open moods; planning mode and occasion carry-forward stay unchanged.
export function renderPlan() {
  return `
<div class="milo-home milo-tabscreen milo-plan">
<header class="milo-header milo-home-header"><div class="milo-home-place"><button class="milo-home-place-btn" type="button" id="miloPlanCity" aria-label="Change city: Bengaluru" aria-expanded="false" aria-controls="miloPlanCities"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>Bengaluru</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><div id="miloPlanCities" class="milo-city-dropdown" role="region" aria-label="Choose your city" hidden><button type="button" class="milo-city-option" aria-current="true" data-city="Bengaluru"><span>Bengaluru</span><span aria-hidden="true">✓</span></button><p class="milo-city-soon">More cities soon</p></div></div><span class="milo-wordmark">milo.</span></header>
<div class="milo-home-body"><h1 class="milo-headline milo-home-headline">What are you planning?</h1><ul class="milo-plan-card-grid" aria-label="Occasions"><li style="display:contents"><button type="button" class="milo-plan-card milo-plan-card-1" style="font:inherit"><svg class="milo-plan-card-art" viewBox="0 0 80 64" aria-hidden="true"><path d="M14 24h26v18a10 10 0 0 1-10 10h-6a10 10 0 0 1-10-10z" fill="#F2CBC3" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 29h5a6 6 0 0 1 0 12h-5" fill="none" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 36q2 2 4 0M30 36q2 2 4 0" fill="none" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 18q-3-5 0-9M31 18q-3-5 0-9" fill="none" stroke="#C39A92" stroke-width="2" stroke-linecap="round"/><path d="M60 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#E2BE8E"/></svg><span class="milo-plan-title">Date night</span><span class="milo-plan-copy">Beyond the usual dinner reservation</span></button></li><li style="display:contents"><button type="button" class="milo-plan-card milo-plan-card-2" style="font:inherit"><svg class="milo-plan-card-art" viewBox="0 0 80 64" aria-hidden="true"><path d="M40 54C16 40 14 22 26 18c6-2 11 2 14 7 3-5 8-9 14-7 12 4 10 22-14 36z" fill="#E7A9A9" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 28q-4 2-4 7" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M64 10l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#E2BE8E"/></svg><span class="milo-plan-title">Anniversary</span><span class="milo-plan-copy">Celebrate how far you&rsquo;ve come</span></button></li><li style="display:contents"><button type="button" class="milo-plan-card milo-plan-card-3" style="font:inherit"><svg class="milo-plan-card-art" viewBox="0 0 80 64" aria-hidden="true"><circle cx="40" cy="42" r="14" fill="none" stroke="#6E2228" stroke-width="2.5"/><path d="M33 24l7-9 7 9-7 8z" fill="#F7E3A8" stroke="#6E2228" stroke-width="2.5" stroke-linejoin="round"/><path d="M33 24h14" stroke="#6E2228" stroke-width="2" stroke-linecap="round"/><path d="M62 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#E2BE8E"/></svg><span class="milo-plan-title">Proposal</span><span class="milo-plan-copy">Plan a special moment to ask them to marry you</span></button></li><li style="display:contents"><button type="button" class="milo-plan-card milo-plan-card-4" style="font:inherit"><svg class="milo-plan-card-art" viewBox="0 0 80 64" aria-hidden="true"><rect x="16" y="30" width="48" height="22" rx="5" fill="#F2CBC3" stroke="#6E2228" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 38q6 6 12 0t12 0 12 0 12 0" fill="none" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round"/><path d="M28 30v-8M40 30v-10M52 30v-8" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round"/><path d="M28 17q-2-3 0-5 2 2 0 5zM40 15q-2-3 0-5 2 2 0 5zM52 17q-2-3 0-5 2 2 0 5z" fill="#E2BE8E"/></svg><span class="milo-plan-title">Birthday</span><span class="milo-plan-copy">A celebration shaped around what they love</span></button></li><li style="display:contents"><button type="button" class="milo-plan-card milo-plan-card-5" style="font:inherit"><svg class="milo-plan-card-art" viewBox="0 0 80 64" aria-hidden="true"><path d="M40 56V34" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round"/><path d="M40 48q-10-2-12-10 9 0 12 10zM40 44q10-2 12-10-9 0-12 10z" fill="#DCE0C8" stroke="#6E2228" stroke-width="2.2" stroke-linejoin="round"/><g fill="#F2CBC3" stroke="#6E2228" stroke-width="2.3"><circle cx="40" cy="18" r="6"/><circle cx="31" cy="25" r="6"/><circle cx="49" cy="25" r="6"/><circle cx="34" cy="14" r="6" opacity="0"/></g><circle cx="40" cy="23" r="5" fill="#E2BE8E" stroke="#6E2228" stroke-width="2.2"/></svg><span class="milo-plan-title">Quality Time</span><span class="milo-plan-copy">Slow down, be together</span></button></li><li style="display:contents"><button type="button" class="milo-plan-card milo-plan-card-6" style="font:inherit"><svg class="milo-plan-card-art" viewBox="0 0 80 64" aria-hidden="true"><rect x="14" y="14" width="52" height="40" rx="6" fill="#F3E8E5" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 26h52" fill="none" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 10v8M54 10v8" fill="none" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="40" r="7" fill="#F2CBC3" stroke="#6E2228" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M37 40q3 3 6 0" fill="none" stroke="#6E2228" stroke-width="2" stroke-linecap="round"/></svg><span class="milo-plan-title">Just because</span><span class="milo-plan-copy">Make an ordinary day feel special</span></button></li></ul></div>
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
