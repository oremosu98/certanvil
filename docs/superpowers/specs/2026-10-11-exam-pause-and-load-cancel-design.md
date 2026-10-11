---
up: "[[Drills MOC]]"
type: spec
status: active
updated: 2026-10-11
tags: [spec, exam, loading, cancel]
---
# Exam pause and Cancel while loading (design)

**Agreed 2026-10-11, v8.164.0.** Two founder asks on the same day, shipped together:

- "we need to have an option somehow to pause the exam and then continue. what if i have something critical come up like a phone call"
- "when you are generating a quiz/exam/anything on the app, whilst its loading you need to allow the option to cancel and go back to the home page"

Follows [[2026-10-11-exam-simulator-hardening-design]], which added saved progress and the real (never-pausing) clock.

## Pause

- **Pause button** in the exam header, next to Flag. Hidden in Hardcore mode, which stays a strict rehearsal.
- **Pausing** stops the timer, freezes the time left, releases the wake lock and saves state. The question area is replaced by one card: "Exam paused", the time left, "Resume exam", and a note that the real exam has no pause. The A–D keys are ignored while paused.
- **Resuming** rebuilds the deadline from the frozen time left, so a pause never costs exam time.
- **Leaving while paused** asks nothing, because nothing is running. The Home tile reads "Q23 of 90 · paused, 54 min left". A paused exam stays resumable for 7 days, measured from when it was saved. A running exam still expires when its clock does.
- **Honesty.** The result line adds "Paused twice, 6 min in total. The real exam has no pause." History records the paused time. The score is not changed.

## Cancel while loading

- **One button for every build.** The loading screen is shared by custom quiz, Marathon, guided session steps, Diagnostic, the Exam Simulator, Gauntlet, Why-Not and Drill Mistakes. "✕ Cancel" sits top-left in the skeleton's top bar, in the same place as the quiz's own "✕ Menu" exit, so it is always above the fold and the exit doesn't move when the quiz arrives. It is 44px tall on touch screens.
- **Generation sessions.** `_loadingProgressBegin` opens a session with an id and an `AbortController`. `cancelGeneration()` marks it cancelled, aborts the controller and goes Home.
- **In-flight requests stop.** `_claudeFetch` passes the session's signal into `fetchWithTimeout`. An abort caused by Cancel is reported as `AbortError`, never as a timeout, and `_claudeFail` re-throws it straight away with no error log and no error card. The signal is only attached while the loading screen is up, so later AI calls (teacher content, explanations) are never cancelled by an old session.
- **A cancelled build can never finish later.** Every builder takes a token when it starts and checks `_genAlive(token)` after each await, before it writes `questions` or calls `showPage`. This is the same class of bug as "a new quiz shows the old quiz" (v8.148.0), so the check runs on every path, including retries, top-ups and error handlers.
- **No confirm dialog.** Cancelling loses nothing the user made.

## Cross-platform

- **Pause** is plain state in `nplus_exam_state`, so Desktop, Safari, mobile web and iOS Capacitor behave the same. A paused exam survives tab eviction and WKWebView suspend because the time left is frozen, not derived from the deadline.
- **Cancel** uses `AbortController`, which `fetchWithTimeout` already relies on for timeouts on every target. The button is in the top bar on every viewport (checked at 1024×768 and 375×812).

## Testing

- UAT `340-exam-simulator.js`: pause and resume maths, the leave guard while paused, the 7-day expiry, the result line and the Hardcore hide.
- UAT `350-cancel-generation.js`: session rules (cancel kills a session, a new one is alive, no signal after the screen closes), the abort and `AbortError` lines, every builder checking its token, and the button being in the top bar.
- Live on localhost with a slow stubbed AI call:
  - **Marathon:** Cancel went Home at once, the request was aborted, and 21 s later the page was still Home with `questions` untouched.
  - **Exam:** the same, plus no saved exam state and no Resume tile.
  - **Mobile:** the same at 375 px.
  - **Pause:** the paused card showed, A–D were ignored, leaving gave no prompt, and resume restored the time.

## Rejected approaches

- **Pause in Hardcore mode:** Hardcore exists to be strict, so it keeps no pause.
- **Pause by hiding the tab** (the old behaviour, removed in v8.162.0): it paused silently and flattered timing. An explicit pause is visible and reported.
- **Cancel under the progress bar** (first build): on a 768 px laptop screen it sat below the fold, which defeats the point.
- **A confirm on Cancel:** nothing is lost, so the extra step only slows the exit.
- **Letting the cancelled build finish quietly in the background:** it spends AI quota on questions nobody sees and races the next build for `questions`.
