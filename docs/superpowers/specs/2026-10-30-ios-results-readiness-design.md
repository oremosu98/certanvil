---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile, readiness]
---
# Results that tell the truth (phones)

From the 30 Oct persona reviews: [[2026-10-30-persona-adhd-gaps]] gaps 1 and 4, [[2026-10-30-persona-cert-stacker-gaps]]
gap 4. Founder approved the design on 30 Oct.

## The problem
Every practice quiz, even a 1-question Daily Challenge or a 5-question warm-up, ends on an exam-style "Scaled score"
out of 900 with "Pass mark cleared" / "N below pass". It means nothing on so few questions, it gasses up a strong
user and crushes a struggling one, and it says something different from the readiness score. The shared grade copy
says "Rewatch the Messer videos on this topic" on every cert (Messer is CompTIA-only) and "You're exam-ready on this
topic" after a short set. Nothing on the screen shows readiness moving or the streak being kept.

## The design (phones, `features/ios-quiz.js` results)
1. **The big card becomes the readiness change** on every practice quiz (founder: all quizzes):
   - "Readiness 612 → 626" with "+14" (a drop shows plainly, "−8", in a calm tone, never red); unchanged:
     "Readiness held at 626". Numbers on the cert's own scale.
   - First reading on this cert (no previous snapshot): "Readiness placed: 612".
   - Sessions that never count toward readiness (Drill my mistakes, Gauntlet, Why-Not; `wrongDrillMode` and the
     drills excluded in `readiness.js`): "Practice only. This doesn't change your readiness."
   - One streak line under it: "Streak kept · day 4" / "Streak started · day 1" / "Day 4 · today already counted".
   - Before = this cert's `READINESS_SNAPSHOTS` entry read before `_writeReadinessSnapshot()` overwrites it; after =
     the new snapshot. The phone results re-render once the snapshot is written (today they render first).
2. **Copy:** the five grade lines talk about the session, not the person or the exam; no Messer, no "exam-ready".
   The copy is shared, so desktop gets the same lines. From the visual pass (30 Oct):
   | Grade | Headline | Line |
   |---|---|---|
   | A | Strong *session.* | Nearly all right. Keep it fresh with a review now and then. |
   | B | Good *session.* | A few to go back over. Review answers shows which. |
   | C | Getting *there.* | Go back over the misses, then try another set. |
   | D | Tough *set.* | Read the explanation for each miss before the next one. |
   | F | Hard *going.* | Read the explanation for each miss, then try another set. |
   Practice-only card: "Mistake drills don't change your readiness. They're for fixing what you got wrong."
   First reading: "Your first reading on <cert>. It moves with every set you finish." Readiness change counts from the
   old number to the new one (900ms, BRAND §6 data motion; reduced motion shows it static).
3. **Unchanged:** right / wrong / time stats, the difficulty split, the answer list, and the buttons — **Redo this
   quiz** stays primary (founder kept the Lift A decision), then Drill mistakes, Review answers, Back to menu.
4. **Exam Simulator results unchanged** (the exam-style score is honest there).

## Cross-platform
Phones (iOS app + mobile web ≤899px): the new card. Desktop and Safari desktop: only the copy change; the desktop
scaled card stays (out of scope).

## Process
Draw into the June E2E (HUD "Results ›": normal quiz up, first quiz, drop, drill/practice-only, 1-question Daily
Challenge), five-stage visual pass, founder approves in the Simulator, plan, build, fast lane.

## Rejected approaches
- **Replace the score only under 10 questions:** a 10-question set still isn't an exam; the score would keep
  disagreeing with readiness.
- **Keep the score and add the change:** a 5-question warm-up would still say "Pass mark cleared".
- **Main button follows the day ("Keep going · 5 more" / "That's today done"):** founder kept Redo as primary.
- **Hide readiness drops:** that is the flattery the cert-stacker review warned about.

## Related
[[2026-10-30-persona-adhd-gaps]] · [[2026-10-30-persona-cert-stacker-gaps]] · [[2026-10-19-ios-launch-june-design]]
