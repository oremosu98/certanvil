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
const OUT = path.join(ROOT, 'test-results', 'lift-a-sbs');
const APP = process.env.LIFT_APP || 'http://127.0.0.1:3199/';
const E2E = process.env.LIFT_E2E || 'http://localhost:3207/';
const FAKE = fs.readFileSync(path.join(ROOT, 'tests/fixtures/fake-supabase.js'), 'utf8');
const VP = { width: 390, height: 844 };

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
];

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
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') return r.abort();
    if (/\/lib\/supabase\.js$/.test(u.pathname)) return r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB={"role":"admin"};' + FAKE });
    return r.continue();
  });
  await ctx.addInitScript(([t, h]) => {
    if (sessionStorage.getItem('s')) return;
    localStorage.clear(); sessionStorage.setItem('s', 1);
    localStorage.setItem('nplus_dev_cert', 'netplus'); localStorage.setItem('nplus_theme', t);
    localStorage.setItem('nplus_history', JSON.stringify(h));
    localStorage.setItem('nplus_streak', JSON.stringify({ current: 12, best: 14, last: new Date().toISOString().slice(0, 10) }));
  }, [theme, HISTORY]);
  const p = await ctx.newPage();
  await p.goto(APP + '?nc=' + Date.now());
  await p.waitForTimeout(3000);
  if (step === 'cq') {
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
  const buf = await p.screenshot({ fullPage: true });
  await ctx.close();
  return buf;
}

async function pair(browser, left, right, file) {
  const p = await browser.newPage({ viewport: { width: 860, height: 800 } });
  const img = b => 'data:image/png;base64,' + b.toString('base64');
  await p.setContent('<body style="margin:0;background:#888;display:flex;gap:20px;align-items:flex-start;padding:20px;font:12px sans-serif">'
    + '<figure style="margin:0;width:390px"><figcaption>E2E</figcaption><img style="width:390px" src="' + img(left) + '"></figure>'
    + '<figure style="margin:0;width:390px"><figcaption>Real app</figcaption><img style="width:390px" src="' + img(right) + '"></figure></body>');
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
