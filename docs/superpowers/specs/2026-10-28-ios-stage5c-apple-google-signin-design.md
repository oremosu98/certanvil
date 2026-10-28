---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-28
tags: [spec, mobile, ios, launch, stage-5, auth]
---
# Stage 5c: Sign in with Apple and Google (approved 28 Oct 2026)

Stage 5 of [[2026-10-19-ios-launch-june-design]]: 5a native shell (v8.195.0), 5b sign-in by email code
(v8.196.0/.1), **5c** (this: Sign in with Apple and Google), 5d local reminders.

Supersedes the unbuilt June plan [[2026-06-26-g2-apple-google-signin]] (its front matter wrongly says
"shipped"; no OAuth code exists). Its decisions carry over: one account per person, Apple shown first,
adding a method from a signed-in session is the safe path for Apple "Hide My Email", same verified email
links automatically. It predates the in-app sign-in screens of 5b, so 5c builds on those.

## Founder decisions (28 Oct 2026)

1. **App and website.** The iOS sign-in screen and the certanvil.com modal both offer Apple and Google.
2. **Apple and Google in the app.** Google needs its native sign-in (it refuses embedded web views); Apple
   is then required by guideline 4.8 and is offered first.
3. **Add a sign-in method in Settings.** Signed-in users can add Apple or Google to their account.
4. **Approach A in the app:** native sheets return an identity token for `signInWithIdToken`.
   **Redirect flow on the website:** `signInWithOAuth`.

## What exists today (28 Oct)

- **App:** `features/ios-signin.js` (5b) draws `Continue with Apple` with `hidden`; email-code sign-in wraps
  `verifyOtp` in `IS._beforeVerify` / `IS._afterVerify` (the lock rule: the account's free exam wins).
  Capacitor 8 plugins: app, browser, haptics, preferences, share, splash-screen, status-bar.
- **Website:** `landing/auth.js` sends and verifies codes; `landing/index.html` and `landing/pricing.html`
  carry a disabled "Continue with Google" with a "Soon" pill.
- **Supabase JS** 2.105.3 (`lib/supabase-umd.min.js`) has `signInWithIdToken` and `linkIdentity`.
- **Account deletion** (`features/settings.js` `_showDeleteAccountConfirmUI`, used by iOS Settings) writes
  `profiles.metadata.deletion_requested_at`; the account goes after a 7-day grace period. Nothing talks to
  Apple.

## The design

**App sign-in screen** (`features/ios-signin.js`, the 5b screen): top to bottom **Continue with Apple**
(black, first, the 5b button with `hidden` removed), **Continue with Google** (outlined, Google's G mark),
"or", the email field and **Continue**, "We'll email you a 6-digit code." Welcome line: "Sign in with Apple,
Google or email". Cancelling a sheet returns to the screen with no message. A failed sheet: "Apple sign-in
didn't finish. Try again, or use your email." (Google: same with "Google").

**App sign-in flow:** one native plugin (`@capgo/capacitor-social-login`, Apple + Google, checked for
Capacitor 8 at plan time) opens the system sheet and returns an identity token.
- Apple: the page makes a random nonce, passes its SHA-256 to the sheet, and calls
  `signInWithIdToken({ provider: 'apple', token, nonce })` with the raw nonce.
- Google: `signInWithIdToken({ provider: 'google', token })` (the iOS client's ID token; Supabase lists the
  iOS client ID as authorized).
- Both run through the 5b `_beforeVerify` / `_afterVerify` wrapper unchanged, so the lock rule, the toast,
  Pro and "sign in from the welcome" behave as for the email code.
- Apple returns the name only on the very first authorization; when present and the profile has no
  display name, it is saved as `display_name`.
- The buttons show only in the native app with the plugin present (`CA_NATIVE` and the plugin bridge);
  a phone browser keeps today's sign-in.

**Website** (`landing/auth.js`, `landing/index.html`, `landing/pricing.html`): **Continue with Apple** and
**Continue with Google** replace the "Soon" button, above the email option. Each calls
`signInWithOAuth({ provider, options: { redirectTo } })`; `redirectTo` is the stashed `return=` (else this
page), so the user returns where they came from as with the code. Errors on return
(`?error_description=`) show in the modal's error line: "Apple sign-in didn't finish. Try again, or use your
email."

**Settings → Sign-in methods** (iOS Settings account card, signed in only): a row "Sign-in methods" opens a
sheet listing **Email** (always "On"), **Apple** and **Google**, each **Connected** or **Add**. Add calls
`linkIdentity`: in the app with the native token (`linkIdentity({ provider, token, nonce })`), on the web as
a redirect. One line under the list: "Signed up with Apple's Hide My Email? Add Apple here so both open
this account." No removing methods in 5c.

**Which account you land on:** Supabase links identities with the same verified email automatically
(founder setting below), so Google as you@gmail.com opens your email-code account. A Hide My Email relay
address never matches: those users add Apple from Settings while signed in, or they get a separate account.

**Deleting an account that uses Apple** (Apple's token-revocation rule for Sign in with Apple): when a user
with an Apple identity confirms Delete account in the app, the app asks Apple once more (the native sheet,
Face ID) for a fresh authorization code and posts it to a new endpoint `landing/api/apple-revoke.js`. The
endpoint checks the caller's Supabase session, builds the Apple client secret from the `.p8` key
(`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, client ID `com.certanvil.app`), exchanges the code
at `https://appleid.apple.com/auth/token` and revokes the refresh token at `/auth/revoke`. Then the usual
`deletion_requested_at` write runs. If the revoke fails, the deletion still proceeds and the failure is
logged to `client_errors` (the user's request to delete always wins). No Apple token is stored.

## Founder setup (before the preview test)

1. **Apple Developer:** Sign in with Apple capability on App ID `com.certanvil.app`; a Services ID
   `com.certanvil.web` (web domain `certanvil.com`, return URL `https://<project>.supabase.co/auth/v1/callback`);
   a Sign in with Apple key (`.p8`, Key ID, Team ID).
2. **Google Cloud:** OAuth consent screen (app name, support email, certanvil.com domain); a **Web**
   client (redirect `https://<project>.supabase.co/auth/v1/callback`, origin `https://certanvil.com`); an
   **iOS** client (bundle `com.certanvil.app`).
3. **Supabase → Auth → Providers:** Apple on (client ID `com.certanvil.web`, secret from the key; authorized
   client IDs include `com.certanvil.app`); Google on (Web client ID + secret; authorized client IDs include
   the iOS client ID). Auth → URL configuration lists `https://certanvil.com` and the cert subdomains.
   Automatic linking of the same verified email stays on.
4. **Vercel (landing project):** `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`.
5. **Xcode:** the Sign in with Apple capability in the App target (the build does this with the founder's
   team signed in).

## Architecture

- `features/ios-signin.js`: the provider buttons, `iosSignIn._provider(name)` (sheet → token → the 5b
  wrapper), the nonce helper, the error line. No change to the lock rule itself.
- `native-shell.js`: `caNative.social(provider, opts)` over the plugin (returns `{ idToken, nonce?,
  authorizationCode?, givenName?, familyName? }`, rejects with `{ cancelled: true }` on cancel). Keeps the
  plugin out of feature code.
- `features/ios-settings.js` + `features/settings.js`: the Sign-in methods row and sheet; the Apple step
  before the deletion write.
- `landing/auth.js` + the two pages: the two buttons and the redirect.
- `landing/api/apple-revoke.js` (new, server): verify the Supabase JWT, exchange, revoke.
- `capacitor.config.json` / `ios/`: the plugin, the iOS URL scheme Google needs (the reversed iOS client
  ID), the Sign in with Apple entitlement.
- **Untouched:** `auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`. auth-state's `SIGNED_IN`
  path handles the session as for the code.
- **Shipped as a PR** (auth). Native code means a new app binary: Simulator now, TestFlight with stage 6.

## Cross-platform (HARD RULE)

| Target | Apple | Google | Sign-in methods | Apple revoke |
|---|---|---|---|---|
| iOS app (Capacitor) | native sheet + id token | native sheet + id token | native link | yes, on delete |
| Mobile Safari (web) | redirect | redirect | redirect link (web Settings) | no (web) |
| Desktop Safari / WebKit | redirect | redirect | redirect link | no |
| Desktop Chromium | redirect | redirect | redirect link | no |

WKWebView specifics: the plugin's sheet suspends the page; the token call runs after resume (no
in-flight request across the sheet). A sign-in attempted offline shows the 5b network line.

## Process

1. Draw into the June E2E: HUD "5c ›" with `signin-all` (Apple, Google, email), `provider-error`,
   `methods` (Connected / Add), `methods-added`, `delete-apple` (the Apple confirm step). Five-stage
   visual pass. Founder approves in the Simulator.
2. Plan, build as a PR, founder setup, a real sign-in with each provider in the Simulator and on the
   website preview, one fresh whole-branch review, ship on "ship it".

## Acceptance

- App: Continue with Apple and Continue with Google each sign in from the welcome and from Settings, land
  on the account's cert (lock rule as 5b), and never leave the app; cancelling either does nothing.
- Website: both buttons sign in and return to `return=`.
- Same email across methods opens one account; Settings adds Apple to an email-code account and shows it
  Connected.
- Deleting an Apple-linked account in the app revokes the Apple token (endpoint log) and starts the 7-day
  deletion.
- No "Soon" pill remains on the website.

## Rejected approaches

- **OAuth in a browser sheet with a deep link back to the app (approach B):** no native sheet for Apple
  (weaker for review and users), a custom URL scheme and a fiddly session handoff.
- **OAuth inside the web view (approach C):** Google refuses embedded web views (`disallowed_useragent`).
- **App only:** an Apple sign-up in the app could not sign in with Apple on certanvil.com.
- **Apple only in the app:** fewer setup steps, but Google users on the web would need email codes in the app.
- **No Settings linking:** Hide My Email users with an existing account would get a second, empty account.
- **Storing Apple refresh tokens to revoke later:** a stored secret per user; asking Apple again at delete
  time needs none.
- **Removing sign-in methods in 5c:** rarely needed and risks locking people out; later if asked.

## Related
[[2026-10-28-ios-stage5b-email-code-signin-design]] · [[2026-06-26-g2-apple-google-signin]] · [[2026-10-19-ios-launch-june-design]] · [[Mobile MOC]]
