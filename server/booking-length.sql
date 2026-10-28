-- Booking length becomes optional: the app no longer asks "How long is the night?" and ops
-- plans the length from the night. Apply AFTER accounts.sql (or after intent-v31.sql if
-- accounts are not applied yet; the two are independent). Removes only the NOT NULL rule.
-- Existing rows keep their 3 or 4; the 3-or-4 check stays for any value that is given.
BEGIN;
ALTER TABLE bookings ALTER COLUMN window_hours DROP NOT NULL;
COMMIT;
