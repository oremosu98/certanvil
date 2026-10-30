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
   It keeps asking on each open until answered.
2. **Passed:**
   - Optional score field ("Your score, if you have it"), then Save.
   - A one-time celebration.
   - The cert gets a "Passed" badge.
   - Home's top card becomes "Pick your next cert", which opens the cert picker.
   - The cert stays open for anyone who wants to keep practising.
3. **Didn't pass:**
   - Optional score, then a kind line: "That's a hard exam. Your progress is all still here."
   - A **Set a new date** button.
   - Studying carries on as normal.
4. **Haven't sat it yet:** asks for the new date, or lets them clear the date.
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
- **Showing the prediction against reality publicly or across users:** a later readiness-tuning job
  (#139).

## Related
[[2026-10-30-persona-cert-stacker-gaps]] · [[2026-10-30-home-one-next-step-design]] · [[Mobile MOC]]
