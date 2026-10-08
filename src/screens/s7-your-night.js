// ==========================================================
// MILO — SCREEN 7: YOUR NIGHT (S7)
// Hero image, timeline of 3 beats, reason line, skip line,
// suggestion and agreement state machine.
// ==========================================================

import { isSoloPlanning } from '../logic/planning.js';
import { renderSoloNight, attachSoloNightListeners } from './solo-night.js';
import { renderItinerary, attachItinerary } from '../components/itinerary.js';
import { updateSlotAndRestore } from '../logic/slot-update.js';
import { store } from '../domain/store.js';
import { computeSharedOutput } from '../logic/shared.js';
import { renderNightTiming, attachNightTiming, timingForNight, timingLabel } from '../components/night-timing.js';
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

  const timelineHtml = renderItinerary(night, nightItem.night, {
    stacked: !isConfirmed, editable: !isConfirmed, lockedSlots: Boolean(suggestion?.nightId === night.id)
  });

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
      <button type="button" class="milo-partner-banner" id="miloBannerOtherNight-${sessionId}">
        <span>${partnerName} suggested ${nameStr}. Take a look.</span>
        <span class="milo-banner-arrow" aria-hidden="true">→</span>
      </button>
    `;
  }

  // Primary CTA according to state
  let ctaAreaHtml = '';
  if (isMyPick) {
    ctaAreaHtml = `
      <div class="milo-cta-suggested-notice">
        Suggested. Check back here for ${partnerName}'s response. No notification will be sent.
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
    <div class="milo-s7-container milo-visual-plan" data-session-id="${sessionId}">
      ${partnerBannerHtml}

      <!-- Top Hero Section -->
      <div class="milo-s7-hero">
        

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
        <div class="milo-plan-label">YOUR NIGHT, IN THREE STOPS</div>

        <div class="milo-plan-grid">
          ${timelineHtml}
        </div>

        <details class="milo-plan-why"><summary>Why this night fits <span aria-hidden="true">+</span></summary><p>${description}</p><p>Skip this one if ${night.skipIf}</p></details>

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

  attachItinerary(container, () => {
    const live = store.getState();
    const original = sharedData.selectedNights.find(item => item.night.id === activeNightId)?.night;
    return { original, night: original && resolvedNight(original, live), locked: live.shared.suggestion?.nightId === activeNightId || live.shared.confirmedNightId === activeNightId };
  }, (slot, option) => {
    const overrides = store.getState().shared.itineraryOverrides || {};
    updateSlotAndRestore(container, sessionId, slot, () => {
      store.updateShared({ itineraryOverrides: { ...overrides, [activeNightId]: { ...overrides[activeNightId], [slot]: option } } });
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
