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
- **The privacy wording stays "within 7 days".** The purge runs hourly so an account goes within the hour after its
  7 days end.

## Database: one migration (`supabase/migrations/20261029_account_deletion.sql`)

### Cancel on sign-in: trigger on `auth.users`
- `public.cancel_deletion_on_signin()`, `SECURITY DEFINER`, `SET search_path = ''`, owned by `postgres`.
- Trigger `on_signin_cancel_deletion` `AFTER UPDATE OF last_sign_in_at ON auth.users FOR EACH ROW`.
- Fires only when `NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at` and the profile's
  `metadata->>'deletion_requested_at'` is set and earlier than `NEW.last_sign_in_at`. Then, in one update:
  `metadata = (metadata - 'deletion_requested_at') || jsonb_build_object('deletion_cancelled_at', now())`.
- GoTrue moves `last_sign_in_at` on every new session (OTP verify, `signInWithIdToken`, the OAuth code exchange),
  never on a token refresh. So a device that was signed in before the deletion does not cancel it by refreshing.
- Never raises: a failure inside it must not block a sign-in (the body is wrapped in an exception handler that
  returns `NEW`).

### Purge: `public.purge_deleted_accounts() RETURNS integer`
- `SECURITY DEFINER`, `SET search_path = ''`. `EXECUTE` revoked from `public`, `anon`, `authenticated`; only the
  owner (and so `pg_cron` and the SQL Editor) can run it.
- Selects profiles whose `(metadata->>'deletion_requested_at')::timestamptz < now() - interval '7 days'`; for each,
  in order:
  1. `update public.client_errors set user_id = null where user_id = <id>`
  2. `update public.user_bug_reports set user_id = null where user_id = <id>`
  3. `delete from public.waitlist where lower(email) = lower(<email>)`, same for `public.notify_signups`
  4. `delete from auth.users where id = <id>`: cascades to `profiles`, `quiz_history`, `cert_entitlements`,
     `subscriptions`, `ai_usage`, `web_vitals` (all `ON DELETE CASCADE`).
- A mark that does not parse as a timestamp is skipped, never purged.
- Returns the number of accounts purged.

### Schedule
- `create extension if not exists pg_cron` (the founder may need to switch it on first under Database → Extensions).
- `cron.schedule('purge-deleted-accounts', '17 * * * *', 'select public.purge_deleted_accounts()')`: hourly, off
  the hour.

### Rollback (tested, per the gated-lane rule)
`-- ROLLBACK:` block: `cron.unschedule('purge-deleted-accounts')`; drop the trigger; drop both functions. It leaves
`pg_cron` enabled and cannot restore purged accounts.

## App and website

- **The notice.** When a signed-in page loads a profile carrying `metadata.deletion_cancelled_at`, it shows one
  toast, "Welcome back. Your account won't be deleted.", then removes the key (`metadata - 'deletion_cancelled_at'`
  via a profile update the user's own RLS allows). Whichever surface loads first shows it, so it shows once.
  - App (phone web and iOS): a feature file listens for `SIGNED_IN` / `INITIAL_SESSION` on
    `window.certanvilSupabase` and reads the profile. `auth-state.js`, `cloud-store.js`, `lib/supabase.js` and
    `sw.js` stay untouched.
  - certanvil.com: `landing/auth.js` already reads `profiles.metadata` on sign-in; it shows the landing toast.
- **Delete signs out everywhere.** `features/home.js` `_confirmDeleteAccount` calls `signOut({ scope: 'global' })`
  (the website's delete flow is checked to do the same), so another signed-in device does not keep using an
  account that is about to go.
- **Copy.** The /account confirm dialog's "You can cancel during the grace window by signing in and clicking
  'Cancel deletion' below this button." becomes "Changed your mind? Sign back in within 7 days and your account
  stays." The app's screens and the privacy policy already describe the new behaviour and stay as they are.
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

- **Database, in UAT on every commit:** the real migration file runs in PGlite (`@electric-sql/pglite`, dev
  dependency) over a small stand-in `auth` schema (`auth.users` with `id`, `email`, `last_sign_in_at`) and a stub
  `cron.schedule` / `cron.unschedule`. Cases:
  - sign-in after the mark clears it and sets `deletion_cancelled_at`
  - an update that leaves `last_sign_in_at` alone (a refresh) changes nothing
  - a sign-in from before the mark changes nothing
  - the purge removes an 8-day mark's user and their cascaded rows, blanks their report user IDs and deletes their
    list emails; it leaves a 6-day mark, an unmarked account and someone else's reports and list rows alone
  - an unparseable mark is skipped
  - `authenticated` cannot execute the purge
  - the rollback removes the trigger, both functions and the schedule
- **App and website, Playwright:** the notice shows once and clears the flag (app chromium + mobile-safari, landing
  project); delete signs out with `scope: 'global'`; the /account dialog carries the new line.
- **Live check after the migration (founder + me):** a throwaway account marked, back-dated 8 days by SQL, purged by
  running the function once: gone. A second throwaway marked and signed back in: mark cleared, notice shown.

## Rollout (gated lane)

1. PR with the migration, tests and client changes; CI green.
2. Founder switches on `pg_cron` and runs the migration in the SQL Editor.
3. The live check above.
4. Founder's "ship it": squash-merge; the app and landing deploy.

## Must-do later

- **Billing:** once Stripe or RevenueCat is live, the purge must cancel the person's subscription before deleting
  them (and the deletion flow should say what happens to a paid plan).

## Rejected approaches

- **Ask on sign-in ("keep or carry on?")**: an extra screen on both surfaces for a rare case; signing in is already
  a clear signal.
- **Cancel button only (/account)**: iPhone users would have to go to the website to keep their account.
- **Daily Vercel cron endpoint with the service-role key (approach B)**: a new endpoint holding the strongest key
  plus a cron secret, for work the database can do itself.
- **Client-side cancel + GitHub Actions purge (approach C)**: cancel code in three places including the gated
  sign-in files, and the repo rule keeps the service-role key out of workflows.
- **Changing the policy to "7 days, then removed within a day"**: the founder kept "within 7 days"; an hourly
  purge keeps it honest instead.

## Related
[[2026-10-28-ios-stage5c-apple-google-signin-design]] · [[2026-10-19-ios-launch-june-design]] · [[ENVIRONMENT_STRATEGY]] · [[Mobile MOC]]
