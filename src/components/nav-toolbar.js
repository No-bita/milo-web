// ==========================================================
// MILO V2 — DEVELOPER TOOLBAR COMPONENT
// Developer-only UI outside the product viewport.
// Hidden on mobile to keep the mobile experience pure,
// with a subtle floating trigger to toggle if needed.
// ==========================================================

export const SCREEN_NAMES = [
  '1. Welcome',
  '2. Date Context',
  '3. Locality',
  '4. Invite',
  '5. Invitee Welcome',
  '6. Preferences',
  '7. Practical Details',
  '8. Finding the Date',
  '9. The Centrepiece',
  '10. Mutual Choice',
  '11. Booking Confirmation',
  '12. Date Details',
  '13. Day of Date',
  '14. Reminders',
  '15. After the Date',
  '16. Next Date'
];

export function renderNavToolbar(currentIndex, currentViewMode) {
  const optionsHtml = SCREEN_NAMES.map((name, i) => {
    const screenNum = i + 1;
    const isSelected = screenNum === currentIndex ? 'selected' : '';
    return `<option value="${screenNum}" ${isSelected}>${name}</option>`;
  }).join('');

  return `
    <!-- Desktop-Only Developer Bar -->
    <header class="milo-dev-bar" id="miloDevBar">
      <div class="milo-dev-left">
        <span class="milo-dev-tag">DEV CONTROLS</span>
        <select class="milo-screen-select" id="miloScreenPicker" aria-label="Jump to screen">
          ${optionsHtml}
        </select>
      </div>

      <div class="milo-dev-right">
        <button class="milo-toolbar-btn" id="miloPrevBtn" ${currentIndex <= 1 ? 'disabled style="opacity:0.4;"' : ''}>
          ← Prev
        </button>
        <button class="milo-toolbar-btn" id="miloNextBtn" ${currentIndex >= 16 ? 'disabled style="opacity:0.4;"' : ''}>
          Next →
        </button>
        <button class="milo-toolbar-btn ${currentViewMode === 'grid' ? 'active' : ''}" id="miloToggleGridBtn">
          ${currentViewMode === 'grid' ? '📱 Responsive View' : '⊞ All 16 Screens'}
        </button>
        <button class="milo-toolbar-btn" id="miloResetBtn" title="Reset all inputs">
          ↺ Reset
        </button>
        <a href="/" data-link class="milo-toolbar-btn" style="text-decoration:none; font-size:0.75rem; color:#D97757;">
          ← V1 Classic
        </a>
      </div>
    </header>

    <!-- Discreet Mobile Dev Floating Trigger -->
    <button class="milo-mobile-dev-trigger" id="miloMobileDevTrigger" title="Developer Controls" aria-label="Open Dev Controls">
      ⚙
    </button>
  `;
}
