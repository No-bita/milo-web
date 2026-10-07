import { store } from '../domain/store.js';
import '../styles/planning-path.css';

// Screen numbers in the reference flow differ from the controller IDs:
// post-mood = after code s1; pre-invite = after code s3 (the reflection).
export function renderPlanningPath(sessionId = 'aarav') {
  const session = store.getState().sessionA;
  const isEcho = session.screen === 'planning_path_review';
  const mode = session.planningMode;
  return `
    <div class="milo-path-container" data-session-id="${sessionId}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloPathBack" aria-label="${isEcho ? 'Back to your reflection' : 'Back to your mood'}">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>
        </button>
        <span class="milo-wordmark">milo.</span><div class="milo-header-space"></div>
      </header>
      <main class="milo-path-content">
        <p class="milo-path-eyebrow">${isEcho ? 'YOUR NIGHT, YOUR CALL' : 'TWO WAYS TO PLAN'}</p>
        <h1 class="milo-headline">${isEcho ? 'Keep the reins.<br>Or make it together.' : 'How would you like<br>to plan this?'}</h1>
        <p class="milo-path-intro">${isEcho ? "We've got a feel for your night. Want to choose the plan yourself, or add their picks too?" : 'Take the lead, or let your partner help shape the night. Either way, Milo helps with the plan.'}</p>
        <div class="milo-path-options" role="group" aria-label="How to plan your night">
          <button type="button" class="milo-path-option ${mode === 'solo' ? 'is-selected' : ''}" data-planning-mode="solo" aria-pressed="${mode === 'solo'}">
            <span class="milo-path-option-top"><span class="milo-path-symbol" aria-hidden="true">01</span>${mode === 'solo' ? '<span class="milo-path-picked">Your choice</span>' : ''}</span>
            <span class="milo-path-option-title">I'll plan it myself</span>
            <span class="milo-path-option-copy">${isEcho ? 'See nights shaped by your picks. No invite, no waiting.' : 'You make the picks. Keep the plan a little surprise.'}</span>
            <span class="milo-path-option-action">${isEcho ? 'See my nights' : 'Keep going'} <span aria-hidden="true">→</span></span>
          </button>
          <button type="button" class="milo-path-option ${mode === 'together' ? 'is-selected' : ''}" data-planning-mode="together" aria-pressed="${mode === 'together'}">
            <span class="milo-path-option-top"><span class="milo-path-symbol" aria-hidden="true">02</span>${mode === 'together' ? '<span class="milo-path-picked">Your choice</span>' : ''}</span>
            <span class="milo-path-option-title">Bring in my partner</span>
            <span class="milo-path-option-copy">${isEcho ? 'Invite them to add their picks before choosing a night.' : "Start with your picks. You'll invite them after."}</span>
            <span class="milo-path-option-action">${isEcho ? 'Go to the invite' : 'Keep going'} <span aria-hidden="true">→</span></span>
          </button>
        </div>
        <p class="milo-path-footnote">${isEcho ? 'Prototype note: partner picks sync only in this browser. No cross-device sync or notifications yet.' : "No invite goes out now. You can change your mind after your picks."}</p>
      </main>
    </div>`;
}

export function attachPlanningPathListeners(container, sessionId = 'aarav') {
  const isEcho = store.getState().sessionA.screen === 'planning_path_review';
  container.querySelector('#miloPathBack')?.addEventListener('click', () => {
    store.setSessionScreen(sessionId, isEcho ? 's3' : 's1');
  });
  container.querySelectorAll('[data-planning-mode]').forEach(button => {
    button.addEventListener('click', () => {
      const planningMode = button.dataset.planningMode;
      store.updateSession(sessionId, {
        planningMode,
        screen: isEcho ? (planningMode === 'solo' ? 's6' : 's4_invite') : 'threshold'
      });
    });
  });
}
