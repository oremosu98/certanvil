// Admin in the app, Task 3: one "Report a problem" form on every platform (drawing: mockups/cert-ios-report.html, phone
// and ?v=desktop). A bottom sheet below 900px, the shared centred dialog above. The Supabase client is replaced by a
// recording stub (no network, no database); localStorage seeding is local-only (Playwright on :3131, never prod).
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };
async function boot(page, vp) {
  await page.setViewportSize(vp);
  const seed = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1', nplus_dev_cert: 'secplus' };
  await page.addInitScript((sd) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, seed);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.openReportSheet === 'function' && typeof window._hubFirstName === 'function'
    && (window.innerWidth >= 900 ? document.body.classList.contains('is-state-resolved') : !!document.querySelector('#ios-home [data-act="cert"]')));
}
// mode: 'ok' (report #142) | 'offline' (the call throws) | 'reject' (the server says no, online) | 'hold' (settled by the test). name / email: the profile name and the session email.
async function stub(page, o) {
  await page.evaluate((o) => {
    window._certanvilSignedIn = o.signedIn !== false;
    window._certanvilDisplayName = o.name || '';
    window.__rpc = [];
    window.certanvilSupabase = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: o.signedIn === false ? null : { user: { id: 'u-test', email: o.email || 'sam@example.com' } } } }),
        getUser: () => Promise.resolve({ data: { user: o.signedIn === false ? null : { id: 'u-test' } } }),
      },
      rpc: (fn, args) => {
        window.__rpc.push({ fn, args });
        if (o.mode === 'offline') return Promise.reject(new Error('offline'));
        if (o.mode === 'reject') return Promise.resolve({ data: null, error: { message: 'permission denied' }, status: 403 });
        // 'hold': the call waits until the test settles it with window.__settle('ok' | 'reject')
        if (o.mode === 'hold') return new Promise((res) => { window.__settle = (how) => res(how === 'ok' ? { data: 142, error: null } : { data: null, error: { message: 'denied' }, status: 500 }); });
        return Promise.resolve({ data: 142, error: null });
      },
      from: () => ({ upsert: () => Promise.resolve({ error: null }) }),
    };
  }, o);
}
const sheet = (page) => page.locator('#ios-report');
const toast = (page) => page.locator('.irp-toast');
async function phoneSettings(page) {
  await page.locator('#lift-tabbar .lift-tab[data-page="settings"]').click();
  await expect(page.locator('#page-settings')).toHaveClass(/active/);
  await page.locator('#ios-settings [data-act="report"]').click();
  await expect(sheet(page)).toBeVisible();
}
// Fill #setup-err the way the quiz/exam catches do (a generation failure) or the start gates do (guidance).
async function showErr(page, text) {
  await page.evaluate((t) => { const b = document.getElementById('setup-err'); b.textContent = t; b.classList.remove('is-hidden'); }, text);
}
const failStart = (page) => showErr(page, '\u26a0\ufe0f All generated questions failed validation. Try again.');

test.describe('Report a problem: phone', () => {
  test('Settings → Report a problem opens the sheet with Send disabled until text', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'ok', name: 'Alex' });
    await phoneSettings(page);
    await expect(sheet(page)).toHaveAttribute('role', 'dialog');
    await expect(sheet(page)).toHaveAttribute('aria-modal', 'true');
    await expect(sheet(page)).not.toHaveClass(/is-dialog/);
    await expect(sheet(page).locator('.irp-eyebrow')).toHaveText('Help');
    await expect(sheet(page).locator('.irp-title')).toHaveText('Report a problem');
    await expect(sheet(page).locator('.irp-sub')).toHaveText('Tell us what went wrong. A real person reads every report.');
    await expect(sheet(page).locator('.irp-hearback')).toHaveText('We’ll email you when it’s fixed.');
    await expect(sheet(page).locator('.irp-context')).toHaveText('From Security+ · Settings');
    await expect(sheet(page).locator('label[for="irp-desc"]')).toHaveText('What happened?*');
    await expect(sheet(page).locator('.irp-count')).toHaveText('0 / 5,000');
    await expect(sheet(page).locator('input')).toHaveCount(0);   // no title field
    const send = sheet(page).locator('[data-act="send"]');
    await expect(send).toHaveText('Send report');
    await expect(send).toBeDisabled();
    await sheet(page).locator('#irp-desc').fill('   ');
    await expect(send).toBeDisabled();
    await sheet(page).locator('#irp-desc').fill('The timer froze');
    await expect(send).toBeEnabled();
    await expect(sheet(page).locator('.irp-count')).toHaveText('15 / 5,000');
    await sheet(page).locator('[data-act="steps"]').click();
    await expect(sheet(page).locator('#irp-steps')).toBeVisible();
    await expect(sheet(page).locator('#irp-steps')).toBeFocused();
    await expect(sheet(page).locator('[data-act="steps"]')).toBeHidden();
    const box = await send.boundingBox(); expect(box.height).toBeGreaterThanOrEqual(44);
    await sheet(page).locator('[data-act="cancel"]').click();
    await expect(sheet(page)).toHaveCount(0);
  });

  test('send shows "Thanks, Alex, got it. Report #142" when the profile name is Alex', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'ok', name: 'Alex', email: 'sam@example.com' });
    await phoneSettings(page);
    await sheet(page).locator('#irp-desc').fill('The timer froze on question 12');
    await sheet(page).locator('[data-act="steps"]').click();
    await sheet(page).locator('#irp-steps').fill('1. Start an exam');
    await sheet(page).locator('[data-act="send"]').click();
    await expect(sheet(page)).toHaveCount(0);   // the sheet goes first
    await expect(toast(page)).toBeVisible();
    await expect(toast(page).locator('.irp-toast-t')).toHaveText('Thanks, Alex, got it. Report #142');
    await expect(toast(page).locator('.irp-toast-l')).toHaveText('We’ll email you when it’s fixed.');
    const rpc = await page.evaluate(() => window.__rpc);
    expect(rpc).toHaveLength(1);
    expect(rpc[0].fn).toBe('submit_bug_report');
    expect(rpc[0].args.p_description).toBe('The timer froze on question 12');
    expect(rpc[0].args.p_steps).toBe('1. Start an exam');
    expect(rpc[0].args.p_title).toBe('The timer froze on question 12');
    expect(rpc[0].args.p_context.cert).toContain('secplus');
  });

  test('an email-derived name shows "Thanks, got it."', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'ok', name: 'alex.smith', email: 'alex.smith@example.com' });
    await phoneSettings(page);
    await sheet(page).locator('#irp-desc').fill('Wrong answer marked right');
    await sheet(page).locator('[data-act="send"]').click();
    await expect(toast(page).locator('.irp-toast-t')).toHaveText('Thanks, got it. Report #142');
  });

  test('offline send shows Saved and queues', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'offline', name: 'Alex' });
    await phoneSettings(page);
    await sheet(page).locator('#irp-desc').fill('Lost my streak');
    await sheet(page).locator('[data-act="send"]').click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(toast(page)).toHaveClass(/queued/);
    await expect(toast(page).locator('.irp-toast-t')).toHaveText('Saved');
    await expect(toast(page).locator('.irp-toast-l')).toHaveText('We’ll send it when you’re back online.');
    const q = await page.evaluate(() => JSON.parse(localStorage.getItem('nplus_bug_reports') || '[]'));
    expect(q).toHaveLength(1);
    expect(q[0].payload.description).toBe('Lost my streak');
    expect(q[0].terminal).toBe(false);
  });

  test('a server rejection while online is a hard failure: the form stays, nothing is queued, no Saved', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'reject', name: 'Alex' });
    await phoneSettings(page);
    await sheet(page).locator('#irp-desc').fill('Lost my streak');
    await sheet(page).locator('[data-act="send"]').click();
    await expect(sheet(page).locator('.irp-err')).toHaveText('That didn’t send. Try again in a moment.');
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator('#irp-desc')).toHaveValue('Lost my streak');
    await expect(sheet(page).locator('[data-act="send"]')).toBeEnabled();
    await expect(toast(page)).toHaveCount(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nplus_bug_reports') || '[]').length)).toBe(0);
  });

  test('while sending the button reads Sending… with no icon, then Send report again', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'hold', name: 'Alex' });
    await phoneSettings(page);
    await sheet(page).locator('#irp-desc').fill('Lost my streak');
    const send = sheet(page).locator('[data-act="send"]');
    await send.click();
    await expect(send).toHaveText('Sending…');
    await expect(send).toHaveAttribute('aria-busy', 'true');
    await expect(send).toBeDisabled();
    expect(await send.locator('svg').count()).toBe(0);
    await expect.poll(() => send.evaluate((b) => getComputedStyle(b).opacity)).toBe('0.7');   // held brighter than plain disabled (.45)
    await page.evaluate(() => window.__settle('reject'));
    await expect(sheet(page).locator('.irp-err')).toHaveText('That didn’t send. Try again in a moment.');
    await expect(send).toHaveText('Send report');
    await expect(send).toHaveAttribute('aria-busy', 'false');
    expect(await send.locator('svg').count()).toBe(1);
  });

  test('closed while sending and then it fails: what they typed is saved and a Not sent toast says so', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'hold', name: 'Alex' });
    await phoneSettings(page);
    await sheet(page).locator('#irp-desc').fill('Lost my streak');
    await sheet(page).locator('[data-act="steps"]').click();
    await sheet(page).locator('#irp-steps').fill('1. Finish a quiz');
    await sheet(page).locator('[data-act="send"]').click();
    await sheet(page).locator('[data-act="cancel"]').click();
    await expect(sheet(page)).toHaveCount(0);
    await page.evaluate(() => window.__settle('reject'));
    await expect(toast(page)).toHaveClass(/queued/);
    await expect(toast(page).locator('.irp-toast-t')).toHaveText('Not sent');
    await expect(toast(page).locator('.irp-toast-l')).toHaveText('Open Report a problem to try again. What you typed is saved.');
    await page.evaluate(() => window.openReportSheet());
    await expect(sheet(page).locator('#irp-desc')).toHaveValue('Lost my streak');
    await expect(sheet(page).locator('#irp-steps')).toHaveValue('1. Finish a quiz');
  });

  test('Cancel after "That didn’t send" keeps what they typed for the next open; a later send leaves no draft', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'hold', name: 'Alex' });
    await phoneSettings(page);
    await sheet(page).locator('#irp-desc').fill('Lost my streak');
    await sheet(page).locator('[data-act="steps"]').click();
    await sheet(page).locator('#irp-steps').fill('1. Finish a quiz');
    await sheet(page).locator('[data-act="send"]').click();
    await page.evaluate(() => window.__settle('reject'));
    await expect(sheet(page).locator('.irp-err')).toHaveText('That didn’t send. Try again in a moment.');
    await sheet(page).locator('[data-act="cancel"]').click();
    await expect(sheet(page)).toHaveCount(0);
    await page.evaluate(() => window.openReportSheet());
    await expect(sheet(page).locator('#irp-desc')).toHaveValue('Lost my streak');
    await expect(sheet(page).locator('#irp-steps')).toHaveValue('1. Finish a quiz');
    await sheet(page).locator('[data-act="send"]').click();   // this time it goes through
    await page.evaluate(() => window.__settle('ok'));
    await expect(sheet(page)).toHaveCount(0);
    await page.evaluate(() => window.openReportSheet());
    await expect(sheet(page).locator('#irp-desc')).toHaveValue('');
  });

  test('closing without a failed send saves nothing', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'reject', name: 'Alex' });
    await phoneSettings(page);
    await sheet(page).locator('#irp-desc').fill('Just looking');
    await sheet(page).locator('[data-act="cancel"]').click();
    await expect(sheet(page)).toHaveCount(0);
    await page.evaluate(() => window.openReportSheet());
    await expect(sheet(page).locator('#irp-desc')).toHaveValue('');
  });

  test('signed out shows the sign-in line and keeps the typed text after tapping Sign in', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'ok', signedIn: false });
    await page.evaluate(() => { window.iosSignIn = { go: (f) => { window.__signin = f; } }; });
    await phoneSettings(page);
    await expect(sheet(page).locator('.irp-hearback')).toHaveText('Sign in to hear back when it’s fixed. What you’ve typed stays here.');
    await sheet(page).locator('#irp-desc').fill('Flashcards skip a card');
    await sheet(page).locator('[data-act="steps"]').click();
    await sheet(page).locator('#irp-steps').fill('Tap next twice');
    await sheet(page).locator('[data-act="signin"]').click();
    await expect.poll(() => page.evaluate(() => window.__signin)).toBe('report');
    await page.evaluate(() => window.openReportSheet());
    await expect(sheet(page).locator('#irp-desc')).toHaveValue('Flashcards skip a card');
    await expect(sheet(page).locator('#irp-steps')).toHaveValue('Tap next twice');
    await expect(sheet(page).locator('#irp-steps')).toBeVisible();
    await expect(sheet(page).locator('[data-act="send"]')).toBeEnabled();
    await sheet(page).locator('[data-act="send"]').click();
    await expect(toast(page).locator('.irp-toast-t')).toHaveText('Thanks, got it. Report #142');
    await expect(toast(page).locator('.irp-toast-l')).toHaveText('We read every report.');
  });

  test('Settings at 390px shows exactly one "Report a problem" row (the desktop one stays hidden)', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'ok' });
    await page.locator('#lift-tabbar .lift-tab[data-page="settings"]').click();
    await expect(page.locator('#page-settings')).toHaveClass(/active/);
    await expect(page.locator('#ios-settings [data-act="report"]')).toBeVisible();
    await expect(page.locator('#settings-report-btn')).toBeHidden();
    const rows = page.locator('#page-settings :is(button, a)').filter({ hasText: 'Report a problem' });
    expect(await rows.evaluateAll((els) => els.filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden').length)).toBe(1);
  });

  test('a draft older than 30 minutes is dropped; a sent report leaves no draft behind', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'ok' });
    await page.evaluate(() => sessionStorage.setItem('ca_report_draft', JSON.stringify({ desc: 'old words', steps: '', from: '', at: Date.now() - 31 * 60 * 1000 })));
    await page.evaluate(() => window.openReportSheet());
    await expect(sheet(page).locator('#irp-desc')).toHaveValue('');
    expect(await page.evaluate(() => sessionStorage.getItem('ca_report_draft'))).toBeNull();
    await sheet(page).locator('[data-act="cancel"]').click();
    await expect(sheet(page)).toHaveCount(0);
    // a fresh draft restores; once that report is sent, the next form starts empty
    await page.evaluate(() => sessionStorage.setItem('ca_report_draft', JSON.stringify({ desc: 'fresh words', steps: '', from: '', at: Date.now() - 60 * 1000 })));
    await page.evaluate(() => window.openReportSheet());
    await expect(sheet(page).locator('#irp-desc')).toHaveValue('fresh words');
    await sheet(page).locator('[data-act="send"]').click();
    await expect(toast(page)).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('ca_report_draft'))).toBeNull();
    await page.evaluate(() => window.openReportSheet());
    await expect(sheet(page).locator('#irp-desc')).toHaveValue('');
  });

  test('a failed quiz start shows "Something wrong? Tell us" under #setup-err and it opens the sheet with From {cert} · Home', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'ok' });
    await failStart(page);
    const tell = page.locator('#setup-err [data-irp-tell]');
    await expect(tell).toBeVisible();
    await expect(tell).toHaveText('Something wrong? Tell us');
    const box = await tell.boundingBox(); expect(box.height).toBeGreaterThanOrEqual(44);
    await tell.click();
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator('.irp-context')).toHaveText('From Security+ · Home');
  });

  test('guidance gets no link: the sign-in prompt, API-key setup and the daily limit; a generation failure does', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'ok', signedIn: false });
    const box = page.locator('#setup-err'), tell = box.locator('[data-irp-tell]');
    for (const msg of [
      'Sign in to study free: 15 questions a day, no API key needed. Tap "Sign in" at the top right.',
      '\u26a0\ufe0f Sign in to study · 15 free questions/day at certanvil.com.',
      'Invalid API key format. Anthropic keys start with "sk-ant-".',
      'API key looks too short. Please check and try again.',
      'You’ve used your 15 free questions today. Upgrade to Pro for unlimited study.',
    ]) {
      await showErr(page, msg);
      await expect(box).toContainText(msg.slice(3, 30));
      await page.waitForTimeout(50);   // the observer runs on a microtask; give it a beat before asserting absence
      await expect(tell).toHaveCount(0);
    }
    await showErr(page, '\u26a0\ufe0f Couldn’t make new questions this time. Try again.');
    await expect(tell).toHaveText('Something wrong? Tell us');
    await showErr(page, 'Timed out after 30000ms: batch 1');
    await expect(tell).toBeVisible();
    // guidance after a failure: the link goes with the old message
    await showErr(page, 'Sign in to study free: 15 questions a day, no API key needed. Tap "Sign in" at the top right.');
    await page.waitForTimeout(50);
    await expect(tell).toHaveCount(0);
  });

  test('Escape closes; Tab stays in the sheet', async ({ page }) => {
    await boot(page, PHONE); await stub(page, { mode: 'ok' });
    const inertBefore = await page.evaluate(() => [...document.body.children].filter((el) => el.inert).length);
    await phoneSettings(page);
    expect(await page.evaluate(() => document.getElementById('lift-tabbar').closest('[inert]') !== null)).toBe(true);
    await sheet(page).locator('#irp-desc').fill('x');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.getElementById('ios-report').contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => document.getElementById('ios-report').contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    expect(await page.evaluate(() => [...document.body.children].filter((el) => el.inert).length)).toBe(inertBefore);   // everything we inerted is live again
    await expect(page.locator('#ios-settings [data-act="report"]')).toBeFocused();
  });
});

test.describe('Report a problem: desktop', () => {
  test('desktop: the top-bar report button opens the same form as a centred dialog, no title field', async ({ page }) => {
    await boot(page, DESKTOP); await stub(page, { mode: 'ok', name: 'Alex' });
    await page.click('#topbar-bug-report');
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page)).toHaveClass(/is-dialog/);
    await expect(sheet(page).locator('.irp-title')).toHaveText('Report a problem');
    await expect(sheet(page).locator('.irp-context')).toHaveText('From Security+ · Home');
    await expect(sheet(page).locator('input')).toHaveCount(0);
    await expect(page.locator('#bug-report-drawer')).toHaveCount(0);
    await expect(page.locator('.ca-dlg-x')).toHaveCount(0);   // the form's own Close is the frame's X
    await expect(sheet(page).locator('#irp-desc')).toBeFocused();
    expect(await sheet(page).evaluate((el) => getComputedStyle(el).width)).toBe('480px');
    expect(await page.evaluate(() => [...document.body.children].some((el) => el.inert))).toBe(true);
    await sheet(page).locator('#irp-desc').fill('Chart labels overlap');
    await sheet(page).locator('[data-act="send"]').click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(toast(page).locator('.irp-toast-t')).toHaveText('Thanks, Alex, got it. Report #142');
    expect(await page.evaluate(() => [...document.body.children].some((el) => el.inert))).toBe(false);
  });

  test('desktop: Settings → Report a problem opens it', async ({ page }) => {
    await boot(page, DESKTOP); await stub(page, { mode: 'ok' });
    await page.locator('.sb-item[data-sb-page="settings"]').click();   // the sidebar, as a person does
    await expect(page.locator('#page-settings')).toHaveClass(/active/);
    const row = page.locator('#settings-report-btn');
    await expect(row).toBeVisible();
    await expect(row).toContainText('Report a problem');
    await expect(row).toContainText('Bugs, wrong answers, anything off');
    await row.click();
    await expect(sheet(page)).toHaveClass(/is-dialog/);
    await expect(sheet(page).locator('.irp-context')).toHaveText('From Security+ · Settings');
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    await expect(row).toBeFocused();
  });

  test('desktop: markup in a description stays text in the queue and in the Settings queued-reports panel', async ({ page }) => {
    const evil = '<img src=x onerror=alert(1)>"\'';
    await boot(page, DESKTOP); await stub(page, { mode: 'offline' });
    let dialogs = 0; page.on('dialog', (d) => { dialogs++; d.dismiss(); });
    await page.click('#topbar-bug-report');
    await sheet(page).locator('#irp-desc').fill(evil);
    await sheet(page).locator('[data-act="send"]').click();
    await expect(toast(page).locator('.irp-toast-t')).toHaveText('Saved');
    const q = await page.evaluate(() => JSON.parse(localStorage.getItem('nplus_bug_reports') || '[]'));
    expect(q).toHaveLength(1);
    expect(q[0].payload.description).toBe(evil);
    expect(q[0].payload.title).toBe(evil);
    await page.locator('.sb-item[data-sb-page="settings"]').click();
    const panel = page.locator('#settings-reports-panel');
    await expect(panel.locator('.br-sp-title')).toHaveText(evil);
    expect(await panel.locator('img').count()).toBe(0);
    expect(await page.locator('#settings-reports-section img').count()).toBe(0);
    expect(dialogs).toBe(0);
  });

  test('desktop: a failed quiz start shows Something wrong? Tell us', async ({ page }) => {
    await boot(page, DESKTOP); await stub(page, { mode: 'ok' });
    await failStart(page);
    const tell = page.locator('#setup-err [data-irp-tell]');
    await expect(tell).toBeVisible();
    await tell.click();
    await expect(sheet(page)).toHaveClass(/is-dialog/);
    await expect(sheet(page).locator('.irp-context')).toHaveText('From Security+ · Home');
  });
});
