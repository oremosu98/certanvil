// ═══════════════════════════════════════════════════════════════════════
// features/ios-firstrun.js — Lift C (26 Oct 2026): first run on phones (≤899px).
// The June E2E (feat/cert-ios-e2e @ ee053395, HUD "C ›") drawn for the real app:
// day-0 Home, the 30-second check and its starting point, capped Home, the
// daily-limit screen, offline, and (behind the onboarding switch) the cert
// picker, its lock-in sheet and the session-restore skeleton.
// Pure model/view functions first (UAT runs each body alone in a vm, so every
// one carries its own escape helper), then the phone hosts.
// ═══════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── State rules (spec §State rules) ─────────────────────────────────
  // s = {cert, historyRows, snapshot, skipped, pro, signedIn, remaining}
  function _ifrState(s) {
    var placed = (s.historyRows || 0) > 0 || s.snapshot != null;
    var remaining = typeof s.remaining === 'number' ? s.remaining : Infinity;
    var now = new Date(), next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return {
      placed: placed,
      day0: !placed && !s.skipped,
      capped: !s.pro && !!s.signedIn && remaining === 0,
      remaining: remaining,
      hoursToReset: Math.max(1, Math.ceil((next - now.getTime()) / 3600000))
    };
  }

  // The cert's own readiness scale (never a hard-coded 720 / 900).
  function _ifrScale(meta) {
    meta = meta || {};
    return {
      min: typeof meta.examMinScore === 'number' ? meta.examMinScore : 100,
      max: typeof meta.examMaxScore === 'number' ? meta.examMaxScore : 900,
      pass: typeof meta.examPassScore === 'number' ? meta.examPassScore : 720
    };
  }

  // m = {cert: {name, code, glyph}, pro, remaining, scale}
  function _ifrDay0Html(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var c = m.cert || {}, sc = m.scale || { min: 100, max: 900, pass: 720 };
    var rem = typeof m.remaining === 'number' && isFinite(m.remaining) ? m.remaining : 15;
    var quota = m.pro ? '' :
      '<div class="ifr-hb-quota">' +
        '<div class="ifr-hb-row"><span class="ifr-hb-rn">New practice</span><span class="ifr-hb-full"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>' + e(rem) + ' of 15 ready</span></div>' +
        '<div class="ifr-hb-row"><span class="ifr-hb-rn">Daily Review</span><span class="ifr-hb-rv">5 ready when you have cards</span></div>' +
      '</div>';
    var diagP = m.pro ? 'A 30-second check that gives you a starting number, so you can watch it move.'
      : 'A 30-second check, free, and it never counts against <b>your daily 15</b>. It gives you a starting number so you can watch it move.';
    var ring = m.pro ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>' : '15';
    return '<div class="ifr-home ifr-day0">' +
      '<div class="ifr-greet ifr-rv"><div class="ifr-hi">Your exam is set</div><h1>Let\'s place your readiness.</h1></div>' +
      '<div class="ifr-hb ifr-rv"><div class="ifr-hb-top"><div class="ifr-hb-cert"><span class="ifr-mark">' + e(c.glyph) + '</span>' +
        '<span><span class="ifr-hb-name">' + e(c.name) + '</span><span class="ifr-hb-code">' + e(c.code) + '</span></span></div>' +
        '<span class="ifr-plan">' + (m.pro ? 'Pro' : 'Free') + '</span></div>' + quota + '</div>' +
      '<div class="ifr-ready ifr-rv"><span class="ifr-ready-dial"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14l4-4"/><path d="M3.5 18a9 9 0 1 1 17 0"/></svg></span>' +
        '<div><div class="ifr-ready-t">Readiness: not placed yet</div><div class="ifr-ready-s">Scored ' + e(sc.min) + ' to ' + e(sc.max) + ', with ' + e(sc.pass) + ' to pass. Answer a few and it appears here.</div></div></div>' +
      '<div class="ifr-diag ifr-rv"><div class="ifr-diag-head"><span class="ifr-diag-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20v-6"/><path d="M6 20v-3"/><path d="M18 20v-9"/><path d="M4 11l6-5 4 3 6-6"/></svg></span>' +
        '<div><div class="ifr-diag-kick">Recommended first step</div><div class="ifr-diag-h">Place your readiness</div></div></div>' +
        '<p class="ifr-diag-p">' + diagP + '</p><button type="button" class="ifr-btn" data-act="check">Take the 30-second check</button></div>' +
      '<div class="ifr-start ifr-rv"><div class="ifr-start-head"><div class="ifr-start-ring">' + ring + '</div>' +
        '<div><div class="ifr-start-t">Just start practising</div><div class="ifr-start-s">' +
        (m.pro ? 'Skip the check and start a quiz. Your readiness still builds as you go.' : 'Skip the check and dive into today\'s 15. Your readiness still builds as you go.') +
        '</div></div></div><button type="button" class="ifr-ghost" data-act="today">' + (m.pro ? 'Start a quiz' : 'Start today\'s 15') + '</button></div>' +
      '<div class="ifr-aha ifr-rv"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5h-5"/></svg><span>Answer a few and watch your readiness move.</span></div>' +
    '</div>';
  }

  // m = {cert, due, hours}
  function _ifrCappedHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var c = m.cert || {}, due = m.due || 0, h = m.hours || 1, mins = Math.max(1, Math.round(due * 0.6));
    return '<div class="ifr-home ifr-capped">' +
      '<div class="ifr-hb ifr-rv"><div class="ifr-hb-top"><div class="ifr-hb-cert"><span class="ifr-mark">' + e(c.glyph) + '</span>' +
        '<span><span class="ifr-hb-name">' + e(c.name) + '</span><span class="ifr-hb-code">' + e(c.code) + '</span></span></div><span class="ifr-plan">Free</span></div>' +
        '<div class="ifr-hb-quota"><div class="ifr-hb-row"><span class="ifr-hb-rn">Daily Review</span><span class="ifr-hb-rv">' + e(due) + ' cards due</span></div>' +
        '<div class="ifr-hb-row"><span class="ifr-hb-rn">New practice</span><span class="ifr-hb-rv">15 of 15 · resets in ' + e(h) + 'h</span></div></div></div>' +
      '<div class="ifr-greet ifr-rv"><div class="ifr-hi">Done for today</div><h1>That\'s today\'s 15 done.</h1>' +
        '<p class="ifr-lede">Your streak is safe. Daily Review still moves your readiness, and 15 fresh questions unlock in about ' + e(h) + ' hours.</p></div>' +
      (due > 0 ? '<div class="ifr-rev ifr-rv"><div class="ifr-start-head"><div class="ifr-start-ring">' + e(due) + '</div>' +
        '<div><div class="ifr-start-t">Daily Review</div><div class="ifr-start-s">' + e(due) + ' cards from what you\'ve missed, about ' + e(mins) + ' minutes. Still free today.</div></div></div>' +
        '<button type="button" class="ifr-btn" data-act="review">Start review</button></div>' : '') +
      '<div class="ifr-see ifr-rv"><div><div class="ifr-see-t">Hitting the cap a lot?</div><div class="ifr-see-s">Pro removes the daily limit.</div></div>' +
        '<button type="button" class="ifr-see-btn" data-act="gopro">See Pro</button></div>' +
    '</div>';
  }

  // m = {n, total, q: {text, options[], topic}, picked: 'A'..'D'|null, pro, code}
  function _ifrCheckHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var q = m.q || {}, L = ['A', 'B', 'C', 'D'], total = m.total || 5;
    var opts = (q.options || []).slice(0, 4).map(function (o, i) {
      var on = m.picked === L[i];
      return '<button type="button" class="ifr-opt' + (on ? ' sel' : '') + '" data-act="pick" data-l="' + L[i] + '" aria-pressed="' + on + '">' +
        '<span class="ifr-key">' + L[i] + '</span><span class="ifr-label">' + e(o) + '</span></button>';
    }).join('');
    return '<div class="ifr-check">' +
      '<div class="ifr-hdr"><h1>Quick check</h1><span class="ifr-tag">' + (m.pro ? 'Pro' : 'Free') + '</span></div>' +
      '<div class="ifr-body">' +
        '<div class="ifr-prog"><span class="ifr-qc">Question ' + e(m.n) + ' of ' + e(total) + '</span><span class="ifr-qt">' + e(m.code) + '</span></div>' +
        '<div class="ifr-qbar"><span style="width:' + Math.round(100 * m.n / total) + '%"></span></div>' +
        (q.topic ? '<span class="ifr-topic"><span class="ifr-dot"></span>' + e(q.topic) + '</span>' : '') +
        '<p class="ifr-qtext">' + e(q.text) + '</p>' + opts +
        '<div class="ifr-note"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>' +
          '<p>' + (m.pro ? 'This check is <b>free</b>.' : 'This check is <b>free and never counts against your daily 15</b>.') +
          ' There are no wrong answers here, only a read on where you are starting.</p></div>' +
      '</div>' +
      '<div class="ifr-foot"><button type="button" class="ifr-btn" data-act="next"' + (m.picked ? '' : ' disabled') + '>Next question</button>' +
        '<button type="button" class="ifr-text" data-act="skip">Skip the check</button></div>' +
    '</div>';
  }

  // m = {score, scale, cert, pro}
  function _ifrScoreHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var sc = m.scale || { min: 100, max: 900, pass: 720 }, c = m.cert || {}, span = Math.max(1, sc.max - sc.min);
    var pct = Math.max(0, Math.min(100, Math.round(1000 * (m.score - sc.min) / span) / 10));
    var tick = Math.round(1000 * (sc.pass - sc.min) / span) / 10;
    return '<div class="ifr-check ifr-score">' +
      '<div class="ifr-hdr"><h1>Your readiness</h1><span class="ifr-tag">' + (m.pro ? 'Pro' : 'Free') + '</span></div>' +
      '<div class="ifr-body">' +
        '<p class="ifr-kicker">Your starting point</p>' +
        '<div class="ifr-ac"><div class="ifr-ac-top"><span class="ifr-mark">' + e(c.glyph) + '</span><span><span class="ifr-hb-name">' + e(c.name) + '</span><span class="ifr-hb-code">' + e(c.code) + '</span></span><span class="ifr-badge">Day one</span></div>' +
          '<div class="ifr-ac-score"><span class="ifr-ac-num" data-to="' + e(m.score) + '">' + e(m.score) + '</span><span class="ifr-ac-of">/ ' + e(sc.max) + ' readiness</span></div>' +
          '<div class="ifr-bar"><span style="width:' + pct + '%"></span><span class="ifr-tick" style="left:' + tick + '%"></span></div>' +
          '<div class="ifr-legend"><span>' + e(sc.min) + '</span><span class="p">Pass ' + e(sc.pass) + '</span><span>' + e(sc.max) + '</span></div></div>' +
        '<p class="ifr-frame">A starting point, not a grade.</p>' +
        '<div class="ifr-aha2"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v4h-4"/></svg>' +
          '<p>Practise a little and this number moves. Most people see it climb in their first few sessions, so the best read on your progress is the next one.</p></div>' +
      '</div>' +
      '<div class="ifr-foot"><button type="button" class="ifr-btn" data-act="practise">Start practising</button></div>' +
    '</div>';
  }

  // m = {picked, remaining}
  function _ifrLimitHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var r = Math.max(0, m.remaining || 0);
    return '<div class="ifr-check ifr-limit">' +
      '<div class="ifr-hdr"><button type="button" class="ifr-back" data-act="limit-back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><span class="ifr-hdr-k">Free daily limit</span></div>' +
      '<div class="ifr-body">' +
        '<span class="ifr-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>' +
        '<h1 class="ifr-limit-h">That\'s more than your <em>free</em> day</h1>' +
        '<p class="ifr-lede">You picked a <b>' + e(m.picked) + '-question</b> set. Free covers <b>15 practice questions</b> a day, so this one needs Pro.</p>' +
        '<div class="ifr-allow">' +
          '<div class="ifr-arow"><span class="ifr-aico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg></span><span class="ifr-atx"><b>Practice</b><span>Quizzes and custom sets</span></span><span class="ifr-aamt">15 / day</span></div>' +
          '<div class="ifr-arow"><span class="ifr-aico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/></svg></span><span class="ifr-atx"><b>Daily Review</b><span>Spaced repetition</span></span><span class="ifr-aamt">5 / day</span></div>' +
        '</div>' +
        '<p class="ifr-proline"><b>Pro</b> has no daily limit, on any cert.</p>' +
      '</div>' +
      '<div class="ifr-foot"><button type="button" class="ifr-btn" data-act="limit-pro"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z"/></svg>Go Pro for unlimited</button>' +
        (r > 0 ? '<button type="button" class="ifr-ghost" data-act="limit-small">Start a ' + e(r) + '-question set</button>' : '') + '</div>' +
    '</div>';
  }

  function _ifrOfflineHtml() {
    return '<div class="ifr-off">' +
      '<span class="ifr-off-glyph"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 8.8a16 16 0 0 1 20 0"/><path d="M5 12.5a11 11 0 0 1 14 0"/><path d="M8.5 16a6 6 0 0 1 7 0"/><path d="M12 20h.01"/><path d="M3 3l18 18"/></svg></span>' +
      '<h2>You\'re offline.</h2>' +
      '<p>Your progress is <b>saved on this device</b> and will sync when you\'re back. Nothing is lost, so you can keep going or pick up later.</p>' +
      '<span class="ifr-saved"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg><span>Saved locally, will sync</span></span>' +
    '</div>';
  }

  // m = {certs: [{id, glyph, name, code}], selected, pro}
  function _ifrPickerHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var sel = null;
    var rows = (m.certs || []).map(function (c) {
      var on = c.id === m.selected; if (on) sel = c;
      return '<button type="button" class="ifr-cert' + (on ? ' sel' : '') + '" data-act="cert" data-id="' + e(c.id) + '" aria-pressed="' + on + '">' +
        '<span class="ifr-mark">' + e(c.glyph) + '</span><span class="ifr-meta"><span class="ifr-nm">' + e(c.name) + '</span><span class="ifr-cd">' + e(c.code) + '</span></span>' +
        '<span class="ifr-pick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg></span></button>';
    }).join('');
    var name = sel ? e(sel.name) : '';
    var note = m.pro ? 'Pro covers <b>every exam</b>. Start with the one you’re sitting next.'
      : 'Free covers <b>one full exam</b>. Focusing on one is the fastest way to pass, so start with the exam you’re sitting next. You can add the rest with Pro.';
    return '<div class="ifr-picker">' +
      '<div class="ifr-hdr"><h1>Pick your exam</h1><span class="ifr-tag">' + (m.pro ? 'Pro' : 'Free') + '</span></div>' +
      '<div class="ifr-pnote"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><p>' + note + '</p></div>' +
      '<div class="ifr-body"><div class="ifr-sect">Choose one to study</div>' + rows + '</div>' +
      '<div class="ifr-foot"><button type="button" class="ifr-btn" data-act="' + (m.pro ? 'start' : 'lock') + '">' + (m.pro ? 'Start with ' : 'Lock in ') + name + '</button>' +
        '<p class="ifr-foot-hint">' + (m.pro ? 'You can add the others any time from Switch cert in Settings.' : 'You can change your mind right up until you lock in.') + '</p></div>' +
    '</div>';
  }

  // m = {name}
  function _ifrLockSheetHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var n = e(m.name);
    return '<div class="ist-grab"></div>' +
      '<div class="ifr-sheet-head"><span class="ifr-sheet-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span><h2 id="ist-sheet-title">Lock in ' + n + '?</h2></div>' +
      '<p class="ifr-sheet-intro">Free is built around one exam, so make sure ' + n + ' is the one you want to focus on first.</p>' +
      '<ul class="ifr-terms">' +
        '<li><span class="ifr-ti"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span><div><div class="ifr-tt">One exam, your full focus</div><div class="ifr-ts">You’re choosing <b>' + n + '</b> as your exam. Free stays on this one. Adding or switching comes with Pro.</div></div></li>' +
        '<li><span class="ifr-ti"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg></span><div><div class="ifr-tt">20 questions a day</div><div class="ifr-ts"><b>15 new practice</b> questions plus <b>5 Daily Review</b> cards.</div></div></li>' +
        '<li><span class="ifr-ti"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/></svg></span><div><div class="ifr-tt">A fresh set each morning</div><div class="ifr-ts">Your streak and progress are always yours. A new 20 unlocks every day.</div></div></li>' +
      '</ul>' +
      '<div class="ifr-sheet-actions"><button type="button" class="ifr-btn" data-act="lock-go">Lock in ' + n + '</button><button type="button" class="ifr-ghost" data-act="lock-back">Go back</button></div>';
  }

  function _ifrRestoreHtml() {
    return '<div class="ifr-restore" aria-label="Picking up where you left off">' +
      '<div class="ifr-skb"><div class="ifr-skb-top"><span class="ifr-sk ifr-sk-mark"></span><span class="ifr-sk-stack"><span class="ifr-sk" style="width:96px"></span><span class="ifr-sk sm" style="width:60px"></span></span><span class="ifr-sk ifr-sk-plan"></span></div>' +
        '<div class="ifr-skb-row"><span class="ifr-sk" style="width:104px"></span><span class="ifr-sk sm" style="width:64px"></span></div>' +
        '<div class="ifr-skb-row"><span class="ifr-sk" style="width:88px"></span><span class="ifr-sk sm" style="width:108px"></span></div></div>' +
      '<div class="ifr-skcard"><div class="ifr-skb-top"><span class="ifr-sk ifr-sk-ring"></span><span class="ifr-sk-stack"><span class="ifr-sk lg" style="width:120px"></span><span class="ifr-sk sm" style="width:170px"></span></span></div><span class="ifr-sk ifr-sk-btn"></span></div>' +
      '<div class="ifr-sk-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/></svg><span>Picking up where you left off</span></div>' +
    '</div>';
  }

  window._ifrState = _ifrState; window._ifrScale = _ifrScale;
  window._ifrDay0Html = _ifrDay0Html; window._ifrCappedHtml = _ifrCappedHtml;
  window._ifrCheckHtml = _ifrCheckHtml; window._ifrScoreHtml = _ifrScoreHtml;
  window._ifrLimitHtml = _ifrLimitHtml; window._ifrOfflineHtml = _ifrOfflineHtml;
  window._ifrPickerHtml = _ifrPickerHtml; window._ifrLockSheetHtml = _ifrLockSheetHtml;
  window._ifrRestoreHtml = _ifrRestoreHtml;

  var PHONE = '(max-width: 899px)';
  var IFR = window.iosFirstRun = window.iosFirstRun || {};
  IFR.isPhone = function () { try { return window.matchMedia(PHONE).matches; } catch (_) { return false; } };
  function html() { return document.documentElement; }
  function readJSON(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }
  function certId() { return (typeof CURRENT_CERT === 'string' && CURRENT_CERT) || window.CURRENT_CERT || 'netplus'; }
  var MARKS = { netplus: 'N+', secplus: 'S+', 'aplus-core1': 'A+', 'aplus-core2': 'A+', az900: 'AZ', ai900: 'AI', sc900: 'SC', clfc02: 'CLF' };
  function packMeta() { var p = (typeof CERT_PACK === 'object' && CERT_PACK) || window.CERT_PACK; return (p && p.meta) || {}; }
  // Same labels as Home (ios-home.js): vendor prefix dropped, the pack's code.
  function certInfo(id) {
    id = id || certId();
    var packs = window.CERT_PACKS || {}, meta = (packs[id] && packs[id].meta) || (id === certId() ? packMeta() : {});
    return { id: id, glyph: MARKS[id] || 'CA', name: String(meta.name || id).replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''), code: meta.code || '' };
  }
  function scale() { return _ifrScale(packMeta()); }
  function isPro() { var q = window._quotaState; return !!(q && q.tier === 'pro'); }
  function remaining() { try { return typeof _quotaRemainingToday === 'function' ? _quotaRemainingToday() : Infinity; } catch (_) { return Infinity; } }
  function state() {
    var hist = readJSON(STORAGE.HISTORY, []), split = typeof isHistorySplitRow === 'function' ? isHistorySplitRow : function () { return false; };
    var snaps = readJSON(STORAGE.READINESS_SNAPSHOTS, {}) || {};
    return _ifrState({
      cert: certId(), historyRows: (Array.isArray(hist) ? hist : []).filter(function (r) { return !split(r); }).length,
      snapshot: snaps[certId()] != null ? snaps[certId()] : null, skipped: !!localStorage.getItem(STORAGE.ONB_SKIPS),
      pro: isPro(), signedIn: window._certanvilSignedIn === true, remaining: remaining()
    });
  }
  // 'day0' | 'capped' | null (today's Home)
  IFR.homeState = function () {
    if (!IFR.isPhone()) return null;
    var st = state();
    return st.day0 ? 'day0' : (st.capped ? 'capped' : null);
  };
  IFR.recordSkip = function () {
    try {
      localStorage.setItem(STORAGE.ONB_SKIPS, JSON.stringify({ at: Date.now() }));
      if (window.cloudStore && window.cloudStore.flush) window.cloudStore.flush(STORAGE.ONB_SKIPS);
    } catch (_) {}
  };
  function goPro() { window.open('https://certanvil.com/pricing', '_blank', 'noopener'); }
  // Free "Start today's 15": a Mixed set of what is left today (the daily-limit screen's start-smaller logic).
  function startToday() {
    IFR.recordSkip();
    if (isPro()) { var t = document.getElementById('primaryLaunch'); if (t) t.click(); return; }
    var r = remaining();
    if (r <= 0) { if (typeof _showQuotaExceededUI === 'function') _showQuotaExceededUI({}); return; }
    topic = (typeof MIXED_TOPIC === 'string') ? MIXED_TOPIC : 'Mixed';
    qCount = Math.min(15, isFinite(r) ? r : 15);
    document.querySelectorAll('#topic-group .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === topic); });
    document.querySelectorAll('#count-group .chip').forEach(function (c) { c.classList.toggle('on', Number(c.dataset.v) === qCount); });
    if (typeof startQuiz === 'function') startQuiz();
  }
  // Called first by renderIosHome on phones. Returns true when it drew day-0 or capped Home.
  IFR.renderHome = function (root) {
    var st = IFR.homeState();
    html().classList.toggle('ifr-day0', st === 'day0');
    if (!st) return false;
    var c = certInfo();
    if (st === 'day0') root.innerHTML = _ifrDay0Html({ cert: c, pro: isPro(), remaining: remaining(), scale: scale() });
    else {
      var plan = typeof window.getSrTodayPlan === 'function' ? window.getSrTodayPlan() : { todo: 0 };
      root.innerHTML = _ifrCappedHtml({ cert: c, due: plan.todo || 0, hours: state().hoursToReset });
    }
    var ACT = {
      check: function () { if (IFR.startCheck) IFR.startCheck(); },
      today: startToday,
      review: function () { if (typeof window.startSrReview === 'function') window.startSrReview(); },
      gopro: goPro
    };
    root.querySelectorAll('[data-act]').forEach(function (el) {
      var f = ACT[el.getAttribute('data-act')];
      if (f) el.addEventListener('click', function () { try { f(); } catch (_) {} });
    });
    return true;
  };
  IFR.clearPhoneState = function () { ['ifr-day0', 'ifr-check', 'ifr-offline'].forEach(function (k) { html().classList.remove(k); }); };

  // ios-home.js loads (and draws Home) before this file, so repaint once now that day-0 / capped can be chosen.
  function boot() { var p = document.getElementById('page-setup'); if (IFR.isPhone() && typeof renderIosHome === 'function' && (!p || p.classList.contains('active'))) renderIosHome(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
