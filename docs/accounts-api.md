# Accounts API (contract for the You tab and Nights > Past)

Status: **built (accounts v1).** Server: `server/accounts.js`, migration `server/accounts.sql`.
Client: `src/domain/account-api.js`, `src/domain/auth.js`, `src/screens/login-accounts.js`.

## Switches and setup (in this order)

1. **Neon:** apply `server/accounts.sql` (after `intent-v31.sql`). Adds tables and one nullable
   column `participants.account_id`; changes and deletes nothing.
2. **Google:** Google Cloud console > APIs & Services > Credentials > OAuth client ID, type
   *Web application*, authorised JavaScript origin `https://www.aaryanshah.co.in`. The client
   id is public.
3. **Resend:** add and verify the domain `aaryanshah.co.in` (DNS records), create an API key.
4. **Vercel environment variables:**
   - `MILO_ACCOUNTS_ENABLED=true` (server switch)
   - `AUTH_SECRET` (server secret, 32+ random characters; hashes sign-in codes)
   - `RESEND_API_KEY` (server secret)
   - `MILO_AUTH_FROM` (optional, default `Milo <hello@aaryanshah.co.in>`)
   - `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (app), the same public id
   - `VITE_MILO_ACCOUNTS=true` (app switch, public)
5. Redeploy. With either switch off, everything behaves as before accounts.

Without `VITE_GOOGLE_CLIENT_ID` the Google button is hidden and email codes still work.

## Sign-in routes

All writes need `Origin` equal to `MILO_PUBLIC_ORIGIN` and a JSON body. Errors use the usual
safe codes; nothing is logged.

- `POST /api/auth/email/start {email}` → `{sent:true}` for any valid email, so nobody can probe
  which emails have accounts. 6-digit code, 10 minutes, one use, 5 tries. At most 3 codes per
  email per 10 minutes; 20 sends per IP per minute (high, because carriers share IPs).
- `POST /api/auth/email/verify {email, code}` → `{account}` and the session cookie, or
  `400 invalid_code`.
- `POST /api/auth/google {credential}` → `{account}` and the cookie. The ID token's RS256
  signature is checked against Google's published keys, plus issuer, audience
  (`GOOGLE_CLIENT_ID`), expiry and a verified email. The same email is the same account
  whichever way someone signs in; a second Google identity for the same email gets
  `409 account_conflict`.
- `POST /api/auth/logout` → revokes the session and clears the cookie.

**Session cookie:** `milo_session`, HttpOnly, Secure, SameSite=Lax, Path=/api, 90 days,
renewed (at most once a day) when used. Stored only as a SHA-256 hash.

## Account routes (signed in, else `401`)

- `GET /api/me` → `{account:{id, email, name}}`. `PATCH /api/me {name}` sets the name.
- `POST /api/me/claim {seats:[{plan_id, seat_key}]}` (up to 5) → `{claimed, account}`. Links
  this phone's seats to the account; the seat key proves the seat is yours. A seat someone
  else holds, a wrong key, or the other seat of a plan you already hold is skipped. If the
  account has no name, it takes the name from your latest plan ("name typed in Milo").
- The app claims after every sign-in and on each open while signed in.

## Booking needs an account

With `MILO_ACCOUNTS_ENABLED=true`, `POST /api/plans/:id/booking` and `POST /api/plans/solo`
need the session cookie (`401 sign_in_required` otherwise); the seat is linked to that
account, and a seat linked to someone else's account gets `403`. The app sends people to
sign in first and back to where they were. Planning stays open: the old local sign-in gates
after the reveal and before the solo hand-off are skipped while accounts are on.

## Client

`VITE_MILO_ACCOUNTS=true` (public, non-secret build flag). Off: no calls are made, the login
screen is the old local-only form, You shows the placeholder and Nights > Past stays empty.
The client sends `credentials: 'same-origin'` (cookies) and no other credentials. `401` means
signed out: the client clears its copy and shows the placeholder. Any other error or no
network keeps the last good copy.

## `GET /api/me/people`

The people the signed-in account has planned with, **most recent first**. The You tab shows
`people[0]`.

```json
{ "people": [
  { "id": "p_8f2k", "display_name": "Ravi", "since": "2026-10-03",
    "nights": { "booked": 3, "planned": 1 } }
] }
```

- `id`: stable per person (their account), 1 to 64 of `A-Z a-z 0-9 _ -`.
- `display_name`: the name they gave, up to 40 characters.
- `since`: `YYYY-MM-DD`, the start of the first plan you made together. Optional.
- `nights.booked`: Together plans with a booking that is requested or booked (failed and
  cancelled don't count).
- `nights.planned`: Together plans where both finished their picks, with no live booking.
- A person appears only once they have joined a plan with you **and** both seats are linked
  to accounts. A partner who never signs in is not listed.
- `since` is the first plan's date in India time (Milo serves Bengaluru only).

## `GET /api/me/nights`

Your dated nights, solo and Together. The client shows those whose `date` is before today
(local time) under Nights > Past, newest first.

```json
{ "nights": [
  { "plan_id": "c1a7…", "mode": "together", "night_id": "slow-one",
    "date": "2026-10-11", "time": "19:30", "person_id": "p_8f2k", "status": "booked" }
] }
```

- `mode`: `solo` or `together`. `person_id`: the person for Together nights, else `null`.
- `status`: `booked` or `planned`, as defined above. Together plans need an agreed night and
  a date; a solo plan whose booking was cancelled counts as planned if its picks were finished.
- `date` `YYYY-MM-DD`, `time` `HH:MM`, in the plan's own time zone.

## Rules the client relies on

- Rows that don't match the shapes above are dropped, not shown half-filled.
- At most 20 people and 100 nights are read.
- Never return seat keys, contacts, picks, reactions or booking details here.
- Rename on the You tab is a nickname kept on the phone (`sessionA.personNames[id]`); the
  server name is never changed by it.
