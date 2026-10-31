-- ══════════════════════════════════════════════════════════════════════════
-- Cert requests table (2026-10-31)
-- ══════════════════════════════════════════════════════════════════════════
-- Backs "Suggest a cert": a signed-in user says which exam they want next.
-- One row per (user, exam). The client inserts {user_id, exam_key, label,
-- typed} with the user's JWT and uses insert-ignore-duplicates, so a repeat
-- submit is a silent no-op (the owner INSERT policy is all that needs; ON
-- CONFLICT DO NOTHING does not need UPDATE).
--
-- Privacy: counts are private. Owners can read only their own rows. Only
-- admins read everyone's rows, and the tally view runs as the caller
-- (security_invoker), so RLS decides who sees it.
--
-- Writes: owners can insert and read their own rows. Owners have NO update
-- and NO delete (a request is a vote; account deletion removes it through the
-- ON DELETE CASCADE). Admins may update notified_at only, enforced with a
-- COLUMN-LEVEL privilege (update is revoked on the table, then granted on
-- notified_at alone), so even a permissive policy cannot rewrite other
-- columns. The Monday digest cron and "Tell them it's live" endpoint may use
-- the service role, which bypasses RLS and grants.
--
-- Apply: Supabase Dashboard → SQL Editor. Run once (safe to re-run).
-- ══════════════════════════════════════════════════════════════════════════

do $guard$
begin
  if not exists (select 1 from pg_proc where proname = 'is_admin') then
    raise exception 'is_admin() not found — apply Phase C′ migration first.';
  end if;
end$guard$;

CREATE TABLE IF NOT EXISTS cert_requests (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exam_key    text        NOT NULL CHECK (length(exam_key) BETWEEN 1 AND 80),
  label       text        NOT NULL CHECK (length(label) BETWEEN 1 AND 120),
  typed       boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  UNIQUE (user_id, exam_key)
);

-- exam_key must already be normalised (lowercase, trimmed): Task 14's client
-- normaliser produces such keys. Guarded so a re-paste does not fail.
DO $chk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'cert_requests'::regclass AND conname = 'cert_requests_exam_key_normalised'
  ) THEN
    ALTER TABLE cert_requests
      ADD CONSTRAINT cert_requests_exam_key_normalised CHECK (exam_key = lower(btrim(exam_key)));
  END IF;
END$chk$;

ALTER TABLE cert_requests ENABLE ROW LEVEL SECURITY;

-- Insert is column-scoped too: owners cannot set id, created_at or notified_at.
-- Column-level lock: nobody but the service role can change anything except
-- notified_at, and only admins pass the policy below.
REVOKE ALL ON cert_requests FROM anon, authenticated;
GRANT SELECT ON cert_requests TO authenticated;
GRANT INSERT (user_id, exam_key, label, typed) ON cert_requests TO authenticated;
GRANT UPDATE (notified_at) ON cert_requests TO authenticated;

DO $policy_insert$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cert_requests' AND policyname = 'cert_requests_insert_own'
  ) THEN
    EXECUTE 'CREATE POLICY cert_requests_insert_own ON cert_requests
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END$policy_insert$;

DO $policy_select_own$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cert_requests' AND policyname = 'cert_requests_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY cert_requests_select_own ON cert_requests
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id)';
  END IF;
END$policy_select_own$;

DO $policy_select_admin$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cert_requests' AND policyname = 'cert_requests_admin_select'
  ) THEN
    EXECUTE 'CREATE POLICY cert_requests_admin_select ON cert_requests
      FOR SELECT TO authenticated
      USING (is_admin())';
  END IF;
END$policy_select_admin$;

DO $policy_update_admin$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cert_requests' AND policyname = 'cert_requests_admin_update_notified'
  ) THEN
    EXECUTE 'CREATE POLICY cert_requests_admin_update_notified ON cert_requests
      FOR UPDATE TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin())';
  END IF;
END$policy_update_admin$;

-- Tally for the admin page and the Monday digest. security_invoker makes the
-- view obey the caller's RLS: a non-admin sees only their own rows (so only
-- their own one-vote tally), an admin sees everything.
-- label = most common label per exam_key; typed = any row was typed.
CREATE OR REPLACE VIEW cert_request_tally
WITH (security_invoker = true) AS
SELECT
  exam_key,
  mode() WITHIN GROUP (ORDER BY label)                                AS label,
  count(*)                                                            AS votes,
  count(*) FILTER (WHERE created_at >= now() - interval '7 days')     AS new_7d,
  max(created_at)                                                     AS last_at,
  bool_or(typed)                                                      AS typed
FROM cert_requests
GROUP BY exam_key
ORDER BY votes DESC, last_at DESC;

REVOKE ALL ON cert_request_tally FROM anon;
GRANT SELECT ON cert_request_tally TO authenticated;

-- ROLLBACK: DROP VIEW IF EXISTS cert_request_tally; DROP TABLE IF EXISTS cert_requests;
