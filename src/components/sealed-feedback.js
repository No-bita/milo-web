// "Easier than texting about it?" - asked once per plan, per person, anonymous.
import { store } from '../domain/store.js';
import { track } from '../analytics/analytics.js';

const ANSWERS = [['easier', 'Easier'], ['same', 'About the same'], ['harder', 'Harder']];

export function renderSealedFeedback(sessionId = 'aarav') {
  const key = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const answered = store.getState()[key]?.feedbackAnswer;
  if (answered) return `<p class="milo-feedback-thanks" role="status">Thank you. That helps.</p>`;
  return `<section class="milo-feedback" aria-labelledby="miloFeedbackQ">
    <p class="milo-feedback-q" id="miloFeedbackQ">Easier than texting about it?</p>
    <div class="milo-feedback-row">${ANSWERS.map(([id, label]) => `<button type="button" class="milo-pill-btn-secondary milo-feedback-btn" data-feedback="${id}">${label}</button>`).join('')}</div>
  </section>`;
}

export function attachSealedFeedback(container, sessionId = 'aarav') {
  container.querySelectorAll('[data-feedback]').forEach((button) => {
    button.addEventListener('click', () => {
      const answer = button.dataset.feedback;
      track('feedback_given', { answer });
      store.updateSession(sessionId, { feedbackAnswer: answer });
    });
  });
}
