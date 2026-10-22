---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: comptia
updated: 2026-10-22
tags: [spec, mobile, ios, launch, lift-b]
---
# Lift B3b1: Practice Sim Lab, made real (approved 22 Oct 2026)

B3b1 is the first Sim Lab release of Lift B3 ([[2026-10-19-ios-launch-june-design]] stage 3, after
[[2026-10-22-ios-lift-b3a-design]]). It makes practice Sim Lab on phones look and flow like the June
E2E, and gives the full exam's Sim Lab questions the console look B2 left for B3. Sim Lab's own
Exam mode (Pro) is **B3b2**, a separate release.

Phone only (max-width 899px); desktop unchanged. Sim Lab exists on CompTIA certs only
(`_SL_PBQ_CERTS_HOME`). `app.js` stays at its 8301-line ratchet.

## What the app does today at 402pt (22 Oct)

- The app top bar shows a raw page label ("sim-lab-entry", "sim-lab") on every Sim Lab screen, and
  the tab bar sits over the round.
- A round is one long scroll: scenario, optional logs, one reference panel, then every step, with
  Reset and Submit only at the very bottom. Reference diagrams (network maps especially) are
  thumbnail-sized. Multi-pick command chips render as plain bordered text.
- In a session, Submit goes straight to the next round; feedback arrives on the verdict
  (`#page-sim-lab-result`): seal, %, "N of M sims passed", rows that open to Answer / You put / why,
  a "Where you slipped" card and Back to Practice.
- Practice Leave does not ask. Reset asks with `confirm()`. (Exam mode's leave and submit prompts
  are B3b2.)

## Founder decisions (22 Oct 2026)

1. **Split:** B3b1 practice Sim Lab (+ the console look inside the full exam), B3b2 Sim Lab Exam mode.
2. **One scroll, docked actions:** scenario and reference on top, steps as June cards below, a fixed
   dock with **Reset · Submit answers**. Same flow as today, no engine change.
3. **Reference: card + tap to enlarge:** full-width card with a "Tap to enlarge" that opens the
   diagram full screen in a bottom sheet you can scroll.
4. **Exam-style chrome:** no app top bar or tab bar during a round; Reset asks in the in-app bottom
   sheet B2 built, not `confirm()`.
5. Founder approved the design as presented: "its perfect".

## The screens

### Start screen (`#page-sim-lab-entry`)
June header (back chevron, "Sim Lab"), the hero ("Practice the hands-on PBQs" and its line), the
Practice / Exam segment (Exam keeps its Pro tag and gate), the "Today's target" card, round chips
(3 / 5, and 10 with its Pro lock), **Start** docked at the bottom, above the tab bar. Copy, gates and the free daily
session are today's. No app top bar; the tab bar stays.

### Loader
The June "generating" treatment from the quiz (skeleton and shimmer line), reading
"Building round N of M…". Reduced motion: static.

### Round (`#page-sim-lab`, practice)
- **Top bar:** Leave · "Round 2 of 3" pill · count-up timer; June round ticks under it. No app top
  bar, no tab bar.
- **Scenario** in a June card (prose, `<mark>` kept). Logs, when present, in a mono card.
- **Reference.** Some references are answer surfaces (steps select lines, ports or pins inside
  them), so they never leave the round:
  - `terminal` (answer surface for `excerptLines`): the E2E console card (cert-ios-exam.html
    `?v=pbq`): a bar with the host name and the static word "console", a mono body.
  - `faceplate`, `wiremap` (answer surfaces for `facePorts`, `wiremapPins`): a full-width June card,
    inline, scrolling sideways inside the card if wider than the screen. No enlarge.
  - passive kinds (`network`, `timeline`, `layered`, `slots`, `swatch`): a full-width June card
    with its title and a **Tap to enlarge** button. Enlarge opens a copy full screen in the enlarge
    sheet (scrollable both ways, Close button, swipe-down, Escape). A copy is safe because these
    kinds hold no answers.
- **Steps** as June cards: "Step 1 of 2", the prompt, then the controls in June style: selectable
  chips (multi-pick), June selects (dropdowns), June rows with drag handles (order, categorize,
  match), June fields (fill-in; numeric keyboards stay). The tunnel dual-panel stacks its A / B
  panels.
- **Dock:** fixed at the bottom, **Reset** (ghost) and **Submit answers** (primary). The scroll area
  is padded by the dock's height; a focused field scrolls clear of the dock and keyboard. Reset asks
  in the confirm sheet: title "Start this PBQ again?", body "Your answers on this question will be
  cleared.", go "Clear answers", stay "Keep them". If the round ends with the sheet open, the sheet
  closes as "Keep them".
- **Leave** stays unprompted in practice, as today (nothing is lost; the free daily session was
  counted at Start).

### Verdict (`#page-sim-lab-result`)
In the language of the B2 exam results: headline, % score, "N of M sims passed · steps", one row per
round (verdict tone, title, topic, score) that opens to Answer / You put / why, the "Where you
slipped" card, **Back to Practice** docked, and today's free-user upsell. No app top bar or tab bar.

### Inside the full exam
A Sim Lab question keeps the B2 exam top bar and dock (Prev · Flag · Next), so Sim Lab's own dock
does not appear there. Its reference and steps use the cards above. **Reset** moves to:
- the console card's bar when the reference is a `terminal` (as the E2E draws it);
- otherwise a compact Reset pill at the top right of the first step card (no reference, or any
  other kind).
Reset asks in the same confirm sheet.

## Architecture

- **Scope guard.** `#page-sim-lab` also hosts Sim Lab Exam mode (B3b2) and the legacy single-PBQ
  path, and `_slMountScenario` is shared with Decision Lab. So:
  - Sim Lab adds `isl-practice` to `#page-sim-lab` whenever the page is not in Exam mode (session
    practice and the legacy single-PBQ path), and removes it in Exam mode. All round restyling is
    scoped to `#page-sim-lab.isl-practice`; Exam mode keeps today's look until B3b2.
  - The chrome is page-wide on purpose: no app top bar and no tab bar on `#page-sim-lab` in either
    mode (Exam mode is immersive too).
  - Mount hooks (enlarge button, Reset routing, Reset placement) run only when the caller passes
    `opts.lift` (the Sim Lab session/legacy callers and the full exam's `_examRenderPbq`). Decision
    Lab does not pass it and is untouched (B3c).
- **CSS:** a `B3b1 · SIM LAB` section in `lift-ios.css`, class prefix `isl-` for new hooks, scoped
  to `#page-sim-lab-entry`, `#page-sim-lab.isl-practice`, `#page-sim-lab-result` and
  `#page-exam .exam-pbq`, overriding the `dg-system.css` Sim Lab rules on phones only.
- **Phone-only hooks in `features/sim-lab.js`** (behind `opts.lift` and a `(max-width: 899px)`
  check, desktop untouched): the passive reference card's "Tap to enlarge" button; Reset routed to
  the confirm sheet; the Reset placement inside the exam; the `isl-practice` class.
- **`features/ios-sheet.js`** (new, loaded eagerly `defer` from `index.html` like `ios-exam.js`;
  `exam.js` and `sim-lab.js` are lazy, so the sheet must not live in either; `ios-*` files are not
  in `sw.js` precache, so no `sw.js` change):
  - `window.iosSheet({title, body, go, stay}) -> Promise<boolean>`: B2's `_examSheet` moved here
    unchanged (same `#exam-sheet` markup, focus return, key isolation, one at a time).
  - `window.iosSheet.dismiss()`: closes an open confirm sheet as "stay" (false). `exam.js` keeps
    calling it on auto-submit (B2 final review I1); Sim Lab calls it when a round ends.
  - `window.iosEnlarge(node, title)`: the enlarge sheet, its own element `#isl-enlarge` (full
    screen, scrollable, Close, swipe-down, Escape). It holds a copy of a passive reference. Only one
    sheet is open at a time; opening one closes the other.
  - `features/exam.js` calls `iosSheet` / `iosSheet.dismiss` in place of its private copy.
- **`lift-shell.js`:** `HIDE_ON` gains `sim-lab` and `sim-lab-result`; the app top bar hides on
  all three Sim Lab pages (CSS, as other Lift screens).
- No engine, scoring, gating or data changes.

## Process

1. Draw into the E2E first: a new `mockups/cert-ios-simlab.html` with states `entry`, `loading`,
   `round` (terminal console), `round-map` (network reference), `enlarge`, `reset`, `verdict`,
   `verdict-open`; update `cert-ios-exam.html?v=pbq` so Reset sits in the console bar; HUD
   **B3b ›**. 5-stage visual pass on the drawing. Founder taps it in the Simulator and approves.
2. Plan, build (native), side-by-sides, final review, ship v8.188.0 on "ship it".

## Acceptance

- At 390 and 402: a full 3-round practice session from Home → start → rounds → verdict, with no app
  top bar, no tab bar during rounds, the dock always visible, and no horizontal scroll.
- Every reference kind renders in its card; terminal, faceplate and wiremap stay inline and still
  take answers; passive kinds open full screen and close again.
- Sim Lab Exam mode and Decision Lab look as they do today (apart from Exam mode losing the app top
  bar and tab bar).
- Reset asks in the sheet; "Keep them" leaves answers in place, "Clear answers" clears them.
- Every step type is operable at phone width with 44pt targets (chips, selects, drag handles,
  fields).
- Inside the full exam, a Sim Lab question shows the console card with Reset in its bar.
- Free daily session, Pro gates and scoring unchanged; desktop unchanged.

## Rejected approaches

- **One step per screen:** easier reading, but changes how rounds work and needs engine work.
- **Inline-only bigger diagrams:** network maps stay cramped at phone width.
- **Keep the tab bar during rounds / keep `confirm()`:** founder chose the exam-style chrome.
- **A phone copy of Sim Lab:** would duplicate a 4,260-line engine (the same reason B2 rejected a
  phone copy of the exam).
- **CSS only:** cannot add the enlarge button or the sheet.
- **One release for all of Sim Lab:** about a dozen states; Exam mode (Pro) ships as B3b2.

## Related
[[2026-10-22-ios-lift-b3a-design]] · [[2026-10-21-ios-lift-b2-design]] · [[2026-06-24-sim-lab-session-mode-design]] · [[Mobile MOC]]
