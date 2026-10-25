---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: microsoft-aws
updated: 2026-10-26
tags: [spec, mobile, ios, launch, lift-b]
---
# Lift B3c3: Decision Lab and its Exam-style on phones (approved 25 Oct 2026)

B3c3 is the last of the three B3c releases ([[2026-10-23-ios-lift-b3c1-design]] split B3c one release per
activity: B3c1 Reword Gauntlet, B3c2 Why-Not, B3c3 Decision Lab with its Exam mode). Decision Lab exists on
the Microsoft and AWS certs only (`_DL_CERTS`: az900, ai900, sc900, clfc02). B3c3 gives its entry, practice
run, Exam-style run and results the June look on phones, reusing the B3b1 Sim Lab round card and the B3b2
exam bar and End dialog.

Phone only (max-width 899px); desktop unchanged, except one dead-button fix at every width (below). `app.js`
stays at its ratchet. No change to the scenario bank, scoring, the free cap, the Pro gates or their copy, or
the weak-spot recording.

## What the app does today at 402pt (25 Oct)

- **Entry** (`#page-decision-lab-entry`, `decisionLabOpenEntry`): the old web top bar above a centred desktop
  card: back (always to Home), "Decision Lab", the Pro pill (free users), the mark, "Make the *right call*", a
  long lede, Mode (Practice "Why each wrong option is wrong" / Exam-style "Timed · no feedback till the end",
  Pro), Today's target "Mixed · <cert name> <code>", How many decisions (5 · 10 · 20 · full set, 20 Pro), Start
  the drill →, and a free/Pro note. Tab bar visible. Gates (`_dlSessionStartDispatch`): Exam-style is Pro,
  20 is Pro, free practice is one set a day (`_DL_GATE` copy).
- **Runner** (`#page-decision-lab`, `_dlRunRound`): top bar "Decision Lab", "Decision N of M" pill, clock
  slot (Exam-style), Leave; dots; the scenario drawn by `_slMountScenario` (mostly single-step `analyze`
  picks, plus `categorize` sorters with a service selector, `match`, `fillin`, `order`). Practice: Submit
  grades in place (`_dlGradeAnalyze`: "✓ Best" / "✗", the wrong pick marked, "The tell" with the
  explanation), then Flag · Next decision → / See results →. Exam-style: one wall-clock countdown
  (`_dlExamBudgetMs`, Σ estMinutes), Submit advances with no feedback, forward only; the last Submit or time-up
  scores everything (unanswered = missed). The tab bar shows on the runner.
- **Results** (`#page-decision-lab-result`, `_dlRenderResult`): "Set complete" / "Time's up", "N/M Right calls",
  "Look-alikes you still confuse" (pair rows "missed ×N"), "Weak service families" chips, "Drill your 3
  look-alikes →" (always says 3; re-runs a set with today's picks) and "Back to Practice". Drill stats and
  milestones. No per-decision breakdown.
- **Bug, every width:** Leave (runner) and "Back to Practice" (results) call `window.decisionLabExit`, which
  nothing defines, so both do nothing; the only way out is the tab bar, and in Exam-style the clock keeps
  running.

## Founder decisions (25 Oct 2026)

1. **Exam-style = the B3b2 exam bar with today's forward-only flow**; End opens the B3b2 End dialog.
2. **Results list each decision with a row that opens**, after today's score, look-alikes and weak families.
3. **Leaving mid-set asks first** in the in-app sheet (in Exam-style, End and the End dialog do it).
4. Founder approved the design as presented ("yeah looks good").

## The screens

### Entry (`#page-decision-lab-entry` on phones)
The B3b1 Sim Lab start-screen language. No web top bar; the tab bar stays.
- ‹ back (to Drills or Home, wherever Decision Lab was opened from), title "Decision Lab", the Pro pill for
  free users.
- Headline "Make the *right call*" and a tightened lede: "Three of four options look right. The buried
  constraint picks the winner." (final wording confirmed in the drawing).
- **Mode**: two cards, Practice ("Why each wrong option is wrong") and Exam-style ("Timed, no feedback till the
  end", Pro pill for free users). A free user's Exam-style tap opens today's gate.
- **Today's target**: today's label ("Mixed · Azure AZ-900").
- **How many decisions**: 5 · 10 · 20 (full set); 20 carries the Pro lock for free users and opens today's gate.
- Free users only: "Free covers one set a day, with the full reasoning on every miss."
- **Start the drill** docked above the tab bar (today's `_dlSessionStartDispatch` and its gates).

### Practice run (`#page-decision-lab` on phones)
No web top bar, no tab bar.
- Header: ‹ (asks before leaving), "Decision N of M", and the dots (done / now).
- The decision in the B3b1 round-card look (`_slMountScenario` unchanged; the sorter's service selector stays).
- After Submit, today's grading: every option marked ("✓ Best" / "✗", the wrong pick in red) and "The tell".
- Docked: Flag · **Next decision** (**See results** on the last). No arrow glyphs.

### Exam-style run (`#page-decision-lab` on phones)
No web top bar, no tab bar.
- The B3b2 exam bar: "Time left" with the countdown (amber in the last 10%), "Decision N of M", End; the dots
  under it.
- Today's forward-only flow: Submit, then the next decision; no feedback, no going back.
- **End** opens the B3b2 End dialog (`#isl-end` look): Answered / Skipped counts, "Submit and see results",
  "Abandon set" (asks in the sheet: "Abandon this set?" / "Nothing from it will count." / Abandon · Keep going).
  No Jump grid (the run only goes forward). Time spent in the dialog keeps counting.
- Time-up: as today, the clock submits and unanswered decisions count as missed; any open dialog or sheet
  closes first.

### Results (`#page-decision-lab-result` on phones)
No web top bar, no tab bar. The B3b1 verdict language.
- Kicker "Decision Lab · Practice" or "Decision Lab · Exam-style", plus "Time's up" when the clock ran out.
- "**N of M** right calls".
- "Look-alikes you still confuse" (today's pair rows, "missed ×N") and "Weak service families" (today's chips),
  each only when it has entries.
- "Your N decisions": one row per decision (the scenario's first sentence, Right / Wrong pill, chevron), closed
  by default. A pick decision (`analyze`) opens to "Your pick" (or "No answer" when time ran out), "Right call"
  and "The tell"; any other step type opens to "The tell" only.
- Docked: **Drill your look-alikes** when any decision was missed, **Run another set** when none was (both
  re-run a set as today); then "Back to Drills" / "Back to Home".
- Milestone toasts sit above the dock and never cover the score (the B3c1/B3c2 rule).

### Leaving
- ‹ on the practice run asks "Leave Decision Lab?" / "Your decisions so far won't count." in the in-app sheet
  (`iosSheet`), Leave · Keep going. In Exam-style, ‹ opens the End dialog.
- From the results, Back leaves straight away.
- **Every width:** a new `decisionLabExit()` stops any running clock and goes back to where Decision Lab was
  opened from (Drills or Home). Desktop keeps leaving without asking.

## Architecture

- **New phone-only module `features/ios-decisionlab.js`** (eager `defer`), pure model/view pairs plus hosts:
  - `_iosDlEntryModel(s) / _iosDlEntryHtml(m)`: s = {mode, decisions, target, back, free}.
  - `_iosDlResultModel(s) / _iosDlResultHtml(m)`: s = {mode, cert, timeUp, passed, rounds, pairs[], families[],
    back, decisions: [{title, right, kind, pick, rightCall, tell}]}. Every scenario-derived string escaped.
  - `iosDecisionLab.renderEntry / renderResult / confirmLeave`.
- **Hooks in `features/sim-lab.js`** (Decision Lab section), phone only: `decisionLabOpenEntry` renders the phone
  entry (records the origin page); `_dlRunRound` / `_dlUpdateChrome` add the phone header and dock around the
  mounted scenario; Exam-style reuses the B3b2 exam bar and End dialog hosts from `features/ios-simlab.js`;
  `_dlRenderResult` builds the decision rows from `_dlSession.results` (the response's selected ids against
  `step.answer.selected`) and renders the phone result. New `decisionLabExit` at every width.
- **CSS:** the B3b1 round-card and B3b2 exam-bar rules widened to `#page-decision-lab` where they apply, plus a
  `B3c3 · DECISION LAB` section in `lift-ios.css`, prefix `idl-`. Reveals rest visible and animate from hidden.
- **lift-shell:** `HIDE_ON['decision-lab']` and `HIDE_ON['decision-lab-result']`; the app top bar hides on all
  three pages.
- No inline `on*=`; delegation or `addEventListener`.

## Process

1. Draw into the E2E first (`mockups/cert-ios-decisionlab.html`, states `entry`, `entry-free`, `practice`,
   `practice-graded`, `exam`, `exam-amber`, `exam-end`, `results`, `results-open`, `results-exam-timeup`,
   `leave`; HUD **B3c3 ›**). 5-stage visual pass. Founder taps it in the Simulator and approves.
2. Plan, build (native), side-by-sides, final review, ship on "ship it".

## Acceptance

- At 390 and 402, on AZ-900: Drills → Decision Lab entry → pick mode and count → Start → a practice set
  (grading after each Submit) → results with rows that open; and an Exam-style set with the exam bar, End
  dialog and time-up → results. No web top bar, the tab bar only on the entry, no horizontal scroll.
- Leave / ‹ mid-practice ask in the sheet; Keep going stays; Leave lands where Decision Lab was opened from. At
  every width Leave and Back now work.
- Gates, the free cap, scoring, look-alikes, weak families, drill stats and milestones behave as today.
- The results button names what it does: "Drill your look-alikes" with misses, "Run another set" without.
- Desktop Decision Lab looks and behaves as today apart from the working Leave and Back.

## Rejected approaches

- **The full B3b2 exam (back, flag, Jump to a decision):** a behaviour change; today's Exam-style never lets
  you go back, and that is part of what it trains.
- **Today's runner restyled with no End dialog:** would not match the Sim Lab Exam the same user just saw.
- **Results without decision rows:** after Exam-style you would never see which calls were wrong.
- **Leaving without asking:** one stray tap throws away a set, and a free user gets one a day.

## Related
[[2026-10-25-ios-lift-b3c2-design]] · [[2026-10-23-ios-lift-b3c1-design]] · [[2026-10-22-ios-lift-b3b2-design]] · [[2026-10-22-ios-lift-b3b1-design]] · [[Mobile MOC]]
