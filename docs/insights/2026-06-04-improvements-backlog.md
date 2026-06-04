# Improvements Backlog — from 2026-06-04 Claude Code Insights

> **Purpose:** Hand-off spec for a follow-up agent. Source: the usage-insights report
> (`docs/insights/2026-06-04-insights-report.html`, open in a browser for the full narrative).
> This file distills the report's suggestions **plus the real context from the session that
> generated them**, so you can execute without re-deriving — and without stepping on the
> project's hard rules.

## ⚠️ Read before touching anything (project guardrails)
These override any generic suggestion in the report:
- **`CLAUDE.md` is lean by hard rule** — ≤250 lines / 30 KB, CI-enforced (`tests/uat.js`). It reloads
  on every tool call. *Do not bloat it.* Task-specific detail belongs in `docs/` or the relevant
  file's comments, **not** here. (The report suggests adding convention blocks; see Item 3 for why
  most of that is already covered and should stay out.)
- **`saas-gated` items are FROZEN** until the paid-SaaS pivot — do **not** pull #21, #55, #123,
  #135, #136, #137, #138, #139 without explicit pivot direction. (Notably, `app.js`/`styles.css`
  splits are #138/#55.)
- **NEVER write to user-state `localStorage` on prod / `*.vercel.app`** (real data-loss incident).
- **Branching:** docs/UI/non-schema JS = fast lane (commit → main → CI → Vercel). Anything touching
  `supabase/migrations`, auth, payments, or `sw.js` = gated lane (feature branch → PR). See
  `ENVIRONMENT_STRATEGY.md`.
- **File moves use `git mv`** (preserve history); after CI-config changes, confirm **both** the
  Actions run **and** the prod deploy succeed before calling it done.

## Already done in the source session (do NOT redo)
- ✅ Root decluttered; docs filed into `docs/{audits,handoffs,planning,mobile}`; design scratch → `design/`.
- ✅ `design/` excluded from the prod build (`scripts/build.js` `DENY_DIRS`).
- ✅ CI bug fixed: `pull-requests: write` granted to the `lighthouse` + `deploy-preview` jobs (`ci.yml`).
- ✅ CI false-red fixed: Lighthouse `categories:performance` demoted `error` → `warn` (`.lighthouserc.json`).
- ✅ Two PRs (#423, #424) merged; both prod targets deployed + verified.
- ✅ Memory reviewed — `CLAUDE.md` confirmed accurate & within cap; deliberately left unchanged.

---

## Backlog (prioritized)

### 1. Custom Skill: `/ship` — codify the reorg→test→PR→deploy flow  ·  *High value*
**Why:** The session ran this multi-step, error-prone flow manually. Capturing it as a skill makes it
one command and encodes the "verify prod before done" step that defined success.
**Where:** `.claude/skills/ship/SKILL.md` (mirror the existing `.claude/skills/review-feature/SKILL.md` shape).
**Sketch:**
1. `git mv` for any file moves (preserve history); update references.
2. `node tests/uat.js` (+ `tests/validation-audit.js` if `validateQuestions`/GT tables touched).
3. Push branch → open/update PR.
4. Watch the "UAT + Playwright" required check to green (GitHub MCP `pull_request_read` / `actions_list`).
5. Squash-merge → confirm `Deploy to Production` jobs + `deploy-verification.yml` succeed.
**Acceptance:** invoking `/ship` walks the `SHIP_CHECKLIST.md` phases end-to-end and refuses to report
"done" until prod verification passes.
**Caution:** keep it consistent with `SHIP_CHECKLIST.md` (don't duplicate/diverge it — reference it).

### 2. Hook: auto-run a fast check after edits  ·  *Medium — tune carefully*
**Why:** Bash was the top tool (48×); surfacing lint/test issues before CI tightens the loop.
**Where:** `.claude/settings.json` → `PostToolUse` matcher `Edit|Write`.
**Caution (important):** the full `tests/uat.js` is ~16K lines — too heavy to run on every edit. Prefer a
**fast, targeted** command (e.g. a lint or a quick syntax/JSON/YAML validate), or scope the matcher.
The repo already runs full UAT in the **pre-commit hook** (`.githooks/pre-commit`), so don't duplicate
that weight on every keystroke. Validate the chosen command's runtime before committing the hook.

### 3. `CLAUDE.md` convention additions  ·  *Low — mostly already covered, verify before adding*
**Report suggested:** add "use `git mv`" + "verify prod deploy" convention blocks.
**Reality:** the deploy-verify discipline already lives in `SHIP_CHECKLIST.md` + the "Post-deploy
verification" section of `CLAUDE.md`, and branching lanes are documented. The session owner reviewed
`CLAUDE.md` and chose to **leave it as-is** (it's accurate and at 169/250 lines).
**Action:** only add a *single terse line* if you find a genuine gap (e.g. an explicit "file moves →
`git mv`" one-liner under a Git note). **Respect the size cap; do not expand Version History or add
multi-line blocks.**

### 4. Parked follow-ups surfaced during the session (not in the report, but real)
- **`tablet-audit/` → build denylist** — ~41 MB of screenshots still ship to prod. Add `tablet-audit`
  to `DENY_DIRS` in `scripts/build.js` **and** mirror it in the `tests/build.test.js` "dev/infra dirs
  NOT copied" assertion (same pattern used for `design`). Fast lane, low risk. Consider also moving
  `tablet-audit/` under `design/` or an `artifacts/` dir for tidiness.
- **`CLAUDE.md` Version History trim** — the table has ~15 rows but the file's own rule is "inline only
  the last 3 ships." Older rows are already in `CHANGELOG.md`. Trim to the latest 3
  (v7.13.5 / v7.13.4 / v7.13.3). **Before cutting:** confirm `tests/uat.js` doesn't assert any specific
  dropped version string, and that the rows exist in `CHANGELOG.md`.

### 5. CI DRY-up (optional)  ·  *Low*
The `deploy-preview` and `lighthouse` jobs both post PR comments via `actions/github-script`. Could be
factored to reduce duplication, but it's working — only worth it if touching `ci.yml` anyway.

---

## Notes for the reviewing agent
- The insights are generated from **session telemetry**, so some suggestions are "blind" to decisions
  made in-session (e.g. it recommends CLAUDE.md additions that were already considered and declined —
  see Item 3).
- The friction note about "heavy Bash for file moves" is fair; prefer `git mv` + structured Edit/Read
  over raw shell where practical, but `git mv` itself is correctly a shell op.
- Default model guidance for any new AI code: latest Claude (Opus 4.8 / Sonnet 4.6 / Haiku 4.5).
