-- ══════════════════════════════════════════════════════════════════════════
-- CertAnvil — onboarding rollout gate config (Track A)
-- ══════════════════════════════════════════════════════════════════════════
-- WHAT: a tiny public-readable key/value config table. One seeded row,
--       'onboarding_enabled', drives whether the onboarding flow is live.
--       Replaces the per-origin localStorage `onb_router` flag so the switch
--       is global across all cert subdomains and instantly reversible.
-- WHY NOW: flips onboarding from manual ?onb=1 to a global, server-driven
--       gate with a kill-switch; also fixes Bug A (per-origin flag vanished
--       when switching cert subdomains — separate Vercel origins).
-- SECURITY: SELECT is public (anon + authenticated). There is NO insert/
--       update/delete policy, so writes are service-role only — the founder
--       flips `enabled` from the Supabase dashboard / SQL editor. Read-only
--       from the browser, so none of the RLS write-path gotchas (POSIX regex,
--       UPSERT→UPDATE policy, return=representation) apply here.
-- VERIFY AFTER APPLYING (run in SQL editor):
--   select key, enabled from public.app_config;            -- one row, enabled=false
--   set role anon; select enabled from public.app_config
--     where key='onboarding_enabled'; reset role;          -- returns the row (public read works)
-- ══════════════════════════════════════════════════════════════════════════

create table if not exists public.app_config (
  key        text primary key,
  enabled    boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

drop policy if exists "app_config public read" on public.app_config;
create policy "app_config public read"
  on public.app_config
  for select
  to anon, authenticated
  using (true);

insert into public.app_config (key, enabled)
  values ('onboarding_enabled', false)
  on conflict (key) do nothing;

-- ROLLBACK:
-- drop policy if exists "app_config public read" on public.app_config;
-- drop table if exists public.app_config;
