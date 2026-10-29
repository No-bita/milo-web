// QA/demo affordances (?golden, ?reset, ?screen, ?demo, ?vp, unsigned demo
// invites) exist for development and regression runs only. __MILO_QA__ is a
// build-time constant injected by vite.config.js: true for `vite dev`,
// `--mode qa` builds (regression suite) and Vercel Preview deployments, false
// for production builds, where the minifier strips the gated code paths.
// Under plain Node (unit tests) the constant is not defined, so hooks stay
// off. The real partner switch (?as) and server invites (?invite, ?shared)
// are production flows and stay ungated.
export const QA_MODE = typeof __MILO_QA__ !== 'undefined' ? __MILO_QA__ : false;
