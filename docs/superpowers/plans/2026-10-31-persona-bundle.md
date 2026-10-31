# Persona Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 30 Oct persona bundle (18 items). It covers:
- an honest streak with warnings
- quiz resume
- honest copy
- one next step on Home
- the exam outcome
- the My certs hub
- reminders after drifting
- an honest forecast and a PBQ note
- Why this score and the book-it checklist
- no repeat questions
- the AI budget
- a fast first question
- Suggest a cert, with its admin page
- the deletion moments, plus PR #532

**Architecture:** Each phone surface is a lift of its approved June E2E drawing (`.claude/worktrees/june-e2e/mockups/`, branch `feat/cert-ios-e2e`). Logic changes sit in the existing modules. Each new pure model is exported on `window` and tested in UAT by `_fnBody`. Three new per-cert data maps (exam dates, exam outcomes, readiness snapshots) use cloud-store's sibling-preserving merge. A new `cert_requests` table carries Suggest a cert.

**Tech Stack:** vanilla JS IIFEs (`features/*.js`), `lift-ios.css`, Supabase (RLS, migrations), Vercel functions (`api/`, `landing/api/`), Capacitor (`native-shell.js`), UAT (`tests/uat/*.js`), Playwright (`tests/e2e/*.spec.js`).

**Specs (binding, read the one each task names):** in `docs/superpowers/specs/`:
- `2026-10-30-streak-honest-design.md`
- `2026-10-30-quiz-resume-design.md`
- `2026-10-30-honest-copy-start-practising-design.md`
- `2026-10-30-home-one-next-step-design.md`
- `2026-10-30-exam-outcome-design.md`
- `2026-10-30-my-certs-hub-design.md`
- `2026-10-30-reminders-forecast-pbq-design.md`
- `2026-10-30-why-score-bookit-repeats-design.md`
- `2026-10-30-ai-budget-fast-start-suggest-design.md`
- `2026-10-30-deletion-moments-design.md`
- `2026-10-30-persona-bundle-visual-pass.md`, the final copy

Admin drawing: `mockups/admin-cert-requests-concept.html`.

## Global Constraints

- **Gated lane.** Branch `feat/persona-bundle` → PR → Supabase branch DB + Vercel preview → squash-merge. `cloud-store.js`, the migration and `api/ai/generate.js` are gated surfaces.
- **On-screen copy is verbatim from the specs and the drawings, after the visual pass.**
  - No em dashes.
  - At most one middle dot `·` per line.
  - British spelling.
- **Motion follows BRAND.md §6.**
  - Curve `cubic-bezier(0.16,1,0.3,1)`.
  - Reveals 520-560ms with a 60ms stagger.
  - Data motion 800-1100ms.
  - `transform` and `opacity` only. Entrances never below `scale(0.96)`.
  - `prefers-reduced-motion` collapses to fade only.
- **Entrance reveals rest visible and animate from hidden** (`animation: … backwards`). This is the WebKit Home gotcha; UAT 481 guards it.
- **Never write user-state localStorage on prod or `*.vercel.app`.** Use `localhost` or a preview with a test account.
- **Lift CSS changes need cache-busting.** Any change to `lift-ios.css` or `dg-system.css` bumps its `?v=` in `index.html`, then run `node scripts/stamp-css-versions.js` after the bump, never instead of it.
- **Cross-platform.** Every behaviour works on desktop, Safari/WebKit, mobile web ≤899px and the Capacitor iOS app. Notifications are iOS-only. The phone surfaces are gated `(max-width:899px)`.
- **Out of bounds.**
  - Don't touch the readiness formula (#139). The book-it checklist sits on top of it.
  - Don't commit `.github/workflows/vercel-incident-recovery.yml`.
  - Rejected: carrying progress across certs, the results main button following the day, and speed/guessing.
- **Founder actions (not code):**
  - paste the migration in the SQL Editor
  - add `RESEND_API_KEY`, `FOUNDER_EMAIL` and `AI_GLOBAL_DAILY_LIMIT` to the cert-app Vercel project
  - raise the Anthropic workspace cap to $100/month
  - OK the PR #532 offline copy
  - run the Apple delete retest after the ship

## Review Focus

1. **Switching certs across subdomains.** A Net+ flush must not wipe the Sec+ exam date, outcome or readiness snapshot. → Task 1, test `cloud-sync-sim: per-cert maps survive a sibling flush`.
2. **Midnight and clock changes.** A quiz at 23:50 local and one at 00:10 count as two days. A BST→GMT change doesn't break the streak, and the UTC-stored `last` from before the update stays valid. → Task 3 tests.
3. **Resuming after an app update or a cert switch.** A saved quiz from another cert, or with a missing question field, is discarded, not half-restored. → Task 6, test `resume: foreign-cert or malformed save is discarded`.
4. **Fast start with failing batches.** The person reaches the last ready question before the rest arrive; later batches all fail. → "Next question coming…", then a clean short-set finish. → Task 8 Playwright `fast-start: catch-up then short finish`.
5. **Offline writes.** An exam outcome or a Suggest a cert send while offline is queued, not lost or double-sent. → Task 11 (outcome via the cloud-store queue) and Task 13 (suggest retries on the next open; unique constraint).

---

## Phase A: Sync foundation (gated)

### Task 1: Per-cert maps in cloud-store, and a per-cert exam date

**Files:**
- Modify: `cloud-store.js:67-117` (`USER_DATA_KEYS`), `:371-447` (build/apply), `:531` (`CERT_SCOPED`), `:519-549` (exam_date column)
- Modify: `app.js:1143`, `:1186` (`STORAGE` entries)
- Modify: `features/readiness.js:490-512` (`getExamDate`, `setExamDate`, `getDaysToExam`)
- Test: `tests/cloud-sync-sim.js`, `tests/uat/310-cloud-sync-merge-first.js`, new `tests/uat/520-per-cert-maps.js`

**Interfaces:**
- Produces:
  - `STORAGE.EXAM_DATES = 'nplus_exam_dates'` (`{ [certId]: 'YYYY-MM-DD' }`)
  - `STORAGE.EXAM_OUTCOMES = 'nplus_exam_outcomes'` (`{ [certId]: { outcome:'passed'|'failed', score:number|null, date:'YYYY-MM-DD', predicted:number|null, at:ISO } }`)
  - `getExamDate(certId?) -> string|null` (defaults to `CURRENT_CERT`)
  - `setExamDate(iso, certId?)`
  - `window.getExamDates() -> {}`
- Merge: `CERT_SCOPED` becomes `['sr','activated','onb_skips','readiness_snapshots','exam_dates','exam_outcomes']`. These are merged per cert key with `Object.assign(existing[k], ours[k])`.

- [ ] **Step 1: Write the failing tests.**
  - cloud-sync-sim scenarios:
    - `per-cert maps survive a sibling flush`: cloud has `{exam_dates:{secplus:'2026-12-03'}, readiness_snapshots:{secplus:{score:612}}}`. A netplus device flushes `{exam_dates:{netplus:'2026-11-17'}, readiness_snapshots:{netplus:{score:553}}}`. The cloud then holds both certs in both maps.
    - `legacy exam date adopts the current cert`: local `nplus_exam_date='2026-11-17'` and no map. After `getExamDate()` returns `'2026-11-17'`, `nplus_exam_dates.netplus` equals it.
  - UAT 520:
    - `setExamDate('2026-12-03','secplus')` leaves netplus untouched.
    - `getDaysToExam()` uses the current cert's date.
- [ ] **Step 2: Run** `node tests/cloud-sync-sim.js && node tests/uat.js`. Expected: the new checks FAIL.
- [ ] **Step 3: Implement.**
  - Add both keys to `USER_DATA_KEYS`.
  - Extend `CERT_SCOPED`.
  - `getExamDate` reads `EXAM_DATES[cert]` and falls back to the legacy key (adopting it into the map once).
  - `setExamDate` writes the map and keeps the legacy key for the current cert. `profiles.exam_date` keeps receiving the current cert's date, for older clients.
  - Dispatch `ca:exam-date` as today.
- [ ] **Step 4: Run** sim + UAT + `npx playwright test tests/e2e/lift-b4.spec.js tests/e2e/lift-5d.spec.js`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(sync): per-cert exam dates, outcomes, readiness snapshots merge per cert`.

### Task 2: Bring PR #532 (deletion leftovers) onto the branch

**Files:**
- `cloud-store.js`, `features/home.js`, `landing/lib/account.js`, `tests/fixtures/fake-supabase.js`, `tests/cloud-sync-sim.js`
- e2e `landing-deletion`, `lift-5c`, `lift-c`; UAT 310

**Interfaces:** none new. Offline copy is per `2026-10-30-deletion-moments-design.md` §3 (it needs the founder's OK before merge).

- [ ] **Step 1:** `git cherry-pick` the four commits of `origin/fix/deletion-leftovers` (merge-base `a5c334a6`, head `5e1880af`). On conflicts, version and cache strings take the branch's current values. In `tests/fixtures/fake-supabase.js`, keep main's `get_daily_quota_usage` stub and the PR's `signOut`/`_removeSession`/`F.signOutOffline`.
- [ ] **Step 2: Run** `node tests/cloud-sync-sim.js`, `node tests/uat.js`, and `npx playwright test tests/e2e/landing-deletion.spec.js tests/e2e/lift-5c.spec.js tests/e2e/lift-c.spec.js`. Expected: PASS, including the PR's 4 sim scenarios and its 2 + 2 e2e cases.
- [ ] **Step 3: Commit** `chore: bring deletion leftovers (#532) onto the persona bundle`. Close PR #532 as superseded at ship.

## Phase B: Streak, Home and reminders

### Task 3: Local-date streak, honest when read

**Files:**
- Modify: `app.js:2952` (`getTodayQuestionCount`), `:3176-3191` (`getStreak`, `updateStreak`)
- Test: new `tests/uat/521-streak-honest.js`; update `tests/uat/480-ios-home-model.js` where it seeds streaks

**Interfaces:**
- Produces:
  - `_localDay(d?: Date) -> 'YYYY-MM-DD'`, from local fields (same logic as `ios-reminders.js:40`), on `window`.
  - `getStreak() -> {current, best, last, ended:boolean, endedFrom:number}`. It doesn't write.
    - `current` is 0 and `ended` is true when `last` is before yesterday (local).
    - `endedFrom` is the streak length that ended.
- `updateStreak()` keeps its signature.
- **UTC tolerance:** a stored `last` counts as today when it equals the local today or the UTC today. It counts as yesterday when it equals the local yesterday or the UTC yesterday.

- [ ] **Step 1: Write UAT 521** (vm with a fixed clock):
  - `23:50 and 00:10 local are two days`. Streak 1 becomes 2.
  - `stale streak reads as ended`: `last` 3 days ago, `current:5`. `getStreak()` returns `{current:0, ended:true, endedFrom:5, best:5}`, and storage is unchanged.
  - `UTC-stored last from before the update is still today`: UTC ahead of local, `last` = the UTC date. `updateStreak()` doesn't increment.
  - `getTodayQuestionCount counts by local day`.
- [ ] **Step 2: Run** `node tests/uat.js`. Expected: 521 FAILS.
- [ ] **Step 3: Implement.** Replace every `toISOString().slice(0,10)` in these three functions with `_localDay`.
- [ ] **Step 4: Run** the full UAT, then `npx playwright test tests/e2e/app.spec.js tests/e2e/lift-a.spec.js`. Expected: PASS. Pins on the old UTC text get updated with a comment.
- [ ] **Step 5: Commit** `feat(streak): local day, honest when read`.

### Task 4: Phone Home: streak line, one next step, resume and outcome cards

**Files:**
- Modify: `features/ios-home.js:53-113` (rec order, momentum), `:145-225` (html), `:264-283` (ACT)
- Modify: `lift-ios.css`
- Test: `tests/uat/480-ios-home-model.js`, `481-ios-home-view.js`, `tests/e2e/lift-a.spec.js`

**Interfaces:**
- Consumes:
  - `getStreak()` (Task 3)
  - `getExamDate()` / `EXAM_OUTCOMES` (Task 1)
  - `quizResumeState()` (Task 6)
  - `outcomeDue()` (Task 11)
- Produces:
  - `momentum.streakLine` copy, per streak spec §4.
  - `rec.kind ∈ 'exam'|'quiz'|'review'|'outcome'|'first'|'warmup'|'weak'|'nextcert'`, in that order (home-one-next-step spec §3; `nextcert` once passed).
  - ACT `rec` branches on `kind`: `quiz` → `resumeQuiz()`, `outcome` → `openLogResult()`, `warmup` → the existing 5-min Warmup launcher (the Quick start option's handler), `nextcert` → `openHub()`, everything else → `#primaryLaunch` as today.
- Removes the momentum "Pick up" line and `button.ih-mo-go`. The weak-spot subtitle becomes "10 questions, exam level, on {topic} (around {n}%)."
- `warmup`: last study day ≥2 local days ago, `due===0`, no saved exam or quiz.

- [ ] **Step 1: Update and add model tests in 480.**
  - Streak lines for alive / done / ended / none (exact copy from the spec).
  - Rec order: a saved quiz beats reviews; outcome due beats first.
  - `away 3 days, no reviews → kind 'warmup', title '5-min Warmup', sub 'Ease back in. 5 questions, foundational.'`
  - The weak sub names the topic.
  - View test (481): no `.ih-mo-go` rendered.
- [ ] **Step 2: Run** UAT. Expected: FAIL.
- [ ] **Step 3: Implement.** The model and html follow `cert-ios-home.html` (drawing variants `?v=quiz`, `weak`, `away`, `outcome`, `passed`, `streak-*`).
- [ ] **Step 4: Run** UAT + `lift-a.spec.js`. Expected: PASS. Add e2e `phone Home: one next-step card, no Practise it button`.
- [ ] **Step 5: Commit** `feat(home): honest streak line and one next step`.

### Task 5: Reminders: streak warnings, last call, drift nudges, tap routing

**Files:**
- Modify: `features/ios-reminders.js:12-31` (`planReminders`), `:68-73` (`inputs`), `:93-99`
- Modify: `native-shell.js:49-68` (`REMINDER_IDS`, an action listener)
- Modify: `features/sr-review.js:1178` (mark the day studied)
- Test: `tests/reminders-planner.test.mjs`, `tests/uat/513-ios-reminders.js`, `tests/e2e/lift-5d.spec.js`

**Interfaces:**
- `planReminders(now, s, d)` gains `d.streak = {current, lastDay}` and `d.lastStudyDay`.
- Notification ids:
  - daily: `5001+k` (k 0-6)
  - last call: `5008`
  - drift: `5009` (day 10) and `5010` (day 21)
- `REMINDER_IDS` becomes 5001-5010.
- Each notification carries `extra:{kind:'streak'|'daily'|'drift'}`.
- Native: `caNative.reminders.onTap(cb)`, via `LocalNotifications.addListener('localNotificationActionPerformed')`. `kind==='streak'` dispatches `ca:open-daily-challenge`, which starts the Daily Challenge.
- `IR.markStudied()` is called from sr-review after a review with `total>0`.

- [ ] **Step 1: Planner tests (copy verbatim from the reminders and streak specs).**
  - Streak alive, not studied: k=0 body is "Your 5-day streak ends tonight. One question keeps it."
  - Studied today: k=1 carries the streak line; k≥2 doesn't.
  - Last call at 21:00: only if the time is before 21:00 and today isn't studied. Body "Last call: your 5-day streak ends at midnight. One question keeps it.", id 5008.
  - Never more than 2 on one day.
  - Exam-tomorrow wins over the streak line.
  - Drift, 3+ days since study: body "It's been 3 days. A 5-minute warm-up gets you going again."
  - Drift nudges: on day 10 and day 21 after the last study, "One question, about a minute. Your Network+ progress is still here.", ids 5009 and 5010.
  - A review day counts as studied.
- [ ] **Step 2: Run** `node tests/reminders-planner.test.mjs && node tests/uat.js`. Expected: FAIL.
- [ ] **Step 3: Implement** the planner, the inputs (streak from `getStreak()`, last study day from the reminders state), the native listener and `IR.markStudied`.
- [ ] **Step 4: Run** planner + UAT + `lift-5d.spec.js`. Add e2e `tapping a streak reminder opens the Daily Challenge` with the plugin stubbed. Expected: PASS.
- [ ] **Step 5: Commit** `feat(reminders): streak warnings, last call, gentle drift nudges, tap opens Daily Challenge`.

## Phase C: Quizzes

### Task 6: Resume a quiz after the app closes

**Files:**
- Modify: `features/quiz-engine.js` (`pick` :1298, `submitMultiSelect` :1077, `submitOrder` :1236, `startQuiz`, finish)
- Modify: `app.js:2848-2850` (`confirmBack`)
- Create: `features/quiz-resume.js` (loaded after quiz-engine in `index.html`)
- Test: new `tests/uat/522-quiz-resume.js`, new `tests/e2e/quiz-resume.spec.js`

**Interfaces:**
- Produces:
  - `quizResumeSave()`
  - `quizResumeState() -> null | {topicLabel, answered, total, left, savedAt}`
  - `resumeQuiz() -> boolean`
  - `quizResumeClear()`
- Storage key `'nplus_quiz_resume'`, local only (not cloud-synced):
  - `{v:1, cert, savedAt, questions, current, log, score, streak, bestStreak, answered, quizFlags, topic, activeQuizTopic, diff, qCount, dailyChallengeMode, wrongDrillMode, msSelections, orderSequence}`
- **When it saves:** after each `log.push` in the three answer functions, and on `pagehide` and on `visibilitychange` (hidden).
- **When it clears:** on finish, on `confirmBack` → leave, and on `startQuiz` (a new quiz replaces it).
- **What it skips:** `examMode`, `gauntletMode`, `whyNotMode`.
- **Resume rule:** restore only when the save is <24h old, `cert===CURRENT_CERT`, every question has `question` and `options|type`, and `log.length` ≤ `questions.length`. Otherwise discard. Restoring sets the globals, then `showPage('quiz'); render();` at `current`. It never refetches.

- [ ] **Step 1: Write UAT 522 + e2e.**
  - `same questions in the same order with answers kept`: inject 10, answer 7, reload, resume. `questions` deep-equal, `log.length===7`, `current===7`, zero network calls to `/api/ai`.
  - `expired (25h) save is discarded`.
  - `foreign-cert or malformed save is discarded`.
  - `exit with ✕ clears it`.
  - `finishing clears it`.
  - `gauntlet/why-not/exam never save`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `features/quiz-resume.js` and its hooks. The Home card comes from Task 4 (`kind 'quiz'`, title "Finish your quiz · {left} left", sub "{topicLabel} · {answered} of {total} answered", link "Start fresh" → `quizResumeClear()` and re-render).
- [ ] **Step 4: Run** UAT + e2e (chromium + mobile-safari). Expected: PASS.
- [ ] **Step 5: Commit** `feat(quiz): resume the exact same quiz after the app closes`.

### Task 7: No repeat questions across days

**Files:**
- Modify: `features/quiz-engine.js:122-188` (startQuiz fill, cache fallback)
- Modify: `app.js:4473` (`_normalizeStemForDedup` reuse), `:4702-4728` (prompt block)
- Create: `features/seen-questions.js`
- Test: new `tests/uat/523-no-repeats.js`; keep `tests/uat/040…:348-356` pins green (append, don't rewrite pinned lines)

**Interfaces:**
- Produces:
  - `seenRecord(qs)` is called at finish for answered questions.
  - `seenFilter(qs) -> {kept, dropped:number}`: same fingerprint, or Jaccard ≥0.8 on stem words with the same right-answer text.
  - `seenRecentStems(topic, n=20) -> string[]`
  - `seenAnsweredWithin(qs, days=7) -> boolean`
- Storage `'nplus_seen_q'`: `{[cert]: [{fp, stem, ans, topic, at}]}`, last 30 days, capped at 1,500 per cert, local only.
- Prompt: when `seenRecentStems` is non-empty, append `"\n\nAlready asked recently (cover something else):\n- {stem}\n…"` after `${staleBlock}` at :4728.
- Cache: use `getCachedQuestions` only when `!seenAnsweredWithin(cached, 7)`. Otherwise fall through to the existing error box.
- Telemetry: `_fill.rounds` gains `{label:'repeats', dropped}`, so `_logQuizFill` carries it.
- Skipped for resume and wrong-drill.

- [ ] **Step 1: UAT 523.**
  - The filter drops an exact repeat and a reworded one with the same answer, and keeps a same-topic new fact.
  - The 30-day expiry and the 1,500 cap.
  - The prompt contains the "Already asked recently" block with ≤20 stems.
  - The cache is refused when answered within 7 days.
  - Drill mode skips the filter.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The filter runs after `validateQuestions` and inside each top-up round, so the deficit is refilled.
- [ ] **Step 4: Run** UAT (including 040, 430 and 120 pins) + `npx playwright test tests/e2e/lift-quizx.spec.js`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(quiz): remember what you've seen; no silent re-serve`.

### Task 8: First question as soon as the first batch is checked

**Files:**
- Modify: `app.js:4483-4532` (`fetchQuestions` gains `onBatch`)
- Modify: `features/quiz-engine.js` (startQuiz flow, render tail, next-question wait)
- Test: `tests/uat/040…` (update pins deliberately, with a comment), new `tests/e2e/fast-start.spec.js`

**Interfaces:**
- `fetchQuestions(key, qTopic, difficulty, n, staleSliceIdx, onBatch?)`. When `onBatch` is given, each settled batch calls `onBatch(qs)` as it resolves. The resolved value stays the merged set, which keeps the other callers unchanged.
- In `startQuiz`, the first batch runs through `aiValidateQuestions → validateQuestions → seenFilter`. Once it has ≥1 question, `showPage('quiz'); render()`. Later batches go through the same checks and append to `questions` (no duplicates by normalised stem). Top-ups run after all batches.
- When `current` reaches the end of `questions` while batches are pending, the screen shows "Next question coming…" (`#q-wait`) until the next append, or until all settle. Then it finishes with `_noteShortQuiz`.
- Telemetry: `_fill.firstQuestionMs` = ms from Start to first render, in `_logQuizFill` extra.

- [ ] **Step 1: e2e `fast-start`** (stub the proxy with per-batch delays):
  - `first question renders before the slow batch resolves`.
  - `catch-up then short finish`: answer the ready ones; the waiting text shows; the last batch 500s; results show the short-set pill.
  - `telemetry carries firstQuestionMs`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Keep the 040 and 430 pinned strings where they still describe the behaviour. Update the rest, with a `// 31 Oct fast-start` note in the UAT.
- [ ] **Step 4: Run** UAT + `lift-quizx`, `lift-a` and `fast-start` specs. Expected: PASS.
- [ ] **Step 5: Commit** `feat(quiz): start on the first checked batch`.

## Phase D: Readiness surfaces

### Task 9: Book-it checklist and the Why this score sheet

**Files:**
- Modify: `features/readiness.js:403-430` (`examReady` from the checklist), plus a new `getBookItChecklist`
- Modify: `features/ios-home.js` (readiness card tap → sheet)
- Modify: `lift-ios.css`
- Test: `tests/uat/120-…:1187-1197` (update the regex guards), `tests/uat/480-ios-home-model.js`, new `tests/uat/524-bookit.js`

**Interfaces:**
- Produces `getBookItChecklist(r, hist) -> {items:[{key,label,met,detail,next?:{label,act}}], met, total:4, ready}`. The checks, with copy from the why-score spec §2 and the drawing `?v=why`:
  1. `range`: `r.lowerBound >= EXAM_PASS_SCORE`
  2. `volume`: exam-level or harder answers (`byDiff` E+H totals) ≥ 300
  3. `areas`: every `r.domainAccuracy` ≥ `r.passAccuracy`
  4. `mocks`: ≥2 history rows `mode:'exam'` in the last 14 days with `scaledExamScore(pct) >= EXAM_PASS_SCORE`
- `examReady` is set to `getBookItChecklist(...).ready`. The score is unchanged.
- The first unmet item carries `next`: mocks → "Start a full exam", areas → "Practise {weakest domain}", volume → "Start an exam-level set", range → none.
- The sheet opens through `window.iosSettings.openSheet(html, onTap)` (ios-settings.js:240, exported :516). Its content follows `cert-ios-home.html` `#why`.

- [ ] **Step 1: UAT 524.**
  - Each check true/false at its boundary (299 vs 300, 1 vs 2 mocks inside 14 days and on day 15, lowerBound 719 vs 720).
  - `ready` only when all 4 hold.
  - `next` only on the first unmet item.
  - Home tier "Pass ready" only when `ready`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Analytics labels follow `examReady` automatically.
- [ ] **Step 4: Run** UAT + `lift-a`, add e2e `tap readiness opens Why this score`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(readiness): book-it checklist and Why this score`.

### Task 10: Honest forecast and the PBQ note

**Files:**
- Modify: `features/analytics.js:1944-1985` (`_anaBentoData`)
- Modify: `features/ios-analytics.js:85-107`
- Modify: `features/exam.js:926` (persist PBQs)
- Modify: `features/readiness.js` (new `getReadinessPace`)
- Test: `tests/uat/492-ios-analytics.js`, `390-readiness-trajectory.js`, new `525-forecast-pbq.js`

**Interfaces:**
- `getReadinessPace(now) -> null | {pointsPerWeek, projected, low, high, examDate, daysToExam, short:boolean}`:
  - It takes a least-squares slope of `scaledExamScore(pct)` over the history summary rows from the last 14 local days (≥5 rows, else `null`), × 7.
  - `projected = predicted + pointsPerWeek*daysToExam/7`, clamped to the cert's band.
  - `low/high = projected ∓ r.ciHalfWidth`.
  - `short = projected < EXAM_PASS_SCORE`.
- The `max(predicted, trend)` at analytics.js:1970-1977 goes.
- The phone insight and tile copy are verbatim from the reminders-forecast spec §2 (on pace / short / falling / no date). Falling means `pointsPerWeek < 0`.
- Exam summary rows gain `pbq:{right, count}` (fully right / total PBQs) at exam.js:926.
- PBQ note: sums the last 3 exam rows with `pbq.count>0`, giving "PBQs: {right} of {count} fully right in your last {n} full exams".
  - With no exam rows: "Take a full exam to practise PBQs too."
  - Hidden when the cert's exam simulator has no PBQ budget. The implementer reads the same budget source `submitExam` uses.

- [ ] **Step 1: UAT 525.**
  - The pace from a fixed history (rising, falling, <5 rows → null).
  - The projection to a date, with the range.
  - No max: a falling pace projects below today.
  - The PBQ row persisted.
  - The note text for 3 exams, for none, and hidden on a no-PBQ cert.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** UAT + `lift-b1.spec.js`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(analytics): forecast to exam day, can go down; PBQ note`.

## Phase E: Exams and certs

### Task 11: How did your exam go (one flow)

**Files:**
- Create: `features/ios-log-result.js` (overlay page, a lift of `cert-ios-log-result.html`)
- Modify: `features/ios-home.js` (outcome card, passed badge, `nextcert`), `lift-ios.css`
- Test: new `tests/uat/526-exam-outcome.js`, new `tests/e2e/exam-outcome.spec.js`

**Interfaces:**
- `outcomeDue(certId?) -> boolean`: the exam date is before today (local) and there's no `EXAM_OUTCOMES[cert]`.
- `openLogResult({preselect:'passed'|'failed'|null})`
- `saveExamOutcome({outcome, score, date})`:
  - writes `EXAM_OUTCOMES[CURRENT_CERT]` with `predicted` = the readiness snapshot score on or before the exam date (else the current snapshot)
  - `_cloudFlush`
  - the first time a cert is passed, shows the toast "You passed Network+. Well done." once
- **Home:**
  - The outcome card gives `rec.kind 'outcome'`. Its buttons are Passed / Didn't pass (each `openLogResult` preselected) and "I haven't sat it yet" → the exam-date sheet (`ios-settings` `ON.exam`).
  - Once passed: the "Passed" badge, plus `rec.kind 'nextcert'` "Pick your next cert". Its sub is "We predicted {n} on exam day. Your streak carries on with your next cert."
- **Fail screen:** "That's a hard exam." with "Set a new date" → the exam-date sheet.
- Score range check uses the cert scale (`EXAM_MIN_SCORE`/`EXAM_MAX_SCORE`).
- Copy is verbatim from the exam-outcome spec and the drawings.

- [ ] **Step 1: Tests.**
  - `outcomeDue` false on the exam day and true the day after.
  - Save passed → badge + nextcert.
  - Save failed → kind line + Set a new date.
  - Score optional, out-of-range rejected.
  - The celebration shows once.
  - e2e: Home Passed → screen preselected → Save → Home passed state.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(exam): log how the exam went; passed badge and next cert`.

### Task 12: My certs hub

**Files:**
- Create: `features/ios-hub.js` (a lift of `cert-ios-hub.html` as drawn on 30 Oct)
- Modify: `features/ios-home.js:280` (`cert` act → `openHub()`), `lift-ios.css`, `index.html` (host `#ios-hub` + script)
- Test: new `tests/uat/527-ios-hub.js`, new `tests/e2e/ios-hub.spec.js`

**Interfaces:**
- `_iosHubModel(o) -> {stats:{nextExamDays|null, passed, streak}, active, studying:[], passed:[], notStarted:[], freeRow|null}`. Pure. Its input `o` is:
  - `certs` (`getAvailableCerts()`)
  - `snaps` (`READINESS_SNAPSHOTS`)
  - `dates` (`EXAM_DATES`)
  - `outcomes` (`EXAM_OUTCOMES`)
  - `current`, `pro`, `now`, `streak`
- **Sections:**
  - Studying: has a snapshot, not passed. Sorted by exam date ascending, no date last.
  - Rows: "{score} / {max}" right; under the name "Exam in {n} days" or "No date". A snapshot `computed_at` older than 14 days appends " · last studied {n} weeks ago".
  - Passed: "Scored {n}" or "No score logged".
  - Not started: "Start".
  - Free: one row, "Unlock every cert with Pro", with the first three non-current cert short names + " and more", opening the existing Pro sheet.
- `openHub()` shows it. Tapping a row calls `tadSwitchCert(id)`.
- The suggest link "Don't see yours? Suggest a cert" sits under Not started (Task 14).

- [ ] **Step 1: UAT 527 (model).**
  - Sorting, stale note at 15 days vs 14, passed with and without score.
  - Free row text with 7 certs and with 20 certs (still 3 names + "and more").
  - Next-exam stat = the soonest future date.
  - e2e: Home cert name opens the hub; a Pro row switch calls `tadSwitchCert`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** + `lift-b4.spec.js`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(hub): My certs`.

## Phase F: Suggest a cert, admin, AI budget

### Task 13: cert_requests table

**Files:**
- Create: `supabase/migrations/20261031_cert_requests.sql` (copy the shape of `20260718_user_bug_reports.sql`)
- Modify: `scripts/sql/migration-audit.sql` (add rows)
- Test: `tests/uat/170-…:757-777` regex guards extended; DB suite if present

**Interfaces:**
- Table `cert_requests`:
  - `id uuid pk default gen_random_uuid()`
  - `user_id uuid not null references auth.users on delete cascade`
  - `exam_key text not null check (length(exam_key) between 1 and 80)` (normalised)
  - `label text not null check (length(label) between 1 and 120)`
  - `typed boolean not null default false`
  - `created_at timestamptz default now()`
  - `notified_at timestamptz`
  - `unique(user_id, exam_key)`
- RLS:
  - insert own (`auth.uid() = user_id`)
  - select own
  - admin select all (`is_admin()`)
  - admin update `notified_at` (`is_admin()`)
- View `cert_request_tally` (security invoker): `exam_key, label (most common), votes, new_7d, last_at, typed`, ordered by votes desc.
- End line: `-- ROLLBACK: DROP VIEW IF EXISTS cert_request_tally; DROP TABLE IF EXISTS cert_requests;`

- [ ] **Step 1:** Write the migration and the audit rows. Test the rollback on the branch DB (apply → rollback → apply).
- [ ] **Step 2: Run** `node tests/uat.js`. Expected: PASS, with the new guard `cert_requests has admin-select via is_admin()`.
- [ ] **Step 3: Commit** `feat(db): cert_requests (ACTION REQUIRED: paste in SQL Editor)`.

### Task 14: Suggest a cert sheet

**Files:**
- Modify: `features/ios-settings.js:77-83` (row after "Replay the tour"), new `ON.suggest`; `features/ios-hub.js` (link)
- Create: `lib/cert-requests.js` (shared normaliser + send)
- Test: new `tests/uat/528-suggest-cert.js`, `tests/e2e/lift-f3.spec.js` (or new `suggest-cert.spec.js`)

**Interfaces:**
- `_normCertRequest(s) -> string`: lowercase, collapses spaces, strips a leading vendor word (cisco|comptia|aws|amazon|microsoft|google|isc2), strips "certification|exam|cert". "Cisco CCNA" → "ccna"; "ITIL4 Foundation" → "itil4 foundation".
- `sendCertRequests(labels:string[]) -> Promise<{ok, failed:string[]}>`: inserts `{user_id, exam_key, label, typed}`. A unique-violation counts as ok. Failures are queued in `'nplus_cert_req_pending'` and retried on the next `ca:home-shown`.
- Sheet markup and behaviour are a lift of `cert-ios-settings.html` `suggestSheet`:
  - vendor groups
  - search or type, with the typed row unless there's an exact match
  - "Something else?" row
  - "Send {n} suggestion(s)"
  - thanks copy per the visual-pass record
- Signed in only (row hidden when signed out).

- [ ] **Step 1: Tests.**
  - Normaliser cases.
  - Typed row shown for "Cloud Security" (partial match) and hidden for "CCNA" (exact).
  - Send count text.
  - Offline queue retried.
  - Duplicate is ok.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(settings): Suggest a cert`.

### Task 15: Admin Cert requests, the Monday email, tell them it's live

**Files:**
- Modify: `landing/admin.html` (section between Users and Cert packs, per `mockups/admin-cert-requests-concept.html`)
- Modify: `landing/lib/admin.js` (`fetchCertRequests`, `renderCertRequests` via `sanitizeRows`)
- Create: `landing/api/admin/cert-requests-digest.js`, `landing/api/admin/notify-cert-live.js`
- Modify: `landing/vercel.json` (`"crons":[{"path":"/api/admin/cert-requests-digest","schedule":"0 8 * * 1"}]`)
- Test: `tests/uat/170-…` (sanitize shape for the new tbody), new `tests/uat/529-cert-requests-admin.js`, new `tests/api/notify-cert-live.test.mjs` (fetch stubbed like `apple-revoke.test.mjs`)

**Interfaces:**
- Digest:
  - Protected by `CRON_SECRET` (`Authorization: Bearer`).
  - Reads `cert_request_tally` with the service role.
  - Sends via Resend to `FOUNDER_EMAIL`. Subject "Cert requests this week: {n} new". The body follows the drawing.
- notify-cert-live: `POST {exam_key}`, with the caller's JWT verified as admin. It:
  - selects the requesters where `notified_at is null`
  - joins their emails via `auth.admin`
  - sends one email each: "{label} is now on CertAnvil"
  - sets `notified_at`
  - returns `{sent}`
- Admin UI: "Mark live & tell them" → confirm "Email {n} people that {label} is live?" → POST → "Sent to {n} people".

- [ ] **Step 1: Tests.**
  - Digest refuses without the secret.
  - Digest builds the subject and body from a stub tally.
  - notify refuses a non-admin.
  - notify sends only to un-notified requesters and stamps them.
  - Admin rows escape a typed label containing `<img onerror>`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(admin): cert requests, Monday digest, notify when live`.

### Task 16: AI budget at $100 a month

**Files:**
- Modify: `api/ai/generate.js:49-51`, `:184-195`
- Modify: `app.js:533`, `:744` (client 429 handling)
- Test: `tests/api/generate-limits.test.mjs` (new, fetch stubbed), `tests/uat/` guard

**Interfaces:**
- `GLOBAL_DAILY_LIMIT = parseInt(process.env.AI_GLOBAL_DAILY_LIMIT, 10) || <measured default>`.
  - **Measure first.** Average cost per proxied call = mean `usage.input_tokens`/`output_tokens` per model × the current price (check the `claude-api` skill). Sample from the last 7 days of Vercel runtime logs: add `usage` to the existing log line first if absent.
  - Default = `floor(100 / 30 / costPerCall)`. Record the numbers in the commit message.
- The 429 body for any `allowed===false` gains `scope:'global'|'user'|'ip'`.
- When `'global:daily'` `current_count` first reaches `ceil(0.8*limit)` in a day, send one Resend email to `FOUNDER_EMAIL`, "CertAnvil AI at 80% of today's limit". Dedupe with an `rlCheck('alert:global80', 1, '1 day')`.
- Client: a 429 with `error==='rate_limited'` shows a toast, "We're very busy right now. Your questions will be back shortly.", and does **not** open the quota modal. The quota 429 is unchanged.

- [ ] **Step 1: Tests.**
  - Env limit honoured.
  - 80% email sent once.
  - The 429 carries the scope.
  - Client: rate_limited → busy toast, quota → quota modal.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** (measurement first).
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(ai): budget-sized global limit, 80% alert, kinder busy message`.

## Phase G: Copy, first run, deletion moments

### Task 17: Honest copy and Start practising

**Files:**
- `features/ios-signin.js:25`, `features/ios-firstrun.js:79`, `:378`, `features/ios-home.js:240`, `features/ios-progress.js:109`
- Test: `tests/uat/507-ios-firstrun.js`, `tests/e2e/lift-c.spec.js:151-166`

**Interfaces:**
- The four strings are verbatim from `2026-10-30-honest-copy-start-practising-design.md`.
- `practise` act → `startToday({fromCheck:true})`. `startToday(opts)` skips `IFR.recordSkip()` when `opts.fromCheck`.

- [ ] **Step 1: Tests.**
  - Each new string present and each old string absent ("Real exam questions", "still moves your readiness", "Closest to the real thing", "fastest per minute").
  - e2e: after the check, "Start practising" lands on `#page-quiz` and `nplus_onb_skips` stays unset.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `fix(copy): only promise what the app does; Start practising starts`.

### Task 18: Goodbye and welcome back

**Files:**
- Modify: `features/home.js:1368` (`_confirmDeleteAccount` success card on phones → the goodbye screen), `:1417-1445` (`_deletionNotice` → the welcome-back moment on phones, toast kept on desktop)
- Modify: `lift-ios.css`
- Test: `tests/e2e/lift-5c.spec.js` (deletion cases), new `tests/uat/530-deletion-moments.js`

**Interfaces:**
- Goodbye: a lift of `onboarding-account-deletion.html` `?v=goodbye`.
  - The date is the scheduled deletion date (7 days after the request, formatted "Fri 6 Nov").
  - Done → reload as today; Sign back in → sign-in.
  - Motion per the drawing: the clock sweep, the seven day-dots, the copy rise, the reassurance last.
- Welcome back: a lift of `cert-ios-home.html` `#wb`.
  - Tiles: readiness (snapshot), answers (history question count), best streak.
  - Count-up 900ms.
  - Shown once, then `clear_deletion_notice` as today.
- Reduced motion: fades only.

- [ ] **Step 1: Tests.**
  - The goodbye shows the right date for a fixed clock.
  - The welcome back shows once and calls `clear_deletion_notice` once.
  - Reduced-motion has no transforms (computed style check).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** + `lift-5c` chromium + mobile-safari. Expected: PASS.
- [ ] **Step 5: Commit** `feat(account): honest goodbye and a proper welcome back`.

## Phase H: Ship (gated)

### Task 19: Verify and ship

- [ ] `node tests/uat.js`, `node tests/tech-debt.js`, `node tests/cloud-sync-sim.js`, and `npx playwright test` (full). All green.
- [ ] Bump `?v=` for `lift-ios.css` (and `dg-system.css` if touched), then `node scripts/stamp-css-versions.js`.
- [ ] `bump-version.js` minor, CHANGELOG row, `stamp-facts`.
- [ ] Open a PR from `feat/persona-bundle`. It needs the Supabase branch DB + Vercel preview. Apply the migration to the branch DB. Smoke-test every surface on the preview at phone width with a test account, plus the iOS app pointed at the preview.
- [ ] Founder actions, then squash-merge:
  - migration on prod + the audit query
  - env vars `RESEND_API_KEY`, `FOUNDER_EMAIL`, `AI_GLOBAL_DAILY_LIMIT`, `CRON_SECRET`
  - Anthropic cap $100
  - the OK on the #532 copy
- [ ] Post-deploy: drive live prod per CLAUDE.md. Tick Mindmatrix P1-P15 only where each done-test is true. Then the Apple delete retest.
