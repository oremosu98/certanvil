// tests/uat/540-cert-surfaces-snapshot.js
// Scope: cert-registry Part 1, Task 1.1. Characterisation snapshot: every hand-maintained per-cert surface
// must still hold today's value for the eight current certs, so the registry refactor cannot change one by accident.
// Fixture: tests/fixtures/cert-surfaces-v1.json (produced by scripts/snapshot-cert-surfaces.js).
// A key in APPROVED_CHANGES passes if it equals EITHER the fixture value OR the approved value.
const fs = require('fs');
const path = require('path');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Cert surfaces snapshot ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'cert-surfaces-v1.json'), 'utf8'));
  const { extract } = require(path.join(ROOT, 'scripts', 'snapshot-cert-surfaces.js'));
  const live = extract();

  // Dotted path -> value the refactor is allowed to change to (e.g. the first-run A+ codes move to 220-1201/1202).
  const APPROVED_CHANGES = {
    'aplus-core1.codes.firstrun': '220-1201',
    'aplus-core2.codes.firstrun': '220-1202'
  };

  function flatten(obj, prefix, out) {
    Object.keys(obj).forEach((k) => {
      const p = prefix ? prefix + '.' + k : k;
      const v = obj[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out); else out[p] = v;
    });
    return out;
  }
  const want = flatten(fixture, '', {});
  const got = flatten(live, '', {});
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const diffs = [];
  Object.keys(want).concat(Object.keys(got).filter((k) => !(k in want))).forEach((k) => {
    if (same(got[k], want[k])) return;
    if (Object.prototype.hasOwnProperty.call(APPROVED_CHANGES, k) && same(got[k], APPROVED_CHANGES[k])) return;
    diffs.push(k + ': fixture ' + JSON.stringify(want[k]) + ' vs now ' + JSON.stringify(got[k]));
  });

  // v8.205.0: the four new certs (secai, prince2, psm1, psm2) were added as new keys only; the eight's values are unchanged.
  test('Snapshot covers the eight launch certs plus the four new ones, in id order',
    Object.keys(fixture).join() === 'ai900,aplus-core1,aplus-core2,az900,clfc02,netplus,prince2,psm1,psm2,sc900,secai,secplus' && Object.keys(live).join() === Object.keys(fixture).join());
  test('New certs: scrum host opens PSM I, the switcher sends PSM II to ?exam=psm2, percent scales and the S-first SecAI+ glyph are captured',
    fixture.psm1.hostDetected.head === 'psm1' && fixture.psm2.switchHost === 'https://scrum.certanvil.com/?exam=psm2' &&
    fixture.prince2.scale.pass === 60 && fixture.psm2.scale.pass === 85 && fixture.secai.glyph === 'SAI' && fixture.secai.hostDetected.head === 'secai' &&
    fixture.psm1.codes.firstrun === 'Professional Scrum Master I');
  test('Snapshot spot checks: CLF-C02 glyph AWS, mark CLF; first-run A+ Core 1 code is 220-1101',
    fixture.clfc02.glyph === 'AWS' && fixture.clfc02.mark === 'CLF' && fixture['aplus-core1'].codes.firstrun === '220-1101');
  test('Every cert surface matches the snapshot (zero unapproved diffs)' + (diffs.length ? ' — ' + diffs.slice(0, 5).join(' | ') : ''), diffs.length === 0);
  const nulls = Object.keys(want).filter((k) => want[k] === null);
  const okNulls = ['aplus-core1', 'aplus-core2', 'netplus', 'secplus'].map((id) => id + '.scale.min');
  test('No fixture value is null except the four CompTIA scale.min entries' + (nulls.length ? ' (null: ' + nulls.join(',') + ')' : ''),
    nulls.slice().sort().join() === okNulls.slice().sort().join());
  test('Approved changes are only ever the two first-run A+ codes', Object.keys(APPROVED_CHANGES).join() === 'aplus-core1.codes.firstrun,aplus-core2.codes.firstrun');
})();
