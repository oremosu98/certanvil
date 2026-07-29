// tests/uat/280-pbq-vpntunnel-wave5.js
// Scope: Sim Lab PBQ Wave 5 — the `vpntunnel` archetype (Security+ SY0-701).
// Guarded configure extension: payload.layout:'dualpanel' + payload.scoring:'tunnel'.
// Plan: docs/superpowers/plans/2026-07-19-sim-lab-pbq-wave5.md

const {
  _fnBody, dgCss, js, results, test
} = require('./_context');

// ── Wave 5: vpntunnel — payload validation, tunnel scorer, allowlist ──
// Bodies are extracted with the harness's brace-depth _fnBody rather than a
// non-greedy regex: _scoreTunnelStep nests an inner function, and a lazy
// /\n\s*\}\n/ terminator truncates the body at the INNER closing brace.
(function () {
  console.log('\n\x1b[1m── Sim Lab Wave 5: vpntunnel scorer + payload guard ──\x1b[0m');
  try {
    var src = _fnBody(js, '_scoreTunnelStep');
    test('W5: _scoreTunnelStep exists in sim-lab.js', !!src);
    var scoreTunnel = null;
    if (src) { scoreTunnel = new Function('return (' + src + ')')(); }

    var STEP = {
      id: 'p1', type: 'configure', points: 1,
      payload: {
        layout: 'dualpanel', scoring: 'tunnel',
        panels: [{ id: 'A', label: 'GW-A' }, { id: 'B', label: 'GW-B' }],
        slots: [
          { id: 'a-enc', panel: 'A', label: 'Encryption', options: [{ id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' }] },
          { id: 'b-enc', panel: 'B', label: 'Encryption', options: [{ id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' }] },
          { id: 'a-local', panel: 'A', label: 'Local subnet', options: [{ id: 'lon', text: '10.10.0.0/16' }, { id: 'fra', text: '10.20.0.0/16' }] },
          { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [{ id: 'lon', text: '10.10.0.0/16' }, { id: 'fra', text: '10.20.0.0/16' }] }
        ],
        symmetryPairs: [['a-enc', 'b-enc']],
        mirrorPairs: [['a-local', 'b-remote']]
      },
      answer: { slots: { 'a-enc': ['aes192', 'aes256'], 'b-enc': ['aes192', 'aes256'], 'a-local': ['lon'], 'b-remote': ['lon'] } }
    };
    // Hand-derived: 4 membership + 1 symmetry + 1 mirror = 6 units.
    var full = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes256', 'b-enc': 'aes256', 'a-local': 'lon', 'b-remote': 'lon' } });
    test('W5: perfect response scores 6/6', !!full && full.total === 6 && full.correct === 6);

    // THE teaching-point fixture: both encs individually valid, but different →
    // membership 4/4 KEPT, symmetry unit LOST. (Spec §Runtime scoring.)
    var asym = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes256', 'b-enc': 'aes192', 'a-local': 'lon', 'b-remote': 'lon' } });
    test('W5: asymmetric-but-valid picks lose ONLY the symmetry unit (5/6)', !!asym && asym.total === 6 && asym.correct === 5);

    // Matching pair of policy-VIOLATING values still earns its symmetry unit
    // (independent predicates — spec §Runtime scoring, fixture mandated).
    var weakSym = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes128', 'b-enc': 'aes128', 'a-local': 'lon', 'b-remote': 'lon' } });
    test('W5: matching weak values fail membership but keep symmetry (4/6)', !!weakSym && weakSym.total === 6 && weakSym.correct === 4);

    // Mirror break: a-local=lon but b-remote=fra → mirror unit lost, b-remote membership lost.
    var mir = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes256', 'b-enc': 'aes256', 'a-local': 'lon', 'b-remote': 'fra' } });
    test('W5: broken mirror loses mirror unit + its membership (4/6)', !!mir && mir.total === 6 && mir.correct === 4);

    // Unanswered slot: 0 membership, fails its pairs.
    var unans = scoreTunnel && scoreTunnel(STEP, { slots: { 'a-enc': 'aes256', 'a-local': 'lon', 'b-remote': 'lon' } });
    test('W5: unanswered slot scores 0 and fails its pair (4/6)', !!unans && unans.total === 6 && unans.correct === 4);

    // Dangling pair reference = SKIPPED unit, never a throw (runtime scorer is total).
    var DANGLING = JSON.parse(JSON.stringify(STEP));
    DANGLING.payload.symmetryPairs.push(['a-enc', 'zz-nope']);
    var dang = null, threw = false;
    try { dang = scoreTunnel && scoreTunnel(DANGLING, { slots: { 'a-enc': 'aes256', 'b-enc': 'aes256', 'a-local': 'lon', 'b-remote': 'lon' } }); } catch (e) { threw = true; }
    test('W5: dangling pair reference is skipped, not thrown (still 6 units)', !threw && !!dang && dang.total === 6 && dang.correct === 6);

    // Null response is total.
    var nul = null; threw = false;
    try { nul = scoreTunnel && scoreTunnel(STEP, null); } catch (e) { threw = true; }
    test('W5: null response scores 0/6 without throwing', !threw && !!nul && nul.total === 6 && nul.correct === 0);

    // Source-level guards:
    var allowlist = (js.match(/if \(s\.archetype !== undefined && \[([^\]]*)\]/) || [])[1] || '';
    test('W5: vpntunnel in simLabValidateScenario archetype allowlist', /'vpntunnel'/.test(allowlist));
    test('W5: _scoreStep configure case branches on tunnel scoring', /case 'configure':[\s\S]{0,300}scoring === 'tunnel'/.test(js));
    test('W5: simLabScoreScenario branches on tunnel scoring', /function simLabScoreScenario[\s\S]{0,900}scoring === 'tunnel'/.test(js));
    test('W5: payload validation accepts array answers only under tunnel scoring', /p\.scoring === 'tunnel'/.test(js));
  } catch (err) {
    test('W5: vpntunnel scorer block (threw)', false);
    results.errors.push('W5 vpntunnel scorer block threw: ' + err.message);
  }
})();
