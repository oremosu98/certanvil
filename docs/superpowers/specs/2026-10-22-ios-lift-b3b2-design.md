---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: comptia
updated: 2026-10-22
tags: [spec, mobile, ios, launch, lift-b]
---
# Lift B3b2: Sim Lab Exam mode on phones (approved 22 Oct 2026)

B3b2 is the second Sim Lab release of Lift B3 ([[2026-10-19-ios-launch-june-design]] stage 3), after
[[2026-10-22-ios-lift-b3b1-design]] (practice Sim Lab, shipped v8.188.0 to v8.188.2). It gives Sim Lab's
own **Exam mode** (Pro) the June look on phones, in the language of the B2 full exam
([[2026-10-21-ios-lift-b2-design]]) and the B3b1 round and verdict.

Phone only (max-width 899px); desktop unchanged. Exam mode is Pro only and exists on CompTIA certs only.
`app.js` stays at its ratchet. No change to the engine, scoring, the clock, generation or the Pro gate.

## What the app does today at 402pt (22 Oct, after B3b1)

- Start: the B3b1 start screen; picking Exam (Pro) and Start runs `_slExamStart`.
- Loader: a spinner with "Building your exam…" / "Generating every round up front so the clock never
  waits on us." (all rounds are generated up front).
- Round: the desktop look on a phone (B3b1 only removed the app top bar and tab bar). Top bar with the
  Sim Lab label and topic, an "Exam" badge, a countdown clock (`.sl-clock`; a one-way amber latch,
  `.is-low`, in the last 10%) and Leave; a palette of numbered round buttons; the scenario mount
  without phone hooks, so it carries its own inline "Submit answers" button and a Reset that asks
  `confirm()`; a footer with Flag, ‹ Prev and Next › (Review → on the last round).
- Review: a full-screen list (`_slRenderReview`) with counts, one row per round, Back to flagged and
  Submit exam; Submit with unanswered rounds asks `confirm()` ("N rounds unanswered. Submit anyway?").
- Leave asks `confirm()` ("Leave? Your exam ends and won't be scored.").
- Time-up auto-submits (`_slTickClock` → `_slExamSubmit(true)`).
- Results (`_slRenderExamResult`): a "⏱ Time's up" or "✓ Exam complete" seal, the Pace card, a
  passed/rounds score, rows with the why always shown, Where you slipped, Back to Practice.
- Bug: the Pace card's target reads "Target NaN:NaN" with a `NaN%` fill, because `_slRenderPaceBlock`
  reads `pace.budgetMs` and `_slComputePace` never returns it.

## Founder decisions (22 Oct 2026)

1. **Round chrome = the B2 exam chrome**, with B3b1's cards in the body.
2. **The review screen becomes the B2 End dialog** on phones.
3. **Leave and Submit ask in the in-app sheets**; no `confirm()` on phones.
4. **Results = the B3b1 verdict plus the Pace card.**
5. Founder approved the design as presented ("yep").

## The screens

### Loader
The B3b1 June "generating" treatment (skeleton blocks, a sweeping line): "Building your exam…" over
"Every round is built before your clock starts." (the drawing's caption; desktop keeps today's).
Reduced motion: static.

### Round (`#page-sim-lab.isl-exam`)
- **Top bar** (the B2 exam bar): left, "TIME LEFT" over the countdown, amber in the last 10% as today
  (today's one-way latch; no red step); middle, "Round N of M" over "K answered"; right, **End**, which
  opens the End dialog. No pause button (Sim Lab Exam has never had one). No Leave button: leaving goes
  through End → Abandon exam. "K answered" and the strip update when you move between rounds, flag one,
  or open the End dialog (as the full exam's Sim Lab questions do), not while you type.
- **Round strip** under the bar: one tick per round, styled answered / flagged / current. It replaces
  the numbered palette (hidden on phones); jumping moves into the End dialog's grid.
- **Body:** the B3b1 cards (Scenario, logs, reference with Tap to enlarge for passive kinds and the
  console card for terminals, steps with full-width pick rows and June fields). Reset sits as in the
  full exam's Sim Lab questions (B3b1): in the console bar for a terminal, otherwise a compact pill at
  the top right of step 1. It asks in the confirm sheet ("Start this PBQ again?" / "Your answers on
  this question will be cleared." / "Clear answers" / "Keep them") and keeps today's behaviour (the
  time spent stays counted, the answer clears). The mount's own inline "Submit answers" button is
  removed in Exam rounds (as the full exam does), so the only actions are the dock's. Exam rounds do
  not play B3b1's round entrance (rounds change often and Reset re-mounts).
- **Dock** (the B2 dock): **‹** (previous, disabled on round 1) · **Flag** / **Flagged** · **Next →**.
  On the last round the primary reads **Review** and opens the End dialog.

### End dialog
A centered dialog in the B2 End dialog's language (scale 0.96 + fade on BRAND §6's curve, fade only
under reduced motion), opened by End or by Review on the last round:
- Eyebrow "Sim Lab exam · end of session", title "Submit exam?".
- Three counts: **Answered**, **Skipped**, **Flagged** (today's `_slReviewCounts`).
- "Review the N you skipped first" when any round is unanswered (jumps to the first one; with none
  skipped and some flagged, "Review the N you flagged first" jumps to the first flagged; with neither,
  no review button).
- **Submit and see results** (primary). Unanswered rounds are already shown in the counts, so there is
  no second confirm.
- **Abandon exam** opens the confirm sheet over the dialog: "Abandon this exam?" / "Your answers won't
  be scored." / **Keep going** (primary) / **Abandon**. While the sheet is up the dialog recedes (scale
  0.98 under a 55% overlay, still solid). Keep going returns to the dialog. Abandon runs today's
  leave without its `confirm()` (no score, back to Home).
- "Jump to a round" opens a grid of round numbers (answered / skipped / flagged / current, with a key);
  a tap jumps to that round (answers restored) and closes the dialog.
- Closes on the scrim and Escape, back to the round in view. (B2 closes on Escape only; the scrim
  close is new here and matches B3b1's sheets.) Focus moves into the dialog and returns on close.
- Opening it first saves the round in view (so its counts are right) and stops that round's time;
  closing it restarts the round's time. Time spent in the dialog counts towards no round, exactly as
  today's review screen (the pace bars and "Round N ran long" stay true).
- Time-up while the dialog or a sheet is open closes them, then auto-submits as today. A sheet that
  resolves after the exam is submitted does nothing.

### Results (`#page-sim-lab-result`)
The B3b1 verdict layout:
- Eyebrow "Sim Lab exam · M rounds", or "Time's up · M rounds" when the clock ran out.
- Headline "N of M passed.", the steps line "X of Y steps right.", the % score with its bar.
- The **Pace** card in June style with today's contents: "Pace", the total time, a pill (no ✓ glyph)
  and a coaching line. Finished in time: "On exam pace" and today's "m:ss to spare…" line. Clock ran
  out: "Out of time" (red) and today's "Round N ran long…" line. (Today the clock auto-submits at
  zero, so elapsed never exceeds the budget: a time-up exam computes `deltaMs = 0`, reads "On exam
  pace ✓" and "0:00 to spare", and "m:ss over exam pace" can't be reached. The pill keys off
  `timeUp` instead, on phone and desktop.) Then the target bar (fill capped at
  100%, "Target m:ss" tick, with the real budget), the "0:00 · your time m:ss" scale and today's
  per-round lines (round time against its par).
- Fix on both phone and desktop: the Pace card's target uses the exam's real budget
  (`_slSession.budgetMs`), so "Target NaN:NaN" and the `NaN%` fill are gone.
- "Your rounds" rows (Right / Partly / Wrong) that open to the answer with the why always shown (as
  today in Exam mode), Where you slipped, **Back to Practice** docked.
- No upsell in exam mode, whatever the tier field says. Weak-spot recording, drill stats and
  milestones are today's.

## Architecture

- **Scope.** `#page-sim-lab` carries `isl-exam` in Exam mode and `isl-practice` otherwise: B3b1's
  `_slSetPractice(on)` toggles both classes (one on, the other off), so a later practice session never
  keeps `isl-exam`. All exam restyling is scoped to `#page-sim-lab.isl-exam` (plus `animation: none;
  transform: none` on the active page, as B3b1, so the fixed bar, dock and dialog are not trapped), and
  the exam verdict to `#sl-result-root` with an exam marker. Decision Lab's own Exam mode is untouched
  (B3c).
- **Phone-only pure model/view pairs in `features/ios-simlab.js`** (B1/B2/B3b1 pattern):
  - the exam bar text and round strip (`_iosSlExamBarModel/Html`): round, answered count, per-round
    states (answered / flagged / current);
  - the End dialog (`_iosSlEndModel/Html`): counts, review target (first skipped, else first flagged,
    else none), grid states;
  - the exam verdict: B3b1's `_iosSlVerdictModel/Html` gains `mode: 'exam'`, `timeUp` and a `pace`
    block, and forces `upsell: false` in exam mode; practice output is unchanged.
- **The End dialog's host and lifecycle** live in `features/ios-simlab.js`:
  `iosSimLab.openEnd(model, { onSubmit, onJump(i), onReview, onAbandon, onClose })` renders into a new
  body-level `#isl-end` (with `#isl-end-scrim`) in `index.html`, owns focus, Escape and the scrim, and
  `iosSimLab.closeEnd()` closes it. sim-lab.js keeps its state private and passes the handlers; the
  dialog never calls sim-lab.js internals.
- **The exam bar and the clock.** On phones `_slExamStart` builds the bar frame once per exam
  (`#isl-xbar`: a "TIME LEFT" label, the existing `#sl-clock-slot` moved inside it, a middle text node,
  End, and the strip) and never re-renders the frame, so `_slTickClock` keeps updating the same
  `.sl-clock` and its `.is-low` latch. Round renders, flag toggles and the End dialog refresh only the
  middle text and the strip from `_iosSlExamBarModel`.
- **Hooks in `features/sim-lab.js`**, phone only and behind a media-query check:
  - `_slRenderRound` mounts with `lift: true` (Tap to enlarge, Reset in the sheet), then removes the
    mount's own "Submit answers"; `iosSimLab.decorate` places Reset as for full-exam questions when the
    wrap is in `.exam-pbq` or `#page-sim-lab.isl-exam` (and skips the round entrance there). The
    Reset-pill CSS widens to `#page-sim-lab.isl-exam`.
  - `_slRenderExamFooter` renders the B2 dock on phones (desktop keeps today's footer).
  - `_slToggleFlag` refreshes the bar's strip and the dock.
  - Last-round Next and End call a phone `_slOpenEnd()`: capture the round in view, accrue its time,
    set `view = 'review'`, then `iosSimLab.openEnd(...)`; closing sets `view = 'round'` and
    `roundEnteredAt = now`. Desktop keeps `_slRenderReview` and both `confirm()`s.
  - Abandon asks with `iosSheet` and then runs the leave path without its `confirm()` (a phone branch in
    `simLabExit`, or a shared internal leave both use).
  - `_slRenderExamResult` renders the phone verdict on phones (desktop unchanged apart from the
    Pace target fix).
  - Every exit (submit, time-up, abandon, Leave from desktop paths) calls `iosSimLab.closeEnd()` and
    `iosSheet.dismiss()` (which also closes the enlarge sheet); sheet promises check `__submitted`.
  - `_slComputePace` (or `_slRenderPaceBlock`) gets the session budget so the target is real, and
    `timeUp` so a time-up exam reads "Out of time" with the ran-long line (phone and desktop).
- **CSS:** a `B3b2 · SIM LAB EXAM` section in `lift-ios.css`, prefix `isl-`, reusing the B3b1 round
  card rules (widen their `:is()` scope to `#page-sim-lab.isl-exam`) and porting the B2 bar, dock and
  End dialog look. Plain top padding (no `env(safe-area-inset-top)`, see v8.188.1).

## Process

1. Draw into the E2E first (`mockups/cert-ios-simlab.html` new states: `exam-loading`, `exam-round`,
   `exam-round-last`, `exam-end`, `exam-end-jump`, `exam-abandon`, `exam-result`, `exam-result-timeup`;
   HUD **B3b2 ›**). 5-stage visual pass. Founder taps it in the Simulator and approves.
2. Plan, build (native), side-by-sides, final review, ship on "ship it".

## Acceptance

- At 390 and 402: a Pro 3-round Exam from the start screen → rounds → End → Submit → results, with no
  app top bar or tab bar, the bar and dock always visible, and no horizontal scroll.
- The clock counts down in the bar and turns amber in the last 10%; time-up closes any open sheet or
  dialog and shows the results with "Time's up".
- The End dialog's counts include the round in view; time spent in the dialog is not added to any
  round's pace.
- The Pace card's target shows the real budget on phones and desktop.
- Flag, ‹ and Next move and mark rounds; the strip and the End dialog's counts and grid agree with
  the session; a grid tap jumps to that round with its answers restored.
- Abandon asks in the sheet; Keep going leaves the exam running; Abandon leaves without a score.
- No `confirm()` on phones in Exam mode; desktop Exam mode, practice Sim Lab and Decision Lab look and
  behave as today.
- Results show the Pace card and the why on every row; Back to Practice returns.

## Rejected approaches

- **B3b1 practice chrome with the palette:** closer to practice, but Exam mode exists to feel like
  the real exam, and the full exam (B2) already set that chrome.
- **A June-styled full-screen review:** more room, but a second pattern next to B2's End dialog.
- **Keep `confirm()` on phones:** the only native dialogs left in the June app.
- **B2 exam results layout:** Sim Lab's per-round answers and pace don't map onto a domain score card.
- **A pause button:** Sim Lab Exam has never paused; adding one changes the exam rules.

## Related
[[2026-10-22-ios-lift-b3b1-design]] · [[2026-10-21-ios-lift-b2-design]] · [[2026-06-24-sim-lab-session-mode-design]] · [[Mobile MOC]]
