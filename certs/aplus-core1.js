// ══════════════════════════════════════════════════════════════════════════
// CompTIA A+ Core 1 (220-1201) cert pack (v7.6.0 — fifth cert family, dual-exam)
// ══════════════════════════════════════════════════════════════════════════
// Loaded into window.CERT_PACKS['aplus-core1'] at app boot. Active when:
//   1. URL host matches 'aplus.certanvil.com' (or 'aplus.' / 'aplus-' prefix
//      for Vercel preview branches) — Pattern A subdomain (LOCKED 2026-05-27
//      plan §9 #1). A+ is ONE certification with TWO exams (Core 1 220-1201 +
//      Core 2 220-1202) that SHARE the aplus. subdomain — the first cert-family
//      to do so. Core 1 is the default on a cold subdomain entry.
//   2. localStorage 'nplus_dev_cert' === 'aplus-core1' (dev override + the
//      in-app Core 1 ↔ Core 2 switcher — the FIRST cert switch that stays on
//      the same subdomain: tadSwitchCert writes localStorage + reloads).
//   3. URL query '?cert=aplus-core1' or '?exam=core1' (entry-point handoff).
// Otherwise inert (loaded only when index.html inline IIFE document.writes
// <script src="certs/aplus-core1.js"> after Pattern A resolves the host).
//
// Status (v7.6.0):
//   ✓ Cert metadata — 80 Q / 90 min / 675 pass / 900 max. Official CompTIA
//     220-1201 v4.0 Exam Objectives + VoC §7 (modal 75-80 Q, 90-min timer,
//     675/900 passing — both confirmed by the official PDF AND multiple recall
//     reports).
//   ✓ Domain weights — OFFICIAL 220-1201 v4.0 blueprint (page 3): Mobile 13% /
//     Networking 23% / Hardware 25% / Virt+Cloud 11% / Troubleshooting 28%.
//     Sums to 1.00. (NOTE: supersedes the plan §2 #5 VoC-guessed 9/20/25/11/29
//     — the public PDF is the §10 authoritative source; VoC is direction-finder
//     only, never a content/weight source.)
//   ✓ Domain labels (5 domains — same domain-count as Net+/Sec+/AI-900).
//   ✓ Topic catalog (46 topics across 5 domains).
//   ✓ Topic resources (Professor Messer free 220-1201 search strings + obj #s —
//      Net+/Sec+ CompTIA-cert convention {obj,title,search}; Messer's free
//      YouTube course is a public resource, NOT a banned paid bank).
//   ✓ retentionGapConcepts (8 seed entries from the public 220-1201 Exam
//     Objectives PDF + VoC direction; open-ended, additive forever via Phase 3
//     cycles — Sec+ grew 8 → 18 → 26 across 6 cycles).
//   ☐ GT tables — A+ has candidate enumerable-fact surfaces (well-known TCP/UDP
//     ports, RAID levels enum) but VoC §4 #4 counter-evidence says ports are
//     overstudied/under-tested in isolation; defer GT until a clear pattern
//     emerges. Empty object → consumers fall back to defaults (no-op).
//   ☐ questionExemplars — populated in Stage 6 (200 hand-curated exemplars
//     across ~34-42 clusters). Empty array = exemplar-injection no-op; Haiku
//     falls back to blueprint + prompt quality alone.
//
// AUDIENCE (v7.6.0 Pattern A): public Pro-tier surface on
// https://aplus.certanvil.com (default Core 1). Visible to all signed-in users
// in the cert switcher with a "PRO" badge; switching INTO aplus-core1 requires
// Pro tier via tadSwitchCert's _gateProOnly('CompTIA A+ Core 1') call. Anon
// visitors on the landing diagnostic at certanvil.com/diagnostic/aplus-core1/
// funnel into the Pro upgrade modal.
//
// LEGAL (non-negotiable, locked in plan §10): every entry below originates from
// the PUBLIC CompTIA A+ 220-1201 v4.0 Exam Objectives PDF ONLY, with the
// founder's VoC research as a DIRECTION-FINDER (which topics get more exemplars)
// — never a content source. ZERO ingestion of paid-bank content: Jason Dion
// (Udemy + practice tests), Mike Meyers (Pearson book), Pearson Exam Cram,
// CompTIA CertMaster Learn/Practice, Skillcertpro, BurningIceTech Patreon,
// Crucial Exams, MeasureUp, Whizlabs, TutorialDojo, CertEmpire, paid
// Pluralsight, paid LinkedIn Learning, O'Reilly, Udemy, or ExamTopics dumps.
// The Jason Dion Method applies for any future paid A+ practice test: share gap
// topics in OWN WORDS only → Claude authors new exemplars per gap → original
// content informed by gap, never reproductions.

window.CERT_PACKS = window.CERT_PACKS || {};
window.CERT_PACKS['aplus-core1'] = {
  meta: {
    id: 'aplus-core1',
    name: 'CompTIA A+ Core 1',
    code: '220-1201',
    blueprintUrl: 'https://www.comptia.org/certifications/a',
    examPassScore: 675,         // Official 220-1201: 675 on a 100-900 scale. PDF p3 + VoC §7.
    examMaxScore: 900,          // scaled-score ceiling
    examQuestionCount: 80,      // Official cap "max 90"; VoC §7 modal is 75-80 (live forms run 75-80).
    examTimeSeconds: 5400,      // 90-minute timer (PDF "Length of test: 90 minutes").
  },

  // ── PRIORITY RETENTION CONCEPTS (v7.6.0 seed, 8 entries, additive forever) ─
  // Eight concepts seeded from the public CompTIA A+ 220-1201 v4.0 Exam
  // Objectives + VoC research (53 r/CompTIA threads, 986 posts/comments).
  // Injected as a soft tiebreaker into every question-generation prompt — same
  // mechanism as Net+/Sec+/AZ-900/AI-900 retentionGapConcepts. The array stays
  // open-ended; the founder appends new concepts via Phase 3 cycles after each
  // practice-test gap.
  retentionGapConcepts: [
    { label: 'RAID Levels — Configure AND Repair (not just naming)', parentTopic: 'RAID Configurations', objective: '3.4', keyword: 'VoC §2.1 + §4 #3 confirm the #1 Core 1 surprise: study guides teach RAID PROPERTIES but the exam tests CONFIGURING an array + REPAIRING/replacing a failed disk via PBQ. RAID 0 = striping, NO redundancy, 2+ disks, capacity = sum, ONE disk fails = ALL data lost (speed/capacity only). RAID 1 = mirroring, 2 disks, capacity = ONE disk (50% overhead), survives 1 disk failure, fastest rebuild (copy from mirror). RAID 5 = striping WITH distributed parity, 3+ disks, capacity = (n-1) disks, survives 1 disk failure, rebuild reads parity across remaining disks (slow rebuild). RAID 6 = striping with DOUBLE parity, 4+ disks, capacity = (n-2), survives 2 simultaneous failures. RAID 10 (1+0) = mirrored pairs THEN striped, 4+ disks, capacity = 50%, survives 1 per mirror, best performance+redundancy combo. Repair scenario: replace failed disk → array REBUILDS from parity/mirror; degraded array still serves data but with no further fault tolerance. "Array missing" / "RAID failure" / audible alarms = controller or member-disk fault. Memorize fault tolerance (0=none, 1/5=1 disk, 6/10=2 disks) AND the rebuild action.' },
    { label: 'Cloud Service Models — IaaS vs PaaS vs SaaS (scenario classification)', parentTopic: 'Cloud Service Models', objective: '4.2', keyword: 'VoC §2.2 names IaaS-vs-PaaS as a specific tested weakness. Walk the management-responsibility ladder. IaaS (Infrastructure as a Service) = provider manages the physical hardware/virtualization/network; CUSTOMER manages OS, runtime, middleware, apps, data (rent VMs/storage/network — Azure VMs, EC2). PaaS (Platform as a Service) = provider manages hardware + OS + runtime + middleware; customer manages ONLY app code + data (App Service, Heroku, managed DB). SaaS (Software as a Service) = provider manages EVERYTHING; customer just uses the app via browser (Microsoft 365, Gmail, Salesforce). Memorize: the MORE the provider manages, the LESS control + LESS responsibility the customer has. Scenario test: "company wants to deploy code without managing the OS or patching servers" = PaaS. "Company wants full control of the OS to install custom drivers" = IaaS. "Users just need email, no install" = SaaS.' },
    { label: 'Cloud Deployment Models — Public / Private / Hybrid / Community', parentTopic: 'Cloud Deployment Models', objective: '4.2', keyword: 'PUBLIC cloud = shared multi-tenant infrastructure owned by a provider (AWS/Azure/GCP); pay-as-you-go, no capital cost, least control. PRIVATE cloud = dedicated single-organization infrastructure (on-prem or hosted); most control + security, highest cost. HYBRID cloud = combines public + private with orchestration between them (keep sensitive data private, burst compute to public — "cloud bursting"). COMMUNITY cloud = shared by several organizations with COMMON concerns (compliance, mission) — e.g. several hospitals sharing a HIPAA-compliant cloud. Memorize the trade-off: public = cheapest/least control; private = most control/most cost; hybrid = balance + workload placement choice; community = shared-concern group.' },
    { label: 'Cloud Characteristics — Elasticity / On-demand / Metered / Resource Pooling / Multitenancy', parentTopic: 'Cloud Characteristics', objective: '4.2', keyword: 'VoC §1 #3 + §8A: "Elasticity, saas, private, hybrid, etc." heavily tested. RAPID ELASTICITY = resources scale UP and DOWN automatically with demand (Black-Friday traffic spike auto-adds servers, then releases them). ON-DEMAND SELF-SERVICE = provision resources yourself via portal/API with no human ticket. METERED UTILIZATION (measured service) = pay only for what you consume, billed by usage (ingress/egress, compute-hours). RESOURCE POOLING = provider serves many tenants from a shared pool, dynamically assigned. MULTITENANCY = multiple customers share the same physical infrastructure, logically isolated. HIGH AVAILABILITY = redundancy across zones. Scenario trap: "auto-scales with traffic" = elasticity; "pay for what you use" = metered; "provision without IT involvement" = on-demand self-service.' },
    { label: 'DNS Records — A / AAAA / CNAME / MX / TXT (incl. SPF, DKIM, DMARC)', parentTopic: 'DNS Records & Configuration', objective: '2.4', keyword: 'VoC §2.3 flags SPF/DKIM/DMARC as a Core 1 SURPRISE (usually Net+/Sec+ territory). A record = hostname maps to an IPv4 address. AAAA record = hostname maps to an IPv6 address. CNAME (canonical name) = alias one hostname to another (www to example.com). MX (mail exchanger) = which mail server receives email for the domain (has a priority value, lowest = preferred). TXT record = arbitrary text, and the email-authentication TXT sub-types: SPF (Sender Policy Framework) = lists which servers are allowed to send mail for the domain (anti-spoofing). DKIM (DomainKeys Identified Mail) = cryptographic signature proving the message was not altered + came from the domain. DMARC (Domain-based Message Authentication, Reporting & Conformance) = policy built ON TOP of SPF+DKIM telling receivers what to do with failures (none/quarantine/reject) + where to send reports. All three are published as TXT records. Memorize: SPF = who can send; DKIM = signature/integrity; DMARC = the enforcement policy tying them together.' },
    { label: 'Wi-Fi Standards & Generations (802.11 a/b/g/n/ac/ax + bands)', parentTopic: 'Wireless Networking Standards', objective: '2.2', keyword: 'VoC §4 #6 lists Wi-Fi standards + speeds as study-hard. 802.11a = 5GHz, 54 Mbps. 802.11b = 2.4GHz, 11 Mbps. 802.11g = 2.4GHz, 54 Mbps. 802.11n (Wi-Fi 4) = 2.4+5GHz, up to 600 Mbps, MIMO. 802.11ac (Wi-Fi 5) = 5GHz only, gigabit-class, MU-MIMO. 802.11ax (Wi-Fi 6 / 6E) = 2.4+5GHz (6E adds 6GHz), OFDMA, best efficiency in dense environments. Frequency trade-off: 2.4GHz = longer range, more penetration, MORE interference + fewer non-overlapping channels (1/6/11). 5GHz = shorter range, faster, more channels, less congestion. 6GHz (Wi-Fi 6E) = newest, widest, least congested, shortest range. Memorize band-to-standard mapping + the range-vs-speed trade-off.' },
    { label: 'Cellular Generations (3G / 4G LTE / 5G) + Internet Connection Types', parentTopic: 'Internet Connection & Network Types', objective: '2.7', keyword: 'VoC §4 #6 lists 3G/4G/5G as study-hard. 3G = legacy, low Mbps. 4G LTE = mainstream mobile broadband, tens of Mbps. 5G = newest, gigabit-class potential, low latency; sub-6GHz (wide coverage) vs mmWave (ultra-fast, very short range). Internet connection types + characteristics: FIBER = fastest, symmetric, lowest latency. CABLE = fast download, shared neighborhood bandwidth (DOCSIS). DSL = over phone line, distance-sensitive, slower. SATELLITE = available anywhere, HIGH latency (GEO), weather-affected. CELLULAR/WISP = wireless last-mile. Memorize: fiber = best/most expensive to deploy; satellite = anywhere but high latency; cellular = mobile + backup.' },
    { label: 'Mobile Troubleshooting — Burn-in, Swollen Battery, Overheating, Digitizer', parentTopic: 'Troubleshoot Mobile Device Issues', objective: '5.4', keyword: 'VoC §2.5 flags burn-in + swollen-battery action steps as easy-to-miss. SCREEN BURN-IN = a persistent ghost image on OLED from static content; mitigate with screen timeout, dark mode, varied content — often not fully repairable (panel replacement). SWOLLEN/SPICY BATTERY = a bulge or a gap forming under the screen/case = lithium battery off-gassing; STOP using/charging immediately, do NOT puncture, replace the battery, dispose per hazmat. POOR BATTERY HEALTH = degraded capacity over cycles, so replace the battery. OVERHEATING = remove case, close apps, check for swollen battery/charging fault. DIGITIZER ISSUES / CURSOR DRIFT = touch calibration or failed digitizer, so recalibrate or replace. IMPROPER CHARGING = check cable/port/charger before condemning the battery. Memorize the safe-handling action (swollen battery = stop + replace, never puncture) over the definition.' }
  ],

  // ── DOMAIN WEIGHTS (OFFICIAL CompTIA A+ 220-1201 v4.0 blueprint, page 3) ───
  // Sums to 1.00 — the exact published percentages. The §10 legal boundary
  // makes the public PDF the sole authoritative source (VoC is direction-only).
  domainWeights: {
    'mobile-devices':           0.13, // Domain 1 — Mobile Devices
    'networking':               0.23, // Domain 2 — Networking
    'hardware':                 0.25, // Domain 3 — Hardware
    'virt-cloud':               0.11, // Domain 4 — Virtualization & Cloud Computing
    'troubleshooting-hw-net':   0.28  // Domain 5 — Hardware & Network Troubleshooting (largest)
  },

  domainLabels: {
    'mobile-devices':           'Mobile Devices',
    'networking':               'Networking',
    'hardware':                 'Hardware',
    'virt-cloud':               'Virtualization & Cloud',
    'troubleshooting-hw-net':   'Hardware & Network Troubleshooting'
  },

  // ── TOPIC → DOMAIN MAP (46 topics across 5 Core 1 domains) ────────────────
  // Topic name = primary key everywhere; domain key is one of: mobile-devices /
  // networking / hardware / virt-cloud / troubleshooting-hw-net.
  topicDomains: {
    // ── Domain 1 — Mobile Devices (13%, 6 topics) ───────────────────────────
    'Mobile Device Hardware & Replacement':      'mobile-devices',          // 1.1
    'Mobile Biometrics & Physical Security':     'mobile-devices',          // 1.1
    'Mobile Accessories & Connectivity':         'mobile-devices',          // 1.2
    'Mobile Network Connectivity':               'mobile-devices',          // 1.3
    'Mobile Device Management (MDM)':            'mobile-devices',          // 1.3
    'Mobile Synchronization':                    'mobile-devices',          // 1.3

    // ── Domain 2 — Networking (23%, 12 topics) ──────────────────────────────
    'Ports & Protocols':                         'networking',             // 2.1
    'TCP vs UDP':                                'networking',             // 2.1
    'Wireless Networking Standards':             'networking',             // 2.2
    'Wireless Frequencies & Channels':           'networking',             // 2.2
    'Networked Host Services':                   'networking',             // 2.3
    'Internet Appliances & IoT':                 'networking',             // 2.3
    'DNS Records & Configuration':               'networking',             // 2.4
    'DHCP, VLAN & VPN':                          'networking',             // 2.4
    'Networking Hardware Devices':               'networking',             // 2.5
    'SOHO Network Configuration':                'networking',             // 2.6
    'Internet Connection & Network Types':       'networking',             // 2.7
    'Networking Tools':                          'networking',             // 2.8

    // ── Domain 3 — Hardware (25%, 12 topics) ────────────────────────────────
    'Display Components & Attributes':           'hardware',               // 3.1
    'Network Cable Types & Connectors':          'hardware',               // 3.2
    'Peripheral & Video Cables':                 'hardware',               // 3.2
    'RAM Characteristics':                       'hardware',               // 3.3
    'Storage Devices':                           'hardware',               // 3.4
    'RAID Configurations':                       'hardware',               // 3.4
    'Motherboards & Form Factors':               'hardware',               // 3.5
    'CPUs & BIOS/UEFI':                          'hardware',               // 3.5
    'Expansion Cards & Cooling':                 'hardware',               // 3.5
    'Power Supplies':                            'hardware',               // 3.6
    'Printers — Deploy & Configure':             'hardware',               // 3.7
    'Printer Maintenance':                       'hardware',               // 3.8

    // ── Domain 4 — Virtualization & Cloud (11%, 5 topics) ───────────────────
    'Virtualization Concepts':                   'virt-cloud',             // 4.1
    'Containers & VDI':                          'virt-cloud',             // 4.1
    'Cloud Service Models':                      'virt-cloud',             // 4.2
    'Cloud Deployment Models':                   'virt-cloud',             // 4.2
    'Cloud Characteristics':                     'virt-cloud',             // 4.2

    // ── Domain 5 — Hardware & Network Troubleshooting (28%, 11 topics) ──────
    'Troubleshooting Methodology':               'troubleshooting-hw-net', // 5.0 (competency standard; VoC §1 #5 heavy)
    'Troubleshoot Motherboards, RAM & CPUs':     'troubleshooting-hw-net', // 5.1
    'Troubleshoot Power Issues':                 'troubleshooting-hw-net', // 5.1
    'Troubleshoot Drives & RAID':                'troubleshooting-hw-net', // 5.2
    'Troubleshoot Video & Display':              'troubleshooting-hw-net', // 5.3
    'Display Burn-in & Projector Issues':        'troubleshooting-hw-net', // 5.3
    'Troubleshoot Mobile Device Issues':         'troubleshooting-hw-net', // 5.4
    'Mobile Battery & Charging Issues':          'troubleshooting-hw-net', // 5.4
    'Troubleshoot Network Issues':               'troubleshooting-hw-net', // 5.5
    'Network Diagnostic Methodology':            'troubleshooting-hw-net', // 5.5
    'Troubleshoot Printer Issues':               'troubleshooting-hw-net'  // 5.6
  },

  // ── TOPIC RESOURCES (Professor Messer free 220-1201 search + objective #) ──
  // Net+/Sec+ CompTIA-cert convention: { obj, title, search }. Professor
  // Messer's free 220-1201 YouTube course is a public resource (NOT a paid
  // bank). Used by showTopicDeepDive + per-row Progress-page play buttons.
  topicResources: {
    // Domain 1 — Mobile Devices
    'Mobile Device Hardware & Replacement':   { obj: '1.1', title: 'Laptop Hardware', search: 'professor+messer+220-1201+laptop+hardware' },
    'Mobile Biometrics & Physical Security':  { obj: '1.1', title: 'Mobile Security Features', search: 'professor+messer+220-1201+mobile+biometrics' },
    'Mobile Accessories & Connectivity':      { obj: '1.2', title: 'Mobile Connectivity', search: 'professor+messer+220-1201+mobile+accessories+connectivity' },
    'Mobile Network Connectivity':            { obj: '1.3', title: 'Mobile Networking', search: 'professor+messer+220-1201+mobile+network+connectivity' },
    'Mobile Device Management (MDM)':         { obj: '1.3', title: 'MDM', search: 'professor+messer+220-1201+mobile+device+management' },
    'Mobile Synchronization':                 { obj: '1.3', title: 'Mobile Sync', search: 'professor+messer+220-1201+mobile+synchronization' },

    // Domain 2 — Networking
    'Ports & Protocols':                      { obj: '2.1', title: 'Ports & Protocols', search: 'professor+messer+220-1201+ports+protocols' },
    'TCP vs UDP':                             { obj: '2.1', title: 'TCP vs UDP', search: 'professor+messer+220-1201+TCP+UDP' },
    'Wireless Networking Standards':          { obj: '2.2', title: '802.11 Standards', search: 'professor+messer+220-1201+802.11+wireless+standards' },
    'Wireless Frequencies & Channels':        { obj: '2.2', title: 'Wireless Frequencies', search: 'professor+messer+220-1201+wireless+frequencies+channels' },
    'Networked Host Services':                { obj: '2.3', title: 'Network Host Services', search: 'professor+messer+220-1201+networked+hosts+server+roles' },
    'Internet Appliances & IoT':              { obj: '2.3', title: 'Internet Appliances & IoT', search: 'professor+messer+220-1201+internet+appliances+IoT' },
    'DNS Records & Configuration':            { obj: '2.4', title: 'DNS Configuration', search: 'professor+messer+220-1201+DNS+records' },
    'DHCP, VLAN & VPN':                       { obj: '2.4', title: 'DHCP, VLAN & VPN', search: 'professor+messer+220-1201+DHCP+VLAN+VPN' },
    'Networking Hardware Devices':            { obj: '2.5', title: 'Networking Hardware', search: 'professor+messer+220-1201+networking+hardware+devices' },
    'SOHO Network Configuration':             { obj: '2.6', title: 'SOHO Networks', search: 'professor+messer+220-1201+SOHO+network+IP+addressing' },
    'Internet Connection & Network Types':    { obj: '2.7', title: 'Internet & Network Types', search: 'professor+messer+220-1201+internet+connection+network+types' },
    'Networking Tools':                       { obj: '2.8', title: 'Networking Tools', search: 'professor+messer+220-1201+networking+tools' },

    // Domain 3 — Hardware
    'Display Components & Attributes':        { obj: '3.1', title: 'Display Components', search: 'professor+messer+220-1201+display+components' },
    'Network Cable Types & Connectors':       { obj: '3.2', title: 'Network Cables', search: 'professor+messer+220-1201+network+cables+connectors' },
    'Peripheral & Video Cables':              { obj: '3.2', title: 'Peripheral & Video Cables', search: 'professor+messer+220-1201+peripheral+video+cables' },
    'RAM Characteristics':                    { obj: '3.3', title: 'RAM', search: 'professor+messer+220-1201+RAM+memory' },
    'Storage Devices':                        { obj: '3.4', title: 'Storage Devices', search: 'professor+messer+220-1201+storage+devices' },
    'RAID Configurations':                    { obj: '3.4', title: 'RAID', search: 'professor+messer+220-1201+RAID' },
    'Motherboards & Form Factors':            { obj: '3.5', title: 'Motherboards', search: 'professor+messer+220-1201+motherboard+form+factors' },
    'CPUs & BIOS/UEFI':                       { obj: '3.5', title: 'CPUs & BIOS/UEFI', search: 'professor+messer+220-1201+CPU+BIOS+UEFI' },
    'Expansion Cards & Cooling':              { obj: '3.5', title: 'Expansion Cards & Cooling', search: 'professor+messer+220-1201+expansion+cards+cooling' },
    'Power Supplies':                         { obj: '3.6', title: 'Power Supplies', search: 'professor+messer+220-1201+power+supply' },
    'Printers — Deploy & Configure':          { obj: '3.7', title: 'Printer Configuration', search: 'professor+messer+220-1201+printer+deploy+configure' },
    'Printer Maintenance':                    { obj: '3.8', title: 'Printer Maintenance', search: 'professor+messer+220-1201+printer+maintenance' },

    // Domain 4 — Virtualization & Cloud
    'Virtualization Concepts':                { obj: '4.1', title: 'Virtualization', search: 'professor+messer+220-1201+virtualization' },
    'Containers & VDI':                       { obj: '4.1', title: 'Containers & VDI', search: 'professor+messer+220-1201+containers+VDI' },
    'Cloud Service Models':                   { obj: '4.2', title: 'Cloud Service Models', search: 'professor+messer+220-1201+IaaS+PaaS+SaaS' },
    'Cloud Deployment Models':                { obj: '4.2', title: 'Cloud Deployment Models', search: 'professor+messer+220-1201+cloud+deployment+models' },
    'Cloud Characteristics':                  { obj: '4.2', title: 'Cloud Characteristics', search: 'professor+messer+220-1201+cloud+characteristics+elasticity' },

    // Domain 5 — Hardware & Network Troubleshooting
    'Troubleshooting Methodology':            { obj: '5.0', title: 'Troubleshooting Methodology', search: 'professor+messer+220-1201+troubleshooting+methodology' },
    'Troubleshoot Motherboards, RAM & CPUs':  { obj: '5.1', title: 'Troubleshoot Motherboards', search: 'professor+messer+220-1201+troubleshoot+motherboard+RAM+CPU' },
    'Troubleshoot Power Issues':              { obj: '5.1', title: 'Troubleshoot Power', search: 'professor+messer+220-1201+troubleshoot+power' },
    'Troubleshoot Drives & RAID':             { obj: '5.2', title: 'Troubleshoot Drives & RAID', search: 'professor+messer+220-1201+troubleshoot+drives+RAID' },
    'Troubleshoot Video & Display':           { obj: '5.3', title: 'Troubleshoot Video', search: 'professor+messer+220-1201+troubleshoot+video+display' },
    'Display Burn-in & Projector Issues':     { obj: '5.3', title: 'Display & Projector Issues', search: 'professor+messer+220-1201+display+burn-in+projector' },
    'Troubleshoot Mobile Device Issues':      { obj: '5.4', title: 'Troubleshoot Mobile', search: 'professor+messer+220-1201+troubleshoot+mobile+device' },
    'Mobile Battery & Charging Issues':       { obj: '5.4', title: 'Mobile Battery Issues', search: 'professor+messer+220-1201+swollen+battery+charging' },
    'Troubleshoot Network Issues':            { obj: '5.5', title: 'Troubleshoot Network', search: 'professor+messer+220-1201+troubleshoot+network' },
    'Network Diagnostic Methodology':         { obj: '5.5', title: 'Network Diagnostics', search: 'professor+messer+220-1201+network+diagnostic' },
    'Troubleshoot Printer Issues':            { obj: '5.6', title: 'Troubleshoot Printers', search: 'professor+messer+220-1201+troubleshoot+printer' }
  },

  // ── QUESTION EXEMPLARS (200 hand-curated, v7.6.0 Stage 6) ─────────────────
  // Populated in Stage 6. VoC-informed distribution (plan §6a + Appendix C.5):
  // Mobile ~18 / Networking ~40 / Hardware ~50 (>=8 RAID config+repair, >=8
  // printer troubleshooting) / Virt+Cloud ~22 (>=5 cloud service model) /
  // Troubleshooting ~58. Plus >=4 DNS TXT (SPF/DKIM/DMARC), >=4 mobile burn-in/
  // swollen-battery, >=3 STP-vs-UTP, >=3 component-level repair. Format mix ~85%
  // mcq / ~10% multi-select / ~5% order. Bias toward scenario stems with
  // BEST/NEXT/FIRST qualifiers (VoC §2.9); DE-WEIGHT isolated port memorization
  // (VoC §4 #4 counter-evidence). Topic names match topicDomains keys exactly.
  // Legal: every exemplar original from the PUBLIC 220-1201 v4.0 Exam
  // Objectives PDF; ZERO ingestion from paid banks (Dion/Meyers/CertMaster/
  // BurningIceTech/Skillcertpro/etc.). VoC is direction-finder only.
  questionExemplars: []
};
