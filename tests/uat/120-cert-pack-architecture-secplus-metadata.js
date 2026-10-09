// tests/uat/120-cert-pack-architecture-secplus-metadata.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Scope: Cert pack architecture Phase 1A + AZ-900/AI-900/A+ Core1&2/SC-900/AWS CLF-C02 cert adds, Sec+ exemplar bank expansion, Net+/Sec+ metadata

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

// ═══════════════════════════════════════════════════════════════════════
// v4.86.0 — Cert pack architecture (Phase 1A engine refactor).
// Multi-cert engine: Network+ + Security+ live in certs/<cert>.js, loaded
// before app.js via <script> tags. detectCert() resolves active cert by
// localStorage override → URL host prefix → netplus default. Phase 1A
// scope: cert metadata + RETENTION_GAP_CONCEPTS only. Future phases add
// TOPIC_DOMAINS, DOMAIN_WEIGHTS, topicResources, GT tables, exemplars.
// ═══════════════════════════════════════════════════════════════════════

// ── Architecture in app.js ──
test('v4.86.0 CertPack: detectCert function defined',
  /function\s+detectCert\s*\(\s*\)/.test(js));
test('v4.86.0 CertPack: detectCert handles localStorage dev override',
  /detectCert[\s\S]{0,800}localStorage[\s\S]{0,400}nplus_dev_cert/.test(js));
// v4.89.5: detectCert added a `?cert=` URL param branch at the top, which
// pushed the location.host check + final netplus return further down.
// Window sizes widened to accommodate.
// v7.2.1: Pattern A subdomain detection — hostname MUST win over the
// localStorage override for known cert subdomains (secplus.certanvil.com /
// networkplus.certanvil.com). Pre-v7.2.1 the host check was a single
// `secplus-` prefix sufficient for Vercel preview branches only;
// production `secplus.` subdomains fell through to localStorage and
// rendered the wrong cert when a stale override was set. Guard migrated
// from the legacy `secplus-` prefix assertion to the v7.2.1 Pattern A
// contract: detectCert reads location.hostname AND maps both `secplus.`
// and `networkplus.` patterns; window widened to span the new Pattern A
// branch + the demoted localStorage step.
test('v7.2.1 CertPack: detectCert handles Pattern A subdomain detection (secplus. + networkplus.)',
  // v7.6.0: window widened 3000 -> 5000 to absorb the A+ ?exam= param block +
  // aplus. hostname branch added to detectCert (regex-window class-of-bug per
  // the v5.5.7/v7.2.2 lesson — size for worst case). Regression strength kept.
  /function\s+detectCert[\s\S]{0,5000}location\.hostname[\s\S]{0,600}secplus\.[\s\S]{0,200}networkplus\./.test(js));
test('v7.2.1 CertPack: detectCert Pattern A hostname check runs BEFORE localStorage override',
  // Tombstone the pre-v7.2.1 ordering where localStorage won over hostname.
  // Assert: the hostname/Pattern A block (location.hostname read) appears
  // BEFORE the localStorage nplus_dev_cert read inside detectCert.
  (function () {
    var m = /function\s+detectCert\s*\(\s*\)\s*\{[\s\S]*?\n\}/.exec(js);
    if (!m) return false;
    var body = m[0];
    var hostIdx = body.indexOf('location.hostname');
    var lsIdx = body.indexOf("getItem('nplus_dev_cert')");
    return hostIdx > 0 && lsIdx > 0 && hostIdx < lsIdx;
  })());
test('v7.2.1 CertPack: detectCert maps secplus.certanvil.com to secplus',
  /function\s+detectCert[\s\S]{0,5000}secplus\.certanvil\.com[\s\S]{0,200}return\s+['"]secplus['"]/.test(js));
test('v7.2.1 CertPack: detectCert maps networkplus.certanvil.com to netplus',
  /function\s+detectCert[\s\S]{0,5000}networkplus\.certanvil\.com[\s\S]{0,200}return\s+['"]netplus['"]/.test(js));
test('v4.86.0 CertPack: detectCert defaults to netplus',
  /function\s+detectCert[\s\S]{0,5000}return\s+['"]netplus['"]/.test(js));
test('v4.86.0 CertPack: CURRENT_CERT and CERT_PACK constants declared',
  /const\s+CURRENT_CERT\s*=\s*detectCert\(\)/.test(js) &&
  /const\s+CERT_PACK\s*=.*window\.CERT_PACKS\[CURRENT_CERT\]/.test(js));

// v7.2.2: class-of-bug-grep follow-up to v7.2.1 — the SAME `secplus-` prefix
// bug existed in the index.html inline cert-detection IIFE (which document.writes
// the correct certs/<cert>.js script tag). Fixing app.js detectCert() alone
// (v7.2.1) made things worse on secplus.certanvil.com: detectCert() correctly
// returned 'secplus' but the inline script still document.wrote netplus.js, so
// CERT_PACKS.secplus was never populated → CERT_PACK = null → cert-pack-driven
// renders broke. v7.2.2 mirrors the Pattern A subdomain check into the inline
// IIFE: hostname WINS over localStorage for known cert subdomains.
test('v7.2.2 CertPack: index.html inline IIFE applies Pattern A subdomain detection (secplus. + networkplus.)',
  /v7\.2\.2 Pattern A subdomain detection[\s\S]{0,2000}location\.hostname[\s\S]{0,600}secplus\.[\s\S]{0,300}networkplus\./.test(html));
test('v7.2.2 CertPack: index.html inline IIFE hostname check runs BEFORE localStorage read',
  // Tombstone the pre-v7.2.2 ordering where localStorage won over hostname.
  // Assert: in the inline IIFE before </head>, location.hostname is read BEFORE
  // localStorage.getItem('nplus_dev_cert') so a stale dev override can't
  // out-vote a real Pattern A subdomain match.
  // v7.81.0 P0a: IIFE finder updated — the head IIFE no longer document.writes
  // a <script> tag (moved to end-of-body); find it by window._certPackSrc instead.
  (function () {
    var m = /\(function\s*\(\)\s*\{[\s\S]*?window\._certPackSrc\s*=[\s\S]*?\}\)\(\);/.exec(html);
    if (!m) return false;
    var body = m[0];
    var hostIdx = body.indexOf('location.hostname');
    var lsIdx = body.indexOf("getItem('nplus_dev_cert')");
    return hostIdx > 0 && lsIdx > 0 && hostIdx < lsIdx;
  })());
test('v7.2.2 CertPack: index.html inline IIFE maps secplus.certanvil.com to secplus',
  /\(function\s*\(\)\s*\{[\s\S]{0,3000}secplus\.certanvil\.com[\s\S]{0,200}cert\s*=\s*['"]secplus['"]/.test(html));
test('v7.2.2 CertPack: index.html inline IIFE maps networkplus.certanvil.com to netplus',
  /\(function\s*\(\)\s*\{[\s\S]{0,3000}networkplus\.certanvil\.com[\s\S]{0,200}cert\s*=\s*['"]netplus['"]/.test(html));

// ── Both cert packs declare correctly ──
test('v4.86.0 CertPack: certs/netplus.js declares window.CERT_PACKS.netplus',
  /window\.CERT_PACKS\.netplus\s*=\s*\{/.test(certNetplus));
test('v4.86.0 CertPack: certs/secplus.js declares window.CERT_PACKS.secplus',
  /window\.CERT_PACKS\.secplus\s*=\s*\{/.test(certSecplus));

// ══════════════════════════════════════════════════════════════════════
// v7.3.0 AZ-900 cert add — 8 new tombstones per plan §4 Stage 7
// Pattern A subdomain mirror (3 surfaces) + cert switcher + cert pack
// schema (declaration, domain weights, exemplar bank, topic catalog,
// exemplar-topic integrity). Locks the cert pack contract for the third
// cert in CertAnvil (Microsoft Azure Fundamentals AZ-900).
// ══════════════════════════════════════════════════════════════════════
test('v7.3.0 CertPack: certs/az900.js declares window.CERT_PACKS.az900',
  /window\.CERT_PACKS\.az900\s*=\s*\{/.test(certAz900));
test('v7.3.0 CertPack: app.js detectCert handles azure. + azure- + azure.certanvil.com',
  /host\.indexOf\(['"]azure\.['"]\)\s*===\s*0/.test(js)
  && /host\.indexOf\(['"]azure-['"]\)\s*===\s*0/.test(js)
  && /host\s*===\s*['"]azure\.certanvil\.com['"]/.test(js));
test('v7.3.0 CertPack: index.html inline IIFE maps azure.certanvil.com to az900',
  /\(function\s*\(\)\s*\{[\s\S]{0,3500}azure\.certanvil\.com[\s\S]{0,200}cert\s*=\s*['"]az900['"]/.test(html));
test('v7.3.0 CertPack: auth-state.js getAvailableCerts returns 3 certs (netplus + secplus + az900)',
  (() => {
    var src = authStateJs || '';
    return /id:\s*['"]netplus['"]/.test(src)
        && /id:\s*['"]secplus['"]/.test(src)
        && /id:\s*['"]az900['"]/.test(src);
  })());
test('v7.3.0 CertPack: AZ-900 domain weights sum within tolerance (>= 0.95 && <= 1.05)',
  (() => {
    // vm-extract domainWeights block from cert pack source + sum the values.
    // The cert pack uses fractional weights (0.275/0.375/0.325 = 0.975
    // midpoint approximation per plan §2 decision #4).
    var m = certAz900.match(/domainWeights:\s*\{([\s\S]*?)\}/);
    if (!m) return false;
    var nums = (m[1].match(/[0-9]*\.[0-9]+/g) || []).map(Number);
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    return sum >= 0.95 && sum <= 1.05;
  })());
test('v7.3.0 CertPack: AZ-900 exemplar bank >= 190 entries',
  (() => {
    // vm-extract the questionExemplars array and count entries by counting
    // top-level objects via balanced-brace walk would be brittle on JSON;
    // simpler: count occurrences of the source marker which appears once
    // per exemplar. addedVersion: "7.3.0" appears once per exemplar in the
    // current bank. (When future Phase 3 cycles add to the bank under
    // higher versions, switch this to a different marker or run the bank
    // through Node-eval — but for the v7.3.0 ship floor this is sufficient.)
    var matches = certAz900.match(/"addedVersion":"7\.3\.0"/g);
    return matches && matches.length >= 190;
  })());
test('v7.3.0 CertPack: AZ-900 topic catalog has >= 35 topics',
  (() => {
    // Count keys in the topicDomains object. Each key is a quoted string
    // followed by a colon; the closing brace of topicDomains ends the
    // count. Use the topicResources object as the boundary (it follows
    // immediately after topicDomains in az900.js).
    var topicSection = certAz900.match(/topicDomains:\s*\{([\s\S]*?)\},\s*\n\s*\/\//);
    if (!topicSection) return false;
    var keys = topicSection[1].match(/^\s*'[^']+':/gm) || [];
    return keys.length >= 35;
  })());
test('v7.3.0 CertPack: every AZ-900 exemplar topic exists in topicDomains',
  (() => {
    // Extract every exemplar's topic field via regex + verify each appears
    // as a key in the topicDomains block. Behavioral fixture — guards
    // against typos in exemplar.topic that would orphan the entry from
    // weak-spot routing.
    var topicSection = certAz900.match(/topicDomains:\s*\{([\s\S]*?)\},\s*\n\s*\/\//);
    if (!topicSection) return false;
    var topicKeys = new Set();
    var keyMatch;
    var keyRe = /'([^']+)':\s*'(?:cloud-concepts|azure-architecture|azure-management)'/g;
    while ((keyMatch = keyRe.exec(topicSection[1])) !== null) {
      topicKeys.add(keyMatch[1]);
    }
    if (topicKeys.size < 35) return false; // sanity check that extraction worked
    // Now scan every exemplar.topic field and verify membership
    var exTopics = certAz900.match(/"topic":"([^"]+)"/g) || [];
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].slice(9, -1); // strip "topic":" prefix + closing quote
      if (!topicKeys.has(t)) return false;
    }
    return exTopics.length > 0;
  })());

// ══════════════════════════════════════════════════════════════════════
// v7.5.0 CertPack — Microsoft Azure AI Fundamentals (AI-900) cert add
// ══════════════════════════════════════════════════════════════════════
// 8 regression tombstones for the fourth cert. Mirrors v7.3.0 AZ-900 shape +
// Pattern A subdomain mirror (3 surfaces) + 4-cert switcher + cert pack
// schema (declaration, domain weights, exemplar bank, topic catalog,
// exemplar-topic integrity). Locks the cert pack contract for the fourth
// cert in CertAnvil (Microsoft Azure AI Fundamentals AI-900, AI/data role
// family on ai.certanvil.com).
// ══════════════════════════════════════════════════════════════════════
test('v7.5.0 CertPack: certs/ai900.js declares window.CERT_PACKS.ai900',
  /window\.CERT_PACKS\.ai900\s*=\s*\{/.test(certAi900));
test('v7.5.0 CertPack: app.js detectCert handles ai. + ai- + ai.certanvil.com',
  /host\.indexOf\(['"]ai\.['"]\)\s*===\s*0/.test(js)
  && /host\.indexOf\(['"]ai-['"]\)\s*===\s*0/.test(js)
  && /host\s*===\s*['"]ai\.certanvil\.com['"]/.test(js));
test('v7.5.0 CertPack: index.html inline IIFE maps ai.certanvil.com to ai900',
  /\(function\s*\(\)\s*\{[\s\S]{0,4000}ai\.certanvil\.com[\s\S]{0,200}cert\s*=\s*['"]ai900['"]/.test(html));
test('v7.5.0 CertPack: auth-state.js getAvailableCerts returns 4 certs (netplus + secplus + az900 + ai900)',
  (() => {
    var src = authStateJs || '';
    return /id:\s*['"]netplus['"]/.test(src)
        && /id:\s*['"]secplus['"]/.test(src)
        && /id:\s*['"]az900['"]/.test(src)
        && /id:\s*['"]ai900['"]/.test(src);
  })());
// v8.120.0: AI-900 was retired 2026-06-30; the ai900 pack now holds AI-901
// (internal id kept). These replace the v7.5.0 AI-900 shape guards.
const _ai901 = (() => {
  try { const sb = { window: {} }; vm.runInNewContext(certAi900, sb); return sb.window.CERT_PACKS.ai900; }
  catch (e) { return null; }
})();
test('v8.120.0 AI-901: pack is AI-901 with 2 official domains whose weights sum to 1',
  !!_ai901 && _ai901.meta.code === 'AI-901' && _ai901.meta.id === 'ai900'
    && JSON.stringify(Object.keys(_ai901.domainWeights)) === '["concepts","foundry"]'
    && Math.abs(Object.values(_ai901.domainWeights).reduce((a, b) => a + b, 0) - 1) < 1e-9
    && /1\.1–1\.3[^,]*, 2\.1–2\.4/.test(_ai901.meta.objectiveRanges || ''));
test('v8.120.0 AI-901: every topic has a domain, a resource and at least one exemplar',
  !!_ai901 && (() => {
    const topics = Object.keys(_ai901.topicDomains);
    const used = new Set(_ai901.questionExemplars.map(e => e.topic));
    return topics.length >= 20
      && topics.every(t => ['concepts', 'foundry'].includes(_ai901.topicDomains[t]))
      && topics.every(t => _ai901.topicResources[t] && /^[12]\.\d$/.test(_ai901.topicResources[t].obj))
      && topics.every(t => used.has(t));
  })());
test('v8.120.0 AI-901: every exemplar topic exists in topicDomains and objective matches its topic',
  !!_ai901 && _ai901.questionExemplars.length >= 30
    && _ai901.questionExemplars.every(e => _ai901.topicDomains[e.topic]
      && _ai901.topicResources[e.topic].obj === e.objective));
test('v8.120.0 AI-901: no retired AI-900 machine-learning domain or topics remain',
  !!_ai901 && !/ml-fundamentals|Clustering Workloads|Automated ML \(AutoML\)|Azure AI Studio/.test(certAi900));
test('v8.120.0 AI-901: Microsoft Foundry is covered (>= 10 exemplars name it) and the home grid matches the pack',
  !!_ai901 && _ai901.questionExemplars.filter(e => /Foundry/.test(e.question + ' ' + e.explanation)).length >= 10
    && (() => {
      const hm = fs.readFileSync(path.join(ROOT, 'features', 'home.js'), 'utf8');
      const block = (hm.match(/const _CANONICAL_AI900 = \{([\s\S]*?)\n    \};/) || [])[1] || '';
      const keys = [...block.matchAll(/key: '([^']+)'/g)].map(m => m[1]);
      return keys.length === 10 && keys.every(k => _ai901.topicDomains[k]);
    })());

// ══════════════════════════════════════════════════════════════════════
// v7.6.0 CertPack — CompTIA A+ Core 1 (220-1201) + Core 2 (220-1202) cert add
// ══════════════════════════════════════════════════════════════════════
// 14 regression tombstones for the FIFTH cert family — the first DUAL-EXAM
// family (Core 1 + Core 2 share aplus.certanvil.com via the within-subdomain
// cert switcher). Locks: both cert pack declarations, the 3-file detection
// mirror (detectCert + inline IIFE), the 6-cert switcher, the within-subdomain
// switching pattern, per-exam domain-weight sums, exemplar banks, topic
// catalogs, and exemplar-topic integrity for both exams.
// ══════════════════════════════════════════════════════════════════════
test('v7.6.0 CertPack: certs/aplus-core1.js declares window.CERT_PACKS[aplus-core1]',
  /window\.CERT_PACKS\[['"]aplus-core1['"]\]\s*=\s*\{/.test(certAplusCore1));
test('v7.6.0 CertPack: certs/aplus-core2.js declares window.CERT_PACKS[aplus-core2]',
  /window\.CERT_PACKS\[['"]aplus-core2['"]\]\s*=\s*\{/.test(certAplusCore2));
test('v7.6.0 CertPack: app.js detectCert handles aplus. + aplus- + aplus.certanvil.com',
  /host\.indexOf\(['"]aplus\.['"]\)\s*===\s*0/.test(js)
  && /host\.indexOf\(['"]aplus-['"]\)\s*===\s*0/.test(js)
  && /host\s*===\s*['"]aplus\.certanvil\.com['"]/.test(js)
  // and detectCert defaults the aplus family to Core 1 on cold entry
  && /return\s+['"]aplus-core1['"]/.test(js));
test('v7.6.0 CertPack: index.html inline IIFE maps aplus.certanvil.com to aplus-core1 (default)',
  /\(function\s*\(\)\s*\{[\s\S]{0,6000}aplus\.certanvil\.com[\s\S]{0,500}cert\s*=\s*['"]aplus-core1['"]/.test(html));
test('v7.6.0 CertPack: auth-state.js getAvailableCerts returns 6 certs (4 prior + 2 A+)',
  (() => {
    var src = authStateJs || '';
    return /id:\s*['"]netplus['"]/.test(src)
        && /id:\s*['"]secplus['"]/.test(src)
        && /id:\s*['"]az900['"]/.test(src)
        && /id:\s*['"]ai900['"]/.test(src)
        && /id:\s*['"]aplus-core1['"]/.test(src)
        && /id:\s*['"]aplus-core2['"]/.test(src);
  })());
test('v7.6.0 CertPack: tadSwitchCert does within-subdomain Core 1 <-> Core 2 switching (no host change)',
  (() => {
    // The NEW v7.6.0 pattern: switching between the two A+ exams stays on
    // aplus.certanvil.com (write localStorage + reload), and a cross-subdomain
    // arrival deep-links via ?exam=. Assert both halves exist in tadSwitchCert.
    var src = authStateJs || '';
    return /certId\s*===\s*['"]aplus-core1['"]\s*\|\|\s*certId\s*===\s*['"]aplus-core2['"]/.test(src)
        && /aplus\.certanvil\.com\/\?exam=/.test(src);
  })());
test('v7.6.0 CertPack: Core 1 domain weights sum within tolerance (>= 0.95 && <= 1.05)',
  (() => {
    // Official 220-1201 v4.0 blueprint: 0.13/0.23/0.25/0.11/0.28 = 1.00.
    var m = certAplusCore1.match(/domainWeights:\s*\{([\s\S]*?)\}/);
    if (!m) return false;
    var nums = (m[1].match(/[0-9]*\.[0-9]+/g) || []).map(Number);
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    return sum >= 0.95 && sum <= 1.05;
  })());
test('v7.6.0 CertPack: Core 2 domain weights sum within tolerance (>= 0.95 && <= 1.05)',
  (() => {
    // Official 220-1202 v4.0 blueprint: 0.28/0.28/0.23/0.21 = 1.00.
    var m = certAplusCore2.match(/domainWeights:\s*\{([\s\S]*?)\}/);
    if (!m) return false;
    var nums = (m[1].match(/[0-9]*\.[0-9]+/g) || []).map(Number);
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    return sum >= 0.95 && sum <= 1.05;
  })());
test('v7.6.0 CertPack: Core 1 exemplar bank >= 195 entries',
  (() => {
    var matches = certAplusCore1.match(/"?addedVersion"?:\s*"7\.6\.0"/g);  // v8.132.0: compact JSON quotes the key
    return matches && matches.length >= 195;
  })());
test('v7.6.0 CertPack: Core 2 exemplar bank >= 195 entries',
  (() => {
    var matches = certAplusCore2.match(/"?addedVersion"?:\s*"7\.6\.0"/g);  // v8.130.0: compact JSON quotes the key
    return matches && matches.length >= 195;
  })());
test('v7.6.0 CertPack: Core 1 topic catalog has >= 40 topics',
  (() => {
    var sec = certAplusCore1.match(/topicDomains:\s*\{([\s\S]*?)TOPIC RESOURCES/);
    if (!sec) return false;
    var keys = sec[1].match(/^\s*'[^']+':/gm) || [];
    return keys.length >= 40;
  })());
test('v7.6.0 CertPack: Core 2 topic catalog has >= 40 topics',
  (() => {
    var sec = certAplusCore2.match(/topicDomains:\s*\{([\s\S]*?)TOPIC RESOURCES/);
    if (!sec) return false;
    var keys = sec[1].match(/^\s*'[^']+':/gm) || [];
    return keys.length >= 40;
  })());
test('v7.6.0 CertPack: every Core 1 exemplar topic exists in topicDomains',
  (() => {
    var sec = certAplusCore1.match(/topicDomains:\s*\{([\s\S]*?)TOPIC RESOURCES/);
    if (!sec) return false;
    var topicKeys = new Set();
    var keyRe = /'([^']+)':\s*'(?:mobile-devices|networking|hardware|virt-cloud|troubleshooting-hw-net)'/g;
    var km;
    while ((km = keyRe.exec(sec[1])) !== null) topicKeys.add(km[1]);
    if (topicKeys.size < 40) return false; // extraction sanity
    var exTopics = certAplusCore1.match(/"topic":"([^"]+)"/g) || [];  // v8.132.0: exemplars are compact JSON
    if (exTopics.length === 0) return false;
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].replace(/^"topic":"/, '').replace(/"$/, '');
      if (!topicKeys.has(t)) return false;
    }
    return true;
  })());
test('v7.6.0 CertPack: every Core 2 exemplar topic exists in topicDomains',
  (() => {
    var sec = certAplusCore2.match(/topicDomains:\s*\{([\s\S]*?)TOPIC RESOURCES/);
    if (!sec) return false;
    var topicKeys = new Set();
    var keyRe = /'([^']+)':\s*'(?:operating-systems|security|software-troubleshooting|operational-procedures)'/g;
    var km;
    while ((km = keyRe.exec(sec[1])) !== null) topicKeys.add(km[1]);
    if (topicKeys.size < 40) return false; // extraction sanity
    var exTopics = certAplusCore2.match(/"topic":"([^"]+)"/g) || [];  // v8.130.0: exemplars are compact JSON
    if (exTopics.length === 0) return false;
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].replace(/^"topic":"/, '').replace(/"$/, '');
      if (!topicKeys.has(t)) return false;
    }
    return true;
  })());

// ══════════════════════════════════════════════════════════════════════
// v7.7.0 CertPack — Microsoft SC-900 Security, Compliance & Identity (sixth cert)
// ══════════════════════════════════════════════════════════════════════
// 8 regression tombstones for the sixth cert. Mirrors the v7.5.0 AI-900 shape
// (single-exam Pattern A): subdomain mirror on 3 surfaces + 7-cert switcher +
// cert pack schema (declaration, domain weights, exemplar bank, topic catalog,
// exemplar-topic integrity). Locks the SC-900 cert pack contract (Microsoft
// Security/Compliance/Identity on sc900.certanvil.com).
// ══════════════════════════════════════════════════════════════════════
test('v7.7.0 CertPack: certs/sc900.js declares window.CERT_PACKS.sc900',
  /window\.CERT_PACKS\.sc900\s*=\s*\{/.test(certSc900));
test('v7.7.0 CertPack: app.js detectCert handles sc900. + sc900- + sc900.certanvil.com',
  /host\.indexOf\(['"]sc900\.['"]\)\s*===\s*0/.test(js)
  && /host\.indexOf\(['"]sc900-['"]\)\s*===\s*0/.test(js)
  && /host\s*===\s*['"]sc900\.certanvil\.com['"]/.test(js));
test('v7.7.0 CertPack: index.html inline IIFE maps sc900.certanvil.com to sc900',
  /\(function\s*\(\)\s*\{[\s\S]{0,6000}sc900\.certanvil\.com[\s\S]{0,200}cert\s*=\s*['"]sc900['"]/.test(html));
test('v7.7.0 CertPack: auth-state.js getAvailableCerts returns 7 certs (netplus + secplus + az900 + ai900 + sc900 + aplus-core1 + aplus-core2)',
  (() => {
    var src = authStateJs || '';
    return /id:\s*['"]netplus['"]/.test(src)
        && /id:\s*['"]secplus['"]/.test(src)
        && /id:\s*['"]az900['"]/.test(src)
        && /id:\s*['"]ai900['"]/.test(src)
        && /id:\s*['"]sc900['"]/.test(src)
        && /id:\s*['"]aplus-core1['"]/.test(src)
        && /id:\s*['"]aplus-core2['"]/.test(src);
  })());
test('v7.7.0 CertPack: SC-900 domain weights sum within tolerance (>= 0.95 && <= 1.05)',
  (() => {
    // 4-domain weights (0.125/0.275/0.375/0.225 per the 2025-11-07 Skills
    // Measured midpoints). Sums to exactly 1.00. Decimal-only regex avoids
    // matching the integer percentages in the inline comments.
    var m = certSc900.match(/domainWeights:\s*\{([\s\S]*?)\}/);
    if (!m) return false;
    var nums = (m[1].match(/[0-9]*\.[0-9]+/g) || []).map(Number);
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    return sum >= 0.95 && sum <= 1.05;
  })());
test('v7.7.0 CertPack: SC-900 exemplar bank >= 195 entries',
  (() => {
    // Count addedVersion: "7.7.0" markers — one per exemplar (final count 200
    // per Stage 6: D1 25 / D2 55 / D3 75 / D4 45). Floor 195 gives headroom.
    var matches = certSc900.match(/"?addedVersion"?:\s*"7\.7\.0"/g);  // v8.132.0: compact JSON quotes the key
    return matches && matches.length >= 195;
  })());
test('v7.7.0 CertPack: SC-900 topic catalog has >= 40 topics',
  (() => {
    // Count keys in topicDomains (SC-900 has 53: D1 9 / D2 12 / D3 19 / D4 13).
    var topicSection = certSc900.match(/topicDomains:\s*\{([\s\S]*?)\},\s*\n\s*\/\//);
    if (!topicSection) return false;
    var keys = topicSection[1].match(/^\s*'[^']+':/gm) || [];
    return keys.length >= 40;
  })());
test('v7.7.0 CertPack: every SC-900 exemplar topic exists in topicDomains',
  (() => {
    // 4-domain set: sci-concepts / entra / security-solutions / compliance-solutions.
    var topicSection = certSc900.match(/topicDomains:\s*\{([\s\S]*?)\},\s*\n\s*\/\//);
    if (!topicSection) return false;
    var topicKeys = new Set();
    var keyMatch;
    var keyRe = /'([^']+)':\s*'(?:sci-concepts|entra|security-solutions|compliance-solutions)'/g;
    while ((keyMatch = keyRe.exec(topicSection[1])) !== null) {
      topicKeys.add(keyMatch[1]);
    }
    if (topicKeys.size < 40) return false; // sanity check that extraction worked
    var exTopics = certSc900.match(/"topic":"([^"]+)"/g) || [];  // v8.132.0: exemplars are compact JSON
    if (exTopics.length === 0) return false;
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].replace(/^"topic":"/, '').replace(/"$/, '');
      if (!topicKeys.has(t)) return false;
    }
    return true;
  })());

// ══════════════════════════════════════════════════════════════════════
// v7.8.0 CertPack — AWS Certified Cloud Practitioner CLF-C02 (seventh cert)
// ══════════════════════════════════════════════════════════════════════
// 8 regression tombstones for the seventh cert (third vendor, AWS). Mirrors the
// v7.7.0 SC-900 shape (single-exam Pattern A): subdomain mirror on 3 surfaces +
// 8-cert switcher + cert pack schema (declaration, domain weights, exemplar
// bank, topic catalog, exemplar-topic integrity). Locks the CLF-C02 cert pack
// contract (AWS Cloud Practitioner on clfc02.certanvil.com).
// ══════════════════════════════════════════════════════════════════════
test('v7.8.0 CertPack: certs/clfc02.js declares window.CERT_PACKS.clfc02',
  /window\.CERT_PACKS\.clfc02\s*=\s*\{/.test(certClfc02));
test('v7.8.0 CertPack: app.js detectCert handles clfc02. + clfc02- + clfc02.certanvil.com',
  /host\.indexOf\(['"]clfc02\.['"]\)\s*===\s*0/.test(js)
  && /host\.indexOf\(['"]clfc02-['"]\)\s*===\s*0/.test(js)
  && /host\s*===\s*['"]clfc02\.certanvil\.com['"]/.test(js));
test('v7.8.0 CertPack: index.html inline IIFE maps clfc02.certanvil.com to clfc02',
  /\(function\s*\(\)\s*\{[\s\S]{0,6000}clfc02\.certanvil\.com[\s\S]{0,200}cert\s*=\s*['"]clfc02['"]/.test(html));
test('v7.8.0 CertPack: auth-state.js getAvailableCerts returns 8 certs (netplus + secplus + az900 + ai900 + sc900 + clfc02 + aplus-core1 + aplus-core2)',
  (() => {
    var src = authStateJs || '';
    return /id:\s*['"]netplus['"]/.test(src)
        && /id:\s*['"]secplus['"]/.test(src)
        && /id:\s*['"]az900['"]/.test(src)
        && /id:\s*['"]ai900['"]/.test(src)
        && /id:\s*['"]sc900['"]/.test(src)
        && /id:\s*['"]clfc02['"]/.test(src)
        && /id:\s*['"]aplus-core1['"]/.test(src)
        && /id:\s*['"]aplus-core2['"]/.test(src);
  })());
test('v7.8.0 CertPack: CLF-C02 domain weights sum within tolerance (>= 0.95 && <= 1.05)',
  (() => {
    // 4-domain weights (0.24/0.30/0.34/0.12 — official CLF-C02 percentages).
    // Sums to exactly 1.00. Decimal-only regex avoids matching the integer
    // percentages in the inline comments.
    var m = certClfc02.match(/domainWeights:\s*\{([\s\S]*?)\}/);
    if (!m) return false;
    var nums = (m[1].match(/[0-9]*\.[0-9]+/g) || []).map(Number);
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    return sum >= 0.95 && sum <= 1.05;
  })());
test('v7.8.0 CertPack: CLF-C02 exemplar bank >= 195 entries',
  (() => {
    // Count addedVersion: "7.8.0" markers — one per exemplar (final count 200
    // per Stage 6: D1 48 / D2 60 / D3 68 / D4 24). Floor 195 gives headroom.
    var matches = certClfc02.match(/"?addedVersion"?:\s*"7\.8\.0"/g);  // v8.129.0: compact JSON quotes the key
    return matches && matches.length >= 195;
  })());
test('v7.8.0 CertPack: CLF-C02 topic catalog has >= 40 topics',
  (() => {
    // Count keys in topicDomains (CLF-C02 has 54: D1 13 / D2 16 / D3 18 / D4 7).
    var topicSection = certClfc02.match(/topicDomains:\s*\{([\s\S]*?)\},\s*\n\s*\/\//);
    if (!topicSection) return false;
    var keys = topicSection[1].match(/^\s*'[^']+':/gm) || [];
    return keys.length >= 40;
  })());
test('v7.8.0 CertPack: every CLF-C02 exemplar topic exists in topicDomains',
  (() => {
    // 4-domain set: cloud-concepts / security-compliance / cloud-tech-services /
    // billing-pricing-support.
    var topicSection = certClfc02.match(/topicDomains:\s*\{([\s\S]*?)\},\s*\n\s*\/\//);
    if (!topicSection) return false;
    var topicKeys = new Set();
    var keyMatch;
    var keyRe = /'([^']+)':\s*'(?:cloud-concepts|security-compliance|cloud-tech-services|billing-pricing-support)'/g;
    while ((keyMatch = keyRe.exec(topicSection[1])) !== null) {
      topicKeys.add(keyMatch[1]);
    }
    if (topicKeys.size < 40) return false; // sanity check that extraction worked
    var exTopics = certClfc02.match(/"topic":"([^"]+)"/g) || [];  // v8.129.0: exemplars are compact JSON
    if (exTopics.length === 0) return false;
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].replace(/^"topic":"/, '').replace(/"$/, '');
      if (!topicKeys.has(t)) return false;
    }
    return true;
  })());

// v7.2.3: cert-filter the readiness model so the Drill These To Move Your
// Score what-if chips (+ readiness card / pass probability / forecast) work
// on Sec+ instead of staying hidden because every history entry got filtered
// out by the downstream TOPIC_DOMAINS lookup. Same class-of-bug-grep
// precedent as v5.5.7 (renderHeroV2 lede, renderContinueCard) + v4.99.26
// (buildSessionPlan). Without these tombstones, a future refactor that drops
// the _isCurrentCertTopic call would silently re-introduce the Sec+ blank-
// readiness regression + the PKI-on-Net+ cross-cert leak in the what-if chips.
test('v7.2.3 Readiness: getReadinessScore cert-filters loadHistory via _isCurrentCertTopic',
  /function\s+getReadinessScore[\s\S]{0,2000}loadHistory\(\)[\s\S]{0,300}_isCurrentCertTopic\s*\(\s*e\.topic\s*\)/.test(js));
test('v7.2.3 Readiness: getReadinessForecast cert-filters loadHistory via _isCurrentCertTopic',
  /function\s+getReadinessForecast[\s\S]{0,2000}loadHistory\(\)[\s\S]{0,300}_isCurrentCertTopic\s*\(\s*e\.topic\s*\)/.test(js));

// ── v7.4.0 Sec+ exemplar bank expansion (131 -> 237; VoC + blueprint-balanced) ──
// Founder-supplied VoC research (~/Desktop/SECPLUS-RESEARCH-2026-05-27.md, 608
// Reddit posts cross-checked against the official SY0-701 exam objectives PDF)
// drove a blueprint-balanced expansion: catastrophic Governance gap closed
// (3 exemplars -> 48), Threats domain rebalanced (14 -> 55), 8 new retention
// concepts seeded (PICERL, RTO/RPO/MTTR/MTBF, DMARC+DKIM+SPF, Tactical/
// Operational/Strategic, Cert Format Families, AAA Framework, ALE=SLE*ARO,
// OWASP Top 3). These tombstones lock the shape so a future refactor that
// drops exemplars or breaks the topic/domain contract trips UAT instead of
// shipping silently.
test('v7.4.0 Sec+ exemplar bank >= 230 (functional ship threshold)',
  (function() {
    var matches = certSecplus.match(/"type":/g) || [];
    return matches.length >= 230;
  })());

test('v7.4.0 Sec+ retentionGapConcepts >= 23',
  (function() {
    var m = certSecplus.match(/retentionGapConcepts:\s*\[([\s\S]*?)\n\s*\],/);
    if (!m) return false;
    var labelMatches = m[1].match(/parentTopic:/g) || [];
    return labelMatches.length >= 23;
  })());

test('v7.4.0 Sec+ every exemplar.topic exists in topicDomains',
  (function() {
    var domainsMatch = certSecplus.match(/topicDomains:\s*\{([\s\S]*?)\n\s*\},/);
    if (!domainsMatch) return false;
    var topicKeys = new Set();
    var keyRe = /'([^']+)':/g;
    var keyMatch;
    while ((keyMatch = keyRe.exec(domainsMatch[1])) !== null) {
      topicKeys.add(keyMatch[1]);
    }
    if (topicKeys.size < 35) return false;
    var exTopicMatches = certSecplus.match(/"topic":"([^"]+)"/g) || [];
    for (var i = 0; i < exTopicMatches.length; i++) {
      var t = exTopicMatches[i].slice(9, -1);
      if (!topicKeys.has(t)) return false;
    }
    return exTopicMatches.length > 0;
  })());

test('v7.4.0 Sec+ every exemplar.objective matches X.Y format',
  (function() {
    var objMatches = certSecplus.match(/"objective":"([^"]+)"/g) || [];
    if (objMatches.length === 0) return false;
    var objRe = /^\d+\.\d+$/;
    for (var i = 0; i < objMatches.length; i++) {
      var o = objMatches[i].slice(13, -1);
      if (!objRe.test(o)) return false;
    }
    return true;
  })());

test('v7.4.0 Sec+ exemplar topics cover >=32 of topicDomains keys (3-topic gap floor)',
  (function() {
    var domainsMatch = certSecplus.match(/topicDomains:\s*\{([\s\S]*?)\n\s*\},/);
    if (!domainsMatch) return false;
    var topicKeys = new Set();
    var keyRe = /'([^']+)':/g;
    var keyMatch;
    while ((keyMatch = keyRe.exec(domainsMatch[1])) !== null) {
      topicKeys.add(keyMatch[1]);
    }
    if (topicKeys.size < 35) return false;
    var exTopicMatches = certSecplus.match(/"topic":"([^"]+)"/g) || [];
    var exemplarTopics = new Set();
    for (var i = 0; i < exTopicMatches.length; i++) {
      var t = exTopicMatches[i].slice(9, -1);
      exemplarTopics.add(t);
    }
    var covered = 0;
    topicKeys.forEach(function(k) {
      if (exemplarTopics.has(k)) covered++;
    });
    return covered >= 32;
  })());

test('v7.4.0 Sec+ difficulty distribution sensible (Foundational + Exam Level + Hard all present)',
  (function() {
    var diffMatches = certSecplus.match(/"difficulty":"([^"]+)"/g) || [];
    var diffs = new Set();
    for (var i = 0; i < diffMatches.length; i++) {
      var d = diffMatches[i].slice(14, -1);
      diffs.add(d);
    }
    return diffs.has('Foundational') && diffs.has('Exam Level') && diffs.has('Hard');
  })());

test('v7.4.0 Sec+ type distribution sensible (mcq + multi-select both present)',
  (function() {
    var typeMatches = certSecplus.match(/"type":"([^"]+)"/g) || [];
    var types = new Set();
    for (var i = 0; i < typeMatches.length; i++) {
      var t = typeMatches[i].slice(8, -1);
      types.add(t);
    }
    return types.has('mcq') && types.has('multi-select');
  })());

// Domain 1 gets a wider tolerance (16pp vs 10pp for D2-5) because foundational
// Concepts content (PKI, crypto, change-mgmt, key-exchange) accumulates faster as new
// lessons are authored — it self-corrects as D2-5 banks fill in. D2-5 stay at ±10pp.
// Widened 13pp→16pp at v7.98.0 after 11 key-exchange exemplars (all obj 1.4) pushed
// D1 to 27.4%; the bank is still growing and will rebalance as other domains fill in.
// Widened 16pp→19pp at v8.7.0 after 11 Obfuscation exemplars (also obj 1.4) pushed
// D1 to 30.1%. THIS IS THE SECOND WIDENING AND BOTH WERE DRIVEN BY OBJECTIVE 1.4 —
// the guard is now effectively saturated for D1, so it no longer catches D1 drift.
// The real fix is GROWING D2–D5 (all currently 3–7pp UNDER target), not loosening
// this a third time. Founder decision 2026-07-27: widen now, rebalance later.
// DO NOT widen again — author D2–D5 exemplars instead.
test('v7.4.0 Sec+ domain distribution within blueprint +/- 10pp (D2-5) / +/- 19pp (D1) (12/22/18/28/20)',
  (function() {
    var objMatches = certSecplus.match(/"objective":"(\d+)\.\d+"/g) || [];
    if (objMatches.length === 0) return false;
    var domainCount = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    for (var i = 0; i < objMatches.length; i++) {
      var m = objMatches[i].match(/"objective":"(\d+)\./);
      if (!m) continue;
      var d = m[1];
      if (domainCount.hasOwnProperty(d)) domainCount[d]++;
    }
    var total = objMatches.length;
    var target = { '1': 12, '2': 22, '3': 18, '4': 28, '5': 20 };
    var tolerance = { '1': 19, '2': 10, '3': 10, '4': 10, '5': 10 };
    for (var k in target) {
      var actualPct = (domainCount[k] / total) * 100;
      if (Math.abs(actualPct - target[k]) > tolerance[k]) return false;
    }
    return true;
  })());

// ── Network+ cert metadata (preserves existing exam constants) ──
test('v4.86.0 netplus meta: id is netplus',
  /id:\s*['"]netplus['"]/.test(certNetplus));
test('v4.86.0 netplus meta: name is CompTIA Network+',
  /name:\s*['"]CompTIA Network\+['"]/.test(certNetplus));
test('v4.86.0 netplus meta: code is N10-009',
  /code:\s*['"]N10-009['"]/.test(certNetplus));
test('v4.86.0 netplus meta: examPassScore 720',
  /examPassScore:\s*720/.test(certNetplus));
test('v4.86.0 netplus meta: examMaxScore 900',
  /examMaxScore:\s*900/.test(certNetplus));
test('v4.86.0 netplus meta: examQuestionCount 90',
  /examQuestionCount:\s*90/.test(certNetplus));
test('v4.86.0 netplus meta: examTimeSeconds 5400',
  /examTimeSeconds:\s*5400/.test(certNetplus));

// ── Security+ cert metadata (Phase 1A scaffolding) ──
test('v4.86.0 secplus meta: id is secplus',
  /id:\s*['"]secplus['"]/.test(certSecplus));
test('v4.86.0 secplus meta: name is CompTIA Security+',
  /name:\s*['"]CompTIA Security\+['"]/.test(certSecplus));
test('v4.86.0 secplus meta: code is SY0-701',
  /code:\s*['"]SY0-701['"]/.test(certSecplus));
test('v4.86.0 secplus meta: examPassScore 750 (Security+ pass mark)',
  /examPassScore:\s*750/.test(certSecplus));
// v4.88.3: retention array populated by Phase 3 Cycle 1 (5 concepts from
// Messer gap study). Was empty as of v4.86.0; the empty assertion is
// retired and replaced with a populated-shape assertion.
test('v4.86.0 secplus retention array (retargeted v4.88.3): populated by Phase 3 Cycle 1',
  /retentionGapConcepts:\s*\[\s*\{[\s\S]{50,}label:[\s\S]{0,200}parentTopic:/.test(certSecplus));

// ── HTML loads cert packs BEFORE app.js ──
// v4.99.30 (iOS Plan Phase 4a — mobile perf): cert packs no longer load
// via static <script> tags. The inline cert-detection script in <head>
// document.write's the active cert pack tag (one of netplus.js or secplus.js,
// never both) to save ~510-610 KB on first paint. Tests below retargeted:
//   - was: assert static <script src="certs/netplus.js"> exists
//   - now: assert inline detection script document.write's the cert pack
//     dynamically, AND assert static dual-load tags do NOT reappear
//     (regression-guard tombstone — see CLAUDE.md regression-guard pattern).
test('v4.99.30 CertPack lazy-load: inline <head> script document.writes the active cert pack tag',
  // v7.81.0 P0a: head IIFE now sets window._certPackSrc + emits preload hint;
  // actual <script> injection moved to end-of-body (sync, before defer scripts).
  // Assert the end-of-body injection uses document.write + _certPackSrc.
  /document\.write\(\s*['"]<scr['"][\s\S]{0,200}window\._certPackSrc/.test(html));
test('v4.99.30 CertPack lazy-load: static <script src="certs/netplus.js"> tag REMOVED (regression tombstone)',
  !/<script\s+src=["']certs\/netplus\.js["']/.test(html));
test('v4.99.30 CertPack lazy-load: static <script src="certs/secplus.js"> tag REMOVED (regression tombstone)',
  !/<script\s+src=["']certs\/secplus\.js["']/.test(html));
test('v7.81.0 P0a CertPack: head IIFE sets window._certPackSrc before app.js; end-of-body script injects after',
  // P0a contract: head IIFE saves cert URL to window._certPackSrc so the end-of-body
  // script can use it without re-running detection. The end-of-body injection (sync,
  // non-defer) executes before all defer scripts including app.js, preserving
  // the CERT_PACK-before-app.js invariant while unblocking first paint.
  (() => {
    const certPackSrcIdx = html.indexOf('window._certPackSrc =');
    const appDeferIdx = html.indexOf('<script defer src="app.js"');
    const bodyInjectIdx = html.indexOf("document.write('<scr'");
    // head IIFE sets _certPackSrc before app.js defer tag
    // end-of-body injection comes after the app.js defer tag
    return certPackSrcIdx > 0 && appDeferIdx > 0 && bodyInjectIdx > 0
      && certPackSrcIdx < appDeferIdx
      && bodyInjectIdx > appDeferIdx;
  })());
test('v4.99.30 CertPack lazy-load: data-cert attribute already set on <html> before document.write fires (correct ordering)',
  (() => {
    const setAttrIdx = html.indexOf("setAttribute('data-cert'");
    const docWriteIdx = html.indexOf("document.write('<scr'");
    return setAttrIdx > 0 && docWriteIdx > 0 && setAttrIdx < docWriteIdx;
  })());

// ── SW precaches cert packs ──
// v4.87.4: window widened from 400 to 700 chars to accommodate the favicon
// comment block now sitting between manifest.json and the cert paths.
// v7.83.0: widened to 800 — styles-critical.css + dg-critical.css added to
// SHELL_ASSETS pushed the cert paths ~50 chars further.
// v7.86.0: widened to 950 — lift-critical.css (+ its explanatory comment)
// added to SHELL_ASSETS pushed the cert paths further still (measured 875).
test('v4.86.0 CertPack: sw.js SHELL_ASSETS includes certs/netplus.js',
  /SHELL_ASSETS\s*=\s*\[[\s\S]{0,950}certs\/netplus\.js/.test(sw));
test('v4.86.0 CertPack: sw.js SHELL_ASSETS includes certs/secplus.js',
  /SHELL_ASSETS\s*=\s*\[[\s\S]{0,950}certs\/secplus\.js/.test(sw));

// ═══════════════════════════════════════════════════════════════════════
// v4.87.0 — Security+ pack content + cert-aware prompt + private banner.
// First substantive Security+ ship. Cert pack stub gets full SY0-701 topic
// catalog (32 topics), domain weights, Professor Messer URLs. Generation
// prompts in _fetchQuestionsBatch use CERT_NAME_FULL so Haiku knows which
// cert it's writing for. Inline <head> script sets data-cert on <html>
// synchronously so the right banner paints first (no Network+ → Security+
// content flash on Security+ mode load).
// ═══════════════════════════════════════════════════════════════════════

// ── Cert-aware prompt ──
test('v4.87.0 PerCertPrompt: CERT_NAME_FULL constant declared',
  /const\s+CERT_NAME_FULL\s*=.*CERT_PACK.*meta/.test(js));
test('v4.87.0 PerCertPrompt: CERT_CODE constant declared',
  /const\s+CERT_CODE\s*=.*CERT_PACK.*code/.test(js));
test('v4.87.0 PerCertPrompt: prompt MIXED case uses CERT_NAME_FULL',
  /MIXED_TOPIC[\s\S]{0,400}\$\{CERT_NAME_FULL\}/.test(js));
test('v4.87.0 PerCertPrompt: prompt single-topic case uses CERT_NAME_FULL',
  /Focus only on:\s*[\s\S]{0,200}\$\{CERT_NAME_FULL\}/.test(js));
test('v4.87.0 PerCertPrompt: hardcoded "Network+ N10-009" REMOVED from MIXED prompt',
  !/Cover a broad mix of Network\+ N10-009/.test(js));

// ── Inline <head> cert detection script ──
test('v4.87.0 InlineCertDetect: <head> script sets data-cert on <html>',
  /document\.documentElement\.setAttribute\(['"]data-cert['"]/.test(html));

// ── Security+ private-mode banner ──
// v4.99.80: "Private · Builder use" → "Private builder" (mockup wording)
test('v4.87.0 SecplusBanner: banner mentions SY0-701 + private + builder',
  /SY0-701/.test(html) && /Private builder/.test(html));
test('v4.87.0 SecplusBanner: .secplus-private-banner CSS declared',
  /\.secplus-private-banner\s*\{/.test(css));
test('v4.87.0 SecplusBanner: cert-mode visibility rule — show on data-cert="secplus"',
  /\[data-cert="secplus"\]\s*\.secplus-private-banner\s*\{\s*display:\s*inline-flex/.test(css));
test('v4.87.0 SecplusBanner: orange-amber gradient (rgba(245,158,11))',
  /\.secplus-private-banner[\s\S]{0,400}rgba\(245,158,11/.test(css));

// ── Security+ cert pack content ──
test('v4.87.0 SecplusContent: topicDomains has 39 SY0-701 topics',
  (() => {
    const m = certSecplus.match(/topicDomains:\s*\{([\s\S]*?)\n\s*\},/);
    if (!m) return false;
    const keyLines = m[1].split('\n').filter(l => /^\s*'[^']+':\s*'(concepts|threats|architecture|operations|governance)'/.test(l));
    return keyLines.length === 39;
  })());
test('v4.87.0 SecplusContent: topicResources populated (39 entries)',
  (() => {
    const m = certSecplus.match(/topicResources:\s*\{([\s\S]*?)\n\s*\},/);
    if (!m) return false;
    const keyLines = m[1].split('\n').filter(l => /^\s*'[^']+':\s*\{\s*obj:/.test(l));
    return keyLines.length === 39;
  })());
test('v4.87.0 SecplusContent: domainWeights sum to 1.00',
  (() => {
    const m = certSecplus.match(/domainWeights:\s*\{([\s\S]*?)\n\s*\},/);
    if (!m) return false;
    const nums = m[1].match(/0\.\d+/g) || [];
    const sum = nums.reduce((a, n) => a + parseFloat(n), 0);
    return Math.abs(sum - 1.00) < 0.001;
  })());
test('v4.87.0 SecplusContent: 5 domain labels declared',
  (() => {
    const m = certSecplus.match(/domainLabels:\s*\{([\s\S]*?)\n\s*\},/);
    if (!m) return false;
    const keyLines = m[1].split('\n').filter(l => /^\s*\w+:\s*['"]/.test(l));
    return keyLines.length === 5;
  })());
test('v4.87.0 SecplusContent: covers Domain 4.0 Operations IAM topic',
  /'Identity & Access Management':\s*'operations'/.test(certSecplus));
test('v4.87.0 SecplusContent: covers Domain 5.0 Governance Risk Mgmt topic',
  /'Risk Management':\s*'governance'/.test(certSecplus));
test('v4.87.0 SecplusContent: Messer URLs use SY0-701 query param',
  /search:\s*'professor\+messer\+SY0-701/.test(certSecplus));

// ═══════════════════════════════════════════════════════════════════════
// v4.87.1 — Security+ usability ship: auto-deploy via GitHub Actions for
// both certs · 77 carry-over exemplars from Network+ retagged for SY0-701
// · dynamic topic-chip rendering when CURRENT_CERT === 'secplus'.
// ═══════════════════════════════════════════════════════════════════════

// ── Auto-deploy: single GitHub Actions production deploy (main project) ──
// 2026-06-27 CertAnvil consolidation: the redundant Security+ parallel deploy
// (Job 4b → secplus-quiz-sable) was REMOVED. secplus.certanvil.com is served by
// the main project via the Network+ deploy. The two tombstones keep it gone.
test('v4.87.1 AutoDeploy: ci.yml has Network+ deploy-production job',
  /deploy-production:[\s\S]{0,200}Deploy to Production \(Network\+\)/.test(require('fs').readFileSync('.github/workflows/ci.yml', 'utf8')));
test('Consolidation tombstone: ci.yml has NO redundant Security+ deploy job',
  !/deploy-production-secplus:/.test(require('fs').readFileSync('.github/workflows/ci.yml', 'utf8')));
test('Consolidation tombstone: ci.yml does NOT hardcode the retired secplus-quiz-sable project ID',
  !require('fs').readFileSync('.github/workflows/ci.yml', 'utf8').includes('prj_CyuAuPobazxHgrHMYWR0em9gKJeU'));

// ── Carry-over exemplars in Security+ pack ──
// v4.88.3: total exemplar count grows with each Phase 3 Cycle. Pin the
// CARRY-OVER subset (always 77) by source-tag instead.
test('v4.87.1 CarryOver: Security+ pack has 77 carry-over exemplars (from Network+)',
  (() => {
    const matches = certSecplus.match(/"source":"curated-netplus-carryover"/g) || [];
    return matches.length === 77;
  })());
// v4.95.1 → v4.99.25: cumulative Phase 3 total grows with each cycle.
// Cycle 1 (v4.88.3) = 15 (Messer gaps), Cycle 2 (v4.95.1) = 3 (Gap Analysis),
// Cycle 3 (v4.99.25) = 8 (Zero Trust). Total: 26.
test('v4.95.1 Phase 3 Cycle 2: 3 new Gap Analysis exemplars (v4.95.1)',
  (() => {
    const matches = certSecplus.match(/"addedVersion":"4\.95\.1"/g) || [];
    return matches.length === 3;
  })());
test('v4.95.1 Phase 3 Cycle 2: Gap Analysis retention concept added',
  /label:\s*'Gap Analysis'[\s\S]{0,200}parentTopic:\s*'Security Governance'/.test(certSecplus));
// v4.99.25 Phase 3 Cycle 3 — Zero Trust gap from Messer studying
test('v4.99.25 Phase 3 Cycle 3: 8 new Zero Trust exemplars (v4.99.25)',
  (() => {
    const matches = certSecplus.match(/"addedVersion":"4\.99\.25"/g) || [];
    return matches.length === 8;
  })());
test('v4.99.25 Phase 3 Cycle 3: all 8 new exemplars target the Zero Trust & SDN topic',
  (() => {
    const matches = certSecplus.match(/"topic":"Zero Trust & SDN"[\s\S]{0,5000}?"addedVersion":"4\.99\.25"/g) || [];
    return matches.length === 8;
  })());
test('v4.99.25 Phase 3 Cycle 3: Control Plane vs Data Plane retention concept added',
  /label:\s*'Zero Trust Control Plane vs Data Plane'/.test(certSecplus));
test('v4.99.25 Phase 3 Cycle 3: Policy Components (PE/PA/PDP/PEP) retention concept added',
  /label:\s*'Zero Trust Policy Components'/.test(certSecplus));
test('v4.99.25 Phase 3 Cycle 3: Adaptive Identity & Threat Scope retention concept added',
  /label:\s*'Adaptive Identity & Threat Scope'/.test(certSecplus));
test('v4.99.25 Phase 3 Cycle 3: distinguishes PE (decides) from PA (configures) from PEP (enforces)',
  /PE decides, PA configures, PEP enforces/.test(certSecplus));

// v4.99.40 Phase 3 Cycle 4 — Physical Security gap from morning Messer studying
test('v4.99.40 Phase 3 Cycle 4: 10 new Physical Security exemplars (v4.99.40)',
  (() => {
    const matches = certSecplus.match(/"addedVersion":"4\.99\.40"/g) || [];
    return matches.length === 10;
  })());
test('v4.99.40 Phase 3 Cycle 4: all 10 new exemplars target the Security Controls topic',
  (() => {
    const matches = certSecplus.match(/"topic":"Security Controls","objective":"1\.2"[\s\S]{0,5000}?"addedVersion":"4\.99\.40"/g) || [];
    return matches.length === 10;
  })());
test('v4.99.40 Phase 3 Cycle 4: Cluster A — bollards exemplar (vehicle-attack prevention)',
  /bollards[\s\S]{0,500}vehicle-ramming/i.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Cluster A — perimeter lighting exemplar (deterrent + detection-enabler dual role)',
  /perimeter lighting[\s\S]{0,1000}deterrent[\s\S]{0,500}usable footage/i.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Cluster A — sensor types exemplar (microwave + PIR correct, pressure/ultrasonic/acoustic trap)',
  /microwave sensors[\s\S]{0,3000}passive IR/i.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Cluster B — access control vestibule (mantrap) exemplar with tailgating threat',
  /access control vestibule[\s\S]{0,2000}tailgating/i.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Cluster B — cable lock (laptop traveling) exemplar',
  /cable lock[\s\S]{0,500}Kensington[\s\S]{0,1500}snatch-and-run/i.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Cluster B — PIV/CAC badge exemplar (PKI + federal/military)',
  /PIV.*Personal Identity Verification[\s\S]{0,300}CAC.*Common Access Card/.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Cluster C — CCTV detective-control exemplar',
  /CCTV[\s\S]{0,2000}DETECTIVE/i.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Cluster C — tamper-evident seal exemplar',
  /tamper-EVIDENT seal/i.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Cluster D — air gap vs DMZ multi-select exemplar',
  /SCADA[\s\S]{0,2000}air gap[\s\S]{0,3000}DMZ/i.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Cluster D — guards (human judgment) exemplar',
  /trained security guards[\s\S]{0,1500}case-by-case/i.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Physical Security Control Categories retention concept added',
  /label:\s*'Physical Security Control Categories'/.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Access Control Vestibule (Mantrap) retention concept added',
  /label:\s*'Access Control Vestibule \(Mantrap\)'/.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: Air Gap vs DMZ vs VLAN Isolation retention concept added',
  /label:\s*'Air Gap vs DMZ vs VLAN Isolation'/.test(certSecplus));
test('v4.99.40 Phase 3 Cycle 4: retention concepts spell out the deterrent/preventive/detective distinction',
  /DETERRENT[\s\S]{0,200}psychological barrier[\s\S]{0,200}PREVENTIVE[\s\S]{0,200}physical barrier[\s\S]{0,200}DETECTIVE/i.test(certSecplus));

// v4.99.41 Phase 3 Cycle 5 — Deception & Disruption gap from morning Messer studying
test('v4.99.41 Phase 3 Cycle 5: 8 new Deception/Disruption exemplars (v4.99.41)',
  (() => {
    const matches = certSecplus.match(/"addedVersion":"4\.99\.41"/g) || [];
    return matches.length === 8;
  })());
test('v4.99.41 Phase 3 Cycle 5: all 8 new exemplars target Security Controls / Domain 1.2',
  (() => {
    const matches = certSecplus.match(/"topic":"Security Controls","objective":"1\.2"[\s\S]{0,5000}?"addedVersion":"4\.99\.41"/g) || [];
    return matches.length === 8;
  })());
test('v4.99.41 Phase 3 Cycle 5: Cluster A — honeypot primary-purpose exemplar (Foundational)',
  /intentionally vulnerable web server[\s\S]{0,2000}classic honeypot/i.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Cluster A — honeynet (lateral movement chain) exemplar',
  /lateral-movement chain[\s\S]{0,2000}honeynet — a network of multiple interconnected honeypots/i.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Cluster A — honeyfile (passwords_2026.txt) exemplar',
  /passwords_2026\.txt[\s\S]{0,2000}honeyfile/i.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Cluster A — honeytoken (seeded DB records, broadest umbrella) exemplar',
  /honeytoken[\s\S]{0,2000}umbrella concept[\s\S]{0,1000}fake API keys/i.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Cluster B — DNS sinkhole (C2 redirect + log infected hosts) exemplar',
  /DNS sinkhole[\s\S]{0,2000}recursive DNS resolver[\s\S]{0,1000}requesting client/i.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Cluster B — DNS sinkhole vs sandbox multi-select exemplar',
  /distinguish a DNS sinkhole from a sandbox[\s\S]{0,3000}NAME RESOLUTION/i.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Cluster C — fake telemetry (mislead recon) exemplar',
  /fake telemetry[\s\S]{0,2500}deliberately misleading/i.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Cluster C — Deception vs Disruption umbrella exemplar',
  /distinguishes DECEPTION technologies from DISRUPTION/i.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Honey-X Scope Ladder retention concept added',
  /label:\s*'Honey-X Scope Ladder'/.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: DNS Sinkhole retention concept added',
  /label:\s*'DNS Sinkhole'/.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Deception vs Disruption retention concept added',
  /label:\s*'Deception vs Disruption'/.test(certSecplus));
test('v4.99.41 Phase 3 Cycle 5: Honey-X retention concept spells out the scope ladder (system→network→file→token)',
  /HONEYPOT = a whole DECOY SYSTEM[\s\S]{0,500}HONEYNET[\s\S]{0,300}HONEYFILE[\s\S]{0,300}HONEYTOKEN/i.test(certSecplus));


// v8.121.0 (AI-901 Phase 2a): user-facing app labels say AI-901, Decision Lab is
// hidden for ai900, and analytics/diagnostic copy no longer hard-codes N10-009.
test('v8.121.0 AI-901: app labels, cert lock and onboarding rows say AI-901',
  (() => {
    const r = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
    return /ai900:\s*\['Azure AI Fundamentals', 'AI-901'\]/.test(html)
      && /ai900: 'Azure AI-901'/.test(r('lib/cert-lock.js'))
      && /id: 'ai900',\s*name: 'AI-901'/.test(r('lib/onboarding-home.js'))
      && /id: 'ai900',\s*name: 'AI-901'/.test(r('lib/onboarding-firstrun.js'));
  })());
test('v8.126.0 AI-901: Decision Lab re-enables ai900 in the app gate, seed loader and engine',
  (() => {
    const sl = fs.readFileSync(path.join(ROOT, 'features', 'sim-lab.js'), 'utf8');
    return js.includes("const _DL_CERTS = ['az900', 'ai900', 'sc900', 'clfc02'];")
      && sl.includes("var _DL_CERTS = ['az900', 'ai900', 'sc900', 'clfc02'];")
      && /ai900: 'features\/decision-lab-seed-ai900\.js'/.test(js)
      && /ai900: 'DECISION_LAB_SEED_AI900'/.test(sl);
  })());
test('v8.126.0 AI-901: Decision Lab seed is the AI-901 rebuild (no retired AI-900 content)',
  (() => {
    const vm = require('vm');
    const sb = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'features', 'decision-lab-seed-ai900.js'), 'utf8'), sb);
    const S = sb.window.DECISION_LAB_SEED_AI900 || [];
    const raw = JSON.stringify(S);
    const objOk = S.every(s => s.cert === 'ai900' && /^(1\.[1-3]|2\.[1-4])$/.test(s.objective));
    const whyOk = S.every(s => s.steps.every(st => st.type !== 'analyze'
      || st.payload.lines.every(l => st.answer.selected.indexOf(l.id) !== -1 || l.why)));
    return S.length >= 45 && objOk && whyOk
      && !/Custom Vision|Form Recognizer|Azure AI Studio|Document Intelligence|regression|clustering/i.test(raw)
      && !/\u2014/.test(raw);
  })());
test('v8.140.0 Mixed: least-recently-seen topics drawn first; later batches in a session move on',
  (() => {
    try {
      const vm = require('vm');
      const qe = fs.readFileSync(path.join(ROOT, 'features', 'quiz-engine.js'), 'utf8');
      const helper = qe.slice(qe.indexOf('  const _drawnAt = {};'), qe.indexOf('  window._lrsPick = _lrsPick;'));
      const sampler = _fnBody(js, '_sampleTopicsForMixedBatch');
      const now = Date.now(), day = 86400000;
      const hist = [ { topic: 'A', date: new Date(now - 1 * day).toISOString() },   // seen yesterday
                     { topic: 'B', date: new Date(now - 9 * day).toISOString() },   // seen 9 days ago
                     { topic: 'C', date: new Date(now - 30 * day).toISOString() } ]; // seen a month ago; D, E never
      const ctx = { Math, Object, Array, Date, isFinite, TOPIC_DOMAINS: { A: 'x', B: 'x', C: 'x', D: 'x', E: 'x' },
        DOMAIN_WEIGHTS: { x: 1 }, loadHistory: () => hist };
      vm.createContext(ctx);
      vm.runInContext(helper + '\nthis._lrsPick = _lrsPick;\n' + sampler, ctx);
      const first = vm.runInContext('_sampleTopicsForMixedBatch({ x: 3 })', ctx).x;
      const second = vm.runInContext('_sampleTopicsForMixedBatch({ x: 2 })', ctx).x;
      const firstSet = new Set(first);
      return first.length === 3 && firstSet.has('D') && firstSet.has('E') && firstSet.has('C') && !firstSet.has('A')
        && second.length === 2 && second.indexOf('B') !== -1 && second.indexOf('A') !== -1;
    } catch (e) { return false; }
  })());
test('v8.139.0 SR: review cards can be removed as broken (two-step, stays removed, reported)',
  (() => {
    const sr = fs.readFileSync(path.join(ROOT, 'features', 'sr-review.js'), 'utf8');
    const css = fs.readFileSync(path.join(ROOT, 'dg-system.css'), 'utf8');
    return /function _srRemoveHtml\(\)[\s\S]{0,700}srRemoveConfirm\(\)[\s\S]{0,200}srRemoveCancel\(\)/.test(sr)
      && /Something wrong with this question\? Remove it/.test(sr)
      && /if \(\(loadSrPrefs\(\)\.removed \|\| \[\]\)\.indexOf\(qHash\) !== -1\) return null;/.test(sr)
      && /saveReport\(card\.question \|\| '', 'Removed from review cards as broken'\)/.test(sr)
      && /window\.srRemoveConfirm\s*=\s*srRemoveConfirm/.test(sr)
      && /#page-sr-review \.sr-remove-btn\{[^}]*min-height:44px/.test(css)
      && /dg-system\.css\?v=8\.139\.0/.test(html);
  })());
test('v8.138.0 Validators: real objective sets (Sec+ 4.9, A+ 2.11, Core 1 5.0 topic), money answers need figures, exam date local',
  (() => {
    try {
      const vm = require('vm');
      const qe = fs.readFileSync(path.join(ROOT, 'features', 'quiz-engine.js'), 'utf8');
      const a = qe.indexOf('  let _voCache = null;'), b = qe.indexOf('  // v8.140.0: coverage-aware Mixed draws');
      const mk = (ranges, tr) => { const c = { CERT_PACK: { meta: { objectiveRanges: ranges } }, topicResources: tr || {}, Object, String, Set }; vm.createContext(c); vm.runInContext(qe.slice(a, b) + '\nthis.vo = _validObjectiveSet; this.money = _moneyNeedsFigures;', c); return c; };
      const sec = mk('1.1–1.4 (A), 2.1–2.5 (B), 3.1–3.4 (C), 4.1–4.9 (D), 5.1–5.6 (E)').vo();
      const c2 = mk('1.1–1.11 (A), 2.1–2.11 (B)').vo();
      const c1 = mk('5.1–5.6 (E)', { 'Troubleshooting Methodology': { obj: '5.0' } }).vo();
      const m = mk('1.1–1.2 (A)').money;
      const broken = { question: 'The team generates a risk figure for the ransomware scenario. Which statement is correct?', options: { A: 'ALE $320,000', B: 'ALE $80,000', C: 'ALE $20,000', D: 'ALE $20,000 again' } };
      const ok = { question: 'An asset worth $100,000 has an EF of 20% and an ARO of 4. What is the ALE?', options: { A: '$20,000', B: '$80,000', C: '$400,000', D: '$5,000' } };
      const rd = fs.readFileSync(path.join(ROOT, 'features', 'readiness.js'), 'utf8');
      return sec.has('4.9') && c2.has('2.11') && c2.has('2.1') && c1.has('5.0') && !sec.has('4.10')
        && m(broken) === true && m(ok) === false
        && /function parseExamDate\(raw\)/.test(rd) && /return Math\.round\(\(exam\.getTime\(\) - today\) \/ 86400000\)/.test(rd);
    } catch (e) { return false; }
  })());
test('v8.136.0 Analytics: domain mastery buckets every Sec+ domain (Net+ key literals gone)',
  (() => {
    try {
      const vm = require('vm');
      const an = fs.readFileSync(path.join(ROOT, 'features', 'analytics.js'), 'utf8');
      const m = an.match(/function\s+computeDomainRawAccuracy\(h\)\s*\{([\s\S]*?)\n  \}/);
      const ctx = { MIXED_TOPIC: 'M', EXAM_TOPIC: 'E', Object,
        DOMAIN_WEIGHTS: { concepts: 0.12, threats: 0.22, architecture: 0.18, operations: 0.28, governance: 0.2 },
        TOPIC_DOMAINS: { T1: 'threats', A1: 'architecture', G1: 'governance', O1: 'operations' } };
      vm.createContext(ctx);
      const fn = vm.runInContext('(function(h){' + m[1] + '})', ctx);
      const out = fn([{ topic: 'T1', score: 8, total: 10 }, { topic: 'A1', score: 9, total: 10 }, { topic: 'G1', score: 7, total: 10 }]);
      return Math.round(out.threats) === 80 && Math.round(out.architecture) === 90 && Math.round(out.governance) === 70
        && !/domByKey = \{ concepts:/.test(an) && !/DOMAIN_NUMS = \{ concepts:/.test(an);
    } catch (e) { return false; }
  })());
test('v8.135.0 Readiness v2: predicted = expected accuracy on the exam scale; effort no longer adds points',
  (() => {
    const src = fs.readFileSync(path.join(ROOT, 'features', 'readiness.js'), 'utf8');
    const body = src.slice(src.indexOf('  function getReadinessScore'), src.indexOf('  function _readReadinessSnapshots'));
    return !/accuracyScore \* 0\.40\) \+ \(coverageScore \* 0\.25\)/.test(body)
      && /const predicted = Math\.round\(EXAM_MIN_SCORE \+ expectedAcc \* _range\)/.test(body)
      && /PRIOR_ACC = 0\.40/.test(body)
      && /\(m\.wCorrect \+ PRIOR_W \* ownAcc\) \/ \(m\.wTotal \+ PRIOR_W\) : PRIOR_ACC/.test(body)
      && /Math\.sqrt\(_pE \* \(1 - _pE\) \/ Math\.max\(10, EXAM_QUESTION_COUNT\)\)/.test(body)
      && /const examReady = predicted >= EXAM_PASS_SCORE && recentAccuracy !== null && recentAccuracy >= passAccuracy/.test(body)
      && /expectedAccuracy: Math\.round\(expectedAcc \* 100\), passAccuracy, recentAccuracy, recentAnswers: recentN, examReady/.test(body);
  })());
test('v8.135.0 Readiness v2: home card + analytics gate "Exam ready" on recent accuracy too',
  (() => {
    const rd = fs.readFileSync(path.join(ROOT, 'features', 'readiness.js'), 'utf8');
    const an = fs.readFileSync(path.join(ROOT, 'features', 'analytics.js'), 'utf8');
    return js.includes("const passed=scaled>=passLine && pending.ready!==false;")
      && rd.includes('queueReadinessAnimation(r.predicted, pct, r.examReady);')
      && rd.includes("' answers: ' + r.recentAccuracy + '% right")
      && an.includes("readiness.examReady !== false") && an.includes("r.examReady === false")
      && !/\* 0\.40 \* 4\.5\)\)/.test(an.slice(an.indexOf('function _anaBtWhyData')));
  })());
test('v8.134.0 Mastery: few answers blend toward the rest of the domain; many answers converge to true accuracy',
  (() => {
    try {
      const vm = require('vm');
      const src = fs.readFileSync(path.join(ROOT, 'features', 'readiness.js'), 'utf8');
      const i = src.indexOf('  const MASTERY_PRIOR_ANSWERS');
      const j = src.indexOf('  // Exported for app.js milestones');
      const dw = src.slice(src.indexOf('  function diffWeight('), src.indexOf('\n  }\n', src.indexOf('  function diffWeight(')) + 4);
      const ctx = { Math, Object, TOPIC_DOMAINS: { T: 'd', O: 'd' },
        _filterHistoryByTopic: (h, t) => h.filter(e => e.topic === t) };
      vm.createContext(ctx);
      vm.runInContext(dw + src.slice(i, j) + '\nthis.bmc = buildMasteryContext; this.tm = topicMastery;', ctx);
      const rows = (t, c, n) => Array.from({ length: n }, (_, k) => ({ topic: t, score: k < c ? 1 : 0, total: 1, difficulty: 'Foundational' }));
      const other = rows('O', 90, 100);                       // rest of the domain at 90%
      const few = ctx.tm('T', ctx.bmc(rows('T', 7, 11).concat(other)));
      const fewMiss = ctx.tm('T', ctx.bmc(rows('T', 7, 12).concat(other)));
      const many = ctx.tm('T', ctx.bmc(rows('T', 60, 80).concat(other)));
      const none = ctx.tm('T', ctx.bmc(other));
      return few.pct === 73 && few.n === 11 && fewMiss.pct === 69 && many.pct === 76 && none === null;
    } catch (e) { return false; }
  })());
test('v8.128.0 Scale: CompTIA maths unchanged; Microsoft/AWS readiness + exam use their own scale',
  (() => {
    try {
      const vm = require('vm');
      const appSrc = fs.readFileSync(path.join(ROOT, 'features', 'readiness.js'), 'utf8');
      const i = appSrc.indexOf('const EXAM_MIN_SCORE');
      const j = appSrc.indexOf('\n', appSrc.indexOf('function scaledExamScore('));
      const block = appSrc.slice(i, j);
      const run = (min, max, pass) => {
        const ctx = { Math, CERT_PACK: { meta: { examMinScore: min } }, EXAM_MAX_SCORE: max, EXAM_PASS_SCORE: pass };
        vm.createContext(ctx);
        vm.runInContext(block + '\nthis.out = { band: READINESS_BAND, r0: readinessFromRaw(0), r100: readinessFromRaw(100), r50: readinessFromRaw(50), close: READINESS_CLOSE, building: READINESS_BUILDING, passPct: readinessBarPct(EXAM_PASS_SCORE), ex0: scaledExamScore(0, 10), ex10: scaledExamScore(10, 10), ex7: scaledExamScore(7, 10) };', ctx);
        return ctx.out;
      };
      const net = run(100, 900, 720), sec = run(100, 900, 750), ms = run(1, 1000, 700), aws = run(100, 1000, 700);
      const compTiaSame = net.band[0] === 420 && net.band[1] === 870 && net.r50 === 645 && net.close === 650 && net.building === 500
        && net.ex0 === 100 && net.ex10 === 900 && net.ex7 === 660 && Math.abs(net.passPct - 66.67) < 0.01
        && sec.band[0] === 420 && sec.band[1] === 870 && sec.r50 === 645;
      const msOk = ms.ex0 === 1 && ms.ex10 === 1000 && ms.band[1] <= 1000 && ms.band[0] >= 1
        && Math.abs(ms.passPct - 66.67) < 0.5 && ms.close > ms.building && ms.close < 700;
      const awsOk = aws.ex0 === 100 && aws.ex10 === 1000 && Math.abs(aws.passPct - 66.67) < 0.5;
      return compTiaSame && msOk && awsOk;
    } catch (e) { return false; }
  })());
test('v8.128.0 Scale: no 420/450/870 or 100+800 literals left in the readiness/exam maths',
  (() => {
    const files = ['features/readiness.js', 'features/analytics.js', 'features/exam.js', 'features/quiz-engine.js', 'features/diagnostic.js']
      .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
    return !/- 420\) \/ 450/.test(files) && !/Math\.round\(100 \+ \(e\.score/.test(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8')) && !/420 \+ \([a-zA-Z]+ \/ 100\) \* 450/.test(files)
      && !/100 \+ \([^)]*\) \* 800/.test(files) && !/\/900\b|\/ 900</.test(files)
      && !/Math\.(max|min)\((420|870),/.test(files);
  })());
test('v8.126.0 Decision Lab: why stays hidden until graded + scenario <mark> renders',
  (() => {
    const sl = fs.readFileSync(path.join(ROOT, 'features', 'sim-lab.js'), 'utf8');
    const css = fs.readFileSync(path.join(ROOT, 'dg-system.css'), 'utf8');
    return sl.includes("_el('span', 'dl-why', '<span>' + _esc(ln.why) + '</span>')")
      && sl.includes(".replace(/&lt;(\\/?)mark&gt;/g, '<$1mark>')")
      && css.includes('#page-decision-lab .sl-analyze-line .dl-why,#page-decision-lab .dl-opt .dl-why{')
      && css.includes('#page-decision-lab .sl-scn-prose mark,');
  })());
test('v8.121.0 copy: analytics + diagnostic no longer hard-code N10-009 domain text',
  (() => {
    const an = fs.readFileSync(path.join(ROOT, 'features', 'analytics.js'), 'utf8');
    const dg = fs.readFileSync(path.join(ROOT, 'features', 'diagnostic.js'), 'utf8');
    return !an.includes('How close each N10-009 domain') && !an.includes('official CompTIA N10-009 exam blueprint')
      && !an.includes('cluster in this N10-009 domain') && !dg.includes('across all 5 N10-009 domains');
  })());

// v8.121.0 (AI-901 Phase 2b/c): switcher, landing labels, diagnostic and
// cross-cert analytics all say AI-901; the landing AI diagnostic pool is
// AI-901 content (it previously held AZ-900 cloud questions).
test('v8.121.0 AI-901: switcher + landing labels + diagnostic API say AI-901',
  (() => {
    const r = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
    return /id: 'ai900',\s*name: 'Microsoft Azure AI Fundamentals',code: 'AI-901'/.test(r('auth-state.js'))
      && /_gateProOnly\('Azure AI Fundamentals \(AI-901\)'\)/.test(r('auth-state.js'))
      && /id:'ai900', name:'Azure AI Fundamentals', code:'AI-901'/.test(r('landing/index.html'))
      && !/\(AI-900\)/.test(r('landing/index.html'))
      && /cert === 'azure-ai-fundamentals'[\s\S]{0,600}code: 'AI-901'/.test(r('landing/api/diagnostic/generate.js'))
      && /examCode: 'AI-901'/.test(r('landing/diagnostic/results-config.js'))
      && /'Identify AI Concepts & Capabilities': 42\.5/.test(r('landing/lib/cross-cert-analytics.js'));
  })());
test('v8.121.0 AI-901: landing diagnostic pool is 20 AI-901 questions across the 2 domains, balanced letters',
  (() => {
    const src = fs.readFileSync(path.join(ROOT, 'landing', 'diagnostic', 'azure-ai-fundamentals', 'quiz.html'), 'utf8');
    const m = src.match(/var QUESTION_POOL = (\[[\s\S]*?\n  \]);/);
    if (!m) return false;
    const pool = vm.runInNewContext(m[1]);
    const doms = new Set(pool.map(q => q.domain));
    const letters = {}; pool.forEach(q => letters[q.answer] = (letters[q.answer] || 0) + 1);
    return pool.length === 20 && doms.size === 2 && doms.has('AI Concepts & Capabilities') && doms.has('Microsoft Foundry Solutions')
      && ['A', 'B', 'C', 'D'].every(l => letters[l] === 5)
      && !/Hybrid cloud|CapEx|Azure Monitor/.test(m[1]);
  })());
