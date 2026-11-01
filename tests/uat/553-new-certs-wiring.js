// tests/uat/553-new-certs-wiring.js
// Scope: new-certs Task R1. The four new exams (SecAI+, PRINCE2 7 Foundation, PSM I, PSM II) read their per-cert surfaces
// from the registry: the switcher lettermark (bronze S for SecAI+, PSM I/II numerals), the trademark line in Settings
// (desktop and phone), the "weights are estimates" note on Analytics (desktop and phone), and the My certs name/code slot.
// Real source is cut out of each file and rendered in a vm next to the real registry.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test, _fnBody } = require('./_context');

(function () {
  console.log('\n\x1b[1m── New certs: registry-driven surfaces ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const REG = read('lib/cert-registry.js');
  function box(extra) {
    const sb = Object.assign({ Math, Date, Object, Array, String, Number, JSON, isFinite, isNaN, Infinity, console: { log() {}, warn() {}, error() {} } }, extra || {});
    sb.window = sb.window || {};
    sb.window.window = sb.window;
    vm.createContext(sb);
    vm.runInContext(REG, sb);
    return sb;
  }
  const fns = (file, names) => names.map((n) => { const b = _fnBody(read(file), n); if (!b) throw new Error('553: ' + n + ' missing in ' + file); return b; }).join('\n');
  const PRINCE2_LEGAL = 'PRINCE2® is a registered trademark of PeopleCert. Not affiliated with or endorsed by PeopleCert.';
  const SCRUM_LEGAL = 'Professional Scrum Master™ and PSM are trademarks of Scrum.org. Not affiliated with or endorsed by Scrum.org.';

  // ── 1. Switcher lettermark ──
  const g = box({});
  vm.runInContext(fns('auth-state.js', ['escapeHtml', 'certGlyphHTML']), g);
  const glyph = (id) => vm.runInContext('certGlyphHTML(window.CertRegistry.get(' + JSON.stringify(id) + ').glyph, ' + JSON.stringify(id) + ')', g);
  test('553 switcher: SecAI+ lettermark has the bronze S first ("SAI", unlike AI-900\'s bronze I)',
    glyph('secai') === '<span class="cg cg-3"><span class="cg-ac">S</span>AI</span>' && glyph('ai900') === '<span class="cg">A<span class="cg-ac">I</span></span>');
  test('553 switcher: PSM I / PSM II get a bronze roman numeral, like A+ Core 1 / 2; PRINCE2 is P + bronze 2',
    glyph('psm1') === '<span class="cg cg-3">PS<span class="cg-ac">M</span><span class="cg-sup">I</span></span>' &&
    glyph('psm2') === '<span class="cg cg-3">PS<span class="cg-ac">M</span><span class="cg-sup">II</span></span>' &&
    glyph('aplus-core1') === '<span class="cg">A<span class="cg-ac">+</span><span class="cg-sup">1</span></span>' &&
    glyph('prince2') === '<span class="cg">P<span class="cg-ac">2</span></span>');
  test('553 switcher: the eight launch certs keep their letters (last letter bronze, A+ numerals only; AWS takes the three-letter size)',
    glyph('netplus') === '<span class="cg">N<span class="cg-ac">+</span></span>' && glyph('clfc02') === '<span class="cg cg-3">AW<span class="cg-ac">S</span></span>' &&
    glyph('aplus-core2') === '<span class="cg">A<span class="cg-ac">+</span><span class="cg-sup">2</span></span>');
  test('553 switcher: three-letter glyphs drop to 11px in dg-system.css, and its ?v= is bumped',
    /\.tad-cert-glyph \.cg\.cg-3\{font-size:11px!important/.test(read('dg-system.css')) && (read('index.html').match(/dg-system\.css\?v=8\.204\.0-d17"/g) || []).length === 2);
  test('553 switcher: auth-state carries no per-cert glyph ternary', !/certId === 'aplus-core1' \? '1'/.test(read('auth-state.js')));

  // ── 2. Settings on phones: the trademark line under the Study setup group ──
  const st = box({});
  vm.runInContext(fns('features/ios-settings.js', ['_iosStMethodsLabel', '_iosStModel', '_iosStHtml']), st);
  const stHtml = (legal) => { st.__s = { signedIn: false, cert: { name: 'x', code: 'y', legal: legal }, glance: {}, backups: [] }; return vm.runInContext('_iosStHtml(_iosStModel(__s))', st); };
  const p2 = stHtml(PRINCE2_LEGAL), none = stHtml('');
  test('553 phone Settings: PRINCE2 shows its trademark line once, as a footer under Study setup and before Daily goal',
    p2.split('PRINCE2® is a registered trademark of PeopleCert.').length === 2 && /<p class="ist-gfoot reveal" data-legal>PRINCE2®/.test(p2) &&
    p2.indexOf('data-legal') > p2.indexOf('Study setup') && p2.indexOf('data-legal') < p2.indexOf('ist-k">Daily goal'));
  test('553 phone Settings: no legal line for a cert without one', !/data-legal/.test(none));
  test('553 phone Settings: the footer is styled small and grey (lift-ios.css .ist-gfoot) and lift-ios.css ?v= is bumped',
    /#ios-settings \.ist-gfoot \{[^}]*font: 500 12px[^}]*color: var\(--text-dim\)/.test(read('lift-ios.css')) && /lift-ios\.css\?v=8\.204\.1\.3"/.test(read('index.html')));

  // ── 3. Settings on desktop: #settings-cert-legal under Exam Date ──
  const html = read('index.html');
  const examSec = html.slice(html.indexOf('<h3 class="settings-section-title">Exam Date</h3>'), html.indexOf('</section>', html.indexOf('<h3 class="settings-section-title">Exam Date</h3>')));
  test('553 desktop Settings: the Exam Date card holds a hidden #settings-cert-legal line', /<p class="settings-section-hint" id="settings-cert-legal" hidden><\/p>/.test(examSec));
  const legalFor = (id) => {
    const el = { textContent: '', hidden: true, removeAttribute() { this.hidden = false; }, setAttribute() { this.hidden = true; } };
    const d = box({ document: { getElementById: (x) => (x === 'settings-cert-legal' ? el : null) } });
    d.window.CURRENT_CERT = id;
    vm.runInContext(fns('features/settings.js', ['_certLegal', '_syncCertLegal']) + '\n_syncCertLegal();', d);
    return el;
  };
  const dP = legalFor('prince2'), dS = legalFor('psm2'), dN = legalFor('secplus');
  test('553 desktop Settings: PRINCE2 and PSM II fill the line with the approved text; Security+ keeps it hidden',
    dP.textContent === PRINCE2_LEGAL && !dP.hidden && dS.textContent === SCRUM_LEGAL && !dS.hidden && dN.textContent === '' && dN.hidden);
  test('553 Settings: renderSettingsPage syncs the legal line and the phone state passes it', /_syncCertLegal\(\);/.test(_fnBody(read('features/settings.js'), 'renderSettingsPage') || '') &&
    /legal: _certLegal\(\)/.test(read('features/settings.js')));

  // ── 4. Analytics on phones: estimated weights ──
  const ia = read('features/ios-analytics.js');
  const cx = vm.createContext({ Math, String, Array, Object, JSON, Date, isFinite, Number,
    getForecastCopy: () => ({ line: '', label: '', value: '', range: '', dim: false }) });   // readiness.js copy, not under test here
  vm.runInContext((_fnBody(ia, '_iosAnalyticsHtml') || '') + '\n' + (_fnBody(ia, '_iosAnalyticsModel') || ''), cx);
  const D0 = { readiness: { predicted: 72, passScore: 60, maxScore: 100, fmt: 'percent', forecast: 72, tier: 'Building', pointsToPass: 0, barPct: 72, passTickPct: 60, stats: {}, spark: {} },
    passTrend: { passAcc: 60, yMin: 0, yMax: 100, data: { week: [], month: [], all: [] } }, difficulty: [], examVsQuiz: null, whyScore: {}, wrongPatterns: [], streak: { week: [] },
    heatmap: [], milestones: { unlocked: 0, total: 0, recent: [], locked: [] }, domains: [{ idx: 1, num: '1.0', name: 'Practices', accuracy: 78, questions: 9, weight: 60 }], examHistory: [] };
  const MAP = { rows: [], weakest: [], studied: 0, total: 0, mastered: 0 };
  const iaHtml = (est) => { cx.__d = D0; cx.__map = MAP; cx.__est = est; return vm.runInContext('(function(){ var m = _iosAnalyticsModel(__d, __map, null); if (__est) m.domains.est = __est; return _iosAnalyticsHtml(m, { mark: "P2", name: "PRINCE2", code: "Foundation" }); })()', cx); };
  const iaE = iaHtml({ vendor: 'PeopleCert' }), iaO = iaHtml(null);
  test('553 phone Analytics: estimated weights read "about 60% of exam", the chip says Estimated weights, and the note names the vendor',
    /about 60% of exam/.test(iaE) && /Estimated weights/.test(iaE) &&
    /PeopleCert doesn’t publish how the exam splits across topics\. These weights are our estimate, and your readiness uses them\./.test(iaE));
  test('553 phone Analytics: official weights are unchanged ("60% of exam", "Worst first", no note)',
    /· 60% of exam/.test(iaO) && !/about 60%/.test(iaO) && /Worst first/.test(iaO) && !/doesn’t publish/.test(iaO));
  test('553 phone Analytics: the mount sets domains.est only from meta.weightsAreEstimates, vendor from the registry',
    /_meta\.weightsAreEstimates\) \{ var _re = window\.CertRegistry && window\.CertRegistry\.get\(CURRENT_CERT\); model\.domains\.est = \{ vendor: \(_re && _re\.vendor\)/.test(ia));

  // ── 5. Analytics on desktop: the bento domains tile ──
  const an = read('features/analytics.js');
  const bt = (id, est) => {
    const sb = box({ CURRENT_CERT: id, CERT_PACK: { meta: est ? { weightsAreEstimates: true } : {} } });
    vm.runInContext(fns('features/analytics.js', ['_anaBtEsc', '_anaBtDomains']), sb);
    sb.__D = { domains: [{ idx: 1, num: '1.0', name: 'Scrum framework', accuracy: 82, questions: 10, weight: 60 }] };
    return vm.runInContext('_anaBtDomains(__D)', sb);
  };
  const bE = bt('psm1', true), bO = bt('secai', false);
  test('553 desktop Analytics: PSM I tile says "about 60% of exam", "estimated weights" and Scrum.org\'s note',
    /about 60% of exam/.test(bE) && /estimated weights/.test(bE) && /Scrum\.org doesn’t publish how the exam splits across topics\. These weights are our estimate\./.test(bE));
  test('553 desktop Analytics: SecAI+ (official CompTIA weights) shows no note', !/about /.test(bO) && /worst first/.test(bO) && !/doesn’t publish/.test(bO));
  test('553 desktop Analytics: the note reuses the existing dom-meta style (no new CSS)', /<p class="dom-meta dom-note">/.test(an));

  // ── 6. My certs (hub): name and code slot from the registry ──
  const hub = box({});
  vm.runInContext('var HUB_DAY = 86400000; var HUB_STALE_DAYS = 14;\nfunction _esc(s) { return String(s == null ? "" : s); }\n'
    + fns('features/ios-hub.js', ['_hubFmt', '_hubRight', '_hubMax', '_hubFirstName', '_hubShort', '_hubDays', '_hubAgeDays', '_hubExamLine', '_iosHubModel']), hub);
  const NOW = new Date(2026, 10, 1, 12), ago = (d) => new Date(NOW.getTime() - d * 86400000).toISOString();
  hub.__o = { certs: ['netplus', 'secplus', 'secai', 'prince2', 'psm1', 'psm2', 'az900'].map((id) => { const e = hub.window.CertRegistry.get(id); return { id: id, name: e.name, code: e.code, glyph: e.glyph }; }),
    snaps: { secai: { score: 612, computed_at: ago(1) }, psm1: { score: 79, computed_at: ago(1) }, secplus: { score: 684, computed_at: ago(1) }, az900: { score: 700, computed_at: ago(1) } },
    dates: {}, outcomes: {}, current: 'prince2', pro: true, now: NOW, streak: 1 };
  const hm = vm.runInContext('_iosHubModel(__o)', hub);
  const rowOf = (id) => hm.studying.concat(hm.notStarted || [], hm.passed || []).find((r) => r.id === id);
  hub.__r = rowOf('psm1');
  test('553 My certs: PSM rows read "PSM I · Scrum.org" and "79% · pass 85%"; PRINCE2 active card "PRINCE2 Foundation · Foundation"',
    rowOf('psm1').name === 'PSM I' && rowOf('psm1').code === 'Scrum.org' && vm.runInContext('_hubRight(__r)', hub) === '<b>79%</b> · pass 85%' &&
    rowOf('psm2').name === 'PSM II' && hm.active.name === 'PRINCE2 Foundation' && hm.active.code === 'Foundation' && hm.active.fmt === 'percent');
  test('553 My certs: SecAI+ reads "SecAI+ · CY0-001", "612 / 900"; the eight keep their names (Security+, Azure Fundamentals)',
    rowOf('secai').name === 'SecAI+' && rowOf('secai').code === 'CY0-001' && (hub.__q = rowOf('secai'), vm.runInContext('_hubRight(__q)', hub)) === '<b>612</b> / 900' && rowOf('secplus').name === 'Security+' && rowOf('az900').name === 'Azure Fundamentals' && rowOf('az900').code === 'AZ-900');

  // ── 7. Packs: the new packs load through the same head loader; only Net+ and Sec+ are precached (unchanged) ──
  test('553 packs: index.html loads certs/<id>.js for any resolved id, and each new pack file exists',
    /window\._certPackSrc = 'certs\/' \+ cert \+ '\.js';/.test(html) && ['secai', 'prince2', 'psm1', 'psm2'].every((id) => fs.existsSync(path.join(ROOT, 'certs', id + '.js'))));
  test('553 packs: sw.js precaches only netplus and secplus packs (new packs load on demand, like the other six)',
    (read('sw.js').match(/'\.\/certs\/[a-z0-9-]+\.js'/g) || []).join() === "'./certs/netplus.js','./certs/secplus.js'");
})();
