// Persona bundle Task 8 (31 Oct fast-start): the quiz opens on the first writer batch that
// has passed the checker, the local checks and the repeat filter; later batches append while
// the person answers. Catching up shows "Next question coming…"; a failed last batch ends the
// set short with the existing pill. Telemetry carries firstQuestionMs.
// The proxy is stubbed one level up, at _fetchQuestionsBatch (one call per writer batch), so the
// real fetchQuestions batching and its onBatch hook run. Checker and local checks pass through.
// Spec: docs/superpowers/specs/2026-10-30-ai-budget-fast-start-suggest-design.md §2
const { test, expect } = require('@playwright/test');

const SEED = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' };
const Q = (i) => ({
  question: 'Fast-start stem ' + i + ': which port does service ' + i + ' listen on?',
  options: ['Port 1' + i, 'Port 2' + i, 'Port 3' + i, 'Port 4' + i], answer: 'B',
  explanation: 'Service ' + i + ' explanation.', topic: 'Ports & Protocols', difficulty: 'Exam Level'
});

async function boot(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  // localhost-only fixture seeds, in this test's own isolated browser context
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (_) {}
  }, SEED);
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof window.startQuiz === 'function' && typeof window._fetchQuestionsBatch === 'function');
  await page.evaluate((qs) => {
    window.__Q = qs; window.__tele = []; window.__calls = 0; window.__done = {};
    document.getElementById('api-key').value = 'sk-ant-test-0000000000000000';   // a fake key: generation is stubbed
    window.fetchTopicBrief = () => {};
    window.aiValidateQuestions = async (k, raw) => raw;
    window.validateQuestions = (raw) => raw;
    window.injectPBQs = (q) => q;
    window._logValidatorTelemetry = (rows) => { window.__tele.push(rows[0]); };
    topic = 'Ports & Protocols'; diff = 'Exam Level'; qCount = 12;   // 12 + 4 buffer = 16 → two batches of 8
  }, Array.from({ length: 40 }, (_, i) => Q(i)));
}

test.describe('Fast start: first question on the first checked batch', () => {
  test('first question renders before the slow batch resolves', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => {
      // Batch 1 lands at 50ms, batch 2 at 2.5s.
      window._fetchQuestionsBatch = (k, t, d, n) => {
        const c = ++__calls, delay = c === 1 ? 50 : 2500, start = c === 1 ? 0 : 20;
        return new Promise((r) => setTimeout(() => { __done[c] = true; r(__Q.slice(start, start + n)); }, delay));
      };
      window.__p = startQuiz();
    });
    await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 2000 });
    const early = await page.evaluate(() => ({ slowDone: !!__done[2], n: questions.length,
      label: document.getElementById('q-label').textContent, text: document.getElementById('q-text').textContent }));
    expect(early.slowDone).toBe(false);
    expect(early.n).toBe(8);
    expect(early.label).toBe('Question 1 of 12');
    expect(early.text).toContain('Fast-start stem 0');
    const late = await page.evaluate(async () => { await __p; return { n: questions.length, cur: current, dots: document.querySelectorAll('#quiz-prog-dots .qpd-cell').length }; });
    expect(late).toEqual({ n: 12, cur: 0, dots: 12 });
  });

  test('catch-up then short finish', async ({ page }) => {
    test.setTimeout(30000);
    await boot(page);
    await page.evaluate(() => {
      // Batch 1: 3 questions at 50ms. Batch 2 and every top-up batch: a 500 after 1.2s.
      window._fetchQuestionsBatch = (k, t, d, n) => {
        const c = ++__calls;
        if (c === 1) return new Promise((r) => setTimeout(() => r(__Q.slice(0, 3)), 50));
        return new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('API error 500'), { apiError: true })), 1200));
      };
      window.__p = startQuiz();
    });
    await expect(page.locator('#page-quiz')).toHaveClass(/active/, { timeout: 2000 });
    // Answer the three that arrived, through the real buttons.
    for (let i = 0; i < 3; i++) {
      await page.locator('#options .option').nth(1).click();
      await expect(page.locator('#btn-next')).toHaveClass(/show/);
      await page.locator('#btn-next').click();
      if (i < 2) await expect(page.locator('#q-label')).toHaveText('Question ' + (i + 2) + ' of 12');
    }
    await expect(page.locator('#q-wait')).toBeVisible();
    await expect(page.locator('#q-wait')).toHaveText('Next question coming…');
    await expect(page.locator('#btn-next')).toBeDisabled();
    // The last batch fails and the top-ups fail: the quiz finishes short.
    await expect(page.locator('#page-results')).toHaveClass(/active/, { timeout: 15000 });
    const pill = await page.evaluate(() => { const p = document.getElementById('short-notice'); return { show: p.classList.contains('show'), text: p.textContent, title: p.title }; });
    expect(pill).toEqual({ show: true, text: '3 of 12', title: "The AI stopped responding partway, so 9 weren't made." });
    await expect(page.locator('#q-wait')).toBeHidden();
  });

  test('telemetry carries firstQuestionMs', async ({ page }) => {
    await boot(page);
    const fill = await page.evaluate(async () => {
      window._fetchQuestionsBatch = (k, t, d, n) => {
        const c = ++__calls, delay = c === 1 ? 50 : 600;
        return new Promise((r) => setTimeout(() => r(__Q.slice(c * 10, c * 10 + n)), delay));
      };
      await startQuiz();
      return __tele.find((r) => r.type === 'telemetry:quiz-fill');
    });
    expect(fill.extra.source).toBe('fresh');
    expect(fill.extra.served).toBe(12);
    expect(typeof fill.extra.firstQuestionMs).toBe('number');
    expect(fill.extra.firstQuestionMs).toBeGreaterThanOrEqual(40);
    expect(fill.extra.firstQuestionMs).toBeLessThan(600);   // before the slow batch landed
    expect(fill.message).toMatch(/ · first \d+ms$/);
  });
});
