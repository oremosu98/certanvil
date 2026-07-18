-- ══════════════════════════════════════════════════════════════════════════
-- Client error reporting table (2026-07-18)
-- ══════════════════════════════════════════════════════════════════════════
-- Captures uncaught JS errors + unhandled promise rejections from users'
-- browsers. logError() in app.js fires a fire-and-forget Supabase insert
-- for every new fingerprint (client-side dedup via nplus_sb_reported).
--
-- Design:
--   • INSERT open to all roles (anon + authenticated) — BYOK users who
--     haven't created an account should still report errors.
--   • SELECT locked to admin only (is_admin() from Phase C′).
--   • No UPDATE / DELETE for any client — append-only.
--   • Columns are all hard-capped (text + CHECK constraints) to prevent
--     accidental oversized payloads.
--   • Idempotent (IF NOT EXISTS, CREATE POLICY ... IF NOT EXISTS).
--
-- Apply: Supabase Dashboard → SQL Editor. Run once.
-- ══════════════════════════════════════════════════════════════════════════

-- ── Prereq guard ────────────────────────────────────────────────────────────
do $guard$
begin
  if not exists (select 1 from pg_proc where proname = 'is_admin') then
    raise exception 'is_admin() not found — apply Phase C′ migration first.';
  end if;
end$guard$;

-- ── Table ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_errors (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  fingerprint text        NOT NULL CHECK (char_length(fingerprint) <= 300),
  type        text        NOT NULL CHECK (char_length(type) <= 50),
  message     text        NOT NULL CHECK (char_length(message) <= 500),
  page        text                 CHECK (char_length(page) <= 100),
  version     text                 CHECK (char_length(version) <= 20),
  user_agent  text                 CHECK (char_length(user_agent) <= 200),
  user_id     uuid,                -- auth.uid() at insert time; null = anon
  extra       jsonb
);

-- Index for fast fingerprint lookup (admin queries "how many users hit X?")
CREATE INDEX IF NOT EXISTS client_errors_fingerprint_idx
  ON client_errors (fingerprint);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;

-- INSERT: any role (anon + authenticated). No auth check — errors from
-- unauthenticated BYOK users are equally valuable.
DO $policy_insert$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_errors' AND policyname = 'client_errors_insert'
  ) THEN
    EXECUTE 'CREATE POLICY client_errors_insert ON client_errors
      FOR INSERT TO anon, authenticated
      WITH CHECK (true)';
  END IF;
END$policy_insert$;

-- SELECT: admin only.
DO $policy_select$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_errors' AND policyname = 'client_errors_admin_select'
  ) THEN
    EXECUTE 'CREATE POLICY client_errors_admin_select ON client_errors
      FOR SELECT TO authenticated
      USING (is_admin())';
  END IF;
END$policy_select$;

-- ROLLBACK: DROP TABLE IF EXISTS client_errors;
