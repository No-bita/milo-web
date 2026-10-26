// Plan screen (Phase 1 together mode): the creator's single plan destination
// after sharing. Their own provisional plan while the partner picks, the joint
// plan in place once both halves are in, and the agreed closing state - all on
// the same screen. Server mode only; local/demo flows keep the old screens.
// Refreshes come from app open / return-to-tab (wired in app.js), never a timer.
import { store } from '../domain/store.js';
import { readSeat } from '../domain/network-adapter.js';
import { hasServerSeat, currentPlanResult, togetherOutput, postPlanAction } from '../domain/plan-view.js';
import { computePlanningOutput } from '../logic/planning.js';
import { partnerLabel, monograms, escapeHtml, sentenceName, hasPartnerName } from '../logic/partner.js';
import { renderItinerary } from '../components/itinerary.js';
import { renderNightTiming, attachNightTiming, timingForNight, timingLabel } from '../components/night-timing.js';
import { calendarFile } from './booked.js';
import { renderGiftsPanel, attachGiftsPanel } from '../components/gifts-panel.js';
import { currentGifts, refreshGifts } from '../domain/gifts.js';
import { renderConciergePanel, attachConciergePanel } from '../components/concierge-panel.js';
import { currentConcierge, refreshConcierge, trackSeeOther } from '../domain/concierge.js';
import '../styles/plan-screen.css';

// Edits-off copy (mockup 13), same wording as the reviewed shared-result work.
const EDITS_PAUSED_BANNER = 'Edits paused so you both see the same night.';
const EDITS_OFF_FOOTNOTE = 'Time and stop changes stay off for now.';

// Both seats: the creator's post-share screens and the partner's post-deck
// screens render from the server plan. Flag-off/demo flows keep the old screens.
export function planScreenApplies(sessionId, screen) {
  if (!hasServerSeat()) return false;
  const role = readSeat()?.role;
  if (role === 'initiator') return sessionId === 'aarav' && ['s4_waiting', 's5', 's6', 's7'].includes(screen);
  if (role === 'partner') return sessionId === 'sneha' && ['s5', 's6', 's7'].includes(screen);
  return false;
}

export function renderPlanScreen(sessionId = 'aarav') {
  const state = store.getState();
  const confirmedId = state.shared.confirmedNightId;
  const result = currentPlanResult(state);
  if (confirmedId && result) return renderAgreed(state, sessionId, confirmedId);
  if (result) return renderJointNight(state, sessionId);
  // No server result yet: the creator sees their own provisional plan; the
  // partner gets a neutral holding state - never a one-sided "shared" guess.
  if (readSeat()?.role === 'partner') return renderPartnerPending(state, sessionId);
  return renderProvisional(state, sessionId);
}

function renderPartnerPending(state, sessionId) {
  const partnerName = partnerLabel(state, sessionId);
  return `
    <div class="milo-s7-container milo-visual-plan" data-session-id="${sessionId}">
      <header class="milo-header">
        <span class="milo-wordmark">milo.</span>
      </header>
      <div class="milo-s7-body">
        <h1 class="milo-headline">Putting your night together.</h1>
        <p class="milo-plan-status" role="status"><i aria-hidden="true"></i><span>Come back to this screen to check.</span></p>
      </div>
    </div>
  `;
}

// ---------- Provisional: the creator's own plan until the partner's half lands ----------

function statusLine(state, sessionId) {
  const label = partnerLabel(state, sessionId);
  if (state.shared.partnerFinished) return `${sentenceName(label)} finished - your night is on its way.`;
  if (state.shared.partnerJoined) return `${sentenceName(label)} is choosing their half.`;
  return `Waiting for ${escapeHtml(label)} to join.`;
}

function renderProvisional(state, sessionId) {
  // The provisional plan reuses the existing one-person generator on the
  // creator's own picks; the partner's signals are not read or averaged in.
  const provisionalState = { ...state, sessionA: { ...state.sessionA, planningMode: 'solo' } };
  const nights = computePlanningOutput(provisionalState, sessionId).selectedNights;
  const item = nights.find(entry => entry.night.id === state.sessionA.activeNightId) || nights[0];
  const night = item.night;
  const tiles = renderItinerary(night, item.night, { stacked: true, editable: false });
  return `
    <div class="milo-s7-container milo-visual-plan" data-session-id="${sessionId}">
      <div class="milo-s7-hero">
        <button class="milo-s7-back-btn" id="miloPsBack-${sessionId}" aria-label="Back to the invite">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div class="milo-s7-hero-text">
          <span class="milo-plan-eyebrow">Your plan for now</span>
          <h1 class="milo-s7-night-name">${night.name}</h1>
        </div>
      </div>
      <div class="milo-s7-body">
        <p class="milo-plan-status" role="status"><i aria-hidden="true"></i><span>${statusLine(state, sessionId)}</span></p>
        <div class="milo-plan-grid milo-plan-static">${tiles}</div>
        <details class="milo-plan-why"><summary>Why this night fits <span aria-hidden="true">+</span></summary><p>${night.reasonLine}</p><p>Skip this one if ${night.skipIf}</p></details>
        <div class="milo-s7-actions">
          <button class="milo-secondary-link" id="miloPsOther-${sessionId}">See the other two</button>
        </div>
      </div>
    </div>
  `;
}

// ---------- Joint: both halves in, shared projection, edits paused ----------

function renderJointNight(state, sessionId) {
  const output = togetherOutput(state);
  const nights = output.selectedNights;
  const partnerName = partnerLabel(state, sessionId);
  const myActiveId = (sessionId === 'sneha' ? state.sessionB : state.sessionA).activeNightId;
  const item = nights.find(entry => entry.night.id === myActiveId) || nights[0];
  const night = item.night;
  const suggestion = state.shared.suggestion;
  const isPartnerPick = suggestion && suggestion.nightId === night.id && suggestion.by !== sessionId;
  const isMyPick = suggestion && suggestion.nightId === night.id && suggestion.by === sessionId;
  const isPartnerOtherPick = suggestion && suggestion.nightId !== night.id && suggestion.by !== sessionId;

  const tiles = renderItinerary(night, night, { stacked: true, editable: false });
  const description = night.id === 'middle-ground'
    ? 'Quiet enough for a long conversation and interesting enough to feel like a night out, it keeps things intimate, adds something new, and never gets hectic.'
    : `${night.reasonLine} ${item.whyItWorks || ''}`;

  let bannerHtml = '';
  if (isPartnerOtherPick) {
    const suggestedNight = nights.find(entry => entry.night.id === suggestion.nightId)?.night;
    bannerHtml = `
      <button type="button" class="milo-partner-banner" id="miloPsBanner-${sessionId}">
        <span>${sentenceName(partnerName)} suggested ${suggestedNight ? suggestedNight.name : 'a night'}. Take a look.</span>
        <span class="milo-banner-arrow" aria-hidden="true">→</span>
      </button>
    `;
  }

  let ctaHtml = '';
  if (isMyPick) {
    ctaHtml = `<div class="milo-cta-suggested-notice">Suggested. Check back for ${escapeHtml(partnerName)}'s response. No notification sent.</div>`;
  } else if (isPartnerPick) {
    ctaHtml = `<button class="milo-cta-button" id="miloPsConfirm-${sessionId}">This is our night</button>`;
  } else if (isPartnerOtherPick) {
    ctaHtml = `<button class="milo-cta-button" id="miloPsSuggest-${sessionId}">Suggest this instead</button>`;
  } else {
    ctaHtml = `<button class="milo-cta-button" id="miloPsSuggest-${sessionId}">Suggest this to ${escapeHtml(partnerName)}</button>`;
  }

  return `
    <div class="milo-s7-container milo-visual-plan" data-session-id="${sessionId}">
      ${bannerHtml}
      <div class="milo-s7-hero">
        <div class="milo-s7-hero-text">
          <div class="milo-s7-num-row">
            <span class="milo-s7-num">${item.num}</span>
            ${isPartnerPick ? `<span class="milo-partner-pick-label">${escapeHtml(partnerName.toUpperCase())}'S PICK</span>` : ''}
          </div>
          <h1 class="milo-s7-night-name">${night.name}</h1>
        </div>
      </div>
      <div class="milo-s7-body">
        <div class="milo-s7-edits-paused" role="note">${EDITS_PAUSED_BANNER}</div>
        <div class="milo-plan-grid milo-plan-static">${tiles}</div>
        <details class="milo-plan-why"><summary>Why this night fits <span aria-hidden="true">+</span></summary><p>${description}</p><p>Skip this one if ${night.skipIf}</p></details>
        <div class="milo-s7-actions">
          <button class="milo-secondary-link" id="miloPsOther-${sessionId}">See the other two</button>
          ${ctaHtml}
        </div>
        <p class="milo-s7-edits-footnote">${EDITS_OFF_FOOTNOTE}</p>
        <p class="milo-plan-note" id="miloPsNote-${sessionId}" role="alert" hidden></p>
      </div>
    </div>
  `;
}

// ---------- Agreed: confirmed night, timing, share + calendar ----------

function renderAgreed(state, sessionId, confirmedId) {
  const output = togetherOutput(state);
  const item = output.selectedNights.find(entry => entry.night.id === confirmedId) || output.selectedNights[0];
  const night = item.night;
  const tiles = renderItinerary(night, night, { stacked: false, editable: false });
  return `
    <div class="milo-s7-container milo-closing-state" data-session-id="${sessionId}">
      <header class="milo-header">
        <span class="milo-wordmark">milo.</span>
      </header>
      <div class="milo-closing-content">
        <div class="milo-closing-monograms">
          <div class="milo-mono-circle mono-left">${monograms(state, sessionId)[0]}</div>
          <div class="milo-mono-circle mono-right">${monograms(state, sessionId)[1]}</div>
        </div>
        <h1 class="milo-headline">You're both in.</h1>
        <p class="milo-closing-sub">${night.name}.</p>
        ${renderNightTiming(night.id, sessionId)}
        ${renderConciergePanel(night, sessionId)}
        <div class="milo-closing-plan">
          <div class="milo-section-label">YOUR PLAN</div>
          <div class="milo-plan-static">${tiles}</div>
        </div>
        ${renderGiftsPanel(night, sessionId)}
      </div>
      <div class="milo-closing-footer">
        <button class="milo-pill-btn-secondary" id="miloPsShare-${sessionId}">Share plan on WhatsApp</button>
        <!-- Calendar sync commented out for now:
        <button class="milo-pill-btn-secondary" id="miloPsCalendar-${sessionId}">Add to calendar</button>
        -->
        <p class="milo-plan-note" id="miloPsNote-${sessionId}" role="alert" hidden></p>
      </div>
    </div>
  `;
}

// ---------- Listeners ----------

export function attachPlanScreenListeners(container, sessionId = 'aarav') {
  const state = store.getState();
  const confirmedId = state.shared.confirmedNightId;
  const result = currentPlanResult(state);

  const note = (text) => {
    const el = container.querySelector(`#miloPsNote-${sessionId}`);
    if (el) { el.textContent = text; el.hidden = !text; }
  };

  // Night cycling: provisional (own picks) and joint (server nights) both keep
  // "See the other two" on this screen instead of routing to the old list screen.
  container.querySelector(`#miloPsOther-${sessionId}`)?.addEventListener('click', () => {
    const live = store.getState();
    const nights = currentPlanResult(live)
      ? togetherOutput(live).selectedNights
      : computePlanningOutput({ ...live, sessionA: { ...live.sessionA, planningMode: 'solo' } }, sessionId).selectedNights;
    const ids = nights.map(entry => entry.night.id);
    const active = (sessionId === 'sneha' ? live.sessionB : live.sessionA).activeNightId;
    const next = ids[(ids.indexOf(active) + 1) % ids.length] || ids[0];
    // PMF: browsing between Milo's three nights (joint view only, not the provisional plan).
    if (currentPlanResult(live)) trackSeeOther(next);
    store.updateSession(sessionId, { activeNightId: next });
  });

  container.querySelector(`#miloPsBack-${sessionId}`)?.addEventListener('click', () => {
    store.setSessionScreen(sessionId, 's4_invite');
  });

  container.querySelector(`#miloPsBanner-${sessionId}`)?.addEventListener('click', () => {
    const otherNightId = store.getState().shared.suggestion?.nightId;
    if (otherNightId) store.updateSession(sessionId, { activeNightId: otherNightId });
  });

  const sendAction = async (button, type, nightId) => {
    if (!button || button.disabled) return;
    button.disabled = true;
    note('');
    const outcome = await postPlanAction(type, nightId);
    if (!outcome.ok) {
      note("Couldn't reach Milo. Try again.");
      button.disabled = false;
    }
  };

  const activeNightId = () => {
    const live = store.getState();
    const nights = togetherOutput(live)?.selectedNights || [];
    const active = (sessionId === 'sneha' ? live.sessionB : live.sessionA).activeNightId;
    const item = nights.find(entry => entry.night.id === active) || nights[0];
    return item?.night.id;
  };

  const suggestBtn = container.querySelector(`#miloPsSuggest-${sessionId}`);
  if (suggestBtn) suggestBtn.addEventListener('click', () => sendAction(suggestBtn, 'suggest', activeNightId()));
  const confirmBtn = container.querySelector(`#miloPsConfirm-${sessionId}`);
  if (confirmBtn) confirmBtn.addEventListener('click', () => sendAction(confirmBtn, 'confirm', activeNightId()));

  if (confirmedId && result) {
    const item = togetherOutput(state).selectedNights.find(entry => entry.night.id === confirmedId) || togetherOutput(state).selectedNights[0];
    const night = item.night;
    attachNightTiming(container, night.id, sessionId);
    const timing = timingForNight(night.id);
    attachGiftsPanel(container, night, sessionId, { timing });
    attachConciergePanel(container, night, sessionId, { timing });
    const concierge = currentConcierge();
    if (!concierge || (!concierge.can_request && !concierge.booking && timing)) refreshConcierge();
    // First visit, or the time was just set: fetch this phone's gifts view.
    // refreshGifts only writes on a real change, so this cannot loop.
    const gifts = currentGifts();
    if (!gifts || (!gifts.can_add && timing)) refreshGifts();
    container.querySelector(`#miloPsShare-${sessionId}`)?.addEventListener('click', () => {
      const partnerName = partnerLabel(store.getState(), sessionId);
      const steps = night.beats.map(beat => beat.name).join(' → ');
      const timing = timingForNight(night.id);
      const text = `Our night${hasPartnerName(partnerName) ? ` with ${partnerName}` : ''}: ${night.name}. ${steps}.${timing ? ` ${timingLabel(timing)}.` : ''}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });
    /* Calendar sync commented out for now:
    container.querySelector(`#miloPsCalendar-${sessionId}`)?.addEventListener('click', () => {
      const timing = timingForNight(night.id);
      const ics = timing ? calendarFile(night, timing) : null;
      if (!ics) { note('Set the time first, then add it to your calendar.'); return; }
      note('');
      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'milo-night.ics';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    */
  }
}
