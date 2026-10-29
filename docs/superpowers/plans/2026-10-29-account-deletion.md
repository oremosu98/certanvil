# Account Deletion That Does What It Promises: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signing back in within 7 days cancels a deletion, and after 7 days an hourly database job erases the account and everything tied to it, on the app and the website.

**Architecture:** One Supabase migration holds all the logic: a trigger on `auth.users` cancels on sign-in, two caller-scoped RPCs stamp and clear marks with the server clock, and `purge_deleted_accounts()` runs hourly under `pg_cron`. The app (`features/home.js`) and the website (`landing/lib/account.js`, `landing/auth.js`) call the RPCs, sign out everywhere, and show one notice. Database logic is tested in UAT against the real migration file in PGlite.

**Tech Stack:** Postgres / plpgsql (Supabase, pg_cron), `@electric-sql/pglite` (dev dependency), vanilla JS, Playwright, the UAT runner.

**Spec:** `docs/superpowers/specs/2026-10-29-account-deletion-design.md`

## Global Constraints

- Gated lane: branch `feat/account-deletion` → PR → founder's "ship it" → squash-merge. Untouched: `auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`.
- Migration file `supabase/migrations/20261029_account_deletion.sql`, with a header and a `-- ROLLBACK:` block (UAT's rollback guard requires the marker).
- Every function `SECURITY DEFINER`, `SET search_path = ''`, every name schema-qualified.
- Purge: due when the mark (via `public.safe_timestamptz`) is `< now() - interval '7 days'`; hourly cron `'17 * * * *'`, job name `purge-deleted-accounts`.
- `EXECUTE` on `purge_deleted_accounts` revoked from `public`, `anon`, `authenticated`, `service_role`; the two RPCs granted to `authenticated` only.
- Metadata keys exactly: `deletion_requested_at`, `deletion_cancelled_at`. Session flag exactly: `certanvil.purging`.
- Copy is the final strings in the Copy table (Task 1). Straight apostrophes in JS strings, `&rsquo;` only where the surrounding HTML already uses entities.
- Never write user-state localStorage on prod or `*.vercel.app`; the live check uses throwaway accounts only.
- Cross-platform: the notice and both deletes are verified on chromium and mobile-safari (app), and the landing Playwright project.

## Review Focus

- **A person who deletes, then immediately signs in again on the same device** expects the deletion cancelled. Pinned in Task 2 ("sign-in one second after the mark cancels it").
- **Someone else's rows that share nothing but a similar email** (case differs) must survive while the person's go. Pinned in Task 3 (`Simi@X.com` vs `simi@x.com` and an unrelated `other@x.com`).
- **A second purge run** must not touch already anonymised audit rows or error. Pinned in Task 3 ("a second run purges 0 and changes nothing").
- **Signing in when the profile row is missing** (trigger finds no profile) must still sign in. Pinned in Task 2.
- **The notice on two surfaces at once** (app tab and certanvil.com tab) may show twice at worst, never loop. Pinned in Task 4/5 (clear RPC called exactly once per surface, flag absent → no toast).

## Copy

| Where | String |
|---|---|
| Notice, app and website | Welcome back. We've cancelled the deletion and your account is safe. |
| Website, after deleting | Your account will be deleted in 7 days. Sign back in before then to keep it. |
| /account confirm dialog (replaces the "Cancel deletion" line) | Changed your mind? Sign back in within 7 days and your account stays. |
| Privacy §06 Self-delete | **Self-delete**: from the app's Settings or certanvil.com/account. Signing back in within 7 days cancels it. After 7 days we erase your account and everything linked to it (profile, quiz history, subscription records and telemetry), remove your link from any error or bug reports you sent, and take your email off our waiting lists. |

Copy pass (29 Oct): changed the notice from "Your account won't be deleted" to "We've cancelled the deletion and your account is safe", because the old line implied the cancellation without saying it and gave no reassurance; the other three strings are unchanged.

---

### Task 1: Copy pass

**Files:**
- Modify: this plan's Copy table (only if the pass changes a string)

- [ ] **Step 1:** Run the `humanizer` skill on the four strings (Simi voice profile, artefact rules for the privacy line), then `marketing-psychology` on the two notices (reassurance, loss framing). Stages 1–3 of the visual pass are skipped: no new layout, motion or component.
- [ ] **Step 2:** Update the Copy table with the final strings and note any change in one line under it. Later tasks pin the table's strings verbatim.
- [ ] **Step 3: Commit** `git commit -m "docs(deletion): copy pass for the deletion notices and privacy line"`

### Task 2: PGlite harness, marking RPCs and the cancel trigger

**Files:**
- Create: `tests/deletion-db.test.mjs` (ESM, async; run with `node --experimental-detect-module`)
- Create: `tests/uat/512-account-deletion.js` (spawns the test like `510-ios-social.js` spawns `apple-revoke.test.mjs`)
- Create: `supabase/migrations/20261029_account_deletion.sql` (this task: header, `safe_timestamptz`, both RPCs, the trigger, their rollback lines)
- Modify: `package.json` (devDependency `@electric-sql/pglite`, exact version pinned)

**Interfaces:**
- Produces:
  - `public.safe_timestamptz(text) RETURNS timestamptz` (NULL on bad input)
  - `public.request_account_deletion() RETURNS timestamptz`
  - `public.clear_deletion_notice() RETURNS void`
  - `public.cancel_deletion_on_signin()` trigger function, trigger `on_signin_cancel_deletion`
  - Harness helper `async function bootDb() → PGlite` and `async function asUser(db, uid, sql, params)` (sets `test.uid`, `SET ROLE authenticated`, runs, `RESET ROLE`)

- [ ] **Step 1: Write the harness and failing tests.** `bootDb()` runs, in order: the prelude (roles `anon`, `authenticated`, `service_role`, `supabase_auth_admin`; schema `auth`; `auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', last_sign_in_at timestamptz, created_at timestamptz default now())`; `auth.uid()` returning `nullif(current_setting('test.uid', true), '')::uuid`); `supabase/schema.sql`; the migrations `20260506_phase_c_prime.sql`, `20260509_phase_e_subscriptions.sql`, `20260509_notify_signups.sql`, `20260511_diagnostic_pending.sql`, `20260511_web_vitals.sql`, `20260531_phase5_admin_audit_log.sql`, `20260718_client_errors.sql`, `20260718_user_bug_reports.sql`; then `20261029_account_deletion.sql`. Any statement PGlite cannot run (an extension it lacks) is stubbed in the prelude, never edited out of the files; list each stub in a comment at the top of the test. Users are created by inserting into `auth.users` (the real `handle_new_user` makes the profile). Tests:
  ```js
  await t('request_account_deletion stamps the server time on the caller only, keeping other keys', ...)
    // profile A metadata {keep:1}; asUser(A) select request_account_deletion();
    // A.metadata.keep === 1, A.deletion_requested_at within 5s of now(); B unchanged
  await t('sign-in after the mark cancels it and sets deletion_cancelled_at', ...)
    // mark A; update auth.users set last_sign_in_at = now() + interval '1 second' where id = A
    // A.metadata has no deletion_requested_at, has deletion_cancelled_at
  await t('an update that leaves last_sign_in_at alone changes nothing', ...)   // update email only
  await t('a sign-in time from before the mark changes nothing', ...)           // last_sign_in_at = mark - 1 hour
  await t('signing in with no profile row still succeeds', ...)                 // delete A's profile; the update returns 1 row, no error
  await t('clear_deletion_notice removes only the notice key, only for the caller', ...)
  await t('anon cannot call either RPC', ...)                                    // SET ROLE anon → permission error
  ```
- [ ] **Step 2: Run, watch it fail**: `node --experimental-detect-module tests/deletion-db.test.mjs`. Expected: FAIL (`function public.request_account_deletion() does not exist`), and the harness itself loads every listed file.
- [ ] **Step 3: Write the migration's first half** per the spec's Marking, Clearing and Cancel sections. The trigger function's whole body sits in `BEGIN … EXCEPTION WHEN OTHERS THEN RAISE WARNING 'cancel_deletion_on_signin: %', SQLERRM; RETURN NEW; END`.
- [ ] **Step 4: Pass**: same command, all cases ok. Add `tests/uat/512-account-deletion.js` with the test `'account deletion database suite passes (N/N)'` (same spawn pattern as 510), then `TZ=UTC node tests/uat.js` passes.
- [ ] **Step 5: Commit** `git commit -m "feat(deletion): cancel on sign-in and server-stamped marks (PGlite-tested)"`

### Task 3: The purge, the audit flag and the schedule

**Files:**
- Modify: `supabase/migrations/20261029_account_deletion.sql` (purge, `admin_audit_record()` replacement, guarded schedule, full rollback)
- Modify: `tests/deletion-db.test.mjs`

**Interfaces:**
- Consumes: Task 2's `safe_timestamptz`, `bootDb`, `asUser`
- Produces: `public.purge_deleted_accounts() RETURNS integer`; `admin_audit_record()` returning early when `current_setting('certanvil.purging', true) = 'on'`

- [ ] **Step 1: Failing tests.** Seed: user A (mark 8 days ago, email `Simi@X.com`; quiz_history, cert_entitlements, subscriptions, ai_usage, web_vitals rows; client_errors and user_bug_reports rows with A's id; waitlist/notify_signups/diagnostic_pending rows for `simi@x.com`; admin_audit_log rows with actor_id and target_id = A); user B (mark 6 days ago); user C (no mark, email `other@x.com`, its own rows of each kind); user D (mark `'not a date'`).
  ```js
  await t('the purge removes A and every cascaded row, and returns 1', ...)      // auth.users, profiles, quiz_history, … for A: 0 rows
  await t('A\'s error and bug reports stay with user_id null', ...)
  await t('A\'s waitlist, notify and diagnostic rows go by either email, case-insensitively', ...)
  await t('A\'s audit rows stay with actor_id, target_id, old_data, new_data null; no new audit rows appear', ...)
  await t('B (6 days), C (unmarked) and D (unparseable) and all their rows are untouched', ...)
  await t('a failing account does not stop the next one', ...)
    // a trigger on profiles that raises for one id; two due users; return 1, the other is gone
  await t('a second run purges 0 and changes nothing', ...)
  await t('authenticated and service_role cannot execute the purge', ...)
  await t('the rollback removes the trigger, the five functions and restores admin_audit_record', ...)
    // run the ROLLBACK block's statements (extracted from the file after the "-- ROLLBACK:" marker, comment prefix stripped)
    // then a subscriptions insert still writes an audit row
  ```
- [ ] **Step 2: Fail**: same command; the purge cases fail with `function public.purge_deleted_accounts() does not exist`.
- [ ] **Step 3: Write the second half** per the spec's Purge, Schedule and Rollback sections. The per-account loop is `FOR r IN SELECT … LOOP BEGIN … EXCEPTION WHEN OTHERS THEN RAISE WARNING 'purge_deleted_accounts: % %', r.id, SQLERRM; END; END LOOP`. The `admin_audit_record()` replacement is the existing body from `20260531_phase5_admin_audit_log.sql` plus the early return; the rollback restores the original body verbatim.
- [ ] **Step 4: Pass**: the suite and `TZ=UTC node tests/uat.js` (including the rollback-marker guard).
- [ ] **Step 5: Commit** `git commit -m "feat(deletion): hourly purge of accounts past their 7 days (audit anonymised)"`

### Task 4: The app: delete via the RPC, sign out everywhere, the notice

**Files:**
- Modify: `features/home.js` (`_confirmDeleteAccount`; a new `_deletionNotice()` wired once on `window.certanvilSupabase.onAuthStateChange` for `SIGNED_IN` / `INITIAL_SESSION`)
- Modify: `tests/fixtures/fake-supabase.js` (`rpc` records `__rpcCalls` with names; `request_account_deletion` sets the fake profile's `metadata.deletion_requested_at`; `clear_deletion_notice` removes `deletion_cancelled_at`; `signOut(opts)` logs `'auth:signOut:' + ((opts && opts.scope) || 'local')`; `F.deletionCancelled: true` seeds `metadata.deletion_cancelled_at`)
- Modify: `tests/e2e/lift-5c.spec.js` (new describe "Account deletion: app")

**Interfaces:**
- Consumes: the RPC names from Task 2
- Produces: `_deletionNotice()` (no args; reads `profiles.metadata`, toasts the Copy-table notice via `window.showToast`, calls `rpc('clear_deletion_notice')`; at most once per page load)

- [ ] **Step 1: Failing Playwright tests** (chromium + mobile-safari):
  ```js
  test('deleting calls request_account_deletion, then signs out everywhere', ...)
    // log contains 'rpc:request_account_deletion' before 'auth:signOut:global'; no profiles update carrying deletion_requested_at
  test('an Apple account still asks Apple first, then requests deletion', ...)   // socialCalls ['apple'] before the rpc
  test('a cancelled deletion shows the notice once and clears it', ...)
    // fake deletionCancelled; toast text is the Copy-table notice; __rpcCalls has clear_deletion_notice once; reload → no toast
  test('no flag, no notice', ...)
  ```
- [ ] **Step 2: Fail**: `npx playwright test -c <private config> tests/e2e/lift-5c.spec.js -g "Account deletion: app" --project=chromium --project=mobile-safari --retries=0`.
- [ ] **Step 3: Implement.** In `_confirmDeleteAccount`, the chain after the Apple step becomes `sb.rpc('request_account_deletion')` → on error throw → `sb.auth.signOut({ scope: 'global' })`; the success and error cards stay as they are. `_deletionNotice` reads with `.select('metadata').eq('id', uid).maybeSingle()`.
- [ ] **Step 4: Pass**: the same command, then all of `lift-5c.spec.js` and `lift-5b.spec.js` on both projects.
- [ ] **Step 5: Commit** `git commit -m "feat(deletion): app deletes via the server and signs out everywhere; welcome-back notice"`

### Task 5: The website: delete, sign out, notices, dialog copy, privacy v1.2

**Files:**
- Modify: `landing/lib/account.js` (`wireDeleteAccount`: Copy-table dialog line; `rpc('request_account_deletion')` → `signOut({ scope: 'global' })` → `location.href = '/?deleted=1'`)
- Modify: `landing/auth.js` (`noticeToast(msg)` using `#toast-stack` with the `.toast toast-info` markup `account.js` uses; in `renderSignedIn`'s `fetchProfileRole` callback, the notice + `rpc('clear_deletion_notice')` when `metadata.deletion_cancelled_at` is set; on load, `?deleted=1` → the after-deleting toast, then `history.replaceState` drops the param)
- Modify: `landing/index.html`, `landing/pricing.html` (add `<div class="toast-stack" id="toast-stack" aria-live="polite" aria-atomic="true"></div>`, as in `account.html`)
- Modify: `landing/privacy.html` (§06 Self-delete paragraph from the Copy table; header "v1.2" and today's date; history list gains `v1.2` (29 October 2026): "self-delete now erases your account 7 days after you ask, and signing back in before then cancels it.")
- Modify: `tests/uat/509-ios-signin.js` (the legal-pages test accepts v1.2 in privacy, v1.1 still in terms)
- Create: `tests/e2e/landing-deletion.spec.js` (landing project; the fake Supabase routed as in `landing-code-signin.spec.js`)

**Interfaces:**
- Consumes: the RPC names from Task 2; the fixture changes from Task 4

- [ ] **Step 1: Failing tests:**
  ```js
  test('/account delete: the dialog shows the new line, then rpc, global sign-out, back home with the toast', ...)
    // page.on('dialog') captures the message: contains the Copy-table dialog line, not 'Cancel deletion'
    // log order rpc:request_account_deletion → auth:signOut:global; URL ends '/'; toast is the after-deleting string; no '?deleted' left
  test('certanvil.com sign-in with a cancelled deletion shows the notice once and clears it', ...)
  test('privacy.html is v1.2 and no longer says Stripe or browser cache in Self-delete', ...)  // UAT check in 512
  ```
- [ ] **Step 2: Fail**: `npx playwright test -c <private config> tests/e2e/landing-deletion.spec.js --project=landing --retries=0`; UAT 512's privacy check fails.
- [ ] **Step 3: Implement** as in Files. `landing/dg-system.css` already styles `.toast-stack .toast`; no CSS change, so no `?v=` bump.
- [ ] **Step 4: Pass**: the landing spec, `landing-code-signin.spec.js`, and UAT.
- [ ] **Step 5: Commit** `git commit -m "feat(deletion): website deletes via the server, signs out, and tells you; privacy v1.2"`

### Task 6: Founder setup, live check, ship

**Files:**
- Modify: `CHANGELOG.md`, the version surfaces via `scripts/bump-version.js` (next minor: v8.198.0, or the next free number at ship time)

- [ ] **Step 1:** Full suite: `TZ=UTC node tests/uat.js`, `node tests/tech-debt.js`, the lift-5b / lift-5c / landing projects on the private Playwright config. Push and open the PR (bind it); CI green.
- [ ] **Step 2 (founder):** Before running anything, two preflight checks in the SQL Editor:
  - **Who is marked today.** `select p.id, p.email, p.metadata->>'deletion_requested_at' as mark, u.last_sign_in_at from public.profiles p join auth.users u on u.id = p.id where p.metadata ? 'deletion_requested_at';` The old flow (since v7.45.0) left these marks behind. The migration gives every mark from before 29 Oct a fresh 7 days, then the hourly purge deletes them. Strip the mark of anyone who should stay: `update public.profiles set metadata = metadata - 'deletion_requested_at' where id = '<id>';`
  - **`admin_audit_record` is still the 20260531 version.** `select pg_get_functiondef('public.admin_audit_record'::regprocedure);` and diff the body against `supabase/migrations/20260531_phase5_admin_audit_log.sql`. If prod was hand-edited, stop: the migration would overwrite that edit.

  Then Supabase → Database → Extensions → `pg_cron` on; SQL Editor → paste `supabase/migrations/20261029_account_deletion.sql` → Run. Confirm with `select jobname, schedule from cron.job;` (one row, `purge-deleted-accounts`, `17 * * * *`).
- [ ] **Step 3 (founder + me, live check, throwaway accounts only):**
  - Account T1 (a fresh test email): sign up on certanvil.com, delete it at /account, then `update public.profiles set metadata = jsonb_set(metadata, '{deletion_requested_at}', to_jsonb((now() - interval '8 days')::text)) where email = '<T1>';`. Then rerun the "who is marked" query from Step 2 with `and public.safe_timestamptz(p.metadata->>'deletion_requested_at') < now() - interval '7 days'` added: only once it shows T1 as the sole due account, run `select public.purge_deleted_accounts();` → returns 1; T1 gone from Authentication → Users. (If anyone else shows up, the purge would delete them too: stop and sort them out first.)
  - Account T2: sign up, delete, sign back in → the notice shows once; `select metadata ? 'deletion_requested_at' from public.profiles where email = '<T2>';` → false.
  - After the next :17, `select status from cron.job_run_details order by start_time desc limit 1;` → `succeeded`.
- [ ] **Step 4:** Founder's "ship it" → the ship skill (bump, CHANGELOG with `ACTION REQUIRED: enable pg_cron and run supabase/migrations/20261029_account_deletion.sql` if not already run, squash-merge, watch deploys, curl both sites). Mindmatrix: tick only milestones whose done-test was actually observed.
