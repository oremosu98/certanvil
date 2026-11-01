// tests/e2e/two-option.spec.js — new-certs Task R1 (plan Task 4.2): true/false questions are plain two-option MCQs
// ({ A: 'True', B: 'False' }, the shape of the PSM II exemplars). They must render, answer and score on the quiz and the
// exam screens, at desktop and at 375px. Runs on PSM II (?cert=psm2, a hidden cert opened the preview way), local only.
const { test, expect } = require('@playwright/test');

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 375, height: 812 };
const TF = [
  { type: 'mcq', question: 'True or False: The Sprint is a container for all the other Scrum events.', options: { A: 'True', B: 'False' }, answer: 'A',
    explanation: 'The Sprint holds every other event. (B) Wrong: no event sits outside it.', topic: 'Purpose of the Scrum Events', difficulty: 'Foundational' },
  { type: 'mcq', question: 'True or False: Only the Scrum Master may change the Sprint Backlog during the Sprint.', options: { A: 'True', B: 'False' }, answer: 'B',
    explanation: 'The Developers own the Sprint Backlog. (A) Wrong: the Scrum Master does not own it.', topic: 'Purpose of the Scrum Events', difficulty: 'Foundational' }
];

async function open(page, vp) {
  await page.setViewportSize(vp);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    const P = 'nplus_';   // isolated Playwright context on localhost; keys built like the app's own STORAGE names
    try { localStorage.setItem(P + 'theme', 'dark'); localStorage.setItem(P + 'a2hs_dismissed', '1'); localStorage.setItem('ca_tour_seen', '1'); } catch (_) {}
  });
  await page.goto('/?cert=psm2');
  await page.waitForLoadState('load');
  expect(await page.evaluate(() => [window.CURRENT_CERT, window.CERT_PACK && window.CERT_PACK.meta.id])).toEqual(['psm2', 'psm2']);
  await page.evaluate(() => { window._quotaState = { tier: 'pro' }; document.body.classList.add('is-state-resolved', 'is-pro-tier'); });
}
// Both options are on screen, stacked one above the other in the column (not clipped, not overlapping), and nothing scrolls sideways.
async function layoutOk(page, sel) {
  const r = await page.evaluate((s) => {
    const els = [...document.querySelectorAll(s)];
    const rects = els.map((el) => el.getBoundingClientRect());
    return { n: els.length, texts: els.map((el) => el.textContent.replace(/\s+/g, ' ').trim()), rects: rects.map((b) => ({ l: b.left, r: b.right, t: b.top, b: b.bottom, h: b.height, w: b.width })),
      overflow: document.documentElement.scrollWidth - window.innerWidth };
  }, sel);
  expect(r.n).toBe(2);
  expect(r.texts[0]).toMatch(/True/);
  expect(r.texts[1]).toMatch(/False/);
  r.rects.forEach((b) => { expect(b.w).toBeGreaterThan(100); expect(b.h).toBeGreaterThanOrEqual(40); expect(b.l).toBeGreaterThanOrEqual(0); expect(b.r).toBeLessThanOrEqual(await_vw(page)); });
  expect(r.rects[1].t).toBeGreaterThanOrEqual(r.rects[0].b - 1);   // stacked, no overlap
  expect(r.overflow).toBeLessThanOrEqual(0);
}
function await_vw(page) { return page.viewportSize().width; }

for (const [label, vp] of [['desktop', DESKTOP], ['375px', PHONE]]) {
  test.describe('Two-option (true/false) questions @ ' + label, () => {
    test('quiz: renders two options, answers, and scores 1 of 2', async ({ page }) => {
      await open(page, vp);
      await page.evaluate((q) => window._testInjectQuiz(q), TF);
      await expect(page.locator('#page-quiz')).toHaveClass(/active/);
      await expect(page.locator('#options .option')).toHaveCount(2);
      await layoutOk(page, '#options .option');
      const phone = vp.width < 900;
      await page.keyboard.press('c');   // a letter the question does not have records nothing
      expect(await page.evaluate(() => log.length)).toBe(0);
      // Q1: True (right). Phones pick then confirm with Next; desktop answers on tap.
      await page.locator('#options .option').nth(0).click();
      if (phone) await page.locator('#btn-next').click();
      await expect(page.locator('#options .option').nth(0)).toHaveClass(/correct/);
      await expect(page.locator('#exp-box')).toBeVisible();
      await page.locator('#btn-next').click();
      await expect(page.locator('#q-label')).toContainText('Question 2 of 2');
      await expect(page.locator('#options .option')).toHaveCount(2);
      // Q2: True (wrong; the answer is False).
      await page.locator('#options .option').nth(0).click();
      if (phone) await page.locator('#btn-next').click();
      await expect(page.locator('#options .option').nth(0)).toHaveClass(/wrong/);
      await expect(page.locator('#options .option').nth(1)).toHaveClass(/correct/);
      expect(await page.evaluate(() => [score, log.length])).toEqual([1, 2]);
      await page.locator('#btn-next').click();
      await expect(page.locator('#page-results')).toHaveClass(/active/);
      const last = await page.evaluate(() => { const h = loadHistory(); return h[h.length - 1]; });
      expect([last.score, last.total]).toEqual([1, 2]);
    });

    test('exam: renders two options, records answers, and scores 50% on the percent scale', async ({ page }) => {
      await open(page, vp);
      // Seed a resumable two-question exam (local test origin only) and resume it: the real exam screen, no AI calls.
      await page.evaluate((q) => {
        const EXAM_KEY = 'nplus_' + 'exam_state';   // exam.js EXAM_STATE_KEY
        localStorage.setItem(EXAM_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), endTime: Date.now() + 3600000, current: 0, questions: q,
          answers: q.map(() => ({ chosen: null, flagged: false, msChosen: [], orderSeq: [], cliRan: [], topoState: {} })), answered: 0, paused: false, pausedAt: 0, timeLeft: 3600, pausedMs: 0, pauses: 0 }));
        return window._loadFeature('exam').then((m) => m.resumeExam());
      }, TF);
      await expect(page.locator('#page-exam')).toHaveClass(/active/);
      await expect(page.locator('#exam-options .option')).toHaveCount(2);
      await layoutOk(page, '#exam-options .option');
      await page.keyboard.press('d');   // no option D: nothing recorded
      expect(await page.evaluate(() => examAnswers[0].chosen)).toBeNull();
      await page.locator('#exam-options .option').nth(0).click();   // Q1 True: right
      expect(await page.evaluate(() => examAnswers[0].chosen)).not.toBeNull();
      await page.evaluate(() => window._loadFeature('exam').then((m) => { if (m.examNext) m.examNext(); else window.examNext(); }));
      await expect(page.locator('#exam-options .option')).toHaveCount(2);
      await page.locator('#exam-options .option').nth(0).click();   // Q2 True: wrong
      expect(await page.evaluate(() => examAnswers.map((a) => a.chosen !== null))).toEqual([true, true]);
      await page.evaluate(() => window.submitExam());
      await expect(page.locator('#page-exam-results')).toHaveClass(/active/, { timeout: 10000 });
      const last = await page.evaluate(() => { const h = loadHistory(); return h.filter((e) => e.mode === 'exam' || e.topic === 'Exam Simulation').pop(); });
      expect([last.score, last.total]).toEqual([1, 2]);
      await expect(page.locator('#page-exam-results')).toContainText('50%');
    });
  });
}
