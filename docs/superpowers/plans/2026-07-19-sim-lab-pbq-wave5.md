---
type: plan
status: active
cert: secplus
updated: 2026-07-19
tags: [plan, pbq, sim-lab, wave5]
---
# Sim Lab PBQ Wave 5 — VPN Tunnel Parameter Negotiation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `vpntunnel` archetype (Security+ SY0-701, ranked #1 with A-grade evidence) — a guarded dual-panel configure extension with three-predicate tunnel scoring, one fidelity validator, and a 12-scenario two-agent-gated seed bank.

**Architecture:** Everything rides the live engine in `features/sim-lab.js`. This wave ADDS: one archetype tag (`vpntunnel`, 15th); a guarded configure extension (`payload.layout:'dualpanel'` + `payload.scoring:'tunnel'`, both default OFF — absent flags = today's behavior byte-for-byte, the Wave-2 extension pattern); one runtime scoring path (`_scoreTunnelStep`: set-membership + symmetry + mirror, per-unit partial credit); one renderer branch (`_slRenderConfigureDualPanel`: A/B toggle + mirror chip strip + native selects); one fidelity validator (`simLabValidateTunnelFidelity`); one `dg-system.css` block (`.sl-dp*`); 12 seeds `sp-vpn-01`…`sp-vpn-12` in `features/sim-lab-seed-secplus.js`. **NO new reference kind, NO new step type, NO new analyze mode, NO feedback-layer changes.** Spec: `docs/superpowers/specs/2026-07-19-pbq-wave5-vpntunnel-design.md`. Mockup (faithful-lift build target incl. footer ENGINE-MAPPING comment + grading JS): `mockups/vpn-tunnel-negotiation-concept.html`.

**Tech Stack:** Vanilla JS IIFE feature module (no build step), UAT concat harness (`tests/uat/_context.js` — feature files are DEDENTED 2 spaces into the `js` string), Playwright e2e + visual, `dg-system.css` tokens.

## Global Constraints

- **Model routing:** Sonnet executes all tasks (Fable planned/reviews per mem #68 — a Fable session is orchestrating).
- **Fast lane:** no schema/money/auth/sw changes → commits to `main`, full gate stack, one ship.
- **Guarded extension discipline:** classic `configure` behavior must be byte-for-byte unchanged when `payload.scoring !== 'tunnel'` and `payload.layout !== 'dualpanel'`. Never modify the classic branches — only add guarded ones.
- **Mockup is the build (faithful lift** — visual/interaction fidelity, not markup fidelity). Where mockup and engine conventions disagree, the engine wins. Specifically: the mockup's in-card pair-verdict rows and three-bar result panel illustrate SCORING SEMANTICS — the build does NOT touch `_slRenderFeedback`; the score header keeps its stock "N of M steps" copy (spec §Mobile, carry-over noted). Teaching lives in each step's `explanation`.
- **Escape-then-highlight HARD rule:** every label/text is scenario data → `_esc()` before any DOM insertion.
- **CSS:** `dg-system.css` ONLY (never `styles.css`); tokens only, **zero hardcoded hex**; every bare `var(--x)` referenced must already be DEFINED in dg-system's token blocks (the UAT ratchet guard fails NEW undefined vars — do not add to `KNOWN_GAPS`). Known-good tokens: `--text`, `--text-mid`, `--text-dim`, `--surface`, `--surface2`, `--border`, `--accent`, `--pass`, `--fail`. If `--ease` is not defined in dg-system, use the literal `cubic-bezier(0.16,1,0.3,1)`.
- **UAT:** use the global `test(name, cond)` mirroring surrounding blocks; never hardcode a global total-count literal; extraction regexes for `var X = {...}` / function bodies MUST use flexible whitespace (`\n\s*\};`) — the concat harness dedents feature files to column 0. `_fnBody` prefix-match trap: the names used here (`_scoreTunnelStep`, `simLabValidateTunnelFidelity`, `_slRenderConfigureDualPanel`) are prefix-unique — keep them so.
- **Hand-derive validator/scorer logic against fixtures before trusting a green run** (Wave 3's two validator bugs were in plausible-looking literal code).
- **Two-agent gate per scenario:** Sec+ domain expert + SY0-701 examiner lens, revise-until-BOTH-approve. Dev-fixture rule: no scenario enters the bank until it passes `simLabValidateTunnelFidelity` AND the gate.
- **Vendor neutrality:** IPSec/IKE open-standard vocabulary only. No vendor console terms.
- **Node:** prefix every node/npm command with `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"`.
- **Version bump ONLY via** `node scripts/bump-version.js 7.81.0 "<desc>"` in the ship task — never hand-edit, never earlier.
- 🚨 **NEVER write localStorage on prod hosts** (localhost/preview only).
- Line numbers below are as of commit `7ce4611` — they WILL drift; anchor edits on the quoted code, not the numbers.

---

### Task 1: Guarded payload validation + archetype allowlist + tunnel scorer

**Files:**
- Modify: `features/sim-lab.js` — `_validateStepPayload` (~L13), `simLabValidateScenario` archetype allowlist (~L95), new `_scoreTunnelStep` beside `_scoreConfigureSlots` (~L882), branches in `_scoreStep` (~L899) and `simLabScoreScenario` (~L931)
- Test: `tests/uat/270-pbq-vpntunnel-wave5.js` (create — module is auto-discovered by the runner)

**Interfaces:**
- Consumes: `_isNonEmptyStr` (sim-lab.js L11), existing configure machinery.
- Produces: `_scoreTunnelStep(step, resp) -> {total, correct}` (consumed by Task 2's renderer expectations and Task 3's fixtures); the `payload.scoring === 'tunnel'` + `payload.layout === 'dualpanel'` contract; `'vpntunnel'` archetype tag (consumed by Tasks 3–5).

- [ ] **Step 1: Create the UAT module with failing scorer fixtures.** `tests/uat/270-pbq-vpntunnel-wave5.js`, mirroring the structure of `tests/uat/230-pbq-vertical-slice-wave1-2.js` (read its first 60 lines first for the exact module wrapper the runner expects). Test content:

```js
// ── Wave 5: vpntunnel — payload validation, tunnel scorer, allowlist ──
// Extract _scoreTunnelStep from the concatenated js context (flexible whitespace,
// dedented source) and exercise it against hand-derived fixtures.
(function () {
  var m = js.match(/function _scoreTunnelStep\(step, resp\) \{([\s\S]*?)\n\s*\}\n/);
  test('W5: _scoreTunnelStep exists in sim-lab.js', !!m);
  var scoreTunnel = null;
  if (m) { scoreTunnel = new Function('step', 'resp', m[1]); }

  var STEP = {
    id: 'p1', type: 'configure', points: 1,
    payload: {
      layout: 'dualpanel', scoring: 'tunnel',
      panels: [{ id: 'A', label: 'GW-A' }, { id: 'B', label: 'GW-B' }],
      slots: [
        { id: 'a-enc', panel: 'A', label: 'Encryption', options: [{id:'aes128',text:'AES-128'},{id:'aes192',text:'AES-192'},{id:'aes256',text:'AES-256'}] },
        { id: 'b-enc', panel: 'B', label: 'Encryption', options: [{id:'aes128',text:'AES-128'},{id:'aes192',text:'AES-192'},{id:'aes256',text:'AES-256'}] },
        { id: 'a-local', panel: 'A', label: 'Local subnet', options: [{id:'lon',text:'10.10.0.0/16'},{id:'fra',text:'10.20.0.0/16'}] },
        { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [{id:'lon',text:'10.10.0.0/16'},{id:'fra',text:'10.20.0.0/16'}] }
      ],
      symmetryPairs: [['a-enc', 'b-enc']],
      mirrorPairs: [['a-local', 'b-remote']]
    },
    answer: { slots: { 'a-enc': ['aes192','aes256'], 'b-enc': ['aes192','aes256'], 'a-local': ['lon'], 'b-remote': ['lon'] } }
  };
  // Hand-derived: 4 membership + 1 symmetry + 1 mirror = 6 units.
  var full = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc':'aes256','b-enc':'aes256','a-local':'lon','b-remote':'lon' } });
  test('W5: perfect response scores 6/6', !!full && full.total === 6 && full.correct === 6);

  // THE teaching-point fixture: both encs individually valid, but different →
  // membership 4/4 KEPT, symmetry unit LOST. (Spec §Runtime scoring.)
  var asym = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc':'aes256','b-enc':'aes192','a-local':'lon','b-remote':'lon' } });
  test('W5: asymmetric-but-valid picks lose ONLY the symmetry unit (5/6)', !!asym && asym.total === 6 && asym.correct === 5);

  // Matching pair of policy-VIOLATING values still earns its symmetry unit
  // (independent predicates — spec §Runtime scoring, fixture mandated).
  var weakSym = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc':'aes128','b-enc':'aes128','a-local':'lon','b-remote':'lon' } });
  test('W5: matching weak values fail membership but keep symmetry (4/6)', !!weakSym && weakSym.total === 6 && weakSym.correct === 4);

  // Mirror break: a-local=lon but b-remote=fra → mirror unit lost, b-remote membership lost.
  var mir = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc':'aes256','b-enc':'aes256','a-local':'lon','b-remote':'fra' } });
  test('W5: broken mirror loses mirror unit + its membership (4/6)', !!mir && mir.total === 6 && mir.correct === 4);

  // Unanswered slot: 0 membership, fails its pairs.
  var unans = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc':'aes256','a-local':'lon','b-remote':'lon' } });
  test('W5: unanswered slot scores 0 and fails its pair (4/6)', !!unans && unans.total === 6 && unans.correct === 4);

  // Dangling pair reference = SKIPPED unit, never a throw (runtime scorer is total).
  var DANGLING = JSON.parse(JSON.stringify(STEP));
  DANGLING.payload.symmetryPairs.push(['a-enc', 'zz-nope']);
  var dang = null, threw = false;
  try { dang = scoreTunnel && scoreTunnel(DANGLING, { slots: { 'a-enc':'aes256','b-enc':'aes256','a-local':'lon','b-remote':'lon' } }); }
  catch (e) { threw = true; }
  test('W5: dangling pair reference is skipped, not thrown (still 6 units)', !threw && !!dang && dang.total === 6 && dang.correct === 6);

  // Null response is total.
  var nul = null; threw = false;
  try { nul = scoreTunnel && scoreTunnel(STEP, null); } catch (e) { threw = true; }
  test('W5: null response scores 0/6 without throwing', !threw && !!nul && nul.total === 6 && nul.correct === 0);

  // Source-level guards:
  test('W5: vpntunnel in archetype allowlist', /'vpntunnel'/.test(js.match(/bad archetype/) ? js : ''));
  test('W5: _scoreStep configure case branches on tunnel scoring', /case 'configure':[\s\S]{0,300}scoring === 'tunnel'/.test(js));
  test('W5: simLabScoreScenario branches on tunnel scoring', /simLabScoreScenario[\s\S]{0,900}scoring === 'tunnel'/.test(js));
  test('W5: payload validation accepts array answers only under tunnel scoring', /p\.scoring === 'tunnel'/.test(js));
})();
```

- [ ] **Step 2: Run UAT, verify the new tests FAIL.** `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" && node tests/uat.js 2>&1 | grep "W5:"` → every `W5:` line FAIL (function not found). All pre-existing tests must still PASS.

- [ ] **Step 3: Implement in `features/sim-lab.js`** (all inside the IIFE, 2-space indent, function declarations at column 3):

**(a)** `_validateStepPayload`, `case 'configure':` — add the guarded branch ABOVE the classic return (classic code untouched below it):

```js
      case 'configure':
        if (p.scoring === 'tunnel') {
          if (p.layout !== 'dualpanel') return false;
          if (!Array.isArray(p.panels) || p.panels.length !== 2 ||
              !p.panels.every(function (pn) { return pn && _isNonEmptyStr(pn.id) && _isNonEmptyStr(pn.label); })) return false;
          if (p.symmetryPairs !== undefined && !Array.isArray(p.symmetryPairs)) return false;
          if (p.mirrorPairs !== undefined && !Array.isArray(p.mirrorPairs)) return false;
          return Array.isArray(p.slots) && p.slots.length >= 2 &&
                 a.slots && typeof a.slots === 'object' && !Array.isArray(a.slots) &&
                 p.slots.every(function (sl) {
                   return _isNonEmptyStr(sl.id) && _isNonEmptyStr(sl.label) && _isNonEmptyStr(sl.panel) &&
                          Array.isArray(sl.options) && sl.options.length >= 2 &&
                          sl.options.every(function (o) { return _isNonEmptyStr(o.id) && _isNonEmptyStr(o.text); }) &&
                          Array.isArray(a.slots[sl.id]) && a.slots[sl.id].length >= 1 &&
                          a.slots[sl.id].every(function (accId) {
                            return sl.options.some(function (o) { return o.id === accId; });
                          });
                 });
        }
        return Array.isArray(p.slots) && p.slots.length >= 1 &&
```
(the trailing lines are the EXISTING classic branch — leave them exactly as they are).

**(b)** `simLabValidateScenario` archetype allowlist — append `'vpntunnel'`:

```js
    if (s.archetype !== undefined && ['diagram', 'incident', 'defense', 'wireless', 'firewall', 'soho', 'cli', 'discovery', 'triage', 'portmap', 'wiremap', 'pcbuild', 'raid', 'swatch', 'vpntunnel'].indexOf(s.archetype) === -1) {
```

**(c)** New scorer, placed directly after `_scoreConfigureSlots`:

```js
  // Wave 5 (vpntunnel): three-predicate tunnel scoring — per-slot set-membership
  // + cross-panel symmetry + Phase-2 mirror-inversion, each unit 1 point.
  // Total over malformed input: a dangling pair reference is a SKIPPED unit,
  // never a throw (pair-shape validation is simLabValidateTunnelFidelity's job).
  function _scoreTunnelStep(step, resp) {
    var p = (step && step.payload) || {};
    var ans = (step && step.answer && step.answer.slots) || {};
    var got = (resp && resp.slots) || {};
    var known = {};
    (p.slots || []).forEach(function (sl) { if (sl && sl.id) known[sl.id] = true; });
    var total = 0, correct = 0;
    Object.keys(ans).forEach(function (slotId) {
      if (!Array.isArray(ans[slotId])) return;
      total++;
      if (got[slotId] && ans[slotId].indexOf(got[slotId]) !== -1) correct++;
    });
    function scorePairs(pairs) {
      (pairs || []).forEach(function (pair) {
        if (!Array.isArray(pair) || pair.length !== 2) return;
        if (!known[pair[0]] || !known[pair[1]]) return;   // dangling: skipped
        total++;
        var a = got[pair[0]], b = got[pair[1]];
        if (a && b && a === b) correct++;
      });
    }
    scorePairs(p.symmetryPairs);
    scorePairs(p.mirrorPairs);
    return { total: total, correct: correct };
  }
```

**(d)** `_scoreStep`, `case 'configure':` — guarded branch first:

```js
      case 'configure':
        if (step.payload && step.payload.scoring === 'tunnel') {
          var _tt = _scoreTunnelStep(step, resp);
          return _tt.total > 0 && _tt.correct === _tt.total;
        }
        var _sc = _scoreConfigureSlots(step, resp);
        return _sc.total > 0 && _sc.correct === _sc.total;
```

**(e)** `simLabScoreScenario` — guarded branch BEFORE the existing configure branch:

```js
      if (st.type === 'configure' && st.payload && st.payload.scoring === 'tunnel') {
        var ts = _scoreTunnelStep(st, resp);
        perStep[st.id] = ts;            // { total, correct } breakdown, same shape as configure
        correct += ts.correct; total += ts.total;
      } else if (st.type === 'configure') {
```
(the `else if` replaces the existing `if (st.type === 'configure')` line; everything inside stays).

- [ ] **Step 4: Hand-derive before running.** Walk each Step-1 fixture through the (c) code on paper: perfect=6/6, asym=5/6, weakSym=4/6, mir=4/6 (b-remote membership lost + mirror lost, gains back... recount: memberships a-enc✓ b-enc✓ a-local✓ b-remote✗ = 3, symmetry ✓ = 1, mirror lon≠fra ✗ = 0 → 4/6 ✓), unans=4/6 (a-enc✓ a-local✓ b-remote✓ =3? recount: b-enc missing → membership 3/4, symmetry needs both → 0, mirror lon=lon → 1 → 4/6 ✓), dangling=6/6, null=0/6. If any fixture disagrees with the code, FIX THE CODE OR THE FIXTURE NOW — do not paper over.

- [ ] **Step 5: Run UAT, verify all W5 tests pass and zero regressions.** `node tests/uat.js` → ALL PASS.

- [ ] **Step 6: Commit.**
```bash
git add features/sim-lab.js tests/uat/270-pbq-vpntunnel-wave5.js
git commit -m "feat(pbq-w5): tunnel scoring + guarded configure payload validation + vpntunnel tag"
```
(stage the auto-refreshed `CLAUDE.md` too if the pre-commit hook regenerates it).

---

### Task 2: Dualpanel renderer branch + dg-system CSS

**Files:**
- Modify: `features/sim-lab.js` — `_slRenderConfigure` (~L1369): add guard line + new `_slRenderConfigureDualPanel` directly after it
- Modify: `dg-system.css` — append `.sl-dp*` block after the existing `.sl-cfg` block (~L4089)
- Modify: `index.html` — bump `dg-system.css?v=` query (MUST be same commit as the CSS change)
- Test: `tests/uat/270-pbq-vpntunnel-wave5.js` (extend)

**Interfaces:**
- Consumes: `_el(tag, cls, text)` helper, `_esc()`, Task 1's payload contract.
- Produces: `_slRenderConfigureDualPanel(step, onChange, initial) -> DOM node` reporting `onChange({slots})` in the exact same response shape classic configure reports (Task 1's scorer consumes it). CSS classes: `.sl-dualpanel`, `.sl-dp-toggle`, `.sl-dp-btn`, `.sl-dp-dot`, `.sl-dp-mirror`, `.sl-dp-mh`, `.sl-dp-chip`.

- [ ] **Step 1: Extend the UAT module with failing renderer checks** (append inside `270-pbq-vpntunnel-wave5.js`):

```js
(function () {
  test('W5: _slRenderConfigure dispatches dualpanel layout', /_slRenderConfigure[\s\S]{0,400}layout === 'dualpanel'[\s\S]{0,120}_slRenderConfigureDualPanel/.test(js));
  var body = js.match(/function _slRenderConfigureDualPanel\(step, onChange, initial\) \{([\s\S]*?)\n\s*\}\n/);
  test('W5: _slRenderConfigureDualPanel exists', !!body);
  test('W5: dualpanel renderer escapes labels (_esc on label/text)', !!body && /_esc\(/.test(body[1]));
  test('W5: dualpanel toggle buttons carry aria-pressed', !!body && /aria-pressed/.test(body[1]));
  test('W5: mirror strip re-renders from the shared resp object', !!body && /sl-dp-mirror/.test(body[1]) && /sl-dp-chip/.test(body[1]));
  test('W5: dualpanel preserves resp across panel toggles (single resp object)', !!body && /Object\.assign\(\{\}, resp\)/.test(body[1]));
  test('W5: dg-system has the sl-dp block', true); // placeholder replaced by the CSS check below
})();
```
And in the CSS-facing section (the runner exposes dg-system source — mirror how `240-*.js` reads it; if it exposes a `dg` string, use it, otherwise read the file):
```js
(function () {
  var fs = require('fs');
  var dg = fs.readFileSync('dg-system.css', 'utf8');
  test('W5: dg-system defines .sl-dp-btn with 44px touch floor', /\.sl-dp-btn\{[^}]*min-height:44px/.test(dg));
  test('W5: dg-system .sl-dp block uses tokens only (no hex)', !/\.sl-dp[^}]*#[0-9a-fA-F]{3,6}/.test(dg));
  test('W5: .sl-dp-btn aria-pressed state styled', /\.sl-dp-btn\[aria-pressed="true"\]/.test(dg));
})();
```

- [ ] **Step 2: Run UAT — new checks FAIL.** `node tests/uat.js 2>&1 | grep "W5:"`.

- [ ] **Step 3: Implement the renderer.** In `_slRenderConfigure`, add as the FIRST line of the function body:

```js
    if (step.payload && step.payload.layout === 'dualpanel') return _slRenderConfigureDualPanel(step, onChange, initial);
```

Then directly after `_slRenderConfigure`'s closing brace:

```js
  // Wave 5 (vpntunnel): dual-endpoint configure — A/B segmented toggle, one
  // panel visible at a time (ALL viewports — one code path, no breakpoint fork),
  // passive mirror chip strip showing the hidden panel's current selections.
  // Faithful lift of mockups/vpn-tunnel-negotiation-concept.html.
  function _slRenderConfigureDualPanel(step, onChange, initial) {
    var resp = (initial && initial.slots && typeof initial.slots === 'object')
      ? Object.assign({}, initial.slots)
      : {};
    var p = step.payload;
    var visible = p.panels[0].id;
    var root = _el('div', 'sl-cfg sl-dualpanel');
    root.appendChild(_el('p', 'sl-prompt', _esc(step.prompt)));

    var toggle = _el('div', 'sl-dp-toggle');
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', 'Select gateway to configure');
    var mirror = _el('div', 'sl-dp-mirror');
    mirror.setAttribute('role', 'group');
    var slotsHost = _el('div', 'sl-dp-slots');

    function panelSlots(panelId) {
      return p.slots.filter(function (sl) { return sl.panel === panelId; });
    }
    function optionText(sl, optId) {
      var hit = null;
      sl.options.forEach(function (o) { if (o.id === optId) hit = o.text; });
      return hit;
    }
    function renderMirror() {
      var other = p.panels.filter(function (pn) { return pn.id !== visible; })[0];
      mirror.innerHTML = '';
      mirror.setAttribute('aria-label', other.label + ' current values');
      var mh = _el('div', 'sl-dp-mh');
      mh.textContent = other.label + ' currently says';
      mirror.appendChild(mh);
      panelSlots(other.id).forEach(function (sl) {
        var v = resp[sl.id];
        var chip = _el('span', 'sl-dp-chip' + (v ? '' : ' unset'));
        chip.textContent = sl.label + ': ' + (v ? optionText(sl, v) : '—');
        mirror.appendChild(chip);
      });
    }
    function renderSlots() {
      slotsHost.innerHTML = '';
      panelSlots(visible).forEach(function (sl) {
        var wrap = _el('div', 'sl-cfg-slot');
        var lab = _el('label', 'sl-cfg-label', _esc(sl.label));
        var selId = 'sl-dp-' + step.id + '-' + sl.id;
        lab.setAttribute('for', selId);
        wrap.appendChild(lab);
        var sel = document.createElement('select');
        sel.className = 'sl-cfg-select';
        sel.id = selId;
        sel.setAttribute('data-slot', sl.id);
        var ph = document.createElement('option');
        ph.value = ''; ph.textContent = 'Choose…'; sel.appendChild(ph);
        sl.options.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o.id; op.textContent = o.text;
          if (resp[sl.id] === o.id) { op.selected = true; }
          sel.appendChild(op);
        });
        sel.addEventListener('change', function () {
          if (sel.value) { resp[sl.id] = sel.value; } else { delete resp[sl.id]; }
          updateDots();
          onChange({ slots: Object.assign({}, resp) });
        });
        wrap.appendChild(sel);
        slotsHost.appendChild(wrap);
      });
    }
    function updateDots() {
      Array.prototype.forEach.call(toggle.children, function (btn) {
        var pid = btn.getAttribute('data-panel');
        var filled = panelSlots(pid).every(function (sl) { return resp[sl.id]; });
        btn.classList.toggle('filled', filled);
      });
    }
    p.panels.forEach(function (pn, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sl-dp-btn';
      btn.setAttribute('data-panel', pn.id);
      btn.setAttribute('aria-pressed', String(i === 0));
      var dot = _el('span', 'sl-dp-dot');
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(pn.label));
      btn.addEventListener('click', function () {
        visible = pn.id;
        Array.prototype.forEach.call(toggle.children, function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        renderMirror(); renderSlots();
      });
      toggle.appendChild(btn);
    });

    root.appendChild(toggle);
    root.appendChild(mirror);
    root.appendChild(slotsHost);
    renderMirror(); renderSlots(); updateDots();
    onChange({ slots: Object.assign({}, resp) }); // report initial state (classic parity)
    return root;
  }
```

Note on `_esc` in `_el` text: `_el(tag, cls, text)` in this engine already sets textContent-style text — mirror how classic `_slRenderConfigure` calls `_esc(sl.label)` and keep the identical pattern (grep `_el('label', 'sl-cfg-label'` first; if classic passes `_esc(...)`, do the same — parity beats theory).

- [ ] **Step 4: Append the CSS block to `dg-system.css`** (after the existing `#page-sim-lab .sl-cfg-select` rules):

```css
/* Sim Lab Wave 5: vpntunnel dualpanel configure — A/B toggle + mirror chip strip
   (mockups/vpn-tunnel-negotiation-concept.html). Tokens only. */
#page-sim-lab .sl-dualpanel{display:grid;gap:0}
#page-sim-lab .sl-dp-toggle{display:flex;gap:6px;margin:10px 0}
#page-sim-lab .sl-dp-btn{flex:1;min-height:44px;font:700 12px/1.2 Inter,sans-serif;padding:10px 8px;border-radius:10px;cursor:pointer;border:1px solid var(--border);background:var(--surface2);color:var(--text-dim);transition:color .18s cubic-bezier(0.16,1,0.3,1),border-color .18s cubic-bezier(0.16,1,0.3,1),background-color .18s cubic-bezier(0.16,1,0.3,1),transform .15s cubic-bezier(0.16,1,0.3,1)}
#page-sim-lab .sl-dp-btn:active{transform:scale(0.97)}
#page-sim-lab .sl-dp-btn:disabled{cursor:default;opacity:.7}
#page-sim-lab .sl-dp-btn[aria-pressed="true"]{color:var(--accent);border-color:color-mix(in oklab,var(--accent) 40%,var(--border));background:color-mix(in oklab,var(--accent) 10%,transparent)}
#page-sim-lab .sl-dp-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:1px;background:var(--border);transition:background-color .18s ease}
#page-sim-lab .sl-dp-btn.filled .sl-dp-dot{background:var(--pass)}
#page-sim-lab .sl-dp-mirror{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:13px;padding:10px;background:var(--surface2);border:1px dashed var(--border);border-radius:11px}
#page-sim-lab .sl-dp-mh{flex-basis:100%;font:800 9.5px/1 Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:2px}
#page-sim-lab .sl-dp-chip{font:700 10.5px/1.5 Inter,sans-serif;color:var(--text-mid);background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:4px 10px}
#page-sim-lab .sl-dp-chip.unset{color:var(--text-dim);font-style:italic}
@media (prefers-reduced-motion: reduce){
  #page-sim-lab .sl-dp-btn{transition-property:color,border-color,background-color}
  #page-sim-lab .sl-dp-btn:active{transform:none}
}
```
Then bump the `dg-system.css?v=` query in `index.html` (grep `dg-system.css?v=` — increment whatever value is there) **in this same commit**.

- [ ] **Step 5: Run UAT — all W5 renderer + CSS checks pass, zero regressions.** `node tests/uat.js` → ALL PASS (the ratchet guard also confirms no undefined `var(--x)` was introduced).

- [ ] **Step 6: Commit.**
```bash
git add features/sim-lab.js dg-system.css index.html tests/uat/270-pbq-vpntunnel-wave5.js
git commit -m "feat(pbq-w5): dualpanel configure renderer + mirror chip strip + sl-dp CSS block"
```

---

### Task 3: `simLabValidateTunnelFidelity` (authoring-time seed sanity)

**Files:**
- Modify: `features/sim-lab.js` — new validator directly after `simLabValidateSwatchFidelity` (~L825); expose alongside the other validators if the module's expose block lists them (grep `simLabValidateSwatchFidelity` in the expose section and mirror)
- Test: `tests/uat/270-pbq-vpntunnel-wave5.js` (extend)

**Interfaces:**
- Consumes: `_isNonEmptyStr`; Task 1's payload contract.
- Produces: `simLabValidateTunnelFidelity(scn) -> {ok, errors}` (consumed by Task 4's seed gating and the UAT sweep).

- [ ] **Step 1: Extend UAT with failing validator fixtures** (append to the module):

```js
(function () {
  var m = js.match(/function simLabValidateTunnelFidelity\(scn\) \{([\s\S]*?)\n\s*\}\n/);
  test('W5: simLabValidateTunnelFidelity exists', !!m);
  var validate = null;
  if (m) { validate = new Function('scn', 'var _isNonEmptyStr=function(v){return typeof v==="string"&&v.trim().length>0};' + m[1]); }

  function mkSlot(id, panel, label, opts, extra) {
    var o = { id: id, panel: panel, label: label, options: opts.map(function (t) { return { id: t[0], text: t[1] }; }) };
    return Object.assign(o, extra || {});
  }
  var ENC = [['aes128','AES-128'],['aes192','AES-192'],['aes256','AES-256']];
  var NET = [['lon','10.10.0.0/16 · London'],['fra','10.20.0.0/16 · Frankfurt']];
  function mkScn() {
    return {
      id: 'sp-vpn-99', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
      title: 't', estMinutes: 5, scenario: 's', policyFloor: ['no-psk', 'pfs', 'aes192-min'],
      assets: { reference: { kind: 'network', devices: [
        { id: 'siteA', label: 'London', subnet: '10.10.0.0/16' },
        { id: 'siteB', label: 'Frankfurt', subnet: '10.20.0.0/16' }
      ] } },
      steps: [
        { id: 'p1', type: 'configure', points: 1, prompt: 'x', explanation: 'x',
          payload: { layout: 'dualpanel', scoring: 'tunnel',
            panels: [{ id: 'A', label: 'GW-A' }, { id: 'B', label: 'GW-B' }],
            slots: [ mkSlot('a-enc','A','Encryption',ENC), mkSlot('b-enc','B','Encryption',ENC) ],
            symmetryPairs: [['a-enc','b-enc']], mirrorPairs: [] },
          answer: { slots: { 'a-enc': ['aes192','aes256'], 'b-enc': ['aes192','aes256'] } } },
        { id: 'p2', type: 'configure', points: 1, prompt: 'x', explanation: 'x',
          payload: { layout: 'dualpanel', scoring: 'tunnel',
            panels: [{ id: 'A', label: 'GW-A' }, { id: 'B', label: 'GW-B' }],
            slots: [ mkSlot('a-local','A','Local subnet',NET), mkSlot('a-remote','A','Remote subnet',NET),
                     mkSlot('b-local','B','Local subnet',NET), mkSlot('b-remote','B','Remote subnet',NET) ],
            symmetryPairs: [], mirrorPairs: [['a-local','b-remote'],['a-remote','b-local']] },
          answer: { slots: { 'a-local': ['lon'], 'a-remote': ['fra'], 'b-local': ['fra'], 'b-remote': ['lon'] } } }
      ]
    };
  }
  test('W5: fidelity — well-formed scenario accepted', !!validate && validate(mkScn()).ok);

  var bad1 = mkScn(); bad1.steps[0].payload.symmetryPairs = [['a-enc','a-enc']];
  test('W5: fidelity — same-panel pair rejected', !!validate && !validate(bad1).ok);

  var bad2 = mkScn(); bad2.steps[0].answer.slots['b-enc'] = ['aes256'];
  test('W5: fidelity — asymmetric acceptable sets rejected', !!validate && !validate(bad2).ok);

  var bad3 = mkScn(); bad3.steps[1].answer.slots['b-remote'] = ['fra'];
  test('W5: fidelity — mirror sets that do not cross-reference rejected', !!validate && !validate(bad3).ok);

  var bad4 = mkScn(); bad4.policyFloor = ['no-psk', 'quantum-safe'];
  test('W5: fidelity — unknown policyFloor tag rejected', !!validate && !validate(bad4).ok);

  var bad5 = mkScn(); bad5.steps = [bad5.steps[0]];
  test('W5: fidelity — fewer than 2 dualpanel steps rejected', !!validate && !validate(bad5).ok);

  var bad6 = mkScn(); bad6.assets.reference.devices[0].subnet = '10.99.0.0/16';
  test('W5: fidelity — Phase-2 subnets inconsistent with site subnets rejected', !!validate && !validate(bad6).ok);
})();
```

- [ ] **Step 2: Run UAT — new fixtures FAIL.**

- [ ] **Step 3: Implement the validator** (after `simLabValidateSwatchFidelity`):

```js
  // --- Wave 5: vpntunnel fidelity validator ---
  // Authoring-time seed sanity per spec docs/superpowers/specs/2026-07-19-pbq-wave5-vpntunnel-design.md.
  // Pure logic, total over malformed input; returns { ok, errors }.
  var _TUNNEL_POLICY_FLOORS = ['no-psk', 'pfs', 'aes192-min', 'aes256-min', 'legacy-migration'];
  function simLabValidateTunnelFidelity(scn) {
    var errs = [];
    if (!scn || scn.archetype !== 'vpntunnel') return { ok: false, errors: ['not a vpntunnel scenario'] };
    var steps = Array.isArray(scn.steps) ? scn.steps : [];
    var dual = steps.filter(function (st) {
      return st && st.type === 'configure' && st.payload &&
             st.payload.layout === 'dualpanel' && st.payload.scoring === 'tunnel';
    });
    var analyzeSteps = steps.filter(function (st) { return st && st.type === 'analyze'; });
    if (dual.length !== 2) errs.push('needs exactly 2 dualpanel configure steps, found ' + dual.length);
    if (analyzeSteps.length > 1) errs.push('at most 1 distractor analyze step');
    if (steps.length !== dual.length + analyzeSteps.length) errs.push('unexpected extra step types');

    if (!Array.isArray(scn.policyFloor) || scn.policyFloor.length < 1) {
      errs.push('policyFloor tag array required');
    } else {
      scn.policyFloor.forEach(function (tag) {
        if (_TUNNEL_POLICY_FLOORS.indexOf(tag) === -1) errs.push('unknown policyFloor tag: ' + tag);
      });
    }

    // Site subnets from the network reference (Wave 5 seed contract: device.subnet).
    var siteSubnets = [];
    if (scn.assets && scn.assets.reference && scn.assets.reference.kind === 'network' &&
        Array.isArray(scn.assets.reference.devices)) {
      scn.assets.reference.devices.forEach(function (d) {
        if (d && _isNonEmptyStr(d.subnet)) siteSubnets.push(d.subnet);
      });
    }
    if (siteSubnets.length < 2) errs.push('network reference must declare >=2 device subnet fields');

    dual.forEach(function (st, di) {
      var p = st.payload, tag = 'step ' + (st.id || di) + ': ';
      var slotById = {}, panelIds = {};
      (p.panels || []).forEach(function (pn) { panelIds[pn.id] = true; });
      (p.slots || []).forEach(function (sl) { slotById[sl.id] = sl; });
      // panel pairing: both panels carry the same field set, ids follow <panelLower>-<field>
      var fieldsByPanel = {};
      (p.slots || []).forEach(function (sl) {
        if (!panelIds[sl.panel]) { errs.push(tag + 'slot ' + sl.id + ' references unknown panel'); return; }
        var expectPrefix = String(sl.panel).toLowerCase() + '-';
        if (sl.id.indexOf(expectPrefix) !== 0) errs.push(tag + 'slot id ' + sl.id + ' must start with ' + expectPrefix);
        var field = sl.id.slice(expectPrefix.length);
        fieldsByPanel[sl.panel] = fieldsByPanel[sl.panel] || {};
        fieldsByPanel[sl.panel][field] = true;
      });
      var pids = Object.keys(fieldsByPanel);
      if (pids.length === 2) {
        var fa = Object.keys(fieldsByPanel[pids[0]]).sort().join(','),
            fb = Object.keys(fieldsByPanel[pids[1]]).sort().join(',');
        if (fa !== fb) errs.push(tag + 'panels carry different field sets');
      }
      function setOf(slotId) {
        var arr = st.answer && st.answer.slots && st.answer.slots[slotId];
        return Array.isArray(arr) ? arr.slice().sort().join(',') : null;
      }
      function checkPair(pair, kind) {
        if (!Array.isArray(pair) || pair.length !== 2) { errs.push(tag + 'malformed ' + kind + ' pair'); return; }
        var a = slotById[pair[0]], b = slotById[pair[1]];
        if (!a || !b) { errs.push(tag + kind + ' pair references missing slot'); return; }
        if (a.panel === b.panel) { errs.push(tag + kind + ' pair ' + pair.join('/') + ' must span opposite panels'); return; }
        var sa = setOf(pair[0]), sb = setOf(pair[1]);
        if (sa === null || sb === null) { errs.push(tag + kind + ' pair slot missing answer set'); return; }
        if (sa !== sb) errs.push(tag + kind + ' pair ' + pair.join('/') + ' acceptable sets must be identical');
      }
      (p.symmetryPairs || []).forEach(function (pr) { checkPair(pr, 'symmetry'); });
      (p.mirrorPairs || []).forEach(function (pr) { checkPair(pr, 'mirror'); });
      // Phase-2 subnet realism: any slot whose field is local/remote must have every
      // acceptable option's text contain a CIDR that appears in the site subnets.
      (p.slots || []).forEach(function (sl) {
        var field = sl.id.split('-').slice(1).join('-');
        if (field !== 'local' && field !== 'remote') return;
        var acc = (st.answer && st.answer.slots && st.answer.slots[sl.id]) || [];
        acc.forEach(function (accId) {
          var opt = null;
          sl.options.forEach(function (o) { if (o.id === accId) opt = o; });
          if (!opt) return; // payload validation already rejects this
          var cidr = (opt.text.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}/) || [])[0];
          if (!cidr || siteSubnets.indexOf(cidr) === -1) {
            errs.push(tag + 'slot ' + sl.id + ' acceptable option "' + opt.text + '" does not match a declared site subnet');
          }
        });
      });
    });

    // Distractor coherence: if an analyze step exists, its lines render a config
    // snapshot and its answer references at least one line.
    analyzeSteps.forEach(function (st) {
      var p = st.payload || {}, a = st.answer || {};
      if (!Array.isArray(p.lines) || p.lines.length < 2) errs.push('distractor analyze: lines[] snapshot required');
      if (!Array.isArray(a.selected) || a.selected.length < 1) errs.push('distractor analyze: answer.selected required');
    });

    return { ok: errs.length === 0, errors: errs };
  }
```

- [ ] **Step 4: Hand-derive the 7 UAT fixtures against this code on paper** (accepted, same-panel pair, asymmetric sets, mirror cross-ref, bad floor tag, 1-step, bad site subnet). Fix discrepancies NOW.

- [ ] **Step 5: Run UAT — all pass, zero regressions.** `node tests/uat.js` → ALL PASS.

- [ ] **Step 6: Commit.**
```bash
git add features/sim-lab.js tests/uat/270-pbq-vpntunnel-wave5.js
git commit -m "feat(pbq-w5): simLabValidateTunnelFidelity authoring-time validator"
```

---

### Task 4: Seed bank — 12 gated scenarios

**Files:**
- Modify: `features/sim-lab-seed-secplus.js` — append 12 scenarios inside `window.SIM_LAB_SEED_SECPLUS = [...]`
- Test: `tests/uat/270-pbq-vpntunnel-wave5.js` (extend with the bank sweep)

**Interfaces:**
- Consumes: Task 1's payload contract, Task 3's validator, the `policyFloor` enum `['no-psk','pfs','aes192-min','aes256-min','legacy-migration']`.
- Produces: 12 scenarios `sp-vpn-01`…`sp-vpn-12`, `cert:'secplus'`, `archetype:'vpntunnel'`, consumed by the UAT sweep and the live app.

- [ ] **Step 1: Add the failing bank sweep to UAT** (append to the module):

```js
(function () {
  var bank = js.match(/window\.SIM_LAB_SEED_SECPLUS = \[([\s\S]*)\n\s*\];/);
  var ids = [];
  if (bank) {
    var re = /id: 'sp-vpn-(\d\d)'/g, hit;
    while ((hit = re.exec(bank[1]))) ids.push(hit[1]);
  }
  test('W5: seed bank has exactly 12 sp-vpn scenarios', ids.length === 12);
  test('W5: sp-vpn ids are 01..12 with no gaps', ids.sort().join(',') === '01,02,03,04,05,06,07,08,09,10,11,12');
  // Axis coverage (source-level):
  var vpnSrc = bank ? bank[1] : '';
  test('W5: >=1 seed uses each policyFloor family', /'no-psk'/.test(vpnSrc) && /'pfs'/.test(vpnSrc) && /aes192-min|aes256-min/.test(vpnSrc) && /'legacy-migration'/.test(vpnSrc));
  test('W5: exactly 3 distractor seeds carry an analyze step', (vpnSrc.match(/type: 'analyze'/g) || []).length === 3);
})();
```
Then the FUNCTIONAL sweep — every seed passes scenario validation AND fidelity (mirror how `210-*.js` runs full-bank sweeps; it extracts the seed array and the validators from `js` and evaluates them — read `210-pbq-diagram-seedbank-cli-discovery.js` first and reuse its extraction harness verbatim, pointed at `sp-vpn-` ids, `simLabValidateScenario`, and `simLabValidateTunnelFidelity`):

```js
// Sweep shape (adapt 210's harness):
//   allVpnSeeds.forEach(s => {
//     test('W5 sweep: ' + s.id + ' passes simLabValidateScenario', validateScenario(s).ok);
//     test('W5 sweep: ' + s.id + ' passes simLabValidateTunnelFidelity', validateTunnel(s).ok);
//   });
```

- [ ] **Step 2: Author `sp-vpn-01`** — the mockup's fixture, verbatim seed shape (this is the template for the other 11):

```js
  // ===== Wave 5 — VPN Tunnel Parameter Negotiation (vpntunnel, obj 3.2/1.4) =====
  {
    id: 'sp-vpn-01', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Stand up the site-to-site tunnel to Frankfurt',
    estMinutes: 5, policyFloor: ['no-psk', 'pfs', 'aes192-min'],
    scenario: 'Your company just signed a logistics partner in Frankfurt, and their ERP needs a permanent encrypted path into your London network. You own both IPSec gateways. The security floor: no pre-shared keys for partner tunnels, PFS required (DH group 14+), symmetric encryption AES-192 minimum. Configure Phase 1 and Phase 2 on both ends so the tunnel actually negotiates.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'London HQ', type: 'network', subnet: '10.10.0.0/16', note: 'GW-LON · 203.0.113.10' },
      { id: 'siteB', label: 'Frankfurt', type: 'network', subnet: '10.20.0.0/16', note: 'GW-FRA · 198.51.100.22' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure IKE Phase 1 on both gateways per the security policy.',
        explanation: 'Phase 1 parameters must MATCH on both gateways or negotiation dies at the first exchange. Certificates satisfy the no-PSK floor; AES-192 and AES-256 both clear the encryption floor (a set, not a single answer — but both ends must pick the SAME one); DH group 14 or 19 delivers PFS; 8 or 24 hours are sane rekey windows, 30 days is rotate-never.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-LON — London' }, { id: 'B', label: 'GW-FRA — Frankfurt' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Digital certificates' }, { id: 'xauth', text: 'XAUTH legacy username/password' } ] },
            { id: 'a-enc', panel: 'A', label: 'Encryption algorithm', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-dh', panel: 'A', label: 'Diffie-Hellman group', options: [ { id: 'none', text: 'No DH group · skip PFS' }, { id: 'dh5', text: 'DH group 5 (1536-bit)' }, { id: 'dh14', text: 'DH group 14 (2048-bit)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'a-life', panel: 'A', label: 'SA lifetime', options: [ { id: 'l8h', text: '8 hours' }, { id: 'l24h', text: '24 hours' }, { id: 'l30d', text: '30 days' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Digital certificates' }, { id: 'xauth', text: 'XAUTH legacy username/password' } ] },
            { id: 'b-enc', panel: 'B', label: 'Encryption algorithm', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-dh', panel: 'B', label: 'Diffie-Hellman group', options: [ { id: 'none', text: 'No DH group · skip PFS' }, { id: 'dh5', text: 'DH group 5 (1536-bit)' }, { id: 'dh14', text: 'DH group 14 (2048-bit)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-life', panel: 'B', label: 'SA lifetime', options: [ { id: 'l8h', text: '8 hours' }, { id: 'l24h', text: '24 hours' }, { id: 'l30d', text: '30 days' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-dh','b-dh'], ['a-life','b-life'] ],
          mirrorPairs: [] },
        answer: { slots: { 'a-auth': ['cert'], 'a-enc': ['aes192','aes256'], 'a-dh': ['dh14','dh19'], 'a-life': ['l8h','l24h'],
                          'b-auth': ['cert'], 'b-enc': ['aes192','aes256'], 'b-dh': ['dh14','dh19'], 'b-life': ['l8h','l24h'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Define the protected traffic: subnets, protocol, encryption — both gateways.',
        explanation: 'Phase 2 subnets MIRROR: each end\'s local network is the other end\'s remote. ESP is the only protocol choice that encrypts (AH authenticates only). Phase 2 encryption clears the same AES-192 floor.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-LON — London' }, { id: 'B', label: 'GW-FRA — Frankfurt' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'lon', text: '10.10.0.0/16 · London HQ' }, { id: 'fra', text: '10.20.0.0/16 · Frankfurt' }, { id: 'pub', text: '203.0.113.0/24 · public range' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'lon', text: '10.10.0.0/16 · London HQ' }, { id: 'fra', text: '10.20.0.0/16 · Frankfurt' }, { id: 'pub', text: '203.0.113.0/24 · public range' } ] },
            { id: 'a-proto', panel: 'A', label: 'Protocol', options: [ { id: 'ah', text: 'AH · authentication only' }, { id: 'esp', text: 'ESP · encryption + authentication' } ] },
            { id: 'a-p2enc', panel: 'A', label: 'Phase 2 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256gcm', text: 'AES-256-GCM' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'lon', text: '10.10.0.0/16 · London HQ' }, { id: 'fra', text: '10.20.0.0/16 · Frankfurt' }, { id: 'pub', text: '203.0.113.0/24 · public range' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'lon', text: '10.10.0.0/16 · London HQ' }, { id: 'fra', text: '10.20.0.0/16 · Frankfurt' }, { id: 'pub', text: '203.0.113.0/24 · public range' } ] },
            { id: 'b-proto', panel: 'B', label: 'Protocol', options: [ { id: 'ah', text: 'AH · authentication only' }, { id: 'esp', text: 'ESP · encryption + authentication' } ] },
            { id: 'b-p2enc', panel: 'B', label: 'Phase 2 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256gcm', text: 'AES-256-GCM' } ] }
          ],
          symmetryPairs: [ ['a-proto','b-proto'], ['a-p2enc','b-p2enc'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['lon'], 'a-remote': ['fra'], 'a-proto': ['esp'], 'a-p2enc': ['aes192','aes256gcm'],
                          'b-local': ['fra'], 'b-remote': ['lon'], 'b-proto': ['esp'], 'b-p2enc': ['aes192','aes256gcm'] } } }
    ]
  },
```

- [ ] **Step 3: Author `sp-vpn-02`…`sp-vpn-12`** following the sp-vpn-01 template, spread across the axes (spec §Seed bank — this table is the contract):

| Seeds | Tunnel type | Policy floor | Notes |
|---|---|---|---|
| 01–05 | site-to-site (5) | rotate: 01 no-psk+pfs+aes192-min · 02 aes256-min · 03 legacy-migration (floor tightening mid-migration) · 04 pfs+aes192-min · 05 no-psk+aes256-min | 05 = overlapping-subnet seed: both sites use 10.10.0.0/16 → NAT-T reasoning; the subnet options include a translated range and the acceptable set keys it (network reference declares the translated subnet on the device too, so fidelity check 7 passes) |
| 06–09 | remote-access full-tunnel (4) | rotate the 4 floors | Phase 2 "local subnet" on the concentrator side vs "client pool" — keep the field NAMES local/remote (validator contract) with the pool as a /24 declared on a reference device |
| 10–12 | split-tunnel (3) | rotate | 3 distractor seeds are 03, 07, 11: each adds the analyze step (below) |

Distractor analyze step template (exhibit-channel — NEVER pre-fill a select):

```js
      { id: 'p3', type: 'analyze', points: 1,
        prompt: 'The partner emailed their proposed Phase 1 for review. Which parameter blocks the tunnel under your policy floor?',
        explanation: 'Their proposal uses a pre-shared key — the floor bans PSK on partner tunnels. Everything else clears: AES-256, DH 14, 24h lifetime.',
        payload: { multi: false, lines: [
          { id: 'ln-auth', text: 'Authentication: Pre-shared key' },
          { id: 'ln-enc', text: 'Encryption: AES-256' },
          { id: 'ln-dh', text: 'DH group: 14 (2048-bit)' },
          { id: 'ln-life', text: 'Lifetime: 24 hours' }
        ] },
        answer: { selected: ['ln-auth'] } }
```
(`multi` EXPLICIT — house rule. Check the classic analyze payload contract in `_validateStepPayload` — `lines` entries there may be plain strings or `{id,text}`; grep an existing analyze seed in `sim-lab-seed-secplus.js` and mirror ITS shape exactly.)

Authoring rules for all 11: vendor-neutral vocabulary only; every scenario prose states the floor in words matching its `policyFloor` tags; acceptable sets are genuine sets wherever the floor allows >1 value; `objective: '3.2'` for all, `'1.4'` as the objective on the 2 seeds whose scenario centers the crypto floor (04, 09); `estMinutes` 4–6.

- [ ] **Step 4: Two-agent gate — every scenario, revise-until-both-approve.** Dispatch two review agents per batch (batch = 4 seeds), giving each the full seed JSON:
  - **Agent 1 (Sec+ domain expert):** "Verify every technical claim: IKE Phase 1/2 semantics, PFS/DH groups, ESP vs AH, lifetime sanity, subnet mirroring, NAT-T reasoning (seed 05), split- vs full-tunnel semantics (06–12). Flag ANY claim a network engineer would dispute. Verify vendor neutrality."
  - **Agent 2 (SY0-701 examiner):** "Judge each scenario as an SY0-701 item: objective 3.2/1.4 alignment, plausible exam framing, no trick ambiguity, distractor options plausible-but-clearly-wrong under the stated floor, explanations teach the right reason."
  Revise and re-gate until BOTH approve every seed. Log a one-line verdict per seed in the commit message.

- [ ] **Step 5: Run the full UAT sweep** — `node tests/uat.js` → ALL PASS (12 seeds × scenario validation + fidelity + axis checks). Fix seeds, not tests.

- [ ] **Step 6: Commit.**
```bash
git add features/sim-lab-seed-secplus.js tests/uat/270-pbq-vpntunnel-wave5.js
git commit -m "feat(pbq-w5): 12 gated vpntunnel seeds sp-vpn-01..12 (two-agent gate passed)"
```

---

### Task 5: E2E + visual + full local gate

**Files:**
- Modify: the sim-lab Playwright spec (locate with `ls tests/e2e/` — the file containing existing Sim Lab session tests; grep `sl-cfg-select` in `tests/e2e/*.spec.js` and extend THAT file, mirroring its setup helpers)
- Test: run-only for UAT/visual/tech-debt

**Interfaces:**
- Consumes: Tasks 1–4 complete; the live seed `sp-vpn-01`; CSS classes `.sl-dp-btn`, `.sl-cfg-select`.
- Produces: one e2e test proving the dualpanel round-trip in a real browser.

- [ ] **Step 1: Write the e2e test** (adapt selectors/helpers to the existing spec file's conventions — read its existing configure-step test first and clone its scenario-launch setup):

```js
test('Wave 5: vpntunnel dualpanel — toggle panels, answer both, submit, breakdown scored', async ({ page }) => {
  // Launch sp-vpn-01 via the spec file's existing scenario-launch helper.
  // 1. Phase 1 card shows two .sl-dp-btn toggles, first aria-pressed=true
  const btns = page.locator('.sl-dp-btn');
  await expect(btns).toHaveCount(2);
  await expect(btns.first()).toHaveAttribute('aria-pressed', 'true');
  // 2. Fill visible panel (4 selects), toggle, fill other panel
  const fill = async (vals) => {
    const sels = page.locator('.sl-dualpanel .sl-cfg-select');
    for (let i = 0; i < vals.length; i++) await sels.nth(i).selectOption(vals[i]);
  };
  await fill(['cert', 'aes256', 'dh14', 'l8h']);
  await btns.nth(1).click();
  // 3. Mirror strip shows the first panel's picks
  await expect(page.locator('.sl-dp-chip').first()).not.toContainText('—');
  await fill(['cert', 'aes256', 'dh14', 'l8h']);
  // 4. Both toggle dots filled
  await expect(page.locator('.sl-dp-btn.filled')).toHaveCount(2);
  // ...advance to Phase 2 via the engine's existing step-nav control, fill mirrored
  // subnets + esp + aes256gcm on both panels, submit via the existing submit control,
  // then assert the feedback breakdown reports a full score for both steps
  // (exact submit/feedback selectors: clone from the file's existing configure test).
});
```

- [ ] **Step 2: Run the spec file.** `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" && npx playwright test <the-sim-lab-spec-file>` → new test PASSES, no regressions in the file.

- [ ] **Step 3: Full local gate.**
```bash
node tests/uat.js            # ALL PASS
node tests/tech-debt.js      # 0 breaches
npm run test:visual          # all baselines byte-stable (dualpanel renders only inside a scenario, not on the page shell)
```
If a visual baseline legitimately changed, STOP and escalate — the dualpanel should not alter any baselined surface.

- [ ] **Step 4: Commit.**
```bash
git add tests/e2e/
git commit -m "test(pbq-w5): vpntunnel dualpanel e2e round-trip"
```

---

### Task 6: Ship v7.81.0

**Files:**
- Modify (via script only): `app.js`, `sw.js`, `index.html`, `package.json`, `CLAUDE.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: Tasks 1–5 green.
- Produces: v7.81.0 in prod, live-verified.

- [ ] **Step 1: Version bump.** `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" && node scripts/bump-version.js 7.81.0 "Sim Lab Wave 5: VPN Tunnel Negotiation PBQ (vpntunnel) — dualpanel configure, tunnel scoring, 12 Sec+ seeds"`

- [ ] **Step 2: Walk SHIP_CHECKLIST.md phases 1–5** (automated checks → version+cache → live-verify plan → no schema/RLS this wave → final pre-push gate).

- [ ] **Step 3: Commit + push.**
```bash
git add -A && git commit -m "ship(pbq-w5): v7.81.0 — VPN Tunnel Negotiation PBQ"
git push origin main
```

- [ ] **Step 4: Watch CI to green.** `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId') --exit-status`

- [ ] **Step 5: Post-deploy live-verify (per CLAUDE.md — MANDATORY, real browser):** cache-bust navigate to `https://secplus.certanvil.com/?_cb=7.81.0`; click the real user path into Sim Lab → launch a vpntunnel scenario; toggle A/B panels and confirm the mirror strip updates; fill both phases and submit; measure that the feedback breakdown shows the unit totals; check both themes; confirm zero console errors. 🚨 READ-ONLY on prod — no localStorage writes.

- [ ] **Step 6: Update memory/handoff** — record Wave 5 shipped, next candidates per the ranked lists (`fleetlog`+`endpoints` roster pair proposed as Wave 6).

---

## Self-review notes

- Spec coverage: data contract (T1), scoring incl. both branch points + dangling-pair totality (T1), renderer + mirror strip + 44px + aria (T2), CSS tokens + cache-bust (T2), fidelity validator all 9 checks (T3 — check 7 via the CIDR-in-option-text ∈ device.subnet rule; the Wave-1 CIDR validator is archetype-gated by its own `deviceId` convention and never sees vpntunnel seeds, verified in T3 fixtures by construction), seeds + axes + distractor exhibit-channel + two-agent gate (T4), e2e + visual (T5), ship + live-verify (T6). Feedback layer deliberately untouched (spec §carry-over) — restated in Global Constraints.
- The mockup's pair-verdict rows / three-bar result are mockup-flow only; engine feedback unchanged. Stated in Global Constraints so no implementer "helpfully" builds them.
- Type consistency: `_scoreTunnelStep(step, resp) -> {total, correct}` used identically in T1 fixtures, `_scoreStep`, `simLabScoreScenario`; `simLabValidateTunnelFidelity(scn) -> {ok, errors}` matches T3 fixtures and T4 sweep; CSS class names in T2 CSS = T2 renderer = T5 e2e selectors.
