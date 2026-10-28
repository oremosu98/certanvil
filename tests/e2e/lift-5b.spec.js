// Stage 5b: sign in by email code inside the iOS app (features/ios-signin.js). Native paths run with the app's UA
// suffix and the stubbed Capacitor bridge from lift-5a; Supabase is tests/fixtures/fake-supabase.js ('123456' signs in).
// Time moves by shifting the kept send time (sessionStorage ca_signin_pending.sentAt), never a fake clock.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PHONE = { width: 402, height: 874 };
const FAKE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fake-supabase.js'), 'utf8');
const NATIVE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 CertAnvilApp';
function stubScript() {
  return () => {
    const read = () => { try { return JSON.parse(localStorage.getItem('__prefs') || '{}'); } catch (_) { return {}; } };
    const write = (o) => localStorage.setItem('__prefs', JSON.stringify(o));
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        Preferences: {
          get: ({ key }) => Promise.resolve({ value: read()[key] == null ? null : read()[key] }),
          set: ({ key, value }) => Promise.resolve().then(() => { const o = read(); o[key] = value; write(o); }),
          remove: ({ key }) => Promise.resolve().then(() => { const o = read(); delete o[key]; write(o); })
        },
        Haptics: { impact: () => Promise.resolve(), notification: () => Promise.resolve() },
        Browser: { open: () => Promise.resolve() },
        StatusBar: { setStyle: () => Promise.resolve() }
      }
    };
  };
}
// opts: {fake: {...__FAKE_SB}, prefs, seed, query, native (default true)}
async function boot(page, opts) {
  opts = opts || {};
  await page.setViewportSize(PHONE);
  const F = Object.assign({ role: 'user', noResults: true, signedOut: true, metaOverride: { tier: 'free', entitlements: {} } }, opts.fake || {});
  await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB=' + JSON.stringify(F) + ';' + FAKE }));
  await page.addInitScript(([prefs, seed]) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1');
      if (prefs) localStorage.setItem('__prefs', JSON.stringify(prefs));
      Object.keys(seed || {}).forEach((k) => localStorage.setItem(k, seed[k]));
    }
  }, [opts.prefs || { chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com' }, opts.seed || {}]);
  if (opts.native !== false) await page.addInitScript(stubScript());
  await page.goto('/' + (opts.query || ''));
  await page.waitForLoadState('load');
  await page.waitForTimeout(900);
}
const log = (page) => page.evaluate(() => window.__fakeLog || []);
const host = (page) => page.locator('#ios-signin');
async function openSignIn(page, from) { await page.evaluate((f) => window.iosSignIn.open({ from: f }), from || 'settings'); await expect(host(page)).toBeVisible(); }
async function toCode(page, email) {
  await openSignIn(page);
  await page.fill('#isi-email', email || 'sam@example.test');
  await page.click('#ios-signin [data-act="continue"]');
  await expect(host(page)).toContainText('Check your email');
}
async function typeCode(page, code) { await page.locator('#isi-boxes input').first().focus(); await page.keyboard.type(code, { delay: 30 }); }
async function shiftSent(page, seconds) {
  await page.evaluate((s) => { const p = JSON.parse(sessionStorage.getItem('ca_signin_pending')); p.sentAt -= s * 1000; sessionStorage.setItem('ca_signin_pending', JSON.stringify(p)); }, seconds);
}

test.describe('Stage 5b: sign in with a code inside the app', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('Continue sends a code with no redirect', async ({ page }) => {
    await boot(page);
    await toCode(page, 'sam@example.test');
    expect(await log(page)).toContain('auth:otp:sam@example.test:false');
    await expect(host(page)).toContainText('We sent a 6-digit code to sam@example.test.');
    await expect(page.locator('#isi-resend')).toContainText('You can resend in 60s.');
  });

  test('a typo is caught before sending', async ({ page }) => {
    await boot(page);
    await openSignIn(page);
    await page.fill('#isi-email', 'sam@gmial.com');
    await page.click('#ios-signin [data-act="continue"]');
    await expect(host(page)).toContainText('Did you mean sam@gmail.com?');
    expect((await log(page)).filter((l) => l.startsWith('auth:otp:'))).toEqual([]);
    await page.click('#ios-signin [data-act="fix-yes"]');
    await expect(host(page)).toContainText('We sent a 6-digit code to sam@gmail.com.');
    expect(await log(page)).toContain('auth:otp:sam@gmail.com:false');
    await page.click('#ios-signin [data-act="change"]');
    await page.fill('#isi-email', 'sam@gmial.com');
    await page.click('#ios-signin [data-act="continue"]');
    await page.click('#ios-signin [data-act="fix-no"]');
    await expect(host(page)).toContainText('We sent a 6-digit code to sam@gmial.com.');
  });

  test('the sixth digit submits', async ({ page }) => {
    await boot(page);
    await toCode(page);
    await typeCode(page, '123456');
    await expect.poll(async () => (await log(page)).filter((l) => l.startsWith('auth:verify:'))).toEqual(['auth:verify:123456']);
  });

  test('pasting six digits fills the boxes and submits once', async ({ page }) => {
    await boot(page);
    await toCode(page);
    await page.locator('#isi-boxes input').first().fill('123456');
    await expect.poll(async () => (await log(page)).filter((l) => l.startsWith('auth:verify:'))).toEqual(['auth:verify:123456']);
    await page.waitForTimeout(400);
    expect((await log(page)).filter((l) => l.startsWith('auth:verify:')).length).toBe(1);
  });

  test('a wrong code clears the boxes and says so', async ({ page }) => {
    await boot(page);
    await toCode(page);
    await typeCode(page, '111111');
    await expect(page.locator('#isi-msg')).toHaveText("That code isn't right. Check it and try again.");
    const vals = await page.locator('#isi-boxes input').evaluateAll((els) => els.map((e) => e.value).join(''));
    expect(vals).toBe('');
    expect(await page.evaluate(() => document.activeElement === document.querySelector('#isi-boxes input'))).toBe(true);
  });

  test('an old code reads as expired', async ({ page }) => {
    await boot(page);
    await toCode(page);
    await shiftSent(page, 901);
    await typeCode(page, '111111');
    await expect(page.locator('#isi-msg')).toHaveText('That code has expired.');
    await expect(page.locator('#ios-signin [data-act="send-new"]')).toBeVisible();
    await expect(page.locator('#isi-resend')).toHaveCount(0);
    const before = (await log(page)).filter((l) => l.startsWith('auth:otp:')).length;
    await page.click('#ios-signin [data-act="send-new"]');
    await expect(page.locator('#isi-msg')).toHaveText('We sent a new code.');
    expect((await log(page)).filter((l) => l.startsWith('auth:otp:')).length).toBe(before + 1);
  });

  test('Resend unlocks after 60s', async ({ page }) => {
    await boot(page);
    await toCode(page);
    await shiftSent(page, 61);
    await expect(page.locator('#ios-signin [data-act="resend"]')).toHaveText('Resend code', { timeout: 3000 });
    await page.click('#ios-signin [data-act="resend"]');
    await expect(page.locator('#isi-resend')).toContainText('You can resend in 60s.');
    expect((await log(page)).filter((l) => l.startsWith('auth:otp:')).length).toBe(2);
  });

  test('a refused send says give it a minute', async ({ page }) => {
    await boot(page, { fake: { otpStatus: 429 } });
    await openSignIn(page);
    await page.fill('#isi-email', 'sam@example.test');
    await page.click('#ios-signin [data-act="continue"]');
    await expect(host(page)).toContainText('Give it a minute, then ask for a new code.');
  });

  test('no connection keeps the code', async ({ page }) => {
    await boot(page, { fake: { verifyThrows: true } });
    await toCode(page);
    await typeCode(page, '123456');
    await expect(page.locator('#isi-msg')).toHaveText("Couldn't reach CertAnvil. Check your connection and try again.");
    const vals = await page.locator('#isi-boxes input').evaluateAll((els) => els.map((e) => e.value).join(''));
    expect(vals).toBe('123456');
  });

  test('a pending code survives a reload for 15 minutes', async ({ page }) => {
    await boot(page);
    await toCode(page, 'sam@example.test');
    await page.reload(); await page.waitForLoadState('load'); await page.waitForTimeout(900);
    await expect(host(page)).toBeVisible();
    await expect(host(page)).toContainText('We sent a 6-digit code to sam@example.test.');
    await shiftSent(page, 901);
    await page.reload(); await page.waitForLoadState('load'); await page.waitForTimeout(900);
    await expect(host(page)).toBeHidden();
  });

  test('Wrong email? Change it returns to the email, filled in', async ({ page }) => {
    await boot(page);
    await toCode(page, 'sam@example.test');
    await page.click('#ios-signin .isi-change [data-act="change"]');
    await expect(host(page)).toContainText('Sign in or create your account');
    await expect(page.locator('#isi-email')).toHaveValue('sam@example.test');
  });
});
