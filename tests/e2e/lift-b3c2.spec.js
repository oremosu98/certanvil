// Lift B3c2 (v8.191.0): Why-Not on phones, against cert-ios-whynot.html.
// The forge is stubbed in the page (localhost only): _claudeFetch returns five rounds in today's shape (the
// drawing's RDP round first) and the quality checkers pass them, so a session is deterministic and offline.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const KIT = (r, f1, f2, n) => ({ reason: r, fakes: [f1, f2], note: n });
const ROUND = (q, opts, ans, expl, kits) => ({ question: q, options: opts, answer: ans, explanation: expl, whynot: kits });
const RUN = { rounds: [
  ROUND('Which TCP port does Remote Desktop Protocol listen on by default?', ['3389', '22', '445', '5900'], 'A', 'RDP listens on TCP 3389 by default.', {
    B: KIT('22 is SSH, a command-line login.', '22 is UDP only, so it cannot carry a session.', '22 is reserved for DNS zone transfers.', 'SSH owns 22 and gives you a command line.'),
    C: KIT('445 is SMB, for file and printer sharing.', '445 only carries encrypted web traffic.', '445 is what RDP falls back to without NLA.', 'SMB shares run on 445.'),
    D: KIT('5900 is VNC, a different remote desktop protocol.', 'Windows blocks 5900, so nothing can listen on it.', '5900 is the RDP port for multi-monitor sessions.', 'VNC listens on 5900.') }),
  ROUND('Which port does HTTPS use by default on the public web?', ['80', '443', '8080', '21'], 'B', 'HTTPS uses TCP 443.', {
    A: KIT('80 is plain HTTP.', '80 is only for FTP.', '80 is UDP only.', 'HTTP is 80, HTTPS is 443.'),
    C: KIT('8080 is a common alternate HTTP port.', '8080 is reserved for DNS.', '8080 is SMTP.', '8080 is an alternate, not the default.'),
    D: KIT('21 is FTP control.', '21 is HTTPS on old servers.', '21 is SSH.', 'FTP control uses 21.') }),
  ROUND('Which port does DNS use for ordinary name lookups?', ['25', '110', '53', '123'], 'C', 'DNS lookups use port 53.', {
    A: KIT('25 is SMTP mail transfer.', '25 is DNS over TCP.', '25 is NTP.', 'SMTP is 25.'),
    B: KIT('110 is POP3 mail retrieval.', '110 is DNS zone transfers.', '110 is LDAP.', 'POP3 is 110.'),
    D: KIT('123 is NTP time sync.', '123 is DNS over UDP.', '123 is SNMP.', 'NTP is 123.') }),
  ROUND('Which port does SNMP polling use?', ['161', '389', '636', '514'], 'A', 'SNMP polling uses UDP 161.', {
    B: KIT('389 is LDAP.', '389 is SNMP traps.', '389 is Syslog.', 'LDAP is 389.'),
    C: KIT('636 is LDAPS.', '636 is SNMPv3.', '636 is RDP.', 'LDAPS is 636.'),
    D: KIT('514 is Syslog.', '514 is SNMP polling.', '514 is SSH.', 'Syslog is 514.') }),
  ROUND('Which port does SSH use by default?', ['23', '22', '3389', '69'], 'B', 'SSH uses TCP 22.', {
    A: KIT('23 is Telnet.', '23 is SFTP.', '23 is SSH over UDP.', 'Telnet is 23 and unencrypted.'),
    C: KIT('3389 is RDP.', '3389 is SSH tunnelling.', '3389 is SCP.', 'RDP is 3389.'),
    D: KIT('69 is TFTP.', '69 is SSH keys.', '69 is SFTP.', 'TFTP is 69.') })
] };

async function boot(page, viewport, tier) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1'); } catch (_) {}   // the iOS Safari install banner would cover the docks
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  await setTier(page, tier || 'pro');
}
async function setTier(page, tier) {
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro' } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
  }, tier);
}
async function stubForge(page, mode) {
  await page.evaluate(([run, m]) => {
    window.__forgeCalls = 0;
    window._claudeFetch = async () => { window.__forgeCalls++; if (m === 'fail') throw new Error('forge down');
      return { ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(run) }] }) }; };
    window.aiValidateQuestions = async (k, qs) => qs; window.validateQuestions = (qs) => qs;
  }, [RUN, mode || 'ok']);
}
async function openEntry(page, vp, tier) {
  await boot(page, vp, tier);
  await stubForge(page);
  await page.evaluate(() => startWhyNot());
  await expect(page.locator('#page-whynot')).toHaveClass(/active/);
}
module.exports = { RUN, boot, setTier, stubForge, openEntry };

for (const vp of PHONES) {
  test.describe('Lift B3c2 entry @' + vp.width, () => {
    test('June entry replaces the desktop card; tab bar stays; no app top bar', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await expect(page.locator('#iwn-entry .iwn-start')).toBeVisible();
      await expect(page.locator('#page-whynot .gnt-shell')).toBeHidden();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#iwn-entry .iwn-rd')).toHaveCount(3);
      await expect(page.locator('#iwn-entry .iwn-pro')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await setTier(page, 'free');
      await page.evaluate(() => startWhyNot());
      await expect(page.locator('#iwn-entry .iwn-pro')).toHaveCount(1);
    });
    test('Pick a different topic opens the sheet; a tap updates the target to Your pick', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      const cur = (await page.locator('#iwn-entry .iwn-v').textContent()).trim();
      await page.locator('#iwn-entry .iwn-switch').click();
      await expect(page.locator('#igt-topics')).toBeVisible();
      await expect(page.locator('#igt-topics .igt-tlist button[aria-pressed="true"]')).toHaveText(cur);
      const other = page.locator('#igt-topics .igt-tlist button[aria-pressed="false"]').first();
      const name = (await other.textContent()).trim();
      await other.click();
      await expect(page.locator('#igt-topics')).toBeHidden();
      await expect(page.locator('#iwn-entry .iwn-v')).toHaveText(name);
      await expect(page.locator('#iwn-entry .iwn-why')).toHaveText('Your pick');
    });
    test("free Start opens today's Pro gate and keeps the entry", async ({ page }) => {
      await openEntry(page, vp, 'free');
      await page.evaluate(() => { window.__gate = 0; window._showProOnlyUI = function () { window.__gate++; }; });
      await setTier(page, 'free');   // signed out, the app resets _quotaState after load
      await page.locator('#iwn-entry .iwn-start').click();
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => window.__gate)).toBe(1);
      expect(await page.evaluate(() => window.__forgeCalls)).toBe(0);
      await expect(page.locator('#page-whynot')).toHaveClass(/active/);
    });
    test('a misfire returns to the phone entry', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await stubForge(page, 'fail');
      await setTier(page, 'pro');
      await page.locator('#iwn-entry .iwn-start').click();
      await expect(page.locator('#page-whynot')).toHaveClass(/active/, { timeout: 8000 });
      await expect(page.locator('#iwn-entry .iwn-start')).toBeVisible();
      await stubForge(page);
      await setTier(page, 'pro');
      await page.locator('#iwn-entry .iwn-start').click();
      await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 8000 });
    });
  });
}

// Lift A: pick an option, confirm with Next, then move on to the reason step with Next.
async function answer(page, idx) {
  await page.locator('#options .option').nth(idx).click();
  await page.locator('#btn-next').click();
  await page.waitForTimeout(150);
}
async function nextQ(page) { await page.locator('#btn-next').click(); await page.waitForTimeout(250); }
async function startSession(page, vp) {
  await openEntry(page, vp, 'pro');
  await setTier(page, 'pro');
  await page.locator('#iwn-entry .iwn-start:visible, #wn-start-btn:visible').first().click();   // phone or desktop Start
  await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 8000 });
}
async function toReasons(page, vp, right) {
  await startSession(page, vp);
  await page.locator('#options .option').nth(right === false ? 1 : 0).click();
  // phones confirm then move on (two Nexts); desktop reveals on the pick (one Next)
  for (let k = 0; k < 3 && !(await page.locator('#page-whynot-round').evaluate(el => el.classList.contains('active'))); k++) {
    await page.locator('#btn-next').click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
  await expect(page.locator('#page-whynot-round')).toHaveClass(/active/, { timeout: 8000 });
}
const trueIdx = (page) => page.evaluate(() => _wnRound.map.findIndex(x => x.real));
const fakeIdx = (page) => page.evaluate(() => _wnRound.map.findIndex(x => !x.real));

for (const vp of PHONES) {
  test.describe('Lift B3c2 reasons @' + vp.width, () => {
    test('the question shows Round 1 of 3', async ({ page }) => {
      await startSession(page, vp);
      await expect(page.locator('#q-label')).toHaveText('Round 1 of 3');
      await expect(page.locator('#quiz-prog-dots')).toBeHidden();
      // side-by-side drift: only the topic takes the accent; "Why-Not" and the round count stay dim
      await expect(page.locator('#gauntlet-run-topic span')).toHaveCount(2);
      await expect(page.locator('#gauntlet-run-topic span').nth(1)).toHaveText(' · Round 1 of 3');
    });
    test('the reason step: one option at a time, the note after a pick', async ({ page }) => {
      await toReasons(page, vp);
      await expect(page.locator('#lift-tabbar')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#wn-round-root .iwn-ans')).toContainText('Right. Now earn the other three points.');
      await expect(page.locator('#wn-round-root .iwn-reason')).toHaveCount(3);
      await expect(page.locator('#wn-round-root .iwn-next')).toHaveClass(/wait/);
      const t = await trueIdx(page);
      await page.locator('#wn-round-root .iwn-reason').nth(t).click();
      await expect(page.locator('#wn-round-root .iwn-reason').nth(t)).toHaveClass(/right/);
      await expect(page.locator('#wn-round-root .iwn-reason.dim')).toHaveCount(2);
      await expect(page.locator('#wn-round-root .iwn-note')).toContainText('Right reason');
      await expect(page.locator('#wn-round-root .iwn-next')).toHaveText('Next: why does C lose?');
      await expect(page.locator('#wn-round-root .iwn-next')).not.toHaveClass(/wait/);
      await page.locator('#wn-round-root .iwn-next').click();
      await expect(page.locator('#wn-round-root .iwn-lt')).toHaveText('C');
      await expect(page.locator('#wn-round-root')).toHaveClass(/iwn-static/);
    });
    test('a fake pick turns red and the true reason green', async ({ page }) => {
      await toReasons(page, vp);
      const t = await trueIdx(page), f = await fakeIdx(page);
      await page.locator('#wn-round-root .iwn-reason').nth(f).click();
      await expect(page.locator('#wn-round-root .iwn-reason').nth(f)).toHaveClass(/wrong/);
      await expect(page.locator('#wn-round-root .iwn-reason').nth(t)).toHaveClass(/right/);
      await expect(page.locator('#wn-round-root .iwn-note')).toContainText('Wrong reason');
    });
    test('a double-tap on a reason scores once', async ({ page }) => {
      await toReasons(page, vp);
      const before = await page.evaluate(() => _wnSession.points);
      await page.locator('#wn-round-root .iwn-reason').nth(await trueIdx(page)).dblclick();
      await page.waitForTimeout(200);
      expect(await page.evaluate(() => _wnSession.points)).toBe(before + 1);
      await expect(page.locator('#wn-round-root .iwn-note')).toHaveCount(1);
    });
    test('crossing 899px keeps the reason step', async ({ page }) => {
      await toReasons(page, vp);
      const t = await trueIdx(page);
      await page.locator('#wn-round-root .iwn-reason').nth(t).click();
      await page.setViewportSize(DESKTOP);
      await expect(page.locator('#wn-round-root .wn-card')).toBeVisible();
      await expect(page.locator('#wn-round-root .wn-target b')).toHaveText('22');
      await page.setViewportSize(vp);
      await expect(page.locator('#wn-round-root .iwn-card')).toBeVisible();
      await expect(page.locator('#wn-round-root .iwn-reason').nth(t)).toHaveClass(/right/);
    });
    test('leave sheet: Keep going stays, Leave exits', async ({ page }) => {
      await toReasons(page, vp);
      await page.locator('#wn-round-root .iwn-leave').click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Leave Why-Not?');
      await page.locator('#exam-sheet .ix-sheet-stay').click();
      await expect(page.locator('#exam-sheet')).toBeHidden();
      await expect(page.locator('#page-whynot-round')).toHaveClass(/active/);
      await page.locator('#wn-round-root .iwn-leave').click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/, { timeout: 5000 });   // opened from Home, so today's exit lands on Home
      expect(await page.evaluate(() => whyNotMode)).toBe(false);
      await page.evaluate(() => window._testInjectQuiz([
        { type: 'mcq', question: 'Which port does HTTPS use by default?', options: { A: '443', B: '80', C: '22', D: '25' }, answer: 'A', explanation: 'HTTPS is 443.', topic: 'Ports & Protocols', difficulty: 'Foundational' },
        { type: 'mcq', question: 'Which port does SSH use by default?', options: { A: '21', B: '22', C: '23', D: '25' }, answer: 'B', explanation: 'SSH is 22.', topic: 'Ports & Protocols', difficulty: 'Foundational' }]));
      await expect(page.locator('#q-label')).toContainText('Question 1 of');
    });
  });
}

// One round's reasons: picks[i] true = pick the true reason for wrong option i, false = a fake. Ends on the round verdict.
async function playReasons(page, picks) {
  for (let i = 0; i < 3; i++) {
    const idx = picks[i] ? await trueIdx(page) : await fakeIdx(page);
    await page.locator('#wn-round-root .iwn-reason').nth(idx).click();
    await page.locator('#wn-round-root .iwn-next').click();
    await page.waitForTimeout(150);
  }
  await expect(page.locator('#page-whynot-verdict')).toHaveClass(/active/, { timeout: 5000 });
}
// From the quiz page: answer round n's question right (rounds' answers are A, B, C), then its reasons.
async function playRound(page, n, picks) {
  await page.locator('#options .option').nth(n).click();
  for (let k = 0; k < 3 && !(await page.locator('#page-whynot-round').evaluate(el => el.classList.contains('active'))); k++) {
    await page.locator('#btn-next').click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
  await playReasons(page, picks);
}

for (const vp of PHONES) {
  test.describe('Lift B3c2 verdicts @' + vp.width, () => {
    test('round verdict: N of 4, rows open to your reason and the true reason', async ({ page }) => {
      await toReasons(page, vp);
      await playReasons(page, [true, true, false]);
      await expect(page.locator('#lift-tabbar')).toBeHidden();
      await expect(page.locator('#wn-verdict-root .iwn-vtitle')).toHaveText('You earned 3 of 4');
      await expect(page.locator('#wn-verdict-root .iwn-callout')).toContainText('misdiagnosed why');
      await expect(page.locator('#wn-verdict-root .iwn-srow')).toHaveCount(4);
      await page.locator('#wn-verdict-root .iwn-srow').nth(3).click();
      const d3 = page.locator('#iwn-sdet-3');
      await expect(d3).toBeVisible();
      await expect(d3).toContainText('Your reason');
      await expect(d3).toContainText('True reason');
      await expect(d3).toContainText('5900 is VNC, a different remote desktop protocol.');
      await expect(d3).toContainText('VNC listens on 5900.');
      const fake = await page.evaluate(() => _wnSession.roundResults[0].pickedText.D);
      await expect(d3).toContainText(fake);
      await page.locator('#wn-verdict-root .iwn-srow').nth(1).click();
      await expect(page.locator('#iwn-sdet-1')).not.toContainText('Your reason');
      await page.locator('#wn-verdict-root .iwn-srow').nth(0).click();
      await expect(page.locator('#iwn-sdet-0')).toContainText('Your first pick');
      await expect(page.locator('#iwn-sdet-0')).toContainText('3389');
      await expect(page.locator('#wn-verdict-root .iwn-primary')).toHaveText('Next round');
    });
    test('Next round, then the session verdict', async ({ page }) => {
      const before = await (async () => { await startSession(page, vp); return page.evaluate(() => loadHistory().filter(h => h.mode === 'whynot').length); })();
      await playRound(page, 0, [true, true, true]);
      await page.locator('#wn-verdict-root .iwn-primary').click();
      await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 5000 });
      await expect(page.locator('#q-label')).toHaveText('Round 2 of 3');
      await playRound(page, 1, [true, false, true]);
      await page.locator('#wn-verdict-root .iwn-primary').click();
      await playRound(page, 2, [true, true, true]);
      await expect(page.locator('#wn-verdict-root .iwn-primary')).toHaveText('Session verdict');
      const pts = await page.evaluate(() => _wnSession.points);
      await page.locator('#wn-verdict-root .iwn-primary').click();
      await expect(page.locator('#wn-verdict-root .iwn-stitle')).toHaveText('Session: ' + pts + ' of 12');
      await expect(page.locator('#wn-verdict-root .iwn-meter i')).toHaveCount(12);
      await expect(page.locator('#wn-verdict-root .iwn-meter i.on')).toHaveCount(pts);
      await expect(page.locator('#wn-verdict-root .iwn-sround')).toHaveCount(3);
      await expect(page.locator('#wn-verdict-root .iwn-sround').nth(1)).toContainText('3 of 4');
      expect(await page.evaluate(() => loadHistory().filter(h => h.mode === 'whynot').length)).toBe(before + 1);
    });
    test('session verdict Back leaves without asking', async ({ page }) => {
      await startSession(page, vp);
      for (let n = 0; n < 3; n++) { await playRound(page, n, [true, true, true]); await page.locator('#wn-verdict-root .iwn-primary').click(); }
      await expect(page.locator('#wn-verdict-root .iwn-stitle')).toBeVisible();
      await page.locator('#wn-verdict-root .iwn-leave').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/, { timeout: 5000 });   // opened from Home
      await expect(page.locator('#exam-sheet')).toBeHidden();
    });
  });
}

test.describe('Lift B3c2 desktop', () => {
  test("the entry is today's", async ({ page }) => {
    await openEntry(page, DESKTOP, 'pro');
    await expect(page.locator('#page-whynot .gnt-shell')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('iwn-entry').innerHTML)).toBe('');
  });
  test("the reason step is today's; Leave session exits without a sheet", async ({ page }) => {
    await toReasons(page, DESKTOP);
    await expect(page.locator('#wn-round-root .wn-card')).toBeVisible();
    await expect(page.locator('#wn-round-root .iwn-card')).toHaveCount(0);
    await page.locator('#wn-round-root [data-action="whyNotExit"]').click();
    await expect(page.locator('#exam-sheet')).toBeHidden();
    await expect(page.locator('#page-whynot-round')).not.toHaveClass(/active/, { timeout: 5000 });
  });
  test("verdicts are today's", async ({ page }) => {
    await toReasons(page, DESKTOP);
    for (let i = 0; i < 3; i++) {
      await page.locator('#wn-round-root .wn-reason').nth(await trueIdx(page)).click();
      await page.locator('#wn-next-btn').click();
      await page.waitForTimeout(150);
    }
    await expect(page.locator('#wn-verdict-root .wn-vd-head')).toBeVisible();
    await expect(page.locator('#wn-verdict-root .iwn-vbody')).toHaveCount(0);
  });
});
