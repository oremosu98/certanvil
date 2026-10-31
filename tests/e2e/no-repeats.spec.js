// Persona bundle Task 7: no repeat questions across days (features/seen-questions.js).
// startQuiz drops questions answered in the last 30 days and tops up; finish() records what was
// answered; the offline cache is refused when it was answered in the last 7 days.
// Generation is stubbed in the page (fetchQuestions / aiValidateQuestions / validateQuestions).
// Spec: docs/superpowers/specs/2026-10-30-why-score-bookit-repeats-design.md §3
const { test, expect } = require('@playwright/test');

const SEED = { nplus_theme: 'dark', nplus_a2hs_dismissed: '1', ca_tour_seen: '1' };
const Q = (i) => ({
  question: 'Repeat-check stem ' + i + ': which port does service ' + i + ' listen on?',
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
  await page.waitForFunction(() => typeof window.seenFilter === 'function' && typeof window.startQuiz === 'function');
  await page.evaluate((qs) => {
    window.__Q = qs; window.__tele = []; window.__calls = 0;
    document.getElementById('api-key').value = 'sk-ant-test-0000000000000000';   // a fake key: generation is stubbed
    window.fetchTopicBrief = () => {};
    window.aiValidateQuestions = async (k, raw) => raw;
    window.validateQuestions = (raw) => raw;
    window._logValidatorTelemetry = (rows) => { window.__tele.push(rows[0]); };
    topic = 'Ports & Protocols'; diff = 'Exam Level'; qCount = 5;
  }, Array.from({ length: 20 }, (_, i) => Q(i)));
}

test.describe('No repeat questions across days', () => {
  test('answered questions are dropped and topped up; finish records the new ones', async ({ page }) => {
    await boot(page);
    const out = await page.evaluate(async () => {
      seenRecord([__Q[0], __Q[1]], 'Ports & Protocols');
      // First call: 8 questions, two already answered. Top-up: fresh ones.
      window.fetchQuestions = async (k, t, d, n) => (++__calls === 1 ? __Q.slice(0, n) : __Q.slice(10, 10 + n));
      await startQuiz();
      const fill = __tele.find((r) => r.type === 'telemetry:quiz-fill');
      return { stems: questions.map((q) => q.question), rounds: fill && fill.extra.rounds, msg: fill && fill.message };
    });
    expect(out.stems).toHaveLength(5);
    expect(out.stems.some((s) => /stem [01]:/.test(s))).toBe(false);
    expect(out.rounds).toContainEqual({ label: 'repeats', dropped: 2 });
    expect(out.msg).toContain('repeats -2');
    await expect(page.locator('#page-quiz')).toHaveClass(/active/);

    // Answer every question through the engine's own pick(), then Next on the last one finishes.
    const recorded = await page.evaluate(() => {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[current];
        pick(q.answer, q);
        if (i < questions.length - 1) { current = i + 1; render(); }
      }
      nextQuestion();
      return JSON.parse(localStorage.getItem('nplus_seen_q'))[CURRENT_CERT].length;
    });
    expect(recorded).toBe(7);
  });

  test('the offline cache is refused when it was answered in the last 7 days', async ({ page }) => {
    await boot(page);
    const res = await page.evaluate(async () => {
      window.fetchQuestions = async () => { throw new Error('network down'); };
      cacheQuestions(topic, diff, qCount, __Q.slice(0, 5));
      seenRecord([__Q[2]], 'Ports & Protocols');
      await startQuiz();
      const refused = { quiz: document.getElementById('page-quiz').classList.contains('active'),
        err: !document.getElementById('setup-err').classList.contains('is-hidden') };
      cacheQuestions(topic, diff, qCount, __Q.slice(5, 10));
      await startQuiz();
      return { refused, servedStems: questions.map((q) => q.question) };
    });
    expect(res.refused).toEqual({ quiz: false, err: true });
    expect(res.servedStems[0]).toContain('stem 5:');
    await expect(page.locator('#page-quiz')).toHaveClass(/active/);
  });
});
