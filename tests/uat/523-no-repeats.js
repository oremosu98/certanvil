// tests/uat/523-no-repeats.js
// Scope: persona bundle Task 7. No repeat questions across days (features/seen-questions.js).
// Spec: docs/superpowers/specs/2026-10-30-why-score-bookit-repeats-design.md §3
const fs = require('fs');
const path = require('path');
const { _fnBody, js, html, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── No repeat questions across days ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const file = path.join(ROOT, 'features', 'seen-questions.js');
  const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const qe = fs.readFileSync(path.join(ROOT, 'features', 'quiz-engine.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const DAY = 86400000;

  function sandbox(cert, store0) {
    const store = new Map(Object.entries(store0 || {}));
    const win = {};
    const ctx = vm.createContext({
      JSON, Math, Object, Array, String, Number, Date, Set,
      window: win, CURRENT_CERT: cert || 'secplus',
      localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }
    });
    try { vm.runInContext(_fnBody(js, '_normalizeStemForDedup') + '\n' + src, ctx); } catch (_) { /* missing module: tests below fail */ }
    const raw = () => JSON.parse(store.get('nplus_seen_q') || '{}');
    const age = (days) => { const o = raw(); Object.keys(o).forEach((c) => o[c].forEach((e) => { e.at -= days * DAY; })); store.set('nplus_seen_q', JSON.stringify(o)); };
    return { win, store, raw, age };
  }
  const Q = (stem, opts, answer, topic) => ({ question: stem, options: opts, answer, topic: topic || 'Cryptography', explanation: 'x' });
  const AES = Q('Which algorithm is a symmetric block cipher used to encrypt data at rest?', ['RSA', 'AES', 'ECC', 'SHA-256'], 'B');

  const s = sandbox();
  const W = s.win;
  test('Module: exposes seenRecord, seenFilter, seenRecentStems, seenAnsweredWithin on window',
    ['seenRecord', 'seenFilter', 'seenRecentStems', 'seenAnsweredWithin', 'seenPromptBlock'].every((n) => typeof W[n] === 'function'));
  if (typeof W.seenRecord !== 'function') return;

  test('Empty memory: the filter keeps everything', W.seenFilter([AES]).kept.length === 1 && W.seenFilter([AES]).dropped === 0);
  W.seenRecord([AES], 'Cryptography');
  const stored = s.raw().secplus;
  test('Record: stored per cert under nplus_seen_q as {fp, stem, ans, topic, at}',
    Array.isArray(stored) && stored.length === 1 && ['fp', 'stem', 'ans', 'topic', 'at'].every((k) => k in stored[0]) && stored[0].topic === 'Cryptography');

  const exact = Q(AES.question, AES.options.slice(), 'B');
  const reworded = Q('Used to encrypt data at rest, which algorithm is a symmetric block cipher?', ['AES', 'RSA', 'SHA-256', 'ECC'], 'A');
  const newFact = Q('Which algorithm is an asymmetric cipher based on elliptic curves?', ['RSA', 'AES', 'ECC', 'SHA-256'], 'C');
  const r = W.seenFilter([exact, reworded, newFact]);
  test('Filter: drops an exact repeat', !r.kept.includes(exact));
  test('Filter: drops a reworded repeat with the same right answer (options shuffled)', !r.kept.includes(reworded));
  test('Filter: keeps a same-topic question on a new fact', r.kept.length === 1 && r.kept[0] === newFact && r.dropped === 2);
  const sameWordsOtherAnswer = Q(AES.question, ['RSA', 'AES', 'ECC', '3DES'], 'D');
  test('Filter: same wording but a different right answer is kept', W.seenFilter([sameWordsOtherAnswer]).dropped === 0);

  s.age(31);
  test('Expiry: a question answered 31 days ago no longer counts', W.seenFilter([exact]).dropped === 0);
  W.seenRecord([newFact], 'Cryptography');
  test('Expiry: old entries are pruned on the next write', s.raw().secplus.length === 1);

  const c = sandbox();
  const many = Array.from({ length: 1600 }, (_, i) => Q('Distinct stem number ' + i + ' about port ' + (1000 + i) + '?', ['a', 'b', 'c', 'd'], 'A'));
  c.win.seenRecord(many, 'Ports');
  const capped = c.raw().secplus;
  test('Cap: at most 1,500 per cert, newest kept', capped.length === 1500 && capped[capped.length - 1].stem === many[1599].question
    && !capped.some((e) => e.stem === many[0].question));
  test('Cap: other certs are untouched', !('netplus' in c.raw()) || c.raw().netplus.length === 0);

  const p = sandbox();
  p.win.seenRecord(Array.from({ length: 25 }, (_, i) => Q('Stem ' + i + ': which control applies here?', ['a', 'b', 'c', 'd'], 'B')), 'Security Controls');
  p.win.seenRecord([Q('Which port does LDAPS use?', ['389', '636', '443', '22'], 'B')], 'Ports');
  const stems = p.win.seenRecentStems('Security Controls');
  test('Recent stems: last 20 on the topic, newest first', stems.length === 20 && stems[0] === 'Stem 24: which control applies here?' && !stems.some((x) => /LDAPS/.test(x)));
  const block = p.win.seenPromptBlock('Security Controls');
  test('Prompt block: exact header, 20 stems at most',
    block.indexOf('\n\nAlready asked recently (cover something else):\n- ') === 0 && block.split('\n- ').length - 1 === 20);
  test('Prompt block: empty when nothing was seen on the topic', p.win.seenPromptBlock('Cloud Security') === '');
  test('Prompt: appended after ${staleBlock} in the writer prompt',
    /\$\{exemplarBlock\}\$\{retentionBlock\}\$\{staleBlock\}\$\{typeof seenPromptBlock === 'function' \? seenPromptBlock\(qTopic\) : ''\}\nGenerate exactly \$\{n\}/.test(appJs));

  const k = sandbox();
  k.win.seenRecord([AES], 'Cryptography');
  test('Cache: answered within 7 days is detected', k.win.seenAnsweredWithin([newFact, exact], 7) === true);
  k.age(8);
  test('Cache: answered 8 days ago no longer blocks the cache', k.win.seenAnsweredWithin([exact], 7) === false);

  const sq = _fnBody(qe, 'startQuiz') || '';
  test('startQuiz: cache served only when !seenAnsweredWithin(cached, 7)',
    /seenAnsweredWithin\(_cachedRaw, 7\)/.test(sq) && /const cached = _cachedRaw &&/.test(sq) && /_logQuizFill\(qCount, 0, cached \? 'cache' : 'error', _fill\.rounds,/.test(sq));
  test('startQuiz: _fill is declared before the try, so a starved fill still logs its repeats round',
    /const _fill = \{ rounds: \[\] \};\s*\n\s*try \{/.test(sq));
  test('startQuiz: filter runs after validateQuestions and in every top-up round',
    /if \(questions\.length === 0\) throw[^\n]*\n\s*questions = _dropSeen\(questions\);/.test(sq)
      && /const fresh = _dropSeen\(extraValidated\.filter\(q => !have\.has\(/.test(sq));
  test('startQuiz: repeats counted into _fill.rounds as {label:\'repeats\', dropped}',
    /_fill\.rounds\.push\(\{ label: 'repeats', dropped: _repeats \}\)/.test(sq));
  test('startQuiz: an all-repeats fill ends in the normal error, not an empty quiz',
    /if \(questions\.length === 0\) throw new Error\('Couldn\\u2019t make new questions this time\. Try again\.'\)/.test(sq));
  test('Finish: answered questions are recorded, never in a mistake drill',
    /if \(!wrongDrillMode\) \{\s*\n\s*if \(window\.seenRecord\) seenRecord\(log\.map\(e => e\.q\), activeQuizTopic\);/.test(_fnBody(qe, 'finish') || ''));
  const drillBody = _fnBody(appJs, 'startWrongDrill') || '', resumeBody = _fnBody(js, 'resumeQuiz') || '';
  test('Drill + resume skip the filter (bodies found first)',
    drillBody.length > 200 && resumeBody.length > 200 && /wrongDrillMode = true/.test(drillBody) && /questions/.test(resumeBody)
      && !/seenFilter|_dropSeen|startQuiz\(/.test(drillBody) && !/seenFilter|_dropSeen|startQuiz\(/.test(resumeBody));

  // Short-set notice: repeats get their own honest reason.
  const toasts = [], pill = { cls: new Set(), textContent: '', title: '', classList: null, removeAttribute(k) { this[k] = ''; } };
  pill.classList = { toggle: (c, on) => { if (on) pill.cls.add(c); else pill.cls.delete(c); } };
  const nctx = vm.createContext({ document: { getElementById: (id) => (id === 'short-notice' ? pill : null) }, showErrorToast: (m) => toasts.push(m) });
  vm.runInContext((_fnBody(js, '_shortReason') || '') + '\n' + (_fnBody(js, '_noteShortQuiz') || ''), nctx);
  const note = (a, g, rounds) => vm.runInContext('_noteShortQuiz(' + a + ',' + g + ',' + JSON.stringify(rounds) + ')', nctx);
  note(10, 7, [{ asked: 13, afterLocal: 13 }, { label: 'repeats', dropped: 4 }]);
  test('Short notice: repeats covering the gap read "N left out because you\'ve seen them recently."',
    toasts[0] === "7 of 10 questions came through. 3 left out because you've seen them recently." && pill.title === "3 left out because you've seen them recently.");
  note(10, 6, [{ asked: 13, afterLocal: 9 }, { label: 'repeats', dropped: 2 }]);
  test('Short notice: repeats that don\'t cover the gap keep the quality-checks reason',
    toasts[1] === "6 of 10 questions came through. 4 didn't pass the quality checks.");
  note(10, 8, [{ error: 'Failed to fetch' }, { label: 'repeats', dropped: 5 }]);
  test('Short notice: an error still wins over repeats', toasts[2] === "8 of 10 questions came through. The AI stopped responding partway, so 2 weren't made.");
  test('Telemetry: _logQuizFill prints the repeats round', /x\.label === 'repeats' \? 'repeats -' \+ x\.dropped/.test(_fnBody(qe, '_logQuizFill') || ''));
  test('Loaded: index.html loads features/seen-questions.js', /<script defer src="features\/seen-questions\.js"><\/script>/.test(html));
})();
