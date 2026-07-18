# app.js Incremental Extraction (#138) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task — **inline execution is the founder's stated preference (2026-07-17)**: the session itself walks the tasks with checkpoints, rather than dispatching per-task subagents. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Model split (founder decision 2026-07-17):** This plan was authored with **Fable** (planning). **Execution is by Sonnet** — run the executing session on Sonnet. Do not escalate execution to a larger model without the founder asking.
>
> **Sequencing (founder decision 2026-07-17):** This plan is queued BEHIND Sim Lab PBQ Wave 4 (Laser Print Defect Clinic, ships as v7.66.0). Do not start Phase 0 until PBQ Wave 4 has shipped and been live-verified; the session that ships Wave 4 should remind the founder that this plan is up next. Note the naming collision: "PBQ Waves" = Sim Lab product features; this plan's "waves" = extraction cuts. Independent tracks — never mix them in one session.

**Goal:** Drain app.js (22,060 lines / 1.1 MB as of v7.65.2) into lazy-loaded `features/*.js` modules via strangler-fig extraction — one page-level wave at a time, each wave a normal shippable change through the full gate stack — until app.js is a slim core (state, router, shared helpers, constants).

**Architecture:** No build step, no framework — same as today. Each wave moves one page's exclusively-owned functions into a self-registering IIFE feature module (the proven `features/reports.js` / `features/sim-lab.js` pattern), lazy-loaded on first page visit via the existing `_loadFeature()` / `_ensureSimLabLoaded()`-style hooks. Shared helpers STAY in app.js. A tech-debt ratchet guarantees app.js only shrinks between waves.

**Tech Stack:** Vanilla JS IIFE modules, `graphq.js` (graphify call-graph) for inventory, existing test stack (UAT 4,729 checks + Playwright e2e + visual regression baselines) as the safety net.

## Why this is safe NOW (evidence, 2026-07-17)

- Issue #138's own 2026-06-14 update: the SaaS-pivot trigger (#136) **is firing** — the issue is "technically unblocked." This plan supersedes #138's `src/` sketch (which assumed a build step) with the shipped no-build `features/` pattern.
- The pattern is proven at scale: `features/sim-lab.js` (177 KB) and `features/reports.js` already live this way; UAT concatenates + dedents `features/*.js` into its `js` scan string, so **structural UAT assertions survive moves between files by construction** (see `tests/uat/_context.js`).
- The safety net: 4,729 UAT checks (proven to survive a mechanical restructure — the tests/uat split shipped with byte-identical verification), 148+ e2e tests, and visual regression baselines that ALREADY cover the first two extraction targets (`progress-visual-darwin.png`, `analytics-visual-darwin.png`).
- The old #138 module sketch's prefixes (`tb*`, `st*`, `pt*`) no longer match the code. **The graphify communities are the truthful map** — inventory is re-derived per wave, never assumed.

## Global Constraints

- **Execution model: Sonnet.** Planning/review sessions may be any model; extraction execution is Sonnet.
- **Never rewrite while moving.** Extraction is a mechanical MOVE: identical function bodies, identical names. Refactors/renames are separate commits AFTER a wave ships, never mixed in.
- **Shared helpers stay in app.js.** A function moves only if ALL its callers are inside the wave's page (verify with `node scripts/graphq.js callers <fn>` + `grep -c "\bfn\b" index.html` for HTML-attribute callers). When in doubt, leave it.
- **Feature-module body indented exactly 2 spaces** inside the IIFE — the UAT concat dedents exactly 2 leading spaces (`tests/uat/_context.js`); deeper/shallower indentation breaks column-0 structural regexes.
- **HTML-invoked functions must be re-exposed on `window`** from the module (onclick attributes resolve against `window`).
- **One wave = one commit = one ship** on `main` (fast lane per ENVIRONMENT_STRATEGY — no schema/money/auth/sw logic changes). Full gate stack every time: pre-commit (stamp + UAT + safety scan) → `npm run test:e2e` → `npm run test:visual` → `bump-version.js` → push → CI → post-deploy live-verify per CLAUDE.md.
- **Never hand-edit versions/cache names** — `node scripts/bump-version.js` only.
- **`saas-gated` note:** Phase 0 Task 1 records the unfreeze of #138 specifically; other gated items (#21, #55, #123, #135–#137, #139) stay frozen.
- **Rollback unit:** each wave is a single revertable commit. If post-deploy live-verify fails and the fix isn't obvious in minutes, `git revert <wave-sha>`, bump, re-ship, diagnose offline.

---

## The Extraction Protocol (canonical — every wave follows this)

Referenced by Waves 1–3 and all future waves. Wave tasks below fill in the wave-specific values.

**P1 — Inventory (graph-driven, never assumed):**
```bash
cd "/Users/simioremosu/Desktop/Dev Projects/certanvil"
node scripts/graphq.js community "<CommunityName>"        # per adjacent community
node scripts/graphq.js callers <fn>                        # for EVERY candidate fn
node scripts/graphq.js callees <fn> --depth 2              # find helpers it pulls
grep -cE "\b<fn>\b" index.html                             # HTML onclick/attr callers
```
Classify every candidate: **MOVE** (all callers inside the wave's page set, or HTML-only callers) or **STAY** (any caller outside the set). Record the final MOVE list in the wave's commit message.

**P2 — Scaffold** `features/<name>.js`:
```js
/* <Page Name> — extracted from app.js (#138 wave N). Lazy-loaded feature.
 * Mechanical move: function bodies identical to app.js @ <base-sha>. */
(function () {
  'use strict';

  // ── moved functions, bodies UNCHANGED, 2-space indent ──
  // function renderXxx() { ... }

  // ── window re-exposure (HTML onclick + cross-file callers) ──
  // window.renderXxx = renderXxx;

  // ── feature registry (standard _loadFeature convention) ──
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['<name>'] = { enter: <entryFn> };
})();
```

**P3 — Move:** cut the MOVE-list functions out of app.js (delete there, paste into scaffold, re-indent body by exactly 2 spaces). No edits to bodies.

**P4 — Wire the loader** in app.js: in `showPage()` (app.js:~L2483), before rendering the wave's page, mirror the `_ensureSimLabLoaded` pattern (app.js:~L2030):
```js
// inside showPage(), in the branch for this wave's page:
if (!window.<readyProbeFn>) {
  _loadFeature('<name>').then(function (m) { m.enter(); });
  return; // enter() re-invokes the render once loaded
}
```
where `<readyProbeFn>` is one moved window-exposed function (its presence proves the module loaded). Keep it idempotent — `_loadFeature` caches.

**P5 — Verify (all must pass, in order):**
```bash
node tests/uat.js                      # expect: N/N ALL PASS (structural checks survive via concat)
node tests/tech-debt.js                # expect: all thresholds OK (ratchet: app.js SHRANK)
npm run test:impact                    # expect: selects core-app specs; all pass
npm run test:visual                    # expect: 8 passed — pixels UNCHANGED proves the move was invisible
```
Then drive the page manually per the **live-verify** skill on `http://localhost:3131` (first visit = lazy-load path, reload on the page = direct path, switch cert, switch theme).

**P6 — Ratchet down + ship:** update `tests/appjs-baseline.json` `lines` to the NEW (lower) `wc -l < app.js` value; `node scripts/bump-version.js <ver> "chore(#138): extract <name> to features/ (wave N)"`; commit (one commit, list MOVE set in body); push; post-deploy live-verify per CLAUDE.md.

---

## Phase 0 — Unfreeze + ratchet (one session, ships before any extraction)

### Task 0.1: Record the unfreeze of #138

**Files:**
- Modify: `CLAUDE.md` (Decision rules → `saas-gated` paragraph, and the "Reality check" line under the Files table)
- External: comment on GitHub issue #138

**Interfaces:** Produces: the documented authority every later wave cites. Consumes: nothing.

- [ ] **Step 1:** Re-read CLAUDE.md immediately before editing (stamp hooks rewrite it). In the `saas-gated` list, change the #138 entry from `[#138](…) (module-split app.js, v5.0 trigger)` to `[#138](…) (module-split app.js — **UNFROZEN 2026-07-17**, in progress via docs/superpowers/plans/2026-07-17-appjs-incremental-extraction.md)`. In the "Reality check" line, change "`saas-gated`, don't start without pivot trigger" to "unfrozen 2026-07-17 — incremental extraction in progress, see plan".
- [ ] **Step 2:** `gh issue comment 138 --body "Unfrozen 2026-07-17 (trigger #136 firing, per the 2026-06-14 update). Executing as incremental strangler-fig extraction into features/ lazy modules — plan: docs/superpowers/plans/2026-07-17-appjs-incremental-extraction.md. Waves ship individually on main; this issue closes when app.js is a slim core."`
- [ ] **Step 3:** Run `node tests/uat.js` → expect ALL PASS (CLAUDE.md edits must not trip the ceiling checks).
- [ ] **Step 4:** Commit: `git add CLAUDE.md && git commit -m "docs(#138): record unfreeze — incremental extraction plan adopted"`

### Task 0.2: Growth ratchet in tech-debt.js

**Files:**
- Create: `tests/appjs-baseline.json`
- Modify: `tests/tech-debt.js:34` (the static `check('app.js line count', jsLines.length, 22500)`)

**Interfaces:** Produces: `tests/appjs-baseline.json` with shape `{ "lines": <int>, "allowance": 150, "updated": "YYYY-MM-DD", "note": "<why last changed>" }`; consumed by tech-debt.js and by every wave's P6 ratchet-down step.

- [ ] **Step 1:** Create `tests/appjs-baseline.json` with the CURRENT count (`wc -l < app.js`, expected ≈22060):
```json
{
  "lines": 22060,
  "allowance": 150,
  "updated": "2026-07-17",
  "note": "Ratchet start (#138 unfreeze). Raise 'lines' ONLY deliberately, in its own commit, with a note. Waves LOWER it (protocol P6)."
}
```
- [ ] **Step 2:** In `tests/tech-debt.js`, replace line 34 (`check('app.js line count', jsLines.length, 22500); // re-baselined v7.53.2 …`) with:
```js
// #138 ratchet (2026-07-17): app.js may not grow past baseline+allowance.
// Baseline is LOWERED by each extraction wave (see the #138 plan, protocol
// P6). Raising it is allowed but must be a deliberate, commented, own-commit
// edit of tests/appjs-baseline.json — that friction is the entire point.
const appBaseline = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'appjs-baseline.json'), 'utf8'));
check('app.js line count (ratchet)', jsLines.length, appBaseline.lines + appBaseline.allowance);
```
- [ ] **Step 3:** Run `node tests/tech-debt.js` → expect `✓ app.js line count (ratchet): 22060 (max: 22210) [OK]` and overall pass.
- [ ] **Step 4:** Negative test: temporarily set `"lines": 20000` in the JSON, re-run → expect BREACH + exit 1. Restore `22060`, re-run → pass.
- [ ] **Step 5:** Run `node tests/uat.js` → ALL PASS. Commit: `git add tests/appjs-baseline.json tests/tech-debt.js && git commit -m "chore(#138): app.js growth ratchet — baseline+150, waves ratchet down"`
- [ ] **Step 6:** Push Phase 0 (`git push origin main`), confirm CI green.

---

## Wave 1 — Progress page (smallest coupling, baseline-guarded)

Graph evidence (2026-07-17): community **Progress Page Rendering (#59)** = 10 symbols, all in app.js, max degree 5; `renderProgressPage()` has **0 graph callers** (HTML/nav-invoked). Visual baseline `progress-visual-darwin.png` already guards the page's pixels.

**Files:**
- Create: `features/progress.js`
- Modify: `app.js` (remove MOVE set; add loader hook in `showPage()`), `tests/appjs-baseline.json` (ratchet down)
- Test: existing suites only (UAT concat + `npm run test:visual` + e2e) — no new test files

**Interfaces:**
- Consumes: `_loadFeature(name)` (app.js:~L2001, resolves `window._certanvilFeatures[name]`), `showPage()` (app.js:~L2483).
- Produces: `features/progress.js` registering `window._certanvilFeatures['progress'] = { enter: renderProgressPage }`; re-exposes on window every HTML-invoked member of the MOVE set.

- [ ] **Step 1 (P1):** Run the inventory on these candidates (starting set from community #59 — the graph may have shifted; re-derive, don't trust this list blindly): `_buildProgressRows` (L2859), `_renderProgressGrouped` (L3227), `renderProgressPage` (L3390), `setProgressFilter` (L3398), `setProgressSort` (L3408), `filterProgressPage` (L3413), `drillTopic` (L3419), `_pageRecCard` (L6593), `_pickProgressRecommendation` (L6616), `renderProgressRecommendation` (L6646). Expected outcome (verify, don't assume): `drillTopic` STAYS if anything outside the progress page calls it (`drillMistakesFromResults`/`drillDomain` are separate functions — check whether they or quiz-results paths reference `drillTopic` itself); everything else MOVES.
- [ ] **Step 2 (P2+P3):** Scaffold `features/progress.js` per protocol; move the MOVE set; window-expose at minimum `renderProgressPage`, `setProgressFilter`, `setProgressSort`, `filterProgressPage`, `drillTopic` (only if moved) — plus any other name `grep` finds in index.html attributes.
- [ ] **Step 3 (P4):** Wire `showPage()`'s progress branch with the lazy-load hook (ready-probe: `window.renderProgressPage`).
- [ ] **Step 4 (P5):** Full verification battery. The decisive check: `npm run test:visual` — `progress-visual` must pass UNCHANGED (a changed pixel means the move wasn't mechanical). Live-verify: first-visit lazy load, reload-on-page, filter + sort clicks, `drillTopic` click-through into a quiz, cert switch, both themes.
- [ ] **Step 5 (P6):** Ratchet `tests/appjs-baseline.json` down to the new `wc -l < app.js`; bump version; single commit `chore(#138): extract progress page to features/progress.js (wave 1)` listing the MOVE set; push; post-deploy live-verify.

---

## Wave 2 — Analytics page (the big one, still baseline-guarded)

Graph evidence: communities **Analytics Bento Widgets (#85)** (`_anaBt*`, ~L19535–19732), **App Core Analytics**, **Analytics Detail Panels**, **Accuracy Chart Render**, **Constellation Chart**, **Readiness Score Analytics**, plus the `_renderAna*` stack — together the largest coherent page bundle in app.js (`renderAnalytics` L19810, 1 in / 17 out). Baseline `analytics-visual-darwin.png` guards pixels.

Same protocol; wave-specific additions:

- [ ] **Step 1 (P1):** Inventory ALL analytics-adjacent communities listed above (`node scripts/graphq.js community "<name>"` each), then classify. Expect a MOVE set of dozens of functions; expect `getReadinessScore` and weak-spots scoring (`computeWeakSpotScores`, `mineSubtopicWeakSpots`) to STAY — quiz/results/home paths consume them (verify).
- [ ] **Step 2:** Special case — `tests/tech-debt.js` `KEPT_DYNAMIC_DISPATCH` (L180–184) carves out 9 `_ana*`/`_renderAna*` names as "dead-looking but alive," explicitly noting "The real cleanup is the analytics/module refactor (#138)." When these move to `features/analytics.js`, they leave the app.js def-scan entirely: **delete the carve-out set (or the moved subset) in the same commit** and re-run `node tests/tech-debt.js` to prove no dead-function regression.
- [ ] **Step 3:** UAT heads-up: 13+ checks assert on analytics OUTPUT STRINGS and `_fnBody(js, '_renderAna…')` extractions — the concat mechanism keeps them passing IF indentation discipline is followed exactly (2-space IIFE body). If any UAT check fails after the move, the move broke discipline — fix the module, never the test.
- [ ] **Step 4 (P4–P6):** Loader hook in `showPage()`'s analytics branch (ready-probe: `window.renderAnalytics`); full battery (`analytics-visual` unchanged is the decisive check); ratchet down; bump; single commit; ship + live-verify (drive: analytics first-visit lazy load, every bento widget renders, constellation + heatmap + trend animations, reduced-motion mode, both themes, cert switch).

---

## Wave 3 — Settings page

Graph evidence: **Settings Backup Restore (#102)** (3 symbols, ~L20782+) plus adjacent settings communities (API key, theme, export/import, daily goal — inventory per protocol). Visual baseline `settings-visual-darwin.png` guards it. Same protocol end-to-end; ready-probe: the settings page's entry render function (identify in P1). Note: `toggleTheme()` almost certainly STAYS (topbar-invoked on every page — verify).

---

## Waves 4+ — backlog and selection rule

After each wave, re-derive the next candidate (the graph re-clusters every commit):

```bash
node scripts/graphq.js stale            # relabel first if needed (ANTHROPIC_API_KEY gotcha)
# candidate rule: a PAGE whose communities are (a) app.js-only, (b) low
# external degree, (c) covered by a visual baseline (add one FIRST if not —
# extend tests/e2e/visual.spec.js in its own prior commit).
```

Known remaining candidates (verify against the live graph at selection time): Subnet Trainer page, Ports page, Exam Review filters, Onboarding/Home Tour, Diagnostic Pass Plan, SR queue UI. **Rule: no wave without a visual baseline for its page.** The endgame (slim core: state, router, storage, AI api, shared helpers, constants) closes #138.

## Definition of done (per wave / overall)

- Per wave: MOVE set documented in the commit; UAT ALL PASS; visual baselines byte-stable; e2e green; ratchet LOWER than before the wave; prod live-verified per CLAUDE.md post-deploy section; groundskeeper scan clean next Monday (no new dead functions, FACTS fresh).
- Overall (#138 closes): app.js under ~8K lines (slim core), every page a feature module, ratchet baseline tracking the shrink, zero UAT/e2e/visual regressions across the whole run.

## Risks

| Risk | Mitigation |
|---|---|
| Missed `window` re-exposure → onclick silently dead | P1 requires `grep index.html` per fn; live-verify clicks every control on the page |
| Non-mechanical "improvement" sneaks into a move | Protocol forbids it; visual-baseline byte-stability is the detector; reviewer rejects mixed commits |
| Indentation breaks UAT concat regexes | 2-space rule in Global Constraints; UAT run is the immediate detector (fails loud, pre-commit) |
| Load-order/timing (module referencing a helper before app.js defines it) | Modules only run on `enter()` after full app.js parse; helpers accessed at call time via window/scope |
| Graph stale/mislabeled at inventory time | P1 starts from the live graph post-commit (auto-rebuilt); `graphq stale` check in the wave-selection step |
| SW serves stale app.js alongside new module | `bump-version.js` every ship (cache-name bump) — already mandatory |
