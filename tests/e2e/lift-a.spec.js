// tests/e2e/lift-a.spec.js — Lift A (iOS June design at phone width).
// Spec: docs/superpowers/specs/2026-10-19-ios-launch-june-design.md (Fidelity rule).
// Phone = 390x844; desktop = 1280x800. Desktop must be untouched by Lift A.
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

async function openApp(page, viewport, theme) {
  await page.setViewportSize(viewport);
  await page.addInitScript((t) => { try { localStorage.setItem('nplus_theme', t); } catch (_) {} }, theme || 'dark');
  await page.goto('/');
  await page.waitForLoadState('load');
}

test.describe('Lift A scaffold', () => {
  test('desktop never shows ios-only', async ({ page }) => {
    await openApp(page, DESKTOP);
    const shown = await page.evaluate(() => [...document.querySelectorAll('.ios-only')]
      .filter(el => getComputedStyle(el).display !== 'none').map(el => el.id || el.className));
    expect(shown).toEqual([]);
  });

  test('phone uses E2E tokens (dark and light)', async ({ page }) => {
    await openApp(page, PHONE, 'dark');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const dark = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    expect(dark).toBe('oklch(0.15 0.010 275)');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const light = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
    expect(light).toBe('oklch(0.55 0.155 55)');
  });
});

test.describe('Lift A Home', () => {
  test('phone renders the E2E Home and hides the desktop bento', async ({ page }) => {
    await openApp(page, PHONE);
    await expect(page.locator('#ios-home .ih-topbar')).toBeVisible();
    await expect(page.locator('#ios-home .ih-rd')).toBeVisible();
    await expect(page.locator('#page-setup .bento')).toBeHidden();
    await expect(page.locator('#app-topbar')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });

  test('phone: Home buttons call the same handlers as the desktop Home', async ({ page }) => {
    await openApp(page, PHONE);
    await page.evaluate(() => {
      window.__calls = [];
      ['applyPreset', 'startDailyChallenge', 'startExam', '_jumpToCustomQuiz'].forEach(n => { window[n] = (...a) => window.__calls.push(n + ':' + a.join(',')); });
    });
    await page.locator('#ios-home [data-act="warmup"]').click();
    await page.locator('#ios-home [data-act="daily"]').click();
    await page.locator('#ios-home [data-act="custom"]').click();
    expect(await page.evaluate(() => window.__calls)).toEqual(['applyPreset:warmup', 'startDailyChallenge:', '_jumpToCustomQuiz:']);
  });

  test('phone: Practice accordion opens and shows its three options', async ({ page }) => {
    await openApp(page, PHONE);
    const acc = page.locator('#ios-home [data-acc]').first();
    await acc.locator('.ih-acc-head').click();
    await expect(acc).toHaveClass(/ih-open/);
    await expect(acc.locator('[data-act="grind"]')).toBeVisible();
  });

  test('desktop keeps the bento Home and never shows the E2E Home', async ({ page }) => {
    await openApp(page, DESKTOP);
    await expect(page.locator('#ios-home')).toBeHidden();
    await expect(page.locator('#page-setup .bento')).toBeVisible();
  });
});
