// Persona bundle Task 7: no repeat questions across days.
// Spec: docs/superpowers/specs/2026-10-30-why-score-bookit-repeats-design.md §3
// Eager classic <script defer>. Exposes seenRecord / seenFilter / seenRecentStems /
// seenAnsweredWithin / seenPromptBlock on window.
//
// Remembers a short fingerprint of every question answered in a practice quiz, per cert,
// for 30 days (capped at 1,500 per cert). Local only, never cloud-synced.
// startQuiz drops near-repeats after validation and tops up; the writer prompt lists the
// last 20 stems seen on the topic; the offline cache is only served if none of it was
// answered in the last 7 days. Resumed quizzes and mistake drills never pass through here.
(function () {
  'use strict';

  const SEEN_KEY = 'nplus_seen_q';
  const SEEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  const SEEN_CAP = 1500;
  const SEEN_JACCARD = 0.8;
  const SEEN_STEM_MAX = 200;

  function _seenNorm(s) {
    if (typeof _normalizeStemForDedup === 'function') return _normalizeStemForDedup(s);
    return String(s || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
  }
  function _seenCert() { return (typeof CURRENT_CERT !== 'undefined' && CURRENT_CERT) || 'netplus'; }

  // The right answer as text, so a reworded stem with shuffled options still matches.
  function _seenAnswer(q) {
    if (!q) return '';
    const opts = q.options;
    const keys = Array.isArray(q.answers) ? q.answers : String(q.answer == null ? '' : q.answer).split(',');
    const text = keys.map(function (k) {
      k = String(k).trim();
      let t = null;
      if (/^[A-Ha-h]$/.test(k) && opts) {
        t = Array.isArray(opts) ? opts['ABCDEFGH'.indexOf(k.toUpperCase())] : opts[k.toUpperCase()];
      }
      return String(t == null ? k : t).replace(/^\s*[A-Ha-h][).:]\s+/, '');
    }).map(_seenNorm).sort().join(' / ');
    return text;
  }
  function _seenHash(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }
  function _seenFp(q) { return _seenHash(_seenNorm(q && q.question) + '|' + _seenAnswer(q)); }
  function _seenWords(stem) { return new Set(_seenNorm(stem).split(' ').filter(Boolean)); }
  function _seenJaccard(a, b) {
    if (!a.size || !b.size) return 0;
    let inter = 0;
    a.forEach(function (w) { if (b.has(w)) inter++; });
    return inter / (a.size + b.size - inter);
  }

  function _seenReadAll() {
    try {
      const o = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
      return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    } catch (_) { return {}; }
  }
  function _seenPrune(list, now) {
    return (Array.isArray(list) ? list : [])
      .filter(function (e) { return e && e.fp && typeof e.at === 'number' && now - e.at <= SEEN_TTL_MS; })
      .sort(function (a, b) { return a.at - b.at; })
      .slice(-SEEN_CAP);
  }
  function _seenList(now) { return _seenPrune(_seenReadAll()[_seenCert()], now || Date.now()); }

  // Record answered questions (called from finish()). Newest wins on a repeat fingerprint.
  function seenRecord(qs, quizTopic) {
    try {
      const now = Date.now();
      const all = _seenReadAll(), cert = _seenCert();
      const single = quizTopic && !/Mixed/.test(quizTopic) && quizTopic.indexOf('Multi: ') !== 0 && !/Smart/.test(quizTopic);
      const add = (qs || []).filter(function (q) { return q && q.question; }).map(function (q) {
        return { fp: _seenFp(q), stem: String(q.question).trim().slice(0, SEEN_STEM_MAX), ans: _seenAnswer(q),
          topic: single ? quizTopic : (q.topic || quizTopic || ''), at: now };
      });
      if (!add.length) return 0;
      const fresh = new Set(add.map(function (e) { return e.fp; }));
      const kept = _seenPrune(all[cert], now).filter(function (e) { return !fresh.has(e.fp); });
      all[cert] = _seenPrune(kept.concat(add), now);
      Object.keys(all).forEach(function (c) { if (c !== cert) all[c] = _seenPrune(all[c], now); });
      localStorage.setItem(SEEN_KEY, JSON.stringify(all));
      return add.length;
    } catch (_) { return 0; }
  }

  // Index the stored entries once, then test each question against them.
  function _seenMatcher(list) {
    const fps = new Set(list.map(function (e) { return e.fp; }));
    const byAns = {};
    list.forEach(function (e) { (byAns[e.ans || ''] = byAns[e.ans || ''] || []).push(_seenWords(e.stem)); });
    return function (q) {
      if (fps.has(_seenFp(q))) return true;
      const same = byAns[_seenAnswer(q)];
      if (!same) return false;
      const w = _seenWords(q && q.question);
      return same.some(function (s) { return _seenJaccard(w, s) >= SEEN_JACCARD; });
    };
  }

  // Drop questions seen before: same fingerprint, or stem words Jaccard >= 0.8 with the same
  // right-answer text. Works on any array, so a caller can run it per batch.
  function seenFilter(qs) {
    const arr = Array.isArray(qs) ? qs : [];
    const list = _seenList();
    if (!list.length) return { kept: arr.slice(), dropped: 0 };
    const seen = _seenMatcher(list);
    const kept = arr.filter(function (q) { return !seen(q); });
    return { kept: kept, dropped: arr.length - kept.length };
  }

  // The last n distinct stems seen on a topic, newest first. Mixed = the whole cert;
  // a "Multi: a, b" sentinel matches any of its topics.
  function seenRecentStems(topic, n) {
    const limit = n == null ? 20 : n;
    const t = String(topic || '');
    let match = function () { return true; };
    if (t && !/Mixed/.test(t)) {
      const wanted = t.indexOf('Multi: ') === 0
        ? (typeof _parseMultiTopicSentinel === 'function' ? _parseMultiTopicSentinel(t) : t.slice(7).split(','))
        : [t];
      const set = new Set(wanted.map(function (x) { return String(x).trim().toLowerCase(); }));
      match = function (e) { return set.has(String(e.topic || '').trim().toLowerCase()); };
    }
    const out = [], have = new Set();
    const list = _seenList();
    for (let i = list.length - 1; i >= 0 && out.length < limit; i--) {
      const e = list[i];
      if (!match(e) || !e.stem) continue;
      const k = _seenNorm(e.stem);
      if (have.has(k)) continue;
      have.add(k); out.push(e.stem);
    }
    return out;
  }

  // True when any of qs was answered in the last `days` days (gates the offline cache).
  function seenAnsweredWithin(qs, days) {
    const d = days == null ? 7 : days;
    const now = Date.now();
    const list = _seenList(now).filter(function (e) { return now - e.at <= d * 86400000; });
    if (!list.length || !Array.isArray(qs)) return false;
    return qs.some(_seenMatcher(list));
  }

  // Appended to the writer prompt after the stale-topic block.
  function seenPromptBlock(topic) {
    try {
      const stems = seenRecentStems(topic, 20);
      if (!stems.length) return '';
      return '\n\nAlready asked recently (cover something else):\n' + stems.map(function (s) { return '- ' + s; }).join('\n');
    } catch (_) { return ''; }
  }

  window.seenRecord = seenRecord;
  window.seenFilter = seenFilter;
  window.seenRecentStems = seenRecentStems;
  window.seenAnsweredWithin = seenAnsweredWithin;
  window.seenPromptBlock = seenPromptBlock;
})();
