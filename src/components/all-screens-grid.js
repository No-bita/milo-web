// ==========================================================
// MILO V2 — ALL SCREENS GRID (SHOWCASE OVERVIEW)
// Renders all 16 screens side-by-side in a responsive grid
// as clean web cards without fake device mockups.
// ==========================================================

import { renderScreen01 } from '../screens/screen-01-welcome.js';
import { renderScreen02 } from '../screens/screen-02-date-context.js';
import { renderScreen03 } from '../screens/screen-03-location.js';
import { renderScreen04 } from '../screens/screen-04-invite.js';
import { renderScreen05 } from '../screens/screen-05-invitee-welcome.js';
import { renderScreen06 } from '../screens/screen-06-preferences.js';
import { renderScreen07 } from '../screens/screen-07-practical.js';
import { renderScreen08 } from '../screens/screen-08-overlap.js';
import { renderScreen09 } from '../screens/screen-09-options.js';
import { renderScreen10 } from '../screens/screen-10-both-chosen.js';
import { renderScreen11 } from '../screens/screen-11-confirmed.js';
import { renderScreen12 } from '../screens/screen-12-details.js';
import { renderScreen13 } from '../screens/screen-13-day-of-date.js';
import { renderScreen14 } from '../screens/screen-14-reminders.js';
import { renderScreen15 } from '../screens/screen-15-feedback.js';
import { renderScreen16 } from '../screens/screen-16-next-date.js';
import { SCREEN_NAMES } from './nav-toolbar.js';
import { setScreen, setViewMode } from '../state.js';

const SCREEN_RENDERERS = [
  renderScreen01,
  renderScreen02,
  renderScreen03,
  renderScreen04,
  renderScreen05,
  renderScreen06,
  renderScreen07,
  renderScreen08,
  renderScreen09,
  renderScreen10,
  renderScreen11,
  renderScreen12,
  renderScreen13,
  renderScreen14,
  renderScreen15,
  renderScreen16
];

export function renderAllScreensGrid() {
  const itemsHtml = SCREEN_NAMES.map((name, i) => {
    const screenIndex = i + 1;
    const renderer = SCREEN_RENDERERS[i];
    const screenHtml = renderer ? renderer() : '<div>Loading...</div>';

    return `
      <div class="milo-grid-item" data-grid-screen="${screenIndex}" style="cursor:pointer;" title="Click to open this screen in responsive mode">
        <div class="milo-grid-label">${name}</div>
        <div class="milo-grid-card">
          <div class="milo-grid-card-inner">
            ${screenHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="milo-grid-container">
      ${itemsHtml}
    </div>
  `;
}

export function attachAllScreensGridListeners(container) {
  container.querySelectorAll('[data-grid-screen]').forEach(item => {
    item.addEventListener('click', (e) => {
      const num = parseInt(e.currentTarget.getAttribute('data-grid-screen'), 10);
      setScreen(num);
      setViewMode('mobile');
    });
  });
}
