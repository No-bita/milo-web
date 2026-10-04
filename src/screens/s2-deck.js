// ==========================================================
// MILO — SCREEN 2: DISCOVERY DECK (S2)
// Obsidian discovery environment. 8 cards drawn from 12 pool.
// Swipe gestures, 3 equal buttons (Maybe button-only), undo.
// ==========================================================

import { buildDeck } from '../logic/deck.js';
import { store } from '../domain/store.js';

export function renderScreen02(sessionId = 'aarav') {
  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey];
  const cardIndex = sessionData.currentCardIndex || 0;
  const deck = buildDeck(sessionData.intents || []);
  const activeCard = deck[cardIndex] || deck[0];
  const nextCard = deck[cardIndex + 1] || null;

  // 8 Progress segments
  const progressHtml = Array.from({ length: 8 }).map((_, i) => {
    const isDone = i < cardIndex;
    const isCurrent = i === cardIndex;
    return `<div class="milo-progress-segment ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}"></div>`;
  }).join('');

  const isFirstCard = cardIndex === 0;
  const showFirstCardHint = isFirstCard;

  return `
    <div class="milo-s2-container" data-session-id="${sessionId}">
      <!-- Obsidian Header -->
      <header class="milo-deck-header">
        <button 
          class="milo-deck-undo-btn visible" 
          id="miloDeckUndo-${sessionId}" 
          title="${isFirstCard ? 'Back to intents' : 'Undo last reaction'}" 
          aria-label="${isFirstCard ? 'Back to intents' : 'Undo'}"
        >
          ←
        </button>

        <div class="milo-deck-progress">
          ${progressHtml}
        </div>

        <span class="milo-wordmark on-dark">milo.</span>
      </header>

      <!-- Card Stage -->
      <div class="milo-deck-stage" id="miloDeckStage-${sessionId}">
        ${nextCard ? `
          <div class="milo-deck-card milo-card-peeking" aria-hidden="true">
            <img src="${nextCard.image}" alt="" class="milo-card-img" />
            <div class="milo-card-scrim"></div>
            <div class="milo-card-body">
              <h2 class="milo-card-title">${nextCard.title}</h2>
              <p class="milo-card-subline">${nextCard.subline}</p>
              <div class="milo-card-shape">${nextCard.shape}</div>
            </div>
          </div>
        ` : ''}

        <div class="milo-deck-card milo-card-active" id="miloActiveCard-${sessionId}">
          <img src="${activeCard.image}" alt="${activeCard.title}" class="milo-card-img" />
          <div class="milo-card-scrim"></div>

          <!-- Drag Edge Labels -->
          <div class="milo-drag-badge milo-badge-into-it">INTO IT</div>
          <div class="milo-drag-badge milo-badge-not-tonight">NOT TONIGHT</div>

          <div class="milo-card-body">
            <h2 class="milo-card-title">${activeCard.title}</h2>
            <p class="milo-card-subline">${activeCard.subline}</p>
            <div class="milo-card-shape">${activeCard.shape}</div>
          </div>
        </div>
      </div>

      <!-- Controls Area -->
      <div class="milo-deck-controls">
        <div class="milo-reaction-buttons">
          <!-- Button 1: Not Tonight -->
          <button class="milo-reaction-btn btn-not-tonight" id="btnNotTonight-${sessionId}" aria-label="Not tonight">
            <div class="milo-btn-circle">✕</div>
            <span class="milo-btn-label">Not tonight</span>
          </button>

          <!-- Button 2: Maybe (Button ONLY) -->
          <button class="milo-reaction-btn btn-maybe" id="btnMaybe-${sessionId}" aria-label="Maybe">
            <div class="milo-btn-circle">○</div>
            <span class="milo-btn-label">Maybe</span>
          </button>

          <!-- Button 3: I'm Into It -->
          <button class="milo-reaction-btn btn-into-it" id="btnIntoIt-${sessionId}" aria-label="I'm into it">
            <div class="milo-btn-circle">✓</div>
            <span class="milo-btn-label">I'm into it</span>
          </button>
        </div>

        ${showFirstCardHint ? `
          <div class="milo-deck-hint">Swipe, or use the buttons.</div>
        ` : '<div class="milo-deck-hint-spacer"></div>'}
      </div>
    </div>
  `;
}

export function attachScreen02Listeners(container, sessionId = 'aarav') {
  const card = container.querySelector(`#miloActiveCard-${sessionId}`);
  const undoBtn = container.querySelector(`#miloDeckUndo-${sessionId}`);
  const btnNot = container.querySelector(`#btnNotTonight-${sessionId}`);
  const btnMaybe = container.querySelector(`#btnMaybe-${sessionId}`);
  const btnInto = container.querySelector(`#btnIntoIt-${sessionId}`);

  const state = store.getState();
  const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
  const sessionData = state[sessionKey];
  const deck = buildDeck(sessionData.intents || []);
  const activeCard = deck[sessionData.currentCardIndex || 0];

  function commitReaction(reaction, exitType = 'fly') {
    if (!card) return;

    if (exitType === 'fly-right') {
      card.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease';
      card.style.transform = 'translate3d(120%, 0, 0) rotate(16deg)';
      card.style.opacity = '0';
    } else if (exitType === 'fly-left') {
      card.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease';
      card.style.transform = 'translate3d(-120%, 0, 0) rotate(-16deg)';
      card.style.opacity = '0';
    } else if (exitType === 'sink') {
      // Maybe sinks: drops 24px, scales to 0.94, fades out
      card.style.transition = 'transform 240ms ease, opacity 240ms ease';
      card.style.transform = 'translate3d(0, 24px, 0) scale(0.94)';
      card.style.opacity = '0';
    }

    setTimeout(() => {
      store.recordReaction(sessionId, {
        cardId: activeCard ? activeCard.id : 'unknown',
        reaction
      });
    }, exitType === 'sink' ? 240 : 260);
  }

  // Button actions
  if (btnNot) {
    btnNot.addEventListener('click', (e) => {
      e.stopPropagation();
      commitReaction('not_tonight', 'fly-left');
    });
  }

  if (btnMaybe) {
    btnMaybe.addEventListener('click', (e) => {
      e.stopPropagation();
      commitReaction('maybe', 'sink');
    });
  }

  if (btnInto) {
    btnInto.addEventListener('click', (e) => {
      e.stopPropagation();
      commitReaction('into_it', 'fly-right');
    });
  }

  if (undoBtn) {
    undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentIdx = sessionData.currentCardIndex || 0;
      if (currentIdx === 0) {
        store.setSessionScreen(sessionId, 's1');
      } else {
        store.undoReaction(sessionId);
      }
    });
  }

  // Gestures (Touch + Mouse Drag)
  if (card) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;
    const badgeInto = card.querySelector('.milo-badge-into-it');
    const badgeNot = card.querySelector('.milo-badge-not-tonight');

    function onStart(clientX, clientY) {
      startX = clientX;
      startY = clientY;
      currentX = 0;
      isDragging = true;
      card.style.transition = 'none';
    }

    function onMove(clientX, clientY) {
      if (!isDragging) return;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      // Ignore pure vertical scroll attempt
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 10) {
        return;
      }

      currentX = deltaX;
      const rotation = deltaX * 0.05;
      card.style.transform = `translate3d(${deltaX}px, 0, 0) rotate(${rotation}deg)`;

      const cardWidth = card.offsetWidth || 300;
      const progress = Math.min(1, Math.abs(deltaX) / (cardWidth * 0.35));

      if (deltaX > 0) {
        if (badgeInto) badgeInto.style.opacity = progress;
        if (badgeNot) badgeNot.style.opacity = 0;
        if (btnInto) btnInto.classList.add('active-drag');
        if (btnNot) btnNot.classList.remove('active-drag');
      } else {
        if (badgeNot) badgeNot.style.opacity = progress;
        if (badgeInto) badgeInto.style.opacity = 0;
        if (btnNot) btnNot.classList.add('active-drag');
        if (btnInto) btnInto.classList.remove('active-drag');
      }
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      const cardWidth = card.offsetWidth || 300;
      const threshold = cardWidth * 0.30;

      if (badgeInto) badgeInto.style.opacity = 0;
      if (badgeNot) badgeNot.style.opacity = 0;
      if (btnInto) btnInto.classList.remove('active-drag');
      if (btnNot) btnNot.classList.remove('active-drag');

      if (currentX > threshold) {
        commitReaction('into_it', 'fly-right');
      } else if (currentX < -threshold) {
        commitReaction('not_tonight', 'fly-left');
      } else {
        // Spring back with little bounce
        card.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
      }
    }

    // Touch events
    card.addEventListener('touchstart', (e) => {
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    card.addEventListener('touchend', onEnd);
    card.addEventListener('touchcancel', onEnd);

    // Mouse events
    card.addEventListener('mousedown', (e) => {
      onStart(e.clientX, e.clientY);
      const onMouseMove = (moveEvent) => onMove(moveEvent.clientX, moveEvent.clientY);
      const onMouseUp = () => {
        onEnd();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // CRITICAL: Tapping card does NOT vote Maybe or anything!
    card.addEventListener('click', (e) => {
      e.preventDefault();
      // No reaction on tap
    });
  }

  // Keyboard navigation
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      commitReaction('not_tonight', 'fly-left');
    } else if (e.key === 'ArrowDown') {
      commitReaction('maybe', 'sink');
    } else if (e.key === 'ArrowRight') {
      commitReaction('into_it', 'fly-right');
    }
  };
  window.addEventListener('keydown', onKeyDown, { once: true });
}
