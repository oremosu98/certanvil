// tests/uat/551-cert-prince2.js
// Scope: PRINCE2 7 Foundation pack: meta, domain weights, topic coverage, retention concepts,
// and the 200-exemplar bank with the same quality checks as the SecAI+ pack (letters, length rank,
// absolute words, multi-select caps) plus PRINCE2-specific wording checks.
const fs = require('fs');
const path = require('path');
const { test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── PRINCE2 7 Foundation pack ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const src = fs.readFileSync(path.join(ROOT, 'certs', 'prince2.js'), 'utf8');
  const win = {};
  const ctx = vm.createContext({ window: win });
  vm.runInContext(src, ctx);
  const p = win.CERT_PACKS && win.CERT_PACKS.prince2;
  const m = (p && p.meta) || {};
  const w = (p && p.domainWeights) || {};
  const td = (p && p.topicDomains) || {};
  const topics = Object.keys(td);
  const rc = (p && p.retentionGapConcepts) || [];
  const res = (p && p.topicResources) || {};
  const dkeys = Object.keys(w);

  test('Pack declares window.CERT_PACKS.prince2', !!p && m.id === 'prince2');
  test('Meta: Foundation, 60 pass on 0-100 percent, 60 questions, 3600 s',
    m.code === 'Foundation' && m.examPassScore === 60 && m.examMaxScore === 100 && m.examMinScore === 0 &&
    m.examQuestionCount === 60 && m.examTimeSeconds === 3600);
  test('Meta: weights are flagged as estimates (PeopleCert publishes no area weights)', m.weightsAreEstimates === true);
  test('Meta: name and blueprint URL', m.name === 'PRINCE2 7 Foundation' &&
    m.blueprintUrl === 'https://www.peoplecert.org/browse-certifications/project-programme-and-portfolio-management/PRINCE2-2/PRINCE2-7-foundation-3579');
  test('Domain keys and weights match the spec, in order',
    dkeys.join() === 'practices,processes,people,principles,concepts' &&
    w.practices === 0.60 && w.processes === 0.15 && w.people === 0.13 && w.principles === 0.08 && w.concepts === 0.04);
  test('Domain weights sum to 1', Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  test('Every domain has a label', dkeys.every((k) => p.domainLabels && typeof p.domainLabels[k] === 'string' && p.domainLabels[k]));
  test('Every topic maps to a declared domain', topics.every((t) => Object.prototype.hasOwnProperty.call(w, td[t])));
  test('Every domain has at least one topic', dkeys.every((k) => topics.some((t) => td[t] === k)));
  test('Every topic has a resource with obj, title and search',
    topics.every((t) => { const r = res[t]; return r && /^\d\.\d+$/.test(r.obj) && r.title && r.search; }));
  test('Each topic obj domain digit equals its domain index (domainWeights order)',
    topics.every((t) => res[t] && res[t].obj.split('.')[0] === String(dkeys.indexOf(td[t]) + 1)));
  test('All topic obj values are unique', new Set(topics.map((t) => res[t] && res[t].obj)).size === topics.length);
  const counts = dkeys.map((k) => topics.filter((t) => td[t] === k).length);
  test('Exactly 32 topics, split 7/7/4/7/7, matching objectiveRanges',
    topics.length === 32 && counts.join('/') === '7/7/4/7/7' &&
    ['1.1–1.7', '2.1–2.7', '3.1–3.4', '4.1–4.7', '5.1–5.7'].every((r) => m.objectiveRanges.indexOf(r) !== -1));
  test('Topic objs run 1..7 within each domain with no gaps',
    dkeys.every((k, i) => topics.filter((t) => td[t] === k).map((t) => res[t].obj).sort().join() ===
      [1, 2, 3, 4, 5, 6, 7].slice(0, counts[i]).map((n) => (i + 1) + '.' + n).join()));
  test('Retention concept objective equals its parent topic obj', rc.every((c) => res[c.parentTopic] && c.objective === res[c.parentTopic].obj));
  test('At least 8 retention concepts, each with parentTopic in topicDomains',
    rc.length >= 8 && rc.every((c) => c.label && c.keyword && Object.prototype.hasOwnProperty.call(td, c.parentTopic)));
  test('Retention concepts have unique labels', new Set(rc.map((c) => c.label)).size === rc.length);
  test('Retention covers practices, processes, people, principles and concepts',
    dkeys.every((k) => rc.some((c) => td[c.parentTopic] === k)));
  test('Retention: practices replaced Themes in v7 and sustainability is the seventh aspect',
    rc.some((c) => /replaced/.test(c.keyword) && /Themes/.test(c.keyword)) &&
    rc.some((c) => /SEVEN aspects/.test(c.keyword) && /SUSTAINABILITY/.test(c.keyword)));
  test('No retention keyword claims a six-aspect or eight-practice list as current',
    !rc.some((c) => /six aspects of project performance|eight practices/i.test(c.keyword)));
  test('Pack header carries the trademark note and no-verbatim statement',
    /PRINCE2® is a registered trademark of PeopleCert\. Not affiliated with or endorsed by PeopleCert\./.test(src) &&
    /No verbatim text from the official PRINCE2 manual/.test(src));
  test('Topic resources point to public pages only (no paid-course domains)',
    !/udemy|coursera|simplilearn|knowledgetrain|projex|apmg-international/i.test(JSON.stringify(res)));

  const ex = p.questionExemplars || [];
  test('questionExemplars is an array', Array.isArray(p.questionExemplars));
  test('Exemplar bank has exactly 200 entries', ex.length === 200);
  const mcq = ex.filter((e) => e.type === 'mcq');
  const multi = ex.filter((e) => e.type === 'multi-select');
  test('Every exemplar topic is a topicDomains key and its objective equals that topic obj',
    ex.every((e) => Object.prototype.hasOwnProperty.call(td, e.topic) && res[e.topic] && e.objective === res[e.topic].obj));
  test('Every topic has at least 2 exemplars', topics.every((t) => ex.filter((e) => e.topic === t).length >= 2));
  test('Exemplar domain split is 114/30/26/16/14 (concepts carries 2 per topic)',
    dkeys.map((k) => ex.filter((e) => td[e.topic] === k).length).join('/') === '114/30/26/16/14');
  test('Multi-selects are roughly 6-10% of the bank', multi.length / ex.length >= 0.06 && multi.length / ex.length <= 0.10);
  const dShare = (d) => ex.filter((e) => e.difficulty === d).length / ex.length;
  test('Difficulty is roughly 25/50/25 (Foundational 18-32%, Exam Level 42-58%, Hard 18-32%)',
    dShare('Foundational') >= 0.18 && dShare('Foundational') <= 0.32 &&
    dShare('Exam Level') >= 0.42 && dShare('Exam Level') <= 0.58 && dShare('Hard') >= 0.18 && dShare('Hard') <= 0.32);
  test('Which-is-NOT stems are at most 10% of the bank and capitalise NOT',
    ex.filter((e) => /\bNOT\b/.test(e.question)).length / ex.length <= 0.10 && !ex.some((e) => /\b[Ww]hich\b[^.?]*\b(is|are) not\b/.test(e.question)));
  test('Source line is the founder mock bank attribution on every exemplar',
    ex.every((e) => e.source === "Original — founder's PRINCE2 7 mock bank, reworked"));
  test('Every MCQ explanation has a "(X) Wrong" rebuttal per distractor and an Exam clue closer, with no letter-as-correct phrasing',
    mcq.every((e) => Object.keys(e.options).filter((k) => k !== e.answer).every((k) => new RegExp('\\(' + k + '\\)\\s*Wrong').test(e.explanation)) &&
      /Exam clue:/.test(e.explanation) && !/\b[A-E] is (correct|right)\b/i.test(e.explanation)));
  test('No exemplar uses 6th-edition framing as current (Themes, six aspects, eight practices)',
    !/\bThemes?\b|six aspects of project performance|eight practices/i.test(JSON.stringify(ex)));
  test('No exemplar has duplicate or lowercase-initial options',
    ex.every((e) => { const v = Object.values(e.options); return new Set(v.map((x) => x.toLowerCase())).size === v.length && v.every((x) => /^[A-Z0-9'(]/.test(x)); }));
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
    multi.every((e) => Array.isArray(e.answers) && e.answers.length === 2 &&
      e.answers.every((k) => !!e.options[k]) && Object.keys(e.options).join('') === 'ABCDE' && /^\(Choose TWO\)/.test(e.question)));
  test('Exemplars carry difficulty, explanation and source',
    ex.every((e) => ['Foundational', 'Exam Level', 'Hard'].indexOf(e.difficulty) !== -1 && e.explanation && /^Original/.test(e.source)));
  const rankOf = (e) => 1 + Object.keys(e.options).filter((k) => k !== e.answer && e.options[k].length > e.options[e.answer].length).length;
  const rankShare = (r) => (mcq.filter((e) => rankOf(e) === r).length / (mcq.length || 1)) * 100;
  test('Key length rank (1=longest..4=shortest) is spread: each rank carries 15-40% of MCQs',
    mcq.length > 0 && [1, 2, 3, 4].every((r) => rankShare(r) >= 15 && rankShare(r) <= 40));
  const topTwo = multi.filter((e) => {
    const sorted = Object.keys(e.options).sort((a, b) => e.options[b].length - e.options[a].length);
    return e.answers.every((k) => sorted.slice(0, 2).indexOf(k) !== -1);
  }).length;
  test('Multi-selects: both keys are the two longest options in at most 20% of items', multi.length === 0 || topTwo / multi.length <= 0.20);
  const ABS = /\b(always|never|only|guarantee[sd]?|guaranteeing|every|all|none|entirely|completely|forever)\b/i;
  const dist = [];
  ex.forEach((e) => Object.keys(e.options).forEach((k) => { if ([].concat(e.answer || e.answers).indexOf(k) === -1) dist.push(e.options[k]); }));
  test('Absolute words (always/never/only/every/all...) appear in under 12% of distractors',
    dist.length > 0 && dist.filter((t) => ABS.test(t)).length / dist.length < 0.12);
  const keyTexts = [];
  ex.forEach((e) => [].concat(e.answer || e.answers).forEach((k) => keyTexts.push(e.options[k])));
  const semi = (arr) => arr.filter((t) => t.indexOf(';') !== -1).length / (arr.length || 1);
  test('Semicolons: share of keys containing ";" is at most 1.5x the distractor share (plus 1pp)',
    semi(keyTexts) <= semi(dist) * 1.5 + 0.01);
  const lead2 = (t) => t.split(' ').slice(0, 2).join(' ').toLowerCase();
  test('No MCQ has all three distractors opening with the same two words while the key opens differently',
    mcq.every((e) => { const d = Object.keys(e.options).filter((k) => k !== e.answer).map((k) => lead2(e.options[k])); return !(d.every((x) => x === d[0]) && lead2(e.options[e.answer]) !== d[0]); }));
  test('Issue types: no item makes "problem" and "concern" compete as options',
    !mcq.some((e) => /^An? (problem|concern)\b/i.test(e.options[e.answer]) && Object.values(e.options).some((v) => /^An? (problem|concern)\b/i.test(v) && v !== e.options[e.answer])));
  test('Exemplar stems are distinct', new Set(ex.map((e) => e.question)).size === ex.length);
})();
