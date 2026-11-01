---
up: "[[Decisions MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-31
tags: [spec, cert-add, registry]
---
# Four new certs: SecAI+, PRINCE2 Foundation, PSM I and PSM II

**In short.** CertAnvil gains CompTIA SecAI+, PRINCE2 7 Foundation, and a Scrum site carrying
Scrum.org PSM I and PSM II as a pair. Before any of them, the app gets one shared cert list, so a new
cert stops meaning ~25 hand edits. Each piece merges on its own short branch, the certs merge hidden
(admin-only), and each is revealed when the founder says "ship it". A last, separate step deals with the
lopsided answer letters in six existing packs.

Founder decisions (brainstorm, 31 Oct 2026): PRINCE2 Foundation now, Practitioner later as its own
cert. SecAI+ launches multiple choice only, Sim Lab later. PSM I and II share one site, A+ style. Shared
cert list first. Order SecAI+ → PRINCE2 → Scrum. Answer-letter fix folded into this plan as its own
final step.

## 1. Why a shared cert list first

Adding CLF-C02 (v7.8.0) touched these, each carrying its own hard-coded copy of the cert list:
`app.js` (`detectCert`, `?cert=` and dev-override allow-lists, `_DL_CERTS`, `_SL_PBQ_CERTS_HOME`,
decision-lab seed map), `index.html` (inline host IIFE, title table, allow-list), `auth-state.js`
(`getAvailableCerts`, `getActiveCertId`, `tadSwitchCert` gate + target host ternary), `dg-system.css`
(4-domain hide rules), `features/home.js` (canonical-topic ternary), `features/ios-*.js` (six `MARKS`
maps, `HUB_SCALE_1000`, first-run pick lists, sign-in names), `features/decision-lab-seed-*.js`,
`lib/cert-lock.js`, `lib/router.js`, `lib/onboarding-home.js`, `lib/onboarding-firstrun.js`, plus the
landing project (`auth.js`, `styles.css`, `lib/account.js`, `lib/cross-cert-analytics.js`,
`lib/cross-cert-overlap.js`, `lib/admin.js`, `index.html`, `diagnostic/index.html`,
`diagnostic/results-config.js`, `diagnostic/<id>/*.html`, `api/diagnostic/generate.js`). Re-run
`grep -rIn clfc02` (excluding docs, CHANGELOG, certs) when planning; that grep is the inventory. Three
certs × that list = ~75 edits, many in files the parallel admin/iOS session (`feat/admin-in-app`) is
changing.

### What the list holds (one entry per cert)
- **Identity:** `id`, full name, short name, exam code, vendor, and two deliberately different
  marks that exist today: `mark` (iOS badges, e.g. `CLF`) and `glyph` (switcher, e.g. `AWS`). Picker
  subtitle text that differs per surface ("Microsoft SC-900" vs "Security Fundamentals") becomes named
  fields, not one value forced on every screen.
- **Location:** host (Pattern A subdomain), pack file, optional `family` + `examSlug` for pairs
  (A+ today: `aplus.certanvil.com/?exam=`; Scrum next).
- **Visibility:** `tier` (`free`/`pro`) and `hidden`. **Hidden means unlisted, not secret:** left out
  of every picker, switcher, first-run list, My certs hub and landing surface (tiles, diagnostic picker,
  cross-cert analytics, admin catalogue shows it labelled hidden). Anyone with the address can still
  open it, and the pack file is public, as every pack already is. The client cannot do more: cert
  detection runs synchronously in `<head>` before the async profile fetch that reveals the admin role.
- **Scoring:** `scale: { min, max, pass, format }` where format is `scaled` or `percent`. Packs keep
  their `meta.exam*` fields; the list mirrors them and a check fails on any mismatch.
- **Features:** Sim Lab, Decision Lab, landing diagnostic slug, domain count (drives the 4-domain hide
  rule generically instead of one CSS block per cert).

### Where it lives and who reads it
A small classic script loaded synchronously in `<head>` before the inline host IIFE, so detection,
title and preload can use it. Every list above reads from it. Readers keep a hard-coded fallback only
where boot order forces one, guarded by a check.

**The landing project** deploys separately and keeps its own copies; a UAT check compares them to the
list and fails on drift. (Sharing one file across two Vercel projects was rejected: see below.)

### Proof nothing changed
Before the switch, a characterisation test snapshots, for all eight current certs: detected cert per
host, switch target host, Pro gate, badge, names, pass/max/min score, Sim Lab / Decision Lab flags,
title. After the switch the same test must match exactly, except for stale values fixed on purpose,
each listed in the test as an approved change. Known so far: the iOS first-run pick list gives A+ as
`220-1101/1102` while the switcher and pack use `220-1201/1202` (the 2025 exams); first-run moves to
`1201/1202`.

### Lane
Touches `auth-state.js`, so **gated lane**: own branch → PR → preview → squash-merge. Starts only
after `feat/admin-in-app` has merged. App.js must shrink, never grow (ratchet), which the list helps.

### Percentage scoring is new
PRINCE2 and PSM report a percentage. Readiness, the hub (`HUB_SCALE_1000` today), first-run scale and
results all assume a scaled score. The list's `format: 'percent'` with `{min: 0, max: 100, pass: 60|85}`
must render as "72%" not "72 / 100" everywhere readiness shows. For percent certs the predicted score
is the weighted accuracy itself (no scaled mapping); for scaled certs the existing mapping stays. Score
fields are read in `features/readiness.js`, `exam.js`, `ios-exam.js`, `diagnostic.js`, `analytics.js`,
`ios-analytics.js`, `home.js`, `ios-firstrun.js`, `ios-hub.js`, `lib/onboarding-firstrun.js` and `app.js`,
several with 100/900/720 fallbacks; all read the list's scale instead. Checks cover each surface.

### Detection is driven by the list
The `<head>` IIFE, `detectCert`, `getActiveCertId` and the dev-override allow-lists all resolve host →
cert from the list, so a new host works in all four at once. The v7.2.2 lesson holds: head and
`detectCert` must agree or `CERT_PACK` is null. `?cert=` keeps today's behaviour (honoured in the head
only on a family host such as `aplus.`); hidden certs are reached by their own address, not by
`?cert=` on another host, which would load the wrong pack.

## 2. SecAI+ (CompTIA CY0-001)

| Fact | Value | Source |
|---|---|---|
| Questions | up to 60, multiple choice + performance-based | CompTIA SecAI+ page |
| Time | 60 min | same |
| Pass | 600 on 100–900 | same |
| Launched | 17 Feb 2026 | same |
| Recommended | Security+ level, 3–4 yrs IT, 2 yrs security | same |

Domains (official) and the 200-exemplar split:

| Domain id | Label | Weight | Exemplars |
|---|---|---|---|
| `ai-concepts` | Basic AI concepts related to cybersecurity | 17% | 34 |
| `securing-ai` | Securing AI systems | 40% | 80 |
| `ai-assisted` | AI-assisted security | 24% | 48 |
| `ai-grc` | AI governance, risk and compliance | 19% | 38 |

- **id** `secai`, host `secai.certanvil.com`, Pro, scaled scoring, 4 domains.
- **Topics:** ~40, derived from the official CY0-001 objectives PDF (fetch at build; objective
  numbers X.Y from it). `topicResources` follow the CompTIA convention.
- **Retention concepts:** ~8 seeded, e.g. prompt injection (direct vs indirect) vs data poisoning vs
  model inversion; which control fits which AI risk; guardrails vs fine-tuning vs RAG for safety.
- **No Sim Lab at launch.** Follow-up: SecAI+ Sim Lab scenarios through the 2-agent consensus gate,
  queued behind the unbuilt Security+ Wave 5 VPN tunnel scenario.
- **Cross-cert:** directional overlap with Security+ (strong) and AI-901 (light).
- **Caveat:** an eight-month-old exam has thin candidate feedback; lean on the objectives and add
  retention concepts from the founder's own study.

## 3. PRINCE2 7 Foundation (PeopleCert)

| Fact | Value | Source |
|---|---|---|
| Questions | 60 multiple choice | PeopleCert PRINCE2 7 Foundation page |
| Time | 60 min | same |
| Pass | 60% (36/60) | same; 55% was the 6th edition |
| Book | closed (one PeopleCert page says open; confirm at build, founder sat it closed) | same |

Domains, weights from the founder's 600-question mock distribution, to be checked against PeopleCert's
syllabus at build (official figures win if published):

| Domain id | Label | Share | Exemplars |
|---|---|---|---|
| `practices` | Practices (business case, organizing, quality, plans, risk, issues, progress) | 60% | 120 |
| `processes` | Processes (SU, DP, IP, CS, MPD, SB, CP) | 15% | 30 |
| `people` | People | 13% | 26 |
| `principles` | Principles | 8% | 16 |
| `concepts` | Core concepts (integrated elements, delivery approaches, tailoring) | 4% | 8 |

- **id** `prince2`, host `prince2.certanvil.com`, Pro, percent scoring (pass 60), 5 domains.
- **Seed:** `~/Desktop/Lessons/teach-claudecode/lessons/20-prince2-mastery/`: 30 lessons, 10 mock
  papers (600 original questions, de-duplicated in `06-mock-exams/_stem-bank.txt`, tagged by area),
  `NOTES.md` core facts. Pick the best 200, reshape to the exemplar format, rebalance letters and the
  longest-option cue. Founder's Notion PRINCE2 pages add nothing the folder lacks.
- **Retention concepts:** ~8, e.g. Practices replaced Themes in v7; seven tolerance areas incl.
  sustainability; who owns which management product; business/user/supplier interests; manage by
  exception levels.
- **Legal:** shown quietly in the cert info area, short line plus trademark sentence: "PRINCE2® is a registered trademark of PeopleCert. Not affiliated with or endorsed by PeopleCert."
  No verbatim text from the official manual.
- **Practitioner later:** separate cert `prince2-prac`, needs a new scenario-beside-questions layout
  and matching/sequence handling; the folder's `07-practitioner/` mock seeds it. Not in this spec.

## 4. Scrum site: PSM I and PSM II (Scrum.org)

| Fact | PSM I | PSM II | Source |
|---|---|---|---|
| Questions | 80 | 30 (scenario, some partial credit) | Scrum.org assessment pages |
| Time | 60 min | 90 min | same |
| Pass | 85% | 85% | same |
| Types | MC, multiple answer, true/false | same | same |

- **ids** `psm1`, `psm2`; family `scrum`; host `scrum.certanvil.com/?exam=psm1|psm2` (A+ pattern).
  Pro, percent scoring (pass 85).
- **Domains: Scrum.org publishes no weights.** Ours, labelled as estimates in-app:
  - PSM I: `framework` 60% · `people-teams` 20% · `product` 20% (200 exemplars: 120/40/40).
  - PSM II: `framework` 30% · `coaching` 35% · `product-value` 20% · `done-scaling` 15%
    (~120 exemplars: 36/42/24/18).
- **Seed:** none locally (the agile lessons folder covers engineering topics, not Scrum). Source is
  the Scrum Guide 2020, published under CC BY-SA 4.0, so it may be quoted with attribution; Nexus
  Guide for PSM II scaling.
- **Retention concepts:** ~8 per exam, e.g. Sprint Backlog ownership; obsolete Sprint Goal → only the
  Product Owner cancels; Scrum Master serves rather than manages; Definition of Done applies to every
  Increment.
- **Format gaps:** true/false renders as a two-option MCQ (verify the quiz and exam screens handle two
  options); PSM II partial credit is scored right/wrong, so readiness errs harsh.
- **Legal:** shown quietly in the cert info area, short line plus trademark sentence: "Professional Scrum Master™ and PSM are trademarks of Scrum.org. Not affiliated with or endorsed by Scrum.org."

## 5. Exemplar authoring (all banks)

Exemplars are few-shot style references for the generator, never served as questions. Every bank:
original, from public syllabi (plus the Scrum Guide and the founder's own PRINCE2 material); no paid
banks or dumps; `node scripts/exemplar-gate.js --cert <id> --version <v>` must pass; one adversarial
content review per bank; answer letters within ±7 points of even per pack and the correct option not
systematically the longest. New packs are authored balanced even if step 7 later adds a display
shuffle, so they never need a second pass. The new-cert packs are authored inside each cert's build; later additions
use the `exemplar-lane` skill.

## 6. Order, branches and release

1. Shared cert list: gated, after `feat/admin-in-app` merges.
2. SecAI+ → 3. PRINCE2 Foundation → 4. Scrum site: each its own short branch off main, merged
   **hidden**, revealed by flipping `hidden` when the founder says "ship it" (and flipped back on any
   problem). Branches fold main in after each upstream merge.
5. Answer-letter fix (section 7).

Landing diagnostic API changes (`landing/api/diagnostic/generate.js`) are gated lane in each cert step.

**Founder tasks:** add the cert's CNAME (`secai`, `prince2`, `scrum`) + Vercel domain alias **before
its hidden merge**, so the founder can open it at its own address; try it on phone and laptop; say
"ship it".

**Testing on non-prod:** never write user-state localStorage on prod or `*.vercel.app`. Saved-data
testing on a local server or a private window; previews for viewing only. On prod a hidden cert is opened at its own
address (e.g. `secai.certanvil.com`), which is unlisted until reveal.

## 7. Answer-letter skew in existing packs (final step)

Measured 31 Oct 2026 (MCQs only):

| Pack | Spread |
|---|---|
| sc900 | B 73%, D 1 of 164 |
| aplus-core1 | A 69%, D 0 |
| aplus-core2 | A 69% |
| az900 | B 60% |
| netplus | D 2% |
| clfc02 | B/C heavy, mild |
| secplus, ai900 | even |

Per `docs/audits/2026-08-22-exemplar-answer-letter-skew.md`, nothing shuffles options in the serve
path, so a generator that copies the skew shows it to learners. Step one: run
`scripts/exemplar-letter-bias-test.js` (record option lengths too). Then:
- generator skews with or without exemplars → a post-generation option shuffle in one place, fixing
  letter references in explanations;
- skew only with exemplars → rebalance the six packs via `exemplar-lane` (swap order on order-neutral
  items, update letters inside explanations; never touch `objective` tags).

## 8. Cross-platform

Every step is designed for and verified on desktop, Safari/WebKit, mobile web and the iOS Capacitor
app. The iOS app loads the live site (`capacitor.config.json` `server.url`), so new certs reach iOS
without an App Store build. New visible surfaces get mockup-first and the 5-stage visual pass: cert
badges, percent readiness (readiness number and pass-mark bar), the trademark copy, landing tiles and diagnostic pages. Touch
targets ≥44px, hover pointer-gated, safe-area insets respected.

## Rejected approaches
- **Add each cert the old way (25 edits each):** triples collisions with the iOS session's files and
  grows the drift surface.
- **One long branch for everything, merged at the end:** drifts for weeks and ends in one large,
  hard-to-review merge against the busiest files.
- **Hidden = truly admin-only:** impossible client-side (detection runs before the role is known) and
  pointless while every pack is a public file; unlisted is honest and enough.
- **Reach hidden certs via `?cert=` on an existing host:** the head would load the host's pack, not
  the requested one (the v7.2.2 failure); own-address access instead.
- **One shared registry file served to both Vercel projects:** couples two independent deploys; a
  drift check gets the safety for free.
- **PRINCE2 Practitioner now / both levels at once:** needs a new scenario layout and has one mock of
  seed; Foundation is ready from the founder's 600 questions.
- **SecAI+ held until Sim Lab scenarios exist:** delays the cert the founder is studying for and
  competes with the waiting Security+ Wave 5 scenario.
- **PSM I and II as unrelated certs:** duplicates Scrum Guide material; **PSM I only:** founder wants both.
- **Fold the letter fix into the cert work:** different area (live quiz engine and existing
  explanations); kept as its own step with its own evidence gate.

## Sources
- CompTIA SecAI+: https://www.comptia.org/en-us/certifications/secai/
- PeopleCert PRINCE2 7 Foundation: https://www.peoplecert.org/browse-certifications/project-programme-and-portfolio-management/PRINCE2-2/PRINCE2-7-foundation-3579
- Scrum.org PSM I: https://www.scrum.org/assessments/professional-scrum-master-i-certification
- Scrum.org PSM II: https://www.scrum.org/assessments/professional-scrum-master-ii-certification
- Scrum Guide 2020 (CC BY-SA 4.0): https://scrumguides.org/scrum-guide.html

## Related
[[2026-05-28-sc900-cert-add]] · [[2026-10-08-ai901-swap]] · [[2026-10-30-my-certs-hub-design]] ·
[[2026-06-07-free-tier-cert-lock-design]] · [[2026-08-22-exemplar-answer-letter-skew]] · [[ENVIRONMENT_STRATEGY]]
