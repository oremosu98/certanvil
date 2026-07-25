---
type: audit
status: in-progress
cert: all
updated: 2026-07-25
tags: [audit, design]
---
# Motion & effects audit — the four cert pages

Auditing **Home, Progress, Analytics, Settings** with `antalik-effects` and
`transitions-dev`, to find where an enhancement genuinely earns its place — then
implement only those.

**The bar.** Every proposal must communicate one of: **attention** (this one
thing matters most), **state** (invisible work is happening), or **celebration**
(a rare win). "It looks cool" is a rejection, and rejections are recorded with
reasons so the same idea does not resurface in three months.

**Constraints.** One accent per screen. Effects stop when their state ends.
`BRAND.md` §6 outranks either skill's own motion scale — take the choreography,
never the numbers. Anything implemented owes the 5-stage visual pass, where
stage 2 decides *whether* a thing moves and stage 3 only *how*.

---

## Home (`#page-setup`) — APPROVED by founder 2026-07-25

**Headline: already well-motioned.** Six staggered `.reveal` blocks, animated
readiness ring + counting number + bar, a 1.1s momentum ring, 0.9s domain-bar
sweeps, hover lifts throughout, and a complete `prefers-reduced-motion` block.
It needs almost nothing *added*. What it has is three defects and one
opportunity.

### Do

| # | Finding | Type | Evidence |
|---|---|---|---|
| **H1** | **Pointer-gate the hover lifts.** Card lifts, button lifts, domain cells, `custom-config` slide and what-if buttons are all ungated. On touch there is no hover-out, so a tap leaves a card stuck lifted until you tap elsewhere. | defect | Exactly **one** Home hover rule is gated (`#modes-ladder .dgh-opt`); the whole file has only 3 `hover: hover` guards, two added 2026-07-25 |
| **H2** | **Delete `--ease-in-out`** (`cubic-bezier(0.77,0,0.175,1)`). | dead code | Declared on `#page-setup`, **0 uses anywhere in the file**. One of the three "non-BRAND curves" flagged in motion-lift wave 1 — turns out inert. Zero-risk deletion. |
| **H3** | **Align `--dgh-ease` to the brand curve.** Leave `--ease-out` alone for now — it is used 23× file-wide and is a separate, wider question. | decision (wave-1 open item) | Home resolves `--dgh-ease` to `cubic-bezier(.2,.8,.2,1)` vs brand `cubic-bezier(0.16,1,0.3,1)`, across **18 rules**; `--ease-out` covers 6 more. **Honest caveat: the two curves are visually very close.** This is consistency, not a jarring mismatch. |
| **H4** | **One `border-beam` on the "Review 6 cards" recommended-next card.** The single motivated accent on this page. | addition | It is the highest-intent CTA and has **no motion at all** — `transition-duration: 0s`, `cursor: auto`. Its arrow child animates; the card does not. |

### Rejected (and why)

- **Shimmer on the readiness score** — a settled value, not a pending state. Shimmer means work-in-progress.
- **Metal-FX on Quick Start / Practice tiles** — daily-use surfaces. Antalik's own doctrine: never on the critical path; novelty decays within a week, the battery cost does not.
- **A beam on any second card** — one accent per screen. Two glowing borders equal zero. If H4 lands, nothing else on Home gets one.
- **Staggering the domain bars** — they already sweep at 0.9s. Stagger would slow a five-row block for no information gain.
- **Entrance motion on `.reveal`** — already present and reduced-motion gated.

### Correction logged
An earlier pass flagged `transition: all` on the hero card as a code smell. Wrong:
there are **zero** `transition: all` declarations in either stylesheet — `all` is
the initial value of `transition-property`, so the computed value means the card
has *no* transition. Same underlying fact as H4; the first reading was incorrect.

---

## Progress (`#page-progress`) — awaiting founder approval

**Headline: the best-engineered page of the four, with one real bug.** Staggered
tile entrance, a coverage-ring sweep, per-row bar growth with `--i` stagger, and
— unlike Home — its hover rules are already correctly gated under an explicit
`/* ── HOVER (gated) ── */` block. Its entrance motion is also wrapped in
`prefers-reduced-motion: **no-preference**`, i.e. opt-in, which is the stronger
pattern (Home uses opt-out). **This page is the model the others should follow.**

### Do

| # | Finding | Type | Evidence |
|---|---|---|---|
| **P1** | **The entrance is rAF-gated — background the tab and the page comes back blank.** `features/progress.js:431` does `requestAnimationFrame(() => requestAnimationFrame(() => grid.classList.add('in')))`. rAF does not fire in a backgrounded tab, so `.in` never lands. Fix with a forced reflow + synchronous class flip, exactly as wave 2 did for the question reveal. | **defect (high)** | Probed the live cascade: without `.in`, a `.tile` computes to **`opacity: 0`** with `translateY(14px) scale(0.985)`. This is the failure wave 1's own comment warns about — *"never rAF-gate a one-shot reveal"* — and it shipped here anyway. |
| **P2** | **Nothing to do on hover.** Already gated. Cite this block as the reference when fixing Home's H1. | — | `dg-system.css:914` `/* ── HOVER (gated) ── */` wraps all `#page-progress` hover rules |

### Considered and rejected

- **FLIP the topic rows on sort/filter change.** Tempting — `.t-flip` shipped in wave 1 and has **zero usages** — but `setProgressSort()` and `filterProgressPage()` both call `_renderProgressGrouped()`, which rebuilds the list wholesale. FLIP needs stable node identity across the change; here the old nodes are destroyed. Doing it properly means reworking the render to reuse rows — real risk, on a page whose only actual defect is P1. **Rejected as disproportionate**, not as a bad idea; revisit if that render is ever refactored for another reason.
- **A beam or shimmer anywhere on this page.** Progress is a dense read-only scan of mastery bars, chips and rows. There is no pending state and no single "this matters most" surface — the whole point is comparison. An accent here would compete with the data. Rejected.
- **More entrance stagger.** Already present at 55ms per row. Adding more would slow a long list.

---

## Analytics (`#page-analytics`) — awaiting founder approval

**Headline: the most ambitious page, and the best-disciplined entrance of the
four.** Its tiles/fills are gated behind an **IntersectionObserver** with a
reduced-motion fallback that shows content immediately — the pattern antalik's
own performance contract asks for, and stronger than both Home (opt-out CSS) and
Progress (rAF). 40 of its hover rules are correctly gated. The constellation
drift loop is genuinely well built: cancels the previous loop on re-render so
detached nodes cannot leak, skipped entirely under `prefers-reduced-motion`,
transform/opacity/filter only, with its tuning values documented in-code.

**This page needs the least. Adding an accent to the constellation would compete
with the one thing on these four pages that already earns attention on its own.**

### Do

| # | Finding | Type | Evidence |
|---|---|---|---|
| **A1** | **The constellation drift loop is never cancelled when you navigate away from Analytics.** The only `cancelAnimationFrame` sits inside `_anaConstWireDrift` itself and fires on *Analytics re-render*. Leave the page for Home and the rAF loop keeps running against a `display:none` surface until Analytics happens to re-render. Browsers stop rAF for a **backgrounded tab**, but not for a hidden element in a visible tab — so this burns CPU on a page nobody is looking at. Fix: cancel on page change. | defect (medium) | `features/analytics.js:1626` is the sole cancel; nothing in `showPage()` or elsewhere calls it. The 6 `visibilitychange` handlers in the codebase are unrelated (network timing, exam timer). |
| **A2** | **The WEEK / MONTH / ALL chart control swaps with no motion.** The active pill's gradient background snaps between tabs. This is a genuine *state* signal — which slice of time you are looking at — and the natural fit is transitions-dev **16 sliding-tabs**, re-timed onto BRAND §6. The single addition worth making on this page. | addition | `.ana-accchart-tab-active` (styles.css) changes `background` with no transition on the active state |

⚠️ **A1 is a code-level finding, NOT live-reproduced.** The constellation needs
richer history than the seeded fixture would build, so the drift loop never
started in testing (0 rAF calls observed). The lifecycle gap is unambiguous in
the source; the runtime cost is inferred, not measured. **Confirm before
treating the severity as settled.**

### Considered and rejected

- **Metal-FX or a beam on the knowledge constellation.** It is already the most visually arresting element in the product and it is doing real work — star size means practice, brightness means mastery. An accent on top would compete with the encoding. Rejected.
- **Shimmer anywhere on this page.** No pending states — everything shown is settled historical data. Shimmer means work-in-progress. Rejected.
- **More entrance motion.** Already IntersectionObserver-gated and staggered, with the correct reduced-motion fallback. Nothing to add.
- **Animating the heatmap cells in.** 26 weeks × 7 days is ~180 cells; any per-cell stagger is either imperceptible or slow. Rejected.
