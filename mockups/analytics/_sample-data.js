/* ============================================================
   CertAnvil · Analytics redesign — shared sample data
   ------------------------------------------------------------
   Production-true fixture so all five mockups render identical
   numbers. Mirrors the real renderAnalytics() data shapes:
   readiness (0-900 scale, 720 cutoff, forecast), the pass-trend
   accuracy series (week/month/all, 72% pass line), 50 topics
   across the 5 N10-009 domains for the constellation, domain
   rollups with official exam weights, streak + 365-day heatmap,
   milestones, exam-vs-quiz, wrong-answer patterns, difficulty.

   Story: a learner who is "Getting Close" — predicted 688 of 900,
   33 short of the 720 pass mark, but trending up; forecast 731
   crosses the line if the pace holds. Weakest domain is Network
   Security, so the highest-leverage action points there.

   Exposes window.ANALYTICS_SAMPLE.
   ============================================================ */
(function () {
  'use strict';

  // ---- deterministic PRNG (mulberry32), mirrors constellation.js ----
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── Readiness (0-900 display scale; bar internally framed 420-870) ──
  const PASS = 720;
  const readiness = {
    predicted: 688,
    passScore: PASS,
    forecast: 731,            // projected score on current pace
    daysToExam: 24,
    examDate: '2026-06-28',
    tier: 'Getting Close',    // >=720 Exam Ready, >=650 Getting Close, >=500 Building, else Not Ready
    pointsToPass: PASS - 688, // 32
    // bar geometry used live: barPct = ((predicted-420)/450)*100; passTick = (720-420)/450
    barPct: ((688 - 420) / 450) * 100,        // 59.6
    passTickPct: ((PASS - 420) / 450) * 100,  // 66.67
    stats: {
      sessions: 47,
      questions: 1284,
      accuracy: 71,
      studyDays: 38,
    },
    // ~12-week sparkline trend per stat (for the hero stat cards)
    spark: {
      sessions:  [1, 2, 2, 3, 4, 3, 5, 4, 6, 5, 7, 6],
      questions: [22, 41, 38, 60, 84, 71, 110, 96, 132, 118, 160, 142],
      accuracy:  [58, 61, 60, 64, 63, 67, 69, 68, 70, 72, 71, 74],
      studyDays: [2, 3, 3, 4, 4, 3, 5, 4, 5, 4, 5, 5],
    },
  };

  // ── Pass-trend accuracy series (the keeper graph) ──
  // 72% pass line. Three ranges; month is the default. The "all" arc
  // climbs from novice toward and just past the pass line.
  const passTrend = {
    passAcc: 72,
    yMin: 52, yMax: 96,
    current: 'month',
    data: {
      week: [
        { acc: 67, label: 'Mon' }, { acc: 70, label: 'Tue' }, { acc: 69, label: 'Wed' },
        { acc: 73, label: 'Thu' }, { acc: 72, label: 'Fri' }, { acc: 76, label: 'Sat' },
        { acc: 74, label: 'Sun' },
      ],
      month: [
        { acc: 61, label: 'W1' }, { acc: 63, label: '' }, { acc: 66, label: 'W2' },
        { acc: 65, label: '' }, { acc: 69, label: 'W3' }, { acc: 71, label: '' },
        { acc: 70, label: 'W4' }, { acc: 73, label: '' }, { acc: 74, label: 'W5' },
        { acc: 74, label: 'Now' },
      ],
      all: [
        { acc: 54, label: '' }, { acc: 57, label: '' }, { acc: 56, label: '' },
        { acc: 60, label: '' }, { acc: 62, label: '' }, { acc: 61, label: '' },
        { acc: 65, label: '' }, { acc: 64, label: '' }, { acc: 67, label: '' },
        { acc: 69, label: '' }, { acc: 68, label: '' }, { acc: 71, label: '' },
        { acc: 70, label: '' }, { acc: 72, label: '' }, { acc: 73, label: '' },
        { acc: 74, label: 'Now' },
      ],
    },
  };

  // ── 5 N10-009 domains (official exam weights) + raw accuracy rollups ──
  // Tiers live: >=80 Mastered, >=70 Proficient, >=55 Developing, else Novice.
  const domains = [
    { idx: 1, id: 'concepts',        num: '1.0', name: 'Networking Concepts',     weight: 23, accuracy: 82, questions: 318 },
    { idx: 2, id: 'implementation',  num: '2.0', name: 'Network Implementation',  weight: 20, accuracy: 74, questions: 264 },
    { idx: 3, id: 'operations',      num: '3.0', name: 'Network Operations',      weight: 19, accuracy: 69, questions: 231 },
    { idx: 4, id: 'security',        num: '4.0', name: 'Network Security',        weight: 14, accuracy: 58, questions: 176 },
    { idx: 5, id: 'troubleshooting', num: '5.0', name: 'Network Troubleshooting', weight: 24, accuracy: 71, questions: 295 },
  ];
  function tierOf(pct) {
    if (pct >= 80) return 'mastered';
    if (pct >= 70) return 'proficient';
    if (pct >= 55) return 'developing';
    if (pct > 0)   return 'novice';
    return 'unstudied';
  }
  domains.forEach(d => { d.tier = tierOf(d.accuracy); });

  // ── 50 topics for the constellation (10 per domain) ──
  // Deterministic field; each topic's mastery is biased toward its domain
  // rollup so the sky and the domain bars agree. ~30% unstudied for texture.
  const TOPIC_NAMES = [
    'OSI Model', 'TCP/IP Suite', 'Ports & Protocols', 'IP Addressing', 'Subnetting',
    'Cabling & Media', 'Network Topologies', 'Cloud Models', 'Ethernet Switching', 'Routing Fundamentals',
    'VLANs & Trunking', 'Wireless Standards', 'Network Services', 'DHCP & DNS', 'NAT & PAT',
    'IPv6 Concepts', 'SDN Basics', 'Load Balancing', 'Network Monitoring', 'SNMP & Logging',
    'QoS & Traffic Shaping', 'Documentation', 'Change Management', 'High Availability', 'Disaster Recovery',
    'Firewalls', 'VPN & Tunneling', 'Access Control', 'Network Hardening', 'Threat Vectors',
    'Authentication', 'Encryption Basics', 'Wireless Security', 'Physical Security', 'Zero Trust',
    'Cable Testing', 'Connectivity Issues', 'Latency & Jitter', 'Hardware Faults', 'Software Tools',
    'Command Line', 'Packet Capture', 'DNS Troubleshooting', 'Routing Issues', 'Performance Tuning',
    'Interface Errors', 'Spanning Tree', 'Network Baselines', 'Wireless Survey', 'Escalation',
  ];
  function buildTopics() {
    const rand = mulberry32(20260604);
    const out = [];
    domains.forEach((dom, d) => {
      const center = dom.accuracy; // bias topic mastery toward the domain rollup
      for (let k = 0; k < 10; k++) {
        const roll = rand();
        let attempts, mastery;
        if (roll < 0.30) {            // unstudied
          attempts = 0; mastery = 0;
        } else {
          // spread around the domain center, clamped 18..98
          const spread = (rand() - 0.5) * 46;
          mastery = Math.max(18, Math.min(98, Math.round(center + spread)));
          attempts = 3 + Math.floor(rand() * Math.max(4, mastery / 3));
        }
        out.push({
          domainIdx: d + 1,
          domainId: dom.id,
          topic: TOPIC_NAMES[d * 10 + k],
          attempts,
          mastery,
          tier: tierOf(mastery),
          _i: k,
        });
      }
    });
    return out;
  }
  const topics = buildTopics();

  // ── Why-this-score diagnosis + highest-leverage action ──
  const whyScore = {
    headline: 'Drill Network Security next.',
    body: 'Network Security sits at 58%, the only domain still in developing range, and it carries 14% of the exam. Lifting it to the 70% line is worth about 18 points on your readiness score, the fastest single move you have right now.',
    leverage: '+18 pts',
    targetDomain: 'Network Security',
    factors: [
      { label: 'Network Security at 58%', effect: 'down', note: 'biggest drag on the score' },
      { label: 'Networking Concepts at 82%', effect: 'up', note: 'carrying you, 23% of exam' },
      { label: 'Accuracy trending up 6 weeks', effect: 'up', note: '61% to 74%' },
    ],
  };

  // ── Wrong-answer patterns ──
  const wrongPatterns = [
    { label: 'Subnet boundary math',      count: 23, domain: 'Networking Concepts', note: 'CIDR to host-range conversions' },
    { label: 'Port-to-protocol recall',   count: 17, domain: 'Network Security',    note: 'mixing 989/990, 636, 3389' },
    { label: 'Wireless standards',        count: 14, domain: 'Network Implementation', note: '802.11ax bands and width' },
    { label: 'Firewall rule order',       count: 11, domain: 'Network Security',    note: 'implicit deny placement' },
  ];

  // ── Difficulty breakdown ──
  const difficulty = [
    { label: 'Easy',   accuracy: 86, count: 512 },
    { label: 'Medium', accuracy: 70, count: 561 },
    { label: 'Hard',   accuracy: 54, count: 211 },
  ];

  // ── Study streak + 7-day week + 365-day heatmap ──
  function buildHeatmap() {
    const rand = mulberry32(771);
    const days = [];
    for (let i = 364; i >= 0; i--) {
      const r = rand();
      let count = 0;
      if (i < 16) count = 0; // most recent fortnight has a gap mid-way for realism
      if (i < 120) {         // ramp up activity over the last ~4 months
        if (r > 0.42) count = Math.floor(rand() * 38) + 2;
      } else if (i < 240) {
        if (r > 0.66) count = Math.floor(rand() * 22) + 1;
      } else {
        if (r > 0.85) count = Math.floor(rand() * 10) + 1;
      }
      days.push({ daysAgo: i, count });
    }
    // guarantee an active recent streak of 6 days ending today
    for (let i = 0; i < 6; i++) days[days.length - 1 - i].count = 14 + i * 3;
    return days;
  }
  const heatmap = buildHeatmap();
  const week = (function () {
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    // last 7 of heatmap, today rightmost
    return heatmap.slice(-7).map((d, i) => ({
      dayLabel: labels[i],
      studied: d.count > 0,
      isToday: i === 6,
      questions: d.count,
    }));
  })();
  const streak = {
    current: 6,
    longest: 19,
    heatTier: 'warm',       // cold / starting / warm / hot / blazing (0/<3/<7/<14/14+)
    lastStudy: 'Today',
    totalActiveDays: heatmap.filter(d => d.count > 0).length,
    week,
  };

  // ── Milestones / badges ──
  const milestones = {
    unlocked: 11,
    total: 18,
    recent: [
      { label: 'Century Club',   desc: 'Answered 1,000 questions',        icon: 'M5 13l4 4L19 7', earned: 'Earned 3 days ago' },
      { label: 'Week Warrior',   desc: 'Studied 7 days in a row',         icon: 'M12 2v20M2 12h20', earned: 'Earned last week' },
      { label: 'Domain Master',  desc: 'Hit 80% in a domain',             icon: 'M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z', earned: 'Earned May 28' },
      { label: 'Sharp Shooter',  desc: '90%+ on a 25-question quiz',      icon: 'M12 12m-9 0a9 9 0 1018 0a9 9 0 10-18 0', earned: 'Earned May 21' },
    ],
    locked: [
      { label: 'Exam Ready',     desc: 'Reach a 720 readiness score',     progress: [688, 720] },
      { label: 'Marathoner',     desc: 'Study 30 days in a row',          progress: [6, 30] },
      { label: 'Full Sky',       desc: 'Study every one of the 50 topics', progress: [35, 50] },
    ],
  };

  // ── Exam history (full simulations) + exam-vs-quiz ──
  const examHistory = [
    { date: 'Jun 1',  label: 'Full exam #6', pct: 76, score: 712, questions: 90, mode: 'exam' },
    { date: 'May 25', label: 'Full exam #5', pct: 72, score: 684, questions: 90, mode: 'exam' },
    { date: 'May 17', label: 'Full exam #4', pct: 68, score: 651, questions: 90, mode: 'exam' },
    { date: 'May 9',  label: 'Full exam #3', pct: 64, score: 612, questions: 90, mode: 'exam' },
    { date: 'Apr 30', label: 'Full exam #2', pct: 59, score: 568, questions: 90, mode: 'exam' },
  ];
  const examVsQuiz = {
    quizAvg: 73,
    examAvg: 68,
    quizSessions: 42,
    examSessions: 6,
    delta: 5,
    insight: 'Your practice average beats your timed-exam average by 5 points. Timed pressure is costing you a little, so book more full simulations before the real thing.',
  };

  // ── Recent sessions (history panel) ──
  const recent = [
    { date: 'Today',  topic: 'Network Security',    pct: 64, n: 25, mode: 'quiz' },
    { date: 'Today',  topic: 'Full exam #6',        pct: 76, n: 90, mode: 'exam' },
    { date: 'Jun 3',  topic: 'Subnetting',          pct: 88, n: 20, mode: 'quiz' },
    { date: 'Jun 3',  topic: 'VPN & Tunneling',     pct: 60, n: 15, mode: 'quiz' },
    { date: 'Jun 2',  topic: 'Routing Fundamentals', pct: 80, n: 25, mode: 'quiz' },
  ];

  window.ANALYTICS_SAMPLE = {
    readiness, passTrend, domains, topics, TOPIC_NAMES,
    whyScore, wrongPatterns, difficulty, streak, heatmap,
    milestones, examHistory, examVsQuiz, recent,
    mulberry32,
  };
})();
