/* Baseline Diagnostic + Pass Plan + ACL Ordering PBQ — extracted from app.js (#138 wave 5).
 * Lazy-loaded feature. Mechanical move: function bodies identical to app.js @ 596ec9d.
 * State vars (_diagnosticSession, _diagnosticTimer, _aclPbqState) and
 * ACL_PBQ_BANK data moved here from app.js. _diagnosticCtaSessionDismissed
 * moved back OUT to app.js top level in v7.97.0 (see comment there). */
(function () {
  'use strict';

  let _diagnosticSession = null;
  let _diagnosticTimer = null;
  // v7.97.0: _diagnosticCtaSessionDismissed moved to app.js top level (see
  // comment there) — app.js's _computeNextBestMove() read it as a bare
  // identifier, but this was the only declaration and it was captive in
  // this lazy-loaded module's closure, so the read threw a ReferenceError
  // that a surrounding try/catch silently swallowed, meaning the
  // brand-new-user Baseline Diagnostic CTA never rendered.
  let _aclPbqState = null;
  const ACL_PBQ_BANK = [
    {
      id: 'web-server-dmz',
      title: 'Public Web Server in DMZ',
      domain: 'N10-009 4.3',
      difficulty: 'Exam Level',
      goal: 'A web server (10.0.1.50) sits in the DMZ. It must be reachable from the internet on port 443 only. Internal users (10.10.0.0/16) can SSH to it for admin (port 22). All other traffic from the internet to the DMZ must be denied. Order the rules to satisfy this goal.',
      hint: 'More-specific rules first. Implicit deny at the end.',
      rules: [
        { id: 'r1', desc: 'Allow internet → DMZ on TCP 443', action: 'allow', proto: 'tcp', src: 'any', dst: '10.0.1.50', port: '443' },
        { id: 'r2', desc: 'Deny all internet → DMZ', action: 'deny', proto: 'any', src: 'any', dst: '10.0.1.0/24', port: 'any' },
        { id: 'r3', desc: 'Allow internal → DMZ on TCP 22 (SSH admin)', action: 'allow', proto: 'tcp', src: '10.10.0.0/16', dst: '10.0.1.50', port: '22' }
      ],
      correctOrder: ['r1', 'r3', 'r2'],
      testTraffic: [
        { id: 't1', label: 'Internet user → web server HTTPS', src: '203.0.113.5', dst: '10.0.1.50', proto: 'tcp', port: '443', expected: 'allow' },
        { id: 't2', label: 'Internet attacker → web server SSH', src: '203.0.113.5', dst: '10.0.1.50', proto: 'tcp', port: '22', expected: 'deny' },
        { id: 't3', label: 'Internal admin → web server SSH', src: '10.10.5.20', dst: '10.0.1.50', proto: 'tcp', port: '22', expected: 'allow' },
        { id: 't4', label: 'Internet probe → web server SMB', src: '198.51.100.7', dst: '10.0.1.50', proto: 'tcp', port: '445', expected: 'deny' }
      ],
      explanation: 'Specific allows go FIRST (r1 for HTTPS, r3 for internal SSH). The broad deny (r2) goes LAST so it catches everything not explicitly permitted. If you put the deny first, NO traffic would reach the DMZ at all — even the legitimate HTTPS. Rule ordering = top-down first-match: the firewall stops at the first matching rule. N10-009 4.3 (firewall rule ordering, implicit deny).'
    },
    {
      id: 'remote-vpn-restricted',
      title: 'Remote-Access VPN with Restricted Subnets',
      domain: 'N10-009 4.4 + 4.3',
      difficulty: 'Exam Level',
      goal: 'Remote VPN users (172.16.50.0/24) need access to internal servers. They MUST be able to reach the file server (10.20.0.10) on SMB (port 445). They MUST NOT reach the database server (10.20.0.20). All other internal traffic from VPN is denied. Order the rules.',
      hint: 'A specific deny can be more important than a broad allow. Place rules so the deny on the database fires before any catch-all allow.',
      rules: [
        { id: 'r1', desc: 'Allow VPN → file server on TCP 445', action: 'allow', proto: 'tcp', src: '172.16.50.0/24', dst: '10.20.0.10', port: '445' },
        { id: 'r2', desc: 'Deny VPN → database server (any)', action: 'deny', proto: 'any', src: '172.16.50.0/24', dst: '10.20.0.20', port: 'any' },
        { id: 'r3', desc: 'Deny VPN → all internal (any)', action: 'deny', proto: 'any', src: '172.16.50.0/24', dst: '10.20.0.0/24', port: 'any' }
      ],
      correctOrder: ['r2', 'r1', 'r3'],
      testTraffic: [
        { id: 't1', label: 'VPN user → file server SMB', src: '172.16.50.5', dst: '10.20.0.10', proto: 'tcp', port: '445', expected: 'allow' },
        { id: 't2', label: 'VPN user → database server SQL', src: '172.16.50.5', dst: '10.20.0.20', proto: 'tcp', port: '1433', expected: 'deny' },
        { id: 't3', label: 'VPN user → file server SSH', src: '172.16.50.5', dst: '10.20.0.10', proto: 'tcp', port: '22', expected: 'deny' },
        { id: 't4', label: 'VPN user → other internal HTTP', src: '172.16.50.5', dst: '10.20.0.30', proto: 'tcp', port: '80', expected: 'deny' }
      ],
      explanation: 'Tricky one: the database deny (r2) MUST fire before the file-server allow (r1) — but only because of how rule shadowing works. Actually here it doesn\'t matter for the database (different IP), but the principle still holds: place specific denies before general allows. r3 is the catch-all that handles "everything else from VPN." If you placed r3 first, NO VPN traffic would work — including the legitimate file-server access. Rule order matters most when CIDR ranges overlap. N10-009 4.3 (rule order), 4.4 (VPN architecture).'
    },
    {
      id: 'guest-wifi-isolation',
      title: 'Guest WiFi Isolation',
      domain: 'N10-009 4.3',
      difficulty: 'Foundational',
      goal: 'Guest WiFi (192.168.99.0/24) needs internet access only. Guests MUST NOT reach any internal subnet (10.0.0.0/8). DNS lookups (UDP 53) to internal DNS server (10.0.0.53) are allowed for resolution. Order the rules.',
      hint: 'Allow the one exception, deny the broad area, then allow the rest. First-match-wins.',
      rules: [
        { id: 'r1', desc: 'Allow guest → internal DNS UDP 53', action: 'allow', proto: 'udp', src: '192.168.99.0/24', dst: '10.0.0.53', port: '53' },
        { id: 'r2', desc: 'Deny guest → all internal (any)', action: 'deny', proto: 'any', src: '192.168.99.0/24', dst: '10.0.0.0/8', port: 'any' },
        { id: 'r3', desc: 'Allow guest → internet (any)', action: 'allow', proto: 'any', src: '192.168.99.0/24', dst: 'any', port: 'any' }
      ],
      correctOrder: ['r1', 'r2', 'r3'],
      testTraffic: [
        { id: 't1', label: 'Guest → internal DNS resolve', src: '192.168.99.10', dst: '10.0.0.53', proto: 'udp', port: '53', expected: 'allow' },
        { id: 't2', label: 'Guest → internal file server SMB', src: '192.168.99.10', dst: '10.0.5.20', proto: 'tcp', port: '445', expected: 'deny' },
        { id: 't3', label: 'Guest → internet HTTPS', src: '192.168.99.10', dst: '203.0.113.10', proto: 'tcp', port: '443', expected: 'allow' },
        { id: 't4', label: 'Guest → internal HTTP scan', src: '192.168.99.10', dst: '10.5.5.5', proto: 'tcp', port: '80', expected: 'deny' }
      ],
      explanation: 'The DNS allow (r1) is a SPECIFIC exception that must fire BEFORE the broad internal-deny (r2). If you flipped them, DNS lookups would fail because r2 would catch them first. Then the catch-all internet-allow (r3) handles everything else. Classic 3-rule pattern: exception → block → allow-the-rest. N10-009 4.3 (segmentation + ACL ordering).'
    }
  ];

  // ══════════════════════════════════════════
  // v4.81.0: BASELINE DIAGNOSTIC + PASS PLAN (Codex r5 #1 / Issue #243)
  // ──────────────────────────────────────────
  // Single-sitting 20-question diagnostic that produces a Pass Plan: pass
  // probability with CI, top-3 weak domains, 7-day plan, recommended PBQ.
  // Wrong/uncertain answers seed the v4.74.0 SR queue automatically — the
  // diagnostic is the natural seeding event for spaced repetition.
  // ══════════════════════════════════════════


  // Persist the latest completed diagnostic + Pass Plan so the home tile +
  // /view-report path can re-render without recomputing.
  function loadDiagnostic() {
    try { return JSON.parse(localStorage.getItem(STORAGE.DIAGNOSTIC) || 'null'); }
    catch { return null; }
  }
  function saveDiagnostic(d) {
    try { localStorage.setItem(STORAGE.DIAGNOSTIC, JSON.stringify(d)); _cloudFlush(STORAGE.DIAGNOSTIC); }
    catch { showToast('Storage full · diagnostic not saved', 'error'); }
  }

  // Days remaining until the user can retake. 0 = retake available now.
  // Returns null if no diagnostic on file.
  function getDiagnosticCooldownDays() {
    const last = parseInt(localStorage.getItem(STORAGE.LAST_DIAGNOSTIC_AT) || '0', 10);
    if (!last) return null;
    const elapsed = Date.now() - last;
    if (elapsed >= DIAGNOSTIC_RETAKE_COOLDOWN_MS) return 0;
    return Math.ceil((DIAGNOSTIC_RETAKE_COOLDOWN_MS - elapsed) / 86400000);
  }

  // User clicks the "skip for now" link — hide the CTA for this session only.
  // Reappears on next page load (intentional — the diagnostic is high-value
  // enough to nag once per session, not just once forever).
  function dismissDiagnosticCta(ev) {
    if (ev) ev.preventDefault();
    _diagnosticCtaSessionDismissed = true;
    renderDiagnosticSurface();
  }

  // Top-level entry point — wired to the "Take the Diagnostic" button on the
  // home CTA. Confirms intent, fetches 20 Qs across all domains, then enters
  // the quiz flow.
  async function startDiagnostic(opts) {
    // v7.30.0: parameterized for the onboarding short-calibration. Called with NO
    // args from the home Pass-Plan CTA → identical 20-Q Baseline Diagnostic. The
    // ?onb=1 first-run passes { count, topic, skipConfirm, onboarding, onComplete,
    // priorSession, mock } to run a reduced calibration that hands real readiness
    // back to the first-run UI instead of the Pass-Plan results page.
    opts = opts || {};
    const N = (typeof opts.count === 'number' && opts.count > 0) ? opts.count : DIAGNOSTIC_QUESTION_COUNT;
    const topic = opts.topic || MIXED_TOPIC;
    const key = (typeof getApiKey === 'function') ? getApiKey() : (localStorage.getItem(STORAGE.KEY) || '');
    // v4.99.46 fix: signed-in Pro users route through the server proxy (no
    // client BYOK key needed). validateApiKey() returns null for signed-in
    // users; we use it instead of the rolled-own `if (!key)` check that
    // pre-fix blocked them with a "Set your API key" toast + goSettings()
    // redirect. From the founder's iPhone POV: tap → invisible toast +
    // subtle page transition = "nothing happened." Same root cause as the
    // v4.99.33 fix for Generate Quiz / Exam / Drills (all 5 of those use
    // validateApiKey at the top of their start* function — startDiagnostic
    // was missed because it predates the unified gate).
    if (!opts.mock) {
      const keyErr = validateApiKey(key);
      if (keyErr) {
        showToast(keyErr, 'error');
        if (typeof goSettings === 'function') goSettings();
        return;
      }
    }
    if (!opts.skipConfirm && !confirm('Take the Baseline Diagnostic? 20 questions, ~30 minutes, single sitting. You can quit mid-flow but progress will be lost.')) return;

    showPage('loading');
    if (typeof showLoading === 'function') showLoading('Generating your diagnostic · ' + N + ' calibrated questions…');
    // v4.82.1: smooth loading bar across the diagnostic flow too.
    _loadingProgressBegin('Generating diagnostic questions…');

    try {
      // Use Mixed topic + Mixed difficulty so the existing 7-layer pipeline
      // spreads across domains naturally. Over-request DROPOUT_BUFFER so we
      // can drop low-quality items + filter out non-MCQ types and still hit 20.
      // v4.81.5: filter to MCQ-only. The diagnostic UI doesn't render multi-
      // select / order / cli-sim / topology question types — and PBQs were
      // sneaking in via injectPBQs (called from fetchQuestions for n>=10).
      // Bump buffer + filter to keep MCQ-only flow.
      const buffer = Math.max(8, Math.ceil(N * 0.4));
      const _isMcq = (q) => q && q.options && typeof q.options === 'object' && !Array.isArray(q.options) &&
        Object.keys(q.options).length === 4 && typeof q.answer === 'string' && q.answer.length === 1 &&
        'ABCD'.includes(q.answer);
      let qs;
      if (opts.mock && typeof _onbMockQuestions === 'function') {
        // Guarded onboarding-preview path — exercise the full calibration flow
        // without an API key. Only reachable via startDiagnostic({mock:true}).
        qs = _onbMockQuestions(N);
      } else {
        qs = await fetchQuestions(key, topic, 'Mixed', N + buffer);
        _loadingProgressUpdate('Filtering to MCQ-only…', 60);
        qs = (qs || []).filter(_isMcq).slice(0, N);
        if (qs.length < N) {
          // Try one retry-to-fill to recover from a partial first batch.
          const deficit = N - qs.length;
          _loadingProgressUpdate('Topping up (' + deficit + ' more)…', 75);
          try {
            const more = await fetchQuestions(key, topic, 'Mixed', deficit + buffer);
            qs = qs.concat((more || []).filter(_isMcq).slice(0, deficit));
          } catch (_) { /* swallow — we ship what we have */ }
        }
      }
      if (qs.length === 0) {
        throw new Error('Could not generate diagnostic questions. Please try again in a moment.');
      }
      _loadingProgressUpdate('Finalizing…', 95);

      _diagnosticSession = {
        questions: qs,
        answers: new Array(qs.length).fill(null),
        currentIdx: 0,
        startedAt: Date.now(),
        pickedLetter: null,
        confidence: null,
        // v7.30.0 onboarding hooks (null for the normal Baseline Diagnostic):
        onboarding: opts.onboarding || null,
        onComplete: (typeof opts.onComplete === 'function') ? opts.onComplete : null,
        priorSession: opts.priorSession || null
      };
      _diagnosticStartTimer();
      _loadingProgressFinish();
      showPage('diagnostic-quiz');
      _renderDiagnosticQuestion();
    } catch (err) {
      _loadingProgressFinish();
      showToast(err.message || 'Diagnostic generation failed. Please try again.', 'error');
      goSetup();
    }
  }

  function _diagnosticStartTimer() {
    if (_diagnosticTimer) clearInterval(_diagnosticTimer);
    const started = _diagnosticSession ? _diagnosticSession.startedAt : Date.now();
    const tick = () => {
      const el = document.getElementById('diag-quiz-timer');
      if (!el) return;
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, DIAGNOSTIC_DURATION_MS - elapsed);
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      el.textContent = (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
      el.classList.toggle('overtime', remaining === 0);
    };
    tick();
    _diagnosticTimer = setInterval(tick, 1000);
  }

  function _diagnosticStopTimer() {
    if (_diagnosticTimer) { clearInterval(_diagnosticTimer); _diagnosticTimer = null; }
  }

  function _renderDiagnosticQuestion() {
    if (!_diagnosticSession) return;
    const sess = _diagnosticSession;
    const q = sess.questions[sess.currentIdx];
    if (!q) return;

    // Progress bar + label
    const total = sess.questions.length;
    const idx = sess.currentIdx;
    const pct = Math.round(((idx + 1) / total) * 100);
    const fill = document.getElementById('diag-quiz-progress-fill');
    const lbl = document.getElementById('diag-quiz-progress-lbl');
    if (fill) fill.style.width = pct + '%';
    if (lbl) lbl.textContent = 'Question ' + (idx + 1) + ' of ' + total + ' · ' + pct + '% complete';

    // Meta pills
    const meta = document.getElementById('diag-quiz-meta');
    if (meta) {
      const topic = q.topic || 'N10-009';
      const diffLbl = (q.difficulty || 'mid').replace(/^./, c => c.toUpperCase());
      meta.innerHTML =
        '<span class="diag-quiz-pill objective">' + escHtml(topic) + '</span>' +
        '<span class="diag-quiz-pill difficulty">' + escHtml(diffLbl) + ' difficulty</span>';
    }

    // Question stem + options
    // v4.81.5: q.options is a LETTER-KEYED OBJECT ({A:'...', B:'...', C:'...', D:'...'})
    // matching the rest of the app — NOT an array. The original v4.81.0 code
    // used array .forEach which silently failed (forEach is undefined on plain
    // objects), so options never rendered. The user reported "where are the
    // questions" with a screenshot showing question stem but no answer buttons.
    const qel = document.getElementById('diag-quiz-question');
    if (qel) setQuestionText(qel, q.question || '');
    const opts = document.getElementById('diag-quiz-options');
    if (opts) {
      opts.innerHTML = '';
      const letters = Object.keys(q.options || {}).sort();
      letters.forEach(l => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'diag-quiz-option';
        btn.dataset.letter = l;
        btn.innerHTML =
          '<span class="diag-quiz-option-letter">' + l + '</span>' +
          '<span class="diag-quiz-option-text">' + escHtml(q.options[l]) + '</span>';
        btn.onclick = () => pickDiagnosticOption(l);
        opts.appendChild(btn);
      });
    }

    // Reset picker state for fresh question
    sess.pickedLetter = null;
    sess.confidence = null;
    _refreshDiagnosticActions();
    document.querySelectorAll('#diag-quiz-confidence-tiers .diag-conf-tier').forEach(b => b.classList.remove('selected'));
  }

  function pickDiagnosticOption(letter) {
    if (!_diagnosticSession) return;
    // v4.81.5: letter-based selection (A/B/C/D), matching q.answer shape
    _diagnosticSession.pickedLetter = letter;
    document.querySelectorAll('#diag-quiz-options .diag-quiz-option').forEach(b => {
      b.classList.toggle('selected', b.dataset.letter === letter);
    });
    _refreshDiagnosticActions();
  }

  function setDiagnosticConfidence(tier) {
    if (!_diagnosticSession) return;
    _diagnosticSession.confidence = tier;
    document.querySelectorAll('#diag-quiz-confidence-tiers .diag-conf-tier').forEach(b => {
      b.classList.toggle('selected', b.dataset.tier === tier);
    });
    _refreshDiagnosticActions();
  }

  function _refreshDiagnosticActions() {
    if (!_diagnosticSession) return;
    const ready = _diagnosticSession.pickedLetter !== null && _diagnosticSession.confidence !== null;
    const btn = document.getElementById('diag-quiz-next-btn');
    const hint = document.getElementById('diag-quiz-hint');
    if (btn) btn.disabled = !ready;
    if (hint) {
      if (ready) {
        hint.textContent = _diagnosticSession.currentIdx === _diagnosticSession.questions.length - 1
          ? 'Submit final answer to see your Pass Plan'
          : 'Locked in · go to next question';
      } else if (_diagnosticSession.pickedLetter === null) {
        hint.textContent = 'Pick an answer';
      } else {
        hint.textContent = 'Pick a confidence level';
      }
    }
    if (btn) {
      btn.textContent = (_diagnosticSession.currentIdx === _diagnosticSession.questions.length - 1)
        ? 'Finish & see Pass Plan →'
        : 'Next →';
    }
  }

  function submitDiagnosticAnswer() {
    if (!_diagnosticSession) return;
    const sess = _diagnosticSession;
    if (sess.pickedLetter === null || sess.confidence === null) return;
    const q = sess.questions[sess.currentIdx];
    // v4.81.5: q.answer is a letter ('A'/'B'/'C'/'D'), matching the rest of
    // the app's MCQ schema. Compare letters, not numeric indices.
    const correct = sess.pickedLetter === q.answer;
    sess.answers[sess.currentIdx] = {
      pickedLetter: sess.pickedLetter,
      confidence: sess.confidence,
      correct,
      answeredAt: Date.now()
    };
    if (sess.currentIdx === sess.questions.length - 1) {
      completeDiagnostic();
    } else {
      sess.currentIdx++;
      _renderDiagnosticQuestion();
    }
  }

  function quitDiagnostic() {
    if (!_diagnosticSession) { goSetup(); return; }
    if (!confirm('Quit the diagnostic? Your progress will be lost · you\'ll need to retake from the start.')) return;
    _diagnosticStopTimer();
    _diagnosticSession = null;
    goSetup();
  }

  // v4.81.6: resilient topic→domain resolver for diagnostic answers.
  // Haiku doesn't always return canonical TOPIC_DOMAINS keys (e.g. it
  // may return "NETWORKING CONCEPTS - OSI MODEL & TCP/IP" instead of
  // "Network Models & OSI"). This tries:
  //   1. Exact match against TOPIC_DOMAINS
  //   2. Case-insensitive substring match against canonical topic keys
  //   3. Keyword fallback against domain-characteristic terms
  // Returns null if no match found — caller falls back to raw accuracy.
  function _resolveDomainForTopic(topic) {
    if (!topic || typeof TOPIC_DOMAINS === 'undefined') return null;
    // 1. Exact match (the happy path)
    if (TOPIC_DOMAINS[topic]) return TOPIC_DOMAINS[topic];
    // 2. Case-insensitive substring match — find a canonical topic that
    //    appears inside the verbose Haiku topic string (or vice-versa)
    const lowerTopic = topic.toLowerCase();
    const canonical = Object.keys(TOPIC_DOMAINS);
    for (const c of canonical) {
      const lowerC = c.toLowerCase();
      if (lowerTopic.includes(lowerC) || lowerC.includes(lowerTopic)) {
        return TOPIC_DOMAINS[c];
      }
    }
    // 3. Keyword fallback — match against domain-characteristic terms.
    //    Conservative: only fires for unambiguous keywords. If a topic
    //    is genuinely off-blueprint, return null and let the raw-
    //    accuracy fallback handle it.
    const keywordMap = [
      { keys: ['osi', 'tcp/ip', 'tcp ip', 'protocol', 'port', 'network model', 'topology', 'cabling', 'ipv4', 'ipv6', 'subnet', 'wan', 'lan', 'cloud'], domain: 'concepts' },
      { keys: ['routing', 'switching', 'vlan', 'stp', 'wireless', 'wifi', 'ospf', 'bgp', 'rip', 'eigrp', 'spanning tree', 'trunk', 'lacp'], domain: 'implementation' },
      { keys: ['monitoring', 'snmp', 'syslog', 'documentation', 'change management', 'lifecycle', 'patch', 'inventory', 'baseline'], domain: 'operations' },
      { keys: ['security', 'firewall', 'acl', 'authentication', 'authorization', 'aaa', 'vpn', 'ipsec', 'encryption', 'attack', 'malware', 'phishing', 'zero trust'], domain: 'security' },
      { keys: ['troubleshoot', 'diagnose', 'latency', 'packet loss', 'jitter', 'cable issue', 'perf issue', 'tools', 'ping', 'traceroute', 'tcpdump'], domain: 'troubleshooting' }
    ];
    for (const km of keywordMap) {
      for (const k of km.keys) {
        if (lowerTopic.includes(k)) return km.domain;
      }
    }
    return null;
  }

  // Compute the Pass Plan from the answered questions. Returns the data
  // shape the result page expects + the home tile reads from.
  function _buildPassPlan(session) {
    const questions = session.questions;
    const answers = session.answers;
    const total = questions.length;

    // Per-domain accuracy (raw — no recency/Bayesian smoothing because this is
    // a single-sitting diagnostic with small n-per-domain). We use the same
    // domain weights as getReadinessScore() so the predicted score is
    // calibrated against the same scale.
    const buckets = {};
    Object.keys(DOMAIN_WEIGHTS).forEach(d => { buckets[d] = { correct: 0, total: 0, label: DOMAIN_LABELS[d] }; });

    // v4.81.6: track raw correct/total alongside domain bucketing as a
    // resilient fallback. Pre-fix, if Haiku returned a topic that didn't
    // map cleanly to TOPIC_DOMAINS (e.g. the verbose "NETWORKING CONCEPTS
    // - OSI MODEL & TCP/IP" instead of canonical "Network Models & OSI"),
    // the answer was silently skipped from the score → user could get 18/20
    // correct and see 0% pass probability because no domain bucket got
    // populated. The user reported exactly this. Fix: keep the domain-
    // weighted path as the preferred score (it's exam-realistic), but
    // fall back to raw accuracy when the domain mapping fails for too
    // many questions to give a reliable weighted result.
    let rawCorrect = 0;
    let rawTotal = 0;
    let domainMappedCount = 0;
    questions.forEach((q, i) => {
      const a = answers[i];
      if (!a) return;
      rawTotal++;
      if (a.correct) rawCorrect++;
      const topic = q.topic;
      const domain = (typeof TOPIC_DOMAINS !== 'undefined') ? _resolveDomainForTopic(topic) : null;
      if (!domain || !buckets[domain]) return;
      domainMappedCount++;
      buckets[domain].total++;
      if (a.correct) buckets[domain].correct++;
    });

    // Domain-weighted accuracy → 0-100. Domains with no questions in the
    // diagnostic don't contribute (their weight is redistributed).
    let totalWeight = 0;
    let weightedAcc = 0;
    Object.keys(DOMAIN_WEIGHTS).forEach(d => {
      if (buckets[d].total > 0) {
        const acc = (buckets[d].correct / buckets[d].total);
        weightedAcc += acc * DOMAIN_WEIGHTS[d];
        totalWeight += DOMAIN_WEIGHTS[d];
      }
    });
    // v4.81.6: trust the weighted score only when ≥50% of questions mapped
    // to a domain — otherwise the domain-weighted % is a sample-size lie
    // that ignores most of the user's answers. Fall back to raw accuracy.
    const domainCoverageOk = rawTotal > 0 && (domainMappedCount / rawTotal) >= 0.5;
    let accNormalized;
    if (domainCoverageOk && totalWeight > 0) {
      accNormalized = weightedAcc / totalWeight;
    } else if (rawTotal > 0) {
      accNormalized = rawCorrect / rawTotal;
    } else {
      accNormalized = 0;
    }
    const accPct = accNormalized * 100;

    // Predicted score on the 420-870 scale matches getReadinessScore math.
    // Diagnostic is single-domain-spread so we apply a slight regression-to-
    // mean penalty (multiply by 0.95) — 20 questions can't out-predict 200.
    const predicted = Math.round(420 + (accPct / 100) * 450 * 0.95);

    // CI is wide for a 20-Q sample. Mirror the formula in getReadinessScore
    // but assume coverageFactor = 1 (we covered all domains) and recency = 1
    // (just answered them). So sampleWidth dominates: 60/sqrt(1 + 20/50) ≈ 50.
    const sampleWidth = 60 / Math.sqrt(1 + total / 50);
    const ciHalfWidth = Math.max(20, Math.min(80, Math.round(sampleWidth)));
    const lowerBound = Math.max(420, predicted - ciHalfWidth);
    const upperBound = Math.min(870, predicted + ciHalfWidth);

    // Pass probability via logistic, same as v4.73.0 widget.
    const sigma = ciHalfWidth / 1.645;
    const z = (predicted - EXAM_PASS_SCORE) / sigma;
    const passProbability = 1 / (1 + Math.exp(-z));

    // Confidence ladder tier — drives the 'low/medium/high' badge.
    // <30 Q answered = low confidence, 30-60 = medium, 60+ = high. v1 always
    // medium (we just took 20 Qs); ladder is forward-looking infrastructure.
    let dataConfidence = 'low';
    if (total >= 50) dataConfidence = 'medium';
    if (total >= 80) dataConfidence = 'high';

    // Top 3 weak domains — sorted by accuracy ascending, with raw count.
    const weakDomains = Object.keys(buckets)
      .filter(d => buckets[d].total > 0)
      .map(d => ({
        key: d,
        label: buckets[d].label,
        correct: buckets[d].correct,
        total: buckets[d].total,
        accuracy: buckets[d].correct / buckets[d].total
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    // Cards seeded count (every wrong + uncertain enrolls into SR).
    const seededCount = answers.filter(a =>
      a && (!a.correct || a.confidence === 'uncertain' || a.confidence === 'guessing')
    ).length;

    // Static 7-day plan recommendations — keyed off top weak domain.
    // Today = drill weakest, tomorrow = SR review + #2 weakest, etc.
    const week = _buildWeekPlan(weakDomains, seededCount);

    // PBQ recommendation — ACL Builder is the only PBQ today, so always rec it.
    const pbqRec = {
      title: 'Try the ACL Ordering PBQ',
      sub: 'PBQs are weighted 3-4× on the real exam. ACL ordering is the most-confused firewall concept. Build the muscle now.',
      cta: 'Open ACL PBQ →',
      targetFn: 'aclOpenFromPassPlan'
    };

    return {
      completedAt: Date.now(),
      questionCount: total,
      answeredCount: answers.filter(a => a !== null).length,
      correctCount: answers.filter(a => a && a.correct).length,
      accPct: Math.round(accPct),
      predicted,
      ciHalfWidth,
      lowerBound,
      upperBound,
      passProbability,
      dataConfidence,
      weakDomains,
      seededCount,
      week,
      pbqRec
    };
  }

  function _buildWeekPlan(weakDomains, seededCount) {
    const today = new Date();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const top1 = weakDomains[0];
    const top2 = weakDomains[1];
    const top3 = weakDomains[2];
    const top1Name = top1 ? top1.label : 'mixed practice';
    const top2Name = top2 ? top2.label : 'mixed practice';
    const top3Name = top3 ? top3.label : 'mixed practice';
    const days = [
      { name: 'Today', load: 15, task: 'Drill ' + top1Name },
      { name: dayLabels[(today.getDay() + 1) % 7], load: 20, task: 'Review ' + seededCount + ' SR cards + ' + top2Name },
      { name: dayLabels[(today.getDay() + 2) % 7], load: 15, task: top3Name + ' deep-dive' },
      { name: dayLabels[(today.getDay() + 3) % 7], load: 25, task: 'Deep-dive on ' + top1Name },
      { name: dayLabels[(today.getDay() + 4) % 7], load: 20, task: 'SR review + ACL PBQ' },
      { name: dayLabels[(today.getDay() + 5) % 7], load: 15, task: 'Mixed practice' },
      { name: dayLabels[(today.getDay() + 6) % 7], load: 30, task: '30-min mini exam' }
    ];
    return days;
  }

  // Seeds the v4.74.0 SR queue from diagnostic answers. Wrong answers always
  // enroll. Correct-but-uncertain and correct-but-guessing also enroll
  // (they're the 'I happened to get it right but don't really know' cases —
  // surfacing them again is the whole point of SR).
  function _seedReviewQueueFromDiagnostic(session) {
    let added = 0;
    session.questions.forEach((q, i) => {
      const a = session.answers[i];
      if (!a) return;
      const shouldSeed = !a.correct || a.confidence === 'uncertain' || a.confidence === 'guessing';
      if (!shouldSeed) return;
      try {
        addToSrQueue(q);
        added++;
      } catch (_) { /* swallow per-card errors so one bad card doesn't kill seeding */ }
    });
    return added;
  }

  function completeDiagnostic() {
    if (!_diagnosticSession) return;
    _diagnosticStopTimer();
    const session = _diagnosticSession;

    // v7.30.0: onboarding calibration / movement legs hand off to the first-run
    // UI instead of the Pass-Plan results page. Guarded — only set when launched
    // via startDiagnostic({ onboarding }) from the ?onb=1 first-run flow.
    if (session.onboarding) {
      _diagnosticSession = null;
      try { _onbDiagnosticComplete(session); } catch (_) {}
      return;
    }

    const passPlan = _buildPassPlan(session);
    // Override seededCount with the actual addToSrQueue return after seeding,
    // so a dedup hit against an existing SR entry is reflected accurately.
    passPlan.seededCount = _seedReviewQueueFromDiagnostic(session);

    const record = {
      completedAt: passPlan.completedAt,
      startedAt: session.startedAt,
      durationMs: passPlan.completedAt - session.startedAt,
      questionCount: passPlan.questionCount,
      answeredCount: passPlan.answeredCount,
      correctCount: passPlan.correctCount,
      passPlan
    };
    saveDiagnostic(record);
    localStorage.setItem(STORAGE.LAST_DIAGNOSTIC_AT, String(passPlan.completedAt));
    _cloudFlush(STORAGE.LAST_DIAGNOSTIC_AT);

    // Clear session BEFORE rendering — keeps memory tidy + signals "done".
    _diagnosticSession = null;
    renderDiagnosticResult();
    showPage('diagnostic-result');
  }

  // v7.30.0 — onboarding calibration / movement completion. Reuses _buildPassPlan
  // + _seedReviewQueueFromDiagnostic, writes the readiness snapshot directly from
  // the calibration (history-independent, unlike _writeReadinessSnapshot), then
  // hands the real numbers back to the first-run UI via the session's onComplete.
  // Activation falls out of the snapshot: the lobby router treats a per-cert
  // readiness snapshot as "activated", and the snapshot syncs cloud↔local via the
  // existing Phase C′ plumbing. Deliberately does NOT saveDiagnostic() — the short
  // calibration is separate from the full 20-Q Baseline (decision doc §2), so the
  // home keeps offering the full Baseline.
  function _onbDiagnosticComplete(session) {
    // The movement leg combines with the calibration session so the recomputed
    // prediction reflects every question answered, not just the last few.
    var scored = session;
    if (session.priorSession && session.priorSession.questions) {
      scored = {
        questions: session.priorSession.questions.concat(session.questions),
        answers: session.priorSession.answers.concat(session.answers),
        startedAt: session.priorSession.startedAt || session.startedAt
      };
    }
    var passPlan = _buildPassPlan(scored);
    // Seed only THIS leg's wrong / uncertain answers into the SR review queue.
    try { passPlan.seededCount = _seedReviewQueueFromDiagnostic(session); } catch (_) {}
    _onbWriteReadinessFromPassPlan(passPlan);
    var cb = session.onComplete;
    if (typeof cb === 'function') {
      var passScore = (typeof EXAM_PASS_SCORE === 'number') ? EXAM_PASS_SCORE : 720;
      try { cb({ passPlan: passPlan, session: scored, passScore: passScore }); } catch (_) {}
    }
  }

  // Write the per-cert readiness snapshot straight from a calibration pass plan
  // (mirrors the shape in _writeReadinessSnapshot, but sourced from the diagnostic
  // session rather than cumulative quiz history). This is the activation signal.
  function _onbWriteReadinessFromPassPlan(passPlan) {
    try {
      if (!passPlan || typeof passPlan.predicted !== 'number') return;
      var raw = localStorage.getItem(STORAGE.READINESS_SNAPSHOTS);
      var snaps = {};
      if (raw) { try { snaps = JSON.parse(raw) || {}; } catch (_) { snaps = {}; } }
      var weak = (passPlan.weakDomains && passPlan.weakDomains[0]) || null;
      snaps[CURRENT_CERT] = {
        score: passPlan.predicted,
        computed_at: new Date().toISOString(),
        weak_topic: weak ? weak.label : null,
        weak_pct: weak ? Math.round(weak.accuracy * 100) : null,
        weak_domain: weak ? weak.key : null,
        days_to_exam: null,
        total_qs: passPlan.questionCount,
        source: 'onb-calibration'
      };
      localStorage.setItem(STORAGE.READINESS_SNAPSHOTS, JSON.stringify(snaps));
      if (typeof _cloudFlush === 'function') _cloudFlush(STORAGE.READINESS_SNAPSHOTS);
    } catch (_) { /* non-fatal — never block the onboarding flow */ }
  }

  // Guarded preview-only mock question generator (no API key needed). Only ever
  // called via startDiagnostic({ mock:true }) from the ?onb=1 first-run, so it can
  // never affect the real diagnostic. Answers vary so the calibration score is a
  // realistic mix rather than 0% or 100%.
  function _onbMockQuestions(n) {
    var out = [];
    var topics = ['Subnetting & VLSM', 'OSI Model & Encapsulation', 'Routing & Switching', 'Network Security', 'Wireless Standards'];
    for (var i = 0; i < n; i++) {
      out.push({
        question: 'Preview calibration question ' + (i + 1) + ' (mock — no API key).',
        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
        answer: (i % 5 === 0) ? 'B' : 'A',
        topic: topics[i % topics.length],
        difficulty: 'Mixed',
        explanation: 'Preview mock — not a real exam question.'
      });
    }
    return out;
  }

  // v4.85.7: extracted from renderDiagnosticResult() — renders the weak-domains
  // list with per-domain accuracy + Fix-this CTA. Mutates DOM directly.
  function _renderPassPlanWeakDomains(p) {
    const weakHost = document.getElementById('pass-plan-weak-domains');
    const weakCount = document.getElementById('pass-plan-weak-count');
    if (weakCount) weakCount.textContent = p.weakDomains.length + ' identified';
    if (!weakHost) return;
    weakHost.innerHTML = p.weakDomains.map(d => {
      const accPct = Math.round(d.accuracy * 100);
      const onclick = "_drillWeakDomainToBuilder('" + d.key + "')";
      return '<div class="pass-plan-weak-row">' +
        '<div class="pass-plan-weak-info">' +
        '<div class="pass-plan-weak-name">' + escHtml(d.label) + '</div>' +
        '<div class="pass-plan-weak-stat"><span class="pct">' + d.correct + ' of ' + d.total + ' correct</span> · ' + accPct + '% on diagnostic</div>' +
        '</div>' +
        '<button class="pass-plan-weak-btn" onclick="' + onclick + '">Fix this →</button>' +
        '</div>';
    }).join('');
  }

  // v4.85.7: extracted from renderDiagnosticResult() — renders the 7-day study
  // strip (today + 6 upcoming days, each with question count + task label).
  function _renderPassPlanWeekStrip(p) {
    const weekHost = document.getElementById('pass-plan-week-strip');
    if (!weekHost) return;
    weekHost.innerHTML = (p.week || []).map((d, i) => {
      const today = i === 0 ? ' today' : '';
      return '<div class="pass-plan-day' + today + '">' +
        '<div class="pass-plan-day-name">' + escHtml(d.name) + '</div>' +
        '<div class="pass-plan-day-load">' + d.load + ' Q</div>' +
        '<div class="pass-plan-day-task">' + escHtml(d.task) + '</div>' +
        '</div>';
    }).join('');
  }

  function renderDiagnosticResult() {
    const record = loadDiagnostic();
    if (!record || !record.passPlan) return;
    const p = record.passPlan;
    const pctStr = Math.round(p.passProbability * 100);

    // Probability ring — set conic-gradient based on percentage.
    const ring = document.getElementById('pass-plan-prob-ring');
    if (ring) {
      ring.style.background = 'conic-gradient(var(--accent) 0% ' + pctStr + '%, var(--surface3) ' + pctStr + '% 100%)';
    }
    const pctEl = document.getElementById('pass-plan-prob-pct');
    if (pctEl) pctEl.textContent = pctStr + '%';

    // Sub line — N20 calibrated questions across N domains
    const sub = document.getElementById('pass-plan-sub');
    if (sub) {
      const domainCount = p.weakDomains.length;
      sub.textContent = 'Based on ' + p.questionCount + ' calibrated questions across all 5 N10-009 domains · ' + domainCount + ' weak ' + (domainCount === 1 ? 'domain' : 'domains') + ' identified';
    }

    // CI band rows
    const rangeEl = document.getElementById('pass-plan-prob-range');
    const lowerPct = Math.round((1 / (1 + Math.exp(-((p.lowerBound - EXAM_PASS_SCORE) / (p.ciHalfWidth / 1.645))))) * 100);
    const upperPct = Math.round((1 / (1 + Math.exp(-((p.upperBound - EXAM_PASS_SCORE) / (p.ciHalfWidth / 1.645))))) * 100);
    if (rangeEl) rangeEl.textContent = lowerPct + '-' + upperPct + '%';
    const predEl = document.getElementById('pass-plan-predicted-score');
    if (predEl) predEl.textContent = p.predicted + ' / 870';
    const dataConfEl = document.getElementById('pass-plan-data-confidence');
    if (dataConfEl) {
      const labels = { low: 'Low — 20 of ~50 questions answered', medium: 'Medium — 50+ questions answered', high: 'High — 80+ questions answered' };
      dataConfEl.textContent = labels[p.dataConfidence] || labels.low;
    }

    // Confidence ladder — highlight active tier
    document.querySelectorAll('#pass-plan-confidence-ladder .pass-plan-ladder-tier').forEach(t => {
      t.classList.toggle('active', t.dataset.tier === p.dataConfidence);
    });

    _renderPassPlanWeakDomains(p);
    _renderPassPlanWeekStrip(p);

    // Review seeded
    const reviewNum = document.getElementById('pass-plan-review-num');
    if (reviewNum) reviewNum.textContent = String(p.seededCount);
    const reviewSub = document.getElementById('pass-plan-review-sub');
    if (reviewSub) {
      reviewSub.textContent = p.seededCount === 0
        ? 'No cards seeded — strong baseline! Keep practising to build the queue.'
        : 'First review session: tomorrow morning · auto-paced by SM-2 algorithm';
    }

    // PBQ rec
    const pbqTitle = document.getElementById('pass-plan-pbq-title');
    if (pbqTitle && p.pbqRec) pbqTitle.textContent = p.pbqRec.title;
    const pbqSub = document.getElementById('pass-plan-pbq-sub');
    if (pbqSub && p.pbqRec) pbqSub.textContent = p.pbqRec.sub;
    const pbqCta = document.getElementById('pass-plan-pbq-cta');
    if (pbqCta && p.pbqRec) pbqCta.textContent = p.pbqRec.cta;

    _renderDiagnosticConversion();
  }

  // v7.52.0: state-aware conversion moment at the bottom of the Pass Plan.
  // Anonymous → save-it-free panel + Pro waitlist teaser + soft escape.
  // Signed-in free → "saved to your account" + soft Pro line. Pro → hidden.
  function _renderDiagnosticConversion() {
    const host = document.getElementById('dq-conversion');
    if (!host) return;
    const signedIn = window._certanvilSignedIn === true;
    const isPro = !!_quotaState && (_quotaState.tier === 'pro' ||
      (typeof _quotaState.daily_limit === 'number' && _quotaState.daily_limit < 0));

    if (isPro) {                              // Pro: nothing to sell
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    if (signedIn) {                           // signed-in free: saved + soft Pro line
      host.innerHTML =
        '<p class="dq-affirm">' + _checkSvg() + 'Saved to your account</p>' +
        '<a href="#" class="dq-affirm-link" data-act="dq-view-account">View it on your account page</a>' +
        '<p class="dq-pro-soft">Want unlimited questions and every cert? ' +
        '<a href="#" data-act="dq-pro-teaser">Get Pro at launch · $9.99/mo</a></p>';
    } else {                                  // anonymous: save-free + Pro waitlist + escape
      host.innerHTML = _dqAnonConversionHtml();
    }
    _wireDiagnosticConversion(host);
  }

  // Anonymous save-panel + Pro waitlist teaser + escape (ported from mockup Frame 1).
  function _dqAnonConversionHtml() {
    return '' +
      '<div class="dq-save-panel">' +
        '<p class="dq-save-eyebrow">Before you start</p>' +
        '<h2 class="dq-save-h">Don\'t lose your Pass Plan</h2>' +
        '<p class="dq-save-sub">Right now it lives only on this device. Save it free and pick up where you left off on any device.</p>' +
        '<div class="dq-email-row">' +
          '<input class="dq-email-input" type="email" placeholder="you@email.com" aria-label="Email" data-act="dq-email">' +
          '<button type="button" class="btn btn-primary" data-act="dq-save-free">Save it free</button>' +
        '</div>' +
        '<p class="dq-save-micro"><b>Just your email.</b> No password <span class="dq-sep"></span> no card <span class="dq-sep"></span> 15 questions a day</p>' +
        '<p class="dq-save-home">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/></svg>' +
          'It lands on your account page, ready whenever you come back.</p>' +
      '</div>' +
      '<div class="dq-pro">' +
        '<div class="dq-pro-top"><span class="dq-pro-h">Going all in?</span><span class="dq-pro-tag">At launch</span></div>' +
        '<p class="dq-pro-sub">CertAnvil Pro: unlimited questions, every cert, the topology builder and labs. <span class="dq-pro-price">$9.99/mo</span> when it ships.</p>' +
        '<button type="button" class="btn btn-ghost dq-btn-ghost" data-act="dq-pro-teaser">Get Pro at launch</button>' +
      '</div>' +
      '<a href="#" class="dq-escape" data-act="dq-escape">Start today\'s session without saving</a>';
  }

  // Inline green check glyph for the "Saved" affirmation.
  function _checkSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" ' +
      'stroke="var(--green)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // Bind the conversion block's data-act controls to existing app flows.
  function _wireDiagnosticConversion(host) {
    host.querySelectorAll('[data-act]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        const act = el.getAttribute('data-act');
        if (act === 'dq-email') return;       // input, no click action
        e.preventDefault();
        if (act === 'dq-save-free') {
          if (typeof _showSignInPrompt === 'function') {
            _showSignInPrompt(host, 'Save your Pass Plan free: 15 questions a day, no password, no card.');
          } else if (typeof window.buildSignInUrl === 'function') {
            window.location.href = window.buildSignInUrl();
          }
        } else if (act === 'dq-pro-teaser') {
          _showProWaitlist();
        } else if (act === 'dq-escape') {
          closePassPlanReview();
        } else if (act === 'dq-view-account') {
          showPage('settings');
        }
      });
    });
  }

  // v7.52.0: App-Store-safe Pro teaser. Reuses the _showProOnlyUI visual shell
  // but carries NO external pricing/purchase link (Apple forbids external
  // purchase links for digital subscriptions). The action is a launch waitlist.
  function _showProWaitlist() {
    var prev = document.getElementById('pro-only-modal');
    if (prev) prev.remove();
    var modal = document.createElement('div');
    modal.id = 'pro-only-modal';
    modal.className = 'quota-exceeded-modal';   // reuse overlay scrim
    modal.innerHTML =
      '<div class="dlpb-card" role="dialog" aria-modal="true" aria-label="CertAnvil Pro at launch">' +
        '<div class="dlpb-lockmark" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="4" y="11" width="16" height="9" rx="2.5"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>' +
          '</svg>' +
        '</div>' +
        '<h2 class="dlpb-title">CertAnvil Pro at launch</h2>' +
        '<p class="dlpb-lede">CertAnvil Pro at launch · unlimited questions · every cert · $9.99/mo</p>' +
        '<div class="dlpb-actions">' +
          '<button type="button" class="dlpb-cta" id="pro-waitlist-notify">Notify me at launch</button>' +
          '<button type="button" class="dlpb-ghost" id="pro-waitlist-dismiss">Not now</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    var notify = document.getElementById('pro-waitlist-notify');
    if (notify) notify.addEventListener('click', function () {
      if (typeof showToast === 'function') showToast('You\'re on the list · we\'ll let you know when Pro ships', 'info', 4000);
      modal.remove();
    });
    var dismiss = document.getElementById('pro-waitlist-dismiss');
    if (dismiss) dismiss.addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  }

  // "View report" CTA on the home Pass Plan tile.
  function viewPassPlan() {
    renderDiagnosticResult();
    showPage('diagnostic-result');
  }

  // "Retake in 7d" link → only proceeds if cooldown elapsed.
  // v4.81.7: detect a corrupted Pass Plan from a known bug version. Returns
  // true if the stored Pass Plan shows the v4.81.0-v4.81.5 corruption
  // signature (accPct=0 yet seededCount < questionCount — mathematically
  // impossible from a real run because if you got 0 correct, ALL questions
  // would seed). Used to bypass the 7-day cooldown so the user isn't
  // stuck with a buggy Pass Plan.
  function _isCorruptedPassPlan(record) {
    if (!record || !record.passPlan) return false;
    const p = record.passPlan;
    // Signature: 0% accuracy AND seededCount < questionCount
    // (a legitimate 0% would seed every question)
    if (typeof p.accPct === 'number' && p.accPct === 0
        && typeof p.seededCount === 'number'
        && typeof p.questionCount === 'number'
        && p.seededCount < p.questionCount) {
      return true;
    }
    // Secondary signature: predicted floored at 420 with non-zero correct count
    // (the Pass Plan thought you got 0% but your raw correct says otherwise)
    if (typeof p.predicted === 'number' && p.predicted === 420
        && typeof p.correctCount === 'number' && p.correctCount > 0) {
      return true;
    }
    return false;
  }

  // v4.81.7: cooldown softened from hard-block to confirm-dialog. Pre-fix,
  // users stuck with a buggy Pass Plan (like the v4.81.5 0%-bug) couldn't
  // retake for 7 days. Now: if cooldown is active, show a soft confirm;
  // if the stored Pass Plan is detectably corrupted, bypass cooldown
  // entirely (no confirm — just retake).
  function retakeDiagnostic() {
    const record = (typeof loadDiagnostic === 'function') ? loadDiagnostic() : null;
    if (_isCorruptedPassPlan(record)) {
      // Auto-bypass: the stored Plan is from a known bug version
      if (typeof showToast === 'function') {
        showToast('Your last Pass Plan was affected by a fixed bug · retaking now', 'info', 4000);
      }
      startDiagnostic();
      return;
    }
    const days = getDiagnosticCooldownDays();
    if (days === null || days === 0) {
      startDiagnostic();
      return;
    }
    // Soft confirm — cooldown was a UX hint, not a hard rule
    const msg = 'Your last diagnostic was ' + (DIAGNOSTIC_RETAKE_COOLDOWN_DAYS - days) + ' day' + (DIAGNOSTIC_RETAKE_COOLDOWN_DAYS - days === 1 ? '' : 's') +
      ' ago. The 7-day cooldown is a UX hint to let your Pass Plan settle, not a hard limit. Retake anyway?';
    if (confirm(msg)) {
      startDiagnostic();
    }
  }

  // "Open ACL PBQ →" CTA on the Pass Plan completion screen.
  function aclOpenFromPassPlan() {
    if (typeof openAclPbqPicker === 'function') openAclPbqPicker();
    else goSetup();
  }

  // "Start today's session →" CTA on the Pass Plan completion screen.
  function closePassPlanReview() {
    goSetup();
  }

  // v7.52.0: render the account Pass Plan home, tier-aware. Free = one plan
  // card + locked-cert upsell; Pro = a plan per diagnosed cert + "diagnose
  // another". Ported from the approved mockup Section 2.

  // Short "Taken Jun 14" style date for the Pass Plan cards.
  function _passPlanDate(ms) {
    if (!ms) return '';
    try {
      return 'Taken ' + new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (_) { return ''; }
  }

  // Lock chip SVG (padlock), reused by the Free upsell cert chips.
  function _passPlanLockSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<rect x="5" y="11" width="14" height="9" rx="2" stroke="var(--text-dim)" stroke-width="2"/>' +
      '<path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="var(--text-dim)" stroke-width="2"/></svg>';
  }

  // Shared: the single current-cert plan card from the on-file diagnostic, or
  // the "take the baseline diagnostic" empty state. Used by both the Free path
  // and the browser-tab Pro path so each cert shows only its own plan. <80 lines.
  function _passPlanCurrentCertCardHtml() {
    var rec = (typeof loadDiagnostic === 'function') ? loadDiagnostic() : null;
    var pp = rec && rec.passPlan;
    var certName = (typeof CERT_PACK !== 'undefined' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.name)
      ? CERT_PACK.meta.name : 'CompTIA Network+';
    if (!pp) {
      return '<div class="plan-card pp-empty">' +
          '<p class="pp-empty-h">Take the baseline diagnostic</p>' +
          '<p class="pp-empty-sub">20 questions across every domain build your Pass Plan, your readiness and the topics to drill first.</p>' +
          '<button type="button" class="btn btn-primary btn-sm" data-act="pp-empty">Start the diagnostic</button>' +
        '</div>';
    }
    var prob = Math.round((pp.passProbability || 0) * 100);
    var weak = (pp.weakDomains || []).slice(0, 2).map(function (d) {
      return '<b>' + escHtml(d.label || d.key || '') + '</b>';
    }).join(', ');
    var detail = (typeof pp.correctCount === 'number' && typeof pp.questionCount === 'number')
      ? (pp.correctCount + ' of ' + pp.questionCount + ' correct')
      : ((typeof pp.accPct === 'number') ? (pp.accPct + '% accuracy') : '');
    return '<div class="plan-card">' +
        '<div class="pcard-eyebrow"><span>' + escHtml(certName) + '</span><span>' + escHtml(_passPlanDate(pp.completedAt)) + '</span></div>' +
        '<div class="pcard-main">' +
          '<div class="prob-ring" style="background:conic-gradient(var(--accent) 0 ' + prob + '%, var(--surface3) ' + prob + '% 100%)">' +
            '<div class="inner"><span class="pct">' + prob + '%</span><span class="lbl">pass</span></div></div>' +
          '<div class="pcard-detail">' +
            (detail ? '<p class="meta">' + escHtml(detail) + '</p>' : '') +
            (weak ? '<p class="weak">Weakest: ' + weak + '</p>' : '') +
          '</div>' +
        '</div>' +
        '<div class="pcard-cta">' +
          '<button type="button" class="btn btn-primary btn-sm" data-act="pp-view">View full plan</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" style="width:auto" data-act="pp-retake">Retake</button>' +
        '</div>' +
      '</div>';
  }

  // Free tier: one plan card from the on-file diagnostic (or an empty state),
  // then the locked-certs Pro upsell. Stays under 80 lines.

  // Browser tab, Pro user: just the current cert's single plan card. Each cert is
  // its own subdomain in a browser, so no multi-cert list and no upsell here.

  // Free upsell: the Pro certs as locked chips + a launch-waitlist button.
  function _passPlanLockedCertsHtml() {
    var certs = (typeof window.getAvailableCerts === 'function')
      ? window.getAvailableCerts('user').filter(function (c) { return c.tier === 'pro'; }) : [];
    if (!certs.length) return '';
    var chips = certs.map(function (c) {
      return '<span class="cert-chip">' + _passPlanLockSvg() + escHtml(c.name) + '</span>';
    }).join('');
    return '<div class="locked-certs">' +
      '<p class="locked-h">Every other cert, one plan each</p>' +
      '<p class="locked-sub">Pro unlocks a baseline diagnostic and Pass Plan for every cert, plus unlimited questions instead of 15 questions a day.</p>' +
      '<div class="cert-chips">' + chips + '</div>' +
      '<button type="button" class="btn btn-primary btn-full btn-sm" data-act="pp-pro">Get Pro at launch &middot; $9.99/mo</button>' +
    '</div>';
  }

  // Pro tier: a plan row per diagnosed cert (from the readiness snapshots),
  // plus "diagnose another cert". Stays under 80 lines.

  // Bind the Pass Plan section's data-act controls to existing app flows.

  // v7.52.0: Pro "Diagnose another cert" picker. Lists the certs and switches
  // to the chosen one via tadSwitchCert (Pro-gated internally), which loads
  // that cert so the user can run its baseline diagnostic.
  function _showPassPlanCertPicker() {
    var certs = (typeof window.getAvailableCerts === 'function') ? window.getAvailableCerts('user') : [];
    if (!certs.length) return;
    var prev = document.getElementById('pp-cert-picker');
    if (prev) prev.remove();
    var rows = certs.map(function (c) {
      return '<button type="button" class="pp-pick-row" data-cert="' + escHtml(c.id) + '">' +
        '<span class="pp-pick-glyph">' + escHtml(c.glyph || '') + '</span>' +
        '<span class="pp-pick-body"><span class="pp-pick-name">' + escHtml(c.name) + '</span>' +
        '<span class="pp-pick-code">' + escHtml(c.code || '') + '</span></span></button>';
    }).join('');
    var modal = document.createElement('div');
    modal.id = 'pp-cert-picker';
    modal.className = 'quota-exceeded-modal';
    modal.innerHTML =
      '<div class="dlpb-card" role="dialog" aria-modal="true" aria-label="Diagnose another cert">' +
        '<h2 class="dlpb-title">Diagnose another cert</h2>' +
        '<p class="dlpb-lede">Pick a cert to load, then run its baseline diagnostic.</p>' +
        '<div class="pp-pick-list">' + rows + '</div>' +
        '<button type="button" class="dlpb-ghost" data-act="pp-pick-close">Close</button>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelectorAll('.pp-pick-row').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-cert');
        modal.remove();
        if (id && typeof tadSwitchCert === 'function') tadSwitchCert(id);
      });
    });
    var close = modal.querySelector('[data-act="pp-pick-close"]');
    if (close) close.addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  }

  // Render the home-page diagnostic surface. Three states:
  // 1. CTA visible (no diagnostic taken, or session-dismissed=false)
  // 2. Pass Plan tile visible (diagnostic completed)
  // 3. Both hidden (session-dismissed during this session)
  function renderDiagnosticSurface() {
    const ctaCard = document.getElementById('diagnostic-cta-card');
    const tile = document.getElementById('pass-plan-tile');
    if (!ctaCard || !tile) return;

    const record = loadDiagnostic();
    if (record && record.passPlan) {
      // Show Pass Plan tile, hide CTA
      ctaCard.classList.add('is-hidden');
      tile.classList.remove('is-hidden');
      const sub = document.getElementById('pass-plan-tile-sub');
      if (sub) {
        const probPct = Math.round(record.passPlan.passProbability * 100);
        const ageMs = Date.now() - record.completedAt;
        const ageDays = Math.floor(ageMs / 86400000);
        const ageStr = ageDays === 0 ? 'today' : ageDays === 1 ? '1 day ago' : ageDays + ' days ago';
        sub.textContent = 'Diagnostic complete · ' + ageStr + ' · ' + probPct + '% pass probability';
      }
      const retake = document.getElementById('pass-plan-tile-retake');
      if (retake) {
        // v4.81.7: detect corrupted Pass Plan from a known bug version and
        // surface "Retake now (fix bug)" so the user knows they're not stuck
        if (_isCorruptedPassPlan(record)) {
          retake.textContent = 'Retake (fix bug result)';
          retake.classList.remove('pass-plan-tile-cooldown');
          retake.title = 'Your last Pass Plan was affected by a known bug · click to retake immediately';
          // Override the sub-line too — show the user this isn't a real result
          if (sub) sub.textContent = '⚠ Last Pass Plan affected by a fixed bug · click "Retake" to get a real result';
        } else {
          const days = getDiagnosticCooldownDays();
          if (days === 0) {
            retake.textContent = 'Retake now';
            retake.classList.remove('pass-plan-tile-cooldown');
          } else {
            // v4.81.7: cooldown is now soft — still show the day count as a hint,
            // but remove the cursor-default styling. Click confirms via dialog.
            retake.textContent = 'Retake (last: ' + (DIAGNOSTIC_RETAKE_COOLDOWN_DAYS - days) + 'd ago)';
            retake.classList.remove('pass-plan-tile-cooldown');
          }
        }
      }
      return;
    }

    // No diagnostic on file — show CTA unless dismissed this session
    tile.classList.add('is-hidden');
    if (_diagnosticCtaSessionDismissed) {
      ctaCard.classList.add('is-hidden');
    } else {
      ctaCard.classList.remove('is-hidden');
    }
  }


  function openAclPbqPicker() {
    showPage('acl-pbq');
    const picker = document.getElementById('acl-pbq-picker');
    const host = document.getElementById('acl-pbq-host');
    if (host) host.innerHTML = '';
    if (!picker) return;
    picker.hidden = false;
    picker.innerHTML = '<div class="acl-picker-grid">'
      + ACL_PBQ_BANK.map(s => {
        return '<button type="button" class="acl-picker-card" onclick="startAclPbq(\'' + s.id + '\')">'
          + '<span class="acl-picker-eyebrow">' + escHtml(s.domain) + ' &middot; ' + escHtml(s.difficulty) + '</span>'
          + '<span class="acl-picker-title">' + escHtml(s.title) + '</span>'
          + '<span class="acl-picker-rules">' + s.rules.length + ' rules &middot; ' + s.testTraffic.length + ' test packets</span>'
          + '</button>';
      }).join('')
      + '</div>';
  }

  function startAclPbq(scenarioId) {
    const scenario = ACL_PBQ_BANK.find(s => s.id === scenarioId);
    if (!scenario) return;
    // Shuffle the rules so the user genuinely orders them. Keep a stable
    // shuffle — just reverse the canonical correctOrder for now (deterministic
    // but not the same as correct).
    const shuffledIds = [...scenario.rules.map(r => r.id)].reverse();
    _aclPbqState = {
      scenario,
      currentOrder: shuffledIds,
      submitted: false,
      trafficResults: null,
      score: null
    };
    document.getElementById('acl-pbq-picker').hidden = true;
    _renderAclPbq();
  }

  function _renderAclPbq() {
    const host = document.getElementById('acl-pbq-host');
    if (!host || !_aclPbqState) return;
    const s = _aclPbqState.scenario;
    const order = _aclPbqState.currentOrder;
    const submitted = _aclPbqState.submitted;

    // Build rule list in current order
    const rulesHtml = '<div class="acl-rules-list">'
      + order.map((rid, idx) => {
        const r = s.rules.find(x => x.id === rid);
        if (!r) return '';
        const actionCls = r.action === 'allow' ? 'is-allow' : 'is-deny';
        return '<div class="acl-rule-row ' + actionCls + '" data-rule-id="' + rid + '">'
          + '<div class="acl-rule-priority">' + (idx + 1) + '</div>'
          + '<div class="acl-rule-body">'
          + '<div class="acl-rule-action">' + r.action.toUpperCase() + '</div>'
          + '<div class="acl-rule-desc">' + escHtml(r.desc) + '</div>'
          + '<div class="acl-rule-detail"><code>' + escHtml(r.proto) + ' ' + escHtml(r.src) + ' &rarr; ' + escHtml(r.dst) + ' :' + escHtml(r.port) + '</code></div>'
          + '</div>'
          + '<div class="acl-rule-controls">'
          + '<button type="button" class="acl-arrow-btn" onclick="aclMoveRule(\'' + rid + '\', -1)" ' + (idx === 0 ? 'disabled' : '') + ' aria-label="Move up">&#9650;</button>'
          + '<button type="button" class="acl-arrow-btn" onclick="aclMoveRule(\'' + rid + '\', 1)" ' + (idx === order.length - 1 ? 'disabled' : '') + ' aria-label="Move down">&#9660;</button>'
          + '</div>'
          + '</div>';
      }).join('')
      + '<div class="acl-rule-row acl-rule-implicit"><div class="acl-rule-priority">' + (order.length + 1) + '</div>'
      + '<div class="acl-rule-body"><div class="acl-rule-action">DENY</div>'
      + '<div class="acl-rule-desc">Implicit deny (always last)</div>'
      + '<div class="acl-rule-detail"><code>any any → any :any</code></div></div></div>'
      + '</div>';

    // Test traffic section
    let trafficHtml = '<div class="acl-traffic-section">'
      + '<div class="acl-traffic-label">Test traffic — what should each packet do?</div>'
      + '<div class="acl-traffic-list">'
      + s.testTraffic.map(t => {
        let resultBadge = '';
        if (submitted && _aclPbqState.trafficResults) {
          const result = _aclPbqState.trafficResults.find(r => r.id === t.id);
          if (result) {
            const ok = result.actual === t.expected;
            const badge = ok ? '✓' : '✗';
            const cls = ok ? 'acl-traffic-correct' : 'acl-traffic-wrong';
            resultBadge = '<span class="acl-traffic-result ' + cls + '">'
              + badge + ' '
              + 'matched rule ' + (result.matchedAt + 1) + ' &middot; ' + result.actual.toUpperCase()
              + (ok ? '' : ' (expected ' + t.expected.toUpperCase() + ')')
              + '</span>';
          }
        }
        return '<div class="acl-traffic-row">'
          + '<div class="acl-traffic-label-cell">' + escHtml(t.label) + '</div>'
          + '<div class="acl-traffic-detail"><code>' + escHtml(t.proto) + ' ' + escHtml(t.src) + ' &rarr; ' + escHtml(t.dst) + ':' + escHtml(t.port) + '</code></div>'
          + '<div class="acl-traffic-expected">expected: <strong>' + t.expected.toUpperCase() + '</strong></div>'
          + resultBadge
          + '</div>';
      }).join('')
      + '</div></div>';

    // Submit / Result section
    let submitHtml = '';
    if (!submitted) {
      submitHtml = '<button type="button" class="btn btn-primary btn-full acl-submit-btn" onclick="submitAclPbq()">'
        + 'Run test traffic + submit answer'
        + '</button>';
    } else {
      const score = _aclPbqState.score;
      const orderMatch = _aclPbqState.orderMatch;
      const trafficMatch = _aclPbqState.trafficMatch;
      let scoreCls = 'good';
      if (score < 70) scoreCls = 'warn';
      if (score < 50) scoreCls = 'bad';
      submitHtml = '<div class="acl-result-card ' + scoreCls + '">'
        + '<div class="acl-result-score">' + score + '%</div>'
        + '<div class="acl-result-breakdown">'
        + '<div>Rule order: <strong>' + orderMatch + '%</strong> (70% weight)</div>'
        + '<div>Test traffic: <strong>' + trafficMatch + '%</strong> (30% weight)</div>'
        + '</div>'
        + '<div class="acl-result-explanation">'
        + '<strong>Why:</strong> ' + escHtml(s.explanation)
        + '</div>'
        + '<div class="acl-result-actions">'
        + '<button type="button" class="btn btn-secondary" onclick="startAclPbq(\'' + s.id + '\')">Retry</button>'
        + '<button type="button" class="btn btn-primary" onclick="openAclPbqPicker()">Pick another scenario</button>'
        + '</div>'
        + '</div>';
    }

    host.innerHTML = '<div class="acl-pbq-card">'
      + '<div class="acl-goal">'
      + '<div class="acl-goal-eyebrow">Goal · ' + escHtml(s.domain) + ' &middot; ' + escHtml(s.difficulty) + '</div>'
      + '<div class="acl-goal-text">' + escHtml(s.goal) + '</div>'
      + (s.hint && !submitted ? '<div class="acl-goal-hint">' + escHtml(s.hint) + '</div>' : '')
      + '</div>'
      + '<div class="acl-rules-section">'
      + '<div class="acl-rules-label">Rules (top-down · first match wins)</div>'
      + rulesHtml
      + '</div>'
      + trafficHtml
      + submitHtml
      + '</div>';
  }

  function aclMoveRule(ruleId, direction) {
    if (!_aclPbqState || _aclPbqState.submitted) return;
    const order = _aclPbqState.currentOrder;
    const idx = order.indexOf(ruleId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= order.length) return;
    // Swap
    [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
    _renderAclPbq();
  }

  // Walk a packet through the user's rule order, return the first matching
  // rule's action (or 'deny' if no explicit match — implicit deny).
  // Note: namespaced as `_aclPbq*` to avoid collision with the v4.52.0
  // topology-builder ACL evaluator (`_aclRuleMatches` / `_aclEvalPacket` /
  // `_aclCidrContains`) which has a different rule-row schema.
  function _aclPbqMatchPacket(packet, rules, order) {
    for (let i = 0; i < order.length; i++) {
      const rule = rules.find(r => r.id === order[i]);
      if (!rule) continue;
      if (_aclPbqRuleMatches(rule, packet)) {
        return { action: rule.action, matchedAt: i };
      }
    }
    return { action: 'deny', matchedAt: order.length }; // implicit deny
  }

  function _aclPbqRuleMatches(rule, packet) {
    if (rule.proto !== 'any' && rule.proto !== packet.proto) return false;
    if (rule.port !== 'any' && rule.port !== packet.port) return false;
    if (!_aclPbqCidrMatch(rule.src, packet.src)) return false;
    if (!_aclPbqCidrMatch(rule.dst, packet.dst)) return false;
    return true;
  }

  function _aclPbqCidrMatch(rulePattern, ip) {
    if (rulePattern === 'any') return true;
    if (rulePattern.indexOf('/') === -1) {
      return rulePattern === ip;
    }
    const [network, prefixStr] = rulePattern.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
    const netInt = _aclPbqIpToInt(network);
    const ipInt = _aclPbqIpToInt(ip);
    if (netInt === null || ipInt === null) return false;
    const mask = prefix === 0 ? 0 : (-1 << (32 - prefix)) >>> 0;
    return (netInt & mask) === (ipInt & mask);
  }

  function _aclPbqIpToInt(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    let result = 0;
    for (let i = 0; i < 4; i++) {
      const n = parseInt(parts[i], 10);
      if (isNaN(n) || n < 0 || n > 255) return null;
      result = (result << 8) | n;
    }
    return result >>> 0;
  }

  function submitAclPbq() {
    if (!_aclPbqState || _aclPbqState.submitted) return;
    const s = _aclPbqState.scenario;
    const order = _aclPbqState.currentOrder;

    // Score 1: rule order match (70% weight)
    let orderCorrect = 0;
    for (let i = 0; i < s.correctOrder.length; i++) {
      if (order[i] === s.correctOrder[i]) orderCorrect++;
    }
    const orderMatch = Math.round((orderCorrect / s.correctOrder.length) * 100);

    // Score 2: test traffic match (30% weight)
    const trafficResults = s.testTraffic.map(t => {
      const match = _aclPbqMatchPacket(t, s.rules, order);
      return {
        id: t.id,
        label: t.label,
        expected: t.expected,
        actual: match.action,
        matchedAt: match.matchedAt
      };
    });
    const trafficCorrect = trafficResults.filter(r => r.actual === r.expected).length;
    const trafficMatch = Math.round((trafficCorrect / s.testTraffic.length) * 100);

    // Combined score
    const score = Math.round(orderMatch * 0.70 + trafficMatch * 0.30);

    _aclPbqState.submitted = true;
    _aclPbqState.trafficResults = trafficResults;
    _aclPbqState.score = score;
    _aclPbqState.orderMatch = orderMatch;
    _aclPbqState.trafficMatch = trafficMatch;
    _renderAclPbq();
  }

  // Window expose — HTML onclick targets, settings.js callers, and cross-module typeof-guarded calls.
  window.startDiagnostic               = startDiagnostic;
  window.renderDiagnosticSurface       = renderDiagnosticSurface;
  window.dismissDiagnosticCta          = dismissDiagnosticCta;
  window.viewPassPlan                  = viewPassPlan;
  window.retakeDiagnostic              = retakeDiagnostic;
  window.quitDiagnostic                = quitDiagnostic;
  window.setDiagnosticConfidence       = setDiagnosticConfidence;
  window.submitDiagnosticAnswer        = submitDiagnosticAnswer;
  window.closePassPlanReview           = closePassPlanReview;
  window.aclOpenFromPassPlan           = aclOpenFromPassPlan;
  window.startAclPbq                   = startAclPbq;
  window.aclMoveRule                   = aclMoveRule;
  window.submitAclPbq                  = submitAclPbq;
  window.openAclPbqPicker              = openAclPbqPicker;
  window._passPlanCurrentCertCardHtml  = _passPlanCurrentCertCardHtml;
  window._passPlanLockedCertsHtml      = _passPlanLockedCertsHtml;
  window._showPassPlanCertPicker       = _showPassPlanCertPicker;

  window._certanvilFeatures['diagnostic'] = {
    enter: startDiagnostic,
    startDiagnostic: startDiagnostic
  };
})();
