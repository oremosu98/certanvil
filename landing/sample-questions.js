// ══════════════════════════════════════════════════════════════════════════
// CertAnvil landing — sample question widget (Ship A from quick-wins mockup)
// ══════════════════════════════════════════════════════════════════════════
// Hand-picked Network+ N10-009 exemplars rendered into #sample-question-host.
// Cold visitor lands → tries one real exam-style question right in the hero
// → clicks an answer → sees correct/wrong + explanation + "Take the
// Baseline Diagnostic →" follow-up CTA. Loops the conversion into the
// diagnostic flow (synergy with Ship B's hero CTA).
//
// Questions are hand-picked from the 320 curated exemplars in app.js's
// QUESTION_EXEMPLARS bank. All original content authored from the public
// N10-009 blueprint — zero copy of paid/owned content. Cycles randomly on
// each page load so returning visitors see fresh content.
// ══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // ── Sample bank: 4 hand-picked Network+ exemplars ──
  // Mix: 1 Foundational + 2 Exam Level + 1 Hard. Each demonstrates a real
  // CompTIA trap pattern (layer misattribution / port confusion / subnet
  // math / methodology ordering).
  var SAMPLE_QUESTIONS = [
    {
      id: 'osi-tcp',
      cert: 'Network+ · N10-009',
      domain: 'Domain 1.0 · Networking Concepts',
      difficulty: 'Exam Level',
      stem: 'A network technician is troubleshooting slow file transfers between two servers. Which OSI-layer protocol is MOST likely to provide segment ordering and congestion control for the transfer?',
      options: {
        A: 'IP at Layer 3',
        B: 'TCP at Layer 4',
        C: 'HTTP at Layer 7',
        D: 'Ethernet at Layer 2'
      },
      answer: 'B',
      explanationCorrectEyebrow: 'Why TCP?',
      explanationCorrect: '<strong>TCP at Layer 4</strong> provides reliable delivery, segment ordering (via sequence numbers), and congestion control (sliding window, slow start). <strong>IP (A)</strong> routes packets but is connectionless — no ordering, no congestion control. <strong>HTTP (C)</strong> is application-layer and uses TCP underneath, but isn\'t itself the protocol providing those properties. <strong>Ethernet (D)</strong> handles framing at Layer 2 — it doesn\'t see segments at all.',
      explanationWrongEyebrow: 'Why TCP, not IP?',
      explanationWrong: 'IP at Layer 3 routes packets but is <strong>connectionless</strong> — no ordering, no congestion control. <strong>TCP at Layer 4</strong> is what provides segment ordering (sequence numbers) and congestion control (sliding window, slow start). The trap here: IP is involved in the path, but it\'s TCP doing the heavy lifting. CompTIA loves layer-misattribution questions like this.'
    },
    {
      id: 'dns-udp-53',
      cert: 'Network+ · N10-009',
      domain: 'Domain 1.4 · Network Services',
      difficulty: 'Foundational',
      stem: 'A network admin notices DNS queries to an external resolver are slow over UDP, but DNS queries to the same resolver via TCP work fine. Which UDP port is most relevant to this DNS performance issue?',
      options: {
        A: '53 (DNS)',
        B: '67 (DHCP server)',
        C: '161 (SNMP)',
        D: '123 (NTP)'
      },
      answer: 'A',
      explanationCorrectEyebrow: 'Why UDP 53?',
      explanationCorrect: 'DNS uses <strong>UDP port 53</strong> by default for fast queries (small payload, no handshake), and falls back to <strong>TCP port 53</strong> for large responses (zone transfers, large DNSSEC payloads). That UDP-vs-TCP distinction is exactly the symptom in the question. <strong>DHCP (B)</strong> uses UDP 67/68. <strong>SNMP (C)</strong> uses UDP 161 for polls. <strong>NTP (D)</strong> uses UDP 123. None are DNS protocols.',
      explanationWrongEyebrow: 'DNS uses port 53',
      explanationWrong: 'DNS uses <strong>UDP port 53</strong> by default for fast queries, falling back to <strong>TCP port 53</strong> for large responses. The other ports belong to different protocols: DHCP server (UDP 67), SNMP (UDP 161), NTP (UDP 123). When CompTIA asks about DNS performance specifically, it\'s always port 53 — the UDP/TCP distinction is the nuance.'
    },
    {
      id: 'subnet-26-hosts',
      cert: 'Network+ · N10-009',
      domain: 'Domain 1.4 · Subnetting & IP',
      difficulty: 'Foundational',
      stem: 'A company has been allocated the network 192.168.10.0/26 for a small department. How many usable host addresses are available in this subnet?',
      options: {
        A: '30',
        B: '62',
        C: '64',
        D: '126'
      },
      answer: 'B',
      explanationCorrectEyebrow: 'Why 62?',
      explanationCorrect: 'A /26 leaves 6 host bits (32 - 26 = 6). 2^6 = <strong>64 total addresses</strong>. Subtract 2 for the network address and broadcast address → <strong>62 usable hosts</strong>. <strong>(A) 30</strong> = /27 (5 host bits, 32 - 2). <strong>(C) 64</strong> = total addresses, but subtract 2 for network + broadcast. <strong>(D) 126</strong> = /25 (7 host bits, 128 - 2). Subnetting questions always live or die on the "minus 2" step.',
      explanationWrongEyebrow: 'Subnet math: /26 → 62 usable',
      explanationWrong: 'Quick math: /26 leaves 6 host bits (32 - 26). 2^6 = <strong>64 total</strong>, minus the network address and the broadcast address = <strong>62 usable hosts</strong>. The "minus 2" trips up most subnetting questions. Memorize: /24 = 254 usable, /25 = 126, /26 = 62, /27 = 30, /28 = 14, /29 = 6, /30 = 2 (point-to-point links).'
    },
    {
      id: 'troubleshoot-step-1',
      cert: 'Network+ · N10-009',
      domain: 'Domain 5.5 · Troubleshooting Methodology',
      difficulty: 'Exam Level',
      stem: 'A user reports they cannot reach a specific internal web application. Following the CompTIA Network+ 7-step troubleshooting methodology, what is the FIRST step?',
      options: {
        A: 'Establish a theory of probable cause',
        B: 'Identify the problem',
        C: 'Test the theory to determine cause',
        D: 'Verify full system functionality'
      },
      answer: 'B',
      explanationCorrectEyebrow: 'Why Identify first?',
      explanationCorrect: 'CompTIA\'s 7-step methodology starts with <strong>Identify the problem</strong> — gather information from the user, identify symptoms, determine if anything has recently changed, duplicate the issue if possible. Only THEN do you (2) Establish a theory, (3) Test the theory, (4) Plan + implement a fix, (5) Verify functionality + put preventive measures in place, (6) Document, (7) Apply lessons learned. <strong>(A)</strong> is step 2. <strong>(C)</strong> is step 3. <strong>(D)</strong> is step 5. The exam loves to swap steps 1 and 2 because both feel "early."',
      explanationWrongEyebrow: 'Step 1 is Identify',
      explanationWrong: 'Easy trap — establishing a theory FEELS like step 1 because it\'s "thinking about the problem." But CompTIA\'s methodology is explicit: step 1 is <strong>Identify the problem</strong> (gather info, document symptoms, find recent changes, duplicate the issue). Theory-building is step 2. The methodology in order: Identify → Theory → Test → Plan/Implement → Verify → Document → Apply lessons.'
    }
  ];

  function pickRandomQuestion() {
    return SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)];
  }

  // ── Build the markup for a question (default state, all options clickable) ──
  function buildQuestionHtml(q) {
    var letters = Object.keys(q.options).sort();
    var optionsHtml = letters.map(function (l) {
      return ''
        + '<button type="button" class="sq-option" data-letter="' + l + '">'
        +   '<span class="sq-option-letter">' + l + '</span>'
        +   '<span class="sq-option-text">' + escapeHtml(q.options[l]) + '</span>'
        + '</button>';
    }).join('');

    return ''
      + '<div class="sample-q-card" data-question-id="' + q.id + '">'
      +   '<div class="sq-meta-row">'
      +     '<span class="sq-cert-tag">' + escapeHtml(q.cert) + '</span>'
      +     '<span class="sq-domain-tag">' + escapeHtml(q.domain) + '</span>'
      +     '<span class="sq-difficulty-tag">' + escapeHtml(q.difficulty) + '</span>'
      +   '</div>'
      +   '<p class="sq-stem">' + escapeHtml(q.stem) + '</p>'
      +   '<div class="sq-options">' + optionsHtml + '</div>'
      + '</div>';
  }

  // ── Reveal state: mark picked + correct + explanation + follow-up CTA ──
  function reveal(card, q, pickedLetter) {
    var isCorrect = pickedLetter === q.answer;
    var optionEls = card.querySelectorAll('.sq-option');

    optionEls.forEach(function (el) {
      var letter = el.getAttribute('data-letter');
      // Remove hover affordance + disable further clicks
      el.style.cursor = 'default';
      el.disabled = true;

      if (letter === q.answer) {
        el.classList.add('is-correct');
        var marker = document.createElement('span');
        marker.className = 'sq-option-marker';
        marker.style.color = 'var(--green)';
        marker.textContent = isCorrect ? '✓ Correct' : '✓ Correct answer';
        el.appendChild(marker);
      } else if (letter === pickedLetter) {
        // User picked this and it's wrong
        el.classList.add('is-wrong');
        var wrongMarker = document.createElement('span');
        wrongMarker.className = 'sq-option-marker';
        wrongMarker.style.color = 'var(--red)';
        wrongMarker.textContent = '✗ Your pick';
        el.appendChild(wrongMarker);
      } else {
        el.classList.add('is-dimmed');
      }
    });

    // Build explanation block
    var explanationEyebrow = isCorrect ? q.explanationCorrectEyebrow : q.explanationWrongEyebrow;
    var explanationBody = isCorrect ? q.explanationCorrect : q.explanationWrong;
    var followupText = isCorrect
      ? '🎯 <strong>Nice — you got it.</strong> Want 19 more like this?'
      : '🎯 <strong>Tricky one</strong> — that\'s exactly the kind of trap your daily practice catches.';

    var revealHtml = ''
      + '<div class="sq-explanation">'
      +   '<span class="sq-explanation-eyebrow">' + escapeHtml(explanationEyebrow) + '</span>'
      +   explanationBody  // explanation contains <strong> tags — already curated content, not user input
      + '</div>'
      + '<div class="sq-followup">'
      +   '<p class="sq-followup-text">' + followupText + '</p>'
      +   '<a class="sq-followup-cta" href="https://networkplus.certanvil.com/?action=diagnostic&from=landing-sample-q">'
      +     'Take the Baseline Diagnostic →'
      +   '</a>'
      + '</div>';

    card.insertAdjacentHTML('beforeend', revealHtml);
  }

  // ── Wire up the click → reveal flow ──
  function attachHandlers(card, q) {
    var optionEls = card.querySelectorAll('.sq-option');
    optionEls.forEach(function (el) {
      el.addEventListener('click', function () {
        // Guard against double-click after reveal
        if (card.querySelector('.sq-explanation')) return;
        var letter = el.getAttribute('data-letter');
        reveal(card, q, letter);
      });
    });
  }

  // ── Render entry point ──
  function render() {
    var host = document.getElementById('sample-question-host');
    if (!host) return;
    var q = pickRandomQuestion();
    host.innerHTML = buildQuestionHtml(q);
    var card = host.querySelector('.sample-q-card');
    if (card) attachHandlers(card, q);
  }

  // ── Helpers ──
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Init on DOMContentLoaded (or immediately if already loaded)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
