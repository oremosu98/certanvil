---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-21
tags: [spec, mobile, ios, launch, lift-b]
---
# Lift B2: Exam and exam results, made real (approved 21 Oct 2026)

B2 is the second Lift B release ([[2026-10-19-ios-launch-june-design]] stage 3, after
[[2026-10-21-ios-lift-b1-design]]). It makes the phone exam and its results look and flow like the June
E2E: `mockups/cert-ios-exam.html` and `mockups/cert-ios-exam-results.html` on `feat/cert-ios-e2e`. The
parent spec's Fidelity rule applies in full. Phone only (`max-width: 899px`); desktop is unchanged.

## What the E2E has, what the app has (21 Oct, at 402pt)

| Screen | E2E | Real app at phone width | Gap |
|---|---|---|---|
| Exam | Time left, "Question 23 of 90 · 63 answered", End; one question card; docked Flag + Next | Pause / Flag / End Exam button row, "Question Navigator" dropdown, progress bar + dots, small undocked Prev / Next | Layout and controls |
| End (submit) | Bottom sheet: counts, "Review the N you skipped first", Submit and see results, Abandon exam | Desktop modal, "Review Flagged First", eyebrow prints a literal `·` | Sheet, copy, bug |
| Results | "So close." headline, score card, four tiles, by-domain bars, Menu / Review all / Drill the gap | Older layout: prose, row list, domain grid, Retry Exam; milestone toasts cover the headline | Layout, buttons |

## Founder decisions (21 Oct 2026)

- **Question navigator** lives in the End sheet as a grid of question numbers (answered, skipped,
  flagged). Tapping a number jumps there. The navigator dropdown and the progress dots go on phone.
- **Controls:** the dock is **Prev · Flag · Next** (Next primary). **Pause** sits beside **End** in the top
  bar.
- **Results buttons:** **Menu / Review all / Drill the gap**, with a quiet **"Retry the exam"** link under
  them.
- **Leaving a running exam** asks in an E2E-style bottom sheet, not the system alert.
- **The score card follows the theme** ("we need consistency"): the E2E's fixed dark trophy panel becomes a
  themed card in the quiz results card's family, colours from tokens, no hardcoded hex.

## The screens

### Exam
- Top bar: **Time left** with the clock, **"Question N of M · K answered"**, the **pace line** under it
  ("46 min ahead" / "4 min behind"), **Pause** and **End**.
- One question card: the question number, its topic, a **Flagged** chip when flagged, the scenario when
  there is one, then the options (multi-select and ordering keep their real behaviour).
- Dock: **Prev · Flag · Next**. On the last question Next reads **End**.
- **Exam paused** covers the question: "Exam paused · 54:12 left", **Resume exam**, and the note that the
  real exam has no pause.
- **Sim Lab questions** (the up-to-4 PBQs at the start) keep the exam top bar and dock around the console,
  with **Reset**. The console's own look is B3.
- The "could only build N of 90 questions" notice keeps its meaning in the E2E style.

### End sheet
- The E2E's centred dialog: Answered / Skipped / Flagged counts, **Review the N you skipped first** (or the
  flagged ones when nothing is skipped), **Submit and see results**, **Abandon exam**.
- Below them **Jump to a question** opens the question grid (7 columns so each number is a 44pt target).

### Leave sheet
- "Leave the exam? The clock keeps running, and you can resume from Home." **Leave** and **Stay**. A paused
  exam leaves without asking, as today.

### Results
- The E2E screen: the headline ("So close." / pass and fail variants), the score card on the cert's own
  scale and pass mark (`EXAM_MAX_SCORE`, `EXAM_PASS_SCORE`), Correct / Wrong / Skipped / Raw tiles and the
  by-domain bars.
- **"Paused for N min"** when the exam was paused.
- A **Sim Lab questions** block ("3 of 4 right"); each row opens that question's answer.
- **Menu / Review all / Drill the gap**, and **Retry the exam** as a quiet link. **Drill the gap** starts a
  hard quiz on the weakest studied topics in the two weakest domains, through `_startTopicsQuiz` (the Map's
  Drill them path).
- Milestone toasts behave as on quiz results (Lift A): one at a time from the top, gone after 4 seconds or a tap, never over the dock.

## Architecture
- **Exam, End sheet, leave sheet:** the real `#page-exam` restyled in `lift-ios.css` (an `ix-` section)
  with small phone-only hooks in `features/exam.js` (dock markup, the End-sheet grid, the leave sheet in
  place of `confirm()` at phone width). One exam engine; timer, save, resume, pause and scoring are
  untouched.
- **Results:** a phone renderer, `features/ios-exam.js`, with a pure `_iosExamResultsModel` /
  `_iosExamResultsHtml` (UAT vm-testable via `_fnBody`), rendered into `#ios-exam-results`
  (`ios-only iq-screen`) inside `#page-exam-results`, from the data `submitExam()` already builds.
- No new lines in `app.js` (8301-line ratchet). Desktop keeps its markup.
- Fix along the way: the literal `·` in the submit eyebrow.

## Process
1. Draw the additions into the E2E (exam dock, Pause + paused cover, pace line, End sheet + grid, leave
   sheet, Sim Lab question frame, results extras) with the 5-stage visual pass; the founder taps them in
   the Simulator.
2. On approval, write the plan, build on `feat/lift-b2`, side-by-sides at 402pt, ship on "ship it".

## Acceptance
- Side by side in the Simulator at 402pt against the E2E: both themes, a pass and a fail, a paused exam,
  an exam with Sim Lab questions.
- UAT: the results model (headline variants, tiles, domain bars per cert, paused line, Sim Lab block,
  Drill the gap topics).
- Playwright at 390 and 402: the dock moves and flags, Pause covers and resumes, the End sheet grid jumps,
  the leave sheet stays or leaves, the results buttons route correctly, desktop is unchanged.

## Rejected approaches
- **A full phone copy of the exam screen.** It would duplicate the Sim Lab, multi-select and ordering
  rendering and the timer wiring, a large regression risk for a 90-minute flow.
- **CSS only for results.** It cannot reach the E2E layout (headline, tiles, bars) from the desktop markup.
- **Navigator as a strip under the top bar, or dropped.** Founder chose the End sheet.
- **Flag + Next dock with Prev up top.** Founder chose Prev · Flag · Next.
- **Keeping the system alert to leave.** Founder chose the E2E-style sheet.

## Related
[[2026-10-21-ios-lift-b1-design]] · [[2026-10-19-ios-launch-june-design]] ·
[[2026-10-11-exam-simulator-hardening-design]] · [[Mobile MOC]]
