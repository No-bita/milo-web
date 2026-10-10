import { store } from '../domain/store.js';

// A small 24px icon vocabulary. The positive action keeps its original filled heart.
const paths = {
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  heart: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  dismiss: '<path d="m6 6 12 12M18 6 6 18"/>',
  more: '<path d="M5 12h14"/>',
  forward: '<path d="M5 12h14m-6-6 6 6-6 6"/>'
};

export function icon(name) {
  if (name === 'heart') {
    return `<svg class="milo-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${paths.heart}</svg>`;
  }
  return `<svg class="milo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

// Runs after the app's synchronous render subscription. Keep screen templates
// and action IDs intact, so independent motion / footer PRs remain isolated.
export function installPremiumIcons(root) {
  function decorate() {
    root.querySelectorAll('.milo-header-back:not(.milo-icon-back), .milo-s7-back-btn:not(.milo-icon-back)').forEach(button => {
      button.innerHTML = icon('back');
      button.classList.add('milo-icon-back');
    });
    // Keep the deck's original chevron node and listener intact: back on
    // card one, undo after a reaction. This also preserves PR #3's fly-back.
    root.querySelectorAll('.milo-reaction-btn:not([data-icon-decorated])').forEach(button => {
      const label = button.querySelector('.milo-btn-label');
      if (!label) return;
      const name = button.classList.contains('btn-into-it') ? 'heart'
        : button.classList.contains('btn-maybe') ? 'more' : 'dismiss';
      button.innerHTML = `<span class="milo-btn-circle">${icon(name)}</span><span class="milo-btn-label">${label.textContent}</span>`;
      button.setAttribute('data-icon-decorated', 'true');
    });
    root.querySelectorAll('.milo-night-chevron:not([data-icon-decorated])').forEach(element => {
      element.innerHTML = icon('forward');
      element.setAttribute('data-icon-decorated', 'true');
    });
    root.querySelectorAll('.milo-banner-arrow:not([data-icon-decorated])').forEach(element => {
      element.innerHTML = icon('forward');
      element.setAttribute('data-icon-decorated', 'true');
    });
  }
  decorate();
  return store.subscribe(decorate);
}
