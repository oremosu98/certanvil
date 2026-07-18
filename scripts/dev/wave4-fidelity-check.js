// Wave 4 authoring gate: structural + fidelity validation for every a1-swatch-* scenario.
const fs = require('fs');
const vm = require('vm');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('features/sim-lab.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('features/sim-lab-seed-aplus-core1.js', 'utf8'), sandbox);
const bank = sandbox.window.SIM_LAB_SEED_APLUS_CORE1.filter(s => s.archetype === 'swatch');
let fail = 0;
for (const scn of bank) {
  const v = sandbox.window.simLabValidateScenario(scn);
  const f = sandbox.window.simLabValidateSwatchFidelity(scn);
  const ok = v.ok && f.ok;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + scn.id + (ok ? '' : '  ' + [...v.errors, ...f.errors].join(' | ')));
  if (!ok) fail++;
}
console.log(bank.length + ' swatch scenarios, ' + fail + ' failing');
process.exit(fail ? 1 : 0);
