-- ══════════════════════════════════════════════════════════════════════════
-- Phase 6b — Web Vitals collector (real-user performance telemetry)
-- Date: 2026-05-11
-- ══════════════════════════════════════════════════════════════════════════
-- Run this once in Supabase Dashboard → SQL Editor → New Query.
-- Idempotent: safe to re-run (uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).
--
-- What this adds:
--   1. web_vitals table — append-only log of Core Web Vitals captured by the
--      client-side `lib/web-vitals-collector.js` once per session, fired on
--      tab-backgrounding (pagehide / visibilitychange: hidden). Rows hold
--      LCP / FCP / CLS / TTFB plus enough context to slice by cert / version
--      / viewport / connection type later.
--
--      Schema notes:
--      • user_id is NOT NULL — anonymous visitors (landing page bounces) are
--        intentionally excluded. The cert app's funnel is sign-in-first; anon
--        users don't reach the surfaces we optimise for.
--      • One row per session per page-route (not per metric). The collector
--        accumulates the 4 metrics during the session, then fires one INSERT
--        on tab hide. Cheaper than 4 separate inserts; matches how Web Vitals
--        is meant to be consumed (final values, not streaming).
--      • Immutable log — no UPDATE, no DELETE policy.
--
--   2. record_web_vitals(payload jsonb) RPC — single entry point for the
--      collector. SECURITY DEFINER so users can insert their own rows without
--      a permissive INSERT policy on the table. The function validates the
--      payload shape + stamps user_id from auth.uid() so clients can't spoof
--      another user's metrics.
--
--   3. RLS policies — admin reads all rows for analytics; users have no read
--      access to the raw table (we don't expose "your perf vs everyone" UX,
--      and the data is for internal optimization decisions, not user feedback).
--
-- What this does NOT do:
--   • Aggregate / rollup — query-time aggregation via SQL on the admin side.
--     A future Phase 6c can add a materialised view if query cost becomes
--     real. Today: just the raw log.
--   • Email summaries — future Phase 6d candidate (weekly p75 LCP delta to
--     founder).
--   • Backfill — table starts empty. Lighthouse synthetic baseline is the
--     historical record (lives in MOBILE_BASELINE.md).
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. web_vitals table ──────────────────────────────────────────────────
create table if not exists web_vitals (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  captured_at timestamptz not null default now(),

  -- Core Web Vitals (NULL if metric never observed in this session)
  lcp_ms integer check (lcp_ms is null or (lcp_ms >= 0 and lcp_ms <= 60000)),
  fcp_ms integer check (fcp_ms is null or (fcp_ms >= 0 and fcp_ms <= 60000)),
  cls numeric(6, 4) check (cls is null or (cls >= 0 and cls <= 99.9999)),
  ttfb_ms integer check (ttfb_ms is null or (ttfb_ms >= 0 and ttfb_ms <= 60000)),
  inp_ms integer check (inp_ms is null or (inp_ms >= 0 and inp_ms <= 60000)),

  -- Slicing dimensions
  app_version text,                -- e.g. '4.99.45'
  cert text check (cert is null or cert in ('netplus', 'secplus')),
  page_path text,                  -- e.g. '/' or '/?cert=secplus' (path + search, no host)
  viewport_w integer check (viewport_w is null or viewport_w > 0),
  viewport_h integer check (viewport_h is null or viewport_h > 0),
  connection_type text,            -- '4g' / '3g' / '2g' / 'slow-2g' / 'unknown'
  save_data boolean,               -- navigator.connection.saveData
  user_agent_short text            -- truncated UA, useful for iOS/Android slicing
);

create index if not exists idx_web_vitals_captured_at on web_vitals (captured_at desc);
create index if not exists idx_web_vitals_app_version on web_vitals (app_version);
create index if not exists idx_web_vitals_user_id on web_vitals (user_id);

comment on table web_vitals is
  'Append-only real-user Core Web Vitals log. One row per session per page hide. Phase 6b telemetry — admin reads via is_admin(); users have no read access.';

-- ── 2. record_web_vitals(payload jsonb) — single client entry point ──────
create or replace function record_web_vitals(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- auth.uid() is the calling user's id (or NULL if no session).
  v_user_id := auth.uid();
  if v_user_id is null then
    -- Silently no-op for anonymous callers. The client-side collector also
    -- gates on signed-in state, so this should be a redundant guard.
    return;
  end if;

  -- Defensive payload-shape validation. Reject malformed inputs with a clear
  -- error rather than silently inserting NULLs everywhere.
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'record_web_vitals: payload must be a JSON object';
  end if;

  insert into web_vitals (
    user_id,
    lcp_ms, fcp_ms, cls, ttfb_ms, inp_ms,
    app_version, cert, page_path,
    viewport_w, viewport_h,
    connection_type, save_data,
    user_agent_short
  ) values (
    v_user_id,
    nullif((payload->>'lcp_ms')::int, -1),
    nullif((payload->>'fcp_ms')::int, -1),
    nullif((payload->>'cls')::numeric, -1),
    nullif((payload->>'ttfb_ms')::int, -1),
    nullif((payload->>'inp_ms')::int, -1),
    payload->>'app_version',
    payload->>'cert',
    payload->>'page_path',
    nullif((payload->>'viewport_w')::int, 0),
    nullif((payload->>'viewport_h')::int, 0),
    payload->>'connection_type',
    (payload->>'save_data')::boolean,
    left(coalesce(payload->>'user_agent_short', ''), 200)
  );
exception when others then
  -- Don't surface DB errors to the client — telemetry must never break the app.
  -- The collector silently no-ops on RPC failure; we lose this datapoint
  -- but the user's session is unaffected.
  raise warning 'record_web_vitals failed: %', sqlerrm;
end;
$$;

comment on function record_web_vitals is
  'Phase 6b — single entry point for client-side Web Vitals collector. SECURITY DEFINER so users can insert without a permissive INSERT policy on the table. Stamps user_id from auth.uid() so clients cannot spoof other users.';

-- ── 3. RLS — admin reads, no client reads ────────────────────────────────
alter table web_vitals enable row level security;

-- Admin can read all rows for analytics queries.
drop policy if exists "web_vitals_admin_select" on web_vitals;
create policy "web_vitals_admin_select" on web_vitals
  for select using (public.is_admin());

-- No INSERT policy on the table itself — all writes go through the
-- record_web_vitals() RPC, which runs SECURITY DEFINER and bypasses RLS.
-- No UPDATE / DELETE policies — log is immutable.

-- ══════════════════════════════════════════════════════════════════════════
-- Done. Verify with:
--   select count(*) from web_vitals;                     -- empty post-migration
--   select record_web_vitals(jsonb_build_object(
--     'lcp_ms', 2400, 'fcp_ms', 1800, 'cls', 0.05,
--     'ttfb_ms', 600, 'app_version', '4.99.45',
--     'cert', 'netplus', 'page_path', '/',
--     'viewport_w', 1440, 'viewport_h', 900,
--     'connection_type', '4g', 'save_data', false,
--     'user_agent_short', 'Mozilla/5.0 ...'
--   ));                                                   -- as signed-in user
--   select count(*) from web_vitals;                     -- now 1 (admin reads)
--
-- Common slicing queries (admin):
--   -- p75 LCP by app version
--   select app_version, percentile_cont(0.75) within group (order by lcp_ms) as p75_lcp
--     from web_vitals where lcp_ms is not null and captured_at > now() - interval '7 days'
--     group by app_version order by app_version desc;
--
--   -- iOS vs Android median LCP
--   select case when user_agent_short ilike '%iphone%' or user_agent_short ilike '%ipad%' then 'iOS'
--                when user_agent_short ilike '%android%' then 'Android'
--                else 'Other' end as platform,
--          percentile_cont(0.5) within group (order by lcp_ms) as p50_lcp,
--          count(*) as sessions
--     from web_vitals where lcp_ms is not null and captured_at > now() - interval '7 days'
--     group by 1;
-- ══════════════════════════════════════════════════════════════════════════
