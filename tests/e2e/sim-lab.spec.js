const { test, expect } = require('@playwright/test');

// Loads the app shell so window.simLabValidateScenario is defined.
async function gotoApp(page) {
  await page.goto('http://localhost:3131/?_cb=test');
  await page.waitForFunction(() => typeof window.simLabValidateScenario === 'function');
}

test('validateScenario rejects a scenario with no steps', async ({ page }) => {
  await gotoApp(page);
  const ok = await page.evaluate(() =>
    window.simLabValidateScenario({
      id: 's1', cert: 'netplus', objective: '1.4', topic: 'IPv4', title: 't',
      scenario: 'x', estMinutes: 5, steps: []
    }).ok
  );
  expect(ok).toBe(false);
});

test('validateScenario accepts a well-formed single-step scenario', async ({ page }) => {
  await gotoApp(page);
  const res = await page.evaluate(() =>
    window.simLabValidateScenario({
      id: 's1', cert: 'netplus', objective: '1.4', topic: 'IPv4', title: 't',
      scenario: 'x', estMinutes: 5,
      steps: [{ id: 'st1', type: 'fillin', prompt: 'mask?', points: 1,
        explanation: 'because', payload: { fields: [{ id: 'f1', label: 'mask' }] },
        answer: { f1: ['255.255.255.192', '/26'] } }]
    })
  );
  expect(res.ok).toBe(true);
});
