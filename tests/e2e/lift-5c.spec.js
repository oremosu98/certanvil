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
            // Mirrors the plugin (AppleProvider.swift): authorizationCode only with useProperTokenExchange; legacy mode puts it in accessToken.token
            const init = JSON.parse(localStorage.getItem('__socialInit') || '{}'), proper = !!(init.apple && init.apple.useProperTokenExchange);
            const code = cfg.authorizationCode || 'code-1';
            const out = () => Promise.resolve({ provider: o.provider, result: Object.assign({ idToken: cfg.idToken || ('tok-' + o.provider),
              profile: { givenName: cfg.givenName || null, familyName: cfg.familyName || null, email: null, user: 'apple-sub-1' } },
              o.provider === 'apple' ? (proper ? { authorizationCode: code, accessToken: null } : { accessToken: { token: code } }) : {}) });
            return cfg.delay ? new Promise((r) => setTimeout(r, cfg.delay)).then(out) : out();
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

// ── Task 3: Settings → Sign-in methods ──
const linkCalls = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__linkCalls') || '[]'));
async function openSettings(page) {
  await page.click('#ios-home [data-act="settings"]');
  await expect(page.locator('#ios-settings')).toBeVisible();
}
async function openMethods(page) {
  await openSettings(page);
  await page.click('#ios-settings [data-act="methods"]');
  await expect(page.locator('#ist-sheet')).toContainText('Sign-in methods');
}
const SIGNED = { signedOut: false, tier: 'free' };

test.describe('Stage 5c: Settings → Sign-in methods', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('Sign-in methods lists Email on and Apple and Google to add', async ({ page }) => {
    await page.addInitScript(IDS);
    await boot(page, { fake: SIGNED, seed: { nplus_onb_skips: '{"at":1}' } });
    await openSettings(page);
    await expect(page.locator('#ios-settings [data-act="methods"]')).toContainText('Email');
    await page.click('#ios-settings [data-act="methods"]');
    const sh = page.locator('#ist-sheet');
    await expect(sh).toContainText('Any of these opens this account.');
    await expect(sh.locator('.ist-meth')).toHaveCount(3);
    await expect(sh.locator('[data-act="add-apple"]')).toHaveText('Add');
    await expect(sh.locator('[data-act="add-google"]')).toHaveText('Add');
    await expect(sh).toContainText("Signed up with Apple's Hide My Email? Add Apple here so both open this account.");
  });

  test('Add Apple links and shows Connected', async ({ page }) => {
    await boot(page, { fake: SIGNED, seed: { nplus_onb_skips: '{"at":1}' } });
    await openMethods(page);
    await page.click('#ist-sheet [data-act="add-apple"]');
    await expect(page.locator('#ist-sheet')).toContainText('Connected');
    expect((await linkCalls(page))[0]).toMatchObject({ provider: 'apple', token: 'tok-apple' });
    expect((await linkCalls(page))[0].nonce).toMatch(/^[0-9a-f]{64}$/);
    expect(await idCalls(page)).toEqual([]);   // linking never signs in again
    await expect(page.locator('#ios-settings [data-act="methods"]')).toContainText('Email, Apple');
  });

  test('an Apple ID that is already an account shows the defined message', async ({ page }) => {
    await boot(page, { fake: Object.assign({ linkError: 'identity_already_exists' }, SIGNED), seed: { nplus_onb_skips: '{"at":1}' } });
    await openMethods(page);
    await page.click('#ist-sheet [data-act="add-apple"]');
    await expect(page.locator('#ist-sheet .ist-merr')).toHaveText('That Apple ID already has its own CertAnvil account. To use it, sign out and continue with Apple.');
  });

  test('another link error shows Couldn\'t add Apple', async ({ page }) => {
    await boot(page, { fake: Object.assign({ linkError: 'other' }, SIGNED), seed: { nplus_onb_skips: '{"at":1}' } });
    await openMethods(page);
    await page.click('#ist-sheet [data-act="add-apple"]');
    await expect(page.locator('#ist-sheet .ist-merr')).toHaveText("Couldn't add Apple. Try again.");
  });

  test('a cancelled Add changes nothing', async ({ page }) => {
    await boot(page, { fake: SIGNED, seed: { nplus_onb_skips: '{"at":1}', __social: JSON.stringify({ mode: 'cancel' }) } });
    await openMethods(page);
    await page.click('#ist-sheet [data-act="add-apple"]');
    await page.waitForTimeout(500);
    expect(await linkCalls(page)).toEqual([]);
    await expect(page.locator('#ist-sheet .ist-merr')).toHaveCount(0);
    await expect(page.locator('#ist-sheet [data-act="add-apple"]')).toBeVisible();
  });

  test('an account that already has Apple shows it Connected', async ({ page }) => {
    await boot(page, { fake: Object.assign({ identities: ['apple'] }, SIGNED), seed: { nplus_onb_skips: '{"at":1}' } });
    await openSettings(page);
    await expect(page.locator('#ios-settings [data-act="methods"]')).toContainText('Email, Apple');
  });

  test('no Sign-in methods row signed out', async ({ page }) => {
    await boot(page, { seed: { nplus_onb_skips: '{"at":1}' } });
    await openSettings(page);
    await expect(page.locator('#ios-settings [data-act="methods"]')).toHaveCount(0);
  });
});

test.describe('Stage 5c: Sign-in methods off the app', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('no Sign-in methods row on the phone website', async ({ page }) => {
    await boot(page, { native: false, fake: SIGNED, seed: { nplus_onb_skips: '{"at":1}' } });
    await openSettings(page);
    await page.waitForTimeout(800);
    await expect(page.locator('#ios-settings [data-act="methods"]')).toHaveCount(0);
  });
});

// ── Task 4: Apple confirms before an Apple account is deleted ──
async function routeRevoke(page, result) {
  const seen = [];
  await page.route('https://certanvil.com/api/apple-revoke', async (r) => {
    seen.push({ body: r.request().postDataJSON(), auth: r.request().headers()['authorization'], at: Date.now() });
    await r.fulfill({ status: result === 'ok' ? 200 : 409, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ result }) });
  });
  return seen;
}
async function deleteAccount(page) {
  await openSettings(page);
  await page.click('#ios-settings [data-act="delete"]');
  await expect(page.locator('#delete-account-modal')).toBeVisible();
  await page.fill('#dla-email', 'simi.test@example.test');
  await page.click('#dla-confirm');
}
const profileUpdateAt = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__fakeFreeCertWrites') || '[]').length);

test.describe('Stage 5c: deleting an Apple account', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('deleting an Apple account asks Apple first, then schedules deletion', async ({ page }) => {
    const seen = await routeRevoke(page, 'ok');
    await boot(page, { fake: Object.assign({ identities: ['apple'] }, SIGNED), seed: { nplus_onb_skips: '{"at":1}', __social: JSON.stringify({ mode: 'ok', authorizationCode: 'code-del' }) } });
    await deleteAccount(page);
    await expect(page.locator('#delete-account-modal')).toContainText('Account scheduled for deletion', { timeout: 8000 });
    expect(seen.length).toBe(1);
    expect(seen[0].body).toEqual({ code: 'code-del' });
    expect(seen[0].auth).toBe('Bearer fake.jwt.token');
    expect((await socialCalls(page)).map((c) => c.provider)).toEqual(['apple']);
  });

  test('cancelling Apple still schedules deletion', async ({ page }) => {
    const seen = await routeRevoke(page, 'ok');
    await boot(page, { fake: Object.assign({ identities: ['apple'] }, SIGNED), seed: { nplus_onb_skips: '{"at":1}', __social: JSON.stringify({ mode: 'cancel' }) } });
    await deleteAccount(page);
    await expect(page.locator('#delete-account-modal')).toContainText('Account scheduled for deletion', { timeout: 8000 });
    expect(seen.length).toBe(0);
  });

  test('a refused revoke still schedules deletion', async ({ page }) => {
    await routeRevoke(page, 'sub-mismatch');
    await boot(page, { fake: Object.assign({ identities: ['apple'] }, SIGNED), seed: { nplus_onb_skips: '{"at":1}' } });
    await deleteAccount(page);
    await expect(page.locator('#delete-account-modal')).toContainText('Account scheduled for deletion', { timeout: 8000 });
  });

  test('a non-Apple account deletes without the Apple step', async ({ page }) => {
    const seen = await routeRevoke(page, 'ok');
    await boot(page, { fake: SIGNED, seed: { nplus_onb_skips: '{"at":1}' } });
    await deleteAccount(page);
    await expect(page.locator('#delete-account-modal')).toContainText('Account scheduled for deletion', { timeout: 8000 });
    expect(seen.length).toBe(0);
    expect(await socialCalls(page)).toEqual([]);
  });

  test('the delete sheet shows the Apple note only for Apple accounts in the app', async ({ page }) => {
    await boot(page, { fake: Object.assign({ identities: ['apple'] }, SIGNED), seed: { nplus_onb_skips: '{"at":1}' } });
    await openSettings(page);
    await page.click('#ios-settings [data-act="delete"]');
    await expect(page.locator('#delete-account-modal')).toContainText('You sign in with Apple, so Apple will ask you to confirm. That also stops CertAnvil using your Apple ID.');
  });

  test('no Apple note for an email-only account', async ({ page }) => {
    await boot(page, { fake: SIGNED, seed: { nplus_onb_skips: '{"at":1}' } });
    await openSettings(page);
    await page.click('#ios-settings [data-act="delete"]');
    await expect(page.locator('#delete-account-modal')).toBeVisible();
    await expect(page.locator('#delete-account-modal')).not.toContainText('You sign in with Apple');
  });
});

// ── Final review fixes (fable, 28 Oct) ──
test.describe('Stage 5c final review fixes', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('C1: the plugin is initialised for the proper token exchange, so Apple returns the code', async ({ page }) => {
    await boot(page, { seed: { __social: JSON.stringify({ mode: 'ok', authorizationCode: 'c-real' }) } });
    const r = await page.evaluate(() => window.caNative.social('apple', {}));
    expect(r.authorizationCode).toBe('c-real');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('__socialInit')).apple.useProperTokenExchange)).toBe(true);
  });

  test('I2: an Apple name replaces the placeholder taken from the email', async ({ page }) => {
    await boot(page, { fake: { displayName: 'simi.test' }, seed: { __social: JSON.stringify({ mode: 'ok', givenName: 'Simi', familyName: 'Oremosu' }) } });
    await openIn(page);
    await page.click('#ios-signin [data-act="apple"]');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('__fakeDisplayName')), { timeout: 8000 }).toBe('Simi Oremosu');
  });

  test('I3: time on Apple\'s sheet does not count against the revoke timeout', async ({ page }) => {
    const seen = await routeRevoke(page, 'ok');
    await boot(page, { fake: Object.assign({ identities: ['apple'] }, SIGNED), seed: { nplus_onb_skips: '{"at":1}', __social: JSON.stringify({ mode: 'ok', delay: 1500 }) } });
    await page.evaluate(() => { window.iosSignIn._revokeWait = 600; });
    await deleteAccount(page);
    await expect(page.locator('#delete-account-modal')).toContainText('Account scheduled for deletion', { timeout: 8000 });
    expect(seen.length).toBe(1);
    expect(seen[0].auth).toBe('Bearer fake.jwt.token');
  });

  test('I4: a revoke that never reaches the server is logged', async ({ page }) => {
    await boot(page, { fake: Object.assign({ identities: ['apple'] }, SIGNED), seed: { nplus_onb_skips: '{"at":1}', __social: JSON.stringify({ mode: 'fail' }) } });
    await page.evaluate(() => { window.__logs = []; window.logError = function (t, m) { window.__logs.push(m); }; });
    await deleteAccount(page);
    await expect(page.locator('#delete-account-modal')).toContainText('Account scheduled for deletion', { timeout: 8000 });
    expect(await page.evaluate(() => window.__logs)).toContain('apple-revoke: failed');
  });
});
