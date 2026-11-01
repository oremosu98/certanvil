// ══════════════════════════════════════════════════════════════════════════
// CertAnvil — the four new exams on the marketing/account site (SecAI+, PRINCE2 7 Foundation, PSM I, PSM II)
// ══════════════════════════════════════════════════════════════════════════
// ONE reveal switch for every public landing surface: NEW_CERTS_REVEALED below.
//   false (today) → every list that consumes this file gets nothing from it, so the exams are invisible on the site.
//   true          → the wall tiles, My-certs rows, account tiles, exam formats, analytics catalog, domain weights,
//                   overlap rows and the trademark footnote all appear.
// The ship step flips this one line, together with `hidden: true` on the four entries in lib/cert-registry.js
// (tests/uat/546 fails if the two disagree). The admin cert table always lists them (as Hidden until the flip).
//
// Every list reads this file through a helper and merges the result AFTER its own literal list, so tests/uat/546
// can keep checking the literals against the registry. Scores mirror the registry (secai 600/900 scaled,
// prince2 60% and psm1/psm2 85% percent). Domains and weights come from each cert's pack under certs/.
// Loaded as a plain script before auth.js on every page that uses these lists. Never touches localStorage.
(function () {
  'use strict';
  var NEW_CERTS_REVEALED = false;

  var LEGAL_PRINCE2 = 'PRINCE2® is a registered trademark of PeopleCert. Not affiliated with or endorsed by PeopleCert.';
  var LEGAL_SCRUM = 'Professional Scrum Master™ and PSM are trademarks of Scrum.org. Not affiliated with or endorsed by Scrum.org.';

  var NEW_CERTS = [
    { id: 'secai', name: 'CompTIA SecAI+', code: 'CY0-001', vendor: 'CompTIA', glyph: 'SAI', glyphClass: 'secai',
      href: 'https://secai.certanvil.com/', format: 'scaled', maxScore: 900, passScore: 600, examName: 'CompTIA SecAI+ CY0-001',
      coach: 'Securing and using AI. Builds on Security+ fundamentals.', est: false,
      host: 'secai.certanvil.com',
      // Wall plate: the official CompTIA weights (17 / 40 / 24 / 19). Mark: the S is the bronze letter.
      mark: { m: '', a: 'S', z: 'AI', three: true },
      sub: 'CY0-001  ·  4 domains  ·  blueprint-weighted',
      domains: [['Basic AI concepts', 17], ['Securing AI systems', 40], ['AI-assisted security', 24], ['AI governance & compliance', 19]],
      weights: { 'Basic AI concepts related to cybersecurity': 17, 'Securing AI systems': 40, 'AI-assisted security': 24, 'AI governance, risk and compliance': 19 },
      bank: 'Pro · launching' },
    { id: 'prince2', name: 'PRINCE2 7 Foundation', code: 'Foundation', vendor: 'PeopleCert', glyph: 'P2', glyphClass: 'prince2',
      href: 'https://prince2.certanvil.com/', format: 'percent', maxScore: 100, passScore: 60, examName: 'PRINCE2 7 Foundation',
      coach: 'Project management foundation: the PRINCE2 7 principles, practices and processes.', est: true,
      host: 'prince2.certanvil.com', legal: LEGAL_PRINCE2,
      mark: { m: 'P', a: '2' },
      sub: 'Foundation  ·  5 areas  ·  weights estimated',
      domains: [['Practices', 60], ['Processes', 15], ['People', 13], ['Principles', 8], ['Core concepts', 4]],
      weights: { 'Practices': 60, 'Processes': 15, 'People': 13, 'Principles': 8, 'Core concepts': 4 },
      bank: 'Pro · launching' },
    { id: 'psm1', name: 'Professional Scrum Master I', code: 'PSM I', vendor: 'Scrum.org', glyph: 'PSM', glyphClass: 'psm1',
      href: 'https://scrum.certanvil.com/', format: 'percent', maxScore: 100, passScore: 85, examName: 'Professional Scrum Master I (PSM I)',
      coach: 'Scrum.org entry assessment: the Scrum Guide, accountabilities and events.', est: true,
      host: 'scrum.certanvil.com', legal: LEGAL_SCRUM,
      // ONE Scrum plate for both exams (founder): it shows PSM I's domains and opens PSM I; PSM II is the in-app switch.
      wall: { name: 'Professional Scrum Master', code: 'PSM I · II', mark: { m: 'PS', a: 'M', three: true },
              sub: 'PSM I and II  ·  3 domains  ·  weights estimated', covers: ['psm1', 'psm2'] },
      mark: { m: 'PS', a: 'M', three: true },
      domains: [['Scrum framework', 60], ['People and teams', 20], ['Product', 20]],
      weights: { 'Scrum Framework (theory, values, events, artifacts, commitments)': 60, 'People and Teams (Developers, Scrum Master, self-management)': 20, 'Product (Product Owner, backlog, value, stakeholders)': 20 },
      bank: 'Pro · launching' },
    { id: 'psm2', name: 'Professional Scrum Master II', code: 'PSM II', vendor: 'Scrum.org', glyph: 'PSM', glyphClass: 'psm2',
      href: 'https://scrum.certanvil.com/?exam=psm2', format: 'percent', maxScore: 100, passScore: 85, examName: 'Professional Scrum Master II (PSM II)',
      coach: 'Advanced Scrum: coaching, Evidence-Based Management and scaling with Nexus.', est: true,
      host: 'scrum.certanvil.com', legal: LEGAL_SCRUM,
      weights: { 'Scrum Framework in depth (events, artifacts, accountabilities)': 30, 'Coaching, facilitation and servant leadership': 35, 'Product value and Evidence-Based Management': 20, 'Definition of Done, technical excellence and scaling with Nexus': 15 },
      bank: 'Pro · launching' }
  ];

  // Overlap rows (optional per cert): SecAI+ is strong with Security+ and light with AI-901; PSM I to PSM II is strong.
  // PRINCE2 and Scrum have no real overlap with the existing certs, so there are no rows for them beyond PSM I/II.
  var NEW_OVERLAP = [
    { from: 'secplus', to: 'secai', pct: 45, sharedCount: 5, totalTargetCount: 11,
      headline: 'Security+ is a strong base for SecAI+',
      sharedTopics: ['CIA triad and risk basics', 'Threats and attack types', 'Access control and least privilege', 'Logging and monitoring', 'Governance, risk and compliance'],
      refresherTopics: ['Threat modelling is applied to models and data pipelines'],
      newTopics: ['How LLMs and machine learning work', 'Prompt injection and model attacks', 'Guardrails, RAG and fine-tuning', 'AI-assisted detection and response', 'AI governance frameworks'],
      hoursSaved: 20, daysSaved: 4,
      callout: 'Security+ covers the security half of SecAI+. The AI half (how models work and how they are attacked) is new study.' },
    { from: 'ai900', to: 'secai', pct: 25, sharedCount: 3, totalTargetCount: 12,
      headline: 'Light feed from AI-901 into SecAI+',
      sharedTopics: ['Generative AI and LLM basics', 'Responsible AI principles', 'Prompting and grounding (RAG)'],
      refresherTopics: ['Responsible AI becomes governance, risk and compliance'],
      newTopics: ['Securing AI systems and data', 'AI-specific attacks and defences', 'AI-assisted security operations'],
      hoursSaved: 10, daysSaved: 2,
      callout: 'AI-901 gives you the vocabulary. SecAI+ is mostly about securing and attacking those systems, which is new.' },
    { from: 'psm1', to: 'psm2', pct: 70, sharedCount: 7, totalTargetCount: 10,
      headline: 'PSM I is the base for PSM II',
      sharedTopics: ['Scrum theory and values', 'Scrum events', 'Scrum artifacts and commitments', 'Accountabilities', 'Self-management', 'Definition of Done', 'Product Backlog management'],
      refresherTopics: ['The events and artifacts come back in far more depth, with tricky scenarios'],
      newTopics: ['Coaching and facilitation stances', 'Evidence-Based Management', 'Scaling with Nexus'],
      hoursSaved: 30, daysSaved: 6,
      callout: 'PSM II assumes PSM I knowledge. Expect the same topics, asked as hard scenario questions, plus coaching and EBM.' }
  ];

  function copy(a) { return JSON.parse(JSON.stringify(a)); }
  // Public helpers. Empty until revealed, so every list that merges them stays unchanged today.
  window.CERTANVIL_NEW_CERTS_REVEALED = NEW_CERTS_REVEALED;
  window.certanvilNewCerts = function () { return NEW_CERTS_REVEALED ? copy(NEW_CERTS) : []; };
  window.certanvilNewOverlap = function () { return NEW_CERTS_REVEALED ? copy(NEW_OVERLAP) : []; };
  // Admin-only view: always the full set, with `hidden` telling the admin table which label to show.
  window.certanvilNewCertsAdmin = function () { return copy(NEW_CERTS).map(function (c) { c.hidden = !NEW_CERTS_REVEALED; return c; }); };
})();
