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
});
