# Checkpoint 0 — Inventory snapshot & frozen exclusions
**Date:** 2026-07-16 · **Repo state:** main @ dd2abfe (v7.65.2) · **Source brief:** Handoff (July)/CertAnvil-PBQ-research-brief-SECplus-Core2-CORRECTED-2026-07-13.md

## Verified archetype inventory (exclusion baseline — 14)
Live in seed files (grep -a, 2026-07-16):
- **Net+** (`sim-lab-seed-netplus.js`): diagram (16), defense (5), wireless (12), firewall (12), cli (12), discovery (11), portmap (12), wiremap (12)
- **A+ Core 1** (`sim-lab-seed-aplus-core1.js`): soho (12), triage (12), pcbuild (11), raid (13)
- **Sec+** (`sim-lab-seed-secplus.js`): incident (20), defense (5)
- **A+ Core 2** (`sim-lab-seed-aplus-core2.js`): no archetype tags — pre-archetype content on shared primitives
- **Wave 4 (planned, unbuilt):** Laser Print Defect Clinic — `swatch` reference kind, spec e55dcfc, plan 5f4cbe3. Counts as existing for exclusion purposes. = 14 total.

## Existing primitives (recombination = thin variant)
- **Step types:** analyze, categorize, configure, fillin, match, order (+ per-archetype: cli, diagram, discovery, firewall, incident, pcbuild, portmap, raid, soho, triage, wireless, wiremap, defense)
- **Reference kinds:** network, attack, timeline, layered, terminal, slots, faceplate, wiremap (+ planned: swatch)
- **Node types:** ap, attacker, cloud, database, device, external, network, pc, printer, router, server, switch, workstation
- **Validators:** simLabValidate{Network,Wireless,Firewall,Soho,CliFault,DiscoveryAudit,EvidenceTriage,PortMap,Wiremap,PcBuild,Raid}Fidelity + simLabValidateScenario

## Frozen distinctness gate (§3 of brief — reject outright, never score, if any fail)
1. Distinct from all 14 archetypes in task chain, scoring model, OR validator. Reskin = reject.
2. Not buildable purely from existing primitives with no new interaction.
3. Legitimate evidence provenance (no brain dumps / reconstructed items).
4. Maps to a current final official objective (SY0-701 / 220-1202), objective-doc version recorded.
5. Honest mobile fidelity at 375px (logs/tables/panels usable, not merely present).
6. Deterministic or equivalence-aware scoring (multi-valid answers need a defined equivalence model).
7. Scalable seed-bank variation (many scenarios, not one clever one-off).

## Pipeline (per cert, standalone — no cross-cert merge)
evidence → objectives → candidates → gate → domain review → rank → checkpoint each stage to this directory.
