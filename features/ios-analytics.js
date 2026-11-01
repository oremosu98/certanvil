// features/ios-analytics.js — Lift B1: the June CertAnvil E2E Analytics screen at phone width.
// Design: branch feat/cert-ios-e2e, mockups/cert-ios-analytics.html (b31c7df6). Spec: docs/superpowers/specs/2026-10-21-ios-lift-b1-design.md
(function () {
  'use strict';

  // ── Map model (pure): stars from analytics.js _computeConstellationData(h), domains as [{key, name, examPct}].
  //    mastery null = untouched; the 'novice' tier with a score is weak.
  function _iosMapModel(stars, domains) {
    var STATUS = { mastered: 'mastered', proficient: 'proficient', developing: 'developing' };
    var tile = function (s) {
      var st = s.mastery === null || s.mastery === undefined ? 'untouched' : (STATUS[s.tier] || 'weak');
      return { topic: s.topic, status: st, pct: st === 'untouched' ? null : s.mastery, attempts: s.attempts || 0, lastDays: st === 'untouched' ? null : s.lastDays };
    };
    var rows = domains.map(function (d) {
      return { key: d.key, name: d.name, examPct: d.examPct, tiles: stars.filter(function (s) { return s.domain === d.key; }).map(tile) };
    });
    var all = [];
    rows.forEach(function (r) { all = all.concat(r.tiles); });
    var rank = function (status) { return all.filter(function (t) { return t.status === status; }).sort(function (a, b) { return a.pct - b.pct; }); };
    return {
      studied: all.filter(function (t) { return t.status !== 'untouched'; }).length,
      total: all.length,
      mastered: all.filter(function (t) { return t.status === 'mastered'; }).length,
      weakest: rank('weak').concat(rank('developing')).slice(0, 3).map(function (t) { return t.topic; }),
      rows: rows
    };
  }

  // ── Analytics model (pure): D from analytics.js _anaBentoData(h) (null with no history), the Map model,
  //    and the Hands-on data from _anaDrillsGroupData().
  function _iosAnalyticsModel(D, map, drills) {
    var pages = ['Readiness', 'Map', 'Trends', 'Domains', 'Activity', 'Wins'].map(function (l) { return { key: l.toLowerCase(), label: l }; });
    if (!D) return { empty: true, pages: pages, map: map };
    var doms = D.domains.slice().sort(function (a, b) {
      var au = a.questions > 0 ? 1 : 0, bu = b.questions > 0 ? 1 : 0;
      return (au - bu) || (a.accuracy - b.accuracy) || (a.idx - b.idx);
    });
    var weakest = doms.filter(function (d) { return d.questions > 0; })[0];
    return {
      empty: false, pages: pages,
      readiness: D.readiness,
      map: map,
      trends: { passTrend: D.passTrend, difficulty: D.difficulty, examVsQuiz: D.examVsQuiz },
      domains: { rows: doms.map(function (d) { return Object.assign({}, d, { weakest: d === weakest }); }), why: D.whyScore, slips: D.wrongPatterns },
      activity: { streak: D.streak, heatmap: D.heatmap },
      wins: { badges: D.milestones, handsOn: drills || { groups: [], earned: 0, total: 0 } }
    };
  }

  // ── View (pure): the E2E markup with in- classes. cert = {mark, name, code}.
  function _iosAnalyticsHtml(m, cert) {
    var e = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var svg = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; };
    var ICON = {
      gear: svg('<circle cx="12" cy="12" r="3"></circle><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L16.5 2h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z"></path>'),
      theme: svg(cert.light ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>' : '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>'),   // shows the theme it switches to (as Home)
      tick: svg('<path d="M20 6L9 17l-5-5"></path>'),
      up: svg('<path d="M12 19V5M5 12l7-7 7 7"></path>'),
      dn: svg('<path d="M12 5v14M19 12l-7 7-7-7"></path>'),
      lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path>'),
      empty: svg('<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>'),
      chart: svg('<path d="M3 3v18h18"></path><path d="M7 14l4-4 4 4 5-5"></path>')
    };
    var head = function (kick, title, right) {
      return '<div class="in-card-head"><div><p class="in-card-kick">' + kick + '</p><h2 class="in-card-title">' + title + '</h2></div>' + (right || '') + '</div>';
    };
    var h = '<div class="in-topbar"><span class="in-tb-mark">' + e(cert.mark) + '</span>'
      + '<span class="in-tb-name"><b>' + e(cert.name) + '</b><span>' + e(cert.code) + '</span></span>'
      + '<button class="in-tb-set" type="button" data-act="settings" aria-label="Settings">' + ICON.gear + '</button>'
      + '<button class="in-app-theme" type="button" data-act="theme" aria-label="Switch theme">' + ICON.theme + '</button></div>'
      + '<div class="in-view-switch" role="group" aria-label="View"><button type="button" data-view="progress" aria-pressed="false">Progress</button>'
      + '<button type="button" data-view="analytics" aria-pressed="true">Analytics</button></div>';
    if (m.empty) {
      return h + '<div class="in-empty-card"><span class="in-ei">' + ICON.chart + '</span><h2>Unlock your first insight</h2>'
        + '<p>Finish one 5-minute warmup and this shows your weakest topic, your readiness trend and your next move.</p>'
        + '<button class="in-map-btn in-ms-go" type="button" data-act="warmup">Start 5-min warmup</button>'
        + '<span class="in-empty-foot">5 questions · about 3 minutes</span></div>';
    }
    h += '<div class="in-seg" role="tablist" aria-label="Analytics sections">' + m.pages.map(function (p, i) {
      return '<button class="in-chip' + (i === 0 ? ' in-on' : '') + '" type="button" role="tab" aria-selected="' + (i === 0) + '" data-page="' + i + '">' + p.label + '</button>';
    }).join('') + '</div><div class="in-pager">';
    var page = function (i, label, body) { return '<section class="in-page" data-page="' + i + '" role="tabpanel" aria-label="' + label + '">' + body + '</section>'; };

    // Readiness
    var r = m.readiness, st = r.stats || {}, sp = r.spark || {};
    var spark = function (vals) {
      vals = (vals || []).filter(function (v) { return typeof v === 'number'; });
      if (vals.length < 2) return '';
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = (mx - mn) || 1;
      return '<svg class="in-spark" viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + vals.map(function (v, i) {
        return Math.round(i / (vals.length - 1) * 100) + ',' + Math.round(20 - (v - mn) / rg * 18);
      }).join(' ') + '"/></svg>';
    };
    var tile = function (v, l, key, unit) { return '<div class="in-tile"><div class="in-tv">' + v + (unit || '') + '</div><span class="in-tl">' + l + '</span>' + spark(sp[key]) + '</div>'; };
    // Persona bundle T10: the honest forecast. Copy: reminders-forecast spec section 2, drawing cert-ios-analytics.html.
    var fcp = getForecastCopy(r), hasDate = typeof r.daysToExam === 'number' && r.daysToExam >= 0, line = fcp.line, fLbl = fcp.label, fVal = fcp.value, fRange = fcp.range, fDim = fcp.dim;
    var pn = r.pbqNote, pbqLine = '';
    if (pn) pbqLine = '<p class="in-rd-pbq">Readiness counts multiple-choice only. ' + (pn.n > 0
      ? '<b>PBQs: ' + pn.right + ' of ' + pn.count + ' fully right</b> in your last ' + (pn.n === 1 ? 'full exam' : pn.n + ' full exams') + '.'
      : (pn.hasExams ? 'PBQ results show from your next full exam.' : '<b>Take a full exam</b> to practise PBQs too.')) + '</p>';
    var past = typeof r.daysToExam === 'number' && r.daysToExam < 0, ago = past ? -r.daysToExam : 0;   // founder 31 Oct: a past date reads "N days ago", as on desktop
    var dte = hasDate ? (r.daysToExam <= 0 ? 'Today' : r.daysToExam + (r.daysToExam === 1 ? ' day' : ' days')) : past ? ago + (ago === 1 ? ' day ago' : ' days ago') : 'Not set';
    h += page(0, 'Readiness', '<div class="in-rd in-reveal"><div class="in-rd-top"><span class="in-rd-eyebrow">Readiness</span><span class="in-rd-tier">' + e(r.tier) + '</span></div>'
      + '<div class="in-rd-score"><span class="in-rd-num" data-to="' + r.predicted + '"' + (r.fmt === 'percent' ? ' data-sfx="%"' : '') + '>' + r.predicted + (r.fmt === 'percent' ? '%' : '') + '</span><span class="in-rd-of">' + (r.fmt === 'percent' ? '' : '/ ' + (r.maxScore || 900)) + '</span></div>'
      + '<div class="in-bar"><span data-w="' + (r.barPct || 0).toFixed(1) + '" style="width:0%"></span><span class="in-tick" style="left:' + (r.passTickPct || 0).toFixed(1) + '%"></span></div>'
      + '<div class="in-rd-legend"><span>Now</span><span class="in-p">Pass ' + r.passScore + (r.fmt === 'percent' ? '%' : '') + '</span></div>'
      + '<p class="in-rd-insight">' + line + '</p>'
      + '<div class="in-rd-forecast"><div class="in-rd-fc"><span class="in-fl">' + fLbl + '</span><span class="in-fv' + (fDim ? ' in-dim' : '') + '">' + fVal + '</span>' + (fRange ? '<span class="in-fr">' + fRange + '</span>' : '') + '</div>'
      + '<div class="in-rd-fc"><span class="in-fl">Days to exam</span><span class="in-fv' + (dte === 'Not set' ? ' in-dim' : '') + '">' + dte + '</span></div></div>' + pbqLine + '</div>'
      + '<div class="in-tiles in-reveal">' + tile(st.sessions || 0, 'Sessions', 'sessions') + tile(st.questions || 0, 'Questions', 'questions')
      + tile(st.accuracy || 0, 'Accuracy', 'accuracy', '<span class="in-tv-u">%</span>') + tile(st.studyDays || 0, 'Study days', 'studyDays') + '</div>');

    // Map
    var mp = m.map, wk = mp.weakest || [];
    var LABEL = { mastered: 'mastered', proficient: 'proficient', developing: 'developing', weak: 'weak', untouched: 'untouched' };
    var mh = '<div class="in-card in-map in-reveal"><div class="in-card-head"><div><p class="in-card-kick">Coverage</p><h2 class="in-card-title">Your topic map</h2>'
      + '<p class="in-map-meta">' + mp.studied + ' of ' + mp.total + ' studied · ' + mp.mastered + ' mastered</p></div></div>';
    if (wk.length) mh += '<div class="in-map-act"><div class="in-map-act-t"><b>' + (wk.length === 1 ? 'Your weakest topic' : 'Your ' + wk.length + ' weakest topics') + '</b>'
      + '<span>' + e(wk.join(', ')) + '</span></div><button class="in-map-btn" type="button" data-act="drill-weakest">' + (wk.length === 1 ? 'Drill it' : 'Drill them') + '</button></div>';
    mh += mp.rows.map(function (row, ri) {
      var dn = (ri + 1) + '.0 ' + row.name;
      return '<div class="in-map-dom"><div class="in-map-dh"><b>' + e(dn) + '</b><span>' + row.examPct + '% of exam</span></div><div class="in-map-tiles">'
        + row.tiles.map(function (t) {
          var lbl = t.topic + ', ' + LABEL[t.status] + (t.pct === null ? '' : ', ' + t.pct + '%');
          return '<button class="in-mtile in-t-' + t.status + '" type="button" aria-pressed="false" aria-label="' + e(lbl) + '" data-t="' + e(t.topic) + '" data-d="' + e(dn)
            + '" data-s="' + t.status + '" data-p="' + (t.pct === null ? '' : t.pct) + '" data-n="' + t.attempts + '" data-l="' + (t.lastDays === null || t.lastDays === undefined ? '' : t.lastDays) + '"></button>';
        }).join('') + '</div></div>';
    }).join('');
    mh += '<div class="in-map-legend" aria-hidden="true">' + ['mastered', 'proficient', 'developing', 'weak', 'untouched'].map(function (k) {
      return '<span><i class="in-t-' + k + '"></i>' + k.charAt(0).toUpperCase() + k.slice(1) + '</span>';
    }).join('') + '</div></div>';
    h += page(1, 'Map', mh);

    // Trends
    var tr = m.trends, pt = tr.passTrend || {}, data = pt.data || {}, lo = pt.yMin || 0, hi = pt.yMax || 100, pass = pt.passAcc || 72;
    var yOf = function (acc) { return Math.round(96 - (Math.max(lo, Math.min(hi, acc)) - lo) / ((hi - lo) || 1) * 96); };
    var chart = function (key, on) {
      var pts = data[key] || [];
      var xs = pts.map(function (_, i) { return pts.length === 1 ? 150 : Math.round(6 + i / (pts.length - 1) * 288); });
      return '<svg class="in-acc-chart" data-range="' + key + '"' + (on ? '' : ' hidden') + ' viewBox="0 0 300 96" preserveAspectRatio="none" aria-hidden="true">'
        + '<line class="in-pass" x1="0" y1="' + yOf(pass) + '" x2="300" y2="' + yOf(pass) + '"></line><text x="2" y="' + Math.max(9, yOf(pass) - 5) + '">Pass ' + pass + '%</text>'
        + (pts.length > 1 ? '<polyline class="in-dat" points="' + pts.map(function (p, i) { return xs[i] + ',' + yOf(p.acc); }).join(' ') + '"></polyline>' : '')
        + pts.map(function (p, i) { return '<circle cx="' + xs[i] + '" cy="' + yOf(p.acc) + '" r="2.6"></circle>'; }).join('') + '</svg>';
    };
    var month = data.month || [], now = month.length ? month[month.length - 1].acc : null;
    var trh = '<div class="in-card in-reveal">' + head('Accuracy over time', 'Trending toward pass',
      '<div class="in-rangeseg" role="group" aria-label="Range"><button type="button" data-range="week">Week</button><button type="button" class="in-on" data-range="month">Month</button><button type="button" data-range="all">All</button></div>')
      + '<div class="in-acc-top"><span class="in-acc-now in-pct">' + (now === null ? '--' : now + '%') + '</span><span class="in-acc-note">'
      + (now === null ? 'not enough this month yet' : 'now, ' + (now >= pass ? 'above' : 'below') + ' the ' + pass + '% line') + '</span></div>'
      + chart('week', false) + chart('month', true) + chart('all', false) + '</div>';
    if ((tr.difficulty || []).length) trh += '<div class="in-card in-reveal">' + head('By difficulty', 'Where you hold up') + tr.difficulty.map(function (d) {
      var good = d.accuracy >= pass;
      return '<div class="in-diff-row"><div class="in-diff-top"><span class="in-diff-nm">' + e(d.label) + ' <span>' + d.count + 'q</span></span><span class="in-diff-val ' + (good ? 'in-g' : 'in-a') + ' in-pct">' + d.accuracy + '%</span></div>'
        + '<div class="in-bar' + (good ? ' in-passbar' : '') + '"><span data-w="' + d.accuracy + '" style="width:0%"></span></div></div>';
    }).join('') + '</div>';
    var ev = tr.examVsQuiz;
    trh += '<div class="in-card in-reveal">' + head('Practice vs timed', 'Pressure check') + '<div class="in-pvt">'
      + '<div class="in-pvt-col"><span class="in-pl">Quiz avg</span><span class="in-pv">' + (ev ? ev.quizAvg + '%' : 'Building data') + '</span></div>'
      + '<div class="in-pvt-col"><span class="in-pl">Exam avg</span><span class="in-pv">' + (ev ? ev.examAvg + '%' : 'No exams yet') + '</span></div></div>'
      + '<p class="in-card-sub">' + e(ev ? ev.insight : 'Complete a few quizzes and at least one full exam simulation to compare timed pressure against practice.') + '</p></div>';
    h += page(2, 'Trends', trh);

    // Domains
    var dm = m.domains, why = dm.why || {};
    var dh = '<div class="in-card in-reveal">' + head('Mastery by domain', 'Worst first') + dm.rows.map(function (d) {
      var cls = d.questions === 0 || d.tier === 'novice' || d.tier === 'unstudied' ? 'weak' : d.tier === 'mastered' ? 'strong' : '';
      return '<div class="in-mrow"><div class="in-mrow-top"><span class="in-mrow-nm">' + e(d.name) + '</span><span class="in-mrow-sc' + (cls ? ' in-' + cls : '') + '">' + e(d.num)
        + ' · ' + (d.questions ? '<span class="in-pct">' + d.accuracy + '%</span>' : 'no % yet') + '</span></div>'
        + '<div class="in-bar' + (cls ? ' in-' + cls + 'bar' : '') + '"><span data-w="' + Math.max(d.accuracy, 4) + '" style="width:0%"></span></div>'
        + '<p class="in-mrow-meta">' + d.questions + ' question' + (d.questions === 1 ? '' : 's') + ' · ' + d.weight + '% of exam' + (d.weakest ? ' · <span class="in-tag">weakest, drill here</span>' : '') + '</p></div>';
    }).join('') + '</div>';
    if (why.headline) dh += '<div class="in-lev in-reveal"><p class="in-card-kick">Highest-leverage move</p><div class="in-lev-gain">' + e(why.leverage) + '<span class="in-u"> on your readiness score</span></div>'
      + '<p class="in-lev-act">' + e(why.headline) + '</p><p class="in-lev-body">' + e(why.body) + '</p><div class="in-lev-list">'
      + (why.factors || []).map(function (f) { return '<div class="in-lev-row"><span class="in-lev-mark in-' + (f.effect === 'up' ? 'up' : 'dn') + '">' + (f.effect === 'up' ? ICON.up : ICON.dn) + '</span><span><b>' + e(f.label) + '</b> ' + e(f.note) + '</span></div>'; }).join('') + '</div></div>';
    if ((dm.slips || []).length) dh += '<div class="in-card in-reveal">' + head('Where you slip most', 'Top 3 patterns') + dm.slips.slice(0, 3).map(function (w, i) {
      return '<div class="in-slip"><span class="in-rank">' + (i + 1) + '</span><span class="in-stxt"><b>' + e(w.label) + '</b><span>' + e(w.domain) + ' · ' + e(w.note) + '</span></span><span class="in-smiss">' + w.count + ' missed</span></div>';
    }).join('') + '</div>';
    h += page(3, 'Domains', dh);

    // Activity
    var sk = m.activity.streak || {}, hm = (m.activity.heatmap || []).slice(-182);
    var lvl = function (n) { return n <= 0 ? '' : n <= 5 ? ' in-l1' : n <= 15 ? ' in-l2' : ' in-l3'; };
    h += page(4, 'Activity', '<div class="in-card in-reveal">' + head('Study streak', 'Keep the chain')
      + '<div class="in-streak-top"><span class="in-streak-num">' + (sk.current || 0) + '</span><span class="in-streak-unit">day streak</span></div>'
      + '<p class="in-streak-meta">Longest <b>' + (sk.longest || 0) + '</b> · <b>' + (sk.totalActiveDays || 0) + '</b> active days · last studied <b>' + e(sk.lastStudy || 'never') + '</b>.</p>'
      + '<div class="in-days">' + (sk.week || []).map(function (d) { return '<div class="in-day' + (d.studied ? ' in-active' : '') + '"><span class="in-dc"></span><span class="in-dl">' + e(d.dayLabel) + '</span></div>'; }).join('') + '</div></div>'
      + '<div class="in-card in-reveal">' + head('Activity', 'Last 26 weeks', '<span class="in-card-meta">' + hm.filter(function (d) { return d.count > 0; }).length + ' active days</span>')
      + '<div class="in-heat" aria-hidden="true">' + hm.map(function (d) { return '<i class="in-hm' + lvl(d.count) + '"></i>'; }).join('') + '</div>'
      + '<div class="in-heat-legend">Less <span class="in-sw"><i></i><i class="in-l1"></i><i class="in-l2"></i><i class="in-l3"></i></span> More</div></div>');

    // Wins
    var b = m.wins.badges || {}, ho = m.wins.handsOn || { groups: [] };
    var wh = '<div class="in-card in-reveal">' + head('Milestones', 'Badges earned', '<span class="in-mile-count">' + (b.unlocked || 0) + '<small> / ' + (b.total || 0) + '</small></span>')
      + (b.recent || []).map(function (x) {
        return '<div class="in-mile"><span class="in-mi">' + svg('<path d="' + e(x.icon || 'M20 6L9 17l-5-5') + '"></path>') + '</span><span class="in-mtx"><b>' + e(x.label) + '</b><span>' + e(x.earned) + '</span></span><span class="in-mtick">' + ICON.tick + '</span></div>';
      }).join('')
      + (b.locked || []).map(function (x) {
        var p = x.progress || [0, 1], pc = Math.round(p[0] / p[1] * 1000) / 10;
        return '<div class="in-mile in-locked"><span class="in-mi">' + ICON.lock + '</span><span class="in-mtx" style="flex:1 1 auto"><b>' + e(x.label) + '</b><span>' + e(x.desc) + '</span>'
          + '<span class="in-mile-prog"><span class="in-bar"><span data-w="' + pc + '" style="width:0%"></span></span><span class="in-mp-meta"><span>' + p[0] + '</span><span>' + p[1] + '</span></span></span></span></div>';
      }).join('') + '</div>';
    if (ho.groups.length) wh += '<div class="in-card in-reveal">' + head('Drills', 'Hands-on milestones', '<span class="in-mile-count">' + ho.earned + '<small> / ' + ho.total + '</small></span>')
      + ho.groups.map(function (g) {
        var done = g.steps.filter(function (x) { return x.state === 'earned'; }).length;
        var prog = g.steps.filter(function (x) { return x.state === 'prog'; })[0];
        var pct = Math.round((done + (prog ? prog.cur / prog.tar : 0)) / g.steps.length * 100);
        return '<div class="in-ho"><div class="in-ho-head"><b>' + e(g.name) + '</b><span>' + e(g.meta.charAt(0).toUpperCase() + g.meta.slice(1)) + '</span><span class="in-ho-n">' + done + '/' + g.steps.length + '</span></div>'
          + '<div class="in-ho-steps">' + g.steps.map(function (x) {
            return '<span class="in-ho-step in-' + x.state + '">' + (x.state === 'earned' ? ICON.tick : '') + e(x.label) + (x.state === 'prog' && x.tar > 1 ? ' <em>' + x.cur + '/' + x.tar + '</em>' : '') + '</span>';
          }).join('') + '</div>' + (pct > 0 ? '<div class="in-ho-bar"><span data-w="' + pct + '" style="width:0%"></span></div>' : '') + '</div>';
      }).join('') + '</div>';
    var ex = m.wins.exams || [];
    wh += '<div class="in-card in-reveal">' + head('Full exams', 'Scaled scores') + (ex.length ? ex.map(function (x) {
      return '<div class="in-exrow"><b>' + x.score + (typeof EXAM_SCORE_FORMAT === 'string' && EXAM_SCORE_FORMAT === 'percent' ? '%' : '') + '</b><span>' + e(x.date) + ' · ' + x.questions + ' questions</span></div>';
    }).join('') : '<div class="in-empty"><span class="in-ei">' + ICON.empty + '</span><b>None yet</b><span>Run one to track scaled scores.</span></div>') + '</div>';
    h += page(5, 'Wins', wh);

    h += '</div><div class="in-map-scrim" data-act="close"></div>'
      + '<div class="in-map-sheet" role="dialog" aria-modal="true" aria-labelledby="in-ms-name"><div class="in-ms-grip" aria-hidden="true"></div>'
      + '<p class="in-ms-dom"></p><h3 class="in-ms-name" id="in-ms-name"></h3><div class="in-ms-stats">'
      + '<div><b class="in-ms-m"></b><span>Mastery</span></div><div><b class="in-ms-a"></b><span>Answered</span></div><div><b class="in-ms-s"></b><span>Last seen</span></div></div>'
      + '<button class="in-map-btn in-ms-go" type="button" data-act="drill-one">Drill this topic</button></div>';
    return h;
  }

  // ── Mount: phone width only, into #ios-analytics. Same data the desktop bento reads.
  function _inIsPhone() { return !!(window.matchMedia && window.matchMedia('(max-width: 899px)').matches); }
  function _inReduce() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function _inCert() {
    var id = (typeof CURRENT_CERT === 'string' && CURRENT_CERT) || 'netplus';
    var re = window.CertRegistry && window.CertRegistry.get(id);
    var raw = (typeof CERT_PACK === 'object' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name) || 'CompTIA Network+';
    return { mark: re ? re.mark : 'CA', name: String(raw).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''), code: (typeof CERT_CODE === 'string' && CERT_CODE) || 'N10-009',
      light: document.documentElement.getAttribute('data-theme') === 'light' };
  }
  function _inDomains() {
    var w = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS) || {}, l = (typeof DOMAIN_LABELS === 'object' && DOMAIN_LABELS) || {};
    return Object.keys(w).map(function (k) { return { key: k, name: l[k] || k, examPct: Math.round(w[k] * 100) }; });
  }
  function _inNav(name) {
    var R = { progress: 'renderProgressPage', settings: 'renderSettingsPage' };
    try { if (typeof window[R[name]] === 'function') window[R[name]](); } catch (_) {}
    if (typeof window.showPage === 'function') window.showPage(name);
  }

  function renderIosAnalytics() {
    var root = document.getElementById('ios-analytics');
    if (!root) return false;
    if (!_inIsPhone()) { if (root.innerHTML) root.innerHTML = ''; return false; }
    var h = (typeof loadHistory === 'function' ? loadHistory() : []) || [];
    var D = null, stars = [], drills = null;
    try { if (h.length && typeof window._anaBentoData === 'function') D = window._anaBentoData(h); } catch (_) { D = null; }
    try { stars = typeof window._computeConstellationData === 'function' ? window._computeConstellationData(h) : []; } catch (_) { stars = []; }
    try { drills = typeof window._anaDrillsGroupData === 'function' ? window._anaDrillsGroupData() : null; } catch (_) { drills = null; }
    var model = _iosAnalyticsModel(D, _iosMapModel(stars, _inDomains()), drills);
    if (!model.empty) {
      model.readiness = Object.assign({ maxScore: (typeof EXAM_MAX_SCORE === 'number' && EXAM_MAX_SCORE) || 900, fmt: (typeof EXAM_SCORE_FORMAT === 'string' && EXAM_SCORE_FORMAT) || 'scaled' }, model.readiness);
      model.wins.exams = D.examHistory || [];
    }
    root.innerHTML = _iosAnalyticsHtml(model, _inCert());
    _inWire(root, model);
    return true;
  }

  function _inWire(root, model) {
    var reduce = _inReduce();
    var pager = root.querySelector('.in-pager'), chips = [].slice.call(root.querySelectorAll('.in-chip'));
    var pages = [].slice.call(root.querySelectorAll('.in-page'));
    var setActive = function (i) {
      chips.forEach(function (c, j) { c.classList.toggle('in-on', j === i); c.setAttribute('aria-selected', String(j === i)); });
      if (chips[i] && chips[i].scrollIntoView) chips[i].scrollIntoView({ inline: 'center', block: 'nearest' });
    };
    if (pager && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting && en.intersectionRatio >= 0.6) setActive(+en.target.getAttribute('data-page')); });
      }, { root: pager, threshold: 0.6 });
      pages.forEach(function (p) { io.observe(p); });
    }
    // bars sweep to their values (BRAND §6 chart sweep); the score counts up with them
    var bars = [].slice.call(root.querySelectorAll('[data-w]'));
    var fill = function () { bars.forEach(function (b) { b.style.width = b.getAttribute('data-w') + '%'; }); };
    if (reduce) fill(); else requestAnimationFrame(function () { requestAnimationFrame(fill); });
    var num = root.querySelector('.in-rd-num');
    if (num && !reduce) {
      var to = +num.getAttribute('data-to'), t0 = null;
      var step = function (t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 900, 1); num.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + (num.getAttribute('data-sfx') || ''); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    var sheet = root.querySelector('.in-map-sheet'), scrim = root.querySelector('.in-map-scrim'), cur = null;
    var closeSheet = function () {
      if (!sheet) return;
      sheet.classList.remove('in-is-open'); scrim.classList.remove('in-is-open');
      if (cur) { cur.setAttribute('aria-pressed', 'false'); cur.focus({ preventScroll: true }); cur = null; }
    };
    var openSheet = function (b) {
      if (cur) cur.setAttribute('aria-pressed', 'false');
      cur = b; b.setAttribute('aria-pressed', 'true');
      var pct = b.getAttribute('data-p'), days = b.getAttribute('data-l'), un = b.getAttribute('data-s') === 'untouched';
      sheet.querySelector('.in-ms-dom').textContent = b.getAttribute('data-d');
      sheet.querySelector('.in-ms-name').textContent = b.getAttribute('data-t');
      sheet.querySelector('.in-ms-m').textContent = pct === '' ? 'Not yet' : pct + '%';
      sheet.querySelector('.in-ms-a').textContent = b.getAttribute('data-n');
      sheet.querySelector('.in-ms-s').textContent = days === '' ? 'Never' : (+days <= 0 ? 'Today' : days + 'd');
      var go = sheet.querySelector('.in-ms-go');
      go.textContent = un ? 'Start this topic' : 'Drill this topic';
      sheet.classList.add('in-is-open'); scrim.classList.add('in-is-open');
      go.focus({ preventScroll: true });
    };
    root.onkeydown = function (ev) { if (ev.key === 'Escape' && sheet && sheet.classList.contains('in-is-open')) closeSheet(); };
    root.onclick = function (ev) {
      if (ev.target === scrim) { closeSheet(); return; }
      var b = ev.target.closest('button'); if (!b || !root.contains(b)) return;
      var act = b.getAttribute('data-act');
      if (b.classList.contains('in-mtile')) { openSheet(b); return; }
      if (b.classList.contains('in-chip')) { var pg = pages[+b.getAttribute('data-page')]; if (pg) pager.scrollTo({ left: pg.offsetLeft, behavior: reduce ? 'auto' : 'smooth' }); return; }
      if (b.hasAttribute('data-view')) { if (b.getAttribute('data-view') === 'progress') _inNav('progress'); return; }
      if (b.hasAttribute('data-range')) {
        var k = b.getAttribute('data-range');
        root.querySelectorAll('.in-rangeseg button').forEach(function (x) { x.classList.toggle('in-on', x === b); });
        root.querySelectorAll('.in-acc-chart').forEach(function (c) { c.hidden = c.getAttribute('data-range') !== k; });
        return;
      }
      if (act === 'drill-weakest') { if (typeof window._startTopicsQuiz === 'function') window._startTopicsQuiz(model.map.weakest.slice()); return; }
      if (act === 'drill-one') { var t = cur && cur.getAttribute('data-t'); closeSheet(); if (t && typeof window.focusTopic === 'function') window.focusTopic(t); return; }
      if (act === 'warmup') { if (typeof window.applyPreset === 'function') window.applyPreset('warmup'); return; }
      if (act === 'settings') { _inNav('settings'); return; }
      if (act === 'theme') {
        if (typeof toggleTheme === 'function') toggleTheme();
        var lt = document.documentElement.getAttribute('data-theme') === 'light';
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (lt ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>' : '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>') + '</svg>';
      }
    };
  }

  window._iosMapModel = _iosMapModel;
  window._iosAnalyticsHtml = _iosAnalyticsHtml;
  window.renderIosAnalytics = renderIosAnalytics;
  if (window.matchMedia) { var mq = window.matchMedia('(max-width: 899px)'); var onMq = function () { var p = document.getElementById('page-analytics'); if (!mq.matches || (p && p.classList.contains('active'))) renderIosAnalytics(); }; if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq); }
  window._iosAnalyticsModel = _iosAnalyticsModel;
})();
