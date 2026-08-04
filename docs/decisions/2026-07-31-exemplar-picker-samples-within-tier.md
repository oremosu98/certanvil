---
up: "[[Decisions MOC]]"
type: decision
status: active
cert: all
updated: 2026-07-31
tags: [decision, architecture, shipped]
---
# Exemplar picker samples within each tier instead of taking file order

## Context
`_pickExemplarsForTopic(qTopic, max)` ranks the exemplar bank into three tiers — exact topic match, same domain, anything else — concatenates them and returns `pool.slice(0, max)`. The only call site passes `max = 3`. `Array.prototype.filter` preserves source order and nothing shuffled the bank at load, so the slice always returned **the same first three exemplars in file order, forever**.

The consequence went unnoticed for ~3 months because nothing measured it: every exemplar authored after the third for a given topic was unreachable. Measured on the Sec+ pack at v8.12.0 — `Cryptography Fundamentals` held 27 exemplars and used 3, `Obfuscation` held 11 and used 3, `PKI & Certificate Management` held 6 and used 3. Roughly 280 of ~308 exemplars had never reached a prompt, including the four blockchain exemplars shipped in v8.11.0 the same day.

Surfaced while scoping certificate exemplars after a Certificates lesson: the `PKI & Certificate Management` pool was already past the cap, so more authoring there would have been inert regardless of the domain-distribution guard that was also blocking it.

## Decision
Shuffle **within** each tier before concatenating, via an inline Fisher-Yates. Tier ranking is unchanged and remains the contract; only which members of a tier get selected became random.

## Why
It makes ~280 already-authored exemplars do the job they were written for, at the cost of five lines. It also varies the few-shot references between generation batches, which should reduce the repetitiveness of questions when the same topic is drilled repeatedly — a second benefit the old deterministic slice actively prevented.

The shuffle is defined inline rather than as a module helper because UAT extracts this function body and executes it in a bare `vm` sandbox; an external reference would break that harness.

This is the same failure class as v8.9.1, where the Sim Lab seed picker only ever reached the first 60 (taster) / 10 (session) seeds of each bank and hid the entire tail. Two instances now: **when a picker slices a ranked pool, check that the tail is reachable.**

Verified by running the real function body against the real Sec+ pack: 27/27, 6/6 and 11/11 exemplars reachable across 2000 samples, versus 3 each before.

## Affects
`_pickExemplarsForTopic` in `app.js` — applies to every cert pack, not just Sec+. Guards in `tests/uat/070-retention-tb3d-tours-sr-onboarding.js`: the tiered-pool structural assertion was updated to the new pool line, the exact-topic behavioural assertion was loosened from file-order positions to the tier contract, and three new checks were added (inline Fisher-Yates present; every exact-topic exemplar reachable across 400 samples; max cap still honoured).
[[2026-07-31-secplus-d1-saturated-no-third-widening]]

## Rejected alternatives
- **Curate the first 3 per topic and leave the picker alone.** Zero behaviour risk, but strands the other ~280 permanently and makes every future authoring batch pointless unless it displaces an existing top-3.
- **Accept first-3 as the design and stop authoring exemplars entirely**, making retention concepts the only content lever. Coherent, but throws away work already paid for and gives up the batch-to-batch variety that sampling buys.
- **Shuffle the whole pool rather than within tiers.** Rejected — it destroys the exact-topic-first ranking, which is the helper's actual purpose.

## Related
[[Decisions MOC]] · [[key-patterns]]
