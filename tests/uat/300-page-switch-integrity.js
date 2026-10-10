// tests/uat/300-page-switch-integrity.js
// Scope: showPage must leave exactly ONE active page, and a finished switch
// must never fire again.
//
// Why this module exists (v8.148.0, founder report 2026-10-10): starting a new
// quiz showed the PREVIOUS quiz where it was left off. Root cause, reproduced
// on localhost: a page exit completed either on `animationend` OR a 300ms
// fallback timer. When the timer won (main thread busy after the switch, or a
// background tab where animations don't run), the animationend listener was
// never removed. It stayed on the old page and fired the next time ANY
// animation ended there (that page's own fade-in on its next visit), re-running
// the stale switch: the new quiz's loading screen jumped to the old quiz page.
// The listener also reacted to child animations bubbling up, and two switches
// close together could leave two pages active (only the first in DOM order was
// ever deactivated afterwards, so the second stuck around as a ghost).
//
// These tests drive the real showPage body against a tiny fake DOM so each of
// those event orders can be replayed deterministically.

const { _fnBody, appJs, test, vm } = require('./_context');

(function () {
  const body = _fnBody(appJs, 'showPage');

  function makeHarness(opts) {
    const order = ['setup', 'loading', 'quiz', 'results'];
    const timers = [];
    function El(id) {
      const cls = new Set(id ? ['page'] : []);
      const ls = [];
      this.id = id ? 'page-' + id : '';
      this.classList = {
        add: (...c) => c.forEach(x => cls.add(x)),
        remove: (...c) => c.forEach(x => cls.delete(x)),
        contains: (c) => cls.has(c),
        toggle: (c, on) => { if (on === undefined ? !cls.has(c) : on) cls.add(c); else cls.delete(c); }
      };
      this.addEventListener = (type, fn, o) => ls.push({ type, fn, once: !!(o && o.once) });
      this.removeEventListener = (type, fn) => { const i = ls.findIndex(l => l.type === type && l.fn === fn); if (i !== -1) ls.splice(i, 1); };
      this.fire = (type, target) => {
        const ev = { type, target: target || this, animationName: 'x' };
        ls.filter(l => l.type === type).slice().forEach(l => { if (l.once) this.removeEventListener(type, l.fn); l.fn.call(this, ev); });
      };
      this.listenerCount = (type) => ls.filter(l => l.type === type).length;
      this.querySelector = () => null;
      this.hasAttribute = () => true;
      this.setAttribute = () => {};
      this.focus = () => {};
    }
    const pages = {};
    order.forEach(id => { pages[id] = new El(id); });
    pages.setup.classList.add('active');
    const all = () => order.map(id => pages[id]);
    const doc = {
      hidden: !!(opts && opts.hidden),
      body: { classList: { remove() {}, add() {} } },
      getElementById: (id) => pages[id.replace(/^page-/, '')] || null,
      querySelector: (sel) => sel === '.page.active' ? (all().find(p => p.classList.contains('active')) || null) : null,
      querySelectorAll: (sel) => sel === '.page.active' ? all().filter(p => p.classList.contains('active'))
        : sel === '.page' ? all() : []
    };
    const ctx = {
      document: doc,
      window: { scrollTo() {}, renderProgressPage: 1, renderAnalytics: 1, renderSettingsPage: 1 },
      PRO_ONLY_PAGES: {},
      setTimeout: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length; },
      clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].live = false; },
      _pageSwitchDone: null
    };
    vm.createContext(ctx);
    vm.runInContext('var _pageSwitchDone = null;\n' + body, ctx);
    return {
      show: (n) => vm.runInContext('showPage(' + JSON.stringify(n) + ')', ctx),
      runTimers: () => { timers.splice(0).forEach(t => { if (t.live) t.fn(); }); },
      active: () => all().filter(p => p.classList.contains('active')).map(p => p.id.replace('page-', '')),
      pages, doc
    };
  }

  test('v8.148.0 showPage: a switch finished by the fallback timer cannot fire again later (old quiz hijacking a new loading screen)', (() => {
    try {
      const h = makeHarness();
      h.show('loading'); h.pages.setup.fire('animationend'); h.runTimers();      // normal exit
      h.show('quiz'); h.runTimers();                                              // timer wins (busy thread / background tab)
      h.show('setup'); h.pages.quiz.fire('animationend'); h.runTimers();          // user goes home
      h.show('loading'); h.pages.setup.fire('animationend'); h.runTimers();      // starts a NEW quiz
      h.pages.loading.fire('animationend');                                       // loading's own fade-in ends
      const a = h.active();
      return a.length === 1 && a[0] === 'loading';
    } catch (e) { return false; }
  })());

  test('v8.148.0 showPage: a child animation ending inside the old page does not complete its exit', (() => {
    try {
      const h = makeHarness();
      h.show('loading');
      h.pages.setup.fire('animationend', { id: 'tile' });                         // bubbled from a child
      const early = h.active();
      h.pages.setup.fire('animationend');
      const a = h.active();
      return early.length === 1 && early[0] === 'setup' && a.length === 1 && a[0] === 'loading';
    } catch (e) { return false; }
  })());

  test('v8.148.0 showPage: two switches in quick succession leave exactly one active page', (() => {
    try {
      const h = makeHarness();
      h.show('loading'); h.show('quiz');                                          // second call mid-exit
      h.pages.setup.fire('animationend'); h.runTimers();
      h.show('results'); h.runTimers();
      const a = h.active();
      return a.length === 1 && a[0] === 'results';
    } catch (e) { return false; }
  })());

  test('v8.148.0 showPage: in a background tab the switch is immediate and leaves no pending listener', (() => {
    try {
      const h = makeHarness({ hidden: true });
      h.show('quiz');
      const a = h.active();
      return a.length === 1 && a[0] === 'quiz' && h.pages.setup.listenerCount('animationend') === 0;
    } catch (e) { return false; }
  })());
})();
