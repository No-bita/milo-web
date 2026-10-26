// B: bring someone into an existing solo plan, as a focused sheet over that plan.
// Opening or dismissing the sheet writes nothing: no mode change, no invitation,
// no name edit. Only a real share/copy prepares the existing server invitation.
// The sheet lives on <body> so re-renders of the plan underneath never wipe it.
import { store } from '../domain/store.js';
import { renderSender, attachSender, renderInvitePreview, preparedUrl, handoff, NO_DELIVERY } from './invite-handoff.js';

// Unsent name typed in the sheet survives close/reopen on this page only.
let draftName = null;

// Remember where the planner was on every scroller that could hold the plan,
// and restore it after each re-render while the sheet is open.
function scrollKeeper(sessionId) {
  const pick = () => {
    const viewport = document.getElementById(`viewport-${sessionId}`);
    return [document.scrollingElement, viewport, viewport?.firstElementChild].filter(Boolean);
  };
  const saved = pick().map(el => el.scrollTop);
  return () => pick().forEach((el, i) => { if (saved[i] && el.scrollTop !== saved[i]) el.scrollTop = saved[i]; });
}

export function openViewportSheet(sessionId, { html, labelledBy, describedBy, triggerId, className = '' }) {
  document.querySelector('.milo-bring-sheet')?.close();
  const dialog = document.createElement('dialog');
  dialog.className = `milo-bring-sheet ${className}`.trim();
  dialog.setAttribute('aria-labelledby', labelledBy);
  if (describedBy) dialog.setAttribute('aria-describedby', describedBy);
  dialog.innerHTML = `<div class="milo-bring-handle" aria-hidden="true"></div>
    <button type="button" class="milo-bring-close" aria-label="Close">×</button>
    <div class="milo-bring-sheet-body">${html}</div>`;
  const restoreScroll = scrollKeeper(sessionId);
  const position = () => {
    const viewport = document.getElementById(`viewport-${sessionId}`);
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    dialog.style.left = `${Math.max(0, rect.left)}px`;
    dialog.style.width = `${rect.width}px`;
    dialog.style.bottom = `${Math.max(0, window.innerHeight - rect.bottom)}px`;
  };
  // Re-renders replace the plan's DOM: keep scroll, and keep the sheet aligned.
  const unsubscribe = store.subscribe(() => requestAnimationFrame(() => { restoreScroll(); position(); }));
  const cleanups = [];
  dialog.addEventListener('close', () => {
    unsubscribe();
    window.removeEventListener('resize', position);
    cleanups.forEach(fn => fn());
    dialog.remove();
    restoreScroll();
    document.getElementById(triggerId)?.focus({ preventScroll: true });
  }, { once: true });
  dialog.querySelector('.milo-bring-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  document.body.append(dialog);
  window.addEventListener('resize', position);
  position();
  dialog.showModal();
  return { dialog, restoreScroll, onClose: fn => cleanups.push(fn) };
}

export function openBringInSheet(sessionId = 'aarav', { triggerId, onSettled }) {
  const state = store.getState();
  const name = draftName ?? state.sessionA.name ?? '';
  const { dialog, restoreScroll, onClose } = openViewportSheet(sessionId, {
    triggerId,
    labelledBy: 'miloBringSheetTitle',
    describedBy: 'miloBringSheetLede',
    html: `
      <h2 class="milo-bring-title" id="miloBringSheetTitle">Make room for their taste</h2>
      <p class="milo-bring-lede" id="miloBringSheetLede">This is shaped by your picks so far. Invite their choices before you decide together.</p>
      ${renderSender({ label: 'Invite from', name, inputId: 'miloBringName', editId: 'miloBringNameEdit', editing: draftName !== null })}
      ${renderInvitePreview('solo', preparedUrl(state), 'miloBringPreview')}
      <p class="milo-handoff-privacy">Your picks stay private. Their input can change the plan. Nothing is booked.</p>
      <div class="milo-bring-actions">
        <p class="milo-s4-reassure">${NO_DELIVERY}</p>
        <button type="button" class="milo-pill-btn-primary" id="miloBringShare">Share via WhatsApp</button>
        <button type="button" class="milo-pill-btn-secondary" id="miloBringCopy">Copy invite link</button>
      </div>`
  });
  const buttons = () => [...dialog.querySelectorAll('#miloBringShare, #miloBringCopy')];
  const input = attachSender(dialog, { inputId: 'miloBringName', editId: 'miloBringNameEdit', buttons, onInput: value => { draftName = value; } });
  if (!input.closest('label').hidden) input.focus();
  else dialog.querySelector('#miloBringShare').focus();
  let returnCleanup = null;
  onClose(() => returnCleanup?.());
  const run = (method) => handoff({
    method, context: 'solo', name: input.value, buttons,
    onSettled: (how) => {
      draftName = null;
      if (dialog.open) dialog.close();
      onSettled(how);
      // The plan re-renders with its new status line: keep the planner where they were.
      restoreScroll();
      requestAnimationFrame(restoreScroll);
    },
    registerCleanup: (cleanup) => { returnCleanup?.(); returnCleanup = cleanup; }
  });
  dialog.querySelector('#miloBringShare').addEventListener('click', () => run('whatsapp'));
  dialog.querySelector('#miloBringCopy').addEventListener('click', () => run('copy'));
  return dialog;
}

// Booking before their picks are in: ask first. Nothing changes unless they choose to book.
export function openBookFirstSheet(sessionId = 'aarav', { triggerId, onBook }) {
  const { dialog } = openViewportSheet(sessionId, {
    triggerId,
    labelledBy: 'miloBookFirstTitle',
    html: `
      <h2 class="milo-bring-title" id="miloBookFirstTitle">Their picks aren't in yet.</h2>
      <div class="milo-bring-actions">
        <button type="button" class="milo-pill-btn-primary" id="miloBookMine">Book with my picks</button>
        <button type="button" class="milo-pill-btn-secondary" id="miloWaitTheirs">Wait for theirs</button>
      </div>`
  });
  dialog.querySelector('#miloWaitTheirs').addEventListener('click', () => dialog.close());
  dialog.querySelector('#miloBookMine').addEventListener('click', () => { dialog.close(); onBook(); });
  dialog.querySelector('#miloBookMine').focus();
  return dialog;
}
