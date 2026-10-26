-- Milo data model v2, step 2 of 2 (finish). Apply AFTER data-v2a.sql AND after the
-- v2 code is deployed. Old contact numbers are NOT copied (owner choice, no
-- backfill): dropping bookings.contact and gifts.contact permanently loses them.
-- notes is merged into requests (cut at 1000 characters, owner choice), then dropped.
-- plans.city loses its default and is limited to served cities.
-- Retention: no plan data is deleted; nothing in this file deletes rows.
BEGIN;
ALTER TABLE bookings DROP COLUMN contact;
ALTER TABLE gifts DROP COLUMN contact;

UPDATE bookings SET requests = CASE
    WHEN requests IS NULL OR requests = '' THEN notes
    ELSE left(notes || E'\n' || requests, 1000) END
  WHERE notes IS NOT NULL AND notes <> '';
ALTER TABLE bookings DROP COLUMN notes;

ALTER TABLE plans ALTER COLUMN city DROP DEFAULT;
ALTER TABLE plans ADD CONSTRAINT plans_city_served CHECK (city IN ('bengaluru'));
COMMIT;
