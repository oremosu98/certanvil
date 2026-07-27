---
type: audit
status: awaiting-approval
cert: all
updated: 2026-07-27
tags: [audit, design, landing]
---
# Motion & effects audit — the landing page

Auditing **`landing/index.html`** (certanvil.com) with `antalik-effects` and
`transitions-dev`, to find where an enhancement genuinely earns its place — then
implement only those. Sister audit to
[[2026-07-25-motion-effects-audit]] (the four cert pages, shipped v8.6.0/v8.6.1);
its rejected list is reused rather than re-litigated.

**The bar.** Every proposal must communicate one of: **attention** (this one
thing matters most), **state** (invisible work is happening), or **celebration**
(a rare win). "It looks cool" is a rejection, recorded with its reason.

**The extra bar, here only.** This page has to convert a stranger. Every
proposal is judged twice — once on the bar above, and once on whether it helps
or distracts from the read-and-sign-up path. First paint and mobile cost matter
more here than anywhere else in the product.

**Constraints.** One accent per screen. Effects stop when their state ends.
`BRAND.md` §6 outranks either skill's own motion scale — take the choreography,
never the numbers.

---

## Headline

**The page is better-motioned than the app was, and its problems are in a
different layer than expected.**

The nine section-scoped `<style>` blocks in `index.html` are genuinely well
built: every below-fold entrance is `IntersectionObserver`-gated (stronger than
Home's opt-out CSS and Progress's rAF), every section ships a
`prefers-reduced-motion` block, and hover is **59 of 65 rules gated** — the
inverse of the app, where 37 of 68 were ungated.

The drift is almost entirely in the **legacy `styles.css` layer** that still
serves the page chrome (topbar, auth modal, notify modal, cert tiles) after the
sections around it were rebuilt as scoped blocks. That is where the ungated
hover lives, that is where the dead rules live, and it is the file that blocks
first paint on the page where first paint matters most.

Six defects, one addition worth making, one addition that is a genuine judgment
call, and a deliberately empty accent budget.

---

## Do

| # | Finding | Type | Evidence |
|---|---|---|---|
| **L1** | **Gate the 23 `styles.css` hover rules that still land on this page.** The scoped sections already do this correctly — this is applying an existing pattern to the layer that got left behind, not inventing one. | **defect (high)** | `styles.css` has **59 ungated** `:hover` rules; **23** target elements present on `index.html`. Sharpest three: `.auth-cta:hover:not(:disabled)` (`styles.css:1161`) — *"Continue with email →"*, the single conversion action on the site; `.cert-tile:hover` (`:345`) — every cert tile in the library grid; `.dropdown-link-danger:hover` (`:893`) — Sign out. On touch there is no hover-out, so a tap leaves each visibly stuck until you tap elsewhere. Mobile is the majority of landing traffic. |
| **L2** | **The hero copy reveal is rAF-double-gated with no safety net.** `.hv2-reveal` starts at `opacity:0`; the only thing that clears it is `requestAnimationFrame(rAF(() => h.classList.add('hv2-ready')))`. The app's `index.html` carries a 1.6s unconditional un-hide behind the same pattern; the landing does not. Fix is the wave-2 one: forced reflow + synchronous class flip. | defect (**verify first**) | `index.html:744`. The hidden subtree is the entire left column — eyebrow, H1, subhead, proof row, **both CTAs**, trust row (`index.html:646-686`). Same defect class as Progress **P1**, which shipped this pattern and had to be fixed. |
| **L3** | **Collapse the curve zoo onto the brand curve.** Four distinct easings are in play and the brand curve is a minority. | drift | `--eo: cubic-bezier(0.23,1,0.32,1)` is **redeclared 10×**, once per section block (11 uses). Brand `cubic-bezier(0.16,1,0.3,1)` — 8. `styles.css` adds a fourth, `cubic-bezier(0.2,0.8,0.2,1)` × 3 (the same off-brand curve Home carried as `--dgh-ease`). |
| **L4** | **Two of the three `--eio` declarations are dead; the third dies with L5.** Keep `--hv2-eio` — it drives the meridian breathe loop, which is ambient motion and legitimately wants an ease-in-**out** shape. | dead code | ⚠️ **Corrected 2026-07-27 during the lift.** The first pass said "declared 4×, one real use — `.pp-eng-spark`". Both halves were wrong: `.pp-eng-spark` (`:1942`) uses a **literal** `cubic-bezier(0.77,0,0.175,1)`, not the variable, and the variables *are* live elsewhere. True picture: `--hv2-eio` (`:371`) used 2× (`:530`, `:534`, the meridian) → **keep**; `--eio` on `#certs` (`:1399`) and `#proof-of-product` (`:1887`) → **0 uses, delete**; `--eio` on `#sq2` (`:1094`) used once at `:1155` by `.sq2-reveal`, which L5 converts off `max-height` → **delete with L5**. |
| **L5** | **The FAQ snaps its height; only its content fades.** `#faq details[open] > .fqx-a` animates opacity + 7px rise, but the `<details>` height jumps instantly on open **and on close there is no transition at all** — content vanishes. **The correct fix already exists in this codebase**: the `grid-template-rows: 0fr → 1fr` block at `styles.css:4597`, written for the old `.faq-a` markup and now serving only `pricing.html`. Port it onto `#faq details`, re-timed onto BRAND §6. transitions-dev **21-accordion**. | defect | `index.html:2976` (`fqxReveal`, open-only); `styles.css:4597-4609` (the orphaned working version). Same bug on `#sq2 .sq2-reveal`, which animates `max-height: 520px` — a magic number that silently clips if the explanation ever grows. |
| **L6** | **Delete the orphaned M-3/M-6 motion block from `styles.css`.** Its selectors were replaced when the sections were rebuilt as scoped blocks; the CSS was never removed. | dead code | `.sq-option`, `.hero-stagger`, `.reveal`, `.pp-tile`, `.btn-secondary` — **0 occurrences** in `index.html` (`styles.css:4586-4640`). Keep `.faq-a`/`.faq-item` (live on `pricing.html`) and `.btn-primary` (live on `account.html`). Dead weight in a 123 KB render-blocking stylesheet, on the one page where first paint is the conversion. |
| **L7** | **Nine durations exceed the BRAND §6 ~600ms UI cap.** | drift | 9 × `700ms`, plus `620/640/650/680ms`. The `1000ms`/`2090ms`/`2600ms` values are the Readiness Meridian and engine-spark loops — those are data/ambient motion and are correctly exempt. |

---

## The one addition worth making

| # | Finding | Type | Evidence |
|---|---|---|---|
| **L8** | **Stroke-draw the sample-question checkmark.** A stranger answering a `/26` subnet question correctly on the landing page is the single celebration moment on this site — it is the exact instant the product proves itself before anyone signs up. Right now the verdict tick appears by `display: none → grid`. It teleports. transitions-dev **10-success-check**, re-timed onto BRAND §6, replacing the hardcoded `stroke-dasharray: 20` with this path's real `getTotalLength()`. Fires **only** on a correct pick, once, and cannot loop. | addition (**celebration**) | The check SVG already exists — `.sq2-vc`, path `M5 12l5 5L20 7` (`index.html:1305`). Its only motion is a `display` flip (`:1169`). The wrong-answer path (`.sq2-vw`) deliberately gets **nothing** — you do not animate someone's mistake. |

---

## The judgment call

| # | Finding | Type | Evidence |
|---|---|---|---|
| **L9** | **Shimmer the two pending-submit labels.** Both async submits swap plain text and stop there. `antalik-effects` `primitives.md` §10 shimmer, with its own discipline: `aria-label` = the state name ("Sending your link", never "Loading"), stops the instant the response lands, one static frame under reduced-motion. **This is a real state signal** — an email round-trip is invisible work with a wait the user cannot predict. **The argument against:** it is two more moving things on a page whose job is to be read, and a disabled button reading "Sending…" is already an honest state indicator. Genuinely arguable — flagged rather than recommended. | addition (**state**) | `auth.js:792` `authSubmit.textContent = 'Sending…'` (magic link — the conversion action); `script.js:144` `submitBtn.textContent = 'Sending...'` (notify modal). Neither has any motion. Note `script.js:144` uses three ASCII dots where the rest of the codebase uses `…` — worth fixing either way. |

---

## Rejected (and why)

- **`border-beam` anywhere on this page.** The accent budget is already spent, and spent well. The hero CTA carries a 420ms gradient wipe plus an arrow nudge; the Readiness Meridian beside it is a full animated instrument. A beam would be the third glowing thing above the fold, and *one accent per screen* means the answer is none, not a fourth. **The repeated-CTA trap makes it worse:** "Take the free baseline diagnostic" appears four times down the page (`hv2-cta-primary`, `pp-cta-btn`, `gx-cta-row`, `pgx-cta`) — beaming "the" CTA would beam four of them, and four beams is zero.
- **`metal-fx` on the hero CTA.** This is the closest the page comes to a motivated case — Antalik's doctrine reserves metal for a purchase, an unlock, or the single action a screen exists for, and this button *is* that action, on a surface nobody sees daily. Rejected anyway, on two grounds that are specific rather than reflexive: the real effect is a WebGL simplex-noise shader, and this is the one page in the product where first paint and mobile cost are the conversion metric; and the CSS approximation is a diagonal gradient sweep, **which this button already has** on hover. Adding it would be paying WebGL's price for an effect that is already there in CSS.
- **Shimmer on the "78%" readiness score in the hero meridian.** A settled value, not a pending state — the same rejection Home's readiness score got, for the same reason.
- **A `thinking-orb` beside the pending-submit labels.** The orb earns its place next to work of *unknown* duration that produces streaming output. An email POST is one round-trip with a binary outcome. If L9 lands, the shimmer alone carries it.
- **Entrance motion on anything that lacks it.** Every section already has an IntersectionObserver-gated entrance with a reduced-motion block. There is nothing left to add, and adding a tenth staggered reveal to a page that already has nine would make the scroll feel slower, not richer.
- **`card-tilt` on the cert-library plates.** Tempting — they are cards on a grid — but they already carry a bespoke draw-on stroke animation with hover-redraw, correctly gated behind `(hover:hover) and (pointer:fine)` **and** reduced-motion in JS (`index.html:1787-1800`). That is a better effect than tilt, and it is already there. Two hover behaviours on one element is one too many.
- **`sliding-tabs` anywhere.** The old per-cert feature tabs were deliberately removed when Proof-of-Product was rebuilt as a single honest grid. There is no segmented control left on the page. (A2's sliding-tabs finding was for Analytics and does not transfer.)
- **Motion on the pricing page in this pass.** `pricing.html` is a separate surface with its own scoped blocks and its own live `.faq-a` accordion. It deserves the same treatment, and it deserves it as its own audit rather than as a footnote to this one.

---

## Correction logged

An early count of this page's hover gating read "43 `:hover` vs 27 guards" and
suggested the app's systemic gating problem repeated here. That was wrong — it
counted *lines containing* `:hover` against *lines containing* a guard, not
occurrences, and it did not check whether each occurrence actually sat inside a
guard block. Measured properly by scoping-root, `index.html` is **59 of 65
gated**. The real finding is L1, and it lives in `styles.css`, not here.

---

## Surfaced during the lift — not acted on

Two dead paths found while checking whether L6's selectors were really unused.
Both are outside the approved scope and neither is a motion issue, so nothing
was changed. Flagged for a decision.

- **`sample-questions.js` is loaded on `index.html` and never mounts.** It looks
  for `#sample-question-host`, which exists on no page. 12.5 KB fetched and
  parsed on the page where first paint is the conversion, doing nothing. This is
  also *why* `.sq-option` read as dead in L6 — the CSS outlived its host, and the
  script outlived it too.
- **The "on the anvil" plates no longer carry `.cert-cta-notify`.** The rebuilt
  `#certs` section's header comment claims the class contract is preserved, and
  `script.js:107` still wires that selector, but there are **zero** matches on
  `index.html`. The notify modal is still reachable — from `pricing.html`, via
  `[data-action="pro-signup"]` — but from the cert library on the landing page
  there is now no way to register interest in a coming-soon cert. That reads as
  a lost conversion path rather than a cleanup.

## Corrections logged during the lift

- **L4's evidence was wrong in both halves** — see the L4 row. Caught by checking
  usage before deleting.
- **L6's dead-list was too aggressive.** The first pass tested only three pages.
  Across the whole project `.btn-primary` is live on 19 pages and `.btn-secondary`
  matched only as a *substring* of `.er-btn-secondary` / `.confetti-btn-secondary`
  in `lib/account.js`. Deleting on the first pass's evidence would have broken
  the account and diagnostic pages. Only genuinely-unreferenced rules were removed.
- **The FAQ conversion introduced an accessibility regression that had to be
  fixed before it shipped.** Giving `.fqx-a-shell` its own `display` overrides the
  UA rule that hides a closed `<details>`'s content, leaving nine collapsed
  answers in the accessibility tree. No focusable elements live in them *today*,
  so there was no tab-order break — but it would become one the first time anyone
  put a link in an answer. Resolved with an inherited `visibility` toggle, held
  until the collapse finishes on close.

## Related
[[2026-07-25-motion-effects-audit]] · [[MOTION_AUDIT]] · [[BRAND]] · [[Design MOC]]
