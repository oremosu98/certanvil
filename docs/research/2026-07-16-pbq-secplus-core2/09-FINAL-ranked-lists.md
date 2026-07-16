# Checkpoint 9 — FINAL ranked lists (Sec+ SY0-701 · A+ Core 2 220-1202)

**Date:** 2026-07-16 · **Stage:** rank (final stage of the `00-…` pipeline) · **Scope:** RESEARCH ONLY — no build plan, no mockups, no seed authoring. This document stops at the lists.
**Inputs read in full:** `00`, `01` (superseded — caveats only), `02`, `03`, `04`, `05`, `06`, `07`, `08` (**authoritative Sec+ evidence**).
**Supersession:** `08-secplus-evidence-redlib-rerun.md` supersedes `01-secplus-evidence-sittings.md` for all Sec+ evidence grading. `01` is retained only for its epistemic caveats and its record of the fabricated-quote exclusion.

---

## ⟡ ADDENDUM (2026-07-16, post-publication) — Core 2 deep re-run

`10-core2-evidence-redlib-deep-rerun.md` applied `08`'s high-yield method to Core 2 — the action §9.4 named as **the highest-value lever available**. It has now been pulled in full. **The archetype lists below do not change. Three things do:**

1. **§9.4 item 1 is CLOSED.** 10 search passes, ~110 titles triaged (~55 unique), bulk `javascript_tool` body extraction. Result: **2 → 3 independent format-reporting sittings.** Core 2 is **still thin, and that is now a tested finding rather than an untested assumption** — a real epistemic upgrade even though the count barely moved. The cause is structural, not a search failure: fewer than 5 of ~55 unique posts describe any PBQ exhibit at all; r/CompTIA's Core 2 culture is *"I passed 🎉"* plus a resource list, and posters self-censor over NDA fear. **The well is genuinely shallow. Do not re-run this a third time expecting a different answer.**

2. **SE-2 (Core 2 CLI seed set) upgrades C → B.** The `help`-enumerating terminal PBQ went **1 → 2 independent sittings** (new: u/Mental_Tea_4084, 2026-03-12, read verbatim off the page — *"my pbq let me type help to get a list of available commands"*). Plus a **design detail** from r/CompTIA mod / IT instructor u/drushtx (**instructor testimony, NOT counted as a sitting**): the sandbox exposes a **fixed ~4-command set**, and `help <command>` does **not** work. **This makes SE-2 the best-evidenced 220-1202 PBQ format, at seed cost, on a shipped renderer — the single cheapest evidenced win in the Core 2 pass.**

3. **Claim 8's absence is CONFIRMED** (+1 corroboration, u/Loose_Client5116: sequencing appears as *"dry questions, ie 'what do you do NEXT'"*). **Malware-removal ordering is MCQ, not a PBQ.** §6's C-06 rejection is reinforced. §5.5 sizing: range 4–7 holds across ~10 sittings, but **the mode is now a 4/5 tie, not a clean 5**; ~75–77 questions.

> 🔴 **CORRECTION APPLIED — `10` §8's verdict is WRONG on one point and is overruled here.** It states the terminal PBQ *"should be ranked first and built first"* on the Core 2 list. **It cannot rank on the archetype list at all.** The terminal PBQ is **C-03, rejected at gate 1 as a `cli` reskin** (§6) — and §9.5 records that surviving that exact temptation is the pass's load-bearing hygiene: *"The single best-evidenced Core 2 format (C-03) died on gate 1. Neither pass flinched."* **More evidence does not buy distinctness.** The correct disposition is unchanged and is now *stronger*: **§7 SE-2, a seed extension on the shipped `cli` renderer.** `10`'s own §3 routes it correctly; only its §8 verdict conflates *"best-evidenced format"* with *"archetype rank."* **The Core 2 five below stand exactly as ranked, all still C.**

**Net effect on the deliverable:** §3's Core 2 five — unchanged. §7's seed-extension list — **SE-2 upgrades to B and is now the strongest-evidenced row in it.** §9.2's "Core 2 is thin" — **confirmed by test.** §9.4 item 1 — **spent; delete from the future-actions list.** The finding it reinforces is §7.1's: *the best-evidenced Core 2 format is, once again, something already built.*

**One unresolved contradiction worth carrying to any build spec:** u/shaggs31 reports commands via **dropdown select, not typing** — contradicting the interaction shape. No exam code stated, so **not counted** — but 220-1202 may ship both variants, and a seed set that assumes typing-only may be modelling half the surface. *(Also excluded, and worth noting as a caught false positive: u/redgroupclan's vivid "glitched PBQ, commands couldn't change anything" is **Network+**, not Core 2 — it would have looked exactly like terminal corroboration.)*

---

## ⟡ ADDENDUM 2 (2026-07-16) — Sec+ deep re-run: the corpus is now exhausted

`11-secplus-evidence-deep-rerun.md` closed the coverage inversion (Core 2 had been searched ~3.7x deeper than Sec+ — the weaker cert with the better search). **~177 titles triaged across 11 searches — the deepest pass in the project** (vs `08`'s ~30 and `10`'s ~110). **The ranked lists below DO NOT change. No grade moves.**

**Sittings 9 → 11 (+2).** VPN 5→6 · multi-host logs 5→6 · firewall 2→3. Cluster order unchanged.

**GAP 2 — HALF-CLOSED, and the important half.** The #1 archetype's sub-shape no longer rests on a discarded source: **u/Ok-Surprise4606** (2024-06, 701-explicit title, firsthand) — *"setting 2 site to site VPNs and choosing the strongest encryption."* **First non-blog firsthand source for site-to-site.** The superseded Medeiros blog is **no longer load-bearing**, and this retro-validates S1's "two concentrators" independently. **But Phase 1 / Phase 2 remains STILL ZERO** — the only "phase" hit was a poster's study-plan headings. **IKE phases are a design choice, not evidence.** `vpntunnel`'s A/C split stands exactly as written; its design spanning both sub-types on the scenario axis remains the correct structural hedge.

**GAP 1 — STILL ZERO ×3, and now decisively so.** `iam` returned **literally zero body matches across ~50 posts on two dedicated queries** — it is now **the best-hunted zero in the corpus**, and it is the most product-attractive row in either cert. `vulnq` and `certchain` surface only on **prior-gen 601**. All three stay **C**. Three passes of accumulating absence is weak-but-real counter-evidence: **it strengthens the case for cutting `vulnq`, and it means `iam`'s rank is earned purely on opportunity.**

**GAP 3 — survivorship 100% → 91%.** One fail with format detail: **u/JTechguy85** — two of three PBQs were firewall, **and firewall is what filtered him**. The residual bias is now **qualitative, not volumetric**: fails post *feelings*, passes post *guides*. **Not fixable by more searching.**

**GAP 4 — UNRESOLVED, and structurally permanent.** ~15 **2026** sittings found. **Zero describe an interaction.** Several **explicitly cite the NDA** as the reason. **Our 2024 evidence is likely the best that will ever exist** — §9.1's "richest data is oldest" is not a sampling artifact to be fixed, it is a property of the corpus.

> 🔴 **THE FIREWALL DRAG-DROP IS NOW DOUBLY UNFOUNDED — third hunt, still zero.** All **25** Sec+ drag-drop reports date **2018–2023** and are **SY0-401 / 501 / 601** — **none are 701, and none are about firewalls.** The claim fails on *both* axes: wrong exam generation *and* wrong subject. The subnet-drag-drop image traces to **u/ashent2 — a Network+ post.** §9.3's verdict is upgraded from *"treat as prep-vendor lore"* to **established folklore with an identified root.**
>
> ✅ **The pass's one actionable output was a deletion — and it is MOOT, verified against the code.** `11` recommends removing drag-drop from any firewall/subnet seed. **Checked: Sim Lab contains ZERO drag-drop anywhere** — `grep -c 'draggable|dragstart|ondrag'` returns **0** across `sim-lab.js` and all four seed files; the shipped `firewall` archetype uses `type: 'firewall'` rule-table steps, not dragging. **We never built the thing the folklore describes.** The constraint is therefore **forward-looking only: do not author drag-drop into SE-3 or SE-4 Sec+ seeds.** *(Note the scope limit: this finding is about **SY0-701**. Net+ drag-drop evidence is a separate question this research did not examine — the `ashent2` post suggests N10-008 may genuinely have one.)*

**Near-miss worth preserving as a method lesson:** **u/od_mora** (2026) reads as a log+firewall sitting and would have entered as S12 — **the full body reveals it describes the *Dion practice sim*, with *"the questions weren't necessarily like the PBQs I encountered"* one sentence earlier.** Only reading the complete body killed it. This is the third caught false positive in the project (after the fabricated quote and the Network+ terminal post) and they all share one root: **snippets and summaries lie; full rendered bodies don't.**

**Method upgrade for any future pass:** push a **regex filter into the `javascript_tool` call** so one call greps a whole page and returns matching sentences — this makes a **zero-hit result trustworthy rather than a truncation artifact**, which is what licenses the GAP-1 "still zero" above. Also: **redlib multi-term queries are OR-noisy; quoted phrases work** — that is what cracked GAP 2.

> **STOP SIGNAL — both certs are now exhausted.** Sec+ returned **+2 sittings for ~177 titles**; Core 2 returned **+1 for ~110**. **Delete §9.4 items 1–5 from the future-actions list** — the r/CompTIA seam is mined out. What remains is genuinely harder and none of it is searchable here: a **non-r/CompTIA source** (TechExams is behind Cloudflare; Discord; non-English; non-US test centres), or the thing the NDA structurally suppresses — **a report that describes the widget rather than naming the exhibit.** §9.4 item 6 (**SY0-801 / V8 objectives, ~Oct 2026**) survives as the only live trigger, and it invalidates every Sec+ objective mapping when it lands.

---

## 1. Method + calibration statement

### 1.1 What this document does

Applies the domain review's corrections (`07`), re-grades the Sec+ survivors against the 9-sitting Redlib re-run (`08`), reconciles the gate-4 inconsistency the review found, and ranks survivors **on two separate axes that are never combined into one score**.

### 1.2 What this can establish

- That a PBQ format was **reported** by *n* independent people who sat the exam, firsthand, on the current exam code.
- Whether a proposed archetype is technically coherent, objective-aligned, vendor-neutral, distinct from the 14 shipped archetypes, and buildable at 375px.
- Whether the frozen 7-point gate was applied consistently to its own written text.

### 1.3 What this cannot establish — and no downstream analysis will change it

- **That any format is genuinely on the live exam.** CompTIA does not publish PBQ formats, the bank rotates, candidates sit under NDA, and every sighting is one person's recall of a few minutes of a form seen once under stress. "Reported" ≠ "present."
- **Any `examFrequency` number.** No figure of the shape "X% of forms contain this PBQ" appears here or is derivable from here. If one later shows up in a build spec, it was invented downstream.
- **A negative.** Absence of evidence is weak evidence of absence, in both corpora.
- **Grades are source-quality grades for the claim "this format appears on this exam."** They are not probabilities. `C` means *the evidence is thin*, not *the format is absent*.

**Rubric (verbatim from the brief):** `A` = multiple independent firsthand current-code sittings + corroborating detail · `B` = 2+ independent firsthand current-code sittings · `C` = 0–1 sittings, or secondhand, or objective/plausibility inference.

**Standing rule applied throughout:** domain weight is **not** used as a proxy for PBQ frequency. Domain 4.0 being 28% of Sec+ says nothing about how often a Domain 4 PBQ appears. Objective verb level is a *priority* signal only (see §3).

### 1.4 The standalone-pass design and what it missed

`00-…` froze the pipeline as **"per cert, standalone — no cross-cert merge."** That is correct for **evidence** (the two exams are unrelated; a Core 2 sitting says nothing about Sec+) and demonstrably **wrong for gate interpretation and for archetype identity**. Two consequences, both caught only at review:

1. **Duplicate archetype.** Sec+ C3 and Core 2 S-7 were minted independently with the **same reference-kind name (`certchain`), the same validator name (`simLabValidateCertChainFidelity`), 4 of 6 shared fault classes, and the same read→diagnose→remediate chain.** Gate 1 measures against the 14 *shipped* archetypes, not against a sibling pipeline's live candidates, so neither gate could catch it. §4 merges them.
2. **Gate divergence.** Two competent passes read the same frozen gate on the same day and applied gate 4 in **opposite directions** (§4). Gate 2 was also applied to two different standards (C8 vs C5).

**Correction adopted for any future pass: gate interpretation is pinned once and shared; only evidence stays standalone.**

### 1.5 Residual bias declared by `08` (governs every Sec+ grade below)

The Sec+ sample went from 2 blog sittings to **9 firsthand r/CompTIA sittings** — a real and large improvement. It is still not clean, and `08` §7 says so plainly. Carried forward verbatim in force:

1. **Survivorship bias, total.** All 9 sittings are **passes**. Nobody who failed wrote a format-rich retro. Formats that filter people out are systematically under-described.
2. **Self-censorship at exactly the layer we need.** Posters name the exhibit and refuse to describe the widget ("while I won't go into details"; "hopefully me saying that isn't against any rules"). NDA caution truncates description **precisely at the interaction layer**. This is *why* the drag-drop claims stay unresolved, and the gap is structural — it will probably not close through Reddit.
3. **Exhibit named, interaction not.** Even the best source (S1) says "12 fields, fill from given options" — a form, but dropdowns? drag targets? free text? Unknown. **Any product decision resting on interaction shape is still under-evidenced.**
4. **Region unknown for 8 of 9.** r/CompTIA skews US/DoD (Sec+ demand is DoD 8570-driven). If forms vary by region we would not see it.
5. **Date skew — the biggest remaining weakness.** 5 of 9 sittings are 2024; only 2 are 2026. The two most recent 701 reports (S7, S9) are the **thinnest** on format. **Our richest data is our oldest data.**
6. **Single-community sample.** All 9 from r/CompTIA. Same forum norms, same NDA culture, same demographics.
7. **One source carries most of the specificity.** S1 (`FitFun8149`) alone supplies most of the Clean/Infected/Source detail **and** most of the VPN-form detail. If S1 is wrong or embellished, two "confirmed" claims lose their best support and fall back to thinner corroboration.

**Net:** grades of `A` below mean *"well-attested as a reported exhibit type."* They do **not** mean the interaction shape is known. Where the exhibit is A and the mechanic is C, both letters are shown on the row.

---

## 2. Security+ SY0-701 — ranked top five

**Objectives doc of record: SY0-701 Exam Objectives Version 5.0 (© 2023 CompTIA).** Re-check at the SY0-801/V8 drop (~Oct 2026 preview, CLAIM).

**Axes are separate and are never summed.** Left axis = evidence confidence. Right axis = product opportunity. A row can be C/high (a good bet on unreported surface) or A/medium (a well-attested thing that is expensive to build). Read them as a 2-D position, not a score.

| Rank | Archetype | **Evidence confidence** | **Product opportunity** |
|---|---|---|---|
| **1** | **`vpntunnel` — VPN Tunnel Parameter Negotiation** | **A** — *"a VPN concentrator configuration form appears on 701"*: **5 independent firsthand sittings** (S1, S2, S3, S4, S5) + corroborating detail (S1: **two** concentrators, ~12 fields each, values chosen **from supplied option sets**; S2 names it **IPSec**). Clears the A bar as written. · **C** — *dual-endpoint / Phase 1 / Phase 2 / site-to-site sub-shape*: **0 sittings in the re-run.** `08` is explicit: **no source used "Phase 1", "Phase 2", or "site-to-site."** S1's "two concentrators, ~12 fields" is *consistent with* a Phase1/Phase2 split — that is an inference, not testimony. The Phase detail is a **1-sitting claim from the superseded blog pass (Medeiros)** and must not be presented as corroborated. | **Highest.** The soundest design in either document (`07` §3.8): symmetry, mirror-inversion, and set-membership-against-policy-floor are three independent, computable predicates over an enumerable option space — **zero soundness defects, the only survivor with none.** Vendor-neutral by construction (IPSec/IKE is an open standard, not a vendor console). **Best mobile fidelity in the set** — it is a form, and forms are the one thing phones do well; the persistent **mirror chip strip** is the best single UX idea in the pass and should be borrowed by `fleetlog`. Seed bank **20–30**. Renderer leverage: new `configpanel` kind + `simLabValidateTunnelFidelity`; reuses `configure` step machinery and `network` as a read-only brief exhibit. **Differentiation:** no surveyed competitor documents partial credit or a mobile PBQ; per-predicate partial credit on a phone-native form is a shippable wedge. **Design already spans both sub-types on the scenario axis, so it does not depend on the C-grade sub-shape** — this is why an A/C split ranks #1 rather than being blocked. |
| **2** | **`fleetlog` — Fleet Infection Attribution** | **A** — *"multi-host log analysis → classify each host"*: **5 independent firsthand sittings** (S1, S2, S3, S4, S6) + corroborating detail. S1 is near-verbatim to the archetype: **network diagram + per-user log viewer, ~12–15 log lines × 6 users, label each Clean / Infected / Originated.** · **B** — *binary infected-vs-clean classification against logs*: **3 sittings** (S1, S2, S3). · **C** — *the three-way label including a **Source/Originated** state*: **1 sitting (S1 only).** S2 is "infected vs clean"; S3 is "identify infected systems." · **C** — *the cross-source join mechanic* (per-host local log × central flow log), which is **what the archetype actually scores**: S1 (diagram + per-host viewer) and S2 (firewall logs + diagram) are consistent with it; neither describes the join. **Note the shape also appears in SY0-601 reports (`Jonny_Boy_808`) — long-lived CompTIA pattern, which is an argument for persistence, not evidence of it.** | **High, conditional.** Best-evidenced *task* in either cert. **Renderer leverage is the strongest in the pass:** the host-roster-with-per-host-drawer core is shared with Core 2 `endpoints` (§5.2) — **one roster kind, two archetypes, two certs.** Seed bank **20–30**. Reuses `categorize` label controls + `timeline` axis rendering. **Blocked on a precondition, not a preference:** the collapsed **3-icon evidence summary leaks the answer** — inbound/outbound/none *is a direct rendering of the scoring invariant*, so a learner can label the fleet without opening a drawer. With the icons as specified, `fleetlog` **fails gate 1 against `triage`**, because its entire distinctness case is the cross-source join and the icons pre-compute it (§8.4). Also needs `vpntunnel`'s pinned context strip or the 375px version is *usable but harder*. **Ranked #2 not #1 because its defect is load-bearing and `vpntunnel`'s is absent.** |
| **3** | **`certchain` — Certificate Chain Diagnostics** *(MERGED archetype — Sec+ C3 + Core 2 S-7; see §5.1. Ranked once, here, not twice.)* | **C** — **0 firsthand sittings, on both certs, and now after a deliberate hunt.** `08`'s re-run explicitly searched `Sec+ PBQ certificate OR terminal OR subnet`; it surfaced the terminal PBQ (S7) and **no certificate PBQ**. This is *worse* than `01`'s zero: it is now **searched-and-absent**, not merely unsearched. Core 2 side is likewise 0 (`03` §5). It is on `01`'s explicit *"format claims with ZERO firsthand sitting support (found only in prep/SEO content)"* list. | **High — and the highest build-efficiency in the pass.** **One renderer + one validator serves two certs**, with cert and difficulty as seed axes: Core 2 = 1 planted cause, closed remediation set, **clock exhibit present**, browser-warning framing; Sec+ = 1–2 faults, remediation-class equivalence, false-positive penalty, API/mTLS framing. The **Sec+ scoring model is a strict superset of Core 2's**, so one validator with `faultCount: 1` and exact-match remediation reproduces S-7 exactly. Combined seed bank **~40–50** (25–35 Sec+ + 14–18 Core 2). Sound design on both sides; the equivalence model (missing-intermediate accepts *"install the intermediate"* **and** *"send the full chain"*, not *"reissue the leaf"*) is well-formed and real-world correct. Vendor-neutral by construction. **Best mobile case in the set** — vertical chains are the phone's natural axis. Core 2's **clock readout as the discriminator between drift and expiry** is elegant exhibit design and the one thing S-7 has that C3 lacked; it survives the merge as a Core 2 seed axis. **A C-grade with this much leverage is the clearest evidence/opportunity divergence in the document — which is exactly why the two axes are not summed.** |
| **4** | **`iam` — IAM Entitlement Review** | **C** — **0 sittings, across both passes.** Adjacent-only: S3 names **RADIUS auth** inside a PBQ — that is AAA, not entitlement review, and does not lend `iam` support. The only other "support" is Dion's PBQ pack **claiming** "access control" coverage — a **vendor CLAIM**, and `01` §3 collapses all 16+ prep-vendor domains to **zero sittings** while flagging circularity. A vendor's product listing cannot corroborate a format; it is marketing for a simulation of the thing in question. **`iam` is the most product-attractive candidate in either cert. It is still C. Recording that explicitly because this is the exact row where inflation would happen.** | **High, blocked.** A genuinely new interaction (effective-permission derivation over an inheritance graph), a real teaching point (*revoking at the user level is visibly insufficient*), a defensible mobile pivot (subject-first list, no 375px matrix), seed bank **25–35**, objective **4.6** is a ▶ stem. Shares a derivation engine with Core 2 `acl` (§5.3). **Two blocking preconditions (§8.2, §8.6):** the fourth invariant is **broken** — "blast radius = `changeCount ≤ maxChanges`" is a metric over the *edit path*, not a predicate over the *end state*, so two learners reaching the **same** end state score differently, which breaks the archetype's own headline promise; and it requires an authored magic number that smuggles the answer key back in — the exact failure that killed C13. **Must be replaced with the collateral-damage predicate before any build.** Also: the vendor-neutrality drift will not arrive as a logo, it will arrive as **vocabulary** — the moment a seed says "policy attached to a role" or "permission boundary," Sec+ neutrality is gone. |
| **5** | **`vulnq` — Vulnerability Remediation Queue** *(RANK LAST — first cut on scope pressure)* | **C — the thinnest evidence base in either cert, now across two passes.** **0 sittings.** It is not even on `01`'s zero-support list: it **did not surface in the corpus at all**, from sittings *or* vendors, and the 9-sitting re-run did not surface it either. Purely blueprint-derived (obj 4.3 / 5.2). | **Lowest of the five, and contested.** It is **`categorize` + `order` in a costume** (`07` §3.4). The disposition step's *"genuinely new interaction"* defense is half-true and the important half is false: assigning findings to one of five closed states against an `acceptableDispositions` set **is the `categorize` primitive** with set-membership scoring — a new scoring *nuance*, not a new *interaction*. What is genuinely novel is the **composition** (the queue's membership is candidate-determined by step 2, so step 3 operates on a set the learner defined) and the **partial-order validator** (`mustPrecede` pairs; every consistent ordering scores full) — its only unambiguous gate-1 novelty. Seed bank **15–25**, the smallest, because the override rules are a small closed set and repetition becomes visible fast. **Note the counterintuitive fix: cutting the ordering step makes it MORE distinct, not less** (§8.5) — the ordering step is the part that looks like `order` because it largely *is* it, and the teaching point (*asset context overriding raw severity*) lives **entirely in the disposition step**. Cutting it leaves a pure context-overrides-severity disposition engine with no surface resembling `order` — but it also forfeits the partial-order validator, so gate 1 must be re-argued from the composition alone. **Thinnest evidence AND weakest distinctness is a multiplying pair, not an averaging one.** |

### 2.1 Sec+ diversity check

Five archetypes, five distinct exhibit/interaction families: **constrained config form** (`vpntunnel`) · **multi-source log roster** (`fleetlog`) · **linked-chain artifact inspection** (`certchain`) · **permission-grid derivation** (`iam`) · **finding cards + disposition** (`vulnq`). No collapse. Nothing was dropped from Sec+ for diversity — the gate produced exactly five survivors and they were already diverse.

**But note the near-miss:** `iam` (permissions grid) and Core 2 `acl` (permissions tables) are the closest thing to a portfolio look-alike across the two lists. They survive as separate archetypes because the **scored direction genuinely differs** — `iam` **authors** toward invariants (many valid end-states), `acl` **computes** a single-valued result. That is a real distinction and it is endorsed. **See §8.6 for the algebra contradiction between them, which is a live defect now that both are ranked.**

**If scope tightens to four:** cut `vulnq`. The slot does not need an archetype replacement — §7's seed extensions are better value per unit of build.

---

## 3. A+ Core 2 220-1202 — ranked top five

**Objectives doc of record: CompTIA A+ Core 2 (220-1202) V15 — Exam Objectives Document Version 3.0 (© 2024 CompTIA).** 4 domains, 36 objectives, 23 "Given a scenario".

**Pool: S-1…S-6 only.** S-7 has been **merged into the cross-cert `certchain` archetype** and is ranked **once, at Sec+ #3** (§5.1). It is deliberately **not** re-ranked here — treating it as two builds would double-count one renderer against two lists and inflate both.

**Same two axes, same rule: never summed.**

> 🔴 **Read the whole list against this fact, which neither `03` nor `05` states plainly: Core 2's two evidenced survivors — S-1 and S-2, ranked #2 and #1 below — trace to ONE person's single sitting** (u/FRESH__LUMPIA, ~2026-07-12, who described both formats). **They are not independent of each other. Both are C. They are not double-counted.** `05` §4 presents them as separate rows with separate linkage — accurate per-row, misleading in aggregate. **The honest summary of the Core 2 format corpus: 3 named formats, ~2 sittings, one of which supplies two of the three.** Full audit in §9.2.

| Rank | Archetype | **Evidence confidence** | **Product opportunity** |
|---|---|---|---|
| **1** | **`endpoints` — Quarantine & Services Console** | **C — 1 firsthand sitting** (u/FRESH__LUMPIA, ~2026-07-12, 220-1202, pass): *"quarantine the correct computer and enable or disable specific services on individual workstations"* — the task chain maps to this **near-verbatim**. **Downgraded from `05`'s claimed 2 sittings and from `03`'s "Medium-high".** The claimed second sitting (u/armbarassassin84, 2025-10-19, fail) contributes **one shared keyword** — *"The 4th one really tripped me up (quarantine for audio issues)"* — **not an independent description**: no roster, no service toggles, no per-host console, no isolation mechanic. **And the pairing is semantically odd** — quarantine is a malware-containment action under 2.6; in an **audio** troubleshooting scenario it may mean the poster misremembered, or it was a distractor, or it was the *wrong* answer that tripped him up. **None of those establishes a quarantine-plus-services console.** Recount: **1 full description + 1 keyword corroboration. Low-medium. Core 2 has no B and never did.** | **Highest in the Core 2 set.** **The only Core 2 survivor with a full firsthand format description.** **Objectives are the tightest pairing in either cert: 2.6 lists *quarantine* literally; 2.7 lists *disable unused services* literally** — both ▶ stems. **Technically sound with no blocking defect** (the only Core 2 row that can say that): the tri-state service matrix with **enumerated `don't-care` cells** is **total** scoring with no undefined cells, so **gate 6 needs no equivalence model at all**; asymmetric penalty (false-negative fatal, false-positive partial) is well-judged; **the Win10-Home pinning for the System-Restore-disable step is a precise catch — that step *is* Home-specific in 2.6.** **Shares the roster widget core with Sec+ `fleetlog`** (§5.2) — one roster kind, two archetypes, two certs, both #1–#2 on their list. Seed bank **18–25**. Genuinely mobile-native (host tiles + one host's service list at a time = the iOS Settings pattern, designed as a list-per-host from the start rather than a table with `overflow-x`). |
| **2** | **`queue` — Ticket-Queue Triage Console** | **C — 1 firsthand sitting, AND IT IS THE SAME SITTING AS #1.** u/FRESH__LUMPIA, ~2026-07-12: *"a mock ticketing system where I had to prioritize customer requests and choose the appropriate solutions."* The report names two of the archetype's four steps almost verbatim (**prioritize**, **choose solutions**) — good **fit**, but fit is not a second sitting. **One sitting = C by rubric, no argument available.** **Do not read #1 and #2 as two evidentiary bases. There is one.** | **High.** **Sound, with no blocking defect.** 4.1 fits cleanly (ticketing, documentation); 4.7 as secondary via requester-tone cues is legitimately in the objective. **Band-partition scoring with band-distance penalty is a correctly-specified equivalence model** — tickets within a band are interchangeable, so the scorer compares *partitions*, not permutations, and P1→P2 is a near-miss while P1→P4 is a full miss. Gate 6 holds cleanly. **The most honest mobile plan in either document** — ticket cards genuinely **are** the native phone pattern, not a rescued table; per-card P1–P4 segmented chips at ~44px, never drag-into-columns, no horizontal scroll anywhere. Seed bank **20–30** (severity mix, scope, decoys — loud-but-trivial VIP vs quiet-but-critical infrastructure — SLA pressure, channel). Renderer: new `queue` kind + validator; reuses card/chip CSS and `analyze`/`fillin` machinery; **its card CSS then feeds the merged `certchain`.** Minor: OS pinning is cosmetic here (the archetype is OS-agnostic by nature) — fine, and honestly labelled as such. |
| **3** | **`settingstree` — Windows Settings Path Locator** | **C — 0 sittings.** Pure objective inference (1.6). **A bet on unreported surface, and labelled as one.** Adjacent **topic-only** signals (claim type b, **not** format evidence): u/visualsarcasm (2026-07-05) and u/Jayy-Kayy (2026-04-08) both name **Windows commands/tools** as pain points. **No firsthand 1202 report describes a settings-navigation PBQ.** | **High — the largest seed bank in either cert.** **30–40+ scenarios**: 1.6 spans display, network, accounts, updates, power, storage, apps, privacy, devices, time/language, **and two OS versions multiply it.** **Genuinely new interaction** — navigation-with-history; **no existing reference kind is navigable** (all nine are flat single-screen exhibits). **Zero mobile compromises at 375px** — a drill-down list *is* the canonical mobile navigation pattern; **the best-suited exhibit in the entire candidate set for a phone.** **OS pinning is exemplary** — per-seed Win10-or-Win11, correctly grounded in the objectives PDF's verbatim "NOTE ON WINDOWS 11" plus 1.3's explicit enumeration of both editions; *"the pinning is the pedagogy, not an afterthought"* is exactly right. **One unresolved design decision, not a defect (§8.7):** the **scored act is not the novel interaction** — scoring accepts any path whose terminal is in `acceptedTerminals`, efficiency is feedback-only, so **the path is unscored and a search box would score identically.** Decide whether efficiency scores or say honestly that this measures **destination knowledge**. **Monitor:** its bank is built on Win10-vs-Win11 divergence, making it **the archetype most exposed to a future objectives revision dropping Win10** (§9.4). |
| **4** | **`disklayout` — Disk & OS Deployment Planner** | **C — 0 sittings.** Pure objective inference (1.2). **No firsthand format report, and no adjacent topic signal in the corpus at all.** A bet on unreported surface. | **High.** **The tightest objective mapping in the Core 2 set** — 1.2 (▶) *"perform OS installations and upgrades in a diverse environment"*: **boot methods, GPT/MBR partitioning, and upgrade considerations are the objective's literal content.** **A genuinely novel interaction:** proportional spatial allocation on a continuous bar — **the first archetype in the inventory where the answer is a set of *sizes on a shared budget* rather than a set of picks.** `raid` is the near miss and was checked properly: it never lays out space *within* a disk, has no GPT/MBR/firmware axis, no upgrade-path decision. **Range-band scoring is the right model and the quoted bands are correct** (EFI 100–500 MB, recovery ≥ 650 MB, GPT forced > 2 TB, Win11's UEFI+GPT+TPM+Secure Boot floor) — **every tolerance is an authored band, no free-floating "close enough".** Seed bank **20–28**. Mobile is honest: the bar **rotates vertical**, sizes set via **stepper/numeric input — the 4px drag handle does not ship to mobile at all.** **Two authoring guards required before build (§8.7):** MBR's 2 TB ceiling and 4-primary limit must be **validator invariants, not seed prose** (or a learner can build a layout that sums correctly and is physically impossible), and **ReFS must be excluded as a boot/OS volume** or the archetype teaches a falsehood. |
| **5** | **`acl` — NTFS/Share Effective-Access Workbench** | **C — 0 sittings, and the weakest-founded of the unevidenced Core 2 set.** `03` §5 states plainly: **no permissions-table PBQ has been described firsthand for 1202.** The corpus's **only** permissions-PBQ claim is the @arminarleet149 Medium post — **correctly excluded as dump-vendor-promotional and possibly fabricated**, and it must not be leaned on. The adjacent Klutzy-Astronaut-280 mention of *"permissions"* is **Linux** — a different OS and, per 1.9's *Identify* verb, the lightest-weight corner of the blueprint. **It lends `acl` nothing.** | **Moderate-to-high, blocked.** **The scoping decision is correct and it is the sharpest gate-6 reasoning in either document:** compute-not-author is exactly right — authoring an ACL toward a goal is many-to-one and would have failed gate 6; **computing effective access is single-valued and total.** *(This is the model `iam`'s broken blast-radius invariant should have followed — §8.2.)* **No existing archetype has a compute-the-answer-from-rules step** (the closest anywhere is `raid`'s capacity math, which is arithmetic over disks, not precedence over ACEs). **Shares the derivation engine with Sec+ `iam`** (§5.3). Seed bank **18–24** — **but see the precondition, which may shrink it.** **Two blocking preconditions (§8.3, §8.6):** 🔴 **the stated precedence rule is the FOLK rule and it is wrong** — real NTFS is *explicit before inherited, then deny before allow within the same level*, so **an explicit allow BEATS an inherited deny**; S-4's own seed axes (*"inheritance-blocked folders"*, *"deny placement"*) **guarantee seeds that trigger it**, and the validator will **compute wrong answers confidently and invisibly** because it is single-valued. 🔴 **And its deny-wins algebra contradicts `iam`'s purely-additive one — both are now ranked, so this is a live defect, not a note.** Mobile is the item-5 risk in the Core 2 set and the plan is specific and conditional: **per-principal cards, not tables; if the card treatment can't be built to a real thumb standard, this archetype does not ship.** |

### 3.1 Core 2 diversity check — and what was dropped for it

**Six survivors, five slots.** Diversity was the deciding criterion, not score.

**The five families kept:** **host roster + toggles** (`endpoints`) · **prose-judgement card queue** (`queue`) · **navigable hierarchy** (`settingstree`) · **proportional spatial allocation** (`disklayout`) · **rules-precedence computation** (`acl`). Five genuinely different exhibits, five different scored acts, five different failure modes. No collapse into variants of logs/tables/permissions-grids/config-forms.

> ⛔ **DROPPED FOR DIVERSITY: S-5 `rfc` — Change-Advisory RFC Board.** **It passed all 7 gate items. It is not a gate rejection.** Four reasons, and the first is the diversity one:
>
> 1. **It is the second prose-judgement archetype alongside `queue`** — both are *read human-authored prose → classify into bands → complete required fields*, both are form-and-cards on mobile, both score a judgement about process rather than a technical derivation. **`queue` is evidenced (1 sitting) and `rfc` is not (0).** Given a choice between two look-alikes, keep the evidenced one. **This is exactly the collapse the diversity check exists to prevent** — and it is worth being explicit that `rfc` scored *respectably* and was cut anyway, because a diverse five beats five high-scoring look-alikes.
> 2. **Zero sittings, and no adjacent topic signal whatsoever** in the corpus.
> 3. **Thinnest seed bank in the set (14–20)** — past the one-off bar, but the floor.
> 4. **Two unfixed defects (§8.7):** 🟠 **framework-lock** — the *standard / normal / emergency* trichotomy is **ITIL vocabulary that obj 4.2 does not list**; scoring against a named external framework's taxonomy marks learners against a body of knowledge **the objective did not grant** (the A+ analogue of vendor-lock). 🟠 **the internal-consistency credit is gameable** — classify everything *standard* (smallest required-field set) and harvest maximum consistency credit for minimum work.
>
> **Objective 4.2 is not orphaned by the cut** — but note honestly that it is now **uncovered** at the archetype level. That is an acceptable cost: 4.2 is well-served by standard question-bank content, and **no evidence suggests a change-management PBQ exists on 1202.**

**Cross-list diversity note:** `acl` (Core 2 #5) and `iam` (Sec+ #4) are the closest look-alike pair **across** the two lists. They survive as separate archetypes because the **scored direction genuinely differs** (compute a single value vs author toward invariants) — a real distinction, endorsed by the review. **But they must share a derivation engine (§5.3) and they currently contradict each other on algebra (§8.6).**

**If scope tightens to four:** cut `acl` — it is the only ranked Core 2 row whose **correctness is presently wrong** (§8.3), it has the weakest evidentiary founding of the unevidenced set, and its precondition may shrink its own bank. **Do not cut `settingstree` or `disklayout` for it** — they are the two largest banks and the two most distinct interactions.

---

## 4. Gate-4 reconciliation — ONE standard, applied to BOTH certs

### 4.1 The inconsistency

Gate 4, verbatim from `00-…` §3:

> *4. Maps to a current final official objective (SY0-701 / 220-1202), objective-doc version recorded.*

The text requires **mapping to a current final objective**. It says **nothing about the objective's verb.**

- **Sec+ applied it as written, and said so explicitly.** `06` §2.3 on C3 (→ obj **1.4**, an *Explain* objective): *"1.4 is a current final objective and satisfies gate 4 as written… It is **not** a ▶ 'Given a scenario' stem — that is an **evidence/priority** signal, graded later, **not a gate failure**."* Same reasoning applied to C5 (→ 4.3, *Explain*). **Both survived.**
- **Core 2 applied a stricter, unwritten rule and killed two candidates with it.** `05` rejects **C-16** (Scripting Workbench → **4.8** *"Explain the basics of scripting"*) and **C-17** (AI Use-Policy Adjudicator → **4.10** *"Explain basic concepts related to artificial intelligence"*) on item 4, reasoning that an archetype *"cannot map to an Explain-verb objective without inventing exam scope CompTIA didn't grant."*

Same gate, same wording, opposite application. Two of Core 2's thirteen rejections rest entirely on a reading Sec+ explicitly rejected **in writing, on the same day**.

### 4.2 The standard adopted — stated explicitly

> **GATE 4 STANDARD (pinned, applies to both certs and all future passes):**
> A candidate satisfies gate 4 if and only if it **maps to a current final official objective in the objectives document of record, with that document's version string recorded.** The objective's **verb level is irrelevant to gate 4.**
>
> **Verb level is a RANKING signal, not a gate.** "Given a scenario" (▶) stems are the strongest available PBQ-alignment signal — CompTIA's own marker that the objective is assessed at the apply/do level, which is the natural PBQ feedstock. Explain / Identify / Compare-and-contrast / Summarize objectives are **weaker** PBQ-alignment signals and carry a **ranking deprioritization**. They are not gate failures.
>
> **Rationale:** the frozen gate is meant to be mechanical, not interpretive. Sec+'s reading follows the gate's actual text. Core 2's concern is real and worth preserving — *"this archetype over-claims a knowledge-level objective"* is a strong deprioritization — but it belongs at **ranking**, not at a reject-outright gate. A reject-outright gate must not depend on an unwritten rule.

### 4.3 Dispositions that change under the pinned standard

| Candidate | Old disposition | New disposition | Effect on the lists |
|---|---|---|---|
| **Core 2 C-17** — AI Use-Policy Adjudicator (obj 4.10, *Explain*, new in V15) | REJECTED — gate 4 | **REJECTED — gate 2** (ground corrected, outcome unchanged) | None. Re-run through the full gate: adjudicating uses as appropriate/inappropriate is `categorize`/`match` over a static list with **no distinctive exhibit** — the same shape as C-19/C-20. It falls anyway, on an argument rather than an unwritten rule. The firsthand report of *"a few AI-related questions"* (Klutzy-Astronaut-280, 2026-05-29) is **topic evidence, claim type b**, and never rescued it. |
| **Core 2 C-16** — Scripting Workbench (obj 4.8, *Explain*) | REJECTED — gate 4 | **REJECTED — gate 6 (predict/repair fork) or gate 1 (constrained fork)** — ground corrected, outcome unchanged, **but it now has the analysis it never got** | None. C-16 was killed purely on the verb, with **no buildability or distinctness analysis at all**. Re-run properly, it forks and both forks die: (a) **predict-the-output** workbench → **gate 1**, this is `cli` (Net+, 12 seeds, `terminal` kind, `simLabValidateCliFaultFidelity`) with a script instead of a command; (b) **repair-the-broken-script** workbench → **gate 6**, the valid-edit space is **open and continuous** in exactly the way that killed C13 — many textual repairs work, and closing the space needs either a hard-coded key (forbidden for multi-valid) or a **script interpreter replaying against expected output**, which is a different and much larger product than a PBQ validator; (c) the constrained rescue — *"select the broken line, then pick the fix from a set"* — collapses to `triage` + `match` and fails **gate 2**. It fails on an argument now, which is what it was owed. **Additionally deprioritized on the pinned standard: 4.8 is Explain-verb, so even a surviving version would rank low.** |
| **Sec+ C3 `certchain`** (obj 1.4, *Explain*) | SURVIVOR | **SURVIVOR — unchanged, confirmed on the pinned standard** | Retained at **#3**, carrying an explicit verb-level ranking deprioritization. Its rank is earned on cross-cert renderer leverage, not on objective alignment. |
| **Sec+ C5 `vulnq`** (obj 4.3, *Explain*; secondary 5.2) | SURVIVOR (marginal) | **SURVIVOR — unchanged, confirmed on the pinned standard** | Retained at **#5**, carrying the verb-level deprioritization **on top of** thinnest-evidence and contested-gate-2 status. Three independent reasons it is last. |

**Net effect of the reconciliation: no candidate's outcome changes; two Core 2 rejections change their stated ground and one (C-16) receives the analysis it was denied.** The reconciliation matters anyway — leaving the record as written would have left a rule in force that does not exist, and a future reader would find the contradiction immediately (C5's own §2.5 all but advertises it).

### 4.4 Two further gate amendments adopted from `07`

- **Gate 2 — amend to *"no new interaction **AND** no new scoring model."*** (`07` §4.3.) Gate 2 was applied to two different standards: **C8** was killed for *"no new interaction, no new validator"* while **C5** survived on validator novelty alone — but gate 2's text mentions only interaction, under which **C5 fails** (a new reference kind is an exhibit, not an interaction). The intent throughout both documents is plainly the conjunctive reading; it is consistent with every other decision in the set and is the better rule. **Adopted.** Under it: **C5 survives** (new scoring model) with its marginality **confirmed rather than resolved**, and **C8's rejection is re-stated** on the honest ground — not *"gate 2 forbids it"* but *"no defensible new scoring model was found for it."*
- **Gate 6 — amend C-09's record so item 1 is the primary and stated ground; soften the item-6 argument.** (`07` §4.2.) C-09's rejection is **correct**, but the stated reasoning does not hold: destructiveness over the WinRE rung set (sfc < DISM < startup repair < system restore < reset-keep-files < reset-remove-everything < reimage) is a **small, closed, uncontroversial total order**, and declaring it in a seed is **precisely the move `vulnq` makes with `mustPrecede` pairs and `disklayout` makes with authored range bands** — both of which survived. As written, the item-6 argument would retroactively kill two ranked survivors. The real failure is **item 1**: an escalation ladder is `incident`'s ordering chain with a different noun. Solid, independent, dispositive.

---

## 5. Cross-cert notes

### 5.1 The merged `certchain` archetype — ONE build, not two

Sec+ C3 and Core 2 S-7 are **the same archetype minted twice**, not two archetypes:

| | Sec+ C3 | Core 2 S-7 |
|---|---|---|
| Reference kind | **`certchain`** | **`certchain`** — *identical name* |
| Validator | **`simLabValidateCertChainFidelity`** | **`simLabValidateCertChainFidelity`** — *identical name* |
| Chain | inspect chain → identify fault(s) → select remediation | read warning + chain → diagnose cause → choose remediation |
| Fault set | expired · name mismatch (SAN) · missing intermediate · revoked · untrusted root · wrong key usage | expired · name mismatch · untrusted/missing root · revoked · **clock drift** · **interception proxy** |

Identical kind name, identical validator name, **4 of 6 fault classes shared**, same three-step read-diagnose-remediate chain. **One archetype with two difficulty dials.**

**Resolution:** build **ONE `certchain`**, with **cert and difficulty as seed axes**.

| Seed axis | Core 2 (220-1202) seeds | Sec+ (SY0-701) seeds |
|---|---|---|
| Fault count | `faultCount: 1` — exactly one planted cause | 1–2 planted faults |
| Remediation scoring | closed set, **exact match** | `acceptableRemediations` **class sets** (equivalence) |
| False-positive penalty | none | **yes** — prevents "flag everything" |
| Discriminating exhibit | **clock readout present** (drift vs expiry) | optional |
| Framing | browser security warning; browser **named per seed**, but **fixed vocabulary across seeds** or the bank fragments | API client / mutual-TLS handshake; **vendor-neutral by construction** |
| Objective | **3.4** (▶ — names *certificate warnings* explicitly); secondary **2.11** | **1.4** (*Explain* — verb deprioritization applies) |

**The Sec+ scoring model is a strict superset of Core 2's**, so one validator parameterized on `faultCount` + remediation-match-mode reproduces S-7 exactly. **Shipping two would duplicate a renderer and a validator and then drift them.** This changes neither gate outcome — both passed gate 1 against the 14-archetype baseline as written — it is a build-consolidation call, and it must be made **before** either enters a build spec, not after.

**Ranking consequence, stated so it is not lost:** `certchain` is ranked **once**, at Sec+ **#3**. It is **not** re-ranked in the Core 2 five. Core 2's list is therefore drawn from S-1…S-6 only. Treating it as two builds would double-count one renderer against two lists and inflate both.

### 5.2 Shared widget core — host roster (`fleetlog` ↔ `endpoints`)

**Sec+ C2 `fleetlog` ↔ Core 2 S-2 `endpoints`** are **genuinely distinct archetypes that share a widget.** Both are a host roster + per-host expandable drawer + per-host state control, and both open with *"identify the compromised host."* Task chains genuinely diverge (attribution-from-logs vs isolate-and-harden) and the validators are unrelated.

**Recommendation: one roster reference kind serves both**, parameterized on:

| Parameter | `fleetlog` (Sec+) | `endpoints` (Core 2) |
|---|---|---|
| Drawer content | log rows (shared time axis) | service rows |
| Per-host control | label segmented control (Clean/Infected/Source) | quarantine toggle + per-service switches |
| Second surface | central flow log + filter chips | (none) |
| Validator | `simLabValidateFleetAttributionFidelity` (graph invariant) | `simLabValidateEndpointConsoleFidelity` (set comparison, tri-state) |

**This is the single largest renderer-reuse win in the pass** — one roster kind, two archetypes, two certs, both of them top-2 on their cert's list.

### 5.3 Shared derivation engine — permissions (`iam` ↔ `acl`)

**Sec+ C4 `iam` ↔ Core 2 S-4 `acl`** are genuinely distinct on the **scored direction** — `iam` **authors** toward invariants (many valid end-states, all scoring full), `acl` **computes** a single-valued result. Both endorsed. **But they share a group-inheritance derivation engine and should share it in code.**

🔴 **They use contradictory permission algebras and both are now ranked.** See §8.6 — this is a live defect, not a note.

### 5.4 Renderer-reuse summary

| New build | Serves | Reuses |
|---|---|---|
| roster reference kind | `fleetlog` (Sec+ #2) + `endpoints` (Core 2 #1) | `categorize` label controls; `timeline` time-axis; `firewall` toggle primitives; `portmap` tile CSS |
| `certchain` kind + validator | Sec+ #3 **and** Core 2 — **one build, two certs** | `analyze` step machinery; card CSS from `queue` |
| permission-derivation core | `iam` (Sec+ #4) + `acl` (Core 2 #5) — **algebra must be pinned per seed** | `configure` toggles; `fillin`/`match` answer inputs |
| `configpanel` kind + `simLabValidateTunnelFidelity` | `vpntunnel` (Sec+ #1) | `configure` step type; existing option-set rendering; `network` as read-only brief |
| `queue` kind | Core 2 #2 | card/chip CSS; `analyze`/`fillin` machinery |
| `settingstree` kind | Core 2 #3 | `configure` machinery (terminal pane only) |
| `disklayout` kind | Core 2 #4 | `configure` machinery; `slots` segment CSS |
| `findings` kind | Sec+ #5 (`vulnq`) — **first cut** | `order` + `categorize` step types |

### 5.5 Cross-cert structural findings (the most reliable thing either pass produced)

Both corpora's **best-evidenced finding is structure, not format** — and they were gathered independently. That symmetry is itself worth noting.

| Finding | Sec+ (SY0-701) | Core 2 (220-1202) |
|---|---|---|
| PBQs per form | **2–5** (7 sittings, `08` §3 Claim 5). Range 2–5, ~73–78 total questions. **Never the "90 questions / 5–6 PBQs" prep material asserts** — 90 is the *maximum*, not the norm | **4–7, mode 5** (8 sittings) |
| Front-loaded | **CONFIRMED** (firsthand: *"the practical portions being the first few questions"*; S8 hit a PBQ as question 1) | not separately established |
| Skippable / flaggable | **CONFIRMED**, overwhelming consensus, firsthand-executed (S4: *"I immediately skipped all the PBQs"*) | first-pass-then-return strategy reported |
| **Partial credit** | **Reported firsthand** — `Vizreki` (~2026-07-03): *"Pretty sure I got only partial credit on most of the pbq's."* A scoring-model fact, carried forward | community folklore (CLAIM); CompTIA publishes no rules |
| Materially interactive | S7: **typed-command terminal where `help` enumerates the available command set**; prep PDFs are *"thickly veiled multiple choice"* by comparison | **High** (2+ sittings); *"a lot more interactive than a PDF can provide"* |

**Strategic context (this is what makes gate 5 worth its severity):** `02` §3 and `04` §2 agree across both ecosystems — **mobile PBQ practice is an empty niche.** Pocket Prep owns mobile (native iOS/Android, 1,330 Sec+ Qs / 1,130 A+ Qs) and is **MCQ-only, no PBQs claimed**. **No vendor publishes a mobile PBQ interaction story at all** (INSPECTED absence across pages). **Partial-credit models are undocumented everywhere** — CompTIA doesn't publish them, and no vendor documents one for practice either. Of the majors, only Dion's PBQ Pack ($29.99, 100 items) and MeasureUp (30+ interactive items, CLAIM) market interactive widgets; Messer's paid PBQs are **static PDF**. **A phone-native PBQ with documented partial credit is unoccupied ground in both certs simultaneously.**

---

## 6. Rejected-candidates log (both certs, consolidated)

Gate items quoted from `00-…` §3. Grounds below are **as corrected by §4** — where the review changed a ground, the corrected ground is stated and the original is noted.

| Cert | # | Candidate | Gate item(s) | Reason |
|---|---|---|---|---|
| Sec+ | C6 | Cloud Zone Component Placement | **1** | Drag component → zone, scored by `correctPlacements` device→zone string match, validated by `simLabValidateNetworkFidelity` = the shipped **`diagram`** archetype (Net+, 16 seeds) with security-flavoured nouns. **The most-evidenced Sec+ format claim in the pass and it still dies — the gate is distinctness, not evidence.** → **§7 seed extension.** |
| Sec+ | C7 | Firewall / ACL Rule Ordering | **1** | Straight duplicate of shipped **`firewall`** (Net+, 12 seeds, `simLabValidateFirewallFidelity`). Framing changes; the archetype does not. Separately: **zero firsthand support after two deliberate hunts** (§9.3), and its strongest apparent supporting quote was **fabricated by a search summarizer**. Three independent reasons not to prioritize it; it fails on distinctness before evidence is ever scored. |
| Sec+ | C8 | Data Classification → Control Selection | **2** | `categorize` (classify assets) + `match` (select handling controls) over existing kinds. **Ground re-stated per §4.4:** not *"gate 2 forbids it"* but **"no defensible new scoring model was found for it."** A content idea, not an archetype — belongs in the question bank or as `defense` seeds. *Territory membership from the brief earned it no protection.* |
| Sec+ | C9 | Attack → Mitigation Matching | **2** | The `match` primitive over the shipped `attack` reference kind. Literally two inventory items composed the obvious way. Also unevidenced. |
| Sec+ | C10 | Port / Protocol Matching | **1 + 2** | Shipped **`portmap`** (Net+, 12 seeds) already is this; absent it, still `match` over existing kinds. Fails twice. |
| Sec+ | C11 | Incident-Response Phase Ordering (PICERL) | **1 + 2** | Shipped **`incident`** (Sec+, 20 seeds) on `timeline`; phase ordering is inside its remit and plausibly already in its 20 seeds. Residue is `order` over `timeline`. Fails twice. |
| Sec+ | C12 | Crypto Algorithm Selection by Use Case | **2** | `categorize`/`match` over a static list — a multi-select MCQ in a costume. Not an argument against the 1.4 content, only against it being an archetype. |
| Sec+ | C13 | SIEM Detection-Rule Tuning | **6 + 5** | **Gate 6 (primary):** valid-answer space is **unbounded and continuous** — thresholds of 5/6/7/12 may all work; exclusions on source-IP, user-agent, or process-parent may all work. Closing it needs a hard-coded key (forbidden for multi-valid) **or a rule interpreter replaying against a log corpus — a different and much larger product.** **Gate 5 (independent):** a condition builder with boolean nesting and live match-count preview has no honest 375px version. **This is the reference example of a genuinely uncomputable equivalence space — open and continuous — versus C-09's closed, small rung set. Conflating the two is what produced the C-09 inconsistency.** |
| Sec+ | C14 | Phishing Header / Awareness Triage | **1** | Same chain (scan one rendered text artifact, mark lines evidence-vs-noise), same scoring (per-line relevance, partial credit, FP penalty), same validator (`simLabValidateEvidenceTriageFidelity` would score it unchanged) as shipped **`triage`** — with only a reference-kind swap from `terminal` to an email view. **A reskin, which gate 1 names explicitly.** Obj 5.6 (▶) content is real and worth covering: right content, wrong pretext. → **§7 seed extension.** |
| Sec+ | — | Command Terminal PBQ | **1** | Killed on sight — one-to-one reskin of shipped **`cli`**. **Now evidenced (S7, `08`) → §6 seed extension, and it moved up the §6 list because of it.** |
| Sec+ | — | Wireless Security Configuration | **1** | Killed on sight — one-to-one reskin of shipped **`wireless`**. **Now adjacently evidenced (S3: RADIUS auth + wireless crypto) → §6 seed extension.** |
| Core 2 | C-03 | Interactive Windows/Linux Shell (`help`-discoverable) | **1** (also 2) | Same chain (run scoped commands → read output → diagnose), same `terminal` kind, same `simLabValidateCliFaultFidelity` shape as shipped **`cli`**. **A `help`-discoverable command set is a feature of the existing renderer, not a new archetype.** **This is the single best-evidenced 1202 format and it is still rejected.** → **§7 seed extension.** Secondary: a *Linux-deep* variant would independently rank at the bottom — 1.9's verb is **Identify**, the lightest in the document (a **ranking** penalty under §4.2, no longer a gate 4 kill). |
| Core 2 | C-04 | Social-Engineering Classify/Match | **2** | `categorize`/`match` over the shipped `attack` reference kind. Taxonomy sort, no new interaction. Also brushes gate 1 vs `incident`'s analyze step. → **§6 seed extension** (this is what the untagged `sim-lab-seed-aplus-core2.js` content already is). |
| Core 2 | C-05 | SOHO Security Configuration | **1** | Direct reskin of shipped **`soho`** (Core 1, 12 seeds, `simLabValidateSohoFidelity`) — same chain, same validator. **A differing objective is not a differing archetype.** → **§7 seed extension.** |
| Core 2 | C-06 | Malware-Removal Ordering Ladder | **2** (also 1) | The `order` primitive with no new interaction and **no distinctive exhibit** — 2.6's seven-step sequence as a drag-list is the excluded shape twice over; also an `incident` thin variant. **And it is folklore, not format:** `03` §5 records that **no firsthand 1202 report describes a malware-removal ordering PBQ** — ordering appears only as MCQ *"what NEXT"* sequences. Fails the gate even if it were evidenced. |
| Core 2 | C-09 | WinRE / Boot-Repair Escalation Ladder | **1** *(corrected — was 6)* | **Ground corrected per §4.4.** Primary and stated ground is now **item 1**: the escalation-ladder chain is `incident`'s ordering chain with a different noun. The original item-6 argument (*"more destructive than necessary is not computable"*) **does not hold** — the rung order is a small closed total order, and declaring it is exactly what `vulnq` and `disklayout` do. Leaving it as written would retroactively kill two ranked survivors. Outcome unchanged; reasoning repaired. |
| Core 2 | C-10 | Mobile Device Security Profile Builder | **1** | **`soho`** reskin — configure controls against stated requirements, scored by value-match. Router→phone, SSID→MDM profile changes the noun, not the archetype. *(Would have passed 4/5/7 — 2.8 is ▶ and a phone profile is the ideal 375px exhibit — but the gate is conjunctive and item 1 is dispositive.)* |
| Core 2 | C-11 | Browser Security Hardening Panel | **1** (also 2) | **`soho`** reskin, `configure` over a settings form. 2.11 is new in V15 and genuinely under-served, which makes this tempting — **it is still a reskin.** Correct disposition: browser-security content rides S-3's terminal panes and the merged `certchain`, where it sits on a genuinely new interaction. |
| Core 2 | C-13 | Backup Scheme Designer (RTO/RPO) | **1** | Full/incremental/differential + GFS rotation vs RAID level + disk count = *"the same constraint-satisfaction picker wearing different vocabulary"* as shipped **`raid`** (Core 1, 13 seeds). **🟡 Flagged as the most re-proposable rejection in the set:** the argument is arguable but thin — scored object differs (recovery **time** vs **capacity**), constraint math differs (RPO/RTO windows vs parity arithmetic), failure modes unrelated — and the doc's own hedge (*"cleared none of the three convincingly"*) is doing real work; **"unconvincing" is a lower bar than gate 1's "reskin = reject."** Not overturned (4.3 survives as a secondary on S-5's rollback-plan field, so the objective is not orphaned). **If re-proposed, it deserves a real analysis, not a citation of this one.** |
| Core 2 | C-16 | Scripting Workbench | **6** *(predict/repair)* **or 1** *(constrained)* — *corrected, was 4* | **Gate 4 ground vacated per §4.** Re-run properly and it forks; both forks die. See §4.3 for the full analysis it was originally denied. Additionally deprioritized: 4.8 is Explain-verb. |
| Core 2 | C-17 | AI Use-Policy Adjudicator | **2** *(corrected — was 4)* | **Gate 4 ground vacated per §4.** Falls anyway on gate 2: `categorize`/`match` over a static list, no distinctive exhibit — same shape as C-19/C-20. The *"a few AI-related questions"* report is **topic evidence (type b)** and never rescued it. |
| Core 2 | C-18 | Event Viewer Log Correlation | **1 + 5** | Thin variant of shipped **`triage`** — Event Viewer chrome instead of a terminal is a skin. **Independently fails gate 5, and this is the sharpest mobile argument in either document:** *"correlation requires seeing multiple entries at once, which is exactly what 375px denies; a one-entry-per-card list destroys the task."* **The correct test is not "does it fit" but "does the scored act survive."** *(That same test is what condemns `fleetlog`'s summary icons — §8.4. Both are the exhibit eating the task: C-18's card list destroys the join; `fleetlog`'s icons pre-compute it.)* Also: **no log-viewer exhibit has been reported firsthand for 1202.** |
| Core 2 | C-19 | Remote Access Technology Selector | **2** | `match`/`categorize` scenarios → RDP/VPN/SSH/RMM/screen-share, no distinctive exhibit. A matching quiz. **4.9 being a ▶ objective does not make a matching quiz an archetype.** |
| Core 2 | C-20 | Windows Feature/Tool Selector | **2** | `match` over a tool list (Task Manager / MMC / regedit / Device Manager / Disk Management / Event Viewer). No new interaction, no distinctive exhibit. 1.4 is better served as a secondary on S-3, where finding the tool is embedded in a navigable tree. |
| Core 2 | S-5 | **Change-Advisory RFC Board** — *survivor, cut at ranking* | — *(passed all 7)* | **Not a gate rejection.** Cut from the top five **for portfolio diversity + defect load + thinnest bank.** See §3.1 and §8.7. |

**Rejection pattern worth carrying forward.** Eight of thirteen Core 2 rejections collapse into three families — *it's `cli`* (C-03), *it's `soho`* (C-05, C-10, C-11), *it's a matching/ordering quiz* (C-04, C-06, C-19, C-20). Core 2's objective surface is dense with *"configure X to meet requirements"* and *"match X to Y"*, which is precisely why it generates so many reskins. **Future candidate rounds should pre-screen against `soho` and `match` before spending analysis.** The Sec+ mirror: five of nine rejections are `match`/`categorize`/`order` recombinations, and the two loudest prep-industry claims (firewall rule ordering, port matching) are **both duplicates of shipped Net+ archetypes.**

---

## 7. Seed-extension recommendations — evidenced formats already covered by shipped archetypes

**This is a distinct deliverable, not a footnote.** `07` §4.1 flags the process failure directly: **the cheapest evidenced wins in the entire pass are the ones most likely to get lost**, because they *exited the archetype track* and became footnotes in a routing table while C-grade archetypes got ranked.

**The core finding, stated plainly:** across both certs, **the best-evidenced PBQ formats map onto archetypes CertAnvil has already shipped.** Every archetype on the §2 and §3 lists is, to some degree, a bet on unreported surface. The items below are not.

**On evidence-per-unit-build-cost, every row below beats every unevidenced archetype survivor.** They are ranked here **against** the archetype survivors, as `07` §6 item 11 requires — not alongside them as an afterthought.

| # | Seed extension | Target shipped archetype | Evidence | Build cost | Why it ranks here |
|---|---|---|---|---|---|
| **SE-1** | **Sec+ terminal/CLI seed set** | **`cli`** (Net+, 12 seeds, `terminal` kind, `simLabValidateCliFaultFidelity`) | **B → 2 sittings.** S7 (`H_Leimgruber`, ~2026-06-21, **SY0-701 explicit**): a **command-prompt/terminal PBQ where typing `help` enumerates every available command in the sim** — behaviourally specific, and it is **one of the two most recent 701 sightings.** S9 (`TangyStart`, ~2026-07-06, SY0-701 explicit) names **CLI** as one of three competencies his PBQs demanded. **Only counted source is S7** for the format; S9 corroborates the competency. *`AddendumWorking9756`'s "cold terminal" comment was **excluded** — reads as vendor promotion for CyberDefenders, no indication of having sat 701.* | **Lowest in the pass — seeds only.** Renderer and validator both shipped. | **New in `08` and it changes the picture.** The `help`-discoverable command set is **already a feature of the shipped renderer** (this is exactly why Core 2 C-03 was rejected). A Sec+ seed set on `cli` is **evidenced by the two most recent 701 sightings, costs seeds, and ships now.** Note the cross-cert convergence: the *same* `help`-discoverable terminal is the best-evidenced format on **Core 2** (SE-2) — one renderer, two certs, both evidenced. |
| **SE-2** | **Core 2 CLI seed set** — Windows commands (1.5), Linux (1.9) | **`cli`** | **B → 2 sittings** *(upgraded from C/1 by the `10` deep re-run — see Addendum)*. u/Klutzy-Astronaut-280 (**2026-05-29**, 220-1202 stated, passed 813): *"If you get a command-line PBQ, try using the `help` command. It can show you the available commands for that environment/situation."* **+ u/Mental_Tea_4084 (2026-03-12): *"my pbq let me type help to get a list of available commands"*** — independent, read verbatim off the rendered page. **Design detail (instructor testimony, NOT a sitting):** u/drushtx (r/CompTIA mod / IT instructor) — the sandbox exposes a **fixed ~4-command set** and `help <command>` does **not** work. ⚠️ **Unresolved contradiction:** u/shaggs31 describes commands via **dropdown select, not typing** (no exam code stated, not counted) — 1202 may ship both variants; a typing-only seed set may model half the surface. **The single best-evidenced 1202 format — and it is a seed extension, not an archetype (C-03 died at gate 1).** Corroborating shape (not counted, different exam): u/redgroupclan describes a **Network+** PBQ as a restricted command environment, which confirms the current-gen simulated-terminal engine **across the lineup**. | **Lowest — seeds only.** | Pair with SE-1. Topic-only signals independently point here: **Windows commands are the reported pain point** (u/visualsarcasm 2026-07-05; u/Jayy-Kayy 2026-04-08). ⚠️ **Weight Windows-heavy, Linux-light:** 1.9's verb is **Identify** (lightest in the document → ranking deprioritization per §4.2), and firsthand reports **conflict on Linux volume** — Klutzy-Astronaut-280 reports *"quite a bit of Linux"*; u/InevitableDoughnut89 (2026-06-03) and u/visualsarcasm (2026-07-05) both report **very little Linux**. Two of three recent reports say light. |
| **SE-3** | **Sec+ cloud/zone seed extension** — cloud/zone node vocabulary, WAF/LB node types, **+ a `zoneLabel` scored predicate** | **`diagram`** (Net+, 16 seeds, `simLabValidateNetworkFidelity`) | **B → 3 sittings for the task; C → 0 for the interaction.** `08` Claim 3 is precise: **architecture-construction PBQs exist on 701** — S2 (*"build a literal full High Availability architecture for an enterprise"*), S4 (*"screened subnets"*), S8 (*"a network design PBQ"*, poster explicitly declined further detail). **Not one of them describes HOW you construct it** — drag-drop vs dropdowns vs click-to-place. **The task is +3 sittings; the drag-drop interaction has 0.** Do not upgrade this to "confirmed" on the strength of the task existing. *(`08` more than doubles this from `01`'s 1 sitting.)* | **Low — seeds + one small validator addition.** | **The cheapest evidenced win in the Sec+ pass**, and now the best-evidenced *task* claim after log analysis and VPN config. ⚠️ **One correction to `06`'s routing note, so the build stage doesn't discover it:** the "undecided subnet" is **not free.** `06` says it is *"expressible as a zone whose membership is itself scored, which `correctPlacements` already supports."* **Not quite** — `correctPlacements` maps **device → zone**; classifying the *zone itself* as public or private is a **zone → label** scored object, which is not in that model. **One new scored predicate, not zero — a minor validator addition.** *(This does not rescue C6 as an archetype: one predicate ≠ an archetype.)* |
| **SE-4** | **Sec+ firewall seed set** — security framing | **`firewall`** (Net+, 12 seeds, `simLabValidateFirewallFidelity`) | **B → 2 sittings for "a firewall PBQ exists"; C → 0 for any interaction shape.** S6 (*PBQs "all had to do with analyzing logs and **configuring firewalls**"*), S2 (firewall logs). **This is type-(c)-lite: the exhibit is named, the interaction is not.** **Drag-drop firewall rule table: 0 firsthand sittings after two deliberate hunts** (§9.3). | **Lowest — seeds only.** | The honest disposition of the industry's loudest claim: **the archetype is shipped; only the seeds are missing.** Extending `firewall` with Sec+ seeds captures the **evidenced** part (a firewall config PBQ exists) at seed cost, **without** building the **unevidenced** part (the drag-drop rule table) as a new archetype. Ranked below SE-3 because the interaction evidence is weaker still. |
| **SE-5** | **Sec+ email/header seed set** | **`triage`** (Core 1, 12 seeds, `simLabValidateEvidenceTriageFidelity`) | **C → 0 sittings.** Obj 5.6 (▶) content is real; **no 701 sitting describes a phishing-header PBQ.** | **Lowest — seeds only.** The validator *"would score it unchanged with only a reference-kind swap."* | Right content, wrong pretext (as an archetype). As **seeds** it is nearly free — but note honestly: **the reference-kind swap from `terminal` to an email view is not literally zero renderer work**, and it is **unevidenced**, which is why it ranks below SE-1…SE-4 despite `07` §4.1 pairing it with C6. |
| **SE-6** | **Sec+ AAA/RADIUS + wireless-crypto seed set** | **`wireless`** (Net+, 12 seeds) | **C → 1 sitting.** S3 (`Altruistic_Will7110`, 2024-07-18, **SY0-701 explicit**): a PBQ covering algorithm choice / **RADIUS auth** / VPN. Prior-gen corroboration (**flagged, not counted**): `Jonny_Boy_808` (**601**) describes *"setting up a guest account with RADIUS + wireless auth/crypto."* | **Lowest — seeds only.** | Small but real, and it costs seeds. The 601→701 shape persistence is **an argument, not evidence**, and must not inflate the count. |
| **SE-7** | **Core 2 social-engineering seed set** — phishing/vishing/smishing/whaling | existing `categorize`/`match` primitives over the shipped **`attack`** kind | **C → 1 sitting.** u/still6shawtyy (May 2026, fail-then-pass, firsthand): *"you need to know the difference between phishing, vishing etc."* | **Lowest — seeds on existing primitives.** | **This is what the untagged `sim-lab-seed-aplus-core2.js` content already is** (`00`: *"no archetype tags — pre-archetype content on shared primitives"*). Objective 2.5 is Explain-verb → ranking deprioritization per §3.2. |
| **SE-8** | **Core 2 SOHO seed set** | **`soho`** (Core 1, 12 seeds, `simLabValidateSohoFidelity`) | **C → 1 sitting, hedged.** Same source as SE-7, and the wording is *"maybe some soho security."* **Treat as tentative** — `03` grades this family **Low**, the weakest in its table. | **Lowest — seeds only.** | Real but thin. Obj 2.10. Ranked last on evidence quality, not on cost. |

### 7.1 What this section means for the archetype lists

**Sec+: 5 of the 7 format clusters `08` identified route to SHIPPED archetypes, not to new ones.**

| `08` format cluster | Sittings | Disposition |
|---|---|---|
| Multi-host log analysis → classify each host | **5** | → **new archetype `fleetlog`** (Sec+ #2) |
| VPN concentrator configuration form | **5** | → **new archetype `vpntunnel`** (Sec+ #1) |
| Network / architecture design or build | **3** | → **SHIPPED `diagram`** (SE-3) |
| Firewall configuration (shape unspecified) | **2** | → **SHIPPED `firewall`** (SE-4) |
| Terminal / CLI sim (`help`-discoverable) | **1** (+S9 competency) | → **SHIPPED `cli`** (SE-1) |
| Matching / mapping (attack → resolution) | **1** | → **SHIPPED primitives** (`match` over `attack`) |
| AAA / RADIUS + wireless config | **1** | → **SHIPPED `wireless`** (SE-6) |

**Only the top two clusters justify new archetypes. The other five are seed work on things already built.**

**Core 2: all three reported formats map to shipped archetypes** (C1 terminal → `cli`; C4 classify/match → `attack` primitives; C5 SOHO → `soho`). `05` §4 states the consequence honestly and it is the single most important line in the Core 2 pass:

> *"The exam's best-evidenced Core 2 PBQ shapes are already covered by the inventory, and the surviving archetypes are therefore mostly bets on unreported surface."*

**Sizing note carried forward:** Sec+ forms carry **2–5 PBQs**; Core 2 forms carry **4–7, mode 5**. Any archetype set should be sized against those numbers — not against the count of archetypes it is possible to build.

---

## 8. Preconditions & defects that must be fixed before any build

**Blocking. Each of these is a correctness or gate-survival issue, not a preference. Four are `07`'s explicit pre-build blockers; the rest are conditions on specific ranked rows.**

### 8.1 🔴 Merge `certchain` before either cert enters a build spec

Sec+ C3 and Core 2 S-7 collide on **reference-kind name AND validator name** (§5.1). Build one, with cert/difficulty as seed axes. **Must be decided before spec, not after** — shipping two duplicates a renderer and a validator and then drifts them.

### 8.2 🔴 Replace `iam`'s fourth invariant — blast radius is broken

`changeCount ≤ maxChanges` **fails on two independent counts:**

1. **It is not an invariant.** The other three are predicates over the **end state**; this is a metric over the **edit path**. It cannot be evaluated from the final grid at all. **Two learners reaching the SAME end state — one in 2 edits, one in 4 — score differently.** That breaks the archetype's own headline promise (*"multiple end-states satisfy all four and all of them score full marks"*). **Path-scoring wearing an invariant's clothes.**
2. **It smuggles the answer key back in — the exact failure that killed C13.** Setting `maxChanges` requires the author to already know the size of the legitimate solution set. Set it tight → forbid a valid-but-longer route (cut the group's permission rather than the membership). Set it loose enough to admit every valid route → *"revoke everything"* walks back in. **There is no safe value between**, because **change count is a bad proxy for blast radius anyway**: removing one group membership is 1 change with enormous radius; revoking three direct permissions is 3 changes with almost none. **The metric is inversely correlated with the thing it is named after.**

> **Required replacement — a real fourth invariant, computable from end state:**
> **Collateral damage** — *no subject **outside** the scenario's target set loses any entitlement in their own `requiredAccess`.*
>
> This is what "blast radius" was reaching for. It kills *"revoke everything"* immediately and correctly (mass revocation strips bystanders), it is a **pure end-state predicate**, it is vendor-neutral, it requires **no authored magic number**, and it makes the seed's other subjects **load-bearing rather than decorative**. Optionally pair with a *targeting* invariant (no changes to subjects outside the target set at all) for a tighter cut.

**The other three invariants are sound and computable:** sufficiency ✅ · least privilege ✅ (*effective = direct OR inherited* — this is the good one; it is what makes "revoke at the user level" visibly insufficient, and it is the archetype's actual lesson) · SoD ✅.

### 8.3 🔴 Pin `acl`'s precedence rule — the stated rule is the FOLK rule and it is wrong

`05` §S-4 states: *"cumulative allow across group memberships → **explicit deny wins** → for network access, the more restrictive of (effective NTFS, effective share)."*

**Two of three are right.** Cumulative allow ✅. Share-vs-NTFS most-restrictive-wins for network access, share ACL ignored locally ✅ (and the local-vs-network split is a genuinely good teaching axis).

**"Explicit deny wins" is the folk rule, and it is wrong in exactly the case S-4's own seed axes create.** Real NTFS precedence is **explicit before inherited, then deny before allow *within the same level*.** The consequence: **an explicit allow on the object BEATS an inherited deny.** S-4 lists *"inheritance-blocked folders"* and *"deny placement (share vs NTFS)"* as seed axes — so seeds **will** combine inherited denies with explicit allows, and the stated rule will compute **the wrong answer, deterministically and invisibly, because the validator is single-valued and will look confident while being wrong.**

**Required decision — in the spec, not in the code:**

- **Option A (recommended for A+ level):** restrict every seed to **same-level ACEs** — no inherited deny paired with an explicit allow. The folk rule is then correct, the exhibit is honest, and the archetype teaches what CompTIA teaches. **Cost:** drops the inheritance-blocked-folder axis, shrinking the bank somewhat from the estimated 18–24.
- **Option B:** implement full precedence (explicit > inherited; deny > allow within level). Technically correct, keeps the axis, **but risks marking a learner wrong for applying the rule the A+ curriculum itself teaches** — defensible only with excellent feedback copy.

**Either is fine. Silently shipping the folk rule while authoring inherited-deny seeds is not, and that is the current trajectory.**

- 🟡 **Step 3 needs an authoring guard.** *"Exactly one ACE is decisive"* is an authored constraint, but **"decisive" is ill-defined when two ACEs independently deny the same access** — remove either and the outcome is unchanged, so **neither is uniquely decisive.** Seeds must be **validated** for single-decisive-ACE-ness, not merely asserted to have it.

### 8.4 🔴 `fleetlog` — the no-precomputed-summary contract

**The collapsed 3-icon evidence summary (inbound / outbound / none) leaks the answer.** The scoring invariant is: **Source = unique root of the infection DAG (outbound flows, no inbound); Infected = reachable from root; Clean = unreachable.** Those icons are **a direct rendering of the invariant.** A learner who never opens a single drawer reads the icons and labels the fleet correctly: outbound-only → Source, inbound → Infected, none → Clean.

**The cross-source join — the entire scored act, and the only thing distinguishing `fleetlog` from `triage` — is pre-computed and handed over as a convenience affordance.**

> **REQUIRED CONTRACT: the collapsed summary must be raw and semantically inert** — e.g. flow *counts* with no direction semantics, or an *"N log lines"* chip — **or it must be removed.** The learner must open the drawer and do the join.

**This is not cosmetic; it is load-bearing for gate-1 survival.** With the icons as specified, `fleetlog` **fails gate 1 against `triage`**: if the join is pre-computed, what remains is per-host classification from a rendered summary, and the distinctness argument evaporates. It is **more dangerous than a normal defect because it looks like a usability win.**

**The rest of the mobile contract is endorsed and equally binding** (archetype fails gate 5 retroactively if any clause is dropped): **no table** — host roster as a vertical card accordion · central flow log as a **filter surface** (chip row → ≤8 two-line flow rows), not a wall of text · **seed cap 4–5 hosts on mobile** (desktop may render 6; the graph invariant works at n=4 and a 4-host seed is first-class, not degraded) · **labelling is a segmented control per card, no drag.**

**Two further conditions:**
- 🟠 **Working-memory cost across navigation is the real 375px problem.** The join requires holding host A's local log against the central flow log. On desktop both are visible at once; under the accordion they are not, and the learner must remember. **`vpntunnel` solved the identical problem with its persistent mirror chip strip — `fleetlog` needs the analogous device: a pinned context strip showing the selected host's key flows while the central log is filtered.** Without it, the archetype is *usable* at 375px but *harder* at 375px — a fidelity failure of a subtler kind than gate 5 names.
- 🟡 **n=4 makes partial credit coarse.** With exactly one Source and at least one Clean, only ~2 hosts are genuinely ambiguous, the label space collapses, and **guessing pays.** Not a gate failure; a seed-authoring note. **Prefer n=5 on mobile where the exhibit allows.**

### 8.5 🟠 `vulnq` — the ordering fork must be resolved, or the archetype cut

**It is `categorize` + `order` in a costume**, and the honest framing is a **fork, not a fix**:

- **Keep ordering:** remains a marginal survivor whose distinctness rests on **one validator trick** (partial-order consistency) and whose gate-2 status is **contested even under the amended gate**.
- **Cut ordering:** **the archetype becomes MORE distinct, not less** — a pure context-overrides-severity disposition engine with set-membership equivalence and **no surface that resembles `order` at all.** The teaching point (*asset context overriding raw severity*) lives **entirely in the disposition step**; **nothing is taught by dragging four already-correctly-dispositioned cards into a consistent sequence.** **Cost:** forfeits the partial-order validator — its only unambiguous gate-1 novelty — so gate 1 must be **re-argued from the disposition composition alone** (the queue's membership is candidate-determined by step 2, which no existing archetype does).

**Given `vulnq` is also the thinnest evidence base in either cert — absent from the corpus entirely across two passes, from sittings *and* vendors — it does not earn the analysis either fork requires. Ranked last; first thing cut when scope tightens.** *(Note the symmetry `06` got backwards: it warned that dropping the **disposition** step makes it a thin variant — correct — but the symmetric move is the good one.)*

### 8.6 🔴 `iam` and `acl` use contradictory permission algebras — and BOTH are ranked

- **`acl` (Core 2 #5)** uses **deny-wins** (NTFS semantics — and see §8.3, its stated version of that rule is itself wrong).
- **`iam` (Sec+ #4)** as written is **purely additive** — *"effective = direct OR inherited"* — **with no deny concept at all.**

Both are internally coherent, both are vendor-neutral, **but they are different algebras, and neither doc states its algebra as a declared seed property.** They share a derivation engine (§4.3).

> **REQUIRED: each seed must pin its algebra explicitly.**
>
> Otherwise the shared derivation core silently adopts one cert's semantics and **the other cert's seeds start scoring wrong in a way that looks like a content bug for months.**

This was a latent note when only one might ship. **Both are ranked. It is now a live defect.**

### 8.7 Conditions on the remaining ranked rows

- 🔴 **`iam` — vendor-neutrality is a build constraint, and the drift is lexical.** It **will not arrive as a logo. It will arrive as vocabulary** — the moment a seed says *"policy attached to a role"* or *"permission boundary,"* the archetype has silently become one vendor's model and Sec+ neutrality is gone. **Pin the vocabulary in the spec: *subject · group · permission · direct · inherited*.** (Consistent with `02` §1: the SY0-701 blueprint is essentially vendor-neutral — only "Group Policy" and "SELinux" appear, as 4.5 examples.) **Also required: the subject-first mobile pivot — a rendered matrix at 375px fails gate 5.** Cap 4 subjects × 5 permissions.
- 🟠 **`settingstree` (Core 2 #3) — decide what is being taught; the spec currently wants both and has specified only one.** Its gate-2 case is *"navigation-with-history is the genuinely new interaction"* — true, no existing reference kind is navigable. But **scoring accepts any path whose terminal is in `acceptedTerminals`, with efficiency reported as feedback and explicitly not gating correctness.** So **the scored act is "reach an accepted end node, then set the control." The path is unscored. The navigation is real, and unmeasured.** The validator **cannot distinguish a learner who navigated confidently from one who wandered into every wrong branch and stumbled onto the right pane. A search box would score identically.** → **If the pedagogy is Windows spatial memory (as stated), efficiency must score** — not as a pass/fail gate, but as a graded component (full credit at ≤ shortest-accepted-path + 1, partial beyond). **If efficiency stays pure feedback, say honestly in the spec that this archetype scores destination knowledge**, and let navigation be the *interaction* that makes it feel like Windows rather than the thing measured.
  - ✅ **`acceptedTerminals` is honest — and more robustly than `05` argues.** `05` worries that *"a seed with an unenumerated route is a content bug."* **Misdirected: the simulated tree is a closed world.** A route never authored **does not exist in the sim** — not navigable, so not takeable, so not mis-scorable. **An unenumerated route is not a scoring bug and fidelity validation is not what catches it.** It is an **exhibit-fidelity gap** (the sim's Windows differs from real Windows): a content-quality problem (the learner builds a slightly false spatial model), **not a fairness problem** (nobody is marked wrong for a correct answer). **Reframe the risk in the spec** — the doc is defending against the scarier failure and hasn't noticed it is structurally immune to it.
- 🟡 **`disklayout` (Core 2 #4) — two authoring guards.** (a) **MBR's constraints must be validator invariants, not seed prose** — the **2 TB ceiling** and the **4-primary / 3-primary-plus-extended limit**; otherwise **a learner can produce an MBR layout that sums correctly and is physically impossible.** (b) **ReFS must be excluded as a boot/OS volume.** 1.1 lists ReFS (new in V15) and S-6 draws filesystems *"from the 1.1 list"* — but **ReFS cannot host a Windows boot volume.** If the picker offers it for the OS partition, **the archetype teaches a falsehood.** *(Otherwise sound: 1.2 mapping is the tightest in the Core 2 set — boot methods, GPT/MBR, upgrade considerations are its literal content — and the quoted bands are correct: EFI 100–500 MB, recovery ≥ 650 MB, GPT forced > 2 TB, Win11's UEFI+GPT+TPM+Secure Boot floor.)*
- 🟠 **Merged `certchain` — fix the browser vocabulary across Core 2 seeds.** Browser-naming per seed is acceptable for Core 2 (2.11 is literally browser security settings; Core 2 carries no neutrality requirement) — but it must be **fixed vocabulary across seeds, not a per-seed free choice, or the bank fragments.** The Sec+ side stays **vendor-neutral by construction.**
- ✅ **`endpoints` (Core 2 #1) — technically sound, no blocking defect.** Objectives are the tightest pairing in either set: **2.6 lists *quarantine* literally; 2.7 lists *disable unused services* literally.** The tri-state service matrix with **enumerated `don't-care` cells** is genuinely **total** scoring with no undefined cells — so **gate 6 needs no equivalence model.** Asymmetric penalty (false-negative fatal, false-positive partial) is well-judged. **The Win10-Home pinning for the System-Restore-disable step is a precise catch — that step *is* Windows-Home-specific in 2.6.** *Its only problem is evidentiary (§8.2).*
- ✅ **`queue` (Core 2 #2) — sound, no blocking defect.** 4.1 fits (ticketing, documentation); 4.7 as secondary via requester-tone cues is legitimately in the objective. **Band-partition scoring with band-distance penalty is a correctly-specified equivalence model** and gate 6 holds cleanly. **The most honest mobile plan in either document** — ticket cards genuinely *are* the native phone pattern, not a rescued table. Minor: OS pinning is cosmetic here (the archetype is OS-agnostic by nature), which is fine and honestly labelled.
- ⛔ **`rfc` (S-5) — cut from the five, and carrying two defects if ever re-proposed.** (a) 🟠 **Framework-lock — the A+ analogue of vendor-lock.** The **standard / normal / emergency** trichotomy is **ITIL vocabulary**, and `04`'s rendering of obj 4.2 **does not list it** — 4.2's content is documented business processes, request forms, purpose/scope, risk analysis, change board approvals, rollback plan. Importing **a named external framework's taxonomy and scoring against it** marks learners against a body of knowledge the objective did not grant. **Fix: use the objectives' own vocabulary** — seeds may absolutely teach that some changes are pre-approved and routine while others need a board and others are retroactive, **without scoring the learner on whether they picked the correct ITIL noun.** (b) 🟠 **The internal-consistency credit is gameable:** classify everything **standard** (smallest required-field set) and harvest maximum consistency credit for minimum work. **Needs a floor** — cap consistency credit as a fraction of the item, or gate it behind a correct-or-adjacent classification.

---

## 9. Honest limitations — and what would change these lists

### 9.1 Sec+ — the residual bias after the re-run

The Redlib re-run **worked and it mattered**: 2 blog sittings → **9 firsthand r/CompTIA sittings**, +7 net, and it moved two archetypes to A-grade at the family level. `07` §5.3 called this the highest-value action available and it was right. **It was also the last cheap one.**

**All seven biases in §1.5 remain in force.** The three that most constrain what these lists can claim:

1. **Interaction shape is still under-evidenced, and structurally so.** Across all 9 sittings we have solid **exhibit-type** evidence and thin **interaction-shape** evidence — because posters self-censor exactly at the widget layer under NDA caution. **This gap will probably not close through Reddit.** Every archetype design decision that depends on *how* the widget behaves is still inference. That is why `vpntunnel` is A-for-format / C-for-sub-shape, and why the design spanning both sub-types on its scenario axis is a **structural risk mitigation**, not a nice-to-have.
2. **Our richest data is our oldest data.** 5 of 9 sittings are 2024, sitting **right at the 601→701 transition**; only 2 are 2026, and **those two are the thinnest on format.** CompTIA rotates forms. **This is the single biggest weakness left, and no amount of additional r/CompTIA reading fixes it — it is a property of who posts detailed retros and when.**
3. **One source carries most of the specificity.** S1 supplies most of the Clean/Infected/Source detail **and** most of the VPN-form detail. **If S1 is wrong or embellished, both A-grades fall back to thinner corroboration** (S2, S3 — real, but less specific). The A-grades are load-bearing on one person's recall of a 2024 sitting.

**Bounded contamination — the counter-evidence is decent and worth stating.** `01` §3 flagged that both original blog authors studied Dion/Cyberkraft material, so their *expectations* were shaped by the same vendor PBQ list, and recall conforms to expectation. **But the vendor list's MOST confident claim — the firewall rule-ordering drag-drop — is absent from every sitting in both passes.** If recall were strongly conforming to vendor priors, **firewall is the first thing that would have appeared. It didn't.** That materially limits how much contamination can be assumed.

### 9.2 Core 2 — thin evidence, and thinner than the source docs present it

🔴 **Core 2's two "best" survivors trace to ONE person's single sitting.** Neither `03` nor `05` states this plainly, though `03` §3 has all the pieces:

- Format **C2** (mock ticketing system) → **u/FRESH__LUMPIA**, ~2026-07-12.
- Format **C3** (quarantine + services) → **u/FRESH__LUMPIA**, **the same sitting**. `03`'s dedup log correctly notes *"C2 and C3 come from one sitting — formats listed separately but sitting counted once."* ✅

**Therefore S-1 (`queue`) and S-2 (`endpoints`) — Core 2's two evidenced survivors, ranked #2 and #1 — are NOT independent of each other. They are two formats from one person's one sitting. Both are C. They have been ranked accordingly and are NOT double-counted.** `05` §4 presents them as separate rows with separate linkage, which is accurate per-row and **misleading in aggregate**: a reader sees two evidenced survivors and infers two evidentiary bases. **There is one, plus a fragment.**

🔴 **And the fragment is the most generous call in either document.** S-2's claimed *second* sitting rests **entirely** on u/armbarassassin84's phrase: **"The 4th one really tripped me up (quarantine for audio issues)."**

- **One shared keyword** — *quarantine* — not an independent description of the format. **It describes no roster, no service toggles, no per-host console, no isolation mechanic.**
- **The pairing is semantically odd and `03` does not flag it.** Quarantine — a malware-containment action under 2.6 — appearing in an **audio** troubleshooting scenario is strange. Plausible readings: **the user misremembered**; the PBQ was a mixed troubleshooting exhibit where quarantine was one option among distractors; or **"quarantine" was the *wrong* answer that tripped him up.** **None of these establishes a quarantine-plus-services roster console.**
- `03` §5 grades the family **Medium-high** on *"two independent sittings 9 months apart using the same distinctive verb."* **The verb is distinctive — that is the strongest thing that can be said for it, and it is not enough.** A shared verb in an unexplained context corroborates a **word**, not a **format**.

> **Applied here: C3 is recounted as 1 firsthand format description + 1 firsthand keyword corroboration, confidence Low-medium. S-2 is C. Core 2 has no B and never did.** `05`'s *"highest-linkage survivor in the set"* is demoted.

**The honest summary of the Core 2 format corpus: 3 named formats, ~2 sittings, one of which supplies two of the three.** *(`03`'s §1 tier labels also read hotter than its own §5 confidence table — Format C1 is labelled "high confidence" in §1 and "Medium (single source)" in §5. **§5 is right**; the §1 labels should be reconciled down.)*

**Five of six Core 2 ranked rows are C with ZERO sittings** (`settingstree`, `disklayout`, `acl`, and the Core 2 half of `certchain`; `rfc` too, before it was cut). **They are bets on unreported surface, and they are labelled as such** — `05` §4 says so honestly and deserves credit for it. **Attractiveness is not evidence and has not lifted a single grade.**

🟡 **Method limit — mirror retrieval.** Core 2 content came via `redlib.privacyredirect.com`, not reddit.com. Mirror content is faithful in principle, **but the route makes author-history checks (account age, karma, posting pattern) impractical, so "independent accounts" rests on username distinctness alone.** Adequate here — different accounts, 9 months apart, one pass and one fail, no cross-referencing — **but a weaker independence test than a direct session would allow.** The same limit applies to the Sec+ re-run, which used the same route. *(`08` did check the one case that mattered: S7 and S9 both scored 808 within ~3 weeks — different accounts, different backgrounds, different post IDs, **two genuinely independent sittings, not a repost.** That is the trap the prior pass fell into, and flagging that it was checked is exactly right.)*

### 9.3 The firewall-drag-drop lore — the clearest finding in the pass

**The industry's single most confident PBQ claim has ZERO firsthand SY0-701 support after two deliberate hunts.**

- **Firewall PBQs exist:** S6 (*PBQs "all had to do with analyzing logs and configuring firewalls"*), S2 (firewall logs). **+2 sittings for a firewall PBQ existing** — type-(c)-lite: **the exhibit is named, the interaction is not.**
- **Drag-drop firewall rule table: 0 firsthand sittings.** **Nobody in the 701 era described dragging rules into a table or reordering rules.**
- **The closest thing is indirect and does not count:** S4 remarks that Messer's practice PBQs were mostly not accurate to the exam *"except the firewall rule ones."* That implies the exam had *something* firewall-rule-shaped resembling Messer's, **but it is a comparison to third-party prep material, not a description of what he saw.** `08` does not count it as a sitting; **neither does this document, and neither should any downstream work.**
- **Every "drag and drop" search hit was a different exam:** **SY0-501/601** (2020 posts about the drag-drop UI failing under online proctoring) or **Network+ N10-008** (a subnet/protocol drag-drop PBQ). Flagged, not counted.
- **`01`'s strongest apparent supporting quote for this claim was FABRICATED by a search summarizer** and caught by full-page fetch. **The single best piece of research hygiene in the pass — and it would have been the strongest support for the firewall claim.**

> **Verdict: treat "firewall rule table drag-drop on SY0-701" as prep-vendor lore until someone who sat it says otherwise.** The likely root is visible in the record: **the 2020 drag-drop reports are SY0-501.** Their existence is a reason to be **more** suspicious of the claim for 701, not less.
>
> **The disposition is not "build it anyway."** `firewall` is **already shipped** (Net+, 12 seeds). The **evidenced** part — *a firewall config PBQ exists* — is captured by **SE-4, a seed extension, at seed cost.** The **unevidenced** part — the drag-drop rule table — **would have been a duplicate of a shipped archetype anyway (C7, gate 1).** It fails on distinctness before the evidence problem is ever scored.

**The same treatment is owed to two adjacent claims:**
- **Drag-drop into subnet/cloud zones (`08` Claim 3): UNRESOLVED.** Three sittings establish **architecture-construction PBQs exist** (+3 for the *task*); **not one describes how you construct it** (0 for the *interaction*). **Do not upgrade to "confirmed" on the strength of the task existing.**
- **VPN Phase 1 / Phase 2 (`08` Claim 2): UNRESOLVED, 1 sitting, and that sitting is from the SUPERSEDED pass.** **No source in the re-run used the words "Phase 1," "Phase 2," or "site-to-site."** S1's "two concentrators, ~12 fields" is *consistent with* a Phase1/Phase2 split — **inference, not testimony.**

### 9.4 What would change these lists

Ordered by value per unit of effort. **Note that the highest-value item is no longer cheap — the cheap one has been spent.**

| # | Action | Would change |
|---|---|---|
| 1 | **A Core 2 evidence re-run at `08`'s depth.** `03` used the Redlib route but read 12+ threads; `08` demonstrated the higher-yield method on Sec+ — **search-result pages return entire post bodies, ~5x cheaper than thread navigation**, and `javascript_tool` enumerating `a[href*="/r/CompTIA/comments/"]` returns 30 thread URLs in one call. **Core 2 has never had that method applied at that depth.** | **The whole Core 2 list.** Its evidenced tier is **one person**. Sec+ went 2→9 sittings on this method. **Core 2 is the asymmetry now — the same lever, unpulled.** Could confirm or kill `queue`/`endpoints`, and could surface any of the four zero-sitting bets. **Highest value available.** |
| 2 | **Any source outside r/CompTIA** — Discord, TechExams, non-English communities, a non-US test-centre report. | **Bias 4 and 6 simultaneously** (region-unknown for 8 of 9; single-community sample). Both corpora are **one forum, one norm set, one demographic.** The cheapest test of whether the format picture is real or is r/CompTIA's picture of it. |
| 3 | **A 2026 sitting report that describes an interaction, not just an exhibit.** | **Bias 2, 3, and 5 at once** — the self-censorship gap, the exhibit-vs-interaction gap, and the date skew. **One such report is worth more than ten more exhibit-level mentions.** It would settle the `vpntunnel` sub-shape, `fleetlog`'s join, and Claim 3's drag-drop **in a single stroke.** Also the least likely to arrive: **NDA caution is exactly what suppresses it.** |
| 4 | **Any firsthand 701 report of a certificate/PKI, IAM-entitlement, or vulnerability-prioritisation PBQ.** | **`certchain` (#3), `iam` (#4), `vulnq` (#5) — three of five Sec+ rows are bets on unreported surface.** `08` searched for certificate PBQs explicitly and found none, so these are now **searched-and-absent**, not merely unsearched. **A single sighting would move any of them off C.** Equally: continued absence across a third pass is **weak but accumulating** evidence, and would strengthen the case for cutting `vulnq`. |
| 5 | **A failed-sitting format report.** | **Bias 1 (survivorship), which is currently total** — **all 9 Sec+ sittings are passes.** Formats that filter people out are systematically under-described, so the corpus is **structurally blind to the hardest PBQs** — which are precisely the ones worth building. *(Core 2 has one: u/armbarassassin84's fail. It is the source of the weakest claim in the pass.)* |
| 6 | **SY0-801 / V8 draft objectives** (~Oct 2026 preview, **CLAIM**, Training Camp). | **Every Sec+ objective mapping**, all pinned to **Objectives v5.0**. Must be re-checked at the V8 drop. |
| 7 | **A 220-1202 objectives revision dropping Windows 10.** | **`settingstree` (Core 2 #3) specifically.** Win10 hit end of support **October 2025** — nine months before this research date — but is **unambiguously in scope for 220-1202 because 1.3 enumerates its editions explicitly in v3.0, and the doc of record governs.** But **`settingstree`'s bank is built on Win10-vs-Win11 divergence**, so it is **the most exposed archetype in either cert to a quiet objectives revision.** Not a flaw. A monitor item. |
| 8 | **A real analysis of C-13 (Backup Scheme Designer).** | **Core 2's most re-proposable rejection.** Its gate-1 kill vs `raid` is arguable but thin, and rests on a hedge (*"cleared none of the three convincingly"*) — **"unconvincing" is a lower bar than "reskin = reject."** If re-proposed it **deserves a real analysis, not a citation of the existing one.** |

### 9.5 Two things this pass got right that should survive contact with the build stage

Recorded because they are the load-bearing hygiene, and hygiene is what erodes first:

1. **The gate is distinctness, not evidence — and both passes held that line under pressure.** The **most-evidenced Sec+ format claim (C6) died** on gate 1. The **single best-evidenced Core 2 format (C-03) died** on gate 1. **Neither pass flinched.** The temptation to let evidence buy distinctness is exactly what the frozen gate exists to resist. **§7 is the correct home for those wins — not a rescue, a routing.**
2. **The deflations were exemplary, and they are what makes the rest trustworthy.** 16+ prep-vendor SEO domains collapsed to **one bucket scoring zero** · a **fabricated search-summarizer quote caught by full-page fetch and excluded** · the Aaron Higgins comment excluded as promo · the @arminarleet149 Medium post flagged dump-adjacent and excluded from S-4's linkage · the `AddendumWorking9756` "cold terminal" comment excluded as vendor promotion · `ContentAd9144`'s factually-wrong bystander comment discarded · **dump sites and Quizlet not opened at all** · sittings counted as **sittings, not mentions**, in both corpora. **No tier inflation was found in either evidence document.**

---

## Related
[[00-inventory-and-exclusions]] · [[01-secplus-evidence-sittings]] · [[02-secplus-objectives-ecosystem]] · [[03-core2-evidence-sittings]] · [[04-core2-objectives-ecosystem]] · [[05-core2-candidates-gated]] · [[06-secplus-candidates-gated]] · [[07-domain-review]] · [[08-secplus-evidence-redlib-rerun]]
