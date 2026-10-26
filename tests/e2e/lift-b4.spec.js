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

for (const vp of PHONES) {
  test.describe('Lift B4 study setup and account @' + vp.width, () => {
    const R = (page) => page.locator('#ios-settings');
    test('Pro: picking 50 and Save sets the goal; the glance row follows', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => renderSettingsPage());
      await R(page).locator('[data-act="goal-pick"][data-n="50"]').click();
      await expect(R(page).locator('[data-act="goal-pick"][data-n="50"]')).toHaveAttribute('aria-pressed', 'true');
      await R(page).locator('[data-act="goal-save"]').click();
      await expect.poll(() => page.evaluate(() => getDailyGoal())).toBe(50);
      await expect(R(page).locator('.ist-row', { hasText: 'Daily goal' })).toContainText('50 a day');
    });
    test('Pro: All due and the top-up switch persist', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => renderSettingsPage());
      await R(page).locator('[data-act="review-pick"][data-n="10"]').click();
      await expect.poll(() => page.evaluate(() => loadSrPrefs().sessionSize)).toBe(10);
      await R(page).locator('[data-act="review-pick"][data-n="all"]').click();
      await expect.poll(() => page.evaluate(() => loadSrPrefs().sessionSize)).toBe('all');
      const before = await page.evaluate(() => !!loadSrPrefs().topUp);
      await R(page).locator('[data-act="topup"]').click();
      await expect.poll(() => page.evaluate(() => !!loadSrPrefs().topUp)).toBe(!before);
      await expect(R(page).locator('[data-act="topup"]')).toHaveAttribute('aria-pressed', String(!before));
    });
    test("free: goal and review are fixed; Go Pro opens today's pricing page", async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'free' });
      await page.evaluate(() => { renderSettingsPage(); window.__opened = []; window.open = function (u) { window.__opened.push(u); return null; }; });
      await expect(R(page).locator('[data-act="goal-pick"], [data-act="review-pick"]')).toHaveCount(0);
      await R(page).locator('.ist-row[data-act="gopro"]').click();
      expect(await page.evaluate(() => window.__opened)).toEqual(['https://certanvil.com/pricing']);
    });
    test('exam date: the sheet saves the 14th of next month, then Remove clears it', async ({ page }) => {
      await openSettings(page, vp, { tier: 'free' });
      const iso = await page.evaluate(() => { const d = new Date(); const n = new Date(d.getFullYear(), d.getMonth() + 1, 14); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-14'; });
      await R(page).locator('[data-act="exam"]').click();
      const sheet = page.locator('#ist-sheet');
      await expect(sheet).toHaveClass(/open/);
      await sheet.locator('[data-act="cal-next"]').click();
      await sheet.locator('[data-iso="' + iso + '"]').click();
      await expect(sheet.locator('[data-act="cal-save"]')).toContainText('Save 14 ');
      await sheet.locator('[data-act="cal-save"]').click();
      await expect.poll(() => page.evaluate(() => getExamDate())).toBe(iso);
      await expect(sheet).toBeHidden();
      await R(page).locator('[data-act="exam"]').click();
      await sheet.locator('[data-act="cal-remove"]').click();
      await expect.poll(() => page.evaluate(() => getExamDate() || '')).toBe('');
      await expect(R(page).locator('.ist-row', { hasText: 'Exam date' })).toContainText('Not set');
    });
    test("cert sheet: free sees Pro tags; picking a Pro cert closes the sheet then calls today's switch; the active cert does nothing", async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'free' });
      await page.evaluate(() => { renderSettingsPage(); window.__sw = []; window.tadSwitchCert = function (id) { window.__sw.push([id, document.getElementById('ist-sheet').classList.contains('open')]); return false; }; });
      await R(page).locator('[data-act="cert"]').click();
      const sheet = page.locator('#ist-sheet');
      await expect(sheet.locator('.ist-cert')).toHaveCount(8);
      await expect(sheet.locator('.ist-pro-tag')).toHaveCount(7);
      await expect(sheet.locator('.ist-cert.on')).toHaveCount(1);
      await sheet.locator('[data-act="pick-cert"][data-id="secplus"]').click();
      expect(await page.evaluate(() => window.__sw)).toEqual([['secplus', false]]);
    });
    test("Sign out goes through today's handler and the row clears nothing itself", async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => {
        renderSettingsPage(); window.__so = 0; window.__keys = localStorage.length;
        document.getElementById('topbar-signout-link').addEventListener('click', function (e) { window.__so++; e.stopImmediatePropagation(); e.preventDefault(); }, true);
      });
      await R(page).locator('[data-act="signout"]').click();
      expect(await page.evaluate(() => [window.__so, localStorage.length === window.__keys])).toEqual([1, true]);
    });
    test('the reveal plays once; a pick repaints still', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => renderSettingsPage());
      await page.waitForTimeout(800);
      await R(page).locator('[data-act="goal-pick"][data-n="20"]').click();
      await expect(R(page).locator('[data-act="goal-pick"][data-n="20"]')).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => Array.from(document.querySelectorAll('#ios-settings .reveal')).reduce((n, el) => n + el.getAnimations().length, 0))).toBe(0);
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
