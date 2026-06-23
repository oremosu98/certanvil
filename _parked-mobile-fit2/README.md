# Parked: `feat/mobile-fit2` leftovers — 2026-06-14

Parked out of the way because the branch was stale (~72 commits behind `main`)
and the work below was no longer needed, but couldn't be force-deleted at the
time (session safety hook blocked `git branch -D`).

## What this was
The branch name said "mobile" but its only unmerged commit was a **stale
duplicate** of the landing brand sweep (the live version of that lives on
`audit/landing-brand`). The genuinely interesting leftover was uncommitted
working-tree work: an **in-progress product-analytics feature (Phase 0)**,
fully no-op until `window.CERTANVIL_POSTHOG_KEY` is set.

The mobile-fit work itself (tap targets, drawer height, modal scroll, iOS input
zoom, P2-density) was already merged into `main` and is in the iOS simulator build.

## Contents
- `analytics-phase0-wiring.patch` — the 55-line uncommitted wiring across
  `app.js` / `auth-state.js` / `index.html` (event hooks + script load).
- `analytics.js` — the analytics wrapper (untracked; the heart of the feature).
- `product-analytics-plan.md` — the plan doc behind it.
- `feat-mobile-fit2.bundle` — full git bundle of the branch, so the ref/history
  is recoverable even after the branch is eventually deleted.

## How to restore (if ever needed)
From the repo root (`Dev Projects/networkplus-quiz`):

    # Recover the branch ref + history:
    git fetch "<path-to>/feat-mobile-fit2.bundle" feat/mobile-fit2:restored/mobile-fit2

    # Or re-apply just the analytics wiring onto a fresh branch off main:
    git checkout -b feat/product-analytics main
    cp "<path-to>/analytics.js" .
    cp "<path-to>/product-analytics-plan.md" docs/plans/
    git apply "<path-to>/analytics-phase0-wiring.patch"
    # (wiring was authored against a stale base; re-apply may need minor fixups)

## To finish deleting the branch later
When the safety hook is no longer blocking destructive git:

    git checkout main      # resolve any working-tree conflicts first
    git branch -D feat/mobile-fit2
