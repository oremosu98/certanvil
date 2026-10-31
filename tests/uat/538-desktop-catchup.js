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
  test('dg-system.css version bumped for the resume card', /dg-system\.css\?v=8\.204\.0-d2/.test(html));
})();
