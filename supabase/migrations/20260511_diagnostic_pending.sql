-- ══════════════════════════════════════════════════════════════════════════
-- D.5 · Anonymous → authed diagnostic results migration (v4.99.56, 2026-05-11)
-- ══════════════════════════════════════════════════════════════════════════
-- Lets an anonymous visitor who completed the landing baseline diagnostic
-- claim their results into a real CertAnvil account via magic-link signup.
--
-- Flow:
--   1. User completes /diagnostic at certanvil.com (anon)
--   2. User clicks "Continue with a free account" + enters email
--   3. Endpoint /api/diagnostic/signup-magic-link writes a row to
--      `diagnostic_pending` keyed by a random token (32 hex) + sends a
--      magic link via Supabase auth (client-side signInWithOtp)
--   4. User clicks magic link → lands at networkplus.certanvil.com with
--      ?action=claim-diagnostic&token=XXXX
--   5. After SIGNED_IN, cert app calls claim_diagnostic_results(token) →
--      results merge into profiles.metadata.diagnostic +
--      profiles.metadata.diagnostic_history[], pending row marked claimed
--
-- Rate-limit table is separate from D.3's per-IP quiz quota — magic-link
-- requests are gated at 5/hour/IP-hash (D.3 quiz generation is 25/24h).
--
-- Run once in Supabase Dashboard → SQL Editor.
-- Idempotent — uses IF NOT EXISTS + OR REPLACE.
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. is_admin() guard ──────────────────────────────────────────────────
-- Created in 20260506_phase_c_prime.sql. Error loud if it isn't there yet —
-- this migration depends on it for the admin-only RLS read policies below.
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'is_admin') then
    raise exception 'is_admin() not found — apply 20260506_phase_c_prime.sql first.';
  end if;
end$$;

-- ── 2. diagnostic_pending table ──────────────────────────────────────────
-- Stores anon-completed diagnostic results pending claim via magic-link
-- signup. Tokens are 32+ hex chars (random.bytes-derived). Rows auto-expire
-- after 7 days; claimed rows live another 30 days for audit then purge.
create table if not exists diagnostic_pending (
  token        text primary key,
  email        text not null,
  cert         text not null,
  results      jsonb not null,
  created_at   timestamptz not null default now(),
  claimed_at   timestamptz,
  expires_at   timestamptz not null default (now() + interval '7 days')
);

create index if not exists idx_diag_pending_email
  on diagnostic_pending (email);
create index if not exists idx_diag_pending_expires_at
  on diagnostic_pending (expires_at) where claimed_at is null;

comment on table diagnostic_pending is
  'Anonymous diagnostic results awaiting magic-link account claim. Token = 32+ hex. Auto-expires in 7 days; claimed rows kept 30 days for audit.';

-- ── 3. diagnostic_signup_rate_limit table ────────────────────────────────
-- Separate counter from D.3's diagnostic_rate_limit. Magic-link requests
-- are gated at 5/hour/IP-hash to prevent email-spam abuse via this
-- endpoint.
create table if not exists diagnostic_signup_rate_limit (
  ip_hash      text primary key,
  call_count   int not null default 0,
  first_at     timestamptz not null default now(),
  last_at      timestamptz not null default now(),
  blocked_at   timestamptz
);

create index if not exists idx_diag_signup_rl_last_at
  on diagnostic_signup_rate_limit (last_at);

comment on table diagnostic_signup_rate_limit is
  'Magic-link signup rate limiting · per-IP-hash · 5 calls / 1h rolling window. Separate from D.3 quiz rate limit.';

-- ── 4. RLS — admin reads only; service-role writes via endpoint ──────────
alter table diagnostic_pending enable row level security;
alter table diagnostic_signup_rate_limit enable row level security;

drop policy if exists "diag_pending_admin_select" on diagnostic_pending;
create policy "diag_pending_admin_select" on diagnostic_pending
  for select using (public.is_admin());

drop policy if exists "diag_signup_rl_admin_select" on diagnostic_signup_rate_limit;
create policy "diag_signup_rl_admin_select" on diagnostic_signup_rate_limit
  for select using (public.is_admin());

-- No insert/update/delete client policies — the serverless endpoint uses
-- the service-role key to write directly, bypassing RLS. The claim RPC
-- below uses SECURITY DEFINER for the same reason.

-- ── 5. diag_signup_check_and_increment(ip_hash) ──────────────────────────
-- Atomic check + upsert. 5 magic-link sends per IP-hash per 1h rolling
-- window. Mirrors D.3's diag_rl_check_and_increment but with shorter
-- window + lower cap (magic-link is more sensitive than quiz Q gen).
create or replace function diag_signup_check_and_increment(
  p_ip_hash text
)
returns table(
  allowed boolean,
  current_count int,
  hourly_limit int,
  resets_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_first_at timestamptz;
  v_limit constant int := 5;
  v_window constant interval := interval '1 hour';
begin
  select call_count, first_at
    into v_count, v_first_at
    from diagnostic_signup_rate_limit
    where ip_hash = p_ip_hash
    for update;

  -- Fresh IP: insert + allow
  if v_count is null then
    insert into diagnostic_signup_rate_limit (ip_hash, call_count, first_at, last_at)
      values (p_ip_hash, 1, now(), now());
    return query select true, 1, v_limit, now() + v_window;
    return;
  end if;

  -- Window expired: reset counter
  if (now() - v_first_at) > v_window then
    update diagnostic_signup_rate_limit
      set call_count = 1, first_at = now(), last_at = now(), blocked_at = null
      where ip_hash = p_ip_hash;
    return query select true, 1, v_limit, now() + v_window;
    return;
  end if;

  -- Cap exceeded
  if (v_count + 1) > v_limit then
    update diagnostic_signup_rate_limit
      set last_at = now(), blocked_at = coalesce(blocked_at, now())
      where ip_hash = p_ip_hash;
    return query select false, v_count, v_limit, v_first_at + v_window;
    return;
  end if;

  -- Under cap: increment
  update diagnostic_signup_rate_limit
    set call_count = call_count + 1, last_at = now()
    where ip_hash = p_ip_hash;
  return query select true, v_count + 1, v_limit, v_first_at + v_window;
end;
$$;

comment on function diag_signup_check_and_increment is
  'Atomic check + increment for magic-link signup rate limit. 5/hour/IP-hash. Service-role only.';

-- ── 6. claim_diagnostic_results(p_token) ─────────────────────────────────
-- Called by an AUTHENTICATED user after signing in via magic link.
-- Looks up the pending row by token, validates ownership rules, merges
-- the results into the user's profiles.metadata.diagnostic (latest) +
-- profiles.metadata.diagnostic_history[] (append-only log), and marks
-- the row claimed.
--
-- Note: there's no email-match check here — anyone holding a valid
-- unclaimed token can claim it. The token is 32+ hex chars (cryptographic
-- randomness), only ever sent via the magic-link email, and one-shot
-- (claimed_at is set on first successful claim). The threat model is:
-- if someone steals the magic-link URL, they could already sign in as
-- the target email — claiming the diagnostic data on top is no extra
-- escalation.
create or replace function claim_diagnostic_results(p_token text)
returns table(
  ok boolean,
  message text,
  cert text,
  scaled_score int,
  total_questions int,
  correct_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending diagnostic_pending%rowtype;
  v_user_id uuid := auth.uid();
  v_results jsonb;
begin
  -- Must be signed in
  if v_user_id is null then
    return query select false, 'not_signed_in'::text, null::text, null::int, null::int, null::int;
    return;
  end if;

  -- Token must be a string (basic sanity — not enforcing length/charset here,
  -- the endpoint generated it)
  if p_token is null or length(p_token) < 16 then
    return query select false, 'invalid_token'::text, null::text, null::int, null::int, null::int;
    return;
  end if;

  -- Lock + fetch pending row
  select * into v_pending
    from diagnostic_pending
    where token = p_token
    for update;

  if v_pending.token is null then
    return query select false, 'not_found'::text, null::text, null::int, null::int, null::int;
    return;
  end if;

  if v_pending.claimed_at is not null then
    return query select true, 'already_claimed'::text,
      v_pending.cert,
      (v_pending.results->>'scaledScore')::int,
      (v_pending.results->>'totalQuestions')::int,
      (v_pending.results->>'correctCount')::int;
    return;
  end if;

  if v_pending.expires_at < now() then
    return query select false, 'expired'::text,
      v_pending.cert, null::int, null::int, null::int;
    return;
  end if;

  v_results := v_pending.results;

  -- Merge into profiles.metadata.diagnostic (latest pass plan, single object)
  -- + profiles.metadata.diagnostic_history[] (append-only history log).
  -- Idempotent via the claim guard above + the diagnostic_history entry
  -- captures source='landing-diagnostic' so duplicates by other channels
  -- stay distinguishable.
  update profiles
    set metadata = jsonb_set(
      jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        '{diagnostic}',
        jsonb_build_object(
          'cert', v_pending.cert,
          'diagnosticId', v_results->>'diagnosticId',
          'scaledScore', (v_results->>'scaledScore')::int,
          'passThreshold', (v_results->>'passThreshold')::int,
          'isPassing', (v_results->>'isPassing')::boolean,
          'accuracy', (v_results->>'accuracy')::float,
          'totalQuestions', (v_results->>'totalQuestions')::int,
          'correctCount', (v_results->>'correctCount')::int,
          'domainBreakdown', v_results->'domainBreakdown',
          'completedAt', (v_results->>'completedAt')::bigint,
          'durationMs', (v_results->>'durationMs')::bigint,
          'source', 'landing-diagnostic',
          'claimedAt', (extract(epoch from now()) * 1000)::bigint
        )
      ),
      '{diagnostic_history}',
      coalesce(metadata->'diagnostic_history', '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'cert', v_pending.cert,
          'diagnosticId', v_results->>'diagnosticId',
          'scaledScore', (v_results->>'scaledScore')::int,
          'totalQuestions', (v_results->>'totalQuestions')::int,
          'correctCount', (v_results->>'correctCount')::int,
          'completedAt', (v_results->>'completedAt')::bigint,
          'source', 'landing-diagnostic'
        )
      )
    )
    where id = v_user_id;

  -- Mark token claimed
  update diagnostic_pending set claimed_at = now() where token = p_token;

  return query select true, 'claimed'::text,
    v_pending.cert,
    (v_results->>'scaledScore')::int,
    (v_results->>'totalQuestions')::int,
    (v_results->>'correctCount')::int;
end;
$$;

comment on function claim_diagnostic_results is
  'Claim an anon diagnostic into the signed-in user''s profile. One-shot per token. Merges into profiles.metadata.diagnostic + diagnostic_history[].';

-- Grant execute to authenticated users so they can call via the JS RPC.
grant execute on function claim_diagnostic_results(text) to authenticated;

-- ── 7. Cleanup helper · purges expired/claimed rows ──────────────────────
-- Runnable manually: select diag_pending_purge_old();
-- Can be wired to pg_cron later (same pattern as diag_rl_purge_old).
create or replace function diag_pending_purge_old()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  delete from diagnostic_pending
    where (expires_at < now() and claimed_at is null)        -- expired unclaimed
       or (claimed_at is not null and claimed_at < (now() - interval '30 days'));  -- old claimed
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function diag_pending_purge_old is
  'Deletes diagnostic_pending rows that expired unclaimed (>7d) or were claimed >30 days ago.';

-- ══════════════════════════════════════════════════════════════════════════
-- Verify
-- ══════════════════════════════════════════════════════════════════════════
-- (as service role / admin):
-- select diag_signup_check_and_increment('test-hash-001');
--   → (true, 1, 5, now()+1h)
-- repeat 5×: (true, 5, ...) → 6th: (false, 5, ...)
-- select * from diagnostic_pending limit 1;  -- as admin
-- select diag_pending_purge_old();           -- as admin → returns 0 fresh
