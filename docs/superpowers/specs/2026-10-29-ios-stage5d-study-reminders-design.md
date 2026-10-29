---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-29
tags: [spec, mobile, design]
---
# Stage 5d: study reminders (approved 29 Oct 2026)

Stage 5 of [[2026-10-19-ios-launch-june-design]]: 5a native shell (v8.195.0), 5b sign-in by email code (v8.196.x),
5c Sign in with Apple and Google (v8.197.x), **5d** (this: study reminders as local notifications). It closes the S5
milestone's "get a study reminder" and helps Apple guideline 4.2 ("feels native, not a website").

The June design already draws the ask: `mockups/onboarding-notifications-prime.html` ("Turn on reminders"): a
daily practice nudge for the 15 questions, a ping when review cards are due, an exam countdown, "One a day at most.
Turn it off any time in Settings.", then the real iOS prompt. `account-settings-concept.html` names exam reminders
at 14 / 7 / 3 / 1 days.

## Decisions (founder, 29 Oct)

- **Ask after the first finished quiz**, not during onboarding and not only from Settings.
- **They pick the time, default 7:00 pm.**
- **A rolling week of local notifications, rebuilt whenever the app opens** (approach A). No push server.

## What the person sees (iOS app only)

### The ask
- After their **first finished quiz**, tapping Continue on the results screen opens the priming screen: the June
  mockup lifted as drawn, plus one row, "Remind me at 7:00 pm", that opens a time picker.
- **Turn on reminders** → iOS's permission prompt.
  - Allow → reminders on at the chosen time.
  - Don't Allow → recorded as denied; never asked again.
- **Maybe later** → offered once more after their 5th finished quiz, then never again.
- The screen never shows on the website, for a Pro or free user alike, or once permission is decided.

### The reminder
At most one a day, at their time, the day's most useful line (drafts; Task 1 of the plan runs the humanizer and
marketing-psychology pass and locks the strings):

1. **Exam countdown** on the days the exam is 14, 7, 3 or 1 day away: "Your {cert} exam is in {n} days. A quick
   session keeps you on track." (1 day: "Your {cert} exam is tomorrow. One last warm-up?")
2. Otherwise **reviews**, when the day's planned review count is above 0: "{n} review cards are due. Five minutes and
   you're done." ({n} = 1: "1 review card is due.")
3. Otherwise **practice**: free "Your 15 questions for today are waiting."; Pro "Your daily practice is waiting."

Title: "CertAnvil". No countdown line without an exam date, or after it. Tapping a reminder opens the app; the app's
normal routing lands on Home. If they have finished a quiz today, today's reminder is not scheduled (and is
cancelled when they finish one).

### Settings → Reminders (new row, iOS app only, in "Study setup")
- On: value shows the time, e.g. "7:00 pm"; the row opens a sheet with an on/off switch and the time picker.
- Off: value "Off". Turning on from here asks iOS's permission if it has never been asked.
- Denied: value "Off"; the sheet says "Notifications are off for CertAnvil in iPhone Settings." with "Open
  Settings" (the app's iOS settings page).

## How it works

### The plugin, one door
`@capacitor/local-notifications`, pinned to an exact version, reached only through `window.caNative` in
`native-shell.js` (the 5c pattern), as:

- `caNative.reminders.permission() → Promise<'granted' | 'denied' | 'prompt'>`
- `caNative.reminders.request() → Promise<'granted' | 'denied'>`
- `caNative.reminders.schedule(list) → Promise<void>` where `list` is `[{ id, at: Date, title, body }]`
- `caNative.reminders.cancelAll() → Promise<void>` (cancels the ids 5001–5007 only)
- `caNative.reminders.ready() → boolean` (plugin present)
- `caNative.openAppSettings()` for "Open Settings".

Local notifications need no entitlement or Apple key; the binary still changes (plugin + `cap sync`), so the native
part reaches devices with the stage 6 TestFlight build, or a local Xcode build to test before then.

### `features/ios-reminders.js` (new, loaded with the other ios-* features)
- **Planner** `planReminders(now, s, d) → [{ id, at, title, body }]`, pure. `s` = settings `{ on, time: 'HH:MM' }`;
  `d` = `{ counts: number[7] (getSrTodayPlan().counts, day 0 = today), daysToExam: number|null (getDaysToExam()),
  certName, pro: boolean, studiedToday: boolean }`. Returns nothing when `s.on` is false. Days 0–6, id `5001 + day`,
  each at `s.time` in the phone's local time zone; a day-0 time already past, or `studiedToday`, skips day 0. Line
  per day by the priority above.
- **Rescheduler** `reschedule() → Promise<void>`: if on, permitted and the plugin is ready, `cancelAll()` then
  `schedule(planReminders(...))`; otherwise `cancelAll()`. Runs on app launch, on returning to the foreground
  (`@capacitor/app` `appStateChange` → active, wired in `native-shell.js`), after every finished quiz, and after a
  change to the exam date or the reminder settings. Never throws.
- **Priming screen** and **Settings row/sheet** as above.

### Storage
Capacitor Preferences through `caNative` (app-wide across cert subdomains, survives web-storage eviction), one key
`reminders` = JSON `{ on: boolean, time: 'HH:MM', asked: 'never' | 'later' | 'done', laterAtQuiz: number|null,
denied: boolean }`, default `{ on: false, time: '19:00', asked: 'never', laterAtQuiz: null, denied: false }`. The
finished-quiz count comes from quiz history (split rows skipped, per CLAUDE.md). Not synced to the account:
reminders belong to the phone.

## Cross-platform

| Target | Behaviour |
|---|---|
| Desktop web | nothing: no screen, no Settings row, no scheduling |
| Safari / WebKit | nothing |
| Phone web | nothing |
| iOS app | the ask, the reminders, the Settings row |

Every entry point checks `window.CA_NATIVE` and `caNative.reminders.ready()`; with an older app binary (no plugin)
the feature stays dormant and nothing breaks.

## Testing

- **Planner, UAT:** countdown wins on days 14/7/3/1 and only then; review counts from `counts`; practice otherwise;
  Pro has no "15"; no exam date → no countdown; after the exam → no countdown; `studiedToday` and a past time skip day
  0; times land at the chosen local hour across a clock-change weekend (both directions); at most 7 items, ids
  5001–5007; off → empty.
- **Playwright (chromium + mobile-safari, the lift harness with a stand-in LocalNotifications plugin):** the priming
  screen after the first finished quiz and not before; Allow schedules; Don't Allow records denied and never asks
  again; Maybe later asks again at quiz 5 only; the Settings switch and time reschedule; finishing a quiz drops
  today's; the denied sheet; nothing on the website.
- **Simulator:** with a time two minutes ahead, the founder sees the reminder arrive. iPhone check with stage 6.

## Rollout
Fast lane (no schema, money or auth). The live site gets the code first; it is dormant until an app build with the
plugin. The 5-stage visual pass runs on the priming screen (lifted, plus the time row) and the new Settings row and
sheet; both are drawn into the June E2E app for the founder's Simulator approval before the plan, as in 5a–5c.

## Rejected approaches

- **Ask during onboarding**: before the person has used the app, more say no, and iOS asks only once.
- **Only from Settings**: few people ever turn it on.
- **Learning the time from their habits**: hard to explain and test, wrong for new users.
- **A fixed 7 pm**: wrong for night-shift and morning people.
- **One repeating daily reminder (approach B)**: can't count reviews or the countdown, and nags forever after they
  stop.
- **Push from a server (approach C)**: the launch plan says no push server; needs an APNs key, a backend and a
  scheduler.

## Related
[[2026-10-28-ios-stage5c-apple-google-signin-design]] · [[2026-10-19-ios-launch-june-design]] · [[Mobile MOC]]
