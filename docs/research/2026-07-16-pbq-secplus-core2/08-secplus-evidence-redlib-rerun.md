# SY0-701 PBQ Format Evidence — Redlib Re-run

**Date:** 2026-07-16
**Scope:** Firsthand r/CompTIA reports of *interactive PBQ formats* on CompTIA Security+ SY0-701.
**Status:** Research only. No brain-dump material sought, opened, or reproduced. Format shape only — no items, wording, options, or answers.
**Supersedes (in coverage, not in kind):** the prior blog-only pass, which had 2 independent sittings.

---

## 1. Route log

**What worked:** the in-app Browser pane against the Redlib mirror `redlib.privacyredirect.com`.

| Step | Result |
|---|---|
| `preview_start {url: redlib.privacyredirect.com/r/CompTIA/search?...}` | Opened, `navOk: true`, rendered fully |
| `get_page_text` on search results | Returns **full post bodies**, not snippets — high yield |
| `navigate` + `get_page_text` on thread permalinks | Returns post + full comment tree with usernames, flair, dates |
| `javascript_tool` to enumerate `a[href*="/r/CompTIA/comments/"]` | Returned 30 thread URLs in one call — best way to build a read list |

**What failed / was not attempted:** reddit.com direct (403 per prior pass — not retried, no time spent). old.reddit.com not needed. No mirror degradation encountered; `redlib.privacyredirect.com` was stable across ~10 navigations.

**Volume actually read this pass:**
- 5 search result pages (each returning full post bodies): `SY0-701 PBQ` (sort=new), `Security+ PBQ` (sort=new, t=year), `PBQ firewall rule`, `PBQ drag and drop security`, `security+ PBQ logs infected`, `PBQ VPN configure`, `Sec+ PBQ certificate OR terminal OR subnet`
- 5 full threads read including comment trees: `1spjlid` (46 comments), `1ubu1lj` (44), `1u2e91x` (24), `1k1j5wp` (35), `1phxp1x` (0)
- ~30 thread titles enumerated; low-signal ones triaged out by title/snippet rather than opened.

**Key efficiency finding for future passes:** Redlib search result pages return the *entire post body*. Most format evidence lives in the post body, so search-page reads are ~5x cheaper than thread navigation. Comments added value in only 1 of 5 threads read (`1spjlid`).

---

## 2. Format claims (type c) — independent sitting counts

All rows below are **firsthand** (poster describing their own sitting) unless marked. Region is unknown for all except where noted — Reddit posters rarely state it. This is a real gap.

| # | User | Post date | Exam code basis | PBQ format described (type c) | Conf. | URL |
|---|---|---|---|---|---|---|
| S1 | `FitFun8149` | 2024-08-07 | 701-era (74Q/2PBQ, Messer 701 prep) | (a) **Network diagram + per-user log viewer**, ~12–15 log lines per user, 6 users; determine virus origin and **label each user Clean / Infected / Originated**. (b) **Configure two VPN concentrators**, ~12 fields each, filled **from provided option sets** | High | [/r/CompTIA/comments/…](https://redlib.privacyredirect.com/r/CompTIA/search?q=PBQ+VPN+configure&restrict_sr=on) |
| S2 | `pchulbul619` | 2025-02-25 | 701-era (77Q/3PBQ) | (a) **Firewall logs + network diagram** → mark which systems infected vs clean. (b) **IPSec VPN concentrator configuration**. (c) **Build a full High Availability architecture** for an enterprise | High | thread `1iwvvxx`-era, via `PBQ VPN configure` search |
| S3 | `Altruistic_Will7110` | 2024-07-18 | **SY0-701 explicit** (title) | (a) PBQ covering algorithm choice / **RADIUS auth** / VPN. (b) **Review firewall + endpoint logs to identify infected systems and malware** | High | `SECURITY+701 PASSED!!!` |
| S4 | `harderscopes` | 2024-10-24 | **SY0-701 explicit** (title) | 3 PBQ / 73 MCQ. Advises understanding **VPN concentrator setup, screened subnets, reading alerts in logs** — i.e. the three he sat | Med-High | `Passed Security+ SY0-701! How I prepared` |
| S5 | `Own-Needleworker6705` | 2024-07-07 | 701-era (Messer 701 course) | 2 PBQs: (a) **VPN configuration**. (b) **Attacks matched to resolutions** (mapping/matching exhibit) | High | `Sec+ Passed Exam - No experience` |
| S6 | `Bizzy_The_Demon` | 2025-06-23 | 701-era (601 retired 2024-07) | PBQs "all had to do with **analyzing logs and configuring firewalls**" | Med | `Passed Sec Plus!` |
| S7 | `H_Leimgruber` | ~2026-06-21 | **SY0-701 explicit** (Messer SY0-701) | **Command-prompt / terminal PBQ** — typing `help` enumerates every available command in the sim | High | [/r/CompTIA/comments/1ubu1lj](https://redlib.privacyredirect.com/r/CompTIA/comments/1ubu1lj/how_i_passed_security_with_an_808_in_3_weeks/) |
| S8 | `thehermitcoder` | 2026-04-19 | 701-era (Dion/Ramdayal SY0-701 prep) | **5 PBQs**; first was a **network design PBQ** (no further detail — poster explicitly declined) | Med | [/r/CompTIA/comments/1spjlid](https://redlib.privacyredirect.com/r/CompTIA/comments/1spjlid/attempted_the_security_and_it_wasnt_what_i/) |
| S9 | `TangyStart` | ~2026-07-06 | **SY0-701 explicit** (title) | Names the three competencies his PBQs demanded: **deciphering logs, CLI, network architecture** | Med-Low (competency list, not exhibit description) | [/r/CompTIA/comments/1uoltxt](https://redlib.privacyredirect.com/r/CompTIA/comments/1uoltxt/sy0701_done/) |

**Independent sittings with genuine type-(c) format detail: 9** (S1–S9).
Baseline was 2. **Net +7.**

### Format clusters, by independent sitting count

| Format cluster | Independent sittings | Which |
|---|---|---|
| **Multi-host log analysis → classify each host** | **5** | S1, S2, S3, S4, S6 |
| **VPN concentrator configuration form** (field-fill from option sets) | **5** | S1, S2, S3, S4, S5 |
| **Network / architecture design or build** | **3** | S2 (HA architecture), S4 (screened subnets), S8 (network design) |
| **Firewall configuration** (shape unspecified) | **2** | S2, S6 |
| **Matching / mapping** (attack → resolution) | **1** | S5 |
| **Terminal / CLI sim** (with discoverable `help`) | **1** | S7 (+S9 names CLI as a competency) |
| **AAA / RADIUS + wireless config** | **1** | S3 |

---

## 3. Disposition of the 5 prior claims

### Claim 1 — Multi-host log analysis → label each endpoint Clean/Infected/Source
**CONFIRMED (+3 net new sittings; now 5 total independent, was 2).**
S1 is the strongest single source and matches the claim almost exactly, including the three-way labelling (`Clean, Infected, or Originate this virus`) and the exhibit being a network diagram plus a per-host log viewer. S2 and S3 independently describe the same shape. S4 and S6 corroborate the log-analysis exhibit without the labelling detail. Notably, the same shape appears in prior-gen 601 reports (§6) — this is a long-lived CompTIA pattern, which raises confidence it persists but does not itself prove 701.

### Claim 2 — VPN configuration form, possibly site-to-site Phase 1 / Phase 2
**CONFIRMED as a format (+3 net new; now 5 total). Phase 1/Phase 2 detail: UNRESOLVED — and the single prior source for it is now the *only* source for it.**
The VPN config form is the best-attested format alongside log analysis. S1 gives the richest description: **two** concentrators, ~12 fields each, values chosen from supplied option sets. S2 names it **IPSec**. But **no source in this pass used the words "Phase 1" or "Phase 2", and none said "site-to-site".** S1's "two concentrators" is *consistent with* site-to-site and ~12 fields *is consistent with* a Phase 1/Phase 2 split — but that's my inference, not testimony. I am flagging this explicitly: the Phase detail remains a 1-sitting claim and should not be presented as corroborated.

### Claim 3 — Drag-drop components into subnet/cloud zones
**UNRESOLVED. Adjacent evidence found; the interaction shape is still unattested.**
Three sittings (S2 "build a literal full High Availability architecture for an enterprise", S4 "screened subnets", S8 "network design PBQ") establish that **architecture-construction PBQs exist on 701**. Not one of them describes *how* you construct it — drag-drop vs dropdowns vs click-to-place. So: the objective and the task exist (+3 sittings for the task), the drag-drop interaction does not have firsthand support (0 sittings). Do not upgrade this to "confirmed" on the strength of the task existing.

### Claim 4 — Firewall rule table drag-drop
**STILL ZERO firsthand support for the drag-drop rule-table shape. Reporting honestly.**
This was the specific thing I was sent to hunt. Result after a real search (`PBQ firewall rule`, `PBQ drag and drop security`, plus every pass report read):
- **Firewall PBQs exist**: S6 says PBQs "all had to do with analyzing logs and **configuring firewalls**"; S2 mentions firewall logs. That's +2 sittings for *a firewall PBQ existing*, which is type (c)-lite — the exhibit is named, the interaction is not.
- **Drag-drop firewall rule table: 0 firsthand sittings.** Nobody in the 701 era described dragging rules into a table or reordering rules.
- The closest thing is **indirect and does not count**: S4 remarks that Messer's practice PBQs were mostly not accurate to the exam "except the firewall rule ones." That implies the exam had *something* firewall-rule-shaped resembling Messer's, but it is a comparison to third-party prep material, not a description of what he saw. I am not counting it as a sitting for this claim, and neither should downstream work.
- Every "drag and drop" hit in search was either **SY0-501/601 era** (2020 posts about the drag-drop UI failing in online proctoring) or **Network+ N10-008** (a subnet/protocol drag-drop PBQ). Those are different exams. Flagged, not counted.

**Verdict: the industry's confident "firewall rule table drag-drop" claim remains unsupported by firsthand SY0-701 testimony after two passes.** It should be treated as prep-vendor lore until someone who sat it says otherwise.

### Claim 5 — PBQ count / structure per form (front-loaded, skippable)
**CONFIRMED, and now well-quantified (7 independent sittings reporting counts).**

| Sitting | Date | MCQ | PBQs |
|---|---|---|---|
| S5 `Own-Needleworker6705` | 2024-07-07 | — | 2 |
| S3 `Altruistic_Will7110` | 2024-07-18 | — | 2 |
| S1 `FitFun8149` | 2024-08-07 | 74 total incl. PBQ | 2 |
| S4 `harderscopes` | 2024-10-24 | 73 | 3 |
| S2 `pchulbul619` | 2025-02-25 | 77 total | 3 |
| S8 `thehermitcoder` | 2026-04-19 | — | 5 |
| `knowlegewizard` | 2026-06-10 | 74 total | 4 |

**Range: 2–5 PBQs, ~73–78 total questions.** Never the "90 questions / 5–6 PBQs" that prep material asserts — `FitFun8149` explicitly calls out that mismatch, and `knowlegewizard` notes 90 is the *maximum*, not the norm.

- **Front-loaded: CONFIRMED.** `PurpleCableNetworker` (2026-04-19, firsthand): "the practical portions being the first few questions." S8 hit a PBQ as question 1.
- **Skippable / flaggable: CONFIRMED**, overwhelming consensus and firsthand-executed by S4 ("I immediately skipped all the PBQs"), S8, and multiple commenters. Partial credit is awarded (`Vizreki`, ~2026-07-03: "Pretty sure I got only partial credit on most of the pbq's") — worth carrying forward, it's a scoring-model fact.

---

## 4. Topic-only claims (type b) — kept separate, NOT format evidence

These name a subject area without describing an exhibit or interaction. Listing them so they don't get laundered into §2 later.

- S9 `TangyStart`: PBQs required "deciphering logs, CLI, or network architecture" — competency list.
- S3 `Altruistic_Will7110`: PBQ 1 "concepts covered" were 3DES/AES/Twofish/Blowfish selection, RADIUS, VPN — topics within a PBQ, exhibit unstated (I counted only the RADIUS/VPN *config* aspect as type (c), at Med confidence).
- `AlienZiim` (2025-12-22, 794): PBQs "NOTHING like Messer's examples" — sentiment, zero format content.
- `redgroupclan` (~2026-06-20, trifecta): Messer's PBQs "are really just thickly veiled multiple choice questions" and PDFs can't capture the real interactivity — a statement about *prep material*, not the exam. His glitched-PBQ anecdote is **Network+**, not Sec+.
- `Worried-Attention-43`, `Stunning-Egg-2272`, `So_Forlorn`, `Extra-Driver-813`, `RandiCandy`, `Anastasia_IT`: PBQ strategy/skip advice only.
- `NightHawkFliesSolo`: found CompTIA PBQs time-consuming — but his most recent sitting is **Network+**, not Sec+. Not counted.

---

## 5. Dedup log

- **`H_Leimgruber` (S7) appears twice in my raw capture** — once as a search-result body on the `SY0-701 PBQ` page and once as the full thread `1ubu1lj`. Same post, same person, **one sitting**. Counted once.
- **`TangyStart` (S9) likewise appears in two separate search result pages** (`SY0-701 PBQ` sort=new, and `Security+ PBQ` t=year). Same post `1uoltxt`. **One sitting.**
- **`H_Leimgruber` and `TangyStart` both scored 808** and both posted within ~3 weeks. Checked: different accounts, different backgrounds (H_Leimgruber = years of experience, 3 weeks study; TangyStart = 8 years end-user services, 4 months of audio study), different post IDs. **Two genuinely independent sittings, not a repost.** This is exactly the trap the prior pass fell into — flagging that I checked.
- **`thehermitcoder` (S8) and `PurpleCableNetworker`** are different people in the same thread. S8's post = 1 sitting; PurpleCableNetworker's comment = a separate sitting, used only for the front-loading structural claim (his exam code is unstated, so he is *not* in the §2 format table).
- **`AddendumWorking9756`** (comment in `1spjlid`) describes "the sim drops you into a cold terminal" and pitches CyberDefenders. Reads as vendor promotion, gives no indication of having sat 701, and the phrasing is generic. **Excluded — not counted as a sitting, and specifically not counted as terminal-PBQ support.** S7 is the only terminal-PBQ source.
- **`ContentAd9144`** answers "Performance based question is multiple choice question" — factually wrong bystander comment. Discarded.
- No cross-poster reposts or copied text detected between the 9 counted sittings; each describes a distinct question mix.

---

## 6. Prior-generation (SY0-601 / SY0-501) — FLAGGED, NOT COUNTED as 701 proof

Included only because the shape-persistence is interesting, not as evidence.

| User | Date | Gen | What they describe |
|---|---|---|---|
| `Jonny_Boy_808` | 2023-08-04 | **601** (pre-701 release) | 3 PBQ / 78 MCQ. (a) reading logs, analyzing a group of **infected systems to trace origin**; (b) **matching vulnerability attacks to defenses**; (c) **setting up a guest account with RADIUS + wireless auth/crypto** |
| `Noumenon72` | 2024-01-28 | **Ambiguous 601/701** (both live) | 30 min on a PBQ with **virus scanner + firewall logs**, reasoning about which host infected which and identifying the attacker |
| `1unusualredditor` | 2020-06-20 | **501** | 81 Q / 5 PBQ; Linux logs/commands |
| `paythemanhismoney`, `Uniquelypopular` | 2020-09 / 2020-07 | **501** | Drag-and-drop PBQ UI failing under online proctoring — *this is where much of the "Sec+ has drag-drop" folklore originates* |

**Important:** `Jonny_Boy_808` (601) and S1/S2/S3 (701) describe near-identical log-analysis and RADIUS/config shapes. That's a decent argument the pattern survived the 601→701 revision — but it is an argument, not evidence, and it must not be used to inflate the 701 sitting count. Equally: the 2020 drag-drop reports are **501**, and are the likely root of the firewall-drag-drop claim in Claim 4. Their existence is a reason to be *more* suspicious of that claim for 701, not less.

---

## 7. Honest statement of remaining sample bias

The sample improved a lot, but it is not clean:

1. **Survivorship bias, total.** All 9 sittings are *passes*. Nobody who failed wrote a format-rich retro. Formats that filter people out are systematically under-described.
2. **Self-censorship on exactly the detail we want.** Multiple posters explicitly stop short — S8: "while I won't go into details"; S6: "Hopefully me saying that isn't against any rules." NDA caution truncates format description precisely at the interaction layer. This is *why* Claim 3 and Claim 4 stay unresolved: people name the exhibit and refuse to describe the widget. That gap is structural and probably will not close through Reddit.
3. **Exhibit named, interaction not.** Even the best source (S1) tells us "12 fields, fill from given options" — that's a form, but is it dropdowns, drag targets, or free text? Unknown. Across all 9 sittings, we have solid **exhibit-type** evidence and thin **interaction-shape** evidence. Any product decision that depends on interaction shape is still under-evidenced.
4. **Region unknown for 8 of 9.** Only `harderscopes` gives a locale signal (US, tested on a military base, DoD-motivated). r/CompTIA skews US/DoD heavily, and Security+ demand is DoD 8570-driven, so the sample almost certainly over-represents US test centers. If forms vary by region, we would not see it.
5. **Date skew.** 5 of 9 sittings are 2024, only 2 are 2026. CompTIA rotates forms. The oldest sittings (Jul–Aug 2024) are nearly two years stale and sit right at the 601→701 transition. The two most recent 701 reports (S7, S9) are also the *thinnest* on format — so our richest data is our oldest data. That is the single biggest weakness left.
6. **Single-community sample.** All 9 from r/CompTIA. No Discord, no TechExams, no Reddit alternatives. Same forum norms, same NDA culture, same demographics.
7. **One source doing heavy lifting.** S1 (`FitFun8149`) alone supplies most of the Clean/Infected/Source detail *and* most of the VPN-form detail. If S1 is wrong or embellished, two "confirmed" claims lose their best support and fall back to thinner corroboration. The corroboration is real (S2, S3), but it is less specific.

**Bottom line:** Claims 1, 2 (format), and 5 are now genuinely well-supported and can be built on. Claim 2's Phase 1/Phase 2 detail, Claim 3's drag-drop-into-zones, and Claim 4's firewall rule table are **not** — and Claim 4 in particular has now survived two deliberate hunts with zero firsthand support. Treat it as unsupported vendor lore.
