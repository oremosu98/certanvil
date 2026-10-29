// Stage 5d: study reminders inside the iOS app (features/ios-reminders.js; caNative.reminders in native-shell.js). Harness copied from lift-5c. Native paths run with the app's UA
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
        // Stage 5d: localStorage __notif = { perm: 'prompt'|'granted'|'denied', requestAnswer }; calls land in __notifCalls
        LocalNotifications: (function () {
          const st = () => JSON.parse(localStorage.getItem('__notif') || '{"perm":"prompt","requestAnswer":"granted"}');
          const rec = (o) => { const c = JSON.parse(localStorage.getItem('__notifCalls') || '[]'); c.push(o); localStorage.setItem('__notifCalls', JSON.stringify(c)); };
          return {
            checkPermissions: () => Promise.resolve({ display: st().perm }),
            requestPermissions: () => { const s = st(); s.perm = s.requestAnswer || 'granted'; localStorage.setItem('__notif', JSON.stringify(s)); rec({ op: 'request' }); return Promise.resolve({ display: s.perm }); },
            schedule: (o) => { rec({ op: 'schedule', notifications: o.notifications }); return Promise.resolve({ notifications: o.notifications.map((n) => ({ id: n.id })) }); },
            cancel: (o) => { rec({ op: 'cancel', ids: o.notifications.map((n) => n.id) }); return Promise.resolve(); }
          };
        })(),
        AppLauncher: { openUrl: (o) => { const c = JSON.parse(localStorage.getItem('__notifCalls') || '[]'); c.push({ op: 'openUrl', url: o.url }); localStorage.setItem('__notifCalls', JSON.stringify(c)); return Promise.resolve({ completed: true }); } },
        App: { addListener: (ev, cb) => { if (ev === 'appStateChange') window.__fireAppActive = () => cb({ isActive: true }); return Promise.resolve({ remove: () => {} }); } },
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
const notifCalls = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__notifCalls') || '[]'));

test.describe('Stage 5d: caNative.reminders', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('ready() is true with the plugin', async ({ page }) => {
    await boot(page);
    expect(await page.evaluate(() => window.caNative.reminders.ready())).toBe(true);
  });

  test('ready() is false without the plugin', async ({ page }) => {
    await page.addInitScript(() => { const t = setInterval(() => { if (window.Capacitor && window.Capacitor.Plugins) { delete window.Capacitor.Plugins.LocalNotifications; delete window.Capacitor.Plugins.AppLauncher; clearInterval(t); } }, 0); });
    await boot(page);
    expect(await page.evaluate(() => [window.caNative.reminders.ready(), window.caNative.canOpenAppSettings()])).toEqual([false, false]);
  });

  test('permission() maps prompt-with-rationale to prompt; request() returns the answer', async ({ page }) => {
    await boot(page, { seed: { __notif: JSON.stringify({ perm: 'prompt-with-rationale', requestAnswer: 'denied' }) } });
    expect(await page.evaluate(() => window.caNative.reminders.permission())).toBe('prompt');
    expect(await page.evaluate(() => window.caNative.reminders.request())).toBe('denied');
    expect(await page.evaluate(() => window.caNative.reminders.permission())).toBe('denied');
  });

  test('schedule() passes id, title, body and schedule.at per item', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => window.caNative.reminders.schedule([{ id: 5001, at: new Date(Date.now() + 3600e3), title: 'CertAnvil', body: 'b1' }]));
    const s = (await notifCalls(page)).find((c) => c.op === 'schedule');
    expect(s.notifications[0]).toMatchObject({ id: 5001, title: 'CertAnvil', body: 'b1' });
    expect(new Date(s.notifications[0].schedule.at).getTime()).toBeGreaterThan(Date.now());
  });

  test('cancelAll() cancels exactly ids 5001 to 5007', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => window.caNative.reminders.cancelAll());
    expect((await notifCalls(page)).find((c) => c.op === 'cancel').ids).toEqual([5001, 5002, 5003, 5004, 5005, 5006, 5007]);
  });

  test('openAppSettings() opens app-settings:', async ({ page }) => {
    await boot(page);
    expect(await page.evaluate(() => window.caNative.canOpenAppSettings())).toBe(true);
    await page.evaluate(() => window.caNative.openAppSettings());
    expect((await notifCalls(page)).find((c) => c.op === 'openUrl').url).toBe('app-settings:');
  });

  test('returning to the foreground dispatches ca:app-active', async ({ page }) => {
    await boot(page);
    const got = await page.evaluate(() => new Promise((r) => { window.addEventListener('ca:app-active', () => r(true), { once: true }); window.__fireAppActive(); setTimeout(() => r(false), 1000); }));
    expect(got).toBe(true);
  });
});
