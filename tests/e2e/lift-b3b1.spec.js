// Lift B3b1 (v8.188.0): practice Sim Lab on phones, against cert-ios-simlab.html.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };

async function boot(page, viewport, tier) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); } catch (_) {}
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro' } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
  }, tier || 'free');
}
async function setTier(page, tier) {
  // the way the app lands a tier: set _quotaState, then re-run renderGauntletDrillsCard
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro' } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
    if (typeof renderGauntletDrillsCard === 'function') renderGauntletDrillsCard();
  }, tier || 'free');
}
async function openEntry(page, viewport, tier) {
  await boot(page, viewport, tier);
  await page.evaluate(() => startSimLabHome());
  await expect(page.locator('#page-sim-lab-entry')).toHaveClass(/active/);
  await setTier(page, tier);
}
async function record(page, names) {
  await page.evaluate((ns) => {
    window.__calls = [];
    ns.forEach((n) => { window[n] = function () { window.__calls.push(n); }; });
  }, names);
}

for (const vp of PHONES) {
  test.describe('Lift B3b1 start screen @' + vp.width, () => {
    test('June start screen replaces the old one, no app top bar, tab bar stays', async ({ page }) => {
      await openEntry(page, vp);
      const entry = page.locator('#isl-entry');
      await expect(entry.locator('.isl-title h1')).toHaveText('Sim Lab');
      await expect(page.locator('#page-sim-lab-entry .gnt-shell')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await expect(entry.locator('.isl-cap')).toContainText('Free covers one Sim Lab session a day');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const small = await page.evaluate(() => [].slice.call(document.querySelectorAll('#isl-entry [data-act]:not(.isl-back)'))
        .filter((b) => b.getBoundingClientRect().height < 44).map((b) => b.textContent.trim()));
      expect(small).toEqual([]);
      const backHit = await page.evaluate(() => getComputedStyle(document.querySelector('#isl-entry .isl-back'), '::after').content);
      expect(backHit).not.toBe('none');
      const dock = await page.evaluate(() => {
        const d = document.querySelector('#isl-entry .isl-dock').getBoundingClientRect(), t = document.getElementById('lift-tabbar').getBoundingClientRect();
        return { bottom: Math.round(d.bottom), tabTop: Math.round(t.top), top: Math.round(d.top) };
      });
      expect(Math.abs(dock.bottom - dock.tabTop)).toBeLessThanOrEqual(1);   // Start is docked right above the tab bar, on screen
      expect(dock.top).toBeLessThan(vp.height);
    });

    test('rounds drive the real chips; locked 10 and Exam open the Pro gate', async ({ page }) => {
      await openEntry(page, vp);
      await page.locator('#isl-entry [data-act="rounds"][data-rounds="3"]').click();
      await expect(page.locator('#isl-entry .isl-bn')).toHaveText('3');
      await expect(page.locator('#isl-entry .isl-qc')).toHaveText('3 rounds');
      await expect(page.locator('#sle-rounds [data-rounds="3"]')).toHaveClass(/is-on/);
      await record(page, ['_gateProOnly']);
      await page.locator('#isl-entry [data-act="rounds"][data-rounds="10"]').click();
      await page.locator('#isl-entry [data-act="mode"][data-mode="exam"]').click();
      expect(await page.evaluate(() => window.__calls)).toEqual(['_gateProOnly', '_gateProOnly']);
      await expect(page.locator('#isl-entry .isl-bn')).toHaveText('3');
      await expect(page.locator('#isl-entry [data-mode="practice"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#sle-rounds [data-rounds="10"]')).not.toHaveClass(/is-on/);
    });

    test('a tier that lands late repaints the locks in place', async ({ page }) => {
      await boot(page, vp, 'free');
      await page.evaluate(() => { window._quotaState = null; document.body.classList.remove('is-state-resolved'); startSimLabHome(); });
      await expect(page.locator('#page-sim-lab-entry')).toHaveClass(/active/);
      await page.evaluate(() => { window._quotaState = null; document.body.classList.remove('is-state-resolved'); renderIosSimLabEntry(); });
      await expect(page.locator('#isl-entry [data-locked]')).toHaveCount(0);
      await setTier(page, 'free');
      await expect(page.locator('#isl-entry [data-rounds="10"][data-locked="1"]')).toHaveCount(1);
      await expect(page.locator('#isl-entry .isl-cap')).toHaveCount(1);
    });

    test('Pro picks Exam and 10; Start and Back reach their entries', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await expect(page.locator('#isl-entry .isl-cap')).toHaveCount(0);
      await page.locator('#isl-entry [data-act="mode"][data-mode="exam"]').click();
      await page.locator('#isl-entry [data-act="rounds"][data-rounds="10"]').click();
      await expect(page.locator('#isl-entry .isl-start')).toContainText('Start exam sim');
      await expect(page.locator('#isl-entry .isl-foot')).toContainText('one clock for all 10 rounds');
      await record(page, ['simLabSessionStart']);
      await page.locator('#isl-entry [data-act="start"]').click();
      expect(await page.evaluate(() => window.__calls)).toEqual(['simLabSessionStart']);
      await page.locator('#isl-entry [data-act="back"]').click();
      await expect(page.locator('#page-setup')).toHaveClass(/active/);
    });
  });
}

test('Lift B3b1 desktop: the start screen is today\'s', async ({ page }) => {
  await openEntry(page, DESKTOP);
  await expect(page.locator('#isl-entry')).toBeEmpty();
  await expect(page.locator('#page-sim-lab-entry .gnt-shell')).toBeVisible();
});
