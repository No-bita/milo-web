import '../styles/night-accordion.css';

// Keep browsing local to each view: expanding is not a selection or a store write.
const expandedBySession = new Map();

export function renderNightAccordion(items, { sessionId, suggestion, partnerPickLabel }) {
  const remembered = expandedBySession.get(sessionId);
  const openId = items.some(item => item.night.id === remembered) ? remembered : items[0]?.night.id;
  return items.map((item, index) => {
    const { night } = item;
    const open = night.id === openId;
    const isPartnerPick = suggestion?.nightId === night.id && suggestion.by !== sessionId;
    const isMyPick = suggestion?.nightId === night.id && suggestion.by === sessionId;
    const badge = isPartnerPick
      ? `<span class="milo-partner-pick-label">${partnerPickLabel}</span>`
      : isMyPick ? '<span class="milo-my-pick-label">YOUR SUGGESTION</span>' : '';
    const key = `${sessionId}-${night.id}`;
    return `
      <article class="milo-night-option${open ? ' is-expanded' : ''}" data-night-id="${night.id}">
        ${index === 0 ? `<p class="milo-night-recommendation">We think this one's yours</p>` : ''}
        <h2 class="milo-night-option-heading">
          <button type="button" class="milo-night-toggle" id="nightToggle-${key}" aria-expanded="${open}" aria-controls="nightPanel-${key}">
            <span class="milo-night-option-thumb"><img src="${night.defaultImage}" alt="" loading="lazy" /></span>
            <span class="milo-night-option-title">
              <span class="milo-night-option-meta"><span class="milo-night-num">${item.num}</span>${badge}</span>
              <span class="milo-night-option-name">${night.name}</span>
            </span>
            <svg class="milo-night-option-chevron" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.6" fill="none" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </h2>
        <div class="milo-night-panel" id="nightPanel-${key}" role="region" aria-labelledby="nightToggle-${key}"${open ? '' : ' inert'}>
          <div class="milo-night-panel-clip">
            <div class="milo-night-panel-content">
              <p class="milo-night-option-fit">${item.fitLine}</p>
              <p class="milo-night-option-beats">${night.beats.map(beat => beat.name).join(' <span aria-hidden="true">→</span> ')}</p>
              <div class="milo-night-option-why"><span class="milo-night-why-label">Why it fits</span><p>${item.whyItWorks}</p></div>
              <button type="button" class="milo-night-open milo-pill-btn-primary" data-open-night="${night.id}">Open this night <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </div>
      </article>`;
  }).join('');
}

export function attachNightAccordion(container, sessionId, onOpen) {
  const options = [...container.querySelectorAll('.milo-night-option')];
  options.forEach(option => {
    const toggle = option.querySelector('.milo-night-toggle');
    toggle.addEventListener('click', () => {
      // The open card stays open. Every header always means "show details".
      if (toggle.getAttribute('aria-expanded') === 'true') return;
      expandedBySession.set(sessionId, option.dataset.nightId);
      options.forEach(other => {
        const open = other === option;
        other.classList.toggle('is-expanded', open);
        other.querySelector('.milo-night-toggle').setAttribute('aria-expanded', String(open));
        other.querySelector('.milo-night-panel').inert = !open;
      });
      // Leave focus on the tapped header; the next Tab reaches its explicit CTA.
    });
    option.querySelector('[data-open-night]').addEventListener('click', event => {
      onOpen(event.currentTarget.dataset.openNight);
    });
  });
}
