// Read-only plan a solo planner shared (/app/?shared=<token>). No sign-up, no
// editing. Shows the night, time, stops, venues once booked, and requests only
// if the planner chose not to keep them a surprise.
import { fetchSharedPlan } from '../domain/solo.js';
import { escapeHtml } from '../logic/partner.js';
import { timingLabel } from '../components/night-timing.js';

const shell = (html) => `<div class="milo-stage"><div class="milo-viewport">${html}</div></div>`;

export async function showSharedPlan(container, token) {
  container.innerHTML = shell('<section class="milo-booked"><div class="milo-booked-body"><p class="milo-booked-sub">Opening the plan...</p></div></section>');
  const result = await fetchSharedPlan(token);
  const viewport = container.querySelector('.milo-viewport');
  if (!result.ok) {
    viewport.innerHTML = `<section class="milo-invite-error"><header class="milo-header"><span class="milo-wordmark">milo.</span></header>
      <div class="milo-invite-error-content"><div class="milo-invite-seal" aria-hidden="true">m.</div>
      <h1 class="milo-headline">${result.reason === 'unreachable' ? "Couldn't reach Milo." : "This plan isn't available."}</h1>
      <p class="milo-body-text">${result.reason === 'unreachable' ? 'Try again in a moment.' : 'Ask for a fresh link.'}</p></div></section>`;
    return;
  }
  const p = result.data;
  const from = String(p.from || '').trim() || 'Your date';
  const when = p.timing?.date && p.timing?.time ? timingLabel(p.timing) : '';
  const stops = (p.stops || []).map((name, i) => {
    const v = (p.venues || []).find(x => x.stop_index === i);
    return `<li><span>${escapeHtml(name)}</span>${v ? `<small>${escapeHtml(v.venue)}${v.area ? `, ${escapeHtml(v.area)}` : ''}${v.time ? ` &middot; ${escapeHtml(timingLabel({ date: '2000-01-01', time: v.time }).split(',')[0])}` : ''}</small>` : ''}</li>`;
  }).join('');
  const status = p.status === 'booked' ? 'Booked.' : p.status === 'booking' ? 'Milo is booking it.' : 'Planned.';
  viewport.innerHTML = `<div class="milo-booked milo-shared-plan">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-booked-body">
      <h1 class="milo-booked-title">${escapeHtml(from)} planned a night for you.</h1>
      <p class="milo-booked-sub">${escapeHtml(status)}</p>
      <article class="milo-booked-card" aria-label="The night">
        <p class="milo-booked-label">YOUR NIGHT</p>
        <h2 class="milo-booked-night">${escapeHtml(p.night?.name || 'Your night')}</h2>
        ${when ? `<p class="milo-booked-when">${escapeHtml(when)}</p>` : ''}
        <ul class="milo-booked-beats milo-booked-stops-list">${stops}</ul>
        <div class="milo-booked-seal" aria-hidden="true"><span>m.</span></div>
      </article>
      ${p.requests ? `<section class="milo-booked-private" aria-label="Requests"><p class="milo-booked-label">${escapeHtml(from.toUpperCase())} ASKED FOR</p><p>${escapeHtml(p.requests)}</p></section>` : ''}
    </div>
    <div class="milo-booked-cta"><a class="milo-pill-btn-secondary milo-shared-cta" href="/app/">Plan your own night with Milo</a></div>
  </div>`;
}
