# CompTIA A+ Core 2 (220-1202): Official Objectives + Training Ecosystem Survey

Research date: 2026-07-16. Researcher note on hygiene: every vendor capability below is marked **[INSPECTED]** (page content directly read) or **[CLAIM]** (vendor marketing / search-snippet, not independently verified). Objective existence is never treated as evidence that a PBQ exists for it. 220-1102 material is prior-generation and flagged. No brain-dump sources were used or cited.

---

## 1. Official objectives — version, domains/weights, hands-on-flavored objectives, OS coverage

### Document identity [INSPECTED — official PDF parsed directly]

- **Title:** "CompTIA A+ Core 2 (220-1202) V15 Certification Exam — Exam Objectives Document Version 3.0"
- **Version string:** **Exam Objectives Document Version 3.0** (Copyright © 2024 CompTIA, Inc.). This is the final/launch version. An earlier "Version 2.0" draft circulated pre-launch (mirrors dated Sept 2025 still host it); the 3.0 document is what training vendors (ExamCompass, Crucial Exams, innovativelearning.eu) now mirror and what CompTIA's CDN serves.
- **Official PDF (CompTIA CDN/Contentful):** https://assets.ctfassets.net/82ripq7fjls2/6I8WL66IBa1AUovioDGrnM/f74a7eca336fd4e4c8e723a1f893086d/CompTIA-A-220-1202-Exam-Objectives-3.0.pdf (20 pages, ~268 KB)
- Companion Core 1 doc: CompTIA-A-220-1201-Exam-Objectives-3.0.pdf (same CDN).

### Test details (from the objectives PDF) [INSPECTED]

| Item | Value |
|---|---|
| Questions | Maximum of 90 |
| Question types | Multiple-choice and **performance-based** (CompTIA's V15 cert page adds: single/multiple response MCQ, drag-and-drop, PBQ) |
| Length | 90 minutes |
| Passing score | 700 (scale 100–900) — Core 1 is 675 |
| Recommended experience | 12 months hands-on IT support specialist role |
| Languages | English (as of the V15 page snapshot) |

### Domains and weights [INSPECTED — official PDF]

| Domain | Weight |
|---|---|
| 1.0 Operating Systems | 28% |
| 2.0 Security | 28% |
| 3.0 Software Troubleshooting | 23% |
| 4.0 Operational Procedures | 21% |
| **Total** | **100%** |

Note: Core 2 V15 has **four** domains — no separate cloud/virtualization domain (that lives in Core 1; Core 2 touches cloud only via 1.11 cloud-based productivity tools). A search-snippet claim of a fifth "Cloud Computing & Virtualization" domain for Core 2 is wrong.

### Full objective list with hands-on/scenario flavor

Statements extracted from the official PDF; numbering cross-checked against Professor Messer's 220-1202 course index (section numbers mirror the official objectives). **Bold = "Given a scenario" wording**, CompTIA's marker for applied/PBQ-eligible objectives. 23 of 36 objectives are scenario-flavored.

**1.0 Operating Systems (28%)**
- 1.1 Explain common operating system (OS) types and their purposes
- **1.2 Given a scenario, perform OS installations and upgrades in a diverse environment** (boot methods, partitioning GPT/MBR, upgrade considerations — the OS-deployment objective)
- 1.3 Compare and contrast basic features of Microsoft Windows editions (Windows 10 and Windows 11 editions: Home, Pro, Pro for Workstations, Enterprise, N versions)
- **1.4 Given a scenario, use Microsoft Windows OS features and tools**
- **1.5 Given a scenario, use the appropriate Microsoft command-line tools** (incl. ipconfig, ping, netstat, nslookup, net use/user, tracert, sfc, etc.)
- **1.6 Given a scenario, configure Microsoft Windows settings** (Settings app vs Control Panel)
- **1.7 Given a scenario, configure Microsoft Windows networking features on a client/desktop**
- 1.8 Explain common features and tools of the macOS/desktop operating system
- 1.9 Identify common features and tools of the Linux client/desktop operating system
- **1.10 Given a scenario, install applications according to requirements**
- **1.11 Given a scenario, install and configure cloud-based productivity tools** (cloud mail, collaboration, identity synchronization)

**2.0 Security (28%)**
- 2.1 Summarize various security measures and their purposes (incl. IAM, directory services)
- **2.2 Given a scenario, configure and apply basic Microsoft Windows OS security settings** (the permissions/NTFS-vs-share objective)
- 2.3 Compare and contrast wireless security protocols and authentication methods (incl. Kerberos, MFA)
- 2.4 Summarize types of malware and tools/methods for detection, removal, and prevention (WinRE, EDR, email gateways, software firewalls)
- 2.5 Compare and contrast common social engineering attacks, threats, and vulnerabilities
- **2.6 Given a scenario, implement procedures for basic SOHO malware removal** (the numbered malware-removal sequence: verify symptoms → quarantine → disable System Restore (Windows Home) → remediate → scan/removal via safe mode/preinstallation environment → reimage/reinstall → schedule scans → re-enable System Restore → educate user — a classic ordering-PBQ target)
- **2.7 Given a scenario, apply workstation security options and hardening techniques** (disable AutoRun/AutoPlay, disable unused services)
- **2.8 Given a scenario, apply common methods for securing mobile devices** (BYOD vs corporate-owned, profile security requirements)
- 2.9 Compare and contrast common data destruction and disposal methods
- **2.10 Given a scenario, apply security settings on SOHO wireless and wired networks**
- **2.11 Given a scenario, configure relevant security settings in a browser** (new emphasis vs 1102)

**3.0 Software Troubleshooting (23%) — all four objectives are scenario-based**
- **3.1 Given a scenario, troubleshoot common Windows OS issues** (incl. slow profile load, time drift)
- **3.2 Given a scenario, troubleshoot common mobile OS and application issues** (app crashes, update/battery issues, autorotate)
- **3.3 Given a scenario, troubleshoot common mobile OS and application security issues** (jailbreaking, app spoofing, data-usage anomalies)
- **3.4 Given a scenario, troubleshoot common personal computer (PC) security issues** (desktop alerts, false antivirus alerts, altered files, OS update failures, certificate warnings)

**4.0 Operational Procedures (21%)**
- **4.1 Given a scenario, implement best practices associated with documentation and support systems information management** (ticketing, knowledge base)
- **4.2 Given a scenario, apply change management procedures**
- **4.3 Given a scenario, implement workstation backup and recovery methods**
- **4.4 Given a scenario, use common safety procedures**
- 4.5 Summarize environmental impacts and local environment controls (UPS, surge suppressor)
- 4.6 Explain the importance of prohibited content/activity and privacy, licensing, and policy concepts
- **4.7 Given a scenario, use proper communication techniques and professionalism**
- 4.8 Explain the basics of scripting (script types, use cases: automation, restarts, reimaging, backups — Explain-level, not "Given a scenario", so scripting is knowledge-flavored on Core 2 V15)
- **4.9 Given a scenario, use remote access technologies**
- 4.10 Explain basic concepts related to artificial intelligence (AI) (**new in V15**: AI integration, appropriate/inappropriate use, bias, hallucinations, private vs public — per objectives PDF and Messer's 4.10 section)

Highest-value PBQ-flavored clusters for CertAnvil: 2.6 malware-removal ordering, 2.2 Windows security settings/permissions, 1.2 OS install/upgrade, 1.5 command-line tools, 3.1/3.4 troubleshooting scenarios, 4.2 change management, 4.3 backup/recovery.

### OS coverage as stated in the official objectives [INSPECTED]

- **Windows pinning — verbatim "NOTE ON WINDOWS 11" from the PDF:** "Versions of Microsoft Windows that are not end of Mainstream Support (as determined by Microsoft), up to and including Windows 11, are intended content areas of the certification. As such, objectives in which a specific version of Microsoft Windows is not indicated in the main objective title can include content related to Windows 10 and Windows 11, as it relates to the job role."
  - Practical reading: both **Windows 10 and Windows 11** are in scope; 1.3 explicitly enumerates Windows 10 editions AND Windows 11 editions (Home / Pro / Pro for Workstations / Enterprise, plus N versions).
- **Workstation OSs listed in 1.1:** Windows, Linux, macOS, **Chrome OS**.
- **Mobile OSs listed in 1.1:** **iPadOS, iOS, Android** (iPadOS is called out separately — relevant for question metadata).
- **Filesystems (1.1):** NTFS, ReFS (new in V15), FAT32, ext4, XFS, APFS. (ext3 and optical media dropped from 1102.)
- Dedicated desktop-OS objectives exist only for Windows (1.3–1.7), macOS (1.8, "Explain"), Linux (1.9, "Identify" — lightest verb). ChromeOS appears only as an OS type in 1.1, not as its own objective.

---

## 2. Exam lifecycle status

| Event | Date | Source quality |
|---|---|---|
| 220-1201/220-1202 (V15) launch | **March 25, 2025** (English) | [INSPECTED — comptia.org V15 page + Professor Messer] |
| 220-1101/220-1102 (V14) retirement | **September 25, 2025** (English; launched April 20, 2022) | [INSPECTED — Professor Messer article, updated 2025-03-30; corroborated by ExamCompass retirement page and multiple trackers] |
| 220-1201/1202 estimated retirement | ~September 2028 ("usually three years after launch (estimated 2028)" per CompTIA; Messer estimates ~3.5 years) | [CLAIM — estimates] |
| V15 rule | Core 1 and Core 2 must be passed **from the same version** — no mixing 1102 with 1201 etc. | [INSPECTED — comptia.org V15 page] |

Status as of 2026-07-16: **220-1202 is the only live Core 2 exam and has been for ~10 months.** Any training product still keyed to 220-1102 is prior-generation content. CompTIA lists non-English availability as "English" on the V15 page snapshot; other languages typically follow later [CLAIM as to future languages].

---

## 3. Training ecosystem for 220-1202 — PBQ-style/interactive practice, claim vs inspected

Legend: exam code covered; **1102 flag** = product (or part of catalog) still on prior-gen 220-1102.

| Product | Exam code | Inspection status | Interactive/PBQ formats offered | Feedback / partial credit | Breadth | Access/paywall | Last-update signal |
|---|---|---|---|---|---|---|---|
| **CompTIA CertMaster Practice (official)** | 220-1202 (A+ Core 2 V15 SKU sold via CompTIA store/resellers) | Product page [INSPECTED]; PBQ specifics [CLAIM] | Adaptive questions-first design; timed + untimed practice tests "with performance-based questions" [CLAIM]; exam-objective assessments | Mastery-score reporting, objective-level performance views; "smart feedback" [CLAIM]; no partial-credit model published | Full 1202 blueprint [CLAIM] | Paid; 12-mo license typical; bundled in Complete Learning Bundle | V15 SKUs exist since launch; platform merged with TestOut ("new CertMaster platform", 2024+) |
| **CompTIA CertMaster Labs (official)** | 220-1202 V15 SKU | Product page [INSPECTED]; specifics [CLAIM] | Hands-on labs in **live virtual machines**, immersive job-scenario tasks, step-by-step guided mode | "Instant feedback" on task completion [CLAIM]; scored labs not detailed publicly | Labs aligned to exam objectives [CLAIM] | Paid, license-based; browser-delivered | V15 alignment [CLAIM] |
| **TestOut LabSim** | Being absorbed | comptia.org/lp/testout [INSPECTED] | Historic strength: simulated-hardware/OS labs. CompTIA page says they are "working on fully merging the CompTIA and TestOut platforms" — LabSim content now surfaces through platform.comptia.org / CertMaster ecosystem, not as a standalone 1202 LabSim SKU | — | — | Via CompTIA platform login | Merger in progress as of page snapshot; standalone LabSim for V15 not found [INSPECTED absence] |
| **Professor Messer** | 220-1202 ✓ (free course covers all 36 objectives; 220-1102 archive still online — flagged prior-gen) | Course index + bundle page [INSPECTED] | Free videos per objective; paid Success Bundle ($159 w/ books): Course Notes, **Core 2 Practice Exams** (downloadable PDF-style exam sets). No interactive PBQ engine found on the product page [INSPECTED absence]; third-party snippets saying his exams "include PBQs" or "do not include PBQ format" conflict — treat both as [CLAIM] | Written explanations; no partial credit (not interactive) | All 4 domains | Videos free; notes/exams paid one-time | Course built out May–June 2025 (image timestamps) |
| **Dion Training** | 220-1202 ✓ — has a **dedicated PBQ Practice Pack** | Product pages [INSPECTED for Practice Exam Pack + Sec+ PBQ pack; A+ PBQ pack details via search snippet — CLAIM] | **CompTIA A+ Core 2 (220-1202) PBQ Practice Pack, $29.99**: interactive 5-question sets from a bank of **100 PBQ-style questions**; focus areas: Windows administration, security configuration, malware removal, operational procedures [CLAIM for specifics]. Separate Practice Exam Pack $29.99 (unlimited retakes, randomized/dynamic sets) [INSPECTED]; full Prep Pack (course + labs + exams) also sold | "Step-by-step guided solutions" per PBQ [CLAIM]; MCQ packs give detailed explanations [INSPECTED]; no partial-credit statement | PBQ pack targets toughest types; exam packs cover full blueprint | Paid per-product ($29.99 each); also Udemy variants (smaller banks) | Products keyed to 1202 (current-gen) |
| **Pocket Prep** | Covers **both 220-1201 and 220-1202** in one A+ app (subjects prefixed "1201 …"/"1202 …") | Product page [INSPECTED] | **MCQ only** — no PBQ/interactive formats advertised [INSPECTED absence]. Quiz modes: missed-question retakes, weakest-subject, Level Up (progressive difficulty), mock exam / "test day experience" | Per-question detailed explanations; subject-level analytics | 1,130 questions across Core 1+2 | Freemium: 80 questions free; Premium $20.99/mo, $49.99/3-mo, $124.99/yr; pass guarantee | Current-gen (1201/1202 subject labels) |
| **ExamCompass** | 220-1201 and **220-1202** ✓ (also hosts legacy 220-1102 tests — flagged prior-gen; even mirrors the official 3.0 objectives PDF) | Home + search [INSPECTED for existence; per-test UX not driven] | Free browser MCQ quizzes (25 questions/test, instant score report, no registration). At least 22 numbered Core 2 tests plus topic-based tests. **No PBQ simulation** [CLAIM based on format description] | Instant scoring; explanation depth varies [CLAIM] | Wide MCQ coverage per domain | Free, ad/affiliate supported | 1202 tests live; site actively maintained |
| **MeasureUp (official CompTIA practice-test partner via mindhub/Pearson)** | 220-1202 ✓ (also still sells 1101+1102 bundle — flagged prior-gen) | Product page [INSPECTED] | "A total of **fourteen different question types**" replicating look and feel of the real exam [CLAIM — types not enumerated on page]; Practice Mode (customizable: count, timer, randomization) + Certification Mode (timed, simulates exam) | Detailed explanations with online references for correct AND incorrect options; no partial-credit statement | ~150 questions per boilerplate; a snippet claims 287 for this SKU [CLAIM, conflicting] — page lists per-domain counts (e.g., Security 92, Operational Procedures 68) | Paid: $99–109 (mindhub) / $49 (Pearson VUE Gov store); 30- or 60-day activation window; Test Pass Guarantee | Objectives on page match 1202 v3.0 wording (current) |
| **Boson ExSim-Max** | 220-1202 ✓ (still sells 1102 ExSim + kit — flagged prior-gen) | Product page [INSPECTED] | 3 full-length exams, **231 questions**, "simulate the format, difficulty, and question variety of the actual exam"; Simulation Mode (live-exam timing) + Study Mode. Degree of true PBQ interactivity not specified [CLAIM]. Separate **Practice Lab for 220-1202** (hands-on multi-system networked environment) [CLAIM] | Detailed explanations per question; score reports; pass guarantee ("if you can pass ExSim-Max… you'll pass the live exam") [CLAIM] | Full 1202 blueprint | Paid (typical ExSim pricing ~$99); desktop exam engine | 1202 SKU is current-gen |
| **Crucial Exams** | 220-1202 ✓ (V15-labeled) | Practice hub [INSPECTED] | **7 PBQs "presented as hands-on exercises and mini-games"** (e.g., configure home WLAN settings, match OS use cases); selected PBQs previewable read-only before paying; 1,000-question MCQ bank; custom timed tests (5–100 questions, objective filtering); flashcards | Interactive PBQ interface; explanations; no partial-credit model published | 1,000 MCQ + 7 PBQ (PBQ breadth is thin: 7 items) | Freemium: no-signup demo, free users 20 questions/test; paid for unlimited; **iOS and Android apps with timed mode + synced progress** [CLAIM] | V15-labeled; no published question-refresh cadence [INSPECTED FAQ admission] |
| **LabsDigest / ExamsDigest** | 220-1202 ✓ (dedicated "Core 2 Performance-Based Questions (PBQs)" course; Core 1 equivalent exists) | Course landing page fetched; detail thin [CLAIM] | PBQ-style interactive tasks mapped to 1202 syllabus; search snippet claims coverage of "Windows troubleshooting, Active Directory, mobile device management, and security scenarios" in 10-question interactive quizzes [CLAIM] | Not stated | Not stated | Paid — "Lifetime Access" upsell ("All certs • All updates • Forever") | Page assets dated Nov 2025 |
| **101Labs.net** | 220-1202 ✓ ("CompTIA A+ 220-1202 PBQ Practice Questions" page exists) | Page fetched but content is **behind member login** — could not inspect a single PBQ [CLAIM entirely] | PBQ practice questions per title; interaction types unknown | Unknown | Unknown | Membership-gated | Unknown |
| **ExamPremium / passitexams / EDUSUM / uCertify / prepsaret etc.** | Various 1202 pages exist | Not inspected | — | — | — | — | Not evaluated in depth; EDUSUM/"sample questions" sites skirt close to dump territory — excluded from recommendations |

### Cross-cutting observations for CertAnvil

1. **The PBQ-practice gap is real and current.** Only three products offer genuinely interactive 1202 PBQ practice at consumer prices: Dion's PBQ Practice Pack (100 items, $29.99, [CLAIM] on interactivity depth), Crucial Exams (7 PBQs, freemium), LabsDigest (unknown depth, lifetime-paywall). Official CertMaster PBQs live inside a full paid platform. Everything else is MCQ dressed as "exam simulation."
2. **Mobile behaviour is almost never addressed for PBQs.** Pocket Prep is mobile-first but MCQ-only; Crucial Exams claims iOS/Android apps with timed tests but doesn't state PBQs work on mobile. No vendor publishes a mobile PBQ interaction story. [INSPECTED absence across pages]
3. **Partial credit / feedback models are undocumented everywhere.** CompTIA itself doesn't publish PBQ partial-credit rules for the live exam (community folklore says partial credit exists — [CLAIM]); no vendor documents one for practice either.
4. **1102 leftovers are everywhere:** Boson, MeasureUp, ExamCompass, Messer, and app stores all still carry 220-1102 material ~10 months after retirement. Any competitive teardown must check exam code per SKU, not per vendor.

---

## 4. Source list

**Official / objectives**
- CompTIA A+ Core 2 (220-1202) Exam Objectives v3.0 PDF (CompTIA CDN): https://assets.ctfassets.net/82ripq7fjls2/6I8WL66IBa1AUovioDGrnM/f74a7eca336fd4e4c8e723a1f893086d/CompTIA-A-220-1202-Exam-Objectives-3.0.pdf — parsed 2026-07-16; local copy in session scratchpad
- Core 1 v3.0 PDF: https://assets.ctfassets.net/82ripq7fjls2/1oSdlyujpaX3GrM0rir6Ge/91afb2be72785281e8fb4c0d9a70c6f4/CompTIA-A-220-1201-Exam-Objectives-3.0.pdf
- CompTIA A+ V15 page: https://www.comptia.org/en-us/certifications/a/core-1-and-2-v15/ ; Core 2: https://www.comptia.org/en-us/certifications/a/core-2-v15/
- CompTIA–TestOut merge notice: https://www.comptia.org/en-us/lp/testout/
- CertMaster Practice: https://www.comptia.org/en-us/resources/certmaster-training/practice/ ; CertMaster Labs: https://www.comptia.org/en/resources/certmaster-training/labs/
- Objectives mirrors: https://www.examcompass.com/comptia-certifications/a-plus/core-2/comptia-a-plus-220-1202-exam-objectives.pdf ; https://crucialexams.com/exams/comptia/a/220-1202/p/comptia-a-220-1202-v15-exam-objectives ; https://www.innovativelearning.eu/news-resources/free-resources/downloads/comptia-a-certification-exam-core-2-objectives-220-1202.html (confirms "(3.0)" filename, published 2025-10-29)

**Lifecycle**
- Professor Messer, "Differences between 220-1102 and 220-1202" (updated 2025-03-30): https://www.professormesser.com/free-a-plus-training/a-plus-articles/differences-between-220-1102-and-220-1202/ — launch 2025-03-25, 1102 retirement 2025-09-25, ~80% topic overlap, 122 new topics, dropped topics list
- ExamCompass retirement dates: https://www.examcompass.com/comptia/exam-retirement-dates

**Ecosystem**
- Professor Messer 220-1202 course index: https://www.professormesser.com/free-a-plus-training/220-1202/220-1202-video/220-1202-training-course/ ; Success Bundle: https://www.professormesser.com/220-1202-success-bundle/
- Dion Training: PBQ Practice Pack https://www.diontraining.com/products/comptia-a-core-2-220-1202-pbq-practice-pack ; Practice Exam Pack https://www.diontraining.com/products/comptia-a-core-1-220-1202-practice-exam ; Prep Pack https://www.diontraining.com/products/comptia-a-220-1202-complete-course-labs-practice-exams ; (structure corroborated by their Sec+ PBQ pack page, inspected)
- Pocket Prep A+: https://www.pocketprep.com/exams/comptia-a/
- ExamCompass 1202 tests (examples): https://www.examcompass.com/comptia-a-plus-certification-practice-test-1-exam-220-1202 (tests 1–22+); home: https://www.examcompass.com/
- MeasureUp 1202 practice test: https://www.measureup.com/comptia-a-core-2-practice-test.html ; mindhub listing: https://www.mindhub.com/comptia-a-core-2-220-1202-practice-test/p/MU-220-1202-OPT
- Boson ExSim-Max 220-1202: https://boson.com/product/exsim-max-for-comptia-a-220-1202/ ; Practice Lab: https://boson.com/product/practice-lab-for-comptia-a-220-1202/
- Crucial Exams 1202 hub: https://crucialexams.com/exams/comptia/a/220-1202/practice-tests-practice-questions
- LabsDigest 1202 PBQs: https://labsdigest.com/courses/comptia-a-plus-core-2-performance-based-questions-pbqs/ ; ExamsDigest objectives page: https://examsdigest.com/comptia-a-220-1202-v15-core-2-exam-objectives/ (last updated 2025-11-09)
- 101Labs 1202 PBQ page (login-gated): https://www.101labs.net/comptia-a-plus-220-1202-pbq-practice-questions/
