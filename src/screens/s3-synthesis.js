// Personal learning checkpoint, shown only to the initiator.
import { computePersonalSynthesis } from '../logic/synthesis.js';
import { renderImageHtml } from '../assets/manifest.js';
import { store } from '../domain/store.js';
import '../styles/s3-motion.css';

function escapeText(text) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

export function renderScreen03(sessionId = 'aarav', readyObservations) {
  const session = store.getState()[sessionId === 'sneha' ? 'sessionB' : 'sessionA'];
  const observations = readyObservations ?? computePersonalSynthesis(session.intents || [], session.reactions || []);
  const rows = observations.map((obs, i) => `
    <li class="milo-obs-row" style="--i:${i}">
      <p class="milo-obs-text">${escapeText(obs)}</p>
    </li>
  `).join('');

  return `
    <div class="milo-s3-container" data-session-id="${sessionId}" style="--obs-count:${observations.length}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS3Back-${sessionId}" aria-label="Back to discovery">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><path d="M19 12H5m7 7-7-7 7-7" /></svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>
      <div class="milo-s3-progress" aria-hidden="true"><span></span></div>
      <div class="milo-s3-content">
        <div class="milo-s3-collage${observations.length ? '' : ' is-empty'}" aria-hidden="true">
          <div class="milo-s3-photo milo-s3-photo-food">${renderImageHtml('prefFood', { loading: 'eager' })}</div>
          <div class="milo-s3-photo milo-s3-photo-dining">${renderImageHtml('prefRomantic', { loading: 'eager' })}</div>
          <div class="milo-s3-photo milo-s3-photo-cafe">${renderImageHtml('prefLowKey', { loading: 'eager' })}</div>
        </div>
        <div class="milo-s3-intro">
          <h1 class="milo-headline">We're getting a feel<br>for your night.</h1>
        </div>
        ${observations.length ? `<ul class="milo-observations-list" aria-label="What we're learning">${rows}</ul>` : `
          <div class="milo-s3-empty">
            <p>We're still getting to know what you like.</p>
            <p>Explore a few ideas to help shape your night.</p>
          </div>`}
      </div>
      <footer class="milo-s3-footer">
        <button class="milo-cta-button milo-s3-start-afresh" id="miloS3Restart-${sessionId}">Start afresh</button>
        <button class="milo-cta-button" id="miloS3Cta-${sessionId}">Looks good</button>
      </footer>
    </div>
  `;
}

export function attachScreen03Listeners(container, sessionId = 'aarav') {
  // Revisit the last idea without appending a duplicate reaction when re-rating it.
  const revisitDiscovery = () => {
    const session = store.getState()[sessionId === 'sneha' ? 'sessionB' : 'sessionA'];
    const reactions = session.reactions || [];
    store.updateSession(sessionId, {
      screen: 's2',
      currentCardIndex: Math.max(0, reactions.length - 1),
      reactions: reactions.slice(0, -1)
    });
  };
  container.querySelector(`#miloS3Back-${sessionId}`)?.addEventListener('click', revisitDiscovery);
  container.querySelector(`#miloS3Restart-${sessionId}`)?.addEventListener('click', () => {
    store.setSessionScreen(sessionId, 's1');
  });
  container.querySelector(`#miloS3Cta-${sessionId}`)?.addEventListener('click', () => {
    if (sessionId === 'sneha') return store.setSessionScreen(sessionId, 's5');
    // The solo or together choice is made once, at the start. Only ask here if it was never made.
    const mode = store.getState().sessionA.planningMode;
    store.setSessionScreen(sessionId, mode === 'solo' ? 's6' : mode === 'together' ? 's4_invite' : 'planning_path_review');
  });
}
