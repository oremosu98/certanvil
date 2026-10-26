#!/usr/bin/env node
// scripts/lift-sbs.js — Lift A fidelity gate: the real phone screens next to the June E2E.
// Spec: docs/superpowers/specs/2026-10-19-ios-launch-june-design.md (Fidelity rule).
//
// Usage:
//   1. Serve this repo:            python3 -m http.server 3199 --bind 127.0.0.1
//   2. Serve the E2E mockups:      (in a feat/cert-ios-e2e checkout) python3 -m http.server 3207 --directory mockups
//   3. node scripts/lift-sbs.js    → test-results/lift-a-sbs/<screen>-<theme>.png (E2E left, real right)
//
// Localhost only: the real app runs with tests/fixtures/fake-supabase.js (a fake signed-in
// session) and every non-localhost request is aborted. Never point this at prod.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'test-results', process.env.LIFT_OUT || 'lift-sbs');
const APP = process.env.LIFT_APP || 'http://127.0.0.1:3199/';
const E2E = process.env.LIFT_E2E || 'http://localhost:3207/';
const FAKE = fs.readFileSync(path.join(ROOT, 'tests/fixtures/fake-supabase.js'), 'utf8');
// Compare at the device width (402pt iPhone 17 Pro): the app-wide zoom makes 390 wrap lines the device does not.
const VP = { width: +(process.env.LIFT_W || 402), height: +(process.env.LIFT_H || 874) };

const TOPICS = ['Ethernet Basics', 'Subnetting', 'DNS', 'DHCP', 'VLANs', 'Routing Protocols', 'Wireless Standards', 'Network Security Basics'];
const HISTORY = Array.from({ length: 24 }, (_, i) => {
  const sc = [6, 7, 5, 8, 9, 6, 7, 8][i % 8];
  return { date: new Date(Date.now() - (i + 1) * 864e5 * 0.7).toISOString(), topic: TOPICS[i % 8], difficulty: 'Exam Level', score: sc, total: 10, pct: sc * 10, mode: 'quiz' };
});
const QS = [
  { type: 'mcq', question: 'A network administrator is deploying a DHCP server and needs to ensure that a critical server always receives the same IP address. Which DHCP feature should be configured?',
    scenario: "The server's MAC address is known, and it must remain on the same subnet for monitoring and backup systems to function correctly.",
    options: { A: 'DHCP option 66 to specify the TFTP server address', B: "DHCP reservation to bind the server's MAC address to a specific IP", C: 'DHCP option 51 to extend the lease time indefinitely', D: 'DHCP snooping to prevent unauthorised DHCP servers on the network' },
    answer: 'B', explanation: 'DHCP reservation ties a specific MAC address to a fixed IP address within the DHCP scope, ensuring the server always receives the same IP while remaining centrally managed by DHCP.',
    topic: 'DNS & DHCP', difficulty: 'Exam Level' },
].concat([2, 3, 4, 5].map(n => ({ type: 'mcq', question: 'Sample question ' + n + '?', options: { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta' }, answer: 'A', explanation: 'Because.', topic: 'DNS & DHCP', difficulty: n % 2 ? 'Foundational' : 'Exam Level' })));

// [name, E2E file + query, real-app driver]
const SCREENS = [
  ['home', 'cert-ios-home.html', null],
  ['quiz-question', 'cert-ios-quiz.html', 'q'],
  ['quiz-answered', 'cert-ios-quiz.html?v=ans', 'ans'],
  ['results', 'cert-ios-results.html', 'res'],
  ['review-answers', 'cert-ios-review-answers.html', 'rev'],
  ['custom-quiz', 'cert-ios-custom-quiz.html', 'cq'],
  // Lift B1 (21 Oct)
  ['progress', 'cert-ios-progress.html', 'prog'],
  ['progress-domain', 'cert-ios-progress.html?p=1', 'prog-1'],
  ['progress-insights', 'cert-ios-progress.html?p=6', 'prog-6'],
  ['analytics', 'cert-ios-analytics.html', 'ana'],
  ['analytics-map', 'cert-ios-analytics.html?p=1', 'ana-1'],
  ['analytics-wins', 'cert-ios-analytics.html?p=5', 'ana-5'],
  ['review', 'cert-ios-review.html', 'srv'],
  ['review-done', 'cert-ios-review.html?v=done', 'srv-done'],
  // Lift B2 (21 Oct): the exam and its results
  ['exam', 'cert-ios-exam.html', 'ex'],
  ['exam-paused', 'cert-ios-exam.html?v=paused', 'ex-paused'],
  ['exam-end', 'cert-ios-exam.html?v=jump', 'ex-end'],
  ['exam-leave', 'cert-ios-exam.html?v=leave', 'ex-leave'],
  ['exam-pbq', 'cert-ios-exam.html?v=pbq', 'ex-pbq'],
  ['exam-results', 'cert-ios-exam-results.html', 'ex-res'],
  // Lift B3a (22 Oct): the Drills tab
  ['drills', 'cert-ios-drills.html', 'dr'],
  ['drills-free', 'cert-ios-drills.html?v=free', 'dr-free'],
  ['drills-empty', 'cert-ios-drills.html?v=empty', 'dr-empty'],
  ['drills-dl', 'cert-ios-drills.html?v=dl', 'dr-dl'],
  // Lift B3b1 (22 Oct): practice Sim Lab (free user; fixed seeds for the reference kinds)
  ['sl-entry', 'cert-ios-simlab.html', 'sl-entry'],
  ['sl-loading', 'cert-ios-simlab.html?v=loading', 'sl-loading'],
  ['sl-round', 'cert-ios-simlab.html?v=round', 'sl-round'],
  ['sl-reset', 'cert-ios-simlab.html?v=reset', 'sl-reset'],
  ['sl-map', 'cert-ios-simlab.html?v=round-map', 'sl-map'],
  ['sl-enlarge', 'cert-ios-simlab.html?v=enlarge', 'sl-enlarge'],
  ['sl-verdict', 'cert-ios-simlab.html?v=verdict', 'sl-verdict'],
  ['sl-verdict-open', 'cert-ios-simlab.html?v=verdict-open', 'sl-verdict-open'],
  ['xs-loading', 'cert-ios-simlab.html?v=exam-loading', 'xs-loading'],
  ['xs-round', 'cert-ios-simlab.html?v=exam-round', 'xs-round'],
  ['xs-round-last', 'cert-ios-simlab.html?v=exam-round-last', 'xs-round-last'],
  ['xs-end', 'cert-ios-simlab.html?v=exam-end', 'xs-end'],
  ['xs-end-jump', 'cert-ios-simlab.html?v=exam-end-jump', 'xs-end-jump'],
  ['xs-abandon', 'cert-ios-simlab.html?v=exam-abandon', 'xs-abandon'],
  ['xs-result', 'cert-ios-simlab.html?v=exam-result', 'xs-result'],
  ['xs-result-timeup', 'cert-ios-simlab.html?v=exam-result-timeup', 'xs-result-timeup'],
  ['gt-entry', 'cert-ios-gauntlet.html?v=entry', 'gt-entry'],
  ['gt-pick', 'cert-ios-gauntlet.html?v=entry-pick', 'gt-pick'],
  ['gt-free', 'cert-ios-gauntlet.html?v=entry-free', 'gt-free'],
  ['gt-loading', 'cert-ios-gauntlet.html?v=loading', 'gt-loading'],
  ['gt-run', 'cert-ios-gauntlet.html?v=run', 'gt-run'],
  ['gt-answered', 'cert-ios-gauntlet.html?v=run-answered', 'gt-answered'],
  ['gt-cracked', 'cert-ios-gauntlet.html?v=result-cracked', 'gt-cracked'],
  ['gt-miss', 'cert-ios-gauntlet.html?v=result-miss', 'gt-miss'],
  ['gt-miss-open', 'cert-ios-gauntlet.html?v=result-miss-open', 'gt-miss-open'],
  ['gt-miss-free', 'cert-ios-gauntlet.html?v=result-miss-free', 'gt-miss-free'],
  // B3c2: Why-Not
  ['wn-entry', 'cert-ios-whynot.html?v=entry', 'wn-entry'],
  ['wn-free', 'cert-ios-whynot.html?v=entry-free', 'wn-free'],
  ['wn-pick', 'cert-ios-whynot.html?v=entry-pick', 'wn-pick'],
  ['wn-loading', 'cert-ios-whynot.html?v=loading', 'wn-loading'],
  ['wn-question', 'cert-ios-whynot.html?v=question', 'wn-question'],
  ['wn-reason', 'cert-ios-whynot.html?v=reason', 'wn-reason'],
  ['wn-picked', 'cert-ios-whynot.html?v=reason-picked', 'wn-picked'],
  ['wn-wrong', 'cert-ios-whynot.html?v=reason-wrong', 'wn-wrong'],
  ['wn-verdict', 'cert-ios-whynot.html?v=verdict', 'wn-verdict'],
  ['wn-verdict-open', 'cert-ios-whynot.html?v=verdict-open', 'wn-verdict-open'],
  ['wn-session', 'cert-ios-whynot.html?v=session', 'wn-session'],
  ['wn-leave', 'cert-ios-whynot.html?v=leave', 'wn-leave'],
  ['dl-entry', 'cert-ios-decisionlab.html?v=entry', 'dl-entry'],
  ['dl-free', 'cert-ios-decisionlab.html?v=entry-free', 'dl-free'],
  ['dl-practice', 'cert-ios-decisionlab.html?v=practice', 'dl-practice'],
  ['dl-graded', 'cert-ios-decisionlab.html?v=practice-graded', 'dl-graded'],
  ['dl-exam', 'cert-ios-decisionlab.html?v=exam', 'dl-exam'],
  ['dl-exam-amber', 'cert-ios-decisionlab.html?v=exam-amber', 'dl-exam-amber'],
  ['dl-exam-end', 'cert-ios-decisionlab.html?v=exam-end', 'dl-exam-end'],
  ['dl-results', 'cert-ios-decisionlab.html?v=results', 'dl-results'],
  ['dl-results-open', 'cert-ios-decisionlab.html?v=results-open', 'dl-results-open'],
  ['dl-results-timeup', 'cert-ios-decisionlab.html?v=results-exam-timeup', 'dl-results-timeup'],
  ['dl-leave', 'cert-ios-decisionlab.html?v=leave', 'dl-leave'],
  ['st-signed-out', 'cert-ios-settings.html?v=signed-out', 'st-signed-out'],
  ['st-free', 'cert-ios-settings.html?v=free', 'st-free'],
  ['st-pro', 'cert-ios-settings.html?v=pro', 'st-pro'],
  ['st-exam-date', 'cert-ios-settings.html?v=exam-date', 'st-exam-date'],
  ['st-cert-switch', 'cert-ios-settings.html?v=cert-switch', 'st-cert-switch'],
  ['st-diag', 'cert-ios-settings.html?v=diag', 'st-diag'],
  ['st-restore', 'cert-ios-settings.html?v=restore', 'st-restore'],
  ['st-clear-bank', 'cert-ios-settings.html?v=clear-bank', 'st-clear-bank'],
  ['st-delete', 'cert-ios-settings.html?v=delete', 'st-delete'],
];
// B3a: Drills seeds per state (wrong-bank size, fresh user, cert)
function drillsSeed(step) {
  if (!/^dr/.test(step || '')) return null;
  return { wrong: step === 'dr-empty' ? 0 : (step === 'dr-dl' ? 6 : 9), fresh: step === 'dr-empty', cert: step === 'dr-dl' ? 'az900' : null };
}
// B2: a saved 90-question exam like the E2E's (Q23 of 90, 63 answered, Q23 + four earlier flagged, 84:28 left)
const EXAM_TOPICS = ['NTP, ICMP & Traffic Types', 'OSPF', 'PKI & Certificates', 'Cable Issues', 'Monitoring & SNMP', 'DNS & DHCP'];
// The Net+ Sim Lab seed pool, read here so a saved exam can carry a real terminal PBQ (B3b1 console look).
const SL_SEEDS = (() => { const c = { window: {} }; require('vm').runInNewContext(fs.readFileSync(path.join(ROOT, 'features/sim-lab-seed-netplus.js'), 'utf8'), c); return c.window.SIM_LAB_SEED_NETPLUS; })();
const SL_TERMINAL = SL_SEEDS.find(x => x.assets && x.assets.reference && x.assets.reference.kind === 'terminal' && JSON.stringify(x.steps).indexOf('excerptLines') > 0);
const GT_RUN = { concept: 'Remote Desktop listens on TCP 3389', rungs: [
  { question: 'Which TCP port does Remote Desktop Protocol listen on by default?', options: ['3389', '22', '445', '5900'], answer: 'A', explanation: 'RDP listens on TCP 3389 by default. SSH is 22, SMB is 445, VNC is 5900.', hinge: 'Remote Desktop Protocol' },
  { question: 'A help desk tech can\u2019t reach a Windows server for remote desktop. The firewall log shows drops on one port only. Which port must be opened?', options: ['443', '3389', '23', '135'], answer: 'B', explanation: 'Remote desktop to a Windows host is RDP on TCP 3389. 443 is HTTPS, 23 is Telnet, 135 is RPC.', hinge: 'remote desktop' },
  { question: 'Which port is the BEST one to restrict to stop remote GUI logins to Windows hosts?', options: ['80', '389', '3389', '8080'], answer: 'C', explanation: 'Closing 3389 stops RDP, the remote GUI login. 389 is LDAP and does not carry a desktop session.', hinge: 'BEST' },
  { question: 'All of these ports carry remote access EXCEPT which one?', options: ['22', '3389', '5900', '161'], answer: 'D', explanation: '161 is SNMP, for monitoring. 22 (SSH), 3389 (RDP) and 5900 (VNC) all give remote access.', hinge: 'EXCEPT' },
  { question: 'An admin moved RDP off its default port. Which port did they move it off of?', options: ['3389', '3390', '443', '22'], answer: 'A', explanation: 'RDP\u2019s default is 3389, so that is the port it was moved off of.', hinge: 'off of' } ] };
// B3c2: five Why-Not rounds in today's shape, the drawing's RDP round first (its exact reasons and notes)
const WN_KIT = (r, f1, f2, n) => ({ reason: r, fakes: [f1, f2], note: n });
const WN_RD = (q, o, a, x, k) => ({ question: q, options: o, answer: a, explanation: x, whynot: k });
const WN_RUN = { rounds: [
  WN_RD('Which TCP port does Remote Desktop Protocol listen on by default?', ['3389', '22', '445', '5900'], 'A', 'RDP listens on TCP 3389 by default. Windows turns it on when you allow remote connections.', {
    B: WN_KIT('22 is SSH, a command-line login.', '22 is UDP only, so it can’t carry a session.', '22 is reserved for DNS zone transfers.', 'SSH owns 22 and gives you a command line. It runs over TCP, and DNS zone transfers use 53.'),
    C: WN_KIT('445 is SMB, for file and printer sharing.', '445 only carries encrypted web traffic.', '445 is what RDP falls back to without NLA.', 'SMB shares run on 445. Encrypted web traffic is 443, and RDP stays on 3389 with or without NLA.'),
    D: WN_KIT('5900 is VNC, a different remote desktop protocol.', 'Windows blocks 5900, so nothing can listen on it.', '5900 is RDP’s port for multi-monitor sessions.', 'VNC listens on 5900. It’s remote desktop too, over a different protocol from RDP. Windows doesn’t block 5900, and RDP has no extra port for monitors.') }),
  WN_RD('Which port does HTTPS use by default on the public web?', ['80', '443', '8080', '21'], 'B', 'HTTPS uses TCP 443.', {
    A: WN_KIT('80 is plain HTTP.', '80 is only for FTP.', '80 is UDP only.', 'HTTP is 80.'), C: WN_KIT('8080 is an alternate HTTP port.', '8080 is DNS.', '8080 is SMTP.', 'An alternate, not the default.'), D: WN_KIT('21 is FTP control.', '21 is HTTPS on old servers.', '21 is SSH.', 'FTP control uses 21.') }),
  WN_RD('Which port does DNS use for ordinary name lookups?', ['25', '110', '53', '123'], 'C', 'DNS lookups use port 53.', {
    A: WN_KIT('25 is SMTP.', '25 is DNS over TCP.', '25 is NTP.', 'SMTP is 25.'), B: WN_KIT('110 is POP3.', '110 is DNS zone transfers.', '110 is LDAP.', 'POP3 is 110.'), D: WN_KIT('123 is NTP.', '123 is DNS over UDP.', '123 is SNMP.', 'NTP is 123.') }),
  WN_RD('Which port does SNMP polling use?', ['161', '389', '636', '514'], 'A', 'SNMP polling uses UDP 161.', {
    B: WN_KIT('389 is LDAP.', '389 is SNMP traps.', '389 is Syslog.', 'LDAP is 389.'), C: WN_KIT('636 is LDAPS.', '636 is SNMPv3.', '636 is RDP.', 'LDAPS is 636.'), D: WN_KIT('514 is Syslog.', '514 is SNMP polling.', '514 is SSH.', 'Syslog is 514.') }),
  WN_RD('Which port does SSH use by default?', ['23', '22', '3389', '69'], 'B', 'SSH uses TCP 22.', {
    A: WN_KIT('23 is Telnet.', '23 is SFTP.', '23 is SSH over UDP.', 'Telnet is 23.'), C: WN_KIT('3389 is RDP.', '3389 is SSH tunnelling.', '3389 is SCP.', 'RDP is 3389.'), D: WN_KIT('69 is TFTP.', '69 is SSH keys.', '69 is SFTP.', 'TFTP is 69.') })
] };

function examState(step) {
  const qs = Array.from({ length: 90 }, (_, i) => ({ type: 'mcq', question: 'Which of the following is the primary function of ICMP in network communications?',
    options: { A: 'Providing error reporting and diagnostic capabilities for IP networks', B: 'Establishing encrypted connections between remote hosts',
      C: 'Managing the allocation of dynamic IP addresses to client devices', D: 'Synchronising time across network devices with sub-microsecond precision' },
    answer: 'A', explanation: 'ICMP carries error and diagnostic messages.', topic: i === 22 ? EXAM_TOPICS[0] : EXAM_TOPICS[i % 6], difficulty: 'Exam Level' }));
  if (step === 'ex-pbq') qs[1] = { type: 'simlab', question: SL_TERMINAL.title, topic: SL_TERMINAL.topic, explanation: '', simlab: SL_TERMINAL };
  const ans = qs.map((_, i) => ({ chosen: (i < 64 && i !== 22) ? (i % 4 ? 'A' : 'B') : null, flagged: [3, 9, 14, 19, 22].includes(i), msChosen: [], orderSeq: [], cliRan: [], topoState: {} }));
  return { v: 1, savedAt: Date.now(), endTime: Date.now() + 5068000, current: step === 'ex-pbq' ? 1 : 22, questions: qs, answers: ans, answered: 63, paused: false, pausedAt: 0, timeLeft: 5068, pausedMs: 0, pauses: 0 };
}
const SRQ = ['First?', 'Second?', 'Third?', 'Fourth?', 'Fifth?'].map((q, i) => ({ qHash: 'sbs' + i, question: 'Which port does ' + ['HTTPS', 'SSH', 'DNS', 'SMTP', 'RDP'][i] + ' use?',
  options: { A: '443', B: '22', C: '53', D: '25' }, answer: 'ABCD'[i % 4], explanation: 'Sample explanation.', topic: 'Port Numbers', difficulty: 'Exam Level',
  nextReview: 0, intervalDays: 6, easiness: 2.5, repetitions: 1, graduated: false, correctStreak: 1 }));

async function shootE2E(browser, file, theme) {
  const p = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  await p.addInitScript(t => { try { localStorage.setItem('ca-theme', t); } catch (_) {} }, theme);
  await p.goto(E2E + file);
  await p.waitForTimeout(1500);
  const scr = (await p.$('#screen')) || (await p.$('.screen'));
  const buf = await scr.screenshot();
  await p.close();
  return buf;
}

async function shootReal(browser, step, theme) {
  // reduced motion: pagers jump instead of gliding, so a mid-swipe frame is never captured (end states are identical)
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') return r.abort();
    if (/\/lib\/supabase\.js$/.test(u.pathname)) return r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB=' + (step === 'st-signed-out' ? '{"signedOut":true}' : '{"role":"admin"}') + ';' + FAKE });   // B4: the signed-out state has no session
    return r.continue();
  });
  await ctx.addInitScript(([t, h, q, ex, dr]) => {
    if (sessionStorage.getItem('s')) return;
    localStorage.clear(); sessionStorage.setItem('s', 1);
    localStorage.setItem('nplus_dev_cert', (dr && dr.cert) || 'netplus'); localStorage.setItem('nplus_theme', t);
    localStorage.setItem('nplus_history', JSON.stringify(dr && dr.fresh ? [] : h));
    if (dr) localStorage.setItem('nplus_wrong_bank', JSON.stringify(Array.from({ length: dr.wrong }, (_, i) => ({ question: 'Missed ' + i + '?', topic: 'OSPF' }))));
    localStorage.setItem('nplus_streak', JSON.stringify({ current: 12, best: 14, last: new Date().toISOString().slice(0, 10) }));
    if (q) localStorage.setItem('nplus_sr_queue', JSON.stringify(q));
    if (ex) localStorage.setItem('nplus_exam_state', JSON.stringify(ex));
  }, [theme, HISTORY, /^srv/.test(step || '') ? SRQ : null, /^ex/.test(step || '') ? examState(step) : null, drillsSeed(step)]);
  const p = await ctx.newPage();
  await p.goto(APP + '?nc=' + Date.now());
  await p.waitForTimeout(3000);
  const pageNo = (step || '').split('-')[1];
  if (/^(prog|ana)/.test(step || '')) {
    await p.locator('#lift-tabbar .lift-tab[data-page="progress"]').click();
    await p.waitForTimeout(600);
    if (/^ana/.test(step)) { await p.locator('#ios-progress [data-view="analytics"]').click(); await p.waitForTimeout(900); }
    const scope = /^ana/.test(step) ? '#ios-analytics' : '#ios-progress';
    if (pageNo) { await p.locator(scope + ' [role="tab"][data-page="' + pageNo + '"]').click(); await p.waitForTimeout(1500); }
    await p.waitForTimeout(1300);   // let the entrance and the bar sweeps settle
  } else if (/^srv/.test(step || '')) {
    await p.evaluate(() => startSrReview());
    await p.waitForTimeout(700);
    if (step === 'srv-done') {
      for (let n = 0; n < 12 && await p.locator('#sr-card-host .sr-option').count(); n++) {
        await p.locator('#sr-card-host .sr-option').nth(n === 1 ? 3 : 0).click();
        const btn = p.locator('#page-sr-review .sr-confidence-confident, #page-sr-review .sr-confidence-wrong').first();
        await btn.click(); await p.waitForTimeout(250);
      }
      await p.waitForTimeout(1300);
    }
  } else if (/^ex/.test(step || '')) {
    // Home's resume tile path (the exam module is lazy)
    await p.evaluate(async () => { const m = await _loadFeature('exam'); await m.resumeExam(); });
    await p.waitForTimeout(800);
    if (step === 'ex-paused') { await p.locator('#exam-pause-btn').click(); await p.waitForTimeout(400); }
    if (step === 'ex-end') { await p.locator('#page-exam .end-exam-btn').click(); await p.locator('#exam-modal .ix-jump-t').click(); await p.waitForTimeout(500); }
    if (step === 'ex-leave') { await p.evaluate(() => goSetup()); await p.waitForTimeout(600); }
    if (step === 'ex-res') {
      await p.locator('#page-exam .end-exam-btn').click(); await p.locator('#exam-modal .btn-primary').click();
      await p.waitForTimeout(4600);   // let any milestone toast leave
      // the end-of-day recap (100+ questions today) is its own modal, not part of the E2E results screen
      const recap = p.locator('#daily-recap-modal:not([hidden]) button').filter({ hasText: /^Close$/ });
      if (await recap.count()) { await recap.first().click(); await p.waitForTimeout(400); }
    }
  } else if (/^dr/.test(step || '')) {
    await p.locator('#lift-tabbar .lift-tab[data-page="drills"]').click();
    await p.waitForTimeout(600);
    // the E2E default and AZ-900 states are Pro; free and fresh are free users
    await p.evaluate((free) => {
      _quotaState = free ? { tier: 'free', used_today: 0, daily_limit: 15 } : { tier: 'pro' };
      document.body.classList.add('is-state-resolved'); document.body.classList.toggle('is-pro-tier', !free);
      // the E2E free state draws the Gauntlet run as used today
      if (free === 'used') try { localStorage.setItem(STORAGE.GAUNTLET_FREE_COUNT, JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: 1 })); } catch (_) {}
      renderGauntletDrillsCard();
    }, step === 'dr-free' ? 'used' : step === 'dr-empty');
    await p.waitForTimeout(1200);
  } else if (/^gt/.test(step || '')) {
    // B3c1: the Reword Gauntlet, forge stubbed in the page (the drawing's RDP run; checkers pass every rung)
    const free = /^gt-(free|miss-free)$/.test(step);
    const tier = () => p.evaluate((f) => { window._quotaState = f ? { tier: 'free', used_today: 0, daily_limit: 15 } : { tier: 'pro' }; document.body.classList.toggle('is-pro-tier', !f); }, free);
    await p.evaluate(async ([st, run]) => {
      try { localStorage.removeItem('nplus_gauntlet_free_count'); } catch (_) {}
      window._claudeFetch = st === 'gt-loading' ? () => new Promise(() => {}) : async () => ({ ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(run) }] }) });
      window.aiValidateQuestions = async (k, qs) => qs; window.validateQuestions = (qs) => qs;
      if (typeof showPage === 'function') showPage('drills');
    }, [step, GT_RUN]);
    await p.waitForTimeout(500);
    await tier();
    await p.evaluate(() => startRewordGauntlet());
    await p.waitForTimeout(900);
    if (step === 'gt-pick') { await p.locator('#igt-entry .igt-switch').click(); await p.waitForTimeout(500); }
    if (!/^gt-(entry|pick|free)$/.test(step)) {
      await tier(); await p.locator('#igt-entry .igt-start').click(); await p.waitForTimeout(1200);
      const ans = async (i) => { await p.locator('#options .option').nth(i).click(); await p.locator('#btn-next').click(); await p.waitForTimeout(300); };
      const next = async () => { await p.locator('#btn-next').click(); await p.waitForTimeout(400); };
      if (step === 'gt-run' || step === 'gt-answered') { await ans(0); await next(); if (step === 'gt-answered') await ans(1); }
      if (/^gt-(cracked|miss)/.test(step)) {
        const right = [0, 1, 2, 3, 0], wrong = step === 'gt-cracked' ? [] : [2, 3];
        for (let i = 0; i < 5; i++) { await tier(); await ans(wrong.indexOf(i) >= 0 ? (right[i] + 1) % 4 : right[i]); await next(); }
        await p.waitForTimeout(4600);   // let any milestone toast leave
        if (step === 'gt-miss-open') { await p.locator('#gnt-result-root .igt-srow').nth(2).click(); await p.waitForTimeout(400); }
      }
    }
  } else if (/^wn/.test(step || '')) {
    // B3c2: Why-Not, forge stubbed in the page; picks read _wnRound.map so true / fake land as drawn
    const free = step === 'wn-free';
    const tier = () => p.evaluate((f) => { window._quotaState = f ? { tier: 'free', used_today: 0, daily_limit: 15 } : { tier: 'pro' }; document.body.classList.toggle('is-pro-tier', !f); }, free);
    await p.evaluate(async ([st, run]) => {
      try { localStorage.setItem('nplus_a2hs_dismissed', '1'); } catch (_) {}
      window._claudeFetch = st === 'wn-loading' ? () => new Promise(() => {}) : async () => ({ ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(run) }] }) });
      window.aiValidateQuestions = async (k, qs) => qs; window.validateQuestions = (qs) => qs;
      if (typeof showPage === 'function') showPage('drills');
    }, [step, WN_RUN]);
    await p.waitForTimeout(500);
    await tier();
    await p.evaluate(() => startWhyNot());
    await p.waitForTimeout(900);
    if (step === 'wn-pick') { await p.locator('#iwn-entry .iwn-switch').click(); await p.waitForTimeout(500); }
    if (!/^wn-(entry|pick|free)$/.test(step)) {
      await tier(); await p.locator('#iwn-entry .iwn-start').click(); await p.waitForTimeout(1200);
      const toReasons = async (n) => {
        await p.locator('#options .option').nth(n).click();
        for (let k = 0; k < 3 && !(await p.locator('#page-whynot-round').evaluate(el => el.classList.contains('active'))); k++) { await p.locator('#btn-next').click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(350); }
      };
      const pick = async (real) => { const i = await p.evaluate((r) => _wnRound.map.findIndex(x => !!x.real === r), real); await p.locator('#wn-round-root .iwn-reason').nth(i).click(); await p.waitForTimeout(500); };
      const nextR = async () => { await p.locator('#wn-round-root .iwn-next').click(); await p.waitForTimeout(500); };
      if (step !== 'wn-loading' && step !== 'wn-question') {
        await toReasons(0);
        if (step === 'wn-picked') { await pick(true); await nextR(); await pick(true); }
        if (step === 'wn-wrong' || /^wn-(verdict|session)/.test(step)) { await pick(true); await nextR(); await pick(true); await nextR(); await pick(false); }
        if (/^wn-(verdict|session)/.test(step)) { await nextR(); await p.waitForTimeout(600); }
        if (step === 'wn-verdict-open') { await p.locator('#wn-verdict-root .iwn-srow').nth(3).click(); await p.waitForTimeout(400); }
        if (step === 'wn-session') {
          for (const [n, picks] of [[1, [true, true, true]], [2, [true, true, false]]]) {
            await p.locator('#wn-verdict-root .iwn-primary').click(); await p.waitForTimeout(1200);
            await toReasons(n);
            for (let j = 0; j < 3; j++) { await pick(picks[j]); await nextR(); }
            await p.waitForTimeout(600);
          }
          await p.locator('#wn-verdict-root .iwn-primary').click(); await p.waitForTimeout(4600);   // let any milestone toast leave
        }
        if (step === 'wn-leave') { await p.locator('#wn-round-root .iwn-leave').click(); await p.waitForTimeout(600); }
      }
    }
  } else if (/^st/.test(step || '')) {
    // B4: the Account tab; free states pin a free tier over the fake session, Pro states keep its Pro tier
    const free = /^st-(free|cert-switch|diag|clear-bank|signed-out)$/.test(step);
    await p.evaluate((f) => {
      if (f) { window._quotaState = { tier: 'free', used_today: 0, daily_limit: 15 }; document.body.classList.remove('is-pro-tier'); }
      window._takeAutoBackup && window._takeAutoBackup();
      saveWrongBank(Array.from({ length: 9 }, (_, i) => ({ question: 'Missed ' + i + '?', topic: 'OSPF' })));
    }, free);
    await p.locator('#lift-tabbar .lift-tab[data-page="settings"]').click();
    await p.waitForTimeout(1800);
    const act = { 'st-exam-date': 'exam', 'st-cert-switch': 'cert', 'st-restore': 'restore', 'st-clear-bank': 'clear', 'st-delete': 'delete' }[step];
    if (act) { await p.locator('#ios-settings [data-act="' + act + '"]').first().click(); await p.waitForTimeout(700); }
    if (step === 'st-diag') { await p.locator('#ios-settings .ist-pp [data-act="pp-empty"]').first().click(); await p.waitForTimeout(700); }
  } else if (/^dl/.test(step || '')) {
    // B3c3: Decision Lab on the real AZ-900 seed (analyze decisions only, as drawn), opened from Drills
    const free = step === 'dl-free';
    const tier = () => p.evaluate((f) => { window._quotaState = f ? { tier: 'free', used_today: 0, daily_limit: 15 } : { tier: 'pro' }; document.body.classList.add('is-state-resolved'); document.body.classList.toggle('is-pro-tier', !f); }, free);
    await p.evaluate(async () => {
      try { localStorage.removeItem(STORAGE.DL_FREE_COUNT); } catch (_) {}
      window.CURRENT_CERT = 'az900';
      await Promise.race([new Promise(res => window._ensureDecisionLabLoaded(res)), new Promise(res => setTimeout(res, 4000))]);
      if (!window.DECISION_LAB_SEED_AZ900) throw new Error('AZ-900 Decision Lab seed did not load');
      window.DECISION_LAB_SEED_AZ900 = window.DECISION_LAB_SEED_AZ900.filter(x => x.steps[0].type === 'analyze');
      window.CERT_PACK = Object.assign({}, window.CERT_PACK, { meta: Object.assign({}, (window.CERT_PACK || {}).meta, { name: 'Microsoft Azure Fundamentals', code: 'AZ-900' }) });
      showPage('drills');
    });
    await p.waitForTimeout(700);
    await tier();
    await p.evaluate(() => decisionLabOpenEntry());
    await p.waitForTimeout(900);
    const SUB = '#dl-body .sl-actions [data-action="simLabSubmitScenario"]';
    const pick = (right) => p.evaluate((r) => {
      const s = window._simLab.dlSession(), st = s.scenarios[s.idx].steps[0], want = st.answer.selected;
      const ln = Array.from(document.querySelectorAll('#dl-body .sl-analyze-line')).find(l => (want.indexOf(l.getAttribute('data-line')) >= 0) === r);
      if (ln) ln.click();
    }, right);
    if (/^dl-(practice|graded|leave|results$|results-open)/.test(step)) {
      await p.evaluate(() => decisionLabSessionStart()); await p.waitForTimeout(900);
      if (step === 'dl-graded') { await pick(false); await p.locator(SUB).click(); await p.waitForTimeout(600); }
      if (step === 'dl-leave') { await p.locator('#page-decision-lab [data-action="decisionLabExit"]').click(); await p.waitForTimeout(600); }
      if (/^dl-results/.test(step)) {
        for (let i = 0; i < 10; i++) { await pick([1, 4, 6].indexOf(i) < 0); await p.locator(SUB).click(); await p.waitForTimeout(150); await p.locator('#dl-body .sl-actions button').click(); await p.waitForTimeout(250); }
        await p.waitForTimeout(4600);   // let any milestone toast leave
        if (step === 'dl-results-open') { await p.locator('#dl-result-root .idl-srow').nth(1).click(); await p.waitForTimeout(400); }
      }
    }
    if (/^dl-(exam|results-timeup)/.test(step)) {
      await p.evaluate(() => { decisionLabPickMode('exam'); decisionLabSessionStart(); }); await p.waitForTimeout(900);
      const n = { 'dl-exam': 3, 'dl-exam-end': 3, 'dl-exam-amber': 9, 'dl-results-timeup': 7 }[step];
      for (let i = 0; i < n; i++) { await pick(i % 3 !== 1); await p.locator(SUB).click(); await p.waitForTimeout(250); }
      if (step === 'dl-exam-amber') { await p.evaluate(() => { const s = window._simLab.dlSession(); s.deadlineMs = Date.now() + 112000; s.budgetMs = 1200000; window._simLab.dlTick(); }); await p.waitForTimeout(400); }
      if (step === 'dl-exam-end') { await p.locator('#isl-xbar .isl-xend').click(); await p.waitForTimeout(500); }
      if (step === 'dl-results-timeup') { await p.evaluate(() => { window._simLab.dlSession().deadlineMs = Date.now() - 1; window._simLab.dlTick(); }); await p.waitForTimeout(4600); }
    }
  } else if (/^xs/.test(step || '')) {
    // B3b2: a Pro Sim Lab exam, 5 rounds, seeds only (offline); the drawn round is the terminal seed in round 2
    await p.evaluate(async (st) => {
      window._quotaState = { tier: 'pro' };
      document.body.classList.add('is-state-resolved', 'is-pro-tier');
      await new Promise(res => window._ensureSimLabLoaded(res));
      window._slMeteredGenerate = st === 'xs-loading' ? () => new Promise(() => {}) : async () => ({ bad: true });
      if (st === 'xs-loading') { window.SIM_LAB_SEED_NETPLUS.length = 0; }   // nothing to fall back to: the loader stays up
      startSimLabHome();
      if (typeof renderGauntletDrillsCard === 'function') renderGauntletDrillsCard();
    }, step);
    await p.waitForTimeout(900);
    await p.locator('#isl-entry [data-act="mode"][data-mode="exam"]').click();
    await p.locator('#isl-entry [data-act="rounds"][data-rounds="5"]').click();
    await p.locator('#isl-entry [data-act="start"]').click();
    await p.waitForTimeout(1500);
    if (step !== 'xs-loading') {
      await p.evaluate((st) => {
        const s = window._simLab.examSession(), seeds = window.SIM_LAB_SEED_NETPLUS;
        const term = seeds.find(x => x.assets && x.assets.reference && x.assets.reference.kind === 'terminal' && JSON.stringify(x.steps).indexOf('excerptLines') > 0);
        const at = st === 'xs-round-last' ? 4 : 1;
        s.scenarios[at] = term;
        const mark = (i) => { s.answers[i] = { probe: 'x' }; };
        mark(0); mark(3); s.flagged.add(3);
        if (st === 'xs-round-last') { mark(1); mark(4); s.flagged.add(4); s.deadlineMs = Date.now() + 118000; }
        window._simLab.renderRound(at);
        window._simLab.tickClock();
      }, step);
      await p.waitForTimeout(700);
    }
    if (/^xs-(end|abandon)/.test(step)) { await p.locator('#isl-xbar .isl-xend').click(); await p.waitForTimeout(500); }
    if (step === 'xs-end-jump') { await p.locator('#isl-end .ix-jump-t').click(); await p.waitForTimeout(300); }
    if (step === 'xs-abandon') { await p.locator('#isl-end [data-act="abandon"]').click(); await p.waitForTimeout(600); }
    if (step === 'xs-result') { await p.evaluate(() => window._simLab.examSubmit(false)); await p.waitForTimeout(4600); }
    if (step === 'xs-result-timeup') { await p.evaluate(() => { window._simLab.examSession().deadlineMs = Date.now() - 1; window._simLab.tickClock(); }); await p.waitForTimeout(4600); }
  } else if (/^sl/.test(step || '')) {
    // free user, today's free session not used; seeds only (offline)
    await p.evaluate(async (st) => {
      window._quotaState = { tier: 'free', used_today: 0, daily_limit: 15 };
      document.body.classList.add('is-state-resolved'); document.body.classList.remove('is-pro-tier');
      try { localStorage.removeItem('nplus_pbq_free_count'); } catch (_) {}
      await new Promise(res => window._ensureSimLabLoaded(res));
      window._slMeteredGenerate = st === 'sl-loading' ? () => new Promise(() => {}) : async () => ({ bad: true });
      if (st === 'sl-loading') { window.SIM_LAB_SEED_NETPLUS.length = 0; }   // nothing to pick: the loader stays up
      startSimLabHome();
    }, step);
    await p.waitForTimeout(900);
    if (step !== 'sl-entry') {
      await p.locator('#isl-entry [data-act="rounds"][data-rounds="3"]').click();
      await p.locator('#isl-entry [data-act="start"]').click();
      await p.waitForTimeout(1200);
    }
    const kind = { 'sl-round': 'terminal', 'sl-reset': 'terminal', 'sl-map': 'network', 'sl-enlarge': 'network' }[step];
    if (kind) {
      await p.evaluate((k) => {
        const scn = window.SIM_LAB_SEED_NETPLUS.find(x => x.assets && x.assets.reference && x.assets.reference.kind === k && (k !== 'terminal' || JSON.stringify(x.steps).indexOf('excerptLines') > 0));
        const body = document.getElementById('sl-body');
        window._simLab.mountScenario(body, scn, { lift: true, onReset: function () { window._simLab.mountScenario(body, scn, this); }, onSubmit: function () {} });
      }, kind);
      await p.waitForTimeout(700);
    }
    if (step === 'sl-reset') { await p.locator('#sl-body .sl-reset').click(); await p.waitForTimeout(600); }
    if (step === 'sl-enlarge') { await p.locator('#sl-body .isl-enlarge').click(); await p.waitForTimeout(600); }
    if (/^sl-verdict/.test(step)) {
      for (let i = 0; i < 3; i++) {
        await p.waitForSelector('#sl-body [data-action="simLabSubmitScenario"]', { timeout: 8000 });
        await p.locator('#sl-body [data-action="simLabSubmitScenario"]').click();
        await p.waitForTimeout(500);
      }
      await p.waitForTimeout(4600);   // let any milestone toast leave
      if (step === 'sl-verdict-open') { await p.locator('#sl-result-root .isl-srow').nth(1).click(); await p.waitForTimeout(500); }
    }
  } else if (step === 'cq') {
    await p.evaluate(() => window._jumpToCustomQuiz());
    await p.waitForTimeout(1200);   // let the staggered entrance settle
  } else if (step) {
    await p.evaluate(q => window._testInjectQuiz(q), QS);
    await p.waitForTimeout(800);
    const pickNext = async (i) => { await p.locator('#options .option').nth(i).click(); await p.locator('#btn-next').click(); await p.waitForTimeout(400); };
    if (step === 'ans') await pickNext(0);
    if (step === 'res' || step === 'rev') {
      for (let i = 0; i < QS.length; i++) { await pickNext(i % 2); await p.locator('#btn-next').click(); await p.waitForTimeout(450); }
      await p.waitForTimeout(4600);   // let any milestone toast leave
      if (step === 'rev') { await p.locator('#ios-results [data-act="review"]').click(); await p.waitForTimeout(800); }
    }
  }
  // app toasts (e.g. the periodic backup tip) are not part of the screen being compared
  await p.addStyleTag({ content: '.success-toast, .error-toast, .toast, .celebration-toast { display: none !important; }' });
  await p.waitForTimeout(300);
  // B1 screens are one fixed viewport (a full-page capture resizes it mid-shot); the review-done recap scrolls
  const buf = await p.screenshot({ fullPage: !/^(prog|ana|srv$|ex|sl|xs|gt|wn|dl|st)/.test(step || '') });
  await ctx.close();
  return buf;
}

async function pair(browser, left, right, file) {
  const p = await browser.newPage({ viewport: { width: 860, height: 800 } });
  const img = b => 'data:image/png;base64,' + b.toString('base64');
  await p.setContent('<body style="margin:0;background:#888;display:flex;gap:20px;align-items:flex-start;padding:20px;font:12px sans-serif">'
    + '<figure style="margin:0;width:' + VP.width + 'px"><figcaption>E2E</figcaption><img style="width:' + VP.width + 'px" src="' + img(left) + '"></figure>'
    + '<figure style="margin:0;width:' + VP.width + 'px"><figcaption>Real app</figcaption><img style="width:' + VP.width + 'px" src="' + img(right) + '"></figure></body>');
  await p.waitForTimeout(200);
  await p.screenshot({ path: file, fullPage: true });
  await p.close();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const theme of ['dark', 'light']) {
    for (const [name, file, step] of SCREENS.filter(x => { const o = process.env.LIFT_ONLY; return !o || x[0] === o || (o.endsWith('*') && x[0].startsWith(o.slice(0, -1))); })) {
      const l = await shootE2E(browser, file, theme);
      const r = await shootReal(browser, step, theme);
      const f = path.join(OUT, name + '-' + theme + '.png');
      await pair(browser, l, r, f);
      console.log('wrote', path.relative(ROOT, f));
    }
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
