# app.js Big-Chunks Extraction (Waves 4–9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the six remaining big chunks from app.js (~17,634 lines → ~9–10K) into feature modules, one shippable wave at a time.

**Architecture:** Strangler-fig mechanical extraction, per approved spec `docs/superpowers/specs/2026-07-18-appjs-big-chunks-extraction-design.md`. Waves 4–6 are lazy-loaded modules (loader-stub or showPage-guard); waves 7–9 are eager modules (`<script defer>`, SW-precached). Zero rewrites — functions move byte-identical.

**Tech Stack:** Vanilla JS IIFE modules, graphify code map (`scripts/graphq.js`), UAT concat harness (`tests/uat/_context.js`), Playwright visual regression, line-count ratchet (`tests/appjs-baseline.json`).

## Global Constraints

- **Model routing:** Fable runs P1 (graph inventory) in the orchestrating session; Sonnet executes P2–P6 via a dispatched subagent (per mem #68 conditional routing — active for this plan).
- **Zero rewrite:** moved function bodies are byte-identical. No logic changes, no renames, no comment edits.
- **2-space indent inside IIFE:** `tests/uat/_context.js` concatenates app.js + features/*.js and dedents exactly 2 leading spaces. Function declarations at column 3.
- **MOVE rule:** a function moves only if ALL its callers are inside the wave's set, are HTML-only (onclick/data-action), or are cross-module calls already routed via `window.*` / `typeof` guards. When in doubt, it STAYS.
- **Shared-helper policy (spec §Mechanisms):** any helper with callers in ≥2 of {app.js core, quiz engine, exam mode} stays in app.js. Wave 6's P1 produces the authoritative quiz/exam shared list; Wave 8 inherits it.
- **Window-expose:** every function referenced by HTML `onclick`/`data-action` strings (event-actions.js dispatches `window[name]`) or called from another module must be assigned to `window` in the module's expose block.
- **Ratchet:** after each wave, set `tests/appjs-baseline.json` `lines` to the new `wc -l app.js` count; `allowance` stays 150.
- **Version bumps:** only via `node scripts/bump-version.js <ver> "<desc>"`. Never hand-edit package.json/CHANGELOG/sw.js CACHE_NAME.
- **Node:** prefix every node/npm command with `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"`.
- **Verification per wave:** `node tests/tech-debt.js` (0 breaches) + `npm run test:uat` (all pass, currently 4,824) + `npm run test:visual` (all pass, currently 8).
- **One wave = one commit to main (fast lane)**, pushed, CI watched to green. Eager waves (7–9) additionally follow the SW callout + offline smoke rules below.
- **Line numbers drift:** all line refs below are as of commit 7c37ff0 / dfb7f0d. P1 MUST re-derive from the live graph (`node scripts/graphq.js inspect/callers/community`) — never trust this doc's line numbers at execution time. Run `node scripts/graphq.js stale` first; rebuild structure if stale.

## Module patterns

### Pattern L1 — lazy, page-navigation trigger (waves 1–3 style; not used in 4–9 unless P1 finds a page boundary)

`showPage()` guard:
```js
  // #138 wave N: lazy-load X feature if not yet available.
  if (name === 'X' && !window.entryFn) {
    _loadFeature('X').then(function (m) { m.enter(); });
    return;
  }
```

### Pattern L2 — lazy, function-call trigger (waves 4–6)

app.js keeps a thin **loader stub** where the extracted function used to be. The module window-exposes the real function, overwriting the stub, so only the first call pays the load:

```js
// #138 wave N: loader stub — features/X.js overwrites window.startY on load.
function startY(opts) {
  _loadFeature('X').then(function (m) { m.startY(opts); });
}
```

Module end:
```js
  // ── window re-exposure ──
  window.startY = startY;   // overwrites the app.js loader stub

  // ── feature registry ──
  window._certanvilFeatures = window._certanvilFeatures || {};
  window._certanvilFeatures['X'] = { startY: startY };
```

Stub rules: forward ALL arguments; keep the stub's name identical to the real function; `data-action` dispatch (`window[name]`) and HTML onclick both hit the stub first time, the real function afterwards. Do NOT add the module to index.html.

### Pattern E — eager (waves 7–9)

Same IIFE + expose block. No stub, no guard. Wire with:
1. `<script defer src="features/X.js"></script>` in index.html **after the app.js script tag** (defer executes in document order; everything runs before `DOMContentLoaded` boot).
2. Add `'./features/X.js',` to `SHELL_ASSETS` in sw.js (boot-critical offline).
3. P3 hazard check: any **top-level statements** (non-function code inside the moved region) that call app.js functions at execute time must stay in app.js or move into the boot path — flag every top-level side effect during the move.

## Per-wave protocol (P1–P6)

Every wave task below follows this sequence; wave-specific details are in the task.

- **P1 (Fable, this session):** `graphq stale` → `inspect`/`callers`/`community` on candidates → produce the MOVE/STAY/window-expose table + state vars list + trigger inventory (grep index.html + event-actions dispatch for onclick/data-action names).
- **P2 (Sonnet):** scaffold `features/<name>.js` IIFE shell.
- **P3 (Sonnet):** move each MOVE function byte-identical at 2-space indent; delete from app.js; move listed `let` state vars into the IIFE.
- **P4 (Sonnet):** wire per the wave's pattern (L2 stubs or E steps 1–2).
- **P5 (Sonnet):** run the three suites; fix indent/expose issues only — never logic.
- **P6 (Sonnet):** ratchet, `bump-version.js`, commit (template below), report. Fable pushes and watches CI.

Commit template:
```
chore(#138): extract <chunk> to features/<name>.js (wave N)

Mechanical move of <K> functions + <S> state vars from app.js into a
<lazy-loaded|eagerly-loaded> features/<name>.js IIFE. No logic changes —
zero-rewrite strangler-fig extraction.
[Eager waves only:] Adds features/<name>.js to sw.js SHELL_ASSETS (additive
precache line — founder-approved fast-lane exception, see spec 2026-07-18).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

---

### Task 1 (Wave 4): Flagship drills → `features/flagship-drills.js` — lazy L2, v7.70.0

**Files:**
- Create: `features/flagship-drills.js`
- Modify: `app.js` (delete moved fns; add 2 loader stubs), `tests/appjs-baseline.json`
- Test: existing suites (`tests/tech-debt.js`, `npm run test:uat`, `npm run test:visual`)

**Interfaces:**
- Consumes: `_loadFeature(name)` (app.js:~L2001), shared app.js utils the drills call (stay put — P1 lists them as STAY).
- Produces: `window.startRewordGauntlet()`, `window.startWhyNot()` (real fns overwrite stubs) + every drill-internal fn referenced by `data-action`/onclick, window-exposed. Registry: `window._certanvilFeatures['flagship-drills']`.

- [ ] **P1:** Inventory Reword Gauntlet (region ~L6340–6954, entry `startRewordGauntlet` L6581, state `_gauntletRun`) and Why-Not (~L6954–7432, entry `startWhyNot` L6968, state `_wnSession`). Grep index.html + generated-HTML strings for every `data-action`/onclick name in both regions (`grep -n "data-action=\"_gauntlet\|data-action=\"_wn\|startRewordGauntlet\|startWhyNot" index.html app.js`). Decide one-module-vs-two by shared-helper overlap between the two drills (default: ONE module `flagship-drills` — they ship together and share the drill scaffold idiom). Output the MOVE/STAY/expose table.
- [ ] **P2–P4:** Dispatch Sonnet: scaffold, move, delete, add the two L2 loader stubs in app.js where the originals lived:

```js
// #138 wave 4: loader stub — features/flagship-drills.js overwrites on load.
function startRewordGauntlet() {
  _loadFeature('flagship-drills').then(function (m) { m.startRewordGauntlet(); });
}
// #138 wave 4: loader stub — features/flagship-drills.js overwrites on load.
function startWhyNot() {
  _loadFeature('flagship-drills').then(function (m) { m.startWhyNot(); });
}
```

- [ ] **P5:** Run all three suites. Expected: tech-debt 0 breaches; UAT all pass; visual 8/8.
- [ ] **P6:** Ratchet to new `wc -l app.js`; `node scripts/bump-version.js 7.70.0 "chore(#138): extract flagship drills to features/flagship-drills.js (wave 4)"`; commit per template; push; `gh run watch` both workflows to green.

### Task 2 (Wave 5): Diagnostic + Pass Plan → `features/diagnostic.js` — lazy L2, v7.71.0

**Files:**
- Create: `features/diagnostic.js`
- Modify: `app.js` (delete moved fns; add 1 loader stub), `tests/appjs-baseline.json`
- Test: existing suites

**Interfaces:**
- Consumes: `_loadFeature`; quiz-render/fetch helpers that P1 marks STAY (diagnostic runs quiz questions — expect a meaningful STAY list).
- Produces: `window.startDiagnostic(opts)` — **signature must forward `opts`**: callers include `startDiagnostic({mock:true})` (onboarding), `startDiagnostic({onboarding})`, plain `startDiagnostic()` from HTML onclick (index.html:677), recommendation-card `ctaFn` strings, URL-action handler (app.js ~L17549, typeof-guarded), and `features/settings.js:81`. Registry: `window._certanvilFeatures['diagnostic']`.

- [ ] **P1:** Inventory region ~L4419–5749 from entry `startDiagnostic` (L4464). Note: `renderPassPlanSection` + its 4 helpers already moved to settings.js in wave 3 — P1 maps what REMAINS. Check cross-module edges: settings.js calls `startDiagnostic()` (works via window stub); diagnostic code may call readiness/analytics fns (typeof-guard or STAY). Special attention: `_renderPassPlanFreeHtml` etc. live in settings.js now — if remaining diagnostic code calls them, route via `typeof window.X === 'function'` guards (they're window-exposed) and record in the table.
- [ ] **P2–P4:** Dispatch Sonnet. Loader stub (async original — stub stays sync, callers never await it):

```js
// #138 wave 5: loader stub — features/diagnostic.js overwrites on load.
function startDiagnostic(opts) {
  _loadFeature('diagnostic').then(function (m) { m.startDiagnostic(opts); });
}
```

- [ ] **P5:** Three suites green. Additionally smoke the `?onb=1` first-run flow reference: `grep -n "startDiagnostic" app.js features/*.js` — every remaining caller must resolve (stub or window).
- [ ] **P6:** Ratchet; `node scripts/bump-version.js 7.71.0 "chore(#138): extract diagnostic + pass plan to features/diagnostic.js (wave 5)"`; commit; push; CI green.

### Task 3 (Wave 6): Exam mode → `features/exam.js` — lazy L2, v7.72.0

**Files:**
- Create: `features/exam.js`
- Modify: `app.js` (delete moved fns; add loader stub(s)), `tests/appjs-baseline.json`
- Test: existing suites

**Interfaces:**
- Consumes: question-fetch + render helpers shared with the quiz engine — these STAY in app.js per the shared-helper policy.
- Produces: `window.startExam()` (+ any exam-nav fns hit by onclick/data-action: navigator, modal, submit). Registry: `window._certanvilFeatures['exam']`. **Also produces the authoritative quiz↔exam shared-helper list** — a P1 artifact Wave 8 (Task 5) consumes; save it as a table in this plan's wave-6 P1 output (append below the task when run).
- [ ] **P1 (the hard one — budget extra time):** Inventory regions ~L7926–8105 (START EXAM SIMULATION) and ~L9568–9983 (EXAM TIMER / RENDER / NAVIGATOR / MODAL / SUBMIT & RESULTS). For EVERY candidate, `graphq callers` — anything also called by the regular-quiz path (fetch batching L8106+, question-type helpers L8528+, MCQ answer selection L9112+) is SHARED → STAYS. Expect the exam module to be render/timer/submit shell around shared quiz plumbing. Also inventory the review screen's exam edges (L10252–10421 review STAYS this wave — it's a medium chunk, out of scope). Wake Lock code (L9570 comment) moves with the timer if exam-only.
- [ ] **P2–P4:** Dispatch Sonnet. Stub:

```js
// #138 wave 6: loader stub — features/exam.js overwrites on load.
function startExam() {
  _loadFeature('exam').then(function (m) { m.startExam(); });
}
```

- [ ] **P5:** Three suites green. Extra check: `grep -n "examTimer" app.js features/exam.js` — the `examTimer` interval handle is cleared in `goSetup()` (app.js); if `examTimer` state moves into the module, `goSetup` needs a typeof-guarded window accessor or the state STAYS in app.js. P1 decides; P5 verifies no orphan references.
- [ ] **P6:** Ratchet; `node scripts/bump-version.js 7.72.0 "chore(#138): extract exam mode to features/exam.js (wave 6)"`; commit; push; CI green. **Checkpoint: reassess with founder before entering eager territory (Wave 7).**

### Task 4 (Wave 7): Readiness → `features/readiness.js` — EAGER, v7.73.0

**Files:**
- Create: `features/readiness.js`
- Modify: `app.js`, `index.html` (script tag), `sw.js` (SHELL_ASSETS line), `CLAUDE.md` or `ENVIRONMENT_STRATEGY.md` (lane-exception record), `tests/appjs-baseline.json`
- Test: existing suites + offline smoke

**Interfaces:**
- Consumes: history/streak/storage utils in app.js (STAY).
- Produces: `window.renderReadinessCard()` + readiness-score fns other pages call (`getReadinessScore` etc. — P1 lists exact names; ALL window-exposed since boot code + analytics module call them). Registry: `window._certanvilFeatures['readiness']`.

- [ ] **P1:** Inventory ~L10482–11406 (EXAM READINESS SCORE + card). Callers span boot (home render), quiz results, settings health card (`renderReadinessCard` was already typeof-guarded in importData wave-3 fixture) — eager loading makes all these safe at call-time, but P1 must still list every cross-file caller for the expose block. **Top-level side-effect scan is mandatory (Pattern E hazard check).**
- [ ] **P2–P4:** Dispatch Sonnet. Wire per Pattern E:
  1. index.html, after the existing feature script tags: `<script defer src="features/readiness.js"></script>` — MUST come after the `app.js` script tag.
  2. sw.js `SHELL_ASSETS`, after `'./diagnostic-claim.js'`:

```js
  // #138 wave 7: eager feature modules are boot-critical — precached so an
  // offline reload can't hit a FIFO-evicted runtime entry and break boot.
  './features/readiness.js'
```

  3. Lane-exception record — add to the lane/environment table in CLAUDE.md (or ENVIRONMENT_STRATEGY.md if the table lives there): `Additive SHELL_ASSETS line for #138 eager feature modules = fast-lane-eligible (founder-approved, spec 2026-07-18-appjs-big-chunks-extraction-design.md).`
- [ ] **P5:** Three suites green. **Offline smoke (new):** `preview_start` the app → DevTools/SW: confirm the new SW version installed cleanly (a typo'd SHELL_ASSETS path silently rejects the whole `cache.addAll`) → go offline → hard reload → home boots and readiness card renders.
- [ ] **P6:** Ratchet; `node scripts/bump-version.js 7.73.0 "chore(#138): extract readiness to features/readiness.js (wave 7, eager)"`; commit (template + SW callout line); push; CI green; post-deploy repeat the offline smoke against prod.

### Task 5 (Wave 8): Quiz engine → `features/quiz-engine.js` — EAGER, v7.74.0

**Files:**
- Create: `features/quiz-engine.js`
- Modify: `app.js`, `index.html`, `sw.js` (SHELL_ASSETS), `tests/appjs-baseline.json`
- Test: existing suites + offline smoke

**Interfaces:**
- Consumes: **Wave 6's shared-helper list** — those functions stay in app.js and are called bare (same document, defer order guarantees definition before use).
- Produces: `window.startQuiz()` + every quiz-flow fn referenced by onclick/data-action (answer buttons, results actions, retry, revisit nav) — P1 lists them. Registry: `window._certanvilFeatures['quiz-engine']`.

- [ ] **P1:** Inventory the quiz engine remainder: START REGULAR QUIZ (~L7505), revisit nav (~L7694), loading progress (~L7814), REGULAR QUIZ RENDER (~L8559), ANSWER SELECTION (~L9112), RESULTS (~L9274), RETRY (~L9515) — MINUS everything Wave 6 classified as shared (fetch batching, question-type helpers stay). Re-run callers on each shared-list item: a helper shared ONLY by quiz+exam (zero core callers) MAY move here if exam.js reaches it via window — decide per helper, default STAY.
- [ ] **P2–P4:** Dispatch Sonnet. Pattern E wiring (script tag after readiness.js; SHELL_ASSETS line `'./features/quiz-engine.js'`). No loader stub — eager.
- [ ] **P5:** Three suites green + offline smoke + one manual quiz run in preview (start a mock/small quiz, answer, see results) since this is the revenue path.
- [ ] **P6:** Ratchet; `node scripts/bump-version.js 7.74.0 "chore(#138): extract quiz engine to features/quiz-engine.js (wave 8, eager)"`; commit + SW callout; push; CI green; prod smoke.

### Task 6 (Wave 9): Home/setup → `features/home.js` — EAGER, v7.75.0

**Files:**
- Create: `features/home.js`
- Modify: `app.js`, `index.html`, `sw.js` (SHELL_ASSETS), `tests/appjs-baseline.json`
- Test: existing suites + offline smoke

**Interfaces:**
- Consumes: everything already extracted (readiness, quiz-engine window fns) + core nav/storage (STAY).
- Produces: window-exposed home renderers (`renderSetupDomainGrid`, hero renderers, front-page feature fns — P1 lists exact names; many are onclick-dispatched). Registry: `window._certanvilFeatures['home']`.

- [ ] **P1 (budget EXTRA time — fuzziest boundary, per spec review):** Inventory FRONT PAGE FEATURES (~L11406–11982), EDITORIAL REDESIGN sidebar/hero/domain-grid (~L15905+), editorial hero + topbar (~L16215+). The boot path itself (BOOT ~L1903, NAVIGATION ~L2467) STAYS — home.js is the render layer, not the bootstrapper. Top-level side-effect scan is CRITICAL here: this region likely has DOMContentLoaded wiring that must stay in app.js or be re-hung inside the module carefully (defer order still guarantees module functions exist before DOMContentLoaded fires).
- [ ] **P2–P4:** Dispatch Sonnet. Pattern E wiring (script tag after quiz-engine.js; SHELL_ASSETS line `'./features/home.js'`).
- [ ] **P5:** Three suites green + offline smoke + manual boot check (fresh reload renders hero, domain grid, sidebar, readiness card).
- [ ] **P6:** Ratchet; `node scripts/bump-version.js 7.75.0 "chore(#138): extract home/setup to features/home.js (wave 9, eager)"`; commit + SW callout; push; CI green; prod smoke. **Campaign complete — write superseding resume memory; reassess medium chunks with founder.**

---

## Self-review notes

- Spec coverage: all six waves present; eager mechanism (script tag + SHELL_ASSETS + hazard scan), shared-helper policy (Wave 6 produces / Wave 8 consumes), lane-exception record (Wave 7 step), offline smoke incl. cache.addAll install check (Waves 7–9), Wave-9 extra P1 budget, checkpoint after Wave 6 — all mapped.
- No placeholders: wave-specific MOVE lists are deliberately P1 outputs, not plan placeholders — line numbers drift and the spec mandates live re-derivation (this is the established phase-1 protocol that shipped waves 1–3).
- Type consistency: loader stubs forward args; `startDiagnostic(opts)` signature preserved end-to-end; registry keys match module filenames throughout.
