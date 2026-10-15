// tests/uat/410-simlab-answer-review.js
// Scope: Sim Lab results rows open an answer panel (v8.177.0).
//
// Founder, 15 Oct: "In the Simlab, you should be able to click on the scenario of
// choice and see the right PBQ answer and set up ... need this for Correct+Wrong
// answers". Each round row is now a button; its panel lists every step's right
// answer, what the learner put on wrong steps, and the why.

const { _fnBody, dgCss, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Sim Lab answer review ──\x1b[0m');
  try {
    const names = ['_slStepOk', '_slLabels', '_slList', '_slKv', '_slTargetLabels', '_slKeyOrder', '_slKeyCategorize',
      '_slKeyMatch', '_slKeyAnalyze', '_slKeyFillin', '_slKeyConfigure', '_slIsBlank', '_slStepKey', '_slAnswerPanelHtml'];
    const src = names.map(n => _fnBody(js, n) || '').join('\n');
    const ctx = vm.createContext({});
    vm.runInContext(
      "var _esc = function (s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };\n" +
      "var _SL_TO = ' -> ';\n" +
      "var _simLabNormalizeMatch = function (g, acc) { return g != null && acc.indexOf(String(g).trim()) !== -1; };\n" + src, ctx);
    const key = (st, resp, scn) => vm.runInContext('_slStepKey(' + JSON.stringify(scn || { steps: [st] }) + ',' + JSON.stringify(st) + ',' + JSON.stringify(resp) + ')', ctx);

    const order = { type: 'order', payload: { items: [{ id: 'b', label: 'Build CSR' }, { id: 'a', label: 'Generate keys' }] }, answer: { correctOrder: ['a', 'b'] } };
    const k1 = key(order, { order: ['b', 'a'] });
    test('Order: the answer is the correct sequence, numbered; "You put" is your sequence',
      /<ol[^>]*><li>Generate keys<\/li><li>Build CSR<\/li><\/ol>/.test(k1.correct) && /<li>Build CSR<\/li><li>Generate keys<\/li>/.test(k1.yours));

    const cat = { type: 'categorize', payload: { items: [{ id: 'fw', label: 'Firewall' }, { id: 'ids', label: 'IDS' }], buckets: [{ id: 'p', label: 'Preventive' }, { id: 'd', label: 'Detective' }] }, answer: { map: { fw: 'p', ids: 'd' } } };
    const k2 = key(cat, { map: { fw: 'p', ids: 'p' } });
    test('Categorize: the answer groups items by bucket; "You put" lists only the misplaced item',
      /Preventive:<\/span> Firewall/.test(k2.correct) && /Detective:<\/span> IDS/.test(k2.correct)
        && /IDS<\/span> -> Preventive/.test(k2.yours) && !/Firewall/.test(k2.yours));

    const match = { type: 'match', payload: { left: [{ id: 'c', label: 'Confidentiality' }, { id: 'i', label: 'Integrity' }], right: [{ id: 's', label: 'Secret' }, { id: 'u', label: 'Unaltered' }] }, answer: { pairs: { c: 's', i: 'u' } } };
    const k3 = key(match, {});
    test('Match: the answer pairs left to right; an unmatched item says "not matched"',
      /Confidentiality<\/span> -> Secret/.test(k3.correct) && /Integrity<\/span> -> not matched/.test(k3.yours));

    const reveal = { type: 'analyze', payload: { mode: 'reveal', multi: true }, answer: { selected: ['fails'] } };
    const scnT = { assets: { reference: { kind: 'terminal', excerpts: [{ id: 'fails', promptLine: 'grep "Failed password" auth.log' }, { id: 'up', promptLine: 'uptime' }] } }, steps: [reveal] };
    const k4 = key(reveal, { selected: ['up'] }, scnT);
    test('Terminal PBQs: the answer shows the command to run, not an internal id',
      /grep "Failed password" auth.log/.test(k4.correct) && /uptime/.test(k4.yours) && /sls-ans-code/.test(k4.correct));

    const fill = { type: 'fillin', payload: { fields: [{ id: 'cidr', label: 'CIDR prefix' }] }, answer: { cidr: ['/28', '28'] } };
    test('Fill-in: the answer is the first accepted value; an empty field says "blank"',
      /CIDR prefix<\/span> -> \/28/.test(key(fill, {}).correct) && /blank/.test(key(fill, { cidr: '' }).yours));

    const tunnel = { type: 'configure', payload: { scoring: 'tunnel', panels: [{ id: 'A', label: 'GW-LON' }], slots: [{ id: 'enc', panel: 'A', label: 'Encryption', options: [{ id: 'des', text: '3DES' }, { id: 'a192', text: 'AES-192' }, { id: 'a256', text: 'AES-256' }] }] }, answer: { slots: { enc: ['a192', 'a256'] } } };
    const k6 = key(tunnel, { slots: { enc: 'des' } });
    test('Configure (VPN tunnel): accepted choices read "X or Y" under the gateway; a wrong pick shows its text',
      /GW-LON · Encryption<\/span> -> AES-192 or AES-256/.test(k6.correct) && /-> 3DES/.test(k6.yours));

    // Whole panel: a correct step shows only the answer; a wrong one adds "You put"; blank says "Nothing".
    const r = { scenario: { scenario: 'Sort them.', steps: [Object.assign({ id: 's1', prompt: 'Sort', explanation: 'Because.' }, cat), Object.assign({ id: 's2', prompt: 'Pair', explanation: 'Why two.' }, match)] },
      score: { perStep: { s1: true, s2: false } }, responses: { s1: { map: { fw: 'p', ids: 'd' } }, s2: { pairs: {} } } };
    const html = vm.runInContext('_slAnswerPanelHtml(' + JSON.stringify(r) + ', function (ok) { return !ok; })', ctx);
    const steps = html.split('sls-ans-step ').slice(1);
    test('Panel: a correct step shows its answer but no "You put"; a wrong untouched step says "You put: Nothing" with its why',
      steps.length === 2 && /Answer<\/span>/.test(steps[0]) && !/You put/.test(steps[0]) && !/Because\./.test(steps[0])
        && /You put<\/span><div class="sls-ans-val"><span class="sls-ans-none">Nothing<\/span>/.test(steps[1]) && /Why two\./.test(steps[1]));

    const rows = _fnBody(js, '_slRoundRows') || '';
    test('Rows: each round is a button with aria-expanded that toggles its own hidden panel, on right and wrong rounds alike',
      /_el\('button', 'sls-r'\)/.test(rows) && /aria-controls', 'sls-ans-' \+ i/.test(rows) && /panel\.hidden = !open/.test(rows)
        && /See the answer/.test(rows) && /Hide the answer/.test(rows));
    test('Both results pages use the rows, and Sim Lab exam results keep your answers for the panel',
      /_slRoundRows\(_slSession\.results, function \(ok\) \{ return pro \|\| !ok; \}\)/.test(_fnBody(js, '_slRenderSummary') || '')
        && /_slRoundRows\(_slSession\.results, function \(\) \{ return true; \}\)/.test(_fnBody(js, '_slRenderExamResult') || '')
        && /passed: score\.fraction === 1, responses: resp/.test(_fnBody(js, '_slExamSubmit') || ''));

    test('CSS: the panel hides with [hidden], fades in on the brand curve, the chevron flips (not spins), hover is pointer-gated and reduced motion drops the movement',
      /#page-sim-lab-result \.sls-ans\[hidden\]\{display:none\}/.test(dgCss)
        && /#page-sim-lab-result \.sls-ans\{[^}]*animation:sls-ans-in 220ms cubic-bezier\(0\.16,1,0\.3,1\)/.test(dgCss)
        && /\.sls-r\[aria-expanded="true"\] \.sls-r-chev\{transform:scaleY\(-1\)\}/.test(dgCss)
        && /@media \(hover:hover\) and \(pointer:fine\)\{#page-sim-lab-result \.sls-r:hover/.test(dgCss)
        && /@media \(prefers-reduced-motion:reduce\)\{#page-sim-lab-result \.sls-ans\{animation:sls-ans-fade/.test(dgCss));
  } catch (err) {
    test('Sim Lab answer review: block (threw)', false);
    results.errors.push('410 simlab-answer-review block threw: ' + err.message);
  }
})();
