// tests/uat/544-domain-count.js
// Scope: cert-registry Part 1, Task 1.5. The two remaining per-cert hardcodes move to data:
//  - the CSS that hides unused static domain slots keys off <html data-domain-count> (set in the head from
//    CertRegistry.get(cert).domainCount), not off a per-cert html[data-cert="..."] list;
//  - the _CANONICAL_* home-grid topic objects live in each pack as canonicalDomainTopics and home.js reads CERT_PACK.
// The CSS is evaluated, not pattern-matched: for every registry cert, which of the 5 static slots does the cascade hide?
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Domain count CSS and canonical topics ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const css = read('dg-system.css');
  const html = read('index.html');
  const home = read('features/home.js');

  function sandbox() { const sb = { window: {} }; sb.window.window = sb.window; vm.createContext(sb); return sb; }
  const regSb = sandbox();
  vm.runInContext(read('lib/cert-registry.js'), regSb, { filename: 'lib/cert-registry.js' });
  const R = regSb.window.CertRegistry;
  const ids = R.all ? R.all().map((e) => e.id) : Object.keys(JSON.parse(read('tests/fixtures/cert-surfaces-v1.json')));
  function pack(id) {
    const sb = sandbox();
    vm.runInContext(read('certs/' + id + '.js'), sb, { filename: 'certs/' + id + '.js' });
    return sb.window.CERT_PACKS[id];
  }

  // Which (surface, idx) pairs does dg-system.css hide with display:none for <html data-domain-count="N">?
  const SURFACES = ['details.topic-domain-group', '.tdp-pill', '.dgh-db'];
  function hiddenFor(count) {
    const hidden = {};
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(css))) {
      if (!/display\s*:\s*none\s*!important/.test(m[2])) continue;
      m[1].split(',').forEach((sel) => {
        const s = sel.trim().replace(/^[\s\S]*\*\//, '').trim();
        const sm = /^html\[data-domain-count="(\d)"\]\s+(details\.topic-domain-group|\.tdp-pill|\.dgh-db)\[data-domain-idx="(\d)"\]$/.exec(s);
        if (sm && Number(sm[1]) === count) hidden[sm[2] + '#' + sm[3]] = true;
      });
    }
    return hidden;
  }
  function slotsHiddenOnAllSurfaces(count) {
    const h = hiddenFor(count);
    const out = [];
    for (let k = 1; k <= 5; k++) if (SURFACES.every((s) => h[s + '#' + k])) out.push(k);
    return out;
  }
  function anySlotHidden(count) { return Object.keys(hiddenFor(count)).length; }

  // 1. The cascade, per registry cert: slots beyond domainCount are hidden on all three surfaces, nothing else is.
  ids.forEach((id) => {
    const n = R.get(id).domainCount;
    const expected = [];
    for (let k = n + 1; k <= 5; k++) expected.push(k);
    const h = hiddenFor(n);
    const hiddenCount = Object.keys(h).length;
    test('544: ' + id + ' (' + n + ' domains) hides exactly slots ' + (expected.join(',') || 'none') + ' via data-domain-count',
      JSON.stringify(slotsHiddenOnAllSurfaces(n)) === JSON.stringify(expected) && hiddenCount === expected.length * SURFACES.length);
  });
  test('544: a 5-domain cert hides no slot, and an unset attribute hides none either (registry missing leaves the full grid)',
    anySlotHidden(5) === 0 && !/html\s*\{[^}]*display\s*:\s*none/.test(css) && !/html:not\(\[data-domain-count/.test(css));
  test('544: the data-domain-count rules cover 3-domain certs (a future 3-domain cert needs no new CSS)',
    JSON.stringify(slotsHiddenOnAllSurfaces(3)) === '[4,5]');

  // 2. No per-cert idx hide rule survives.
  test('544: no html[data-cert="..."] rule in dg-system.css targets a data-domain-idx slot',
    !/html\[data-cert=[^\]]*\][^{]*\[data-domain-idx=/.test(css));

  // 3. The head sets the attribute from the registry, inside the existing detection try.
  test('544: index.html head sets data-domain-count from CertRegistry.get(cert).domainCount',
    /setAttribute\(\s*'data-domain-count'\s*,\s*String\(\s*window\.CertRegistry\.get\(cert\)\.domainCount\s*\)\s*\)/.test(html));

  // 4. dg-system.css ?v= moved off the pre-task value.
  test('544: dg-system.css cache-bust query was bumped (both link and noscript)',
    (html.match(/dg-system\.css\?v=([^"]+)"/g) || []).length === 2 && !/dg-system\.css\?v=8\.204\.0-d15"/.test(html));

  // 5. Canonical topics live in the packs.
  test('544: features/home.js carries no _CANONICAL_ constants', !/_CANONICAL_/.test(home));
  test('544: home.js reads CERT_PACK.canonicalDomainTopics', /CERT_PACK\.canonicalDomainTopics/.test(home));
  ids.forEach((id) => {
    const p = pack(id);
    const c = p && p.canonicalDomainTopics;
    const dw = p ? Object.keys(p.domainWeights).join('|') : '';
    test('544: ' + id + ' canonicalDomainTopics keys equal its domainWeights keys',
      !!c && Object.keys(c).join('|') === dw);
    test('544: ' + id + ' every canonical topic has a label and a key that exists in its topicDomains',
      !!c && Object.keys(c).every((d) => Array.isArray(c[d]) && c[d].length > 0 && c[d].every((t) => t.label && p.topicDomains[t.key])));
  });
})();
