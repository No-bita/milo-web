// ==========================================================
// MILO — DOMAIN STATE STORE
// Decoupled from browser transport (localStorage / network).
// Models session A, session B, and the shared agreement state.
// ==========================================================

export const INITIAL_STATE = {
  sessionA: {
    id: 'aarav',
    name: 'Aarav',
    partnerName: 'Sneha',
    screen: 's1', // 's1' | 'threshold' | 's2' | 's3' | 's4_invite' | 's4_waiting' | 's5' | 's6' | 's7'
    planningMode: null, // 'solo' | 'together', chosen by the initiator
    savedSoloNightId: null, // local draft, not partner agreement
    intents: [],  // array of intent IDs (max 3)
    reactions: [], // array of { cardId, reaction: 'into_it' | 'maybe' | 'not_tonight' }
    currentCardIndex: 0
  },
  sessionB: {
    id: 'sneha',
    name: 'Sneha',
    partnerName: 'Aarav',
    screen: 's1', // or 's0'
    intents: [],
    reactions: [],
    currentCardIndex: 0
  },
  shared: {
    inviteSent: false,
    suggestion: null, // { by: 'aarav' | 'sneha', nightId: string }
    confirmedNightId: null
  }
};

class DomainStore {
  constructor(initialData = INITIAL_STATE) {
    this.state = JSON.parse(JSON.stringify(initialData));
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(newState, notify = true) {
    this.state = newState;
    if (notify) {
      this._emit();
    }
  }

  _emit() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Store listener error:', err);
      }
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  toggleIntent(sessionId, intentId) {
    const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
    const currentIntents = [...this.state[sessionKey].intents];
    const index = currentIntents.indexOf(intentId);

    if (index >= 0) {
      // Deselect
      currentIntents.splice(index, 1);
      this.state = {
        ...this.state,
        [sessionKey]: {
          ...this.state[sessionKey],
          intents: currentIntents
        }
      };
      this._emit();
      return { success: true, action: 'removed', intents: currentIntents };
    } else {
      // Check cap of 3
      if (currentIntents.length >= 3) {
        return { success: false, action: 'cap_exceeded', intents: currentIntents };
      }
      currentIntents.push(intentId);
      this.state = {
        ...this.state,
        [sessionKey]: {
          ...this.state[sessionKey],
          intents: currentIntents
        }
      };
      this._emit();
      return { success: true, action: 'added', intents: currentIntents };
    }
  }

  advanceFromS1(sessionId) {
    const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
    this.state = {
      ...this.state,
      [sessionKey]: {
        ...this.state[sessionKey],
        screen: sessionId === 'sneha' ? 'threshold' : 'planning_path'
      }
    };
    this._emit();
  }

  advanceToS2(sessionId) {
    const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
    this.state = {
      ...this.state,
      [sessionKey]: {
        ...this.state[sessionKey],
        screen: 's2',
        currentCardIndex: 0,
        reactions: []
      }
    };
    this._emit();
  }

  recordReaction(sessionId, reaction) {
    const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
    const current = this.state[sessionKey];
    const currentIndex = current.currentCardIndex || 0;
    const newReactions = [...(current.reactions || []), reaction];
    const nextIndex = currentIndex + 1;

    if (nextIndex >= 8) {
      // Completed deck! Moves to S3
      this.state = {
        ...this.state,
        [sessionKey]: {
          ...current,
          reactions: newReactions,
          currentCardIndex: nextIndex,
          screen: sessionId === 'sneha' ? 's5' : 's3'
        }
      };
    } else {
      this.state = {
        ...this.state,
        [sessionKey]: {
          ...current,
          reactions: newReactions,
          currentCardIndex: nextIndex
        }
      };
    }
    this._emit();
  }

  undoReaction(sessionId) {
    const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
    const current = this.state[sessionKey];
    const currentIndex = current.currentCardIndex || 0;
    if (currentIndex <= 0 || !current.reactions || current.reactions.length === 0) {
      return;
    }
    const newReactions = current.reactions.slice(0, -1);
    this.state = {
      ...this.state,
      [sessionKey]: {
        ...current,
        reactions: newReactions,
        currentCardIndex: currentIndex - 1
      }
    };
    this._emit();
  }

  setSessionScreen(sessionId, screen) {
    const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
    this.state = {
      ...this.state,
      [sessionKey]: {
        ...this.state[sessionKey],
        screen
      }
    };
    this._emit();
  }

  updateSession(sessionId, patch) {
    const sessionKey = sessionId === 'sneha' ? 'sessionB' : 'sessionA';
    this.state = {
      ...this.state,
      [sessionKey]: {
        ...this.state[sessionKey],
        ...patch
      }
    };
    this._emit();
  }

  updateShared(patch) {
    this.state = {
      ...this.state,
      shared: {
        ...this.state.shared,
        ...patch
      }
    };
    this._emit();
  }

  reset() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this._emit();
  }
}

export const store = new DomainStore();
