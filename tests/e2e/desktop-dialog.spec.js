// Desktop catch-up Task 1: the shared dialog layout. iosSettings.openSheet is the phone bottom sheet below 900px and
// a centred dialog (.ist-sheet.is-dialog) at 900px and up; window.caDialogFrame owns the scrim, inert-behind,
// focus-to-close, Escape and the close-on-breakpoint-change. Review Focus 1: crossing 900px never strands an inert page.
const { test, expect } = require('@playwright/test');

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const HTML = '<div class="ist-grip"></div><h3 id="ist-sheet-title">Test sheet</h3><p>Body copy.</p>'
  + '<button type="button" data-act="one">One</button><button type="button" data-act="two">Two</button>';

async function boot(page, vp) {
  await page.setViewportSize(vp);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('ca_tour_seen', '1'); } catch (_) {}
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => !!(window.iosSettings && window.iosSettings.openSheet && window.caDialogFrame && window.caIsDesk));
  await page.waitForTimeout(400);
}
const inertCount = (page) => page.evaluate(() => document.querySelectorAll('body > [inert]').length);
const open = (page) => page.evaluate((h) => { window.__taps = []; window.iosSettings.openSheet(h, function (b) { window.__taps.push(b.getAttribute('data-act')); }); }, HTML);

test.describe('Desktop dialog layout', () => {
  test('desktop: openSheet opens a centred dialog with focus on Close; Escape closes and un-inerts', async ({ page }) => {
    await boot(page, DESKTOP);
    expect(await page.evaluate(() => window.caIsDesk())).toBe(true);
    const before = await inertCount(page);
    await open(page);
    const sheet = page.locator('#ist-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-dialog/);
    await page.waitForTimeout(450);   // the 340ms entrance
    const box = await sheet.boundingBox();
    expect(Math.abs(box.x + box.width / 2 - DESKTOP.width / 2)).toBeLessThan(2);
    expect(Math.abs(box.y + box.height / 2 - DESKTOP.height / 2)).toBeLessThan(2);
    // md by default: 560 CSS px (desktop pages run at html { zoom: 1.10 }, so the on-screen box is wider)
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('ist-sheet')).width))).toBe(560);
    await expect(page.locator('.ca-dlg-scrim')).toBeVisible();
    // focus lands on the close button; the page behind is inert, the dialog is not
    expect(await page.evaluate(() => { var a = document.activeElement; return a && a.classList.contains('ca-dlg-x') && a.getAttribute('aria-label'); })).toBe('Close');
    expect(await inertCount(page)).toBeGreaterThan(before);
    expect(await page.evaluate(() => !!document.getElementById('ist-sheet').closest('[inert]'))).toBe(false);
    // taps still reach the sheet's handler
    await sheet.locator('[data-act="two"]').click();
    expect(await page.evaluate(() => window.__taps)).toEqual(['two']);
    // Tab stays inside the dialog
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.getElementById('ist-sheet').contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    expect(await inertCount(page)).toBe(before);
    await expect(page.locator('.ca-dlg-scrim')).toHaveCount(0);
  });

  test('desktop: the close button and the scrim both close it', async ({ page }) => {
    await boot(page, DESKTOP);
    const before = await inertCount(page);
    await open(page);
    await page.locator('#ist-sheet .ca-dlg-x').click();
    await expect(page.locator('#ist-sheet')).toBeHidden();
    expect(await inertCount(page)).toBe(before);
    await open(page);
    await page.waitForTimeout(400);
    await page.mouse.click(30, 30);   // the scrim, outside the dialog
    await expect(page.locator('#ist-sheet')).toBeHidden();
    expect(await inertCount(page)).toBe(before);
  });

  test('phone: openSheet is still the bottom sheet', async ({ page }) => {
    await boot(page, PHONE);
    expect(await page.evaluate(() => window.caIsDesk())).toBe(false);
    await open(page);
    const sheet = page.locator('#ist-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).not.toHaveClass(/is-dialog/);
    await expect(page.locator('#ist-sheet-scrim')).toBeVisible();
    await expect(page.locator('.ca-dlg-scrim')).toHaveCount(0);
    await expect(sheet.locator('.ca-dlg-x')).toHaveCount(0);
    await page.waitForTimeout(450);
    const box = await sheet.boundingBox();
    expect(Math.abs(box.y + box.height - PHONE.height)).toBeLessThan(2);   // pinned to the bottom edge
    expect(box.width).toBe(PHONE.width);
    expect(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-act'))).toBe('one');
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  test('resizing across 900px with a dialog open closes it cleanly (no inert left on #app)', async ({ page }) => {
    await boot(page, DESKTOP);
    const before = await inertCount(page);
    await open(page);
    await expect(page.locator('#ist-sheet')).toHaveClass(/is-dialog/);
    await page.setViewportSize(PHONE);
    await expect(page.locator('#ist-sheet')).toBeHidden();
    await expect(page.locator('#ist-sheet-scrim')).toBeHidden();
    await expect(page.locator('.ca-dlg-scrim')).toHaveCount(0);
    await expect(page.locator('#ist-sheet')).not.toHaveClass(/is-dialog/);
    expect(await inertCount(page)).toBe(before);
    // the other way: a phone sheet open while the window widens does not sit over the desktop layout
    const phoneBefore = await inertCount(page);
    await open(page);
    await expect(page.locator('#ist-sheet')).toBeVisible();
    await page.setViewportSize(DESKTOP);
    await expect(page.locator('#ist-sheet')).toBeHidden();
    await expect(page.locator('#ist-sheet-scrim')).toBeHidden();
    expect(await inertCount(page)).toBe(phoneBefore);
    // and it still opens as a dialog afterwards
    await open(page);
    await expect(page.locator('#ist-sheet')).toHaveClass(/is-dialog/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#ist-sheet')).toBeHidden();
    expect(await inertCount(page)).toBe(before);
  });

  test('caDialogFrame frames a module-owned host and hands close back to it', async ({ page }) => {
    await boot(page, DESKTOP);
    const before = await inertCount(page);
    await page.evaluate(() => {
      var h = document.createElement('section'); h.id = 'dlg-test'; h.setAttribute('role', 'dialog'); h.innerHTML = '<h2>Own sheet</h2><button type="button">Go</button>';
      document.body.appendChild(h);
      window.__closed = [];
      window.__frame = window.caDialogFrame(h, { onClose: function (o) { window.__closed.push(!!(o && o.instant)); h.hidden = true; } });
    });
    await expect(page.locator('#dlg-test')).toHaveClass(/is-dialog/);
    expect(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('ca-dlg-x'))).toBe(true);
    expect(await inertCount(page)).toBeGreaterThan(before);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => window.__closed)).toEqual([false]);
    await expect(page.locator('#dlg-test')).toBeHidden();
    expect(await inertCount(page)).toBe(before);
    // release() tears the frame down without calling onClose (the module closed itself)
    await page.evaluate(() => { var h = document.getElementById('dlg-test'); h.hidden = false; window.__frame = window.caDialogFrame(h, { onClose: function () { window.__closed.push('again'); } }); window.__frame.release(); });
    expect(await inertCount(page)).toBe(before);
    expect(await page.evaluate(() => window.__closed)).toEqual([false]);
  });

  test('sizes: the drawing\'s three widths (sm 460, md 560 default, lg 700) for openSheet and caDialogFrame', async ({ page }) => {
    await boot(page, DESKTOP);
    const w = (sel) => page.evaluate((s) => parseFloat(getComputedStyle(document.querySelector(s)).width), sel);
    await page.evaluate((h) => window.iosSettings.openSheet(h, null, { size: 'lg' }), HTML);
    await expect(page.locator('#ist-sheet')).toHaveClass(/is-lg/);
    expect(await w('#ist-sheet')).toBe(700);
    await page.keyboard.press('Escape');
    await expect(page.locator('#ist-sheet')).toBeHidden();
    await expect(page.locator('#ist-sheet')).not.toHaveClass(/is-lg/);
    await page.evaluate(() => {
      var h = document.createElement('section'); h.id = 'dlg-sm'; h.innerHTML = '<h2>Small</h2>'; document.body.appendChild(h);
      window.__f = window.caDialogFrame(h, { size: 'sm', onClose: function () { h.hidden = true; } });
    });
    expect(await w('#dlg-sm')).toBe(460);
    await page.evaluate(() => window.__f.setSize('md'));
    expect(await w('#dlg-sm')).toBe(560);
    await page.keyboard.press('Escape');
    await expect(page.locator('#dlg-sm')).toBeHidden();
  });

  test('stacked: a module dialog over an openSheet dialog; one Escape closes only the top one', async ({ page }) => {
    await boot(page, DESKTOP);
    const before = await inertCount(page);
    await open(page);
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      var h = document.createElement('section'); h.id = 'dlg-top'; h.innerHTML = '<h2>Top</h2><button type="button" id="top-go">Go</button>'; document.body.appendChild(h);
      window.__closed = [];
      window.caDialogFrame(h, { size: 'sm', onClose: function () { window.__closed.push('top'); h.hidden = true; } });
    });
    await page.waitForTimeout(400);
    // the top dialog is live and above the sheet; the sheet underneath is inert
    expect(await page.evaluate(() => !!document.getElementById('dlg-top').closest('[inert]'))).toBe(false);
    expect(await page.evaluate(() => document.getElementById('ist-sheet').inert)).toBe(true);
    expect(await page.evaluate(() => { var r = document.getElementById('dlg-top').getBoundingClientRect(); var el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(el && el.closest('#dlg-top')); })).toBe(true);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => window.__closed)).toEqual(['top']);
    await expect(page.locator('#dlg-top')).toBeHidden();
    await expect(page.locator('#ist-sheet')).toBeVisible();
    await expect(page.locator('#ist-sheet')).toHaveClass(/is-dialog/);
    expect(await page.evaluate(() => document.getElementById('ist-sheet').inert)).toBe(false);
    expect(await inertCount(page)).toBeGreaterThan(before);   // the page behind the sheet is still inert
    await page.keyboard.press('Escape');
    await expect(page.locator('#ist-sheet')).toBeHidden();
    expect(await inertCount(page)).toBe(before);
    await expect(page.locator('.ca-dlg-scrim')).toHaveCount(0);
  });

  test('an in-place redraw keeps focus on the control the user was on, not Close', async ({ page }) => {
    await boot(page, DESKTOP);
    await open(page);
    await page.locator('#ist-sheet [data-act="two"]').focus();
    await page.evaluate((h) => window.iosSettings.openSheet(h, null), HTML.replace('Two</button>', 'Two (picked)</button>'));
    expect(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-act'))).toBe('two');
    await expect(page.locator('#ist-sheet [data-act="two"]')).toHaveText('Two (picked)');
    await expect(page.locator('#ist-sheet .ca-dlg-x')).toHaveCount(1);   // the X is back after the redraw
    // with focus outside the sheet's controls (the dialog itself), a redraw does not grab focus to Close either
    await page.evaluate(() => { var s = document.getElementById('ist-sheet'); s.tabIndex = -1; s.focus(); });
    await page.evaluate((h) => window.iosSettings.openSheet(h, null), HTML);
    expect(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('ca-dlg-x'))).toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.locator('#ist-sheet')).toBeHidden();
  });
});
