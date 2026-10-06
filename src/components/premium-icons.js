import { store } from '../domain/store.js';

// A deliberately small icon vocabulary, on one 24px / 1.5px grid.
const paths = {
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  heart: '<path d="M20.5 5.5a5 5 0 0 0-7.1 0L12 6.9l-1.4-1.4a5 5 0 0 0-7.1 7.1L12 21l8.5-8.4a5 5 0 0 0 0-7.1Z"/>',
  dismiss: '<path d="m6 6 12 12M18 6 6 18"/>',
  more: '<path d="M5 12h14"/>',
  undo: '<path d="M9 4 4 9l5 5M4 9h9a7 7 0 1 1 0 14"/>',
  forward: '<path d="M5 12h14m-6-6 6 6-6 6"/>'
};

export function icon(name) {
  return `<svg class="milo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

// Runs after the app's synchronous render subscription. Keep screen templates
// and action IDs intact, so independent motion / footer PRs remain isolated.
export function installPremiumIcons(root) {
  function decorate() {
    root.querySelectorAll('.milo-header-back, .milo-s7-back-btn').forEach(button => {
      button.innerHTML = icon('back');
      button.classList.add('milo-icon-back');
    });
    root.querySelectorAll('.milo-s2-container').forEach(deck => {
      const sessionId = deck.dataset.sessionId;
      const controls = deck.querySelector('.milo-deck-controls');
      const header = deck.querySelector('.milo-deck-header');
      const original = deck.querySelector('.milo-deck-undo-btn');
      if (!original || !controls || !header) return;
      const canUndo = original.getAttribute('aria-label') === 'Undo';
      // Move the existing wired button, rather than replacing its listener.
      // PR #3's hint cancellation and undo fly-back remain on this same node.
      if (canUndo) {
        original.innerHTML = icon('undo');
        original.classList.add('milo-icon-undo');
        controls.prepend(original);
        if (!header.querySelector('.milo-deck-back-btn')) {
          const back = document.createElement('button');
          back.className = 'milo-deck-back-btn milo-icon-back';
          back.title = 'Back to intents';
          back.setAttribute('aria-label', 'Back to intents');
          back.innerHTML = icon('back');
          back.addEventListener('click', () => store.setSessionScreen(sessionId, 's1'));
          header.prepend(back);
        }
      } else {
        original.innerHTML = icon('back');
        original.classList.add('milo-icon-back');
      }
    });
    root.querySelectorAll('.milo-reaction-btn').forEach(button => {
      const label = button.querySelector('.milo-btn-label');
      if (!label) return;
      const name = button.classList.contains('btn-into-it') ? 'heart'
        : button.classList.contains('btn-maybe') ? 'more' : 'dismiss';
      button.innerHTML = `<span class="milo-btn-circle">${icon(name)}</span><span class="milo-btn-label">${label.textContent}</span>`;
    });
    // Repeated decorative symbols add no information beside these sentences.
    root.querySelectorAll('.milo-obs-icon, .milo-shared-row-icon').forEach(element => element.remove());
    root.querySelectorAll('.milo-night-chevron').forEach(element => {
      element.innerHTML = icon('forward');
    });
    root.querySelectorAll('.milo-banner-arrow').forEach(element => {
      element.innerHTML = icon('forward');
    });
  }
  decorate();
  return store.subscribe(decorate);
}
