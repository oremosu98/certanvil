-- ══════════════════════════════════════════════════════════════════════════
-- CertAnvil notify-me signups · RLS regex hotfix (v4.99.12)
-- ══════════════════════════════════════════════════════════════════════════
-- Hotfix for v4.99.10's notify_signups RLS policy. Original policy used
-- the regex '^[^@\s]+@[^@\s]+\.[^@\s]+$' which works in Perl/JavaScript
-- but NOT in Postgres POSIX regex. POSIX doesn't recognise \s as an escape
-- so it gets interpreted as the literal character 's' inside the negated
-- character class. Result: any email containing the letter 's' (which is
-- most of them) gets silently rejected with "row violates row-level security
-- policy for table notify_signups."
--
-- Symptom that surfaced this: end-of-day smoke test on v4.99.10 shipped,
-- POSTed a signup to /api/notify, response came back with
-- `persisted_to_supabase: false` despite the table existing + RLS being
-- correctly configured. Direct REST call surfaced the 42501 error.
--
-- Fix: drop the policy + recreate with a simpler regex that matches @-shape
-- without the \s component. Edge function already validates upstream so the
-- DB-level check is defence-in-depth, not the only validation layer.
--
-- How to apply:
--   - Open Supabase dashboard → SQL Editor (project: appmuaqwuethndvalarl)
--   - Paste this file's contents → Run
--   - Verify with a test signup via /api/notify; response should now show
--     "persisted_to_supabase": true
-- ══════════════════════════════════════════════════════════════════════════

drop policy if exists "Allow notify-me signup inserts" on public.notify_signups;

create policy "Allow notify-me signup inserts"
  on public.notify_signups
  for insert
  to anon, authenticated
  with check (
    email ~ '^[^@]+@[^@]+\.[^@]+$'
    and length(email) <= 254
    and length(cert) > 0
    and length(cert) <= 100
    and length(source) <= 100
  );
