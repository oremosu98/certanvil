---
up: "[[Decisions MOC]]"
type: decision
status: settled
cert: all
updated: 2026-07-25
tags: [decision, design, shipped]
---
# Quiz navigation slides sequentially, not as two overlapping pages

## Context
Motion-lift wave 2 (v8.0.0) adopted the shared `t-*` primitives into the quiz
engine. Six of the seven surfaces were straight adoption diffs. The seventh —
question navigation — was not, because the mockup and the live engine disagree
about what a "page" is.

`mockups/quiz-engine-e2e-motion-concept.html` builds a **fresh `.t-page`
element per question** and appends it into a `.t-slide` container, so the
incoming and outgoing questions briefly coexist in the DOM. That overlap is
what its comment calls "the incoming page must join the flow BEFORE the
outgoing one leaves it" — detaching first empties the container for a frame,
it collapses to zero height, and the document jumps.

The live engine renders **in place** into fixed ids: `#q-text`, `#q-scenario`,
`#options`, `#exp-box`, `#exp-acc`, `#btn-next`, and more. Roughly forty call
sites across `features/quiz-engine.js` and `app.js` address those ids
directly.

## Decision
Keep the quiz card a **single element** and sequence the transition instead of
overlapping it: the outgoing content slides out along `--dgm-dir`, then the new
question renders and rides wave 1's staggered `.t-reveal` back in.

`--dgm-dir` is resolved from `idx < current` **before** `current` moves, so
back-navigation animates backwards. Verified in prod-equivalent conditions:
forward exits `translateX(-8px)`, back exits `translateX(+8px)`.

## Why
Cloning the card to get two coexisting pages would duplicate every one of those
fixed ids, so each of the ~40 call sites would need to become scoped to "the
active page" — a rewrite of the app's single most-used surface.

That surface has a bad history: the wave 7/8 extraction regressions, the
infinite quiz spinner (v7.80.1), the Hot-Area scoring bug, and the closure-captive
`ReferenceError` class fixed across v7.79.2 / v7.96.0 / v7.97.0. Wave 2 was
already touching four files and adding thirty-nine UAT guards; absorbing a
structural rewrite of the question card on top of that trades a real regression
risk for a motion nicety.

The sequenced version also sidesteps the failure the mockup's ordering rule
exists to prevent. Because the card never leaves the document flow, the
container cannot collapse mid-transition — avoided **by construction** rather
than by getting an ordering right.

What is lost is genuinely only the overlap: direction, distance, blur, easing
and the enter/exit asymmetry all survive.

## Affects
- `_navigateTo(idx, after)` in `features/quiz-engine.js` — new; the single
  choke point. `jumpToQuestion()` and `advance()` both route through it, which
  also made `advance()` asynchronous (200ms exit before the index moves).
- `#page-quiz .q-card.is-hiding .t-reveal` in `dg-system.css` — quiz-scoped
  directional exit. Wave 1's generic `.is-hiding` deliberately zeroes transform
  so a one-shot reveal does not read as a reverse reveal; navigation is the one
  place direction is worth showing, so the override is scoped rather than
  applied to the shared primitive.
- Spec / build target: [[2026-07-24-quiz-pbq-motion-mockup-scope]]

## Rejected alternatives
- **Two-page overlap, faithful to the mockup.** Rejected for wave 2 on
  regression risk, not on merit. Still the better end state if the founder
  wants it; it belongs in its own change where the id-scoping rewrite is the
  whole diff and can be reviewed as such.
- **Reuse wave 1's `.is-hiding` fade unchanged (no direction).** Rejected:
  forward and back would look identical, and a back button that does not read
  as going back is worse than no motion at all.
- **Cross-fade with no travel.** Rejected for the same reason — it discards the
  directional information that is the entire point of the slide.

## Status — SETTLED 2026-07-25. Not revisiting.

**The founder explicitly delegated this call rather than ratifying it**, so it is
closed on the reasoning below, not on a sign-off.

The recommendation given, and taken: **do not build the two-page overlap.**

- **What it would cost.** ~40 fixed-id call sites (`#q-text`, `#options`,
  `#exp-box`, …) rescoped to "the active page", on the app's most-used surface —
  the one with the worst regression history in the repo (wave 7/8 extraction
  breakages, the v7.80.1 infinite spinner, the silent Hot-Area scoring bug).
- **What it would buy.** ~220ms where two questions are on screen together. It
  had to be sampled mid-flight to confirm it was even happening; it is not
  reliably perceptible at full speed.
- **The sequencing argument, which mattered more than the aesthetics.** The clean
  way to build it is on top of #21 (globals wrapped in state objects), where
  "which page owns this state" becomes a natural question. #21 is `saas-gated`
  and frozen. So the overlap is genuinely **blocked on prior work**, not merely
  expensive — building it standalone means doing that work badly and redoing it.

**What was done instead** (v8.5.0): the real defect was not the missing overlap,
it was the *duration*. Every advance spent 200ms before the new question began
arriving, on a surface hit dozens of times per session. `_NAV_EXIT_MS` went
200 → 130, so the exit is cut off mid-slide and the transition reads as
handed-over rather than sequenced. The directional cue is untouched.

Founder response after living with it: *"im happy with where its at currently."*

**Reopen only if** #21 is ever unfrozen — at that point the page-scoping falls
out of that work rather than being invented for this.

## Related
[[BRAND]] · [[feature-lane]] · [[CLAUDE]]
