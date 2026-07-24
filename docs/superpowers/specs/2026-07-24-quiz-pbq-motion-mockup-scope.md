---
up: "[[Design MOC]]"
type: spec
status: proposed
cert: all
updated: 2026-07-24
tags: [design, motion, pbq, quiz-engine, scope]
---

# Scope — Inline Quiz PBQ Motion Mockup

Companion scope for a second motion mockup covering the question types
[`quiz-engine-e2e-motion-concept.html`](../../../mockups/quiz-engine-e2e-motion-concept.html)
deliberately left out. Written 2026-07-24 after a deeper scan of the real
engine. Not yet built — this is the brief.

<!-- graphify:touches renderCliSim renderTopology renderHotArea renderOrder -->

## The correction that reframes this

An earlier pass assumed "PBQ types" meant the Sim Lab program. **It does not.**
Those are two different subsystems and conflating them would have produced a
redundant mockup:

| | Sim Lab PBQ program | Inline quiz PBQ types |
|---|---|---|
| Status | **Shipped**, 11 archetypes across 4 waves (v7.66.0) | Shipped, but no motion pass |
| Mockups | 11 already exist (`sim-lab-*`, `diagram-pbq-*`, `hot-area-*`, …) | **none** |
| Code | `features/sim-lab-*.js` + seeds | `app.js` — never extracted in #138 |
| Entry | Sim Lab launcher | Injected into a normal quiz session |

**Only the right-hand column is in scope.** The Sim Lab archetypes have their
own design language and their own signed-off mockups; re-mocking them would be
waste.

## In scope — four types

Each is badged in `render()` via `#pbq-badge` and dispatched from the same
`qType` switch as MCQ.

| Type | Renderer | Badge | Interaction |
|---|---|---|---|
| `order` | `renderOrder` / `addToOrderSequence` / `submitOrder` / `renderOrderState` — `features/quiz-engine.js:808` | `Ordering` | click-to-append into a sequence, then submit |
| `cli-sim` | `renderCliSim` — `app.js:7154` | `CLI Sim` | run commands, read output, then a diagnosis MCQ |
| `topology` | `renderTopology` — `app.js:7277` | `Topology` | drag devices into zones, scored by `correctPlacements` |
| `hot-area` | `renderHotArea` — `app.js:6105`, plus `_renderHotAreaTopology` (6137), `_renderHotAreaOsi` (6192), `_renderHotAreaCableGrid` (6222) | `Hot Area · {OSI\|Cable\|Topology}` | click the correct region of a diagram |

`hot-area` carries three sub-shapes off `q.subShape`, so it is effectively four
surfaces, not three.

## Motion candidates per type

Drawn from the same two skills, under the same precedence rule — **BRAND.md §6
owns every duration and easing value; the skill supplies choreography only.**

### `order` — sequence building
- **`18-texts-reveal`** — steps enter staggered, as MCQ options already do.
- **`01-card-resize`** — the sequence tray grows as items are appended; height
  tween rather than a jump.
- **`12-error-state-shake`** — wrong ordering on submit, reusing the established
  negative vocabulary.
- **`25-checkbox-check`** — a placed step earns its position marker.
- Open question: does removing a step animate back to the pool, or vanish? A
  FLIP would be correct but is the most expensive thing in this scope.

### `cli-sim` — terminal
- **`15-shimmer-text` → use `antalik-effects` instead** (per the global rule)
  for the "running…" state between command and output.
- **`14-skeleton-reveal`** — output arriving, cross-fade rather than a pop.
- **`18-texts-reveal`** — output lines landing in sequence reads like a real
  terminal; a whole block appearing at once does not.
- Caution: terminal output can be long. Staggering 40 lines at 60ms is 2.4s of
  motion — cap the stagger at the first few lines and let the rest land
  together.

### `topology` — drag and drop
- **`11-avatar-group-hover`** — the one place in the app with a genuine
  horizontal item stack (the device tray), which is exactly this transition's
  documented use case.
- **`10-success-check`** / **`12-error-state-shake`** — per-zone verdict on
  submit.
- **`01-card-resize`** — zones accepting a device.
- Caution: drag is pointer-driven and already carries its own motion. Adding
  transition on top of a live drag fights the pointer. Animate **drop**, never
  **drag**.

### `hot-area` — click-on-diagram
- **`17-tooltip`** — region labels on hover/focus. Same touch caveat: the
  trigger must be focusable or it is dead on mobile.
- **`10-success-check`** — correct region, anchored to the click point.
- **`12-error-state-shake`** — wrong region.
- **`03-notification-badge`** — marking a chosen region.
- Caution: hot-area is the most mobile-hostile type in the set. Tap targets on
  a diagram are small; verify at 375px before anything else.

## Explicitly out of scope

- Every Sim Lab archetype (`cli`, `diagram`, `firewall`, `portmap`, `wireless`,
  `wiremap`, `discovery`, `defense`, `incident`, `pcbuild`, `raid`, `soho`,
  `swatch`, `triage`) — shipped with their own mockups.
- Exam mode chrome — shares the engine but has its own navigation model.
- Gauntlet ladder / rung chips — separate mode.

## Constraints carried from the first mockup

1. **Copy `design/brand/mockup-starter-tokens.css` verbatim.** Never freehand.
2. **Never paste `transitions.dev`'s `_root.css`.** Re-time onto BRAND §6.
3. **One `cubic-bezier` in the file.** The audit that proves it:
   ```js
   [...document.styleSheets].flatMap(s => [...s.cssRules])
     .flatMap(r => (r.cssText.match(/cubic-bezier\([^)]+\)/g) || []))
   ```
4. **No rAF-gated one-shot reveals.** rAF is dead in a backgrounded tab; a user
   who switches away mid-question returns to an invisible question. Use forced
   reflow + synchronous write.
5. **Check `display` on any `<span>` you size.** Inline spans silently ignore
   width/height — computed width reporting `%` instead of `px` is the tell.
6. **`prefers-reduced-motion` guard on every animated surface.**
7. **Measure `stroke-dasharray` with `getTotalLength()`**, never hardcode.
8. **Verify at 375px and in both themes** before claiming done.

## Suggested sequencing

`order` first — it is the only non-diagram type, shares the most DOM with the
existing mockup, and is the cheapest validation that the motion vocabulary
extends. Then `hot-area` (highest mobile risk, so fail fast), then `cli-sim`,
then `topology` (drag is the most complex and the least reusable).

Splitting across two files is reasonable if one gets unwieldy: `order` + `cli-sim`
are text-shaped, `topology` + `hot-area` are diagram-shaped.

## Related
[[BRAND]] · [[MOTION_AUDIT]] · [[Design MOC]] · [[feature-lane]]
