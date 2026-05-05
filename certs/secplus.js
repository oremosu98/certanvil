// ══════════════════════════════════════════════════════════════════════════
// CompTIA Security+ SY0-701 cert pack (v4.87.0 — content authoring)
// ══════════════════════════════════════════════════════════════════════════
// Loaded into window.CERT_PACKS.secplus at app boot. Active when:
//   1. localStorage 'nplus_dev_cert' === 'secplus' (dev override), OR
//   2. URL host starts with 'secplus-' (production deploy via Vercel)
// Otherwise inert (loaded but not used; Network+ stays default).
//
// Status (v4.87.0):
//   ✓ Cert metadata (name, code, exam pass mark 750)
//   ✓ Domain weights (CompTIA SY0-701 blueprint)
//   ✓ Domain labels (5 domains)
//   ✓ Topic catalog (32 topics across 5 domains)
//   ✓ Topic resources (Professor Messer SY0-701 URLs + objective numbers)
//   ☐ retentionGapConcepts (Phase 3 cycles after first practice test)
//   ☐ GT tables (Phase 2B audit — most Network+ ports + OSI transfer)
//   ☐ questionExemplars (Phase 2B audit + carry-over of ~60-100 cross-cert
//     Network+ exemplars with topics retagged + new authoring)
//
// AUDIENCE: builder only. User's private study tool through SY0-701 exam
// on 2026-07-29. Customers stay on Network+ deploy. Access control is URL
// obscurity (no Vercel Pro, no in-app password) per cert_saas_pivot_plan.md.
//
// LEGAL: every entry below originates from the public SY0-701 blueprint or
// publicly-known technical facts. Zero ingestion of paid-bank content
// (Jason Dion / CertMaster / Mike Myers / Kaplan) — same discipline that
// built the Network+ pack to a 767/900 pass.

window.CERT_PACKS = window.CERT_PACKS || {};
window.CERT_PACKS.secplus = {
  meta: {
    id: 'secplus',
    name: 'CompTIA Security+',
    code: 'SY0-701',
    blueprintUrl: 'https://www.comptia.org/certifications/security',
    examPassScore: 750,        // Security+ scaled-score pass threshold (CompTIA official)
    examMaxScore: 900,         // scaled-score ceiling
    examQuestionCount: 90,     // full exam length (same as Network+)
    examTimeSeconds: 5400,     // 90-minute timer
  },

  // Empty — populated by Phase 3 cycles after first SY0-701 practice test.
  retentionGapConcepts: [],

  // ── DOMAIN WEIGHTS (CompTIA SY0-701 blueprint) ────────────────────────
  // Sums to 1.00. Sourced from current public SY0-701 blueprint.
  domainWeights: {
    concepts:     0.12, // Domain 1.0 — General Security Concepts
    threats:      0.22, // Domain 2.0 — Threats, Vulnerabilities & Mitigations
    architecture: 0.18, // Domain 3.0 — Security Architecture
    operations:   0.28, // Domain 4.0 — Security Operations (largest)
    governance:   0.20  // Domain 5.0 — Program Management & Oversight
  },

  domainLabels: {
    concepts:     'General Security Concepts',
    threats:      'Threats, Vulnerabilities & Mitigations',
    architecture: 'Security Architecture',
    operations:   'Security Operations',
    governance:   'Program Management & Oversight'
  },

  // ── TOPIC → DOMAIN MAP (32 topics across 5 SY0-701 domains) ───────────
  // Drives weak-spot routing, exemplar bank picker, lottery, readiness
  // domain attribution. Topic name = primary key everywhere; domain key
  // is one of: concepts / threats / architecture / operations / governance.
  topicDomains: {
    // Domain 1.0 — General Security Concepts (12%)
    'Security Controls':                'concepts', // 1.1 — categories + types
    'CIA Triad & AAA':                  'concepts', // 1.2 — core principles
    'Change Management':                'concepts', // 1.3 — security-relevant change processes
    'Cryptography Fundamentals':        'concepts', // 1.4 — symmetric, asymmetric, hashing
    'PKI & Certificate Management':     'concepts', // 1.4 — public-key infrastructure

    // Domain 2.0 — Threats, Vulnerabilities & Mitigations (22%)
    'Threat Actors & Motivations':      'threats',  // 2.1 — nation-state, organized crime, hacktivist, insider, etc.
    'Attack Vectors & Surfaces':        'threats',  // 2.2 — message-based, image-based, file-based, voice
    'Application Vulnerabilities':      'threats',  // 2.3 — buffer overflow, race condition, XSS, SQLi
    'OS & Hardware Vulnerabilities':    'threats',  // 2.3 — firmware, EOL, legacy, virtualization escapes
    'Web & Cryptographic Attacks':      'threats',  // 2.4 — collision, downgrade, replay, on-path
    'Network Attacks':                  'threats',  // 2.4 — DDoS, DNS attacks, wireless, on-path
    'Malicious Activity Indicators':    'threats',  // 2.4 — IoCs, behavioral patterns
    'Mitigation Techniques':            'threats',  // 2.5 — segmentation, hardening, patching, ACLs
    'Social Engineering':               'threats',  // 2.2 — phishing, vishing, pretexting, BEC
    'Malware Types':                    'threats',  // 2.4 — ransomware, trojan, worm, rootkit, fileless

    // Domain 3.0 — Security Architecture (18%)
    'Architecture Models':              'architecture', // 3.1 — cloud, IaC, serverless, microservices, IoT, ICS/SCADA
    'Network Security Architecture':    'architecture', // 3.2 — segmentation, zero trust, SASE, IPS/IDS placement
    'Data Protection':                  'architecture', // 3.3 — classification, encryption, DLP, masking, tokenization
    'Resilience & Recovery':            'architecture', // 3.4 — HA, redundancy, backups, restore-testing, sites
    'Cloud Security & Shared Responsibility': 'architecture', // 3.1+3.2 — IaaS/PaaS/SaaS boundaries
    'Zero Trust & SDN':                 'architecture', // 3.2 — adaptive identity, threat scope reduction, policy engines

    // Domain 4.0 — Security Operations (28% — largest domain)
    'Endpoint & Server Hardening':      'operations',   // 4.1 — baselines, EDR, host firewalls, application allowlisting
    'Asset Management':                 'operations',   // 4.2 — acquisition, monitoring, decommissioning, sanitization
    'Vulnerability Management':         'operations',   // 4.3 — scanning, validation, prioritization, response
    'Security Monitoring & SIEM':       'operations',   // 4.4 — logs, alerts, correlation, SCAP, NetFlow
    'Email & Web Security':             'operations',   // 4.5 — DKIM, SPF, DMARC, gateways, sandboxing
    'Identity & Access Management':     'operations',   // 4.6 — provisioning, MFA, password mgmt, attestation
    'Authentication Methods (MFA/SSO)': 'operations',   // 4.6 — federation, SAML, OAuth, OIDC, biometrics
    'Automation & SOAR':                'operations',   // 4.7 — playbooks, scripts, ticketing, orchestration
    'Incident Response':                'operations',   // 4.8 — preparation, identification, containment, eradication, recovery, lessons
    'Forensics & Investigations':       'operations',   // 4.9 — log sources, chain of custody, packet captures, dashboards

    // Domain 5.0 — Program Management & Oversight (20%)
    'Security Governance':              'governance',  // 5.1 — policies, standards, procedures, GRC roles
    'Risk Management':                  'governance',  // 5.2 — register, appetite, tolerance, qualitative/quantitative analysis, treatment
    'Third-Party Risk Management':      'governance',  // 5.3 — vendor assessment, SLA, SLE, MOA, BPA
    'Compliance Frameworks':            'governance',  // 5.4 — PCI-DSS, HIPAA, GDPR, SOX, FERPA + privacy regs
    'Security Awareness & Training':    'governance',  // 5.5 — phishing simulation, anomalous behaviour, reporting
    'Audits & Assessments':             'governance'   // 5.4 — internal/external audits, attestation, pentesting categories
  },

  // ── TOPIC RESOURCES (Professor Messer YouTube search URLs + SY0-701 objectives) ──
  // Search format: 'professor+messer+SY0-701+<topic-keywords>' — opens YouTube
  // search results, first hit is usually the relevant Messer video.
  topicResources: {
    // Domain 1.0
    'Security Controls':                { obj: '1.1', title: 'Security Control Categories', search: 'professor+messer+SY0-701+security+control+categories' },
    'CIA Triad & AAA':                  { obj: '1.2', title: 'CIA + AAA + Non-repudiation', search: 'professor+messer+SY0-701+CIA+AAA' },
    'Change Management':                { obj: '1.3', title: 'Change Management', search: 'professor+messer+SY0-701+change+management' },
    'Cryptography Fundamentals':        { obj: '1.4', title: 'Cryptography Fundamentals', search: 'professor+messer+SY0-701+cryptography+symmetric+asymmetric' },
    'PKI & Certificate Management':     { obj: '1.4', title: 'PKI & Certificates', search: 'professor+messer+SY0-701+PKI+certificate' },

    // Domain 2.0
    'Threat Actors & Motivations':      { obj: '2.1', title: 'Threat Actors', search: 'professor+messer+SY0-701+threat+actors+motivations' },
    'Attack Vectors & Surfaces':        { obj: '2.2', title: 'Attack Vectors', search: 'professor+messer+SY0-701+attack+vectors+surfaces' },
    'Application Vulnerabilities':      { obj: '2.3', title: 'Application Vulnerabilities', search: 'professor+messer+SY0-701+application+vulnerabilities+buffer+overflow' },
    'OS & Hardware Vulnerabilities':    { obj: '2.3', title: 'OS & Hardware Vulnerabilities', search: 'professor+messer+SY0-701+operating+system+hardware+vulnerabilities' },
    'Web & Cryptographic Attacks':      { obj: '2.4', title: 'Web & Crypto Attacks', search: 'professor+messer+SY0-701+cryptographic+attacks' },
    'Network Attacks':                  { obj: '2.4', title: 'Network Attacks', search: 'professor+messer+SY0-701+network+attacks+DDoS' },
    'Malicious Activity Indicators':    { obj: '2.4', title: 'Indicators of Malicious Activity', search: 'professor+messer+SY0-701+indicators+malicious+activity' },
    'Mitigation Techniques':            { obj: '2.5', title: 'Mitigation Techniques', search: 'professor+messer+SY0-701+mitigation+techniques+segmentation+hardening' },
    'Social Engineering':               { obj: '2.2', title: 'Social Engineering', search: 'professor+messer+SY0-701+social+engineering+phishing' },
    'Malware Types':                    { obj: '2.4', title: 'Malware Types', search: 'professor+messer+SY0-701+malware+ransomware+trojan' },

    // Domain 3.0
    'Architecture Models':              { obj: '3.1', title: 'Architecture Models', search: 'professor+messer+SY0-701+architecture+cloud+IoT+ICS' },
    'Network Security Architecture':    { obj: '3.2', title: 'Network Security Architecture', search: 'professor+messer+SY0-701+network+security+architecture+segmentation' },
    'Data Protection':                  { obj: '3.3', title: 'Data Protection', search: 'professor+messer+SY0-701+data+protection+classification+encryption+DLP' },
    'Resilience & Recovery':            { obj: '3.4', title: 'Resilience & Recovery', search: 'professor+messer+SY0-701+resilience+recovery+backup+HA' },
    'Cloud Security & Shared Responsibility': { obj: '3.1', title: 'Cloud Security', search: 'professor+messer+SY0-701+cloud+security+shared+responsibility' },
    'Zero Trust & SDN':                 { obj: '3.2', title: 'Zero Trust & SDN', search: 'professor+messer+SY0-701+zero+trust+SDN' },

    // Domain 4.0
    'Endpoint & Server Hardening':      { obj: '4.1', title: 'Endpoint & Server Security', search: 'professor+messer+SY0-701+endpoint+EDR+hardening' },
    'Asset Management':                 { obj: '4.2', title: 'Asset Management', search: 'professor+messer+SY0-701+asset+management+sanitization' },
    'Vulnerability Management':         { obj: '4.3', title: 'Vulnerability Management', search: 'professor+messer+SY0-701+vulnerability+management+scanning' },
    'Security Monitoring & SIEM':       { obj: '4.4', title: 'Security Monitoring & SIEM', search: 'professor+messer+SY0-701+SIEM+monitoring+alerting' },
    'Email & Web Security':             { obj: '4.5', title: 'Email & Web Security', search: 'professor+messer+SY0-701+email+security+DKIM+SPF+DMARC' },
    'Identity & Access Management':     { obj: '4.6', title: 'Identity & Access Mgmt', search: 'professor+messer+SY0-701+identity+access+management+IAM' },
    'Authentication Methods (MFA/SSO)': { obj: '4.6', title: 'Authentication Methods', search: 'professor+messer+SY0-701+authentication+MFA+SSO+SAML+OAuth' },
    'Automation & SOAR':                { obj: '4.7', title: 'Automation & SOAR', search: 'professor+messer+SY0-701+automation+orchestration+SOAR' },
    'Incident Response':                { obj: '4.8', title: 'Incident Response', search: 'professor+messer+SY0-701+incident+response' },
    'Forensics & Investigations':       { obj: '4.9', title: 'Forensics & Investigations', search: 'professor+messer+SY0-701+forensics+investigation' },

    // Domain 5.0
    'Security Governance':              { obj: '5.1', title: 'Security Governance', search: 'professor+messer+SY0-701+security+governance+policies' },
    'Risk Management':                  { obj: '5.2', title: 'Risk Management', search: 'professor+messer+SY0-701+risk+management+register+treatment' },
    'Third-Party Risk Management':      { obj: '5.3', title: 'Third-Party Risk', search: 'professor+messer+SY0-701+third+party+risk+vendor' },
    'Compliance Frameworks':            { obj: '5.4', title: 'Compliance Frameworks', search: 'professor+messer+SY0-701+compliance+PCI+HIPAA+GDPR' },
    'Security Awareness & Training':    { obj: '5.5', title: 'Security Awareness', search: 'professor+messer+SY0-701+security+awareness+training' },
    'Audits & Assessments':             { obj: '5.4', title: 'Audits & Assessments', search: 'professor+messer+SY0-701+audits+assessments+pentest' }
  },

  // ── GROUND TRUTH TABLES ───────────────────────────────────────────────
  // Empty for now — Phase 2B audits which Network+ ground truths transfer
  // (most ports + OSI assignments + ethernet facts do; wifi facts likely
  // transfer too since wireless security is testable on both certs).
  gt: {
    ports: {},
    osi: {},
    wifiBroken: [],
    wifiDeprecated: [],
    ethernet: {}
  },

  // ── EXEMPLAR BANK (Phase 2B will populate) ────────────────────────────
  // Phase 2B audits the 320 Network+ exemplars and ports the ~60-100 that
  // genuinely transfer to Security+ (with topics retagged for SY0-701).
  // Then authors net-new Security+ exemplars to reach ~200 baseline over
  // 2-3 weekend Phase 2 sessions. Empty array = exemplar injection is a
  // no-op; Haiku falls back to blueprint + prompt quality alone.
  questionExemplars: []
};
