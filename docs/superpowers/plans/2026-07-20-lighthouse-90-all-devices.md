# Lighthouse ≥90 on all devices — analysis + plan (v7.84.x series)

> Fable-planned 2026-07-20 (post-v7.83.0 ship). Sonnet executes. Target: **90 minimum
> on BOTH Lighthouse form factors** — mobile (slow-4G, 4× CPU throttle) and desktop.
> Mobile is the binding constraint; if mobile clears 90, desktop follows easily.

## Measured baseline (prod, v7.83.0, 2026-07-20)

| Form factor | Score | FCP | LCP | SI | TBT | CLS |
|---|---|---|---|---|---|---|
| **Mobile** | **72** | 2.6s (0.65) | 5.5s (0.18) | 5.4s (0.56) | 60ms (1.0) | 0 (1.0) |
| **Desktop** | **88** | 0.5s (1.0) | 1.0s (0.94) | 0.8s (0.99) | 0ms (1.0) | **0.22 (0.57)** |

Score weights (LH v10+): FCP 10% · SI 10% · **LCP 25%** · **TBT 30%** · **CLS 25%**.
Mobile already has TBT+CLS perfect (55% of the score). The entire gap is LCP/FCP/SI.

### Root causes — mobile (72)

1. **LCP element is `a.topbar-signin-pill`** — injected by `auth-state.js`, which sits
   at the END of a ~20-file `defer` chain (supabase-umd 197KB → supabase.js →
   cloud-store → auth-state → … → app.js 218KB → features/*). On 4× CPU throttle the
   chain takes ~4.8s to reach the injection. **LCP render delay = 4,800ms of the
   5.5s total.** Load delay/load time = 0 — this is pure "waiting for JS" —
   no amount of further byte-shaving on CSS/JS fixes it. The LCP candidate must
   become a **static HTML element painted at FCP time**.
2. **Mobile-only render-blocking CSS**: `lift-shell.css` + `lift-screens.css` carry
   `media="(max-width: 899px)"` → render-blocking ONLY on mobile viewports.
   lift-screens is **111KB raw / 17.5KB wire** — the single largest blocking file on
   mobile. Desktop never pays this (media doesn't match = non-blocking there).
   Total mobile blocking CSS wire: ~32KB across 4 files (+inline).
3. **FCP 2.6s** = TTFB 744ms (simulated RTT tax, can't fix) + one CSS fetch round
   (562ms simulated request latency) + parse. Levers: fewer/smaller blocking files,
   preconnect, possibly inlining styles-critical.
4. `uses-rel-preconnect`: Supabase origin = est. 320ms savings.

### Root cause — desktop (88)

- **CLS 0.22** (score 0.57) — six successive layout shifts, ALL on
  `body.has-sidebar > div#page-setup`: the bento home is injected/steps in via JS
  (features/home.js + reveal), shifting layout each time content lands. Fixing CLS
  to <0.1 alone puts desktop at ~97. Everything else is already ~perfect.

## Score math (mobile) — what 90 requires

Current: `.10(.65) + .10(.56) + .25(.18) + .30(1) + .25(1) = 72`.
Target metric set that clears 90: **LCP ≤ ~2.4s, FCP ≤ ~1.8s, SI ≤ ~3.5s**
(→ `.10(.90)+.10(.90)+.25(.80)+.55 ≈ 93`). CLS must stay ~0 on mobile — phase M1
must not introduce shift.

## Plan — phases (each = one fast-lane ship, UAT-gated)

### M1 — Static LCP + instant pill (biggest single win, ~+13pts)
- Paint the **account pill as static HTML** in `#topbar-account-mount` at parse time
  (same classes/geometry as the JS-injected one; signed-out visual by default).
  `auth-state.js` then MUTATES it (text/state swap) instead of injecting it. Reserve
  exact dimensions so the swap causes zero shift.
- Add a **static above-fold hero for the mobile lift shell** in HTML (heading +
  sub-line matching lift-shell.js's first screen), so a large text block paints at
  FCP and becomes the LCP candidate. lift-shell.js hydrates/replaces in place, no
  geometry change.
- Expected: LCP collapses from 5.5s → within ~300ms of FCP.

### M2 — Mobile CSS diet (~+3-4pts: FCP + SI)
- Split `lift-screens.css` (111KB raw): extract the above-fold mobile-home subset
  → `lift-critical.css` (reuse `scripts/css-extract-critical.js` with a 412px
  viewport run); demote the remainder to `media="print" onload` + noscript, same
  pattern as styles.css/dg-system.css.
- Trim dead legacy-home stubs from `dg-critical.css` lines ~162-378 (`.home-grid`,
  `.col-main`, `.col-side`, `.nbm-card`, `.dgh-*` — already grep-verified dead).
- Consider inlining styles-critical.css (11KB raw / 3.4KB wire) into `<head>` to
  drop one blocking request round. Decide after measuring M1+M2 first.

### M3 — Preconnect + misc (~+1pt)
- `<link rel="preconnect" href="https://<project>.supabase.co" crossorigin>` (320ms).
- Remove `fonts.googleapis.com` / `fonts.gstatic.com` from vercel.json CSP (dead
  since v7.81.0 — hygiene, not points).

### D1 — Desktop CLS fix (~+9pts desktop → ~97)
- Reserve vertical space for the bento grid: min-height on `#page-setup` /
  per-tile skeleton boxes sized to final geometry, so features/home.js injection
  fills rather than shifts. Audit the reveal animation — it must animate
  transform/opacity only, never layout properties.
- Verify mobile CLS stays 0 after M1's static hero (shared markup path).

### Sequencing + verification
1. Ship M1 → measure both form factors. 2. M2 → measure. 3. M3+D1 (small, can ride
together) → measure. Each ship: bump-version, UAT, post-deploy LH run
(`npx lighthouse <url> --only-categories=performance` default mobile AND
`--preset=desktop`), plus the CLAUDE.md post-deploy browser walk.
- **Watch-outs**: M1 static pill/hero must match JS-rendered geometry exactly or it
  trades LCP for CLS (25% weight — a 0.1 CLS regression erases the LCP win).
  UAT tests that assert pill-injection behavior in auth-state.js may need the
  static-mutate contract reflected. lift-screens split must re-run extraction after
  any mobile-home markup change (same REGENERATE note as styles-critical.css).

### Projected end state
Mobile: FCP ~1.6-1.9s, LCP ~1.9-2.2s, SI ~3.0-3.5s, TBT/CLS unchanged → **~91-94**.
Desktop: CLS <0.05 → **~96-98**.

## Related
[[2026-07-17-appjs-incremental-extraction]] · [[conventions]] · [[SHIP_CHECKLIST]]
