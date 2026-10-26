// The quiz ✕ during a drill on phones (≤899px): a Reword Gauntlet run or a Why-Not round's question asks in
// the in-app sheet (#exam-sheet), never the browser's confirm(), and Leave lands where that drill's own exit
// lands (Drills or Home). Normal quizzes and desktop keep today's confirm() and Home.
// The forge is stubbed in the page (localhost only), as in lift-b3c1 / lift-b3c2.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const GAUNTLET = { concept: 'Remote Desktop listens on TCP 3389', rungs: [
  { question: 'Which TCP port does Remote Desktop Protocol listen on by default?', options: ['3389', '22', '445', '5900'], answer: 'A', explanation: 'RDP uses TCP 3389.', hinge: 'Remote Desktop Protocol' },
  { question: 'A tech cannot reach a Windows server over remote desktop. Which port must be opened?', options: ['443', '3389', '23', '135'], answer: 'B', explanation: 'RDP is 3389.', hinge: 'remote desktop' },
  { question: 'Which port is the BEST one to restrict to stop remote GUI logins to Windows hosts?', options: ['80', '389', '3389', '8080'], answer: 'C', explanation: 'Closing 3389 stops RDP.', hinge: 'BEST' },
  { question: 'All of these ports carry remote access EXCEPT which one?', options: ['22', '3389', '5900', '161'], answer: 'D', explanation: '161 is SNMP.', hinge: 'EXCEPT' },
  { question: 'An admin moved RDP off its default port. Which port did they move it off of?', options: ['3389', '3390', '443', '22'], answer: 'A', explanation: 'The default RDP port is 3389.', hinge: 'off of' } ] };
const KIT = (o) => ({ reason: o + ' belongs to another service.', fakes: [o + ' is UDP only.', o + ' is reserved.'], note: o + ' is something else.' });
const WN_ROUND = (q, opts, ans) => ({ question: q, options: opts, answer: ans, explanation: 'See the port table.',
  whynot: Object.fromEntries(['A', 'B', 'C', 'D'].filter(l => l !== ans).map((l, i) => [l, KIT(opts[i])])) });
const WHYNOT = { rounds: [
  WN_ROUND('Which TCP port does Remote Desktop Protocol listen on by default?', ['3389', '22', '445', '5900'], 'A'),
  WN_ROUND('Which port does HTTPS use by default on the public web?', ['80', '443', '8080', '21'], 'B'),
  WN_ROUND('Which port does DNS use for ordinary name lookups?', ['25', '110', '53', '123'], 'C'),
  WN_ROUND('Which port does SNMP polling use?', ['161', '389', '636', '514'], 'A'),
  WN_ROUND('Which port does SSH use by default?', ['23', '22', '3389', '69'], 'B') ] };

async function boot(page, viewport, run) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1'); localStorage.removeItem('nplus_gauntlet_free_count'); } catch (_) {}
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  await setPro(page);
  await page.evaluate((r) => {
    window._claudeFetch = async () => ({ ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(r) }] }) });
    window.aiValidateQuestions = async (k, qs) => qs; window.validateQuestions = (qs) => qs;
  }, run);
  page.__dialogs = [];
  page.on('dialog', (d) => { page.__dialogs.push(d.message()); d.dismiss().catch(() => {}); });
}
async function setPro(page) {
  await page.evaluate(() => { window._quotaState = { tier: 'pro' }; document.body.classList.add('is-state-resolved', 'is-pro-tier'); });
}
// from = 'drills' | 'setup': where the drill was opened from (its own exit lands there).
async function startGauntlet(page, vp, from) {
  await boot(page, vp, GAUNTLET);
  if (from === 'drills') { await page.evaluate(() => showPage('drills')); await page.waitForTimeout(400); }
  await page.evaluate(() => startRewordGauntlet());
  await expect(page.locator('#page-gauntlet')).toHaveClass(/active/);
  await setPro(page);   // the tier can re-resolve after boot (as in lift-b3c2)
  await page.locator('#igt-entry .igt-start:visible, #gnt-start-btn:visible').first().click();
  await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 8000 });
  expect(await page.evaluate(() => gauntletMode)).toBe(true);
}
async function startWhyNotRun(page, vp, from) {
  await boot(page, vp, WHYNOT);
  if (from === 'drills') { await page.evaluate(() => showPage('drills')); await page.waitForTimeout(400); }
  await page.evaluate(() => startWhyNot());
  await expect(page.locator('#page-whynot')).toHaveClass(/active/);
  await setPro(page);
  await page.locator('#iwn-entry .iwn-start:visible, #wn-start-btn:visible').first().click();
  await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 8000 });
  expect(await page.evaluate(() => whyNotMode)).toBe(true);
}
const x = (page) => page.locator('#page-quiz .back-btn');

for (const vp of PHONES) {
  test.describe('Quiz ✕ in a drill @' + vp.width, () => {
    test('Gauntlet: the ✕ asks in the sheet; Keep going stays; Leave lands on Drills', async ({ page }) => {
      await startGauntlet(page, vp, 'drills');
      await x(page).click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Leave the Gauntlet?');
      await expect(page.locator('#exam-sheet .ix-sheet-body')).toHaveText('This concept won’t count as cracked.');
      await expect(page.locator('#exam-sheet .ix-sheet-stay')).toHaveText('Keep going');
      await expect(page.locator('#exam-sheet .ix-sheet-go')).toHaveText('Leave');
      await page.locator('#exam-sheet .ix-sheet-stay').click();
      await expect(page.locator('#exam-sheet')).toBeHidden();
      await expect(page.locator('#page-quiz')).toHaveClass(/active/);
      expect(await page.evaluate(() => gauntletMode)).toBe(true);
      await x(page).click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 5000 });
      expect(await page.evaluate(() => [gauntletMode, _gauntletRun])).toEqual([false, null]);
      expect(page.__dialogs).toEqual([]);
    });
    test('Gauntlet opened from Home: Leave lands on Home', async ({ page }) => {
      await startGauntlet(page, vp, 'setup');
      await x(page).click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/, { timeout: 5000 });
      expect(await page.evaluate(() => gauntletMode)).toBe(false);
      expect(page.__dialogs).toEqual([]);
    });
    test("Why-Not question: the ✕ asks Why-Not's sheet; Keep going stays; Leave lands on Drills", async ({ page }) => {
      await startWhyNotRun(page, vp, 'drills');
      await x(page).click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Leave Why-Not?');
      await page.locator('#exam-sheet .ix-sheet-stay').click();
      await expect(page.locator('#exam-sheet')).toBeHidden();
      await expect(page.locator('#page-quiz')).toHaveClass(/active/);
      expect(await page.evaluate(() => whyNotMode)).toBe(true);
      await x(page).click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 5000 });
      expect(await page.evaluate(() => [whyNotMode, _wnSession])).toEqual([false, null]);
      expect(page.__dialogs).toEqual([]);
    });
    test('crossing 899px with the sheet open closes it and keeps the question', async ({ page }) => {
      await startGauntlet(page, vp, 'drills');
      await x(page).click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await page.setViewportSize(DESKTOP);
      await expect(page.locator('#exam-sheet')).toBeHidden();
      await expect(page.locator('#page-quiz')).toHaveClass(/active/);
      expect(await page.evaluate(() => gauntletMode)).toBe(true);
    });
    test("a normal quiz keeps today's confirm()", async ({ page }) => {
      await boot(page, vp, GAUNTLET);
      await page.evaluate(() => window._testInjectQuiz([
        { type: 'mcq', question: 'Which port does HTTPS use by default?', options: { A: '443', B: '80', C: '22', D: '25' }, answer: 'A', explanation: 'HTTPS is 443.', topic: 'Ports & Protocols', difficulty: 'Foundational' }]));
      await expect(page.locator('#page-quiz')).toHaveClass(/active/);
      await x(page).click();
      await expect.poll(() => page.__dialogs.length).toBe(1);
      await expect(page.locator('#exam-sheet')).toBeHidden();
      await expect(page.locator('#page-quiz')).toHaveClass(/active/);   // dismissed = stay
    });
  });
}

test.describe('Quiz ✕ in a drill — desktop', () => {
  test("Gauntlet keeps today's confirm() and Home", async ({ page }) => {
    await startGauntlet(page, DESKTOP, 'setup');
    page.removeAllListeners('dialog');
    const seen = [];
    page.on('dialog', (d) => { seen.push(d.message()); d.accept(); });
    await x(page).click();
    await expect(page.locator('#page-setup')).toHaveClass(/active/, { timeout: 5000 });
    expect(seen).toEqual(['Go back to the menu? Quiz progress will be lost.']);
    await expect(page.locator('#exam-sheet')).toBeHidden();
    expect(await page.evaluate(() => gauntletMode)).toBe(false);
  });
  test("Why-Not keeps today's confirm()", async ({ page }) => {
    await startWhyNotRun(page, DESKTOP, 'setup');
    await x(page).click();
    await expect.poll(() => page.__dialogs.length).toBe(1);
    await expect(page.locator('#exam-sheet')).toBeHidden();
  });
});
