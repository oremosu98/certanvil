-- ══════════════════════════════════════════════════════════════════════════
-- Account deletion that does what it promises (2026-10-29)
-- ══════════════════════════════════════════════════════════════════════════
-- "Delete account" marks the account; 7 days later the database removes
-- everything tied to the person. Signing in again within those 7 days
-- cancels the deletion and leaves a one-time notice for the app to show.
-- Spec: docs/superpowers/specs/2026-10-29-account-deletion-design.md
--
-- What this file does:
--   1. public.safe_timestamptz(text): parses a stored mark, NULL (never an
--      error) on a missing or bad value.
--   2. public.request_account_deletion(): the caller marks their OWN profile
--      with the server's clock (metadata.deletion_requested_at) and drops any
--      old cancel notice. Returns the stamp (NULL if the caller has no profile).
--   3. public.clear_deletion_notice(): the caller removes their OWN
--      metadata.deletion_cancelled_at once the app has shown the notice.
--   4. public.cancel_deletion_on_signin() + trigger on_signin_cancel_deletion
--      on auth.users: a new sign-in (last_sign_in_at moves past the mark)
--      clears the mark and sets metadata.deletion_cancelled_at. A token
--      refresh does not move last_sign_in_at, so it never cancels. The trigger
--      never raises: a failure is logged as a WARNING and the sign-in goes on.
--
-- Every function is SECURITY DEFINER with search_path = '' and fully
-- schema-qualified names (GoTrue fires the trigger as supabase_auth_admin).
-- The two RPCs and safe_timestamptz are executable by `authenticated` only;
-- Supabase's default privileges would otherwise let anon and service_role
-- call new public functions, so EXECUTE is revoked from them explicitly.
--
-- Tested in PGlite on every commit: tests/deletion-db.test.mjs (UAT 512).
--
-- ACTION REQUIRED: run this whole file once in Supabase Dashboard → SQL
-- Editor (as postgres). Idempotent (CREATE OR REPLACE / DROP ... IF EXISTS).
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. safe_timestamptz · parse a mark without ever raising ───────────────
create or replace function public.safe_timestamptz(p_value text)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $safe_ts$
begin
  return p_value::timestamptz;
exception when others then
  return null;
end;
$safe_ts$;

revoke execute on function public.safe_timestamptz(text) from public, anon, service_role;
grant execute on function public.safe_timestamptz(text) to authenticated;

-- ── 2. request_account_deletion · mark the caller's own profile ───────────
-- One atomic update, stamped by the server's clock: the client clock cannot
-- move the purge or block the cancel, and no client read-modify-write can
-- race cloud-store's metadata flush.
create or replace function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $request_del$
declare
  v_stamp timestamptz;
begin
  update public.profiles
     set metadata = (coalesce(metadata, '{}'::jsonb) - 'deletion_cancelled_at')
                    || jsonb_build_object('deletion_requested_at', now())
   where id = auth.uid()
  returning now() into v_stamp;
  return v_stamp;
end;
$request_del$;

revoke execute on function public.request_account_deletion() from public, anon, service_role;
grant execute on function public.request_account_deletion() to authenticated;

-- ── 3. clear_deletion_notice · drop the caller's cancel notice ────────────
create or replace function public.clear_deletion_notice()
returns void
language plpgsql
security definer
set search_path = ''
as $clear_notice$
begin
  update public.profiles
     set metadata = metadata - 'deletion_cancelled_at'
   where id = auth.uid()
     and metadata ? 'deletion_cancelled_at';
end;
$clear_notice$;

revoke execute on function public.clear_deletion_notice() from public, anon, service_role;
grant execute on function public.clear_deletion_notice() to authenticated;

-- ── 4. cancel_deletion_on_signin · a new sign-in cancels the mark ─────────
-- Fires only when last_sign_in_at actually moves, and acts only when the
-- profile's mark is set and earlier than the new sign-in time. A sign-in
-- with no profile row, or any error at all, must never block the sign-in.
create or replace function public.cancel_deletion_on_signin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $cancel_del$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.profiles
       set metadata = (metadata - 'deletion_requested_at')
                      || jsonb_build_object('deletion_cancelled_at', now())
     where id = new.id
       and public.safe_timestamptz(metadata->>'deletion_requested_at') < new.last_sign_in_at;
  end if;
  return new;
exception when others then
  raise warning 'cancel_deletion_on_signin: %', sqlerrm;
  return new;
end;
$cancel_del$;

alter function public.cancel_deletion_on_signin() owner to postgres;

drop trigger if exists on_signin_cancel_deletion on auth.users;
create trigger on_signin_cancel_deletion
  after update of last_sign_in_at on auth.users
  for each row execute function public.cancel_deletion_on_signin();

-- ══════════════════════════════════════════════════════════════════════════
-- ROLLBACK: run in the SQL Editor to remove everything this file created.
-- ══════════════════════════════════════════════════════════════════════════
-- drop trigger if exists on_signin_cancel_deletion on auth.users;
-- drop function if exists public.cancel_deletion_on_signin();
-- drop function if exists public.clear_deletion_notice();
-- drop function if exists public.request_account_deletion();
-- drop function if exists public.safe_timestamptz(text);
