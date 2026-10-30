---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# An honest streak, with a warning before it ends

From [[2026-10-30-persona-adhd-gaps]] gaps 3 and 10. The founder approved the design on 30 Oct. It ships
in a bundle with the other persona items, not on its own.

## The problem
- The streak uses UTC dates. In UK summer, study after midnight counts as the day before. In the US,
  evening study counts as the next day. Someone can study every evening and still lose the streak.
- The streak is only recalculated when a quiz finishes. After three missed days, Home still shows a
  5-day flame. The next quiz then resets it to 1, right after the person did the right thing.
- Nothing warns anyone before the streak ends.

## The design
1. **"Today" follows the phone's clock** for the streak and today's question count. The free daily
   quota stays on the server's UTC day; that is out of scope.
2. **The streak rule doesn't change:** miss a day and it ends. The best streak is kept.
3. **The streak is honest when read.** If the last study day was before yesterday, every surface
   shows it as ended (current 0) as soon as the app opens: Home on phone and desktop, analytics,
   and the results card.
4. **Home momentum line (phone):**
   - Alive, not studied today: "5-day streak. Study today to keep it."
   - Studied today: "5-day streak. Today's done."
   - Ended after a break: "Your 5-day streak ended. Your best is 5. A quick set starts a new one."
   - No streak yet: "No streak yet. Finish a set today to start one."
   Calm tone, never red.
5. **Warnings (iOS app, only when reminders are on):**
   - When a streak of 1 or more is on the line, the daily reminder leads with it:
     "Your 5-day streak ends tonight. A quick set keeps it."
     The exam-tomorrow line still wins on that one day.
   - Last call at 9 pm local, if not studied that day, and only when the chosen reminder time is
     before 9 pm: "Last call: your 5-day streak ends at midnight."
   - Never more than two a day, and none once that day is studied.
   - A streak line only appears on days the streak can still be alive: today, if not yet studied;
     tomorrow, if studied today. Days further out get the usual line.
6. **Switching over:** a last study day stored as a UTC date is treated as valid for today or
   yesterday in local time, so nobody loses a streak because of the change itself.

## Cross-platform
- Phone, desktop and mobile web all get the honest streak and local "today".
- The new Home lines are phone-only; the desktop badge simply shows the honest number.
- Notifications exist only in the iOS app.

## Process
Draw the Home lines into the June E2E, run the five-stage visual pass, get founder approval, then
plan and build. It ships bundled with the next persona items.

## Rejected approaches
- **A rest day a week, or any one missed day forgiven:** the founder's call, "a streak is a streak".
  Warn the person instead.
- **"Days studied this week" instead of a chain:** it stops being a streak.
- **Folding the warning into the daily reminder only:** too easy to miss. The founder chose
  reminder plus a 9 pm last call.

## Related
[[2026-10-30-persona-adhd-gaps]] · [[2026-10-30-ios-results-readiness-design]] · [[Mobile MOC]]
