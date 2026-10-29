// Stage 5d (29 Oct): study reminders. The pinned plugins, and the one place that names them (native-shell.js).
const { fs, path, ROOT, test, results } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Stage 5d study reminders ──\x1b[0m');
  try {
    const read = (p) => { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
    const pkg = JSON.parse(read('package.json') || '{}'), dep = pkg.dependencies || {};
    test('local-notifications is pinned to exactly 8.3.1 and app-launcher to 8.0.1',
      dep['@capacitor/local-notifications'] === '8.3.1' && dep['@capacitor/app-launcher'] === '8.0.1');
    const others = ['features/ios-reminders.js', 'features/ios-settings.js', 'features/ios-home.js', 'features/ios-quiz.js', 'features/ios-exam.js', 'app.js']
      .filter((f) => /LocalNotifications|AppLauncher/.test(read(f)));
    test('only native-shell.js names the LocalNotifications and AppLauncher plugins', others.length === 0);
    const ns = read('native-shell.js');
    test('native-shell.js defines caNative.reminders, openAppSettings and the app-active event',
      /\breminders: reminders\b/.test(ns) && /var reminders = \{/.test(ns) && /openAppSettings: function/.test(ns) && /ca:app-active/.test(ns));
    // Task 3: the planner suite, run in a real UK time zone so the clock-change weeks are tested
    const { spawnSync } = require('child_process');
    const pr = spawnSync(process.execPath, ['--experimental-detect-module', path.join(ROOT, 'tests/reminders-planner.test.mjs')], { encoding: 'utf8', timeout: 30000, env: Object.assign({}, process.env, { TZ: 'Europe/London' }) });
    test('reminder planner suite passes in Europe/London (' + ((pr.stdout || '').match(/reminders-planner: (\d+\/\d+) passed/) || [, 'no result'])[1] + ')',
      pr.status === 0 && /reminders-planner: (\d+)\/\1 passed/.test(pr.stdout || ''));
    // Task 4: both results screens tell the reminders a session finished (once per session)
    test('ios-quiz and ios-exam results dispatch ca:quiz-finished', /ca:quiz-finished/.test(read('features/ios-quiz.js')) && /ca:quiz-finished/.test(read('features/ios-exam.js')));
    test('index.html loads features/ios-reminders.js', /<script defer src="features\/ios-reminders\.js[^"]*"><\/script>/.test(read('index.html')));
    test('drills and Sim Lab never count as a finished quiz', !/ca:quiz-finished/.test(read('features/ios-drills.js')) && !/ca:quiz-finished/.test(read('features/sim-lab.js') + read('features/ios-simlab.js')));
    test('ios-home tells the reminders Home is showing (ca:home-shown)', /ca:home-shown/.test(read('features/ios-home.js')));
  } catch (err) {
    test('Stage 5d reminders: block (threw)', false);
    results.errors.push('513 ios-reminders block threw: ' + err.message);
  }
})();
