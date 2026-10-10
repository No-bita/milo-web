// A single brand moment before the planner's existing journey.
// The dot of the "i" bounces, arcs to the period, merges and pulses, then a ripple opens the app.
const INTRO_SEEN_KEY = 'milo_intro_seen_v1';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        <section class="milo-first-open" tabindex="0" role="region" aria-label="Welcome to Milo">
          <div class="milo-first-open-body">
            <h1 class="milo-first-open-brand" aria-label="milo."><span aria-hidden="true">m<span class="milo-first-open-i">&#305;<i class="milo-first-open-tit"></i></span>lo<span class="milo-first-open-period"></span></span></h1>
            <p class="milo-first-open-copy"><em>For moments that matter</em></p>
          </div>
          <div class="milo-first-open-ripple" aria-hidden="true"></div>
        </section>
      </main>
    </div>
  `;

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try { localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch { /* Storage is optional. */ }
    onContinue();
    // Move keyboard / screen-reader focus into the newly mounted journey.
    const heading = container.querySelector('.milo-headline');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  };

  const section = container.querySelector('.milo-first-open');
  section.addEventListener('click', finish, { once: true });
  section.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      finish();
    }
  });
  play(section, () => done).then(finish);
}

async function play(section, isDone) {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || isDone()) return;
  await wait(250);
  if (isDone()) return;

  const tit = section.querySelector('.milo-first-open-tit');
  const period = section.querySelector('.milo-first-open-period');
  const ripple = section.querySelector('.milo-first-open-ripple');
  if (!tit.animate) return;
  const em = parseFloat(getComputedStyle(tit).fontSize);
  const a = tit.getBoundingClientRect();
  const p = period.getBoundingClientRect();
  const dx = p.left + p.width / 2 - (a.left + a.width / 2);
  const dy = p.top + p.height / 2 - (a.top + a.height / 2);

  await tit.animate([
    { transform: 'translateY(0)' },
    { transform: `translateY(${-0.3 * em}px)`, offset: 0.4 },
    { transform: 'translateY(0) scale(1.14,.84)', offset: 0.75 },
    { transform: 'translateY(0)' }
  ], { duration: 350, easing: 'cubic-bezier(.3,0,.3,1)' }).finished;
  if (isDone()) return;

  // Semicircular arc from the i to the period.
  const c = Math.hypot(dx, dy);
  const R = c * 0.5;
  let nx = dy / c;
  let ny = -dx / c;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const hh = Math.sqrt(Math.max(R * R - c * c / 4, 0));
  const cx = dx / 2 - nx * hh;
  const cy = dy / 2 - ny * hh;
  const a0 = Math.atan2(-cy, -cx);
  let da = Math.atan2(dy - cy, dx - cx) - a0;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  const frames = [];
  for (let i = 0; i <= 60; i += 1) {
    const t = i / 60;
    const e = t * t * (3 - 2 * t);
    const an = a0 + da * e;
    frames.push({ transform: `translate(${cx + R * Math.cos(an)}px,${cy + R * Math.sin(an)}px)`, offset: t });
  }
  await tit.animate(frames, { duration: 400, easing: 'linear', fill: 'forwards' }).finished;
  if (isDone()) return;
  tit.style.opacity = '0';

  await period.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(2.1)', offset: 0.45 },
    { transform: 'scale(1)' }
  ], { duration: 250, easing: 'ease-in-out' }).finished;
  if (isDone()) return;

  ripple.style.left = `${p.left + p.width / 2 - section.getBoundingClientRect().left - 20}px`;
  ripple.style.top = `${p.top + p.height / 2 - section.getBoundingClientRect().top - 20}px`;
  ripple.classList.add('is-on');
  await wait(300);
}
