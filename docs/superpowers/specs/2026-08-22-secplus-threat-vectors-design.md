# Sec+ Threat Vectors & Attack Surfaces (obj 2.2) — exemplar lesson pass

**Date:** 2026-08-22
**Cert pack:** `certs/secplus.js`
**Target version:** v8.16.0 (Fast lane — data only)
**Objective:** SY0-701 2.2 — the non-human threat vectors + the vector/surface distinction
**Topic key:** `Attack Vectors & Surfaces` → domain `threats` (D2)
**Companion specs:** `2026-08-22-secplus-threat-actors-design.md` (v8.14.0), `2026-08-22-secplus-phishing-design.md` (v8.15.0) — same method, same session. Shared machinery (guard mechanics, serialisation forms, picker behaviour, authoring rules) is documented there and applies here unchanged; this spec states only what differs.

---

## Why this change

The founder's threat-vectors notes cover the **other half of objective 2.2** — the human-vectors half shipped as v8.15.0. The pack's `Attack Vectors & Surfaces` topic holds **4 exemplars** (software-update supply chain, USB drop, unsupported OS, default credentials), all pre-house-format.

Measured gaps against the objective's named vector list:

- **Image-based** (SVG with embedded content): zero coverage anywhere in the pack.
- **Open service ports** as an exam concept: zero exemplars; the "open port ≠ vulnerability" trap is a standard exam shape.
- **Client-based vs agentless**: named explicitly in the objectives, zero coverage.
- **Unsecure networks framed as 2.2 vectors**: 802.1X content exists under Network Security Architecture, but nothing teaches wired/wireless/Bluetooth as *vectors*; Bluetooth has one incidental mention.
- **MSP / supply-chain-through-a-service-provider**: the existing supply-chain item covers only the compromised-software-update shape. MSPs are named in the objectives.
- **Vector vs attack surface**: the distinction in the objective's own title, untested.
- Vulnerable-vs-unsupported as a *discrimination* (patch-exists vs patch-will-never-exist): both halves exist separately, never against each other.

Guard headroom measured: +12 D2 exemplars lands D2 at 96/345 = 27.8% (+5.8pp of 10pp tolerance); D1 eases to +15.5pp.

This ship is also the designated carrier for the **cheap review debt** queued by the v8.14.0 and v8.15.0 whole-branch reviews (§ Debt below). The distractor-padding pass (length axis of the generator-cue audit) is **deliberately deferred** to combine with the letter rebalance in one sweep once the A/B verdict lands — per `docs/audits/2026-08-22-exemplar-answer-letter-skew.md` addendum.

## Source and legal position

Ten exemplars + both retention concepts from the founder's own threat-vectors notes (public SY0-701 objectives + free Professor Messer material), tagged `source: "curated-lesson-threat-vectors"`. The two review-debt micro-items are authored from the public objectives, tagged `source: "curated-review-debt"`. §10 discipline unchanged; no paid-bank content.

## Scope

**In**
1. 10 new exemplars, topic `Attack Vectors & Surfaces`, objective `2.2`.
2. 2 review-debt micro-items: keyed **impersonation** (topic `Social Engineering`, obj 2.2 — the only named 2.2 bullet never yet a correct answer) and keyed **ethical motivation** (topic `Threat Actors & Motivations`, obj 2.1 — the one listed motivation unreachable via actor-identification stems).
3. Rewrite of the 4 existing Attack Vectors exemplars (`certs/secplus.js:581-584`) into house format — including the `:582` phishing-as-vector harmonisation queued by the v8.15.0 review (its rebuttal must agree with the new vector item's technique-vs-vector framing, not contradict it).
4. 2 retention concepts, `parentTopic: 'Attack Vectors & Surfaces'`.
5. Cheap debt fixes (§ Debt).
6. v8.16.0 bump + CHANGELOG row.

**Out**
- The distractor-padding pass (deferred to the combined generator-cue rebalance, post-A/B).
- The letter-skew rebalance itself (own project, gated).
- Any change to weights, maps, guard, picker, prompt functions, PBQs.

## Design

### The 10 lesson exemplars

| # | Item | Difficulty | Key |
|---|---|---|---|
| 1 | Vector vs attack surface — closing unused ports/services SHRINKS THE SURFACE; the phishing email that got in NAMES THE VECTOR. One scenario, asks which term fits which fact | Foundational | B |
| 2 | Image-based — script embedded in an SVG (XML-based, can carry structured content), executed when a vulnerable browser processes it | Exam Level | D |
| 3 | Open port ≠ vulnerability — TCP 443 open on a public web server; which statement BEST describes the security significance (normal and necessary; risk = unneeded ports, vulnerable or misconfigured services behind them) | Exam Level | C |
| 4 | Exposed RDP — internet-facing 3389 exposed unnecessarily, service exploited; what INCREASED THE ATTACK SURFACE (the Network+ bridge item) | Foundational | A |
| 5 | Client-based vs agentless — vulnerable installed endpoint agent vs compromised central web app reached by browser; which pairing correctly labels the two exposure models | Exam Level | D |
| 6 | Unsecure wired network — live Ethernet jack in a public conference room grants LAN access; the control that closes it is 802.1X port-based NAC. "Wired ≠ automatically secure" | Exam Level | A |
| 7 | Unsecure Bluetooth — nearby attacker exploits an insecure implementation; third leg of wireless/wired/Bluetooth | Foundational | C |
| 8 | MSP supply chain — attacker compromises a managed service provider's remote-admin tooling and reaches many customers through the trusted connection; why supply-chain vectors scale (1 → MSP → hundreds) and why the victim's own hardening didn't matter | Hard | B |
| 9 | Vulnerable vs unsupported — two servers: one missing an AVAILABLE patch, one past vendor EOL with a new vulnerability and NO patch coming; which pairing is right and why the remediation paths differ | Exam Level | D |
| 10 | Message-based via IM — malicious link in a Teams DM from a compromised colleague account; message-based covers email, SMS AND instant messaging, and the compromised-real-account angle explains why sender trust fails | Exam Level | B |

### The 2 micro-items

| # | Item | Topic / Obj | Difficulty | Key |
|---|---|---|---|---|
| 11 | Impersonation keyed — attacker in a courier uniform with a fake parcel walks past reception into the office. Options avoid pretexting (phishing / impersonation / typosquatting / watering hole) so WHO-you-claim-to-be is cleanly the answer | Social Engineering / 2.2 | Exam Level | C |
| 12 | Ethical motivation — security researcher finds a flaw INSIDE a published bug-bounty scope, reports it responsibly, collects the bounty; motivation classification (ethical — distinct from financial gain as primary driver, per the programme's authorised terms) | Threat Actors & Motivations / 2.1 | Exam Level | A |

Letters across the 12: **A3 / B3 / C3 / D3.** Spread: **3F / 7E / 2H.**

### The 4 rewritten exemplars

`certs/secplus.js:581-584`, in place, prose only, metadata preserved (`curated-secplus-phase3`). The USB item's rebuttal of its phishing distractor is rewritten to the harmonised framing: phishing is the *technique* carried by message-based vectors — "no message was delivered" stays as the operative fact, without asserting phishing *is* a vector category.

### The 2 retention concepts

`parentTopic: 'Attack Vectors & Surfaces'`, `objective: '2.2'`, JS object form, appended after the v8.15.0 pair (line 112, before `],` at 113).

1. **`Vector vs surface, and the four buckets`** — WHO/WHY/HOW/WHERE-could-they (actor / motivation / vector / attack surface), the house analogy (all doors and windows = surface; the unlocked window used = vector), then the founder's four-bucket recall structure: DELIVERY (messages, images, files, voice, removable), TECHNOLOGY (vulnerable, unsupported, networks, ports, credentials), TRUST (supply chain, MSPs, default accounts, watering holes), HUMAN (the social-engineering family, cross-referenced to the v8.15.0 concepts rather than repeated).
2. **`Vector recognition tells + the two traps`** — the clue→vector one-liners (USB in car park = removable; admin/admin = default credentials; vendor stopped patching = unsupported; unneeded exposed RDP = open service port; compromised vendor reaches you = supply chain; SVG executes = image-based; Teams DM = message-based), then the two traps stated as tendencies: open port ≠ automatically vulnerable (normal for the service; risk is unneeded/vulnerable/misconfigured), and vulnerable ≠ unsupported (patch available but unapplied vs no patch ever coming — the remediation path differs, which is what the exam tests).

### Debt fixes riding along (exact anchors verified present, one occurrence each)

1. `"Actor: organized crime. Motivation: financial gain. Vector: phishing email"` → `"Actor: organized crime. Motivation: financial gain. Vector: email (the phishing message)"` — and in the same entry's explanation, `the phishing email, which is the vector` → `the email that delivered it, which is the vector`.
2. Retention concept worked example: `Vector = phishing email` → `Vector = email (the phishing message)`.
3. Cast re-skin: `referencing her conference schedule, carrying a malicious 'itinerary update' attachment` → `referencing her recent earnings call, carrying a malicious 'board minutes' attachment` — removes the conference-lure template shared with the CISO whaling item.
4. Typosquatting keyed rationale broadened: `Registering a domain one keystroke from the real one to harvest mistyped traffic is typosquatting` → `Registering a lookalike domain one keystroke from the real one — caught by mistyping or misread at a glance — is typosquatting`, aligning it with its own (D) rebuttal and the indicators multi-select.

### Authoring rules

All binding rules from the v8.15.0 spec apply. One addition, earned by the v8.15.0 whole-branch review:

- **Pool-level length gate at authoring time.** Before each content commit, a check asserts the correct option is the longest in **no more than 5 of the 12** new items (~40%). The per-item rule failed twice because the cue only exists in aggregate; this makes it measurable where it can still be fixed cheaply.

### Data contract

As v8.15.0: compact JSON-string form, no space after colons; `"addedVersion":"8.16.0"`, `"addedDate":"2026-08-22"`; all 12 mcq with single-letter `"answer"`; lesson banner `// ── Threat Vectors lesson (v8.16.0, 2026-08-22) — 12 entries (10 vectors + 2 review-debt) ──` at the end of `questionExemplars` (closing `],` currently line 788). Retention concepts guard-invisible.

## Verification

1. UAT green; `node --check` clean. Counts: total 333 → 345; AV topic 4 → 14; SE 18 → 19; 2.1 count 18 → 19; 2.2 count 22 → 33; retention 40 → 42.
2. Guard passes untouched (predicted D2 +5.8pp, D1 +15.5pp).
3. Length gate: correct-is-longest ≤ 5 of 12.
4. Letters A3/B3/C3/D3 asserted by script.
5. Debt anchors: all four old strings grep to 0 after the fixes.
6. Adversarial answer-key review per task; cross-check the new vector items against `:780` (the v8.15.0 vector item) and the rewritten `:582` for framing consistency — three items now teach the vector taxonomy and they must agree.
7. **Acceptance (founder, post-ship, BYOK):** generate batches on Attack Vectors & Surfaces; image-based, open ports, client-vs-agentless and MSP must surface. Milestone stays open until run.

## Rejected approaches

- **Gap-only (~6):** left the two traps and the vector-vs-surface title concept on the table; the discriminator shape is the demonstrated highest-value pattern.
- **Padding the correct-is-longest items in this ship:** deferred by founder decision — the length axis joins the letter-axis rebalance in one sweep after the A/B verdict, so the same 25 items aren't edited twice.
- **A layered which-does-the-stem-ask item:** dropped as redundant — `:780` already owns that shape for 2.2; a second one would recreate the template-repetition problem the reviews flagged.
- **Folding the micro-items into their own future micro-ship:** rejected; two items don't justify a ship, and this is the designated debt carrier.
