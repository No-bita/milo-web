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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
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
            <img 
              src="${nextCard.image}" 
              alt="" 
              class="milo-card-img" 
              onerror="if(this.src!=='${nextCard.fallback || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'}'){this.src='${nextCard.fallback || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'}'}"
            />
            <div class="milo-card-scrim"></div>
            <div class="milo-card-body">
              <h2 class="milo-card-title">${nextCard.title}</h2>
              ${nextCard.subline ? `<p class="milo-card-subline">${nextCard.subline}</p>` : ''}
              <div class="milo-card-tags">
                ${(nextCard.tags || ['Romantic', 'Intimate', 'Quiet']).map(t => `<span class="milo-card-tag">${t}</span>`).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        <div class="milo-deck-card milo-card-active" id="miloActiveCard-${sessionId}">
          <img 
            src="${activeCard.image}" 
            alt="${activeCard.title}" 
            class="milo-card-img" 
            onerror="if(this.src!=='${activeCard.fallback || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'}'){this.src='${activeCard.fallback || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'}'}"
          />
          <div class="milo-card-scrim"></div>

          <!-- Drag Edge Labels -->
          <div class="milo-drag-badge milo-badge-into-it">INTO IT</div>
          <div class="milo-drag-badge milo-badge-not-tonight">NOT TONIGHT</div>

          <div class="milo-card-body">
            <h2 class="milo-card-title">${activeCard.title}</h2>
            ${activeCard.subline ? `<p class="milo-card-subline">${activeCard.subline}</p>` : ''}
            <div class="milo-card-tags">
              ${(activeCard.tags || ['Romantic', 'Intimate', 'Quiet']).map(t => `<span class="milo-card-tag">${t}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Controls Area -->
      <div class="milo-deck-controls">
        <div class="milo-reaction-buttons">
          <!-- Button 1: Not Tonight -->
          <button class="milo-reaction-btn btn-not-tonight" id="btnNotTonight-${sessionId}" aria-label="Not tonight" title="Not tonight">
            <div class="milo-btn-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </button>

          <!-- Button 2: More like this (Maybe) -->
          <button class="milo-reaction-btn btn-maybe" id="btnMaybe-${sessionId}" aria-label="More like this" title="More like this">
            <div class="milo-btn-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span class="milo-btn-label">More like this</span>
          </button>

          <!-- Button 3: Into It -->
          <button class="milo-reaction-btn btn-into-it" id="btnIntoIt-${sessionId}" aria-label="Into it" title="Into it">
            <div class="milo-btn-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </button>
        </div>
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
