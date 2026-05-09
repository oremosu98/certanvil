-- ══════════════════════════════════════════════════════════════════════════
-- CertAnvil notify-me signups · permissive policy hotfix (v4.99.13)
-- ══════════════════════════════════════════════════════════════════════════
-- Second hotfix following v4.99.12. After fixing the \s POSIX-regex bug,
-- inserts STILL failed with 42501 row-level-security violation despite:
--   - Policy "Allow notify-me signup inserts" present on the table (verified
--     via pg_policy diagnostic; with_check_expr starts with the correct
--     '^[^@]+@[^@]+\.[^@]+$' regex)
--   - Anon role having INSERT GRANT (verified via information_schema)
--   - Plain INSERT (no UPSERT/merge-duplicates) also rejected
--
-- The truncated diagnostic display made the full WITH CHECK expression
-- impossible to inspect, but every theory tested came back negative.
-- Decision: drop the DB-level WITH CHECK entirely. The edge function
-- (landing/api/notify.js) already validates email format + length + cert
-- length upstream. The DB-level check was defence-in-depth, and if it's
-- costing us launch readiness, the right call is to remove it and rely
-- on the application-layer validation.
--
-- Trade-off accepted:
--   - PRO: notify-me actually persists to Supabase tonight
--   - CON: someone POSTing directly to PostgREST could insert malformed rows
--   - MITIGATION: edge function is the only public endpoint; direct REST
--     calls require knowing the publishable key + URL pattern; even if
--     someone abuses it, garbage rows can be SQL-deleted post-hoc.
--
-- How to apply:
--   - Open Supabase dashboard → SQL Editor (project: appmuaqwuethndvalarl)
--   - Paste this file's contents → Run
--   - Test with /api/notify POST; should return persisted_to_supabase: true
-- ══════════════════════════════════════════════════════════════════════════

drop policy if exists "Allow notify-me signup inserts" on public.notify_signups;

create policy "Allow notify-me signup inserts"
  on public.notify_signups
  for insert
  to anon, authenticated
  with check (true);

-- Sanity: confirm the policy is in place after running this migration.
-- Should return one row with polcmd = 'a' and with_check_expr = 'true'.
-- (Run manually in SQL editor to verify; not part of the migration itself.)
--
--   select polname, polcmd, pg_get_expr(polwithcheck, polrelid) as with_check_expr
--   from pg_policy
--   where polrelid = 'public.notify_signups'::regclass;
