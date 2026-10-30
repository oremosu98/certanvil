// Lift B4 (v8.193.0): Settings on phones (the Account tab), against cert-ios-settings.html. Signed-in states load
// tests/fixtures/fake-supabase.js in place of lib/supabase.js (as scripts/lift-sbs.js does); no network.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const FAKE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'fake-supabase.js'), 'utf8');

// signed: false (anonymous) | true (fake session). tier: 'free' | 'pro' (pinned after load; signed-out apps reset it).
async function boot(page, viewport, opts) {
  opts = opts || {};
  await page.setViewportSize(viewport);
  if (opts.signed) {
    await page.route('**/lib/supabase.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: 'window.__FAKE_SB={"role":"user"};' + FAKE }));
  }
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1'); localStorage.setItem('ca_tour_seen', '1'); } catch (_) {}
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  if (opts.signed) await page.waitForFunction(() => window._certanvilSignedIn === true, null, { timeout: 10000 });
  await page.waitForTimeout(600);
}
async function setTier(page, tier) {
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro', used_today: 0, daily_limit: -1 } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
  }, tier);
}
// Opens the Account tab the way a person does (the tab bar on phones, showPage on desktop).
async function openSettings(page, vp, opts) {
  await boot(page, vp, opts);
  if (opts && opts.tier) await setTier(page, opts.tier);
  if (vp.width < 900) await page.locator('#lift-tabbar .lift-tab[data-page="settings"]').click();
  else await page.evaluate(() => showPage('settings'));
  await expect(page.locator('#page-settings')).toHaveClass(/active/, { timeout: 10000 });
  await page.waitForTimeout(300);
}
module.exports = { boot, setTier, openSettings };

for (const vp of PHONES) {
  test.describe('Lift B4 page @' + vp.width, () => {
    test('signed out: the account card, Pass Plan CTA, tab bar, no top bar, no Sign out', async ({ page }) => {
      await openSettings(page, vp, { tier: 'free' });
      const R = page.locator('#ios-settings');
      await expect(page.locator('#page-settings')).toHaveClass(/ist-on/);
      await expect(R.locator('.ist-acct h2')).toHaveText('Sign in to keep your progress');
      await expect(R.locator('[data-act="signin"]')).toBeVisible();
      await expect(R.locator('[data-act="signout"], [data-act="delete"]')).toHaveCount(0);
      await expect(R.locator('.ist-pp')).not.toBeEmpty();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await expect(page.locator('#app-topbar')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
    test('free signed in: email, Free, Cert row, one Go Pro row, free lines', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'free' });
      await page.evaluate(() => renderSettingsPage());
      const R = page.locator('#ios-settings');
      await expect(R.locator('.ist-em')).toContainText('simi.test@example.test', { timeout: 5000 });
      await expect(R.locator('.ist-plan')).toHaveText('Free');
      await expect(R.locator('[data-act="cert"]')).toBeVisible();
      await expect(R.locator('.ist-row[data-act="gopro"]')).toHaveCount(1);
      await expect(R).toContainText('Free is fixed at 15 questions a day');
      await expect(R.locator('[data-act="signout"]')).toBeVisible();
    });
    test('Pro: Pro pill, presets, review sizes, top-up switch', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => renderSettingsPage());
      const R = page.locator('#ios-settings');
      await expect(R.locator('.ist-plan')).toHaveText('Pro');
      await expect(R.locator('[data-act="goal-pick"]')).toHaveCount(4);
      await expect(R.locator('[data-act="review-pick"]')).toHaveCount(4);
      await expect(R.locator('[data-act="topup"]')).toBeVisible();
      await expect(R.locator('[data-act="gopro"]')).toHaveCount(0);
    });
    test('the Pass Plan card reads like the drawing: no duplicate heading, a full-width CTA, small chip locks, one Go Pro', async ({ page }) => {
      await openSettings(page, vp, { tier: 'free' });
      const pp = page.locator('#ios-settings .ist-pp');
      await expect(pp.locator('[data-act="pp-empty"]')).toBeVisible({ timeout: 8000 });
      const m = await pp.evaluate((el) => {
        const btn = el.querySelector('[data-act="pp-empty"]').getBoundingClientRect(), card = el.getBoundingClientRect();
        const locks = Array.from(el.querySelectorAll('.cert-chip svg')).map((x) => x.getBoundingClientRect().height);
        const vis = (sel) => { const n = el.querySelector(sel); return !!(n && n.offsetParent); };
        return { wide: btn.width > card.width * 0.8, tall: btn.height >= 44, maxLock: Math.max.apply(null, locks.concat([0])), sub: vis('.sub-label'), pitch: vis('.locked-sub'), pro: vis('[data-act="pp-pro"]'),
          h: getComputedStyle(el.querySelector('.pp-empty-h')).fontFamily };
      });
      expect(m).toEqual(expect.objectContaining({ wide: true, tall: true, sub: false, pitch: false, pro: false }));
      expect(m.maxLock).toBeLessThanOrEqual(12);
      expect(m.h).toMatch(/Fraunces/);
    });
    test("today's sections and the reports panel are hidden beside the phone page", async ({ page }) => {
      await openSettings(page, vp, { tier: 'free' });
      await expect(page.locator('#page-settings .settings-layout')).toBeHidden();
      await expect(page.locator('#settings-reports-section')).toBeHidden();
    });
  });
}

for (const vp of PHONES) {
  test.describe('Lift B4 study setup and account @' + vp.width, () => {
    const R = (page) => page.locator('#ios-settings');
    test('Pro: picking 50 and Save sets the goal; the glance row follows', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => renderSettingsPage());
      await R(page).locator('[data-act="goal-pick"][data-n="50"]').click();
      await expect(R(page).locator('[data-act="goal-pick"][data-n="50"]')).toHaveAttribute('aria-pressed', 'true');
      await R(page).locator('[data-act="goal-save"]').click();
      await expect.poll(() => page.evaluate(() => getDailyGoal())).toBe(50);
      await expect(R(page).locator('.ist-row', { hasText: 'Daily goal' })).toContainText('50 a day');
    });
    test('Pro: All due and the top-up switch persist', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => renderSettingsPage());
      await R(page).locator('[data-act="review-pick"][data-n="10"]').click();
      await expect.poll(() => page.evaluate(() => loadSrPrefs().sessionSize)).toBe(10);
      await R(page).locator('[data-act="review-pick"][data-n="all"]').click();
      await expect.poll(() => page.evaluate(() => loadSrPrefs().sessionSize)).toBe('all');
      const before = await page.evaluate(() => !!loadSrPrefs().topUp);
      await R(page).locator('[data-act="topup"]').click();
      await expect.poll(() => page.evaluate(() => !!loadSrPrefs().topUp)).toBe(!before);
      await expect(R(page).locator('[data-act="topup"]')).toHaveAttribute('aria-pressed', String(!before));
    });
    test("free: goal and review are fixed; Go Pro opens today's pricing page", async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'free' });
      await page.evaluate(() => { renderSettingsPage(); window.__opened = []; window.open = function (u) { window.__opened.push(u); return null; }; });
      await expect(R(page).locator('[data-act="goal-pick"], [data-act="review-pick"]')).toHaveCount(0);
      await R(page).locator('.ist-row[data-act="gopro"]').click();
      expect(await page.evaluate(() => window.__opened)).toEqual(['https://certanvil.com/pricing']);
    });
    test('exam date: the sheet saves the 14th of next month, then Remove clears it', async ({ page }) => {
      await openSettings(page, vp, { tier: 'free' });
      const iso = await page.evaluate(() => { const d = new Date(); const n = new Date(d.getFullYear(), d.getMonth() + 1, 14); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-14'; });
      await R(page).locator('[data-act="exam"]').click();
      const sheet = page.locator('#ist-sheet');
      await expect(sheet).toHaveClass(/open/);
      await sheet.locator('[data-act="cal-next"]').click();
      await sheet.locator('[data-iso="' + iso + '"]').click();
      await expect(sheet.locator('[data-act="cal-save"]')).toContainText('Save 14 ');
      await sheet.locator('[data-act="cal-save"]').click();
      await expect.poll(() => page.evaluate(() => getExamDate())).toBe(iso);
      await expect(sheet).toBeHidden();
      await R(page).locator('[data-act="exam"]').click();
      await sheet.locator('[data-act="cal-remove"]').click();
      await expect.poll(() => page.evaluate(() => getExamDate() || '')).toBe('');
      await expect(R(page).locator('.ist-row', { hasText: 'Exam date' })).toContainText('Not set');
    });
    test("cert sheet: free sees Pro tags; picking a Pro cert closes the sheet then calls today's switch; the active cert does nothing", async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'free' });
      await page.evaluate(() => { renderSettingsPage(); window.__sw = []; window.tadSwitchCert = function (id) { window.__sw.push([id, document.getElementById('ist-sheet').classList.contains('open')]); return false; }; });
      await R(page).locator('[data-act="cert"]').click();
      const sheet = page.locator('#ist-sheet');
      await expect(sheet.locator('.ist-cert')).toHaveCount(8);
      await expect(sheet.locator('.ist-pro-tag')).toHaveCount(7);
      await expect(sheet.locator('.ist-cert.on')).toHaveCount(1);
      await sheet.locator('[data-act="pick-cert"][data-id="secplus"]').click();
      expect(await page.evaluate(() => window.__sw)).toEqual([['secplus', false]]);
    });
    test("Sign out goes through today's handler and the row clears nothing itself", async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => {
        renderSettingsPage(); window.__so = 0; window.__keys = localStorage.length;
        document.getElementById('topbar-signout-link').addEventListener('click', function (e) { window.__so++; e.stopImmediatePropagation(); e.preventDefault(); }, true);
      });
      await R(page).locator('[data-act="signout"]').click();
      expect(await page.evaluate(() => [window.__so, localStorage.length === window.__keys])).toEqual([1, true]);
    });
    test('the reveal plays once; a pick repaints still', async ({ page }) => {
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => renderSettingsPage());
      await page.waitForTimeout(800);
      await R(page).locator('[data-act="goal-pick"][data-n="20"]').click();
      await expect(R(page).locator('[data-act="goal-pick"][data-n="20"]')).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => Array.from(document.querySelectorAll('#ios-settings .reveal')).reduce((n, el) => n + el.getAnimations().length, 0))).toBe(0);
    });
  });
}

for (const vp of PHONES) {
  test.describe('Lift B4 data and danger zone @' + vp.width, () => {
    const R = (page) => page.locator('#ios-settings');
    const dialogs = (page) => { const d = []; page.on('dialog', (x) => { d.push(x.message()); x.dismiss().catch(() => {}); }); return d; };
    const ask = (page) => page.locator('#exam-sheet');
    test('Clear wrong answers asks in the sheet; Keep them keeps, Clear them clears', async ({ page }) => {
      const d = dialogs(page);
      await openSettings(page, vp, { tier: 'free' });
      await page.evaluate(() => { saveWrongBank(Array.from({ length: 9 }, (_, i) => ({ question: 'Missed ' + i + '?', topic: 'OSPF' }))); renderSettingsPage(); });
      await R(page).locator('[data-act="clear"]').click();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Clear 9 wrong answers?');
      await ask(page).locator('.ix-sheet-stay').click();
      expect(await page.evaluate(() => loadWrongBank().length)).toBe(9);
      await R(page).locator('[data-act="clear"]').click();
      await ask(page).locator('.ix-sheet-go').click();
      await expect.poll(() => page.evaluate(() => loadWrongBank().length)).toBe(0);
      await expect(R(page).locator('[data-act="clear"] .ist-rv')).toHaveText('0');
      expect(d).toEqual([]);
    });
    test('Restore asks once, then restores confirmed', async ({ page }) => {
      const d = dialogs(page);
      await openSettings(page, vp, { tier: 'free' });
      await page.evaluate(() => { window._takeAutoBackup(); renderSettingsPage(); window.__rs = []; window.restoreFromAutoBackup = function (k, o) { window.__rs.push([k, o]); return true; }; });
      await R(page).locator('[data-act="restore"]').first().click();
      await expect(page.locator('#exam-sheet-title')).toHaveText(/^Restore .+\?$/);
      await expect(ask(page)).toContainText('Today is saved first, so you can undo it.');
      await ask(page).locator('.ix-sheet-go').click();
      const rs = await page.evaluate(() => window.__rs);
      expect(rs.length).toBe(1); expect(rs[0][1]).toEqual({ confirmed: true });
      expect(d).toEqual([]);
    });
    test('Import: a bad file toasts, a good one asks then merges', async ({ page }) => {
      const d = dialogs(page);
      await openSettings(page, vp, { tier: 'free' });
      const input = page.locator('#import-file-input');
      await input.setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('not json') });
      await expect(page.getByText('Couldn’t read that file.')).toBeVisible();
      await input.setInputFiles({ name: 'y.json', mimeType: 'application/json', buffer: Buffer.from('{"x":1}') });
      await expect(page.getByText('That isn’t a CertAnvil backup file.')).toBeVisible();
      const good = { history: [{ date: '2026-01-02T10:00:00.000Z', topic: 'OSPF', score: 7, total: 10, pct: 70, difficulty: 'Exam Level' }] };
      await input.setInputFiles({ name: 'z.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(good)) });
      await expect(page.locator('#exam-sheet-title')).toHaveText('Import 1 history entries?');
      await ask(page).locator('.ix-sheet-go').click();
      await expect.poll(() => page.evaluate(() => loadHistory().some((h) => h.date === '2026-01-02T10:00:00.000Z'))).toBe(true);
      await expect(page.getByText(/Imported 1 new entr/)).toBeVisible();
      expect(d).toEqual([]);
    });
    test('Start the diagnostic asks in the sheet; Start opens it without a second ask', async ({ page }) => {
      const d = dialogs(page);
      await openSettings(page, vp, { tier: 'free' });
      await page.evaluate(() => { window.__sd = []; window.startDiagnostic = function (o) { window.__sd.push(o || null); }; });
      await expect(R(page).locator('.ist-pp [data-act="pp-empty"]').first()).toBeVisible({ timeout: 8000 });
      await R(page).locator('.ist-pp [data-act="pp-empty"]').first().click();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Take the baseline diagnostic?');
      await ask(page).locator('.ix-sheet-stay').click();
      expect(await page.evaluate(() => window.__sd)).toEqual([]);
      await R(page).locator('.ist-pp [data-act="pp-empty"]').first().click();
      await ask(page).locator('.ix-sheet-go').click();
      expect(await page.evaluate(() => window.__sd)).toEqual([{ skipConfirm: true }]);
      expect(d).toEqual([]);
    });
    test('Retake inside the cooldown asks; Keep my plan stays', async ({ page }) => {
      const d = dialogs(page);
      await openSettings(page, vp, { tier: 'free' });
      await page.evaluate(() => {
        window._retakeAgoDays = function () { return 3; }; window.__rt = []; window.retakeDiagnostic = function (o) { window.__rt.push(o || null); };
        document.querySelector('#ios-settings .ist-pp').insertAdjacentHTML('beforeend', '<button type="button" data-act="pp-retake" id="__rtb">Retake</button>');
      });
      await page.locator('#__rtb').click();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Retake the diagnostic?');
      await expect(ask(page)).toContainText('Your last one was 3 days ago.');
      await ask(page).locator('.ix-sheet-stay').click();
      expect(await page.evaluate(() => window.__rt)).toEqual([]);
      await page.locator('#__rtb').click();
      await ask(page).locator('.ix-sheet-go').click();
      expect(await page.evaluate(() => window.__rt)).toEqual([{ skipConfirm: true }]);
      expect(d).toEqual([]);
    });
    test("Delete account opens today's confirm; the typed email enables it", async ({ page }) => {
      const d = dialogs(page);
      await openSettings(page, vp, { signed: true, tier: 'pro' });
      await page.evaluate(() => renderSettingsPage());
      await R(page).locator('[data-act="delete"]').click();
      const m = page.locator('#delete-account-modal');
      await expect(m).toBeVisible({ timeout: 5000 });
      await expect(m.locator('#dla-confirm')).toBeDisabled();
      await m.locator('#dla-email').fill('simi.test@example.test');
      await expect(m.locator('#dla-confirm')).toBeEnabled();
      const box = await m.locator('.dla-card').boundingBox();
      expect(box.width).toBeLessThanOrEqual(vp.width);
      expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(vp.height - 2);   // a bottom sheet, as drawn
      expect(d).toEqual([]);
    });
  });
}

test.describe('Lift B4 repaints', () => {
  const vp = PHONES[1];
  const R = (page) => page.locator('#ios-settings');
  test('the card follows a sign-out and a sign-in with Settings open', async ({ page }) => {
    await openSettings(page, vp, { signed: true, tier: 'pro' });
    await page.evaluate(() => renderSettingsPage());
    await expect(R(page).locator('.ist-em')).toContainText('simi.test@example.test', { timeout: 5000 });
    await page.evaluate(() => window.__fakeEmit('SIGNED_OUT'));
    await expect(R(page).locator('.ist-acct h2')).toHaveText('Sign in to keep your progress', { timeout: 5000 });
    await expect(R(page).locator('[data-act="signout"]')).toHaveCount(0);
    await page.evaluate(() => window.__fakeEmit('SIGNED_IN'));
    await expect(R(page).locator('[data-act="signout"]')).toBeVisible({ timeout: 5000 });
  });
  test('a Pro tier that arrives late repaints the free bits away', async ({ page }) => {
    await openSettings(page, vp, { tier: 'free' });
    await expect(R(page).locator('[data-act="gopro"]').first()).toBeAttached();
    await setTier(page, 'pro');
    await page.evaluate(() => renderGauntletDrillsCard());   // app.js runs this when _quotaState hydrates
    await expect(R(page).locator('[data-act="gopro"]')).toHaveCount(0);
    await expect(R(page).locator('[data-act="goal-pick"]')).toHaveCount(4);
  });
  test('a cold first visit fills the Pass Plan once the diagnostic module loads', async ({ page }) => {
    await openSettings(page, vp, { tier: 'free' });
    await expect(R(page).locator('.ist-pp [data-act^="pp-"]').first()).toBeAttached({ timeout: 8000 });
  });
  test('crossing 899px redraws: phone page off on desktop, back on phone, sheets closed', async ({ page }) => {
    await openSettings(page, vp, { tier: 'free' });
    await R(page).locator('[data-act="exam"]').click();
    await expect(page.locator('#ist-sheet')).toHaveClass(/open/);
    await page.setViewportSize(DESKTOP);
    await expect(page.locator('#page-settings')).not.toHaveClass(/ist-on/, { timeout: 5000 });
    await expect(page.locator('#ist-sheet')).toBeHidden();
    await expect(page.locator('#page-settings .settings-layout')).toBeVisible();
    await page.setViewportSize(vp);
    await expect(page.locator('#page-settings')).toHaveClass(/ist-on/, { timeout: 5000 });
    await expect(R(page).locator('.ist-acct')).toBeVisible();
  });
});

test.describe('Lift B4 final review', () => {
  test('the first entry reveal survives the email and Pass Plan arriving just after the draw', async ({ page }) => {
    await boot(page, PHONES[1], { signed: true });
    await setTier(page, 'pro');
    await page.locator('#lift-tabbar .lift-tab[data-page="settings"]').click();
    await expect(page.locator('#page-settings')).toHaveClass(/active/, { timeout: 10000 });
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => ({ still: document.getElementById('ios-settings').classList.contains('ist-still'),
      moving: Array.from(document.querySelectorAll('#ios-settings .ist-body > .reveal')).some((el) => el.getAnimations().length > 0) }));
    expect(r).toEqual({ still: false, moving: true });
    await expect(page.locator('#ios-settings .ist-em')).toContainText('simi.test@example.test', { timeout: 5000 });
  });
});

test.describe('Lift B4 deferred minors', () => {
  const vp = PHONES[1];
  const R = (page) => page.locator('#ios-settings');
  test('a sign-out while Settings is closed resets the email, so the next account shows its own', async ({ page }) => {
    await openSettings(page, vp, { signed: true, tier: 'pro' });
    await page.evaluate(() => renderSettingsPage());
    await expect(R(page).locator('.ist-em')).toContainText('simi.test@example.test', { timeout: 5000 });
    await page.locator('#lift-tabbar .lift-tab[data-page="setup"]').click();
    await page.evaluate(async () => {
      window.__fakeEmit('SIGNED_OUT');
      const r = await window.certanvilSupabase.auth.getSession(); r.data.session.user.email = 'other@example.test';
      window.__fakeEmit('SIGNED_IN');
    });
    await page.waitForTimeout(300);
    await page.locator('#lift-tabbar .lift-tab[data-page="settings"]').click();
    await expect(R(page).locator('.ist-em')).toContainText('other@example.test', { timeout: 5000 });
  });
  test('Sign out says so when the account menu is missing, never a silent tap', async ({ page }) => {
    await openSettings(page, vp, { signed: true, tier: 'pro' });
    await page.evaluate(() => { renderSettingsPage(); const l = document.getElementById('topbar-signout-link'); if (l) l.remove(); window.__toasts = []; window.showToast = function (m, t) { window.__toasts.push([m, t || '']); }; });
    await R(page).locator('[data-act="signout"]').click();
    expect(await page.evaluate(() => window.__toasts)).toEqual([['Couldn’t sign out here. Reload the app and try again.', 'error']]);
  });
  test('an import that fails mid-merge shows an error toast', async ({ page }) => {
    await openSettings(page, vp, { tier: 'free' });
    await page.evaluate(() => { window.__toasts = []; window.showToast = function (m, t) { window.__toasts.push([m, t || '']); }; window.loadHistory = function () { throw new Error('boom'); }; });
    await page.locator('#import-file-input').setInputFiles({ name: 'z.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ history: [{ date: '2026-01-02T10:00:00.000Z', topic: 'OSPF' }] })) });
    await page.locator('#exam-sheet .ix-sheet-go').click();
    await expect.poll(() => page.evaluate(() => window.__toasts.length)).toBe(1);
    expect((await page.evaluate(() => window.__toasts))[0][1]).toBe('error');
  });
  test('Restore runs the real function once, with no browser confirm', async ({ page }) => {
    const d = []; page.on('dialog', (x) => { d.push(x.message()); x.dismiss().catch(() => {}); });
    await openSettings(page, vp, { tier: 'free' });
    await page.evaluate(() => { window._takeAutoBackup(); renderSettingsPage(); });
    await R(page).locator('[data-act="restore"]').first().click();
    await page.locator('#exam-sheet .ix-sheet-go').click();
    await expect(page.getByText(/Restored \d+ keys/)).toBeVisible({ timeout: 3000 });
    expect(d).toEqual([]);
  });
  test('keyboard focus stays on a preset after it repaints', async ({ page }) => {
    await openSettings(page, vp, { signed: true, tier: 'pro' });
    await page.evaluate(() => renderSettingsPage());
    await R(page).locator('[data-act="goal-pick"][data-n="20"]').focus();
    await page.keyboard.press('Enter');
    await expect(R(page).locator('[data-act="goal-pick"][data-n="20"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => { const a = document.activeElement; return a && a.getAttribute('data-act') + ':' + a.getAttribute('data-n'); })).toBe('goal-pick:20');
  });
});

test.describe('Lift B4 desktop', () => {
  test("today's Settings, #ios-settings empty, no ist-on", async ({ page }) => {
    await openSettings(page, DESKTOP, { tier: 'free' });
    await expect(page.locator('#page-settings .settings-layout')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('ios-settings').innerHTML)).toBe('');
    await expect(page.locator('#page-settings')).not.toHaveClass(/ist-on/);
  });
});
