---
up: "[[Drills MOC]]"
type: plan
status: active
cert: netplus, aplus-core1
updated: 2026-07-02
tags: [plan, drill, pbq]
---
# Sim Lab PBQ Wave 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three new Sim Lab PBQ archetypes — Wireless Deployment (Net+), Firewall Rule Table (Net+), SOHO Router Console (A+ Core 1) — with deterministic validators and 10-12 two-agent-gated scenarios each, riding the existing engine with zero new renderers.

**Architecture:** Everything reuses the live engine in `features/sim-lab.js` (configure/order steps, network reference renderer, per-slot scoring, gating/exam paths — all archetype-agnostic, proven in v7.61.0). This wave ADDS: three archetype tag values, three pure-logic fidelity validators, a CSS token-alias fix + guard test, and three gated seed banks. Spec: `docs/superpowers/specs/2026-07-02-pbq-wave-program-design.md`. Mockups (faithful-lift build targets): `mockups/wireless-deployment-concept.html`, `mockups/firewall-rule-table-concept.html`, `mockups/soho-router-concept.html`.

**Tech Stack:** Vanilla ES5-style JS (IIFE feature module, no build step), native `<select>`, `tests/uat.js` (vm sandbox + grab pattern, NO jsdom), forged-bronze tokens in `dg-system.css`.

## Global Constraints

- Branch: create `feat/sim-lab-pbq-wave1` from up-to-date `main` before Task 1; all commits land there; PR at Task 11.
- Fast lane (JS + content + CSS tokens; no schema/auth/money; sw.js only via bump-version at ship).
- ES5-style JS matching surrounding `features/sim-lab.js` code; no new deps.
- Selection-first: native `<select>`/order lists only; must work Desktop + Safari/WebKit + iOS Capacitor.
- Mockups ARE the build (faithful lift) for any UI surface; this wave should need NO new UI code — if a task discovers otherwise, STOP and escalate.
- CSS: `dg-system.css` only (never `styles.css`); tokens only, zero hardcoded hex; every `var(--x)` referenced must be DEFINED (the v7.61.0 `--fail` black-box lesson — Task 5 enforces this permanently).
- Seed banks: 10-12 scenarios per archetype; Net+ content in `features/sim-lab-seed-netplus.js` (cert `netplus`), SOHO in `features/sim-lab-seed-aplus-core1.js` (cert `aplus-core1`). Milestones/banks stay per-cert.
- **Dev-fixture rule (HARD):** no scenario enters a seed bank until it passes its deterministic validator AND the two-agent consensus gate (domain engineer + CompTIA examiner for the RIGHT exam: N10-009 for wireless/firewall, 220-1201 for SOHO). Mockup-embedded scenarios are labeled dev fixtures only.
- Do NOT run `bump-version.js` before Task 11. Hand-bump only the `dg-system.css?v=` query when Task 5 touches CSS.
- UAT: use the global `assert(cond, msg)` helper; never hardcode a global total-count literal. Feature files are concatenated DEDENTED (2 leading spaces stripped) into the `js` string, so extraction regexes see column-0 closings.

---

## Reference contracts (used across tasks — keep names identical)

**Archetype tags (Task 1):** `simLabValidateScenario` accepts optional `scenario.archetype` in `['diagram','incident','defense','wireless','firewall','soho']`.

**Wireless configure-step conventions (Tasks 2, 6):**
```js
// configure step configuring ONE access point:
{ id, type:'configure', points:1, apId:'ap2',            // device id in the network reference
  require: { band:'2.4', security:'WPA3-Personal', ssid:'HF-Ops' },  // machine-readable requirement mirror; all fields optional
  prompt, explanation,
  payload:{ slots:[ {id:'band',...}, {id:'channel',...}, {id:'security',...}, {id:'ssid',...} ] },  // subset ok; slot ids literal
  answer:{ slots:{ ... } } }
// network reference: APs are devices; any OTHER device carrying a numeric `channel`
// field counts as an occupied channel (the interfering neighbor). Neighbor drawn red
// via state:'compromised'; interference edge via links[{kind:'attack'}]. Channel info
// shown to the student rides the device label/ip text (NO renderer change).
```

**Firewall scenario conventions (Tasks 3, 7):**
```js
scenario.fwSpec = {
  rules: [                                    // the KEYED correct table, in keyed order
    { id:'ssh', action:'allow', proto:'tcp', src:'10.10.10.5/32', dst:'10.10.30.20/32', port:22 },
    { id:'web', action:'allow', proto:'tcp', src:'10.10.10.0/24', dst:'10.10.30.10/32', port:443 },
    { id:'deny', action:'deny', proto:'any', src:'any', dst:'any', port:'any' }
  ],
  flows: [                                    // acceptance traffic; expect 'allow'|'deny'
    { name:'admin ssh', proto:'tcp', src:'10.10.10.5', dst:'10.10.30.20', port:22, expect:'allow' },
    { name:'staff https', proto:'tcp', src:'10.10.10.77', dst:'10.10.30.10', port:443, expect:'allow' },
    { name:'staff ssh blocked', proto:'tcp', src:'10.10.10.77', dst:'10.10.30.20', port:22, expect:'deny' }
  ],
  shadowTable: {                              // the phase-3 broken exhibit (optional)
    rules: [ /* same shape, deliberately mis-ordered */ ],
    shadowedRuleId: 'web'
  }
}
// Steps: configure steps build rule tuples, order step's answer.correctOrder must equal
// fwSpec.rules ids in order (asserted by the validator's consistency check in UAT).
```

**SOHO scenario conventions (Tasks 4, 8):**
```js
scenario.soho = {
  subnet: { networkId:'192.168.1.0', mask:'255.255.255.0' },
  routerIp: '192.168.1.1',
  statics: [ { ip:'192.168.1.200', label:'NVR' } ],
  clientCount: 18,
  require: { ssid:'BluebirdOffice', security:'WPA3-Personal' }   // optional fields
}
// configure slot ids (literal, across any of the scenario's configure steps):
// 'ssid','security','guest','dhcpStart','dhcpEnd','extPort','fwdTo'
// fwdTo option text format: '192.168.1.200 : 443' (host colon port; whitespace ignored)
```

**Validator signatures (locked):**
```js
simLabValidateWirelessFidelity(networkRef, configureStep)  // -> { ok, errors }
simLabValidateFirewallFidelity(scenario)                   // -> { ok, errors }
simLabValidateSohoFidelity(scenario)                       // -> { ok, errors }
```
All three live in `features/sim-lab.js` next to `simLabValidateNetworkFidelity` (Task 9 of the v7.61.0 build, ~L77-172) and reuse `_ipToInt`, `_inSubnet`, `_slFidelityResolveSlot`.

---

### Task 0: Branch setup

**Files:** none (git only)

- [ ] **Step 1:** `cd "$HOME/Desktop/Dev Projects/certanvil" && git checkout main && git pull origin main && git checkout -b feat/sim-lab-pbq-wave1`
- [ ] **Step 2:** `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" && node tests/uat.js` — Expected: `ALL PASS ✓` (baseline; record the count).

### Task 1: Accept the three new archetype tags

**Files:**
- Modify: `features/sim-lab.js` (the archetype check inside `simLabValidateScenario`, ~L71-73)
- Test: `tests/uat.js` (Sim Lab validation block — locate by grep `bad archetype`)

**Interfaces:**
- Consumes: existing `simLabValidateScenario`.
- Produces: `['diagram','incident','defense','wireless','firewall','soho']` accepted — Tasks 6-8 seed content depends on this.

- [ ] **Step 1: Write failing tests** — next to the existing archetype tests:
```js
['wireless', 'firewall', 'soho'].forEach(function (tag) {
  var _s = _baseScn(); _s.archetype = tag;
  assert(simLabValidateScenario(_s).ok === true, 'archetype ' + tag + ' accepted');
});
var _sx = _baseScn(); _sx.archetype = 'printer';
assert(simLabValidateScenario(_sx).ok === false, 'unknown archetype still rejected');
```
(Reuse the block's existing `_baseScn` helper; if scoped away, clone the nearest valid scenario literal.)
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL on `archetype wireless accepted`.
- [ ] **Step 3: Implement** — extend the list in `simLabValidateScenario`:
```js
if (s.archetype !== undefined && ['diagram', 'incident', 'defense', 'wireless', 'firewall', 'soho'].indexOf(s.archetype) === -1) {
  errs.push('bad archetype');
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): accept wireless/firewall/soho archetype tags"`

### Task 2: Wireless fidelity validator

**Files:**
- Modify: `features/sim-lab.js` (add below `simLabValidateNetworkFidelity`)
- Test: `tests/uat.js` (new block after the Task-9 fidelity tests — grep `fidelity`)

**Interfaces:**
- Consumes: `_slFidelityResolveSlot(step, slotId)` (resolves a slot's KEYED option id to its option text), `_isNonEmptyStr`.
- Produces: `simLabValidateWirelessFidelity(networkRef, configureStep) -> {ok, errors}`; constants `_WIFI_24_CLEAR`, `_WIFI_5_CHANNELS`. Task 6 content and its UAT bank test call this.

- [ ] **Step 1: Write failing tests:**
```js
var _wref = { kind:'network', devices:[
  { id:'ap2', label:'AP-2', type:'ap', zone:'wh', x:0, y:0 },
  { id:'nbr', label:'Neighbor AP', type:'ap', zone:'out', x:1, y:0, state:'compromised', channel: 6 } ], links:[] };
var _wstep = { id:'w1', type:'configure', points:1, apId:'ap2',
  require:{ band:'2.4', security:'WPA3-Personal' },
  prompt:'p', explanation:'e',
  payload:{ slots:[
    { id:'band', label:'Band', options:[{id:'a',text:'2.4 GHz'},{id:'b',text:'5 GHz'}] },
    { id:'channel', label:'Channel', options:[{id:'a',text:'11'},{id:'b',text:'6'},{id:'c',text:'8'}] },
    { id:'security', label:'Security', options:[{id:'a',text:'WPA3-Personal'},{id:'b',text:'WEP'}] } ] },
  answer:{ slots:{ band:'a', channel:'a', security:'a' } } };
assert(simLabValidateWirelessFidelity(_wref, _wstep).ok === true, 'wifi: sound keyed config passes');
var _bad1 = JSON.parse(JSON.stringify(_wstep)); _bad1.answer.slots.channel = 'b';   // keyed onto neighbor's 6
assert(simLabValidateWirelessFidelity(_wref, _bad1).ok === false, 'wifi: keyed channel colliding with neighbor rejected');
var _bad2 = JSON.parse(JSON.stringify(_wstep)); _bad2.answer.slots.channel = 'c';   // 8 = overlapping channel
assert(simLabValidateWirelessFidelity(_wref, _bad2).ok === false, 'wifi: keyed non-1/6/11 2.4GHz channel rejected');
var _bad3 = JSON.parse(JSON.stringify(_wstep)); _bad3.answer.slots.security = 'b';
assert(simLabValidateWirelessFidelity(_wref, _bad3).ok === false, 'wifi: keyed security below requirement rejected');
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (`simLabValidateWirelessFidelity` undefined).
- [ ] **Step 3: Implement** in `features/sim-lab.js`:
```js
// --- wireless fidelity validator (Wave 1 Task 2) ---
// Verifies a wireless configure step's KEYED answer is RF-sound: channel legal
// for the keyed band, clear of any other device carrying a numeric `channel`
// field, and band/security/ssid matching the step's machine-readable `require`.
var _WIFI_24_CLEAR = [1, 6, 11];
var _WIFI_5_CHANNELS = [36, 40, 44, 48, 149, 153, 157, 161];

function simLabValidateWirelessFidelity(ref, step) {
  var errs = [];
  if (!ref || ref.kind !== 'network' || !Array.isArray(ref.devices)) {
    return { ok: false, errors: ['wifi fidelity: valid network reference required'] };
  }
  if (!step || step.type !== 'configure' || !_isNonEmptyStr(step.apId)) {
    return { ok: false, errors: ['wifi fidelity: configure step with apId required'] };
  }
  var req = step.require || {};
  var band = _slFidelityResolveSlot(step, 'band');
  var channel = _slFidelityResolveSlot(step, 'channel');
  var security = _slFidelityResolveSlot(step, 'security');
  var ssid = _slFidelityResolveSlot(step, 'ssid');

  if (req.band && band && band.indexOf(req.band) === -1) {
    errs.push('band: keyed "' + band + '" does not satisfy required ' + req.band);
  }
  if (req.security && security && security !== req.security) {
    errs.push('security: keyed "' + security + '" != required ' + req.security);
  }
  if (req.ssid && ssid && ssid !== req.ssid) {
    errs.push('ssid: keyed "' + ssid + '" != required ' + req.ssid);
  }
  if (channel !== undefined) {
    var ch = parseInt(channel, 10);
    var on24 = band ? band.indexOf('2.4') !== -1 : ch <= 14;
    var legal = on24 ? _WIFI_24_CLEAR : _WIFI_5_CHANNELS;
    if (legal.indexOf(ch) === -1) {
      errs.push('channel: ' + ch + ' is not a clear ' + (on24 ? '2.4 GHz (1/6/11)' : '5 GHz') + ' channel');
    }
    ref.devices.forEach(function (dev) {
      if (dev.id !== step.apId && typeof dev.channel === 'number' && dev.channel === ch) {
        errs.push('channel: ' + ch + ' collides with ' + (dev.label || dev.id));
      }
    });
  }
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): wireless RF fidelity validator"`

### Task 3: Firewall fidelity validator (traffic simulation)

**Files:**
- Modify: `features/sim-lab.js` (below the wireless validator)
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: `_ipToInt`.
- Produces: `simLabValidateFirewallFidelity(scenario) -> {ok, errors}`; helpers `_fwMatchAddr(cidrOrIpOrAny, ip)`, `_fwRuleMatches(rule, flow)`. Task 7 content + bank test call this. First-match-wins with implicit deny.

- [ ] **Step 1: Write failing tests:**
```js
var _fwScn = { fwSpec: {
  rules: [
    { id:'ssh',  action:'allow', proto:'tcp', src:'10.10.10.5/32', dst:'10.10.30.20/32', port:22 },
    { id:'web',  action:'allow', proto:'tcp', src:'10.10.10.0/24', dst:'10.10.30.10/32', port:443 },
    { id:'deny', action:'deny',  proto:'any', src:'any', dst:'any', port:'any' } ],
  flows: [
    { name:'admin ssh',   proto:'tcp', src:'10.10.10.5',  dst:'10.10.30.20', port:22,  expect:'allow' },
    { name:'staff https', proto:'tcp', src:'10.10.10.77', dst:'10.10.30.10', port:443, expect:'allow' },
    { name:'staff ssh',   proto:'tcp', src:'10.10.10.77', dst:'10.10.30.20', port:22,  expect:'deny' } ],
  shadowTable: {
    rules: [
      { id:'ssh',  action:'allow', proto:'tcp', src:'10.10.10.5/32', dst:'10.10.30.20/32', port:22 },
      { id:'blk',  action:'deny',  proto:'any', src:'10.10.10.0/24', dst:'any', port:'any' },
      { id:'web',  action:'allow', proto:'tcp', src:'10.10.10.0/24', dst:'10.10.30.10/32', port:443 } ],
    shadowedRuleId: 'web' } } };
assert(simLabValidateFirewallFidelity(_fwScn).ok === true, 'fw: sound spec passes');
var _fwBad = JSON.parse(JSON.stringify(_fwScn));
_fwBad.fwSpec.rules[2] = _fwBad.fwSpec.rules[0]; _fwBad.fwSpec.rules[0] = { id:'deny', action:'deny', proto:'any', src:'any', dst:'any', port:'any' };
assert(simLabValidateFirewallFidelity(_fwBad).ok === false, 'fw: deny-first table fails its own flows');
var _fwBad2 = JSON.parse(JSON.stringify(_fwScn));
_fwBad2.fwSpec.shadowTable.rules[1].src = '10.10.99.0/24';   // no longer shadows web
assert(simLabValidateFirewallFidelity(_fwBad2).ok === false, 'fw: declared-shadowed rule that actually fires is rejected');
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (function undefined).
- [ ] **Step 3: Implement:**
```js
// --- firewall fidelity validator (Wave 1 Task 3) ---
// Executes the scenario's acceptance flows through the KEYED rule table with
// first-match-wins + implicit deny, and proves the phase-3 shadow exhibit is
// genuinely shadowed. This is the archetype's differentiator: the seed's
// correctness is demonstrated by running traffic, not asserted by hand.
function _fwMatchAddr(spec, ip) {
  if (!spec || spec === 'any') return true;
  var parts = String(spec).split('/');
  if (parts.length === 2) {
    var bits = parseInt(parts[1], 10);
    var mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
    return (_ipToInt(ip) & mask) === (_ipToInt(parts[0]) & mask);
  }
  return spec === ip;
}
function _fwRuleMatches(rule, flow) {
  return (rule.proto === 'any' || rule.proto === flow.proto) &&
         (rule.port === 'any' || String(rule.port) === String(flow.port)) &&
         _fwMatchAddr(rule.src, flow.src) && _fwMatchAddr(rule.dst, flow.dst);
}
function simLabValidateFirewallFidelity(scn) {
  var errs = [];
  var spec = scn && scn.fwSpec;
  if (!spec || !Array.isArray(spec.rules) || !Array.isArray(spec.flows) || !spec.flows.length) {
    return { ok: false, errors: ['fw fidelity: scenario.fwSpec{rules[],flows[]} required'] };
  }
  spec.flows.forEach(function (flow) {
    var hit = null;
    for (var i = 0; i < spec.rules.length; i++) {
      if (_fwRuleMatches(spec.rules[i], flow)) { hit = spec.rules[i]; break; }
    }
    var outcome = hit ? hit.action : 'deny';
    if (outcome !== flow.expect) {
      errs.push('flow ' + (flow.name || flow.src + '->' + flow.dst + ':' + flow.port) + ': got ' + outcome + ', expected ' + flow.expect);
    }
  });
  var st = spec.shadowTable;
  if (st && Array.isArray(st.rules) && st.shadowedRuleId) {
    var shadow = st.rules.filter(function (r) { return r.id === st.shadowedRuleId; })[0];
    if (!shadow) {
      errs.push('shadowTable: shadowedRuleId "' + st.shadowedRuleId + '" not found');
    } else {
      var exercised = false, fired = false;
      spec.flows.forEach(function (flow) {
        if (!_fwRuleMatches(shadow, flow)) return;
        exercised = true;
        for (var i = 0; i < st.rules.length; i++) {
          if (_fwRuleMatches(st.rules[i], flow)) { if (st.rules[i].id === st.shadowedRuleId) fired = true; break; }
        }
      });
      if (!exercised) errs.push('shadowTable: no acceptance flow exercises the shadowed rule');
      if (fired) errs.push('shadowTable: declared-shadowed rule actually fires');
    }
  }
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+3).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): firewall traffic-simulation fidelity validator"`

### Task 4: SOHO fidelity validator (DHCP arithmetic)

**Files:**
- Modify: `features/sim-lab.js` (below the firewall validator)
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: `_ipToInt`, `_inSubnet`, `_slFidelityResolveSlot`.
- Produces: `simLabValidateSohoFidelity(scenario) -> {ok, errors}`; helper `_sohoSlotText(scn, slotId)` (first configure step defining the slot wins). Task 8 content + bank test call this.

- [ ] **Step 1: Write failing tests:**
```js
var _soScn = { soho: { subnet:{ networkId:'192.168.1.0', mask:'255.255.255.0' }, routerIp:'192.168.1.1',
    statics:[{ ip:'192.168.1.200' }], clientCount: 18, require:{ ssid:'BluebirdOffice', security:'WPA3-Personal' } },
  steps: [
    { id:'w', type:'configure', points:1, prompt:'p', explanation:'e',
      payload:{ slots:[
        { id:'ssid', label:'SSID', options:[{id:'a',text:'BluebirdOffice'},{id:'b',text:'Bluebird-Guest'}] },
        { id:'security', label:'Security', options:[{id:'a',text:'WPA3-Personal'},{id:'b',text:'WEP'}] } ] },
      answer:{ slots:{ ssid:'a', security:'a' } } },
    { id:'l', type:'configure', points:1, prompt:'p', explanation:'e',
      payload:{ slots:[
        { id:'dhcpStart', label:'Start', options:[{id:'a',text:'192.168.1.100'},{id:'b',text:'192.168.1.1'}] },
        { id:'dhcpEnd', label:'End', options:[{id:'a',text:'192.168.1.199'},{id:'b',text:'192.168.1.254'}] },
        { id:'fwdTo', label:'Forward', options:[{id:'a',text:'192.168.1.200 : 443'},{id:'b',text:'10.0.0.9 : 443'}] } ] },
      answer:{ slots:{ dhcpStart:'a', dhcpEnd:'a', fwdTo:'a' } } } ] };
assert(simLabValidateSohoFidelity(_soScn).ok === true, 'soho: sound keyed config passes');
var _soBad = JSON.parse(JSON.stringify(_soScn)); _soBad.steps[1].answer.slots.dhcpEnd = 'b';   // .254 swallows the NVR .200
assert(simLabValidateSohoFidelity(_soBad).ok === false, 'soho: pool covering a static reservation rejected');
var _soBad2 = JSON.parse(JSON.stringify(_soScn)); _soBad2.steps[1].answer.slots.fwdTo = 'b';   // off-subnet target
assert(simLabValidateSohoFidelity(_soBad2).ok === false, 'soho: forward target outside the LAN rejected');
var _soBad3 = JSON.parse(JSON.stringify(_soScn)); _soBad3.steps[0].answer.slots.ssid = 'b';
assert(simLabValidateSohoFidelity(_soBad3).ok === false, 'soho: keyed ssid mismatching requirement rejected');
```
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL (function undefined).
- [ ] **Step 3: Implement:**
```js
// --- SOHO router fidelity validator (Wave 1 Task 4) ---
// Pure arithmetic proof that the KEYED router config satisfies the scenario's
// machine-readable facts: DHCP pool inside the subnet, sized for the client
// count, excluding router + statics; forward target on the LAN; ssid/security
// matching scenario.soho.require.
function _sohoSlotText(scn, slotId) {
  for (var i = 0; i < scn.steps.length; i++) {
    var st = scn.steps[i];
    if (st.type !== 'configure') continue;
    var t = _slFidelityResolveSlot(st, slotId);
    if (t !== undefined) return t;
  }
  return undefined;
}
function simLabValidateSohoFidelity(scn) {
  var errs = [];
  var s = scn && scn.soho;
  if (!s || !s.subnet || !s.subnet.networkId || !s.subnet.mask || !Array.isArray(scn.steps)) {
    return { ok: false, errors: ['soho fidelity: scenario.soho.subnet{networkId,mask} + steps required'] };
  }
  var startTxt = _sohoSlotText(scn, 'dhcpStart'), endTxt = _sohoSlotText(scn, 'dhcpEnd');
  if (startTxt !== undefined && endTxt !== undefined) {
    if (!_inSubnet(startTxt, s.subnet.networkId, s.subnet.mask)) errs.push('dhcp: start ' + startTxt + ' out of subnet');
    if (!_inSubnet(endTxt, s.subnet.networkId, s.subnet.mask)) errs.push('dhcp: end ' + endTxt + ' out of subnet');
    var start = _ipToInt(startTxt), end = _ipToInt(endTxt);
    if (end < start) errs.push('dhcp: end before start');
    if (typeof s.clientCount === 'number' && (end - start + 1) < s.clientCount) {
      errs.push('dhcp: pool of ' + (end - start + 1) + ' addresses < ' + s.clientCount + ' clients');
    }
    [s.routerIp].concat((s.statics || []).map(function (d) { return d.ip; })).forEach(function (ip) {
      if (!ip) return;
      var n = _ipToInt(ip);
      if (n >= start && n <= end) errs.push('dhcp: pool hands out reserved ' + ip);
    });
  }
  var req = s.require || {};
  ['ssid', 'security'].forEach(function (k) {
    var got = _sohoSlotText(scn, k);
    if (req[k] && got !== undefined && got !== req[k]) errs.push(k + ': keyed "' + got + '" != required ' + req[k]);
  });
  var fwdTo = _sohoSlotText(scn, 'fwdTo');
  if (fwdTo !== undefined) {
    var host = String(fwdTo).replace(/\s+/g, '').split(':')[0];
    if (!_inSubnet(host, s.subnet.networkId, s.subnet.mask)) errs.push('forward: target ' + host + ' outside the LAN');
  }
  return { ok: errs.length === 0, errors: errs };
}
```
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+4).
- [ ] **Step 5: Commit** `git add features/sim-lab.js tests/uat.js && git commit -m "feat(sim-lab): SOHO router DHCP-arithmetic fidelity validator"`

### Task 5: CSS token aliases + permanent token-existence guard

**Files:**
- Modify: `dg-system.css` (root token blocks — grep `--text-mid:` to find them, ~L26/42/57/73)
- Modify: `index.html` (bump `dg-system.css?v=7.61.1` → `?v=7.61.2`)
- Test: `tests/uat.js` (new css-guard block — place near other css-guard tests, grep `css` in test names)

**Interfaces:**
- Consumes: existing token definitions (`--green`, `--red`, `--yellow` in `styles.css` `:root`).
- Produces: `--pass`, `--fail`, `--warn` defined as aliases in every dg-system token block, plus a UAT guard asserting every `var(--x)` referenced in `dg-system.css` (without a fallback) is defined in `dg-system.css` or `styles.css`. Prevents any repeat of the v7.61.0 black-box bug.

- [ ] **Step 1: Write the failing guard test:**
```js
(function () {
  var dg = read('dg-system.css'), base = read('styles.css');
  var defined = {};
  (dg.match(/--[a-z0-9-]+\s*:/gi) || []).concat(base.match(/--[a-z0-9-]+\s*:/gi) || [])
    .forEach(function (d) { defined[d.replace(/\s*:$/, '').trim()] = true; });
  var missing = {};
  var re = /var\(\s*(--[a-z0-9-]+)\s*\)/gi, m;           // no-fallback references only
  while ((m = re.exec(dg))) { if (!defined[m[1]]) missing[m[1]] = true; }
  var names = Object.keys(missing);
  assert(names.length === 0, 'dg-system.css var() tokens all defined (missing: ' + (names.join(', ') || 'none') + ')');
})();
```
(`read()` is the UAT file helper used at the top of the suite.)
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: FAIL naming at least `--pass` (22 pre-existing uses, zero definitions — the same latent class of bug as the fixed `--fail`).
- [ ] **Step 3: Implement** — add to EVERY dg-system root/theme token block (the ones defining `--text-mid`):
```css
  --pass: var(--green); --fail: var(--red); --warn: var(--yellow);
```
Then in `index.html` change `dg-system.css?v=7.61.1` to `dg-system.css?v=7.61.2`.
- [ ] **Step 4: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (+1). If the guard names other missing tokens, alias or correct each the same way (tokens only; never hex).
- [ ] **Step 5: Commit** `git add dg-system.css index.html tests/uat.js && git commit -m "fix(css): define pass/fail/warn token aliases + permanent var() existence guard"`

### Task 6: Author + gate + integrate the Net+ Wireless bank (10-12)

**Files:**
- Create (scratch, gitignored): `.superpowers/sdd/wave1/validate-drafts.js`, `.superpowers/sdd/wave1/wireless-drafts.js`
- Modify: `features/sim-lab-seed-netplus.js` (append inside `window.SIM_LAB_SEED_NETPLUS = [...]`)
- Test: `tests/uat.js` (bank test — mirror the block found by grep `archetype === 'diagram'`)

**Interfaces:**
- Consumes: Task 1 tag, Task 2 validator, wireless conventions from Reference contracts.
- Produces: 10-12 scenarios with `archetype:'wireless'`, ids `np-wifi-*`, in the netplus bank; the scratch harness reused by Tasks 7-8.

- [ ] **Step 1: Create the draft-validation harness** at `.superpowers/sdd/wave1/validate-drafts.js` — it brace-extracts the REAL validators from `features/sim-lab.js` (never reimplement) and runs a drafts file through them:
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
  var m = new RegExp('var\\s+' + name + '\\s*=\\s*\\[[^\\]]*\\];').exec(src);
  if (!m) throw new Error('missing var ' + name);
  return m[0];
}
var pieces = [
  extractVar(SRC, 'STEP_TYPES'), extractVar(SRC, '_WIFI_24_CLEAR'), extractVar(SRC, '_WIFI_5_CHANNELS'),
  extractFunction(SRC, '_isNonEmptyStr'), extractFunction(SRC, '_validateStepPayload'),
  extractFunction(SRC, 'simLabValidateScenario'), extractFunction(SRC, '_ipToInt'),
  extractFunction(SRC, '_maskToInt'), extractFunction(SRC, '_inSubnet'),
  extractFunction(SRC, '_slFidelityResolveSlot'), extractFunction(SRC, 'simLabValidateNetworkFidelity'),
  extractFunction(SRC, 'simLabValidateWirelessFidelity'), extractFunction(SRC, '_fwMatchAddr'),
  extractFunction(SRC, '_fwRuleMatches'), extractFunction(SRC, 'simLabValidateFirewallFidelity'),
  extractFunction(SRC, '_sohoSlotText'), extractFunction(SRC, 'simLabValidateSohoFidelity')
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
  if (s.archetype === 'wireless') {
    var cfg = (s.steps || []).filter(function (st) { return st.type === 'configure' && st.apId; })[0];
    f = cfg ? sb.simLabValidateWirelessFidelity(s.assets.reference, cfg) : { ok: false, errors: ['no configure step with apId'] };
  } else if (s.archetype === 'firewall') { f = sb.simLabValidateFirewallFidelity(s); }
  else if (s.archetype === 'soho') { f = sb.simLabValidateSohoFidelity(s); }
  if (f && !f.ok) { console.log('FAIL  ' + tag + '  fidelity: ' + f.errors.join('; ')); fails++; }
  if ((!f || f.ok) && r.ok) console.log('pass  ' + tag);
});
console.log('\n' + (fails === 0 ? 'ALL DRAFTS VALID' : fails + ' FAILURE(S)') + '  (' + scenarios.length + ' scenarios)');
process.exit(fails === 0 ? 0 : 1);
```
Run as: `node .superpowers/sdd/wave1/validate-drafts.js <drafts-file.js>` (drafts file does `module.exports = [ ... ]`). Note the `__dirname, '..', '..', '..'` — the harness lives two levels under `.superpowers/`, sim-lab.js at repo root/features.
- [ ] **Step 2: Author 10-12 wireless drafts** in `wireless-drafts.js` (`module.exports = [...]`), house scenario shape (`id/cert:'netplus'/objective/topic/title/estMinutes/archetype:'wireless'/scenario/assets.reference/steps`), varying: band steering (2.4-only clients vs 5-capable), channel planning around 1-2 neighbors (2.4 AND a 5 GHz DFS-free case), security modes (WPA3 vs WPA2 legacy-client tradeoff framed with one keyed answer), SSID/guest separation, channel-width choice (20 vs 40 MHz in congested 2.4). Objectives: N10-009 2.3 primarily, 4.3 spillover for security slots. Faithful to the mockup's format: diagnose/plan step + per-AP configure step(s). Run `node .superpowers/sdd/wave1/validate-drafts.js .superpowers/sdd/wave1/wireless-drafts.js` until ALL VALID.
- [ ] **Step 3: TWO-AGENT GATE per scenario** — dispatch Agent A (wireless network engineer: RF math, real-world plausibility, single clear fault, distractors wrong-for-right-reasons) and Agent B (CompTIA N10-009 examiner: objective mapping, exam realism, keyed answer is what CompTIA accepts, difficulty). Revise-until-BOTH-approve; re-gate only revised scenarios. No scenario proceeds without consensus.
- [ ] **Step 4: Integrate** — append approved scenarios into `window.SIM_LAB_SEED_NETPLUS` (before the closing `];`, matching file formatting; no `module.exports` residue; ids `np-wifi-*` collide with nothing).
- [ ] **Step 5: Add the UAT bank test** — mirror the diagram-bank block: vm-populate `window.SIM_LAB_SEED_NETPLUS`, extract the real validators (same set as the harness), filter `archetype === 'wireless'`, assert `count >= 10`, every scenario passes `simLabValidateScenario`, and every configure step carrying `apId` passes `simLabValidateWirelessFidelity`.
- [ ] **Step 6: Run** `node tests/uat.js` → `ALL PASS ✓`; `node tests/tech-debt.js` → clean.
- [ ] **Step 7: Commit** `git add features/sim-lab-seed-netplus.js tests/uat.js && git commit -m "content(sim-lab): Net+ Wireless Deployment seed bank (2-agent gated)"`

### Task 7: Author + gate + integrate the Net+ Firewall bank (10-12)

**Files:**
- Create (scratch): `.superpowers/sdd/wave1/firewall-drafts.js`
- Modify: `features/sim-lab-seed-netplus.js`
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: harness from Task 6 Step 1; Task 3 validator; firewall conventions (`fwSpec` with rules/flows/shadowTable; order step `correctOrder` == `fwSpec.rules` id order).
- Produces: 10-12 scenarios `archetype:'firewall'`, ids `np-fw-*`, netplus bank.

- [ ] **Step 1: Author 10-12 drafts** in `firewall-drafts.js`: build/order/shadow chains varying business requirements (mgmt access, web tiers, guest isolation, deny-log placement), rule count 3-5, at least 3 acceptance flows each incl. one expected-deny, and a `shadowTable` exhibit per scenario. Every scenario carries `fwSpec`; the order step's `answer.correctOrder` MUST list `fwSpec.rules` ids in the same order (the bank test asserts this). Objectives: N10-009 4.3 + 1.4. Run the harness until ALL VALID.
- [ ] **Step 2: TWO-AGENT GATE per scenario** — Agent A: firewall/network engineer (rule semantics, first-match soundness, shadow realism); Agent B: N10-009 examiner. Consensus required.
- [ ] **Step 3: Integrate** into `window.SIM_LAB_SEED_NETPLUS` (ids `np-fw-*`).
- [ ] **Step 4: UAT bank test** — filter `archetype === 'firewall'`: `count >= 10`; every scenario passes `simLabValidateScenario` AND `simLabValidateFirewallFidelity`; plus the consistency assertion:
```js
bank.filter(function (s) { return s.archetype === 'firewall'; }).forEach(function (s) {
  var ord = s.steps.filter(function (st) { return st.type === 'order'; })[0];
  if (ord) {
    var want = s.fwSpec.rules.map(function (r) { return r.id; }).join(',');
    test('fw ' + s.id + ': order key matches fwSpec order', ord.answer.correctOrder.join(',') === want);
  }
});
```
- [ ] **Step 5: Run** `node tests/uat.js` → `ALL PASS ✓`; tech-debt clean.
- [ ] **Step 6: Commit** `git add features/sim-lab-seed-netplus.js tests/uat.js && git commit -m "content(sim-lab): Net+ Firewall Rule Table seed bank (2-agent gated)"`

### Task 8: Author + gate + integrate the A+ Core 1 SOHO bank (10-12)

**Files:**
- Create (scratch): `.superpowers/sdd/wave1/soho-drafts.js`
- Modify: `features/sim-lab-seed-aplus-core1.js` (append inside `window.SIM_LAB_SEED_APLUS_CORE1 = [...]`)
- Test: `tests/uat.js`

**Interfaces:**
- Consumes: harness; Task 4 validator; SOHO conventions (`scenario.soho`, slot ids `ssid/security/guest/dhcpStart/dhcpEnd/extPort/fwdTo`).
- Produces: 10-12 scenarios `archetype:'soho'`, cert `aplus-core1`, ids `a1-soho-*` — the FIRST archetype content in an A+ bank.

- [ ] **Step 1: Author 10-12 drafts** in `soho-drafts.js`: small-business tickets varying: DHCP pool sizing vs static reservations (camera NVR, printer, POS), port-forward targets/ports, guest isolation, SSID/security per ticket, one scenario with a deliberately tight pool trap and one with a router-IP-in-pool trap. `cert:'aplus-core1'`, objectives 220-1201 2.5/2.6. Every scenario carries `scenario.soho` with the machine facts. Run the harness until ALL VALID.
- [ ] **Step 2: TWO-AGENT GATE per scenario** — Agent A: field technician / SOHO installer (config actually works, traps realistic); Agent B: **CompTIA 220-1201 examiner** (NOT Net+ — A+ scope: no enterprise VLAN talk, terminology per A+ objectives). Consensus required.
- [ ] **Step 3: Integrate** into `window.SIM_LAB_SEED_APLUS_CORE1` (verify no id collisions with existing `SIM_LAB_SEED_APLUS_CORE1` ids).
- [ ] **Step 4: UAT bank test** — vm-populate `window.SIM_LAB_SEED_APLUS_CORE1` (eval `features/sim-lab-seed-aplus-core1.js` source), filter `archetype === 'soho'`: `count >= 10`, every scenario passes `simLabValidateScenario` AND `simLabValidateSohoFidelity`, and every scenario's `cert === 'aplus-core1'`.
- [ ] **Step 5: Run** `node tests/uat.js` → `ALL PASS ✓`; tech-debt clean.
- [ ] **Step 6: Commit** `git add features/sim-lab-seed-aplus-core1.js tests/uat.js && git commit -m "content(sim-lab): A+ Core 1 SOHO Router seed bank (2-agent gated)"`

### Task 9: Vertical-slice mount + score tests (one per archetype)

**Files:**
- Test: `tests/uat.js` only (mirror the v7.61.0 Task-11 end-to-end block — grep `DEV FIXTURE ONLY` / `_slMountScenario` in tests to find the pattern: vm sandbox + DOM shim + `window.__slActiveSubmit`)

**Interfaces:**
- Consumes: real bank scenarios from Tasks 6-8 (gated content — allowed in tests), `_slMountScenario`, `simLabScoreScenario`.
- Produces: proof the three archetypes render + score through the existing Practice path with zero wiring changes.

- [ ] **Step 1: Write the tests** — for each of: first `archetype==='wireless'` scenario (netplus bank), first `archetype==='firewall'` scenario (netplus), first `archetype==='soho'` scenario (aplus-core1): mount via the existing `_slMountScenario(host, scn, {onSubmit})` call shape in the vm/DOM shim; assert (a) the mounted node contains the configure `<select>`s (and for firewall, the order step's rendered items); (b) selecting every keyed-correct option and submitting yields `correct === total` from `simLabScoreScenario`; (c) a negative control (one wrong slot) scores `correct < total`. Follow the existing block's `grab()` extraction + guard-clause style exactly; no hardcoded global counts.
- [ ] **Step 2: Run** `node tests/uat.js` — Expected: `ALL PASS ✓` (if any archetype fails to mount/score, that is a REAL wiring gap: STOP, diagnose via `node scripts/graphq.js callers _slMountScenario`, fix minimally in `features/sim-lab.js`, and note it in the commit).
- [ ] **Step 3: Commit** `git add tests/uat.js && git commit -m "test(sim-lab): Wave 1 archetype vertical slices through Practice path"`

### Task 10: Live browser verification (all three archetypes)

**Files:** none expected (fixes only if found)

- [ ] **Step 1:** Serve locally (`preview_start certanvil-local` → localhost:3140; unregister the SW + clear caches + `?_cb=` navigate — the v7.61.0 stale-SW lesson). 🚨 NEVER write localStorage on prod hosts.
- [ ] **Step 2:** Force the bank to one wireless scenario (localhost only: save + swap `window.SIM_LAB_SEED_NETPLUS`), run a full Practice round via real clicks: reference renders (AP devices + red neighbor + attack-link overlay), selects work, submit scores, result correct. Repeat for a firewall scenario (verify the order step UI + per-slot grading) and, with cert switched to A+ Core 1, a SOHO scenario.
- [ ] **Step 3:** Check computed styles, not just DOM: no black fills (token guard should make this impossible), correct/wrong select states tinted. Mobile 375px reflow: no horizontal scroll. Reduced-motion: no attack-link animation under `prefers-reduced-motion`.
- [ ] **Step 4:** Zero console errors across all three. Any defect found: fix, re-run UAT, commit `fix(sim-lab): <what> (wave-1 live verify)`.
- [ ] **Step 5:** `npm run test:ios` (webkit + mobile-safari Playwright) → all pass. No commit if clean.

### Task 11: Final review + ship

- [ ] **Step 1:** Final whole-branch review per superpowers:subagent-driven-development (review package from `git merge-base main HEAD`); fix Critical/Important findings.
- [ ] **Step 2:** Full gates: `node tests/uat.js` && `node tests/tech-debt.js` && `npx playwright test`.
- [ ] **Step 3:** `node scripts/bump-version.js 7.62.0 "Sim Lab Wave 1 PBQs: Wireless Deployment, Firewall Rule Table, SOHO Router"` — then re-read CLAUDE.md fresh (the script rewrites it), keep the version table at last-3 one-line rows, port displaced rows to CHANGELOG.md.
- [ ] **Step 4:** superpowers:finishing-a-development-branch → push branch → PR to `main` (fast lane; PR for review given size) → CI green → merge → confirm prod serves 7.62.0 (asset check + Deploy Verification workflow) → capture a `#decision` note if the ship embodied one (candidate: the fwSpec traffic-simulation validation convention).

---

## Notes
- Tasks 1-5 are independent of content and small; 6-8 are the bulk (authoring + gating); 9 depends on 6-8; 10-11 close out. Execute in order.
- The scratch harness under `.superpowers/sdd/wave1/` is gitignored working material — never commit it, never let drafts touch a seed file before the gate.
- If any task tempts a new renderer, mode, or index.html hook: that is out of Wave 1 scope by spec — STOP and escalate rather than build it.
