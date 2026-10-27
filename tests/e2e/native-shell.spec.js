// Stage 5a (v8.195.0): the iOS native shell. Native paths run with the app's UA suffix and a stubbed
// window.Capacitor (in-memory Preferences, Haptics/Browser/StatusBar call logs); the website runs without them.
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };

test.describe('Stage 5a on the website', () => {
  test('the website never marks html.is-native', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/'); await page.waitForLoadState('load'); await page.waitForTimeout(500);
    await expect(page.locator('html')).not.toHaveClass(/is-native/);
    expect(await page.evaluate(() => window.CA_NATIVE)).toBe(false);
  });
});
