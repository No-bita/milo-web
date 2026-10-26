# Two-phone Phase 1 server (v2)

Dependency order: merge the schema/security contract PR first, then the API
PR. Neither is a working two-phone frontend on its own. The user merges.

## Launch is OFF by default

Nothing serves plan data unless `MILO_PHASE1_ENABLED=true`. Do not enable it
until the owner has approved the host terms, created Neon, applied
`server/schema.sql` to an empty database, entered server env vars, and finished
frontend/manual acceptance. No accounts, keys or public data were created by
this code change. Vercel Hobby eligibility for this product trial remains an
explicit gate. Render and Cloudflare are not chosen fallbacks.

Owner enters these in Vercel's server environment settings, not chat or git:
`DATABASE_URL` (Neon connection string with required SSL settings),
`RATE_LIMIT_SECRET` (random HMAC key), `CRON_SECRET` (random cron bearer),
`MILO_PUBLIC_ORIGIN` (canonical HTTPS site origin), `MILO_PHASE1_ENABLED`.
Use separate test/production databases. Do not use VITE_ prefixes for secrets.
PostHog needs his project and region for the separate frontend work; the server
has no PostHog dependency. The public analytics token also uses secure entry.

The Vercel rewrite routes all /api paths to one Node fetch handler; the
platform passes the original subpath as the `path` query param and the handler
reconstructs it. A single 00:00 UTC cron calls /api/cleanup/ daily using
Vercel's CRON_SECRET bearer: the trailing slash is required because
trailingSlash redirects /api/cleanup and cron requests do not follow the 308.
Cleanup stays authenticated and runs even while MILO_PHASE1_ENABLED is off, so
stored plans are still deleted while the product API is paused.
Do not copy it to a different host without replacing trusted IP handling and
arranging an authenticated daily scheduler. No cross-origin CORS is enabled.
Every response is no-store. Bodies are capped at 8 KiB. SQL is parameterized.
The database connection uses the Neon URL's SSL configuration; never disable
certificate validation to work around an error.

## Contract

- POST /api/plans {name, partnerName?, occasion?} -> {plan_id,invite_url,seat_key}.
  partnerName is validated, not a placeholder participant or a saved identity.
- GET /api/invites/:token -> {status,initiator_name,occasion,day?} for valid
  links. Expired/taken links return status only. Unknown tokens return 404.
- POST /api/invites/:token/join {name} -> {plan_id,seat_key}; 409 taken,
  410 expired. Plan row lock + unique role prevent a double claim.
- PUT /api/plans/:id/me {intents,reactions,finished} -> {ok}. Authorization:
  Bearer seat_key. Saving never touches the other seat. Finished requires 8
  distinct valid reactions. Intents: <=3; all mood/card/night IDs allowlisted.
- GET /api/plans/:id -> {id,occasion,city,status,me,partner,shared_result,
  suggestion,confirmed_night_id,timing}. `me` has your own picks; `partner`
  has only display_name and finished. No hashes, invite token or seat IDs.
- POST /api/plans/:id/actions {type,night_id?,timing?} -> same plan view.
  suggest/confirm use a night in the three server results; confirmation must
  match the current suggestion. Either seat may confirm. set_time takes
  {date,time,time_zone}, valid calendar date, HH:MM, IANA timezone; it also
  works before results so invite previews can show the day. No stop swaps.

All private plan reads/writes require a seat belonging to that exact plan.
Writes lock the plan before reading seats, so simultaneous finishing cannot
lose computation and join is atomic. Computation uses existing shared.js;
only the display projection is persisted. Names are plain text; the frontend
must escape them and replace its remaining demo-only names.

Safe errors: 400 invalid_request; 401 unauthorized; 404 not_found; 409
not_ready/not_suggested/already_confirmed/taken; 410 expired; 413 too_large;
429 rate_limited (+ Retry-After:60); 503 unavailable. No exception text,
stacks, SQL, credentials or pick payloads are logged or returned.

Public rate limits are mandatory and fail closed if the trusted IP or secret
is missing: per HMAC(IP) and minute, create 20, preview 60, join 20. Atomic
Postgres upsert runs before token lookup, including invalid tokens. Trusted
Vercel ingress only: missing/malformed IPs fail closed. IPv4-mapped IPv6 maps
to canonical IPv4; native IPv6 maps to its canonical /64 network before HMAC,
so equivalent spellings and address rotation inside that network share quota.
Never take client identity from an untrusted X-Forwarded-For header. Raw IP
is not stored. This is simple per-IP protection, not edge bot protection.

## Parked, intentionally unchanged

1. New phone means a NEW plan and fresh link, no seat recovery/pick carryover.
2. Result computes once, not on later pick edits; it can become stale.
3. Frontend polling remains 5s -> 30s, stops at 10min. The manual within-30s
   expectation still conflicts with the slow cadence. Not quietly fixed.
4. Rate-limit rows are not cleaned; writes wake Neon. Compute-hours and
   accumulated counters need monitoring before scale. Cleanup only cascades
   plans/participants older than 30 days (30-31 days with daily scheduling).
5. Free-host terms/limits and fallback eligibility are launch decisions, not
   optimisations that code can certify. No production launch is claimed.

## Verification

Exactly one new automated test, src/tests/two-phone-privacy.test.mjs, uses
Playwright's two isolated browser contexts against the real handler and an
in-memory PostgreSQL-compatible PGlite database loaded from schema.sql. It
checks own picks, other-seat field allowlists and shared-result nested
allowlists, including actions responses. This does NOT verify a live Neon
connection, Vercel routing, trusted ingress IP or deployed cron execution.
Run npm test, npm run build, and node --test src/tests/two-phone-privacy.test.mjs.
Existing browser regressions stay unchanged; all other new scenarios use the
manual checklist in v2 after account setup and approved frontend wiring.

## Gifting (V1)

Off with the rest of Phase 1 (`MILO_PHASE1_ENABLED`). Apply `server/gifts.sql`
AFTER `server/schema.sql`. Gifts cascade-delete with their plan, so the daily
cleanup also removes delivery addresses and contact numbers after 30 days.
Owner adds one more server env var for the ops page: `OPS_SECRET` (random,
16+ characters). Without it, `/api/ops/*` returns 503 (fails closed).

Seat-authenticated (Bearer seat_key, same plan only):

- GET /api/plans/:id/gifts -> {can_add, mine, for_me, sealed_waiting, hint, memory:{open,mine,theirs}, from}
- POST /api/plans/:id/gifts {kind, ...} -> same view. Needs status confirmed AND a time set (409 not_ready).
  - moment_drop {item_id, stop_index 0-2, venue, contact, note?, show_hint?}
  - home_delivery {item_id, address, deliver_window morning|afternoon|evening, contact, note?, show_hint?}
  - sealed_note {note <=500, stop_index?} · teaser {note <=140} · memory {note <=200, only after start}
  - item_id must be in src/data/gifts.js and allow that kind; 409 too_soon if the night is closer than the item's leadDays.
  - Limits per giver: 3 physical, 1 sealed note, 1 teaser, 1 memory line (409 limit).
- DELETE /api/plans/:id/gifts/:giftId -> giver only; physical while `requested`, digital before it opens (409 locked).

Reveal rules (computed from plans.timing at read time; changing the time moves them):
- The recipient never receives a physical gift's item, venue, address, card text or contact. Only `hint:true` when the giver ticked it.
- Teaser text from 00:00 on the day before the night (plan time zone). Sealed note text from the start time; before that, only `sealed_waiting:true`.
- Memory lines open at the start time; the other line is returned only once both lines exist.
- The giver's contact number is stored for the ops list only and is never returned to either seat.

Owner-only (Bearer OPS_SECRET): GET /api/ops/gifts lists physical gifts with fulfilment details; POST /api/ops/gifts/:id {status}
with requested|confirmed|dispatched|delivered|cancelled. The giver sees the status; the recipient does not. The /ops/ page is not
linked, is noindex, and keeps the key in sessionStorage for that tab only. There is no per-IP limit on ops routes (the key is the gate).

Prices are placeholders ("Price on confirmation"); there is no payment, no notification and no vendor integration in V1.
Tests: src/tests/gifts-api.test.mjs (contract, secrecy, clocked reveals, ops) and src/tests/two-phone-gifting.test.mjs (UI journey).

## Intent model v3.1 switch (phases A + B)

The shared result goes through `src/logic/shared-result.js`. Optional server env var
`MILO_INTENT_MODEL=v3.1` (and `VITE_MILO_INTENT_MODEL=v3.1` for the app build) selects the
intent model in `src/logic/intent/`, but only when both seats carry v3.1 quiz answers. No seat
stores those until the new quiz screens (phase C) and server fields (phase D) ship, so today it
has no effect. Python reference and parity data: `docs/intent-model/`.

## Concierge and PMF (V1)

Apply `server/concierge.sql` AFTER `schema.sql` and `gifts.sql`. It is required once this
code ships: suggest/confirm now record a PMF event, so without the table those actions fail.
Everything cascades with the plan (30-day cleanup also removes contacts, notes, check-ins, events).

Seat-authenticated:
- GET /api/plans/:id/booking -> {can_request, booking:{status, requested_by_me, venues, budget_band?, window_hours?, notes?}|null, checkin:{open, done}}
  Budget/window/notes only for the requester. Venues only once ops marks it `booked`. No contact numbers.
- POST /api/plans/:id/booking {budget_band under_2k|2k_4k|4k_7k|7k_plus, window_hours 3|4, contact, notes?}
  Needs a confirmed night with a time (409 not_ready); one active booking per plan (409 exists).
- DELETE /api/plans/:id/booking -> requester only, while `requested` (409 locked after).
- POST /api/plans/:id/checkin {differently yes|partly|no, wouldnt_have?, rating 1-5, use_again, recommend yes|maybe|no,
  would_pay nothing|under_200|200_500|500_1000|1000_plus}. Opens 09:00 (plan time zone) the day after the night; once per person.
  Answers are never returned to either seat.
- POST /api/plans/:id/events {type:'see_other', night_id?} -> {ok}. Capped at 200 per seat. Never returned to a seat.
  The server itself records `suggest` and `confirm` events.

Owner-only (Bearer OPS_SECRET):
- GET /api/ops/bookings · POST /api/ops/bookings/:id {status requested|booked|failed|cancelled, venues:[{stop_index, venue, area?, time?}], ops_minutes}
  `booked` needs at least one venue.
- GET /api/ops/export.csv -> one row per plan with the Master Doc PMF scorecard columns (see EXPORT_COLUMNS in server/concierge.js).
  Contact numbers are not exported; cells starting with = + - @ are prefixed with ' to stop spreadsheet formulas.

Known limits: solo plans never reach the server, so the export cannot compare solo vs together (hypothesis 2) yet.
There is no notification: people see booking updates and the check-in when they open the app.
Tests: src/tests/concierge-api.test.mjs and src/tests/two-phone-concierge.test.mjs.
