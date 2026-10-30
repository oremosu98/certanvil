---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# Resume a quiz after the app closes

From [[2026-10-30-persona-adhd-gaps]] gap 2, narrowed by the founder on 30 Oct. It ships in the
same bundle as [[2026-10-30-streak-honest-design]].

## The problem
Only the Exam Simulator can be paused. If the app closes mid-way through a practice quiz, the quiz
is lost. That includes the person swiping the app away and iOS closing it in the background.

## The design
1. **The same questions, always.** The founder called this critical. A resumed quiz uses exactly
   the questions it started with, in the same order: the same wording, options, answers and
   explanations, with the answers already given and the flags kept. Nothing is regenerated or
   re-fetched, so resuming works offline and costs no quota.
2. **Saved after every answer**, and again when the app goes to the background. One saved quiz per
   cert. Starting a new quiz replaces it.
3. **On the next open, Home shows a top card:** "Finish your quiz · 3 left", with the topic and how far
   in ("7 of 10 answered"). The main button is **Resume**, with a small **Start fresh** link that
   discards the saved quiz.
4. **It expires after 24 hours.** An expired save is discarded quietly.
5. **Unchanged:**
   - Leaving on purpose with ✕ ends the quiz as it does today, and the save is discarded.
   - Finishing a quiz clears the save.
   - The Exam Simulator keeps its own pause.
6. **Covers** normal practice quizzes, Mixed and custom quizzes, Daily Challenge and mistake drills.
   It does not cover the Exam Simulator (it has its own pause), Gauntlet or Why-Not (timed runs).
7. **Only what can be restored exactly.** If a saved quiz can't be restored exactly (a missing
   question or a different cert), it is discarded rather than half-restored.

## Cross-platform
The same behaviour on the iOS app, mobile web and desktop. It matters most in the iOS app, where
iOS closes background apps. On desktop and web, closing the tab counts the same.

## Process
Draw the Home card into the June E2E, run the visual pass with the bundle, get founder approval,
then plan and build.

## Rejected approaches
- **A "Save and finish later" choice on ✕:** the founder said no. Leaving on
  purpose stays as it is.
- **Counting the answered questions toward today and the streak when a quiz is abandoned:** out of
  scope.
- **Regenerating questions on resume:** not the same set. The founder called this critical.

## Related
[[2026-10-30-persona-adhd-gaps]] · [[2026-10-30-streak-honest-design]] · [[Mobile MOC]]
