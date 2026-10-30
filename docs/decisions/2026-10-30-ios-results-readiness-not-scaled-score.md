---
up: "[[Decisions MOC]]"
type: decision
status: active
cert: all
updated: 2026-10-30
tags: [decision, mobile]
---
# Phone results show how readiness moved, not an exam score

## Context
Every practice quiz on phones ended on an exam-style "Scaled score" out of 900 with "Pass mark cleared"
or "N below pass", even after 1 or 5 questions. It flattered strong users, crushed struggling ones and
disagreed with the readiness score. The 30 Oct persona reviews (ADHD gaps 1 and 4, cert-stacker gap 4)
flagged it, along with grade copy that said "Rewatch the Messer videos" on every cert.

## Decision
On phones, every practice quiz's results card shows readiness before → after with the change, plus
one streak line. A drop is shown plainly in a calm tone, never red. Special cases:
- First reading: "Readiness placed".
- No movement: "Readiness held".
- Mistake drills: "Practice only".
- The onboarding estimate doesn't count as a "before".
- A snapshot this quiz didn't write is never shown as this quiz's change.

The grade copy talks about the session for every cert, on phone and desktop. Exam Simulator results
keep the scaled score. **Redo this quiz** stays the main button.

## Why
Readiness is the one number the app stands behind. Showing it move after every set makes each set count
and keeps the screen honest. An exam score only means something on a full-length exam.

## Affects
- `features/ios-quiz.js` (`_iosReadinessChangeModel`, `renderIosResults`).
- `features/quiz-engine.js` `finish()`: `window._iosResultsCtx`, and the render now runs after `_writeReadinessSnapshot()`.
- The shared `headlines` copy.
- `lift-ios.css` `.ir-rch*`.
- Spec: [[2026-10-30-ios-results-readiness-design]]. Plan: [[2026-10-30-ios-results-readiness]].

## Rejected alternatives
- **Swap the score out only under 10 questions.** A 10-question set still isn't an exam.
- **Keep the score and add the change.** A warm-up would still say "Pass mark cleared".
- **A main button that follows the day.** The founder kept Redo as the main button.
- **Hiding drops.** That's flattery.
- **Treating the onboarding estimate as a "before".** The first real quiz would have shown a large fake drop or jump.

## Related
[[2026-10-30-ios-results-readiness-design]] · [[2026-10-19-ios-launch-june-design]] · [[Decisions MOC]]
