// ══════════════════════════════════════════════════════════════════════════
// CompTIA A+ Core 2 (220-1202) cert pack (v7.6.0 — fifth cert family, dual-exam)
// ══════════════════════════════════════════════════════════════════════════
// Loaded into window.CERT_PACKS['aplus-core2'] at app boot. Active when:
//   1. localStorage 'nplus_dev_cert' === 'aplus-core2' — set by the in-app
//      cert switcher when a user on aplus.certanvil.com switches from Core 1 to
//      Core 2. A+ is ONE certification with TWO exams that SHARE the aplus.
//      subdomain; Core 1 is the cold-entry default, Core 2 is reached via the
//      within-subdomain switcher (tadSwitchCert writes localStorage + reloads —
//      the FIRST cert switch that does NOT change subdomain).
//   2. URL query '?cert=aplus-core2' or '?exam=core2' (entry-point handoff,
//      e.g. the landing Core 2 cert tile links to aplus.certanvil.com/?exam=core2).
//   3. URL host 'aplus.' with the localStorage override resolving to core2.
// Otherwise inert (loaded only when index.html inline IIFE document.writes
// <script src="certs/aplus-core2.js"> after Pattern A + override resolve it).
//
// Status (v7.6.0):
//   ✓ Cert metadata — 80 Q / 90 min / 700 pass / 900 max. Official CompTIA
//     220-1202 v4.0 Exam Objectives (page 3) + VoC §7. NOTE: Core 2 passing
//     score is 700, DIFFERENT from Core 1's 675 — a deliberate per-exam value.
//   ✓ Domain weights — OFFICIAL 220-1202 v4.0 blueprint (page 3): Operating
//     Systems 28% / Security 28% / Software Troubleshooting 23% / Operational
//     Procedures 21%. Sums to 1.00. (NOTE: supersedes the plan §2 #6 estimate
//     of 28/28/22/22 — the public PDF swaps 1pp between domains 3 and 4; the
//     §10 legal boundary makes the PDF the sole authoritative source.)
//   ✓ Domain labels (4 domains — FEWER than Core 1's 5 / Net+/Sec+'s 5).
//     Render-LOGIC must hide domain-idx 5 for a 4-domain cert (dg-system.css
//     html[data-cert="aplus-core2"] rule, Stage 3f).
//   ✓ Topic catalog (46 topics across 4 domains).
//   ✓ Topic resources (Professor Messer free 220-1202 search strings + obj #s).
//   ✓ retentionGapConcepts (8 seed entries from the public 220-1202 Exam
//     Objectives PDF + VoC direction; open-ended, additive via Phase 3 cycles).
//   ☐ GT tables — deferred (no clear enumerable-fact surface for Core 2 yet).
//   ☐ questionExemplars — populated in Stage 6 (200 hand-curated exemplars).
//
// AUDIENCE (v7.6.0 Pattern A): public Pro-tier surface on
// https://aplus.certanvil.com (reached via the cert switcher → Core 2). Visible
// to all signed-in users in the cert switcher with a "PRO" badge; switching
// INTO aplus-core2 requires Pro tier via tadSwitchCert's
// _gateProOnly('CompTIA A+ Core 2') call. Anon visitors on the landing
// diagnostic at certanvil.com/diagnostic/aplus-core2/ funnel into the Pro modal.
//
// LEGAL (non-negotiable, locked in plan §10): every entry below originates from
// the PUBLIC CompTIA A+ 220-1202 v4.0 Exam Objectives PDF ONLY, with the
// founder's VoC research as a DIRECTION-FINDER (which topics get more exemplars)
// — never a content source. ZERO ingestion of paid-bank content: Jason Dion,
// Mike Meyers, Pearson Exam Cram, CompTIA CertMaster Learn/Practice,
// Skillcertpro, BurningIceTech Patreon, Crucial Exams, MeasureUp, Whizlabs,
// TutorialDojo, CertEmpire, paid Pluralsight, paid LinkedIn Learning, O'Reilly,
// Udemy, or ExamTopics dumps. The Jason Dion Method applies for any future paid
// A+ practice test: share gap topics in OWN WORDS only → Claude authors new
// exemplars per gap → original content informed by gap, never reproductions.

window.CERT_PACKS = window.CERT_PACKS || {};
window.CERT_PACKS['aplus-core2'] = {
  meta: {
    id: 'aplus-core2',
    name: 'CompTIA A+ Core 2',
    code: '220-1202',
    blueprintUrl: 'https://www.comptia.org/certifications/a',
    examPassScore: 700,         // Official 220-1202: 700 on a 100-900 scale (NOT 675 like Core 1). PDF p3.
    examMaxScore: 900,          // scaled-score ceiling
    examQuestionCount: 80,      // Official cap "max 90"; VoC §7 modal 77-80.
    examTimeSeconds: 5400,      // 90-minute timer (PDF "Length of test: 90 minutes").
  },

  // ── PRIORITY RETENTION CONCEPTS (v7.6.0 seed, 8 entries, additive forever) ─
  // Eight concepts seeded from the public CompTIA A+ 220-1202 v4.0 Exam
  // Objectives + VoC research (199 threads, 374 entries). Injected as a soft
  // tiebreaker into every question-generation prompt. Open-ended; founder
  // appends new concepts via Phase 3 cycles after each practice-test gap.
  retentionGapConcepts: [
    { label: 'Social Engineering Family — distinct distinctions', parentTopic: 'Social Engineering Attacks', objective: '2.5', keyword: 'Core 2 VoC #7 + the official 2.5 objective: distinguishing the social-engineering family is dominantly tested. PHISHING = mass fraudulent email luring credentials/clicks. SPEAR PHISHING = phishing TARGETED at a specific person/org (personalized). WHALING = spear phishing aimed at a HIGH-VALUE target (CEO/CFO — "the big fish"). VISHING = voice/phone phishing. SMISHING = SMS/text phishing. QR CODE PHISHING (quishing) = malicious QR code redirecting to a credential-harvest site. PRETEXTING = inventing a fabricated scenario/identity to gain trust. SHOULDER SURFING = observing screens/keypads over the shoulder. TAILGATING = following an authorized person through a secure door WITHOUT their knowledge. PIGGYBACKING = same as tailgating but WITH the authorized person consent/awareness. DUMPSTER DIVING = retrieving sensitive info from discarded trash. IMPERSONATION = pretending to be someone with authority. Memorize the DISCRIMINATOR for each (target vs medium vs consent): whaling = the target is an exec; vishing = voice; smishing = SMS; tailgating = no consent; piggybacking = with consent.' },
    { label: 'SOHO Malware Removal — the official 10-step ordered procedure (220-1202)', parentTopic: 'SOHO Malware Removal Procedure', objective: '2.6', keyword: 'The 220-1202 objective 2.6 expands the legacy 7-step into a 10-step ORDERED procedure. Order is the answer. 1) Investigate AND VERIFY malware symptoms. 2) QUARANTINE the infected system (pull from network). 3) DISABLE System Restore (in Windows Home — so the infection is not preserved in a restore point). 4) REMEDIATE the infected system. 5) UPDATE anti-malware software (definitions). 6) SCAN and use removal techniques (safe mode, preinstallation environment). 7) REIMAGE/REINSTALL if remediation fails. 8) SCHEDULE scans and run updates. 9) ENABLE System Restore and create a fresh restore point (Windows Home). 10) EDUCATE the end user. Critical sequencing traps: QUARANTINE before remediate; DISABLE System Restore BEFORE cleaning (step 3) and ENABLE it again only AFTER cleaning (step 9); educate the user LAST. The exam asks "what is the NEXT step" given a position in this list.' },
    { label: 'Windows Editions Feature Matrix (Home vs Pro vs Pro for Workstations vs Enterprise)', parentTopic: 'Windows Editions Features', objective: '1.3', keyword: 'Core 2 VoC #9 + objective 1.3: which features are available per edition. HOME = consumer; NO BitLocker, NO Group Policy Editor (gpedit.msc), NO Remote Desktop HOST (can be a client only), NO domain join (workgroup only), lower RAM cap. PRO = adds BitLocker, gpedit.msc (Group Policy), RDP HOST, domain join, Hyper-V. PRO FOR WORKSTATIONS = adds ReFS, higher RAM/CPU socket support, persistent memory, SMB Direct. ENTERPRISE = volume-licensed; adds AppLocker, DirectAccess, BranchCache, the most management features. EDUCATION = Enterprise feature set for academic licensing. Memorize the HOME exclusions (the most-tested split): no BitLocker, no Group Policy, no RDP host, no domain join. Scenario test: "user needs to join the corporate domain and enable BitLocker" so the minimum edition is PRO (Home cannot).' },
    { label: 'Multi-Path Tool Access — reaching a Windows tool 5+ ways', parentTopic: 'Multi-Path Tool Access', objective: '1.4', keyword: 'Core 2 VoC §2 S2 = the HIGHEST-IMPACT surprise: "access a tool 5 different ways with different permissions." A single management tool is reachable through multiple paths: (1) Run dialog / mmc snap-in by filename (diskmgmt.msc for Disk Management, eventvwr.msc for Event Viewer, services.msc for Services, taskschd.msc for Task Scheduler, devmgmt.msc for Device Manager, lusrmgr.msc for Local Users & Groups, gpedit.msc for Group Policy, certmgr.msc for Certificate Manager, perfmon.msc for Performance Monitor); (2) Control Panel; (3) Settings app; (4) right-click Start (the power-user / WinX menu) or right-click "This PC" then Manage (Computer Management mmc); (5) Command line (taskmgr, control). Permissions can differ by path: some actions require "Run as administrator" / elevation (UAC). Memorize the .msc filenames AND that elevation may be needed depending on the path. Scenario test: "fastest way to open Disk Management from the Run box" = diskmgmt.msc.' },
    { label: 'NTFS vs Share Permissions — precedence + least privilege', parentTopic: 'Windows OS Security Settings', objective: '2.2', keyword: 'Objective 2.2 file/folder permissions. SHARE permissions apply ONLY to access over the NETWORK (not local logon). NTFS permissions apply BOTH locally AND over the network and are far more granular (Full Control / Modify / Read & Execute / List / Read / Write). PRECEDENCE RULE: when a user accesses a shared folder over the network, the EFFECTIVE permission is the MOST RESTRICTIVE of (the combined Share permission) and (the combined NTFS permission) — the intersection. Locally (no share involved), only NTFS applies. DENY always overrides ALLOW. Inheritance: child objects inherit parent NTFS permissions unless inheritance is broken. PRINCIPLE OF LEAST PRIVILEGE = grant the minimum permission needed. Memorize: over the network, the answer is the MORE RESTRICTIVE of Share vs NTFS; Deny wins; locally only NTFS matters.' },
    { label: 'Cross-OS Command Set (Windows vs Linux vs macOS)', parentTopic: 'Linux Features & Commands', objective: '1.5 / 1.9', keyword: 'Core 2 VoC #6 + §2 S5: distinct command purposes per OS family (the "cross-OS command list" frustration). WINDOWS (cmd/PowerShell): ipconfig (IP config), ping, netstat, nslookup, net use (map drive), tracert/pathping, chkdsk (disk check), sfc /scannow (system file check), diskpart, gpupdate/gpresult (Group Policy), robocopy, tasklist, whoami, winver. LINUX: ls (list), pwd, cd, cp/mv/rm, chmod (permissions), chown (ownership), grep (search text), find, sudo (run as root), su, apt/dnf (package mgmt), ip (networking), ping, dig (DNS), top/ps (processes), df/du (disk usage), cat, man, nano. macOS: Terminal (zsh/bash), Time Machine (backup), Keychain (credentials), Disk Utility, FileVault (encryption), Spotlight (search), Force Quit. Memorize the discriminators: chmod/chown/grep/sudo = Linux; sfc/chkdsk/ipconfig/gpupdate = Windows; Time Machine/Keychain/FileVault = macOS. ping is universal; ipconfig (Windows) vs ip (Linux).' },
    { label: 'Backup Methodology + 3-2-1 Rule + GFS rotation', parentTopic: 'Backup & Recovery Methods', objective: '4.3', keyword: 'Objective 4.3 backup types + rotation. FULL = backs up EVERYTHING every time; slowest backup, fastest single-step restore. INCREMENTAL = backs up only what changed SINCE THE LAST BACKUP (full or incremental); fastest backup, SLOWEST restore (need the last full + EVERY incremental since, in order). DIFFERENTIAL = backs up everything changed SINCE THE LAST FULL; medium backup, faster restore (need only the last full + the latest differential). SYNTHETIC FULL = the backup software CONSTRUCTS a full from a prior full + subsequent incrementals without re-reading all source data. 3-2-1 RULE = keep 3 copies of data, on 2 different media types, with 1 copy offsite. GFS (Grandfather-Father-Son) = rotation scheme with daily (son), weekly (father), monthly (grandfather) retention tiers. Memorize the restore chains: incremental restore = full + ALL incrementals in order; differential restore = full + ONE (latest) differential.' },
    { label: 'MFA Factor Categories (knowledge / possession / inherence + location/behavior)', parentTopic: 'Logical Security & MFA', objective: '2.1', keyword: 'Objective 2.1 multifactor authentication. True MFA combines factors from DIFFERENT categories. KNOWLEDGE = something you KNOW (password, PIN, security question). POSSESSION = something you HAVE (hardware token, smart card, key fob, authenticator app / TOTP code, SMS code, one-time passcode). INHERENCE = something you ARE (biometrics: fingerprint, facial recognition, retina/iris, palm print, voice). LOCATION = somewhere you ARE (GPS/geofence, IP/network). BEHAVIOR = something you DO (typing cadence, gait). Critical rule: two passwords = NOT MFA (both knowledge). Password + authenticator app = MFA (knowledge + possession). Password + fingerprint = MFA (knowledge + inherence). Memorize: an authenticator app / TOTP / hardware token = POSSESSION (not knowledge); biometrics = INHERENCE. Categorize the EXAMPLE into the correct factor.' }
  ],

  // ── DOMAIN WEIGHTS (OFFICIAL CompTIA A+ 220-1202 v4.0 blueprint, page 3) ───
  // Sums to 1.00 — the exact published percentages. Only 4 domains (vs Core 1's
  // 5 / Net+/Sec+'s 5).
  domainWeights: {
    'operating-systems':         0.28, // Domain 1 — Operating Systems
    'security':                  0.28, // Domain 2 — Security
    'software-troubleshooting':  0.23, // Domain 3 — Software Troubleshooting
    'operational-procedures':    0.21  // Domain 4 — Operational Procedures
  },

  domainLabels: {
    'operating-systems':         'Operating Systems',
    'security':                  'Security',
    'software-troubleshooting':  'Software Troubleshooting',
    'operational-procedures':    'Operational Procedures'
  },

  // ── TOPIC → DOMAIN MAP (46 topics across 4 Core 2 domains) ────────────────
  // Topic name = primary key everywhere; domain key is one of:
  // operating-systems / security / software-troubleshooting / operational-procedures.
  topicDomains: {
    // ── Domain 1 — Operating Systems (28%, 12 topics) ───────────────────────
    'OS Types & Filesystems':                    'operating-systems',         // 1.1
    'OS Installations & Upgrades':               'operating-systems',         // 1.2
    'Windows Editions Features':                 'operating-systems',         // 1.3
    'Windows Tools & MMC Snap-ins':              'operating-systems',         // 1.4
    'Windows Command-Line Tools':                'operating-systems',         // 1.5
    'Windows Settings & Control Panel':          'operating-systems',         // 1.6
    'Windows Networking Configuration':          'operating-systems',         // 1.7
    'macOS Features & Tools':                    'operating-systems',         // 1.8
    'Linux Features & Commands':                 'operating-systems',         // 1.9
    'Application Installation Requirements':     'operating-systems',         // 1.10
    'Cloud-Based Productivity Tools':            'operating-systems',         // 1.11
    'Multi-Path Tool Access':                    'operating-systems',         // 1.4 (VoC S2.2 surprise)

    // ── Domain 2 — Security (28%, 12 topics) ────────────────────────────────
    'Physical Security Measures':                'security',                  // 2.1
    'Logical Security & MFA':                    'security',                  // 2.1
    'Windows OS Security Settings':              'security',                  // 2.2
    'Wireless Security Protocols':               'security',                  // 2.3
    'Malware Types & Tools':                     'security',                  // 2.4
    'Social Engineering Attacks':                'security',                  // 2.5
    'Threats & Vulnerabilities':                 'security',                  // 2.5
    'SOHO Malware Removal Procedure':            'security',                  // 2.6
    'Workstation Security & Hardening':          'security',                  // 2.7
    'Mobile Device Security':                    'security',                  // 2.8
    'Data Destruction & Disposal':               'security',                  // 2.9
    'SOHO & Browser Security':                   'security',                  // 2.10 / 2.11

    // ── Domain 3 — Software Troubleshooting (23%, 10 topics) ────────────────
    'Troubleshoot Windows OS Issues':            'software-troubleshooting',  // 3.1
    'BSOD & System Instability':                 'software-troubleshooting',  // 3.1
    'Boot & Performance Issues':                 'software-troubleshooting',  // 3.1
    'Application Crash & Service Issues':        'software-troubleshooting',  // 3.1
    'Profile & Account Issues':                  'software-troubleshooting',  // 3.1
    'Troubleshoot Mobile OS & App Issues':       'software-troubleshooting',  // 3.2
    'Troubleshoot Mobile Security Issues':       'software-troubleshooting',  // 3.3
    'Troubleshoot PC Security Issues':           'software-troubleshooting',  // 3.4
    'Malware Symptom Diagnosis':                 'software-troubleshooting',  // 3.4 (VoC S2.3)
    'Browser Symptom Troubleshooting':           'software-troubleshooting',  // 3.4

    // ── Domain 4 — Operational Procedures (21%, 12 topics) ──────────────────
    'Documentation & Ticketing':                 'operational-procedures',    // 4.1
    'Asset Management':                          'operational-procedures',    // 4.1
    'Change Management Procedures':              'operational-procedures',    // 4.2
    'Backup & Recovery Methods':                 'operational-procedures',    // 4.3
    'Safety Procedures':                         'operational-procedures',    // 4.4
    'Environmental Controls':                    'operational-procedures',    // 4.5
    'Incident Response & Prohibited Content':    'operational-procedures',    // 4.6
    'Licensing & Regulated Data':                'operational-procedures',    // 4.6
    'Communication & Professionalism':           'operational-procedures',    // 4.7
    'Scripting Basics':                          'operational-procedures',    // 4.8 (VoC S10)
    'Remote Access Technologies':                'operational-procedures',    // 4.9
    'AI Basics':                                 'operational-procedures'     // 4.10 (NEW in 220-1202 v15)
  },

  // ── TOPIC RESOURCES (Professor Messer free 220-1202 search + objective #) ──
  topicResources: {
    // Domain 1 — Operating Systems
    'OS Types & Filesystems':                 { obj: '1.1', title: 'OS Types & Filesystems', search: 'professor+messer+220-1202+operating+systems+filesystems' },
    'OS Installations & Upgrades':            { obj: '1.2', title: 'OS Installation', search: 'professor+messer+220-1202+OS+installation+upgrade' },
    'Windows Editions Features':              { obj: '1.3', title: 'Windows Editions', search: 'professor+messer+220-1202+windows+editions' },
    'Windows Tools & MMC Snap-ins':           { obj: '1.4', title: 'Windows Tools', search: 'professor+messer+220-1202+windows+tools+MMC' },
    'Windows Command-Line Tools':             { obj: '1.5', title: 'Command-Line Tools', search: 'professor+messer+220-1202+command+line+tools' },
    'Windows Settings & Control Panel':       { obj: '1.6', title: 'Windows Settings', search: 'professor+messer+220-1202+windows+settings+control+panel' },
    'Windows Networking Configuration':       { obj: '1.7', title: 'Windows Networking', search: 'professor+messer+220-1202+windows+networking+configuration' },
    'macOS Features & Tools':                 { obj: '1.8', title: 'macOS Features', search: 'professor+messer+220-1202+macOS+features+tools' },
    'Linux Features & Commands':              { obj: '1.9', title: 'Linux Commands', search: 'professor+messer+220-1202+linux+commands' },
    'Application Installation Requirements':  { obj: '1.10', title: 'App Install Requirements', search: 'professor+messer+220-1202+application+installation+requirements' },
    'Cloud-Based Productivity Tools':         { obj: '1.11', title: 'Cloud Productivity', search: 'professor+messer+220-1202+cloud+productivity+tools' },
    'Multi-Path Tool Access':                 { obj: '1.4', title: 'Accessing Windows Tools', search: 'professor+messer+220-1202+mmc+run+control+panel' },

    // Domain 2 — Security
    'Physical Security Measures':             { obj: '2.1', title: 'Physical Security', search: 'professor+messer+220-1202+physical+security' },
    'Logical Security & MFA':                 { obj: '2.1', title: 'Logical Security & MFA', search: 'professor+messer+220-1202+logical+security+MFA' },
    'Windows OS Security Settings':           { obj: '2.2', title: 'Windows Security Settings', search: 'professor+messer+220-1202+windows+security+settings+NTFS' },
    'Wireless Security Protocols':            { obj: '2.3', title: 'Wireless Security', search: 'professor+messer+220-1202+wireless+security+WPA3' },
    'Malware Types & Tools':                  { obj: '2.4', title: 'Malware Types', search: 'professor+messer+220-1202+malware+types' },
    'Social Engineering Attacks':             { obj: '2.5', title: 'Social Engineering', search: 'professor+messer+220-1202+social+engineering' },
    'Threats & Vulnerabilities':              { obj: '2.5', title: 'Threats & Vulnerabilities', search: 'professor+messer+220-1202+threats+vulnerabilities' },
    'SOHO Malware Removal Procedure':         { obj: '2.6', title: 'Malware Removal Steps', search: 'professor+messer+220-1202+malware+removal+procedure' },
    'Workstation Security & Hardening':       { obj: '2.7', title: 'Workstation Hardening', search: 'professor+messer+220-1202+workstation+security+hardening' },
    'Mobile Device Security':                 { obj: '2.8', title: 'Mobile Security', search: 'professor+messer+220-1202+mobile+device+security' },
    'Data Destruction & Disposal':            { obj: '2.9', title: 'Data Destruction', search: 'professor+messer+220-1202+data+destruction+disposal' },
    'SOHO & Browser Security':                { obj: '2.10', title: 'SOHO & Browser Security', search: 'professor+messer+220-1202+SOHO+browser+security' },

    // Domain 3 — Software Troubleshooting
    'Troubleshoot Windows OS Issues':         { obj: '3.1', title: 'Troubleshoot Windows', search: 'professor+messer+220-1202+troubleshoot+windows+OS' },
    'BSOD & System Instability':              { obj: '3.1', title: 'BSOD & Instability', search: 'professor+messer+220-1202+BSOD+system+instability' },
    'Boot & Performance Issues':              { obj: '3.1', title: 'Boot & Performance', search: 'professor+messer+220-1202+boot+performance+issues' },
    'Application Crash & Service Issues':      { obj: '3.1', title: 'App & Service Issues', search: 'professor+messer+220-1202+application+crash+services' },
    'Profile & Account Issues':               { obj: '3.1', title: 'Profile Issues', search: 'professor+messer+220-1202+slow+profile+load' },
    'Troubleshoot Mobile OS & App Issues':    { obj: '3.2', title: 'Troubleshoot Mobile OS', search: 'professor+messer+220-1202+troubleshoot+mobile+OS+app' },
    'Troubleshoot Mobile Security Issues':    { obj: '3.3', title: 'Mobile Security Issues', search: 'professor+messer+220-1202+mobile+OS+security+issues' },
    'Troubleshoot PC Security Issues':        { obj: '3.4', title: 'PC Security Issues', search: 'professor+messer+220-1202+PC+security+issues' },
    'Malware Symptom Diagnosis':              { obj: '3.4', title: 'Malware Symptoms', search: 'professor+messer+220-1202+malware+symptoms' },
    'Browser Symptom Troubleshooting':        { obj: '3.4', title: 'Browser Symptoms', search: 'professor+messer+220-1202+browser+redirect+popups' },

    // Domain 4 — Operational Procedures
    'Documentation & Ticketing':              { obj: '4.1', title: 'Documentation & Ticketing', search: 'professor+messer+220-1202+ticketing+documentation' },
    'Asset Management':                       { obj: '4.1', title: 'Asset Management', search: 'professor+messer+220-1202+asset+management+CMDB' },
    'Change Management Procedures':           { obj: '4.2', title: 'Change Management', search: 'professor+messer+220-1202+change+management' },
    'Backup & Recovery Methods':              { obj: '4.3', title: 'Backup & Recovery', search: 'professor+messer+220-1202+backup+recovery+3-2-1' },
    'Safety Procedures':                      { obj: '4.4', title: 'Safety Procedures', search: 'professor+messer+220-1202+safety+procedures+ESD' },
    'Environmental Controls':                 { obj: '4.5', title: 'Environmental Controls', search: 'professor+messer+220-1202+environmental+impacts' },
    'Incident Response & Prohibited Content': { obj: '4.6', title: 'Incident Response', search: 'professor+messer+220-1202+incident+response+chain+of+custody' },
    'Licensing & Regulated Data':             { obj: '4.6', title: 'Licensing & Regulated Data', search: 'professor+messer+220-1202+licensing+regulated+data+PII' },
    'Communication & Professionalism':        { obj: '4.7', title: 'Communication', search: 'professor+messer+220-1202+communication+professionalism' },
    'Scripting Basics':                       { obj: '4.8', title: 'Scripting Basics', search: 'professor+messer+220-1202+scripting+basics' },
    'Remote Access Technologies':             { obj: '4.9', title: 'Remote Access', search: 'professor+messer+220-1202+remote+access+RDP+VPN+SSH' },
    'AI Basics':                              { obj: '4.10', title: 'AI Basics', search: 'professor+messer+220-1202+artificial+intelligence+basics' }
  },

  // ── QUESTION EXEMPLARS (200 hand-curated, v7.6.0 Stage 6) ─────────────────
  // Populated in Stage 6. VoC-informed distribution (plan §6b + Appendix C.5):
  // Operating Systems ~56 (>=10 Windows command line, >=5 multi-path tool
  // access, >=5 Windows editions, >=4 cross-OS) / Security ~56 (>=10 social
  // engineering, >=4 MFA) / Software Troubleshooting ~44 (>=8 malware symptom+
  // removal) / Operational Procedures ~44 (>=4 backup, >=4 change mgmt, >=3
  // scripting). Format mix ~85% mcq / ~10% multi-select / ~5% order (malware
  // 10-step ordering + change-management ordering). Topic names match
  // topicDomains keys exactly. Legal: every exemplar original from the PUBLIC
  // 220-1202 v4.0 Exam Objectives PDF; ZERO paid-bank ingestion. VoC =
  // direction-finder only.
  questionExemplars: []
};
