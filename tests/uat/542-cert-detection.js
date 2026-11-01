// tests/uat/542-cert-detection.js
// Scope: cert-registry Part 1, Task 1.3. The three cert-detection paths (index.html head IIFE, app.js detectCert,
// auth-state.js getActiveCertId) must read the registry and agree. v7.2.2 broke when they drifted.
// Each path is run under vm with a stubbed location/localStorage and lib/cert-registry.js loaded into the same context.
const fs = require('fs');
const path = require('path');
const { _fnBody, test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Cert detection reads the registry ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const registrySrc = rd('lib/cert-registry.js');
  const html = rd('index.html');
  const hm = /\(function\s*\(\s*\)\s*\{\s*var\s+cert\s*=\s*null\s*;/.exec(html);
  const headCode = hm ? html.slice(hm.index, html.indexOf('})();', hm.index) + 5) : '';
  const detectSrc = _fnBody(rd('app.js'), 'detectCert');
  const activeSrc = _fnBody(rd('auth-state.js'), 'getActiveCertId');
  const KEY = 'nplus_dev_cert';

  // opts: { storage, search, noRegistry }. Returns { cert, writes, title, topbar } (cert is what the path resolved).
  function mkCtx(host, o) {
    o = o || {};
    const ls = Object.assign({}, o.storage || {});
    const writes = [];
    const win = {};
    const search = o.search || '';
    const loc = { hostname: host, href: 'https://' + host + '/' + search, search };
    const attrs = {};
    const doc = { title: '', write() {}, documentElement: { setAttribute: (k, v) => { attrs[k] = v; }, getAttribute: (k) => (k in attrs ? attrs[k] : null) } };
    const ctx = vm.createContext({
      window: win, document: doc, URL, location: loc,
      history: { replaceState() {} },
      localStorage: {
        getItem: (k) => (k in ls ? ls[k] : null),
        setItem: (k, v) => { writes.push(k); ls[k] = String(v); },
        removeItem: (k) => { writes.push(k); delete ls[k]; }
      }
    });
    win.location = loc;
    if (!o.noRegistry) vm.runInContext(registrySrc, ctx);
    return { ctx, win, attrs, doc, writes };
  }
  const head = (host, o) => { const c = mkCtx(host, o); vm.runInContext(headCode, c.ctx); return { cert: c.attrs['data-cert'], title: c.doc.title, topbar: c.win._cbCertHtml, writes: c.writes, c }; };
  const detect = (host, o) => { const c = mkCtx(host, o); if (o && o.dataCert) c.attrs['data-cert'] = o.dataCert; return { cert: vm.runInContext(detectSrc + '\ndetectCert()', c.ctx), writes: c.writes }; };
  const active = (host, o) => { const c = mkCtx(host, o); if (o && o.dataCert) c.attrs['data-cert'] = o.dataCert; return { cert: vm.runInContext("var CERT_OVERRIDE_KEY = 'nplus_' + 'dev_cert';\n" + activeSrc + '\ngetActiveCertId()', c.ctx), writes: c.writes }; };
  const all3 = (host, o) => ({ h: head(host, o).cert, d: detect(host, o).cert, a: active(host, o).cert });
  const agree = (r, want) => r.h === want && r.d === want && r.a === want;

  const R = (() => { const c = mkCtx('x'); return c.win.CertRegistry; })();

  test('Detection sources are extractable (head IIFE, detectCert, getActiveCertId)', !!headCode && !!detectSrc && !!activeSrc);

  // 1. Every registry host, alias and Vercel preview: all three paths agree, and equal byHost.
  const bad = [];
  R.all().forEach((e) => {
    const names = [e.hostPrefix].concat(e.hostAliases);
    const hosts = [e.host];
    names.forEach((n) => { hosts.push(n + '.certanvil.com'); hosts.push(n + '-x.vercel.app'); });
    hosts.forEach((h) => {
      const want = R.byHost(h);
      const r = all3(h);
      if (!agree(r, want)) bad.push(h + ' -> head ' + r.h + ', detectCert ' + r.d + ', getActiveCertId ' + r.a + ', byHost ' + want);
    });
  });
  test('All three paths agree for every registry host, alias and <prefix>-x.vercel.app' + (bad.length ? ' — ' + bad.slice(0, 3).join(' | ') : ''), bad.length === 0);
  test('Non-family hosts resolve to their own cert (spot check: azure, ai, sc900, clfc02, secplus, networkplus)',
    ['azure:az900', 'ai:ai900', 'sc900:sc900', 'clfc02:clfc02', 'secplus:secplus', 'networkplus:netplus'].every((p) => {
      const [pre, id] = p.split(':'); return agree(all3(pre + '.certanvil.com'), id);
    }));
  test('A cold visit to aplus.certanvil.com resolves to aplus-core1 in all three paths', agree(all3('aplus.certanvil.com'), 'aplus-core1'));

  // 2. Default and unknown override.
  test('netplus is the default on localhost and an unknown host in all three paths',
    agree(all3('localhost'), 'netplus') && agree(all3('example.com'), 'netplus'));
  const unk = { storage: { [KEY]: 'secai' } };
  test('unknown override falls back to netplus in head and detectCert',
    head('localhost', unk).cert === 'netplus' && detect('localhost', unk).cert === 'netplus' && active('localhost', unk).cert === 'netplus');
  const typo = { storage: { [KEY]: 'secplsu' } };
  test('A typo override falls back exactly as if no override existed (never null, never an unknown pack)',
    head('localhost', typo).cert === 'netplus' && detect('localhost', typo).cert === 'netplus' && head('azure.certanvil.com', typo).cert === 'az900' && detect('azure.certanvil.com', typo).cert === 'az900');
  test('Unknown override on a cert host: the host still wins',
    agree(all3('secplus.certanvil.com', unk), 'secplus'));

  // 3. Known override on localhost is honoured by all three; host beats override on a non-family host (head + detectCert).
  R.all().forEach((e) => {
    test('Override ' + e.id + ' on localhost is honoured by all three paths', agree(all3('localhost', { storage: { [KEY]: e.id } }), e.id));
  });
  test('Host beats a stale override on a non-family cert host (head and detectCert)',
    head('azure.certanvil.com', { storage: { [KEY]: 'secplus' } }).cert === 'az900' && detect('azure.certanvil.com', { storage: { [KEY]: 'secplus' } }).cert === 'az900');

  // 4. A+ family priority.
  const fam = { storage: { [KEY]: 'aplus-core1' }, search: '?exam=core2' };
  test('A+ family priority: ?exam=core2 beats override aplus-core1 (head and detectCert)',
    head('aplus.certanvil.com', fam).cert === 'aplus-core2' && detect('aplus.certanvil.com', fam).cert === 'aplus-core2');
  const famCert = { storage: { [KEY]: 'aplus-core1' }, search: '?cert=aplus-core2' };
  test('A+ family priority: ?cert=aplus-core2 beats override aplus-core1 (head and detectCert)',
    head('aplus.certanvil.com', famCert).cert === 'aplus-core2' && detect('aplus.certanvil.com', famCert).cert === 'aplus-core2');
  test('A+ family: a saved member override is used when there is no query (all three)',
    agree(all3('aplus.certanvil.com', { storage: { [KEY]: 'aplus-core2' } }), 'aplus-core2'));
  test('A+ family: a non-member override is ignored (head and detectCert land on the first member)',
    head('aplus.certanvil.com', { storage: { [KEY]: 'secplus' } }).cert === 'aplus-core1' && detect('aplus.certanvil.com', { storage: { [KEY]: 'secplus' } }).cert === 'aplus-core1');
  test('A+ family: an unknown ?exam= falls through to the override, then to the first member',
    head('aplus.certanvil.com', { storage: { [KEY]: 'aplus-core2' }, search: '?exam=core9' }).cert === 'aplus-core2'
    && detect('aplus.certanvil.com', { search: '?exam=core9' }).cert === 'aplus-core1');

  // 5. ?cert= and ?exam= entry points in detectCert (unchanged behaviour: honoured on any host, persisted).
  const dc = detect('localhost', { search: '?cert=secplus' });
  test('detectCert: ?cert=<known id> wins and is persisted', dc.cert === 'secplus' && dc.writes.indexOf(KEY) !== -1);
  test('detectCert: ?cert=<unknown id> is ignored', detect('localhost', { search: '?cert=secai' }).cert === 'netplus');
  test('detectCert: ?exam=core2 on the A+ host maps to aplus-core2 and is persisted',
    detect('aplus.certanvil.com', { search: '?exam=core2' }).cert === 'aplus-core2' && detect('aplus.certanvil.com', { search: '?exam=core2' }).writes.indexOf(KEY) !== -1);
  test('detectCert: ?exam= is ignored off the A+ family (localhost, another cert host), like the head',
    detect('localhost', { search: '?exam=core2' }).cert === 'netplus' && detect('secplus.certanvil.com', { search: '?exam=core2' }).cert === 'secplus'
    && head('localhost', { search: '?exam=core2' }).cert === 'netplus');
  test('No localStorage write happens on a plain visit to any registry host (head, detectCert, getActiveCertId)',
    R.all().every((e) => head(e.host).writes.length === 0 && detect(e.host).writes.length === 0 && active(e.host).writes.length === 0));

  // 6. Registry missing (a cached old index.html with a newer script): head falls to netplus; detectCert and
  // getActiveCertId return whatever the head already set in data-cert (netplus when nothing), and never throw.
  const none = { noRegistry: true };
  let threw = false; let nr = {};
  try { nr = { h: head('secplus.certanvil.com', none).cert, d: detect('secplus.certanvil.com', none).cert, a: active('secplus.certanvil.com', none).cert }; } catch (e) { threw = true; }
  test('Registry missing: all three return netplus without throwing', !threw && agree(nr, 'netplus'));
  let threw2 = false; let nr2 = {};
  try { const o = { noRegistry: true, storage: { [KEY]: 'secplus' }, search: '?cert=secplus' }; nr2 = { h: head('localhost', o).cert, d: detect('localhost', o).cert, a: active('localhost', o).cert }; } catch (e) { threw2 = true; }
  test('Registry missing, with an override and ?cert=: still netplus, no throw', !threw2 && agree(nr2, 'netplus'));
  let threw3 = false; let nr3 = {};
  try { const o = { noRegistry: true, dataCert: 'az900' }; nr3 = { d: detect('localhost', o).cert, a: active('localhost', o).cert }; } catch (e) { threw3 = true; }
  test('Registry missing: detectCert and getActiveCertId return the head\'s data-cert (az900), so an old cached page agrees', !threw3 && nr3.d === 'az900' && nr3.a === 'az900');

  // 6b. Every non-family registry host x every other known id as the saved override: the host wins in head and detectCert
  // (the v7.2.2 bug was a secplus host with a netplus override).
  const hostBad = [];
  R.all().filter((e) => !e.family).forEach((e) => {
    R.all().filter((o) => o.id !== e.id).forEach((o) => {
      const opts = { storage: { [KEY]: o.id } };
      const h = head(e.host, opts).cert; const d = detect(e.host, opts).cert;
      if (h !== e.id || d !== e.id) hostBad.push(e.host + ' + override ' + o.id + ' -> head ' + h + ', detectCert ' + d);
    });
  });
  test('Every non-family host beats every other known override in head and detectCert' + (hostBad.length ? ' — ' + hostBad.slice(0, 3).join(' | ') : ''), hostBad.length === 0);

  // 6c. ?cert=<known id> on a non-family host (landing links to networkplus.certanvil.com/?cert=secplus): all paths agree.
  const q = { search: '?cert=secplus' };
  test('?cert=secplus on networkplus.certanvil.com: head and detectCert both open Security+',
    head('networkplus.certanvil.com', q).cert === 'secplus' && detect('networkplus.certanvil.com', q).cert === 'secplus');
  test('?cert=<known id> is honoured by head and detectCert on every host (all ids x all hosts)',
    R.all().every((t) => ['localhost', 'example.com'].concat(R.all().map((e) => e.host)).every((h) => {
      const o = { search: '?cert=' + t.id }; return head(h, o).cert === t.id && detect(h, o).cert === t.id;
    })));
  test('?cert=<unknown id> is ignored by head and detectCert on a cert host',
    head('azure.certanvil.com', { search: '?cert=secai' }).cert === 'az900' && detect('azure.certanvil.com', { search: '?cert=secai' }).cert === 'az900');
  // getActiveCertId ignores query params but runs after detectCert has persisted the choice: same context, same storage.
  const seq = mkCtx('networkplus.certanvil.com', q);
  vm.runInContext(detectSrc + '\ndetectCert()', seq.ctx);
  const seqActive = vm.runInContext("var CERT_OVERRIDE_KEY = 'nplus_' + 'dev_cert';\n" + activeSrc + '\ngetActiveCertId()', seq.ctx);
  test('After detectCert persists ?cert=secplus, getActiveCertId returns secplus too (all three agree)', seqActive === 'secplus');

  // 7. Head title/topbar for an entry the old tables never knew (registry fallback).
  const hc = mkCtx('localhost', { storage: { [KEY]: 'zzfake' } });
  hc.win.CertRegistry._add({ id: 'zzfake', name: 'CompTIA Fake Cert', shortName: 'Fake', code: 'ZZ-1' });
  vm.runInContext(headCode, hc.ctx);
  test('A registry-only cert gets its title and topbar from the registry (no table edit needed)',
    hc.attrs['data-cert'] === 'zzfake' && hc.doc.title === 'CertAnvil · Fake Cert' && hc.win._cbCertHtml === 'Fake Cert <b>ZZ-1</b>');

  // 7b. A registry-only cert works as an override in all three paths (the property new certs rely on).
  const fakeAll = (o) => {
    const out = {};
    [['h', head], ['d', detect], ['a', active]].forEach(([k, fn]) => {
      // fn builds its own ctx, so rebuild with the fake added via a registry source suffix.
      const c = mkCtx('localhost', o); c.win.CertRegistry._add({ id: 'zzfake', name: 'Fake', shortName: 'Fake', code: 'ZZ-1' });
      if (k === 'h') { vm.runInContext(headCode, c.ctx); out[k] = c.attrs['data-cert']; }
      else if (k === 'd') out[k] = vm.runInContext(detectSrc + '\ndetectCert()', c.ctx);
      else out[k] = vm.runInContext("var CERT_OVERRIDE_KEY = 'nplus_' + 'dev_cert';\n" + activeSrc + '\ngetActiveCertId()', c.ctx);
    });
    return out;
  };
  test('A cert added to the registry is honoured as an override by head, detectCert and getActiveCertId',
    agree(fakeAll({ storage: { [KEY]: 'zzfake' } }), 'zzfake'));

  // 8. Source hygiene: no hand-kept per-cert id lists left in the three paths.
  const lists = /'secplus'[^\n]*'az900'[^\n]*'ai900'/;
  test('Head IIFE, detectCert and getActiveCertId carry no hard-coded cert id list',
    !lists.test(headCode) && !lists.test(detectSrc) && !lists.test(activeSrc));
})();
