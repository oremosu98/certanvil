# Payments: shared contract between plans A, B, C (binding)

Spec: docs/superpowers/specs/2026-11-01-payments-e2e-design.md (approved, revised 1 Nov after the three-way review). Drawing: mockups/payments-concept.html (approved; the build is a faithful lift, except the struck-through $89, which the review removed). Founder decisions after review (1 Nov): statutory 14-day pro-rata right kept, OSS as the tax backup, a server-side sales-open switch, the address gating sales.
Order: `feat/cert-registry` lands on main first. Plan A then branches from that main (or rebases onto it before its first commit). B and C start after A merges and can run in parallel.

## Ownership
- **Plan A, foundation + web app** (gated lane): DB, every payment API, Stripe, the sales-open switch, the confirmation email, the daily billing job (deletion release, grace re-check, renewal reminders), server-side AI metering, the web app paywall + purchase chokepoint, /account confirmation page, Billing page with the direct cancel, account status line, grace banner, Pro-ended screen, already-Pro guard (web), refund-cancels webhook, consent line at checkout, free-limit copy fixes, the landing + app preview path.
- **Plan B, iPhone** (gated lane): RevenueCat/StoreKit purchase, RevenueCat webhook and sync endpoint (provider='apple'), native paywall (3.1.2 disclosure, StoreKit prices, Restore, Terms of Use/Privacy), server check before Apple's sheet, Ask to Buy, Settings plan rows, account-deletion Apple warning (no gate), RevenueCat customer deletion, the App Review demo sign-in, App Store privacy labels and EULA.
- **Plan C, landing, legal, launch**: pricing page rebuild, diagnostic Go Pro, homepage copy, `data-web-purchase` + native-hide (including `?app=1`) + in-app routing, Terms v1.2 (with a frozen copy) / Privacy v1.3 / FAQ / one contact, analytics with opt-out, waitlist unsubscribe, launch email with early-access links, PNG share image, `launch-check.mjs`, the launch runbook and every founder gate.

## Sales-open switch (one switch, server-side)
- Env `SALES_OPEN_AT` (ISO) on certanvil-landing. Unset or in the future = sales closed. It is set only after `node scripts/launch-check.mjs --pre-open` passes every gate: Terms v1.2 and Privacy v1.3 live, trading address on the site and in `TRADER_ADDRESS`, tax in place (Managed Payments granted, or EU non-Union OSS + UK VAT registrations in Stripe Tax), solicitor check recorded, live keys + Prices + coupon matching `PRICES`.
- While closed, `create-checkout-session` answers `403 { error: 'sales_closed' }` unless the caller is in `billing_test_accounts`, or sends a valid early-access token while `LAUNCH_STARTS_AT ≤ now < SALES_OPEN_AT`.
- `GET /api/pricing` reports `salesOpen` and `earlyAccess`; `GET /api/billing/status` reports `salesOpen` and `canBuy` (salesOpen, or caller allowlisted). The web paywall, the pricing page and the iPhone paywall all read these; nothing client-side decides on its own. `window.CERTANVIL_SALES_OPEN_AT` no longer exists.
- Live checkout also refuses (`503 not_ready`) while `TRADER_ADDRESS` or `TERMS_VERSION` is unset and the Stripe key is `sk_live_`: the address gates sales in code, not only in the runbook.
- iPhone: the founder also holds the reviewed binary with "Manually release this version" until sales are open.

## Environments and test data
- Stripe mode follows the key prefix (`sk_live_` = live, `sk_test_` = test). The webhook rejects (400, logged) any event whose `livemode` disagrees with the key. Rows from test mode, and from RevenueCat `SANDBOX`, are written with `environment = 'sandbox'`.
- `is_pro()` counts a `sandbox` row only for a user in `billing_test_accounts`, an admin, or `profiles.is_playtest = true`. App Review's demo account and the founder's test accounts go in `billing_test_accounts`.
- Every billing endpoint needs `SUPABASE_URL` set explicitly and answers 503 without it: no fallback to the production project (`admin-mail.js`'s fallback stays for the admin endpoints only).
- Preview path: CI deploys a landing preview per PR and aliases it to `https://certanvil-landing-payments.vercel.app`; the app preview is aliased to `https://certanvil-app-payments.vercel.app` and reaches the landing preview through `?api=`. Both previews use the production Supabase project (the app client is hardcoded to it) with test-mode Stripe only; Preview scope holds `sk_test_` keys only.

## Interfaces A produces (B and C consume; use these names exactly)
- DB `provider_subscriptions`: `id, user_id, provider ('stripe'|'apple'), provider_customer_id, provider_subscription_id, original_transaction_id, product_id, tier, status, plan ('monthly'|'yearly'), currency, current_period_end, current_period_start, cancel_at_period_end, environment ('production'|'sandbox'), revoked_at, launch_price_until, consent_text, consent_at, terms_version, confirmation_sent_at, renewal_reminded_for, released_at, last_event_at, created_at, updated_at`. Status values `active, trialing, grace, canceled, incomplete, incomplete_expired, unpaid, expired, revoked`; `grace` is the one grace word (Stripe `past_due` with retries left, Apple billing grace); `past_due` itself is rejected.
- DB `billing_test_accounts(user_id uuid primary key, note text, created_at)`; `open_checkout_sessions(user_id uuid primary key, session_id text, created_at)`.
- RPC `apply_provider_subscription_event(p_event_id text, p_event_type text, p_row jsonb) returns text` → `applied | duplicate | stale | unmatched`. `unmatched` also when `p_row.user_id` no longer exists in `auth.users`. Service role only.
- `is_pro(uid)`: entitling row (tier pro, status active/trialing/grace, not revoked, period not ended, production or allowlisted sandbox) OR `profiles.role = 'admin'` OR an active legacy `subscriptions` row (playtesters).
- `purge_deleted_accounts()` skips an account while it has a production `provider_subscriptions` row with `released_at is null` and either `provider = 'apple'` or a non-terminal status. The daily job releases it (Stripe: cancel now and void open invoices; Apple: delete the RevenueCat customer, Plan B).
- `GET /api/pricing` → `{ currency: 'usd'|'gbp'|'eur', symbol: '$'|'US$'|'£'|'€', monthly, yearly, yearlyPerMonth, currencyLocked: boolean, salesOpen: boolean, earlyAccess: boolean, analytics: boolean, launch: { active, firstYear, endsAt } }`. `US$` when the currency is USD and the country is known and not US. `currencyLocked` is true for GB and euro-area visitors: their checkout is always in their own currency and `?currency=` only changes what is displayed elsewhere. `analytics` is false for EU/EEA visitors.
- `POST /api/stripe/create-checkout-session` (Bearer) body `{ plan, currency, from?, returnTo?, earlyAccess? }` → `{ url, currency }`; `409 already_pro`; `403 sales_closed`; `503 try_again` when the Pro check fails (fails closed); `503 not_ready`; `400 bad_plan`. Session expires in 30 minutes; a new session expires the caller's previous open one. Consent text from `consentText()` (below). `success_url = <site>/account?checkout=success&session_id={CHECKOUT_SESSION_ID}[&from=<certId>]`.
- `POST /api/stripe/sync` (Bearer) `{ session_id }` → `{ result: 'applied'|'duplicate'|'stale'|'pending', pro: boolean }`. Same row and confirmation email as the webhook.
- `POST /api/stripe/subscription` (Bearer) `{ action: 'cancel'|'resume', reason?, note? }` → `{ status: 'cancelled'|'active', endsAt }`. Cancel is one call (no portal hop) and sends the exit email.
- `POST /api/stripe/create-portal-session` (Bearer) `{ flow?: 'card'|'switch', returnTo? }` → `{ url }`; `404 no_billing_account`.
- `GET /api/billing/status` (Bearer) → `{ pro, source: 'stripe'|'apple'|'admin'|null, plan, status: 'active'|'cancelled'|'grace'|'ended'|'free', renewsAt, endsAt, launchFirstYear, fullPriceFrom, currency, salesOpen, canBuy }`; `?detail=1` adds `card`.
- `GET /api/cron/billing-daily` (Vercel cron, `Authorization: Bearer <CRON_SECRET>`) → `{ released, regraced, reminded, confirmations, alerts }`. Releasers in `landing/api/_lib/billing-release.js`: `releaseStripe(row)` (A), `releaseApple(row)` (B).
- `landing/api/_lib/consent.js`: `consentText({ plan, currency, launch }) → string`, `CONSENT_VERSION`. Normal: `I agree to the [Terms](https://certanvil.com/terms) and to Pro renewing automatically at £79 a year until I cancel. I want Pro to start now. If I cancel in the first 14 days, I only get back the part I haven't used.` Launch Yearly: `… renewing automatically at £79 a year after my first year at £59, until I cancel. …`
- `landing/api/_lib/early-access.js`: `earlyAccessToken(rowId) → string` (`<rowId>.<hex HMAC-SHA256(EARLY_ACCESS_SECRET, 'ea:'+rowId)>`), `verifyEarlyAccess(token) → boolean`. C's launch email links `/pricing?buy=yearly&ea=<token>`.
- `landing/api/_lib/stripe-ops.js`: `refundUnused(subId, { reason }) → { refunded: cents }` (pro-rata of the latest paid invoice), `cancelNow(subId, idemKey)`, `voidOpenInvoices(subId)`. B's RevenueCat webhook uses `refundUnused` + `cancelNow` when an Apple purchase lands on an account with live Stripe Pro.
- Client (app): `window.openPaywall(trigger, opts) → boolean`: on `html.is-native` it calls `window.nativePaywall(trigger, opts)` when that exists and returns `true`, else `false`. B never reassigns `openPaywall`. `window.startProUpgrade(plan)`, `window.nativePurchase` stub, `window.refreshProState({ force })`, `window.caProLastKnown(uid?)`, `window.caProConfirmed() → boolean` (server said Pro during this page's life), `window.caApiBase() → string`, `window.PAYWALL_COPY.copyFor(trigger, ctx)`, `window.CAPaywall`. `buildSignInUrl(opts?)` accepts `{ intent: 'pro', plan }`.
- Landing: `landing/lib/cert-registry.js` (byte copy of `lib/cert-registry.js`, `window.CertRegistry`), `window.caBilling`, DOM event `ca:checkout-pro` (detail `{ plan, from }`) fired once by the `/account` confirmation when it reaches You're Pro.
- Paywall triggers: `limit | run | feature:<name> | cert:<certId>`; unknown → `feature:pro`.

## Interfaces B produces
- `window.nativePaywall(trigger, opts)`, `window.nativePurchase(plan)`, `window.nativeRestore()`, `window.nativePrices`.
- `landing/api/revenuecat/webhook.js` and `POST /api/revenuecat/sync` (Bearer) → `{ result, pro }`.
- `releaseApple(row)` in `billing-release.js`.
- `POST /api/auth/review-signin` `{ email, code }` → `{ token_hash }` or 404 (enabled only while `REVIEW_DEMO_EMAIL` and `REVIEW_DEMO_CODE` are set).

## Markers (A and C)
- `data-web-purchase` = shows a web price or starts a web purchase directly; always hidden on `html.is-native`.
- `data-paywall="<trigger>"` = only opens the paywall, shows no price; hidden on `html.is-native:not(.ca-iap)` (A's rule), shown with in-app purchase (B adds `html.ca-iap`), where it opens the native paywall.
- Web delete-account page: Plan A Task 11. iPhone delete screen: Plan B Task 7. Same wording.

## Interfaces C produces
- Pricing page reads `/api/pricing` (`salesOpen`, `earlyAccess`, `currencyLocked`) and posts the checkout with `earlyAccess` from `?ea=`, kept in `sessionStorage.ca_ea` across sign-in and cancel.
- `data-web-purchase` + `html.is-native [data-web-purchase]{display:none!important}` in landing and app stylesheets; native-hide on every landing page, honouring `?app=1` (sets `is-native`, kept in `sessionStorage.ca_app`).
- Frozen Terms copy at `https://certanvil.com/legal/terms-v1.2` (the confirmation email links it).
- `scripts/launch-check.mjs [--pre-open]`.

## Project rules every plan inherits
- Gated lane: feature branch → PR → Supabase branch DB + Vercel previews → squash-merge. Migrations dated ≥ 2026-05-12 need a tested `-- ROLLBACK:` block and rows in `scripts/sql/migration-audit.sql`. Endpoints graceful-503 on missing env vars.
- UAT numbers: `feat/cert-registry` owns 540–546. **A uses 550–554, B 555–557, C 560–566.** Line numbers in app files are re-derived with `node scripts/graphq.js` at execution (the registry shifted `app.js` by about 100 lines).
- Tests: UAT modules in `tests/uat/NNN-*.js`, endpoint tests in `tests/api/*.test.mjs` (fetch stubbed, see tests/api/bug-report.test.mjs), PGlite for SQL, Playwright e2e across chromium, webkit, mobile-safari locally (CI gates chromium + landing only; the PR template records the webkit and mobile-safari run).
- Every feature on iOS app, mobile web and desktop. app.js ratchet: new UI in `features/*.js`. `dg-system.css?v=` hand-bump on any dg-system.css change. Never write user-state localStorage on prod. No em dashes in on-screen copy. App never names the founder. Version = next minor at execution (never a hardcoded number).
- Locked decisions: Monthly $9.99/£8.99/€9.99, Yearly $89/£79/€89 (default), launch $69/£59/€69 first year via a $20/£20/€20 amount-off coupon, no trial, no refund promise or refund button (statutory 14-day pro-rata right described in Terms only), no struck-through price, Apple IAP only on iPhone, support@certanvil.com only.
- Launch timing: `LAUNCH_STARTS_AT` = email send (coupon live, early-access tokens work); `SALES_OPEN_AT` = 48h later (public); `LAUNCH_ENDS_AT` = 30 days after `SALES_OPEN_AT`, matched by the coupon's redeem-by and Apple's intro-offer end.
