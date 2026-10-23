// Lift B3c1 (v8.190.0): the Reword Gauntlet on phones, in the June E2E language (mockups/cert-ios-gauntlet.html).
// Pure model/view pairs for the entry and the results, plus the phone hosts that features/flagship-drills.js
// calls from renderGauntletEntry / renderGauntletResult. Desktop keeps today's markup.
(function () {
  var MQ = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  function isPhone() { return !!(MQ && MQ.matches); }

  // ── Entry ── s = {topic, why, back: 'drills'|'setup', cracked, free, topics[]}
  function _iosGtEntryModel(s) {
    return {
      topic: s.topic, why: s.why, cracked: Number(s.cracked) || 0, free: !!s.free,
      topics: (s.topics || []).map(function (t) { return { name: t, on: t === s.topic }; }),
      backLabel: s.back === 'drills' ? 'Back to Drills' : 'Back to Home'
    };
  }
  function _iosGtEntryHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    var RUNGS = ['Plain', 'Scenario', 'Best-of', 'Not-trap', 'Twisted'];
    return '<div class="igt-hdr"><button type="button" class="igt-back" data-act="back" aria-label="' + e(m.backLabel) + '">' + svg('<path d="M15 6l-6 6 6 6"></path>', 16) + '</button><h1>Reword Gauntlet</h1></div>'
      + '<div class="igt-body"><div class="igt-hero"><div class="igt-mark">' + svg('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9"></path><path d="M20 4v5h-5"></path><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15"></path><path d="M4 20v-5h5"></path>', 26) + '</div>'
      + '<h2>Beat the concept in <em>every</em> disguise</h2><p>Five questions on one concept. The wording never repeats.</p></div>'
      + '<div class="igt-target"><div class="igt-k">Today’s target</div><div class="igt-v">' + e(m.topic) + '</div><div class="igt-why">' + e(m.why) + '</div>'
      + '<button type="button" class="igt-switch" data-act="pick">' + svg('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"></path>', 14) + 'Pick a different topic</button></div>'
      + (m.cracked > 0 ? '<div class="igt-cracked"><b>' + m.cracked + '</b><span>concepts cracked so far.<br>Each one survived all five wordings.</span></div>' : '')
      + '<div class="igt-sect">The five wordings</div><div class="igt-rungs">' + RUNGS.map(function (r) { return '<div class="igt-rg"><i></i><span>' + r + '</span></div>'; }).join('') + '</div>'
      + (m.free ? '<p class="igt-cap">Free covers <b>one Gauntlet a day</b>, on top of your 15 questions.</p>' : '') + '</div>'
      + '<div class="igt-dock"><button type="button" class="igt-start" data-act="start">' + svg('<path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"></path>', 14) + 'Start the Gauntlet</button></div>';
  }

  // ── Results ── s = {cracked, concept, topic, attempts, collection, back, free, used,
  //                   rungs: [{key, sub, ok, question, hinge, yours, answer, explanation}]}
  function _iosGtResultModel(s) {
    var rungs = s.rungs || [];
    var missed = rungs.filter(function (r) { return !r.ok; }).map(function (r) { return '<b>' + r.key + '</b>'; });
    var crackN = rungs.length - missed.length;
    var m = { cracked: !!s.cracked, kick: 'Reword Gauntlet · ' + s.topic, concept: s.concept, rows: rungs, topic: s.topic,
      freeNote: (s.free && s.used) ? 'That was today’s free run. The next one is free tomorrow, or Pro runs it again now.' : null };
    if (m.cracked) {
      m.sub = (s.attempts > 1) ? 'Took ' + s.attempts + ' runs. <b>Earned.</b>' : 'Five wordings, five answers. <b>That’s ' + s.collection + ' in your collection.</b>';
      m.primary = { label: 'Next target', act: 'next' };
      m.secondary = { label: s.back === 'drills' ? 'Back to Drills' : 'Back to Home', act: 'exit' };
    } else {
      m.title = 'Cracked <em>' + crackN + ' of ' + rungs.length + '</em>';
      m.callout = missed.length === 1 ? 'The ' + missed[0] + ' got you. One rung from the seal.'
        : missed.length === 2 ? 'The ' + missed[0] + ' and the ' + missed[1] + ' got you.'
          : missed.length + ' rungs got you this time.';
      m.primary = { label: 'Run it again', act: 'again' };
      m.secondary = { label: 'Different concept', act: 'different' };
    }
    return m;
  }
  function _iosGtResultHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    function hinge(q, h) {   // escape-then-highlight: mark only where the escaped hinge is found
      var eq = e(q), eh = e(h);
      return eh && eq.indexOf(eh) >= 0 ? eq.replace(eh, '<mark class="igt-hg">' + eh + '</mark>') : eq;
    }
    var GNT = svg('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9"></path><path d="M20 4v5h-5"></path><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15"></path><path d="M4 20v-5h5"></path>', 14);
    var h = '<div class="igt-vbody"><div class="igt-vkick">' + GNT + e(m.kick) + '</div>';
    if (m.cracked) {
      h += '<div class="igt-seal-wrap"><div class="igt-seal">' + svg('<path d="M20 6L9 17l-5-5"></path>', 40) + '</div><div class="igt-seal-k">Concept cracked</div>'
        + '<h2 class="igt-concept">' + e(m.concept) + '</h2><div class="igt-seal-bars"><i></i><i></i><i></i><i></i><i></i></div>'
        + '<p class="igt-seal-sub">' + m.sub + '</p><span class="igt-streak">' + svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>', 14) + 'Streak +1 · 5 questions toward today’s goal</span></div>';
    } else {
      h += '<h2 class="igt-vtitle">' + m.title + '</h2><p class="igt-callout">' + m.callout + '</p><div class="igt-sect">Your five wordings</div>';
      m.rows.forEach(function (r, i) {
        h += '<button type="button" class="igt-srow" aria-expanded="false" aria-controls="igt-sdet-' + i + '"><span class="igt-sn"><span class="igt-st">' + e(r.key) + '</span><span class="igt-ss">' + e(r.sub) + '</span></span>'
          + '<span class="igt-sv ' + (r.ok ? 'ok">Right' : 'no">Wrong') + '</span>' + svg('<path d="M9 6l6 6-6 6"></path>', 16) + '</button>'
          + '<div class="igt-sdet" id="igt-sdet-' + i + '" hidden><p class="igt-q">' + hinge(r.question, r.hinge) + '</p>'
          + '<div class="igt-lab igt-y' + (r.ok ? ' ok' : '') + '">Your answer</div><div class="igt-val">' + e(r.yours) + '</div>'
          + (r.ok ? '' : '<div class="igt-lab igt-a">Answer</div><div class="igt-val">' + e(r.answer) + '</div>')
          + '<p class="igt-why">' + e(r.explanation) + '</p></div>';
      });
      h += '<p class="igt-promise">Run it again and every question is re-worded from scratch. There’s nothing to memorize. That’s the point.</p>';
    }
    h += '</div><div class="igt-vdock"><button type="button" class="igt-primary" data-act="' + m.primary.act + '">' + m.primary.label + '</button>'
      + '<button type="button" class="igt-ghost" data-act="' + m.secondary.act + '">' + e(m.secondary.label) + '</button>'
      + (m.freeNote ? '<p class="igt-free">' + m.freeNote + '</p>' : '') + '</div>';
    return h;
  }

  // ── Phone hosts ──
  function _call(name, arg) { if (typeof window[name] === 'function') window[name](arg); }
  // Renders the phone entry into #igt-entry and wires it (one delegated listener). False on desktop.
  function renderEntry(s) {
    var host = document.getElementById('igt-entry');
    if (!host) return false;
    if (!isPhone()) { host.innerHTML = ''; return false; }
    host.innerHTML = _iosGtEntryHtml(_iosGtEntryModel(s));
    host.__igtTopics = s.topics || []; host.__igtTopic = s.topic;
    if (!host.__igtBound) {
      host.__igtBound = true;
      host.addEventListener('click', function (ev) {
        var b = ev.target.closest && ev.target.closest('[data-act]');
        if (!b || !host.contains(b)) return;
        var act = b.getAttribute('data-act');
        if (act === 'back') _call('gauntletBack');
        else if (act === 'start') _call('gauntletStart');
        else if (act === 'pick') pickTopic(host.__igtTopics, host.__igtTopic).then(function (t) { if (t) _call('gauntletChooseTopic', t); });
      });
    }
    return true;
  }
  // The topic list in the in-app sheet's look (#igt-topics). Resolves the tapped topic, or null.
  var _tp = null;   // { done(val) } while open
  function closeTopics() { if (_tp) _tp.done(null); }
  function pickTopic(topics, current) {
    var sheet = document.getElementById('igt-topics'), scrim = document.getElementById('igt-topics-scrim');
    if (!sheet || !scrim) return Promise.resolve(null);
    if (_tp) _tp.done(null);
    var list = sheet.querySelector('.igt-tlist'), back = document.activeElement;
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';
    list.innerHTML = (topics || []).map(function (t, i) {
      return '<button type="button" role="listitem" data-i="' + i + '" aria-pressed="' + (t === current) + '"><span>' + e(t) + '</span>' + TICK + '</button>';
    }).join('');
    return new Promise(function (resolve) {
      var t1 = null;
      var st = {
        done: function (val) {
          if (_tp !== st) return;
          _tp = null; clearTimeout(t1);
          window.removeEventListener('keydown', onKey, true);
          list.removeEventListener('click', onTap); scrim.removeEventListener('click', onScrim);
          sheet.classList.remove('open'); scrim.classList.remove('open');
          setTimeout(function () { if (!sheet.classList.contains('open')) { sheet.hidden = true; scrim.hidden = true; } }, 200);   // BRAND §6: sheet out 200ms
          if (back && back.isConnected && back.focus) { try { back.focus({ preventScroll: true }); } catch (_) {} }
          resolve(val);
        }
      };
      function onKey(ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); st.done(null); } }
      function onScrim() { st.done(null); }
      function onTap(ev) {
        var b = ev.target.closest && ev.target.closest('button[data-i]'); if (!b || t1) return;
        [].forEach.call(list.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var t = topics[Number(b.getAttribute('data-i'))];
        t1 = setTimeout(function () { st.done(t); }, 140);   // the tick lands before the sheet goes
      }
      _tp = st;
      window.addEventListener('keydown', onKey, true);
      list.addEventListener('click', onTap); scrim.addEventListener('click', onScrim);
      sheet.hidden = false; scrim.hidden = false;
      void sheet.offsetWidth;
      sheet.classList.add('open'); scrim.classList.add('open');
      var on = list.querySelector('[aria-pressed="true"]') || list.firstChild;
      if (on && on.focus) { try { on.focus({ preventScroll: true }); } catch (_) {} }
    });
  }

  window.iosGauntlet = window.iosGauntlet || {};
  window.iosGauntlet.isPhone = isPhone;
  window.iosGauntlet.renderEntry = renderEntry;
  window.iosGauntlet.pickTopic = pickTopic;
  window.iosGauntlet.closeTopics = closeTopics;
  window._iosGtEntryModel = _iosGtEntryModel;
  window._iosGtEntryHtml = _iosGtEntryHtml;
  window._iosGtResultModel = _iosGtResultModel;
  window._iosGtResultHtml = _iosGtResultHtml;
})();
