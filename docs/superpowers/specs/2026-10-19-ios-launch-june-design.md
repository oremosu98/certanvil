---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-19
tags: [spec, mobile, ios, launch]
---
# iOS launch: the June design, made real (approved 19 Oct 2026)

Founder approved this plan on 19 Oct 2026 after tapping through the June **CertAnvil E2E** app
in the iOS Simulator. It turns that design into the shipped iOS app and sets the launch order.
It is the Phase 2 detail of `docs/planning/2026-10-19-launch-sequence.md`.

## The reference

- **CertAnvil E2E** = the June clickable app: `mockups/cert-ios-app.html` + `mockups/e2e/shell.js`
  stitching the `cert-ios-*` and `onboarding-*` mockups, Capacitor 7 wrap, bundle `com.certanvil.e2e`.
  Lives only on branch `feat/cert-ios-e2e`. Relaunch steps: `docs/mobile/CAPACITOR_E2E.md` on that
  branch (worktree, `npm ci`, `npm run ios:sync`, `xcodebuild`, launch on the iPhone 17 Pro simulator).
- It is fake data and a design reference. **It does not ship.**
- Screen-by-screen gap list: `docs/audits/2026-10-19-june-ios-design-gap.md`.

## Architecture (unchanged from ADR-004)

The real app is lifted to the June design at phone width (`lift-*.css`, the v7.36.1 `max-width:899px`
gate; desktop keeps its layout). The iOS app is the live cert subdomain inside the Capacitor 8 native
shell (branch `feat/capacitor-ios-wrapper`, bundle `com.certanvil.app`). One codebase serves web,
mobile web and iOS.

## Founder's notes and how each is handled

1. **Keep the additions made since June.** Folded into stages 2–4. The must-keep list is below.
2. **A way for Apple users to give feedback.** Stage 7: in-app "Send feedback" plus Apple's rating prompt.
3. **AI-901 in, AI-900 out.** Already done in the real app (v8.120.0–v8.126.0, internal id stays `ai900`).
   The lift only replaces "AI-900" labels from the June mockups (hub, cert picker, My certs).
4. **Other pre-launch needs.** The App Store requirements list below.

## Additions since June that the lift must keep

| Surface | Keep |
|---|---|
| Exam | Resume a saved exam, Pause + "Exam paused", Prev/Next, Flag, leave prompt, pace line, 4 Sim Lab PBQs up front, PBQ Reset, PBQ review on results, restyled score card |
| Sim Lab | Whole area (June has none): daily free PBQ, multi-round sessions + verdict, Exam mode (Pro), tap a results row to see the answer |
| Drills | Mistake Autopsy, Reword Gauntlet (+ daily pill for free users), Why-Not, Decision Lab |
| Home | Catch-up card, Momentum "Practise it", Recommended "Resume your exam" tile, trajectory line, each cert's own pass mark and scale (June hard-codes 720), no negative day counts |
| Quiz | Cancel on every loading screen, "16 of 20" short-quiz pill + toast, answers lock after submit, Smart quiz topic line |
| Review | "Remove this question" link, Daily Review plan, exam day on the 7-day forecast |
| Progress / Analytics | Smoothed topic rows, per-cert milestones + drill milestones, every domain in Mastery |
| Settings / Account | Cert-passed modal (17 Oct restyle), Pass Plans, full-backup export, account deletion with 7-day grace |
| Pro / limits | Daily-limit screen before an oversized session, Pro-gate modal, free tier 15 questions + 5 review cards |

## Stages (each is one Notion milestone)

1. **Phone-width bugs.** Signed-in top bar overflow (492px) and the empty countdown square (fixed
   locally, unshipped), Progress filter chips stacking, cert name vanishing in the log-result row.
2. **Lift A: Home and the core loop.** Home hub, quiz, results, review answers, with the additions above.
3. **Lift B: everything you study in.** Exam + results, Sim Lab, Drills, Progress, Analytics, Settings,
   Daily Review.
4. **Lift C: first run.** Cert picker, first-run diagnostic, day-0 and capped Home, the never-built
   screens (native welcome, notification prompt, error and offline states), AI-901 labels.
5. **Native app.** Sign-in by 6-digit email code (magic links open Safari, not the app), Sign in with
   Apple + Google together, haptics, offline screen, study-reminder notifications, iPhone-only.
6. **Pro on iPhone.** RevenueCat in-app purchase, Restore Purchases, Pro-expired screen, App Store
   notifications to entitlements, the Pro-by-role fix on the account site, server-side quota (C1) and caps.
7. **Feedback.** "Report an issue" becomes "Send feedback" with a type (Bug / Idea / Something confusing),
   still stored privately in `user_bug_reports` with cert, screen and version attached. Apple's native
   review prompt (`SKStoreReviewController` via a Capacitor plugin) after a good moment: a strong quiz or
   a readiness milestone, never after a fail. Apple caps it at 3 a year. TestFlight's screenshot
   feedback covers the beta.
8. **App Store.** Privacy policy + terms refresh (PostHog, RevenueCat, Anthropic, cert list), privacy
   label, listing copy + screenshots, reviewer demo account with Pro, TestFlight beta (5–10 people),
   submission. Go-live: `app_config.onboarding_enabled = true`, then re-enable the marketing-skills plugin
   and delete the 7 copied skills.

Every stage that touches a screen runs the 5-stage visual pass and is verified on Desktop, Safari,
mobile web and the iOS simulator.

## App Store requirements (founder approved all)

- **Sign in with Apple** whenever Google sign-in is offered (guideline 4.8).
- **AI disclosure and consent**: say that questions are generated by a third-party AI (Anthropic) and get
  consent before sending user data (guideline 5.1.2). One onboarding line + the privacy policy.
- **Feels native, not a website** (guideline 4.2): reminders, haptics, offline screen.
- **No upgrade path outside Apple's payments** (guideline 3.1.1): hide bring-your-own-key and web pricing
  in the native app.
- **Account deletion in the app** (guideline 5.1.1): already built, must be reachable on iPhone.
- **Trademarks**: keep CompTIA, Microsoft and AWS out of the app name and icon; "Security+ exam prep"
  wording plus a not-affiliated line.
- **iPhone-only at launch**: iPads run it in compatibility mode; no iPad screenshots or layouts.
- **Reviewer demo account** with Pro, plus review notes.
- **TestFlight beta first.**

## Founder-only actions

Apple Services ID + Sign in with Apple key, Google OAuth client, RevenueCat account + keys, App Store
Connect subscription products ($9.99/mo, $89/yr), PostHog key, Anthropic cap raise, approve listing,
legal copy and screenshots, recruit TestFlight testers.

## Rejected approaches

- **Ship the E2E app itself with real data wired in.** It would mean two apps to maintain forever. Its
  screens are the design, the real app is the product.
- **Bundle the web app inside the native shell (offline-first).** Clashed with the production build in
  the 19 Oct attempt and duplicates deploys; ADR-004 chose the live-site shell.
- **Feedback via the App Store rating prompt only.** Complaints land in public reviews with no screen
  context and no private reply.
- **Feedback via email or a web form.** Takes users out of the app and loses cert, screen and version.
- **Keep magic links in the app.** The email link opens Safari, so the session never reaches the app.

## Related
[[ADR-004-ios-app-live-site-native-shell]] · `docs/audits/2026-10-19-june-ios-design-gap.md` ·
`docs/planning/2026-10-19-launch-sequence.md` · [[Mobile MOC]]
