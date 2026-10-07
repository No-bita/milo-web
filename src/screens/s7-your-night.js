// ==========================================================
// MILO — SCREEN 7: YOUR NIGHT (S7)
// Hero image, timeline of 3 beats, reason line, skip line,
// suggestion and agreement state machine.
// ==========================================================

import { isSoloPlanning } from '../logic/planning.js';
import { renderSoloNight, attachSoloNightListeners } from './solo-night.js';
import { store } from '../domain/store.js';
import { computeSharedOutput } from '../logic/shared.js';
import { renderNightTiming, attachNightTiming, timingForNight, timingLabel } from '../components/night-timing.js';
// Mock slot pools, not venue listings. Only the selected beat is replaced.
const photo = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;
const SLOT_POOLS = {
  dinner: [
    { name: 'Dinner', desc: 'somewhere small and candlelit, no rush.', image: photo('photo-1517248135467-4c7edcad34c4') },
    { name: 'Courtyard dinner', desc: 'a quiet table tucked away from the street.', image: photo('photo-1555396273-367ea4eb4db5') },
    { name: 'Sharing plates', desc: 'a few small plates and a long conversation.', image: photo('photo-1504674900247-0877df9cc836') }
  ],
  walk: [
    { name: 'Walk', desc: 'quiet streets, nowhere we need to be.', image: photo('photo-1519501025264-65ba15a82390') },
    { name: 'Garden stroll', desc: 'a leafy path and time to wander.', image: photo('photo-1448375240586-882707db888b') },
    { name: 'Sunset spot', desc: 'pause somewhere open as the light changes.', image: photo('photo-1519331379826-f10be5486c6f') }
  ],
  dessert: [
    { name: 'Dessert', desc: 'a table outside if it is warm.', image: photo('photo-1551024601-bec78aea704b') },
    { name: 'Something sweet', desc: 'pick two favourites and share a little of each.', image: photo('photo-1488477181946-6428a0291777') }
  ],
  creative: [
    { name: 'Creative activity', desc: 'hands-on, fun, no pressure.', image: photo('photo-1565193566173-7a0ee3dbe261') },
    { name: 'Make something together', desc: 'try a small project, with no need to be good at it.', image: photo('photo-1565193566173-7a0ee3dbe261') }
  ],
  drinks: [
    { name: 'Rooftop', desc: 'drinks above the city lights.', image: photo('photo-1516589178581-6cd7833ae3b2') },
    { name: 'Cocktail bar', desc: 'an intimate corner for one last drink.', image: photo('photo-1551024709-8f23befc6f87') }
  ],
  music: [
    { name: 'Live music', desc: 'small set, close enough to feel it.', image: photo('photo-1514306191717-452ec28c7814') },
    { name: 'Acoustic set', desc: 'a quieter set in a small room.', image: photo('photo-1514306191717-452ec28c7814') }
  ],
  cosy: [
    { name: 'Somewhere cosy', desc: 'settle in from the chill.', image: photo('photo-1554118811-1e0d58224f24') },
    { name: 'A warm cafe', desc: 'a tucked-away table and something warm.', image: photo('photo-1501339847302-ac426a4a7cbb') }
  ]
};
function slotKey(name) {
  if (/dinner|plates|food/i.test(name)) return 'dinner';
  if (/walk|sunset/i.test(name)) return 'walk';
  if (/dessert/i.test(name)) return 'dessert';
  if (/creative/i.test(name)) return 'creative';
  if (/music/i.test(name)) return 'music';
  if (/rooftop|cocktail|nightcap/i.test(name)) return 'drinks';
  return 'cosy';
}
function resolvedNight(night, state) {
  const swaps = state.shared.itineraryOverrides?.[night.id] || {};
  return { ...night, beats: night.beats.map((beat, i) => swaps[i] || beat) };
}

// Plan summary used by the closing state share action.
function planText(night, partnerName) {
  const steps = night.beats.map(b => b.name).join(' \u2192 ');
  const timing = timingForNight(night.id);
  return `Our night with ${partnerName}: ${night.name}. ${steps}.${timing ? ` ${timingLabel(timing)}.` : ''}`;
}

// "Start over" is demo scaffolding: only shown with ?demo
const isDemo = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo');

export function renderScreen07(sessionId = 'aarav') {
  if (isSoloPlanning(store.getState(), sessionId)) return renderSoloNight(sessionId);
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey] || {};
  const partnerName = sessionId === 'sneha' ? 'Aarav' : 'Sneha';
  const partnerPickLabel = `${partnerName.toUpperCase()}'S PICK`;

  const sharedData = computeSharedOutput(state.sessionA, state.sessionB);
  const activeNightId = sessionData.activeNightId || (sharedData.selectedNights[0]?.night.id || 'middle-ground');
  const nightItem = sharedData.selectedNights.find(sn => sn.night.id === activeNightId) || sharedData.selectedNights[0];
  const night = resolvedNight(nightItem.night, state);
  // Keep the pitch and why it fits together as one description paragraph.
  const description = night.id === 'middle-ground'
    ? 'Quiet enough for a long conversation and interesting enough to feel like a night out, it keeps things intimate, adds something new, and never gets hectic.'
    : `${night.reasonLine} ${nightItem.whyItWorks}`;

  const suggestion = state.shared.suggestion;
  const isConfirmed = state.shared.confirmedNightId === night.id;

  // Photo-led beats keep their labels for clarity and accessibility.
  const timelineHtml = night.beats.map((beat, i) => {
    const image = beat.image || SLOT_POOLS[slotKey(nightItem.night.beats[i].name)][0].image;
    const locked = Boolean(suggestion?.nightId === night.id);
    return `
      <div class="milo-timeline-item milo-visual-beat">
        <div class="milo-timeline-track" aria-hidden="true">
          <span class="milo-beat-number">${i + 1}</span>
          ${i < night.beats.length - 1 ? '<div class="milo-timeline-line"></div>' : ''}
        </div>
        <div class="milo-beat-card">
          <img class="milo-beat-image" src="${image}" alt="" loading="lazy" />
          <div class="milo-beat-copy">
            <span class="milo-timeline-name">${beat.name}</span>
            <span class="milo-timeline-desc">${beat.desc}</span>
            ${!isConfirmed ? `<button class="milo-customise-btn" data-customise-slot="${i}" aria-label="Customise ${beat.name}" ${locked ? 'disabled title="This night has already been suggested"' : ''}>Customise <span aria-hidden="true">↗</span></button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  // Closing state (§2.9 & Acceptance Criteria)
  if (isConfirmed) {
    return `
      <div class="milo-s7-container milo-closing-state" data-session-id="${sessionId}">
        <header class="milo-header">
          <span class="milo-wordmark">milo.</span>
        </header>

        <div class="milo-closing-content">
          <div class="milo-closing-monograms">
            <div class="milo-mono-circle mono-left">A</div>
            <div class="milo-mono-circle mono-right">S</div>
          </div>
          <h1 class="milo-headline">You're both in.</h1>
          <p class="milo-closing-sub">${night.name}. A little time for the two of you.</p>

          ${renderNightTiming(night.id, sessionId)}

          <div class="milo-closing-plan">
            <div class="milo-section-label">YOUR PLAN</div>
            ${timelineHtml}
          </div>
        </div>

        <div class="milo-closing-footer">
          <button class="milo-pill-btn-secondary" id="miloSharePlan-${sessionId}">
            Share plan on WhatsApp
          </button>
          ${isDemo() ? `<button class="milo-text-button" id="miloResetBtn-${sessionId}">
            Start over
          </button>` : ''}
        </div>
      </div>
    `;
  }

  const isPartnerPick = suggestion && suggestion.nightId === night.id && suggestion.by !== sessionId;
  const isMyPick = suggestion && suggestion.nightId === night.id && suggestion.by === sessionId;
  const isPartnerOtherPick = suggestion && suggestion.nightId !== night.id && suggestion.by !== sessionId;

  // Header banner if partner suggested something else
  let partnerBannerHtml = '';
  if (isPartnerOtherPick) {
    const suggestedNight = sharedData.selectedNights.find(sn => sn.night.id === suggestion.nightId)?.night;
    const nameStr = suggestedNight ? suggestedNight.name : 'a night';
    partnerBannerHtml = `
      <div class="milo-partner-banner" id="miloBannerOtherNight-${sessionId}">
        <span>${partnerName} suggested ${nameStr}. Take a look.</span>
        <span class="milo-banner-arrow">→</span>
      </div>
    `;
  }

  // Primary CTA according to state
  let ctaAreaHtml = '';
  if (isMyPick) {
    ctaAreaHtml = `
      <div class="milo-cta-suggested-notice">
        Suggested. We'll let you know when ${partnerName}'s in.
      </div>
    `;
  } else if (isPartnerPick) {
    ctaAreaHtml = `
      <button class="milo-cta-button" id="miloConfirmNight-${sessionId}">
        This is our night
      </button>
    `;
  } else if (isPartnerOtherPick) {
    ctaAreaHtml = `
      <button class="milo-cta-button" id="miloSuggestNight-${sessionId}">
        Suggest this instead
      </button>
    `;
  } else {
    ctaAreaHtml = `
      <button class="milo-cta-button" id="miloSuggestNight-${sessionId}">
        Suggest this to ${partnerName}
      </button>
    `;
  }

  return `
    <div class="milo-s7-container" data-session-id="${sessionId}">
      ${partnerBannerHtml}

      <!-- Top Hero Section -->
      <div class="milo-s7-hero">
        <img src="${night.defaultImage}" alt="${night.name}" class="milo-s7-hero-img" />
        <div class="milo-s7-scrim"></div>

        <button class="milo-s7-back-btn" id="miloS7Back-${sessionId}" aria-label="Back to three nights">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        <div class="milo-s7-hero-text">
          <div class="milo-s7-num-row">
            <span class="milo-s7-num">${nightItem.num}</span>
            ${isPartnerPick ? `<span class="milo-partner-pick-label">${partnerPickLabel}</span>` : ''}
          </div>
          <h1 class="milo-s7-night-name">${night.name}</h1>
        </div>
      </div>

      <!-- Detail Body (on Ivory) -->
      <div class="milo-s7-body">
        <p class="milo-s7-reason">${description}</p>

        <div class="milo-timeline-section">
          ${timelineHtml}
        </div>

        <aside class="milo-s7-skip-line milo-s7-skip-callout">Skip this one if ${night.skipIf}</aside>

        <div class="milo-s7-actions">
          <button class="milo-secondary-link" id="miloSeeOtherNights-${sessionId}">
            See the other two
          </button>
          ${ctaAreaHtml}
        </div>
      </div>
    </div>
  `;
}

export function attachScreen07Listeners(container, sessionId = 'aarav') {
  if (isSoloPlanning(store.getState(), sessionId)) return attachSoloNightListeners(container, sessionId);
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey] || {};
  const sharedData = computeSharedOutput(state.sessionA, state.sessionB);
  const activeNightId = sessionData.activeNightId || (sharedData.selectedNights[0]?.night.id || 'middle-ground');

  // A parallel, per-slot feed. Cancel leaves the itinerary untouched.
  container.querySelectorAll('[data-customise-slot]').forEach(button => {
    button.addEventListener('click', () => {
      const slot = Number(button.dataset.customiseSlot);
      const original = sharedData.selectedNights.find(item => item.night.id === activeNightId)?.night;
      if (!original || store.getState().shared.suggestion?.nightId === activeNightId) return;
      const current = resolvedNight(original, store.getState()).beats[slot];
      const options = SLOT_POOLS[slotKey(original.beats[slot].name)].filter(option => option.name !== current.name);
      let index = 0;
      const dialog = document.createElement('dialog');
      dialog.className = 'milo-slot-feed';
      dialog.setAttribute('aria-label', `Customise ${original.beats[slot].name}`);
      dialog.innerHTML = `
        <div class="milo-slot-feed-inner">
          <div class="milo-slot-feed-top"><span>JUST THE ${original.beats[slot].name.toUpperCase()} SLOT</span><button data-close aria-label="Close alternatives">✕</button></div>
          <p class="milo-slot-demo">Demo ideas, not bookable venues.</p>
          <div class="milo-slot-candidate"><img alt="" /><h2></h2><p></p></div>
          <div class="milo-slot-nav"><button data-prev aria-label="Previous alternative">←</button><span aria-live="polite"></span><button data-next aria-label="Next alternative">→</button></div>
          <button class="milo-cta-button" data-pick>Use this instead</button>
          <button class="milo-secondary-link" data-close>Keep the current plan</button>
        </div>`;
      container.appendChild(dialog);
      const render = () => {
        const option = options[index];
        dialog.querySelector('img').src = option.image;
        dialog.querySelector('h2').textContent = option.name;
        dialog.querySelector('.milo-slot-candidate p').textContent = option.desc;
        dialog.querySelector('[aria-live]').textContent = `${index + 1} of ${options.length}`;
        dialog.querySelector('[data-prev]').disabled = index === 0;
        dialog.querySelector('[data-next]').disabled = index === options.length - 1;
      };
      const move = delta => { index = Math.max(0, Math.min(options.length - 1, index + delta)); render(); };
      const close = () => { dialog.close(); dialog.remove(); button.focus(); };
      dialog.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', close));
      dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
      dialog.querySelector('[data-prev]').addEventListener('click', () => move(-1));
      dialog.querySelector('[data-next]').addEventListener('click', () => move(1));
      let start;
      const card = dialog.querySelector('.milo-slot-candidate');
      card.addEventListener('touchstart', event => { start = event.touches[0].clientX; }, { passive: true });
      card.addEventListener('touchend', event => {
        const distance = event.changedTouches[0].clientX - start;
        if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1);
      }, { passive: true });
      dialog.querySelector('[data-pick]').addEventListener('click', () => {
        const live = store.getState();
        if (live.shared.suggestion?.nightId === activeNightId || live.shared.confirmedNightId === activeNightId) { close(); return; }
        const overrides = live.shared.itineraryOverrides || {};
        dialog.close();
        dialog.remove();
        store.updateShared({ itineraryOverrides: { ...overrides, [activeNightId]: { ...overrides[activeNightId], [slot]: options[index] } } });
        container.querySelector(`[data-customise-slot="${slot}"]`)?.focus();
      });
      render();
      dialog.showModal();
    });
  });

  const backBtn = container.querySelector(`#miloS7Back-${sessionId}`);
  const seeOtherBtn = container.querySelector(`#miloSeeOtherNights-${sessionId}`);

  const goBackToS6 = () => {
    store.setSessionScreen(sessionId, 's6');
  };

  if (backBtn) backBtn.addEventListener('click', goBackToS6);
  if (seeOtherBtn) seeOtherBtn.addEventListener('click', goBackToS6);

  const suggestBtn = container.querySelector(`#miloSuggestNight-${sessionId}`);
  if (suggestBtn) {
    suggestBtn.addEventListener('click', () => {
      store.updateShared({
        suggestion: {
          by: sessionId,
          nightId: activeNightId
        }
      });
    });
  }

  const confirmBtn = container.querySelector(`#miloConfirmNight-${sessionId}`);
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      store.updateShared({
        confirmedNightId: activeNightId
      });
      // Both sessions transition to closing state in place
      store.setSessionScreen('aarav', 's7');
      store.setSessionScreen('sneha', 's7');
    });
  }

  const bannerOther = container.querySelector(`#miloBannerOtherNight-${sessionId}`);
  if (bannerOther) {
    bannerOther.addEventListener('click', () => {
      const otherNightId = state.shared.suggestion?.nightId;
      if (otherNightId) {
        store.updateSession(sessionId, {
          activeNightId: otherNightId
        });
      }
    });
  }

  const shareBtn = container.querySelector(`#miloSharePlan-${sessionId}`);
  if (shareBtn) {
    const closingNight = resolvedNight(sharedData.selectedNights.find(sn => sn.night.id === state.shared.confirmedNightId)?.night
      || sharedData.selectedNights[0].night, store.getState());
    const partnerName = sessionId === 'sneha' ? 'Aarav' : 'Sneha';
    attachNightTiming(container, closingNight.id, sessionId);
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(planText(closingNight, partnerName))}`, '_blank', 'noopener');
      });
    }
  }

  const resetBtn = container.querySelector(`#miloResetBtn-${sessionId}`);
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Confirm before wiping the plan
      const box = document.createElement('div');
      box.className = 'milo-reset-confirm';
      box.innerHTML = `
        <p>Start over? This clears tonight's plan.</p>
        <div class="milo-reset-confirm-actions">
          <button type="button" class="milo-reset-no">Keep it</button>
          <button type="button" class="milo-reset-yes">Yes, start over</button>
        </div>`;
      resetBtn.replaceWith(box);
      box.querySelector('.milo-reset-no').addEventListener('click', () => box.replaceWith(resetBtn));
      box.querySelector('.milo-reset-yes').addEventListener('click', () => store.reset());
    });
  }
}
