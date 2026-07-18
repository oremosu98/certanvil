# app.js Big-Chunks Extraction — Design (#138 phase 2)

**Date:** 2026-07-18
**Status:** Approved by founder (Approach A — risk-ascending ladder)
**Predecessor:** `docs/superpowers/plans/2026-07-17-appjs-incremental-extraction.md` (waves 1–3, all shipped: progress f531df5, analytics 53fb8b2, settings 7c37ff0 — app.js 22,059 → 17,634)

## Goal

Extract the remaining big chunks from app.js (17,634 lines) into feature modules, continuing the proven strangler-fig protocol. Target landing: **app.js ≈ 9–10K lines** (boot, nav, storage, shared utils, medium features).

Per-chunk treatment ("both" strategy, founder-approved):
- **Lazy modules** — chunks reached by navigation/user action get the existing `showPage()` / entry-point lazy-load guard. Load-performance win.
- **Eager modules** — chunks needed at boot or on the primary quiz action get a plain `<script defer>` with no lazy guard. No load-performance change; pure file-size/maintainability win.

Scope: **big chunks only.** Medium chunks (AI teacher/deep-dive, review screen, CLI sim, guided lab, ACL builder, milestones/confetti, ~2–3K lines) are explicitly out of scope; re-assess after Wave 9.

## Wave ladder (risk-ascending)

| Wave | Chunk | ~Lines | Mode | Entry point(s) | Version | Risk notes |
|---|---|---|---|---|---|---|
| 4 | Flagship drills: Reword Gauntlet (L6340–6954) + Why-Not (L6954–7432) | ~1,100 | Lazy | drill-page start functions | v7.70.0 | Self-contained drill pages, own state. Textbook moves. Two modules or one `features/flagship-drills.js` — P1 decides by shared-helper overlap. |
| 5 | Baseline Diagnostic + Pass Plan builder (L4419–5749) | ~1,330 | Lazy | `startDiagnostic` | v7.71.0 | One entry point, clear boundary. Note: `renderPassPlanSection` already moved to settings.js in wave 3 — P1 must map what remains and its callers. |
| 6 | Exam mode: start/timer/render/navigator/modal/submit/results (L7926–8105, L9568–9983) | ~1,100 | Lazy | `startExam` (+ exam nav) | v7.72.0 | First hard one. Shares question-fetch + render helpers with quiz engine. **Shared-helper policy applies (below).** |
| 7 | Exam Readiness score + card (L10482–11406) | ~920 | **Eager** | rendered at boot (home) | v7.73.0 | First eager module. Adds file to sw.js SHELL_ASSETS (see SW policy). |
| 8 | Quiz engine: start → fetch → render → answer → results → retry (L7505–9515 remainder) | ~2,000 | **Eager** | `startQuiz` | v7.74.0 | Biggest chunk, revenue-critical path. Done after Wave 6 exposed the quiz/exam helper seams. |
| 9 | Home/setup: front-page features, editorial hero, domain grid, sidebar (L11406–11982, L15905+) | ~1,100 | **Eager** | boot render | v7.75.0 | Most boot-entangled; goes last so its dependency surface is already shrunken. |

Line refs are as of commit 7c37ff0 and WILL DRIFT as waves land — every wave's P1 re-derives locations from the live graphify map (`node scripts/graphq.js inspect/callers/community`). Never trust the table's line numbers at execution time.

## Mechanisms

### Lazy module (unchanged from waves 1–3)
- IIFE: `(function () { 'use strict'; …2-space-indented functions…; window-expose block; window._certanvilFeatures['name'] = { enter: fn }; })();`
- `showPage()` guard: `if (name === 'X' && !window.entryFn) { _loadFeature('X').then(m => m.enter()); return; }` — or, for non-page features (diagnostic, drills), a guard inside the triggering function.
- `<script defer src="features/X.js">` NOT added to index.html (loaded on demand by `_loadFeature`).
- Runtime-cached by SW (FIFO); not precached.

### Eager module (new in this phase)
- Same IIFE + window-expose pattern. Registers on `_certanvilFeatures` for uniformity but needs no `enter()` semantics beyond convention.
- Loaded via `<script defer src="features/X.js"></script>` in index.html **after app.js** (defer preserves document order; all defer scripts execute before `DOMContentLoaded`, so app.js boot code can call module functions freely — call-time resolution).
- **No lazy guard** in showPage().
- **MUST be added to `SHELL_ASSETS` in sw.js** — eager modules are boot-critical; an offline user with a FIFO-evicted runtime cache entry would get a broken boot otherwise.

### Shared-helper policy (quiz ↔ exam, and generally)
A helper with callers in two or more of {app.js core, quiz engine, exam mode} **stays in app.js** (shared kernel). No duplication, no cross-module imports. Wave 6's P1 produces the authoritative list of quiz/exam-shared helpers (fetch-questions batching layer, question-type helpers, render primitives); Wave 8 inherits that list. When Wave 8 later moves the quiz engine, a helper shared ONLY by quiz+exam (no core callers) may move to the quiz module IF exam's copy resolves via window-expose — P1 decides per helper, favoring "stays in app.js" whenever in doubt. Simplicity beats purity here.

### Ship lane
- **Lazy waves (4–6): fast lane** (direct commit to main) — same as waves 1–3, no schema/auth/SW changes (version bump's CACHE_NAME rewrite doesn't count).
- **Eager waves (7–9): fast lane with explicit callout** — they DO touch sw.js (one line added to SHELL_ASSETS). This is a mechanical, additive change; treat it as fast-lane-eligible but the commit message must call out the SW precache addition, and post-deploy verification must include an offline-reload smoke check (DevTools → offline → reload → app boots).
- **Lane-exception record (Wave 7 task):** ENVIRONMENT_STRATEGY/CLAUDE.md route sw.js changes to the gated lane. Founder approved this spec's exception; Wave 7 (first eager wave) must record it in the lane table ("additive SHELL_ASSETS line for #138 eager modules = fast-lane-eligible") so future sessions don't flag eager waves as lane violations.

## Per-wave protocol (unchanged)

P1 graph inventory (Fable) → P2 scaffold → P3 mechanical move → P4 wire → P5 verify (tech-debt + 4,824-check UAT + visual regression) → P6 ratchet + version bump + ship (Sonnet executes P2–P6).

Invariants:
- Zero-rewrite byte-identical moves. 2-space indent inside IIFE (UAT concat dedent).
- MOVE rule: a function moves only if ALL callers are inside the wave's set (or HTML-only). Window-expose anything HTML-onclick'd or cross-module-called.
- `tests/appjs-baseline.json` ratchets DOWN each wave (allowance stays 150).
- Version bump only via `node scripts/bump-version.js` — never hand-edit.
- One wave per session/commit; each independently shippable. Stop-and-reassess allowed between any two waves.

## Verification additions for eager waves

1. Existing suites (tech-debt, UAT, visual) — unchanged, must be green.
2. Offline smoke: with SW active, go offline and hard-reload — home page must boot and render the readiness card (Wave 7+). Also verify the new SHELL_ASSETS list installs cleanly (a typo'd path in `cache.addAll` rejects the whole SW install silently on some browsers) — check DevTools → Application → SW installed at the new version.
3. Boot-order check: confirm no top-level (IIFE-body, non-function) code in the moved chunk reads app.js `let`/`const` state at execute time — defer order makes app.js run first, but moved top-level statements that *call* app.js functions at execute time (rather than boot/DOMContentLoaded time) are the one real ordering hazard. P3 must flag any top-level side effects in moved code and keep them in app.js or move them into the boot path.

## Rejected approaches

- **Approach B — biggest-first (quiz engine first):** highest-risk chunk with least accumulated knowledge, on the revenue-critical path. Rejected: risk ordering backwards.
- **Approach C — lazy-only now, eager later as separate decision:** safer but founder explicitly chose per-chunk "both" treatment; eager mechanism is low-risk (defer ordering + SW precache) and doesn't warrant a separate campaign.
- **Big-bang module split (original saas-gated #138 shape):** superseded 2026-07-17 by incremental extraction; formally dead.
- **Duplicating shared quiz/exam helpers into both modules:** rejected in favor of shared-kernel-stays-in-app.js — duplication creates silent divergence, the exact disease this project avoids.
- **Lazy-loading the quiz engine:** rejected — it's the primary user action; a network fetch gate on "Start Quiz" adds latency exactly where it hurts most, and offline-eviction risk lands on the core flow.
