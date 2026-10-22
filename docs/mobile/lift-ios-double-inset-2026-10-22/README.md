# Lift phone headers: doubled top safe area (22 Oct 2026)

iPhone 17 Pro Simulator, the real app (`com.certanvil.app`, debug build), signed out, pointed at a local
server from this branch. Before = `main` at v8.188.2. After = this branch.

## Cause

Inside the app the web view is full-screen (innerHeight 874) and `env(safe-area-inset-top)` is 62px.
`styles.css` already gives `body` `padding-top: env(safe-area-inset-top)`, so any header in normal flow
starts under the status bar. Headers padded with `max(Npx, env(safe-area-inset-top))` added the 62px a
second time.

Pages that are `position: fixed; inset: 0` (Progress, Analytics, Exam, Exam results) escape the body
padding: their header sits at y=0, so they still need `env()`. Those are unchanged.

## Measured (header content top, y in pt)

| Screen | Before | After | Change |
|---|---|---|---|
| Drills (reference, plain 14px) | 86 | 86 | none |
| Home `.ih-topbar` | 136 | 81 | `max(12px, env())` → `12px` |
| Custom quiz `.ic-topbar` | 154 | 95 | `max(8px, env())` → `8px` |
| Quiz `.quiz-topbar` (+ `#short-notice` top) | 137 | 84 | `max(13px, env())` → `13px` (notice `22px`) |
| Quiz loading `.iq-qbar` | 136 | 82 | `max(13px, env())` → `13px` |
| Results `.ir-app-chrome` | 136 | 79 | `max(10px, env())` → `10px` |
| Review `.ia-hdr` | 137 | 82 | `max(12px, env())` → `12px` |
| Home with a setup error | 196 | 141 | via `.ih-topbar` |
| Progress, Analytics, Exam, Exam results | 68–74 | same | kept (fixed pages) |

`#setup-err` itself is not doubled: its visible-state `margin: 0 20px 12px` outranks the `max()` rule.
The `position: fixed` toasts (celebration, success, Sim Lab sheets) are viewport-relative, so their
`env()` offsets are correct. `.ir-mtoast` is not rendered by any script.

Some content differs between before and after (greeting, momentum) because the quiz fixtures added
local history on the localhost origin between runs. Only the header position matters here.
