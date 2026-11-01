// lib/cert-registry.js — the one shared list of certs (window.CertRegistry).
// Replaces the ~25 hand-maintained per-cert lists. Pure data plus lookups: ES5, one IIFE, no dependencies,
// no DOM, no storage, so it runs unchanged in the browser and under node `vm` (UAT).
// Loaded in <head> after native-shell.js and before the inline cert-detection IIFE.
//
// Entry = { id, name, shortName, code, vendor, mark, glyph, glyphAccent, glyphSup, legal,
//           labels: { signin, firstrun, firstrunCode, onboardingName, onboardingVendor, onboardingHomeSub, certLock, gate, hubName, hubCode },
//           host, hostPrefix, hostAliases[], family, examSlug, pack, tier, hidden,
//           scale: { min, max, pass, format }, domainCount, simLab, decisionLab, decisionLabSeed, diagnosticSlug }
// glyphAccent = which letter of the Fraunces switcher glyph is bronze: 'last' (N+, AWS, PSM) or 'first' (SecAI+ 'SAI', so it never reads as AI-900).
// glyphSup = the small bronze numeral after the glyph ('1'/'2' for A+, 'I'/'II' for PSM), '' for none.
// legal = the trademark + not-affiliated line the cert info area shows (Settings), '' for none.
// labels.firstrunCode / hubName / hubCode = the second line in the first-run picker, and the name + code slot in My certs (the hub).
// labels.gate = the feature label the Pro upsell modal shows when a Free user tries to switch to the cert.
// labels.onboardingHomeSub = the second line under the cert name in the onboarding Home bar / switcher sheet.
// decisionLabSeed = the seed script path the Decision Lab loads for the cert (null: none).
// hostAliases: extra first-label names that resolve to the entry (Network+ lives on networkplus.certanvil.com; 'netplus' is kept as an alias).
// Values are frozen from tests/fixtures/cert-surfaces-v1.json; A+ first-run code uses the approved 220-1201/1202.
(function (root) {
  'use strict';

  var DOMAIN = '.certanvil.com';

  // My certs (hub) name: the cert name without a CompTIA/Microsoft prefix (what the hub showed before it read the registry).
  function hubShort(name) { return String(name || '').replace(/^(CompTIA|Microsoft)\s+/, ''); }

  // scale: scaled certs report min/max/pass on the vendor scale; CompTIA packs define no min, so 100 (their 100-900 scale).
  // format: 'scaled' unless the entry says 'percent' (PRINCE2, PSM).
  function mk(o) {
    var e = {
      id: o.id, name: o.name, shortName: o.shortName, code: o.code, vendor: o.vendor, mark: o.mark, glyph: o.glyph,
      glyphAccent: o.glyphAccent || 'last', glyphSup: o.glyphSup || '', legal: o.legal || '',
      labels: {
        signin: o.signin, firstrun: o.shortName, firstrunCode: o.frCode || o.code, onboardingName: o.onbName,
        onboardingVendor: o.onbVendor, onboardingHomeSub: o.homeSub, certLock: o.certLock, gate: o.gate || o.name,
        hubName: o.hubName || hubShort(o.name), hubCode: o.hubCode || o.code
      },
      host: o.hostPrefix + DOMAIN, hostPrefix: o.hostPrefix, hostAliases: o.aliases || [],
      family: o.family || null, examSlug: o.examSlug || null,
      pack: 'certs/' + o.id + '.js', tier: o.tier, hidden: !!o.hidden,
      scale: { min: o.min, max: o.max, pass: o.pass, format: o.format || 'scaled' },
      domainCount: o.domains, simLab: !!o.simLab, decisionLab: !!o.decisionLab,
      decisionLabSeed: o.decisionLab ? 'features/decision-lab-seed-' + o.id + '.js' : null, diagnosticSlug: o.diagnosticSlug || o.id
    };
    return e;
  }

  var ENTRIES = [
    mk({ id: 'netplus', name: 'Network+', shortName: 'Network+', code: 'N10-009', vendor: 'CompTIA', mark: 'N+', glyph: 'N+',
         signin: 'Network+', onbName: 'Network+', onbVendor: 'CompTIA · N10-009', homeSub: 'N10-009', certLock: 'Network+',
         hostPrefix: 'networkplus', diagnosticSlug: 'network-plus', aliases: ['netplus'], tier: 'free', min: 100, max: 900, pass: 720, domains: 5, simLab: true }),
    mk({ id: 'secplus', name: 'Security+', shortName: 'Security+', code: 'SY0-701', vendor: 'CompTIA', mark: 'S+', glyph: 'S+',
         signin: 'Security+', onbName: 'Security+', onbVendor: 'CompTIA · SY0-701', homeSub: 'SY0-701', gate: 'Security+ (SY0-701)', certLock: 'Security+',
         hostPrefix: 'secplus', diagnosticSlug: 'security-plus', tier: 'pro', min: 100, max: 900, pass: 750, domains: 5, simLab: true }),
    mk({ id: 'aplus-core1', name: 'CompTIA A+ Core 1', shortName: 'A+ Core 1', code: '220-1201', vendor: 'CompTIA', mark: 'A+', glyph: 'A+',
         signin: 'CompTIA A+ Core 1', onbName: 'A+ Core 1', onbVendor: 'CompTIA · 220-1201', homeSub: '220-1201', certLock: 'A+ Core 1',
         hostPrefix: 'aplus', family: 'aplus', examSlug: 'core1', glyphSup: '1', tier: 'pro', min: 100, max: 900, pass: 675, domains: 5, simLab: true }),
    mk({ id: 'aplus-core2', name: 'CompTIA A+ Core 2', shortName: 'A+ Core 2', code: '220-1202', vendor: 'CompTIA', mark: 'A+', glyph: 'A+',
         signin: 'CompTIA A+ Core 2', onbName: 'A+ Core 2', onbVendor: 'CompTIA · 220-1202', homeSub: '220-1202', certLock: 'A+ Core 2',
         hostPrefix: 'aplus', family: 'aplus', examSlug: 'core2', glyphSup: '2', tier: 'pro', min: 100, max: 900, pass: 700, domains: 4, simLab: true }),
    mk({ id: 'az900', name: 'Microsoft Azure Fundamentals', shortName: 'Azure Fundamentals', code: 'AZ-900', vendor: 'Microsoft', mark: 'AZ', glyph: 'AZ',
         signin: 'Microsoft Azure Fundamentals', onbName: 'AZ-900', onbVendor: 'Microsoft Azure Fundamentals', homeSub: 'Azure Fundamentals', gate: 'Azure Fundamentals (AZ-900)', certLock: 'Azure AZ-900',
         hostPrefix: 'azure', diagnosticSlug: 'azure-fundamentals', tier: 'pro', min: 1, max: 1000, pass: 700, domains: 3, decisionLab: true }),
    mk({ id: 'ai900', name: 'Microsoft Azure AI Fundamentals', shortName: 'Azure AI Fundamentals', code: 'AI-901', vendor: 'Microsoft', mark: 'AI', glyph: 'AI',
         signin: 'Microsoft Azure AI Fundamentals', onbName: 'AI-901', onbVendor: 'Microsoft Azure AI Fundamentals', homeSub: 'Azure AI Fundamentals', gate: 'Azure AI Fundamentals (AI-901)', certLock: 'Azure AI-901',
         hostPrefix: 'ai', diagnosticSlug: 'azure-ai-fundamentals', tier: 'pro', min: 1, max: 1000, pass: 700, domains: 2, decisionLab: true }),
    mk({ id: 'sc900', name: 'Microsoft SC-900', shortName: 'Security Fundamentals', code: 'SC-900', vendor: 'Microsoft', mark: 'SC', glyph: 'SC',
         signin: 'Microsoft SC-900', onbName: 'SC-900', onbVendor: 'Microsoft Security Fundamentals', homeSub: 'Security Fundamentals', gate: 'Microsoft SC-900 Security, Compliance & Identity Fundamentals', certLock: 'Security SC-900',
         hostPrefix: 'sc900', tier: 'pro', min: 1, max: 1000, pass: 700, domains: 4, decisionLab: true }),
    mk({ id: 'clfc02', name: 'AWS Cloud Practitioner', shortName: 'Cloud Practitioner', code: 'CLF-C02', vendor: 'AWS', mark: 'CLF', glyph: 'AWS',
         signin: 'AWS Cloud Practitioner', onbName: 'Cloud Practitioner', onbVendor: 'AWS · CLF-C02', homeSub: 'CLF-C02', gate: 'AWS Certified Cloud Practitioner (CLF-C02)', certLock: 'AWS CLF-C02',
         hostPrefix: 'clfc02', tier: 'pro', min: 100, max: 1000, pass: 700, domains: 4, decisionLab: true }),
    // v8.205.0: the four new exams, appended after the eight (543 pins the eight's relative order). hidden:true until the
    // founder says ship; admins see them, and ?cert=<id> opens them on any host for the preview try-out.
    mk({ id: 'secai', name: 'CompTIA SecAI+', shortName: 'SecAI+', code: 'CY0-001', vendor: 'CompTIA', mark: 'SAI', glyph: 'SAI', glyphAccent: 'first',
         signin: 'CompTIA SecAI+', onbName: 'SecAI+', onbVendor: 'CompTIA · CY0-001', homeSub: 'CY0-001', gate: 'CompTIA SecAI+ (CY0-001)', certLock: 'SecAI+',
         hostPrefix: 'secai', hidden: true, tier: 'pro', min: 100, max: 900, pass: 600, domains: 4 }),
    mk({ id: 'prince2', name: 'PRINCE2 7 Foundation', shortName: 'PRINCE2 Foundation', code: 'Foundation', vendor: 'PeopleCert', mark: 'P2', glyph: 'P2',
         signin: 'PRINCE2 7 Foundation', onbName: 'PRINCE2 Foundation', onbVendor: 'PeopleCert · PRINCE2 7', homeSub: 'Foundation', certLock: 'PRINCE2 Foundation',
         hubName: 'PRINCE2 Foundation', legal: 'PRINCE2® is a registered trademark of PeopleCert. Not affiliated with or endorsed by PeopleCert.',
         hostPrefix: 'prince2', hidden: true, tier: 'pro', min: 0, max: 100, pass: 60, format: 'percent', domains: 5 }),
    mk({ id: 'psm1', name: 'Professional Scrum Master I', shortName: 'PSM I', code: 'PSM I', vendor: 'Scrum.org', mark: 'PSM', glyph: 'PSM', glyphSup: 'I',
         signin: 'Professional Scrum Master I', onbName: 'PSM I', onbVendor: 'Scrum.org · PSM I', homeSub: 'Scrum.org', certLock: 'PSM I',
         frCode: 'Professional Scrum Master I', hubName: 'PSM I', hubCode: 'Scrum.org',
         legal: 'Professional Scrum Master™ and PSM are trademarks of Scrum.org. Not affiliated with or endorsed by Scrum.org.',
         hostPrefix: 'scrum', family: 'scrum', examSlug: 'psm1', hidden: true, tier: 'pro', min: 0, max: 100, pass: 85, format: 'percent', domains: 3 }),
    mk({ id: 'psm2', name: 'Professional Scrum Master II', shortName: 'PSM II', code: 'PSM II', vendor: 'Scrum.org', mark: 'PSM', glyph: 'PSM', glyphSup: 'II',
         signin: 'Professional Scrum Master II', onbName: 'PSM II', onbVendor: 'Scrum.org · PSM II', homeSub: 'Scrum.org', certLock: 'PSM II',
         frCode: 'Professional Scrum Master II', hubName: 'PSM II', hubCode: 'Scrum.org',
         legal: 'Professional Scrum Master™ and PSM are trademarks of Scrum.org. Not affiliated with or endorsed by Scrum.org.',
         hostPrefix: 'scrum', family: 'scrum', examSlug: 'psm2', hidden: true, tier: 'pro', min: 0, max: 100, pass: 85, format: 'percent', domains: 4 })
  ];

  // Deep freeze so no consumer can mutate shared state (labels, scale, hostAliases array).
  function freeze(e) {
    Object.freeze(e.labels); Object.freeze(e.scale); Object.freeze(e.hostAliases);
    return Object.freeze(e);
  }
  ENTRIES.forEach(freeze);

  function find(id) {
    for (var i = 0; i < ENTRIES.length; i++) if (ENTRIES[i].id === id) return ENTRIES[i];
    return null;
  }

  function hostOnly(hostname) {
    if (typeof hostname !== 'string') return '';
    return hostname.toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  }

  // First label must equal the prefix/alias, or start with prefix + '-' (Vercel previews), or the whole host equals entry.host.
  // Never substring-match: 'secai' must not resolve to 'ai'. For a family, the first member wins (?exam= picks within it elsewhere).
  function byHost(hostname) {
    var h = hostOnly(hostname);
    if (!h) return null;
    var label = h.split('.')[0];
    var i, j, e, names;
    for (i = 0; i < ENTRIES.length; i++) if (ENTRIES[i].host === h) return ENTRIES[i].id;
    for (i = 0; i < ENTRIES.length; i++) {
      e = ENTRIES[i];
      names = [e.hostPrefix].concat(e.hostAliases || []);
      for (j = 0; j < names.length; j++) {
        if (names[j] && (label === names[j] || label.indexOf(names[j] + '-') === 0)) return e.id;
      }
    }
    return null;
  }

  // Query param reader (no URLSearchParams: this file also runs in bare vm contexts). Lower-cased, trimmed, '' if absent.
  function param(search, name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(typeof search === 'string' ? search : '');
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')).replace(/^\s+|\s+$/g, '').toLowerCase(); } catch (e) { return ''; }
  }

  // The one cert resolver: head IIFE, detectCert and getActiveCertId all call it, so they cannot drift (v7.2.2).
  // { hostname, search, override } -> a known id, never null. Priority:
  //   1. ?cert=<known id>
  //   2. family host: ?exam=<member examSlug>, then the override if it is a member, then the first member
  //   3. any other host byHost matches: that host's cert (the host beats the override, v7.2.1/7.2.2)
  //   4. unmatched host (localhost, unknown): the override if known
  //   5. 'netplus'
  function resolve(o) {
    o = o || {};
    var cq = param(o.search, 'cert');
    if (find(cq)) return cq;
    var host = byHost(o.hostname), dev = typeof o.override === 'string' ? o.override : '';
    if (host) {
      var fam = find(host).family;
      if (!fam) return host;
      var members = api.familyMembers(fam), ex = param(o.search, 'exam');
      if (ex) for (var i = 0; i < members.length; i++) if (find(members[i]).examSlug === ex) return members[i];
      return members.indexOf(dev) !== -1 ? dev : host;
    }
    return find(dev) ? dev : 'netplus';
  }

  function copyScale(s) { return { min: s.min, max: s.max, pass: s.pass, format: s.format }; }

  var api = {
    all: function () { return ENTRIES.slice(); },
    get: function (id) { return find(id); },
    isKnown: function (id) { return find(id) !== null; },
    byHost: byHost,
    resolve: resolve,
    hostFor: function (id) { var e = find(id); return e ? e.host : ''; },
    listed: function (isAdmin) {
      return ENTRIES.filter(function (e) { return isAdmin || !e.hidden; });
    },
    // The certs this viewer may see: admin (window._certanvilIsAdmin, set by auth-state.js from profile.role) also gets hidden ones.
    // Before the profile loads the flag is unset, so hidden certs stay hidden. Every list surface calls this, never listed() directly.
    visible: function () { return api.listed(!!(root && root._certanvilIsAdmin)); },
    // Group entries by vendor, vendors in first-appearance order; inside a group single exams come before family pairs
    // (A+ Core 1/2, PSM I/II), so pairs sit together. -> [{ vendor, entries }]. The first-run picker shows one heading per group.
    vendorGroups: function (entries) {
      var groups = [], at = {};
      (entries || []).forEach(function (e) {
        var v = e.vendor || '';
        if (!Object.prototype.hasOwnProperty.call(at, v)) { at[v] = groups.length; groups.push({ vendor: v, entries: [] }); }
        groups[at[v]].entries.push(e);
      });
      groups.forEach(function (g) { g.entries = g.entries.filter(function (e) { return !e.family; }).concat(g.entries.filter(function (e) { return e.family; })); });
      return groups;
    },
    familyOf: function (id) { var e = find(id); return e ? e.family : null; },
    familyMembers: function (family) {
      return ENTRIES.filter(function (e) { return e.family && e.family === family; }).map(function (e) { return e.id; });
    },
    scale: function (id) { var e = find(id); return e ? copyScale(e.scale) : null; },
    // The scale every score reader uses: the registry's own when the cert is known, else the pack meta, else CompTIA 100-900.
    // Never throws and never returns a partial scale, so a reader can use .min/.max/.pass without checks.
    examScale: function (id, meta) {
      var s = api.scale(id);
      if (s) return s;
      meta = meta || {};
      var n = function (v, d) { return typeof v === 'number' && v === v ? v : d; };
      return { min: n(meta.examMinScore, 100), max: n(meta.examMaxScore, 900), pass: n(meta.examPassScore, 720), format: 'scaled' };
    },
    formatScore: function (id, n) {
      var e = find(id);
      if (n === null || n === undefined || typeof n !== 'number' || n !== n) return '--';
      if (e && e.scale.format === 'percent') return Math.round(n) + '%';
      return String(Math.round(n));
    },
    // _add is for tests only: UAT injects fake entries (e.g. a hidden cert) through it. App code must never call it.
    _add: function (entry) {
      var e = {
        id: entry.id, name: entry.name || entry.id, shortName: entry.shortName || entry.name || entry.id,
        code: entry.code || '', vendor: entry.vendor || '', mark: entry.mark || '', glyph: entry.glyph || '',
        glyphAccent: entry.glyphAccent || 'last', glyphSup: entry.glyphSup || '', legal: entry.legal || '',
        labels: entry.labels || {}, hostPrefix: entry.hostPrefix || entry.id,
        host: entry.host || ((entry.hostPrefix || entry.id) + DOMAIN), hostAliases: entry.hostAliases || [],
        family: entry.family || null, examSlug: entry.examSlug || null, pack: entry.pack || ('certs/' + entry.id + '.js'),
        tier: entry.tier || 'pro', hidden: !!entry.hidden,
        scale: entry.scale || { min: 100, max: 900, pass: 700, format: 'scaled' },
        domainCount: entry.domainCount || 0, simLab: !!entry.simLab, decisionLab: !!entry.decisionLab,
        decisionLabSeed: entry.decisionLabSeed || null, diagnosticSlug: entry.diagnosticSlug || entry.id
      };
      freeze(e);
      ENTRIES.push(e);
      return e;
    }
  };

  root.CertRegistry = api;
})(typeof window !== 'undefined' ? window : this);
