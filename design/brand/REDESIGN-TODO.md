# Redesign TODO

Surfaces **not yet given** the locked **forged-bronze editorial** treatment (per [`brand/BRAND.md`](./BRAND.md)) — captured here so you can pick up cold next week without re-discovering the list.

Cross-referenced against every `#page-*` id in `index.html` (35 pages) + the v4.99.65 → v5.5.12 rebrand version history in `CLAUDE.md`. Each item names the page id, the file paths to touch, and a one-line rationale.

---

## 1 · Topology Builder end-of-rebrand revision pass

> **Founder-deferred from v4.99.74** (the row explicitly says "FOUNDER STATUS: explicitly not fully satisfied with TB — directed to ship now and queue a dedicated TB revision pass for once the whole-site rebrand is complete"). Highest-priority outstanding item.

- **Page**: `#page-topology-builder` (`features/topology-builder.js` + `dg-system.css` TB block + `tb3d.js`)
- **What's missing**:
  - **3D Explorer internal chrome** — emoji icons in the 3D overlay (modebar pills inside the 3D view, the 3D coach panel, layer labels)
  - **Deprecated full-toolbar `<select>`** — ~30 native `<option>` elements with emoji prefixes (e.g. `📡 Add router`); convert to the modern V2 palette pattern or strip the emoji
  - **Cable token-tuning** — the cable color palette is hardcoded hex per cable type; map to scoped `--cable-*` tokens or stay-the-same with documented exceptions
  - **Canvas representative-state** — empty-state copy + the scenario-loaded card needs the editorial pass
  - **Device-icon exactness** — the palette `tbPaletteLineIcon()` was upgraded for the v4.99.74 ship; canvas `tbDeviceIcon()` (the actual rendered nodes) still uses the original icon set — bring it in line with the monoline palette icons

## 2 · Topology Builder V2 polish

- **Page**: `#page-topology-builder-v2` (`features/topology-builder-v2.js` + `features/topology-builder-v2.css`)
- **Status**: v5.0.3 → v5.3.0 built the strangler-fig shell + 8 ships (design/simulate/trace/labs/3D/coach/grade/export). Modal/panel UI is already on-system, but ride the same end-of-rebrand polish as #1 — match the V1 revisions where they overlap, ensure the V2-specific surfaces (trace init panel, simulate dialog, labs picker, coach panel, 3D overlay) read as a single coherent product.

## 3 · Guided Topology Lab interior

- **Page**: `#page-guided-lab`
- **Status**: the lab **picker** was redesigned in v4.99.75. The interior **walkthrough** (step-by-step coaching, hints, gate, completion) hasn't had an explicit editorial pass — verify it inherits cleanly from the dg system or do a focused pass.

## 4 · Session interstitials

- **Pages**: `#page-session-transition` + `#page-session-complete`
- **Status**: not in the rebrand version history. These are the between-quiz transition + end-of-session screens. Probably small surfaces but visible — quick editorial pass: hairline, Fraunces hero number/headline, bronze CTA, no emoji.

## 5 · Spaced Repetition review session

- **Page**: `#page-sr-review`
- **Status**: the home **card** entry-point (`#sr-review-card`) was treated in v4.99.65; the actual **review surface** (the cards-due session UI) hasn't been called out as redesigned. The PR review v4.81.31 scrub touched logic; the visual treatment may still need the editorial pass.

## 6 · Topic Deep Dive view

- **Page**: `#page-topic-dive`
- **Status**: not in the rebrand version history. This is the AI-teacher "Tier A" deep dive view (`showTopicDeepDive` / `fetchTopicBrief`). Visual editorial pass: replace any leftover cards/emoji, accent the recommended next-action, ensure prose flows in `var(--t0)` body type.

## 7 · ACL Pass-Plan PBQ

- **Page**: `#page-acl-pbq`
- **Status**: ACL Builder + scenario picker were redesigned (v4.99.71 + v4.99.73). The **Pass-Plan PBQ** is a separate ACL surface (different `#page-acl-pbq` id) — confirm it inherits the editorial pass or do a focused pass.

## 8 · Monitor / admin

- **Page**: `#page-monitor`
- **Status**: legacy admin page (likely from the issue-tracker era). Either retire (if dead — grep for `showPage('monitor')` to confirm) or give it a quick editorial pass for completeness.

## 9 · Landing homepage proper

- **Page**: `landing/index.html`
- **Status**: many landing surfaces have been redesigned (cross-cert analytics v4.99.93, account/admin/my-certs v4.99.92, pricing/privacy/terms v4.99.92, baseline diagnostic v4.99.60-63). The **marketing homepage itself** (`certanvil.com/`) — `mockups/landing-homepage-redesign-concept.html` exists as a concept; verify whether it's been integrated. If not, integrate.

## 10 · Diagnostic email-report template

- **Path**: `landing/api/diagnostic/email-report.js` (the Resend HTML/plaintext template)
- **Status**: shipped v4.99.57 (D.6). The HTML email template's editorial treatment hasn't been explicitly noted — bronze accent, hairline rules, no purple inside the email body. Email clients are restrictive; use inline styles + table fallbacks where needed.

## 11 · PWA / mobile chrome

Small but visible surfaces from the Phase 4 / Phase 10 mobile work:
- **A2HS install banner** (Phase 4, v4.99.20+) — visual pass to remove the leftover `📲` if present, bronze CTA
- **Connectivity online/offline banner** (v4.99.49)
- **Desktop-only nudge** (v4.99.48) — already redesigned, but audit
- **Celebration toast** (`showMilestoneCelebration`, `showCelebrationToast`) — check it follows emil/motion + no purple
- **Streak Defender popup** (`#streak-defender`) — sub-component

## 12 · Daily Challenge full-quiz view

- The **card** on Home (`#daily-challenge-card`) is treated. The actual single-question quiz that fires on Play — verify it inherits Quiz's editorial pass (v4.99.68) or has a distinct surface. Quick audit.

---

## Suggested order when you return

1. **TB revision pass (#1)** — biggest, founder-flagged, longest-deferred
2. **Sessions interstitials (#4)** + **SR review session (#5)** — small, high-traffic, quick wins
3. **Landing homepage (#9)** — outward-facing, conversion-relevant
4. **TB V2 polish (#2)** — bundle with #1 or run as a parallel pass
5. **Guided Lab + Topic Dive + ACL PBQ (#3, #6, #7)** — secondary surfaces, batch them
6. **Mobile chrome audit (#11)** + **email template (#10)** + **Monitor (#8)** — closing punch list

---

## Anything else?

This is my best audit from the version history + the index.html page enumeration. If you spot a surface here that's actually done, or something missing, add it inline — easier than re-doing the audit cold.

**Last updated**: v5.5.12 (2026-05-19)
