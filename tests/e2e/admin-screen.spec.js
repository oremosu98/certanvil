// Admin in the app, Task 8: the Admin screen (features/admin-screen.js). Phone: My certs → More → Admin, a full-screen
// overlay with bottom sheets. Desktop: a sidebar "Admin" item, two columns with Today across the top, centred dialogs.
// Drawing: mockups/cert-ios-admin.html (phone views and every ?v=desktop* view). Spec: 2026-10-31-admin-in-app-design.md.
// The data layer (window.adminData, Task 6) is the real module with its fetchers replaced by in-page fixtures, so the
// grouping and first-line helpers under test are the shipped ones. localhost only.
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 820 };
const XSS = '<img src=x onerror=alert(1)>';

async function boot(page, size) {
  await page.setViewportSize(size);
  const seed = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' };
  await page.addInitScript((sd) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, seed);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.openAdmin === 'function' && !!window._adminPreview && document.body.classList.contains('is-state-resolved'));
  await page.waitForTimeout(300);   // the signed-out quota reset lands before the admin state below
}

// The real data module, with every network read replaced by fixtures. opts.fail: section names that answer ok:false.
async function stub(page, opts) {
  await page.evaluate(async (o) => {
    o = o || {};
    const real = await _loadFeature('admin-data');
    const fail = new Set(o.fail || []);
    const now = Date.now(), H = 3600000;
    const iso = (h) => new Date(now - h * H).toISOString();
    // 12 reports from the same screen + cert + version (9 signed in), one signed out, one hostile title, then filler
    const reps = [];
    for (let i = 0; i < 12; i++) reps.push({ id: 200 - i, created_at: iso(1 + i), title: 'Next does nothing ' + i, description: 'Tapped Next, nothing.', steps: i === 0 ? '1. Start a quiz\n2. Tap Next' : null, status: 'open',
      context: { page: 'Quiz', cert: 'Security+', version: '8.203.2', theme: 'dark' }, user_id: i < 9 ? 'u' + i : null, fixed_notified_at: null });
    reps.push({ id: 131, created_at: iso(30), title: 'The timer kept going while I was on a call', description: 'Paused, took a call.', steps: null, status: 'open',
      context: { page: 'Exam', cert: 'Network+', version: '8.202.0', theme: 'light' }, user_id: null, fixed_notified_at: null });
    reps.push({ id: 130, created_at: iso(40), title: o.xss, description: o.xss, steps: o.xss, status: 'open',
      context: { page: o.xss, cert: 'Network+', version: '8.201.0', theme: 'dark' }, user_id: 'u-x', fixed_notified_at: null });
    for (let i = 0; i < 26; i++) reps.push({ id: 100 - i, created_at: iso(50 + i), title: 'Filler ' + i, description: 'x', steps: null, status: 'open',
      context: { page: 'Home', cert: 'AZ-900', version: '8.200.' + i, theme: 'dark' }, user_id: null, fixed_notified_at: null });
    if (o.hostileFirst) reps.unshift({ id: 300, created_at: iso(0.1), title: o.xss, description: o.xss, steps: null, status: 'open', context: { page: 'Quiz', cert: 'Security+', version: '9' }, user_id: null, fixed_notified_at: null });
    const reqs = [];
    for (let i = 0; i < 32; i++) reqs.push({ exam_key: 'k' + i, label: i === 0 ? 'Cisco CCNA' : i === 1 ? o.xss : 'Exam ' + i, votes: 40 - i, new_7d: i % 3 === 0 ? 1 : 0, last_at: iso(24 * (i + 1)), typed: i === 3, pending: 40 - i, labels: [] });
    window.__adminCalls = [];
    const log = (name, args) => { window.__adminCalls.push({ name, args }); };
    const answer = (name, data) => fail.has(name) ? { ok: false, error: 'boom' } : { ok: true, data };
    real.today = async () => { log('today'); return answer('today', { users: { total: 8, new7: 1, active7: 3 }, errors: 4, ai: { used: 212, limit: 614, resetsAt: null }, partial: [] }); };
    real.requests = async (q) => { log('requests', q); const p = (q && q.page) || 0; return answer('requests', { rows: reqs.slice(p * 20, p * 20 + 20), page: p, more: reqs.length > p * 20 + 20 }); };
    real.requestTotals = async () => { log('requestTotals'); return answer('requests', { exams: 32, votes: 118 }); };
    real.reports = async (q) => { log('reports', q); const p = (q && q.page) || 0; return answer('reports', { rows: reps.slice(p * 20, p * 20 + 20), page: p, more: reps.length > p * 20 + 20 }); };
    real.openCount = async () => { log('openCount'); return answer('reports', 47); };
    real.errorsWeek = async () => { log('errorsWeek'); return answer('errors', { top: [{ message: "TypeError: Cannot read properties of undefined (reading 'score')", count: 12, lastVersion: '8.203.0' }, { message: o.xss, count: 3, lastVersion: '8.202.0' }], capped: true, sample: 500 }); };
    real.reporterEmail = async (uid) => { log('reporterEmail', uid); return { ok: true, data: uid === 'u0' ? 'alex@example.com' : null }; };
    real.act = async (action, ids) => { log('act', { action, ids }); return { ok: true, data: { closed: ids.length, sent: action === 'fixed' ? 9 : 0, skipped: 0, failed: 0, remaining: 0, next: null, paused: false } }; };
  }, Object.assign({ xss: XSS }, opts || {}));
}

async function asAdmin(page) {
  await page.evaluate(() => {
    window._quotaState = { tier: 'pro', daily_limit: -1, used_today: 0 };
    _renderQuotaChip();
    window._certanvilIsAdmin = true;
  });
}

async function openPhone(page, opts) {
  await boot(page, PHONE);
  await stub(page, opts);
  await asAdmin(page);
  await page.evaluate(() => window.openAdmin());
  const adm = page.locator('#ios-admin');
  await expect(adm).toBeVisible();
  return adm;
}

test.describe('Admin screen', () => {
  test('desktop: the Admin sidebar item shows only for the admin, with the count, and opens two columns with Today across the top', async ({ page }) => {
    await boot(page, DESKTOP);
    await stub(page);
    const item = page.locator('#app-sidebar .sb-item[data-sb-page="admin"]');
    await expect(item).toHaveCount(0);
    expect(await page.evaluate(() => window.openAdmin())).toBe(false);
    await asAdmin(page);
    await expect(item).toBeVisible();
    await expect(item.locator('.sb-item-n')).toHaveText('47');
    await item.click();
    const host = page.locator('#desk-admin');
    await expect(page.locator('#page-admin')).toHaveClass(/active/);
    await expect(host.locator('h1')).toHaveText('Admin');
    await expect(host.locator('section[aria-labelledby]')).toHaveCount(5);
    const today = host.locator('section[aria-labelledby="adm-s-today"]');
    await expect(today.locator('.adm-stat b').first()).toHaveText('8');
    const r = await page.evaluate(() => {
      const box = (s) => document.querySelector('#desk-admin section[aria-labelledby="' + s + '"]').getBoundingClientRect();
      return { today: box('adm-s-today'), req: box('adm-s-req'), rep: box('adm-s-rep') };
    });
    expect(r.req.top).toBeGreaterThan(r.today.bottom - 1);                 // Today across the top
    expect(Math.abs(r.req.top - r.rep.top)).toBeLessThan(2);                // requests and reports side by side
    expect(r.rep.left).toBeGreaterThan(r.req.right);
    expect(r.today.width).toBeGreaterThan(r.req.width * 1.8);
    // the admin flag going away takes the item with it
    await page.evaluate(() => { window._certanvilIsAdmin = false; });
    await expect(item).toHaveCount(0);
  });

  test('desktop: a report opens as a centred dialog; Escape closes it', async ({ page }) => {
    await boot(page, DESKTOP);
    await stub(page);
    await asAdmin(page);
    await page.evaluate(() => window.openAdmin());
    const row = page.locator('#desk-admin [data-rep]').first();
    await row.click();
    const dlg = page.locator('#adm-sheet');
    await expect(dlg).toBeVisible();
    await expect(dlg).toHaveClass(/is-dialog/);
    await expect(dlg.locator('.adm-sh-eyebrow')).toHaveText('Bug report #200');
    const b = await dlg.boundingBox();
    expect(Math.abs(b.x + b.width / 2 - DESKTOP.width / 2)).toBeLessThan(4);
    expect(Math.abs(b.y + b.height / 2 - DESKTOP.height / 2)).toBeLessThan(4);
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    await expect(page.locator('#page-admin')).toHaveClass(/active/);
  });

  test('desktop: See all reports replaces the main view with a back arrow', async ({ page }) => {
    await boot(page, DESKTOP);
    await stub(page);
    await asAdmin(page);
    await page.evaluate(() => window.openAdmin());
    const host = page.locator('#desk-admin');
    await expect(host.locator('.adm-back')).toBeHidden();
    await host.locator('[data-act="all-reports"]').click();
    await expect(host.locator('h1')).toHaveText('Bug reports');
    await expect(host.locator('section[aria-labelledby="adm-s-today"]')).toHaveCount(0);
    await expect(host.locator('.adm-search input')).toBeVisible();
    await expect(host.locator('.adm-back')).toBeVisible();
    await host.locator('.adm-back').click();
    await expect(host.locator('h1')).toHaveText('Admin');
    await expect(host.locator('section[aria-labelledby="adm-s-today"]')).toHaveCount(1);
  });

  test('admin row shows only for the admin, with "N open"', async ({ page }) => {
    await boot(page, PHONE);
    await stub(page);
    await page.evaluate(() => window.openHub());
    const hub = page.locator('#ios-hub');
    await expect(hub).toBeVisible();
    await expect(hub.locator('[data-act="admin"]')).toHaveCount(0);
    await page.evaluate(() => window.iosHub.close());
    await asAdmin(page);
    await page.evaluate(() => window.openHub());
    const link = hub.locator('[data-act="admin"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Requests, bug reports, errors');
    await expect(link.locator('.ihb-count-pill')).toHaveText('47 open');
    await expect(link).toHaveAttribute('aria-label', 'Admin, 47 open bug reports');
    await link.click();
    await expect(page.locator('#ios-admin')).toBeVisible();
    await expect(page.locator('#ios-admin .adm-back')).toHaveAttribute('aria-label', 'Back to My certs');
  });

  test('Admin shows at most 3 reports and 5 requests with See all counts', async ({ page }) => {
    const adm = await openPhone(page);
    const req = adm.locator('section[aria-labelledby="adm-s-req"]');
    const rep = adm.locator('section[aria-labelledby="adm-s-rep"]');
    await expect(req.locator('[data-req]')).toHaveCount(5);
    await expect(req.locator('.adm-count')).toHaveText('32 exams · 118 votes');
    await expect(req.locator('[data-act="all-requests"]')).toHaveText('See all 32 exams');
    await expect(rep.locator('[data-rep]')).toHaveCount(3);
    await expect(rep.locator('.adm-count')).toHaveText('47 open');
    await expect(rep.locator('[data-act="all-reports"]')).toHaveText('See all 47 open');
    await expect(adm.locator('section[aria-labelledby="adm-s-err"] .adm-row')).toHaveCount(2);
    await expect(adm.locator('section[aria-labelledby="adm-s-err"] .adm-note')).toHaveText('Based on the latest 500 errors.');
    await expect(adm.locator('#adm-free-sw')).toHaveAttribute('aria-checked', 'false');
    // tap a request: the inline confirm, in place
    await req.locator('[data-req]').first().click();
    await expect(req.locator('.adm-confirm')).toContainText('Email the 40 people who asked for Cisco CCNA');
    await expect(req.locator('.adm-confirm .adm-btn-pri')).toHaveText('Send 40 emails');
  });

  test('See all reports: chip and search change the query; Show 20 more appends the next page', async ({ page }) => {
    const adm = await openPhone(page);
    await adm.locator('[data-act="all-reports"]').click();
    await expect(adm.locator('.adm-h1')).toHaveText('Bug reports');
    const chip = (t) => adm.locator('.adm-chip', { hasText: t });
    await expect(chip('Open')).toHaveAttribute('aria-pressed', 'true');
    const rows = adm.locator('.adm-list [data-grp], .adm-list [data-rep]');
    const before = await rows.count();
    await chip('Can hear back').click();
    await expect(chip('Can hear back')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => { const c = window.__adminCalls.filter((x) => x.name === 'reports').pop(); return c && c.args.canHear; })).toBe(true);
    await adm.locator('.adm-search input').fill('timer');
    await expect.poll(() => page.evaluate(() => { const c = window.__adminCalls.filter((x) => x.name === 'reports').pop(); return c && c.args.q; })).toBe('timer');
    await adm.locator('.adm-search input').fill('');
    await chip('Can hear back').click();
    await expect.poll(() => page.evaluate(() => { const c = window.__adminCalls.filter((x) => x.name === 'reports').pop(); return c && !c.args.canHear && !c.args.q; })).toBe(true);
    await expect(rows).toHaveCount(before);
    await adm.locator('.adm-more').click();
    await expect.poll(() => page.evaluate(() => { const c = window.__adminCalls.filter((x) => x.name === 'reports').pop(); return c && c.args.page; })).toBe(1);
    await expect.poll(() => rows.count()).toBeGreaterThan(before);
  });

  test("a group of 12 with 9 reachable: Fixed, tell all 9 asks once, then calls act('fixed', 12 ids) and closes", async ({ page }) => {
    const adm = await openPhone(page);
    await adm.locator('[data-act="all-reports"]').click();
    const g = adm.locator('[data-grp]').first();
    await expect(g.locator('.adm-grp')).toHaveText('12');
    await expect(g.locator('.adm-cue')).toHaveText('9 can hear back');
    await g.click();
    const sh = page.locator('#adm-sheet');
    await expect(sh).toBeVisible();
    await expect(sh.locator('.adm-sh-eyebrow')).toHaveText('12 reports');
    await expect(sh.locator('.adm-sh-title')).toHaveText('Quiz · Security+');
    await expect(sh.locator('.adm-reach')).toContainText('9 of 12 can hear back when it’s fixed.');
    await sh.locator('[data-act="g-tell"]').click();
    expect(await page.evaluate(() => window.__adminCalls.filter((x) => x.name === 'act').length)).toBe(0);   // asks first
    await expect(sh.locator('.adm-sh-confirm')).toContainText('Emails 9 people');
    await expect(sh.locator('[data-act="g-send"]')).toHaveText('Send 9 emails and close');
    await sh.locator('[data-act="g-send"]').click();
    await expect(sh).toBeHidden();
    const acts = await page.evaluate(() => window.__adminCalls.filter((x) => x.name === 'act').map((x) => x.args));
    expect(acts).toHaveLength(1);
    expect(acts[0].action).toBe('fixed');
    expect(acts[0].ids).toEqual([200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 190, 189]);
    await expect(page.locator('#adm-toast')).toContainText('Sent 9 emails. 12 reports closed.');
  });

  test('a report from a signed-out person only offers Close, no email', async ({ page }) => {
    const adm = await openPhone(page);
    await adm.locator('[data-act="all-reports"]').click();
    await adm.locator('[data-rep="131"]').click();
    const sh = page.locator('#adm-sheet');
    await expect(sh).toBeVisible();
    await expect(sh.locator('.adm-reach')).toHaveText('Sent while signed out, so there’s no one to email.');
    await expect(sh.locator('.adm-sh-foot button')).toHaveText(['Close, no email']);
    await sh.locator('[data-act="r-close"]').click();
    await expect(sh).toBeHidden();
    expect(await page.evaluate(() => window.__adminCalls.filter((x) => x.name === 'act').map((x) => x.args))).toEqual([{ action: 'close', ids: [131] }]);
    await expect(page.locator('#adm-toast')).toContainText('Report #131 closed');
  });

  test("a title '<img src=x onerror=alert(1)>' renders as text", async ({ page }) => {
    let dialogs = 0;
    page.on('dialog', (d) => { dialogs++; d.dismiss(); });
    const adm = await openPhone(page, { hostileFirst: true });
    const rep = adm.locator('section[aria-labelledby="adm-s-rep"]');
    await expect(rep.locator('[data-rep] .adm-t').first()).toHaveText(XSS);
    await expect(adm.locator('section[aria-labelledby="adm-s-req"] [data-req] .adm-t').nth(1)).toHaveText(XSS);
    await expect(adm.locator('section[aria-labelledby="adm-s-err"] .adm-t').nth(1)).toHaveText(XSS);
    await adm.locator('[data-act="all-reports"]').click();
    await adm.locator('[data-rep="130"]').click();
    const sh = page.locator('#adm-sheet');
    await expect(sh.locator('.adm-sh-title')).toHaveText(XSS);
    await expect(sh.locator('.adm-sh-p').first()).toHaveText(XSS);
    expect(await page.locator('#ios-admin img, #adm-sheet img').count()).toBe(0);
    expect(dialogs).toBe(0);
  });

  test('bug reports failing shows Retry while Today and Requests still render', async ({ page }) => {
    const adm = await openPhone(page, { fail: ['reports'] });
    const rep = adm.locator('section[aria-labelledby="adm-s-rep"]');
    await expect(rep.locator('.adm-state p')).toHaveText('Couldn’t load this.');
    await expect(rep.locator('.adm-state button')).toHaveText('Retry');
    await expect(adm.locator('section[aria-labelledby="adm-s-today"] .adm-stat b').first()).toHaveText('8');
    await expect(adm.locator('section[aria-labelledby="adm-s-req"] [data-req]')).toHaveCount(5);
    // Retry reloads that section only
    await page.evaluate(() => { window.__adminCalls.length = 0; const d = window.adminData; d.reports = async () => ({ ok: true, data: { rows: [], page: 0, more: false } }); d.openCount = async () => ({ ok: true, data: 0 }); });
    await rep.locator('.adm-state button').click();
    await expect(rep.locator('.adm-state p')).toHaveText('No open reports. New ones show up here and in Monday’s email.');
    expect(await page.evaluate(() => window.__adminCalls.some((x) => x.name === 'today' || x.name === 'requests'))).toBe(false);
  });

  test('offline shows "You\'re offline"', async ({ page, context }) => {
    await boot(page, PHONE);
    await stub(page);
    await asAdmin(page);
    await context.setOffline(true);
    await page.evaluate(() => window.openAdmin());
    const adm = page.locator('#ios-admin');
    await expect(adm.locator('.adm-offline h2')).toHaveText('You’re offline');
    await expect(adm.locator('.adm-offline p')).toHaveText('Admin needs a connection. Your studying still works.');
    await expect(adm.locator('section[aria-labelledby]')).toHaveCount(0);
    await context.setOffline(false);
    await adm.locator('.adm-offline button').click();
    await expect(adm.locator('section[aria-labelledby="adm-s-today"]')).toHaveCount(1);
  });

  test('Escape closes the sheet first, then Admin', async ({ page }) => {
    await boot(page, PHONE);
    await stub(page);
    await asAdmin(page);
    await page.evaluate(() => window.openHub());
    await page.locator('#ios-hub [data-act="admin"]').click();
    const adm = page.locator('#ios-admin');
    await expect(adm).toBeVisible();
    await adm.locator('section[aria-labelledby="adm-s-rep"] [data-rep]').first().click();
    const sh = page.locator('#adm-sheet');
    await expect(sh).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sh).toBeHidden();
    await expect(adm).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(adm).toBeHidden();
    await expect(page.locator('#ios-hub')).toBeVisible();   // back to My certs, still open
    await expect(page.locator('#ios-hub [data-act="admin"]')).toBeFocused();
  });
});
