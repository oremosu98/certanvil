# Visual regression testing

Screenshot-diff coverage for key stable pages, via Playwright's
`toHaveScreenshot()`. **Local-only** — not part of the CI gating path.

## What's covered

`tests/e2e/visual.spec.js`, 8 assertions across 6 surfaces:

| Screenshot | Surface | Notes |
|---|---|---|
| `setup-home.png` | Home / bento board (`#page-setup`) | Fresh/empty localStorage — readiness card in its deterministic "—" placeholder state |
| `chrome-sidebar.png` | `#app-sidebar` (scoped element shot) | Persistent nav chrome |
| `chrome-topbar.png` | `#app-topbar` (scoped element shot) | Persistent top chrome |
| `drills-launcher.png` | Drills (`#page-drills`) | Mobile viewport (430×844) — see "Why drills is mobile-only" below. Pro tier, seeded drill stats + a milestone |
| `progress.png` | Topic Progress (`#page-progress`) | Seeded 3-entry quiz history |
| `analytics.png` | Analytics (`#page-analytics`) | Seeded history + drill stats + milestone, drives the live (non-empty-state) render path incl. the reveal-gated Drills group |
| `settings.png` | Settings (`#page-settings`) | Fresh state — Pass Plan empty-state card |
| `sim-lab-entry.png` | Sim Lab entry (`#page-sim-lab-entry`) | Reached via the same lazy-load path the app itself uses (`startSimLabHome()`) |

Landing (`landing/`, served on :3132) is **not** covered. It was evaluated and
skipped: most sections use scroll-triggered `IntersectionObserver` reveals
that start at `opacity:0` in the DOM and only flip to visible once actually
scrolled into view — `prefers-reduced-motion` only shortens the transition,
it doesn't skip the reveal — so a stable full-page shot would need per-section
scroll-and-wait choreography for a ~3700-line page. Not worth the fragility
for a first pass; revisit if landing visual coverage becomes a priority.

Other pages (topic-dive, guided-lab, gauntlet/why-not entries, quiz/exam
in-progress screens) were considered and skipped for now — they either
require AI-generated content, a weak-spot/topic-selection algorithm that's
harder to pin to a single deterministic seed, or are already covered well
enough by `app.spec.js` / `sim-lab.spec.js` / `decision-lab.spec.js`'s
functional assertions. Add them here if they start shipping visual
regressions functional tests don't catch.

## How to run

```bash
npm run test:visual          # npx playwright test --project=visual
npm run test:visual:update   # same, + --update-snapshots
```

(Those two npm scripts are the intended wiring for this suite; see
`playwright.config.js` for the underlying `visual` project definition if you
need to run it directly.)

Baselines live in `tests/e2e/visual.spec.js-snapshots/`, named
`<test>-visual-darwin.png` (Playwright's default convention: `<snapshot
name>-<project name>-<platform>.png`).

## Why this is local-only

The `visual` project is deliberately **excluded from CI**:

- CI runs on Linux; these baselines are generated on macOS. Font rendering,
  anti-aliasing, and subpixel hinting differ enough between the two that
  every single snapshot would mismatch on a Linux runner on day one — not a
  real regression, just a rendering-engine difference.
- `playwright.config.js`'s `chromium`, `webkit`, `mobile-safari`, and
  `landing` projects all `testIgnore: /visual\.spec\.js/`, so the file never
  runs under any project CI actually invokes (`--project=chromium` +
  `--project=landing`). The `visual` project itself carries no `testMatch`
  restriction beyond `visual.spec.js`, so running the full suite with no
  `--project` flag would still pick it up locally — intentional, so a plain
  `npx playwright test` locally exercises everything — but CI always passes
  an explicit `--project`, so this is inert there.

## Updating baselines after a deliberate redesign

1. Make your change.
2. `npm run test:visual:update` — regenerates every baseline in this suite.
3. **Look at the diffs before committing.** Open a few of the regenerated
   PNGs (or `npx playwright show-report` after a run) and confirm the change
   is the one you intended, not incidental drift.
4. Run `npm run test:visual` again (no `--update-snapshots`) — it should
   pass clean. This is the same "generate once, verify once" loop used to
   build the suite; it catches baselines that are themselves non-deterministic
   (see "Determinism, the hard-won version" below) before they land.
5. Commit the updated PNGs under `tests/e2e/visual.spec.js-snapshots/`
   alongside your change.

If only one page changed, scope both commands to it, e.g.
`npx playwright test --project=visual -g "Settings" --update-snapshots`.

## Determinism, the hard-won version

Getting this suite to pass twice in a row (let alone five times — see below)
took a few false starts worth recording so the next person doesn't repeat
them:

- **`page.emulateMedia({ reducedMotion: 'reduce' })`, set in a top-level
  `beforeEach`.** The app already branches on `prefers-reduced-motion`
  extensively — the readiness-card ring draw/count-up, the sidebar streak
  count-up, analytics' reveal + count-up tiles, and the home bento's
  `.reveal` entrance animation all either snap straight to their final value
  or skip the animation class entirely under `reduce`. Without this, several
  of those race a CSS transition, a Web Animations API `.animate()` call, or
  a `requestAnimationFrame` loop, and the screenshot catches them mid-flight
  on some runs and not others.
- **`animations: 'disabled'` on every `toHaveScreenshot()` call**, as a
  second layer: it fast-forwards any CSS animation/transition or WAAPI
  animation still running (e.g. the page-enter/exit transition, or the
  readiness-card confetti/ring draw, which still fires under reduced motion
  when a seeded score clears the pass line — that code path calls
  `settle()` unconditionally).
- **Fresh localStorage per test** (`localStorage.clear()` in an
  `addInitScript`, before seeding only what that test needs) plus the same
  signed-in/Pro-tier stub `app.spec.js`'s `beforeEach` uses, so every test
  starts from a known state instead of whatever the last test left behind.
  Per CLAUDE.md, writing to localStorage from a test is fine on
  `localhost:3131` — the "never write user-state localStorage" hard rule is
  scoped to prod/`*.vercel.app` hosts.
- **An injected stabilization stylesheet, not `mask`.** `expect(page).
  toHaveScreenshot(name, { mask: [...] })` was the first approach tried, and
  it has a real bug for this app's layout: on a page taller than the
  viewport, Playwright's `fullPage` capture scrolls and stitches tiles, and
  `mask` is a post-hoc pixel overlay keyed to a single tile's coordinates —
  for small elements inside the app's `position:fixed` sidebar/topbar, this
  produced a **silently unmasked** result (confirmed by screenshotting with
  the mask on and finding the "masked" text still fully readable). The fix
  was to stop using `mask` and instead inject a `<style>` tag
  (`page.addStyleTag`) that sets the dynamic elements to `display:none`
  before the screenshot — a real DOM change baked in before any tile is
  captured, not a post-processing step, so it has no tile-coordinate problem.
  `display:none` was also specifically chosen over `visibility:hidden`:
  the latter preserves the element's box at its *content-dependent* size
  (e.g. the topbar clock renders "3:53pm" and "10:53pm" at different widths),
  which was observed to occasionally tip a tightly-packed row into wrapping
  and change total page height by a couple of px between otherwise-identical
  runs. `display:none` collapses to a fixed zero size every time.
- **Hidden elements**: the topbar clock (`#topbar-time`), both version
  badges (`.sb-brand-version` in the sidebar, `#topbar-version-pill` in the
  topbar — both bump on every ship), the home page's days-to-exam/streak
  chips and sidebar streak card, and (Settings only) `#autobackup-list` —
  the app takes an idempotent once-per-day auto-backup on every page load
  and renders its real capture timestamp, which is inherently "now" and not
  seedable.
- **Seed dates: relative-to-`Date.now()`, not a fixed calendar string** —
  *when* the page renders that date as relative time ("6 months ago"). The
  Progress page's topic list does this; an earlier version of this suite
  seeded a fixed ISO date there and the "N days/months ago" labels would have
  silently drifted by a day every 24h the suite existed, eventually flipping
  units. Where a page instead renders an **absolute** formatted date (e.g.
  Analytics' "last studied 15 jan" / "EARNED JAN 1"), a fixed ISO date is
  correct instead — a relative offset would make that literal text drift
  daily, which is the opposite problem.
- **Plain `fullPage: true`, not a manual viewport-resize-to-content-height
  dance.** An earlier version of this suite measured
  `document.documentElement.scrollHeight`, resized the viewport to match, and
  took a non-`fullPage` screenshot — this was built to route around the
  `mask` tile-coordinate bug above, before that bug's actual fix (switching
  to `display:none`) was found. Once masking no longer needed it, the manual
  resize turned out to be a *source* of flakiness in its own right: reading
  `scrollHeight` and resizing raced Chromium's own layout/font settling
  independently of Playwright's screenshot pipeline, producing ±1-2px height
  mismatches between otherwise-identical runs on ~half of them. Deleting it
  in favor of plain `fullPage: true` (which has its own internal, more
  reliable settling) fixed the flakiness outright — confirmed with 5
  consecutive clean `--retries=0` runs (40/40 individual assertions) during
  development, on top of the required "twice in a row" check.
- **`maxDiffPixelRatio: 0.02`** on every assertion — a small, deliberately
  loose tolerance for anti-aliasing noise, not for real content drift. If a
  future change trips this, look at the diff before assuming it's noise.

## Promotion path to CI (later)

If/when this becomes worth gating on:

1. Add a Linux-based CI job (or a Linux container/VM step) that runs
   `npm run test:visual:update` fresh and commits the resulting PNGs as the
   **CI baseline set** — separate from (or replacing) the macOS-generated
   ones here, since the two will never pixel-match each other.
2. Wire a `visual-ci` (or similarly named) Playwright project pinned to that
   Linux baseline directory, and add it to the CI workflow's `--project`
   list alongside `chromium` and `landing`.
3. Keep the macOS baselines (this doc's current setup) for local
   fast-iteration use regardless — regenerating Linux baselines in CI on
   every push is possible but slower and gives up the "spot it before you
   push" workflow this suite is currently optimized for.

## Related

[[conventions]] · [[structure-overview]]
