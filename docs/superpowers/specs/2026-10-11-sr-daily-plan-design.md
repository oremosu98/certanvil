---
up: "[[Drills MOC]]"
type: spec
status: active
updated: 2026-10-11
tags: [spec, spaced-repetition, review]
---
# Daily review plan (design)

**Decided 2026-10-11.** The founder saw "Review 62 cards · 31 min" on Home and called it excessive. He delegated the design: "go with the best recommendation, full permission".

## What was actually wrong
1. **A lost cap made the tile show the whole backlog.** `SR_SESSION_CAP` (30) became closure-private when `features/sr-review.js` was split out of app.js. `home.js` guards it with `typeof` and silently falls back to the full due count. That is why the tile showed "62 cards · 31 min" when a session really serves 30. In `_computeNextBestMove` (app.js) the bare reference throws, the surrounding `try` swallows it, and reviews never become the next best move.
2. **The real problem is backlog, not a spike.** The founder's backup on 2026-10-11 held 69 active cards. 65 had never been reviewed, some dated back to July, and new ones were added on every quiz day. The queue has a session cap but no daily plan. Finishing 30 makes Home ask for the next 30 straight away, so the pile never feels finishable and goes untouched.
3. **Same-day intervals bunch.** Cards reviewed together with the same ease come due together again, which recreates spikes.

## Decision
A **daily review plan**, the way Anki uses a daily limit, plus Anki-style **load balancing** of intervals.

- **Reviews per day = the existing session-size setting** (10 · 20 · 30 · All due, default 30, about 15 min). No new setting. The settings label and hint now describe it as a per-day number.
- **Today's plan** = `min(due, perDay − reviewedToday)`. `reviewedToday` is a per-local-day count of real review marks, stored in `nplus_sr_day`. Practice top-ups and same-session retries do not count. Once today's plan is done, Home stops leading with reviews and falls through to the next recommendation.
- **Overflow is spread.** The forecast shows the plan, not raw due counts. Day i plans `min(perDay, dueThatDay + carried)` and the rest carries forward. Home says how far the rest is spread, e.g. "32 more spread over the next 2 days".
- **Exam catch-up.** With an exam booked, if the cards due before exam day don't fit at the chosen rate, `perDay` rises to `ceil(cardsBeforeExam / daysToExam)`, capped at 50. Choosing "All due" turns the plan off.
- **Order inside the plan is unchanged.** It is still exam-priority (weak + high blueprint weight) when an exam is booked, oldest-overdue otherwise.
- **Load balancing.** When an interval is 3 days or more, `_srSchedule` picks the least-loaded day within ±10% (minimum ±1 day) of the computed interval, never past the exam cap. Ties keep the exact interval. New cards stay at 1 day, since learning steps shouldn't be fuzzed; the daily plan absorbs any overflow.
- **"Review more now" stays available.** The complete screen says today's plan is done and offers a secondary button to review ahead, for anyone cramming. Extra reviews count toward today and reschedule normally, which thins the days ahead.
- **Free tier is unchanged:** 5 a day. Today's plan = `min(plan, freeLeft)`.

## Surfaces
- `features/sr-review.js`: `_srPlan()`, `getSrTodayPlan()`, `buildSrPlan()` (forecast with carry), `_srReviewedToday` / `_srBumpReviewedToday`, `_srLeastLoadedDay`. Changes to `_srSchedule` (optional `queue` arg), `startSrReview`, `_srEndReview`, `renderSrForecast`, `renderSrReviewCard`.
- `features/home.js`: the Recommended tile uses the plan.
- `app.js`: `_computeNextBestMove` and the quota modal use the plan.
- `index.html`: settings label and hint.

## Cross-platform
This is pure logic plus copy, and the layout is unchanged. The day key uses the device's local date (`en-CA`), so the plan rolls over at local midnight on every target. `nplus_sr_day` is per device and is not cloud-synced. A second device can show up to one more day's plan, but the queue itself syncs, so cards already reviewed elsewhere are no longer due. That trade-off is accepted.

## Testing
- vm fixtures: the plan caps today at `perDay − reviewedToday`, carries overflow into later days, applies exam catch-up, and "All due" disables it.
- The load balancer moves a ≥3-day interval to a lighter day within the window and never past the exam cap. Short intervals are untouched.
- Regression: Home and next-best-move never read a bare `SR_SESSION_CAP`.
- Older tests that pinned the backlog-in-headline formula are updated on purpose.

## Rejected approaches
- **Display fix only** (restore the cap on the tile): it hides the symptom, but the backlog still never feels finishable.
- **Spreading new cards' first review over 1–3 days:** it delays the first re-exposure of a fresh miss, which is the review that matters most. The daily plan already absorbs the overflow.
- **A new "reviews per day" setting next to session size:** two numbers for one idea. The session size already is the daily amount.
