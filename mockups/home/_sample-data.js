/* ============================================================
   CertAnvil · Cert Home Page redesign — shared sample data
   ------------------------------------------------------------
   Production-true fixture so all five mockups render identical
   numbers. Mirrors the real setup-page accessors:
   getReadinessScore() (predicted / passProbability / ciHalfWidth /
   lowerBound / upperBound / whatIf / daysToExam / targetGap),
   applyPreset() session presets, applyDomainPreset() domain
   quick-picks (N10-009 official weights), and the custom-quiz
   configurator (topic catalog, difficulties, counts).

   Story: a learner sitting at 553 of 900, eighteen days out, six
   short of nothing and 167 short of the 720 pass mark. The score
   counts up, the bar fills to ~30%, and the hand-drawn stamp reads
   "167 pts to pass". Network Security (38%) is the weakest domain,
   so the highest-leverage drills point there.

   Bar geometry (faithful to renderReadinessCardV2):
     barPct     = ((predicted - 420) / 450) * 100   // 553 -> 29.56
     passTickPct= ((720      - 420) / 450) * 100     // 720 -> 66.67

   Exposes window.HOME_SAMPLE.
   ============================================================ */
(function () {
  'use strict';

  // ── Cert identity ──
  const cert = {
    name: 'Network+',
    code: 'N10-009',
    vendor: 'CompTIA',
    learner: 'Simi',
  };

  // ── Readiness hero (the keeper) ──
  const PASS = 720;
  const PREDICTED = 553;
  const readiness = {
    predicted: PREDICTED,
    passScore: PASS,
    passProbability: 0.05,        // -> "5% pass probability"
    ciHalfWidth: 96,              // -> "± 96 pts"
    lowerBound: 457,
    upperBound: 649,              // -> "range 457-649"
    pointsToPass: PASS - PREDICTED, // 167  -> stamp "167 pts to pass"
    daysToExam: 18,
    examDate: '2026-06-22',
    targetGap: 196,               // +pts for a confident pass (CI clears the line)
    tier: 'Building',             // <500 Not Ready, <650 Building, <720 Getting Close, else Exam Ready
    barPct: ((PREDICTED - 420) / 450) * 100,     // 29.56
    passTickPct: ((PASS - 420) / 450) * 100,     // 66.67
    // what-if chips: drill these topics to move the score (live shape)
    whatIf: [
      { topic: 'Subnetting & IP Addressing', deltaPredicted: 16, currentPct: 44 },
      { topic: 'Network Security',            deltaPredicted: 12, currentPct: 38 },
      { topic: 'OSPF',                        deltaPredicted: 9,  currentPct: 52 },
    ],
  };

  // ── Today / streak (continue + return state) ──
  const momentum = {
    todayDone: 12,
    todayGoal: 20,
    streakCurrent: 6,
    streakLongest: 19,
    questionsTotal: 1284,
    lastStudy: 'Yesterday',
    // pick-up-where-you-left-off context
    resume: {
      topic: 'Network Security',
      label: 'Finish your Network Security set',
      context: '7 of 10 done, 3 questions left from yesterday',
    },
  };

  // ── Session presets (faithful to applyPreset / live #modes-ladder) ──
  // group: quick | practice | exam ; action = the live onclick target
  const presets = [
    // Quick · 3-5 min
    { id: 'warmup',  group: 'quick', title: '5-min Warmup',     meta: '5 questions, foundational',           minutes: 5,  action: "applyPreset('warmup')" },
    { id: 'daily',   group: 'quick', title: 'Daily Challenge',  meta: '1 question, about a minute, streak +1', minutes: 1,  action: 'startDailyChallenge()' },
    { id: 'mistakes',group: 'quick', title: 'Drill Mistakes',   meta: '14 wrong answers saved',               minutes: 8,  action: 'startWrongDrill()' },
    // Practice · 10-30 min
    { id: 'focused', group: 'practice', title: '15-min Weak Spots', meta: '10 questions, exam level, your weakest topic', minutes: 15, action: "applyPreset('focused')", recommended: true },
    { id: 'grind',   group: 'practice', title: '20-min Deep Scan',  meta: '20 questions, exam level, mixed',               minutes: 20, action: "applyPreset('grind')" },
    { id: 'bulk30',  group: 'practice', title: '30 Questions',      meta: 'Marathon mixed, about 25 min',                 minutes: 25, action: "applyPreset('bulk30')" },
    { id: 'bulk45',  group: 'practice', title: '45 Questions',      meta: 'Marathon mixed, about 38 min',                 minutes: 38, action: "applyPreset('bulk45')" },
    { id: 'custom',  group: 'practice', title: 'Custom Quiz',       meta: 'Tune topic, difficulty, length',               minutes: 0,  action: '_jumpToCustomQuiz()', isCustom: true },
    // Exam simulation · 60-90 min
    { id: 'bulk60',  group: 'exam', title: '60-Question SIM',    meta: 'Closest to the real thing, no timer', minutes: 55, action: "applyPreset('bulk60')" },
    { id: 'fullexam',group: 'exam', title: 'Full Exam Simulator', meta: '90 questions, 90-min timer, scored 100-900', minutes: 90, action: 'startExam()' },
  ];

  const groups = {
    quick:    { key: 'Quick',           range: '3-5 min',   note: 'A daily habit that keeps your streak' },
    practice: { key: 'Practice',        range: '10-30 min', note: 'Focused study on your weak spots' },
    exam:     { key: 'Exam simulation', range: '60-90 min', note: 'Pressure-test your readiness, scored 100-900' },
  };

  // ── Domain quick-pick (N10-009 official weights + per-domain mastery) ──
  // action = live applyDomainPreset(id); each is "10 Qs, Exam Level".
  const domains = [
    { idx: 1, id: 'concepts',        num: '1.0', name: 'Networking Concepts',     weight: 23, mastery: 71, action: "applyDomainPreset('concepts')" },
    { idx: 2, id: 'implementation',  num: '2.0', name: 'Network Implementation',  weight: 20, mastery: 58, action: "applyDomainPreset('implementation')" },
    { idx: 3, id: 'operations',      num: '3.0', name: 'Network Operations',      weight: 19, mastery: 64, action: "applyDomainPreset('operations')" },
    { idx: 4, id: 'security',        num: '4.0', name: 'Network Security',        weight: 14, mastery: 38, action: "applyDomainPreset('security')" },
    { idx: 5, id: 'troubleshooting', num: '5.0', name: 'Network Troubleshooting', weight: 24, mastery: 61, action: "applyDomainPreset('troubleshooting')" },
  ];
  function masteryTier(pct) {
    if (pct >= 80) return 'mastered';
    if (pct >= 70) return 'proficient';
    if (pct >= 55) return 'developing';
    if (pct > 0)   return 'novice';
    return 'unstudied';
  }
  domains.forEach(d => { d.tier = masteryTier(d.mastery); });

  // ── Custom-quiz configurator ──
  // Two always-on modes + per-domain topic catalog, difficulties, counts.
  const customQuiz = {
    modes: [
      { id: 'smart', title: 'Smart',  sub: 'AI picks your weak spots',      recommended: true },
      { id: 'mixed', title: 'Mixed',  sub: 'Random across every topic',     selected: true },
    ],
    difficulties: [
      { id: 'foundational', label: 'Foundational', sub: 'Learn the ground' },
      { id: 'exam',         label: 'Exam Level',   sub: 'Real test weight', selected: true },
      { id: 'hard',         label: 'Hard',         sub: 'Push past comfort' },
    ],
    counts: [5, 10, 15, 20, 30, 45],
    defaultCount: 10,
    topicsByDomain: [
      { num: '1.0', name: 'Networking Concepts', weight: 23, topics: [
        'Network Models & OSI', 'TCP/IP Basics', 'Subnetting & IP Addressing', 'TCP/IP Applications',
        'DNS & DHCP', 'IPv6', 'NAT & IP Services', 'Ports & Protocols', 'Virtualisation & Cloud', 'Network Appliances',
      ] },
      { num: '2.0', name: 'Network Implementation', weight: 20, topics: [
        'Routing Protocols', 'OSPF', 'BGP', 'Switches & VLANs', 'VLAN Trunking',
        'STP/RSTP', 'Wireless Networking', 'Ethernet Standards', 'Cabling & Topology', 'SDN & Automation',
      ] },
      { num: '3.0', name: 'Network Operations', weight: 19, topics: [
        'Network Operations', 'Data Centres', 'WAN Connectivity', 'SD-WAN & SASE',
        'BCDR & Failover', 'Monitoring & SNMP', 'SMB & File Services',
      ] },
      { num: '4.0', name: 'Network Security', weight: 14, topics: [
        'Firewalls', 'VPN & Tunneling', 'Access Control', 'Network Hardening',
        'Threat Vectors', 'Authentication', 'Wireless Security', 'Physical Security',
      ] },
      { num: '5.0', name: 'Network Troubleshooting', weight: 24, topics: [
        'Cable Testing', 'Connectivity Issues', 'Latency & Jitter', 'Hardware Faults',
        'Command Line Tools', 'Packet Capture', 'Routing Issues',
      ] },
    ],
  };

  window.HOME_SAMPLE = { cert, readiness, momentum, presets, groups, domains, customQuiz, PASS };
})();
