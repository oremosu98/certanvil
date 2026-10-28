---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-28
tags: [spec, mobile, ios, launch, stage-5, auth]
---
# Stage 5b: sign in with an email code (approved 28 Oct 2026)

Stage 5 of [[2026-10-19-ios-launch-june-design]] splits into 5a (native shell, shipped v8.195.0), **5b** (this:
sign-in by email code), 5c (Sign in with Apple + Google), 5d (local reminders).

## Why

- In the iOS app, today's magic link opens Safari, not the app, so nobody can sign in inside it.
- `hold-otp` (922aa031, never merged) learned that Supabase ties the email's link and its code to one token:
  using either burns both, and Microsoft Safe Links pre-scans links on arrival, which burns both before an
  Outlook user opens the email. An email that carries a link can never give a reliable code.

## What exists today (28 Oct)

- **Website:** the `certanvil.com` modal (`landing/index.html`, `landing/auth.js` `sendMagicLink` →
  `signInWithOtp({ email, options: { emailRedirectTo } })`, PKCE), sent state "Check your inbox" / "It expires
  in 1 hour." Orphan code-entry markup in `landing/pricing.html` ("Verify code →") with no JS.
- **Cert app:** `auth-state.js` `buildSignInUrl()` → `https://certanvil.com/?action=signin&return=…`; the phone
  callers (`features/ios-home.js`, `features/ios-settings.js`, `features/ios-custom.js`, `features/diagnostic.js`,
  `app.js` fallback) navigate there. The session is a cookie on `.certanvil.com` (`lib/supabase.js`), shared by
  every subdomain in the app's one WKWebView.
- **Supabase:** 8-digit codes, 1-hour expiry, emails carry the link (dashboard only; no `config.toml`).
- **App lock (5a):** Preferences `chosenCert` / `lockedCert` / `lastCertHost` via `window.caNative`
  (`native-shell.js`); signed-in users are `lib/cert-lock.js`'s (it reads the account's `freeCertId`).

## Founder decisions (28 Oct 2026)

1. **Codes everywhere.** Website and app both sign in with a code; the email carries the code only, no link.
2. **6 digits, valid 15 minutes.**
3. **Welcome first.** First launch shows June's welcome; **Get started** opens the 5a picker, **Already have an
   account? Sign in** signs in and opens the account's cert.
4. **The account's lock wins.** If the account already has a free exam different from this phone's pick, the
   app switches to the account's and says so once; if the account has none, this phone's pick is saved to it.
5. **Sign in with Apple lands in 5c with Google.** The 5b screens are drawn with the Apple button so 5c only
   switches it on; in 5b the build shows the email path only.

## The design

**App, first launch** (no `chosenCert`): June's welcome replaces the 5a direct-to-picker.
- **Welcome** (`onboarding-native-welcome`): "Know when you're ready", **Get started** → the 5a picker (both
  reminders, unchanged), **Already have an account? Sign in** → sign-in. The "Sign in with Apple or email" line
  reads "Sign in with email" until 5c.
- **Sign-in** (one screen; June's Create account / Sign in toggle and password field are dropped because a
  code signs in and creates the account alike): title "Sign in or create your account", **Continue with Apple**
  (drawn, hidden until 5c), the email field, **Continue**, a line "We'll email you a 6-digit code." Email typo
  check (June's "Did you mean you@gmail.com?" with **Yes, fix it** / **No, keep mine**) runs on Continue for the
  common domains.
- **Code** (new): "Check your email", "We sent a 6-digit code to <b>email</b>.", six boxes (`inputmode=numeric`,
  `autocomplete=one-time-code`, paste fills all six), auto-submit on the sixth digit, **Resend code** after a 60s
  countdown ("You can resend in 60s."; Supabase refuses a second code to the same address within about 60s, and
  that refusal reads "Give it a minute, then ask for a new code."), **Wrong email? Change it**. The pending email
  is kept in `sessionStorage` for 15 minutes, so a relaunch or a cert change while the code screen is open
  returns to it. Errors: "That code isn't right. Check it
  and try again." (boxes clear, focus first); "That code has expired." with **Send a new code**; a network
  failure keeps the code and shows "Couldn't reach CertAnvil. Check your connection and try again."
- **After sign-in** (`verifyOtp({ email, token, type: 'email' })` on the existing `window.certanvilSupabase`):
  auth-state's own `SIGNED_IN` path hydrates as today. The lock rule needs the account's value to survive that
  hydrate, which only fills keys the device does not already have and then flushes every local key up:
  - **Before `verifyOtp`** the sign-in host sets the phone's pick aside (`Y` = local `STORAGE.FREE_CERT_ID`,
    else Preferences `lockedCert`) and removes the local `STORAGE.FREE_CERT_ID`, so the hydrate fills the
    account's value `X` (from `profiles.metadata.freeCertId`) and the flush cannot overwrite it with Y.
  - **After the first cloud hydrate completes** (cloud-store's status listener), the account's value is read
    from local `STORAGE.FREE_CERT_ID`:
    - X set and Y set, X ≠ Y → Preferences `lockedCert`/`chosenCert`/`lastCertHost` take X, the app opens X, and
      a one-time toast says "Your free exam on this account is <X>, so we've opened it.";
    - X set, no Y (or X = Y) → Preferences take X; nothing to say;
    - no X, Y set → `persistFreeCert(Y)` (it flushes now that the user is signed in) and Preferences keep Y;
    - neither → the picker, once the account's cert is unknown.
  - **Pro:** the tier comes from `window._quotaState.tier` (the quota RPC), not the router's role stub. When it
    reads `pro`, Preferences `lockedCert` is cleared; until it is known nothing changes (signed-in users are never
    walled by the shell, so a pending `lockedCert` has no effect while signed in).
  Sign in from the welcome (nothing chosen yet) skips the picker and opens the account's cert (`freeCertId`,
  else the last cert with data, else the picker).
- **Sign in elsewhere in the app** (Home, Settings' account card, Custom quiz, the diagnostic) opens the same
  in-app screens when `CA_NATIVE`, never Safari or `certanvil.com`.

**Website:** the `certanvil.com` modal keeps its look. "Continue with email" sends the code
(`signInWithOtp` without `emailRedirectTo`); the sent state becomes the same code screen (copy and errors as
above, the modal's styling), then returns to `return=` as today. `landing/pricing.html`'s orphan code markup is
removed. Google stays "Soon" until 5c.

**Supabase (founder), in two steps:**
1. **Before the preview test:** OTP length 6, expiry 900s. Today's link flow is unaffected (the link in the
   email keeps working), and the new screens get the 6-digit code they expect.
2. **Right after the ship:** the Magic Link and Confirm signup email templates show `{{ .Token }}` only (no
   link). New addresses get Confirm signup (`shouldCreateUser` defaults to true); `type: 'email'` verifies both.

**Signed-in lock (a 5a gap, fixed here):** `auth-state.js` loads the profile without `metadata`, so
`lib/cert-lock.js` `check()` never sees an account's `freeCertId` and cannot wall a signed-in free user on the
wrong cert. `check()` falls back to local `STORAGE.FREE_CERT_ID`, which `_onbRoute` sees after the hydrate
(fast lane; `auth-state.js` untouched).

## Architecture

- App screens in a new `features/ios-signin.js` (pure views + one host `#ios-signin`, full screen), opened by
  `iosSignIn.open({ from })`. `native-shell.js` opens the welcome instead of the picker on first launch.
  Phone sign-in callers call `iosSignIn.open()` when `CA_NATIVE` (else today's URL).
- **No edits to `auth-state.js` or `lib/supabase.js`**: the client already supports `signInWithOtp` /
  `verifyOtp`, and auth-state reacts to `SIGNED_IN`. `cloud-store.js` untouched (the lock save uses
  `persistFreeCert` + `cloudStore.flush`).
- Landing: `landing/auth.js` (code send + verify, reusing `hold-otp`'s verify handler), `landing/index.html`
  (sent-state markup), `landing/pricing.html` (orphan removal).
- **Shipped as a PR** (auth surface). What the Vercel preview proves: the website's code flow and the app's
  sign-in screens and errors, signed in for real with the founder's test address. A preview runs on
  `*.vercel.app`, so the session is per-origin (no `.certanvil.com` cookie) and it talks to the production
  Supabase project (the test sign-in creates a real production user). What is checked after merge, on prod in
  the simulator: the cross-subdomain lock rule (account X vs phone Y) and relaunch. Tests: UAT for pure views;
  Playwright with `tests/fixtures/fake-supabase.js` extended with `signInWithOtp`, `verifyOtp` (right, wrong,
  expired, rate-limited) that sets the session and emits `SIGNED_IN` to listeners, plus a metadata
  `freeCertId` the hydrate fills.

## Process

1. Draw into the June E2E: HUD "5b ›" with `welcome`, `signin` (Apple button visible, marked 5c),
   `typo`, `code`, `code-wrong`, `code-expired`, `resend-wait`, `lock-switched` (the toast). Five-stage visual
   pass. Founder approves in the Simulator.
2. Plan, build, preview sign-in test, one fresh whole-branch review, ship on "ship it", then the founder flips
   the Supabase settings.

## Acceptance

- App: a fresh install shows the welcome; Get started → picker → day-0 as in 5a; Sign in → email → code →
  signed in, the account's cert open; a wrong code, an expired code and a resend all behave as above; Sign in
  from Home or Settings never leaves the app.
- Lock: account X vs phone Y → X opens with the one-time toast and the account still holds X after the
  flush; account none + phone Y → the account now has Y; Pro → no lock. A signed-in free user on the wrong
  cert gets the cert-lock wall.
- Website: Continue → code screen → signed in and returned; no "Check your inbox" link copy remains.
- After the founder's flip: the email shows a 6-digit code and no link; an Outlook address signs in.

## Later stages

- **5c:** Sign in with Apple (native plugin, entitlement, Services ID + key, Supabase provider) and Google, on
  the screens drawn here.
- Not built: June's "welcome back" screen and the "account already exists" error (a code makes both
  unnecessary).

## Rejected approaches

- **Link + code in one email:** Safe Links scanning burns the code for Outlook users, in the app too.
- **Codes in the app only:** impossible with one shared email template.
- **Keep June's Create account / Sign in toggle and passwords:** there are no passwords; a code does both.
- **Picker first, sign-in only in Settings:** returning users would pick a cert before they could sign in.
- **This phone's lock wins:** quietly undoes a lock confirmed on the web.
- **Apple in 5b:** blocks the email fix on Apple credentials; drawn now, switched on in 5c.
- **Editing auth-state.js to host sign-in:** not needed; the existing client and SIGNED_IN path suffice.
- **Running the lock rule after the hydrate as-is:** the hydrate keeps the phone's local value and flushes it
  over the account's, which is the rejected "phone wins".
- **Accepting 8-digit codes until the flip:** six boxes cannot hold them; the length change goes first instead.

## Related
[[2026-10-27-ios-stage5a-native-shell-design]] · [[2026-10-19-ios-launch-june-design]] · [[2026-06-07-free-tier-cert-lock-design]] · [[Mobile MOC]]
