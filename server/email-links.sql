-- Apply after accounts.sql before enabling emailed sign-in links. No data removed.
ALTER TABLE login_codes ADD COLUMN link_hash text;
CREATE UNIQUE INDEX login_codes_link_hash ON login_codes(link_hash) WHERE link_hash IS NOT NULL;
