// features/ios-custom.js — Lift A: the phone Custom quiz (E2E cert-ios-custom-quiz.html, c75e41e8).
// A view over the existing #custom-quiz-section controls: _iosCustomSource scrapes them, the pure
// _iosCustomModel / _iosCustomHtml render #ios-custom, and every tap clicks the real hidden control.
// Spec: docs/superpowers/specs/2026-10-20-ios-custom-quiz-design.md. Desktop is untouched.
(function () {
  'use strict';
  if (!window._certanvilFeatures) window._certanvilFeatures = {};

  // Pure: src (plain data scraped from the hidden panel) + now -> view model. Self-contained so UAT
  // can run it in a bare vm via _fnBody.
  function _iosCustomModel(src, now) {
    now = now || new Date();
    var WEEK = 7 * 864e5;
    var DIFF_LABEL = { 'Foundational': 'Foundational', 'Exam Level': 'Exam level', 'Hard / Tricky': 'Hard', 'Mixed': 'Mixed' };
    var DIFF_TEXT = { 'Foundational': 'foundational', 'Exam Level': 'exam level', 'Hard / Tricky': 'hard', 'Mixed': 'mixed difficulty' };
    var MODE_COPY = {
      smart: ['Smart', 'Targets the topics you keep getting wrong.'],
      mixed: ['Mixed', 'A random spread across every topic.'],
      catchup: ['Catch-up', "Topics you haven't seen lately."]
    };
    // smaller certs leave the unused Network+ slots in the panel with no chips: drop them (review C1)
    var domainsIn = (src.domains || []).filter(function (d) { return d && d.topics && d.topics.length; });
    var domains = domainsIn.map(function (d) {
      var topics = (d.topics || []).map(function (t) { return { v: t.v, label: t.label, on: !!t.on }; });
      var picked = topics.filter(function (t) { return t.on; }).length;
      var allOn = topics.length > 0 && picked === topics.length;
      return {
        idx: d.idx, name: d.name, short: d.short, weight: d.weight || '', topicCount: topics.length,
        picked: picked, pickedLabel: picked ? (allOn ? 'all picked' : picked + ' picked') : '',
        allOn: allOn, expanded: picked > 0, topics: topics
      };
    });
    var modes = (src.modes || []).map(function (m) {
      var c = MODE_COPY[m.kind] || [m.v, ''];
      return { kind: m.kind, v: m.v, on: !!m.on, title: c[0], sub: c[1] };
    });

    // Catch-up: topics whose latest history row is 7+ days old, or never seen.
    var history = src.history || [];
    var last = {};
    history.forEach(function (r) {
      if (!r || typeof r.topic !== 'string') return;
      var t = Date.parse(r.date);
      if (!isFinite(t)) return;
      if (!(r.topic in last) || t > last[r.topic]) last[r.topic] = t;
    });
    var stale = 0;
    domains.forEach(function (d) {
      d.topics.forEach(function (t) {
        var seen = last[t.v];
        if (!(typeof seen === 'number' && now.getTime() - seen < WEEK)) stale++;
      });
    });
    var catchup = history.length === 0 ? { show: false, n: 0, text: '' }
      : { show: true, n: stale, text: stale === 0 ? 'All practised this week.' : 'not practised in a week' };

    var diffs = (src.diffs || []).map(function (x) { return { v: x.v, label: DIFF_LABEL[x.v] || x.v, on: !!x.on }; });
    var diffOn = diffs.filter(function (x) { return x.on; })[0];
    var diffText = diffOn ? (DIFF_TEXT[diffOn.v] || String(diffOn.label).toLowerCase()) : 'mixed difficulty';
    var free = !!src.freeTier;
    var counts = (src.counts || []).map(function (x) { return { v: String(x.v), on: !!x.on, overcap: free && parseInt(x.v, 10) > 15 }; });
    var countOn = counts.filter(function (x) { return x.on; })[0];

    var nTopics = 0, from = [];
    domains.forEach(function (d) { if (d.picked) { nTopics += d.picked; from.push(d.short || d.name); } });
    var foot;
    var anyMode = modes.some(function (m) { return m.on; });
    if (!nTopics && !anyMode && src.loneTopic) {
      // drill-a-topic on a topic the picker has no chip for: app.js's `topic` still holds it (minor 4)
      foot = '1 topic: ' + src.loneTopic + ', ' + diffText + '.';
    } else if (nTopics) {
      var where = from.length > 2 ? from.length + ' domains'
        : (from.length === 2 ? from[0] + ' and ' + from[1] : from[0]);
      foot = nTopics + (nTopics === 1 ? ' topic' : ' topics') + ' from ' + where + ', ' + diffText + '.';
    } else {
      var modeOn = modes.filter(function (m) { return m.on; })[0];
      var kind = modeOn ? modeOn.kind : 'mixed';
      foot = kind === 'smart' ? 'Your weakest topics, ' + diffText + '.'
        : kind === 'catchup' ? "The topics you've gone longest without, " + diffText + '.'
        : 'Mixed spread across all topics, ' + diffText + '.';
    }

    return {
      cert: src.cert || { mark: 'CA', name: '', code: '' },
      domains: domains, modes: modes, catchup: catchup, diffs: diffs, counts: counts,
      count: countOn ? parseInt(countOn.v, 10) : 10, foot: foot,
      // the phone screen hides the top bar, and the card carries its own Sign in button (minor 5)
      err: src.signIn ? String(src.err || '').replace(/\s*Tap\s+["\u201c]Sign in["\u201d]\s+at the top right\.?/i, '') : (src.err || ''),
      capNote: free, signIn: !!src.signIn
    };
  }

  // Pure: model -> markup of the E2E screen (ic- prefixed). Self-contained apart from escHtml.
  function _iosCustomHtml(m) {
    var e = function (s) { return escHtml(String(s == null ? '' : s)); };
    var I = {
      x: '<path d="M18 6 6 18M6 6l12 12"></path>',
      sun: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>',
      moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>',
      smart: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"></path><circle cx="12" cy="12" r="3.4"></circle>',
      mixed: '<path d="M16 3h5v5"></path><path d="M21 3 13 11"></path><path d="M8 21H3v-5"></path><path d="M3 21 11 13"></path><path d="M21 16v5h-5"></path><path d="M15 15l6 6"></path><path d="M3 8V3h5"></path><path d="M9 9 3 3"></path>',
      catchup: '<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v4h4"></path><path d="M12 7v5l3 2"></path>',
      tick: '<path d="M20 6 9 17l-5-5"></path>',
      down: '<path d="M6 9l6 6 6-6"></path>',
      play: '<path d="M6 4l14 8-14 8V4z"></path>'
    };
    var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; };
    var pressed = function (on) { return ' aria-pressed="' + (on ? 'true' : 'false') + '"'; };
    var tick = '<span class="ic-tick">' + svg('tick') + '</span>';
    var h = '';

    h += '<div class="ic-sheet-grip" aria-hidden="true"></div>';
    h += '<div class="ic-topbar">'
      + '<button class="ic-tb-close" type="button" data-act="close" aria-label="Close">' + svg('x') + '</button>'
      + '<span class="ic-tb-title"><h1>Custom quiz</h1><span>Topic, difficulty and count</span></span>'
      + '<button class="ic-app-theme" type="button" data-act="theme" aria-label="Switch theme">'
      + '<span class="ic-i-sun">' + svg('sun') + '</span><span class="ic-i-moon">' + svg('moon') + '</span></button>'
      + '</div>';

    h += '<div class="ic-body">';
    h += '<div class="ic-cert-strip ic-reveal"><span class="ic-cm">' + e(m.cert.mark) + '</span>'
      + '<span class="ic-cn"><b>' + e(m.cert.name) + '</b><span>' + e(m.cert.code) + '</span></span></div>';

    // Topic: one chip per domain
    h += '<div class="ic-sect ic-reveal">Topic</div>'
      + '<p class="ic-sect-sub ic-reveal">Pick a domain, or open one below to choose exact topics.</p>'
      + '<div class="ic-chiprow ic-reveal" role="group" aria-label="Pick a domain">';
    m.domains.forEach(function (d) {
      var mm = /^(\d+\.\d+)\s+(.*)$/.exec(String(d.name || ''));
      h += '<button class="ic-chip" type="button" data-act="domain" data-idx="' + e(d.idx) + '"' + pressed(d.allOn) + '>'
        + (mm ? '<span class="ic-dn">' + e(mm[1]) + '</span> ' + e(mm[2]) : e(d.name)) + '</button>';
    });
    h += '</div>';

    // Modes: bento 2 + 1 (Catch-up wide)
    var byKind = {};
    m.modes.forEach(function (x) { byKind[x.kind] = x; });
    var mode = function (x) {
      if (!x) return '';
      if (x.kind === 'catchup') {
        var live = '';
        if (m.catchup.show) {
          live = '<span class="ic-mw-live ic-live">' + (m.catchup.n ? '<b>' + e(m.catchup.n) + '</b> ' : '') + e(m.catchup.text) + '</span>';
        }
        return '<button class="ic-mode ic-mode-wide" type="button" data-act="mode" data-v="' + e(x.v) + '"' + pressed(x.on) + '>'
          + '<span class="ic-mi">' + svg('catchup') + '</span>'
          + '<span class="ic-mw-txt"><b>' + e(x.title) + ' ' + tick + '</b><span>' + e(x.sub) + '</span></span>' + live + '</button>';
      }
      return '<button class="ic-mode" type="button" data-act="mode" data-v="' + e(x.v) + '"' + pressed(x.on) + '>'
        + '<span class="ic-mi">' + svg(x.kind === 'smart' ? 'smart' : 'mixed') + '</span>'
        + '<b>' + e(x.title) + ' ' + tick + '</b><span>' + e(x.sub) + '</span></button>';
    };
    h += '<div class="ic-sect ic-reveal">How to choose questions</div>'
      + '<div class="ic-modes ic-reveal" role="group" aria-label="Question mode">'
      + mode(byKind.smart) + mode(byKind.mixed) + mode(byKind.catchup) + '</div>';

    // Build it by topic: one accordion per domain
    h += '<div class="ic-sect ic-reveal">Or build it by topic</div>'
      + '<p class="ic-sect-sub ic-reveal">Open a domain to pick the exact areas you want.</p>';
    m.domains.forEach(function (d) {
      h += '<div class="ic-dom ic-reveal" aria-expanded="' + (d.expanded ? 'true' : 'false') + '" data-idx="' + e(d.idx) + '">'
        + '<button class="ic-dom-head" type="button" data-act="acc" data-idx="' + e(d.idx) + '" aria-expanded="' + (d.expanded ? 'true' : 'false') + '">'
        + '<span class="ic-dh-txt"><b>' + e(d.name) + '</b><small>' + e(d.topicCount) + ' topics'
        + (d.pickedLabel ? ' · <span class="ic-picked">' + e(d.pickedLabel) + '</span>' : '') + '</small></span>'
        + (d.weight ? '<span class="ic-pill">' + e(d.weight) + '</span>' : '')
        + '<span class="ic-caret">' + svg('down') + '</span></button>'
        + '<div class="ic-dom-panel"><div><div class="ic-dom-inner">';
      d.topics.forEach(function (t) {
        h += '<button class="ic-tchip" type="button" data-act="topic" data-v="' + e(t.v) + '"' + pressed(t.on) + '>' + e(t.label) + '</button>';
      });
      h += '</div></div></div></div>';
    });

    // Difficulty + count
    h += '<div class="ic-sect ic-reveal">Difficulty</div><div class="ic-seg ic-diff-seg ic-reveal" role="group" aria-label="Difficulty">';
    m.diffs.forEach(function (x) {
      h += '<button type="button" data-act="diff" data-v="' + e(x.v) + '"' + pressed(x.on) + '>' + e(x.label) + '</button>';
    });
    h += '</div>';
    h += '<div class="ic-sect ic-reveal">Count</div>'
      + '<div class="ic-count-echo ic-reveal"><span class="ic-bn">' + e(m.count) + '</span><span class="ic-bl">questions</span></div>'
      + '<div class="ic-seg ic-count-seg ic-reveal" role="group" aria-label="Question count">';
    m.counts.forEach(function (x) {
      h += '<button' + (x.overcap ? ' class="ic-overcap"' : '') + ' type="button" data-act="count" data-v="' + e(x.v) + '"' + pressed(x.on) + '>' + e(x.v) + '</button>';
    });
    h += '</div>';
    if (m.capNote) h += '<p class="ic-cap-note ic-reveal">Free covers <b>15 questions a day</b>. 20 needs Pro.</p>';
    if (m.err) h += '<div class="ic-err" role="alert">' + e(m.err)
      + (m.signIn ? '<button class="ic-err-signin" type="button" data-act="signin">Sign in</button>' : '') + '</div>';
    h += '</div>';

    h += '<div class="ic-foot"><button class="ic-btn-primary" type="button" data-act="start">' + svg('play')
      + ' Start quiz <span class="ic-qc">' + e(m.count) + ' Q</span></button>'
      + '<p class="ic-foot-note">' + e(m.foot) + '</p></div>';
    return h;
  }

  // ── DOM: scrape the hidden panel, render, bind ──
  function _icPhone() { return !!(window.matchMedia && matchMedia('(max-width: 899px)').matches); }
  function _icText(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  // The cert strip's identity (mark, short name, exam code). Shared with the Sim Lab start screen (B3b1).
  function iosCertIdentity() {
    var certId = (typeof CURRENT_CERT === 'string' && CURRENT_CERT) || 'netplus';
    var MARKS = { netplus: 'N+', secplus: 'S+', 'aplus-core1': 'A+', 'aplus-core2': 'A+', az900: 'AZ', ai900: 'AI', sc900: 'SC', clfc02: 'CLF' };
    var rawName = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) || 'CompTIA Network+';
    return { mark: MARKS[certId] || 'CA', name: String(rawName).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''),
      code: (typeof CERT_CODE === 'string' && CERT_CODE) || 'N10-009' };
  }
  function _iosCustomSource() {
    var MIXED = (typeof MIXED_TOPIC === 'string') ? MIXED_TOPIC : 'Mixed — All Topics';
    var CATCH = (typeof CATCHUP_TOPIC === 'string') ? CATCHUP_TOPIC : 'Mixed — Catch-up';
    var modes = [].slice.call(document.querySelectorAll('#topic-group .cq-mode-card')).map(function (c) {
      var v = c.dataset.v || '';
      return { kind: v === MIXED ? 'mixed' : v === CATCH ? 'catchup' : (/smart/i.test(v) ? 'smart' : 'mixed'), v: v, on: c.classList.contains('on') };
    });
    var domains = [].slice.call(document.querySelectorAll('#topic-group details.topic-domain-group[data-domain-idx]')).map(function (d) {
      var idx = d.getAttribute('data-domain-idx');
      var pill = document.querySelector('.tdp-pill[data-domain-idx="' + idx + '"]');
      return {
        idx: idx, name: _icText(d.querySelector('.dom-name')), weight: _icText(d.querySelector('.dom-weight')),
        short: _icText(pill).replace(/^\d+(\.\d+)?\s*/, ''),
        topics: [].slice.call(d.querySelectorAll('.chip[data-v]')).map(function (c) {
          return { v: c.dataset.v, label: _icText(c), on: c.classList.contains('on') };
        })
      };
    });
    var pick = function (sel) {
      return [].slice.call(document.querySelectorAll(sel)).map(function (c) { return { v: c.dataset.v, on: c.classList.contains('on') }; });
    };
    var history = [];
    try { history = (typeof loadHistory === 'function' ? loadHistory() : []) || []; } catch (_) { history = []; }
    var errBox = document.getElementById('setup-err');
    return {
      cert: iosCertIdentity(),
      domains: domains, modes: modes, diffs: pick('#diff-group .chip[data-v]'), counts: pick('#count-group .chip[data-v]'),
      history: history.map(function (r) { return { topic: r && r.topic, date: r && r.date }; }),
      err: (errBox && !errBox.classList.contains('is-hidden')) ? _icText(errBox) : '',
      freeTier: !!(typeof window._srIsFreeTier === 'function' && window._srIsFreeTier()),
      signIn: window._certanvilSignedIn !== true && !!document.querySelector('a.topbar-signin-pill'),
      loneTopic: _icLoneTopic(MIXED, CATCH)
    };
  }

  // The topic app.js will quiz on when no chip or mode is on (drillTopic sets `topic` directly).
  function _icLoneTopic(MIXED, CATCH) {
    var t = '';
    try { t = (typeof topic === 'string') ? topic : ''; } catch (_) { t = ''; }
    if (!t || document.querySelector('#topic-group .chip.on')) return '';
    if (t === MIXED || t === CATCH || /^Multi:/.test(t) || /smart/i.test(t)) return '';
    return t;
  }

  var _icOpen = {};   // accordions the user opened or closed this visit, by domain idx

  function renderIosCustom(fresh) {
    var root = document.getElementById('ios-custom');
    if (!root) return false;
    if (!_icPhone()) { closeIosCustom(); return false; }
    try {
      var m = _iosCustomModel(_iosCustomSource(), new Date());
      m.domains.forEach(function (d) { if (typeof _icOpen[d.idx] === 'boolean') d.expanded = _icOpen[d.idx]; });
      var act = document.activeElement, key = null;
      if (act && root.contains(act) && act.getAttribute('data-act')) {
        key = [act.getAttribute('data-act'), act.getAttribute('data-v'), act.getAttribute('data-idx')];
      }
      root.classList.toggle('ic-settled', !fresh);
      root.innerHTML = _iosCustomHtml(m);
      document.documentElement.classList.add('ic-open');   // WebKit misses :has(#ios-custom:not(:empty)) here
      if (key) {   // keep keyboard / VoiceOver focus on the control just used (review I3)
        var back = [].slice.call(root.querySelectorAll('[data-act]')).filter(function (b) {
          return b.getAttribute('data-act') === key[0] && b.getAttribute('data-v') === key[1] && b.getAttribute('data-idx') === key[2];
        })[0];
        if (back) { try { back.focus({ preventScroll: true }); } catch (_) { back.focus(); } }
      }
      document.documentElement.classList.remove('ic-failed');
      return true;
    } catch (err) {
      root.innerHTML = '';
      document.documentElement.classList.remove('ic-open');
      try { console.warn('[ios-custom] render failed', err); } catch (_) {}
      return false;
    }
  }

  // Keep each accordion as the user last saw it across a re-render (minor 1).
  function _icSnapOpen(root) {
    [].forEach.call(root.querySelectorAll('.ic-dom[data-idx]'), function (d) {
      _icOpen[d.getAttribute('data-idx')] = d.getAttribute('aria-expanded') === 'true';
    });
  }

  function closeIosCustom() {
    var root = document.getElementById('ios-custom');
    if (root) { root.innerHTML = ''; root.classList.remove('ic-settled'); }
    document.documentElement.classList.remove('ic-open');
  }

  function _icClickHidden(sel, v) {
    var hit = [].slice.call(document.querySelectorAll(sel)).filter(function (c) { return c.dataset.v === v || c.getAttribute('data-domain-idx') === v; })[0];
    if (hit) hit.click();
  }

  function _icOnTap(ev) {
    var b = ev.target.closest && ev.target.closest('[data-act]');
    var root = document.getElementById('ios-custom');
    if (!b || !root || !root.contains(b)) return;
    var act = b.getAttribute('data-act'), v = b.getAttribute('data-v'), idx = b.getAttribute('data-idx');
    if (act === 'close') { closeIosCustom(); window.scrollTo(0, 0); return; }
    // Start: leaving Setup closes the screen (observer); a start that fails validation keeps it, with the error (review I1)
    if (act === 'start') { if (typeof window.startQuiz === 'function') window.startQuiz(); return; }
    if (act === 'signin') { if (window.iosSignIn && window.iosSignIn.go) { window.iosSignIn.go('custom'); return; } var a = document.querySelector('a.topbar-signin-pill'); if (a && a.href) location.href = a.href; return; }
    if (act === 'acc') {
      var dom = b.closest('.ic-dom');
      var open = dom.getAttribute('aria-expanded') !== 'true';
      dom.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      _icOpen[idx] = open;
      return;
    }
    _icSnapOpen(root);
    if (act === 'theme') { if (typeof toggleTheme === 'function') toggleTheme(); }
    else if (act === 'mode') _icClickHidden('#topic-group .cq-mode-card', v);
    else if (act === 'topic') _icClickHidden('#topic-group .chip:not(.cq-mode-card)', v);
    else if (act === 'domain') { _icOpen[idx] = true; _icClickHidden('.tdp-pill', idx); }
    else if (act === 'diff') _icClickHidden('#diff-group .chip', v);
    else if (act === 'count') _icClickHidden('#count-group .chip', v);
    renderIosCustom(false);
    if (act === 'count') { var bn = root.querySelector('.ic-bn'); if (bn) bn.classList.add('ic-bump'); }
  }

  // Every route into the custom quiz sets #custom-quiz-section.open (Home, presets, drill-a-topic,
  // showSetupError). On a phone, close the desktop modal at once (its own toggle handler then
  // restores scroll and its place) and show the phone screen instead.
  function _icOnToggle() {
    var cq = document.getElementById('custom-quiz-section');
    var root = document.getElementById('ios-custom');
    if (!cq || !cq.open || !root || !_icPhone()) return;
    var fresh = !root.innerHTML;
    if (fresh) _icOpen = {}; else _icSnapOpen(root);
    if (!renderIosCustom(fresh)) {
      // the phone screen could not draw: leave the desktop picker open and visible (minor 2)
      document.documentElement.classList.add('ic-failed');
      return;
    }
    cq.open = false;
    // a key error raised on another page (no page switch under way): bring the user to Setup, where the
    // screen and its error now live, instead of leaving it hidden until they next come Home (minor 3)
    var setup = document.getElementById('page-setup');
    if (setup && !setup.classList.contains('active') && !document.querySelector('.page.page-exit') && typeof goSetup === 'function') goSetup();
    var target = root.querySelector('.ic-err') || (fresh && root.querySelector('.ic-dom[aria-expanded="true"]'));
    if (target) _icScrollWhenSettled(target);
    else if (fresh) window.scrollTo(0, 0);
  }

  // Setup may still be mid page-switch (drill-a-topic opens it from Progress); its activation scrolls to
  // the top, so wait for .active and two frames before bringing the target into view (review M2).
  function _icScrollWhenSettled(el) {
    var setup = document.getElementById('page-setup'), t0 = Date.now();
    (function wait() {
      if (!el.isConnected) return;
      if (setup && !setup.classList.contains('active') && Date.now() - t0 < 1500) { setTimeout(wait, 50); return; }
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        if (el.isConnected && el.scrollIntoView) el.scrollIntoView({ block: 'center' });
      }); });
    })();
  }

  function _iosCustomBoot() {
    var cq = document.getElementById('custom-quiz-section');
    var root = document.getElementById('ios-custom');
    var setup = document.getElementById('page-setup');
    if (!cq || !root || root._icWired) return;
    root._icWired = true;
    cq.addEventListener('toggle', _icOnToggle);
    root.addEventListener('click', _icOnTap);
    if (setup && window.MutationObserver) {
      new MutationObserver(function () { if (!setup.classList.contains('active')) closeIosCustom(); })
        .observe(setup, { attributes: true, attributeFilter: ['class'] });
    }
    if (window.matchMedia) {
      var mq = matchMedia('(max-width: 899px)');
      var onMq = function () {
        if (!mq.matches) { closeIosCustom(); return; }
        if (cq.open) _icOnToggle();   // desktop modal open while the window narrows: hand over (review I2)
      };
      if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _iosCustomBoot);
  else _iosCustomBoot();

  window._iosCustomModel = _iosCustomModel;
  window._iosCustomHtml = _iosCustomHtml;
  window._iosCustomSource = _iosCustomSource;
  window.iosCertIdentity = iosCertIdentity;
  window.renderIosCustom = renderIosCustom;
  window.closeIosCustom = closeIosCustom;
})();
