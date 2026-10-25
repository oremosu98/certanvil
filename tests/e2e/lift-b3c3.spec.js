// Lift B3c3 (v8.192.0): Decision Lab and its Exam-style on phones, against cert-ios-decisionlab.html.
// Runs on the real AZ-900 seed (features/decision-lab-seed-az900.js), loaded by _ensureDecisionLabLoaded after
// switching CURRENT_CERT; no network.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };

async function boot(page, viewport, tier) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1'); } catch (_) {}   // the iOS Safari install banner would cover the docks
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.evaluate(() => new Promise((res) => { window.CURRENT_CERT = 'az900'; window._ensureDecisionLabLoaded(res); }));
  await setTier(page, tier || 'pro');
}
async function setTier(page, tier) {
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro' } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
  }, tier);
}
// Opens the entry the way a person does: from Drills (or Home with from: 'setup').
async function openEntry(page, vp, tier, from) {
  await boot(page, vp, tier);
  await page.evaluate((f) => { showPage(f === 'setup' ? 'setup' : 'drills'); }, from || 'drills');
  await page.waitForTimeout(400);
  await setTier(page, tier || 'pro');   // signed out, the app resets _quotaState after load
  await page.evaluate(() => decisionLabOpenEntry());
  await expect(page.locator('#page-decision-lab-entry')).toHaveClass(/active/);
}
module.exports = { boot, setTier, openEntry };

// Starts a practice set of n decisions from the entry (Pro unless tier says otherwise).
async function startPractice(page, vp, tier, n) {
  await openEntry(page, vp, tier || 'pro');
  if (n && n !== 10) await page.evaluate((k) => decisionLabPickDecisions(k), n);
  await page.evaluate(() => decisionLabSessionStart());
  await expect(page.locator('#page-decision-lab')).toHaveClass(/active/, { timeout: 5000 });
  await expect(page.locator('#dl-body .sl-analyze-line').first()).toBeVisible();
}
// Clicks an analyze line: the right one, or the first wrong one.
async function pickLine(page, right) {
  const ids = await page.evaluate(() => { const s = window._simLab.dlSession(); const st = s.scenarios[s.idx].steps[0]; return (st.answer && st.answer.selected) || []; });
  const lines = page.locator('#dl-body .sl-analyze-line');
  const n = await lines.count();
  for (let i = 0; i < n; i++) {
    const id = await lines.nth(i).getAttribute('data-line');
    if ((ids.indexOf(id) !== -1) === !!right) { await lines.nth(i).click(); return; }
  }
}

for (const vp of PHONES) {
  test.describe('Lift B3c3 entry @' + vp.width, () => {
    test('June entry replaces the desktop card; tab bar stays; no app top bar', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await expect(page.locator('#idl-entry .idl-start')).toBeVisible();
      await expect(page.locator('#page-decision-lab-entry .gnt-shell')).toBeHidden();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#idl-entry .idl-mode')).toHaveCount(2);
      await expect(page.locator('#idl-entry .idl-seg button')).toHaveCount(3);
      await expect(page.locator('#idl-entry .idl-pro')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
    test('free: Exam-style and 20 open today\'s gates and keep Practice · 10', async ({ page }) => {
      await openEntry(page, vp, 'free');
      await page.evaluate(() => { window.__gates = []; window._gateProOnly = function (f, o) { window.__gates.push(o && o.title); return false; }; });
      await setTier(page, 'free');
      await expect(page.locator('#idl-entry .idl-pro')).toHaveCount(1);
      await page.locator('#idl-entry [data-mode="exam"]').click();
      await page.locator('#idl-entry [data-n="20"]').click();
      expect(await page.evaluate(() => window.__gates)).toEqual(['Exam-style mode is Pro', 'The full 20-decision set is Pro']);
      await expect(page.locator('#idl-entry [data-mode="practice"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#idl-entry [data-n="10"]')).toHaveAttribute('aria-pressed', 'true');
    });
    test('Pro: picking Exam-style and 5 updates the cards and the Start count', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await page.locator('#idl-entry [data-mode="exam"]').click();
      await page.locator('#idl-entry [data-n="5"]').click();
      await expect(page.locator('#idl-entry [data-mode="exam"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#idl-entry [data-n="5"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#idl-entry .idl-qc')).toHaveText('5 decisions');
    });
    test('back goes where Decision Lab was opened from', async ({ page }) => {
      await openEntry(page, vp, 'pro', 'drills');
      await page.locator('#idl-entry .idl-back').click();
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 4000 });
    });
    test('Leave stops the clock and a new set starts clean', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await page.locator('#idl-entry [data-mode="exam"]').click();
      await page.locator('#idl-entry .idl-start').click();
      await expect(page.locator('#page-decision-lab')).toHaveClass(/active/, { timeout: 5000 });
      await page.evaluate(() => decisionLabExit());
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 4000 });
      await page.waitForTimeout(1300);
      expect(await page.evaluate(() => !!document.querySelector('#page-decision-lab-result.active'))).toBe(false);
      await page.evaluate(() => decisionLabOpenEntry());
      await page.locator('#idl-entry [data-mode="practice"]').click();
      await page.locator('#idl-entry .idl-start').click();
      await expect(page.locator('#dl-round-pill')).toHaveText('Decision 1 of 10', { timeout: 5000 });
    });
  });
}

for (const vp of PHONES) {
  test.describe('Lift B3c3 practice @' + vp.width, () => {
    test('practice: header, dots, docked Submit, no tab bar or top bar', async ({ page }) => {
      await startPractice(page, vp);
      await expect(page.locator('#page-decision-lab')).toHaveClass(/idl-practice/);
      await expect(page.locator('#lift-tabbar')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#dl-round-pill')).toHaveText('Decision 1 of 10');
      await expect(page.locator('#dl-dots .dl-dot')).toHaveCount(10);
      await expect(page.locator('#page-decision-lab [data-action="decisionLabExit"]')).toHaveAttribute('aria-label', 'Leave Decision Lab');
      await expect(page.locator('#dl-body .isl-scn-k')).toHaveText('Scenario');
      const sub = page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]');
      await expect(sub).toHaveText('Submit');
      expect(await sub.evaluate((b) => getComputedStyle(b.closest('.sl-actions')).position)).toBe('fixed');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
    test('Submit grades in place: Best, Your pick, the tell; Next decision takes the dock', async ({ page }) => {
      await startPractice(page, vp);
      await pickLine(page, false);
      await page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]').click();
      await expect(page.locator('#dl-body .dl-correct .dl-verdict')).toHaveText('Best');
      await expect(page.locator('#dl-body .dl-picked-wrong .dl-verdict')).toHaveText('Your pick');
      await expect(page.locator('#dl-body .dl-teach-k')).toHaveText('The tell');
      await expect(page.locator('#dl-body .sl-actions button')).toHaveCount(1);
      await expect(page.locator('#dl-body .sl-actions button')).toHaveText('Next decision');
      await expect(page.locator('#dl-body')).not.toContainText('Flag');
      await page.locator('#dl-body .sl-actions button').click();
      await expect(page.locator('#dl-round-pill')).toHaveText('Decision 2 of 10');
      await expect(page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]')).toHaveText('Submit');
    });
    test('the last decision says See results and opens the results', async ({ page }) => {
      await startPractice(page, vp, 'pro', 5);
      for (let i = 0; i < 5; i++) {
        await pickLine(page, i % 2 === 0);
        await page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]').click();
        await expect(page.locator('#dl-body .sl-actions button')).toHaveText(i === 4 ? 'See results' : 'Next decision');
        await page.locator('#dl-body .sl-actions button').click();
      }
      await expect(page.locator('#page-decision-lab-result')).toHaveClass(/active/, { timeout: 5000 });
    });
    test('‹ asks before leaving; Keep going stays; Leave exits', async ({ page }) => {
      await startPractice(page, vp, 'free');
      const back = page.locator('#page-decision-lab [data-action="decisionLabExit"]');
      await back.click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Leave Decision Lab?');
      await expect(page.locator('#exam-sheet')).toContainText('Your decisions so far won’t count. Today’s free set is already used.');
      await page.locator('#exam-sheet .ix-sheet-stay').click();
      await expect(page.locator('#exam-sheet')).toBeHidden();
      await expect(page.locator('#page-decision-lab')).toHaveClass(/active/);
      await back.click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 5000 });
      expect(await page.evaluate(() => window._simLab.dlSession())).toBeNull();
    });
  });
}

test.describe('Lift B3c3 desktop', () => {
  test("today's entry; Leave on the runner now leaves", async ({ page }) => {
    await openEntry(page, DESKTOP, 'pro', 'drills');
    await expect(page.locator('#page-decision-lab-entry .gnt-shell')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('idl-entry').innerHTML)).toBe('');
    await page.locator('#dl-start').click();
    await expect(page.locator('#page-decision-lab')).toHaveClass(/active/, { timeout: 5000 });
    await page.locator('#page-decision-lab [data-action="decisionLabExit"]').click();
    await expect(page.locator('#page-decision-lab')).not.toHaveClass(/active/, { timeout: 4000 });
  });
  test("practice is today's: inline Submit, Next decision with the arrow, the Flag row", async ({ page }) => {
    await openEntry(page, DESKTOP, 'pro', 'drills');
    await page.locator('#dl-start').click();
    await expect(page.locator('#dl-body .sl-analyze-line').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#page-decision-lab')).not.toHaveClass(/idl-practice/);
    const sub = page.locator('#dl-body [data-action="simLabSubmitScenario"]');
    await expect(sub).toHaveText('Submit answers');
    expect(await sub.evaluate((b) => getComputedStyle(b.closest('.sl-actions')).position)).not.toBe('fixed');
    await pickLine(page, false);
    await sub.click();
    await expect(page.locator('#dl-body .dl-correct .dl-verdict')).toHaveText('✓ Best');
    await expect(page.locator('#dl-body .dl-cta-row .dl-cta')).toHaveText(['Flag', 'Next decision →']);
  });
});
