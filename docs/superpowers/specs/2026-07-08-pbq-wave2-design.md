---
up: "[[Drills MOC]]"
type: spec
status: active
cert: netplus, aplus-core1
updated: 2026-07-08
tags: [spec, drill, pbq, design, terminal]
---
# PBQ Archetype Expansion — Wave 2 Design (Terminal / Output-Excerpt Family)

> Wave 2 of the 4-wave program set out in [[2026-07-02-pbq-wave-program-design]]. Wave 1 (Wireless · Firewall · SOHO) shipped v7.62.0 on the existing network renderer + configure/order/analyze. Wave 2 introduces the **one new renderer the whole program was staged around**: a shared terminal / output-excerpt panel with progressive reveal, built so a future Sec+ log-analysis archetype reuses it unchanged.

**Source of truth:** the three FOUNDER-APPROVED mockups (`mockups/cli-fault-isolation-concept.html`, `network-discovery-audit-concept.html`, `command-output-triage-concept.html`) and their footer engine-mapping comments. **Mockups ARE the build (faithful lift** — visual/interaction fidelity, not markup fidelity; where a mockup detail and the engine's conventions disagree, **the engine wins**).

## Wave 2 — full design

**Scope:** 3 archetypes, 10-12 two-agent-gated scenarios each (~33 total), **exactly ONE new renderer** (the terminal reference panel) + one small backward-compatible analyze extension. Branch: `feat/sim-lab-pbq-wave2`. Ships as one release, target **v7.63.0**.

**Archetype tags** (added to `simLabValidateScenario`'s allowlist — short lowercase, matching the `diagram|incident|defense|wireless|firewall|soho` convention): **`'cli'`**, **`'discovery'`**, **`'triage'`**. (`'cli'` chosen over `'clifault'` — the allowlist favors the shortest unambiguous token; no collision with existing tags.)
**Bank id prefixes** (matching `np-fw-NN` / `np-wifi-NN` / `a1-soho-NN`): **`np-cli-NN`** (netplus), **`np-disc-NN`** (netplus), **`a1-cot-NN`** (aplus-core1).

### The new terminal reference renderer — the ONE new piece of plumbing

A new `assets.reference` kind, dispatched by ONE new case in `_slRenderReference` (`ref.kind === 'terminal' → _slRenderRefTerminal(ref)`), rendered into the existing `.sl-ref` panel. Data contract:

```
assets.reference = {
  kind: 'terminal',
  host: 'WS-14 · admin shell',        // term-head left chrome
  session: 'session 7f2a · read-only', // term-head right chrome
  excerpts: [                          // ordered output blocks; one per command / source / section
    {
      id: 'showint',                   // stable, referenced by steps + validator
      promptLine: 'SW-2# show interfaces Gi0/14',  // command echo (accent-prompt token)
      lines: [                         // the output body, line by line
        { id:'l1', text:'Half-duplex, 100Mb/s', highlight:'hot', select:false },
        { id:'l2', text:'2471 late collisions', highlight:'hot', select:true, evidence:true }
      ],
      reveal: 'showint',               // reveal-trigger key (see below); omit = always visible
      necessary: true                  // CLI only: excerpt is part of the minimal isolation cover
    }
  ]
}
```

- **Selectable lines** are declared per line: `select:true` makes the line a keyboard-focusable BUTTON (never a div — same as the existing `_slRenderAnalyze` line buttons); `evidence:true|false` (triage) or `key:'…'` (discovery) is the answer semantics an analyze step targets by `excerpt.id + line.id`. `highlight` ∈ `{'hot','good','k'}` maps to the mockup's `.term-out .hot/.good/.k` classes.
- **Progressive-reveal binding is DATA, not archetype code.** Each excerpt carries an optional `reveal` key; the renderer starts every keyed excerpt hidden (`[hidden]`) and exposes a callback `revealExcerpt(key)` on the panel. A step interaction fires it: the CLI command-menu pick (§CLI) and the discovery source-tab (§Discovery) both call `revealExcerpt(excerpt.reveal)` — the renderer never knows which archetype drove it. Triage omits `reveal`, so all excerpts show immediately. A future Sec+ log-analysis archetype reuses this untouched (reveal a log section on filter-pick).
- **XSS (hard rule):** every `promptLine` and `line.text` is scenario data (fixture-authored, but the engine must treat it as untrusted) — render via the repo's **escape-THEN-highlight** discipline exactly like `setQuestionText` (`escHtml` first, then wrap the `highlight` span; the leading prompt token is spanned AFTER escaping). The engine **never** `innerHTML`s raw excerpt text. The mockups inject trusted fixture HTML directly; the engine port must not.
- **CSS/motion:** tokens only, into `dg-system.css` (lift the mockups' `.term*` block verbatim — `--ink`/`--surface`/`--border`/`--accent`/`--pass`/`--fail`, `color-mix`). `.term-scroll { overflow-x:auto }` contains wide output (the 375px lesson); the split parent keeps `min-width:0` on children and `.ptab{min-width:0}` (live-verify fix). Reveal animation (`.term-anim`/`termIn`) is gated by `@media (prefers-reduced-motion: reduce)` and a `matchMedia` check before adding the class.
- **What it must NOT be:** no free-text input (selection-first hard rule); no second renderer variant per archetype — ONE `_slRenderRefTerminal`, three data-driven expressions (progressive command reveal · source-tab reveal · all-visible selectable). No new step-type; diagnosis/fix stay Wave-1 `configure` selects.

### 1. Guided CLI Fault Isolation — `archetype:'cli'` (netplus bank · `np-cli-NN`)
- **Reference:** `kind:'terminal'`, one excerpt per menu command, each `reveal:'<cmdId>'` (all start hidden); the `necessary:true` excerpts form the minimal isolation cover (fixture: `ipconfig` + `showint`). Optional tiny `network` topology strip stays out of scope — the terminal is the star.
- **Steps (existing types, no new type):**
  1. **Command menu → progressive reveal** = an `analyze` step in **`reveal` mode** (`payload.mode:'reveal'`): its selectable targets are the command buttons; picking one calls `revealExcerpt` and marks the command "ran". Graded **leniency-first and advisory** — running commands is free; the scored output is an `isolationEfficiency` note keyed to `excerpt.necessary` (necessary ids run vs. skipped), NOT a slot. `points:1` but scored as a soft note, mirroring the mockup (no penalty for extra commands).
  2. **Diagnose + Fix** = a `configure` step, two slots (`rootCause`, `fix`), keyed options, per-slot partial credit via the existing `_scoreConfigureSlots` — identical to Wave-1 wireless/soho selects.
- **Validator `simLabValidateCliFaultFidelity(scn)`** → `{ok, errors}` (signature mirrors `simLabValidateFirewallFidelity(scn)`). **Proves, machine-checkable:** (a) every `necessary:true` excerpt exists and its revealed lines are internally consistent with the keyed fault (fixture: NIC full in `ipconfig` + port half + late-collisions in `showint` ⇒ duplex mismatch) via a small fault-signature table (duplex/gateway/dns/vlan → required line facts); (b) the keyed `rootCause`/`fix` configure answers match that fault; (c) the `necessary` set is a genuine minimal isolation cover — mutation-checked (dropping any necessary excerpt must make the fault non-derivable; adding a non-necessary one must not). What stays gate-only: the pedagogical *quality* of distractor commands (examiner judgment).

### 2. Network Discovery Audit — `archetype:'discovery'` (netplus bank · `np-disc-NN`)
- **Reference:** `kind:'terminal'` in **source-tab mode** — excerpts `lldp` / `mac` / `arp`, each `reveal:'<src>'`, tab bar reveals one at a time (first tab open by default). Lines carry `select:false` (read-only source data).
- **Steps:**
  1. **Reconcile port map** = a `configure` step, rows of keyed selects (device + mgmt-IP per port), per-slot partial credit. The silent-host row (Gi0/5) is the crux: derivable only by MAC×ARP join, not LLDP. Identical grading to Wave 1.
  2. **Records audit** = an `analyze` step in **selectable-line mode over a terminal excerpt** (a legacy-CSV excerpt with `select:true` lines), constrained to **single-select** (`multi:false`) — the one row discovery disproves, keyed via `answer.selected:['<lineId>']`, scored by the existing exact-set boolean.
- **Validator `simLabValidateDiscoveryAuditFidelity(scn)`** → `{ok, errors}`. **Proves, machine-checkable:** (a) every keyed port answer is **derivable from the excerpts** — infra ports from LLDP device/mgmt facts, the silent host from a MAC-table↔ARP join (cross-reference consistency is fully checkable); (b) exactly one legacy-CSV row contradicts the reconciled truth and it is the keyed `select`ed line; mutation-checked so the catch can't be vacuous.

### 3. Command-Output Evidence Triage — `archetype:'triage'` (aplus-core1 bank · `a1-cot-NN`)
- **Reference:** `kind:'terminal'`, all excerpts visible (no `reveal`); evidence lines `select:true` with `evidence:true|false`; context lines (`term-ctx`) as `select:false`.
- **Steps:**
  1. **Flag evidence** = an `analyze` step in **selectable-line mode over excerpts**, **multi-select** (`multi` defaults true — every analyze step MUST still declare `multi` explicitly per the Wave-1 lesson), targets = excerpt lines with `evidence:true`. Graded **leniency-first**: this is the one **small engine extension** — analyze gains an optional `scoring:'lenient'` flag. Absent (default) = today's exact-set boolean (fully backward-compatible with every existing analyze step). Present = partial credit scored like configure: `total` = count of `evidence:true` lines, `correct` = true lines flagged, false picks marked in-UI but **never subtract** earned credit. Justification for the extension over reusing exact-set: the mockups' leniency-first contract (reveal/wrong picks non-penalizing) is a scoring semantic, not a render change — expressing it as all-or-nothing exact-set would break the "wrong picks cost no earned credit" rule the founder approved.
  2. **Diagnose + Fix** = a `configure` step (`diagnosis`, `firstMove`), keyed, per-slot partial credit.
- **Validator `simLabValidateEvidenceTriageFidelity(scn)`** → `{ok, errors}`. **Proves, machine-checkable:** (a) the keyed evidence lines (`evidence:true`) all **exist in the excerpts** and are genuinely diagnostic of the declared fault, and `evidence:false` lines are NOT (mutation-checked so the set can't be trivially all-true — the "Media connected" trap must remain a scored distractor); (b) the `diagnosis`/`firstMove` configure answers follow from the flagged evidence (fixture: 169.254/16 + blank gateway ⇒ APIPA ⇒ `ipconfig /renew`). **Examiner lens: 220-1201 obj 5.7**, client/SOHO vocabulary (APIPA, DHCP lease), NOT Net+ depth.

## Engine deltas (complete list)
- **Allowlist:** accept `'cli' | 'discovery' | 'triage'` in `simLabValidateScenario`'s archetype set; accept `'terminal'` in the reference-kind set (+ shape check: `excerpts[]` required, each with `id` + `lines[]`).
- **ONE new renderer:** `_slRenderRefTerminal(ref)` + its `_slRenderReference` dispatch case; exposes `revealExcerpt(key)` on the panel. Escape-then-highlight per line.
- **ONE small analyze extension:** `_slRenderAnalyze` gains (a) a `mode` branch — `'reveal'` (bind command buttons) and selectable-line-over-terminal (bind the reference's `select:true` lines instead of building its own `.sl-analyze-block`), sourcing line text from the terminal excerpts (single source of truth, so the validator's cross-check is exact); (b) a `scoring:'lenient'` path in `_scoreStep`/`simLabScoreScenario` (partial credit like `_scoreConfigureSlots`). Both default OFF — zero change to existing analyze scenarios.
- **Three fidelity validators:** `simLabValidateCliFaultFidelity` · `simLabValidateDiscoveryAuditFidelity` · `simLabValidateEvidenceTriageFidelity`, each `(scn) → {ok, errors}`, pure logic alongside the Wave-1 validators.
- **NOTHING else.** `_slMountScenario`, `simLabScoreScenario`'s dispatch shell, free/Pro gating, cert entry (`_SL_PBQ_CERTS` already has netplus + aplus-core1), Exam mode, milestones, `_slPickSeed`/session all stay archetype-agnostic (proven by the v7.61.0 Tasks 15-17 tests and carried through Wave 1).

## Process per wave (hard rules restated)
1. Concept mockups DONE + founder-approved (the three above), each through the 4-stage visual pass. **Mockups ARE the build.**
2. `superpowers:writing-plans` → task-by-task TDD plan (Task-1 exactness: contracts, test snippets, commit messages). First task = the terminal renderer + analyze extension (shared spine); archetypes ride it.
3. `superpowers:subagent-driven-development` execution with per-task spec+quality reviews and a progress ledger.
4. Content gate: EVERY scenario passes its deterministic fidelity validator AND two-agent consensus, revise-until-both-approve. **Gate lenses: N10-009 domain engineer + CompTIA examiner for the two Net+ archetypes (`cli`, `discovery`); 220-1201 for `triage`.**
5. Ship: whole-branch review → **LIVE browser verify** (computed styles + the terminal's `overflow-x` containment at 375px, not just Node) → bump-version (v7.63.0) → PR → deploy → decision notes.

## Testing & guards
- Per-archetype UAT bank tests mirroring the v7.61.0/Wave-1 pattern: vm-extract the REAL validators, filter bank by archetype, assert min count (≥10) and that every scenario passes scenario+fidelity validation. Non-vacuous by construction (mutation-check in review — each fidelity validator must reject a deliberately corrupted excerpt/key).
- **Every `analyze` step declares `multi` explicitly** (the Wave-1 lesson: the default flipped to multi, and a step that omits it renders unexpectedly). Reveal-mode and lenient-scoring steps must also set their flags explicitly.
- **CSS ratchet:** terminal `.term*` block lands in `dg-system.css`, tokens only; the plan MUST check every `var(--*)` used is defined (the UAT ratchet guard fails any NEW undefined `var(--x)` in `dg-system.css` — the `--fail`/`--pass` lesson). Never touch `styles.css`.
- Dev-fixture rule carries over: the three mockup-embedded scenarios are labeled fixtures until they clear the gate.

## Out of scope (Wave 2)
A second renderer or per-archetype renderer variant; free-text terminal input / real command execution; the Sec+ log-analysis archetype itself (only its reuse is *designed for*, not built); changes to the six shipped archetypes; Wave 3/4 renderers (port-map/wiremap/parts, defect-swatch); bank depth beyond 10-12/archetype; any exam/milestone/gating change.

## Related
[[2026-07-02-pbq-wave-program-design]] · [[Drills MOC]] · [[ADR-003-pbq-structured-model-and-per-cert-validation]]
