# Security+ SY0-701 — Official Objectives & PBQ Practice Ecosystem

Research date: 2026-07-16. Method: official CompTIA objectives PDF (downloaded and text-extracted, verified directly), CompTIA product pages (fetched), vendor product pages (fetched where possible), web search otherwise. Every ecosystem entry below is labeled **INSPECTED** (page directly fetched/read) or **CLAIM** (vendor marketing / search snippet, not independently verified). Note the standing epistemic rule: *an objective existing in the blueprint is NOT evidence that a given PBQ format appears on the live exam.* CompTIA does not publish PBQ formats per objective; all format expectations below are inference or vendor claims.

---

## 1. Official exam objectives (verified — primary source)

**Document:** "CompTIA Security+ SY0-701 Certification Exam: Exam Objectives **Version 5.0**", Copyright © 2023 CompTIA, Inc.
**Source:** Official CompTIA-hosted PDF at `https://assets.ctfassets.net/82ripq7fjls2/6TYWUym0Nudqa8nGEnegjG/0f9b974d3b1837fe85ab8e6553f4d623/CompTIA-Security-Plus-SY0-701-Exam-Objectives.pdf` (downloaded and text-extracted 2026-07-16 — version string, domains, weights, and all 28 objectives read directly from the document). CompTIA's product page (comptia.org/en-us/certifications/security/) brands the same exam "Security+ **V7**"; "Version 5.0" is the objectives-document version string, "V7" is the exam-generation marketing label. Both refer to exam series code SY0-701.

**Test details (from the objectives PDF, verified):** maximum 90 questions; multiple-choice and performance-based; 90 minutes; recommended 2 years IT administration with security focus. Passing score 750/900 (from CompTIA product page, fetched 2026-07-16).

### Domains and weights (verified from PDF)

| Domain | Weight |
|---|---|
| 1.0 General Security Concepts | 12% |
| 2.0 Threats, Vulnerabilities, and Mitigations | 22% |
| 3.0 Security Architecture | 18% |
| 4.0 Security Operations | 28% |
| 5.0 Security Program Management and Oversight | 20% |

### All 28 objectives, with hands-on flavor flagged

Titles extracted verbatim from the PDF. The PDF's two-column layout shifts numbers relative to titles in raw extraction; numbering below was reconciled against document order and cross-checked (consistent with every third-party rendering encountered). Seven objectives use the **"Given a scenario"** stem — CompTIA's signal that the objective is assessed at the apply/do level, the natural PBQ feedstock (flagged ▶). The rest use Compare/Contrast, Explain, Summarize (knowledge level).

| # | Objective | Hands-on stem |
|---|---|---|
| 1.1 | Compare and contrast various types of security controls. | — |
| 1.2 | Summarize fundamental security concepts. | — |
| 1.3 | Explain the importance of change management processes and the impact to security. | — |
| 1.4 | Explain the importance of using appropriate cryptographic solutions. | — |
| 2.1 | Compare and contrast common threat actors and motivations. | — |
| 2.2 | Explain common threat vectors and attack surfaces. | — |
| 2.3 | Explain various types of vulnerabilities. | — |
| 2.4 | Given a scenario, analyze indicators of malicious activity. | ▶ |
| 2.5 | Explain the purpose of mitigation techniques used to secure the enterprise. | — |
| 3.1 | Compare and contrast security implications of different architecture models. | — |
| 3.2 | Given a scenario, apply security principles to secure enterprise infrastructure. | ▶ |
| 3.3 | Compare and contrast concepts and strategies to protect data. | — |
| 3.4 | Explain the importance of resilience and recovery in security architecture. | — |
| 4.1 | Given a scenario, apply common security techniques to computing resources. | ▶ |
| 4.2 | Explain the security implications of proper hardware, software, and data asset management. | — |
| 4.3 | Explain various activities associated with vulnerability management. | — |
| 4.4 | Explain security alerting and monitoring concepts and tools. | — |
| 4.5 | Given a scenario, modify enterprise capabilities to enhance security. | ▶ |
| 4.6 | Given a scenario, implement and maintain identity and access management. | ▶ |
| 4.7 | Explain the importance of automation and orchestration related to secure operations. | — |
| 4.8 | Explain appropriate incident response activities. | — |
| 4.9 | Given a scenario, use data sources to support an investigation. | ▶ |
| 5.6 | Given a scenario, implement security awareness practices. | ▶ |
| 5.1–5.5 | Governance / risk management / third-party risk / compliance / audits (Summarize/Explain). | — |

(5.1 Summarize elements of effective security governance; 5.2 Explain elements of the risk management process; 5.3 Explain the processes associated with third-party risk assessment and management; 5.4 Summarize elements of effective security compliance; 5.5 Explain types and purposes of audits and assessments.)

**PBQ-relevant reading:** the seven ▶ objectives (2.4, 3.2, 4.1, 4.5, 4.6, 4.9, 5.6) cluster in Domain 4 (Security Operations, the heaviest domain at 28%): indicator/log analysis (2.4, 4.9), infrastructure/firewall-rule placement (3.2, 4.5), hardening/secure baselines (4.1), IAM/permissions configuration (4.6). This aligns with — but does not prove — the community-reported PBQ mix (firewall rules, log analysis, attack-indicator matching, IAM setup). Again: blueprint stems ≠ confirmed exam PBQ formats.

### Vendor neutrality (verified against PDF text)

The objectives are essentially vendor-neutral. A grep of the extracted PDF for major vendor names found **no vendor products in objective content**, with three marginal exceptions: "Group Policy" and "SELinux" appear as examples under 4.5 (Operating system security), and the non-normative "proposed hardware/software" test-lab appendix lists Windows OS / Linux OS / Kali Linux. MSCHAP appears only in the acronym list. Everything else is generic categories (SIEM, firewall, EDR/XDR, IPS/IDS, WAF, SD-WAN, SASE) and open standards (IPSec, WPA3, TLS, SNMPv3). Practical consequence for CertAnvil: PBQ practice content can be built vendor-neutral (generic firewall grammar, syslog-style logs, generic IAM consoles) and remain faithful to the blueprint.

---

## 2. Exam lifecycle status (as of 2026-07-16)

**Verified (CompTIA product page, fetched 2026-07-16):**
- Current exam: SY0-701 ("V7"), launched November 7, 2023.
- CompTIA states retirement is "usually three years after launch (**estimated 2026**)" — no firm retirement date published.
- Languages: English, Japanese, Portuguese, Spanish, Thai. Passing score 750/900.
- The official page does **not** yet name SY0-801 or publish V8 objectives on the certification page.

**CLAIMS (third-party, unverified against CompTIA primary sources):**
- Training Camp (article, fetched 2026-07-16) claims CompTIA published **draft** objectives in late 2025 titled "CompTIA Security+ SY0-801 V8 Exam Objectives, Version 1.0", circulated via the CompTIA Instructors Network; tentative **preview launch ~October 20, 2026**, general availability late 2026/early 2027; historical slippage of 3–6 months is common. Claimed draft domain weights: D1 16%, D2 24% ("Threats, Vulnerabilities, and Attacks", adds LLM coverage in 2.4 and AI threats in 2.6), D3 19%, D4 27%, D5 14%. Question count/length TBD in draft.
- Multiple secondary sites (CertCrush, 101labs, ReadRoost, Ryno Tools) repeat the same timeline; SY0-701 would then retire ~6 months after 801 GA, i.e. roughly mid-2027 — **speculative**, not CompTIA-published.

**Planning implication:** SY0-701 remains the only live Security+ exam today, with at least ~12 months of realistic runway (likely into 2027 given the 6-month overlap convention), but SY0-801 draft objectives reportedly already exist — worth monitoring comptia.org for the official V8 objectives drop.

---

## 3. Training-ecosystem survey: PBQ-style interactive practice (claims vs inspected)

Legend: **INSPECTED** = product/marketing page directly fetched and read (still not the same as using the product); **CLAIM** = search-result/vendor snippet only. None of the products below were actually operated hands-on, so all interaction-type statements are ultimately vendor claims about their own product.

| Product | Exam code | Status | Interaction types (as stated) | Feedback / partial credit | Breadth | Mobile | Access / paywall | Last-update signal |
|---|---|---|---|---|---|---|---|---|
| **CompTIA CertMaster Practice** | SY0-701 (V7) | INSPECTED (comptia.org/en-us/resources/certmaster-training/practice/) | Timed & untimed practice tests, exam-objective assessments; CompTIA blog claims practice test includes "scenario-based multiple-choice **and performance-based questions**" — PBQ rendering fidelity unstated | Mastery score reporting; questions link to learning topics | Full-exam blueprint | Not stated | Paid (CompTIA store; integrates with CertMaster Learn/Perform) | Page current for V7 |
| **CompTIA CertMaster Labs** | SY0-701 | INSPECTED (comptia.org/en/resources/certmaster-training/labs/) | Browser-based **live virtual machines**, guided + applied lab activities — real-environment labs, not exam-style PBQ widgets | "Instant feedback" on tasks; step-by-step guidance | Aligned to cert objectives | Browser-based; mobile not stated | Paid; standalone or bundled | Page current |
| **CompTIA CertMaster Perform** | SY0-701 | INSPECTED (comptia.org page) | All-in-one learning + integrated live labs (formerly CertMaster Learn+Labs) | Integrated assessments feed mastery score | Full course | Not stated | Paid | Rebranded recently ("formerly Learn+Labs") |
| **Professor Messer (free)** | SY0-701 | INSPECTED (course index page) | Free video course, monthly study groups, "pop quizzes" — pop quizzes are plain MCQ, **no interactive PBQ widgets** | Answer explanations in study-group format | Full blueprint via videos | Website/YouTube; responsive | Free | Actively maintained (site current) |
| **Professor Messer practice exams (paid)** | SY0-701 | CLAIM (search snippets + product URL) | Three 90-question exams **as PDF download**, claimed to include "performance-based questions" — necessarily paper-simulated, not interactive | Detailed explanations | 3 × 90 Q | PDF — any device, no interactivity | Paid PDF (~$_, professormesser.com/amember/signup/sy0701pe) | Current for 701 |
| **Dion Training PBQ Practice Pack** | SY0-701 | INSPECTED (product page, diontraining.com/products/comptia-security-701-pbq-packet) | "Interactive 5-question sets", bank of **100 PBQ-style questions**; claimed coverage: log analysis, firewall configuration, access control, threat/incident response, configuration scenarios | "Step-by-step guided solutions"; partial credit not stated | 100 PBQ-style items | Web-based; mobile behavior not stated | **$29.99** one-time, instant online access | Page live 2026-07; marketed against "latest" 701 exam |
| **Dion Training practice exam pack** | SY0-701 | CLAIM (search result) | Full-length practice exams (Udemy + own platform); PBQ simulation claimed in Udemy course titles | Explanations per question | Multiple full exams | Udemy apps work on mobile | Paid | — |
| **Pocket Prep (IT & Cybersecurity app)** | Security+ (SY0-701 per app listings) | INSPECTED (pocketprep.com/exams/comptia-security/) | **MCQ only** — Question of the Day, Quick 10, Timed Quiz, Missed Questions, Weakest Subject, Build Your Own; **no PBQ simulation claimed** | Per-question explanations; pass guarantee | **1,330 questions** + 1 mock exam | **Native iOS/Android apps + web** — strongest mobile story of the set | Freemium: 30 free Qs; $20.99/mo, $49.99/3mo, $124.99/yr | Page current |
| **ExamCompass** | SY0-701 | INSPECTED (free practice test index) | Free browser **MCQ quizzes** (single/multiple answer), organized per exam topic; **no drag-drop/PBQ interactivity observed on index** | Score report with all responses + percentage at quiz end | Dozens of topic quizzes + full practice tests | Browser-responsive; no app | **Free, no registration** | States tests based on current published objectives |
| **MeasureUp** | SY0-701 | INSPECTED (product page) + CLAIM for PBQ count | Practice test with Certification Mode (timed, no answers until end) and Practice Mode (custom question count/time/order). Reseller claims "310 questions… **30+ interactive performance-based items**" (MeasureUp's own page shows per-domain question counts, e.g. Domain 5 = 40 Qs, and generic ~150-question copy) — PBQ count is a CLAIM | Explanations; weak-area discovery | ~150–310 Qs (sources conflict) | Web platform; "desktop or laptop" access stated (mobile not promised) | Paid (~$99 tier; 30/60-day and subscription options); free demo available | English authoritative; auto-translated to many languages |
| **Boson ExSim-Max** | SY0-701 | INSPECTED (product page) | **3 full-length exams, 270 questions** "replicating question types of the live exam"; Study Mode + Simulation Mode (live-exam timing). Page does not explicitly enumerate PBQ widget types — "replicates question types" is the claim | Detailed explanations for correct AND incorrect answers; score reports | 270 Qs | Windows-centric exam engine historically; web option via exams.boson.com; mobile not stated | Paid (~$99 class); pass guarantee marketing | Page current for 701 |
| **HowToNetwork free PBQ test** | SY0-701 | INSPECTED (article page) | Free PBQ practice article + test; taxonomy explained (Simulation / Virtual / Interactive PBQs: firewall screens, network diagrams, terminals, drag-and-drop, fill-in-blank); actual test behind free login | Not stated | Small free set | Not stated | Free w/ registration/login | Site actively posting (May 2026 posts) |
| **PBQ-specific practice sites** (gcppcatest.com "25 realistic sims", certguide.ai security-plus-pbq, figigexams PBQ practice, FlashGenius PBQ guide, CyberkrafT, CertBlaster) | SY0-701 | CLAIM (search titles/snippets only) | Claims include drag-and-drop sims, **partial-credit scoring**, "instant AI feedback" (FlashGenius/certguide class), firewall/log/matching sims | gcppcatest-class sites claim partial credit + AI feedback | 25–100 items claimed | Web | Mostly free/freemium | Pages dated 2026 in titles |

### Cross-cutting observations

- **Genuine interactive PBQ simulation is rare and shallow.** Of the majors, only Dion's dedicated PBQ Pack ($29.99, 100 items) and MeasureUp (claimed 30+ interactive items) market interactive PBQ widgets. CertMaster Practice claims PBQs but is opaque about rendering. Messer's paid PBQs are static PDF. Pocket Prep and ExamCompass are MCQ-only. Boson claims type-replication without enumerating widgets.
- **Mobile PBQ practice is essentially an empty niche.** Pocket Prep owns mobile but has no PBQs; nobody surveyed claims a good phone-sized drag-drop/log-analysis PBQ experience.
- **Partial-credit modeling is almost never stated** — only small AI-feedback sites claim it, despite the real exam widely believed (community reports, not CompTIA-confirmed) to award partial PBQ credit.
- **Nobody publishes last-content-update dates** for question banks; "updated 2026" appears only in SEO titles.

---

## 4. Source list (all accessed 2026-07-16)

**Primary / official**
1. Official SY0-701 Exam Objectives PDF (Version 5.0, © 2023) — https://assets.ctfassets.net/82ripq7fjls2/6TYWUym0Nudqa8nGEnegjG/0f9b974d3b1837fe85ab8e6553f4d623/CompTIA-Security-Plus-SY0-701-Exam-Objectives.pdf — downloaded, text-extracted, verified
2. CompTIA Security+ product page (V7 details, launch/retirement, passing score) — https://www.comptia.org/en-us/certifications/security/
3. CompTIA CertMaster Practice — https://www.comptia.org/en-us/resources/certmaster-training/practice/
4. CompTIA CertMaster Labs — https://www.comptia.org/en/resources/certmaster-training/labs/
5. CompTIA CertMaster Perform — https://www.comptia.org/en-us/resources/certmaster-training/perform/

**Lifecycle / SY0-801 (claims)**
6. Training Camp, "SY0-801 Release Date and Everything We Know So Far" — https://trainingcamp.com/articles/comptia-security-sy0-801-release-date-and-everything-we-know-so-far/ (draft V8 objectives claim, ~Oct 20 2026 preview)
7. CertCrush SY0-801 vs SY0-701 — https://www.certcrush.app/blog/security-plus-sy0-801-vs-sy0-701-whats-changing-2026 (corroborating claim)

**Ecosystem**
8. Dion Training PBQ Practice Pack — https://www.diontraining.com/products/comptia-security-701-pbq-packet
9. Professor Messer SY0-701 course index — https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/
10. Professor Messer paid practice exams (PDF) — https://www.professormesser.com/amember/signup/sy0701pe (claim via search)
11. Pocket Prep Security+ — https://www.pocketprep.com/exams/comptia-security/
12. ExamCompass free Security+ tests — https://www.examcompass.com/comptia/security-plus-certification/free-security-plus-practice-tests
13. MeasureUp SY0-701 practice test — https://www.measureup.com/sy0-701-comptia-security-practice-test.html (+ reseller PBQ-count claim: https://getcertified4less.com/measureup-security-practice-test/)
14. Boson ExSim-Max SY0-701 — https://boson.com/product/exsim-max-for-comptia-security-sy0-701/ (also Practice Lab: https://boson.com/product/practice-lab-for-comptia-security-sy0-701/)
15. HowToNetwork free PBQ test — https://www.howtonetwork.com/certifications/security/comptia-security-pbq-practice-test-free-sy0-701-questions/
16. PBQ-niche sites (claims only): https://gcppcatest.com/comptia/pbq-library.php · https://certguide.ai/security-plus-pbq · https://figigexams.com/learn/security-plus-pbq-practice/ · https://flashgenius.net/guides/comptia-security-sy0-701-pbq-guide-2026-interactive-practice
