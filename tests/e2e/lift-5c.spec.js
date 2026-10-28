// Stage 5c: Sign in with Apple and Google inside the iOS app (builds on the lift-5b harness) (features/ios-signin.js). Native paths run with the app's UA
// suffix and the stubbed Capacitor bridge from lift-5a; Supabase is tests/fixtures/fake-supabase.js ('123456' signs in).
// Time moves by shifting the kept send time (localStorage ca_signin_pending.sentAt), never a fake clock.
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
        Browser: { open: (o) => { (window.__browser = window.__browser || []).push(o.url); return Promise.resolve(); } },
        // localStorage __social = { mode: 'ok' | 'cancel' | 'fail', idToken, authorizationCode, givenName, familyName }; calls land in __socialCalls
        SocialLogin: {
          initialize: (o) => { localStorage.setItem('__socialInit', JSON.stringify(o)); return Promise.resolve(); },
          login: (o) => {
            const cfg = JSON.parse(localStorage.getItem('__social') || '{"mode":"ok"}');
            const calls = JSON.parse(localStorage.getItem('__socialCalls') || '[]'); calls.push(o); localStorage.setItem('__socialCalls', JSON.stringify(calls));
            if (cfg.mode === 'cancel') return Promise.reject(Object.assign(new Error('The user canceled the authorization attempt'), { code: 'USER_CANCELLED' }));
            if (cfg.mode === 'fail') return Promise.reject(Object.assign(new Error('Sign in failed'), { code: 'UNKNOWN' }));
            return Promise.resolve({ provider: o.provider, result: { idToken: cfg.idToken || ('tok-' + o.provider), authorizationCode: cfg.authorizationCode || 'code-1',
              profile: { givenName: cfg.givenName || null, familyName: cfg.familyName || null, email: null, user: 'apple-sub-1' } } });
          }
        },
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
  await page.evaluate((s) => { const p = JSON.parse(localStorage.getItem('ca_signin_pending')); p.sentAt -= s * 1000; localStorage.setItem('ca_signin_pending', JSON.stringify(p)); }, seconds);
}


const socialCalls = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__socialCalls') || '[]'));

test.describe('Stage 5c: caNative.social', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('social returns the plugin\'s token', async ({ page }) => {
    await boot(page, { seed: { __social: JSON.stringify({ mode: 'ok', idToken: 'jwt-apple', authorizationCode: 'c-9', givenName: 'Simi' }) } });
    const r = await page.evaluate(() => window.caNative.social('apple', { nonce: 'h1' }));
    expect(r).toMatchObject({ idToken: 'jwt-apple', authorizationCode: 'c-9', givenName: 'Simi' });
    expect((await socialCalls(page))[0]).toMatchObject({ provider: 'apple', options: { nonce: 'h1' } });
  });

  test('a cancelled sheet rejects with cancelled: true', async ({ page }) => {
    await boot(page, { seed: { __social: JSON.stringify({ mode: 'cancel' }) } });
    const r = await page.evaluate(() => window.caNative.social('apple', {}).then(() => 'resolved', (e) => e));
    expect(r).toMatchObject({ cancelled: true });
    const f = await page.evaluate(() => { localStorage.setItem('__social', '{"mode":"fail"}'); return window.caNative.social('apple', {}).then(() => 'resolved', (e) => e); });
    expect(f).toMatchObject({ cancelled: false });
  });

  test('socialReady(\'google\') is false while the client IDs are empty', async ({ page }) => {
    await page.addInitScript(() => { window.CA_SOCIAL_IDS = { googleIOS: '', googleWeb: '' }; });
    await boot(page);
    expect(await page.evaluate(() => [window.caNative.socialReady('apple'), window.caNative.socialReady('google')])).toEqual([true, false]);
    await page.evaluate(() => { window.CA_SOCIAL_IDS = { googleIOS: 'ios-id', googleWeb: 'web-id' }; });
    expect(await page.evaluate(() => window.caNative.socialReady('google'))).toBe(true);
  });
});

// ── Task 2: Apple and Google on the sign-in screen ──
const crypto = require('crypto');
const idCalls = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__idTokenCalls') || '[]'));
const IDS = () => { window.CA_SOCIAL_IDS = { googleIOS: 'ios-id', googleWeb: 'web-id' }; };
const SECPLUS = { chosenCert: 'secplus', lockedCert: 'secplus', lastCertHost: 'secplus.certanvil.com' };
async function openIn(page) { await page.evaluate(() => window.iosSignIn.open({ from: 'settings' })); await expect(page.locator('#ios-signin')).toBeVisible(); }

test.describe('Stage 5c: Apple and Google on the sign-in screen', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('Continue with Apple signs in and runs the lock rule', async ({ page }) => {
    await page.addInitScript(IDS);
    await boot(page, { fake: { accountFreeCert: 'netplus', tier: 'free' }, prefs: SECPLUS, query: '?cert=secplus' });
    await openIn(page);
    await expect(page.locator('#ios-signin [data-act="apple"]')).toBeVisible();
    await page.click('#ios-signin [data-act="apple"]');
    await page.waitForURL(/cert=netplus/, { timeout: 10000 });
    expect((await idCalls(page))[0]).toMatchObject({ provider: 'apple', token: 'tok-apple' });
    await expect(page.locator('.isi-toast')).toContainText('Your free exam on this account is Network+', { timeout: 6000 });
  });

  test('the Apple sheet gets the plugin\'s nonce form and Supabase the raw one', async ({ page }) => {
    await boot(page);
    await openIn(page);
    await page.click('#ios-signin [data-act="apple"]');
    await expect.poll(async () => (await idCalls(page)).length).toBe(1);
    const sheetNonce = (await socialCalls(page))[0].options.nonce, raw = (await idCalls(page))[0].nonce;
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(sheetNonce).toBe(crypto.createHash('sha256').update(raw).digest('hex'));
  });

  test('Continue with Google signs in', async ({ page }) => {
    await page.addInitScript(IDS);
    await boot(page);
    await openIn(page);
    await page.click('#ios-signin [data-act="google"]');
    await expect.poll(async () => (await idCalls(page)).map((c) => c.provider)).toEqual(['google']);
    expect((await socialCalls(page))[0]).toMatchObject({ provider: 'google' });
  });

  test('a cancelled sheet keeps the phone\'s pick', async ({ page }) => {
    await boot(page, { seed: { nplus_freeCertId: 'netplus', __social: JSON.stringify({ mode: 'cancel' }) } });
    await openIn(page);
    await page.click('#ios-signin [data-act="apple"]');
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBe('netplus');
    expect(await idCalls(page)).toEqual([]);
    await expect(page.locator('#isi-perr')).toHaveCount(0);
  });

  test('a failed sheet shows the line', async ({ page }) => {
    await boot(page, { seed: { __social: JSON.stringify({ mode: 'fail' }) } });
    await openIn(page);
    await page.click('#ios-signin [data-act="apple"]');
    await expect(page.locator('#isi-perr')).toHaveText("Apple sign-in didn't finish. Try again, or use your email.");
  });

  test('a token Supabase refuses restores the phone\'s pick', async ({ page }) => {
    await page.addInitScript(IDS);
    await boot(page, { fake: { idTokenError: 'Invalid token' }, seed: { nplus_freeCertId: 'netplus' } });
    await openIn(page);
    await page.click('#ios-signin [data-act="google"]');
    await expect(page.locator('#isi-perr')).toHaveText("Google sign-in didn't finish. Try again, or use your email.");
    expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBe('netplus');
  });

  test('Apple\'s first-time name is saved once', async ({ page }) => {
    await boot(page, { fake: { displayName: null }, seed: { __social: JSON.stringify({ mode: 'ok', givenName: 'Simi', familyName: 'Oremosu' }) } });
    await openIn(page);
    await page.click('#ios-signin [data-act="apple"]');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('__fakeDisplayName')), { timeout: 8000 }).toBe('Simi Oremosu');
  });

  test('a name already set is left alone', async ({ page }) => {
    await boot(page, { fake: { displayName: 'Simi' }, seed: { __social: JSON.stringify({ mode: 'ok', givenName: 'Other' }) } });
    await openIn(page);
    await page.click('#ios-signin [data-act="apple"]');
    await expect.poll(async () => (await idCalls(page)).length).toBe(1);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => localStorage.getItem('__fakeDisplayName'))).toBeNull();
  });

  test('Google stays hidden while its client IDs are empty', async ({ page }) => {
    await page.addInitScript(() => { window.CA_SOCIAL_IDS = { googleIOS: '', googleWeb: '' }; });
    await boot(page);
    await openIn(page);
    await expect(page.locator('#ios-signin [data-act="apple"]')).toBeVisible();
    await expect(page.locator('#ios-signin [data-act="google"]')).toHaveCount(0);
  });
});

test.describe('Stage 5c on the phone website', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('no provider buttons on the phone website', async ({ page }) => {
    await boot(page, { native: false });
    await page.evaluate(() => window.iosSignIn.open({ from: 'settings' }));
    expect(await page.evaluate(() => window.CA_NATIVE)).toBe(false);
    await expect(page.locator('#ios-signin [data-act="apple"]:visible, #ios-signin [data-act="google"]')).toHaveCount(0);
  });
});
