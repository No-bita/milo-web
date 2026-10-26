-- Milo solo plans + partner share link. Apply AFTER schema.sql, gifts.sql and
-- concierge.sql. A solo plan is a one-seat plan created at booking time; it can
-- never be joined through an invite. Requests marked as a surprise are never
-- shown on the share link. Nothing is deleted automatically (ON DELETE CASCADE remains for manual plan deletion).
BEGIN;
ALTER TABLE plans ADD COLUMN mode text NOT NULL DEFAULT 'together' CHECK (mode IN ('together','solo'));
ALTER TABLE plans ADD COLUMN share_token text UNIQUE;
-- Solo only: the stops as the planner customised them, and the night's rank (1-3) in their list.
ALTER TABLE plans ADD COLUMN stops jsonb;
ALTER TABLE plans ADD COLUMN solo_rank smallint CHECK (solo_rank BETWEEN 1 AND 3);
ALTER TABLE bookings ADD COLUMN requests text CHECK (char_length(requests) <= 1000);
ALTER TABLE bookings ADD COLUMN surprise boolean NOT NULL DEFAULT true;
COMMIT;
