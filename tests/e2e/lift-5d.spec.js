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
            cancel: (o) => { rec({ op: 'cancel', ids: o.notifications.map((n) => n.id) }); return Promise.resolve(); },
            addListener: (ev, cb) => { if (ev === 'localNotificationActionPerformed') window.__fireNotifTap = (extra) => cb({ actionId: 'tap', notification: { id: 5001, extra } }); return Promise.resolve({ remove: () => {} }); }
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
  // F3: a signed-out launch in the app now shows the account screen over everything (requireAccount, spec §2), so
  // reminders (the ask, Settings → Reminders) are only reachable signed in. Boot a signed-in free user by default.
  const F = Object.assign({ role: 'user', noResults: true, signedOut: false, tier: 'free', metaOverride: { tier: 'free', entitlements: {} } }, opts.fake || {});
  await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB=' + JSON.stringify(F) + ';' + FAKE }));
  await page.addInitScript(([prefs, seed]) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1'); localStorage.setItem('ca_tour_seen', '1');
      if (prefs) localStorage.setItem('__prefs', JSON.stringify(Object.assign({ tourSeen: '1' }, prefs)));   // F3: the first-Home tour is lift-f3's
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

  test('cancelAll() cancels exactly ids 5001 to 5010', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => window.caNative.reminders.cancelAll());
    expect((await notifCalls(page)).find((c) => c.op === 'cancel').ids).toEqual([5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010]);
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
const lastSchedule = async (page) => { const c = (await notifCalls(page)).filter((x) => x.op === 'schedule'); return c.length ? c[c.length - 1].notifications.filter((x) => x.id <= 5007) : null; };   // the daily 7; 5008-5010 (last call, drift) are tested in the planner suite
const localDay = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

test.describe('Persona T5: tapping a reminder', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });
  test('tapping a streak reminder opens the Daily Challenge', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS(), seed: GRANTED });
    await page.waitForFunction(() => typeof window.__fireNotifTap === 'function', null, { timeout: 6000 });
    await page.evaluate(() => { window.__dc = 0; window.startDailyChallenge = () => { window.__dc++; }; window.__fireNotifTap({ kind: 'streak' }); });
    await expect.poll(() => page.evaluate(() => window.__dc), { timeout: 4000 }).toBe(1);
  });
  test('tapping a daily or drift reminder does not start it', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS(), seed: GRANTED });
    await page.waitForFunction(() => typeof window.__fireNotifTap === 'function', null, { timeout: 6000 });
    await page.evaluate(() => { window.__dc = 0; window.startDailyChallenge = () => { window.__dc++; }; window.__fireNotifTap({ kind: 'daily' }); window.__fireNotifTap({ kind: 'drift' }); });
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.__dc)).toBe(0);
  });
});

test.describe('Stage 5d: rescheduling', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('launch schedules the plan (7 reminders, or 6 after the time today)', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS({ time: '23:59' }), seed: GRANTED });
    await expect.poll(async () => (await lastSchedule(page) || []).length, { timeout: 6000 }).toBeGreaterThanOrEqual(6);
    const n = await lastSchedule(page);
    expect(n.map((x) => x.id).every((id) => id >= 5001 && id <= 5010)).toBe(true);
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

// ── Task 5: the ask after the first finished quiz ──
const FRESH = (extra) => Object.assign({ chosenCert: 'netplus', lockedCert: 'netplus', lastCertHost: 'networkplus.certanvil.com' }, extra || {});
const state = (page) => page.evaluate(() => { const p = JSON.parse(localStorage.getItem('__prefs') || '{}'); return p.reminders ? JSON.parse(p.reminders) : null; });
async function quizThenHome(page) {
  await page.evaluate(async () => { window.dispatchEvent(new Event('ca:quiz-finished')); await new Promise((r) => setTimeout(r, 300)); window.renderIosHome(); });
}
const sheetOpen = (page) => page.locator('#irm-sheet.open');

test.describe('Stage 5d: the ask', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('no sheet on Home before any finished quiz', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}' } });
    await page.evaluate(() => window.renderIosHome());
    await page.waitForTimeout(600);
    await expect(sheetOpen(page)).toHaveCount(0);
  });

  test('after a finished quiz, the next Home shows the sheet with "Remind me at 7:00 pm"', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}' } });
    await quizThenHome(page);
    await expect(sheetOpen(page)).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#irm-sheet')).toContainText('Remind me at');
    await expect(page.locator('#irm-time-val')).toHaveText('7:00 pm');
    await expect(page.locator('#irm-sheet')).toContainText('your 15');
    await expect(page.locator('#irm-sheet')).toContainText('One a day at most. Turn it off any time in Settings.');
    await expect(page.locator('#irm-sheet')).not.toContainText('Almost done');
  });

  test('Pro sheet has no "15"', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}' }, fake: { signedOut: false, tier: 'pro', metaOverride: { tier: 'pro', entitlements: {} } } });
    await page.waitForTimeout(800);
    await quizThenHome(page);
    await expect(sheetOpen(page)).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#irm-sheet')).not.toContainText('15');
  });

  test('the time row opens the picker; Done updates the row and the saved time', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}' } });
    await quizThenHome(page);
    await page.click('#irm-time');
    await expect(page.locator('#irm-tsheet.open')).toBeVisible();
    await page.click('#irm-wheel button[data-k="h"][data-v="8"]');
    await page.click('#irm-ts-done');
    await expect(page.locator('#irm-time-val')).toHaveText('8:00 pm');
    await expect.poll(async () => (await state(page)).time).toBe('20:00');
  });

  test('Turn on reminders, granted: on, asked done, reminders scheduled', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}', __notif: JSON.stringify({ perm: 'prompt', requestAnswer: 'granted' }) } });
    await quizThenHome(page);
    await page.click('#irm-on');
    await expect(sheetOpen(page)).toHaveCount(0, { timeout: 3000 });
    await expect.poll(async () => { const s = await state(page); return s && s.on && s.asked; }).toBe('done');
    await expect.poll(async () => (await notifCalls(page)).some((c) => c.op === 'schedule')).toBe(true);
  });

  test('Turn on reminders, denied: asked done, nothing scheduled, never shown again', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}', __notif: JSON.stringify({ perm: 'prompt', requestAnswer: 'denied' }) } });
    await quizThenHome(page);
    await page.click('#irm-on');
    await expect.poll(async () => (await state(page)).asked).toBe('done');
    expect((await notifCalls(page)).some((c) => c.op === 'schedule')).toBe(false);
    await quizThenHome(page);
    await page.waitForTimeout(500);
    await expect(sheetOpen(page)).toHaveCount(0);
  });

  test('Maybe later: shown again only after 4 more finished quizzes, then never', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}' } });
    await quizThenHome(page);
    await page.click('#irm-later');
    await expect.poll(async () => (await state(page)).asked).toBe('later');
    for (let i = 0; i < 3; i++) { await quizThenHome(page); await page.waitForTimeout(250); await expect(sheetOpen(page)).toHaveCount(0); }
    await quizThenHome(page);
    await expect(sheetOpen(page)).toBeVisible({ timeout: 3000 });
    await page.click('#irm-later');
    await expect.poll(async () => (await state(page)).asked).toBe('done');
    for (let i = 0; i < 5; i++) await quizThenHome(page);
    await page.waitForTimeout(400);
    await expect(sheetOpen(page)).toHaveCount(0);
  });

  test('not shown while a first-run sheet is open; shown on the next Home', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}' } });
    await page.evaluate(() => { const s = document.getElementById('ist-sheet'); if (s) s.classList.add('open'); });
    await quizThenHome(page);
    await page.waitForTimeout(500);
    await expect(sheetOpen(page)).toHaveCount(0);
    await page.evaluate(() => { const s = document.getElementById('ist-sheet'); if (s) s.classList.remove('open'); window.renderIosHome(); });
    await expect(sheetOpen(page)).toBeVisible({ timeout: 3000 });
  });
});

// ── Task 6: Settings → Reminders ──
async function openSettings(page) {
  await page.click('#ios-home [data-act="settings"]');
  await expect(page.locator('#ios-settings')).toBeVisible();
}
const remRow = (page) => page.locator('#ios-settings [data-act="reminders"]');

test.describe('Stage 5d: Settings → Reminders', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('on and granted: the row reads 7:00 pm', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS(), seed: Object.assign({ nplus_onb_skips: '{"at":1}' }, GRANTED) });
    await openSettings(page);
    await expect(remRow(page)).toContainText('Reminders');
    await expect(remRow(page).locator('.ist-rmv')).toHaveText('7:00 pm', { timeout: 3000 });
  });

  test('off: the row reads Off; switching on with permission not asked asks iOS', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}', __notif: JSON.stringify({ perm: 'prompt', requestAnswer: 'granted' }) } });
    await openSettings(page);
    await expect(remRow(page).locator('.ist-rmv')).toHaveText('Off');
    await remRow(page).click();
    await page.click('#ist-sheet [data-act="rem-sw"]');
    await expect.poll(async () => (await notifCalls(page)).some((c) => c.op === 'request')).toBe(true);
    await expect.poll(async () => { const s = await state(page); return s && s.on; }).toBe(true);
    await expect(remRow(page).locator('.ist-rmv')).toHaveText('7:00 pm', { timeout: 3000 });
    expect((await state(page)).asked).toBe('done');
  });

  test('changing the time reschedules at the new time', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS(), seed: Object.assign({ nplus_onb_skips: '{"at":1}' }, GRANTED) });
    await openSettings(page);
    await remRow(page).click();
    await page.click('#ist-sheet [data-act="rem-time"]');
    await page.click('#ist-sheet [data-act="rem-w"][data-k="h"][data-v="8"]');
    await expect.poll(async () => (await state(page)).time).toBe('20:00');
    await expect.poll(async () => { const n = await lastSchedule(page); return n && new Date(n[n.length - 1].schedule.at).getHours(); }).toBe(20);
    await expect(remRow(page).locator('.ist-rmv')).toHaveText('8:00 pm');
  });

  test('switching off cancels everything', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS(), seed: Object.assign({ nplus_onb_skips: '{"at":1}' }, GRANTED) });
    await openSettings(page);
    await remRow(page).click();
    await page.evaluate(() => localStorage.setItem('__notifCalls', '[]'));
    await page.click('#ist-sheet [data-act="rem-sw"]');
    await expect.poll(async () => (await state(page)).on).toBe(false);
    await expect.poll(async () => (await notifCalls(page)).some((c) => c.op === 'cancel')).toBe(true);
    expect((await notifCalls(page)).some((c) => c.op === 'schedule')).toBe(false);
    await expect(remRow(page).locator('.ist-rmv')).toHaveText('Off');
  });

  test('denied (even with on): row Off, the sheet shows the denied text and Open Settings', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS(), seed: { nplus_onb_skips: '{"at":1}', __notif: JSON.stringify({ perm: 'denied' }) } });
    await openSettings(page);
    await expect(remRow(page).locator('.ist-rmv')).toHaveText('Off', { timeout: 3000 });
    await remRow(page).click();
    await expect(page.locator('#ist-sheet')).toContainText('Notifications are off for CertAnvil in iPhone Settings.');
    await page.click('#ist-sheet [data-act="rem-open"]');
    expect((await notifCalls(page)).find((c) => c.op === 'openUrl').url).toBe('app-settings:');
  });

  test('Open Settings is hidden when the app can\'t open them', async ({ page }) => {
    await page.addInitScript(() => { const t = setInterval(() => { if (window.Capacitor && window.Capacitor.Plugins) { delete window.Capacitor.Plugins.AppLauncher; clearInterval(t); } }, 0); });
    await boot(page, { prefs: ON_PREFS(), seed: { nplus_onb_skips: '{"at":1}', __notif: JSON.stringify({ perm: 'denied' }) } });
    await openSettings(page);
    await remRow(page).click();
    await expect(page.locator('#ist-sheet')).toContainText('Notifications are off');
    await expect(page.locator('#ist-sheet [data-act="rem-open"]')).toHaveCount(0);
  });

  test('allowing later in iPhone Settings: app-active with permission granted restores the time', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS(), seed: { nplus_onb_skips: '{"at":1}', __notif: JSON.stringify({ perm: 'denied' }) } });
    await openSettings(page);
    await expect(remRow(page).locator('.ist-rmv')).toHaveText('Off', { timeout: 3000 });
    await page.evaluate(() => { localStorage.setItem('__notif', JSON.stringify({ perm: 'granted' })); window.__fireAppActive(); });
    await expect(remRow(page).locator('.ist-rmv')).toHaveText('7:00 pm', { timeout: 3000 });
    await expect.poll(async () => !!(await lastSchedule(page))).toBe(true);
  });
});

test.describe('Stage 5d: Settings off the app', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('no Reminders row on the phone website', async ({ page }) => {
    await boot(page, { native: false, prefs: ON_PREFS(), seed: { nplus_onb_skips: '{"at":1}' } });
    await page.click('#ios-home [data-act="settings"]');
    await page.waitForTimeout(600);
    await expect(remRow(page)).toHaveCount(0);
  });
});

// ── Final review fixes ──
test.describe('Stage 5d final review fixes', () => {
  test.use({ userAgent: NATIVE_UA, storageState: { cookies: [], origins: [] } });

  test('the countdown names the cert ("Network+"), not CertAnvil', async ({ page }) => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    await boot(page, { prefs: ON_PREFS({ time: '23:59' }), seed: Object.assign({ nplus_exam_date: iso }, GRANTED) });
    await expect.poll(async () => { const n = await lastSchedule(page); return n && n[0].body; }, { timeout: 6000 }).toMatch(/Your Network\+ exam is in 7 days/);
  });

  test('the ask waits while the sign-in screen is open', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}' } });
    await page.evaluate(() => document.documentElement.classList.add('isi-open'));
    await quizThenHome(page);
    await page.waitForTimeout(500);
    await expect(sheetOpen(page)).toHaveCount(0);
    await page.evaluate(() => { document.documentElement.classList.remove('isi-open'); window.renderIosHome(); });
    await expect(sheetOpen(page)).toBeVisible({ timeout: 3000 });
  });

  test('the ask waits while the full-screen check is open', async ({ page }) => {
    await boot(page, { prefs: FRESH(), seed: { nplus_onb_skips: '{"at":1}' } });
    await page.evaluate(() => document.documentElement.classList.add('ifr-check'));
    await quizThenHome(page);
    await page.waitForTimeout(500);
    await expect(sheetOpen(page)).toHaveCount(0);
  });

  test('closing the Reminders sheet while a change saves does not reopen it', async ({ page }) => {
    await boot(page, { prefs: ON_PREFS(), seed: Object.assign({ nplus_onb_skips: '{"at":1}' }, GRANTED) });
    await openSettings(page);
    await remRow(page).click();
    await page.evaluate(() => { const R = window.iosReminders, orig = R.reschedule; R.reschedule = function () { return new Promise((r) => setTimeout(r, 700)).then(orig); }; });
    await page.click('#ist-sheet [data-act="rem-sw"]');
    await page.evaluate(() => { const s = document.getElementById('ist-sheet-scrim'); if (s) s.click(); });
    await page.waitForTimeout(1500);
    await expect(page.locator('#ist-sheet.open')).toHaveCount(0);
  });
});
