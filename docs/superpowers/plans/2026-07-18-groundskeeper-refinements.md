# Groundskeeper Refinements — Implementation Plan

> **Model split (per [[model-routing]]):** Classification: **Category B** · Planning = Fable · Execution = **Sonnet** (inline `superpowers:executing-plans`, small plan — no SDD needed) · Review = Fable (quick pass on completion) · Reason: multi-file change to test/script surfaces, but every change is exactly specified below.
>
> **Context:** The groundskeeper sweep (commit c284e58, Mondays 08:01) was reviewed by founder + Fable on 2026-07-18. Verdict: keep, but (a) the guard-retirement section is unreviewable noise (36 candidates via a broken version-age metric), (b) it misses the checks with the most value (unpushed commits, debt headroom/trend, GitHub debt visibility), and (c) the founder confirmed Tech-Debt Thursday and the GitHub `tech-debt` board are **never looked at** — so findings must be pushed INTO future chat sessions (rolling memory), not parked in a digest/board. The SKILL.md + workflow.md sides of this change are planning surfaces and were already updated by Fable in the same commit as this plan — implement the scanner/test changes below to match.

**Goal:** Make the Monday sweep's findings (1) low-noise, (2) trend-aware, and (3) impossible to miss — surfaced automatically in future sessions via memory, not dependent on the founder checking anything.

**Files touched (implementation surfaces, Sonnet-only):** `tests/tech-debt.js`, `scripts/groundskeeper-scan.js`. Nothing else.

---

## Task 1 — `tests/tech-debt.js`: add a `--json` report mode

- [ ] When invoked as `node tests/tech-debt.js --json`: print a single JSON object to stdout and **always exit 0** (report mode, not a gate):
  ```json
  { "metrics": [ { "name": "app.js lines", "value": 22060, "limit": 23000, "headroom": 940 }, … ] }
  ```
  One entry per threshold the file already enforces (LOC, global count, long-function count, etc. — derive from the existing checks; do not invent new metrics). Include the long-function *count* as a metric; do not dump the per-function list in JSON.
- [ ] Default (no-flag) behavior must be **byte-identical in logic**: same checks, same thresholds, same exit codes. The `--json` branch must short-circuit before any `process.exit(1)` path.
- [ ] Validation: `node tests/tech-debt.js` (unchanged pass/fail behavior) and `node tests/tech-debt.js --json | node -e "JSON.parse(require('fs').readFileSync(0)); console.log('valid')"`.

## Task 2 — `scripts/groundskeeper-scan.js`: fix §3, add three sections

**2a — Regression-guard retirement (§3): replace the version-age heuristic.**
- [ ] A guard line is a retirement candidate **only if BOTH**:
  1. The banned token it asserts absent has **zero occurrences** in live code surfaces: `app.js`, `index.html`, `styles.css`, `dg-system.css`, `features/**`, `certs/**` (i.e. nothing living still references the old pattern's name — the guard is guarding against a ghost).
  2. The guard line's **git-blame date** is older than 365 days (`git blame -L <n>,<n> --porcelain <file>` → author-time). Never use version-number distance again — the v4→v7 jumps make it meaningless.
- [ ] Keep the existing tombstone exclusion (`docs/conventions/regression-tombstones.md` guards are never candidates).
- [ ] Cap displayed candidates at **5** (stable order: file path, then line number); print `+N more suppressed (cap 5/week)` for the rest. GK-SUMMARY reports the *capped* count, e.g. `⚠️ 5 (of 12) guard-retirement candidates`.

**2b — New section: Unpushed work.**
- [ ] `git rev-list --count origin/main..main`; if >0, list up to 5 via `git log --oneline origin/main..main`. Also flag a dirty tree age if trivially available; otherwise just the unpushed count.
- [ ] Note in output that this uses the **local** `origin/main` ref (no network fetch — the scanner stays offline).
- [ ] GK-SUMMARY: `✅ Nothing unpushed` / `⚠️ N commit(s) on main not pushed to origin`. Rationale to keep in a code comment: git↔prod drift once cost 6 versions (v4.39→v4.43.1); plan commits sat unpushed 2026-07-17→18.

**2c — New section: Debt headroom & trend.**
- [ ] Run `node tests/tech-debt.js --json` (Task 1) via `execSync`; print each metric as `name: value / limit (headroom N)`. Graceful skip with a ⚠️ line if the command fails.
- [ ] **app.js week-over-week trend:** parse current app.js line count from CLAUDE.md's FACTS block; get last week's via `git show $(git rev-list -1 --before="7 days ago" main):CLAUDE.md`, parse the same FACTS row. Print `app.js: 22060 lines (Δ +140 this week)`. Graceful skip if the historical parse fails (FACTS block didn't exist before 2026-06).
- [ ] **Extraction ratchet (future-proof):** if `tests/appjs-baseline.json` exists (lands with #138 Phase 0), print baseline vs current and remaining allowance. Silent skip if absent.
- [ ] GK-SUMMARY: `✅ Debt headroom OK (tightest: <metric> N left)` / `⚠️ <metric> within 10% of limit`.

**2d — New section: GitHub debt (the board nobody looks at).**
- [ ] `gh issue list --label tech-debt --state open --json number,title,updatedAt --limit 100` → print open count + the **3 least-recently-updated** as `#N title (untouched Xd)`. This is the section that drags the invisible board into the digest.
- [ ] Graceful skip (⚠️ "gh unavailable — GitHub debt not scanned") on any failure — the scanner must still work offline/unauthenticated.
- [ ] GK-SUMMARY: `⚠️ N open tech-debt issues (oldest untouched Xd)` / `✅ tech-debt board empty`.

**2e — Housekeeping.**
- [ ] Scanner still **always exits 0**, still read-only, section numbering and `GK-SUMMARY:` prefix format preserved (SKILL.md step 6 lifts those lines verbatim — it has already been updated to expect the new lines).

## Task 3 — Validate & ship

- [ ] Run: `node scripts/groundskeeper-scan.js` (visually sane, exits 0) · `node tests/tech-debt.js` (still passes) · `node tests/tech-debt.js --json` (valid JSON) · `node tests/uat.js` (full gate).
- [ ] Commit (normal hooks, never `--no-verify`): `chore(groundskeeper): low-noise guards, unpushed/headroom/github-debt sections, --json tech-debt mode`. Fast lane — push to main per CLAUDE.md.

## Acceptance criteria

- Scanner run on today's repo shows ≤5 guard candidates (was 36), an unpushed-commits section, a headroom table with an app.js weekly delta, and a GitHub tech-debt section (or its graceful-skip line).
- `tests/tech-debt.js` gate behavior unchanged; `--json` never exits non-zero.
- Scanner exits 0 in all cases, including with `gh` logged out and no network.

## Fable review findings (2026-07-18, post-ca1d523) — correction for Sonnet

**Finding (medium, non-blocking, fail-safe direction):** the guard-retirement section is silently dormant — it will report 0 candidates until 2027 regardless of guard age. Two causes: (1) plain `git blame` dates every `tests/uat/*` line to the 2026-07-17 monolith split (`f057f7b`), not original authorship — verified: plain blame on `040-…js:178` → 2026-07-17, `blame -C -C` → 2026-04-14; (2) the 365-day threshold (planning error, Fable's) can never fire in a repo born 2026-03-28. Sonnet's "0 candidates (was 36)" was dormancy, not noise reduction.

**Exact patch (scripts/groundskeeper-scan.js):**
- [x] `GUARD_AGE_DAYS_THRESHOLD = 365` → `90`; update the comment block above it ("> 1 year" → "> 90 days — repo born 2026-03, ships daily; 365d could never fire before 2027").
- [x] `blameLineAuthorTime`: `git blame -L …` → `git blame -C -C -L …`; add a comment that `-C -C` follows content across the 2026-07-17 uat split (plain blame resets all lines to that commit).
- [x] Re-run `node scripts/groundskeeper-scan.js`: expect a small non-zero candidate list (April-era dead-token guards), ≤5 shown with the cap line. Commit fast-lane: `chore(groundskeeper): guard-age fix — blame -C -C + 90d threshold (review finding)`.

## Rejected approaches
- **Version-age heuristic for guards** — broken by the v4→v7 version jumps; produced 36 candidates (unreviewable). Replaced by dead-token + blame-age.
- **Thursday tech-debt queue as the digest's endpoint** — founder confirmed 2026-07-18 the Thursday lane has been lapsed for months; a queue feeding it would rot identically. Replaced by rolling-memory surfacing (SKILL.md side).
- **A persisted metrics log file for trends** — clutter; the FACTS block's git history already contains the time series for free.
