// tests/uat/541-cert-registry.js
// Scope: cert-registry Part 1, Task 1.2. lib/cert-registry.js exposes window.CertRegistry, the single shared cert list.
// The registry file is vm-run here exactly as the browser runs it (no DOM, no storage). No app code reads it yet.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Cert registry ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const fixture = JSON.parse(read('tests/fixtures/cert-surfaces-v1.json'));
  const IDS = Object.keys(fixture);

  function load() {
    const sb = { window: {} };
    sb.window.window = sb.window;
    vm.createContext(sb);
    vm.runInContext(read('lib/cert-registry.js'), sb, { filename: 'lib/cert-registry.js' });
    return sb.window.CertRegistry;
  }
  function packMeta(id) {
    const sb = { window: {} };
    sb.window.window = sb.window;
    vm.createContext(sb);
    vm.runInContext(read('certs/' + id + '.js'), sb, { filename: 'certs/' + id + '.js' });
    return sb.window.CERT_PACKS[id].meta;
  }
  const R = load();
  const APPROVED = { 'aplus-core1': '220-1201', 'aplus-core2': '220-1202' };

  test('Registry has 8 entries, ids match the snapshot', R && R.all().length === 8 && R.all().map((e) => e.id).sort().join() === IDS.join());
  test('get/isKnown: known ids resolve, unknown ids do not', R.get('netplus').id === 'netplus' && R.get('nope') === null && R.isKnown('az900') && !R.isKnown('secai') && !R.isKnown(''));

  const scaleBad = [];
  R.all().forEach((e) => {
    const m = packMeta(e.id), s = R.scale(e.id);
    if (s.pass !== m.examPassScore || s.max !== m.examMaxScore) scaleBad.push(e.id + ' pass/max');
    if (m.examMinScore !== undefined && s.min !== m.examMinScore) scaleBad.push(e.id + ' min');
    if (s.format !== 'scaled') scaleBad.push(e.id + ' format');
    if (e.pack !== 'certs/' + e.id + '.js') scaleBad.push(e.id + ' pack path');
    if (e.code !== m.code) scaleBad.push(e.id + ' code vs pack');
  });
  test('Every entry scale (and code) matches its pack meta' + (scaleBad.length ? ' — ' + scaleBad.join(', ') : ''), scaleBad.length === 0);
  test('CompTIA scale min falls back to 100', R.scale('netplus').min === 100 && R.scale('aplus-core2').min === 100 && R.scale('az900').min === 1);

  const fx = [];
  IDS.forEach((id) => {
    const f = fixture[id], e = R.get(id);
    const eq = (k, a, b) => { if (a !== b) fx.push(id + '.' + k + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b)); };
    eq('name', e.name, f.names.switcher);
    eq('shortName', e.shortName, f.names.firstrun);
    eq('code', e.code, f.codes.switcher);
    eq('glyph', e.glyph, f.glyph);
    eq('mark', e.mark, f.mark);
    eq('labels.signin', e.labels.signin, f.names.signin);
    eq('labels.firstrun', e.labels.firstrun, f.names.firstrun);
    eq('labels.onboardingName', e.labels.onboardingName, f.names.onboarding);
    eq('labels.certLock', e.labels.certLock, f.names.certLock);
    eq('host', e.host, f.switchHost.replace(/^https:\/\//, '').replace(/[\/?].*$/, ''));
    eq('tier', e.tier, f.proGated ? 'pro' : 'free');
    eq('simLab', e.simLab, f.simLab);
    eq('decisionLab', e.decisionLab, f.decisionLab);
    eq('domainCount', e.domainCount, f.domainCount);
    eq('scale.max', R.scale(id).max, f.scale.max);
    eq('scale.pass', R.scale(id).pass, f.scale.pass);
    if (f.scale.min !== null) eq('scale.min', R.scale(id).min, f.scale.min);
    eq('hostFor', R.hostFor(id), f.switchHost.replace(/^https:\/\//, '').replace(/[\/?].*$/, ''));
    // First-run code: the registry carries the approved A+ change.
    eq('code (first-run, approved)', e.code, APPROVED[id] || f.codes.firstrun);
    if (e.hidden !== false) fx.push(id + '.hidden not false');
  });
  test('Registry entries carry the snapshot values (A+ first-run code as approved)' + (fx.length ? ' — ' + fx.slice(0, 5).join(' | ') : ''), fx.length === 0);

  const hostBad = [];
  IDS.forEach((id) => {
    const host = fixture[id].switchHost.replace(/^https:\/\//, '').replace(/[\/?].*$/, '');
    const want = id === 'aplus-core2' ? 'aplus-core1' : id;
    if (R.byHost(host) !== want) hostBad.push(host + ' -> ' + R.byHost(host));
    const prefix = host.split('.')[0];
    if (R.byHost(prefix + '-preview.vercel.app') !== want) hostBad.push(prefix + '-preview -> ' + R.byHost(prefix + '-preview.vercel.app'));
    Object.keys(fixture[id].hostAliases).forEach((h) => { if (R.byHost(h) !== (R.get(id).family ? R.familyMembers(R.get(id).family)[0] : id)) hostBad.push('alias ' + h + ' -> ' + R.byHost(h)); });
  });
  test('byHost resolves every live host, alias and Vercel preview host' + (hostBad.length ? ' — ' + hostBad.join(', ') : ''), hostBad.length === 0);
  test('byHost: Network+ alias networkplus resolves to netplus', R.byHost('networkplus.certanvil.com') === 'netplus');
  test('byHost: case-insensitive, port tolerant, junk safe', R.byHost('AZURE.certanvil.com') === 'az900' && R.byHost('azure.certanvil.com:443') === 'az900' && R.byHost('') === null && R.byHost(null) === null && R.byHost(undefined) === null);
  test('byHost prefix collisions: secai/aiX/azureX/ai-ish never resolve to a shorter prefix',
    R.byHost('secai.certanvil.com') === null && R.byHost('secai-x.vercel.app') === null && R.byHost('aix.certanvil.com') === null &&
    R.byHost('azurex.certanvil.com') === null && R.byHost('certanvil.com') === null && R.byHost('localhost') === null && R.byHost('www.certanvil.com') === null);
  test('hostFor returns the live host for each id', R.hostFor('ai900') === 'ai.certanvil.com' && R.hostFor('aplus-core2') === 'aplus.certanvil.com' && R.hostFor('nope') === '');

  test('Family: A+ cores share family aplus with slugs core1/core2; others have none',
    R.familyOf('aplus-core1') === 'aplus' && R.familyOf('aplus-core2') === 'aplus' && R.familyOf('netplus') === null && R.familyOf('nope') === null &&
    R.get('aplus-core1').examSlug === 'core1' && R.get('aplus-core2').examSlug === 'core2' &&
    R.familyMembers('aplus').join() === 'aplus-core1,aplus-core2' && R.familyMembers('zz').length === 0);

  test("formatScore: scaled rounds to integer string, null/NaN/undefined give '--'",
    R.formatScore('netplus', 684) === '684' && R.formatScore('netplus', 684.6) === '685' && R.formatScore('az900', null) === '--' && R.formatScore('az900', undefined) === '--' && R.formatScore('az900', NaN) === '--');

  // byHost is routing, not a trust check: it looks only at the first label, so a foreign suffix still routes.
  // Pinned so a change is deliberate. Never use byHost to decide whether a host is really ours.
  test('byHost pins current behaviour for a foreign suffix: ai.evil.com routes to ai900 (routing only, not a trust check)',
    R.byHost('ai.evil.com') === 'ai900' && R.byHost('secai.evil.com') === null);

  const mut = R.get('az900');
  const before = JSON.stringify(R.get('az900')) + JSON.stringify(R.all().map((e) => e.id));
  try { mut.name = 'x'; mut.labels.signin = 'x'; mut.scale.pass = 1; mut.hostAliases.push('x'); mut.hidden = true; R.scale('az900').pass = 1; R.all().pop(); } catch (e) { /* strict-mode throw is fine */ }
  test('Entries are frozen: mutation attempts do not change get(id) or all()',
    JSON.stringify(R.get('az900')) + JSON.stringify(R.all().map((e) => e.id)) === before && Object.isFrozen(mut) && Object.isFrozen(mut.labels) && Object.isFrozen(mut.scale) && Object.isFrozen(mut.hostAliases) && R.all().length === 8);

  // Test-only injection: hidden cert + a percent-scale cert, on a fresh registry so the shared one is untouched.
  const R2 = load();
  R2._add({ id: 'zz', name: 'Hidden Cert', hidden: true, hostPrefix: 'zz', host: 'zz.certanvil.com', scale: { min: 0, max: 100, pass: 70, format: 'percent' } });
  test('Hidden cert resolves by host but is not listed unless admin',
    R2.byHost('zz.certanvil.com') === 'zz' && R2.byHost('zz-x.vercel.app') === 'zz' &&
    R2.listed(false).every((e) => e.id !== 'zz') && R2.listed(true).some((e) => e.id === 'zz') && R2.listed(false).length === 8 && R2.all().length === 9);
  test("formatScore percent: 72 -> '72%', null -> '--'", R2.formatScore('zz', 72) === '72%' && R2.formatScore('zz', 71.6) === '72%' && R2.formatScore('zz', null) === '--');
  test('_add entries are frozen too', Object.isFrozen(R2.get('zz')) && Object.isFrozen(R2.get('zz').scale) && Object.isFrozen(R2.get('zz').hostAliases));
  test('Real registry was not affected by the test-only _add', R.all().length === 8 && !R.isKnown('zz'));

  const src = read('lib/cert-registry.js');
  test('Registry file is ES5, dependency-free, no DOM, no storage',
    !/\b(const|let)\s|=>|`|\bdocument\b|localStorage|sessionStorage|\brequire\(|\bimport\s/.test(src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')));
  test('_add is documented as test-only and app code never calls it',
    /_add[^\n]*test/i.test(src) && !/_add\(/.test(read('app.js')) && !/CertRegistry\._add/.test(read('index.html')));

  const html = read('index.html');
  const iReg = html.indexOf('<script src="lib/cert-registry.js"');
  const iNative = html.indexOf('<script src="native-shell.js"');
  const dm = /\(function\s*\(\s*\)\s*\{\s*var\s+cert\s*=\s*null\s*;/.exec(html); // same marker the 540 extractor uses
  const iDetect = dm ? dm.index : -1;
  test('index.html loads the registry after native-shell.js and before the inline detection IIFE', iNative > -1 && iReg > iNative && iDetect > iReg);
  // resolve({ hostname, search, override }): one resolver for head, detectCert and getActiveCertId. Never null.
  const rs = (h, q, o) => R.resolve({ hostname: h, search: q, override: o });
  test('resolve 1: ?cert=<known id> wins on any host, over an override, case-insensitive',
    rs('networkplus.certanvil.com', '?cert=secplus', 'az900') === 'secplus' && rs('localhost', '?cert=SecPlus') === 'secplus' && rs('aplus.certanvil.com', '?cert=secplus', 'aplus-core2') === 'secplus');
  test('resolve 1: an unknown ?cert= is ignored', rs('azure.certanvil.com', '?cert=secai') === 'az900' && rs('localhost', '?cert=secai') === 'netplus');
  test('resolve 2: family host, ?exam=<member slug> beats the override', rs('aplus.certanvil.com', '?exam=core2', 'aplus-core1') === 'aplus-core2' && rs('aplus.certanvil.com', '?exam=core1', 'aplus-core2') === 'aplus-core1');
  test('resolve 2: family host, override used only when it is a member; else first member',
    rs('aplus.certanvil.com', '', 'aplus-core2') === 'aplus-core2' && rs('aplus.certanvil.com', '', 'secplus') === 'aplus-core1' && rs('aplus.certanvil.com', '', 'secai') === 'aplus-core1' && rs('aplus.certanvil.com') === 'aplus-core1');
  test('resolve 2: unknown ?exam= falls through to the override then the first member', rs('aplus.certanvil.com', '?exam=core9', 'aplus-core2') === 'aplus-core2' && rs('aplus.certanvil.com', '?exam=core9') === 'aplus-core1');
  test('resolve 2: ?exam= means nothing off the family', rs('localhost', '?exam=core2') === 'netplus' && rs('secplus.certanvil.com', '?exam=core2') === 'secplus');
  test('resolve 3: a non-family cert host beats every other override',
    R.all().filter((e) => !e.family).every((e) => R.all().every((o) => rs(e.host, '', o.id) === e.id)));
  test('resolve 4: unmatched hosts use a known override', rs('localhost', '', 'secplus') === 'secplus' && rs('example.com', '', 'aplus-core2') === 'aplus-core2' && rs('', '', 'az900') === 'az900');
  test('resolve 5: unknown override, no host, bad input all give netplus, never null',
    rs('localhost', '', 'secai') === 'netplus' && rs('localhost') === 'netplus' && R.resolve() === 'netplus' && R.resolve({}) === 'netplus' && rs(null, null, 42) === 'netplus');
  test('resolve: a malformed query does not throw', rs('localhost', '?cert=%E0%A4%A') === 'netplus');
  test('sw.js precaches the registry', /'\.\/lib\/cert-registry\.js'/.test(read('sw.js')));
  test('app.js detectCert reads the registry (Task 1.3 consumer)', /CertRegistry/.test(read('app.js')));
})();
