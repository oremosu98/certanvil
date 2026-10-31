// Desktop catch-up Task 3: "How did your exam go?" on the desktop Home (drawings home-exam-ask, log-result,
// home-exam-passed). Same store and copy as the phone (features/ios-log-result.js); the log-result screen opens as a
// centred dialog through caDialogFrame. The phone flow is covered unchanged by exam-outcome.spec.js.
const { test, expect } = require('@playwright/test');

const DESKTOP = { width: 1280, height: 800 };
const OUT = 'nplus_exam_outcomes';

function dayOffset(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

async function boot(page, examDate) {
  await page.setViewportSize(DESKTOP);
  // localhost-only fixture seeds, in this test's own isolated browser context
  const seed = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1',
    nplus_exam_dates: JSON.stringify({ netplus: examDate }),
    nplus_readiness_snapshots: JSON.stringify({ netplus: { score: 553, computed_at: new Date().toISOString() } }) };
  await page.addInitScript((sd) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(sd).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, seed);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.openLogResult === 'function' && typeof window.caIsDesk === 'function' && window.caIsDesk());
}
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), OUT);
const inertLeft = (page) => page.evaluate(() => [].some.call(document.body.children, (el) => el.inert && el.id !== 'ios-log-result'));   // the dialog itself is inert during its 200ms exit
const card = (page) => page.locator('#desk-oc');

test.describe('Desktop: How did your exam go', () => {
  test('desktop: the day after the exam date Home asks How did your exam go', async ({ page }) => {
    await boot(page, dayOffset(-1));
    await expect(card(page)).toBeVisible({ timeout: 8000 });
    await expect(card(page)).toContainText('Your exam was yesterday');
    await expect(card(page)).toContainText('How did your Network+ exam go?');
    await expect(card(page)).toContainText("Tell us and we'll update your plan.");
    await expect(card(page).locator('[data-act="oc-passed"]')).toHaveText('Passed');
    await expect(card(page).locator('[data-act="oc-failed"]')).toHaveText("Didn't pass");
    await expect(card(page).locator('[data-act="oc-notyet"]')).toHaveText("I haven't sat it yet");
    await expect(page.locator('#primaryLaunch')).toBeHidden();   // it takes the Recommended next slot

    // Escape closes the dialog once, un-inerts the page and hands focus back to the opener
    await card(page).locator('[data-act="oc-failed"]').click();
    const dlg = page.locator('#ios-log-result');
    await expect(dlg).toHaveClass(/is-dialog/);
    await expect(page.locator('#ios-log-result [data-ca-close]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    expect(await inertLeft(page)).toBe(false);
    await expect(card(page).locator('[data-act="oc-failed"]')).toBeFocused();
    expect(await saved(page)).toBeNull();
  });

  test('on the exam day there is no ask and Recommended next stays', async ({ page }) => {
    await boot(page, dayOffset(0));
    await expect(page.locator('#primaryLaunch')).toBeVisible();
    await expect(card(page)).toBeHidden();
  });

  test('Passed → log-result dialog → save shows the badge and Pick your next cert', async ({ page }) => {
    await boot(page, dayOffset(-1));
    await card(page).locator('[data-act="oc-passed"]').click();
    const dlg = page.locator('#ios-log-result');
    await expect(dlg).toBeVisible();
    await expect(dlg).toHaveClass(/is-dialog/);
    await expect(dlg).toHaveClass(/is-sm/);
    const box = await dlg.boundingBox();
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('ios-log-result')).width))).toBe(460);   // CSS px (the app zooms html)
    expect(Math.abs(box.x + box.width / 2 - DESKTOP.width / 2)).toBeLessThan(2);   // centred
    await expect(page.locator('#ios-log-result [data-ca-close]')).toBeFocused();
    await expect(dlg.locator('.il-back')).toBeHidden();   // the frame's Close replaces the phone's Back
    await expect(dlg.locator('.il-h1')).toHaveText('Log your result');
    await expect(dlg).toContainText('Sat the exam? Add your result. A pass marks the cert as passed in your hub.');
    await expect(dlg.locator('[data-v="passed"]')).toHaveAttribute('aria-checked', 'true');
    await expect(dlg.locator('#il-date')).toHaveValue(dayOffset(-1));
    expect(await page.evaluate(() => document.getElementById('app-sidebar').closest('body > *').inert)).toBe(true);

    await dlg.locator('#il-score').fill('812');
    await dlg.locator('#il-save').click();
    await expect(dlg.locator('#il-done-t')).toHaveText('Network+ is passed');
    await expect(dlg.locator('#il-done-b')).toContainText('812 / 900');
    await expect(page.locator('.il-toast')).toContainText('You passed Network+. Well done.');
    expect((await saved(page)).netplus).toMatchObject({ outcome: 'passed', score: 812, date: dayOffset(-1), predicted: 553 });

    // Home behind the dialog already shows the pass
    await expect(page.locator('#cb-cert .badge-pass')).toHaveText('Passed');
    await expect(page.locator('#app-sidebar .badge-pass')).toHaveText('Passed');
    await expect(card(page)).toContainText('Network+ passed · scored 812');
    await expect(card(page)).toContainText('Pick your next cert');
    await expect(card(page)).toContainText('We predicted 553 on exam day. Your streak carries on with your next cert.');
    await expect(card(page).locator('[data-act="oc-passed"]')).toHaveCount(0);

    await dlg.locator('#il-done-go').click();   // See it in your hub: the desktop My certs page (Task 4)
    await expect(dlg).toBeHidden();
    expect(await inertLeft(page)).toBe(false);
    await expect(page.locator('#page-mycerts')).toHaveClass(/active/);
    await expect(page.locator('#desk-mycerts .dmc-ac .dmc-badge')).toHaveText('Passed');

    await page.evaluate(() => showPage('setup'));
    await expect(card(page).locator('[data-act="choose"]')).toHaveText('Choose a cert');
    await card(page).locator('[data-act="choose"]').click();
    await expect(page.locator('#page-mycerts')).toHaveClass(/active/);
  });

  test("Didn't pass offers Set a new date", async ({ page }) => {
    await boot(page, dayOffset(-2));
    await expect(card(page)).toContainText('Your exam was 2 days ago');
    await card(page).locator('[data-act="oc-failed"]').click();
    const dlg = page.locator('#ios-log-result');
    await expect(dlg.locator('[data-v="failed"]')).toHaveAttribute('aria-checked', 'true');
    await expect(dlg.locator('#il-save')).toHaveText('Save and keep studying');
    await dlg.locator('#il-save').click();
    await expect(dlg.locator('#il-done-t')).toHaveText("That's a hard exam.");
    await expect(page.locator('.il-toast')).toHaveCount(0);
    expect((await saved(page)).netplus).toMatchObject({ outcome: 'failed', score: null });
    await expect(dlg.locator('#il-done-alt')).toHaveText('Not now');
    await expect(dlg.locator('#il-done-go')).toHaveText('Set a new date');
    await dlg.locator('#il-done-go').click();
    await expect(dlg).toBeHidden();
    expect(await inertLeft(page)).toBe(false);
    await expect(page.locator('#page-settings')).toHaveClass(/active/);
    await expect(page.locator('#settings-exam-row .ana-exam-date-btn')).toBeFocused();
    await expect(page.locator('#settings-exam-input')).toHaveValue(dayOffset(-2));
  });

  test("I haven't sat it yet opens the exam-date setter", async ({ page }) => {
    await boot(page, dayOffset(-1));
    await card(page).locator('[data-act="oc-notyet"]').click();
    await expect(page.locator('#page-settings')).toHaveClass(/active/);
    await expect(page.locator('#settings-exam-row .ana-exam-date-btn')).toBeFocused();
  });

  test('a quiz to resume outranks the ask, as on the phone', async ({ page }) => {
    await boot(page, dayOffset(-1));
    await expect(card(page)).toBeVisible({ timeout: 8000 });
    await page.evaluate(() => { window.quizResumeState = () => ({ total: 10, answered: 7, left: 3, topicLabel: 'Ports & Protocols' }); renderDeskResume(); renderBentoRecommended(); });
    await expect(card(page)).toBeHidden();
    await expect(page.locator('#primaryLaunch')).toBeVisible();
    await expect(page.locator('#desk-resume')).toContainText('Finish your quiz · 3 left');
  });

  test('crossing to phone width with the dialog open closes it cleanly', async ({ page }) => {
    await boot(page, dayOffset(-1));
    await card(page).locator('[data-act="oc-passed"]').click();
    await expect(page.locator('#ios-log-result')).toHaveClass(/is-dialog/);
    await page.setViewportSize({ width: 600, height: 800 });
    await expect(page.locator('#ios-log-result')).toBeHidden();
    expect(await inertLeft(page)).toBe(false);
    await expect(page.locator('.ca-dlg-scrim')).toHaveCount(0);
  });
});
