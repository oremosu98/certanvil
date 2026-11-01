// tests/uat/546-landing-cert-drift.js
// Scope: cert-registry Part 1, Task 1.7. The marketing/account site under landing/ is a separate deploy with its own
// hand-kept cert lists. Each list is parsed as data (vm-run, or the list's own literal sliced out and evaluated) and
// compared with window.CertRegistry, so adding a cert to the registry cannot silently miss a landing list.
// Per non-hidden registry entry: same id, same exam code, and the same pass and max score where the list carries them.
// Score minimums are never compared: the results ring starts at 0 on most certs (a display choice) while the registry
// carries the vendor's real minimum. A landing id the registry lacks fails. Hidden registry entries must be absent from every public list; the admin cert
// table (landing/lib/admin.js) is admin-only and may list them. Known accepted differences live in ALLOWED_DRIFT below.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test: baseTest } = require('./_context');

// Two passes. Pass 1 is the shipped state (the four new exams hidden: absent from every public list). Pass 2 is the reveal path:
// the registry has the four un-hidden and landing/lib/new-certs.js has its one switch flipped, and every public list must then
// contain them, so the ship step cannot miss a list. Lists the new certs feed are EXECUTED (not just parsed) in both passes.
function run(revealed) {
  const test = (name, ok) => baseTest((revealed ? '[reveal] ' : '') + name, ok);
  console.log('\n\x1b[1m── Landing cert lists match the registry' + (revealed ? ' (reveal path: four new exams un-hidden)' : '') + ' ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (p) => {
    let src = fs.readFileSync(path.join(ROOT, p), 'utf8');
    if (revealed && p === 'lib/cert-registry.js') src = src.replace(/hidden: true, /g, '');
    if (revealed && p === 'landing/lib/new-certs.js') src = src.replace('var NEW_CERTS_REVEALED = false;', 'var NEW_CERTS_REVEALED = true;');
    return src;
  };
  const NEW_IDS = ['secai', 'prince2', 'psm1', 'psm2'];

  const sb = { console: { log() {}, warn() {}, error() {} } };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(read('lib/cert-registry.js'), sb, { filename: 'lib/cert-registry.js' });
  const REG = sb.CertRegistry;
  const ALL = REG.all();
  const PUBLIC = ALL.filter((e) => !e.hidden);
  const HIDDEN_IDS = ALL.filter((e) => e.hidden).map((e) => e.id);
  // The new-exams data file (its helpers return [] until its switch is on). `nc` is the window the list code runs against.
  const nc = { console: { log() {} } }; nc.window = nc; vm.createContext(nc);
  vm.runInContext(read('landing/lib/new-certs.js'), nc, { filename: 'new-certs.js' });
  const NEWC = nc.certanvilNewCerts();
  const runFn = (src, what, args, ctx) => { try { return vm.runInNewContext('(' + src + ')', Object.assign({ window: nc }, ctx || {}), { filename: what }).apply(null, args || []); } catch (e) { throw new Error('546: cannot run ' + what + ': ' + e.message); } };

  // Accepted differences, keyed 'list|id|what'. Each one is a deliberate landing choice, not drift.
  const ALLOWED_DRIFT = {
    // Security+ has an intake and a quiz but no results page, so the shared results renderer has no entry for it.
    'results-config|secplus|missing': 'Sec+ diagnostic has no results.html; results-config.js only configures certs that have one',
    // One Scrum plate covers PSM I and II (founder): it opens PSM I and PSM II is the in-app switch.
    'index|psm2|missing': 'one Scrum landing tile opens PSM I; PSM II is switched in-app (founder)'
  };
  NEW_IDS.forEach((id) => ['results-config', 'generate-allow', 'generate-codes', 'picker-tiles', 'picker-whitelist'].forEach((l) => {
    ALLOWED_DRIFT[l + '|' + id + '|missing'] = 'new-cert diagnostics deferred (founder, 1 Nov)';
  }));
  const allowed = (list, id, what) => Object.prototype.hasOwnProperty.call(ALLOWED_DRIFT, list + '|' + id + '|' + what)
    || Object.prototype.hasOwnProperty.call(ALLOWED_DRIFT, list + '|*|' + what);

  // The diagnostic funnel names certs by URL slug; the registry's diagnosticSlug is the map.
  const SLUG_TO_ID = {}; ALL.forEach((e) => { SLUG_TO_ID[e.diagnosticSlug] = e.id; });
  const slugId = (s) => SLUG_TO_ID[s] || s;

  // Slice from `start` to the matching close of the bracket that opens at or after `from`.
  function balanced(src, from, open, close, what) {
    const o = src.indexOf(open, from);
    if (from < 0 || o < 0) throw new Error('546: ' + what + ' not found');
    let d = 1, i = o + 1;
    while (i < src.length && d > 0) {
      const c = src[i];
      if (c === "'" || c === '"') { const q = c; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } }
      else if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; }
      else if (c === open) d++; else if (c === close) d--;
      i++;
    }
    return src.slice(o, i);
  }
  const evalLit = (lit, what) => { try { return vm.runInNewContext('(' + lit + ')', {}, { filename: what }); } catch (e) { throw new Error('546: cannot evaluate ' + what + ': ' + e.message); } };
  const after = (src, marker, open, close) => { const i = src.indexOf(marker); return evalLit(balanced(src, i, open, close, marker), marker); };

  // Compare one landing list to the registry. rows: [{ id, code?, max?, pass? }]. Returns the list of problems.
  function compare(list, rows, opts) {
    opts = opts || {};
    const bad = [];
    const byId = {};
    rows.forEach((r) => { (byId[r.id] = byId[r.id] || []).push(r); });
    Object.keys(byId).forEach((id) => {
      if (!REG.isKnown(id)) bad.push('landing id not in registry: ' + id);
      else if (REG.get(id).hidden && !opts.admin) bad.push('hidden cert in a public list: ' + id);
    });
    PUBLIC.forEach((e) => {
      const got = byId[e.id];
      if (!got) { if (!allowed(list, e.id, 'missing')) bad.push('missing ' + e.id); return; }
      got.forEach((r) => {
        if (r.code != null && r.code !== e.code) bad.push(e.id + ' code ' + r.code + ' != ' + e.code);
        if (r.max != null && r.max !== e.scale.max) bad.push(e.id + ' max ' + r.max + ' != ' + e.scale.max);
        if (r.pass != null && r.pass !== e.scale.pass) bad.push(e.id + ' pass ' + r.pass + ' != ' + e.scale.pass);
      });
    });
    return bad;
  }
  // Hidden-leak helper: ids in `rows` that are in `hiddenIds`.
  const leaks = (rows, hiddenIds) => rows.filter((r) => hiddenIds.indexOf(r.id) !== -1).map((r) => r.id);
  // The landing switch and the registry flag move together: tiles must never point at a hidden app, or hide a live one.
  if (!revealed) {
    test('Landing new-certs switch is off exactly while all four new exams are hidden in the registry',
      nc.CERTANVIL_NEW_CERTS_REVEALED === false && NEW_IDS.every((id) => REG.get(id).hidden === true) && NEWC.length === 0);
  } else {
    test('Reveal path: the switch is on, the registry has the four un-hidden, and the data matches the registry (code, scores, host)',
      nc.CERTANVIL_NEW_CERTS_REVEALED === true && NEWC.length === 4 && NEW_IDS.every((id) => {
        const c = NEWC.filter((x) => x.id === id)[0], e = REG.get(id);
        return c && !e.hidden && c.code === e.code && c.maxScore === e.scale.max && c.passScore === e.scale.pass
          && c.host === e.host && c.format === e.scale.format;
      }));
  }
  if (revealed) {
    const byId = {}; NEWC.forEach((c) => { byId[c.id] = c; });
    test('Reveal path: hosts are secai/prince2/scrum.certanvil.com, and the PSM II link carries ?exam=psm2 (PSM I does not)',
      byId.secai.host === 'secai.certanvil.com' && byId.prince2.host === 'prince2.certanvil.com'
      && byId.psm1.host === 'scrum.certanvil.com' && byId.psm2.host === 'scrum.certanvil.com'
      && byId.secai.href === 'https://secai.certanvil.com/' && byId.prince2.href === 'https://prince2.certanvil.com/'
      && byId.psm1.href === 'https://scrum.certanvil.com/' && byId.psm2.href === 'https://scrum.certanvil.com/?exam=psm2');
    // The weights keys feed the analytics weak-domain lookup, so they must be each pack's domain labels, with its weights.
    const packLit = (id, marker) => { const src = fs.readFileSync(path.join(ROOT, 'certs', id + '.js'), 'utf8'); return after(src, marker, '{', '}'); };
    NEW_IDS.forEach((id) => {
      const labels = packLit(id, 'domainLabels:'), dw = packLit(id, 'domainWeights:'), w = byId[id].weights;
      const keys = Object.keys(labels);
      test('Reveal path: ' + id + ' landing weights use the pack domain labels and the pack weights',
        keys.length === Object.keys(w).length && keys.every((k) => w[labels[k]] === Math.round(dw[k] * 100)));
    });
  }
  const check = (name, list, rows, opts) => {
    const bad = compare(list, rows, opts);
    test('Landing ' + name + ' matches the registry' + (bad.length ? ' (' + bad.join('; ') + ')' : ''), bad.length === 0 && rows.length > 0);
  };

  test('Sanity: the registry has public certs, and the comparison catches a wrong code, score, unknown id and hidden id',
    PUBLIC.length >= 8
    && compare('t', [{ id: 'netplus', code: 'X' }]).some((s) => /netplus code X/.test(s))
    && compare('t', [{ id: 'netplus', max: 1 }]).some((s) => /netplus max 1/.test(s))
    && compare('t', [{ id: 'netplus', pass: 1 }]).some((s) => /netplus pass 1/.test(s))
    && compare('t', [{ id: 'nope' }]).some((s) => /not in registry/.test(s))
    && compare('t', []).indexOf('missing netplus') !== -1);
  test('Sanity: the hidden-leak helper flags a hidden id and ignores a public one',
    leaks([{ id: 'zz' }, { id: 'netplus' }], ['zz']).join() === 'zz' && leaks([{ id: 'netplus' }], ['zz']).length === 0);

  // 1. landing/auth.js: the "My certs" modal rows, one rowForCert({...}) call per cert.
  const auth = read('landing/auth.js');
  const authRows = [];
  const reRow = /rowForCert\(\{/g;
  let m;
  while ((m = reRow.exec(auth))) authRows.push(evalLit(balanced(auth, m.index, '{', '}', 'rowForCert'), 'auth.js rowForCert'));
  // renderMyCertsList needs the DOM, so its new-cert rows are checked by source (the loop) plus the data above.
  const authLoop = /certanvilNewCerts \? window\.certanvilNewCerts\(\) : \[\]\)\.forEach\(function \(c\) \{\s*var spec = \{[\s\S]*?id: c\.id,[\s\S]*?code: c\.code,[\s\S]*?rows\.push\(rowForCert\(spec\)\)/.test(auth);
  test('Landing auth.js My-certs rows merge the new-cert helper (id and code from the data)', authLoop);
  const authAll = authRows.map((r) => ({ id: r.id, code: r.code })).concat(authLoop ? NEWC.map((c) => ({ id: c.id, code: c.code })) : []);
  check('auth.js My-certs rows', 'auth', authAll);
  // Execute the real My-certs code (renderMyCertsList -> rowForCert -> buildMyCertRow -> certGlyphHTML) against a stub DOM.
  const fnSrc = (src, name) => { const i = src.indexOf('function ' + name); if (i < 0) throw new Error('546: ' + name + ' not found in auth.js'); return src.slice(i, src.indexOf('{', i)) + balanced(src, i, '{', '}', name); };
  const listEl = { innerHTML: '' };
  vm.runInNewContext(['escapeHtml', 'certGlyphHTML', 'buildMyCertRow', 'renderMyCertsList'].map((n) => fnSrc(auth, n)).join('\n') + '\nrenderMyCertsList({});',
    { window: nc, document: { getElementById: (id) => (id === 'my-certs-list' ? listEl : null) } }, { filename: 'auth.js My-certs' });
  const rowHtml = (code) => (listEl.innerHTML.split('</a>').filter((r) => r.indexOf('my-cert-code">' + code + ' ') !== -1)[0] || '');
  test('Landing auth.js My-certs glyphs: existing rows keep their marks (A+ Core 1 numeral); new rows are absent while hidden',
    /cg-sup">1</.test(rowHtml('220-1201')) && /cg-sup">2</.test(rowHtml('220-1202')) && /cg-ac">\+</.test(rowHtml('N10-009'))
    && (revealed || NEW_IDS.every((id) => rowHtml(REG.get(id).code) === '')));
  if (revealed) {
    test('Reveal path: My-certs rows draw the new marks (SecAI+ bronze S, PSM I numeral I, PSM II numeral II, PRINCE2 P2)',
      /cg-ac">S<\/span>AI</.test(rowHtml('CY0-001')) && /cg-sup">I</.test(rowHtml('PSM I')) && /cg-sup">II</.test(rowHtml('PSM II'))
      && /cg-ac">2</.test(rowHtml('Foundation')));
  }

  // 2. landing/lib/account.js: entitlement tiles, then the exam-format table (max and pass).
  const acct = read('landing/lib/account.js');
  const entFn = balanced(acct, acct.indexOf('function getCertEntitlements'), '{', '}', 'getCertEntitlements');
  const acctRows = [];
  const reEnt = /\bid:\s*'([\w-]+)',\s*name:[^\n]*\n\s*code:\s*'([^']+)'/g;
  while ((m = reEnt.exec(entFn))) acctRows.push({ id: m[1], code: m[2] });
  after(entFn, 'var rest', '[', ']').forEach((r) => acctRows.push({ id: r.id, code: r.code }));
  const entRun = (role) => runFn('function(role)' + entFn, 'account.js getCertEntitlements', [role]);
  entRun('admin').concat(entRun('user')).forEach((r) => acctRows.push({ id: r.id, code: r.code }));
  check('account.js entitlement tiles', 'account-tiles', acctRows);
  const lockedUser = entRun('user'), OLD_LOCKED = lockedUser.filter((r) => NEW_IDS.indexOf(r.id) === -1 && r.id !== 'netplus');
  test('Landing account.js locked tiles: the eight existing certs keep the generic locked chip, the new exams use their own glyph class',
    OLD_LOCKED.length === 7 && OLD_LOCKED.every((r) => r.glyphClass === 'locked' || r.id === 'secplus' && r.glyphClass === 'locked')
    && lockedUser.filter((r) => NEW_IDS.indexOf(r.id) !== -1).every((r) => r.glyphClass === r.id));
  const fmts = after(acct, 'var EXAM_FORMATS', '{', '}');
  const fmtMerge = /\(window\.certanvilNewCerts \? window\.certanvilNewCerts\(\) : \[\]\)\.forEach\(function \(c\) \{\s*EXAM_FORMATS\[[\s\S]*?\}\);/.exec(acct);
  if (!fmtMerge) throw new Error('546: pattern not found: the new-cert EXAM_FORMATS merge in landing/lib/account.js');
  vm.runInNewContext(fmtMerge[0], { window: nc, EXAM_FORMATS: fmts });
  check('account.js EXAM_FORMATS', 'account-formats', Object.keys(fmts).map((id) => ({ id, max: fmts[id].maxScore, pass: fmts[id].passScore })));
  test('Landing account.js EXAM_FORMATS examName names the registry exam code',
    PUBLIC.every((e) => fmts[e.id] && fmts[e.id].examName.indexOf(e.code) !== -1));

  // 3. landing/lib/cross-cert-analytics.js: the domain-weight table (ids) and the cert catalog (id, code, max, pass).
  const cca = read('landing/lib/cross-cert-analytics.js');
  const weights = after(cca, 'var DOMAIN_WEIGHTS_BY_CERT', '{', '}');
  const wMerge = /\(window\.certanvilNewCerts \? window\.certanvilNewCerts\(\) : \[\]\)\.forEach\(function \(c\) \{ DOMAIN_WEIGHTS_BY_CERT\[c\.id\] = c\.weights; \}\);/.exec(cca);
  if (!wMerge) throw new Error('546: pattern not found: the new-cert domain-weight merge in landing/lib/cross-cert-analytics.js');
  vm.runInNewContext(wMerge[0], { window: nc, DOMAIN_WEIGHTS_BY_CERT: weights });
  check('cross-cert-analytics domain-weight table', 'cca-weights', Object.keys(weights).map((id) => ({ id })));
  const cat = balanced(cca, cca.indexOf('function getCertCatalog'), '{', '}', 'getCertCatalog');
  const ccaRows = [];
  const reCat = /\bid:\s*'([\w-]+)',[\s\S]*?code:\s*'([^']+)'[\s\S]*?maxScore:\s*(\d+),\s*passScore:\s*(\d+)/g;
  while ((m = reCat.exec(cat))) ccaRows.push({ id: m[1], code: m[2], max: +m[3], pass: +m[4] });
  runFn('function(role)' + cat, 'cross-cert-analytics getCertCatalog', ['admin']).forEach((r) => ccaRows.push({ id: r.id, code: r.code, max: r.maxScore, pass: r.passScore }));
  check('cross-cert-analytics catalog', 'cca-catalog', ccaRows);

  // 4. landing/lib/admin.js: admin-only cert table. Live rows only; hidden certs may appear here.
  const adm = read('landing/lib/admin.js');
  const packs = after(adm.slice(adm.indexOf('function renderCertPacks')), 'var packs', '[', ']');
  const admFn = adm.slice(adm.indexOf('function renderCertPacks'));
  const admCtx = { elCertsTbody: { innerHTML: '' }, escapeHtml: (x) => String(x) };
  runFn('function()' + balanced(admFn, 0, '{', '}', 'renderCertPacks'), 'admin.js renderCertPacks', [], admCtx);
  const admHtml = admCtx.elCertsTbody.innerHTML;
  test('Landing admin.js cert table lists all four new exams, as Hidden until revealed and as Live after',
    NEW_IDS.every((id) => admHtml.indexOf('>' + REG.get(id).code + '<') !== -1) && /Hidden/.test(admHtml) === !revealed);
  const liveByCode = packs.filter((p) => p.live);
  const codeToId = {}; ALL.forEach((e) => { codeToId[e.code] = e.id; });
  test('Landing admin.js cert table: every live row is a registry cert (by exam code), and every public cert has one',
    liveByCode.every((p) => codeToId[p.code]) && PUBLIC.every((e) => liveByCode.some((p) => p.code === e.code) || admHtml.indexOf('>' + e.code + '<') !== -1));
  test('Landing admin.js cert table: coming-soon rows are not registry certs',
    packs.filter((p) => !p.live).every((p) => !codeToId[p.code]));

  // 5. landing/index.html: the Blueprint Wall CERTS array (live certs only; SOON is a separate array of coming-soon tiles).
  const idx = read('landing/index.html');
  const wall = after(idx, 'var CERTS = [', '[', ']');
  const tileMerge = /var NEW_TILES = [\s\S]*?CERTS = CERTS\.concat\(NEW_TILES\);/.exec(idx);
  if (!tileMerge) throw new Error('546: pattern not found: the NEW_TILES merge in landing/index.html');
  const wallCtx = { window: nc, CERTS: wall.slice() }; vm.runInNewContext(tileMerge[0], wallCtx);
  const wallAll = wallCtx.CERTS;
  check('index.html Blueprint Wall CERTS', 'index', wallAll.map((c) => ({ id: c.id, code: c.code })));
  if (revealed) {
    const scrum = wallAll.filter((c) => c.id === 'psm1')[0], covers = (NEWC.filter((c) => c.id === 'psm1')[0].wall || {}).covers || [];
    test('Reveal path: the wall has one Scrum tile that opens PSM I and covers PSM II, and the legal lines for PRINCE2 and Scrum are in the data',
      !!scrum && /scrum\.certanvil\.com\/$/.test(scrum.href) && covers.indexOf('psm2') !== -1
      && NEWC.filter((c) => c.id === 'prince2')[0].legal.indexOf('PeopleCert') !== -1 && NEWC.filter((c) => c.id === 'psm1')[0].legal.indexOf('Scrum.org') !== -1);
  }
  test('Landing index.html live-exam count is derived from the revealed certs, not hardcoded', !/textContent\s*=\s*'Twelve'/.test(idx) && /LIVE_BASE\+fresh\.length/.test(idx));
  const soon = after(idx, 'var SOON = [', '[', ']');
  test('Landing index.html coming-soon tiles are not registry certs (a cert that goes live must leave SOON)',
    soon.every((c) => !codeToId[c.code]));

  // 6. landing/diagnostic/results-config.js: vm-run, keyed by diagnostic slug. examCode, scoreMax, bands.onPace (the pass mark).
  const rc = { window: {} }; vm.createContext(rc);
  vm.runInContext(read('landing/diagnostic/results-config.js'), rc, { filename: 'results-config.js' });
  const cfg = rc.window.CERT_RESULTS_CONFIG;
  check('diagnostic/results-config.js', 'results-config',
    Object.keys(cfg).map((slug) => ({ id: slugId(slug), code: cfg[slug].examCode, max: cfg[slug].scoreMax, pass: cfg[slug].bands.onPace })));
  test('Landing results-config.js: each entry carries its own slug as the key',
    Object.keys(cfg).every((k) => cfg[k].slug === k));

  // 7. landing/api/diagnostic/generate.js: the cert allow-list and each cert's prompt code (gated-lane file, read only).
  const gen = read('landing/api/diagnostic/generate.js');
  const allowLine = gen.split('\n').find((l) => /if \(cert !== '/.test(l));
  if (!allowLine) throw new Error("546: pattern not found: the `if (cert !== '<slug>' ...` allow-list line in landing/api/diagnostic/generate.js");
  const slugs = (allowLine.match(/cert !== '([\w-]+)'/g) || []).map((s) => s.replace(/cert !== '|'/g, ''));
  check('diagnostic/generate.js allow-list', 'generate-allow', slugs.map((s) => ({ id: slugId(s) })));
  const prompt = gen.slice(gen.indexOf('function buildDiagnosticPrompt'));
  const genRows = [];
  const reBr = /cert === '([\w-]+)'\)\s*\{[\s\S]*?certMeta = \{[\s\S]*?code:\s*'([^']+)'/g;
  while ((m = reBr.exec(prompt))) genRows.push({ id: slugId(m[1]), code: m[2] });
  // Network+ is the final else branch.
  const elseCode = /\} else \{\s*certMeta = \{[\s\S]*?code:\s*'([^']+)'/.exec(prompt);
  if (!elseCode) throw new Error("546: pattern not found: the final `else { certMeta = { ... code: ... }` (Network+) branch in landing/api/diagnostic/generate.js");
  genRows.push({ id: 'netplus', code: elseCode[1] });
  check('diagnostic/generate.js prompt codes', 'generate-codes', genRows);

  // 8. landing/diagnostic/index.html: the picker. Tiles (data-cert), the stored-choice whitelist and the certName chain.
  // Every public cert needs a tile unless ALLOWED_DRIFT says otherwise (launching a cert with no diagnostic is a conscious choice).
  const dx = read('landing/diagnostic/index.html');
  const tiles = (dx.match(/data-cert="([\w-]+)"/g) || []).map((x) => x.replace(/data-cert="|"/g, ''));
  const wlLine = dx.split('\n').find((l) => /stored === '/.test(l));
  if (!wlLine) throw new Error("546: pattern not found: the `stored === '<slug>'` whitelist line in landing/diagnostic/index.html");
  const whitelist = (wlLine.match(/stored === '([\w-]+)'/g) || []).map((x) => x.replace(/stored === '|'/g, ''));
  const nameIdx = dx.indexOf('var certName;');
  if (nameIdx < 0) throw new Error('546: pattern not found: `var certName;` chain in landing/diagnostic/index.html');
  const nameSlugs = (dx.slice(nameIdx, nameIdx + 1200).match(/cert === '([\w-]+)'/g) || []).map((x) => x.replace(/cert === '|'/g, ''));
  const pickRows = (arr) => arr.map((slug) => ({ id: slugId(slug) }));
  check('diagnostic/index.html tiles (data-cert)', 'picker-tiles', pickRows(tiles));
  check('diagnostic/index.html stored-choice whitelist', 'picker-whitelist', pickRows(whitelist));
  // The certName chain has no branch for the default cert (Network+), so it is checked for unknown ids only.
  test('Landing diagnostic/index.html certName chain names only public registry certs, and every one has a tile',
    nameSlugs.length > 0 && nameSlugs.every((s) => REG.isKnown(slugId(s)) && !REG.get(slugId(s)).hidden && tiles.indexOf(s) !== -1));

  // 9. landing/lib/cross-cert-overlap.js: the transfer graph. Rows are optional per cert (a pair under 20% overlap, or a cert
  // with no row, is fine), so only the ids that appear are checked: each must be a public registry cert, or a known
  // coming-soon cert (FUTURE) that is not yet in the registry. When one launches it must move into the registry.
  const FUTURE = ['ccna', 'aws-saa', 'az104'];
  const ov = { window: {} }; vm.createContext(ov);
  if (revealed) { ov.window = ov; vm.runInContext(read('landing/lib/new-certs.js'), ov, { filename: 'new-certs.js' }); }
  vm.runInContext(read('landing/lib/cross-cert-overlap.js'), ov, { filename: 'cross-cert-overlap.js' });
  const ovRows = ov.window.CROSS_CERT_OVERLAP || [];
  const ovIds = []; ovRows.forEach((r) => { ovIds.push({ id: r.from }, { id: r.to }); });
  const ovBad = ovIds.filter((r) => !(REG.isKnown(r.id) ? !REG.get(r.id).hidden : FUTURE.indexOf(r.id) !== -1)).map((r) => r.id);
  test('Landing cross-cert-overlap.js from/to ids are public registry certs or coming-soon certs' + (ovBad.length ? ' (' + ovBad.join(', ') + ')' : ''),
    ovRows.length > 0 && ovBad.length === 0 && FUTURE.every((id) => !REG.isKnown(id)));
  const hasPair = (a, b) => ovRows.some((r) => r.from === a && r.to === b);
  test(revealed ? 'Reveal path: overlap rows for SecAI+ (Security+ strong, AI-901 light) and PSM I to PSM II are present'
                : 'Landing cross-cert-overlap.js has no rows for the hidden new exams',
    revealed ? hasPair('secplus', 'secai') && hasPair('ai900', 'secai') && hasPair('psm1', 'psm2')
             : !ovRows.some((r) => NEW_IDS.indexOf(r.from) !== -1 || NEW_IDS.indexOf(r.to) !== -1));

  // Hidden entries stay out of every public list (vacuous today; bites the day a hidden cert is added).
  const publicRows = authRows.concat(acctRows, ccaRows, wall, genRows, ovIds, pickRows(tiles), pickRows(whitelist), pickRows(nameSlugs),
    Object.keys(cfg).map((s) => ({ id: slugId(s) })), slugs.map((s) => ({ id: slugId(s) })));
  test('No hidden registry cert appears in any public landing list', leaks(publicRows, HIDDEN_IDS).length === 0);
}
// v8.206.0: the four new exams shipped, so the hidden pass no longer matches any real state. Only the revealed pass runs;
// run(false) stays available for the next cert that ships behind the switch.
run(true);
