// tests/uat/528-suggest-cert.js
// Scope: persona bundle Task 14. The Suggest a cert pieces in lib/cert-requests.js: the key normaliser, the sheet's row model,
// the send count text, and send/queue/retry behaviour with a fake Supabase. Spec: 2026-10-30-ai-budget-fast-start-suggest-design.md §3
const fs = require('fs');
const path = require('path');
const { test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Suggest a cert ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const src = fs.readFileSync(path.join(ROOT, 'lib', 'cert-requests.js'), 'utf8');

  function load(sb, uid) {
    const store = {}, listeners = {};
    const win = {
      certanvilSupabase: sb || null,
      addEventListener: (n, f) => { (listeners[n] = listeners[n] || []).push(f); },
    };
    const ctx = vm.createContext({ window: win, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
      Promise, JSON, Math, Date, Object, Array, String, Number, RegExp });
    vm.runInContext(src, ctx);
    return { win, store, fire: (n) => (listeners[n] || []).forEach((f) => f()) };
  }
  const session = (id) => ({ auth: { getSession: () => Promise.resolve({ data: { session: id ? { user: { id } } : null } }) } });
  function fakeSb(handler) {
    const calls = [];
    const sb = session('u1');
    sb.from = (t) => ({ upsert: (rows, opts) => { calls.push({ t, rows, opts }); return Promise.resolve(handler(calls.length, rows)); } });
    return { sb, calls };
  }
  const tick = () => new Promise((r) => setTimeout(r, 5));

  const L = load(null);
  const norm = L.win._normCertRequest;
  test('normaliser: "Cisco CCNA" -> "ccna"', norm('Cisco CCNA') === 'ccna');
  test('normaliser: "ITIL4 Foundation" -> "itil4 foundation"', norm('ITIL4 Foundation') === 'itil4 foundation');
  test('normaliser: "  Sec+ " is lowercase and trimmed', norm('  Sec+ ') === 'sec+');
  test('normaliser: strips vendor word and exam/cert words, collapses spaces',
    norm('CompTIA   Security+  Certification Exam') === 'security+' && norm('AWS Solutions Architect Associate') === 'solutions architect associate');
  test('normaliser: only a LEADING vendor word goes; "Certified" stays', norm('Azure Microsoft Certified') === 'azure microsoft certified');
  test('normaliser: only a vendor or filler word is refused (empty key)', ['Cisco', 'exam', 'cert', 'Cisco exam', 'CompTIA Certification', '   ', ''].every((x) => norm(x) === ''));
  test('normaliser: "Google Cloud" is a vendor prefix, so a listed Google exam matches exactly',
    norm('Google Cloud Associate Cloud Engineer') === 'associate cloud engineer' && L.win._certReqRows('Google Cloud Associate Cloud Engineer', []).typed === null);
  test('typed row refused when the key is empty ("Cisco", "exam")', L.win._certReqRows('Cisco', []).typed === null && L.win._certReqRows('exam', []).typed === null);
  const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
  test('caps count code points and never split a surrogate pair',
    Array.from(L.win._certReqLabel('\u{1F600}'.repeat(200))).length === 120 && !lone.test(L.win._certReqLabel('\u{1F600}'.repeat(200)))
    && Array.from(norm('a' + '\u{1F600}'.repeat(200))).length === 80 && !lone.test(norm('a' + '\u{1F600}'.repeat(200))));
  test('normaliser: always within the 80-char key limit and trimmed', norm('x'.repeat(200)).length === 80 && norm('a '.repeat(60)) === norm('a '.repeat(60)).trim() && norm('a '.repeat(60)).length <= 80);
  test('label is tidied and clipped to 120', L.win._certReqLabel('  Cloud   Security ') === 'Cloud Security' && L.win._certReqLabel('y'.repeat(300)).length === 120);

  const rows = L.win._certReqRows;
  test('typed row shown for a partial match ("Cloud Security")', !!rows('Cloud Security', []).typed && rows('Cloud Security', []).typed.label === 'Cloud Security');
  test('typed row hidden for an exact match ("CCNA", "ccna", "200-301", "Cisco CCNA")',
    ['CCNA', 'ccna', '200-301', 'Cisco CCNA'].every((q) => rows(q, []).typed === null));
  test('typed row still offered when others partly match ("CCN")', !!rows('CCN', []).typed && rows('CCN', []).groups.length === 1);
  test('empty box: all six vendor groups and the "Something else?" row; typing hides it',
    rows('', []).groups.length === 6 && rows('', []).else === true && rows('x', []).else === false);
  test('a picked typed exam stays as "Your suggestion" after the box clears',
    JSON.stringify(rows('', ['ITIL 4']).mine) === JSON.stringify([{ label: 'ITIL 4' }]) && rows('ITIL 4', ['ITIL 4']).mine.length === 0 && rows('ITIL 4', ['ITIL 4']).typed.on === true);
  test('listed picks are flagged on', rows('', ['CCNA']).groups[0].rows[0].on === true);
  test('send count text', L.win._certReqSendText(0) === 'Pick at least one' && L.win._certReqSendText(1) === 'Send 1 suggestion' && L.win._certReqSendText(2) === 'Send 2 suggestions');

  // ── send / queue / retry (async, so run in a child process and report its results here) ──
  let out = [];
  try { out = JSON.parse(require('child_process').execFileSync(process.execPath, [path.join(__dirname, '_suggest-cert-async.js')], { encoding: 'utf8' })); }
  catch (e) { out = [['async send checks ran: ' + e.message, false]]; }
  out.forEach(([n, ok]) => test(n, ok));
  const fs2 = fs.readFileSync(path.join(ROOT, 'features', 'ios-settings.js'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  test('Settings: "Suggest a cert" row after "Replay the tour", signed in only; handler ON.suggest',
    /row\('tour'[^\n]*\n\s*\+ \(m\.out \? '' : row\('suggest', 'star', 'Suggest a cert'/.test(fs2) && fs2.includes('ON.suggest = '));
  const hubSrc = fs.readFileSync(path.join(ROOT, 'features', 'ios-hub.js'), 'utf8');
  const sgSrc = fs.readFileSync(path.join(ROOT, 'features', 'ios-suggest.js'), 'utf8');
  test('signed in only: the hub link needs _certanvilSignedIn === true; the sheet refuses anything else', /typeof openSuggestCert === 'function' && window\._certanvilSignedIn === true/.test(hubSrc) && sgSrc.includes("window._certanvilSignedIn !== true"));
  test('sheet: Send waits for a user id, traps Tab, inerts behind, un-inerts before restoring focus, skips IME composition',
    sgSrc.includes('!S.uid') && sgSrc.includes("ev.key !== 'Tab'") && sgSrc.includes('el.inert = true') && sgSrc.indexOf('el.inert = false') < sgSrc.indexOf('S.back.focus') && sgSrc.includes('ev.isComposing'));
  test('index.html loads cert-requests.js before ios-suggest.js', html.indexOf('lib/cert-requests.js') > 0 && html.indexOf('lib/cert-requests.js') < html.indexOf('features/ios-suggest.js'));
})();
