// tests/uat/_context.js
// Auto-split from the former monolithic tests/uat.js (mechanical move, no logic changes).
// Loads every UAT source string + the test framework + every cross-domain-file
// helper/const, and exports them for the numbered domain files in this directory.

// ══════════════════════════════════════════
// Network+ Quiz — Reusable UAT Test Suite
// Run: node tests/uat.js
// ══════════════════════════════════════════
//
// ── TESTING PHILOSOPHY (added v4.42.3 audit) ──────────────────────────
// The suite grew from 130 (v4.5) to 2200+ (v4.42.x). Most growth was
// cheap source-string `js.includes('function foo(')` assertions that
// prove the string exists without proving the feature works. Going
// forward, prefer in this order:
//
//   1. BEHAVIORAL SMOKE TESTS — extract a function into a sandbox via
//      `new Function(body)`, feed it fixtures, assert outputs. These
//      catch real regressions. See `computeWeakSpotScores` or
//      `_canonicalizeWeakTopic` audits for the pattern.
//
//   2. STRUCTURAL REGEX — verify call sites use the right helpers /
//      constants / models (`CLAUDE_TEACHER_MODEL`, `_buildGtHint`,
//      `animateCount`). Catches silent reverts where the feature exists
//      but its wiring broke.
//
//   3. REGRESSION GUARDS — `!js.includes('oldThing')` for specific
//      things we deleted and don't want coming back. Time-bound; retire
//      these 3-4 versions after the deletion.
//
//   4. DYNAMIC CONSISTENCY CHECKS — extract version/cache/badge from
//      source and verify they agree, rather than hardcoding the number
//      in multiple places.
//
//   AVOID: pure `js.includes('function foo(')` proofs that a function
//   exists by name. If the function is gone, everything downstream
//   breaks loud. These assertions are noise that make the suite look
//   comprehensive without adding signal.
//
//   AVOID: hardcoding the current version string in more than 2 places.
//   The dynamic checks at the top of the file cover alignment; one
//   hardcoded "forgot to bump" guard is enough.
// ────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(require('path').join(__dirname, '..'), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ── Reduced-motion test helper (added Phase 8) ──────────────────
// Returns a fake matchMedia for behavioral tests that sandbox functions
// reading `prefers-reduced-motion`. The fake responds to any query containing
// "reduce" with the given value.
function mockMatchMedia(reducedMotion) {
  return function (query) {
    return {
      matches: typeof query === 'string' && query.indexOf('reduce') !== -1 && !!reducedMotion,
      media: query,
      addEventListener: function () {},
      removeEventListener: function () {},
    };
  };
}

let html, js, css, sw, certNetplus, certSecplus, certAz900, certAi900, certAplusCore1, certAplusCore2, certSc900, certClfc02, cloudStoreJs, authStateJs;
try {
  html = read('index.html');
  js   = read('app.js');
  css  = read('styles.css');
  sw   = read('sw.js');
  // v4.86.0: cert pack architecture. UAT now reads each cert file directly
  // so assertions on moved content target the right source. The cert
  // resolver (detectCert()) lives in app.js — UAT only loads the static
  // source for cert packs; runtime resolution doesn't happen at test time.
  certNetplus = read('certs/netplus.js');
  certSecplus = read('certs/secplus.js');
  // v7.3.0: AZ-900 cert pack source for 8 new tombstones (Pattern A wiring +
  // schema + exemplar bank sanity). Same shape as Net+/Sec+ loading.
  certAz900 = read('certs/az900.js');
  // v7.5.0: AI-900 cert pack source for 8 new tombstones (fourth cert, AI/data
  // role family on ai.certanvil.com). Mirrors AZ-900 loader pattern.
  certAi900 = read('certs/ai900.js');
  // v7.6.0: A+ Core 1 + Core 2 cert pack sources for the dual-exam fifth cert
  // family (Pattern A on aplus.certanvil.com; within-subdomain Core1<->Core2
  // switching). Mirrors the AI-900 loader pattern.
  certAplusCore1 = read('certs/aplus-core1.js');
  certAplusCore2 = read('certs/aplus-core2.js');
  // v7.7.0: SC-900 cert pack source for 8 new tombstones (sixth cert, Microsoft
  // Security/Compliance/Identity on sc900.certanvil.com). Mirrors AI-900 loader.
  certSc900 = read('certs/sc900.js');
  // v7.8.0: CLF-C02 cert pack source for 8 new tombstones (seventh cert, AWS —
  // third vendor — on clfc02.certanvil.com). Mirrors the SC-900 loader.
  certClfc02 = read('certs/clfc02.js');
  // v4.89.0 Phase C′: cloud-store source so we can assert USER_DATA_KEYS coverage
  // for new namespaced storage keys (e.g. v4.91.0 SAB_*).
  cloudStoreJs = read('cloud-store.js');
  // v4.98.7: auth-state.js source so we can assert pill renders synchronously
  authStateJs = read('auth-state.js');
  // v4.99.36 Phase 11b: lazy-loaded feature modules. Concat into `js` so all
  // pre-existing structural assertions continue to find their patterns
  // regardless of which file the code lives in. Adding a feature module:
  //   1. Drop the file in features/<name>.js
  //   2. Append `+ '\n' + read('features/<name>.js')` here
  //   3. UAT continues to scan for patterns across the unified text
  // The shell + module split is for runtime perf, not test surface.
  const featuresDir = path.join(ROOT, 'features');
  let featuresJs = '';
  try {
    if (fs.existsSync(featuresDir)) {
      fs.readdirSync(featuresDir)
        .filter(f => f.endsWith('.js'))
        .forEach(f => {
          // De-indent the IIFE wrap so structural regexes that expect column-0
          // patterns (e.g. /\n\];/, /^function naX/m) match the same way they
          // did when the code lived in app.js. Each feature module wraps every
          // line with 2-space IIFE indent — strip exactly 2 leading spaces from
          // each line. Lines with < 2 leading spaces (e.g. the IIFE wrapper
          // itself) pass through unchanged.
          const raw = read('features/' + f);
          const dedented = raw.split('\n').map(line =>
            line.startsWith('  ') ? line.slice(2) : line
          ).join('\n');
          featuresJs += '\n// === FEATURE: ' + f + ' ===\n' + dedented;
        });
    }
  } catch (_) { /* no features yet — fine */ }
  js += featuresJs;
} catch(e) {
  console.error('ERROR: Could not read project files. Run from project root.');
  console.error(e.message);
  process.exit(1);
}

// ── Test runner ──
const results = { pass: 0, fail: 0, errors: [] };
function test(name, condition) {
  if (condition) {
    results.pass++;
    console.log(`  \x1b[32mPASS\x1b[0m ${name}`);
  } else {
    results.fail++;
    results.errors.push(name);
    console.log(`  \x1b[31mFAIL\x1b[0m ${name}`);
  }
}


const pages = ['setup', 'loading', 'quiz', 'results', 'review', 'session-transition', 'session-complete', 'progress', 'exam', 'exam-results', 'analytics'];

const vm = require('vm');

const sandbox = {};

function _fnBody(src, name) {
  const idx = src.indexOf('function ' + name);
  if (idx === -1) return '';
  // Walk forward to matching close brace
  let braceStart = src.indexOf('{', idx);
  if (braceStart === -1) return '';
  let depth = 1, i = braceStart + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(idx, i);
}

function _fnBodyShell(src, name) {
  const featuresStart = src.indexOf('\n// === FEATURE: ');
  const shellSrc = featuresStart === -1 ? src : src.slice(0, featuresStart);
  return _fnBody(shellSrc, name);
}

const finishBody = _fnBody(js, 'finish');

let tb3d = ""; try { tb3d = fs.readFileSync(path.join(ROOT, 'tb3d.js'), "utf8"); } catch (_) { /* MVP-quiz-only: deleted */ }

const appJs = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'app.js'), 'utf8');

const dgCss = fs.readFileSync(path.join(require('path').join(__dirname, '..'), '..', 'dg-system.css'), 'utf8');

module.exports = {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
};
