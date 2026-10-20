import { store } from '../domain/store.js';
import '../styles/planning-sheet.css';

// Neutral illustrations stand in for portraits until approved photography exists.
const portrait = (together) => `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle cx="60" cy="60" r="60" fill="${together ? '#EDE6DF' : '#F3E8E5'}"/>${together ? '<circle cx="43" cy="43" r="14"/><circle cx="78" cy="49" r="14"/><path d="M17 95c0-24 12-34 26-34s26 10 26 34M53 101c0-24 11-34 25-34s25 10 25 34"/>' : '<circle cx="60" cy="42" r="19"/><path d="M25 101c0-28 15-40 35-40s35 12 35 40"/>'}</svg>`;

export function renderPlanningSheet(selected) {
  const dialog = document.createElement('dialog');
  dialog.className = 'milo-planning-sheet';
  dialog.setAttribute('aria-labelledby', 'miloPlanningTitle');
  dialog.setAttribute('aria-describedby', 'miloPlanningSubtitle');
  dialog.innerHTML = `
    <div class="milo-planning-handle" aria-hidden="true"></div>
    <button type="button" class="milo-planning-close" aria-label="Close planning choices">×</button>
    <h2 id="miloPlanningTitle">How would you like to plan?</h2>
    <p id="miloPlanningSubtitle">Milo makes the plan. You choose whose inputs.</p>
    <div class="milo-planning-options" role="group" aria-label="Whose inputs">
      ${[['solo', 'Just my inputs', "I'll share what we'd enjoy."], ['together', 'Both our inputs', "We'll each share our preferences."]].map(([mode, title, copy]) => `
      <button type="button" class="milo-planning-option" data-planning-mode="${mode}" aria-pressed="${selected === mode}">
        <span class="milo-planning-portrait">${portrait(mode === 'together')}<span class="milo-planning-check" aria-hidden="true">✓</span></span>
        <span class="milo-planning-option-title">${title}</span><span class="milo-planning-option-copy">${copy}</span>
      </button>`).join('')}
    </div>
    <button type="button" class="milo-planning-continue">Continue</button>
    <p class="milo-planning-private">Your answers stay private.</p>`;
  return dialog;
}

export function attachPlanningSheetListeners(dialog, { container, sessionId, trigger, getSelected, setSelected }) {
  const position = () => {
    const rect = container.getBoundingClientRect();
    dialog.style.left = `${rect.left}px`;
    dialog.style.width = `${rect.width}px`;
    dialog.style.bottom = `${Math.max(0, window.innerHeight - rect.bottom)}px`;
  };
  const dismiss = () => dialog.close();
  dialog.querySelector('.milo-planning-close').addEventListener('click', dismiss);
  dialog.querySelectorAll('[data-planning-mode]').forEach(button => {
    button.addEventListener('click', () => {
      setSelected(button.dataset.planningMode);
      dialog.querySelectorAll('[data-planning-mode]').forEach(option => option.setAttribute('aria-pressed', String(option.dataset.planningMode === getSelected())));
    });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss();
  });
  dialog.querySelector('.milo-planning-continue').addEventListener('click', () => {
    // Only Continue commits the choice. Nothing is shared or invited here.
    dismiss();
    store.updateSession(sessionId, { planningMode: getSelected(), intents: [], feedbackAnswer: null, screen: 's1' });
  });
  const cleanup = () => {
    window.removeEventListener('resize', position);
    dialog.remove();
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    if (container.planningSheetCleanup === cleanup) delete container.planningSheetCleanup;
  };
  dialog.addEventListener('close', cleanup, { once: true });
  container.planningSheetCleanup = cleanup;
  window.addEventListener('resize', position);
  return { position };
}

export function openPlanningSheet(container, sessionId = 'aarav', trigger = null) {
  if (container.querySelector('.milo-planning-sheet')) return;
  let selected = store.getState()[sessionId === 'sneha' ? 'sessionB' : 'sessionA'].planningMode || 'solo';
  const dialog = renderPlanningSheet(selected);
  container.append(dialog);
  const { position } = attachPlanningSheetListeners(dialog, {
    container,
    sessionId,
    trigger,
    getSelected: () => selected,
    setSelected: value => { selected = value; }
  });
  position();
  dialog.showModal();
  dialog.querySelector(`[data-planning-mode="${selected}"]`).focus({ preventScroll: true });
}
