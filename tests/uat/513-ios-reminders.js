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
  } catch (err) {
    test('Stage 5d reminders: block (threw)', false);
    results.errors.push('513 ios-reminders block threw: ' + err.message);
  }
})();
