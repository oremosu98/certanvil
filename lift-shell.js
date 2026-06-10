/* LIFT-SHELL · Phase 0 — bottom tab bar + showPage hook.
   Companion to lift-shell.css; see the plan doc for the phase map.
   Drills tab routes to Home (its drill section) until the dedicated Drills
   screen lands in Phase 3. */
(function () {
  'use strict';

  var TABS = [
    { page: 'setup',    label: 'Home',     icon: '<path d="M4 11l8-7 8 7"></path><path d="M6 10v9h12v-9"></path>' },
    { page: 'drills',   label: 'Drills',   icon: '<path d="M4 6h16M4 12h16M4 18h10"></path>' },
    { page: 'progress', label: 'Progress', icon: '<path d="M5 19V9M12 19V4M19 19v-7"></path>' },
    { page: 'settings', label: 'Account',  icon: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>' }
  ];

  /* session/immersive pages render without the tab bar (mockup behaviour) */
  var HIDE_ON = {
    'quiz': 1, 'exam': 1, 'diagnostic-quiz': 1, 'loading': 1, 'review': 1,
    'sr-review': 1, 'session-transition': 1, 'acl-pbq': 1, 'guided-lab': 1,
    /* session-end screens carry their own mockup footer (rfoot) */
    'results': 1, 'exam-results': 1, 'session-complete': 1
  };

  /* tab to light when a non-tab page is active */
  var LIGHT_AS = { 'analytics': 'progress', 'topic-dive': 'progress', 'diagnostic-result': 'setup' };

  function init() {
    if (document.getElementById('lift-tabbar')) return;
    var bar = document.createElement('nav');
    bar.id = 'lift-tabbar';
    bar.setAttribute('aria-label', 'Primary');
    bar.innerHTML = TABS.map(function (t) {
      return '<button type="button" class="lift-tab" data-page="' + t.page + '" aria-label="' + t.label + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + t.icon + '</svg><span>' + t.label + '</span></button>';
    }).join('');
    document.body.appendChild(bar);

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.lift-tab');
      if (!b || typeof window.showPage !== 'function') return;
      var page = b.getAttribute('data-page');
      if (page === 'drills') {
        window.showPage('setup');
        /* until Phase 3: land on Home's drill entry points */
        var drill = document.getElementById('btn-drill-mistakes');
        if (drill) { try { drill.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) {} }
        return;
      }
      window.showPage(page);
    });

    /* keep tab state + tab bar visibility in sync with navigation */
    if (typeof window.showPage === 'function' && !window.showPage.__liftWrapped) {
      var orig = window.showPage;
      var wrapped = function (name) {
        var r = orig.apply(this, arguments);
        try { sync(name); } catch (_) {}
        return r;
      };
      wrapped.__liftWrapped = true;
      window.showPage = wrapped;
    }
    sync(currentPage());
  }

  function currentPage() {
    var el = document.querySelector('.page.active');
    return el ? el.id.replace(/^page-/, '') : 'setup';
  }

  function sync(name) {
    document.body.classList.toggle('lift-no-tabbar', !!HIDE_ON[name]);
    var lit = LIGHT_AS[name] || name;
    var tabs = document.querySelectorAll('#lift-tabbar .lift-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('on', tabs[i].getAttribute('data-page') === lit);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
