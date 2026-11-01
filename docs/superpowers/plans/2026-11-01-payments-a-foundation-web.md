---
up: "[[Decisions MOC]]"
type: plan
status: draft
cert: all
updated: 2026-11-01
tags: [plan, payments, gated-lane]
---
# Payments Plan A: foundation and web app Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in person on the web app (desktop or mobile web) can buy Pro through Stripe once sales open, lands on one confirmation page that never leaves a payer on Free, gets a confirmation email recording what they agreed to, sees the real subscription on Account and Billing, and can cancel in one step; every Go Pro button in the app goes through one paywall and one purchase chokepoint; the database, endpoints, daily billing job and client hooks that Plans B and C build on exist with the contract's exact names.

**Architecture:** One migration (adapted from the unmerged `feat/g1-hardening-provider-subscriptions` branch) makes `provider_subscriptions` the entitlement record, with test-mode rows counted only for allowlisted accounts and a purge guard that keeps a deleted account until its billing is released. Edge endpoints on the landing project (`/api/pricing`, `/api/stripe/{create-checkout-session,sync,webhook,subscription,create-portal-session}`, `/api/billing/status`, `/api/cron/billing-daily`) talk to Stripe's REST API with a pinned version and to Supabase with the service role; the webhook and the sync endpoint write only through the transactional RPC. A server-side sales-open switch gates every checkout. In the app, `features/pro-state.js` owns Pro state and `features/paywall.js` the paywall and chokepoint; existing gates gain a one-line hand-off. The landing `/account` page is the single confirmation page and `/manage-subscription` becomes Billing.

**Tech Stack:** Vercel Edge functions (ESM, Web Crypto, `fetch`), Vercel cron, Stripe REST API `2024-06-20`, Resend, Supabase Postgres (PGlite in tests), the Node AI proxy (`api/ai/generate.js`), vanilla JS app modules, Playwright (chromium, webkit, mobile-safari, landing).

**Spec:** `docs/superpowers/specs/2026-11-01-payments-e2e-design.md` (approved, revised 1 Nov after review; D9, D12 to D15 are new). **Drawing:** `mockups/payments-concept.html` (approved; faithful lift, screens A–E, G; the struck-through $89 is dropped). **Contract:** `docs/superpowers/plans/2026-11-01-payments-contract.md` (binding names; Plan A owns most of them).

## Global Constraints

- **Starting point:** `feat/cert-registry` lands on `main` first. Cut `feat/payments-a` from that `main`; if work started earlier, rebase onto it before the first commit. Re-derive every `app.js` / `features/*` line number in this plan with `node scripts/graphq.js` at execution (the registry moved `app.js` by about 100 lines, deleted `CERT_HOST` from `lib/router.js`, and changed `lib/cert-lock.js` `certLabel`).
- **The Stripe branch is local only.** Before Task 1, push it so a fresh or remote agent can read it: `git push origin feat/g1-hardening-provider-subscriptions` (ask the founder first if pushing branches needs approval). Tasks 1, 4 and 6 read its files with `git show`.
- Lane: **gated**. Branch `feat/payments-a`, PR, Supabase branch DB + Vercel previews (Task 21), squash-merge. Never direct-push.
- UAT numbers **550–554** (`feat/cert-registry` owns 540–546; B uses 555–557; C 560–566).
- Prices (D1): Monthly **$9.99 / £8.99 / €9.99**; Yearly **$89 / £79 / €89**; per-month line under Yearly **$7.42 / £6.58 / €7.42**. Launch (D5): Yearly first year **$69 / £59 / €69** via one amount-off coupon **$20 / £20 / €20**, duration `once`. No trial. Yearly is the default. **No struck-through price anywhere.** The USD symbol reads `US$` outside the US (from `/api/pricing`).
- Every price shown in the web app comes from `/api/pricing`; nothing in `app.js`, `features/` or `landing/lib/` hardcodes a figure.
- **Sales-open switch (D13):** no checkout session for anyone until `SALES_OPEN_AT` has passed, except `billing_test_accounts` members and valid early-access tokens between `LAUNCH_STARTS_AT` and `SALES_OPEN_AT`. Live checkout refuses while `TRADER_ADDRESS` or `TERMS_VERSION` is unset.
- **Consent text** comes only from `consentText({ plan, currency, launch })` (contract). Normal Yearly GBP, verbatim: `I agree to the [Terms](https://certanvil.com/terms) and to Pro renewing automatically at £79 a year until I cancel. I want Pro to start now. If I cancel in the first 14 days, I only get back the part I haven't used.` No refund promise and no refund button anywhere (D9).
- One contact: `support@certanvil.com`.
- Stripe REST calls send `Stripe-Version: 2024-06-20`. The webhook never trusts payload shape: it re-retrieves the object by id. Mode = key prefix; an event whose `livemode` disagrees is rejected.
- Billing endpoints require `SUPABASE_URL` explicitly (no production fallback) and answer `503 { error: 'stripe_not_configured' }` / `not-configured` when an env var is missing, never throw.
- Migrations dated on or after 2026-05-12 carry a tested `-- ROLLBACK:` block (non-destructive for paid data) and rows in `scripts/sql/migration-audit.sql`.
- `app.js` ratchet (`tests/appjs-baseline.json`): new UI goes in `features/*.js`; this plan's `app.js` edits are net zero or negative lines. `dg-system.css` changes hand-bump `dg-system.css?v=` (compare against `git show main:index.html`, not a hardcoded value).
- On-screen copy: no em dashes, never names the founder, verbatim from the drawing where it has it. Dates `14 Mar 2027` (en-GB).
- Motion: `design/brand/BRAND.md` §6 tokens win. `transform` + `opacity` only, entrances never below `scale(0.96)`, hover behind `@media (hover:hover) and (pointer:fine)`, reduced motion collapses to fade.
- Every element that shows a web price or starts a web purchase directly carries `data-web-purchase`. Elements that only **open the paywall** carry `data-paywall="<trigger>"` instead and show no price: on iPhone with in-app purchase (Plan B's `html.ca-iap`) they open the native paywall, so they must not be hidden by the `data-web-purchase` rule. Pricing links that become paywall openers keep their `href`.
- iPhone (`html.is-native`): Plan A adds nothing visible that buys or prices. `openPaywall` hands off to `window.nativePaywall` when Plan B has defined it, else returns `false`.
- Testing: never write `localStorage` on a prod or `*.vercel.app` host from a browser tool. App specs run locally on chromium, webkit and mobile-safari (`--project=chromium --project=webkit --project=mobile-safari`); CI gates chromium + landing only, so the PR description records the webkit and mobile-safari run.
- Version: next minor at execution, via `bump-version.js`.
- User-visible surfaces in Tasks 11 and 13–20 go through the 5-stage visual pass (Task 22) before the PR leaves draft.

## Review Focus

1. **The webhook is down or misconfigured when someone pays** (wrong `whsec`, event not subscribed, a 503). Expected: the confirmation page syncs the paid session from Stripe and shows You're Pro anyway; nobody who paid sits on Free. Tests owned by Tasks 5 and 19.
2. **A paying (non-admin) person opens a second cert, or onboarding routes them.** Expected: no wall and no Free routing for anyone the server says is Pro; a wall drawn before Pro lands is removed when it does. Tests owned by Task 12.
3. **The Pro check fails on a network error** (supabase-js resolves `{ data: null, error }`, WKWebView resume). Expected: last known Pro under 24h keeps limits lifted for display; a failed check never downgrades. Test owned by Task 12.
4. **Stripe sends events out of order, twice, for a deleted account, or for a sub we have no row for.** Expected: older events never overwrite newer, duplicates return `duplicate` (and a refund still cancels), unmatched and deleted-user events return 200 `unmatched`, nothing loops on 500. Tests owned by Tasks 1 and 6.
5. **`/api/pricing` is unreachable.** Expected: the paywall opens with plans named without amounts, no `NaN`/`undefined`/bare symbol, and Get Pro still starts checkout (the server decides sales-open). Test owned by Task 13.

---

## Interfaces Plan A produces (names are binding for Plans B and C; the contract has the full list)

| Interface | Shape |
|---|---|
| Table `provider_subscriptions` | contract columns, incl. `current_period_start, consent_text, consent_at, terms_version, confirmation_sent_at, renewal_reminded_for, released_at` |
| Tables `billing_test_accounts`, `open_checkout_sessions` | contract |
| RPC `apply_provider_subscription_event(text, text, jsonb) → text` | `applied \| duplicate \| stale \| unmatched` |
| `is_pro(uid)` | contract rule (sandbox only for allowlisted; legacy `subscriptions` arm kept) |
| `GET /api/pricing` | contract shape incl. `currencyLocked, salesOpen, earlyAccess, analytics` |
| `POST /api/stripe/create-checkout-session` | contract; `{ url, currency }` |
| `POST /api/stripe/sync` | contract |
| `POST /api/stripe/subscription` | contract (`cancel` / `resume`) |
| `POST /api/stripe/create-portal-session` | flows `card`, `switch` |
| `GET /api/billing/status` | contract incl. `salesOpen, canBuy` |
| `GET /api/cron/billing-daily` | contract |
| `_lib` modules | `stripe.js`, `stripe-ops.js`, `pricing.js`, `consent.js`, `early-access.js`, `entitlement.js`, `billing-http.js`, `billing-mail.js`, `billing-release.js` |
| Client | `openPaywall`, `startProUpgrade`, `nativePurchase` stub, `refreshProState`, `caProLastKnown`, `caProConfirmed`, `caApiBase`, `PAYWALL_COPY`, `CAPaywall`, `buildSignInUrl({ intent, plan })`; landing `caBilling`, event `ca:checkout-pro`, `landing/lib/cert-registry.js` |

## File structure

| File | Responsibility |
|---|---|
| `supabase/migrations/20261101_provider_subscriptions.sql` (new) | Tables, RLS, `is_pro()`, view, RPC, purge guard, grants, rollback |
| `landing/api/_lib/stripe.js` | `stripeRequest`, `formEncode`, `verifyStripeSignature`, `STRIPE_VERSION`, `stripeMode()` |
| `landing/api/_lib/stripe-ops.js` | `cancelNow`, `voidOpenInvoices`, `refundUnused`, `refundLatestInFull` |
| `landing/api/_lib/pricing.js` | `PRICES`, `EURO_AREA`, `EU_EEA`, `currencyFor`, `isLockedCountry`, `launchState`, `salesState`, `pricingPayload`, `planForPrice` |
| `landing/api/_lib/consent.js`, `early-access.js` | Consent text; early-access tokens |
| `landing/api/_lib/entitlement.js` | `summarize(rows, role, nowMs, opts)` (JS mirror of `is_pro()` + Billing states) |
| `landing/api/_lib/billing-http.js` | `verifyUser`, `corsHeaders`, `readSubs`, `readRole`, `isTestAccount`, `safeReturn`, `siteOrigin`, `requireBillingEnv` |
| `landing/api/_lib/billing-mail.js` | Confirmation, exit, double-purchase, reminder emails and founder alerts |
| `landing/api/_lib/billing-release.js` | `releaseStripe(row)` (+ `releaseApple` from Plan B) |
| `landing/api/pricing.js`, `billing/status.js`, `stripe/*.js`, `cron/billing-daily.js` | Endpoints |
| `api/ai/generate.js` (modify) | Server-side metering |
| `features/pro-state.js`, `features/paywall-copy.js`, `features/paywall.js`, `features/billing-notices.js` (new) | App Pro state, paywall wording, paywall + chokepoint + nudges, grace/ended |
| `landing/lib/cert-registry.js` (new, byte copy), `landing/lib/billing.js`, `landing/lib/checkout-return.js`, `landing/lib/delete-account.js`, `landing/lift-billing.css` (new) | Landing billing client, confirmation, delete page, styles |
| `.github/workflows/ci.yml` (modify) | Landing preview deploy + stable aliases |

---

### Task 1: Subscription record migration

**Why re-apply, not cherry-pick:** the branch sits hundreds of commits behind `main`, its migration date sorts before migrations already on prod, its `is_pro()` drops the admin bypass, and its endpoints are Node/CJS on the `stripe` SDK while `landing/api` is Edge ESM with fetch-stubbed tests. Bring the migration over and adapt it; port endpoint logic in Tasks 4–7 by reading `git show feat/g1-hardening-provider-subscriptions:landing/api/stripe/<file>`. Do not bring `landing/package.json`.

**Files:** Create `supabase/migrations/20261101_provider_subscriptions.sql`, `tests/payments-db.test.mjs`, `tests/uat/550-payments-db.js`. Modify `scripts/sql/migration-audit.sql`.

**Interfaces:**
- Consumes: `stripe_events`, `_set_updated_at()`, `subscriptions` (20260509_phase_e_subscriptions), `profiles.role`, `profiles.is_playtest` (20260509_playtest_accounts), quota functions (20260611_free_tier_15_questions).
- Produces: the DB rows of the contract; `export async function bootDb()` and `asUser(db, uid, sql, params)` from `tests/payments-db.test.mjs`.

- [ ] **Step 1: Bring the file over**

```bash
git checkout feat/g1-hardening-provider-subscriptions -- supabase/migrations/20260918_provider_subscriptions.sql
git mv supabase/migrations/20260918_provider_subscriptions.sql supabase/migrations/20261101_provider_subscriptions.sql
```

- [ ] **Step 2: Write the failing suite `tests/payments-db.test.mjs`** (prelude, `bootDb`, `asUser`, `t()` and summary `payments-db: N/N passed` copied from `tests/deletion-db.test.mjs`; migrations in order: `schema.sql`, `20260506_phase_c_prime`, `20260509_phase_e_subscriptions`, `20260509_phase_e_admin_bypass`, `20260509_playtest_accounts`, `20260611_free_tier_15_questions`, `20261029_account_deletion`, `20261101_provider_subscriptions`; helper `apply(id, type, row)` calls the RPC as superuser):

```js
await t('is_pro: no rows false; admin true; active stripe true; grace true; apple active true', ...);
await t('is_pro: revoked, canceled, expired period, tier free all false', ...);
await t('is_pro: a sandbox row is Pro only for billing_test_accounts, admins and playtesters', async () => {
  await insertRow(U1, { environment: 'sandbox', status: 'active' });
  assert.equal(await isPro(U1), false);
  await db.query('insert into billing_test_accounts(user_id, note) values ($1, $2)', [U1, 'test']);
  assert.equal(await isPro(U1), true);
});
await t('is_pro: a legacy subscriptions row (playtester, period 9999-12-31) stays Pro', ...);
await t('daily limit stays 15 for Free and -1 for Pro and admin', async () => {
  const q = async (u) => (await db.query('select * from get_daily_quota_usage($1)', [u])).rows[0];
  assert.equal((await q(FREE)).daily_limit, 15); assert.equal((await q(ADMIN)).daily_limit, -1); assert.equal((await q(PAYER)).daily_limit, -1);
  assert.match((await db.query("select prosrc from pg_proc where proname='consume_daily_quota'")).rows[0].prosrc, /daily_limit constant int := 15/);
});
await t('apply: first event applied, same id again duplicate', ...);
await t('apply: an older event after a newer one is stale and changes nothing', ...);
await t('apply: a crashed processing claim re-applies', ...);
await t('apply: no existing row and no user_id is unmatched, event processed, no row', ...);
await t('apply: a user_id that no longer exists in auth.users is unmatched, not an error', async () => {
  assert.equal(await apply('evt_gone', 'customer.subscription.deleted', row({ user_id: GONE_UUID })), 'unmatched');
});
await t('apply: _noop records the event and writes no row', ...);
await t('apply: writes plan, currency, period start, launch_price_until, consent fields, grace status', ...);
await t('apply: never overwrites consent_text, consent_at or confirmation_sent_at with null', ...);
await t('apply: status past_due is rejected by the check constraint', ...);
await t('anon and authenticated cannot execute the RPC or read billing_test_accounts / open_checkout_sessions', ...);
await t('RLS: a user reads only their own provider_subscriptions and user_entitlements rows', ...);
await t('migration-audit rows for 20261101 all report ok', ...);
await t('re-pasting the whole file is safe and keeps rows', ...);
await t('ROLLBACK keeps paid entitlements: renamed table, admin bypass and is_pro still true for a payer, then the file applies again', async () => {
  await db.exec(rollbackSql());
  assert.equal(await isPro(ADMIN), true);
  assert.equal(await isPro(PAYER), true);   // reads provider_subscriptions_rb_20261101
  assert.equal((await db.query("select to_regclass('public.provider_subscriptions_rb_20261101') r")).rows[0].r !== null, true);
  assert.equal((await db.query('select daily_limit from get_daily_quota_usage($1)', [FREE])).rows[0].daily_limit, 15);
  await db.exec(read(FILE));   // re-apply renames back when the live table is absent
  assert.equal(await isPro(PAYER), true);
});
```

- [ ] **Step 3: Run it and see it fail.** `node --experimental-detect-module tests/payments-db.test.mjs` → FAIL on admin, sandbox, legacy, unmatched-user and rollback cases.

- [ ] **Step 4: Adapt the migration** (keep the rest of the branch's logic and comments):
- Header: date 2026-11-01, this plan, the spec; supersedes the never-applied `20260918` file. Note: additive, safe to paste on prod before merge (Task 23 Step 4).
- If `public.provider_subscriptions_rb_20261101` exists and `public.provider_subscriptions` does not, rename it back first (so re-apply after rollback keeps rows).
- Columns: `billing_period` → `plan text check (plan in ('monthly','yearly'))`; add `currency text check (currency in ('usd','gbp','eur'))`, `current_period_start timestamptz`, `launch_price_until timestamptz`, `consent_text text`, `consent_at timestamptz`, `terms_version text`, `confirmation_sent_at timestamptz`, `renewal_reminded_for timestamptz`, `released_at timestamptz`. `environment` check `('production','sandbox')`, default `'production'`.
- Status check: `('active','trialing','grace','canceled','incomplete','incomplete_expired','unpaid','expired','revoked')`.
- New tables (RLS on, no policies, service role only): `billing_test_accounts(user_id uuid primary key references auth.users on delete cascade, note text, created_at timestamptz default now())`; `open_checkout_sessions(user_id uuid primary key references auth.users on delete cascade, session_id text not null, created_at timestamptz default now())`.
- `is_pro(uid)`: `language sql security definer stable set search_path = public`; true when an entitling row exists (`tier='pro'`, status in `('active','trialing','grace')`, `revoked_at is null`, `current_period_end is null or > now()`, and `environment = 'production' or exists billing_test_accounts row or profiles.role='admin' or profiles.is_playtest`), or `profiles.role = 'admin'`, or an active legacy `subscriptions` row (`tier = 'pro'`, status active, period end in the future). Comment names the 20260509 admin bypass and the playtest seed it keeps.
- `user_entitlements`: same predicate in `bool_or`.
- RPC race handling: claim the event with `insert ... on conflict (event_id) do nothing` then `select status ... for update`; `perform pg_advisory_xact_lock(hashtext(v_provider || ':' || coalesce(p_row->>'original_transaction_id', p_row->>'provider_subscription_id', '')))` before locating the row.
- RPC: no existing row and (`user_id` null **or** `not exists (select 1 from auth.users where id = (p_row->>'user_id')::uuid)`) → mark processed, `return 'unmatched'`.
- RPC writes: every new column with the branch's `coalesce(new, old)` pattern, so a later event never nulls `consent_*`, `confirmation_sent_at`, `renewal_reminded_for` or `released_at`.
- `-- ROLLBACK:` block (non-destructive; label it "safe after launch"): drop the RPC and the view; `alter table provider_subscriptions rename to provider_subscriptions_rb_20261101`; restore the **20260509_phase_e_admin_bypass** `is_pro()` body with one extra `or exists (...)` arm reading the renamed table with the entitling predicate; leave `billing_test_accounts`, `open_checkout_sessions` and `stripe_events.status` in place; restore the 20261029 `purge_deleted_accounts` body (Task 8 adds the guard to this file).

- [ ] **Step 5: Audit rows** in `scripts/sql/migration-audit.sql` (before the closing `)`): table `provider_subscriptions`, the RPC, `is_pro() reads provider_subscriptions and keeps admin`, `is_pro() keeps legacy subscriptions` (`prosrc ilike '%subscriptions s%'` or the alias used), `view user_entitlements`, `table billing_test_accounts`, `table open_checkout_sessions`, `authenticated cannot apply events` (same expressions as the branch file's style).

- [ ] **Step 6: UAT module** `tests/uat/550-payments-db.js`, spawn pattern of `tests/uat/532-bug-reports-loop.js`, regex `payments-db: (\d+)\/\1 passed`. Later tasks append their suites to this module's spawn list.

- [ ] **Step 7: Run and pass.** `node --experimental-detect-module tests/payments-db.test.mjs && node tests/uat.js` → `payments-db: N/N passed`; UAT ALL PASS.

- [ ] **Step 8: Commit** `payments A1: provider_subscriptions with admin bypass, sandbox allowlist, legacy arm, safe rollback`

---

### Task 2: Shared server libraries

**Files:** Create `landing/api/_lib/{stripe,stripe-ops,pricing,consent,early-access,entitlement,billing-http}.js`, `tests/api/payments-lib.test.mjs`. Modify `tests/payments-db.test.mjs` (parity case), `tests/uat/550-payments-db.js` (spawn).

**Interfaces:**
- Consumes: `bootDb` (Task 1); `serviceKey`, `svcHeaders`, `bearer` from `landing/api/_lib/admin-mail.js` (**not** its `supabaseUrl()`, which falls back to prod).
- Produces:
  - `stripe.js`: `STRIPE_VERSION = '2024-06-20'`; `formEncode(obj) → string`; `stripeRequest(method, path, params?, { idempotencyKey }?) → object` (throws `Error` with `.status`, `.code`); `verifyStripeSignature(rawBody, header, secret, nowSec?, toleranceSec = 300) → Promise<boolean>`; `stripeMode() → 'live'|'test'|null` from the `STRIPE_SECRET_KEY` prefix.
  - `stripe-ops.js`: `cancelNow(subId, idemKey) → Promise<void>` (`DELETE /v1/subscriptions/:id` with `prorate=false`; a 404 `resource_missing` counts as done); `voidOpenInvoices(subId) → Promise<number>`; `refundLatestInFull(subId, idemKey) → Promise<{ refunded }>`; `refundUnused(subId, { reason }) → Promise<{ refunded }>` (latest paid invoice's payment intent, amount = `floor(amount_paid × (period_end − now) ÷ (period_end − period_start))`, never above `amount_paid − amount_refunded`).
  - `pricing.js`: `PRICES` (usd `{ symbol:'$', monthly:'9.99', yearly:'89', yearlyPerMonth:'7.42', firstYear:'69' }`, gbp `£ 8.99 79 6.58 59`, eur `€ 9.99 89 7.42 69`); `EURO_AREA` (AT BE BG HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES); `EU_EEA` (the 27 EU states plus IS LI NO); `isLockedCountry(c) → boolean` (GB or euro area); `currencyFor(country, override) → 'usd'|'gbp'|'eur'` (locked country → its own currency, override ignored; else a valid override; else usd); `symbolFor(currency, country) → string` (`US$` for usd when country is known and not US); `launchState(nowMs, env) → { active, endsAt }` (active iff `LAUNCH_STARTS_AT ≤ now < LAUNCH_ENDS_AT`); `salesState(nowMs, env) → { open, early }` (`open` iff `SALES_OPEN_AT` parses and ≤ now; `early` iff not open and `LAUNCH_STARTS_AT ≤ now`); `pricingPayload(country, override, nowMs, env)` → the `/api/pricing` body; `planForPrice(priceId, env)`.
  - `consent.js`: `CONSENT_VERSION = '2026-11-01'`; `consentText({ plan, currency, launch }) → string` (contract wording; money via `PRICES` and `symbolFor(currency, null)`).
  - `early-access.js`: `earlyAccessToken(rowId) → Promise<string>`, `verifyEarlyAccess(token) → Promise<boolean>` (HMAC-SHA256 with `EARLY_ACCESS_SECRET`; false when the secret is unset or the token is malformed).
  - `entitlement.js`: `summarize(rows, role, nowMs, { allowSandbox }) → { pro, source, plan, status, renewsAt, endsAt, launchFirstYear, fullPriceFrom, currency, row }`.
  - `billing-http.js`: `requireBillingEnv(names) → string[]` (missing names; always includes `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`); `sbUrl() → string` (`process.env.SUPABASE_URL`, no fallback); `verifyUser(token) → { id, email } | null`; `corsHeaders(req, methods)` (origins `^https://([a-z0-9-]+\.)?certanvil\.com$`, `http://localhost:3131|3132`, and when `VERCEL_ENV === 'preview'` also `^https://[a-z0-9-]+-oremosu98\.vercel\.app$` and `^https://certanvil-(app|landing)-payments\.vercel\.app$`); `readSubs(userId)`; `readRole(userId) → { role, isPlaytest }`; `isTestAccount(userId) → Promise<boolean>`; `safeReturn(raw, fallback)` (https and an allowed origin above; keeps origin + path, plus only the `plan` and `currency` query params when their values are valid, so the pricing page's cancel URL keeps the picked plan); `siteOrigin(req) → string` (`SITE_ORIGIN` env, else the request origin when `VERCEL_ENV === 'preview'`, else `https://certanvil.com`).

- [ ] **Step 1: Failing tests** in `tests/api/payments-lib.test.mjs` (summary `payments-lib: N/N passed`):

```js
assert.equal(formEncode({ line_items: [{ price: 'p', quantity: 1 }], automatic_tax: { enabled: true } }),
  'line_items[0][price]=p&line_items[0][quantity]=1&automatic_tax[enabled]=true');
assert.equal(await verifyStripeSignature(body, `t=${t},v1=${good}`, 'whsec_x', t + 10), true);
assert.equal(await verifyStripeSignature(body + ' ', `t=${t},v1=${good}`, 'whsec_x', t + 10), false);
assert.equal(await verifyStripeSignature(body, `t=${t},v1=${good}`, 'whsec_x', t + 301), false);
assert.equal(currencyFor('GB'), 'gbp'); assert.equal(currencyFor('DE'), 'eur'); assert.equal(currencyFor('BG'), 'eur'); assert.equal(currencyFor('US'), 'usd');
assert.equal(currencyFor('GB', 'usd'), 'gbp');          // locked: a UK buyer cannot pick USD
assert.equal(currencyFor('US', 'gbp'), 'gbp'); assert.equal(currencyFor('CA', 'xyz'), 'usd'); assert.equal(currencyFor(undefined), 'usd');
assert.equal(symbolFor('usd', 'CA'), 'US$'); assert.equal(symbolFor('usd', 'US'), '$'); assert.equal(symbolFor('usd', undefined), '$');
const env = { LAUNCH_STARTS_AT: '2026-12-01T00:00:00Z', SALES_OPEN_AT: '2026-12-03T00:00:00Z', LAUNCH_ENDS_AT: '2027-01-02T23:59:00Z' };
assert.deepEqual(salesState(Date.parse('2026-11-30T00:00:00Z'), env), { open: false, early: false });
assert.deepEqual(salesState(Date.parse('2026-12-02T00:00:00Z'), env), { open: false, early: true });
assert.deepEqual(salesState(Date.parse('2026-12-03T00:00:00Z'), env), { open: true, early: false });
assert.deepEqual(salesState(Date.now(), {}), { open: false, early: false });
assert.equal(launchState(Date.parse('2027-01-02T23:59:00Z'), env).active, false);
assert.deepEqual(pricingPayload('GB', null, Date.parse('2026-12-10T00:00:00Z'), env),
  { currency: 'gbp', symbol: '£', monthly: '8.99', yearly: '79', yearlyPerMonth: '6.58', currencyLocked: true, salesOpen: true, earlyAccess: false, analytics: true,
    launch: { active: true, firstYear: '59', endsAt: '2027-01-02T23:59:00.000Z' } });
assert.equal(pricingPayload('FR', null, Date.now(), {}).analytics, false);
assert.equal(consentText({ plan: 'yearly', currency: 'gbp', launch: false }),
  "I agree to the [Terms](https://certanvil.com/terms) and to Pro renewing automatically at £79 a year until I cancel. I want Pro to start now. If I cancel in the first 14 days, I only get back the part I haven't used.");
assert.equal(consentText({ plan: 'yearly', currency: 'usd', launch: true }),
  "I agree to the [Terms](https://certanvil.com/terms) and to Pro renewing automatically at $89 a year after my first year at $69, until I cancel. I want Pro to start now. If I cancel in the first 14 days, I only get back the part I haven't used.");
assert.equal(consentText({ plan: 'monthly', currency: 'eur', launch: true }).includes('at €9.99 a month until I cancel'), true);
const tok = await earlyAccessToken('42'); assert.equal(await verifyEarlyAccess(tok), true);
assert.equal(await verifyEarlyAccess('42.' + 'f'.repeat(64)), false); assert.equal(await verifyEarlyAccess('junk'), false);
// summarize
assert.equal(summarize([], { role: 'user' }, NOW).status, 'free');
assert.deepEqual(pick(summarize([], { role: 'admin' }, NOW)), { pro: true, source: 'admin', status: 'active' });
assert.equal(summarize([row({ status: 'active', cancel_at_period_end: true })], { role: 'user' }, NOW).status, 'cancelled');
assert.equal(summarize([row({ status: 'grace' })], { role: 'user' }, NOW).status, 'grace');
assert.equal(summarize([row({ status: 'canceled', current_period_end: PAST })], { role: 'user' }, NOW).status, 'ended');
assert.equal(summarize([row({ environment: 'sandbox' })], { role: 'user' }, NOW, { allowSandbox: false }).pro, false);
assert.equal(summarize([row({ launch_price_until: FUTURE })], { role: 'user' }, NOW).launchFirstYear, true);
// refundUnused: paid 7900, period 365 days, 73 days left → 1580; already refunded 7900 → 0
// cancelNow: 404 resource_missing resolves; 500 rejects with .status 500
// sbUrl: SUPABASE_URL unset → requireBillingEnv([]) includes 'SUPABASE_URL'
assert.equal(safeReturn('https://evil.com/x', 'https://certanvil.com/account'), 'https://certanvil.com/account');
assert.equal(safeReturn('https://secplus.certanvil.com/app?x=1', 'f'), 'https://secplus.certanvil.com/app');
assert.equal(safeReturn('https://certanvil.com/pricing?plan=monthly&currency=eur&x=<b>', 'f'), 'https://certanvil.com/pricing?plan=monthly&currency=eur');
// VERCEL_ENV=preview: safeReturn('https://certanvil-app-payments.vercel.app/', f) kept; production: falls back
// siteOrigin: preview request to https://certanvil-landing-payments.vercel.app/api/x → that origin; production → https://certanvil.com
```

Add to `tests/payments-db.test.mjs`: `summarize() agrees with is_pro() on every fixture row` (14 fixtures: each status, revoked, past/future/null period, both providers, sandbox with and without allowlist, legacy-only playtester, admin with no rows; `allowSandbox` = allowlisted, admin or playtest; the legacy case maps through `readSubs` returning a synthetic row, so add `legacy` handling to `summarize`).

- [ ] **Step 2: Run, fail.** `node --experimental-detect-module tests/api/payments-lib.test.mjs` → modules not found.
- [ ] **Step 3: Implement the modules.** `summarize` rules: admin → `{ pro: true, source: 'admin', plan: null, status: 'active', renewsAt: null, endsAt: null, launchFirstYear: false, fullPriceFrom: null, currency: null }`. Entitling row = the `is_pro()` predicate (sandbox only with `allowSandbox`); pick the latest `current_period_end` (null latest). Entitling → `status` grace / cancelled (`cancel_at_period_end`) / active; `renewsAt` = period end unless cancelled; `endsAt` = period end when cancelled. No entitling row but rows → `ended`, `source` = provider of the most recent row, `endsAt` = `revoked_at || current_period_end`. No rows → `free`. `launchFirstYear` = `launch_price_until > now`; `fullPriceFrom` = that ISO. `readSubs` also reads the caller's legacy `subscriptions` row and returns it as `{ provider: 'stripe', legacy: true, ... }`.
- [ ] **Step 4: Run, pass**; add the spawn to `550`; `node tests/uat.js` passes.
- [ ] **Step 5: Commit** `payments A2: Stripe client and ops, pricing with currency lock and sales state, consent text, early access, entitlement summary`

---

### Task 3: `GET /api/pricing`

**Files:** Create `landing/api/pricing.js`, `tests/api/pricing.test.mjs`; spawn in `550`.

**Interfaces:** Consumes `pricingPayload`, `corsHeaders`. Produces the contract endpoint (`runtime: 'edge'`; no env required).

- [ ] **Step 1: Failing tests**

```js
const res = await handler(new Request('https://certanvil.com/api/pricing', { headers: { 'x-vercel-ip-country': 'FR', origin: 'https://networkplus.certanvil.com' } }));
assert.equal(res.status, 200); const b = await res.json();
assert.equal(b.currency, 'eur'); assert.equal(b.currencyLocked, true); assert.equal(b.analytics, false);
assert.equal(res.headers.get('access-control-allow-origin'), 'https://networkplus.certanvil.com');
assert.equal(res.headers.get('cache-control'), 'no-store');
// US visitor ?currency=gbp → gbp, currencyLocked false; GB visitor ?currency=usd → gbp; CA visitor → symbol 'US$'
// SALES_OPEN_AT unset → salesOpen false, earlyAccess false; in the early window → earlyAccess true, launch.active true
// origin https://evil.com → no allow-origin; OPTIONS → 204; POST → 405
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement** (GET/OPTIONS only). **Step 4: Run, pass.** **Step 5: Commit** `payments A3: /api/pricing with sales state and currency lock`

---

### Task 4: `POST /api/stripe/create-checkout-session`

**Files:** Create `landing/api/stripe/create-checkout-session.js`, `tests/api/stripe-checkout.test.mjs`; spawn in `550`.

**Interfaces:**
- Consumes: Task 2 libraries; RPC `is_pro` via `/rest/v1/rpc/is_pro` with the service role; `open_checkout_sessions` via PostgREST.
- Produces: the contract endpoint. Env: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; optional `STRIPE_LAUNCH_COUPON`, `LAUNCH_STARTS_AT`, `LAUNCH_ENDS_AT`, `SALES_OPEN_AT`, `EARLY_ACCESS_SECRET`; live mode also requires `TRADER_ADDRESS`, `TERMS_VERSION`.

Order of checks (the order is the decision): method/CORS → env (missing → `503 stripe_not_configured`; live key without `TRADER_ADDRESS`/`TERMS_VERSION` → `503 not_ready`) → `verifyUser` (401) → plan (`400 bad_plan`) → sales gate (`salesState.open`, or `isTestAccount`, or `salesState.early && verifyEarlyAccess(body.earlyAccess)`; else `403 sales_closed`) → `is_pro` (RPC error → `503 try_again`; true → `409 already_pro`) → currency (`currencyFor(country, body.currency)`; an existing Stripe customer with a `currency` forces that one) → expire the caller's previous open session (`POST /v1/checkout/sessions/:id/expire`, errors ignored) → coupon (Yearly, `launchState.active`, coupon retrieved once per 5 minutes per instance, attached only when `redeem_by × 1000 − 60000 > now` and the coupon has an amount for this currency) → create → upsert `open_checkout_sessions` → `{ url, currency }`.

- [ ] **Step 1: Failing tests** (fetch stubbed; parse the Stripe POST body with `URLSearchParams`):

```js
// 503 stripe_not_configured when STRIPE_PRICE_YEARLY or SUPABASE_URL missing; sk_live_ key without TRADER_ADDRESS → 503 not_ready
// 401 without a valid token; 400 bad_plan for 'weekly'
// SALES_OPEN_AT unset, ordinary user → 403 sales_closed, no Stripe call
// SALES_OPEN_AT unset, user in billing_test_accounts → 200
// early window, valid earlyAccess token → 200; bad token → 403; token after SALES_OPEN_AT not needed
// is_pro RPC 500 → 503 try_again, no Stripe call; is_pro true → 409 already_pro, no Stripe call
const p = await checkoutBody({ plan: 'yearly', currency: 'gbp', from: 'secplus', returnTo: 'https://secplus.certanvil.com/' }, { launch: true, country: 'GB' });
assert.equal(p.get('mode'), 'subscription');
assert.equal(p.get('line_items[0][price]'), 'price_yearly');
assert.equal(p.get('currency'), 'gbp');
assert.equal(p.get('discounts[0][coupon]'), 'coupon_launch');
assert.equal(p.get('allow_promotion_codes'), null);
assert.equal(p.get('consent_collection[terms_of_service]'), 'required');
assert.equal(p.get('custom_text[terms_of_service_acceptance][message]'), consentText({ plan: 'yearly', currency: 'gbp', launch: true }));
assert.match(p.get('custom_text[terms_of_service_acceptance][message]'), /\[Terms\]\(https:\/\/certanvil\.com\/terms\)/);
assert.equal(p.get('automatic_tax[enabled]'), 'true');
assert.equal(p.get('client_reference_id'), USER.id);
assert.equal(p.get('subscription_data[metadata][supabase_user_id]'), USER.id);
assert.equal(p.get('metadata[consent_version]'), CONSENT_VERSION);
assert.equal(p.get('success_url'), 'https://certanvil.com/account?checkout=success&session_id={CHECKOUT_SESSION_ID}&from=secplus');
assert.equal(p.get('cancel_url'), 'https://secplus.certanvil.com/?checkout=cancelled');
assert.ok(Math.abs(Number(p.get('expires_at')) - (NOW_S + 1800)) <= 2);
assert.equal(stripeHeaders['Stripe-Version'], '2024-06-20');
// GB visitor sending currency 'usd' → currency 'gbp' in the session and in the response
// existing customer cus_1 with currency 'gbp', body currency 'eur', US visitor → session currency 'gbp', response { currency: 'gbp' }, customer=cus_1, no customer_email
// a previous open_checkout_sessions row cs_old → POST /v1/checkout/sessions/cs_old/expire before the create; row then holds the new id
// coupon redeem_by 30s from now → no discounts; coupon lacking a gbp amount → no discounts; monthly → no discounts
// idempotency keys differ for the same user and minute when currency or from differ; equal for an identical double tap
// from 'evil<script>' → success_url has no from; returnTo https://evil.com → cancel_url https://certanvil.com/pricing?checkout=cancelled
// VERCEL_ENV=preview, request to https://certanvil-landing-payments.vercel.app → success_url starts with that origin
// Stripe 500 → 500 { error: 'checkout_failed' } and a client_errors write
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement** as ordered above. `from` accepted only for `/^[a-z0-9-]{2,20}$/`. `success_url` = `siteOrigin(req) + '/account?checkout=success&session_id={CHECKOUT_SESSION_ID}'` (+ `&from=`); `cancel_url` = `safeReturn(returnTo, siteOrigin + '/pricing')` with `checkout=cancelled` appended (`?` or `&`). Idempotency key `checkout:<user id>:<first 16 hex of SHA-256 of the JSON of every Stripe param except expires_at>:<minute>`. Metadata carries `consent_version`, `plan`, `supabase_user_id`.
- [ ] **Step 4: Run, pass.** **Step 5: Commit** `payments A4: checkout behind the sales switch, fail-closed Pro check, 30-minute sessions, consent text`

---

### Task 5: Confirmation email and `POST /api/stripe/sync`

**Files:** Create `landing/api/_lib/billing-mail.js`, `landing/api/stripe/sync.js`, `tests/api/stripe-sync.test.mjs`, `tests/api/billing-mail.test.mjs`; spawn in `550`.

**Interfaces:**
- Consumes: Task 2; `sendMail`, `fromAddress` from `admin-mail.js`; RPC.
- Produces:
  - `billing-mail.js`: `confirmationEmail(row, { email, amountPaid, currency, traderName, traderAddress, termsVersion }) → { subject, html, text }`; `claimAndSendConfirmation(row, ctx) → Promise<'sent'|'already'|'failed'>` (PATCH `provider_subscriptions?id=eq.<id>&confirmation_sent_at=is.null` with `Prefer: return=representation` to claim; send only when a row came back; on send failure, PATCH it back to null); `exitEmail(row, endsAt)`, `doublePurchaseEmail(kept, reversed, refunded)`, `reminderEmail(row, kind)`, `alertFounder(subject, lines)` (to `ALERT_EMAIL || 'support@certanvil.com'`).
  - `sync.js` exports `applySession(sessionId, { expectUserId }) → { result, pro, row }` (used by the webhook too) and the endpoint.
  - `rowForSession(session, sub, nowIso)` lives in `landing/api/stripe/_row.js` with `rowForSubscription(sub, eventAt)` (Task 6 consumes both).

Confirmation email copy (new; humanizer stage in Task 22, solicitor check before sales open): subject `Your CertAnvil Pro: what you agreed to`. Body lines, in order: `You're Pro. Here are the details of what you bought, to keep.` · `Plan: Pro Yearly` · `Paid today: £59.00 (tax included)` · `Renews: automatically at £79 a year on 6 Dec 2027, and every year after, until you cancel.` (Monthly: `every month on the 6th`) · `Cancel any time: open Billing at certanvil.com/manage-subscription and choose Cancel. Pro stays on to the end of the period you paid for.` · `What you agreed to at checkout (<consent_at, en-GB date and time, UK>):` then the consent text in quotes · `The Terms you accepted (v1.2): https://certanvil.com/legal/terms-v1.2` · `Seller: <TRADER_NAME>, <TRADER_ADDRESS> · support@certanvil.com`. Sandbox rows prefix the subject with `[TEST] `.

- [ ] **Step 1: Failing tests**

```js
// billing-mail: confirmationEmail for a launch Yearly GBP row contains 'Paid today: £59.00', 'automatically at £79 a year on 6 Dec 2027',
//   the exact consent_text in quotes, 'https://certanvil.com/legal/terms-v1.2', the trader address, 'support@certanvil.com'; no 'refund' anywhere
// billing-mail: claimAndSendConfirmation twice in parallel → exactly one Resend call; Resend 500 → 'failed' and confirmation_sent_at PATCHed back to null
// sync: 401 without token; 400 without session_id; 503 without STRIPE_SECRET_KEY or SUPABASE_URL
// sync: session.client_reference_id !== caller → 403, no RPC
// sync: payment_status 'unpaid' → { result: 'pending', pro: false }, no RPC
// sync: paid session → GET /v1/checkout/sessions/cs_1?expand[]=subscription.latest_invoice, RPC with event id 'sync:cs_1', row has consent_text = session.custom_text.terms_of_service_acceptance.message,
//   consent_at = ISO(session.created), terms_version = env TERMS_VERSION, environment 'production' for livemode true; then one confirmation email → { result: 'applied', pro: true }
// sync: session.livemode false while the key is sk_live_ → 400 mode_mismatch, no RPC
// sync: called again → RPC 'duplicate', no second email, { pro: true }
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement.** `rowForSession`: `user_id` = `client_reference_id`, `provider 'stripe'`, `provider_customer_id`, `provider_subscription_id`, `plan` from `planForPrice`, `currency`, `status` via `mapStripeStatus` (Task 6 signature; define it in `_row.js` now), `current_period_start/end`, `launch_price_until` = period end when `total_details.amount_discount > 0`, consent fields, `environment` = `livemode ? 'production' : 'sandbox'`, `last_event_at` = now. User email for the mail = `session.customer_details.email`.
- [ ] **Step 4: Run, pass.** **Step 5: Commit** `payments A5: confirmation email with the consent record, and sync from the paid session`

---

### Task 6: `POST /api/stripe/webhook`

**Files:** Create `landing/api/stripe/webhook.js`, `tests/api/stripe-webhook.test.mjs`; spawn in `550`.

**Interfaces:**
- Consumes: Task 2 (`verifyStripeSignature`, `stripeRequest`, `stripeMode`, `stripe-ops`); Task 5 (`applySession`, `_row.js`, `billing-mail.js`); `logServerError`.
- Produces: `mapStripeStatus(sub) → status` in `_row.js`: `past_due` → `grace` when `sub.latest_invoice.next_payment_attempt` is set and the invoice is under 21 days old, else `unpaid`; `paused` → `unpaid`; others unchanged. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `ALERT_EMAIL`. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `charge.dispute.created`.

- [ ] **Step 1: Failing tests** (sign each body with node:crypto; stub Stripe and the RPC):

```js
// bad signature → 400; missing env → 503; non-POST → 405
// event.livemode false with sk_live_ → 400 mode_mismatch and a client_errors write; true with sk_test_ → 400
// checkout.session.completed → applySession path: RPC row user/provider/plan/currency/status/tier as before, consent fields set, one confirmation email
// customer.subscription.updated past_due with next_payment_attempt set → 'grace'; next_payment_attempt null → 'unpaid' (not Pro); canceled → tier 'free'
// charge.refunded full → DELETE /v1/subscriptions/sub_1 BEFORE the RPC, then RPC { status: 'revoked', tier: 'free', revoked_at }
// charge.refunded full, DELETE answers 500 → webhook 500, RPC not called; the retry (same event) → DELETE 200, RPC 'applied', 200
// charge.refunded full where the RPC answers 'duplicate' → DELETE still called (idempotency key 'cancel:sub_1')
// charge.refunded partial → RPC with _noop, no DELETE; charge.dispute.created → same as a full refund
// RPC 'unmatched' for a sub whose status is active → 200 { result: 'unmatched' } and one alertFounder 'Unmatched live subscription' naming sub_1
// RPC throws → 500 and a client_errors write
// double purchase: user already has an entitling Apple or Stripe row when sub_2's checkout completes →
//   cancelNow('sub_2'), refundLatestInFull('sub_2'), one doublePurchaseEmail to the customer, one alertFounder 'Double Pro purchase reversed'; 200
// deleted user (RPC unmatched for a user_id gone from auth.users) on customer.subscription.deleted → 200, no alert (status canceled)
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement**, porting the branch's `webhook.js` structure to Edge: raw body via `await req.text()`; mode check; every event re-retrieves its object (`/v1/subscriptions/:id?expand[]=latest_invoice`, `/v1/charges/:id?expand[]=invoice`); for a full refund or dispute, `cancelNow(subId, 'cancel:' + subId)` first (404 is done; other failure → 500), then the RPC. `checkout.session.completed` calls `applySession(session.id, {})`. The double-purchase check reads `readSubs(userId)` before applying and reverses the **new Stripe** subscription.
- [ ] **Step 4: Run, pass.** **Step 5: Commit** `payments A6: webhook with mode check, cancel-before-revoke, auto-reversed double purchase`

---

### Task 7: Cancel and resume, portal and billing status

**Files:** Create `landing/api/stripe/subscription.js`, `landing/api/stripe/create-portal-session.js`, `landing/api/billing/status.js`, `tests/api/stripe-subscription.test.mjs`, `tests/api/stripe-portal.test.mjs`, `tests/api/billing-status.test.mjs`; spawn in `550`.

**Interfaces:**
- Consumes: Task 2, Task 5 `exitEmail`, `alertFounder`.
- Produces: the three contract endpoints. Portal `flow`: `card → payment_method_update`, `switch → subscription_update` (`flow_data[subscription_update][subscription]` = the entitling Stripe row's id); `return_url` = `safeReturn(returnTo, siteOrigin + '/manage-subscription')`. `subscription` `cancel` → `POST /v1/subscriptions/:id cancel_at_period_end=true`, RPC row update (event id `ui-cancel:<sub>:<ms>`), `exitEmail`, and when `reason` is set, one mail to support (`Cancel reason: Passed my exam | Too expensive | Something else` + note); `resume` → `cancel_at_period_end=false`.

- [ ] **Step 1: Failing tests**

```js
// subscription: 401 / 404 no_billing_account / 503; cancel → Stripe POST cancel_at_period_end=true, response { status: 'cancelled', endsAt: ISO(period end) }, one exit email 'Pro stays on until 14 Mar 2027'
// subscription: cancel with reason 'else' and note 'too hard' → one extra mail to support@certanvil.com, subject 'Cancel reason: Something else'; no RESEND_API_KEY → no mails, still 200
// subscription: resume → cancel_at_period_end=false → { status: 'active' }; an apple-only account → 404 no_billing_account
// portal: flow 'card' → flow_data[type]=payment_method_update; 'switch' → subscription_update with sub_1; 'cancel' → 400 bad_flow
// status: free → { pro:false, source:null, plan:null, status:'free', renewsAt:null, endsAt:null, launchFirstYear:false, fullPriceFrom:null, currency:null, salesOpen:false, canBuy:false }
// status: SALES_OPEN_AT passed → salesOpen true, canBuy true; closed but billing_test_accounts member → canBuy true
// status: admin → source 'admin'; web yearly launch buyer → launchFirstYear true; apple row → source 'apple'; sandbox row for a non-allowlisted user → status 'free'
// status: ?detail=1 → card { brand:'visa', last4:'4242' }; Stripe down → card null, still 200; CORS for https://networkplus.certanvil.com; Cache-Control no-store
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement.** `billing/status` = `summarize(rows, role, now, { allowSandbox })` minus `row`, plus `salesOpen`, `canBuy`.
- [ ] **Step 4: Run, pass.** **Step 5: Commit** `payments A7: one-step cancel with exit email, portal card/switch, billing status with canBuy`

---

### Task 8: Daily billing job, part 1: release billing before an account is purged

**Files:** Create `landing/api/cron/billing-daily.js`, `landing/api/_lib/billing-release.js`, `tests/api/billing-daily.test.mjs`. Modify `supabase/migrations/20261101_provider_subscriptions.sql` (purge guard), `tests/payments-db.test.mjs`, `landing/vercel.json` (`crons` gains `{ "path": "/api/cron/billing-daily", "schedule": "0 5 * * *" }`), `tests/uat/550-payments-db.js`.

**Interfaces:**
- Consumes: `cancelNow`, `voidOpenInvoices`; RPC; `alertFounder`.
- Produces: `releaseStripe(row) → Promise<'released'|'failed'>` (cancel now, void open invoices, RPC row `{ status: 'canceled', tier: 'free', released_at: now }` with event id `release:<sub>`); `export const releasers = { stripe: releaseStripe }` (Plan B adds `apple`); the endpoint `GET /api/cron/billing-daily` (requires `Authorization: Bearer <CRON_SECRET>`; Vercel cron sends it) → `{ released, regraced, reminded, confirmations, alerts }`. Task 9 adds the other three jobs to this handler.

Why here and not at the deletion request: deletion has a 7-day undo, so cancelling at request time silently stops renewal for someone who comes back, and a failed client call left deleted accounts billed. The purge now waits for the release.

- [ ] **Step 1: Failing tests**

```js
// payments-db: purge skips an account due for purge that has a production stripe row, status active, released_at null
await t('purge waits for billing release, then purges', async () => {
  await markDue(PAYER); await insertRow(PAYER, { provider: 'stripe', status: 'active' });
  await db.query('select purge_deleted_accounts()'); assert.equal(await exists(PAYER), true);
  await db.query("update provider_subscriptions set released_at = now(), status = 'canceled' where user_id = $1", [PAYER]);
  await db.query('select purge_deleted_accounts()'); assert.equal(await exists(PAYER), false);
});
// payments-db: an ended stripe row (status canceled) does not block; an apple row with released_at null blocks; a sandbox row never blocks
// payments-db: ROLLBACK restores the 20261029 purge body (no guard)
// billing-daily: no or wrong CRON_SECRET → 401; missing env → 503
// billing-daily: an account due for purge (deletion_requested_at 7 days + 1 minute ago) with an active stripe row → DELETE sub, invoices voided, RPC released_at set → { released: 1 }
// billing-daily: an account inside its 7-day window → nothing touched (signing back in leaves the subscription alone)
// billing-daily: Stripe 500 on the cancel → { released: 0, alerts: 1 } and alertFounder 'Deleted account still billed' naming the user and sub
// billing-daily: an apple row and no releasers.apple → alertFounder once, nothing thrown
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement.** Purge guard: in the copied `purge_deleted_accounts()` loop, after the re-check, `continue` (with `raise log 'purge_deleted_accounts: % waits for billing release', r.id`) when `exists (select 1 from public.provider_subscriptions s where s.user_id = r.id and s.environment = 'production' and s.released_at is null and (s.provider = 'apple' or s.status not in ('canceled','expired','revoked','incomplete_expired')))`. Add an audit row `purge_deleted_accounts waits for billing release` (`prosrc ilike '%released_at%'`). The cron selects due accounts the same way the purge does (`deletion_requested_at < now() - interval '7 days'`, last sign-in not after the mark) through a service-role RPC `billing_release_candidates()` returning `provider_subscriptions` rows (add it to the migration, service role only, plus its audit row).
- [ ] **Step 4: Run, pass.** **Step 5: Commit** `payments A8: deleted accounts stop being billed at purge, server-side, with a purge guard`

---

### Task 9: Daily billing job, part 2: grace re-check, renewal reminders, missed confirmations

**Files:** Modify `landing/api/cron/billing-daily.js`, `landing/api/_lib/billing-mail.js`; extend `tests/api/billing-daily.test.mjs`.

**Interfaces:** Consumes Task 5 (`reminderEmail`, `claimAndSendConfirmation`), Task 6 (`rowForSubscription`), RPC. Produces nothing new.

Jobs: (a) **grace re-check**: every production Stripe row in `grace` is re-retrieved and re-applied (event id `daily:<sub>:<YYYY-MM-DD>`), so exhausted retries end Pro even if Stripe's setting leaves the subscription past due. (b) **renewal reminders (D15)**: Yearly, active, not cancelling, period end within 30 days, `renewal_reminded_for` ≠ period end → `reminderEmail(row, 'yearly')`, then PATCH `renewal_reminded_for`; Monthly when the upcoming renewal is a multiple of 6 months after `created_at` and the period end is within 7 days. (c) **missed confirmations**: production and sandbox Stripe rows with `consent_at` set, `confirmation_sent_at` null, created over 10 minutes ago → `claimAndSendConfirmation`.

Reminder copy (new; humanizer + solicitor check): Yearly subject `Your CertAnvil Pro renews on 6 Dec 2027`; body `Your Pro Yearly renews automatically on 6 Dec 2027 at £79 for the year.` (launch buyers add `Your first-year price of £59 ends then.`) `If you don't want it to renew, cancel before then at certanvil.com/manage-subscription. Pro stays on until 6 Dec 2027 either way.` Monthly: `You're on Pro Monthly at £8.99 a month, renewing on the 6th of each month until you cancel. To stop it, cancel at certanvil.com/manage-subscription.`

- [ ] **Step 1: Failing tests:** a grace row whose re-retrieved sub has `next_payment_attempt: null` → RPC writes `unpaid` → `{ regraced: 1 }`; a launch Yearly row ending in 29 days → one email containing `at £79 for the year` and `Your first-year price of £59 ends then.`, second run sends nothing; a Yearly row ending in 31 days → none; a cancelling row → none; a Monthly row created 5 months 27 days ago, period end in 3 days → one email; 2 months in → none; an unconfirmed row 11 minutes old → one confirmation; 5 minutes old → none; Apple rows are skipped by all three (Apple sends its own).
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass.** **Step 5: Commit** `payments A9: grace re-check, renewal reminders for every plan, missed confirmations`

---

### Task 10: Meter AI questions on the server

**Files:** Modify `api/ai/generate.js`, `app.js` (`_claudeFetch` body rewrite only, net 0 lines). Create `tests/ai-metering.test.mjs`; spawn it from `tests/uat/550-payments-db.js`.

**Interfaces:**
- Consumes: `consumeQuota`, `rlCheck`, `badJson` in `api/ai/generate.js`; RPC `is_pro`.
- Produces: request field `_purpose: 'questions'|'infra'` (stripped before Anthropic). Env `INFRA_DAILY_LIMIT` (default 45).

Rule: every call is metered against the daily quota unless `_purpose === 'infra'`. Infra calls from a user who is not Pro (one `is_pro` RPC, fail closed to "not Pro") also pass `rlCheck(token, 'infra:' + userId, INFRA_DAILY_LIMIT, '1 day')`; over it → `429 quota_exceeded` with the same body as the quota path. `_metered` is ignored. In `app.js`, `_claudeFetch` rewrites the body so `_metered: true` becomes `_purpose: 'questions'` and anything else becomes `_purpose: 'infra'` (the first-run free check stays free through the infra cap).

- [ ] **Step 1: Failing tests** (`tests/ai-metering.test.mjs`, handler with `req`/`res` doubles as `tests/api/*` do for Node handlers): a body with no `_metered` and no `_purpose` calls `consume_daily_quota`; `_metered: false` alone still meters; `_purpose: 'infra'` from a Free user calls `rl_check` with key `infra:<uid>` and not `consume_daily_quota`; the 46th infra call answers 429 `quota_exceeded`; a Pro user's infra calls skip the infra cap; `_purpose` and `_metered` never reach the Anthropic request body. UAT: `_claudeFetch` maps `_metered: true` to `_purpose: 'questions'`; `app.js` line count unchanged.
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass** (`node tests/uat.js`, `node tests/tech-debt.js`). **Step 5: Commit** `payments A10: the server meters AI questions; dropping a flag no longer skips the daily limit`

---

### Task 11: The web delete-account page

**Files:** Create `landing/lib/delete-account.js`. Modify `landing/lib/account.js` (`wireDeleteAccount` opens the page instead of the bare confirm box), `landing/lift-billing.css` (created here if Task 19 has not yet), `tests/e2e/landing-deletion.spec.js` (extend).

**Interfaces:** Consumes `GET /api/billing/status`; the existing `request_account_deletion` RPC and global sign-out. Produces nothing new. The app (`features/home.js`) deletion chain is unchanged: no client call to billing (Task 8 releases billing server-side).

Copy (drawing G, web variants): lead `This removes your progress, history and Pass Plan from every device. Sign in within 7 days to cancel. After that it can't be undone.` (founder-approved). Web-billed Pro: `Your Pro ends with your account` / `We cancel it when your account is deleted, so there are no more charges.` Apple-billed Pro: `You're still billed by Apple. Deleting your account doesn't stop that. Cancel in your Apple ID.` + link `Open Apple subscriptions` → `https://apps.apple.com/account/subscriptions`. Free/owner: no box. Field `Type DELETE to confirm`; `Delete my account` enabled only for `DELETE` (trimmed, upper-cased); never gated on billing.

- [ ] **Step 1: Failing e2e** (`--project=landing`): web-billed shows the web note; Apple-billed shows the warning and link and Delete enables after typing DELETE; Free shows no box; the call log is `['rpc:request_account_deletion', 'auth:signOut:global']` with no billing call; billing status 500 → no box, Delete still works; 390px no horizontal scroll.
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass.** **Step 5: Commit** `payments A11: web delete-account page with the billing notes`

---

### Task 12: Pro state in the app (`features/pro-state.js`)

**Files:** Create `features/pro-state.js`, `tests/uat/551-pro-state.js`, `tests/e2e/pro-state.spec.js`. Modify `app.js` (`_refreshQuotaChip` body), `index.html` (script tag immediately after `app.js`), `sw.js` (`SHELL_ASSETS`), `lib/cert-lock.js` (`check`), `lib/router.js` (`getTier`), `lib/onboarding-boot.js` (`ca:quota-ready` listener).

**Interfaces:**
- Consumes: `window.certanvilSupabase`, `get_daily_quota_usage`, `window._adminPreview.wrap`, `_renderQuotaChip`, event `ca:quota-ready`, `window.onbHome.sync` (if present).
- Produces: `window.refreshProState({ force }) → Promise<{ pro, source: 'server'|'cache'|'none' }>`; `window.caProLastKnown(uid?) → boolean` (device key `nplus_pro_lastknown` = `{ uid, pro: true, at }`, written only on a server Pro answer, removed on a Free answer or sign-out); `window.caProConfirmed() → boolean` (in-memory, true after a server Pro answer in this page); `window.caApiBase() → string`: `https://certanvil.com`, except on `localhost` or `*.vercel.app` hosts where `?api=<origin>` (kept in `sessionStorage.ca_api`) is honoured if it matches `^https://certanvil-landing-[a-z0-9-]+\.vercel\.app$` or `^http://localhost:\d+$`.

Rules: `getTier(profile)` → `'pro'` for admin or `window.caProConfirmed && caProConfirmed()`; the `metadata.tier` branch is **deleted** (users can write their own metadata). The cache lifts the quota chip and limits for display only; `cert-lock` lifts only on `caProConfirmed()` or `_quotaState` Pro from a server answer, never from the cold-load cache. On `ca:quota-ready` with Pro, set `window._onbTier = 'pro'` and call `onbHome.sync()` when present, and remove `#cl-wall` / `html.cl-locked`.

- [ ] **Step 1: Failing e2e** (`tests/fixtures/fake-supabase.js` routing as `landing-deletion.spec.js` does; chromium, webkit, mobile-safari):

```js
test('rpc resolves { data: null, error } and the Pro answer is under 24h old: chip stays Pro', ...);   // the supabase-js network shape, not a rejection
test('a failed Pro check with a 25h-old answer does not invent Pro', ...);
test('a cold load with only the cache does not lift the cert wall', ...);   // cache pro, rpc errors, ?cert=secplus → #cl-wall present
test('a Free answer from the server clears the cache', ...);
test('?pro=1 forces a fresh check, retries, then keeps checking every 15s for 5 minutes', ...);   // page.clock: Free until 40s, then Pro → chip flips with no tab switch; url has no pro=
test('returning to a hidden tab re-checks Pro', ...);
test('a paying non-admin is not walled on a second cert', ...);
test('a paying non-admin with onboarding enabled sees the Pro switcher and is not routed to freeCertId', ...);
test('profile.metadata.tier = "pro" alone does not make anyone Pro', ...);
test('caApiBase honours ?api= on a vercel.app host and ignores it on certanvil.com', ...);
```

UAT (`551-pro-state.js`): script tag right after `app.js` and in `SHELL_ASSETS`; `_refreshQuotaChip` delegates to `window.refreshProState`; `getTier` has no `metadata` / `meta.tier` read; `app.js` line count ≤ before. Grep the e2e suites for tests that set `metadata.tier` to get Pro and switch them to a fake RPC Pro answer in this task.

- [ ] **Step 2: Run, fail.**
- [ ] **Step 3: Implement.** `refreshProState`: signed out → clear cache, `{ pro:false, source:'none' }`. RPC answer (`resp.error` null and `resp.data` present) → wrap with `_adminPreview`, set `_quotaState`, render, dispatch `ca:quota-ready`, write/clear cache, set the confirmed flag. `resp.error || !resp.data` or a throw → if `caProLastKnown(uid)`, set `_quotaState = { tier:'pro', daily_limit:-1, used_today: prev || 0, fromCache: true }`, render, dispatch, `source:'cache'`; else leave state. `?pro=1`: force, then every 2.5s for 4 tries, then every 15s up to 5 minutes, stopping on Pro; then `history.replaceState` without `pro`. Listeners: `visibilitychange` (visible) and `pageshow` (persisted), at most once per 30s. `_refreshQuotaChip` becomes a one-line delegate.
- [ ] **Step 4: Run, pass** (`npx playwright test tests/e2e/pro-state.spec.js --project=chromium --project=webkit --project=mobile-safari`, `node tests/uat.js`, `node tests/tech-debt.js`).
- [ ] **Step 5: Commit** `payments A12: Pro state from the server; router and cert lock follow it; no metadata tier`

---

### Task 13: The paywall and the purchase chokepoint (`features/paywall.js`)

**Files:** Create `features/paywall-copy.js`, `features/paywall.js`, `tests/e2e/paywall.spec.js`, `tests/uat/552-paywall.js`. Modify `index.html` (`paywall-copy.js` then `paywall.js` immediately after `pro-state.js`, before any `features/ios-*.js`), `sw.js`, `dg-system.css` (paywall rules + `?v=` bump), `auth-state.js` (`buildSignInUrl(opts)`). The landing sign-in page shows the purchase variant for `intent=pro&plan=` once Plan C Task 4 ships; until then the generic sign-in shows and the pending plan still resumes.

**Interfaces:**
- Consumes: `iosSettings.openSheet(html, onTap, { size: 'sm' })` / `closeSheet()` (headline `id="ist-sheet-title"`); `/api/pricing`, `/api/stripe/create-checkout-session` via `caApiBase()`; `refreshProState`; `CURRENT_CERT`; `CertRegistry.get(id).shortName` for cert labels.
- Produces: `window.PAYWALL_COPY.copyFor(trigger, ctx) → { eb, h, p, second }`; `window.openPaywall(trigger, opts?) → boolean`; `window.startProUpgrade(plan) → Promise<void>`; `window.nativePurchase` stub (`window.nativePurchase = window.nativePurchase || (() => Promise.resolve(false))`); `window.CAPaywall = { TRIGGERS, shellHtml(innerHtml), close() }`; a delegated click handler for `[data-paywall="<trigger>"]` (`preventDefault`, then `openPaywall`; closes an enclosing `.quota-exceeded-modal` / `#pro-only-modal`; when `openPaywall` returns `false` the default action runs); `buildSignInUrl({ intent: 'pro', plan })` appends `&intent=pro&plan=<plan>`.

Native rule: `openPaywall` on `html.is-native` → `typeof window.nativePaywall === 'function' ? (window.nativePaywall(trigger, opts), true) : false`. Plan B never reassigns `openPaywall`, so load order cannot undo either side.

**Copy table** (single source for every surface; drawing screen B):

| Trigger | Eyebrow | Headline | Body | Second button |
|---|---|---|---|---|
| `limit` | Daily limit | You've used today's 15 questions | Your free questions come back at midnight. Pro lifts the limit, so you can keep going now. | Come back tomorrow |
| `run` | `opts.eyebrow` or Reword Gauntlet | That was today's free run | Free includes one Gauntlet run a day. With Pro you can run it as often as you like. (Sim Lab / Decision Lab: "one Sim Lab run", "one Decision Lab run") | Not now |
| `feature:Exam Simulator` | Exam Simulator | Sit the full practice exam | 90 timed questions with PBQs, scored on the real 100 to 900 scale. Part of Pro. | Not now |
| `feature:pro` (Settings, generic, unknown triggers) | Pro | Unlock every cert with Pro | Free covers one cert and 15 questions a day. Pro lifts both. | Not now |
| `feature:<other>` | `<other>` | `opts.title` or `Unlock <other> with Pro` | `opts.body` or `Part of Pro, along with unlimited questions in every cert.` | Not now |
| `cert:<id>` | `<label>` | Add `<label>` with Pro | Free covers one cert. Pro opens every cert, and your `<owned label>` progress stays where it is. | Stay on `<owned label>` |

"15" is `_quotaState.daily_limit`. Plan rows: Yearly (picked) then Monthly. Yearly badge `Launch offer` while the launch is active, else `Save N%` (N = round((1 − yearly ÷ (12 × monthly)) × 100)); Yearly `$89` + small `a year`, sub `$7.42 a month`; during launch `$69` + small `first year`, sub `Then $89 a year` (no strike-through). Monthly `$9.99` + small `a month`. Launch line (Yearly picked, launch active): `$69 for your first year, then $89 a year. Ends 23:59 UK time, 1 Dec.` (`endsAt` in `Europe/London`). Ticks: `Unlimited questions in every cert`, `Exam Simulator and full labs`, `Drills that fix your mistakes`. Renew line: `Renews automatically at $89 a year until you cancel.` / `… at $9.99 a month …`. Button `Get Pro` (`data-web-purchase`), second button, trust `Cancel anytime · Secure checkout by Stripe`. **Before sales open** (`salesOpen` false and the account cannot buy: `/api/pricing` `salesOpen` false and no `canBuy` from a cached billing status): no plan rows, renew or trust lines; a line `Pro launches soon.` and the button `Get notified` (`data-web-purchase`, link to `https://certanvil.com/pricing`), second button unchanged. Already Pro: `You're already Pro` / `This account has Pro, so there's nothing to buy. Everything is unlocked.` / `Back to studying`. Failure: `Checkout didn't open. Try again in a moment.` `403 sales_closed` → the before-sales body. `503 try_again` → the failure line. Cancelled toast: `Checkout cancelled. No charge was made.`

- [ ] **Step 1: Failing e2e** (`tests/e2e/paywall.spec.js`; 1280×820 and 390×844; route `https://certanvil.com/api/**`):

```js
test('limit paywall: headline, Yearly picked, prices from /api/pricing, renew line', ...);   // gbp → '£79', '£6.58 a month', '£8.99'
test('launch on: £59 first year, Then £79 a year, launch line with UK time, nothing struck through', ...);   // no <s> or text-decoration line-through inside .pw
test('picking Monthly swaps the renew line and drops the launch line', ...);
test('before sales open: Pro launches soon, Get notified links to certanvil.com/pricing, no prices', ...);
test('checkout 403 sales_closed switches to the before-sales body', ...);
test('desktop opens a centred dialog, phone opens the bottom sheet', ...);
test('Get Pro posts plan, currency, from and returnTo, then navigates to the returned url', ...);
test('double tap on Get Pro sends one checkout request', ...);
test('409 already_pro shows You\'re already Pro', ...);
test('503 try_again shows the failure line and unlocks the button', ...);
test('the owner in Preview as Free sees You\'re already Pro, never Stripe', ...);
test('pricing unreachable: plans named without amounts, no NaN or undefined, Get Pro still works', ...);
test('signed out: Get Pro goes to sign-in with intent=pro&plan=monthly and resumes checkout once after sign-in', ...);   // pending plan TTL 2 hours
test('?checkout=cancelled shows the toast once and drops the param', ...);
test('html.is-native without nativePaywall: openPaywall returns false and nothing opens', ...);
test('html.is-native with a nativePaywall stub: openPaywall returns true and calls it with the trigger', ...);
test('Escape, scrim and the second button close it; focus returns to the opener', ...);
```

UAT (`552-paywall.js`): `paywall-copy.js` then `paywall.js` come right after `pro-state.js` and before every `features/ios-*.js`; both in `SHELL_ASSETS`; `dg-system.css?v=` differs from `git show main:index.html`; no `$`, `£` or `€` followed by a digit in `features/paywall*.js`; no em dash; no `<s>` or `line-through` in the paywall CSS or markup; no assignment to `window.openPaywall` outside `paywall.js`.

- [ ] **Step 2: Run, fail.**
- [ ] **Step 3: Implement `openPaywall`**: native rule above; else fetch pricing once per page (cached promise; failure → `null`), render via `iosSettings.openSheet`, return `true`. Layout and classes lift the drawing's `paywall()`, `planRows()`, `alreadyPro()` under `.pw`, tokens mapped to `dg-system.css`, all scoped under `.pw`.
- [ ] **Step 4: Implement `startProUpgrade(plan)`**: (1) Pro per `_quotaState` → already-Pro; (2) `html.is-native` → `return window.nativePurchase(plan)`; (3) no session → `sessionStorage.ca_pending_plan = { plan, at }`, go to `buildSignInUrl({ intent: 'pro', plan })`; (4) lock, POST checkout `{ plan, currency, from: CURRENT_CERT, returnTo: location.origin + location.pathname }`, then 409 / 403 / 503 / 200 as above. On `ca:quota-ready`, a pending plan under 2 hours old resumes once and is removed.
- [ ] **Step 5: Run, pass** on chromium, webkit, mobile-safari; `node tests/uat.js`.
- [ ] **Step 6: Commit** `payments A13: one paywall, one purchase chokepoint, the before-sales state`

---

### Task 14: Gate hand-offs in `app.js`

**Files:** Modify `app.js` (`_showQuotaExceededUI`, `_showProOnlyUI`, `_showDailyLimitPreblockUI`, `_gateActivityForQuota`; the tooltip, quota modal, pre-block and Pro-only card pricing links: find them with `grep -n "certanvil.com/pricing" app.js`). Create `tests/uat/553-go-pro-paths.js` (app.js block), `tests/e2e/go-pro-paths.spec.js` (app.js block).

**Interfaces:** Consumes `openPaywall`, the `data-paywall` delegate. Produces nothing.

Also add to `dg-system.css` (with the `?v=` bump): `html.is-native:not(.ca-iap) [data-paywall]{display:none!important}` next to the ADR-004 rule, so the iPhone keeps today's hiding until Plan B turns on `ca-iap`.

Rules: `_showQuotaExceededUI` and `_showProOnlyUI` start with `if (detail && detail.trigger && window.openPaywall && window.openPaywall(detail.trigger, detail)) return;` folded into an existing first line; `_gateActivityForQuota` passes `trigger: 'limit'`. Each pricing `<a>` keeps its `href`, gains `data-paywall` (not `data-web-purchase`), drops any price from its label, loses `target="_blank"` / `rel`: tooltip and pre-block → `limit`; quota modal → `limit`; Pro-only card → `feature:<detail.feature>` and its label `Unlock with Pro`. Net `app.js` lines ≤ 0.

- [ ] **Step 1: Failing tests.** UAT: no `certanvil.com/pricing` link in `app.js` without `data-paywall`; none has `target="_blank"` or a `$`/`£`/`€` digit in its label; `dg-system.css` has the `:not(.ca-iap) [data-paywall]` rule; `app.js` line count ≤ before (run `node tests/tech-debt.js`). E2E (three projects): Free at 15/15 starting a quiz sees the `limit` paywall; Exam Simulator shows the Pro card, `Unlock with Pro` opens `Sit the full practice exam`; with `html.is-native` and no `nativePaywall`, today's modal draws.
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass.** **Step 5: Commit** `payments A14: app.js gates hand off to the paywall`

---

### Task 15: Pricing links outside `app.js` open the paywall

**Files:** Modify `index.html` (both `.settings-go-pro-btn`), `lib/cert-lock.js` (wall CTA), `features/sr-review.js` (review-cap link), `features/ios-hub.js` (desk card: drop the hardcoded `From $7.42 a month. Cancel anytime.`), extend `553` and `go-pro-paths.spec.js`.

**Interfaces:** Consumes the delegate. Produces nothing.

Rules: `.settings-go-pro-btn` → `data-paywall="feature:pro"` (not `limit`: the person has not hit a limit); cert-lock → `cert:<here>` with `data-paywall-owned="<owned id>"`; sr-review → `limit`; ios-hub desk card → `cert:<id>`; ios-hub "Every cert" hand-offs pass `trigger: 'cert:<id>'`. Same `href` / `data-paywall` / no price / no `target` rules as Task 14; no em dash in labels.

- [ ] **Step 1: Failing tests.** UAT: no `certanvil.com/pricing` link in `index.html`, `lib/`, `features/` lacks `data-paywall`; `ios-hub.js` has no `$7.42`. E2E: Settings Go Pro opens `Unlock every cert with Pro` (not the limit headline); cert-lock `Unlock all exams · Pro` opens `Add Security+ with Pro` with `Stay on Network+`.
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass.** **Step 5: Commit** `payments A15: pricing links open the paywall`

---

### Task 16: iOS-layout buttons, the run stop and free-limit copy

**Files:** Modify `features/ios-firstrun.js` (`goPro`, the `20 questions a day` copy), `features/ios-settings.js` (`ON.gopro`), `features/ios-simlab.js` (`simLabSummaryUpsell`), `lib/onboarding-chrome.js` (`go-pro`), `features/flagship-drills.js` (`_gateGauntletDaily`), `features/ios-drills.js` (`_idState` blocked branch), `features/sim-lab.js` or the module that renders `renderSimLabHomeEntry` (blocked branch); extend `553` and `go-pro-paths.spec.js`.

**Interfaces:** Consumes `openPaywall`. Produces nothing.

Rules: button CTAs call `openPaywall(trigger)`; when it returns `false`, keep today's behaviour. `ios-firstrun goPro` → `limit`; `ios-settings ON.gopro` → `feature:pro`; `ios-simlab` upsell → `run` with `{ eyebrow: 'Sim Lab' }`; `onboarding-chrome go-pro` → `feature:pro`. `_gateGauntletDaily` passes `trigger: 'run'`. **PBQ / Decision Lab second run:** the surface is the home entry's blocked state (`node scripts/graphq.js callers _pbqFreeRunsToday` shows `_idState` and `renderSimLabHomeEntry`): when a Free user who has used today's run taps the entry's start or "Run again", call `openPaywall('run', { eyebrow: 'Sim Lab' })` (Decision Lab: `'Decision Lab'`) instead of starting; never mid-run. Copy: `ios-firstrun.js` `20 questions a day` → `15 questions and 5 review cards a day`.

- [ ] **Step 1: Failing tests.** UAT: no `20 questions a day` in `ios-firstrun.js`. E2E (three projects): Gauntlet second start shows `That was today's free run` over the result; Sim Lab entry after today's run opens the `run` paywall with eyebrow `Sim Lab`; Decision Lab the same with `Decision Lab`; with `html.is-native` and no `nativePaywall`, today's fallbacks only.
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass.** **Step 5: Commit** `payments A16: buttons, the run stop and 15-question copy`

---

### Task 17: The two gentle nudges

**Files:** Modify `features/paywall.js`, `features/quiz-engine.js` (`render`, nudge host), `features/ios-settings.js` (`cal-save`) and the desktop exam-date dialog (both through `setExamDate`); extend `go-pro-paths.spec.js`.

**Interfaces:** Produces `window.renderPaywallNudge(hostEl)` (fills the host with `10 of today's 15 used` + `See Pro` link when Free and `10 ≤ used_today < daily_limit`, else empties it) and `window.showExamDateNudge(dateIso)` (one toast-style line, never a modal, after a Free user saves an exam date: `Exam on <D Mon>. Pro lifts the daily limit until then.` + `See Pro` → `openPaywall('feature:pro')`; once per date; nothing for Pro or admins; nothing on `html.is-native` unless `nativePaywall` exists).

The nudge host is a `.pw-nudge` element after `#options`, never inside it (`pick()` targets `#options .option`).

- [ ] **Step 1: Failing e2e:** 10/15 shows the nudge line and `See Pro` opens `limit`; 9/15 and 15/15 show none; Pro sees none; `exam-date nudge: Free sees one line once, Pro sees nothing`.
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass.** **Step 5: Commit** `payments A17: quota and exam-date nudges`

---

### Task 18: Grace banner and Pro-ended screen in the app

**Files:** Create `features/billing-notices.js`, `tests/e2e/billing-notices.spec.js`. Modify `index.html`, `sw.js`, `dg-system.css` (`.ca-grace`, `?v=` bump).

**Interfaces:**
- Consumes: `/api/billing/status` (once per load after the first signed-in `ca:quota-ready`), portal `{ flow: 'card' }`, `startProUpgrade`, `iosSettings.openSheet`.
- Produces: device key `nplus_pro_ended_seen` = the `endsAt` already shown. On `html.is-native` this module renders nothing (Plan B owns the iPhone versions).

Copy (drawing E): web banner `Your card didn't go through. Update it to keep Pro.` / `Pro stays on while we try again.` / `Update card`. Apple-billed on the web: `Apple couldn't renew your Pro.` / `Update your payment method in Apple to keep it. Pro stays on in the meantime.` / `Open Apple` → `https://apps.apple.com/account/subscriptions`. Ended: eyebrow `Pro`, `Your Pro has ended`, `Your progress is kept: every answer, streak and score. You're back on Free, with 15 questions and 5 review cards a day on <cert label>.`, `Renew: $89 a year. Renews automatically until you cancel.`, `Renew Pro` (`data-web-purchase`, `startProUpgrade('yearly')`), `Continue on Free`.

- [ ] **Step 1: Failing e2e** (three projects): stripe grace → banner atop Home with `Update card` posting `flow: 'card'`; apple grace → `Open Apple`; ended → dialog once, reload no repeat, new `endsAt` shows again; `Continue on Free` closes; Free and Pro → nothing; status 500 → nothing, no console error; `html.is-native` → nothing rendered by this module.
- [ ] **Step 2: Run, fail.** **Step 3: Implement** (lift `graceBanner()` and `endedBody()`). **Step 4: Run, pass.** **Step 5: Commit** `payments A18: grace banner and Pro-ended screen`

---

### Task 19: `/account`: status line and the confirmation page

**Files:** Create `landing/lib/cert-registry.js` (byte copy of `lib/cert-registry.js`), `landing/lib/billing.js`, `landing/lib/checkout-return.js`, `landing/lift-billing.css` (if not created in Task 11), `tests/e2e/landing-account-pro.spec.js`. Modify `landing/account.html` (load the files; `#acct-plan-row`; `#checkout-return` host), `landing/lib/account.js` (every `role === 'admin'` Pro decision reads `pro` from billing status; `#btn-upgrade` becomes `Get Pro` → `/pricing`, `data-web-purchase`), `tests/uat/546-landing-cert-drift.js` or a new check in `553`: `landing/lib/cert-registry.js` is byte-identical to `lib/cert-registry.js`.

**Interfaces:**
- Consumes: `/api/billing/status`, `/api/pricing`, `/api/stripe/sync`, `/api/stripe/create-checkout-session`, `/api/stripe/create-portal-session`, `/api/stripe/subscription`; `profile.active_cert`; `window.CertRegistry`.
- Produces: `window.caBilling = { status(detail?), sync(sessionId), checkout(plan, currency), portal(flow, extra), subscription(action, extra), certHost(id), fmtDate(iso) }` (`certHost` = `CertRegistry.get(id).host` plus the `?exam=` rule for A+); the DOM event `ca:checkout-pro` (detail `{ plan, from }`) dispatched once when the page reaches You're Pro. Plan C's analytics listens to it.

Status line (drawing D): `Pro · Yearly · renews 14 Mar 2027` + `Billing`; Apple `Pro · Yearly · billed by Apple` + `Billing`; Free `Free` + `Get Pro`; cancelled `Pro until 14 Mar 2027`; grace `Pro · Yearly · payment due`; owner `Pro · Owner`.

Confirmation (`?checkout=success&session_id=…[&from=<id>]`, drawing C): first `caBilling.sync(session_id)` once, then poll status every 3s. `Confirming your payment…` / `This takes a few seconds. Keep this page open.` → `You're Pro`, plan line (`Yearly · $69 for your first year, then $89 a year` when `launchFirstYear`, else `Yearly · $89 a year` / `Monthly · $9.99 a month`, in the subscription currency), ticks `Unlimited questions in <cert> and every other cert`, `Exam Simulator, Marathon and full Sim Lab`, `Drill Mistakes and Why-Not`, `Start studying`, `Takes you back to <cert>. Your receipt and a copy of what you agreed to are on their way to <email>.` After 20s still Free → `Payment received` / `Pro switches on within a minute. Your receipt is on its way to <email>.` / `Checking every few seconds` / `You can start studying now. Pro turns on by itself. Still Free after five minutes? Email support@certanvil.com.` / `Start studying`; sync again at 20s and 60s; poll every 5s up to 5 minutes. Cert = valid `from`, else `profile.active_cert`, else `netplus`. Start studying → `certHost(cert)` with `pro=1`. `role="status" aria-live="polite"`. `?checkout=` and `session_id` are removed from the URL once read.

- [ ] **Step 1: Failing e2e** (`--project=landing`): status line for each of the six states; Free `Get Pro` `href="/pricing"` + `data-web-purchase`; **webhook never arrives but sync applies: You're Pro on the first poll**; Confirming then You're Pro when status flips on the second poll; slow path after 20s (`page.clock`) and a second sync call at 20s; `ca:checkout-pro` fires once with `{ plan: 'yearly', from: 'secplus' }`; Start studying `href` `https://secplus.certanvil.com/?pro=1` for `from=secplus`, `https://aplus.certanvil.com/?exam=core1&pro=1` for `from=aplus-core1`, `https://networkplus.certanvil.com/?pro=1` with neither; bad `from` falls back; a paying non-admin's entitlement list and exam-results section unlock; 390px no horizontal scroll.
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass.** **Step 5: Commit** `payments A19: account status line and a confirmation page that syncs from Stripe`

---

### Task 20: Billing page with every state and the one-step cancel

**Files:** Modify `landing/manage-subscription.html` (title `Billing · CertAnvil`, crumb `Account / Billing`, h1 Billing, `#bl-card`, help section; loads `lib/cert-registry.js`, `lib/billing.js`, `lift-billing.css`), rewrite `landing/lib/manage-sub.js`. Create `tests/e2e/landing-billing.spec.js`.

**Interfaces:** Consumes `window.caBilling`. Produces nothing.

States (drawing D, verbatim; prices from `/api/pricing` for Free/ended hints, from the status `currency` for the subscription's own price):

| State | Card | Actions |
|---|---|---|
| free | `Free`, pill `Current plan`, `15 questions and 5 review cards a day, on one cert.`, `Pro adds` + three ticks | `Get Pro` → `/pricing` (`data-web-purchase`), hint `$69 for your first year, then $89 a year` (launch) or `$89 a year or $9.99 a month` |
| active (stripe) | `Pro · Yearly` / `Pro · Monthly`, pill `Active`; Price `First year $69, then $89 on 6 Nov 2027` / `$89 a year` / `$9.99 a month`; Next charge `$89 on 6 Nov 2027`; Paid with `Visa ending 4242` (when `card`); Receipts `Each receipt is emailed to <email>. Past invoices are in Manage billing.` | `Manage billing` (portal), `Cancel Pro` |
| cancelled | `Pro until 14 Mar 2027`, pill `Cancelled`, `You won't be charged again. Pro stays on until 14 Mar, then you move to Free with all your progress.` | `Resume Pro` (`subscription('resume')`), `Manage billing` |
| grace | `Pro · Yearly`, pill `Payment due`, `Your card didn't go through. Update it to keep Pro.` / `We'll try again over the next few days. Pro stays on until then.` | `Update card` (portal `card`), `Cancel Pro` |
| apple | `Pro · Yearly`, pill `Billed by Apple`, `Billed by Apple through your Apple ID. Changes and cancellation go through Apple.` | `Manage in Apple` → `https://apps.apple.com/account/subscriptions` |
| ended | `Free`, pill `Pro ended 14 Mar`, `Your Pro has ended. Your progress is kept.` | `Renew Pro` → `caBilling.checkout('yearly', currency)` (`data-web-purchase`), hint |
| owner | `Owner`, pill `Full access`, `This account has Pro on every cert. Nothing is billed to it.` | none |

Help: `Questions about a charge? Email support@certanvil.com.` Cancel question (sheet on phones, dialog on desktop): `Why are you cancelling?` / `One optional question, then you're done.` Options `Passed my exam`, `Too expensive`, `Something else`; follow-ups as drawn (Passed → `Congratulations on passing` + `Pro covers every cert, including your next one. Your Pro stays on until <date> either way.` and the CompTIA ladder line with `Start <next>`; Too expensive on Monthly → `Yearly costs $7.42 a month` / `Same Pro, $89 a year. That's $30.88 a year less than Monthly. Or stay on Free after you cancel: 15 questions a day, with your progress kept.` / `Switch to Yearly` (portal `switch`), on Yearly only the `Or stay on Free…` sentence; Something else → `Anything we could do better?` / `Optional. It goes straight to support.` + textarea). Footer `Keep Pro` and `Cancel Pro`, both always visible; `Cancel Pro` calls `subscription('cancel', { reason, note })` with or without an answer, then the card shows the cancelled state and a line `Cancelled. We've emailed you the date Pro ends.` The yearly saving is computed (12 × monthly − yearly).

- [ ] **Step 1: Failing e2e** (`--project=landing`, desktop and 390px): seven states; no element contains `refund`; `Cancel Pro` opens the question; each answer shows its follow-up; confirming posts `{ action: 'cancel', reason, note }` to `/api/stripe/subscription` and never calls the portal; with no answer it posts `{ action: 'cancel' }`; the card flips to Cancelled without a reload; `Resume Pro` posts `{ action: 'resume' }`; `Switch to Yearly` posts portal `flow: 'switch'`; 404 shows `Get Pro`; signed out shows the anon gate. Count: from the Billing page, cancelling takes two taps (Cancel Pro, Cancel Pro).
- [ ] **Step 2: Run, fail.** **Step 3: Implement** (lift `billing()`, `cancelSheet()`, `account()`; styles in `lift-billing.css`). **Step 4: Run, pass.** **Step 5: Commit** `payments A20: Billing page and a one-step cancel`

---

### Task 21: The preview path (test-mode checkout and webhook before merge)

**Files:** Modify `.github/workflows/ci.yml` (new job `deploy-landing-preview`; alias steps in it and in `deploy-preview`), `landing/SETUP.md` (§Payments preview), `ENVIRONMENT_STRATEGY.md` (§Payments preview). Create `tests/uat/554-payments-preview.js`.

**Interfaces:** Consumes `siteOrigin`, `corsHeaders`, `safeReturn` (Task 2), `caApiBase` (Task 12). Produces the two stable preview URLs in the contract.

How the path works (this is the decision; the reviewers found no preview could be smoke-tested): the app preview's Supabase client is hardcoded to production (`lib/supabase.js`), so both previews use the **production Supabase project** for auth and data, and **test-mode Stripe only**. Test-mode rows are written `environment = 'sandbox'` and count only for `billing_test_accounts` members (Task 1), so a test card never gives anyone real Pro. The migration is pasted on production before the smoke (Task 23 Step 4); it is additive and changes no one's Pro.

- [ ] **Step 1: Failing UAT** (`554`): `ci.yml` has a `deploy-landing-preview` job on `pull_request` with `working-directory: ./landing`, `VERCEL_PROJECT_ID: prj_7GatDO51SK9QtDFekOAPe1XG6kGt`, a `vercel alias set "$URL" certanvil-landing-payments.vercel.app` step guarded by `if: contains(github.head_ref, 'payments')`, and a PR comment step; `deploy-preview` gains `vercel alias set "$URL" certanvil-app-payments.vercel.app` under the same guard and its comment prints `https://certanvil-app-payments.vercel.app/?api=https://certanvil-landing-payments.vercel.app`; no billing endpoint file under `landing/api/{stripe,billing,cron}` imports `supabaseUrl` from `admin-mail.js`.
- [ ] **Step 2: Run, fail.** **Step 3: Implement** the jobs (copy `deploy-preview`'s shape; `vercel alias set` uses the same token). Write the §Payments preview section: Preview-scope env on certanvil-landing (`SUPABASE_URL` = the production project URL explicitly, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `sk_test_` key, test Price ids, test coupon, test `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `EARLY_ACCESS_SECRET`, `TERMS_VERSION=1.2`, no `SALES_OPEN_AT`); the Stripe test webhook endpoint `https://certanvil-landing-payments.vercel.app/api/stripe/webhook` (append `?x-vercel-protection-bypass=<secret>` if Deployment Protection is on); sign in on each preview with an email code (no OAuth redirect needed); add the test account to `billing_test_accounts` (`insert into billing_test_accounts(user_id, note) select id, 'founder test' from auth.users where email = '<test email>';`).
- [ ] **Step 4: Run, pass.** **Step 5: Commit** `payments A21: landing preview and stable aliases for a test-mode smoke`

---

### Task 22: Visual pass and cross-platform verification

**Files:** Whatever the pass changes in Tasks 11 and 13–20 surfaces.

- [ ] **Step 1: 5-stage visual pass in order** on the paywall (four triggers, before-sales, already Pro, nudges), grace banner, Pro-ended, delete page (three variants), confirmation page (three states), Billing (seven states + cancel question), status line, and the four emails (confirmation, exit, reminder, double purchase): `design-taste-frontend`, `emil-design-eng`, `transitions-dev`, `humanizer`, `marketing-psychology`. Stage 2 decides whether anything moves; stage 3 only choreographs what stage 2 kept; BRAND.md §6 wins. Stages 4–5 may not alter verbatim strings or the consent text; raise those with the founder. New copy (emails, before-sales line, cancel confirmation) is listed in the PR for founder sign-off and goes to the solicitor check (Plan C Task 17).
- [ ] **Step 2: Desktop (1280×820) and mobile web (390×844)** on `python3 -m http.server 3131` and `npx serve landing -l 3132`, routes stubbed: each surface beside its drawing frame; DOM rects for the sheet/dialog; no horizontal scroll at 390px; light and dark; keyboard only; zero console errors.
- [ ] **Step 3: iOS shell** in the Simulator (attach, launch the dev build): daily limit, Settings, second cert, Home with grace and ended stubbed. Expected: no `.pw`, no price, no Stripe or pricing link, today's fallbacks.
- [ ] **Step 4: Full suites:** `node tests/uat.js`, `node tests/tech-debt.js`, `npx playwright test --project=chromium --project=webkit --project=mobile-safari --project=landing` → all pass.
- [ ] **Step 5: Commit** `payments A22: visual pass`

---

### Task 23: Gated-lane ship

**Files:** `app.js`, `sw.js`, `index.html`, `package.json`, `CLAUDE.md` (via `bump-version.js`), `CHANGELOG.md`, `ENVIRONMENT_STRATEGY.md`, `landing/SETUP.md`.

- [ ] **Step 1: Version** `node scripts/bump-version.js <next minor> "Payments: Stripe checkout behind the sales switch, one paywall, Billing and the confirmation page"`; update UAT version pins; CHANGELOG; `node tests/uat.js` passes.
- [ ] **Step 2: Docs.** `ENVIRONMENT_STRATEGY.md` and `landing/SETUP.md` list the landing env vars: `SUPABASE_URL` (required, no fallback), `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_LAUNCH_COUPON`, `LAUNCH_STARTS_AT`, `SALES_OPEN_AT`, `LAUNCH_ENDS_AT`, `EARLY_ACCESS_SECRET`, `CRON_SECRET`, `TRADER_NAME`, `TRADER_ADDRESS`, `TERMS_VERSION`, `RESEND_API_KEY`, optional `ALERT_EMAIL`, `SITE_ORIGIN`; the app project gains `INFRA_DAILY_LIMIT` (optional). Add §Payments operations: a 14-day statutory cancellation = cancel the subscription now in the dashboard, then refund the unused part (the webhook ends Pro on the cancel); a full refund ends Pro by itself.
- [ ] **Step 3: PR** `git push -u origin feat/payments-a`; `gh pr create --draft` with the gated checklist, the new-copy list, the webkit/mobile-safari run, and `ACTION REQUIRED: paste supabase/migrations/20261101_provider_subscriptions.sql in the production SQL Editor before the preview smoke (Step 4)`. Confirm the branch DB applied the migration and both previews built and aliased.
- [ ] **Step 4: [FOUNDER] Stripe test mode and the production paste** (ask, then wait): two Prices (Monthly, Yearly) in USD with GBP and EUR `currency_options`, tax-inclusive; the launch coupon (amount off 20 in USD, GBP, EUR, once, redeem-by = launch end); Stripe Tax on; wallets on; Adaptive Pricing **off**; Smart Retries on with **"If all retries for a payment fail: cancel the subscription"**; receipt emails on; Customer Portal with payment-method update and plan switch (cancel stays on as a fallback); the Terms URL set; public business details (the address once it exists); a test webhook to the landing preview alias with the five events; the Preview-scope env from Task 21; insert the test account into `billing_test_accounts`. Then paste the migration in the **production** SQL Editor and run `migration-audit.sql` (new rows `ok`, quota `ok`). This is safe before merge: the migration is additive, `is_pro()` keeps admin and the legacy playtester rows, and nothing writes to the new table until the endpoints deploy. (Founder decision requested in the PR: production paste before merge, instead of only after.)
- [ ] **Step 5: Preview smoke** (card `4242 4242 4242 4242`, the allowlisted test account, `https://certanvil-app-payments.vercel.app/?api=https://certanvil-landing-payments.vercel.app`): Free → limit paywall → Get Pro (Yearly) → Stripe shows the consent checkbox with the Terms link and the renewal price, email locked → pay → `/account` on the landing preview shows Confirming then You're Pro → the confirmation email arrives with the consent text and the frozen Terms link → Start studying → chip Pro → Billing Active → Cancel Pro → one step → Cancelled + exit email → Resume. A non-allowlisted account: the paywall shows Pro launches soon and the checkout answers 403. Disable the test webhook, buy again on a second test account: the confirmation page still reaches You're Pro (sync). Re-enable it. `4000 0000 0000 0341` with a test clock: grace banner and Billing grace; advance past the last retry: Pro ends. Full refund: Pro gone, subscription cancelled; partial refund: nothing changes. Second checkout while Pro: 409. Two open checkouts: paying the second expires the first. Run `GET /api/cron/billing-daily` with the cron secret on an account marked for deletion 8 days ago (set the mark by SQL on the test account): the subscription is cancelled and the next purge removes the account. Run the ROLLBACK on the **branch** DB, re-apply, re-run the audit.
- [ ] **Step 6: Cross-platform on the preview:** desktop Chrome, iPhone Safari, the iOS shell pointed at the app preview: Task 22 checks again with live endpoints.
- [ ] **Step 7: Merge.** Ready, CI green, squash-merge.
- [ ] **Step 8: [FOUNDER] production keys** (ask, then wait): live Prices, coupon, portal and webhook `https://certanvil.com/api/stripe/webhook`; live keys and Production-scope env on certanvil-landing **without `SALES_OPEN_AT`**; redeploy. Sales stay closed for everyone but `billing_test_accounts` until Plan C's runbook sets `SALES_OPEN_AT` after every gate passes.
- [ ] **Step 9: Post-deploy:** `curl -sS 'https://certanvil.com/api/pricing?currency=gbp'` from a non-UK machine returns `gbp`, `salesOpen: false`; `curl -sS -X POST https://certanvil.com/api/stripe/webhook` → `400`; a signed-in non-allowlisted checkout → `403 sales_closed`; the app serves the new version; drive the prod app (cache-busted) to the limit paywall: Pro launches soon, no prices; the Stripe dashboard shows the webhook healthy; the Vercel cron is listed.

---

## Deferred (from review)

- **App paywall analytics** (build #27): `paywall_seen` / `checkout_started` by trigger, iPhone vs web. Needs the Vercel plan decision for custom events on the app project; the landing funnel (Plan C) covers launch. Spec gap 20.
- **UK DMCC subscription regime beyond reminders** (compliance #9): renewal cooling-off refunds, prescribed reminder content, end-of-contract notice. Regulations' final text is pending; reminders (Task 9), a one-step cancel and an exit email (Tasks 7, 20) ship now. Spec gap 19, due before 1 Jan 2027.
- **Server-side cert lock and other browser-only limits** (money #17, part): the cert lock now lifts only on a server Pro answer, but the free limits for reviews, exam runs and Pro-only features stay client-side until spec gap 16. AI questions, the costly one, are metered server-side now (Task 10).
- **Apple renewal reminders:** Apple is the seller for in-app purchases and sends its own renewal notices; revisit with the DMCC plan.

## Self-review notes

- Spec coverage: gap 1 (Tasks 1, 6, 8), gap 2 (Tasks 2–4, 23), gap 3 (Tasks 5–7, 19, 20), gap 8 web half (Tasks 13, 19, 20), gap 9 (Task 18), gap 15 (switch Tasks 2–4, 7, 13; email Task 5; reminders Task 9; metering Task 10; preview Task 21), D9/D14 consent and confirmation (Tasks 2, 4, 5), D12 address in code (Task 4), D13 (Tasks 3, 4, 7, 13), D15 (Task 9), account deletion web (Tasks 8, 11), cross-platform runtime (Task 12), triggers (Tasks 13–17). Plan C owns pricing page, landing markers, legal, the frozen Terms copy, launch and gates; Plan B owns Apple, including `releaseApple` and the RevenueCat double-purchase reversal through `stripe-ops.js`.
- Not in Plan A, named so nobody builds it twice: iPhone delete screen and Apple warning in the app (B Task 7), `data-web-purchase` landing rule and native-hide (C), `/api/revenuecat/*` (B), checkout analytics events (C, listening to `ca:checkout-pro`).
- Type consistency: `summarize(rows, role, nowMs, opts)` takes `role` as `{ role, isPlaytest }` from `readRole` everywhere; `consentText` is the only consent source (Tasks 4, 5); `applySession` is shared by Tasks 5 and 6; `releasers` keys are provider names.
