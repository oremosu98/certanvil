# SY0-701 PBQ Format Evidence — DEPTH Re-run (Pass 3)

**Date:** 2026-07-16
**Scope:** Firsthand r/CompTIA reports of *interactive PBQ formats* on CompTIA Security+ SY0-701.
**Status:** Research only. No brain-dump material sought, opened, or reproduced. Format shape only.
**Baseline:** `08-secplus-evidence-redlib-rerun.md` — 9 independent sittings from ~30 titles triaged.
**Purpose:** apply the bulk-extraction method from pass `10` at full depth; close 4 named gaps + 2 re-tests.

---

## 1. Route + method log

**Route:** in-app Browser pane → `preview_start` → Redlib mirror `redlib.privacyredirect.com`. reddit.com not attempted (403s crawlers, per prior passes — zero calls wasted). No mirror degradation across ~10 navigations.

**Instrument:** `javascript_tool` bulk extraction over `.post` nodes. Correct selectors, determined by dumping one post's `outerHTML`:

| Field | Selector |
|---|---|
| sitting id | `p.id` (redlib sets the post id on the `.post` div) |
| user | `.post_author` |
| title | `.post_title a:not(.post_flair)` |
| **date** | `.created` → **`title` attribute** (absolute UTC; the innerText is relative "10d ago" and useless) |
| body | `.post_body` (full body, not a snippet) |

**Method upgrade over pass `08` and `10`:** rather than slicing bodies blindly, I passed a **regex filter into the extraction** (e.g. `/[^.\n]*(site.to.site|phase\s*[12]|ike|ipsec)[^.\n]*/ig`) and returned only matching sentences plus a `hit` boolean. This turns one call into a whole-page grep, drops sidebar noise, and makes a **zero-hit result trustworthy** rather than an artifact of truncating at 700 chars. Confirmed-absence claims below rest on this.

**Searches run (9):**

| # | Query | Sort/window | Titles | Yield |
|---|---|---|---|---|
| 1 | `SY0-701 PBQ` | new | 25 | baseline re-confirm |
| 2 | `failed Security+ PBQ` | relevance/all | 25 | **GAP 3 — high** |
| 3 | `Security+ PBQ permissions least privilege` | relevance/all | 25 | GAP 1 iam — zero |
| 4 | `SY0-701 PBQ vulnerability scan CVSS patch` | relevance/all | 25 | GAP 1 vulnq — zero on 701 |
| 5 | `Security+ PBQ site-to-site IPSec phase VPN configure` | relevance/all | 25 | noise (OR-matching) |
| 6 | `"site-to-site" PBQ` | relevance/all | 1 | **GAP 2 — hit** |
| 7 | `"phase 2" VPN Security+` | relevance/all | 1 | false positive |
| 8 | `PBQ certificate CSR PKI Security+` | relevance/all | 25 | GAP 1 certchain — zero on 701 |
| 9 | `"drag and drop" Security+ PBQ` | relevance/all | 25 | **both re-tests — decisive** |
| 10 | `Security+ PBQ` | new / t=year | 25 | **GAP 4 — 2026 sweep** |
| 11 | `PBQ "user permissions" OR "access control" Security+` | relevance/all | 25 | GAP 1 iam — zero |

**Titles triaged: ~177** (vs `08`'s ~30, vs `10`'s ~110). Target met.

**Comment trees opened (3, selectively):** `1i1h7k3` ("What do PBQs look like in Security+ 701?" — 701-specific, body hinted), `1u4a732` (od_mora 2026), `1dkhxu2` (Ok-Surprise4606). **1 of 3 paid off** — consistent with the ~1-in-5 prior. Notably `1i1h7k3`, despite the perfect title, contained **zero firsthand sittings** — only generic community-answerer replies (`drushtx`, `IT_CertDoctor`) listing formats in the abstract. Excluded.

**Redlib search caveat, worth recording:** multi-term queries behave OR-ish and return topic-adjacent noise (search #5 returned Net+/A+/CySA+ passes with no VPN content). **Quoted phrases work** (search #6 returned exactly 1 post, and it was the right one). Future passes: quote the phrase, don't stack terms.

---

## 2. Format claims (type c) — independent sitting counts

Only **new** sittings are tabulated. S1–S9 carry forward from `08` unchanged.

| # | User | Post date | Exam code basis | Format described (type c) | Pass/Fail | Conf. | URL |
|---|---|---|---|---|---|---|---|
| **S10** | `Ok-Surprise4606` | 2024-06-20 | **SY0-701 explicit** (title "PASSED SEC+ 701!!") | (a) **"setting 2 site to site VPNs and choosing the strongest encryption"**; (b) "determining the infected device + other stuff" | **Pass** (778) | High | [/r/CompTIA/comments/1dkhxu2](https://redlib.privacyredirect.com/r/CompTIA/comments/1dkhxu2/) |
| **S11** | `JTechguy85` | 2025-06-02 | 701-era (601 retired 2024-07) | 3 PBQs; **"the two firewall ones got me the most"** — two distinct firewall PBQs in one sitting | **FAIL** (1st attempt) | Med (exhibit-level, no interaction named) | [/r/CompTIA/comments/1l1rqtl](https://redlib.privacyredirect.com/r/CompTIA/comments/1l1rqtl/) |

**Independent sittings with genuine type-(c) detail: 11** (was 9). **Net +2.**

Both quotes above were read off the rendered page by me directly (S10's full body reproduced in-tab and verified; S11's from filtered extraction). No summarizer-supplied quotes are used anywhere in this document.

### Format clusters, by independent sitting count

| Cluster | Now | Was (`08`) | Delta |
|---|---|---|---|
| Multi-host log analysis → classify each host | **6** | 5 | +1 (S10) |
| **VPN concentrator configuration form** | **6** | 5 | +1 (S10) |
| Network / architecture design or build | 3 | 3 | — |
| **Firewall configuration** (shape unspecified) | **3** | 2 | +1 (S11) |
| Matching / mapping | 1 | 1 | — |
| Terminal / CLI sim | 1 | 1 | — |
| AAA / RADIUS + wireless config | 1 | 1 | — |
| **IAM entitlement review** | **0** | 0 | — |
| **Vulnerability remediation prioritisation** | **0** | 0 | — |
| **Certificate / PKI diagnostics** | **0** | 0 | — |

The top two clusters remain the top two, and both gained. The ranked list's shape is unchanged.

---

## 3. Disposition of the 4 gaps + 2 re-tests

### GAP 1 — three archetypes with zero sittings

**`iam` (IAM entitlement review) — STILL ZERO. Now explicitly searched-and-absent (2 distinct queries, 50 posts, regex-filtered).**
Searches #3 and #11 returned **zero body matches** for `permission|least privilege|entitle|over-privileg|revoke|user account|group member` across 50 posts. Query #11 returned literally `{"n":25,"hits":[]}`. Least privilege is a heavily-tested *objective* and appears constantly as MCQ material (type a/b), but **not one person across three passes describes an interactive PBQ where you review or fix entitlements.** This is now the best-hunted zero in the corpus. Weak-but-real counter-evidence.

**`vulnq` (vulnerability remediation prioritisation) — STILL ZERO on 701. Exists on prior-gen 601 (see §6).**
Search #4 surfaced two 601-era vulnerability PBQs (`Relative-Pen1478` 2023-05, `Young_child00` 2023-02) and one CySA+ candidate. **Nothing on 701.** Note the trap: `Musicislife21_` (2024-08) asks whether a *CyberKraft video* on "Analyzing Vulnerabilities CVEs CVSS" is good Sec+ PBQ prep — that is a **vendor's content catalogue**, not testimony, and is **not** evidence the exam has such a PBQ. Excluded.

**`certchain` (certificate/PKI diagnostics) — STILL ZERO on 701.**
Search #8's only PBQ-relevant hit is `Ruthless-` (2022-01): *"I've been seeing some people talk about being caught off guard by a CSR pbq"* — **601-era AND explicitly secondhand** ("some people talk about"). Fails on both counts. `DBHemlock` (2026-04) lists PKI among acronyms to know — type (b), MCQ-level. **Two passes have now searched certificate and found nothing firsthand on 701.**

**Verdict on GAP 1: STILL ZERO ×3.** All three stay at grade C. Absence is now accumulating across three passes with progressively better instruments — this is beginning to constitute a weak positive case that these shapes are *not* on the 701 PBQ pool, but it is not yet strong enough to refute anything.

### GAP 2 — the VPN sub-shape's superseded source
**PARTIALLY CLOSED — the important half.**

- **site-to-site: CONFIRMED (+1 firsthand, 701-explicit).** `Ok-Surprise4606` (S10) writes *"1 involves setting 2 site to site VPNs and choosing the strongest encryption"*. This is the **first non-blog, firsthand source** for the site-to-site sub-shape. The discarded Medeiros blog is **no longer load-bearing** — it is now corroborated by independent firsthand testimony and can be dropped without loss. This also retro-validates `08`'s S1 ("two concentrators"), which I had flagged as my inference rather than testimony: two independent sittings now report **two VPN tunnels**, and one names them site-to-site.
- **Phase 1 / Phase 2 (IKE phase split): STILL ZERO.** Search #7's only "phase" hits were `The-Arkham-Dude`'s **study-plan headings** ("Phase 1 – System Setup", "Phase 2 – Study Framework") — a false positive, caught and excluded. **No source in any of three passes has used "Phase 1" or "Phase 2" about a Sec+ VPN PBQ.** The field structure of the form remains unattested; S1's "~12 fields" is the only structural datum and it does not imply a phase split.

**Net:** the #1 archetype's sub-shape is now **half-supported firsthand** (site-to-site: yes; IKE phases: no). If the build needs a phase split, that remains a **design choice, not an evidenced one** — and should be labelled as such in the seed.

### GAP 3 — survivorship bias
**PARTIALLY CLOSED. Bias reduced but still severe.**

Search #2 was the highest-yield query of the pass and surfaced a substantial fail/retake population. But **most failure reports contain no format detail** — people describe the *feeling* of failing, not the exhibit:

- `JTechguy85` (2025-06, **FAIL**) — **the only fail with format detail**: two firewall PBQs of three. → **S11**.
- `Euphoric-Tune-6997` (2025-11, **FAIL**, 701-era) — "completely blanked out at the last PBQ... whatever I tried to do was not working". Vivid, but names **no format**. Not type (c). A sitting, not a format sitting.
- `MangoPeachPrincess` (2025-04, **FAIL**, 701-era) — blames domain 4 and "the PBQ's". No format. Not type (c).
- `Actual_Manager6165` (2025-02, pass) — "PBQ's were INSANELY difficult. 76 questions, 3 PBQ's". No format.

**Bias delta: 9/9 passes (100%) → 10/11 passes (91%).** One fail admitted. This is a real but small improvement, and I want to be honest about *why* it stayed small: **the failure mode of failure reports is that they're emotional, not descriptive.** People who fail post about the loss; people who pass post a study guide. The structural bias in this corpus is not "failures aren't posted" — they're posted plentifully — it's that **failures are posted without technical content.** That is a harder bias to fix, and no amount of additional searching on r/CompTIA will fix it. I'd call GAP 3 **closed as far as this source can close it**, at 91%.

Interesting corroboration nonetheless: S11 failing *specifically on two firewall PBQs* is the first evidence that the firewall shape is among the **hardest-filtering** items — which is exactly the population the brief wanted.

### GAP 4 — date skew toward 2024
**UNRESOLVED. Confirmed as a real and stubborn property of the corpus, not a search artifact.**

Search #10 (sort=new, t=year) surfaced **~15 distinct 2026 Sec+ sittings** — the population is plentiful. Their format content is near-nil:

| 2026 sitting | PBQ count stated | Format detail |
|---|---|---|
| `od_mora` (Jun) | 4 | **none** (see dedup log — nearly miscounted) |
| `CommandSignificant27` (Jun) | 4 + 72 MCQ | none |
| `knowlegewizard` (Jun) | 4 + 74 MCQ | none |
| `DBHemlock` (Apr) | 3 + 76 MCQ | none ("BRUTAL") |
| `Essenceixi` (May) | 3 | none |
| `YogurtclosetOk9860` (May) | 3 + 73–76 MCQ | none |
| `Vizreki` (Jul) | — | none ("partial credit on most") |
| `redgroupclan` (Jun) | — | **generic only**: "the PBQs are a lot more interactive than a PDF can provide" |
| `Cyber_caine7` (May) | — | none |
| `TangyStart` (Jul) | — | carried from `08` as S9 (competency list) |

**Zero new 2026 interaction-level descriptions found.** The brief hoped a 2026 report describing an *interaction* would outweigh ten old exhibit mentions — I looked hard and there isn't one. The date skew persists: **the format-rich sources are still overwhelmingly 2024.**

My read on the cause, offered as inference not evidence: **NDA-consciousness has visibly increased.** `jritenour` (2026-02) opens with *"Not sharing any specific questions or PBQ details because of the NDA"*; `thehermitcoder` (2026-04) says *"while I won't go into details"*; `DBHemlock` (2026-04) says *"I can't talk about what was on my real exam"*. The 2024 posters simply described what they saw. If that's right, GAP 4 is **not closable by more searching** — the recent corpus is self-censoring, and the 2024 evidence is the best that will ever exist for this exam version. Worth recording so a fourth pass doesn't burn calls rediscovering it.

### RE-TEST 1 — Firewall rule-table drag-drop
**STILL ZERO. Hunt #3. I consider this now settled enough to stop hunting.**

Search #9 grepped every `.post` body for `drag` and returned **25 hits — the complete drag-drop testimony of the subreddit.** The result is unambiguous:

- **Every single Sec+ drag-drop report is dated 2018–2023** → SY0-401 / 501 / 601. `soleil-alcyone` (2021, **501 explicit**), `fluuzer` (2021, **501 explicit**), `SnooGadgets3240` (2021, **501 explicit**), `Grzkid` (2018, **401 explicit**), `Young_child00` (2023, 601), `samofny` (2019), `garbagemonkey` (2019), `Jotari77` (2021), `djcurtin` (2020), `neppv` (2021), `BloodDaimond` (2022), `vbid_007` (2023), `fraziankidd` (2020), `paythemanhismoney` (2020), `SHADOWSTRIKE1` (2021), `adbdragonmaster1` (2023).
- **Not one is 701-era.** The most recent Sec+ drag-drop testimony predates 701's launch.
- **Not one of the 25 describes dragging firewall rules.** The ones that name content name: hashing terms (`Grzkid`), definitions (`fluuzer`), term-matching (`SHADOWSTRIKE1`), hot/cold sites (`jrghetto602`, **CASP**), Windows versions and malware-remediation ordering (`penny-tiger`, **A+**).

**This is the strongest single result of the pass.** The brief's hypothesis — that the 2020-era drag-drop posts are the root of the firewall folklore — is **confirmed and can now be stated as a finding rather than a suspicion**, with the refinement that the folklore is doubly unfounded: the drag-drop reports are not only prior-gen, **they were never about firewalls in the first place.** Firewall PBQs are real on 701 (now 3 sittings, S2/S6/S11) but **nobody, in any generation, has described dragging a firewall rule.**

### RE-TEST 2 — Subnet/cloud-zone drag-drop
**STILL ZERO on Security+. Second folklore root identified.**

The task remains confirmed (3 sittings: S2 HA architecture, S4 screened subnets, S8 network design) and the **interaction remains completely unattested on Sec+** — nobody says whether you drag, use dropdowns, or click-to-place.

But search #9 turned up the likely folklore root, and it's a good one: `ashent2` (2022-12) — *"It asked me to drag and drop different devices into the subnets, then assign the subnets using the least amount of wasted addresses"*. **That is Network+, not Security+** (title: "Passed Network+ today"). So the vivid "drag devices into subnets" image that has been floating around the research **is a real memory of a real PBQ — on a different exam.** Mis-attributing it to Sec+ would have been an easy and completely wrong call.

**Both drag-drop folklores now have identified prior-gen / wrong-cert roots.** Neither has any 701 support.

---

## 4. Topic-only claims (type b) — kept separate, NOT format evidence

- `DBHemlock` (2026-04): know "EDR, OCSP, SOAR, SIEM, PKI, ECC, all the various IPS and IDS" — MCQ study advice.
- `Mysterious-Stage` (2026-01): advises playing with TP-Link/Cisco firewall/router demos as PBQ prep — **his prep strategy, not his exam.** Reads seductively like firewall-config evidence. It isn't.
- `oneapple23` (2023-10, **601-era**): a "degaussing/PII" PBQ — data-destruction topic.
- `Dillzzzzz` (2023-06, **601-era**): firewall rules PBQ (allow/deny, inbound/outbound) + data destruction.
- Multiple 2026 posters name CyberKraft as the only useful PBQ prep — an **ecosystem** fact, not an exam fact.

## 5. Dedup log

| Check | Outcome |
|---|---|
| `Ok-Surprise4606` (S10) vs `FitFun8149` (S1) | **Distinct.** Different users, different dates (2024-06 vs 2024-08), different scores. Both report a two-tunnel VPN PBQ — this is **corroboration, not duplication**. Counted as 2. |
| `H_Leimgruber` "How I passed Security+ with an 808 in 3 weeks" (2026-06-21) vs `TangyStart` "SY0-701 done!" (2026-07-06, also **808**) | Surfaced adjacently in search #1 with **the same score**. Checked: different users, different post dates, different bodies. **Distinct** — S7 and S9 stand. Flagging because an 808/808 collision is exactly the shape of a repost and nearly cost a false dedup. |
| **`od_mora` (2026-06) — near-miscount, caught** | His line *"I could spot and identify an attack recorded in logs or configure allow/deny settings on a firewall"* reads as a log+firewall sitting and **would have been S12**. Reading the full body shows it describes the **Dion PBQ simulation**, and the immediately preceding sentence is *"The questions weren't necessarily like the PBQs I encountered during the test."* **Excluded from all format counts.** This is precisely the trap the brief warned about, and it survives extraction-level reading — only the full body kills it. |
| `Musicislife21_` (2024-08) CVSS "evidence" | **Excluded** — describes a CyberKraft video title, not a sitting. |
| `Ruthless-` (2022-01) CSR PBQ | **Excluded** — 601-era *and* secondhand. |
| `drushtx`, `IT_CertDoctor` (thread `1i1h7k3`) | **Excluded** — generic format lists from community answerers, no sitting claimed. `IT_CertDoctor` is a vendor-adjacent persona; treated as promo-risk regardless. |
| `ashent2` (2022-12) subnet drag-drop | **Excluded from Sec+** — Network+ sitting. |
| Vendor promo scan | No new promo-as-testimony found. Prior exclusions (CyberDefenders "cold terminal" comment, dump-vendor Medium post) not re-encountered. |
| Fabricated-quote guard | **Every quote in this document was read by me off the rendered page.** No search-summarizer output used. |

## 6. Prior-gen (601/501/401) — flagged, NOT counted as 701 proof

| User | Date | Code | PBQ shape | Why it matters |
|---|---|---|---|---|
| `Relative-Pen1478` | 2023-05 | **601** | PowerShell screen + vulnerability page; choose the best patch; per-IP | **The `vulnq` archetype, on prior-gen.** Closest thing to vulnq that exists. Not 701. |
| `Young_child00` | 2023-02 | **601** | 3 PBQs: a drag-drop; configure AP encryption; a vulnerability scan | vulnq + drag-drop, prior-gen |
| `After-Thought-1390` | 2021-07 | **601** | "PBQ's on firewalls and Radius Configure" | firewall + RADIUS, prior-gen |
| `Dillzzzzz` | 2023-06 | **601** | Firewall rules (allow/deny, in/outbound); data destruction | firewall, prior-gen |
| `montagesnmore` | 2019-02 | **501/401** | Set up an AP based on authentication (LDAP/AAA/DC list) | AAA, prior-gen |
| `soleil-alcyone`, `fluuzer`, `SnooGadgets3240` | 2021 | **501 explicit** | drag-drop definitions / term-matching | **Root of the drag-drop folklore** |
| `Grzkid` | 2018 | **401 explicit** | hashing drag-drop | Root, earliest |
| `professormessar` | 2023-12 | **601** | "the PBQ were hard" — no shape | Sydney, AU (rare region datum) |
| `ashent2` | 2022-12 | **Network+** | drag devices into subnets | **Root of the subnet drag-drop folklore — wrong cert** |

**Prior-gen contains vulnq and drag-drop. 701 contains neither.** That contrast is itself informative: it is consistent with CompTIA having *retired* these shapes at the 601→701 boundary — but three passes of absence is suggestive, not probative, and I am not asserting it.

## 7. Remaining bias — honestly

1. **Region: still near-total unknown.** Across ~177 titles I recovered exactly one region datum (`professormessar`, Sydney — and he's 601). Unchanged from `08`. Not fixable on this source.
2. **Survivorship: 91%, down from 100%.** Improved, but as argued in GAP 3, the residual bias is *qualitative* — fails post feelings, passes post guides. More searching won't move it.
3. **Date: format evidence remains 2024-anchored, and this is probably permanent** (NDA-consciousness, §GAP 4). The corpus is getting *less* informative over time, not more.
4. **Single-source dependency: r/CompTIA only.** Three passes, one subreddit. Every count here inherits whatever selection effects that community has. This is the largest unaddressed bias in the whole corpus and no pass has touched it.
5. **Self-selection on format-richness:** the people who describe exhibits in detail may be systematically the ones who found them *memorable* — i.e. hard or unusual. The VPN/log dominance could partly reflect memorability rather than frequency. Unfalsifiable here; worth holding lightly.
6. **`n` is small in absolute terms.** 11 sittings for a global exam. Cluster counts of 6 vs 3 are directionally meaningful; 3 vs 1 is noise.

## 8. Verdict

**Does the Sec+ ranked list change? NO.**
**Does any grade move? NO.**

| Archetype | Grade | Movement | Rationale |
|---|---|---|---|
| `vpn` (#1) | unchanged | **strengthened** | 5 → 6 sittings. Site-to-site sub-shape promoted from *superseded-blog-only* to *firsthand-corroborated*. The #1 rank was already secure; it is now better-founded. |
| `logs` | unchanged | **strengthened** | 5 → 6 sittings. |
| `firewall` | unchanged | +1 (2 → 3) | Still shape-unspecified. Drag-drop **refuted as folklore** (see below) — the seed must not assume it. |
| `diagram` | unchanged | — | Task confirmed (3), interaction still unattested. |
| `cli` | unchanged | — | 1 sitting + 1 competency mention. |
| `iam` | **C** | none | STILL ZERO, now well-hunted. |
| `vulnq` | **C** | none | STILL ZERO on 701 (exists on 601). |
| `certchain` | **C** | none | STILL ZERO on 701. |

**Per the brief's framing:** nothing found here is a new archetype. The firewall +1 and the site-to-site confirmation are **seed extensions on already-shipped archetypes** (`firewall`, `vpn`). No ranking recommendation follows from them.

**The one finding that should change a build decision:** the firewall drag-drop rule-table is **not merely unevidenced — it is affirmatively traceable to prior-gen 501/401 drag-drop posts that were never about firewalls.** Same for subnet drag-drop, traceable to a Network+ post. If either interaction is currently in a seed or backlog on the strength of "everyone knows Sec+ has firewall drag-drop", **it should be removed or explicitly re-labelled as a design choice with zero evidentiary support.** That is a deletion, not an addition, and it's the most actionable output of this pass.

**Recommendation on further Sec+ evidence passes: stop.** Three passes, ~177 titles, a saturated instrument, and the marginal return of this pass was +2 sittings — one of which (S11) is medium-confidence. The gaps that remain open (region, single-source, 2026 format-thinness) are **not searchable on r/CompTIA**; they'd need a different source entirely (Discord, a survey, CompTIA's own published sample PBQ). A fourth pass on this route would be motivated reasoning.
