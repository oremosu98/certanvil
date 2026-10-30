# Results That Tell the Truth (phones) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On phones, a finished practice quiz shows how readiness moved (before → after, delta) and the streak, in place of the exam-style scaled score; the shared grade copy stops naming Messer and "exam-ready".

**Architecture:** A new pure model `_iosReadinessChangeModel` in `features/ios-quiz.js` turns {before, after, practice, cert, streak} into the card's content. `finish()` in `features/quiz-engine.js` captures the readiness snapshot and streak *before* they are overwritten, publishes them on `window._iosResultsCtx`, and calls `renderIosResults()` once, after `_writeReadinessSnapshot()` (today it renders before). The card replaces `.ir-scaled`; CSS is a lift of the approved drawing.

**Tech Stack:** vanilla JS IIFEs, `lift-ios.css` (phone gate `max-width:899px`), UAT (`tests/uat/*.js`, vm-sandboxed `_fnBody`), Playwright (`tests/e2e/lift-a.spec.js`).

**Spec:** `docs/superpowers/specs/2026-10-30-ios-results-readiness-design.md`
**Approved drawing:** `.claude/worktrees/june-e2e/mockups/cert-ios-results.html` (branch `feat/cert-ios-e2e`, commits `b988b933` + A-line fix). The `.rch*` CSS (lines 84-97, delay line 149) and the count-up script (lines 318-357) are the source to lift.

## Global Constraints

- Fast lane: commit to `main`, no gated files touched (`auth-state.js`, `cloud-store.js`, `lib/supabase.js`, `sw.js`, migrations are out of bounds).
- Copy uses the middle dot `·` and the minus sign `−` (U+2212) for drops. No em dashes in on-screen copy.
- A drop is never red: the down pill uses the neutral ink tone, same as "No change".
- Motion: BRAND §6. Curve `var(--ios-ease)` (= `cubic-bezier(0.16, 1, 0.3, 1)`); the number counts from before to after over **900ms**, once per finished session; under `prefers-reduced-motion: reduce`, when held, or for practice, the number is static.
- Exam Simulator results (`features/exam.js`, UAT 495) are unchanged. Desktop gets only the copy change; the desktop scaled card stays.
- **Redo this quiz** stays the primary button; stats, difficulty split, answer list and footer are unchanged.
- Never write user-state localStorage on prod / `*.vercel.app`.

### Exact copy (verbatim from the spec)

| Grade | Headline (innerHTML) | Line |
|---|---|---|
| A | `Strong <em>session.</em>` | Nearly all right. Keep it fresh with a review now and then. |
| B | `Good <em>session.</em>` | A few to go back over. Review answers shows which. |
| C | `Getting <em>there.</em>` | Go back over the misses, then try another set. |
| D | `Tough <em>set.</em>` | Read the explanation for each miss before the next one. |
| F | `Hard <em>going.</em>` | Read the explanation for each miss, then try another set. |

Card copy (`<cert>` = short cert name, e.g. `Network+`, from `CERT_PACK.meta.name` with the vendor prefix stripped exactly as `renderIosReview` does at `features/ios-quiz.js:184`):
- Up / down label: `Readiness · <cert>`; delta `+14` / `−8`
- Held label: `Readiness held · <cert>`; delta `No change`; no "from" number
- First reading label: `Readiness placed · <cert>`; no from, no delta; note `Your first reading on <cert>. It moves with every set you finish.`
- Practice label: `Practice only`; no number row; note `Mistake drills don't change your readiness. They're for fixing what you got wrong.`
- Streak: `Streak started · day 1` / `Streak kept · day N` / `Day N · today already counted`

## Review Focus

1. **Theme toggle after finishing** re-renders the results: the number must show the final value, not count again (Task 3 e2e).
2. **Streak broken then restarted** (last streak day was 3 days ago, current resets to 1): must read "Streak started · day 1", not "today already counted" (Task 2 UAT).
3. **Second quiz the same day**: streak line reads "Day N · today already counted" (Task 2 UAT).
4. **Readiness unavailable** (`after` null outside practice, e.g. a corrupt snapshot map): the card is omitted and the rest of results still render (Task 2 UAT + Task 3 render guard).
5. **Redo after finishing**: a new session counts up again from its own before value (Task 3: count-up keyed on the `log` identity, same as `_irFinishedLog`).

## Cross-platform

- iOS app (Capacitor) and mobile web ≤899px (Chrome + WebKit): the new card. Verified in the Simulator build and Playwright phone viewport.
- Desktop and Safari desktop: copy change only; `#ios-results` stays hidden (existing lift-a desktop test).
- No network or lifecycle change: the readiness numbers come from localStorage already written by `finish()`.

---

### Task 1: Shared grade copy

**Files:**
- Modify: `features/quiz-engine.js:1825-1831` (the `headlines` object in `finish()`)
- Modify: `index.html:1300-1301` (placeholder headline + lede)
- Test: `tests/uat/050-progress-acl-editorial.js:810-811`

**Interfaces:**
- Produces: the five grade rows exactly as in the Exact copy table; `renderIosResults` keeps reading them from `#result-headline` / `#result-sub`.

- [ ] **Step 1: Update the UAT guard and add a tombstone**

Replace the `Crushing <em>` regex at 050:811 with `/headlines\s*=\s*\{[\s\S]{0,600}Strong <em>session\.<\/em>/`. Add after it:

```js
test('30 Oct: grade copy talks about the session, never Messer or "exam-ready"',
  !/Messer videos/.test(js) && !/exam-ready on this topic/.test(js)
  && /Hard <em>going\.<\/em>', 'Read the explanation for each miss, then try another set\.'/.test(js));
```

- [ ] **Step 2: Run** `node tests/uat.js 2>&1 | grep -E "grade copy|Strong <em>|ALL PASS|FAIL"` — expect both new checks FAIL.
- [ ] **Step 3: Replace the five `headlines` rows** with the table values (A-F order unchanged), and set `index.html:1300-1301` to `Strong <em>session.</em>` / `Nearly all right. Keep it fresh with a review now and then.`
- [ ] **Step 4: Run** `node tests/uat.js` — expect `ALL PASS`.
- [ ] **Step 5: Commit** `git commit -m "results: grade copy about the session, no Messer or exam-ready"`

### Task 2: Readiness change model (pure)

**Files:**
- Modify: `features/ios-quiz.js` (add next to `_iosResultsModel`, export on `window`)
- Test: `tests/uat/482-ios-quiz.js` (new block after the Results model tests)

**Interfaces:**
- Produces: `_iosReadinessChangeModel(o) → null | { kind, label, from, to, delta, tone, note, streak }` where
  - `o = { before: number|null, after: number|null, practice: boolean, cert: string, streak: { current: number, lastBefore: string|null, today: string } }`
  - `kind ∈ 'up'|'down'|'held'|'placed'|'practice'`; `tone ∈ 'up'|'down'|'held'|''`; `from` is `null` for held/placed/practice; `to` is `null` for practice; `note` is `''` when none.
  - Returns `null` when not practice and `after` is not a finite number (Review Focus 4).
  - Streak rule: `lastBefore === today` → `Day N · today already counted`; else `current === 1` → `Streak started · day 1`; else `Streak kept · day N` (N = `current`).
- Exported as `window._iosReadinessChangeModel`. Self-contained (no outside helpers) because UAT runs its `_fnBody` in a bare vm.

- [ ] **Step 1: Write the failing UAT block** (extract with `_fnBody(js, '_iosReadinessChangeModel')`; the name is unique, no prefix trap):

```js
const RC = (o) => vm.runInContext('_iosReadinessChangeModel(__o)', Object.assign(ctx, { __o: o }));
const st = (current, lastBefore) => ({ current, lastBefore, today: '2026-10-30' });
const up = RC({ before: 612, after: 626, practice: false, cert: 'Network+', streak: st(4, '2026-10-29') });
test('Readiness change: up reads "Readiness · Network+", 612 → 626, "+14", streak kept day 4',
  up.kind === 'up' && up.label === 'Readiness · Network+' && up.from === 612 && up.to === 626 && up.delta === '+14' && up.tone === 'up' && up.streak === 'Streak kept · day 4');
const dn = RC({ before: 626, after: 618, practice: false, cert: 'Network+', streak: st(4, '2026-10-30') });
test('Readiness change: drop uses the minus sign, calm tone; second set today is "already counted"',
  dn.kind === 'down' && dn.delta === '−8' && dn.tone === 'down' && dn.streak === 'Day 4 · today already counted');
const held = RC({ before: 626, after: 626, practice: false, cert: 'Network+', streak: st(5, '2026-10-29') });
test('Readiness change: held reads "Readiness held · Network+", "No change", no from',
  held.kind === 'held' && held.label === 'Readiness held · Network+' && held.delta === 'No change' && held.from === null && held.to === 626);
const first = RC({ before: null, after: 584, practice: false, cert: 'Network+', streak: st(1, null) });
test('Readiness change: first reading is "placed", with its note and "Streak started · day 1"',
  first.kind === 'placed' && first.label === 'Readiness placed · Network+' && first.from === null && first.delta === null
  && first.note === 'Your first reading on Network+. It moves with every set you finish.' && first.streak === 'Streak started · day 1');
const pr = RC({ before: 626, after: 626, practice: true, cert: 'Network+', streak: st(4, '2026-10-29') });
test('Readiness change: a mistake drill is "Practice only" with no number',
  pr.kind === 'practice' && pr.label === 'Practice only' && pr.to === null && pr.note === "Mistake drills don't change your readiness. They're for fixing what you got wrong.");
test('Readiness change: a broken streak restarting reads "Streak started · day 1"',
  RC({ before: 600, after: 610, practice: false, cert: 'Security+', streak: st(1, '2026-10-27') }).streak === 'Streak started · day 1');
test('Readiness change: no readiness outside practice → null (card omitted)',
  RC({ before: 600, after: null, practice: false, cert: 'Network+', streak: st(2, '2026-10-29') }) === null);
```

- [ ] **Step 2: Run** `node tests/uat.js 2>&1 | grep -E "Readiness change|ALL PASS"` — expect FAIL.
- [ ] **Step 3: Implement `_iosReadinessChangeModel(o)`** per the Interfaces block and the Exact copy section.
- [ ] **Step 4: Run** `node tests/uat.js` — expect `ALL PASS`.
- [ ] **Step 5: Commit** `git commit -m "ios results: readiness change model"`

### Task 3: Wire the card into phone results

**Files:**
- Modify: `features/quiz-engine.js` — near `_prevStreakBefore` (:1793), the `renderIosResults` call (:1889), and after `_writeReadinessSnapshot()` (:1982)
- Modify: `features/ios-quiz.js` — `_iosResultsModel` (drop `scaledLabel/scaled/max/verdict` and their inputs), `renderIosResults` (:89-138)
- Modify: `lift-ios.css` — replace the `.ir-scaled*` rules (:385-392, :443, :455) with `.ir-rch*`
- Test: `tests/uat/482-ios-quiz.js` (Results model tests), `tests/e2e/lift-a.spec.js` (:170-189)

**Interfaces:**
- Consumes: `_iosReadinessChangeModel` (Task 2); `window._readReadinessSnapshots()` (readiness.js:1406); `getStreak()` (app.js:3176).
- Produces: `window._iosResultsCtx = { before: number|null, practice: boolean, streakLastBefore: string|null }`, set in `finish()` before any write; `renderIosResults()` reads it plus `_readReadinessSnapshots()[CURRENT_CERT].score` (after) and `getStreak().current`.

- [ ] **Step 1: Update tests first.**
  - 482: drop `scaled/pass/max/vendorCode` from `base` and the two scaled/verdict tests; keep headline/sub/rows/split/review/mistakes tests (update the headline fixture to `Hard <em>going.</em>` / its line).
  - lift-a: in the first phone test, replace the `.ir-scaled-of` assertion with `await expect(page.locator('#ios-results .ir-rch-lbl')).toHaveText(/^Readiness (placed )?· /)` and `await expect(page.locator('#ios-results .ir-rch-streak')).toContainText('day')`; replace the CLF `/ 1000` test with `phone: a mistake drill shows "Practice only" and no number` (inject the quiz, run `page.evaluate(() => { wrongDrillMode = true; })` before answering, finish it; expect `.ir-rch-lbl` = `Practice only` and `.ir-rch-num` count 0); add `phone: theme toggle after finishing keeps the final readiness number` (finish, read `.ir-rch-num` text after 1.2s, click `[data-act="theme"]`, expect the same text immediately).
- [ ] **Step 2: Run** `node tests/uat.js` and `npx playwright test tests/e2e/lift-a.spec.js` — expect the new/changed checks to FAIL.
- [ ] **Step 3: `finish()` changes.** Next to `_prevStreakBefore`, set `window._iosResultsCtx` (before from the snapshot map for `CURRENT_CERT`, `practice: !!wrongDrillMode`, `streakLastBefore: getStreak().last || null`), each read in a `try`. Move the `renderIosResults` line from :1889 to directly after `_writeReadinessSnapshot();` (:1982). `showPage('results')` is at :2002, so nothing paints in between.
- [ ] **Step 4: `renderIosResults` changes.** Build the card from `_iosReadinessChangeModel` (cert name as at :184; today = `new Date().toISOString().slice(0, 10)`, matching `updateStreak`). Markup mirrors the drawing with an `ir-` prefix: `.ir-rch.ir-reveal` (+ `.ir-practice`) > `.ir-rch-lbl`, `.ir-rch-row` (`.ir-rch-from`, `.ir-rch-arrow` `→` aria-hidden, `.ir-rch-num`, `.ir-rch-delta.ir-<tone>`), `.ir-rch-note` when non-empty, `.ir-rch-streak` with the drawing's flame path. Omit the whole card when the model is `null`. Count-up: only when this render is the first for this `log` (reuse the `_irFinishedLog` check, captured before it is reassigned), kind `up`/`down`, and not reduced motion; rAF over 900ms from `from` to `to`, else write `to` directly.
- [ ] **Step 5: CSS.** Lift drawing lines 84-97 as `#ios-results .ir-rch*`, mapping `--muted→--text-dim`, `--ink→--text`, `--ink-soft→--text-mid`; keep the `.ir-scaled` animation-delay `.10s` on `.ir-rch`; delete the `.ir-scaled*` rules.
- [ ] **Step 6: Run** `node tests/uat.js`, `npx playwright test tests/e2e/lift-a.spec.js`, `node tests/tech-debt.js` — expect all pass.
- [ ] **Step 7: Live-verify** at 390px on `localhost:3131` (light + dark): up state after a second quiz, first reading on a fresh profile, practice after a drill. Zero console errors. Screenshot each.
- [ ] **Step 8: Commit** `git commit -m "ios results: readiness change card replaces the scaled score"`

### Task 4: Ship (fast lane)

- [ ] `/ship`: UAT + tech-debt, `bump-version.js 8.202.0 "iOS results show the readiness change, not an exam score"`, CHANGELOG row, `stamp-css-versions --check`, push, CI + Deploy Verification, curl live version.
- [ ] Rebuild the real iOS app in the Simulator against prod and finish a quiz; check the card.
- [ ] Mindmatrix: tick **R1** only if its done-test is true on the phone; otherwise note progress in its body.
