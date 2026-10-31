// tests/uat/534-report-sheet.js
// Admin in the app, Task 3: one "Report a problem" form on every platform (drawing mockups/cert-ios-report.html).
// Source contracts only; behaviour is in tests/e2e/report-sheet.spec.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Report a problem (one form) ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const sheet = read('features/report-sheet.js'), reports = read('features/reports.js'), html = read('index.html');
  const ist = read('features/ios-settings.js'), st = read('features/settings.js'), hub = read('features/ios-hub.js');
  const dg = read('dg-system.css'), lift = read('lift-ios.css');
  const dash = String.fromCharCode(0x2014);

  test('report-sheet.js loads right after ios-suggest.js', /features\/ios-suggest\.js"><\/script>\n<script defer src="features\/report-sheet\.js"><\/script>/.test(html));
  test('drawing copy verbatim: eyebrow, title, sub, hear-back lines, labels, buttons',
    /'Help<\/span>/.test(sheet) && /Report a problem<\/h2>/.test(sheet) && /Tell us what went wrong\. A real person reads every report\./.test(sheet)
    && /We’ll email you when it’s fixed\./.test(sheet) && /Sign in<\/button> to hear back when it’s fixed\. What you’ve typed stays here\./.test(sheet)
    && /What happened\?/.test(sheet) && /Add the steps, if you remember them/.test(sheet) && />Cancel</.test(sheet) && /Send report/.test(sheet) && /From <b>/.test(sheet));
  test('toast copy verbatim: thanks (with and without a name), signed-out sub, queued',
    /'Thanks, ' \+ \(first \? e\(first\) \+ ', ' : ''\) \+ 'got it\.'/.test(sheet) && /' Report <span class="irp-toast-n">#'/.test(sheet)
    && /We read every report\./.test(sheet) && /'Saved', 'We’ll send it when you’re back online\.'/.test(sheet));
  test('one textarea capped at 5,000; no title field', /maxlength="' \+ MAX \+ '"/.test(sheet) && /var MAX = 5000;/.test(sheet) && !/<input/.test(sheet));
  test('sends through reports.submitReportNow (lazy-loaded) and closes before the thanks enters',
    /_loadFeature\('reports'\)/.test(sheet) && /submitReportNow\(form\)/.test(sheet) && /close\(\);\s*\n\s*setTimeout\(function \(\) \{ _thanks/.test(sheet));
  test('desktop goes through caDialogFrame; phones trap Tab, inert behind and take Escape',
    /caDialogFrame\(S\.host, \{ size: 'sm'/.test(sheet) && /_inertBehind\(S\)/.test(sheet) && /ev\.key === 'Escape'/.test(sheet) && /ev\.key !== 'Tab'/.test(sheet));
  test('"Something wrong? Tell us" follows whatever fills #setup-err', /getElementById\('setup-err'\)/.test(sheet) && /MutationObserver\(sync\)/.test(sheet) && /Something wrong\? Tell us/.test(sheet));
  test('the typed text survives Sign in (sessionStorage draft, never localStorage)', /sessionStorage\.setItem\(DRAFT/.test(sheet) && !/localStorage\.setItem/.test(sheet));
  test('the draft expires after 30 minutes and is dropped once a report is sent', /var DRAFT_TTL = 30 \* 60 \* 1000;/.test(sheet) && /Date\.now\(\) - d\.at > DRAFT_TTL/.test(sheet) && /_dropDraft\(\);   \/\/ sent/.test(sheet));
  test('sheet and toast move on the drawer curve, fade on the brand curve',
    /\.irp-sheet\.open \{ transform: none; transition: transform \.36s var\(--ease-drawer, cubic-bezier\(0\.32,0\.72,0,1\)\); \}/.test(lift)
    && /\.irp-toast\.open \{ opacity: 1; transform: none; transition: transform \.34s var\(--ease-drawer, cubic-bezier\(0\.32,0\.72,0,1\)\), opacity \.25s var\(--ios-ease\); \}/.test(lift)
    && /\.irp-toast\.open\{opacity:1;transform:none;transition:transform \.34s cubic-bezier\(0\.32,0\.72,0,1\),opacity \.25s cubic-bezier\(0\.16,1,0\.3,1\);\}/.test(dg));
  test('reports.js: the old drawer UI is gone, openDrawer opens the one form',
    !/_drawerHtml|_wireForm|_wireSubmit|bug-report-drawer|closeDrawer/.test(reports) && /function openDrawer\(opts\) \{\s*\n\s*if \(typeof window\.openReportSheet === 'function'\) window\.openReportSheet\(opts\);/.test(reports)
    && /openDrawer: openDrawer/.test(reports));
  test('phone Settings: a Help section with the report row, before the danger zone',
    /row\('report', 'flag', 'Report a problem', 'Bugs, wrong answers, anything off', null\)/.test(ist)
    && ist.indexOf("'report', 'flag'") < ist.indexOf('Danger zone</div>') && /ON\.report = function/.test(ist));
  test('desktop Settings: the report row sits in the section that holds the queued-reports panel',
    /id="settings-report-btn"/.test(st) && /renderSettingsReportsPanel\(reportsPanel\)/.test(st));
  test('ios-hub exports the greeting name rule', /window\._hubFirstName = _hubFirstName;/.test(hub) && /var first = _hubFirstName\(o\.name, o\.email\);/.test(hub));
  test('CSS: phone sheet in lift-ios.css, desktop dialog in dg-system.css; old drawer CSS gone',
    /\.irp-sheet \{ position: fixed;/.test(lift) && /#ios-report\.is-dialog\{width:min\(480px/.test(dg) && !/#bug-report-drawer|\.br-backdrop|\.br-send/.test(dg));
  test('CSS: reduced motion fades only, hover gated', /prefers-reduced-motion: reduce\) \{\s*\n\s*\.irp-sheet, \.irp-sheet\.open \{ transform: none; opacity: 0;/.test(lift)
    && /\(hover:hover\) and \(pointer:fine\)\{\s*\n\s*#ios-report\.is-dialog \.irp-close:hover/.test(dg));
  test('no em dash in the form, its styles or its tests', !sheet.includes(dash) && !lift.slice(lift.indexOf('Admin in the app Task 3')).includes(dash) && !dg.slice(dg.indexOf('Admin in the app Task 3: Report a problem')).includes(dash));
  test('dg-system.css and lift-ios.css versions bumped for the report form', /dg-system\.css\?v=8\.204\.0-d(1\d|[2-9]\d)/.test(html) && /lift-ios\.css\?v=8\.204\.[1-9]\d*"/.test(html));

  // the link only under real failures: run isFailure against every #setup-err message family
  const g0 = sheet.indexOf('  var GUIDANCE = ['), g1 = sheet.indexOf('  function _wireSetupErr');
  const gctx = vm.createContext({});
  vm.runInContext(sheet.slice(g0, g1), gctx);
  const fail = (t) => vm.runInContext('isFailure(' + JSON.stringify(t) + ')', gctx);
  test('Tell us link: none for sign-in, API-key setup and daily-limit guidance',
    !fail('Sign in to study free: 15 questions a day, no API key needed. Tap "Sign in" at the top right.') && !fail('\u26a0\ufe0f Sign in to study · 15 free questions/day at certanvil.com.')
    && !fail('Invalid API key format. Anthropic keys start with "sk-ant-".') && !fail('API key looks too short. Please check and try again.')
    && !fail('You’ve used your 15 free questions today. Upgrade to Pro for unlimited study.') && !fail(''));
  test('Tell us link: shown for generation, validation, network and timeout failures',
    fail('\u26a0\ufe0f All generated questions failed validation. Try again.') && fail('Couldn’t make new questions this time. Try again.') && fail('No questions could be generated. Try again.')
    && fail('\u26a0\ufe0f AI returned malformed data. Please try again.') && fail('Timed out after 30000ms: batch') && fail('The AI service returned an error. Try again.') && fail('\u26a0\ufe0f Failed. Check your API key.'));
  test('custom quiz screen follows the same rule', /window\.iosReport\.isFailure\(m\.err\)/.test(read('features/ios-custom.js')));

  // the name rule, run: a real profile name, an email-derived one, none
  const ctx = vm.createContext({});
  const start = hub.indexOf('function _hubFirstName'), end = hub.indexOf('function _hubShort');
  vm.runInContext(hub.slice(start, end), ctx);
  test('_hubFirstName: Alex → Alex; alex.smith with that email → none; digits → none',
    vm.runInContext("_hubFirstName('alex', 'sam@x.com')", ctx) === 'Alex' && vm.runInContext("_hubFirstName('alex.smith', 'alex.smith@x.com')", ctx) === ''
    && vm.runInContext("_hubFirstName('al3x', '')", ctx) === '' && vm.runInContext("_hubFirstName('', 'a@b.c')", ctx) === '');
})();
