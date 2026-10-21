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
    const ans = qs.map((_, i) => ({ chosen: i < 7 ? (i % 3 ? 'A' : 'B') : null, flagged: i === 2, msChosen: [], orderSeq: [], cliRan: [], topoState: {} }));
    try {
      localStorage.setItem('nplus_theme', 'dark');
      localStorage.setItem('nplus_exam_state', JSON.stringify({ v: 1, savedAt: Date.now(), endTime: Date.now() + 84 * 60000, current: 2, questions: qs, answers: ans,
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
