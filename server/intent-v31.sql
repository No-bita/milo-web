-- Intent model v3.1 (apply after data-v2b.sql, before deploying the v3.1 code).
-- Adds columns only; nothing is deleted or rewritten. Existing plans stay 'v3'.
BEGIN;
-- Which model a plan's quiz and result use, fixed when the plan is created.
ALTER TABLE plans ADD COLUMN intent_model text NOT NULL DEFAULT 'v3' CHECK (intent_model IN ('v3', 'v3.1'));
-- A person's v3.1 extras: { modes: [...], pairs: { P6, P3, P2 } } (moods and swipes stay in intents/reactions).
ALTER TABLE participants ADD COLUMN v31 jsonb;
-- Hard limits given at the booking step: { diet: [...], alcohol: bool, home_by: 'HH:MM' }.
ALTER TABLE bookings ADD COLUMN constraints jsonb;
COMMIT;
