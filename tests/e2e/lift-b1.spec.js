// tests/e2e/lift-b1.spec.js — Lift B1 (Progress, Analytics, Daily Review at phone width).
// Spec: docs/superpowers/specs/2026-10-21-ios-lift-b1-design.md. E2E: feat/cert-ios-e2e.
// Phones are 390x844 and 402x874 (the device width side-by-sides use); desktop is 1280x800 and must not change.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const TOPICS = ['AAA & Authentication', 'OSPF', 'Port Numbers', 'Cable Issues'];

async function openApp(page, viewport, withHistory) {
  await page.setViewportSize(viewport);
  await page.addInitScript((seed) => {
    try {
      localStorage.setItem('nplus_theme', 'dark');
      if (seed) {
        const h = Array.from({ length: 12 }, (_, i) => ({ date: new Date(Date.now() - (i + 1) * 864e5).toISOString(),
          topic: seed[i % seed.length], difficulty: 'Exam Level', score: i % 4 === 3 ? 2 : 7, total: 10, pct: i % 4 === 3 ? 20 : 70, mode: 'quiz' }));
        localStorage.setItem('nplus_history', JSON.stringify(h));
      }
    } catch (_) {}
  }, withHistory ? TOPICS : null);
  await page.goto('/');
  await page.waitForLoadState('load');
}

// Arrive the way a user does: the tab bar paints the page, then shows it (lift-shell navTo).
async function goTab(page, name) {
  await page.locator('#lift-tabbar .lift-tab[data-page="' + name + '"]').click();
  await expect(page.locator('#page-' + name)).toHaveClass(/active/);
}

for (const vp of PHONES) {
  test.describe('Lift B1 Progress @' + vp.width, () => {
    test('phone renders the E2E Progress screen and hides the desktop page', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      await expect(page.locator('#ios-progress .ip-topbar')).toBeVisible();
      await expect(page.locator('#page-progress .progress-toolbar')).toBeHidden();
      await expect(page.locator('#page-progress .lift-seg')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });

    test('pills move the pager and swiping moves the pills', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      const pager = page.locator('#ios-progress .ip-pager');
      await page.locator('#ios-progress .ip-chip[data-page="2"]').click();
      await expect.poll(() => pager.evaluate(el => Math.round(el.scrollLeft / el.clientWidth))).toBe(2);
      await pager.evaluate(el => el.scrollTo({ left: el.clientWidth * 4, behavior: 'auto' }));
      await expect(page.locator('#ios-progress .ip-chip[data-page="4"]')).toHaveAttribute('aria-selected', 'true');
    });

    test('a topic row drills that topic in the Custom quiz', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      const row = page.locator('#ios-progress .ip-trow[data-t="OSPF"]').first();
      // open the row's domain page through its pill, as a user would
      const pg = await row.evaluate(el => el.closest('.ip-page').getAttribute('data-page'));
      await page.locator('#ios-progress .ip-chip[data-page="' + pg + '"]').click();
      await row.click();
      await expect(page.locator('#ios-custom .ic-topbar')).toBeVisible();
      await expect(page.locator('#ios-custom [data-act="topic"][data-v="OSPF"]')).toHaveAttribute('aria-pressed', 'true');
    });

    test('the Weak filter and Best first sort re-render the domain pages', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      await page.locator('#ios-progress .ip-ftab[data-filter="weak"]').click();
      await expect(page.locator('#ios-progress .ip-ftab[data-filter="weak"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#ios-progress .ip-trow[data-t="OSPF"]')).toHaveCount(0);
      await page.locator('#ios-progress .ip-fsort').click();
      await expect(page.locator('#ios-progress .ip-fsort span')).toHaveText('Best first');
    });

    test('the Analytics side of the switch opens Analytics', async ({ page }) => {
      await openApp(page, vp, true);
      await goTab(page, 'progress');
      await page.locator('#ios-progress [data-view="analytics"]').click();
      await expect(page.locator('#page-analytics')).toHaveClass(/active/);
    });

    test('a new user sees no Drill this next card and 0% covered', async ({ page }) => {
      await openApp(page, vp, false);
      await goTab(page, 'progress');
      await expect(page.locator('#ios-progress .ip-hero')).toHaveCount(0);
      await expect(page.locator('#ios-progress .ip-ring-n')).toHaveText('0%');
    });
  });
}

test.describe('Lift B1 desktop is unchanged', () => {
  test('desktop Progress keeps its own page and leaves #ios-progress empty', async ({ page }) => {
    await openApp(page, DESKTOP, true);
    await page.evaluate(() => showPage('progress'));
    await expect(page.locator('#ios-progress')).toBeEmpty();
    await expect(page.locator('#page-progress .progress-toolbar')).toBeVisible();
  });
});
