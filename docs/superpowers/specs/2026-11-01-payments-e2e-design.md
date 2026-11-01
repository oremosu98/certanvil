---
up: "[[Decisions MOC]]"
type: spec
status: approved
cert: all
updated: 2026-11-01
tags: [spec, mobile, design]
---
# Payments end to end: how people pay for Pro, on every surface

The founder agreed this design and approved the screens on 1 Nov 2026, after two specialist passes (product design and
marketing) over the app, the iOS app and the landing site. Revised the same day after a three-way review (money and
security, compliance, buildability): the founder's binding decisions on refunds and the law, EU tax, the server-side
sales-open switch and the address gate are folded in below. It covers what people pay, where they
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
| D5 | **Launch offer:** Yearly at **$69 / £59 / €69 for the first year**, then the normal price. A real 30-day window; Pro waitlist told 48 hours first (their email links carry an early-access token the checkout accepts before sales open); ends on its own; never extended. Shown as "$69 for your first year, then $89 a year", never with $89 struck through (a strike-through reads as a former price, and Pro was never sold at $89). **Web:** one Stripe *amount-off* coupon, $20 / £20 / €20 (per-currency amounts), duration once, redeem-by the end time; the checkout endpoint attaches it automatically while the window is open (no code to type). **iPhone:** an Apple introductory offer (pay up front, one year) on Yearly at the matching tier, with Apple's start and end *dates*; Apple gives it only to people new to the subscription group, and prices it per storefront. The iPhone shows "Launch offer, first year" with StoreKit's price and "Ends [date]" (date only); the web shows the date and time. |
| D6 | **iPhone: Apple in-app purchase only, in every country**, through RevenueCat. No link or price that points to web purchase. |
| D7 | **Web: Stripe hosted Checkout** with card, Apple Pay, Google Pay and Link; prices tax-inclusive in the buyer's currency. The founder applies for **Stripe Managed Payments** (merchant of record) now. **Backup** if it is not granted before sales open: register for EU VAT under the **non-Union OSS** scheme (and UK VAT, or confirm below the threshold) before the first sale, add the registrations in Stripe Tax, and Stripe Tax collects. Stripe Tax alone collects nothing where no registration exists, so sales cannot open until one of the two is in place. Adaptive Pricing stays off. GB and euro-area buyers are always charged in their own currency. |
| D8 | **An account comes first** on every surface. **Pro belongs to the account**: buy anywhere, Pro everywhere. |
| D9 | **No refund promise and no refund button anywhere, and nothing advertised** (founder, 1 Nov: it invites abuse). Buyers keep their statutory rights: Pro is a digital *service*, so a UK or EU consumer may cancel within 14 days and gets back the part they haven't used (pro-rata). Web checkout's one required checkbox (Stripe's terms consent with custom text) reads: "I agree to the [Terms] and to Pro renewing automatically at $89 a year until I cancel. I want Pro to start now. If I cancel in the first 14 days, I only get back the part I haven't used." (Monthly and launch variants in the contract.) It carries the Terms acceptance with a link, the auto-renewal acknowledgement and the start-now request. The Terms describe the 14-day right plainly and promise nothing beyond it. Other refunds stay the founder's call, case by case, by email to support. iPhone refunds stay with Apple. The founder gets a one-off UK consumer-law solicitor check of the checkout text, Terms §4 to §6 and the confirmation email before sales open. |
| D10 | **One contact:** support@certanvil.com on every customer surface; billing@ forwards to it. |
| D11 | **Landing analytics:** Vercel Web Analytics (no cookie banner). |
| D12 | **Business address:** a registered-address service. Founder sets it up next month; it stays the founder's **last step**, and it **gates sales opening**: the checkout refuses live sales without it, so launch cannot happen before it. It appears in the Terms, the footers, the confirmation email and Stripe's public business details. |
| D13 | **Sales-open switch, server-side, off by default.** Until `SALES_OPEN_AT` passes, no checkout session can be created for anyone except allowlisted test/admin accounts and launch-email early-access links during the 48-hour early window. The web paywall, pricing page and iPhone paywall read the switch from the server. It is turned on only after these gates: new Terms and Privacy live, trading address on the site, tax (Managed Payments or OSS) in place, solicitor check done, live Stripe keys, Prices and coupon set and checked. |
| D14 | **Confirmation email (our own, durable medium)** after every web purchase: trader name and address, plan and price, auto-renewal terms with the renewal price and date, how to cancel, the exact consent text the buyer ticked with its time, and a link to the frozen Terms version they accepted. The consent record is stored with the subscription. |
| D15 | **Renewal reminders for every plan:** an email before every Yearly renewal (30 days ahead, with the price it renews at, so launch buyers see $89 before their first full-price year) and every 6 months for Monthly. This meets California's auto-renewal law and the UK DMCC subscription regime's reminder timing; the rest of that regime (from January 2027) needs a follow-up plan. |

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

Before sales open (D13) the paywall shows the headline, what Pro unlocks and "Pro launches soon" with a "Get notified" button
instead of prices and Get Pro. Paywall content once open: headline; Yearly (picked) and Monthly, each led by its billed amount ("$89 a year",
"$9.99 a month") with "$7.42 a month" as a smaller line under Yearly; during the launch window the
launch line (web: "$69 for your first year, then $89 a year. Ends [date, time]", no strike-through;
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
   "Pro (billed outside the App Store)" as plain text, with no domain and no link.
5. If Apple's notification is slow, the app asks the server to sync with RevenueCat; "Pro restored" is
   shown only once the server agrees.

**Web app (mobile web and desktop)**
1. Paywall → if signed out, sign in with the plan kept.
2. Stripe Checkout, email filled and locked, launch offer applied automatically, the consent
   checkbox (D9). The session expires after 30 minutes; opening a new one closes the old one.
3. Return to **certanvil.com/account**, the single web confirmation page: "Confirming your
   payment…" → "You're Pro", what is unlocked, and **Start studying**. The checkout endpoint puts
   the source cert in the return address (`?checkout=success&from=<cert id>`); with no `from`
   (bought on the landing site), it uses the account's active cert from the profile, else
   Network+. Start studying opens that cert's app with `?pro=1`, which forces a fresh Pro check on
   load and skips any cached Free state. The page first asks the server to sync the paid session
   directly from Stripe, so a broken webhook never leaves a payer on Free. Slow path: "Payment
   received, Pro switches on within a minute" plus the emailed receipt; the page keeps checking.
   Our own confirmation email (D14) follows.
4. Cancelled at Stripe: back where they started with "No charge was made."

**Landing site (certanvil.com)**
- `/pricing`: Yearly first and picked, then Monthly, priced by the visitor's country (£ UK, € euro
  area, $ elsewhere; "US$" outside the US) with a small currency switcher for visitors outside the UK
  and euro area; "Prices include tax"; launch panel while it
  runs; **Get Pro** → sign-in modal (plan shown) → Stripe → `/account` confirmation. Already Pro:
  a "You're Pro" card instead of buy buttons ("Billed by Apple" when it is).
- Trust lines under the button: "Prices include tax · Card, Apple Pay, Google Pay · Secure checkout
  by Stripe · Cancel anytime".
- FAQ, in order: what happens after the first year; cancel and keep progress; refunds (no automatic refunds;
  write to support; iPhone purchases are refunded by Apple; one line pointing UK and EU buyers to the
  14-day right in the Terms); bought on iPhone, works on web; every cert including new ones; only need it
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

- **Cancel** asks one optional question first: "Passed my exam" → congratulations and the next cert;
  "Too expensive" → on Monthly, suggest Yearly. "Continue to cancel" cancels in one step (no hop to
  Stripe's portal) and sends an email confirming the end date. The cancel button is never hidden and
  the question never blocks.
- **Refunds:** none promised, no button. Someone who writes to support gets a case-by-case answer
  from the founder. If the founder does refund in full, the webhook treats it (`charge.refunded`)
  as the end: it revokes Pro **and cancels the subscription** through the Stripe API, so it can
  never renew (the cancel is retried until Stripe confirms it). A partial refund changes nothing by
  itself; a 14-day statutory cancellation is the founder cancelling the subscription now and refunding
  the unused part.
- **Receipts:** Stripe's emailed receipts and the portal invoice list, plus our confirmation email (D14);
  Apple sends its own.
- **Failed renewal:** Pro stays on through the grace period (Stripe Smart Retries; Apple Billing
  Grace Period) with a calm in-app banner. When Stripe's retries run out the subscription is cancelled
  (Stripe setting) and Pro ends; the server also stops treating a past-due subscription as Pro once
  Stripe has no retry left, whatever the setting says.
- **Pro ended:** a one-time screen; progress kept, free limits back, renew in one tap. No guilt copy.
- **Renewal reminder (D15):** our own email 30 days before every Yearly renewal (launch buyers see the
  full price) and every 6 months for Monthly.
- **Account deletion:** web-billed Pro is cancelled with the account, server-side, when the account is
  actually purged after the 7-day undo window (signing back in within 7 days leaves the subscription
  untouched). The purge waits until Stripe confirms the cancel, and any open invoice is voided. The
  RevenueCat customer is deleted at purge too, so a returning person can restore their Apple purchase. Apple-billed Pro shows a
  warning, "You're still billed by Apple. Deleting your account doesn't stop that. Cancel in your
  Apple ID", with the link to Apple's subscriptions page; Delete stays available (Apple expects a
  warning and a link, not a gate). The Sign in with Apple token is revoked on deletion, as Apple
  requires (the revoke already exists from Stage 5c; keep it). A page replaces the bare confirm
  box.
- **Already-Pro guard:** nobody with Pro sees a buy button anywhere; the server refuses a second
  Stripe checkout (`409 already_pro`); the iPhone app checks the server before opening Apple's
  sheet; the checkout fails closed when the Pro check cannot run. If a double purchase still happens
  (two devices at once), the server reverses the **Stripe** side automatically, whichever came first:
  a second Stripe subscription is cancelled and refunded in full; an Apple purchase on an account with
  web Pro cancels the Stripe subscription and refunds its unused part. The customer gets an email and
  the founder an alert.

## Launch moment
- One email, only to the "CertAnvil Pro" waitlist, 48 hours before the site switches (cert waitlists
  signed up for one email about their cert, so their cert-launch email stays about the cert and
  carries no Pro offer): Pro is live, $69 for your first year
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
Stripe or refunds, no web launch offer, no domain named for billing, and no instruction to act on a
web payment. Plain text "Pro (billed outside the App Store)" is allowed; a web-billed grace notice
reads "There's a problem with your Pro billing. Check your email." Terms and Privacy open from the
app with `?app=1`, which hides every web-purchase element on those pages too.

Today's hiding rule matches only links containing "pricing" or "manage-subscription"
(`dg-system.css`, `landing/native-hide.js`). It misses the diagnostic pages (which load neither),
plain buttons, the pricing page reached directly (the `lib/onboarding-chrome.js` JS redirect),
homepage price and refund text, and every future Stripe button. **Fix: one `data-web-purchase`
marker on every price and buy element, hidden by one rule; native-hide loaded on every landing
page including diagnostic; in the app, pricing and billing pages route to the native paywall.**

## Legal and trust pages
- **Terms** (rewrite §4–6, v1.2, with a frozen copy at a versioned URL): prices in your currency
  with tax included; auto-renewal and reminders; launch offer (one first year at the offer price,
  renews at full price, end date); iPhone purchases billed, refunded and cancelled through Apple, and
  Apple's Standard EULA also applies to the iPhone app; no automatic refunds; the statutory 14-day
  right described plainly (cancel within 14 days, get back the unused part); retry period matching
  Stripe; deletion and subscriptions; free tier is 15 questions a day. If Managed Payments is
  granted, name Stripe as the seller and route payment questions to it.
- **Privacy:** add Apple and RevenueCat (linked to your CertAnvil account ID, US transfers named),
  analytics with an opt-out, and RevenueCat deletion on account deletion.
- **Pricing footer:** Terms, Privacy, Contact.
- **Business address (D12):** registered-address service in the footer, Terms and confirmation
  email. Founder, next month, last step, and a gate on sales opening.

## Gaps to close
Build order follows dependencies: the shared subscription record comes first, because the iPhone,
the guard, the labels and the analytics all read it. Planned as three plans: (A) foundation and
web, (B) iPhone, (C) landing, legal and launch.

**Before launch: foundation (plan A, first)**
1. Merge the Stripe branch (checkout, portal, webhook, `provider_subscriptions`, the
   `apply_provider_subscription_event` RPC) onto today's main, apply its migration, restore the
   admin bypass its `is_pro()` rewrite drops, check the server's daily limit is 15 (an older
   branch migration still returns 20), and add the race handling, and cancel web billing server-side when a deleted account is purged.
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
13. Vercel Web Analytics plus checkout events (started, paid, cancelled) for the funnels below, with
    an opt-out and none for EU visitors.
14. Business address (founder, last; gates sales opening).
15. The sales-open switch (D13), the confirmation email (D14), renewal reminders (D15), server-side
    AI metering (today a Free user can skip the daily limit by dropping one flag), and a preview path
    where a test-mode checkout and webhook run before merge.

**Soon after launch**
16. Move the free limits that are browser-only today (reviews, exam runs, Pro-only features, one
    cert) to the server.
17. Pro fair-use cap of 150 AI questions a day (Phase G decision 6, never built).
18. Sign in with Apple on the web, and the "Bought Pro but don't see it? You may be signed in with a
    different account" help line.
19. **Before 1 January 2027:** the rest of the UK DMCC subscription regime (prescribed reminder
    content, renewal cooling-off refunds, end-of-contract notice), as its own plan once the
    regulations' final text is out.
20. App paywall analytics (paywall seen and checkout started by trigger, iPhone vs web).

**Founder-only jobs** (the ones marked GATE must be done before `SALES_OPEN_AT` is set)
- Apply for Stripe Managed Payments now. GATE: Managed Payments granted, or the backup done: EU
  non-Union OSS registration (and UK VAT registration, or confirm below the threshold) added in
  Stripe Tax → Registrations.
- GATE: one-off UK consumer-law solicitor check of the checkout text, Terms §4 to §6 and the
  confirmation email; record the date in the launch runbook.
- Stripe: Monthly and Yearly prices in USD, GBP and EUR, tax-inclusive; the launch coupon (amount off
  $20 / £20 / €20, once, redeem-by the end time); wallets on; Adaptive Pricing off; Smart Retries on
  with **"if all retries fail: cancel the subscription"**; receipt emails on; public business
  details with the address. GATE: live keys, Prices and coupon pass `launch-check.mjs`.
- App Store Connect: the Paid Apps agreement, tax forms and banking; both plans in one
  subscription group; the Yearly introductory offer (pay up front, one year, with dates); **Billing
  Grace Period on**; Apple's Standard EULA linked in the description as "Terms of Use (EULA)" next to
  certanvil.com/terms; **App Privacy labels** updated (Purchases and User ID linked to the user, usage
  data); an **App Review demo account** with a fixed code; "Manually release this version" until
  sales open; confirm Apple's price points match $9.99 / $89 and the £/€ figures. (Small Business
  Program: already enrolled, July.)
- RevenueCat account linked to App Store Connect.
- Vercel secrets: the Stripe keys, webhook secret and price IDs, the RevenueCat webhook secret and
  secret API key, `CRON_SECRET`, `EARLY_ACCESS_SECRET`, `TRADER_ADDRESS`, `TERMS_VERSION`.
- GATE: Terms v1.2 and Privacy v1.3 live. GATE (last): registered-address service, address on the
  site and in `TRADER_ADDRESS`.

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
- **A checkout waiver of the 14-day right ("I understand I lose my 14-day right to cancel"):** Pro
  is a digital service, so in the EU the right is lost only on full performance; the line misstated
  buyers' rights. Replaced by the start-now request with the pro-rata rule (founder, 1 Nov).
- **A client-side sales-open date on the landing site only:** the app paywall reached checkout
  anyway. One server-side switch instead (D13).
- **Struck-through "$89" next to the launch price:** reads as a former price for a product never
  sold at $89.
- **The Pro offer inside cert-launch emails:** those lists consented to one email about their cert.
- **Cancelling web billing when deletion is requested:** a 7-day undo would leave a returning user
  silently non-renewing, and a failed client call left deleted accounts billed. Cancelled at purge,
  server-side, instead.
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
- **Plain Stripe with VAT filed by the founder, as the plan:** quarterly EU VAT returns from the
  first EU sale. It remains the **backup** (non-Union OSS + Stripe Tax) only if Managed Payments is
  not granted before sales open (founder, 1 Nov).
- **Embedded checkout:** more to build and break for little gain over hosted Checkout.
- **Confirming payment inside each cert app on the web:** domain hops while Pro switches on; one
  page at `/account` instead.
- **More URL patterns in native-hide:** misses buttons and text; one marker covers them all.
- **Self-serve refund button, and any refund promise (14-day money-back):** founder rejected both on 1 Nov;
  they invite abuse. Do not re-propose. (The statutory 14-day pro-rata right in D9 is the law, not a
  promise, and is described only in the Terms.)
- **A multi-email launch sequence:** breaks the waitlist's "one email" promise.

## Related
[[PHASE-G-PLAN-2026-06-11]] · [[2026-06-16-g1-stripe-entitlements]] · [[2026-06-26-g3-ios-revenuecat-purchase-coordinator]] · [[APP_STORE_DISTRIBUTION]] · [[ENVIRONMENT_STRATEGY]] · [[BRAND]]
