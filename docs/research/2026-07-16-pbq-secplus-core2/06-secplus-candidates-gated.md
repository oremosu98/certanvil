# Checkpoint 6 — SY0-701 PBQ Candidate Generation & Distinctness Gate

**Date:** 2026-07-16 · **Stage:** candidates → gate (pipeline stage 3–4 of `00-inventory-and-exclusions.md`)
**Inputs:** `00-inventory-and-exclusions.md` (14-archetype exclusion baseline, §3 frozen gate), `01-secplus-evidence-sittings.md` (2 format-bearing sittings), `02-secplus-objectives-ecosystem.md` (SY0-701 Objectives **Version 5.0**, © 2023 CompTIA)
**Scope note:** RESEARCH ONLY. No product code, mockups, or seed content produced or implied as approved.

**Standing rules applied here:**
- Evidence is **not** a gate item. Unevidenced candidates may pass; evidence is linked in §4 and graded at a later stage.
- A candidate failing **any** of the 7 gate items is REJECTED OUTRIGHT and never scored.
- Vendor neutrality is a project requirement (`02-…` §1 "Vendor neutrality" confirms the blueprint itself is vendor-neutral). Any candidate needing a named vendor's console is noted and killed.

---

## 1. Candidate generation log

14 candidates generated. Territories from the brief (identity/access policy, certificate/trust-chain diagnostics, multi-source evidence correlation, vulnerability-remediation prioritisation, data-handling/control selection) are each represented; **no ranking is presumed** and territory membership conferred no protection at the gate — one named territory (data-handling/control selection) produced only rejects.

| # | Candidate (working name) | Territory / origin | Evidence origin | Gate outcome |
|---|---|---|---|---|
| C1 | VPN Tunnel Parameter Negotiation (`vpntunnel`) | config-form; evidence Format A | **Evidenced** (2 sittings) | SURVIVOR |
| C2 | Fleet Infection Attribution (`fleetlog`) | multi-source evidence correlation; evidence Format B | **Evidenced** (2 sittings) | SURVIVOR |
| C3 | Certificate Chain Diagnostics (`certchain`) | certificate/trust-chain diagnostics | Unevidenced | SURVIVOR |
| C4 | IAM Entitlement Review (`iam`) | identity/access policy | Unevidenced | SURVIVOR |
| C5 | Vulnerability Remediation Queue (`vulnq`) | vuln-remediation prioritisation | Unevidenced | SURVIVOR (marginal — see §2.5) |
| C6 | Cloud Zone Component Placement | evidence Format C (drag-drop into subnet zones) | **Evidenced** (1 sitting) | REJECTED — gate 1 |
| C7 | Firewall / ACL Rule Ordering | prep-industry claim | Unevidenced (see `01-…` §5) | REJECTED — gate 1 |
| C8 | Data Classification → Control Selection | data-handling/control selection | Unevidenced | REJECTED — gate 2 |
| C9 | Attack → Mitigation Matching | prep-vendor list | Unevidenced | REJECTED — gate 2 |
| C10 | Port / Protocol Matching | prep-vendor list | Unevidenced | REJECTED — gates 1 + 2 |
| C11 | Incident-Response Phase Ordering (PICERL) | prep-vendor list | Unevidenced | REJECTED — gates 1 + 2 |
| C12 | Cryptographic Algorithm Selection by Use Case | prep-vendor list | Unevidenced | REJECTED — gate 2 |
| C13 | SIEM Detection-Rule Tuning | multi-source evidence correlation | Unevidenced | REJECTED — gates 5 + 6 |
| C14 | Phishing Header / Awareness Triage | obj 5.6 ▶ | Unevidenced | REJECTED — gate 1 |

Two further prep-vendor list entries — **Command Terminal PBQ** and **Wireless Security Configuration** — were generated and killed on sight as one-to-one reskins of the existing `cli` and `wireless` archetypes (gate 1). They are not carried as numbered candidates because they required no analysis; logged here for completeness so they are not silently regenerated later.

**Survivors: 5 of 14. Rejects: 9 of 14.**

---

## 2. SURVIVORS — full documentation

### 2.1 C1 — VPN Tunnel Parameter Negotiation (`vpntunnel`)

**Task chain (3 steps):**
1. **Read** a two-site brief (each site: internal subnet + public IP) plus a written security policy floor (e.g. "no deprecated ciphers", "PFS required", "authentication must not use pre-shared keys for this partner").
2. **Configure Phase 1** on *both* gateways — authentication method, encryption algorithm, DH group, lifetime.
3. **Configure Phase 2** on *both* gateways — local/remote subnet pair, protocol, encryption.

**Exhibit / reference kind:** **NEW** — `configpanel` (a two-column, dual-endpoint parameter form with constrained option sets per field). Not satisfiable by `slots` (slots is positional placement, not typed parameter fields with cross-panel dependency) or `faceplate`.

**Scoring model + equivalence approach:** *Constraint satisfaction, not answer key.* Three independent validator predicates:
- **Symmetry:** Phase-1 params on A must equal Phase-1 params on B; Phase-2 encryption likewise. (Mechanical, deterministic.)
- **Mirror-inversion:** Phase-2 local subnet on A must equal remote subnet on B and vice versa. (Deterministic, and the field's one genuinely satisfying "aha".)
- **Policy floor:** each chosen value must be a member of the scenario's `acceptableSets` (e.g. `{AES-256, AES-192}` both valid where policy says "AES ≥192"). Multiple cipher suites pass; the key is a **set membership test per field**, not a string equality.
Partial credit per predicate. New validator: `simLabValidateTunnelFidelity`.

**Distinctness vs closest existing archetype:** Closest is `firewall` (Firewall Rule Table). Different in all three of task chain (parameter negotiation across two peers vs rule authoring/ordering in one table), scoring model (cross-endpoint symmetry + set-membership vs per-rule match/order correctness), and validator (`…TunnelFidelity` vs `simLabValidateFirewallFidelity`). Second-closest is `wireless` — also a config form, but single-ended with no peer, no symmetry constraint, and no mirror-inversion; its validator has nothing to compare against.

**Objective mapping:** **3.2** — *"Given a scenario, apply security principles to secure enterprise infrastructure"* (▶ hands-on stem). Secondary: **1.4** (appropriate cryptographic solutions). Objectives doc: **SY0-701 Objectives Version 5.0**.

**Mobile plan (375px):** Two panels, never side-by-side on mobile. Site A / Site B as a **segmented toggle** at the top; one gateway's panel visible at a time; Phase 1 / Phase 2 as an inner accordion. Every input is a native `<select>` (touch-native picker, no custom dropdown). A persistent "mirror" summary chip strip shows the other endpoint's current values so the symmetry task doesn't require memory across a toggle. 4–7 fields per visible panel — comfortably within a 375px column. **Honest verdict: good fidelity.** This is a form, not a table; forms are the one thing phones do well.

**Seed-bank scalability:** High. Axes: tunnel type (site-to-site / remote-access full-tunnel / remote-access split-tunnel), policy floor (FIPS-ish / no-PSK / PFS-required / legacy-migration), subnet topology (overlapping subnets requiring NAT-T reasoning), and a deliberate distractor axis (one endpoint pre-populated with a mismatched value the candidate must find). **Estimate: 20–30 distinct scenarios** without repetition.

**Renderer-reuse notes:** Reuses the `configure` step type and the existing option-set rendering. The two-site brief can render via the existing `network` reference kind as a read-only exhibit above the panel — no new topology code. Genuinely new build: the `configpanel` reference kind + `simLabValidateTunnelFidelity`.

---

### 2.2 C2 — Fleet Infection Attribution (`fleetlog`)

**Task chain (3 steps):**
1. **Filter** a central flow log (IP-to-IP, timestamped, deliberately noisy) — the candidate must narrow to the traffic that matters.
2. **Cross-reference** each endpoint's local log against the central flow log.
3. **Label** each endpoint with exactly one state from a closed set: **Clean / Infected / Source**.

**Exhibit / reference kind:** **NEW** — `fleetlog` (host roster + per-host log drawers + one central flow log, with a shared time axis). Not `timeline` (single narrative sequence, one subject) and not `terminal` (one host's command output).

**Scoring model + equivalence approach:** *Per-host classification with a graph invariant.* Two-layer:
- **Layer 1 (per-host):** each host's label scored independently → natural partial credit (n hosts, n points).
- **Layer 2 (invariant):** the scenario is authored so exactly one host is the flow-graph root — the only host with outbound infection flows and no inbound one. The validator asserts the **structural** property (Source = unique root of the derived infection DAG; Infected = reachable from root; Clean = unreachable), not a hard-coded label list. This means the seed author writes the flow log and the labels are **derived**, which both kills authoring drift and makes gate 6 pass on structure rather than on a key.
New validator: `simLabValidateFleetAttributionFidelity`.

**Distinctness vs BOTH log archetypes (required call-out):**
- **vs `incident` (Incident Response, Sec+, 20 seeds)** — closest by domain. `incident`'s chain is *one* narrative timeline → identify the attack / select the IR phase / order the response; scoring is answer selection against a single correct classification of a single event. `fleetlog` never asks what the attack *is* — the attack type is given. Its chain is fleet-wide attribution across n parallel log sources, and its scoring is n independent labels validated against a derived graph. Different task, different scoring model, different validator.
- **vs `triage` (Command-Output Evidence Triage, A+ Core 1, 12 seeds)** — closest by mechanic. `triage` renders **one** `terminal` output and asks the candidate to keep/discard individual lines as relevant evidence; the validator (`simLabValidateEvidenceTriageFidelity`) scores line-level relevance judgements on a single source. `fleetlog` scores **host-level state**, not line-level relevance, and its correctness depends on a *relationship between sources* (a line in host A's log is only meaningful against a corresponding flow in the central log). `triage` has no cross-source join; that join is the entire point of `fleetlog`. Filtering is a means here, not the scored act.

**Objective mapping:** **4.9** — *"Given a scenario, use data sources to support an investigation"* (▶). Secondary: **2.4** (analyze indicators of malicious activity). Objectives doc: **SY0-701 Objectives Version 5.0**.

**Mobile plan (375px) — the flagged risk, addressed:** The evidence describes a **6-endpoint + 1 central log** exhibit. Rendered as a multi-host table, that is a genuine gate-5 failure and would have been rejected. It passes **only** under a mandated mobile-first exhibit contract:
- **No table.** Host roster renders as a vertical **card accordion** — one card per host, collapsed by default, showing host name, a label control, and a 3-icon evidence summary (inbound / outbound / none).
- **Central flow log is a filter surface, not a wall of text**: a chip row (`by host` / `by time window` / `outbound only`) drives a filtered list of ≤8 visible flow rows at a time. Each flow row is a two-line card, not a 5-column row.
- **Seed cap on mobile: 4–5 hosts** (desktop may render 6). The graph invariant works at n=4; the seed author declares `hosts` and the validator derives from whatever n is present, so a 4-host seed is a first-class seed, not a degraded one.
- **Labelling is a segmented control per card** (Clean / Infected / Source), thumb-sized, no drag.
**Honest verdict: acceptable with the contract, unbuildable without it.** If the build ever regresses to a 6-column log table, this archetype fails gate 5 retroactively and should be pulled. Flag this forward to the build spec.

**Seed-bank scalability:** High. Axes: fleet size (4–6), infection topology (single chain / star from one source / two-hop lateral), noise profile (benign backup traffic, a decoy host with alarming-but-clean logs), and evidence type of the central source (firewall flows / DNS / auth). **Estimate: 20–30 distinct scenarios.**

**Renderer-reuse notes:** Reuses `categorize`-style label controls and the existing `timeline` time-axis rendering for the per-host drawer. New build: the `fleetlog` reference kind (roster + filter chips + cross-source join model) and its validator.

---

### 2.3 C3 — Certificate Chain Diagnostics (`certchain`)

**Task chain (3 steps):**
1. **Inspect** a rendered trust chain (leaf → intermediate(s) → root) — each link exposing subject, issuer, SAN list, validity window, key usage, and a revocation status — against a stated client-side symptom ("browser shows NET::ERR_CERT_…-class warning on `shop.example.com`").
2. **Identify** the faulty link(s) and the fault class (expired / name mismatch — SAN absent / broken issuer-subject linkage — missing intermediate / revoked / untrusted root / wrong key usage). More than one fault may be planted.
3. **Select** the remediation for each identified fault from a constrained set.

**Exhibit / reference kind:** **NEW** — `certchain` (a linked chain of certificate detail cards, with the issuer→subject link rendered as an inspectable edge). Not `layered` (concentric/stacked defence bands, no per-node attribute payload, no edge semantics) and not `network`.

**Scoring model + equivalence approach:** *Fault-set + remediation-class equivalence.* Scored in two parts:
- **Fault identification:** set comparison against the planted fault set — deterministic, partial credit per fault, penalty for false-positive fault claims (prevents "flag everything").
- **Remediation:** each fault carries an `acceptableRemediations` **class set**, not one string. Example: a missing-intermediate fault accepts *both* "install the intermediate on the server" and "configure the server to send the full chain" as equivalent-class answers; it does **not** accept "reissue the leaf". Equivalence is declared per fault in the seed, and the validator scores class membership. This is what carries gate 6.
New validator: `simLabValidateCertChainFidelity`.

**Distinctness vs closest existing archetype:** Closest is `diagram` (Diagram/Topology) — both render linked nodes. But `diagram` scores **placement** of a node into a zone (`correctPlacements` device→zone string match); `certchain` places nothing. Its scored act is attribute-level fault detection on a fixed structure plus a remediation selection — a read-and-diagnose chain, not a build-and-place chain, with no positional scoring at all. Second-closest is `defense` (Defense in Depth), which is control-layer selection, not artifact inspection.

**Objective mapping:** **1.4** — *"Explain the importance of using appropriate cryptographic solutions"* (PKI, certificates, revocation are enumerated here). Objectives doc: **SY0-701 Objectives Version 5.0**. **Gate-4 note:** 1.4 is a current final objective and satisfies gate 4 as written ("maps to a current final official objective"). It is *not* a ▶ "Given a scenario" stem — that is an **evidence/priority** signal, graded later, not a gate failure. Recorded explicitly so the later ranking stage sees it.

**Mobile plan (375px):** Vertical chain — leaf at top, root at bottom, connected by a visible edge rail down the left gutter. One certificate card per row; tapping expands its attribute list. The issuer→subject edge carries its own tappable state chip (`linked` / `broken`), so the relational fault is inspectable without a two-dimensional layout. Chains are 3–4 links — a natural vertical fit. Fault + remediation selection are per-card segmented controls. **Honest verdict: good fidelity.** Vertical chains are the phone's best case.

**Seed-bank scalability:** High. Axes: fault class (7+ listed above), fault count (1–2 planted), chain depth (2 or 3 intermediates), symptom framing (browser / API client / mutual-TLS handshake failure), and a red-herring axis (a genuinely expired *root* that is irrelevant because a cross-signed path exists). **Estimate: 25–35 distinct scenarios** — fault classes multiply cleanly against chain shapes.

**Renderer-reuse notes:** Reuses the `analyze` step type for fault identification and existing option-set rendering for remediation. New build: the `certchain` reference kind + validator. Vendor-neutral by construction — a generic certificate detail card, not a named browser's or CA's UI.

---

### 2.4 C4 — IAM Entitlement Review (`iam`)

**Task chain (3 steps):**
1. **Read** an access-request / audit-finding brief plus a stated policy (least privilege; a named separation-of-duties rule; a joiner-mover-leaver event).
2. **Adjust** a subject × permission entitlement grid — grant, revoke, or leave — including group-inherited permissions rendered as inherited (so revoking at the user level is visibly insufficient).
3. **Resolve** the flagged SoD conflict by choosing where to cut (which of two conflicting entitlements to remove, given a business-need note).

**Exhibit / reference kind:** **NEW** — `entitlements` (subject × permission grid with inheritance provenance per cell: `direct` / `via <group>` / `none`). Existing `slots` is single-axis placement with no provenance; this needs a two-axis grid whose cells carry a *source*, and the inheritance mechanic is the whole lesson.

**Scoring model + equivalence approach:** *Invariant satisfaction — mandatory, per gate 6.* There is no answer key. The validator asserts four declared invariants over the final grid state:
- **Sufficiency:** every entitlement in the scenario's `requiredAccess` set is still effective for its subject.
- **Least privilege:** no entitlement in `excessAccess` remains effective (effective = direct OR inherited — a revoke at the wrong level fails this).
- **SoD:** no subject holds both halves of any declared `sodPair`.
- **Blast radius:** the count of changes must not exceed `maxChanges` — prevents "revoke everything" from satisfying invariants 2 and 3.
Multiple end-states satisfy all four (cut the group membership vs cut the group's permission vs move the user to a narrower group) and **all of them score full marks**. Partial credit per invariant. New validator: `simLabValidateEntitlementFidelity`.

**Distinctness vs closest existing archetype:** Closest is `soho` (SOHO configuration, A+ Core 1) — both are "set things correctly per a brief". But `soho` scores field values against expected settings; `iam` scores a **derived effective-permission set** against declared invariants, where the inheritance graph means the same effective state is reachable by several different edits and the validator must accept all of them. Neither `soho`'s validator nor any existing one computes an effective-state derivation. `defense` is control-*layer* selection, not subject-level entitlement.

**Objective mapping:** **4.6** — *"Given a scenario, implement and maintain identity and access management"* (▶). Objectives doc: **SY0-701 Objectives Version 5.0**.

**Mobile plan (375px):** **No grid on mobile.** The exhibit pivots to a **subject-first list**: one card per subject; tapping opens that subject's permission list with provenance badges (`direct` / `via Finance-Group`) and a per-row grant/revoke toggle. A sticky "Policy" summary bar keeps the invariants visible. An SoD violation surfaces as an inline warning chip on the offending card, not as a cell colour the candidate must scan a matrix for — which is precisely the interaction a 375px grid cannot deliver. Scenarios capped at **4 subjects × 5 permissions**. **Honest verdict: acceptable on the pivot; a rendered matrix at 375px would fail gate 5.** Flag to build spec alongside C2's contract.

**Seed-bank scalability:** High. Axes: event type (new hire / role change / contractor offboard / audit finding / break-glass request), inheritance depth (direct-only / one group / nested groups), SoD pair domain (finance, change management, security-admin vs auditor), and a trap axis (an entitlement that *looks* excessive but is in `requiredAccess`). **Estimate: 25–35 distinct scenarios.**

**Renderer-reuse notes:** Reuses `configure`-style toggles and the existing brief/exhibit split. New build: `entitlements` reference kind (with the provenance model) + the effective-state derivation in the validator. Vendor neutrality: generic subject/group/permission vocabulary — **must not** reproduce a specific cloud provider's IAM console; that would violate neutrality and is the single most likely design drift here. Noted as a build constraint.

---

### 2.5 C5 — Vulnerability Remediation Queue (`vulnq`) — **MARGINAL SURVIVOR**

**Task chain (3 steps):**
1. **Read** a scan report — findings with CVSS base score, affected asset, and an asset-context sheet (internet-facing?, data classification, compensating control present?, exploit-in-the-wild flag, patch availability, change-window constraint).
2. **Assign a disposition** per finding: remediate now / remediate in next window / mitigate (compensating control) / accept (with a stated risk owner) / defer as false positive.
3. **Order** the "remediate now" subset into a work queue.

**Exhibit / reference kind:** **NEW** — `findings` (finding cards, each with a CVSS chip + an expandable asset-context panel + a disposition control). Not `timeline`, not `terminal`.

**Scoring model + equivalence approach:** *Pairwise dominance, not sequence equality.* This is the load-bearing distinction:
- **Disposition** is scored per finding against an `acceptableDispositions` set — several findings legitimately accept two dispositions (a high-CVSS finding behind a documented compensating control accepts both *mitigate* and *remediate-in-window*; it does not accept *accept*).
- **Ordering** is **not** compared to a canonical sequence. The seed declares a set of `mustPrecede` pairs derived from stated rules (exploited-in-the-wild internet-facing outranks a higher-CVSS internal finding). The validator checks the candidate's ordering against the **partial order** — every ordering consistent with the declared precedences scores full marks. There is no single right queue.
New validator: `simLabValidateRemediationFidelity`.

**Distinctness vs closest existing archetype:** Closest is `incident` (Incident Response) — the only other Sec+ archetype involving sequencing. `incident` sequences **response phases against one unfolding event**, scored as a canonical sequence; there is no attack and no timeline here — the input is a static scan report, and correctness derives from *asset context overriding raw severity*, which is the actual teaching point and appears nowhere in `incident`. Scoring differs fundamentally: canonical sequence equality vs partial-order consistency.

**Why marginal (honest gate-2 note):** the `order` step type exists, and a lazy reading of this candidate is "`order` over a new reference kind" — which gate 2 would kill. It survives on two grounds that must hold in the build or it should be pulled: (a) the **disposition** step is a genuinely new interaction that precedes and gates the ordering step (only the remediate-now subset is ordered — the queue's *membership* is candidate-determined, which no existing archetype does), and (b) the **partial-order validator** is a new scoring model, not a reuse of sequence comparison. If the build drops the disposition step and ships a plain drag-to-order list, **it becomes a thin variant and fails gate 2.** Recorded as a build-spec condition, and flagged to the ranking stage as the least robust survivor.

**Objective mapping:** **4.3** — *"Explain various activities associated with vulnerability management"* (prioritization, CVSS, compensating controls, exception/exemption are enumerated here). Secondary: **5.2** (risk management — acceptance/mitigation/transfer). Objectives doc: **SY0-701 Objectives Version 5.0**. Same non-▶ note as C3: gate 4 is satisfied; the knowledge-level stem is an evidence/priority signal for later.

**Mobile plan (375px):** Finding **cards**, not a scan table — CVSS chip + asset name + 2 context icons visible collapsed; tap expands full context. Disposition is a segmented control per card. The ordering step re-renders only the remediate-now subset (typically 3–4 cards) as a reorderable list using **up/down buttons, not drag** — drag-reorder inside a scrolling column is a known 375px failure, and up/down is the honest choice. **Honest verdict: acceptable.** Scenarios capped at **6 findings**.

**Seed-bank scalability:** Moderate-to-high. Axes: finding mix (6 from a large pool of CVE-archetypes), the override rule in play (exploit-in-wild / internet-facing / data classification / compensating control / no-patch-available), change-window constraint, and a trap axis (the highest-CVSS finding is correctly *not* first). **Estimate: 15–25 distinct scenarios** — lower than the other survivors because the override rules are a small closed set and repetition becomes visible faster.

**Renderer-reuse notes:** Reuses `order` and `categorize` step types for the interaction layer. New build: `findings` reference kind + the partial-order/disposition validator. Vendor-neutral (generic scan-report grammar, no named scanner UI).

---

## 3. REJECTED — gate item failed, with reasons

Gate items quoted verbatim from `00-inventory-and-exclusions.md` §3.

### C6 — Cloud Zone Component Placement — **FAILS GATE 1**
> *1. Distinct from all 14 archetypes in task chain, scoring model, OR validator. Reskin = reject.*

Drag components (instances, load balancer, database, WAF) into public / private / undecided subnet zones. This **is** the existing `diagram` archetype (Net+, 16 seeds): same task chain (drag node → zone), same scoring model (`correctPlacements` device→zone string match), same validator (`simLabValidateNetworkFidelity`). The only novelty — the "undecided" subnet the candidate must first classify — is one extra placement decision, not a new interaction; it is expressible as a zone whose membership is itself scored, which `correctPlacements` already supports. Reskin with a security-flavoured node vocabulary. **Notable:** this is the *most-evidenced* format-C claim in `01-…` and it still dies, because **the gate is distinctness, not evidence**. Correct disposition is not a new archetype but a **Sec+ seed extension to `diagram`** (add cloud/zone node vocabulary + WAF/LB node types) — routed to the domain-review stage as a seed proposal, not an archetype candidate.

### C7 — Firewall / ACL Rule Ordering — **FAILS GATE 1**
> *1. …Reskin = reject.*

Straight duplicate of the existing `firewall` archetype (Net+, 12 seeds) — rule table, ordering/shadowing, `simLabValidateFirewallFidelity`. No task or validator difference; only the scenario framing changes from network to security, which is a seed concern. Separately worth recording: per `01-…` §5 this format has **zero firsthand sitting support**, and the strongest apparent supporting quote was **fabricated by a search summarizer**. It fails on distinctness regardless, so the evidence problem never gets scored — but the pairing (industry's most confident claim, zero evidence, and a duplicate anyway) is the single clearest reason not to prioritise it.

### C8 — Data Classification → Control Selection — **FAILS GATE 2**
> *2. Not buildable purely from existing primitives with no new interaction.*

Classify data assets (public/internal/confidential/regulated), then select handling controls (encryption at rest, DLP, tokenisation, retention). Step 1 is the existing **`categorize`** primitive; step 2 is the existing **`match`** primitive; both run over existing reference kinds. No new interaction, no new validator — the scoring is per-item classification correctness, which every categorize-based archetype already does. This is a *content* idea, not an archetype: it belongs in the standard question bank or as `defense` seeds. The brief named data-handling/control selection as a territory worth investigating; investigated, it produces no distinct format. Territory membership earned it no protection.

### C9 — Attack → Mitigation Matching — **FAILS GATE 2**
> *2. Not buildable purely from existing primitives with no new interaction.*

The `match` primitive over the existing `attack` reference kind. Literally the two things already in the inventory, composed in the obvious way. Zero new interaction. (Also unevidenced — `01-…` §1 lists it under zero-firsthand-support — but gate 2 kills it first.)

### C10 — Port / Protocol Matching — **FAILS GATES 1 + 2**
> *1. …Reskin = reject.* · *2. Not buildable purely from existing primitives…*

Gate 1: the existing `portmap` archetype (Net+, 12 seeds, `simLabValidatePortMapFidelity`) already is this. Gate 2: absent `portmap`, it would still be `match` over existing reference kinds. Fails twice.

### C11 — Incident-Response Phase Ordering (PICERL) — **FAILS GATES 1 + 2**
> *1. …Reskin = reject.* · *2. Not buildable purely from existing primitives…*

Gate 1: the existing `incident` archetype (Sec+, 20 seeds) is the Incident Response archetype, on the `timeline` reference kind; phase ordering is inside its remit and plausibly already in its 20 seeds. Gate 2: the residue is the `order` primitive over `timeline` — no new interaction. Fails twice.

### C12 — Cryptographic Algorithm Selection by Use Case — **FAILS GATE 2**
> *2. Not buildable purely from existing primitives with no new interaction.*

Pick the algorithm/mode per use case = the `categorize` (or `match`) primitive over a static list. Nothing new to build; the "PBQ" is a multi-select MCQ wearing a costume. Note this is *not* an argument against the content — obj 1.4 crypto-selection content belongs in the question bank — only against it being an archetype.

### C13 — SIEM Detection-Rule Tuning — **FAILS GATES 5 + 6**
> *5. Honest mobile fidelity at 375px (logs/tables/panels usable, not merely present).* · *6. Deterministic or equivalence-aware scoring (multi-valid answers need a defined equivalence model).*

Given an alert firing on false positives, tune the detection rule (thresholds, time windows, exclusion conditions) to suppress noise without suppressing the true positive.
- **Gate 6 (primary kill):** the valid-answer space is **unbounded and continuous**. A threshold of 5, 6, 7, or 12 may all "work"; an exclusion on source-IP, on user-agent, or on process-parent may all suppress the noise. Unlike C4 (where invariants close the space over a *finite* entitlement graph) or C1 (where option sets are enumerable), there is no way to declare an equivalence model over an open numeric-plus-boolean-expression space without either (a) degenerating to a hard-coded key — which gate 6 explicitly forbids for multi-valid scenarios — or (b) building a rule *interpreter* that replays the rule against the log corpus, which is a different and much larger product than a PBQ validator. Attempted and abandoned during generation; recording the attempt so it is not re-litigated.
- **Gate 5 (independent kill):** a rule editor with condition builders, boolean nesting, and a live match-count preview against a log corpus is exactly the "config panel that is present but not usable" case gate 5 names. At 375px there is no honest version.
Two independent failures; not scored.

### C14 — Phishing Header / Awareness Triage — **FAILS GATE 1**
> *1. Distinct from all 14 archetypes in task chain, scoring model, OR validator. Reskin = reject.*

Render a suspicious email (headers, SPF/DKIM/DMARC results, body, links) and have the candidate flag the indicators that make it phishing. Compared against the existing **`triage`** archetype (Command-Output Evidence Triage, A+ Core 1, 12 seeds, `simLabValidateEvidenceTriageFidelity`): **same task chain** (scan one rendered text artifact, mark individual lines/elements as evidence vs noise), **same scoring model** (per-line relevance judgement, partial credit, false-positive penalty), **same validator shape** — `simLabValidateEvidenceTriageFidelity` would score it unchanged with only a reference-kind swap from `terminal` to an email view. That swap is a reskin, which gate 1 names explicitly. Obj 5.6 (▶) content is real and worth covering; this is the right *content* on the wrong *pretext*. Correct disposition: **Sec+ seeds for the existing `triage` archetype**, routed to domain review.

---

## 4. Evidence linkage per survivor

**No confidence grading here** — that is the ranking stage. This section records only *what the evidence base is*, per `01-secplus-evidence-sittings.md`, whose own caveats govern: **2** independent format-bearing sittings total (Rajanish, Hashnode, SY0-701 stated, ~Jun 2024; Medeiros, Medium, SY0-701 inferred by retirement date, ~Apr 2025); the r/CompTIA corpus is **entirely absent** (403/blocked by every route); one vivid supporting quote was **fabricated by a search summarizer** and excluded; the whole corpus is the fetchable-blog slice and is biased.

| Survivor | Evidence status | Linkage |
|---|---|---|
| **C1 `vpntunnel`** | **EVIDENCED** | `01-…` §1 **Format A** — "VPN configuration form", **2 independent sittings**, both firsthand. Caveat carried forward verbatim from the source: the two sittings describe **different VPN sub-types** — Rajanish "full tunnel" (remote-access shape), Medeiros site-to-site with Phase 1/Phase 2 panels. *"A VPN config PBQ exists"* rests on 2 sittings; *"it is specifically a site-to-site Phase1/Phase2 form"* rests on **1** (Medeiros). The C1 design above spans both sub-types on its scenario axis, so it does not depend on the single-sourced sub-shape. |
| **C2 `fleetlog`** | **EVIDENCED** | `01-…` §1 **Format B** — "multi-host log analysis → classify each endpoint", **2 independent sittings**, both firsthand, ~10 months apart, authors with no visible connection. The source calls this *"the strongest claim in this report."* Caveat carried forward: the **sub-shape** (per-host label assignment against a cross-referenced central flow log; Clean/Infected/Source) is detailed by **Medeiros only**; Rajanish corroborates the task goal ("identify infected endpoints in a compromised network") but not the interaction mechanics. C2's scored act is the sub-shape — so the mechanic is single-sourced even though the task is twice-attested. |
| **C3 `certchain`** | **UNEVIDENCED** | `01-…` §1 lists "**Certificate / PKI** viewer or troubleshooting PBQ" explicitly under *"Format claims with ZERO firsthand sitting support (found only in prep/SEO content)."* No sitting describes it. Passed the gate on distinctness and buildability alone, as the gate permits. |
| **C4 `iam`** | **UNEVIDENCED** | No sitting describes an IAM PBQ. Adjacent-only support: `02-…` §1 notes obj **4.6** is one of the seven ▶ "Given a scenario" stems and that Dion's PBQ pack *claims* "access control" coverage (a **CLAIM**, vendor-authored, and `01-…` §3 collapses all prep-vendor lists to **zero sittings** and flags a circularity risk — both sitting authors studied Dion/Cyberkraft material). Blueprint stem ≠ confirmed exam format (`02-…` standing epistemic rule). |
| **C5 `vulnq`** | **UNEVIDENCED** | No sitting describes a vulnerability-prioritisation PBQ; it is not even on `01-…`'s zero-support list — it did not surface in the corpus at all, from sittings *or* vendors. Purely blueprint-derived (obj 4.3 / 5.2). This is the thinnest evidence base of the five **and** it is the marginal gate-2 survivor (§2.5) — the ranking stage should weigh both facts together. |

**Cross-cutting, carried forward to ranking:** `01-…` §2 establishes the report's best-evidenced finding (4 independent firsthand sittings) is **structure, not format** — PBQs are front-loaded, skippable/flaggable with work saved, **few (2–3 observed)**, and time-expensive. And `02-…` §3 records that **mobile PBQ practice is an empty niche** — Pocket Prep owns mobile with no PBQs; nobody surveyed claims a usable phone-sized drag-drop/log PBQ. That is the strategic context for why gate 5 was applied as hard as it was here (C2 and C4 both required an exhibit pivot to pass; C13 died on it).

## 5. Outputs routed to later stages

- **Domain review:** C6 → seed extension to `diagram` (cloud-zone vocabulary, WAF/LB node types). C14 → Sec+ seeds for `triage` (email/header artifacts).
- **Build-spec conditions (archetype fails retroactively if dropped):** C2's no-table mobile contract (card accordion + filter chips, 4–5 hosts); C4's subject-first mobile pivot (no 375px matrix) **and** its vendor-neutral IAM vocabulary; C5's disposition step (without it, gate 2 failure).
- **Monitor:** `02-…` §2 — SY0-801 / V8 draft objectives reportedly exist (CLAIM, Training Camp); preview ~Oct 2026. Every objective mapping above is pinned to **SY0-701 Objectives Version 5.0** and must be re-checked at the V8 drop.
