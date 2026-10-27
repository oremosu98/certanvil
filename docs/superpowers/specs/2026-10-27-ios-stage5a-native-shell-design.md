---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-27
tags: [spec, mobile, ios, launch, stage-5, native]
---
# Stage 5a: the native shell (approved 27 Oct 2026)

Stage 5 of [[2026-10-19-ios-launch-june-design]] (Native app) splits in four, each shipping on its own
(founder, 27 Oct): **5a** the native shell, **5b** sign-in by email code in the app, **5c** Sign in with
Apple + Google, **5d** study reminders as local notifications (no push server). This spec is 5a.

## What exists today (27 Oct)

- The real iOS app (`com.certanvil.app`) lives only on the unmerged branch `feat/capacitor-ios-wrapper`
  (2 WIP commits, untested, ADR-004 on that branch): Capacitor 8, `server.url`
  `https://secplus.certanvil.com`, `allowNavigation` `*.certanvil.com`, `errorPath` `native-shell/index.html`,
  UA suffix `CertAnvilApp`; plugins app, browser, haptics, preferences, share, splash-screen, status-bar.
  `TARGETED_DEVICE_FAMILY = "1,2"` (iPad too).
- `native-shell.js` (branch, loaded in `index.html`): sets `html.is-native`; reopens the last cert host via
  Preferences; opens off-site links in the in-app browser; status bar follows the theme; a light haptic on
  answer taps. `dg-system.css` (branch) hides `.a2hs-banner`, pricing links and `.settings-go-pro-btn` under
  `html.is-native`. The landing pages (`certanvil.com`, `/pricing`, `/account`) do not load it.
- The Lift B/C phone screens added Go Pro paths the branch does not hide: Settings' Go Pro row and secondary
  buttons (`features/ios-settings.js`), capped Home's "See Pro" (`features/ios-firstrun.js`), the daily
  limit's "Go Pro for unlimited", Pro tags in the cert sheet.
- Sign-in inside the app is broken (the magic link opens Safari). That is 5b; 5a is tested signed out.
- The free cert lock (`lib/cert-lock.js`) applies to signed-in users only; anonymous users are not locked.

## Founder decisions (27 Oct 2026)

1. **First launch is the cert choice, and the lock is made unmistakable.** A fresh install opens June's cert
   picker (AI-901 label) before any cert loads. A free user who taps **Lock in <cert>** gets June's lock-in
   sheet (reminder 1), and its confirm opens a second sheet (reminder 2) before anything is saved. Once
   locked, a free user cannot study another cert until they go Pro. Pro users pick without either sheet.
2. **Offline:** when the app cannot load at all, its built-in page is June's "You're offline." screen with a
   **Try again** button.
3. Settled with the split: reminders are local notifications (5d).

## The design

**First launch.** `server.url` becomes `https://networkplus.certanvil.com`. On every cert page load,
`native-shell.js` reads Capacitor Preferences; when `chosenCert` is missing (nobody has picked yet, free or
Pro) it opens the Lift C picker through a new native entry, `iosFirstRun.picker({ tier, native: true })`,
called at `DOMContentLoaded`, whatever the onboarding switch says (the switch governs the website; the app is
not public until stage 8). No query flag: a reload after picking finds `chosenCert` and never reopens it.
- **Reminder 1:** June's lock-in sheet, unchanged ("Lock in <cert>?", the three terms, **Lock in <cert>** /
  **Go back**).
- **Reminder 2 (new, drawn into the E2E first):** title "One last check", body "<cert> will be your exam on
  Free. You can't switch to another exam unless you go Pro.", buttons **Yes, lock in <cert>** / **Go back**
  (back to the picker). Same sheet host and motion as reminder 1.
- **Saving:** a new shell hook `window.caNative.choose(certId, { locked })` writes Preferences `chosenCert`,
  `lastCertHost` (that cert's host) and, for a free pick, `lockedCert`, and resolves only when all three
  writes finish. The picker's **Yes, lock in** / **Start with** call it and only then run `goToCert` (so the
  target page's launch check finds the new host and never bounces back). On arrival, a cert page whose cert
  equals `lockedCert` and whose own storage has no free cert writes `STORAGE.FREE_CERT_ID` itself (each
  subdomain has its own storage, and the cloud flush does nothing while signed out). The app then shows that
  cert's day-0 Home; later launches open `lastCertHost`.
- **Holding the lock:** on every cert page load the shell compares the page's cert with `lockedCert`. When they
  differ and the user is not known to be Pro (signed out, or `_quotaState.tier === 'free'`; while the tier is
  unknown for a signed-in user it fails open, as `lib/cert-lock.js` does), it shows the existing lock wall on
  that page through a new export `window._certLock.showWall(here, owned)` (today's private `showWall`; a
  fast-lane lib edit). The wall's **Back to <owned>** returns them; its "Unlock all exams · Pro" link points at
  web pricing and is hidden in the app by the 3.1.1 rule below (intended). Signed-in free users keep today's
  `check()` path. The phone cert sheet keeps its Pro tags.
- **Pro** (signed in, `_quotaState.tier === 'pro'`) picks with **Start with <cert>** and is never locked. In 5a
  everyone in the app is signed out, so Pro paths are covered by Playwright stubs only (Acceptance).

**Purchase links hidden in the app (Guideline 3.1.1)** until stage 6 brings in-app purchase, all under
`html.is-native`: the install banner (`.a2hs-banner`), Settings' Go Pro row and secondaries, capped Home's
"See Pro" card, the daily limit's **Go Pro for unlimited** (the screen keeps **Start a <R>-question set**; with
nothing left it shows only the back control), desktop and landing pricing links. Selectors: `.a2hs-banner`,
`#ios-settings [data-act="gopro"]`, `.ifr-see`, `#ios-check [data-act="limit-pro"]`, `.settings-go-pro-btn`,
`a[href*="certanvil.com/pricing"]`, `a[href*="manage-subscription"]`. The landing site is a separate Vercel
project, so it gets its own small `landing/native-hide.js` (the same `CertAnvilApp` UA test, sets
`html.is-native`) plus the matching hide rules in `landing/`'s stylesheet, loaded by `landing/index.html`,
`landing/pricing.html`, `landing/account.html` and `landing/manage-subscription.html`. The UA test is the one
shared contract; a UAT pins it in both files.

**Offline page** (`native-shell/index.html`; `errorPath` is `index.html` relative to `webDir` `native-shell`): June's offline screen
(`onboarding-loading-states.html?v=offline`) as a self-contained page in the app's light and dark tokens:
glyph, "You're offline.", "Your progress is saved on this device and will sync when you're back. Nothing is
lost, so you can keep going or pick up later.", the "Saved locally, will sync" pill, and **Try again** (reads `lastCertHost`
through the Capacitor bridge, which the local page has; Network+ when it is missing or the read fails). No
inline `onclick`.

**Haptics:** keep the light tick on an answer pick (add the Lift C check's `.ifr-opt`); add one `success`
notification haptic when a quiz, the check or an exam reaches its results. Nothing else vibrates.

**Native project:** `TARGETED_DEVICE_FAMILY = 1` (iPhone only), app name CertAnvil, splash and icon as on the
branch, status bar as on the branch, external links in the in-app browser as on the branch.

## Architecture

- Merge `feat/capacitor-ios-wrapper` into the 5a branch; finish and test its pieces. `native-shell.js` stays a
  self-contained script that does nothing on the website (`CA_NATIVE` false). The first-launch hook and lock
  check live in `native-shell.js`; the picker and sheets reuse `features/ios-firstrun.js` (a new
  `iosFirstRun.confirmLock()` for reminder 2).
- Fast lane: no edits to `auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`, migrations. `ios/` is
  not deployed (build excludes it). `app.js` ratchet held.
- Tests: Playwright with the UA suffix `CertAnvilApp` and a stubbed `window.Capacitor` (Preferences, Haptics,
  Browser) to exercise the native paths; UAT for the pure pieces; the real app built and run on the iPhone 17
  Pro simulator for every state, signed out.

## Process

1. Draw reminder 2 into the June E2E (`feat/cert-ios-e2e`): HUD "5a ›" with `picker`, `lock-in`,
   `last-check`, `offline-native`. Five-stage visual pass. Founder approves in the Simulator.
2. Plan, build, simulator walk-through, one fresh whole-branch review, ship on "ship it".

## Acceptance

- A fresh install (simulator, app data reset) opens the picker on Network+; Lock in → reminder 1 → reminder 2 → day-0 Home
  of that cert; relaunch opens the same cert; Go back on either sheet saves nothing.
- A locked free user who reaches another cert (switcher or URL) is returned to their cert with the lock copy.
- Inside the app no Go Pro / pricing link is visible on Home, Settings, the daily limit, capped Home or the
  landing pages; on the website everything is as today.
- Airplane mode on launch shows June's offline page; Try again reloads the cert.
- iPhone only; light haptic on answer picks; one success haptic at results.
- Pro paths (no sheets, never locked, the late `_quotaState` fail-open) pass under Playwright stubs; the real
  app is checked signed out only until 5b.

## Rejected approaches

- **Open on Security+ (today's shell default):** a new free user would land on a cert that asks for Pro.
- **Open on Network+ with no choice:** the founder wants the cert chosen deliberately, with two warnings.
- **A native "pick your exam" screen outside the web app:** duplicates the approved Lift C picker.
- **Keep the shell's plain offline page:** founder chose June's design.
- **Push notifications:** a server, an APNs key and a token table for what local scheduling covers (5d).

## Related
[[2026-10-19-ios-launch-june-design]] · [[2026-10-26-ios-lift-c-design]] · [[2026-06-07-free-tier-cert-lock-design]] · [[Mobile MOC]]
