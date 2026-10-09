import { renderTabBar, attachTabBar } from '../components/tab-bar.js';

// Placeholder for group plans. Nothing is built behind it yet.
export function renderGroupSoon(sessionId = 'aarav') {
  return `<div class="milo-home milo-tabscreen" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-home-body">
      <h1 class="milo-headline milo-home-headline">Group nights</h1>
      <p class="milo-home-lead">Plan one night with a few people. Everyone picks privately, Milo finds the overlap. Coming soon.</p>
    </div>
    ${renderTabBar('')}
  </div>`;
}

export function attachGroupSoonListeners(container, sessionId = 'aarav') {
  attachTabBar(container, sessionId);
}
