# Admin in the App + Bug-Report Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phones can report a problem; the admin account gets an Admin screen in the app (today's numbers, cert requests, bug reports with fix-and-tell, top errors, long-list screens, Preview as Free); the reporter is emailed when their problem is fixed; and the open-report overwrite hole is closed.

**Architecture:** One gated-lane migration replaces the client UPDATE on `user_bug_reports` with a `submit_bug_report` RPC and adds `fixed_notified_at`. Phone UI is three vanilla IIFE modules in the existing `features/ios-*.js` style (report sheet, admin screen, Free preview), backed by one data module that reads Supabase with the admin's own token (RLS already allows it). Two small endpoints do the privileged parts: landing `api/admin/bug-report` (close / fix-and-email, service role) and app `api/ai/usage` (today's AI count and limit).

**Tech Stack:** Vanilla JS IIFEs, Supabase (Postgres RLS, PostgREST, RPC), Vercel Edge functions, Resend, PGlite tests, node UAT (`tests/uat/*.js`), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-31-admin-in-app-design.md` (approved 31 Oct). Drawings (the build is a faithful lift): `.claude/worktrees/june-e2e/mockups/cert-ios-admin.html`, `cert-ios-report.html`, `cert-ios-hub.html?v=admin`, `cert-ios-settings.html` (Help row); HUD "Admin ›".

## Global Constraints

- Gated lane: branch `feat/admin-in-app` from `origin/main`, PR, preview, migration tested in PGlite with its ROLLBACK, squash-merge on the founder's "ship it".
- Migration file `supabase/migrations/20261031_bug_reports_loop.sql`, idempotent, with a tested `-- ROLLBACK:` block and rows in `scripts/sql/migration-audit.sql`.
- `app.js` net 0 lines (ratchet cap 8334, current 8333). New logic goes in `features/*.js`.
- Phone surfaces only (iOS app + mobile web ≤899px); desktop keeps its drawer and the web dashboard link.
- Motion: BRAND §6 (`cubic-bezier(0.16,1,0.3,1)`, transform + opacity only, reduced motion = fade). Sheets use the drawer curve already in `lift-ios.css`. Reveal motion on first paint only.
- Touch targets ≥ 44pt; no hover without `@media (hover:hover) and (pointer:fine)`; safe-area insets.
- Copy is exactly the drawing's. No em dashes. The app never names the founder; the user's own first name only via the hub greeting rule.
- `lift-ios.css?v=` re-stamped with `node scripts/stamp-css-versions.js` after CSS edits.
- Email copy (spec §3): subject `Fixed: {title}` (title cut to 50 characters with "…"), body "You reported '{title}'. It's fixed. Open CertAnvil and you'll have it. Thanks for telling us." signed "CertAnvil", no upsell.
- "Open" reports means status `open` or `triaged` everywhere.

## Review Focus

1. A queued report sent after a different person signs in must never carry the new person's id (owner: Task 1 RPC test + Task 2 test).
2. Two taps on "Fixed, tell them" (or a retried call) must send one email per reporter, never two (Task 4 test).
3. A report title containing HTML or a quote must render as text in the admin sheet, the email and the digest (Tasks 4, 6, 8 tests).
4. Preview as Free must never leave the account looking Free after switching back or signing out (Task 7 test).
5. An Admin section that fails (RLS error, offline mid-load) must not blank the others (Task 6 test).

---

### Task 1: Migration: close the overwrite hole, submit RPC, notified stamp

**Files:**
- Create: `supabase/migrations/20261031_bug_reports_loop.sql`
- Create: `tests/bug-reports-db.test.mjs` (PGlite, same harness shape as `tests/cert-requests-db.test.mjs`)
- Create: `tests/uat/532-bug-reports-loop.js` (spawns the PGlite test, like `tests/uat/512-account-deletion.js`)
- Modify: `scripts/sql/migration-audit.sql` (rows below)

**Interfaces:**
- Produces: `public.submit_bug_report(p_report_id text, p_title text, p_description text, p_steps text, p_body text, p_context jsonb, p_user_id uuid) returns bigint` (SECURITY DEFINER, `search_path = ''`, EXECUTE to anon + authenticated only). Inserts; on an existing `report_id` does nothing and returns the existing row's id. Stores `user_id` only when `p_user_id = auth.uid()`, else NULL. Raises on the table's own length limits (the CHECKs).
- Produces: column `user_bug_reports.fixed_notified_at timestamptz`.
- Drops policy `user_bug_reports_update_own_open`; `REVOKE UPDATE ON user_bug_reports FROM anon, authenticated`. INSERT policy and admin SELECT stay. Direct client INSERT stays allowed (older clients still in the wild use upsert; with UPDATE gone their retry of an existing row errors, which their queue already treats as a retryable failure; acceptable until they update).
- ROLLBACK: recreate the old policy exactly as in `20260718_user_bug_reports.sql`, re-grant UPDATE, drop the function and the column.

- [ ] **Step 1: Write the failing PGlite tests** in `tests/bug-reports-db.test.mjs`, loading `schema.sql`, `20260506_phase_c_prime.sql`, `20260718_user_bug_reports.sql`, then the new file:
  - `anon can no longer overwrite reports`: as anon, `update public.user_bug_reports set title = 'x'` throws or changes 0 rows; titles unchanged.
  - `submit returns the id and a retry returns the same id`: two calls with `report_id 'rpt_1'` return the same bigint; one row.
  - `user_id is kept only for the caller`: as user A, `p_user_id = A` stores A; as user A, `p_user_id = B` stores NULL; as anon, `p_user_id = A` stores NULL.
  - `limits still apply`: a 201-character title raises.
  - `admin can read, nobody can update fixed_notified_at from a client`: admin SELECT sees the row; admin UPDATE throws.
  - `re-paste is safe` and `rollback restores the old policy and drops the function and column, then re-apply works`.
- [ ] **Step 2: Run** `node --experimental-detect-module tests/bug-reports-db.test.mjs` → FAIL (file missing).
- [ ] **Step 3: Write the migration** (header in the style of `20261031_cert_requests.sql`, guard on `is_admin()`).
- [ ] **Step 4: Run** the test → `bug-reports-db: N/N passed`; add `tests/uat/532-bug-reports-loop.js`; `node tests/uat.js` → ALL PASS.
- [ ] **Step 5: Audit rows** in `scripts/sql/migration-audit.sql`: `('20261031_bug_reports_loop','submit_bug_report()', exists(... proname='submit_bug_report'))`, `('20261031_bug_reports_loop','column fixed_notified_at', exists(select 1 from information_schema.columns where table_name='user_bug_reports' and column_name='fixed_notified_at'))`, `('20261031_bug_reports_loop','open-report update policy gone', not exists(select 1 from pg_policies where tablename='user_bug_reports' and policyname='user_bug_reports_update_own_open'))`.
- [ ] **Step 6: Commit** `feat(bug-reports): submit RPC, notified stamp, close the open-report overwrite hole`.

### Task 2: reports.js: submit through the RPC, keep the writer, return the number

**Files:**
- Modify: `features/reports.js` (`buildPayload`, `submitReport`, `drainQueue`, `_wireSubmit`, exports)
- Test: `tests/uat/533-report-submit.js` (vm, stubbed `certanvilSupabase`)

**Interfaces:**
- Consumes: `submit_bug_report` (Task 1).
- Produces: `buildPayload(form, ctx)` now also sets `payload.user_id` (the signed-in id at write time, or null). `form.title` is optional: when empty, the title is the first line of `form.desc`, trimmed, cut to 80 characters.
- Produces: `submitReport(payload) → Promise<{type, queueAction, ..., reportNo: number|null}>`, calling `sb.rpc('submit_bug_report', {...})` with `p_user_id: payload.user_id`; `reportNo` is the returned id on success.
- Produces: exported `submitReportNow(form) → Promise<{ok: boolean, queued: boolean, reportNo: number|null}>` used by the phone sheet (builds the payload, submits, enqueues on a retryable failure exactly as `_wireSubmit` does).
- Desktop drawer success toast becomes title `Thanks, got it. Report #N` (sub unchanged) when `reportNo` is known.

- [ ] **Step 1: Failing tests**: `title falls back to the first line of the description (80 max)`; `payload carries the writer's id`; `submit calls the RPC with p_user_id from the payload, not from the current session` (stub getUser returns B, payload.user_id A → rpc args A); `success returns reportNo from the RPC`; `an RPC network error enqueues with the payload's user_id intact`; `submitReportNow offline → {ok:false, queued:true, reportNo:null}`.
- [ ] **Step 2: Run** `node tests/uat.js` → the new checks FAIL.
- [ ] **Step 3: Implement** in `features/reports.js`; the queue record keeps the payload (and so its `user_id`).
- [ ] **Step 4: Run** UAT → PASS; `npx playwright test tests/e2e --grep "report"` → existing drawer tests PASS (update any that assert the old toast title).
- [ ] **Step 5: Commit** `feat(reports): submit via RPC, keep the writer, show the report number`.

### Task 3: Phone "Report a problem" sheet + entry points

**Files:**
- Create: `features/ios-report.js` (IIFE, `window.openReportSheet`)
- Modify: `features/ios-settings.js` (Help section row `report`), `features/ios-hub.js` (export `window._hubFirstName(rawName, email)`, the existing greeting rule, unchanged behaviour), `features/ios-home.js` or wherever `#setup-err` is filled on phones (append the "Something wrong? Tell us" link), `index.html` (script tag after `features/ios-suggest.js`), `lift-ios.css`
- Test: `tests/e2e/ios-report.spec.js`, `tests/uat/534-ios-report.js`

**Interfaces:**
- Consumes: `_certanvilFeatures.reports.submitReportNow` (Task 2, lazy-loaded via `_loadFeature('reports')`), `window._hubFirstName`.
- Produces: `window.openReportSheet(opts?: {from?: string}) → void`. Sheet, copy and states exactly as `cert-ios-report.html`: eyebrow "Help", title "Report a problem", sub "Tell us what went wrong. A real person reads every report.", the hear-back line above the fields ("We'll email you when it's fixed." signed in; signed out: "Sign in to hear back when it's fixed. What you've typed stays here." with "Sign in" a link that keeps the text), context chip "From {cert} · {screen}", "What happened?" (required, 5,000), "Add the steps, if you remember them", Cancel / Send report.
- Toasts: success `Thanks, {First}, got it. Report #N` (name only when `_hubFirstName` returns one; otherwise `Thanks, got it. Report #N`), sub "We'll email you when it's fixed." (signed out: "We read every report."); queued: `Saved` / "We'll send it when you're back online."
- Settings row: `row('report', 'flag', 'Report a problem', 'Bugs, wrong answers, anything off', null)` in a new "Help" section before the danger zone.
- Focus trap and inert behind, Escape closes (same pattern as `features/ios-suggest.js`); sheet closes before the toast enters.

- [ ] **Step 1: Failing e2e** (phone viewport, stubbed RPC): `Settings → Report a problem opens the sheet with Send disabled until text`; `send shows "Thanks, Alex, got it. Report #142" when the profile name is Alex`; `an email-derived name shows "Thanks, got it."`; `offline send shows Saved and queues`; `signed out shows the sign-in line and keeps the typed text after tapping Sign in`; `a failed quiz start shows "Something wrong? Tell us" under #setup-err and it opens the sheet with From {cert} · Home`; `Escape closes; Tab stays in the sheet`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**, lifting markup and CSS from the drawing into `lift-ios.css` (scoped `.irp-*`), then `node scripts/stamp-css-versions.js`.
- [ ] **Step 4: Run** the spec (chromium + webkit + mobile-safari) and UAT → PASS.
- [ ] **Step 5: Commit** `feat(ios): Report a problem on phones`.

### Task 4: Landing endpoint `api/admin/bug-report` (close, fix and tell)

**Files:**
- Create: `landing/api/admin/bug-report.js`
- Test: `tests/api/bug-report.test.mjs` (fetch stubbed, like `tests/api/notify-cert-live.test.mjs`); run from UAT 532.

**Interfaces:**
- Consumes: `requireAdmin`, `sendMail`, `svcHeaders`, `supabaseUrl`, `missingEnv`, `unconfigured`, `jsonResponse`, `esc`, `cleanLabel` from `landing/api/_lib/admin-mail.js`; CORS like `notify-cert-live.js`.
- Produces: `POST /api/admin/bug-report` body `{ action: 'close'|'fixed', ids: number[] (1..200), after?: number }` → `{ closed, sent, skipped, failed, remaining, next, paused }`.
  - Works through `ids` in ascending id order after `after`, at most `_tuning.batch` (20) rows or `_tuning.budgetMs` (15000) per call.
  - `close`: rows with status `open`/`triaged` → `closed`; already closed → `skipped`.
  - `fixed`: per row, skip closed or anonymous (`user_id` null) or already stamped; claim with `PATCH ... ?id=eq.N&fixed_notified_at=is.null` setting `fixed_notified_at = now()` (Prefer return=representation; no row back = skipped); get the email from `GET /auth/v1/admin/users/{user_id}`; `sendMail` with `idempotencyKey: 'bug-fixed:' + id`; on send failure clear the stamp and count `failed`; on success set `status = 'closed'`. A Resend 429 stops the batch with `paused: true`.
  - One `admin_audit_log` row per call: `action 'bug_report_' + action`, `target_op 'UPDATE'`, `new_data {ids, closed, sent}`.
  - 503 on missing `SUPABASE_SERVICE_ROLE_KEY` or (for `fixed`) `RESEND_API_KEY`; 400 on bad body; 401/403 from `requireAdmin`.
- Produces: exported `buildFixedEmail(title) → {subject, html, text}` with the Global Constraints copy; the title escaped in html.

- [ ] **Step 1: Failing tests**: `non-admin gets 403`; `close closes open and triaged, skips closed`; `fixed emails each signed-in reporter once and closes; anonymous is skipped`; `a second call for the same ids sends nothing (stamp + idempotency key)`; `a failed send clears the stamp and reports failed`; `25 ids → 20 handled, remaining 5, next = 20th id`; `a 429 pauses without stamping the rest`; `buildFixedEmail escapes <b>"x"</b> in html and cuts a 70-character title to 50 + "…"`.
- [ ] **Step 2: Run** `node tests/api/bug-report.test.mjs` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS; UAT → PASS.
- [ ] **Step 5: Commit** `feat(admin): bug-report endpoint (close, fix and tell)`.

### Task 5: App endpoint `api/ai/usage` (today's AI count and limit)

**Files:**
- Create: `api/_lib/ai-limits.js` (move `GLOBAL_DAILY_LIMIT_DEFAULT` and `globalDailyLimit()` here, unchanged), `api/ai/usage.js`
- Modify: `api/ai/generate.js` (import from the lib; no behaviour change)
- Test: `tests/api/ai-usage.test.mjs`; existing `tests/api/generate-limits.test.mjs` must still pass

**Interfaces:**
- Produces: `GET /api/ai/usage` with the user's Bearer token → `{ used: number, limit: number, resetsAt: string }`. Admin only: verify the token (`/auth/v1/user`), read `profiles.role` with that token, 403 unless `admin`. `used` is the `ai_proxy_rate_limit` row `key = 'global:daily'` `count`, or 0 when its `window_start` is before today (UTC). `limit` = `globalDailyLimit()`. 503 if `SUPABASE_URL`/`SUPABASE_ANON_KEY` missing.

- [ ] **Step 1: Failing tests**: `403 for a non-admin`; `returns used and the env override limit (AI_GLOBAL_DAILY_LIMIT=300 → 300)`; `a window from yesterday reads 0`; `no row reads 0`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS** (plus `generate-limits` 16/16).
- [ ] **Step 5: Commit** `feat(ai): admin usage endpoint`.

### Task 6: Admin data module

**Files:**
- Create: `features/admin-data.js` (IIFE, `window.adminData`)
- Test: `tests/uat/535-admin-data.js` (pure functions in vm; fetchers with a stubbed client)

**Interfaces:**
- Produces (pure): `groupReports(rows) → Array<{key, screen, cert, ver, n, reach, newest, ids, rows}>`, key = `screen|cert|version` from `context`, groups ordered by newest `created_at`; `topErrors(rows, k=5) → Array<{message, count, lastVersion}>` grouped by `message`, count desc then newest; `firstLine(s, max)`.
- Produces (fetchers, each resolving `{ok:true, data}` or `{ok:false, error}`, never throwing): `today()` (users total, new in 7 days, active in 7 days by `updated_at`, errors since local midnight, AI via `GET /api/ai/usage`); `requests({q, notTold, written, thisWeek, page})` (from `cert_request_tally`, 20 per page via `range`, `ilike` on label); `reports({q, open=true, canHear, thisWeek, cert, page})` (from `user_bug_reports`, newest first, 20 per page; `ilike` on title or description); `openCount()` (head count of open reports); `errorsWeek()` (newest 500 `client_errors` rows in 7 days, then `topErrors`, plus `capped: rows.length === 500`); `act(action, ids)` (loops the landing endpoint while `remaining > 0 && !paused`, returns the summed result).
- Admin token: `certanvilSupabase.auth.getSession()`; landing URL `https://certanvil.com/api/admin/bug-report` (localhost: `http://localhost:3140` CORS already allowed).

- [ ] **Step 1: Failing tests**: `groupReports groups by screen+cert+version and counts reach`; `a report with no context is its own group`; `topErrors orders by count then recency and keeps the newest version`; `today() returns ok:false for one failing read without throwing and the others still resolve`; `reports() builds range(0,19) for page 0 and range(20,39) for page 1`; `act loops until remaining is 0 and stops on paused`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS.**
- [ ] **Step 5: Commit** `feat(admin): data module`.

### Task 7: Preview as Free

**Files:**
- Create: `features/admin-preview.js` (IIFE)
- Modify: `app.js:571` (one line, net 0: `_quotaState = (window._adminPreview ? window._adminPreview.wrap(resp.data[0]) : resp.data[0]);`), `auth-state.js` (the admin-counts-as-Pro branch at ~276 also checks `!(window._adminPreview && window._adminPreview.on())`; set `window._certanvilIsAdmin = role === 'admin'` in `renderSignedIn`, false on sign-out), the daily-limit block that `_gateActivityForQuota` shows (add the "Keep going (admin preview)" link only while previewing; if that block is in `app.js`, inject it from `admin-preview.js` by observing the block's element, keeping `app.js` net 0), `index.html`, `lift-ios.css`
- Test: `tests/e2e/admin-preview.spec.js`, `tests/uat/536-admin-preview.js`

**Interfaces:**
- Produces: `window._adminPreview = { on() → boolean, set(on: boolean) → void, wrap(state) → state }`. Flag in `localStorage` key `nplus_admin_free_preview` = `'1'`, device only (never cloud-flushed). `on()` is true only while `window._certanvilIsAdmin === true` and the flag is set. `wrap(state)` returns `{tier:'free', daily_limit:15, used_today: <questions answered today on this device from history, minus those before a Keep going tap>}` while on, else `state` unchanged. `set()` re-runs `_refreshQuotaChip()` and redraws the bar.
- The bar: under the status bar on every phone screen while on, copy "Previewing as Free" + "Back to Pro" (neutral chrome, 44pt, fade out 150ms), `role="status"` announced once on turning on.
- Sign-out clears the flag.

- [ ] **Step 1: Failing tests**: `on() is false for a non-admin even with the flag`; `wrap gives tier free, limit 15, used from today's history`; `Back to Pro restores the Pro view without reload`; `sign-out clears the flag`; `hub shows the Free view and Unlock row while previewing`; `at 15 the Free block shows Keep going (admin preview), which starts a new 15 and lets the quiz start`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS**; `node tests/tech-debt.js` → app.js ≤ 8334.
- [ ] **Step 5: Commit** `feat(admin): Preview as Free`.

### Task 8: The Admin screen (main view, See all lists, report and group sheets)

**Files:**
- Create: `features/ios-admin.js` (IIFE, `window.openAdmin`)
- Modify: `features/ios-hub.js` (More: `link('admin', SHIELD, 'Admin', 'Requests, bug reports, errors')` with the "N open" pill, only when `window._certanvilIsAdmin === true`; `openCount()` fetched when the hub opens; `act === 'admin'` → `openAdmin()`), `index.html`, `lift-ios.css`
- Test: `tests/e2e/ios-admin.spec.js` (stubbed Supabase + fetch), `tests/uat/537-ios-admin.js`

**Interfaces:**
- Consumes: `window.adminData` (Task 6), `window._adminPreview` (Task 7), `window.openSuggestCert` (unchanged), the landing `notify-cert-live` endpoint for "Send N emails" (same loop as `landing/lib/admin.js`).
- Produces: `window.openAdmin(view?: 'admin'|'reports'|'requests') → boolean` (false on desktop or non-admin). Everything else is a faithful lift of `cert-ios-admin.html`: Today strip + AI instrument (tick at 80%); Cert requests top 5 + "See all N exams", tap a row for the inline confirm; Bug reports 3 newest + "See all N open", rows open the report sheet; Top errors 5 (+ "Based on the latest 500 errors." when capped); Preview switch; dashboard link. List screens: search, chips, 20 at a time with "Show 20 more", grouped report rows opening the group sheet ("Fixed, tell all N" confirm, "Close all N, no email"). Each section loads independently ("Couldn't load this. Retry."); offline state; first-paint reveal only; overlay pattern of the hub (inert behind, un-inert first on close, Escape handled once).
- All user-written text (titles, descriptions, steps, labels, error messages) goes through `_esc` before `innerHTML`.
- Each section is a `<section aria-labelledby>` region (spec Cross-platform, accessibility).

- [ ] **Step 1: Failing tests**: `admin row shows only for the admin, with "N open"`; `Admin shows at most 3 reports and 5 requests with See all counts`; `See all reports: chip and search change the query; Show 20 more appends the next page`; `a group of 12 with 9 reachable: Fixed, tell all 9 asks once, then calls act('fixed', 12 ids) and closes`; `a report from a signed-out person only offers Close, no email`; `a title '<img src=x onerror=alert(1)>' renders as text`; `bug reports failing shows Retry while Today and Requests still render`; `offline shows "You're offline"`; `Escape closes the sheet first, then Admin`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS** on chromium, webkit, mobile-safari.
- [ ] **Step 5: Commit** `feat(admin): the Admin screen`.

### Task 9: Monday email covers bug reports and errors

**Files:**
- Modify: `landing/api/admin/cert-requests-digest.js` (`buildDigest(rows, extra)`, two more service-role reads), `tests/api/notify-cert-live.test.mjs` (digest cases)

**Interfaces:**
- Produces: `buildDigest(rows, extra = {open: number, newestTitles: string[], topErrors: Array<{message, count}>})`. Sections after the cert requests: "Open bug reports: N" with up to 3 newest titles; "Top errors this week" with up to 3 lines `{count}× {message}`. Both escaped in html. The "0 new" week still sends with these sections. Reads: open count + 3 newest (`user_bug_reports`), newest 500 `client_errors` in 7 days grouped by message (reuse the same rule as `topErrors`).

- [ ] **Step 1: Failing tests**: `digest lists open reports and top errors`; `a 0-new week still includes them`; `a title with <script> is escaped`; `a failing extra read still sends the cert-request part`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS.**
- [ ] **Step 5: Commit** `feat(admin): Monday email covers bug reports and errors`.

### Task 10: Verify and ship (on the founder's "ship it")

- [ ] `node tests/uat.js`, `node tests/tech-debt.js`, `npx playwright test` (full). All green.
- [ ] `node scripts/stamp-css-versions.js`; `bump-version.js` minor with CHANGELOG row; `stamp-facts`.
- [ ] PR from `feat/admin-in-app`; smoke the preview at phone width signed in as admin (share link via the Vercel tool).
- [ ] Founder: paste `20261031_bug_reports_loop.sql`, run the audit (all ok). Squash-merge.
- [ ] Live checks: Report a problem from the phone → appears in Admin with its number; Fixed, tell them on a test report from a test account → email arrives; Preview as Free on and off; See all lists; the old overwrite probe now fails on prod (read-only check of policies via the audit, no writes).
- [ ] Mindmatrix: tick A3–A7 only where each done-test is true.
