# Payments Plan C: Landing, Legal and Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** certanvil.com sells Pro: a rebuilt pricing page that checks out through Stripe, a Go Pro path from the diagnostic, honest homepage and legal copy, nothing purchasable inside the iPhone app, a one-click unsubscribe, one launch email, a launch switch that ends on its own, a PNG share image, and checkout analytics.

**Architecture:** The landing site stays static HTML plus small browser scripts. Three shared scripts carry the cross-page logic: `lib/pricing-client.js` (reads Plan A's `/api/pricing`, formats prices, decides whether the launch offer is live), `lib/launch-config.js` (the one moment public sales open) and `lib/track.js` (Vercel Web Analytics events). The pricing page talks to Plan A's checkout and billing endpoints by their contract names. One `data-web-purchase` marker plus one CSS rule hides every price and buy element in the iPhone app, and the landing's pricing and billing pages bounce the app back to its native paywall. Two small Edge endpoints (unsubscribe, launch email) reuse `api/_lib/admin-mail.js`.

**Tech Stack:** Static HTML/CSS/vanilla JS (landing/), Vercel Edge functions (ESM), Supabase REST with the service key, Resend, Vercel Web Analytics, Playwright (`--project=landing` and `--project=chromium`), UAT modules (`node tests/uat.js --only NNN`), PGlite DB tests, `node --experimental-detect-module` endpoint tests.

**Spec:** `docs/superpowers/specs/2026-11-01-payments-e2e-design.md` (approved). **Contract:** `/private/tmp/claude-501/-Users-simioremosu-Desktop/4f004202-437e-4dd6-83bd-6323e4a3e77a/scratchpad/payments-contract.md` (binding; copy it into `docs/superpowers/plans/2026-11-01-payments-contract.md` in Task 1 so it travels with the repo). **Drawing:** `mockups/payments-concept.html`, screens A (Pricing), F (Diagnostic) and the `faq()` block: a faithful lift, exact copy.

## Global Constraints

- Plan A lands first. Consume its interfaces by these exact names: `GET /api/pricing` → `{ currency, symbol, monthly, yearly, yearlyPerMonth, launch: { active, firstYear, endsAt } }` (`?currency=usd|gbp|eur` override); `POST /api/stripe/create-checkout-session` body `{ plan, currency, from?, returnTo? }` with `Authorization: Bearer <Supabase access token>` → `{ url }` or `409 { error: 'already_pro' }`; `GET /api/billing/status` (Bearer) → `{ pro, source: 'stripe'|'apple'|'admin'|null, plan, status: 'active'|'cancelled'|'grace'|'ended'|'free', renewsAt, endsAt, launchFirstYear, fullPriceFrom }`; app `window.openPaywall(trigger)`.
- Prices (web): Monthly $9.99 / £8.99 / €9.99; Yearly $89 / £79 / €89, **Yearly is the default** everywhere it can be chosen; launch $69 / £59 / €69 for the first year. Always shown from `/api/pricing`; the hard-coded USD figures exist only as the fallback.
- The billed amount per period is always the most prominent price; "$7.42 a month" is a smaller secondary line under Yearly.
- No trial. No refund promise, no refund button, no "money-back" anywhere. Refunds: "no automatic refunds", write to support, iPhone refunds go through Apple.
- One contact on every customer surface: `support@certanvil.com`.
- Free tier copy is "15 questions and 5 review cards a day" everywhere.
- Inside the iPhone app (`html.is-native`): no web price used as a buy prompt, no Go Pro or waitlist for Pro, no links to pricing, billing, Stripe or refunds, no web launch offer. Every such element carries `data-web-purchase`; the one rule is `html.is-native [data-web-purchase]{display:none!important}`.
- Launch offer: real 30-day window, ends on its own at the stated time, never extended. Web shows date and time ("Ends 23:59 UK time, 1 Dec").
- No em dashes in on-screen copy. The app never names the founder. Never write user-state localStorage on prod. No new emoji.
- Landing motion uses BRAND.md §6 (curve `cubic-bezier(0.16, 1, 0.3, 1)`, the mockup's `--t-press 160ms / --t-lift 200ms / --t-swap 220ms`); `transform` and `opacity` only; hover behind `@media (hover:hover) and (pointer:fine)`; `prefers-reduced-motion` collapses to fade-only. Do not copy the old `--eo:cubic-bezier(0.23,1,0.32,1)` into new pricing CSS.
- App files touched here (`dg-system.css`, `lib/onboarding-chrome.js`, `index.html`, a new `features/*.js`) obey the app.js ratchet (no app.js growth) and the `dg-system.css?v=` hand-bump.
- Endpoints answer a graceful 503 when an env var is missing (`api/_lib/admin-mail.js` `missingEnv`/`unconfigured`).
- Migrations dated ≥ 2026-05-12 carry a tested `-- ROLLBACK:` line and a row in `scripts/sql/migration-audit.sql`. Task 12's migration puts this branch on the gated lane (Supabase branch DB + preview + squash-merge).
- Branch: `feat/payments-c-landing-launch` off main after Plan A's merge. Landing deploys on merge through `.github/workflows/deploy-landing.yml`; the app files ship through the normal ship flow (version bump).
- New UAT modules use numbers 560 to 566 to keep clear of Plans A and B.
- **Founder-only** steps are marked **[FOUNDER]**. The business address is the last step before launch.

## Review Focus

1. **`/api/pricing` fails or is slow.** The pricing page and homepage still show the USD fallback ($89 a year, $9.99 a month, no launch panel) and Get Pro still works. Test in Task 5.
2. **The launch window ends while the page is open, or a cached response still says `active`.** The panel, hero price, launch row and homepage banner go at `endsAt` with no reload. Tests in Task 1 and Task 5.
3. **Billing status fails for a signed-in visitor.** Buy UI shows; if checkout then answers `409 already_pro`, the "You're Pro" card replaces it. Test in Task 6.
4. **Get Pro pressed twice, or the page reloaded with `?buy=`.** Exactly one checkout request, the button locked while it runs, and `buy` stripped from the URL before redirecting so Back from Stripe doesn't start a second checkout. Test in Task 6.
5. **Junk intent values** (`?buy=lifetime&currency=jpy`). Ignored: Yearly and the visitor's country currency; never a checkout with an invalid plan. Tests in Task 6 (`parseIntent`) and Task 1.

---

**Launch timing (shared by Plans A and C):** two moments. `LAUNCH_STARTS_AT` (Plan A env) = when the one launch email is sent; from then the coupon applies and `/api/pricing` reports `launch.active`, so the email's `?buy=` link gets $69. `window.CERTANVIL_SALES_OPEN_AT` (Plan C) = 48 hours later, when the public site switches to Get Pro and shows the launch panel. `LAUNCH_ENDS_AT` = the stated end, 30 days after the public switch; the coupon's redeem-by and Apple's intro-offer end date match it.

### Task 1: Shared pricing client and launch switch

**Files:**
- Create: `landing/lib/pricing-client.js`, `landing/lib/launch-config.js`
- Create: `docs/superpowers/plans/2026-11-01-payments-contract.md` (verbatim copy of the scratchpad contract)
- Test: `tests/uat/560-pricing-client.js`

**Interfaces:**
- Consumes: Plan A `GET /api/pricing`.
- Produces: `window.CERTANVIL_SALES_OPEN_AT: string|null` (ISO; `null` = public sales not open). `window.certanvilPricing = { FALLBACK, fetchPricing(currency?) → Promise<Pricing>, launchLive(p, nowMs) → boolean, money(p, amount) → string, savePercent(p) → number, formatLaunchEnd(iso) → string, formatDate(iso) → string, isSalesOpen(nowMs) → boolean, fill(root, p, nowMs) → void, onLaunchEnd(p, nowMs, cb) → void }`. `Pricing` is Plan A's shape; `fetchPricing` never rejects and returns `FALLBACK` (with `_fallback: true`) on any failure or a 4 s timeout.

- [ ] **Step 1: Copy the contract into the repo** (`docs/superpowers/plans/2026-11-01-payments-contract.md`).

- [ ] **Step 2: Write the failing UAT module** (load both scripts into `vm` with a fake `window`, following `tests/uat/508-native-shell.js`):

```js
// 560: pricing client
test('FALLBACK is USD 9.99 / 89 / 7.42 with the launch off', eq(P.FALLBACK.currency,'usd') && P.FALLBACK.monthly==='9.99' && P.FALLBACK.yearly==='89' && P.FALLBACK.yearlyPerMonth==='7.42' && P.FALLBACK.launch.active===false);
test('launchLive needs active AND endsAt in the future (Review Focus 2)',
  P.launchLive(live, Date.parse('2026-11-20T10:00:00Z')) === true
  && P.launchLive(live, Date.parse('2026-12-02T00:00:00Z')) === false
  && P.launchLive({ ...live, launch: { ...live.launch, active: false } }, Date.parse('2026-11-20T10:00:00Z')) === false);
test('formatLaunchEnd: UK time, winter and summer',
  P.formatLaunchEnd('2026-12-01T23:59:00Z') === 'Ends 23:59 UK time, 1 Dec'
  && P.formatLaunchEnd('2027-06-30T22:59:00Z') === 'Ends 23:59 UK time, 30 Jun');
test('formatDate', P.formatDate('2027-03-14T00:00:00Z') === '14 Mar 2027');
test('savePercent rounds: USD 26, GBP 27', P.savePercent(USD) === 26 && P.savePercent(GBP) === 27);
test('money uses the symbol', P.money(GBP, '79') === '£79');
test('isSalesOpen: null never, past yes, future no', ...);
test('fill writes [data-price] and shows [data-launch-only] only while live', ...);   // fake elements with textContent/hidden
test('fetchPricing passes ?currency= only for usd|gbp|eur (Review Focus 5) and falls back on a 500', ...);
```

- [ ] **Step 3: Run it to verify it fails** — `node tests/uat.js --only 560` → FAIL (files missing).

- [ ] **Step 4: Implement `landing/lib/launch-config.js`**: one line, `window.CERTANVIL_SALES_OPEN_AT = null;` with a comment saying the founder sets it (Task 17) and that `?buy=` links work before it (the launch email's early access).

- [ ] **Step 5: Implement `landing/lib/pricing-client.js`** with the signatures above. `formatLaunchEnd` and `formatDate` use `Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', ... })`. `fill(root, p, now)` sets `[data-price="monthly|yearly|yearlyPerMonth|firstYear"]` text to `money(p, p[key] or p.launch.firstYear)`, sets `[data-launch-ends]` to `formatLaunchEnd`, toggles `hidden` on `[data-launch-only]` (shown only when `launchLive && isSalesOpen`) and `[data-no-launch]` (the inverse). `onLaunchEnd(p, now, cb)` sets one `setTimeout(cb, endsAt - now)` when the end is within 24 hours.

- [ ] **Step 6: Run the test** — `node tests/uat.js --only 560` → all PASS.

- [ ] **Step 7: Commit** — `git add landing/lib/pricing-client.js landing/lib/launch-config.js tests/uat/560-pricing-client.js docs/superpowers/plans/2026-11-01-payments-contract.md && git commit -m "feat(landing): shared pricing client and launch switch"`

---

### Task 2: Vercel Web Analytics and the event helper

**Files:**
- Create: `landing/lib/track.js`
- Modify: every `landing/**/*.html` (add two script tags before `</head>`)
- Test: `tests/uat/561-landing-analytics.js`

**Interfaces:**
- Produces: `window.certanvilTrack(name: string, data?: Record<string, string|number|boolean>) → void`. Events used by later tasks: `diagnostic_finished {cert}`, `checkout_started {plan, currency, source}`, `checkout_cancelled {}`, `checkout_paid {plan, from}`.

- [ ] **Step 1: Write the failing UAT module**: every HTML file under `landing/` (walk the tree, skip none) contains `<script defer src="/_vercel/insights/script.js"></script>` and a `track.js` script tag; loading `track.js` in `vm` then calling `certanvilTrack('checkout_started', { plan: 'yearly' })` pushes `['event', { name: 'checkout_started', data: { plan: 'yearly' } }]` onto `window.vaq`; a throwing `window.va` never throws out of `certanvilTrack`.
- [ ] **Step 2: Run** `node tests/uat.js --only 561` → FAIL.
- [ ] **Step 3: Implement `track.js`**: the Vercel queue shim `window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };` then `certanvilTrack` wrapped in try/catch. Add both tags to every landing page (relative path for `track.js` matching each page's depth, e.g. `../../lib/track.js` in `diagnostic/<cert>/`).
- [ ] **Step 4: Run** `node tests/uat.js --only 561` → PASS; `npx playwright test --project=landing` still green (the insights script 404s locally, which is harmless).
- [ ] **Step 5: Commit** — `feat(landing): Vercel Web Analytics and checkout event helper`.
- [ ] **Step 6 [FOUNDER]:** Vercel → certanvil-landing → Analytics → Enable Web Analytics. Custom events need the Vercel Pro plan: if the project is on Hobby, say so in chat; page views still work and the plan continues.

---

### Task 3: The `data-web-purchase` marker, native-hide everywhere, and the landing bounce to the app

**Files:**
- Modify: `landing/styles.css` (append the rule), `landing/native-hide.js`
- Modify: `landing/404.html` and every `landing/diagnostic/**/*.html` (load native-hide in `<head>`, before stylesheets, as `pricing.html:13` does)
- Test: `tests/uat/562-native-marker.js`

**Interfaces:**
- Produces: the marker convention; `window.__certanvilNativeReturnUrl(referrer: string) → string` (exposed for tests). In the app, `/pricing` and `/manage-subscription` (with or without `.html`) `location.replace` to that URL.

- [ ] **Step 1: Write the failing UAT module**:

```js
test('styles.css carries the one marker rule', /html\.is-native \[data-web-purchase\]\{display:none!important;?\}/.test(read('landing/styles.css').replace(/\s+/g,'')));
test('every landing HTML page loads native-hide.js in <head>', allLandingHtml.every(h => /<script src="(\.\.\/)*native-hide\.js"><\/script>/.test(head(h))));
test('return to the cert app the visitor came from', R('https://securityplus.certanvil.com/?cert=secplus#x') === 'https://securityplus.certanvil.com/?cert=secplus&paywall=open');
test('apex, www, foreign or empty referrer → Network+', ['https://certanvil.com/', 'https://www.certanvil.com/', 'https://evil.example/', ''].every(r => R(r) === 'https://networkplus.certanvil.com/?paywall=open'));
test('native on /pricing replaces location; website never does', ...);   // vm with fake location/navigator, UA with and without CertAnvilApp
```

- [ ] **Step 2: Run** `node tests/uat.js --only 562` → FAIL.
- [ ] **Step 3: Append the rule to `landing/styles.css`** (styles.css is loaded by every landing page except 404, which has no purchase elements).
- [ ] **Step 4: Extend `landing/native-hide.js`**: after setting `is-native`, if the path matches `^/(pricing|manage-subscription)(\.html)?/?$`, `location.replace(nativeReturnUrl(document.referrer))`. `nativeReturnUrl` accepts only `https://<sub>.certanvil.com` where `<sub>` is not `www`, keeps its path and query, drops the hash, sets `paywall=open`. Update the header comment (Stage 6 replaces "until in-app purchase lands").
- [ ] **Step 5: Add the native-hide tag to 404 and all diagnostic pages.**
- [ ] **Step 6: Run** `node tests/uat.js --only 508,562` → PASS (508 must stay green).
- [ ] **Step 7: Commit** — `feat(landing): data-web-purchase marker, native-hide on every page, bounce app to its paywall`.

---

### Task 4: Sign-in modal for a purchase

**Files:**
- Modify: `landing/auth.js` (`openAuthModal` ~171, `closeAuthModal` ~197, `returnUrlSharesApexCookie` ~381, cert catalog ~485)
- Test: `tests/e2e/landing-code-signin.spec.js` (append)

**Interfaces:**
- Produces: `window.certanvilAuth.open({ pill: string, title: string, sub: string, foot: string, returnUrl: string }) → void` (opens the existing modal with that copy; sets the pending return URL so both the code flow and the Apple/Google round trip come back to it). `window.certanvilCertAppUrl(certId?: string) → string` (the catalog's `href` for that cert, Network+ when unknown). `returnUrlSharesApexCookie` also accepts a URL on `location.origin`.

- [ ] **Step 1: Write the failing tests** (in the existing file, using its `boot` with a page that has no `action=signin`):

```js
test('certanvilAuth.open shows the purchase copy and restores the default on close', async ({ page }) => {
  // open({ pill:'Pro · Yearly · $69 first year', title:'Sign in to get Pro', sub:"Pro belongs to your account, so it works on every device you sign in on. We'll keep the plan you picked.", foot:'Next: secure checkout by Stripe, where you confirm Pro starts straight away', returnUrl: origin + '/pricing?buy=yearly' })
  await expect(page.locator('#auth-modal-title')).toHaveText('Sign in to get Pro');
  await expect(page.locator('#auth-modal .auth-plan-pill')).toHaveText('Pro · Yearly · $69 first year');
  // close → title back to 'Sign in to CertAnvil', pill gone
});
test('a code sign-in from certanvilAuth.open returns to the same-origin returnUrl', ...);   // waitForURL(/\/pricing\?buy=yearly/)
test('certanvilCertAppUrl', ...);   // 'secplus' → the catalog href; undefined/'nope' → 'https://networkplus.certanvil.com/?cert=netplus'
```

- [ ] **Step 2: Run** `npx playwright test tests/e2e/landing-code-signin.spec.js --project=landing` → new tests FAIL.
- [ ] **Step 3: Implement.** The pill is a `<span class="auth-plan-pill">` inserted before the title; the foot replaces `.auth-foot` text only while open for a purchase (keep the Terms/Privacy links, append the line). Do not change the providers.
- [ ] **Step 4: Run the whole file** → PASS (all Stage 5b/5c tests unchanged).
- [ ] **Step 5: Commit** — `feat(landing): purchase variant of the sign-in modal`.

---

### Task 5: Pricing page rebuild (display)

**Files:**
- Modify: `landing/pricing.html` (replace `<style id="pp-styles">` at ~269 and sections `#pricing-v2`, `#pricing-v2b`, the footer and the inline billing-toggle script at ~705; keep the topbar, auth modal, notify modal, toast stack and script order; add `lib/launch-config.js`, `lib/pricing-client.js`, `pricing.js` after `script.js`)
- Create: `landing/pricing.css` (the mockup's §A CSS, lines 177–273 of `mockups/payments-concept.html`, scoped under `#pricing-v3`, plus its button, ticks and FAQ rules and the light/dark tokens the landing already defines)
- Create: `landing/pricing.js`
- Test: `tests/e2e/landing-pricing.spec.js`

**Interfaces:**
- Consumes: Task 1 `certanvilPricing`, Task 3 marker.
- Produces: `window.certanvilPricingPage = { state, parseIntent(search) → { plan:'yearly'|'monthly', currency:'usd'|'gbp'|'eur'|null, buy:boolean, from:string|null, cancelled:boolean, source:string|null }, planCopy(p, launch) → { yearly:{ badge, priceHtml, sub }, monthly:{ priceHtml } }, heroCopy(p, launch) → string, renewCopy(p, plan, launch) → string, render() }`. Hooks: `#pr-hero-price`, `#pr-launch`, `#pr-buy` (Pro card), `#pr-plans [data-plan]`, `#pr-cur [data-cur]`, `#pr-get`, `#pr-waitlist`, `#pr-renew`, `#pr-trust`, `#pr-error`, `#pr-owned`, `#pr-notice`, `#pr-free-cta`, `#pr-faq`.

**Exact copy** (lift from the drawing; `$` means the visitor's symbol, figures from `/api/pricing`):
- Eyebrow "Pricing"; h1 "Free until it's working.<br>Then " + (launch ? "$69 for your first year" : "$89 a year") + "."; sub "Free is the trial: 15 questions a day on one cert, no card, no end date. Pro lifts every limit."
- Launch panel (`data-web-purchase`, launch only): eyebrow "Launch offer", figure `<s>$89</s>$69`, "for your first year, then $89.", "Ends 23:59 UK time, 1 Dec" (from `formatLaunchEnd`).
- Pro card (`data-web-purchase`): tier "Pro" + currency switch ($ £ € with aria-labels "US dollars", "British pounds", "Euros"); tag "Unlimited questions, every cert."; plan rows (Yearly first, picked): launch → badge "Launch offer", `<s>$89</s>$69 <small>first year</small>`, sub "Then $89 a year"; no launch → badge "Save 26%" (from `savePercent`), "$89 <small>a year</small>", sub "$7.42 a month"; Monthly → "$9.99 <small>a month</small>". Ticks: "Unlimited questions in every cert, including new ones" · "The Exam Simulator, with 90 timed questions and PBQs" · "Sim Lab, Decision Lab and Marathon in full" · "Drill Mistakes and Why-Not, to fix what you got wrong". Button "Get Pro". Renew line: Yearly+launch "You pay $69 today. Renews automatically at $89 a year until you cancel."; Yearly "Renews automatically at $89 a year until you cancel."; Monthly "Renews automatically at $9.99 a month until you cancel." Trust: "Prices include tax" · "Card, Apple Pay, Google Pay" · "Secure checkout by Stripe" · "Cancel anytime".
- Free card: "Free", "$0 <small>for good</small>", "Build the habit first. No card.", ticks "15 questions and 5 review cards a day" · "One cert of your choice" · "One Reword Gauntlet run a day" · "Baseline Diagnostic and your Pass Plan", button "Start free" → `/diagnostic`.
- Anchor: "One CompTIA exam voucher costs more than <b>a year of Pro</b>. Failing once means buying it twice."
- FAQ, heading "Before you pay", first item open, these seven in order, verbatim from the drawing's `faq()` with the Yearly price live: "What happens after the first year?" / "If I cancel, do I keep my progress?" / "Can I get a refund?" ("Pro starts the moment you pay, so there are no automatic refunds. If something went wrong, email support@certanvil.com and we'll look at it. If you bought in the iPhone app, refunds go through Apple at reportaproblem.apple.com.") / "I bought Pro on my iPhone. Does it work on the web?" / "Does Pro cover every cert, including new ones?" / "I only need it until my exam. Which plan?" / "Why do I see £ or €, and is tax included?".
- Footer: Pricing · Terms · Privacy · "Contact · support@certanvil.com" (mailto), "© 2026 CertAnvil", and the address slot `<p class="foot-address" data-business-address hidden></p>`. No Refunds link (founder removed refunds as a promise; the policy lives in Terms §5).
- Removed: the Team line (and its simi@ mailto), "Built by someone who sat N10-009…", "14-day money-back", the Annual/Monthly toggle.
- Before public sales (`!isSalesOpen && !intent.buy`): `#pr-get`, `#pr-renew`, `#pr-trust` and the launch panel are hidden and `#pr-waitlist` ("Pro launches soon · get notified", `data-action="pro-signup"`, `data-web-purchase`) shows instead.

- [ ] **Step 1: Write the failing e2e spec.** One `boot(page, { pricing, billing, checkout, fake, salesOpen, clock })` helper routes `**/lib/supabase.js*` (fake Supabase, signed out by default), `**/lib/launch-config.js*` (`window.CERTANVIL_SALES_OPEN_AT='2026-01-01T00:00:00Z'` unless `salesOpen:false`), `**/api/pricing*` (records the query), `**/api/billing/status`, `**/api/stripe/create-checkout-session` and `https://checkout.stripe.com/**`; installs `page.clock` at `2026-11-20T10:00:00Z`. Fixtures: `USD`, `GBP`, `EUR` as Plan A's shape, `live(p)` sets `launch.active=true, endsAt:'2026-12-01T23:59:00Z'`.

```js
test('Yearly is picked first; USD prices; no launch panel when the window is off', ...)   // #pr-plans [data-plan=yearly][aria-checked=true], text '$89 a year', '$7.42 a month', 'Save 26%', '$9.99 a month'; #pr-launch hidden
test('launch live: panel, struck $89, hero, renew line', ...)   // '$69 for your first year', 'Ends 23:59 UK time, 1 Dec', 'You pay $69 today. Renews automatically at $89 a year until you cancel.'
test('GBP from the country: £79, £6.58, Save 27%, £8.99', ...)
test('the switcher refetches with ?currency=eur and every price follows, FAQ included', ...)
test('Monthly row: renew line reads $9.99 a month', ...)
test('the FAQ has the seven questions in order, refund answer verbatim, no "money-back" on the page', ...)
test('before sales open: waitlist button, no Get Pro, no launch panel even if live', ...)
test('/api/pricing 500 → USD fallback and Get Pro still enabled (Review Focus 1)', ...)
test('endsAt passed but active:true → no launch copy anywhere (Review Focus 2)', ...)
test('the panel leaves at endsAt without a reload (Review Focus 2)', async ({ page }) => { /* clock at 23:58:58 on 1 Dec */ await page.clock.runFor(3000); await expect(page.locator('#pr-launch')).toBeHidden(); await expect(page.locator('#pr-hero-price')).toHaveText('$89 a year'); })
test('footer: Terms, Privacy, Contact support@; no hello@/simi@ on the page', ...)
test('phone 390px: no horizontal scroll; Pro card above Free', ...)
```

- [ ] **Step 2: Run** `npx playwright test tests/e2e/landing-pricing.spec.js --project=landing` → FAIL.
- [ ] **Step 3: Write the markup** in `pricing.html` with the hooks and copy above (static defaults are the USD, no-launch, sales-closed values so the page reads correctly with JS off). Plan rows are `role="radio"` buttons in a `role="radiogroup"`; currency switch the same. Update `<meta name="description">`, og/twitter description and title to drop "14-day money-back" and "/yr" (Task 14 swaps the image).
- [ ] **Step 4: Write `pricing.css`.** Lift the mockup CSS; the mockup uses `@container` queries on its frames, so convert them to `@media (max-width: 760px)` / `(max-width: 420px)` / `(max-width: 620px)`. Bump the stylesheet link with `?v=1`.
- [ ] **Step 5: Write `pricing.js` (display half):** `parseIntent`, `planCopy`, `heroCopy`, `renewCopy`, and `render()` driven by `state = { plan, pricing, salesOpen, owned }`; wire plan and currency radios (arrow keys move within each group); call `certanvilPricing.onLaunchEnd(p, now, render)`.
- [ ] **Step 6: Run** the spec → PASS; also `npx playwright test tests/e2e/landing-code-signin.spec.js --project=landing` (it boots `pricing.html`).
- [ ] **Step 7: Commit** — `feat(landing): rebuilt pricing page (Yearly first, local currency, launch panel, FAQ)`.

---

### Task 6: Pricing page purchase flow and already-Pro states

**Files:**
- Modify: `landing/pricing.js`, `landing/pricing.html` (owned card markup), `landing/lib/account.js` (one `checkout_paid` call in Plan A's confirmation)
- Test: `tests/e2e/landing-pricing.spec.js` (append), `tests/e2e/landing-account-paid.spec.js`

**Interfaces:**
- Consumes: Task 4 `certanvilAuth.open`, `certanvilCertAppUrl`; Task 2 `certanvilTrack`; Plan A checkout and billing status.
- Produces: `startCheckout(plan, currency, from) → Promise<void>` (internal); `ownedCopy(status) → { pill, line, apple }` on `certanvilPricingPage`. The intent URL is `/pricing?buy=<yearly|monthly>[&currency=<usd|gbp|eur>][&from=<certId>][&src=<source>]`; Task 7 and Task 13 link to it.

Flow: Get Pro → signed out: `certanvilAuth.open({ pill, title:'Sign in to get Pro', sub, foot, returnUrl: origin + '/pricing?buy=<plan>&currency=<cur>' + from/src })` with pill "Pro · Yearly · $69 first year" / "Pro · Yearly · $89 a year" / "Pro · Monthly · $9.99 a month" → signed in (page load with `buy`): `history.replaceState` drops `buy`, then billing status; owned → owned card; else POST checkout `{ plan, currency, from, returnTo: origin + '/pricing' }` with the Bearer token → `certanvilTrack('checkout_started', { plan, currency, source })` → `location.assign(url)`. `?checkout=cancelled` → `#pr-notice` "Checkout cancelled. No charge was made.", `checkout_cancelled`, param stripped. Errors (non-409, network) → `#pr-error` "Checkout didn't open. Try again in a minute." and the button unlocks.

Owned card (replaces `#pr-buy` and hides `#pr-free-cta`, `#pr-launch`): pill "Active" or "Billed by Apple"; h2 "You're Pro"; line: apple → "<Plan>, billed by Apple through your Apple ID. Changes and cancellation happen in Apple."; stripe active or grace → "<Plan> · renews <formatDate(renewsAt)>. Everything on this page is already yours."; stripe cancelled → "<Plan> · Pro until <formatDate(endsAt)>. Everything on this page is already yours."; admin → "Everything on this page is already yours."; ticks "Unlimited questions in every cert" · "Exam Simulator, Marathon and full Sim Lab" · "Drill Mistakes and Why-Not"; actions "Start studying" (`certanvilCertAppUrl(profile.active_cert)` with `pro=1`) and "Billing" → `/manage-subscription`, or for Apple "Manage in Apple" → `https://apps.apple.com/account/subscriptions`. The owned card carries no price, so it needs no marker.

- [ ] **Step 1: Write the failing tests:**

```js
test('signed out: Get Pro opens sign-in with the plan pill and the Stripe line', ...)
test('code sign-in returns with ?buy and goes straight to Stripe with plan, currency and returnTo', async ({ page }) => { /* expect checkout body {plan:'yearly',currency:'gbp',returnTo:'http://localhost:3132/pricing'} and Bearer header; waitForURL(/checkout\.stripe\.com/) */ })
test('Monthly and EUR survive the sign-in round trip', ...)
test('signed in, not Pro: one press, one request, button locked (Review Focus 4)', ...)   // dblclick → exactly 1 request
test('?buy is stripped before redirecting (Review Focus 4)', ...)   // the history entry left behind has no buy=
test('junk intent → Yearly and country currency, never plan=lifetime (Review Focus 5)', ...)
test('billing pro/stripe/active → You\'re Pro, renews 14 Mar 2027, Billing link, no buy buttons, no Start free', ...)
test('billing pro/apple → Billed by Apple, Manage in Apple link', ...)
test('billing pro/stripe/cancelled → Pro until …', ...)
test('billing 500 then checkout 409 already_pro → owned card (Review Focus 3)', ...)
test('checkout 503 → error line, button unlocks', ...)
test('?checkout=cancelled → notice, event queued, param gone', ...)
test('checkout_started is queued with plan, currency and source=diagnostic from &src=', ...)
// landing-account-paid.spec.js
test('/account?checkout=success&from=netplus queues checkout_paid {plan, from} once when it reaches You\'re Pro', ...)
```

- [ ] **Step 2: Run** both specs → new tests FAIL.
- [ ] **Step 3: Implement the flow and owned card in `pricing.js`/`pricing.html`.** Read `profiles.active_cert` through `window.certanvilSupabase` for Start studying.
- [ ] **Step 4: Add the paid event to Plan A's `/account` confirmation:** find where `landing/lib/account.js` switches the `?checkout=success` page to "You're Pro" and call `certanvilTrack('checkout_paid', { plan, from })` once there (guard with a module flag).
- [ ] **Step 5: Run** `npx playwright test tests/e2e/landing-pricing.spec.js tests/e2e/landing-account-paid.spec.js --project=landing` → PASS.
- [ ] **Step 6: Commit** — `feat(landing): pricing checkout through sign-in, already-Pro card, checkout events`.

---

### Task 7: Diagnostic results: Go Pro second button

**Files:**
- Modify: `landing/diagnostic/results-core.js` (CTA block ~395–433, the subscribe stub ~436–446, `openStub`/wiring ~557–576), `landing/diagnostic/results-config.js` (add `appCertId` per cert), every `landing/diagnostic/*/results.html` (load `../../lib/launch-config.js`, `../../lib/pricing-client.js`)
- Test: `tests/e2e/landing-diagnostic-gopro.spec.js`

**Interfaces:**
- Consumes: Task 1 `isSalesOpen`, Task 2 `certanvilTrack`, Task 6 intent URL.
- Produces: `appCertId` on each `CERT_RESULTS_CONFIG` entry: network-plus→`netplus`, azure-fundamentals→`az900`, azure-ai-fundamentals→`ai900`, aplus-core1→`aplus-core1`, aplus-core2→`aplus-core2`, sc900→`sc900`, clfc02→`clfc02`.

Copy: the primary button stays "Save your results &amp; keep practising free". The second button (`#dr-cta-subscribe`, `data-web-purchase`) title is "Go Pro · close the gap to <passThreshold>" when the score is below the pass mark and "Go Pro" when at or above it; no sub line, no price, no "money-back". Its target: sales open → `/pricing?buy=yearly&from=<appCertId>&src=diagnostic`; before → `/pricing`. The `#dr-stub-subscribe` panel and its "add your email below" text are deleted, and `openStub` no longer knows `subscribe`. Results render queues `diagnostic_finished { cert: appCertId }` once.

- [ ] **Step 1: Write the failing spec** (serve a results page with a seeded results payload the way the page reads it; read `results.html` for the key):

```js
test('below pass: "Go Pro · close the gap to 720" links to the buy intent with from=netplus&src=diagnostic', ...)
test('at or above pass: plain "Go Pro"', ...)
test('before sales open the button links to /pricing', ...)
test('no "add your email below", no "money-back", no #dr-stub-subscribe', ...)
test('diagnostic_finished queued once with cert netplus', ...)
test('in the app (CertAnvilApp UA) the Go Pro button is hidden and the free button is not', ...)
```

- [ ] **Step 2: Run** `npx playwright test tests/e2e/landing-diagnostic-gopro.spec.js --project=landing` → FAIL.
- [ ] **Step 3: Implement** in `results-core.js` / `results-config.js` / the results pages.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(diagnostic): Go Pro second button through the same checkout journey`.

---

### Task 8: Homepage copy, live prices, launch banner, footer

**Files:**
- Modify: `landing/index.html` (lines ~2351–2352, ~3096, ~3132, ~3168, ~3201, ~3223, ~3256, ~3444–3446, the topbar end at ~338, scripts at ~3749)
- Test: `tests/e2e/landing-home-pricing.spec.js`

**Interfaces:**
- Consumes: Task 1 `fetchPricing`, `fill`, `onLaunchEnd`.

Changes (exact copy):
- 2351: add `data-web-purchase` to the "See Pro plans →" link; 2352 note becomes "Both drills are Pro, and run on every cert in the library. Start free with the baseline diagnostic." (drop "Pro drills unlock at launch").
- 3132 row (`fqx-cmp-row` "What you pay for"): `data-web-purchase` on the row; cell "<span data-price="yearly">$89</span> a year, every cert we cover".
- 3168: "Two tiers. Free stays free, with no card. Pro is unlimited questions in every cert."
- 3201 (`data-web-purchase`): "Pro is <span data-price="monthly">$9.99</span> a month or <span data-price="yearly">$89</span> a year and covers every cert in the lineup, not just one."
- 3223: delete the sentence "If Pro isn't right for you, there's a 14-day money-back guarantee."
- 3256: "Yes. On the web, open Billing from your account: we ask one quick question, then you confirm. Monthly plans stop at the end of the current month; yearly plans stop renewing and you keep Pro for the rest of the year you paid for. If you bought in the iPhone app, cancel in your Apple ID settings."
- 3096 and 3446: `hello@` → `support@certanvil.com`.
- Footer nav: add "Pricing" (`/pricing`, `data-web-purchase`) before Privacy; add the address slot `<p class="fzx-address" data-business-address hidden></p>` in `.fzx-base`.
- Banner, inserted right after `</header>` of `#site-topbar`: `<div class="launch-strip" data-web-purchase data-launch-only hidden>Launch offer: <span data-price="firstYear">$69</span> for your first year, then <span data-price="yearly">$89</span>. <span data-launch-ends>Ends 23:59 UK time, 1 Dec</span>. <a href="/pricing">See Pro</a></div>`, styled as one quiet line (surface tint, 14px, no motion).
- Load `lib/launch-config.js` and `lib/pricing-client.js` after `script.js`, then one inline call: fetch pricing, `fill(document, p, Date.now())`, `onLaunchEnd` re-fills.

- [ ] **Step 1: Write the failing spec**: GBP pricing → both FAQ price spots read £8.99 / £79; launch live + sales open → banner reads "Launch offer: £59 for your first year, then £79. Ends 23:59 UK time, 1 Dec."; sales closed → no banner; `/api/pricing` 500 → "$89" stays; page text has no "No annual nonsense", no "are you sure", no "money-back", no `hello@`; footer has Pricing.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/landing-home-pricing.spec.js --project=landing` → FAIL.
- [ ] **Step 3: Make the edits.**
- [ ] **Step 4: Run** → PASS, plus `npx playwright test --project=landing` (homepage sign-in tests).
- [ ] **Step 5: Commit** — `feat(landing): homepage prices from one source, launch banner, copy fixes`.

---

### Task 9: In the app, pricing and billing route to the native paywall

**Files:**
- Create: `features/web-purchase-route.js`
- Modify: `index.html` (one `<script defer src="features/web-purchase-route.js"></script>` with the other features, ~2349), `dg-system.css` (append the marker rule after ~5502, bump `dg-system.css?v=` at `index.html:111-112`), `lib/onboarding-chrome.js:72-74`
- Test: `tests/uat/563-web-purchase-route.js`, `tests/e2e/web-purchase-route.spec.js` (chromium project)

**Interfaces:**
- Consumes: Plan A `window.openPaywall(trigger)`; the app's `html.is-native`.
- Produces: `window.routeWebPurchase(url: string) → boolean`: in the app only, when `url` is `certanvil.com` (apex or www) with path `/pricing*` or `/manage-subscription*`, it calls `window.openPaywall('feature:pro')` (if defined) and returns `true`; otherwise `false`. A capturing document click listener sends matching `a[href]` clicks through it; `window.open` is wrapped the same way; on `load`, `?paywall=open` is stripped with `history.replaceState` and the paywall opens once.

- [ ] **Step 1: Write the failing tests:**

```js
// 563 (vm with fake window/document/location)
test('website: routeWebPurchase is false and never opens a paywall', ...)
test('app: pricing, pricing.html, www, manage-subscription → true + openPaywall("feature:pro")', ...)
test('app: certanvil.com/terms and networkplus.certanvil.com/pricing-guide → false', ...)
test('app: window.open of pricing is swallowed; other URLs pass through', ...)
test('dg-system.css carries the marker rule and index.html bumped dg-system.css?v=', ...)
// e2e, NATIVE_UA from lift-5a.spec.js, openPaywall captured with an addInitScript property trap
test('/?paywall=open in the app opens the paywall once and the param is gone', ...)
test('the onboarding go-pro action in the app opens the paywall, not certanvil.com/pricing', ...)
```

- [ ] **Step 2: Run** `node tests/uat.js --only 563` and `npx playwright test tests/e2e/web-purchase-route.spec.js --project=chromium` → FAIL.
- [ ] **Step 3: Implement the module, the CSS rule and version bump, and in `onboarding-chrome.js` put `if (window.routeWebPurchase && window.routeWebPurchase('https://certanvil.com/pricing')) { hide(); return; }` before the existing redirect.**
- [ ] **Step 4: Run** the two tests plus `node tests/uat.js --only 508` and the app ratchet (`node tests/uat.js` app.js line-count module) → PASS.
- [ ] **Step 5: Commit** — `feat(ios): pricing and billing links open the native paywall in the app`.

Note for Plan A's reviewer: `'feature:pro'` is the generic trigger; `openPaywall` must show its default headline for a feature name it does not know.

---

### Task 10: Terms rewrite

**Files:**
- Modify: `landing/terms.html` (header ~236–240, contents ~245–262, §01 ~267, §04 ~285–312, §05 ~314–324, §06 ~326–338, §14 ~410–417, §15 ~419–426, footer ~436–444)
- Test: `tests/uat/564-legal-pages.js`

**Interfaces:**
- Produces: the anchors `#subscriptions`, `#launch-offer`, `#apple`, `#refunds`, `#cancellation` (Plan B's paywall links to `/terms`; the FAQ and Billing page may deep-link these).

Exact clauses (plain English, no em dashes, $/£/€ always together):
- Header: "Last updated <merge date> · v1.2". Sub: drop "refund details", say "what happens if you cancel, refunds, and the legal framework at the bottom".
- §01: after "trading as CertAnvil" add ", <span data-business-address hidden></span>" (founder fills, Task 17).
- §04 TL;DR: "Free is $0 with 15 questions and 5 review cards a day. Pro is Monthly or Yearly, priced in your currency with tax included, and renews automatically until you cancel."
- 4.2 table header "Plan | Price | Renews": "Pro Monthly | $9.99 / £8.99 / €9.99 a month | Every month", "Pro Yearly | $89 / £79 / €89 a year | Every year".
- 4.3 Billing and auto-renewal: "Web purchases are processed by Stripe. Your subscription renews automatically at the end of each period until you cancel, and by subscribing you authorise us, through Stripe, to charge your payment method on each renewal date. Stripe handles all card data, so we never see it, and emails you a receipt for each charge. If a renewal payment fails, Stripe retries it several times over about two weeks. You keep Pro during that time and see a note asking you to update your card. If every retry fails, Pro ends and your account goes back to Free with your progress kept."
- 4.4 Launch offer (`id="launch-offer"`): "From time to time we may offer Yearly at a lower price for your first year (at launch: $69, £59 or €69). The offer covers one first year only. When that year ends, your subscription renews at the normal Yearly price unless you cancel first, and we email you before that renewal. The pricing page shows the date and time the offer ends, and it is not extended. In the iPhone app the offer is an App Store introductory offer, which Apple gives only to people new to CertAnvil Pro."
- 4.5 Price changes: keep the existing text.
- 4.6 Currency and tax: "Prices are shown in US dollars, pounds or euros based on your country, and you can switch currency on the pricing page. Prices include VAT or sales tax where it applies, so the price you see is the price you pay. Your bank may charge its own fee for a payment in another currency."
- 4.7 Purchases in the iPhone app (`id="apple"`): "If you buy Pro in the CertAnvil iPhone app, Apple bills you through your Apple ID under Apple's terms. Apple handles payment, renewal, cancellation and refunds for those purchases. To cancel, use your Apple ID subscription settings at least 24 hours before renewal. Pro belongs to your CertAnvil account wherever you bought it, so it works on the web too."
- 4.8 (`id="seller" data-managed-payments hidden`): "Web purchases are sold by Stripe as merchant of record. Stripe charges your payment method, collects tax and issues your receipt. For questions about a payment, tax or an invoice, use the link in your Stripe receipt." with an HTML comment: shown only when Stripe grants Managed Payments; replace with Stripe's required wording at that time.
- §05 Refunds: 5.1 "No automatic refunds": "Pro starts as soon as you pay, so there are no automatic refunds. If something went wrong, email support@certanvil.com from the email on your account and we'll look at it case by case." 5.2 "Your 14-day cancellation right": "If you're a consumer in the UK or EU, you normally have 14 days to cancel a contract for a digital service. At web checkout you ask for Pro to start straight away and confirm that you understand you lose that 14-day right. Your other statutory rights, for example if Pro is faulty or not as described, are not affected." 5.3 "iPhone purchases": "Refunds for purchases made in the iPhone app are handled by Apple at reportaproblem.apple.com. We can't issue them." 5.4 "If we refund": "If we refund a web payment in full, Pro ends straight away and the subscription is cancelled, so it won't renew."
- §06: 6.1 "Cancel on the web": "Open Billing from your account at certanvil.com and choose Cancel. We ask one optional question, then you confirm in Stripe's billing portal. Pro stays on until the end of the period you paid for. After that you're on Free and your progress is kept." 6.2 "Cancel in the iPhone app": "Cancel in your Apple ID subscription settings at least 24 hours before renewal." 6.3 "Delete account": keep the existing list, change its first item to "Cancel any subscription billed through Stripe, so there are no more charges." and add after the list: "Deleting your account does not cancel a subscription billed by Apple. Cancel it in your Apple ID settings, or Apple keeps charging you."
- §14: "This is v1.2." and add "v1.2 (<merge date>): Pro goes on sale: prices in your currency with tax included, the launch offer, iPhone purchases through Apple, no automatic refunds, and one contact address." Keep the earlier version lines.
- §15 Contact: one line "Support, billing, privacy and complaints · support@certanvil.com", "Response time · within 7 days for most enquiries", "Address · <span data-business-address hidden></span>". Footer Contact → `mailto:support@certanvil.com`, plus the footer address slot.

- [ ] **Step 1: Write the failing UAT module** (`564`, Terms half): TL;DR contains "15 questions and 5 review cards a day" and no "20-question"; §05 contains "no automatic refunds" and "lose that 14-day right" and "reportaproblem.apple.com"; no "14-day refund window", no "money-back"; anchors `launch-offer`, `apple`, `refunds`, `cancellation` exist; the seller block exists with `hidden`; at least three `data-business-address` slots; the only mailto is support@; no `—` in visible text.
- [ ] **Step 2: Run** `node tests/uat.js --only 564` → FAIL.
- [ ] **Step 3: Rewrite the sections.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `docs(legal): terms of sale, auto-renew, launch offer, Apple, no automatic refunds`.

---

### Task 11: Privacy, one contact everywhere, 15 questions everywhere

**Files:**
- Modify: `landing/privacy.html` (~239, ~320, ~362–371, ~420, ~447–460, footer ~477), every landing page with `hello@`, `simi@`, `billing@` or `privacy@` (homepage done in Task 8; diagnostic `intake.html`/`quiz.html`/`results.html` footers, `diagnostic/index.html:196`)
- Test: `tests/uat/564-legal-pages.js` (append)

Privacy changes: §04 table adds "Apple | If you buy Pro in the iPhone app, Apple takes the payment and tells us, through RevenueCat, that your subscription is active. We never receive your card or Apple ID details. | Global; apple.com/legal/privacy" and "RevenueCat | Records iPhone subscriptions and tells our server when one starts, renews or ends. Receives an anonymous app user ID linked to your CertAnvil account and the purchase details from Apple. | US; revenuecat.com/privacy"; the Vercel row adds "It also runs Vercel Web Analytics, which counts page visits and a few checkout steps without cookies."; the Hostinger row names `support@certanvil.com`; "20-questions-per-day" → "15 questions and 5 review cards a day"; every `privacy@` → `support@`; header "v1.3" and the §12 list gains "v1.3 (<merge date>): Pro goes on sale. Apple and RevenueCat join the list for iPhone purchases, and Vercel Web Analytics counts visits without cookies."

- [ ] **Step 1: Append failing UAT checks**: privacy names Apple and RevenueCat and "without cookies"; no file under `landing/` (html and js, excluding `lib/supabase-umd.min.js` and `lib/dompurify.min.js`) contains `hello@certanvil.com`, `simi@certanvil.com`, `billing@certanvil.com` or `privacy@certanvil.com`; no landing file contains "20-question-per-day", "20-questions-per-day" or "20 questions a day" (the diagnostic's own "20-question diagnostic" stays).
- [ ] **Step 2: Run** `node tests/uat.js --only 564` → FAIL.
- [ ] **Step 3: Edit privacy and sweep the contacts.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `docs(legal): privacy adds Apple, RevenueCat, cookieless analytics; one support address`.
- [ ] **Step 6 [FOUNDER]:** In the mail host, forward billing@, hello@ and privacy@ to support@certanvil.com.

---

### Task 12: Waitlist one-click unsubscribe

**Files:**
- Create: `supabase/migrations/20261101_waitlist_unsubscribe_launch.sql`, `landing/api/unsubscribe.js`
- Modify: `landing/api/notify.js` (`buildUserHtml`/`buildUserText` ~360–392, the Resend send ~180), `scripts/sql/migration-audit.sql`
- Test: `tests/waitlist-db.test.mjs`, `tests/api/unsubscribe.test.mjs`

**Interfaces:**
- Produces: columns `notify_signups.unsubscribe_token uuid not null default gen_random_uuid() unique` and `notify_signups.launch_emailed_at timestamptz` (Task 13). `GET /api/unsubscribe?t=<uuid>` → HTML page with one "Unsubscribe" button (POST); `POST /api/unsubscribe?t=<uuid>` (also RFC 8058 `List-Unsubscribe=One-Click`) deletes every `notify_signups` row with that token's email and answers a "You're unsubscribed" page. `unsubscribeUrl(token) → string` exported from `landing/api/unsubscribe.js`. `buildUserEmail(cert, unsubUrl|null) → { html, text }` in notify.js.

GET never deletes (mail scanners such as Safe Links open links on arrival); the one-click path is the mail app's own Unsubscribe button through the `List-Unsubscribe` and `List-Unsubscribe-Post` headers.

- [ ] **Step 1: Write the failing DB test** (PGlite, pattern of `tests/bug-reports-db.test.mjs`, base `20260509_notify_signups.sql`): existing rows get distinct tokens; a new insert gets one; `launch_emailed_at` defaults null; anon still cannot select; the `-- ROLLBACK:` line drops both columns and the file re-applies cleanly after it.
- [ ] **Step 2: Run** `node --experimental-detect-module tests/waitlist-db.test.mjs` → FAIL.
- [ ] **Step 3: Write the migration** (`alter table … add column if not exists …`; one `-- ROLLBACK: ALTER TABLE public.notify_signups DROP COLUMN IF EXISTS launch_emailed_at; ALTER TABLE public.notify_signups DROP COLUMN IF EXISTS unsubscribe_token;`) and two audit rows (`column unsubscribe_token`, `column launch_emailed_at`). Run the DB test → PASS.
- [ ] **Step 4: Write the failing endpoint test** (fetch stubbed, pattern of `tests/api/notify-cert-live.test.mjs`): missing `SUPABASE_SERVICE_ROLE_KEY` → 503; malformed token → 400 page, no Supabase call; GET → 200 page with a POST form and no DELETE; POST known token → looks up the email by token then DELETEs `notify_signups?email=eq.<email>` → 200 "You're unsubscribed"; POST unknown token → 200 same page (no leak); notify.js with the service key fetches the row's token after insert and its email contains the unsubscribe URL plus `headers: { 'List-Unsubscribe': '<…>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }`; without the key the email says "To leave this list, email support@certanvil.com." and never "replying".
- [ ] **Step 5: Run** `node --experimental-detect-module tests/api/unsubscribe.test.mjs` → FAIL.
- [ ] **Step 6: Implement `unsubscribe.js`** (Edge, `admin-mail.js` helpers, page copy "Unsubscribe from CertAnvil emails?" / button "Unsubscribe" / done "You're unsubscribed. You won't get any more emails from these lists.") **and the notify.js changes** (after a persisted insert, `GET notify_signups?email=eq.&cert=eq.&select=unsubscribe_token` with the service key; footer line "Unsubscribe in one click: <link>"; replace "the moment this cert launches" wording only where the cert is "CertAnvil Pro": "the moment Pro goes on sale").
- [ ] **Step 7: Run** both tests → PASS.
- [ ] **Step 8: Commit** — `feat(waitlist): one-click unsubscribe and launch stamp column`.

---

### Task 13: The launch email (one send, Pro waitlist only)

**Files:**
- Create: `landing/api/admin/send-pro-launch.js`
- Modify: `landing/admin.html` (a "Pro launch email" panel next to cert requests), `landing/lib/admin.js` (`startSend` ~372 takes the endpoint and body from the button: `data-endpoint`, `data-body`)
- Test: `tests/api/send-pro-launch.test.mjs`, `tests/e2e/landing-admin-launch.spec.js`

**Interfaces:**
- Consumes: Task 12 columns and `unsubscribeUrl`; `requireAdmin`, `sendMail`, `svcHeaders` from `api/_lib/admin-mail.js`; Plan A `/api/pricing` (fetched from the request's origin for usd, gbp and eur).
- Produces: `POST /api/admin/send-pro-launch` (admin Bearer) body `{ dry_run?: boolean, after?: uuid }`. Dry run → `{ remaining, launch: { active, endsAt } }`. Send → `{ sent, failed, skipped, remaining, next, paused }`, rows `cert = 'CertAnvil Pro' and launch_emailed_at is null` in id order, 20 per call, each person their own email, `launch_emailed_at` stamped per row after its send succeeds, Resend 429 → `paused: true`. `409 { error: 'launch_not_active' }` when `/api/pricing` says the launch is off. `buildLaunchEmail({ usd, gbp, eur }, endsAt, unsubUrl) → { subject, html, text, headers }`.

Email copy: subject "CertAnvil Pro is live, with a launch price for your first year". Body: "You asked to hear when CertAnvil Pro went on sale, so you're hearing first." / "Your first year is $69 (£59 in the UK, €69 in the euro area), then $89 a year (£79, €89). The offer ends at 23:59 UK time on 1 Dec." (figures and date from `/api/pricing` and `formatLaunchEnd` logic) / "Pro gives you:" + "Unlimited questions in every cert" · "The Exam Simulator and full labs" · "Drills that fix your mistakes" / button "Get Pro" → `https://certanvil.com/pricing?buy=yearly&utm_source=launch-email` / "Pro renews automatically until you cancel. Pro starts as soon as you pay." / footer "This is the one email we promised. Unsubscribe in one click: <link>". List-Unsubscribe headers as Task 12.

- [ ] **Step 1: Write the failing endpoint test**: 503 without env; 401/403 for non-admins; 409 when pricing says inactive; dry run counts only `CertAnvil Pro` rows with null stamp; a send emails each row once, stamps only successes, and a second full run sends nothing; 429 pauses without stamping; the email carries the three prices, "23:59 UK time on 1 Dec", the buy link with `utm_source=launch-email`, the unsubscribe link and headers, and no "money-back" or "refund".
- [ ] **Step 2: Run** `node --experimental-detect-module tests/api/send-pro-launch.test.mjs` → FAIL.
- [ ] **Step 3: Implement the endpoint** on the shape of `notify-cert-live.js`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Write the failing admin e2e**: an admin sees "Pro launch email · <n> people waiting · offer ends 23:59 UK time, 1 Dec" and a "Send launch email" button; Send asks inline "Email <n> people that Pro is on sale?"; confirming loops until `remaining` is 0 and reads "Sent to <n> people."; launch inactive → button disabled with "The launch offer isn't open yet."
- [ ] **Step 6: Implement the panel and generalise `startSend`**; run `npx playwright test tests/e2e/landing-admin-launch.spec.js --project=landing` and `tests/api/notify-cert-live.test.mjs` → PASS.
- [ ] **Step 7: Commit** — `feat(launch): one-send Pro launch email from the admin page`.

---

### Task 14: PNG share image and share text

**Files:**
- Create: `scripts/render-og-png.mjs`, `landing/og-image.png`
- Modify: every landing page with `og:image` / `twitter:image` (`index.html:31,41`, `pricing.html:28,38`, `diagnostic/index.html:22`, any others the test finds)
- Test: `tests/uat/565-og-image.js`

- [ ] **Step 1: Write the failing UAT module**: `landing/og-image.png` starts with the PNG signature and its IHDR reads 1200×630; every landing HTML page that declares `og:image` points at `https://certanvil.com/og-image.png` with `og:image:type` `image/png` and `twitter:image` the same; no landing meta text contains "money-back" or "/yr".
- [ ] **Step 2: Run** `node tests/uat.js --only 565` → FAIL.
- [ ] **Step 3: Write `render-og-png.mjs`** (Playwright Chromium, viewport 1200×630, load `landing/og-image.svg` from disk, screenshot to `landing/og-image.png`), run it with `node scripts/render-og-png.mjs`, open the PNG and check it matches the SVG.
- [ ] **Step 4: Update the meta tags.** Share text stays evergreen ("Pro is $9.99 a month or $89 a year, unlimited across every cert. Cancel anytime."): static meta cannot end on its own at the stated time, and crawlers cache it.
- [ ] **Step 5: Run** → PASS. **Commit** — `feat(landing): PNG share image`.

---

### Task 15: Nothing purchasable in the app, on any landing page

**Files:**
- Modify: whatever the sweep finds untagged (expected: `landing/lift-account.js:148-149`, Plan A's account Get Pro and Billing row, `landing/manage-subscription.html` prices)
- Test: `tests/e2e/landing-native.spec.js`

- [ ] **Step 1: Write the sweep spec** with the CertAnvil app UA (as `landing-code-signin.spec.js` does), signed out and signed in (free, and Pro via billing status), over `/`, `/diagnostic`, every `/diagnostic/<cert>/intake`, a seeded results page, `/account`, `/analytics`, `/404`: `document.body.innerText` must not match `/[$£€]\s?\d|Get Pro|Go Pro|money-back|refund|launch offer|get notified|See Pro/i`, and no visible `a[href*="pricing"]`, `a[href*="manage-subscription"]`, `a[href*="stripe"]`. Plus: `/pricing` and `/manage-subscription` in the app land on `https://networkplus.certanvil.com/?paywall=open` (route it). Terms and Privacy are excluded (legal text, no links to buy).
- [ ] **Step 2: Run** `npx playwright test tests/e2e/landing-native.spec.js --project=landing` → note each failure.
- [ ] **Step 3: Add `data-web-purchase` to each offending element** (whole row or card, never half a grid row).
- [ ] **Step 4: Run** → PASS, then the full landing project `npx playwright test --project=landing` → PASS.
- [ ] **Step 5: Commit** — `fix(ios): tag every remaining web price and buy element`.

---

### Task 16: Visual pass, launch check script, ship

**Files:**
- Create: `scripts/launch-check.mjs`
- Modify: files the visual pass changes

**Interfaces:**
- Produces: `node scripts/launch-check.mjs` prints one PASS/FAIL line per check and exits non-zero on any FAIL: `CERTANVIL_SALES_OPEN_AT` set and after the launch email; `https://certanvil.com/api/pricing?currency=usd|gbp|eur` return 9.99/89, 8.99/79, 9.99/89 with `launch.active` and `endsAt` matching the date announced; every `data-business-address` slot filled and not `hidden`; `og-image.png` served as `image/png`; `/terms` and `/privacy` show v1.2 and v1.3. Not part of CI.

- [ ] **Step 1: Run the 5-stage visual pass** (design-taste-frontend → emil-design-eng → transitions-dev → humanizer → marketing-psychology) over the pricing page (all states: buy, launch on/off, £/€, owned web/Apple, cancelled notice, pre-sales), the sign-in modal variant, the diagnostic button, the homepage banner, the unsubscribe pages and the launch email, at 390px and 1280px, light and dark, against `mockups/payments-concept.html` screens A and F. Approved mockup copy is fixed; humanizer may change only copy this plan wrote (banner, email, Terms, unsubscribe). Motion: BRAND.md §6 tokens win; never run transitions-polish.
- [ ] **Step 2: Write `launch-check.mjs`** and run it against prod now: the address and sales-open checks FAIL by design until Task 17.
- [ ] **Step 3: Full test run**: `node tests/uat.js`, `npx playwright test --project=chromium --project=landing`, the four new `node --experimental-detect-module` tests → all PASS.
- [ ] **Step 4: Ship with the ship skill**: PR on the gated lane (Task 12's migration on the Supabase branch DB), verify the pricing page on the preview or locally (`npx serve landing -l 3132`) with Plan A's endpoints, squash-merge. Landing deploys through `deploy-landing.yml`; the app files take the normal version bump. Merging before launch is safe: with `CERTANVIL_SALES_OPEN_AT = null` the pricing page shows the waitlist and no launch copy.
- [ ] **Step 5: Verify on prod**: `/pricing` shows the waitlist and live prices for your country; `/pricing?currency=eur` shows €; Terms v1.2 and Privacy v1.3 are live; the app (TestFlight) shows no price on the homepage and bounces `/pricing` to its paywall.

---

### Task 17: Launch runbook

**Files:**
- Modify: `landing/lib/launch-config.js`, `landing/terms.html`, `landing/pricing.html`, `landing/index.html` (address slots only)

- [ ] **Step 1 [FOUNDER]:** Stripe → Billing → Subscriptions and emails: turn on the email that reminds customers before a yearly renewal (the FAQ and Terms promise it) and confirm Smart Retries runs about two weeks (Terms §4.3 says so; if Stripe's setting differs, say so and the Terms number changes).
- [ ] **Step 2 [FOUNDER]:** Pick the moment public sales open (T) and the offer end (T + 30 days, 23:59 UK time). Set Plan A's launch window to open at T − 48 h (so the email's offer works) and end at T + 30 days; set the Stripe coupon's redeem-by and Apple's introductory offer dates to the same end.
- [ ] **Step 3:** Commit `window.CERTANVIL_SALES_OPEN_AT = '<T as ISO>'` and ship. The site flips itself at T: Get Pro, the launch panel, the homepage banner and the diagnostic Go Pro appear without another deploy.
- [ ] **Step 4 [FOUNDER]:** At T − 48 h, open certanvil.com/admin → Pro launch email → Send. Once only; the stamps make a second press send nothing.
- [ ] **Step 5 [FOUNDER]:** If Stripe has granted Managed Payments, paste Stripe's required seller wording into Terms §4.8 and remove its `hidden`.
- [ ] **Step 6 [FOUNDER], LAST step before launch:** Once the registered-address service is set up (next month), put the address into every `data-business-address` slot (Terms §01 and §15, the Terms, pricing and homepage footers) and remove `hidden`. Run `node scripts/launch-check.mjs` → all PASS. Ship.
- [ ] **Step 7 [FOUNDER]:** Reminder from CLAUDE.md: if launch coincides with the Apple submission or go-live, run the onboarding flip (`app_config.onboarding_enabled`) per `docs/mobile/APP_STORE_DISTRIBUTION.md` §GO-LIVE.
- [ ] **Step 8:** On day 30 after the stated time, check (no action expected): the panel and banner are gone, `/api/pricing` reports the launch off, a test checkout shows $89 with no coupon.
