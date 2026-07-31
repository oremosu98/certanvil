---
up: "[[Decisions MOC]]"
type: decision
status: active
cert: secplus
updated: 2026-07-31
tags: [decision, shipped]
---
# Sec+ Domain 1 is saturated — trim the batch, never widen the guard again

## Context
The `v7.4.0 Sec+ domain distribution` UAT guard (`tests/uat/120-cert-pack-architecture-secplus-metadata.js`) holds each domain's share of `certs/secplus.js` exemplars within tolerance of the SY0-701 blueprint (12/22/18/28/20). Domain 1 already carries a 19pp tolerance against a 12% target, widened twice — v7.98.0 (11 key-exchange exemplars) and v8.7.0 (11 obfuscation exemplars), **both objective 1.4**. The v8.7.0 comment recorded a founder decision to "widen now, rebalance later" and closed with "DO NOT widen again."

Authoring the v8.11.0 blockchain batch hit the ceiling immediately: 6 exemplars put D1 at 31.3% against 31.0%.

## Decision
Leave the guard alone and cut the batch to 4. Any future objective-1.4 authoring must be preceded by D2–D5 growth, not by a third widening.

## Why
The guard is effectively saturated for D1 — at a 19pp tolerance it no longer catches drift, so widening it a third time would convert a real signal into decoration while making the underlying imbalance worse. The imbalance is the actual problem: D4 (Security Operations) is the largest domain on the exam at 28% and sits 6.4pp under target, so a student drilling generated questions is systematically under-practised where the exam weighs heaviest.

Trimming cost little here because the two dropped questions were the batch's most redundant, and one of them — the open-public-ledger privacy MCQ — moved into a `retentionGapConcepts` keyword, which reaches every generation surface rather than only the few-shot sample. That substitution is worth remembering: when the exemplar budget for a domain is spent, the retention concept is the cheaper channel for the same content.

Post-ship distribution: D1 30.8%, D2 −3.0pp, D3 −4.1pp, D4 −6.4pp, D5 −5.8pp against target.

## Affects
`certs/secplus.js` (`questionExemplars`, `retentionGapConcepts`) and the guard in `tests/uat/120-cert-pack-architecture-secplus-metadata.js`. Binds any future obj-1.4 authoring batch.
[[2026-07-31-secplus-blockchain-questions]]

## Rejected alternatives
- **Widen D1 to 20pp.** Rejected — third widening, all three driven by the same objective; the guard stops meaning anything and the D2–D5 gap keeps growing.
- **Retag a blockchain question to another domain to rebalance.** Rejected as dishonest tagging: the questions are 1.4 content, and a bank whose objective tags don't match its content misdirects weak-topic targeting.
- **Author filler D2–D5 exemplars in the same ship to buy headroom.** Rejected as scope creep on a content ship; the D2–D5 gap deserves its own batch chosen on merit, not questions written to satisfy a ratio.

## Related
[[Decisions MOC]] · [[key-patterns]]
