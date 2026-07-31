# Sec+ curated questions — "Blockchain" lesson (SY0-701 obj 1.4)

**Status:** authored + applied (v8.11.0).
**Target file:** `certs/secplus.js` → `questionExemplars` array + `retentionGapConcepts`.
**Gap being filled:** the pack had **zero** blockchain coverage — no hit for `blockchain` or `ledger` anywhere in `certs/secplus.js` before this batch. Obj 1.4 was otherwise well covered (PKI ×6, encryption/key-stretching ×10 at v7.80.0, key exchange ×11 at v7.98.0, hashing/signatures at v8.8.0).

## Scoping decision — no new topic

`Blockchain` and `Open public ledger` are **two bullets inside obj 1.4** ("Explain the importance of using appropriate cryptographic solutions"), sitting alongside Hashing, Salting, Digital signatures and Key stretching. They are not a domain, not an objective, and not a topic.

So: **no new entry in the topic catalog.** All six exemplars tag `topic: 'Cryptography Fundamentals'`, `objective: '1.4'`. A topic that maps to two bullets would over-weight the concept in every topic-driven surface (Custom Quiz picker, Progress, weak-topic targeting) for something worth roughly the same exam share as salting.

The objective verb is *"Explain the importance of"* — CompTIA's recognition tier, not *"Given a scenario, implement/analyze"*. **No PBQ authoring warranted.** Blockchain is also not an N10-009 objective, so nothing carries to the Network+ pack.

## Question count — 4, capped by the D1 guard

**Authored 6, shipped 4.** The `v7.4.0 Sec+ domain distribution` UAT guard failed at 6: Domain 1 hit 31.3% against its 31.0% ceiling (12% target + 19pp tolerance). That guard's own comment block says it has already been widened twice — v7.98.0 (key exchange) and v8.7.0 (obfuscation), **both obj 1.4** — and ends **"DO NOT widen again — author D2–D5 exemplars instead."** So the guard was left alone and this batch was trimmed instead.

Dropped, and where their content went:
- **Public-ledger privacy MCQ** (patient identifiers on a permissionless chain; pseudonymity ≠ anonymity; sensitive values off-chain with only a hash on-chain) → folded into the `retentionGapConcepts` keyword, which injects into *every* generation prompt rather than only the few-shot sample.
- **Multi-select "what blockchain does NOT provide"** → restated Q2 (confidentiality) and Q4 (stolen key ≠ human intent); no unique content lost.

Standing note for the next 1.4 batch: D1 is now saturated at 30.8%. Any further obj-1.4 authoring needs D2–D5 growth first (D2 −3.0pp, D3 −4.1pp, D4 −6.4pp, D5 −5.8pp against target).

## Why this size fits anyway

The source lesson is far broader than the exam surface (51% attacks, reentrancy, oracles, fork governance — all real, none examinable at this objective's tier). The exemplars cover only what the exam can ask, and are weighted to **discrimination** rather than recall: the observed failure mode is not "can't explain blockchain", it's picking blockchain when the answer is hashing, or picking encryption when the answer is blockchain.

Two of the six deliberately have blockchain as the *wrong* half of the reasoning (Q4 confidentiality, Q5 real-world truth), because those are where the marks are actually lost.

## Coverage map

| Lesson section | Q | Type | Distractor family being killed |
|---|---|---|---|
| Distributed ledger — what it IS | Q1 | mcq | DB replication / RAID / SIEM — availability tech, not tamper-evidence |
| Security properties | Q2 | mcq | "blockchain = confidentiality"; "hashing = encryption" |
| Previous-block hash → chain | Q3 | mcq | "each block is encrypted"; timestamp-based detection |
| Garbage in, immutable garbage out | Q4 | mcq | "immutable = true"; "signature = the human was there" |

Carried by the retention keyword only (see above): open public ledger privacy, pseudonymity ≠ anonymity, off-chain storage pattern.

Not covered (out of scope at this objective's tier): consensus mechanism internals (PoW/PoS/PBFT/PoA maths), 51% attack thresholds, smart-contract vulnerability classes, oracles, forks, key-custody loss. Q3 references consensus only as "the network rejects it", which is the depth 1.4 asks for.

## Also added

One `retentionGapConcepts` entry (`Blockchain & Open Public Ledger`, obj 1.4) so the generator biases toward this when it's still weak — same mechanism as the existing 1.4 entries.

## Executor checklist

1. ✅ Append the 4 objects to `questionExemplars` (one JSON object per line, file style).
2. ✅ Add the retention-gap entry.
3. ✅ `node tests/uat.js` → 5005/5005 pass (was 5004/5005 at 6 exemplars — see the D1 guard above).
4. ⬜ Version bump + commit + push (fast lane: cert-pack content only).
