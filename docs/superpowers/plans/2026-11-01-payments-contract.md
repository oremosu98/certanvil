# Payments: shared contract between plans A, B, C (binding)

Spec: docs/superpowers/specs/2026-11-01-payments-e2e-design.md (approved). Drawing: mockups/payments-concept.html (approved; the build is a faithful lift).
Order: A lands first (B and C depend on it). B and C can run in parallel after A.

## Ownership
- **Plan A — foundation + web app** (gated lane): DB, payment APIs, Stripe, the web app paywall + purchase chokepoint, /account confirmation page, Billing page, account status line, cancel question, grace banner, Pro-ended screen, already-Pro guard (web), refund-cancels webhook, consent line at checkout, free-limit copy fixes inside the app. Also restores the admin bypass in is_pro() and confirms the daily limit is 15.
- **Plan B — iPhone** (gated lane): RevenueCat/StoreKit purchase, RevenueCat webhook → same record (provider='apple'), native paywall variant (3.1.2 disclosure, StoreKit prices, Restore, Terms of Use/Privacy), server check before Apple's sheet, Ask to Buy, iPhone Settings plan rows, account-deletion Apple warning (no gate), keep Sign in with Apple revoke.
- **Plan C — landing, legal, launch**: pricing page rebuild, diagnostic results Go Pro, homepage copy, `data-web-purchase` marker + native-hide on every landing page + in-app routing of pricing/billing to the native paywall, Terms/Privacy/FAQ/contact (support@), pricing footer, waitlist one-click unsubscribe, launch email + launch-day switch, PNG share image, Vercel Web Analytics + checkout events, business-address slot (founder fills it next month, last).

## Interfaces A produces (B and C consume; use these names exactly)
- DB (from the unmerged branch `feat/g1-hardening-provider-subscriptions`, rebased onto main): table `provider_subscriptions` (provider 'stripe'|'apple', user_id, plan 'monthly'|'yearly', status, current_period_end, cancel_at_period_end, revoked_at, original_transaction_id, product_id, environment, last_event_at), RPC `apply_provider_subscription_event(...)`, view `user_entitlements`, function `is_pro(uid)` = active/trialing/grace row from any provider OR profiles.role='admin'.
- `GET https://certanvil.com/api/pricing` → `{ currency: 'usd'|'gbp'|'eur', symbol: '$'|'£'|'€', monthly: '9.99', yearly: '89', yearlyPerMonth: '7.42', launch: { active: boolean, firstYear: '69'|'59', endsAt: ISO string } }`. Country from Vercel's `x-vercel-ip-country`; `?currency=` override. CORS allowlist `https://*.certanvil.com`.
- `POST /api/stripe/create-checkout-session` body `{ plan: 'monthly'|'yearly', currency, from?: certId, returnTo? }` (Bearer Supabase token) → `{ url }`; `409 { error: 'already_pro' }`. Attaches the launch coupon automatically while active; Stripe consent_collection terms + custom text "I want Pro to start now, and I understand I lose my 14-day right to cancel."; success_url `https://certanvil.com/account?checkout=success&from=<certId>`; cancel_url back to the origin with `?checkout=cancelled`.
- `POST /api/stripe/create-portal-session` → `{ url }`.
- `GET /api/billing/status` (Bearer) → `{ pro: boolean, source: 'stripe'|'apple'|'admin'|null, plan: 'monthly'|'yearly'|null, status: 'active'|'cancelled'|'grace'|'ended'|'free', renewsAt, endsAt, launchFirstYear: boolean, fullPriceFrom }`. Used by the account page, Billing page, app labels, already-Pro guard and iPhone (B).
- Client (app): `window.openPaywall(trigger)` where trigger ∈ 'limit' | 'run' | 'feature:<name>' | 'cert:<certId>'; `window.startProUpgrade(plan)` — the single purchase chokepoint: already Pro → "You're already Pro"; native iOS (`html.is-native`) → `window.nativePurchase(plan)` (defined by B; A ships a stub that does nothing on web); web → checkout session redirect. `window.refreshProState({ force: true })` and the `?pro=1` landing behaviour.

## Interfaces B produces
- `window.nativePurchase(plan)`, `window.nativeRestore()`, native StoreKit prices fed to the paywall via `window.nativePrices` (`{ monthly: {price, currency}, yearly: {...}, introOffer: {...}|null }`).
- `landing/api/revenuecat/webhook.js` writing via `apply_provider_subscription_event` with provider 'apple'.

## Interfaces C produces
- Pricing page reads `/api/pricing` and calls `/api/stripe/create-checkout-session` (after the existing landing sign-in modal).
- `data-web-purchase` attribute convention + one CSS rule `html.is-native [data-web-purchase]{display:none!important}` in landing and app stylesheets; native-hide script on every landing page.

## Project rules every plan inherits
- Gated lane: feature branch → PR → Supabase branch DB + Vercel preview → squash-merge. Migrations dated ≥ 2026-05-12 need a tested `-- ROLLBACK:` block, and a row in `scripts/sql/migration-audit.sql`. Endpoints graceful-503 on missing env vars.
- Tests: UAT modules in `tests/uat/NNN-*.js`, endpoint tests in `tests/api/*.test.mjs` (fetch stubbed, see tests/api/bug-report.test.mjs), PGlite for SQL, Playwright e2e in `tests/e2e/*.spec.js` across chromium, webkit, mobile-safari.
- Every feature on iOS app, mobile web and desktop. app.js ratchet cap (tests/appjs-baseline.json): new UI goes in `features/*.js`, not app.js. `dg-system.css?v=` hand-bump on any dg-system.css change. Never write user-state localStorage on prod. No em dashes in on-screen copy. App never names the founder.
- Locked decisions: Monthly $9.99/£8.99/€9.99, Yearly $89/£79/€89 (default), launch $69/£59/€69 first year via a $20/£20/€20 amount-off coupon, no trial, no refund promise or refund button, Apple IAP only on iPhone, support@certanvil.com only.

## Reconciled after the three plans were written (1 Nov)
- Paywall wording has one source: `features/paywall-copy.js` → `window.PAYWALL_COPY.copyFor(trigger, ctx)` (Plan A). Plan B's iPhone paywall reads it. Unknown triggers fall back to `feature:pro` ("Unlock every cert with Pro").
- Subscription `status` values: `grace` is the one grace word for both providers; Apple billing issues with no grace are `unpaid` (not Pro). `past_due` is rejected.
- The web account-deletion page (drawing screen G, web) belongs to Plan A, Task 7. The iPhone one to Plan B, Task 7. Same wording.
- Launch timing: `LAUNCH_STARTS_AT` = email send (coupon live, `/api/pricing` active); `CERTANVIL_SALES_OPEN_AT` = 48h later (public switch); `LAUNCH_ENDS_AT` = 30 days after the public switch, matched by the coupon's redeem-by and Apple's intro-offer end.
- Extra Plan A interfaces: `openPaywall(trigger, opts)`, `window.CAPaywall`, `window.caBilling`, portal `flow`, `/api/billing/status?detail=1`, columns `currency` and `launch_price_until`.
