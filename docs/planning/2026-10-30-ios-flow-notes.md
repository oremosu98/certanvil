# iOS app flow: founder notes for 30 Oct

Captured from Simi's voice note on 29 Oct after the 5d session. Each item is a visible screen, so each goes
through brainstorming → June E2E drawing → founder approval → build (5-stage visual pass).

## The list

1. **A welcome after picking your exam.** Today, locking in the cert lands straight on Home (or the day-0
   "Let's place your readiness" screen) with no "you're in" moment. Wanted: a short welcome before the app.
2. **A walkthrough of the app, skippable.** A pop-up tour of how to use the app, with an X. Shows once by
   default, never blocks, and can be reopened (e.g. from Settings). Open: how many steps, what each points at.
3. **A goodbye screen after deleting the account.** Today the app signs out and returns to the start.
   Wanted: a proper goodbye that also says the account can come back within 7 days.
4. **A clear first screen.** Signed in → the app opens on Home. Not signed in → the first launch shows the
   welcome screen with the 735 readiness ring ("Know when you're ready", Get started), which reads like a
   readiness test rather than a welcome and confuses where to go. Redesign what a brand-new person sees first.
5. **Skip on the readiness check.** On day-0 Home, "Just start practising" exists but is easy to miss; once the
   30-second check has started there is no way out. Both need a clear Skip.
6. **A bigger "Welcome back" in the app** after a deletion is cancelled by signing in. The message exists
   (v8.198.0) but is small in the app. Wanted: a proper moment.

7. **Suggest a cert (iOS app AND web).** People should be able to tell us which certs they want added,
   from inside the app (most likely Settings), not by email: email doesn't scale to reading hundreds of
   requests. Likely shape to discuss: pick from a list of candidate certs and/or type one in, stored so the
   founder sees a tally ("AWS SAA: 41 requests") rather than a pile of messages. A new table means a
   migration, so this one is gated-lane. Open: list vs free text vs both, signed-in only or anyone, whether
   people see that others asked for the same cert, and where the founder reads the results.

## Persona reviews (29 Oct night, read-only code reviews)

Full reports: [[2026-10-30-persona-adhd-gaps]] and [[2026-10-30-persona-cert-stacker-gaps]]. Top findings below
were spot-checked against the code; the rest are the reviewers' claims, worked from code (not a device).

- **Bug, live: phone Home readiness label is almost always "Behind".** `features/ios-home.js:44` compares
  `passProbability` to 50/20, but the engine returns 0–1 (`features/readiness.js:351`; desktop multiplies by
  100). "On track" / "Close" can never show. Small fix, should go first.
- **"Pass ready" is easy to earn** (`readiness.js:403-407`): predicted ≥ pass and ≥ pass-accuracy on the last
  200 answers; no minimum volume, no timed mock, easy questions count fully. Wanted: a "Book it / not yet"
  checklist with reasons. Readiness tuning is #139 (`saas-gated` in CLAUDE.md, but key-patterns.md says the
  freeze was lifted 2026-10-09) — confirm which is current before touching the maths.
- **The phone never explains the score**: the engine already computes a range, pass chance, coverage and
  per-domain accuracy (`readiness.js:409-430`); none is shown, and the readiness card looks tappable but isn't.
- **Short sessions are marked like a full exam**: a 1-question Daily Challenge gets a "below pass" verdict and
  "Rewatch the Messer videos" (`features/quiz-engine.js:1830`) — on every cert, Azure and AWS included.
- **Leaving a quiz partway loses everything** ("Quiz progress will be lost.", `app.js:2849`); the exam's
  pause/resume could be reused.
- **Coming back after missed days punishes**: the streak only updates on finishing, then drops to 1; streak and
  "today" use UTC days (`app.js:3176-3191`) while reminders use local time.
- **Pre-launch capacity check**: the AI endpoint has a global cap of 500 calls a day for everyone
  (`api/ai/generate.js:51`); a few heavy users could use it up.

## Suggested grouping

- **First-run flow:** 1, 2 and 4 together (one design, one drawing).
- **Deletion moments:** 3 and 6 as a pair.
- **Quick win:** 5 first, it is small.

## Also on the list for 30 Oct

- Apple delete retest on the iPhone after v8.199.0 is live: delete → sign back in; expect
  `apple-revoke: ok` from `select created_at, type, message from client_errors where message like 'apple-revoke%' order by created_at desc limit 5;`
- PR #532 (deletion leftovers, v8.198.1) still waits for "ship it" and a yes on the offline sign-out copy.

## Related
[[2026-10-19-ios-launch-june-design]] · [[2026-10-29-ios-stage5d-study-reminders-design]]
