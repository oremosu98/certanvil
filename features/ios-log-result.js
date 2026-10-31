// features/ios-log-result.js: persona bundle Task 11: "How did your exam go?" as one flow.
// The June "Log your result" screen (mockups/cert-ios-log-result.html) lifted to phone width, plus the
// outcome store behind it. Spec: docs/superpowers/specs/2026-10-30-exam-outcome-design.md
// Home (features/ios-home.js) calls outcomeDue / openLogResult behind typeof guards and reads the saved
// outcome straight from localStorage 'nplus_exam_outcomes' for the Passed badge and the nextcert card.
(function () {
  'use strict';

  var MQ = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
  function isPhone() { return !!(MQ && MQ.matches); }

  // ── Pure models (UAT vm-testable; no DOM, no storage) ──
  // Due from the day AFTER the exam date (local day). Nothing saved: due. A 'failed' record asks again once a LATER
  // exam date has passed (a re-sit); a 'passed' record never asks again.
  function _examOutcomeDue(examDate, rec, today) {
    if (!examDate || !today || !(String(examDate) < String(today))) return false;
    if (!rec) return true;
    return rec.outcome === 'failed' && String(examDate) > String(rec.date || '');   // YYYY-MM-DD strings compare as dates
  }
  // Score is optional either way; when given it must be a whole number on the cert's own scale.
  function _examScoreCheck(raw, min, max) {
    var s = raw === null || raw === undefined ? '' : String(raw).trim();
    if (s === '') return { ok: true, score: null };
    var n = Number(s);
    if (!isFinite(n) || Math.floor(n) !== n || n < min || n > max) return { ok: false, error: 'Scores run from ' + min + ' to ' + max + '.' };
    return { ok: true, score: n };
  }
  // The readiness the app showed for the cert (the snapshot), else the live score when it is the current cert.
  function _examPredicted(snaps, certId, liveScore) {
    var s = snaps && snaps[certId];
    if (s && typeof s.score === 'number') return s.score;
    return typeof liveScore === 'number' ? liveScore : null;
  }

  // ── Storage helpers ──
  function _readOutcomes() {
    try { var m = JSON.parse(localStorage.getItem(STORAGE.EXAM_OUTCOMES) || '{}'); return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {}; }
    catch (_) { return {}; }
  }
  function _certId() { return (typeof CURRENT_CERT === 'string' && CURRENT_CERT) || 'netplus'; }
  function _meta() { return (typeof CERT_PACK !== 'undefined' && CERT_PACK && CERT_PACK.meta) || {}; }
  // the short name Home shows: "Network+", not "CompTIA Network+"
  function _certName() { return String(_meta().name || '').replace(/^(CompTIA|Microsoft|Amazon|AWS)\s+/, ''); }
  function _scale() {
    return { min: typeof EXAM_MIN_SCORE === 'number' ? EXAM_MIN_SCORE : 100, max: typeof EXAM_MAX_SCORE === 'number' ? EXAM_MAX_SCORE : 900,
      pass: typeof EXAM_PASS_SCORE === 'number' ? EXAM_PASS_SCORE : 720 };
  }
  function _today() { return typeof window._localDay === 'function' ? window._localDay() : new Date().toISOString().slice(0, 10); }

  function outcomeDue(certId) {
    var cert = certId || _certId();
    var examDate = null;
    try { examDate = typeof getExamDate === 'function' ? getExamDate(cert) : null; } catch (_) { examDate = null; }
    return _examOutcomeDue(examDate, _readOutcomes()[cert] || null, _today());
  }

  // Validates and writes EXAM_OUTCOMES[CURRENT_CERT]. Returns {ok:true, rec, first} or {ok:false, error}.
  function saveExamOutcome(o) {
    o = o || {};
    var cert = _certId(), sc = _scale();
    if (o.outcome !== 'passed' && o.outcome !== 'failed') return { ok: false, error: 'Pick how it went.' };
    var chk = _examScoreCheck(o.score, sc.min, sc.max);
    if (!chk.ok) return chk;
    var date = o.date ? String(o.date) : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > _today()) return { ok: false, error: 'Pick the day you sat it.' };
    var snaps = {};
    try { snaps = JSON.parse(localStorage.getItem(STORAGE.READINESS_SNAPSHOTS) || '{}') || {}; } catch (_) { snaps = {}; }
    var live = null;
    try { var r = typeof getReadinessScore === 'function' ? getReadinessScore() : null; live = r && typeof r.predicted === 'number' ? r.predicted : null; } catch (_) { live = null; }
    var map = _readOutcomes(), prev = map[cert] || null;
    var rec = { outcome: o.outcome, score: chk.score, date: date, predicted: _examPredicted(snaps, cert, live), at: new Date().toISOString() };
    map[cert] = rec;
    try { localStorage.setItem(STORAGE.EXAM_OUTCOMES, JSON.stringify(map)); } catch (_) { return { ok: false, error: "Couldn't save that. Try again." }; }
    try { if (typeof _cloudFlush === 'function') _cloudFlush(STORAGE.EXAM_OUTCOMES); } catch (_) {}
    var first = o.outcome === 'passed' && !(prev && prev.outcome === 'passed');
    if (first) _passToast();
    try { if (typeof renderIosHome === 'function') renderIosHome(); } catch (_) {}
    return { ok: true, rec: rec, first: first };
  }

  // The one-time celebration (drawing cert-ios-home.html #passToast).
  function _passToast() {
    var host = document.body;
    if (!host) return;
    var t = document.createElement('div');
    t.className = 'il-toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span class="il-toast-i"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg></span><span class="il-toast-t"></span>';
    var txt = t.querySelector('.il-toast-t');
    txt.appendChild(document.createTextNode('You passed '));
    var b = document.createElement('b'); b.textContent = _certName() || 'your cert'; txt.appendChild(b);
    txt.appendChild(document.createTextNode('. Well done.'));
    host.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('il-in'); }); });
    setTimeout(function () { t.classList.remove('il-in'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400); }, 4200);
  }

  // ── View ──
  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function _longDate(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  var _outcome = 'passed';
  var MARKS = { netplus: 'N+', secplus: 'S+', 'aplus-core1': 'A+', 'aplus-core2': 'A+', az900: 'AZ', ai900: 'AI', sc900: 'SC', clfc02: 'CLF' };

  function _html(m) {
    var moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>';
    return '<div class="il-hdr"><button class="il-back" type="button" data-act="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg></button>'
      + '<h1 class="il-h1" tabindex="-1">Log your result</h1>'
      + '<button class="il-theme" type="button" data-act="theme" aria-label="Switch between light and dark">' + moon + '</button></div>'
      + '<div class="il-body">'
      + '<div class="il-cert il-rv" style="--d:0"><span class="il-gl">' + _esc(m.mark) + '</span><div><b>' + _esc(m.name) + '</b><span>' + _esc(m.code) + ' · your active cert</span></div></div>'
      + '<p class="il-lede il-rv" style="--d:1">Sat the exam? Add your result. A pass marks the cert as passed in your hub.</p>'
      + '<div class="il-field il-rv" style="--d:2"><label id="il-lab-oc">How did it go?</label>'
      + '<div class="il-seg" role="radiogroup" aria-labelledby="il-lab-oc">'
      + '<button type="button" role="radio" data-act="pick" data-v="passed" aria-checked="false">Passed</button>'
      + '<button type="button" role="radio" data-act="pick" data-v="failed" aria-checked="false">Didn\'t pass</button></div></div>'
      + '<div class="il-field il-rv" style="--d:3"><label for="il-score">Your score, if you have it</label>'
      + '<div class="il-score-wrap"><div class="il-score-box"><input id="il-score" type="text" inputmode="numeric" autocomplete="off" value="' + _esc(m.score) + '" aria-describedby="il-help" />'
      + '<span class="il-of">&nbsp;/ ' + _esc(m.max) + '</span></div>'
      + '<span class="il-passline">pass mark<b>' + _esc(m.pass) + '</b></span></div>'
      + '<p class="il-help" id="il-help">' + _esc(m.name) + ' is scored from ' + _esc(m.min) + ' to ' + _esc(m.max) + '. ' + _esc(m.pass) + ' is a pass.</p>'
      + '<p class="il-err" id="il-err" role="alert" hidden></p></div>'
      + '<div class="il-field il-rv" style="--d:4"><label for="il-date">Date taken</label><input class="il-inp" id="il-date" type="date" value="' + _esc(m.date) + '" max="' + _esc(m.today) + '" /></div>'
      + '</div>'
      + '<div class="il-footer"><button class="il-cta" type="button" data-act="save" id="il-save">Save result</button><p class="il-foot-note" id="il-note"></p></div>'
      + '<div class="il-done" id="il-done" aria-live="polite"><div class="il-seal"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg></div>'
      + '<h2 id="il-done-t"></h2><p id="il-done-l"></p><p class="il-big" id="il-done-b"></p>'
      + '<button class="il-cta" type="button" id="il-done-go" data-act="done-go"></button><button class="il-restart" type="button" id="il-done-alt" data-act="done-alt"></button></div>';
  }

  function _setOutcome(v) {
    _outcome = v;
    var root = document.getElementById('ios-log-result'); if (!root) return;
    [].forEach.call(root.querySelectorAll('.il-seg button'), function (b) {
      var on = b.getAttribute('data-v') === v; b.classList.toggle('il-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    var save = root.querySelector('#il-save'), note = root.querySelector('#il-note');
    // the score stays optional either way; only the button and the note change
    save.textContent = v === 'passed' ? 'Save result' : 'Save and keep studying';
    note.textContent = v === 'passed' ? 'This updates your hub. You can edit it later in the cert menu.' : 'Your progress is all still here.';
  }

  var _prevFocus = null, _host = null, _inerted = [];
  function _inertBehind(on) {
    if (on) {
      [].forEach.call(document.body.children, function (el) {
        if (el === _host || (el.classList && el.classList.contains('il-toast')) || el.inert) return;
        el.inert = true; _inerted.push(el);
      });
    } else { _inerted.forEach(function (el) { el.inert = false; }); _inerted = []; }
  }
  function _inertForm(root, on) {
    [].forEach.call(root.querySelectorAll('.il-hdr, .il-body, .il-footer'), function (el) { el.inert = on; });
  }
  function _ensureHost() {
    if (_host && document.body.contains(_host)) return _host;
    _host = document.getElementById('ios-log-result');
    if (!_host) { _host = document.createElement('section'); _host.id = 'ios-log-result'; _host.hidden = true; document.body.appendChild(_host); }
    _host.setAttribute('role', 'dialog'); _host.setAttribute('aria-modal', 'true'); _host.setAttribute('aria-label', 'Log your result');
    return _host;
  }
  function _close() {
    var root = document.getElementById('ios-log-result'); if (!root) return;
    root.hidden = true; root.innerHTML = ''; _inertBehind(false);
    if (_prevFocus && _prevFocus.focus) { try { _prevFocus.focus(); } catch (_) {} }
    _prevFocus = null;
  }
  function _toSettingsExamSheet() {
    var tab = document.querySelector('.lift-tab[data-page="settings"]');
    if (tab) tab.click(); else if (typeof showPage === 'function') showPage('settings');
    var on = window.iosSettings && window.iosSettings._on;
    if (on && typeof on.exam === 'function') on.exam();
  }

  function _showDone(rec) {
    var root = document.getElementById('ios-log-result'), name = _certName() || 'Your cert', sc = _scale();
    var t = root.querySelector('#il-done-t'), l = root.querySelector('#il-done-l'), b = root.querySelector('#il-done-b');
    var go = root.querySelector('#il-done-go'), alt = root.querySelector('#il-done-alt'), seal = root.querySelector('.il-seal');
    var when = _longDate(rec.date);
    if (rec.outcome === 'passed') {
      t.textContent = name + ' is passed'; l.textContent = 'Logged to your hub.';
      b.hidden = false; b.textContent = (rec.score != null ? rec.score + ' / ' + sc.max : 'No score logged') + (when ? ' · ' + when : '');
      go.textContent = 'See it in your hub'; alt.textContent = 'Edit the result'; seal.hidden = false;
      root.setAttribute('data-end', 'passed');
    } else {   // a fail is met kindly and points at the next attempt
      t.textContent = "That's a hard exam."; l.textContent = 'Your progress is all still here. Pick a new date when you’re ready.';
      b.hidden = rec.score == null; b.textContent = rec.score != null ? rec.score + ' / ' + sc.max + ' · logged' : '';
      go.textContent = 'Set a new date'; alt.textContent = 'Not now'; seal.hidden = true;
      root.setAttribute('data-end', 'failed');
    }
    root.querySelector('#il-done').classList.add('il-show');
    _inertForm(root, true);
    go.focus();
  }

  function openLogResult(opts) {
    if (!isPhone()) return false;
    opts = opts || {};
    var cert = _certId(), meta = _meta(), sc = _scale(), today = _today();
    var prev = _readOutcomes()[cert] || null;
    var examDate = null;
    try { examDate = typeof getExamDate === 'function' ? getExamDate(cert) : null; } catch (_) { examDate = null; }
    var date = (prev && prev.date) || examDate || today;
    if (date > today) date = today;   // a result can't be from the future
    var name = _certName() || 'Your cert';
    var m = { name: name, code: meta.code || '', mark: MARKS[cert] || 'CA',
      min: sc.min, max: sc.max, pass: sc.pass, date: date, today: today, score: prev && typeof prev.score === 'number' ? prev.score : '' };
    var root = _ensureHost();
    _prevFocus = document.activeElement;
    root.innerHTML = _html(m);
    root.hidden = false;
    _inertBehind(true);
    _setOutcome(opts.preselect === 'failed' ? 'failed' : opts.preselect === 'passed' ? 'passed' : (prev && prev.outcome) || 'passed');
    root.onclick = function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'back') _close();
      else if (act === 'theme') { if (typeof toggleTheme === 'function') toggleTheme(); }
      else if (act === 'pick') _setOutcome(b.getAttribute('data-v'));
      else if (act === 'save') {
        var err = root.querySelector('#il-err'), inp = root.querySelector('#il-score');
        var res = saveExamOutcome({ outcome: _outcome, score: inp.value, date: root.querySelector('#il-date').value });
        if (!res.ok) { err.textContent = res.error; err.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
        err.hidden = true; inp.removeAttribute('aria-invalid');
        _showDone(res.rec);
      } else if (act === 'done-go') {
        var failed = root.getAttribute('data-end') === 'failed';
        _close();
        if (failed) _toSettingsExamSheet(); else if (typeof openHub === 'function') openHub();
      } else if (act === 'done-alt') {
        if (root.getAttribute('data-end') === 'failed') _close();
        else { root.querySelector('#il-done').classList.remove('il-show'); _inertForm(root, false); root.querySelector('.il-h1').focus(); }
      }
    };
    root.oninput = function (ev) { if (ev.target && ev.target.id === 'il-score') { var e = root.querySelector('#il-err'); e.hidden = true; ev.target.removeAttribute('aria-invalid'); } };
    root.onkeydown = function (ev) { if (ev.key === 'Escape') _close(); };
    var h = root.querySelector('.il-h1'); if (h) h.focus();
    return true;
  }

  window.outcomeDue = outcomeDue;
  window.openLogResult = openLogResult;
  window.saveExamOutcome = saveExamOutcome;
  window.iosLogResult = { close: _close };
})();
