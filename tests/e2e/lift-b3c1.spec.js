// Lift B3c1 (v8.190.0): the Reword Gauntlet on phones, against cert-ios-gauntlet.html.
// The forge is stubbed in the page (localhost only): _claudeFetch returns the drawing's RDP run and
// the quality checkers pass every rung, so the run is deterministic and offline.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const RUN = { concept: 'Remote Desktop listens on TCP 3389', rungs: [
  { question: 'Which TCP port does Remote Desktop Protocol listen on by default?', options: ['3389', '22', '445', '5900'], answer: 'A', explanation: 'RDP uses TCP 3389. SSH is 22, SMB 445, VNC 5900.', hinge: 'Remote Desktop Protocol' },
  { question: 'A help desk tech cannot reach a Windows server for remote desktop. The firewall log shows drops on one port only. Which port must be opened?', options: ['443', '3389', '23', '135'], answer: 'B', explanation: 'Remote desktop to Windows is RDP on 3389.', hinge: 'remote desktop' },
  { question: 'Which port is the BEST one to restrict to stop remote GUI logins to Windows hosts?', options: ['80', '389', '3389', '8080'], answer: 'C', explanation: 'Closing 3389 stops RDP.', hinge: 'BEST' },
  { question: 'All of these ports carry remote access EXCEPT which one?', options: ['22', '3389', '5900', '161'], answer: 'D', explanation: '161 is SNMP, not remote access.', hinge: 'EXCEPT' },
  { question: 'An admin moved RDP off its default port. Which port did they move it off of?', options: ['3389', '3390', '443', '22'], answer: 'A', explanation: 'The default RDP port is 3389.', hinge: 'off of' } ] };

async function boot(page, viewport, tier) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); localStorage.removeItem('nplus_gauntlet_free_count'); } catch (_) {}
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
  await page.evaluate(() => startRewordGauntlet());
  await expect(page.locator('#page-gauntlet')).toHaveClass(/active/);
}
module.exports = { RUN, boot, setTier, stubForge, openEntry };

for (const vp of PHONES) {
  test.describe('Lift B3c1 entry @' + vp.width, () => {
    test('June entry replaces the desktop card; tab bar stays; no app top bar', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await expect(page.locator('#igt-entry .igt-start')).toBeVisible();
      await expect(page.locator('#page-gauntlet .gnt-shell')).toBeHidden();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#igt-entry .igt-rg')).toHaveCount(5);
      await expect(page.locator('#igt-entry .igt-cap')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await setTier(page, 'free');
      await page.evaluate(() => startRewordGauntlet());
      await expect(page.locator('#igt-entry .igt-cap')).toContainText('Free covers one Gauntlet a day');
    });
    test('Pick a different topic opens the sheet; a tap updates the target to Your pick', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      const cur = (await page.locator('#igt-entry .igt-v').textContent()).trim();
      await page.locator('#igt-entry .igt-switch').click();
      await expect(page.locator('#igt-topics')).toBeVisible();
      await expect(page.locator('#igt-topics .igt-tlist button[aria-pressed="true"]')).toHaveText(cur);
      const other = page.locator('#igt-topics .igt-tlist button[aria-pressed="false"]').first();
      const name = (await other.textContent()).trim();
      await other.click();
      await expect(page.locator('#igt-topics')).toBeHidden();
      await expect(page.locator('#igt-entry .igt-v')).toHaveText(name);
      await expect(page.locator('#igt-entry .igt-why')).toHaveText('Your pick');
    });
    test('free second Start opens the gate and keeps the entry', async ({ page }) => {
      await openEntry(page, vp, 'free');
      await page.evaluate(() => {
        localStorage.setItem('nplus_gauntlet_free_count', JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: 1 }));
        window.__gate = 0; window._showProOnlyUI = function () { window.__gate++; };
      });
      await setTier(page, 'free');   // signed out, the app resets _quotaState after load
      await page.locator('#igt-entry .igt-start').click();
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => window.__gate)).toBe(1);
      expect(await page.evaluate(() => window.__forgeCalls)).toBe(0);
      await expect(page.locator('#page-gauntlet')).toHaveClass(/active/);
    });
    test('a misfire returns to the phone entry', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await stubForge(page, 'fail');
      await page.locator('#igt-entry .igt-start').click();
      await expect(page.locator('#page-gauntlet')).toHaveClass(/active/, { timeout: 8000 });
      await expect(page.locator('#igt-entry .igt-start')).toBeVisible();
      await stubForge(page);
      await page.locator('#igt-entry .igt-start').click();
      await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 8000 });
    });
    test('leaving the entry closes the topic sheet', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await page.locator('#igt-entry .igt-switch').click();
      await expect(page.locator('#igt-topics')).toBeVisible();
      await page.evaluate(() => gauntletBack());
      await expect(page.locator('#igt-topics')).toBeHidden();
      await page.evaluate(() => startRewordGauntlet());
      await expect(page.locator('#page-gauntlet')).toHaveClass(/active/);
      await expect(page.locator('#igt-topics')).toBeHidden();
    });
  });
}

test('Lift B3c1 desktop: the entry is today\'s', async ({ page }) => {
  await openEntry(page, DESKTOP, 'pro');
  await expect(page.locator('#page-gauntlet .gnt-shell')).toBeVisible();
  expect(await page.evaluate(() => (document.getElementById('igt-entry') || { innerHTML: '' }).innerHTML)).toBe('');
});

// ── Task 3: the run ──
// Lift A: pick an option, confirm with Next, then move on with Next question.
async function answer(page, idx) {
  await page.locator('#options .option').nth(idx).click();
  const nb = page.locator('#btn-next');
  await nb.click();                      // confirm the pick
  await page.waitForTimeout(150);
}
async function nextQ(page) { await page.locator('#btn-next').click(); await page.waitForTimeout(250); }
async function startRun(page, vp, tier) {
  await openEntry(page, vp, tier || 'pro');
  await page.locator('#igt-entry .igt-start').click();
  await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 8000 });
}
module.exports.answer = answer; module.exports.nextQ = nextQ; module.exports.startRun = startRun;

for (const vp of PHONES) {
  test.describe('Lift B3c1 run @' + vp.width, () => {
    test('the ladder replaces the pills during the run', async ({ page }) => {
      await startRun(page, vp);
      await expect(page.locator('#gauntlet-ladder')).toBeVisible();
      await expect(page.locator('#gauntlet-ladder .gnt-rung')).toHaveCount(5);
      await expect(page.locator('#quiz-prog-dots')).toBeHidden();
      await expect(page.locator('#gauntlet-ladder .gnt-rung').nth(0)).toHaveClass(/live/);
      await answer(page, 0);
      await expect(page.locator('#gauntlet-ladder .gnt-rung').nth(0)).toHaveClass(/done/);
      await nextQ(page);
      await expect(page.locator('#gauntlet-ladder .gnt-rung').nth(1)).toHaveClass(/live/);
      const tf = await page.evaluate(() => getComputedStyle(document.querySelector('#gauntlet-ladder .gnt-rung.live .gnt-rung-bar')).transform);
      expect(tf).not.toBe('none');
      const h = await page.evaluate(() => [0, 1].map((i) => getComputedStyle(document.querySelectorAll('#gauntlet-ladder .gnt-rung-bar')[i]).height));
      expect(h[0]).toBe(h[1]);   // the live rung grows by transform, never height
    });
    test('a normal quiz after a Gauntlet shows the pills', async ({ page }) => {
      await startRun(page, vp);
      for (let i = 0; i < 5; i++) { await answer(page, ['A', 'B', 'C', 'D', 'A'][i].charCodeAt(0) - 65); await nextQ(page); }
      await expect(page.locator('#page-gauntlet-result')).toHaveClass(/active/, { timeout: 8000 });
      await page.evaluate(() => window._testInjectQuiz([
        { type: 'mcq', question: 'Which port does HTTPS use by default?', options: { A: '443', B: '80', C: '22', D: '25' }, answer: 'A', explanation: 'HTTPS is 443.', topic: 'Ports & Protocols', difficulty: 'Foundational' },
        { type: 'mcq', question: 'Which port does SSH use by default?', options: { A: '21', B: '22', C: '23', D: '25' }, answer: 'B', explanation: 'SSH is 22.', topic: 'Ports & Protocols', difficulty: 'Foundational' }]));
      await expect(page.locator('#page-quiz')).toHaveClass(/active/);
      await expect(page.locator('#quiz-prog-dots')).toBeVisible();
      await expect(page.locator('#gauntlet-ladder')).toBeHidden();
    });
  });
}
