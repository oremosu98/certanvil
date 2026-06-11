-- ══════════════════════════════════════════════════════════════════════════
-- 2026-06-11 — Free-tier daily question quota: 20 → 15
-- ══════════════════════════════════════════════════════════════════════════
-- GAP-1 of the tier-logic sweep (docs/planning/TIER-LOGIC-SWEEP-2026-06-11.md).
-- The cert-ios build locked the free daily allowance at 15 practice questions
-- + 5 review cards (mockup cert-ios-daily-limit.html: "15 practice + 5 review.
-- Pro removes the cap."). The question half lives here; the 5-review-cards cap
-- is client-side in app.js (reviews are saved cards — no AI spend to protect).
--
-- Re-creates both Phase E quota functions from 20260509_phase_e_subscriptions
-- with daily_limit 15. Function bodies are otherwise byte-identical to the
-- originals. api/ai/generate.js FREE_DAILY_LIMIT mirrors this value and ships
-- in the same PR.
--
-- Pro/admin behaviour unchanged: is_pro() users remain unlimited (-1).
-- Users who already consumed 15–20 today simply hit the wall on their next
-- metered call — no data backfill needed (ai_usage rows are plain counters).
-- ══════════════════════════════════════════════════════════════════════════

create or replace function consume_daily_quota(uid uuid, q_count int default 1)
returns boolean
language plpgsql
security definer
as $$
declare
  is_pro_user boolean;
  today_count int;
  daily_limit constant int := 15;
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
  'Atomic check + increment of the user''s daily AI quota (free limit 15/day as of 2026-06-11). Returns true if the call should proceed, false if Free quota exceeded. Pro users always pass.';

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
    case when is_pro_user then -1 else 15 end as daily_limit,  -- -1 = unlimited
    case when is_pro_user then 'pro'::text else 'free'::text end as tier;
end;
$$;

comment on function get_daily_quota_usage is
  'Read-only quota state for the Phase E.5 daily-counter UI. Returns (used_today, daily_limit, tier). daily_limit = -1 means unlimited (Pro); free limit 15/day as of 2026-06-11.';

-- ROLLBACK:
-- Re-run sections 7 + 8 of 20260509_phase_e_subscriptions.sql verbatim, i.e.
-- the same two CREATE OR REPLACE statements above with the two literals set
-- back to 20 ("daily_limit constant int := 20" in consume_daily_quota and
-- "else 20 end as daily_limit" in get_daily_quota_usage) and the original
-- function comments. No table or data changes to undo — ai_usage rows are
-- plain counters and remain valid under either limit.
