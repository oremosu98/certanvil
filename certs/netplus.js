// ══════════════════════════════════════════════════════════════════════════
// CompTIA Network+ N10-009 cert pack (v4.86.0 Phase 1A engine refactor)
// ══════════════════════════════════════════════════════════════════════════
// Loaded into window.CERT_PACKS.netplus at app boot. The active cert is
// resolved by detectCert() in app.js (URL host + localStorage dev override
// + 'netplus' default). When CURRENT_CERT === 'netplus', app.js reads the
// constants below; otherwise this pack is loaded but inert.
//
// Phase 1A (this ship): cert metadata + RETENTION_GAP_CONCEPTS only.
// Phase 1B (next): TOPIC_DOMAINS, DOMAIN_WEIGHTS, topicResources, GT tables.
// Phase 2 (Week 3): QUESTION_EXEMPLARS migration + Security+ pack content.
//
// LEGAL: every entry below originates from the public N10-009 blueprint or
// publicly-known technical facts. Zero ingestion of paid-bank content
// (Jason Dion / CertMaster / Mike Myers / Kaplan) — see CLAUDE.md for the
// full discipline note.

window.CERT_PACKS = window.CERT_PACKS || {};
window.CERT_PACKS.netplus = {
  meta: {
    id: 'netplus',
    name: 'CompTIA Network+',
    code: 'N10-009',
    blueprintUrl: 'https://www.comptia.org/certifications/network',
    examPassScore: 720,        // scaled-score pass threshold
    examMaxScore: 900,         // scaled-score ceiling
    examQuestionCount: 90,     // full exam length
    examTimeSeconds: 5400,     // 90-minute timer
  },

  // ── PRIORITY RETENTION CONCEPTS (v4.62.3, Phase 3 Cycles 1+2) ─────────
  // Topics the user has recently drilled and wants solid retention on.
  // Injected as a soft tiebreaker into every question-generation prompt
  // (custom quiz, Mixed, Daily Challenge, Marathon, Exam simulator).
  // Non-invasive: a preference, not a mandate. When a single-topic quiz
  // on something unrelated is running (e.g., "Port Numbers"), these are
  // offered as tiebreakers, not forced in.
  //
  // When concepts are mastered (sustained 85%+ accuracy over 3+ sessions
  // per the weak-spot scoring), they can be retired from this list so
  // the prompt injection stays relevant. Network+ post-pass pruning is
  // queued for the engine refactor's Phase 1B.
  //
  // Empty array = no-op (the prompt block collapses to an empty string).
  retentionGapConcepts: [
    { label: 'Powerload',          parentTopic: 'Ethernet Standards',                objective: '2.3', keyword: '802.3bt PoE++ Type 3/4 power classification' },
    { label: 'NTS',                parentTopic: 'Network Naming (DNS & DHCP)',       objective: '1.6', keyword: 'NTS (Network Time Security) RFC 8915 — secure NTP replacement' },
    { label: 'NAC',                parentTopic: 'Protecting Networks',               objective: '4.3', keyword: 'NAC (Network Access Control) posture assessment — health-check before network admittance' },
    { label: 'Preaction fire system', parentTopic: 'Physical Security Controls',     objective: '4.5', keyword: 'Pre-action fire suppression (dry-then-water on double-trigger) in data centres' },
    { label: 'WAP Channels',       parentTopic: 'Wireless Networking',               objective: '2.4', keyword: '2.4 GHz non-overlapping channels 1/6/11 (only)' },
    { label: 'NMAP',               parentTopic: 'Network Troubleshooting & Tools',   objective: '5.5', keyword: 'Nmap port/service scanner — reconnaissance tool' },
    { label: 'Teredo tunneling',   parentTopic: 'IPv6',                              objective: '1.8', keyword: 'Teredo RFC 4380 — IPv6 tunnelled through IPv4 NAT' },
    { label: 'Full tunnel VPN',    parentTopic: 'SSL/TLS VPN',                       objective: '4.4', keyword: 'Full tunnel VPN — all client traffic through VPN gateway' },
    { label: 'Split tunnel VPN',   parentTopic: 'SSL/TLS VPN',                       objective: '4.4', keyword: 'Split tunnel VPN — only corporate-bound traffic goes through VPN' },
    { label: 'Site-to-site VPN',   parentTopic: 'IPsec VPN',                         objective: '4.4', keyword: 'Site-to-site IPsec VPN — connects two networks via gateway-to-gateway tunnel' },
    { label: 'Clientless VPN',     parentTopic: 'SSL/TLS VPN',                       objective: '4.4', keyword: 'Clientless SSL VPN — browser-based, no VPN software needed' },
    { label: 'Class of Service',   parentTopic: 'Network Operations',                objective: '3.2', keyword: 'CoS (802.1p) — Layer 2 QoS priority (0–7) distinct from DSCP' },
    { label: 'RAID Controller',    parentTopic: 'Business Continuity & Disaster Recovery', objective: '3.3', keyword: 'RAID levels — RAID 5 (striping + parity), RAID 1 (mirror), RAID 10 (striped mirrors)' },
    { label: 'PCAP File',          parentTopic: 'Network Troubleshooting & Tools',   objective: '5.5', keyword: 'PCAP file format — captured by tcpdump/Wireshark, used for packet forensics' },
    // ── v4.85.19 — Phase 3 Cycle 1 (Jason Dion practice test gaps, 2026-05-02) ──
    { label: 'IPv6 Anycast',       parentTopic: 'IPv6',                              objective: '1.4', keyword: 'IPv6 anycast — same address on multiple interfaces, routed to nearest by metric (NOT broadcast, NOT multicast)' },
    { label: 'Media Converter',    parentTopic: 'Cabling & Topology',                objective: '1.5', keyword: 'Media converter — Layer 1 device that bridges copper Ethernet and fiber media types' },
    { label: 'SD-WAN App-aware',   parentTopic: 'SD-WAN & SASE',                     objective: '1.2', keyword: 'SD-WAN application-aware steering — Layer 7 DPI/SaaS ID + per-app SLA-based path selection' },
    { label: 'Jumbo frames (SAN)', parentTopic: 'Data Center Architectures',         objective: '1.8', keyword: 'Jumbo frames (≈9000 byte MTU) deployed on dedicated VLAN/SAN to guarantee end-to-end MTU consistency' },
    { label: 'Band Steering',      parentTopic: 'Wireless Networking',               objective: '2.4', keyword: 'Band steering — AP/WLC pushes dual-band clients onto less-congested 5 GHz' },
    { label: 'Anomaly detection',  parentTopic: 'Network Monitoring & Observability', objective: '3.2', keyword: 'Anomaly-based detection — baseline learned, alerts on deviation; catches zero-days but more false positives than signature-based' },
    { label: 'DHCP Reservation',   parentTopic: 'Network Naming (DNS & DHCP)',       objective: '1.6', keyword: 'DHCP reservation — MAC tied to specific IP within scope; centrally managed alternative to local static config' },
    { label: 'DHCP Options',       parentTopic: 'Network Naming (DNS & DHCP)',       objective: '1.6', keyword: 'DHCP options 3=router, 6=DNS, 51=lease time, 66=TFTP server, 67=boot file (VoIP/PXE provisioning)' },
    { label: 'Separation of Duties', parentTopic: 'Protecting Networks',             objective: '4.1', keyword: 'Separation of duties — critical task split across people (initiate vs approve) so no single person can complete it alone' },
    { label: 'Non-persistent NAC', parentTopic: 'Protecting Networks',               objective: '4.3', keyword: 'Non-persistent (dissolvable) NAC agent — fetched at connect, runs posture, exits; ideal for guests/contractors' },
    { label: 'Wavelength Mismatch', parentTopic: 'Cable Issues',                     objective: '5.2', keyword: 'Optical wavelength mismatch — e.g., 1310 nm SM transceiver vs 850 nm MM transceiver fails to link, even though both are Ethernet SFPs' },
    // ── v4.85.21 — Phase 3 Cycle 2 (Jason Dion practice test #2 gaps, 2026-05-03) ──
    { label: 'RFC 1918 Private Ranges', parentTopic: 'NAT & IP Services',             objective: '1.4', keyword: 'RFC 1918 private IPv4 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 — distinct from APIPA 169.254.0.0/16' },
    { label: 'MDF / IDF',          parentTopic: 'Cabling & Topology',                objective: '1.5', keyword: 'Main Distribution Frame (building-level termination + carrier feed) vs Intermediate Distribution Frame (per-floor/zone)' },
    { label: 'Port-side intake/exhaust', parentTopic: 'Data Centres',                objective: '3.3', keyword: 'PSI (port-side intake — front intake, rear exhaust) aligns with cold-aisle/hot-aisle containment; PSE is reverse direction' },
    { label: 'MTRJ Connector',     parentTopic: 'Cabling & Topology',                objective: '1.5', keyword: 'MTRJ — small-form-factor duplex fiber connector, 1.25mm ferrule, two fibers in one body (RJ45-like housing)' },
    { label: 'DAC Cable',          parentTopic: 'Data Center Architectures',         objective: '1.8', keyword: 'Direct Attach Copper — short-range (≤7m passive) high-speed twinax with fixed transceivers, lower cost/power/latency than fiber for top-of-rack' },
    { label: 'Switch Imaging',     parentTopic: 'Network Operations',                objective: '3.1', keyword: 'Switch imaging — loading/upgrading IOS/firmware via TFTP (DHCP options 66+67 for ZTP), zero-touch provisioning' },
    { label: 'DoH (DNS over HTTPS)', parentTopic: 'Network Naming (DNS & DHCP)',     objective: '1.6', keyword: 'DoH (RFC 8484) — DNS encrypted over TCP/443, indistinguishable from web traffic; complicates enterprise DNS filtering' },
    { label: 'PTP (IEEE 1588)',    parentTopic: 'Network Operations',                objective: '3.1', keyword: 'PTP — sub-microsecond time sync via hardware timestamping at NIC + transparent/boundary clocks; required for 5G, HFT, industrial automation (NTP is millisecond-level)' },
    { label: 'Out-of-Band Mgmt',   parentTopic: 'Network Operations',                objective: '3.1', keyword: 'OOB management — separate dedicated network OR direct console/serial; works when production data plane is broken (in-band management does not)' },
    { label: 'OTDR',               parentTopic: 'Cable Issues',                      objective: '5.2', keyword: 'OTDR — Optical Time-Domain Reflectometer pinpoints fiber breaks/splices/loss by distance; sharp drop with no continuation = break' },
    { label: 'Toner Probe',        parentTopic: 'Network Troubleshooting & Tools',   objective: '5.5', keyword: 'Tone generator + inductive probe — traces unmarked copper cables by injecting AC tone and detecting magnetic field; tone bleed in tight bundles is a known limitation' },
    { label: 'LLDP',               parentTopic: 'Network Operations',                objective: '3.1', keyword: 'LLDP (IEEE 802.1AB) — vendor-neutral L2 discovery protocol (vs Cisco-proprietary CDP); advertises system name, port, capabilities to neighbors' },
    { label: 'TCP RST flag',       parentTopic: 'TCP/IP Basics',                     objective: '1.1', keyword: 'TCP RST — abortive immediate connection termination (distinct from graceful FIN four-way close). Sent on closed-port SYN, active firewall reject, or app-side abort.' },
    // ── v4.85.23 — Phase 3 Cycle 2 Round 2 add-on (Jason Dion gaps continued, 2026-05-03) ──
    { label: 'Microwave WAN',      parentTopic: 'WAN Connectivity',                  objective: '1.2', keyword: 'Microwave point-to-point — line-of-sight wireless WAN backbone, multi-Gbps over km; rain fade above 10 GHz; needs Fresnel zone clearance' },
    { label: 'Patch Panel',        parentTopic: 'Cabling & Topology',                objective: '1.5', keyword: 'Patch panel — passive (non-powered) cable termination; in-wall horizontal cabling on rear punch-downs, RJ45 jacks on front, patch cords to active gear' },
    { label: 'Bandwidth',          parentTopic: 'Network Monitoring & Observability', objective: '3.2', keyword: 'Bandwidth — THEORETICAL maximum capacity of a link (vs throughput which is actual delivered rate)' },
    { label: 'Latency',            parentTopic: 'Network Monitoring & Observability', objective: '3.2', keyword: 'Latency — delay from source to destination; long-distance dominated by propagation delay (~5ms per 1000 km in fiber)' },
    { label: 'Jitter',             parentTopic: 'Network Monitoring & Observability', objective: '3.2', keyword: 'Jitter — variation in packet arrival timing; critical for real-time voice/video; caused by variable queueing delays + path variability' },
    { label: 'Throughput',         parentTopic: 'Network Monitoring & Observability', objective: '3.2', keyword: 'Throughput — actual measured useful data rate (always ≤ bandwidth due to overhead, congestion, errors)' },
    { label: 'Clean Agent',        parentTopic: 'Data Centres',                      objective: '3.3', keyword: 'Clean agent fire suppression (FM-200, Novec 1230, Inergen) — non-conductive gas, no water damage, no residue; needs sealed room' },
    { label: 'Wet Pipe',           parentTopic: 'Data Centres',                      objective: '3.3', keyword: 'Wet pipe sprinkler — pressurized water in pipes, immediate discharge when head opens; risks accidental water damage on live electronics' },
    { label: 'Exploit',            parentTopic: 'Network Attacks & Threats',         objective: '4.2', keyword: 'Exploit — code/technique that takes advantage of a vulnerability to compromise; vulnerability is the flaw, exploit is the weapon' },
    { label: 'Vulnerability',      parentTopic: 'Network Attacks & Threats',         objective: '4.2', keyword: 'Vulnerability — flaw/weakness/misconfiguration that could be exploited; identified by scanners, remediated by patching or compensating controls' },
    { label: 'Visual Fault Locator', parentTopic: 'Cable Issues',                    objective: '5.2', keyword: 'VFL — visible red laser injected into fiber; light leaks from breaks/sharp bends/bad connectors; short-range visual troubleshooting (vs OTDR for long-run quantitative)' },
    { label: 'Penetration Testing', parentTopic: 'Network Attacks & Threats',        objective: '4.2', keyword: 'Pentest — authorized simulated attack that EXPLOITS vulnerabilities (vs vulnerability scan which only identifies). Methods: black-box / white-box / gray-box. Always requires written authorization.' },
    { label: 'OSPF Classless',     parentTopic: 'OSPF',                              objective: '2.1', keyword: 'OSPF is a CLASSLESS link-state protocol — carries subnet masks in LSAs, supports VLSM + CIDR (vs classful RIPv1/IGRP which assume default Class A/B/C masks)' },
    { label: 'Lightweight vs Autonomous APs', parentTopic: 'Wireless Networking',    objective: '2.4', keyword: 'Autonomous AP (standalone, locally configured) vs Lightweight AP (centrally managed by WLC via CAPWAP/LWAPP) — lightweight wins at scale for unified config + RF coordination' },
    { label: 'TAP (Traffic Access Point)', parentTopic: 'Network Monitoring & Observability', objective: '3.2', keyword: 'TAP — passive inline hardware that copies link traffic to a monitoring port at full fidelity (vs SPAN which can drop under load + filters errors). Optical TAPs are passive splitters with no power on data path.' },
    { label: 'Split Horizon',      parentTopic: 'Routing Protocols',                 objective: '2.1', keyword: 'Split horizon — distance-vector loop prevention: do not advertise a route back out the interface it was learned from. Poison reverse variant advertises with infinite metric instead of silence.' }
  ],

  // ── DOMAIN WEIGHTS (CompTIA N10-009 blueprint) ────────────────────────
  // Used by computeDomainDistribution() to allocate exam questions across
  // the 5 domains per official weights. Sum = 1.00.
  domainWeights: {
    concepts:        0.23, // Domain 1.0 — Networking Concepts
    implementation:  0.20, // Domain 2.0 — Network Implementation
    operations:      0.19, // Domain 3.0 — Network Operations
    security:        0.14, // Domain 4.0 — Network Security
    troubleshooting: 0.24  // Domain 5.0 — Network Troubleshooting
  },

  // Human-readable domain labels (rendered in Analytics, Domain Mastery,
  // exam result breakdowns, etc.)
  domainLabels: {
    concepts:        'Networking Concepts',
    implementation:  'Network Implementation',
    operations:      'Network Operations',
    security:        'Network Security',
    troubleshooting: 'Network Troubleshooting'
  },

  // ── TOPIC → DOMAIN MAP (50 topics) ────────────────────────────────────
  // Drives weak-spot routing, exemplar bank picker, lottery, readiness
  // domain attribution. Topic name = primary key everywhere; domain key
  // is one of: concepts / implementation / operations / security /
  // troubleshooting.
  topicDomains: {
    // Domain 1.0 — Networking Concepts (23%)
    'Network Models & OSI':              'concepts',
    'TCP/IP Basics':                     'concepts',
    'Subnetting & IP Addressing':        'concepts',
    'TCP/IP Applications':               'concepts',
    'Network Naming (DNS & DHCP)':       'concepts',
    'IPv6':                              'concepts',
    'NAT & IP Services':                 'concepts',
    'NTP, ICMP & Traffic Types':         'concepts',
    'Port Numbers':                      'concepts',
    'Virtualisation & Cloud':            'concepts',
    'Cloud Networking & VPCs':           'concepts',
    'Network Appliances & Device Functions': 'concepts',
    'DNS Records & DNSSEC':              'concepts',
    // Domain 2.0 — Network Implementation (20%)
    'Routing Protocols':                 'implementation', // umbrella — kept for history continuity (v4.42.3)
    'OSPF':                              'implementation', // v4.42.3: split from Routing Protocols (blueprint 2.1)
    'BGP':                               'implementation', // v4.42.3: split from Routing Protocols (blueprint 2.1)
    'Switch Features & VLANs':           'implementation', // umbrella — kept for history continuity (v4.42.3)
    'VLAN Trunking':                     'implementation', // v4.42.3: split from Switch Features (blueprint 2.2)
    'STP/RSTP':                          'implementation', // v4.42.3: split from Switch Features (blueprint 2.2)
    'Wireless Networking':               'implementation',
    'Ethernet Basics':                   'implementation',
    'Ethernet Standards':                'implementation',
    'Cabling & Topology':                'implementation',
    'Integrating Networked Devices':     'implementation',
    'SDN, NFV & Automation':             'implementation',
    'Data Center Architectures':         'implementation',
    // Domain 3.0 — Network Operations (19%)
    'Network Operations':                'operations',
    'Data Centres':                      'operations',
    'WAN Connectivity':                  'operations',
    'SD-WAN & SASE':                     'operations',
    'SMB & Network File Services':       'operations',
    'Business Continuity & Disaster Recovery': 'operations',
    'Network Monitoring & Observability': 'operations',
    // Domain 4.0 — Network Security (14%)
    'Securing TCP/IP':                   'security',
    'Protecting Networks':               'security',
    'AAA & Authentication':              'security',
    'IPsec & VPN Protocols':             'security', // umbrella — kept for history continuity (v4.42.3)
    'IPsec VPN':                         'security', // v4.42.3: split from IPsec & VPN Protocols (blueprint 4.4)
    'SSL/TLS VPN':                       'security', // v4.42.3: split from IPsec & VPN Protocols (blueprint 4.4)
    'PKI & Certificate Management':      'security',
    'Firewalls, DMZ & Security Zones':   'security',
    'WPA3 & EAP Authentication':         'security',
    'Network Attacks & Threats':         'security',
    'Physical Security Controls':        'security',
    // Domain 5.0 — Network Troubleshooting (24%)
    'Network Troubleshooting & Tools':   'troubleshooting', // umbrella — kept for history continuity (v4.42.3)
    'Cable Issues':                      'troubleshooting', // v4.42.3: split — blueprint 5.2 (cabling & physical interface issues)
    'Service Issues':                    'troubleshooting', // v4.42.3: split — blueprint 5.3 (network service issues)
    'Perf Issues':                       'troubleshooting', // v4.42.3: split — blueprint 5.4 (performance issues)
    'Connection Issues':                 'troubleshooting', // v4.42.3: split — blueprint 5.5 (tool/protocol selection for connection troubleshooting)
    'CompTIA Troubleshooting Methodology': 'troubleshooting'
  },

  // ── TOPIC RESOURCES (Professor Messer YouTube search URLs + objective numbers) ──
  topicResources: {
    'Network Models & OSI': { obj: '1.1', title: 'OSI Model Overview', search: 'professor+messer+N10-009+OSI+model' },
    'TCP/IP Basics': { obj: '1.1', title: 'TCP/IP Model', search: 'professor+messer+N10-009+TCP+IP+suite' },
    'Subnetting & IP Addressing': { obj: '1.4', title: 'IP Addressing & Subnetting', search: 'professor+messer+N10-009+subnetting' },
    'Routing Protocols': { obj: '1.4', title: 'Routing Protocols', search: 'professor+messer+N10-009+routing+protocols' },
    'TCP/IP Applications': { obj: '1.5', title: 'TCP/IP Applications', search: 'professor+messer+N10-009+TCP+IP+applications' },
    'Network Naming (DNS & DHCP)': { obj: '1.6', title: 'DNS & DHCP', search: 'professor+messer+N10-009+DNS+DHCP' },
    'Securing TCP/IP': { obj: '4.1', title: 'Securing TCP/IP', search: 'professor+messer+N10-009+securing+TCP+IP' },
    'Switch Features & VLANs': { obj: '2.1', title: 'Switches & VLANs', search: 'professor+messer+N10-009+switch+VLAN' },
    'IPv6': { obj: '1.4', title: 'IPv6 Addressing', search: 'professor+messer+N10-009+IPv6' },
    'WAN Connectivity': { obj: '1.2', title: 'WAN Technologies', search: 'professor+messer+N10-009+WAN+connectivity' },
    'Wireless Networking': { obj: '2.4', title: 'Wireless Standards', search: 'professor+messer+N10-009+wireless+networking' },
    'Virtualisation & Cloud': { obj: '1.8', title: 'Virtualisation & Cloud', search: 'professor+messer+N10-009+virtualization+cloud' },
    'Data Centres': { obj: '3.3', title: 'Data Centre Infrastructure', search: 'professor+messer+N10-009+data+center' },
    'Network Operations': { obj: '3.1', title: 'Network Operations', search: 'professor+messer+N10-009+network+operations' },
    'Protecting Networks': { obj: '4.1', title: 'Network Security', search: 'professor+messer+N10-009+protecting+networks' },
    'Cabling & Topology': { obj: '1.3', title: 'Cabling & Topology', search: 'professor+messer+N10-009+cabling+topology' },
    'Ethernet Basics': { obj: '1.3', title: 'Ethernet Fundamentals', search: 'professor+messer+N10-009+ethernet+basics' },
    'Ethernet Standards': { obj: '1.3', title: 'Ethernet Standards', search: 'professor+messer+N10-009+ethernet+standards' },
    'SD-WAN & SASE': { obj: '1.2', title: 'SD-WAN & SASE', search: 'professor+messer+N10-009+SD-WAN+SASE' },
    'Integrating Networked Devices': { obj: '2.1', title: 'Networked Devices & IoT', search: 'professor+messer+N10-009+IoT+networked+devices' },
    'Network Troubleshooting & Tools': { obj: '5.1', title: 'Troubleshooting Tools', search: 'professor+messer+N10-009+troubleshooting+tools' },
    'NAT & IP Services': { obj: '1.4', title: 'NAT & IP Services', search: 'professor+messer+N10-009+NAT' },
    'AAA & Authentication': { obj: '4.1', title: 'AAA & Authentication', search: 'professor+messer+N10-009+AAA+RADIUS+TACACS' },
    'NTP, ICMP & Traffic Types': { obj: '1.5', title: 'NTP, ICMP & Traffic', search: 'professor+messer+N10-009+NTP+ICMP' },
    'IPsec & VPN Protocols': { obj: '4.4', title: 'IPsec & VPN', search: 'professor+messer+N10-009+IPsec+VPN' },
    'SMB & Network File Services': { obj: '1.5', title: 'SMB & File Services', search: 'professor+messer+N10-009+SMB+NFS+file+services' },
    'Cloud Networking & VPCs': { obj: '1.8', title: 'Cloud Networking & VPCs', search: 'professor+messer+N10-009+cloud+networking+VPC' },
    'Port Numbers': { obj: '1.5', title: 'Port Numbers', search: 'professor+messer+N10-009+port+numbers' },
    'PKI & Certificate Management': { obj: '4.3', title: 'PKI & Certificates', search: 'professor+messer+N10-009+PKI+certificates' },
    'CompTIA Troubleshooting Methodology': { obj: '5.1', title: '7-Step Methodology', search: 'professor+messer+N10-009+troubleshooting+methodology' },
    'Firewalls, DMZ & Security Zones': { obj: '4.1', title: 'Firewalls & DMZ', search: 'professor+messer+N10-009+firewall+DMZ+security+zones' },
    'WPA3 & EAP Authentication': { obj: '4.3', title: 'WPA3 & EAP', search: 'professor+messer+N10-009+WPA3+EAP+authentication' },
    'SDN, NFV & Automation': { obj: '1.8', title: 'SDN & Automation', search: 'professor+messer+N10-009+SDN+NFV+automation' },
    'Network Attacks & Threats': { obj: '4.2', title: 'Network Attacks & Threats', search: 'professor+messer+N10-009+network+attacks' },
    'Business Continuity & Disaster Recovery': { obj: '3.3', title: 'BCDR & Failover', search: 'professor+messer+N10-009+disaster+recovery+HA' },
    'Network Monitoring & Observability': { obj: '3.2', title: 'Monitoring & SNMP', search: 'professor+messer+N10-009+SNMP+network+monitoring' },
    'Network Appliances & Device Functions': { obj: '1.2', title: 'Network Appliances', search: 'professor+messer+N10-009+network+appliances' },
    'Data Center Architectures': { obj: '1.8', title: 'DC Architectures', search: 'professor+messer+N10-009+three+tier+spine+leaf+data+center' },
    'Physical Security Controls': { obj: '4.5', title: 'Physical Security', search: 'professor+messer+N10-009+physical+security' },
    'DNS Records & DNSSEC': { obj: '1.6', title: 'DNS Records & DNSSEC', search: 'professor+messer+N10-009+DNS+records+DNSSEC' },
    // ── v4.42.3: catalog expansion (blueprint-anchored splits) ────────────
    'OSPF':              { obj: '2.1', title: 'OSPF',               search: 'professor+messer+N10-009+OSPF' },
    'BGP':               { obj: '2.1', title: 'BGP',                search: 'professor+messer+N10-009+BGP' },
    'VLAN Trunking':     { obj: '2.2', title: 'VLAN Trunking',      search: 'professor+messer+N10-009+VLAN+trunking+802.1Q' },
    'STP/RSTP':          { obj: '2.2', title: 'Spanning Tree',      search: 'professor+messer+N10-009+spanning+tree+STP+RSTP' },
    'IPsec VPN':         { obj: '4.4', title: 'IPsec VPN',          search: 'professor+messer+N10-009+IPsec+VPN+IKE' },
    'SSL/TLS VPN':       { obj: '4.4', title: 'SSL/TLS VPN',        search: 'professor+messer+N10-009+SSL+TLS+client+VPN' },
    'Cable Issues':      { obj: '5.2', title: 'Cable & Physical Issues', search: 'professor+messer+N10-009+cable+physical+issues' },
    'Service Issues':    { obj: '5.3', title: 'Network Service Issues',  search: 'professor+messer+N10-009+network+service+troubleshooting' },
    'Perf Issues':       { obj: '5.4', title: 'Performance Issues', search: 'professor+messer+N10-009+network+performance+issues' },
    'Connection Issues': { obj: '5.5', title: 'Connection Troubleshooting', search: 'professor+messer+N10-009+TCP+IP+connection+troubleshooting' }
  },

  // ── GROUND TRUTH TABLES ───────────────────────────────────────────────
  // Static Network+ facts. Dual-layer pattern: used both for prompt
  // injection (Tier A) AND programmatic reject in validateQuestions().
  gt: {
    // Protocol → port number
    ports: {
      ftp: 21, ssh: 22, telnet: 23, smtp: 25, dns: 53, tftp: 69,
      http: 80, pop3: 110, ntp: 123, imap: 143, snmp: 161,
      ldap: 389, https: 443, smb: 445, syslog: 514, smtps: 465,
      ldaps: 636, ftps: 990, imaps: 993, pop3s: 995,
      rdp: 3389, mysql: 3306, sip: 5060, sqlserver: 1433,
      mssql: 1433, dhcp: 67, kerberos: 88
    },

    // Protocol → OSI layer
    osi: {
      // L7
      http: 7, https: 7, ftp: 7, sftp: 7, smtp: 7, pop3: 7, imap: 7,
      dns: 7, dhcp: 7, snmp: 7, telnet: 7, ssh: 7, ntp: 7, tftp: 7, ldap: 7,
      // L4
      tcp: 4, udp: 4,
      // L3
      ip: 3, ipv4: 3, ipv6: 3, icmp: 3, ospf: 3, bgp: 3, eigrp: 3, rip: 3, igmp: 3,
      // L2
      ethernet: 2, arp: 2, ppp: 2, stp: 2
    },

    // Wireless encryption: broken = reject if marked as secure/recommended
    wifiBroken: ['wep'],
    wifiDeprecated: ['wpa'], // original WPA (not WPA2/3)

    // Ethernet physical-layer conflation traps (v4.38.6).
    // Haiku (and occasionally Sonnet) conflate auto-negotiation with
    // Auto-MDIX because they're co-marketed on modern gear. They are
    // distinct features. Every entry here is a (topic, correct feature)
    // truth pair stuffed in as AUTHORITATIVE FACTS by the teacher prompt.
    ethernet: {
      'auto-negotiation': 'negotiates SPEED and DUPLEX only (IEEE 802.3u clause 28). It does NOT detect cable pinout or MDI/MDIX.',
      'auto-mdix': 'detects MDI/MDIX pin assignments and automatically swaps TX/RX so straight-through and crossover cables are interchangeable (IEEE 802.3ab clause 40). This is a DIFFERENT feature from auto-negotiation.',
      'mdi/mdix': 'MDI/MDIX pin assignment detection is handled by Auto-MDIX, not auto-negotiation. Auto-negotiation only handles speed and duplex.',
      'straight-through vs crossover': 'Auto-MDIX (not auto-negotiation) is the feature that lets devices work with either cable type automatically.',
      'duplex mismatch': 'A duplex mismatch causes late collisions and runt frames on the half-duplex side, and FCS/CRC errors on the full-duplex side. Fix by setting both ends to auto-negotiate or both to the same fixed duplex.',
      'PoE standards': 'PoE (802.3af) = 15.4W, PoE+ (802.3at) = 30W, PoE++ / 4PPoE (802.3bt Type 3) = 60W, 802.3bt Type 4 = 100W. All power is sourced at the PSE (switch/injector), measured at the PD minus cable loss.'
    }
  },
};
