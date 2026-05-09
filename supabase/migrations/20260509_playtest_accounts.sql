-- ══════════════════════════════════════════════════════════════════════════
-- CertAnvil playtest accounts · v4.99.17
-- ══════════════════════════════════════════════════════════════════════════
-- Adds the is_playtest flag to profiles for analytics isolation. Manual
-- account creation happens via the Supabase Dashboard (Authentication → Users
-- → "Add user" 5×). After accounts exist, run the seed block at the bottom
-- of this file to flip is_playtest=true + grant Pro entitlements.
--
-- Why is_playtest matters: lets you run "select email from profiles where
-- is_playtest = true" to find the testers, AND lets future revenue / cohort
-- dashboards filter testers OUT so they don't pollute real signal.
--
-- Architecture decisions (locked during the playtest-auth-concept.html review):
--   - Email domain: tester{1..5}@certanvil-playtest.com (fake; emails never sent)
--   - Password: Playtest2026! (same for all 5 — share in 1 message)
--   - Auth surface: ?auth=password URL param + localStorage persistence after
--     first successful login (no public UI surface)
--   - Pro tier: subscriptions row, current_period_end = '9999-12-31' (effectively
--     unlimited via the existing is_pro() RPC; NOT admin role — admin is reserved
--     for the founder)
--
-- How to apply (two stages):
--   STAGE 1 — Schema only (run this file's first block immediately):
--     Open Supabase dashboard → SQL Editor (project: appmuaqwuethndvalarl) →
--     paste THIS file's contents (everything above the SEED block) → Run.
--
--   STAGE 2 — Seed accounts (manual, after creating users in dashboard):
--     2a. Authentication → Users → "Add user" 5 times. For each:
--         - Email: tester1@certanvil-playtest.com (incrementing the number)
--         - Password: Playtest2026!
--         - Auto Confirm User: TRUE (skips email confirmation; emails are fake)
--     2b. Run the SEED block at the bottom of this file in SQL Editor.
--     2c. Verify with the VERIFY query (also at bottom).
-- ══════════════════════════════════════════════════════════════════════════

-- Schema change: is_playtest flag for analytics + cohort isolation
alter table public.profiles
  add column if not exists is_playtest boolean default false;

comment on column public.profiles.is_playtest is
  'Marks accounts created for playtest sessions. Use to filter testers out of revenue / cohort dashboards. Set in the seed block of 20260509_playtest_accounts.sql.';

-- Index for the "list playtesters" query you'll run periodically
create index if not exists idx_profiles_is_playtest
  on public.profiles (is_playtest)
  where is_playtest = true;

-- ══════════════════════════════════════════════════════════════════════════
-- SEED BLOCK — run AFTER manually creating the 5 users in the dashboard
-- ══════════════════════════════════════════════════════════════════════════
-- Uncomment the block below and run it in the SQL Editor once the 5 users
-- exist. It's idempotent — safe to re-run.

/*

-- 1. Mark the 5 testers as playtest accounts (analytics isolation)
update public.profiles
set is_playtest = true
where email like '%@certanvil-playtest.com';

-- 2. Grant each Pro tier with effectively-unlimited duration
--    (current_period_end = 9999-12-31 means is_pro() returns true forever)
insert into public.subscriptions (user_id, tier, status, current_period_end, created_at)
select id, 'pro', 'active', '9999-12-31'::timestamptz, now()
from auth.users
where email like '%@certanvil-playtest.com'
on conflict (user_id) do update set
  tier = 'pro',
  status = 'active',
  current_period_end = '9999-12-31'::timestamptz;

-- 3. VERIFY — run this query last to confirm everything's wired
select
  p.email,
  p.is_playtest,
  u.email_confirmed_at is not null as email_confirmed,
  s.tier,
  s.status,
  s.current_period_end,
  is_pro(p.id) as is_pro_check
from public.profiles p
join auth.users u on u.id = p.id
left join public.subscriptions s on s.user_id = p.id
where p.is_playtest = true
order by p.email;

*/

-- ══════════════════════════════════════════════════════════════════════════
-- CLEANUP (when the playtest ends — DO NOT RUN UNTIL THEN)
-- ══════════════════════════════════════════════════════════════════════════
-- One SQL deletes everything. Cascades to profiles + subscriptions automatically.
--
--   delete from auth.users where email like '%@certanvil-playtest.com';
--
-- The is_playtest column itself can stay (zero cost; useful if you run another
-- playtest cycle later).
