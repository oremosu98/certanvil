---
name: groundskeeper
description: Weekly maintenance sweep — enforces the repo's standing tidy-up policies that currently rely on humans remembering them (FACTS freshness, graphify staleness, regression-guard retirement, CLAUDE.md Version History length, repo clutter). Use when the user says "run the groundskeeper", or when a scheduled Monday-morning session fires.
---

# Groundskeeper — weekly maintenance runbook

A deterministic scanner (`scripts/groundskeeper-scan.js`) plus this runbook. The scanner is read-only and never fails (always exits 0 — findings aren't failures); this skill decides what to do about what it finds. Everything the scanner reports is a *finding*, not an instruction — this skill still applies judgment before touching anything.

**Scope discipline**: the groundskeeper does exactly one mechanical auto-fix (CLAUDE.md Version History trim, with the CHANGELOG.md backfill it requires). Everything else is report-only. It never touches app code (`app.js`, `index.html`, `styles.css`, `dg-system.css`), never deletes tests or memories, and never pushes.

**Model routing** (per `docs/conventions/model-routing.md`): run sweep sessions on **Sonnet** — this is mechanical work. The sweep's only writes (CLAUDE.md, CHANGELOG.md, memory) are planning surfaces, so any model is *compliant*, but Sonnet is the right tier. If a sweep finding needs an implementation-surface fix, it goes in "Needs you" / the rolling memory — never fixed in the sweep session.

## Runbook

### 1. Orient
`cd` to `/Users/simioremosu/Desktop/Dev Projects/certanvil`. Confirm the working tree state with `git status --porcelain`. If it's dirty beyond the known-fine untracked `.claude/skills/feature-lane/`, note this in the digest and switch to **report-only mode for this run** — do not commit anything. (A dirty tree means someone has work in flight; the groundskeeper should never commit on top of it.)

### 2. Run the scanner
```bash
node scripts/groundskeeper-scan.js
```
Carry its findings forward — the `GK-SUMMARY:` lines at the end are built to lift directly into the digest's checklist-area lines.

### 3. Auto-fix (mechanical, safe — the ONLY auto-fix)
If (and only if) the tree was clean in step 1, and the scanner's section 4 (CLAUDE.md Version History) reports rows over the 3-row cap:

1. Re-read `CLAUDE.md` immediately before editing — `stamp-facts.js` and `bump-version.js` rewrite it, so any snapshot from step 2 may already be stale.
2. For each excess version, check the scanner's verdict:
   - **"safe to trim"** (row already in CHANGELOG.md) — just remove it from CLAUDE.md's inline table.
   - **"needs CHANGELOG entry first"** — append a one-line entry to CHANGELOG.md's table (top of the versioned rows, matching its existing `| vX.Y.Z | one-line summary |` format) using the same one-line summary text already sitting in the CLAUDE.md row, *then* remove the row from CLAUDE.md.
3. Trim CLAUDE.md's Version History table down to the last 3 rows.
4. Run the normal gates — **never `--no-verify`**:
   ```bash
   node tests/uat.js
   ```
   (the pre-commit hook re-runs this plus the CLAUDE.md-freshness + data-safety scans; let it run, don't bypass it)
5. Stage exactly `CLAUDE.md` (+ `CHANGELOG.md` if touched) and commit in **one** commit:
   ```
   chore(groundskeeper): weekly sweep YYYY-MM-DD
   ```
6. Do NOT push. Ever. (See Hard rules.)

**Nothing else is auto-fixed.** Regression-guard retirement (scanner section 3) is ALWAYS a human decision — list the candidates in the digest, never delete a guard. Graphify re-labeling requires `ANTHROPIC_API_KEY` exported in-shell, which a scheduled session cannot assume is set — report it as a "needs you" item, don't attempt it blind (a silent no-op that looks like success is worse than not trying).

### 4. Memory hygiene
If `mcp__memory__*` tools are present in this session's tool surface: run `detect_contradictions` and `consolidate` scoped to this project. Summarize what was merged or flagged in the digest. Never call `forget` on anything without listing exactly what and why in the digest first — no silent forgetting.

If the memory tools are not present, skip this step silently (don't nag about it — per the user's global ShieldCortex instructions, absent tools just mean the automatic hook-based capture is already covering things).

### 5. Error triage

Invoke the `error-triage` skill and include its brief in the Monday report under a "Error triage" section. Muted fingerprints in the skill's `## Muted fingerprints` list are pre-filtered — only signal-worthy groups appear in the digest. If the Supabase MCP is unavailable, note "skipped (no Supabase MCP)" in the digest rather than attempting the SQL editor manually.

### 6. CI health
```bash
gh run list --branch main --limit 5
```
Flag any run that isn't a clean success.

### 7. Digest
Format (scanner `GK-SUMMARY:` lines lift straight into the checklist area):

```
🧹 Groundskeeper — <date>
✅/⚠️ FACTS freshness — <one line>
✅/⚠️ Graphify — <one line>
✅/⚠️ Regression guards — <one line, capped-5 candidates>
✅/⚠️ Version History — <one line>
✅/⚠️ Repo clutter — <one line>
✅/⚠️ Unpushed work — <one line>
✅/⚠️ Debt headroom — <tightest metric + app.js Δ this week (+ ratchet headroom once #138 Phase 0 lands)>
✅/⚠️ GitHub debt — <open tech-debt issue count + oldest-untouched>
✅/⚠️ Memory hygiene — <one line, or "skipped (no memory tools)">
✅/⚠️ Error triage — <top fingerprint + count, or "0 new groups", or "skipped (no Supabase MCP)">
✅/⚠️ CI health — <one line>

Committed: <sha + one-line message, or "nothing to fix">
Needs you (max 3, ranked):
- <the 3 highest-value items across ALL sections — not one per section>
(or just "nothing")

<if committed: reminder that `git push origin main` ships it — the groundskeeper never pushes>
```
Keep it short — this is a scan digest, not a report.

### 8. Surface it (don't let it rot)
The founder has confirmed (2026-07-18) that boards and fixed weekdays don't get looked at — findings must arrive **inside future chat sessions** on their own. Two channels, in order:

1. **Rolling memory (primary).** If `mcp__memory__remember` is available: write ONE memory titled `MAINTENANCE DEBT — groundskeeper digest <date> (supersedes all prior groundskeeper digests)`, category `context`, high importance. Content = the "Needs you" list + GitHub debt count + app.js trend line, and this instruction to future sessions: *"If the founder asks 'what's next', wraps up a feature, or a session touches an area named below — mention the relevant item. One line, not a lecture."* ShieldCortex injects it into future sessions automatically — that's the delivery mechanism. One rolling memory, always superseding; never accumulate weekly copies.
2. **Push notification (secondary).** If a `PushNotification`-type tool is available AND the digest has any ⚠️: send one line — `🧹 Groundskeeper: <top Needs-you item> (+N more)`. Skip silently if the tool is absent.

If neither channel is available, say so at the top of the digest so the founder knows this run's findings won't resurface on their own.

## Hard rules

- **Never push.** `git push origin main` is always left to the human, even after a clean auto-fix commit.
- **Never bypass hooks.** No `--no-verify`, no `--no-gpg-sign`, no skipping the pre-commit UAT/data-safety/CLAUDE.md-freshness checks.
- **Never delete tests, memories, or files autonomously.** Regression-guard retirement is always a listed candidate, never an action. Memory `forget` calls always get listed before they happen.
- **Never touch app code.** `app.js`, `index.html`, `styles.css`, `dg-system.css`, `package.json`, `playwright.config.js`, `tests/e2e/*`, `.githooks/*` are all out of scope for this skill — the only files it may ever write are `CLAUDE.md` and `CHANGELOG.md`, and only for the Version History trim.
- **If anything looks surprising — stop and report instead of fixing.** Merge conflicts, UAT failing *before* this run's own changes, an unreadable CLAUDE.md FACTS block, a graphify graph that won't parse — none of these are groundskeeper's job to repair. Report them in "Needs you" and stop.

## Quick reference

| Need | Command |
|---|---|
| Run the scan | `node scripts/groundskeeper-scan.js` |
| FACTS check only | `node scripts/stamp-facts.js --check` |
| Graphify staleness only | `node scripts/graphq.js stale` |
| UAT gate | `node tests/uat.js` |
| CI status | `gh run list --branch main --limit 5` |
| Tombstone list (never-retire guards) | `docs/conventions/regression-tombstones.md` |
