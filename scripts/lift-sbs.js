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
    if (/\/lib\/supabase\.js$/.test(u.pathname)) return r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB={"role":"admin"};' + FAKE });
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
  await p.addStyleTag({ content: '.success-toast, .error-toast, .toast { display: none !important; }' });
  await p.waitForTimeout(300);
  // B1 screens are one fixed viewport (a full-page capture resizes it mid-shot); the review-done recap scrolls
  const buf = await p.screenshot({ fullPage: !/^(prog|ana|srv$|ex|sl)/.test(step || '') });
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
    for (const [name, file, step] of SCREENS.filter(x => !process.env.LIFT_ONLY || x[0] === process.env.LIFT_ONLY)) {
      const l = await shootE2E(browser, file, theme);
      const r = await shootReal(browser, step, theme);
      const f = path.join(OUT, name + '-' + theme + '.png');
      await pair(browser, l, r, f);
      console.log('wrote', path.relative(ROOT, f));
    }
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
