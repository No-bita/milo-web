// ==========================================================
// MILO V2 — MASTER CONTROLLER APPLICATION
// Orchestrates state, mobile shell, nav toolbar, active screen,
// and the 16-screen gallery grid view.
// ==========================================================

import { 
  getState, 
  setState, 
  subscribe, 
  setScreen, 
  nextScreen, 
  prevScreen, 
  setViewMode, 
  resetDemo 
} from './state.js';

import { renderNavToolbar } from './components/nav-toolbar.js';
import { renderMobileShell } from './components/mobile-shell.js';
import { renderAllScreensGrid, attachAllScreensGridListeners } from './components/all-screens-grid.js';

// Screen Renderers and Listeners
import { renderScreen01, attachScreen01Listeners } from './screens/screen-01-welcome.js';
import { renderScreen02, attachScreen02Listeners } from './screens/screen-02-date-context.js';
import { renderScreen03, attachScreen03Listeners } from './screens/screen-03-location.js';
import { renderScreen04, attachScreen04Listeners } from './screens/screen-04-invite.js';
import { renderScreen05, attachScreen05Listeners } from './screens/screen-05-invitee-welcome.js';
import { renderScreen06, attachScreen06Listeners } from './screens/screen-06-preferences.js';
import { renderScreen07, attachScreen07Listeners } from './screens/screen-07-practical.js';
import { renderScreen08, attachScreen08Listeners } from './screens/screen-08-overlap.js';
import { renderScreen09, attachScreen09Listeners } from './screens/screen-09-options.js';
import { renderScreen10, attachScreen10Listeners } from './screens/screen-10-both-chosen.js';
import { renderScreen11, attachScreen11Listeners } from './screens/screen-11-confirmed.js';
import { renderScreen12, attachScreen12Listeners } from './screens/screen-12-details.js';
import { renderScreen13, attachScreen13Listeners } from './screens/screen-13-day-of-date.js';
import { renderScreen14, attachScreen14Listeners } from './screens/screen-14-reminders.js';
import { renderScreen15, attachScreen15Listeners } from './screens/screen-15-feedback.js';
import { renderScreen16, attachScreen16Listeners } from './screens/screen-16-next-date.js';

const SCREENS = [
  { render: renderScreen01, attach: attachScreen01Listeners },
  { render: renderScreen02, attach: attachScreen02Listeners },
  { render: renderScreen03, attach: attachScreen03Listeners },
  { render: renderScreen04, attach: attachScreen04Listeners },
  { render: renderScreen05, attach: attachScreen05Listeners },
  { render: renderScreen06, attach: attachScreen06Listeners },
  { render: renderScreen07, attach: attachScreen07Listeners },
  { render: renderScreen08, attach: attachScreen08Listeners },
  { render: renderScreen09, attach: attachScreen09Listeners },
  { render: renderScreen10, attach: attachScreen10Listeners },
  { render: renderScreen11, attach: attachScreen11Listeners },
  { render: renderScreen12, attach: attachScreen12Listeners },
  { render: renderScreen13, attach: attachScreen13Listeners },
  { render: renderScreen14, attach: attachScreen14Listeners },
  { render: renderScreen15, attach: attachScreen15Listeners },
  { render: renderScreen16, attach: attachScreen16Listeners }
];

export function renderV2App(container, params = {}) {
  // If route specified a screen number, e.g. /v2/screen/9
  if (params && params.num) {
    const screenNum = parseInt(params.num, 10);
    if (!isNaN(screenNum) && screenNum >= 1 && screenNum <= 16) {
      setScreen(screenNum);
    }
  }

  function update() {
    const state = getState();
    const activeIndex = state.currentScreenIndex;
    const viewMode = state.viewMode;

    let stageContent = '';
    if (viewMode === 'grid') {
      stageContent = renderAllScreensGrid();
    } else {
      const activeScreenConfig = SCREENS[activeIndex - 1] || SCREENS[0];
      const screenHtml = activeScreenConfig.render();
      const shellClass = activeIndex === 1 ? 'milo-shell-welcome' : '';
      stageContent = renderMobileShell(screenHtml, shellClass);
    }

    container.innerHTML = `
      <div class="milo-root">
        ${renderNavToolbar(activeIndex, viewMode)}
        <main class="milo-stage">
          ${stageContent}
        </main>
      </div>
    `;

    // Attach toolbar event listeners
    const picker = container.querySelector('#miloScreenPicker');
    if (picker) {
      picker.addEventListener('change', (e) => {
        setScreen(parseInt(e.target.value, 10));
        if (getState().viewMode === 'grid') setViewMode('mobile');
      });
    }

    const prevBtn = container.querySelector('#miloPrevBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => prevScreen());

    const nextBtn = container.querySelector('#miloNextBtn');
    if (nextBtn) nextBtn.addEventListener('click', () => nextScreen());

    const toggleGridBtn = container.querySelector('#miloToggleGridBtn');
    if (toggleGridBtn) {
      toggleGridBtn.addEventListener('click', () => {
        setViewMode(getState().viewMode === 'grid' ? 'mobile' : 'grid');
      });
    }

    const resetBtn = container.querySelector('#miloResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetDemo();
        alert('Milo V2 demo reset to initial state.');
      });
    }

    const mobileTrigger = container.querySelector('#miloMobileDevTrigger');
    const devBar = container.querySelector('#miloDevBar');
    if (mobileTrigger && devBar) {
      mobileTrigger.addEventListener('click', () => {
        devBar.classList.toggle('open-on-mobile');
      });
    }

    // Attach listeners for screen content
    if (viewMode === 'grid') {
      attachAllScreensGridListeners(container);
    } else {
      const activeConfig = SCREENS[activeIndex - 1] || SCREENS[0];
      if (activeConfig.attach) {
        activeConfig.attach(container);
      }
    }
  }

  // Initial render
  update();

  // Subscribe to state updates
  const unsubscribe = subscribe(() => {
    update();
  });

  return () => {
    unsubscribe();
  };
}
