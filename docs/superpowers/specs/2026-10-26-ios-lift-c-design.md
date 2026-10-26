---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-26
tags: [spec, mobile, ios, launch, lift-c, onboarding]
---
# Lift C: first run on phones (approved 26 Oct 2026)

Lift C is stage 4 of [[2026-10-19-ios-launch-june-design]] §Stages: what a brand-new user meets first.
Below 900px the first-run screens match the June E2E. Desktop is unchanged. Lift B (B1–B4) is shipped
(v8.193.x).

## What the app does today at 402pt (26 Oct)

- **Onboarding switch.** The first-run flow (`lib/onboarding-{boot,firstrun,home,chrome}.js`, `lib/router.js`)
  is built and deployed, but OFF in prod: `lib/onboarding-boot.js` `guardOn()` reads the cached
  `app_config.onboarding_enabled` (false), and `?onb=1` / `?onb=0` / `?onb=auto` override it per browser.
  When it is on, `_onbRoute` sends a never-activated signed-in user to `onbFirstRun.start()`, an activated
  user to the cert home, and does nothing for a signed-out user ('landing').
- **Switch off (every real user today).** A new user lands on `#page-setup`. On phones `#ios-home`
  (`features/ios-home.js`) shows its 'new' state: "Welcome to <cert>. Your first session sets the baseline."
  and "Start your first quiz" (10 Q). There is no cert picker (the subdomain sets the cert). `lift-ios.css`
  hides everything in `#page-setup` except `#ios-home`, so the desktop "Take the diagnostic" card never shows
  on a phone; the only diagnostic entry is the Settings Pass Plan card.
- **Switch on.** `screenCertPick()` ("Step 1 of 3 / Which exam are you studying for?") then a browser
  `confirm()` to lock a free cert; `screenDiagnosticIntro` ("Let's see where you stand.") runs a 15-question
  calibration (`startDiagnostic({ count: 15, onboarding: 'calibration' })`), then `screenScoreReveal`,
  `screenMovement` (+5 questions) and `screenHabit`. All of it is desktop-styled (`.onb-fr`, max-width 440);
  no `lift-ios.css` rules. The free quota bar (`.onb-home-bar`) is hidden on phones by the `#ios-home` rule.
- **Bug.** `currentCert()` falls back to the subdomain's `CURRENT_CERT`, so a signed-in user is almost always
  routed as 'not-activated' with a cert already set, `start()` skips the picker, and the free-cert lock
  (`persistFreeCert`) is never saved.
- **Limits and offline.** Over the free 15: `_showQuotaExceededUI` ("You've used today's free questions") and,
  switch on, `onbUpgrade.show('cap')`. A custom set bigger than what's left: `_showDailyLimitPreblockUI`
  (`.dlpb-*` popup). Offline: the orange `connectivity-banner` ("You're offline — AI features…", app.js).

## The drawing

june-e2e (`feat/cert-ios-e2e`) mockups, stitched by `mockups/e2e/shell.js`:
`onboarding-native-welcome` → `onboarding-signup-signin` → `onboarding-free-cert-picker` (8 exams, "Lock in
Network+", lock-in sheet with three terms) → `onboarding-free-home-day0` ("Your exam is set / Let's place your
readiness.", quota 15/15, "Take the 30-second check", "Start today's 15") → `onboarding-first-run-diagnostic`
(A: "Quick check", Q 1 of 5, "Next question", "Skip the check"; B: "Your starting point" on the /900 scale,
"A starting point, not a grade.", "Start practising") → `onboarding-free-capped-home` ("Done for today /
That's today's 15 done.", "Start review", "See Pro"). Also `cert-ios-daily-limit` ("That's more than your
free day"), and, reachable only from the shell's jump menu, `onboarding-notifications-prime`,
`onboarding-loading-states` (session restore, content skeleton, offline) and `onboarding-error-states`.

## Founder decisions (26 Oct 2026)

1. **Lift C covers what can be real now.** Cert picker and lock-in sheet, the first check and its score,
   day-0 Home, capped Home, the daily-limit screen, loading and offline. The native welcome, the reminders
   prompt and the sign-in errors (link expired, account exists, email typo) move to stage 5 (native app);
   card declined and renewal failed move to stage 6 (Pro). Nothing ships as a dead button.
2. **June's 5-question check.** Picker → day-0 Home → the check offered from Home. Today's 15-question
   calibration, the +5 practice screen and the habit screen are dropped from first run. This supersedes the
   15-question shape in `docs/planning/ONBOARDING_ACTIVATION_DECISIONS.md` §2; the check stays skippable,
   free and outside the daily 15 (§4, §8).
3. **Split by the switch.** Day-0 Home, the check, capped Home, the daily-limit screen and offline go live for
   everyone when Lift C ships. The launch routing, the cert picker + lock-in sheet and the session-restore
   skeleton stay behind the onboarding switch: tested with `?onb=1`, turned on by the launch flip
   (CLAUDE.md §PENDING GO-LIVE).

Settled without a question: labels say **AI-901**, never June's AI-900 (launch spec, founder note 3). **See
Pro** opens today's pricing page until in-app purchase lands in stage 6 (as Settings' Go Pro, approved for B4).

## The screens

**State rules (one source for Home and the router).** Per cert:
- **Check taken** = a readiness snapshot from the check exists. The phone check finishes through the
  onboarding path (today's `_onbDiagnosticComplete` shape: it writes a readiness snapshot, source
  `onb-calibration`, and skips `saveDiagnostic`), never `completeDiagnostic` and its Pass Plan result page.
  The full Baseline stays in Settings' Pass Plan for everyone.
- **Placed** = check taken, or any answered question in history.
- **Day-0 Home** is a one-time screen, as in the E2E: it shows while not placed and not yet skipped.
  **Skip the check** goes to the normal Home (today's new-user state, the E2E's `home`) and records the skip
  per cert, so day-0 does not return. Starting today's 15 also leaves it for good (the user is then placed).
  The check is offered only on day-0 Home.
- **Home's readiness number:** `getReadinessScore()` once history exists (as today); with no history, the
  check's snapshot number, labelled as a starting point.
- **Activated** (the switch-on router, `lib/router.js`) = placed. So a user who practised first is never
  sent back into first run, and a not-activated user who has already saved a cert lands on day-0 Home, not
  the picker.

**Day-0 Home** (`#ios-home`, not placed). Replaces today's 'new' state.
"Your exam is set" eyebrow, "Let's place your readiness." headline, the readiness card reading "not placed
yet", free users' quota row (15 of 15 left), then **Take the 30-second check** (primary) and **Start today's
15** (today's daily set). June draws it without the tab bar (it sits before the dashboard), and the build
matches. Pro: the cert card without the quota row, the check card without "daily 15" wording, and **Start a
quiz** (deviation 1).

**The 30-second check.** Five questions on the existing diagnostic engine (`startDiagnostic`, count 5),
June's layout: "Quick check", "Question 1 of 5", pick-then-confirm with a docked **Next question**, and
**Skip the check** (to the normal Home; the skip is recorded, no score). The score screen's secondary link
"See how readiness works" opens the readiness explainer the app already has; planning names it, and if
there is none, the link is dropped with the founder's OK rather than shipped dead. It is free and does not draw on the daily 15. It
ends on "Your starting point": the cert's own readiness number on its own scale, taken from the cert
pack (today's onboarding callback falls back to a hard-coded 720 via `EXAM_PASS_SCORE`; Lift C removes that
fallback), "A starting point, not a grade.", **Start practising** (to Home, now placed). It seeds the review
deck the way today's diagnostic does. Planning confirms where the daily quota is counted (client or the
server proxy) and makes sure the check's five questions are not counted; a test pins it.

**Capped Home** (free, today's 15 used). "Done for today" eyebrow, "That's today's 15 done.", **Start
review** (Daily Review, the free 5) and **See Pro**. The "You've used today's free questions" popup stays for
anyone who tries to start more.

**Daily limit.** `_showDailyLimitPreblockUI` on phones becomes June's full screen with its row icons:
"That's more than your free day", **Go Pro — unlimited** (pricing page) and **Start a 15-question set
instead** (or what is left today).

**Offline.** On phones the orange banner becomes June's calm offline state, "You're offline.". The "Saved
locally, will sync" line ships only if `cloud-store.js` really flushes writes made offline once the phone is
back online; planning checks this, and if it does not, the copy change goes to the founder. The rest of the
offline state ships either way; this one line never holds the release.

**Behind the switch.**
- **Cert picker** (`#onb-firstrun` step 1): June's list of exams with AI-901, **Lock in <cert>**, and June's
  lock-in sheet (`iosSheet`) in place of `confirm()`, with **Lock in…** and **Go back**. Pro users pick
  without a lock-in sheet. It shows until a cert choice is saved (fix for the bug above); picking a cert
  other than the current one switches to it through the existing cert switcher.
- **Launch routing:** a never-activated user goes picker → day-0 Home. `screenDiagnosticIntro`,
  `screenScoreReveal`, `screenMovement` and `screenHabit` leave the phone path.
- **Session restore:** `#onb-resolve` drawn as June's "Picking up where you left off" skeleton.

## Deviations to approve in the Simulator

1. **Pro day-0 Home** (`day0-pro`). June draws only Free.
2. **Pro picker** (`picker-pro`): Pro tag, "Pro covers every exam", **Start with <cert>**, no lock-in sheet.
3. **Picker shows until a choice is saved,** even when the web address already names a cert.

June's lock-in sheet already reads "20 questions a day: 15 new practice questions plus 5 Daily Review
cards", which matches the app, so its copy stays as drawn. The only picker label change is AI-900 to AI-901.

## Architecture

- Same method as B1–B4: phone markup in `features/ios-*.js` (Home states in `features/ios-home.js`; the check
  and its score in a new `features/ios-firstrun.js`), styles in `lift-ios.css` under the `(max-width: 899px)`
  gate, wired to today's logic (`startDiagnostic`, readiness, quota, `onbFirstRun`, `iosSheet`). IIFE
  modules, `data-act` delegation, no inline `on*=`, `app.js` ratchet held.
- WebKit rules from Lift B hold: no new `:has(#host:not(:empty))` (toggle a class from JS), reveals rest
  visible and animate from hidden with `backwards`, a re-render after a state change is still. The existing
  `:has(#ios-home:not(:empty))` Home rules work (the host fills while its page enters) and stay as they are.
- Fast lane. `auth-state.js`, `cloud-store.js`, `lib/supabase.js` and `sw.js` are not edited; if the offline
  check needs a `cloud-store.js` change, that piece goes to the gated lane on its own.
- Motion follows BRAND.md §6. The five-stage visual pass runs on the drawing.

## Process

1. Draw into the June E2E (`feat/cert-ios-e2e`) with a HUD button "C ›" and 11 states: `restore`,
   `free-cert-picker`, `picker-lock`, `picker-pro`, `free-home-day0`, `day0-pro`, `first-run-diag`,
   `check-score`, `free-capped-home`, `daily-limit`, `offline`. Five-stage visual pass. Founder approves in
   the Simulator.
2. Plan (writing-plans), build, side-by-sides for every state (`scripts/lift-sbs.js`), one fresh
   whole-branch review, ship on "ship it" (one release, or two if the switch-off half is ready first).

## Acceptance

- At 390 and 402, both themes, Free and Pro, every state matches the approved E2E side by side.
- With the switch off: a new user sees day-0 Home, can take or skip the 5-question check, sees their
  starting point, and lands on a placed Home; a free user past 15 sees capped Home; an oversized set shows
  the daily-limit screen; offline shows the calm state. The check never reduces the daily 15. After the
  check, a reload still shows the placed Home with the starting-point number, never day-0 again.
- With `?onb=1`: a never-activated user gets the picker → lock-in sheet → day-0 Home, the choice is saved
  (and survives reload), and an activated user goes straight to Home. A user who practised without taking
  the check is never routed back into first run.
- No browser `confirm()` / `alert()` anywhere in first run on phones. No AI-900 label anywhere.
- Desktop first run and Home unchanged (a desktop E2E pins them). No horizontal scroll; tab bar visible.

## Later stages (moved here, not dropped)

- **Stage 5, native app:** `onboarding-native-welcome`, `onboarding-notifications-prime`, sign-in errors
  (link expired, account exists, email typo), `onboarding-signup-signin`, `onboarding-magic-link-sent`,
  `onboarding-welcome-back`.
- **Stage 6, Pro on iPhone:** card declined, renewal failed, and See Pro / Go Pro pointing at in-app purchase.

## Rejected approaches

- **Build every drawn screen now with placeholder actions:** ships buttons that don't do what they say
  (decision 1).
- **Build all and hide the blocked ones:** most work now for screens whose plumbing doesn't exist yet
  (decision 1).
- **Keep the 15-question calibration in June styling, or a 10-question middle ground:** deviates from the E2E
  flow the fidelity rule holds to (decision 2).
- **Everything behind the switch:** current users keep today's day-0 and capped Home and the loud offline
  banner until launch (decision 3).
- **Flip the switch when Lift C ships:** the flip is the go-live step held until App Store submission
  (decision 3).
- **Restyle the desktop `.onb-fr` markup with CSS only:** the v7.36 drift lesson; the structure differs.

## Related
[[2026-10-19-ios-launch-june-design]] · [[2026-10-26-ios-lift-b4-design]] · [[ONBOARDING_ACTIVATION_DECISIONS]] · [[ONBOARDING_ROLLOUT_GATE_PLAN]] · [[Mobile MOC]]
