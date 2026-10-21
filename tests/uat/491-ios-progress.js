// tests/uat/491-ios-progress.js
// Scope: the phone Progress screen (features/ios-progress.js), Lift B1. E2E source: feat/cert-ios-e2e
// mockups/cert-ios-progress.html. Spec: docs/superpowers/specs/2026-10-21-ios-lift-b1-design.md.
// Buckets match app.js _bucketOf: untouched = null, weak < 60, solid 60-79, strong >= 80.
const { _fnBody, js, results, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Lift B1 Progress (phone) ──\x1b[0m');
  try {
    const ctx = vm.createContext({ Math, String, Array, Object, JSON, Date, isFinite, Number });
    vm.runInContext((_fnBody(js, '_iosProgressModel') || ''), ctx);
    const DAY = 86400000, NOW = Date.parse('2026-10-21T12:00:00Z');
    const R = (t, domainKey, pct, ago, obj) => ({ t, label: t, pct, total: pct === null ? 0 : 10, attempts: pct === null ? 0 : 2,
      daysSince: pct === null ? null : ago, lastDate: pct === null ? 0 : NOW - ago * DAY, domainKey, obj: obj || '', trend: 0 });
    const ROWS = [R('OSI', 'concepts', 30, 4, '1.1'), R('DNS', 'concepts', 60, 1), R('IPv6', 'concepts', null),
      R('OSPF', 'implementation', 85, 2), R('BGP', 'implementation', null), R('VLANs', 'implementation', 72, 3)];
    const DOMS = [{ key: 'concepts', name: 'Networking Concepts', examPct: 23 }, { key: 'implementation', name: 'Network Implementation', examPct: 20 }];
    const M = (rows, state) => vm.runInContext('_iosProgressModel(__r, __d, __s)', Object.assign(ctx, { __r: rows, __d: DOMS, __s: state || { filter: 'all', sort: 'worst' } }));

    const m = M(ROWS);
    test('Progress model: "Drill this next" is the weakest studied topic', m.next && m.next.t === 'OSI' && m.next.pct === 30);
    test('Progress model: next carries the domain name and objective', m.next.domain === 'Networking Concepts' && m.next.obj === '1.1');
    const s = m.stand;
    test('Progress model: stand counts use the app buckets (weak<60, strong>=80)',
      s.coveredPct === 67 && s.seen === 4 && s.total === 6 && s.weak === 1 && s.untouched === 2 && s.strong === 1);
    test('Progress model: avg mastery is the mean of studied topics', s.avgMastery === 62);
    test('Progress model: pages are Overview, one per domain, Insights',
      m.pages.map(p => p.key).join() === 'overview,concepts,implementation,insights');
    test('Progress model: Net+ domain pills drop the leading Network/Networking word',
      m.pages[1].label === 'Concepts' && m.pages[2].label === 'Implementation');
    const d1 = m.pages[1];
    test('Progress model: domain page header has exam %, mastery and counts',
      d1.name === 'Networking Concepts' && d1.examPct === 23 && d1.mastery === 45 && d1.studied === 2 && d1.total === 3 && d1.untouched === 1);
    test('Progress model: worst-first lists studied rows lowest first, untouched folded separately',
      d1.rows.map(r => r.t).join() === 'OSI,DNS' && d1.untouchedRows.map(r => r.t).join() === 'IPv6');
    test('Progress model: best-first reverses the studied order', M(ROWS, { filter: 'all', sort: 'best' }).pages[1].rows.map(r => r.t).join() === 'DNS,OSI');
    const weak = M(ROWS, { filter: 'weak', sort: 'worst' });
    test('Progress model: Weak filter keeps only rows under 60 and hides untouched',
      weak.pages[1].rows.map(r => r.t).join() === 'OSI' && weak.pages[2].rows.length === 0 && weak.pages[1].untouchedRows.length === 0);
    const unt = M(ROWS, { filter: 'untouched', sort: 'worst' });
    test('Progress model: Untouched filter shows only untouched rows', unt.pages[1].rows.length === 0 && unt.pages[2].untouchedRows.map(r => r.t).join() === 'BGP');
    test('Progress model: Strong filter keeps only rows at 80 and above', M(ROWS, { filter: 'strong', sort: 'worst' }).pages[2].rows.map(r => r.t).join() === 'OSPF');
    const ins = m.insights;
    test('Progress model: Insights weakest = studied, lowest first, at most 5', ins.weakest.map(r => r.t).join() === 'OSI,DNS,VLANs,OSPF');
    test('Progress model: Insights strong = 80 and up', ins.strong.map(r => r.t).join() === 'OSPF');
    test('Progress model: Insights untouched lists every untouched topic with its count', ins.untouchedCount === 2 && ins.untouched.length === 2);
    test('Progress model: Insights recent = studied, newest first', ins.recent.map(r => r.t).join() === 'DNS,OSPF,VLANs,OSI');
    test('Progress model: state echoes back', m.filter === 'all' && m.sort === 'worst');

    const fresh = M(ROWS.map(r => Object.assign({}, r, { pct: null, total: 0, attempts: 0, daysSince: null, lastDate: 0 })));
    test('Progress model: a new user has no "Drill this next" and 0% covered',
      fresh.next === null && fresh.stand.coveredPct === 0 && fresh.stand.avgMastery === null && fresh.insights.weakest.length === 0);

    // ── View (pure HTML from the model) ──
    vm.runInContext((_fnBody(js, '_iosProgressHtml') || ''), ctx);
    const CERT = { mark: 'N+', name: 'Network+', code: 'N10-009' };
    const H = (model) => vm.runInContext('_iosProgressHtml(__m, __c)', Object.assign(ctx, { __m: model, __c: CERT }));
    const h = H(m);
    test('Progress view: one pill per page, the first selected',
      (h.match(/class="ip-chip[^"]*" type="button" role="tab"/g) || []).length === 4 && /class="ip-chip ip-on" type="button" role="tab" aria-selected="true" data-page="0">Overview</.test(h));
    test('Progress view: one pager page per pill', (h.match(/<section class="ip-page" data-page="\d"/g) || []).length === 4);
    test('Progress view: the ring holds only its number; Covered sits outside it as a label',
      /<b class="ip-ring-n">67%<\/b><\/div><span class="ip-st-l">Covered<\/span>/.test(h));
    test('Progress view: Avg mastery and Topics seen are value-over-label',
      h.includes('<b class="ip-st-v">62%</b><span class="ip-st-l">Avg mastery</span>') && h.includes('<b class="ip-st-v">4<small> of 6</small></b><span class="ip-st-l">Topics seen</span>'));
    test('Progress view: toolbar has 4 filter tabs (aria-pressed) and a Worst first sort',
      (h.match(/class="ip-ftab" type="button" data-filter="\w+" aria-pressed="(true|false)"/g) || []).length === 4 && /<button class="ip-fsort"[^>]*>[\s\S]*?<span>Worst first<\/span>/.test(h));
    test('Progress view: topic rows are buttons that carry their topic', /<button class="ip-trow ip-weak" type="button" data-act="drill" data-t="OSI"/.test(h));
    test('Progress view: the Progress/Analytics switch is drawn, Progress pressed',
      h.includes('<button type="button" data-view="progress" aria-pressed="true">Progress</button>') && h.includes('data-view="analytics" aria-pressed="false"'));
    const nasty = M([R('A & <B>', 'concepts', 20, 1)]);
    const hn = H(nasty);
    test('Progress view: topic names are escaped in text and attributes', hn.includes('A &amp; &lt;B&gt;') && !hn.includes('<B>') && hn.includes('data-t="A &amp; &lt;B&gt;"'));
    test('Progress view: a new user gets no "Drill this next" card', !H(fresh).includes('ip-hero'));
  } catch (err) {
    test('Lift B1 Progress: block (threw)', false);
    results.errors.push('491 ios-progress block threw: ' + err.message);
  }
})();
