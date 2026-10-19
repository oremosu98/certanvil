---
up: "[[Mobile MOC]]"
type: audit
date: 2026-10-19
tags: [audit, mobile, ios, design]
---
# June cert-ios design vs the live app at phone width (19 Oct 2026)

Founder, 19 Oct: the iOS app must be **the June cert-ios design**, with enhancements, before launch.
Source of truth: `mockups/cert-ios-*` and `mockups/onboarding-*` (plus branch-only mockups on
`feat/cert-ios-e2e`: drills, review, review-answers, log-result, pro-expired, daily-limit). June's
mapping plan: `docs/superpowers/specs/2026-06-10-mockup-lift-and-shift-plan.md` on `feat/cert-ios-e2e`.
The June E2E app on that branch is a clickable mockup prototype (no real data); it is the design
reference, not shippable code. Delivery remains the native shell of ADR-004.

Method: Playwright at 390x844 (DPR 2, dark, secplus, localhost), each mockup state vs the matching
real screen, side-by-side PNGs (session scratch; regenerate with the same approach).

## Findings

**The live app is far from June.** v7.36.0/7.36.1 lifted the design (phone width only), but later
work replaced much of it: the Home "Console" bento, the v8.10.0 Settings Console reskin, motion waves.

Real bugs at 390px:
- Home overflows: `#page-setup .board` keeps desktop padding (`padding:30px 36px`, dg-system.css and
  dg-critical.css) on top of the page padding; cards start ~62px in and spill right (tiles 288px in a
  261px column). Reproduced in Chromium and WebKit.
- Progress / Analytics may render empty until `renderProgressPage()` / `renderAnalytics()` runs
  (seen via `showPage`; confirm with a real tab tap).

| Mockup | Real surface | Status | Key differences |
|---|---|---|---|
| cert-ios-home | page-setup | DIFFERENT | Console header + bento instead of cert header/greeting; no study-menu rows; 390px overflow |
| onboarding-free-home-day0 | page-setup (empty) | DIFFERENT | No "place your readiness" 30-second-check card |
| onboarding-free-capped-home | onb home | DIFFERENT | No "That's today's 15 done" state / Daily Review CTA |
| cert-ios-quiz (gen/question/answered) | page-loading, page-quiz | PARTIAL (close) | Dots render "1/1"; Flag where theme toggle sits, Next not docked; no Explain/Drill/Report row |
| cert-ios-results | page-results | PARTIAL (near) | No Basic/Exam-level tiles; CTA layout 1+2+1 vs 1+3; "N° 01" mono rows |
| cert-ios-review-answers | page-review | PARTIAL | Kicker header; 4 chips vs 2-way switch; no check icons / CORRECT · YOUR PICK |
| cert-ios-review | page-sr-review | PARTIAL | "SR queue." title + mono meta; no streak pill; CTA not docked |
| cert-ios-exam | page-exam | PARTIAL (heavy) | Pause/Flag/End row; navigator dropdown; nested card; small undocked Next |
| cert-ios-exam-results | page-exam-results | PARTIAL | Prose score vs "So close." headline; no 4-tile strip; no domain bars |
| cert-ios-progress | page-progress | PARTIAL | Progress/Analytics switch vs section pills; chips wrap centred |
| cert-ios-analytics | page-analytics | PARTIAL (closest) | Section pills missing; inset card; sky chart inline |
| cert-ios-settings | page-settings | DIFFERENT | v8.10.0 Console (§ sections, mono bars) vs iOS grouped cards |
| cert-ios-drills | page-drills | PARTIAL | Card order; drill-by-domain rows missing; lowercase label |
| cert-ios-custom-quiz | custom-quiz modal | PARTIAL | Modal not a screen; domain layout differs |
| cert-ios-report | bug-report drawer | MATCHES (minor) | No context chip / counters; few px overflow |
| cert-ios-daily-limit | daily-limit modal | MATCHES (minor) | Modal vs full screen; row icons missing |
| onboarding-upgrade-sheet | upgrade sheet | PARTIAL | Copy/prices differ ($ vs £); no Pro badge / honesty box |
| onboarding-free-cert-picker | onbFirstRun step 1 | PARTIAL | No back/FREE header or info box; coachmark overlaps |
| onboarding-first-run-diagnostic | onb diag intro + quiz | PARTIAL | Different header; Next not docked |
| onboarding-loading-states | offline bar, page-loading | PARTIAL | Loud orange banner vs calm offline screen |
| onboarding-error-states, account-deletion | toasts, delete modal | NOT CHECKED | Need states / a session |
| cert-ios-hub, my-certs-pro, log-result, cross-cert, manage-subscription | landing/*.html | NOT CHECKED | Signed-out gate only locally |
| signup-signin, magic-link-sent, welcome-back | landing auth | NOT CHECKED | |
| native-welcome, notifications-prime | — | MISSING | |
| plan-picker, pro-iap, pro-welcome, restore-purchase | — | MISSING | With in-app purchase (G-3) |
| cert-ios-pro-expired | — | MISSING | |
| first-run-concept, batch2-concept, rollout-flow, sandbox, cert-ios-app | — | DEMO-ONLY | |

Counts: MATCHES 2 · PARTIAL 15 · DIFFERENT 4 · MISSING 7 · DEMO-ONLY 5 · NOT CHECKED 10.

## Part 2 — screens behind sign-in (checked 19 Oct, fake session on localhost)

Session stubbed by routing `lib/supabase.js` to a fake client (getSession/getUser/onAuthStateChange,
a chainable `from()` profile, `rpc('get_daily_quota_usage')` → pro); all non-localhost requests aborted.

| Mockup | Real surface | Status | Key differences |
|---|---|---|---|
| cert-ios-hub | landing/account.html | DIFFERENT | Profile/settings page; no "Your cert" card, Unlock-with-Pro list or Go Pro card |
| onboarding-my-certs-pro | My certs modal / account list | PARTIAL | No "Studying now" card; centred modal not a screen; rows wrap at 390 |
| cert-ios-log-result | account.html inline form + result modal | PARTIAL | Form expands in the row; **cert name line disappears from the expanded row (bug)**; no big serif score field. **Keep** the restyled "Cert passed · You crushed it." modal |
| cert-ios-cross-cert | landing/analytics.html | PARTIAL | Landing header not app chrome; taller cards; every CTA filled amber |
| onboarding-manage-subscription | manage-subscription.html | PARTIAL (near) | Copy/data; "Manage in App Store" button missing |
| onboarding-signup-signin | landing auth modal | PARTIAL | Modal; no Create/Sign-in toggle; no Apple button (Google "SOON") |
| onboarding-magic-link-sent | auth modal sent state | PARTIAL | No Open Mail / Resend buttons; 1h vs 15min copy |
| onboarding-welcome-back | — | MISSING | |
| onboarding-error-states (card declined, link expired, email typo…) | — | MISSING | App AI error cards (timeout/network/server) are a different, kept design |
| onboarding-account-deletion | Settings delete flow | PARTIAL | Ghost button in red card vs iOS row; centred card vs bottom sheet; title clipped at 844px. **Keep** the 7-day grace copy |

Bug confirmations:
- Progress / Analytics tabs render fine with real taps (part 1's "empty" was a navigation artifact).
  New: Progress filter chips stack one per line, centred, at 390.
- **Home overflow happens only when signed in:** `.topbar-right` (PRO pill + icon group + email pill)
  reaches x≈491, so the page is 492px wide: title gone, account pill clipped, tab bar's Account tab
  off-screen. An empty square button sits in the topbar in every state.
- **Pro is decided by role only on the account site:** `landing/lib/account.js` and `manage-sub.js`
  treat a user as Pro only when `role === 'admin'`, so a paying `role:'user'` with Sec+ entitlements
  sees "Free tier", locked certs and "Upgrade →" on their own passed cert. `analytics.html` uses the
  quota tier and shows the same user as Pro. Launch blocker once real users pay.

Newer features the June mockups lack, to keep in the lift: the restyled Cert-passed modal (17 Oct);
exam Pause / Prev-Next / Flag / Cancel / PBQ Reset / score card (12 Oct); Sim Lab PBQ answer view (19 Oct).

## Proposed build order (pending the founder's additions)
1. Home (June hub) + the 390px overflow fix.
2. Core loop: quiz, results, review answers.
3. Settings, Progress, Analytics, Drills, Daily Review.
4. Exam + exam results.
5. Onboarding: cert picker, first-run diagnostic, day-0 + capped Home, native welcome, notifications prime.
6. Pro screens (plan picker, purchase, welcome, restore, expired) with RevenueCat (G-3).
7. Account-site screens (landing) checked + lifted.

Default until told otherwise: the June design applies at phone width only (the v7.36.1 gate); desktop keeps its layout.

## Related
[[ADR-004-ios-app-live-site-native-shell]] · `docs/planning/2026-10-19-launch-sequence.md`
