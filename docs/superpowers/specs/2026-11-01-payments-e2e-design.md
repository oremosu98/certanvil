---
up: "[[Decisions MOC]]"
type: spec
status: draft (review fixes applied)
cert: all
updated: 2026-11-01
tags: [spec, mobile, design]
---
# Payments end to end: how people pay for Pro, on every surface

The founder agreed this design on 1 Nov 2026, after two specialist passes (product design and
marketing) over the app, the iOS app and the landing site. It covers what people pay, where they
meet the ask, how they pay on each surface, life after paying, and the gaps to close.
Supersedes the open questions in `PHASE-G-PLAN-2026-06-11.md`; its locked decisions still stand
unless this spec says otherwise.

## The problem
Nobody can pay. Every Go Pro button (app, iOS, landing, diagnostic) leads to a "Pro launches soon"
waitlist. The Stripe checkout, portal and webhook sit on an unmerged local branch
(`feat/g1-hardening-provider-subscriptions`) whose migration was never applied. The iOS app has no
in-app purchase and hides every upgrade link. The account site shows Pro only for admins, so a
paying customer would read "Free". Pricing copy promises a refund Apple controls, and the Terms
still say 20 free questions a day and USD at your bank's rate.

## Decisions (locked)
| # | Decision |
|---|---|
| D1 | Plans: **Free** and **Pro**. Pro is **Monthly** ($9.99 / £8.99 / €9.99) or **Yearly** ($89 / £79 / €89). Nothing else. The billed amount per period is always the most prominent price; "$7.42 a month" is a smaller secondary line under Yearly. These figures are the web prices and the target Apple tiers; the iPhone app always shows StoreKit's localized price, never a hardcoded figure. |
| D2 | **Yearly is the default** everywhere it can be chosen. |
| D3 | **No trial.** Free is the trial. |
| D4 | **Same price on iPhone and web**, in local currency, tax included. Apple's 15% (Small Business Program) is absorbed. |
| D5 | **Launch offer:** Yearly at **$69 / £59 / €69 for the first year**, then the normal price. A real 30-day window; Pro waitlist told 48 hours first; ends on its own; never extended. **Web:** one Stripe *amount-off* coupon, $20 / £20 / €20 (per-currency amounts), duration once, redeem-by the end time; the checkout endpoint attaches it automatically while the window is open (no code to type). **iPhone:** an Apple introductory offer (pay up front, one year) on Yearly at the matching tier, with Apple's start and end *dates*; Apple gives it only to people new to the subscription group, and prices it per storefront. The iPhone shows "Launch offer, first year" with StoreKit's price and "Ends [date]" (date only); the web shows the date and time. |
| D6 | **iPhone: Apple in-app purchase only, in every country**, through RevenueCat. No link or price that points to web purchase. |
| D7 | **Web: Stripe hosted Checkout** with card, Apple Pay, Google Pay and Link; prices tax-inclusive in the buyer's currency. Apply for **Stripe Managed Payments** (merchant of record); run on **Stripe Tax** until access is granted. |
| D8 | **An account comes first** on every surface. **Pro belongs to the account**: buy anywhere, Pro everywhere. |
| D9 | **No refund promise and no refund button anywhere** (founder, 1 Nov: it invites abuse). Refunds are the founder's call, case by case, by email to support. Web checkout records the buyer's consent to start Pro straight away and their acknowledgement that this ends the 14-day cancellation right (UK Consumer Contracts Regulations / EU equivalent), using Stripe Checkout's required terms consent plus custom text: "I want Pro to start now, and I understand I lose my 14-day right to cancel." iPhone refunds stay with Apple. |
| D10 | **One contact:** support@certanvil.com on every customer surface; billing@ forwards to it. |
| D11 | **Landing analytics:** Vercel Web Analytics (no cookie banner). |
| D12 | **Business address:** a registered-address service. Founder sets it up next month; it is the **last step before launch** and gates the Terms and footer. |

## Where people meet the ask
One paywall, the same on every surface (sheet on phones, centred dialog on desktop), with a headline
that matches the trigger.

| Moment | Treatment |
|---|---|
| 15th AI question of the day | **Hard stop.** Second button: "Come back tomorrow". |
| Second Gauntlet / PBQ / Decision Lab run in a day | **Hard stop, after the result screen**, never mid-run. |
| Opening a second cert | **Hard stop** naming that cert. |
| Tapping a Pro-only feature (Exam Simulator, Marathon, Drill Mistakes, Why-Not, Sim Lab full, Decision Lab exam) | **Preview, then "Unlock with Pro".** |
| 10 of 15 questions used; daily reviews finished; exam date set | **Gentle nudge** only: a line, never a modal. |

Paywall content: headline; Yearly (picked) and Monthly, each led by its billed amount ("$89 a year",
"$9.99 a month") with "$7.42 a month" as a smaller line under Yearly; during the launch window the
launch line (web: "$69 for your first year, then $89. Ends [date, time]" with $89 struck through;
iPhone: Apple's intro offer as described in D5); three things Pro unlocks (unlimited questions in
every cert, Exam Simulator and full labs, fixing your mistakes); an auto-renew line on every
surface ("Renews automatically at $89 a year until you cancel." On iPhone add "Cancel at least 24
hours before renewal in your Apple ID settings."); trust line "Cancel anytime", plus "Billed through your Apple ID" on
iPhone; iPhone only: "Restore purchases"
and links to Terms of Use and Privacy.

**Prices come from one place.** A single pricing endpoint on certanvil.com (`/api/pricing`) reads
the visitor's country (Vercel's country header) and returns currency, prices and the launch-offer
state. The landing site and the web app paywall on every cert subdomain both read it (CORS
allowlist for `*.certanvil.com`), so they can never drift. The checkout endpoint uses the same
source.

## How people pay
**iPhone app**
1. Paywall → if signed out, sign in (Apple, Google, email) with the chosen plan kept.
2. Before opening Apple's sheet, the app asks the server whether the account already has Pro (from
   any source); if it does, no sheet opens and it shows "You're already Pro". Then Apple's purchase
   sheet. The buy button locks while it is open.
3. "Confirming…" → **"You're Pro"** → "Back to studying". Ask to Buy: "Waiting for approval".
4. Settings: "Pro until 14 Mar", "Manage in Apple", "Restore purchases". Web-billed Pro reads
   "Pro · billed on certanvil.com" as plain text, never a link.

**Web app (mobile web and desktop)**
1. Paywall → if signed out, sign in with the plan kept.
2. Stripe Checkout, email filled and locked, launch offer applied automatically.
3. Return to **certanvil.com/account**, the single web confirmation page: "Confirming your
   payment…" → "You're Pro", what is unlocked, and **Start studying**. The checkout endpoint puts
   the source cert in the return address (`?checkout=success&from=<cert id>`); with no `from`
   (bought on the landing site), it uses the account's active cert from the profile, else
   Network+. Start studying opens that cert's app with `?pro=1`, which forces a fresh Pro check on
   load and skips any cached Free state. Slow webhook: "Payment received, Pro switches on within a minute"
   plus the emailed receipt; the page keeps checking.
4. Cancelled at Stripe: back where they started with "No charge was made."

**Landing site (certanvil.com)**
- `/pricing`: Yearly first and picked, then Monthly, priced by the visitor's country (£ UK, € euro
  area, $ elsewhere) with a small currency switcher; "Prices include tax"; launch panel while it
  runs; **Get Pro** → sign-in modal (plan shown) → Stripe → `/account` confirmation. Already Pro:
  a "You're Pro" card instead of buy buttons ("Billed by Apple" when it is).
- Trust lines under the button: "Prices include tax · Card, Apple Pay, Google Pay · Secure checkout
  by Stripe · Cancel anytime".
- FAQ, in order: what happens after the first year; cancel and keep progress; refunds (no automatic refunds;
  write to support; iPhone purchases are refunded by Apple); bought on iPhone, works on web; every cert including new ones; only need it
  until my exam; why £/€ and is tax included.
- Diagnostic results: "Save your results and keep practising free" stays the main button; the
  second becomes **Go Pro** ("Close the gap to [pass mark]") through the same journey. The dead
  "add your email below" promise goes.
- Homepage: remove "no annual nonsense" and the "no 'are you sure'" cancel line; prices read from
  one source so the launch offer can switch them; footer gains a pricing link.

## After paying (every surface)
- **Account page:** one status line from the real subscription ("Pro · Yearly · renews 14 Mar
  2027"), not the admin role. Free shows one **Get Pro**.
- **Billing page** (`/manage-subscription` becomes "Billing"):

| State | Shows | Actions |
|---|---|---|
| Free | What Pro adds | Get Pro |
| Pro, billed on web | Plan, price, next charge; launch buyers: "first year $69, then $89 on [date]" | Manage billing (Stripe portal) · Cancel |
| Cancelled, still active | "Pro until 14 Mar" | Resume |
| Card failed (grace) | "Your card didn't go through. Update it to keep Pro." | Update card |
| Billed by Apple | "Billed by Apple through your Apple ID" | Link to Apple subscriptions |
| Pro ended | "Your Pro has ended. Your progress is kept." | Renew |
| Owner | As today | None |

- **Cancel** asks one question first: "Passed my exam" → congratulations and the next cert; "Too
  expensive" → on Monthly, suggest Yearly. Then Stripe's portal confirms. The cancel button is never
  hidden.
- **Refunds:** none promised, no button. Someone who writes to support gets a case-by-case answer
  from the founder. If the founder does refund in full, the webhook treats it (`charge.refunded`)
  as the end: it revokes Pro **and cancels the subscription** through the Stripe API, so it can
  never renew. A partial refund changes nothing.
- **Receipts:** Stripe's emailed receipts and the portal invoice list; Apple sends its own.
- **Failed renewal:** Pro stays on through the grace period (Stripe Smart Retries; Apple Billing
  Grace Period) with a calm in-app banner.
- **Pro ended:** a one-time screen; progress kept, free limits back, renew in one tap. No guilt copy.
- **Renewal reminder:** email before the first full-price renewal of a launch-offer year.
- **Account deletion:** web-billed Pro is cancelled with the account. Apple-billed Pro shows a
  warning, "You're still billed by Apple. Deleting your account doesn't stop that. Cancel in your
  Apple ID", with the link to Apple's subscriptions page; Delete stays available (Apple expects a
  warning and a link, not a gate). The Sign in with Apple token is revoked on deletion, as Apple
  requires (the revoke already exists from Stage 5c; keep it). A page replaces the bare confirm
  box.
- **Already-Pro guard:** nobody with Pro sees a buy button anywhere; the server refuses a second
  Stripe checkout (`409 already_pro`); the iPhone app checks the server before opening Apple's
  sheet. If a double purchase still happens (for example two devices at once), the founder is
  alerted and refunds the newer one.

## Launch moment
- One email, only to the "CertAnvil Pro" waitlist (cert waitlists hear about the offer in their
  cert's launch email), 48 hours before the site switches: Pro is live, $69 for your first year
  then $89, ends [date], what Pro unlocks, one button to checkout, a
  working one-click unsubscribe. The form promised one email, so there is no reminder sequence.
- Fix first: the waitlist email says reply "unsubscribe"; the form promised one click.
- Launch day: waitlist buttons become Get Pro; offer panel on pricing; one-line homepage banner;
  diagnostic Go Pro live; meta and share text updated (and a PNG share image, since X, LinkedIn and
  Facebook don't show SVG). The waitlist stays only for certs not yet out.
- Day 30 at the stated time: the coupon and Apple's intro offer expire on their own; the panel and
  banner go.

## iPhone: what the app must never show
No web price used as a buy prompt, no Go Pro / waitlist for Pro, no links to pricing, billing,
Stripe or refunds, no web launch offer. Plain text "Pro · billed on
certanvil.com" is allowed.

Today's hiding rule matches only links containing "pricing" or "manage-subscription"
(`dg-system.css`, `landing/native-hide.js`). It misses the diagnostic pages (which load neither),
plain buttons, the pricing page reached directly (the `lib/onboarding-chrome.js` JS redirect),
homepage price and refund text, and every future Stripe button. **Fix: one `data-web-purchase`
marker on every price and buy element, hidden by one rule; native-hide loaded on every landing
page including diagnostic; in the app, pricing and billing pages route to the native paywall.**

## Legal and trust pages
- **Terms** (rewrite §4–6): prices in your currency with tax included; auto-renewal; launch offer
  (one first year at the offer price, renews at full price, end date); iPhone purchases billed,
  refunded and cancelled through Apple; no automatic refunds, with the 14-day cancellation right waived by the buyer's consent at checkout; retry period matching
  Stripe; deletion and subscriptions; free tier is 15 questions a day. If Managed Payments is
  granted, name Stripe as the seller and route payment questions to it.
- **Privacy:** add Apple and RevenueCat alongside Stripe.
- **Pricing footer:** Terms, Privacy, Contact.
- **Business address (D12):** registered-address service in the footer and Terms. Founder, next
  month, last step before launch.

## Gaps to close
Build order follows dependencies: the shared subscription record comes first, because the iPhone,
the guard, the labels and the analytics all read it. Planned as three plans: (A) foundation and
web, (B) iPhone, (C) landing, legal and launch.

**Before launch: foundation (plan A, first)**
1. Merge the Stripe branch (checkout, portal, webhook, `provider_subscriptions`, the
   `apply_provider_subscription_event` RPC) onto today's main, apply its migration, restore the
   admin bypass its `is_pro()` rewrite drops, check the server's daily limit is 15 (an older
   branch migration still returns 20), and add the race handling and `cancel-on-delete`.
2. The `/api/pricing` endpoint (country → currency, prices, launch-offer state), local-currency
   Stripe prices, Stripe Tax (or Managed Payments), the automatic launch coupon, wallets.

**Before launch: web app and landing (plans A and C)**
3. Account status from the real subscription; Billing page with every state; cancel question;
   the consent line at checkout and the refund-cancels webhook; `/account` confirmation page with `from` and the
   `?pro=1` re-check.
4. Pricing page rebuild, diagnostic Go Pro, homepage copy, every Go Pro button pointed at the
   paywall or pricing.

**Before launch: iPhone (plan B)**
5. Apple in-app purchase for both plans via RevenueCat. Apple's notifications reach us through
   **RevenueCat's webhook** (`landing/api/revenuecat/webhook.js`), written into the same
   subscription record with `provider='apple'`; we do not consume App Store Server Notifications
   directly. Restore purchases.
6. The native paywall (today hidden) with the 3.1.2 disclosure (billed amount first, auto-renew
   line, Terms of Use and Privacy links, StoreKit prices), and the confirmation, Ask to Buy and
   Settings states; the server check before Apple's sheet.
7. Apple-billing warning (not a gate) before account deletion.

**Before launch: everywhere (plan C)**
8. Already-Pro guard and "billed by Apple / on web" labels.
9. Grace-period banner and Pro-ended screen.
10. `data-web-purchase` marker and native-hide on every landing page.
11. Terms (sale section; fix the limits to 15 questions and 5 review cards everywhere), Privacy,
    FAQ, refund wording (no promise), one contact address, pricing footer links.
12. Waitlist one-click unsubscribe; launch email (its button goes to pricing with Yearly kept,
    through sign-in).
13. Vercel Web Analytics plus checkout events (started, paid, cancelled) for the funnels below.
14. Business address (founder, last).

**Soon after launch**
15. Move the free limits that are browser-only today (reviews, exam runs, Pro-only features, one
    cert) to the server.
16. Pro fair-use cap of 150 AI questions a day (Phase G decision 6, never built).
17. Sign in with Apple on the web, and the "Bought Pro but don't see it? You may be signed in with a
    different account" help line.

**Founder-only jobs**
- Apply for Stripe Managed Payments.
- Stripe: Monthly and Yearly prices in USD, GBP and EUR; the launch coupon (amount off $20 / £20 /
  €20, once, redeem-by the end time); wallets on; Smart Retries on; receipt emails on.
- App Store Connect: the Paid Apps agreement, tax forms and banking; both plans in one
  subscription group; the Yearly introductory offer (pay up front, one year, with dates); Billing
  Grace Period; a Terms of Use (EULA) link in the app's metadata; confirm Apple's price points
  match $9.99 / $89 and the £/€ figures. (Small Business Program: already enrolled, July.)
- RevenueCat account linked to App Store Connect.
- Vercel secrets: the Stripe keys, webhook secret and price IDs, and the RevenueCat webhook secret.
- Registered-address service (next month, last).

## Measuring it
From day one: free to paid within 30 days (iPhone vs web); paywall seen → purchase by trigger;
pricing page → checkout started → paid by currency; diagnostic finished → account → paid within 30
days; launch email → purchase and the share taking $69; plan mix; refunds and chargebacks (keep
under 2%, chargebacks well under 1%); AI cost per paying user against revenue per user.

## Cross-platform
Every screen in this spec exists on the iOS app, mobile web and desktop, except where Apple's rules
split them (purchase sheet, Restore, billing links), and each split is named above. Runtime
behaviour that differs: WKWebView suspends in-flight requests, so confirmation re-checks Pro on
resume and on sign-in; the last known Pro state is kept for 24 hours if a check fails on a network
error, so a paying user is never locked out by a bad connection.

## Rejected approaches
- **3-month Exam Pass** and **Retake cover**: founder rejected both on 1 Nov. Do not re-propose.
- **Lifetime plan:** ongoing AI cost turns the best users into a loss.
- **Per-cert pricing:** cuts against "one price, every cert".
- **Free trial (card up front):** in exam prep it mostly catches people who forget to cancel.
- **Cheaper web price / US link-out from the app:** US fees are still in court and the UK still
  requires Apple purchase; revisit after launch.
- **Consuming App Store Server Notifications directly:** RevenueCat already receives them and
  sends one webhook; two feeds into one record invite double writes.
- **Gating account deletion on cancelling Apple first:** Apple expects a warning and a link, and
  may reject a gate.
- **A percent-off launch coupon:** $89→$69 and £79→£59 are different percentages; a fixed $20 /
  £20 / €20 is exact in all three.
- **Paddle:** 5% + 50¢ hurts a $9.99 payment and means rebuilding the Stripe work.
- **Plain Stripe with VAT filed by the founder:** quarterly EU VAT returns from the first EU sale.
- **Embedded checkout:** more to build and break for little gain over hosted Checkout.
- **Confirming payment inside each cert app on the web:** domain hops while Pro switches on; one
  page at `/account` instead.
- **More URL patterns in native-hide:** misses buttons and text; one marker covers them all.
- **Self-serve refund button, and any refund promise (14-day money-back):** founder rejected both on 1 Nov;
  they invite abuse. Do not re-propose.
- **A multi-email launch sequence:** breaks the waitlist's "one email" promise.

## Related
[[PHASE-G-PLAN-2026-06-11]] · [[2026-06-16-g1-stripe-entitlements]] · [[2026-06-26-g3-ios-revenuecat-purchase-coordinator]] · [[APP_STORE_DISTRIBUTION]] · [[ENVIRONMENT_STRATEGY]] · [[BRAND]]
