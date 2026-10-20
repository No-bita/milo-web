import { track } from './analytics.js';

// Old shared links bounce to /app/; the app reports those, not the landing page.
if (!/[?&](as|invite|screen|demo|golden|reset)=/.test(location.search)) {
  track('landing_viewed', { source: new URLSearchParams(location.search).get('utm_source') });
}
