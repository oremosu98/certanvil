---
up: "[[Drills MOC]]"
type: plan
status: active
cert: netplus, aplus-core1
updated: 2026-07-09
tags: [plan, drill, pbq, faceplate, wiremap, slots]
---
# Sim Lab PBQ Wave 3 — Implementation Plan (Faceplate / Wiremap / Slots Family)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four new Sim Lab PBQ archetypes — Switch Port-Map Provisioning Grid (Net+), Cable-Test Wiremap Forensics (Net+), Two-Client PC Build Spec-Off (A+ Core 1), RAID Workbench Build & Degrade (A+ Core 1) — riding **three new reference kinds** (`faceplate`, `wiremap`, `slots`), **two new guarded `analyze` modes** (`facePorts`, `wiremapPins`, reusing Wave 2's `payload.mode` extension mechanism with zero new binding infrastructure), four deterministic fidelity validators, and four 10-12-scenario two-agent-gated seed banks.

**Architecture:** Everything reuses the live engine in `features/sim-lab.js` (configure/analyze step types, per-slot scoring, gating/exam paths — archetype-agnostic, proven across Waves 1-2). This wave ADDS: four archetype tag values (`portmap`/`wiremap`/`pcbuild`/`raid`); three reference kinds with three renderers (`_slRenderRefFaceplate`, `_slRenderRefWiremap`, `_slRenderRefSlots` — the last is deliberately static/illustrative, zero interaction); two new `_slRenderAnalyzeMode` mode branches (`facePorts`, `wiremapPins`) that bind to `faceplate`/`wiremap` selectable elements exactly like Wave 2's `excerptLines` mode binds to terminal lines — no new scoring path, both ride the existing exact-set/lenient machinery; four pure-logic fidelity validators; three lifted CSS token blocks (`.faceplate*`/`.wm*`/`.slots*`); and four gated seed banks. Spec: `docs/superpowers/specs/2026-07-09-pbq-wave3-design.md`. Mockups (faithful-lift build targets, incl. their footer ENGINE-MAPPING comments + grading JS): `mockups/switch-port-map-grid-concept.html`, `mockups/cable-test-wiremap-concept.html`, `mockups/pc-build-spec-off-concept.html`, `mockups/raid-workbench-concept.html`.

**Tech Stack:** Vanilla ES5-style JS (IIFE feature module, no build step), native `<button>`/`<select>` selection-first UI, `tests/uat.js` (vm sandbox + grab/grabVar extraction, DOM shim, NO jsdom), forged-bronze tokens in `dg-system.css`.

## Global Constraints

- Branch: create `feat/sim-lab-pbq-wave3` from up-to-date `main` before Task 1; all commits land there; PR at Task 16.
- Fast lane (JS + content + CSS tokens + index.html cache-bump; no schema/auth/money; `sw.js` only via `bump-version.js` at ship).
- ES5-style JS matching surrounding `features/sim-lab.js` code; no new deps.
- **Selection-first (HARD):** native `<button>`/`<select>` only — NO free-text input anywhere, NO real hardware/command execution. Must work Desktop + Safari/WebKit + iOS Capacitor.
- **Mockups ARE the build (faithful lift** — visual/interaction fidelity, not markup fidelity). **Where a mockup detail and the engine's conventions disagree, the engine wins.** If a task discovers it needs a FOURTH new reference kind, a second binding direction for `slots`, or a new step-type — that is out of Wave 3 scope by spec: STOP and escalate.
- **XSS (HARD):** every label/text field on all three new reference kinds is scenario data and MUST be treated as untrusted — render via `_esc()` before any markup wrapping, exactly like every prior reference kind. The engine NEVER `innerHTML`s raw scenario text.
- **`analyze` `multi` is EXPLICIT (Wave-1 lesson, carried forward):** every analyze step MUST declare `multi` explicitly. The wiremap's `facePorts`/`wiremapPins` steps must set it too.
- CSS: `dg-system.css` only (never `styles.css`); tokens only, **zero hardcoded hex**; every bare `var(--x)` referenced MUST be DEFINED (the ratchet guard fails any NEW undefined bare `var()` — do NOT add new tokens to `KNOWN_GAPS`; DEFINE them).
- Seed banks: 10-12 scenarios per archetype; Net+ (`portmap`, `wiremap`) in `features/sim-lab-seed-netplus.js` (cert `netplus`); A+ (`pcbuild`, `raid`) in `features/sim-lab-seed-aplus-core1.js` (cert `aplus-core1`). Milestones/banks stay per-cert.
- **Dev-fixture rule (HARD):** no scenario enters a seed bank until it passes its deterministic fidelity validator AND the two-agent consensus gate. **Gate lenses: N10-009 domain engineer + CompTIA N10-009 examiner for the two Net+ archetypes (`portmap`, `wiremap`); 220-1201 examiner for `pcbuild`/`raid`.**
- Do NOT run `bump-version.js` before Task 16. Hand-bump ONLY the `dg-system.css?v=` query when Task 9 touches CSS.
- UAT: use `test(name, cond)` (global) OR a block-local `assert` wrapper — mirror the surrounding block; never hardcode a global total-count literal. Feature files are concatenated DEDENTED (2 leading spaces stripped) into the `js` string, so extraction regexes see column-0 closings — when extracting a `var X = {...}` table whose closing brace is indented, use a flexible-whitespace regex (`\n\s*\};`), never an exact-space one (Wave 2 Task 6 hit this bug twice; do not repeat it).
- Binary-misdetect: `features/sim-lab.js` is grep-misdetected as binary — always `grep -a` (or a Python/Node script) against it.
- Implementers work THEMSELVES (no sub-agents for code); integrators use byte-identity checks; reviewers do NOT `git stash`.

---

## Reference contracts (used across tasks — keep names identical)

### Archetype tags (Task 1)
`simLabValidateScenario` accepts optional `scenario.archetype` in
`['diagram','incident','defense','wireless','firewall','soho','cli','discovery','triage','portmap','wiremap','pcbuild','raid']`.

### The `faceplate` reference kind + renderer (Task 2)
```js
assets.reference = {
  kind: 'faceplate',
  host: 'SW-CORE1 · 24-port',
  ports: [
    { id: 'gi0-1', label: 'Gi0/1', led: 'up' | 'down' | 'err-disabled' | 'poe-fault', select: true | false }
    // one entry per physical port, 12-24 typical
  ]
}
```
`select:true` ports render as real `<button>`s (never `<div>`) with `data-port` + an `aria-label` describing state; `select:false` ports render as inert `aria-hidden` divs (faceplate realism only, never a scoring target). LED state alone must fully signal any fault — no hidden data.

### The `wiremap` reference kind + renderer (Task 3)
```js
assets.reference = {
  kind: 'wiremap',
  pins: [
    // pin = End-A pin # (1-8); pairId = real TIA/EIA pair (1-4); endBPin = which
    // End-B pin it actually lands on (null/undefined = open); select:true on all 8
    { pin: 1, pairId: 2, endBPin: 1, select: true }
  ]
}
```
Real TIA/EIA-568B pairs: Pair 1 = pins 4,5; Pair 2 = pins 1,2; Pair 3 = pins 3,6; Pair 4 = pins 7,8. All 8 End-A pins render as `<button>`s (`data-pin`); End-B renders read-only rows showing each pin's actual landing position. No progressive reveal — the whole map is visible at once, by spec.

### The `slots` reference kind + renderer (Task 4) — DELIBERATELY STATIC, zero interaction
```js
assets.reference = {
  kind: 'slots',
  bays: [ { id: 'cpu', label: 'CPU socket' }, { id: 'gpu', label: 'GPU bay · max 280mm' } ],
  notes: [ 'Case: Micro-ATX', 'Budget: $700' ]   // constraint chips, purely illustrative
}
```
Zero `<button>`, zero click handler, zero exposed interaction handle. Shared verbatim by `pcbuild` (component bays, rendered twice per scenario, once per client) and `raid` (drive bays). **Hard scope guard: if a future task wants `slots` to reflect live `configure` selections, that is a second new binding direction and out of Wave 3 scope — STOP and escalate.**

### The two new guarded analyze modes (Tasks 2, 3) — both ride the EXISTING mode-branch mechanism, zero new scoring path
```js
// mode:'facePorts' — bound to a kind:'faceplate' reference's select:true ports.
step = { id, type:'analyze', points:1, prompt, explanation,
  payload: { multi: false, mode: 'facePorts' },   // multi EXPLICIT always
  answer: { selected: ['gi0-8'] } }                // the faulted port's id

// mode:'wiremapPins' — bound to a kind:'wiremap' reference's select:true pins.
step = { id, type:'analyze', points:1, prompt, explanation,
  payload: { multi: true, mode: 'wiremapPins' },   // default (exact-set) scoring, no lenient flag
  answer: { selected: ['2', '3'] } }                // the fault pin(s), as strings matching data-pin
```
Both reuse `_slRenderAnalyzeMode`'s existing `toggle`/`emit` closure and `_scoreStep`'s existing exact-set/lenient dispatch — the ONLY new code is two more `if` branches inside the existing mode-dispatch functions, binding to `window.__slFaceplatePanel`/`window.__slWiremapPanel` the same way `excerptLines` binds to `window.__slTerminalPanel`.

### Validator signatures (locked — mirror `simLabValidateCliFaultFidelity(scn)`)
```js
simLabValidatePortMapFidelity(scn)   // -> { ok, errors }
simLabValidateWiremapFidelity(scn)   // -> { ok, errors }
simLabValidatePcBuildFidelity(scn)   // -> { ok, errors }
simLabValidateRaidFidelity(scn)      // -> { ok, errors }
```
All four live in `features/sim-lab.js` next to the Wave-1/2 validators and reuse `_isNonEmptyStr`, `_slFidelityResolveSlot`.

### Scenario machine-fact contracts (Tasks 5-8, 10-13)
```js
// PORTMAP (archetype:'portmap') — per-port ticket requirements live in a FLAT top-level
// array (scn.portmapTickets), sibling to scn.portmap (which carries only the fault key) —
// mirrors the two-field split already used by scn.disco / scn.disco.ports elsewhere:
scn.portmapTickets = [ { port:'gi0-1', vlan:'10', poe:false }, { port:'gi0-8', vlan:'40', poe:true } ];
scn.portmap = { faultPort: 'gi0-8' };
// The diagnose analyze step's answer.selected = [faultPort]. A companion configure step
// carries slots 'rootCause' + 'fix' (keyed), same two-step diagnose shape as Wave 2's CLI archetype.

// WIREMAP (archetype:'wiremap'):
scn.wiremap = { fault: 'splitPair' }   // key into _WIREMAP_FAULT_SIG: open | short | splitPair | reversedPair
// assets.reference.pins carries the raw pin data; the flag-fault analyze step's answer.selected
// is the keyed fault pin id set (as strings). A configure step carries slots 'faultType' + 'fix'.

// PCBUILD (archetype:'pcbuild') — TWO independent client fact blocks:
scn.pcbuild = {
  clientA: { budgetUsd: 1500, caseMaxGpuLengthMm: 300, minCpuTier: 2, minGpuTier: 2 },
  clientB: { budgetUsd: 400, caseMaxGpuLengthMm: 170, minCpuTier: 0, minGpuTier: 0 }
}
// Two configure steps, ids 'clientA'/'clientB', slots cpu/gpu/ram/psu/storage/cooling, each
// keyed independently. A shared PARTS_CATALOG (see Task 7) supplies price/watts/lengthMm/tier
// per option id, looked up by the validator — NOT duplicated as scenario data.

// RAID (archetype:'raid'):
scn.raid = { targetUsableTb: 4, targetTolerance: 1, failedDriveCount: 1 }
// Step 1 (build) configure slots: level/driveCount/driveSize, keyed to the minimal-cost
// combination clearing both targets. Step 2 (degrade) configure slots: arrayStatus/recoveryAction,
// keyed against failedDriveCount vs. the built level's real tolerance.
```

### Bank id prefixes
`np-pm-NN` (netplus · portmap) · `np-cbl-NN` (netplus · wiremap) · `a1-pcb-NN` (aplus-core1 · pcbuild) · `a1-raid-NN` (aplus-core1 · raid).

---

### Task 0: Branch setup + baseline

**Files:** none (git only)

- [ ] **Step 1:** `cd "$HOME/Desktop/Dev Projects/certanvil" && git checkout main && git pull origin main && git checkout -b feat/sim-lab-pbq-wave3`
- [ ] **Step 2:** `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" && node tests/uat.js` — Expected: `UAT: 4587/4587 ALL PASS ✓` (measured baseline at `main` @ `4be5051`; every task below states its `+N` delta against this running total).

### Task 1: Accept the four new archetype tags

**Files:**
- Modify: `features/sim-lab.js` (the archetype check inside `simLabValidateScenario`, line 80)
- Test: `tests/uat.js` (Sim Lab validation block — locate by `grep -a "archetype cli accepted"` or similar Wave-2 precedent, insert nearby)

- [ ] **Step 1: Write failing tests** — next to the existing archetype tests (reuse the block's `_baseScn` helper):
```js
['portmap', 'wiremap', 'pcbuild', 'raid'].forEach(function (tag) {
  var _s3 = _baseScn(); _s3.archetype = tag;
  assert(simLabValidateScenario(_s3).ok === true, 'archetype ' + tag + ' accepted');
});
var _sx3 = _baseScn(); _sx3.archetype = 'diskclinic';
assert(simLabValidateScenario(_sx3).ok === false, 'unknown archetype diskclinic still rejected');
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL on `archetype portmap accepted`.
- [ ] **Step 3: Implement** — extend the archetype list on line 80:
```js
if (s.archetype !== undefined && ['diagram', 'incident', 'defense', 'wireless', 'firewall', 'soho', 'cli', 'discovery', 'triage', 'portmap', 'wiremap', 'pcbuild', 'raid'].indexOf(s.archetype) === -1) {
  errs.push('bad archetype');
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+5).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): accept portmap/wiremap/pcbuild/raid archetype tags"`

### Task 2: The `faceplate` reference renderer + `mode:'facePorts'` analyze extension

**Files:**
- Modify: `features/sim-lab.js` — add `_slRenderRefFaceplate` after `_slRenderRefTerminal` (~L1527, before `_slRenderReference`); add the `'faceplate'` case to `_slRenderReference` (~L1529-1543); add `'faceplate'` to the reference-kind allowlist + shape check in `simLabValidateScenario` (~L68-78); add `mode:'facePorts'` handling to `_slRenderAnalyze`'s mode check (~L822-825) and a new branch inside `_slRenderAnalyzeMode` (~L892-921); extend `_validateStepPayload`'s analyze case (~L25) to accept `'facePorts'`; wire `window.__slFaceplateRef`/`window.__slFaceplatePanel` publishing into `_slMountScenario` (~L1566-1569, as a sibling flat if/else block — do NOT nest inside the existing terminal-ref if/else, that nesting bug was already fixed once in Wave 2 and must not be reintroduced).
- Test: `tests/uat.js` (new block after the terminal renderer tests)

**Interfaces:**
- Consumes: `_el(tag, cls, html)`, `_esc(s)`.
- Produces: `_slRenderRefFaceplate(ref) -> DOM node` (class `faceplate`); `_slRenderReference` dispatches `ref.kind === 'faceplate'`; `simLabValidateScenario` accepts `kind:'faceplate'` requiring `ports[]` each with `id` + `label`; `_slRenderAnalyzeMode` gains a `mode === 'facePorts'` branch binding to `.port` buttons via `window.__slFaceplatePanel`.

- [ ] **Step 1: Write the failing tests.** Reuse the extended DOM shim from Wave 2 Task 2 (the one with `classList`/`removeAttribute`/`querySelectorAll`/`_fire` — copy its `makeEl` helper verbatim, do not re-derive it):
```js
(function () {
  var grab = function (name) { return _fnBody(js, name); };
  var elBody = grab('_el'), escBody = grab('_esc');
  var fpBody = grab('_slRenderRefFaceplate'), dispBody = grab('_slRenderReference');
  if (!fpBody || !dispBody) { results.errors.push('could not extract _slRenderRefFaceplate/_slRenderReference'); return; }

  var makeEl = function (tag) {
    var attrs = {}, listeners = {}, children = [], cls = '', inner = '';
    var clsSet = {};
    var el = {
      tagName: tag.toUpperCase(),
      get className() { return cls; }, set className(v) { cls = v; },
      get innerHTML() { return inner; }, set innerHTML(v) { inner = v; children = []; },
      textContent: '', style: {},
      get _children() { return children; },
      classList: {
        add: function (c) { clsSet[c] = true; cls = (cls ? cls + ' ' : '') + c; },
        remove: function (c) { delete clsSet[c]; },
        toggle: function (c, on) { if (on) clsSet[c] = true; else delete clsSet[c]; },
        contains: function (c) { return !!clsSet[c]; }
      },
      setAttribute: function (k, v) { attrs[k] = v; },
      getAttribute: function (k) { return (k in attrs) ? attrs[k] : null; },
      removeAttribute: function (k) { delete attrs[k]; },
      appendChild: function (c) { children.push(c); return c; },
      querySelectorAll: function (sel) {
        var hits = [], want = sel.replace(/^\./, '');
        var walk = function (n) { (n._children || []).forEach(function (c) {
          if (!c || !c.tagName) return;
          if (want.toUpperCase() === c.tagName || (c.className && c.className.split(' ').indexOf(want) !== -1)) hits.push(c);
          walk(c);
        }); };
        walk(el); return hits;
      },
      addEventListener: function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
      _fire: function (ev) { (listeners[ev] || []).forEach(function (fn) { fn({}); }); }
    };
    return el;
  };
  var mCtx = { document: { createElement: makeEl }, Object: Object, Array: Array, String: String };
  vm.createContext(mCtx);
  vm.runInContext(elBody + '\n' + escBody + '\n' + fpBody + '\n' + dispBody, mCtx);

  var ref = { kind: 'faceplate', host: 'SW-1 · 8-port', ports: [
    { id: 'gi0-1', label: 'Gi0/1', led: 'up', select: true },
    { id: 'gi0-2', label: 'Gi0/2 <script>x</script>', led: 'poe-fault', select: true },
    { id: 'gi0-3', label: 'Gi0/3', led: 'down', select: false }
  ] };
  mCtx.ref = ref;
  vm.runInContext('globalThis.__panel = _slRenderReference(ref);', mCtx);
  var panel = mCtx.__panel;

  test('faceplate: _slRenderReference returns a .sl-ref panel for kind faceplate', !!panel && panel.className === 'sl-ref');
  var btns = panel.querySelectorAll('button');
  var portBtns = btns.filter(function (b) { return b.className && b.className.indexOf('port') !== -1; });
  test('faceplate: select:true ports render as focusable BUTTONs with data-port',
    portBtns.length === 2 && portBtns[0].getAttribute('data-port') === 'gi0-1');
  test('faceplate: fault-LED port carries a fault class', portBtns[1].className.indexOf('poe-fault') !== -1);
  test('faceplate: port label is ESCAPED (no raw <script>)',
    portBtns[1].innerHTML.indexOf('<script>') === -1 && portBtns[1].innerHTML.indexOf('&lt;script&gt;') !== -1);
  var inertEls = panel.querySelectorAll('div').filter(function (d) { return d.getAttribute('aria-hidden') === 'true'; });
  test('faceplate: select:false ports render as inert aria-hidden divs, not buttons', inertEls.length === 1);
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined function).
- [ ] **Step 3a: Implement the renderer**, below `_slRenderRefTerminal`:
```js
// --- faceplate reference renderer (Wave 3 Task 2) ---
// Selectable ports (select:true) are real <button>s so a mode:'facePorts' analyze
// step can bind them (single source of truth, same discipline as .term-line).
// Non-selectable ports render as inert aria-hidden divs — faceplate realism only,
// never a scoring target. LED state alone must fully signal any fault.
function _slRenderRefFaceplate(ref) {
  var root = _el('div', 'faceplate');
  var head = _el('div', 'faceplate-head');
  head.appendChild(_el('span', 'faceplate-host', _esc(ref.host || '')));
  root.appendChild(head);
  var grid = _el('div', 'faceplate-grid');
  var ports = (ref && Array.isArray(ref.ports)) ? ref.ports : [];
  ports.forEach(function (p) {
    var ledCls = 'port-' + (p.led || 'down');
    if (p.select) {
      var btn = _el('button', 'port ' + ledCls);
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-port', p.id);
      var fault = (p.led === 'poe-fault' || p.led === 'err-disabled');
      btn.setAttribute('aria-label', 'Port ' + (p.label || p.id) + (fault ? ', fault detected. Click to diagnose.' : ', click to configure.'));
      btn.innerHTML = _esc(p.label || p.id);
      grid.appendChild(btn);
    } else {
      var inert = _el('div', 'port ' + ledCls + ' port-inert', _esc(p.label || p.id));
      inert.setAttribute('aria-hidden', 'true');
      grid.appendChild(inert);
    }
  });
  root.appendChild(grid);
  return root;
}
```
- [ ] **Step 3b: Add the dispatch case** in `_slRenderReference`, after the `terminal` branch:
```js
else if (ref.kind === 'faceplate') panel.appendChild(_slRenderRefFaceplate(ref));
```
- [ ] **Step 3c: Extend the allowlist + shape check** in `simLabValidateScenario`:
```js
var ref = s.assets.reference, kinds = ['network', 'timeline', 'layered', 'terminal', 'faceplate', 'wiremap', 'slots'];
if (kinds.indexOf(ref.kind) === -1) errs.push('reference: bad kind');
else if (ref.kind === 'network' && !Array.isArray(ref.devices)) errs.push('reference network: devices[] required');
else if (ref.kind === 'timeline' && !Array.isArray(ref.stages)) errs.push('reference timeline: stages[] required');
else if (ref.kind === 'layered' && !Array.isArray(ref.layers)) errs.push('reference layered: layers[] required');
else if (ref.kind === 'terminal' && (!Array.isArray(ref.excerpts) || !ref.excerpts.every(function (ex) {
  return ex && _isNonEmptyStr(ex.id) && Array.isArray(ex.lines);
}))) errs.push('reference terminal: excerpts[] with id+lines[] required');
else if (ref.kind === 'faceplate' && (!Array.isArray(ref.ports) || !ref.ports.every(function (p) {
  return p && _isNonEmptyStr(p.id) && _isNonEmptyStr(p.label);
}))) errs.push('reference faceplate: ports[] with id+label required');
```
(Note: this task only adds the `faceplate` branch to the check; `wiremap` and `slots` branches land in Tasks 3-4 respectively — the `kinds` array above already includes all three so later tasks only add their own `else if`, not touch this array again.)
- [ ] **Step 3d: Extend `_validateStepPayload`'s analyze case** (line 25) to accept `facePorts`:
```js
case 'analyze':
  if (p.mode === 'reveal' || p.mode === 'excerptLines' || p.mode === 'facePorts' || p.mode === 'wiremapPins') {
    return Array.isArray(a.selected) && a.selected.length >= 1;
  }
  return Array.isArray(p.lines) && p.lines.length >= 2 &&
         Array.isArray(a.selected) && a.selected.length >= 1;
```
(This edit does double duty for Task 3's `wiremapPins` too — implement both mode strings now so Task 3 doesn't need to touch this line again.)
- [ ] **Step 3e: Extend `_slRenderAnalyze`'s mode check** (line 822):
```js
var mode = step.payload.mode;
if (mode === 'reveal' || mode === 'excerptLines' || mode === 'facePorts' || mode === 'wiremapPins') {
  return _slRenderAnalyzeMode(step, onChange, initial, mode);
}
```
- [ ] **Step 3f: Add the `facePorts` branch inside `_slRenderAnalyzeMode`** — change the existing `if (mode === 'reveal') {...} else {...}` to a proper multi-branch:
```js
if (mode === 'reveal') {
  // ... existing reveal branch, UNCHANGED ...
} else if (mode === 'facePorts') {
  var fpHost = (window.__slFaceplatePanel) || null;
  var fpBtns = fpHost ? fpHost.querySelectorAll('button') : [];
  fpBtns.forEach(function (btn) {
    if (!btn.className || btn.className.split(' ').indexOf('port') === -1) return;
    var id = btn.getAttribute('data-port');
    btn.addEventListener('click', function () {
      toggle(id);
      if (btn.classList) btn.classList.toggle('sl-sel', selected.indexOf(id) !== -1);
    });
    if (selected.indexOf(id) !== -1 && btn.classList) btn.classList.add('sl-sel');
  });
} else {
  // ... existing excerptLines (final else) branch, UNCHANGED, now only reached for mode==='excerptLines' or 'wiremapPins' (Task 3 splits this further) ...
}
```
- [ ] **Step 3g: Wire `window.__slFaceplateRef`/`window.__slFaceplatePanel`** into `_slMountScenario`, as a sibling flat if/else immediately after the existing terminal-ref block (do NOT nest — this exact nesting mistake was made and fixed once already in Wave 2 Task 3):
```js
if (scn.assets && scn.assets.reference && scn.assets.reference.kind === 'faceplate') {
  window.__slFaceplateRef = scn.assets.reference;
  window.__slFaceplatePanel = refPanel;
} else { window.__slFaceplateRef = null; window.__slFaceplatePanel = null; }
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+5).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): faceplate reference renderer + facePorts analyze mode"`

### Task 3: The `wiremap` reference renderer + `mode:'wiremapPins'` analyze extension

**Files:**
- Modify: `features/sim-lab.js` — add `_slRenderRefWiremap` after `_slRenderRefFaceplate`; add the `'wiremap'` case to `_slRenderReference`; add `'wiremap'` shape check to `simLabValidateScenario`; add the `wiremapPins` branch inside `_slRenderAnalyzeMode`'s final `else` (splitting it from `excerptLines`); wire `window.__slWiremapRef`/`window.__slWiremapPanel` into `_slMountScenario`.
- Test: `tests/uat.js`

**Interfaces:**
- Produces: `_slRenderRefWiremap(ref) -> DOM node` (class `wiremap`); dispatch for `ref.kind === 'wiremap'`; shape check requiring `pins[]` of length 8; `_slRenderAnalyzeMode` gains a genuine `mode === 'wiremapPins'` branch (previously Task 2 temporarily routed it into the `excerptLines` else — this task gives it its own branch).

- [ ] **Step 1: Write the failing tests** (reuse the same `makeEl` DOM shim pattern from Task 2 verbatim):
```js
(function () {
  var grab = function (name) { return _fnBody(js, name); };
  var elBody = grab('_el'), escBody = grab('_esc');
  var wmBody = grab('_slRenderRefWiremap'), dispBody = grab('_slRenderReference');
  if (!wmBody || !dispBody) { results.errors.push('could not extract _slRenderRefWiremap/_slRenderReference'); return; }
  // ... reuse the identical makeEl(tag) helper from Task 2's test block verbatim ...
  var mCtx = { document: { createElement: makeEl }, Object: Object, Array: Array, String: String };
  vm.createContext(mCtx);
  vm.runInContext(elBody + '\n' + escBody + '\n' + wmBody + '\n' + dispBody, mCtx);

  var ref = { kind: 'wiremap', pins: [
    { pin: 1, pairId: 2, endBPin: 1, select: true },
    { pin: 2, pairId: 2, endBPin: 3, select: true },   // split: crosses to pairId 3's slot
    { pin: 3, pairId: 3, endBPin: 2, select: true },
    { pin: 4, pairId: 1, endBPin: 4, select: true },
    { pin: 5, pairId: 1, endBPin: 5, select: true },
    { pin: 6, pairId: 3, endBPin: 6, select: true },
    { pin: 7, pairId: 4, endBPin: null, select: true },  // open
    { pin: 8, pairId: 4, endBPin: 8, select: true }
  ] };
  mCtx.ref = ref;
  vm.runInContext('globalThis.__panel = _slRenderReference(ref);', mCtx);
  var panel = mCtx.__panel;

  test('wiremap: _slRenderReference returns a .sl-ref panel for kind wiremap', !!panel && panel.className === 'sl-ref');
  var pinBtns = panel.querySelectorAll('button').filter(function (b) { return b.className && b.className.indexOf('wm-pin') !== -1; });
  test('wiremap: all 8 End-A pins render as focusable BUTTONs with data-pin',
    pinBtns.length === 8 && pinBtns[0].getAttribute('data-pin') === '1');
  test('wiremap: each selectable pin carries its real pairId as a class',
    pinBtns[1].className.indexOf('wm-pair-2') !== -1);
  test('wiremap: the open pin (pin 7) is distinguishable in its End-B rendering',
    panel.querySelectorAll('.wm-endb')[6].innerHTML.toLowerCase().indexOf('open') !== -1);
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined function).
- [ ] **Step 3a: Implement the renderer**, below `_slRenderRefFaceplate`:
```js
// --- wiremap reference renderer (Wave 3 Task 3) ---
// All 8 End-A pins render as real <button>s (select:true always, per spec — no
// progressive reveal, the whole map is the evidence). Each pin's fill/border class
// reflects its REAL pairId (not its textbook expected pair for that position) —
// the mismatch is what makes a split pair legible without hiding data. End-B
// renders read-only: the pin it actually landed on, or "open" if endBPin is null.
function _slRenderRefWiremap(ref) {
  var root = _el('div', 'wiremap');
  var grid = _el('div', 'wiremap-grid');
  var pins = (ref && Array.isArray(ref.pins)) ? ref.pins : [];
  pins.forEach(function (p) {
    var pairCls = 'wm-pair-' + p.pairId;
    var btn = _el('button', 'wm-pin ' + pairCls);
    btn.setAttribute('type', 'button');
    btn.setAttribute('data-pin', String(p.pin));
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'End A pin ' + p.pin);
    btn.innerHTML = _esc(String(p.pin));
    grid.appendChild(btn);
    var endBText = (p.endBPin != null) ? _esc(String(p.endBPin)) : 'open';
    grid.appendChild(_el('div', 'wm-endb ' + pairCls, endBText));
  });
  root.appendChild(grid);
  return root;
}
```
- [ ] **Step 3b: Add the dispatch case**, after the `faceplate` branch:
```js
else if (ref.kind === 'wiremap') panel.appendChild(_slRenderRefWiremap(ref));
```
- [ ] **Step 3c: Add the `wiremap` shape check**, after the `faceplate` branch in `simLabValidateScenario`:
```js
else if (ref.kind === 'wiremap' && (!Array.isArray(ref.pins) || ref.pins.length !== 8 || !ref.pins.every(function (p) {
  return p && typeof p.pin === 'number' && typeof p.pairId === 'number';
}))) errs.push('reference wiremap: pins[] must have exactly 8 entries with pin+pairId');
```
- [ ] **Step 3d: Split the `wiremapPins` branch out of `_slRenderAnalyzeMode`'s final `else`** (Task 2 temporarily routed `wiremapPins` there; give it its own real branch now):
```js
} else if (mode === 'wiremapPins') {
  var wmHost = (window.__slWiremapPanel) || null;
  var wmBtns = wmHost ? wmHost.querySelectorAll('button') : [];
  wmBtns.forEach(function (btn) {
    if (!btn.className || btn.className.split(' ').indexOf('wm-pin') === -1) return;
    var id = btn.getAttribute('data-pin');
    btn.addEventListener('click', function () {
      toggle(id);
      btn.setAttribute('aria-pressed', String(selected.indexOf(id) !== -1));
      if (btn.classList) btn.classList.toggle('sl-sel', selected.indexOf(id) !== -1);
    });
    if (selected.indexOf(id) !== -1 && btn.classList) btn.classList.add('sl-sel');
  });
} else {
  // excerptLines — UNCHANGED, now genuinely only reached for mode==='excerptLines'
}
```
- [ ] **Step 3e: Wire `window.__slWiremapRef`/`window.__slWiremapPanel`** into `_slMountScenario`, as another sibling flat if/else after the faceplate block:
```js
if (scn.assets && scn.assets.reference && scn.assets.reference.kind === 'wiremap') {
  window.__slWiremapRef = scn.assets.reference;
  window.__slWiremapPanel = refPanel;
} else { window.__slWiremapRef = null; window.__slWiremapPanel = null; }
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4). Re-run Task 2's `facePorts` tests too (do not just check the delta count) — confirm zero regression from splitting the mode branches.
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): wiremap reference renderer + wiremapPins analyze mode"`

### Task 4: The `slots` reference renderer (static/illustrative, zero interaction)

**Files:**
- Modify: `features/sim-lab.js` — add `_slRenderRefSlots` after `_slRenderRefWiremap`; add the `'slots'` case to `_slRenderReference`; add `'slots'` shape check to `simLabValidateScenario`.
- Test: `tests/uat.js`

**Interfaces:**
- Produces: `_slRenderRefSlots(ref) -> DOM node` (class `slots-diagram`), containing ZERO `<button>`, ZERO click handler, ZERO `data-*` scoring attribute — pure illustration.

- [ ] **Step 1: Write the failing tests:**
```js
(function () {
  var grab = function (name) { return _fnBody(js, name); };
  var elBody = grab('_el'), escBody = grab('_esc');
  var slBody = grab('_slRenderRefSlots'), dispBody = grab('_slRenderReference');
  if (!slBody || !dispBody) { results.errors.push('could not extract _slRenderRefSlots/_slRenderReference'); return; }
  // ... reuse the identical makeEl(tag) helper verbatim ...
  var mCtx = { document: { createElement: makeEl }, Object: Object, Array: Array, String: String };
  vm.createContext(mCtx);
  vm.runInContext(elBody + '\n' + escBody + '\n' + slBody + '\n' + dispBody, mCtx);

  var ref = { kind: 'slots',
    bays: [ { id: 'cpu', label: 'CPU socket' }, { id: 'gpu', label: 'GPU bay <script>x</script>' } ],
    notes: [ 'Budget: $700' ] };
  mCtx.ref = ref;
  vm.runInContext('globalThis.__panel = _slRenderReference(ref);', mCtx);
  var panel = mCtx.__panel;

  test('slots: _slRenderReference returns a .sl-ref panel for kind slots', !!panel && panel.className === 'sl-ref');
  test('slots: panel contains ZERO buttons (deliberately non-interactive)', panel.querySelectorAll('button').length === 0);
  var bayLabels = panel.querySelectorAll('.slot-bay-label');
  test('slots: renders one label per bay', bayLabels.length === 2);
  test('slots: bay label text is ESCAPED (no raw <script>)',
    bayLabels[1].innerHTML.indexOf('<script>') === -1 && bayLabels[1].innerHTML.indexOf('&lt;script&gt;') !== -1);
  var notes = panel.querySelectorAll('.slot-note');
  test('slots: renders constraint-note chips', notes.length === 1 && notes[0].innerHTML.indexOf('$700') !== -1);
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined function).
- [ ] **Step 3a: Implement the renderer**, below `_slRenderRefWiremap`:
```js
// --- slots reference renderer (Wave 3 Task 4) ---
// DELIBERATELY static/illustrative — zero <button>, zero click handler, zero
// exposed interaction handle. Shared verbatim by 'pcbuild' (component bays) and
// 'raid' (drive bays). If a future task wants this bound to live configure
// selections, that is a SECOND new binding direction and out of Wave 3 scope —
// STOP and escalate rather than add interaction here.
function _slRenderRefSlots(ref) {
  var root = _el('div', 'slots-diagram');
  var bays = (ref && Array.isArray(ref.bays)) ? ref.bays : [];
  bays.forEach(function (b) {
    var bay = _el('div', 'slot-bay');
    bay.appendChild(_el('div', 'slot-bay-label', _esc(b.label || b.id)));
    root.appendChild(bay);
  });
  if (ref && Array.isArray(ref.notes) && ref.notes.length) {
    var notes = _el('div', 'slot-notes');
    ref.notes.forEach(function (n) { notes.appendChild(_el('span', 'slot-note', _esc(n))); });
    root.appendChild(notes);
  }
  return root;
}
```
- [ ] **Step 3b: Add the dispatch case**, after the `wiremap` branch:
```js
else if (ref.kind === 'slots') panel.appendChild(_slRenderRefSlots(ref));
```
- [ ] **Step 3c: Add the `slots` shape check**, after the `wiremap` branch in `simLabValidateScenario`:
```js
else if (ref.kind === 'slots' && !Array.isArray(ref.bays)) errs.push('reference slots: bays[] required');
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+5).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): slots reference renderer (static, shared by pcbuild + raid)"`

### Task 5: Port-map fidelity validator

**Files:**
- Modify: `features/sim-lab.js` (below the Wave-2 triage validator, ~L483)
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: `_isNonEmptyStr`, `_slFidelityResolveSlot`.
- Produces: `simLabValidatePortMapFidelity(scn) -> {ok, errors}`; constant `_PORTMAP_FAULT_SIG`.

- [ ] **Step 1: Write failing tests:**
```js
(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var sigVar = (js.match(/var _PORTMAP_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'), sigVar, grab('simLabValidatePortMapFidelity')].join('\n');
  if (!sigVar || body.indexOf('simLabValidatePortMapFidelity') === -1) { results.errors.push('could not extract portmap validator'); return; }
  var pCtx = {}; vm.createContext(pCtx); vm.runInContext(body, pCtx);
  vm.runInContext('globalThis.__pm = simLabValidatePortMapFidelity;', pCtx);
  var pm = pCtx.__pm;

  var scn = {
    portmap: { faultPort: 'gi0-8' },
    assets: { reference: { kind: 'faceplate', host: 'h', ports: [
      { id: 'gi0-1', label: 'Gi0/1', led: 'up', select: true },
      { id: 'gi0-8', label: 'Gi0/8', led: 'poe-fault', select: true },
      { id: 'gi0-18', label: 'Gi0/18', led: 'up', select: true }
    ] } },
    steps: [
      { id: 'prov', type: 'configure', points: 1, payload: { slots: [
        { id: 'gi0-1__vlan', label: 'v', options: [{ id: 'a', text: 'VLAN 10' }, { id: 'b', text: 'VLAN 20' }] },
        { id: 'gi0-1__poe', label: 'p', options: [{ id: 'a', text: 'Off' }, { id: 'b', text: 'On' }] },
        { id: 'gi0-8__vlan', label: 'v', options: [{ id: 'a', text: 'VLAN 40' }, { id: 'b', text: 'VLAN 10' }] },
        { id: 'gi0-8__poe', label: 'p', options: [{ id: 'a', text: 'On' }, { id: 'b', text: 'Off' }] }
      ] }, answer: { slots: { 'gi0-1__vlan': 'a', 'gi0-1__poe': 'a', 'gi0-8__vlan': 'a', 'gi0-8__poe': 'a' } } },
      { id: 'diag', type: 'analyze', points: 1, payload: { multi: false, mode: 'facePorts' }, answer: { selected: ['gi0-8'] } },
      { id: 'fix', type: 'configure', points: 1, payload: { slots: [
        { id: 'rootCause', label: 'r', options: [{ id: 'a', text: 'PoE overcurrent: the camera draw exceeds the port class' }, { id: 'b', text: 'Wrong VLAN' }] },
        { id: 'fix', label: 'f', options: [{ id: 'a', text: 'Move to a port with a higher PoE power budget' }, { id: 'b', text: 'Change VLAN' }] }
      ] }, answer: { slots: { rootCause: 'a', fix: 'a' } } }
    ],
    portmapTickets: [ { port: 'gi0-1', vlan: '10', poe: false }, { port: 'gi0-8', vlan: '40', poe: true } ]
  };
  assert(pm(scn).ok === true, 'portmap: sound PoE-overcurrent scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.slots['gi0-1__vlan'] = 'b';
  assert(pm(bad1).ok === false, 'portmap: keyed VLAN not matching the ticket rejected');
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.assets.reference.ports[2].led = 'poe-fault';
  assert(pm(bad2).ok === false, 'portmap: a second port sharing the fault LED breaks fault-port uniqueness');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.steps[2].answer.slots.rootCause = 'b';
  assert(pm(bad3).ok === false, 'portmap: keyed rootCause not matching the LED-signaled fault rejected');
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined).
- [ ] **Step 3: Implement:**
```js
// --- port-map fidelity validator (Wave 3 Task 5) ---
// Proves, machine-checkable: (a) every keyed provision slot (VLAN + PoE) matches
// that port's ticket requirement; (b) the keyed faulty port's LED state genuinely
// and UNIQUELY signals the keyed rootCause/fix (mutation-checked: no other port's
// LED may also match the fault signature).
var _PORTMAP_FAULT_SIG = {
  poeOvercurrent: { led: 'poe-fault', root: /poe overcurrent|power.*exceeds|draw.*exceeds/i, fix: /higher poe power budget|802\.3at|power budget/i },
  errDisabled:    { led: 'err-disabled', root: /duplex|speed mismatch|err-disabled/i, fix: /reset the port|match speed.*duplex|re-negotiate/i }
};
function simLabValidatePortMapFidelity(scn) {
  var errs = [];
  var ref = scn && scn.assets && scn.assets.reference;
  var tickets = scn && scn.portmapTickets;
  var faultPort = scn && scn.portmap && scn.portmap.faultPort;
  if (!ref || ref.kind !== 'faceplate' || !Array.isArray(ref.ports) || !Array.isArray(tickets)) {
    return { ok: false, errors: ['portmap fidelity: faceplate reference + scn.portmapTickets[] required'] };
  }
  var cfg = (scn.steps || []).filter(function (st) { return st.type === 'configure' && st.answer && st.answer.slots; })[0];
  // (a) every ticket's VLAN/PoE keyed answer matches
  tickets.forEach(function (t) {
    if (!cfg) return;
    var keyedVlan = _slFidelityResolveSlot(cfg, t.port + '__vlan');
    var keyedPoe = _slFidelityResolveSlot(cfg, t.port + '__poe');
    if (keyedVlan !== undefined && keyedVlan.indexOf(t.vlan) === -1) errs.push('portmap: keyed ' + t.port + '__vlan "' + keyedVlan + '" != ticket VLAN ' + t.vlan);
    if (keyedPoe !== undefined) {
      var wantOn = !!t.poe;
      var gotOn = /^on$/i.test(keyedPoe);
      if (wantOn !== gotOn) errs.push('portmap: keyed ' + t.port + '__poe "' + keyedPoe + '" != ticket PoE ' + t.poe);
    }
  });
  // (b) exactly one port carries the fault LED, and it is the keyed faultPort
  var faultLedPorts = ref.ports.filter(function (p) {
    return p.led === 'poe-fault' || p.led === 'err-disabled';
  });
  if (faultLedPorts.length !== 1) {
    errs.push('portmap: expected exactly 1 fault-LED port, found ' + faultLedPorts.length);
  } else if (faultLedPorts[0].id !== faultPort) {
    errs.push('portmap: fault-LED port "' + faultLedPorts[0].id + '" != keyed faultPort "' + faultPort + '"');
  }
  // keyed diagnose analyze step targets the same port
  var diag = (scn.steps || []).filter(function (st) { return st.type === 'analyze' && st.payload && st.payload.mode === 'facePorts'; })[0];
  if (!diag || !diag.answer || diag.answer.selected[0] !== faultPort) {
    errs.push('portmap: diagnose analyze step does not key the fault port');
  }
  // keyed rootCause/fix matches the fault-signature table for the actual LED type
  var fixCfg = (scn.steps || []).filter(function (st) {
    return st.type === 'configure' && st.answer && st.answer.slots &&
      (st.answer.slots.rootCause !== undefined || st.answer.slots.fix !== undefined);
  })[0];
  var ledType = faultLedPorts[0] && faultLedPorts[0].led === 'poe-fault' ? 'poeOvercurrent' : 'errDisabled';
  var sig = _PORTMAP_FAULT_SIG[ledType];
  if (fixCfg && sig) {
    var root = _slFidelityResolveSlot(fixCfg, 'rootCause');
    var fix = _slFidelityResolveSlot(fixCfg, 'fix');
    if (root === undefined || !sig.root.test(root)) errs.push('portmap: keyed rootCause "' + root + '" does not match ' + ledType);
    if (fix === undefined || !sig.fix.test(fix)) errs.push('portmap: keyed fix "' + fix + '" does not match ' + ledType);
  }
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4). If the fixture's needle regexes don't match on first pass (this has happened twice already in Waves 1-2's fault-signature tables), hand-derive the match by reading the regex against the fixture string before assuming the validator logic is wrong — fix the SIGNATURE table, not the validator's structure, unless you find a genuine structural bug.
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): port-map fault-uniqueness fidelity validator"`

### Task 6: Wiremap fidelity validator

**Files:**
- Modify: `features/sim-lab.js` (below the port-map validator)
- Test: `tests/uat.js`

**Interfaces:**
- Produces: `simLabValidateWiremapFidelity(scn) -> {ok, errors}`; constants `_WIREMAP_FAULT_SIG` and `_WM_EXPECTED_PAIR` (both plain lookup objects, not functions — extract with a `var`-matching regex, not `_fnBody`/`grab`).

- [ ] **Step 1: Write failing tests:**
```js
(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var sigVar = (js.match(/var _WIREMAP_FAULT_SIG = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var pairVar = (js.match(/var _WM_EXPECTED_PAIR = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'), pairVar, sigVar, grab('simLabValidateWiremapFidelity')].join('\n');
  if (!sigVar || !pairVar || body.indexOf('simLabValidateWiremapFidelity') === -1) { results.errors.push('could not extract wiremap validator/_WIREMAP_FAULT_SIG/_WM_EXPECTED_PAIR'); return; }
  var wCtx = {}; vm.createContext(wCtx); vm.runInContext(body, wCtx);
  vm.runInContext('globalThis.__wm = simLabValidateWiremapFidelity;', wCtx);
  var wm = wCtx.__wm;

  // TIA/EIA-568B: Pair1=4,5 Pair2=1,2 Pair3=3,6 Pair4=7,8. Split pair: pins 2&3 cross.
  var scn = { wiremap: { fault: 'splitPair' },
    assets: { reference: { kind: 'wiremap', pins: [
      { pin: 1, pairId: 2, endBPin: 1, select: true },
      { pin: 2, pairId: 2, endBPin: 3, select: true },
      { pin: 3, pairId: 3, endBPin: 2, select: true },
      { pin: 4, pairId: 1, endBPin: 4, select: true },
      { pin: 5, pairId: 1, endBPin: 5, select: true },
      { pin: 6, pairId: 3, endBPin: 6, select: true },
      { pin: 7, pairId: 4, endBPin: 7, select: true },
      { pin: 8, pairId: 4, endBPin: 8, select: true }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1, payload: { multi: true, mode: 'wiremapPins' }, answer: { selected: ['2', '3'] } },
      { id: 'dx', type: 'configure', points: 1, payload: { slots: [
        { id: 'faultType', label: 'f', options: [{ id: 'a', text: 'Split pair' }, { id: 'b', text: 'Open circuit' }] },
        { id: 'fix', label: 'x', options: [{ id: 'a', text: 'Re-terminate so the real pairs land on their correct pins' }, { id: 'b', text: 'Replace the cable' }] }
      ] }, answer: { slots: { faultType: 'a', fix: 'a' } } }
    ] };
  assert(wm(scn).ok === true, 'wiremap: sound split-pair scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.selected = ['3'];
  assert(wm(bad1).ok === false, 'wiremap: keyed selection missing one of the two crossed pins rejected');
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.assets.reference.pins[1].endBPin = 2; bad2.assets.reference.pins[2].endBPin = 3;
  assert(wm(bad2).ok === false, 'wiremap: a second, accidental fault (pin data no longer matches keyed splitPair) rejected');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.steps[1].answer.slots.faultType = 'b';
  assert(wm(bad3).ok === false, 'wiremap: keyed faultType not matching the actual pin-data fault rejected');
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined).
- [ ] **Step 3: Implement:**
```js
// --- wiremap fidelity validator (Wave 3 Task 6) ---
// Proves, machine-checkable: the keyed fault type + keyed pin selection are BOTH
// mechanically derivable from the raw pin data, and every OTHER pin is a clean
// straight-through (exactly one fault exists, mutation-checked).
var _WIREMAP_FAULT_SIG = {
  open:         { root: /open/i, fix: /re-terminate|reseat|reconnect/i },
  short:        { root: /short/i, fix: /re-terminate|replace the cable/i },
  splitPair:    { root: /split pair/i, fix: /re-terminate/i },
  reversedPair: { root: /reversed pair/i, fix: /re-terminate/i }
};
// EIA/TIA-568B expected pair-by-pin position (independent of what a given fixture's
// pins[] actually carries — this is the textbook mapping used to detect deviation).
var _WM_EXPECTED_PAIR = { 1: 2, 2: 2, 3: 3, 4: 1, 5: 1, 6: 3, 7: 4, 8: 4 };
function simLabValidateWiremapFidelity(scn) {
  var errs = [];
  var ref = scn && scn.assets && scn.assets.reference;
  var fault = scn && scn.wiremap && scn.wiremap.fault;
  if (!ref || ref.kind !== 'wiremap' || !Array.isArray(ref.pins) || ref.pins.length !== 8) {
    return { ok: false, errors: ['wiremap fidelity: wiremap reference with 8 pins required'] };
  }
  var sig = _WIREMAP_FAULT_SIG[fault];
  if (!sig) return { ok: false, errors: ['wiremap fidelity: unknown wiremap.fault "' + fault + '"'] };
  var byPin = {};
  ref.pins.forEach(function (p) { byPin[p.pin] = p; });

  var faulty = [];
  ref.pins.forEach(function (p) {
    var expected = _WM_EXPECTED_PAIR[p.pin];
    if (p.endBPin == null) { faulty.push({ pin: p.pin, kind: 'open' }); return; }
    if (p.endBPin !== p.pin) {
      var other = byPin[p.endBPin];
      if (other && other.pairId === p.pairId) faulty.push({ pin: p.pin, kind: 'reversedPair' });
      else faulty.push({ pin: p.pin, kind: 'splitPair' });
      return;
    }
    // straight-through position; a short shows up as ANOTHER pin also landing on this pin
    var landers = ref.pins.filter(function (q) { return q.endBPin === p.pin && q.pin !== p.pin; });
    if (landers.length) faulty.push({ pin: p.pin, kind: 'short' });
  });
  // exactly-one-fault-class invariant: every faulty pin must agree on kind
  var kinds = {}; faulty.forEach(function (f) { kinds[f.kind] = true; });
  if (Object.keys(kinds).length > 1) errs.push('wiremap: mixed fault kinds detected (' + Object.keys(kinds).join(', ') + '), fixture must contain exactly one fault class');
  if (!faulty.length) errs.push('wiremap: no fault detected in pin data');

  var faultyIds = faulty.map(function (f) { return String(f.pin); }).sort();
  var flagStep = (scn.steps || []).filter(function (st) { return st.type === 'analyze' && st.payload && st.payload.mode === 'wiremapPins'; })[0];
  var keyed = (flagStep && flagStep.answer && flagStep.answer.selected) ? flagStep.answer.selected.slice().sort() : [];
  if (keyed.join(',') !== faultyIds.join(',')) errs.push('wiremap: keyed selected [' + keyed.join(',') + '] != derived faulty pins [' + faultyIds.join(',') + ']');

  var actualKind = faulty[0] && faulty[0].kind;
  if (actualKind && actualKind !== fault) errs.push('wiremap: scn.wiremap.fault "' + fault + '" != pin-data-derived fault "' + actualKind + '"');

  var dx = (scn.steps || []).filter(function (st) {
    return st.type === 'configure' && st.answer && st.answer.slots &&
      (st.answer.slots.faultType !== undefined || st.answer.slots.fix !== undefined);
  })[0];
  if (!dx) errs.push('wiremap: no configure step with faultType/fix slots');
  else {
    var root = _slFidelityResolveSlot(dx, 'faultType');
    var fix = _slFidelityResolveSlot(dx, 'fix');
    if (root === undefined || !sig.root.test(root)) errs.push('wiremap: keyed faultType "' + root + '" does not match ' + fault);
    if (fix === undefined || !sig.fix.test(fix)) errs.push('wiremap: keyed fix "' + fix + '" does not match ' + fault);
  }
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4). Hand-derive the split-pair/reversed-pair distinction against the fixture before assuming a failure means the validator's structure is wrong (this is the single trickiest piece of logic in the whole wave — walk it by hand: pin 2 has `endBPin:3`, pin 3 has `endBPin:2`, and `byPin[3].pairId` (3) !== `p.pairId` (2 for pin 2), so pin 2 correctly classifies as `splitPair`, not `reversedPair` — `reversedPair` requires the LANDING pin's `pairId` to MATCH, which only happens when two same-pair pins swap).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): wiremap fault-classification fidelity validator"`

### Task 7: PC-build fidelity validator

**Files:**
- Modify: `features/sim-lab.js` — the new validator + `_PARTS_CATALOG` land below the wiremap validator; the small `_slFidelityResolveSlotId` helper (Step 3) lands immediately after the existing `_slFidelityResolveSlot`, line 115-124, NOT next to the validator itself
- Test: `tests/uat.js`

**Interfaces:**
- Produces: `simLabValidatePcBuildFidelity(scn) -> {ok, errors}`; constant `_PARTS_CATALOG` (shared price/watts/lengthMm/tier lookup table, reused by both `pcbuild` scenarios' scoring AND this validator — single source of truth); helper `_slFidelityResolveSlotId(step, slotId)` (sibling to the existing `_slFidelityResolveSlot`, resolves to `option.id` instead of `option.text`).

- [ ] **Step 1: Write failing tests:**
```js
(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var catVar = (js.match(/var _PARTS_CATALOG = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'), catVar, grab('simLabValidatePcBuildFidelity')].join('\n');
  if (!catVar || body.indexOf('simLabValidatePcBuildFidelity') === -1) { results.errors.push('could not extract pcbuild validator/_PARTS_CATALOG'); return; }
  var cCtx = {}; vm.createContext(cCtx); vm.runInContext(body, cCtx);
  vm.runInContext('globalThis.__pcb = simLabValidatePcBuildFidelity;', cCtx);
  var pcb = cCtx.__pcb;

  // Option ids ARE the catalog keys directly (e.g. option.id === 'cpu-creator') — the
  // shared catalog is looked up by id, never by the option's human-readable `text` label.
  // This is a deliberate content-authoring convention for THIS archetype only (every
  // other archetype in the program uses arbitrary 'a'/'b' option ids with a keyed
  // answer.slots pointer, since their validators regex against the resolved TEXT —
  // pcbuild is the one place a validator needs an exact machine key, so its ids carry
  // that key directly instead of introducing a second resolve-by-id code path everywhere).
  function slots(v) { return { id: 'clientA', type: 'configure', points: 1, payload: { slots: Object.keys(v).map(function (k) {
    return { id: k, label: k, options: [{ id: v[k], text: 'Option ' + v[k] }, { id: 'placeholder-' + k, text: 'placeholder' }] };
  }) }, answer: { slots: Object.keys(v).reduce(function (acc, k) { acc[k] = v[k]; return acc; }, {}) } }; }

  var scn = { pcbuild: { clientA: { budgetUsd: 1500, caseMaxGpuLengthMm: 300, minCpuTier: 2, minGpuTier: 2 } },
    steps: [ slots({ cpu: 'cpu-creator', gpu: 'gpu-4060', ram: 'ram-32', psu: 'psu-450', storage: 'storage-1tb-nvme', cooling: 'cool-120-air' }) ] };
  assert(pcb(scn).ok === true, 'pcbuild: sound clientA build passes');
  var bad1 = JSON.parse(JSON.stringify(scn));
  bad1.steps[0].payload.slots.find(function (s) { return s.id === 'cpu'; }).options[0].id = 'cpu-flagship';
  bad1.steps[0].answer.slots.cpu = 'cpu-flagship';
  assert(pcb(bad1).ok === false, 'pcbuild: over-budget CPU swap rejected');
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.pcbuild.clientA.caseMaxGpuLengthMm = 200;
  assert(pcb(bad2).ok === false, 'pcbuild: GPU longer than the case limit rejected');
  var bad3 = JSON.parse(JSON.stringify(scn));
  bad3.steps[0].payload.slots.find(function (s) { return s.id === 'psu'; }).options[0].id = 'psu-250';
  bad3.steps[0].answer.slots.psu = 'psu-250';
  assert(pcb(bad3).ok === false, 'pcbuild: PSU wattage below CPU+GPU draw rejected');
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined).
- [ ] **Step 3: Implement.** **First add a small companion helper** — `_slFidelityResolveSlot` (existing, used by every other archetype's validator) resolves a keyed slot to its option's `text`; pcbuild needs the option's `id` instead (which IS the catalog key, per the convention above), so add `_slFidelityResolveSlotId` right next to it:
```js
// Sibling to _slFidelityResolveSlot (which resolves to option.text) — pcbuild is the
// one archetype whose validator needs the option's `id` directly (the catalog key),
// not its human-readable text.
function _slFidelityResolveSlotId(step, slotId) {
  if (!step || !step.payload || !Array.isArray(step.payload.slots)) return undefined;
  if (!step.answer || !step.answer.slots) return undefined;
  var correctOptId = step.answer.slots[slotId];
  if (!correctOptId) return undefined;
  var slot = step.payload.slots.filter(function (sl) { return sl.id === slotId; })[0];
  if (!slot || !Array.isArray(slot.options)) return undefined;
  var opt = slot.options.filter(function (o) { return o.id === correctOptId; })[0];
  return opt ? opt.id : undefined;
}
```
Place this immediately after `_slFidelityResolveSlot` (line 115-124) — it belongs with the other fidelity helpers, not inside the pcbuild validator itself, since it's a generic resolve utility. **The catalog values below are the plan's locked reference set** — Task 12's content authoring MUST use option ids from this exact table (do not invent new part ids without adding them here first, or the validator will silently treat an unknown part as `undefined` and every check involving it will fail closed):
```js
// --- PC-build fidelity validator (Wave 3 Task 7) ---
// Shared catalog: price/watts/lengthMm/tier per part id. Single source of truth for
// both content authoring (Task 12) and this validator's budget/compatibility/tier math.
var _PARTS_CATALOG = {
  'cpu-budget': { price: 130, watts: 65, tier: 1 }, 'cpu-office': { price: 175, watts: 65, tier: 1 },
  'cpu-igpu-mid': { price: 210, watts: 65, tier: 2 }, 'cpu-creator': { price: 310, watts: 105, tier: 3 },
  'cpu-flagship': { price: 560, watts: 125, tier: 4 },
  'gpu-none': { price: 0, watts: 0, lengthMm: 0, tier: 0 }, 'gpu-1650': { price: 150, watts: 75, lengthMm: 170, tier: 1 },
  'gpu-4060': { price: 300, watts: 115, lengthMm: 244, tier: 2 }, 'gpu-4070': { price: 550, watts: 200, lengthMm: 310, tier: 3 },
  'ram-8': { price: 25, tier: 1 }, 'ram-16': { price: 45, tier: 1 }, 'ram-32': { price: 85, tier: 2 }, 'ram-64': { price: 165, tier: 3 },
  'psu-250': { price: 22, watts: 250 }, 'psu-450': { price: 45, watts: 450 }, 'psu-650': { price: 65, watts: 650 }, 'psu-850': { price: 95, watts: 850 },
  'storage-256-sata': { price: 30, tier: 1 }, 'storage-1tb-nvme': { price: 75, tier: 2 }, 'storage-2tb-nvme': { price: 130, tier: 3 },
  'cool-stock': { price: 0, tier: 1 }, 'cool-120-air': { price: 35, tier: 2 }, 'cool-240-aio': { price: 90, tier: 3 }
};
function simLabValidatePcBuildFidelity(scn) {
  var errs = [];
  ['clientA', 'clientB'].forEach(function (clientKey) {
    var fact = scn.pcbuild && scn.pcbuild[clientKey];
    if (!fact) return; // this fixture may only define clientA; real content defines both
    var cfg = (scn.steps || []).filter(function (st) { return st.id === clientKey; })[0];
    if (!cfg) { errs.push('pcbuild: no configure step with id "' + clientKey + '"'); return; }
    var slotIds = ['cpu', 'gpu', 'ram', 'psu', 'storage', 'cooling'];
    var parts = {};
    slotIds.forEach(function (sid) {
      var partId = _slFidelityResolveSlotId(cfg, sid);
      parts[sid] = _PARTS_CATALOG[partId];
      if (!parts[sid]) errs.push('pcbuild: ' + clientKey + '.' + sid + ' keyed to unknown part id "' + partId + '"');
    });
    if (errs.length) return;
    var total = slotIds.reduce(function (sum, sid) { return sum + (parts[sid].price || 0); }, 0);
    if (total > fact.budgetUsd) errs.push('pcbuild: ' + clientKey + ' total $' + total + ' exceeds budget $' + fact.budgetUsd);
    var draw = (parts.cpu.watts || 0) + (parts.gpu.watts || 0);
    if ((parts.psu.watts || 0) < draw) errs.push('pcbuild: ' + clientKey + ' PSU ' + parts.psu.watts + 'W below draw ' + draw + 'W');
    if ((parts.gpu.lengthMm || 0) > fact.caseMaxGpuLengthMm) errs.push('pcbuild: ' + clientKey + ' GPU ' + parts.gpu.lengthMm + 'mm exceeds case max ' + fact.caseMaxGpuLengthMm + 'mm');
    if ((parts.cpu.tier || 0) < fact.minCpuTier) errs.push('pcbuild: ' + clientKey + ' CPU tier ' + parts.cpu.tier + ' below required ' + fact.minCpuTier);
    if ((parts.gpu.tier || 0) < fact.minGpuTier) errs.push('pcbuild: ' + clientKey + ' GPU tier ' + parts.gpu.tier + ' below required ' + fact.minGpuTier);
  });
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): PC-build budget/compatibility/tier fidelity validator"`

### Task 8: RAID fidelity validator

**Files:**
- Modify: `features/sim-lab.js` (below the PC-build validator)
- Test: `tests/uat.js`

**Interfaces:**
- Produces: `simLabValidateRaidFidelity(scn) -> {ok, errors}`; constant `_RAID_LEVEL_META` (capacity formula + tolerance per level).

- [ ] **Step 1: Write failing tests:**
```js
(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var metaVar = (js.match(/var _RAID_LEVEL_META = \{[\s\S]*?\n\s*\};/) || [''])[0];
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'), metaVar, grab('_raidLevelKey'), grab('simLabValidateRaidFidelity')].join('\n');
  if (!metaVar || body.indexOf('simLabValidateRaidFidelity') === -1) { results.errors.push('could not extract raid validator/_RAID_LEVEL_META/_raidLevelKey'); return; }
  var rCtx = {}; vm.createContext(rCtx); vm.runInContext(body, rCtx);
  vm.runInContext('globalThis.__raid = simLabValidateRaidFidelity;', rCtx);
  var raid = rCtx.__raid;

  var scn = { raid: { targetUsableTb: 4, targetTolerance: 1, failedDriveCount: 1 },
    steps: [
      { id: 'build', type: 'configure', points: 1, payload: { slots: [
        { id: 'level', label: 'l', options: [{ id: 'a', text: 'RAID 5' }, { id: 'b', text: 'RAID 10' }] },
        { id: 'driveCount', label: 'c', options: [{ id: 'a', text: '3' }, { id: 'b', text: '4' }] },
        { id: 'driveSize', label: 's', options: [{ id: 'a', text: '2' }, { id: 'b', text: '1' }] }
      ] }, answer: { slots: { level: 'a', driveCount: 'a', driveSize: 'a' } } },
      { id: 'degrade', type: 'configure', points: 1, payload: { slots: [
        { id: 'arrayStatus', label: 'a', options: [{ id: 'a', text: 'Degraded' }, { id: 'b', text: 'Failed' }] },
        { id: 'recoveryAction', label: 'r', options: [{ id: 'a', text: 'Hot-swap and rebuild' }, { id: 'b', text: 'Restore from backup' }] }
      ] }, answer: { slots: { arrayStatus: 'a', recoveryAction: 'a' } } }
    ] };
  assert(raid(scn).ok === true, 'raid: sound RAID5 3x2TB scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.slots.driveCount = 'b'; bad1.steps[0].payload.slots[1].options[0].text = '2';
  assert(raid(bad1).ok === false, 'raid: keyed build that misses the capacity target rejected');
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.raid.failedDriveCount = 2;
  assert(raid(bad2).ok === false, 'raid: 2 failed drives against RAID5 tolerance-1 must NOT stay keyed degraded/rebuild');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.steps[0].answer.slots.level = 'b'; bad3.steps[0].payload.slots[2].options[0].text = '4';
  assert(raid(bad3).ok === false, 'raid: a non-minimal-drive-count valid build (RAID10 needs 4 drives for the same result) rejected');
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined).
- [ ] **Step 3: Implement:**
```js
// --- RAID fidelity validator (Wave 3 Task 8) ---
// Proves: real capacity/tolerance math for the keyed build clears both targets AND
// is the minimal-drive-count fit (guards against a "works but isn't intended" key);
// the degrade-phase keyed status/action follows correctly from failedDriveCount vs.
// the built level's real tolerance (mutation-checked: flipping failedDriveCount past
// tolerance must flip the expected keys).
var _RAID_LEVEL_META = {
  raid0:  { tolerance: 0, capacity: function (c, s) { return c * s; }, minDrives: 2 },
  raid1:  { tolerance: 1, capacity: function (c, s) { return s; }, minDrives: 2 },
  raid5:  { tolerance: 1, capacity: function (c, s) { return (c - 1) * s; }, minDrives: 3 },
  raid6:  { tolerance: 2, capacity: function (c, s) { return (c - 2) * s; }, minDrives: 4 },
  raid10: { tolerance: 1, capacity: function (c, s) { return Math.floor(c / 2) * s; }, minDrives: 4 }
};
function _raidLevelKey(text) {
  var m = /raid\s*(\d+)/i.exec(text || '');
  if (!m) return null;
  var n = m[1];
  return n === '0' ? 'raid0' : n === '1' ? 'raid1' : n === '5' ? 'raid5' : n === '6' ? 'raid6' : n === '10' ? 'raid10' : null;
}
function simLabValidateRaidFidelity(scn) {
  var errs = [];
  var fact = scn && scn.raid;
  if (!fact || typeof fact.targetUsableTb !== 'number' || typeof fact.targetTolerance !== 'number') {
    return { ok: false, errors: ['raid fidelity: scn.raid.{targetUsableTb,targetTolerance,failedDriveCount} required'] };
  }
  var build = (scn.steps || []).filter(function (st) { return st.id === 'build'; })[0];
  if (!build) return { ok: false, errors: ['raid fidelity: no configure step with id "build"'] };
  var levelText = _slFidelityResolveSlot(build, 'level');
  var levelKey = _raidLevelKey(levelText);
  var drives = parseInt(_slFidelityResolveSlot(build, 'driveCount'), 10);
  var size = parseInt(_slFidelityResolveSlot(build, 'driveSize'), 10);
  var meta = levelKey && _RAID_LEVEL_META[levelKey];
  if (!meta) { errs.push('raid fidelity: keyed level "' + levelText + '" not recognized'); return { ok: false, errors: errs }; }
  if (drives < meta.minDrives) errs.push('raid fidelity: ' + levelKey + ' needs at least ' + meta.minDrives + ' drives, keyed ' + drives);
  var usable = meta.capacity(drives, size);
  if (usable < fact.targetUsableTb) errs.push('raid fidelity: keyed build usable ' + usable + 'TB below target ' + fact.targetUsableTb + 'TB');
  if (meta.tolerance < fact.targetTolerance) errs.push('raid fidelity: keyed level tolerance ' + meta.tolerance + ' below target ' + fact.targetTolerance);
  // minimal-cost check: no OTHER level/drive-count combo at or below this drive count also clears both targets
  var levelKeys = Object.keys(_RAID_LEVEL_META);
  var cheaperExists = false;
  levelKeys.forEach(function (lk) {
    var m2 = _RAID_LEVEL_META[lk];
    for (var c = m2.minDrives; c < drives; c++) {
      if (m2.capacity(c, size) >= fact.targetUsableTb && m2.tolerance >= fact.targetTolerance) cheaperExists = true;
    }
  });
  if (cheaperExists) errs.push('raid fidelity: a combination with fewer drives also clears both targets, keyed build is not minimal');

  var degrade = (scn.steps || []).filter(function (st) { return st.id === 'degrade'; })[0];
  if (!degrade) { errs.push('raid fidelity: no configure step with id "degrade"'); return { ok: errs.length === 0, errors: errs }; }
  var status = _slFidelityResolveSlot(degrade, 'arrayStatus');
  var action = _slFidelityResolveSlot(degrade, 'recoveryAction');
  var failed = fact.failedDriveCount;
  if (failed > meta.tolerance) {
    if (!/failed/i.test(status || '')) errs.push('raid fidelity: ' + failed + ' failed drives exceeds tolerance ' + meta.tolerance + ', keyed status "' + status + '" should be Failed');
    if (!/restore/i.test(action || '')) errs.push('raid fidelity: keyed recoveryAction "' + action + '" should be restore-from-backup when the array has failed');
  } else if (failed > 0) {
    if (!/degraded/i.test(status || '')) errs.push('raid fidelity: ' + failed + ' failed drives within tolerance ' + meta.tolerance + ', keyed status "' + status + '" should be Degraded');
    if (!/hot-swap|rebuild/i.test(action || '')) errs.push('raid fidelity: keyed recoveryAction "' + action + '" should be hot-swap/rebuild when degraded');
  }
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): RAID capacity/tolerance/degrade fidelity validator"`

### Task 9: CSS — lift the `.faceplate*`/`.wm*`/`.slots*` token blocks into `dg-system.css`

**Files:**
- Modify: `dg-system.css` (append three scoped blocks; define EVERY token used)
- Modify: `index.html` (bump `dg-system.css?v=` — hand-bump the query ONLY; verify the exact current value first with `grep -ao "dg-system.css?v=[0-9.]*" index.html`)
- Modify: `CLAUDE.md` (ONE factual line under "CSS Theme System" — satisfies the pre-commit freshness check triggered by the `index.html` change)
- Test: none new — the existing ratchet guard (`grep "dg-system.css var() tokens all defined"`) enforces it.

**Interfaces:**
- Consumes: whatever tokens the ACTUAL mockups use — do not guess; grep each mockup's `<style>` block for `var(--` usages before writing the lifted CSS, and confirm each one resolves to a DEFINED token in `dg-system.css` (not a `KNOWN_GAPS` baseline), following the exact substitution precedent Wave 2 Task 7 established (`--ink`→`--text`, `--ink-soft`→`--text-mid`, `--muted`→`--text-dim`, etc. — check `dg-system.css` for the comment documenting this mapping and reuse it verbatim, do not re-derive).
- Produces: `.faceplate`, `.faceplate-head`, `.faceplate-grid`, `.port`, `.port-up`, `.port-down`, `.port-err-disabled`, `.port-poe-fault`, `.port-inert`; `.wiremap`, `.wiremap-grid`, `.wm-pin`, `.wm-pair-1..4`, `.wm-endb`; `.slots-diagram`, `.slot-bay`, `.slot-bay-label`, `.slot-notes`, `.slot-note`.

- [ ] **Step 1: Verify current state** — `grep -ao "dg-system.css?v=[0-9.]*" index.html` (record the current value); `node tests/uat.js` green. Grep each of the four Wave 3 mockups' `<style>` blocks for every `var(--x)` reference (`grep -o "var(--[a-z-]*)" mockups/switch-port-map-grid-concept.html mockups/cable-test-wiremap-concept.html mockups/pc-build-spec-off-concept.html mockups/raid-workbench-concept.html | sort -u`) and cross-check each against `dg-system.css`'s DEFINED tokens (not `KNOWN_GAPS`) — build the substitution list before writing anything.
- [ ] **Step 2: Append three blocks** to `dg-system.css`, lifting the mockups' actual class structure (`.portgrid`/`.port`, `.wm-*`, `.slots-diagram`) with the token substitution from Step 1 applied. Follow the exact comment-header format of the Wave 2 `.term*` block (`/* ── Sim Lab <name> (Wave 3) ── */`) and the Wave 2 mockup-lift precedent comment documenting the substitution mapping. Zero hardcoded hex; `color-mix()` allowed.
- [ ] **Step 3: Bump the CSS query** in `index.html` (increment the patch number by one from whatever Step 1 recorded).
- [ ] **Step 4: Freshness-gate path** — add ONE factual line under "CSS Theme System" in `CLAUDE.md` (e.g. `The Sim Lab faceplate/wiremap/slots (.faceplate*/.wm*/.slots*) tokens live in dg-system.css (Wave 3).`).
- [ ] **Step 5: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+0; ratchet guard passes silently). If it names a NEW missing token, DEFINE it — do NOT baseline it into `KNOWN_GAPS`.
- [ ] **Step 6: Commit** `git add dg-system.css index.html CLAUDE.md && git commit -m "style(sim-lab): faceplate/wiremap/slots token blocks in dg-system.css"`

### Task 10: Author + gate + integrate the Net+ Switch Port-Map Grid bank (10-12)

**Files:**
- Create (scratch, gitignored): `.superpowers/sdd/wave3/validate-drafts.js`, `.superpowers/sdd/wave3/portmap-drafts.js`
- Modify: `features/sim-lab-seed-netplus.js`
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: Task 1 tag, Task 5 validator, `_PORTMAP_FAULT_SIG`.
- Produces: 10-12 scenarios `archetype:'portmap'`, ids `np-pm-NN`, netplus bank.

- [ ] **Step 1: Create the draft-validation harness** at `.superpowers/sdd/wave3/validate-drafts.js` — same brace-extraction structure as Wave 2's harness (never reimplement validators, extract the REAL ones from `features/sim-lab.js`), extended to dispatch all four Wave 3 validators by archetype:
```js
'use strict';
var fs = require('fs'), vm = require('vm'), path = require('path');
var SRC = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'features', 'sim-lab.js'), 'utf8');
function extractFunction(src, name) {
  var m = new RegExp('function\\s+' + name + '\\s*\\(').exec(src);
  if (!m) throw new Error('missing fn ' + name);
  var i = src.indexOf('{', m.index), depth = 0, j = i;
  for (; j < src.length; j++) { var c = src[j];
    if (c === '{') depth++; else if (c === '}') { depth--; if (depth === 0) { j++; break; } } }
  return src.slice(m.index, j);
}
function extractVar(src, name) {
  var re = new RegExp('var\\s+' + name + '\\s*=\\s*(\\[[\\s\\S]*?\\]|\\{[\\s\\S]*?\\n\\s*\\});');
  var m = re.exec(src);
  if (!m) throw new Error('missing var ' + name);
  return m[0];
}
var pieces = [
  extractVar(SRC, 'STEP_TYPES'),
  extractFunction(SRC, '_isNonEmptyStr'), extractFunction(SRC, '_validateStepPayload'),
  extractFunction(SRC, 'simLabValidateScenario'),
  extractFunction(SRC, '_slFidelityResolveSlot'), extractFunction(SRC, '_slFidelityResolveSlotId'),
  extractVar(SRC, '_PORTMAP_FAULT_SIG'), extractFunction(SRC, 'simLabValidatePortMapFidelity'),
  extractVar(SRC, '_WIREMAP_FAULT_SIG'), extractVar(SRC, '_WM_EXPECTED_PAIR'), extractFunction(SRC, 'simLabValidateWiremapFidelity'),
  extractVar(SRC, '_PARTS_CATALOG'), extractFunction(SRC, 'simLabValidatePcBuildFidelity'),
  extractVar(SRC, '_RAID_LEVEL_META'), extractFunction(SRC, '_raidLevelKey'), extractFunction(SRC, 'simLabValidateRaidFidelity')
];
var sb = {}; vm.createContext(sb); vm.runInContext(pieces.join('\n\n') + '\n', sb);
var scenarios = require(path.resolve(process.argv[2]));
var fails = 0, ids = {};
scenarios.forEach(function (s, i) {
  var tag = (s && s.id) || ('#' + i);
  if (s && s.id) { if (ids[s.id]) { console.log('FAIL  ' + tag + '  DUPLICATE id'); fails++; } ids[s.id] = true; }
  var r = sb.simLabValidateScenario(s);
  if (!r.ok) { console.log('FAIL  ' + tag + '  scenario: ' + r.errors.join('; ')); fails++; }
  var f = null;
  if (s.archetype === 'portmap') f = sb.simLabValidatePortMapFidelity(s);
  else if (s.archetype === 'wiremap') f = sb.simLabValidateWiremapFidelity(s);
  else if (s.archetype === 'pcbuild') f = sb.simLabValidatePcBuildFidelity(s);
  else if (s.archetype === 'raid') f = sb.simLabValidateRaidFidelity(s);
  if (f && !f.ok) { console.log('FAIL  ' + tag + '  fidelity: ' + f.errors.join('; ')); fails++; }
  if ((!f || f.ok) && r.ok) console.log('pass  ' + tag);
});
console.log('\n' + (fails === 0 ? 'ALL DRAFTS VALID' : fails + ' FAILURE(S)') + '  (' + scenarios.length + ' scenarios)');
process.exit(fails === 0 ? 0 : 1);
```
This harness is reused unchanged for Tasks 11-13 — do not recreate it, only swap the drafts file path on the command line: `node .superpowers/sdd/wave3/validate-drafts.js <drafts-file.js>`.
- [ ] **Step 2: Author 10-12 drafts** in `portmap-drafts.js` (`module.exports = [...]`, house scenario shape mirroring existing netplus entries): each a `kind:'faceplate'` reference with 6-24 ports, a `portmapTickets` array, a `portmap.faultPort`, an `analyze` step (`mode:'facePorts'`, `multi:false`) targeting the fault port, and a `configure` diagnose step (`rootCause`/`fix`). Vary faults across BOTH `_PORTMAP_FAULT_SIG` keys (`poeOvercurrent`, `errDisabled`) with realistic device/topology diversity (don't clone the mockup's fixture; vary building type, device mix, and which specific port carries the fault). **Lesson from Wave 2's content gates, apply proactively:** no diagnostic-conclusion commentary embedded in port `label` text; keep the fault-signaling LED as the sole evidence source (no other port's data should double-signal the fault). Objectives: N10-009 2.4 (switching features) consistently across all scenarios in this bank (do not mix in 2.x sub-objectives per scenario — Wave 2 got dinged for inconsistent objective tagging within one archetype's bank). Run `node .superpowers/sdd/wave3/validate-drafts.js .superpowers/sdd/wave3/portmap-drafts.js` until `ALL DRAFTS VALID`.
- [ ] **Step 3: TWO-AGENT GATE per scenario** — Agent A (Net+ network engineer: VLAN/PoE assignments are realistic, the fault LED genuinely and uniquely signals the diagnosis, distractor ports are plausible-but-clean); Agent B (CompTIA N10-009 examiner: objective mapping, exam realism, keyed rootCause/fix are what CompTIA accepts). Revise-until-BOTH-approve.
- [ ] **Step 4: Integrate** — append approved scenarios into `window.SIM_LAB_SEED_NETPLUS` (before the closing `];`, matching file formatting). Byte-identity check: a Node script that `require()`s the drafts and deep-equality-checks each integrated scenario against its gated draft.
- [ ] **Step 5: Add the UAT bank test** — mirror the Wave 2 CLI-bank test block pattern: vm-populate `window.SIM_LAB_SEED_NETPLUS`, extract the real validators, filter `archetype === 'portmap'`, assert `count >= 10`, every scenario passes `simLabValidateScenario` AND `simLabValidatePortMapFidelity`, every `cert === 'netplus'`.
- [ ] **Step 6: Run** `node tests/uat.js` → `ALL PASS ✓`; `node tests/tech-debt.js` → clean.
- [ ] **Step 7: Commit** `git add features/sim-lab-seed-netplus.js tests/uat.js && git commit -m "content(sim-lab): Net+ Switch Port-Map Grid seed bank (2-agent gated)"`

### Task 11: Author + gate + integrate the Net+ Cable-Test Wiremap bank (10-12)

**Files:**
- Create (scratch): `.superpowers/sdd/wave3/wiremap-drafts.js`
- Modify: `features/sim-lab-seed-netplus.js`
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: harness from Task 10; Task 6 validator; `_WIREMAP_FAULT_SIG`, `_WM_EXPECTED_PAIR`.
- Produces: 10-12 scenarios `archetype:'wiremap'`, ids `np-cbl-NN`, netplus bank.

- [ ] **Step 1: Author 10-12 drafts** in `wiremap-drafts.js`: each an 8-pin `kind:'wiremap'` reference, exactly one fault class per scenario (vary across all four: `open`, `short`, `splitPair`, `reversedPair` — the mockup only exercises `splitPair`, this bank must cover the other three too), a `flag` analyze step (`mode:'wiremapPins'`, `multi:true`, DEFAULT scoring — no `scoring:'lenient'` flag, per the spec), a `configure` diagnose step (`faultType`/`fix`). Realistic client/technician ticket framing (residential/office cable-test scenarios). Objective: N10-009 5.2 (troubleshoot common cabling and physical interface issues) consistently. Run the harness until `ALL DRAFTS VALID`.
- [ ] **Step 2: TWO-AGENT GATE per scenario** — Agent A (Net+ network engineer: pin data is TIA/EIA-accurate, the fault is genuinely the sole anomaly, distractor pins are clean); Agent B (N10-009 examiner). Consensus required.
- [ ] **Step 3: Integrate** into `window.SIM_LAB_SEED_NETPLUS` (ids `np-cbl-NN`; byte-identity diff; no collision with `np-pm-*` or existing ids).
- [ ] **Step 4: UAT bank test** — filter `archetype === 'wiremap'`: `count >= 10`; every scenario passes `simLabValidateScenario` AND `simLabValidateWiremapFidelity`; plus a coverage cross-check that all four fault classes appear at least once across the bank:
```js
var wmScenarios = bank.filter(function (s) { return s.archetype === 'wiremap'; });
['open', 'short', 'splitPair', 'reversedPair'].forEach(function (ft) {
  test('wiremap bank covers fault type ' + ft, wmScenarios.some(function (s) { return s.wiremap && s.wiremap.fault === ft; }));
});
```
- [ ] **Step 5: Run** `node tests/uat.js` → `ALL PASS ✓`; tech-debt clean.
- [ ] **Step 6: Commit** `git add features/sim-lab-seed-netplus.js tests/uat.js && git commit -m "content(sim-lab): Net+ Cable-Test Wiremap seed bank (2-agent gated)"`

### Task 12: Author + gate + integrate the A+ Core 1 PC Build Spec-Off bank (10-12)

**Files:**
- Create (scratch): `.superpowers/sdd/wave3/pcbuild-drafts.js`
- Modify: `features/sim-lab-seed-aplus-core1.js`
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: harness; Task 7 validator; `_PARTS_CATALOG` (option ids MUST match this table exactly — see Task 7's warning).
- Produces: 10-12 scenarios `archetype:'pcbuild'`, ids `a1-pcb-NN`, aplus-core1 bank.

- [ ] **Step 1: Author 10-12 drafts** in `pcbuild-drafts.js`: each a `kind:'slots'` reference (rendered twice, once per client — mirror the mockup's structure), two `scn.pcbuild.clientA`/`clientB` fact blocks (`budgetUsd`/`caseMaxGpuLengthMm`/`minCpuTier`/`minGpuTier`), two `configure` steps (ids `clientA`/`clientB`, six slots each, option ids drawn ONLY from `_PARTS_CATALOG`). Vary client-pair combinations across scenarios (don't reuse Marlowe/Bellwood verbatim — new client names, new use-cases: gamer + student, streamer + accountant, etc.), keeping at least one genuinely wrong-but-plausible distractor option per slot per client. Objective: A+ 220-1201 3.4 (custom PC configurations) consistently. Run the harness until `ALL DRAFTS VALID`.
- [ ] **Step 2: TWO-AGENT GATE per scenario** — Agent A (PC-build technician: parts choices are realistic, distractors are genuinely plausible not strawmen, compatibility math checks out); Agent B (CompTIA 220-1201 examiner: A+ scope/terminology, not enterprise-workstation depth). Consensus required.
- [ ] **Step 3: Integrate** into `window.SIM_LAB_SEED_APLUS_CORE1` (ids `a1-pcb-NN`; byte-identity diff; no collision with existing `a1-soho-*`/`a1-cot-*` ids).
- [ ] **Step 4: UAT bank test** — vm-populate `window.SIM_LAB_SEED_APLUS_CORE1`, extract `_PARTS_CATALOG` alongside the other validators (same harness pattern), filter `archetype === 'pcbuild'`: `count >= 10`, every scenario passes `simLabValidateScenario` AND `simLabValidatePcBuildFidelity`, every `cert === 'aplus-core1'`, plus a cross-check that EVERY option id across both clients' slots (not just the keyed-correct ones — every distractor too) resolves in `_PARTS_CATALOG` (catches a typo'd part id on a distractor option, which the fidelity validator alone would never exercise since it only ever looks at the KEYED option):
```js
var PARTS_CATALOG_KEYS = Object.keys(PARTS_CATALOG); // extracted the same way as the validator itself
bank.filter(function (s) { return s.archetype === 'pcbuild'; }).forEach(function (s) {
  ['clientA', 'clientB'].forEach(function (ck) {
    var cfg = s.steps.filter(function (st) { return st.id === ck; })[0];
    var allKnown = cfg.payload.slots.every(function (sl) {
      return sl.options.every(function (o) { return PARTS_CATALOG_KEYS.indexOf(o.id) !== -1; });
    });
    test('pcbuild ' + s.id + ' ' + ck + ': every slot option id (incl. distractors) resolves in the shared catalog', allKnown);
  });
});
```
- [ ] **Step 5: Run** `node tests/uat.js` → `ALL PASS ✓`; tech-debt clean.
- [ ] **Step 6: Commit** `git add features/sim-lab-seed-aplus-core1.js tests/uat.js && git commit -m "content(sim-lab): A+ Core 1 Two-Client PC Build Spec-Off seed bank (2-agent gated)"`

### Task 13: Author + gate + integrate the A+ Core 1 RAID Workbench bank (10-12)

**Files:**
- Create (scratch): `.superpowers/sdd/wave3/raid-drafts.js`
- Modify: `features/sim-lab-seed-aplus-core1.js`
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: harness; Task 8 validator; `_RAID_LEVEL_META`.
- Produces: 10-12 scenarios `archetype:'raid'`, ids `a1-raid-NN`, aplus-core1 bank.

- [ ] **Step 1: Author 10-12 drafts** in `raid-drafts.js`: each a `kind:'slots'` reference (drive bays), a `scn.raid` fact block (`targetUsableTb`/`targetTolerance`/`failedDriveCount`), a `build` configure step (`level`/`driveCount`/`driveSize`) keyed to the MINIMAL-drive combination clearing both targets (per Task 8's minimal-cost check — hand-verify the RAID math before locking in each scenario's keyed answer, this is the step most likely to fail the validator on a careless first pass), a `degrade` configure step (`arrayStatus`/`recoveryAction`) keyed against `failedDriveCount` vs. the built level's real tolerance. Vary across all 5 RAID levels (0/1/5/6/10) and vary failed-drive-count scenarios to cover all three degrade outcomes (`failedDriveCount:0` → fully redundant no-action-needed if any scenario wants that framing, `failedDriveCount` within tolerance → degraded/rebuild, `failedDriveCount` past tolerance → failed/restore). Objective: A+ 220-1201 3.4 (RAID levels and storage arrays) consistently. Run the harness until `ALL DRAFTS VALID`.
- [ ] **Step 2: TWO-AGENT GATE per scenario** — Agent A (storage/systems technician: capacity math is genuinely correct by hand, the minimal-drive framing is realistic, degrade logic is textbook-accurate); Agent B (CompTIA 220-1201 examiner). Consensus required.
- [ ] **Step 3: Integrate** into `window.SIM_LAB_SEED_APLUS_CORE1` (ids `a1-raid-NN`; byte-identity diff; no collision with existing ids).
- [ ] **Step 4: UAT bank test** — filter `archetype === 'raid'`: `count >= 10`; every scenario passes `simLabValidateScenario` AND `simLabValidateRaidFidelity`; every `cert === 'aplus-core1'`; plus a coverage cross-check that all 5 RAID levels appear at least once:
```js
var raidScenarios = bank.filter(function (s) { return s.archetype === 'raid'; });
['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10'].forEach(function (lvl) {
  test('raid bank covers ' + lvl, raidScenarios.some(function (s) {
    var cfg = s.steps.filter(function (st) { return st.id === 'build'; })[0];
    var keyedText = cfg.payload.slots.filter(function (sl) { return sl.id === 'level'; })[0].options
      .filter(function (o) { return o.id === cfg.answer.slots.level; })[0].text;
    return keyedText.indexOf(lvl) !== -1;
  }));
});
```
- [ ] **Step 5: Run** `node tests/uat.js` → `ALL PASS ✓`; tech-debt clean.
- [ ] **Step 6: Commit** `git add features/sim-lab-seed-aplus-core1.js tests/uat.js && git commit -m "content(sim-lab): A+ Core 1 RAID Workbench seed bank (2-agent gated)"`

### Task 14: Vertical-slice mount + score tests (one per archetype)

**Files:**
- Test: `tests/uat.js` only (mirror the Wave 2 Task 11 pattern: vm sandbox + DOM shim + real bank scenarios + `window.__slActiveSubmit`/`simLabScoreScenario`). Reuse the extended DOM shim (`classList`/`removeAttribute`/`_fire`) from Tasks 2-4's tests.

**Interfaces:**
- Consumes: real bank scenarios from Tasks 10-13, `_slMountScenario`, `simLabScoreScenario`, all three new renderers, both new analyze modes.
- Produces: proof the four archetypes render + score through the existing Practice path with zero wiring changes beyond Tasks 2-3's published-handle mechanism.

- [ ] **Step 1: Write the tests** — for each of: first `archetype==='portmap'` (netplus), first `archetype==='wiremap'` (netplus), first `archetype==='pcbuild'` (aplus-core1), first `archetype==='raid'` (aplus-core1): mount via `_slMountScenario(host, scn, {onSubmit})`, matching its real signature exactly (check `features/sim-lab.js` directly, do not assume). Assert:
  - **(a)** the mounted node contains the correct reference class (`.faceplate`/`.wiremap`/`.slots-diagram`) and any required `<select>`s.
  - **(b) Port-Map reveal-independent click path:** fire a real `.port` button click (spy-wrap `window.__slFaceplatePanel`'s bound handler is exercised, not stubbed), then a fully-correct run scores `correct === total`.
  - **(c) Wiremap exact-set path:** flag exactly the keyed fault pin(s) via real `.wm-pin` clicks, confirm `correct === total`; then a mutated run flagging ONE WRONG extra pin must score `correct < total` (exact-set, unlike the CLI/triage lenient modes — this is the one archetype in the whole program where a false pick DOES cost credit, worth a dedicated assertion since it's the odd one out).
  - **(d) PC-Build independent-clients path:** fill Client A correctly and Client B with one deliberate wrong pick; assert the COMBINED score is `< total` but Client A's own per-client tally is full credit (proves the "neither ticket rescues the other" contract is real, not just visual).
  - **(e) RAID build→degrade path:** correct build, correct degrade, `correct === total`; a negative control with a wrong `recoveryAction` scores `correct < total`.
  Extract the full renderer/score/mount chain into the vm sandbox for each test (check `_slMountScenario`'s actual body for its complete real dependency list — do not assume it matches Wave 2's list verbatim, Wave 3 added three renderers and two modes to what it calls). No hardcoded global test-count literals.
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: `ALL PASS ✓`. If any archetype fails to mount/score, that is a REAL wiring gap: STOP, diagnose via `node scripts/graphq.js callers _slMountScenario` (or manual trace if graphify tooling isn't available), fix MINIMALLY respecting scope (only Task 2/3's published-handle wiring is in scope to touch here — if the gap looks like it needs a new renderer or new binding direction, that contradicts the locked spec, STOP and escalate instead of improvising).
- [ ] **Step 3: Commit** `git add tests/uat.js && git commit -m "test(sim-lab): Wave 3 archetype vertical slices through Practice path"`

### Task 15: Live browser verification (all four archetypes)

**Files:** none expected (fixes only if found)

- [ ] **Step 1:** Serve locally (`preview_start certanvil-local` → localhost:3140; unregister the SW + clear caches + navigate with `?_cb=<version>`). 🚨 NEVER write user-state localStorage on prod/`*.vercel.app` hosts.
- [ ] **Step 2:** Force the netplus bank to one `portmap` scenario (localhost only: save + swap `window.SIM_LAB_SEED_NETPLUS`), run a full Practice round via real clicks: faceplate renders, port-click opens the assignment card, provisioning locks in, the fault LED appears on exactly the keyed port, diagnose scores correctly. Repeat for a `wiremap` scenario (pair-colored pins, flag-then-diagnose, exact-set scoring visibly penalizes a wrong extra pick — confirm this live, it's the one archetype where over-selecting costs credit). Switch cert to A+ Core 1 and repeat for a `pcbuild` scenario (both clients' illustrative bay panels render as clearly non-interactive, both builds gradable independently) and a `raid` scenario (live capacity/tolerance readout updates as selects change, build→degrade phase transition, bay-fill visualization).
- [ ] **Step 3:** Check COMPUTED styles, not just DOM: no black fills, faceplate LED colors resolve to the correct tokens, wiremap pair colors are visually distinct from each other AND from the accent/pass/fail tokens (the design spec's deliberate hue-separation decision), slots-diagram panels have zero pointer cursor/hover affordance (confirming the "non-interactive" contract reads correctly, not just functions correctly). **375px containment**: faceplate port grid reflows without page-level horizontal scroll, wiremap's 8-pin grid does the same. Reduced-motion: no port-grid cross-fade or bay-fill stagger animation under `prefers-reduced-motion: reduce`.
- [ ] **Step 4:** Preview screenshot races paint — wait for paint (rAF/settle) before asserting computed styles or screenshotting after any reveal/click interaction. Zero console errors across all four. Any defect: fix, re-run UAT, commit `fix(sim-lab): <what> (wave-3 live verify)`.
- [ ] **Step 5:** `npm run test:ios` (webkit + mobile-safari Playwright) → all pass. No commit if clean.

### Task 16: Final review + ship v7.64.0

- [ ] **Step 1:** Final whole-branch review per superpowers:subagent-driven-development (review package from `git merge-base main HEAD`; reviewers do NOT `git stash`); fix Critical/Important findings. Confirm each of the four fidelity validators is NON-vacuous (mutation-check: each rejects a deliberately corrupted port/pin/part/drive — already encoded in Tasks 5-8's negative tests, re-verify by reasoning through the logic).
- [ ] **Step 2:** Full gates: `node tests/uat.js` && `node tests/tech-debt.js` && `npx playwright test`.
- [ ] **Step 3:** `node scripts/bump-version.js 7.64.0 "Sim Lab Wave 3 PBQs: Switch Port-Map Grid, Cable-Test Wiremap, PC Build Spec-Off, RAID Workbench"` — then RE-READ `CLAUDE.md` fresh (the script rewrites it), keep the Version History table at the last-3 one-line rows (port the displaced row to `CHANGELOG.md`), and reconcile the Task-9 `dg-system.css?v=` hand-bump with whatever the script writes (the script does NOT touch the CSS query — leave your hand-bumped value).
- [ ] **Step 4:** superpowers:finishing-a-development-branch → push branch → PR to `main` (fast lane; PR for review given size) → CI green → merge → confirm prod serves 7.64.0 (asset check + Deploy Verification workflow) → **live prod verify** (drive the four archetypes on the prod URL with `?_cb=`, computed styles + 375px containment) → capture a `#decision` note if the ship embodied one (candidate: the `facePorts`/`wiremapPins` mode extension proving Wave 2's guarded-analyze-mode mechanism generalizes cleanly to non-terminal reference kinds, and the `slots` renderer's deliberate no-second-binding-direction scope discipline).

---

## Notes
- **Task arc:** Tasks 1-4 are the shared spine (tags → three renderers + two analyze modes) and MUST land in order — Task 2's mode-branch scaffolding is extended by Task 3, not rewritten. Tasks 5-8 are the four validators (independent of each other, depend only on Task 1's tag for the scenario shell). Task 9 is CSS. Tasks 10-13 are the bulk (authoring + gating), each depending on its validator + the spine. Task 14 depends on 10-13. Tasks 15-16 close out. Execute in order.
- **Only genuinely new UI:** Tasks 2-4 (the three renderers) + the two mode-branch extensions inside them. Everything else reuses shipped engine surface (`configure` steps, `_scoreConfigureSlots`, the exact-set/lenient scoring dispatch). If any task tempts a FOURTH new reference kind, a second binding direction for `slots`, or a new step-type: that is out of Wave 3 scope by spec — STOP and escalate rather than build it.
- **The `slots` no-interaction discipline is the wave's one deliberate scope-narrowing decision** (vs. Wave 2, where every new reference kind was interactive) — do not "improve" it mid-implementation by adding a click handler; that decision was made explicitly to keep this wave to ONE new binding pattern (`facePorts`/`wiremapPins`, both riding the Wave 2 `payload.mode` mechanism) instead of two.
- **RAID math is the highest-arithmetic-density task in the wave** (Task 8 + Task 13) — every content scenario's keyed build must be hand-verified against the real capacity/tolerance formulas before the two-agent gate, not just validator-passed; the validator's minimal-cost check will catch a wasteful-but-valid build, but won't catch a subtly-wrong hand-authored formula bug baked into BOTH the scenario data and a careless validator assumption at the same time (the sibling review pass in Task 16 should specifically re-derive at least 2-3 RAID scenarios' math by hand as a sanity check).
- **Carried-forward gotchas (verbatim from Waves 1-2):** binary-misdetect → always `grep -a` or a Python/Node script against `sim-lab.js`; reviewers don't `git stash`; implementers work THEMSELVES; integrators use byte-identity diffs; `test()` global vs block-local `assert` — mirror the surrounding block; pre-commit CLAUDE.md-freshness gate fires on `index.html` changes (Task 9 handles it with one factual line); every `analyze` step declares `multi` explicitly; render is escape-then-highlight, never raw `innerHTML` of scenario text; test-extraction regexes for `var X = {...}` tables MUST use flexible whitespace (`\n\s*\};`) before the closing brace, never an exact-space assumption (this exact bug shipped once and was caught in code review in Wave 2 Task 6 — do not reintroduce it in Tasks 5-8's test harnesses above, they are already written with the flexible form, keep it that way).
- **Single-source-of-truth invariant (carried from Wave 2, extended):** selectable element data (port LED state, wiremap pin connections, parts catalog prices/watts/tiers) lives ONLY in the reference/catalog data; the KEYED true set lives in `answer.selected`/`answer.slots`; each fidelity validator cross-checks the two agree. This is why the `facePorts`/`wiremapPins` analyze steps carry no local `payload.lines` (same as Wave 2's `excerptLines`) and why `_PARTS_CATALOG` is a single shared table, not duplicated per scenario — keep it intact or the cross-checks go vacuous.
