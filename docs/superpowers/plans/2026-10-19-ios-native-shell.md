---
up: "[[Mobile MOC]]"
type: plan
status: in-progress
updated: 2026-10-19
tags: [plan, mobile, ios]
---
# iOS native shell (live site) — build plan

Decision: `docs/decisions/ADR-004-ios-app-live-site-native-shell.md`. Replaces the bundled
ship target of `2026-06-27-capacitor-ios-prewrap-and-wrapper.md`; that plan's navigation
audit (now `docs/mobile/CAPACITOR_NAV_AUDIT.md`) still applies.

Lane: GATED (native shell + navigation behaviour). Branch `feat/capacitor-ios-wrapper` → PR →
simulator + real-iPhone check → squash-merge. Capacitor 8 (Swift Package Manager, no CocoaPods).

## Task 1 · Scaffold the shell
- Deps: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, plus plugins `app`, `browser`,
  `haptics`, `preferences`, `share`, `splash-screen`, `status-bar`.
- `capacitor.config.json`: appId `com.certanvil.app`, appName `CertAnvil`,
  `server.url = https://secplus.certanvil.com`, `server.allowNavigation = [certanvil.com, *.certanvil.com]`,
  `ios.appendUserAgent = "CertAnvilApp"`, webDir `native-shell/` (a tiny offline fallback page).
- `npx cap add ios`; commit `ios/` (generated, SPM).
- Done when: the app builds and opens secplus.certanvil.com in the iOS Simulator.

## Task 2 · Make the web app native-aware (fast-lane web code, ships to prod harmlessly)
- Detect the shell (`window.Capacitor?.isNativePlatform()` or the `CertAnvilApp` user agent);
  set `html.is-native`.
- Hide the PWA install banner and every Go-Pro/pricing link in the shell (Guideline 3.1.1)
  until G-3 adds in-app purchase.
- External (non-`*.certanvil.com`) links open in the in-app browser sheet (Browser plugin).
- Remember the last cert subdomain (Preferences) and reopen there on next launch.
- Native touches: status bar follows the theme, haptic tap on answer, native share sheet.
- Done when: in the simulator, no Go-Pro link or install banner shows, an external link opens
  in a sheet, and switching to Net+ then relaunching reopens Net+.

## Task 3 · Real iPhone
- Sign with the founder's Apple team in Xcode, run on the founder's iPhone.
- Check sign-in (magic link), cloud sync, quiz generation, cert switch, share sheet,
  safe areas and keyboard.
- Done when: CertAnvil is on the home screen and a full quiz works on the phone.

## Task 4 · PR
- Update `docs/mobile/APP_STORE_DISTRIBUTION.md` with the as-built commands; open the gated PR.

## Later (separate plans)
G-2 Sign in with Apple/Google · G-3 RevenueCat in-app purchase (replaces the hidden Go-Pro
links) · streak-reminder notifications · G-4 listing + TestFlight + submission.
Before real users: Security C1 + AI usage caps (`docs/planning/2026-10-19-launch-sequence.md`).
