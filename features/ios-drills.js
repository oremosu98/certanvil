/* features/ios-drills.js — Lift B3a (22 Oct 2026): the June E2E Drills tab at phone width.
   Spec: docs/superpowers/specs/2026-10-22-ios-lift-b3a-design.md. E2E: mockups/cert-ios-drills.html @ ab952bb4.
   Pure model (_iosDrillsModel) + escaped view (_iosDrillsHtml) render into #ios-drills; taps route by data-act
   to today's entry functions. Phone only (max-width 899px); desktop never shows #page-drills. */
(function () {
  'use strict';

  // s: { code, pro, tierKnown, gauntletFree, wrongCount, weak:[{topic,pct}], domains:[{key,label,weight,mastery,touched}],
  //      simLab, decisionLab, gauntletUsed, gauntletCap, pbqUsed, pbqCap }
  function _iosDrillsModel(s) {
    var n = s.wrongCount || 0, locked = !!(s.tierKnown && !s.pro);
    var mistakes = n
      ? { pill: n + ' saved', lock: locked,
          note: 'Clear the <b>' + n + ' wrong answer' + (n === 1 ? '' : 's') + '</b> in your bank. They come back re-worded, so you have to know the idea behind each one. Get one right twice in a row and it leaves the bank for good.',
          button: { label: 'Drill the ' + n + ' you missed', disabled: false } }
      : { pill: '0 saved', lock: locked, note: 'Questions you miss land here.', button: { label: 'Nothing to drill yet', disabled: true } };
    var chips = (s.weak || []).slice(0, 3).map(function (w) { return { topic: w.topic, pct: w.pct }; });
    var weak = chips.length
      ? { chips: chips, note: chips.length === 3 ? 'Your three lowest-mastery topics right now. The drill leads with the weakest of them.'
          : chips.length === 2 ? 'Your two lowest-mastery topics right now. The drill leads with the weaker of them.' : 'Your lowest-mastery topic right now.',
          button: 'Drill weakest topics' }
      : { chips: [], note: 'Take a quiz and your weakest topics show up here.', button: null };
    var domains = (s.domains || []).map(function (d) {
      return { key: d.key, label: d.label, weight: d.weight + '% of exam', mastery: d.mastery, full: d.mastery >= 100, untouched: !d.touched };
    });
    function daily(used, cap) { return used >= cap ? { kind: 'done', text: 'Done today' } : { kind: 'free', text: '1 free today' }; }
    var rows = [];
    if (s.simLab) rows.push({ id: 'sim', name: 'Sim Lab', line: 'Hands-on PBQs, like the real exam',
      pill: (s.tierKnown && !s.pro) ? daily(s.pbqUsed, s.pbqCap) : null });
    rows.push({ id: 'gnt', name: 'Reword Gauntlet', line: 'One idea, asked five ways',
      pill: (s.tierKnown && !s.pro && s.gauntletFree) ? daily(s.gauntletUsed, s.gauntletCap) : null });
    rows.push({ id: 'why', name: 'Why-Not', line: 'Say why each wrong answer loses',
      pill: (s.tierKnown && !s.pro) ? { kind: 'pro', text: 'Pro' } : null });
    if (s.decisionLab) rows.push({ id: 'dl', name: 'Decision Lab', line: 'Read the constraint, rule out the lookalikes', pill: null });
    return { code: s.code || '', mistakes: mistakes, weak: weak, domains: domains, rows: rows, foot: 'Drills don’t touch your daily review queue.' };
  }

  function _iosDrillsHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>';
    var CHEV = '<svg class="id-mchev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>';
    var ICON = {
      sim: '<rect x="3" y="4" width="18" height="16" rx="2.5"></rect><path d="M7 9l3 3-3 3M12 15h5"></path>',
      gnt: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9"></path><path d="M20 4v5h-5"></path><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15"></path><path d="M4 20v-5h5"></path>',
      why: '<circle cx="12" cy="12" r="9"></circle><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17v.01"></path>',
      dl: '<path d="M12 21V3"></path><path d="M12 6h6l2 2.5-2 2.5h-6"></path><path d="M12 13H6l-2 2.5L6 18h6"></path>'
    };
    var THEME = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (m.light
      ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>'
      : '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>') + '</svg>';
    function pill(p) {
      if (!p) return '';
      if (p.kind === 'pro') return '<span class="id-lock-pill">' + LOCK + e(p.text) + '</span>';
      return '<span class="id-mpill id-' + p.kind + '">' + e(p.text) + '</span>';
    }
    var h = '<div class="id-hdr"><h1>Drills</h1>' + (m.code ? '<span class="id-plan-tag">' + e(m.code) + '</span>' : '')
      + '<button class="id-app-theme" type="button" data-act="theme" aria-label="Switch theme">' + THEME + '</button></div>';
    h += '<div class="id-body"><p class="id-lede id-reveal">Short, repeat passes on the things you get wrong. Ten questions or fewer, scored like practice.</p>';
    var mk = m.mistakes;
    h += '<div class="id-card id-reveal"><div class="id-card-head"><span class="id-card-title-wrap"><span class="id-card-title">Drill Mistakes</span>'
      + (mk.lock ? '<span class="id-lock-pill">' + LOCK + 'Pro</span>' : '') + '</span><span class="id-count-pill">' + e(mk.pill) + '</span></div>'
      + '<p class="id-card-note">' + mk.note + '</p>'   // the note's only markup is the <b> count the model writes
      + '<button class="id-btn-drill" type="button" data-act="mistakes"' + (mk.button.disabled ? ' disabled' : '') + '>' + e(mk.button.label) + '</button></div>';
    var wk = m.weak;
    h += '<div class="id-card id-reveal"><div class="id-card-head"><span class="id-card-title">Weakest topics</span></div>'
      + (wk.chips.length ? '<div class="id-topic-chips">' + wk.chips.map(function (c) { return '<span class="id-chip">' + e(c.topic) + ' <b>' + e(c.pct) + '%</b></span>'; }).join('') + '</div>' : '')
      + '<p class="id-card-note">' + e(wk.note) + '</p>'
      + (wk.button ? '<button class="id-btn-drill" type="button" data-act="weak">' + e(wk.button) + '</button>' : '') + '</div>';
    if (m.domains.length) {
      h += '<div class="id-sect id-reveal">Drill by domain</div><div class="id-reveal">';
      m.domains.forEach(function (d) {
        h += '<button class="id-domain" type="button" data-act="domain" data-key="' + e(d.key) + '"><span class="id-domain-top"><b>' + e(d.label) + '</b><span class="id-domain-wt">' + e(d.weight) + '</span></span>'
          + '<span class="id-domain-bar' + (d.full ? ' id-full' : '') + '"><span style="width:' + Math.max(0, Math.min(100, +d.mastery || 0)) + '%"></span></span>'
          + '<span class="id-domain-mast">Mastery <b>' + e(d.mastery) + '%</b>' + (d.untouched ? ', untouched' : '') + ' &middot; 10 Q</span></button>';
      });
      h += '</div>';
    }
    h += '<div class="id-sect id-reveal">More ways to practise</div><div class="id-more id-reveal">';
    m.rows.forEach(function (r) {
      h += '<button class="id-mrow" type="button" data-act="row" data-id="' + e(r.id) + '"><span class="id-mi"><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICON[r.id] || '') + '</svg></span>'
        + '<span class="id-mtext"><span class="id-mhead"><span class="id-mname">' + e(r.name) + '</span>' + pill(r.pill) + '</span><span class="id-mline">' + e(r.line) + '</span></span>' + CHEV + '</button>';
    });
    h += '</div><p class="id-foot-note id-reveal">' + e(m.foot) + '</p></div>';
    return h;
  }

  function _idIsPhone() { return !!(window.matchMedia && window.matchMedia('(max-width: 899px)').matches); }
  // Live app state → the plain state the model takes. Every read is guarded: render must never block navigation.
  function _idState() {
    var cert = window.CURRENT_CERT || 'netplus';
    var bank = [], hist = [], weak = [];
    try { bank = (typeof loadWrongBank === 'function') ? loadWrongBank() : []; } catch (_) {}
    try { hist = (typeof loadHistory === 'function') ? loadHistory() : []; } catch (_) {}
    try { weak = ((typeof computeWeakSpotScores === 'function') ? computeWeakSpotScores() : []) || []; } catch (_) {}
    var acc = {}, dom = {};
    var weights = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) || {};
    var tdom = (typeof TOPIC_DOMAINS === 'object' && TOPIC_DOMAINS) || {};
    var labels = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS) || {};
    Object.keys(weights).forEach(function (k) { dom[k] = { s: 0, t: 0 }; });
    (hist || []).forEach(function (h) {
      if (!h || !h.topic) return;
      var a = acc[h.topic] || (acc[h.topic] = { s: 0, t: 0 }); a.s += h.score || 0; a.t += h.total || 0;
      var dk = tdom[h.topic]; if (dk && dom[dk]) { dom[dk].s += h.score || 0; dom[dk].t += h.total || 0; }
    });
    var q = (typeof _quotaState !== 'undefined') ? _quotaState : null;
    var body = document.body.classList;
    var pro = body.contains('is-pro-tier') || !!(q && (q.tier === 'pro' || q.tier === 'admin'));
    var meta = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta) || {};
    return {
      code: meta.code || meta.examCode || '', pro: pro, tierKnown: body.contains('is-state-resolved') || !!q,
      gauntletFree: !!(q && q.tier === 'free'), wrongCount: (bank || []).length,
      weak: weak.slice(0, 3).map(function (w) { var a = acc[w.topic]; return { topic: w.topic, pct: (a && a.t) ? Math.round(a.s / a.t * 100) : 0 }; }),
      domains: Object.keys(weights).map(function (k) {
        var st = dom[k]; return { key: k, label: labels[k] || k, weight: Math.round((weights[k] || 0) * 100), mastery: st.t ? Math.round(st.s / st.t * 100) : 0, touched: !!st.t };
      }),
      simLab: (typeof _SL_PBQ_CERTS_HOME !== 'undefined') && _SL_PBQ_CERTS_HOME.indexOf(cert) !== -1,
      decisionLab: (typeof _DL_CERTS !== 'undefined') && _DL_CERTS.indexOf(cert) !== -1,
      gauntletUsed: (typeof _gauntletFreeRunsToday === 'function') ? _gauntletFreeRunsToday() : 0,
      gauntletCap: (typeof GAUNTLET_FREE_DAILY_CAP === 'number') ? GAUNTLET_FREE_DAILY_CAP : 1,
      pbqUsed: (typeof _pbqFreeRunsToday === 'function') ? _pbqFreeRunsToday() : 0,
      pbqCap: (typeof PBQ_FREE_DAILY_CAP === 'number') ? PBQ_FREE_DAILY_CAP : 1
    };
  }
  var _idLast = null;
  // opts.still: a re-render that is not navigation (theme, tier repaint) keeps the screen still (no entrance replay)
  function renderIosDrills(opts) {
    var root = document.getElementById('ios-drills');
    if (!root) return;
    root.classList.toggle('id-static', !!(opts && opts.still));
    if (!_idIsPhone()) { root.innerHTML = ''; return; }
    try {
      var m = _iosDrillsModel(_idState());
      m.light = document.documentElement.getAttribute('data-theme') === 'light';
      _idLast = m;
      root.innerHTML = _iosDrillsHtml(m);
      if (!root._idWired) { root._idWired = true; root.addEventListener('click', _idTap); }
    } catch (e) { root.innerHTML = ''; try { console.warn('[ios-drills]', e); } catch (_) {} }   // the old cards show instead
  }
  function _idCall(n, arg) { if (typeof window[n] === 'function') window[n](arg); }
  function _idTap(ev) {
    var b = ev.target.closest && ev.target.closest('[data-act]');
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-act');
    if (act === 'mistakes') _idCall('startWrongDrill');
    else if (act === 'weak') { if (_idLast && _idLast.weak.chips[0]) _idCall('focusTopic', _idLast.weak.chips[0].topic); }
    else if (act === 'domain') _idCall('applyDomainPreset', b.getAttribute('data-key'));
    else if (act === 'row') _idCall({ sim: 'startSimLabHome', gnt: 'startRewordGauntlet', why: 'startWhyNot', dl: 'startDecisionLabHome' }[b.getAttribute('data-id')]);
    else if (act === 'theme') { _idCall('toggleTheme'); renderIosDrills({ still: true }); }
  }
  // Tier hydrates after the tab can first paint: app.js re-runs renderGauntletDrillsCard then, so chain onto it.
  if (typeof window.renderGauntletDrillsCard === 'function' && !window.renderGauntletDrillsCard._idChained) {
    var _orig = window.renderGauntletDrillsCard;
    var chained = function () {
      var r = _orig.apply(this, arguments);
      var root = document.getElementById('ios-drills');
      if (root && root.innerHTML) renderIosDrills({ still: true });
      return r;
    };
    chained._idChained = true;
    window.renderGauntletDrillsCard = chained;
  }
  if (window.matchMedia) {
    var mq = window.matchMedia('(max-width: 899px)');
    var onMq = function () { var p = document.getElementById('page-drills'); if (!mq.matches || (p && p.classList.contains('active'))) renderIosDrills(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  window.renderIosDrills = renderIosDrills;
  window._iosDrillsModel = _iosDrillsModel;
  window._iosDrillsHtml = _iosDrillsHtml;
})();
