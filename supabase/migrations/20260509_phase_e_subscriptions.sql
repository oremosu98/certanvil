-- ══════════════════════════════════════════════════════════════════════════
-- Phase E + Phase 4 foundation migration
-- Date: 2026-05-09
-- ══════════════════════════════════════════════════════════════════════════
-- Run this once in Supabase Dashboard → SQL Editor → New Query.
-- Idempotent: safe to re-run (uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS guards).
--
-- What this adds:
--   1. subscriptions table  — per-user tier state (default 'free' for everyone).
--      Stripe webhook handler upserts into this when paying users sign up
--      in Phase 4. Until then, table starts empty + every signed-in user is
--      treated as 'free' tier by the helper functions.
--
--   2. ai_usage table       — per-user-per-day AI call counter. The Phase E
--      AI proxy increments this via consume_daily_quota() before forwarding
--      requests to Anthropic. Decoupled from quiz_history so quota tracking
--      stays clean even if other parts of the app change schema.
--
--   3. stripe_events table  — webhook idempotency. Stripe can deliver events
--      multiple times; we dedupe by event_id. Empty until Phase 4 ships;
--      including it now keeps all Stripe-related schema in one migration.
--
--   4. is_pro(uid) function — used by RLS policies and the AI proxy to gate
--      Pro-only resources. Returns false for everyone until Stripe activates.
--
--   5. consume_daily_quota(uid, q_count) function — atomic check + increment.
--      Returns true if the call should proceed, false if Free quota exceeded.
--      Pro users always return true (E.6 will add fair-use throttling).
--
--   6. get_daily_quota_usage(uid) function — read-only quota state for the
--      Phase E.5 daily-counter UI ("12 of 20 used today").
--
--   7. RLS policies — users read their own subscriptions + ai_usage rows.
--      Writes go through service-role (proxy) or security-definer functions
--      so users can't fake their own tier or quota count.
--
--   8. updated_at trigger pattern — on subscriptions table, auto-bumps the
--      timestamp every UPDATE.
--
-- What this does NOT do:
--   • Activate Stripe — no env vars, no webhook handler, no checkout flow.
--     This migration is pure DB scaffolding so the AI proxy (Phase E) can
--     enforce quotas server-side. Stripe lives at Phase 4 (last before launch).
--   • Migrate existing data — usage counter starts at 0 for everyone on the
--     day this ships. No backfill from quiz_history.
--   • Touch profiles.metadata — readiness snapshots + cert_results stay
--     in metadata as before; that pattern works.
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. subscriptions table
-- ══════════════════════════════════════════════════════════════════════════
create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'active'
    check (status in ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
  billing_period text check (billing_period in ('monthly', 'annual')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  pass_guarantee_extended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table subscriptions is
  'Per-user subscription state. Default tier=free for everyone (rows lazy-created on first checkout). Stripe webhook handler is the only writer; clients read their own row via RLS.';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. ai_usage table — daily quota counter
-- ══════════════════════════════════════════════════════════════════════════
create table if not exists ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  call_date date not null,
  call_count int not null default 0,
  primary key (user_id, call_date)
);

create index if not exists idx_ai_usage_user_date on ai_usage(user_id, call_date);

comment on table ai_usage is
  'Per-user-per-day AI call counter. consume_daily_quota() upserts into this. Used both for Free quota enforcement (cap 20/day) and Pro analytics (no cap, just logged).';

-- ══════════════════════════════════════════════════════════════════════════
-- 3. stripe_events table — webhook idempotency (Phase 4 will use)
-- ══════════════════════════════════════════════════════════════════════════
create table if not exists stripe_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz default now()
);

comment on table stripe_events is
  'Stripe webhook idempotency log. Stripe can deliver events multiple times; webhook handler dedupes by event_id. Empty until Phase 4 ships.';

-- ══════════════════════════════════════════════════════════════════════════
-- 4. RLS — subscriptions: user reads own row, no client writes
-- ══════════════════════════════════════════════════════════════════════════
alter table subscriptions enable row level security;

drop policy if exists "subs_self_read" on subscriptions;
create policy "subs_self_read" on subscriptions
  for select using (auth.uid() = user_id);

-- (No insert/update/delete policies. Service-role webhook is the only writer.)

-- ══════════════════════════════════════════════════════════════════════════
-- 5. RLS — ai_usage: user reads own row, only function can write
-- ══════════════════════════════════════════════════════════════════════════
alter table ai_usage enable row level security;

drop policy if exists "ai_usage_self_read" on ai_usage;
create policy "ai_usage_self_read" on ai_usage
  for select using (auth.uid() = user_id);

-- (No insert/update/delete policies. consume_daily_quota() bypasses RLS via
-- security definer, so users can't fake their counter.)

-- ══════════════════════════════════════════════════════════════════════════
-- 6. is_pro(uid) — used by RLS on Pro-gated resources + AI proxy
-- ══════════════════════════════════════════════════════════════════════════
create or replace function is_pro(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from subscriptions
    where user_id = uid
      and tier = 'pro'
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
  );
$$;

comment on function is_pro is
  'Returns true if the user has an active Pro subscription. Used by RLS policies and the AI proxy to gate Pro features. Pre-Stripe: always returns false.';

-- ══════════════════════════════════════════════════════════════════════════
-- 7. consume_daily_quota(uid, q_count) — atomic check + increment
-- ══════════════════════════════════════════════════════════════════════════
create or replace function consume_daily_quota(uid uuid, q_count int default 1)
returns boolean
language plpgsql
security definer
as $$
declare
  is_pro_user boolean;
  today_count int;
  daily_limit constant int := 20;
begin
  is_pro_user := is_pro(uid);

  if is_pro_user then
    -- Pro: unlimited (E.6 may add fair-use throttling). Still log for analytics.
    insert into ai_usage (user_id, call_date, call_count)
    values (uid, current_date, q_count)
    on conflict (user_id, call_date)
    do update set call_count = ai_usage.call_count + q_count;
    return true;
  end if;

  -- Free tier: check today's count first
  select coalesce(call_count, 0)
    into today_count
    from ai_usage
    where user_id = uid and call_date = current_date;

  if (today_count + q_count) > daily_limit then
    return false;  -- quota exceeded — proxy returns 429 with upgrade CTA
  end if;

  -- Within quota — increment and allow
  insert into ai_usage (user_id, call_date, call_count)
  values (uid, current_date, q_count)
  on conflict (user_id, call_date)
  do update set call_count = ai_usage.call_count + q_count;
  return true;
end;
$$;

comment on function consume_daily_quota is
  'Atomic check + increment of the user''s daily AI quota. Returns true if the call should proceed, false if Free quota exceeded. Pro users always pass.';

-- ══════════════════════════════════════════════════════════════════════════
-- 8. get_daily_quota_usage(uid) — read-only state for the quota UI
-- ══════════════════════════════════════════════════════════════════════════
create or replace function get_daily_quota_usage(uid uuid)
returns table(used_today int, daily_limit int, tier text)
language plpgsql
security definer
stable
as $$
declare
  is_pro_user boolean;
  today_count int;
begin
  is_pro_user := is_pro(uid);

  select coalesce(call_count, 0)
    into today_count
    from ai_usage
    where user_id = uid and call_date = current_date;

  return query select
    coalesce(today_count, 0) as used_today,
    case when is_pro_user then -1 else 20 end as daily_limit,  -- -1 = unlimited
    case when is_pro_user then 'pro'::text else 'free'::text end as tier;
end;
$$;

comment on function get_daily_quota_usage is
  'Read-only quota state for the Phase E.5 daily-counter UI. Returns (used_today, daily_limit, tier). daily_limit = -1 means unlimited (Pro).';

-- ══════════════════════════════════════════════════════════════════════════
-- 9. updated_at trigger pattern (subscriptions only — ai_usage uses primary
--    key replace via UPSERT so doesn't need a trigger)
-- ══════════════════════════════════════════════════════════════════════════
create or replace function _set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subs_updated_at on subscriptions;
create trigger subs_updated_at
  before update on subscriptions
  for each row execute function _set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════
-- Done. Verify with:
--   select * from subscriptions limit 1;             -- should be empty
--   select * from ai_usage limit 1;                  -- should be empty
--   select is_pro(auth.uid());                       -- should return false
--   select consume_daily_quota(auth.uid(), 1);       -- should return true
--   select * from get_daily_quota_usage(auth.uid()); -- should show used=1, limit=20, tier=free
-- ══════════════════════════════════════════════════════════════════════════
