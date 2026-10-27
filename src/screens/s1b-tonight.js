// Intent model v3.1 only: "Tonight is mostly about…" (up to two activity tiles)
// and the model's three four-point pairs (energy, social setting, novelty).
// Between the moods and the deck; the deck is chosen from these answers.
import { store } from '../domain/store.js';
import { MODE_OPTIONS, PAIR_OPTIONS, cleanExtras, pairsDone } from '../logic/intent-quiz.js';
import { escapeHtml } from '../logic/partner.js';

const STEPS = [
  { answer: 'def_left', side: 'left', words: 'Definitely' },
  { answer: 'lean_left', side: 'left', words: 'A bit' },
  { answer: 'lean_right', side: 'right', words: 'A bit' },
  { answer: 'def_right', side: 'right', words: 'Definitely' }
];
const keyOf = (sessionId) => (sessionId === 'sneha' ? 'sessionB' : 'sessionA');
const extrasOf = (sessionId) => cleanExtras(store.getState()[keyOf(sessionId)].v31);
const ready = (v31) => v31.modes.length > 0 && pairsDone(v31);

export function renderScreen01b(sessionId = 'aarav') {
  const v31 = extrasOf(sessionId);
  const modes = MODE_OPTIONS.map(m => {
    const on = v31.modes.includes(m.id);
    return `<button type="button" class="milo-tonight-chip" id="miloMode-${m.id}-${sessionId}" data-mode="${m.id}" aria-pressed="${on}">${escapeHtml(m.label)}</button>`;
  }).join('');
  const pairs = PAIR_OPTIONS.map(p => `
    <fieldset class="milo-tonight-pair" data-pair="${p.id}">
      <legend class="milo-tonight-vh">${escapeHtml(p.left)} or ${escapeHtml(p.right)}</legend>
      <div class="milo-tonight-ends" aria-hidden="true"><span>${escapeHtml(p.left)}</span><span>${escapeHtml(p.right)}</span></div>
      <div class="milo-tonight-scale">
        ${STEPS.map(s => {
          const on = v31.pairs[p.id] === s.answer;
          const label = `${s.words} ${s.side === 'left' ? p.left : p.right}`.toLowerCase();
          return `<button type="button" class="milo-tonight-dot is-${s.answer}" id="miloPair-${p.id}-${s.answer}-${sessionId}" data-pair="${p.id}" data-answer="${s.answer}" aria-pressed="${on}" aria-label="${escapeHtml(label.charAt(0).toUpperCase() + label.slice(1))}"><span aria-hidden="true"></span></button>`;
        }).join('')}
      </div>
    </fieldset>`).join('');
  return `
    <div class="milo-s1-container milo-tonight" data-session-id="${sessionId}">
      <header class="milo-header">
        <button type="button" class="milo-header-back" id="miloS1bBack-${sessionId}" aria-label="Back to moods"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button>
        <span class="milo-wordmark">milo.</span>
      </header>
      <div class="milo-tonight-body">
        <h1 class="milo-headline">Tonight is mostly about…</h1>
        <p class="milo-subline">Pick up to two.</p>
        <div class="milo-tonight-chips" role="group" aria-label="Tonight is mostly about">${modes}</div>
        <h2 class="milo-tonight-h2">Which way do you lean?</h2>
        ${pairs}
      </div>
      <button class="milo-cta-button" id="miloS1bCta-${sessionId}" ${ready(v31) ? '' : 'disabled'}>Show me ideas →</button>
    </div>`;
}

export function patchScreen01b(container, sessionId = 'aarav') {
  const v31 = extrasOf(sessionId);
  container.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(v31.modes.includes(b.dataset.mode))));
  container.querySelectorAll('[data-answer]').forEach(b => b.setAttribute('aria-pressed', String(v31.pairs[b.dataset.pair] === b.dataset.answer)));
  const cta = container.querySelector(`#miloS1bCta-${sessionId}`);
  if (cta) cta.disabled = !ready(v31);
}

export function attachScreen01bListeners(container, sessionId = 'aarav') {
  const save = (v31) => store.updateSession(sessionId, { v31 });
  container.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    const v31 = extrasOf(sessionId);
    const id = button.dataset.mode;
    if (v31.modes.includes(id)) v31.modes = v31.modes.filter(m => m !== id);
    else if (v31.modes.length < 2) v31.modes = [...v31.modes, id];
    else {
      // Third tap: the two picked stay; the new one gently says no.
      button.classList.remove('milo-tile-shake'); void button.offsetWidth; button.classList.add('milo-tile-shake');
      return;
    }
    save(v31);
  }));
  container.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
    const v31 = extrasOf(sessionId);
    v31.pairs = { ...v31.pairs, [button.dataset.pair]: button.dataset.answer };
    save(v31);
  }));
  container.querySelector(`#miloS1bBack-${sessionId}`)?.addEventListener('click', () => store.setSessionScreen(sessionId, 's1'));
  container.querySelector(`#miloS1bCta-${sessionId}`)?.addEventListener('click', () => {
    if (ready(extrasOf(sessionId))) store.setSessionScreen(sessionId, 'threshold');
  });
}
