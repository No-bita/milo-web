import { resolve } from 'node:path';

// Pages: the landing page at /, the planner at /app/, invites, and /ops/.
// __MILO_QA__ gates the QA/demo URL hooks (?golden, ?reset, ?screen, ?demo,
// ?vp, unsigned demo invites). True only for local dev and explicit local QA
// builds (--mode qa, used by the regression suite); false everywhere else,
// including Vercel Preview and production, so the minifier strips the gated
// paths. Re-enabling QA on Vercel Preview is a separate, unapproved scope.
export default ({ command, mode }) => ({
  define: {
    __MILO_QA__: JSON.stringify(command === 'serve' || mode === 'qa')
  },
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
});
