-- Milo concierge + PMF measurement V1. Apply AFTER server/schema.sql and
-- server/gifts.sql. Everything cascades with its plan, so the daily cleanup
-- removes contacts, notes, check-ins and events after 30 days.
-- Seats never read another seat's check-in, contact, notes or events; those are
-- for the owner's ops page and CSV export only.
BEGIN;
CREATE TABLE bookings (
  id uuid PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  budget_band text NOT NULL CHECK (budget_band IN ('under_2k','2k_4k','4k_7k','7k_plus')),
  window_hours smallint NOT NULL CHECK (window_hours IN (3,4)),
  contact text NOT NULL CHECK (char_length(contact) <= 20),
  notes text CHECK (char_length(notes) <= 300),
  status text NOT NULL CHECK (status IN ('requested','booked','failed','cancelled')),
  -- Set by ops once booked: [{stop_index, venue, area?, time?}]. Shown to both seats.
  venues jsonb NOT NULL DEFAULT '[]',
  ops_minutes integer CHECK (ops_minutes BETWEEN 0 AND 1440),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Once per plan: at most one booking that is not cancelled.
CREATE UNIQUE INDEX bookings_one_active ON bookings(plan_id) WHERE status <> 'cancelled';
CREATE TABLE checkins (
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, participant_id)
);
-- Browsing and decision signals for the PMF row. No page URLs, no device data.
CREATE TABLE plan_events (
  id bigserial PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('see_other','suggest','confirm')),
  night_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plan_events_plan ON plan_events(plan_id);
COMMIT;
