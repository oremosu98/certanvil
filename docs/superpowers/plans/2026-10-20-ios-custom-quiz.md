# iOS Custom Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On phones (<900px), replace the squeezed desktop custom-quiz panel with the June E2E's full-screen
Custom quiz, built from the approved mockup and wired to the real controls.

**Architecture:** `features/ios-custom.js` follows the Lift A pattern. A DOM scraper (`_iosCustomSource`) reads
the existing hidden panel (`#custom-quiz-section`) into plain data. A pure model (`_iosCustomModel`) and a pure
view (`_iosCustomHtml`) render the screen into `#ios-custom`. Every tap clicks the matching hidden control, so the
desktop panel stays the only source of truth, and the screen then re-renders. The CSS is ported from the mockup
into `lift-ios.css` with the `ic-` prefix.

**Tech Stack:** vanilla JS (IIFE exporting to `window`), CSS, UAT vm sandbox (`tests/uat/`), Playwright
(`tests/e2e/lift-a.spec.js`).

**Spec:** `docs/superpowers/specs/2026-10-20-ios-custom-quiz-design.md` (parent:
`docs/superpowers/specs/2026-10-19-ios-launch-june-design.md`, Fidelity rule).
**Design reference:** `mockups/cert-ios-custom-quiz.html` on `feat/cert-ios-e2e` at `c75e41e8`, served by the
june-e2e worktree on `http://localhost:3207/`.

## Global Constraints

- Branch `feat/lift-a`, main checkout. It ships with Lift A as one release (Lift A plan, Task 9). Do not bump the
  version in this plan.
- **No new lines in `app.js`** (ratchet: baseline + allowance = 8301, currently 8300). All new code goes in
  `features/ios-custom.js`.
- Phone gate: `matchMedia('(max-width: 899px)')`. Desktop behaviour stays byte-identical.
- Escape every string with `escHtml`. Topic and domain names reach `innerHTML`.
- **No cap note and no dimming of 20 before Stage 6.**
- Exact copy:
  - Title "Custom quiz", sub "Topic, difficulty and count".
  - Sections "Topic", "How to choose questions", "Or build it by topic", "Difficulty", "Count".
  - Topic sub "Pick a domain, or open one below to choose exact topics."
  - Build sub "Open a domain to pick the exact areas you want."
  - Smart "Targets the topics you keep getting wrong."
  - Mixed "A random spread across every topic."
  - Catch-up "Topics you haven't seen lately."
  - Count unit "questions". Button "Start quiz" plus "N Q".
- Catch-up line: "**N** not practised in a week". N = 0 gives "All practised this week.". With no history the
  line is hidden.
- Accordion line "N topics", plus " · 2 picked" or " · all picked".
- Difficulty labels Foundational / Exam level / Hard / Mixed, mapped from `data-v` Foundational / Exam Level /
  Hard / Tricky / Mixed.
- Footer line, always one line (`nowrap` plus ellipsis):
  - topics picked: "N topic(s) from A and B, diff." With more than 2 domains: "from N domains".
  - Smart: "Your weakest topics, diff."
  - Catch-up: "The topics you've gone longest without, diff."
  - Mixed: "Mixed spread across all topics, diff."
  - diff is foundational / exam level / hard / mixed difficulty.
- Motion:
  - `--ios-ease` only. Accordion uses grid-rows with a chevron rotate.
  - Tick opacity fades. Count echo bumps.
  - Hover is gated behind `(hover:hover) and (pointer:fine)`.
  - Under `prefers-reduced-motion`, the transitions are removed.
  - Nothing else moves (visual pass, stage 2).

## Review Focus

1. **Another cert** (Security+ has different domains and topics). The screen must list exactly that cert's
   domains and topics. Pinned in Task 3 (`custom: Security+ lists its own domains`).
2. **Opening twice** (`_jumpToCustomQuiz()` while the screen is already open). Expect no duplicate screen and no
   stuck scroll lock (`document.documentElement.style.overflow === ''`). Pinned in Task 3.
3. **Viewport grows past 899px** while the screen is open. The phone screen clears and nothing is left
   half-open. Pinned in Task 3.
4. **History rows with a missing or invalid date.** Treat them as never seen, without throwing. Pinned in Task 1.
5. **Leaving Setup by any route** (Start, a page switch). On return, Home shows, not a stale custom screen.
   Pinned in Task 3.

---

### Task 1: Pure model

**Files:**
- Create: `features/ios-custom.js` (IIFE in the same shape as `features/ios-home.js`)
- Test: `tests/uat/483-ios-custom.js`

**Interfaces:**
- Produces: `_iosCustomModel(src, now) -> model` (window export).
  - **`src`:**
    - `{ cert:{mark,name,code}, domains:[{idx, name, short, weight, topics:[{v,label,on}]}], modes:[{kind:'smart'|'mixed'|'catchup', v, on}], diffs:[{v,on}], counts:[{v,on}], history:[{topic,date}], err:'' }`
  - **`model`:**
    - `{ cert, domains:[{idx, name, weight, topicCount, picked, pickedLabel, allOn, expanded, topics}], modes:[{kind,v,on,title,sub}], catchup:{show,n,text}, diffs:[{v,label,on}], counts:[{v,on}], count, foot, err }`
  - Self-contained, no globals (UAT runs it in a bare vm via `_fnBody`).

- [ ] **Step 1: Write failing UAT tests** in `tests/uat/483-ios-custom.js`, modelled on `482-ios-quiz.js`. Build
  `src` with 3 domains (shorts Concepts / Implementation / Security, 4 topics each). Tests, with exact values:
  - `foot`, Mixed on, diff Mixed: `'Mixed spread across all topics, mixed difficulty.'`
  - `foot`, Smart, Exam Level: `'Your weakest topics, exam level.'`
  - `foot`, Catch-up, Hard / Tricky: `"The topics you've gone longest without, hard."`
  - `foot`, 3 topics on (2 in Concepts, 1 in Security), Exam Level: `'3 topics from Concepts and Security, exam level.'`
  - `foot`, 1 topic, Foundational: `'1 topic from Concepts, foundational.'`
  - `foot`, topics in all 3 domains: `'N topics from 3 domains, …'`
  - `pickedLabel`: `''`, `'2 picked'`, `'all picked'`. `allOn` is true only when every topic in the domain is on.
  - `expanded`: true for exactly the domains with a picked topic.
  - Catch-up with `now` = 2026-10-20:
    - history empty: `show:false`
    - a topic seen 2 days ago and the rest never: `n = topicTotal-1`, `text:'not practised in a week'`
    - every topic seen within 6 days: `n:0`, `text:'All practised this week.'`
    - rows with `date: 'garbage'` or no date count as never seen and don't throw
  - `diffs` labels map to `['Foundational','Exam level','Hard','Mixed']`. `count` equals the `on` count's
    number (10).
- [ ] **Step 2: Run** `node tests/uat.js 2>&1 | tail -5`. Expected: the new 483 tests FAIL (model undefined),
  everything else passes.
- [ ] **Step 3: Implement `_iosCustomModel`** to the exact copy in Global Constraints. "Seen" means
  `Date.parse(row.date)` is finite and `now - date < 7 days`. Multiple history rows for the same topic: take the
  latest.
- [ ] **Step 4: Run** `node tests/uat.js 2>&1 | tail -3`. Expected: all pass. `tests/uat/_context.js`
  auto-loads every `features/*.js` into `js`, so nothing needs registering.
- [ ] **Step 5: Commit** `feat(ios-custom): pure model for the phone custom quiz`.

### Task 2: Pure view

**Files:**
- Modify: `features/ios-custom.js`
- Test: `tests/uat/483-ios-custom.js`

**Interfaces:**
- Consumes: the `model` from Task 1.
- Produces: `_iosCustomHtml(m) -> string`. The markup mirrors the mockup body structure (topbar, cert strip,
  sections, `.ic-mode` / `.ic-mode-wide`, `.ic-dom`, `.ic-seg`, `.ic-count-echo`, sticky `.ic-foot`) with
  `ic-`-prefixed classes.
  - Hooks:
    - topbar: `data-act="close"`, `data-act="theme"`
    - mode cards: `data-act="mode" data-v`
    - domain chips: `data-act="domain" data-idx`
    - accordion header: `data-act="acc" data-idx`
    - topic chips: `data-act="topic" data-v`
    - difficulty: `data-act="diff" data-v`
    - count: `data-act="count" data-v`
    - Start: `data-act="start"`
  - State attributes: `aria-pressed` on every pickable, `aria-expanded` on `.ic-dom`.
  - When `m.err` is set, `.ic-err` renders above the footer.

- [ ] **Step 1: Write failing UAT tests.**
  - A topic label `'<img src=x onerror=1>'` renders escaped.
  - The Catch-up card renders `.ic-mode-wide`. The `.ic-live` line is absent when `catchup.show` is false.
  - Exactly 4 difficulty buttons and 4 count buttons (5/10/15/20).
  - The output contains `Start quiz` and `10 Q`.
  - The output does **not** contain `needs Pro` or `data-overcap`.
  - `.ic-err` appears only when `err` is set.
  - No em dash anywhere in the output (`!/—/.test(html)`).
- [ ] **Step 2: Run UAT.** Expected: the new view tests FAIL.
- [ ] **Step 3: Implement `_iosCustomHtml(m)`**, using the mockup's inline SVG icons (sun / shuffle / clock-rewind
  / tick / chevron / play) copied from `mockups/cert-ios-custom-quiz.html`.
- [ ] **Step 4: Run UAT.** Expected: all pass.
- [ ] **Step 5: Commit** `feat(ios-custom): pure view`.

### Task 3: Wire it to the real controls

**Files:**
- Modify: `features/ios-custom.js` (scraper, render, bindings, boot)
- Modify: `index.html`:
  - `<section id="ios-custom" class="ios-only iq-screen" aria-label="Custom quiz"></section>` directly after
    `#ios-home`
  - `<script src="features/ios-custom.js">` after `features/ios-home.js`
- Modify: `lift-ios.css` (new section `CUSTOM QUIZ (cert-ios-custom-quiz.html)`)
- Test: `tests/e2e/lift-a.spec.js` (new `describe('Lift A custom quiz (phone)')`), `tests/uat/470-lift-a-scaffold.js`
  (container and script present)

**Interfaces:**
- Consumes: `_iosCustomModel`, `_iosCustomHtml`. App globals: `escHtml`, `loadHistory`, `CURRENT_CERT`,
  `CERT_PACK`, `CERT_CODE`, `MIXED_TOPIC`, `CATCHUP_TOPIC`, `window.startQuiz`, `toggleTheme`.
- Produces:
  - `_iosCustomSource() -> src`, which scrapes:
    - modes: `#topic-group .cq-mode-card`
    - domains: `details.topic-domain-group[data-domain-idx]`, name from `.dom-name`, weight from `.dom-weight`,
      topics from `.chip[data-v]`
    - domain short names: `.tdp-pill[data-domain-idx]` text without the leading number
    - `#diff-group .chip` and `#count-group .chip`
    - `#setup-err` text when it lacks `.is-hidden`
    - cert info as in `_iosHomeModel`
  - `window.renderIosCustom()`, `window.closeIosCustom()`.

- [ ] **Step 1: Write failing Playwright tests** at 390×844, reusing the Lift A spec's setup and its
  `fetchQuestions` stub:
  - `custom: Home "Build a custom quiz" opens the phone screen`
    - `#ios-custom` is non-empty, `#ios-home` is hidden, `#custom-quiz-section` is hidden
    - `document.documentElement.style.overflow === ''`
  - `custom: Catch-up card drives the real chip`. Tap `.ic-mode-wide` →
    - `#topic-group .chip[data-v="Mixed — Catch-up"]` has class `on`
    - the footer reads "The topics you've gone longest without, …"
  - `custom: domain chip picks the domain`. Tap the 1.0 domain chip →
    - every chip in `details[data-domain-idx="1"]` is `on`
    - the phone accordion reads "· all picked"
    - the mode cards are off
  - `custom: topic, Hard and 5 reach the hidden controls`. Assert each `.on` in `#topic-group` / `#diff-group`
    (`Hard / Tricky`) / `#count-group` (`5`).
  - `custom: Start generates with the chosen settings`
    - Start → `#page-quiz.active`, `#ios-custom` empty
    - the stub received the chosen count
  - `custom: ✕ returns Home` → `#ios-home` visible, `#ios-custom` empty.
  - `custom: drill-a-topic opens with the topic picked and its domain open`
    - this is the real user path: with seeded history, go to Progress and tap the first `.t-row[data-topic]`
      (`drillTopic` is IIFE-private)
    - `#ios-custom` is open, its `.ic-dom` for that topic's domain has `aria-expanded="true"` and "1 picked",
      and that topic chip has `aria-pressed="true""
  - `custom: setup error shows inside the screen`
    - write text into `#setup-err`, remove `.is-hidden`, call `showSetupError()`
    - `.ic-err` contains the text
  - Review Focus:
    - `custom: opening twice leaves one screen and no scroll lock`
    - `custom: Security+ lists its own domains`. With `nplus_dev_cert=secplus`, the `.ic-dom` count equals the
      count of `details.topic-domain-group`, and the first name matches its `.dom-name`.
    - `custom: growing past 899px clears the phone screen`
    - `custom: leaving Setup closes it`. Open it, then `showPage('progress')`, then `goSetup()`: Home shows and
      `#ios-custom` is empty.
  - `custom: desktop still gets the modal`. At 1280×900, `_jumpToCustomQuiz()` → `#custom-quiz-section[open]`
    is visible and `#ios-custom` is empty.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/lift-a.spec.js --project=chromium -g custom`. Expected:
  all FAIL.
- [ ] **Step 3: Implement the wiring** in `features/ios-custom.js`:
  - **Toggle intercept.** At boot, add a `toggle` listener on `#custom-quiz-section`. When `cq.open` is true and
    the phone gate matches: set `cq.open = false` (the app's existing listener then restores scroll and moves the
    panel back), then `renderIosCustom()` and scroll the window to the top. If a domain is expanded, scroll the
    first `.ic-dom[aria-expanded="true"]` to `block:'center'` instead.
  - **Taps.** Each tap `.click()`s the matching hidden control:
    - mode: `.cq-mode-card[data-v]`
    - topic: `#topic-group .chip[data-v]`
    - domain: `.tdp-pill[data-domain-idx]`
    - diff: `#diff-group .chip[data-v]`
    - count: `#count-group .chip[data-v]`

    Then call `renderIosCustom()`. Keep `expanded` state for accordions the user toggled, in a module map keyed
    by `idx`, merged with the model's `expanded`.
  - **Buttons.**
    - Start: `closeIosCustom()`, then `window.startQuiz()`.
    - ✕: `closeIosCustom()`, then scroll to the top.
    - Theme: `toggleTheme()`, then re-render.
  - **Close triggers.** A `MutationObserver` on `#page-setup`'s `class` closes the screen when `.active` is lost.
    A `matchMedia('(max-width: 899px)')` change listener closes it when the media query stops matching.
- [ ] **Step 4: Port the CSS.**
  1. Extract the mockup's `<style>` (screen-relevant rules only, without the `.stage` / `.phone` / `.hint`
     chrome) to a temp file.
  2. Run `python3 <scratchpad>/port_css.py <file> '#ios-custom' ic-`.
  3. Append the result to `lift-ios.css`, along with:
     - `#page-setup:has(#ios-custom:not(:empty)) > :not(#ios-custom) { display:none !important }`
     - the topbar-hide rule mirroring the Home rule
     - `#custom-quiz-section { display:none !important }`, phone only, since `lift-ios.css` is media-gated
     - a sticky `.ic-foot` using the same `100dvh` column pattern as `.iq-qfoot`
- [ ] **Step 5: Run** the custom Playwright tests. Expected: all PASS. Then run
  `node tests/uat.js 2>&1 | tail -3`. Expected: all pass. Run `node scripts/stamp-css-versions.js` if the
  cache-bust check fails.
- [ ] **Step 6: Commit** `feat(ios-custom): phone custom quiz wired to the real controls`.

### Task 4: Fidelity against the E2E

**Files:**
- Modify: `scripts/lift-sbs.js` (add `['custom-quiz', 'cert-ios-custom-quiz.html', 'cq']`; the `cq` driver
  calls `window._jumpToCustomQuiz()` after load)
- Modify: `lift-ios.css` (fix deltas only)

- [ ] **Step 1: Run** `node scripts/lift-sbs.js` with both servers up (3199 = repo, 3207 = june-e2e mockups).
  Expected: `test-results/lift-a-sbs/custom-quiz-{dark,light}.png` is written.
- [ ] **Step 2: Compare each pair by eye.**
  - Top bar, cert strip, chip row, bento 2 + 1, accordions, segments, count echo and footer must match in
    spacing, type, colour and radius.
  - Expected differences, which come from real data and are not defects: the topic lists, the default
    difficulty (the live app defaults to Exam Level), and the Catch-up count.
  - Fix any other delta in `lift-ios.css`. Log each accepted difference as a ruling.
- [ ] **Step 3: Simulator check.**
  - Open `http://127.0.0.1:3199/` in Safari on the iPhone 17 Pro simulator (`mcp__Claude_Code_iOS_Simulator__control
    open_url`). Open Custom quiz from Home and screenshot both themes.
  - Expected: Safari matches Chromium (`:has` and sticky footer behave), the footer stays one line, and no
    horizontal scroll.
- [ ] **Step 4: Run the full gates.**
  - `node tests/uat.js`
  - `node tests/tech-debt.js` (app.js ratchet unchanged)
  - `npx playwright test --project=chromium`, redirected to the workspace log; read the tail

  Expected: all green, apart from known flaky tests that pass on retry.
- [ ] **Step 5: Commit** `test(ios-custom): side-by-side fidelity + CSS deltas`.

The ship is Lift A plan Task 9, which now covers this work. It has two extra items:
- The `lift-ios.css?v` bump already covers this CSS.
- Tick Notion S2 only once its done-test (Home → custom quiz → quiz → review on the phone) is observably true
  in prod.
