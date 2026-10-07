import { computePersonalSynthesis } from '../logic/synthesis.js';

// Replace this adapter with an async fetch. Resolve only after the actual
// observations are ready; forward signal to fetch so leaving aborts the work.
export async function loadPersonalSynthesis(session, { signal } = {}) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return computePersonalSynthesis(session.intents || [], session.reactions || []);
}

const candle = `<svg class="milo-candle-art" viewBox="0 0 240 240" fill="none" aria-hidden="true">
  <ellipse class="milo-candle-halo" cx="120" cy="92" rx="62" ry="68" />
  <g class="milo-candle-body" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M99 133v65c0 5 42 5 42 0v-65" />
    <ellipse cx="120" cy="133" rx="21" ry="5" />
    <path d="M120 129v-12M87 208c16 5 50 5 66 0" />
  </g>
  <g class="milo-candle-flame">
    <path d="M120 116c-15-6-14-20-5-30 5-6 7-12 7-17 13 17 23 37-2 47Z" fill="currentColor" />
    <path d="M120 112c-5-4-5-10 1-18 6 8 6 14-1 18Z" fill="var(--color-ivory)" />
  </g>
  <g class="milo-candle-match" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
    <path d="m162 152-39-37" /><circle cx="122" cy="114" r="3" fill="currentColor" />
  </g>
  <g class="milo-candle-spark" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
    <path d="m109 104-4-4m29 2 4-4m-17-3v-5" />
  </g>
</svg>`;

// One mounted gate per entry. Data and the visual minimum must BOTH resolve.
// Timeout is an error with retry, never permission to reveal stale/mock data.
export function mountSynthesisLoader(container, { session, load, renderReady, attachReady, onBack }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alive = true;
  let attempt = 0;
  let controller;
  const timers = new Set();
  const later = (fn, ms) => {
    const timer = setTimeout(() => { timers.delete(timer); fn(); }, ms);
    timers.add(timer);
    return timer;
  };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };

  async function start() {
    clearTimers();
    controller?.abort();
    controller = new AbortController();
    const request = ++attempt;
    const started = performance.now();
    container.innerHTML = `<section class="milo-candle-loader" aria-busy="true">
      <span class="milo-candle-wordmark">milo.</span>
      <div class="milo-candle-scene">${candle}
        <h1>Setting the mood.</h1>
        <p role="status" aria-live="polite">Getting a feel for your night...</p>
      </div>
      <span class="milo-candle-caption" aria-hidden="true">A little thought. A better night.</span>
    </section>`;
    const overlay = container.firstElementChild;
    const timeout = new Promise((_, reject) => {
      later(() => { controller.abort(); reject(new Error('Synthesis timed out')); }, 15000);
    });
    try {
      const observations = await Promise.race([load(session, { signal: controller.signal }), timeout]);
      if (!Array.isArray(observations) || observations.some(value => typeof value !== 'string')) {
        throw new Error('Invalid synthesis response');
      }
      if (!alive || request !== attempt) return;
      // Stop the network timeout once data is ready; allow the lighting gesture to finish.
      clearTimers();
      const remaining = Math.max(0, (reduced ? 0 : 1800) - (performance.now() - started));
      later(() => {
        if (!alive || request !== attempt) return;
        const destination = document.createElement('div');
        destination.className = 'milo-candle-destination';
        destination.inert = true;
        destination.setAttribute('aria-hidden', 'true');
        destination.innerHTML = renderReady(observations);
        container.append(destination);
        attachReady(destination);
        overlay.setAttribute('aria-busy', 'false');
        overlay.classList.add('is-ready');
        later(() => {
          if (!alive || request !== attempt) return;
          overlay.remove();
          destination.inert = false;
          destination.removeAttribute('aria-hidden');
        }, reduced ? 80 : 320);
      }, remaining);
    } catch (error) {
      if (!alive || request !== attempt) return;
      clearTimers();
      controller.abort();
      overlay.setAttribute('aria-busy', 'false');
      overlay.classList.add('has-error');
      overlay.querySelector('.milo-candle-scene').innerHTML = `${candle}
        <h1>Let's try that again.</h1>
        <p role="alert">We couldn't get a feel for your night.</p>
        <button class="milo-cta-button" data-loader-retry>Try again</button>
        <button class="milo-candle-back" data-loader-back>Back to discovery</button>`;
      overlay.querySelector('[data-loader-retry]').addEventListener('click', start);
      overlay.querySelector('[data-loader-back]').addEventListener('click', onBack);
    }
  }
  start();
  return () => { alive = false; attempt++; clearTimers(); controller?.abort(); };
}
