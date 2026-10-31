# Desktop Catch-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The desktop web app (≥900px) gets every persona-bundle feature the phone has (quiz resume, exam outcome, My certs, Suggest a cert, Why this score, honest streak lines, goodbye/welcome back) plus the copy fixes, from the same modules and copy.

**Architecture:** "One module, two layouts." Each phone module that is gated by `isPhone()` (`ios-hub.js`, `ios-log-result.js`, the deletion moments in `home.js`, the `iosSettings.openSheet` sheet, `ios-suggest.js`) keeps its model and copy and gains a desktop layout: a centred dialog for sheets, a sidebar page for the hub, cards on the desktop Home bento. Desktop surfaces call the phone modules' exported models instead of re-deriving anything.

**Tech Stack:** Vanilla JS IIFEs, `features/home.js` (desktop Home bento + sidebar), `features/analytics.js` (desktop Analytics), `lift-ios.css` (phone), `dg-system.css` (desktop), UAT + Playwright.

**Spec:** `docs/superpowers/specs/2026-10-31-desktop-parity-catchup-design.md` (approved 31 Oct). Drawing (faithful lift): `.claude/worktrees/june-e2e/mockups/desktop-catchup.html?v=` home-resume, home-exam-ask, home-exam-passed, log-result, home-streak-ended, mycerts, suggest, suggest-sent, analytics-why, why-sheet, goodbye, welcome-back (HUD "Desktop ›").

## Global Constraints

- Fast lane (no schema, auth, sync or service-worker change), but ship via a PR for a preview; any task that finds it must touch `auth-state.js`, `cloud-store.js`, `lib/supabase.js` or `sw.js` stops and reports (that would make it gated).
- `app.js` net 0 lines (cap 8334). Desktop code goes in `features/*.js`.
- Phone behaviour must not change: every existing phone UAT and Playwright test stays green unmodified, except the copy lines below that change on both.
- Copy is the drawing's, verbatim. Founder-approved changes (31 Oct): desktop Suggest says "Pick any you'd study." (phone keeps "Tap"); a past exam date's forecast line says "Set a new exam date to see where you'll be on the day." (phone and desktop); the Daily Challenge line when the streak has ended says "Starts a new streak." (phone and desktop); "PBQs carry 3-4× weight on the real exam. Start practising now." (`index.html` Pass Plan) and "PBQs are weighted 3-4× on the real exam." (`features/diagnostic.js`) become "Performance-based questions are part of the real exam. Practise them in Sim Lab."
- Desktop dialogs: centred, max-width as drawn, focus on the close button when opened, focus trap, Escape closes, inert behind, close faster than open. Motion per BRAND §6; reduced motion fade only; hover gated to fine pointers.
- `dg-system.css` changes need a hand-bump of `dg-system.css?v=` in `index.html`; `lift-ios.css` changes need `node scripts/stamp-css-versions.js`.
- Reminders stay iPhone-only (founder, 31 Oct). The Apple billing line stays app-only.

## Review Focus

1. Resizing a window across 900px while a dialog, the hub or the goodbye is open must not leave two copies, a stuck inert page, or a phone overlay over the desktop layout (owner: Task 1 test).
2. A desktop quiz resumed after the tab was closed must get exactly the saved questions, answers and flags, and an expired or cross-cert save must be dropped, the same as phone (Task 2 test).
3. The desktop My certs page must never offer cert switching to a Free user (the Pro row and locks), matching the hub's rules (Task 4 test).
4. Streak lines must agree everywhere on desktop: Home momentum, sidebar badge, top-bar chip and Daily Challenge (Task 7 test).
5. A desktop user deleting while offline must still see the honest offline card (#532 copy), not the goodbye (Task 8 test).

---

### Task 1: The shared desktop dialog layout

**Files:** Modify `features/ios-settings.js` (`openSheet`), `lift-ios.css`, `dg-system.css`, `index.html` (`dg-system.css?v=`). Test: `tests/e2e/desktop-dialog.spec.js`.

**Interfaces:**
- Produces: `window.caIsDesk() → boolean` (`matchMedia('(min-width: 900px)')`), defined once in `features/ios-settings.js` and used by every task below.
- Produces: `window.iosSettings.openSheet(html, onTap)` works at every width: ≤899 the current bottom sheet; ≥900 the same content in a centred dialog (`.ist-sheet.is-dialog`), per the drawing's why-sheet and log-result dialogs.
- Produces: `window.caDialogFrame(host)` adds `is-dialog`, the scrim, inert-behind, focus-to-close, Escape and resize handling (closing on a breakpoint change), for modules with their own sheet markup (Tasks 3, 5).

- [ ] **Step 1: Failing tests**: `desktop: openSheet opens a centred dialog with focus on Close; Escape closes and un-inerts`; `phone: openSheet is still the bottom sheet`; `resizing across 900px with a dialog open closes it cleanly (no inert left on #app)`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS** (chromium + webkit + mobile-safari).
- [ ] **Step 5: Commit** `feat(desktop): shared dialog layout for sheets`.

### Task 2: Quiz resume on desktop Home

**Files:** Modify `features/home.js` (the bento Home: a card above the readiness hero, drawing `home-resume`), `dg-system.css`. Test: `tests/e2e/desktop-resume.spec.js`, `tests/uat/538-desktop-catchup.js`.

**Interfaces:**
- Consumes: `quizResumeState()`, `quizResumeClear(opts)`, `resumeQuiz()` and `_quizResumeSummary(st)` from `features/quiz-resume.js` (unchanged).
- Produces: card "PICK UP WHERE YOU LEFT OFF / Finish your quiz · N left / {topic} · {answered} of {total} answered" with a chevron (Resume) and a small "Start fresh" link under it, shown only when `quizResumeState()` returns a valid save; it outranks the Recommended next card, as on the phone.

- [ ] **Step 1: Failing tests**: `desktop: a saved quiz shows the card; Resume restores the same questions at the same position`; `Start fresh clears the save and the card goes`; `an expired (25h) save shows no card`; `a save from another cert shows no card`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS.**
- [ ] **Step 5: Commit** `feat(desktop): Finish your quiz on Home`.

### Task 3: How did your exam go, on desktop

**Files:** Modify `features/ios-log-result.js` (drop the `isPhone()` gate; desktop renders in a dialog via `caDialogFrame`), `features/home.js` (the ask / passed / after cards on the desktop Home, drawings `home-exam-ask`, `home-exam-passed`), `dg-system.css`. Test: `tests/e2e/desktop-exam-outcome.spec.js`.

**Interfaces:**
- Consumes: `_examOutcomeDue(examDate, rec, today)` and the outcome store (unchanged); the phone Home's outcome card copy.
- Produces: `window.openLogResult(opts)` returns true on desktop too. Passed → the Passed badge on the cert (My certs, Task 4) and the "Pick your next cert" card; Didn't pass → "Set a new date" opens the exam-date setter.

- [ ] **Step 1: Failing tests**: `desktop: the day after the exam date Home asks How did your exam go`; `Passed → log-result dialog → save shows the badge and Pick your next cert`; `Didn't pass offers Set a new date`; `phone flow unchanged (existing exam-outcome spec green)`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS.**
- [ ] **Step 5: Commit** `feat(desktop): How did your exam go`.

### Task 4: My certs as a desktop page

**Files:** Modify `features/ios-hub.js` (desktop layout, drawing `mycerts`: greeting, Readiness / Due today / Day streak strip, your cert, other certs as a grid, the folded Pro row on Free, Suggest a cert link), `features/home.js` (`renderAppSidebar`: "My certs" under ACCOUNT above Settings, active state), `features/settings.js` (the "Your Pass Plans" list becomes one "My certs" row that opens the page), `index.html` (a `#page-mycerts` host), `dg-system.css`. Test: `tests/e2e/desktop-mycerts.spec.js`.

**Interfaces:**
- Consumes: `_iosHubModel`, `_hubLiveSnaps`, the `ca:quota-ready` redraw (unchanged).
- Produces: `openHub()` on desktop shows `#page-mycerts` through `showPage('mycerts')` and returns true; the phone overlay is unchanged.

- [ ] **Step 1: Failing tests**: `desktop: the sidebar shows My certs under Account and opens the page with the greeting and the three numbers`; `Free: other certs are locked and the Pro row opens the Pro sheet; no switching`; `Pro: tapping another cert switches`; `the plan arriving late redraws the page in place`; `Settings shows a My certs row instead of the Pass Plans list`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS.**
- [ ] **Step 5: Commit** `feat(desktop): My certs page`.

### Task 5: Suggest a cert on desktop

**Files:** Modify `features/ios-suggest.js` (desktop dialog via `caDialogFrame`; "Pick any you'd study." when `caIsDesk()`), `features/settings.js` (a "Suggest a cert" row, signed in only), `dg-system.css`. Test: `tests/e2e/desktop-suggest.spec.js`.

**Interfaces:** Consumes `lib/cert-requests.js` (unchanged). `window.openSuggestCert()` opens a dialog on desktop (drawings `suggest`, `suggest-sent`).

- [ ] **Step 1: Failing tests**: `desktop: My certs → Suggest a cert opens the dialog with "Pick any you'd study."`; `Settings row opens it; hidden when signed out`; `send shows the sent state; phone suggest spec unchanged`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS.**
- [ ] **Step 5: Commit** `feat(desktop): Suggest a cert`.

### Task 6: Analytics: Why this score, PBQ note, past-date wording

**Files:** Modify `features/analytics.js` (`_anaBtReadiness`: "Why this score?" link opening the shared why sheet; the PBQ note line; the days tile shows "N days ago" for a past date; remove the older "Why you're at N" card and the `getReadinessForecast` path if it still renders), `features/ios-home.js` (export `window.openWhyScore = _openWhy` unchanged in behaviour), `features/readiness.js` (`getForecastCopy`: past date line "Set a new exam date to see where you'll be on the day."), `dg-system.css`. Test: `tests/e2e/desktop-why.spec.js`; update `tests/uat/525-forecast-pbq.js` for the past-date line.

- [ ] **Step 1: Failing tests**: `desktop: Why this score? opens the dialog with range, evidence, exam areas and the four book-it items`; `the PBQ note shows on the desktop tile`; `a date 2 days past reads "2 days ago" and "Set a new exam date to see where you'll be on the day."`; `the old Why you're at card is gone`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS.**
- [ ] **Step 5: Commit** `feat(desktop): Why this score and honest Analytics tile`.

### Task 7: Streak lines on desktop

**Files:** Modify `features/ios-home.js` (export the momentum-line function it already uses, unchanged), `features/home.js` (`renderBentoMomentum` uses it; `renderAppSidebar` ended state "Streak ended · best N"; Daily Challenge line "Starts a new streak." when ended, on both layouts), `dg-system.css`. Test: `tests/e2e/desktop-streak.spec.js`.

- [ ] **Step 1: Failing tests**: `desktop: an ended 11-day streak shows "Your 11-day streak ended. Your best is 11. A quick set starts a new one." on Home and "Streak ended · best 11" in the sidebar`; `alive / done / none-yet lines match the phone wording`; `Daily Challenge says Starts a new streak. when ended (phone and desktop)`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS.**
- [ ] **Step 5: Commit** `feat(desktop): honest streak lines`.

### Task 8: Goodbye and welcome back on desktop

**Files:** Modify `features/home.js` (drop `_dmPhone()` from the goodbye and welcome-back paths; desktop layout centred per drawings `goodbye`, `welcome-back`; keep the offline card and the Apple line rules), `dg-system.css`. Test: extend `tests/e2e/lift-5c.spec.js` with desktop cases.

- [ ] **Step 1: Failing tests**: `desktop: confirming deletion shows Goodbye for now with the scheduled date and no Apple line`; `desktop: signing back in shows the welcome back screen, not the toast`; `desktop offline delete still shows the offline card`.
- [ ] **Step 2–4: Run → FAIL, implement, run → PASS.**
- [ ] **Step 5: Commit** `feat(desktop): goodbye and welcome back`.

### Task 9: The PBQ claims

**Files:** Modify `index.html` (`#pass-plan-pbq-sub`), `features/diagnostic.js:535`. Test: a UAT guard that no source file contains `3-4×` or `3-4x` next to "PBQ".

- [ ] **Steps:** failing guard → replace both with the approved line → guard passes → commit `fix(copy): no unbacked PBQ weight claim`.

### Task 10: Verify and ship (on the founder's "ship it")

- [ ] `node tests/uat.js`, `node tests/tech-debt.js`, `npx playwright test` (full). All green.
- [ ] Re-stamp CSS versions; `bump-version.js` minor; CHANGELOG row; `stamp-facts`.
- [ ] PR for a preview; walk every drawing state on the preview at desktop width (1280) and phone width (390).
- [ ] Merge; live checks on desktop and phone; Mindmatrix D2–D7 ticked only where each done-test is true.
