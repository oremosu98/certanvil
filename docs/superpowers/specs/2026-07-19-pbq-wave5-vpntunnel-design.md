---
type: spec
status: approved
cert: secplus
updated: 2026-07-19
tags: [spec, pbq, sim-lab, wave5]
---
# Sim Lab PBQ Wave 5 — VPN Tunnel Parameter Negotiation (`vpntunnel`) Design

**Cert:** Security+ SY0-701 · **Objectives:** 3.2 primary (▶ "apply security principles to secure enterprise infrastructure"), 1.4 secondary (cryptographic solutions) · **Objectives doc of record:** SY0-701 Exam Objectives Version 5.0.
**Research authority:** `docs/research/2026-07-16-pbq-secplus-core2/` — ranked Sec+ #1, evidence grade **A** (5 independent firsthand sittings for "a VPN concentrator configuration form appears on 701"), the only survivor with zero soundness defects (domain review §3.8: "the soundest design in either document — no flags").
**Evidence caveat carried forward:** the Phase 1 / Phase 2 site-to-site sub-shape rests on **1 sitting** (C-grade). The design spans site-to-site AND remote-access sub-types on the scenario axis, so it does not depend on the single-sourced sub-shape. Never present the Phase detail as corroborated.

## What ships

One new PBQ archetype riding the live Sim Lab engine (`features/sim-lab.js`):

- **Archetype tag** `vpntunnel` (15th).
- **A guarded `configure` step extension** — `payload.layout: 'dualpanel'` + `payload.scoring: 'tunnel'`, both default OFF (the Wave-2 extension pattern: absent flags = today's behavior byte-for-byte). NO new reference kind, NO new step type, NO new analyze mode.
- **One new fidelity validator** `simLabValidateTunnelFidelity` (authoring-time seed sanity).
- **One new runtime scoring path** for `scoring: 'tunnel'` (set-membership + symmetry + mirror predicates with per-unit partial credit).
- **A dual-panel renderer branch** inside `_slRenderConfigure` (A/B segmented toggle + mirror chip strip + native selects).
- **12 two-agent-gated seed scenarios** `sp-vpn-01`…`sp-vpn-12` in `features/sim-lab-seed-secplus.js`.
- **One `dg-system.css` token block** `.sl-dualpanel*` (tokens only, zero hex).

## Task chain (learner's view)

1. **Read** a two-site brief — each site: name, internal subnet, public IP — plus a written security policy floor ("no pre-shared keys for this partner", "PFS required", "AES ≥ 192"). Rendered via the existing **`network` reference kind** as a read-only exhibit (no new topology code).
2. **Configure Phase 1** on both gateways — authentication method, encryption algorithm, DH group, lifetime. (Scored configure step, dualpanel.)
3. **Configure Phase 2** on both gateways — local subnet, remote subnet, protocol (ESP/AH), encryption. (Scored configure step, dualpanel.)
4. *(Distractor seeds only)* **Identify** which pre-populated parameter blocks the tunnel — a plain `analyze` step over a `lines` list of the misconfigured panel's values. Existing analyze machinery; no new mode.

## Data contract

```js
{
  id: 'p1', type: 'configure',
  prompt: 'Configure IKE Phase 1 on both gateways per the security policy.',
  payload: {
    layout: 'dualpanel',            // guarded: absent = classic configure
    scoring: 'tunnel',              // guarded: absent = classic exact-match scoring
    panels: [
      { id: 'A', label: 'Gateway A — London' },
      { id: 'B', label: 'Gateway B — Frankfurt' }
    ],
    slots: [
      { id: 'a-auth', panel: 'A', label: 'Authentication', options: [{id:'psk',text:'Pre-shared key'}, {id:'cert',text:'Certificate'}] },
      { id: 'b-auth', panel: 'B', label: 'Authentication', options: [/* same set */] },
      // … a-enc/b-enc, a-dh/b-dh, a-life/b-life
    ],
    symmetryPairs: [['a-auth','b-auth'], ['a-enc','b-enc'], ['a-dh','b-dh'], ['a-life','b-life']],
    mirrorPairs: []                 // Phase-2 step: [['a-local','b-remote'], ['a-remote','b-local']]
  },
  answer: {
    // tunnel scoring: values are ARRAYS = acceptable-id sets (policy-floor set membership).
    // Classic configure keeps its single-string contract untouched.
    slots: { 'a-auth': ['cert'], 'a-enc': ['aes256','aes192'], /* … */ }
  }
}
```

**Field roster (fixed):** Phase 1 = auth, encryption, DH group, lifetime → 8 slots (4 × 2 gateways). Phase 2 = local subnet, remote subnet, protocol, encryption → 8 slots. Slot ids are `<panelLower>-<field>`; the validator enforces the pairing.

**Distractor mechanism (exhibit-channel, NOT response-channel):** distractor seeds do NOT pre-fill any select — the engine's `opts.initial` is exam-free-nav restore state supplied by the mount caller, not a seed surface, and it stays that way. Instead, the distractor analyze step's `lines` array carries a rendered snapshot of the partner/proposed configuration ("Gateway B — current Phase 1: Auth: Pre-shared key · Encryption: 3DES · …"), and the learner selects the parameter(s) that violate the policy floor / block negotiation. Plain analyze `lines` machinery; zero engine surface.

## Runtime scoring (`payload.scoring: 'tunnel'`)

Three predicate families, each unit = 1 point, summed into the `{total, correct}` breakdown shape `simLabScoreScenario` already handles for configure (zero changes to the exam layer, feedback rendering, or per-step breakdown). **Branch points:** both `simLabScoreScenario`'s configure branch and `_scoreStep`'s configure case hard-route into `_scoreConfigureSlots`; the `payload.scoring === 'tunnel'` check must branch at BOTH call sites (or inside `_scoreConfigureSlots`), mirroring how lenient analyze branches in both — classic configure stays byte-for-byte. **Runtime robustness:** the tunnel scorer must treat a dangling pair reference (slot id not in the step) as a skipped unit (0 total contribution), never a throw — pair-SHAPE validation is owned by the authoring-time fidelity validator, but the runtime scorer must be total over malformed input:

1. **Set-membership** — per slot: response id ∈ `answer.slots[slotId]` array. 8 units per dualpanel step.
2. **Symmetry** — per `symmetryPairs` entry: both sides answered AND equal. 4 units on Phase 1, 2 on Phase 2 (protocol + encryption). **A matching pair of policy-violating values still earns the symmetry unit** (predicates are independent by design — the membership units carry the policy penalty); test fixtures must assert this.
3. **Mirror-inversion** — per `mirrorPairs` entry: value of A-side slot equals value of B-side counterpart slot's *mirrored* field (A local = B remote and vice versa). 2 units on Phase 2.

An unanswered slot scores 0 on its membership unit and fails any pair it participates in. False picks never subtract (house rule). The three families are independent: a learner can pick two individually-valid-but-different ciphers and lose only the symmetry unit — that separation is the archetype's teaching point and the reason per-slot sets alone were rejected (see Rejected Approaches).

## Renderer (`_slRenderConfigure` dualpanel branch)

When `payload.layout === 'dualpanel'`:

- **Segmented toggle** (Gateway A / Gateway B) at top — a two-button chip row, `aria-pressed`, thumb-sized. One panel's slots visible at a time on ALL viewports (desktop does not render side-by-side; one code path, no breakpoint fork).
- **Mirror chip strip** pinned under the toggle: one passive chip per *hidden* panel's slot — `label: selected-text` or `label: —` when unset. Re-rendered from the shared `resp` object on every `onChange`. Read-only, no handlers, no engine state.
- **Slot rows** below: identical markup to classic configure (`label` + native `<select>`, `data-slot`), filtered to the visible panel.
- Toggling panels preserves `resp` (it's one step, one response object). `initial` re-hydration works unchanged (the classic loop already selects by `resp[sl.id]`).
- Escape-then-highlight discipline: every label/text is scenario data → `_esc()` before insertion (HARD rule).

## Fidelity validator (`simLabValidateTunnelFidelity`)

Authoring-time, pure logic, lives beside the Wave 1–4 validators. Checks per scenario:

1. Archetype is `vpntunnel`; **exactly 2** dualpanel configure steps (`layout:'dualpanel'` + `scoring:'tunnel'`), plus **at most 1** distractor analyze step — total steps 2–3 (engine cap is 4).
2. Exactly 2 panels per dualpanel step; every slot's `panel` references one; slot ids follow `<panel>-<field>`; both panels carry the same field set.
3. Every `symmetryPairs` / `mirrorPairs` entry references two existing slots on **opposite** panels.
4. `answer.slots` values are non-empty arrays; every member id exists in that slot's options.
5. **Symmetric pairs have identical acceptable sets** (set equality) — else the seed is unanswerable symmetrically.
6. **Mirror pairs cross-reference:** the acceptable set of A-local equals the acceptable set of B-remote (and vice versa).
7. Phase-2 subnet options are real CIDR strings and the mirrored sets are consistent with the site subnets declared on the `network` reference — carried on each site device's `subnet` field (the seed contract for this archetype; the engine's network schema requires only `devices[]`, so the validator enforces the field's presence). Reuses `_ipToInt`/`_inSubnet`. Confirm the Wave-1 CIDR fidelity validator (`_slFidelityResolveSlot`, string-answer assumption) is archetype-gated away from `vpntunnel` seeds.
8. If the seed declares a distractor, the analyze step exists, its `lines` render a config snapshot, and its answer references the policy-violating parameter(s).
9. Scenario carries a machine-readable `policyFloor` tag (e.g. `['no-psk','pfs']`) — the two-agent gate checks the acceptable sets against it; the validator checks the tag's vocabulary against a fixed enum.

**Wave 3/4 lesson (binding):** hand-derive the validator against fixtures — including a deliberately-broken asymmetric seed and a mirrored-set mismatch — before trusting a green run. The plan must carry these fixtures as an explicit task.

## `simLabValidateScenario` touch points

- Add `'vpntunnel'` to the archetype allowlist.
- `_validateStepPayload` configure branch: when `payload.scoring === 'tunnel'`, accept array-valued `answer.slots` entries (each a non-empty array of option ids); classic branch untouched.
- No reference-kind change (reuses `network`).

## Seed bank (12, `sp-vpn-01`…`sp-vpn-12`)

| Axis | Spread across 12 |
|---|---|
| Tunnel type | 5 site-to-site · 4 remote-access full-tunnel · 3 split-tunnel |
| Policy floor | no-PSK · PFS-required · AES≥192 · legacy-migration (rotated) |
| Subnet topology | varied; ≥ 1 overlapping-subnet seed exercising NAT-T reasoning |
| Distractor | 3 seeds pre-populate one mismatched value + carry the analyze step |

`cert: 'secplus'`, objectives `3.2` (all) + `1.4` (crypto-floor seeds), `estMinutes` 4–6. Every scenario passes `simLabValidateTunnelFidelity` AND the two-agent gate (Sec+ domain expert + SY0-701 examiner lens, revise-until-both-approve) before entering the bank. Vendor-neutral vocabulary throughout — IPSec/IKE open-standard terms only, no vendor console language.

## Mobile contract (375px)

This is a form and forms are the phone's best case (research's honest verdict: good fidelity). The dualpanel branch IS the mobile design — segmented toggle + one panel visible + mirror chips + native selects — and desktop gets the same layout. 4 fields per visible phase panel. No table, no horizontal scroll, no drag.

**Known cosmetic carry-over:** the score header renders "N of M steps" for unit-based breakdowns (pre-existing configure behavior) — a vpntunnel scenario will read e.g. "22 of 24 steps". The mockup must not promise different copy; a copy fix is out of Wave 5 scope.

## Testing

- **UAT module** (new `tests/uat/` numbered module or extension of the sim-lab block, mirroring Wave 3/4 style): dualpanel payload validation accept/reject, tunnel scoring fixtures (symmetry break, mirror break, set-membership partial credit), fidelity validator accept + targeted rejects (asymmetric sets, cross-panel pair violation, bad CIDR), seed-bank sweep (all 12 pass validator + scenario validation), CSS ratchet (no new undefined `var(--x)` in `dg-system.css`).
- Flexible-whitespace extraction regexes (`\n\s*\};`) — the Wave 2/3 concat-dedent lesson.
- Playwright: extend the sim-lab e2e happy path with one vpntunnel scenario (toggle panels, fill both, submit, assert breakdown).
- Visual baseline for the Sim Lab page per the no-wave-without-baseline rule.

## Pipeline

Mockup next (`mockups/vpn-tunnel-negotiation-concept.html`, faithful-lift build target with footer ENGINE-MAPPING comment + grading JS), then the mandatory 4-stage visual pass (`design-taste-frontend` → `emil-design-eng` → `humanizer` → `marketing-psychology`), founder mockup approval, then `superpowers:writing-plans`. Fast lane (no schema/money/auth/sw). Ship target: next minor version at build time.

## Rejected approaches

- **New `configpanel` reference kind (the research's literal proposal)** — reference panels are read-only exhibits by engine convention; facePorts/wiremapPins bent it only for buttons, never full form controls. A form-in-reference would need a new binding direction. The dualpanel configure extension delivers the identical learner experience inside step territory where forms already live.
- **New step type `tunnel`** — every prior wave treated a new step type as STOP-and-escalate scope; STEP_TYPES is enumerated across the engine, exam layer, and UAT.
- **Always-3-steps (mandatory distractor)** — forces a distractor into every scenario and shrinks the axis space; distractor stays an axis.
- **Per-slot acceptable sets alone (no runtime symmetry/mirror predicates)** — cannot catch two individually-valid-but-different picks (AES-256 on A, AES-192 on B): both pass membership while the tunnel would never negotiate. The symmetry predicate exists precisely for this failure, and it is the archetype's core teaching point.
- **6th Sec+ archetype (incident recovery)** — proposed by founder 2026-07-19, declined same day; the five stand as ranked. A backup-chain-selection framing was sketched as gate-clearable if ever revisited; a recovery-steps-ordering framing would fail gate 1 vs `incident`.

## Related
[[2026-07-16-pbq-secplus-core2/09-FINAL-ranked-lists]] · [[2026-07-11-pbq-wave4-design]] · [[Drills MOC]]
