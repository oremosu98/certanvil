-- ══════════════════════════════════════════════════════════════════════════
-- User bug reports table (2026-07-18)
-- ══════════════════════════════════════════════════════════════════════════
-- Backs the topbar "Report an issue" drawer (features/reports.js). Prior
-- design routed submitReport() straight to the GitHub Issues REST API using
-- a personal access token read from localStorage — a token no real user's
-- browser ever had (the only UI that could ever set it was a founder-only
-- monitor panel, since removed). The feature was non-functional for every
-- real user; this table + the app.js/reports.js changes alongside this
-- migration make it work for the first time, without ever putting a
-- repo-write-scoped secret in a browser.
--
-- Design: same shape as client_errors (20260718_client_errors.sql) — open
-- INSERT for anon + authenticated, admin-only SELECT, append-only.
-- report_id is the client-generated id (e.g. "rpt_2026-07-18T...-a1b2");
-- UNIQUE + upsert-on-conflict makes retries from the offline queue
-- idempotent instead of creating duplicate rows.
--
-- Apply: Supabase Dashboard → SQL Editor. Run once.
-- ══════════════════════════════════════════════════════════════════════════

do $guard$
begin
  if not exists (select 1 from pg_proc where proname = 'is_admin') then
    raise exception 'is_admin() not found — apply Phase C′ migration first.';
  end if;
end$guard$;

CREATE TABLE IF NOT EXISTS user_bug_reports (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at   timestamptz NOT NULL DEFAULT now(),
  report_id    text        NOT NULL UNIQUE CHECK (char_length(report_id) <= 80),
  title        text        NOT NULL CHECK (char_length(title) <= 200),
  description  text                 CHECK (char_length(description) <= 5000),
  steps        text                 CHECK (char_length(steps) <= 5000),
  body         text                 CHECK (char_length(body) <= 8000),
  context      jsonb,
  user_id      uuid,
  status       text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triaged', 'closed'))
);

CREATE INDEX IF NOT EXISTS user_bug_reports_status_idx
  ON user_bug_reports (status);

ALTER TABLE user_bug_reports ENABLE ROW LEVEL SECURITY;

DO $policy_insert$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_bug_reports' AND policyname = 'user_bug_reports_insert'
  ) THEN
    EXECUTE 'CREATE POLICY user_bug_reports_insert ON user_bug_reports
      FOR INSERT TO anon, authenticated
      WITH CHECK (true)';
  END IF;
END$policy_insert$;

-- Upsert-on-retry needs UPDATE too (same report_id, same submitter) — scope
-- it to rows still 'open' so a triaged/closed report can't be reopened by
-- a stale client-side queue retry.
DO $policy_update$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_bug_reports' AND policyname = 'user_bug_reports_update_own_open'
  ) THEN
    EXECUTE 'CREATE POLICY user_bug_reports_update_own_open ON user_bug_reports
      FOR UPDATE TO anon, authenticated
      USING (status = ''open'')
      WITH CHECK (status = ''open'')';
  END IF;
END$policy_update$;

DO $policy_select$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_bug_reports' AND policyname = 'user_bug_reports_admin_select'
  ) THEN
    EXECUTE 'CREATE POLICY user_bug_reports_admin_select ON user_bug_reports
      FOR SELECT TO authenticated
      USING (is_admin())';
  END IF;
END$policy_select$;

-- ROLLBACK: DROP TABLE IF EXISTS user_bug_reports;
