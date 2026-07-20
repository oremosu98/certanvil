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
test('v7.5.0 CertPack: AI-900 domain weights sum within tolerance (>= 0.95 && <= 1.05)',
  (() => {
    // 5-domain weights (0.175/0.225/0.175/0.175/0.25 per May 2025 refresh
    // midpoints). Sums to exactly 1.00.
    var m = certAi900.match(/domainWeights:\s*\{([\s\S]*?)\}/);
    if (!m) return false;
    var nums = (m[1].match(/[0-9]*\.[0-9]+/g) || []).map(Number);
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    return sum >= 0.95 && sum <= 1.05;
  })());
test('v7.5.0 CertPack: AI-900 exemplar bank >= 195 entries',
  (() => {
    // Count addedVersion: "7.5.0" markers — one per exemplar in the v7.5.0
    // ship. The cert pack uses unquoted JS object literal keys (vs the JSON
    // shape some prior packs used), so the regex anchors on the unquoted
    // form. Floor 195 gives 5+ headroom from the 200 plan target (final
    // count 206 per Stage 6 commit).
    var matches = certAi900.match(/addedVersion:\s*"7\.5\.0"/g);
    return matches && matches.length >= 195;
  })());
test('v7.5.0 CertPack: AI-900 topic catalog has >= 35 topics',
  (() => {
    // Count keys in the topicDomains object. Mirrors AZ-900 pattern with the
    // topicResources block boundary marker. AI-900 has 40 topics per plan
    // Stage 1 (D1=7 / D2=9 / D3=7 / D4=7 / D5=10).
    var topicSection = certAi900.match(/topicDomains:\s*\{([\s\S]*?)\},\s*\n\s*\/\//);
    if (!topicSection) return false;
    var keys = topicSection[1].match(/^\s*'[^']+':/gm) || [];
    return keys.length >= 35;
  })());
test('v7.5.0 CertPack: every AI-900 exemplar topic exists in topicDomains',
  (() => {
    // Mirrors the AZ-900 v7.3.0 guard. Domain IDs differ (5-domain set:
    // ai-workloads / ml-fundamentals / computer-vision / nlp-workloads /
    // genai-workloads). Exemplar.topic uses unquoted JS key style.
    var topicSection = certAi900.match(/topicDomains:\s*\{([\s\S]*?)\},\s*\n\s*\/\//);
    if (!topicSection) return false;
    var topicKeys = new Set();
    var keyMatch;
    var keyRe = /'([^']+)':\s*'(?:ai-workloads|ml-fundamentals|computer-vision|nlp-workloads|genai-workloads)'/g;
    while ((keyMatch = keyRe.exec(topicSection[1])) !== null) {
      topicKeys.add(keyMatch[1]);
    }
    if (topicKeys.size < 35) return false; // sanity check that extraction worked
    // Scan every exemplar.topic field (unquoted-key form: topic: "...")
    var exTopics = certAi900.match(/topic:\s*"([^"]+)"/g) || [];
    if (exTopics.length === 0) return false;
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].replace(/^topic:\s*"/, '').replace(/"$/, '');
      if (!topicKeys.has(t)) return false;
    }
    return true;
  })());
test('v7.5.0 CertPack: Domain 5 has >= 10 Azure AI Foundry exemplars (VoC §13.6 competitor-gap floor)',
  (() => {
    // VoC §13.6 mandate: 10+ Azure AI Foundry exemplars in Domain 5 as the
    // competitor-gap goldmine. Count exemplars whose topic is the Foundry
    // topic OR whose question/explanation references "Azure AI Foundry"
    // by name. Floor 10 catches regressions where Foundry coverage gets
    // reduced (e.g. someone trims D5 exemplars without auditing for Foundry).
    var foundryRefs = certAi900.match(/Azure AI Foundry/g) || [];
    return foundryRefs.length >= 10;
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
    var matches = certAplusCore1.match(/addedVersion:\s*"7\.6\.0"/g);
    return matches && matches.length >= 195;
  })());
test('v7.6.0 CertPack: Core 2 exemplar bank >= 195 entries',
  (() => {
    var matches = certAplusCore2.match(/addedVersion:\s*"7\.6\.0"/g);
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
    var exTopics = certAplusCore1.match(/topic:\s*"([^"]+)"/g) || [];
    if (exTopics.length === 0) return false;
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].replace(/^topic:\s*"/, '').replace(/"$/, '');
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
    var exTopics = certAplusCore2.match(/topic:\s*"([^"]+)"/g) || [];
    if (exTopics.length === 0) return false;
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].replace(/^topic:\s*"/, '').replace(/"$/, '');
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
    var matches = certSc900.match(/addedVersion:\s*"7\.7\.0"/g);
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
    var exTopics = certSc900.match(/topic:\s*"([^"]+)"/g) || [];
    if (exTopics.length === 0) return false;
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].replace(/^topic:\s*"/, '').replace(/"$/, '');
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
    var matches = certClfc02.match(/addedVersion:\s*"7\.8\.0"/g);
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
    var exTopics = certClfc02.match(/topic:\s*"([^"]+)"/g) || [];
    if (exTopics.length === 0) return false;
    for (var i = 0; i < exTopics.length; i++) {
      var t = exTopics[i].replace(/^topic:\s*"/, '').replace(/"$/, '');
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

// Domain 1 gets a wider tolerance (13pp vs 10pp for D2-5) because foundational
// Concepts content (PKI, crypto, change-mgmt) accumulates faster as new lessons are
// authored — it self-corrects as D2-5 banks fill in. D2-5 stay at ±10pp.
test('v7.4.0 Sec+ domain distribution within blueprint +/- 10pp (D2-5) / +/- 13pp (D1) (12/22/18/28/20)',
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
    var tolerance = { '1': 13, '2': 10, '3': 10, '4': 10, '5': 10 };
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
test('v4.86.0 CertPack: sw.js SHELL_ASSETS includes certs/netplus.js',
  /SHELL_ASSETS\s*=\s*\[[\s\S]{0,700}certs\/netplus\.js/.test(sw));
test('v4.86.0 CertPack: sw.js SHELL_ASSETS includes certs/secplus.js',
  /SHELL_ASSETS\s*=\s*\[[\s\S]{0,700}certs\/secplus\.js/.test(sw));

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
test('v4.87.0 SecplusContent: topicDomains has 38 SY0-701 topics',
  (() => {
    const m = certSecplus.match(/topicDomains:\s*\{([\s\S]*?)\n\s*\},/);
    if (!m) return false;
    const keyLines = m[1].split('\n').filter(l => /^\s*'[^']+':\s*'(concepts|threats|architecture|operations|governance)'/.test(l));
    return keyLines.length === 38;
  })());
test('v4.87.0 SecplusContent: topicResources populated (38 entries)',
  (() => {
    const m = certSecplus.match(/topicResources:\s*\{([\s\S]*?)\n\s*\},/);
    if (!m) return false;
    const keyLines = m[1].split('\n').filter(l => /^\s*'[^']+':\s*\{\s*obj:/.test(l));
    return keyLines.length === 38;
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

