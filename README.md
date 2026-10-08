# Milo frontend prototype

A mobile-first date-planning preview built with vanilla JavaScript and Vite.

## Current flows

Mood selection, solo/together planning, discovery cards, reflection, invite preparation, shared recommendations, per-slot alternatives, local agreement and date/time selection.

The demo uses fixed Aarav/Sneha identities and same-browser localStorage. Invite metadata is unsigned, not authentication. There is no cross-device sync, notification service, venue availability, booking, payment or calendar creation. Solo saves are local drafts, not partner agreement.

## Run locally

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## Source map

- `src/main.js`: styles, first-open entry and app mounting
- `src/app.js`: screen controller and subscriptions
- `src/domain/`: store, invite contract and browser persistence
- `src/logic/`: discovery, synthesis and recommendation logic
- `src/screens/`: current journey screens and solo draft
- `src/components/`: timing, invite feedback, loader and UI helpers
- `src/data/mockData.js`: prototype moods, cards and night concepts
- `src/styles/`: layered current styling

Explicit `?screen=s7&golden=1` links open a controlled demo state. `?as=sneha` selects the partner preview; these query parameters are not access control.

Removed legacy controllers, data and showcase helpers were unreachable from `src/main.js` and referenced screens no longer in the repository. Their removal does not reduce the production bundle. CSS consolidation is intentionally excluded to avoid changing the current design.

## Local regression checks

```sh
npm ci
npx playwright install chromium
npm run test:all
```

`npm test` runs the fast domain/component tests. `npm run test:regression` builds the production app, starts an isolated preview on localhost:4178 and runs browser journeys at 320px and 420px. It checks partner Back navigation and pick preservation/reset, popup and clipboard recovery UI, invite rejection/acceptance, same-origin tab swaps, suggestion/confirmation, timing persistence and demo reset. Popups and clipboard are stubbed; no messages are sent. Cross-tab checks use two real pages in the same browser context, not a fabricated successful sync event. Unrelated/malformed events are also checked.

For system Chrome, use `CHROME_BIN=/path/to/chrome npm run test:all`. Set `MILO_EVIDENCE_DIR=/path/to/output` to save selected screenshots for review. The preview port must be free. Screenshots are evidence for inspection, not an automated pixel-diff baseline. Tests cover the listed prototype scenarios, not network/device sync or simultaneous-write conflict handling. Storage remains last-writer-wins; validation/migration is a separate change. CI is not included.
