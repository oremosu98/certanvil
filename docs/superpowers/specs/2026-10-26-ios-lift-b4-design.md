---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-26
tags: [spec, mobile, ios, launch, lift-b]
---
# Lift B4: Settings on phones (approved 26 Oct 2026)

B4 is the last stage of Lift B ([[2026-10-19-ios-launch-june-design]] §Stages: B1 Progress/Analytics/Daily
Review, B2 Exam, B3 Drills + Sim Lab + the three drills, B4 Settings). The Account tab in the phone tab bar
opens `#page-settings`. Below 900px it gets the June Settings: one calm scrollable page in the onboarding
language, with every capability of today's Settings carried over. Desktop is unchanged.

## What the app does today at 402pt (26 Oct)

- The desktop editorial layout, squeezed: "§ 00 Your Pass Plan", "§ 01 Study setup", mono section heads,
  boxed cards. The Pass Plan and the "Study setup health / at a glance" grid draw empty for a signed-out
  user. The web top bar stays (Settings, gear, theme, Sign in).
- Sign in, the signed-in email, the cert switcher and Sign out live only in that top bar's account menu
  (`auth-state.js`, gated lane). Every other June screen hides the top bar.
- Clear wrong answers bank, Import and Restore a backup ask with the browser's `confirm()`; Import reports
  with `alert()`. Exam date opens the native date picker.
- The page carries a hidden API key field (`#api-key`, owner path) that phones never show.

## The drawing

june-e2e `mockups/cert-ios-settings.html` is a Phase 1 static mockup (no `?v=` states, no HUD). It has:
header "Settings" + cert code and the theme toggle; **Study setup** ("at a glance" iOS rows: Cloud sync,
Exam date, Daily goal, Today; the exam-date bottom-sheet calendar; Daily goal presets 10/20/30/50 + Save, free
line + "Go Pro to raise your goal"; Daily Review 10/20/30/All due, "Top up on light days", free line + "Go Pro
for full review control"); **Data and backups** (Export / Import, Automatic backups rows, Download latest
snapshot, Snapshot now); **Account** (Manage subscription, Restore purchases, Delete account); **Danger zone**
(Clear wrong answers bank (N)); **Reports** (pending reports queue). B4 redraws it into the June E2E format
with states before any build (Process).

## Founder decisions (26 Oct 2026)

1. **Account card at the top.** Signed out: a Sign in card. Signed in: email, Free or Pro, Switch cert, and
   Sign out as the last row of the page.
2. **Subscription: a Go Pro row for free users only.** No Manage subscription or Restore purchases until
   payments exist (no billing portal, no App Store purchases today). Pro users see their plan line only.
3. **Pass Plan in, Reports out.** Pass Plan is a card under the account card. The reports queue stays in
   the bug-report drawer.

## The screen

Account tab, tab bar visible, no web top bar, plain top padding (v8.188.1). Top to bottom:

1. **Header.** "Settings" (Fraunces) and the cert code underneath (`CERT_PACK.meta.code`); the light/dark
   toggle on the right (today's `toggleTheme`).
2. **Account card.**
   - Signed out (`window._certanvilSignedIn !== true`): "Sign in to keep your progress", one line of
     body copy (drawn in the E2E, humanized), a Sign in button that navigates to `buildSignInUrl()`.
   - Signed in: the email (from the Supabase session, as `_showDeleteAccountConfirmUI` reads it), a Free or
     Pro pill (`_quotaState.tier`), and a Switch cert row showing the active cert. The row opens an in-app
     sheet listing `getAvailableCerts(role)` with today's rules: the active cert ticked, a "Pro" tag on Pro
     certs for free users. A tap on another cert closes the sheet first, then calls `tadSwitchCert(id)`
     (which applies today's Pro gate and reloads); a tap on the active cert does nothing.
   - The email arrives from an async `getSession()`; until then the row shows a quiet placeholder, and a
     signed-in user may briefly see the Sign in card before auth resolves (accepted: it repaints).
   - Free users only: a "Go Pro" row that opens today's Pro offer (`_showProOnlyUI` with the existing
     upgrade copy; no new pricing copy).
3. **Your Pass Plan.** Today's content (`_renderPassPlanFreeHtml` / `_renderPassPlanProHtml` output), as a
   June card. Free: the current cert's plan and the locked-certs chips. Pro: the plan and its snapshots.
   When there is no plan yet: today's "take the baseline diagnostic" call to action.
   - The host routes the `pp-*` actions itself, to the same targets `_wirePassPlanSection` uses
     (`viewPassPlan`, `_showProWaitlist`, `_showPassPlanCertPicker`, the open-cert path), with two phone
     changes: `pp-empty` asks "Take the Baseline Diagnostic?" in the in-app sheet and then calls
     `startDiagnostic({ skipConfirm: true })`; `pp-retake` asks its cooldown question in the sheet and then
     calls `retakeDiagnostic({ skipConfirm: true })` (a new option in `features/diagnostic.js`, default off,
     so every other caller keeps its `confirm()`). Copy for both sheets is today's, shortened in the drawing.
   - `renderPassPlanSection`'s lazy-load callback (it loads the diagnostic module, then re-renders) also
     re-renders the phone card (still), so a cold first visit fills in (the v8.7.1 regression class).
4. **Study setup.**
   - "At a glance" iOS rows (label left, value right): Cloud sync, Exam date, Daily goal, Today, values
     from today's `renderSettingsHealthCard` model.
   - **Exam date:** a row that opens the drawn bottom-sheet calendar (in `#ist-sheet`, Architecture); Save calls today's `setExamDate(iso)`;
     "Remove exam date" when one is set. Copy as drawn.
   - **Daily goal:** the big number, presets 10/20/30/50 and Save (today's `pickSettingsDailyPreset` /
     `saveSettingsDailyGoal`, which read and write the hidden desktop `#settings-daily-input`; the phone keeps
     using it, then re-renders still). Free: "Free is fixed at 15 questions a day" line and "Go Pro to raise
     your goal".
   - **Daily Review:** sizes 10/20/30/All due (`pickSrSessionSize`), "Top up on light days" switch
     (`toggleSrTopUp`); both repaint only the desktop chips today, so the host re-renders still after each.
     Free: the 5-card cap line and "Go Pro for full review control".
5. **Data and backups.**
   - Export data / Import data (today's `exportData` / `importData`). On phones Import splits into parse,
     ask, merge: "Invalid backup file", the parse failure and the result each show as a toast, and "Import N
     history entries? This merges with your data" asks in the in-app sheet. Desktop keeps `confirm()` and
     `alert()`.
   - Automatic backups: one row per snapshot (date, keys, size, version, time) that opens "Restore to
     <date>?" in the in-app sheet (the body keeps today's "what gets replaced" line, shortened in the drawing),
     then `restoreFromAutoBackup(date, { confirmed: true })`, a new option that skips its own `confirm()`; Download latest snapshot and
     Snapshot now (today's functions). Empty state: today's "No automatic backups yet" line.
6. **Danger zone.** "Clear wrong answers bank (N)" asks in the in-app sheet, then
   `clearWrongBank({ confirmed: true })`, a new option that skips its `confirm()`. Delete account (signed in only) opens today's
   `_showDeleteAccountConfirmUI` flow with its 7-day-grace copy, restyled for phones.
7. **Sign out** (signed in only): the last row; it activates today's `#topbar-signout-link` handler, which
   uploads first and only clears the device once the cloud has everything (v8.151.0).

Not on phones: Manage subscription, Restore purchases, Reports, the API key field.

**Copy:** exact strings are pinned when the drawing is approved, then copied into the plan. No em-dashes, no
arrow glyphs. The free/Pro lines keep today's numbers (15 a day, 5 review cards).

**Motion:** sections reveal once on entering the tab and rest visible (`animation … backwards`, UAT 481);
re-renders after a tap are still (the B3c3 entry lesson). Sheets keep the B2 timings. Preset and size picks
are instant state swaps. Touch targets ≥ 44px. BRAND §6 tokens.

## Architecture

- New eager `defer` module `features/ios-settings.js`: pure model/view pairs (`_iosStModel(s)` /
  `_iosStHtml(m)` for the page; `_iosStCertSheetHtml(m)`; `_iosStBackupRowsHtml(rows)`) with self-contained
  escaping, plus one host `iosSettings.render({still})` into a new `<section id="ios-settings" class="ios-only
  iq-screen">`, the first child of `#page-settings`. One delegated `data-act` listener; no inline `on*=`.
- `features/settings.js` `renderSettingsPage` builds the state (health rows, goal and review settings, the
  backups list, the Pass Plan HTML it renders today, signed-in state) and calls the host with it plus action
  handlers for its private functions (`_takeAutoBackup`, `_showDeleteAccountConfirmUI`); the public ones
  (`saveSettingsDailyGoal`, `setExamDate`, `restoreFromAutoBackup`, …) are called by name. The
  three `confirm()` / `alert()` paths gain a phone branch through `iosSheet` and the toast. Desktop paths are
  unchanged.
- Small opt-in options on today's functions, default off so every other caller is unchanged:
  `clearWrongBank({confirmed})`, `restoreFromAutoBackup(date, {confirmed})` (settings.js) and
  `retakeDiagnostic({skipConfirm})` (features/diagnostic.js; `startDiagnostic` already takes `skipConfirm`).
- **No edits to `auth-state.js`** (gated lane). The card reads `window._certanvilSignedIn`, the Supabase
  session, `buildSignInUrl`, `getAvailableCerts`, `tadSwitchCert`, and activates `#topbar-signout-link`.
  Sign-in state changes repaint the card: `ios-settings.js` subscribes to
  `window.certanvilSupabase.auth.onAuthStateChange` (auth-state's own subscriber registers first in its
  `init`, so `_certanvilSignedIn` is already set when ours runs) and re-renders still while Settings is
  shown. Wrapping `window.certanvilAuthState` would never fire: auth-state calls its local functions
  directly. The tier repaints through the `renderGauntletDrillsCard` chain when `_quotaState` hydrates.
- **Sheets.** Two-button asks use `iosSheet` (`#exam-sheet`). The cert list and the exam-date calendar need
  their own content, so they live in a new bottom sheet `#ist-sheet` in `index.html`, built like B3c1's
  `#igt-topics` (sharing its `lift-ios.css` sheet rules, scrim, focus return and Escape), closed on page exit
  and by `iosSheet.dismiss()`.
- `lift-ios.css`: a `B4 · SETTINGS` section (prefix `ist-`), hiding the web top bar and today's sections
  while `#page-settings` carries the class `ist-on`, which the host toggles from JS. Not a
  `:has(#ios-settings:not(:empty))` rule: several paths call `showPage('settings')` before the render, and
  the 899px crossing fills the host in place on a shown page, which WebKit misses (CLAUDE.md gotcha).
- Crossing 899px redraws in the new layout (MQ listener, Settings active only).

## Process

1. Redraw the June E2E Settings (`cert-ios-settings.html`) in the B3 format with a HUD button "B4 ›" and
   states: `signed-out`, `free`, `pro`, `exam-date`, `cert-switch`, `restore`, `clear-bank`, `delete`.
   Five-stage visual pass on the drawing. Founder approves in the Simulator.
2. Plan (writing-plans), then build, side-by-sides for every state (`scripts/lift-sbs.js`), one fresh
   whole-branch review, ship as v8.193.0 on "ship it".

## Acceptance

- At 390 and 402, signed out, free signed-in and Pro, every state matches the approved E2E side by side,
  dark and light.
- Every action does exactly what today's does: goal save, review size, top-up, exam date set and remove,
  export, import, restore, download, snapshot, clear wrong bank, delete account, cert switch (gates
  included), sign out (upload before clear).
- No browser `confirm()` / `alert()` from any action on the phone Settings page, including the two Pass Plan
  diagnostic paths.
- Desktop Settings unchanged (a desktop E2E pins it). `auth-state.js` untouched (UAT pins its hash or a
  diff check in review).
- No horizontal scroll; tab bar visible; no web top bar.

## Rejected approaches

- **Restyle today's markup with CSS only:** the order (account card first) and the iOS row anatomy differ,
  and the `confirm()` / `alert()` pop-ups would stay.
- **One shared desktop and phone rebuild:** breaks the phone-only rule every Lift stage keeps.
- **Keep the web top bar on Settings for sign-in and the switcher:** every other June screen hides it; the
  founder chose the account card (decision 1).
- **Manage subscription / Restore purchases rows now, disabled or "Coming soon":** nothing exists behind
  them; a Go Pro row for free users covers the real path (decision 2).
- **The drawing's Reports section:** the queue belongs with the bug-report drawer (decision 3).
- **Editing `auth-state.js` to expose a sign-out function:** gated lane for a fast-lane release; the
  existing link and exports cover it.

## Related
[[2026-10-19-ios-launch-june-design]] · [[2026-10-26-ios-lift-b3c3-design]] · [[2026-10-21-ios-lift-b2-design]] · [[Mobile MOC]]
