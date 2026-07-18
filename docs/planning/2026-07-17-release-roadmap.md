# Release Roadmap — adopted 2026-07-17

> Founder-approved sequencing for product waves + the #138 extraction program.
> Core principle: **alternate product waves with extraction cuts** — seed work lives in
> `features/` seed files and never collides with extraction; big cuts land BEFORE the
> next big archetype so new code is born into a cleaner codebase.
> One track per session, never mixed.

| # | Release | What | Why this slot |
|---|---|---|---|
| 1 | **v7.66.0** | PBQ Wave 4 — Laser Print Defect Clinic (A+ Core 1) | Shovel-ready (spec `2026-07-11-pbq-wave4-design.md`, approved mockup, 10-task plan). Closes the 11-archetype program. |
| 2 | *(same week)* | **Extraction Phase 0** — unfreeze #138 + growth ratchet | Minutes of work, docs/tooling only. Stops monolith growth before more product code lands. Plan: `docs/superpowers/plans/2026-07-17-appjs-incremental-extraction.md`. |
| 3 | **v7.67.0** | Seed extensions **SE-1 + SE-2** (Sec+ CLI + Core 2 CLI) | Cheapest evidenced win from the 2026-07-16 research — content-only on the shipped `cli` renderer, one effort, two certs. |
| 4 | *(chore ship)* | **Extraction Wave 1 — Progress page** | Smallest, safest cut; proves the protocol while stakes are low. |
| 5 | **v7.68.0** | Seed extensions **SE-3 + SE-4** (diagram + firewall) | Rounds out "extend what's shipped." Firewall seeds: **no drag-drop** (folklore, 3 hunts, zero SY0-701 evidence). |
| 6 | *(chore ship)* | **Extraction Wave 2 — Analytics** | The big cut, deliberately BEFORE vpntunnel so its renderer lands in a lighter app.js. Also retires the tech-debt `KEPT_DYNAMIC_DISPATCH` carve-out. |
| 7 | **v7.69.0** | **`vpntunnel` archetype** (Sec+) | Research #1 — A-grade, 6 sittings, only zero-defect survivor. First new archetype after the program closed. |
| 8 | *(chore ships)* | Extraction Wave 3 (Settings) → Waves 4+ | Interleave until app.js is a slim core; closes #138. |
| 9 | **Hold — reassess ~Oct 2026** | `certchain` | C/0-evidence bet; SY0-801 objectives preview (~Oct 2026) could invalidate all Sec+ mappings — re-examine against new objectives before spending ~40–50 seeds. |

## Standing rules (whole roadmap)

- One track per session — never mix a product wave and an extraction cut.
- Groundskeeper runs Mondays 08:00 (scheduled task `certanvil-groundskeeper`).
- `vulnq` is CUT. `acl` / `iam` / `fleetlog` stay unspecced until their documented defects are fixed (research `09-FINAL-ranked-lists.md` §8).
- No further r/CompTIA research passes — evidence exhausted (stop signal, 2026-07-16).

## Wildcards that reshuffle this

1. **SY0-801 preview (~Oct 2026)** — pauses Sec+ content work; re-map objectives; certchain decision waits for this.
2. **Launch / App Store decision** — the moment launch is called: onboarding SQL flip (`app_config.onboarding_enabled`), Apple submission runbook (`docs/mobile/APP_STORE_DISTRIBUTION.md` §GO-LIVE), and re-enabling the `marketing-skills` plugin ALL jump the queue.

## Related
[[2026-07-17-appjs-incremental-extraction]] · [[09-FINAL-ranked-lists]] · [[SHIP_CHECKLIST]] · [[ENVIRONMENT_STRATEGY]]
