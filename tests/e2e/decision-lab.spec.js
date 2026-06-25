const { test, expect } = require('@playwright/test');

async function gotoApp(page) {
  await page.goto('http://localhost:3131/?_cb=test');
  await page.waitForFunction(() =>
    typeof window._ensureDecisionLabLoaded === 'function' ||
    typeof window._ensureSimLabLoaded === 'function');
  await page.evaluate(() => {
    if (typeof window._ensureDecisionLabLoaded === 'function') window._ensureDecisionLabLoaded();
    else if (typeof window._ensureSimLabLoaded === 'function') window._ensureSimLabLoaded();
  });
  await page.waitForFunction(() => typeof window.simLabValidateScenario === 'function');
}

function installSeedFixture(page, globalName, count) {
  return page.evaluate(({ globalName, count }) => {
    function scn(i) {
      return {
        id: globalName + '-' + i, cert: 'az900', objective: '1.1',
        topic: 'Cost tools', title: 'Pick', scenario: 'A team needs X.',
        estMinutes: 2, pair: 'Pricing Calculator vs TCO Calculator',
        family: 'Cost & pricing tools',
        steps: [{
          type: 'analyze', points: 1, prompt: 'Pick the best service',
          explanation: 'Compare two worlds.',
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
    window[globalName] = Array.from({ length: count }, (_, i) => scn(i + 1));
  }, { globalName, count });
}
module.exports.installSeedFixture = installSeedFixture;

test('dl scaffold: _dlBank resolves its own registry; _slBank unchanged (no regression)', async ({ page }) => {
  await gotoApp(page);
  await installSeedFixture(page, 'DECISION_LAB_SEED_AZ900', 6);
  const r = await page.evaluate(() => {
    const S = window._simLab;
    const dlAz = S.dlBank('az900');
    const dlUnknown = S.dlBank('netplus');
    window.SIM_LAB_SEED_NETPLUS = [{ id: 'x' }];
    const slNet = S.slBank('netplus');
    const slAz = S.slBank('az900');
    return {
      certs: S.dlCerts(),
      dlAzLen: dlAz.length, dlUnknownLen: dlUnknown.length,
      slNetLen: slNet.length, slAzLen: slAz.length
    };
  });
  expect(r.certs).toEqual(['az900', 'ai900', 'sc900', 'clfc02']);
  expect(r.dlAzLen).toBe(6);
  expect(r.dlUnknownLen).toBe(0);
  expect(r.slNetLen).toBe(1);
  expect(r.slAzLen).toBe(0);
});
