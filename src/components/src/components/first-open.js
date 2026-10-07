// A single brand moment before the planner's existing journey.
const INTRO_SEEN_KEY = 'milo_intro_seen_v1';

export function showFirstOpen(container, onContinue) {
  const params = new URLSearchParams(window.location.search);
  // Invitation and explicit screen links must keep their original destination.
  if (params.get('as') === 'sneha' || params.has('screen') || params.get('golden') === '1') {
    onContinue();
    return;
  }

  let seen = false;
  try {
    if (params.get('reset') === '1') localStorage.removeItem(INTRO_SEEN_KEY);
    seen = localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    // Private browsing still gets a usable intro and journey.
  }
  if (seen) {
    onContinue();
    return;
  }

  container.innerHTML = `
    <div class="milo-stage">
      <main class="milo-viewport">
        <section class="milo-first-open" aria-labelledby="miloIntroBrand">
          <div class="milo-first-open-body">
            <h1 class="milo-first-open-brand" id="miloIntroBrand">milo.</h1>
            <p class="milo-first-open-copy">Good nights for two.<br><em>Less planning for you.</em></p>
          </div>
          <button class="milo-cta-button milo-first-open-cta" type="button">Let's begin <span aria-hidden="true">→</span></button>
        </section>
      </main>
    </div>
  `;

  container.querySelector('.milo-first-open-cta').addEventListener('click', () => {
    try { localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch { /* Storage is optional. */ }
    onContinue();
    // Move keyboard / screen-reader focus into the newly mounted journey.
    const heading = container.querySelector('.milo-headline');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }, { once: true });
}
