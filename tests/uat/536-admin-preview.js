// tests/uat/536-admin-preview.js
// Admin in the app, Task 7: Preview as Free (drawing mockups/cert-ios-admin.html, the Free bar; phone and ?v=desktop-free).
// Source contracts plus the real wrap() run in a sandbox; behaviour on screen is in tests/e2e/admin-preview.spec.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Preview as Free ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const ap = read('features/admin-preview.js'), app = read('app.js'), auth = read('auth-state.js'), html = read('index.html');
  const cs = read('cloud-store.js'), lift = read('lift-ios.css'), dg = read('dg-system.css');
  const dash = String.fromCharCode(0x2014);

  test('admin-preview.js loads right after report-sheet.js', /features\/report-sheet\.js"><\/script>\n<script defer src="features\/admin-preview\.js"><\/script>/.test(html));
  test('one switch point in app.js: _refreshQuotaChip runs the answer through wrap()',
    /_quotaState = \(window\._adminPreview \? window\._adminPreview\.wrap\(resp\.data\[0\]\) : resp\.data\[0\]\);/.test(app));
  test('auth-state: admin counts as Pro only while not previewing; the admin flag is set on render and cleared on sign-out',
    /\.toLowerCase\(\) === 'admin' && !\(window\._adminPreview && window\._adminPreview\.on\(\)\)\)/.test(auth)
    && /if \(role === 'admin'\) \{ try \{ window\._certanvilIsAdmin = true; \} catch \(_\) \{\} \}/.test(auth) && !/_certanvilIsAdmin = role ===/.test(auth)
    && /if \(_adminUid !== userId\) \{ _adminUid = userId; try \{ window\._certanvilIsAdmin = false; \} catch \(_\) \{\} \}/.test(auth)
    && /function handleSignedOut\(\) \{[\s\S]{0,300}_adminUid = null; try \{ window\._certanvilIsAdmin = false; if \(window\._adminPreview\) window\._adminPreview\.clear\(\);/.test(auth)
    && !/handleSignedOut: handleSignedOut/.test(auth));
  test('Keep going restarts the count and closes the popup; it never starts a quiz by itself', /function _keepGoing\(\) \{[\s\S]{0,300}m\.remove\(\);\s*\n\s*_apply\(\);\s*\n\s*\}/.test(ap) && !/startQuiz/.test(ap));
  test('the bar is kept out of inert on purpose (commented)', /Deliberate: the bar is kept out of `inert`/.test(ap) && /if \(bar\.inert\) bar\.inert = false;/.test(ap));
  test('phone: one shared --ap-free-top offset for every full-screen host, body padding replaces (never adds to) the safe area',
    /html\.ap-free \{ --ap-free-top: 56px; \}/.test(lift) && /#ios-log-result, \.dm-screen, \.isi-host/.test(lift) && /\{ top: var\(--ap-free-top, 0px\) !important; \}/.test(lift)
    && /#isl-xbar \{ top: var\(--ap-free-top, 0px\); \}/.test(lift) && /html\.ap-free body \{ padding-top: calc\(var\(--ap-free-top\) \+ env\(safe-area-inset-top, 0px\)\); \}/.test(lift));
  test('the flag is device only: never one of cloud-store\'s synced keys', !/admin_free_preview/.test(cs) && /var KEY = 'nplus_' \+ 'admin_free_preview';/.test(ap));
  test('exports on / set / wrap / clear', /window\._adminPreview = \{ on: on, set: set, wrap: wrap, clear: clear \};/.test(ap));
  test('copy verbatim: Previewing as Free, Back to Pro, Keep going (admin preview)',
    /'Previewing as Free'/.test(ap) && />Back to Pro<\/button>/.test(ap) && /'Keep going \(admin preview\)'/.test(ap));
  test('the bar is a status region, announced once on turning on', /setAttribute\('role', 'status'\)/.test(ap) && /_draw\(want && !was\)/.test(ap));
  test('Back to Pro fades out in 150ms before switching off', /leaving = setTimeout\(function \(\) \{[^}]*set\(false\); \}, 150\);/.test(ap)
    && /\.ap-freebar\.leaving \{ opacity: 0; transition: opacity \.15s var\(--ios-ease\); \}/.test(lift)
    && /\.ap-freebar\.leaving\{opacity:0;transition:opacity \.15s cubic-bezier\(0\.16,1,0\.3,1\);\}/.test(dg));
  test('CSS: 44pt bar and button on both layouts, reduced motion fades only, desktop hover gated',
    /\.ap-freebar \{ position: fixed;[^}]*min-height: 44px;/.test(lift) && /\.ap-freebar-back \{[^}]*min-height: 44px;/.test(lift)
    && /\.ap-freebar\{display:flex;[^}]*min-height:44px;/.test(dg) && /\.ap-freebar-back\{[^}]*min-height:44px;/.test(dg)
    && /prefers-reduced-motion: reduce\) \{\s*\n\s*\.ap-freebar\.enter \{ animation: ap-bar-fade/.test(lift)
    && /\(hover:hover\) and \(pointer:fine\)\{\s*\n\s*\.ap-freebar-back:hover/.test(dg));
  test('no em dash in the module, its styles or its tests', !ap.includes(dash) && !lift.slice(lift.indexOf('Admin in the app Task 7')).includes(dash)
    && !dg.slice(dg.indexOf('Admin in the app Task 7')).includes(dash) && !read('tests/e2e/admin-preview.spec.js').includes(dash));

  // the real module, run: admin gate, Free shape from today's history, Keep going offset, sign-out
  function sandbox(answered, isAdmin) {
    const store = {};
    const listeners = [];
    const win = {
      _certanvilIsAdmin: isAdmin, _quotaState: null, _localDay: () => '2026-10-31',
      dispatchEvent() {}, addEventListener() {},
    };
    const ctx = vm.createContext({
      window: win, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
      document: { readyState: 'complete', body: null, documentElement: { classList: { toggle() {} } }, getElementById: () => null, addEventListener() {} },
      MutationObserver: function () { this.observe = () => {}; }, Event: function () {}, setTimeout, clearTimeout, JSON, Math, Object,
      getTodayQuestionCount: () => answered.n,
    });
    vm.runInContext(ap, ctx);
    return { win, store, listeners };
  }
  const n = { n: 9 };
  const a = sandbox(n, true), P = a.win._adminPreview, pro = { tier: 'pro', daily_limit: -1, used_today: 0 };
  test('wrap: unchanged while off', P.wrap(pro) === pro);
  a.store.nplus_admin_free_preview = '1';
  const w = P.wrap(pro);
  test('wrap: admin + flag gives tier free, limit 15, used = answered today', P.on() === true && w.tier === 'free' && w.daily_limit === 15 && w.used_today === 9);
  a.store.nplus_admin_free_preview_kg = JSON.stringify({ day: '2026-10-31', count: 9 }); n.n = 12;
  test('wrap: Keep going starts a new 15 (counts only answers after the tap)', P.wrap(pro).used_today === 3);
  a.store.nplus_admin_free_preview_kg = JSON.stringify({ day: '2026-10-30', count: 9 });
  test('wrap: a Keep going from yesterday no longer counts', P.wrap(pro).used_today === 12);
  a.win._certanvilIsAdmin = false;
  test('on() is false for a non-admin even with the flag', P.on() === false && P.wrap(pro) === pro);
  a.win._certanvilIsAdmin = true; P.clear();
  test('clear (sign-out) removes the flag and the Keep going record', !('nplus_admin_free_preview' in a.store) && !('nplus_admin_free_preview_kg' in a.store) && P.on() === false);
  const b = sandbox({ n: 0 }, false); b.win._adminPreview.set(true);
  test('set(true) is refused for a non-admin (no flag written)', !('nplus_admin_free_preview' in b.store));
})();
