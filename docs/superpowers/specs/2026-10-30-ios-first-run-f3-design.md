---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile, ios, first-run, onboarding, walkthrough]
---
# F3: first run on phones (approved 30 Oct 2026)

Items 1, 2 and 4 of [[2026-10-30-ios-flow-notes]], plus the signed-out day-0 bug left out of scope by
[[2026-10-30-ios-day0-skip-design]]. Founder decisions taken one at a time on 30 Oct; design approved
("yes write the spec").

## The problem

A fresh install of the iPhone app today goes:

1. **Welcome** (`features/ios-signin.js` `_isiWelcomeHtml`): the 735 readiness ring, "Know when you're ready",
   **Get started**, and a small "Already have an account? Sign in" link. It reads like a readiness test, not a
   welcome (item 4).
2. **Get started** opens the cert picker and the two lock-in sheets ([[2026-10-27-ios-stage5a-native-shell-design]]).
   No account step.
3. **Day-0 Home, signed out.** Questions come from the server proxy, which needs an account, so "Take the
   30-second check" does nothing and "Start today's 15" opens the old Custom page without a tab bar.

The broken day-0 is a consequence of the order, not a separate bug: the flow lets a person into the app
without an account, and nothing in the app works without one. June draws the same order, so the fix is a
design change. There is also no "you're in" moment (item 1) and no walkthrough (item 2).

## Founder decisions (30 Oct 2026)

1. **The account is created after picking the exam.** Picker → lock in → create account → day-0. Nobody
   reaches Home signed out.
2. **The app opens on the exam picker.** The 735-ring welcome leaves the app.
3. **Day-0 Home is the welcome.** No separate welcome screen to tap through.
4. **The walkthrough is four tips that point at the real screen.** Shows once, can be replayed from Account.

## The design

### 1. The path for a brand-new person (iPhone app)

1. **Exam picker first.** June's Lift C picker (`iosFirstRun.picker({ native: true })`) gains a header with the
   CertAnvil mark and "Which exam are you studying for?", and a footer link "Already have an account?
   **Sign in**" (opens `iosSignIn.open({ from: 'picker' })`). `native-shell.js` opens the picker directly when
   `chosenCert` is missing, except while a code entry is pending (today's `_pending()` guard stays, so the
   picker never opens over a half-finished sign-in). `iosSignIn.welcome()` and `_isiWelcomeHtml` are removed.
2. **Lock in.** Reminder 1 and reminder 2 unchanged. Pro picks with **Start with <cert>** as today.
3. **Create your account.** One function decides it: `caNative.requireAccount(from)` opens the existing
   sign-in screen when the user is settled signed out (see §2 for "settled"). It is called from two places,
   because a pick does not always reload the page:
   - **Same cert** (the picker's default is the page's own cert, so this is the common case): `goToCert` and the
     Pro `start` path re-render in place without a page load; in the app, the picker's lock-in and start
     handlers call `requireAccount('firstrun')` after `saveChoice` resolves.
   - **Different cert:** the page navigates; the next page's `onReady` guard calls it (§2).
   The screen: title "Create your account to start", a line naming the exam ("Your Network+ progress is saved
   to it, so you keep it if you switch phones."), Apple / Google / email code as today. After verify, today's `_afterVerify` decides the cert: an
   existing account's own free exam wins and shows the "we've opened your account's exam" toast, as in 5b.
   An account with no exam yet goes back to the picker (`pickerNow`) and a free pick there shows both lock
   sheets again: intended, since that is the moment the lock is made.
   **Back** exists only with `from: 'firstrun'`, and only clears the pick when this cert has no answered
   questions (`STORAGE.HISTORY` empty): it removes Preferences `chosenCert`, `lockedCert`, `lastCertHost` and
   this host's `STORAGE.FREE_CERT_ID`, then reopens the picker. With history, Back is not shown.
   **Pending code:** the pending record stores its `from` (`writePending(email, sentAt, from)`), so a relaunch
   mid-code restores the code screen with the same `from` and Back behaves the same; records without one read
   as `'picker'`.
4. **Day-0 Home, now the welcome.** Eyebrow "You're in", headline "<Cert> is set.", one line: "Practise a little
   each day and your readiness climbs towards the pass mark." (the quota card below already shows the 15 and the 5,
   so the line does not repeat them; the old closing "Answer a few…" line goes, it said the same) Then today's check card,
   **Start today's 15** and **Skip** (v8.200.0). Pro: the same, with "Start a quiz" and no daily-15 wording.
   Day-0 already shows once per cert, so the welcome does too.
5. **Normal Home, with the tour** the first time it appears (section 3).

**Returning people:** **Sign in** on the picker skips the lock sheets; `_afterVerify` opens the account's exam
(or the picker for an account with none, which then goes straight to day-0 after the pick, already signed in).

### 2. The signed-out bug

- **Settled signed out** means `_certanvilSignedIn === false` **and** no stored Supabase session in this
  host's localStorage (the `sb-…-auth-token` key) **and** the phone is not offline (the `offline()` check
  `features/ios-firstrun.js` already uses). auth-state also sets the flag to false when `getSession()` fails or
  the client is missing, so the flag alone would put an offline signed-in user behind the account screen.
  When the flag is false but a stored session exists, or the phone is offline, the guard does nothing and
  today's offline state shows. All reads; `auth-state.js` is not edited.
- **App, on launch:** on every cert page load, `onReady` (after the lock check) calls
  `requireAccount(chosenCert && !history ? 'firstrun' : 'signedout')` when `chosenCert` is set. The lock wall
  wins: when this page's cert is not the locked one, `holdLock` runs as today and the account screen shows on
  the owned cert's page after the user goes back there.
- **App, in session:** the Account tab's **Sign out** (`features/ios-settings.js` `ON.signout`) is the only
  in-app sign-out. In the app, once `renderAnonymous` has run, it calls `requireAccount('signedout')`.
  `from: 'signedout'` has no Back: the screen stays until the person signs back in. Its copy: "Sign in to keep
  studying" / "Your <cert> progress is waiting in your account."
- **Everywhere (app and mobile web):** `_ifrState` returns day-0 only when `signedIn === true`. Signed out,
  `#ios-home` shows its normal signed-out state with the Sign in button. No dead buttons on any target.
- **Cold launch, no flash:** while `_certanvilSignedIn` is still unknown, `renderIosHome` holds the first-run
  decision (keeps the host empty, as the page-enter already does) and decides once it settles, at most 1.5s,
  after which it treats unknown as signed out for drawing only (never for `requireAccount`).

### 3. The walkthrough

- **When:** the first time the normal Home (`#ios-home`, tab bar visible) renders for a signed-in user on a
  phone. Never over day-0, the check, capped Home or the offline state.
- **Steps**, each a bubble anchored to a real element with that element highlighted:
  1. Readiness card: what the number is and that it climbs as you answer.
  2. Recommended next (`.ih-rec`): tap it when you're not sure what to do; it picks your next session.
  3. Drills tab.
  4. Progress tab, ending "You can replay this tour any time from Account."
  Copy as drawn (humanizer and marketing-psychology passed, 30 Oct): "Your readiness score" / "Not sure what to do?" /
  "Drills for weak spots" / "See how you're doing". A "1 of 4" count, Next (Done on 4) and X; no dots.
- **Controls:** **Next** (last step: **Done**) and an X on every step; a tap outside closes it. Closing at any
  step counts as seen. It never blocks for more than the tap it takes to close.
- **Seen flag:** one per device. In the app, Capacitor Preferences `tourSeen` (app-wide, so a Pro user
  switching cert hosts is not shown it again); on the mobile website, localStorage `ca_tour_seen`. Not synced:
  that would need `cloud-store.js` (gated) for a one-time hint.
- **Replay:** an Account row "Replay the tour" ("Four quick tips on Home", Study setup group, signed in only; `features/ios-settings.js`) goes to Home and starts step 1.
- **Anchors move:** `renderIosHome` re-renders `#ios-home` on quota and auth changes, replacing its markup. The
  tour holds selectors, not elements (`.ih-rd`, `.ih-rec`, `.lift-tab[data-page="drills"]`,
  `.lift-tab[data-page="progress"]`), re-queries them after each `ca:home-shown`, and a render while the tour is
  open never restarts it. A step whose element is missing is skipped rather than pointing at nothing.
  Scrolling or resizing re-positions the bubble.
- **Motion:** BRAND.md §6 owns the values. Stage 2 decides whether the bubble moves between steps; nothing
  enters below `scale(0.96)`; reduced motion collapses to fades.

## Cross-platform

| Target | What changes |
|---|---|
| iOS Capacitor | All of it: picker first, account step, signed-out guard, day-0 welcome, tour (Preferences flag) |
| Mobile web (≤899px) | Day-0 only when signed in; day-0 welcome copy; tour (localStorage flag); Account replay row. No picker-first (the website's first run stays behind the onboarding switch) |
| Safari/WebKit desktop, desktop browsers | Unchanged (phone screens are ≤899px only). A desktop E2E pins it |

## Architecture

- Same method as Lift C: phone markup in `features/ios-*.js` IIFEs, `data-act` delegation, no inline `on*=`,
  styles in `lift-ios.css` under the phone gate, `app.js` ratchet held.
- The tour is a new `features/ios-tour.js` (one job: anchor, draw, step, remember), started from
  `renderIosHome` after a normal-state render and from the Account row. Pure view function first for UAT.
- Files touched: `native-shell.js`, `features/ios-signin.js`, `features/ios-firstrun.js`,
  `features/ios-home.js`, `features/ios-settings.js`, `features/ios-tour.js` (new), `lift-ios.css`,
  `index.html` (script tag, `lift-ios.css?v=` bump first, then `stamp-css-versions`).
- **Fast lane.** No edits to `auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`, migrations.

## Apple review

Guideline 5.1.1(v) allows requiring an account only when the app's features depend on one. Ours do: progress
synced to the account, the AI-generated questions served through the account, and the daily allowance.
The stage 8 review notes say this in one line, and the reviewer demo account covers sign-in.

## Knock-on

- **F4 (goodbye after deleting the account):** deletion does not clear `chosenCert` (only `native-shell.js`
  writes Preferences), so today it lands on signed-out Home, and after F3 on the account screen
  (`from: 'signedout'`). F4's goodbye screen sits in front of that, and F4 decides whether deletion should
  also clear the pick.
- The `isi-welcome` / `isi-gauge` CSS and the 735 welcome UAT/Playwright checks (`tests/uat/509-ios-signin.js`,
  `tests/e2e/lift-5a.spec.js`, `tests/e2e/lift-5b.spec.js`) are removed or repointed at the picker.

## Process

1. Draw into the June E2E (`feat/cert-ios-e2e`) under a HUD **F3 ›** button: `picker-first`, `picker-lock`,
   `picker-last`, `account-firstrun`, `day0-welcome`, `day0-welcome-pro`, `home-tour-1` … `home-tour-4`,
   `account-replay`. Five-stage visual pass. Founder taps through in the Simulator and approves.
   **Drawn 30 Oct** (june-e2e `683dff6e`, 12 states, HUD **F3 ›**). Day 0 is drawn as the welcome in place, so
   the Skip and Lift C HUDs now show it too, and Skip on day 0 lands on Home with the tour.
2. Plan (writing-plans), build, Simulator walk-through signed in and signed out, one fresh whole-branch review,
   ship on "ship it".

## Tests

- **UAT:** `_ifrState` never returns day-0 when signed out; day-0 HTML carries "You're in" and the how-it-works
  line (Free and Pro); the tour view function renders 4 steps with Next/X and the replay line on step 4; the
  picker header and Sign in footer; no `Know when you're ready` left in `features/`.
- **Playwright (stubbed `window.Capacitor`, UA `CertAnvilApp`):** fresh install → picker → lock → reminder 2 →
  account screen, for both a same-cert pick (no reload) and a different-cert pick; Back on it clears the pick and
  `FREE_CERT_ID`; with history, no Back; signed in → day-0 welcome; normal Home shows the tour once, not after
  reload, and survives a mid-tour re-render; Account replay restarts it; signed-out reload with a chosen cert
  shows the account screen, never day-0; Account → Sign out shows it in session; flag false with a stored
  session, or offline, shows the offline state, not the account screen; a relaunch mid-code keeps its `from`.
- **Mobile web Playwright:** signed out at 390px shows normal Home with Sign in, no day-0.
- **Simulator:** the real app, fresh install, both themes, Free; the Apple / Google path is the founder's
  (real sign-ins are theirs).

## Acceptance

- A fresh install opens on the picker; no 735 ring anywhere in the app.
- Nobody reaches day-0 or Home signed out in the app, on launch or after Account → Sign out; a signed-in
  user offline is never sent to the account screen; on the mobile website, signed out shows the normal Home
  with Sign in, and every button on it works.
- After creating an account, day-0 reads "You're in" with the exam, and its buttons work.
- The tour shows once on the first normal Home, every step points at the right element at 390 and 402 in both
  themes, X or a tap outside closes it, and Account's "Replay the tour" brings it back.
- Desktop unchanged.

## Layout calls (founder, 30 Oct, after the side-by-sides)

- **The "By continuing you agree…" line sits just under the form**, as drawn, on every sign-in screen (it was
  pinned to the screen's foot since 5b).
- **Main buttons keep today's height** (50px; Lock in 48px) against the drawn 45px / 43px. Approved difference
  from the June drawing; no change.

## Rejected approaches

- **Account before picking the exam:** a sign-up wall before the person has chosen anything.
- **No account up front (try signed out):** needs a way to serve questions without an account; none exists, and
  it is the biggest build by far.
- **A plain "what this is" welcome before the picker:** clearer than the ring, but one more tap before anything
  happens, and a second welcome after the account step.
- **Keep the 735 ring, labelled as an example:** still leads with a score before the person has done anything.
- **A separate "You're in" screen before day-0:** one more tap after four steps, saying what day-0 says.
- **A celebration banner over day-0:** motion that has to justify itself to stage 2 for little gain.
- **A swipe-through card tour:** describes the screen instead of pointing at it.
- **Two tips only:** Drills stays easy to miss.
- **Sync the tour flag through `cloud-store.js`:** gated lane for a one-time hint.

## Related
[[2026-10-30-ios-flow-notes]] · [[2026-10-30-ios-day0-skip-design]] · [[2026-10-26-ios-lift-c-design]] ·
[[2026-10-27-ios-stage5a-native-shell-design]] · [[2026-10-19-ios-launch-june-design]] · [[Mobile MOC]]
