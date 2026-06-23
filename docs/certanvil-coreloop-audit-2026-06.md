# CertAnvil — Core-Loop Mobile Audit (Lane 2)

**Date:** 2026-06-05 · **Base:** feat/mobile-polish @ v7.19.1 · **Engine:** WebKit (iOS Safari 17.5 UA), service workers blocked
**Devices:** iPhone SE (375×667) + iPhone 14 (390×852) · **Themes:** dark + light
**Scope:** the quiz / exam / PBQ question UI — the surface the original audit could **not** reach (BYOK-gated).

## Method (no key required)

`startQuiz()`/`startExam()` validate only the key *format* (`validateApiKey`), then `try` a fetch and fall back to `getCachedQuestions` on failure (app.js:5805). So: fake-format key in `#api-key` + `api.anthropic.com` blocked at the network layer → fetch throws → `window.getCachedQuestions` overridden to return synthetic worst-case content. PBQs render real from the local bank (`injectPBQs` / `ACL_PBQ_BANK`). Deterministic, zero key, zero API cost. Harness: `.audit/coreloop.mjs` (+ `coreloop-cli.mjs`). 24 quiz/exam records + CLI-sim probe.

---

## FINDING 1 — Quiz/exam topbar overflows horizontally  *(P1-class, real bug)*

`div.quiz-topbar` content is **346px** wide but its gutter-clamped container is only **301px (SE) / 315px (iPhone 14)**, pushing the document by **+27px (SE) / +12px (iPhone 14)**.

- **Content-independent** — it's the *chrome* (flag button + prev/next arrows + per-question progress-dot row + countdown), not the question. Real AI questions overflow identically.
- **Scales with question count** — measured with only 3 questions (3 dots). A real 10-question quiz / 90-question exam packs far more `.qpd-cell` dots into that row → worse.
- Reproduces on **every** quiz + exam card, both themes. The ACL PBQ surface does **not** overflow (different layout).
- **Why it shipped unverified:** the P0 "kill horizontal overflow" fix (422cadb) covered the dashboards/setup/analytics; the quiz/exam card was unreachable in the audit, so this was never checked.

Evidence: `overflowEls → div.quiz-topbar scrollW=346 clientW=301/315`; shots `quiz-mcq-long__*`, `exam-card__*`.

## FINDING 2 — Sub-44px tap targets across the quiz/exam controls  *(P1-class)*

The P1 "all taps ≥44px" fix (eef0bb0) did **not** reach the in-card question controls (unreachable in the audit). Measured (W×H px):

| Control | Size | Issue |
|---|---|---|
| `#quiz-flag-btn` (Flag question) | 56×**28** | height 28 |
| `#quiz-prev-btn` / `#quiz-next-arrow-btn` (nav arrows) | **33×33** | both axes |
| `.qpd-cell` (progress dots → jump-to-question) | **24×31** | tappable but tiny |
| `.explain-btn` (Explain Further) | 127×**35** | height 35 |
| `.report-btn` (Report Issue) | 111×**35** | height 35 |
| `.cli-cmd-btn` (CLI-sim "Run command: …") | var×**30** | height 30 |
| `#topbar-countdown` | **33**×48 | width 33 (appears `is-hidden` in quiz mode) |

7–9 offenders per quiz/exam card; 11 on the CLI-sim card. All reproduce on both devices + themes.

## FINDING 3 — No iOS input-zoom risk in the question flow  *(✅ pass)*

The CLI-sim PBQ is a **click-to-run command-button** interface (`.cli-cmd-btn`), **not** a typed terminal — there is **no text input anywhere** in quiz/exam/PBQ. The only text input is the setup `#api-key` field, which is 16px-protected. `zoomRisk=0` on every record. The P0 input-zoom fix holds.
*(Note: the Explore pass's "CLI textarea" claim was wrong — corrected here.)*

## FINDING 4 — Question content renders clean  *(✅ pass)*

Worst-case **525-char stem + ~150-char options wrap correctly** (no content-level overflow), readable at 375px, both themes. MCQ / multi-select / answered+explanation states + exam card + flag-for-review + ACL PBQ all render with **zero page errors**. ACL reorder arrows (`.acl-arrow-btn`) are adequately sized (not flagged).

---

## Caveats
- **Synthetic MCQ content** — real-AI-generated quirks (unusual markdown/length) untested. Closing that needs the fresh-throwaway-key pass (Lane 2 "real content" option).
- A **"Generating…" loading overlay** bleeds at the top of screenshots — a harness side-effect of the failed-fetch→cache path (real flow hides it on success). Not a product bug.

## Resolution — RESOLVED in v7.19.2 ✅

Built + verified on `feat/mobile-polish` (`a70d010` fix · `1c4111b` release). One touch/width-gated section in `dg-system.css` (same mechanism as eef0bb0; desktop pixel-identical):

- **Finding 1:** `@media (max-width:680px)` — `.quiz-topbar`/`.exam-topbar` `flex-wrap:wrap`; `.quiz-prog-dots` → `flex:1 1 100%; min-width:0` (dots drop to their own full-width line and wrap there); `.exam-nav-row` wraps too.
- **Finding 2:** `@media (hover:none) and (pointer:coarse)` — flag, prev/next arrows, per-question dots (`flex:0 0 44px` — the base `.qpd-cell{flex:0 0 18px}` flex-basis was pinning width under a plain `width` override), Explain/Report, CLI command buttons, Back, End-Exam, qnav toggle, exam-shortfall close → 44px. Dots become a tappable question-nav grid.

**Verification (WebKit harness, no key):** 24/24 records `ovf=no · tap<44=0 · zoom=0` across quiz card (long stem + answered + multi-select) + exam card (+ flag) + ACL PBQ, on SE/iPhone 14 × dark/light. UAT 4005/4005.

> Two controls surfaced *during* the fix loop — `.back-btn` (80×33) and the exam `.exam-nav-row` overflow + `#qnav-toggle` (331×41) — were caught and fixed in the same pass.

Artifacts: `.audit/coreloop.mjs`, `.audit/coreloop-cli.mjs`, `.audit/measurements-coreloop.json`, `.audit/shots-coreloop/*.png` (untracked scratch).
