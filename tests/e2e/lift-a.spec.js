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
