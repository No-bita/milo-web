// ==========================================================
// MILO V2 — SCREEN 2: DATE CONTEXT (OPTION A + PROGRESS BAR)
// "Tell Milo about the date"
// Option A: Quick Anchors + Native Date Picker + Vibe Time Windows
// + Exact Time Picker + Flexibility Toggle.
// Progress bar: 33% (No "Step 1 of X" text).
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';

export function renderScreen02() {
  const state = getState();
  const dateContext = state.dateContext || {
    date: 'Friday, 25 Oct',
    time: '7:30 PM',
    occasion: 'Regular Date Night',
    flexibleWindow: true
  };

  const isPresetDate = ['Tonight', 'Tomorrow', 'This Weekend', 'Next Week'].includes(dateContext.date);
  const isVibeTime = ['4:00 PM (Afternoon)', '6:00 PM (Sunset & Drinks)', '7:30 PM (Dinner & Evening)', '9:00 PM (Late Night)'].includes(dateContext.time) || dateContext.time === '7:30 PM';

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <!-- Top Nav & Progress Bar -->
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen2Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:700; color:var(--milo-text-secondary); letter-spacing:-0.01em;">Date Context</span>
        </div>
        <div class="milo-progress-bar">
          <div class="milo-progress-fill" style="width: 33%;"></div>
        </div>

        <h1 class="milo-screen-h1">So, when's the date?</h1>
        <p class="milo-screen-subhead">
          You've already made the plan. Nice. Now let me make the rest of it easy.
        </p>

        <!-- Flexible Day Selection -->
        <div style="margin-bottom: 20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary);">
              When are you meeting?
            </label>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--milo-accent);" id="displaySelectedDate">
              ${dateContext.date}
            </span>
          </div>

          <div class="milo-chip-group" style="margin: 0; gap: 8px;">
            <button class="milo-pill ${dateContext.date === 'Tonight' ? 'selected' : ''}" data-day="Tonight">Tonight</button>
            <button class="milo-pill ${dateContext.date === 'Tomorrow' ? 'selected' : ''}" data-day="Tomorrow">Tomorrow</button>
            <button class="milo-pill ${dateContext.date === 'This Weekend' || dateContext.date === 'Friday, 25 Oct' ? 'selected' : ''}" data-day="This Weekend">This Weekend</button>
            <button class="milo-pill ${dateContext.date === 'Next Week' ? 'selected' : ''}" data-day="Next Week">Next Week</button>
            
            <!-- Custom Date Picker Trigger -->
            <div class="milo-picker-btn-wrapper">
              <button class="milo-pill ${!isPresetDate ? 'selected' : ''}" style="display:inline-flex; align-items:center; gap:6px; border-style:dashed;">
                <span>📅</span> Pick any date
              </button>
              <input type="date" id="inputNativeDate" class="milo-native-hidden-input" aria-label="Pick custom date" />
            </div>
          </div>
        </div>

        <!-- Flexible Time Selection: Vibe Windows + Exact Picker -->
        <div style="margin-bottom: 20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary);">
              And what time?
            </label>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--milo-accent);" id="displaySelectedTime">
              ${dateContext.time}
            </span>
          </div>

          <!-- Vibe Windows -->
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 10px;">
            <button class="milo-pill ${dateContext.time.includes('4:00') ? 'selected' : ''}" data-vibe-time="4:00 PM (Afternoon)" style="display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 12px; font-size:0.8rem;">
              <span>☕</span> Afternoon (~4 PM)
            </button>
            <button class="milo-pill ${dateContext.time.includes('6:00') ? 'selected' : ''}" data-vibe-time="6:00 PM (Sunset & Drinks)" style="display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 12px; font-size:0.8rem;">
              <span>🌅</span> Sunset (~6 PM)
            </button>
            <button class="milo-pill ${dateContext.time.includes('7:30') ? 'selected' : ''}" data-vibe-time="7:30 PM (Dinner & Evening)" style="display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 12px; font-size:0.8rem;">
              <span>🍽️</span> Evening (~7:30 PM)
            </button>
            <button class="milo-pill ${dateContext.time.includes('9:00') ? 'selected' : ''}" data-vibe-time="9:00 PM (Late Night)" style="display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 12px; font-size:0.8rem;">
              <span>🌙</span> Late Night (~9 PM)
            </button>
          </div>

          <!-- Exact Time Picker & Flexibility Row -->
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <!-- Exact Time Picker -->
            <div class="milo-picker-btn-wrapper" style="flex:1;">
              <button class="milo-btn-secondary" style="font-size:0.8rem; min-height:40px; padding:8px 12px; border-style:dashed;">
                <span>⏱</span> Choose exact time
              </button>
              <input type="time" id="inputNativeTime" class="milo-native-hidden-input" aria-label="Choose exact time" />
            </div>

            <!-- ±30m Flexibility Toggle -->
            <button class="milo-pill ${dateContext.flexibleWindow ? 'selected' : ''}" id="btnToggleFlexibility" style="font-size:0.775rem; min-height:40px; padding:8px 14px; display:inline-flex; align-items:center; gap:6px;">
              <span>${dateContext.flexibleWindow ? '✓' : '○'}</span> ±30m flexible
            </button>
          </div>
        </div>

        <!-- Occasion / Vibe -->
        <div style="margin-bottom: 16px;">
          <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 8px;">
            What's the vibe?
          </label>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div class="milo-card" style="padding:12px 14px; margin:0; cursor:pointer; display:flex; align-items:center; justify-content:space-between; border-color:${dateContext.occasion === 'Just a date' || dateContext.occasion === 'Regular Date Night' ? 'var(--milo-text)' : 'var(--milo-border)'};" data-occasion="Just a date">
              <div>
                <strong style="font-size:0.9rem; display:block;">Just a date ✨</strong>
                <span style="font-size:0.8rem; color:var(--milo-text-secondary);">Easy, fun, no big agenda.</span>
              </div>
              <input type="radio" name="occasion" ${dateContext.occasion === 'Just a date' || dateContext.occasion === 'Regular Date Night' ? 'checked' : ''} style="accent-color:var(--milo-text);" />
            </div>

            <div class="milo-card" style="padding:12px 14px; margin:0; cursor:pointer; display:flex; align-items:center; justify-content:space-between; border-color:${dateContext.occasion === 'First date' || dateContext.occasion === 'First Date' ? 'var(--milo-text)' : 'var(--milo-border)'};" data-occasion="First date">
              <div>
                <strong style="font-size:0.9rem; display:block;">First date 🌱</strong>
                <span style="font-size:0.8rem; color:var(--milo-text-secondary);">Good conversation. Nothing too intense.</span>
              </div>
              <input type="radio" name="occasion" ${dateContext.occasion === 'First date' || dateContext.occasion === 'First Date' ? 'checked' : ''} style="accent-color:var(--milo-text);" />
            </div>

            <div class="milo-card" style="padding:12px 14px; margin:0; cursor:pointer; display:flex; align-items:center; justify-content:space-between; border-color:${dateContext.occasion === 'Special occasion' ? 'var(--milo-text)' : 'var(--milo-border)'};" data-occasion="Special occasion">
              <div>
                <strong style="font-size:0.9rem; display:block;">Special occasion 🥂</strong>
                <span style="font-size:0.8rem; color:var(--milo-text-secondary);">Let's make a little more of it.</span>
              </div>
              <input type="radio" name="occasion" ${dateContext.occasion === 'Special occasion' ? 'checked' : ''} style="accent-color:var(--milo-text);" />
            </div>
          </div>
        </div>

        <!-- Human Confirmation Note -->
        <div style="background: var(--milo-bg); border-radius: var(--milo-radius-md); padding: 10px 14px; font-size: 0.85rem; color: var(--milo-text-secondary); text-align: center;">
          <span id="labelContextSummary" style="font-weight: 500;">
            ${dateContext.date} at ${dateContext.time.split(' ')[0]} ${dateContext.time.includes('PM') ? 'PM' : 'AM'}. Got it.
          </span>
        </div>
      </div>

      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnScreen2Continue">
          Next →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen02Listeners(container) {
  const backBtn = container.querySelector('#btnScreen2Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const continueBtn = container.querySelector('#btnScreen2Continue');
  if (continueBtn) continueBtn.addEventListener('click', () => nextScreen());

  // Date Preset Pills
  container.querySelectorAll('[data-day]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const day = e.currentTarget.getAttribute('data-day');
      setState({ dateContext: { ...getState().dateContext, date: day } });
    });
  });

  // Custom Native Date Input
  const dateInput = container.querySelector('#inputNativeDate');
  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      const val = e.target.value; // YYYY-MM-DD
      if (val) {
        const d = new Date(val + 'T00:00:00');
        const formatted = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
        setState({ dateContext: { ...getState().dateContext, date: formatted } });
      }
    });
  }

  // Vibe Time Buttons
  container.querySelectorAll('[data-vibe-time]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const time = e.currentTarget.getAttribute('data-vibe-time');
      setState({ dateContext: { ...getState().dateContext, time } });
    });
  });

  // Custom Native Time Input
  const timeInput = container.querySelector('#inputNativeTime');
  if (timeInput) {
    timeInput.addEventListener('change', (e) => {
      const val = e.target.value; // HH:MM
      if (val) {
        const [hours, minutes] = val.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const formattedTime = `${displayH}:${minutes} ${ampm}`;
        setState({ dateContext: { ...getState().dateContext, time: formattedTime } });
      }
    });
  }

  // Flexibility Toggle
  const flexBtn = container.querySelector('#btnToggleFlexibility');
  if (flexBtn) {
    flexBtn.addEventListener('click', () => {
      const current = getState().dateContext?.flexibleWindow;
      setState({ dateContext: { ...getState().dateContext, flexibleWindow: !current } });
    });
  }

  // Occasion Cards
  container.querySelectorAll('[data-occasion]').forEach(card => {
    card.addEventListener('click', (e) => {
      const occasion = e.currentTarget.getAttribute('data-occasion');
      setState({ dateContext: { ...getState().dateContext, occasion } });
    });
  });
}
