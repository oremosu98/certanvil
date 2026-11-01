// tests/uat/554-true-false-validator.js
// Scope: new-certs Task R1, fix round 0. validateQuestions accepts a two-option MCQ only when the active pack opts in
// (meta.allowTrueFalse: PSM I and PSM II) AND the options are exactly { A: 'True', B: 'False' } (case-insensitive, trimmed).
// Every other two-option item, and a True/False item on any other cert, is still rejected. The real validateQuestions and
// its helpers are cut out of app.js and run in a vm with each pack as CERT_PACK (same extraction as validation-audit.js).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── True/False: validator opt-in (PSM only) ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const js = read('app.js'), qe = read('features/quiz-engine.js');
  function fn(src, name) {
    const start = src.indexOf('function ' + name + '(');
    if (start < 0) throw new Error('554: ' + name + ' not found');
    let i = src.indexOf('{', start), d = 0;
    for (; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}') { d--; if (d === 0) { i++; break; } } }
    return src.slice(start, i);
  }
  function constBlock(src, name) {
    const start = src.indexOf('const ' + name);
    let i = src.indexOf('=', start) + 1; while (/\s/.test(src[i])) i++;
    const open = src[i], close = open === '{' ? '}' : ']'; let d = 0;
    for (; i < src.length; i++) { if (src[i] === open) d++; else if (src[i] === close) { d--; if (d === 0) { i++; break; } } }
    return src.slice(start, i) + ';';
  }
  const net = read('certs/netplus.js');
  function certObj(key, as) { const m = new RegExp(key + ':\\s*\\{').exec(net); let i = m.index + m[0].length - 1, d = 0, s = i; for (; i < net.length; i++) { if (net[i] === '{') d++; else if (net[i] === '}') { d--; if (d === 0) { i++; break; } } } return 'const ' + as + ' = ' + net.slice(s, i) + ';'; }
  function certArr(key, as) { return 'const ' + as + ' = [' + new RegExp(key + ':\\s*\\[([^\\]]*)\\]').exec(net)[1] + '];'; }
  const SRC = [
    "const STORAGE = { REPORTS: 'nplus_reports' }; function loadReports() { return []; } function getQType(q) { return q.type || 'mcq'; } let _voCache = null;",
    certObj('ports', 'GT_PORTS'), certObj('osi', 'GT_OSI'), certArr('wifiBroken', 'GT_WIFI_BROKEN'), certArr('wifiDeprecated', 'GT_WIFI_DEPRECATED'),
    constBlock(js, '_STEM_NUMBER_WORDS'),
    ['_groundTruthOk', '_numericOptionOk', '_smallestSubnetOk', '_stemHasInterrogative', '_tbTroubleshootingOrderOk', '_stemNumericMatchesAnswerCount', '_multiSelectGroundTruthOk', 'validateQuestions'].map((n) => fn(js, n)).join('\n'),
    fn(qe, '_validObjectiveSet')
  ].join('\n');
  function packOf(id) { const w = {}; vm.runInNewContext(read('certs/' + id + '.js'), { window: w }); return w.CERT_PACKS[id]; }
  function validator(id) {
    const p = packOf(id);
    const ctx = vm.createContext({ CERT_PACK: p, topicResources: p.topicResources, Set, Object, Array, String, Number, JSON, Math, RegExp, console });
    vm.runInContext(SRC, ctx);
    return (q) => vm.runInContext('validateQuestions(__q).length', Object.assign(ctx, { __q: [JSON.parse(JSON.stringify(q))] })) === 1;
  }
  const v1 = validator('psm1'), v2 = validator('psm2'), vn = validator('netplus'), vs = validator('secai');
  const TF = { type: 'mcq', question: 'True or False: The Sprint is a container for all the other Scrum events in Scrum?', difficulty: 'Foundational', topic: 'The Sprint', objective: '1.4',
    options: { A: 'True', B: 'False' }, answer: 'A', explanation: 'The Scrum Guide describes the Sprint as the container for every other event. (B) Wrong: no event sits outside it.' };
  const four = Object.assign({}, TF, { question: 'Which event is the container for all the other Scrum events?', options: { A: 'The Sprint', B: 'Sprint Review', C: 'Daily Scrum', D: 'Sprint Planning' }, explanation: 'The Sprint holds every other event. (B) Wrong: Sprint Review happens inside it.' });

  test('554 psm1: a True/False item passes; " true "/"FALSE" (trim, any case) passes; answer B passes', v1(TF) &&
    v1(Object.assign({}, TF, { options: { A: ' true ', B: 'FALSE' } })) && v1(Object.assign({}, TF, { answer: 'B', explanation: 'False. The Scrum Guide says otherwise. (A) Wrong: it is not true.' })));
  test('554 psm1: a normal four-option item still passes (control)', v1(four));
  test('554 psm1: a two-option item that is not True/False is rejected (Yes/No, swapped False/True, extra C, answer C)',
    !v1(Object.assign({}, TF, { options: { A: 'Yes', B: 'No' } })) && !v1(Object.assign({}, TF, { options: { A: 'False', B: 'True' } })) &&
    !v1(Object.assign({}, TF, { options: { A: 'True', B: 'False', C: 'Maybe' } })) && !v1(Object.assign({}, TF, { answer: 'C' })));
  test('554 netplus and secai (no opt-in): the same True/False item is rejected', !vn(Object.assign({}, TF, { objective: '1.1' })) && !vs(Object.assign({}, TF, { objective: '1.1' })));
  test('554 netplus: a three-option item is still rejected (four options required, as before)',
    !vn(Object.assign({}, four, { objective: '1.1', options: { A: 'The Sprint', B: 'Sprint Review', C: 'Daily Scrum' } })));
  const noQ = Object.assign({}, four, { objective: '1.1', question: 'True or False: the Sprint is the container for all the other Scrum events.' });
  test('554 a "True or False:" stem with no question mark counts as a question only on an opted-in pack (netplus still rejects it)',
    v1(Object.assign({}, TF, { question: 'True or False: The Sprint is the container for all the other Scrum events.' })) && !vn(noQ) && vn(Object.assign({}, noQ, { question: 'Which event is the container for all the other Scrum events?' })) === vn(Object.assign({}, four, { objective: '1.1' })));
  // The PSM banks' own True/False exemplars (reviewed content) all pass the validator on their pack.
  const bankTF = (id) => packOf(id).questionExemplars.filter((e) => Object.keys(e.options || {}).length === 2);
  const f1 = bankTF('psm1').filter((e) => !v1(e)), f2 = bankTF('psm2').filter((e) => !v2(e));
  test('554 every True/False exemplar in the PSM I (' + bankTF('psm1').length + ') and PSM II (' + bankTF('psm2').length + ') banks passes validateQuestions' +
    (f1.length + f2.length ? ' — failing: ' + f1.concat(f2).map((e) => e.question.slice(0, 50)).join(' | ') : ''), bankTF('psm1').length > 0 && bankTF('psm2').length > 0 && f1.length + f2.length === 0);
  test('554 opt-in is pack meta, set only on PSM I and PSM II',
    ['netplus', 'secplus', 'aplus-core1', 'aplus-core2', 'az900', 'ai900', 'sc900', 'clfc02', 'secai', 'prince2'].every((id) => !packOf(id).meta.allowTrueFalse) &&
    packOf('psm1').meta.allowTrueFalse === true && packOf('psm2').meta.allowTrueFalse === true);
  test('554 generator and AI-validator prompts mention True/False only behind the same meta flag; the AI validator lists only the options a question has',
    /4 options each \(or 5 for multi-select\): A, B, C, D \(E for multi-select\)\$\{typeof CERT_PACK !== 'undefined' && CERT_PACK && CERT_PACK\.meta && CERT_PACK\.meta\.allowTrueFalse \? '\. Exception: a True or False item/.test(js) &&
    /two tempting-looking distractors\.\$\{typeof CERT_PACK !== 'undefined' && CERT_PACK && CERT_PACK\.meta && CERT_PACK\.meta\.allowTrueFalse \?/.test(js) &&
    !/A\) \$\{q\.options\.A\}\\nB\) \$\{q\.options\.B\}\\nC\) \$\{q\.options\.C\}/.test(js));
})();
