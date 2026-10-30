---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# Reminders after drifting away, an honest forecast, and the PBQ note

From [[2026-10-30-persona-adhd-gaps]] gap 8 and [[2026-10-30-persona-cert-stacker-gaps]] gaps 7 and
10. The founder approved all three on 30 Oct and delegated the details. Ships in the bundle.

## 1. Reminders that don't go quiet (iOS app, reminders on)
This reverses the Stage 5d choice that reminders stop after the 7 scheduled days. That was the
founder's call on 30 Oct.
- **The ask shrinks with time away.** For the first 2 days without study, the day's normal line
  applies (streak, reviews, exam countdown). From day 3:
  "It's been 3 days. A 5-minute warm-up gets you going again."
- **After the 7 daily reminders,** two more at the chosen time: day 10 and day 21.
  "One question, about a minute. Your Network+ progress is still here." Then reminders stop until
  the app is opened.
- **Daily Review counts as studying for the day,** so a review day doesn't get a "15 questions are
  waiting" nag.

## 2. An honest forecast (Analytics → Readiness)
- **It can go down.** Today it's the higher of the score and the trend, so it only ever rises.
- **It projects to the exam date** using the last 14 days' points per week:
  "Up about 40 points a week. On this pace you'd be around 745 on 3 Dec, over the 720 pass mark."
  The tile reads "Forecast for 3 Dec", with "likely 700 to 790" under it. The range is the
  confidence range the score already computes, carried forward.
- **Short:** "…around 655 on 17 Nov, short of the 720 pass mark. Study more each week, or move the date."
- **Falling:** "Down about 10 points a week lately. On this pace you'd be around 505 on 3 Dec. A few
  short sets a week turns it round."
- **No date:** "Set your exam date to see where you'll be on the day."
- It uses the cert's own pass mark and scale, and the per-cert exam date
  ([[2026-10-30-my-certs-hub-design]]).
- The old "Hold your pace and you'll cross it" line goes; it was a promise.

## 3. The PBQ note (same card, certs with PBQs)
"Readiness counts multiple-choice only. PBQs: 6 of 9 fully right in your last 3 full exams."
With no full exams yet: "Take a full exam to practise PBQs too." Hidden on certs without PBQs.

## Rejected approaches
- **"About 60 questions a day to be safe":** it needs a points-per-question model nobody has
  validated; that's readiness tuning (#139). Points per week is plain arithmetic on the user's own
  history.
- **Counting PBQs in readiness:** PBQs aren't calibrated like MCQs (an existing decision). Say so
  instead.
- **Reminders forever:** two "door's open" nudges, then silence. Respectful, not naggy.

## Related
[[2026-10-30-persona-adhd-gaps]] · [[2026-10-30-persona-cert-stacker-gaps]] · [[2026-10-30-streak-honest-design]] · [[Mobile MOC]]
