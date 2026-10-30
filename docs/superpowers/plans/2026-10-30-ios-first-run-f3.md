# F3: First Run on Phones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A brand-new person in the iPhone app opens on the exam picker, creates an account right after locking in, lands on day-0 as the "You're in" welcome, and sees a four-tip tour on their first normal Home. Nobody reaches day-0 or Home signed out.

**Architecture:** Phone markup stays in the `features/ios-*.js` IIFEs (pure view functions first, `data-act` delegation), styles in `lift-ios.css` under the phone gate. `native-shell.js` owns the one decision "does this person need the account screen" (`caNative.requireAccount`), called from the picker (same-cert picks never reload), from page load, and from Account → Sign out. The tour is a new self-contained `features/ios-tour.js` that listens for `ca:home-shown`.

**Tech Stack:** Vanilla JS IIFEs, CSS, Capacitor Preferences (native), UAT (`tests/uat/*.js`, vm sandbox), Playwright (`tests/e2e/*.spec.js` with the stubbed `window.Capacitor` + `tests/fixtures/fake-supabase.js` from `lift-5a` / `lift-5b`).

**Spec:** `docs/superpowers/specs/2026-10-30-ios-first-run-f3-design.md` (approved). **Drawing:** june-e2e `683dff6e`, HUD **F3 ›** (approved 30 Oct). The drawing is the visual source: lift markup, spacing and copy from `mockups/onboarding-free-cert-picker.html?v=first`, `onboarding-signup-signin.html?v=firstrun|signedout`, `onboarding-free-home-day0.html`, `cert-ios-home.html?v=tour`, `cert-ios-settings.html` (row `stTour`).

## Global Constraints

- Lane: fast lane, on branch `feat/f3-first-run`, PR, merge on "ship it". No edits to `auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`, `landing/lib/supabase.js`, migrations. `app.js` untouched.
- Phones only (`max-width: 899px`); desktop first run and Home unchanged.
- Motion: BRAND.md §6 curve `cubic-bezier(0.16, 1, 0.3, 1)` (`--ios-ease`); transform + opacity (+ the tour's 2px blur on step change) only; entrances never below `scale(0.96)`; press `scale(0.97)` 150ms; reduced motion = fades only. Tour timings: overlay in 240ms / out 180ms, bubble enter 220ms from `translateY(6px) scale(0.96)`, step change out 120ms (`translateY(4px) scale(0.98)`, `blur(2px)`) / in 220ms.
- Copy is exactly as drawn (spec §1, §2, §3). No em dashes. British spelling ("towards", "Practise").
- CSS cache-bust: bump `lift-ios.css?v=` in `index.html` to `8.201.0` FIRST, then `node scripts/stamp-css-versions.js`. Re-stamp after every later CSS edit. Never stamp without the bump.
- Never write user-state localStorage on prod or `*.vercel.app` while testing.
- Real Apple / Google sign-ins in the Simulator are the founder's.

## Review Focus

1. **A signed-in person opens the app offline** (or `getSession()` fails): they must see the offline state, never the account screen. → Task 3 UAT `_nsSettledSignedOut` cases + Task 8 Playwright "stored session".
2. **Picking the exam the app opened on** (Network+, the default) never reloads the page; the account screen must still open. → Task 4 handler test + Task 8 "same-cert pick".
3. **Quota or auth arrives mid-tour** and `#ios-home` re-renders: the tour keeps its step and re-anchors, and does not restart. → Task 6 Playwright step.
4. **A person abandons the account step and relaunches**: account screen again, Back shown (no history), Back clears the pick and `FREE_CERT_ID`, picker returns. → Task 8.
5. **Relaunch mid email code** started from the picker's Sign in or from the account step: the code screen comes back with the same `from`, and Back behaves the same. → Task 2 UAT + Task 8.

---

### Task 1: Day-0 only when signed in, and day-0 as the welcome

**Files:**
- Modify: `features/ios-firstrun.js` (`_ifrState`, `_ifrDay0Html`, `IFR.renderHome`)
- Modify: `lift-ios.css` (`.ifr-greet .ifr-lede`; drop `.ifr-aha` rules), `index.html` (`lift-ios.css?v=8.201.0`), `tests/css-cache-bust.json` (stamped)
- Test: `tests/uat/507-ios-firstrun.js`, `tests/e2e/lift-c.spec.js` (repoint "Your exam is set" checks)

**Interfaces:**
- Produces: `_ifrState(s).day0 === (!placed && !s.skipped && s.signedIn === true)`. `_ifrDay0Html(m)` unchanged signature.

- [ ] **Step 1: Write the failing tests** in `507-ios-firstrun.js`:
  - `first run state (F3): signed out is never day-0` → `ST({ signedIn: false }).day0 === false && ST({}).day0 === true`.
  - Replace the free day-0 headline test: `d0` contains `<div class="ifr-hi">You're in</div>`, `<h1>Network+ is set.</h1>`, `Practise a little each day and your readiness climbs towards the pass mark.`; does not contain `Let's place your readiness`, `Your exam is set`, `ifr-aha`. Same for `d0p` (Pro).
  - Update the Skip test's `skip` match count if the copy change alters it (it must still be exactly the Skip button + `data-act="skip"` + class).
- [ ] **Step 2: Run** `node tests/uat/507-ios-firstrun.js` (or the UAT runner `TZ=UTC npm run uat` filtered) → the new tests FAIL.
- [ ] **Step 3: Implement.** `_ifrState`: `day0: !placed && !s.skipped && s.signedIn === true`. `_ifrDay0Html`: greet becomes `'<div class="ifr-greet ifr-rv"><div class="ifr-hi">You\'re in</div><h1>' + e(c.name) + ' is set.</h1><p class="ifr-lede">Practise a little each day and your readiness climbs towards the pass mark.</p></div>'`; remove the `ifr-aha` row. `IFR.renderHome`: while `window._certanvilSignedIn` is neither `true` nor `false` and less than 1500ms since this file loaded, set `root.innerHTML = ''`, schedule one `renderIosHome()` in 250ms, return `true`; after 1500ms draw as signed out (spec §2 "Cold launch, no flash").
- [ ] **Step 4: CSS** from the drawing's `.greet .lede` (14px/1.5, `--ink-soft`, `max-width: 32ch`, margin `8px 0 0`) as `#ios-home .ifr-lede`. Bump `lift-ios.css?v=8.201.0` in `index.html`, then `node scripts/stamp-css-versions.js`.
- [ ] **Step 5: Run** the UAT file and `npx playwright test tests/e2e/lift-c.spec.js` (after repointing its day-0 copy assertions to "You're in" / "Network+ is set.") → PASS.
- [ ] **Step 6: Commit** `feat(ios): day 0 only when signed in; day 0 is the "You're in" welcome`.

### Task 2: The sign-in screen's first-run and signed-out variants; the welcome screen goes

**Files:**
- Modify: `features/ios-signin.js` (`_isiSignInHtml`, `show`, `onTap` back, `IS.open`, `writePending`, `boot`; delete `_isiWelcomeHtml`, `IS.welcome`, the `'welcome'` view, the `'start'` action)
- Modify: `lift-ios.css` (remove `.isi-welcome`, `.isi-gauge`, `.isi-g-*`, `.isi-hero`, `.isi-cta*`, `.isi-link` rules only if nothing else uses them; grep first), re-stamp
- Test: `tests/uat/509-ios-signin.js`

**Interfaces:**
- Produces: `iosSignIn.open({ from: 'picker' | 'firstrun' | 'signedout' | 'home' | 'settings' | 'custom' | 'diagnostic', cert?: string, back?: boolean })`. `iosSignIn._backToPicker` is set by Task 3 (called when Back is tapped with `from: 'firstrun'`). Pending record: `{ email, sentAt, from }`.
- `_isiSignInHtml(m)` gains `m.from`, `m.cert`, `m.back`.

- [ ] **Step 1: Write the failing tests** in `509-ios-signin.js`:
  - `firstrun`: `_isiSignInHtml({ from: 'firstrun', cert: 'Network+', back: true })` contains `Create your account to start` and `Your <b>Network+</b> progress is saved to it, so you keep it if you switch phones.` and `data-act="back"`.
  - `firstrun` with `back: false` and `signedout`: no `data-act="back"`. `signedout` contains `Sign in to keep studying` and `Your <b>Network+</b> progress is waiting in your account.`
  - default (`from: 'home'`): today's `Sign in or create your account` / `Free to start.` and Back present.
  - The cert name is escaped (`cert: 'A<b>'` → `A&lt;b&gt;`).
  - Source checks: no `_isiWelcomeHtml`, no `Know when you're ready`, no `IS.welcome`; `writePending(` stores `from`; boot restores `st.from = p.from || 'picker'`; Back with `st.from === 'firstrun'` calls `IS._backToPicker`.
  - Remove the old welcome test.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Back renders when `m.back !== false && m.from !== 'signedout'` (and for `firstrun` only when `m.back === true`). `IS.open(o)` stores `st.from`, `st.cert`, `st.back`; `show('signin')` passes them. `onTap` `back`: `firstrun` → `IS._backToPicker && IS._backToPicker()`; any other → `close()`. `send()` calls `writePending(email, Date.now(), st.from)`; `readPending` keeps `from`. `boot()` restores `st.from = p.from || 'picker'`.
- [ ] **Step 4: Run** UAT 509 → PASS. Re-stamp CSS if edited.
- [ ] **Step 5: Commit** `feat(ios-signin): first-run and signed-out account screens; the 735 welcome goes`.

### Task 3: `caNative.requireAccount` and the launch guard

**Files:**
- Modify: `native-shell.js` (`onReady`, `window.caNative`)
- Test: `tests/uat/508-native-shell.js`

**Interfaces:**
- Consumes: `iosSignIn.open({ from, cert, back })` (Task 2), `iosFirstRun.picker({ tier, native: true })`.
- Produces:
  - `window._nsSettledSignedOut(env) -> boolean`, pure: `env = { flag, hasSession, offline }`; true only when `flag === false && !hasSession && !offline`.
  - `caNative.requireAccount(from: 'firstrun' | 'signedout') -> void`: waits like `whenSignedOut` (≤15s); when settled signed out, opens `iosSignIn.open({ from, cert: <this page's cert name>, back: from === 'firstrun' && <no STORAGE.HISTORY rows> })`. `hasSession` = any localStorage key matching `/^sb-.*-auth-token$/`; `offline` = `html.ifr-offline` or `navigator.onLine === false`.
  - `caNative.unchoose() -> Promise<void>`: removes Preferences `chosenCert`, `lockedCert`, `lastCertHost`.
  - Sets `iosSignIn._backToPicker = function () { caNative.unchoose().then(() => { localStorage.removeItem(STORAGE.FREE_CERT_ID); iosSignIn.close(); iosFirstRun.picker({ tier, native: true }); }) }`.

- [ ] **Step 1: Write the failing tests** in `508-native-shell.js`: `_nsSettledSignedOut` truth table: `{flag:false}` → true; `{flag:false,hasSession:true}` → false; `{flag:false,offline:true}` → false; `{flag:true}` → false; `{flag:undefined}` → false. Source checks: `onReady` with no `chosenCert` opens `iosFirstRun.picker` directly (no `S.welcome`) and keeps the `_pending()` guard (a pending code opens `iosSignIn.open` instead); with `chosenCert` set, `requireAccount` runs after the `lockedCert !== here` → `holdLock` branch has returned.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the interfaces above in `native-shell.js`. `onReady`'s chosen branch: lock check first (unchanged), then `caNative.requireAccount(<history empty> ? 'firstrun' : 'signedout')`.
- [ ] **Step 4: Run** UAT 508 → PASS.
- [ ] **Step 5: Commit** `feat(native-shell): the app opens on the picker; requireAccount guards a signed-out launch`.

### Task 4: The picker as the first screen

**Files:**
- Modify: `features/ios-firstrun.js` (`_ifrPickerHtml`, `drawPicker`, `onPickTap`, `IFR.picker`)
- Modify: `lift-ios.css` (`.ifr-first-head`, `.ifr-fh-brand`, `.ifr-first-signin`, lifted from the drawing's `.first-head` / `.fh-*` / `.first-signin`), re-stamp
- Test: `tests/uat/507-ios-firstrun.js`

**Interfaces:**
- Consumes: `caNative.requireAccount` (Task 3), `iosSignIn.open` (Task 2).
- Produces: `_ifrPickerHtml(m)` gains `m.first: boolean`. `IFR.picker(decision)` sets `first = !!decision.native`.

- [ ] **Step 1: Write the failing tests:** `_ifrPickerHtml({ first: true, certs, selected: 'netplus' })` contains the brand mark, `<h1>Which exam are you studying for?</h1>`, `Already have an account? <b>Sign in</b>` on `data-act="signin"`, and no `Pick your exam` header and no `foot-hint`; `first: false` is unchanged (header "Pick your exam", hint present). Source checks: `onPickTap` `signin` → `iosSignIn.open({ from: 'picker' })`; the `last-go` path and the Pro `start` path call `caNative.requireAccount('firstrun')` after `saveChoice(...)` resolves when the chosen cert equals `certId()` (no reload), and `goToCert` otherwise.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Only in the native picker (`pick.first`); the website's switch-on picker is unchanged.
- [ ] **Step 4: CSS** lifted from the drawing (27px Fraunces h1, `max-width: 15ch`; brand 26px mark + 15px/700 name; Sign in link 44px min-height, 13.5px/500 `--ink-soft`, bold part `--accent-deep` light / `--accent-bright` dark, `:active scale(0.97)`). Re-stamp.
- [ ] **Step 5: Run** UAT → PASS. **Commit** `feat(ios-firstrun): the picker opens the app; Sign in for existing accounts`.

### Task 5: Account → Sign out goes straight to the account screen (app)

**Files:**
- Modify: `features/ios-settings.js` (`ON.signout`)
- Test: `tests/uat/506-ios-settings.js`

- [ ] **Step 1: Failing source test:** in the app (`window.CA_NATIVE`), after the signout link click, `ON.signout` waits for `_certanvilSignedIn === false` (poll 250ms, ≤15s) and then calls `caNative.requireAccount('signedout')`; on the website it does nothing more.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(ios-settings): signing out in the app shows the account screen`.

### Task 6: The tour, and Account's "Replay the tour"

**Files:**
- Create: `features/ios-tour.js`
- Modify: `index.html` (`<script defer src="features/ios-tour.js"></script>` after `features/ios-reminders.js`), `features/ios-settings.js` (row + `ON.tour`), `lift-ios.css` (tour styles lifted from `cert-ios-home.html`'s `.tour*` / `.tt-*`, minus `.tt-dots`), re-stamp
- Test: `tests/uat/514-ios-tour.js` (new), `tests/e2e/lift-f3.spec.js` (tour section)

**Interfaces:**
- Produces:
  - `window._itTourHtml(m) -> string`, pure; `m = { step: 1..4, total: 4, h, p }`; renders `<span class="tt-count">N of 4</span>`, the X (`data-act="close"`, `aria-label="Close tour"`), `<h3 class="tt-h">`, `<p class="tt-p">` (p is trusted copy with `<b>`), and Next (`data-act="next"`) labelled `Done` on step 4.
  - `window._IT_STEPS` (4 entries `{ sel, h, p }`), exact copy and selectors:
    1. `#ios-home .ih-rd` · "Your readiness score" · "It runs from 100 to 900, and <b>720 is a pass</b>. It unlocks after your first quiz and climbs as you answer." (100/900/720 from `_ifrScale(CERT_PACK.meta)`, not literals)
    2. `#ios-home .ih-rec` · "Not sure what to do?" · "Tap <b>Recommended next</b>. It picks your next session from what you’ve answered so far."
    3. `#lift-tabbar .lift-tab[data-page="drills"]` · "Drills for weak spots" · "Go back over the questions you got wrong, or practise one topic at a time."
    4. `#lift-tabbar .lift-tab[data-page="progress"]` · "See how you’re doing" · "Progress shows your score over time and how each exam topic is going. You can replay this tour any time from <b>Account</b>."
  - `window.iosTour = { start(): void, maybeStart(): void, isOpen(): boolean }`. `maybeStart` runs on `ca:home-shown` when: phone, `#page-setup` active, `iosFirstRun.homeState() === null`, not `html.ifr-offline`, `_certanvilSignedIn === true`, not seen, not already open. Seen flag: app → `caNative.get/set('tourSeen')`; web → localStorage `ca_tour_seen`. Opening marks it seen (closing at any step counts as seen).
  - Host: one `<div id="ios-tour" role="dialog" aria-modal="true" hidden>` appended to `<body>` by the module; ring + bubble positioned from `getBoundingClientRect()` (fixed positioning); bubble below the anchor, above it when it would cross the tab bar; a missing anchor skips the step; `resize`, `scroll` (passive, on the Home scroller) and `ca:home-shown` re-place the current step without restarting.
  - Settings: `row('tour', 'home', 'Replay the tour', 'Four quick tips on Home', null)` as the last row of the Study setup group when `!m.out`; `ON.tour` → `showPage('setup')`, then `iosTour.start()` on the next `ca:home-shown`.

- [ ] **Step 1: Write the failing UAT** `514-ios-tour.js`: `_itTourHtml` for step 1 has `1 of 4`, Next, the X with its aria-label; step 4 has `Done`; `_IT_STEPS` selectors and headings exactly as above; source: `maybeStart` checks `homeState() === null`, `_certanvilSignedIn === true`, `ifr-offline`; the seen key names; `ios-settings.js` has the `tour` row inside the Study setup group and not when `m.out`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `features/ios-tour.js` (IIFE, pure view first) and the settings row; add the script tag.
- [ ] **Step 4: CSS** lifted from the drawing, on `--ios-ease` with the Global Constraints timings, `prefers-reduced-motion` collapsing transform and filter. Re-stamp.
- [ ] **Step 5: Playwright** (in `tests/e2e/lift-f3.spec.js`, signed in via fake-supabase): first normal Home shows the tour at step 1 anchored to `.ih-rd`; Next ×3 → step 4 on the Progress tab with Done; a reload does not show it again; Account → Replay the tour shows step 1 on Home; X and a tap outside close it; **forcing `renderIosHome()` while on step 2 keeps step 2 and the ring's rect matches the new `.ih-rec` rect (Review Focus 3)**; day-0, capped and offline Homes never show it.
- [ ] **Step 6: Run** UAT 514 + the tour spec → PASS. **Commit** `feat(ios): the four-tip tour on the first Home, replay from Account`.

### Task 7: Tests from earlier stages that assumed the 735 welcome

**Files:** `tests/e2e/lift-5a.spec.js`, `tests/e2e/lift-5b.spec.js`

- [ ] **Step 1:** Repoint every `"Know when you're ready"` / welcome expectation to the picker's `Which exam are you studying for?`; flows that tapped Get started now start on the picker; flows that tapped "Already have an account? Sign in" use the picker's Sign in.
- [ ] **Step 2: Run** both specs → PASS. **Commit** `test(e2e): 5a/5b start on the picker, not the welcome`.

### Task 8: The F3 flows end to end (native harness)

**Files:** `tests/e2e/lift-f3.spec.js` (flows section; reuse the `lift-5a` stub and `fake-supabase` code `123456`)

- [ ] **Step 1: Write** these tests, each asserting what the person sees:
  - Fresh install → picker header; Lock in → reminder 1 → reminder 2 → **account screen on the same page** ("Create your account to start", "Network+", Back visible) (Review Focus 2).
  - Pick Security+ on the Network+ page → navigates (`?cert=secplus`) → account screen there.
  - Back on the account screen → Preferences `chosenCert` / `lockedCert` / `lastCertHost` gone, `FREE_CERT_ID` gone, picker shown.
  - Sign in with code `123456` → day-0 with "You're in" and "Network+ is set."; Skip → normal Home + tour.
  - Reload signed out with `chosenCert` set and no history → account screen with Back; with history rows → account screen without Back (`signedout` copy) (Review Focus 4).
  - `_certanvilSignedIn = false` with an `sb-x-auth-token` key, or `html.ifr-offline` → no account screen (Review Focus 1).
  - Account → Sign out → account screen ("Sign in to keep studying", no Back).
  - Send a code from the account step, reload → code screen; Back/Change returns to the `firstrun` screen with Back (Review Focus 5).
  - Mobile web, 390px, signed out → no `html.ifr-day0`, normal Home with Sign in, no account screen.
  - Desktop 1280px → first run and Home unchanged.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/lift-f3.spec.js` → PASS (fix the owning task's code on any failure).
- [ ] **Step 3: Full suite:** `TZ=UTC npm run uat`, `npx playwright test`, `node scripts/stamp-css-versions.js --check` → all PASS. **Commit** `test(e2e): F3 first-run flows`.

### Task 9: Fidelity, Simulator, review

- [ ] **Step 1:** Side-by-sides with `scripts/lift-sbs.js` against the june-e2e drawing for picker-first, account-firstrun, account-signedout, day-0 free and Pro, tour steps 1 to 4, Account row: 390 and 402, both themes. Fix any drift in the owning task's files.
- [ ] **Step 2:** iPhone 17 Pro Simulator, the real app (`com.certanvil.app`) on the local server: fresh install (reset app data) → picker → lock in → account screen; Back; relaunch; airplane-mode launch with a stored session shows offline. Email-code and Apple sign-in are the founder's.
- [ ] **Step 3:** One fresh whole-branch review (`superpowers:requesting-code-review`); fix findings.
- [ ] **Step 4:** Hand to the `ship` skill on "ship it" (version bump, CHANGELOG, CI, deploy verification, live check). After ship: Mindmatrix F3 note; tick only after the founder sees it on the phone.
