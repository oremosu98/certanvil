---
up: "[[Drills MOC]]"
type: plan
status: active
cert: netplus, aplus-core1
updated: 2026-07-08
tags: [plan, drill, pbq, terminal]
---
# Sim Lab PBQ Wave 2 — Implementation Plan (Terminal / Output-Excerpt Family)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three new Sim Lab PBQ archetypes — Guided CLI Fault Isolation (Net+), Network Discovery Audit (Net+), Command-Output Evidence Triage (A+ Core 1) — riding **exactly one new renderer** (a shared terminal / output-excerpt panel with progressive reveal) plus one small backward-compatible analyze extension, three deterministic fidelity validators, and three 10-12 two-agent-gated seed banks.

**Architecture:** Everything reuses the live engine in `features/sim-lab.js` (configure/analyze/order steps, per-slot scoring, gating/exam paths — archetype-agnostic, proven in v7.61.0 + Wave 1 v7.62.0). This wave ADDS: three archetype tag values (`cli`/`discovery`/`triage`); one reference kind (`terminal`) with one renderer (`_slRenderRefTerminal`); a guarded analyze extension (a `payload.mode` render branch + a `scoring:'lenient'` scoring path, BOTH default OFF); three pure-logic fidelity validators; a lifted `.term*` CSS token block; and three gated seed banks. Spec: `docs/superpowers/specs/2026-07-08-pbq-wave2-design.md`. Mockups (faithful-lift build targets, incl. their footer ENGINE-MAPPING comments + grading JS): `mockups/cli-fault-isolation-concept.html`, `mockups/network-discovery-audit-concept.html`, `mockups/command-output-triage-concept.html`.

**Tech Stack:** Vanilla ES5-style JS (IIFE feature module, no build step), native `<button>`/`<select>` selection-first UI, `tests/uat.js` (vm sandbox + grab/grabVar extraction, DOM shim, NO jsdom), forged-bronze tokens in `dg-system.css`.

## Global Constraints

- Branch: create `feat/sim-lab-pbq-wave2` from up-to-date `main` before Task 1; all commits land there; PR at Task 13.
- Fast lane (JS + content + CSS tokens + index.html cache-bump; no schema/auth/money; `sw.js` only via `bump-version.js` at ship).
- ES5-style JS matching surrounding `features/sim-lab.js` code; no new deps.
- **Selection-first (HARD):** native `<button>`/`<select>`/line-select only — NO free-text terminal input, NO real command execution. Must work Desktop + Safari/WebKit + iOS Capacitor.
- **Mockups ARE the build (faithful lift** — visual/interaction fidelity, not markup fidelity). **Where a mockup detail and the engine's conventions disagree, the engine wins.** If a task discovers it needs a SECOND renderer, a per-archetype renderer variant, a new step-type, or a free-text surface — that is out of Wave 2 scope by spec: STOP and escalate.
- **XSS (HARD):** every `promptLine` and `line.text` is scenario data and MUST be treated as untrusted — render **escape-THEN-highlight** exactly like `setQuestionText` (`_esc` first, THEN wrap the highlight span / prompt-token span on the already-escaped string). The engine NEVER `innerHTML`s raw excerpt text. The mockups inject trusted fixture HTML directly; the engine port must NOT.
- **`analyze` `multi` is EXPLICIT (Wave-1 lesson):** every analyze step MUST declare `multi` explicitly (`_slRenderAnalyze` default is `multi !== false`, i.e. multi unless opted out). Reveal-mode and lenient-scoring steps must ALSO set their flags (`payload.mode`, `payload.scoring`) explicitly.
- CSS: `dg-system.css` only (never `styles.css`); tokens only, **zero hardcoded hex**; every bare `var(--x)` referenced MUST be DEFINED (the Wave-1 Task-5 ratchet guard fails any NEW undefined bare `var()` — do NOT add new tokens to `KNOWN_GAPS`; DEFINE them).
- Seed banks: 10-12 scenarios per archetype; Net+ (`cli`, `discovery`) in `features/sim-lab-seed-netplus.js` (cert `netplus`); A+ (`triage`) in `features/sim-lab-seed-aplus-core1.js` (cert `aplus-core1`). Milestones/banks stay per-cert.
- **Dev-fixture rule (HARD):** no scenario enters a seed bank until it passes its deterministic fidelity validator AND the two-agent consensus gate. **Gate lenses: N10-009 domain engineer + CompTIA N10-009 examiner for the two Net+ archetypes (`cli`, `discovery`); 220-1201 examiner for `triage`.** Mockup-embedded scenarios are labeled dev fixtures only.
- Do NOT run `bump-version.js` before Task 13. Hand-bump ONLY the `dg-system.css?v=` query when Task 7 touches CSS (see the freshness-gate path in T7 Notes).
- UAT: use `test(name, cond)` (global at ~L133) OR a block-local `assert` wrapper — mirror the surrounding block; never hardcode a global total-count literal. Feature files are concatenated DEDENTED (2 leading spaces stripped) into the `js` string, so extraction regexes see column-0 closings.
- Binary-misdetect: `features/sim-lab.js` is grep-misdetected as binary — always `grep -a` (or `graphq.js`) against it.
- Implementers work THEMSELVES (no sub-agents for code); integrators use byte-identity checks; reviewers do NOT `git stash` (they diff `git merge-base main HEAD`).

---

## Reference contracts (used across tasks — keep names identical)

### Archetype tags (Task 1)
`simLabValidateScenario` accepts optional `scenario.archetype` in
`['diagram','incident','defense','wireless','firewall','soho','cli','discovery','triage']`.

### The `terminal` reference kind + renderer (Tasks 2, 7)
```js
assets.reference = {
  kind: 'terminal',
  host: 'WS-14 · admin shell',          // term-head left chrome (escaped)
  session: 'session 7f2a · read-only',  // term-head right chrome (escaped)
  reveal: 'tabs' | 'external' | undefined, // renderer's THREE data-driven expressions:
    //  'tabs'     → renderer draws an internal .term-tabs bar (discovery source tabs);
    //               first excerpt visible, the rest [hidden]; a tab reveals its excerpt.
    //  'external' → every excerpt carrying a `reveal` key starts [hidden]; an EXTERNAL
    //               step (the CLI reveal-mode analyze command menu) calls the exposed
    //               revealExcerpt(key) to unhide one at a time.
    //  undefined  → all excerpts visible immediately (triage).
  excerpts: [                            // ordered output blocks; one per command / source / section
    {
      id: 'showint',                     // stable; referenced by steps + validator (UNIQUE across excerpts)
      promptLine: 'SW-2# show interfaces Gi0/14',  // command echo; leading token spanned .pmt AFTER escape
      reveal: 'showint',                 // reveal-trigger key ('external'/'tabs' modes); omit = always visible
      necessary: true,                   // CLI only: excerpt is part of the minimal isolation cover
      tab: 'show int',                   // 'tabs' mode: short tab label (falls back to id)
      lines: [                           // output body, line by line
        { id:'l1', text:'Half-duplex, 100Mb/s', highlight:'hot', select:false },
        { id:'l2', text:'2471 late collisions', highlight:'hot', select:true, evidence:true }
      ]
    }
  ]
}
```
Line fields: `select:true` → the line renders as a keyboard-focusable `<button class="term-line" data-line=ID>` (NEVER a div — same discipline as `_slRenderAnalyze` line buttons). `evidence:true|false` (triage answer semantics) / `ctx:true` (non-evidence context line, `.term-ctx`). `highlight ∈ {'hot','good','k'}` → the mockup's `.term-out .hot/.good/.k` classes. **`line.id` MUST be unique across ALL excerpts of a reference** (answer.selected uses bare line ids — validators assert uniqueness).

Renderer exposes `revealExcerpt(key)` (matches `ex.reveal===key` OR `ex.id===key`) BOTH as a property on the returned root node (`termRoot.revealExcerpt`) AND on the global `window.__slRevealExcerpt` — following the existing `window.__slResponses` / `window.__slActiveSubmit` convention, so `_slMountScenario` needs NO signature change.

### The guarded analyze extension (Task 3) — both axes DEFAULT OFF
```js
// A step is an ordinary analyze step UNLESS it declares payload.mode.
step = {
  id, type:'analyze', points:1, prompt, explanation,
  payload: {
    multi: true|false,          // EXPLICIT always (Wave-1 lesson)
    mode: 'reveal' | 'excerptLines' | undefined,  // undefined = today's behavior, byte-identical
    scoring: 'lenient' | undefined,               // undefined = today's exact-set boolean
    lines: [...]                // REQUIRED when mode is undefined; OMITTED for mode:'reveal'/'excerptLines'
    // (mode steps source their selectable targets from the terminal reference, single source of truth)
  },
  answer: { selected: [ ...ids ] }   // ALWAYS present (length>=1). The KEYED true set:
    //  mode:'reveal'       → the `necessary:true` EXCERPT ids
    //  mode:'excerptLines' → the keyed LINE ids (evidence:true lines / the one contradicting row)
    //  mode:undefined      → today's line ids over payload.lines
}
```
- **Render (`_slRenderAnalyze` `mode` branch):**
  - `mode:'reveal'` — one command button per reference excerpt that has a `reveal` key (labeled by `promptLine`); clicking marks it "ran" and calls `window.__slRevealExcerpt(ex.reveal)`; the running set flows to `onChange({selected})`.
  - `mode:'excerptLines'` — binds the reference's `select:true` line buttons (rendered by `_slRenderRefTerminal`) instead of building its own `.sl-analyze-block`; selection state flows via the same `onChange({selected})` contract, honoring `multi`.
  - `mode:undefined` — UNCHANGED. Existing `.sl-analyze-block` over `payload.lines`.
- **Score (`scoring:'lenient'` path in `_scoreStep`/`simLabScoreScenario`):** partial credit like `_scoreConfigureSlots` — `total = answer.selected.length`, `correct = count(resp.selected ∩ answer.selected)`. False picks are marked in-UI but NEVER subtract earned credit. `simLabScoreScenario` treats a lenient analyze step like a configure step (`perStep[id] = {total, correct}`; `correct += sc.correct; total += sc.total`). Absent (default) = today's exact-set boolean (`_setEq`), byte-identical for every existing analyze scenario.

### Validator signatures (locked — mirror `simLabValidateFirewallFidelity(scn)`)
```js
simLabValidateCliFaultFidelity(scn)         // -> { ok, errors }
simLabValidateDiscoveryAuditFidelity(scn)   // -> { ok, errors }
simLabValidateEvidenceTriageFidelity(scn)   // -> { ok, errors }
```
All three live in `features/sim-lab.js` next to the Wave-1 validators and reuse `_isNonEmptyStr`, `_slFidelityResolveSlot`, `_ipToInt`, `_inSubnet`.

### Scenario machine-fact contracts (Tasks 4-6, 8-10)
```js
// CLI (archetype:'cli')  — fault signature declared machine-readable:
scn.cliFault = { fault:'duplex' }   // key into _CLI_FAULT_SIG
// reference.excerpts[*].necessary marks the minimal isolation cover.
// A configure step carries slots 'rootCause' + 'fix' (keyed).

// DISCOVERY (archetype:'discovery') — structured facts ride each terminal line:
//   lldp lines: line.fact = { port:'Gi0/1', device:'AP-2', mgmt:'10.0.0.12' }
//   mac  lines: line.fact = { mac:'e8ff.1e44.2b90', port:'Gi0/5' }
//   arp  lines: line.fact = { ip:'10.0.0.30', mac:'e8ff.1e44.2b90' }
scn.disco = {
  ports: [ { port:'Gi0/1', device:'AP-2', mgmt:'10.0.0.12', source:'lldp' },
           { port:'Gi0/5', device:'silent-host', mgmt:'10.0.0.30', source:'macarp' } ],
  legacyExcerptId: 'csv'   // the excerpt whose select:true rows are audited
}
// The reconcile CONFIGURE step's slot ids: '<port>__dev' and '<port>__ip' (keyed to device/mgmt text).
// The records-audit ANALYZE step (mode:'excerptLines', multi:false) keys answer.selected to the ONE
//   legacy line whose fact contradicts scn.disco.ports.

// TRIAGE (archetype:'triage'):
scn.triage = { fault:'apipa' }   // key into _TRIAGE_FAULT_SIG
// evidence lines carry evidence:true|false; the flag-evidence ANALYZE step (mode:'excerptLines',
//   multi:true, scoring:'lenient') keys answer.selected to the evidence:true line ids.
// A configure step carries slots 'diagnosis' + 'firstMove' (keyed).
```

### Bank id prefixes
`np-cli-NN` (netplus · cli) · `np-disc-NN` (netplus · discovery) · `a1-cot-NN` (aplus-core1 · triage).

---

### Task 0: Branch setup + baseline

**Files:** none (git only)

- [ ] **Step 1:** `cd "$HOME/Desktop/Dev Projects/certanvil" && git checkout main && git pull origin main && git checkout -b feat/sim-lab-pbq-wave2`
- [ ] **Step 2:** `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" && node tests/uat.js` — Expected: `UAT: 4503/4503 ALL PASS ✓` (measured baseline at `main` @ 3a444dd; every task below states its `+N` delta against this running total).

### Task 1: Accept the three new archetype tags

**Files:**
- Modify: `features/sim-lab.js` (the archetype check inside `simLabValidateScenario`, ~L74)
- Test: `tests/uat.js` (Sim Lab validation block — locate by `grep -a "bad archetype"` / `grep "archetype wireless accepted"`)

**Interfaces:**
- Consumes: existing `simLabValidateScenario`.
- Produces: `['diagram','incident','defense','wireless','firewall','soho','cli','discovery','triage']` accepted — Tasks 8-10 seed content depends on this.

- [ ] **Step 1: Write failing tests** — next to the existing Wave-1 archetype tests (`grep "archetype wireless accepted"`):
```js
['cli', 'discovery', 'triage'].forEach(function (tag) {
  var _s2 = _baseScn(); _s2.archetype = tag;
  assert(simLabValidateScenario(_s2).ok === true, 'archetype ' + tag + ' accepted');
});
var _sx2 = _baseScn(); _sx2.archetype = 'logscan';
assert(simLabValidateScenario(_sx2).ok === false, 'unknown archetype logscan still rejected');
```
(Reuse the block's existing `_baseScn` helper — the same one the Wave-1 archetype tests use.)
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL on `archetype cli accepted`.
- [ ] **Step 3: Implement** — extend the list in `simLabValidateScenario`:
```js
if (s.archetype !== undefined && ['diagram', 'incident', 'defense', 'wireless', 'firewall', 'soho', 'cli', 'discovery', 'triage'].indexOf(s.archetype) === -1) {
  errs.push('bad archetype');
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): accept cli/discovery/triage archetype tags"`

### Task 2: The `terminal` reference renderer + dispatch case

**Files:**
- Modify: `features/sim-lab.js` — add `_slRenderRefTerminal` next to `_slRenderRefNetwork` (~L801); add the `'terminal'` case to `_slRenderReference` (~L1170); add `'terminal'` to the reference-kind allowlist + shape check in `simLabValidateScenario` (~L65-72).
- Test: `tests/uat.js` (new block after the reference-mount tests — `grep "_slMountScenario renders a .sl-ref panel"`)

**Interfaces:**
- Consumes: `_el(tag, cls, html)`, `_esc(s)`.
- Produces: `_slRenderRefTerminal(ref) -> DOM node` (class `term`) exposing `revealExcerpt(key)` on the node + on `window.__slRevealExcerpt`; `_slRenderReference` dispatches `ref.kind === 'terminal'`; `simLabValidateScenario` accepts `kind:'terminal'` requiring `excerpts[]` each with `id` + `lines[]`. Tasks 3-6, 8-11 all consume this.

- [ ] **Step 1: Write the failing tests.** Self-contained shim (the reference-mount shim at ~L21019 lacks `classList`/`removeAttribute`, which the terminal renderer needs — extend it here):
```js
(function () {
  var grab = function (name) { return _fnBody(js, name); };
  var elBody   = grab('_el');
  var escBody  = grab('_esc');
  var termBody = grab('_slRenderRefTerminal');
  var dispBody = grab('_slRenderReference');
  if (!termBody || !dispBody) { results.errors.push('could not extract _slRenderRefTerminal/_slRenderReference'); return; }

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
      insertBefore: function (c) { children.unshift(c); return c; },
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
  var mCtx = { document: { createElement: makeEl },
    window: { matchMedia: function () { return { matches: false }; } },
    Object: Object, Array: Array, String: String };
  vm.createContext(mCtx);
  vm.runInContext(elBody + '\n' + escBody + '\n' + termBody + '\n' + dispBody, mCtx);

  var ref = { kind: 'terminal', host: 'WS-14 · admin', session: 'read-only', reveal: 'external',
    excerpts: [
      { id: 'a', promptLine: 'C:\\> ipconfig', reveal: 'a', necessary: true,
        lines: [ { id: 'l1', text: '169.254.1.1 <script>x</script>', highlight: 'hot', select: true, evidence: true },
                 { id: 'l2', text: 'Media connected', select: false, ctx: true } ] },
      { id: 'b', promptLine: 'C:\\> ping 1.1.1.1', reveal: 'b',
        lines: [ { id: 'l3', text: 'timeout', select: true, evidence: false } ] }
    ] };
  mCtx.ref = ref;
  vm.runInContext('globalThis.__panel = _slRenderReference(ref);', mCtx);
  var panel = mCtx.__panel;

  test('terminal: _slRenderReference returns a .sl-ref panel for kind terminal',
    !!panel && panel.className === 'sl-ref');
  var termNode = panel._children.filter(function (c) { return c.className && c.className.split(' ').indexOf('term') !== -1; })[0];
  test('terminal: panel contains a .term component', !!termNode);
  var lineBtns = panel.querySelectorAll('button');
  var termLines = lineBtns.filter(function (b) { return b.className && b.className.split(' ').indexOf('term-line') !== -1; });
  test('terminal: select:true lines render as focusable BUTTONs with data-line',
    termLines.length === 2 && termLines[0].getAttribute('data-line') === 'l1');
  var l1html = termLines[0].innerHTML;
  test('terminal: line text is ESCAPED (no raw <script>)', l1html.indexOf('<script>') === -1 && l1html.indexOf('&lt;script&gt;') !== -1);
  test('terminal: highlight wraps the ESCAPED text in a .hot span', l1html.indexOf('class="hot"') !== -1);
  var scrolls = panel.querySelectorAll('.term-scroll');
  test('terminal: each excerpt body is inside a .term-scroll container', scrolls.length === 2);
  // external reveal: keyed excerpts start hidden; revealExcerpt unhides
  var blocks = panel.querySelectorAll('.term-block');
  test('terminal: external-mode keyed excerpts start [hidden]',
    blocks.length === 2 && blocks[0].getAttribute('hidden') !== null && blocks[1].getAttribute('hidden') !== null);
  panel.revealExcerpt('a');
  test('terminal: revealExcerpt(key) unhides its excerpt block',
    blocks[0].getAttribute('hidden') === null && blocks[1].getAttribute('hidden') !== null);
  test('terminal: revealExcerpt is also published on window.__slRevealExcerpt',
    typeof mCtx.window.__slRevealExcerpt === 'function');
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (`could not extract _slRenderRefTerminal` / function undefined).
- [ ] **Step 3a: Implement the renderer** in `features/sim-lab.js` (below `_slRenderRefNetwork`'s helpers, before `_slRenderReference`):
```js
// --- terminal / output-excerpt reference renderer (Wave 2 Task 2) ---
// The ONE new Wave 2 renderer. Three data-driven expressions off ref.reveal:
//   'tabs'     -> internal source-tab bar, one excerpt visible at a time (discovery)
//   'external' -> keyed excerpts start hidden; an external step calls revealExcerpt (cli)
//   undefined  -> all excerpts visible (triage)
// Escape-THEN-highlight per line/prompt (excerpt text is untrusted scenario data).
// Selectable lines are real <button>s so an analyze step can bind them (single
// source of truth for line text, so the fidelity validators' cross-checks are exact).
function _termLineHtml(line) {
  var esc = _esc(line.text);                       // escape FIRST
  var cls = (line.highlight === 'hot' || line.highlight === 'good' || line.highlight === 'k') ? line.highlight : '';
  return cls ? '<span class="' + cls + '">' + esc + '</span>' : esc;
}
function _termPromptHtml(promptLine) {
  var esc = _esc(promptLine || '');                // escape FIRST, then span the leading token
  var sp = esc.indexOf(' ');
  return sp > 0 ? '<span class="pmt">' + esc.slice(0, sp) + '</span>' + esc.slice(sp) : esc;
}
function _slRenderRefTerminal(ref) {
  var root = _el('div', 'term');
  var head = _el('div', 'term-head');
  var hostBox = _el('div', 'term-host', '<span class="lamp"><i></i><i></i><i></i></span>');
  hostBox.appendChild(_el('span', 'term-host-name', _esc(ref.host || '')));
  head.appendChild(hostBox);
  head.appendChild(_el('div', 'term-sess', _esc(ref.session || '')));
  root.appendChild(head);

  var excerpts = (ref && Array.isArray(ref.excerpts)) ? ref.excerpts : [];
  var mode = ref ? ref.reveal : undefined;         // 'tabs' | 'external' | undefined
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var body = _el('div', 'term-body');
  var blockById = {};

  excerpts.forEach(function (ex, i) {
    var block = _el('div', 'term-block');
    block.setAttribute('data-excerpt', ex.id);
    var scroll = _el('div', 'term-scroll');
    scroll.appendChild(_el('div', 'term-cmd', _termPromptHtml(ex.promptLine)));
    var out = _el('div', 'term-out');
    (ex.lines || []).forEach(function (ln) {
      if (ln.select) {
        var btn = _el('button', 'term-line' + (ln.evidence ? ' is-ev' : ''), _termLineHtml(ln));
        btn.setAttribute('type', 'button');
        btn.setAttribute('data-line', ln.id);
        out.appendChild(btn);
      } else {
        out.appendChild(_el('div', 'term-ln' + (ln.ctx ? ' term-ctx' : ''), _termLineHtml(ln)));
      }
    });
    scroll.appendChild(out);
    block.appendChild(scroll);
    var hide = (mode === 'tabs') ? (i !== 0) : (mode === 'external') ? !!ex.reveal : false;
    if (hide) block.setAttribute('hidden', '');
    body.appendChild(block);
    blockById[ex.id] = block;
  });

  function revealExcerpt(key) {
    var target = null;
    excerpts.forEach(function (ex) { if (ex.reveal === key || ex.id === key) target = ex; });
    if (!target || !blockById[target.id]) return;
    var block = blockById[target.id];
    block.removeAttribute('hidden');
    if (!reduce && block.classList) block.classList.add('term-anim');
  }

  if (mode === 'tabs') {
    var tabs = _el('div', 'term-tabs');
    excerpts.forEach(function (ex, i) {
      var tab = _el('button', 'term-tab' + (i === 0 ? ' on' : ''), _esc(ex.tab || ex.id));
      tab.setAttribute('type', 'button');
      tab.setAttribute('data-tab', ex.id);
      tab.addEventListener('click', function () {
        revealExcerpt(ex.id);
        (tabs._children || []).forEach(function (t) {
          if (t.classList) { t.classList.toggle('on', t.getAttribute('data-tab') === ex.id); t.classList.add('seen'); }
        });
      });
      tabs.appendChild(tab);
    });
    root.appendChild(tabs);
  }
  root.appendChild(body);

  root.revealExcerpt = revealExcerpt;
  window.__slRevealExcerpt = revealExcerpt;
  return root;
}
```
- [ ] **Step 3b: Add the dispatch case** in `_slRenderReference`, after the `layered` branch:
```js
else if (ref.kind === 'terminal') panel.appendChild(_slRenderRefTerminal(ref));
```
- [ ] **Step 3c: Extend the allowlist + shape check** in `simLabValidateScenario` — change `kinds` and add the terminal shape rule:
```js
var ref = s.assets.reference, kinds = ['network', 'timeline', 'layered', 'terminal'];
if (kinds.indexOf(ref.kind) === -1) errs.push('reference: bad kind');
else if (ref.kind === 'network' && !Array.isArray(ref.devices)) errs.push('reference network: devices[] required');
else if (ref.kind === 'timeline' && !Array.isArray(ref.stages)) errs.push('reference timeline: stages[] required');
else if (ref.kind === 'layered' && !Array.isArray(ref.layers)) errs.push('reference layered: layers[] required');
else if (ref.kind === 'terminal' && (!Array.isArray(ref.excerpts) || !ref.excerpts.every(function (ex) {
  return ex && _isNonEmptyStr(ex.id) && Array.isArray(ex.lines);
}))) errs.push('reference terminal: excerpts[] with id+lines[] required');
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+9). If the reference-mount block at ~L21114 regresses, you changed dispatch structure — restore the network/timeline/layered branches byte-for-byte.
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): terminal output-excerpt reference renderer + dispatch"`

### Task 3: The guarded analyze extension (mode branch + lenient scoring)

**Files:**
- Modify: `features/sim-lab.js` — `_validateStepPayload` analyze branch (~L24), `_slRenderAnalyze` (~L603), `_scoreStep` analyze case (~L378), `simLabScoreScenario` (~L393).
- Test: `tests/uat.js` (new block after the Task-2 terminal block + a regression assertion in the existing analyze-scoring block)

**Interfaces:**
- Consumes: Task 2 renderer + `window.__slRevealExcerpt`; `_scoreConfigureSlots`, `_setEq`.
- Produces: analyze steps may carry `payload.mode ∈ {'reveal','excerptLines'}` and `payload.scoring:'lenient'`; both default OFF. Tasks 8-11 content consumes.

- [ ] **Step 1: Write failing tests** — a mode/scoring block plus a byte-identity regression guard:
```js
(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var pieces = [grab('_arrEq'), grab('_setEq'), grab('_scoreConfigureSlots'), grab('_scoreStep'), grab('_simLabNormalizeMatch') || '', grab('simLabScoreScenario')].join('\n');
  var sCtx = {}; vm.createContext(sCtx); vm.runInContext(pieces, sCtx);
  vm.runInContext('globalThis.__score = simLabScoreScenario;', sCtx);
  var score = sCtx.__score;

  // lenient analyze: partial credit, false picks never subtract
  var lenientScn = { steps: [ { id: 'ev', type: 'analyze', points: 1,
    payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
    answer: { selected: ['l1', 'l2', 'l3'] } } ] };
  test('analyze lenient: all-correct scores total===correct',
    score(lenientScn, { ev: { selected: ['l1', 'l2', 'l3'] } }).correct === 3);
  test('analyze lenient: partial scores correct<total, no negative',
    (function () { var r = score(lenientScn, { ev: { selected: ['l1'] } }); return r.correct === 1 && r.total === 3; })());
  test('analyze lenient: a FALSE pick does not subtract earned credit',
    (function () { var r = score(lenientScn, { ev: { selected: ['l1', 'l2', 'l3', 'lX'] } }); return r.correct === 3 && r.total === 3; })());

  // regression: an analyze step WITHOUT scoring flag stays exact-set boolean
  var exactScn = { steps: [ { id: 'a', type: 'analyze', points: 1,
    payload: { multi: false, lines: [{ id: 'x' }, { id: 'y' }] }, answer: { selected: ['x'] } } ] };
  test('analyze default: exact-set match still scores 1/1',
    score(exactScn, { a: { selected: ['x'] } }).correct === 1);
  test('analyze default: wrong exact-set still scores 0/1',
    score(exactScn, { a: { selected: ['y'] } }).correct === 0);
})();
```
Also add, in the EXISTING analyze payload-validation block (`grep "bad payload"` region), an assertion that a mode step with NO `payload.lines` validates:
```js
var _modeStep = { id: 'm', type: 'analyze', prompt: 'p', explanation: 'e', points: 1,
  payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' }, answer: { selected: ['l1'] } };
var _modeScn = _baseScn(); _modeScn.steps = [_modeStep];
_modeScn.assets = { reference: { kind: 'terminal', host: 'h', session: 's',
  excerpts: [{ id: 'e', promptLine: 'p', lines: [{ id: 'l1', text: 't', select: true, evidence: true }, { id: 'l2', text: 'u', select: false }] }] } };
assert(simLabValidateScenario(_modeScn).ok === true, 'analyze mode step validates without payload.lines');
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (`analyze lenient: all-correct...` and `analyze mode step validates without payload.lines`).
- [ ] **Step 3a: `_validateStepPayload` analyze branch** — accept mode steps that omit `lines`:
```js
case 'analyze':
  if (p.mode === 'reveal' || p.mode === 'excerptLines') {
    return Array.isArray(a.selected) && a.selected.length >= 1;
  }
  return Array.isArray(p.lines) && p.lines.length >= 2 &&
         Array.isArray(a.selected) && a.selected.length >= 1;
```
- [ ] **Step 3b: `_slRenderAnalyze` mode branch** — at the TOP of the function, before the existing `var multi = ...`:
```js
// Wave 2: mode steps bind targets from the terminal reference (single source of
// truth) instead of building their own .sl-analyze-block. Default (no mode) below is UNCHANGED.
var mode = step.payload.mode;
if (mode === 'reveal' || mode === 'excerptLines') {
  return _slRenderAnalyzeMode(step, onChange, initial, mode);
}
```
Then add the helper right after `_slRenderAnalyze`:
```js
function _slRenderAnalyzeMode(step, onChange, initial, mode) {
  var multi = step.payload.multi !== false;
  var selected = (initial && Array.isArray(initial.selected)) ? initial.selected.slice() : [];
  var root = _el('div', 'sl-analyze sl-analyze-mode');
  root.appendChild(_el('p', 'sl-prompt', _esc(step.prompt)));

  function emit() { onChange({ selected: selected.slice() }); }
  function toggle(id) {
    var idx = selected.indexOf(id);
    if (multi) { if (idx === -1) selected.push(id); else selected.splice(idx, 1); }
    else { selected = (idx === -1) ? [id] : []; }
    emit();
  }

  if (mode === 'reveal') {
    // command menu: one button per reveal-keyed excerpt; running reveals + marks it ran (advisory)
    var ref = (window.__slTerminalRef) || null;
    var menu = _el('div', 'sl-cmd-menu');
    var excerpts = (ref && Array.isArray(ref.excerpts)) ? ref.excerpts : [];
    excerpts.filter(function (ex) { return ex.reveal; }).forEach(function (ex) {
      var b = _el('button', 'sl-cmd', _esc(ex.promptLine || ex.id));
      b.setAttribute('type', 'button'); b.setAttribute('data-cmd', ex.id);
      b.addEventListener('click', function () {
        if (b.classList) b.classList.add('used');
        if (window.__slRevealExcerpt) window.__slRevealExcerpt(ex.reveal);
        if (selected.indexOf(ex.id) === -1) { selected.push(ex.id); emit(); }
      });
      menu.appendChild(b);
    });
    root.appendChild(menu);
  } else {
    // excerptLines: bind the terminal's already-rendered select:true line buttons
    var host = (window.__slTerminalPanel) || null;
    var btns = host ? host.querySelectorAll('button') : [];
    btns.forEach(function (btn) {
      if (!btn.className || btn.className.split(' ').indexOf('term-line') === -1) return;
      var id = btn.getAttribute('data-line');
      btn.addEventListener('click', function () {
        toggle(id);
        if (btn.classList) btn.classList.toggle('sl-sel', selected.indexOf(id) !== -1);
      });
      if (selected.indexOf(id) !== -1 && btn.classList) btn.classList.add('sl-sel');
    });
  }
  emit();
  return root;
}
```
> **Wiring note (fold into this task):** `_slMountScenario` must publish the terminal reference + its rendered panel so the mode step can find them. In `_slMountScenario`, right after `var refPanel = _slRenderReference(scn.assets.reference);` add:
> ```js
> if (scn.assets && scn.assets.reference && scn.assets.reference.kind === 'terminal') {
>   window.__slTerminalRef = scn.assets.reference;
>   window.__slTerminalPanel = refPanel;
> } else { window.__slTerminalRef = null; window.__slTerminalPanel = null; }
> ```
> This is a generic, archetype-agnostic capability (a well-known handle, like `window.__slResponses`) — NOT a per-archetype branch. Keep the rest of `_slMountScenario` byte-identical.
- [ ] **Step 3c: `_scoreStep` analyze case + `simLabScoreScenario`** — lenient path:
```js
// in _scoreStep, replace the analyze case:
case 'analyze':
  if (step.payload && step.payload.scoring === 'lenient') {
    var _al = _scoreAnalyzeLenient(step, resp);
    return _al.total > 0 && _al.correct === _al.total;
  }
  return _setEq(resp.selected, step.answer.selected);
```
Add the helper near `_scoreConfigureSlots`:
```js
function _scoreAnalyzeLenient(step, resp) {
  var want = (step.answer && step.answer.selected) || [];
  var got = (resp && resp.selected) || [];
  var total = want.length, correct = 0;
  want.forEach(function (id) { if (got.indexOf(id) !== -1) correct++; });   // false picks never subtract
  return { total: total, correct: correct };
}
```
In `simLabScoreScenario`, treat a lenient analyze step like configure (partial credit into the running totals):
```js
scn.steps.forEach(function (st) {
  var resp = responses ? responses[st.id] : null;
  if (st.type === 'configure') {
    var sc = _scoreConfigureSlots(st, resp);
    perStep[st.id] = sc; correct += sc.correct; total += sc.total;
  } else if (st.type === 'analyze' && st.payload && st.payload.scoring === 'lenient') {
    var la = _scoreAnalyzeLenient(st, resp);
    perStep[st.id] = la; correct += la.correct; total += la.total;
  } else {
    var ok = _scoreStep(st, resp);
    perStep[st.id] = ok; if (ok) correct++; total++;
  }
});
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+6). Every pre-existing analyze scenario test MUST stay green (byte-identical default path) — if any Wave-1/v7.61.0 analyze test flips, the default branch was disturbed: revert and re-apply narrowly.
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): guarded analyze mode branch + lenient scoring (both default off)"`

### Task 4: CLI fault-isolation fidelity validator

**Files:**
- Modify: `features/sim-lab.js` (below the Wave-1 SOHO validator)
- Test: `tests/uat.js` (new block after the SOHO fidelity tests — `grep "soho: sound keyed config passes"`)

**Interfaces:**
- Consumes: `_slFidelityResolveSlot`, `_isNonEmptyStr`.
- Produces: `simLabValidateCliFaultFidelity(scn) -> {ok, errors}`; constant `_CLI_FAULT_SIG`. Task 8 content + bank test call this.

- [ ] **Step 1: Write failing tests:**
```js
(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var pieces = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'),
    'var _CLI_FAULT_SIG = ' + (js.match(/var _CLI_FAULT_SIG = \{[\s\S]*?\};/) || ['{}'])[0].replace(/^var _CLI_FAULT_SIG = /, ''),
    grab('simLabValidateCliFaultFidelity')].join('\n');
  // simpler: extract via _fnBody for the fn and grabVar for the table
  var cliBody = grab('simLabValidateCliFaultFidelity');
  var sigVar = (js.match(/var _CLI_FAULT_SIG = \{[\s\S]*?\n  \};/) || [''])[0];
  if (!cliBody || !sigVar) { results.errors.push('could not extract simLabValidateCliFaultFidelity/_CLI_FAULT_SIG'); return; }
  var cCtx = {}; vm.createContext(cCtx);
  vm.runInContext(grab('_isNonEmptyStr') + '\n' + grab('_slFidelityResolveSlot') + '\n' + sigVar + '\n' + cliBody, cCtx);
  vm.runInContext('globalThis.__cli = simLabValidateCliFaultFidelity;', cCtx);
  var cli = cCtx.__cli;

  var scn = { cliFault: { fault: 'duplex' },
    assets: { reference: { kind: 'terminal', host: 'h', session: 's', reveal: 'external',
      excerpts: [
        { id: 'ipconfig', promptLine: 'C:\\> ipconfig', reveal: 'ipconfig', necessary: true,
          lines: [ { id: 'i1', text: 'Link Speed: 1.0 Gbps / Full Duplex', highlight: 'good', select: false } ] },
        { id: 'showint', promptLine: 'SW-2# show interfaces Gi0/14', reveal: 'showint', necessary: true,
          lines: [ { id: 's1', text: 'Half-duplex, 100Mb/s', highlight: 'hot', select: false },
                   { id: 's2', text: '2471 late collisions', highlight: 'hot', select: false } ] },
        { id: 'tracert', promptLine: 'C:\\> tracert 8.8.8.8', reveal: 'tracert', necessary: false,
          lines: [ { id: 't1', text: 'path intact', select: false } ] }
      ] } },
    steps: [ { id: 'dx', type: 'configure', points: 1,
      payload: { slots: [
        { id: 'rootCause', label: 'Root cause', options: [{ id: 'a', text: 'Duplex mismatch' }, { id: 'b', text: 'DNS failure' }] },
        { id: 'fix', label: 'Fix', options: [{ id: 'a', text: 'Set both ends to auto-negotiate duplex' }, { id: 'b', text: 'Flush DNS cache' }] } ] },
      answer: { slots: { rootCause: 'a', fix: 'a' } } } ] };
  assert(cli(scn).ok === true, 'cli: sound duplex scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.slots.rootCause = 'b';
  assert(cli(bad1).ok === false, 'cli: rootCause not matching fault signature rejected');
  var bad2 = JSON.parse(JSON.stringify(scn));
  bad2.assets.reference.excerpts[1].lines = [{ id: 's1', text: 'Full-duplex, 1000Mb/s', select: false }];
  assert(cli(bad2).ok === false, 'cli: necessary excerpt missing the fault signature fact rejected');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.assets.reference.excerpts[0].necessary = true;
  bad3.assets.reference.excerpts[2].necessary = true;   // tracert (redundant) marked necessary
  assert(cli(bad3).ok === false, 'cli: a redundant excerpt marked necessary breaks minimal-cover');
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined).
- [ ] **Step 3: Implement:**
```js
// --- CLI fault-isolation fidelity validator (Wave 2 Task 4) ---
// Proves, machine-checkable: (a) the necessary excerpts carry every line-fact the
// keyed fault requires; (b) the keyed rootCause/fix configure answers match the
// fault; (c) the necessary set is a genuine minimal isolation cover (mutation-checked:
// dropping any necessary excerpt must make a required fact unreachable).
var _CLI_FAULT_SIG = {
  duplex:  { needles: [/half-?duplex/i, /late collision/i], root: /duplex/i, fix: /auto-?negoti|duplex/i },
  gateway: { needles: [/gateway/i, /request timed out|unreachable/i], root: /gateway/i, fix: /gateway|route/i },
  dns:     { needles: [/dns/i, /could not|non-existent|can'?t resolve/i], root: /dns/i, fix: /dns|resolver|flushdns/i },
  vlan:    { needles: [/vlan/i, /native vlan|access vlan/i], root: /vlan/i, fix: /vlan/i }
};
function _cliExcerptText(ex) {
  return (ex.lines || []).map(function (l) { return String(l.text || ''); }).join('\n');
}
function _cliNeedlesMet(excerpts, sig) {
  var blob = excerpts.map(_cliExcerptText).join('\n');
  return sig.needles.every(function (rx) { return rx.test(blob); });
}
function simLabValidateCliFaultFidelity(scn) {
  var errs = [];
  var ref = scn && scn.assets && scn.assets.reference;
  var fault = scn && scn.cliFault && scn.cliFault.fault;
  if (!ref || ref.kind !== 'terminal' || !Array.isArray(ref.excerpts)) {
    return { ok: false, errors: ['cli fidelity: terminal reference with excerpts[] required'] };
  }
  var sig = _CLI_FAULT_SIG[fault];
  if (!sig) return { ok: false, errors: ['cli fidelity: unknown cliFault.fault "' + fault + '"'] };

  var necessary = ref.excerpts.filter(function (ex) { return ex.necessary; });
  if (!necessary.length) errs.push('cli fidelity: no necessary excerpts declared');

  // (a) the necessary set proves the fault
  if (!_cliNeedlesMet(necessary, sig)) {
    errs.push('cli fidelity: necessary excerpts do not carry all "' + fault + '" fault facts');
  }
  // (c) minimal cover — every necessary excerpt is load-bearing
  necessary.forEach(function (drop) {
    var without = necessary.filter(function (ex) { return ex !== drop; });
    if (_cliNeedlesMet(without, sig)) {
      errs.push('cli fidelity: necessary excerpt "' + drop.id + '" is redundant (fault still derivable without it)');
    }
  });
  // (b) keyed diagnosis matches the fault
  var cfg = (scn.steps || []).filter(function (st) {
    return st.type === 'configure' && st.answer && st.answer.slots &&
      (st.answer.slots.rootCause !== undefined || st.answer.slots.fix !== undefined);
  })[0];
  if (!cfg) { errs.push('cli fidelity: no configure step with rootCause/fix slots'); }
  else {
    var root = _slFidelityResolveSlot(cfg, 'rootCause');
    var fix = _slFidelityResolveSlot(cfg, 'fix');
    if (root === undefined || !sig.root.test(root)) errs.push('cli fidelity: keyed rootCause "' + root + '" does not match ' + fault);
    if (fix === undefined || !sig.fix.test(fix)) errs.push('cli fidelity: keyed fix "' + fix + '" does not match ' + fault);
  }
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): CLI fault-isolation minimal-cover fidelity validator"`

### Task 5: Discovery-audit fidelity validator (cross-reference join)

**Files:**
- Modify: `features/sim-lab.js` (below the CLI validator)
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: `_isNonEmptyStr`, `_slFidelityResolveSlot`.
- Produces: `simLabValidateDiscoveryAuditFidelity(scn) -> {ok, errors}`; helpers `_discoLineFacts(ref)`, `_discoDerivePort(facts, port)`. Task 9 content + bank test call this.

- [ ] **Step 1: Write failing tests:**
```js
(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var body = [grab('_isNonEmptyStr'), grab('_slFidelityResolveSlot'),
    grab('_discoLineFacts'), grab('_discoDerivePort'), grab('simLabValidateDiscoveryAuditFidelity')].join('\n');
  if (body.indexOf('simLabValidateDiscoveryAuditFidelity') === -1) { results.errors.push('could not extract discovery validator'); return; }
  var dCtx = {}; vm.createContext(dCtx); vm.runInContext(body, dCtx);
  vm.runInContext('globalThis.__disco = simLabValidateDiscoveryAuditFidelity;', dCtx);
  var disco = dCtx.__disco;

  var scn = {
    disco: { legacyExcerptId: 'csv',
      ports: [ { port: 'Gi0/1', device: 'AP-2', mgmt: '10.0.0.12', source: 'lldp' },
               { port: 'Gi0/5', device: 'silent-host', mgmt: '10.0.0.30', source: 'macarp' } ] },
    assets: { reference: { kind: 'terminal', host: 'SW', session: 's', reveal: 'tabs',
      excerpts: [
        { id: 'lldp', promptLine: 'SW# show lldp', tab: 'lldp', lines: [
          { id: 'll1', text: 'Gi0/1  AP-2  10.0.0.12', select: false, fact: { port: 'Gi0/1', device: 'AP-2', mgmt: '10.0.0.12' } } ] },
        { id: 'mac', promptLine: 'SW# show mac', tab: 'mac', lines: [
          { id: 'm1', text: 'e8ff.1e44.2b90  Gi0/5', select: false, fact: { mac: 'e8ff.1e44.2b90', port: 'Gi0/5' } } ] },
        { id: 'arp', promptLine: 'SW# show arp', tab: 'arp', lines: [
          { id: 'a1', text: '10.0.0.30  e8ff.1e44.2b90', select: false, fact: { ip: '10.0.0.30', mac: 'e8ff.1e44.2b90' } } ] },
        { id: 'csv', promptLine: 'legacy asset CSV', tab: 'csv', lines: [
          { id: 'c1', text: 'Gi0/1,AP-2,10.0.0.12', select: true, fact: { port: 'Gi0/1', device: 'AP-2', mgmt: '10.0.0.12' } },
          { id: 'c2', text: 'Gi0/5,PrintSrv,10.0.0.99', select: true, fact: { port: 'Gi0/5', device: 'PrintSrv', mgmt: '10.0.0.99' } } ] }
      ] } },
    steps: [
      { id: 'rec', type: 'configure', points: 1, payload: { slots: [
        { id: 'Gi0/1__dev', label: 'Gi0/1 dev', options: [{ id: 'a', text: 'AP-2' }, { id: 'b', text: 'PC-9' }] },
        { id: 'Gi0/1__ip', label: 'Gi0/1 ip', options: [{ id: 'a', text: '10.0.0.12' }, { id: 'b', text: '10.0.0.99' }] },
        { id: 'Gi0/5__ip', label: 'Gi0/5 ip', options: [{ id: 'a', text: '10.0.0.30' }, { id: 'b', text: '10.0.0.99' }] } ] },
        answer: { slots: { 'Gi0/1__dev': 'a', 'Gi0/1__ip': 'a', 'Gi0/5__ip': 'a' } } },
      { id: 'aud', type: 'analyze', points: 1, payload: { multi: false, mode: 'excerptLines' },
        answer: { selected: ['c2'] } } ] };
  assert(disco(scn).ok === true, 'disco: sound cross-referenced scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.slots['Gi0/5__ip'] = 'b';   // 10.0.0.99, not the ARP join
  assert(disco(bad1).ok === false, 'disco: keyed silent-host IP not derivable from MAC×ARP rejected');
  var bad2 = JSON.parse(JSON.stringify(scn)); bad2.steps[1].answer.slots = undefined; bad2.steps[1].answer.selected = ['c1'];  // wrong contradicting row
  assert(disco(bad2).ok === false, 'disco: keyed audit line is not the contradicting row rejected');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.assets.reference.excerpts[3].lines[1].fact = { port: 'Gi0/5', device: 'silent-host', mgmt: '10.0.0.30' };  // now consistent → zero contradictions
  assert(disco(bad3).ok === false, 'disco: exactly-one-contradiction invariant enforced (zero contradictions rejected)');
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined).
- [ ] **Step 3: Implement:**
```js
// --- discovery-audit fidelity validator (Wave 2 Task 5) ---
// Proves, machine-checkable: (a) every keyed port answer is DERIVABLE from the
// terminal excerpts' structured line facts — infra ports from LLDP, the silent
// host from a MAC-table<->ARP join; (b) exactly ONE legacy-CSV select:true row
// contradicts the reconciled truth and it is the keyed audit line (mutation-safe).
function _discoLineFacts(ref) {
  var by = { lldp: [], mac: [], arp: [], legacy: [] };
  (ref.excerpts || []).forEach(function (ex) {
    (ex.lines || []).forEach(function (ln) {
      if (!ln.fact) return;
      if (ex.id === 'lldp') by.lldp.push(ln.fact);
      else if (ex.id === 'mac') by.mac.push(ln.fact);
      else if (ex.id === 'arp') by.arp.push(ln.fact);
    });
  });
  return by;
}
function _discoDerivePort(facts, port) {
  var l = facts.lldp.filter(function (f) { return f.port === port; })[0];
  if (l) return { device: l.device, mgmt: l.mgmt };
  var m = facts.mac.filter(function (f) { return f.port === port; })[0];
  if (m) {
    var a = facts.arp.filter(function (f) { return f.mac === m.mac; })[0];
    if (a) return { device: null, mgmt: a.ip };   // silent host: device unknown, IP via join
  }
  return null;
}
function simLabValidateDiscoveryAuditFidelity(scn) {
  var errs = [];
  var ref = scn && scn.assets && scn.assets.reference;
  var disco = scn && scn.disco;
  if (!ref || ref.kind !== 'terminal' || !Array.isArray(ref.excerpts) || !disco || !Array.isArray(disco.ports)) {
    return { ok: false, errors: ['disco fidelity: terminal reference + scn.disco.ports[] required'] };
  }
  var facts = _discoLineFacts(ref);
  var cfg = (scn.steps || []).filter(function (st) { return st.type === 'configure'; })[0];

  // (a) every keyed port answer derivable
  disco.ports.forEach(function (p) {
    var derived = _discoDerivePort(facts, p.port);
    if (!derived) { errs.push('disco: port ' + p.port + ' not derivable from excerpts'); return; }
    if (derived.mgmt !== p.mgmt) errs.push('disco: port ' + p.port + ' mgmt "' + p.mgmt + '" != derived ' + derived.mgmt);
    if (cfg) {
      var keyedIp = _slFidelityResolveSlot(cfg, p.port + '__ip');
      if (keyedIp !== undefined && keyedIp !== derived.mgmt) {
        errs.push('disco: keyed ' + p.port + '__ip "' + keyedIp + '" != derived ' + derived.mgmt);
      }
      var keyedDev = _slFidelityResolveSlot(cfg, p.port + '__dev');
      if (keyedDev !== undefined && p.device && derived.device && keyedDev !== derived.device) {
        errs.push('disco: keyed ' + p.port + '__dev "' + keyedDev + '" != derived ' + derived.device);
      }
    }
  });

  // (b) exactly one legacy row contradicts, and it is the keyed audit line
  var truthByPort = {};
  disco.ports.forEach(function (p) { truthByPort[p.port] = p; });
  var legacy = (ref.excerpts.filter(function (ex) { return ex.id === disco.legacyExcerptId; })[0] || { lines: [] }).lines
    .filter(function (ln) { return ln.select && ln.fact; });
  var contradicting = legacy.filter(function (ln) {
    var truth = truthByPort[ln.fact.port];
    return truth && (ln.fact.mgmt !== truth.mgmt || (ln.fact.device && truth.device && ln.fact.device !== truth.device));
  });
  if (contradicting.length !== 1) {
    errs.push('disco: expected exactly 1 contradicting legacy row, found ' + contradicting.length);
  } else {
    var aud = (scn.steps || []).filter(function (st) { return st.type === 'analyze'; })[0];
    var keyed = aud && aud.answer && aud.answer.selected;
    if (!keyed || keyed.length !== 1 || keyed[0] !== contradicting[0].id) {
      errs.push('disco: keyed audit line is not the single contradicting row (' + contradicting[0].id + ')');
    }
  }
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): discovery-audit cross-reference fidelity validator"`

### Task 6: Evidence-triage fidelity validator

**Files:**
- Modify: `features/sim-lab.js` (below the discovery validator)
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: `_slFidelityResolveSlot`.
- Produces: `simLabValidateEvidenceTriageFidelity(scn) -> {ok, errors}`; constant `_TRIAGE_FAULT_SIG`; helper `_triageEvidenceLines(ref)`. Task 10 content + bank test call this.

- [ ] **Step 1: Write failing tests:**
```js
(function () {
  var grab = function (n) { return _fnBody(js, n); };
  var sigVar = (js.match(/var _TRIAGE_FAULT_SIG = \{[\s\S]*?\n  \};/) || [''])[0];
  var body = [grab('_slFidelityResolveSlot'), sigVar, grab('_triageEvidenceLines'), grab('simLabValidateEvidenceTriageFidelity')].join('\n');
  if (!sigVar || body.indexOf('simLabValidateEvidenceTriageFidelity') === -1) { results.errors.push('could not extract triage validator'); return; }
  var tCtx = {}; vm.createContext(tCtx); vm.runInContext(body, tCtx);
  vm.runInContext('globalThis.__tri = simLabValidateEvidenceTriageFidelity;', tCtx);
  var tri = tCtx.__tri;

  var scn = { triage: { fault: 'apipa' },
    assets: { reference: { kind: 'terminal', host: 'LAPTOP', session: 's',
      excerpts: [ { id: 'ipcfg', promptLine: 'C:\\> ipconfig /all', lines: [
        { id: 'e1', text: 'Media State: Media connected', select: true, evidence: false },
        { id: 'e2', text: 'IPv4 Address: 169.254.83.12(Preferred)', select: true, evidence: true },
        { id: 'e3', text: 'Default Gateway:', select: true, evidence: true },
        { id: 'e4', text: 'Description: Intel Wi-Fi 6', select: false, ctx: true } ] } ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1, payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['e2', 'e3'] } },
      { id: 'dx', type: 'configure', points: 1, payload: { slots: [
        { id: 'diagnosis', label: 'Diagnosis', options: [{ id: 'a', text: 'APIPA — no DHCP lease' }, { id: 'b', text: 'Bad DNS server' }] },
        { id: 'firstMove', label: 'First move', options: [{ id: 'a', text: 'Run ipconfig /renew' }, { id: 'b', text: 'Replace the NIC' }] } ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } } ] };
  assert(tri(scn).ok === true, 'triage: sound APIPA scenario passes');
  var bad1 = JSON.parse(JSON.stringify(scn)); bad1.steps[0].answer.selected = ['e1', 'e2', 'e3'];  // includes the false trap
  assert(tri(bad1).ok === false, 'triage: keyed selected including an evidence:false trap rejected');
  var bad2 = JSON.parse(JSON.stringify(scn));
  bad2.assets.reference.excerpts[0].lines[0].evidence = true;   // no false distractor left among selectable lines
  bad2.steps[0].answer.selected = ['e1', 'e2', 'e3'];
  assert(tri(bad2).ok === false, 'triage: all-true selectable set (no scored distractor) rejected');
  var bad3 = JSON.parse(JSON.stringify(scn)); bad3.steps[1].answer.slots.firstMove = 'b';
  assert(tri(bad3).ok === false, 'triage: firstMove not following from evidence rejected');
})();
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (undefined).
- [ ] **Step 3: Implement:**
```js
// --- evidence-triage fidelity validator (Wave 2 Task 6) ---
// Proves, machine-checkable: (a) the keyed evidence lines (evidence:true) exist,
// are exactly the analyze step's answer.selected, and are diagnostic of the fault;
// at least one selectable evidence:false distractor remains (the "Media connected"
// trap) so the set can't be trivially all-true; (b) the diagnosis/firstMove keyed
// answers follow from the fault signature.
var _TRIAGE_FAULT_SIG = {
  apipa:    { evNeedles: [/169\.254\./, /gateway\s*:?\s*$/i], diag: /apipa|169\.254|no dhcp/i, fix: /renew|dhcp/i },
  deadDns:  { evNeedles: [/can'?t resolve|dns request timed out|non-existent/i], diag: /dns/i, fix: /dns|renew|flushdns/i },
  badGw:    { evNeedles: [/unreachable|request timed out/i, /gateway/i], diag: /gateway|route/i, fix: /gateway|route/i }
};
function _triageEvidenceLines(ref) {
  var all = [];
  (ref.excerpts || []).forEach(function (ex) {
    (ex.lines || []).forEach(function (ln) { all.push(ln); });
  });
  return all;
}
function simLabValidateEvidenceTriageFidelity(scn) {
  var errs = [];
  var ref = scn && scn.assets && scn.assets.reference;
  var fault = scn && scn.triage && scn.triage.fault;
  if (!ref || ref.kind !== 'terminal' || !Array.isArray(ref.excerpts)) {
    return { ok: false, errors: ['triage fidelity: terminal reference with excerpts[] required'] };
  }
  var sig = _TRIAGE_FAULT_SIG[fault];
  if (!sig) return { ok: false, errors: ['triage fidelity: unknown triage.fault "' + fault + '"'] };

  var lines = _triageEvidenceLines(ref);
  var selectable = lines.filter(function (l) { return l.select; });
  var trueLines = selectable.filter(function (l) { return l.evidence === true; });
  var falseLines = selectable.filter(function (l) { return l.evidence === false; });

  if (!trueLines.length) errs.push('triage: no evidence:true selectable lines');
  if (!falseLines.length) errs.push('triage: no evidence:false selectable distractor (set is trivially all-true)');

  // (a) keyed selected == the evidence:true line ids
  var flag = (scn.steps || []).filter(function (st) { return st.type === 'analyze'; })[0];
  var keyed = (flag && flag.answer && flag.answer.selected) ? flag.answer.selected.slice().sort() : [];
  var trueIds = trueLines.map(function (l) { return l.id; }).sort();
  if (keyed.join(',') !== trueIds.join(',')) {
    errs.push('triage: keyed selected [' + keyed.join(',') + '] != evidence:true ids [' + trueIds.join(',') + ']');
  }
  // diagnostic signature present in the true lines
  var trueBlob = trueLines.map(function (l) { return String(l.text || ''); }).join('\n');
  sig.evNeedles.forEach(function (rx) {
    if (!rx.test(trueBlob)) errs.push('triage: fault "' + fault + '" needle ' + rx + ' not found in flagged evidence');
  });
  // (b) keyed diagnosis/firstMove follow from the fault
  var cfg = (scn.steps || []).filter(function (st) {
    return st.type === 'configure' && st.answer && st.answer.slots &&
      (st.answer.slots.diagnosis !== undefined || st.answer.slots.firstMove !== undefined);
  })[0];
  if (!cfg) errs.push('triage: no configure step with diagnosis/firstMove slots');
  else {
    var diag = _slFidelityResolveSlot(cfg, 'diagnosis');
    var fix = _slFidelityResolveSlot(cfg, 'firstMove');
    if (diag === undefined || !sig.diag.test(diag)) errs.push('triage: keyed diagnosis "' + diag + '" does not match ' + fault);
    if (fix === undefined || !sig.fix.test(fix)) errs.push('triage: keyed firstMove "' + fix + '" does not match ' + fault);
  }
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): evidence-triage fidelity validator"`

### Task 7: CSS — lift the `.term*` token block into `dg-system.css`

**Files:**
- Modify: `dg-system.css` (append a scoped `/* Sim Lab terminal reference (Wave 2) */` block; define EVERY token used)
- Modify: `index.html` (bump `dg-system.css?v=7.61.2` → `?v=7.61.3` — hand-bump the query ONLY; verify the exact current value with `grep -ao "dg-system.css?v=[0-9.]*" index.html` first)
- Modify: `CLAUDE.md` (ONE factual line — see freshness-gate path below; index.html changes trip the pre-commit CLAUDE.md-freshness check)
- Test: none new — the existing Wave-1 ratchet guard (`grep "dg-system.css var() tokens all defined"`) enforces it.

**Interfaces:**
- Consumes: existing tokens `--ink`, `--surface`, `--border`, `--accent`, `--pass`, `--fail`, `--muted`, `--ink-soft`, `--border-soft`, `--ease` (defined or baselined in `KNOWN_GAPS`).
- Produces: `.term`, `.term-head`, `.term-host`, `.term-sess`, `.term-body`, `.term-empty`, `.term-block`, `.term-scroll`, `.term-cmd`, `.term-out`, `.term-line`, `.term-ln`, `.term-ctx`, `.term-tabs`, `.term-tab`, `.term-anim`, `@keyframes termIn`. Tokens only, zero hex.

- [ ] **Step 1: Verify current state** — `grep -a "dg-system.css?v=" index.html` (record the current `?v=`); `node tests/uat.js` green. Note which tokens the lifted block references that are NOT yet defined and NOT in `KNOWN_GAPS` (`--ink`, `--ink-soft`, `--surface`, `--border`, `--accent`, `--pass`, `--fail` are defined; `--border-soft`, `--ease`, `--muted` are baselined gaps — do NOT rely on baselined gaps for NEW selectors if a defined token exists).
- [ ] **Step 2: Append the block** to `dg-system.css` (faithful lift of the mockups' `.term*` CSS — tokens only, ZERO hex; `color-mix` allowed). Every `var(--x)` below must resolve to a DEFINED token (not a `KNOWN_GAPS` baseline) or the ratchet guard fails:
```css
/* ── Sim Lab terminal / output-excerpt reference (Wave 2) ── */
.term { margin: 8px 0; background: color-mix(in oklab, var(--ink) 7%, var(--surface)); border: 1px solid var(--border); border-radius: 13px; overflow: hidden; }
.term-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 13px; border-bottom: 1px solid var(--border); background: color-mix(in oklab, var(--ink) 5%, transparent); }
.term-host { display: flex; align-items: center; gap: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; font-weight: 700; color: var(--ink-soft); }
.term-host .lamp { display: grid; grid-template-columns: repeat(3, 5px); gap: 3px; }
.term-host .lamp i { width: 5px; height: 5px; border-radius: 50%; background: color-mix(in oklab, var(--ink-soft) 45%, transparent); }
.term-sess { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px; font-weight: 600; color: var(--ink-soft); }
.term-body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.5; color: var(--ink-soft); padding: 4px 0 6px; max-height: 430px; overflow-y: auto; }
.term-empty { padding: 30px 16px; color: var(--ink-soft); font-size: 12px; text-align: center; font-style: italic; }
.term-block { padding: 7px 6px 9px; }
.term-block + .term-block { border-top: 1px dashed var(--border); }
.term-scroll { overflow-x: auto; padding: 0 11px; }
.term-cmd { white-space: pre; color: var(--ink); font-weight: 700; }
.term-cmd .pmt { color: var(--accent); }
.term-out { white-space: pre; margin-top: 3px; }
.term-out .k, .term-ctx { color: var(--ink-soft); }
.term-out .hot, .term-line .hot { color: var(--fail); font-weight: 700; }
.term-out .good, .term-line .good { color: var(--ink); font-weight: 700; }
.term-ln { white-space: pre; }
.term-line { display: block; width: 100%; text-align: left; white-space: pre; font: inherit; color: var(--ink-soft); background: transparent; border: 1px solid transparent; border-radius: 6px; padding: 1px 5px; cursor: pointer; }
.term-line:focus-visible { outline: none; border-color: color-mix(in oklab, var(--accent) 55%, var(--border)); box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 16%, transparent); }
.term-line.sl-sel { border-color: color-mix(in oklab, var(--accent) 40%, var(--border)); background: color-mix(in oklab, var(--accent) 10%, transparent); }
.term-tabs { display: flex; flex-wrap: wrap; gap: 6px; padding: 9px 11px 3px; }
.term-tab { font-family: ui-monospace, Menlo, monospace; font-size: 11px; font-weight: 700; color: var(--ink-soft); background: transparent; border: 1px solid var(--border); border-radius: 7px; padding: 4px 9px; cursor: pointer; }
.term-tab.on { color: var(--accent); border-color: color-mix(in oklab, var(--accent) 34%, var(--border)); background: color-mix(in oklab, var(--accent) 9%, transparent); }
.term-tab.seen::after { content: " ✓"; color: var(--pass); }
.term-anim { animation: termIn .34s ease; }
@keyframes termIn { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .term-anim { animation: none !important; } }
```
> **Note:** the mockups used `--muted`, `--border-soft`, `--ease` (baselined `KNOWN_GAPS`). The lift above substitutes DEFINED tokens (`--ink-soft` for `--muted`, `--border` for `--border-soft`, literal `ease` for `--ease`) so NO new bare `var()` references a baselined gap — the ratchet guard passes without touching `KNOWN_GAPS`. Do NOT add `.term*` tokens to `KNOWN_GAPS`.
- [ ] **Step 3: Bump the CSS query** — in `index.html` change `dg-system.css?v=7.61.2` to `dg-system.css?v=7.61.3` (grep the exact current value first; do NOT run `bump-version.js`).
- [ ] **Step 4: Freshness-gate path (Wave-1 sanctioned)** — the pre-commit hook's CLAUDE.md-freshness check fires because `index.html` changed. Add ONE factual line under the "CSS Theme System" section of `CLAUDE.md` (e.g. `The Sim Lab terminal reference (.term*) tokens live in dg-system.css (Wave 2).`) so the freshness gate passes without bloating the file. This is a documented one-liner, NOT a version-table edit.
- [ ] **Step 5: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+0; the ratchet guard stays green because every new `var()` is defined). If it names a new missing token, DEFINE it (tokens only, never hex) — do NOT baseline it.
- [ ] **Step 6: Commit** `git add dg-system.css index.html CLAUDE.md && git commit -m "style(sim-lab): terminal reference token block in dg-system.css"`

### Task 8: Author + gate + integrate the Net+ CLI Fault Isolation bank (10-12)

**Files:**
- Create (scratch, gitignored): `.superpowers/sdd/wave2/validate-drafts.js`, `.superpowers/sdd/wave2/cli-drafts.js`
- Modify: `features/sim-lab-seed-netplus.js` (append inside `window.SIM_LAB_SEED_NETPLUS = [...]`)
- Test: `tests/uat.js` (bank test — mirror the Wave-1 wireless bank block, `grep "Net+ Diagram bank: window.SIM_LAB_SEED_NETPLUS loaded"`)

**Interfaces:**
- Consumes: Task 1 tag, Task 4 validator, CLI conventions from Reference contracts.
- Produces: 10-12 scenarios `archetype:'cli'`, ids `np-cli-NN`, netplus bank; the scratch harness reused by Tasks 9-10.

- [ ] **Step 1: Create the draft-validation harness** at `.superpowers/sdd/wave2/validate-drafts.js` — it brace-extracts the REAL validators from `features/sim-lab.js` (never reimplement) and dispatches a drafts file by archetype (extended from the Wave-1 harness to cover the three Wave-2 validators + their fault-signature tables):
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
  var re = new RegExp('var\\s+' + name + '\\s*=\\s*(\\[[\\s\\S]*?\\]|\\{[\\s\\S]*?\\n  \\});');
  var m = re.exec(src);
  if (!m) throw new Error('missing var ' + name);
  return m[0];
}
var pieces = [
  extractVar(SRC, 'STEP_TYPES'),
  extractFunction(SRC, '_isNonEmptyStr'), extractFunction(SRC, '_validateStepPayload'),
  extractFunction(SRC, 'simLabValidateScenario'),
  extractFunction(SRC, '_ipToInt'), extractFunction(SRC, '_maskToInt'), extractFunction(SRC, '_inSubnet'),
  extractFunction(SRC, '_slFidelityResolveSlot'),
  extractVar(SRC, '_CLI_FAULT_SIG'),
  extractFunction(SRC, '_cliExcerptText'), extractFunction(SRC, '_cliNeedlesMet'),
  extractFunction(SRC, 'simLabValidateCliFaultFidelity'),
  extractFunction(SRC, '_discoLineFacts'), extractFunction(SRC, '_discoDerivePort'),
  extractFunction(SRC, 'simLabValidateDiscoveryAuditFidelity'),
  extractVar(SRC, '_TRIAGE_FAULT_SIG'),
  extractFunction(SRC, '_triageEvidenceLines'),
  extractFunction(SRC, 'simLabValidateEvidenceTriageFidelity')
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
  if (s.archetype === 'cli') { f = sb.simLabValidateCliFaultFidelity(s); }
  else if (s.archetype === 'discovery') { f = sb.simLabValidateDiscoveryAuditFidelity(s); }
  else if (s.archetype === 'triage') { f = sb.simLabValidateEvidenceTriageFidelity(s); }
  if (f && !f.ok) { console.log('FAIL  ' + tag + '  fidelity: ' + f.errors.join('; ')); fails++; }
  if ((!f || f.ok) && r.ok) console.log('pass  ' + tag);
});
console.log('\n' + (fails === 0 ? 'ALL DRAFTS VALID' : fails + ' FAILURE(S)') + '  (' + scenarios.length + ' scenarios)');
process.exit(fails === 0 ? 0 : 1);
```
Run as: `node .superpowers/sdd/wave2/validate-drafts.js <drafts-file.js>` (drafts file does `module.exports = [ ... ]`). Note `__dirname, '..','..','..'` — harness two levels under `.superpowers/`, `sim-lab.js` at repo-root/features. If `extractVar` fails to bound a `_*_SIG` object, adjust the closing-brace anchor to match the actual indentation (the tables close on a line of `  };`).
- [ ] **Step 2: Author 10-12 CLI drafts** in `cli-drafts.js` (`module.exports = [...]`), house scenario shape (`id/cert:'netplus'/objective/topic/title/estMinutes/archetype:'cli'/scenario/cliFault/assets.reference(kind:'terminal',reveal:'external')/steps`). Each: a `terminal` reference with 4-6 command excerpts (each `reveal:'<id>'`; the minimal isolation cover marked `necessary:true`, the rest distractor commands); a reveal-mode analyze command menu step (`payload.mode:'reveal'`, `payload.multi:true`, `payload.scoring:'lenient'`, `answer.selected` = the necessary excerpt ids); a `configure` diagnose+fix step (slots `rootCause`,`fix`). Vary faults across `_CLI_FAULT_SIG` keys (duplex / gateway / dns / vlan) plus realistic multi-command isolation paths. Objectives: N10-009 5.x (troubleshooting) + 5.3 tools. Run `node .superpowers/sdd/wave2/validate-drafts.js .superpowers/sdd/wave2/cli-drafts.js` until `ALL DRAFTS VALID`.
- [ ] **Step 3: TWO-AGENT GATE per scenario** — dispatch Agent A (Net+ network engineer: the excerpts are technically real, the necessary set is genuinely minimal, distractor commands are plausible-but-non-diagnostic, single clear fault) and Agent B (CompTIA N10-009 examiner: objective mapping, exam realism, the keyed rootCause/fix are what CompTIA accepts, difficulty). Revise-until-BOTH-approve; re-gate only revised scenarios. No scenario proceeds without consensus.
- [ ] **Step 4: Integrate** — append approved scenarios into `window.SIM_LAB_SEED_NETPLUS` (before the closing `];`, matching file formatting; strip any `module.exports` residue; ids `np-cli-NN` collide with nothing). Byte-identity check: the integrated object literals must be character-for-character the gated drafts (diff each).
- [ ] **Step 5: Add the UAT bank test** — mirror the Wave-1 wireless-bank block: vm-populate `window.SIM_LAB_SEED_NETPLUS`, extract the real validators (same set as the harness), filter `archetype === 'cli'`, assert `count >= 10`, every scenario passes `simLabValidateScenario` AND `simLabValidateCliFaultFidelity`, and every `cert === 'netplus'`.
- [ ] **Step 6: Run** `node tests/uat.js` → `ALL PASS ✓`; `node tests/tech-debt.js` → clean.
- [ ] **Step 7: Commit** `git add features/sim-lab-seed-netplus.js tests/uat.js && git commit -m "content(sim-lab): Net+ CLI Fault Isolation seed bank (2-agent gated)"`

### Task 9: Author + gate + integrate the Net+ Discovery Audit bank (10-12)

**Files:**
- Create (scratch): `.superpowers/sdd/wave2/discovery-drafts.js`
- Modify: `features/sim-lab-seed-netplus.js`
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: harness from Task 8 Step 1; Task 5 validator; discovery conventions (`scn.disco.ports`, line `fact` fields, `reveal:'tabs'`, reconcile configure slots `<port>__dev`/`<port>__ip`, records-audit analyze `mode:'excerptLines'`,`multi:false`).
- Produces: 10-12 scenarios `archetype:'discovery'`, ids `np-disc-NN`, netplus bank.

- [ ] **Step 1: Author 10-12 drafts** in `discovery-drafts.js`: each a `terminal` reference (`reveal:'tabs'`) with `lldp`/`mac`/`arp` source excerpts (structured `fact` on each line) plus a `csv` legacy excerpt (`select:true` rows with `fact`); a reconcile `configure` step (rows of `<port>__dev`/`<port>__ip` keyed selects; at least one SILENT host derivable only by MAC×ARP join — the crux); a records-audit `analyze` step (`mode:'excerptLines'`, `multi:false`, `answer.selected` = the single contradicting legacy row). Exactly ONE legacy row must contradict truth. Objectives: N10-009 3.x (network operations / documentation) + 5.3. Run the harness until `ALL DRAFTS VALID`.
- [ ] **Step 2: TWO-AGENT GATE per scenario** — Agent A: Net+ network engineer (LLDP/MAC/ARP outputs realistic, the silent-host join is genuinely the only derivation, the legacy contradiction is plausible); Agent B: N10-009 examiner. Consensus required.
- [ ] **Step 3: Integrate** into `window.SIM_LAB_SEED_NETPLUS` (ids `np-disc-NN`; byte-identity diff per scenario; no id collisions with `np-cli-*` or existing ids).
- [ ] **Step 4: UAT bank test** — filter `archetype === 'discovery'`: `count >= 10`; every scenario passes `simLabValidateScenario` AND `simLabValidateDiscoveryAuditFidelity`; plus a cross-check that each scenario's records-audit `answer.selected` has length 1 and the reconcile configure step defines a `<port>__ip` slot for every `scn.disco.ports[*].port`:
```js
bank.filter(function (s) { return s.archetype === 'discovery'; }).forEach(function (s) {
  var cfg = s.steps.filter(function (st) { return st.type === 'configure'; })[0];
  var aud = s.steps.filter(function (st) { return st.type === 'analyze'; })[0];
  var haveIpSlots = s.disco.ports.every(function (p) {
    return cfg.payload.slots.some(function (sl) { return sl.id === p.port + '__ip'; });
  });
  test('disco ' + s.id + ': every port has an __ip reconcile slot + single audit pick',
    haveIpSlots && aud && aud.answer.selected.length === 1);
});
```
- [ ] **Step 5: Run** `node tests/uat.js` → `ALL PASS ✓`; tech-debt clean.
- [ ] **Step 6: Commit** `git add features/sim-lab-seed-netplus.js tests/uat.js && git commit -m "content(sim-lab): Net+ Network Discovery Audit seed bank (2-agent gated)"`

### Task 10: Author + gate + integrate the A+ Core 1 Evidence Triage bank (10-12)

**Files:**
- Create (scratch): `.superpowers/sdd/wave2/triage-drafts.js`
- Modify: `features/sim-lab-seed-aplus-core1.js` (append inside `window.SIM_LAB_SEED_APLUS_CORE1 = [...]`)
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: harness; Task 6 validator; triage conventions (`scn.triage.fault`, evidence lines, flag-evidence analyze `mode:'excerptLines'`,`multi:true`,`scoring:'lenient'`, configure slots `diagnosis`/`firstMove`).
- Produces: 10-12 scenarios `archetype:'triage'`, cert `aplus-core1`, ids `a1-cot-NN`.

- [ ] **Step 1: Author 10-12 drafts** in `triage-drafts.js`: client/SOHO troubleshooting tickets, each a `terminal` reference (no `reveal` — all visible) of `ipconfig`/`ping`/`nslookup` output; evidence lines `select:true` with `evidence:true|false` (EVERY scenario keeps at least one `evidence:false` selectable trap — e.g. the "Media connected" line — so the set is never trivially all-true); context lines `select:false, ctx:true`; a flag-evidence `analyze` step (`mode:'excerptLines'`, `multi:true`, `scoring:'lenient'`, `answer.selected` = the evidence:true ids); a `configure` diagnose+fix step (slots `diagnosis`,`firstMove`). Vary faults across `_TRIAGE_FAULT_SIG` (apipa / deadDns / badGw). **Examiner lens: 220-1201 obj 5.7** — client/SOHO vocabulary (APIPA, DHCP lease, `ipconfig /renew`), NOT Net+ depth. Run the harness until `ALL DRAFTS VALID`.
- [ ] **Step 2: TWO-AGENT GATE per scenario** — Agent A: field technician / help-desk (outputs are real Windows output, the trap line is a genuine gotcha, the fault is unambiguous); Agent B: **CompTIA 220-1201 examiner** (A+ scope — no enterprise depth; terminology per A+ objectives). Consensus required.
- [ ] **Step 3: Integrate** into `window.SIM_LAB_SEED_APLUS_CORE1` (ids `a1-cot-NN`; byte-identity diff; verify no collision with existing `SIM_LAB_SEED_APLUS_CORE1` / `a1-soho-*` ids).
- [ ] **Step 4: UAT bank test** — vm-populate `window.SIM_LAB_SEED_APLUS_CORE1` (eval `features/sim-lab-seed-aplus-core1.js` source), filter `archetype === 'triage'`: `count >= 10`, every scenario passes `simLabValidateScenario` AND `simLabValidateEvidenceTriageFidelity`, every `cert === 'aplus-core1'`, plus a non-vacuity cross-check that each scenario has at least one `evidence:false` selectable line:
```js
bank.filter(function (s) { return s.archetype === 'triage'; }).forEach(function (s) {
  var lines = []; s.assets.reference.excerpts.forEach(function (ex) { (ex.lines || []).forEach(function (l) { lines.push(l); }); });
  var hasFalse = lines.some(function (l) { return l.select && l.evidence === false; });
  test('triage ' + s.id + ': keeps a scored evidence:false distractor', hasFalse);
});
```
- [ ] **Step 5: Run** `node tests/uat.js` → `ALL PASS ✓`; tech-debt clean.
- [ ] **Step 6: Commit** `git add features/sim-lab-seed-aplus-core1.js tests/uat.js && git commit -m "content(sim-lab): A+ Core 1 Command-Output Evidence Triage seed bank (2-agent gated)"`

### Task 11: Vertical-slice mount + score tests (one per archetype)

**Files:**
- Test: `tests/uat.js` only (mirror the v7.61.0/Wave-1 Task-9 end-to-end block — `grep "DEV FIXTURE ONLY"` / `_slMountScenario` in tests: vm sandbox + DOM shim + `window.__slActiveSubmit`). Use the SAME extended shim from Task 2 (with `classList`/`removeAttribute`/`_fire`) so the terminal renderer + mode analyze steps run.

**Interfaces:**
- Consumes: real bank scenarios from Tasks 8-10 (gated content — allowed in tests), `_slMountScenario`, `simLabScoreScenario`, `_slRenderRefTerminal`, the analyze mode branch.
- Produces: proof the three archetypes render + score through the existing Practice path with zero wiring changes beyond Task 3's published handles.

- [ ] **Step 1: Write the tests** — for each of: first `archetype==='cli'` (netplus), first `archetype==='discovery'` (netplus), first `archetype==='triage'` (aplus-core1): mount via the existing `_slMountScenario(host, scn, {onSubmit})` call shape in the vm/DOM shim; assert:
  - (a) the mounted node contains a `.term` component (terminal reference rendered) and the configure `<select>`s;
  - (b) **CLI reveal path:** firing a `.sl-cmd` command button `_fire('click')` calls `window.__slRevealExcerpt` and un-`[hidden]`s its excerpt block; then selecting every keyed-correct configure option + (for triage/cli lenient steps) flagging every keyed evidence/necessary line and submitting yields `correct === total` from `simLabScoreScenario`;
  - (c) **lenient-evidence path (triage):** flagging all `evidence:true` lines PLUS one `evidence:false` line still scores `correct === total` (false pick doesn't subtract) — the leniency contract;
  - (d) a negative control (one wrong configure slot) scores `correct < total`.
  Follow the existing block's `grab()` extraction + guard-clause style exactly; extract the full renderer/score/mount chain (`_el`,`_esc`,`_slAttr`,`simLabRenderStep`,`_slRenderConfigure`,`_slRenderAnalyze`,`_slRenderAnalyzeMode`,`_slRenderRefTerminal`,`_slRenderReference`,`_slMountScenario`,`_scoreConfigureSlots`,`_scoreAnalyzeLenient`,`_scoreStep`,`simLabScoreScenario`). No hardcoded global counts.
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: `ALL PASS ✓`. If any archetype fails to mount/score, that is a REAL wiring gap: STOP, diagnose via `node scripts/graphq.js callers _slMountScenario`, fix minimally in `features/sim-lab.js` (respecting the "no new renderer / no mount rewrite" scope — only the Task-3 published-handle wiring is in scope), and note it in the commit.
- [ ] **Step 3: Commit** `git add tests/uat.js && git commit -m "test(sim-lab): Wave 2 archetype vertical slices through Practice path"`

### Task 12: Live browser verification (all three archetypes)

**Files:** none expected (fixes only if found)

- [ ] **Step 1:** Serve locally (`preview_start certanvil-local` → localhost:3140; unregister the SW + clear caches + navigate with `?_cb=<version>` — the stale-SW lesson). 🚨 NEVER write user-state localStorage on prod / `*.vercel.app` hosts (data-loss rule).
- [ ] **Step 2:** Force the netplus bank to one `cli` scenario (localhost only: save + swap `window.SIM_LAB_SEED_NETPLUS`), run a full Practice round via real clicks: terminal reference renders (host/session chrome, empty until a command runs), the command menu reveals excerpts one at a time with the `termIn` animation, selectable/diagnose selects work, submit scores, result correct. Repeat for a `discovery` scenario (source-tab reveal, single-pick audit line) and — with cert switched to A+ Core 1 — a `triage` scenario (all excerpts visible, multi-select evidence lines, leniency: a wrong pick doesn't reduce the score).
- [ ] **Step 3:** Check COMPUTED styles, not just DOM: no black fills (token guard makes it impossible), `.pmt` prompt token in `--accent`, `.hot` lines in `--fail`, selected `.term-line` tinted. **The terminal's `overflow-x` containment at 375px** — wide output scrolls inside `.term-scroll`, the page body does NOT scroll horizontally (the split parents keep `min-width:0`). Reduced-motion: NO `termIn` animation under `prefers-reduced-motion: reduce`.
- [ ] **Step 4:** Preview screenshot races paint — after any reveal/tab interaction, wait for paint (rAF/settle) before asserting computed styles or screenshotting. Zero console errors across all three. Any defect: fix, re-run UAT, commit `fix(sim-lab): <what> (wave-2 live verify)`.
- [ ] **Step 5:** `npm run test:ios` (webkit + mobile-safari Playwright) → all pass. No commit if clean.

### Task 13: Final review + ship v7.63.0

- [ ] **Step 1:** Final whole-branch review per superpowers:subagent-driven-development (review package from `git merge-base main HEAD`; reviewers do NOT `git stash`); fix Critical/Important findings. Confirm each fidelity validator is NON-vacuous (mutation-check: each rejects a deliberately corrupted excerpt/key — already encoded in the Task 4/5/6 negative tests).
- [ ] **Step 2:** Full gates: `node tests/uat.js` && `node tests/tech-debt.js` && `npx playwright test`.
- [ ] **Step 3:** `node scripts/bump-version.js 7.63.0 "Sim Lab Wave 2 PBQs: CLI Fault Isolation, Network Discovery Audit, Command-Output Evidence Triage"` — then RE-READ `CLAUDE.md` fresh (the script rewrites it), keep the Version History table at the last-3 one-line rows (port the displaced row to `CHANGELOG.md`), and reconcile the Task-7 `dg-system.css?v=7.61.3` hand-bump with whatever the script writes (the script does NOT touch the CSS query — leave your `?v=7.61.3`).
- [ ] **Step 4:** superpowers:finishing-a-development-branch → push branch → PR to `main` (fast lane; PR for review given size) → CI green → merge → confirm prod serves 7.63.0 (asset check + Deploy Verification workflow) → **live prod verify** (drive the three archetypes on the prod URL with `?_cb=`, computed styles + 375px terminal containment) → capture a `#decision` note if the ship embodied one (candidate: the `terminal` reference kind + escape-then-highlight excerpt discipline + the guarded analyze mode/lenient extension as the reusable Sec+ log-analysis spine).

---

## Notes
- **Task arc:** Tasks 1-3 are the shared spine (tags → terminal renderer → analyze extension) and MUST land first — every archetype rides them. Tasks 4-6 are the three validators (independent of each other, depend on nothing but Task 1's tag for the scenario shell). Task 7 is CSS. Tasks 8-10 are the bulk (authoring + gating), each depending on its validator + the spine. Task 11 depends on 8-10. Tasks 12-13 close out. Execute in order.
- **Only genuinely new UI:** Task 2 (the terminal renderer) + Task 3 (the analyze mode/lenient extension). Everything else reuses shipped engine surface. If any task tempts a SECOND renderer, a per-archetype renderer variant, a new step-type, or a free-text surface: that is out of Wave 2 scope by spec — STOP and escalate rather than build it.
- **Ratchet ↔ new terminal tokens (Task 7):** every NEW bare `var()` the `.term*` block introduces MUST be DEFINED in `dg-system.css`/`styles.css` — do NOT add any to `KNOWN_GAPS`. The block above deliberately substitutes defined tokens for the mockups' baselined `--muted`/`--border-soft`/`--ease` so the ratchet passes untouched.
- **Scratch harness** under `.superpowers/sdd/wave2/` is gitignored working material — never commit it; never let a draft touch a seed file before it passes the fidelity validator AND the two-agent gate.
- **Carried-forward gotchas (verbatim):** binary-misdetect → always `grep -a` sim-lab.js; reviewers don't `git stash`; implementers work THEMSELVES; integrators use byte-identity diffs; `test()` global vs block-local `assert` — mirror the surrounding block; pre-commit CLAUDE.md-freshness gate fires on `index.html` changes (Task 7 handles it with one factual line); every `analyze` step declares `multi` explicitly; render is escape-THEN-highlight, never raw `innerHTML` of excerpt text.
- **Single-source-of-truth invariant (the design's load-bearing choice):** selectable line/command TEXT lives ONLY in the terminal reference excerpts; the KEYED true set lives in `answer.selected`; each fidelity validator asserts the two agree. This is why the analyze mode steps omit `payload.lines` and the validators cross-check against `assets.reference` — keep it intact or the cross-checks go vacuous.
