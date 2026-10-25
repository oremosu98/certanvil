// Lift B3c2 (v8.191.0): Why-Not on phones, in the June E2E language (mockups/cert-ios-whynot.html).
// Pure model/view pairs for the entry, the reason step and both verdicts, plus the phone hosts that
// features/flagship-drills.js calls from its Why-Not renderers. Desktop keeps today's markup.
(function () {
  var MQ = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  function isPhone() { return !!(MQ && MQ.matches); }

  // ── Entry ── s = {topic, why, back: 'drills'|'setup', free}
  function _iosWnEntryModel(s) {
    return { topic: s.topic, why: s.why, free: !!s.free, backLabel: s.back === 'drills' ? 'Back to Drills' : 'Back to Home' };
  }
  function _iosWnEntryHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    return '<div class="iwn-hdr"><button type="button" class="iwn-back" data-act="back" aria-label="' + e(m.backLabel) + '">' + svg('<path d="M15 6l-6 6 6 6"></path>', 16) + '</button><h1>Why-Not</h1>'
      + (m.free ? '<span class="iwn-pro">' + svg('<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>', 10) + 'Pro</span>' : '') + '</div>'
      + '<div class="iwn-body"><div class="iwn-hero"><div class="iwn-mark">' + svg('<path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"></path><path d="M9.5 9a2.5 2.5 0 0 1 4.86.83c0 1.67-2.5 2.5-2.5 2.5"></path><path d="M12 17h.01"></path>', 26) + '</div>'
      + '<h2>Prove the wrong answers <em>wrong</em></h2><p>The right answer is one point. Why the others lose is the other three.</p></div>'
      + '<div class="iwn-target"><div class="iwn-k">Today’s target</div><div class="iwn-v">' + e(m.topic) + '</div><div class="iwn-why">' + e(m.why) + '</div>'
      + '<button type="button" class="iwn-switch" data-act="pick">' + svg('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"></path>', 14) + 'Pick a different topic</button></div>'
      + '<div class="iwn-sect">Three rounds</div><div class="iwn-rounds">' + [1, 2, 3].map(function (n) { return '<div class="iwn-rd"><i></i><span>Round ' + n + '</span></div>'; }).join('') + '</div></div>'
      + '<div class="iwn-dock"><button type="button" class="iwn-start" data-act="start">' + svg('<path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"></path>', 14) + 'Start Why-Not</button></div>';
  }

  // ── Reason step ── s = {topic, round, answerRight, answerText, letter, optionText, wrong: [3 letters],
  //                      reasons: [{t, real}] (display order), picked: index|null, note, segs: [4], nextLetter: letter|null}
  function _iosWnReasonModel(s) {
    var done = s.picked != null, good = done && !!(s.reasons[s.picked] && s.reasons[s.picked].real);
    return {
      topic: s.topic, round: s.round, answerRight: !!s.answerRight, answerText: s.answerText, letter: s.letter, optionText: s.optionText,
      labels: ['Answer'].concat(s.wrong || []), segs: s.segs || [], done: done,
      reasons: (s.reasons || []).map(function (r, i) { return { t: r.t, cls: !done ? '' : r.real ? ' right' : i === s.picked ? ' wrong' : ' dim' }; }),
      note: done ? { good: good, label: good ? 'Right reason' : 'Wrong reason', text: s.note } : null,
      next: { label: s.nextLetter ? 'Next: why does ' + s.nextLetter + ' lose?' : 'See the round verdict', ready: done }
    };
  }
  function _iosWnReasonHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    var CHECK = '<path d="M20 6L9 17l-5-5"></path>', X = '<path d="M6 6l12 12M18 6L6 18"></path>';
    return '<div class="iwn-wbar"><button type="button" class="iwn-back" data-act="back" aria-label="Leave Why-Not">' + svg('<path d="M15 6l-6 6 6 6"></path>', 16) + '</button>'
      + '<span class="iwn-strip">Why-Not · <b>' + e(m.topic) + '</b> · Round ' + m.round + ' of 3</span></div>'
      + '<div class="iwn-body"><div class="iwn-ans"><span class="iwn-tk' + (m.answerRight ? '' : ' no') + '">' + svg(m.answerRight ? CHECK : X, 13) + '</span><span>'
      + (m.answerRight ? 'You answered <b>' + e(m.answerText) + '</b>. Right. Now earn the other three points.' : 'The answer was <b>' + e(m.answerText) + '</b>. The reasons below still score.') + '</span></div>'
      + '<div class="iwn-card"><div class="iwn-wtarget"><span class="iwn-lt">' + e(m.letter) + '</span><b>' + e(m.optionText) + '</b></div><p class="iwn-ask">Why does it lose?</p>'
      + m.reasons.map(function (r, i) {
        return '<button type="button" class="iwn-reason' + r.cls + '" data-act="reason" data-i="' + i + '"' + (m.done ? ' disabled' : '') + '><span class="iwn-rdot">' + svg(r.cls === ' wrong' ? X : CHECK, 11) + '</span><span>' + e(r.t) + '</span></button>';
      }).join('')
      + (m.note ? '<div class="iwn-note ' + (m.note.good ? 'good' : 'bad') + '" role="status"><b>' + m.note.label + '</b>' + e(m.note.text) + '</div>' : '') + '</div>'
      + '<div class="iwn-pts"><div class="iwn-bars">' + m.segs.map(function (c) { return '<i class="' + e(c) + '"></i>'; }).join('') + '</div>'
      + '<div class="iwn-labs">' + m.labels.map(function (l) { return '<span>' + e(l) + '</span>'; }).join('') + '</div></div></div>'
      + '<div class="iwn-dock iwn-stack"><button type="button" class="iwn-next' + (m.next.ready ? '' : ' wait') + '" data-act="next"' + (m.next.ready ? '' : ' aria-hidden="true" tabindex="-1"') + '>' + e(m.next.label) + '</button>'
      + '<button type="button" class="iwn-leave" data-act="leave">Leave session</button></div>';
  }

  // ── Round verdict ── s = {topic, round, last, points, callout (html, option names already escaped),
  //                        answer: {text, right, firstPick, explanation}, wrong: [{letter, text, right, picked, reason, note}]}
  function _iosWnVerdictModel(s) {
    var a = s.answer || {};
    return {
      topic: s.topic, round: s.round, title: 'You earned <em>' + s.points + ' of 4</em>', callout: s.callout,
      rows: [{ title: 'The answer: ' + a.text, sub: a.right ? 'Picked first time' : 'Missed on the first pick', right: !!a.right, kind: 'answer', firstPick: a.firstPick, explanation: a.explanation }]
        .concat((s.wrong || []).map(function (w) { return { title: w.text, sub: 'Option ' + w.letter, right: !!w.right, kind: 'option', picked: w.picked, reason: w.reason, note: w.note }; })),
      primary: s.last ? { label: 'Session verdict', act: 'session' } : { label: 'Next round', act: 'next-round' }
    };
  }
  function _iosWnVerdictHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function svg(p, n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="' + n + '" height="' + n + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    var h = '<div class="iwn-wbar"><button type="button" class="iwn-back" data-act="back" aria-label="Leave Why-Not">' + svg('<path d="M15 6l-6 6 6 6"></path>', 16) + '</button>'
      + '<span class="iwn-strip">Why-Not · <b>' + e(m.topic) + '</b> · Round ' + m.round + ' of 3</span></div>'
      + '<div class="iwn-vbody"><h2 class="iwn-vtitle">' + m.title + '</h2><p class="iwn-callout">' + m.callout + '</p><div class="iwn-sect">Your four points</div>';
    m.rows.forEach(function (r, i) {
      h += '<button type="button" class="iwn-srow" aria-expanded="false" aria-controls="iwn-sdet-' + i + '"><span class="iwn-sn"><span class="iwn-st">' + e(r.title) + '</span><span class="iwn-ss">' + e(r.sub) + '</span></span>'
        + '<span class="iwn-sv ' + (r.right ? 'ok">Right' : 'no">Wrong') + '</span>' + svg('<path d="M9 6l6 6-6 6"></path>', 16) + '</button>'
        + '<div class="iwn-sdet" id="iwn-sdet-' + i + '" hidden>'
        + (r.kind === 'answer'
          ? '<div class="iwn-lab' + (r.right ? ' ok' : ' no') + '">Your first pick</div><div class="iwn-val">' + e(r.firstPick) + '</div><p class="iwn-why">' + e(r.explanation) + '</p>'
          : (r.right ? '' : '<div class="iwn-lab no">Your reason</div><div class="iwn-val">' + e(r.picked) + '</div>')
            + '<div class="iwn-lab ok">True reason</div><div class="iwn-val">' + e(r.reason) + '</div><p class="iwn-why">' + e(r.note) + '</p>')
        + '</div>';
    });
    return h + '</div><div class="iwn-dock iwn-stack"><button type="button" class="iwn-primary" data-act="' + m.primary.act + '">' + m.primary.label + '</button>'
      + '<button type="button" class="iwn-leave" data-act="leave">Leave session</button></div>';
  }

  // ── Session verdict ── s = {topic, points, rounds: [{points}], back}
  function _iosWnSessionModel(s) {
    return { kick: 'Why-Not · ' + s.topic, title: 'Session: <em>' + s.points + ' of 12</em>', meter: Number(s.points) || 0,
      rows: (s.rounds || []).map(function (r, i) { return { title: 'Round ' + (i + 1), points: r.points }; }),
      backLabel: s.back === 'drills' ? 'Back to Drills' : 'Back to Home' };
  }
  function _iosWnSessionHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var meter = '';
    for (var i = 0; i < 12; i++) meter += i < m.meter ? '<i class="on"></i>' : '<i></i>';
    return '<div class="iwn-vbody"><div class="iwn-vkick">' + e(m.kick) + '</div><h2 class="iwn-stitle">' + m.title + '</h2>'
      + '<div class="iwn-meter" aria-hidden="true">' + meter + '</div><p class="iwn-ssub">3 questions answered toward today’s goal.</p>'
      + '<div class="iwn-sect">Your three rounds</div>'
      + m.rows.map(function (r) { return '<div class="iwn-sround"><span class="iwn-st">' + e(r.title) + '</span><span class="iwn-sv ' + (r.points === 4 ? 'ok' : 'nt') + '">' + r.points + ' of 4</span></div>'; }).join('')
      + '</div><div class="iwn-dock iwn-stack"><button type="button" class="iwn-primary" data-act="next-topic">Next target</button>'
      + '<button type="button" class="iwn-leave" data-act="exit">' + e(m.backLabel) + '</button></div>';
  }

  // ── Phone hosts ──
  function _call(name, arg) { if (typeof window[name] === 'function') window[name](arg); }
  function _topics() { return Object.keys((typeof TOPIC_DOMAINS !== 'undefined' && TOPIC_DOMAINS) || {}); }
  // Opens the B3c1 topic sheet; a picked topic goes through today's whyNotChooseTopic.
  function pickTopic(current) {
    if (!window.iosGauntlet || !window.iosGauntlet.pickTopic) return;
    window.iosGauntlet.pickTopic(_topics(), current).then(function (t) { if (t) _call('whyNotChooseTopic', t); });
  }
  // Renders the phone entry into #iwn-entry and wires it (one delegated listener). False on desktop.
  function renderEntry(s) {
    var host = document.getElementById('iwn-entry');
    if (!host) return false;
    if (!isPhone()) { host.innerHTML = ''; return false; }
    host.innerHTML = _iosWnEntryHtml(_iosWnEntryModel(s));
    host.__iwnTopic = s.topic;
    if (!host.__iwnBound) {
      host.__iwnBound = true;
      host.addEventListener('click', function (ev) {
        var b = ev.target.closest && ev.target.closest('[data-act]');
        if (!b || !host.contains(b)) return;
        var act = b.getAttribute('data-act');
        if (act === 'back') _call('whyNotBack');
        else if (act === 'start') _call('whyNotStart');
        else if (act === 'pick') pickTopic(host.__iwnTopic);
      });
    }
    return true;
  }

  window._iosWnEntryModel = _iosWnEntryModel; window._iosWnEntryHtml = _iosWnEntryHtml;
  window._iosWnReasonModel = _iosWnReasonModel; window._iosWnReasonHtml = _iosWnReasonHtml;
  window._iosWnVerdictModel = _iosWnVerdictModel; window._iosWnVerdictHtml = _iosWnVerdictHtml;
  window._iosWnSessionModel = _iosWnSessionModel; window._iosWnSessionHtml = _iosWnSessionHtml;
  window.iosWhyNot = window.iosWhyNot || {};
  window.iosWhyNot.isPhone = isPhone;
  window.iosWhyNot.renderEntry = renderEntry;
  window.iosWhyNot.pickTopic = pickTopic;
})();
