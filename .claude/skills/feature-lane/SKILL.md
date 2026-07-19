---
name: feature-lane
description: "The full CertAnvil workflow lane — orient via both code/decision maps, design mockup-first against BRAND.md, run the 4-stage visual pass, build on the right lane, ship verified. You MUST use this at the START of any CertAnvil work: new features, bugfixes, drills, PBQs, UI/component changes, redesigns, copy changes, or anything touching app.js/index.html/dg-system.css — even if the user just says 'fix X' or 'add Y' without mentioning workflow. Not needed for pure questions, doc reads, or git housekeeping."
---

# CertAnvil Feature Lane

The canonical sequence for any CertAnvil change. Each stage exists because skipping it has cost real rework (documented in memory + CLAUDE.md lessons). Walk the stages in order; skip a stage only deliberately, and say so.

Project root: `~/Desktop/Dev Projects/certanvil`. CLAUDE.md is always loaded — this skill sequences it, it doesn't replace it.

## Stage 0 · Orient — both maps BEFORE touching code

Never blind-grep or read `app.js` (~19K lines) to trace logic. Two maps, two questions:

- **HOW the code works → graphify.** `node scripts/graphq.js find|inspect|callers|callees|impact|community|file|path|stale` (add `--json`, `--depth N`). `impact <fn>` = what breaks if you edit it. For anything beyond a quick query (labeling, stale communities, missing `graphify-out/`, generic "Community N" names), use the **graphify-ops** skill.
- **WHY it's built this way → the Obsidian vault** (repo root). Start at `Home.md` or the topic MOC (`Drills MOC`, `Mobile MOC`, `Design MOC`, `Decisions MOC`) and follow each doc's `## Related` wikilinks. Prior specs, ADRs, and rejected approaches live here — check before re-deciding anything.

Do both. A change grounded in only one map has repeatedly missed either a caller or a prior decision.

## Stage 1 · Design — mockup-first, brand-locked

- Run the **brainstorming** skill (the user's fork in `~/.claude/skills/`, never `superpowers:brainstorming`) before any creative work. For large features, **grill-with-docs** afterward.
- **Read `design/brand/BRAND.md` before ANY visual work. This is non-negotiable and the most-forgotten step in the lane.** It is the locked source of truth: forged-bronze OKLCH tokens, Fraunces/Inter roles, motion durations, iconography rules, the anti-slop do-not list. Do not design from memory of it.
- **Mockups ARE the build.** Author `mockups/<feature>-concept.html` first; implementation is a faithful lift of the approved mockup. Copy `design/brand/mockup-starter-tokens.css` into every new mockup's `<style>` — never freehand a hex token block (the 2026-06-12 gold-drift lesson).
- Never edit `styles.css` for reskins — scoped overrides go in `dg-system.css`.

## Stage 2 · The 4-stage visual pass

For ANY end-user-visible surface (UI, components, pop-ups, animations, on-screen copy), run these four skills **in order**:

1. **design-taste-frontend** — the visual treatment (anti-slop)
2. **emil-design-eng** — polish, animation, micro-interactions (use the certanvil-scoped variant)
3. **humanizer** — on-screen copy reads human, no AI-writing tells
4. **marketing-psychology** — behavioral framing of copy and motivation surfaces

Applies only to user-visible surfaces — not storage, migration, engine, or backend logic.

**HARD RULE — cross-platform coverage (founder, 2026-07-19):** EVERY feature — visual AND runtime behavior (network handling, timeouts, lifecycle, storage) — must be designed for and verified on all four targets: Desktop, Safari/WebKit, mobile web, and iOS Capacitor. Specs and plans must carry an explicit cross-platform section; live-verify covers all four (Capacitor per IOS_TESTING.md). Platform gotchas that recur: WKWebView suspend aborts in-flight requests; `navigator.onLine` lies on iOS; mobile Safari evicts tabs aggressively; hover must stay pointer-gated; touch targets ≥44px; safe-area insets.

## Stage 3 · Build

- **Pick the lane** (ENVIRONMENT_STRATEGY.md): schema / money / auth / service-worker → **gated** (feature branch → PR → Supabase branch DB + Vercel preview → squash-merge). Everything else → fast lane on `main`.
- Non-trivial proposal (3+ files, new subsystem, schema change, multi-step flow)? Run the **review-feature** skill before building.
- Standing invariants that keep getting re-litigated — don't:
  - Milestones are **per-cert**, never shared or transferred across certs.
  - Never write user-state localStorage on prod / `*.vercel.app` (real data-loss incident). Local server, preview deploy, or incognito only.
  - `setQuestionText` order is escape-THEN-highlight (XSS).
  - Sim Lab / PBQ scenario banks require the 2-agent consensus gate (network engineer + CompTIA examiner) before a scenario enters the bank.
- Respect `saas-gated` labels — frozen until the pivot triggers.

## Stage 4 · Ship

Hand off to the **ship** skill (`/ship`) — lane decision, UAT/Playwright, `bump-version.js` (never hand-edit; it also must bump the `dg-system.css?v=` query on dg-system changes), push, and the post-deploy live-browser verification. "Shipped" is only claimable after driving the real prod URL per CLAUDE.md's post-deploy section.

## Quick reference — where things live

| Need | Location |
|---|---|
| Brand source of truth | `design/brand/BRAND.md` |
| Mockup token starter | `design/brand/mockup-starter-tokens.css` |
| Bespoke icon set | `design/svg-icons/` |
| Code map queries | `node scripts/graphq.js <cmd>` |
| Decision map entry | `Home.md` / topic MOCs |
| Lane rules | `ENVIRONMENT_STRATEGY.md` |
| Ship discipline | `SHIP_CHECKLIST.md` + the `ship` skill |
