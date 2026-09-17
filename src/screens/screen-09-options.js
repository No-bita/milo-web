// ==========================================================
// MILO V2 — SCREEN 9: DATE OPTIONS
// Strict visual hierarchy:
// Photo → Experience Name → When + Where + Price → Why Milo picked it → CTA
// Zero cognitive clutter.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';
import { getActiveRecommendations } from '../state.js';
import { renderImageHtml } from '../assets/manifest.js';

let activeCardIndex = 0;

export function renderScreen09() {
  const recommendations = getActiveRecommendations();
  const currentOption = recommendations[activeCardIndex % recommendations.length] || recommendations[0];

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen9Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Option ${activeCardIndex + 1} of ${recommendations.length}</span>
          <div style="width: 32px;"></div>
        </div>

        <!-- Option Tabs / Pills -->
        <div style="display:flex; gap:8px; margin: 12px 0 16px;">
          ${recommendations.map((opt, i) => `
            <button 
              class="milo-pill ${i === activeCardIndex ? 'selected' : ''}" 
              data-opt-tab="${i}"
              style="padding: 6px 14px; font-size: 0.8rem;"
            >
              ${opt.tag}
            </button>
          `).join('')}
        </div>

        <!-- 1. PHOTO -->
        <div style="width:100%; height:230px; border-radius:var(--milo-radius-xl); overflow:hidden; position:relative; box-shadow:var(--milo-shadow-md); margin-bottom:16px;">
          ${renderImageHtml(currentOption.imageKey || 'potteryWorkshop')}
          <div style="position:absolute; top:12px; left:12px; background:var(--milo-text); color:#FFFFFF; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem;">
            ${currentOption.badge}
          </div>
          <div style="position:absolute; top:12px; right:12px; background:rgba(26,24,20,0.7); backdrop-filter:blur(6px); color:#FFFFFF; border-radius:var(--milo-radius-full); padding:4px 10px; font-size:0.75rem; font-weight:600;">
            ⭐ ${currentOption.rating}
          </div>
        </div>

        <!-- 2. EXPERIENCE NAME -->
        <h1 style="font-family: var(--milo-font-display); font-size: 1.7rem; font-weight: 400; line-height: 1.2; margin: 0 0 6px; color: var(--milo-text);">
          ${currentOption.title}
        </h1>
        <p style="font-size: 0.9rem; color: var(--milo-text-secondary); margin: 0 0 14px; line-height: 1.4;">
          ${currentOption.subtitle}
        </p>

        <!-- 3. WHEN + WHERE + PRICE -->
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom: 16px;">
          <span class="milo-pill" style="border:1px solid var(--milo-border); background:#FFFFFF; padding:6px 12px; font-size:0.8rem; font-weight:600;">
            📍 ${currentOption.area}
          </span>
          <span class="milo-pill" style="border:1px solid var(--milo-border); background:#FFFFFF; padding:6px 12px; font-size:0.8rem; font-weight:600;">
            📅 ${currentOption.timing}
          </span>
          <span class="milo-pill" style="border:1px solid var(--milo-border); background:#FFFFFF; padding:6px 12px; font-size:0.8rem; font-weight:600;">
            💳 ${currentOption.costSummary}
          </span>
        </div>

        <!-- 4. WHY MILO PICKED IT -->
        <div class="milo-rationale-pill" style="margin-bottom: 20px;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-terracotta); margin-bottom: 4px;">
            Why Milo picked this
          </div>
          <div>${currentOption.whyReason}</div>
        </div>
      </div>

      <!-- 5. CTA -->
      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnSelectDateOption">
          I like this one →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen09Listeners(container) {
  const backBtn = container.querySelector('#btnScreen9Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  const recommendations = getActiveRecommendations();

  // Tab switching
  container.querySelectorAll('[data-opt-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeCardIndex = parseInt(e.currentTarget.getAttribute('data-opt-tab'), 10);
      const chosen = recommendations[activeCardIndex];
      if (chosen) setState({ selectedOptionId: chosen.id });
    });
  });

  // Choose option
  const selectBtn = container.querySelector('#btnSelectDateOption');
  if (selectBtn) {
    selectBtn.addEventListener('click', () => {
      const chosen = recommendations[activeCardIndex % recommendations.length];
      if (chosen) {
        setState({
          selectedOptionId: chosen.id,
          booking: { ...getState().booking, status: 'checking' }
        });
      }
      nextScreen();
    });
  }
}
