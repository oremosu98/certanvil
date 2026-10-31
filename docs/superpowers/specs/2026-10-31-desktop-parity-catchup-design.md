---
up: "[[Mobile MOC]]"
type: spec
status: draft
cert: all
updated: 2026-10-31
tags: [spec, design]
---
# Desktop catch-up: the persona bundle in unison on the web app

On 31 Oct the founder ruled that every feature must exist on the iOS app, mobile web and the desktop web
app, in a layout suited to each ("everything in unison"). The persona bundle (v8.203.0) shipped several
items phone-only. A code audit on 31 Oct listed what the desktop web app (≥900px) is missing. This
catch-up ships before the Admin build ([[2026-10-31-admin-in-app-design]]), which is already designed for
all three surfaces.

## The rule for every item
**One module, two layouts.** Desktop reuses the phone's code and copy; it changes layout only (a card
on the desktop Home, a centred dialog instead of a bottom sheet, a page in the sidebar instead of a
full-screen overlay). Copy, numbers and behaviour are identical, so the two can't drift.

## Already in unison (shared logic, no work)
Honest streak number, the honest forecast wording, no repeat questions, fast start, the busy message,
the book-it rule behind the readiness tier.

## Needs a desktop drawing
1. **Quiz resume.** A "Finish your quiz · N left" card at the top of the desktop Home, with Resume and
   Start fresh. Same save (already runs on desktop), same 24-hour expiry, same rules as
   [[2026-10-30-quiz-resume-design]].
2. **How did your exam go.** The day after the exam date, the desktop Home asks the same question with the
   same answers. Log result opens the shared log-result screen as a centred dialog. Passed shows the
   Passed badge and the "Pick your next cert" card; Didn't pass offers a new date. From
   [[2026-10-30-exam-outcome-design]].
3. **My certs.** A "My certs" sidebar item opening the hub in a desktop layout (greeting, Readiness / Due
   today / Day streak, your cert, other certs as a grid, the folded Pro row on Free, Suggest a cert). It
   replaces Settings' "Your Pass Plans" list as the place to switch cert. From
   [[2026-10-30-my-certs-hub-design]].
4. **Suggest a cert.** The shared suggest sheet as a centred dialog, from My certs and a Settings row,
   signed in only.
5. **Why this score + book it.** The desktop Analytics readiness card gets "Why this score", opening the
   shared sheet (range, evidence, exam areas, the four-point book-it list) as a dialog. The older "Why
   you're at N" card goes, so the score is explained one way. From
   [[2026-10-30-why-score-bookit-repeats-design]].
6. **Streak lines.** The desktop Home shows the same momentum line as the phone ("Your 11-day streak
   ended. Your best is 11. A quick set starts a new one."), and the sidebar badge reads "Streak ended ·
   best 11" instead of looking brand new.
7. **Goodbye and welcome back.** The same goodbye (scheduled date, "Sign back in before {date}") and
   welcome-back screens, centred at desktop scale, replacing the old card and the toast. From
   [[2026-10-30-deletion-moments-design]].

## Copy and logic only
- The PBQ note line on the desktop Analytics readiness tile ("Readiness counts multiple-choice only.
  PBQs: …"), already computed, never shown.
- A past exam date reads "N days ago" on the desktop tile too (it shows "--").
- Remove the old `getReadinessForecast` path on desktop Analytics if it still renders, so only the honest
  forecast shows.
- The desktop line "PBQs carry 3-4x weight on the real exam. Start practising now." (`index.html`) is
  not a fact we can stand behind; replace it with honest copy in the honest-copy spec's style.

## Stays iPhone-only (founder, 31 Oct)
Streak reminders, the 9 pm last call and reminder settings are iPhone-app notifications. No browser
notifications ("No, iPhone only"). The Apple billing line on the goodbye screen stays app-only because
it is only true there.

## Cross-platform
Every item above is the desktop half of something phones already have; mobile web and the iOS app are
unchanged except where a shared module is touched, and those changes must keep the phone behaviour and
tests identical.

## Process
Draw each desktop surface into the June E2E (desktop views next to the phone ones), run the five-stage
visual pass, get founder approval, then plan and build on the fast lane (no schema change; gated only if
the build touches auth, sync or the service worker).

## Rejected approaches
- **Leave desktop on its older screens:** the founder ruled against it ("everything in unison").
- **Separate desktop implementations:** two copies drift; one module with two layouts instead.
- **Browser notifications in this catch-up:** the founder chose iPhone-only reminders.

## Related
[[2026-10-31-admin-in-app-design]] · [[2026-10-30-persona-adhd-gaps]] · [[Mobile MOC]]
