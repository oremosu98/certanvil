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
--      It also accepts Postgres's special values ('epoch', '-infinity', ...).
--      Accepted: they can only make the user's OWN account due sooner, and a
--      user can already write their own metadata.
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
--      It waits at most 2s for the profile's row lock (lock_timeout, scoped to
--      the function), so a concurrent profile write cannot hang a sign-in; a
--      lock timeout is an ordinary error, caught and logged like any other.
--      Note: WHEN OTHERS does not catch query_canceled (a statement_timeout or
--      a cancel request), so a long wait would abort the sign-in; the short
--      lock_timeout fires first and turns that wait into a caught error.
--   5. public.admin_audit_record() (from 20260531_phase5_admin_audit_log.sql)
--      gains one first-line check: while the session flag certanvil.purging
--      is 'on' it writes nothing. Body otherwise unchanged.
--   6. public.purge_deleted_accounts(): deletes every account whose mark is
--      more than 7 days old, one account per sub-transaction (one failure is
--      logged as a WARNING and never stops the others). For each: anonymise
--      its admin_audit_log rows, blank user_id on its error and bug reports,
--      delete its waitlist / notify / diagnostic rows by email (auth and
--      profile email, case-insensitive), then delete the auth.users row, which
--      cascades to profiles, quiz_history, cert_entitlements, subscriptions,
--      ai_usage and web_vitals. It also deletes the person's AI rate-limit
--      row (ai_proxy_rate_limit key 'user:<id>'). Returns how many accounts it
--      purged. Only the owner (postgres) may run it.
--      Each account is locked (auth.users, then profiles: the same order as a
--      sign-in) and re-checked before anything is touched, so an account
--      reclaimed by a sign-in after the run started is skipped, never deleted.
--      lock_timeout = 5s: an account whose row is held elsewhere becomes a
--      caught WARNING and is retried next hour, instead of stalling the run.
--      Per-account failures show ONLY as WARNINGs in the Postgres logs:
--      cron.job_run_details still reports the run as "succeeded" when an
--      account was skipped. Check the logs for "purge_deleted_accounts:".
--      Anonymising an audit row where the person acted as admin on someone
--      else keeps that someone's id but also nulls the row's old_data and
--      new_data (intended: the images may carry the person's own data).
--      It also skips an account that signed in after its mark
--      (auth.users.last_sign_in_at later than the mark), even if the mark is
--      still there.
--   6b. ONE-TIME: every mark written before 2026-10-29T00:00:00Z (the old
--      flow, since v7.45.0, never cleared its marks) is re-stamped to now(),
--      a fresh 7 days, so the first hourly run purges nobody by surprise.
--      Re-running the file does not extend them again (see the block).
--   7. pg_cron job purge-deleted-accounts, hourly at :17, only where pg_cron
--      is available (on Supabase you may first need to switch it on under
--      Database → Extensions). Re-running replaces the job, never duplicates.
--
-- Every function is SECURITY DEFINER, owned by postgres, with search_path = ''
-- and fully schema-qualified names (GoTrue fires the trigger as
-- supabase_auth_admin). The one exception is admin_audit_record(), which keeps
-- its original search_path = public so its body stays verbatim.
-- The two RPCs and safe_timestamptz are executable by `authenticated` only;
-- Supabase's default privileges would otherwise let anon and service_role
-- call new public functions, so EXECUTE is revoked from them explicitly.
-- purge_deleted_accounts is revoked from all of public, anon, authenticated
-- and service_role.
--
-- Tested in PGlite on every commit: tests/deletion-db.test.mjs (UAT 512).
--
-- ACTION REQUIRED: run this whole file once in Supabase Dashboard → SQL
-- Editor (as postgres). Idempotent (CREATE OR REPLACE / DROP ... IF EXISTS).
-- The ROLLBACK block at the end undoes it (it cannot restore purged accounts,
-- nor un-re-stamp the marks block 6b moved). Before running it, do the
-- preflight in the plan (Task 6 Step 2): list every marked account and strip
-- the mark of anyone who should stay.
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

alter function public.safe_timestamptz(text) owner to postgres;
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

alter function public.request_account_deletion() owner to postgres;
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

alter function public.clear_deletion_notice() owner to postgres;
revoke execute on function public.clear_deletion_notice() from public, anon, service_role;
grant execute on function public.clear_deletion_notice() to authenticated;

-- ── 4. cancel_deletion_on_signin · a new sign-in cancels the mark ─────────
-- Fires only when last_sign_in_at actually moves, and acts only when the
-- profile's mark is set and earlier than the new sign-in time. A sign-in
-- with no profile row, or any error at all, must never block the sign-in.
-- lock_timeout caps the wait on the profile row at 2s (see the header).
create or replace function public.cancel_deletion_on_signin()
returns trigger
language plpgsql
security definer
set search_path = ''
set lock_timeout = '2s'
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

-- ── 5. admin_audit_record · write nothing while the purge runs ────────────
-- The original from 20260531_phase5_admin_audit_log.sql, verbatim, plus the
-- first-line check. Signature, SECURITY DEFINER, search_path and comment are
-- unchanged. These are AFTER triggers, so the early return hands back the same
-- row the original does (OLD on DELETE, NEW otherwise).
create or replace function public.admin_audit_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $audit_purge_fn$
declare
  v_rec       jsonb;
  v_target_id text;
begin
  -- The purge (section 6) sets certanvil.purging for its own cascade: write nothing.
  if current_setting('certanvil.purging', true) = 'on' then
    if (tg_op = 'DELETE') then
      return old;
    end if;
    return new;
  end if;

  -- Row of interest: NEW on INSERT/UPDATE, OLD on DELETE
  if (tg_op = 'DELETE') then
    v_rec := to_jsonb(old);
  else
    v_rec := to_jsonb(new);
  end if;

  -- Generic PK resolution: profiles/cert_entitlements key on `id`, subscriptions on `user_id`
  v_target_id := coalesce(v_rec->>'id', v_rec->>'user_id');

  insert into admin_audit_log (actor_id, action, target_table, target_op, target_id, old_data, new_data)
  values (
    auth.uid(),
    tg_argv[0],
    tg_table_name,
    tg_op,
    v_target_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  -- AFTER trigger: return value is ignored, but must be a valid row
  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$audit_purge_fn$;

alter function public.admin_audit_record() owner to postgres;

comment on function public.admin_audit_record() is
  'AFTER-trigger writer for admin_audit_log. SECURITY DEFINER so the audit insert always lands (bypasses RLS) regardless of which role triggered it. action label via tg_argv[0].';

-- ── 6. purge_deleted_accounts · remove accounts past their 7 days ─────────
-- Due: the mark, read through safe_timestamptz, is older than 7 days. A
-- missing or unparseable mark is never due. Each account runs in its own
-- BEGIN ... EXCEPTION block: a failure rolls back that account only, is logged
-- as a WARNING, and the account is retried on the next hourly run.
create or replace function public.purge_deleted_accounts()
returns integer
language plpgsql
security definer
set search_path = ''
set lock_timeout = '5s'
as $purge$
declare
  r       record;
  v_id    text;
  v_mails text[];
  v_count integer := 0;
  v_last  timestamptz;
begin
  for r in
    select p.id
      from public.profiles p
     where public.safe_timestamptz(p.metadata->>'deletion_requested_at') < now() - interval '7 days'
     order by p.id
  loop
    begin
      -- Lock in a sign-in's order (auth.users, then profiles) and re-check:
      -- the list above is a snapshot, and a sign-in since then may have
      -- cleared the mark. Not due any more (or gone) = skip, untouched.
      -- A sign-in after the mark also saves the account even when the mark
      -- is still there: the cancel trigger may have missed it (its 2s lock
      -- wait timed out), or a stale whole-metadata write put a cancelled mark
      -- back.
      select u.last_sign_in_at into v_last
        from auth.users u where u.id = r.id for update;
      if not found then
        continue;
      end if;
      perform 1 from public.profiles p
       where p.id = r.id
         and public.safe_timestamptz(p.metadata->>'deletion_requested_at') < now() - interval '7 days'
         and (v_last is null or v_last <= public.safe_timestamptz(p.metadata->>'deletion_requested_at'))
         for update;
      if not found then
        continue;
      end if;

      -- 1. No audit rows for the cascade below (admin_audit_record checks this).
      perform pg_catalog.set_config('certanvil.purging', 'on', true);

      -- The person's emails: auth and profile, lower-cased, deduplicated.
      select coalesce(array_agg(distinct m.e), '{}')
        into v_mails
        from (select lower(u.email) as e from auth.users u where u.id = r.id
              union
              select lower(p.email) from public.profiles p where p.id = r.id) m
       where m.e is not null;

      -- 2. Anonymise audit rows about the person: their id and the row images
      --    go; action, table, op and timestamp stay. Another person's id in
      --    the same row (the person acting as admin on someone else) stays.
      --    cert_entitlements rows are logged under the entitlement's own id,
      --    with the person only in old_data/new_data.user_id, so match that too.
      v_id := r.id::text;
      update public.admin_audit_log
         set actor_id  = case when actor_id = r.id then null else actor_id end,
             target_id = case when target_id = v_id then null else target_id end,
             old_data  = null,
             new_data  = null
       where actor_id = r.id
          or target_id = v_id
          or old_data->>'user_id' = v_id
          or new_data->>'user_id' = v_id;

      -- 3. Error and bug reports stay, anonymous.
      update public.client_errors set user_id = null where user_id = r.id;
      update public.user_bug_reports set user_id = null where user_id = r.id;

      -- 4. Lists keyed by email, matched case-insensitively.
      delete from public.waitlist where lower(email) = any (v_mails);
      delete from public.notify_signups where lower(email) = any (v_mails);
      delete from public.diagnostic_pending where lower(email) = any (v_mails);

      -- The AI proxy's per-user rate-limit row.
      delete from public.ai_proxy_rate_limit where key = 'user:' || v_id;

      -- 5. The account itself; cascades to profiles, quiz_history,
      --    cert_entitlements, subscriptions, ai_usage, web_vitals.
      delete from auth.users where id = r.id;

      -- Audit back on for anything later in the caller's transaction. (On an
      -- error the sub-transaction rollback restores the flag by itself.)
      perform pg_catalog.set_config('certanvil.purging', 'off', true);
      v_count := v_count + 1;
    exception when others then
      raise warning 'purge_deleted_accounts: % %', r.id, sqlerrm;
    end;
  end loop;
  return v_count;
end;
$purge$;

alter function public.purge_deleted_accounts() owner to postgres;
revoke execute on function public.purge_deleted_accounts() from public, anon, authenticated, service_role;

-- ── 6b. One-time · give marks from the old flow a fresh 7 days ───────────
-- Since v7.45.0 the old delete stamped metadata.deletion_requested_at from the
-- client and never cleared it, and the old website delete left people signed
-- in. Without this block the first hourly run would purge every one of those
-- accounts at once, with no sign-in check. Each such mark is re-stamped to
-- now(), so its owner gets the full 7 days (and a sign-in cancels it as usual).
-- Only marks earlier than the fixed cutoff 2026-10-29T00:00:00Z (this
-- migration's date) are touched: a re-stamped mark is now() and so after the
-- cutoff, which makes a second run of this file a no-op for it, and marks made
-- by request_account_deletion() after the migration are never extended.
-- (Old-flow marks made on 29 Oct itself, before the migration ran, are not
-- re-stamped: they are less than a day old and already get about 7 days.)
-- A missing or unparseable mark is skipped (safe_timestamptz gives NULL).
update public.profiles
   set metadata = metadata || jsonb_build_object('deletion_requested_at', now())
 where public.safe_timestamptz(metadata->>'deletion_requested_at') < '2026-10-29T00:00:00Z'::timestamptz;

-- ── 7. Schedule · hourly at :17, only where pg_cron exists ────────────────
-- pg_cron runs a job as the role that scheduled it (postgres in the SQL
-- Editor), the only role allowed to run the purge. Without pg_cron (the PGlite
-- test harness) this does nothing. Any existing job of the same name is
-- removed first, so re-running the file never creates a duplicate.
do $schedule$
begin
  if exists (select 1 from pg_catalog.pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.unschedule(j.jobid) from cron.job j where j.jobname = 'purge-deleted-accounts';
    perform cron.schedule('purge-deleted-accounts', '17 * * * *', 'select public.purge_deleted_accounts()');
  end if;
end
$schedule$;

-- ══════════════════════════════════════════════════════════════════════════
-- Undo: run the block below in the SQL Editor with the leading "-- " removed
-- from every line. It removes everything this file created and restores
-- admin_audit_record() without the purge check. It leaves pg_cron enabled and
-- cannot bring back accounts already purged.
-- ══════════════════════════════════════════════════════════════════════════
-- ROLLBACK:
-- -- 1. Stop the hourly job (only where pg_cron is installed).
-- do $unschedule$
-- begin
--   if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
--     perform cron.unschedule(j.jobid) from cron.job j where j.jobname = 'purge-deleted-accounts';
--   end if;
-- end
-- $unschedule$;
--
-- -- 2. Restore admin_audit_record() exactly as 20260531_phase5_admin_audit_log.sql wrote it.
-- create or replace function public.admin_audit_record()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $audit_fn$
-- declare
--   v_rec       jsonb;
--   v_target_id text;
-- begin
--   -- Row of interest: NEW on INSERT/UPDATE, OLD on DELETE
--   if (tg_op = 'DELETE') then
--     v_rec := to_jsonb(old);
--   else
--     v_rec := to_jsonb(new);
--   end if;
--
--   -- Generic PK resolution: profiles/cert_entitlements key on `id`, subscriptions on `user_id`
--   v_target_id := coalesce(v_rec->>'id', v_rec->>'user_id');
--
--   insert into admin_audit_log (actor_id, action, target_table, target_op, target_id, old_data, new_data)
--   values (
--     auth.uid(),
--     tg_argv[0],
--     tg_table_name,
--     tg_op,
--     v_target_id,
--     case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
--     case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
--   );
--
--   -- AFTER trigger: return value is ignored, but must be a valid row
--   if (tg_op = 'DELETE') then
--     return old;
--   end if;
--   return new;
-- end;
-- $audit_fn$;
--
-- -- 3. Drop the trigger and the five functions.
-- drop trigger if exists on_signin_cancel_deletion on auth.users;
-- drop function if exists public.purge_deleted_accounts();
-- drop function if exists public.cancel_deletion_on_signin();
-- drop function if exists public.clear_deletion_notice();
-- drop function if exists public.request_account_deletion();
-- drop function if exists public.safe_timestamptz(text);
