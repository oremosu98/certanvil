# Network+ AI Quiz — Project Guide

> **This file reloads on every tool call — keep it lean.** Deep, rarely-needed detail lives in `docs/` and `CHANGELOG.md` behind the one-line pointers below. Policy: inline only the **last 3 ships** in Version History.

## Context
- **Single-user app currently** (the user is the student prepping for real N10-009). Explains why items like per-user API cost telemetry are deferred.
- **Future pivot**: paid multi-cert SaaS. Anything tagged `saas-gated` is **frozen** until that trigger fires (see Decision rules).
- **Origin**: Notion-native flashcard quiz (2026-03-28) → standalone web app (2026-04-02). **Notion sync is not on the roadmap — do not re-propose.**
- **External reviewer**: user periodically pastes OpenAI Codex feedback as a product-review signal.

## Architecture
- **Type**: Static HTML/JS/CSS single-page app — no framework, no build step.
- **AI**: three-way Claude split, direct browser fetch (`anthropic-dangerous-direct-browser-access: true`); user supplies their own API key (`STORAGE.KEY`). Haiku 4.5 `CLAUDE_MODEL` = bulk generation (`fetchQuestions`, `tbGenerateAiTopology`); Sonnet 4.6 `CLAUDE_VALIDATOR_MODEL` = semantic second-pass (`aiValidateQuestions`); Sonnet 4.6 `CLAUDE_TEACHER_MODEL` = authoritative teacher content (Tier A/B/C — see key-patterns doc).
- **Storage** (Phase C′): cloud-canonical, localStorage as ephemeral session cache. Source of truth = Supabase (`profiles.metadata` jsonb + `quiz_history`). Write path: localStorage → `_cloudFlush(STORAGE.X)` → 1500ms debounced cloud write. Hydrate: SIGNED_IN → `cloudStore.hydrate()`. Anonymous users get the full app via localStorage only. Cross-subdomain session via cookie-backed Supabase adapter on `Domain=.certanvil.com`.
- **Hosting**: Vercel — `networkplus.certanvil.com` (+ per-cert subdomains, "Pattern A") + `certanvil.com` (separate landing project).
- **Offline/PWA**: service worker (stale-while-revalidate + Supabase API pass-through + auto-reload-on-update). **Cache name MUST bump every deploy — use `bump-version.js`, never hand-edit.** Installable via `manifest.json`.

## Files
| File | Purpose | Size |
|---|---|---|
| `index.html` | All page structures (30+ pages: setup, quiz, exam, results, review, subnet, ports, drills launcher, topology, topology-builder-v3, analytics, progress, guided labs, …) + global chrome (sidebar + topbar incl. `#topbar-bug-report` iconbtn that lazy-loads `features/reports.js`) | ~115 KB |
| `app.js` | All app logic — state, AI calls, rendering, game loops, analytics, 5 activity sub-systems, cloud-flush hooks. Exposes `window.CURRENT_CERT` + `window.CERT_PACK` for lazy-loaded feature modules. | **~2.0 MB / ~32K lines** |
| `styles.css` | Full dark/light theme styling + account pill + cert switcher + `@media (prefers-reduced-motion)` gate | ~485 KB |
| `dg-system.css` | Editorial design-system overrides — forged-bronze tokens, scoped page reskins, `.br-*` bug-report drawer block (incl. scoped `[hidden]{display:none!important}` since component `display:flex` rules otherwise override the attribute) | growing |
| `sw.js` | Service worker — stale-while-revalidate, shell-asset precache, 60-entry LRU cap, Supabase API pass-through, auto-update broadcast | ~120 lines |
| **`lib/supabase.js`** | **Phase C′** — Supabase client init with cookie-backed storage adapter (cross-subdomain session sharing) | ~150 lines |
| **`lib/supabase-umd.min.js`** | **v4.89.1** — vendored Supabase UMD bundle (was cdn.jsdelivr; vendored after intermittent 503 broke auth) | 197 KB |
| **`cloud-store.js`** | **Phase C′** — debounced cloud flush queue + `hydrate()` + `clearLocalCache()` + `migrateLocalToCloud()` + status-listener API | ~440 lines |
| **`auth-state.js`** | **Phase C′** — account pill + dropdown + auth state machine + sync-status updater + cert switcher | ~390 lines |
| **`migration.js`** | **Phase C′** — one-time builder import banner (reads localStorage stats, bulk-uploads to cloud, sets `migration_v1_at` flag) | ~290 lines |
| **`certs/netplus.js`** + **`certs/secplus.js`** | **v4.86–4.87** — cert pack data (topic catalog, GT tables, exemplars, Phase 3 retention concepts). Loaded before app.js per script-tag order in index.html | netplus ~400 KB, secplus growing |
| **`landing/`** (separate Vercel project) | certanvil.com landing — `index.html` + `auth.js` + `script.js` + `lib/supabase.js` + `sw.js` (kill-switch) + `og-image.svg` + `pricing.html` + `api/notify.js` (Resend) | — |
| **`supabase/migrations/`** | Schema migrations — `20260506_phase_c_prime.sql` adds `profiles.role` + `is_admin()` + RLS updates | — |
| `manifest.json` | PWA manifest | 646 B |
| `vercel.json` | Vercel config (minimal) | 806 B |
| `tests/uat.js` | UAT suite — **5,100 assertions** as of v4.89.8, embeds validation-audit gate | ~16K lines |
| `tests/tech-debt.js` | CI thresholds: long-function count, LOC, global count, etc. | 131 lines |
| `tests/validation-audit.js` | 23-Q broken-corpus regression fixture (60% catch floor, 0 FP ceiling) | 589 lines |
| `tests/deploy-verify.js` | Post-deploy smoke against prod (comment-strip fix v4.89.9 / dc844a2) | 335 lines |
| `tests/e2e/app.spec.js` | Playwright E2E (99 tests as of v4.89.x) | — |

**Reality check:** `app.js` size is the driver for [#138](https://github.com/oremosu98/networkplus-quiz/issues/138) (module split) — `saas-gated`, don't start without pivot trigger. `styles.css` growth drove [#55](https://github.com/oremosu98/networkplus-quiz/issues/55) — same gate.

## Deep reference (read on demand)
- **Key patterns** — quiz flow, question types, exam mode, AI teacher tiers, ground-truth tables, curated exemplar bank, 7-layer validation pipeline, weak-spots, readiness, milestones, keyword highlighting, animation inventory → [docs/architecture/key-patterns.md](docs/architecture/key-patterns.md)
- **Feature sub-architectures** — Topology Builder, Subnet Trainer, Drills launcher → [docs/architecture/feature-subsystems.md](docs/architecture/feature-subsystems.md)
- **Conventions & lessons** — testing philosophy, progressive disclosure, magic-number constants, tier-threshold anchoring, prescriptive analytics, lesson authoring, scope disambiguation, live-verify, scenario `autoBuild` → [docs/conventions/conventions.md](docs/conventions/conventions.md)
- **Regression-Guard Tombstones** — deleted code that must stay deleted → [docs/conventions/regression-tombstones.md](docs/conventions/regression-tombstones.md)
- **Project boards, weekly cadence, external references** → [docs/conventions/workflow.md](docs/conventions/workflow.md)

## Decision rules

### `saas-gated` label
Items tagged `saas-gated` on either board are **frozen until the paid-SaaS pivot triggers — do NOT pull one without explicit pivot direction.** Currently gated: [#21](https://github.com/oremosu98/networkplus-quiz/issues/21) (wrap globals into state objects), [#55](https://github.com/oremosu98/networkplus-quiz/issues/55) (split `styles.css`), [#123](https://github.com/oremosu98/networkplus-quiz/issues/123) (social-proof counter), [#135](https://github.com/oremosu98/networkplus-quiz/issues/135) (per-user API cost telemetry), [#136](https://github.com/oremosu98/networkplus-quiz/issues/136) (entitlements + tier quotas), [#137](https://github.com/oremosu98/networkplus-quiz/issues/137) (cost-floor model), [#138](https://github.com/oremosu98/networkplus-quiz/issues/138) (module-split `app.js`, v5.0 trigger), [#139](https://github.com/oremosu98/networkplus-quiz/issues/139) (readiness-algorithm tuning).

### Testing Discipline — NEVER write to user-state localStorage on prod
**Hard rule, no exceptions.** When using the Chrome MCP `javascript_tool` (or anything that runs JS in the user's connected browser), NEVER call `localStorage.setItem/removeItem/clear` on a prod or `*.vercel.app` host — it overwrites the user's real `nplus_*` progress with no undo (this rule was bought with a real v4.81.x data-loss incident). Use one of: a **local server** (`python3 -m http.server 3131` → `localhost`), a **Vercel preview deploy**, or a fresh **incognito window**. Read-only evals on prod are fine. Full incident write-up + the shipped recovery layers live in [docs/conventions/conventions.md](docs/conventions/conventions.md).

## Deployment

### Ship checklist
[`SHIP_CHECKLIST.md`](./SHIP_CHECKLIST.md) codifies the pre-push discipline in 6 phases (automated checks → version+cache → live-verify → schema/RLS → final pre-push gate → post-push smoke). **Walk the Ship checklist before every meaningful push;** skip phases deliberately, not implicitly.

### Multi-engineer feature review
[`.claude/skills/review-feature/SKILL.md`](./.claude/skills/review-feature/SKILL.md) fires 4 parallel agents (Architect/Engineer/Reviewer/Optimizer) for non-trivial proposals (3+ files / new subsystem / schema change / multi-step flow). For trivial ships, just walk the Ship checklist.

### Two paths — prefer push
1. **Canonical**: `git push origin main` → GitHub Actions (UAT + Playwright + `tech-debt.js`) → Vercel auto-deploy → post-deploy smoke. Branch protection requires the "UAT + Playwright" check; admin bypass for emergencies only.
2. **Local quick-ship** (bypasses CI): `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"` then `npx vercel --prod --yes`. **Commit immediately before/after** — git↔prod drift once cost 6 versions (v4.39→v4.43.1).

### Version bumps
`node scripts/bump-version.js <new> "<desc>"` updates `APP_VERSION` (app.js) + `CACHE_NAME` (sw.js) + version badge (index.html) + `package.json` + **prepends a stub row to the Version History table below**. Do NOT hand-edit partial — UAT asserts consistency across all 4 code surfaces. The script writes CLAUDE.md, so **re-read CLAUDE.md before expanding the stub row** (any prior snapshot is stale).

## Branching Strategy — Risk-Tiered (adopted 2026-05-12)

> **Full spec: [`ENVIRONMENT_STRATEGY.md`](./ENVIRONMENT_STRATEGY.md)** — read it before any DB/auth/payments/SW change.

**The decision rule: does the change touch the database schema, money, auth, or the service worker? YES → gated lane. NO → fast lane.**

| Lane | Triggers | Flow |
|---|---|---|
| **Fast** (~90%) | exemplars, retention concepts, UI/CSS, copy, non-schema JS, docs, drills | commit → `main` → push → CI → Vercel prod |
| **Gated** (~10%) | `supabase/migrations/*` · `landing/api/{stripe,ai,diagnostic}/*` · `auth-state.js` · `cloud-store.js` · `lib/supabase.js` · `sw.js` · RLS/entitlements/quota | feature branch → PR (auto-spins Supabase branch DB + Vercel preview + CI) → smoke-test preview → squash-merge → prod |

**Gated-lane migration rule**: every `supabase/migrations/*` file dated ≥ 2026-05-12 MUST carry a tested `-- ROLLBACK:` block (pre-cutoff grandfathered → PITR). Gated ships also need migration-applied + env-vars-set + redeploy, and endpoints must graceful-503 on missing env vars.

## Local Development
```bash
cd "/Users/simioremosu/Desktop/Dev Projects/networkplus-quiz"
python3 -m http.server 3131   # → http://localhost:3131
```
Pre-commit hook (`.githooks/pre-commit`, wired via the `package.json` `prepare` script): runs `node tests/uat.js` + the CLAUDE.md-freshness check + a data-safety scan; skips UAT for docs-only commits. Bypass with `git commit --no-verify`.

## Test Suite
```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
node tests/uat.js                # UAT (embeds the validation-audit gate)
node tests/tech-debt.js          # CI thresholds — LOC, globals, long-function count
node tests/validation-audit.js   # broken-corpus fixture, ≥60% catch / 0 FP
npx playwright test              # E2E (tests/e2e/app.spec.js)
```
**Don't tune `validateQuestions()` without running `validation-audit.js` first** — the `MIN_CATCH_RATE = 60` / `MAX_FP_RATE = 0` floor is CI-enforced inside UAT.

## Version History

> **Older releases live in [CHANGELOG.md](./CHANGELOG.md).** Policy: inline only the **last 3 ships**. `bump-version.js` prepends new rows to the table below; trim back to 3 during consolidation.

| Version | Features Added |
|---|---|
| v7.8.2 | **Landing E2E coverage — closes the gap that let the cd8c784 cert-coverage fix ship UNTESTED by E2E (follow-up to v7.8.1).** Before this, `tests/e2e/app.spec.js` covered the cert-app only (`baseURL :3131` = repo root); the landing site (`landing/`) had ZERO Playwright coverage, so today's fix aligning Account Settings / My Certs / Cross-Cert Analytics to the canonical 8 exams had no regression guard. **What shipped**: (1) `playwright.config.js` — a SECOND `webServer` (`npx serve landing -l 3132`, **no `-s`** because the landing site is multi-page, not an SPA — `-s` masks every route behind index.html; serve's cleanUrls maps `/analytics`→`analytics.html` matching prod `vercel.json`) + a new **`landing` project** (`testMatch: /landing\.spec\.js/`, `baseURL :3132`, Chromium) + `testIgnore: /landing\.spec\.js/` on the chromium/webkit/mobile-safari projects so they don't cross-pick. (2) NEW `tests/e2e/landing.spec.js` — 3 tests asserting the canonical 8-exam set (netplus, secplus, aplus-core1, aplus-core2, az900, ai900, sc900, clfc02) renders with NO phantom certs (CCNA / SAA-C03 / AZ-104) on all three surfaces; `expectCanonicalIds()` asserts every canonical id present, length === 8 (catches a missing OR an extra cert), and no phantom id. (3) `ci.yml` gating step → `npx playwright test --project=chromium --project=landing` (one line) so landing gates merges too. (4) Three tiny window E2E hooks (mirroring the cert-app's `window.renderHistoryPanel` pattern) so Playwright can assert the source-of-truth builders without faking the Supabase auth chain the three surfaces sit behind: `window.ccaGetCertCatalog` (`landing/lib/cross-cert-analytics.js`), `window.accGetCertEntitlements` (`landing/lib/account.js`), `window.renderMyCertsList` (`landing/auth.js`) — the cd8c784 bug was in this cert DATA, not the render loop, so asserting it is the right-altitude guard (analytics + account assert the returned id arrays; My Certs drives `renderMyCertsList({role:'user',metadata:{}})` into `#my-certs-list` and asserts the 8 rendered exam codes + 8 `.my-cert-row` rows + no phantom). **Diagnosis-during-build**: first local run failed 2/3 — `serve -s` was serving index.html (SPA fallback) for `/analytics` + `/account`, masking the real pages (curl confirmed: with `-s` only auth.js loaded; without `-s` cross-cert-analytics.js + lib/account.js load correctly). Dropped `-s` + switched the spec to clean URLs (`/analytics`, `/account`). **Verified**: `npx playwright test --project=chromium --project=landing` → **78 passed (75 cert-app + 3 landing) in 56.5s**; UAT exit 0. **Fast-lane** per ENVIRONMENT_STRATEGY (tests + test-infra config + additive window getters; no DB/auth/money/SW-fetch-logic; `sw.js` = universal CACHE_NAME bump from `bump-version.js`). This push touches `landing/**` so `deploy-landing.yml` redeploys the landing project (additive window exposures — safe), and `deploy-production` redeploys the cert-app via the now-green gate. Both auto-deploy with no manual `npx vercel --prod`. |
| v7.8.1 | **CI fix (test-infra) — pruned the orphaned Playwright suite that had been red on every push since the v7.0.0 MVP pivot; this single change restores BOTH the green gate AND cert-app push-deploy.** Diagnosis: the v7.0.0 quiz-only pivot deleted the drills + Topology Builder (pages `page-subnet`/`page-ports`/`page-network-analysis`/`page-topology-builder`/`-v3` are gone from `index.html`) but `tests/e2e/app.spec.js` still carried full `test.describe` blocks for those deleted features. In CI each orphan timed out 30.1s (×retry) waiting for DOM that no longer exists → the "UAT + Playwright" gating job ran **43 min** and reported **107 failed / 76 passed / 1 skipped**. This is the "baseline noise" the v7.0.0 row flagged for "a future tech-debt sweep" — that deferral is what kept CI red for ~30 versions, forcing admin bypass on every push AND skipping `ci.yml`'s `deploy-production`/`deploy-production-secplus` jobs (both `needs: test`), so the cert-app never push-deployed (only the 10-min `vercel-incident-recovery.yml` cron kept prod in sync). UAT itself was always green; the missing local `webkit-2272` binary was a red herring (CI runs `--project=chromium` only + installs it fresh). **Fix**: deleted 10 orphaned describe blocks (Subnet Trainer, Port Drill, Subnet Trainer Advanced, Port Drill Timer & Scoring, Network Builder 3D View Phases 1/2/3, Network Analysis Drill, topology-builder-v3 [~1250 lines], TB v3 Walkthrough Phase 8 [to EOF]) + 3 now-unused shared helpers (`gotoSubnetPractice`, `answerCurrentSubnetQuestion`, `gotoPortPractice`); surgically removed the 2 deleted-page tests inside `Navigation` (kept analytics + topic-progress) and the `Back button returns to page-ports` test inside the surviving `Guided Terminal Lab` block; and fixed `Page Structure › all page divs exist` by dropping `page-subnet`/`page-ports` from its `pages[]` array (the other 13 ids grep-verified present in `index.html`). `tests/e2e/app.spec.js` 4120 → 1575 lines (−2552/+7); 40 → 30 describe blocks; 75 tests, all surviving-feature (App Load, Theme, Navigation, Chip Selectors, Wrong Bank, Exam Modal, Page Structure, Production Monitor, Guided Terminal Lab, SR Review ×2, Quiz Revisit, Quiz Hot-Area, bug-report drawer, …). **Verified**: `node -c` clean; `grep` confirms zero residual references to any deleted page/helper/feature; `npx playwright test --project=chromium` → **75 passed / 0 failed / 0 skipped in ~58s** (was 43 min). **Task-1 linkage**: this repo deploys via GitHub Actions + Vercel CLI + `VERCEL_TOKEN` (NOT native Vercel↔GitHub OAuth — that was retired in the v4.20-era incident in favour of Actions + the recovery cron). Landing already auto-deploys via the independent `deploy-landing.yml` (no `needs: test`). With the gate green, `deploy-production (needs: test)` runs on push → **cert-app auto-deploy restored** with no dashboard/OAuth reconnection (which would double-deploy). **Follow-up (separate ship)**: add landing E2E coverage (new `tests/e2e/landing.spec.js` + a second `webServer`/`landing` Playwright project rooted at `landing/` + `--project=landing` in `ci.yml`) asserting all 8 canonical exams render + no phantom CCNA/SAA-C03/AZ-104 on Account Settings / My Certs / Cross-Cert Analytics — closing the gap that let today's cert-coverage fix (cd8c784) ship with zero landing E2E. **Fast-lane** per ENVIRONMENT_STRATEGY (test-only; no DB/auth/money/SW-fetch-logic; `sw.js` = universal CACHE_NAME bump from `bump-version.js`). |
| v7.8.0 | AWS Certified Cloud Practitioner (CLF-C02) cert added — seventh cert, third vendor (AWS), on clfc02.certanvil.com (Pattern A, Pro-tier). 4-domain (blueprint 24/30/34/12) + 54 topics + 8 VoC retention concepts + 200 hand-authored exemplars (D1 48 / D2 60 / D3 68 / D4 24; 166 mcq + 34 multi-select) authored by 4 parallel subagents then independently reviewed by 4 parallel critique subagents (caught + fixed answer-key bias, ambiguous multi-selects, factual errors, wrong topics/objectives, near-duplicates). 8 UAT regression tombstones. Detection 3-file mirror (app.js detectCert + index.html inline IIFE + auth-state.js) + 8-way CANONICAL ternary + Pro-gate + 4-domain CSS hide rule. |

## CSS Theme System
Dark theme in `:root`, light theme in `[data-theme="light"]`. Key variables: `--bg`, `--surface`, `--accent`, `--text`, `--green`, `--red`, `--yellow`. Toggle via `toggleTheme()`.

## Common Gotchas

**Code shape**
- The `pick()` function targets `#options .option` — CLI sim diagnosis MCQ must be inside `#options` div
- Topology scoring uses `correctPlacements` object mapping device→zone name (exact string match)
- Exam answers init must include `cliRan: [], topoState: {}` for PBQ types
- `hasAnswer` checks must include `Object.keys(a.topoState || {}).length > 0`
- `setQuestionText(el, raw)` order is **escape-THEN-highlight** (`escHtml` → `highlightExamKeywords` → `innerHTML`). Reversing it is an XSS hole since question text is AI-generated.
- The `_fnBody(src, name)` helper used by UAT extracts function bodies via brace-depth walking. **Prefix-match trap**: `tbShowCoach` will match `tbShowCoachModalLoading`. When writing UAT for a function, pick a name that's either unique or specify the exact suffix.

**Testing**
- Don't tune `validateQuestions()` without running `node tests/validation-audit.js` first — the `MIN_CATCH_RATE = 60` / `MAX_FP_RATE = 0` floor is CI-enforced inside UAT
- Don't pull `saas-gated` items (see Conventions list) without explicit pivot direction
- `tests/uat.js` prefers behavioral smoke over structural; see Testing Philosophy

**Deploy**
- Service worker cache name must be bumped on every deploy or users get stale files — use `scripts/bump-version.js`, never hand-edit partial
- Vercel CLI requires nvm path export: `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"`
- If you're tempted to `vercel --prod` without committing, **commit and push immediately after** — git↔prod drift cost us 6 versions (v4.39→v4.43.1) before it got caught
- Branch protection on `main` requires the "UAT + Playwright" status check; admin bypass works but defeats the point — only use for real emergencies

**Infra**
- `PROJECT_TOKEN` repo secret is a PAT with `project` scope (not the default `GITHUB_TOKEN`). Powers both `auto-add-to-board.yml` and `auto-archive-done.yml`. If rotated, update in GitHub repo secrets or both workflows fail loud.
- `deploy-verification.yml` runs post-deploy against the public URL — legit failures mean prod is broken; stale-cache failures mean give CDN a minute and re-run.
- When UAT fails mid-session, check `tests/validation-audit.js` first — a change to `validateQuestions()`, the GT tables, or the prompt can trip the regression gate without any UAT-level error being obvious.

---

## Post-deploy verification (always run after ship)

Headless UAT + Playwright can pass while real users see broken UI — it happened repeatedly across the v6.5.x run. After any feature/fix lands on `main` and Deploy Verification reports success, **drive the live prod URL in a real browser before claiming done**:

1. **Cache-bust navigate** to the prod URL with a `?_cb=<version>` query (bypass the SW cache) using the Chrome MCP tools.
2. **Reproduce the user's exact click path** — don't shortcut via JS calls; click through mode pills / pickers as a user would.
3. **Measure DOM rects + computed styles**, not just internal state (canvas/panel sizes, theme-token colors, new-panel `position`/`transform`/`display`, viewport visibility).
4. **Walk the full flow** end-to-end (first interaction → advance → completion → exit → reload).
5. **Only then claim "shipped + verified".** Ship a hotfix before signing off if anything's off.

**Skip only when** the change is purely backend/data/docs with no user-facing surface, or behind a flag that's off in prod. Reason this rule exists: UAT regex-tests source strings and Playwright runs fresh navigations — both miss live-interaction layout bugs, theme-mismatched colors, viewport carry-over, and CSS-grid collisions.
