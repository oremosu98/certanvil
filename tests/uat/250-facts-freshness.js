// tests/uat/250-facts-freshness.js
// Scope: CLAUDE.md FACTS block (scripts/stamp-facts.js) freshness — the
// machine-owned block that replaced hand-maintained file sizes / line
// counts / UAT check totals that used to rot (e.g. "~964 KB / ~19K lines"
// long after app.js hit 22K). Asserts the stamped numbers still track
// reality within a tolerance, so mid-edit worktree runs don't spuriously
// fail while the pre-commit stamping keeps *committed* values exact.
//
// Does NOT shell out to `node tests/uat.js` (would recurse infinitely) —
// for the UAT-check-count fact, only asserts it parses as a number >= 4000.
// The CLAUDE.md 250-line/30KB size cap already has a dedicated check in
// tests/uat/160-tbv2-ships-tbv3-reachability.js ("CLAUDE.md ceiling"), so
// it isn't duplicated here.

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

const stampFacts = require('../../scripts/stamp-facts');

let claudeMd = '';
try {
  claudeMd = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
} catch (_) { /* handled by the marker-existence test below */ }

// (a) FACTS markers exist
test('FACTS: CLAUDE.md has both FACTS:AUTO markers',
  claudeMd.includes(stampFacts.BEGIN_MARKER) && claudeMd.includes(stampFacts.END_MARKER));

const stamped = stampFacts.parseBlock(claudeMd);
test('FACTS: stamped block parses (table + summary line intact)', !!stamped);

// runUat: false — avoid recursively re-running the whole UAT suite from
// inside the suite. This skips only the UAT-check-count recomputation;
// every other fact is computed fresh here.
const fresh = stampFacts.computeFacts({ runUat: false });

// (b) each stamped line/size fact is within tolerance of the freshly
// computed value (same TOLERANCE_PCT the `--check` CLI mode uses).
const TOL = stampFacts.TOLERANCE_PCT;

function checkMetric(label, stampedVal, freshVal) {
  test(`FACTS: ${label} within ${TOL * 100}% of fresh (stamped=${stampedVal}, fresh=${freshVal})`,
    stamped != null && stampFacts.withinTolerance(stampedVal, freshVal, TOL));
}

if (stamped) {
  checkMetric('app.js lines', stamped.appJs.lines, fresh.appJs.lines);
  checkMetric('app.js KB', stamped.appJs.kb, fresh.appJs.kb);
  checkMetric('styles.css lines', stamped.stylesCss.lines, fresh.stylesCss.lines);
  checkMetric('styles.css KB', stamped.stylesCss.kb, fresh.stylesCss.kb);
  checkMetric('index.html lines', stamped.indexHtml.lines, fresh.indexHtml.lines);
  checkMetric('index.html KB', stamped.indexHtml.kb, fresh.indexHtml.kb);
  checkMetric('dg-system.css lines', stamped.dgSystemCss.lines, fresh.dgSystemCss.lines);
  checkMetric('dg-system.css KB', stamped.dgSystemCss.kb, fresh.dgSystemCss.kb);
  checkMetric('UAT suite lines', stamped.uatSuiteLines, fresh.uatSuiteLines);
  checkMetric('UAT module count', stamped.uatModuleCount, fresh.uatModuleCount);
  checkMetric('E2E test( count', stamped.e2eTests, fresh.e2eTests);

  // UAT check count: no recursive re-run — just sanity-check it parsed as a
  // plausible number (the suite has thousands of checks; 4000 is a safe
  // floor that won't false-positive on any real shrink).
  test('FACTS: UAT check count parses as a number >= 4000',
    typeof stamped.uatChecks === 'number' && stamped.uatChecks >= 4000);

  // (c) stamped APP_VERSION matches app.js exactly (no tolerance — either
  // it's the same string or it's stale).
  test('FACTS: stamped APP_VERSION matches app.js exactly',
    stamped.version === fresh.version);
} else {
  // Parent test already failed above; skip dependent assertions rather
  // than throwing on null field access.
  test('FACTS: app.js lines within tolerance (skipped — block unparseable)', false);
}

// (d) CLAUDE.md size cap — already covered by
// tests/uat/160-tbv2-ships-tbv3-reachability.js ("CLAUDE.md ceiling: <= 250
// lines" / "<= 30KB"). Not duplicated here.
