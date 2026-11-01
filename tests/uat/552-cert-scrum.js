// tests/uat/552-cert-scrum.js
// Scope: Scrum.org PSM I and PSM II packs (scaffold): meta, estimated domain weights, topic coverage,
// retention concepts, legal header, and guarded exemplar-quality checks that activate once the
// exemplar banks are populated (same strength as the PRINCE2 pack's checks).
const fs = require('fs');
const path = require('path');
const { test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Scrum.org PSM I + PSM II packs ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');

  function load(id) {
    const src = fs.readFileSync(path.join(ROOT, 'certs', id + '.js'), 'utf8');
    const win = {};
    vm.runInContext(src, vm.createContext({ window: win }));
    return { src, p: win.CERT_PACKS && win.CERT_PACKS[id] };
  }

  const SPEC = {
    psm1: {
      name: 'Professional Scrum Master I', code: 'PSM I', q: 80, t: 3600, topics: 25,
      url: 'https://www.scrum.org/assessments/professional-scrum-master-i-certification',
      keys: 'framework,people-teams,product', weights: [0.60, 0.20, 0.20], split: '15/5/5'
    },
    psm2: {
      name: 'Professional Scrum Master II', code: 'PSM II', q: 30, t: 5400, topics: 22,
      url: 'https://www.scrum.org/assessments/professional-scrum-master-ii-certification',
      keys: 'framework,coaching,product-value,done-scaling', weights: [0.30, 0.35, 0.20, 0.15], split: '6/7/5/4'
    }
  };

  Object.keys(SPEC).forEach((id) => {
    const S = SPEC[id];
    const { src, p } = load(id);
    const L = S.code + ': ';
    const m = (p && p.meta) || {};
    const w = (p && p.domainWeights) || {};
    const td = (p && p.topicDomains) || {};
    const topics = Object.keys(td);
    const rc = (p && p.retentionGapConcepts) || [];
    const res = (p && p.topicResources) || {};
    const dkeys = Object.keys(w);

    test(L + 'pack declares window.CERT_PACKS.' + id, !!p && m.id === id);
    test(L + 'meta: name, code, family scrum, blueprint URL',
      m.name === S.name && m.code === S.code && m.family === 'scrum' && m.blueprintUrl === S.url);
    test(L + 'meta: 85 pass on 0-100 percent, ' + S.q + ' questions, ' + S.t + ' s',
      m.examPassScore === 85 && m.examMaxScore === 100 && m.examMinScore === 0 &&
      m.examQuestionCount === S.q && m.examTimeSeconds === S.t);
    test(L + 'weights are flagged as estimates (meta and header)',
      m.weightsAreEstimates === true && /Scrum\.org publishes no domain weights/.test(src) && /CertAnvil estimates/.test(src));
    test(L + 'domain keys and weights match the spec, in order',
      dkeys.join() === S.keys && S.weights.every((x, i) => w[dkeys[i]] === x));
    test(L + 'domain weights sum to 1', Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 1) < 1e-9);
    test(L + 'every domain has a label', dkeys.every((k) => p.domainLabels && typeof p.domainLabels[k] === 'string' && p.domainLabels[k]));
    test(L + 'every topic maps to a declared domain', topics.every((t) => Object.prototype.hasOwnProperty.call(w, td[t])));
    test(L + 'every domain has at least one topic', dkeys.every((k) => topics.some((t) => td[t] === k)));
    test(L + 'every topic has a resource with obj, title and search',
      topics.every((t) => { const r = res[t]; return r && /^\d\.\d+$/.test(r.obj) && r.title && r.search; }));
    test(L + 'each topic obj domain digit equals its domain index (domainWeights order)',
      topics.every((t) => res[t] && res[t].obj.split('.')[0] === String(dkeys.indexOf(td[t]) + 1)));
    test(L + 'all topic obj values are unique', new Set(topics.map((t) => res[t] && res[t].obj)).size === topics.length);
    const counts = dkeys.map((k) => topics.filter((t) => td[t] === k).length);
    test(L + 'exactly ' + S.topics + ' topics, split ' + S.split + ', matching objectiveRanges',
      topics.length === S.topics && counts.join('/') === S.split &&
      counts.every((c, i) => m.objectiveRanges.indexOf((i + 1) + '.1–' + (i + 1) + '.' + c) !== -1));
    test(L + 'topic objs run 1..N within each domain with no gaps',
      dkeys.every((k, i) => topics.filter((t) => td[t] === k).map((t) => +res[t].obj.split('.')[1]).sort((a, b) => a - b).map((n) => (i + 1) + '.' + n).join() ===
        Array.from({ length: counts[i] }, (_, n) => (i + 1) + '.' + (n + 1)).join()));
    test(L + 'retention concept objective equals its parent topic obj', rc.every((c) => res[c.parentTopic] && c.objective === res[c.parentTopic].obj));
    test(L + 'at least 8 retention concepts, each with parentTopic in topicDomains',
      rc.length >= 8 && rc.every((c) => c.label && c.keyword && Object.prototype.hasOwnProperty.call(td, c.parentTopic)));
    test(L + 'retention concepts have unique labels', new Set(rc.map((c) => c.label)).size === rc.length);
    test(L + 'retention covers at least two domains', new Set(rc.map((c) => td[c.parentTopic])).size >= 2);
    test(L + 'header carries attribution, trademark note and N.M explanation',
      /Scrum Guide 2020 © Ken Schwaber and Jeff Sutherland, CC BY-SA 4\.0 — quoted with attribution/.test(src) &&
      /Professional Scrum Master™ and PSM are trademarks of Scrum\.org\. Not affiliated with or endorsed by Scrum\.org\./.test(src) &&
      /N\.M here = domain number \. topic index within that domain/.test(src));
    test(L + 'topic resources point to public pages only (no paid-course domains)',
      !/udemy|coursera|simplilearn|knowledgetrain|mikecohn|agilemania/i.test(JSON.stringify(res)));
    test(L + 'questionExemplars is an array', Array.isArray(p.questionExemplars));

    // Exemplar-quality checks.
    // Item shapes: 4-option MCQ (A-D), two-option true/false MCQ (options exactly True/False), and
    // multi-select ("(Choose TWO)" with 2 keys or "(Choose THREE)" with 3 keys, options A-E).
    // Length-rank, letter-balance and distractor metrics are computed over the 4-option MCQs only.
    const ex = p.questionExemplars || [];
    const isTF = (e) => e.type === 'mcq' && Object.keys(e.options).join('') === 'AB' && e.options.A === 'True' && e.options.B === 'False';
    const mcq = ex.filter((e) => e.type === 'mcq' && !isTF(e));
    const tf = ex.filter(isTF);
    const multi = ex.filter((e) => e.type === 'multi-select');
    test(L + 'every exemplar is a 4-option MCQ, a True/False MCQ or a multi-select',
      mcq.length + tf.length + multi.length === ex.length);
    test(L + 'every exemplar topic is a topicDomains key and its objective equals that topic obj',
      ex.every((e) => Object.prototype.hasOwnProperty.call(td, e.topic) && res[e.topic] && e.objective === res[e.topic].obj));
    test(L + 'every MCQ explanation has a "(X) Wrong" rebuttal per distractor, no letter-as-correct phrasing',
      [].concat(mcq, tf).every((e) => Object.keys(e.options).filter((k) => k !== e.answer).every((k) => new RegExp('\\(' + k + '\\)\\s*Wrong').test(e.explanation)) &&
        !/\b[A-E] is (correct|right)\b/i.test(e.explanation)));
    test(L + 'every multi-select explanation has a "(X) Wrong" rebuttal per distractor, no letter-as-correct phrasing',
      multi.every((e) => Object.keys(e.options).filter((k) => e.answers.indexOf(k) === -1).every((k) => new RegExp('\\(' + k + '\\)\\s*Wrong').test(e.explanation)) &&
        !/\b[A-E] is (correct|right)\b/i.test(e.explanation)));
    test(L + 'MCQs have options A-D and a valid single answer letter',
      mcq.every((e) => Object.keys(e.options).join('') === 'ABCD' && typeof e.answer === 'string' && !!e.options[e.answer]));
    test(L + 'true/false items key A (True) or B (False), roughly 50/50',
      tf.every((e) => e.answer === 'A' || e.answer === 'B') &&
      (tf.length === 0 || (tf.filter((e) => e.answer === 'A').length / tf.length >= 0.4 && tf.filter((e) => e.answer === 'A').length / tf.length <= 0.6)));
    test(L + 'multi-selects use answers[] (2 or 3 valid keys), options A-E and a matching (Choose TWO/THREE) stem',
      multi.every((e) => Array.isArray(e.answers) && (e.answers.length === 2 || e.answers.length === 3) && e.answers.every((k) => !!e.options[k]) &&
        new Set(e.answers).size === e.answers.length && Object.keys(e.options).join('') === 'ABCDE' &&
        new RegExp('^\\(Choose ' + (e.answers.length === 2 ? 'TWO' : 'THREE') + '\\)').test(e.question)));
    test(L + 'exemplars carry difficulty, explanation and an Original source',
      ex.every((e) => ['Foundational', 'Exam Level', 'Hard'].indexOf(e.difficulty) !== -1 && e.explanation && /^Original/.test(e.source)));
    test(L + 'exemplar stems are distinct', new Set(ex.map((e) => e.question)).size === ex.length);
    test(L + 'no duplicate or lowercase-initial options',
      ex.every((e) => { const v = Object.values(e.options); return new Set(v.map((x) => x.toLowerCase())).size === v.length && v.every((x) => /^[A-Z0-9'(]/.test(x)); }));
    const letterShare = (X) => (mcq.filter((e) => e.answer === X).length / (mcq.length || 1)) * 100;
    test(L + 'MCQ answer letters each carry 18-32% of 4-option MCQs',
      mcq.length > 0 && ['A', 'B', 'C', 'D'].every((X) => letterShare(X) >= 18 && letterShare(X) <= 32));
    const longest = mcq.filter((e) => {
      const lens = Object.values(e.options).map((v) => v.length);
      const max = Math.max(...lens);
      return e.options[e.answer].length === max && lens.filter((x) => x === max).length === 1;
    }).length;
    test(L + 'correct option is the strictly longest in at most 35% of 4-option MCQs', mcq.length > 0 && longest / mcq.length <= 0.35);
    const rankOf = (e) => 1 + Object.keys(e.options).filter((k) => k !== e.answer && e.options[k].length > e.options[e.answer].length).length;
    const rankShare = (r) => (mcq.filter((e) => rankOf(e) === r).length / (mcq.length || 1)) * 100;
    test(L + 'key length rank (1=longest..4=shortest) is spread: each rank 15-40% of 4-option MCQs',
      mcq.length > 0 && [1, 2, 3, 4].every((r) => rankShare(r) >= 15 && rankShare(r) <= 40));
    const topTwo = multi.filter((e) => {
      const sorted = Object.keys(e.options).sort((a, b) => e.options[b].length - e.options[a].length);
      return e.answers.every((k) => sorted.slice(0, 2).indexOf(k) !== -1);
    }).length;
    test(L + 'multi-selects: all keys are among the two longest options in at most 20% of items', multi.length === 0 || topTwo / multi.length <= 0.20);
    const ABS = /\b(always|never|only|guarantee[sd]?|guaranteeing|every|all|none|entirely|completely|forever)\b/i;
    const dist = [];
    ex.forEach((e) => Object.keys(e.options).forEach((k) => { if ([].concat(e.answer || e.answers).indexOf(k) === -1 && !isTF(e)) dist.push(e.options[k]); }));
    test(L + 'absolute words appear in under 12% of distractors',
      dist.length > 0 && dist.filter((t) => ABS.test(t)).length / dist.length < 0.12);
    const keyTexts = [];
    ex.forEach((e) => { if (!isTF(e)) [].concat(e.answer || e.answers).forEach((k) => keyTexts.push(e.options[k])); });
    const semi = (arr) => arr.filter((t) => t.indexOf(';') !== -1).length / (arr.length || 1);
    test(L + 'semicolons: share of keys containing ";" is at most 1.5x the distractor share (plus 1pp)',
      semi(keyTexts) <= semi(dist) * 1.5 + 0.01);
    const lead2 = (t) => t.split(' ').slice(0, 2).join(' ').toLowerCase();
    test(L + 'no MCQ has all three distractors opening with the same two words while the key opens differently',
      mcq.every((e) => { const d = Object.keys(e.options).filter((k) => k !== e.answer).map((k) => lead2(e.options[k])); return !(d.every((x) => x === d[0]) && lead2(e.options[e.answer]) !== d[0]); }));
    // Surface-tell guards added after the adversarial review.
    const CLAUSE = /, (because|since|which|who)\b/i;
    const clauseShare = (arr) => arr.filter((t) => CLAUSE.test(t)).length / (arr.length || 1) * 100;
    test(L + 'comma-clause use (", because|since|which|who") is within 10pp between keys and distractors',
      Math.abs(clauseShare(keyTexts) - clauseShare(dist)) <= 10);
    test(L + 'no 4-option MCQ has two or more clause distractors while the key has none',
      mcq.every((e) => Object.keys(e.options).filter((k) => k !== e.answer && CLAUSE.test(e.options[k])).length < 2 || CLAUSE.test(e.options[e.answer])));
    const longestIsKey = multi.filter((e) => {
      const mx = Math.max(...Object.values(e.options).map((v) => v.length));
      return e.answers.some((k) => e.options[k].length === mx);
    }).length;
    // Lead-verb tell: soft leads (Help/Explain/...) and hard leads (Ask/Tell/...) must not split keys from distractors.
    const SOFT_LEAD = /^(Help|Explain|Facilitate|Coach|Show|Make|Encourage)\b/;
    const HARD_LEAD = /^(Ask|Tell|Agree|Let|Cancel|Refuse|Decline|Escalate|Replace|Delay|Pick|Order|Decide|Stop|Skip|Pause|Drop|Remove|Raise|Add|Pass|Hold|Hire|Take|Schedule|Block|Support)\b/;
    const leadShare = (arr, re) => arr.filter((t) => re.test(t)).length / (arr.length || 1) * 100;
    const mcqKeys = mcq.map((e) => e.options[e.answer]);
    const mcqDist = [];
    mcq.forEach((e) => Object.keys(e.options).forEach((k) => { if (k !== e.answer) mcqDist.push(e.options[k]); }));
    test(L + 'soft-lead share (Help/Explain/Facilitate/Coach/Show/Make/Encourage) is within 20pp between keys and distractors',
      Math.abs(leadShare(mcqKeys, SOFT_LEAD) - leadShare(mcqDist, SOFT_LEAD)) <= 20);
    test(L + 'hard-lead share (Ask/Tell/Agree/Let/Cancel/Refuse...) is within 20pp between keys and distractors',
      Math.abs(leadShare(mcqKeys, HARD_LEAD) - leadShare(mcqDist, HARD_LEAD)) <= 20);
    test(L + 'multi-selects: the longest option is a key in at most 60% of items', multi.length === 0 || longestIsKey / multi.length <= 0.60);
    const longKeys = mcq.filter((e) => {
      const ds = Object.keys(e.options).filter((k) => k !== e.answer).map((k) => e.options[k].length);
      return e.options[e.answer].length >= 1.6 * (ds.reduce((a, b) => a + b, 0) / ds.length);
    }).length;
    test(L + 'at most 8% of 4-option MCQs have a key at least 1.6x the mean distractor length', mcq.length === 0 || longKeys / mcq.length <= 0.08);
    // The topic name "Servant Leadership" is fixed by the PSM II scaffold, so only the item text is checked.
    const itemText = JSON.stringify(ex.map((e) => [e.question, e.options, e.explanation]));
    test(L + 'no 2017 "servant leader" wording in stems, options or explanations', !/servant/i.test(itemText));
    test(L + 'no exemplar uses the pre-2020 "Development Team" framing as current',
      !/\bDevelopment Team\b/.test(JSON.stringify(ex)));

    // PSM II bank shape: 120 scenario-style exemplars from the Scrum Guide 2020, Nexus Guide 2021 and EBM Guide.
    if (id === 'psm2') {
      test(L + 'exemplar bank has exactly 120 entries', ex.length === 120);
      test(L + 'exemplar domain split is 36/42/24/18 (framework / coaching / product-value / done-scaling)',
        dkeys.map((k) => ex.filter((e) => td[e.topic] === k).length).join('/') === '36/42/24/18');
      test(L + 'every topic has at least 3 exemplars', topics.every((t) => ex.filter((e) => e.topic === t).length >= 3));
      test(L + 'exemplar objective digit matches its domain index',
        ex.every((e) => e.objective.split('.')[0] === String(dkeys.indexOf(td[e.topic]) + 1)));
      test(L + 'type mix: 4-option MCQ 74-86%, multi-select 12-18%, true/false 3-8%',
        mcq.length / ex.length >= 0.74 && mcq.length / ex.length <= 0.86 &&
        multi.length / ex.length >= 0.12 && multi.length / ex.length <= 0.18 &&
        tf.length / ex.length >= 0.03 && tf.length / ex.length <= 0.08);
      test(L + 'multi-selects are all Choose TWO', multi.every((e) => e.answers.length === 2));
      test(L + 'most exemplars are scenario stems (at least 70% mention a Scrum Master, team, Developers, Owner or stakeholder situation)',
        ex.filter((e) => /\b(Scrum Master|Developers|Product Owner|stakeholder|Scrum Team|team|teams|manager|executive)\b/i.test(e.question)).length / ex.length >= 0.70);
      test(L + 'at least 45% of exemplars use a BEST or MOST stem',
        ex.filter((e) => /\b(BEST|MOST)\b/.test(e.question)).length / ex.length >= 0.45);
      const dShare2 = (d) => ex.filter((e) => e.difficulty === d).length / ex.length;
      test(L + 'difficulty is roughly 10/50/40 (Foundational 6-16%, Exam Level 42-58%, Hard 32-46%)',
        dShare2('Foundational') >= 0.06 && dShare2('Foundational') <= 0.16 &&
        dShare2('Exam Level') >= 0.42 && dShare2('Exam Level') <= 0.58 &&
        dShare2('Hard') >= 0.32 && dShare2('Hard') <= 0.46);
      test(L + 'source line names the Scrum Guide 2020, Nexus Guide 2021 and EBM Guide on every exemplar',
        ex.every((e) => e.source === 'Original, based on the Scrum Guide 2020 / Nexus Guide 2021 / EBM Guide (public)'));
      test(L + 'every exemplar closes with an Exam clue', ex.every((e) => /Exam clue: /.test(e.explanation)));
      test(L + 'no 2017-Guide or 2018-Nexus content (Development Team, self-organizing, three questions, three-part Nexus retrospective, Nexus Sprint Retrospective in three parts)',
        !/\bDevelopment Team\b|self-organi[sz]ing|three questions|three standard questions|three-part|what did I do yesterday|Nexus Sprint Retrospective[^.]*three/i.test(itemText));
      test(L + 'which-is-NOT stems are at most 10% of the bank and capitalise NOT',
        ex.filter((e) => /\bNOT\b/.test(e.question)).length / ex.length <= 0.10 && !ex.some((e) => /\b[Ww]hich\b[^.?]*\b(is|are) not\b/.test(e.question)));
    }

    // PSM I bank shape (the PSM II bank has its own task).
    if (id === 'psm1') {
      test(L + 'exemplar bank has exactly 200 entries', ex.length === 200);
      test(L + 'exemplar domain split is 120/40/40 (framework / people-teams / product)',
        dkeys.map((k) => ex.filter((e) => td[e.topic] === k).length).join('/') === '120/40/40');
      test(L + 'every topic has at least 3 exemplars', topics.every((t) => ex.filter((e) => e.topic === t).length >= 3));
      test(L + 'type mix: 4-option MCQ 68-82%, multi-select 12-18%, true/false 7-13%',
        mcq.length / ex.length >= 0.68 && mcq.length / ex.length <= 0.82 &&
        multi.length / ex.length >= 0.12 && multi.length / ex.length <= 0.18 &&
        tf.length / ex.length >= 0.07 && tf.length / ex.length <= 0.13);
      test(L + 'multi-selects include both Choose TWO and Choose THREE items', multi.some((e) => e.answers.length === 2) && multi.some((e) => e.answers.length === 3));
      const dShare = (d) => ex.filter((e) => e.difficulty === d).length / ex.length;
      test(L + 'difficulty is roughly 25/50/25 (Foundational 18-32%, Exam Level 42-58%, Hard 18-32%)',
        dShare('Foundational') >= 0.18 && dShare('Foundational') <= 0.32 &&
        dShare('Exam Level') >= 0.42 && dShare('Exam Level') <= 0.58 && dShare('Hard') >= 0.18 && dShare('Hard') <= 0.32);
      test(L + 'source line is the Scrum Guide 2020 attribution on every exemplar',
        ex.every((e) => e.source === 'Original, based on the Scrum Guide 2020 (CC BY-SA 4.0)'));
      test(L + 'which-is-NOT stems are at most 10% of the bank and capitalise NOT',
        ex.filter((e) => /\bNOT\b/.test(e.question)).length / ex.length <= 0.10 && !ex.some((e) => /\b[Ww]hich\b[^.?]*\b(is|are) not\b/.test(e.question)));
      test(L + 'no exemplar teaches 2017-Guide content as current (three questions, Development Team, self-organizing)',
        !/self-organi[sz]ing|\bDevelopment Team\b|what did I do yesterday/i.test(JSON.stringify(ex)));
    }
  });
})();
