---
name: live-verify
description: Drive a real rendered browser to prove a CertAnvil change works, at three moments — mockup review, localhost app drive, and post-deploy prod verification. Use whenever you've built or edited anything visual (a mockup, a component, a page, CSS, a live-bound interaction) and are about to claim it works. Complements, does not replace, `node tests/uat.js` / `npx playwright test` — those are the automated regression floor; this is the human-eye ceiling, performed by the agent. Covers the paid-for gotchas of doing this through the Browser pane and Chrome MCP tools (stale stylesheets, screenshot races, hidden-tab throttling, unreliable computed-style reads, prod localStorage ban, cert-pack lazy-load).
---

# live-verify — the browser-verification discipline

Headless UAT + Playwright can pass while real users see broken UI. It happened repeatedly across the v6.5.x run (see CLAUDE.md's post-deploy section), and it happened again in Wave 3: `simLabValidateWiremapFidelity`'s CSS was technically correct — a `color-mix()` border tint on `.sl-sel` — and completely invisible to a human eye. No computed-style assertion catches that. Looking at the actual pixels did.

**The rule:** Playwright answers "do the assertions someone wrote still pass, on a pristine profile?" Live-verify answers "would a human looking at this see what we intended?" Run both. Neither substitutes for the other.

## When to use

Any time you've touched something with a runtime visual surface and are about to say "done", "shipped", or "verified" — a new mockup, a component build, CSS, a live-bound interaction, a page. Skip it only for pure backend/data/docs changes with no rendered surface, or work still behind a flag that's off in prod.

## The three moments

Live-verify is the same discipline performed at three different points in a feature's life. Don't wait for "post-deploy" to be the first time you look.

### 1. Mockup review (during brainstorming/design)

Open the mockup at `http://localhost:3131/mockups/<name>-concept.html` in the Browser pane. Screenshot it. Toggle dark/light. Resize to mobile (375×812) and check for clipping/overflow — anything positioned with `right: -N%` or similar off-panel offsets is a clipping risk at narrow viewports; measure it (`getBoundingClientRect()`), don't eyeball it. Drive any interactive flow to its end state (see "Forcing a flow to its end state" below) before calling the mockup done.

### 2. Localhost app drive (mid-build, and again before a PR)

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
python3 -m http.server 3131
```
Drive the REAL feature through the app, not a standalone mockup file — mount the actual scenario/page via the real launch path, click through as a user would (not shortcut JS calls), and check both themes + mobile. This is where cache and lazy-load gotchas below actually bite; a raw mockup file skips them.

### 3. Post-deploy prod verification (after ship, mandatory)

Cache-bust navigate the prod URL, confirm the deployed version, reproduce the user's exact click path, measure real DOM rects, walk the full flow end-to-end. **Never** skip this because CI passed — CI runs on a pristine profile and never hits the SW/CDN cache a returning user has. Full checklist: CLAUDE.md's "Post-deploy verification" section.

## The gotchas (all paid for — don't re-learn them)

- **Hidden-tab throttling (new, 2026-07-11).** While a Browser-pane tab is backgrounded (`document.visibilityState === 'hidden'`, common mid-way through a `javascript_tool` script that drives multiple steps), `requestAnimationFrame` callbacks don't fire and CSS transitions don't run. A `.reveal`-style rAF-triggered entrance will read as permanently stuck at `opacity: 0` in a scripted probe that never re-fronts the tab. **Fix:** front the tab (a `screenshot` call fronts it) before concluding an animation is broken, and re-check after fronting.
- **Screenshots race first paint.** A blank screenshot right after navigate/reload is not proof of a broken page. Add a `wait` (1-3s) before concluding something didn't render, especially anything gated behind a `reveal`/`vis` class toggled via `requestAnimationFrame`.
- **Stale-stylesheet trap.** `dg-system.css?v=` is cached by URL. Page-level `?_cb=` cache-busting on the HTML does NOT refresh a separately-cached stylesheet. Append a fresh `<link>` with its own cache-buster before trusting any computed style you read.
- **`getComputedStyle` is unreliable in the preview tool** for some properties. Prefer `getBoundingClientRect()` deltas or a screenshot when confirming a visual change actually happened.
- **Compositor can serve stale frames** after a scroll or resize action times out. If a screenshot looks wrong after a slow interaction, force a recomposite with `resize_window` before trusting it.
- **The A+ Core 1 seed bank lazy-loads per cert.** `window._simLab.slBank('aplus-core1')` returns `[]` until `features/sim-lab-seed-aplus-core1.js` is injected. In a live browser, append that `<script>` manually before mounting an A+ scenario (same pattern applies to other cert packs).
- **`curl`/`wget` are hook-blocked.** For any HTTP check from inside a shell command (e.g. confirming a prod version string), use `ctx_execute` with `fetch()` instead.
- **Prod version check is unreliable via `index.html` grep** — the version badge is client-rendered and `index.html` may contain unrelated `vX.X.X` strings. Check the deployed, minified `app.js`'s `APP_VERSION` and match loosely.
- 🚨 **NEVER write to `localStorage` on a prod or `*.vercel.app` host.** `localStorage.setItem/removeItem/clear` via `javascript_tool` on a live host overwrites the user's real `nplus_*` progress with no undo — this rule was bought with a real v4.81.x data-loss incident. Verify on `localhost`, a Vercel preview deploy, or a fresh incognito window. Read-only evals on prod are fine.
- **Playwright's full suite has ~18 pre-existing flaky/failing tests** (sidebar nav, landing cert catalog) unrelated to most Sim Lab work. Confirm any failure touches a file you actually modified before chasing it.

## Forcing a flow to its end state

Don't just screenshot the initial render — drive multi-step flows (a PBQ's phases, a form, a wizard) to completion so score-conditional or state-conditional copy/branches actually get exercised. Pattern (adapt selectors/ids to the component):

```js
(() => {
  const sel = document.querySelector('#some-select');
  sel.value = 'the-option-value';
  sel.dispatchEvent(new Event('change'));
  document.getElementById('primary-btn').click();
  return new Promise(res => setTimeout(() => {
    // read the resulting DOM state here
    res(JSON.stringify({ /* whatever proves the branch fired */ }));
  }, 350));
})()
```
Chain `setTimeout` steps for multi-phase flows (grade → advance → grade → show result). This is how the Wave 4 mockup's `<100%` score-conditional Pro copy got proven to actually fire, not just exist in the source.

## Checklist before claiming "verified"

- [ ] Screenshot taken (not just DOM/console inspected) — visual claims need visual proof
- [ ] Both themes checked (light is the founder's primary theme, but both ship every time)
- [ ] Mobile viewport checked if the layout has any narrow-viewport risk (percentage-based offsets, fixed-width elements, off-panel positioning)
- [ ] Any conditional branch (score thresholds, state toggles, error paths) actually driven to fire, not just read in source
- [ ] Any style claim backed by `getBoundingClientRect()`/screenshot, not a bare `getComputedStyle` read
- [ ] If prod: version confirmed on the deployed bundle, cache-bust navigated, user's real click path walked, zero localStorage writes
