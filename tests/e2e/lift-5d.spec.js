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

// ── Task 4: state and rescheduling ──
const ON_PREFS = (extra) => Object.assign({ chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com',
  reminders: JSON.stringify(Object.assign({ on: true, time: '19:00', asked: 'done', quizzes: 1, laterAtQuiz: null, lastStudiedDay: null }, extra || {})) });
const GRANTED = { __notif: JSON.stringify({ perm: 'granted', requestAnswer: 'granted' }) };
const lastSchedule = async (page) => { const c = (await notifCalls(page)).filter((x) => x.op === 'schedule'); return c.length ? c[c.length - 1].notifications : null; };
const localDay = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

test.describe('Stage 5d: rescheduling', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('launch schedules the plan (7 reminders, or 6 after the time today)', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS({ time: '23:59' }), seed: GRANTED });
    await expect.poll(async () => (await lastSchedule(page) || []).length, { timeout: 6000 }).toBeGreaterThanOrEqual(6);
    const n = await lastSchedule(page);
    expect(n.map((x) => x.id).every((id) => id >= 5001 && id <= 5007)).toBe(true);
    expect(n[0].title).toBe('CertAnvil');
  });

  test('finishing a quiz drops today\'s and stores lastStudiedDay as the local date', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS({ time: '23:59' }), seed: GRANTED });
    await expect.poll(async () => (await lastSchedule(page) || []).length, { timeout: 6000 }).toBeGreaterThanOrEqual(6);
    const before = (await lastSchedule(page)).map((x) => x.id);
    await page.evaluate(() => window.dispatchEvent(new Event('ca:quiz-finished')));
    await expect.poll(async () => (await lastSchedule(page)).map((x) => x.id).includes(5001), { timeout: 4000 }).toBe(false);
    const st = await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('__prefs')).reminders));
    expect(st.lastStudiedDay).toBe(localDay());
    expect(st.quizzes).toBe(2);
    if (before.includes(5001)) expect((await lastSchedule(page)).length).toBe(before.length - 1);
  });

  test('a second cert opened the same day keeps today\'s dropped', async ({ page }) => {
    await boot(page, { prefs: Object.assign(ON_PREFS({ time: '23:59', lastStudiedDay: localDay() }), { chosenCert: 'secplus', lockedCert: 'secplus', lastCertHost: 'secplus.certanvil.com' }), seed: GRANTED, query: '?cert=secplus' });
    await expect.poll(async () => (await lastSchedule(page) || []).length, { timeout: 6000 }).toBe(6);
    expect((await lastSchedule(page)).map((x) => x.id)).not.toContain(5001);
  });

  test('permission denied: cancelAll and nothing scheduled on app-active', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS(), seed: { __notif: JSON.stringify({ perm: 'denied' }) } });
    await page.evaluate(() => { localStorage.setItem('__notifCalls', '[]'); window.__fireAppActive(); });
    await expect.poll(async () => (await notifCalls(page)).some((c) => c.op === 'cancel'), { timeout: 4000 }).toBe(true);
    expect((await notifCalls(page)).some((c) => c.op === 'schedule')).toBe(false);
  });

  test('the tier resolving as Pro reschedules without the free 15 line', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS({ time: '23:59' }), seed: GRANTED, fake: { signedOut: false, tier: 'pro', metaOverride: { tier: 'pro', entitlements: {} } } });
    await expect.poll(async () => { const n = await lastSchedule(page); return !!n && n.every((x) => !/15 questions/.test(x.body)); }, { timeout: 8000 }).toBe(true);
  });

  test('a launch and an app-active together leave one set, never two', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS({ time: '23:59' }), seed: GRANTED });
    await page.evaluate(() => { window.__fireAppActive(); window.__fireAppActive(); });
    await page.waitForTimeout(1500);
    const calls = await notifCalls(page);
    // every schedule is preceded by a cancel (serialised): never two schedules back to back
    let prev = null; for (const c of calls) { if (c.op === 'schedule') expect(prev).toBe('cancel'); if (c.op === 'schedule' || c.op === 'cancel') prev = c.op; }
  });
});

test.describe('Stage 5d: off the app', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('website: no reminder calls and no errors', async ({ page }) => {
    const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
    await boot(page, { native: false, prefs: ON_PREFS(), seed: GRANTED });
    await page.evaluate(() => window.dispatchEvent(new Event('ca:quiz-finished')));
    await page.waitForTimeout(800);
    expect(await notifCalls(page)).toEqual([]);
    expect(errs).toEqual([]);
  });
});
