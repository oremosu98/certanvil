# Sim Lab PBQ Wave 4 — Laser Print Defect Clinic (A+ Core 1)

**Date:** 2026-07-11
**Status:** Approved design, pre-mockup
**Program:** Final wave of the 4-wave, 11-archetype PBQ program ([[2026-07-02-pbq-wave-program-design]]). Program spec's entire inherited constraint: "defect-swatch renderer (most novel; isolated on purpose)".
**Ship target:** v7.66.0 · branch `feat/sim-lab-pbq-wave4` · main was `aeec79c` (v7.65.1) at design time.

---

## 1. Mechanic

The candidate is shown a simulated printed page exhibiting exactly one laser-print defect (the **swatch**), framed by a short trouble ticket. They diagnose it through **existing step types only**:

- Typical primary step: `match` (defect/symptom → failed component) or `configure` (pick component per slot: "root cause", "imaging stage affected").
- Optional secondary step: `order` (remediation sequence, e.g. print cleaning page → replace drum → test print), or `categorize` for multi-symptom scenarios.

**No new analyze mode.** Verified against `_validateStepPayload` (features/sim-lab.js:11): the six existing step types (`order`, `categorize`, `match`, `analyze`, `fillin`, `configure`) fully cover the diagnosis interaction. Wave 4's engine surface is the reference kind alone — even more isolated than the program spec anticipated.

**The swatch is static.** Zero click handlers on the swatch itself; all interaction lives in the step panel. Rationale: (a) mirrors the real exam, which shows defective output and expects cold recognition; (b) sidesteps the `.sl-sel` selection-feedback and tap-target-size bug class Wave 3 paid for, and works identically on Desktop, Safari/WebKit, and iOS Capacitor with no precision-pointer requirements; (c) keeps the "most novel" renderer isolated on purpose.

## 2. Defect taxonomy (5 defects, exam-mirrored)

Chosen to mirror the 220-1201 objective 3.7 print-quality defect list. Objective text MUST be re-confirmed against the real 220-1201 objectives during scenario authoring.

| `defect` enum | Visual | Root cause (truth table) |
|---|---|---|
| `spots` | Marks repeating at a fixed vertical interval | Damaged drum / dirty roller — interval ties to roller circumference |
| `streak` | Clean vertical white band, full page height | Blocked toner path / scratched drum |
| `smear` | Toner smudges, wipes off — not bonded | Fuser assembly (heat/pressure) failure |
| `ghost` | Faint repeat of a prior image further down the page | Drum not cleaned/erased (cleaning blade / erase lamp) |
| `skew` | Content printed crooked / page creased | Pickup roller / paper-path mechanical fault |

**Cut: shadowing/grey background** — overlaps "faded print" (a toner-level issue), not a standalone bullet in the real objective; would blur the taxonomy.

## 3. New reference kind: `swatch` (8th kind)

Extends the allowlist at features/sim-lab.js:68 (`['network','timeline','layered','terminal','faceplate','wiremap','slots']` → + `'swatch'`).

```js
reference: {
  kind: 'swatch',
  title: 'Sample output — Accounting LaserJet',   // required, non-empty string
  defect: 'spots',                                 // required, one of the 5 enum values
  caption: 'Page 3 of the monthly report, tray 2'  // optional, non-empty string if present
}
```

- **Validator branch** in `simLabValidateScenario`: `defect` must be one of the five enum values; `title` required; `caption`, if present, must be a non-empty string (match how other kinds validate optional fields). This is the render-fidelity guarantee — a scenario cannot claim a fuser fault yet render a drum defect, because the renderer draws from the same `defect` field the answer key is validated against.
- **Renderer `_slRenderRefSwatch(ref)`**, dispatched from `_slRenderReference` (features/sim-lab.js:1924) alongside the other seven kinds. **Single swatch only** — no reference-vs-defect comparison (real exam gives no clean page; comparisons die on iPhone viewports; post-answer explanation can carry any needed contrast).
- **Pure CSS/HTML rendering:** each defect pattern built from CSS gradients/transforms in `dg-system.css`, tokens only, zero hex, zero binary assets. Themes automatically, one payload for all platforms.
- **Accessibility:** the defect is described in `aria-label`/visually-hidden text on the swatch container (pattern from Wave 3's faceplate port labels).
- **Escape-then-highlight:** `title` and `caption` are scenario data — `_esc()` before any markup wrapping (standing hard rule).

## 4. Fidelity validator: `simLabValidateSwatchFidelity`

Dev-fixture rule applies: no scenario enters the seed bank until it passes this validator AND the two-agent gate.

- Owns the defect→cause truth table (§2) and checks the scenario's answer key actually names a component consistent with the rendered `defect` (e.g. a `spots` scenario whose `match`/`configure` answer is "fuser" is rejected).
- **Truth-table semantics: defect → SET of acceptable components**, not a single canonical one (`spots` → {drum, roller}; `streak` → {toner path, scratched drum}; the others are single-member sets). The validator accepts an answer key naming any member of the set; anything outside the set is rejected. Pinned here so the validator isn't written against an ambiguous table (Wave 3's bug class).
- **Wave 3 lesson applied:** hand-derive the truth-table logic against fixtures before believing a green run — both of Wave 3's fidelity-validator bugs (unreachable `short` branch; cross-level RAID comparison) were in plan-supplied literal code that looked correct.
- Multi-symptom scenarios (§5) declare a primary `defect` for the swatch; the validator checks the primary mapping only.

## 5. Seed bank

- **10-12 scenarios** (house norm), file `features/sim-lab-seed-aplus-core1.js` (existing A+ Core 1 bank, currently 98 scenarios).
- Id prefix `a1-swatch-NN`; archetype tag `swatch` (14th tag). No hardcoded id-prefix assumptions in tests (Wave 3's CI fragility lesson).
- Mix: ~2 per defect + ~2 multi-symptom ("spots AND faint print — what do you check first").
- **Objectives 3.6/3.7** — believed to be a genuine coverage-gap fill (3.7 ≈ 2 scenarios today, 3.6 ≈ 1). The plan MUST include an explicit task to verify both the current coverage counts and the objective numbering/text against the real 220-1201 objectives before authoring — do not treat these counts as confirmed.
- **Two-agent gate per scenario:** printer-domain expert + CompTIA examiner (220-1201 lens), revise until both approve.

## 6. Testing & verification

- UAT vertical slice through the Practice path (Wave 3's pattern in tests/uat.js) — remember: no jsdom, `grep -a` for the seed/feature files, flexible-whitespace extraction regexes, no hardcoded global totals.
- CSS written only after reading the renderer's actual emitted DOM (Wave 3's dead-selector gotcha). No `.sl-sel` rule needed — the swatch is static by design.
- Live-verify with a fresh `<link>` cache-buster on `dg-system.css`; prefer `getBoundingClientRect()`/screenshot over `getComputedStyle`.
- Cross-platform check on Desktop, Safari/WebKit, iOS Capacitor (standing constraint).

## 7. Pipeline

Mockup (mockups/*-concept.html, "mockups ARE the build") → mandatory 4-stage visual pass (`design-taste-frontend` → `emil-design-eng` → `humanizer` → `marketing-psychology`) → `superpowers:writing-plans` → subagent-driven build → `/ship` at v7.66.0.

## Rejected approaches

- **Clickable defect regions on the swatch** (wiremap-pin-style) — coordinate-precise tap targets on a reflowing image are the worst case for the iOS/Safari/Desktop parity constraint; Wave 3 shipped two real bugs in far simpler click-region feedback.
- **Static-only swatch with no diagnostic step** (slots-style, purely illustrative) — throws away the "Clinic" diagnosis premise; the archetype would test nothing.
- **New analyze mode (`swatchRegions` or similar)** — unnecessary; existing step types cover the interaction, and every new mode multiplies validator/renderer/CSS surface.
- **Reference-vs-defect side-by-side comparison** — easier than the real exam (which gives no clean page), and illegible or meaningless once stacked on an iPhone viewport.
- **Shadowing/grey-cast as a 6th defect** — overlaps faded-print/toner issues, not a distinct objective bullet.
- **SVG or image-asset rendering** — SVG introduces a new idiom no reference kind uses; images add binary assets, don't theme, need resolution variants.
