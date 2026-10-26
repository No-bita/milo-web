import { resolve } from 'node:path';

// Pages: the landing page at /, the planner at /app/, invites, and /ops/.
export default {
  base: './',
  server: {
    port: 5173,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
        invite: resolve(import.meta.dirname, 'invite/index.html'),
        // Owner-only gift fulfilment list. Not linked; noindex; needs OPS_SECRET.
        ops: resolve(import.meta.dirname, 'ops/index.html')
      }
    }
  }
};
