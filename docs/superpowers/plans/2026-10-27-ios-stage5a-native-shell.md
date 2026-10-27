---
up: "[[Mobile MOC]]"
type: plan
status: ready
cert: all
updated: 2026-10-27
tags: [plan, mobile, ios, launch, stage-5, native]
---
# Stage 5a (the native shell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The iOS app (`com.certanvil.app`) is merged into `main`, iPhone only, opens on a deliberate cert choice with two reminders before a free exam is locked, holds that lock, shows no web purchase link anywhere inside the app, has June's offline page, and taps lightly on answers and once on results. The website is unchanged.

**Architecture:** Merge `feat/capacitor-ios-wrapper` (Capacitor 8, live site in WKWebView, ADR-004). `native-shell.js` (a plain script in `<head>`, a no-op on the web) gains a small `window.caNative` API over Capacitor Preferences (`choose`, `chosen`) plus the first-launch, lock and haptic hooks. The picker and both sheets stay in `features/ios-firstrun.js`; reminder 2 is a new `iosFirstRun.confirmLock`. The lock wall comes from `lib/cert-lock.js` through a new `showWall` export. The landing project gets its own tiny `landing/native-hide.js`.

**Tech Stack:** Capacitor 8 (iOS, SPM), vanilla JS (IIFE, `window` exports), CSS (`dg-system.css` for `html.is-native` rules, `lift-ios.css` for phone screens), UAT, Playwright (chromium + mobile-safari), Xcode simulator (iPhone 17 Pro).

**Spec:** `docs/superpowers/specs/2026-10-27-ios-stage5a-native-shell-design.md` (approved). E2E: june-e2e `@ 508c8d0c`, HUD "5a ›": `free-cert-picker`, `picker-lock`, `picker-last`, `offline-native` (founder approved, 27 Oct).

## Global Constraints

- Website behaviour and look unchanged: every native path is gated on `window.CA_NATIVE` (Capacitor `isNativePlatform()` or the `CertAnvilApp` UA suffix). No edits to `auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`, migrations. `app.js` stays ≤ 8301 lines (in-place edits only).
- No inline `on*=` anywhere, including `native-shell/index.html`. No literal `nplus_*` writes outside `STORAGE`.
- `dg-system.css?v=` in `index.html` is bumped by hand in the same commit as any `dg-system.css` change (CLAUDE.md §Version bumps).
- Preferences keys (app-wide): `chosenCert` (cert id), `lockedCert` (cert id, free picks only), `lastCertHost` (host).
- Copy, exactly: reminder 2 title "One last check", body "<b><cert></b> will be your exam on Free. You can't switch to another exam unless you go Pro.", buttons "Yes, lock in <cert>" / "Go back". Offline page: "You're offline.", "Your progress is <b>saved on this device</b> and will sync when you're back. Nothing is lost, so you can keep going or pick up later.", pill "Saved locally, will sync", button "Try again". Picker, lock-in sheet: as Lift C.
- Motion: reminder 2 replaces reminder 1 in the same `#ist-sheet` (no second slide); its content enters with an 8px forward slide + 3px blur, .25s on BRAND §6 `--ios-ease`, collapsing to a fade under reduced motion; Go back closes with the sheet's .2s exit.
- Haptics: `impact LIGHT` on an answer pick (`#options .option, .sl-item, .dl-option, .ifr-opt`); `notification SUCCESS` once when `#page-results` or `#page-exam-results` becomes active or `#ios-check` renders `.ifr-score`. Nothing else.
- Hidden under `html.is-native`: `.a2hs-banner`, `#ios-settings [data-act="gopro"]`, `.ifr-see`, `#ios-check [data-act="limit-pro"]`, `.settings-go-pro-btn`, `a[href*="certanvil.com/pricing"]`, `a[href*="manage-subscription"]`.
- Ship as v8.195.0 only on the founder's "ship it".

## Review Focus

1. **The page loses its race with Preferences:** a slow `choose()` must still finish before navigation, and a failed write must not strand the user (navigate anyway after 2s; the next launch reopens the picker). (Task 2 test `choose writes all keys before goToCert navigates`.)
2. **A signed-in user whose tier is still loading** opens another cert: the lock fails open (no wall) until `_quotaState` says free. (Task 2 test `the lock waits for a signed-in tier`.)
3. **Relaunch mid-flow** (picker shown, nothing chosen): the picker opens again; a reload after choosing never does. (Task 2 tests.)
4. **The website** never gets `html.is-native`, never calls Preferences, keeps every Go Pro link. (Task 1 and Task 4 tests on chromium without the UA.)
5. **Offline page Try again with no stored host or no bridge** goes to Network+. (Task 5 test.)

---

### Task 1: Merge the wrapper and set the shell up

**Files:** merge `feat/capacitor-ios-wrapper` (resolve `dg-system.css` by keeping both appended blocks); Modify `capacitor.config.json` (`server.url` `https://networkplus.certanvil.com`), `ios/App/App.xcodeproj/project.pbxproj` (`TARGETED_DEVICE_FAMILY = 1` in both configs), `index.html` (`dg-system.css?v=` bump); Test `tests/uat/508-native-shell.js` (new), `tests/e2e/native-shell.spec.js` (new).
- [ ] **Step 1: UAT** (`508`): config `appId` `com.certanvil.app`, `server.url` networkplus, `allowNavigation` both hosts, `errorPath` `index.html`, `appendUserAgent` `CertAnvilApp`; pbxproj has `TARGETED_DEVICE_FAMILY = 1` and no `"1,2"`; `scripts/build.js` DENY list has `ios`, `native-shell`, `capacitor.config.json`; `index.html` loads `native-shell.js` in `<head>`; `native-shell.js` returns early when not native; `native-shell/index.html` has no `on[a-z]+=`.
- [ ] **Step 2: E2E** (chromium, no UA): `the website never marks html.is-native` and `the website keeps its Go Pro links` (Settings Go Pro row visible at 390, free tier).
- [ ] **Step 3: Run** both → FAIL (no merge yet). **Step 4:** merge, apply the config/pbxproj edits, `npm ci`, `npx cap sync ios`, `xcodebuild` for the simulator → BUILD SUCCEEDED. **Step 5: Run** UAT + E2E → PASS. **Step 6: Commit** `feat(stage5a): merge the native shell, iPhone only, Network+ first`.

### Task 2: `caNative` — first launch, saving the choice, holding the lock, haptics

**Files:** Modify `native-shell.js`, `lib/cert-lock.js` (export `window._certLock.showWall(here, owned)` wrapping today's private wall); Test `tests/e2e/native-shell.spec.js` (stub: `addInitScript` sets `navigator`-independent `window.Capacitor = { isNativePlatform: () => true, Plugins: { Preferences, Haptics, Browser, StatusBar } }` with an in-memory Preferences recording call order, before any page script; `test.use({ userAgent: '... CertAnvilApp' })`).

**Interfaces — Produces:** `window.caNative = { choose(certId, { locked }) -> Promise<void>, chosen() -> Promise<{ chosenCert, lockedCert, lastCertHost }> }`; on `DOMContentLoaded`: no `chosenCert` → `iosFirstRun.picker({ tier, native: true })`; `lockedCert` set, page cert ≠ it, user not known Pro → `_certLock.showWall(CURRENT_CERT, lockedCert)`; page cert = `lockedCert` and no `STORAGE.FREE_CERT_ID` locally → write it. The launch redirect keeps the branch's `lastCertHost` logic.
- [ ] **Step 1: E2E** (390/402, both engines): `a fresh install opens the picker on Network+`; `choose writes all keys before goToCert navigates` (Preferences stub resolves after 300ms; the next page sees `lastCertHost` = secplus and does not bounce); `a reload after choosing never reopens the picker`; `relaunch with nothing chosen reopens the picker`; `a locked free user on another cert sees the lock wall and Back returns them`; `the lock waits for a signed-in tier` (fake session, `_quotaState` unset → no wall; then `tier: 'free'` → wall); `the locked cert's page records the free cert itself`; `a pick taps lightly; results tap once` (Haptics stub call log).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Preferences writes via `Promise.all`, a 2s race before navigation as `goToCert` already does). **Step 4: Run** → PASS; UAT ALL PASS. **Step 5: Commit** `feat(stage5a): first launch, the saved choice and the lock in the app`.

### Task 3: Reminder 2 in the picker flow

**Files:** Modify `features/ios-firstrun.js` (`_ifrLastCheckHtml(m)`, `iosFirstRun.confirmLock(name) -> Promise<boolean>`, `lock-go` → `confirmLock` → `caNative.choose(id, { locked: true })` when native → `goToCert`; Pro `start` → `caNative.choose(id, { locked: false })`), `lift-ios.css` (step-in motion); Test `tests/uat/507-ios-firstrun.js`, `tests/e2e/lift-c.spec.js`.
- [ ] **Step 1: Tests.** UAT: `_ifrLastCheckHtml({name:'A&B'})` has "One last check", the exact body with escaped name, "Yes, lock in A&amp;B", `data-act="last-go"` / `data-act="last-back"`, no `—`. E2E (`?onb=1` web path and the native stub): `Lock in → the last check replaces the sheet in place` (same `#ist-sheet` element stays open; content swaps); `Go back on the last check saves nothing` (no `nplus_freeCertId`, no Preferences write); `Yes, lock in → day-0 of that cert`; `Pro sees neither sheet`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS (whole `lift-c.spec.js` too). **Step 5: Commit** `feat(stage5a): the last check before a free exam is locked`.

### Task 4: No web purchase links inside the app

**Files:** Modify `dg-system.css` (the selector list in Global Constraints under `html.is-native`; bump `?v=`), `features/ios-firstrun.js` (limit screen: with `limit-pro` hidden and nothing left, the foot is empty, so render the back control only), Create `landing/native-hide.js` (UA test → `html.is-native`), Modify `landing/index.html`, `landing/pricing.html`, `landing/account.html`, `landing/manage-subscription.html` (load it in `<head>`), the landing stylesheet (hide pricing links / Go Pro under `html.is-native`); Test `tests/uat/508-native-shell.js`, `tests/e2e/native-shell.spec.js`.
- [ ] **Step 1: Tests.** UAT: the UA token `CertAnvilApp` appears in both `native-shell.js` and `landing/native-hide.js`; every selector of the list is in `dg-system.css` under `html.is-native`. E2E (native stub, 390): `no Go Pro on Settings, capped Home or the daily limit`; `the daily limit with nothing left shows only back`; web (no UA): all three still show.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS. **Step 5: Commit** `feat(stage5a): no web purchase links inside the app (3.1.1)`.

### Task 5: June's offline page in the app

**Files:** Rewrite `native-shell/index.html` (self-contained: June offline markup, light/dark tokens via `prefers-color-scheme`, a `<script>` that wires Try again through `Capacitor.Plugins.Preferences.get({key:'lastCertHost'})`, falling back to `https://networkplus.certanvil.com/`); Test `tests/uat/508-native-shell.js`, `tests/e2e/native-shell.spec.js` (open the file directly).
- [ ] **Step 1: Tests.** UAT: the exact copy, no `on[a-z]+=`, no external fetch. E2E: `Try again goes to the stored cert`; `Try again with no bridge goes to Network+` (assert the navigation target via a stubbed `location.replace`).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS. **Step 5: Commit** `feat(stage5a): June's offline page in the app`.

### Task 6: The real app, side-by-sides and the gate

- [ ] **Step 1:** `npx cap sync ios`; build and install on the iPhone 17 Pro simulator; reset app data; walk: fresh launch → picker on Network+ → Lock in → reminder 1 → reminder 2 → day-0; relaunch → same cert; Settings / capped / limit show no Go Pro; airplane mode (Network Link Conditioner off / `simctl` offline) on launch → offline page → Try again. Screenshot each against the E2E `5a ›` states.
- [ ] **Step 2:** `scripts/lift-sbs.js` screens `s5-picker`, `s5-lock`, `s5-last`, `s5-offline` (native stub) → fix gaps; five-stage visual pass on the build.
- [ ] **Step 3:** Full gate: UAT, tech-debt, every lift spec + `native-shell.spec.js` + `decision-lab.spec.js` + `app.spec.js` on chromium and mobile-safari → green. **Step 4: Commit** `test(stage5a): side-by-sides`.
