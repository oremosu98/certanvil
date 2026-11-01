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

**Goal:** A signed-in person on the web app (desktop or mobile web) can buy Pro through Stripe, lands on one confirmation page, sees the real subscription on Account and Billing, and every Go Pro button in the app goes through one paywall and one purchase chokepoint; the database, endpoints and client hooks that Plans B (iPhone) and C (landing, legal, launch) build on exist with the contract's exact names.

**Architecture:** One migration (re-applied from the unmerged `feat/g1-hardening-provider-subscriptions` branch, adapted) makes `provider_subscriptions` the only entitlement record and `is_pro()` read it plus the admin role. Six Edge endpoints on the landing project (`/api/pricing`, three under `/api/stripe/`, `/api/stripe/cancel-on-delete`, `/api/billing/status`) talk to Stripe's REST API with a pinned API version and to Supabase with the service role; the webhook is the only writer, through the transactional RPC. In the app, two new feature modules own Pro state (`features/pro-state.js`) and the paywall plus chokepoint (`features/paywall.js`); existing gates keep their call sites and gain a one-line hand-off. The landing `/account` page becomes the single confirmation page and `/manage-subscription` becomes Billing.

**Tech Stack:** Vercel Edge functions (ESM, Web Crypto, `fetch`), Stripe REST API `2024-06-20` (hosted Checkout, Customer Portal, webhooks), Supabase Postgres (PGlite in tests), vanilla JS app modules, Playwright (chromium, webkit, mobile-safari, landing projects).

**Spec:** `docs/superpowers/specs/2026-11-01-payments-e2e-design.md` (approved). **Drawing:** `mockups/payments-concept.html` (approved; the build is a faithful lift, screens A–E). **Contract:** the three-plan contract (Plan A owns the interfaces below; Plans B and C consume them).

## Global Constraints

- Lane: **gated**. Work on branch `feat/payments-a` cut from `main`, PR, Supabase branch DB + Vercel preview, squash-merge. Never direct-push.
- Prices (D1, contract): Monthly **$9.99 / £8.99 / €9.99**; Yearly **$89 / £79 / €89**; per-month line under Yearly **$7.42 / £6.58 / €7.42**. Launch (D5): Yearly first year **$69 / £59 / €69** via one Stripe amount-off coupon of **$20 / £20 / €20**, duration `once`. No trial (D3). Yearly is the default wherever a plan is picked (D2).
- Every price shown in the web app comes from `GET https://certanvil.com/api/pricing`; nothing in `app.js`, `features/` or `landing/lib/` hardcodes a figure.
- Checkout consent text, verbatim: `I want Pro to start now, and I understand I lose my 14-day right to cancel.` No refund promise and no refund button anywhere (D9).
- One contact: `support@certanvil.com` (D10).
- Stripe REST calls send `Stripe-Version: 2024-06-20`. The webhook never trusts event payload shape: it re-retrieves the object by id with that version.
- Endpoints answer `503 { error: 'stripe_not_configured' }` (or `not-configured` for non-Stripe) when a required env var is missing, never throw.
- Migrations dated on or after 2026-05-12 carry a tested `-- ROLLBACK:` block and a row in `scripts/sql/migration-audit.sql`.
- `app.js` ratchet (`tests/appjs-baseline.json`, cap 8334): new UI goes in `features/*.js`; this plan's `app.js` edits must be net zero or negative lines.
- Any `dg-system.css` change hand-bumps `dg-system.css?v=` in `index.html` in the same commit. New landing styles go in a new file `landing/lift-billing.css`.
- On-screen copy: no em dashes, never names the founder, quoted from the drawing where the drawing has it. Dates read `14 Mar 2027` (en-GB, day month year).
- Motion: `design/brand/BRAND.md` §6 tokens win (`cubic-bezier(0.16, 1, 0.3, 1)`, its duration table). `transform` + `opacity` only, entrances never below `scale(0.96)`, hover behind `@media (hover:hover) and (pointer:fine)`, `prefers-reduced-motion` collapses to fade.
- Every price and buy element the app renders carries `data-web-purchase`. Links to `certanvil.com/pricing` that become paywall openers **keep their `href`** (the existing `html.is-native` hide rule in `dg-system.css` keeps matching them; the link is also the no-JS fallback).
- iPhone (`html.is-native`): Plan A adds nothing visible that buys, prices or links to billing. `openPaywall` returns `false` there until Plan B replaces it; existing fallbacks stay as today.
- Testing hard rule: never write `localStorage` on a prod or `*.vercel.app` host from a browser tool. Use `localhost:3131` / `:3132` or Playwright's isolated contexts.
- User-visible surfaces in Tasks 9–13 go through the 5-stage visual pass (Task 14) before the PR leaves draft.

## Review Focus

1. **A paying (non-admin) person opens a second cert.** `lib/router.js` `getTier()` only returns `'pro'` for admins, so `lib/cert-lock.js` walls them off. Expected: no wall for anyone `is_pro()` says is Pro; a wall drawn before Pro state lands is removed when it does. Test owned by Task 8.
2. **The Pro check fails on a network error** (WKWebView resumed with a dead request, train tunnel). Expected: the last known Pro state for the same account, under 24 hours old, holds; a paying person is never shown Free limits because of a bad connection. A failed check never downgrades. Test owned by Task 8.
3. **Stripe delivers events out of order, twice, or for a subscription we have no row for** (a refund on a subscription whose `checkout.session.completed` failed). Expected: older events never overwrite newer ones, duplicates return `duplicate`, an unmapped event is recorded as `unmatched` with a 200 so Stripe stops retrying, and nothing returns a 500 loop. Tests owned by Tasks 1 and 5.
4. **`/api/pricing` is unreachable** (blocked by an extension, offline, 5xx). Expected: the paywall still opens with its headline, plans named without amounts, and Get Pro still starts checkout (Stripe shows the real price); no `NaN`, `undefined` or `$` without a figure appears. Test owned by Task 9.
5. **The owner, in Preview as Free, taps Get Pro.** The app reports Free locally, but the server's `is_pro()` is true. Expected: `409 already_pro` becomes "You're already Pro"; Stripe is never reached. Test owned by Task 9.

---

## Interfaces Plan A produces (names are binding for Plans B and C)

| Interface | Shape |
|---|---|
| Table `provider_subscriptions` | `id, user_id, provider ('stripe'\|'apple'), provider_customer_id, provider_subscription_id, original_transaction_id, product_id, tier ('free'\|'pro'), status, plan ('monthly'\|'yearly'), currency ('usd'\|'gbp'\|'eur'), current_period_end, cancel_at_period_end, environment ('production'\|'sandbox'), revoked_at, launch_price_until, last_event_at, created_at, updated_at` |
| `status` values | `active, trialing, grace, canceled, incomplete, incomplete_expired, unpaid, expired, revoked`. **`grace` is the one grace state for both providers** (Stripe's `past_due` is written as `grace`; Plan B writes Apple's billing-grace as `grace`). |
| RPC `apply_provider_subscription_event(p_event_id text, p_event_type text, p_row jsonb) returns text` | Returns `applied \| duplicate \| stale \| unmatched`. Service role only. `p_row` keys = the column names above plus `_noop: 'true'`. |
| View `user_entitlements` | `user_id, is_pro, best_period_end, providers` (caller's own rows only). |
| `is_pro(uid uuid) returns boolean` | Any row with `tier='pro'`, `status in ('active','trialing','grace')`, `revoked_at is null`, period not ended, **or** `profiles.role='admin'`. |
| `GET /api/pricing` | `{ currency, symbol, monthly, yearly, yearlyPerMonth, launch: { active, firstYear, endsAt } }`; `endsAt` is `null` when no window is configured. `?currency=usd\|gbp\|eur` override. |
| `POST /api/stripe/create-checkout-session` | Bearer; `{ plan, currency, from?, returnTo? }` → `{ url }`; `409 { error: 'already_pro' }`. |
| `POST /api/stripe/create-portal-session` | Bearer; `{ flow?: 'cancel'\|'card'\|'switch', reason?, note?, returnTo? }` → `{ url }`; `404 { error: 'no_billing_account' }`. |
| `POST /api/stripe/cancel-on-delete` | Bearer; `{}` → `{ cancelled: n }`. |
| `GET /api/billing/status` | Bearer; contract shape plus `currency` (`'usd'\|'gbp'\|'eur'\|null`); `?detail=1` adds `card: { brand, last4 } \| null`. |
| `window.openPaywall(trigger, opts?) → boolean` | Triggers `'limit' \| 'run' \| 'feature:<name>' \| 'cert:<certId>'`. `opts`: `{ title, body, eyebrow, ownedCert }`. Returns `false` (shows nothing) on `html.is-native`. |
| `window.startProUpgrade(plan) → Promise<void>` | The single purchase chokepoint. |
| `window.nativePurchase(plan)` | Stub on web (resolves `false`); Plan B defines the real one. |
| `window.refreshProState({ force }) → Promise<{ pro: boolean, source: 'server'\|'cache'\|'none' }>` | Re-reads `get_daily_quota_usage`, keeps 24h last-known Pro. `?pro=1` on load forces it. |
| `window.CAPaywall` | `{ TRIGGERS, shellHtml(innerHtml), close() }` so Plan B can render its native variant in the same sheet. Extra to the contract; B may ignore it. |
| `window.caBilling` (landing) | `{ status(detail?), checkout(plan, currency), portal(flow, extra) }` in `landing/lib/billing.js`; Plan C's pricing page may reuse it. |

## File structure

| File | Responsibility |
|---|---|
| `supabase/migrations/20261101_provider_subscriptions.sql` (new) | Table, RLS, `is_pro()`, view, RPC, grants, rollback |
| `landing/api/_lib/stripe.js` (new) | `stripeRequest`, `formEncode`, `verifyStripeSignature`, `STRIPE_VERSION` |
| `landing/api/_lib/pricing.js` (new) | `PRICES`, `currencyFor`, `launchState`, `pricingPayload`, `planForPrice` |
| `landing/api/_lib/entitlement.js` (new) | `summarize(rows, role, now)`: the JS mirror of `is_pro()` plus Billing states |
| `landing/api/_lib/billing-http.js` (new) | `verifyUser`, `corsHeaders`, `readSubs`, `readRole` |
| `landing/api/pricing.js`, `landing/api/billing/status.js` (new) | Endpoints |
| `landing/api/stripe/{create-checkout-session,webhook,create-portal-session,cancel-on-delete}.js` (new) | Endpoints |
| `features/pro-state.js` (new) | `refreshProState`, last-known cache, `?pro=1`, resume re-check, cert-lock exemption |
| `features/paywall.js` (new) | Paywall, chokepoint, already-Pro, checkout-cancelled toast, pending plan, nudge, CTA click delegation |
| `features/billing-notices.js` (new) | Grace banner, Pro-ended screen |
| `landing/lib/billing.js` (new), `landing/lib/checkout-return.js` (new), `landing/lift-billing.css` (new) | Landing billing client, confirmation page, styles |
| Modified | `app.js`, `index.html`, `sw.js`, `dg-system.css`, `lib/cert-lock.js`, `lib/onboarding-chrome.js`, `features/{flagship-drills,sr-review,ios-hub,ios-firstrun,ios-settings,ios-simlab,home}.js`, `landing/account.html`, `landing/lib/account.js`, `landing/manage-subscription.html`, `landing/lib/manage-sub.js`, `scripts/sql/migration-audit.sql` |

---

**Launch timing (shared by Plans A and C):** two moments. `LAUNCH_STARTS_AT` (Plan A env) = when the one launch email is sent; from then the coupon applies and `/api/pricing` reports `launch.active`, so the email's `?buy=` link gets $69. `window.CERTANVIL_SALES_OPEN_AT` (Plan C) = 48 hours later, when the public site switches to Get Pro and shows the launch panel. `LAUNCH_ENDS_AT` = the stated end, 30 days after the public switch; the coupon's redeem-by and Apple's intro-offer end date match it.

### Task 1: Subscription record migration (re-applied from the Stripe branch)

**Why re-apply, not cherry-pick or rebase:** the branch sits 513 commits behind `main`; its first commit also edits five old plan docs; its migration is dated `20260918`, which sorts before migrations already on prod; its `is_pro()` drops the admin bypass; and its endpoints are Node/CJS on the `stripe` SDK while today's `landing/api` is Edge ESM with no `package.json` and fetch-stubbed tests. So: bring the migration file over, rename and adapt it here; port the endpoint logic (Tasks 4–6) by reading `git show feat/g1-hardening-provider-subscriptions:landing/api/stripe/<file>`. Do not bring `landing/package.json`. Delete the local branch only after the PR merges.

**Files:**
- Create: `supabase/migrations/20261101_provider_subscriptions.sql`
- Create: `tests/payments-db.test.mjs`, `tests/uat/540-payments-db.js`
- Modify: `scripts/sql/migration-audit.sql`

**Interfaces:**
- Consumes: `stripe_events`, `_set_updated_at()` (20260509_phase_e_subscriptions), `profiles.role` (20260506_phase_c_prime), quota functions (20260611_free_tier_15_questions).
- Produces: everything in the DB rows of the Interfaces table; `export async function bootDb()` and `export async function asUser(db, uid, sql, params)` from `tests/payments-db.test.mjs` (same contract as `tests/deletion-db.test.mjs`).

- [ ] **Step 1: Branch and bring the file over**

```bash
git switch -c feat/payments-a main
git checkout feat/g1-hardening-provider-subscriptions -- supabase/migrations/20260918_provider_subscriptions.sql
git mv supabase/migrations/20260918_provider_subscriptions.sql supabase/migrations/20261101_provider_subscriptions.sql
```

- [ ] **Step 2: Write the failing database suite `tests/payments-db.test.mjs`**

Copy the prelude, `bootDb`, `asUser`, `t()` harness and summary line format (`payments-db: N/N passed`) from `tests/deletion-db.test.mjs`. Migrations loaded in order: `supabase/schema.sql`, `20260506_phase_c_prime`, `20260509_phase_e_subscriptions`, `20260509_phase_e_admin_bypass`, `20260611_free_tier_15_questions`, `20261101_provider_subscriptions`. Helper `apply(id, type, row)` calls the RPC as superuser. Cases:

```js
await t('is_pro: no rows false; admin true; active stripe true; grace true; apple active true', ...);
  // insert rows directly as superuser; assert each select is_pro($1)
await t('is_pro: revoked, canceled, expired period, tier free all false', ...);
await t('daily limit stays 15 for Free and -1 for Pro and admin', async () => {
  const q = async (u) => (await db.query('select * from get_daily_quota_usage($1)', [u])).rows[0];
  assert.equal((await q(FREE)).daily_limit, 15);
  assert.equal((await q(ADMIN)).daily_limit, -1);
  assert.equal((await q(PAYER)).daily_limit, -1);
  assert.match((await db.query("select prosrc from pg_proc where proname='consume_daily_quota'")).rows[0].prosrc, /daily_limit constant int := 15/);
});
await t('apply: first event applied, same id again duplicate', ...);           // returns 'applied' then 'duplicate'
await t('apply: an older event after a newer one is stale and changes nothing', ...);  // last_event_at T2 then T1
await t('apply: a crashed processing claim re-applies', ...);                  // pre-insert stripe_events status 'processing'
await t('apply: no existing row and no user_id is unmatched, event processed, no row', ...);
await t('apply: _noop records the event and writes no row', ...);
await t('apply: writes plan, currency, launch_price_until, grace status', ...);
await t('apply: status past_due is rejected by the check constraint', ...);   // rejects; grace is the only grace word
await t('anon and authenticated cannot execute apply_provider_subscription_event', async () => {
  const p = (await db.query("select has_function_privilege('authenticated','public.apply_provider_subscription_event(text,text,jsonb)','EXECUTE') a, has_function_privilege('anon','public.apply_provider_subscription_event(text,text,jsonb)','EXECUTE') b")).rows[0];
  assert.deepEqual([p.a, p.b], [false, false]);
});
await t('RLS: a user reads only their own provider_subscriptions and user_entitlements rows', ...);  // asUser(A) sees 1, not B's
await t('migration-audit rows for 20261101 all report ok', ...);   // run scripts/sql/migration-audit.sql, filter migration = '20261101_provider_subscriptions'
await t('re-pasting the whole file is safe and keeps rows', ...);
await t('ROLLBACK restores the admin-bypass is_pro and quota 15, then the file applies again', async () => {
  await db.exec(rollbackSql());   // lines after '-- ROLLBACK:' with the leading '-- ' stripped, as bug-reports-db does
  assert.equal(await isPro(ADMIN), true);
  assert.equal((await db.query("select to_regclass('public.provider_subscriptions') r")).rows[0].r, null);
  assert.equal((await db.query('select daily_limit from get_daily_quota_usage($1)', [FREE])).rows[0].daily_limit, 15);
  await db.exec(read(FILE));
});
```

- [ ] **Step 3: Run it and see it fail**

Run: `node --experimental-detect-module tests/payments-db.test.mjs`
Expected: FAIL on `is_pro: ... admin true`, `grace`, `plan` and `unmatched` cases (the branch file has none of them).

- [ ] **Step 4: Adapt the migration**

Change the branch file as follows; leave the rest of its logic and comments:
- Header: date 2026-11-01, plan = this file, spec link; note it supersedes the never-applied `20260918` file.
- Column `billing_period` → `plan text check (plan in ('monthly','yearly'))`. Add `currency text check (currency in ('usd','gbp','eur'))` and `launch_price_until timestamptz`.
- Status check list → `('active','trialing','grace','canceled','incomplete','incomplete_expired','unpaid','expired','revoked')`.
- `is_pro(uid)`: `language sql security definer stable set search_path = public`; status list `('active','trialing','grace')`; `or exists (select 1 from profiles where id = uid and role = 'admin')`. Comment names the 20260509 admin bypass it keeps.
- `user_entitlements`: the same status list in `bool_or`.
- RPC, race handling: claim the event with `insert ... on conflict (event_id) do nothing` then `select status ... for update`; before locating the subscription row, `perform pg_advisory_xact_lock(hashtext(v_provider || ':' || coalesce(p_row->>'original_transaction_id', p_row->>'provider_subscription_id', '')))`.
- RPC: when no existing row and `p_row->>'user_id'` is null, mark the event processed and `return 'unmatched'`.
- RPC update/insert: write `plan`, `currency`, `launch_price_until` with the same `coalesce` pattern as the other columns.
- `-- ROLLBACK:` block: restore the **20260509_phase_e_admin_bypass** `is_pro()` body verbatim (not the branch's Stripe-only one), then drop function, view, table, and `stripe_events.status`.

- [ ] **Step 5: Add the audit rows** to `scripts/sql/migration-audit.sql` (before the closing `)`):

```sql
  ('20261101_provider_subscriptions',   'table provider_subscriptions',  to_regclass('public.provider_subscriptions') is not null),
  ('20261101_provider_subscriptions',   'apply_provider_subscription_event()', exists (select 1 from fn where proname='apply_provider_subscription_event')),
  ('20261101_provider_subscriptions',   'is_pro() reads provider_subscriptions and keeps admin', exists (select 1 from fn where proname='is_pro' and prosrc ilike '%provider_subscriptions%' and prosrc ilike '%admin%')),
  ('20261101_provider_subscriptions',   'view user_entitlements',        to_regclass('public.user_entitlements') is not null),
  ('20261101_provider_subscriptions',   'authenticated cannot apply events', not has_function_privilege('authenticated','public.apply_provider_subscription_event(text,text,jsonb)','EXECUTE'))
```

- [ ] **Step 6: Wire the UAT module** `tests/uat/540-payments-db.js`, copying the spawn pattern of `tests/uat/532-bug-reports-loop.js` for `tests/payments-db.test.mjs` (regex `payments-db: (\d+)\/\1 passed`).

- [ ] **Step 7: Run and pass**

Run: `node --experimental-detect-module tests/payments-db.test.mjs && node tests/uat.js`
Expected: `payments-db: N/N passed`; UAT ALL PASS (the rollback-marker guard in `tests/uat/150-*.js` sees `-- ROLLBACK`).

- [ ] **Step 8: Commit** `git add supabase/migrations/20261101_provider_subscriptions.sql scripts/sql/migration-audit.sql tests/payments-db.test.mjs tests/uat/540-payments-db.js && git commit -m "payments A1: provider_subscriptions migration with admin bypass and grace"`

---

### Task 2: Shared server libraries

**Files:**
- Create: `landing/api/_lib/stripe.js`, `landing/api/_lib/pricing.js`, `landing/api/_lib/entitlement.js`, `landing/api/_lib/billing-http.js`
- Create: `tests/api/payments-lib.test.mjs`
- Modify: `tests/payments-db.test.mjs` (one parity case), `tests/uat/540-payments-db.js` (spawn the new suite)

**Interfaces:**
- Consumes: `bootDb` (Task 1); `supabaseUrl`, `serviceKey`, `svcHeaders`, `bearer` from `landing/api/_lib/admin-mail.js`.
- Produces:
  - `stripe.js`: `export const STRIPE_VERSION = '2024-06-20'`; `export function formEncode(obj) → string` (nested objects and arrays as `a[b][0][c]=v`, booleans as `true`/`false`, skips `undefined`); `export async function stripeRequest(method, path, params?, { idempotencyKey }?) → object` (throws `Error` with `.status` and `.code` on non-2xx; GET params go in the query string); `export async function verifyStripeSignature(rawBody, header, secret, nowSec = Date.now()/1000, toleranceSec = 300) → boolean` (HMAC-SHA256 hex over `` `${t}.${rawBody}` `` via `crypto.subtle`, any `v1` matches, constant-time compare, rejects stale `t`).
  - `pricing.js`: `export const PRICES = { usd: { symbol:'$', monthly:'9.99', yearly:'89', yearlyPerMonth:'7.42', firstYear:'69' }, gbp: { symbol:'£', monthly:'8.99', yearly:'79', yearlyPerMonth:'6.58', firstYear:'59' }, eur: { symbol:'€', monthly:'9.99', yearly:'89', yearlyPerMonth:'7.42', firstYear:'69' } }`; `export const EURO_AREA` (AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES); `export function currencyFor(country, override) → 'usd'|'gbp'|'eur'` (valid override wins; GB → gbp; euro area → eur; else usd); `export function launchState(nowMs, env) → { active, endsAt }` from `env.LAUNCH_STARTS_AT` / `env.LAUNCH_ENDS_AT` (active iff both parse and start ≤ now < end; `endsAt` ISO or null); `export function pricingPayload(currency, nowMs, env)` → the `/api/pricing` body; `export function planForPrice(priceId, env) → 'monthly'|'yearly'|null`.
  - `entitlement.js`: `export function summarize(rows, role, nowMs) → { pro, source, plan, status, renewsAt, endsAt, launchFirstYear, fullPriceFrom, currency, row }` with the rules in Step 3.
  - `billing-http.js`: `export async function verifyUser(token) → { id, email } | null` (GET `/auth/v1/user` with `SUPABASE_ANON_KEY || SUPABASE_PUBLISHABLE_KEY`); `export function corsHeaders(req, methods) → object` (origin `^https://([a-z0-9-]+\.)?certanvil\.com$` or `http://localhost:3131|3132`, plus `Vary: Origin`, allow `Content-Type, Authorization`); `export async function readSubs(userId) → row[]`; `export async function readRole(userId) → string`; `export function safeReturn(raw, fallback) → string` (https + certanvil.com host or the fallback; keeps origin + path only).

- [ ] **Step 1: Write the failing tests** in `tests/api/payments-lib.test.mjs` (summary line `payments-lib: N/N passed`):

```js
assert.equal(formEncode({ line_items: [{ price: 'p', quantity: 1 }], automatic_tax: { enabled: true } }),
  'line_items[0][price]=p&line_items[0][quantity]=1&automatic_tax[enabled]=true');
// signature: build header with node:crypto createHmac('sha256', 'whsec_x').update(`${t}.${body}`)
assert.equal(await verifyStripeSignature(body, `t=${t},v1=${good}`, 'whsec_x', t + 10), true);
assert.equal(await verifyStripeSignature(body + ' ', `t=${t},v1=${good}`, 'whsec_x', t + 10), false);
assert.equal(await verifyStripeSignature(body, `t=${t},v1=${good}`, 'whsec_x', t + 301), false);
assert.equal(await verifyStripeSignature(body, `t=${t},v1=bad,v1=${good}`, 'whsec_x', t), true);
assert.equal(currencyFor('GB'), 'gbp'); assert.equal(currencyFor('DE'), 'eur'); assert.equal(currencyFor('US'), 'usd');
assert.equal(currencyFor('GB', 'eur'), 'eur'); assert.equal(currencyFor('GB', 'xyz'), 'gbp'); assert.equal(currencyFor(undefined), 'usd');
const env = { LAUNCH_STARTS_AT: '2026-12-01T00:00:00Z', LAUNCH_ENDS_AT: '2026-12-31T23:59:00Z' };
assert.deepEqual(launchState(Date.parse('2026-12-10T00:00:00Z'), env), { active: true, endsAt: '2026-12-31T23:59:00.000Z' });
assert.equal(launchState(Date.parse('2026-12-31T23:59:00Z'), env).active, false);
assert.deepEqual(launchState(Date.now(), {}), { active: false, endsAt: null });
assert.deepEqual(pricingPayload('gbp', Date.parse('2026-12-10T00:00:00Z'), env),
  { currency: 'gbp', symbol: '£', monthly: '8.99', yearly: '79', yearlyPerMonth: '6.58', launch: { active: true, firstYear: '59', endsAt: '2026-12-31T23:59:00.000Z' } });
// summarize
assert.equal(summarize([], 'user', NOW).status, 'free');
assert.deepEqual(pick(summarize([], 'admin', NOW)), { pro: true, source: 'admin', status: 'active' });
assert.equal(summarize([row({ status: 'active', cancel_at_period_end: true })], 'user', NOW).status, 'cancelled');
assert.equal(summarize([row({ status: 'grace' })], 'user', NOW).status, 'grace');
assert.equal(summarize([row({ status: 'canceled', current_period_end: PAST })], 'user', NOW).status, 'ended');
assert.equal(summarize([row({ status: 'active', revoked_at: PAST })], 'user', NOW).pro, false);
assert.equal(summarize([row({ launch_price_until: FUTURE })], 'user', NOW).launchFirstYear, true);
assert.equal(safeReturn('https://evil.com/x', 'https://certanvil.com/account'), 'https://certanvil.com/account');
assert.equal(safeReturn('https://secplus.certanvil.com/app?x=1', 'f'), 'https://secplus.certanvil.com/app');
```

Add to `tests/payments-db.test.mjs`:

```js
await t('summarize() agrees with is_pro() on every fixture row', async () => {
  // 12 fixture rows covering each status, revoked, past/future/null period, both providers, plus an admin with no rows
  for (const f of FIXTURES) { /* insert, compare (await isPro(u)) === summarize(rowsFor(u), roleFor(u), Date.now()).pro */ }
});
```

- [ ] **Step 2: Run to see them fail** — `node --experimental-detect-module tests/api/payments-lib.test.mjs` → FAIL, modules not found.

- [ ] **Step 3: Implement the four modules.** `summarize` rules: admin role → `{ pro: true, source: 'admin', plan: null, status: 'active', renewsAt: null, endsAt: null, launchFirstYear: false, fullPriceFrom: null }` (admin wins over any row). Entitling row = same predicate as `is_pro()`; pick the one with the latest `current_period_end` (null counts as latest). Entitling → `pro: true`, `status` = `grace` if row status is grace, else `cancelled` if `cancel_at_period_end`, else `active`; `renewsAt` = period end unless cancelled; `endsAt` = period end when cancelled. No entitling row but rows exist → `ended`, `source` = provider of the most recent row by `updated_at`, `endsAt` = its `revoked_at || current_period_end`. No rows → `free`, `source: null`. `launchFirstYear` = entitling row's `launch_price_until` > now; `fullPriceFrom` = that ISO or null.

- [ ] **Step 4: Run to pass** — both suites; add the `payments-lib` spawn to `tests/uat/540-payments-db.js`; `node tests/uat.js` passes.

- [ ] **Step 5: Commit** `payments A2: Stripe REST client, pricing table, entitlement summary`

---

### Task 3: `GET /api/pricing`

**Files:** Create `landing/api/pricing.js`, `tests/api/pricing.test.mjs`; modify `tests/uat/540-payments-db.js` (spawn).

**Interfaces:**
- Consumes: `currencyFor`, `pricingPayload` (Task 2); `corsHeaders` (Task 2).
- Produces: `GET /api/pricing` per the Interfaces table. `export const config = { runtime: 'edge' }`.

- [ ] **Step 1: Failing tests** (Request objects, as `tests/api/bug-report.test.mjs` builds them):

```js
const res = await handler(new Request('https://certanvil.com/api/pricing', { headers: { 'x-vercel-ip-country': 'FR', origin: 'https://networkplus.certanvil.com' } }));
assert.equal(res.status, 200);
assert.equal((await res.json()).currency, 'eur');
assert.equal(res.headers.get('access-control-allow-origin'), 'https://networkplus.certanvil.com');
assert.equal(res.headers.get('cache-control'), 'no-store');
// ?currency=gbp from a US visitor → gbp; origin https://evil.com → no allow-origin header; OPTIONS → 204; POST → 405
// launch env set and inside the window → launch.active true, firstYear '69' for usd
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement** (GET and OPTIONS only; no env var is required, so no 503 path). **Step 4: Run, pass.**
- [ ] **Step 5: Commit** `payments A3: /api/pricing`

---

### Task 4: `POST /api/stripe/create-checkout-session`

**Files:** Create `landing/api/stripe/create-checkout-session.js`, `tests/api/stripe-checkout.test.mjs`; modify the UAT spawn list.

**Interfaces:**
- Consumes: `stripeRequest`, `formEncode` (Task 2); `verifyUser`, `corsHeaders`, `safeReturn` (Task 2); `currencyFor`, `launchState` (Task 2); RPC `is_pro` via `/rest/v1/rpc/is_pro` with the service role.
- Produces: the contract endpoint. Env: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` (each a Price with USD default and GBP/EUR `currency_options`, tax behaviour inclusive), optional `STRIPE_LAUNCH_COUPON`, `LAUNCH_STARTS_AT`, `LAUNCH_ENDS_AT`.

- [ ] **Step 1: Failing tests** (fetch stubbed; record the Stripe POST body and parse it with `URLSearchParams`):

```js
// 503 when STRIPE_PRICE_YEARLY missing; 401 without a valid token; 400 { error: 'bad_plan' } for plan 'weekly'
// is_pro stub true → 409 { error: 'already_pro' } and no call to api.stripe.com
const p = await checkoutBody({ plan: 'yearly', currency: 'gbp', from: 'secplus', returnTo: 'https://secplus.certanvil.com/' }, { launch: true });
assert.equal(p.get('mode'), 'subscription');
assert.equal(p.get('line_items[0][price]'), 'price_yearly');
assert.equal(p.get('currency'), 'gbp');
assert.equal(p.get('discounts[0][coupon]'), 'coupon_launch');
assert.equal(p.get('allow_promotion_codes'), null);
assert.equal(p.get('consent_collection[terms_of_service]'), 'required');
assert.equal(p.get('custom_text[terms_of_service_acceptance][message]'), 'I want Pro to start now, and I understand I lose my 14-day right to cancel.');
assert.equal(p.get('automatic_tax[enabled]'), 'true');
assert.equal(p.get('client_reference_id'), USER.id);
assert.equal(p.get('subscription_data[metadata][supabase_user_id]'), USER.id);
assert.equal(p.get('subscription_data[metadata][plan]'), 'yearly');
assert.equal(p.get('success_url'), 'https://certanvil.com/account?checkout=success&from=secplus');
assert.equal(p.get('cancel_url'), 'https://secplus.certanvil.com/?checkout=cancelled');
assert.equal(p.get('customer_email'), USER.email);
assert.equal(stripeHeaders['Stripe-Version'], '2024-06-20');
// monthly during launch → no discounts; launch window closed → no discounts
// from 'evil<script>' → success_url has no from; returnTo https://evil.com → cancel_url https://certanvil.com/pricing?checkout=cancelled
// existing customer id found in provider_subscriptions → customer=cus_1, customer_update[address]=auto, no customer_email
// Stripe 500 → 500 { error: 'checkout_failed' } and a client_errors write
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement.** `from` is accepted only when it matches `/^[a-z0-9-]{2,20}$/`. `success_url` is always the apex `/account`; `cancel_url` = `safeReturn(returnTo, 'https://certanvil.com/pricing')` + `?checkout=cancelled`. The `is_pro` lookup fails open (as the branch did). Idempotency key: `checkout:<user id>:<plan>:<minute>` so a double tap makes one session.
- [ ] **Step 4: Run, pass.** **Step 5: Commit** `payments A4: checkout session with launch coupon and consent`

---

### Task 5: `POST /api/stripe/webhook`

**Files:** Create `landing/api/stripe/webhook.js`, `tests/api/stripe-webhook.test.mjs`; modify the UAT spawn list.

**Interfaces:**
- Consumes: `verifyStripeSignature`, `stripeRequest` (Task 2); `planForPrice` (Task 2); RPC `apply_provider_subscription_event` (Task 1); `sendMail` from `landing/api/_lib/admin-mail.js`; `logServerError`.
- Produces: `export function mapStripeStatus(s) → status` (`past_due → grace`, `paused → unpaid`, the rest unchanged); `export async function rowForSubscription(sub, eventAt) → p_row`. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, optional `ALERT_EMAIL` (default `support@certanvil.com`). Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `charge.dispute.created`.

- [ ] **Step 1: Failing tests** (sign each body with node:crypto; stub Stripe GETs and the RPC):

```js
// bad signature → 400; missing env → 503; non-POST → 405
// checkout.session.completed → re-GETs /v1/subscriptions/sub_1, RPC row:
assert.deepEqual(pick(row, ['user_id','provider','provider_subscription_id','status','plan','currency','tier']),
  { user_id: U, provider: 'stripe', provider_subscription_id: 'sub_1', status: 'active', plan: 'yearly', currency: 'gbp', tier: 'pro' });
assert.equal(row.launch_price_until, iso(sub.current_period_end));      // session.total_details.amount_discount > 0
// no discount → launch_price_until absent
// subscription.updated past_due → status 'grace', tier 'pro'; canceled → tier 'free'
// charge.refunded full (amount_refunded === amount) → RPC row { status: 'revoked', tier: 'free', revoked_at }, AND DELETE /v1/subscriptions/sub_1 called once
// charge.refunded partial → RPC called with _noop, no DELETE
// charge.dispute.created → re-GET charge, same revoke + cancel as a full refund
// charge whose invoice has no subscription → _noop
// RPC returns 'unmatched' → 200 { result: 'unmatched' }
// RPC throws → 500 and client_errors write (Stripe retries)
// cancel DELETE fails with 404 resource_missing → still 200 (already cancelled)
// second entitling row for the same user (other sub or apple) on checkout.session.completed → one sendMail to ALERT_EMAIL, subject 'Double Pro purchase', body names both subscription ids; webhook still 200
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement**, porting the branch's `webhook.js` structure to Edge: raw body via `await req.text()`; every event re-retrieves its object with the pinned version (`/v1/subscriptions/:id`, `/v1/charges/:id?expand[]=invoice`); the RPC applies, then, only for a full refund or a dispute, `DELETE /v1/subscriptions/:id` (idempotency key `cancel:<event id>`). The double-purchase check reads `readSubs(userId)` before applying.
- [ ] **Step 4: Run, pass.** **Step 5: Commit** `payments A5: webhook, refund cancels, double-purchase alert`

---

### Task 6: Portal session, cancel-on-delete and billing status

**Files:** Create `landing/api/stripe/create-portal-session.js`, `landing/api/stripe/cancel-on-delete.js`, `landing/api/billing/status.js`, `tests/api/stripe-portal.test.mjs`, `tests/api/billing-status.test.mjs`; modify the UAT spawn list.

**Interfaces:**
- Consumes: Task 2 libraries; `sendMail`.
- Produces: the three endpoints in the Interfaces table. Portal `flow` maps to Stripe `flow_data[type]`: `cancel → subscription_cancel`, `card → payment_method_update`, `switch → subscription_update` (with `flow_data[subscription_*][subscription]` = the entitling Stripe row's id). `return_url` = `safeReturn(returnTo, 'https://certanvil.com/manage-subscription')`.

- [ ] **Step 1: Failing tests**

```js
// portal: 401 / 404 no_billing_account / 503; flow 'cancel' → flow_data[type]=subscription_cancel and flow_data[subscription_cancel][subscription]=sub_1
// portal: flow 'cancel' with reason 'else' and note 'too hard' → one sendMail to support@certanvil.com, subject 'Cancel reason: Something else'; reason without RESEND_API_KEY → no mail, still 200
// cancel-on-delete: two active stripe rows → two POST /v1/subscriptions/:id with cancel_at_period_end=true → { cancelled: 2 }
// cancel-on-delete: apple-only rows → { cancelled: 0 }, no Stripe call; Stripe error on one → still 200, logged
// status: free user → { pro:false, source:null, plan:null, status:'free', renewsAt:null, endsAt:null, launchFirstYear:false, fullPriceFrom:null, currency:null }
// status: admin → source 'admin'; web yearly launch buyer → launchFirstYear true, fullPriceFrom ISO; apple row → source 'apple'
// status: ?detail=1 with a stripe row → GET subscription expand default_payment_method → card { brand:'visa', last4:'4242' }; Stripe down → card null, still 200
// status: CORS for https://networkplus.certanvil.com; Cache-Control no-store
```

- [ ] **Step 2: Run, fail.** **Step 3: Implement.** `billing/status` = `summarize(await readSubs(id), await readRole(id), Date.now())` minus its `row` field.
- [ ] **Step 4: Run, pass.** **Step 5: Commit** `payments A6: portal flows, cancel on delete, billing status`

---

### Task 7: Account deletion cancels web billing

**Files:** Modify `landing/lib/account.js` (`wireDeleteAccount`), `features/home.js` (the deletion chain around line 1573); test `tests/e2e/landing-deletion.spec.js` (extend), `tests/uat/540-payments-db.js` (structural check for the app chain).

**Interfaces:**
- Consumes: `POST /api/stripe/cancel-on-delete` (Task 6).
- Produces: none.

- [ ] **Step 1: Failing test.** In `landing-deletion.spec.js`, route `**/api/stripe/cancel-on-delete` to record calls; assert the existing delete test's log becomes `['api:cancel-on-delete', 'rpc:request_account_deletion', 'auth:signOut:global']`, and a second test where the route returns 500 still reaches `rpc:request_account_deletion`.
- [ ] **Step 2: Run** `npx playwright test --project=landing tests/e2e/landing-deletion.spec.js` → FAIL.
- [ ] **Step 3: Implement.** Both flows POST the endpoint (Bearer from the current session, 4s timeout) **before** `request_account_deletion`; any failure is ignored. In `features/home.js`, chain it with the existing Apple revoke (`apple.then(flushed)`) so the order is revoke, cancel, flush, rpc. **The web delete page is Plan A's** (drawing screen G, "Billed on web" and "Billed by Apple" desktop/phone variants): replace the bare confirm box in `landing/lib/account.js` with that page, reading `/api/billing/status` for the variant: web-billed shows the "Your Pro ends with your account" note; Apple-billed shows the warning `You're still billed by Apple. Deleting your account doesn't stop that. Cancel in your Apple ID.` with the Apple subscriptions link, and Delete stays enabled after typing DELETE (no gate). Its intro sentence matches Plan B's iPhone wording for the 7-day window (founder-confirmed copy). Add an e2e for both variants.
- [ ] **Step 4: Run, pass**, plus `node tests/uat.js`. **Step 5: Commit** `payments A7: deleting an account stops web billing`

---

### Task 8: Pro state in the app (`features/pro-state.js`)

**Files:** Create `features/pro-state.js`, `tests/uat/541-pro-state.js`, `tests/e2e/pro-state.spec.js`. Modify `app.js` (`_refreshQuotaChip` body), `index.html` (script tag after `app.js`), `sw.js` (`SHELL_ASSETS`), `lib/cert-lock.js` (`check`).

**Interfaces:**
- Consumes: `window.certanvilSupabase`, `get_daily_quota_usage`, `window._adminPreview.wrap`, `_renderQuotaChip`, event `ca:quota-ready`.
- Produces: `window.refreshProState({ force }) → Promise<{ pro, source }>`; `window.caProLastKnown(uid?) → boolean`; device key `nplus_pro_lastknown` = `{ uid, pro: true, at: <ms> }` (only ever written when the server says Pro; removed when the server says Free or on sign-out); `ca:quota-ready` keeps firing exactly as today.

- [ ] **Step 1: Failing e2e** (`tests/e2e/pro-state.spec.js`, uses `tests/fixtures/fake-supabase.js` routing as `landing-deletion.spec.js` does; runs on chromium, webkit, mobile-safari):

```js
test('a failed Pro check keeps a Pro answer under 24h old', ...);
  // seed nplus_pro_lastknown {uid:fake user, pro:true, at: now-1h}; make the fake rpc reject; expect body.is-pro-tier and chip label 'Pro'
test('a failed Pro check with a 25h-old answer does not invent Pro', ...);   // expect not is-pro-tier
test('a Free answer from the server clears the cache', ...);
test('?pro=1 forces a fresh check, retries until Pro, then drops the param', ...);
  // fake rpc answers free twice then pro; expect is-pro-tier within 10s; expect page.url() has no 'pro='
test('returning to a hidden tab re-checks Pro', ...);   // dispatch visibilitychange with document.hidden false; expect a second get_daily_quota_usage call
test('a paying non-admin is not walled on a second cert', ...);
  // fake profile role 'user', freeCertId 'netplus', open with ?cert=secplus, rpc says pro → no #cl-wall after ca:quota-ready
test('a wall drawn before Pro lands is removed when Pro lands', ...);
```

UAT (`541-pro-state.js`, structural): `features/pro-state.js` is in `index.html` after `app.js` and in `sw.js` `SHELL_ASSETS`; `_refreshQuotaChip` body calls `window.refreshProState`; `app.js` line count ≤ the count before this task.

- [ ] **Step 2: Run, fail.**
- [ ] **Step 3: Implement.** `refreshProState`: signed out → clear the cache, return `{ pro:false, source:'none' }`. RPC ok → wrap with `_adminPreview` if present, set `window._quotaState`, `_renderQuotaChip()`, dispatch `ca:quota-ready`, write or clear the cache, return `source:'server'`. RPC network error or rejection → if `caProLastKnown(uid)` set `_quotaState = { tier:'pro', daily_limit:-1, used_today:(prev?.used_today||0) }`, render, dispatch, return `source:'cache'`; else leave state untouched. On load with `?pro=1`: `force` call, retry at 2.5s intervals up to 4 tries while not Pro, then `history.replaceState` without `pro`. Listeners: `visibilitychange` (visible) and `pageshow` (persisted) call `refreshProState()` at most once per 30s. `_refreshQuotaChip` in `app.js` becomes a one-line delegate (`return window.refreshProState ? window.refreshProState() : undefined;`). `lib/cert-lock.js` `check()`: return early when `window.caProLastKnown && caProLastKnown()` or `_quotaState` says Pro; register one `ca:quota-ready` listener that removes `#cl-wall` and `html.cl-locked` when Pro.
- [ ] **Step 4: Run, pass** (`npx playwright test tests/e2e/pro-state.spec.js`, `node tests/uat.js`, `node tests/tech-debt.js`).
- [ ] **Step 5: Commit** `payments A8: Pro state with 24h last-known and ?pro=1`

---

### Task 9: The paywall and the purchase chokepoint (`features/paywall.js`)

**Files:** Create `features/paywall.js`, `features/paywall-copy.js` (the shared wording table, loaded before `paywall.js`), `tests/e2e/paywall.spec.js`, `tests/uat/542-paywall.js`. Modify `index.html` (script tag), `sw.js` (`SHELL_ASSETS`), `dg-system.css` (paywall rules + `?v=` bump).

**Interfaces:**
- Consumes: `iosSettings.openSheet(html, onTap, { size: 'sm' })` / `iosSettings.closeSheet()` (phone sheet under 900px, centred dialog at 900px and up; the headline must carry `id="ist-sheet-title"`); `GET /api/pricing`; `POST /api/stripe/create-checkout-session`; `window.refreshProState`; `window.buildSignInUrl`; `window.CURRENT_CERT`.
- Produces: `window.openPaywall`, `window.startProUpgrade`, `window.nativePurchase` stub, `window.CAPaywall`, and a delegated click handler: any element with `data-paywall="<trigger>"` opens that trigger on web (preventDefault, then closes an enclosing `.quota-exceeded-modal` or `#pro-only-modal`); on `html.is-native` it does nothing and the element's own behaviour stands. API base = `window.CA_API_BASE || 'https://certanvil.com'`.

**Copy (verbatim from the drawing, screen B). This table is the single source for paywall wording on every surface:** it lives in `features/paywall-copy.js` as `window.PAYWALL_COPY` with `copyFor(trigger, ctx) → { eb, h, p, second }` (ctx: `{ dailyLimit, certLabel, ownedLabel, eyebrow, title, body }`). Plan B's iPhone paywall reads the same function; neither plan duplicates the strings. Any trigger it does not know falls back to the `feature:pro` row.

| Trigger | Eyebrow | Headline | Body | Second button |
|---|---|---|---|---|
| `limit` | Daily limit | You've used today's 15 questions | Your free questions come back at midnight. Pro lifts the limit, so you can keep going now. | Come back tomorrow |
| `run` | `opts.eyebrow` or Reword Gauntlet | That was today's free run | Free includes one Gauntlet run a day. With Pro you can run it as often as you like. (Sim Lab / Decision Lab: "one Sim Lab run", "one Decision Lab run") | Not now |
| `feature:Exam Simulator` | Exam Simulator | Sit the full practice exam | 90 timed questions with PBQs, scored on the real 100 to 900 scale. Part of Pro. | Not now |
| `feature:pro` (generic: Settings Get Pro, and pricing/billing opened inside the iPhone app) | Pro | Unlock every cert with Pro | Free covers one cert and 15 questions a day. Pro lifts both. | Not now |
| `feature:<other>` | `<other>` | `opts.title` or `Unlock <other> with Pro` | `opts.body` or `Part of Pro, along with unlimited questions in every cert.` | Not now |
| `cert:<id>` | `<label>` | Add `<label>` with Pro | Free covers one cert. Pro opens every cert, and your `<owned label>` progress stays where it is. | Stay on `<owned label>` |

"15" in the `limit` headline is `_quotaState.daily_limit`. Plan rows: Yearly (picked) then Monthly. Yearly badge `Launch offer` while the launch is active, else `Save N%` with N = round((1 − yearly ÷ (12 × monthly)) × 100); Yearly price `$89` + small `a year`, sub-line `$7.42 a month`; during launch `$89` struck, `$69` + small `first year`, sub-line `Then $89 a year`. Monthly `$9.99` + small `a month`. Launch line (Yearly picked, launch active): `$69 for your first year, then $89. Ends 23:59 UK time, 1 Dec.` (time and date of `endsAt` in `Europe/London`). Ticks: `Unlimited questions in every cert`, `Exam Simulator and full labs`, `Drills that fix your mistakes`. Renew line: `Renews automatically at $89 a year until you cancel.` / `Renews automatically at $9.99 a month until you cancel.` Button `Get Pro` (`data-web-purchase`), second button, trust line `Cancel anytime · Secure checkout by Stripe`. Already Pro: `You're already Pro` / `This account has Pro, so there's nothing to buy. Everything is unlocked.` / `Back to studying`. Checkout failure line: `Checkout didn't open. Try again in a moment.` Cancelled toast: `Checkout cancelled. No charge was made.`

- [ ] **Step 1: Failing e2e** (`tests/e2e/paywall.spec.js`; desktop 1280×820 and phone 390×844 viewports; route `https://certanvil.com/api/**`):

```js
test('limit paywall: headline, Yearly picked, prices from /api/pricing, renew line', ...);
  // pricing stub gbp → '£79', '£6.58 a month', '£8.99', 'Renews automatically at £79 a year until you cancel.'
test('launch on: struck £79, £59 first year, launch line with UK time', ...);
test('picking Monthly swaps the renew line and drops the launch line', ...);
test('desktop opens a centred dialog, phone opens the bottom sheet', ...);   // #ist-sheet.is-dialog at 1280; not at 390
test('Get Pro posts plan, currency, from and returnTo, then navigates to the returned url', ...);
test('double tap on Get Pro sends one checkout request', ...);
test('409 already_pro shows You\'re already Pro', ...);
test('the owner in Preview as Free sees You\'re already Pro, never Stripe', ...);   // _adminPreview on, server 409
test('pricing unreachable: plans named without amounts, no NaN or undefined, Get Pro still works', ...);
test('signed out: Get Pro keeps the plan, goes to sign-in, and resumes checkout once after sign-in', ...);
  // sessionStorage ca_pending_plan {plan:'monthly', at}; after the fake signs in, exactly one checkout request with plan 'monthly'; key removed
test('?checkout=cancelled shows the toast once and drops the param', ...);
test('Pro already (from _quotaState) → startProUpgrade shows You\'re already Pro without a request', ...);
test('html.is-native: openPaywall returns false and nothing opens', ...);   // add class before load
test('Escape, scrim and the second button close it; focus returns to the opener', ...);
```

UAT (`542-paywall.js`): script tag and `SHELL_ASSETS` entry exist; `dg-system.css?v=` in `index.html` changed from `8.204.0`; no `$`, `£` or `€` followed by a digit inside `features/paywall.js`; no em dash in its strings.

- [ ] **Step 2: Run, fail.**
- [ ] **Step 3: Implement `openPaywall(trigger, opts) → boolean`**: native → `false`; else fetch pricing once per page (cached promise; failure → `null`), render via `iosSettings.openSheet`, return `true`. Layout and classes are a lift of the drawing's `paywall()`, `planRows()` and `alreadyPro()` under a `.pw` root class; CSS rules for `.pw`, `.pw .plans`, `.pw .plan`, `.pw .ring`, `.pw .p-*`, `.pw .ticks`, `.pw .launch-line`, `.pw .renew`, `.pw .pw-trust`, `.pw-done` come from the drawing's stylesheet with its tokens mapped to `dg-system.css` tokens, scoped under `.pw` so nothing global collides.
- [ ] **Step 4: Implement `startProUpgrade(plan) → Promise<void>`**: (1) Pro per `_quotaState` → already-Pro body; (2) `html.is-native` → `return window.nativePurchase(plan)`; (3) no session → write `sessionStorage.ca_pending_plan = { plan, at }`, go to `buildSignInUrl()`; (4) lock the button, POST checkout with `{ plan, currency, from: window.CURRENT_CERT, returnTo: location.origin + location.pathname }`, `409` → already-Pro body, `200` → `location.assign(url)`, else the failure line and unlock. On `ca:quota-ready`, a pending plan under 30 minutes old resumes once and is removed. `window.nativePurchase = window.nativePurchase || function () { return Promise.resolve(false); }`.
- [ ] **Step 5: Run, pass** on all three app projects: `npx playwright test tests/e2e/paywall.spec.js --project=chromium --project=webkit --project=mobile-safari`; `node tests/uat.js`.
- [ ] **Step 6: Commit** `payments A9: one paywall and one purchase chokepoint`

---

### Task 10: Point every Go Pro in the app at the paywall; free-limit copy

**Files:** Modify `app.js` (lines ~717, ~788, ~943, ~1045 and `_showQuotaExceededUI` / `_showProOnlyUI` / `_showDailyLimitPreblockUI`), `index.html` (both `.settings-go-pro-btn`), `lib/cert-lock.js:99`, `lib/onboarding-chrome.js` (`go-pro`), `features/flagship-drills.js` (`_gateGauntletDaily`), `features/sr-review.js:1238`, `features/ios-hub.js` (370, 403, 441), `features/ios-firstrun.js` (`goPro`, line 206 copy), `features/ios-settings.js` (`ON.gopro`), `features/ios-simlab.js` (`simLabSummaryUpsell`), `features/quiz-engine.js` (`render`, nudge host), PBQ / Decision Lab free-run blocks (find with `node scripts/graphq.js callers _pbqFreeRunsToday` and `callers _dlFreeRunsToday`). Create `tests/uat/543-go-pro-paths.js`, `tests/e2e/go-pro-paths.spec.js`.

**Interfaces:**
- Consumes: `openPaywall`, `data-paywall` delegation (Task 9).
- Produces: `window.renderPaywallNudge(hostEl)` in `features/paywall.js` (fills the host with `10 of today's 15 used` + `See Pro` link when Free and `10 ≤ used_today < daily_limit`, else empties it).

Rules for each CTA:
- An `<a href="https://certanvil.com/pricing">` keeps its `href`, gains `data-paywall="<trigger>"` and `data-web-purchase`, loses `target="_blank"`, and reads without an em dash. Tooltip (717) and pre-block (943) → `limit`; quota modal (788) → `limit`; Pro-only card (1045) → `feature:<detail.feature>` and its label becomes `Unlock with Pro`; `.settings-go-pro-btn` → `limit`; cert-lock → `cert:<here>` with the owned cert passed via `data-paywall-owned`; sr-review → `limit`; ios-hub desk card → `cert:<id>` and drop the hardcoded `From $7.42 a month. Cancel anytime.` line.
- `_showQuotaExceededUI` and `_showProOnlyUI` start with `if (detail && detail.trigger && window.openPaywall && window.openPaywall(detail.trigger, detail)) return;`; `_gateActivityForQuota` passes `trigger: 'limit'`; `_gateGauntletDaily` passes `trigger: 'run'`; ios-hub's "Every cert" calls pass `trigger: 'cert:<id>'`. With no trigger, or on iPhone, today's modal draws as before. Net `app.js` lines ≤ 0: drop the now-dead `target`/`rel` attributes and fold the three hand-off lines into existing ones.
- Button CTAs (`ios-firstrun goPro`, `ios-settings ON.gopro`, `ios-simlab` upsell, `onboarding-chrome go-pro`): call `openPaywall(trigger)`; when it returns `false`, keep today's behaviour.
- Copy: `ios-firstrun.js:206` `20 questions a day` → `15 questions and 5 review cards a day`.
- Nudge: `render()` in `features/quiz-engine.js` calls `window.renderPaywallNudge(host)` on a `.pw-nudge` host placed after `#options` (never inside it: `pick()` targets `#options .option`).

- [ ] **Step 1: Failing tests.** UAT: no `certanvil.com/pricing` link in `app.js`, `index.html`, `lib/`, `features/` lacks `data-paywall`; no `target="_blank"` on them; no `&mdash;` in their labels; `ios-firstrun.js` has no `20 questions a day`; `ios-hub.js` has no `$7.42`; `app.js` length ≤ before. E2E (chromium, webkit, mobile-safari): Free user at 15/15 starting a quiz sees the `limit` paywall; Gauntlet second start sees `That was today's free run` over the result; Exam Simulator shows the Pro card then `Unlock with Pro` opens `Sit the full practice exam`; Settings Go Pro opens `limit`; cert-lock `Unlock all exams · Pro` opens `Add Security+ with Pro` with `Stay on Network+`; 10/15 shows the nudge line; with `html.is-native` every one of those shows today's fallback and no `.pw`.
- [ ] **Step 2: Run, fail.** **Step 3: Implement** the rules above. **Step 4: Run, pass**, plus `node tests/tech-debt.js`. **Step 5: Commit** `payments A10: every Go Pro goes through the paywall`

---

### Task 11: Grace banner and Pro-ended screen in the app

**Files:** Create `features/billing-notices.js`, `tests/e2e/billing-notices.spec.js`. Modify `index.html` (script tag), `sw.js`, `dg-system.css` (`.ca-grace` banner rules, same `?v=` bump rule).

**Interfaces:**
- Consumes: `GET /api/billing/status` (once per page load after the first `ca:quota-ready` with a session); `POST /api/stripe/create-portal-session` `{ flow: 'card' }`; `startProUpgrade`; `iosSettings.openSheet`.
- Produces: device key `nplus_pro_ended_seen` = the `endsAt` already shown.

Copy (drawing, screen E): web banner `Your card didn't go through. Update it to keep Pro.` / `Pro stays on while we try again.` / `Update card`. Apple-billed banner `Apple couldn't renew your Pro.` / `Update your payment method in Apple to keep it. Pro stays on in the meantime.` / `Open Apple` → `https://apps.apple.com/account/subscriptions`. Web-billed account on `html.is-native`: banner text only, no button. Ended: eyebrow `Pro`, `Your Pro has ended`, `Your progress is kept: every answer, streak and score. You're back on Free, with 15 questions and 5 review cards a day on <cert label>.`, `Renew: $89 a year. Renews automatically until you cancel.` (omitted on `html.is-native`), `Renew Pro` (`data-web-purchase`, calls `startProUpgrade('yearly')`), `Continue on Free`.

- [ ] **Step 1: Failing e2e** (three app projects): `status: 'grace', source: 'stripe'` → banner at the top of Home (desktop `#page-home`, phone `#ios-home`) with `Update card`, which posts `flow: 'card'`; `source: 'apple'` → `Open Apple`; native + stripe → no button; `status: 'ended'` → dialog once, a reload does not show it again, a new `endsAt` shows it again; `Continue on Free` closes it; Free and Pro → nothing; status 500 → nothing, no console error.
- [ ] **Step 2: Run, fail.** **Step 3: Implement**, banner markup and rules lifted from the drawing's `graceBanner()` and `endedBody()`. **Step 4: Run, pass.** **Step 5: Commit** `payments A11: grace banner and Pro-ended screen`

---

### Task 12: `/account`: status line and the confirmation page

**Files:** Create `landing/lib/billing.js`, `landing/lib/checkout-return.js`, `landing/lift-billing.css`, `tests/e2e/landing-account-pro.spec.js`. Modify `landing/account.html` (load the three files; a `#acct-plan-row` in `#section-subscription`; a `#checkout-return` host above `#account-content`), `landing/lib/account.js` (every `role === 'admin'` Pro decision reads `isPro` from billing status; `#btn-upgrade` becomes a `Get Pro` link to `/pricing` with `data-web-purchase`).

**Interfaces:**
- Consumes: `/api/billing/status`, `/api/pricing`, `/api/stripe/create-checkout-session`, `/api/stripe/create-portal-session`; `profile.active_cert`; the `CERT_HOST` map from `lib/router.js` (copy the eight hosts into `landing/lib/billing.js` as `CERT_HOST`, with a comment naming the source).
- Produces: `window.caBilling = { status(detail?), checkout(plan, currency), portal(flow, extra), certHost(id), fmtDate(iso) }`.

Status line (drawing, D/acct-*): `Pro · Yearly · renews 14 Mar 2027` + `Billing` link; Apple `Pro · Yearly · billed by Apple` + `Billing`; Free `Free` + `Get Pro`; cancelled `Pro until 14 Mar 2027`; grace `Pro · Yearly · payment due`; owner `Pro · Owner`.

Confirmation (`?checkout=success[&from=<id>]`, drawing C): `Confirming your payment…` / `This takes a few seconds. Keep this page open.` → poll status every 3s; Pro → `You're Pro`, plan line (`Yearly · $69 for your first year, then $89 a year` when `launchFirstYear`, else `Yearly · $89 a year` / `Monthly · $9.99 a month`, in the subscription's currency), ticks `Unlimited questions in <cert> and every other cert`, `Exam Simulator, Marathon and full Sim Lab`, `Drill Mistakes and Why-Not`, `Start studying`, `Takes you back to <cert>. Your receipt is on its way to <email>.` After 20s still Free → `Payment received` / `Pro switches on within a minute. Your receipt is on its way to <email>.` / `Checking every few seconds` / `You can start studying now. Pro turns on by itself. Still Free after five minutes? Email support@certanvil.com.` / `Start studying`; poll every 5s up to 5 minutes; flips to `You're Pro` by itself. Cert = valid `from`, else `profile.active_cert`, else `netplus`. Start studying → `certHost(cert)` with `pro=1` added (`?` or `&`). The status card uses `role="status" aria-live="polite"`. `?checkout=` is removed from the URL once read.

- [ ] **Step 1: Failing e2e** (`--project=landing`, fake Supabase + routed `/api/**`): status line for each of the six states; Free `Get Pro` has `href="/pricing"` and `data-web-purchase`; confirmation shows Confirming then You're Pro when status flips on the second poll; slow path after 20s (use `page.clock`); Start studying `href` equals `https://secplus.certanvil.com/?pro=1` for `from=secplus`, `https://aplus.certanvil.com/?exam=core1&pro=1` for `from=aplus-core1`, `https://networkplus.certanvil.com/?pro=1` with no `from` and no `active_cert`; bad `from` (`evil`) falls back; a paying non-admin's entitlement list and exam-results section are unlocked; a 390px viewport has no horizontal scroll.
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass.** **Step 5: Commit** `payments A12: account status line and the confirmation page`

---

### Task 13: Billing page with every state and the cancel question

**Files:** Modify `landing/manage-subscription.html` (title `Billing · CertAnvil`, crumb `Account / Billing`, `h1` Billing, one `#bl-card` host and a help section; load `lib/billing.js` and `lift-billing.css`), rewrite `landing/lib/manage-sub.js`. Create `tests/e2e/landing-billing.spec.js`.

**Interfaces:**
- Consumes: `window.caBilling` (Task 12).
- Produces: none.

States (drawing D, copy verbatim; prices from `/api/pricing` for Free/ended hints and from the status `currency` for the subscription's own price):

| State | Card | Actions |
|---|---|---|
| free | `Free`, pill `Current plan`, `15 questions and 5 review cards a day, on one cert.`, `Pro adds` + the three ticks | `Get Pro` → `/pricing` (`data-web-purchase`), hint `$69 for your first year, then $89` (launch) or `$89 a year or $9.99 a month` |
| active (stripe) | `Pro · Yearly` / `Pro · Monthly`, pill `Active`; Price `First year $69, then $89 on 6 Nov 2027` (launch) / `$89 a year` / `$9.99 a month`; Next charge `$89 on 6 Nov 2027`; Paid with `Visa ending 4242` (only when `card`); Receipts `Each receipt is emailed to <email>. Past invoices are in Manage billing.` | `Manage billing` (portal), `Cancel Pro` |
| cancelled | `Pro until 14 Mar 2027`, pill `Cancelled`, `You won't be charged again. Pro stays on until 14 Mar, then you move to Free with all your progress.` | `Resume Pro` (portal), `Manage billing` |
| grace | `Pro · Yearly`, pill `Payment due`, `Your card didn't go through. Update it to keep Pro.` / `We'll try again over the next few days. Pro stays on until then.` | `Update card` (portal `card`), `Cancel Pro` |
| apple | `Pro · Yearly`, pill `Billed by Apple`, `Billed by Apple through your Apple ID. Changes and cancellation go through Apple.` | `Manage in Apple` → `https://apps.apple.com/account/subscriptions` |
| ended | `Free`, pill `Pro ended 14 Mar`, `Your Pro has ended. Your progress is kept.` | `Renew Pro` → `caBilling.checkout('yearly', currency)` (`data-web-purchase`), hint `$89 a year or $9.99 a month` |
| owner | `Owner`, pill `Full access`, `This account has Pro on every cert. Nothing is billed to it.` | none |

Help: `Questions about a charge? Email support@certanvil.com.` Cancel question (sheet on phones, dialog on desktop): `Why are you cancelling?` / `One question, then you confirm on the next screen.` Options `Passed my exam`, `Too expensive`, `Something else`. Passed → `Congratulations on passing` + `Pro covers every cert, including your next one. Your Pro stays on until <date> either way.` and, when the current cert has a next step on the CompTIA ladder (A+ Core 1 → A+ Core 2 → Network+ → Security+), `Lots of people take <next> after <current>, and Pro already covers it.` with `Start <next>`. Too expensive on Monthly → `Yearly costs $7.42 a month` / `Same Pro, $89 a year. That's $30.88 a year less than Monthly. Or stay on Free after you cancel: 15 questions a day, with your progress kept.` / `Switch to Yearly` (portal `switch`); on Yearly only the `Or stay on Free…` sentence. Something else → `Anything we could do better?` / `Optional. It goes straight to support.` + textarea. Footer `Keep Pro` (closes) and `Continue to cancel` (portal `cancel` with `reason` and `note`), both always visible; `Continue to cancel` works with no answer picked. The yearly saving figure is computed (12 × monthly − yearly), not typed.

- [ ] **Step 1: Failing e2e** (`--project=landing`, desktop and 390px): each of the seven states renders its copy and actions; no element anywhere on the page contains `refund`; `Cancel Pro` opens the question; each answer shows its follow-up; `Continue to cancel` posts `{ flow: 'cancel', reason, note }` and navigates to the returned url; with no answer it posts `{ flow: 'cancel' }`; `Switch to Yearly` posts `flow: 'switch'`; portal 404 shows `Get Pro` instead of an error; signed out shows the existing anon gate.
- [ ] **Step 2: Run, fail.** **Step 3: Implement**, markup lifted from the drawing's `billing()`, `cancelSheet()` and `account()`, styles in `landing/lift-billing.css`. **Step 4: Run, pass.** **Step 5: Commit** `payments A13: Billing page and the cancel question`

---

### Task 14: Visual pass and cross-platform verification

**Files:** Whatever the pass changes in Tasks 9–13's surfaces; `tests/e2e/visual.spec.js` (optional local baselines only).

- [ ] **Step 1: Run the 5-stage visual pass in order** on the paywall (all four triggers + already Pro + nudge), the grace banner, the Pro-ended screen, the confirmation page (three states), the Billing page (seven states + cancel question) and the account status line: `design-taste-frontend`, `emil-design-eng`, `transitions-dev`, `humanizer`, `marketing-psychology`. Stage 2 decides whether anything moves; stage 3 only choreographs what stage 2 kept; BRAND.md §6 values win over any skill's numbers. Copy changes from stages 4–5 may not alter any string this plan marks verbatim; raise those with the founder instead.
- [ ] **Step 2: Desktop (1280×820) and mobile web (390×844) walk-through** on `python3 -m http.server 3131` (app) and `npx serve landing -l 3132` (landing), routes stubbed as in the specs: each surface side by side with its drawing frame; record DOM rects for the sheet/dialog and no horizontal scroll at 390px; light and dark themes; keyboard only (Tab wraps in the dialog, Escape closes); zero console errors.
- [ ] **Step 3: iOS shell walk-through** in the iOS Simulator (`mcp__Claude_Code_iOS_Simulator__control` attach, then launch the current dev build): hit the daily limit, open Settings, open a second cert, open Home with a grace and an ended status stubbed. Expected: no `.pw`, no price, no Stripe or pricing link, today's fallbacks only; web-billed grace banner without a button.
- [ ] **Step 4: Full suites**: `node tests/uat.js`, `node tests/tech-debt.js`, `npx playwright test --project=chromium --project=webkit --project=mobile-safari --project=landing`. Expected: all pass.
- [ ] **Step 5: Commit** `payments A14: visual pass`

---

### Task 15: Gated-lane ship

**Files:** `app.js`, `sw.js`, `index.html`, `package.json`, `CLAUDE.md` (via `bump-version.js`), `CHANGELOG.md`, `ENVIRONMENT_STRATEGY.md` (Stripe env table rows), `landing/SETUP.md` (env list).

- [ ] **Step 1: Version** `node scripts/bump-version.js 8.206.0 "Payments: Stripe checkout, one paywall, Billing and the confirmation page"`; update the UAT version pins (`SHIP_CHECKLIST.md` 2.2); CHANGELOG entry; `node tests/uat.js` passes.
- [ ] **Step 2: Docs** Add to `ENVIRONMENT_STRATEGY.md` and `landing/SETUP.md` the landing env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_LAUNCH_COUPON`, `LAUNCH_STARTS_AT`, `LAUNCH_ENDS_AT`, `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, optional `ALERT_EMAIL`. Preview scope gets `sk_test_…` only.
- [ ] **Step 3: PR** `git push -u origin feat/payments-a`; `gh pr create --draft` with the PR template's gated checklist, the commit trailer and `ACTION REQUIRED: paste supabase/migrations/20261101_provider_subscriptions.sql in the Supabase SQL Editor after merge`. Confirm the Supabase branch DB applied the migration (Supabase dashboard → Branches) and the Vercel previews for both projects built.
- [ ] **Step 4: Founder: Stripe test mode** (ask, then wait): two Prices (Monthly, Yearly) in USD with GBP and EUR `currency_options`, tax-inclusive; the launch coupon (amount off 20 in each of USD, GBP, EUR via `currency_options`, duration once, redeem-by = launch end); Stripe Tax on (apply for Managed Payments in parallel); wallets on; Smart Retries on; receipt emails on; upcoming-renewal reminder emails on; Customer Portal on with cancel, payment-method update and plan switch between the two Prices; the Terms URL set (required for consent collection); a test webhook endpoint at the landing preview's `/api/stripe/webhook` with the five events; test keys and ids in Vercel **Preview** scope.
- [ ] **Step 5: Preview smoke** with card `4242 4242 4242 4242`, signed in as a test account on the preview: Free → limit paywall → Get Pro (Yearly, GBP via `?currency=gbp` on `/api/pricing`) → Stripe shows the consent line and the email locked → pay → `/account` shows Confirming then You're Pro → Start studying lands on the cert with `?pro=1` and the chip reads Pro → Billing shows Active with launch dates when the window env is set → Cancel → question → portal cancel → Billing shows Cancelled + Resume → Resume. Then `4000 0000 0000 0341` for a failed renewal (Stripe test clock): grace banner and Billing grace. Refund in full from the dashboard: Pro gone, subscription cancelled; a partial refund: nothing changes. A second checkout while Pro: `409` → You're already Pro. Run the migration's ROLLBACK block on the branch DB, re-apply, re-run `migration-audit.sql`: the five new rows `ok`, quota row `ok`.
- [ ] **Step 6: Cross-platform on the preview**: desktop Chrome, iPhone Safari (mobile web), and the iOS shell pointed at the preview build: the Task 14 checks again against live endpoints.
- [ ] **Step 7: Merge** Mark the PR ready, CI green (UAT + Playwright), squash-merge.
- [ ] **Step 8: Founder: production** (ask, then wait): paste the migration in the prod SQL Editor; run `scripts/sql/migration-audit.sql` (no `MISSING` rows for `20261101_*`; the 15-question row `ok`); live-mode Prices, coupon, portal and webhook endpoint `https://certanvil.com/api/stripe/webhook`; live keys in Vercel **Production** scope for `certanvil-landing`; redeploy landing. Until launch day (Plan C's switch), `LAUNCH_*` stay unset and the landing pricing page still shows the waitlist, so no stranger reaches checkout.
- [ ] **Step 9: Post-deploy**: `curl -sS https://certanvil.com/api/pricing -H 'x-vercel-ip-country: GB'` returns `gbp`; `curl -sS -X POST https://certanvil.com/api/stripe/webhook` returns `400`; the cert app serves `8.206.0`; drive the prod app in a real browser (cache-busted URL) to the limit paywall without buying; Stripe dashboard shows the webhook endpoint healthy.

---

## Self-review notes

- Spec coverage: gap 1 (Tasks 1, 5, 7), gap 2 (Tasks 2–4, 15 founder steps), gap 3 (Tasks 5, 6, 12, 13), gap 8 web half and labels (Tasks 9, 12, 13), gap 9 (Task 11), cross-platform runtime (Task 8), triggers table (Tasks 9, 10). The exam-date nudge has no surface in the drawing and is left out. Renewal reminder is Stripe's own setting (Task 15 step 4). Plan C owns pricing, landing markers, legal, launch; Plan B owns everything Apple.
- Out of scope here and named so nobody builds it twice: the web delete-account page and Apple warning (B), `data-web-purchase` landing rule and native-hide everywhere (C), `/api/revenuecat/webhook` (B), checkout analytics events (C).
