# Unplanned-Failure Hardening + Error Observability — Design Spec

**Date:** 2026-07-19
**Status:** Approved design, pending founder spec review
**Lane:** Fast lane for the main slice (no schema change, no auth/money/SW surface).
**Exception:** wiring `logServerError` into `landing/api/diagnostic/*` (magic-link +
claim flow) touches an auth-adjacent gated-lane trigger — that wiring ships as a
separate gated follow-up slice (feature branch → PR → preview), not on `main`.

## Problem

CertAnvil handles *planned* failures well (quota 429s, auth 401s, validation 4xx — all
mapped in `api/ai/generate.js`) but has three unplanned-failure holes, confirmed by a
codebase survey on 2026-07-19:

1. **No timeouts anywhere.** Zero `AbortController` usage client or server. A hung
   Anthropic or Supabase request means an indefinite spinner; the proxy's upstream call
   (`api/ai/generate.js:252`) can hit Vercel's wall-clock kill instead of returning a
   clean error.
2. **Inconsistent user-facing failure UI.** `unhandledrejection` is deliberately quiet
   (`app.js:1441`), so a dropped AI request shows nothing unless the call site opted in —
   coverage varies across `_claudeFetch`'s call sites (11 direct sites; 16 upstream
   functions counting indirect callers through shared drivers).
3. **Telemetry blind spots.** The v7.78.0 `client_errors` reporting only sees *uncaught*
   errors. Silent `catch (_) {}` blocks, handled non-2xx responses, resource-load
   failures, and all server-side errors are invisible — so the error dashboard
   under-counts reality. This matters acutely post-launch, when logged errors drive RCA.

## Goals

- Every network call has a timeout budget and aborts cleanly.
- Every *blocked-flow* failure shows the user a designed error surface with a retry path.
- Every meaningful failure — including previously silent ones and server-side ones —
  lands in `client_errors` with enough context for RCA.
- A repeatable review loop surfaces logged production errors to the founder as a ranked
  triage brief (weekly by default, on demand any time).

## Non-goals

- No changes to `sw.js` (gated-lane trigger; slow to recover from a bad deploy).
- No schema migration — server errors reuse the existing `client_errors` table.
- No changes to the planned-failure paths (quota modal, auth prompt, offline banner,
  proxy 4xx mapping) beyond wiring them into the taxonomy below.
- No third-party error service (Sentry etc.) — Supabase + Claude review loop is the
  right size at this stage.

## Design

### 1. Timeouts — `fetchWithTimeout`

A single helper (client copy in `app.js`, server copy shared across `api/` and
`landing/api/`):

```js
fetchWithTimeout(url, opts, { timeoutMs, label })
// AbortController; on expiry throws TimeoutError { name:'TimeoutError', label, timeoutMs }
```

Budgets (tune during build if measurement disagrees):

| Call | Budget |
|---|---|
| AI generation, client (`_claudeFetch`) | 90 s |
| AI generation, proxy → Anthropic upstream | 75 s (proxy returns clean 504 JSON + `error_id`) |
| Supabase quota RPCs / table ops (where wrapped) | 15 s |
| Resend, Turnstile | 10 s |
| Cloud-store flush | 20 s |

Wiring: `_claudeFetch`, the server proxy upstream call, cloud-store flush, the
bug-report queue, and the notify/magic-link endpoints. Supabase SDK calls are wrapped
only where a hang blocks the user (quota RPCs); background SDK traffic keeps the SDK's
own behavior. "Blocks the user" Supabase call sites to wrap: `get_daily_quota_usage`
(`app.js:444`), `consume_daily_quota`, `ai_rl_check_and_increment` (server side), and
the claim-flow lookups — background table sync stays on SDK behavior. A timeout is a
first-class logged event (`logError('timeout:<label>')`), not just a thrown error.

### 2. End-user error surfaces — the three-tier taxonomy

Every unplanned failure maps to exactly one tier. Planned failures keep their existing
dedicated surfaces (429 → quota modal, 401/needsAuth → sign-in prompt, offline →
connectivity banner).

| Tier | When | Surface |
|---|---|---|
| **1 · Toast** | Transient, non-blocking: background sync, report queue, analytics | Existing toast system, human copy |
| **2 · Inline error card** | Blocked flow: AI call fails (timeout / network / 5xx / 504 / unexpected 4xx) inside quiz, exam, drill, topic-dive, deep-dive | Replaces the loading area *in place*: plain-language message, **Retry** button re-firing the same call, small error reference (`error_id` or fingerprint) for support/RCA correlation |
| **3 · Section/page fallback** | Boot or resource failure: script/CSS load fails, feature panel can't initialize | Branded "something went wrong" state with a reload action — never a half-rendered page |

Copy rules (humanizer pass applies): always distinguish "your connection" from "our
side" ("The AI didn't respond. This is on our side — your progress is safe."); never
blame the user for a 5xx; never show raw error text or stack fragments; the error
reference renders small and copyable.

Mechanism for tier 2: `_claudeFetch` gains an optional `errorSurface` contract — call
sites (or their shared drivers) register a container + retry thunk; on unplanned
failure `_claudeFetch` renders the card there, marks `err.userFacing = true`, and runs
spinner-cleanup. Call sites without a registered surface fall back to tier 1 toast +
cleanup, so no path is ever silent. The quiet-`unhandledrejection` design stays: it
remains the noise filter, while the chokepoint guarantees AI failures are never
swallowed by it.

**Mockup-first:** all three tiers are authored in `mockups/error-states-concept.html`
(starter tokens copied from `design/brand/mockup-starter-tokens.css`, BRAND.md read
first), run through the 4-stage visual pass, and founder-approved before
implementation. The mockup shows each tier in situ (card inside a quiz frame, toast,
page fallback) plus copy variants for timeout / network / server-side.

### 3. Silent-failure closure

- Every `catch (_) {}` becomes `catch (e) { logError('swallowed:<context>', e) }` with a
  severity tag (`info` for cosmetic paths like quota-chip refresh, `warn`/`error` for
  functional ones).
- Handled non-2xx responses at the proxy-facing client paths log as
  `logError('api:<status>')` even when the UI handles them.
- New capture-phase `window.addEventListener('error', …, true)` catches resource-load
  failures (script/CSS/img) — a currently invisible class — and can trigger the tier-3
  fallback for critical assets.
- **Flood control:** existing fingerprint dedupe stays; add a per-session auto-report
  cap (20) so a render loop can't spam the table. The local ring buffer (50 entries)
  still captures everything for bug-report attachment.

### 4. Server-side telemetry — `logServerError`

Shared helper for `api/` + `landing/api/`: fire-and-forget insert into `client_errors`
via the service-role key with `type='server'`, `page=<endpoint>`, message including
HTTP status and the existing random `error_id` (so Vercel logs and table rows
cross-reference), stack when available. Never awaited on the response path; failures to
report are swallowed (reporting must never break serving).

Wiring, in two slices per the lane note above:
- **Fast-lane slice:** every error branch of `api/ai/generate.js` and
  `landing/api/notify.js`.
- **Gated follow-up slice:** `landing/api/diagnostic/signup-magic-link.js` (magic-link
  + claim flow live here) — auth-adjacent, so branch → PR → preview before merge.

### 5. Founder review loop — RCA pipeline

- **`error-triage` project skill** (`.claude/skills/error-triage/`): queries
  `client_errors` (Supabase MCP in-session; documented SQL fallback), groups by
  fingerprint, splits client vs server, ranks by count × recency × severity, and
  produces a triage brief: top error groups, first/last seen, affected pages/versions,
  plausible root-cause hypotheses, and a suggested next action per group (fix now /
  watch / mute fingerprint). The brief is the artifact the founder reviews to plan RCA
  and fixes.
- **Weekly automation:** one added step in the Monday `groundskeeper` sweep invokes the
  skill. Post-launch the cadence can tighten to daily by scheduling the skill directly.
- Muting: a documented ignore-list inside the skill (not the DB) so noisy known
  fingerprints can be suppressed from briefs without losing the raw rows.
- Retention/pruning of old rows: out of scope for v1; the brief reports table row count
  so growth is visible.

## Cross-platform (HARD RULE — Desktop, Safari/WebKit, mobile web, iOS Capacitor)

Every surface and behavior in this feature ships for all four targets, not just
desktop Chrome:

- **iOS Capacitor / WKWebView suspend:** the OS suspends the webview when
  backgrounded, so an in-flight request resumes as an apparent timeout. The
  timeout path checks `document.visibilityState` history (was the page hidden
  during the wait?) and treats suspend-aborts as silent auto-retry candidates,
  never as "our side" server errors.
- **`navigator.onLine` is unreliable on iOS/Safari:** the offline banner stays a
  hint; it never gates the Retry button. Retry always attempts the real request.
- **Aggressive tab/webview eviction (mobile Safari):** telemetry that races
  page unload is not trusted to a late fetch — the localStorage ring buffer is
  the durable record, and queued reports drain on next boot (existing pattern).
- **Touch ergonomics:** error-card and fallback buttons ≥44px touch targets;
  toasts respect safe-area insets (`viewport-fit=cover`); hover states stay
  gated behind `(hover:hover) and (pointer:fine)`.
- **Timeout budgets verified on throttled cellular profiles**, not just desktop
  broadband — the 10–15s Supabase budgets are the ones most likely to need
  loosening on 3G-class links; measure before tightening.
- **Live-verify runs on all of:** desktop Chrome, desktop Safari (WebKit), a
  mobile-width viewport, and the iOS Capacitor build per IOS_TESTING.md.

## Testing

- **UAT additions (`tests/uat.js` / Playwright):** mocked hanging fetch → inline error
  card appears with Retry + error ref, spinner cleared; Retry re-fires and succeeds;
  per-session report cap enforced; resource-failure listener fires tier-3 fallback.
- **Server:** proxy timeout path returns 504 JSON shape with `error_id`;
  `logServerError` inserts a `type='server'` row; response path unaffected when the
  insert fails.
- **Live verify (live-verify skill):** drive a local server with network throttled /
  request blackholed; confirm each tier renders per approved mockup on Desktop +
  WebKit. Never write user-state localStorage on prod.

## Rejected approaches

- **Global `window.fetch` monkey-patch:** invisible magic; fights Supabase SDK
  internals; forces one timeout budget onto calls with very different needs.
- **Per-call-site timeout/error handling:** 16+ AI sites plus ad-hoc Supabase calls
  guarantees drift — the exact cause of today's inconsistency.
- **New `server_errors` table:** cleaner separation but a schema migration → gated
  lane; not worth the ship friction when `type='server'` separates rows fine.
- **Vercel-logs-only for server errors (status quo):** keeps the server half invisible
  to the review loop.
- **In-app founder error dashboard:** real branded UI work for an audience of one, and
  it doesn't do the RCA thinking; the triage brief does.
- **On-demand triage only (no schedule):** relies on the founder remembering to run it —
  weakest exactly when it matters most, right after launch.
- **Meaningful-catches-only instrumentation:** pre-launch we'd be guessing which
  failures matter, recreating the blind spot; throttled report-everything is safer.
