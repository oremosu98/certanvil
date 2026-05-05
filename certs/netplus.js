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
};
