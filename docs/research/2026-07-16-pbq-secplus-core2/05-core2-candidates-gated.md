# Checkpoint 5 — A+ Core 2 (220-1202) PBQ archetype candidates, gated

**Date:** 2026-07-16 · **Stage:** candidates → gate (per pipeline in `00-inventory-and-exclusions.md`)
**Objectives doc of record:** CompTIA A+ Core 2 (220-1202) V15 — **Exam Objectives Document Version 3.0** (© 2024 CompTIA), 4 domains, 36 objectives, 23 "Given a scenario".
**Exclusion baseline:** the 14 existing archetypes (diagram, defense, wireless, firewall, cli, discovery, portmap, wiremap, soho, triage, pcbuild, raid, incident, + planned swatch/Laser Print Defect Clinic).
**Gate applied:** §3 of `00-inventory-and-exclusions.md`, all 7 items, verbatim. Any single failure = rejected outright, never scored.

> **Scope note:** this is research only. No archetype below is approved for build; survivors proceed to domain review + ranking.

---

## 1. Candidate generation log

14 candidates generated. Evidence linkage is recorded but **not graded here** — grading is a later stage. `[E]` = grounded in a firsthand 220-1202 format claim in `03-core2-evidence-sittings.md`; `[U]` = **unevidenced**, proposed on objective/format plausibility only.

| # | Candidate (working name) | Origin | Evidence tag |
|---|---|---|---|
| C-01 | Ticket-Queue Triage Console | Format C2 (mock ticketing system, u/FRESH__LUMPIA ~2026-07-12) | **[E]** |
| C-02 | Quarantine & Services Console | Format C3 (2 independent sittings, 2025-10 + 2026-07) | **[E]** |
| C-03 | Interactive Windows/Linux Shell (`help`-discoverable) | Format C1 (u/Klutzy-Astronaut-280, 2026-05-29) | **[E]** |
| C-04 | Social-Engineering Classify/Match | Format C4 (u/still6shawtyy, 2026-05) | **[E]** |
| C-05 | SOHO Security Configuration | Format C5 (hedged wording, same source as C4) | **[E]**, weak |
| C-06 | Malware-Removal Ordering Ladder | 2.6 objective shape; classic 1102 folklore | **[U]** (no 1202 firsthand ordering-PBQ report — see Gaps, §5 of 03) |
| C-07 | Windows Settings Path Locator | 1.6 objective | **[U]** |
| C-08 | NTFS / Share Effective-Access Workbench | 2.2 objective; permissions claim exists only in the low-confidence Medium post | **[U]** |
| C-09 | WinRE / Boot-Repair Escalation Ladder | 1.2 + 3.1 objectives | **[U]** |
| C-10 | Mobile Device Security Profile Builder | 2.8 + 3.3 objectives | **[U]** |
| C-11 | Browser Security Hardening Panel | 2.11 objective (new in V15) | **[U]** |
| C-12 | Change-Advisory RFC Board | 4.2 objective | **[U]** |
| C-13 | Backup Scheme Designer (RTO/RPO) | 4.3 objective | **[U]** |
| C-14 | Disk & OS Deployment Planner (GPT/MBR) | 1.2 objective | **[U]** |
| C-15 | Certificate / Security-Warning Adjudicator | 3.4 + 2.11 objectives | **[U]** |
| C-16 | Scripting Workbench | 4.8 objective | **[U]** |
| C-17 | AI Use-Policy Adjudicator | 4.10 objective (new in V15) | **[U]** |
| C-18 | Event Viewer Log Correlation | 3.1/3.4 objectives | **[U]** |
| C-19 | Remote Access Technology Selector | 4.9 objective | **[U]** |
| C-20 | Windows Feature/Tool Selector | 1.4 objective | **[U]** |

(20 generated — the brief asked for 10–14; the extra six are mostly obvious-and-doomed ideas kept deliberately so the rejection record covers the space a future reader would otherwise re-propose.)

---

## 2. SURVIVORS (7)

All seven pass all 7 gate items. Order below is generation order, **not** rank.

---

### S-1 · Ticket-Queue Triage Console  `[E — Format C2]`

**OS pinning:** Windows 10 **and** Windows 11 both in scope (per the objectives PDF "NOTE ON WINDOWS 11"); each seed pins one explicitly in metadata. Tickets may reference iOS/iPadOS/Android endpoints as *subjects* (1.1 enumerates them) without requiring a mobile-OS deep dive.

**Task chain (4 steps):**
1. **Read** a queue of 6–8 inbound tickets (requester, stated symptom, business context, SLA clock, channel).
2. **Prioritize** — assign each ticket to a severity/priority band (P1…P4) rather than a strict 1..8 ordering.
3. **Route/select solution** — for the top 2–3 tickets, pick the appropriate first action from a scoped option set.
4. **Document** — complete the required ticket fields (categorization, escalation target) for one ticket.

**Exhibit / reference kind:** **NEW** — `queue`. A scrollable list of ticket cards; each card expands in place to a detail sheet. Not satisfiable by any existing reference kind (`network`, `attack`, `timeline`, `layered`, `terminal`, `slots`, `faceplate`, `wiremap`, `swatch`).

**Scoring model + equivalence:** band-assignment scoring, **not** permutation scoring. Equivalence model: tickets within the same priority band are interchangeable — the scorer compares the *partition* the learner produced against the reference partition, so any intra-band order scores full. Cross-band misplacement is scored by band distance (P1→P2 is a near-miss, P1→P4 is a full miss). Solution-select and field-completion steps are strictly deterministic. This is a defined equivalence model, so gate 6 holds.

**Distinctness — closest existing archetype: `triage` (Command-Output Evidence Triage, Core 1).** Difference: `triage` presents *machine-generated command output* and asks the learner to rank which evidence lines are diagnostic. S-1 presents *human-authored ticket prose* and asks for business-priority banding against SLA + impact + scope — a judgement about people and urgency, not about diagnostic signal. Different exhibit, different validator, different failure mode (misreading business impact vs misreading a command's output). Second-closest is `incident` (Sec+) — but `incident` is a single unfolding security event, not a contended multi-request queue.

**Objective mapping:** **4.1** (Given a scenario, implement best practices associated with documentation and support systems information management — ticketing, knowledge base). Secondary: **4.7** (proper communication techniques and professionalism) via requester-tone cues.

**Mobile plan (375px, honest):** ticket cards are the *natural* mobile form — a vertical list of cards with a tap-to-expand detail sheet is a first-class phone pattern, not a squeezed desktop table. Priority assignment is a per-card segmented control (P1–P4 chips, ~44px touch targets), never drag-into-columns. No horizontal scroll anywhere. This passes item 5 genuinely.

**Seed-bank scalability:** high. Variation axes multiply: severity mix (one true P1 vs none), scope (single user / department / site-wide), decoys (loud-but-trivial VIP request vs quiet-but-critical infrastructure), SLA pressure, channel. Estimate **20–30 distinct scenarios** without repetition.

**Renderer reuse:** new `queue` renderer + new validator (`simLabValidateTicketQueueFidelity`). Reuses the existing card/chip CSS conventions and the `analyze`/`fillin` step machinery for steps 3–4.

---

### S-2 · Quarantine & Services Console  `[E — Format C3, 2 independent sittings]`

**OS pinning:** Windows 11 default; Windows 10 variants for seeds that hinge on Home-edition behaviour (System Restore disable step in 2.6 is Windows-Home-specific).

**Task chain (3 steps):**
1. **Identify** the compromised host from a small endpoint console (5–7 workstations, each with a status strip: alerts, outbound connections, running-service summary).
2. **Isolate** exactly the right host(s) — a quarantine toggle per machine. Over-quarantining (isolating clean hosts) is penalized, not ignored.
3. **Harden** — per-workstation service enable/disable matrix: turn off the specific services that constitute the exposure, leave the business-critical ones running.

**Exhibit / reference kind:** **NEW** — `endpoints`. A roster of host tiles, each with an expandable service list. Distinct from the `network` reference kind, which is a *topology* (nodes + links + zones); `endpoints` has no links and no topology — it's a management-console roster where the interesting state is per-host service posture.

**Scoring model + equivalence:** fully deterministic set-comparison. Quarantine step = exact set match on hosts (with asymmetric penalty: false-negative on the infected host is fatal, false-positive on a clean host is a partial deduction). Service matrix = per-service tri-state (must-disable / must-keep / don't-care), where `don't-care` services are explicitly enumerated per seed so the scorer never has an undefined cell. No equivalence model needed — the scoring is total.

**Distinctness — closest existing archetype: `incident` (Sec+, 20 seeds).** This is the riskiest distinctness call in the set and it was checked hard. `incident`'s chain is *evidence → analyze → order the remediation steps*: a temporal chain over an `attack`/`timeline` exhibit. S-2's chain is *spatial selection + per-host state toggling* on a roster exhibit: which box, and which switches inside that box. No ordering. No timeline. The learner never sequences anything. The failure modes are disjoint — `incident` punishes doing the right things in the wrong order; S-2 punishes touching the wrong machine or killing a service the business needs. Different validator, different exhibit, different cognitive skill. **Verdict: passes item 1 on task chain AND scoring model AND validator** (item 1 only requires one).
Second-closest is `firewall` (Net+) — rule-set config against requirements, a different object entirely (rules on a boundary vs services on a host).

**Objective mapping:** **2.6** (Given a scenario, implement procedures for basic SOHO malware removal — the quarantine step) and **2.7** (Given a scenario, apply workstation security options and hardening techniques — explicitly lists *disable unused services*). Both are current final "Given a scenario" objectives in v3.0.

**Mobile plan (375px, honest):** host tiles stack as a single-column list; each tile carries a status strip and a quarantine toggle inline (no drill-down needed for step 2). The service matrix — the risk area — is **not** rendered as a grid on mobile. It renders as one host's service list at a time (host selected from a chip row), each service a labeled row with a switch. This is the iOS Settings pattern; it is genuinely usable with a thumb. Item 5 passes because the matrix was designed as a list-per-host from the start rather than a desktop table with `overflow-x`.

**Seed-bank scalability:** high. Axes: infection vector, which host (never the loudest), service mix, decoy hosts with benign anomalies, business-critical service that *must* survive, single-host vs two-host compromise. Estimate **18–25 distinct scenarios**.

**Renderer reuse:** new `endpoints` renderer + `simLabValidateEndpointConsoleFidelity`. Reuses the toggle/switch primitives from `firewall`'s rule editor and the tile CSS from `portmap`.

---

### S-3 · Windows Settings Path Locator  `[U — unevidenced]`

**OS pinning:** each seed pins Windows 10 **or** Windows 11 explicitly — this archetype is *about* the path, and the paths diverge (Settings app reorganization in 11, Control Panel deprecation state). The pinning is the pedagogy, not an afterthought.

**Task chain (3 steps):**
1. **Read** a user request in plain language ("my second monitor keeps going to sleep before the first one").
2. **Navigate** a simulated Settings/Control Panel tree — click through breadcrumbs to reach the terminal pane. Wrong branches are enterable and back-navigable (the cost is moves, not instant failure).
3. **Set** the specific control on the terminal pane.

**Exhibit / reference kind:** **NEW** — `settingstree`. A navigable hierarchy with a breadcrumb bar and a terminal-pane leaf. No existing reference kind is navigable — every one of the nine existing kinds is a flat single-screen exhibit. Navigation-with-history is the genuinely new interaction, and it is what makes this not a `configure` recombination.

**Scoring model + equivalence:** **equivalence-aware, model defined.** Windows deliberately exposes many settings via two or three routes (Settings app / Control Panel / an MMC snap-in). The scorer accepts **any path whose terminal node is in the seed's `acceptedTerminals` set**, then scores the control value deterministically. Efficiency (move count vs shortest accepted path) is reported as feedback but does **not** gate correctness — this keeps the model honest rather than punishing a legitimate route. Each seed must enumerate `acceptedTerminals`; a seed with an unenumerated route is a content bug, caught by fidelity validation.

**Distinctness — closest existing archetype: `soho` (Core 1, 12 seeds).** `soho` is a *flat* config form: every control is on screen, the task is choosing values. S-3's task is *finding* the control — the value-setting is the trivial last step. Removing the navigation removes the archetype entirely; removing navigation from `soho` changes nothing. Different validator (path-acceptance vs value-match), different exhibit (tree vs form), different skill (Windows spatial memory vs security-config knowledge).

**Objective mapping:** **1.6** (Given a scenario, configure Microsoft Windows settings — Settings app vs Control Panel; this objective's *explicit* Settings-vs-Control-Panel framing is exactly this archetype). Secondary: **1.4** (use Microsoft Windows OS features and tools).

**Mobile plan (375px, honest):** a navigable tree is the best-suited exhibit in this whole candidate set for a phone — it's a drill-down list, the canonical mobile navigation pattern. Breadcrumb collapses to a back chevron + current-node title. Terminal panes are single-column setting rows. Zero compromises at 375px.

**Seed-bank scalability:** very high — Windows has an enormous settings surface, and 1.6 spans display, network, accounts, updates, power, storage, apps, privacy, devices, time/language. Two OS versions multiply it. Estimate **30–40+ distinct scenarios**, the largest bank in the set.

**Renderer reuse:** new `settingstree` renderer + `simLabValidateSettingsPathFidelity`. Reuses `configure` step machinery for the terminal-pane control only.

---

### S-4 · NTFS / Share Effective-Access Workbench  `[U — unevidenced]`

**OS pinning:** Windows 10/11 (both; NTFS semantics are identical across them). ReFS noted as in-scope-in-1.1 but out of scope for this archetype's mechanics.

**Task chain (3 steps):**
1. **Read** the exhibit: a folder with an NTFS ACL and a share ACL, plus 2–3 group memberships per user.
2. **Compute** — for each of 3–4 named users, state the *effective* access when reached over the network, and (separately) when reached locally at the console.
3. **Explain** — select which single ACE is the decisive one for one named user.

**Scoping decision that makes this survivable (gate 6):** the archetype asks the learner to **compute** effective access, never to **author** an ACL that achieves a goal. Computation is single-valued and total: cumulative allow across group memberships → explicit deny wins → for network access, the *more restrictive* of (effective NTFS, effective share). The authoring direction is many-to-one and would have failed item 6; it is explicitly out of scope and must stay out. Scoring is therefore **fully deterministic**, no equivalence model required. Step 3 (decisive ACE) is single-answer by construction — seeds are authored so exactly one ACE is decisive.

**Exhibit / reference kind:** **NEW** — `acl`. Paired permission tables (NTFS + share) plus a group-membership block.

**Distinctness — closest existing archetype: `triage` (Command-Output Evidence Triage).** Both present a static exhibit and ask for a read. Difference: `triage` asks *which lines matter* (a selection/ranking over evidence); S-4 asks the learner to **execute a precedence algorithm** over two tables and produce a computed result. The output is derived, not selected. No existing archetype has a compute-the-answer-from-rules step — the closest anywhere in the inventory is `raid`'s capacity math (Core 1), which is arithmetic over disks, not precedence over ACEs, and lives on a different exhibit with a different validator.

**Objective mapping:** **2.2** (Given a scenario, configure and apply basic Microsoft Windows OS security settings — the permissions / NTFS-vs-share objective; the objectives note in `04` names this explicitly).

**Mobile plan (375px, honest):** **this is the item-5 risk in the set and the plan is specific.** Permission tables do not survive as tables at 375px. They are not rendered as tables on mobile: each principal (user/group) becomes a **card** listing its ACEs as labeled rows (`Modify — Allow`, `Write — Deny`), with the NTFS card and the share card stacked under a segmented NTFS/Share switch. The answer input is a per-user dropdown of access levels, not a grid cell. No horizontal scroll, no pinch-zoom, no 9pt text. If the card treatment can't be built to a real thumb standard, this archetype does not ship — flagged for the build stage.

**Seed-bank scalability:** high. Axes: nested group membership depth, deny placement (share vs NTFS), local-vs-network divergence, inheritance-blocked folders, Everyone-vs-Authenticated-Users, the classic share-Read-caps-NTFS-Full trap. Estimate **18–24 distinct scenarios**.

**Renderer reuse:** new `acl` renderer + `simLabValidateEffectiveAccessFidelity`. Reuses `fillin`/`match` step machinery for the answer inputs.

---

### S-5 · Change-Advisory RFC Board  `[U — unevidenced]`

**OS pinning:** Windows 10/11 named as the change target per seed (e.g. "in-place feature update, Win10 22H2 → Win11 23H2 fleet"). The archetype is procedural, but seeds stay OS-pinned so the technical detail is checkable.

**Task chain (4 steps):**
1. **Read** a proposed change (requester, technical detail, requested window, affected scope).
2. **Complete** the RFC record — the required fields for this change class.
3. **Classify** risk and change type (standard / normal / emergency), which gates what else is required.
4. **Adjudicate** — approve / approve-with-conditions / reject-back, plus schedule into a maintenance window against a dependency/blackout calendar.

**Exhibit / reference kind:** **NEW** — `rfc` (change record + a small maintenance-window calendar strip).

**Scoring model + equivalence:** deterministic with a **defined conditional-requirement model**: the classification in step 3 determines the required-field set in step 2, so the scorer evaluates step 2 *against the learner's own classification* for internal-consistency credit, and separately against the reference classification for correctness credit. Scheduling is scored as constraint satisfaction against explicitly enumerated blackout/dependency constraints — **any** window satisfying all stated constraints scores full (this is the defined equivalence model; multiple windows are legitimately valid and the seed enumerates the constraint set, not the answer).

**Distinctness — closest existing archetype: `incident` (Sec+).** Both are procedural-judgement archetypes over a scenario. Difference: `incident` is *reactive and ordered* — an event has happened, sequence the response. S-5 is *prospective and gated* — nothing has happened, and the task is deciding whether it should be allowed to, with what preconditions, and when. The distinctive interaction is **conditional gating**: the learner's own risk classification changes what the record must contain, which no existing archetype does (every existing validator has a fixed answer key independent of prior steps). Second-closest is `soho` (fill a config to meet requirements) — but S-5's requirements are *derived by the learner*, not given.

**Objective mapping:** **4.2** (Given a scenario, apply change management procedures). Secondary: **4.1** (documentation/support systems), **4.3** (workstation backup and recovery — rollback-plan field).

**Mobile plan (375px, honest):** a form plus a calendar strip. The RFC record is a single-column form (native mobile territory). The maintenance-window calendar is the risk: it renders at 375px as a **list of candidate windows with constraint badges**, not a scrollable week-grid — the learner taps a window, not a cell. Constraint violations surface as inline badges on the offending window.

**Seed-bank scalability:** moderate-to-high. Axes: change class, blast radius, rollback feasibility, emergency-vs-normal pressure, a requester pushing to skip the process, dependency conflicts, blackout collisions. Estimate **14–20 distinct scenarios** — the smallest bank among the survivors, but comfortably past one-off.

**Renderer reuse:** new `rfc` renderer + `simLabValidateChangeRecordFidelity`. Reuses `fillin` + `categorize` step machinery.

---

### S-6 · Disk & OS Deployment Planner  `[U — unevidenced]`

**OS pinning:** Windows 10 / Windows 11 per seed — mandatory here, since Win11's UEFI+GPT+TPM+Secure Boot floor is exactly what several seeds turn on.

**Task chain (4 steps):**
1. **Read** the deployment brief (hardware facts: firmware mode, disk size, existing data; requirements: dual-boot? data retention? edition?).
2. **Decide** partition scheme — GPT vs MBR — and boot method.
3. **Lay out** partitions on a disk bar: system/EFI, recovery, OS, data — with sizes and filesystems.
4. **Choose** upgrade path — in-place upgrade vs clean install vs repair install — consistent with the data-retention requirement.

**Exhibit / reference kind:** **NEW** — `disklayout`: a proportional disk bar with draggable/resizable partition segments, each carrying a size + filesystem label.

**Scoring model + equivalence:** **equivalence-aware, model defined.** GPT-vs-MBR, boot method, and upgrade path are single-valued (determined by the stated firmware/disk-size/retention facts). Partition sizing is range-scored — each required partition carries a `[min, max]` band per seed (e.g. EFI 100–500 MB; recovery ≥ 650 MB; OS ≥ stated minimum), and any layout inside all bands that also sums to the disk scores full. Filesystem per partition is exact-match (NTFS / FAT32 / ReFS from the 1.1 list). No free-floating "close enough" — every tolerance is an authored band.

**Distinctness — closest existing archetype: `pcbuild` (PC Build Spec-Off, Core 1) and `raid` (RAID Workbench, Core 1).** `pcbuild` selects *components* against a spec; `raid` selects an array *level* and computes capacity/fault tolerance. S-6 does neither: it partitions a *single* disk's address space against firmware constraints, and the distinctive interaction is proportional spatial allocation on a continuous bar — the first archetype in the inventory where the answer is a set of *sizes on a shared budget* rather than a set of picks. `raid` is the near miss and was checked: `raid` never lays out space *within* a disk, has no GPT/MBR/firmware axis, and no upgrade-path decision.

**Objective mapping:** **1.2** (Given a scenario, perform OS installations and upgrades in a diverse environment — boot methods, partitioning GPT/MBR, upgrade considerations; this is the objective's literal content). Secondary: **1.3** (Windows editions) via the edition requirement.

**Mobile plan (375px, honest):** the disk bar rotates — **vertical** at 375px, stacked segments filling the viewport height, each segment a tappable row that opens a size stepper + filesystem picker. Sizes are set via stepper/numeric input, **not** by dragging a 4px handle on a horizontal bar. The proportional visual survives (vertical proportion reads fine); the fiddly interaction does not ship to mobile at all.

**Seed-bank scalability:** high. Axes: UEFI vs legacy BIOS, disk >2TB (forces GPT), existing data to preserve, dual-boot, edition upgrade vs version upgrade, Win10→Win11 hardware floor failures, recovery-partition placement, in-place vs clean forced by retention. Estimate **20–28 distinct scenarios**.

**Renderer reuse:** new `disklayout` renderer + `simLabValidateDiskLayoutFidelity`. Reuses `configure` step machinery for the decisions; the segment CSS can borrow from `slots`.

---

### S-7 · Certificate & Security-Warning Adjudicator  `[U — unevidenced]`

**OS pinning:** Windows 10/11, browser-agnostic-but-named per seed (the 2.11 objective is browser security settings; seeds name the browser to keep the UI honest).

**Task chain (3 steps):**
1. **Read** a browser security warning as the user sees it, plus the certificate detail pane (subject, SAN list, issuer chain, validity window, revocation status) and the workstation's clock.
2. **Diagnose** — select the actual cause from a scoped set (expired cert / name mismatch / untrusted or missing root / revoked / client clock drift / interception proxy).
3. **Act** — choose the correct remediation, including the "do not proceed, escalate" option where that is correct.

**Exhibit / reference kind:** **NEW** — `certchain`: a warning banner + an expandable chain (leaf → intermediate → root), each node with a validity/trust state, plus a clock readout.

**Scoring model + equivalence:** fully deterministic — each seed is authored with exactly one cause consistent with the exhibit, and the remediation set is closed. The clock readout is the deliberate cross-check that makes clock-drift seeds distinguishable from expiry seeds; because the exhibit carries the discriminating fact, no ambiguity survives. No equivalence model required.

**Distinctness — closest existing archetype: `triage` (Command-Output Evidence Triage).** Both are read-the-evidence-then-conclude. Difference: `triage`'s exhibit is terminal text and its step is *ranking evidence lines by diagnostic value*; S-7's exhibit is a structured trust chain and its step is *walking the chain to find the broken link*, where the discriminating fact is often outside the cert (the local clock). The interaction is chain-inspection with an expandable trust hierarchy — no existing reference kind models trust relationships. `attack` (Sec+) is a taxonomy exhibit, not a chain.

**Objective mapping:** **3.4** (Given a scenario, troubleshoot common personal computer (PC) security issues — the objective explicitly lists *certificate warnings*). Secondary: **2.11** (Given a scenario, configure relevant security settings in a browser).

**Mobile plan (375px, honest):** the chain renders as a vertical stack of three cards (leaf/intermediate/root) with trust badges — vertical is the chain's natural axis anyway. Cert detail fields are label-over-value rows, not a two-column table. The SAN list, the one genuinely long field, gets its own expandable row. Warning banner is full-width. Clean at 375px.

**Seed-bank scalability:** moderate. Axes: cause (6), × site type (internal PKI / public site / interception proxy) × who's right (sometimes the warning is correct and the answer is *stop*). Estimate **14–18 distinct scenarios**. Past the one-off bar, but the thinnest bank alongside S-5 — noted for the ranking stage.

**Renderer reuse:** new `certchain` renderer + `simLabValidateCertChainFidelity`. Reuses `analyze` step machinery and the card CSS from S-1's `queue`.

---

## 3. REJECTED (13)

Each rejection names **the first gate item failed**. Per §3, a single failure = rejected outright, never scored. Additional failures are noted where they matter for future re-proposal.

| # | Candidate | Gate item failed | Why |
|---|---|---|---|
| **C-03** | Interactive Windows/Linux Shell (`help`-discoverable) | **Item 1** (also Item 2) | Thin variant of the existing **`cli` — Guided CLI Fault Isolation** (Net+, 12 seeds). Same task chain (run scoped commands → read output → diagnose), same `terminal` reference kind, same `simLabValidateCliFaultFidelity` scoring shape. A `help`-discoverable command set is a *feature of the existing renderer*, not a new archetype. **This is the single best-evidenced 1202 format (C1) and it is still rejected** — evidence does not buy distinctness; the gate is about distinctness and buildability, and it is graded separately from evidence by design. The correct disposition is to **extend `cli` with a Core 2 seed set** (Windows commands per 1.5; Linux per 1.9), not to mint an archetype. Recorded here so the extension path isn't lost. Secondary note: a *Linux-deep* shell archetype would also fail **item 4** — 1.9 is "**Identify** common features and tools of the Linux client/desktop OS", the lightest verb in the document, and cannot carry a deep archetype. |
| **C-04** | Social-Engineering Classify/Match | **Item 2** | Buildable purely by recombining existing primitives: `categorize`/`match` step types over the existing **`attack`** reference kind (already used by Sec+ `incident`). Phishing/vishing/smishing/whaling classification is a taxonomy sort with no new interaction. Also brushes **item 1** against `incident`'s analyze step. Correct disposition: a Core 2 seed set on existing primitives (which is what the untagged `sim-lab-seed-aplus-core2.js` content already is), not an archetype. Objective would have been 2.5 (an "Explain"-verb objective anyway). |
| **C-05** | SOHO Security Configuration | **Item 1** | Direct reskin of the existing **`soho`** archetype (Core 1, 12 seeds) — same task chain (configure a router/AP against stated requirements), same validator (`simLabValidateSohoFidelity`). Objective 2.10 differs from Core 1's framing but the *archetype* is identical; a differing objective is not a differing archetype. Correct disposition: Core 2 seeds on `soho`. |
| **C-06** | Malware-Removal Ordering Ladder | **Item 2** (also Items 1, 7-adjacent) | Buildable purely from the existing **`order`** primitive with no new interaction, and it is a **generic ordering quiz lacking a distinctive exhibit** — the 2.6 seven-step sequence rendered as a drag-list is exactly the excluded shape. Also **item 1**: it is a malware-remediation thin variant of **`incident`** (Sec+, 20 seeds), whose chain *is* order-the-remediation-steps. Note for the record: `03-core2-evidence-sittings.md` §5 flags that **no firsthand 1202 report describes a malware-removal ordering PBQ** — ordering appears as MCQ "what NEXT" sequences instead. Even if it were evidenced, it fails the gate. |
| **C-09** | WinRE / Boot-Repair Escalation Ladder | **Item 6** (also Item 1) | **Alternative valid repair paths are explicit multi-valid-answer territory** and no defensible equivalence model survived scrutiny. "sfc → DISM → startup repair → system restore → reset → reimage" has genuinely contested orderings, environment-dependent correct answers, and a least-destructive-first heuristic that practitioners disagree about at the margins. A constraint-satisfaction model was attempted (*reached working state ∧ no data loss ∧ no rung more destructive than necessary*) and rejected as hand-wavy — "more destructive than necessary" is not computable from the seed without smuggling the answer key back in. Also **item 1**: the escalation-ladder chain is `incident`'s ordering chain with a different noun. |
| **C-10** | Mobile Device Security Profile Builder | **Item 1** | Reskin of **`soho`**: configure a set of controls against stated requirements, scored by value-match. Swapping the router for a phone and the SSID for an MDM profile changes the noun, not the archetype — same task chain, same scoring model, same validator shape. Item 1 rejects reskins explicitly. (Would have passed items 4/5/7 — 2.8 is a "Given a scenario" objective and a phone profile is the ideal 375px exhibit — but item 1 is dispositive and the gate is conjunctive.) |
| **C-11** | Browser Security Hardening Panel | **Item 1** (also Item 2) | Same failure as C-10: configure-controls-against-requirements = **`soho`** reskin, with `configure` over a settings-form exhibit. 2.11 is new in V15 and genuinely under-served, which makes this tempting — it is still a reskin. Correct disposition: browser-security *content* belongs to S-3 (Settings Path Locator) terminal panes and S-7 (cert adjudicator), where it rides a genuinely new interaction. |
| **C-13** | Backup Scheme Designer (RTO/RPO) | **Item 1** | Too close to **`raid`** (RAID Workbench, Core 1, 13 seeds) in chain *and* scoring model: both present a redundancy requirement and ask the learner to pick a scheme and prove it satisfies capacity/recovery constraints. Full/incremental/differential + GFS rotation vs RAID level + disk count is the same constraint-satisfaction picker wearing different vocabulary. Item 1 requires distinctness in chain, scoring model, **or** validator — this cleared none of the three convincingly. Objective 4.3 remains covered as a secondary on S-5 (rollback plan). |
| **C-16** | Scripting Workbench | **Item 4** | **4.8 is "Explain the basics of scripting"** — an Explain-level objective in v3.0, not "Given a scenario". Item 4 requires mapping to a current final objective, and a workbench archetype (write/repair/predict a script) cannot map to an Explain-verb objective without inventing exam scope CompTIA didn't grant. Per the brief's own note, scripting-workbench ideas fail item 4. Rejected regardless of buildability. |
| **C-17** | AI Use-Policy Adjudicator | **Item 4** | **4.10 is "Explain basic concepts related to artificial intelligence"** — Explain-level, new in V15. Same failure as C-16: an adjudication archetype over-claims the objective's verb. (Firsthand report of "a few AI-related questions" at the 2026-05-29 sitting is *topic* evidence, claim type b, and does not rescue an item-4 failure.) |
| **C-18** | Event Viewer Log Correlation | **Item 1** (also Item 5) | Thin variant of **`triage` — Command-Output Evidence Triage** (Core 1, 12 seeds): present machine-generated evidence, rank/select the diagnostic lines. Rendering it in an Event Viewer chrome instead of a terminal is a skin. Independently fails **item 5**: Windows event logs are wide, timestamp-heavy, and dense — no honest 375px treatment was found that keeps correlation-across-entries possible (correlation *requires* seeing multiple entries at once, which is exactly what 375px denies; a one-entry-per-card list destroys the task). Note: `03` §5 records that **no log-viewer exhibit has been reported firsthand for 1202** either. |
| **C-19** | Remote Access Technology Selector | **Item 2** | Pure recombination — `match`/`categorize` mapping scenarios to RDP/VPN/SSH/RMM/screen-share with no distinctive exhibit. This is a matching quiz. Objective 4.9 is a real "Given a scenario" objective; that does not make a matching quiz an archetype. |
| **C-20** | Windows Feature/Tool Selector | **Item 2** | Same as C-19 — `match` over a tool list (Task Manager / MMC / regedit / Device Manager / Disk Management / Event Viewer). No new interaction, no distinctive exhibit. Objective 1.4 is better served as a secondary on S-3, where finding the tool is embedded in a navigable tree. |

**Rejection pattern worth carrying forward:** eight of thirteen rejections collapse into three families — *it's `cli`* (C-03), *it's `soho`* (C-05, C-10, C-11), *it's a matching/ordering quiz* (C-04, C-06, C-19, C-20). Core 2's objective surface is dense with "configure X to meet requirements" and "match X to Y", which is precisely why it generates so many reskins. Future candidate rounds should pre-screen against `soho` and `match` before spending analysis.

---

## 4. Evidence linkage per survivor (linkage only — **not graded**)

Confidence grading is a later pipeline stage. This section records *what links to what*, nothing more.

| Survivor | Evidence status | Linked evidence (from `03-core2-evidence-sittings.md`) |
|---|---|---|
| **S-1 Ticket-Queue Triage Console** | **Evidenced** | Format **C2** — u/FRESH__LUMPIA, sitting ~2026-07-12, firsthand: "a mock ticketing system where I had to prioritize customer requests and choose the appropriate solutions." 1 independent sitting. Task chain steps 2 and 3 map to the report's two named verbs (*prioritize*, *choose solutions*) directly. |
| **S-2 Quarantine & Services Console** | **Evidenced** | Format **C3** — 2 independent sittings, 9 months apart, sharing the distinctive verb *quarantine*: u/FRESH__LUMPIA ~2026-07-12 ("quarantine the correct computer and enable or disable specific services on individual workstations") and u/armbarassassin84 2025-10-19 ("quarantine for audio issues"). The task chain's three steps map to the first report near-verbatim. Highest-linkage survivor in the set. |
| **S-3 Windows Settings Path Locator** | **Unevidenced** | No firsthand 1202 report describes a settings-navigation PBQ. Adjacent topic-only signal (claim type b, not format evidence): u/visualsarcasm 2026-07-05 and u/Jayy-Kayy 2026-04-08 both name Windows commands/tools as pain points. Objective linkage only (1.6). |
| **S-4 NTFS / Share Effective-Access Workbench** | **Unevidenced** | The only permissions-PBQ claim in the corpus is the **Medium post (@arminarleet149), flagged LOW confidence / dump-vendor-promotional / possibly fabricated** — per evidence hygiene it is recorded but must not be leaned on. `03` §5 states plainly: no permissions-table PBQ described firsthand for 1202. Also loosely adjacent: u/Klutzy-Astronaut-280 (2026-05-29) mentions Linux "permissions" — different OS, topic-only. Treat as objective-linkage only (2.2). |
| **S-5 Change-Advisory RFC Board** | **Unevidenced** | No firsthand format report. Objective linkage only (4.2). No adjacent topic signal in the corpus. |
| **S-6 Disk & OS Deployment Planner** | **Unevidenced** | No firsthand format report. Objective linkage only (1.2). No adjacent topic signal in the corpus. |
| **S-7 Certificate & Security-Warning Adjudicator** | **Unevidenced** | No firsthand format report. Objective linkage only (3.4 — which names certificate warnings explicitly). Loosely adjacent topic-only: u/InevitableDoughnut89 2026-06-03, "5 PBQs covered basic security concepts and networking". |

**Standing caveats carried from `03`:**
- Absences above are **absence-of-report, not absence-of-format** (`03` §5). An unevidenced survivor is not a disproven survivor.
- The three reported-but-rejected formats (C1 terminal, C4 classify/match, C5 SOHO) all map onto **existing** archetypes (`cli`, `attack`-primitives, `soho`). That is a meaningful finding in its own right: **the exam's best-evidenced Core 2 PBQ shapes are already covered by the inventory**, and the surviving archetypes are therefore mostly bets on unreported surface. The ranking stage must weigh evidenced-but-covered against unevidenced-but-novel.
- Form-shape context (high confidence, 8 sittings): **4–7 PBQs per 1202 form, mode 5**. Any Core 2 archetype set should be sized against ~5 PBQs per sitting.

---

## 5. Gate audit trail

For the record, the §3 items and where they bit:

| Gate item | Rejections caused |
|---|---|
| 1 — distinct in chain, scoring, or validator (reskin = reject) | C-03, C-05, C-10, C-11, C-13, C-18 (6) |
| 2 — not buildable purely from existing primitives | C-04, C-06, C-19, C-20 (4) |
| 3 — legitimate evidence provenance | 0 direct (the Medium/@arminarleet149 post was excluded from S-4's linkage under this item, but S-4 survives on objective linkage) |
| 4 — maps to a current final official objective (v3.0) | C-16, C-17 (2) |
| 5 — honest 375px mobile fidelity | C-18 (secondary; 1 contributing) |
| 6 — deterministic or equivalence-aware scoring | C-09 (1) |
| 7 — scalable seed-bank variation | 0 (S-5 and S-7 are the thinnest banks at ~14–20 and ~14–18 and were checked closely; both clear the one-off bar) |

**Survivors: 7 of 20.** Next pipeline stage per `00-inventory-and-exclusions.md`: **domain review**, then rank.

---

## Related
[[00-inventory-and-exclusions]] · [[03-core2-evidence-sittings]] · [[04-core2-objectives-ecosystem]]
