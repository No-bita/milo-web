import { store } from '../domain/store.js';

// A deliberately small icon vocabulary, on one 24px / 1.5px grid.
const paths = {
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  heart: '<path d="M20.5 5.5a5 5 0 0 0-7.1 0L12 6.9l-1.4-1.4a5 5 0 0 0-7.1 7.1L12 21l8.5-8.4a5 5 0 0 0 0-7.1Z"/>',
  dismiss: '<path d="m6 6 12 12M18 6 6 18"/>',
  more: '<path d="M5 12h14"/>',
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
    // Keep the deck's original chevron node and listener intact: back on
    // card one, undo after a reaction. This also preserves PR #3's fly-back.
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
