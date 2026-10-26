-- Milo gifting V1. Apply AFTER server/schema.sql (it references plans and
-- participants). Gifts cascade-delete with their plan, so the daily cleanup
-- removes them (and any delivery address) with the plan after 30 days.
-- Gift details are returned only to the giver and to the owner's ops list;
-- see docs/phase1-server.md "Gifting" for the reveal rules.
BEGIN;
CREATE TABLE gifts (
  id uuid PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  giver_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('moment_drop','home_delivery','sealed_note','teaser','memory')),
  item_id text,
  stop_index smallint CHECK (stop_index BETWEEN 0 AND 2),
  venue text CHECK (char_length(venue) <= 120),
  address text CHECK (char_length(address) <= 300),
  deliver_window text CHECK (deliver_window IN ('morning','afternoon','evening')),
  note text CHECK (char_length(note) <= 500),
  -- Giver's WhatsApp number, physical gifts only. Ops list only; never sent to either seat.
  contact text CHECK (char_length(contact) <= 20),
  show_hint boolean NOT NULL DEFAULT false,
  status text NOT NULL CHECK (status IN ('sent','requested','confirmed','dispatched','delivered','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gifts_plan ON gifts(plan_id);
COMMIT;
