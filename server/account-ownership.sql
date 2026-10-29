-- Apply after accounts.sql before enabling accounts. Fails safely if historical duplicates exist.
-- One account cannot own both participants of the same plan, even with concurrent requests.
CREATE UNIQUE INDEX participants_plan_account_unique ON participants(plan_id, account_id) WHERE account_id IS NOT NULL;
