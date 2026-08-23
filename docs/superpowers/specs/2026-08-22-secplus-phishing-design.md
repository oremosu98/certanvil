# Sec+ Phishing & Social Engineering (obj 2.2) — exemplar lesson pass

**Date:** 2026-08-22
**Cert pack:** `certs/secplus.js`
**Target version:** v8.15.0 (Fast lane — data only, no schema change)
**Objective:** SY0-701 2.2 — human/social-engineering threat vectors
**Topic key:** `Social Engineering` → domain `threats` (D2, 22%)
**Companion spec:** `2026-08-22-secplus-threat-actors-design.md` (v8.14.0, same session, same method)

---

## Why this change

Unlike Threat Actors (4 thin exemplars, two actors uncovered), Social Engineering starts from a decent base: **7 exemplars** covering vishing, BEC (CEO-fraud shape), smishing, whaling, pretexting, watering hole, and a phishing-indicators multi-select. This pass is therefore **gap-filling and discrimination**, not hole-filling.

What the audit found:

- All 7 existing items are pre-v8.7.0 prose style — zero per-distractor rebuttals. Same rewrite case as the Threat Actors four.
- **MFA fatigue / push bombing: zero mentions in the entire pack.** The largest single gap.
- **Misinformation/disinformation:** named in objective 2.2, effectively absent (one incidental mention).
- Typosquatting and brand impersonation: touched only inside the QR-phishing drill bank and two passing mentions — no exemplar owns them.
- No discriminator items at all: nothing tests spear-vs-phishing, whaling-vs-BEC, or impersonation-vs-pretexting against each other, which is where the exam actually differentiates candidates.
- Only one retention concept on all of 2.2.
- Quishing is deliberately left thin here: the Phishing Triage Lab carries a full QR seed bank, and the founder's notes rank it low.

Domain guard headroom measured before writing: adding 11 D2 exemplars lands D2 at 84/333 = 25.2% (+3.2pp of a 10pp tolerance) and eases D1 to +16.5pp. Comfortable.

## Source and legal position

Ten exemplars and both retention concepts derive from the founder's own phishing study notes, written in their own words from the public SY0-701 objectives and free Professor Messer material — same clean position as the Threat Actors lesson. Tagged `source: "curated-lesson-phishing"`.

One exemplar (misinformation vs disinformation) is **not** in the founder's notes and is authored directly from the public Skills Measured doc, tagged `source: "curated-objectives-2.2"` so provenance stays honest.

No paid-bank content anywhere. §10 discipline unchanged.

## Scope

**In scope**
1. 11 new exemplars on topic `Social Engineering`, objective `2.2` (10 notes-driven + 1 from public objectives).
2. Rewrite of the 7 existing Social Engineering exemplars into house format — prose only, answers and questions untouched.
3. 2 new `retentionGapConcepts` entries.
4. The 4 queued Threat Actors wording fixes from the v8.14.0 whole-branch review (§ below).
5. Version bump to v8.15.0 + CHANGELOG row.

**Out of scope**
- The answer-letter skew rebalance (own project, gated on the A/B test — `docs/audits/2026-08-22-exemplar-answer-letter-skew.md`). This ship only avoids *worsening* it (§ Authoring rules).
- Any change to weights, topic maps, guard, picker, or prompt-formatting functions.
- New PBQ / drill content. The QR bank already owns hands-on phishing triage.

## Design

### The 11 new exemplars

**Discriminators (6) — from the founder's traps 1/2/4/5/6 + the layered scenario**

| # | Item | Difficulty |
|---|---|---|
| 1 | Spear vs plain phishing — generic "Dear customer" blast vs a message that knows the target's name, colleague and supplier; the discriminator is research | Exam Level |
| 2 | Whaling vs BEC — CEO *receives* a customised malicious document vs finance receives a message *claiming to be* the CEO demanding payment. Target-of-attack vs identity-borrowed | Exam Level |
| 3 | Impersonation vs pretexting — one IT-support call split into WHO is claimed ("I'm David from IT") and the STORY told ("we're migrating MFA today") | Exam Level |
| 4 | Vector vs technique vs payload — one malicious-attachment email; the correct answer changes with what the stem asks (message-based vector / phishing technique / file-based delivery / malware payload) | Hard |
| 5 | Multi-technique decomposition — payroll employee, named personally, "CFO" requests urgent transfer to a new account: spear phishing, impersonation, pretexting and BEC are all present; keyed on MOST SPECIFIC for the transaction-fraud framing (BEC) | Hard |
| 6 | BEC invoice-swap — attacker compromises a *real* supplier mailbox, waits, and alters only the bank account number on a genuine invoice. Every classic phishing tell (spoofed sender, bad domain, urgency) is absent; the lesson is why out-of-band verification of changed payment details is the only control that catches it | Hard |

**Gaps (4)**

| # | Item | Difficulty |
|---|---|---|
| 7 | MFA fatigue / push bombing — stolen password + repeated push prompts until the victim approves; what the technique is called and why annoyance is the mechanism | Exam Level |
| 8 | Typosquatting vs brand impersonation — `micros0ft`-style lookalike domain vs pixel-perfect copied login page; which term names which, and that they usually co-occur | Exam Level |
| 9 | Credential-harvest redirect — victim submits credentials to a fake page and is forwarded to the real site; keyed on why the redirect exists (suppress suspicion so the stolen credentials stay valid longer) | Foundational |
| 10 | Phishing ≠ credential theft — a phishing email whose payload is ransomware; keyed on the point that phishing is the delivery technique, with credentials only one possible objective | Foundational |

**From public objectives (1)**

| # | Item | Difficulty |
|---|---|---|
| 11 | Misinformation vs disinformation — identical false content, discriminated by *intent to deceive* (disinformation deliberate; misinformation spread believing it true) | Exam Level |

Spread: **2 Foundational / 6 Exam Level / 3 Hard**. All mcq — the topic already carries its multi-select, and none of these is naturally a choose-TWO.

### The 7 rewritten exemplars

`certs/secplus.js:544-550`, edited in place. Questions, options, answers, difficulty, and metadata (`curated-secplus-phase3` / original versions) all unchanged — only `explanation` moves to the house format (answer rationale → `(X) Wrong — …` per distractor → memory/exam-clue closer). No re-tiers this time: the existing difficulty labels are defensible.

### The 2 retention concepts

Appended to `retentionGapConcepts` after the Threat Actors pair (after line 109, before the `],` at 110), JS object form, `parentTopic: 'Social Engineering'`, `objective: '2.2'`.

1. **`P-S-W-S-V-B + WHO/STORY — the phishing family in one pass`** — Phishing = public/mass, Spear = specific, Whaling = wealthy/executive target, Smishing = SMS, Vishing = voice, BEC = business money; then impersonation = WHO you claim to be, pretexting = the STORY you tell, and the note that one attack routinely stacks several (vishing + impersonation + pretexting in a single call). Closes with the layered-scenario reading rule: answer what the stem asks — the exam offers several technically-present techniques and wants the most specific.
2. **`The seven emotional levers and the out-of-band check`** — urgency, fear, greed/reward, authority, trust, curiosity, sympathy: the attacker's goal is an emotional reaction instead of careful checking. The defence that defeats the whole family: verify through a different channel the attacker doesn't control, using contact details you already hold — never ones supplied in the message. Includes the invoice-swap case as the example where out-of-band is the *only* effective check.

### Threat Actors fixes riding along (from the v8.14.0 whole-branch review)

Four wording edits, exact replacement text to be fixed in the plan, applied to both `certs/secplus.js` and the v8.14.0 plan doc where the text also lives:

1. Resource-ranking entry (D): "Shadow IT is not an adversary with resources at all" → reword to deny *offensive resourcing*, not membership of the six-actor category its own stem asks about.
2. Insider-vs-Shadow-IT entry (A): make the rebuttal categorical (unapproved *platform* vs misuse of *access*) instead of conceding the option is broadly true.
3. Hacktivist discriminator: re-cast off environmental-cause-vs-polluter so the topic's two hacktivist scenarios stop sharing one template (new cast: press-freedom group vs a state media regulator, or anti-surveillance vs a data broker — plan fixes the final wording).
4. Tool-vs-attacker stem: "chaining multiple zero-day exploits" → "chaining multiple public exploits against unpatched systems" (a commercially packaged exploit is by definition not a zero-day).

### Authoring rules (lessons paid for in v8.14.0 — binding)

- **Groundedness:** every explanation refers only to details in its own stem. Three v8.14.0 entries needed fixes for invented specifics.
- **No absolutes the exam hedges:** tendencies stated as tendencies. Two v8.14.0 entries needed fixes for false "never/no" claims.
- **No grammar cues:** correct options must not be systematically hedged while distractors are absolute (or vice versa), and no correct-is-longest pattern. One v8.14.0 multi-select was answerable on sentence shape alone.
- **No cross-entry contradictions:** before finalising, read the new items against the existing 2.2 seven AND the 2.1 eighteen — phishing scenarios appear in both topics.
- **Answer letters:** the 7 existing SE items key B C C C A B A — zero D. Pending the skew A/B, new content must not deepen the pack's D-starvation: the 11 new items distribute across all four letters with **at least 3 keying D**. Where an option list is order-neutral this is free; where it is not, the correct text still goes where it naturally reads best — the 3-D floor is a target across the 11, not a per-item mandate.
- Scenario variety: no two new items share a target-industry + pretext template (the v8.14.0 hacktivist near-duplicate lesson).

### Data contract

Identical to v8.14.0: compact JSON-string form, no space after colons (`"objective":"2.2"` must be regex-countable by the guard), `"answer"` single letter on all 11 (no multi-select this pass), metadata `"addedVersion":"8.15.0"`, `"addedDate":"2026-08-22"`. Retention concepts in single-quoted JS object form, invisible to the guard. New exemplars append at the end of `questionExemplars` (closing `],` currently line 768) under banner:
`// ── Phishing lesson (v8.15.0, 2026-08-22) — 11 entries covering obj 2.2 ──`

## Verification

1. UAT stays 5008/5008 (plus whatever the FACTS stamp moves it to); `node --check` clean.
2. Guard passes untouched. Predicted landing: D1 +16.5pp, D2 +3.2pp. If it trips, trim — never widen (2026-07-27).
3. Counts: total exemplars 322 → 333; obj 2.2 11 → 22; topic-tagged `Social Engineering` 7 → 18; retention 38 → 40.
4. Answer-key audit by reviewer per task, stress-testing each key adversarially (the v8.14.0 method — it caught 5 real defects).
5. Letter check: ≥3 of the 11 new items key D.
6. **Acceptance test (founder, post-ship):** generate live batches on Social Engineering and confirm MFA fatigue, typosquatting/brand impersonation, and misinformation surface as answerable content. Same BYOK constraint as v8.14.0 — this step is the founder's, and the milestone stays open until they run it.

## Rejected approaches

- **Gap-only (~5 items):** left the discriminator spine — the demonstrated highest-value shape — on the table for no meaningful saving.
- **Full sweep (~14, incl. defence-layer and psychology items):** defence layers and psychological triggers moved into retention concept #2 instead, where enumerable-list material demonstrably belongs; largest-block-in-pack crowding risk not worth it.
- **Leaving the 7 existing untouched:** rejected for the same style-anchor reason as v8.14.0 — old-format items dilute what the generator samples.
- **Skipping misinformation (notes-purity):** rejected; it is a named 2.2 item, absent from the pack, and the public-objectives sourcing is exactly how every pack was seeded. Provenance kept honest via a distinct source tag.
- **A choose-TWO among the new items:** nothing here is naturally multi-select; forcing one to hit a format quota is how grammar-cue defects happen.
