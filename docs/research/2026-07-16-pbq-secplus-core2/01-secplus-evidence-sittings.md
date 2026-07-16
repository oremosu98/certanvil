# SY0-701 PBQ Formats — Evidence from Actual Sittings

Research date: 2026-07-16
Scope: interactive PBQ **format** evidence (claim type c) from people who sat **SY0-701**.
Method: 12+ WebSearch queries + direct page fetches. No dump sites opened; no item wording/options/answers reconstructed.

---

## 0. READ THIS FIRST — evidence is THIN, and the environment blocked the best sources

**Evidence is thin here.** Plainly:

- **I found exactly 2 independent SY0-701 sittings that describe PBQ formats at the level you asked for** (claim type c). Two. Everything else is either structure-only, or SEO marketing content.
- **r/CompTIA — the single richest source of sitting reports — was unreachable by every available route.** `reddit.com` returns HTTP 403 to this crawler; the search tool refuses the domain (`domains are not accessible to our user agent`); the browser pane refuses it (`blocked by policy`); Reddit mirrors (redlib, safereddit) are behind Anubis/403. **The Reddit corpus is entirely absent from this report.** Any conclusion below could be overturned by a few hours of manual r/CompTIA reading.
- **TechExams / InfoSec Institute forums are behind Cloudflare** ("Just a moment… Enable JavaScript") and could not be fetched either.
- So this report reflects **the fetchable open web only** — personal blogs (Medium, Hashnode). That is a biased slice: blog writeups skew toward people who enjoy writing, mostly English-language, mostly US/SG.

**⚠️ Fabrication caught — do not propagate.** A WebSearch summary returned a vivid quote attributed to `examcert.app`: *"The exam started with 4 PBQs right out of the gate... One was a drag-and-drop to configure firewall rules, another was analyzing three different logs..."*, framed as "A 2026 test-taker reported". **I fetched the full text of that page. The quote does not exist in it.** The search summarizer synthesized it. It is not evidence and is excluded. Treat all search-snippet "test-taker reported" quotes as unverified until the page is fetched — this one would have been the strongest support for the firewall-drag-drop claim, and it is not real.

**⚠️ Biggest negative finding.** The most confidently repeated claim in prep-industry content — *"firewall rule configuration / rule-ordering drag-and-drop is almost guaranteed on SY0-701"* — has **zero firsthand sitting support** anywhere I could reach. Neither sitting report describes a firewall-rule PBQ. Section 5 covers this.

---

## 1. Distinct PBQ FORMAT claims (claim type c)

Independent sittings identified: **2** (Rajanish, Medeiros). All format claims below draw from these two only.

### FORMAT A — VPN configuration form (config-form exhibit, dropdown/field entry)

- **Format description:** A simulated VPN device/gateway config screen. Candidate clicks into a configuration panel and sets parameters via dropdowns/fields rather than picking an answer. Medeiros' instance: two branch-office diagrams each with a VPN gateway (internal + public IP), configure **both ends** of the tunnel, split across a **Phase 1** panel (authentication method, encryption algorithm, Diffie-Hellman group) and a **Phase 2** panel (local/remote subnets, protocol, encryption). Rajanish's instance is described only as "full tunnel VPN configuration".
- **Independent sittings: 2**
- **Basis:** both firsthand.
- **Date range of reports:** 2024-07-02 → 2025-04-27 (sittings ≈ mid-2024 and early-2025).
- **Confidence: Moderate.** Two independent firsthand reports is real convergence, and the interaction shape (click into a config panel, select from constrained option sets) is consistent. Caveat: they are **different VPN sub-types** — "full tunnel" (remote-access shape) vs "site-to-site". So "a VPN config PBQ exists" is well supported; "it is specifically a site-to-site Phase1/Phase2 form" rests on **one** sitting (Medeiros).
- **Citations:**
  - https://anupamrajanish.hashnode.dev/comptia-security-sy0-701-exam-my-experience-and-thoughts
  - https://medium.com/@jaredpmedeiros/breaking-down-my-comptia-security-pbqs-what-actually-showed-up-on-test-day-37a63d4719ad

### FORMAT B — Multi-host log analysis → classify/label each endpoint

- **Format description:** Log-viewer exhibit spanning **multiple hosts plus a central log source**, where the task is to triage the fleet, not to name an attack. Medeiros' instance: logs from six individual endpoints + one centralized logging server (firewall logs showing IP-to-IP flows across two days); cross-reference per-host timelines against the central flow log; then **label each endpoint** with one of a small closed set of states (Clean / Infected / Source). Explicitly noisy — lots of irrelevant log lines to filter. Rajanish's instance: "identify infected endpoints in a compromised network."
- **Independent sittings: 2**
- **Basis:** both firsthand.
- **Date range of reports:** 2024-07-02 → 2025-04-27.
- **Confidence: Moderate-to-good — the strongest claim in this report.** These two are the closest match in the whole corpus: both are "compromised network, work out which machines are infected," described independently ~10 months apart by authors with no visible connection. The *sub-shape* (per-host label assignment against a cross-referenced central log) is detailed by Medeiros only; Rajanish corroborates the task goal but not the interaction mechanics.
- **Citations:** same two URLs as Format A.

### FORMAT C — Drag-and-drop component placement into network/subnet zones

- **Format description:** A cloud/network architecture diagram with labelled zones (Medeiros: a public subnet, an "undecided" subnet the candidate must classify as public or private, and a private subnet). Candidate **drags components** (static instances, dynamic instances, load balancers, database, WAF) into the correct zone. Reported as deliberately provider-neutral — no AWS/GCP/Azure-specific naming.
- **Independent sittings: 1**
- **Basis:** firsthand.
- **Date range:** single report, 2025-04-27.
- **Confidence: Low-to-moderate.** Single-sourced. A drag-drop-into-diagram shape is highly plausible and matches CompTIA's general PBQ vocabulary, but **one sitting is one sitting** — do not treat as established.
- **Citation:** https://medium.com/@jaredpmedeiros/breaking-down-my-comptia-security-pbqs-what-actually-showed-up-on-test-day-37a63d4719ad

### Format claims with ZERO firsthand sitting support (found only in prep/SEO content)

Listed so they are not silently absorbed as evidence. Each is **unsupported** by any sitting report I could reach:

- Firewall / ACL **rule-ordering or rule-table** PBQ (the most-repeated industry claim — see §5)
- Drag-drop **matching attacks → mitigations**
- **Port/protocol matching** drag-drop
- **Incident-response phase ordering** (PICERL sequencing)
- **Certificate / PKI** viewer or troubleshooting PBQ
- **Command terminal** PBQ
- **Wireless security** configuration PBQ
- Selecting cryptographic algorithm/mode by use case

---

## 2. Topic-only / structure-only reports (claim type b) — KEPT SEPARATE

These are firsthand SY0-701 sittings, but they describe **exam structure or PBQ topics without describing an interactive format**. They do **not** support any Section 1 claim.

| Source | Post date | Firsthand? | What it actually establishes | URL |
|---|---|---|---|---|
| John T (Medium) | 2024-09-20 | Yes, SY0-701, score 792/900, Singapore | Structure only: "multiple PBQs", **all PBQs front-loaded**; more PBQs ⇒ fewer MCQs; PBQs skippable; unscored trial items exist. **No format described.** | https://johntcy.medium.com/attaining-my-comptia-security-sy0-701-19a36ebe1536 |
| Nyambi Blaise (Medium) | 2025-02 | Yes, first attempt, Feb 2025 | Structure only: PBQs "so so long", skipped them, did them after MCQs, finished with 7 min left. **No format described.** | https://medium.com/@nyambiblaise/how-i-passed-the-comptia-security-exam-on-my-first-trial-february-2025-5-minutes-read-e2b728c2f229 |
| A. Rajanish — *pre-exam expectations* section | 2024-07-02 | Firsthand author, but this passage is **expectation, not observation** | Says a PBQ "could be anything from reviewing logs... configuring firewalls/VPNs on an interface" — this is him describing what he *anticipated*, not what he saw. His actual sitting (§1) had 2 PBQs. **The firewall half of this sentence must not be counted as a firewall-PBQ sighting.** | (same hashnode URL) |
| Rishikesh Jadhav (Medium) | 2025-04 | Unknown | Page returned effectively empty (114 chars — paywall/JS gate). Not assessed. | https://medium.com/@rishiedu23/... |

**Structure consensus (claim type b), 4 independent firsthand sittings:** PBQs appear **first / front-loaded**, are **skippable and flaggable** with work saved, are **few in number** (2–3 observed: Rajanish 2, Medeiros 3), and are **time-expensive**. This is the best-evidenced thing in the report — but it is structure, not format.

---

## 3. Dedup log

| Item | Judgement |
|---|---|
| `examcert.app` "2026 test-taker reported… 4 PBQs, firewall drag-and-drop" | **Not a source — quote fabricated by the search summarizer.** Full-page fetch confirms no such text. Excluded entirely. |
| flashgenius.net, figigexams.com, gcppcatest.com, howtonetwork.com, 101labs.net, certguide.ai, asmed.com, crucialexams.com, trainingcamp.com, proftia.com, learnzapp.com, certempire.com, totalsem.com, itstudyhub.org, passitexams.com, certclimb.com | **All collapsed into one bucket: prep-vendor SEO.** They recite a near-identical PBQ-type list (firewall config / log analysis / port matching / IR ordering / PKI / network diagram). No sitting, date, or attribution behind any of it. Reads as mutual copying + objectives-doc paraphrase. **Zero sittings contributed.** |
| Search-summary line "Common PBQ types include firewall configuration, log analysis, network diagram…" appearing under multiple queries | Same recycled vendor list resurfacing; counted once, as zero. |
| diontraining.com / udemy.com / cybr.com / labsdigest / examsdigest / mohammadlotfi.com PBQ packs | **Product listings for simulated PBQs.** Vendor-authored practice items ≠ exam observations. Excluded. Note the circularity risk: Medeiros and Rajanish both studied Dion/Cyberkraft materials, so vendor lists and candidate expectations can contaminate each other — another reason not to treat vendor lists as independent corroboration. |
| Aaron Higgins, comment on Rajanish's post ("I recently passed... can relate to PBQs at the beginning") | **Not counted as an independent sitting.** Corroborates front-loading only (structure), describes no format, and is a thinly-veiled promo for "P2PExams". Low trust. |
| examtopics.com results | **Not opened** — dump-site category, out of scope per brief. |
| quizlet.com "Security+ PBQ-3 flashcards" | **Not opened** — likely reconstructed items. Out of scope. |

**Net: 6 candidate sources → 2 independent format-bearing sittings.**

---

## 4. SY0-601 material — PRIOR GEN, flagged, NOT counted

- TechExams thread "Performance-based Q's - SY0-401" (https://community.infosecinstitute.com/discussion/108052) — **two generations stale** (SY0-401). Context only. Not fetchable anyway (Cloudflare).
- ExamTopics SY0-601 discussion surfaced by search mentioning "four PBQs" — **prior gen**, and a dump site; not opened, not counted.
- Udemy listings whose slugs still read `comptia-security-sy0-601-*` while marketing SY0-701 content — **stale/relabelled prior-gen products**. Evidence of nothing.
- General note: SY0-601 retired **2024-07-25**. Any account dated after ~Aug 2024 that says only "Security+" is SY0-701 by elimination. This is how **Medeiros (2025-04-27)** is assigned to SY0-701 — his article says "CompTIA Security+" without the exam code. That inference is sound but is an inference, not a stated code. Rajanish states SY0-701 explicitly.

---

## 5. The firewall-rule PBQ problem (explicit warning)

Prep content states with near-total confidence that firewall/ACL rule configuration is "almost guaranteed" on SY0-701. Against that:

- **0 of 2** format-bearing sittings describe a firewall-rule PBQ.
- The one apparent firsthand mention (Rajanish) is in his **pre-exam expectations**, not his exam recall — his actual two PBQs were VPN config and infected-endpoint ID.
- The most compelling supporting quote turned out to be **fabricated by a search summarizer**.

This does not prove firewall PBQs are absent — 2 sittings against a large rotating item bank proves almost nothing, and CompTIA rotates forms. But **the confident industry claim currently rests on no sitting evidence I could locate.** If CertAnvil is prioritising PBQ builds by real-world frequency, the firewall-rule drag-drop should be marked **unverified**, not "almost guaranteed", pending Reddit-corpus access.

---

## 6. Source tier / confidence table

| Source | Tier | Exam code | Sitting date | Post date | Hand | Region | Format evidence? | Confidence |
|---|---|---|---|---|---|---|---|---|
| Jared Medeiros (Medium) | Personal blog — **best in corpus**; per-PBQ structural detail, explicit about NDA/recall limits | SY0-701 (inferred from date) | ~Apr 2025 | 2025-04-27 | First | Unstated (likely US) | **Yes — 3 PBQs** | Good for existence; moderate for detail (single-sourced recall, self-flagged as imperfect) |
| Anupam Rajanish (Hashnode) | Personal blog | **SY0-701 (stated)** | ~Jun 2024 | 2024-07-02 | First | Unstated (India/EN) | **Yes — 2 PBQs**, brief | Moderate; corroborates Medeiros on 2 of 3 |
| John T (Medium) | Personal blog | SY0-701 (stated) | 2024-09-18 | 2024-09-20 | First | Singapore | No — structure only | Good (for structure) |
| Nyambi Blaise (Medium) | Personal blog | Security+ (Feb 2025 ⇒ 701) | Feb 2025 | 2025-02 | First | Unstated (Cameroon/EN) | No — structure only | Good (for structure) |
| Prep-vendor SEO cluster (16+ domains) | **SEO listicle — lowest tier** | "SY0-701" | n/a | 2025–2026 | None | n/a | No | Discounted to zero |
| examcert.app quote | **Fabricated by search tool** | — | — | — | — | — | **No** | Excluded |
| Reddit / r/CompTIA | Would be **highest tier** | — | — | — | — | — | **INACCESSIBLE** | n/a |

---

## 7. Recommended next step

The decisive gap is Reddit. If PBQ format frequency is going to drive build priority, someone with a normal browser session should manually pull 20–30 r/CompTIA "Passed SY0-701" threads and re-run this dedup. Until then, treat Formats A and B as *plausible and twice-attested*, Format C as *single-sourced*, and every other format — **including the firewall-rule drag-drop** — as *unattested by any sitting*.
