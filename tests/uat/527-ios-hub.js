// tests/uat/527-ios-hub.js
// Scope: persona bundle Task 12. The My certs hub model: sections and sorting, the stale note (15 days vs 14),
// passed rows with and without a score, the next-exam stat, and the Free folded row. Spec: 2026-10-30-my-certs-hub-design.md
const fs = require('fs');
const path = require('path');
const { _fnBody, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── My certs hub ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const src = fs.readFileSync(path.join(ROOT, 'features', 'ios-hub.js'), 'utf8');
  const ctx = vm.createContext({ Math, Date, Object, Array, String, Number, isFinite, JSON, Infinity });
  const consts = "var HUB_DAY = 86400000; var HUB_STALE_DAYS = 14; var HUB_SCALE_1000 = { az900: 1, ai900: 1, sc900: 1, clfc02: 1 };";
  vm.runInContext(consts + ['_hubShort', '_hubDays', '_hubAgeDays', '_hubExamLine', '_iosHubModel'].map((n) => _fnBody(src, n)).join('\n'), ctx);
  const model = (o) => { ctx.__o = o; return vm.runInContext('_iosHubModel(__o)', ctx); };

  const NOW = new Date(2026, 9, 31, 12, 0, 0);
  const iso = (n) => { const d = new Date(2026, 9, 31 + n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  const ago = (days) => new Date(NOW.getTime() - days * 86400000).toISOString();
  const CERTS = [
    { id: 'netplus', name: 'Network+', code: 'N10-009', glyph: 'N+' },
    { id: 'secplus', name: 'Security+', code: 'SY0-701', glyph: 'S+' },
    { id: 'az900', name: 'Microsoft Azure Fundamentals', code: 'AZ-900', glyph: 'AZ' },
    { id: 'ai900', name: 'Microsoft Azure AI Fundamentals', code: 'AI-901', glyph: 'AI' },
    { id: 'sc900', name: 'Microsoft SC-900', code: 'SC-900', glyph: 'SC' },
    { id: 'clfc02', name: 'AWS Cloud Practitioner', code: 'CLF-C02', glyph: 'AWS' },
    { id: 'aplus-core1', name: 'CompTIA A+ Core 1', code: '220-1201', glyph: 'A+' },
    { id: 'aplus-core2', name: 'CompTIA A+ Core 2', code: '220-1202', glyph: 'A+' }
  ];
  const base = (o) => Object.assign({ certs: CERTS, snaps: {}, dates: {}, outcomes: {}, current: 'secplus', pro: true, now: NOW, streak: 4 }, o);

  const m1 = model(base({
    snaps: { secplus: { score: 612, computed_at: ago(1) }, 'aplus-core1': { score: 684, computed_at: ago(2) }, sc900: { score: 702, computed_at: ago(3) }, ai900: { score: 540, computed_at: ago(3) }, az900: { score: 800, computed_at: ago(5) } },
    dates: { 'aplus-core1': iso(18), sc900: iso(41), secplus: iso(60) },
    outcomes: { netplus: { outcome: 'passed', score: 767, date: iso(-30) }, az900: { outcome: 'passed', score: null, date: iso(-20) } }
  }));
  test('Studying: nearest exam first, no date last, active cert kept out of the list',
    m1.studying.map((r) => r.id).join() === 'aplus-core1,sc900,ai900' && m1.studying[0].sub === 'Exam in 18 days' && m1.studying[2].sub === 'No date');
  test('Studying rows carry the score and the cert scale (1000 for Microsoft, 900 for CompTIA)',
    m1.studying[0].score === 684 && m1.studying[0].max === 900 && m1.studying[1].max === 1000);
  test('Passed rows: "Scored 767" with a score, "No score logged" without', m1.passed.find((r) => r.id === 'netplus').sub === 'Scored 767' && m1.passed.find((r) => r.id === 'az900').sub === 'No score logged');
  test('Not started: certs with no snapshot and no result, in registry order', m1.notStarted.map((r) => r.id).join() === 'clfc02,aplus-core2');
  test('Stats: soonest future date, passed count, streak', m1.stats.nextExamDays === 18 && m1.stats.passed === 2 && m1.stats.streak === 4);
  test('Active card is the current cert with its own exam line', m1.active.id === 'secplus' && m1.active.score === 612 && m1.active.sub === 'Exam in 60 days' && m1.freeRow === null);

  const stale = (d) => model(base({ snaps: { sc900: { score: 700, computed_at: ago(d) } } })).studying[0].sub;
  test('Stale note: 14 days old is not stale, 15 days is ("2 weeks ago"), 21 days says 3 weeks',
    stale(14) === 'No date' && stale(15) === 'No date · last studied 2 weeks ago' && stale(21) === 'No date · last studied 3 weeks ago');
  test('Past, unlogged and cleared dates read "No date" and never feed the next-exam stat',
    model(base({ snaps: { sc900: { score: 1, computed_at: ago(1) } }, dates: { sc900: iso(-3) } })).stats.nextExamDays === null
    && model(base({ snaps: { sc900: { score: 1, computed_at: ago(1) } }, dates: { sc900: null } })).studying[0].sub === 'No date');
  test('A passed cert\'s old date does not count as the next exam', model(base({ dates: { netplus: iso(5) }, outcomes: { netplus: { outcome: 'passed', date: iso(-1) } } })).stats.nextExamDays === null);
  test('A failed result keeps the cert in Studying', model(base({ snaps: { sc900: { score: 600, computed_at: ago(1) } }, outcomes: { sc900: { outcome: 'failed', date: iso(-1) } } })).studying.length === 1);

  const f7 = model(base({ certs: CERTS.slice(0, 7), pro: false }));
  test('Free: one folded row, no library, first three non-current names + "and more" (7 certs)',
    f7.freeRow.title === 'Unlock every cert with Pro' && f7.freeRow.list === 'Network+, Azure Fundamentals, Azure AI Fundamentals and more'
    && !f7.studying.length && !f7.passed.length && !f7.notStarted.length);
  const many = CERTS.concat(Array.from({ length: 12 }, (_, i) => ({ id: 'x' + i, name: 'Extra ' + i, code: 'X', glyph: 'X' })));
  test('Free: still three names with 20 certs, no count', model(base({ certs: many, pro: false })).freeRow.list === 'Network+, Azure Fundamentals, Azure AI Fundamentals and more' && many.length === 20);
  test('Free row skips the current cert', model(base({ current: 'netplus', pro: false })).freeRow.list.indexOf('Network+') === -1);

  const at = (h) => new Date(2026, 9, 31, h, 0, 0);
  const sn = { secplus: { score: 612, computed_at: ago(1) } };
  const gr = (o) => model(base(Object.assign({ snaps: sn }, o))).greeting;
  test('Greeting: time of day from the local hour, first name capitalised, cards clause when due',
    gr({ now: at(9), name: 'simi oremosu', due: 3 }).lead === 'Morning, Simi.' && gr({ now: at(9), name: 'simi', due: 3 }).bold === '3 cards'
    && gr({ now: at(9), name: 'simi', due: 3 }).rest === ' are due on Security+.' && gr({ now: at(14), name: 'Simi' }).lead === 'Afternoon, Simi.' && gr({ now: at(19), name: 'Simi' }).lead === 'Evening, Simi.');
  test('Greeting: one card is singular', gr({ name: 'Simi', due: 1 }).bold === '1 card' && gr({ name: 'Simi', due: 1 }).rest === ' is due on Security+.');
  test('Greeting fallbacks: no name drops it, a tester or email value drops it, nothing due drops the cards clause',
    gr({ now: at(9), name: '', due: 2 }).lead === 'Morning.' && gr({ now: at(9), name: 'tester' }).lead === 'Morning.' && gr({ now: at(9), name: 'a@b.com' }).lead === 'Morning.'
    && gr({ now: at(9), name: 'Simi', due: 0 }).bold === '' && gr({ now: at(9), name: 'Simi', due: 0 }).rest === '' && gr({ now: at(9), due: undefined }).bold === '');
  test('Greeting drops the email fallback: local part, its first token, or anything with a digit',
    gr({ now: at(9), name: 'jsmith', email: 'jsmith@x.com' }).lead === 'Morning.' && gr({ now: at(9), name: 'john.smith', email: 'john.smith@x.com' }).lead === 'Morning.'
    && gr({ now: at(9), name: 'john', email: 'john.smith@x.com' }).lead === 'Morning.' && gr({ now: at(9), name: 'jsmith92' }).lead === 'Morning.'
    && gr({ now: at(9), name: 'Simi', email: 'jsmith@x.com' }).lead === 'Morning, Simi.');
  const short = model(base({ certs: CERTS.slice(0, 4), pro: false })).freeRow.list;
  test('Free row short list: three others read plain, eight read "and more"', short === 'Network+, Azure Fundamentals, Azure AI Fundamentals' && model(base({ certs: CERTS.slice(0, 3), pro: false })).freeRow.list === 'Network+, Azure Fundamentals' && !/\s$/.test(short) && model(base({ certs: CERTS, pro: false })).freeRow.list.endsWith(' and more'));
  test('A NaN score never renders: the cert falls to Not started',
    model(base({ snaps: { sc900: { score: NaN, computed_at: ago(1) } } })).notStarted.some((r) => r.id === 'sc900') && model(base({ outcomes: { sc900: { outcome: 'passed', score: NaN } } })).passed[0].sub === 'No score logged');
  const fs1 = model(base({ pro: false, snaps: sn, due: 5 }));
  test('Free strip data: readiness is the current cert score, due is the cards due today',
    fs1.stats.readiness === 612 && fs1.stats.due === 5 && model(base({ pro: false })).stats.readiness === null && model(base({ pro: false })).stats.due === 0);
  test('Hub wiring: window export, Home cert act opens it, Free row uses the existing Pro sheet, suggest link is guarded',
    /window\.openHub\s*=/.test(src) && /window\._iosHubModel\s*=/.test(src) && /_showProOnlyUI/.test(src) && /typeof openSuggestCert === 'function'/.test(src)
    && /openHub\(\)\) return; tab\('settings'\)/.test(fs.readFileSync(path.join(ROOT, 'features', 'ios-home.js'), 'utf8'))
    && /features\/ios-hub\.js/.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')));
  test('Hub copy: no em dashes in the view source', !/—|&mdash;/.test(src));
  // Live fix 31 Oct: Home showed 193 while the hub said "No readiness yet" (no snapshot had ever been written for the cert).
  vm.runInContext(_fnBody(src, '_hubLiveSnaps'), ctx);
  const live = (snaps, cur, r) => { ctx.__a = [snaps, cur, r]; return vm.runInContext('_hubLiveSnaps(__a[0], __a[1], __a[2], "2026-10-31T12:00:00.000Z")', ctx); };
  const noSnap = live({ secplus: { score: 856, computed_at: ago(14) } }, 'netplus', { predicted: 193 });
  test('Hub readiness: the current cert uses the live score when it has no snapshot, other certs keep theirs',
    noSnap.netplus.score === 193 && noSnap.secplus.score === 856
    && model(base({ snaps: noSnap, current: 'netplus' })).stats.readiness === 193);
  test('Hub readiness: the live score replaces an older snapshot for the current cert', live({ netplus: { score: 400, computed_at: ago(30) } }, 'netplus', { predicted: 193 }).netplus.score === 193);
  test('Hub readiness: no live score (new user, or the engine fails) keeps the snapshot as it was, and the input is not changed',
    (() => { const s0 = { netplus: { score: 400, computed_at: ago(3) } }; const r = live(s0, 'netplus', null); return r.netplus.score === 400 && r !== s0 && live({}, 'netplus', { predicted: NaN }).netplus === undefined; })());
})();
