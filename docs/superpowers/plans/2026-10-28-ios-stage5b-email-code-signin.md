---
up: "[[Mobile MOC]]"
type: plan
status: ready
cert: all
updated: 2026-10-28
tags: [plan, mobile, ios, launch, stage-5, auth]
---
# Stage 5b (sign in by email code) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inside the iOS app a user signs in (or creates an account) with a 6-digit email code without leaving the app, the account's free exam wins over the phone's pick, and first launch shows June's welcome before the picker; the website modal signs in with the same code.

**Architecture:** A new `features/ios-signin.js` (pure views + one full-screen host `#ios-signin`, `window.iosSignIn`) holds the welcome, sign-in, typo check and code screens and the lock rule. It talks to Supabase only through the existing `window.certanvilSupabase` (`signInWithOtp`, `verifyOtp`) and reads the hydrate through `cloudStore.onStatusChange`; auth-state's own `SIGNED_IN` path does the rest. `native-shell.js` opens the welcome instead of the picker. `landing/auth.js` swaps the magic link for the code on the website.

**Tech Stack:** vanilla JS (IIFE, `window` exports, `data-act` delegation), `lift-ios.css` (phone screens), Capacitor Preferences via `window.caNative`, UAT, Playwright (chromium + mobile-safari) with `tests/fixtures/fake-supabase.js`, Xcode simulator (iPhone 17 Pro).

**Spec:** `docs/superpowers/specs/2026-10-28-ios-stage5b-email-code-signin-design.md` (approved). E2E: june-e2e `@ a345d1da`, HUD "5b ›": `native-welcome`, `signup-signin`, `signin-typo`, `email-code`, `code-wrong`, `code-expired`, `resend-wait`, `code-offline`, `lock-switched` (founder approved, 28 Oct). The drawings (`mockups/onboarding-signup-signin.html`, `onboarding-email-code.html`, `cert-ios-home.html?v=lockswitch`) are the visual source; port their CSS into `lift-ios.css` on the app's tokens, not their markup verbatim.

## Global Constraints

- **Gated lane untouched:** no edits to `auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`, migrations. `app.js` stays ≤ 8301 lines (in-place edits only). No inline `on*=`. No literal `nplus_*` writes outside `STORAGE` (`STORAGE.FREE_CERT_ID`).
- **Native only in the app:** every app path is gated on `window.CA_NATIVE`; on the website (and the phone website) every sign-in caller keeps today's `buildSignInUrl()` navigation.
- **Supabase calls, exactly:** send `certanvilSupabase.auth.signInWithOtp({ email })` (no `emailRedirectTo`, `shouldCreateUser` left at its default); verify `certanvilSupabase.auth.verifyOtp({ email, token, type: 'email' })`. Same on the website.
- **Code:** 6 digits, valid 15 minutes, resend allowed after 60s.
- **Copy, app (verbatim):** welcome "Know when you're ready", **Get started**, line "Sign in with email" (5b; "Sign in with Apple or email" arrives in 5c), **Already have an account? Sign in**. Sign-in title "Sign in or create your account", sub "<b>Free to start.</b> No password to remember.", label "Email", **Continue**, line "We'll email you a 6-digit code.", legal "By continuing you agree to our Terms and Privacy Policy." Typo "Did you mean <b>{fix}</b>?" / **Yes, fix it** / **No, keep mine**. Code: title "Check your email", "We sent a 6-digit code to <b>{email}</b>.", "You can resend in {n}s.", **Resend code**, "We sent a new code.", "Checking…", **Wrong email? Change it**. Errors: "That code isn't right. Check it and try again." / "That code has expired." + **Send a new code** / "Give it a minute, then ask for a new code." / "Couldn't reach CertAnvil. Check your connection and try again." Toast: "Your free exam on this account is <b>{cert name}</b>, so we've opened it."
- **Continue with Apple:** rendered in the sign-in markup with `hidden` (5c removes the attribute). It is never visible or focusable in 5b.
- **Typo domains:** gmial.com, gmai.com, gmail.co, gamil.com → gmail.com; hotmial.com, hotmai.com → hotmail.com; outlok.com, outloo.com → outlook.com; yaho.com, yahooo.com → yahoo.com; iclod.com, icoud.com → icloud.com.
- **Wrong vs expired:** Supabase returns one error for both ("Token has expired or is invalid", `code: 'otp_expired'`). The app decides by the send time it kept: more than 900s since the last successful send → expired copy, else wrong copy.
- **Rate limit / network:** a send error with `status === 429` → the rate-limit line; a thrown error, `status === 0` or `name === 'AuthRetryableFetchError'` on send or verify → the network line, boxes keep the code.
- **Pending sign-in:** `sessionStorage` key `ca_signin_pending` = `{ email, sentAt }`, honoured for 15 minutes; a reload or cert change with it set reopens the code screen.
- **Lock rule (spec §After sign-in):** before `verifyOtp`, `Y` = local `STORAGE.FREE_CERT_ID`, else Preferences `lockedCert`; remove local `STORAGE.FREE_CERT_ID`. Subscribe to `cloudStore.onStatusChange` **before** calling `verifyOtp` (Supabase emits `SIGNED_IN` inside it, so the hydrate can start before it resolves). The first `'syncing'` → `'idle'` after that is "hydrate done"; `X` = local `STORAGE.FREE_CERT_ID` then. X≠Y (both set) → switch + toast; X only or X=Y → Preferences take X; Y only → `onbFirstRun.persistFreeCert(Y)`; neither → picker. `'error'` or no idle within 15s → no writes at all.
- **Pro:** `window._quotaState.tier === 'pro'` → `pdel('lockedCert')` through `caNative`; unknown tier → nothing changes.
- **Preferences keys:** existing `chosenCert`, `lockedCert`, `lastCertHost`; new `lockToast` (cert id, one-time).
- **Motion:** BRAND §6 `--ios-ease` (`cubic-bezier(0.16, 1, 0.3, 1)`). Screens open with the iOS sheet's existing full-screen slide; content reveals stagger 40ms, 500ms, `backwards` fill from hidden; typo card rises 320ms; wrong code: `.bad` + `.shake` (320ms, reflow before re-adding), shake on `#isi-boxes`, reveal on its wrapper; toast in 340ms, out 220ms at 5s. All collapse to fade under `prefers-reduced-motion`. No new `:has(#x:not(:empty))`.
- **`lift-ios.css?v=`** bumped by hand in `index.html` with any `lift-ios.css` change.
- **Ships as a PR** (auth surface); version on the founder's "ship it". Before the founder's preview sign-in test, the founder sets Supabase OTP length 6 + expiry 900s (spec Supabase step 1).

## Review Focus

1. **The hydrate starts before `verifyOtp` resolves**, so a listener attached after it misses `'syncing'` and the lock rule never runs. (Task 3 test `the lock rule runs when the hydrate starts inside verifyOtp`.)
2. **The 5a record step pushes the phone's pick over the account's:** `native-shell.js` writes local `FREE_CERT_ID` on the locked cert's page, and the flush then overwrites `X`. The record must wait for `_certanvilSignedIn === false`. (Task 3 test `a signed-in user's page never records the phone's pick`.)
3. **A relaunch mid-code** returns to the code screen with the email, not the welcome; after 15 minutes it doesn't. (Task 2 test `a pending code survives a reload for 15 minutes`.)
4. **Paste / one-time-code autofill** of all six digits into the first box fills every box and submits once. (Task 2 test `pasting six digits fills the boxes and submits once`.)
5. **The website stays a website:** no `#ios-signin`, no welcome, every sign-in link still goes to `certanvil.com/?action=signin`. (Task 4 test `the website keeps the certanvil.com sign-in link`.)

---

### Task 1: The views, and a fake Supabase that can sign in

**Files:** Create `features/ios-signin.js` (views only in this task), `tests/uat/509-ios-signin.js`; Modify `tests/fixtures/fake-supabase.js`, `index.html` (`<script defer src="features/ios-signin.js"></script>` after `ios-firstrun.js`, and `<div id="ios-signin" hidden></div>` next to `#ios-firstrun`'s host).

**Interfaces — Produces:**
- `_isiWelcomeHtml() -> string`, `_isiSignInHtml({ email, typo }) -> string` (`typo` = `{ fix }` or null), `_isiCodeHtml({ email, left, msg, kind, expired }) -> string` (`kind` ∈ `'' | 'err' | 'ok'`), `_isiToastHtml(certName) -> string`, `_isiSuggest(email) -> string | null` — globals, for UAT.
- Element hooks: `[data-act="start" | "signin" | "back" | "continue" | "fix-yes" | "fix-no" | "resend" | "send-new" | "change"]`, `#isi-email`, `#isi-boxes input` ×6 (first has `autocomplete="one-time-code"`, all `inputmode="numeric"`), `#isi-msg` (`role="alert"`), `#isi-resend`.
- Fake: `__FAKE_SB.signedOut` starts with no session; `auth.verifyOtp({ token })`: `'123456'` → sets the session, emits `SIGNED_IN`, resolves `{ data: { session }, error: null }`; any other token → `{ error: { message: 'Token has expired or is invalid', code: 'otp_expired', status: 403 } }`. `__FAKE_SB.otpStatus` (429 / 0) makes `signInWithOtp` return that status; `__FAKE_SB.verifyThrows` makes `verifyOtp` reject. `__FAKE_SB.accountFreeCert` sets `profile.metadata.freeCertId`; `__FAKE_SB.tier` drives the quota RPC's `tier`. `__fakeLog` records `auth:otp:<email>:<hasRedirect>` and `auth:verify:<token>`.

- [ ] **Step 1: UAT** (`509`): each view contains its copy verbatim from Global Constraints; the Apple button exists and has `hidden`; the welcome line reads "Sign in with email" and not "Apple"; `_isiSuggest('sam@gmial.com') === 'sam@gmail.com'`, every listed domain maps, `_isiSuggest('sam@gmail.com') === null`, `_isiSuggest('nope') === null`; `_isiCodeHtml({ expired: true })` has **Send a new code** and no `#isi-resend`; no view has `on[a-z]+=`; `index.html` loads `features/ios-signin.js` and has `#ios-signin`.
- [ ] **Step 2: Run** `node tests/uat.js 2>&1 | tail -5` → the 509 block FAILS. **Step 3:** implement the views and the fake. **Step 4: Run** UAT → ALL PASS; `npx playwright test tests/e2e/lift-5a.spec.js` still PASS (fixture change is additive). **Step 5: Commit** `feat(stage5b): sign-in views and a fake Supabase that verifies codes`.

### Task 2: The sign-in host: email, typo check, code, errors, resend

**Files:** Modify `features/ios-signin.js` (host + `window.iosSignIn`), `lift-ios.css` (screens, boxes, typo card, toast, motion), `index.html` (`lift-ios.css?v=`); Test `tests/e2e/lift-5b.spec.js` (new: the Capacitor stub + `CertAnvilApp` UA from `lift-5a.spec.js`, `__FAKE_SB.signedOut = true`, 402×874).

**Interfaces — Consumes:** Task 1 views and hooks. **Produces:** `window.iosSignIn = { open({ from }) -> void, welcome() -> void, close() -> void }`; `from` ∈ `'welcome' | 'home' | 'settings' | 'custom' | 'diagnostic'`; `'welcome'` makes **back** return to the welcome, anything else closes the host. On a successful verify the host calls `iosSignIn._afterVerify` (Task 3; a no-op stub that closes the host in this task).

- [ ] **Step 1: E2E:**
  - `Continue sends a code with no redirect` → `__fakeLog` has `auth:otp:sam@example.test:false`; the code screen shows "We sent a 6-digit code to sam@example.test." and "You can resend in 60s."
  - `a typo is caught before sending` (`sam@gmial.com` → "Did you mean sam@gmail.com?", no `auth:otp` yet; **Yes, fix it** sends to `sam@gmail.com`; **No, keep mine** sends to `sam@gmial.com`).
  - `the sixth digit submits` (type `123456` → `auth:verify:123456` once).
  - `pasting six digits fills the boxes and submits once` (fill first box with `123456`).
  - `a wrong code clears the boxes and says so` (`111111` → "That code isn't right. Check it and try again.", all boxes empty, first focused).
  - `an old code reads as expired` (clock +901s via `page.clock`, `111111` → "That code has expired.", **Send a new code** visible, resend line hidden; tapping it → `auth:otp` again, "We sent a new code.").
  - `Resend unlocks after 60s` (clock +60s → **Resend code**; tap → `auth:otp`, countdown back to 60).
  - `a refused send says give it a minute` (`otpStatus: 429`).
  - `no connection keeps the code` (`verifyThrows` → network line, boxes still hold the digits).
  - `a pending code survives a reload for 15 minutes` (reload → code screen with the email; clock +901s + reload → no code screen).
  - `Wrong email? Change it returns to the email, filled in`.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/lift-5b.spec.js` → FAIL. **Step 3: Implement** (countdown from the kept `sentAt`, not a free-running counter, so a reload shows the true time left). **Step 4: Run** → PASS on chromium and mobile-safari; UAT ALL PASS. **Step 5: Commit** `feat(stage5b): sign in with a 6-digit code inside the app`.

### Task 3: The lock rule after sign-in

**Files:** Modify `features/ios-signin.js` (`_afterVerify`), `features/ios-firstrun.js` (export `IFR.goToCert = goToCert`), `native-shell.js` (record step waits for signed-out; `lockToast` shown once on load; `caNative.forget(key)` → `pdel`), `lib/cert-lock.js` (`check()` falls back to local `STORAGE.FREE_CERT_ID`); Test `tests/e2e/lift-5b.spec.js`, `tests/uat/509-ios-signin.js`.

**Interfaces — Consumes:** `caNative.choose(id, { locked })`, `caNative.chosen()`, `onbFirstRun.persistFreeCert(id)`, `iosFirstRun.goToCert(id)`, `iosFirstRun.picker({ tier, native: true })`, `cloudStore.onStatusChange(cb) -> unsubscribe`, `window._quotaState.tier`, `certanvilRouter.currentCert(tier, profile, detected)`. **Produces:** `iosSignIn._afterVerify({ y }) -> Promise<void>`; `caNative.forget(key) -> Promise<void>`; Preferences `lockToast`.

- [ ] **Step 1: E2E** (Preferences stub pre-seeded per test):
  - `account Netplus vs phone Secplus opens Netplus with the toast once` (`accountFreeCert: 'netplus'`, Preferences `lockedCert: 'secplus'` → Preferences `lockedCert`/`chosenCert` = netplus, navigation to Network+ (`?cert=netplus` on localhost), toast text exact; a reload shows no toast).
  - `the account keeps Netplus after the flush` (the fake's last `profiles` update has `metadata.freeCertId === 'netplus'`).
  - `an account with no free exam takes the phone's pick` (no `accountFreeCert`, `lockedCert: 'secplus'` → profile update has `freeCertId: 'secplus'`, no toast).
  - `the lock rule runs when the hydrate starts inside verifyOtp` (the fake emits `SIGNED_IN` before `verifyOtp` resolves).
  - `a failed hydrate writes nothing` (fake `profiles` select errors → Preferences unchanged, no `freeCertId` written).
  - `Pro drops the app lock` (`tier: 'pro'` → `lockedCert` removed, `chosenCert` kept).
  - `a signed-in user's page never records the phone's pick` (signed in, `lockedCert: 'secplus'` on Security+, no local `FREE_CERT_ID` → still none after 2s).
  - `sign in from the welcome opens the account's cert` (nothing chosen, `accountFreeCert: 'netplus'` → Network+ Home, no picker); `…or the picker when the account has none`.
  - `a signed-in free user on the wrong cert gets the cert-lock wall` (local `FREE_CERT_ID` netplus on Security+, profile without metadata → wall).
- [ ] **Step 2: UAT:** `native-shell.js` record step is guarded by `_certanvilSignedIn === false`; `lib/cert-lock.js` `check()` reads `STORAGE.FREE_CERT_ID`; `features/ios-signin.js` subscribes to `onStatusChange` before it calls `verifyOtp` (source order check).
- [ ] **Step 3: Run** both → FAIL. **Step 4: Implement.** **Step 5: Run** lift-5b, lift-5a, lift-c → PASS; UAT ALL PASS. **Step 6: Commit** `feat(stage5b): the account's free exam wins on sign-in`.

### Task 4: First launch and every sign-in in the app

**Files:** Modify `native-shell.js` (no `chosenCert` and no pending sign-in → `iosSignIn.welcome()`; pending → `iosSignIn.open({ from: 'welcome' })`), `features/ios-signin.js` (**Get started** → `iosFirstRun.picker({ tier, native: true })`; a capture-phase click on `a.topbar-signin-pill` or any `a[href^="https://certanvil.com/?action=signin"]` → `open({ from: 'home' })` when `CA_NATIVE`; `iosSignIn.go(from)` = native ? `open({ from })` : `location.href = buildSignInUrl()`), `features/ios-home.js:282`, `features/ios-custom.js:312`, `features/ios-settings.js:263`, `features/diagnostic.js:880`, `app.js:4442` (each becomes `iosSignIn.go('<from>')` with today's navigation as the fallback when `iosSignIn` is absent; app.js in place, same line); Test `tests/e2e/lift-5b.spec.js`, `tests/e2e/lift-5a.spec.js` (first-launch test now expects the welcome, then the picker after **Get started**).

- [ ] **Step 1: E2E:** `a fresh install shows the welcome`; `Get started opens the picker and both reminders as in 5a`; `Already have an account opens sign-in, and back returns to the welcome`; `Sign in from Home, Settings, Custom quiz and the diagnostic stays in the app` (each opens `#ios-signin`, no navigation); `the website keeps the certanvil.com sign-in link` (no UA/stub: Home's **Sign in** navigates to `certanvil.com/?action=signin…`, `#ios-signin` never shown, no welcome).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** lift-5b, lift-5a, lift-c, the B4 Settings spec → PASS; UAT + tech-debt PASS. **Step 5: Commit** `feat(stage5b): June's welcome first, and sign-in never leaves the app`.

### Task 5: The website signs in with the code

**Files:** Modify `landing/auth.js` (`sendMagicLink` → `sendCode(email)`: `signInWithOtp({ email })`; the sent state becomes the code screen with the same six boxes, countdown, errors and wrong/expired rule as the app, via the `hold-otp` (922aa031) verify handler pattern; on verify, redirect to the stashed `return=` as today), `landing/index.html` (sent state: "Check your email", "We sent a 6-digit code to", the boxes, `#auth-otp-error`, Resend / Use different email; foot copy "We sign you in with a one-time code because <em>passwords break, and password resets break more</em>."), `landing/pricing.html` (the orphan sent state replaced by the same markup as `index.html`, same ids), `landing/styles.css` (boxes in the modal's styling); Test `tests/e2e/landing-code-signin.spec.js` (new, fake Supabase on the landing page), `tests/uat/509-ios-signin.js`.

- [ ] **Step 1: UAT:** no landing HTML contains "Check your inbox", "sign-in link", "one-click" or "magic link"; `landing/auth.js` contains no `emailRedirectTo`; `pricing.html` and `index.html` share the sent-state ids.
- [ ] **Step 2: E2E:** `Continue sends a code with no redirect`, `the right code signs in and returns to return=`, `a wrong code says so`, `an old code reads as expired`, on `index.html` and `pricing.html`.
- [ ] **Step 3: Run** → FAIL. **Step 4: Implement.** **Step 5: Run** → PASS; UAT ALL PASS. **Step 6: Commit** `feat(stage5b): the website signs in with the same code`.

### Task 6: PR and the preview check

- [ ] **Step 1:** full suite (`TZ=UTC node tests/uat.js`, tech-debt, `npx playwright test` with the private config) → green; record results in the ledger.
- [ ] **Step 2:** simulator check against a local build (E2E-style, the app pointed at localhost with the fake): welcome → sign in → code → Home; wrong code; Settings sign-in stays in the app. Screenshots to the PR.
- [ ] **Step 3:** push `feat/stage5b`, open the PR, bind it (ccd_pr). Founder sets Supabase OTP length 6 + expiry 900s, then runs the preview sign-in with their test address (we never sign in to real services). Ship on "ship it"; after ship, the founder switches the Magic Link and Confirm signup templates to `{{ .Token }}` only; the cross-subdomain lock rule and relaunch are checked on prod in the simulator.
