// Stage 5b: the certanvil.com sign-in modal signs in with a 6-digit code (landing/auth.js). The landing pages are
// run under the `landing` project (landing/ served on its own port); Supabase is tests/fixtures/fake-supabase.js ('123456' signs in).
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FAKE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fake-supabase.js'), 'utf8');
async function boot(page, file, fake) {
  const F = Object.assign({ signedOut: true }, fake || {});
  await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB=' + JSON.stringify(F) + ';' + FAKE }));
  await page.route('https://networkplus.certanvil.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>cert app</p>' }));
  await page.goto('/' + file.replace(/(^index)?\.html$/, '') + '?action=signin&return=' + encodeURIComponent('https://networkplus.certanvil.com/'));
  await page.waitForLoadState('load');
  await expect(page.locator('#auth-modal')).toBeVisible();
}
const log = (page) => page.evaluate(() => window.__fakeLog || []);
async function toCode(page) {
  await page.fill('#auth-email', 'sam@example.test');
  await page.click('#auth-submit');
  await expect(page.locator('#auth-sent')).toBeVisible();
}
async function typeCode(page, code) { await page.locator('#auth-otp-boxes input').first().focus(); await page.keyboard.type(code, { delay: 30 }); }

for (const file of ['index.html', 'pricing.html']) {
  test.describe(`Stage 5b website code sign-in (${file})`, () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Continue sends a code with no redirect', async ({ page }) => {
      await boot(page, file);
      await toCode(page);
      expect(await log(page)).toContain('auth:otp:sam@example.test:false');
      await expect(page.locator('#auth-sent')).toContainText('Check your email');
      await expect(page.locator('#auth-sent')).toContainText('We sent a 6-digit code to sam@example.test.');
      await expect(page.locator('#auth-sent')).toContainText('You can resend in 60s.');
    });

    test('the right code signs in and returns to return=', async ({ page }) => {
      await boot(page, file);
      await toCode(page);
      await typeCode(page, '123456');
      await page.waitForURL('https://networkplus.certanvil.com/', { timeout: 8000 });
    });

    test('a wrong code says so', async ({ page }) => {
      await boot(page, file);
      await toCode(page);
      await typeCode(page, '111111');
      await expect(page.locator('#auth-otp-error')).toHaveText("That code isn't right. Check it and try again.");
    });

    test('an old code reads as expired', async ({ page }) => {
      await boot(page, file);
      await toCode(page);
      await page.evaluate(() => { window.__authCodeSentAt -= 901000; });
      await typeCode(page, '111111');
      await expect(page.locator('#auth-otp-error')).toHaveText('That code has expired.');
      await expect(page.locator('#auth-otp-new')).toBeVisible();
    });
  });
}
