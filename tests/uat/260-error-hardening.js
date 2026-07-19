// tests/uat/260-error-hardening.js
// Scope: Unplanned-failure hardening + error observability (2026-07-19 spec)
// Tasks 1–6: fetchWithTimeout/withTimeout helpers, showAiErrorCard/showBootFallback,
// _claudeFetch hardening, _errorSurface wiring, server proxy timeout, silent-catch closure.

const {
  ROOT, _fnBody, _fnBodyShell, appJs, authStateJs, certAi900, certAplusCore1, certAplusCore2, certAz900, certClfc02, certNetplus, certSc900, certSecplus, cloudStoreJs, css, dgCss, finishBody, fs, html, js, mockMatchMedia, pages, path, read, results, sandbox, sw, tb3d, test, vm
} = require('./_context');

const appSrc = appJs;

// ── Task 1: fetchWithTimeout + withTimeout helpers ──────────────────────────

console.log('\n\x1b[1m── Error Hardening: fetchWithTimeout + withTimeout (Task 1) ──\x1b[0m');

test('T1: app.js contains function fetchWithTimeout(',
  appSrc.includes('function fetchWithTimeout('));

test('T1: fetchWithTimeout uses AbortController',
  appSrc.includes('new AbortController()'));

test('T1: app.js contains function withTimeout(',
  appSrc.includes('function withTimeout('));

test('T1: TimeoutError name assigned (name = \'TimeoutError\')',
  appSrc.includes("name = 'TimeoutError'") || appSrc.includes('name="TimeoutError"') || appSrc.includes("err.name = 'TimeoutError'"));

test('T1: fetchWithTimeout records hiddenDuring visibility',
  appSrc.includes('hiddenDuring'));

// ── Task 2: showAiErrorCard + showBootFallback + CSS ────────────────────────

console.log('\n\x1b[1m── Error Hardening: Error surface components (Task 2) ──\x1b[0m');

test('T2: app.js contains function showAiErrorCard(',
  appSrc.includes('function showAiErrorCard('));

test('T2: app.js contains function showBootFallback(',
  appSrc.includes('function showBootFallback('));

test('T2: locked copy — "The AI didn\'t respond."',
  appSrc.includes("The AI didn't respond."));

test('T2: locked copy — "Your connection cut out."',
  appSrc.includes("Your connection cut out."));

test('T2: locked copy — "Something broke on our end."',
  appSrc.includes("Something broke on our end."));

test('T2: dg-system.css contains .errc class selector',
  dgCss.includes('.errc'));

(function () {
  // Verify no border-left inside the appended errc block (must use color-mix tinted border)
  const errcIdx = dgCss.indexOf('.errc');
  if (errcIdx === -1) {
    test('T2: dg-system.css errc block has no border-left (wrong side-accent)', false);
    return;
  }
  // Check 3000 chars after first .errc occurrence — enough to cover the block
  const errcBlock = dgCss.slice(errcIdx, errcIdx + 3000);
  test('T2: dg-system.css errc block has no border-left (wrong side-accent)',
    !errcBlock.includes('border-left'));
})();

// ── Task 3: _claudeFetch hardening ──────────────────────────────────────────

console.log('\n\x1b[1m── Error Hardening: _claudeFetch hardening (Task 3) ──\x1b[0m');

const claudeFetchBody = _fnBody(appSrc, '_claudeFetch');

test('T3: _claudeFetch body contains fetchWithTimeout',
  claudeFetchBody.includes('fetchWithTimeout'));

test('T3: _claudeFetch body contains timeoutMs: 90000',
  claudeFetchBody.includes('timeoutMs: 90000') || claudeFetchBody.includes('timeoutMs:90000'));

test('T3: _classifyFetchError defined in app.js',
  appSrc.includes('function _classifyFetchError('));

test('T3: _claudeFetch / _claudeFail sets userFacing = true',
  appSrc.includes('userFacing = true'));

// ── Task 4: _errorSurface wiring ────────────────────────────────────────────

console.log('\n\x1b[1m── Error Hardening: _errorSurface wiring (Task 4) ──\x1b[0m');

test('T4: app.js (batch worker) contains _errorSurface',
  appSrc.includes('_errorSurface'));

test('T4: features/topic-dive.js contains _errorSurface',
  (function () {
    try {
      const tdSrc = fs.readFileSync(path.join(ROOT, 'features/topic-dive.js'), 'utf8');
      return tdSrc.includes('_errorSurface');
    } catch (_) { return false; }
  })());

// ── Task 5: server proxy timeout + logServerError ────────────────────────────

console.log('\n\x1b[1m── Error Hardening: server proxy + logServerError (Task 5) ──\x1b[0m');

test('T5: api/_lib/log-server-error.js exists',
  (function () {
    try {
      fs.accessSync(path.join(ROOT, 'api/_lib/log-server-error.js'));
      return true;
    } catch (_) { return false; }
  })());

test('T5: api/_lib/log-server-error.js contains type: \'server\'',
  (function () {
    try {
      const src = fs.readFileSync(path.join(ROOT, 'api/_lib/log-server-error.js'), 'utf8');
      return src.includes("type: 'server'");
    } catch (_) { return false; }
  })());

test('T5: api/ai/generate.js contains AbortController',
  (function () {
    try {
      const src = fs.readFileSync(path.join(ROOT, 'api/ai/generate.js'), 'utf8');
      return src.includes('AbortController');
    } catch (_) { return false; }
  })());

test('T5: api/ai/generate.js contains upstream_timeout',
  (function () {
    try {
      const src = fs.readFileSync(path.join(ROOT, 'api/ai/generate.js'), 'utf8');
      return src.includes('upstream_timeout');
    } catch (_) { return false; }
  })());

// ── Task 6: silent-catch closure + flood control + resource listener ─────────

console.log('\n\x1b[1m── Error Hardening: silent-catch closure + flood control (Task 6) ──\x1b[0m');

test('T6: app.js contains __sbReportCount flood control',
  appSrc.includes('__sbReportCount'));

test('T6: app.js contains swallowed: prefix for instrumented catches',
  appSrc.includes("'swallowed:") || appSrc.includes('"swallowed:'));

test('T6: app.js contains capture-phase resource error listener (true)',
  (function () {
    // Must have addEventListener('error', ..., true) — capture phase
    return appSrc.includes("addEventListener('error'") &&
      (function () {
        const idx = appSrc.indexOf("addEventListener('error'");
        // look for 'true' in a reasonable window (300 chars) after this call
        const snippet = appSrc.slice(idx, idx + 300);
        return snippet.includes(', true)') || snippet.includes(',true)');
      })();
  })());
