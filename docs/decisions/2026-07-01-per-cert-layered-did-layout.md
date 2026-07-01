---
up: "[[Decisions MOC]]"
type: decision
status: active
cert: netplus, secplus
updated: 2026-07-01
tags: [decision, design, drill, shipped]
---
# Per-cert Defense-in-Depth layout: nested-frames (Net+) vs stacked-bands (Sec+)

## Context
The Sim Lab `layered` reference renderer backs the Defense-in-Depth PBQ archetype for both Net+ and Sec+. During the initial build (Task 8) it was unified onto a single **nested-frames** (concentric rectangles) layout for both certs, to keep one renderer. But the two approved concept mockups are visually different: `defense-in-depth-netplus-concept.html` is nested-frames, while `defense-in-depth-secplus-concept.html` is **stacked-bands** (a strong perimeter frame containing a vertical stack of horizontal layer-bands above an exposed core). Shipping Sec+ as nested-frames therefore violated the "mockups ARE the build — faithful lift" rule for that surface.

## Decision
Support **two** layered layouts, selected by an optional `layout: 'nested' | 'stacked'` field on the `layered` reference (default `nested`, fully backward-compatible). Net+ DID keeps nested-frames; the 5 Sec+ DID seed scenarios set `layout: 'stacked'`. Each cert renders a faithful lift of its own mockup. The stacked renderer also draws an optional perimeter device box (`layers[0].device.label`, e.g. FW-1 / WAF-1) to match the Sec+ mockup.

## Why
- Faithful-lift rule: each mockup is the build target for its own surface; a single unified layout could only match one of them.
- Data-driven, not cert-hardcoded: the `layout` field keeps the renderer generic and lets any future cert/scenario opt into either layout without touching dispatch logic.
- Backward-compatible: absent/`'nested'` routes to the existing renderer, so nothing Net+ (or any untagged scenario) changes.

## Affects
- `features/sim-lab.js`: `_slRenderReference` dispatch on `ref.layout`; new `_slRenderRefLayeredStacked` (perimeter frame + stacked interior bands + exposed core + optional perimeter device box); existing `_slRenderRefLayered` (nested) unchanged; `simLabValidateScenario` permits/validates the optional `layout` field.
- `dg-system.css`: `.sl-perim*`, `.sl-band*`, `.sl-fw*` stacked classes (tokens only — `--red`/`--accent`; no `--fail`).
- `features/sim-lab-seed-secplus.js`: the 5 `secplus-did-*` scenarios carry `layout: 'stacked'` + a perimeter `device`.
- Spec/plan: [[2026-06-30-sim-lab-pbq-implementation]] · [[ADR-003-pbq-structured-model-and-per-cert-validation]]

## Rejected alternatives
- **Single unified nested-frames for both certs** (the original Task-8 approach): simpler (one renderer) but breaks faithful-lift for Sec+; rejected once the user asked for the Sec+ mockup's stacked-bands look.
- **Cert-keyed branch inside the renderer** (`if cert === 'secplus'`): couples the renderer to cert identity, which the renderer otherwise never inspects (it only sees the `reference`); rejected in favor of a data field on the reference itself.

## Related
[[Decisions MOC]] · [[Drills MOC]] · [[ADR-003-pbq-structured-model-and-per-cert-validation]] · [[2026-06-30-sim-lab-pbq-implementation]]
