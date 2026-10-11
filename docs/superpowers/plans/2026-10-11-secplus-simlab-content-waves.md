---
up: "[[Drills MOC]]"
type: plan
status: active
cert: secplus
updated: 2026-10-11
---
# Security+ Sim Lab content waves (plan)

Spec: [[2026-10-11-secplus-simlab-content-waves-design]]. Three batches, shipped one at a time on 2026-10-11.

## Batch A
1. **Unseen-first picking** (TDD). Failing UAT first: with a served map marking seeds 1..n−1, `_slPickSeed` returns seed n; `_slPickSeedFresh` never repeats inside a session and prefers never-served; the whole bank stays reachable. Implement `nplus_simlab_served` = `{cert: {seedId: ts}}`, stamped at pick time; ties broken randomly; storage errors fall back to the old rotation.
2. **Timeline severity** (TDD). Failing UAT: a stage without `severity` renders no `.sl-sev` tag. Renderer: no default `'low'`. Strip `severity` from every Sec+ `incident` timeline stage.
3. **10 firewall seeds**. Author agent → staging JSON → validators → security-engineer + SY0-701-examiner review → revise → merge. UAT: ≥10 Sec+ firewall seeds pass `simLabValidateScenario` + `simLabValidateFirewallFidelity`.
4. Ship v8.156.0.

## Batch B
5. **8 terminal seeds** (`cli`): read the validator for Net+ assumptions first; the same gate.
6. **8 secure-design seeds** (`diagram`): the same gate.
7. UAT per archetype; ship v8.157.0.

## Batch C
8. **6 wireless seeds** (`wireless`): the same gate.
9. **10 governance + threat seeds** (generic primitives): the same gate, targeting D5 and D2.
10. UAT; update the seed-file header (gate record); ship v8.158.0.
11. Mindmatrix: tick milestones that are observably true; record the final domain mix.
