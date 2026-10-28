-- Milo accounts v1: email code and Google sign-in, sessions, and seats linked to accounts.
-- Apply AFTER schema.sql, gifts.sql, concierge.sql, solo.sql, data-v2a.sql, data-v2b.sql
-- and intent-v31.sql. Adds tables and one nullable column; changes and deletes nothing.
-- Emails are stored so codes can be sent; never log them. Codes and session tokens are
-- stored only as hashes. Retention: nothing is deleted automatically.
BEGIN;
CREATE TABLE accounts (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND char_length(email) BETWEEN 3 AND 254),
  google_sub text UNIQUE CHECK (char_length(google_sub) <= 255),
  name text CHECK (char_length(name) BETWEEN 1 AND 40),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
-- token_hash = sha256(token). The token itself lives only in the HttpOnly cookie.
CREATE TABLE account_sessions (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  renewed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX account_sessions_account ON account_sessions(account_id);
-- code_hash = HMAC(AUTH_SECRET, email + ':' + code). Ten minutes, one use, five tries.
CREATE TABLE login_codes (
  id uuid PRIMARY KEY,
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  code_hash text NOT NULL,
  attempts smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE INDEX login_codes_email ON login_codes(email, created_at);
-- Kept apart from rate_limits so that table's scope check is not changed.
CREATE TABLE account_rate_limits (
  scope text NOT NULL CHECK (scope IN ('code_send','code_verify','google')),
  ip_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits > 0),
  PRIMARY KEY(scope, ip_hash, window_start)
);
-- A seat belongs to at most one account once claimed. Null: not signed in (yet).
ALTER TABLE participants ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
CREATE INDEX participants_account ON participants(account_id) WHERE account_id IS NOT NULL;
COMMIT;
