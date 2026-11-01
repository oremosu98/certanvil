---
up: "[[Mobile MOC]]"
type: plan
status: draft
cert: all
updated: 2026-11-01
tags: [plan, mobile, payments]
---
# Payments Plan B: iPhone purchase (RevenueCat + StoreKit) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Someone in the CertAnvil iPhone app can buy Pro (Monthly or Yearly) through Apple once sales open, see it switch on even if Apple's notification is slow, restore it, see their plan in Settings, and be warned about Apple billing before deleting their account; Apple's events land in the same subscription record as Stripe's, and App Review can sign in and buy.

**Architecture:** The app's web code runs inside the Capacitor shell (`server.url` = `https://networkplus.certanvil.com`), so the RevenueCat plugin is reached the way every other plugin is: `window.Capacitor.Plugins.Purchases`, wrapped in `native-shell.js` as `caNative.iap`. A new `features/ios-pro.js` owns everything iPhone-only that the person sees: the native paywall (`window.nativePaywall`, which Plan A's `openPaywall` calls on `html.is-native`), the purchase and restore flows, the confirming / You're Pro / Ask to Buy screens, the Settings plan rows, the grace banner, the Pro-ended sheet and the deletion screen. RevenueCat's webhook (`landing/api/revenuecat/webhook.js`, Edge) maps each event to one row and writes it through Plan A's `apply_provider_subscription_event` with `provider='apple'`; `POST /api/revenuecat/sync` pulls the subscriber from RevenueCat's REST API when the webhook is slow or broken.

**Tech Stack:** Capacitor 8.5.3 (iOS, SPM, deployment target iOS 15, iPhone only), `@revenuecat/purchases-capacitor` 14.0.0 (peer `@capacitor/core >=8.0.0`, SPM, depends on `purchases-hybrid-common` 20.0.0; checked on npm 1 Nov 2026), RevenueCat iOS SDK (StoreKit 2 on iOS 16+, StoreKit 1 on iOS 15), vanilla JS IIFEs with `window` exports, Vercel Edge function on certanvil-landing, Supabase RPC, UAT (`tests/uat/555-ios-pro.js`, `tests/uat/556-review-signin.js`), Node endpoint test (`tests/api/revenuecat-webhook.test.mjs`), Playwright (`tests/e2e/ios-pro.spec.js`, chromium + webkit + mobile-safari).

**Spec:** `docs/superpowers/specs/2026-11-01-payments-e2e-design.md` (approved 1 Nov). Drawing: `mockups/payments-concept.html`, iPhone frames in screens B (Paywall, axis "iPhone app"), C (`iwait`, `ipro`, `ask`), E (`grace`, `ended`, `set-apple`, `set-applecx`, `set-web`, `set-free`), G (`apple`). Cross-plan contract: `payments-contract.md` (Plan A produces, Plan B consumes). Prior art: `docs/superpowers/plans/2026-06-26-g3-ios-revenuecat-purchase-coordinator.md` (never built; its `app-iap.js` + dynamic `import()` cannot work in a remote-URL web view and is superseded here).

**Runs after Plan A has merged** (which itself sits on `main` after `feat/cert-registry`). Every name under "Consumes" that comes from Plan A is used exactly as the contract spells it. UAT numbers 555–557 only (`feat/cert-registry` owns 540–546, A 550–554, C 560–566). Re-derive file line numbers with `node scripts/graphq.js` at execution.

## Global Constraints

- iPhone: "Apple in-app purchase only, in every country, through RevenueCat. No link or price that points to web purchase." (D6)
- "the iPhone app always shows StoreKit's localized price, never a hardcoded figure." (D1) No `$`, `£`, `€` literal or price number in `features/ios-pro.js`.
- "The billed amount per period is always the most prominent price"; the per-month figure is a smaller secondary line under Yearly. (D1)
- "Yearly is the default everywhere it can be chosen." (D2) "No trial." (D3)
- Launch on iPhone: "the iPhone shows 'Launch offer, first year' with StoreKit's price and 'Ends [date]' (date only)". Only when Apple says this account is eligible for the intro offer.
- Paywall auto-renew line on iPhone: "Renews automatically at [price] a year until you cancel." + "Cancel at least 24 hours before renewal in your Apple ID settings." Trust line "Cancel anytime · Billed through your Apple ID". Footer links: "Restore purchases", "Terms of Use", "Privacy".
- RevenueCat `app_user_id` = the Supabase user id. Nobody buys while signed out.
- "Before opening Apple's sheet, the app asks the server whether the account already has Pro (from any source); if it does, no sheet opens and it shows 'You're already Pro'." "The buy button locks while it is open."
- Web-billed Pro on iPhone reads "Pro (billed outside the App Store)" as plain text: no domain, never a link. A web-billed grace notice reads "There's a problem with your Pro billing. Check your email." with no button and no instruction to pay. The iPhone app shows no Go Pro waitlist, no pricing / billing / Stripe / refund link and no web launch offer. Terms and Privacy open with `?app=1` (Plan C's native-hide hides every web-purchase element on them).
- Sales-open (D13): before the iPhone sheet opens, the server's `canBuy` (from `GET /api/billing/status`) must be true. App Review's demo account is in `billing_test_accounts`, so the reviewer sees the full live paywall; the founder holds the binary with "Manually release this version" until sales open, so the public never meets the closed state. IAP is never gated on a web flag the reviewer cannot see.
- Plan B never reassigns `window.openPaywall`; it defines `window.nativePaywall` and Plan A's `openPaywall` hands off to it. Cert names come from `CertRegistry.get(id).shortName` (not `_hubShort`, which is private to the `ios-hub.js` IIFE).
- Sandbox rows count as Pro only for `billing_test_accounts`, admins and playtesters (Plan A's `is_pro()`): TestFlight purchases never give a stranger real Pro.
- No refund promise or refund button anywhere (D9). One contact: support@certanvil.com (D10).
- Deletion: Apple-billed Pro shows the warning with the link to Apple's subscriptions page; "Delete stays available (Apple expects a warning and a link, not a gate)". The Sign in with Apple revoke (`iosSignIn._appleRevoke`, `landing/api/apple-revoke.js`) is kept and still runs.
- Webhook: RevenueCat is the only Apple feed ("we do not consume App Store Server Notifications directly"); auth by the `Authorization` header; idempotent by event id; graceful 503 on missing env.
- Repo rules: gated lane (feature branch → PR → Supabase branch DB + Vercel preview → squash-merge); no new lines in `app.js` (ratchet `tests/appjs-baseline.json`); new UI in `features/*.js`; `lift-ios.css?v=` and `dg-system.css?v=` hand-bumped in the same commit as any change to those files; no em dashes in on-screen copy; the app never names the founder; no inline `on*=` handlers; never write user-state localStorage on prod hosts while testing.
- Every on-screen surface in this plan gets the five-stage visual pass (design-taste-frontend → emil-design-eng → transitions-dev → humanizer → marketing-psychology). Motion values come from `design/brand/BRAND.md` §6, never from transitions.dev.

## Review Focus

1. **An older app binary (no Purchases plugin) loads the new web code.** Expect today's behaviour: no paywall buy button, no Restore row, nothing that taps into nothing. Test: Task 2 `iap.ready() is false without the plugin`, Task 4 `no native paywall without the plugin`.
2. **App Review buys in the sandbox against the production webhook.** Expect Pro to switch on for the demo account (stored with `environment: 'sandbox'`, counted because the account is allowlisted), and a TestFlight stranger's sandbox purchase not to grant Pro. Tests: Task 1 `sandbox events are tagged sandbox`, Plan A Task 1 sandbox allowlist case, Task 9 Step 2.
3. **The connection drops after Apple has charged.** Expect "Confirming…" to keep checking (on a timer and on every return to the app), never a failure screen. Test: Task 3 `confirming survives a failed status check and resolves on app-active`.
4. **Two accounts on one phone.** Person A signs out, person B signs in and buys. Expect the purchase to land on B. Test: Task 2 `identify logs in the new user before any purchase`; Task 3 `purchase refuses when RevenueCat's user is not the session user`.
5. **Restore on an Apple ID whose Pro belongs to another CertAnvil account.** Expect a plain message naming the cause, no transfer and no Pro on this account. Test: Task 3 `restore on another account's Apple ID explains and grants nothing`.

---

## File structure

- Create `landing/api/revenuecat/webhook.js`: Edge handler + pure `mapRevenueCatEvent(event)`.
- Create `landing/api/revenuecat/sync.js` and `landing/api/_lib/revenuecat.js` (`rcGetSubscriber(uid)`, `rcDeleteSubscriber(uid)`, `rowsFromSubscriber(sub, uid)`); modify `landing/api/_lib/billing-release.js` (`releaseApple`).
- Create `landing/api/auth/review-signin.js` (App Review demo sign-in) and modify `features/ios-signin.js` to use it.
- Create `tests/api/revenuecat-webhook.test.mjs`, `tests/api/revenuecat-sync.test.mjs`, `tests/api/review-signin.test.mjs`: endpoint suites (fetch stubbed), run from UAT.
- Modify `native-shell.js`: `caNative.iap` (plugin wrapper, prices, identify, purchase, restore, listener) and `caNative.openSubscriptions()`; sets `html.ca-iap` when the plugin is present.
- Modify `package.json`, `ios/App/CapApp-SPM/Package.swift` (via `npx cap sync ios`), `ios/App/App.xcodeproj/project.pbxproj` (In-App Purchase capability), `ios/App/App/Products.storekit` (new, simulator only).
- Create `features/ios-pro.js`: `window.nativePurchase`, `window.nativeRestore`, `window.nativePaywall`, the confirmation screens, `window.iosPro` (settings rows model, grace banner, ended sheet, delete screen). Loaded deferred after `features/ios-sheet.js` in `index.html`.
- Modify `features/ios-settings.js`: the Plan section and its actions.
- Modify `features/settings.js`: on the iPhone app, Delete account opens `iosPro.openDelete()` instead of the modal.
- Modify `features/ios-signin.js`: accept `from: 'paywall'`.
- Modify `lift-ios.css` (`.ip-*` classes, from the drawing) and `dg-system.css` (the ADR-004 hide rule at the `html.is-native a[href*="certanvil.com/pricing"]` line: every Go Pro selector becomes `html.is-native:not(.ca-iap) …`, see Task 5).
- Create `tests/uat/555-ios-pro.js`, `tests/uat/556-review-signin.js`, `tests/e2e/ios-pro.spec.js`.
- Modify `docs/mobile/APP_STORE_DISTRIBUTION.md`: §In-app purchase (founder setup record, sandbox testing, App Review notes).
- Modify `scripts/sql/migration-audit.sql`: nothing (Plan B adds no migration).

---

### Task 0: Founder setup (FOUNDER-ONLY, cannot be coded)

Only the founder can do these. Tasks 1 to 8 can be built and tested against stubs before they are done; Task 9 cannot start until every box below is ticked. Record each value's *location* (never the secret) in `docs/mobile/APP_STORE_DISTRIBUTION.md` §In-app purchase.

- [ ] **F1. App Store Connect agreements:** Business → Paid Apps agreement signed and Active, tax forms and bank account done. (Small Business Program: enrolled July.)
- [ ] **F2. Products:** App → Subscriptions → one subscription group "CertAnvil Pro" with two auto-renewable products: `pro_monthly` (1 month) and `pro_annual` (1 year). Same level for both is fine; Yearly listed first. Prices: pick Apple's price points matching $9.99 / $89 (US), £8.99 / £79 (UK), €9.99 / €89 (euro area); confirm each storefront figure on the price screen. Display name, description and a review screenshot of the paywall on each product.
- [ ] **F3. Launch intro offer:** on `pro_annual` only: Introductory Offer → Pay up front → duration 1 year → price $69 / £59 / €69 → start and end dates = the launch window Plan C announces (30 days).
- [ ] **F4. Billing Grace Period:** App → Subscriptions → Billing Grace Period → On, all renewals (pick 16 days unless you prefer otherwise).
- [ ] **F5. Terms of Use (EULA) link:** App Information → License Agreement: keep Apple's Standard EULA. The app description's last lines read `Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/` and `CertAnvil Terms: https://certanvil.com/terms`. Privacy Policy URL = `https://certanvil.com/privacy`. (Plan C's Terms §4.7 says Apple's Standard EULA also applies to the iPhone app.)
- [ ] **F6. Keys for RevenueCat:** Users and Access → Integrations → In-App Purchase key (.p8) and the App-Specific Shared Secret (App → General → App Information). StoreKit 2 needs the key; iOS 15 devices fall back to StoreKit 1 and need the secret.
- [ ] **F7. RevenueCat project:** create project "CertAnvil", add the App Store app `com.certanvil.app`, upload the .p8 key (with Key ID and Issuer ID) and the shared secret. Products: import `pro_monthly`, `pro_annual`. Entitlement identifier **`pro`** with both products attached. Offering **`default`** (set as Current) with packages **`$rc_monthly` → `pro_monthly`** and **`$rc_annual` → `pro_annual`**.
- [ ] **F8. RevenueCat behaviour:** Project settings → Restore behavior → **Keep with original App User ID** (Pro belongs to the account; restoring on another account must not move it). This is safe for people who delete their account because the daily billing job deletes their RevenueCat customer at purge (Task 1b), which frees the purchase for a new account. Apple App Store Server Notifications URL in App Store Connect → paste RevenueCat's URL from its App Store app settings (RevenueCat consumes them; we do not).
- [ ] **F9. RevenueCat webhook:** Integrations → Webhooks → URL `https://certanvil.com/api/revenuecat/webhook`, Authorization header value = a long random string you generate, environment **Production and Sandbox** (App Review purchases are sandbox). Send nothing yet.
- [ ] **F10. Vercel secrets** (project certanvil-landing, Production and Preview): `REVENUECAT_WEBHOOK_AUTH` = the F9 string exactly; `REVENUECAT_SECRET_KEY` = RevenueCat → API keys → a secret key (v1 REST: read and delete subscribers). Confirm Plan A's `SUPABASE_URL` (explicit, no fallback) and `SUPABASE_SERVICE_ROLE_KEY` are set in both scopes.
- [ ] **F11. Public SDK key:** RevenueCat → API keys → the iOS public key (`appl_…`). Paste it in chat; it is public and ships in `native-shell.js` (Task 2 constant `RC_IOS_KEY`).
- [ ] **F12. StoreKit test certificate (simulator):** in Xcode, open `ios/App/App/Products.storekit` (Task 9) → Editor → Save Public Certificate; upload it in RevenueCat → app settings → StoreKit testing.
- [ ] **F13. Sandbox testers:** App Store Connect → Users and Access → Sandbox → two testers (one ordinary, one set up as a child in a Family Sharing group for Ask to Buy). Add each tester's CertAnvil account to `billing_test_accounts` (SQL in Plan A Task 21).
- [ ] **F14. App Privacy labels:** App Store Connect → App Privacy → update before submission: Purchases → Purchase History, **linked to the user**, App Functionality; Identifiers → User ID, linked, App Functionality; Usage Data → Product Interaction per Vercel Web Analytics on the in-app landing pages, not linked, Analytics. Keep the existing entries. Record the answers in `docs/mobile/APP_STORE_DISTRIBUTION.md` (replacing the line that declares only usage data).
- [ ] **F15. App Review demo account:** create a CertAnvil account on an email alias you control (Free, no Pro), add it to `billing_test_accounts`, pick a 6-digit code, and set `REVIEW_DEMO_EMAIL` and `REVIEW_DEMO_CODE` in certanvil-landing Production. Remove both env vars after approval (the endpoint then answers 404).
- [ ] **F16. Release timing:** on the version page choose **Manually release this version**. Release only after Plan C's runbook has set `SALES_OPEN_AT`.

---

### Task 1: RevenueCat webhook → the shared subscription record

**Files:**
- Create: `landing/api/revenuecat/webhook.js`
- Test: `tests/api/revenuecat-webhook.test.mjs`
- Create: `tests/uat/555-ios-pro.js` (first block: spawns the endpoint suite, as `tests/uat/532-bug-reports-loop.js` does)

**Interfaces:**
- Consumes (Plan A): RPC `apply_provider_subscription_event(p_event_id text, p_event_type text, p_row jsonb) → 'applied'|'duplicate'|'stale'|'unmatched'` (unmatched also for a user id that no longer exists), callable only by the service role; `readSubs(userId)`, `requireBillingEnv`, `sbUrl` from `billing-http.js`; `refundUnused`, `cancelNow` from `stripe-ops.js`; `doublePurchaseEmail`, `alertFounder` from `billing-mail.js`; row keys `provider, user_id, plan, status, current_period_end, cancel_at_period_end, revoked_at, original_transaction_id, product_id, environment, last_event_at`, plus `_noop: true` for events it should record but not apply. `is_pro(uid)` treats `active`, `trialing`, `grace` as Pro. Plan B writes `status` ∈ `active | grace | unpaid | expired | revoked`, all of which Plan A's check constraint allows (`grace` is the one grace word for both providers; `past_due` is rejected by design).
- Produces: `POST https://certanvil.com/api/revenuecat/webhook` → `200 { result: 'applied'|'duplicate'|'stale'|'unmatched'|'test'|'skipped', reason? }`, `401`, `400`, `405`, `500`, `503`. Pure export `mapRevenueCatEvent(event) → { eventId, eventType, row } | { skip: string }` via `export const _internal = { mapRevenueCatEvent }`.

Mapping (decided here; RevenueCat event docs read 1 Nov 2026, revenuecat.com/docs/integrations/webhooks/event-types-and-fields):

| `type` | condition | row |
|---|---|---|
| `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION`, `SUBSCRIPTION_EXTENDED`, `REFUND_REVERSED` | | `status 'active'`, `current_period_end` = `expiration_at_ms`, `cancel_at_period_end false`, `revoked_at null` |
| `CANCELLATION` | `cancel_reason 'CUSTOMER_SUPPORT'` (Apple refund) | `status 'revoked'`, `revoked_at` = event time |
| `CANCELLATION` | `cancel_reason 'BILLING_ERROR'` | `_noop` (BILLING_ISSUE carries the state) |
| `CANCELLATION` | any other reason | `status 'active'`, `cancel_at_period_end true`, `current_period_end` = `expiration_at_ms` |
| `BILLING_ISSUE` | `grace_period_expiration_at_ms` > event time | `status 'grace'`, `current_period_end` = grace expiry |
| `BILLING_ISSUE` | grace null or past | `status 'unpaid'` (not Pro) |
| `EXPIRATION` | `expiration_reason 'CUSTOMER_SUPPORT'` | `status 'revoked'`, `revoked_at` = event time |
| `EXPIRATION` | otherwise | `status 'expired'` |
| `PRODUCT_CHANGE`, `TRANSFER`, `SUBSCRIPTION_PAUSED`, `NON_RENEWING_PURCHASE`, `TEMPORARY_ENTITLEMENT_GRANT`, anything else | | `_noop` |
| `TEST` | | no RPC; `200 { result: 'test' }` |

Every applied row: `provider 'apple'`, `user_id` = the first UUID-shaped value in `[app_user_id, original_app_user_id, ...aliases]`, `plan` = `{ pro_monthly: 'monthly', pro_annual: 'yearly' }[product_id]`, `original_transaction_id`, `product_id`, `environment` = `'sandbox'` when `environment === 'SANDBOX'` else `'production'`, `last_event_at` = ISO of `event_timestamp_ms`. Event id `'rc_' + id`, event type `'rc.' + type`. No UUID → `{ skip: 'no-user' }`; unknown product on a non-noop type → `{ skip: 'unknown-product' }`; both answer 200 (RevenueCat must stop retrying) and log through `landing/api/_lib/log-server-error.js` with endpoint `revenuecat-webhook`.

- [ ] **Step 1: Write the failing tests** in `tests/api/revenuecat-webhook.test.mjs`, the `tests/api/bug-report.test.mjs` harness (env set, `globalThis.fetch` stubbed, `new Request(...)`), recording every RPC body:

```js
const U = '6f1c2b1e-9a43-4c1e-8d55-1b2c3d4e5f60';
const ev = (o) => ({ api_version: '1.0', event: Object.assign({ id: 'e1', type: 'INITIAL_PURCHASE', app_user_id: U, original_app_user_id: U, aliases: [U],
  product_id: 'pro_annual', original_transaction_id: '2000000111', transaction_id: '2000000111', environment: 'PRODUCTION',
  event_timestamp_ms: 1793500000000, expiration_at_ms: 1825036000000 }, o) });
await t('wrong or missing Authorization is 401 and calls nothing', ...);            // header 'nope' and none → 401, rpcCalls.length === 0
await t('missing REVENUECAT_WEBHOOK_AUTH or service key is 503', ...);
await t('GET is 405, a body with no event.id is 400', ...);
await t('initial purchase writes an active yearly apple row', async () => {
  const r = await handler(post(ev({})));  assert.equal(r.status, 200);
  const b = rpc()[0];
  assert.equal(b.p_event_id, 'rc_e1'); assert.equal(b.p_event_type, 'rc.INITIAL_PURCHASE');
  assert.deepEqual(pick(b.p_row, ['provider','user_id','plan','status','cancel_at_period_end','revoked_at','environment']),
    { provider: 'apple', user_id: U, plan: 'yearly', status: 'active', cancel_at_period_end: false, revoked_at: null, environment: 'production' });
  assert.equal(b.p_row.current_period_end, new Date(1825036000000).toISOString());
});
await t('sandbox events are tagged sandbox', ...);                                  // environment 'SANDBOX' → row.environment 'sandbox', status 'active' (is_pro decides via the allowlist)
await t('a replayed event returns duplicate from the RPC and still 200', ...);       // stub RPC answers "duplicate" → body { result: 'duplicate' }
await t('cancellation by the user keeps Pro to the period end', ...);              // cancel_reason UNSUBSCRIBE → status active, cancel_at_period_end true
await t('an Apple refund revokes', ...);                                            // CANCELLATION + CUSTOMER_SUPPORT → status revoked, revoked_at = ISO(event ts)
await t('billing issue inside grace is grace until the grace end', ...);            // grace_period_expiration_at_ms 1793900000000 → status grace, current_period_end ISO of it
await t('billing issue with no grace is unpaid, and is_pro is false', ...);
await t('expiration ends Pro; a refund expiration revokes', ...);
await t('monthly product maps to monthly', ...);
await t('product change and transfer are recorded as no-ops', ...);                 // row._noop === true
await t('TEST answers 200 test without calling the RPC', ...);
await t('an anonymous RevenueCat id with a uuid alias uses the alias', ...);        // app_user_id '$RCAnonymousID:abc', aliases [..., U] → user_id U
await t('no uuid anywhere is 200 skipped no-user and logs', ...);                   // client_errors write contains 'revenuecat-webhook: skipped no-user'
await t('an RPC failure is 500 so RevenueCat retries', ...);
await t('an event for a deleted account is 200 unmatched, not a retry loop', ...);  // RPC stub answers "unmatched" → body { result: 'unmatched' }
await t('missing SUPABASE_URL is 503 (no production fallback)', ...);
await t('an Apple purchase on an account with live web Pro reverses the Stripe side', async () => {
  // readSubs → [{ provider: 'stripe', environment: 'production', status: 'active', provider_subscription_id: 'sub_9' }]
  // INITIAL_PURCHASE production → RPC applied; then refundUnused('sub_9') and cancelNow('sub_9', 'apple-over-stripe:sub_9') once each;
  // one doublePurchaseEmail to the customer and one alertFounder 'Apple purchase over web Pro'; 200
});
await t('a sandbox Apple purchase never touches Stripe', ...);
console.log('revenuecat-webhook: ' + n + '/' + n + ' passed');
```

and in `tests/uat/555-ios-pro.js`: `test('revenuecat webhook suite passes (N/N)', ...)` spawning it with `--experimental-detect-module`, matching `/revenuecat-webhook: (\d+)\/\1 passed/`.

- [ ] **Step 2: Run to verify it fails**

Run: `node --experimental-detect-module tests/api/revenuecat-webhook.test.mjs`
Expected: FAIL, cannot find module `landing/api/revenuecat/webhook.js`.

- [ ] **Step 3: Implement `landing/api/revenuecat/webhook.js`**: `export const config = { runtime: 'edge' }`; `export default async function handler(req: Request): Promise<Response>`; `export const _internal = { mapRevenueCatEvent }`. Order: method → env (`requireBillingEnv(['REVENUECAT_WEBHOOK_AUTH'])`: `SUPABASE_URL` is required, no fallback) → constant-time compare of `Authorization` to the env value → parse → map → for a production `INITIAL_PURCHASE`, read `readSubs(user_id)` first → RPC at `sbUrl() + '/rest/v1/rpc/apply_provider_subscription_event'` → when the RPC applied and an entitling production Stripe row existed, `refundUnused` + `cancelNow` on it, email the customer, alert the founder (failures there are logged and alerted, never turn the webhook into a 500) → 200 with the RPC's result. The mapping table above is the rest of the algorithm.

- [ ] **Step 4: Run to verify it passes**

Run: `node --experimental-detect-module tests/api/revenuecat-webhook.test.mjs && node tests/uat.js 2>&1 | tail -3`
Expected: `revenuecat-webhook: 18/18 passed` (or the final count) and UAT ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add landing/api/revenuecat/webhook.js tests/api/revenuecat-webhook.test.mjs tests/uat/555-ios-pro.js
git commit -m "feat(payments-b): RevenueCat webhook writes Apple events to provider_subscriptions"
```

---

### Task 1b: RevenueCat sync and release

**Files:**
- Create: `landing/api/_lib/revenuecat.js`, `landing/api/revenuecat/sync.js`, `tests/api/revenuecat-sync.test.mjs`
- Modify: `landing/api/_lib/billing-release.js` (add `releaseApple`, register it in `releasers`), `tests/api/billing-daily.test.mjs` (Apple cases), `tests/uat/555-ios-pro.js` (spawn)

**Interfaces:**
- Consumes: RevenueCat REST v1 `GET https://api.revenuecat.com/v1/subscribers/{app_user_id}` and `DELETE` the same path, `Authorization: Bearer <REVENUECAT_SECRET_KEY>`; Task 1's row shape; Plan A `verifyUser`, RPC, `releasers`.
- Produces: `rcGetSubscriber(uid) → subscriber|null`, `rcDeleteSubscriber(uid) → Promise<void>` (404 counts as done), `rowsFromSubscriber(subscriber, uid) → p_row[]` (one row per `subscriptions[product_id]` for `pro_monthly` / `pro_annual`: `status` = `active` when `expires_date` is in the future and no `refunded_at`, `grace` when `grace_period_expires_date` is in the future, `revoked` when `refunded_at`, else `expired`; `cancel_at_period_end` = `unsubscribe_detected_at` set; `environment` = `is_sandbox ? 'sandbox' : 'production'`); `POST /api/revenuecat/sync` (Bearer) → `{ result: 'applied'|'duplicate'|'stale'|'none', pro }` (RPC event id `rc-sync:<uid>:<expires_ms>`; `pro` from `summarize` after applying); `releaseApple(row) → 'released'|'failed'` (delete the RevenueCat customer, then RPC `released_at = now`, event id `release:apple:<original_transaction_id>`).

- [ ] **Step 1: Failing tests:** sync 401 without token, 503 without `REVENUECAT_SECRET_KEY` or `SUPABASE_URL`; a subscriber with an active `pro_annual` → one RPC row `{ provider: 'apple', plan: 'yearly', status: 'active' }` and `{ pro: true }`; no subscriptions → `{ result: 'none', pro: false }` and no RPC; RevenueCat 500 → 502 `{ error: 'revenuecat_unavailable' }`; grace and refunded subscribers map to `grace` and `revoked`. billing-daily: an account due for purge with an Apple row → `DELETE /v1/subscribers/<uid>` then the RPC sets `released_at` → `{ released: 1 }`; RevenueCat 500 → alert, row unreleased (the purge keeps waiting).
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass** (`node tests/uat.js`). **Step 5: Commit** `feat(payments-b): RevenueCat sync endpoint and customer deletion at purge`

---

### Task 2: The RevenueCat plugin and `caNative.iap`

**Files:**
- Modify: `package.json` (`"@revenuecat/purchases-capacitor": "14.0.0"`, exact), `ios/` via `npx cap sync ios`, `ios/App/App.xcodeproj/project.pbxproj` (In-App Purchase capability; `App.entitlements` stays as is)
- Modify: `native-shell.js`
- Test: `tests/uat/555-ios-pro.js`, `tests/e2e/ios-pro.spec.js` (new; harness copied from `tests/e2e/lift-5c.spec.js`: native UA, stubbed `Capacitor.Plugins`, `tests/fixtures/fake-supabase.js`)

**Interfaces:**
- Consumes: `window.Capacitor.Plugins.Purchases` (plugin registered as `'Purchases'`): `configure({ apiKey, appUserID? })`, `logIn({ appUserID }) → { customerInfo, created }`, `logOut()`, `getAppUserID() → { appUserID }`, `getOfferings() → { current: { monthly, annual } }` where each package has `.product.{ identifier, priceString, price, currencyCode, introPrice: { priceString, price, cycles, periodUnit, periodNumberOfUnits } | null }`, `checkTrialOrIntroductoryPriceEligibility({ productIdentifiers }) → { [id]: { status } }` (2 = eligible), `purchasePackage({ aPackage }) → { customerInfo }`, `restorePurchases() → { customerInfo }`, `getCustomerInfo() → { customerInfo }`, `addCustomerInfoUpdateListener(cb)`. Raw bridge errors carry a numeric string in `e.code` or `e.data.code` (`'1'` cancelled, `'20'` payment pending, `'7'`/`'13'` receipt in use by another user, `'10'`/`'35'` network). `customerInfo.entitlements.active.pro` present = Pro on this Apple ID.
- Produces (on `window.caNative`, native only):
  - `iap.ready() → boolean` (plugin present and `RC_IOS_KEY` not empty)
  - `iap.identify(uid: string|null) → Promise<void>` (configures on first call, then `logIn(uid)` / `logOut()`; serialised)
  - `iap.prices() → Promise<NativePrices|null>`; also sets `window.nativePrices`
  - `iap.purchase(plan: 'monthly'|'yearly') → Promise<{ outcome: 'pro'|'pending'|'cancelled'|'other-account'|'failed', customerInfo? }>`
  - `iap.restore() → Promise<{ outcome: 'pro'|'none'|'other-account'|'failed' }>`
  - `iap.onPro(cb: () => void)` (entitlement became active, e.g. Ask to Buy approved)
  - `iap.userId() → Promise<string|null>`
  - `openSubscriptions() → Promise<void>` (AppLauncher `https://apps.apple.com/account/subscriptions`)
  - pure `window._iapErrorKind(e) → 'cancelled'|'pending'|'other-account'|'network'|'failed'` and `window._iapPricesFrom(offering, eligibility, locale) → NativePrices`
- `NativePrices` (the contract's `window.nativePrices`): `{ monthly: { price: string, currency: string, amount: number }, yearly: { price, currency, amount, perMonth: string, savePct: number }, introOffer: { price: string, currency: string, amount: number } | null }`. `price` is StoreKit's `priceString`. `perMonth` = `Intl.NumberFormat(locale, { style: 'currency', currency }).format(yearly.amount / 12)`. `savePct` = `Math.round((1 - yearly.amount / (12 * monthly.amount)) * 100)`. `introOffer` is set only when `pro_annual` has an `introPrice` and eligibility status is `2`.
- Sets `html.ca-iap` when `iap.ready()`.

- [ ] **Step 1: Write the failing tests**

UAT (pure functions extracted with `_fnBody` from `native-shell.js` into a vm):
```js
test('error kind: 1 cancelled, 20 pending, 7 and 13 other-account, 10 and 35 network, else failed',
  kind({ code: '1' }) === 'cancelled' && kind({ data: { code: '20' } }) === 'pending' && kind({ code: '7' }) === 'other-account'
  && kind({ code: '13' }) === 'other-account' && kind({ code: '10' }) === 'network' && kind({ code: '35' }) === 'network' && kind({ code: 'UNIMPLEMENTED' }) === 'failed');
test('prices: StoreKit strings pass through; per month and save are computed', (() => {
  const p = prices(offering({ m: [9.99, '$9.99', 'USD'], y: [89, '$89.00', 'USD'], intro: [69, '$69.00'] }), { pro_annual: { status: 2 } }, 'en-US');
  return p.monthly.price === '$9.99' && p.yearly.price === '$89.00' && p.yearly.perMonth === '$7.42' && p.yearly.savePct === 26 && p.introOffer.price === '$69.00';
})());
test('prices: GBP 79 / 8.99 saves 27%', prices(offering({ m: [8.99, '£8.99', 'GBP'], y: [79, '£79.00', 'GBP'] }), {}, 'en-GB').yearly.savePct === 27);
test('prices: no intro offer unless eligibility is 2', prices(offering({ m: [9.99,'$9.99','USD'], y: [89,'$89.00','USD'], intro: [69,'$69.00'] }), { pro_annual: { status: 0 } }, 'en-US').introOffer === null);
test('native-shell: RC key constant and plugin reached through Capacitor.Plugins only', /var RC_IOS_KEY = 'appl_/.test(shell) && !/import\(/.test(shell));
test('package.json pins @revenuecat/purchases-capacitor 14.0.0', pkg.dependencies['@revenuecat/purchases-capacitor'] === '14.0.0');
test('CapApp-SPM lists the RevenueCat package', /RevenuecatPurchasesCapacitor/.test(spm));
```
E2E (stub `Purchases` recording calls in `localStorage.__rcCalls`):
```js
test('iap.ready() is false without the plugin', ...);           // no Purchases in Plugins → caNative.iap.ready() === false, html lacks ca-iap
test('identify logs in the new user before any purchase', ...);  // identify('u-a') then identify('u-b') → calls: configure, logIn u-a, logIn u-b; purchase after → purchasePackage follows logIn u-b
test('signing out logs RevenueCat out', ...);                    // identify(null) after a user → logOut called
test('prices() fills window.nativePrices from the offering', ...);
```

- [ ] **Step 2: Run to verify they fail**

Run: `node tests/uat.js 2>&1 | grep -E "FAIL|555" | head; npx playwright test tests/e2e/ios-pro.spec.js --project=chromium`
Expected: FAIL (`_iapErrorKind` not defined; `caNative.iap` undefined).

- [ ] **Step 3: Add the plugin to the shell**

Run: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"; node -v` (expect `v22.22.3`; a glob in an assignment does not expand), then `npm i -E @revenuecat/purchases-capacitor@14.0.0 && npx cap sync ios`
Then in Xcode → App target → Signing & Capabilities → + In-App Purchase. Set `SWIFT_VERSION` ≥ 5.0 if Xcode asks.
Expected: `ios/App/CapApp-SPM/Package.swift` lists `RevenuecatPurchasesCapacitor`; `xcodebuild -project ios/App/App.xcodeproj -scheme App -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build` → `BUILD SUCCEEDED`.

- [ ] **Step 4: Implement `caNative.iap` in `native-shell.js`** with the signatures above. `RC_IOS_KEY = ''` until F11 (empty → `ready()` false, so nothing ships half-wired). `identify` keeps one promise chain so a sign-out and a sign-in can never interleave. `purchase(plan)` reads `getOfferings().current[plan === 'yearly' ? 'annual' : 'monthly']`; returns `outcome 'failed'` if that package is missing. `onPro` registers one `addCustomerInfoUpdateListener` and calls back when `entitlements.active.pro` appears.

- [ ] **Step 5: Run to verify they pass**

Run: `node tests/uat.js 2>&1 | tail -3 && npx playwright test tests/e2e/ios-pro.spec.js`
Expected: UAT ALL PASS; ios-pro specs pass on chromium, webkit, mobile-safari.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json ios native-shell.js tests/uat/555-ios-pro.js tests/e2e/ios-pro.spec.js
git commit -m "feat(payments-b): RevenueCat plugin in the shell, caNative.iap and native prices"
```

---

### Task 3: Buying and restoring: `nativePurchase`, `nativeRestore` and the confirmation screens

**Files:**
- Create: `features/ios-pro.js`; Modify: `index.html` (`<script defer src="features/ios-pro.js"></script>` right after `features/ios-sheet.js`), `features/ios-signin.js` (accept `from: 'paywall'`; Back closes the sign-in and reopens the paywall), `lift-ios.css` (`.ip-cf*` from the drawing's `.cf`, `.cf-card`, `.cf-h`, `.cf-plan`, `.cf-fine`, `.badge`, `.spin`; bump `?v=`)
- Test: `tests/uat/555-ios-pro.js`, `tests/e2e/ios-pro.spec.js`

**Interfaces:**
- Consumes: Task 2 `caNative.iap.*`; Task 1b `POST /api/revenuecat/sync`. Plan A: `GET <caApiBase()>/api/billing/status` (Bearer Supabase token) → `{ pro, source, plan, status, renewsAt, endsAt, canBuy, salesOpen, ... }`; `window.caApiBase()`; `window.refreshProState({ force: true })`; `window.startProUpgrade(plan)` calls `window.nativePurchase(plan)` on `html.is-native`. Existing: `window.certanvilSupabase`, `window.iosSignIn.open(o)`, `window.CA_NATIVE`, `ca:app-active` event, `showToast(msg, type)`.
- Produces:
  - `window.nativePurchase(plan: 'monthly'|'yearly') → Promise<'pro'|'pending'|'already'|'closed'|'cancelled'|'signin'|'failed'>`
  - `window.iosPro.sync() → Promise<{ pro }|null>` (POST `/api/revenuecat/sync`; null on failure)
  - `window.nativeRestore() → Promise<'pro'|'none'|'other-account'|'failed'>`
  - `window.iosPro.status() → Promise<BillingStatus|null>` (one in-flight fetch shared; result cached 30 s)
  - `window.iosPro.confirm(kind: 'wait'|'pro'|'ask', plan) → void` (opens `#ip-cf` full screen)
  - `window.iosPro.onBuyLock(cb: (locked: boolean) => void)` (the paywall's Get Pro listens)

Flow of `nativePurchase(plan)` (the order is the decision):
1. Not `CA_NATIVE` or not `iap.ready()` → `'failed'`, nothing shown.
2. A purchase already running → return the same promise (the lock).
3. No session → `sessionStorage.ca_pw_plan = plan`, `iosSignIn.open({ from: 'paywall' })`, return `'signin'`. After `SIGNED_IN`, `ios-pro.js` calls `iap.identify(uid)` then reopens the paywall with `ca_pw_plan` picked and clears it.
4. `iap.userId()` ≠ session uid → `await iap.identify(uid)`; still different → `'failed'` with the network toast.
5. `iosPro.status({ fresh: true })`: `pro === true` → close the paywall, open the already-Pro screen (Task 4) → `'already'`. `canBuy === false` → the paywall shows its before-sales state (Task 4), no sheet → `'closed'`. Fetch fails → toast, `'failed'`, no sheet.
6. Lock on, `iap.purchase(plan)`, lock off.
7. `pro` → `confirm('wait')`, call `iosPro.sync()` once, then poll `status({ fresh: true })` every 2 s for 30 s, then every 15 s with an `iosPro.sync()` every fourth poll, plus on every `ca:app-active`; first `pro === true` → `refreshProState({ force: true })`, `confirm('pro')`. `pending` → `confirm('ask')`, `Preferences ca_iap_pending = '1'`; `iap.onPro` → `confirm('wait')` and the same polling. `cancelled` → nothing. `other-account` / `failed` → toast.

Copy, verbatim from the drawing (screen C):
- wait: `Confirming…` / `Apple has your payment. We're switching Pro on.`
- pro: `You're Pro` / `Yearly · billed through your Apple ID` (Monthly: `Monthly · billed through your Apple ID`) / ticks `Unlimited questions in every cert`, `Exam Simulator and full labs`, `Drill Mistakes and Why-Not` / button `Back to studying`
- ask: `Waiting for approval` / `Your request is with your family organiser. Once they approve it, Pro turns on by itself, even if you close the app.` / `Back to studying` / `Nothing is charged unless they approve.`

New copy (not in the drawing; goes through the humanizer stage in Task 8, then the founder sees it in the PR):
- restore found: `Pro restored. Welcome back.` (from `2026-06-16-restore-purchases-design.md` §4.3), shown **only after** `iosPro.sync()` and then `status({ fresh: true })` say `pro: true`; while they don't, `confirm('wait')` runs as for a purchase. `nativeRestore` resolves `'pro'` only then.
- restore none: `No subscription found on this Apple ID.` (§4.4)
- restore / purchase other-account: `This Apple ID's Pro belongs to a different CertAnvil account. Sign in with that account to use it.`
- server check or network failure: `Couldn't reach CertAnvil. Check your connection and try again.`
- purchase failed: `That purchase didn't go through. No charge was made.`

- [ ] **Step 1: Write the failing tests** (E2E, stub plugin + a routed `**/api/billing/status` whose answers the test sets):

```js
test('signed out: Get Pro opens sign-in and comes back to the paywall with the plan kept', ...);   // nativePurchase('monthly') → '#isi-host' shows; fake sign-in → paywall open, Monthly aria-checked="true"; no purchasePackage call
test('already Pro on the server opens no sheet', ...);              // status { pro: true, source: 'stripe' } → resolves 'already'; __rcCalls has no purchasePackage
test('a second tap while the sheet is open does not open another', ...);  // stub purchase delays 500ms; two calls → one purchasePackage
test('purchase refuses when RevenueCat\'s user is not the session user', ...);  // getAppUserID stays 'someone-else' after logIn → 'failed', toast text, no purchasePackage
test('purchase shows Confirming, then You\'re Pro once the server agrees', ...);  // status {pro:false} twice then {pro:true} → #ip-cf text 'Confirming…' then 'You're Pro'; refreshProState called with {force:true}
test('confirming survives a failed status check and resolves on app-active', ...); // status route aborts twice, then pro:true; dispatch ca:app-active → 'You're Pro'; no failure text ever shown
test('Ask to Buy shows Waiting for approval and turns into Pro on approval', ...);  // purchase rejects {code:'20'} → 'Waiting for approval'; fire the stub customerInfo listener with pro → 'Confirming…' → 'You're Pro'
test('cancelling Apple\'s sheet shows nothing', ...);                // rejects {code:'1'} → no #ip-cf, no toast
test('Back to studying closes the screen and returns to the page underneath', ...);
test('restore with Pro says so only once the server agrees', ...);  // restore entitlement on device; sync → status pro:false then pro:true → Confirming… then 'Pro restored. Welcome back.'; never before
test('a webhook that never arrives is recovered by sync', ...);     // status stays pro:false until the stub sync call, then pro:true → You're Pro
test('canBuy false: no Apple sheet, the paywall shows its before-sales state', ...);
test('restore with nothing says so', ...);
test('restore on another account\'s Apple ID explains and grants nothing', ...);  // restorePurchases rejects {code:'7'} → the other-account line; refreshProState not called
```
UAT: `test('confirmation copy is the drawing's, word for word', ...)` (each string above present in `features/ios-pro.js`); `test('ios-pro.js holds no price literal', !/[$£€]\s?\d/.test(src))`; `test('no em dashes in ios-pro.js copy', ...)`; `test('ios-pro.js loads deferred right after ios-sheet.js', ...)`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test tests/e2e/ios-pro.spec.js --project=chromium`
Expected: FAIL (`window.nativePurchase` undefined).

- [ ] **Step 3: Implement** `features/ios-pro.js` (IIFE, `'use strict'`, returns early unless `window.CA_NATIVE`) with the flow and signatures above; `ios-signin.js` gains `'paywall'` in its `from` handling; screen CSS lifted from the drawing into `lift-ios.css` under `.ip-cf*` (tokens only, no new colours); `lift-ios.css?v=` bumped in `index.html`.

- [ ] **Step 4: Run to verify they pass**

Run: `node tests/uat.js 2>&1 | tail -3 && node tests/tech-debt.js && npx playwright test tests/e2e/ios-pro.spec.js`
Expected: UAT ALL PASS, tech-debt green (`app.js` untouched), ios-pro passes on all three projects.

- [ ] **Step 5: Commit**

```bash
git add features/ios-pro.js features/ios-signin.js index.html lift-ios.css tests/uat/555-ios-pro.js tests/e2e/ios-pro.spec.js
git commit -m "feat(payments-b): iPhone purchase and restore, server check first, Confirming / You're Pro / Ask to Buy"
```

---

### Task 4: The iPhone paywall (3.1.2 disclosure, StoreKit prices) and the already-Pro screen

**Files:**
- Modify: `features/ios-pro.js`, `lift-ios.css` (`.ip-pw*` from the drawing's `.pw`, `.plans`, `.plan`, `.ring`, `.p-*`, `.renew`, `.pw-trust`, `.pw-legal`, `.ticks`; bump `?v=`)
- Test: `tests/uat/555-ios-pro.js`, `tests/e2e/ios-pro.spec.js`

**Interfaces:**
- Consumes: Task 2 `caNative.iap.prices()` / `window.nativePrices`; Task 3 `nativePurchase`, `nativeRestore`, `iosPro.status`, `iosPro.onBuyLock`; Plan A `window.openPaywall(trigger)` (which calls `window.nativePaywall` on `html.is-native`), `window.startProUpgrade(plan)`, `window.caApiBase()`; Plan A `GET /api/pricing` → `launch: { active, endsAt }` (only the end date is read; its prices are never shown on iPhone); `window.CertRegistry.get(id).shortName`.
- Produces: `window.nativePaywall(trigger: string, opts?: { plan?: 'monthly'|'yearly' }) → void`, defined only when `CA_NATIVE && iap.ready()` (otherwise left undefined, so Plan A's `openPaywall` returns `false` and today's fallbacks stand); `window.iosPro.alreadyPro(source) → void`; pure `window._ipPaywallModel(trigger, prices, launch, plan, certNames, canBuy) → { eb, h, p, second, rows, renew, endsLine|null, disabled, closed }` and `window._ipPaywallHtml(model) → string`. Plan B never assigns `window.openPaywall`.

Copy by trigger: **read it from Plan A's `window.PAYWALL_COPY.copyFor(trigger, ctx)`** (`features/paywall-copy.js`), the single source for paywall wording on every surface, including the generic `feature:pro` row used by Settings Get Pro. Do not restate the strings here. The cert names come from `CertRegistry.get(id).shortName`.

Plan rows (Yearly first and picked unless `opts.plan`):
- Yearly, intro offer present: price `introOffer.price` + small `Launch offer, first year`; sub `Then <yearly.price> a year.` + (` Ends <D Mon>.` only when `/api/pricing` says `launch.active` and gives `endsAt`); no badge.
- Yearly, no intro: badge `Save <savePct>%`; price `<yearly.price>` + small `a year`; sub `<perMonth> a month`.
- Monthly: price `<monthly.price>` + small `a month`.
- Ticks: `Unlimited questions in every cert`, `Exam Simulator and full labs`, `Drills that fix your mistakes`.
- Renew line: `Renews automatically at <yearly.price> a year until you cancel. Cancel at least 24 hours before renewal in your Apple ID settings.` (Monthly: `at <monthly.price> a month`).
- Buttons: `Get Pro` (primary; calls `startProUpgrade(plan)`; disabled while `onBuyLock` is locked), second button per trigger (closes).
- `Cancel anytime · Billed through your Apple ID`; links row `Restore purchases` (→ `nativeRestore`), `Terms of Use` (`https://certanvil.com/terms?app=1`, `data-ext`), `Privacy` (`https://certanvil.com/privacy?app=1`, `data-ext`). The `?app=1` marker makes Plan C's native-hide hide every web-purchase element on those pages, which open in the in-app browser sheet where the app's user agent is absent.
- `canBuy === false` (before sales open, account not allowlisted): plan rows and prices still shown, `Get Pro` disabled, line `Pro isn't on sale yet. It opens soon.` (new copy), Restore and the links still shown. No waitlist, no web link.
- Prices unavailable (`prices()` null): plan rows hidden, line `Prices aren't loading. Check your connection and try again.` (new copy), `Get Pro` disabled, Restore and the links still shown.

Already-Pro screen (`alreadyPro(source)`): badge, `You're already Pro`, `This account has Pro, billed outside the App Store, so there's nothing to buy. Everything is unlocked.` when `source === 'stripe'`, else `This account has Pro, so there's nothing to buy. Everything is unlocked.`, button `Back to studying`.

Layout: the existing phone sheet (`iosSheet`-style bottom sheet with scrim, as `ios-settings.js` `openSheet` does), plan rows as a `role="radiogroup"` with `role="radio"` buttons.

- [ ] **Step 1: Write the failing tests**

UAT (pure model in a vm):
```js
test('model: Yearly picked by default, billed amount first, per month second', (() => { const m = model('limit', P_USD, null, null);
  return m.rows[0].id === 'yearly' && m.rows[0].checked && m.rows[0].price === '$89.00' && m.rows[0].sub === '$7.42 a month' && m.rows[0].badge === 'Save 26%'; })());
test('model: intro offer row says Launch offer, first year, Then <price> a year. Ends 1 Dec.', (() => {
  const m = model('limit', P_USD_INTRO, { active: true, endsAt: '2026-12-01T23:59:00Z' }, null);
  return m.rows[0].price === '$69.00' && m.rows[0].small === 'Launch offer, first year' && m.rows[0].sub === 'Then $89.00 a year. Ends 1 Dec.' && !m.rows[0].badge; })());
test('model: intro offer without an active launch drops the Ends sentence', ...);
test('model: renew line follows the picked plan', model('limit', P_USD, null, 'monthly').renew === 'Renews automatically at $9.99 a month until you cancel. Cancel at least 24 hours before renewal in your Apple ID settings.');
test('model: no prices disables Get Pro and shows the loading line', model('limit', null, null, null).disabled === true);
test('model: cert trigger names both certs', ...);                 // 'cert:secplus' on netplus → h 'Add Security+ with Pro', second 'Stay on Network+'
test('html: Restore purchases, Terms of Use and Privacy are present with ?app=1; no data-web-purchase; no certanvil.com/pricing', ...);
test('model: canBuy false disables Get Pro with the not-on-sale line', model('limit', P_USD, null, null, NAMES, false).closed === true);
test('ios-pro.js never assigns window.openPaywall', !/window\.openPaywall\s*=/.test(src));
```
E2E:
```js
test('the paywall shows StoreKit prices from the plugin', ...);          // stub priceString '£79.00' → visible '£79.00', '£6.58 a month'
test('picking Monthly changes the renew line', ...);
test('Get Pro goes through startProUpgrade and locks while the sheet is open', ...);
test('already Pro on the server: the already-Pro screen, no sheet', ...); // source 'stripe' → text contains 'billed outside the App Store', no 'certanvil.com'
test('no native paywall without the plugin', ...);                         // no Purchases → nativePaywall undefined, openPaywall returns false; no .ip-pw in DOM
test('load order cannot undo the native paywall', ...);                    // load ios-pro.js before and after paywall.js in two runs → openPaywall('limit') opens .ip-pw both times
test('the paywall passes axe with no serious violations at 402px in both themes', ...);
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test tests/e2e/ios-pro.spec.js --project=chromium -g paywall`
Expected: FAIL (`nativePaywall` undefined).

- [ ] **Step 3: Implement** `_ipPaywallModel`, `_ipPaywallHtml`, `nativePaywall` and `iosPro.alreadyPro` in `features/ios-pro.js`; `.ip-pw*` CSS lifted from the drawing into `lift-ios.css`; bump `?v=`.

- [ ] **Step 4: Run to verify they pass**

Run: `node tests/uat.js 2>&1 | tail -3 && npx playwright test tests/e2e/ios-pro.spec.js`
Expected: ALL PASS on three projects.

- [ ] **Step 5: Commit**

```bash
git add features/ios-pro.js lift-ios.css index.html tests/uat/555-ios-pro.js tests/e2e/ios-pro.spec.js
git commit -m "feat(payments-b): iPhone paywall with StoreKit prices and the 3.1.2 disclosure"
```

---

### Task 5: iPhone Settings: the Plan section

**Files:**
- Modify: `features/ios-settings.js` (`_iosStModel` gains `plan`; `_iosStHtml` draws a `Plan` section right after the Account group when signed in and `ca-iap`; new actions `ON.getpro`, `ON.manage`, `ON.restore`), `features/ios-pro.js` (pure `_ipPlanRows(status, now) → [{ kind, label, small?, act? }]`), `dg-system.css` (the ADR-004 rule: `a[href*="certanvil.com/pricing"]`, `.settings-go-pro-btn`, `#ios-settings [data-act="gopro"]`, `.ifr-see` and `#ios-check [data-act="limit-pro"]` each become `html.is-native:not(.ca-iap) …`; add `html.is-native.ca-iap a[href*="certanvil.com/pricing"]:not([data-paywall]){display:none!important}` so a plain pricing link stays hidden; `manage-subscription`, `.a2hs-banner` and `#desk-mycerts .dmc-procard` stay hidden for everyone native; bump `dg-system.css?v=`), `lift-ios.css` if a row style is missing
- Test: `tests/uat/555-ios-pro.js`, `tests/uat/506-ios-settings.js` (extend), `tests/e2e/ios-pro.spec.js`

**Interfaces:**
- Consumes: Task 3 `iosPro.status()`, `nativeRestore()`; Task 4 `nativePaywall('feature:settings')`; Task 2 `caNative.openSubscriptions()`; Plan A `BillingStatus`.
- Produces: `_ipPlanRows(status, now)`; settings `data-act` values `getpro`, `manage`, `restore`. `ON.gopro` (the Daily goal and Daily Review cards) also opens `nativePaywall('feature:settings')` when `ca-iap`.

Rows, verbatim from the drawing (screen E), dates as `D Mon` from `renewsAt` / `endsAt`:

| status | rows |
|---|---|
| `source 'apple'`, `status 'active'` or `'grace'` | static `Pro` / small `Renews 14 Mar · billed by Apple`; link `Manage in Apple` (ext icon); `Restore purchases` |
| `source 'apple'`, `status 'cancelled'` | static `Pro until 14 Mar` / small `Cancelled · billed by Apple`; `Manage in Apple`; `Restore purchases` |
| `source 'stripe'` (any Pro status) | static `Pro` / small `Billed outside the App Store` (plain text, no domain, never a link); `Restore purchases` |
| `source 'admin'` | static `Pro` (no small line); no other rows |
| not Pro (`free`, `ended`, or status unknown) | static `Free` / small `15 questions and 5 review cards a day`; accent `Get Pro`; `Restore purchases` |

The Account group's existing Pro/Free pill stays; its `Go Pro` row is dropped when the Plan section is shown (one Get Pro per screen).

- [ ] **Step 1: Write the failing tests**

UAT:
```js
test('plan rows: Apple renewing', JSON.stringify(rows({ pro: true, source: 'apple', status: 'active', renewsAt: '2027-03-14T00:00:00Z' }))
  === JSON.stringify([{ kind: 'static', label: 'Pro', small: 'Renews 14 Mar · billed by Apple' }, { kind: 'link', label: 'Manage in Apple', act: 'manage' }, { kind: 'button', label: 'Restore purchases', act: 'restore' }]));
test('plan rows: Apple cancelled reads Pro until 14 Mar', ...);
test('plan rows: web-billed is plain text with no link or domain', ...);   // no row with act 'manage', small 'Billed outside the App Store'
test('plan rows: free offers Get Pro and Restore', ...);
test('plan rows: owner shows Pro only', ...);
test('dg-system.css: every Go Pro path hides only without in-app purchase', ['#ios-settings [data-act="gopro"]', '.settings-go-pro-btn', '.ifr-see', '#ios-check [data-act="limit-pro"]', 'a[href*="certanvil.com/pricing"]']
  .every(sel => dg.includes('html.is-native:not(.ca-iap) ' + sel)) && dg.includes('html.is-native.ca-iap a[href*="certanvil.com/pricing"]:not([data-paywall])'));
```
E2E: `Settings shows the Plan section from the billing status` (each of the five states), `Manage in Apple opens the App Store subscriptions page` (AppLauncher stub records `https://apps.apple.com/account/subscriptions`), `Get Pro in Settings opens the iPhone paywall`, `no Plan section without the plugin`, and the hard stops: `at the daily limit, Go Pro is visible and opens the native paywall` (iOS limit screen `#ios-check [data-act="limit-pro"]`), `the second-cert wall's Unlock opens cert:<id>`, `the review cap opens limit`; without the plugin each stays hidden as today.

- [ ] **Step 2: Run to verify they fail.** Run: `node tests/uat.js 2>&1 | grep FAIL | head`. Expected: the plan-rows tests FAIL.

- [ ] **Step 3: Implement** as above; bump `dg-system.css?v=` (`grep -o 'dg-system\.css?v=[0-9.a-z-]*' index.html` first).

- [ ] **Step 4: Run to verify they pass.** Run: `node tests/uat.js 2>&1 | tail -3 && npx playwright test tests/e2e/ios-pro.spec.js tests/e2e/lift-b4.spec.js`. Expected: ALL PASS (lift-b4 still green).

- [ ] **Step 5: Commit**

```bash
git add features/ios-settings.js features/ios-pro.js dg-system.css lift-ios.css index.html tests/uat/555-ios-pro.js tests/uat/506-ios-settings.js tests/e2e/ios-pro.spec.js
git commit -m "feat(payments-b): iPhone Settings Plan rows (Apple, cancelled, web-billed, Free), Manage in Apple, Restore"
```

---

### Task 6: iPhone grace banner and Pro-ended sheet

**Files:**
- Modify: `features/ios-pro.js` (`iosPro.graceBannerHtml(status) → string`, `iosPro.maybeEnded(status) → void`), `features/ios-home.js` (one call that inserts the banner at the top of the iPhone Home when it renders), `lift-ios.css` (`.ip-banner` from the drawing's `.banner`)
- Test: `tests/uat/555-ios-pro.js`, `tests/e2e/ios-pro.spec.js`

**Interfaces:**
- Consumes: Task 3 `iosPro.status()`, `startProUpgrade`; Task 2 `openSubscriptions()`; Task 4 sheet + footer links. Plan A owns the web banner and web ended dialog; its Task 18 renders nothing under `html.is-native` (this task's e2e confirms it).
- Produces: the two functions above. `Preferences` key `ca_ended_seen` = the `endsAt` value already shown (so the sheet appears once per ending).

Copy, verbatim (screen E):
- Banner, `source 'apple'`, `status 'grace'`: `Apple couldn't renew your Pro.` / `Update your payment method in Apple to keep it. Pro stays on in the meantime.` / button `Open Apple` (→ `openSubscriptions()`).
- Banner, `source 'stripe'`, `status 'grace'` on iPhone: `There's a problem with your Pro billing. Check your email.` and **no button**, no domain, no instruction to pay (3.1.3).
- Ended sheet (once, when `status 'ended'` and `endsAt` ≠ `ca_ended_seen`): eyebrow `Pro` / `Your Pro has ended` / `Your progress is kept: every answer, streak and score. You're back on Free, with 15 questions and 5 review cards a day on <Cert>.` / `Renew: <yearly.price> a year, billed through your Apple ID. Renews automatically until you cancel. Cancel at least 24 hours before renewal in your Apple ID settings.` / `Renew Pro` (→ `startProUpgrade('yearly')`) / `Continue on Free` / `Restore purchases` · `Terms of Use` · `Privacy`. No prices → no Renew line and Renew Pro disabled, as in Task 4.

- [ ] **Step 1: Write the failing tests:** UAT `grace banner: Apple variant has Open Apple`, `grace banner: web-billed variant has no link or button`, `grace banner: none outside grace`; E2E `ended sheet shows once per ending` (second render with the same `endsAt` → none), `Renew Pro on the ended sheet goes through startProUpgrade('yearly')`, `the web banner and dialog never render in the app` (Plan A's selectors absent under the native UA).
- [ ] **Step 2: Run to verify they fail.** Run: `npx playwright test tests/e2e/ios-pro.spec.js --project=chromium -g "grace|ended"`. Expected: FAIL.
- [ ] **Step 3: Implement** as above.
- [ ] **Step 4: Run to verify they pass.** Run: `node tests/uat.js 2>&1 | tail -3 && npx playwright test tests/e2e/ios-pro.spec.js tests/e2e/lift-a.spec.js`. Expected: ALL PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(payments-b): iPhone grace banner and Pro-ended sheet"` (files above).

---

### Task 7: iPhone Delete account screen with the Apple warning (revoke kept)

**Files:**
- Modify: `features/ios-pro.js` (`iosPro.openDelete() → void`, pure `_ipDeleteModel(status, identities) → { box: 'apple'|'web'|null, signInWith: 'Apple'|'Google'|null }`), `features/settings.js` (`_showDeleteAccountConfirmUI`: when `CA_NATIVE`, call `iosPro.openDelete()` and return), `lift-ios.css` (`.ip-del*` from the drawing's `.bl-lead`, `.inline-warn`, `.inline-note`, `.gone`, `.field`, `.acts`)
- Test: `tests/uat/555-ios-pro.js`, `tests/e2e/ios-pro.spec.js`, `tests/e2e/lift-5c.spec.js` (must stay green)

**Interfaces:**
- Consumes: `window._confirmDeleteAccount(modal, userId)` (`features/home.js`; runs `iosSignIn._appleRevoke()` first when the account has Apple, then `request_account_deletion`, then the goodbye). The screen hosts an element with class `dla-card` inside its root so `_confirmDeleteAccount` works unchanged. Task 3 `iosPro.status()`, Task 2 `openSubscriptions()`, `iosSignIn._hasApple(user)`.
- Produces: `iosPro.openDelete()`, `_ipDeleteModel`.

Copy, verbatim (screen G) except one sentence:
- Header `Delete account` with Back.
- Lead: `This removes your progress, history and Pass Plan from every device.` followed by the existing truth instead of the drawing's "It can't be undone.": `Sign in within 7 days to cancel. After that it can't be undone.` (the deletion is scheduled with a 7-day window today; founder approved this sentence on 1 Nov).
- Apple box (`source 'apple'`, Pro): `You're still billed by Apple. Deleting your account doesn't stop that. Cancel in your Apple ID.` + link `Open Apple subscriptions` (→ `openSubscriptions()`).
- Web box (`source 'stripe'`, Pro): `Your Pro ends with your account` / `We cancel it when your account is deleted, so there are no more charges.` (Plan A's daily billing job cancels it at purge; Plan B runs after A.)
- No box for Free or owner.
- List: `Quiz history, streaks and readiness`, `Saved mistakes and review cards`, and `Your sign-in with Apple` / `Your sign-in with Google` per the account's identities (Apple first; neither for email-only).
- Field `Type DELETE to confirm`; `Delete my account` enabled only when the trimmed, upper-cased value is `DELETE`; `Keep my account` closes.

- [ ] **Step 1: Write the failing tests**

UAT: `delete model: Apple-billed Pro gets the Apple box`, `delete model: web-billed gets the web note`, `delete model: Free gets no box`, `settings.js hands the iPhone app to iosPro.openDelete`, `home.js still calls _appleRevoke before request_account_deletion` (`/_appleRevoke\(\)[\s\S]{0,400}request_account_deletion/`).
E2E:
```js
test('Apple-billed: the warning and the link show, and Delete stays available', ...);   // type DELETE → button enabled even though billing is Apple
test('Open Apple subscriptions opens the App Store page', ...);
test('deleting an Apple account still asks Apple first, then schedules deletion', ...);  // the 5c stub: apple-revoke request precedes the request_account_deletion rpc
test('Delete is disabled until DELETE is typed', ...);
```
- [ ] **Step 2: Run to verify they fail.** Run: `npx playwright test tests/e2e/ios-pro.spec.js --project=chromium -g Delete`. Expected: FAIL.
- [ ] **Step 3: Implement** as above.
- [ ] **Step 4: Run to verify they pass.** Run: `node tests/uat.js 2>&1 | tail -3 && npx playwright test tests/e2e/ios-pro.spec.js tests/e2e/lift-5c.spec.js`. Expected: ALL PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(payments-b): iPhone delete screen with the Apple billing warning; revoke unchanged"` (files above).

---

### Task 8: Five-stage visual pass over the new iPhone surfaces

**Files:** `features/ios-pro.js`, `features/ios-settings.js`, `lift-ios.css`, `dg-system.css` (only what the pass changes)

Surfaces: paywall (every trigger, launch on and off, prices missing), already-Pro, Confirming, You're Pro, Waiting for approval, Settings Plan rows (five states), grace banner (two), ended sheet, delete screen (three boxes). Light and dark, 402 px.

- [ ] **Step 1:** run `design-taste-frontend`, then `emil-design-eng`, then `transitions-dev`, then `humanizer` (on every "new copy" line listed in Tasks 3, 4 and 7; the drawing's verbatim copy is not rewritten), then `marketing-psychology`. Motion: only BRAND.md §6 curve and durations; Confirming → You're Pro is a cross-fade of the card content (the drawing's `cf-swap`), nothing else moves unless stage 2 asks for it; `prefers-reduced-motion` collapses to fade.
- [ ] **Step 2:** screenshot each surface (Playwright, mobile-safari) next to the matching drawing frame; record differences and their fixes in the PR description.
- [ ] **Step 3: Run** `node tests/uat.js && npx playwright test tests/e2e/ios-pro.spec.js`. Expected: ALL PASS.
- [ ] **Step 4: Commit** `git commit -m "polish(payments-b): five-stage pass over the iPhone purchase surfaces"`.

---

### Task 9: Sandbox testing on the simulator and a real iPhone, and the App Review notes

Needs Task 0 complete and Task 9a merged into this branch. Testing points the app at a test server by editing `capacitor.config.json` `server.url` locally to `http://localhost:3140` (simulator) or the Vercel preview URL (device), never committed.

**Files:**
- Create: `ios/App/App/Products.storekit` (Xcode → File → New → StoreKit Configuration File, "Sync with App Store Connect"; scheme → Run → Options → StoreKit Configuration = it). Committed; only Debug runs use it.
- Modify: `native-shell.js` (`RC_IOS_KEY` = the F11 key), `docs/mobile/APP_STORE_DISTRIBUTION.md` (§In-app purchase: setup record from Task 0, the test matrix below with results, the App Review notes text)
- Test: `tests/uat/555-ios-pro.js` (`RC_IOS_KEY is set`, `capacitor.config.json server.url is networkplus`, `Products.storekit lists pro_monthly and pro_annual`)

- [ ] **Step 1: Simulator (StoreKit file, F12 done).** Build and run on the iPhone 17 Pro simulator. Walk and tick: buy Yearly → Confirming → You're Pro; RevenueCat dashboard (View Sandbox Data) shows the purchase; Settings shows `Renews … · billed by Apple`. Xcode → Debug → StoreKit → Manage Transactions: refund it → Settings shows Free after the webhook. Enable Ask to Buy in the .storekit editor → buy → Waiting for approval → approve in Manage Transactions → You're Pro. Enable Billing Grace Period + "fail renewals" → Home shows the Apple grace banner. Expected: every step as the drawing shows; webhook logs `applied`.
- [ ] **Step 2: Real iPhone (sandbox Apple ID, F13).** Settings → Developer → Sandbox Apple Account (iOS 18+). Build to the device from Xcode with `server.url` = the PR's Vercel preview. Walk: Yearly with the intro offer (first sandbox account, eligible) shows `Launch offer, first year`; buy; monthly renewals every 5 minutes, yearly every hour (Apple sandbox rates, RevenueCat docs read 1 Nov 2026) each produce a `RENEWAL` row update; cancel in Settings → App Store → Sandbox → Manage → Settings shows `Pro until …`; delete the app, reinstall, sign in, Restore → `Pro restored. Welcome back.`; sign into a second CertAnvil account, Restore → the other-account line; the family-child tester → Ask to Buy → approve on the parent's device → Pro turns on, including after force-quitting the app. Expected: all as specified; `provider_subscriptions` on the branch DB shows `environment 'sandbox'` rows; `is_pro` true only when it should be.
- [ ] **Step 3: Already-Pro guard.** Buy Pro on the web preview with a Stripe test card (Plan A), then open the iPhone paywall on the same account → `You're already Pro … billed outside the App Store`, no Apple sheet.
- [ ] **Step 4: App Review notes** (text saved in `APP_STORE_DISTRIBUTION.md`, pasted by the founder into App Store Connect → App Review Information):

```
CertAnvil Pro is an auto-renewable subscription sold only through in-app purchase (RevenueCat over StoreKit). Two products in one group: pro_monthly and pro_annual.
To see the paywall: open any cert, then Settings → Plan → Get Pro (or answer 15 practice questions in a day).
Pro is account-based: progress and Pro sync across iPhone and the web, so an account is required to attach the subscription. The paywall and prices are visible before signing in. Sign in with Apple, Google or an emailed code.
Demo account: <REVIEW_DEMO_EMAIL>. On the sign-in screen choose "Continue with email", enter that address, then enter the code <REVIEW_DEMO_CODE> (it works without the email). The account is on the Free plan with today's questions available, so you can reach the paywall and buy with your sandbox Apple ID.
Native features: Sign in with Apple, StoreKit in-app purchase through RevenueCat, Restore purchases, local study-reminder notifications, haptics, the share sheet and native sheets.
Restore purchases is on the paywall and in Settings → Plan. Terms of Use: https://certanvil.com/terms · Privacy: https://certanvil.com/privacy.
Account deletion: Settings → Delete account. Subscribers billed by Apple see a warning with a link to their Apple subscriptions; deletion is never blocked. Sign in with Apple tokens are revoked on deletion.
There are no links to outside purchase methods in the app.
```

- [ ] **Step 5: Commit** `git commit -m "chore(payments-b): RevenueCat key, StoreKit test file, sandbox results and App Review notes"`.

---

### Task 9a: App Review demo sign-in

**Files:**
- Create: `landing/api/auth/review-signin.js`, `tests/api/review-signin.test.mjs`, `tests/uat/556-review-signin.js`
- Modify: `features/ios-signin.js` (the email-code step), `tests/e2e/ios-pro.spec.js`

**Interfaces:**
- Consumes: Supabase Admin API `POST <SUPABASE_URL>/auth/v1/admin/generate_link` `{ type: 'magiclink', email }` with the service key (returns `properties.hashed_token`); supabase-js `auth.verifyOtp({ token_hash, type: 'magiclink' })`.
- Produces: `POST /api/auth/review-signin` `{ email, code }` → `200 { token_hash }` only when `REVIEW_DEMO_EMAIL` and `REVIEW_DEMO_CODE` are both set, the email matches (case-insensitive) and the code matches (constant-time); otherwise `404 {}` for every input (never says why). Rate limit: 10 calls per IP per hour through the existing `rl_check` RPC, else 429.

Client rule: in `ios-signin.js`, when `verifyOtp({ email, token: code, type: 'email' })` fails, call the endpoint once; a `token_hash` answer signs in with `verifyOtp({ token_hash, type: 'magiclink' })`; anything else shows today's wrong-code message. No demo address or code ships in the client.

- [ ] **Step 1: Failing tests:** env unset → 404 even with any body; right email + wrong code → 404; wrong email + right code → 404; both right → 200 with the stubbed `hashed_token`, one admin call; the 11th call in an hour → 429; no `generate_link` call on a 404 path. UAT: `ios-signin.js` contains no `@` address literal for the demo and calls `/api/auth/review-signin` only after a failed `verifyOtp`. E2E: a stubbed failed `verifyOtp` then a 200 from the endpoint signs in; a 404 shows the usual wrong-code line.
- [ ] **Step 2: Run, fail.** **Step 3: Implement.** **Step 4: Run, pass.** **Step 5: Commit** `feat(payments-b): App Review demo sign-in, off unless both env vars are set`

---

### Task 10: Ship (gated lane) and submit the build

- [ ] **Step 1: Full suite.** Run: `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"; node tests/uat.js && node tests/tech-debt.js && for f in revenuecat-webhook revenuecat-sync review-signin; do node --experimental-detect-module tests/api/$f.test.mjs; done && npx playwright test --project=chromium --project=webkit --project=mobile-safari`. Expected: all green (record the webkit and mobile-safari run in the PR; CI gates chromium only).
- [ ] **Step 2: Version.** `node scripts/bump-version.js <next minor> "Payments B: iPhone purchase through Apple"`; confirm `lift-ios.css?v=` and `dg-system.css?v=` were bumped in the commits that changed them.
- [ ] **Step 3: PR.** Push `feat/payments-b-iphone`, open the PR (body: what ships, the new-copy list for founder sign-off, the deletion lead sentence, the drawing comparisons from Task 8, the sandbox results from Task 9). Preview smoke on the landing preview alias (Plan A Task 21): `curl -s -o /dev/null -w '%{http_code}' -X POST https://certanvil-landing-payments.vercel.app/api/revenuecat/webhook` → `401`; RevenueCat dashboard "Send test event" pointed at the alias → `200 {"result":"test"}`; `POST /api/auth/review-signin` with no env in Preview → `404`.
- [ ] **Step 4: Review.** Whole-branch review (gated lane: Fable-reviewed when a Fable session is running); fix pass.
- [ ] **Step 5: Merge** on the founder's "ship it": squash-merge. Founder points the F9 webhook at production (already `https://certanvil.com/api/revenuecat/webhook`) and sends a test event → `200`. Post-deploy: `deploy-verification.yml` green; on the production build in TestFlight, open Settings and the paywall on a sandbox account (prices show; buy; Pro switches on).
- [ ] **Step 6: Build and submit (founder + Claude).** Confirm `RC_IOS_KEY` is set (the paywall is fully live, not flag-gated), F14 privacy labels, F15 demo account and F16 manual release are done. `npx cap sync ios`; Xcode → Product → Archive → upload; TestFlight smoke on a real iPhone (subscriptions renew once every 24 hours there; a non-allowlisted TestFlight account's sandbox purchase does not give Pro); attach both subscription products to the version; paste the Task 9 notes; submit. After approval: remove `REVIEW_DEMO_EMAIL` / `REVIEW_DEMO_CODE`, and release the version only once `SALES_OPEN_AT` is set (Plan C Task 17). Remind the founder of the onboarding GO-LIVE flip in `docs/mobile/APP_STORE_DISTRIBUTION.md` §GO-LIVE.

---

## Deferred (from review)

- **Apple renewal reminders and the DMCC regime for in-app purchases:** Apple is the seller for IAP and sends its own renewal notices; revisit in the DMCC follow-up plan (spec gap 19).
- **`iap_started` / `iap_paid` analytics** (build #27): deferred with Plan A's app paywall analytics (needs the Vercel plan decision).

## Self-review

**Review fixes folded in (1 Nov).** Sandbox Pro only for allowlisted accounts (Plan A `is_pro`, Global Constraints); `/api/revenuecat/sync` after purchase and restore, and "Pro restored" only when the server agrees (Tasks 1b, 3); deleted-account events answer `unmatched` (Task 1); Apple-over-web double purchase reverses the Stripe side (Task 1); RevenueCat customer deleted at purge so a returning person can restore (Task 1b, F8); no `openPaywall` monkey-patch (Task 4); hard stops show Go Pro with IAP (Task 5 CSS); registry names (Task 4); `?app=1` Terms/Privacy (Task 4); copy without the domain (Tasks 4–6); `canBuy` and manual release (Tasks 3, 4, F16); privacy labels (F14), EULA (F5), demo sign-in (F15, Task 9a), account-based and native-features review notes (Task 9); Node 22 path (Task 2); UAT 555–557.

**Spec coverage.** iPhone purchase via RevenueCat (D6, gap 5) → Tasks 2–3. Products, one group, Yearly intro offer, grace period, agreements, EULA link, RevenueCat, Vercel secret → Task 0. `nativePurchase` / `nativeRestore` / `nativePrices` (contract) → Tasks 2–3. `app_user_id` = Supabase id → Task 2 `identify`, Task 3 step 4. Server check before the sheet + lock → Task 3. Ask to Buy → Task 3. Confirmation screens (C) → Task 3. Webhook, auth header, idempotency, `provider='apple'`, grace / billing retry / expiry / refund → Task 1. Paywall 3.1.2 disclosure with StoreKit prices, Restore, Terms of Use, Privacy (gap 6, screen B) → Task 4. Settings rows incl. web-billed plain text (E) → Task 5. Grace banner and ended sheet on iPhone (E) → Task 6. Deletion warning, no gate, revoke kept (gap 7, G) → Task 7. Sandbox on device and simulator, App Review notes → Task 9. Gated-lane ship → Task 10. Five-stage pass → Task 8. Not in Plan B by contract: web paywall, `/api/billing/status`, `/api/pricing`, the daily billing job's Stripe release, landing native-hide and in-app routing of other Go Pro paths (C), web deletion page, Terms/Privacy text (C).

**Type consistency.** `caNative.iap.purchase` returns `{ outcome }` with `'pro'|'pending'|'cancelled'|'other-account'|'failed'`; `nativePurchase` maps those plus `'already'|'signin'`; `nativeRestore` returns `'pro'|'none'|'other-account'|'failed'`. `NativePrices` fields (`price`, `currency`, `amount`, `perMonth`, `savePct`, `introOffer`) are used with those names in Tasks 4 and 6. Webhook `plan` values `monthly|yearly` match the contract's `plan`, and `BillingStatus.source`/`status` values match the contract's list.

**Proportion.** Code blocks are tests and the App Review text; bodies are left to the implementer except the event mapping table, which no signature determines.
