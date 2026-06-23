# Handoff — CertAnvil mobile-fit pass #2 (landing + account + My Certs + hamburger)

**Date:** 2026-06-05 · **Repo:** `/Users/simioremosu/Desktop/Dev Projects/networkplus-quiz`
**Prod state:** `main` @ `515b092` = **v7.19.3, LIVE in prod** (pushed + Vercel deployed this session).

> Move this file into the repo if you want it durable (the prior one lives at
> `docs/certanvil-mobile-handoff.md`). Save-to-/tmp is the handoff-skill default.

---

## The job (next session)

Apply the **same minor mobile-fit policy** we just used on Home/Progress/Analytics to **4 more surfaces**. Policy, verbatim from the founder:

> *"Only job is minor mobile responsive adjustments — size up/down, nudge left/right, tighten spacing, reflow a grid column — so the existing content fits cleanly on a phone instead of overflowing or cramping."*

**Hard rules (learned this session, do not violate):**
- **Keep everything.** No redesign, no reorg, no progressive-disclosure/accordions. The founder loves these pages; only re-seat/reflow/resize what genuinely doesn't fit. (They corrected an over-reach earlier — don't repeat it.)
- **Desktop pixel-identical.** All fixes are mobile-only, gated `@media (max-width:480px)` and/or `@media (hover:none) and (pointer:coarse)`.
- **No design skills.** The founder explicitly released `design-taste-frontend`/`emil-design-eng`/`humanizer` — "just your expertise." Work directly, audit-first.
- **Verify everything** on the WebKit harness (geometry + screenshots) before claiming done.
- **Don't push to prod** — prep + bump, the founder runs the final `git push` (and the harness auto-blocks remote pushes anyway).

---

## Surface map (CRITICAL — two codebases, two deploys)

| Surface | Codebase | Key selector / file | Deploys via |
|---|---|---|---|
| **Hamburger menu** (mobile sidebar drawer) | **cert-app** | `#sb-mobile-toggle` → `toggleSidebarMobile()` → `#app-sidebar`; CSS in `dg-system.css`/`styles.css` (`.sb-item`, `.app-sidebar`) | `git push origin main` → `ci.yml` → Vercel prod |
| **My Certs popup** *(the no-scroll bug)* | **landing** | `#my-certs-modal` in `landing/index.html` (~line 3108, "MY CERTS MODAL · opened from account dropdown") | `deploy-landing.yml` (certanvil.com) |
| **My Account page** | **landing** | `landing/account.html` (`/account`) | `deploy-landing.yml` |
| **Landing page** | **landing** | `landing/index.html` (certanvil.com) | `deploy-landing.yml` |

- The **landing site is a separate codebase** (`landing/` subdir): its **own inline/linked CSS — NOT `dg-system.css`**, its own `sw.js` kill-switch, its own E2E. But it's the **same git repo**, so **one `git push origin main` ships both** (cert-app via `ci.yml`, landing via `deploy-landing.yml`).
- The cert-app account dropdown's "My Certs" link points at `https://certanvil.com/?modal=my-certs` (`auth-state.js:335`) — i.e., the popup the founder saw renders on the **landing** domain.

### The one confirmed bug (start here)
**My Certs modal (`#my-certs-modal`, landing/index.html) does not scroll** — content taller than the viewport is unreachable on a phone. Fix is almost certainly a mobile-only `max-height: ~85dvh` + `overflow-y: auto` on the modal body (mirror whatever pattern the landing's `#notify-modal` or other modals use). Verify against the landing E2E (below) — CSS-only is safe.

---

## Method (proven this session)

**Audit-first, measure don't guess.** For each surface: serve it, capture readable screenshots at 375px (iPhone SE) dark+light, dump element geometry to find clips/overflow, fix mobile-only, re-measure/re-shoot to confirm, then ship.

**Serving:**
- **cert-app:** `python3 -m http.server 3150` from the worktree (see Tooling). Harness `BASE` = `http://localhost:3150/index.html`.
- **landing:** `npx serve landing -l 3132` (**no `-s`** — it's multi-page, not an SPA; `cleanUrls` maps `/account`→`account.html`, matching prod `vercel.json`). Per `playwright.config.js`. The WebKit harness will need its `BASE` repointed to `http://localhost:3132/` + landing-specific surface navs (the current harness only knows cert-app pages).

**Harness tooling (in the existing worktree — reuse, don't rebuild):**
`/.claude/worktrees/feat-mobile-polish/.audit/`
- `harness.mjs` — full WebKit device-matrix (SE/iPhone14/Max/landscape × dark/light), seeds rich/empty/overflow state, measures `docOverflow`/`overflowEls`/`smallTapTargets`/input `zoomRisk`, screenshots. Cert-app focused.
- `capture-fit.mjs` — element close-ups + geometry + `'top'` viewport mode (used for the fit pass). Easy to repoint at landing.
- `coreloop.mjs` / `coreloop-cli.mjs` — quiz/exam no-key drivers (not needed here).
- The geometry-scan trick: parse `measurements-*.json` `overflowEls` for `scrollW > clientW` to find clipping cells objectively before screenshotting.

**Pass criteria:** `docOverflow=none`, no sub-44 tap targets, no input `zoomRisk`, and no *unintended* text clipping (ellipsis-by-design is fine — verify the CSS has `text-overflow:ellipsis` before "fixing").

---

## Lessons banked this session (apply directly)

1. **Specificity trap (cost real time):** the cert-app's editorial rules carry an `html[data-theme] body` prefix (`dg-system.css`). A plain mobile rule will LOSE the cascade to them even inside a `@media` block. Mobile overrides need the **same `html[data-theme] body` prefix + `!important`** to win. (This was the Progress topic-row name-truncation root cause — see commit `118b0bf`.) Landing has its own cascade; check its specificity similarly.
2. **Flex-`order` re-seat pattern:** to move a DOM-late, absolutely-positioned element (e.g. a stamp/badge) into the right spot on mobile without touching HTML: set the parent `display:flex;flex-direction:column` + `order` on children. (Readiness ribbon fix, commit `7d00e46`.)
3. **WAAPI vs CSS:** an `element.animate(...fill:'forwards')` transform is beaten by `transform:none!important` (important-author > animations in the cascade) — lets you keep a fade-in while killing a tilt on mobile.
4. **Stat-row clipping:** horizontal "[number] [label]" in a narrow column clips the label; stacking (`flex-direction:column`) gives the label the full width.
5. **Grid reflow:** 2-col tile grids whose long single words can't fit → 1-col on mobile (`grid-template-columns:1fr`).
6. **PROD localStorage hard rule:** NEVER `localStorage.setItem/clear` on a prod or `*.vercel.app` host (v4.81.x data-loss incident). Local server / preview / incognito only. Read-only on prod is fine.
7. **Landing E2E:** `playwright.config.js` has a gating `landing` project (`tests/e2e/landing.spec.js`) asserting the canonical 8-cert set on Account / My Certs / Cross-Cert Analytics. It checks cert DATA, not layout — CSS-only fixes won't break it, but run it before shipping landing changes.

---

## Ship process (do NOT push — founder pushes)

Reference: [`SHIP_CHECKLIST.md`](SHIP_CHECKLIST.md) (root). Fast-lane (UI/CSS only; no DB/auth/money/SW-fetch-logic).
- **Cert-app hamburger fix:** `node scripts/bump-version.js 7.19.4 "<one-liner>"` (updates app.js/sw.js/index.html/styles.css/package.json + CLAUDE.md stub) → `node tests/uat.js` (must stay **4005/4005**) → harness live-verify → commit `fix(mobile)` + `chore(release): v7.19.4`. UAT runs in the pre-commit hook.
- **Landing fixes:** edit `landing/*.html` CSS, no version bump (landing has no `bump-version`); they ride the same `git push origin main` and deploy via `deploy-landing.yml`. Run the landing E2E first.
- **One push ships both.** The founder's push sequence (because `main` has their uncommitted Phase-0 WIP on `app.js`/`auth-state.js`/`index.html`):
  ```bash
  cd "/Users/simioremosu/Desktop/Dev Projects/networkplus-quiz"
  git stash push -m "phase-0 wip"
  git merge --ff-only <branch>      # or it's already on main if you committed there
  git push origin main
  git stash pop
  ```
  Note: the founder's admin push **bypasses** the "UAT + Playwright" required check (normal for this repo); CI still runs post-push and Vercel deploys.

---

## State / don't-touch

- **`main` has uncommitted Phase-0 WIP** — modified `app.js`, `auth-state.js`, `index.html` + untracked `analytics.js` (PostHog telemetry wrapper, unrelated), `mockups/*`, `docs/plans/`. **DO NOT touch or commit these.** They cleanly survive a stash/ff/pop (verified this session).
- **Working setup:** branch off `main` @ `515b092`. A worktree already exists at `.claude/worktrees/feat-mobile-polish/` (now merged/shipped) holding the reusable `.audit/` harnesses + abandoned `mockups/p2-density/` scratch (the accordion mock was a wrong-direction over-reach — ignore/delete). You can keep working there or cut a fresh worktree (see `using-git-worktrees`).
- **Version tagging** lapsed after `v6.5.7` — repo doesn't tag v7.x ships; don't introduce tags unasked.
- **CLAUDE.md version-history** has grown past the "last 3" convention (v7.19.x stubs piled up) — a consolidation (trim to 3, older rows → `CHANGELOG.md`) is due whenever, low priority.

## What shipped this session (reference, don't re-do)
`feat/mobile-polish` → `main`, 9 commits, all live as **v7.19.3**:
- v7.19.1 overflow + iOS input-zoom + tap targets + showToast/scroll-lock/drawer-dvh
- v7.19.2 core-loop quiz/exam topbar overflow + in-card taps (≥44px)
- v7.19.3 readiness ribbon + drill-by-domain + mastery stats + Progress topic-row names
Audit notes: `docs/certanvil-coreloop-audit-2026-06.md`. All commit messages carry full detail.

## Suggested skills
- **None of the design skills** (`design-taste-frontend`/`emil-design-eng`/`humanizer`) — founder released them; work directly with judgment.
- `superpowers:using-git-worktrees` — if cutting a fresh isolated worktree off `main`.
- `superpowers:verification-before-completion` — before declaring any fix done (mirrors the harness-verify discipline used here).
- Project `SHIP_CHECKLIST.md` (doc, not a skill) governs the cert-app ship.
- Do **not** invoke `brainstorming` — this is fit-and-finish, not creative work (the founder was explicit).
