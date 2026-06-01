# M7 Migration — Resume State (checkpoint 2026-06-01)

Branch: `feature/m7-migration` (off `main` @ dc099f0 minify + 5c3e8ee scaffold). Pushed.
Plan: `docs/superpowers/plans/2026-05-31-m7-csp-unsafe-inline.md`
Approach: batched into **PR-A (all handler migration)** + **PR-B (CSP flip)** — see that plan's slices.

## DONE (committed `d553593`, verified)
- **index.html: 102 → 0** inline handlers (ALL types) migrated to `data-action`.
- `event-actions.js`: 16 `ACTIONS` wrappers added for compound/event-needing/exotic index.html handlers
  (preventDefault/stopPropagation, async bug-report `openBugReport`, `this.checked/value` form handlers, etc.).
- **30 UAT structural tests** updated onclick→data-action. **UAT = 2668 (zero net-new vs main baseline 2668).**

## REMAINING — app.js (69 inline handlers: 67 onclick + 1 onkeydown L14001 + 1 onchange L14000)
Recipe: `onclick="fn(${x})"` → `data-action="fn" data-args="${escAttr(JSON.stringify([x]))}"` (escAttr ~app.js:15722).
**Mind the string context** — two styles in app.js:
- template-literal (`${...}`): use `${escAttr(JSON.stringify([x]))}`
- single-quote concat (`'fn(\'' + v + '\')'`): build as `' data-action="fn" data-args="' + escAttr(JSON.stringify([v])) + '"'`

### ~57 mechanical (simple fn-call) — convert per recipe
srMarkConfidence (×9), focusTopic (×4: L5291,10413,10653,16664), showTopicDeepDive, drillDomain (L14959,14979,17163),
_anaAccChartTab (×3 L14276-78), startAclPbq (×2), srPickAnswer (×2), aclMoveRule (×2 L4850-51), _setReviewFilter (×2 L8335,8351),
_closeDesktopOnlyNudge (×2), srToggleMultiPick, srSubmitMultiPick, startSrReview, startSession, startDailyChallenge,
startStreakSave, showReview (L5516 — 2-arg), jumpToQuestion (L5784), showPage('progress');renderProgressPage() (L14745 → wrapper),
saveGhToken/revealGhToken/copyGhToken (L1336-37), submitAclPbq, openAclPbqPicker, openGuidedLab (L13651),
downloadAutoBackup/restoreFromAutoBackup (L11120-21), explainFurther/followUpOnMistake/reportIssue (L7306-19),
_startReadinessRefreshQuiz/_startReadinessWeakestQuiz (L14540,14553), applyPreset('warmup') (L15612), goSetup (L15951),
_shareDesktopOnlyLink/_copyDesktopOnlyLink (L1119-20), startAclPbq (L4802,4912).

### ~12 SURGERY (need judgment / new wrappers / data-source refactor)
- **Dynamic handler = variable** (trace where the string is built, refactor source to {action,args}):
  - L4567 `onclick="' + onclick + '"`
  - L5322 `onclick="' + ctaFn + '"`
  - L15487 `onclick="${p.drillBtn.onclick}"`  (p.drillBtn — change data object to carry {action,args})
- **Inline DOM expr → new ACTIONS wrapper:**
  - L6189 `document.getElementById('exam-shortfall-banner')?.remove()` → e.g. `dismissExamShortfall`
  - L13966-13969 `document.getElementById('ana-s-*')?.scrollIntoView(...)` (×4) → `scrollToAnaSection` + data-args=[sectionId]
  - L13998 `document.getElementById('${inputId}').showPicker()` → `showDatePicker` + data-args=[inputId]
- **Multi-line escaped-arg** (`escHtml(...).replace(/'/g,...)` spans lines): L7302, L8426, L13533 (showTopicDeepDive)
- **Exam-date pair:** L14000 `onchange="updateExamDate(this.value)"` → wrapper `updateExamDateFromValue`;
  L14001 `onclick="event.stopPropagation();updateExamDate('')"` → `updateExamDateStop` (ACTIONS exists);
  also an `onkeydown=` near L14001 (the date-chip-clear keyboard handler) — convert/handle it too.
- **L15902** `onclick="..."` — INSPECT (grep showed literal `...`; verify the real value).
- **L15931** `__aclSidebarHandlers['${it.page}']()` → `data-action="aclSidebar" data-args="${escAttr(JSON.stringify([it.page]))}"` (ACTIONS.aclSidebar exists).

## After app.js → 0
1. `tests/uat.js`: set BOTH Sec-P7 ratchet ceilings to `=== 0` (idxHandlers already 0; appHandlers→0). Update any app.js-asserting structural tests onclick→data-action.
2. Verify: `grep -coE '\son[a-z]+="' app.js` == 0  AND  UAT == 2668 (zero net-new).
3. Commit → PR-A → preview → squash-merge (still permissive CSP, no breakage).
4. **PR-B (flip):** externalize/hash the 3 inline `<script>` blocks (bootstrap ~L43, importmap ~L1554, tail ~L1627),
   remove `'unsafe-inline'` from `script-src` in vercel.json (leave style-src), flip the Sec-P7 FLIP guard to hard-assert,
   then **exhaustive console-walk on the Vercel preview** (zero "Refused to execute inline event handler" / "inline script") before merge.
   Rollback = restore `'unsafe-inline'` in vercel.json, redeploy.

## Verification commands
```
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
grep -coE '\son[a-z]+="' app.js index.html        # target 0 / 0
node tests/uat.js 2>&1 | grep -oE 'UAT: [0-9]+/[0-9]+ — [0-9]+ FAILED'   # target 2668
```
