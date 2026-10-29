# Stage 5d Study Reminders: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The iOS app asks once (after the first finished quiz) to send study reminders, then schedules at most one local notification a day at the chosen time, each with the day's most useful line, managed from Settings → Reminders.

**Architecture:** `@capacitor/local-notifications` and `@capacitor/app-launcher` are reached only through `window.caNative` (`native-shell.js`). A new `features/ios-reminders.js` holds a pure planner, a serialised rescheduler, the priming sheet (lifted from the approved E2E drawing) and the Settings row + sheet. State lives in one Capacitor Preferences key. Nothing runs outside the app.

**Tech Stack:** vanilla JS, Capacitor 8 (`@capacitor/local-notifications@8.3.1`, `@capacitor/app-launcher@8.0.1`, existing `@capacitor/app`, `@capacitor/preferences`), Playwright (lift harness), UAT.

**Spec:** `docs/superpowers/specs/2026-10-29-ios-stage5d-study-reminders-design.md`
**Approved drawing:** `.claude/worktrees/june-e2e` @ `ed2ab300` (`mockups/onboarding-notifications-prime.html` `?v=` states, `mockups/cert-ios-settings.html` reminders states, `mockups/cert-ios-home.html` banner; HUD "5d ›" routes `rem-prime`, `rem-prime-pro`, `rem-time`, `rem-ios-prompt`, `rem-banner`, `rem-banner-exam`, `st-reminders`, `st-reminders-off`, `st-reminders-sheet`, `st-reminders-denied`). The build is a faithful lift of those states.

## Global Constraints

- Fast lane on `feat/stage5d`; untouched: `auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`.
- Plugins pinned exactly: `@capacitor/local-notifications` `8.3.1`, `@capacitor/app-launcher` `8.0.1`; named only in `native-shell.js`.
- Reminder ids exactly `5001`–`5007`; Preferences key exactly `reminders`; default `{ on: false, time: '19:00', asked: 'never', quizzes: 0, laterAtQuiz: null, lastStudiedDay: null }`.
- Countdown days exactly 14, 7, 3, 1 (`daysToExam - k`); second offer when `quizzes >= laterAtQuiz + 4`; drop any item less than 60 s ahead.
- Permission is read live, never stored. `asked` becomes `'done'` once iOS answers.
- Every entry point checks `window.CA_NATIVE` and `caNative.reminders.ready()`; nothing on desktop, Safari or phone web.
- Local calendar days only (local `Date` fields), never `toISOString()` for days.
- Copy = the Copy table (Task 1), straight apostrophes, no em-dashes. BRAND.md §6 motion (`cubic-bezier(0.16, 1, 0.3, 1)`; priming sheet 520 ms in, time sheet 360 ms in / 200 ms out); `transform` + `opacity` only; reduced motion → fade.
- Cross-platform verified on chromium + mobile-safari (app, native UA) and the phone-web path (no native UA → nothing).

## Review Focus

- **A quiz finished on one cert, then the app opens on another cert the same day** → today's reminder stays cancelled (app-wide `lastStudiedDay`). Pinned in Task 4.
- **Rescheduling at 18:59:30 with a 19:00 time** → today's item is dropped (< 60 s), the other six schedule. Pinned in Task 3.
- **Permission revoked in iPhone Settings after turning reminders on** → the next foreground cancels everything and the row reads "Off". Pinned in Tasks 4 and 6.
- **The tier resolving after the first reschedule** (Pro user) → a second reschedule replaces the free "15" line. Pinned in Task 4.
- **The priming sheet and the 5a first-run sheets competing on the same Home** → the priming sheet never opens while another `ios-firstrun` sheet is open; it waits for the next Home. Pinned in Task 5.

## Copy

Drafts from the spec and the approved drawing; Task 1 locks them.

| Where | String |
|---|---|
| Reminder title | CertAnvil |
| Countdown (n ≥ 2) | Your {cert} exam is in {n} days. A quick session keeps you on track. |
| Countdown (n = 1) | Your {cert} exam is tomorrow. One last warm-up? |
| Reviews (n ≥ 2) | {n} review cards are due. About {m} minutes. |
| Reviews (n = 1) | 1 review card is due. About 2 minutes. |
| Practice, free | Your 15 questions for today are waiting. |
| Practice, Pro | Your daily practice is waiting. |
| Priming sheet | as the approved drawing's `rem-prime` / `rem-prime-pro` states, incl. "Remind me at {time}", "Turn on reminders", "Maybe later", "One a day at most. Turn it off any time in Settings." |
| Settings row | Reminders · value "{time}" or "Off" |
| Denied sheet | Notifications are off for CertAnvil in iPhone Settings. · Open Settings · Not now |

Copy pass (29 Oct): the reviews line said "Five minutes and you're done", which is untrue for a large pile; it now gives Home's own estimate, `{m}` = `max(2, round(n × 0.5))` minutes (features/home.js), so the promise is always honest. Other strings unchanged (humanizer: plain, no softeners or em-dashes; marketing-psychology: concrete effort lowers friction, no guilt). |

---

### Task 1: Copy pass

**Files:** Modify: this plan's Copy table (only if the pass changes a string)

- [ ] **Step 1:** Run `anthropic-skills:humanizer` then `marketing-psychology` on every string above (and the priming sheet's text as drawn). Reminders must read calm and specific, never guilt. Keep "One a day at most. Turn it off any time in Settings." unchanged.
- [ ] **Step 2:** Update the table with the final strings, one line under it naming any change. Later tasks pin these verbatim.
- [ ] **Step 3: Commit** `git commit -m "docs(stage5d): copy pass for study reminders"`

### Task 2: The plugins behind `caNative`

**Files:**
- Modify: `package.json`, `package-lock.json` (exact pins), `native-shell.js`, `ios/App/` (via `npx cap sync ios`: Package.swift / Package.resolved)
- Modify: `tests/e2e/lift-5c.spec.js` → move the shared `stubScript()` Capacitor stub to `tests/fixtures/capacitor-stub.js` if needed, and add a `LocalNotifications` + `AppLauncher` + `App` stand-in
- Create: `tests/uat/513-ios-reminders.js`

**Interfaces:**
- Produces: `caNative.reminders.ready() → boolean`; `.permission() → Promise<'granted'|'denied'|'prompt'>` (`prompt-with-rationale` → `prompt`); `.request() → Promise<'granted'|'denied'>`; `.schedule([{ id, at: Date, title, body }]) → Promise<void>`; `.cancelAll() → Promise<void>` (ids 5001–5007 only); `caNative.openAppSettings() → Promise<void>` (`AppLauncher.openUrl({ url: 'app-settings:' })`; resolves without throwing when the plugin is missing); `caNative.canOpenAppSettings() → boolean`; a `window` event `ca:app-active` dispatched on `App.addListener('appStateChange')` with `isActive: true`.
- The stub: `localStorage.__notif = { perm: 'prompt'|'granted'|'denied', requestAnswer: 'granted'|'denied' }`; calls recorded in `localStorage.__notifCalls` (`{ op: 'schedule'|'cancel'|'request', … }`); `window.__fireAppActive()` dispatches the listener.

- [ ] **Step 1: Failing tests.** UAT 513: both plugins pinned exactly; only `native-shell.js` names `LocalNotifications` / `AppLauncher`; `native-shell.js` defines `reminders:` and `openAppSettings`. Playwright (native UA): `caNative.reminders.ready()` true with the stub, false without; `permission()` maps `prompt-with-rationale` to `prompt`; `schedule()` passes `{ id, title, body, schedule: { at } }` per item; `cancelAll()` cancels exactly ids 5001–5007; `openAppSettings()` calls `openUrl` with `app-settings:`; the app-active listener dispatches `ca:app-active`.
- [ ] **Step 2: Fail**, then `npm install --save-exact @capacitor/local-notifications@8.3.1 @capacitor/app-launcher@8.0.1`, `npx cap sync ios` (Node 22: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"`), and implement in `native-shell.js` following the `caNative.social` pattern (look the plugins up lazily from `Capacitor.Plugins`).
- [ ] **Step 3: Pass**: UAT, the new Playwright cases, and all of `lift-5c.spec.js` (chromium + mobile-safari). `xcodebuild` the app for the Simulator succeeds.
- [ ] **Step 4: Commit** `git commit -m "feat(stage5d): local notifications and app settings behind caNative"`

### Task 3: The planner

**Files:** Create: `features/ios-reminders.js` (planner part); Modify: `tests/uat/513-ios-reminders.js`

**Interfaces:**
- Produces: `window.iosReminders.plan(now: Date, s: { on, time: 'HH:MM' }, d: { counts: number[7], daysToExam: number|null, certName: string, pro: boolean, studiedToday: boolean }) → [{ id: number, at: Date, title: string, body: string }]` (pure; no DOM, no globals read).

- [ ] **Step 1: Failing UAT tests** (load the function body with `_fnBody` into a vm, like 510 does):
  ```js
  // now = 2026-10-29T10:00 local, time '19:00', counts [6,0,0,3,0,0,0], daysToExam 7, cert 'Security+', free
  test('7 items, ids 5001..5007, each at 19:00 local on consecutive days')
  test('day 0 (exam in 7) is the countdown line, not the 6 reviews')
  test('day 3 shows "3 review cards are due. About 2 minutes."')
  test('days with no reviews and no countdown show "Your 15 questions for today are waiting."')
  test('Pro practice line is "Your daily practice is waiting." and never contains 15')
  test('exam in 1 day uses the tomorrow line; exam day and after have no countdown')
  test('no exam date → no countdown on any day')
  test('studiedToday drops day 0; 6 items remain')
  test('now = 18:59:30 with time 19:00 drops day 0 (under 60 s)')
  test('a clock-change week keeps 19:00 local on both sides (Europe/London, 25 Oct 2026 and 29 Mar 2026)')  // TZ=Europe/London
  test('on: false → []')
  test('n = 1 review uses the singular line')
  ```
- [ ] **Step 2: Fail**, implement the planner exactly per spec ("Planner" bullet), strings from the Copy table.
- [ ] **Step 3: Pass** with `TZ=UTC node tests/uat.js` and `TZ=Europe/London node tests/uat.js`.
- [ ] **Step 4: Commit** `git commit -m "feat(stage5d): the reminder planner"`

### Task 4: State and the rescheduler

**Files:**
- Modify: `features/ios-reminders.js`; `index.html` (load `features/ios-reminders.js` deferred after `ios-settings.js`)
- Modify: `features/ios-quiz.js` (`renderIosResults`) and `features/ios-exam.js` (`renderIosExamResults`): dispatch `window` event `ca:quiz-finished` once per finished session
- Test: `tests/e2e/lift-5d.spec.js` (new; reuse the lift harness + the Task 2 stub)

**Interfaces:**
- Consumes: Task 2 `caNative.reminders.*`, `ca:app-active`; Task 3 `plan()`; `getSrTodayPlan().counts`, `getDaysToExam()`, `window.CERT_PACK` name, the tier (`_quotaState` / the existing tier-ready signal the app emits — find and reuse it).
- Produces: `iosReminders.load() → Promise<state>`, `iosReminders.save(patch) → Promise<state>`, `iosReminders.reschedule() → Promise<void>` (serialised), `iosReminders.onQuizFinished() → Promise<void>` (increments `quizzes`, sets `lastStudiedDay` to the local date, sets an in-memory "offer on next Home" flag, then reschedules).

- [ ] **Step 1: Failing Playwright tests** (native UA, perm `granted`, state on):
  ```js
  test('launch schedules 7 reminders from the plan')
  test('finishing a quiz drops today\'s and stores lastStudiedDay as the local date')
  test('a second cert opened the same day keeps today\'s dropped')     // reload on ?cert=secplus with the same __prefs
  test('permission denied → cancelAll and nothing scheduled on app-active')
  test('the tier resolving after launch reschedules with the Pro line')
  test('two quick reschedules (launch + app-active) leave one set of 7, never 14')
  test('website (no native UA): no schedule, no cancel calls, no errors')
  ```
- [ ] **Step 2: Fail**, implement per spec ("Rescheduler", "Storage"). Serialise with a promise chain. Never throw.
- [ ] **Step 3: Pass**: `lift-5d.spec.js`, `lift-5c.spec.js`, `lift-5b.spec.js` (chromium + mobile-safari), UAT.
- [ ] **Step 4: Commit** `git commit -m "feat(stage5d): reminder state and rescheduling"`

### Task 5: The priming sheet

**Files:** Modify: `features/ios-reminders.js` (sheet), `lift-ios.css` (scoped `.irm-*` styles lifted from the drawing; bump `lift-ios.css?v=` in `index.html`); Test: `tests/e2e/lift-5d.spec.js`

**Interfaces:** Consumes: Task 4 state + `onQuizFinished` flag; renders after `renderIosHome()` completes.

- [ ] **Step 1: Failing tests:**
  ```js
  test('no sheet on Home before any finished quiz')
  test('after a finished quiz, the next Home shows the sheet with "Remind me at 7:00 pm"')
  test('after a finished exam, the same')
  test('a drill does not count')
  test('Pro sheet has no "15"')
  test('time row opens the picker; Done updates the row and the saved time')
  test('Turn on reminders → request → granted: on = true, asked = done, 7 scheduled')
  test('… → denied: asked = done, nothing scheduled, never shown again')
  test('Maybe later: asked = later; not shown after 3 more quizzes; shown after the 4th; then never again')
  test('not shown while a 5a first-run sheet is open; shown on the next Home')
  ```
- [ ] **Step 2: Fail**, lift the sheet and the time picker from the approved drawing (`rem-prime`, `rem-prime-pro`, `rem-time`), motion per Global Constraints.
- [ ] **Step 3: Pass** (chromium + mobile-safari) + screenshot each state at 402×874, light and dark, compared by eye with the drawing.
- [ ] **Step 4: Commit** `git commit -m "feat(stage5d): ask after the first finished quiz"`

### Task 6: Settings → Reminders

**Files:** Modify: `features/ios-settings.js` (row in "Study setup" after "Exam date"; sheet via the existing `openSheet`), `features/ios-reminders.js` (sheet logic), `lift-ios.css`; Test: `tests/e2e/lift-5d.spec.js`

- [ ] **Step 1: Failing tests:**
  ```js
  test('on + granted: the row reads "7:00 pm"')
  test('off: the row reads "Off"; switching on with perm prompt asks iOS')
  test('changing the time reschedules at the new time')
  test('switching off cancels everything')
  test('denied (even with on = true): row "Off", sheet shows the denied text and Open Settings')
  test('Open Settings calls openUrl app-settings:; hidden when canOpenAppSettings() is false')
  test('allowing later in iPhone Settings: app-active with perm granted restores the saved time')
  test('no Reminders row on the phone website')
  ```
- [ ] **Step 2: Fail**, implement as the drawing's `st-reminders*` states.
- [ ] **Step 3: Pass** + screenshots vs the drawing; UAT.
- [ ] **Step 4: Commit** `git commit -m "feat(stage5d): Settings → Reminders"`

### Task 7: Simulator check, ship

- [ ] **Step 1:** Full suite: UAT, tech-debt, `lift-5a/5b/5c/5d`, `lift-c`, landing project, on the private Playwright config.
- [ ] **Step 2 (founder + me):** Simulator build pointed at `http://localhost:3140` (temporary `capacitor.config.json`, restored afterwards): finish a quiz, see the sheet, allow, set the time 2 minutes ahead, see the reminder arrive (app backgrounded); then Settings → Reminders off → nothing arrives.
- [ ] **Step 3:** Founder's "ship it" → the ship skill (fast lane, bump to the next minor, CHANGELOG). The live site gets the code; the native part reaches the iPhone with the stage 6 TestFlight build. Mindmatrix: S5 note; tick S5 only if its whole done-test is true.
