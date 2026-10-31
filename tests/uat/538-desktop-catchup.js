// tests/uat/538-desktop-catchup.js
// Desktop catch-up: source contracts for the pieces that are not behaviour (behaviour is in tests/e2e/desktop-*.spec.js).
const fs = require('fs');
const path = require('path');
const { test } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Desktop catch-up ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const home = fs.readFileSync(path.join(ROOT, 'features', 'home.js'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'dg-system.css'), 'utf8');
  const dash = String.fromCharCode(0x2014);

  // Task 2: Finish your quiz on desktop Home
  test('resume card: the host is made between the console bar and the bento, hidden until there is a save', /querySelector\('#page-setup \.board > \.bento'\)[\s\S]{0,300}insertBefore\(host, bento\)/.test(home) && /host\.hidden = true/.test(home));
  test('resume card: reads the one saved quiz, resumes and clears through the shared helpers', /renderDeskResume/.test(home) && /quizResumeState\(\)/.test(home) && /resumeQuiz\(\)/.test(home) && /quizResumeClear\(\)/.test(home));
  test('resume card: drawing copy, and the card renders on every Home render', /Pick up where you left off/.test(home) && /Finish your quiz \\u00B7 /.test(home) && /Start fresh/.test(home) && /renderDeskResume\(\); \} catch/.test(home));
  test('resume card: desktop only, phone Home untouched', /@media \(min-width:900px\)\{\s*#desk-resume:not\(\[hidden\]\)/.test(css) && /caIsDesk\(\)/.test(home));
  test('resume card: no em dash in its markup or styles', !new RegExp(dash).test(home.slice(home.indexOf('function renderDeskResume'), home.indexOf('// RECOMMENDED-NEXT tile'))) && !new RegExp(dash).test(css.slice(css.indexOf('Desktop catch-up Task 2'))));
  test('dg-system.css version bumped for the resume card', /dg-system\.css\?v=8\.204\.0-d(?:[2-9]|\d\d)/.test(html));

  // Task 3: How did your exam go, on desktop
  const lr = fs.readFileSync(path.join(ROOT, 'features', 'ios-log-result.js'), 'utf8');
  test('outcome card: fills the Recommended next slot after exam, quiz and reviews (the phone order)', /_renderHomeForecast\(false\);[^\n]*\n\s*if \(_deskOcSlot\(_deskOutcomeRec\(\)\)\) return;/.test(home) && /quizResumeState\(\)\) return null/.test(home));
  test('outcome card: phone copy verbatim', /How did your ' \+ name \+ ' exam go\?/.test(home) && /Tell us and we'll update your plan\./.test(home) && /I haven\\'t sat it yet/.test(home) && /Pick your next cert/.test(home) && /Your streak carries on with your next cert\./.test(home));
  test('log result: opens on desktop through caDialogFrame (size sm); the frame owns Escape there', /caDialogFrame\(root, \{ size: 'sm'/.test(lr) && /root\.onkeydown = desk \? null/.test(lr) && !/if \(!isPhone\(\)\) return false;/.test(lr));
  test('log result: inner desktop styles live in dg-system.css (lift-ios.css is phone-only)', /#ios-log-result\.is-dialog \.il-seg/.test(css) && /#desk-oc:not\(\[hidden\]\)/.test(css));
  test('dg-system.css version bumped for the exam outcome', /dg-system\.css\?v=8\.204\.0-d(?:[3-9]|\d\d)/.test(html));

  // Task 4: My certs as a desktop page
  const hub = fs.readFileSync(path.join(ROOT, 'features', 'ios-hub.js'), 'utf8');
  const st = fs.readFileSync(path.join(ROOT, 'features', 'settings.js'), 'utf8');
  test('My certs: a #page-mycerts host, and openHub shows it through showPage on desktop', /<div id="page-mycerts" class="page">[\s\S]{0,120}<div id="desk-mycerts"><\/div>/.test(html) && /if \(!isPhone\(\)\) return _openDesk\(\);/.test(hub) && /showPage\('mycerts'\)/.test(hub));
  test('My certs: the desktop page renders the shared model (one rule set with the phone hub)', /var m = _iosHubModel\(_input\(\)\);[\s\S]{0,1200}_deskHtml\(m, suggest, wait\)/.test(hub));
  test('My certs: Free never switches, even from a stale tile', /if \(!_iosHubModel\(_input\(\)\)\.pro\) return;/.test(hub));
  test('My certs: sidebar item under Account, above Settings', /page: 'mycerts',[^\n]*label: 'My certs'[^\n]*\n\s*\{ page: 'settings'/.test(home));
  test('My certs: Settings shows one My certs row on desktop; the phone page keeps the Pass Plan html', /host\.innerHTML = _ppDesk\(\) \? _passPlanDeskHtml\(html\) : html;/.test(st) && /patch\(\{ passPlanHtml: html \}\)/.test(st));
  test('My certs: no em dash in its markup or styles', !new RegExp(dash).test(hub.slice(hub.indexOf('function _deskHtml'), hub.indexOf('function openHub'))) && !new RegExp(dash).test(css.slice(css.indexOf('Desktop catch-up Task 4'))));
  test('dg-system.css version bumped for My certs', /dg-system\.css\?v=8\.204\.0-d(?:[4-9]|\d\d)/.test(html));

  // Task 8: goodbye and welcome back on desktop
  test('goodbye/welcome back: desktop layout lives in dg-system.css under min-width:900 with its own keyframes, and the brand mark is phone-hidden', /\.dm-screen \.cover-brand\{display:none;\}\s*@media \(min-width:900px\)\{\s*\.dm-screen\{/.test(css) && /@keyframes dmd-rise/.test(css));
  // Final review: Sign back in comes first on desktop in the markup itself (Tab follows what is drawn), never by CSS order
  test('goodbye: the button order is set in the markup by width, not by CSS order', !/\.dm-foot \[data-act="signin"\]\{order:/.test(css) && /f\.insertBefore\(si, f\.firstChild\)/.test(home) && /else f\.appendChild\(si\)/.test(home));
  test('goodbye/welcome back: no em dash in the desktop styles', !new RegExp(dash).test(css.slice(css.indexOf('Desktop catch-up Task 8'))));
  test('dg-system.css version bumped for the goodbye', /dg-system\.css\?v=8\.204\.0-d(?:[8-9]|\d\d)/.test(html));

  // Task 9: no unbacked PBQ weight claim anywhere in the shipped source
  const srcFiles = ['index.html', 'app.js'].concat(['features', 'certs'].reduce((a, d) => a.concat(fs.readdirSync(path.join(ROOT, d)).filter((f) => /\.js$/.test(f)).map((f) => d + '/' + f)), []));
  const claims = srcFiles.filter((f) => /PBQs?[^\n]{0,80}3\s*-\s*4\s*[\u00D7x]|3\s*-\s*4\s*[\u00D7x][^\n]{0,80}PBQs?/i.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  test('no source file claims PBQs carry 3-4x weight (' + (claims.join(', ') || 'none') + ')', claims.length === 0);
  test('the PBQ copy is the approved line', html.includes('Performance-based questions are part of the real exam. Practise them in Sim Lab.') && fs.readFileSync(path.join(ROOT, 'features', 'diagnostic.js'), 'utf8').includes('Performance-based questions are part of the real exam. Practise them in Sim Lab. ACL ordering is the most-confused firewall concept. Build the muscle now.'));
})();
