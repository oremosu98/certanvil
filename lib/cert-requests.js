// Persona bundle Task 14: "Suggest a cert". Shared pieces: the key normaliser (the admin page reuses it), the vendor
// list the sheet shows, the sheet's pure row model, and the send/queue logic. Spec: 2026-10-30-ai-budget-fast-start-suggest-design.md §3.
// Table: cert_requests(user_id, exam_key, label, typed). The database wants exam_key lowercase and trimmed, 1-80 chars,
// and label 1-120 chars, so everything here produces keys in that shape.
(function () {
  var QUEUE_KEY = 'nplus_cert_req_pending', RETRY_KEY = 'nplus_cert_req_retry_at';
  var KEY_MAX = 80, LABEL_MAX = 120, BACKOFF_MS = 10 * 60 * 1000;
  var VENDOR_RE = /^(google cloud|cisco|comptia|aws|amazon|microsoft|google|isc2)(\s+|$)/;
  var WORD_RE = /\b(certification|exam|cert)\b/g;
  // Cap by code points, never UTF-16 units: the database counts characters, and a cut must not split a surrogate pair.
  function _cp(s, n) { return Array.from(String(s)).slice(0, n).join(''); }

  // "Cisco CCNA" -> "ccna"; "ITIL4 Foundation" -> "itil4 foundation"; "  Sec+ " -> "sec+".
  // Always lowercase, trimmed, single-spaced, at most KEY_MAX characters. '' means "nothing usable" (empty, or only a vendor / filler word).
  function _normCertRequest(s) {
    var base = String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
    var t = base.replace(VENDOR_RE, '').replace(WORD_RE, ' ').replace(/\s+/g, ' ').trim();
    return _cp(t, KEY_MAX).trim();
  }
  // What the founder reads: the words the person used, tidied and clipped.
  function _certReqLabel(s) { return _cp(String(s == null ? '' : s).replace(/\s+/g, ' ').trim(), LABEL_MAX).trim(); }

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
  function _certReqIsListed(label) {
    var k = _normCertRequest(label); if (!k) return false;
    for (var i = 0; i < VENDORS.length; i++) for (var j = 0; j < VENDORS[i][1].length; j++) if (_normCertRequest(VENDORS[i][1][j][1]) === k) return true;
    return false;
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

  // ── pending queue (the user's own unsent suggestions; retried when Home is next shown, at most every 10 minutes) ──
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
  function _qRemove(e) {   // only after a confirmed send (or a permanent refusal)
    var k = e.u + '|' + _normCertRequest(e.label);
    _qWrite(_qRead().filter(function (x) { return x.u + '|' + _normCertRequest(x.label) !== k; }));
  }

  // The signed-in user id, or null. Undefined auth is "not signed in".
  function certReqUid() {
    var sb = window.certanvilSupabase;
    if (!sb || !sb.auth || typeof sb.auth.getSession !== 'function') return Promise.resolve(null);
    return Promise.resolve().then(function () { return sb.auth.getSession(); }).then(function (r) { return (r && r.data && r.data.session && r.data.session.user && r.data.session.user.id) || null; }, function () { return null; });
  }
  // 'ok' (stored, or already there), 'retry' (try again later: network, 5xx, 401, table not there yet), 'perm' (will never work: 400, 403, CHECK, FK).
  function _classify(err, status) {
    if (!err) return 'ok';
    if (err.code === '23505') return 'ok';   // only a unique violation is a repeat vote
    var st = Number(status || err.status || err.statusCode) || 0, msg = String(err.message || '');
    if (st >= 500 || st === 401 || st === 404) return 'retry';
    if (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(msg)) return 'retry';
    if (!st && !err.code) return 'retry';   // supabase-js reports a dropped connection as a message with no code or status
    return 'perm';
  }
  function _row(uid, label) { return { user_id: uid, exam_key: _normCertRequest(label), label: _certReqLabel(label), typed: !_certReqIsListed(label) }; }
  function _post(uid, rows) {
    return Promise.resolve().then(function () {
      var sb = window.certanvilSupabase;
      return sb.from('cert_requests').upsert(rows, { onConflict: 'user_id,exam_key', ignoreDuplicates: true });
    }).then(function (res) { return _classify(res && res.error, res && res.status); }, function () { return 'retry'; });
  }

  // labels -> Promise<{ok, failed, accepted, queued, dropped, noUser}>.
  //  accepted = stored now or queued for later (safe to say thanks for); failed = not stored yet; dropped = refused for good.
  function sendCertRequests(labels) {
    var clean = [], seen = {};
    (labels || []).forEach(function (l) {
      var label = _certReqLabel(l), key = _normCertRequest(label);
      if (!label || !key || seen[key]) return;
      seen[key] = 1; clean.push(label);
    });
    var none = { ok: true, failed: [], accepted: [], queued: false, dropped: [] };
    if (!clean.length) return Promise.resolve(none);
    return certReqUid().then(function (uid) {
      var sb = window.certanvilSupabase;
      if (!uid || !sb || typeof sb.from !== 'function') return { ok: false, failed: clean, accepted: [], queued: false, dropped: [], noUser: true };   // nothing to attribute a queue entry to
      return _post(uid, clean.map(function (l) { return _row(uid, l); })).then(function (kind) {
        if (kind === 'perm' && clean.length > 1) {   // one bad label must not sink the others
          return Promise.all(clean.map(function (l) { return _post(uid, [_row(uid, l)]); }));
        }
        return clean.map(function () { return kind; });
      }).then(function (kinds) {
        var accepted = [], failed = [], queue = [], dropped = [];
        clean.forEach(function (l, i) {
          if (kinds[i] === 'ok') accepted.push(l);
          else if (kinds[i] === 'retry') { accepted.push(l); failed.push(l); queue.push(l); }
          else { failed.push(l); dropped.push(l); }
        });
        _qAdd(uid, queue);
        return { ok: !failed.length, failed: failed, accepted: accepted, queued: queue.length > 0, dropped: dropped };
      });
    });
  }
  var _retrying = false;
  // Called on every ca:home-shown, but runs at most once per BACKOFF_MS (force skips the wait).
  function retryCertRequests(force) {
    if (_retrying) return Promise.resolve();
    var q = _qRead(); if (!q.length) return Promise.resolve();
    var now = Date.now(), at = 0;
    try { at = Number(localStorage.getItem(RETRY_KEY)) || 0; } catch (_) {}
    if (!force && now < at) return Promise.resolve();
    _retrying = true;
    var done = function () { _retrying = false; };
    return certReqUid().then(function (uid) {
      if (!uid) return;
      var mine = q.filter(function (e) { return e.u === uid; });
      if (!mine.length) return;
      try { localStorage.setItem(RETRY_KEY, String(now + BACKOFF_MS)); } catch (_) {}
      var chain = Promise.resolve();
      mine.forEach(function (e) {   // one at a time, so a refused label cannot block the rest; removed only once settled
        chain = chain.then(function () { return _post(uid, [_row(uid, e.label)]).then(function (kind) { if (kind !== 'retry') _qRemove(e); }); });
      });
      return chain;
    }).then(done, done);
  }
  try { window.addEventListener('ca:home-shown', function () { retryCertRequests(); }); } catch (_) {}

  window._normCertRequest = _normCertRequest;
  window._certReqLabel = _certReqLabel;
  window._certReqRows = _certReqRows;
  window._certReqSendText = _certReqSendText;
  window._certReqGlyph = _certReqGlyph;
  window.certReqUid = certReqUid;
  window.sendCertRequests = sendCertRequests;
  window.retryCertRequests = retryCertRequests;
  window.CERT_REQ_QUEUE_KEY = QUEUE_KEY;
})();
