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

**App sign-in flow:** one native plugin (`@capgo/capacitor-social-login`, Apple + Google) opens the system
sheet and returns an identity token. **The plan pins the plugin version** after checking Capacitor 8
support and its nonce contract.
- Apple: the page makes a random raw nonce. Apple must receive `sha256(raw)` (hex) and Supabase the raw
  value: `signInWithIdToken({ provider: 'apple', token, nonce: raw })` (Supabase hashes it and compares it
  to the token's `nonce` claim). If the pinned plugin hashes a raw nonce itself, the page passes the raw
  nonce to the plugin and does not hash it again (a double hash fails with "Nonces mismatch"). A test
  decodes the returned id token and asserts its `nonce` claim equals `sha256(raw)`.
- Google: the plugin is configured with the **Web client ID** as its server client ID, so the id token's
  `aud` is the Web client ID; Supabase's Google "Client IDs" list carries the Web client ID first, then the
  iOS client ID. A nonce is passed when the plugin supports one for Google (raw to Supabase, as for Apple);
  only if it cannot does the founder turn on Google's "Skip nonce check" (the plan states which, after the
  plugin check).
- **The 5b wrapper, and when it runs:** `_beforeVerify` (which sets the phone's free cert aside) runs only
  **after** the sheet has returned a token, right before `signInWithIdToken`; a cancelled or failed sheet
  never touches it. Any error from `signInWithIdToken` calls `_verifyFailed(y)`, exactly as a failed code
  does. Success goes to `_afterVerify`, so the lock rule, the toast, Pro and "sign in from the welcome"
  behave as for the email code.
- Apple returns the name only on the very first authorization; when present and `profiles.display_name`
  is empty, it is saved to that column.
- The buttons show only in the native app with the plugin present (`CA_NATIVE` and the plugin bridge);
  a phone browser keeps today's sign-in.

**Website** (`landing/auth.js`, `landing/index.html`, `landing/pricing.html`): **Continue with Apple** and
**Continue with Google** replace the "Soon" button, above the email option. Each calls
`signInWithOAuth({ provider, options: { redirectTo } })` where **`redirectTo` is the landing page itself**
with `?action=signin&return=<the stashed return>` in its query. Supabase sends the user back there; the
landing client (`detectSessionInUrl`, PKCE) exchanges the code, the existing `SIGNED_IN` listener reads
`return=` from the query (module state does not survive the navigation) and replaces to it, so the user
lands where they came from as with the code. Errors come back to the same page (`?error=` /
`?error_description=`), so the modal reopens with its error line: "Apple sign-in didn't finish. Try again,
or use your email." (Google: same with "Google"). A failed code exchange shows the same line.

**The landing page inside the app's web view:** `allowNavigation` lets the app show certanvil.com pages.
There the web buttons would fail (Google refuses web views) or run a web Apple flow, so under
`html.is-native` (set by `landing/native-hide.js`) the two web buttons are hidden; the app's own screens
are the in-app path.

**Settings → Sign-in methods** (iOS app only: the Settings account card when signed in and `CA_NATIVE`;
the phone and desktop websites do not get this row in 5c): a row "Sign-in methods" opens a sheet listing
**Email** (always "On"), **Apple** and **Google**, each **Connected** or **Add**. Add opens the native sheet
and calls `linkIdentity({ provider, token, nonce })` (supabase-js 2.105.3 routes a `token` to
`linkIdentityIdToken`). Linking does **not** go through the 5b wrapper: it emits `USER_UPDATED`, not a new
`SIGNED_IN`, and the account (and its lock) stays the same. One line under the list: "Signed up with
Apple's Hide My Email? Add Apple here so both open this account." No removing methods and no merging
accounts in 5c.
- **That Apple ID or Google account is already another CertAnvil account** (`identity_already_exists`,
  e.g. a Hide My Email user who made a separate Apple account first): "That Apple ID already has its own
  CertAnvil account. To use it, sign out and continue with Apple." (Google: "That Google account …").
  Nothing is merged or moved.
- Cancelling the sheet does nothing; any other error: "Couldn't add Apple. Try again." (Google: same).

**Which account you land on:** Supabase always links identities with the same verified email (not a
toggle), so Google as you@gmail.com opens your email-code account. Every existing account was verified
by a code, so no unverified account can be pre-registered to capture a later sign-in. A Google account
whose email is not verified does not auto-link. A Hide My Email relay address never matches: those users
add Apple from Settings while signed in, or they get a separate account.

**Deleting an account that uses Apple** (Apple's token-revocation rule for Sign in with Apple): when a user
with an Apple identity confirms Delete account in the app, the app asks Apple once more (the native sheet,
Face ID) for a fresh authorization code and posts it to a new endpoint `landing/api/apple-revoke.js`. The
endpoint:
1. verifies the caller's Supabase JWT and reads the user's Apple identity `provider_id` from
   `auth.identities` (service role);
2. mints a short-lived ES256 client secret from the `.p8` on each call (`iss` Team ID, `sub`
   `com.certanvil.app`, `aud` `https://appleid.apple.com`; env `APPLE_TEAM_ID`, `APPLE_KEY_ID`,
   `APPLE_PRIVATE_KEY`);
3. exchanges the code at `https://appleid.apple.com/auth/token` (`client_id=com.certanvil.app`; the code is
   single-use and valid 5 minutes);
4. decodes the returned `id_token` and **refuses unless its `sub` equals the account's Apple `provider_id`**
   (a family iPad or second Apple ID must never revoke someone else's grant);
5. revokes the refresh token at `/auth/revoke` (`token_type_hint=refresh_token`).
Then the usual `deletion_requested_at` write runs. If the user cancels the Apple sheet, or the revoke
fails or is refused, the deletion still proceeds (the user's request to delete always wins) and the
outcome is logged to `client_errors` (`apple-revoke: cancelled | failed | sub-mismatch`). No Apple token is
stored. A user whose only Apple identity came from the website (Services ID `com.certanvil.web`) still
confirms in the app: both IDs sit under one Team, and the app grant is the one revoked; the web grant is
the website's. Cancelling the deletion within the 7 days is unaffected: a later Apple sign-in uses the same
`sub` and Apple shows its consent sheet again.

## Founder setup (before the preview test)

1. **Apple Developer:** Sign in with Apple capability on App ID `com.certanvil.app`; a Services ID
   `com.certanvil.web` grouped under that App ID, with Domains `certanvil.com` **and**
   `<project>.supabase.co`, and Return URL `https://<project>.supabase.co/auth/v1/callback`; a Sign in with
   Apple key (`.p8`, Key ID, Team ID).
2. **Google Cloud:** OAuth consent screen (app name, support email, certanvil.com domain); a **Web**
   client (redirect `https://<project>.supabase.co/auth/v1/callback`, origin `https://certanvil.com`); an
   **iOS** client (bundle `com.certanvil.app`).
3. **Supabase → Auth:**
   - Providers → Apple on: client IDs `com.certanvil.web,com.certanvil.app`, secret = the client-secret JWT
     made from the key. **That JWT expires after at most 6 months**: a renewal reminder goes in Mindmatrix
     at setup (web Apple sign-in breaks silently otherwise). The revoke endpoint mints its own.
   - Providers → Google on: client IDs `<Web client ID>,<iOS client ID>` (Web first), Web client secret;
     "Skip nonce check" only if the plan finds the plugin cannot pass a Google nonce.
   - **"Allow manual linking" on** (off by default; `linkIdentity` fails without it).
   - URL configuration → Redirect URLs as globs: `https://certanvil.com/**` and
     `https://*.certanvil.com/**` (plain origins fail silently and drop `return=`); plus
     `http://localhost:3140/**` for the founder's local website test.
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
| iOS app showing a certanvil.com page | web buttons hidden (`html.is-native`) | hidden | n/a | n/a |
| Mobile Safari (web) | redirect | redirect | not in 5c | no |
| Desktop Safari / WebKit | redirect | redirect | not in 5c | no |
| Desktop Chromium | redirect | redirect | not in 5c | no |
| In-app browsers (Instagram, TikTok, Gmail link-outs) | redirect (may work) | Google refuses; the error line points to email | not in 5c | no |
| localhost / `*.vercel.app` | redirect to itself only (the PKCE verifier is per-origin there; `.certanvil.com` cookies don't apply) | same | n/a | n/a |

WKWebView specifics: the plugin's sheet suspends the page; the token call runs after resume (no
in-flight request across the sheet). A sign-in attempted offline shows the 5b network line. The website
modal's provider test runs on prod after merge or on localhost (redirecting to itself); the cert app's
Vercel preview cannot share a session with certanvil.com.

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
  deletion; the revoke refuses when the Apple `sub` does not match the account (and the deletion still
  starts).
- Add Apple with an Apple ID that already has its own account shows the defined message; nothing merges.
- A website sign-in error reopens the modal with the error line; the landing page inside the app shows no
  web provider buttons.
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
- **Redirecting OAuth straight to the cert subdomain:** errors and failed code exchanges would land on the
  cert app, not the modal that can show them; the landing exchanges and then bounces.
- **Sign-in methods on the website in 5c:** the Hide My Email case is an app case; web linking later if asked.
- **Apple server-to-server notifications (consent revoked / account deleted):** not required for 5c; later.

## Related
[[2026-10-28-ios-stage5b-email-code-signin-design]] · [[2026-06-26-g2-apple-google-signin]] · [[2026-10-19-ios-launch-june-design]] · [[Mobile MOC]]
