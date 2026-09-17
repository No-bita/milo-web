// ==========================================================
// MILO V2 — SCREEN 2: DATE CONTEXT
// Visual week-calendar strip, discrete time ruler, and
// photographic vibe cards.
// Powered dynamically by demo-date.js (Zero hardcoded weekdays)
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';
import { getDemoDateInfo } from '../data/demo-date.js';
import { renderImageHtml } from '../assets/manifest.js';

export function renderScreen02() {
  const state = getState();
  const dateContext = state.dateContext || {
    date: '2026-10-25',
    time: '19:30',
    occasion: 'Just a date'
  };

  const dateInfo = getDemoDateInfo(dateContext.date, dateContext.time);
  const timeStops = [
    { label: '6:00 PM', value: '18:00' },
    { label: '7:00 PM', value: '19:00' },
    { label: '7:30 PM', value: '19:30' },
    { label: '8:00 PM', value: '20:00' },
    { label: '9:00 PM', value: '21:00' }
  ];

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <!-- Top Nav & Progress Bar -->
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen2Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">${dateInfo.monthYear}</span>
          <div style="width: 32px;"></div>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 33%;"></div>
        </div>

        <h1 class="milo-screen-h1" style="margin-top: 16px;">When's the date?</h1>
        <p class="milo-screen-subhead">
          You've already picked the person. Let's lock in the time and mood.
        </p>

        <!-- 1. Mini-Calendar Week Strip -->
        <div style="margin-bottom: 20px;">
          <div class="milo-calendar-strip" id="calendarWeekStrip">
            ${dateInfo.weekStrip.map(day => `
              <div class="milo-calendar-item ${day.iso === dateContext.date ? 'selected' : ''}" data-iso="${day.iso}">
                <span class="day-name">${day.dayName}</span>
                <span class="day-num">${day.dayNum}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. Discrete Time Ruler -->
        <div style="margin-bottom: 24px;">
          <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 10px;">
            Time of evening
          </label>
          <div class="milo-time-ruler" id="timeRuler">
            ${timeStops.map(t => `
              <button class="milo-time-stop ${dateContext.time === t.value ? 'selected' : ''}" data-time="${t.value}">
                ${t.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 3. Photographic Vibe Selection -->
        <div style="margin-bottom: 20px;">
          <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 10px;">
            What's the vibe?
          </label>

          <div class="milo-vibe-grid" id="vibeGrid">
            <!-- Just a date -->
            <div class="milo-vibe-card ${dateContext.occasion === 'Just a date' ? 'selected' : ''}" data-vibe="Just a date">
              ${renderImageHtml('vibeJustADate')}
              <div class="milo-vibe-scrim"></div>
              <div class="milo-vibe-content">
                <div>
                  <div class="milo-vibe-title">Just a date ✨</div>
                  <div class="milo-vibe-desc">Relaxed dinner or fun activity. Zero pressure.</div>
                </div>
                ${dateContext.occasion === 'Just a date' ? '<span style="font-size:1.2rem;">✓</span>' : ''}
              </div>
            </div>

            <!-- First date -->
            <div class="milo-vibe-card ${dateContext.occasion === 'First date' ? 'selected' : ''}" data-vibe="First date">
              ${renderImageHtml('vibeFirstDate')}
              <div class="milo-vibe-scrim"></div>
              <div class="milo-vibe-content">
                <div>
                  <div class="milo-vibe-title">First date 🥂</div>
                  <div class="milo-vibe-desc">Easy to chat, graceful exit options, cosy atmosphere.</div>
                </div>
                ${dateContext.occasion === 'First date' ? '<span style="font-size:1.2rem;">✓</span>' : ''}
              </div>
            </div>

            <!-- Special occasion -->
            <div class="milo-vibe-card ${dateContext.occasion === 'Special occasion' ? 'selected' : ''}" data-vibe="Special occasion">
              ${renderImageHtml('vibeSpecialOccasion')}
              <div class="milo-vibe-scrim"></div>
              <div class="milo-vibe-content">
                <div>
                  <div class="milo-vibe-title">Special occasion 🍾</div>
                  <div class="milo-vibe-desc">Birthdays, milestones, or going all out.</div>
                </div>
                ${dateContext.occasion === 'Special occasion' ? '<span style="font-size:1.2rem;">✓</span>' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer" style="margin-top: 16px;">
        <button class="milo-btn-primary" id="btnScreen2Continue">
          Next: Where to? →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen02Listeners(container) {
  const btnBack = container.querySelector('#btnScreen2Back');
  if (btnBack) {
    btnBack.addEventListener('click', () => prevScreen());
  }

  const btnContinue = container.querySelector('#btnScreen2Continue');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => nextScreen());
  }

  // Calendar strip selection
  const dayItems = container.querySelectorAll('.milo-calendar-item');
  dayItems.forEach(item => {
    item.addEventListener('click', () => {
      const iso = item.getAttribute('data-iso');
      setState({
        dateContext: {
          ...getState().dateContext,
          date: iso
        }
      });
    });
  });

  // Time ruler selection
  const timeButtons = container.querySelectorAll('.milo-time-stop');
  timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const timeVal = btn.getAttribute('data-time');
      setState({
        dateContext: {
          ...getState().dateContext,
          time: timeVal
        }
      });
    });
  });

  // Vibe selection
  const vibeCards = container.querySelectorAll('.milo-vibe-card');
  vibeCards.forEach(card => {
    card.addEventListener('click', () => {
      const vibe = card.getAttribute('data-vibe');
      setState({
        dateContext: {
          ...getState().dateContext,
          occasion: vibe
        }
      });
    });
  });
}
