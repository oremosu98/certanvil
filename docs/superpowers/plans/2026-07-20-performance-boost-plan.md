# Performance Boost Plan — pre-Wave-5 (2026-07-20)

**Goal:** Lighthouse performance ≥ 90 on prod before go-live. Currently 65.
**Status:** baseline measured (v7.80.1, 2026-07-20). Phases P0–P1 should land
before the Wave 5 build; P2–P3 can interleave after.

<!-- graphify:touches fetchQuestions _fetchQuestionsBatch _claudeFetch -->

## 1. Baseline (measured, not guessed)

| Metric | Prod (Brotli/CDN) | Local uncompressed (≈CI) | CI budget |
|---|---|---|---|
| Performance score | **65** | 56 | warn < 85 |
| First Contentful Paint | 4.0 s | 11.3 s | warn > 2.0 s |
| Largest Contentful Paint | 5.8 s | 19.7 s | warn > 3.0 s |
| Speed Index | 6.5 s | 11.3 s | — |
| Total Blocking Time | **60 ms** | 10 ms | warn > 300 ms |
| CLS | 0 | 0 | warn > 0.1 |

Key transfers (prod, wire/raw): certs/netplus.js 135/428 KB · styles.css
73/390 KB · app.js 70/218 KB · Fraunces woff2 66 KB · dg-system.css 57/367 KB
· supabase-umd 50/193 KB · document 34/128 KB.

## 2. Diagnosis — ranked by evidence

**The score is a critical-path-bytes problem, NOT a JS-execution problem.**
TBT is 60 ms and bootup 0.2 s: the app.js monolith is a maintainability issue
(#138), not the Lighthouse killer. Do not expect module-split work to move
this score. What's actually killing FCP/LCP:

1. **Parser-blocking cert pack** — index.html:161 `document.write`s the active
   cert `<script>` mid-`<head>` (v4.99.30, deliberate: app.js reads
   `CERT_PACK` at top level, so the pack must execute before the deferred
   app.js). Everything below it — including all body content — waits for a
   135 KB download + execute. Invisible to the preload scanner (URL is
   runtime-generated), so the download starts late too.
2. **Google Fonts external chain** — render-blocking css2 stylesheet (794 ms
   measured) + chained woff2 from fonts.gstatic (66 KB). Two extra origins on
   the critical path.
3. **Render-blocking CSS** — dg-system.css 633 ms measured; styles.css +
   dg-depurple.css also block. ~1.2 MB raw CSS for a first paint that needs
   one page's shell. Lighthouse reports ~140 KB provably unused on load.
4. **LCP element is topbar text** (sign-in pill) — no hero image involved;
   LCP is late purely because render start is late. Fix render start and LCP
   follows FCP down.

**Separate axis — "quiz takes forever to generate":** that is Haiku API
latency (15–60 s for a 10-Q batch) + the 3-attempt retry ladder, not page
perf. The infinite-spinner case was a crash, fixed in v7.80.1. Perceived-
latency fixes are P3 — do not conflate them with the Lighthouse work.

## 3. Phases

### P0 — Critical-path unblocking (fast lane, ~½ day, est. +10–15 pts)
- **P0a: un-block the cert pack.** In the inline cert-detect script, emit a
  `<link rel="preload" as="script" href="certs/<cert>.js">` via document.write
  FIRST (starts the download in parallel with CSS), and move the
  `document.write('<script src="certs/…">')` from `<head>` to just before
  `</body>`. Parser-inserted sync scripts at end-of-body still execute before
  deferred scripts (app.js ordering guarantee preserved — verify with an
  explicit UAT assertion + live-verify), but body content parses/paints
  without waiting for the pack.
- **P0b: self-host Fraunces.** Download the 3 used weights as woff2 into
  `fonts/`, replace the css2 `<link>` with an inline `@font-face` block
  (`font-display: swap`) + `<link rel="preload" as="font">`. Kills both
  external origins from the critical path (~800 ms) and is a privacy win.
- **P0c: audit `<head>` order** so critical CSS → preloads → everything else.

### P1 — CSS diet (fast lane, 1–2 days, est. +8–12 pts)
- **P1a: demote non-shell CSS to non-blocking.** styles.css alone can paint
  the shell; load dg-system.css + dg-depurple.css with the
  `media="print" onload="this.media='all'"` swap (or split a small
  `dg-critical.css`). Must pass the 4-stage visual pass + live-verify on
  first-paint pages (setup, home) in both themes — dg-system carries the
  forged-bronze reskins, so verify no flash-of-unstyle on slow 3G throttle.
- **P1b: purge provably-unused CSS** (~140 KB reported). Use Chrome coverage
  on the top 5 pages + grep for dynamic class construction before deleting
  anything; ship behind the visual-regression suite. Slow, do it in slices.

### P2 — Payload diet (needs founder decisions)
- **P2a: deploy-time minification.** Keep the no-build-step dev loop; add a
  Vercel build command that minifies JS/CSS at deploy only (esbuild --minify,
  no bundling, filenames unchanged). Raw 422 KB app.js → ~180 KB → ~45 KB
  wire. DECISION NEEDED: accepts a build artifact ≠ repo source (breaks the
  "view-source = source" property; sourcemaps mitigate).
- **P2b: audit eager feature/seed scripts.** 20+ deferred scripts load on
  boot (analytics.js 100 KB raw, sim-lab seeds, decision-lab seeds ×4).
  Defer ≠ free: they all download on first visit. Lazy-load seeds on first
  drill entry (the reports.js lazy pattern already exists). Low urgency —
  defers don't block FCP — but trims the CI total-size budget breach.

### P3 — Generation-latency UX (the "feels slow" axis, after Wave 5 if needed)
- Progressive quiz start: render as soon as the first ~3 questions parse from
  a streaming response instead of waiting for the full batch + validator.
- Honest progress: per-attempt status on the loading screen ("attempt 2 of 3…")
  so the retry ladder never looks like a hang again (today it is silent).
- Prefetch: warm the next batch during question 1–2 of the current quiz.

## 4. Verification loop
- Re-run the same two Lighthouse commands after each phase; append scores to
  the table above (keep history inline).
- CI gap to close: the Lighthouse job runs on PRs only — fast-lane pushes to
  main get zero perf signal. Add a `workflow_dispatch` + weekly scheduled run
  against prod, and tighten `minScore` as phases land (0.85 → 0.90).
- Success gate for go-live: prod ≥ 90 performance, FCP < 1.5 s, LCP < 2.5 s.

## Related
[[2026-07-17-appjs-incremental-extraction]] · [[CLAUDE]] · [[conventions]]
