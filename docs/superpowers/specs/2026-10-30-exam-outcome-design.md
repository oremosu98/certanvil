---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# "How did it go?" after the exam

From [[2026-10-30-persona-cert-stacker-gaps]] gap 6. The founder approved it on 30 Oct. It ships in the
bundle.

## The problem
There's no way to record a real exam result. There's no "Passed" state, and the readiness score can
never be checked against reality.

## The design
1. **When to ask.** From the day after the cert's exam date, Home's top card asks "How did your
   Network+ exam go?" It offers three choices: **Passed**, **Didn't pass** and **Haven't sat it yet**.
   Under it: "Tell us and we'll update your plan." It keeps asking on each open until answered.
2. **One flow: the June "Log your result" screen.** Home's Passed and Didn't pass open it with that
   answer already picked. The hub's "Took your exam? Log your result" opens the same screen. Its intro reads "Sat the exam? Add your result. A pass marks the cert as passed in your hub."
   Changes from June: open to Free as well as Pro; "Not yet" becomes "Didn't pass"; no test-centre field; the
   date is pre-filled from the exam date; the score is optional either way.
3. **After Passed:** a one-time celebration and a "Passed" badge. Home's top card becomes "Pick your
   next cert". The card says "We predicted 553 on exam day. Your streak carries on with your next cert." The cert stays open for anyone who wants to keep practising.
4. **After Didn't pass:** "That's a hard exam. Your progress is all still here." with **Set a new date**
   (and Not now). "I haven't sat it yet" on Home goes straight to the exam-date setting.
5. **What's saved:** the outcome, the score if given, the date, and the readiness the app showed on the
   exam date. That turns into "We predicted 820, you scored 812". It's kept per cert, in the account
   data that already syncs. No database change, so it can go on the fast lane.
6. **Where it shows:** the "Passed" badge appears on that cert's Home and in the cert list. Score
   entry accepts the cert's own scale, for example 100-900 for CompTIA.

## Cross-platform
- The question card and its states are on phones: the iOS app and mobile web.
- The saved result syncs everywhere.
- The desktop badge is out of scope.

## Rejected approaches
- **A new database table:** not needed. The synced account data holds it.
- **Asking once and never again:** people skip it on the day. Asking on each open until it's answered
  costs one card.
- **A second, inline score form on the Home card:** it duplicated the June screen. One flow only.
- **Showing the prediction against reality publicly or across users:** a later readiness-tuning job
  (#139).

## Related
[[2026-10-30-persona-cert-stacker-gaps]] · [[2026-10-30-home-one-next-step-design]] · [[Mobile MOC]]
