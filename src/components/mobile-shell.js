// ==========================================================
// MILO V2 — RESPONSIVE SHELL COMPONENT
// Normal responsive web container without fake phone frame,
// status bar, or device chrome.
// - Full viewport on mobile (<768px)
// - Centered column on desktop (max-width: 620px)
// ==========================================================

export function renderMobileShell(screenHtml, customClass = '') {
  return `
    <div class="milo-responsive-page ${customClass}">
      ${screenHtml}
    </div>
  `;
}
