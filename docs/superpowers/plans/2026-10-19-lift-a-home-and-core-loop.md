# Lift A (Home + core loop at phone width) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** At phone width (<900px) the real app's Home, quiz (generating / question / answered), results and review-answers screens look and flow exactly like the June CertAnvil E2E app, including the approved post-June additions, wired to real data and real handlers.

**Architecture:** One codebase. Phone-only UI lives in two new feature modules (`features/ios-home.js`, `features/ios-quiz.js`) and one new phone stylesheet (`lift-ios.css`, loaded `media="(max-width: 899px)"` after `lift-screens.css`). Each new module splits a pure model function (data in, plain object out, unit-tested in a vm sandbox) from a view function (model in, HTML string out) and a thin mount function that writes into a `.ios-only` container and binds existing handlers. Where the E2E structure matches the real page (quiz question/answered), it is CSS plus small JS; where it does not (Home, loading, results, review answers) the E2E markup is rendered into a phone container and the desktop markup is hidden at phone width. Desktop (≥900px) is untouched.

**Tech Stack:** Vanilla JS feature IIFEs exporting to `window`, plain CSS, Playwright, the vm-sandbox UAT suite (`tests/uat/*.js`).

**Spec:** `docs/superpowers/specs/2026-10-19-ios-launch-june-design.md` (sections "Fidelity rule" and "Lift A decisions"). Design source: branch `feat/cert-ios-e2e`, `mockups/cert-ios-home.html`, `cert-ios-quiz.html`, `cert-ios-results.html`, `cert-ios-review-answers.html` (read them with `git show feat/cert-ios-e2e:mockups/<file>`; copy class names, sizes, copy and SVG paths from there).

## Global Constraints

- Fidelity: each screen must match the E2E screen at 390–430px, both themes, Free and Pro. Any deviation is shown to the founder before it ships.
- Phone gate is `(max-width: 899px)` everywhere: CSS via the `<link media>`, JS via `matchMedia('(max-width: 899px)').matches`.
- `app.js` may not grow (line ratchet 8301). New code goes in `features/`. Touch `app.js` only for one-line hook calls, and remove a line elsewhere if needed.
- Motion: BRAND.md §6 only. Ease `cubic-bezier(0.16, 1, 0.3, 1)`; press feedback `transform: scale(0.97)` (0.94 for 34px square buttons), `.14s`. `transform`/`opacity` only; reduced-motion collapses to fade.
- Never `innerHTML` AI text without `escHtml`; question stems go through `setQuestionText` (escape, then highlight).
- Counting from history skips split rows (`isHistorySplitRow`). Page switches go only through `showPage`.
- No em-dashes in visible copy. British spelling ("Practise it").
- Any `dg-system.css` change hand-bumps `dg-system.css?v=` in `index.html`; new/changed lift CSS gets its own `?v=`.
- Work on branch `feat/lift-a` in the main checkout; ship only when all four screens pass Task 8.

## Review Focus

1. **Desktop regression:** at 1280px every touched page renders exactly as on `main` (no `.ios-only` visible, bento Home intact, quiz submits on tap). Pinned in Task 1 and Task 5 Playwright specs.
2. **Non-MCQ questions on phone:** multi-select, order, PBQ/topology and CLI items must keep their own answer flow; pick-then-confirm applies to single-answer MCQ only. Pinned in Task 5.
3. **Non-900 cert scales:** AI-901 / AZ-900 / SC-900 (1–1000, pass 700) and CLF-C02 (100–1000, pass 700) show their own max and pass tick on Home readiness and results. Pinned in Tasks 2 and 6.
4. **Brand-new user / signed-out web user:** empty history renders the E2E "New user" Home (locked readiness, "Start your first quiz"), and signed-out web shows the Sign in pill and no streak. Pinned in Task 2.
5. **Special quiz modes reaching results:** wrong-drill, Gauntlet, Daily Challenge and Marathon must still route their own finish; "Redo this quiz" keeps calling `retryQuiz()` (which re-enters wrong-drill when active). Pinned in Task 6.

---

### Task 0: Branch and carry the S1 fixes

**Files:** none new.

- [ ] **Step 1:** `git switch -c feat/lift-a` in `/Users/simioremosu/Desktop/Dev Projects/certanvil` (the uncommitted S1 changes in `dg-system.css`, `lift-screens.css`, `index.html`, `landing/dg-system.css`, `landing/*.html` come with it). Stash `.github/workflows/vercel-incident-recovery.yml` by path first and pop after.
- [ ] **Step 2:** Run `node tests/uat.js`. Expected: `ALL PASS`.
- [ ] **Step 3:** Commit: `fix(phone): S1 top bar overflow, countdown square, Progress chips, log-result cert line`.

### Task 1: Phone tokens and the `.ios-only` scaffold

**Files:**
- Create: `lift-ios.css`
- Modify: `index.html` (add `<link rel="stylesheet" href="lift-ios.css?v=8.183.0" media="(max-width: 899px)">` directly after the `lift-screens.css` noscript link), `dg-system.css` (append `.ios-only{display:none!important;}`), bump `dg-system.css?v=`
- Test: `tests/uat/470-lift-a-scaffold.js`, `tests/e2e/lift-a.spec.js`

**Interfaces:**
- Produces: CSS class `.ios-only` (hidden on desktop; `display:block` inside `lift-ios.css`); class `.ios-desktop-only` (hidden inside `lift-ios.css`); E2E token values on the app's token names at phone width.

- [ ] **Step 1: Write the failing UAT** `470-lift-a-scaffold.js`: asserts `index.html` links `lift-ios.css` with `media="(max-width: 899px)"` after `lift-screens.css`; `dg-system.css` contains `.ios-only{display:none!important;}`; `lift-ios.css` defines, under `html[data-theme="dark"]`, `--bg:oklch(0.15 0.010 275)`, `--surface:oklch(0.205 0.009 275)`, `--surface3:oklch(0.255 0.010 275)`, `--border:oklch(0.34 0.009 275)`, `--text:oklch(0.97 0.006 275)`, `--text-mid:oklch(0.80 0.010 275)`, `--text-dim:oklch(0.62 0.013 275)`, `--accent:oklch(0.82 0.150 66)`, `--green:oklch(0.78 0.150 152)`; and under `html[data-theme="light"]` `--bg:oklch(0.975 0.007 85)`, `--surface:oklch(0.955 0.009 84)`, `--surface3:oklch(0.92 0.010 84)`, `--border:oklch(0.85 0.010 85)`, `--text:oklch(0.22 0.015 280)`, `--text-mid:oklch(0.38 0.014 280)`, `--text-dim:oklch(0.52 0.013 280)`, `--accent:oklch(0.55 0.155 55)`, `--green:oklch(0.52 0.13 150)`. Also define `--accent-deep`, `--accent-bright`, `--on-accent`, `--track`, `--miss` (E2E values; `--miss` from `cert-ios-quiz.html`).
- [ ] **Step 2:** `node tests/uat.js` → FAIL on module 470.
- [ ] **Step 3:** Create `lift-ios.css` (header comment: source of truth = feat/cert-ios-e2e mockups, token parity with E2E). Add the scaffold and the dg-system rule.
- [ ] **Step 4: Playwright** in `tests/e2e/lift-a.spec.js`: `test('desktop never shows ios-only')` at 1280×800 asserts every `.ios-only` has `display: none`; `test('phone uses E2E tokens')` at 390×844 dark asserts `getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() === 'oklch(0.15 0.010 275)'`.
- [ ] **Step 5:** Check text contrast at phone width with the new tokens: `--text-dim` on `--bg` and on `--surface` ≥ 4.5:1 in both themes (compute in the spec via a canvas colour read or a small OKLCH→sRGB helper). If either fails, stop and raise it with the founder (fidelity vs WCAG); do not silently change values.
- [ ] **Step 6:** UAT + `npx playwright test tests/e2e/lift-a.spec.js` green. Commit.

### Task 2: Home model (pure)

**Files:**
- Create: `features/ios-home.js` (IIFE; this task adds only the model)
- Modify: `index.html` (add `<script defer src="features/ios-home.js?v=8.183.0">` after `features/home.js`)
- Test: `tests/uat/480-ios-home-model.js`

**Interfaces:**
- Consumes (globals, all `typeof`-guarded): `getReadinessScore()`, `getSrTodayPlan()`, `getStreak()`, `getTodayQuestionCount()`, `getDailyGoal()`, `buildSessionPlan(1)`, `loadWrongBank()`, `loadHistory()`, `isHistorySplitRow()`, `getDaysToExam()`, `DOMAIN_WEIGHTS`, `DOMAIN_LABELS`, `TOPIC_DOMAINS`, `CERT_PACK`, `CERT_CODE`, `EXAM_PASS_SCORE`, `localStorage['nplus_exam_state']`, the signed-in flag the account pill uses (`window.cloudStore?.isSignedIn?.()` or the auth-state equivalent; read `auth-state.js` for the exact accessor).
- Produces: `window._iosHomeModel(now: Date) -> HomeModel`, where `HomeModel = { state: 'returning'|'new', signedIn: bool, cert: {mark, name, code}, streak: number, greeting: string, readiness: {score|null, max, pass, tier: 'On track'|'Close'|'Behind'|'Pass ready'|'Locked', fillPct, passPct, insight: string, meta: string|null}, rec: {kind: 'exam'|'review'|'first'|'weak', min: number, title: string, sub: string}, week: [{label, count, isToday, isExam}]|null, momentum: {done, goal, streakLine: string, pick: {topic, accuracy}|null}, mistakes: number, domains: [{key, name, weightPct, mastery, untouched: bool}] }`.

- [ ] **Step 1: Write the failing tests** (vm sandbox, stub globals) — one assertion block per row:
  - empty history → `state === 'new'`, `readiness.tier === 'Locked'`, `readiness.score === null`, `rec.kind === 'first'`, `rec.title === 'Start your first quiz'`, `rec.sub === '10 questions, easy mix, about 10 minutes.'`, `greeting === 'Welcome to Network+. Your first session sets the baseline.'`
  - Tuesday 09:00 with history → `greeting === 'Tuesday morning. Pick up where you left off.'` (afternoon from 12:00, evening from 17:00)
  - `nplus_exam_state` paused with `timeLeft: 2520`, 31 of 90 answered → `rec.kind === 'exam'`, `rec.min === 42`, `rec.title === 'Resume your exam'`, `rec.sub === '31 of 90 answered. Paused with 42 minutes left.'`; running → `'31 of 90 answered. The clock is still running.'`; time up → title `'Your exam time is up'`, sub `'31 of 90 answered. See your result.'`
  - SR plan `todo: 7` → `rec.kind === 'review'`, `rec.title === 'Review 7 cards'`, `rec.min === 4` (`max(2, round(todo*0.5))`), sub `'Spaced repetition. Re-encounter what you forgot.'` (or the `_srSpreadPhrase` sentence when cards spill to later days)
  - no SR, history → `rec.kind === 'weak'`, title `'15-min Weak Spots'`
  - readiness `{predicted: 553, ...}` on Net+ → `max 900`, `pass 720`, `fillPct ≈ 61.4`, `passPct 80`; on AI-901 → `max 1000`, `pass 700`
  - `meta === 'Last 200 answers: 70% right · 34 days to exam'`; past exam date → `'Last 200 answers: 70% right'` (no day count); no recent answers → `null`
  - insight: below pass → `'About 167 points to a pass.'`; at/above → `'Above the pass mark. Keep it there.'` Prefix `'Up N this week. '` only when a readiness value from ≥7 days ago is available from the existing readiness history (`STORAGE.READINESS_SNAPSHOTS` / the weekly series near `features/readiness.js:751`); never invent it
  - tier: `examReady` → `'Pass ready'`; `passProbability ≥ 50` → `'On track'`; `≥ 20` → `'Close'`; else `'Behind'`
  - momentum `streakLine`: `'1 day streak, best is 4. One short session adds another.'`; zero → `'0 day streak. Finish today to start one.'`; `pick` from `buildSessionPlan(1)[0]` as `{topic, accuracy}` (accuracy rounded %)
  - `mistakes` = `loadWrongBank().length`; domains from `DOMAIN_WEIGHTS` with mastery summed over non-split history rows
  - `signedIn: false` is set only on the web; on the native shell (`document.documentElement.classList.contains('is-native')`) treat as signed in
- [ ] **Step 2:** `node tests/uat.js` → FAIL (function missing).
- [ ] **Step 3:** Implement `_iosHomeModel(now)` in `features/ios-home.js`. Self-contained, every global `typeof`-guarded (UAT extracts and runs it in a bare vm).
- [ ] **Step 4:** UAT green. Commit.

### Task 3: Home view, mount and chrome

**Files:**
- Modify: `features/ios-home.js` (view + mount), `index.html` (add `<section id="ios-home" class="ios-only" aria-label="Home"></section>` as the first child of `#page-setup`), `features/home.js` (`renderHeroV2` calls `window.renderIosHome && renderIosHome()` as its last line), `lift-ios.css` (Home styles ported from `cert-ios-home.html`: `.topbar` → scope as `#ios-home .ih-top`, `.rd*`, `.rec*`, `.week*`, `.momentum`, `.ring`, `.mo-*`, `.sect*`, `.opt`, `.acc*`, `.domain*`, `.custom`, `.tb-signin`, `.rd-meta`, `.mo-go`), hide `#page-setup .board` and the app topbar while Home is active at phone width
- Test: `tests/uat/481-ios-home-view.js`, `tests/e2e/lift-a.spec.js`

**Interfaces:**
- Consumes: `_iosHomeModel`.
- Produces: `window._iosHomeHtml(model: HomeModel) -> string`, `window.renderIosHome() -> void` (no-op unless the phone gate matches).

- [ ] **Step 1: Failing view tests:** `_iosHomeHtml` of the returning model contains `class="rd-meta">Last 200 answers: 70% right · 34 days to exam`, `Practise it · 10 questions`, `Recommended next`, four study rows (`5-min Warmup`, `Daily Challenge`, `Drill Mistakes`), accordions `Practice`, `Exam simulation`, `Drill by domain`, and `Build a custom quiz`; the new-user model contains `Locked` and no `rd-meta`; `signedIn:false` renders `class="tb-signin"` and no `tb-streak`; `mistakes:0` omits Drill Mistakes. Every interpolated string passes through `escHtml`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `_iosHomeHtml` copying E2E markup and copy verbatim (Practice: `20-min Deep Scan` / `30 Questions` / `45 Questions`; Exam: `60-Question SIM` / `Full Exam Simulator`; subtitles as in the mockup, exam subtitle uses the cert's scale). No lock pills (E2E). Implement `renderIosHome()`: render, then bind by `data-act` attributes to existing handlers: rec → exam `_loadFeature('exam').then(m=>m.resumeExam())` / review `startSrReview()` / first-quiz path from `renderBentoRecommended` / weak `applyPreset('focused')`; `5-min Warmup` → `applyPreset('warmup')`; `Daily Challenge` → `startDailyChallenge()`; `Drill Mistakes` → `startWrongDrill()`; Deep Scan/30/45 → `applyPreset('grind'|'bulk30'|'bulk45')`; 60Q → `applyPreset('bulk60')`; Full → `startExam()`; domain row → `applyDomainPreset(key)`; custom → `_jumpToCustomQuiz()`; Practise it → `_startPickUpQuiz(topic)` (export it from `home.js` if not already on `window`); cert name → existing cert switcher; settings → `showPage('settings')`; theme → `toggleTheme()`; Sign in → the existing sign-in entry the topbar button uses. Accordions toggle `.open` + `aria-expanded`, closed by default.
- [ ] **Step 4:** Chrome: while `#page-setup` is the active page at phone width, hide `#app-topbar` (Home owns its header) and keep `#lift-tabbar`. Do it with a body class set in `renderIosHome` and cleared by `showPage` (read `lift-shell.js` for the existing per-page hook and use it).
- [ ] **Step 5: Playwright** (390×844, fake session as in the June audit script `fake-supabase.js` pattern, localhost only): Home shows `#ios-home`, `#page-setup .board` hidden, `scrollWidth === 390`; tapping `5-min Warmup` reaches `#page-loading`; at 1280 the bento is visible and `#ios-home` hidden.
- [ ] **Step 6:** UAT + Playwright green. Commit.

### Task 4: Quiz generating screen

**Files:**
- Create: `features/ios-quiz.js`
- Modify: `index.html` (`<div id="ios-loading" class="ios-only">` inside `#page-loading`; script tag after `quiz-engine.js`), `features/quiz-engine.js` (one call per progress update to `window.renderIosLoading && renderIosLoading(state)`), `lift-ios.css`
- Test: `tests/uat/482-ios-quiz.js`, `tests/e2e/lift-a.spec.js`

**Interfaces:**
- Produces: `window._iosLoadingLine({count:number, diff:string, topics:string[]}) -> string`; `window.renderIosLoading({count, diff, topics, batchesDone, batchesTotal}) -> void`.

- [ ] **Step 1: Failing tests:** `_iosLoadingLine({count:10, diff:'Exam Level', topics:['Subnetting','VLANs','DNS']}) === 'Generating 10 Exam level questions on Subnetting, VLANs and DNS...'`; one topic → `'... on Subnetting...'`; Mixed → `'... on a mix of topics...'`. Caption `'2 of 4 batches ready'`; before the first batch `'Generating questions...'`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement; markup = E2E generating state (✕ exit bound to the existing cancel handler behind `#load-cancel`, flag square disabled at 45% opacity, 3 stem shimmers, 4 option skeletons with letter squares, gen line, indeterminate bar, docked disabled `Preparing your set`). No 🧠 emoji. Hide the desktop loading markup at phone width.
- [ ] **Step 4:** Playwright: start a quiz with the AI route stubbed to delay 2s → `#ios-loading .gen-line` visible, ✕ returns to Home. UAT + Playwright green. Commit.

### Task 5: Quiz question and answered (CSS + pick-then-confirm)

**Files:**
- Modify: `features/ios-quiz.js`, `features/quiz-engine.js` (option click and Next routing, one guarded branch each), `lift-screens.css` / `lift-ios.css`
- Test: `tests/uat/482-ios-quiz.js`, `tests/e2e/lift-a.spec.js`

**Interfaces:**
- Produces: `window.iosConfirmActive() -> bool` (true only at phone width, captured at `startQuiz` so a resize mid-quiz never switches mode, and only for single-answer MCQ); `window.iosQuizSelect(letter:string) -> void`; `window.iosQuizNext() -> bool` (returns true when it submitted a pending selection via `pick(letter, q)`).

- [ ] **Step 1: Failing tests:** in confirm mode an option tap adds `.sel`, enables `#btn-next`, and does not touch `log`; Next with a selection calls `pick` once; Next with nothing selected is disabled (no skip); after answering, the label reads `Next question` (last question `See results`); multi-select / order / PBQ / CLI questions bypass confirm mode; at 1280 an option tap submits immediately (unchanged).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement the routing and these CSS/markup fixes:
  - `#quiz-flag-btn` becomes the 34px square in the top-right corner (E2E `.qflag`, flagged = accent fill + filled icon), replacing any theme toggle on the quiz bar.
  - `#short-notice` renders as the `16 of 20` pill on the right of the `Question 1 of N` row.
  - Pill strip: drop the CSS `::before` counter so each cell shows one number; answered = neutral amber "done" tint (E2E), not green/red.
  - Keyword highlight: style `strong.exam-keyword` as E2E `.kw` (italic, accent, Fraunces); suppress the programmatic focus ring on `#q-text` (`:focus:not(:focus-visible)`).
  - Next docks to the bottom (`position: fixed` above the tab bar safe area), disabled at 45% until a selection.
  - Answered: `#exp-box` becomes E2E `.why` (red-tinted on a miss, green on a hit), header `Wrong - correct answer: B` / `Correct`; the `WHY` accordion is forced open with its header hidden; `#exp-wrong-explain` is styled as `.why-mine` with `On your pick (A):` prefix; Study chip = E2E `.why-study` pill with the book icon; Explain/Drill/Report = the three-across `.why-acts` row with icons.
- [ ] **Step 4:** Playwright at 390: tap option B → not answered; Next → answered card visible with `On your pick` on a miss; Flag toggles `aria-pressed`. At 1280: one tap answers. UAT + Playwright green. Commit.

### Task 6: Results

**Files:**
- Modify: `features/ios-quiz.js`, `index.html` (`<div id="ios-results" class="ios-only">` in `#page-results`), `features/quiz-engine.js` (`finish()` calls `window.renderIosResults && renderIosResults()` after its existing render), achievement-toast styling in `lift-ios.css`
- Test: `tests/uat/482-ios-quiz.js`, `tests/e2e/lift-a.spec.js`

**Interfaces:**
- Produces: `window._iosResultsModel() -> {headline, sub, scaled, max, pass, verdict:{text, dir:'up'|'down'}, rows:[{k,v,tone}], split:[{num, label}], review:[{n, stem, meta, verdict:'Right'|'Wrong'}], mistakes:number}`; `window.renderIosResults() -> void`.

- [ ] **Step 1: Failing tests:** model reads the same values `finish()` shows on desktop (scaled score on the cert's own scale, headline/sub from the existing results copy); rows are `Correct`, `Wrong`, `Raw`, `Time`, `Best streak`; split cells `1/2 Basic`, `1/3 Exam level` from the existing difficulty breakdown data; review rows numbered `01`, meta `Topic - Domain`; `mistakes` = wrong count in this session.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement with E2E markup: kicker `Session complete` with check icon, Fraunces headline, score card, stat rows, split cells, review list, dock with `Redo this quiz` (→ `retryQuiz()`), row of `Drill my N mistakes` (→ `drillMistakesFromResults()`, hidden at 0), `Review answers` (→ `showReview(false)`), `Back to menu` (→ `goSetup()`). Milestone/achievement toasts render as the E2E `.mtoast` dropping from the top (4s, tap to dismiss), never over the dock.
- [ ] **Step 4:** Playwright: finish a stubbed 5-question quiz at 390 → `Redo this quiz` restarts with the same topic/difficulty/count; `Back to menu` reaches Home; wrong-drill session results → Redo re-enters wrong-drill. CLF-C02 shows `/ 1000`. UAT + Playwright green. Commit.

### Task 7: Review answers

**Files:**
- Modify: `features/ios-quiz.js`, `index.html` (`<div id="ios-review" class="ios-only">` in `#page-review`), `features/quiz-engine.js` (`showReview` calls `window.renderIosReview && renderIosReview(fromExam)`)
- Test: `tests/uat/482-ios-quiz.js`, `tests/e2e/lift-a.spec.js`

**Interfaces:**
- Produces: `window._iosReviewModel(log, mode:'all'|'wrong'|'flag') -> {summary, showFlagged:bool, cards:[...]}`; `window.renderIosReview(fromExam:boolean) -> void`.

- [ ] **Step 1: Failing tests:** summary `Network+ practice · 8 questions · 6 correct`; `wrong` mode includes skipped (unanswered) items; `showFlagged` false when nothing flagged; option rows carry `Correct` / `Your pick` tags; cards with `flagged` carry the `Flagged` tag.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement with E2E markup: ‹ back (→ results, or exam-results when `fromExam`), Fraunces `Review answers`, theme toggle, summary line, segment control `All / Wrong only / Flagged`, cards, `Why:` explanation, docked `Done` (→ same as back). Empty Wrong list: `Nothing missed` / `Every answer was correct. Clean run.`
- [ ] **Step 4:** Playwright: filters switch counts; Flagged hidden with no flags. UAT + Playwright green. Commit.

### Task 8: Fidelity check (the acceptance gate)

**Files:**
- Create: `scripts/lift-sbs.js` (Playwright: renders each real screen at 390×844 in both themes with a fake session and seeded history, and the matching E2E screen from `feat/cert-ios-e2e` served locally, writes side-by-side PNGs to `test-results/lift-a-sbs/`)

- [ ] **Step 1:** Run it; read every pair. List each visual difference in the PR body as fixed or "deviation, founder to approve".
- [ ] **Step 2:** Fix every non-data difference (spacing, type, colour, radius, icon). Re-run until only data-driven differences remain.
- [ ] **Step 3:** Install the branch in the iOS Simulator native shell (`feat/capacitor-ios-wrapper` pointed at a local server or a Vercel preview) and walk Home → quiz → results → review answers with the founder, Free and Pro, both themes.
- [ ] **Step 4:** Founder approves (or lists changes). No ship without this.

### Task 9: Ship

- [ ] **Step 1:** `node tests/uat.js`, `node tests/tech-debt.js`, `npx playwright test` all green; `app.js` ≤ 8301 lines.
- [ ] **Step 2:** (use the next free version if S1 shipped on its own first) `node scripts/bump-version.js 8.183.0 "Lift A: Home, quiz, results and review answers match the June iOS design on phones"`, `trim-version-history.js`, CHANGELOG row, `stamp-facts.js`; bump `dg-system.css?v`, `lift-screens.css?v`, `lift-ios.css?v`.
- [ ] **Step 3:** Founder says "ship it". Merge `feat/lift-a` to `main` (fast lane), push, wait for both workflows, then drive the prod URL at 390px per CLAUDE.md post-deploy verification.
- [ ] **Step 4:** Notion: tick S1 and S2 only if their done-tests are observably true on the founder's phone.
