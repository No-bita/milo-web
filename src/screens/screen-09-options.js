// ==========================================================
// MILO V2 — SCREEN 9: YOUR DATE OPTIONS (CENTERPIECE)
// "Here are 3 dates that work for both of you"
// The emotional core: proves Milo understood both people,
// balanced their travel, and explains "Why Milo picked this".
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';
import { BASE_RECOMMENDATIONS, getFilteredRecommendations } from '../data/recommendations.js';

let activeCardIndex = 0;

export function renderScreen09() {
  const state = getState();
  const recommendations = getFilteredRecommendations(
    { hardNos: state.planner?.hardNo },
    { hardNos: state.invitee?.hardNo }
  );

  const displayList = recommendations.length > 0 ? recommendations : BASE_RECOMMENDATIONS;
  const currentOption = displayList[activeCardIndex % displayList.length];

  return `
    <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen9Back" aria-label="Go back">←</button>
          <span style="font-size:0.8rem; font-weight:600; color:var(--milo-text-secondary);">
            Option ${activeCardIndex + 1} of ${displayList.length}
          </span>
        </div>

        <h1 class="milo-screen-h1" style="font-size:1.55rem; margin-top:0;">
          I found a few I think you'll like.
        </h1>
        <p class="milo-screen-subhead" style="margin-bottom:14px;">
          Three different ways to spend the evening. Pick the one that feels most like you two.
        </p>

        <!-- Option Tabs / Pill Selector -->
        <div style="display:flex; gap:8px; margin-bottom:14px;">
          ${displayList.map((opt, i) => `
            <button 
              class="milo-pill ${i === activeCardIndex ? 'selected' : ''}" 
              data-opt-tab="${i}"
              style="padding:6px 14px; font-size:0.8rem;"
            >
              ${opt.tag.toUpperCase()}
            </button>
          `).join('')}
        </div>

        <!-- Featured Date Card -->
        <div class="milo-card" style="padding:0; overflow:hidden; border-radius:var(--milo-radius-xl); box-shadow:var(--milo-shadow-md); margin-bottom:16px;">
          <!-- Card Image & Overlay Badges -->
          <div style="width:100%; height:190px; position:relative; overflow:hidden;">
            <img 
              src="${currentOption.image}" 
              alt="${currentOption.title}"
              style="width:100%; height:100%; object-fit:cover;"
            />
            <div style="position:absolute; top:12px; left:12px; background:var(--milo-text); color:#FFFFFF; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem;">
              ${currentOption.badge}
            </div>
            <div style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.9); backdrop-filter:blur(6px); border-radius:var(--milo-radius-full); padding:4px 10px; font-size:0.75rem; font-weight:700; color:var(--milo-text);">
              ⭐ ${currentOption.rating} (${currentOption.reviewsCount})
            </div>
          </div>

          <!-- Card Content Body -->
          <div style="padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
              <div>
                <span class="${currentOption.tagClass}" style="display:inline-block; padding:2px 8px; border-radius:var(--milo-radius-full); font-size:0.7rem; font-weight:700; text-transform:uppercase; margin-bottom:4px;">
                  ${currentOption.tag}
                </span>
                <h2 style="font-family:var(--milo-font-display); font-size:1.4rem; line-height:1.2; margin:2px 0 4px; color:var(--milo-text);">
                  ${currentOption.title}
                </h2>
              </div>
              <button id="btnHeartVote" style="background:#FAF0EC; border:none; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1.2rem; color:var(--milo-terracotta);">
                ❤️
              </button>
            </div>

            <p style="font-size:0.85rem; color:var(--milo-text-secondary); margin:0 0 12px; line-height:1.4;">
              ${currentOption.subtitle}
            </p>

            <!-- Key Details Grid -->
            <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; font-size:0.8rem; color:var(--milo-text); margin-bottom:14px; background:var(--milo-card-subtle); padding:10px 12px; border-radius:var(--milo-radius-md);">
              <div style="display:flex; align-items:center; gap:6px;">
                <span>📍</span> <strong>${currentOption.area}</strong>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span>📅</span> <strong>${currentOption.timing}</strong>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span>💳</span> <span>${currentOption.costSummary}</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px; color:var(--milo-green); font-weight:700;">
                <span>✓</span> <span>Available</span>
              </div>
            </div>

            <!-- "Why I Picked This" (Milo voice) -->
            <div style="background:#FDF8F3; border-left:3px solid var(--milo-accent); padding:10px 12px; border-radius:0 var(--milo-radius-sm) var(--milo-radius-sm) 0; font-size:0.825rem; line-height:1.45; color:#684A33;">
              <strong style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--milo-terracotta); margin-bottom:2px;">
                Why I picked this
              </strong>
              ${currentOption.whyReason}
            </div>
          </div>
        </div>
      </div>

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

  const state = getState();
  const recommendations = getFilteredRecommendations(
    { hardNos: state.planner?.hardNo },
    { hardNos: state.invitee?.hardNo }
  );
  const displayList = recommendations.length > 0 ? recommendations : BASE_RECOMMENDATIONS;

  // Tab switching
  container.querySelectorAll('[data-opt-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeCardIndex = parseInt(e.currentTarget.getAttribute('data-opt-tab'), 10);
      const chosen = displayList[activeCardIndex];
      if (chosen) setState({ selectedOptionId: chosen.id });
    });
  });

  // Action button: Choose this date
  const selectBtn = container.querySelector('#btnSelectDateOption');
  const heartBtn = container.querySelector('#btnHeartVote');
  
  function doChoose() {
    const chosen = displayList[activeCardIndex % displayList.length];
    if (chosen) {
      setState({ 
        selectedOptionId: chosen.id,
        booking: { ...getState().booking, status: 'checking' }
      });
    }
    nextScreen();
  }

  if (selectBtn) selectBtn.addEventListener('click', doChoose);
  if (heartBtn) heartBtn.addEventListener('click', doChoose);
}
