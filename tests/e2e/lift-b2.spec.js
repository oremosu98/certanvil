// tests/e2e/lift-b2.spec.js — Lift B2 (exam and exam results at phone width).
// Spec: docs/superpowers/specs/2026-10-21-ios-lift-b2-design.md. E2E: feat/cert-ios-e2e (597e06e8, 47147981).
// Phones are 390x844 and 402x874; desktop is 1280x800 and must not change.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };
const TOPICS = ['DNS & DHCP', 'OSPF', 'PKI & Certificates', 'Cable Issues', 'Monitoring & SNMP'];

// A saved 12-question exam (7 answered, Q3 flagged, sitting on Q3), resumed the way Home resumes it.
async function openExam(page, viewport, o) {
  const opts = o || {};
  await page.setViewportSize(viewport);
  await page.addInitScript((op) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    const T = ['DNS & DHCP', 'OSPF', 'PKI & Certificates', 'Cable Issues', 'Monitoring & SNMP'];
    const qs = Array.from({ length: 12 }, (_, i) => ({ type: 'mcq', question: 'Sample exam question ' + (i + 1) + '?',
      options: { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta' }, answer: 'A', explanation: 'Because A.', topic: T[i % 5], difficulty: 'Exam Level' }));
    if (op.pbq) qs[0] = { type: 'simlab', question: 'Find the mask', topic: 'IPv4', explanation: '', simlab: { id: 'b2-pbq', cert: 'netplus', objective: '1.4', topic: 'IPv4',
      title: 'Find the mask', scenario: 'Branch cannot reach HQ.', estMinutes: 5,
      steps: [{ id: 'st1', type: 'fillin', prompt: 'Which mask?', points: 1, explanation: '/26', payload: { fields: [{ id: 'mask', label: 'Mask' }] }, answer: { mask: ['/26'] } }] } };
    const ans = qs.map((_, i) => ({ chosen: (i < 7 && !(op.pbq && i === 0)) ? (i % 3 ? 'A' : 'B') : null, flagged: i === 2, msChosen: [], orderSeq: [], cliRan: [], topoState: {} }));
    try {
      localStorage.setItem('nplus_theme', 'dark');
      localStorage.setItem('nplus_exam_state', JSON.stringify({ v: 1, savedAt: Date.now(), endTime: Date.now() + 84 * 60000, current: op.pbq ? 0 : 2, questions: qs, answers: ans,
        answered: 7, paused: !!op.paused, pausedAt: op.paused ? Date.now() - 60000 : 0, timeLeft: 5040, pausedMs: 0, pauses: op.paused ? 1 : 0 }));
    } catch (_) {}
  }, opts);
  await page.goto('/');
  await page.waitForLoadState('load');
  // the same path Home's resume tile takes (the exam module is lazy-loaded)
  await page.evaluate(async () => { const m = await _loadFeature('exam'); await m.resumeExam(); });
  await expect(page.locator('#page-exam')).toHaveClass(/active/);
}

async function submitExamViaDialog(page) {
  await page.locator('#page-exam .end-exam-btn').click();
  await page.locator('#exam-modal .btn-primary').click();
  await expect(page.locator('#page-exam-results')).toHaveClass(/active/);
}

for (const vp of PHONES) {
  test.describe('Lift B2 results @' + vp.width, () => {
    test('submitting shows the E2E results screen', async ({ page }) => {
      await openExam(page, vp);
      await submitExamViaDialog(page);
      const r = page.locator('#ios-exam-results');
      await expect(r.locator('.ie-done-title')).toBeVisible();
      await expect(r.locator('.ie-sc-stat')).toHaveCount(4);
      await expect(r.locator('.ie-drow')).toHaveCount(5);
      await expect(page.locator('#page-exam-results .exam-results-v2')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });

    test('Review all opens the review', async ({ page }) => {
      await openExam(page, vp);
      await submitExamViaDialog(page);
      await page.locator('#ios-exam-results [data-act="review"]').click();
      await expect(page.locator('#page-review')).toHaveClass(/active/);
    });

    test('Drill the gap starts a quiz on the topics it picked', async ({ page }) => {
      await openExam(page, vp);
      await submitExamViaDialog(page);
      await page.evaluate(() => { window.__t = null; window.startQuiz = () => { window.__t = topic; }; });
      await page.locator('#ios-exam-results [data-act="drill-gap"]').click();
      // the analytics module may still be loading (lazy), so wait for the quiz to start
      await expect.poll(() => page.evaluate(() => window.__t), { timeout: 5000 }).toMatch(/^Multi: /);
    });

    test('Retry the exam starts a new exam', async ({ page }) => {
      await openExam(page, vp);
      await submitExamViaDialog(page);
      await page.evaluate(() => { window.__retry = 0; window.startExam = () => { window.__retry++; }; });
      await page.locator('#ios-exam-results [data-act="retry"]').click();
      await expect.poll(() => page.evaluate(() => window.__retry)).toBe(1);
    });
  });
}

test.describe('Lift B2 desktop is unchanged', () => {
  test('desktop results keep their own page and leave #ios-exam-results empty', async ({ page }) => {
    await openExam(page, DESKTOP);
    await submitExamViaDialog(page);
    await expect(page.locator('#ios-exam-results')).toBeEmpty();
    await expect(page.locator('#page-exam-results .exam-results-v2')).toBeVisible();
  });
});

// ── Task 4: the exam screen itself ──
for (const vp of PHONES) {
  test.describe('Lift B2 exam @' + vp.width, () => {
    test('top bar reads "Question 3 of 12" and "7 answered", with the pace line under it', async ({ page }) => {
      await openExam(page, vp);
      const ex = page.locator('#page-exam');
      await expect(ex.locator('.ix-cn')).toHaveText('Question 3 of 12');
      await expect(ex.locator('.ix-cs')).toHaveText('7 answered');
      await expect(ex.locator('#exam-q-num')).toBeHidden();
      await expect(ex.locator('.end-exam-btn')).toHaveText(/^\s*End\s*$/, { useInnerText: true });
      const pace = ex.locator('#exam-pace');
      await expect(pace).toBeVisible();
      await expect(pace).toHaveText(/ahead|behind|on pace/);
      const cs = await ex.locator('.ix-cs').boundingBox(), pc = await pace.boundingBox();
      expect(pc.y).toBeGreaterThan(cs.y);
      await expect(ex.locator('.qnav-toggle')).toBeHidden();
      await expect(ex.locator('.quiz-kbd-hints')).toBeHidden();
      await expect(ex.locator('#exam-flag-btn')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });

    test('the dock is Prev, Flag, Next at the bottom of the screen', async ({ page }) => {
      await openExam(page, vp);
      const ex = page.locator('#page-exam');
      const prev = await ex.locator('#exam-prev-btn').boundingBox();
      const flag = await ex.locator('.ix-flag').boundingBox();
      const next = await ex.locator('#exam-next-btn').boundingBox();
      expect(prev.x).toBeLessThan(flag.x);
      expect(flag.x).toBeLessThan(next.x);
      expect(next.y + next.height).toBeGreaterThan(vp.height - 90);
      expect(next.y + next.height).toBeLessThanOrEqual(vp.height);
      await expect(ex.locator('#exam-next-btn')).toHaveText(/^\s*Next\s*$/, { useInnerText: true });
    });

    test('Flag in the dock toggles aria-pressed and the Flagged chip', async ({ page }) => {
      await openExam(page, vp);
      const ex = page.locator('#page-exam'), flag = ex.locator('.ix-flag');
      await expect(flag).toHaveAttribute('aria-pressed', 'true');
      await expect(ex.locator('.ix-flagged')).toBeVisible();
      await flag.click();
      await expect(flag).toHaveAttribute('aria-pressed', 'false');
      await expect(ex.locator('.ix-flagged')).toBeHidden();
      await flag.click();
      await expect(flag).toHaveAttribute('aria-pressed', 'true');
    });

    test('Next on the last question reads End and opens the End dialog', async ({ page }) => {
      await openExam(page, vp);
      const next = page.locator('#exam-next-btn');
      for (let i = 0; i < 9; i++) await next.click();
      await expect(page.locator('.ix-cn')).toHaveText('Question 12 of 12');
      await expect(next).toHaveText(/^\s*End\s*$/, { useInnerText: true });
      await next.click();
      await expect(page.locator('#exam-modal')).not.toHaveClass(/hidden/);
    });

    test('Pause covers the question and hides the dock; Resume brings it back', async ({ page }) => {
      await openExam(page, vp);
      const ex = page.locator('#page-exam'), pb = ex.locator('#exam-pause-btn');
      await pb.click();
      await expect(pb).toHaveAttribute('aria-label', 'Resume the exam');
      await expect(ex.locator('#exam-paused')).toBeVisible();
      await expect(ex.locator('#exam-paused')).toContainText(/\d+:\d\d left/);
      await expect(ex.locator('.exam-nav-row')).toBeHidden();
      await expect(ex.locator('.q-card')).toBeHidden();
      await ex.locator('#exam-paused .exam-paused-btn').click();
      await expect(ex.locator('.q-card')).toBeVisible();
      await expect(ex.locator('#exam-paused')).toHaveCount(0);
      await expect(pb).toHaveAttribute('aria-label', 'Pause the exam');
    });

    test('a Sim Lab question shows its console and Reset clears it', async ({ page }) => {
      await openExam(page, vp, { pbq: true });
      const ex = page.locator('#page-exam');
      await expect(ex.locator('.ix-cn')).toHaveText('Question 1 of 12');
      const field = ex.locator('.exam-pbq [data-field="mask"]');
      await expect(field).toBeVisible();
      await expect(ex.locator('.ix-cs')).toHaveText('6 answered');
      await field.fill('/26');
      // the counter refreshes on the next render: move on and come back
      await ex.locator('#exam-next-btn').click();
      await ex.locator('#exam-prev-btn').click();
      await expect(ex.locator('.ix-cs')).toHaveText('7 answered');
      await expect(ex.locator('.exam-pbq [data-field="mask"]')).toHaveValue('/26');
      page.once('dialog', d => d.accept());
      await ex.locator('.exam-pbq .sl-reset').click();
      await expect(ex.locator('.exam-pbq [data-field="mask"]')).toHaveValue('');
      await expect(ex.locator('.ix-cs')).toHaveText('6 answered');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(vp.width);
    });
  });
}

test.describe('Lift B2 exam desktop is unchanged', () => {
  test('desktop keeps End Exam, the navigator and the kbd hints', async ({ page }) => {
    await openExam(page, DESKTOP);
    const ex = page.locator('#page-exam');
    await expect(ex.locator('.end-exam-btn')).toHaveText(/End Exam/, { useInnerText: true });
    await expect(ex.locator('.qnav-toggle')).toBeVisible();
    await expect(ex.locator('.quiz-kbd-hints')).toBeVisible();
    await expect(ex.locator('#exam-q-num')).toHaveText('Q3 / 12');
    await expect(ex.locator('.ix-flag')).toBeHidden();
    await expect(ex.locator('.ix-cn')).toBeHidden();
    await expect(ex.locator('#exam-next-btn')).toHaveText(/Next/, { useInnerText: true });
  });
});
