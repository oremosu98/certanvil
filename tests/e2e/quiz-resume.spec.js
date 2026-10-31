// Persona bundle Task 6: a practice quiz the app closed in the middle of resumes with EXACTLY the
// same questions (features/quiz-resume.js). Phone Home shows "Finish your quiz · N left" (Task 4's
// kind 'quiz' card); Resume restores the saved questions, answers and position without a network
// call; Start fresh, ✕ leave and finishing all clear the save; excluded modes never save.
// Spec: docs/superpowers/specs/2026-10-30-quiz-resume-design.md
const { test, expect } = require('@playwright/test');

const PHONE = { width: 390, height: 844 };
const KEY = 'nplus_quiz_resume';
const SEED = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' };
const QS = Array.from({ length: 10 }, (_, i) => ({
  question: 'Resume stem ' + (i + 1) + ': which port does service ' + i + ' use?',
  options: ['Port 2' + i, 'Port 3' + i, 'Port 4' + i, 'Port 5' + i], answer: 'ABCD'[i % 4],
  explanation: 'Service ' + i + ' explanation.', topic: 'Ports & Protocols', difficulty: 'Exam Level'
}));

async function boot(page) {
  await page.setViewportSize(PHONE);
  // localhost-only fixture seeds, in this test's own isolated browser context
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, SEED);
  page.__ai = 0;
  page.on('request', (r) => { if (r.url().includes('/api/ai')) page.__ai++; });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.resumeQuiz === 'function' && typeof window._testInjectQuiz === 'function');
}
// Inject the 10 questions and answer the first n through the engine's own pick(), moving on each time.
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

test.describe('Quiz resume after the app closes', () => {
  test('same questions in the same order with answers kept, from the phone Home card', async ({ page }) => {
    await boot(page);
    await play(page, 7);
    const before = await page.evaluate(() => JSON.stringify(questions));
    expect((await saved(page)).log.length).toBe(7);
    expect((await saved(page)).current).toBe(6);   // saved on the 7th answer; moving on to the 8th is saved when the page goes

    await page.reload();   // fires pagehide: the quiz is saved on question 8
    await page.waitForLoadState('load');
    const card = page.locator('#ios-home [data-act="rec"][data-kind="quiz"]');
    await expect(card).toBeVisible({ timeout: 8000 });
    await expect(card).toContainText('Finish your quiz · 3 left');
    await expect(card).toContainText('Mixed topics · 7 of 10 answered');
    await expect(page.locator('#ios-home [data-act="fresh"]')).toHaveText('Start fresh');

    const aiBefore = page.__ai;
    await card.click();
    await expect(page.locator('#page-quiz')).toHaveClass(/active/);
    const st = await page.evaluate(() => ({ qs: JSON.stringify(questions), log: log.length, current, linked: log.every((e, i) => e.q === questions[i]), score }));
    expect(st.qs).toBe(before);
    expect(st.log).toBe(7);
    expect(st.current).toBe(7);
    expect(st.linked).toBe(true);
    await expect(page.locator('#q-label')).toHaveText('Question 8 of 10');
    await expect(page.locator('#q-text, .q-text').first()).toContainText('Resume stem 8');
    expect(page.__ai - aiBefore).toBe(0);
    expect(page.__ai).toBe(0);
  });

  test('Start fresh discards the save and the card goes', async ({ page }) => {
    await boot(page);
    await play(page, 3);
    await page.reload();
    await page.waitForLoadState('load');
    await expect(page.locator('#ios-home [data-kind="quiz"]')).toBeVisible({ timeout: 8000 });
    await page.locator('#ios-home [data-act="fresh"]').click();
    await expect(page.locator('#ios-home [data-kind="quiz"]')).toHaveCount(0);
    expect(await saved(page)).toBeNull();
  });

  test('expired (25h) and foreign-cert saves are discarded quietly', async ({ page }) => {
    await boot(page);
    await play(page, 4);
    await page.evaluate(() => showPage('setup'));   // off the quiz page, so the reload's pagehide doesn't save it again
    await expect(page.locator('#page-quiz')).not.toHaveClass(/active/);
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.savedAt = Date.now() - 25 * 3600000; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    await page.reload(); await page.waitForLoadState('load');
    await expect(page.locator('#ios-home .ih-rec').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#ios-home [data-kind="quiz"]')).toHaveCount(0);
    expect(await saved(page)).toBeNull();

    await play(page, 4);
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.cert = 'not-this-cert'; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    expect(await page.evaluate(() => resumeQuiz())).toBe(false);
    expect(await saved(page)).toBeNull();
  });

  test('going to the background saves the quiz on screen', async ({ page }) => {
    await boot(page);
    await play(page, 0);
    await page.evaluate(() => { current = 3; render(); toggleFlag(); });
    expect(await saved(page)).toBeNull();   // no answer yet: nothing saved until the app hides
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    const s = await saved(page);
    expect(s && s.current).toBe(3);
    expect(s.quizFlags[3]).toBe(true);
  });

  test('exit with ✕ clears it', async ({ page }) => {
    await boot(page);
    await play(page, 2);
    expect(await saved(page)).not.toBeNull();
    page.once('dialog', (d) => d.accept());
    await page.evaluate(() => confirmBack());
    await expect(page.locator('#page-quiz')).not.toHaveClass(/active/);
    expect(await saved(page)).toBeNull();
  });

  test('backgrounding during the ✕ exit (page still .active + .page-exit) does not re-save', async ({ page }) => {
    await boot(page);
    await play(page, 2);
    page.once('dialog', (d) => d.accept());
    const r = await page.evaluate((k) => {
      confirmBack();   // clears, then showPage('setup') starts the 300ms exit
      const pg = document.getElementById('page-quiz');
      pg.classList.add('active', 'page-exit');   // pin the outgoing state the exit holds for up to 300ms
      window.dispatchEvent(new Event('pagehide'));
      document.dispatchEvent(new Event('visibilitychange'));
      return localStorage.getItem(k);
    }, KEY);
    expect(r).toBeNull();
  });

  test('every question answered, results never opened: Home says "See your results"', async ({ page }) => {
    await boot(page);
    await play(page, 10);
    await page.reload(); await page.waitForLoadState('load');
    const card = page.locator('#ios-home [data-act="rec"][data-kind="quiz"]');
    await expect(card).toBeVisible({ timeout: 8000 });
    await expect(card).toContainText('See your results');
    await expect(card).toContainText('Mixed topics · all 10 answered');
    await expect(card).not.toContainText('0 left');
    expect((await saved(page)).log.length).toBe(10);   // Home never finishes it
  });

  test('finishing clears it', async ({ page }) => {
    await boot(page);
    await play(page, 10);
    expect(await saved(page)).not.toBeNull();
    await page.evaluate(() => nextQuestion());
    await expect(page.locator('#page-results')).toHaveClass(/active/, { timeout: 8000 });
    expect(await saved(page)).toBeNull();
  });

  test('gauntlet, why-not and exam never save', async ({ page }) => {
    await boot(page);
    for (const m of ['gauntletMode', 'whyNotMode', 'examMode']) {
      await page.evaluate(([qs, m, k]) => {
        localStorage.removeItem(k);
        window._testInjectQuiz(qs);
        if (m === 'gauntletMode') gauntletMode = true; else if (m === 'whyNotMode') whyNotMode = true; else examMode = true;
        pick(questions[0].answer, questions[0]);
        window.dispatchEvent(new Event('pagehide'));
        gauntletMode = false; whyNotMode = false; examMode = false;
      }, [QS, m, KEY]);
      expect(await saved(page), m).toBeNull();
    }
  });
});
