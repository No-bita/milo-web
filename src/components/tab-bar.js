import { store } from '../domain/store.js';

const TABS = [
  { id: 'home', label: 'Home', icon: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z' },
  { id: 'plan', label: 'Plan', icon: 'M12 5v14M5 12h14' },
  { id: 'nights', label: 'Nights', icon: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z' },
  { id: 'you', label: 'You', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0' }
];

export function renderTabBar(active) {
  const items = TABS.map((tab) => `<button type="button" class="milo-tab${tab.id === active ? ' is-active' : ''}" data-tab="${tab.id}" ${tab.id === active ? 'aria-current="page"' : ''}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${tab.icon}"/></svg>
      <span>${tab.label}</span></button>`).join('');
  return `<nav class="milo-tabbar" aria-label="Main">${items}</nav>`;
}

// Plan starts a new night (the moods screen). The other tabs are the home-family screens.
export function attachTabBar(container, sessionId = 'aarav') {
  container.querySelectorAll('.milo-tab').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      if (button.classList.contains('is-active')) return;
      store.setSessionScreen(sessionId, tab === 'plan' ? 's1' : tab);
    });
  });
}
