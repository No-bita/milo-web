// Mock slot pools, not venue listings. Only the selected beat is replaced.
const photo = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;
const SLOT_POOLS = {
  dinner: [
    { name: 'Dinner', desc: 'somewhere small and candlelit, no rush.', image: photo('photo-1517248135467-4c7edcad34c4') },
    { name: 'Courtyard dinner', desc: 'a quiet table tucked away from the street.', image: photo('photo-1555396273-367ea4eb4db5') },
    { name: 'Sharing plates', desc: 'a few small plates and a long conversation.', image: photo('photo-1504674900247-0877df9cc836') }
  ],
  walk: [
    { name: 'Walk', desc: 'quiet streets, nowhere we need to be.', image: photo('photo-1519501025264-65ba15a82390') },
    { name: 'Garden stroll', desc: 'a leafy path and time to wander.', image: photo('photo-1448375240586-882707db888b') },
    { name: 'Sunset spot', desc: 'pause somewhere open as the light changes.', image: photo('photo-1519331379826-f10be5486c6f') }
  ],
  dessert: [
    { name: 'Dessert', desc: 'a table outside if it is warm.', image: photo('photo-1551024601-bec78aea704b') },
    { name: 'Something sweet', desc: 'pick two favourites and share a little of each.', image: photo('photo-1488477181946-6428a0291777') }
  ],
  creative: [
    { name: 'Creative activity', desc: 'hands-on, fun, no pressure.', image: photo('photo-1565193566173-7a0ee3dbe261') },
    { name: 'Make something together', desc: 'try a small project, with no need to be good at it.', image: photo('photo-1565193566173-7a0ee3dbe261') }
  ],
  drinks: [
    { name: 'Rooftop', desc: 'drinks above the city lights.', image: photo('photo-1516589178581-6cd7833ae3b2') },
    { name: 'Cocktail bar', desc: 'an intimate corner for one last drink.', image: photo('photo-1551024709-8f23befc6f87') }
  ],
  music: [
    { name: 'Live music', desc: 'small set, close enough to feel it.', image: photo('photo-1514306191717-452ec28c7814') },
    { name: 'Acoustic set', desc: 'a quieter set in a small room.', image: photo('photo-1514306191717-452ec28c7814') }
  ],
  cosy: [
    { name: 'Somewhere cosy', desc: 'settle in from the chill.', image: photo('photo-1554118811-1e0d58224f24') },
    { name: 'A warm cafe', desc: 'a tucked-away table and something warm.', image: photo('photo-1501339847302-ac426a4a7cbb') }
  ]
};
export function slotKey(name) {
  if (/dinner|plates|food/i.test(name)) return 'dinner';
  if (/walk|sunset/i.test(name)) return 'walk';
  if (/dessert/i.test(name)) return 'dessert';
  if (/creative/i.test(name)) return 'creative';
  if (/music/i.test(name)) return 'music';
  if (/rooftop|cocktail|nightcap/i.test(name)) return 'drinks';
  return 'cosy';
}

export function renderItinerary(night, original, { editable = true, lockedSlots = false, stacked = false } = {}) {
  return night.beats.map((beat, i) => {
    const image = beat.image || SLOT_POOLS[slotKey(original.beats[i].name)][0].image;
    const locked = lockedSlots;
    if (stacked) return `<button type="button" class="milo-tile milo-plan-tile" data-customise-slot="${i}" aria-label="Customise ${beat.name}" ${locked ? 'disabled title="This night has already been suggested"' : ''}>
      <img src="${image}" alt="" class="milo-tile-img" loading="lazy" />
      <span class="milo-tile-scrim" aria-hidden="true"></span>
      <span class="milo-plan-step" aria-hidden="true">0${i + 1}</span>
      <span class="milo-plan-edit" aria-hidden="true">↗</span>
      <span class="milo-plan-caption"><span class="milo-tile-label">${beat.name}</span><span class="milo-plan-detail">${beat.desc}</span></span>
    </button>`;
    return `
      <div class="milo-timeline-item milo-visual-beat">
        <div class="milo-timeline-track" aria-hidden="true">
          <span class="milo-beat-number">${i + 1}</span>
          ${i < night.beats.length - 1 ? '<div class="milo-timeline-line"></div>' : ''}
        </div>
        <div class="milo-beat-card">
          <img class="milo-beat-image" src="${image}" alt="" loading="lazy" />
          <div class="milo-beat-copy">
            <span class="milo-timeline-name">${beat.name}</span>
            <span class="milo-timeline-desc">${beat.desc}</span>
            ${editable ? `<button class="milo-customise-btn" data-customise-slot="${i}" aria-label="Customise ${beat.name}" ${locked ? 'disabled title="This night has already been suggested"' : ''}>Customise <span aria-hidden="true">↗</span></button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

}

export function attachItinerary(container, getPlan, onPick) {
  // A parallel, per-slot feed. Cancel leaves the itinerary untouched.
  container.querySelectorAll('[data-customise-slot]').forEach(button => {
    button.addEventListener('click', () => {
      const slot = Number(button.dataset.customiseSlot);
      const { original, night, locked } = getPlan();
      if (!original || locked) return;
      const current = night.beats[slot];
      const options = SLOT_POOLS[slotKey(original.beats[slot].name)].filter(option => option.name !== current.name);
      let index = 0;
      const dialog = document.createElement('dialog');
      dialog.className = 'milo-slot-feed';
      dialog.setAttribute('aria-label', `Customise ${original.beats[slot].name}`);
      dialog.innerHTML = `
        <div class="milo-slot-feed-inner">
          <div class="milo-slot-feed-top"><span>JUST THE ${original.beats[slot].name.toUpperCase()} SLOT</span><button data-close aria-label="Close alternatives">✕</button></div>
          <p class="milo-slot-demo">Demo ideas, not bookable venues.</p>
          <div class="milo-slot-candidate"><img alt="" /><h2></h2><p></p></div>
          <div class="milo-slot-nav"><button data-prev aria-label="Previous alternative">←</button><span aria-live="polite"></span><button data-next aria-label="Next alternative">→</button></div>
          <button class="milo-cta-button" data-pick>Use this instead</button>
          <button class="milo-secondary-link" data-close>Keep the current plan</button>
        </div>`;
      container.appendChild(dialog);
      const render = () => {
        const option = options[index];
        dialog.querySelector('img').src = option.image;
        dialog.querySelector('h2').textContent = option.name;
        dialog.querySelector('.milo-slot-candidate p').textContent = option.desc;
        dialog.querySelector('[aria-live]').textContent = `${index + 1} of ${options.length}`;
        dialog.querySelector('[data-prev]').disabled = index === 0;
        dialog.querySelector('[data-next]').disabled = index === options.length - 1;
      };
      const move = delta => { index = Math.max(0, Math.min(options.length - 1, index + delta)); render(); };
      const close = () => { dialog.close(); dialog.remove(); button.focus(); };
      dialog.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', close));
      dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
      dialog.querySelector('[data-prev]').addEventListener('click', () => move(-1));
      dialog.querySelector('[data-next]').addEventListener('click', () => move(1));
      let start;
      const card = dialog.querySelector('.milo-slot-candidate');
      card.addEventListener('touchstart', event => { start = event.touches[0].clientX; }, { passive: true });
      card.addEventListener('touchend', event => {
        const distance = event.changedTouches[0].clientX - start;
        if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1);
      }, { passive: true });
      dialog.querySelector('[data-pick]').addEventListener('click', () => {
        if (getPlan().locked) { close(); return; }
        dialog.close();
        dialog.remove();
        onPick(slot, options[index]);
      });
      render();
      dialog.showModal();
    });
  });

}
