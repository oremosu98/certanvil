---
up: "[[Drills MOC]]"
type: spec
status: active
cert: secplus
updated: 2026-10-11
tags: [spec, drill, pbq, simlab, content]
---
# Security+ Sim Lab content waves (design)

**Agreed 2026-10-11** (founder: "lets do this now… use your expertise to plan this out", then "do all the batches today… one at a time"). Founder sits SY0-701 on Fri 16 Oct 2026.

## Problem
The Sec+ Sim Lab bank (87 seeds) has no firewall, terminal, network-design or wireless PBQs. The renderers and validators for all four exist (Network+ ships 12/12/16/12). Its domain mix is D1 14% / D2 11% / D3 25% / D4 41% / D5 8%, against exam weights 12/22/18/28/20. The incident timelines show severity tags that reveal (11/12) or contradict (BEC) the severity answer. Sessions pick seeds by a minute-based rotation, so new seeds may not reach the founder before Friday.

## Decision: seed extensions on shipped archetypes
This follows the 2026-07-16 research (`docs/research/2026-07-16-pbq-secplus-core2/09-FINAL-ranked-lists.md` §7), which found that for Sec+ the best evidence per unit of build cost is seed sets on archetypes that already exist. No new renderers means no mockups or visual pass, so the effort goes into content quality.

| Batch | Content | Objectives | Archetype / validator |
|---|---|---|---|
| A | 10 firewall-rule PBQs (build rules → order for first-match → find the shadowed rule) | 3.2, 4.5 | `firewall` / `simLabValidateFirewallFidelity` (simulated traffic) |
| A | Incident timelines: remove severity tags; renderer shows no tag when severity is absent | 4.8 | renderer `timeline` |
| A | Unseen-first seed picking (persistent per-cert served map; never-served, then least-recently-served) | — | `_slPickSeed`, `_slPickSeedFresh` |
| B | 8 terminal PBQs (read command/log output, identify the indicator or fault) | 2.4, 4.4, 4.9 | `cli` / `simLabValidateCliFaultFidelity` |
| B | 8 secure-design PBQs (device → zone placement: screened subnet, WAF, LB, HA) | 3.1, 3.2 | `diagram` / `simLabValidateNetworkFidelity` |
| C | 6 wireless-security PBQs (WPA3, 802.1X/RADIUS, guest isolation) | 4.1 | `wireless` / `simLabValidateWirelessFidelity` |
| C | 10 governance + threat PBQs on generic primitives (match / categorize / order) | 5.1–5.6, 2.2–2.5 | generic |

Target after all batches: ~129 seeds, domain mix about 14 / 18 / 22 / 32 / 15.

## Content gate (every new seed, every batch)
1. **Deterministic:** `simLabValidateScenario` + the archetype's fidelity validator. The firewall validator runs the seed's flows through the keyed rule list (first match wins) and asserts every expected outcome and the shadowed rule's unreachability.
2. **Two-agent consensus** (CLAUDE.md rule): an independent **security engineer** and **CompTIA SY0-701 examiner** review every seed, revising until both approve. They check one defensible answer, no giveaways (stem, title or exhibit must not name the answer), correct objective tag, vendor-neutral wording, and Sec+ (not Net+) framing.
3. Authors write to staging files; the lead merges into `features/sim-lab-seed-secplus.js` only after the gate passes.

## Testing
- UAT per archetype: the Sec+ bank's seeds of that archetype pass scenario + fidelity validation, with a minimum count.
- Unseen-first picking: never-served first, no repeats inside a session, whole bank reachable (extends the 290 reachability test).
- Timeline: a stage without severity renders no severity tag.
- Each batch ships on its own: UAT, Chromium e2e, bump, deploy, live check.

## Rejected approaches
- **New `fleetlog` (multi-host log attribution) archetype now:** best-evidenced Sec+ format (research grade A), but needs a new renderer and its evidence summary leaks the answer (research §8.4). Not a five-day job done well. Revisit after the exam.
- **Generic match/categorize filler only:** rebalances domains fastest, but skips the real exam formats (firewall, terminal) the founder asked for.
- **`certchain`, `iam`, `vulnq` archetypes:** research grade C (no sittings), with blocking design defects (§8.1, §8.2, §8.5).
- **Leaving severity tags and changing the incident step instead:** the tag is the exhibit's leak; removing it fixes all 20 seeds at once.
