-- Milo data model v2, step 1 of 2 (additive). Apply AFTER schema.sql, gifts.sql,
-- concierge.sql and solo.sql, BEFORE deploying the v2 code. The old code keeps
-- working: it only gains an unused column and a relaxed NOT NULL.
-- participants.contact is new and starts empty (no backfill, owner choice).
-- bookings.contact stops being required because the v2 code no longer writes it.
BEGIN;
ALTER TABLE participants ADD COLUMN contact text CHECK (char_length(contact) <= 20);
ALTER TABLE bookings ALTER COLUMN contact DROP NOT NULL;
COMMIT;
