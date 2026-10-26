// Lift C (v8.194.0): first run on phones, against the June E2E "C ›" states (june-e2e @ ee053395).
// This file opts out of the config-wide day-0 skip seed, so every boot here is a brand-new user.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

test.use({ storageState: { cookies: [], origins: [] } });

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const FAKE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fake-supabase.js'), 'utf8');

// opts: {signed, seed: {key: value}, query}
async function boot(page, viewport, opts) {
  opts = opts || {};
  await page.setViewportSize(viewport);
  if (opts.signed) {
    await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB={"role":"user"};' + FAKE }));
  }
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try {
      localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1');
      Object.keys(seed || {}).forEach((k) => localStorage.setItem(k, seed[k]));
    } catch (_) {}
  }, opts.seed || {});
  await page.goto('/' + (opts.query || ''));
  await page.waitForLoadState('load');
  if (opts.signed) await page.waitForFunction(() => window._certanvilSignedIn === true, null, { timeout: 10000 });
  await page.waitForTimeout(600);
}
// tier: 'free' | 'pro'; used: questions used today (free). Re-renders Home with the pinned state.
async function setTier(page, tier, used) {
  await page.evaluate(([t, u]) => {
    window._quotaState = t === 'pro' ? { tier: 'pro', used_today: 0, daily_limit: -1 } : { tier: 'free', used_today: u || 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
    if (typeof renderIosHome === 'function') renderIosHome();
  }, [tier, used]);
}
const HISTORY = JSON.stringify([{ topic: 'Ports', score: 7, total: 10, pct: 70, date: new Date().toISOString(), questions: [] }]);
module.exports = { boot, setTier, HISTORY };

for (const vp of PHONES) {
  test.describe(`Lift C day-0 and capped Home @${vp.width}`, () => {
    test('new free user sees day-0 with no tab bar', async ({ page }) => {
      await boot(page, vp);
      const home = page.locator('#ios-home');
      await expect(home).toContainText("Let's place your readiness.");
      await expect(home).toContainText('15 of 15 ready');
      await expect(home.locator('[data-act="check"]')).toHaveText('Take the 30-second check');
      await expect(page.locator('html')).toHaveClass(/ifr-day0/);
      await expect(page.locator('#lift-tabbar')).toBeHidden();
    });
    test("Start today's 15 records the skip and starts today's quiz", async ({ page }) => {
      await boot(page, vp);
      await page.evaluate(() => { window.__started = null; window.startQuiz = function () { window.__started = { n: qCount, topic: topic }; }; });
      await page.locator('#ios-home [data-act="today"]').click();
      expect(await page.evaluate(() => window.__started && window.__started.n === 15 && window.__started.topic === MIXED_TOPIC)).toBe(true);
      expect(await page.evaluate(() => !!localStorage.getItem('nplus_onb_skips'))).toBe(true);
    });
    test("after a skip Home is today's new-user Home", async ({ page }) => {
      await boot(page, vp, { seed: { nplus_onb_skips: '{"at":1}' } });
      await expect(page.locator('#ios-home')).toContainText('Your first session sets the baseline.');
      await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
      await expect(page.locator('#lift-tabbar')).toBeVisible();
    });
    test('day-0 with nothing left goes to the quota screen', async ({ page }) => {
      await boot(page, vp, { signed: true });
      await setTier(page, 'free', 15);
      await expect(page.locator('#ios-home')).toContainText("Let's place your readiness.");
      await page.evaluate(() => { window.__quota = 0; window._showQuotaExceededUI = function () { window.__quota++; }; });
      await page.locator('#ios-home [data-act="today"]').click();
      expect(await page.evaluate(() => window.__quota)).toBe(1);
    });
    test('a free user at 0 left sees capped Home; Start review opens Daily Review; See Pro opens /pricing', async ({ page }) => {
      await boot(page, vp, { signed: true, seed: { nplus_history: HISTORY } });
      await setTier(page, 'free', 15);
      const home = page.locator('#ios-home');
      await expect(home).toContainText("That's today's 15 done.");
      await page.evaluate(() => { window.__sr = 0; window.startSrReview = function () { window.__sr++; }; window.__open = null; window.open = function (u) { window.__open = u; }; });
      const review = home.locator('[data-act="review"]');
      if (await review.count()) { await review.click(); expect(await page.evaluate(() => window.__sr)).toBe(1); }
      await home.locator('[data-act="gopro"]').click();
      expect(await page.evaluate(() => window.__open)).toBe('https://certanvil.com/pricing');
    });
    test('Pro day-0 has no quota rows', async ({ page }) => {
      await boot(page, vp, { signed: true });
      await setTier(page, 'pro');
      const home = page.locator('#ios-home');
      await expect(home).toContainText("Let's place your readiness.");
      await expect(home).not.toContainText('New practice');
      await expect(home.locator('[data-act="today"]')).toHaveText('Start a quiz');
    });
    test('crossing 899px clears html.ifr-day0', async ({ page }) => {
      await boot(page, vp);
      await expect(page.locator('html')).toHaveClass(/ifr-day0/);
      await page.setViewportSize(DESKTOP);
      await page.evaluate(() => renderIosHome());
      await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
    });
  });
}

test.describe('Lift C desktop Home @1280', () => {
  test("1280 shows today's desktop Home", async ({ page }) => {
    await boot(page, DESKTOP);
    await expect(page.locator('#ios-home')).toBeEmpty();
    await expect(page.locator('html')).not.toHaveClass(/ifr-day0/);
  });
});
