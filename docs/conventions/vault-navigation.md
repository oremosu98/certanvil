---
type: convention
status: active
cert: all
updated: 2026-06-30
tags: [convention]
up: "[[Decisions MOC]]"
---
# Vault Navigation Convention

How the CertAnvil Obsidian vault is wired for navigation. The whole system is **set-once, zero-upkeep** — follow the one rule below and the trails, dashboards, and reverse-links maintain themselves.

## The one rule
**Every note sets `up:` in its frontmatter pointing to its parent MOC.** That's it.

```yaml
---
up: "[[Drills MOC]]"   # or Mobile / Design / Decisions MOC
---
```

- The 4 topic MOCs (`Drills`, `Mobile`, `Design`, `Decisions`) each set `up: "[[Home]]"`.
- `Home` sets `down:` listing the MOCs + `Dashboard` — the curated top-level map.
- The `docs/_templates/Decision.md` template already carries `up: "[[Decisions MOC]]"`, so every new decision inherits it automatically.

## Why there are no hand-written `down:` lists on the MOCs
Breadcrumbs' **implied "opposite" relation** auto-derives the reverse trail: if note A has `up: B`, Breadcrumbs shows `B → A` as a `down` edge — no manual child-list needed. Hand-maintaining `down:` arrays on each MOC would mean updating two files per new note and would rot fast. We deliberately don't. (Settings → Breadcrumbs → Implied Relations → "Opposite" must stay enabled.)

## The three layers
| Layer | Tool | What it gives you |
|---|---|---|
| **Trail** | Breadcrumbs | `note → MOC → Home` breadcrumb bar at the top of every note (and the reverse). |
| **Dashboard** | Dataview ([[Dashboard]]) | Auto-tables: active work, recent, decisions, stale, inventory — driven off `type`/`status`/`updated` frontmatter. |
| **Board** | Canvas ([[Code ↔ Decisions.canvas\|Code ↔ Decisions]]) | Visual pairing of the Graphify code map (HOW) against the decision MOCs (WHY). |

## Adding a new note — checklist
1. Add standard frontmatter (`type`, `status`, `cert`, `updated`, `tags`).
2. Add `up: "[[<the right MOC>]]"`.
3. Tag it so it appears in its MOC's Dataview query (`#drill` / `#mobile` / `#design` / `#audit` / `#decision`).

Done — it now shows in the MOC, the Dashboard, the breadcrumb trails, and the graph view, with no further wiring.

## Related
[[Home]] · [[Decisions MOC]] · [[Dashboard]] · [[conventions]]
