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
reconstructs it. Retention: nothing is deleted. GET /api/cleanup is kept as an
authenticated no-op (CRON_SECRET bearer, returns {deleted:0}, works while
MILO_PHASE1_ENABLED is off) so an external scheduler, if one exists, keeps
getting 200. No schedule is configured in this repo. Stored plans, bookings,
check-ins, events and gifts are kept indefinitely.
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
   accumulated counters need monitoring before scale. Nothing is deleted
   automatically, so stored data and the rate-limit table only grow.
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
AFTER `server/schema.sql`. Gifts are kept: removing a gift marks it
'cancelled' (hidden from both seats, kept in the ops list), so delivery
addresses and contact numbers are retained. Database-level ON DELETE CASCADE
remains, so a manual plan deletion would still remove them.
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

## Intent model v3.1 (phases A to D)

**One switch:** the app build flag `VITE_MILO_INTENT_MODEL=v3.1`. With it on, every plan
started from a Home occasion tile takes the v3.1 quiz (`session.quizVersion = 'v3.1'`): the
model's 8 moods, "Tonight is mostly about…" (`s1b`: up to 2 activity tiles + the 3 pairs) and
the model's adaptive 8-card deck. The creator's model is sent when the plan is created
(`intent_model`, stored on `plans`), the partner's invite preview carries it, so both people
always answer the same quiz. The server computes the shared result with the plan's own model
(`sharedFor` in `server/phase1.js`); the old `MILO_INTENT_MODEL` server env var is no longer
read. Plans created before the switch stay `v3` and finish on today's logic.

- `PUT /me` on a v3.1 plan: `intents` are model mood ids, `reactions` use model card ids,
  plus `v31: { modes: [<=2], pairs: { P6, P3, P2 } }`; finishing needs 8 reactions and all
  three pairs. A v3 plan keeps today's ids and refuses `v31`.
- Solo: `POST /api/plans/solo` takes `intent_model` and `v31` the same way.
- Booking (solo and Together) takes optional `constraints: { diet: [ids], alcohol, home_by }`
  (ids in `src/data/constraints.js`). `/api/ops/bookings` adds `constraints` and `brief`
  (plain-words lines from the model for v3.1 plans, plus the limits). The CSV adds `intent_model`.
- Migration: apply `server/intent-v31.sql` after `data-v2b.sql` and before deploying this code
  (adds columns only). Mapping of screens to model answers: `src/logic/intent-quiz.js`.

Python reference and parity data: `docs/intent-model/`.

## Concierge and PMF (V1)

Apply `server/concierge.sql` AFTER `schema.sql` and `gifts.sql`. It is required once this
code ships: suggest/confirm now record a PMF event, so without the table those actions fail.
Nothing is deleted automatically: contacts, notes, check-ins and events are kept. Database-level ON DELETE CASCADE remains for any manual plan deletion.

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

Solo plans reach the server too (see below), so the export can compare solo vs together via `mode`.
There is no notification: people see booking updates and the check-in when they open the app.
Tests: src/tests/concierge-api.test.mjs and src/tests/two-phone-concierge.test.mjs.

## Solo plans and share link (V1)

Apply `server/solo.sql` AFTER `schema.sql`, `gifts.sql` and `concierge.sql` (required once this ships: the
invite and export queries read the new `mode` column).

- POST /api/plans/solo (public, per-IP `create` limit) {name, occasion?, night_id, night_rank?, timing, stops?, intents, reactions,
  booking:{budget_band, window_hours, contact, requests? (<=1000), surprise (default true)}} -> 201 {plan_id, seat_key, share_url}.
  Creates a confirmed one-seat plan (mode `solo`) and its booking request in one transaction. Its invite token is never accepted.
- The solo seat then uses the normal seat routes: GET/POST/DELETE /booking (requester view now includes `requests` and `surprise`)
  and POST /checkin. The app keeps the solo seat in `milo_solo_seat_v1`, separate from the Together seat.
- GET /api/shared/:token (public, per-IP `preview` limit) -> {from, night, stops, timing, status planned|booking|booked, venues, requests}.
  `requests` is null when the planner kept them a surprise. Never returns contact, budget, notes, picks or check-ins.
- Ops: booking rows carry `mode`, `requests`, `surprise`; solo plans show SOLO and the surprise flag. The CSV gains
  `mode`, `requests_given` and `surprise`; for solo plans `confirmed_rank` is the night's position (1-3) in the planner's list.

## Data model v2 (retention, contacts, requests, city)

Apply `server/data-v2a.sql` AFTER `solo.sql` and BEFORE deploying the v2 code (additive only, the old code keeps working). Apply `server/data-v2b.sql` AFTER the v2 code is deployed (drops the old columns). Together they keep every row except the dropped contact numbers.
- **Retention: no plan data is deleted.** `GET /api/cleanup` stays an authenticated no-op that returns `{deleted:0}`
  before any database connection. Phone numbers, delivery addresses, names and free text are kept indefinitely.
  Rate-limit rows are not pruned.
- **One phone number per person:** `participants.contact` (starts empty). `bookings.contact` and `gifts.contact`
  were dropped without copying, so earlier numbers are gone. Ops reads the person's number.
- **One free-text field:** `bookings.notes` was merged into `bookings.requests` (<=1000) and dropped. The Together
  booking sheet now sends `requests`.
- **City is recorded, not defaulted:** POST /api/plans and /api/plans/solo require `city` from `src/data/cities.js`
  (Bengaluru only; a CHECK enforces the list). The app sends it explicitly; there is no place picker yet.
- **CSV:** adds `city`, `minutes_to_agree` (plan created -> night confirmed, Together only) and
  `nights_browsed_initiator/partner` (distinct nights moved to with "See the other two").

## Booking limits

Solo and Together booking take optional `constraints: { diet: [ids], alcohol, home_by }` (ids in
`src/data/constraints.js`; only listed food choices are accepted). `/api/ops/bookings` adds
`constraints` and `brief` (plain-words lines for whoever books the night). The booking forms show
the limits only when the app is built with `VITE_MILO_INTENT_MODEL=v3.1`. Migration: apply
`server/intent-v31.sql` (adds columns only) before deploying this code.
