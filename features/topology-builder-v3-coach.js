/* ════════════════════════════════════════════════════════════════════
 * TB v3 Phase 9 — Coach v2 (editorial redesign)
 * ════════════════════════════════════════════════════════════════════
 *
 * Built to the locked mockup at mockups/tb-v3-coach-v2-concept.html
 * with the 4 skill lenses applied:
 *   • ui-ux-pro-max — focus rings, 44px touch, labels, aria-live
 *   • taste-skill (editorial-premium) — Fraunces title, hairline rules,
 *     no card-spam, real empty + loading states
 *   • emil-design-eng — ease-out entries, hover-fine gate, reduced-motion,
 *     stagger on hint rows, transform-origin
 *   • humanizer — no em-dashes in copy, no rule-of-three, no "underscores"
 *
 * Architecture
 *   • In-memory ephemeral state (_coachState) — wipes on reload
 *   • localStorage cache via 'tbV3CoachCache' (24h TTL, djb2 key)
 *   • Per-day AI counter in localStorage (resets daily)
 *   • Real BYOK provider via _claudeFetch (Sonnet, MAX_TOKENS_TEACHER_COACH)
 *   • System prompt forces plain text + must cite a hostname every reply
 *
 * The Coach is read-only relative to canvas state. It reads via
 * window._getState() and never mutates state.devices / state.cables.
 * ──────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var COACH_VERSION = '2.0.0';
  var COUNTER_KEY   = 'tbV3CoachCounter';
  var CACHE_KEY     = 'tbV3CoachCache';
  var CACHE_TTL_MS  = 24 * 60 * 60 * 1000;

  /* The Coach system prompt. Two rules carry the weight:
   *   1. Plain text only (no markdown headers, no asterisks)
   *   2. Cite at least one device on the student's canvas by hostname
   * Without rule 2 the AI defaults to abstract textbook prose, which is
   * what made v1 feel like a generic chatbot. */
  var PERSONA =
    'You are a Network+ (N10-009) tutor inside the Topology Builder. ' +
    'Reply in plain English prose only. No markdown headers, no asterisks, ' +
    'no bullet lists, no code blocks. ' +
    'Cite at least one device on the student canvas by its hostname in ' +
    'your first paragraph. ' +
    'Keep replies under 220 words across two or three short paragraphs. ' +
    'Never reveal the PBQ answer when a lesson is active. ' +
    'Stay on Topology Builder topics. Do not begin with greetings like ' +
    'Great question or Sure or Here is.';

  /* ── In-memory UI state (wipes on reload) ──────────────────────── */
  var _coachState = {
    activePbqId: null,
    currentStepIndex: 0,
    hintsUsed: 0,
    fbMessages: [],
    fbInput: '',
    isThinking: false,
    panelCollapsed: false,
  };

  function getState() { return _coachState; }
  function setState(patch) {
    if (!patch) return _coachState;
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) _coachState[k] = patch[k];
    }
    return _coachState;
  }

  /* ── Canvas state subscription (read-only) ─────────────────────── */
  function getCanvasState() {
    try {
      if (typeof window !== 'undefined' && typeof window._getState === 'function') {
        var s = window._getState() || {};
        return {
          devices: Array.isArray(s.devices) ? s.devices : [],
          cables: Array.isArray(s.cables) ? s.cables : [],
          intent: s.intent || 'free-build',
          activeScenarioId: s.activeScenarioId || null,
        };
      }
    } catch (_) {}
    return { devices: [], cables: [], intent: 'free-build', activeScenarioId: null };
  }

  /* ── Mode detection ────────────────────────────────────────────── */
  function getCoachMode() {
    var s = getState();
    if (!s.activePbqId) return 'fb';
    var catalog = (typeof window !== 'undefined' && window.TB_V3_PBQS) || [];
    var pbq = catalog.find(function (p) { return p.id === s.activePbqId; });
    if (!pbq || typeof s.currentStepIndex !== 'number') return 'fb';
    if (s.currentStepIndex >= pbq.steps.length) return 'fb';
    return 'pbq';
  }

  function getActivePbq() {
    var s = getState();
    if (!s.activePbqId) return null;
    var catalog = (typeof window !== 'undefined' && window.TB_V3_PBQS) || [];
    return catalog.find(function (p) { return p.id === s.activePbqId; }) || null;
  }

  function getCurrentStep() {
    var pbq = getActivePbq();
    if (!pbq) return null;
    return pbq.steps[getState().currentStepIndex] || null;
  }

  function isStepComplete() {
    var step = getCurrentStep();
    if (!step || typeof step.check !== 'function') return false;
    try { return !!step.check(getCanvasState()); } catch (_) { return false; }
  }

  function advanceStep() {
    var s = getState();
    return setState({ currentStepIndex: s.currentStepIndex + 1, hintsUsed: 0 });
  }

  /* ── Per-day AI counter ────────────────────────────────────────── */
  function _todayISO() {
    var d = new Date(); var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function getCounter() {
    try {
      var raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(COUNTER_KEY) : null;
      if (!raw) return { date: _todayISO(), count: 0 };
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.date !== _todayISO()) return { date: _todayISO(), count: 0 };
      return parsed;
    } catch (_) { return { date: _todayISO(), count: 0 }; }
  }
  function incrementCounter() {
    var c = getCounter();
    var next = { date: c.date, count: (c.count || 0) + 1 };
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(COUNTER_KEY, JSON.stringify(next)); }
    catch (_) {}
    return next;
  }

  /* ── localStorage cache (24h TTL, djb2 key) ────────────────────── */
  function _hash(input) {
    var s = (typeof input === 'string') ? input : JSON.stringify(input || '');
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return 'k' + (h >>> 0).toString(16);
  }
  function _loadCache() {
    try {
      if (typeof localStorage === 'undefined') return {};
      var raw = localStorage.getItem(CACHE_KEY);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (_) { return {}; }
  }
  function _saveCache(obj) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(CACHE_KEY, JSON.stringify(obj)); }
    catch (_) {}
  }
  function cacheKey(input) { return _hash(input); }
  function cacheGet(input) {
    var c = _loadCache(); var k = _hash(input); var v = c[k];
    if (!v || !v.text) return null;
    if (Date.now() - (v.t || 0) > CACHE_TTL_MS) return null;
    return v.text;
  }
  function cacheSet(input, text) {
    var c = _loadCache(); c[_hash(input)] = { t: Date.now(), text: String(text || '') };
    _saveCache(c);
  }

  /* ── Prompt builder ────────────────────────────────────────────── */
  function buildPrompt(input) {
    input = input || {};
    var canvas = getCanvasState();
    var devicesShort = canvas.devices.map(function (d) {
      return {
        hostname: d.hostname || d.id,
        type: d.type,
        ip: (d.config && d.config.ip) || null,
      };
    });
    var cablesShort = canvas.cables.map(function (c) {
      return { from: c.from, to: c.to, type: c.type || 'cat6' };
    });
    var canvasBlock =
      'STUDENT CANVAS:\n' +
      '  devices: ' + JSON.stringify(devicesShort) + '\n' +
      '  cables: '  + JSON.stringify(cablesShort);

    var mode = input.mode || getCoachMode();
    var pbqBlock = '';
    if (mode === 'pbq') {
      var pbq = getActivePbq();
      var step = getCurrentStep();
      if (pbq && step) {
        pbqBlock =
          'LESSON: ' + pbq.id + ' · objective ' + (pbq.objective || '?') + '\n' +
          'CURRENT STEP: ' + step.id + ' — ' + step.instruction + '\n' +
          'HINTS USED: ' + getState().hintsUsed + ' of 3 scripted hints.\n' +
          'AI-PROMPT-SEED: ' + (step.aiPromptSeed || '').replace('{{state}}', JSON.stringify(devicesShort));
      }
    }

    var question = input.question || '';
    return [
      PERSONA,
      'MODE: ' + mode + '.',
      canvasBlock,
      pbqBlock,
      question ? 'STUDENT QUESTION: ' + question : '',
    ].filter(function (line) { return !!line; }).join('\n\n');
  }

  /* ── Markdown sanitizer (humanizer enforces plain text; belt + suspenders) */
  function _stripMarkdown(text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/—/g, ', ')
      .replace(/—/g, ', ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function _withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () {
        var e = new Error('timeout'); e.code = 'timeout'; reject(e);
      }, ms);
      Promise.resolve(promise).then(
        function (v) { clearTimeout(t); resolve(v); },
        function (e) { clearTimeout(t); reject(e); }
      );
    });
  }

  function defaultProvider(prompt) {
    var fetchFn = (typeof _claudeFetch === 'function') ? _claudeFetch
      : (typeof window !== 'undefined' && typeof window._claudeFetch === 'function') ? window._claudeFetch
      : null;
    if (!fetchFn) {
      var e = new Error('Coach is unavailable. The chat service is not loaded.');
      e.code = 'no-fetch'; return Promise.reject(e);
    }
    var model = (typeof CLAUDE_TEACHER_MODEL === 'string' && CLAUDE_TEACHER_MODEL) ||
      (typeof window !== 'undefined' && window.CLAUDE_TEACHER_MODEL) || 'claude-sonnet-4-6';
    var maxTokens = (typeof MAX_TOKENS_TEACHER_COACH === 'number' && MAX_TOKENS_TEACHER_COACH) ||
      (typeof window !== 'undefined' && window.MAX_TOKENS_TEACHER_COACH) || 800;
    var key = null;
    try {
      if (typeof STORAGE !== 'undefined' && STORAGE && STORAGE.KEY) {
        key = localStorage.getItem(STORAGE.KEY);
      } else if (typeof localStorage !== 'undefined') {
        key = localStorage.getItem('nplus_api_key');
      }
    } catch (_) {}
    var headers = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
    if (key) headers['x-api-key'] = key;
    return fetchFn({
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        _metered: true,
      }),
    }).then(function (res) {
      if (!res) { var n = new Error('No response from the chat service.'); n.code = 'network'; throw n; }
      if (res.status === 429) { var q = new Error('Daily quota reached. The Coach will reset tomorrow.'); q.status = 429; throw q; }
      if (!res.ok) { var a = new Error('Chat service returned an error (' + res.status + ').'); a.status = res.status; throw a; }
      return res.json();
    }).then(function (data) {
      var raw = (data && data.content && data.content[0] && data.content[0].text) || '';
      var clean = _stripMarkdown(raw);
      if (!clean) { var e = new Error('Empty reply from the chat service.'); e.code = 'empty'; throw e; }
      return clean;
    });
  }

  function askAI(input, opts) {
    opts = opts || {};
    var provider = opts.provider || defaultProvider;
    var timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 12000;
    var prompt = buildPrompt(input);
    var cacheable = _hash(prompt);
    var cached = cacheGet(cacheable);
    if (cached) return Promise.resolve({ text: cached, cached: true });
    return _withTimeout(
      Promise.resolve().then(function () { return provider(prompt); }),
      timeoutMs
    ).then(function (text) {
      cacheSet(cacheable, text);
      incrementCounter();
      return { text: text, cached: false };
    });
  }

  /* ── FB narration (scripted; no AI involved) ──────────────────── */
  var NARRATION = {
    'device-added': function (e) {
      var dev = (e && e.device) || {};
      var type = dev.type || '';
      var hostname = dev.hostname || dev.id || '(this device)';
      var map = {
        'router':       'Routers move packets between subnets. {h} is now sitting on its LAN side and waiting for a WAN link.',
        'soho-router':  'A SOHO router is converged. {h} does routing, switching, DHCP, and NAT all in one box.',
        'switch':       'Switches forward frames inside a subnet at L2. {h} extends the broadcast domain.',
        'l3-switch':    'L3 switches route between VLANs without a separate router. {h} can do inter-VLAN routing.',
        'pc':           'Endpoints sit at the edge of the network. {h} originates traffic and receives replies.',
        'workstation':  'Endpoints sit at the edge of the network. {h} originates traffic and receives replies.',
        'phone':        '{h} is an IP phone. It joins the data network but usually on a separate voice VLAN.',
        'printer':      '{h} is an endpoint that other hosts reach by IP or hostname.',
        'isp':          '{h} represents the WAN side. Anything beyond it leaves your control.',
        'firewall':     '{h} inspects traffic crossing a boundary and decides what passes.',
        'ap':           '{h} bridges wireless clients onto the wired side.',
        'wap':          '{h} bridges wireless clients onto the wired side.',
        'wlc':          '{h} is the wireless controller. The APs report to it.',
      };
      var template = map[type];
      if (!template) return null;
      return template.replace(/\{h\}/g, hostname);
    },
    'cable-drawn': function () {
      return 'Cables are L1. Protocol decisions happen on the devices at each end of this link.';
    },
    'device-deleted': function () { return null; },
    'cable-deleted': function () { return null; },
  };
  function narrateAction(event) {
    if (!event || !event.type) return null;
    var fn = NARRATION[event.type]; if (!fn) return null;
    var msg = fn(event);
    return (typeof msg === 'string' && msg.length > 0) ? msg : null;
  }

  /* ── PBQ stuck-escape hint cascade ─────────────────────────────── */
  function useHint() {
    var step = getCurrentStep();
    if (!step) return null;
    var hints = Array.isArray(step.hints) ? step.hints : [];
    var used = getState().hintsUsed;
    if (used < 3 && used < hints.length) {
      setState({ hintsUsed: used + 1 });
      return { kind: 'scripted', index: used, text: hints[used] };
    }
    if (used >= 3 || used >= hints.length) {
      setState({ isThinking: true, hintsUsed: Math.max(used, 3) });
      return askAI({ mode: 'pbq', question: 'Help me past this step.' }).then(
        function (result) {
          setState({ isThinking: false });
          return { kind: 'ai-escape', text: result.text, cached: !!result.cached };
        },
        function (err) {
          setState({ isThinking: false });
          var msg = (err && err.message) || 'I could not reach the tutor.';
          return { kind: 'error', text: msg };
        }
      );
    }
    return null;
  }

  /* ── DOM helper ────────────────────────────────────────────────── */
  function el(tag, opts, children) {
    var n = document.createElement(tag);
    opts = opts || {};
    Object.keys(opts).forEach(function (k) {
      if (k === 'text') { n.textContent = String(opts[k]); }
      else if (k === 'class') { n.className = String(opts[k]); }
      else if (k === 'style' && typeof opts[k] === 'string') { n.setAttribute('style', opts[k]); }
      else if (k.indexOf('aria-') === 0 || k === 'role' || k === 'tabindex' || k === 'for') { n.setAttribute(k, opts[k]); }
      else if (k.indexOf('data-') === 0) { n.setAttribute(k, opts[k]); }
      else { try { n[k] = opts[k]; } catch (_) {} }
    });
    if (Array.isArray(children)) {
      children.forEach(function (c) {
        if (c == null) return;
        if (typeof c === 'string') n.appendChild(document.createTextNode(c));
        else if (c.nodeType) n.appendChild(c);
      });
    }
    return n;
  }

  /* ════════════════════════════════════════════════════════════
   * RENDER — matches mockups/tb-v3-coach-v2-concept.html
   * ════════════════════════════════════════════════════════════ */
  function renderHeader() {
    var mode = getCoachMode();
    var pbq = getActivePbq();
    var eyebrowText, titleText, titleEm, contextText;
    if (mode === 'pbq' && pbq) {
      eyebrowText = 'Lesson · N10-009 · ' + (pbq.objective || '');
      titleText   = (pbq.id === 'soho-network-converged') ? 'SOHO converged ' : 'Lesson ';
      titleEm     = 'network.';
      contextText = pbq.task || 'Build the topology described in each step.';
    } else {
      eyebrowText = 'Free Build · N10-009';
      titleText   = 'Coach.';
      titleEm     = '';
      contextText = (getState().fbMessages.length === 0)
        ? 'Drop devices, draw cables, ask anything that puzzles you.'
        : 'Ask anything about what you are building.';
    }
    var titleNode = el('div', { class: 'tb3v2c__title' }, [
      titleText,
      titleEm ? el('em', { text: titleEm }) : null,
    ]);
    return el('header', { class: 'tb3v2c__head' }, [
      el('div', { class: 'tb3v2c__eyebrow', text: eyebrowText }),
      titleNode,
      el('p', { class: 'tb3v2c__context', text: contextText }),
    ]);
  }

  function renderProgressBar() {
    var pbq = getActivePbq(); if (!pbq) return null;
    var idx = getState().currentStepIndex;
    var total = pbq.steps.length;
    var pct = Math.round(((idx + 1) / total) * 100);
    return el('div', { class: 'tb3v2c__progress', 'aria-label': 'Lesson progress' }, [
      el('span', { text: 'STEP ' + (idx + 1) + ' / ' + total }),
      el('div', { class: 'tb3v2c__progress-track', 'aria-hidden': 'true' }, [
        el('div', { class: 'tb3v2c__progress-fill', style: 'width:' + pct + '%' }),
      ]),
      el('span', { text: pct + '%' }),
    ]);
  }

  function renderPbqStepCard() {
    var step = getCurrentStep(); if (!step) return null;
    return el('article', { class: 'tb3v2c__step-card' }, [
      el('div', { class: 'tb3v2c__step-num', text: 'Now' }),
      el('div', { class: 'tb3v2c__step-instruction', text: step.instruction || '' }),
    ]);
  }

  function renderHintRow(index, isUsed, isCurrent, isAi, label, text, isThinking) {
    var rowClasses = ['tb3v2c__hint-row'];
    if (isCurrent) rowClasses.push('is-current');
    else if (!isUsed) rowClasses.push('is-unused');
    if (isAi) rowClasses.push('is-ai');
    var pipClasses = ['tb3v2c__hint-pip'];
    if (isUsed) pipClasses.push('is-used');
    if (isAi) pipClasses.push('is-ai');
    return el('div', { class: rowClasses.join(' ') }, [
      el('div', { class: pipClasses.join(' '), text: isAi ? 'AI' : String(index + 1) }),
      el('div', {}, [
        el('div', { class: 'tb3v2c__hint-label', text: label }),
        el('div', { class: 'tb3v2c__hint-text', text: isThinking ? 'Reading your canvas…' : (text || 'Tap "I am stuck" to reveal.') }),
      ]),
    ]);
  }

  function renderHintCascade() {
    var step = getCurrentStep(); if (!step) return null;
    var hints = Array.isArray(step.hints) ? step.hints : [];
    var used = getState().hintsUsed;
    var thinking = getState().isThinking;
    return el('section', { class: 'tb3v2c__hints', 'aria-label': 'Hints' }, [
      el('div', { class: 'tb3v2c__hints-h', text: "When you're stuck" }),
      renderHintRow(0, used >= 1, used === 0, false, 'First hint',  used >= 1 ? hints[0] : null, false),
      renderHintRow(1, used >= 2, used === 1, false, 'Second hint', used >= 2 ? hints[1] : null, false),
      renderHintRow(2, used >= 3, used === 2, false, 'Third hint',  used >= 3 ? hints[2] : null, false),
      renderHintRow(3, false,     used >= 3, true,  'Tutor escape',
        used >= 3 ? 'Tap "I am stuck" again to ask the tutor.' :
          'Available after the third hint. The tutor reads your canvas and explains what is missing.',
        thinking),
    ]);
  }

  function renderPbqBody() {
    return el('div', { class: 'tb3v2c__body' }, [
      renderProgressBar(),
      renderPbqStepCard(),
      renderHintCascade(),
    ]);
  }

  function renderPbqFooter() {
    var stepDone = isStepComplete();
    var thinking = getState().isThinking;
    var pbq = getActivePbq();
    var idx = getState().currentStepIndex;
    var isLast = pbq && (idx >= pbq.steps.length - 1);
    var stuck = el('button', {
      type: 'button', class: 'tb3v2c__btn', 'data-action': 'stuck',
      'aria-busy': thinking ? 'true' : 'false',
      text: thinking ? 'Asking the tutor…' : "I am stuck",
    });
    if (thinking) stuck.disabled = true;
    var next = el('button', {
      type: 'button', class: 'tb3v2c__btn tb3v2c__btn--primary',
      'data-action': 'next',
      text: isLast && stepDone ? 'Finish lesson' : 'Next step',
    });
    if (!stepDone) { next.disabled = true; next.setAttribute('aria-disabled', 'true'); }
    var counter = getCounter();
    var counterText = counter.count + ' call' + (counter.count === 1 ? '' : 's') + ' today';
    return el('footer', { class: 'tb3v2c__foot' }, [
      el('div', { class: 'tb3v2c__actions' }, [stuck, next]),
      el('div', { class: 'tb3v2c__foot-meta', 'aria-hidden': 'true' }, [
        el('span', {}, [
          el('span', { class: 'tb3v2c__foot-meta-key', text: 'Tutor' }),
          ' ' + counterText,
        ]),
        el('span', { text: 'Lesson 1 of 42' }),
      ]),
    ]);
  }

  /* Free Build body parts */
  function renderFbEmpty() {
    return el('div', { class: 'tb3v2c__empty', 'aria-live': 'polite' }, [
      el('div', { class: 'tb3v2c__empty-eyebrow', text: 'No question yet' }),
      el('h3', { class: 'tb3v2c__empty-title', text: "Build something, then ask the Coach what's going on." }),
      el('p', { class: 'tb3v2c__empty-body',
        text: 'I narrate small things as you go. When you add a device, when you draw a cable. For anything bigger, type a question below and I will read your canvas before I answer.' }),
      el('ul', { class: 'tb3v2c__empty-list' }, [
        el('li', { text: 'Ask why a design choice matters for the exam' }),
        el('li', { text: 'Ask what a device on your canvas does' }),
        el('li', { text: 'Ask why a packet might fail to route' }),
      ]),
    ]);
  }

  function renderFbNarration(msg) {
    return el('div', { class: 'tb3v2c__narration' }, [
      msg.when ? el('span', { class: 'tb3v2c__narration-when', text: msg.when }) : null,
      document.createTextNode(msg.text || ''),
    ]);
  }
  function renderFbQuestion(msg) {
    return el('div', { class: 'tb3v2c__question', 'aria-label': 'Your question' }, [
      el('span', { class: 'tb3v2c__question-mark', 'aria-hidden': 'true', text: 'Q' }),
      el('div', { class: 'tb3v2c__question-text', text: msg.text }),
    ]);
  }
  function renderFbAnswer(msg) {
    var paragraphs = String(msg.text || '').split(/\n{2,}/).filter(function (p) { return p.trim(); });
    if (paragraphs.length === 0) paragraphs = [msg.text || ''];
    return el('div', { class: 'tb3v2c__answer', 'aria-live': 'polite', 'aria-label': 'Coach answer' }, [
      el('div', { class: 'tb3v2c__answer-label', text: 'Coach' }),
    ].concat(paragraphs.map(function (p) { return el('p', { text: p.trim() }); })));
  }
  function renderFbLoading() {
    return el('div', { class: 'tb3v2c__loading', 'aria-live': 'polite', 'aria-busy': 'true' }, [
      el('div', { class: 'tb3v2c__loading-label' }, [
        el('span', { class: 'tb3v2c__loading-pulse', 'aria-hidden': 'true' }),
        'Tutor is reading your canvas',
      ]),
      el('div', { class: 'tb3v2c__loading-skeleton', 'aria-hidden': 'true' }, [
        el('span'), el('span'), el('span'),
      ]),
    ]);
  }
  function renderFbError(msg) {
    return el('div', { class: 'tb3v2c__error', role: 'alert' }, [
      el('div', { class: 'tb3v2c__error-label', text: 'Coach unavailable' }),
      el('p', { text: msg.text || 'Try rephrasing, or check your connection.' }),
    ]);
  }
  function renderFbBody() {
    var msgs = getState().fbMessages;
    if (msgs.length === 0 && !getState().isThinking) {
      return el('div', { class: 'tb3v2c__body' }, [renderFbEmpty()]);
    }
    var nodes = msgs.map(function (m) {
      if (m.kind === 'narration') return renderFbNarration(m);
      if (m.kind === 'question')  return renderFbQuestion(m);
      if (m.kind === 'answer')    return renderFbAnswer(m);
      if (m.kind === 'error')     return renderFbError(m);
      return null;
    }).filter(Boolean);
    if (getState().isThinking) nodes.push(renderFbLoading());
    return el('div', { class: 'tb3v2c__body' }, nodes);
  }

  function renderFbFooter() {
    var thinking = getState().isThinking;
    var counter = getCounter();
    var counterText = counter.count + ' call' + (counter.count === 1 ? '' : 's') + ' today';
    var input = el('input', {
      type: 'text',
      class: 'tb3v2c__input',
      id: 'tb3v2c-input',
      placeholder: thinking ? 'Tutor is replying…' : 'Ask the Coach about anything on your canvas…',
      value: getState().fbInput || '',
    });
    if (thinking) input.disabled = true;
    input.addEventListener('input', function (e) { _coachState.fbInput = e.target.value; });
    var send = el('button', {
      type: 'submit', class: 'tb3v2c__send', 'data-action': 'send', text: 'Send',
    });
    if (thinking || !getState().fbInput) { send.disabled = true; }
    var form = el('form', { class: 'tb3v2c__input-form' }, [
      el('label', { class: 'tb3v2c__input-label', 'for': 'tb3v2c-input', text: 'Ask the Coach' }),
      el('div', { class: 'tb3v2c__input-wrap' }, [input, send]),
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var host = form.closest('[data-coach-host]');
      handleSend(host);
    });
    return el('footer', { class: 'tb3v2c__foot' }, [
      form,
      el('div', { class: 'tb3v2c__foot-meta', 'aria-hidden': 'true' }, [
        el('span', {}, [
          el('span', { class: 'tb3v2c__foot-meta-key', text: 'Tutor' }),
          ' ' + counterText,
        ]),
        el('span', { text: "Cached answers don't count" }),
      ]),
    ]);
  }

  function renderPanel() {
    var mode = getCoachMode();
    return el('aside', { class: 'tb3v2c', 'aria-label': 'Coach panel' }, [
      renderHeader(),
      mode === 'pbq' ? renderPbqBody() : renderFbBody(),
      mode === 'pbq' ? renderPbqFooter() : renderFbFooter(),
    ]);
  }

  function mount(host) {
    if (!host) return;
    host.setAttribute('data-coach-host', 'true');
    render(host);
  }
  function render(host) {
    if (!host) return;
    var existing = host.querySelector('.tb3v2c');
    var fresh = renderPanel();
    if (existing && typeof existing.replaceWith === 'function') {
      existing.replaceWith(fresh);
    } else if (existing && existing.parentNode && typeof existing.parentNode.removeChild === 'function') {
      existing.parentNode.removeChild(existing);
      host.appendChild(fresh);
    } else {
      host.appendChild(fresh);
    }
    bindActions(fresh, host);
  }

  function bindActions(shell, host) {
    if (!shell || !host) return;
    if (typeof shell.addEventListener !== 'function') return;
    shell.addEventListener('click', function (ev) {
      var t = ev.target || {};
      var actionEl = (typeof t.closest === 'function') ? t.closest('[data-action]') : null;
      var action = actionEl ? actionEl.getAttribute('data-action') : null;
      if (action === 'stuck') handleStuck(host);
      else if (action === 'next') handleNext(host);
    });
  }

  function handleStuck(host) {
    var hint = useHint();
    if (!hint) return;
    if (typeof hint.then === 'function') {
      render(host);
      hint.then(function (result) {
        if (result && result.kind === 'ai-escape') {
          var msgs = getState().fbMessages.slice();
          msgs.push({ kind: 'answer', text: result.text, cached: !!result.cached });
          setState({ fbMessages: msgs });
        }
        render(host);
      });
    } else {
      render(host);
    }
  }
  function handleNext(host) {
    if (!isStepComplete()) return;
    advanceStep();
    var pbq = getActivePbq();
    if (pbq && getState().currentStepIndex >= pbq.steps.length) {
      setState({ activePbqId: null, currentStepIndex: 0, hintsUsed: 0 });
    }
    render(host);
  }
  function handleSend(host) {
    var text = (getState().fbInput || '').trim();
    if (!text || getState().isThinking) return;
    var msgs = getState().fbMessages.slice();
    msgs.push({ kind: 'question', text: text });
    setState({ fbMessages: msgs, fbInput: '', isThinking: true });
    render(host);
    askAI({ mode: 'fb', question: text }).then(
      function (result) {
        var m = getState().fbMessages.slice();
        m.push({ kind: 'answer', text: result.text, cached: result.cached });
        setState({ fbMessages: m, isThinking: false });
        render(host);
      },
      function (err) {
        var m = getState().fbMessages.slice();
        m.push({ kind: 'error', text: (err && err.message) || 'The Coach is unavailable right now.' });
        setState({ fbMessages: m, isThinking: false });
        render(host);
      }
    );
  }

  function onCanvasEvent(event) {
    if (getCoachMode() !== 'fb') return;
    var msg = narrateAction(event); if (!msg) return;
    var when = '';
    if (event.type === 'device-added' && event.device) {
      when = 'When you added ' + (event.device.hostname || event.device.id);
    } else if (event.type === 'cable-drawn') {
      when = 'When you drew that cable';
    }
    var msgs = getState().fbMessages.slice();
    msgs.push({ kind: 'narration', text: msg, when: when });
    setState({ fbMessages: msgs });
    var host = document.querySelector('[data-coach-host]');
    if (host) render(host);
  }

  var TbV3Coach = {
    COACH_VERSION: COACH_VERSION,
    getState: getState, setState: setState,
    getCoachMode: getCoachMode, getActivePbq: getActivePbq, getCurrentStep: getCurrentStep,
    isStepComplete: isStepComplete, advanceStep: advanceStep,
    getCounter: getCounter, incrementCounter: incrementCounter,
    cacheKey: cacheKey, cacheGet: cacheGet, cacheSet: cacheSet,
    buildPrompt: buildPrompt, askAI: askAI,
    narrateAction: narrateAction, useHint: useHint,
    mount: mount, render: render, onCanvasEvent: onCanvasEvent,
    handleStuck: handleStuck, handleNext: handleNext, handleSend: handleSend,
    PERSONA: PERSONA,
  };
  if (typeof window !== 'undefined') {
    window.TbV3Coach = TbV3Coach;
    if (window._certanvilFeatures && typeof window._certanvilFeatures === 'object') {
      window._certanvilFeatures['topology-builder-v3-coach'] = TbV3Coach;
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = TbV3Coach;
})();
