// Lift B4 (v8.193.0): Settings on phones (the Account tab), against cert-ios-settings.html. Signed-in states load
// tests/fixtures/fake-supabase.js in place of lib/supabase.js (as scripts/lift-sbs.js does); no network.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const FAKE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fake-supabase.js'), 'utf8');

// signed: false (anonymous) | true (fake session). tier: 'free' | 'pro' (pinned after load; signed-out apps reset it).
async function boot(page, viewport, opts) {
  opts = opts || {};
  await page.setViewportSize(viewport);
  if (opts.signed) {
    await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB={"role":"user"};' + FAKE }));
  }
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1'); } catch (_) {}
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  if (opts.signed) await page.waitForFunction(() => window._certanvilSignedIn === true, null, { timeout: 10000 });
  await page.waitForTimeout(600);
}
async function setTier(page, tier) {
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro', used_today: 0, daily_limit: -1 } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
  }, tier);
}
// Opens the Account tab the way a person does (the tab bar on phones, showPage on desktop).
async function openSettings(page, vp, opts) {
  await boot(page, vp, opts);
  if (opts && opts.tier) await setTier(page, opts.tier);
  if (vp.width < 900) await page.locator('#lift-tabbar .lift-tab[data-page="settings"]').click();
  else await page.evaluate(() => showPage('settings'));
  await expect(page.locator('#page-settings')).toHaveClass(/active/, { timeout: 10000 });
  await page.waitForTimeout(300);
}
module.exports = { boot, setTier, openSettings };

for (const vp of PHONES) {
  test.describe('Lift B4 page @' + vp.width, () => {
    test('signed out: the account card, Pass Plan CTA, tab bar, no top bar, no Sign out', async ({ page }) => {
      await openSettings(page, vp, { tier: 'free' });
      const R = page.locator('#ios-settings');
      await expect(page.locator('#page-settings')).toHaveClass(/ist-on/);
      await expect(R.locator('.ist-acct h2')).toHaveText('Sign in to keep your progress');
      await expect(R.locator('[data-act="signin"]')).toBeVisible();
      await expect(R.locator('[data-act="signout"], [data-act="delete"]')).toHaveCount(0);
      await expect(R.locator('.ist-pp')).not.toBeEmpty();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await expect(page.locator('#app-topbar')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
    test('free signed in: email, Free, Cert row, one Go Pro row, free lines', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'free' });
      await page.evaluate(() => renderSettingsPage());
      const R = page.locator('#ios-settings');
      await expect(R.locator('.ist-em')).toContainText('simi.test@example.test', { timeout: 5000 });
      await expect(R.locator('.ist-plan')).toHaveText('Free');
      await expect(R.locator('[data-act="cert"]')).toBeVisible();
      await expect(R.locator('.ist-row[data-act="gopro"]')).toHaveCount(1);
      await expect(R).toContainText('Free is fixed at 15 questions a day');
      await expect(R.locator('[data-act="signout"]')).toBeVisible();
    });
    test('Pro: Pro pill, presets, review sizes, top-up switch', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => renderSettingsPage());
      const R = page.locator('#ios-settings');
      await expect(R.locator('.ist-plan')).toHaveText('Pro');
      await expect(R.locator('[data-act="goal-pick"]')).toHaveCount(4);
      await expect(R.locator('[data-act="review-pick"]')).toHaveCount(4);
      await expect(R.locator('[data-act="topup"]')).toBeVisible();
      await expect(R.locator('[data-act="gopro"]')).toHaveCount(0);
    });
    test("today's sections and the reports panel are hidden beside the phone page", async ({ page }) => {
      await openSettings(page, vp, { tier: 'free' });
      await expect(page.locator('#page-settings .settings-layout')).toBeHidden();
      await expect(page.locator('#settings-reports-section')).toBeHidden();
    });
  });
}

test.describe('Lift B4 desktop', () => {
  test("today's Settings, #ios-settings empty, no ist-on", async ({ page }) => {
    await openSettings(page, DESKTOP, { tier: 'free' });
    await expect(page.locator('#page-settings .settings-layout')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('ios-settings').innerHTML)).toBe('');
    await expect(page.locator('#page-settings')).not.toHaveClass(/ist-on/);
  });
});
