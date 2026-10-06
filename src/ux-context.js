// Partner first screen context (UX finding 6).
// Adds a short header block to Sneha's first question screen without
// touching the screen template. Safe to re-run; it only inserts once.
export function initPartnerContext(root) {
  if (!root) return;

  function enhance() {
    const intro = root.querySelector('.milo-s1-container[data-session-id="sneha"] .milo-s1-intro');
    if (!intro || intro.querySelector('.milo-partner-context')) return;
    const line = intro.querySelector('.milo-context-line');
    if (!line) return;
    const m = line.textContent.match(/^(.+?)'s done\./);
    const name = m ? m[1] : 'Your partner';

    line.classList.add('milo-context-line--lead');

    const note = document.createElement('p');
    note.className = 'milo-partner-context';
    note.textContent = `${name} invited you to plan tonight. Your picks stay private. About a minute.`;
    line.insertAdjacentElement('afterend', note);
  }

  new MutationObserver(enhance).observe(root, { childList: true, subtree: true });
  enhance();
}
