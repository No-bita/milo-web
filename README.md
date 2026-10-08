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
