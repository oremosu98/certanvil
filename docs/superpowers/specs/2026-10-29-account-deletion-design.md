---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-29
tags: [spec, architecture, mobile]
---
# Account deletion does what it promises (approved 29 Oct 2026)

Found during the Stage 5c device test ([[2026-10-28-ios-stage5c-apple-google-signin-design]]): Delete account only
stamps `profiles.metadata.deletion_requested_at` and signs out. Nothing clears the mark when the person signs back
in, the "Cancel deletion" button the /account dialog names does not exist, and nothing ever purges the account. The
app, /account and the privacy policy all promise both ("Sign back in within 7 days if you change your mind",
"Permanently deleted within 7 days"). Apple guideline 5.1.1(v) requires real account deletion in the app, so this
blocks the June iOS launch ([[2026-10-19-ios-launch-june-design]], stage 6).

## Decisions (founder, 29 Oct)

- **Signing in cancels the deletion.** Any sign-in (email code, Apple, Google; app or web) within the 7 days clears
  the mark, and the person sees one notice. No extra "keep or carry on" screen, no Cancel button.
- **After 7 days, everything tied to the person goes.** The account and every row that cascades from it; their user
  ID is blanked on error and bug reports (the reports stay, anonymous); their email is removed from the waitlist and
  launch-notify lists.
- **All of it runs inside the database** (approach A): a trigger cancels, a function purges, `pg_cron` runs it.
- **The privacy wording stays "within 7 days".** The purge runs hourly, so an account goes between 7 days and 7 days
  plus one hour after the request (accepted by the founder).
- **The audit log is anonymised, not deleted** (founder, after the spec review): each `admin_audit_log` entry about
  the person stays, with their ID, email and profile copies stripped; the purge itself writes no new entries.

## Database: one migration (`supabase/migrations/20261029_account_deletion.sql`)

### Marking: `public.request_account_deletion() RETURNS timestamptz`
- `SECURITY DEFINER`, `SET search_path = ''`; acts only on `auth.uid()`'s own profile; `EXECUTE` granted to
  `authenticated` only.
- One atomic update: `metadata = (metadata - 'deletion_cancelled_at') || jsonb_build_object('deletion_requested_at',
  now())`. The server's clock stamps the mark (the client clock no longer can move the purge or block the cancel),
  and no client read-modify-write can race cloud-store's flush. Returns the stamp.
- Both delete flows call it via `supabase.rpc('request_account_deletion')`.

### Clearing the notice: `public.clear_deletion_notice() RETURNS void`
- Same shape: `metadata = metadata - 'deletion_cancelled_at'` on `auth.uid()`'s profile; `authenticated` only.

### Cancel on sign-in: trigger on `auth.users`
- `public.cancel_deletion_on_signin()`, `SECURITY DEFINER`, `SET search_path = ''`, owned by `postgres`.
- Trigger `on_signin_cancel_deletion` `AFTER UPDATE OF last_sign_in_at ON auth.users FOR EACH ROW`.
- Fires only when `NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at` and the profile's
  `metadata->>'deletion_requested_at'` is set and earlier than `NEW.last_sign_in_at`. Then, in one update:
  `metadata = (metadata - 'deletion_requested_at') || jsonb_build_object('deletion_cancelled_at', now())`.
- GoTrue moves `last_sign_in_at` on every new session (OTP verify, `signInWithIdToken`, the OAuth code exchange),
  never on a token refresh. So a device that was signed in before the deletion does not cancel it by refreshing.
- Never raises: a failure inside it must not block a sign-in. The body is wrapped in an exception handler that
  `RAISE WARNING`s with `SQLERRM` (so it shows in the Postgres logs) and returns `NEW`.
- Every name in it is schema-qualified (GoTrue fires it as `supabase_auth_admin`), like the existing
  `handle_new_user`.

### Purge: `public.purge_deleted_accounts() RETURNS integer`
- `SECURITY DEFINER`, `SET search_path = ''`. `EXECUTE` revoked from `public`, `anon`, `authenticated` **and
  `service_role`** (Supabase's default privileges grant all three); only the owner `postgres` (so `pg_cron`, which
  runs jobs as the role that scheduled them, and the SQL Editor) can run it.
- Due accounts: profiles whose mark, read through `public.safe_timestamptz(text) RETURNS timestamptz` (a plpgsql
  helper that returns NULL instead of raising on a bad value), is `< now() - interval '7 days'`. A NULL (missing or
  unparseable) mark is never due.
- Each account is purged inside its own `BEGIN ... EXCEPTION` block, so one failure never rolls back the others: on
  error it `RAISE WARNING`s `purge_deleted_accounts: <id> <SQLERRM>` and moves on. An account that keeps failing is
  retried every hour and stays visible in the Postgres logs until fixed; it is never silently dropped.
- For each account, in order (`<emails>` = `auth.users.email` and `profiles.email`, lower-cased, deduplicated):
  1. `set_config('certanvil.purging', 'on', true)` so `public.admin_audit_record()` writes no new entries for the
     cascade below (the function gains a first-line check that returns early when the flag is on).
  2. Anonymise `public.admin_audit_log` rows where `actor_id = <id>` or `target_id = <id>::text`: set those columns
     to NULL and `old_data` / `new_data` to NULL; `action`, `target_table`, `target_op` and the timestamp stay.
  3. `update public.client_errors set user_id = null where user_id = <id>`; same for `public.user_bug_reports`.
  4. Delete rows matching `<emails>` from `public.waitlist`, `public.notify_signups` and `public.diagnostic_pending`.
  5. `delete from auth.users where id = <id>`: cascades to `profiles`, `quiz_history`, `cert_entitlements`,
     `subscriptions`, `ai_usage`, `web_vitals` (all `ON DELETE CASCADE`).
- Returns the number of accounts purged.

### Schedule
- Guarded by a `DO` block: only when `pg_cron` is in `pg_available_extensions`, it runs
  `create extension if not exists pg_cron with schema pg_catalog` and
  `cron.schedule('purge-deleted-accounts', '17 * * * *', 'select public.purge_deleted_accounts()')` (hourly, off the
  hour). Without pg_cron (the PGlite test harness) the block does nothing, so the real migration file runs unchanged
  in tests. On Supabase the founder may need to switch it on first under Database → Extensions.

### Rollback (tested, per the gated-lane rule)
`-- ROLLBACK:` block: `cron.unschedule('purge-deleted-accounts')` (guarded the same way); drop the trigger; drop
`purge_deleted_accounts`, `cancel_deletion_on_signin`, `request_account_deletion`, `clear_deletion_notice` and
`safe_timestamptz`; restore `admin_audit_record()` without the purge check. It leaves `pg_cron` enabled and cannot
restore purged accounts.

## App and website

- **The notice.** When a signed-in page loads a profile carrying `metadata.deletion_cancelled_at`, it shows one
  toast, "Welcome back. We've cancelled the deletion and your account is safe." (the plan's Copy table), then calls `supabase.rpc('clear_deletion_notice')`.
  Whichever surface loads first shows it and clears it, so it shows once.
  - App (phone web and iOS): a feature file listens for `SIGNED_IN` / `INITIAL_SESSION` on
    `window.certanvilSupabase` and reads the profile. `auth-state.js`, `cloud-store.js`, `lib/supabase.js` and
    `sw.js` stay untouched.
  - certanvil.com: `landing/auth.js` already reads `profiles.metadata` on sign-in; it shows the landing toast.
- **The app's delete** (`features/home.js` `_confirmDeleteAccount`): the Apple step (5c) stays first; the
  metadata read-and-write is replaced by `rpc('request_account_deletion')`; then `signOut({ scope: 'global' })`.
- **The website's delete** (`landing/lib/account.js` `wireDeleteAccount`) today stamps the mark from a page-load copy
  of the profile and leaves the person signed in. It becomes: confirm → `rpc('request_account_deletion')` →
  `signOut({ scope: 'global' })` → back to certanvil.com with a toast, "Your account will be deleted in 7 days. Sign
  back in before then to keep it." Global sign-out means no other device keeps using an account that is about to go.
- **Copy.** The /account confirm dialog's "You can cancel during the grace window by signing in and clicking
  'Cancel deletion' below this button." becomes "Changed your mind? Sign back in within 7 days and your account
  stays." The app's screens already describe the new behaviour.
- **Privacy policy** (`landing/privacy.html` §06, Self-delete): it says self-delete "cancels your subscription with
  Stripe" and "clears your browser cache"; neither is true (no billing is built). It becomes: from the app's
  Settings or certanvil.com/account; signing back in within 7 days cancels it; after 7 days the account and
  everything linked to it (profile, quiz history, subscription records, telemetry) is erased, error and bug reports
  lose their link to you, and your email leaves our waiting lists. Legal pages move to v1.2.
- **Visual pass.** No new layout, motion or component: two lines of copy in existing components. Stages 4
  (humanizer) and 5 (marketing-psychology) run on the copy; stages 1–3 are skipped, said explicitly in the plan.

## Cross-platform

| Target | Cancel + purge | Notice | Sign out everywhere |
|---|---|---|---|
| Desktop web | server-side, identical | app toast / landing toast | yes |
| Safari / WebKit | server-side, identical | same code path | yes |
| Phone web | server-side, identical | same code path | yes |
| iOS app | server-side, identical | same code path (WKWebView) | yes |

The only platform difference is Apple's revoke, which runs only on an iPhone delete (5c). A delete on the website
cannot ask Apple; Apple's rule covers the app.

## Testing

- **Database, in UAT on every commit:** PGlite (`@electric-sql/pglite`, dev dependency) runs, in order:
  1. a stand-in prelude: roles `anon`, `authenticated`, `service_role`, `supabase_auth_admin`; schema `auth` with
     `auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', last_sign_in_at
     timestamptz, created_at timestamptz default now())` and `auth.uid()` returning a settable
     `current_setting('test.uid')::uuid`;
  2. the real `supabase/schema.sql`;
  3. the real migrations that create the tables the purge touches, in filename order:
     `20260506_phase_c_prime.sql` (`is_admin()`), `20260509_phase_e_subscriptions.sql`,
     `20260511_diagnostic_pending.sql`, `20260511_web_vitals.sql`, `20260509_notify_signups.sql`,
     `20260531_phase5_admin_audit_log.sql`, `20260718_client_errors.sql`, `20260718_user_bug_reports.sql`
     (the plan confirms each loads in PGlite and lists any statement it must stub, e.g. an unavailable extension);
  4. the real `20261029_account_deletion.sql`, unchanged.

  Cases:
  - sign-in after the mark clears it and sets `deletion_cancelled_at`
  - an update that leaves `last_sign_in_at` alone (a refresh) changes nothing
  - a sign-in from before the mark changes nothing
  - `request_account_deletion` stamps the server time, only on the caller's profile, and keeps other metadata keys
  - the purge removes an 8-day mark's user and their cascaded rows; blanks their report user IDs; deletes their
    waitlist, notify and diagnostic rows by either email; anonymises their audit rows and adds none; leaves a 6-day
    mark, an unmarked account and everyone else's rows alone
  - an unparseable mark is skipped, and a failing account does not stop the next one from being purged
  - `authenticated` and `service_role` cannot execute the purge
  - the rollback removes everything it created and restores `admin_audit_record()`
- **App and website, Playwright:** the notice shows once and calls `clear_deletion_notice` (app chromium +
  mobile-safari, landing project); both deletes call `request_account_deletion` then `signOut({ scope: 'global' })`;
  the website's delete leaves you signed out on certanvil.com with its toast; the /account dialog carries the new
  line. The fake Supabase fixture gains `rpc()` and the `scope` argument.
- **Live check after the migration (founder + me):** a throwaway account marked, back-dated 8 days by SQL, purged by
  running the function once from the SQL Editor (as `postgres`, the role pg_cron uses): gone. This is what proves
  `postgres` may still delete from `auth.users` on this project. A second throwaway marked and signed back in: mark
  cleared, notice shown. `cron.job_run_details` shows the hourly job succeeding.

## Rollout (gated lane)

1. PR with the migration, tests and client changes; CI green.
2. Founder switches on `pg_cron` and runs the migration in the SQL Editor.
3. The live check above.
4. Founder's "ship it": squash-merge; the app and landing deploy.

## Must-do later

- **Billing:** once Stripe or RevenueCat is live, the purge must cancel the person's subscription before deleting
  them, the deletion flow must say what happens to a paid plan, and the privacy policy's Self-delete line gains the
  billing step back.

## Rejected approaches

- **Ask on sign-in ("keep or carry on?")**: an extra screen on both surfaces for a rare case; signing in is already
  a clear signal.
- **Cancel button only (/account)**: iPhone users would have to go to the website to keep their account.
- **Daily Vercel cron endpoint with the service-role key (approach B)**: a new endpoint holding the strongest key
  plus a cron secret, for work the database can do itself.
- **Client-side cancel + GitHub Actions purge (approach C)**: cancel code in three places including the gated
  sign-in files, and the repo rule keeps the service-role key out of workflows.
- **Deleting the audit entries / keeping them untouched**: deleting loses the record that anything changed; keeping
  them leaves the person's ID and profile copies behind, against "everything tied to them goes".
- **Changing the policy to "7 days, then removed within a day"**: the founder kept "within 7 days"; an hourly
  purge keeps the gap under an hour instead.

## Related
[[2026-10-28-ios-stage5c-apple-google-signin-design]] · [[2026-10-19-ios-launch-june-design]] · [[ENVIRONMENT_STRATEGY]] · [[Mobile MOC]]
