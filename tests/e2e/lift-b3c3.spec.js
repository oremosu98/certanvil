// Lift B3c3 (v8.192.0): Decision Lab and its Exam-style on phones, against cert-ios-decisionlab.html.
// Runs on a 20-scenario analyze fixture (copied from decision-lab.spec.js installSeedFixture, never imported: importing
// a spec re-registers its tests). The real seed rotates its start by the minute and mixes in non-analyze steps.
const { test, expect } = require('@playwright/test');

const PHONES = [{ width: 390, height: 844 }, { width: 402, height: 874 }];
const DESKTOP = { width: 1280, height: 800 };

async function boot(page, viewport, tier) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    try { localStorage.setItem('nplus_theme', 'dark'); localStorage.setItem('nplus_a2hs_dismissed', '1'); } catch (_) {}   // the iOS Safari install banner would cover the docks
  });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.evaluate(() => new Promise((res) => { window.CURRENT_CERT = 'az900'; window._ensureDecisionLabLoaded(res); }));
  await installSeedFixture(page, 20);
  await page.evaluate(() => { window.CERT_PACK = Object.assign({}, window.CERT_PACK, { meta: Object.assign({}, (window.CERT_PACK || {}).meta, { name: 'Azure Fundamentals', code: 'AZ-900' }) }); });
  await setTier(page, tier || 'pro');
}
function installSeedFixture(page, count) {
  return page.evaluate((count) => {
    function scn(i) {
      return {
        id: 'DL-FX-' + i, cert: 'az900', objective: '1.1', topic: 'Cost tools', title: 'Decision ' + i, scenario: 'A team needs X.',
        estMinutes: 2, pair: 'Pricing Calculator vs TCO Calculator', family: 'Cost & pricing tools',   // one pair: the set's start rotates by the minute
        steps: [{
          id: 's1', type: 'analyze', points: 1, prompt: 'Pick the best service', explanation: 'Compare two worlds.',
          payload: { multi: false, lines: [
            { id: 'a', text: 'Pricing Calculator', why: 'No on-prem baseline.' },
            { id: 'b', text: 'TCO Calculator' },
            { id: 'c', text: 'Cost Management', why: 'Needs live Azure usage.' },
            { id: 'd', text: 'Azure Advisor', why: 'Needs deployed resources.' }
          ] },
          answer: { selected: ['b'] }
        }]
      };
    }
    window.DECISION_LAB_SEED_AZ900 = Array.from({ length: count }, (_, i) => scn(i + 1));
  }, count);
}
async function setTier(page, tier) {
  await page.evaluate((t) => {
    window._quotaState = t === 'pro' ? { tier: 'pro' } : { tier: 'free', used_today: 0, daily_limit: 15 };
    document.body.classList.add('is-state-resolved');
    document.body.classList.toggle('is-pro-tier', t === 'pro');
  }, tier);
}
// Opens the entry the way a person does: from Drills (or Home with from: 'setup').
async function openEntry(page, vp, tier, from) {
  await boot(page, vp, tier);
  const origin = from === 'setup' ? 'setup' : 'drills';
  await page.evaluate((f) => { showPage(f); }, origin);
  await expect(page.locator('#page-' + origin)).toHaveClass(/active/, { timeout: 10000 });   // let the switch settle before the next one
  await page.waitForTimeout(150);
  await setTier(page, tier || 'pro');   // signed out, the app resets _quotaState after load
  await page.evaluate(() => decisionLabOpenEntry());
  await expect(page.locator('#page-decision-lab-entry')).toHaveClass(/active/, { timeout: 10000 });
}
module.exports = { boot, setTier, openEntry };

// Starts a practice set of n decisions from the entry (Pro unless tier says otherwise).
async function startPractice(page, vp, tier, n) {
  await openEntry(page, vp, tier || 'pro');
  if (n && n !== 10) await page.evaluate((k) => decisionLabPickDecisions(k), n);
  await page.evaluate(() => decisionLabSessionStart());
  await expect(page.locator('#page-decision-lab')).toHaveClass(/active/, { timeout: 10000 });
  await expect(page.locator('#dl-body .sl-analyze-line').first()).toBeVisible();
}
// Starts an Exam-style set of n decisions (Pro).
async function startExam(page, vp, n) {
  await openEntry(page, vp, 'pro');
  await page.evaluate((k) => { decisionLabPickMode('exam'); if (k !== 10) decisionLabPickDecisions(k); decisionLabSessionStart(); }, n || 10);
  await expect(page.locator('#page-decision-lab')).toHaveClass(/active/, { timeout: 10000 });
  await expect(page.locator('#dl-body .sl-analyze-line').first()).toBeVisible();
}
// Clicks an analyze line: the right one, or the first wrong one.
async function pickLine(page, right) {
  const ids = await page.evaluate(() => { const s = window._simLab.dlSession(); const st = s.scenarios[s.idx].steps[0]; return (st.answer && st.answer.selected) || []; });
  const lines = page.locator('#dl-body .sl-analyze-line');
  const n = await lines.count();
  for (let i = 0; i < n; i++) {
    const id = await lines.nth(i).getAttribute('data-line');
    if ((ids.indexOf(id) !== -1) === !!right) { await lines.nth(i).click(); return; }
  }
}

for (const vp of PHONES) {
  test.describe('Lift B3c3 entry @' + vp.width, () => {
    test('June entry replaces the desktop card; tab bar stays; no app top bar', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await expect(page.locator('#idl-entry .idl-start')).toBeVisible();
      await expect(page.locator('#page-decision-lab-entry .gnt-shell')).toBeHidden();
      await expect(page.locator('#lift-tabbar')).toBeVisible();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#idl-entry .idl-mode')).toHaveCount(2);
      await expect(page.locator('#idl-entry .idl-seg button')).toHaveCount(3);
      await expect(page.locator('#idl-entry .idl-pro')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
    test('free: Exam-style and 20 open today\'s gates and keep Practice · 10', async ({ page }) => {
      await openEntry(page, vp, 'free');
      await page.evaluate(() => { window.__gates = []; window._gateProOnly = function (f, o) { window.__gates.push(o && o.title); return false; }; });
      await setTier(page, 'free');
      await expect(page.locator('#idl-entry .idl-pro')).toHaveCount(1);
      await page.locator('#idl-entry [data-mode="exam"]').click();
      await page.locator('#idl-entry [data-n="20"]').click();
      expect(await page.evaluate(() => window.__gates)).toEqual(['Exam-style mode is Pro', 'The full 20-decision set is Pro']);
      await expect(page.locator('#idl-entry [data-mode="practice"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#idl-entry [data-n="10"]')).toHaveAttribute('aria-pressed', 'true');
    });
    test('Pro: picking Exam-style and 5 updates the cards and the Start count', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await page.locator('#idl-entry [data-mode="exam"]').click();
      await page.locator('#idl-entry [data-n="5"]').click();
      await expect(page.locator('#idl-entry [data-mode="exam"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#idl-entry [data-n="5"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#idl-entry .idl-qc')).toHaveText('5 decisions');
    });
    test('back goes where Decision Lab was opened from', async ({ page }) => {
      await openEntry(page, vp, 'pro', 'drills');
      await page.locator('#idl-entry .idl-back').click();
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 10000 });
    });
    test('Leave stops the clock and a new set starts clean', async ({ page }) => {
      await openEntry(page, vp, 'pro');
      await page.locator('#idl-entry [data-mode="exam"]').click();
      await page.locator('#idl-entry .idl-start').click();
      await expect(page.locator('#page-decision-lab')).toHaveClass(/active/, { timeout: 10000 });
      await page.evaluate(() => decisionLabExit());
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 10000 });
      await page.waitForTimeout(1300);
      expect(await page.evaluate(() => !!document.querySelector('#page-decision-lab-result.active'))).toBe(false);
      await page.evaluate(() => decisionLabOpenEntry());
      await page.locator('#idl-entry [data-mode="practice"]').click();
      await page.locator('#idl-entry .idl-start').click();
      await expect(page.locator('#dl-round-pill')).toHaveText('Decision 1 of 10', { timeout: 5000 });
    });
  });
}

for (const vp of PHONES) {
  test.describe('Lift B3c3 practice @' + vp.width, () => {
    test('practice: header, dots, docked Submit, no tab bar or top bar', async ({ page }) => {
      await startPractice(page, vp);
      await expect(page.locator('#page-decision-lab')).toHaveClass(/idl-practice/);
      await expect(page.locator('#lift-tabbar')).toBeHidden();
      await expect(page.locator('#app-topbar')).toBeHidden();
      await expect(page.locator('#dl-round-pill')).toHaveText('Decision 1 of 10');
      await expect(page.locator('#dl-dots .dl-dot')).toHaveCount(10);
      await expect(page.locator('#page-decision-lab [data-action="decisionLabExit"]')).toHaveAttribute('aria-label', 'Leave Decision Lab');
      await expect(page.locator('#dl-body .isl-scn-k')).toHaveText('Scenario');
      const sub = page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]');
      await expect(sub).toHaveText('Submit');
      expect(await sub.evaluate((b) => getComputedStyle(b.closest('.sl-actions')).position)).toBe('fixed');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
    test('Submit grades in place: Best, Your pick, the tell; Next decision takes the dock', async ({ page }) => {
      await startPractice(page, vp);
      await pickLine(page, false);
      await page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]').click();
      await expect(page.locator('#dl-body .dl-correct .dl-verdict')).toHaveText('Best');
      await expect(page.locator('#dl-body .dl-picked-wrong .dl-verdict')).toHaveText('Your pick');
      await expect(page.locator('#dl-body .dl-teach-k')).toHaveText('The tell');
      await expect(page.locator('#dl-body .sl-actions button')).toHaveCount(1);
      await expect(page.locator('#dl-body .sl-actions button')).toHaveText('Next decision');
      await expect(page.locator('#dl-body')).not.toContainText('Flag');
      await page.locator('#dl-body .sl-actions button').click();
      await expect(page.locator('#dl-round-pill')).toHaveText('Decision 2 of 10');
      await expect(page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]')).toHaveText('Submit');
    });
    test('the last decision says See results and opens the results', async ({ page }) => {
      await startPractice(page, vp, 'pro', 5);
      for (let i = 0; i < 5; i++) {
        await pickLine(page, i % 2 === 0);
        await page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]').click();
        await expect(page.locator('#dl-body .sl-actions button')).toHaveText(i === 4 ? 'See results' : 'Next decision');
        await page.locator('#dl-body .sl-actions button').click();
      }
      await expect(page.locator('#page-decision-lab-result')).toHaveClass(/active/, { timeout: 10000 });
    });
    test('‹ asks before leaving; Keep going stays; Leave exits', async ({ page }) => {
      await startPractice(page, vp, 'free');
      const back = page.locator('#page-decision-lab [data-action="decisionLabExit"]');
      await back.click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Leave Decision Lab?');
      await expect(page.locator('#exam-sheet')).toContainText('Your decisions so far won’t count. Today’s free set is already used.');
      await page.locator('#exam-sheet .ix-sheet-stay').click();
      await expect(page.locator('#exam-sheet')).toBeHidden();
      await expect(page.locator('#page-decision-lab')).toHaveClass(/active/);
      await back.click();
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 10000 });
      expect(await page.evaluate(() => window._simLab.dlSession())).toBeNull();
    });
  });
}

for (const vp of PHONES) {
  test.describe('Lift B3c3 Exam-style @' + vp.width, () => {
    const SUB = '#dl-body .sl-actions [data-action="simLabSubmitScenario"]';
    test('Exam-style: the bar, Decision N of M, answered count; Submit moves on with no reveal', async ({ page }) => {
      await startExam(page, vp, 10);
      await expect(page.locator('#page-decision-lab')).toHaveClass(/idl-exam/);
      await expect(page.locator('#isl-xbar .isl-xtl')).toHaveText('Time left');
      await expect(page.locator('#isl-xbar .sl-clock')).toBeVisible();
      await expect(page.locator('#isl-xbar .isl-xcn')).toHaveText('Decision 1 of 10');
      await expect(page.locator('#isl-xbar .isl-xcs')).toHaveText('0 answered');
      await expect(page.locator('#isl-xstrip i')).toHaveCount(10);
      await expect(page.locator('#page-decision-lab .dl-sbar')).toBeHidden();
      await expect(page.locator(SUB)).toHaveText('Submit');
      await pickLine(page, false);
      await page.locator(SUB).click();
      await expect(page.locator('#isl-xbar .isl-xcn')).toHaveText('Decision 2 of 10');
      await expect(page.locator('#isl-xbar .isl-xcs')).toHaveText('1 answered');
      await expect(page.locator('#dl-body .dl-graded')).toHaveCount(0);
      await expect(page.locator(SUB)).toHaveText('Submit');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
    test('the last decision says Submit and see results', async ({ page }) => {
      await startExam(page, vp, 5);
      for (let i = 0; i < 4; i++) { await pickLine(page, true); await page.locator(SUB).click(); await expect(page.locator('#isl-xbar .isl-xcn')).toHaveText('Decision ' + (i + 2) + ' of 5'); }
      await expect(page.locator(SUB)).toHaveText('Submit and see results');
      await page.locator(SUB).click();
      await expect(page.locator('#page-decision-lab-result')).toHaveClass(/active/, { timeout: 10000 });
      await expect(page.locator('#isl-xbar')).toHaveCount(0);
    });
    test('End opens the variant dialog; Submit and see results ends the set', async ({ page }) => {
      await startExam(page, vp, 10);
      await pickLine(page, true); await page.locator(SUB).click();
      await page.locator('#isl-xbar .isl-xend').click();
      const end = page.locator('#isl-end');
      await expect(end).toBeVisible();
      await expect(end.locator('.ed-modalhead-eyebrow')).toHaveText('Decision Lab · Exam-style');
      await expect(end.locator('#isl-end-title')).toHaveText('Submit set?');
      await expect(end.locator('.ms-lbl')).toHaveText(['Answered', 'Skipped']);
      await expect(end.locator('.ms-val')).toHaveText(['1', '9']);
      await expect(end.locator('[data-act="review"], .ix-jump')).toHaveCount(0);
      await expect(end.locator('[data-act="abandon"]')).toHaveText('Abandon set');
      await end.locator('[data-act="submit"]').click();
      await expect(page.locator('#page-decision-lab-result')).toHaveClass(/active/, { timeout: 10000 });
      await expect(end).toBeHidden();
    });
    test('Abandon set asks, Abandon leaves', async ({ page }) => {
      await startExam(page, vp, 10);
      await page.locator('#isl-xbar .isl-xend').click();
      await page.locator('#isl-end [data-act="abandon"]').click();
      await expect(page.locator('#exam-sheet-title')).toHaveText('Abandon this set?');
      await expect(page.locator('#exam-sheet')).toContainText('Nothing from it will count.');
      await page.locator('#exam-sheet .ix-sheet-go').click();
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 10000 });
      await expect(page.locator('#isl-end')).toBeHidden();
      await expect(page.locator('#isl-xbar')).toHaveCount(0);
      expect(await page.evaluate(() => window._simLab.dlSession())).toBeNull();
    });
    test('time-up closes the End dialog and the sheet', async ({ page }) => {
      await startExam(page, vp, 10);
      await pickLine(page, true); await page.locator(SUB).click();
      await page.locator('#isl-xbar .isl-xend').click();
      await page.locator('#isl-end [data-act="abandon"]').click();
      await expect(page.locator('#exam-sheet')).toBeVisible();
      await page.evaluate(() => { window._simLab.dlSession().deadlineMs = Date.now() - 1; window._simLab.dlTick(); });
      await expect(page.locator('#page-decision-lab-result')).toHaveClass(/active/, { timeout: 10000 });
      await expect(page.locator('#isl-end')).toBeHidden();
      await expect(page.locator('#exam-sheet')).toBeHidden();
      const r = await page.evaluate(() => { const s = window._simLab.dlSession(); return { up: s.timeUp, n: s.results.length, unreached: s.results.slice(1).every((x) => !x.passed) }; });
      expect(r).toEqual({ up: true, n: 10, unreached: true });
    });
  });
}

// Plays a practice set of n, right on even decisions, wrong (the first wrong line, "Pricing Calculator") on odd ones.
async function playPractice(page, n) {
  for (let i = 0; i < n; i++) {
    await pickLine(page, i % 2 === 0);
    await page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]').click();
    await page.locator('#dl-body .sl-actions button').click();
  }
  await expect(page.locator('#page-decision-lab-result')).toHaveClass(/active/, { timeout: 10000 });
}
for (const vp of PHONES) {
  test.describe('Lift B3c3 results @' + vp.width, () => {
    test('results: N of M right calls, look-alikes, families, decision rows that open', async ({ page }) => {
      await startPractice(page, vp, 'pro', 5);
      await playPractice(page, 5);
      const R = page.locator('#dl-result-root');
      await expect(R.locator('.idl-vkick')).toHaveText('Decision Lab · Practice · AZ-900');
      await expect(R.locator('.idl-vtitle')).toHaveText('3 of 5 right calls');
      await expect(R.locator('.idl-conf .idl-pr')).toHaveText('Pricing Calculator vs TCO Calculator');
      await expect(R.locator('.idl-conf .idl-tag')).toHaveText('Missed ×2');
      await expect(R.locator('.idl-chips span')).toHaveText(['Cost & pricing tools']);
      await expect(R.locator('.idl-srow')).toHaveCount(5);
      await expect(R.locator('.idl-srow .idl-sv')).toHaveText(['Right', 'Wrong', 'Right', 'Wrong', 'Right']);
      const t1 = await page.evaluate(() => window._simLab.dlSession().results[1].scenario.title);
      await expect(R.locator('.idl-srow .idl-st').nth(1)).toHaveText(t1);
      await expect(page.locator('#dl-result-root .dl-score-row')).toHaveCount(0);
      await expect(page.locator('#lift-tabbar')).toBeHidden();
      const row = R.locator('.idl-srow').nth(1);
      await row.click();
      await expect(row).toHaveAttribute('aria-expanded', 'true');
      const det = R.locator('#idl-sdet-1');
      await expect(det).toBeVisible();
      await expect(det.locator('.idl-lab')).toHaveText(['Your pick', 'Right call', 'The tell']);
      await expect(det.locator('.idl-val')).toHaveText(['Pricing Calculator', 'TCO Calculator']);
      await row.click();
      await expect(det).toBeHidden();
      await expect(R.locator('.idl-vdock [data-act="again"]')).toHaveText('Run another set');
      await expect(R.locator('.idl-vdock [data-act="exit"]')).toHaveText('Back to Drills');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
    test('Run another set starts a new set; Back goes to the origin', async ({ page }) => {
      await startPractice(page, vp, 'pro', 5);
      await playPractice(page, 5);
      await page.locator('#dl-result-root [data-act="again"]').click();
      await expect(page.locator('#page-decision-lab')).toHaveClass(/active/, { timeout: 10000 });
      await expect(page.locator('#dl-round-pill')).toHaveText('Decision 1 of 5');
      await playPractice(page, 5);
      await page.locator('#dl-result-root [data-act="exit"]').click();
      await expect(page.locator('#page-drills')).toHaveClass(/active/, { timeout: 10000 });
    });
    test("free Run another set opens today's gate", async ({ page }) => {
      await startPractice(page, vp, 'free');
      await page.evaluate(() => window._simLab.dlExamSubmit(false));   // ends the set: unreached decisions score as missed
      await expect(page.locator('#page-decision-lab-result')).toHaveClass(/active/, { timeout: 10000 });
      await page.evaluate(() => { window.__gates = []; window._gateProOnly = function (f, o) { window.__gates.push(o && o.title); return false; }; });
      await page.locator('#dl-result-root [data-act="again"]').click();
      expect(await page.evaluate(() => window.__gates)).toEqual(['That’s today’s free set'.replace(/’/g, "'")]);
      await expect(page.locator('#page-decision-lab-result')).toHaveClass(/active/);
    });
    test("Exam-style time-up: the kicker says Time's up and unreached decisions read No answer", async ({ page }) => {
      await startExam(page, vp, 5);
      await pickLine(page, true); await page.locator('#dl-body .sl-actions [data-action="simLabSubmitScenario"]').click();
      await page.evaluate(() => { window._simLab.dlSession().deadlineMs = Date.now() - 1; window._simLab.dlTick(); });
      const R = page.locator('#dl-result-root');
      await expect(R.locator('.idl-vkick')).toHaveText('Decision Lab · Exam-style · Time’s up', { timeout: 10000 });
      await expect(R.locator('.idl-vtitle')).toHaveText('1 of 5 right calls');
      await R.locator('.idl-srow').nth(3).click();
      await expect(R.locator('#idl-sdet-3 .idl-val').first()).toHaveText('No answer');
    });
  });
}

test.describe('Lift B3c3 desktop', () => {
  test("today's entry; Leave on the runner now leaves", async ({ page }) => {
    await openEntry(page, DESKTOP, 'pro', 'drills');
    await expect(page.locator('#page-decision-lab-entry .gnt-shell')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('idl-entry').innerHTML)).toBe('');
    await page.locator('#dl-start').click();
    await expect(page.locator('#page-decision-lab')).toHaveClass(/active/, { timeout: 10000 });
    await page.locator('#page-decision-lab [data-action="decisionLabExit"]').click();
    await expect(page.locator('#page-decision-lab')).not.toHaveClass(/active/, { timeout: 10000 });
  });
  test("practice is today's: inline Submit, Next decision with the arrow, the Flag row", async ({ page }) => {
    await openEntry(page, DESKTOP, 'pro', 'drills');
    await page.locator('#dl-start').click();
    await expect(page.locator('#dl-body .sl-analyze-line').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#page-decision-lab')).not.toHaveClass(/idl-practice/);
    const sub = page.locator('#dl-body [data-action="simLabSubmitScenario"]');
    await expect(sub).toHaveText('Submit answers');
    expect(await sub.evaluate((b) => getComputedStyle(b.closest('.sl-actions')).position)).not.toBe('fixed');
    await pickLine(page, false);
    await sub.click();
    await expect(page.locator('#dl-body .dl-correct .dl-verdict')).toHaveText('✓ Best');
    await expect(page.locator('#dl-body .dl-cta-row .dl-cta')).toHaveText(['Flag', 'Next decision →']);
  });
  test("results are today's; Back to Practice now leaves", async ({ page }) => {
    await openEntry(page, DESKTOP, 'pro', 'drills');
    await page.evaluate(() => { decisionLabPickDecisions(5); decisionLabSessionStart(); window._simLab.dlExamSubmit(false); });
    await expect(page.locator('#page-decision-lab-result')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('#dl-result-root .dl-score-row')).toHaveCount(1);
    await expect(page.locator('#dl-result-root .idl-vbody')).toHaveCount(0);
    await page.locator('#dl-result-root [data-action="decisionLabExit"]').click();
    await expect(page.locator('#page-setup')).toHaveClass(/active/, { timeout: 10000 });
  });
});
