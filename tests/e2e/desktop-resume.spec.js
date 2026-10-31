// Desktop catch-up Task 2: "Finish your quiz" on the desktop Home. Same save as the phone card (features/quiz-resume.js);
// Review Focus 2: a resumed desktop quiz gets exactly the saved questions, answers and position; expired / other-cert saves are dropped.
const { test, expect } = require('@playwright/test');

const DESKTOP = { width: 1280, height: 800 };
const KEY = 'nplus_quiz_resume';
const SEED = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' };
const QS = Array.from({ length: 10 }, (_, i) => ({
  question: 'Resume stem ' + (i + 1) + ': which port does service ' + i + ' use?',
  options: ['Port 2' + i, 'Port 3' + i, 'Port 4' + i, 'Port 5' + i], answer: 'ABCD'[i % 4],
  explanation: 'Service ' + i + ' explanation.', topic: 'Ports & Protocols', difficulty: 'Exam Level'
}));

async function boot(page) {
  await page.setViewportSize(DESKTOP);
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, SEED);
  page.__ai = 0;
  page.on('request', (r) => { if (r.url().includes('/api/ai')) page.__ai++; });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.resumeQuiz === 'function' && typeof window._testInjectQuiz === 'function' && typeof window.caIsDesk === 'function');
}
async function play(page, n) {
  await page.evaluate(([qs, n]) => {
    window._testInjectQuiz(qs);
    for (let i = 0; i < n; i++) {
      const q = questions[current];
      pick(i % 2 ? q.answer : 'A', q);
      if (i < questions.length - 1) { current = i + 1; render(); }
    }
  }, [QS, n]);
  await expect(page.locator('#page-quiz')).toHaveClass(/active/);
  await expect(page.locator('#page-quiz')).not.toHaveClass(/page-exit/);
}
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const card = (page) => page.locator('#desk-resume [data-act="resume"]');

test.describe('Desktop: Finish your quiz', () => {
  test('desktop: a saved quiz shows the card; Resume restores the same questions at the same position', async ({ page }) => {
    await boot(page);
    await expect(card(page)).toBeHidden();
    await play(page, 7);
    const before = await page.evaluate(() => JSON.stringify(questions));
    await page.reload();   // pagehide saves the quiz on question 8
    await page.waitForLoadState('load');
    await expect(card(page)).toBeVisible({ timeout: 8000 });
    await expect(card(page)).toContainText('Pick up where you left off');
    await expect(card(page)).toContainText('Finish your quiz · 3 left');
    await expect(card(page)).toContainText('Mixed topics · 7 of 10 answered');
    await expect(card(page).locator('.rc-badge')).toHaveText(/^\s*3\s*LEFT\s*$/i);
    await expect(page.locator('#desk-resume [data-act="fresh"]')).toHaveText('Start fresh');
    // above the readiness hero
    const [cy, hy] = await page.evaluate(() => [document.getElementById('desk-resume').getBoundingClientRect().top, document.querySelector('#page-setup .cell-hero').getBoundingClientRect().top]);
    expect(cy).toBeLessThan(hy);
    await expect(page.locator('#ios-home [data-kind="quiz"]')).toHaveCount(0);   // phone card stays phone-only

    const aiBefore = page.__ai;
    await card(page).click();
    await expect(page.locator('#page-quiz')).toHaveClass(/active/);
    const st = await page.evaluate(() => ({ qs: JSON.stringify(questions), log: log.length, current, linked: log.every((e, i) => e.q === questions[i]) }));
    expect(st.qs).toBe(before);
    expect(st.log).toBe(7);
    expect(st.current).toBe(7);
    expect(st.linked).toBe(true);
    await expect(page.locator('#q-label')).toHaveText('Question 8 of 10');
    expect(page.__ai - aiBefore).toBe(0);
  });

  test('Start fresh clears the save and the card goes', async ({ page }) => {
    await boot(page);
    await play(page, 3);
    await page.reload();
    await page.waitForLoadState('load');
    await expect(card(page)).toBeVisible({ timeout: 8000 });
    await page.locator('#desk-resume [data-act="fresh"]').click();
    await expect(card(page)).toBeHidden();
    expect(await saved(page)).toBeNull();
  });

  test('an expired (25h) save shows no card', async ({ page }) => {
    await boot(page);
    await play(page, 4);
    await page.evaluate(() => showPage('setup'));
    await expect(page.locator('#page-quiz')).not.toHaveClass(/active/);
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.savedAt = Date.now() - 25 * 3600000; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    await page.reload(); await page.waitForLoadState('load');
    await expect(page.locator('#page-setup .cell-hero')).toBeVisible({ timeout: 8000 });
    await expect(card(page)).toBeHidden();
    expect(await saved(page)).toBeNull();
  });

  test('a save from another cert shows no card', async ({ page }) => {
    await boot(page);
    await play(page, 4);
    await page.evaluate(() => showPage('setup'));
    await expect(page.locator('#page-quiz')).not.toHaveClass(/active/);
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.cert = 'not-this-cert'; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    await page.reload(); await page.waitForLoadState('load');
    await expect(page.locator('#page-setup .cell-hero')).toBeVisible({ timeout: 8000 });
    await expect(card(page)).toBeHidden();
    expect(await saved(page)).toBeNull();
  });
});
