---
up: "[[Mobile MOC]]"
type: plan
status: ready
cert: all
updated: 2026-10-28
tags: [plan, mobile, ios, launch, stage-5, auth]
---
# Stage 5c (Sign in with Apple and Google) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** People sign in or create an account with Apple or Google in the iOS app (native sheets) and on certanvil.com (redirect), add Apple or Google to an existing account from iOS Settings, and an Apple-linked account's Apple grant is revoked when it is deleted.

**Architecture:** `native-shell.js` wraps `@capgo/capacitor-social-login` as `caNative.social(provider, opts)`; `features/ios-signin.js` turns its identity token into a session with `signInWithIdToken` inside the 5b `_beforeVerify` / `_afterVerify` wrapper. iOS Settings gains Sign-in methods (`linkIdentity` with the native token). `features/home.js` asks Apple once more before scheduling deletion and posts the code to a new `landing/api/apple-revoke.js`. The landing modal adds the two buttons on `signInWithOAuth`, returning to the landing page, which then bounces to `return=`.

**Tech Stack:** Capacitor 8 + `@capgo/capacitor-social-login` 8.7.5, supabase-js 2.105.3 (UMD), vanilla JS (IIFE, `window` exports), Vercel serverless (Node, `landing/api`), UAT, Playwright with `tests/fixtures/fake-supabase.js` and the lift-5b Capacitor stub, Xcode simulator.

**Spec:** `docs/superpowers/specs/2026-10-28-ios-stage5c-apple-google-signin-design.md` (approved, review fixes db58003b). E2E: june-e2e `@ a89ace6e`, HUD "5c ›": `native-welcome`, `signup-signin`, `signin-provider-error`, `st-methods`, `st-methods-added`, `st-methods-exists`, `st-delete-apple` (founder approved, 28 Oct). Visual source: `mockups/onboarding-signup-signin.html`, `mockups/cert-ios-settings.html` (`?v=methods*`, `?v=delete-apple`).

## Global Constraints

- **Gated lane untouched:** no edits to `auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`, migrations. `app.js` stays ≤ 8301 lines (in-place only). No inline `on*=`. No literal `nplus_*` writes outside `STORAGE`.
- **Plugin pinned:** `@capgo/capacitor-social-login` exactly `8.7.5` (peer `@capacitor/core >=8.0.0`). Reached in the page as `window.Capacitor.Plugins.SocialLogin`, only through `caNative.social`.
- **Native only in the app:** provider buttons and Sign-in methods render only when `CA_NATIVE` and `caNative.social` exist **and** the client IDs are configured (`SOCIAL.googleIOS`, `SOCIAL.googleWeb` non-empty for Google; Apple needs no client ID in the app). Elsewhere the 5b screens are unchanged.
- **Client IDs (public, not secrets):** `native-shell.js` constant `SOCIAL = { googleIOS: '', googleWeb: '' }`, filled from the founder's Google Cloud clients in Task 6. Empty → the Google button and the Google row stay hidden (no broken button ships).
- **Supabase calls, exactly:** `signInWithIdToken({ provider: 'apple', token, nonce })` (raw nonce), `signInWithIdToken({ provider: 'google', token[, nonce] })`, `linkIdentity({ provider, token[, nonce] })`, website `signInWithOAuth({ provider, options: { redirectTo } })`.
- **Nonce contract (decided in Task 1 from the plugin's `definitions.d.ts`, ledgered):** raw = 32 random bytes hex (`crypto.getRandomValues`); hashed = SHA-256 hex (`crypto.subtle.digest`). If the plugin's Apple option takes a pre-hashed nonce → pass hashed to the plugin; if it hashes itself → pass raw. Supabase always gets raw. Same rule for Google if the plugin supports a Google nonce; if not, Google runs without one and Task 6 asks the founder for "Skip nonce check".
- **Copy, exactly:** welcome line "Sign in with Apple, Google or email"; buttons "Continue with Apple", "Continue with Google"; sheet failure "Apple sign-in didn't finish. Try again, or use your email." / "Google sign-in didn't finish. Try again, or use your email."; Settings row "Sign-in methods" (value "Email", "Email, Apple", "Email, Google", "Email, Apple, Google"); sheet title "Sign-in methods", sub "Any of these opens this account.", rows "Email code" (On), "Apple", "Google" with **Add** / "Connected"; link exists "That Apple ID already has its own CertAnvil account. To use it, sign out and continue with Apple." / "That Google account already has its own CertAnvil account. To use it, sign out and continue with Google."; other link error "Couldn't add Apple. Try again." / "Couldn't add Google. Try again."; note "Signed up with Apple's Hide My Email? Add Apple here so both open this account."; delete note "You sign in with Apple, so Apple will ask you to confirm. That also stops CertAnvil using your Apple ID."
- **Cancel = silence:** a cancelled sheet (plugin rejection mapped to `{ cancelled: true }`) shows nothing and changes nothing.
- **Wrapper order:** `_beforeVerify` only after a token is in hand; `_verifyFailed(y)` on any `signInWithIdToken` error; `_afterVerify(y)` on success. Linking never uses the wrapper.
- **Apple revoke:** endpoint refuses unless the code's `id_token.sub` equals the account's Apple `provider_id`; deletion always proceeds; outcomes logged to `client_errors` as `apple-revoke: ok | cancelled | failed | sub-mismatch`.
- **Website:** `redirectTo` = `location.origin + location.pathname + '?action=signin&return=' + encodeURIComponent(<stashed return or ''>)`; provider buttons hidden under `html.is-native`; errors from `?error_description=` reopen the modal with the failure line.
- **Motion:** none new beyond the existing sheet timings (stage 2 decision). **`lift-ios.css?v=`** / **`landing` stylesheet** bumped by hand with any CSS change. **Ships as a PR**; a new app binary carries the plugin.

## Review Focus

1. **Double-hashed or missing nonce** → Supabase "Nonces mismatch": the person taps Apple and nothing happens. (Task 2 test `the Apple sheet gets the plugin's nonce form and Supabase the raw one`.)
2. **The phone's free cert lost on a cancelled sheet** (wrapper run too early). (Task 2 test `a cancelled sheet keeps the phone's pick`.)
3. **A Hide My Email user taps Add Apple on an Apple ID that is already an account** → a raw error or a silent merge. (Task 3 test `an Apple ID that is already an account shows the defined message`.)
4. **A family iPad revokes someone else's grant** (sub mismatch). (Task 4 test `a code for a different Apple ID is refused and nothing is revoked`.)
5. **Web provider buttons inside the app's web view** → Google `disallowed_useragent`. (Task 5 test `the landing page in the app shows no provider buttons`.)

---

### Task 1: The plugin and `caNative.social`

**Files:** `package.json` (dependency `@capgo/capacitor-social-login: 8.7.5`), `ios/` (via `npx cap sync ios`: plugin; `ios/App/App/App.entitlements` with `com.apple.developer.applesignin = [Default]`, `CODE_SIGN_ENTITLEMENTS` in both App configs; `Info.plist` `CFBundleURLTypes` entry for the reversed iOS client ID, value from `SOCIAL.googleIOS`, added in Task 6), `native-shell.js`; Test `tests/uat/510-ios-social.js` (new), `tests/e2e/lift-5c.spec.js` (new; the lift-5b stub plus `Plugins.SocialLogin`).

**Interfaces — Produces:** `caNative.social(provider: 'apple'|'google', opts: { nonce?: string, scopes?: string[] }) -> Promise<{ idToken: string, authorizationCode?: string, givenName?: string, familyName?: string }>`, rejecting `{ cancelled: true }` on user cancel and `{ cancelled: false, message }` otherwise; `caNative.socialReady(provider) -> boolean` (plugin present, and for Google both client IDs set). Initialises the plugin once (`initialize({ apple: { clientId: 'com.certanvil.app' }, google: { iOSClientId: SOCIAL.googleIOS, iOSServerClientId: SOCIAL.googleWeb } })`; Google omitted while IDs are empty).

- [ ] **Step 1:** `npm i -E @capgo/capacitor-social-login@8.7.5` (Node 22 for `cap`), `npx cap sync ios`; read `node_modules/@capgo/capacitor-social-login/dist/esm/definitions.d.ts` for the Apple and Google login options (`nonce`) and the cancel error shape; ledger the **nonce contract** and the **cancel signature** as a ruling.
- [ ] **Step 2: UAT** (`510`): `package.json` pins `"@capgo/capacitor-social-login": "8.7.5"`; `App.entitlements` has `com.apple.developer.applesignin`; `native-shell.js` defines `SOCIAL` and `caNative.social` / `caNative.socialReady`, and only `native-shell.js` names `SocialLogin`; `scripts/build.js` still excludes `ios`.
- [ ] **Step 3: E2E:** `social returns the plugin's token`; `a cancelled sheet rejects with cancelled: true`; `socialReady('google') is false while the client IDs are empty`.
- [ ] **Step 4: Run** → FAIL. **Step 5: Implement.** **Step 6: Run** → PASS; `xcodebuild` simulator build → SUCCEEDED; lift-5a/5b green. **Step 7: Commit** `feat(stage5c): the social-login plugin behind caNative.social`.

### Task 2: Apple and Google on the sign-in screen

**Files:** `features/ios-signin.js` (`_isiSignInHtml` gains `{ apple, google, providerErr }`; `_isiWelcomeHtml` line; `IS._provider(name)`; nonce helpers `_isiNonce() -> { raw, hashed }` async), `lift-ios.css` (`.isi-google`, `.isi-perr`, from the drawing), `index.html` (`lift-ios.css?v=`), `tests/fixtures/fake-supabase.js` (`signInWithIdToken` records `{provider, token, nonce}`, `__FAKE_SB.idTokenError` → error, else sets the session and emits `SIGNED_IN`; a `profiles` update with `display_name` is recorded in `__fakeLog`); Test `tests/uat/509-ios-signin.js`, `tests/e2e/lift-5c.spec.js`.

**Interfaces — Consumes:** `caNative.social`, `caNative.socialReady`, the 5b `IS._beforeVerify() -> y`, `IS._verifyFailed(y)`, `IS._afterVerify(y)`. **Produces:** `IS._provider(name) -> Promise<void>`.

- [ ] **Step 1: UAT:** the sign-in view renders Apple first then Google when both flags are set, neither when unset (5b look), the welcome line reads "Sign in with Apple, Google or email" only when a provider is ready; failure copy verbatim for both providers.
- [ ] **Step 2: E2E:** `Continue with Apple signs in and runs the lock rule` (stub token; fake records `apple`; `accountFreeCert` vs `lockedCert` → switch + toast as 5b); `the Apple sheet gets the plugin's nonce form and Supabase the raw one` (stub records the nonce it got; assert per the Task 1 ruling and `sha256(raw)` relation); `Continue with Google signs in`; `a cancelled sheet keeps the phone's pick` (local `FREE_CERT_ID` unchanged, no Supabase call, no message); `a failed sheet shows the line`; `a token Supabase refuses restores the phone's pick` (`idTokenError` → `_verifyFailed` ran, message shown); `Apple's first-time name is saved once` (`givenName` + `familyName` → one `profiles` update of `display_name` when it is empty; absent or already set → no update); `no provider buttons on the phone website`.
- [ ] **Step 3: Run** → FAIL. **Step 4: Implement.** **Step 5: Run** → PASS (chromium + mobile-safari); UAT ALL PASS. **Step 6: Commit** `feat(stage5c): Continue with Apple and Google in the app`.

### Task 3: Settings → Sign-in methods

**Files:** `features/ios-settings.js` (row after Cert on the signed-in card, value from `session.user.identities`; sheet like the cert sheet; Add → `caNative.social` → `linkIdentity`), `lift-ios.css` (`.ist-meth*`, `.ist-add`, `.ist-conn`, from the drawing), `tests/fixtures/fake-supabase.js` (`linkIdentity({provider, token})` → `__FAKE_SB.linkError` ∈ `'identity_already_exists'` | `'other'` | none; success adds the identity to `user.identities` and emits `USER_UPDATED`; `user.identities` starts `[{ provider: 'email' }]` plus `__FAKE_SB.identities`); Test `tests/e2e/lift-5c.spec.js`, `tests/uat/510-ios-social.js`.

- [ ] **Step 1: E2E:** `Sign-in methods lists Email on and Apple and Google to add`; `Add Apple links and shows Connected` (row value "Email, Apple"; no `SIGNED_IN`, no lock-rule call); `an Apple ID that is already an account shows the defined message`; `another link error shows Couldn't add Apple`; `a cancelled Add changes nothing`; `no Sign-in methods row signed out or off the app`.
- [ ] **Step 2: UAT:** copy verbatim; the row only when `CA_NATIVE`.
- [ ] **Step 3: Run** → FAIL. **Step 4: Implement.** **Step 5: Run** → PASS; the B4 Settings spec green. **Step 6: Commit** `feat(stage5c): add Apple or Google to an account from Settings`.

### Task 4: Revoke Apple when an Apple account is deleted

**Files:** Create `landing/api/apple-revoke.js` (POST `{ code }`, `Authorization: Bearer <supabase access token>`; `module.exports = handler`, `module.exports._internal = { clientSecret, decideRevoke }`), `tests/apple-revoke.test.js` (node, `fetch` stubbed); Modify `features/home.js` `_confirmDeleteAccount` (before the metadata write: if `CA_NATIVE`, the user has an `apple` identity and `caNative.socialReady('apple')`, run the Apple step; always continue), `features/settings.js` `_showDeleteAccountConfirmUI` (the Apple note when the same condition holds); Test `tests/e2e/lift-5c.spec.js`.

**Interfaces — Produces:** `iosSignIn._appleRevoke() -> Promise<'ok'|'cancelled'|'failed'|'sub-mismatch'>` (never rejects); endpoint responses `200 { result: 'ok' }`, `409 { result: 'sub-mismatch' }`, `401`, `502 { result: 'failed' }`.

- [ ] **Step 1: Node test** (`tests/apple-revoke.test.js`): `clientSecret` is an ES256 JWT with `iss`=Team ID, `sub`=`com.certanvil.app`, `aud`=`https://appleid.apple.com`, `exp` ≤ 10 minutes ahead; a valid user + matching `sub` → token exchange then `/auth/revoke` with `token_type_hint=refresh_token` → 200 ok; a different `sub` → 409 and **no** revoke call; no/invalid bearer → 401 and no Apple call; Apple 400 on exchange → 502 failed. Each logs its outcome to `client_errors`.
- [ ] **Step 2: E2E:** `deleting an Apple account asks Apple first, then schedules deletion` (stub `authorizationCode`; the endpoint call precedes the `profiles` update); `cancelling Apple still schedules deletion` (logged `cancelled`); `a non-Apple account deletes without the Apple step`; `the delete sheet shows the Apple note only for Apple accounts in the app`.
- [ ] **Step 3: Run** → FAIL. **Step 4: Implement** (the endpoint reads the identity via `SUPABASE_URL/auth/v1/admin/users/<id>` with the service role; env `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`). **Step 5: Run** → PASS; UAT ALL PASS. **Step 6: Commit** `feat(stage5c): revoke Apple when an Apple account is deleted`.

### Task 5: The website buttons

**Files:** `landing/index.html`, `landing/pricing.html` (Apple + Google buttons replace the disabled Google + "Soon"; ids `auth-apple`, `auth-google`), `landing/auth.js` (`startOAuth(provider)`; error from `?error_description=` → modal + line), `landing/dg-system.css` (`html.is-native #auth-apple, html.is-native #auth-google { display:none !important }`) + its `?v=`, `tests/fixtures/fake-supabase.js` (`signInWithOAuth` records `{provider, options}`); Test `tests/e2e/landing-code-signin.spec.js`, `tests/uat/510-ios-social.js`.

- [ ] **Step 1: E2E** (landing project): `Continue with Apple redirects back to the landing with return` (recorded `redirectTo` = page + `?action=signin&return=` encoded); `Continue with Google` likewise; `an error on return reopens the modal with the line`; `the landing page in the app shows no provider buttons` (native UA).
- [ ] **Step 2: UAT:** no "Soon" pill and no `coming-soon` Google button on index/pricing.
- [ ] **Step 3: Run** → FAIL. **Step 4: Implement.** **Step 5: Run** → PASS. **Step 6: Commit** `feat(stage5c): Apple and Google on certanvil.com`.

### Task 6: Founder setup, real sign-ins, PR

- [ ] **Step 1:** walk the founder through the spec's setup list (Apple App ID capability, Services ID with both domains, `.p8` key; Google consent screen, Web + iOS clients; Supabase providers, manual linking, glob redirect URLs incl. `http://localhost:3140/**`; Vercel env; Mindmatrix reminder for the Apple secret renewal 6 months out). Fill `SOCIAL` and the `Info.plist` URL scheme with the real IDs; ledger any "Skip nonce check".
- [ ] **Step 2:** full suite (UAT, tech-debt, `node tests/apple-revoke.test.js`, Playwright private config) → green; ledger.
- [ ] **Step 3:** Simulator (app on localhost, real Supabase): the founder signs in with Apple and with Google, adds Apple from Settings, and (test account) deletes an Apple account; the endpoint log shows `ok`. Website on localhost: both providers sign in. Screenshots to the PR.
- [ ] **Step 4:** push `feat/stage5c`, open the PR, bind it; whole-branch review (fable); fix pass; ship on "ship it". The new app binary goes to TestFlight with stage 6.
