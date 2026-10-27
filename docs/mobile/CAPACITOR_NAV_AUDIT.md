# Capacitor navigation + external-link audit (Option A: certanvil.com origin)

Re-audited 2026-10-19 on `feat/capacitor-ios-wrapper` (the June inventory in the wrapper plan
had stale line numbers). Plan: `docs/superpowers/plans/2026-06-27-capacitor-ios-prewrap-and-wrapper.md`.

Rule: under Option A the webview runs on the `certanvil.com` property, so navigations to
`certanvil.com` and its per-cert subdomains stay IN the webview. A link goes to the system
browser only when it is genuinely off-property and not part of a core flow.

## A. Keep IN the webview (same property)

| Where | What | Decision |
|---|---|---|
| `app.js:4442` | sign-in: `location.href = 'https://certanvil.com/?action=signin&return=…'` | KEEP IN-APP. Magic-link web flow; native Apple/Google sign-in is G-2. |
| `features/diagnostic.js:878` | `location.href = window.buildSignInUrl()` | KEEP IN-APP (same flow). |
| `index.html:409` | "Sign in" link → `certanvil.com/?action=signin` | KEEP IN-APP. |
| `auth-state.js:240` | cert switcher → `https://aplus.certanvil.com/?exam=…` | KEEP IN-APP (cert switch is a core flow). |
| `auth-state.js:258` | cert switcher → `https://<targetHost>/` (per-cert subdomains) | KEEP IN-APP. |
| `auth-state.js:341` | account menu → `certanvil.com/account` | KEEP IN-APP. |
| `auth-state.js:347` / `:350` | account menu → `/?modal=my-certs`, `/?modal=analytics` | KEEP IN-APP. |
| `auth-state.js:353` | account menu → `certanvil.com/` | KEEP IN-APP. |
| `auth-state.js:357` | account menu (admin) → `certanvil.com/admin` | KEEP IN-APP. |
| `features/quiz-engine.js:1599` | "Study: …" resource link | Already in-app (opens Topic Deep Dive), no navigation. |

## B. Go-Pro CTAs → deferred to G-3 (do not touch in the wrapper work)

All open `https://certanvil.com/pricing` with `target="_blank"`. Apple Guideline 3.1.1 forbids
pointing iOS users at web purchase, so the build is TestFlight-runnable but NOT App Store
submittable until the G-3 purchase coordinator replaces these.

| Where | CTA |
|---|---|
| `app.js:717` | quota chip tooltip "Upgrade to Pro" |
| `app.js:788` | quota-exceeded "Upgrade to Pro · $9.99/mo" |
| `app.js:943`, `app.js:1045` | drill paywall "Go Pro — unlimited" |
| `features/sr-review.js:1180` | spaced-review continue CTA |
| `index.html:1831`, `index.html:1853` | Settings "Go Pro" buttons |

## C. Open in the SYSTEM browser (genuinely external)

| Where | What | Decision |
|---|---|---|
| `features/reports.js:296` | bug-report toast `window.open(opts.url, '_blank')` (e.g. a GitHub issue) | SYSTEM BROWSER via the Task 4 policy. |
| any other non-`*.certanvil.com` `target="_blank"` link | external | SYSTEM BROWSER via the Task 4 policy. |
| `index.html:21` | `preconnect` to the Supabase host | NO ACTION (resource hint, not navigation). |

## D. Native behaviour to confirm on device (Task 7)

| Where | What | Decision |
|---|---|---|
| `app.js:1541`, `app.js:1581` | `navigator.share(...)` | CONFIRM it opens the native iOS share sheet. |
