// Persona bundle Task 14: "Suggest a cert". Shared pieces: the key normaliser (the admin page reuses it), the vendor
// list the sheet shows, the sheet's pure row model, and the send/queue logic. Spec: 2026-10-30-ai-budget-fast-start-suggest-design.md §3.
// Table: cert_requests(user_id, exam_key, label, typed). The database wants exam_key lowercase and trimmed, 1-80 chars,
// and label 1-120 chars, so everything here produces keys in that shape.
(function () {
  var QUEUE_KEY = 'nplus_cert_req_pending';
  var KEY_MAX = 80, LABEL_MAX = 120;
  var VENDOR_RE = /^(cisco|comptia|aws|amazon|microsoft|google|isc2)\s+/;
  var WORD_RE = /\b(certification|exam|cert)\b/g;

  // "Cisco CCNA" -> "ccna"; "ITIL4 Foundation" -> "itil4 foundation"; "  Sec+ " -> "sec+".
  // Always lowercase, trimmed, single-spaced, at most KEY_MAX characters. '' means "nothing usable".
  function _normCertRequest(s) {
    var base = String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
    var t = base.replace(VENDOR_RE, '').replace(WORD_RE, ' ').replace(/\s+/g, ' ').trim();
    if (!t) t = base;   // "Cisco exam" must not collapse to nothing
    return t.slice(0, KEY_MAX).trim();
  }
  // What the founder reads: the words the person used, tidied and clipped.
  function _certReqLabel(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, LABEL_MAX).trim(); }

  // [vendor, [[badge, name, code], ...]]: the drawing's list, verbatim.
  var VENDORS = [
    ['Cisco', [['CC', 'CCNA', '200-301']]],
    ['CompTIA', [['CY', 'CySA+', 'CS0-003'], ['PT', 'PenTest+', 'PT0-003'], ['L+', 'Linux+', 'XK0-005']]],
    ['AWS', [['SA', 'Solutions Architect Associate', 'SAA-C03']]],
    ['Microsoft', [['AZ', 'Azure Administrator', 'AZ-104']]],
    ['ISC2', [['CI', 'CISSP', 'CISSP']]],
    ['Google Cloud', [['GC', 'Associate Cloud Engineer', 'ACE']]]
  ];
  function _certReqKnown(name) {
    for (var i = 0; i < VENDORS.length; i++) for (var j = 0; j < VENDORS[i][1].length; j++) if (VENDORS[i][1][j][1] === name) return VENDORS[i][1][j];
    return null;
  }
  function _certReqGlyph(name) { var c = _certReqKnown(name); return c ? c[0] : String(name || '').slice(0, 2).toUpperCase(); }

  // The sheet's rows for a search box and a set of picks. picks = array of picked names, in the order picked.
  // Returns {groups: [{vendor, rows: [{badge, name, code, on}]}], typed: {label, on}|null, mine: [{label}], else: bool}
  //  - typed: whatever is typed, unless it exactly matches a listed exam (by name or code, vendor prefix ignored)
  //  - mine: picked typed exams, kept visible as "Your suggestion" (the one being typed shows as `typed` instead)
  //  - else: the permanent "Something else?" row (only while the box is empty)
  function _certReqRows(query, picks) {
    var q = String(query == null ? '' : query).replace(/\s+/g, ' ').trim(), ql = q.toLowerCase(), qk = _normCertRequest(q);
    var picked = {}; (picks || []).forEach(function (n) { picked[n] = 1; });
    var groups = [], exact = false;
    VENDORS.forEach(function (v) {
      var rows = [];
      v[1].forEach(function (c) {
        var hay = (v[0] + ' ' + c[1] + ' ' + c[2]).toLowerCase();
        if (q && (_normCertRequest(c[1]) === qk || c[2].toLowerCase() === ql)) exact = true;
        if (!q || hay.indexOf(ql) >= 0) rows.push({ badge: c[0], name: c[1], code: c[2], on: !!picked[c[1]] });
      });
      if (rows.length) groups.push({ vendor: v[0], rows: rows });
    });
    var label = _certReqLabel(q);
    var typed = (label && _normCertRequest(label) && !exact) ? { label: label, on: !!picked[label] } : null;
    var mine = (picks || []).filter(function (n) { return !_certReqKnown(n) && !(typed && n === typed.label); }).map(function (n) { return { label: n }; });
    return { groups: groups, typed: typed, mine: mine, else: !q };
  }
  function _certReqSendText(n) { return n > 0 ? 'Send ' + n + ' suggestion' + (n === 1 ? '' : 's') : 'Pick at least one'; }

  // ── pending queue (the user's own unsent suggestions; retried when Home is next shown) ──
  function _qRead() {
    try { var a = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); return Array.isArray(a) ? a.filter(function (e) { return e && e.u && e.label; }) : []; } catch (_) { return []; }
  }
  function _qWrite(a) { try { if (a.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(a)); else localStorage.removeItem(QUEUE_KEY); } catch (_) {} }
  function _qAdd(uid, labels) {
    if (!uid || !labels.length) return;
    var q = _qRead(), seen = {};
    q.forEach(function (e) { seen[e.u + '|' + _normCertRequest(e.label)] = 1; });
    labels.forEach(function (l) { var k = uid + '|' + _normCertRequest(l); if (!seen[k]) { seen[k] = 1; q.push({ u: uid, label: l }); } });
    _qWrite(q);
  }

  function _uid() {
    var sb = window.certanvilSupabase;
    if (!sb || !sb.auth || typeof sb.auth.getSession !== 'function') return Promise.resolve(null);
    return Promise.resolve(sb.auth.getSession()).then(function (r) { return (r && r.data && r.data.session && r.data.session.user && r.data.session.user.id) || null; }, function () { return null; });
  }
  // A repeat vote is a success. A missing table (founder has not pasted the migration yet) is a failure that queues.
  function _isDuplicate(err) { return !!err && (err.code === '23505' || err.status === 409 || err.statusCode === 409); }

  // labels -> Promise<{ok, failed: string[]}>. Failed ones are queued for the next ca:home-shown.
  function sendCertRequests(labels) {
    var clean = [], seen = {};
    (labels || []).forEach(function (l) {
      var label = _certReqLabel(l), key = _normCertRequest(label);
      if (!label || !key || seen[key]) return;
      seen[key] = 1; clean.push({ label: label, key: key });
    });
    if (!clean.length) return Promise.resolve({ ok: true, failed: [] });
    var all = clean.map(function (c) { return c.label; });
    return _uid().then(function (uid) {
      var sb = window.certanvilSupabase;
      if (!uid || !sb || typeof sb.from !== 'function') { return { ok: false, failed: all, uid: uid }; }
      var rows = clean.map(function (c) { return { user_id: uid, exam_key: c.key, label: c.label, typed: !_certReqKnown(c.label) }; });
      return Promise.resolve(sb.from('cert_requests').upsert(rows, { onConflict: 'user_id,exam_key', ignoreDuplicates: true })).then(function (res) {
        var err = res && res.error;
        if (!err || _isDuplicate(err)) return { ok: true, failed: [], uid: uid };
        return { ok: false, failed: all, uid: uid };   // 404 / 42P01 / network / anything else: keep them
      }, function () { return { ok: false, failed: all, uid: uid }; });
    }).then(function (r) {
      if (r.failed.length) {
        if (r.uid) _qAdd(r.uid, r.failed);
        else _qAdd(_lastUid, r.failed);
      }
      if (r.uid) _lastUid = r.uid;
      return { ok: r.failed.length === 0, failed: r.failed };
    });
  }
  var _lastUid = null, _retrying = false;
  // Called on every ca:home-shown: send this person's queued suggestions again.
  function retryCertRequests() {
    if (_retrying) return Promise.resolve();
    var q = _qRead(); if (!q.length) return Promise.resolve();
    _retrying = true;
    return _uid().then(function (uid) {
      if (!uid) return;
      var mine = q.filter(function (e) { return e.u === uid; });
      if (!mine.length) return;
      _qWrite(_qRead().filter(function (e) { return e.u !== uid; }));   // sendCertRequests re-queues whatever fails again
      return sendCertRequests(mine.map(function (e) { return e.label; }));
    }).then(function () { _retrying = false; }, function () { _retrying = false; });
  }
  try { window.addEventListener('ca:home-shown', function () { retryCertRequests(); }); } catch (_) {}

  window._normCertRequest = _normCertRequest;
  window._certReqLabel = _certReqLabel;
  window._certReqRows = _certReqRows;
  window._certReqSendText = _certReqSendText;
  window._certReqGlyph = _certReqGlyph;
  window.sendCertRequests = sendCertRequests;
  window.retryCertRequests = retryCertRequests;
  window.CERT_REQ_QUEUE_KEY = QUEUE_KEY;
})();
