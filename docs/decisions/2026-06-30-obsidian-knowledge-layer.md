---
up: "[[Decisions MOC]]"
type: decision
status: active
cert: all
updated: 2026-06-30
tags: [decision]
---
# Knowledge "third leg": deepen Obsidian plugins, not a new tool

## Context
The vault (WHY) + graphify code map (HOW) were already in place. Question was which single "third leg" to add for a more seamless, low-maintenance solo workflow that links code to decisions and stays fresh. Candidates: DeepWiki (auto repo wiki), Swimm (code-coupled docs with staleness flags), deeper Obsidian plugins, ADR tooling (Log4brains/adr-tools). Agent council (codex) was consulted.

## Decision
Stay inside Obsidian and deepen what we already own: **Dataview** dashboard, **Canvas** code↔decisions board, and **Breadcrumbs** for a 2-level `note → MOC → Home` hierarchy. Navigation convention: every note sets `up:`; reverse trails are inferred (no hand-maintained `down:` lists). Documented in [[vault-navigation]].

## Why
- Lowest marginal effort/maintenance — no new app, login, or sync to keep alive; notes were already Dataview-ready.
- The reverse-link gardening trap is avoided by relying on Breadcrumbs' implied-opposite relation.
- Swimm's freshness-flagging is the one real gap accepted as a tradeoff (manual sync habit instead of auto-alarm).

## Affects
Vault only (no app.js/runtime code): `Home.md`, `Dashboard.md`, `Code ↔ Decisions.canvas`, the 4 MOCs, `docs/conventions/vault-navigation.md`, and `up:` frontmatter across 39 member notes + the `docs/_templates/Decision.md` template. [[vault-navigation]]

## Rejected alternatives
- **Swimm** — best freshness mechanism, but a new tool to maintain; council's runner-up.
- **DeepWiki** — great read-only explainer but answers "what" not "why"; overlaps graphify. Keep as optional external reference.
- **Obsidian Git** — redundant + risky: the vault IS the code repo, so notes are already versioned by `/ship`; auto-commit would fight the ship workflow.
- **ADR tooling (Log4brains/adr-tools)** — structure/publishing only, no code-staleness; we already have ADRs in `docs/decisions/`.

## Related
[[vault-navigation]] · [[Dashboard]] · [[Decisions MOC]] · [[Home]]
