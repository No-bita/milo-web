import { resolve } from 'node:path';

// Two pages: the landing page at / and the planner at /app/.
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
        invite: resolve(import.meta.dirname, 'invite/index.html')
      }
    }
  }
};
