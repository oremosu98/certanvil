---
up: "[[Drills MOC]]"
type: plan
status: active
cert: aplus-core1
updated: 2026-07-11
tags: [plan, drill, pbq, swatch, laser-print]
---
# Sim Lab PBQ Wave 4 — Implementation Plan (Laser Print Defect Clinic)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the final PBQ-program archetype — Laser Print Defect Clinic (A+ Core 1) — riding ONE new reference kind (`swatch`, the 8th), one static pure-CSS renderer, one set-based fidelity validator, and a 12-scenario two-agent-gated seed bank. No new step types, no new analyze modes, no new binding infrastructure.

**Architecture:** Everything reuses the live engine in `features/sim-lab.js` (configure/match/order step types, per-slot scoring, gating/exam paths — archetype-agnostic, proven across Waves 1-3). This wave ADDS: one archetype tag (`swatch`, 14th); one reference kind + renderer (`_slRenderRefSwatch` — deliberately static/illustrative like Wave 3's `slots`, zero interaction handles, zero `.sl-sel` surface); one fidelity validator (`simLabValidateSwatchFidelity`, defect → SET-of-acceptable-components truth table); one lifted CSS token block (`.swatch*` + per-theme paper/toner tokens); one gated seed batch (12 scenarios, `a1-swatch-NN`, objectives 3.6/3.7). Spec: `docs/superpowers/specs/2026-07-11-pbq-wave4-design.md`. Mockup (faithful-lift build target incl. its footer ENGINE-MAPPING comment): `mockups/laser-defect-clinic-concept.html`.

**Tech Stack:** Vanilla ES5-style JS (IIFE feature module, no build step), native `<select>` selection-first UI, `tests/uat.js` (vm sandbox + grab/grabLine extraction, DOM shim, NO jsdom), forged-bronze tokens in `dg-system.css`.

## Global Constraints

- Branch: create `feat/sim-lab-pbq-wave4` from up-to-date `main` before Task 1; all commits land there; PR at Task 10.
- Fast lane (JS + content + CSS tokens; no schema/auth/money; `sw.js` only via `bump-version.js` at ship). Ship target **v7.66.0**.
- ES5-style JS matching surrounding `features/sim-lab.js` code; no new deps.
- **Selection-first (HARD):** native `<select>`/`<button>` only — NO free-text input, NO clickable elements on the swatch itself. Must work Desktop + Safari/WebKit + iOS Capacitor.
- **Mockups ARE the build (faithful lift** — visual/interaction fidelity, not markup fidelity). **Where a mockup detail and the engine's conventions disagree, the engine wins.** If a task discovers it needs a second reference kind, a clickable swatch region, or a new step type — that is out of Wave 4 scope by spec: STOP and escalate.
- **XSS (HARD):** `title`, `caption`, and `notes` on the `swatch` kind are scenario data — render via `_esc()` before any markup wrapping. The per-defect aria strings come from a fixed internal table (`_SWATCH_ARIA`), NOT from scenario data, and are therefore safe.
- CSS: `dg-system.css` only (never `styles.css`); tokens only, **zero hardcoded hex** except the oklch values inside the token DEFINITIONS themselves (matching how the existing theme blocks define tokens); every bare `var(--x)` referenced MUST be DEFINED (the ratchet guard fails any NEW undefined bare `var()` — DEFINE them, never extend `KNOWN_GAPS`).
- Seed bank: 12 scenarios in `features/sim-lab-seed-aplus-core1.js` (cert `aplus-core1`), ids `a1-swatch-01` … `a1-swatch-12`, archetype `swatch`. Milestones/banks stay per-cert.
- **Dev-fixture rule (HARD):** no scenario enters the seed bank until it passes `simLabValidateSwatchFidelity` AND the two-agent consensus gate (**printer-domain hardware engineer + CompTIA 220-1201 examiner**, revise until BOTH approve).
- Do NOT run `bump-version.js` before Task 10. Hand-bump ONLY the `dg-system.css?v=` query when Task 3 touches CSS.
- UAT: use `test(name, cond)` (global) OR a block-local `assert` wrapper — mirror the surrounding block; never hardcode a global total-count literal; never assume all `a1-*` ids share one prefix pattern (Wave 3 CI lesson). Feature files are concatenated DEDENTED into the `js` string — extraction regexes for `var X = {...}` tables MUST use flexible whitespace (`\n\s*\};`), and the table literals themselves MUST stay multi-line.
- Binary-misdetect: `features/sim-lab.js` and the seed files are grep-misdetected as binary — always `grep -a` (or a Node script) against them.
- **Hand-derive validator logic against fixtures before trusting a green run** (Wave 3's two fidelity-validator bugs were both in plausible-looking literal code — this plan's own code included).
- Implementers work THEMSELVES (no sub-agents for code); reviewers do NOT `git stash`; verify DONE claims against `git log`/byte-diff.

---

## Reference contracts (used across tasks — keep names identical)

### The `swatch` reference kind (Task 1 validates, Task 2 renders)

```js
assets.reference = {
  kind: 'swatch',
  title: 'Sample output · front-desk LaserJet',   // required, non-empty string, _esc() on render
  defect: 'spots',                                 // required: 'spots'|'streak'|'smear'|'ghost'|'skew'
  caption: 'Last page printed · marks land at the same spot across pages',  // optional, non-empty if present
  notes: ['Model: mono laser, ~40k pages', 'Fresh paper: no change']        // optional string[], chips like slots
}
```

### The per-scenario fact block (Task 4 consumes — mirrors `scn.raid`)

```js
scn.swatch = {
  damageKind: 'permanent' | 'debris' | 'none'
  // 'permanent' (scratch, worn coating) → fix step must key a replace-class remedy
  // 'debris' (stuck toner/label residue) → fix step must key a clean-class remedy
  // 'none' → no remediation-coherence check (diagnosis-only scenarios)
}
```

### The truth table (Task 4 owns — defect → SET of acceptable components)

```js
var _SWATCH_CAUSES = {
  spots:  ['drum', 'roller'],
  streak: ['toner path', 'blocked toner', 'scratched drum'],
  smear:  ['fuser'],
  ghost:  ['cleaning blade', 'erase lamp', 'drum clean'],
  skew:   ['pickup roller', 'paper path', 'separation pad']
};
```
Matching is case-insensitive substring against the RESOLVED keyed option text (via `_slFidelityResolveSlot`). Author option texts to contain the set member verbatim (e.g. "Imaging drum · damage or debris prints every rotation" contains "drum").

### Step-id convention (Task 4 depends on it; Tasks 5-7 must follow it)

- The diagnosis configure step has `id: 'diagnose'` and a slot with `id: 'failedComponent'`.
- The optional remediation configure step has `id: 'fix'` and a slot with `id: 'remedy'`.
- Other steps/slots are free-form (order steps, match steps, extra slots like `defectPattern`, `verify`).

---

### Task 1: Branch, archetype tag, `swatch` validator branch

**Files:**
- Modify: `features/sim-lab.js:68` (kinds allowlist), `features/sim-lab.js:82` (kind branch), `features/sim-lab.js:87` (archetype list), plus a `_SWATCH_DEFECTS` const near the top of the IIFE (beside `STEP_TYPES`)
- Test: `tests/uat.js` (append to the existing sim-lab validator test block — find it with `grep -an "reference: bad kind" tests/uat.js`)

**Interfaces:**
- Produces: `simLabValidateScenario` accepts `kind:'swatch'` + `archetype:'swatch'`; `_SWATCH_DEFECTS = ['spots','streak','smear','ghost','skew']` (Task 2's renderer and Task 4's validator read this exact const name via `grab`).

- [ ] **Step 1: Create the branch**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git checkout main && git pull --ff-only
git checkout -b feat/sim-lab-pbq-wave4
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
node tests/uat.js | tail -3   # record the baseline pass count — expect ALL PASS
```

- [ ] **Step 2: Write the failing UAT checks** (append inside the sim-lab validator block in `tests/uat.js`, mirroring its local assert style)

```js
// Wave 4: swatch reference kind + archetype tag
var swOk = validate({ id: 'x', cert: 'aplus-core1', title: 't', scenario: 's', archetype: 'swatch', steps: [mkStep()], assets: { reference: { kind: 'swatch', title: 'Sample output', defect: 'spots' } } });
test('Wave 4: valid swatch reference accepted', swOk.ok);
test('Wave 4: swatch bad defect rejected', !validate({ id: 'x', cert: 'aplus-core1', title: 't', scenario: 's', steps: [mkStep()], assets: { reference: { kind: 'swatch', title: 'Sample output', defect: 'banding' } } }).ok);
test('Wave 4: swatch missing title rejected', !validate({ id: 'x', cert: 'aplus-core1', title: 't', scenario: 's', steps: [mkStep()], assets: { reference: { kind: 'swatch', defect: 'spots' } } }).ok);
test('Wave 4: swatch empty caption rejected', !validate({ id: 'x', cert: 'aplus-core1', title: 't', scenario: 's', steps: [mkStep()], assets: { reference: { kind: 'swatch', title: 'Sample output', defect: 'spots', caption: '' } } }).ok);
test('Wave 4: archetype swatch accepted', validate({ id: 'x', cert: 'aplus-core1', title: 't', scenario: 's', archetype: 'swatch', steps: [mkStep()] }).ok);
```
(`validate` / `mkStep` = whatever local helpers the surrounding block already uses — read the block first and mirror it exactly; if it calls the extracted function under a different local name, use that name.)

- [ ] **Step 3: Run UAT, verify the new checks FAIL** (`node tests/uat.js 2>&1 | grep -a "Wave 4"` — expect FAILs: 'reference: bad kind' / 'bad archetype')

- [ ] **Step 4: Implement.** Near the top of the IIFE (beside `STEP_TYPES`):

```js
var _SWATCH_DEFECTS = ['spots', 'streak', 'smear', 'ghost', 'skew'];
```

At line 68, add `'swatch'` to the kinds array. After the `slots` branch (line 82), add:

```js
      else if (ref.kind === 'swatch') {
        if (_SWATCH_DEFECTS.indexOf(ref.defect) === -1) errs.push('reference swatch: defect must be one of ' + _SWATCH_DEFECTS.join('/'));
        if (!_isNonEmptyStr(ref.title)) errs.push('reference swatch: title required');
        if (ref.caption !== undefined && !_isNonEmptyStr(ref.caption)) errs.push('reference swatch: caption must be non-empty when present');
        if (ref.notes !== undefined && !Array.isArray(ref.notes)) errs.push('reference swatch: notes must be an array when present');
      }
```

At line 87, append `'swatch'` to the archetype array.

- [ ] **Step 5: Run UAT, verify ALL PASS** (`node tests/uat.js | tail -3` — total must be ≥ baseline + 5)

- [ ] **Step 6: Commit** — `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): swatch reference kind validation + archetype tag (Wave 4 Task 1)"`

---

### Task 2: `_slRenderRefSwatch` renderer + dispatch

**Files:**
- Modify: `features/sim-lab.js` — new renderer directly before `_slRenderReference` (line ~1924), one dispatch line inside it (after the `slots` line at 1939), export on `window._simLab` beside the other test hooks (~line 3490)
- Test: `tests/uat.js` (renderer DOM-shape checks in the Wave-3-style vm block — see Task 8 for the full slice; this task adds only shape checks)

**Interfaces:**
- Consumes: `_SWATCH_DEFECTS` (Task 1), `_el`/`_esc` (existing helpers), the `swatch` contract above.
- Produces: `function _slRenderRefSwatch(ref)` returning a detached DOM node; dispatched from `_slRenderReference` on `ref.kind === 'swatch'`. Emits (Task 3's CSS targets EXACTLY this — write CSS against this DOM, nothing else):
  - `.swatch-wrap` > `.swatch-sheet.swatch-<defect>` (role=img, aria-label from `_SWATCH_ARIA`) > `.swatch-hdr`, 14× `.swatch-line` (odd ones also `.dim`), defect overlay nodes, and for `spots` a `.swatch-gauge` (aria-hidden) with 2 `.swatch-tick`, 1 `.swatch-rail`, 1 `.swatch-gauge-label`
  - `.swatch-wrap` > optional `.swatch-cap` (escaped caption) and `.swatch-notes` > `.swatch-note` chips (escaped), mirroring `slot-notes`/`slot-note`
  - Defect overlays: spots → 3× `.swatch-spot`; streak → 1× `.swatch-streak`; smear → 1× `.swatch-smear`; ghost → `.swatch-ghost-src` + `.swatch-ghost-echo`; skew → no extra nodes (the `.swatch-skew` class on the sheet transforms `.swatch-line`s via CSS)

- [ ] **Step 1: Read the real dispatch + a model renderer first** (`_slRenderReference` at 1924, `_slRenderRefSlots` at 1908) — mirror their `_el`/`_esc` idiom exactly.

- [ ] **Step 2: Write failing UAT shape checks** (inside the existing Wave 3 vm block near `tests/uat.js:26050`, after the slots checks; reuse that block's `grab`, sandbox, and DOM shim):

```js
var refSwatchBody = grab('_slRenderRefSwatch');
test('Wave 4: _slRenderRefSwatch extracted', !!refSwatchBody);
// mount each defect and assert shape
['spots', 'streak', 'smear', 'ghost', 'skew'].forEach(function (d) {
  var node = sandboxRender({ kind: 'swatch', title: 'Sample output', defect: d, caption: 'cap', notes: ['n1'] });
  test('Wave 4: swatch ' + d + ' renders sheet', node && node.querySelector('.swatch-sheet.swatch-' + d) !== null);
  test('Wave 4: swatch ' + d + ' has aria-label', !!node.querySelector('.swatch-sheet').getAttribute('aria-label'));
  test('Wave 4: swatch ' + d + ' zero interactive elements', node.querySelectorAll('button, select, [onclick]').length === 0);
});
test('Wave 4: spots swatch has 3 spots + gauge', (function () { var n = sandboxRender({ kind: 'swatch', title: 't', defect: 'spots' }); return n.querySelectorAll('.swatch-spot').length === 3 && n.querySelectorAll('.swatch-gauge').length === 1; })());
test('Wave 4: swatch caption is escaped', (function () { var n = sandboxRender({ kind: 'swatch', title: 't', defect: 'smear', caption: '<img src=x onerror=1>' }); return n.querySelector('.swatch-cap').innerHTML.indexOf('<img') === -1; })());
```
(`sandboxRender` = a tiny local helper calling the extracted `_slRenderRefSwatch` in the block's vm sandbox — build it the same way the block builds its other render helpers. If the block's DOM shim lacks `querySelectorAll` filtering used here, extend the LOCAL helper, not the shim.)

- [ ] **Step 3: Run UAT, verify the new checks FAIL** (extraction returns '')

- [ ] **Step 4: Implement the renderer** (before `_slRenderReference`):

```js
  var _SWATCH_ARIA = {
    spots:  'Printed page with dark toner spots recurring at a fixed vertical interval of roughly 76 millimetres, all at the same horizontal position. The printed text itself is crisp and fully fused.',
    streak: 'Printed page with a clean vertical white band running the full page height where toner is missing. The remaining print is otherwise normal.',
    smear:  'Printed page where the toner smudges and streaks downward, as if wiped before it bonded to the paper.',
    ghost:  'Printed page where a faint copy of an image from higher up the page reappears further down.',
    skew:   'Printed page whose entire content is rotated several degrees off square, as if the paper fed crooked.'
  };

  function _slRenderRefSwatch(ref) {
    var root = _el('div', 'swatch-wrap');
    var defect = ref.defect;
    var sheet = _el('div', 'swatch-sheet swatch-' + defect);
    sheet.setAttribute('role', 'img');
    sheet.setAttribute('aria-label', _SWATCH_ARIA[defect] || '');
    sheet.appendChild(_el('div', 'swatch-hdr'));
    for (var i = 0; i < 14; i++) sheet.appendChild(_el('div', 'swatch-line' + (i % 2 ? ' dim' : '')));
    if (defect === 'spots') {
      for (var s = 0; s < 3; s++) sheet.appendChild(_el('div', 'swatch-spot swatch-spot-' + (s + 1)));
      var gauge = _el('div', 'swatch-gauge');
      gauge.setAttribute('aria-hidden', 'true');
      gauge.appendChild(_el('div', 'swatch-tick swatch-tick-1'));
      gauge.appendChild(_el('div', 'swatch-tick swatch-tick-2'));
      gauge.appendChild(_el('div', 'swatch-rail'));
      gauge.appendChild(_el('div', 'swatch-gauge-label', '~76 mm'));
      sheet.appendChild(gauge);
    } else if (defect === 'streak') {
      sheet.appendChild(_el('div', 'swatch-streak'));
    } else if (defect === 'smear') {
      sheet.appendChild(_el('div', 'swatch-smear'));
    } else if (defect === 'ghost') {
      sheet.appendChild(_el('div', 'swatch-ghost-src'));
      sheet.appendChild(_el('div', 'swatch-ghost-echo'));
    } // skew: no extra nodes — .swatch-skew on the sheet drives a CSS transform on the lines
    root.appendChild(sheet);
    if (_isNonEmptyStr(ref.caption)) root.appendChild(_el('div', 'swatch-cap', _esc(ref.caption)));
    if (Array.isArray(ref.notes) && ref.notes.length) {
      var notes = _el('div', 'swatch-notes');
      ref.notes.forEach(function (n) { notes.appendChild(_el('span', 'swatch-note', _esc(n))); });
      root.appendChild(notes);
    }
    return root;
  }
```
Check how `_el(tag, cls, text)` treats its third argument in THIS file before relying on `_esc` + `_el` together — if `_el` already text-node-safes its third arg, drop the `_esc` (double-escaping shows literal entities); if it innerHTMLs, keep it. Mirror what `_slRenderRefSlots` line 1913 does — it is the precedent.

- [ ] **Step 5: Add the dispatch line** in `_slRenderReference` after the `slots` line (1939):

```js
    else if (ref.kind === 'swatch') panel.appendChild(_slRenderRefSwatch(ref));
```
Also read lines 1960-1980 (the post-dispatch `kind === 'terminal'/'faceplate'/'wiremap'` extras) — swatch needs NO analyze-mode wiring there; confirm nothing else keys off kind.

- [ ] **Step 6: Export the test hook** beside the others (~3490): `window._simLab.renderRefSwatch = _slRenderRefSwatch;`

- [ ] **Step 7: Run UAT, verify ALL PASS** — then commit: `git add -A && git commit -m "feat(sim-lab): _slRenderRefSwatch static renderer + dispatch (Wave 4 Task 2)"`

---

### Task 3: `dg-system.css` swatch tokens + styles

**Files:**
- Modify: `dg-system.css` — three per-theme token additions in BOTH existing theme token blocks (top of file, ~lines 22-83), plus a `.swatch*` component block appended after the `.slots*` block (~line 4548); hand-bump the `dg-system.css?v=` query in `index.html`
- Test: `tests/uat.js` ratchet guard runs automatically (no new undefined `var()`)

**Interfaces:**
- Consumes: the EXACT DOM Task 2 emits (nothing else — Wave 3's dead-selector lesson).
- Produces: tokens `--sw-paper`, `--sw-paper-edge`, `--sw-toner` defined in both theme blocks.

- [ ] **Step 1: Read Task 2's committed renderer** (`grep -a -n "_slRenderRefSwatch" features/sim-lab.js` then read the function) and the `.slots*` block at `dg-system.css:4544` for the house component-CSS idiom.

- [ ] **Step 2: Add tokens.** In the DARK theme token block: `--sw-paper: oklch(0.965 0.005 85); --sw-paper-edge: oklch(0.85 0.008 85); --sw-toner: oklch(0.28 0.012 280);` In the LIGHT block: `--sw-paper: oklch(0.99 0.003 85); --sw-paper-edge: oklch(0.88 0.007 85); --sw-toner: oklch(0.30 0.012 280);` (values lifted from the approved mockup — paper stays paper in both themes).

- [ ] **Step 3: Append the component block** (adapted from the mockup's `.sheet*` CSS, selectors renamed to Task 2's emitted classes, positional inline styles converted to nth-of-type rules):

```css
/* ── Sim Lab swatch reference (Wave 4) — targets _slRenderRefSwatch's DOM exactly ── */
.swatch-wrap { display: flex; flex-direction: column; align-items: center; padding: 14px 16px 6px; }
.swatch-sheet { position: relative; width: 100%; max-width: 320px; margin-right: 46px; aspect-ratio: 210 / 280; background: var(--sw-paper); border: 1px solid var(--sw-paper-edge); border-radius: 4px; box-shadow: 0 1px 2px color-mix(in oklab, var(--text) 10%, transparent), 0 10px 26px -14px color-mix(in oklab, var(--text) 28%, transparent); }
.swatch-hdr { position: absolute; left: 11%; top: 7%; width: 42%; height: 4%; border-radius: 2px; background: color-mix(in oklab, var(--sw-toner) 88%, var(--sw-paper)); }
.swatch-line { position: absolute; left: 11%; height: 2.6%; border-radius: 2px; background: color-mix(in oklab, var(--sw-toner) 78%, var(--sw-paper)); }
.swatch-line.dim { background: color-mix(in oklab, var(--sw-toner) 62%, var(--sw-paper)); }
/* 14 lines, 4.5% vertical rhythm from 15%, ragged widths */
.swatch-line:nth-of-type(2)  { top: 15%;   width: 78%; } .swatch-line:nth-of-type(3)  { top: 19.5%; width: 72%; }
.swatch-line:nth-of-type(4)  { top: 24%;   width: 76%; } .swatch-line:nth-of-type(5)  { top: 28.5%; width: 64%; }
.swatch-line:nth-of-type(6)  { top: 33%;   width: 77%; } .swatch-line:nth-of-type(7)  { top: 37.5%; width: 70%; }
.swatch-line:nth-of-type(8)  { top: 42%;   width: 74%; } .swatch-line:nth-of-type(9)  { top: 46.5%; width: 67%; }
.swatch-line:nth-of-type(10) { top: 51%;   width: 78%; } .swatch-line:nth-of-type(11) { top: 55.5%; width: 60%; }
.swatch-line:nth-of-type(12) { top: 60%;   width: 75%; } .swatch-line:nth-of-type(13) { top: 64.5%; width: 71%; }
.swatch-line:nth-of-type(14) { top: 69%;   width: 77%; } .swatch-line:nth-of-type(15) { top: 73.5%; width: 56%; }
/* spots */
.swatch-spot { position: absolute; left: 62%; width: 4.6%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 42% 40%, var(--sw-toner) 58%, color-mix(in oklab, var(--sw-toner) 55%, var(--sw-paper)) 78%, transparent 88%); }
.swatch-spot-1 { top: 12%; } .swatch-spot-2 { top: 39%; transform: scale(0.92) rotate(14deg); } .swatch-spot-3 { top: 66%; transform: scale(1.05) rotate(-9deg); }
.swatch-gauge { position: absolute; right: -13.5%; top: 0; bottom: 0; width: 12%; }
.swatch-tick { position: absolute; right: 0; width: 100%; border-top: 1.5px solid color-mix(in oklab, var(--accent) 65%, var(--border)); }
.swatch-tick-1 { top: 14.2%; } .swatch-tick-2 { top: 41.2%; }
.swatch-rail { position: absolute; right: 46%; width: 1.5px; top: 14.2%; height: 27%; background: color-mix(in oklab, var(--accent) 65%, var(--border)); }
.swatch-gauge-label { position: absolute; right: -8px; top: 27.5%; transform: translateY(-50%) rotate(90deg); font: 800 9.5px Inter, -apple-system, sans-serif; letter-spacing: 0.07em; color: var(--accent); white-space: nowrap; }
/* streak: clean vertical band missing toner */
.swatch-streak { position: absolute; top: 0; bottom: 0; left: 45%; width: 10%; background: var(--sw-paper); }
/* smear: downward toner wash over the lower half */
.swatch-smear { position: absolute; left: 0; right: 0; top: 45%; bottom: 0; background: linear-gradient(180deg, color-mix(in oklab, var(--sw-toner) 30%, transparent), transparent 85%); }
/* ghost: a bold source mark + its faint echo lower down */
.swatch-ghost-src { position: absolute; left: 24%; top: 18%; width: 16%; aspect-ratio: 1; border-radius: 50%; background: color-mix(in oklab, var(--sw-toner) 85%, var(--sw-paper)); }
.swatch-ghost-echo { position: absolute; left: 24%; top: 58%; width: 16%; aspect-ratio: 1; border-radius: 50%; background: color-mix(in oklab, var(--sw-toner) 22%, var(--sw-paper)); }
/* skew: rotate the printed content, not the sheet */
.swatch-skew .swatch-hdr, .swatch-skew .swatch-line { transform: rotate(-7deg); transform-origin: 8% 0; }
/* caption + note chips (mirrors slot-notes) */
.swatch-cap { margin-top: 10px; max-width: 320px; font-size: 11.5px; color: var(--text-dim); font-weight: 600; text-align: center; }
.swatch-notes { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 10px; }
.swatch-note { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--text-mid); background: color-mix(in oklab, var(--text) 5%, transparent); border: 1px solid var(--border); border-radius: 999px; padding: 4px 9px; }
```
NOTE the nth-of-type offset: the sheet's FIRST child is `.swatch-hdr`, so the first `.swatch-line` is `:nth-of-type(2)`… **verify against the actual committed renderer** — `nth-of-type` counts by element TYPE (all these are `div`s), so hdr occupies slot 1. If Task 2 changed child order, recompute. This is exactly the class of bug Wave 3 shipped; check in a browser, not by eyeballing.

- [ ] **Step 4: Hand-bump `dg-system.css?v=`** in `index.html` (one query-string bump, e.g. `?v=7.65.1-w4a`).

- [ ] **Step 5: Verify live-local.** `python3 -m http.server 3131`, open the mockup AND a scratch HTML that calls `window._simLab.renderRefSwatch({kind:'swatch',title:'t',defect:'spots',caption:'c'})` after loading the app — screenshot all 5 defects in BOTH themes. Every defect must be visually distinct and recognizable; skew must visibly rotate; gauge label must not clip (46px right margin reserves it).

- [ ] **Step 6: Run UAT (ratchet guard) — ALL PASS.** Commit: `git add dg-system.css index.html && git commit -m "style(sim-lab): swatch reference tokens + component CSS (Wave 4 Task 3)"`

---

### Task 4: `simLabValidateSwatchFidelity`

**Files:**
- Modify: `features/sim-lab.js` — new function directly after `simLabValidateRaidFidelity` (ends ~line 803); export beside the others (~3487): `window.simLabValidateSwatchFidelity = simLabValidateSwatchFidelity;`
- Test: `tests/uat.js` (new checks in the fidelity-validator block — find it with `grep -an "raid fidelity" tests/uat.js`)

**Interfaces:**
- Consumes: `_slFidelityResolveSlot(step, slotId)` (line 122 — resolves a configure step's keyed answer to its option TEXT), `_SWATCH_DEFECTS`, the step-id convention and `scn.swatch` fact block from Reference contracts.
- Produces: `simLabValidateSwatchFidelity(scn) -> { ok, errors }` — Tasks 5-7's authoring harness calls this on every scenario.

- [ ] **Step 1: Hand-derive the expected verdicts on paper BEFORE coding.** Write the 8 fixture rows and their expected ok/fail by hand (this is the Wave 3 discipline; both of its validator bugs would have been caught here):
  1. spots + keyed "Imaging drum · …" + damageKind permanent + remedy "Replace the drum unit · …" → ok
  2. spots + keyed "Fuser assembly · …" → FAIL (fuser ∉ {drum, roller})
  3. spots + keyed "Pickup roller · …" → ok (roller ∈ set — set-based, spec §4)
  4. streak + keyed "Blocked toner path · …" → ok; streak + keyed "Toner cartridge empty · …" → FAIL ('toner path'/'blocked toner' match, bare 'toner cartridge' must NOT — check the substring set carefully)
  5. permanent damage + remedy "Clean the drum surface…" → FAIL (coherence)
  6. debris damage + remedy "Replace the drum unit…" → FAIL (coherence)
  7. damageKind 'none' + no fix step → ok (diagnosis-only)
  8. missing diagnose step → FAIL

- [ ] **Step 2: Write the failing UAT checks** — encode ALL 8 rows above as fixtures + expected results, PLUS the two mutation checks:

```js
// mutation checks: prove the validator is load-bearing, not decorative
var mutA = JSON.parse(JSON.stringify(fixOkSpots)); mutA.assets.reference.defect = 'smear';
test('Wave 4 fidelity mutation: flipping defect spots→smear flips verdict', !swatchFidelity(mutA).ok);
var mutB = JSON.parse(JSON.stringify(fixOkSpots)); mutB.swatch.damageKind = 'debris';
test('Wave 4 fidelity mutation: flipping damageKind permanent→debris flips verdict', !swatchFidelity(mutB).ok);
```

- [ ] **Step 3: Run UAT, verify new checks FAIL** (function not extracted).

- [ ] **Step 4: Implement:**

```js
  // --- swatch (laser print defect) fidelity validator (Wave 4) ---
  // Truth table maps each rendered defect to the SET of acceptable failed
  // components (spec 2026-07-11 §4, pinned set-based). Matching is
  // case-insensitive substring against the RESOLVED keyed option text.
  var _SWATCH_CAUSES = {
    spots:  ['drum', 'roller'],
    streak: ['toner path', 'blocked toner', 'scratched drum'],
    smear:  ['fuser'],
    ghost:  ['cleaning blade', 'erase lamp', 'drum clean'],
    skew:   ['pickup roller', 'paper path', 'separation pad']
  };

  function simLabValidateSwatchFidelity(scn) {
    var errs = [];
    var ref = scn && scn.assets && scn.assets.reference;
    if (!ref || ref.kind !== 'swatch') return { ok: false, errors: ['swatch fidelity: assets.reference.kind must be "swatch"'] };
    var accepts = _SWATCH_CAUSES[ref.defect];
    if (!accepts) return { ok: false, errors: ['swatch fidelity: unknown defect "' + ref.defect + '"'] };
    var dx = (scn.steps || []).filter(function (st) { return st.id === 'diagnose'; })[0];
    if (!dx) return { ok: false, errors: ['swatch fidelity: no configure step with id "diagnose"'] };
    var comp = _slFidelityResolveSlot(dx, 'failedComponent');
    if (!comp) {
      errs.push('swatch fidelity: diagnose step has no keyed failedComponent slot');
    } else {
      var compLc = String(comp).toLowerCase();
      var hit = accepts.some(function (a) { return compLc.indexOf(a) !== -1; });
      if (!hit) errs.push('swatch fidelity: keyed component "' + comp + '" not in the ' + ref.defect + ' cause set {' + accepts.join(', ') + '}');
    }
    var fact = scn.swatch || {};
    var fix = (scn.steps || []).filter(function (st) { return st.id === 'fix'; })[0];
    if (fact.damageKind === 'permanent' || fact.damageKind === 'debris') {
      if (!fix) { errs.push('swatch fidelity: damageKind "' + fact.damageKind + '" declared but no fix step'); }
      else {
        var remedy = _slFidelityResolveSlot(fix, 'remedy') || '';
        if (fact.damageKind === 'permanent' && !/replace/i.test(remedy)) errs.push('swatch fidelity: permanent damage must key a replace-class remedy, got "' + remedy + '"');
        if (fact.damageKind === 'debris' && !/clean/i.test(remedy)) errs.push('swatch fidelity: debris must key a clean-class remedy, got "' + remedy + '"');
      }
    }
    return { ok: errs.length === 0, errors: errs };
  }
```
`Array.prototype.some` with a captured local is fine ES5 — matches file idiom. Beware the streak trap from Step 1 row 4: the set contains 'toner path' and 'blocked toner', NOT bare 'toner' — re-run the hand-derived rows against the real code output, not your memory of it.

- [ ] **Step 5: Add the export**, run UAT — ALL PASS (baseline + Task 1/2 counts + these).

- [ ] **Step 6: Commit** — `git commit -am "feat(sim-lab): simLabValidateSwatchFidelity set-based truth table (Wave 4 Task 4)"`

---

### Task 5: Objective verification + authoring harness + gated batch A (spots ×2, streak ×2)

**Files:**
- Create: `scripts/dev/wave4-fidelity-check.js` (throwaway authoring harness, committed for the wave, mirrors how Wave 3 batches were checked)
- Modify: `features/sim-lab-seed-aplus-core1.js` (append before the closing `];` at line 7719)
- Test: `tests/uat.js` bank-shape checks (Task 8 adds the full slice; this task extends the existing bank-validation loop which already validates every scenario via `simLabValidateScenario` — verify with `grep -an "SIM_LAB_SEED_APLUS_CORE1" tests/uat.js`)

**Interfaces:**
- Consumes: `simLabValidateScenario`, `simLabValidateSwatchFidelity`, the step-id convention.
- Produces: scenarios `a1-swatch-01`…`a1-swatch-04` live in the bank, each carrying `archetype: 'swatch'`, a `swatch` fact block, and gate sign-off recorded in the commit message.

- [ ] **Step 1: Verify objectives BEFORE authoring (spec §5 mandate).** Confirm against the official CompTIA 220-1201 objectives (web or the objectives PDF the founder keeps): the printer-troubleshooting objective number and its listed symptoms (the spec BELIEVES 3.6/3.7 with 3.7 ≈ print-quality; if numbering differs, use the REAL numbers everywhere below). Also count current coverage: `node -e "const b=require('fs').readFileSync('features/sim-lab-seed-aplus-core1.js','utf8'); console.log('3.6:', (b.match(/objective: '3\.6'/g)||[]).length, '3.7:', (b.match(/objective: '3\.7'/g)||[]).length)"` — record both numbers in the commit message.

- [ ] **Step 2: Write the harness** `scripts/dev/wave4-fidelity-check.js`:

```js
// Wave 4 authoring gate: structural + fidelity validation for every a1-swatch-* scenario.
const fs = require('fs');
const vm = require('vm');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('features/sim-lab.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('features/sim-lab-seed-aplus-core1.js', 'utf8'), sandbox);
const bank = sandbox.window.SIM_LAB_SEED_APLUS_CORE1.filter(s => s.archetype === 'swatch');
let fail = 0;
for (const scn of bank) {
  const v = sandbox.window.simLabValidateScenario(scn);
  const f = sandbox.window.simLabValidateSwatchFidelity(scn);
  const ok = v.ok && f.ok;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + scn.id + (ok ? '' : '  ' + [...v.errors, ...f.errors].join(' | ')));
  if (!ok) fail++;
}
console.log(bank.length + ' swatch scenarios, ' + fail + ' failing');
process.exit(fail ? 1 : 0);
```
If `features/sim-lab.js` expects browser globals the vm lacks (it's an IIFE against `window`), check how `tests/uat.js` sandboxes it and mirror THAT approach instead — do not fight the module shape.

- [ ] **Step 3: Draft 4 scenarios** (2× `spots`, 2× `streak`; one of each defect diagnosis-only `damageKind:'none'`, one full diagnose+fix). Every scenario follows this complete shape (this is `a1-swatch-01` in full — the model for all 12; ~76 mm figure varies per scenario within real roller circumferences 38-96 mm):

```js
  {
    id: 'a1-swatch-01',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '3.7',   // as verified in Step 1
    topic: 'Repeating marks — drum-circumference interval diagnosis',
    title: 'The front-desk LaserJet is stamping marks on every page',
    estMinutes: 5,
    scenario: 'Reception\'s shared printer started putting dark marks on everything this morning. A fresh ream of paper changed nothing. You pull the last page printed and put it under the light. Read the page, name what failed, and close the ticket the right way.',
    swatch: { damageKind: 'permanent' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · front-desk LaserJet',
        defect: 'spots',
        caption: 'Last page printed · marks land at the same spot across pages',
        notes: ['Model: mono laser, ~40k pages', 'Fresh paper: no change', 'Every page affected']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Name the defect pattern, then the component that produces it.',
        explanation: 'Distinct dark marks at a fixed interval and the same horizontal position are a repeating defect. ~76 mm is a common drum circumference: a nick or stuck debris on the drum stamps the page once per rotation.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' },
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' },
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' },
            { id: 'p-smear', text: 'Loose toner · print smears at a touch' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-fuser', text: 'Fuser assembly · toner is not bonding to the page' },
            { id: 'c-drum', text: 'Imaging drum · damage or debris on its surface prints every rotation' },
            { id: 'c-pickup', text: 'Pickup roller feeding pages crooked' },
            { id: 'c-toner', text: 'Toner cartridge empty or clogged · faded or missing print' } ] } ] },
        answer: { slots: { defectPattern: 'p-spots', failedComponent: 'c-drum' } } },
      { id: 'fix', type: 'configure', points: 1,
        prompt: 'You pull the drum unit and find a deep scratch across its surface. Close out the ticket.',
        explanation: 'Cleaning handles debris, but a scratch is permanent: the coating is gone, and it stamps every rotation until the drum unit is replaced. Verify with a test page before closing.',
        payload: { slots: [
          { id: 'remedy', label: 'Remedy', options: [
            { id: 'r-clean', text: 'Clean the drum surface and reinstall it' },
            { id: 'r-replace', text: 'Replace the drum unit · a scratched drum cannot be repaired' },
            { id: 'r-fuser', text: 'Install a fuser maintenance kit' } ] },
          { id: 'verify', label: 'Before closing the ticket', options: [
            { id: 'v-none', text: 'Nothing further · the new drum resolves it by definition' },
            { id: 'v-test', text: 'Print a test page and check the marks are gone' },
            { id: 'v-cal', text: 'Recalibrate the printer\'s colour tables' } ] } ] },
        answer: { slots: { remedy: 'r-replace', verify: 'v-test' } } }
    ]
  },
```
Check the configure-step payload/answer shape against `_validateStepPayload` line 34-43 (slots need id+label+options[≥2 with id+text]; answer.slots maps slotId → optionId) — the shape above complies; do not improvise a different one. Note `_slFidelityResolveSlot` resolves the keyed option's TEXT — so 'Imaging drum · …' contains 'drum' ✓.

- [ ] **Step 4: Run the harness** — `node scripts/dev/wave4-fidelity-check.js` → 4/4 PASS. Fix until green, hand-checking each failure against the Step-1 truth-table rows (not by loosening the validator).

- [ ] **Step 5: Two-agent gate.** Dispatch TWO independent subagents per scenario batch — (a) printer-hardware domain engineer, (b) CompTIA 220-1201 examiner — each given ONLY the 4 scenario objects and asked to approve/reject with reasons (technical accuracy incl. the mm-interval physics and clean-vs-replace logic; exam realism, objective fit, distractor quality). Revise until BOTH approve every scenario. Re-run the harness after ANY revision. Record both approvals in the commit message.

- [ ] **Step 6: Full UAT** (`node tests/uat.js | tail -3` — the bank-validation loop now covers the 4 new scenarios) — ALL PASS. Commit: `git add -A && git commit -m "content(sim-lab): swatch batch A — spots+streak ×4, 2-agent gated (Wave 4 Task 5)"` with gate notes + Step-1 coverage counts in the body.

---

### Task 6: Gated batch B (smear ×2, ghost ×2)

**Files:** Modify `features/sim-lab-seed-aplus-core1.js` (ids `a1-swatch-05`…`08`).

**Interfaces:** identical to Task 5.

- [ ] **Step 1: Draft 4 scenarios** — 2× `smear` (fuser: one heat-lamp failure `damageKind:'permanent'` keying a fuser-kit replace remedy, one diagnosis-only), 2× `ghost` (one dirty/failed cleaning blade `damageKind:'permanent'` → replace drum/maintenance unit, one erase-lamp diagnosis-only). Follow the Task 5 Step-3 shape EXACTLY (same step ids, same slot ids). Distractor discipline: every scenario's `failedComponent` options must include at least one component from a DIFFERENT defect's cause set (that's what makes the swatch load-bearing).
- [ ] **Step 2: Harness → 8/8 PASS.**
- [ ] **Step 3: Two-agent gate** (same lenses, revise-until-both-approve, re-run harness after revisions).
- [ ] **Step 4: Full UAT ALL PASS. Commit** — `content(sim-lab): swatch batch B — smear+ghost ×4, 2-agent gated (Wave 4 Task 6)`.

---

### Task 7: Gated batch C (skew ×2, multi-symptom ×2)

**Files:** Modify `features/sim-lab-seed-aplus-core1.js` (ids `a1-swatch-09`…`12`).

**Interfaces:** identical to Task 5, plus: multi-symptom scenarios declare their PRIMARY defect in `assets.reference.defect` (spec §4 — the validator checks the primary mapping only) and may add an `order` or `match` step for triage sequencing.

- [ ] **Step 1: Draft 4 scenarios** — 2× `skew` (pickup roller / separation pad; one `damageKind:'debris'` keying a clean-class remedy — the roller-wipe case — one diagnosis-only), 2× multi-symptom (e.g. spots + faded print: swatch shows `spots` as primary; an added `order` step sequences "measure interval → replace drum → test page → THEN assess toner" — order steps follow `_validateStepPayload` line 15-17: `payload.items[]` + `answer.correctOrder[]` same length).
- [ ] **Step 2: Harness → 12/12 PASS.**
- [ ] **Step 3: Two-agent gate** (same discipline).
- [ ] **Step 4: Full UAT ALL PASS. Commit** — `content(sim-lab): swatch batch C — skew+multi ×4, bank complete at 12 (Wave 4 Task 7)`.

---

### Task 8: UAT vertical slice through the Practice path

**Files:**
- Modify: `tests/uat.js` — new `── Sim Lab: Wave 4 swatch vertical slice ──` block modeled on the Wave 3 block at line 26050 (same `grab`/`grabLine` extraction, same vm sandbox + DOM shim construction).

**Interfaces:**
- Consumes: `_slRenderRefSwatch`, `_slRenderReference`, `_slMountScenario`, `simLabScoreScenario`, `_scoreConfigureSlots` (all extractable with the Wave 3 block's own `grab` calls — extend that block's extraction list or copy its scaffolding).

- [ ] **Step 1: Read the full Wave 3 block first** (26050 onward) — copy its scaffolding wholesale; do NOT reinvent the shim.
- [ ] **Step 2: Write the slice:** take the REAL `a1-swatch-01` from the bank (extract the bank in the sandbox the way the existing bank-validation block does), then assert:

```js
// 1. structural + fidelity green (belt and suspenders vs. the harness)
// 2. _slRenderReference dispatches kind 'swatch' to a node containing .swatch-sheet.swatch-spots
// 3. mount the scenario via _slMountScenario: reference panel renders, zero button/select inside .swatch-sheet
// 4. score a correct submission via simLabScoreScenario → full points
// 5. score a wrong failedComponent → partial credit (defectPattern point retained)
// 6. an XSS caption ('<img src=x onerror=1>') round-trips escaped through the real mount path
```
Every assertion via `test(name, cond)` with names prefixed `Wave 4 slice:`. No hardcoded totals anywhere.
- [ ] **Step 3: Run the new block in isolation first** (`node tests/uat.js 2>&1 | grep -a "Wave 4 slice"`), then the FULL suite: ALL PASS.
- [ ] **Step 4: Commit** — `test(sim-lab): Wave 4 swatch vertical slice through Practice path (Task 8)`.

---

### Task 9: Local live-verify + full check battery

**Files:** none modified (verification only; fix-forward commits if bugs surface).

- [ ] **Step 1: Full battery:**

```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
node tests/uat.js            # ALL PASS — record the new total
node tests/tech-debt.js      # thresholds green
npx playwright test          # only pre-existing known-flaky failures (sidebar/landing) — confirm none touch files this wave modified
```
- [ ] **Step 2: Live-local drive** (`python3 -m http.server 3131`, real browser, both themes, desktop + 375px): launch Sim Lab → Practice → A+ Core 1, force-pick each swatch scenario (`window._simLab.pickSeedFresh` or the seed-forcing route the existing dogfood path uses — remember the A+ bank lazy-loads: inject `features/sim-lab-seed-aplus-core1.js` before mounting). Verify per defect: swatch renders correctly, gauge label unclipped, zero click affordance on the sheet, steps score, result screen sane. **Use `getBoundingClientRect()`/screenshots, not `getComputedStyle`,** and append a fresh cache-busted `<link>` for `dg-system.css` before trusting styles (stale-stylesheet trap). NEVER touch localStorage on any prod host — localhost only.
- [ ] **Step 3: Screenshot evidence** for all 5 defects × both themes attached to the task report. Commit any fixes with `fix(sim-lab): …` messages.

---

### Task 10: Ship — version, PR, merge, post-deploy verification

**Files:** version surfaces via `scripts/bump-version.js` only.

- [ ] **Step 1:** `node scripts/bump-version.js 7.66.0 "Sim Lab Wave 4: Laser Print Defect Clinic PBQ (swatch reference kind)"` — script updates app.js/sw.js/index.html/package.json + CLAUDE.md stub (leave the stub a one-liner). Re-read CLAUDE.md after (the script rewrites it).
- [ ] **Step 2:** Full UAT once more (version-consistency checks now active) — ALL PASS. Commit the bump.
- [ ] **Step 3:** Push branch, open PR: `gh pr create --title "Sim Lab Wave 4: Laser Print Defect Clinic PBQ (v7.66.0)" --body "<summary + gate records + UAT delta>"`. CI (UAT + Playwright) must be green. **Merge convention: regular merge commit** — `gh pr merge --merge` (never squash). The harness may refuse to auto-merge to main; if so, hand the founder the exact merge command instead of bypassing.
- [ ] **Step 4: Post-deploy verification (MANDATORY, per CLAUDE.md):** cache-bust navigate the prod URL, confirm deployed `APP_VERSION` is `7.66.0` (check the deployed app.js loosely — it's minified; `curl` is hook-blocked, use `ctx_execute` with `fetch()`), then drive one full swatch scenario in a real browser on prod following the user's exact click path — read-only, NO localStorage writes on prod. Walk `/ship`'s checklist for anything this list missed. Only then claim shipped + verified.
- [ ] **Step 5:** Update the Handoff README + write the superseding resume memory (Wave 4 SHIPPED, program complete — 11 archetypes across 4 waves).

---

## Self-review record

- **Spec coverage:** §1 mechanic (existing step types only) → Tasks 5-7 author against configure/order; §2 taxonomy → `_SWATCH_DEFECTS` Task 1; §3 kind+renderer+validator branch → Tasks 1-3 (incl. caption rule); §4 fidelity validator, set-based + mutation-checked → Task 4; §5 bank size/ids/tag/objective verification → Tasks 5-7 (Step 1 of Task 5 is the mandated objective-verification task); §6 testing/live-verify → Tasks 8-9; §7 pipeline/ship → Task 10. No gaps found.
- **Type consistency:** `_SWATCH_DEFECTS` / `_SWATCH_ARIA` / `_SWATCH_CAUSES` / `_slRenderRefSwatch` / `simLabValidateSwatchFidelity` / step ids `diagnose`·`fix` / slot ids `failedComponent`·`remedy` used identically across Tasks 1-8. Renderer class names in Task 2's Produces block match Task 3's selectors 1:1.
- **Placeholder scan:** none — every code step carries the actual code; authoring Tasks 6-7 reference Task 5's complete model scenario by explicit shape-following instruction plus their own defect-specific content requirements.
