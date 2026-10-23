---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: comptia
updated: 2026-10-23
tags: [spec, mobile, ios, launch, lift-b]
---
# Lift B3c1: Reword Gauntlet on phones (approved 23 Oct 2026)

B3c is the last Drills-tab lift of Lift B3 ([[2026-10-19-ios-launch-june-design]] stage 3). On 23 Oct the
founder split it into one release per activity: **B3c1 Reword Gauntlet** (this spec), then B3c2 Why-Not,
then B3c3 Decision Lab with its Exam mode. B3c1 gives the Gauntlet's entry and results the June look on
phones and tidies its run on the Lift A quiz.

Phone only (max-width 899px); desktop unchanged. `app.js` stays at its ratchet. No change to generation,
the quality gate, scoring, history, the cracked list, the free daily run or its gate.

## What the app does today at 402pt (23 Oct)

- **Entry** (`#page-gauntlet`): the old web top bar ("gauntlet", icons, Sign in) above a centred desktop
  card: back, "Reword Gauntlet", the mark, "Beat the concept in *every* disguise", "Five questions on one
  concept. The wording never repeats.", the **Today's target** card (topic, why it was picked, "Pick a
  different topic" that expands an inline list), "N concepts cracked so far" when N > 0, the five rung names,
  Start the Gauntlet. Tab bar visible.
- **Run**: `showPage('loading')` with "Forging five disguises…" (Lift A loader, Cancel), then the Lift A
  quiz (`#page-quiz`) with `gauntletMode`. The 1–5 question pills show **and** the Gauntlet ladder
  (`#gauntlet-ladder`, five rungs) shows under them, so progress shows twice. "The Gauntlet · topic", the rung
  chip and the hinge highlight on the answered question work.
- **Results** (`#page-gauntlet-result`, `renderGauntletResult`): web top bar and tab bar; cracked shows a seal,
  "Concept cracked", the concept, five bars, the sub line, the streak line, Next target / Back to Home; missed
  shows "Cracked N of 5", the callout, five rung rows (name, description, tick or cross; they don't open), the
  "Run it again…" line, Run it again / Different concept. Milestone toasts stack over the seal.
- **Free daily run**: a free user's second Start opens `_gateGauntletDaily`'s Pro gate ("That's today's free
  Gauntlet done"). Unchanged.

## Founder decisions (23 Oct 2026)

1. **Split B3c one release per activity**, Reword Gauntlet first.
2. **Run = the Lift A quiz, the ladder replaces the question pills.**
3. **"Pick a different topic" opens the in-app sheet.**
4. **"Cracked N of 5" rows open like the Sim Lab verdict rows.**
5. Founder approved the design as presented ("yeah looks good to me").

## The screens

### Entry (`#page-gauntlet` on phones)
No web top bar; the tab bar stays (as the Sim Lab start screen).
- ‹ back (to Drills or Home, as today's `_gauntletReturn`), title "Reword Gauntlet".
- Headline "Beat the concept in *every* disguise" and lede "Five questions on one concept. The wording never
  repeats." (today's copy).
- **Today's target** card: eyebrow "Today's target", the topic, today's why line ("Your pick" / "Your weakest
  topic right now" / "A good place to start"), and **Pick a different topic**. That opens a list sheet in the
  in-app sheet's look (a new `#igt-topics` host styled like `#exam-sheet`) with the cert's topics, the current one ticked; tapping one closes the sheet and
  updates the card (today's `gauntletChooseTopic`).
- "N concepts cracked so far. Each one survived all five wordings." when N > 0 (today's copy).
- The five rungs as a strip: Plain · Scenario · Best-of · Not-trap · Twisted.
- Free users only: cap line "Free covers one Gauntlet a day, on top of your 15 questions."
- **Start the Gauntlet** docked above the tab bar (drives today's `gauntletStart`).

### Run (the Lift A quiz)
- Loader: today's Lift A loader, "Forging five disguises…", Cancel.
- On `#page-quiz` while `gauntletMode` is on, the Lift A question pills hide and the five-rung ladder takes
  their row: done rungs fill, missed rungs turn red, the live rung is lit (today's `_renderGauntletLadder`
  states, restyled). "The Gauntlet · topic", the rung chip, the hinge highlight and the answer card stay as
  approved in Lift A. Leaving (✕) behaves as today.

### Results (`#page-gauntlet-result` on phones)
No web top bar, no tab bar. The Sim Lab verdict's language.
- **Cracked:** kicker "Reword Gauntlet · topic", the seal, "Concept cracked", the concept name, five filled
  rung bars, today's sub line ("Five wordings, five answers. That's N in your collection." or "Took N runs.
  Earned."), the streak line. Docked **Next target** (primary), then "Back to Drills" / "Back to Home".
- **Missed:** kicker "Reword Gauntlet · topic", "Cracked N of 5", today's callout ("The Best-of got you. One
  rung from the seal." etc.), then five rung rows: rung name and its description, a Right / Wrong pill, a
  chevron. Each row opens to show that wording with its hinge highlighted, "Your answer", "Answer" and the
  explanation; closed by default. Then today's "Run it again and every question is re-worded from scratch…"
  line. Docked **Run it again** (primary) · Different concept.
- Milestone toasts drop from the top as on quiz results (Lift A `.mtoast`), never over the seal.

## Architecture

- **New phone-only module `features/ios-gauntlet.js`** (eager `defer`, B3 pattern), self-contained pure
  model/view pairs plus small hosts:
  - `_iosGtEntryModel(s) / _iosGtEntryHtml(m)`: s = {topic, why, back, cracked, free, topics[]}.
  - `_iosGtResultModel(s) / _iosGtResultHtml(m)`: s = {cracked, concept, topic, attempts, collection, back,
    rungs: [{key, sub, ok, question, hinge, yours, answer, explanation}]}. Every scenario-derived string is
    escaped; the hinge mark is applied after escaping (escape-then-highlight).
  - `iosGauntlet.pickTopic(topics, current) -> Promise<topic|null>`: the topic sheet in `#igt-topics`
    (scrim, Escape, focus return, one sheet at a time; `iosSheet.dismiss()` closes it too).
- **Hooks in `features/flagship-drills.js`**, phone only:
  - `renderGauntletEntry` renders the phone entry into a new `#igt-entry` host in `#page-gauntlet` (the
    desktop card hides beside it, as `#isl-entry`), wiring Start, back and the topic pick to today's functions.
  - `renderGauntletResult` renders the phone result; the rows read the run's questions and the quiz `log`
    (the user's pick per rung) that `_finishGauntlet` already has.
- **CSS:** a `B3c1 · GAUNTLET` section in `lift-ios.css`, prefix `igt-`; the run is CSS only (while `#gauntlet-ladder` is
  shown, hide the Lift A pill row `#quiz-prog-dots` / `.qpd-cell`, which Lift A forces visible, and restyle the
  ladder). Plain top padding (no
  `env(safe-area-inset-top)`).
- **lift-shell:** `HIDE_ON['gauntlet-result']` hides the tab bar; the app top bar hides on both pages.
- No inline `on*=`; delegation or `addEventListener`.

## Process

1. Draw into the E2E first (`mockups/cert-ios-gauntlet.html`, states `entry`, `entry-pick`, `entry-free`,
   `loading`, `run`, `run-answered`, `result-cracked`, `result-miss`, `result-miss-open`; HUD **B3c1 ›**).
   5-stage visual pass. Founder taps it in the Simulator and approves.
2. Plan, build (native), side-by-sides, final review, ship on "ship it".

## Acceptance

- At 390 and 402: Drills → Gauntlet entry → pick a different topic in the sheet → Start → five rungs → results,
  with no web top bar, the tab bar only on the entry, and no horizontal scroll.
- During the run the ladder shows once (no question pills) and tracks done / missed / live.
- Cracked and missed results show today's copy; each missed-view row opens to the wording, both answers and the
  explanation, hinge highlighted, text escaped.
- Run it again, Different concept, Next target and Back behave as today; the free user's second Start still
  opens today's gate; the free cap line shows for free users only.
- Desktop Gauntlet looks and behaves as today.

## Rejected approaches

- **Both progress rows in the run:** shows progress twice.
- **A Gauntlet-only run screen:** more to draw and build for a run the Lift A quiz already handles.
- **Inline topic list on the entry:** a long list pushes Start off screen; the sheet matches Reset and Abandon.
- **Rows as labels only:** after a missed run you couldn't see which wording beat you.
- **All of B3c in one release:** three activities and eight screens in one approval and one review.

## Related
[[2026-10-22-ios-lift-b3b2-design]] · [[2026-10-22-ios-lift-b3a-design]] · [[2026-10-19-ios-launch-june-design]] · [[Mobile MOC]]
