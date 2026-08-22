# Sec+ Threat Actors & Motivations (obj 2.1) — exemplar + retention lesson pass

**Date:** 2026-08-22
**Cert pack:** `certs/secplus.js`
**Target version:** v8.14.0 (Fast lane — exemplars and retention concepts only, no schema change)
**Objective:** SY0-701 2.1 — *Compare and contrast common threat actors and motivations*
**Topic key:** `Threat Actors & Motivations` → domain `threats` (D2, 22%)

---

## Why this change

Objective 2.1 is under-served. The pack carries **4 exemplars** for it, and all four share one weakness:

- All are `Foundational`.
- All are the same shape — read a scenario, name the actor.
- All are in the pre-v8.7.0 prose explanation style, not the current per-distractor + memory-trick house format.
- Two of the six actors named in the objective — **unskilled attacker** and **Shadow IT** — have **zero** coverage.
- Nothing tests the *comparison* half of the objective (internal/external, resources/funding, sophistication/capability), which is what the objective title actually asks for.
- Nothing tests any of the actor-pair discriminations the exam leans on.

This also sits correctly against the standing D1-saturation decision (2026-07-27): D1's balance guard is saturated and must not be widened again — growth belongs in D2–D5. This is D2.

### What exemplars actually do

Per `CLAUDE.md`, curated exemplars in `CERT_PACK.questionExemplars` are **few-shot style references injected into the generation prompt — never served as quiz questions**. The goal is therefore *coverage of distinct question shapes and distinct actors*, not raw count. Twelve near-identical identification items would teach the generator less than six well-differentiated ones.

Since v8.13.0 `_pickExemplarsForTopic` shuffles **within each match tier** (exact topic → same domain → anything else) before slicing to `max`, rather than taking the first three in file order. The tiers are match tiers, not difficulty tiers.

Two consequences:

- **All 18 exemplars on this topic become reachable.** Before v8.13.0 the picker took the first three by file position forever, so anything authored after the third was dead weight — which is why the v8.12.0 Certificates lesson deliberately added *no* exemplars. That constraint is gone, and it is what makes authoring 14 more worth doing at all.
- **Difficulty spread does NOT affect generation at all.** Corrected 2026-08-22 after the whole-branch review: `_formatExemplarsForPrompt` emits the stem, the options, the type, the answer letter and the explanation — it never emits `difficulty` — and `_pickExemplarsForTopic` does not filter or tier on it either. So the 5/9/4 target is metadata hygiene and nothing more. Aim for it because the field should be honest, not because it changes what the generator sees.

  **What the generator DOES see, and what therefore does propagate: the answer letter.** Across the whole Sec+ pack the correct answer is D in only 6 of 285 MCQs (2.1%), and in objective 2.1 it is D in none of 16. Any letter skew in the exemplar bank is a skew the generator learns from. This is a pre-existing pack-wide defect, not something this lesson introduced, but it is the axis worth balancing — not difficulty.

---

## Source and legal position

Content derives from the founder's own study notes on threat actors, written in their own words from:

- the **public** CompTIA SY0-701 exam objectives document, and
- **free/public** Professor Messer SY0-701 material.

No paid-bank content is involved. This is clean under the cert-pack §10 sourcing discipline (no MeasureUp, Whizlabs, Skillcertpro, Tutorial Dojo, or paid course material). All new entries carry `source: "curated-lesson-threat-actors"`.

---

## Scope

**In scope**

1. 14 new exemplars on topic `Threat Actors & Motivations`, objective `2.1`.
2. Rewrite of the 4 existing 2.1 exemplars into the current house explanation style, with two re-tiered.
3. 2 new `retentionGapConcepts` entries.
4. Version bump to v8.14.0 and a CHANGELOG line.

**Out of scope**

- Any change to `domainWeights`, `topicDomains`, `topicResources`, or the balance guard.
- Any change to the other nine D2 topics.
- PBQ / Sim Lab archetypes. Threat-actor attribution is not a PBQ shape.
- New GT tables. The six-actor attribute grid is handled as a retention concept, not ground truth.

---

## Design

### Organising principle

The spine is **discrimination, not identification**. The exam far more often asks *"which of these two similar actors is it"* than *"name the actor"*, and the generator currently has four examples of the easy shape and none of the hard one. Actor-by-actor and attribute-by-attribute coverage are folded in only where they close a real gap.

### The 14 new exemplars

**Group 1 — the two zero-coverage actors (4)**

| # | Content | Type | Difficulty |
|---|---|---|---|
| 1 | Unskilled attacker: downloads an automated exploitation tool, attacks random hosts, does not understand the underlying vulnerability | mcq | Foundational |
| 2 | **Trap 4** — a sophisticated *tool* does not make a sophisticated *attacker*; capability is assessed on the person | mcq | Exam Level |
| 3 | Shadow IT: sales department buys a cloud CRM on a corporate card without telling IT | mcq | Foundational |
| 4 | Shadow IT danger: what it bypasses — monitoring, backups, patch management, access control, DLP, change management, compliance | mcq | Exam Level |

**Group 2 — discriminators (5)**

| # | Content | Type | Difficulty |
|---|---|---|---|
| 5 | **Trap 3** — insider threat vs Shadow IT. Deliberate misuse of access vs unapproved technology adopted for convenience | mcq | Exam Level |
| 6 | **Trap 1** — organized crime vs nation-state. Both highly capable; *motivation* is the tiebreak (money vs intelligence) | mcq | Exam Level |
| 7 | **Trap 2** — hacktivist vs nation-state. Both political; scale, resourcing and target class decide | mcq | Hard |
| 8 | **Trap 6** — an insider need not be malicious. Accidental/negligent insider still constitutes insider risk | mcq | Exam Level |
| 9 | **Trap 5** — an insider need not be an employee. Contractor or trusted partner with legitimate access qualifies | mcq | Exam Level |

**Group 3 — the comparison attributes (3)**

| # | Content | Type | Difficulty |
|---|---|---|---|
| 10 | *Choose TWO* — which actors are characteristically **internal** in origin (insider threat, Shadow IT) | multi-select | Exam Level |
| 11 | *Choose TWO* — accurate statements about unskilled attacker resources and capability | multi-select | Hard |
| 12 | Resource and sophistication ranking across the six actors | mcq | Foundational |

**Group 4 — the separation model (2)**

| # | Content | Type | Difficulty |
|---|---|---|---|
| 13 | One scenario, three distinct answers: threat **actor** (who) vs **motivation** (why) vs **vector** (how) | mcq | Hard |
| 14 | APT — advanced / persistent / threat; and that APT does **not** automatically mean nation-state | mcq | Hard |

### The 4 rewritten exemplars

Content and correct answers are unchanged. Only the explanation prose is rewritten to the current house format, and two are re-tiered:

| Existing | Change |
|---|---|
| Nation-state (zero-days, 18-month dwell, defence contractor) | Explanation rewritten; `Foundational` → **`Exam Level`** |
| Hacktivist (defacement + manifesto + doxing) | Explanation rewritten; stays `Foundational` |
| Insider (passed over for promotion, exfiltrates, kills backups) | Explanation rewritten; stays `Foundational` |
| Organized crime (hospital ransomware, victim help desk) | Explanation rewritten; `Foundational` → **`Exam Level`** |

The two re-tiers are corrections: neither item is Foundational as written. Both require weighing multiple attributes against each other.

### House explanation format

Every new and rewritten explanation follows the v8.7.0+ pattern established by the Obfuscation and Hashing lessons:

1. Why the correct answer is correct, in one or two sentences.
2. `(X) Wrong — …` for **every** distractor, each naming what that option actually describes.
3. A closing memory trick or exam clue.

### Resulting difficulty spread

18 exemplars on 2.1:

| Tier | Count |
|---|---|
| Foundational | 5 |
| Exam Level | 9 |
| Hard | 4 |

This tracks the bank-wide ratio (roughly 28 / 51 / 21), which matters for the v8.13.0 within-tier picker.

### The 2 retention concepts

Both appended to `retentionGapConcepts` (currently 36 entries), `parentTopic: 'Threat Actors & Motivations'`, `objective: '2.1'`.

**1. `N-U-H-I-O-S — the six actors and their one-word tells`**

Nation-state → GOVERNMENT. Unskilled → TOOLS/TUTORIALS. Hacktivist → BELIEFS. Insider → TRUSTED ACCESS. Organized crime → MONEY. Shadow IT → UNAPPROVED TECH. Carries internal (insider, Shadow IT) vs external (the other four), and the resource ordering nation-state > organized crime > hacktivist > unskilled — flagged as a tendency, not a rule.

**2. `Threat actor vs motivation vs vector`**

Three separate questions the exam deliberately conflates: *who* did it (actor), *why* (motivation), *how did they get in* (vector). Worked through the canonical case — criminal gang, phishing email, ransomware, large demand → actor: organized crime; motivation: financial gain/blackmail; vector: phishing; attack: ransomware.

---

## Data contract

No schema change. New entries match the existing shapes exactly:

- **mcq** — keys `answer` as a single letter string (`"B"`).
- **multi-select** — keys `answers` as an array (`["A","B"]`), plural. This is the shape the runtime scorer reads, and `_formatExemplarsForPrompt` must read both keys and emit only the option letters present. Multi-selects may carry options past D.
- Every entry carries `type`, `question`, `difficulty`, `topic`, `objective`, `options`, `answer`/`answers`, `explanation`, `source`, `addedVersion`, `addedDate`.

`_formatExemplarsForPrompt` must stay self-contained — no external helpers, `typeof CERT_PACK` guarded — because the UAT suite extracts and runs its body in a bare vm sandbox. Nothing in this change touches that function, but the constraint is why the entry shapes cannot drift.

### Placement

`questionExemplars` is **append-ordered by ship, not grouped by topic**. That splits this change across two parts of the file:

- The **4 rewritten exemplars** are edited in place, in the existing v7.4.0 block (currently around lines 571–574). They are not relocated — moving them would produce a diff that looks like a delete-plus-add and obscures that only prose changed.
- The **14 new exemplars** are appended at the end of the array under a banner comment, following the convention set by the Obfuscation (v8.7.0) and Certificates (v8.12.0) blocks:
  `// ── Threat Actors lesson (v8.14.0, 2026-08-22) — 14 entries covering obj 2.1 ──`

The 2 retention concepts append to `retentionGapConcepts` under a matching banner, consistent with the per-lesson banners already in that array.

---

## Verification

1. **Suite** — `tests/uat/` must stay green, with particular attention to `110-validation-audit-gate.js` and any exemplar-shape assertions.
2. **Balance guard** — must pass without modification, at `tests/uat/120-cert-pack-architecture-secplus-metadata.js:664`. It counts every `"objective":"N.M"` match in `certs/secplus.js`, so new exemplars **must** use the compact JSON-string form with no space after the colon or they will not be counted. `retentionGapConcepts` use the JS form (`objective: '2.1'`) and are correctly excluded.

   Measured headroom before writing this plan:

   | Domain | Now | After +14 on D2 | Target | Tolerance |
   |---|---|---|---|---|
   | D1 | 95 (30.8%, **+18.8pp**) | 95 (29.5%, +17.5pp) | 12% | 19pp |
   | D2 | 59 (19.2%, −2.8pp) | 73 (22.7%, **+0.7pp**) | 22% | 10pp |
   | D3 | 43 (14.0%, −4.0pp) | 43 (13.4%, −4.6pp) | 18% | 10pp |
   | D4 | 67 (21.8%, −6.2pp) | 67 (20.8%, −7.2pp) | 28% | 10pp |
   | D5 | 44 (14.3%, −5.7pp) | 44 (13.7%, −6.3pp) | 20% | 10pp |

   The change does not merely fit — it **improves** the guard's worst number. D1 currently sits at +18.8pp against a 19pp tolerance, roughly **0.2pp from failing**, and adding D2 content is what pulls it back. D2 lands almost exactly on blueprint.

   If a future pass ever does trip this guard, the fix is to trim, not to widen. The D1 precedent is explicit that widening a saturated guard twice was already one time too many.
3. **Answer-key audit** — every new item hand-checked: exactly one correct answer for mcq, exactly two for the `Choose TWO` items, and no distractor that is arguably also correct.
4. **Distractor sanity** — no fabricated-sounding distractor that a knowledgeable candidate would eliminate on style alone. Distractors should be real terms from the objective.
5. **Generation smoke test** — after the change, generate a batch of 2.1 questions and confirm the output actually reaches unskilled attacker and Shadow IT. These exemplars exist to shift generator behaviour; if generated questions still cluster on the same four actors, the change has not done its job. **This is the real acceptance test, not a green suite.**

Point 5 is the one that carries the lesson from 2026-07-27: a passing suite is not evidence that the user-visible behaviour changed.

---

## Rejected approaches

**Actor-driven organisation** (two exemplars per actor, evenly distributed). Rejected because it produces twelve near-identical "read scenario, name the actor" items — the exact weakness of the current four. Even coverage of actors is not the same as coverage of question shapes, and the generator learns from shape.

**Attribute-driven organisation** (structure everything on the four comparison axes). Rejected as the primary spine because it under-serves actor identification, which remains the more commonly tested shape. Folded in as Group 3 instead.

**Gap-only pass** (~6 exemplars: just the two missing actors plus two traps). Rejected as leaving most of a good source on the table for no saving worth having — the marginal cost of the other eight is small once the lesson is already loaded.

**Maximal pass** (~20 exemplars + 3 concepts covering every motivation in the objective). Rejected for over-weighting 2.1 against the other nine D2 topics and risking the balance guard for coverage the generator can interpolate anyway.

**Leaving the 4 existing exemplars untouched.** Rejected because exemplars are style anchors — four thin ones sitting alongside fourteen rich ones dilute the signal the new ones are meant to send.

**A GT table for the six-actor attribute grid.** Rejected under the same reasoning as the AI-900 pack: the grid is a tendency, not enumerable ground truth. Resource and sophistication levels are "usually" claims with real exceptions, and encoding them as ground truth would make the pack assert things the exam itself hedges.
