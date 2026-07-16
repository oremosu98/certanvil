# Checkpoint 7 — Domain Review (source-quality grade + domain-soundness check)

**Date:** 2026-07-16 · **Stage:** domain review (pipeline stage 5 of `00-inventory-and-exclusions.md`) · **Reviewer role:** calibrated domain reviewer, NOT a CompTIA examiner
**Inputs read in full:** `00`, `01`, `02`, `03`, `04`, `05`, `06`.
**Scope:** RESEARCH ONLY. Nothing here approves a build.

---

## 1. Calibration statement — what this review can and cannot establish

**What I CAN do:** grade the quality of the *source base* behind each claim; count independent sittings; check firsthand vs secondhand; deduplicate; check whether a proposed scenario is technically coherent, objective-aligned, vendor-neutral, and OS-pinned; and audit whether the gate was applied consistently to its own written text.

**What I CANNOT do — and no amount of analysis downstream will change this:**

- I **cannot establish that any PBQ format is genuinely on the live exam.** CompTIA does not publish PBQ formats, the item bank rotates, candidates sit under NDA, and every "sighting" is one person's recall of a few minutes of a form they saw once. I can confirm a format was **reported**. That is a different claim, and the gap between them is not closeable from a desk.
- I therefore **emit no `examFrequency` figure, and none should be derived from this document.** Any number of the shape "X% of forms contain this PBQ" would be fabricated. If a build spec or product surface later carries such a number, it did not come from here.
- **Grades below are source-quality grades for the claim "this PBQ FORMAT appears on this exam."** They are not probabilities and not ground truth. A `C` means *the evidence is thin*, not *the format is absent*.
- **Absence of evidence here is weak evidence of absence.** Both evidence docs say so and both are right. The Sec+ corpus is 2 sittings against a large rotating bank; the Core 2 corpus is a mirror-scraped slice of one subreddit. Neither can support a negative.
- **The Sec+ sample is biased and its grades are less reliable than Core 2's at the same letter.** Per `01-…` §0: Reddit unreachable by every route, TechExams behind Cloudflare, leaving **fetchable personal blogs only** — a slice skewed to people who enjoy writing, in English, mostly US/SG. A Sec+ `B` and a Core 2 `B` are not the same evidentiary object. I mark Sec+ grades `B(biased-sample)` to keep this visible at a glance rather than in a footnote nobody reads.
- **An UNEVIDENCED candidate is C by definition.** Nine of twelve survivors are unevidenced. Several are the most product-attractive ideas in the set (`iam`, `settingstree`, `disklayout`). Attractiveness is not evidence and I have not let it lift a single grade. Where a candidate is *both* unevidenced and internally marginal, I say so twice.

**Rubric used, verbatim from the brief:** `A` = multiple independent firsthand current-code sittings + corroborating detail · `B` = 2+ independent firsthand current-code sittings · `C` = 0–1 sittings, or secondhand, or inference from objectives/plausibility.

**Headline: no survivor earns an A. Two earn a qualified B. Ten are C.** That is the honest shape of this evidence base, and §5 argues that even the two Bs are softer than the candidate docs present them.

---

## 2. Per-survivor evidence grade

### 2.1 A+ Core 2 (220-1202) — 7 survivors

| # | Survivor | Grade | Independent sittings | Basis |
|---|---|---|---|---|
| S-1 | Ticket-Queue Triage Console | **C** | **1** | Firsthand, current-code |
| S-2 | Quarantine & Services Console | **C** (doc claims 2 sittings; see below) | **1 full + 1 keyword-only** | Firsthand, current-code |
| S-3 | Windows Settings Path Locator | **C** | **0** | Objective inference (1.6) |
| S-4 | NTFS/Share Effective-Access Workbench | **C** | **0** | Objective inference (2.2); only "evidence" is an excluded dump-adjacent post |
| S-5 | Change-Advisory RFC Board | **C** | **0** | Objective inference (4.2) |
| S-6 | Disk & OS Deployment Planner | **C** | **0** | Objective inference (1.2) |
| S-7 | Certificate & Security-Warning Adjudicator | **C** | **0** | Objective inference (3.4) |

**S-1 — C.** One independent firsthand sitting (u/FRESH__LUMPIA, ~2026-07-12, 220-1202, pass). The report names two of the archetype's four steps almost verbatim ("prioritize customer requests and choose the appropriate solutions"), which is good *fit* but does not add a second sitting. One sitting = C by rubric, no argument available.

**S-2 — C, downgraded from the doc's implied B.** `03-…` counts **2 independent sittings** and `05-…` §4 calls S-2 the "highest-linkage survivor in the set." I do not think the second sitting survives scrutiny — see §5.2. In short: u/FRESH__LUMPIA (~2026-07-12) describes the format fully; u/armbarassassin84 (2025-10-19) contributes the single phrase *"quarantine for audio issues"*. That is one shared **keyword** in a semantically odd pairing, not an independent description of a quarantine-plus-services roster console. Basis: 1 firsthand full description + 1 firsthand keyword corroboration. **This is the most consequential regrade in the document** — it removes Core 2's only claimed B.

**S-3, S-5, S-6, S-7 — C.** Zero sittings. Pure objective inference from a current final objectives doc (v3.0). Stated plainly: these are **bets on unreported surface**, not observations. `05-…` §4 already says this honestly and deserves credit for it.

**S-4 — C, and the weakest-founded of the unevidenced Core 2 set.** Zero sittings. The corpus's only permissions-PBQ claim is the @arminarleet149 Medium post, correctly excluded as dump-vendor-promotional and possibly fabricated. `03-…` §5 states outright that no permissions-table PBQ has been described firsthand for 1202. The adjacent Klutzy-Astronaut-280 mention of "permissions" is **Linux** — a different OS and, per 1.9's *Identify* verb, the lightest-weight corner of the blueprint. It lends S-4 nothing.

### 2.2 Security+ (SY0-701) — 5 survivors

| # | Survivor | Grade | Independent sittings | Basis |
|---|---|---|---|---|
| C1 | VPN Tunnel Parameter Negotiation (`vpntunnel`) | **B(biased-sample)** for "a VPN config PBQ exists" · **C** for the Phase1/Phase2 site-to-site form | **2** / **1** | Both firsthand; one exam code inferred |
| C2 | Fleet Infection Attribution (`fleetlog`) | **B(biased-sample)** for the task · **C** for the scored mechanic | **2** / **1** | Both firsthand; one exam code inferred |
| C3 | Certificate Chain Diagnostics (`certchain`) | **C** | **0** | Objective inference (1.4); on `01-…`'s explicit zero-support list |
| C4 | IAM Entitlement Review (`iam`) | **C** | **0** | Objective inference (4.6) + vendor CLAIM |
| C5 | Vulnerability Remediation Queue (`vulnq`) | **C** | **0** | Objective inference (4.3/5.2); absent from the corpus entirely |

**C1 — B(biased-sample) / C split.** Two independent firsthand sittings (Rajanish, Hashnode, SY0-701 **stated**, ~Jun 2024; Medeiros, Medium, SY0-701 **inferred**, ~Apr 2025) both describe a VPN configuration form. That clears the B bar as written. Two deflators the grade must carry: (a) they describe **different VPN sub-types** — Rajanish "full tunnel" (remote-access), Medeiros site-to-site with Phase 1/Phase 2 panels; the *specific form C1 builds* rests on **one** sitting, so the sub-shape is C. `06-…` handles this well by spanning both sub-types on the scenario axis, which is the right design response. (b) Medeiros' exam code is a **two-link inference** (§5.1). B is the right letter for the family claim; nothing here supports A.

**C2 — B(biased-sample) / C split, and the split matters more here than for C1.** Two independent firsthand sittings ~10 months apart, authors with no visible connection, both describing "compromised network, work out which machines are infected." `01-…` calls it "the strongest claim in this report" and I agree it is the corpus's best convergence. But **C2's scored act is the sub-shape** — per-host Clean/Infected/Source labelling against a cross-referenced central flow log — and that sub-shape is **Medeiros only**. Rajanish corroborates the *goal*, not the mechanics. `06-…` §4 states this precisely and honestly. So: the task is twice-attested (B); the thing the archetype actually scores is once-attested (C). Both letters belong on this row.

**C3 — C.** Zero sittings. `01-…` §1 lists "Certificate / PKI viewer or troubleshooting PBQ" **explicitly** under *"Format claims with ZERO firsthand sitting support (found only in prep/SEO content)"*. Passed the gate on distinctness and buildability alone, which the gate permits. Being the most elegant design in the Sec+ set does not move this letter.

**C4 — C, and the grade must resist real pressure.** Zero sittings. The support is: obj 4.6 is a ▶ stem, and Dion's PBQ pack *claims* "access control" coverage. The second is a **vendor CLAIM**, and `01-…` §3 collapses all 16+ prep-vendor domains to **zero sittings** while flagging a circularity risk (both sitting authors studied Dion/Cyberkraft material). A vendor's product listing cannot corroborate a format; it is marketing for a simulation of the thing in question. `iam` is the most product-attractive candidate in either cert — a genuinely new interaction, a real teaching point, a defensible mobile pivot. **It is still C.** Recording that explicitly because this is exactly the row where inflation would happen.

**C5 — C, the thinnest evidence base in either cert.** Zero sittings, and it is not even on `01-…`'s zero-support list — it **did not surface in the corpus at all**, from sittings *or* vendors. Purely blueprint-derived. Compounding: it is also the marginal gate-2 survivor (§3.2 and §4.3 below). Thinnest evidence **and** weakest distinctness is a bad pairing, and the ranking stage should treat the two facts as multiplying, not averaging.

---

## 3. Domain-soundness flags

Nine of twelve survivors are technically coherent and objective-aligned as written. The exceptions and conditions follow. **§3.1 is the finding I would lead with in this whole review.**

### 3.1 🔴 CROSS-PIPELINE COLLISION — Sec+ C3 and Core 2 S-7 are the same archetype, minted twice

Neither gate could catch this: the pipelines are **standalone by design** (`00-…`: "per cert, standalone — no cross-cert merge"), and gate 1 measures against *the 14 existing archetypes*, not against a sibling pipeline's live candidates. Catching it is precisely what a cross-cutting domain review is for.

| | Sec+ C3 | Core 2 S-7 |
|---|---|---|
| Reference kind | **`certchain`** | **`certchain`** |
| Validator | **`simLabValidateCertChainFidelity`** | **`simLabValidateCertChainFidelity`** |
| Chain | inspect chain → identify fault(s) → select remediation | read warning + chain → diagnose cause → choose remediation |
| Fault/cause set | expired · name mismatch (SAN) · missing intermediate · revoked · untrusted root · wrong key usage | expired · name mismatch · untrusted/missing root · revoked · **clock drift** · **interception proxy** |

Identical reference-kind name, identical validator name, **4 of 6 fault classes shared**, same three-step read-diagnose-remediate chain. These are not two archetypes. They are **one archetype with two difficulty dials**: Sec+ adds multi-fault planting, false-positive penalty, and remediation-class equivalence; Core 2 adds the local clock as a discriminating fact and a "stop, escalate" answer, and pins to single-cause seeds.

**Recommendation: build ONE `certchain` archetype, with cert and difficulty as seed axes.** Core 2 seeds = single planted cause, closed remediation set, clock exhibit present, browser-warning framing. Sec+ seeds = 1–2 planted faults, class-set remediation equivalence, FP penalty, API/mTLS framing. The Sec+ scoring model is a strict superset of Core 2's, so one validator with `faultCount: 1` and an exact-match remediation set reproduces S-7 exactly. Shipping two would duplicate a renderer and a validator and then drift them.

Note this **changes neither gate outcome** — both pass gate 1 against the 14-archetype baseline as written. It is a build-consolidation call for the ranking/spec stage, and it should be made *before* either enters a build spec, not after.

### 3.2 🟠 Two further cross-pipeline overlaps — reference kinds, not archetypes

The pattern generalizes: **3 of 12 survivors pair across certs.** The other two pairs are genuinely distinct *archetypes* but share a *widget*.

- **Sec+ C2 `fleetlog` ↔ Core 2 S-2 `endpoints`.** Both are a host roster + per-host expandable drawer + per-host state control, and both open with "identify the compromised host." Task chains genuinely diverge (attribution-from-logs vs isolate-and-harden) and the validators are unrelated. **Distinct archetypes — but one roster reference kind should serve both**, parameterized on drawer content (log rows vs service rows) and control type (label segmented control vs quarantine toggle + service switches).
- **Sec+ C4 `iam` ↔ Core 2 S-4 `acl`.** Both derive effective permissions over a group-inheritance graph. Genuinely distinct on the scored *direction* — C4 **authors** toward invariants (many valid end-states), S-4 **computes** a single-valued result. That is a real and well-drawn distinction and I endorse both. But they share a derivation engine and should share it in code.
  - ⚠️ **Permission-algebra inconsistency between them.** S-4 uses **deny-wins** (NTFS semantics). C4 as written is **purely additive** — "effective = direct OR inherited" — with **no deny concept at all**. Both are internally coherent and both are vendor-neutral, but they are different algebras, and neither doc states its algebra as a declared seed property. **Each seed must pin its algebra explicitly.** Otherwise the derivation core silently adopts one cert's semantics and the other cert's seeds start scoring wrong in a way that looks like a content bug for months.

### 3.3 🔴 Sec+ C4 `iam` — the four-invariant model: three compute, one does not

The task was to check whether the four invariants are *actually computable* and *vendor-neutral*. Verdict: **the model is sound in principle and the fourth invariant is broken as specified.**

- **Sufficiency** (every `requiredAccess` entitlement still effective) — ✅ computable from end-state over the inheritance graph. Vendor-neutral.
- **Least privilege** (no `excessAccess` remains effective, effective = direct OR inherited) — ✅ computable. This is the good one: it is what makes "revoke at the user level" visibly insufficient, which is the archetype's actual lesson.
- **SoD** (no subject holds both halves of a declared `sodPair`) — ✅ computable, vendor-neutral, cleanly declarable per seed.
- **Blast radius** (`changeCount ≤ maxChanges`) — 🔴 **fails on two counts.**
  1. **It is not an invariant.** The other three are predicates over the **end state**. This one is a metric over the **edit path**. It cannot be evaluated from the final grid at all — it requires diffing against the initial state and counting operations, which makes the score depend on *how* the learner got there. That breaks the archetype's own headline promise: *"Multiple end-states satisfy all four and all of them score full marks."* Two learners can reach the **same** end state, one in 2 edits and one in 4, and score differently. That is path-scoring wearing an invariant's clothes.
  2. **It smuggles the answer key back in — the exact failure that killed C13.** Setting `maxChanges` requires the author to already know the size of the legitimate solution set. Set it tight and you forbid a valid-but-longer route (cut the group's permission rather than the membership); set it loose enough to admit every valid route and "revoke everything" walks back in. There is no safe value in between, because **change count is a bad proxy for blast radius anyway**: removing one group membership is 1 change with enormous radius; revoking three direct permissions is 3 changes with almost none. The metric is inversely correlated with the thing it is named after.

  **Recommended replacement — a real fourth invariant, computable from end state:** *no subject **outside** the scenario's target set loses any entitlement in their own `requiredAccess`.* This is **collateral damage**, which is what "blast radius" was reaching for. It kills "revoke everything" immediately and correctly (mass revocation strips bystanders), it is a pure end-state predicate, it is vendor-neutral, it requires no authored magic number, and it makes the seed's other subjects load-bearing instead of decorative. Optionally pair it with a *targeting* invariant (no changes to subjects outside the target set at all) if seeds want a tighter cut.

- **Vendor neutrality — ✅ sound, with the doc's own caveat upheld.** Generic subject/group/permission vocabulary is genuinely neutral and faithful to `02-…` §1's finding that the SY0-701 blueprint is essentially vendor-neutral (only "Group Policy"/"SELinux" appear, as 4.5 examples). `06-…` already flags "must not reproduce a specific cloud provider's IAM console" as the most likely design drift. **I second that as a hard build constraint** and add the sharper version: the drift will not arrive as a logo, it will arrive as **vocabulary** — the moment a seed says "policy attached to a role" or "permission boundary," the archetype has silently become one vendor's model and Sec+ neutrality is gone. Pin the vocabulary in the spec: *subject · group · permission · direct · inherited*.

### 3.4 🟠 Sec+ C5 `vulnq` — is it `order` in a costume?

**Verdict: the ordering step is. The disposition step is not. And the archetype is better off without the part that is.**

Taking the doc's own §2.5 defense seriously, point by point:

- *"The disposition step is a genuinely new interaction."* **Half-true and the important half is false.** Assigning each finding to one of five closed states scored against an `acceptableDispositions` set is the **`categorize` primitive** with set-membership scoring. Set-membership is a new *scoring* nuance, not a new *interaction*. What **is** genuinely novel is the **composition**: the queue's membership is candidate-determined, so step 3 operates on a set the learner defined in step 2. No existing archetype does that, and it is a real structural difference.
- *"The partial-order validator is a new scoring model."* ✅ **True, and it is the archetype's only unambiguous novelty.** Checking an ordering against declared `mustPrecede` pairs — every consistent ordering scores full — is genuinely not sequence equality and no existing validator does it.

So C5 survives **gate 1** (which requires distinctness in chain, scoring, **or** validator — the validator alone carries it). Whether it survives **gate 2** is a different and unresolved question, treated in §4.3, because gate 2 is written about *interaction* and C5 has no new interaction.

**Recommendation — cut the ordering step.** This is counterintuitive and I want to be precise about why:

1. The ordering step is the part that **looks like `order`**, and it looks like it because it largely *is* it — a relaxed comparator over the `order` primitive.
2. The teaching point the doc identifies — *"asset context overriding raw severity, which is the actual teaching point"* — lives **entirely in the disposition step**. Nothing is taught by dragging four already-correctly-dispositioned cards into a consistent sequence.
3. `06-…` §2.5 has the risk exactly inverted. It says: *"If the build drops the disposition step and ships a plain drag-to-order list, it becomes a thin variant and fails gate 2."* Correct. But the symmetric move is the good one: **drop the *ordering* step and the archetype gets *more* distinct, not less** — it becomes a pure context-overrides-severity disposition engine with set-membership equivalence, with no surface that resembles `order` at all.
4. Cost: it loses the partial-order validator, which is its only unambiguous gate-1 novelty. So the honest framing for the ranking stage is a **fork, not a fix**: *either* C5 keeps ordering and remains a marginal survivor whose distinctness rests on one validator trick and whose gate-2 status is contested, *or* C5 drops ordering and must re-argue gate 1 from the disposition composition alone.

Given C5 is **also** the thinnest evidence base in either cert (§2.2 — absent from the corpus entirely, from sittings *and* vendors), I do not think it earns the analysis either fork requires. **My recommendation to the ranking stage: rank C5 last, and treat it as the first thing cut when scope tightens.** The doc's instinct to flag it MARGINAL was right; I am hardening that flag rather than resolving it in its favor.

### 3.5 🟠 Sec+ C2 `fleetlog` — the gate-5 mobile contract addresses layout, not the join

The contract in `06-…` §2.2 (no table; card accordion; filter chips; ≤8 flow rows; 4–5 hosts on mobile; segmented label control, no drag) is thoughtful and I endorse every clause. It solves **layout**. It does not solve the thing that actually makes this archetype hard on a phone, and one clause may quietly destroy the archetype.

- 🔴 **The evidence-summary icons may leak the answer.** The contract puts a *"3-icon evidence summary (inbound / outbound / none)"* on each collapsed host card. But the scoring invariant is: **Source = unique root of the infection DAG (outbound flows, no inbound); Infected = reachable from root; Clean = unreachable.** Those icons are a **direct rendering of the invariant**. A learner who never opens a single drawer can read the icons and label the fleet correctly: outbound-only → Source, inbound → Infected, none → Clean. The cross-source join — *the entire scored act, and the thing that distinguishes `fleetlog` from `triage`* — is pre-computed and handed over as a convenience affordance. **Fix: the collapsed summary must be raw and semantically inert** — e.g. flow *counts* with no direction semantics, or a "N log lines" chip — or it must be removed. The learner must open the drawer and do the join. This is a build-spec condition of the same class as the no-table rule, and it is more dangerous because it looks like a usability win.
- 🟠 **Working memory across navigation is the real 375px cost.** The join requires holding host A's local log against the central flow log. On desktop both are visible at once. Under the accordion contract they are not, and the learner must remember. The `vpntunnel` design solved the identical problem elegantly with a persistent "mirror" summary chip strip (`06-…` §2.1) — `fleetlog` needs the analogous device: a **pinned context strip** showing the currently-selected host's key flows while the central log is filtered. Without it the archetype is *usable* at 375px but *harder* at 375px, which is a fidelity failure of a subtler kind than gate 5 names.
- 🟡 **n=4 makes partial credit coarse.** The contract caps mobile at 4–5 hosts. The graph invariant does work at n=4, as claimed. But with exactly one Source and at least one Clean, only ~2 hosts are genuinely ambiguous, so the label space collapses and guessing pays. Not a gate failure; a seed-authoring note. Prefer n=5 on mobile where the exhibit allows.

**Net: gate 5 holds under the contract, conditional on the icon fix.** With the icons as specified, C2 fails a *different* gate — 1, against `triage` — because if the join is pre-computed, what remains is per-host classification from a rendered summary, and the distinctness argument in `06-…` §2.2 (which rests entirely on the cross-source join) evaporates. Flagging that dependency explicitly: **the icon detail is not cosmetic; it is load-bearing for C2's gate-1 survival.**

### 3.6 🔴 Core 2 S-4 `acl` — compute-only scoping is right; the stated precedence rule is wrong

**The scoping decision is correct and well-reasoned.** Compute-not-author is exactly right: authoring an ACL toward a goal is many-to-one and would have failed gate 6; computing effective access is single-valued and total. This is the sharpest gate-6 reasoning in either document, and it is the model C4's blast-radius invariant (§3.3) should have followed.

**But the stated algorithm has a real technical error.** `05-…` §S-4 gives the precedence as:

> cumulative allow across group memberships → **explicit deny wins** → for network access, the *more restrictive* of (effective NTFS, effective share)

Two of three are right. Cumulative allow across group memberships ✅. Share-vs-NTFS most-restrictive-wins for network access, share ACL ignored locally ✅ (and the local-vs-network split is a genuinely good teaching axis).

**"Explicit deny wins" is the folk rule, and it is wrong in exactly the case S-4's own seed axes create.** Real NTFS precedence is **explicit before inherited, then deny before allow *within the same level***. The consequence: an **explicit allow on the object BEATS an inherited deny.** S-4 lists *"inheritance-blocked folders"* and *"deny placement (share vs NTFS)"* as seed axes — so seeds **will** combine inherited denies with explicit allows, and the stated rule will compute the wrong answer on them, deterministically and invisibly, because the validator is single-valued and will look confident while being wrong.

**Required decision, and it must be made in the spec, not in the code:**
- **Option A (recommended for A+ level):** restrict every seed to **same-level ACEs** — no inherited deny paired with an explicit allow. The folk rule is then correct, the exhibit is honest, and the archetype teaches what CompTIA teaches. Cost: drops the inheritance-blocked-folder axis, shrinking the bank somewhat from the estimated 18–24.
- **Option B:** implement full precedence (explicit > inherited, deny > allow within level). Technically correct, keeps the axis, but risks marking a learner wrong for applying the rule the A+ curriculum itself teaches — which is a bad experience defensible only with excellent feedback copy.

Either is fine. **Silently shipping the folk rule while authoring inherited-deny seeds is not**, and that is the current trajectory.

- 🟡 **Step 3 needs an authoring guard.** "Exactly one ACE is decisive" is an authored constraint, but *decisive* is ill-defined when two ACEs independently deny the same access — remove either and the outcome is unchanged, so neither is uniquely decisive. Seeds must be validated for single-decisive-ACE-ness, not merely asserted to have it.
- ✅ **OS pinning is acceptable here, and it is the one archetype where non-pinning is defensible.** "Windows 10/11 both; NTFS semantics identical across them" is true. Contrast S-3 (§3.7), where pinning is the entire pedagogy.

### 3.7 🟠 Core 2 S-3 `settingstree` — `acceptedTerminals` is honest; the doc defends it on the wrong axis

**Is `acceptedTerminals` honest? Yes — and more robustly than `05-…` argues.** The doc worries: *"a seed with an unenumerated route is a content bug, caught by fidelity validation."* That worry is misdirected, and the reason is worth stating because it strengthens the archetype:

**The simulated tree is a closed world.** A route that was never authored simply *does not exist in the sim* — it is not navigable, so a learner cannot take it, so it cannot be mis-scored. An unenumerated route is therefore **not a scoring bug** and fidelity validation is not what catches it. It is an **exhibit-fidelity gap**: the sim's Windows differs from real Windows. That is a content-quality problem (the learner builds a slightly false spatial model), not a fairness problem (nobody gets marked wrong for a correct answer). **Reframe the risk in the spec accordingly** — the doc is defending against the scarier failure and has not noticed it is structurally immune to it.

**The real soundness problem is elsewhere: S-3's scored act is not its novel interaction.**

The archetype's gate-2 case is *"navigation-with-history is the genuinely new interaction"* — and it is; no existing reference kind is navigable. But the **scoring** accepts any path whose *terminal* is in `acceptedTerminals`, with efficiency reported as feedback only and explicitly **not** gating correctness. So the scored act reduces to **"reach an accepted end node, then set the control."** The path is unscored. The navigation is real, and unmeasured.

This is not a gate failure — the validator (path-acceptance) is genuinely new, and gate 1 needs only one of chain/scoring/validator — but it **weakens the distinctness case more than `05-…` admits**. The doc claims *"S-3's task is finding the control — the value-setting is the trivial last step"*, and *"removing the navigation removes the archetype entirely."* Both true of the **experience**; neither true of the **scoring**, which cannot distinguish a learner who navigated confidently from one who wandered into every wrong branch and stumbled onto the right pane. A search box would score identically.

**Recommendation:** decide what is being taught. If it is *Windows spatial memory* (the stated pedagogy), then **efficiency must score** — not as a pass/fail gate, but as a graded component (e.g. full credit at ≤ shortest-accepted-path + 1, partial beyond). If efficiency stays pure feedback, be honest in the spec that this archetype scores **destination knowledge**, and let the navigation be the *interaction* that makes it feel like Windows rather than the thing being measured. The current spec wants both and has specified only the second.

- ✅ **OS pinning is exemplary.** Per-seed Win10-or-Win11 pinning, with the doc's line — *"The pinning is the pedagogy, not an afterthought"* — exactly right, and correctly grounded in the objectives PDF's verbatim "NOTE ON WINDOWS 11" plus 1.3's explicit enumeration of both editions.
- 🟡 **Monitor: the Windows 10 scope tension.** The objectives note scopes in *"versions ... not end of Mainstream Support ... up to and including Windows 11."* Windows 10 reached end of support in **October 2025** — nine months before this research date. Windows 10 is nevertheless unambiguously in scope for 220-1202 **because 1.3 enumerates its editions explicitly** in objectives doc v3.0, and the doc of record governs. But S-3 is the archetype whose bank is **built on Win10-vs-Win11 divergence**, so it is the most exposed to a future objectives revision quietly dropping Win10. Not a flaw. A monitor item, alongside `06-…`'s SY0-801 watch.

### 3.8 Remaining Core 2 flags

- 🟠 **S-5 `rfc` — framework-lock, the A+ analogue of vendor-lock.** The archetype classifies changes as **standard / normal / emergency**. That trichotomy is **ITIL** vocabulary. `04-…`'s rendering of obj 4.2 does not list it; the objective's content is documented business processes, request forms, purpose/scope, risk analysis, change board approvals, and rollback plan. Sec+ has an explicit neutrality requirement and Core 2 does not (it names Microsoft Windows throughout, legitimately) — but importing a **named external framework's taxonomy** and scoring against it is the same error in a different coat: it marks learners against a body of knowledge the exam objective did not grant. **Fix: use the objectives' own vocabulary.** Seeds may absolutely teach that some changes are pre-approved and routine while others need a board and others are retroactive — that is 4.2's actual content — without scoring the learner on whether they picked the correct ITIL noun.
- 🟠 **S-5 — the internal-consistency credit is gameable.** Scoring step 2 against *the learner's own* step-3 classification is coherent, computable, and pedagogically generous. It is also exploitable: classify everything **standard** (the smallest required-field set) and harvest maximum consistency credit for minimum work. Needs a floor — consistency credit should be capped as a fraction of the item, or gated behind a correct-or-adjacent classification.
- 🟡 **S-6 `disklayout` — two authoring guards needed.** The design is technically sound and the objective mapping to 1.2 is the tightest in the Core 2 set (boot methods, GPT/MBR partitioning, upgrade considerations are 1.2's literal content). Range-band scoring is the right model and the bands quoted are correct (EFI 100–500 MB, recovery ≥ 650 MB, GPT forced > 2 TB, Win11's UEFI+GPT+TPM+Secure Boot floor). Two gaps: (a) **MBR's constraints must be validator invariants**, not seed prose — the 2 TB ceiling and the 4-primary / 3-primary-plus-extended limit; otherwise a learner can produce an MBR layout that sums correctly and is impossible. (b) **ReFS must be excluded as a boot/OS volume.** 1.1 lists ReFS (new in V15) and S-6 draws filesystems "from the 1.1 list" — but ReFS cannot host a Windows boot volume. If the picker offers it for the OS partition, the archetype teaches a falsehood.
- ✅ **S-1 `queue` — sound.** Objective 4.1 (ticketing, documentation) fits; 4.7 as secondary via requester-tone cues is a nice touch and legitimately in the objective. Band-partition scoring with band-distance penalty is a correctly-specified equivalence model and gate 6 holds cleanly. Mobile plan is the most honest in either document — ticket cards genuinely *are* the native phone pattern, not a rescued table. Minor: OS pinning is cosmetic here (the archetype is OS-agnostic by nature), which is fine and honestly labelled.
- ✅ **S-2 `endpoints` — technically sound.** Objectives are the tightest pairing in the set: 2.6 lists *quarantine* literally, 2.7 lists *disable unused services* literally. A per-host isolate toggle is a faithful model of 2.6's quarantine step; the tri-state service matrix with enumerated `don't-care` cells is genuinely total scoring with no undefined cells, so gate 6 needs no equivalence model — correct. Asymmetric penalty (false-negative fatal, false-positive partial) is well-judged. The Win10-Home pinning for the System-Restore-disable step is a precise catch — that step **is** Windows-Home-specific in 2.6. **My only concern with S-2 is evidentiary, not technical** (§2.1, §5.2).
- ✅ **S-7 — sound as designed** (subject to the §3.1 consolidation). 3.4 names *certificate warnings* explicitly; the clock readout as the discriminator between drift and expiry seeds is a genuinely elegant piece of exhibit design, and it is the one thing S-7 has that Sec+ C3 does not. Browser-naming per seed is acceptable for Core 2 (2.11 is literally browser security settings, and Core 2 carries no neutrality requirement) — but it should be **fixed vocabulary across seeds**, not a per-seed free choice, or the bank fragments.
- ✅ **Sec+ C1 `vpntunnel` — the soundest design in either document.** Symmetry, mirror-inversion, and set-membership-against-policy-floor are three genuinely independent, genuinely computable predicates over an enumerable option space. Vendor-neutral by construction (IPSec/IKE Phase 1/Phase 2 is an open standard, not a vendor's console — consistent with `02-…` §1's finding). The mobile plan's persistent mirror-chip strip is the best single UX idea in the set and, as noted in §3.5, should be borrowed by `fleetlog`. No flags.
- ✅ **Sec+ C3 `certchain` — sound** (subject to §3.1 consolidation). Fault-set comparison with FP penalty plus per-fault `acceptableRemediations` class sets is a well-formed equivalence model; the worked example (missing-intermediate accepts both "install the intermediate" and "send the full chain" but not "reissue the leaf") is exactly right and is real-world correct. Vendor-neutral by construction. `05/06`'s note that 1.4 is a non-▶ objective is handled correctly as a priority signal rather than a gate failure — **but see §4.4, where that same reading is applied in the opposite direction on the Core 2 side.**

---

## 4. Gate audit — agreements and dissents

### 4.1 Sec+ C6 (Cloud Zone Component Placement) — rejected as a `diagram` dup **despite being evidenced**

**AGREE with the rejection. Dissent on one sub-point, and a strong process warning.**

The reasoning is right and the courage is worth naming: this is the **most-evidenced format-C claim in the Sec+ corpus and it still dies**, because *the gate is distinctness, not evidence*. Drag component → zone, scored by `correctPlacements` device→zone string match, validated by `simLabValidateNetworkFidelity` — that is the existing `diagram` archetype (Net+, 16 seeds) with a security-flavoured node vocabulary. Correct call. `06-…` deserves credit for not flinching here; the temptation to let evidence buy distinctness is exactly what the frozen gate exists to resist.

- 🟠 **Dissent, minor:** the dismissal of the "undecided subnet" is overconfident. `06-…` says it is *"expressible as a zone whose membership is itself scored, which `correctPlacements` already supports."* Not quite — `correctPlacements` maps **device → zone**. Classifying the *zone itself* as public or private is a **zone → label** scored object, which is not in that model. It is one new scored predicate, not zero. This does not rescue C6 as an archetype (one predicate ≠ an archetype), but the seed extension should carry a small `zoneLabel` scored field, which is a **minor validator addition, not free**. Say so in the routing note so the build stage does not discover it.
- 🔴 **Process warning — the cheapest evidenced win in this entire research pass is the thing most likely to get lost.** C6 is the only Sec+ format-C claim with firsthand support that maps onto an **already-built** archetype. Its correct disposition (Sec+ seed extension to `diagram`: cloud/zone vocabulary, WAF/LB node types, plus the `zoneLabel` predicate) is cheap, fast, and **evidence-backed** — while five unevidenced-or-thinly-evidenced archetype candidates carry full new renderers and validators. Because C6 **exited the archetype track**, it is now a footnote in a routing table while the C-grade archetypes get ranked. **Recommendation: the ranking stage must rank the C6 seed extension against the archetype survivors, not alongside them as an afterthought.** On evidence-per-unit-build-cost it beats every unevidenced survivor in the Sec+ set. The same applies to C14 → `triage` seeds.

### 4.2 Core 2 C-09 (WinRE / Boot-Repair Escalation Ladder) — rejected on gate 6

**AGREE with the rejection. DISSENT on the stated ground — and the stated ground creates a precedent that contradicts two survivors.**

`05-…` kills C-09 primarily on **item 6**, arguing that *"more destructive than necessary" is not computable from the seed without smuggling the answer key back in.*

**That argument does not hold.** Destructiveness over the WinRE rung set is a **small, closed, uncontroversial total order**: sfc < DISM < startup repair < system restore < reset-keep-files < reset-remove-everything < reimage. Declaring that order in a seed is not smuggling an answer key — **it is precisely the move `vulnq` makes with `mustPrecede` pairs and `disklayout` makes with authored range bands**, both of which survived. If declaring a precedence relation over a closed set is legitimate equivalence modelling for C5, it is legitimate for C-09. **As written, gate 6 was applied inconsistently across the two documents**, and a future reader will find the contradiction immediately — C5's §2.5 all but advertises it.

**The rejection is still correct, on the ground the doc lists second:** C-09 fails **item 1**. An escalation ladder is `incident`'s ordering chain (Sec+, 20 seeds) with a different noun — reactive, sequenced, scored against a remediation order. That failure is solid, independent, and dispositive. The gate is conjunctive; one clean failure ends it.

**Recommendation: amend the record so item 1 is the primary and stated ground, and soften or drop the item-6 argument.** Leaving it as written establishes a precedent that would retroactively kill `vulnq` (declared partial order) and `disklayout` (declared tolerance bands). The *outcome* is right. The *reasoning* is load-bearing for other rows and currently contradicts them.

### 4.3 🔴 Gate 2 was applied to two different standards — C8 vs C5

Comparing the two documents' gate-2 reasoning directly:

- **Sec+ C8** (Data Classification → Control Selection) — **REJECTED, gate 2**: *"Step 1 is the existing `categorize` primitive; step 2 is the existing `match` primitive... No new interaction, **no new validator**."*
- **Sec+ C5** (`vulnq`) — **SURVIVED**: `categorize` (disposition) + `order` (queue), over a new reference kind, **with a new validator**.

Both are two existing primitives composed over a new reference kind. The operative difference is **validator novelty** — C5 has one, C8 does not. But **gate 2's text does not mention validators**:

> *2. Not buildable purely from existing primitives with no new interaction.*

Under gate 2 **as written**, C5 fails: it is buildable from existing primitives (`categorize` + `order`) and introduces no new *interaction* — a new reference kind is an exhibit, not an interaction. Under gate 2 **as applied to C5**, C8 might well survive: give it an invariant-based validator (control-adequacy against declared data-handling requirements) and it clears the same bar C5 cleared. The gate cannot mean both things.

**Recommendation — amend the gate text, then re-run both rows against it.** The intent throughout both documents is plainly *"no new interaction **and** no new scoring model"* — that reading is consistent with every other decision in the set and is the better rule. Adopt it explicitly. Then: **C5 survives** (new scoring model) but its §2.5 marginality is confirmed rather than resolved, and **C8's rejection should be re-stated** on the honest ground — not "gate 2 forbids it" but "no defensible new scoring model was found for it." Recorded because gate 2 is currently the **least consistently applied item in the frozen gate**, and it is doing real work on six rows across both certs.

### 4.4 🔴 Gate 4 was applied in **opposite directions** by the two pipelines

This is the clearest contradiction in the pass, and it changes at least one rejection.

Gate 4, verbatim from `00-…` §3:

> *4. Maps to a current final official objective (SY0-701 / 220-1202), objective-doc version recorded.*

The text requires **mapping to a current final objective**. It says **nothing** about the objective's verb.

- **Sec+ applied it as written, and said so explicitly.** `06-…` §2.3 on C3 (→ obj **1.4**, an *Explain* objective): *"1.4 is a current final objective and satisfies gate 4 as written... It is **not** a ▶ 'Given a scenario' stem — that is an **evidence/priority** signal, graded later, **not a gate failure**."* Same reasoning applied to C5 (→ obj 4.3, *Explain*). **Both survived.**
- **Core 2 applied a stricter, unwritten rule and killed two candidates with it.** `05-…` rejects **C-16** (Scripting Workbench → obj **4.8**, *"Explain the basics of scripting"*) and **C-17** (AI Use-Policy Adjudicator → obj **4.10**, *"Explain basic concepts related to artificial intelligence"*) on **item 4**, reasoning that an archetype *"cannot map to an Explain-verb objective without inventing exam scope CompTIA didn't grant."*

**Same gate. Same wording. Opposite application.** Sec+ says an Explain-verb mapping satisfies gate 4 and the verb is a priority signal; Core 2 says an Explain-verb mapping *is* the gate 4 failure. Two of Core 2's thirteen rejections rest entirely on the reading that Sec+ explicitly rejected in writing.

**My reading: the Sec+ interpretation is correct** — it follows the gate's actual text, and the frozen gate is meant to be mechanical, not interpretive. Verb level is exactly what it says it is: an evidence/priority signal for ranking. Core 2's concern is real and worth preserving, but it belongs at **ranking**, not at a reject-outright gate — "this archetype over-claims a knowledge-level objective" is a strong *deprioritization*, not a distinctness or validity failure.

**Consequence — C-16 and C-17 were rejected on a rule that does not exist and should be reinstated for scoring.** Likely outcomes on re-run, so the ranking stage knows what it is inheriting:

- **C-17 (AI Use-Policy Adjudicator)** — probably falls anyway, on **gate 2**: adjudicating uses as appropriate/inappropriate is `categorize`/`match` over a static list with no distinctive exhibit. Same shape as C-19/C-20. Outcome unchanged; ground corrected.
- **C-16 (Scripting Workbench)** — **deserves genuine re-examination.** It was killed without a buildability or distinctness analysis, purely on the verb. A *predict-the-output* workbench is close to `cli` (gate 1 risk, likely fatal); a *repair-the-broken-script* workbench may be genuinely distinct in chain, scoring, and validator, and 4.8's content (script types; use cases: automation, restarts, reimaging, backups) is real surface. It may still fail — but it should fail on an argument, and it never got one.

**Recommendation: reconcile gate 4 to its written text across both documents, and re-run C-16 and C-17 through the full gate.** More importantly: **this is what standalone pipelines produce.** Two competent passes read the same frozen gate on the same day and applied it in opposite directions. The `00-…` pipeline design says "per cert, standalone — no cross-cert merge," which is right for *evidence* (the exams are unrelated) but demonstrably wrong for *gate interpretation* (the gate is shared). §3.1's duplicate-archetype collision is the same failure in a different register. **Gate interpretation should be pinned once and shared; only evidence should stay standalone.**

### 4.5 Other gate calls — spot-checked, agreed

- ✅ **Sec+ C7** (Firewall/ACL Rule Ordering) — duplicate of `firewall`, gate 1. Agreed, and `06-…`'s framing is exactly right: the industry's single most confident claim is **also** a duplicate **and** has zero firsthand support **and** its strongest supporting quote was fabricated by a search summarizer. It fails on distinctness before the evidence problem is ever scored. Three independent reasons not to prioritize it.
- ✅ **Sec+ C13** (SIEM Detection-Rule Tuning) — gates 5 + 6. Agreed, and this is the **best-argued rejection in either document**. The gate-6 reasoning is exactly right: the valid-answer space is unbounded and continuous, and closing it requires either a hard-coded key (forbidden) or a rule *interpreter* replaying rules against a log corpus (a different and much larger product). Contrast with §4.2: this is what a genuinely uncomputable equivalence space looks like — **open and continuous** — versus C-09's **closed and small** rung set. The two are not the same problem, and treating them as one is what produced the C-09 inconsistency.
- ✅ **Sec+ C14** (Phishing Header Triage) — `triage` reskin, gate 1. Agreed; same-line-relevance scoring with a reference-kind swap is the textbook reskin. Routing to Sec+ `triage` seeds is right — and per §4.1, this is the *second* cheap evidenced-adjacent win that must be ranked, not filed.
- ✅ **Core 2 C-03** (Interactive Shell) — `cli` reskin, gate 1. Agreed, and this is the Core 2 mirror of the C6 problem, stated well by `05-…`: *"This is the single best-evidenced 1202 format (C1) and it is still rejected."* Correct. The disposition (extend `cli` with Core 2 seed sets — Windows commands per 1.5, Linux per 1.9) is right, and the secondary note is sharp: a *Linux-deep* shell archetype would independently fail gate 4, since 1.9's verb is **Identify**, the lightest in the document. **Same ranking warning as C6: this is an evidenced, cheap, already-built-archetype win sitting in a rejection table.**
- ✅ **Core 2 C-05 / C-10 / C-11** (SOHO Security / Mobile Profile Builder / Browser Hardening) — all `soho` reskins, gate 1. Agreed on all three. *"A differing objective is not a differing archetype"* is the right principle, crisply put. C-11 is the painful one — 2.11 is new in V15 and genuinely under-served — and `05-…` resists the temptation correctly by routing browser-security content to S-3's terminal panes and S-7's chain, where it rides a genuinely new interaction.
- ✅ **Core 2 C-06** (Malware-Removal Ordering Ladder) — gate 2 + gate 1. Agreed. The 2.6 seven-step sequence as a drag-list is the excluded shape twice over: `order` over no distinctive exhibit, and an `incident` thin variant. Worth noting `03-…` §5's finding that **no firsthand 1202 report describes a malware-removal ordering PBQ** at all — the classic 1102 folklore expectation appears in the 1202 corpus only as MCQ "what NEXT" sequences. Folklore, not format.
- ✅ **Core 2 C-18** (Event Viewer Log Correlation) — gate 1 + gate 5. Agreed, and the gate-5 reasoning is the sharpest mobile argument in either document: *"correlation requires seeing multiple entries at once, which is exactly what 375px denies; a one-entry-per-card list destroys the task."* That is the correct test — not "does it fit" but "does the scored act survive." **This same test is what §3.5 applies to `fleetlog`'s icon summary**, which is the mirror-image failure: C-18's card list destroys the join, while `fleetlog`'s icon summary *pre-computes* it. Both are the exhibit eating the task.
- 🟡 **Core 2 C-13** (Backup Scheme Designer) — gate 1 vs `raid`. **Agreed, weakly — this is the most re-proposable rejection in the set.** `05-…` claims full/incremental/differential + GFS rotation is *"the same constraint-satisfaction picker"* as RAID level + disk count, *"wearing different vocabulary."* That is arguable but thin: the scored object differs (recovery **time** vs **capacity**), the constraint math differs (RPO/RTO windows vs parity arithmetic), and the failure modes are unrelated. The doc's own hedge — *"cleared none of the three convincingly"* — is doing real work, and "unconvincing" is a lower bar than gate 1's "reskin = reject." I would not overturn it (4.3 survives as a secondary on S-5's rollback-plan field, so the objective is not orphaned), but **flag it as the rejection most likely to be re-proposed**, and if it is, it deserves a real analysis rather than a citation of this one.

---

## 5. Source tiering / dedup audit

**Overall: both evidence documents are unusually disciplined and I found no tier *inflation* in either.** The deflationary moves are exemplary and worth naming, because they are what makes the rest of the corpus trustworthy: 16+ prep-vendor SEO domains collapsed to **one bucket scoring zero**; a **fabricated search-summarizer quote caught by full-page fetch and excluded** (`01-…` §0 — this is the single best piece of research hygiene in the pass, and it would have been the strongest support for the firewall claim); the Aaron Higgins comment excluded as promo; the @arminarleet149 Medium post flagged dump-adjacent and excluded from S-4's linkage; dump sites and Quizlet not opened at all. Sitting counts are counted as *sittings*, not mentions, in both.

The findings below are about **two generous counts** and **one contradiction between the documents that is immediately actionable**.

### 5.1 Sec+ — 2 sittings, both firsthand, one code inferred via a two-link chain

- **Independence: ✅ plausible.** Rajanish (Hashnode, India/EN, ~Jun 2024) and Medeiros (Medium, likely US, ~Apr 2025) — different platforms, ~10 months apart, different regions, no visible connection. Not the same person. The doc's judgement holds.
- 🟠 **But "2 independent sittings" ≠ 2 independent *priors*.** `01-…` §3 flags this itself and deserves credit: **both authors studied Dion/Cyberkraft materials**, so their *expectations* were shaped by the same vendor PBQ list. Recall conforms to expectation, especially for a few minutes of a form seen once under stress and recalled weeks later. The two formats they converge on — VPN config and infected-endpoint ID — are **both on the vendor list**. So the convergence is weaker than "2 independent firsthand sittings" implies: two independent *people*, one shared *prior*. **This is a tier deflation the grades in §2.2 already carry.**
  - ↩️ **Counter-evidence, and it is decent:** the vendor list's **most** confident claim — the firewall rule-ordering drag-drop — is **absent from both sittings**. If recall were strongly conforming to vendor priors, firewall is the first thing that would have appeared. It didn't. That materially limits how much contamination can be assumed. **Net: contamination risk is real but bounded; B(biased-sample) survives, A never was available.**
- 🟠 **Medeiros' SY0-701 assignment is a two-link inference, and only the first link is examined.** `01-…` §4 reasons: SY0-601 retired 2024-07-25, so a post dated 2025-04-27 saying only "CompTIA Security+" is SY0-701 by elimination. **That link is sound.** But it silently rests on a second: **sitting date ≈ post date**. The §6 table lists "Sitting date ~Apr 2025" with **no stated basis** — it is assumed from the post date. If Medeiros sat earlier and wrote it up later (common for these posts), the elimination weakens. The inference is still probably right, and Rajanish states SY0-701 explicitly so at least one leg is firm. **Recommendation: record the sitting date as *inferred from post date* rather than presenting it as a datum** — the §6 table currently reads as if it were observed.
- ✅ **The 4-sitting structure consensus is sound** (Rajanish, Medeiros, John T, Nyambi — all firsthand, all format-independent). And `01-…` is right that it is the report's **best-evidenced finding and it is structure, not format**: PBQs front-loaded, skippable/flaggable with work saved, few (2–3 observed), time-expensive.

### 5.2 🔴 Core 2 — the two "best" survivors trace to **one person's single sitting**

This is the most consequential dedup finding in the review, and neither `03-…` nor `05-…` states it plainly, though `03-…` §3 has all the pieces.

**The pieces, from `03-…`'s own dedup log:**
- Format **C2** (mock ticketing system) → **u/FRESH__LUMPIA**, ~2026-07-12.
- Format **C3** (quarantine + services) → **u/FRESH__LUMPIA**, *same sitting* — the dedup log correctly notes *"C2 and C3 come from one sitting — formats listed separately but sitting counted once."* ✅ Correct and honest.
- C3's claimed **second** sitting → **u/armbarassassin84**, 2025-10-19.

**Therefore: S-1 (Ticket-Queue) and S-2 (Quarantine & Services) — Core 2's two evidenced survivors, the top of its linkage table — are not independent of each other.** They are two formats from **one person's one sitting**. `05-…` §4 presents them as separate rows with separate linkage, which is accurate per-row and misleading in aggregate: the reader sees two evidenced survivors and infers two evidentiary bases. There is one, plus a fragment.

🔴 **And the fragment is the most generous call in either document.** C3's second sitting rests entirely on u/armbarassassin84's phrase: **"The 4th one really tripped me up (quarantine for audio issues)."**

- That is **one shared keyword** — *quarantine* — not an independent description of the format. It describes no roster, no service toggles, no per-host console, no isolation mechanic.
- **The pairing is semantically odd and the doc does not flag it.** Quarantine — a malware-containment action under obj 2.6 — appearing in an **audio** troubleshooting scenario is strange. Plausible readings: the user misremembered; the PBQ was a mixed troubleshooting exhibit where quarantine was one option among many distractors; or "quarantine" was the *wrong* answer that tripped him up. **None of these establishes a quarantine-plus-services roster console.**
- `03-…` §5 grades this family **"Medium-high"** on the strength of *"two independent sittings 9 months apart using the same distinctive verb."* The verb **is** distinctive — that is the strongest thing that can be said for it, and it is not enough. A shared verb in an unexplained context is corroboration of a *word*, not of a *format*.

**Recommendation — and it moves the Core 2 grade table:** recount C3 as **1 firsthand format description + 1 firsthand keyword corroboration**, and downgrade its confidence from *Medium-high* to *Low-medium*, in line with C2's identical single-source status. This is what drives **S-2 to C** in §2.1, removing the only claimed B in Core 2 and demoting `05-…`'s *"highest-linkage survivor in the set."*

**The honest summary of the Core 2 format corpus: 3 named formats, ~2 sittings, one of which supplies two of the three.** `03-…`'s §1 tier labels also read hotter than its own §5 confidence table — Format C1's *"Tier: r/CompTIA pass post, firsthand, **high confidence**"* sits beside §5's *"Medium (single source)"* for the same claim. **§5 is right; the §1 labels should be reconciled down to match.**

- ✅ **Other Core 2 dedup calls are correct:** u/Jayy-Kayy's two posts counted once per exam; u/still6shawtyy's fail+pass counted once; u/armbarassassin84's fail counted as one sitting (a fail **is** a sitting — correct); u/Ri6k's duplicates excluded as Core 1; the 1102 material quarantined into §4 as prior-gen context; YouTube walkthroughs correctly used as ecosystem colour, never as sightings.
- ✅ **The 8-sitting form-shape finding is solid** — 4–7 PBQs per 1202 form, mode 5 — and, exactly as with Sec+, Core 2's best-evidenced finding is **structure, not format**. That symmetry across two independently-gathered corpora is itself worth noting: it is the most reliable thing either pass produced.
- 🟡 **Mirror-retrieval caveat, minor:** content came via `redlib.privacyredirect.com`, not reddit.com. Mirror content is faithful in principle, but the route makes author-history checks (account age, karma, posting pattern) impractical, so "independent accounts" rests on username distinctness alone. That is adequate here — different accounts, 9 months apart, one pass and one fail, no cross-referencing — but it is a weaker independence test than a direct session would allow, and it should be recorded as a known limit of the method.

### 5.3 🔴 The two documents contradict each other on Redlib — and the Sec+ gap is **fixable today**

This is the most actionable finding in the review.

- **`01-…` §0 (Sec+), 2026-07-16:** *"Reddit mirrors (**redlib**, safereddit) are behind Anubis/403."* → concludes the r/CompTIA corpus is **entirely absent**, and that *"any conclusion below could be overturned by a few hours of manual r/CompTIA reading."*
- **`03-…` (Core 2), same day:** *"r/CompTIA content was retrieved through a **Redlib mirror (redlib.privacyredirect.com) rendered in a real browser**."* → 12+ thread-level reads, 20+ sittings, the entire Core 2 evidence base.

**Same tool, same day, opposite outcomes.** The likely explanation is in the Core 2 phrasing: *rendered in a real browser* versus fetched by a crawler — the browser-pane route survives the Anubis challenge that 403s the crawler. It is also possible the Sec+ pass simply predates the discovery of the working mirror instance.

**Consequence: the Sec+ evidence base is thin for a reason that no longer applies.** Sec+ is graded on **2 blog sittings** with an explicit, repeated caveat that its sample is blog-only and biased — and `01-…` §7's "Recommended next step" asks for *"someone with a normal browser session"* to pull 20–30 r/CompTIA threads. **The Core 2 pass demonstrably had exactly that, and used it.**

🔴 **Recommendation — highest-value next action in the entire pass, ahead of ranking: re-run the Sec+ evidence pass through `redlib.privacyredirect.com` in the browser pane, mirroring the Core 2 method.** Rationale:

1. It is the **only** action available that can move Sec+ grades **off C** on genuine evidence rather than argument. Every other lever is analysis of a corpus that is already exhausted.
2. It directly tests the pass's loudest open question — the **firewall rule-ordering claim** (`01-…` §5), where the industry is near-certain, firsthand support is zero, and the strongest supporting quote was fabricated. r/CompTIA is where that gets settled either way.
3. It would test whether `certchain`, `iam`, and `vulnq` are genuinely unreported or merely **unreported-in-blogs** — three of five Sec+ survivors are betting on unreported surface, and the corpus that would show them was never searched.
4. It is **hours, not days**, and the method is already written down and proven in `03-…`.

Until that is done, **the "Sec+ sample is biased" caveat should be read as a fixable defect, not a standing limitation** — and the ranking stage should know that Sec+ grades may move materially and cheaply.

---

## 6. Summary of required actions

**Blocking before any build spec:**
1. **Consolidate Sec+ C3 and Core 2 S-7 into one `certchain` archetype** with cert/difficulty seed axes (§3.1). They currently collide on reference-kind *and* validator name.
2. **Replace C4's blast-radius invariant** with the collateral-damage end-state predicate (§3.3). As written it is path-scored and requires an authored magic number that smuggles the key back in.
3. **Pin S-4's ACL precedence rule** — Option A (same-level ACEs only) or Option B (full explicit-before-inherited precedence) (§3.6). "Explicit deny wins" plus inherited-deny seeds computes wrong answers confidently.
4. **Fix C2's collapsed evidence-summary icons** to be semantically inert (§3.5). As specified they pre-compute the cross-source join, which is C2's entire gate-1 case.

**Gate reconciliation (the frozen gate is shared; its interpretation currently is not):**
5. **Gate 4** — reconcile to written text; Sec+'s reading is correct; **re-run C-16 and C-17** (§4.4).
6. **Gate 2** — amend to *"no new interaction **and** no new scoring model"*; re-state C8's rejection on honest grounds (§4.3).
7. **Gate 6** — amend C-09's record to cite item 1 as primary; the item-6 argument as written would kill `vulnq` and `disklayout` (§4.2).

**Evidence:**
8. 🔴 **Re-run the Sec+ evidence pass via the Redlib browser route that worked for Core 2** (§5.3) — highest value, hours of work, the only path off C for Sec+.
9. **Recount Core 2 Format C3** to 1 description + 1 keyword; downgrade to Low-medium; **S-2 becomes C** (§5.2).
10. **Record Medeiros' sitting date as inferred from post date**, not as a datum (§5.1).

**For the ranking stage:**
11. **Rank the C6 → `diagram` and C14 → `triage` seed extensions *against* the archetype survivors, not as footnotes** (§4.1). They are the only evidenced, already-built-archetype wins in the Sec+ pass. Same for Core 2's C-03 → `cli`.
12. **Rank `vulnq` last** and treat it as first-cut on scope pressure (§3.4) — thinnest evidence in either cert *and* contested gate-2 status.
13. **Note that S-1 and S-2 share one sitting** (§5.2) — Core 2's evidenced tier is one person, not two.
14. **Monitor:** SY0-801/V8 draft objectives (~Oct 2026 preview, CLAIM) — every Sec+ mapping is pinned to Objectives v5.0. Windows 10 scope tension for S-3 (§3.7) — in scope per v3.0's 1.3, but S-3's bank is built on the Win10/Win11 divergence.

---

## Related
[[00-inventory-and-exclusions]] · [[01-secplus-evidence-sittings]] · [[02-secplus-objectives-ecosystem]] · [[03-core2-evidence-sittings]] · [[04-core2-objectives-ecosystem]] · [[05-core2-candidates-gated]] · [[06-secplus-candidates-gated]]
