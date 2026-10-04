// ==========================================================
// MILO — BROWSER STORAGE ADAPTER
// Plugs into DomainStore to provide optional localStorage
// persistence and cross-tab storage event synchronization.
// ==========================================================

const STORAGE_KEY = 'milo_prototype_v1_state';

export function attachStorageAdapter(store) {
  // 1. Try to load from localStorage on init
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sessionA && parsed.sessionB) {
        store.setState(parsed, false);
      }
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }

  // 2. Subscribe to store changes and mirror to localStorage
  store.subscribe((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to write state to localStorage:', e);
    }
  });

  // 3. Listen for changes from other tabs/windows
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const remoteState = JSON.parse(event.newValue);
        if (remoteState && remoteState.sessionA && remoteState.sessionB) {
          store.setState(remoteState, true);
        }
      } catch (e) {
        console.warn('Failed to process storage sync event:', e);
      }
    }
  });
}
