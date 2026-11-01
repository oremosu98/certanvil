---
up: "[[Decisions MOC]]"
type: plan
status: approved-spec
cert: all
updated: 2026-10-31
tags: [plan, cert-add, registry]
---
# Four New Certs + Shared Cert List — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One shared cert list that every surface reads, then CompTIA SecAI+, PRINCE2 7 Foundation and a Scrum site (PSM I + PSM II) added on it, each merged hidden and revealed on the founder's "ship it", then the existing packs' answer-letter skew dealt with.

**Architecture:** A synchronous classic script `lib/cert-registry.js` loaded in `<head>` exposes `window.CertRegistry`; detection, switching, gating, badges, pass marks and landing drift checks all read it. Each cert is a pack file in `certs/` plus one registry entry. Five parts, each its own short branch and merge, in order.

**Tech Stack:** vanilla JS (no framework), `tests/uat/*.js` node+vm UAT modules, Playwright E2E, esbuild prod build, Vercel, Capacitor iOS shell loading the live site.

**Spec:** `docs/superpowers/specs/2026-10-31-new-certs-secai-prince2-scrum-design.md` — read it alongside this plan; facts, weights and sources live there and are not repeated.

## Global Constraints

- Every feature works and is verified on desktop, Safari/WebKit, mobile web and the iOS Capacitor app.
- `app.js` may not grow: line count at the end of each part ≤ its count at the start (8333 at plan time).
- Never write user-state localStorage on prod or `*.vercel.app`. Saved-data testing on `python3 -m http.server 3131` or a private window.
- Nothing ships until the founder says "ship it". Use the `ship` skill; `bump-version.js` only; hand-bump `dg-system.css?v=` on any `dg-system.css` change.
- Gated lane (branch → PR → preview → squash-merge) for anything touching `auth-state.js`, `sw.js`, `landing/api/diagnostic/*`.
- Part 1 starts only after `feat/admin-in-app` has merged to main. Each later part branches from current main and folds main in after every upstream merge.
- Exemplars: original only; no paid banks or dumps; no verbatim PRINCE2 manual text; Scrum Guide 2020 quotes allowed with CC BY-SA attribution. Each bank passes `node scripts/exemplar-gate.js --cert <id> --version <v>`, gets one adversarial content review, has MCQ answer letters within ±7 points of 25% each, and the correct option is the longest in ≤35% of MCQs.
- New visible surfaces: mockup first (`mockups/<feature>-concept.html`, tokens from `design/brand/mockup-starter-tokens.css`), then the 5-stage visual pass, founder approval before building. BRAND.md owns motion values.
- Trademark copy on PRINCE2 and Scrum surfaces (approved 31 Oct), short line plus trademark sentence, shown quietly in the cert info area: PRINCE2: "PRINCE2® is a registered trademark of PeopleCert. Not affiliated with or endorsed by PeopleCert." Scrum: "Professional Scrum Master™ and PSM are trademarks of Scrum.org. Not affiliated with or endorsed by Scrum.org."
- Empty or no-score placeholder is `--` (two hyphens) in both score formats. Percent certs read "72% · pass 60%" in My certs (PSM: "… · pass 85%"); scaled certs keep "684 / 900". PRINCE2's exam-code slot shows "Foundation". PRINCE2 and PSM both show the "weights are estimates" note. SecAI+ badge "SAI" highlights the S.
- Registry ids: `secai`, `prince2`, `psm1`, `psm2`. Hosts: `secai.certanvil.com`, `prince2.certanvil.com`, `scrum.certanvil.com` (`?exam=psm1|psm2`).

## Review Focus

1. **A hidden cert opened by its address by anyone** — the app loads normally (unlisted ≠ broken); it is just absent from lists. → Task 1.2 test `hidden cert resolves by host but is not listed`.
2. **A stale `nplus_dev_cert` naming an unknown id** (e.g. `secai` on a build without it, or a typo) — falls back to `netplus`, never a null `CERT_PACK`. → Task 1.3 test `unknown override falls back to netplus in head and detectCert`.
3. **Percent cert with no history** — readiness shows the empty state, never `NaN%` or `0%` as a score; the empty score is `'--'`. → Task 1.6 test `formatScore percent null`.
4. **Scrum host where `?exam=` and the saved override disagree** — `?exam=` wins, then override, then `psm1`; head and `detectCert` agree. → Task 4.1 test `scrum family priority`.
5. **Host-prefix collisions** — `secai.` must never resolve to `ai900` (`ai.`), `secai-git-x.vercel.app` → `secai`, `prince2-…` → `prince2`. → Task 1.2 test `byHost prefix collisions`.

---

## Part 1 — Shared cert list (gated lane, branch `feat/cert-registry`)

### Task 1.1: Characterisation snapshot of today's surfaces

**Files:**
- Create: `scripts/snapshot-cert-surfaces.js`, `tests/fixtures/cert-surfaces-v1.json`, `tests/uat/540-cert-surfaces-snapshot.js`

**Interfaces:**
- Produces: `cert-surfaces-v1.json` — `{ [certId]: { hostDetected, switchHost, proGated, glyph, mark, names: {switcher, signin, firstrun, onboarding, certLock}, codes: {switcher, firstrun}, scale: {min,max,pass}, simLab, decisionLab, title, domainCount } }` for the eight current certs.

- [ ] **Step 1:** Write `snapshot-cert-surfaces.js`: extract via `_fnBody`/vm (same technique as `tests/uat/527-ios-hub.js`) `getActiveCertId`, `getAvailableCerts`, `tadSwitchCert` target host, the head IIFE detection block, the six `MARKS` maps, `HUB_SCALE_1000`, first-run `PICK_*`, sign-in names, `lib/cert-lock.js` names, `lib/onboarding-*` lists, `_DL_CERTS`, `_SL_PBQ_CERTS_HOME`, pack `meta`, and the index.html title table; write the JSON.
- [ ] **Step 2:** Run `node scripts/snapshot-cert-surfaces.js > tests/fixtures/cert-surfaces-v1.json`; inspect: eight keys, CLF-C02 `glyph:'AWS'`, `mark:'CLF'`, first-run A+ code `220-1101`.
- [ ] **Step 3:** Write `540-cert-surfaces-snapshot.js`: re-runs the extractor against current source and deep-equals the fixture, except keys listed in `APPROVED_CHANGES = { 'aplus-core1.codes.firstrun': '220-1201', 'aplus-core2.codes.firstrun': '220-1202' }`.
- [ ] **Step 4:** `node tests/uat.js` → 540 passes with zero diffs (approved changes not yet applied → test treats fixture value OR approved value as passing).
- [ ] **Step 5:** Commit `test(registry): characterisation snapshot of cert surfaces`.

### Task 1.2: The registry file

**Files:**
- Create: `lib/cert-registry.js`, `tests/uat/541-cert-registry.js`
- Modify: `index.html` (load in `<head>` before the inline detection IIFE, after `native-shell.js`), `sw.js` (precache `./lib/cert-registry.js`)

**Interfaces:**
- Produces `window.CertRegistry`:
  - `all(): Entry[]` (all, including hidden)
  - `get(id: string): Entry | null`
  - `isKnown(id: string): boolean`
  - `byHost(hostname: string): string | null` — matches `prefix + '.'`, `prefix + '-'`, or exact `host`
  - `hostFor(id: string): string`
  - `listed(isAdmin: boolean): Entry[]` — hides `hidden:true` unless admin
  - `familyOf(id: string): string | null`, `familyMembers(family: string): string[]`
  - `scale(id: string): { min: number, max: number, pass: number, format: 'scaled' | 'percent' }`
  - `formatScore(id: string, n: number | null): string` — `'684'` / `'72%'` / `'--'` for null
- `Entry = { id, name, shortName, code, vendor, mark, glyph, labels: { signin, firstrun, onboardingName, onboardingVendor, certLock }, host, hostPrefix, family, examSlug, pack, tier, hidden, scale, domainCount, simLab, decisionLab, decisionLabSeed, diagnosticSlug }`
- Entries for the eight current certs carry exactly the snapshot values (A+ first-run code as approved change).

- [ ] **Step 1:** Write 541 tests: `registry has 8 entries`; `every entry scale matches its pack meta` (load `certs/*.js` in vm); `byHost` for each live host and `<prefix>-preview.vercel.app`; `byHost prefix collisions` (`secai.certanvil.com`→null now, and after Part 2 → `secai`, never `ai900`); `hidden cert resolves by host but is not listed` (inject a fake `{id:'zz', hidden:true, hostPrefix:'zz'}` via a test-only `_add`); `formatScore('netplus',684)==='684'`.
- [ ] **Step 2:** Run → FAIL (file missing).
- [ ] **Step 3:** Implement `lib/cert-registry.js` (ES5, IIFE, no dependencies, self-contained so UAT can vm-run it).
- [ ] **Step 4:** Run → PASS. Check head load order in `index.html` by loading `localhost:3131` with DevTools: `window.CertRegistry` defined before the detection IIFE runs.
- [ ] **Step 5:** Commit `feat(registry): shared cert list`.

### Task 1.3: Detection reads the registry

**Files:**
- Modify: `index.html` (inline detection IIFE, title table, override allow-list), `app.js` (`detectCert`, `?cert=` allow-list, dev-override allow-list — net lines must drop), `auth-state.js` (`getActiveCertId`, allow-list)
- Test: `tests/uat/542-cert-detection.js`

**Interfaces:**
- Consumes: `CertRegistry.byHost`, `isKnown`, `familyMembers`, `get(id).examSlug`.
- Family rule (A+ now, Scrum later): on a family host, `?exam=<examSlug>` or `?cert=<id>` → that member; else override if a member; else first member.

- [ ] **Step 1:** Write 542 tests, running the head IIFE, `detectCert` and `getActiveCertId` in vm with stubbed `location`/`localStorage`: all three agree for every registry host; `unknown override falls back to netplus in head and detectCert`; A+ family priority (`?exam=core2` beats override `aplus-core1`).
- [ ] **Step 2:** Run → FAIL on the unknown-override and agreement cases that the registry path will own.
- [ ] **Step 3:** Replace the host ternaries and allow-lists with registry calls in all three places.
- [ ] **Step 4:** Run 540, 541, 542 → PASS; `wc -l app.js` lower than before.
- [ ] **Step 5:** Commit `refactor(registry): detection reads the cert list`.

### Task 1.4: Switching, gating and the cert lists people see

**Files:**
- Modify: `auth-state.js` (`getAvailableCerts`, `tadSwitchCert` target host + Pro gate), `features/ios-progress.js`, `ios-custom.js`, `ios-log-result.js`, `ios-home.js`, `ios-analytics.js`, `ios-firstrun.js` (six `MARKS`, `PICK_*`), `features/ios-signin.js`, `features/ios-hub.js` (`HUB_SCALE_1000` → registry scale), `lib/cert-lock.js`, `lib/router.js`, `lib/onboarding-home.js`, `lib/onboarding-firstrun.js`, `app.js` (`_DL_CERTS`, `_SL_PBQ_CERTS_HOME`, decision-lab seed map)
- Test: extend `540` (must still match) and add `tests/uat/543-cert-lists.js`

**Interfaces:**
- Consumes: `CertRegistry.listed(isAdmin)`, `get(id).mark|glyph|labels`, `hostFor`, `get(id).tier`. Admin = existing `profile.role === 'admin'` signal in `auth-state.js`; before the profile loads, treat as non-admin.

- [ ] **Step 1:** Write 543 tests: every list surface returns `listed(false)` ids in registry order; with a hidden fake entry, non-admin lists exclude it and `listed(true)` includes it; `tadSwitchCert` targets `hostFor(id)`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Point each surface at the registry; delete the local maps.
- [ ] **Step 4:** Run 540 (zero unapproved diffs), 543 → PASS.
- [ ] **Step 4b (found in final review):** `app.js` ~L4664 derives the exam vendor from the first word of `meta.name`, which gives "Professional" for PSM and "PRINCE2" for PRINCE2; ~L4666 says "official ... domains" even when `meta.weightsAreEstimates` is true (PRINCE2, PSM I, PSM II). Read the vendor from the registry (or `meta.vendor`) and drop the word "official" when `weightsAreEstimates` is set. Add a UAT case: a fake pack with `weightsAreEstimates:true` renders no "official" and a vendor from the registry.
- [ ] **Step 5:** Commit `refactor(registry): pickers, badges, gating and switching read the cert list`.

### Task 1.5: Domain-count CSS and canonical topics

**Files:**
- Modify: `index.html` (head sets `data-domain-count` from `get(cert).domainCount`), `dg-system.css` (replace the per-cert idx-5 hide blocks with `html[data-domain-count="4"] … [data-domain-idx="5"]`; hand-bump `dg-system.css?v=`), `features/home.js` (move `_CANONICAL_*` objects into each pack as `canonicalDomainTopics`, read from `CERT_PACK`), `certs/*.js` (receive `canonicalDomainTopics`)
- Test: `tests/uat/544-domain-count.js`

- [ ] **Step 1:** Tests: every 4-domain cert in the registry gets the hide rule via the attribute; no `html[data-cert="…"]` idx-5 rules remain; `features/home.js` contains no `_CANONICAL_` constants; each pack's `canonicalDomainTopics` keys equal its `domainWeights` keys.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS; visually check the 4-domain grid for az900 and sc900 locally.
- [ ] **Step 5:** Commit `refactor(registry): domain count and canonical topics move to data`.

### Task 1.6: Percent scoring

**Files:**
- Modify: score readers in `features/readiness.js`, `exam.js`, `ios-exam.js`, `diagnostic.js`, `analytics.js`, `ios-analytics.js`, `home.js`, `ios-firstrun.js`, `ios-hub.js`, `lib/onboarding-firstrun.js`, `app.js` (`EXAM_PASS_SCORE`/`EXAM_MAX_SCORE` from `CertRegistry.scale`)
- Test: `tests/uat/545-percent-scoring.js`

**Interfaces:**
- Consumes: `CertRegistry.scale(id)`, `formatScore(id, n)`.
- Rule: `format:'percent'` → predicted score = weighted accuracy (0–100), shown `'72%'`, pass line at `scale.pass`; `scaled` → existing mapping unchanged.

- [ ] **Step 1:** Tests with a fake percent entry `{min:0,max:100,pass:60}`: readiness predicted score equals weighted accuracy; every listed reader renders `'72%'`; `formatScore percent null` → `'--'` and the empty state; scaled certs unchanged (540 still green).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 4b (known bug, found in final review):** `features/readiness.js:17` uses `examMinScore || 100`, which turns a percent cert's min of 0 into 100. That collapses the score band, produces NaN, and makes the pass percentage in `exam.js` (~L965) come out as -Infinity. Replace it with a `typeof === 'number'` check, or read `CertRegistry.scale(id)`. Add a UAT case with min 0 / max 100 / pass 60 asserting a finite band, a finite pass %, and no NaN.
- [ ] **Step 5:** Commit `feat(registry): percent scoring`.

### Task 1.7: Landing drift check

**Files:**
- Test: `tests/uat/546-landing-cert-drift.js` (reads `landing/auth.js`, `landing/lib/account.js`, `landing/lib/cross-cert-analytics.js`, `landing/lib/admin.js`, `landing/index.html` cert array, `landing/diagnostic/results-config.js`, `landing/api/diagnostic/generate.js` allow-list)

- [ ] **Step 1:** Test: for every non-hidden registry entry, each landing list has a row with the same id, code and pass/max score; no landing list names an id the registry lacks; hidden entries absent from public landing lists.
- [ ] **Step 2:** Run → PASS on current data (fix any real drift found, listing it in the commit).
- [ ] **Step 3:** Commit `test(registry): landing lists must match the cert list`.

### Task 1.8: Part 1 verification and merge

- [ ] `node tests/uat.js`, `node tests/tech-debt.js`, `npx playwright test` → all green; `wc -l app.js` < 8333.
- [ ] Local server: every cert by `?cert=` on localhost renders Home, a quiz, readiness, switcher; repeat at 375px and in WebKit.
- [ ] Open PR (gated), preview: view-only walk of desktop + mobile; iOS Capacitor against preview per `IOS_TESTING.md`.
- [ ] Founder says "ship it" → squash-merge, `ship` skill, post-deploy live check. No user-visible change expected.

---

## Part 2 — SecAI+ (branch `feat/cert-secai`)

### Task 2.1: Mockups for the new surfaces (once, for all three certs)

**Files:** Create `mockups/new-certs-concept.html`

- [ ] Mock: badges `SAI`, `P2`, `PSM` in switcher, iOS hub and first-run; percent readiness number and pass-mark bar, and hub row ("72% · pass 60%"); the not-affiliated line placement; landing tiles for all three. Run the 5 skills in order; founder approves before Task 2.4/3.3/4.3 build anything visible.

### Task 2.2: Pack scaffold + hidden registry entry

**Files:** Create `certs/secai.js`, `tests/uat/550-cert-secai.js`; Modify `lib/cert-registry.js` (entry `secai`, `hidden:true`, `hostPrefix:'secai'`, `tier:'pro'`, `scale:{min:100,max:900,pass:600,format:'scaled'}`, `domainCount:4`, `simLab:false`, `decisionLab:false`, `diagnosticSlug:'secai'`)

- [ ] **Step 1:** Fetch the official CY0-001 objectives PDF from comptia.org; derive ~40 topics with X.Y objective numbers.
- [ ] **Step 2:** Tests: pack declares `window.CERT_PACKS.secai`; meta 600/900/100, 60 Q, 3600 s; domain weights `ai-concepts .17, securing-ai .40, ai-assisted .24, ai-grc .19` sum to 1; ≥38 topics, every topic maps to a domain; ≥8 retention concepts each with `parentTopic` in `topicDomains`; registry scale equals meta. Run → FAIL.
- [ ] **Step 3:** Author the pack per `certs/ai900.js` shape (header with legal note + source URL); empty `questionExemplars`. Run → PASS.
- [ ] **Note:** the delivered SecAI+ topics (41, split 7/15/10/9) are provisional until the official objectives PDF is fetched and the topics are re-mapped to it.
- [ ] **Step 4:** Commit `feat(secai): pack scaffold, hidden`.

### Task 2.3: 200 exemplars

- [ ] Split 34/80/48/38 by domain; author in domain batches (two parallel authors allowed); MCQ + ~15% multi-select; difficulty ~25/50/25.
- [ ] Add test `secai exemplar bank >= 195, letter spread within ±7, longest-correct <= 35%` to 550.
- [ ] `node scripts/exemplar-gate.js --cert secai --version <v>` → pass; one adversarial content review; fix findings.
- [ ] Commit per batch `feat(secai): exemplars — <domain>`.

### Task 2.4: Landing surfaces (gated for the API)

**Files:** `landing/index.html` + `landing/styles.css` (tile, kept hidden until reveal), `landing/diagnostic/index.html`, `landing/diagnostic/secai/{intake,quiz,results}.html` (clone `clfc02/`), `landing/diagnostic/results-config.js`, `landing/api/diagnostic/generate.js` (secai branch), `landing/lib/cross-cert-overlap.js` (Security+ strong, AI-901 light), `landing/lib/admin.js` (catalogue row "Hidden")

- [ ] Build from the approved mockup; 546 drift test passes with secai hidden.
- [ ] Commit `feat(secai): landing tile, diagnostic, overlap (hidden)`.

### Task 2.5: Hidden merge, founder trial, reveal

- [ ] Founder adds `secai` CNAME + Vercel alias.
- [ ] Verify locally on desktop, WebKit, 375px; merge hidden (PR, since generate.js is gated).
- [ ] Live: open `secai.certanvil.com` read-only checks; iOS app via the switcher as admin.
- [ ] Founder tries it and says "ship it" → flip `hidden:false`, unhide landing tile, `bump-version.js`, `ship` skill, post-deploy live check on all four targets.
- [ ] Follow-up queued (not this plan): SecAI+ Sim Lab scenarios via the 2-agent consensus gate, after Security+ Wave 5.

---

## Part 3 — PRINCE2 7 Foundation (branch `feat/cert-prince2`)

### Task 3.1: Pack scaffold + hidden entry

**Files:** Create `certs/prince2.js`, `tests/uat/551-cert-prince2.js`; registry entry `prince2` (`hidden:true`, `scale:{min:0,max:100,pass:60,format:'percent'}`, `domainCount:5`).

- [ ] Check PeopleCert's PRINCE2 7 Foundation syllabus for official area weights and open/closed book; official figures replace the spec's 60/15/13/8/4 if published.
- [ ] Tests mirror 550 with domains `practices, processes, people, principles, concepts`; meta 60 Q, 3600 s, percent.
- [ ] Topics from `20-prince2-mastery` lesson titles (7 practices, 7 processes, 7 principles, people, concepts); ~8 retention concepts from `NOTES.md` core facts.
- [ ] Delivered: 32 topics (7 practices, 7 processes, 4 people, 7 principles, 7 concepts); the 200 exemplars split 114/30/26/16/14 by domain. `meta.weightsAreEstimates: true` because PeopleCert publishes no area weights.
- [ ] Commit `feat(prince2): pack scaffold, hidden`.

### Task 3.2: 200 exemplars from the founder's mocks

- [ ] One-off extractor in the session scratchpad (not the repo) reads `~/Desktop/Lessons/teach-claudecode/lessons/20-prince2-mastery/06-mock-exams/mock-*.html` → candidates with area tag, stem, options, answer, explanation.
- [ ] Curate 200 by the area split (120/30/26/16/8); rewrite into the exemplar shape; rebalance letters and option lengths; strip any manual-verbatim phrasing.
- [ ] Bank test in 551; `exemplar-gate.js --cert prince2`; one adversarial review.
- [ ] Commit `feat(prince2): exemplars from founder mock bank`.

### Task 3.3: Landing, trademark line, hidden merge, reveal

- [ ] Same as Tasks 2.4–2.5 with `prince2`; add the PeopleCert short line plus trademark sentence per the mockup; PRINCE2 shows the estimated-weights note; percent readiness checked on all four targets.
- [ ] Practitioner stays out of scope (future `prince2-prac`).

---

## Part 4 — Scrum site (branch `feat/cert-scrum`)

### Task 4.1: Family wiring + two hidden entries

**Files:** Create `certs/psm1.js`, `certs/psm2.js`, `tests/uat/552-cert-scrum.js`; registry entries `psm1`/`psm2` (`family:'scrum'`, `hostPrefix:'scrum'`, `examSlug:'psm1'|'psm2'`, percent pass 85, `hidden:true`, domainCount 3 / 4).

- [ ] Tests: `scrum family priority` (`?exam=psm2` > override `psm1` > `psm1` default; head, `detectCert`, `getActiveCertId` agree); in-family switch stays on `scrum.certanvil.com`; meta 80 Q/3600 s and 30 Q/5400 s; weights `framework .60, people-teams .20, product .20` and `framework .30, coaching .35, product-value .20, done-scaling .15`; in-app label marks the weights as estimates.
- [ ] Commit `feat(scrum): PSM I + II family, hidden`.

### Task 4.2: True/false as two-option MCQ

- [ ] Test (Playwright, local): a two-option exemplar-shaped generated question renders, answers and scores on the quiz and exam screens at desktop and 375px; fix layout only if it breaks.
- [ ] Commit `test(scrum): two-option questions render and score`.

### Task 4.3: Exemplars

- [ ] PSM I 200 (120/40/40), PSM II ~120 (36/42/24/18), from the Scrum Guide 2020 (attribution in pack header) and the Nexus Guide for scaling.
- [ ] Delivered: PSM II is 120 exemplars split 36/42/24/18 (96 MCQ, 18 multi-select, 6 true/false); PSM I is 200 split 120/40/40. Both set `weightsAreEstimates: true`.

- [ ] Gate + review per pack; bank tests in 552.
- [ ] Commit per pack.

### Task 4.4: Landing, trademark line, hidden merge, reveal

- [ ] As Tasks 2.4–2.5 with one `scrum` tile/diagnostic covering both exams; Scrum.org short line plus trademark sentence. The Scrum tile opens PSM I (switch to PSM II in the app, as A+ opens Core 1).

---

## Part 5 — Answer-letter skew in existing packs (branch `fix/exemplar-letter-skew`)

### Task 5.1: Evidence

- [ ] With the founder's key exported in the same shell: `node scripts/exemplar-letter-bias-test.js --batches 6` for `sc900` and `aplus-core1`; extend the script to record option lengths; save output to `docs/audits/2026-08-22-exemplar-answer-letter-skew.md` as a dated result section.

### Task 5.2: Fix chosen by the evidence

- [ ] **Both arms skewed →** post-generation option shuffle in one function on the serve path, rewriting letter references in explanations; UAT proves letters ≈ even over 1000 shuffled samples and explanations still name the right option. Gated if it touches validation; run `tests/validation-audit.js`.
- [ ] **Only the exemplar arm skewed →** rebalance `sc900`, `aplus-core1`, `aplus-core2`, `az900`, `netplus`, `clfc02` via the `exemplar-lane` skill (swap order on order-neutral items, update letters inside explanations, never touch `objective` tags); per-pack spread test added to each pack's UAT.
- [ ] **Neither →** record the result, close the audit, no change.
- [ ] Ship on "ship it".
