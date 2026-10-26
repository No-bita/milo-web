-- Milo Phase 1 v2. Apply once to an EMPTY owner-created Neon database.
-- No public endpoints in this change. API must ship with per-IP limits and
-- safe errors. Never expose this database or its credentials to the browser.
BEGIN;
CREATE TABLE plans (
  id uuid PRIMARY KEY,
  invite_token text NOT NULL UNIQUE,
  occasion text CHECK (occasion IN ('date_night','anniversary','proposal','birthday','quality_time','just_because')),
  city text NOT NULL DEFAULT 'bengaluru',
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','both_done','suggested','confirmed')),
  shared_result jsonb,
  suggestion jsonb,
  confirmed_night_id text,
  timing jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours')
);
CREATE INDEX plans_cleanup ON plans(created_at);
CREATE TABLE participants (
  id uuid PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('initiator','partner')),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  seat_key_hash text NOT NULL UNIQUE,
  intents jsonb NOT NULL DEFAULT '[]',
  reactions jsonb NOT NULL DEFAULT '[]',
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, role)
);
-- Only HMAC(IP) is persisted, never a raw IP. Server-only RATE_LIMIT_SECRET.
-- Normalize before HMAC: IPv4-mapped IPv6 -> IPv4; native IPv6 -> /64.
-- Resolve IP only through the host's trusted-proxy configuration, never an
-- untrusted X-Forwarded-For value. Reject missing/malformed ingress addresses.
-- Canonicalize equivalent spellings consistently before computing ip_hash.
-- Fixed one-minute bucket: create 20, preview 60, join 20 per IP/minute.
-- An atomic upsert gates each public request BEFORE looking up a token.
CREATE TABLE rate_limits (
  scope text NOT NULL CHECK (scope IN ('create','preview','join')),
  ip_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits > 0),
  PRIMARY KEY(scope, ip_hash, window_start)
);
COMMIT;
-- Safe response contract: invalid input 400 {error:'invalid_request'}, missing
-- seat 401 {error:'unauthorized'}, wrong plan/unknown token 404 {error:'not_found'},
-- rate limited 429 {error:'rate_limited'} + Retry-After, unavailable 503
-- {error:'unavailable'}. No stacks, DB errors, tokens or private picks in logs.
-- Invite preview returns only status/name/occasion/day (when set), never keys.
-- Retention: nothing is deleted; /api/cleanup is an authenticated no-op. ON DELETE
-- CASCADE remains for a manual plan deletion. Old rate-limit rows are NOT
-- pruned in v2. That growth/compute cost is explicitly parked, not fixed here.
-- Parked v2 choices: changing phone creates a NEW plan (loses picks); shared
-- display result is computed ONCE; polling stays 5s->30s, stops after 10 min.
-- Launch gates: approved host terms, owner-created Neon, server secrets,
-- approved frontend/mockups and two-phone checks. Code alone is not launch.
