// tests/uat/550-cert-secai.js
// Scope: CompTIA SecAI+ (CY0-001) pack: meta, official domain weights, topic coverage, retention concepts.
const fs = require('fs');
const path = require('path');
const { test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── SecAI+ pack ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const src = fs.readFileSync(path.join(ROOT, 'certs', 'secai.js'), 'utf8');
  const win = {};
  const ctx = vm.createContext({ window: win });
  vm.runInContext(src, ctx);
  const p = win.CERT_PACKS && win.CERT_PACKS.secai;
  const m = (p && p.meta) || {};
  const w = (p && p.domainWeights) || {};
  const td = (p && p.topicDomains) || {};
  const topics = Object.keys(td);
  const rc = (p && p.retentionGapConcepts) || [];

  test('Pack declares window.CERT_PACKS.secai', !!p && m.id === 'secai');
  test('Meta: CY0-001, 600 pass on 100-900, 60 questions, 3600 s',
    m.code === 'CY0-001' && m.examPassScore === 600 && m.examMaxScore === 900 && m.examMinScore === 100 &&
    m.examQuestionCount === 60 && m.examTimeSeconds === 3600);
  test('Meta: name and blueprint URL', m.name === 'CompTIA SecAI+' && m.blueprintUrl === 'https://www.comptia.org/en-us/certifications/secai/');
  test('Domain keys and weights match the official split, in order',
    Object.keys(w).join() === 'ai-concepts,securing-ai,ai-assisted,ai-grc' &&
    w['ai-concepts'] === 0.17 && w['securing-ai'] === 0.40 && w['ai-assisted'] === 0.24 && w['ai-grc'] === 0.19);
  test('Domain weights sum to 1', Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  test('Every domain has a label', Object.keys(w).every((k) => p.domainLabels && typeof p.domainLabels[k] === 'string' && p.domainLabels[k]));
  // Official CY0-001 Exam Objectives v1.1: 1.1-1.3, 2.1-2.6, 3.1-3.3, 4.1-4.3 (15 objectives).
  const OFFICIAL = ['1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '3.1', '3.2', '3.3', '4.1', '4.2', '4.3'];
  test('At least 38 topics', topics.length >= 38);
  test('Every topic maps to a declared domain', topics.every((t) => Object.prototype.hasOwnProperty.call(w, td[t])));
  test('Every domain has at least one topic', Object.keys(w).every((k) => topics.some((t) => td[t] === k)));
  test('Every topic has a resource with obj, title and search',
    topics.every((t) => { const r = p.topicResources[t]; return r && /^\d\.\d+$/.test(r.obj) && r.title && r.search; }));
  const dkeys = Object.keys(w);
  const res = (p && p.topicResources) || {};
  test('Each topic obj domain digit equals its domain index (domainWeights order)',
    topics.every((t) => res[t] && res[t].obj.split('.')[0] === String(dkeys.indexOf(td[t]) + 1)));
  test('Every topic obj is one of the 15 official CY0-001 objectives',
    topics.every((t) => res[t] && OFFICIAL.indexOf(res[t].obj) !== -1));
  test('Every official objective has at least one topic',
    OFFICIAL.every((o) => topics.some((t) => res[t] && res[t].obj === o)));
  test('objectiveRanges states the official ranges',
    ['1.1–1.3', '2.1–2.6', '3.1–3.3', '4.1–4.3'].every((r) => m.objectiveRanges.indexOf(r) !== -1) && !/PROVISIONAL/i.test(m.objectiveRanges));
  test('Retention concept objective equals its parent topic obj', rc.every((c) => res[c.parentTopic] && c.objective === res[c.parentTopic].obj));
  test('Retention covers Domain 1 (ai-concepts)', rc.some((c) => td[c.parentTopic] === 'ai-concepts'));
  test('At least 8 retention concepts, each with parentTopic in topicDomains',
    rc.length >= 8 && rc.every((c) => c.label && c.keyword && Object.prototype.hasOwnProperty.call(td, c.parentTopic)));
  const ex = p.questionExemplars || [];
  const mcq = ex.filter((e) => e.type === 'mcq');
  const multi = ex.filter((e) => e.type === 'multi-select');
  test('Exemplar bank has exactly 200 entries', Array.isArray(ex) && ex.length === 200);
  test('Every exemplar topic is a topicDomains key and its objective equals that topic obj',
    ex.every((e) => Object.prototype.hasOwnProperty.call(td, e.topic) && res[e.topic] && e.objective === res[e.topic].obj));
  test('Every topic has at least 2 exemplars', topics.every((t) => ex.filter((e) => e.topic === t).length >= 2));
  test('Every official objective has at least 2 exemplars', OFFICIAL.every((o) => ex.filter((e) => e.objective === o).length >= 2));
  test('Every exemplar objective domain digit matches its topic domain',
    ex.every((e) => e.objective.split('.')[0] === String(dkeys.indexOf(td[e.topic]) + 1)));
  test('Exemplar domain split is 34/80/48/38',
    dkeys.map((k) => ex.filter((e) => td[e.topic] === k).length).join('/') === '34/80/48/38');
  const dShare = (d) => ex.filter((e) => e.difficulty === d).length / ex.length;
  test('Difficulty is roughly 25/50/25 (Foundational 18-32%, Exam Level 42-58%, Hard 18-32%)',
    dShare('Foundational') >= 0.18 && dShare('Foundational') <= 0.32 &&
    dShare('Exam Level') >= 0.42 && dShare('Exam Level') <= 0.58 && dShare('Hard') >= 0.18 && dShare('Hard') <= 0.32);
  test('Every MCQ explanation has a "(X) Wrong" rebuttal per distractor, with no letter-as-correct phrasing',
    mcq.every((e) => Object.keys(e.options).filter((k) => k !== e.answer).every((k) => new RegExp('\\(' + k + '\\)\\s*Wrong').test(e.explanation)) &&
      !/\b[A-E] is (correct|right)\b/i.test(e.explanation)));
  test('No exemplar has duplicate options',
    ex.every((e) => { const v = Object.values(e.options); return new Set(v.map((x) => x.toLowerCase())).size === v.length; }));
  const letterShare = (L) => (mcq.filter((e) => e.answer === L).length / (mcq.length || 1)) * 100;
  test('MCQ answer letters each carry 18-32% of MCQs',
    mcq.length > 0 && ['A', 'B', 'C', 'D'].every((L) => letterShare(L) >= 18 && letterShare(L) <= 32));
  const longest = mcq.filter((e) => {
    const lens = Object.values(e.options).map((v) => v.length);
    const max = Math.max(...lens);
    return e.options[e.answer].length === max && lens.filter((x) => x === max).length === 1;
  }).length;
  test('Correct option is the strictly longest in at most 35% of MCQs', mcq.length > 0 && longest / mcq.length <= 0.35);
  test('MCQs have options A-D and a valid single answer letter',
    mcq.every((e) => Object.keys(e.options).join('') === 'ABCD' && typeof e.answer === 'string' && !!e.options[e.answer]));
  test('Multi-selects use answers[] (two valid keys) with options A-E and a (Choose TWO) stem',
    multi.length > 0 && multi.every((e) => Array.isArray(e.answers) && e.answers.length === 2 &&
      e.answers.every((k) => !!e.options[k]) && Object.keys(e.options).join('') === 'ABCDE' && /^\(Choose TWO\)/.test(e.question)));
  test('Multi-selects are roughly 12-18% of the bank', multi.length / ex.length >= 0.12 && multi.length / ex.length <= 0.18);
  test('Exemplars carry difficulty, explanation and source',
    ex.every((e) => ['Foundational', 'Exam Level', 'Hard'].indexOf(e.difficulty) !== -1 && e.explanation && /^Original/.test(e.source)));
  // Round-1 fix: key length must not be a tell. Rank 1 = longest option, 4 = shortest (ties favour the key).
  const rankOf = (e) => 1 + Object.keys(e.options).filter((k) => k !== e.answer && e.options[k].length > e.options[e.answer].length).length;
  const rankShare = (r) => (mcq.filter((e) => rankOf(e) === r).length / (mcq.length || 1)) * 100;
  test('Key length rank (1=longest..4=shortest) is spread: each rank carries 15-40% of MCQs',
    mcq.length > 0 && [1, 2, 3, 4].every((r) => rankShare(r) >= 15 && rankShare(r) <= 40));
  const topTwo = multi.filter((e) => {
    const sorted = Object.keys(e.options).sort((a, b) => e.options[b].length - e.options[a].length);
    return e.answers.every((k) => sorted.slice(0, 2).indexOf(k) !== -1);
  }).length;
  test('Multi-selects: both keys are the two longest options in at most 6 of 30', topTwo <= 6);
  const ABS = /\b(always|never|only|guarantee[sd]?|guaranteeing|every|all|none|entirely|completely|forever)\b/i;
  const dist = [];
  ex.forEach((e) => Object.keys(e.options).forEach((k) => { if ([].concat(e.answer || e.answers).indexOf(k) === -1) dist.push(e.options[k]); }));
  test('Absolute words (always/never/only/every/all...) appear in under 12% of distractors',
    dist.length > 0 && dist.filter((t) => ABS.test(t)).length / dist.length < 0.12);
  // OWASP naming ruling: under 2.6, items use CompTIA's attack names; the OWASP 2025 names belong only
  // in items that cite the OWASP 2025 list (an explanation may add "called X in the OWASP 2025 list").
  // The two naming sets are never mixed in one item's options.
  const COMPTIA_NAMES = /Model denial of service|Insecure output handling|Insecure plug-?in design|Overreliance/i;
  const OWASP25_NAMES = /Unbounded consumption|Improper output handling|System prompt leakage|Vector and embedding weaknesses|Misinformation|Data and model poisoning/i;
  const cites2025 = (e) => /OWASP[\s\S]*2025/.test(e.question + ' ' + Object.values(e.options).join(' '));
  test('Items citing the OWASP 2025 list use its current names, not the pre-2025 CompTIA names',
    ex.filter(cites2025).every((e) => !COMPTIA_NAMES.test(JSON.stringify(e.options))));
  test('Objective 2.6 items use CompTIA attack names in options unless they cite the OWASP 2025 list',
    ex.filter((e) => e.objective === '2.6' && !cites2025(e)).every((e) => !OWASP25_NAMES.test(JSON.stringify(e.options))));
  test('Exemplar stems are distinct', new Set(ex.map((e) => e.question)).size === ex.length);
})();
