// Stage 5b: sign in by email code inside the iOS app (features/ios-signin.js). Native paths run with the app's UA
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
    // F3: the expired code is gone; this signed-out launch (cert chosen, no history) lands on the account screen instead of nothing
    await expect(host(page)).not.toContainText('We sent a 6-digit code');
    await expect(host(page)).toContainText('Create your account to start');
  });

  test('Wrong email? Change it returns to the email, filled in', async ({ page }) => {
    await boot(page);
    await toCode(page, 'sam@example.test');
    await page.click('#ios-signin .isi-change [data-act="change"]');
    await expect(host(page)).toContainText('Sign in or create your account');
    await expect(page.locator('#isi-email')).toHaveValue('sam@example.test');
  });
});

// ── Task 3: the account's free exam wins (spec §After sign-in) ──
async function signIn(page) {
  await toCode(page, 'sam@example.test');
  await typeCode(page, '123456');
}
const writes = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__fakeFreeCertWrites') || '[]'));
const SECPLUS = { chosenCert: 'secplus', lockedCert: 'secplus', lastCertHost: 'secplus.certanvil.com' };

test.describe('Stage 5b: the lock rule after sign-in', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('account Netplus vs phone Secplus opens Netplus with the toast once', async ({ page }) => {
    await boot(page, { fake: { accountFreeCert: 'netplus', tier: 'free' }, prefs: SECPLUS, query: '?cert=secplus' });
    await signIn(page);
    await page.waitForURL(/cert=netplus/, { timeout: 10000 });
    await page.waitForLoadState('load');
    await expect(page.locator('.isi-toast')).toContainText('Your free exam on this account is Network+, so we\'ve opened it.', { timeout: 5000 });
    expect(await prefs(page)).toMatchObject({ chosenCert: 'netplus', lockedCert: 'netplus' });
    await page.reload(); await page.waitForLoadState('load'); await page.waitForTimeout(1200);
    await expect(page.locator('.isi-toast')).toHaveCount(0);
  });

  test('the account keeps Netplus after the flush', async ({ page }) => {
    await boot(page, { fake: { accountFreeCert: 'netplus', tier: 'free' }, prefs: SECPLUS, query: '?cert=secplus', seed: { nplus_freeCertId: 'secplus' } });
    await signIn(page);
    await page.waitForURL(/cert=netplus/, { timeout: 10000 });
    const w = await writes(page);
    expect(w.length).toBeGreaterThan(0);
    expect(w.filter((v) => v === 'secplus')).toEqual([]);
  });

  test('an account with no free exam takes the phone\'s pick', async ({ page }) => {
    await boot(page, { fake: { tier: 'free' }, prefs: SECPLUS, query: '?cert=secplus' });
    await signIn(page);
    await expect.poll(() => writes(page), { timeout: 8000 }).toContain('secplus');
    await expect(page.locator('.isi-toast')).toHaveCount(0);
    expect(await prefs(page)).toMatchObject({ lockedCert: 'secplus' });
  });

  test('the lock rule runs when the hydrate starts inside verifyOtp', async ({ page }) => {
    await boot(page, { fake: { accountFreeCert: 'netplus', tier: 'free', verifyDelay: 600 }, prefs: SECPLUS, query: '?cert=secplus' });
    await signIn(page);
    await page.waitForURL(/cert=netplus/, { timeout: 10000 });
    expect(await prefs(page)).toMatchObject({ lockedCert: 'netplus' });
  });

  test('a failed hydrate writes nothing', async ({ page }) => {
    await boot(page, { fake: { accountFreeCert: 'netplus', tier: 'free', profileError: true }, prefs: SECPLUS, query: '?cert=secplus', seed: { nplus_freeCertId: 'secplus' } });
    await signIn(page);
    await page.waitForTimeout(2500);
    expect(await prefs(page)).toMatchObject(SECPLUS);
    expect(await writes(page)).toEqual([]);
    expect(await page.evaluate(() => window.CURRENT_CERT)).toBe('secplus');
  });

  test('Pro drops the app lock', async ({ page }) => {
    await boot(page, { fake: { tier: 'pro', metaOverride: { tier: 'pro' } }, prefs: SECPLUS, query: '?cert=secplus' });
    await signIn(page);
    await expect.poll(async () => (await prefs(page)).lockedCert, { timeout: 8000 }).toBeUndefined();
    expect((await prefs(page)).chosenCert).toBe('secplus');
  });

  test('a signed-in user\'s page never records the phone\'s pick', async ({ page }) => {
    await boot(page, { fake: { signedOut: false, tier: 'free' }, prefs: SECPLUS, query: '?cert=secplus' });
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => localStorage.getItem('nplus_freeCertId'))).toBeNull();
  });

  test('sign in from the picker opens the account\'s cert', async ({ page }) => {
    await boot(page, { fake: { accountFreeCert: 'secplus', tier: 'free' }, prefs: {} });
    await page.click('#onb-firstrun [data-act="signin"]');   // F3: the picker's "Already have an account? Sign in"
    await page.fill('#isi-email', 'sam@example.test');
    await page.click('#ios-signin [data-act="continue"]');
    await typeCode(page, '123456');
    await page.waitForURL(/cert=secplus/, { timeout: 10000 });
    await page.waitForTimeout(900);
    await expect(page.locator('#onb-firstrun')).toBeHidden();
    expect(await prefs(page)).toMatchObject({ chosenCert: 'secplus', lockedCert: 'secplus' });
  });

  test('sign in from the picker returns to the picker when the account has none', async ({ page }) => {
    await boot(page, { fake: { tier: 'free' }, prefs: {} });
    await page.click('#onb-firstrun [data-act="signin"]');   // F3: the picker's "Already have an account? Sign in"
    await page.fill('#isi-email', 'sam@example.test');
    await page.click('#ios-signin [data-act="continue"]');
    await typeCode(page, '123456');
    await expect(page.locator('#onb-firstrun')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#onb-firstrun')).toContainText('Which exam are you studying for?');
  });

  test('a signed-in free user on the wrong cert gets the cert-lock wall', async ({ page }) => {
    await boot(page, { fake: { signedOut: false, tier: 'free' }, prefs: { chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com' }, query: '?cert=secplus', seed: { nplus_freeCertId: 'netplus' } });
    await page.waitForTimeout(1500);
    await expect(page.locator('.cl-wall')).toBeVisible();
  });
});
const prefs = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__prefs') || '{}'));

// ── Task 4 (repointed in F3): the exam picker first, and sign-in never leaves the app ──
test.describe('Stage 5b: first launch and every sign-in in the app', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('a fresh install shows the picker', async ({ page }) => {
    await boot(page, { prefs: {} });
    await expect(page.locator('#onb-firstrun')).toContainText('Which exam are you studying for?');
    await expect(page.locator('#onb-firstrun [data-act="signin"]')).toContainText('Already have an account? Sign in');
    await expect(host(page)).toBeHidden();
  });

  test('the picker leads to both reminders as in 5a', async ({ page }) => {
    await boot(page, { prefs: {} });
    await expect(host(page)).toBeHidden();
    await expect(page.locator('#onb-firstrun')).toContainText('Which exam are you studying for?');
    await page.click('#onb-firstrun [data-act="lock"]');
    await page.click('#ist-sheet [data-act="lock-go"]');
    await expect(page.locator('#ist-sheet')).toContainText('One last check');
  });

  test('Already have an account opens sign-in, and back returns to the picker', async ({ page }) => {
    await boot(page, { prefs: {} });
    await page.click('#onb-firstrun [data-act="signin"]');
    await expect(host(page)).toContainText('Sign in or create your account');
    await page.click('#ios-signin [data-act="back"]');
    await expect(host(page)).toBeHidden();
    await expect(page.locator('#onb-firstrun')).toContainText('Which exam are you studying for?');
  });

  for (const [name, run] of [
    ['Home', async (page) => { await page.evaluate(() => window.iosSignIn.close()); await page.click('#ios-home [data-act="signin"]'); }],
    ['Settings', async (page) => { await page.evaluate(() => window.iosSettings._on.signin()); }],
    ['Custom quiz', async (page) => { await page.evaluate(() => window.iosSignIn.go('custom')); }],
    ['the topbar pill', async (page) => { await page.evaluate(() => { const a = document.querySelector('a.topbar-signin-pill'); a.click(); }); }],
    ['the app.js fallback', async (page) => { await page.evaluate(() => window.iosSignIn.go('home')); }]
  ]) {
    test(`Sign in from ${name} stays in the app`, async ({ page }) => {
      await boot(page, { seed: { nplus_onb_skips: '{"at":1}' } });   // past day-0, so Home is drawn
      const before = page.url();
      await run(page);
      await expect(host(page)).toContainText('Sign in or create your account');
      expect(page.url()).toBe(before);
    });
  }
});

test.describe('Stage 5b on the website', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('the website keeps the certanvil.com sign-in link', async ({ page }) => {
    await boot(page, { native: false, prefs: {} });
    await expect(page.locator('#ios-signin')).toBeHidden();
    expect(await page.evaluate(() => window.CA_NATIVE)).toBe(false);
    const href = await page.evaluate(() => { const a = document.querySelector('a.topbar-signin-pill'); return a && a.href; });
    expect(href).toMatch(/^https:\/\/certanvil\.com\/\?action=signin&return=/);
    await page.route('https://certanvil.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>landing</p>' }));
    const req = page.waitForRequest(/^https:\/\/certanvil\.com\/\?action=signin&return=/);
    await page.evaluate(() => window.iosSignIn.go('home'));
    await req;
  });
});

// ── Final review fixes (fable, 28 Oct) ──
test.describe('Stage 5b final review fixes', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('I1: a hydrate slower than the wait never puts the phone\'s pick back (the late flush would push it over the account\'s)', async ({ page }) => {
    await boot(page, { prefs: SECPLUS, query: '?cert=secplus' });
    const r = await page.evaluate(async () => {
      localStorage.removeItem('nplus_freeCertId');
      await window.iosSignIn._afterVerify({ local: 'secplus', done: Promise.resolve('timeout') });
      const timeout = localStorage.getItem('nplus_freeCertId');
      await window.iosSignIn._afterVerify({ local: 'secplus', done: Promise.resolve('error') });
      return { timeout, error: localStorage.getItem('nplus_freeCertId') };
    });
    expect(r).toEqual({ timeout: null, error: 'secplus' });   // a failed hydrate never flushes, so only then is it safe to put back
  });

  test('I2: a pending code survives a relaunch (session storage gone)', async ({ page }) => {
    await boot(page);
    await toCode(page, 'sam@example.test');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload(); await page.waitForLoadState('load'); await page.waitForTimeout(900);
    await expect(host(page)).toContainText('We sent a 6-digit code to sam@example.test.');
  });

  test('I3: the cert-lock wall never shows during the account switch', async ({ page }) => {
    await page.addInitScript(() => {
      new MutationObserver(() => { if (document.querySelector('.cl-wall')) localStorage.setItem('__wallSeen', location.search || '/'); })
        .observe(document.documentElement, { childList: true, subtree: true });
    });
    await boot(page, { fake: { accountFreeCert: 'netplus', tier: 'free' }, prefs: SECPLUS, query: '?cert=secplus' });
    await signIn(page);
    await page.waitForURL(/cert=netplus/, { timeout: 10000 });
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => localStorage.getItem('__wallSeen'))).toBeNull();
  });

  test('I4: Terms and Privacy open in the in-app browser sheet', async ({ page }) => {
    await boot(page);
    await openSignIn(page);
    const before = page.url();
    await page.click('#ios-signin .isi-legal a >> text=Terms');
    await page.click('#ios-signin .isi-legal a >> text=Privacy Policy');
    expect(await page.evaluate(() => window.__browser)).toEqual(['https://certanvil.com/terms', 'https://certanvil.com/privacy']);
    expect(page.url()).toBe(before);
  });

  test('I5: an unknown tier changes nothing (no switch, no toast)', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, '_quotaState', { configurable: true, get: () => null, set: () => {} }); });
    await boot(page, { fake: { accountFreeCert: 'netplus', tier: 'pro' }, prefs: SECPLUS, query: '?cert=secplus' });
    await page.evaluate(() => { window.iosSignIn._tierWait = 800; });
    await signIn(page);
    await page.waitForTimeout(3000);
    expect(await prefs(page)).toMatchObject(SECPLUS);
    expect(await page.evaluate(() => window.CURRENT_CERT)).toBe('secplus');
    await expect(host(page)).toBeHidden();
  });

  test('I6: Continue before Supabase has loaded still sends once it arrives', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.route('**/lib/supabase.js*', async (r) => { await new Promise((x) => setTimeout(x, 3000)); r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB={"signedOut":true,"metaOverride":{"tier":"free"}};' + FAKE }); });
    await page.addInitScript(() => { localStorage.setItem('__prefs', JSON.stringify({ chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com' })); localStorage.setItem('nplus_a2hs_dismissed', '1'); });
    await page.addInitScript(stubScript());
    await page.goto('/');
    await page.waitForFunction(() => window.iosSignIn && window.iosSignIn.open);
    await page.evaluate(() => window.iosSignIn.open({ from: 'settings' }));
    await page.fill('#isi-email', 'sam@example.test');
    await page.click('#ios-signin [data-act="continue"]');
    await expect(host(page)).toContainText('We sent a 6-digit code to sam@example.test.', { timeout: 10000 });
  });
});

test.describe('Stage 5b: a refused send says so (found in the founder test, 28 Oct)', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });
  test('a 500 from Supabase is not reported as a connection problem', async ({ page }) => {
    await boot(page, { fake: { otpStatus: 500 } });
    await openSignIn(page);
    await page.fill('#isi-email', 'sam@example.test');
    await page.click('#ios-signin [data-act="continue"]');
    await expect(page.locator('#isi-msg')).toHaveText("We couldn't send a code just now. Try again in a minute.");
  });
});

// ── Legal in the app (founder ask, 28 Oct): Settings → About carries Privacy Policy and Terms of Service ──
test.describe('Stage 5b: legal pages in Settings', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });
  test('Settings has About with Privacy Policy and Terms, opening in the in-app sheet', async ({ page }) => {
    await boot(page, { seed: { nplus_onb_skips: '{"at":1}' } });
    await page.evaluate(() => window.iosSignIn.close());   // F3: a signed-out launch opens the account screen over Home; Settings is under it
    await page.click('#ios-home [data-act="settings"]');
    await expect(page.locator('#ios-settings .ist-legal')).toBeVisible();
    const about = page.locator('#ios-settings .ist-legal');
    await expect(page.locator('#ios-settings .ist-sect', { hasText: 'About' })).toHaveCount(1);
    await expect(about.locator('a.ist-row')).toHaveText([/Privacy Policy/, /Terms of Service/]);
    const before = page.url();
    await about.locator('a.ist-row').nth(0).dispatchEvent('click');
    await about.locator('a.ist-row').nth(1).dispatchEvent('click');
    expect(await page.evaluate(() => window.__browser)).toEqual(['https://certanvil.com/privacy', 'https://certanvil.com/terms']);
    expect(page.url()).toBe(before);
  });
});
