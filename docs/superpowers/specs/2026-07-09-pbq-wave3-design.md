---
up: "[[Drills MOC]]"
type: spec
status: active
cert: netplus, aplus-core1
updated: 2026-07-09
tags: [spec, drill, pbq, design, portmap, wiremap, slots]
---
# PBQ Archetype Expansion — Wave 3 Design (Faceplate / Wiremap / Slots Family)

> Wave 3 of the 4-wave program set out in [[2026-07-02-pbq-wave-program-design]]. Wave 1 (Wireless · Firewall · SOHO, v7.62.0) and Wave 2 (CLI · Discovery · Triage, v7.63.0) are both live. Wave 3 introduces **three new reference kinds** — the biggest single-wave lift of the program — but reuses Wave 2's guarded `analyze.payload.mode` extension mechanism rather than inventing new plumbing for two of them.

**Source-doc note:** the original archetype research (`docs/planning/2026-07-01-pbq-archetype-research-REPORT.md`) was saved untracked and is no longer on disk — this spec re-derives archetype mechanics from scratch (same as Wave 1/2's mockup process did), grounded only in the one-line names that survived in [[2026-07-02-pbq-wave-program-design]] and the Sec+/A+Core2 research handoff.

## Wave 3 — full design

**Scope:** 4 archetypes, 10-12 two-agent-gated scenarios each (~44 total), **three new reference kinds** (`faceplate`, `wiremap`, `slots` — the last shared by two archetypes). Branch: `feat/sim-lab-pbq-wave3`. Ships as one release, target **v7.64.0**.

**Archetype tags** (added to `simLabValidateScenario`'s allowlist): **`'portmap'`**, **`'wiremap'`**, **`'pcbuild'`**, **`'raid'`**.
**Bank id prefixes:** **`np-pm-NN`** (netplus), **`np-cbl-NN`** (netplus), **`a1-pcb-NN`** (aplus-core1), **`a1-raid-NN`** (aplus-core1).

### New reference kinds — one binding pattern, two risk tiers

**`kind:'faceplate'` and `kind:'wiremap'`** both need interactive, selectable elements feeding scoring. Rather than invent new plumbing, both reuse Wave 2's guarded `_slRenderAnalyze` `payload.mode` extension exactly as built: two new mode values (**`'facePorts'`**, **`'wiremapPins'`**) bound to selectable elements on their respective reference, the same way `mode:'excerptLines'` already binds to `.term-line` buttons. Zero new binding mechanism.

**`kind:'slots'`** (PC Build + RAID, literally the same renderer) is deliberately the lower-risk choice: a **static, illustrative** panel only — drive bays or component slots, case/budget constraints shown as labels — with **no live binding** to the configure step. This matches Wave 1's precedent (the Wireless/SOHO network diagram was illustrative context, not a live-bound target) rather than inventing a second new binding direction in one wave. The actual answers live in ordinary `configure` step dropdowns, unbound from the visual panel.

```
// kind:'faceplate'
assets.reference = {
  kind: 'faceplate',
  host: 'SW-CORE1 · 24-port',
  ports: [
    { id: 'gi0-1', label: 'Gi0/1', led: 'up'|'down'|'err-disabled'|'poe-fault', select: true }
  ]
}

// kind:'wiremap'
assets.reference = {
  kind: 'wiremap',
  pins: [
    // pin = End-A pin #; pairId = real TIA/EIA pair (1-4); endBPin = which End-B pin
    // it actually lands on (null/undefined = open); select:true on all 8
    { pin: 1, pairId: 1, endBPin: 1, select: true },
    { pin: 2, pairId: 1, endBPin: 3, select: true }   // example: split pair (crosses to pairId 2)
  ]
}

// kind:'slots' (shared: PC Build's component bays or RAID's drive bays)
assets.reference = {
  kind: 'slots',
  bays: [ { id: 'cpu', label: 'CPU socket' }, { id: 'gpu', label: 'GPU bay · max 280mm' } ],
  notes: [ 'Case: Micro-ATX', 'Budget: $700' ]   // constraint chips, purely illustrative
}
```

- **Selectable elements** on `faceplate`/`wiremap` render as real `<button>`s (never `<div>`, same discipline as `.term-line`) so `mode:'facePorts'`/`'wiremapPins'` can bind them — single source of truth for the fidelity validators' cross-checks.
- **`slots` has zero `select:true` elements** — it is read-only illustration. This is the deliberate scope guard: if a future task finds itself wanting to bind `configure` slot choices back into the `slots` panel live, that is a SECOND new binding direction and out of Wave 3 scope by this spec — STOP and escalate rather than build it.
- **XSS (hard rule, unchanged):** every label/text field on all three new reference kinds is scenario data — escape-THEN-highlight, same discipline as every prior reference kind. No raw `innerHTML` of excerpt/label text anywhere.
- **CSS:** tokens only into `dg-system.css`, zero hex, every `var(--*)` used must be defined (the ratchet guard). New selector families: `.faceplate*`, `.wiremap*`, `.slots*`.

### 1. Switch Port-Map Grid — `archetype:'portmap'` (netplus bank · `np-pm-NN`)
- **Reference:** `kind:'faceplate'`, one entry per physical port (12-24 typical). Two-phase scenario matching the archetype's "Provisioning Grid" name plus a diagnostic twist.
- **Steps:**
  1. **Provision** = a `configure` step, slots per port needing assignment (`<portId>__vlan`, `<portId>__poe`), keyed options, per-slot partial credit via the existing `_scoreConfigureSlots` — zero new scoring code.
  2. **Diagnose** = an `analyze` step in `mode:'facePorts'`, single-select (`multi:false`) — one provisioned port's `led` flips to a fault state (`'err-disabled'`/`'poe-fault'`) and the candidate clicks it, followed by a `configure` step (`rootCause`, `fix` slots) — same two-step diagnose shape as Wave 2's CLI archetype, just via a clicked port instead of a clicked terminal line.
- **Validator `simLabValidatePortMapFidelity(scn)`** → `{ok, errors}`. **Proves:** (a) every keyed provision slot (VLAN/PoE) matches that port's ticket requirement (a small per-port requirement table, same shape as `scn.disco.ports`); (b) the keyed faulty port's `led` state genuinely and *uniquely* signals the keyed `rootCause`/`fix` via a fault-signature table (mirrors `_CLI_FAULT_SIG`) — mutation-checked so no *other* port's LED state could also match the keyed diagnosis.

### 2. Cable-Test Wiremap — `archetype:'wiremap'` (netplus bank · `np-cbl-NN`)
- **Reference:** `kind:'wiremap'`, all 8 pins always visible and selectable (no reveal/progressive mechanic — the whole map is the evidence, read at once).
- **Steps:**
  1. **Flag the fault** = an `analyze` step in `mode:'wiremapPins'`, `multi:true` (split-pair and reversed-pair faults involve two pins; open/short can be one), default (exact-set) scoring — no lenient extension needed here, the correct pin set is always small and fully determinable, unlike triage's deliberately-noisy evidence set.
  2. **Diagnose** = a `configure` step (`faultType`, `fix` slots), keyed.
- **Validator `simLabValidateWiremapFidelity(scn)`** → `{ok, errors}`. **Proves:** (a) the keyed selected pin(s) are mechanically derivable as the true fault from the pin data — `'open'` → `endBPin` is null; `'short'` → two *different* pins share the same `endBPin`; `'splitPair'` → the crossing pins have *different* `pairId`s (a genuine cross-pair swap); `'reversedPair'` → two pins with the *same* `pairId` have swapped `endBPin`s; (b) every other pin is a clean straight-through (`endBPin === pin`, matching `pairId` implied) — exactly one fault, mutation-checked; (c) keyed `faultType`/`fix` match a per-fault signature table.

### 3. Two-Client PC Build Spec-Off — `archetype:'pcbuild'` (aplus-core1 bank · `a1-pcb-NN`)
- **Reference:** `kind:'slots'`, illustrative only — shows each client's bay layout + budget/case constraint chips. No interaction.
- **Steps:** TWO independent `configure` steps, one per client (`clientA`, `clientB`), each with slots `cpu`/`gpu`/`ram`/`psu`/`storage`/`cooling`, keyed options, per-slot partial credit — fully existing plumbing, doubled.
- **Validator `simLabValidatePcBuildFidelity(scn)`** → `{ok, errors}`. **Proves, for EACH client independently:** (a) keyed parts' total price ≤ that client's stated budget (real arithmetic over option price metadata); (b) compatibility rules hold — PSU wattage ≥ CPU+GPU draw, GPU length ≤ case's max-length constraint (a small rule table, not a lookup of real-world part databases); (c) the keyed GPU/CPU tier meets that client's use-case requirement (e.g. a video-editing client needs GPU tier ≥ a stated minimum; a light-office client's minimum is near-zero).

### 4. RAID Workbench (Build & Degrade) — `archetype:'raid'` (aplus-core1 bank · `a1-raid-NN`)
- **Reference:** `kind:'slots'` (same renderer as PC Build — reused per the wave-program spec's plumbing note), showing drive bays instead of component bays.
- **Steps:**
  1. **Build** = a `configure` step (`level`, `driveCount`, `driveSize` slots), keyed to hit the client's stated capacity + fault-tolerance target.
  2. **Degrade** = a second `configure` step (`arrayStatus`, `recoveryAction` slots) — the scenario states N drives have failed; candidate determines current array state and the correct next step.
- **Validator `simLabValidateRaidFidelity(scn)`** → `{ok, errors}`. **Proves:** (a) real RAID capacity math — usable capacity is computed from `level`/`driveCount`/`driveSize` via the standard formula per level (RAID0: `count×size`; RAID1: `size`; RAID5: `(count-1)×size`; RAID6: `(count-2)×size`; RAID10: `(count/2)×size`) and the keyed build answer must produce the client's required usable capacity AND the level's fault tolerance (RAID0: 0 drives; RAID1/5/10: 1; RAID6: 2) must meet the client's stated tolerance requirement; (b) the keyed Phase-2 `arrayStatus`/`recoveryAction` follow correctly from the failed-drive count vs. the built level's actual tolerance — mutation-checked so a level/drive combination that could not actually survive the stated failure is rejected.

## Engine deltas (complete list)
- **Allowlist:** accept `'portmap' | 'wiremap' | 'pcbuild' | 'raid'` in `simLabValidateScenario`'s archetype set; accept `'faceplate' | 'wiremap' | 'slots'` in the reference-kind set (+ shape checks: `faceplate` requires `ports[]`; `wiremap` requires `pins[]` of length 8; `slots` requires `bays[]`).
- **Three new renderers:** `_slRenderRefFaceplate(ref)`, `_slRenderRefWiremap(ref)`, `_slRenderRefSlots(ref)` + their `_slRenderReference` dispatch cases. `faceplate`/`wiremap` expose selectable `<button>`s; `slots` is read-only markup, no exposed interaction handle.
- **Two new analyze modes:** `_slRenderAnalyzeMode` (already the Wave-2 extension point) gains `mode:'facePorts'` and `mode:'wiremapPins'`, each binding to the corresponding reference's selectable buttons — same pattern as `mode:'excerptLines'`, no new scoring path (both use existing exact-set/lenient machinery already built in Wave 2).
- **Four fidelity validators:** `simLabValidatePortMapFidelity` · `simLabValidateWiremapFidelity` · `simLabValidatePcBuildFidelity` · `simLabValidateRaidFidelity`, each `(scn) → {ok, errors}`, pure logic alongside the Wave-1/2 validators.
- **NOTHING else.** No new step types; `_slMountScenario`, `simLabScoreScenario`'s dispatch shell, free/Pro gating, cert entry, Exam mode, milestones stay archetype-agnostic (proven across two prior waves).

## Process per wave (hard rules restated)
1. Concept mockup per archetype (`mockups/<archetype>-concept.html`), each through the 4-stage visual pass IN ORDER: `/design-taste-frontend` → `/emil-design-eng` → `/humanizer` → `/marketing-psychology`. **Mockups ARE the build (faithful lift).**
2. `superpowers:writing-plans` → task-by-task TDD plan. First tasks = the three new renderers + two new analyze modes (shared spine); archetypes ride them. `slots` (zero interaction) can land before or independent of the `faceplate`/`wiremap` interactive pair.
3. `superpowers:subagent-driven-development` execution with per-task spec+quality reviews and a progress ledger.
4. Content gate: EVERY scenario passes its deterministic fidelity validator AND two-agent consensus (domain expert + CompTIA examiner for the correct exam — N10-009 for `portmap`/`wiremap`, 220-1201 for `pcbuild`/`raid`), revise-until-both-approve.
5. Ship: final whole-branch review → LIVE browser verify (computed styles, 375px containment for the faceplate/wiremap grids, not just Node) → bump-version (v7.64.0) → PR → deploy → decision notes.

## Testing & guards
- Per-archetype UAT bank tests mirroring the Wave-1/2 pattern: vm-extract the REAL validators, filter bank by archetype, assert min count (≥10), every scenario passes scenario+fidelity validation. Non-vacuous by construction (mutation-check in review — each fidelity validator must reject a deliberately corrupted port/pin/part/drive).
- Every `analyze` step declares `multi` explicitly (Wave-1 lesson, carried forward).
- CSS ratchet: new `.faceplate*`/`.wiremap*`/`.slots*` blocks land in `dg-system.css`, tokens only; every `var(--*)` used must be defined.
- Dev-fixture rule carries over: mockup-embedded scenarios are labeled fixtures until they clear the gate.
- **New scope guard specific to this wave:** if any task discovers `slots` needs live binding to its configure step (a second new reference↔step binding direction beyond the `facePorts`/`wiremapPins` pattern), STOP and escalate — that is explicitly out of scope by this spec, not an implementation detail to improvise.

## Out of scope (Wave 3)
A fourth new reference kind or a second binding direction for `slots`; free-text input anywhere; changes to the ten archetypes shipped in Waves 1-2; Wave 4's defect-swatch renderer; bank depth beyond 10-12/archetype; Sec+/A+ Core 2 archetypes (still parked, now unblocked for research but not built here); any exam/milestone/gating change.

## Related
[[2026-07-02-pbq-wave-program-design]] · [[Drills MOC]] · [[ADR-003-pbq-structured-model-and-per-cert-validation]]
