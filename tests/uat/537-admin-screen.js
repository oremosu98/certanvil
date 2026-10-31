// tests/uat/537-admin-screen.js
// Admin in the app, Task 8: the Admin screen (features/admin-screen.js; drawing mockups/cert-ios-admin.html, phone and ?v=desktop*).
// Source contracts plus the real ago() run in a sandbox; behaviour on screen is in tests/e2e/admin-screen.spec.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Admin screen ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const as = read('features/admin-screen.js'), hub = read('features/ios-hub.js'), home = read('features/home.js'), html = read('index.html');
  const ad = read('features/admin-data.js'), lift = read('lift-ios.css'), dg = read('dg-system.css'), ap = read('features/admin-preview.js');
  const dash = String.fromCharCode(0x2014);

  test('admin-screen.js loads right after admin-preview.js', /features\/admin-preview\.js"><\/script>\n<script defer src="features\/admin-screen\.js"><\/script>/.test(html));
  test('desktop host #page-admin > #desk-admin exists', /<div id="page-admin" class="page">\s*<div id="desk-admin"><\/div>\s*<\/div>/.test(html));
  test('openAdmin refuses a non-admin', /function openAdmin\(view\) \{\s*if \(!isAdmin\(\)\) return false;/.test(as) && /function isAdmin\(\) \{ return window\._certanvilIsAdmin === true; \}/.test(as));
  test('hub: Admin row only for the admin, act admin opens it over the hub, the count is fetched when the hub opens',
    /var adm = window\._certanvilIsAdmin === true && typeof window\.openAdmin === 'function';/.test(hub) && /<b>Admin<\/b><span>Requests, bug reports, errors<\/span>/.test(hub)
    && /act === 'admin'\) \{ b\.focus\(\); if \(typeof window\.openAdmin === 'function'\) window\.openAdmin\('admin'\); \}/.test(hub)
    && /window\.adminScreen\.refreshCount\(\)/.test(hub) && /var ad = document\.getElementById\('ios-admin'\);\s*if \(ad && !ad\.hidden\) return;/.test(hub));
  test('sidebar: home.js asks admin-screen for the Admin item after drawing (app.js untouched); crumb says Admin',
    /if \(typeof window\._adminSidebar === 'function'\) window\._adminSidebar\(\);/.test(home) && /'admin': 'Admin',/.test(home) && !/_adminSidebar/.test(read('app.js')));
  test('the sidebar item follows the admin flag (admin-preview fires ca:admin)', /dispatchEvent\(new Event\('ca:admin'\)\)/.test(ap) && /addEventListener\('ca:admin'/.test(as));
  test('every section is a labelled region', ['today', 'req', 'rep', 'err', 'prev'].every((k) => as.includes('aria-labelledby="adm-s-' + k + '"')));
  test('each section loads on its own with a named Couldn’t load … Retry.', /Couldn' \+ Q \+ 't load ' \+ ERR_WHAT\[key\] \+ '\./.test(as) && /var ERR_WHAT = \{ today: 'today' \+ Q \+ 's numbers', req: 'cert requests', rep: 'bug reports', err: 'errors', list: 'the list' \};/.test(as) && /data-retry="' \+ key \+ '">Retry</.test(as) && /\['today', 'req', 'rep', 'err'\]\.forEach\(function \(k\) \{ load\(k, quiet\); \}\)/.test(as));
  test('copy verbatim from the drawing', ['Preview as Free', 'See the locks and the 15-a-day counter. You can still study as much as you like.', 'Full dashboard on certanvil.com',
    'Users, cert packs and recent ships', 'Warning email at 80%', 'Based on the latest 500 errors.', 'Admin needs a connection. Your studying still works.',
    'Close, no email', 'Fixed, tell them', 'Send and close', 'What people said', 'Reports from the same screen, cert and version are grouped, so one action handles them all.',
    'Show 20 more', 'Search reports', 'Search exams', 'Not told yet', 'Can hear back', 'Active this week', 'Errors today'].every((s) => as.includes(s)));
  test('no em dashes in the module copy', !as.includes(dash));
  test('the module never names the founder', !/simi|oremosu/i.test(as));
  test('user-written text goes through _esc (titles, descriptions, steps, labels, messages)',
    /_esc\(titleOf\(r\)\)/.test(as) && /_esc\(r\.description\)/.test(as) && /_esc\(r\.steps\)/.test(as) && /_esc\(r\.label \|\| k\)/.test(as) && /_esc\(e\.message\)/.test(as) && /_esc\(SH\.err\)/.test(as));
  test('the group sheet acts on its own snapshot (key, ids, rows), never on S.groups by index', /SH\.group = kind === 'group' \? group : null;/.test(as)
    && /g = SH\.kind === 'group' \? SH\.group : null/.test(as) && /runAct\(action, g\.ids\.slice\(\)/.test(as) && !/S\.groups\[SH\.id\]/.test(as) && /data-grp="' \+ _esc\(g\.key\)/.test(as));
  test('after a partial run the group narrows to ids past the cursor (all ids when some failed)', /var left = \(p\.failed \|\| p\.next == null\) \? g\.ids : g\.ids\.filter\(function \(id\) \{ return id > p\.next; \}\);/.test(as));
  test('the admin flag dropping closes an open sheet at once; the sidebar count is throttled', /if \(sheetOpen\(\)\) closeSheet\(true\);\s*close\(\);/.test(as) && /refreshCount\(true\);\s*\}/.test(as) && /COUNT_EVERY = 30000/.test(as));
  test('copy: no "Sent to 0 people", Couldn\u2019t finish, pluralised closed', /\(tot\.sent \? 'Sent to ' \+ people\(tot\.sent\) \+ ' so far\. ' : ''\)/.test(as) && /'Couldn' \+ Q \+ 't finish\. Try again\.'/.test(as) && !/Could not/.test(as) && /' report closed' : ' reports closed'/.test(as));
  test('cert requests reuse the notify-cert-live loop', /\/api\/admin\/notify-cert-live/.test(as) && /if \(b\.next && b\.next !== after\) return step\(b\.next\);/.test(as));
  test('Escape handled once (capture phase, preventDefault): sheet, then list, then Admin', /document\.addEventListener\('keydown', onKey, true\)/.test(as) && /ev\.preventDefault\(\);[^\n]*\n\s*if \(sheetOpen\(\)\) closeSheet\(\);/.test(as));
  test('un-inert first on close', /_inertBehind\(false\);   \/\/ un-inert first/.test(as));
  test('desktop dialogs use caDialogFrame', /window\.caDialogFrame\(SH\.host, \{ size: 'md'/.test(as));
  test('admin-data: steps selected, requestTotals and reporterEmail exported', /title,description,steps,status/.test(ad) && /requestTotals: requestTotals, reporterEmail: reporterEmail/.test(ad));
  test('phone: #ios-admin and its scrim join the Free bar offset list; the sheet clears it too',
    /\.quota-exceeded-modal, #ios-admin, \.adm-scrim\) \{ top: var\(--ap-free-top, 0px\) !important; \}/.test(lift) && /\.adm-sheet \{ position: fixed;[^}]*top: calc\(var\(--ap-free-top, 0px\) \+/.test(lift));
  test('motion: sheet on the drawer curve, reveal on first paint only, reduced motion fades, hover gated',
    /\.adm-sheet\.open \{ transform: none; transition: transform \.34s var\(--ease-drawer, cubic-bezier\(0\.32,0\.72,0,1\)\); \}/.test(lift)
    && /\.adm-first \.adm-sec:not\(\[data-still\]\) \.adm-rv/.test(lift) && /\.adm-first \.adm-sec:not\(\[data-still\]\) \.adm-rv/.test(dg)
    && /prefers-reduced-motion: reduce\) \{\s*#ios-admin \.adm-first/.test(lift) && /\(hover: hover\) and \(pointer: fine\) \{\s*#ios-admin \.adm-row/.test(lift));
  test('touch targets: rows, back, buttons, search at least 44px', /#ios-admin \.adm-back \{[^}]*width: 44px; height: 44px;/.test(lift) && /#ios-admin \.adm-row \{[^}]*min-height: 44px;/.test(lift) && /\.adm-btn-pri \{[^}]*min-height: 44px;/.test(lift));
  test('desktop: two columns with Today across the top', /#desk-admin\.adm-main \.adm-body\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/.test(dg) && /#desk-admin\.adm-main \.adm-today\{grid-column:1\/-1;/.test(dg));

  // ago(): the relative times on rows and sheets
  const box = { window: {}, document: { readyState: 'complete', addEventListener() {}, getElementById() { return null; }, querySelector() { return null; } }, navigator: {} };
  box.window.matchMedia = () => ({ matches: true, addEventListener() {} });
  box.window.addEventListener = () => {};
  box.window.location = { hostname: 'localhost' };
  vm.createContext(box);
  vm.runInContext('var window = this.window; window.document = this.document; var document = this.document; var navigator = this.navigator;' + as, box);
  const ago = box.window.adminScreen.ago, now = Date.parse('2026-10-31T12:00:00Z');
  const at = (ms) => new Date(now - ms).toISOString();
  test('ago(): just now / minutes / hours / yesterday / days / last week / weeks',
    ago(at(20e3), now) === 'just now' && ago(at(60e3), now) === '1 minute ago' && ago(at(5 * 60e3), now) === '5 minutes ago' && ago(at(2 * 3600e3), now) === '2 hours ago'
    && ago(at(30 * 3600e3), now) === 'yesterday' && ago(at(3 * 86400e3), now) === '3 days ago' && ago(at(9 * 86400e3), now) === 'last week' && ago(at(21 * 86400e3), now) === '3 weeks ago' && ago('nope', now) === '');
})();
