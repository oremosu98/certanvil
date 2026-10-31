// Admin in the app, Task 7: Preview as Free. The admin sees the app exactly as a Free user does (phone and desktop) and
// switches back with "Back to Pro". Drawing: mockups/cert-ios-admin.html (.freebar, ?v=desktop-free). Spec: 2026-10-31-admin-in-app-design.md
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 820 };
const FLAG = 'nplus_admin_free_preview';

function rows(todayTotals, yesterdayTotal) {
  const now = new Date(), y = new Date(now.getTime() - 86400000);
  const out = todayTotals.map((t, i) => ({ date: new Date(now.getTime() - i * 1000).toISOString(), topic: 'Ports', total: t, score: t, pct: 100 }));
  out.push({ date: now.toISOString(), topic: 'Subnetting', total: 4, score: 4, pct: 100, via: 'mixed-split' });   // split rows never count twice
  if (yesterdayTotal) out.push({ date: y.toISOString(), topic: 'Ports', total: yesterdayTotal, score: 1, pct: 10 });
  return out;
}

async function boot(page, size, extra) {
  await page.setViewportSize(size);
  // localhost-only fixture seeds, in this test's own isolated browser context
  const seed = Object.assign({ nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' }, extra || {});
  await page.addInitScript((sd) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, seed);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => !!window._adminPreview && typeof _renderQuotaChip === 'function' && document.body.classList.contains('is-state-resolved'));
  await page.waitForTimeout(300);   // the signed-out quota reset lands before the admin state below
}

// The admin account as the app sees it once signed in: Pro, unlimited.
async function asAdmin(page) {
  await page.evaluate(() => {
    window._quotaState = { tier: 'pro', daily_limit: -1, used_today: 0 };
    _renderQuotaChip();
    window._certanvilIsAdmin = true;
    window.__noReload = true;
  });
}

test.describe('Preview as Free', () => {
  test('desktop: the Free bar shows across the main area and the sidebar Pro locks appear (body loses is-pro-tier)', async ({ page }) => {
    await boot(page, DESKTOP);
    await asAdmin(page);
    await expect(page.locator('body')).toHaveClass(/is-pro-tier/);
    await page.evaluate(() => window._adminPreview.set(true));
    const bar = page.locator('#ap-freebar');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute('role', 'status');
    await expect(bar.locator('.ap-freebar-tx')).toHaveText('Previewing as Free');
    await expect(bar.locator('button')).toHaveText('Back to Pro');
    await expect(page.locator('body')).not.toHaveClass(/is-pro-tier/);
    const proLocks = page.locator('#page-setup .tile-title .pro-lock-pill.tier-free-only');   // the Pro locks a Free user sees on Home
    await expect(proLocks.first()).toBeVisible();
    await expect(page.locator('#topbar-quota-chip')).toContainText('15');
    expect(await page.evaluate(() => [...document.querySelectorAll('.sb-item.is-pro-only .sb-item-lock')].every((l) => l.offsetParent !== null))).toBe(true);
    // across the main area: right of the sidebar, under the top bar
    const r = await page.evaluate(() => {
      const b = document.getElementById('ap-freebar').getBoundingClientRect(), t = document.getElementById('app-topbar').getBoundingClientRect();
      const sb = document.getElementById('app-sidebar'); const s = sb ? sb.getBoundingClientRect() : { right: 0 };
      return { left: b.left, right: b.right, top: b.top, h: b.height, topbarBottom: t.bottom, sbRight: s.right, w: innerWidth };
    });
    expect(r.left).toBeGreaterThanOrEqual(r.sbRight);
    expect(r.top).toBeGreaterThanOrEqual(r.topbarBottom - 1);
    expect(r.h).toBeGreaterThanOrEqual(44);
    expect(r.w - r.right).toBeLessThan(40);
    // Back to Pro: the bar goes and the locks with it
    await bar.locator('button').click();
    await expect(bar).toBeHidden();
    await expect(page.locator('body')).toHaveClass(/is-pro-tier/);
    await expect(proLocks.first()).toBeHidden();
  });

  test('on() is false for a non-admin even with the flag', async ({ page }) => {
    await boot(page, PHONE, { [FLAG]: '1' });
    const r = await page.evaluate(() => {
      window._certanvilIsAdmin = false;
      const st = { tier: 'pro', daily_limit: -1, used_today: 0 };
      window._adminPreview.set(true);   // refused for a non-admin
      return { on: window._adminPreview.on(), same: window._adminPreview.wrap(st) === st, bar: !document.getElementById('ap-freebar') || document.getElementById('ap-freebar').hidden };
    });
    expect(r).toEqual({ on: false, same: true, bar: true });
  });

  test("wrap gives tier free, limit 15, used from today's history", async ({ page }) => {
    await boot(page, PHONE, { nplus_history: JSON.stringify(rows([5, 2], 10)) });
    await asAdmin(page);
    await page.evaluate(() => window._adminPreview.set(true));
    const w = await page.evaluate(() => ({ wrapped: window._adminPreview.wrap({ tier: 'pro', daily_limit: -1, used_today: 0 }), state: window._quotaState, on: window._adminPreview.on() }));
    expect(w.on).toBe(true);
    expect(w.wrapped).toEqual({ tier: 'free', daily_limit: 15, used_today: 7 });
    expect(w.state).toEqual({ tier: 'free', daily_limit: 15, used_today: 7 });
  });

  test('Back to Pro restores the Pro view without reload', async ({ page }) => {
    await boot(page, PHONE);
    await asAdmin(page);
    await page.evaluate(() => window._adminPreview.set(true));
    const bar = page.locator('#ap-freebar');
    await expect(bar).toBeVisible();
    await expect(bar.locator('.ap-freebar-tx')).toHaveText('Previewing as Free');
    const box = await bar.locator('button').boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.classList.contains('ap-free'))).toBe(true);
    await bar.locator('button').click();
    await expect(bar).toBeHidden();
    const r = await page.evaluate((k) => ({ flag: localStorage.getItem(k), q: window._quotaState, pro: document.body.classList.contains('is-pro-tier'), on: window._adminPreview.on(), same: window.__noReload === true, cls: document.documentElement.classList.contains('ap-free') }), FLAG);
    expect(r).toEqual({ flag: null, q: { tier: 'pro', daily_limit: -1, used_today: 0 }, pro: true, on: false, same: true, cls: false });
  });

  test('the flag survives a restart and takes effect once the account is known to be admin', async ({ page }) => {
    await boot(page, PHONE, { [FLAG]: '1' });
    await expect(page.locator('#ap-freebar')).toBeHidden();   // not admin yet
    await asAdmin(page);   // the profile lands: admin
    await expect(page.locator('#ap-freebar')).toBeVisible();
    expect(await page.evaluate(() => window._quotaState.tier)).toBe('free');
  });

  test('sign-out clears the flag', async ({ page }) => {
    await boot(page, PHONE);
    await asAdmin(page);
    await page.evaluate(() => window._adminPreview.set(true));
    await expect(page.locator('#ap-freebar')).toBeVisible();
    await page.evaluate(() => window.certanvilSupabase.auth.signOut());   // the real path: Supabase fires SIGNED_OUT, auth-state handles it
    await expect(page.locator('#ap-freebar')).toBeHidden();
    const r = await page.evaluate((k) => ({ flag: localStorage.getItem(k), admin: window._certanvilIsAdmin, on: window._adminPreview.on() }), FLAG);
    expect(r).toEqual({ flag: null, admin: false, on: false });
    // the next admin sign-in on this device starts on Pro
    await asAdmin(page);
    expect(await page.evaluate(() => window._quotaState.tier)).toBe('pro');
  });

  test('hub shows the Free view and Unlock row while previewing', async ({ page }) => {
    await boot(page, PHONE);
    await page.waitForFunction(() => typeof window.openHub === 'function' && !!document.querySelector('#ios-home [data-act="cert"]'));
    await asAdmin(page);
    await page.evaluate(() => { window._adminPreview.set(true); document.querySelector('#ios-home [data-act="cert"]').click(); });
    const hub = page.locator('#ios-hub');
    await expect(hub).toBeVisible();
    await expect(hub.locator('.ihb-locked')).toContainText('Unlock every cert with Pro');
    await expect(hub.locator('.ihb-sect b')).toHaveText(['Your cert', 'Other certs', 'More']);
    // the bar stays above the hub's own header, and Back to Pro stays reachable over it
    expect(await page.evaluate(() => document.getElementById('ap-freebar').inert)).toBe(false);
    const r = await page.evaluate(() => ({ bar: document.getElementById('ap-freebar').getBoundingClientRect().bottom, hdr: document.querySelector('#ios-hub .ihb-hdr').getBoundingClientRect().top + 12 }));
    expect(r.bar).toBeLessThanOrEqual(r.hdr);
    // Back to Pro redraws the open hub as Pro
    await page.locator('#ap-freebar button').click();
    await expect(hub.locator('.ihb-locked')).toHaveCount(0);
    await expect(hub.locator('.ihb-sect b').first()).toHaveText('My certs');
  });

  test('at 15 the Free block shows Keep going (admin preview), which starts a new 15 and lets the quiz start', async ({ page }) => {
    await boot(page, PHONE, { nplus_history: JSON.stringify(rows([10, 5], 3)) });
    await asAdmin(page);
    await page.evaluate(() => { window._adminPreview.set(true); window.__started = 0; window.startQuiz = () => { window.__started++; }; });
    expect(await page.evaluate(() => window._quotaState.used_today)).toBe(15);
    expect(await page.evaluate(() => _gateActivityForQuota('practice quizzes'))).toBe(false);
    const modal = page.locator('#quota-exceeded-modal');
    await expect(modal).toBeVisible();
    const keep = modal.locator('.ap-keep');
    await expect(keep).toHaveText('Keep going (admin preview)');
    const before = await page.evaluate(() => (document.querySelector('.page.active') || {}).id);
    await keep.click();
    await expect(modal).toHaveCount(0);
    // a new 15, and the admin stays where they were: nothing starts until they tap the entry again
    const r = await page.evaluate(() => ({ q: window._quotaState, started: window.__started, page: (document.querySelector('.page.active') || {}).id }));
    expect(r).toEqual({ q: { tier: 'free', daily_limit: 15, used_today: 0 }, started: 0, page: before });
    expect(await page.evaluate(() => _gateActivityForQuota('practice quizzes'))).toBe(true);
    await expect(modal).toHaveCount(0);
    // not offered to a real Free user, nor once the preview is off
    await page.evaluate(() => { window._adminPreview.set(false); window._quotaState = { tier: 'free', daily_limit: 15, used_today: 15 }; _gateActivityForQuota('practice quizzes'); });
    await expect(page.locator('#quota-exceeded-modal')).toBeVisible();
    await expect(page.locator('#quota-exceeded-modal .ap-keep')).toHaveCount(0);
  });

  test('Keep going from the exam simulator entry: the wall goes, the count restarts, nothing starts by itself', async ({ page }) => {
    await boot(page, PHONE, { nplus_history: JSON.stringify(rows([15], 0)) });
    await asAdmin(page);
    await page.evaluate(() => { window._adminPreview.set(true); window.__started = 0; window.startQuiz = window.startExam = () => { window.__started++; }; });
    expect(await page.evaluate(() => _gateActivityForQuota('exam simulator'))).toBe(false);
    await page.locator('#quota-exceeded-modal .ap-keep').click();
    await expect(page.locator('#quota-exceeded-modal')).toHaveCount(0);
    const r = await page.evaluate(() => ({ used: window._quotaState.used_today, started: window.__started, pass: _gateActivityForQuota('exam simulator') }));
    expect(r).toEqual({ used: 0, started: 0, pass: true });
  });

  test('a token refresh (renderSignedIn with role user, same account) keeps the preview and the Free state', async ({ page }) => {
    await boot(page, PHONE);
    await asAdmin(page);
    await page.evaluate(() => window._adminPreview.set(true));
    await expect(page.locator('#ap-freebar')).toBeVisible();
    await page.evaluate(() => { window.__flips = 0; new MutationObserver(() => { window.__flips++; }).observe(document.getElementById('ap-freebar'), { attributes: true, attributeFilter: ['hidden'] });
      window.certanvilAuthState.renderSignedIn({ id: 'u1', email: 'admin@example.com' }, { role: 'user' }); });
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => ({ on: window._adminPreview.on(), admin: window._certanvilIsAdmin, tier: window._quotaState.tier, flips: window.__flips, pro: document.body.classList.contains('is-pro-tier') }));
    expect(r).toEqual({ on: true, admin: true, tier: 'free', flips: 0, pro: false });
    await expect(page.locator('#ap-freebar')).toBeVisible();
  });

  test('390px: every sampled phone screen starts below the Free bar', async ({ page }) => {
    await boot(page, PHONE);
    await page.waitForFunction(() => typeof window.openHub === 'function' && !!document.querySelector('#ios-home [data-act="cert"]'));
    await asAdmin(page);
    await page.evaluate(() => window._adminPreview.set(true));
    await expect(page.locator('#ap-freebar')).toBeVisible();
    const barBottom = () => page.evaluate(() => document.getElementById('ap-freebar').getBoundingClientRect().bottom);
    const topOf = (sel) => page.evaluate((s) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top : null; }, sel);
    // Home
    expect(await topOf('#ios-home .ih-topbar button, #ios-home .ih-topbar [data-act]')).toBeGreaterThanOrEqual(await barBottom());
    // My certs hub and the log-result screen over it
    await page.evaluate(() => document.querySelector('#ios-home [data-act="cert"]').click());
    await expect(page.locator('#ios-hub')).toBeVisible();
    expect(await topOf('#ios-hub .ihb-hdr button')).toBeGreaterThanOrEqual(await barBottom());
    await page.locator('#ios-hub .ihb-logresult').click();
    await expect(page.locator('#ios-log-result')).toBeVisible();
    expect(await topOf('#ios-log-result .il-hdr button')).toBeGreaterThanOrEqual(await barBottom());
    await page.locator('#ios-log-result [data-act="back"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#ios-hub')).toBeHidden();
    // full-screen hosts that join through --ap-free-top: a drill-mistakes screen, the sign-in host, the check host, the limit popup
    const hosts = await page.evaluate(() => ['dm-screen', 'isi-host'].map((c) => { const d = document.createElement('div'); d.className = c; document.body.appendChild(d);
      const t = d.getBoundingClientRect().top; d.remove(); return t; }));
    hosts.forEach((t) => expect(t).toBeGreaterThanOrEqual(56));
    // in-flow pages: Drills and Settings
    for (const pg of ['drills', 'settings']) {
      await page.evaluate((p) => showPage(p), pg);
      await page.waitForTimeout(500);
      const t = await page.evaluate(() => { const act = document.querySelector('.page.active');
        const first = [...act.querySelectorAll('button, a, h1, h2')].find((b) => b.offsetParent && b.getBoundingClientRect().height > 0);
        return first ? first.getBoundingClientRect().top : null; });
      expect(t).not.toBeNull();
      expect(t).toBeGreaterThanOrEqual(await barBottom());
    }
    // off: the screens go back to the top
    await page.evaluate(() => window._adminPreview.set(false));
    const off = await page.evaluate(() => { const d = document.createElement('div'); d.className = 'dm-screen'; document.body.appendChild(d); const t = d.getBoundingClientRect().top; d.remove(); return t; });
    expect(off).toBe(0);
  });
});
