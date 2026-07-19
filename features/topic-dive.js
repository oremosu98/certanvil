(function () {
  'use strict';
  if (!window._certanvilFeatures) window._certanvilFeatures = {};

  // ══════════════════════════════════════════
  // TOPIC DEEP DIVE PANEL
  // ══════════════════════════════════════════
  let topicDiveReturnPage = 'quiz';

  // Builds the JSON-shaped prompt sent to Claude for the Topic Deep Dive feature.
  // Extracted from showTopicDeepDive() (#18) so the parent fits the long-function budget.
  // v4.38.5 — prepends ground-truth facts for ports/OSI/wireless so the teacher
  // can't hallucinate deterministic values that live in GT_PORTS/GT_OSI.
  function buildTopicDivePrompt(topicName) {
    const gtHint = _buildGtHint(topicName, topicName);
    return `You are a CompTIA Network+ N10-009 instructor. Create a comprehensive study guide for the topic: "${topicName}"
  ${gtHint}

  Return your response as valid JSON with this exact structure:
  {
    "summary": "2-3 sentence overview of what this topic covers and why it matters for the exam",
    "keyConcepts": [
      { "name": "Concept Name", "detail": "1-2 sentence explanation" },
      { "name": "Concept Name", "detail": "1-2 sentence explanation" },
      { "name": "Concept Name", "detail": "1-2 sentence explanation" },
      { "name": "Concept Name", "detail": "1-2 sentence explanation" }
    ],
    "howItWorks": "3-4 sentence detailed but accessible explanation of how the core technology/concept works under the hood. Use simple language a beginner would understand.",
    "scenario": "A realistic workplace scenario (3-4 sentences) showing this concept in action. Include the problem, the solution, and what commands/tools/protocols were used.",
    "examTips": [
      "Specific exam tip or trap to watch for",
      "Another specific tip",
      "A third tip"
    ],
    "memoryTrick": "A mnemonic, acronym, or memorable hook to remember the key facts",
    "diagram": "An ASCII diagram showing the concept visually (use box-drawing characters like ┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼ and arrows → ← ↑ ↓). Make it clear and labeled. 5-8 lines max. If the topic doesn't suit a diagram, provide a structured comparison table instead."
  }

  Return ONLY valid JSON, no extra text before or after.`;
  }

  async function showTopicDeepDive(topicName) {
    // Remember which page to return to
    const pages = ['page-quiz', 'page-review', 'page-exam', 'page-exam-results', 'page-results'];
    topicDiveReturnPage = pages.find(p => document.getElementById(p).classList.contains('active')) || 'page-quiz';

    const res = topicResources[topicName];
    const titleEl = document.getElementById('topic-dive-title');
    const objEl = document.getElementById('topic-dive-obj');
    const contentEl = document.getElementById('topic-dive-content');
    const backBtn = document.getElementById('topic-dive-back');

    // v4.54.16: italic-accent last-word of the dynamic title for editorial
    // consistency with the rest of the app (Topic deep dive. / Topic X.)
    titleEl.innerHTML = 'Topic \u00b7 <em>' + escHtml(topicName) + '</em>';
    objEl.textContent = res ? 'Exam Objective ' + res.obj : '';
    contentEl.innerHTML = '<div class="topic-dive-loading"><div class="spinner" style="width:32px;height:32px;border-width:3px"></div><p style="margin-top:12px;color:var(--text-dim)">Generating topic guide\u2026</p></div>';

    backBtn.onclick = () => {
      // v4.99.7 — route through showPage so PRO_ONLY_PAGES gate fires, plus
      // sidebar/breadcrumb sync + a11y focus. Pre-v4.99.7 the direct .active
      // toggle bypassed every gate added in v4.99.5.
      showPage(topicDiveReturnPage.replace(/^page-/, ''));
    };

    showPage('topic-dive');

    const key = apiKey || localStorage.getItem(STORAGE.KEY) || '';
    // v4.99.46 fix: validateApiKey bypasses for signed-in Pro users (server
    // proxy path). Pre-fix the rolled-own `if (!key)` check blocked them with
    // a "No API key" notice even though they don't need one.
    if (validateApiKey(key)) {
      contentEl.innerHTML = '<div class="topic-dive-error">⚠️ No API key found. Enter your Anthropic API key on the setup page to use Topic Deep Dive.</div>';
      return;
    }

    const prompt = buildTopicDivePrompt(topicName);

    // v4.38.5 — topic deep dives are deterministic given topic name. Cache hit
    // skips the Sonnet call on every repeat view of the same topic guide.
    const cachedGuide = _aiCacheGet('topicDeepDive', topicName);
    if (cachedGuide) {
      try { renderTopicDive(cachedGuide, topicName); return; } catch {}
    }

    try {
      const apiRes = await _claudeFetch( {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model: CLAUDE_TEACHER_MODEL, max_tokens: MAX_TOKENS_TEACHER_LONG, messages: [{ role: 'user', content: prompt }] }),
        _errorSurface: {
          container: contentEl,
          onRetry: () => showTopicDeepDive(topicName),
          onBack: () => showPage(topicDiveReturnPage.replace(/^page-/, ''))
        }
      });

      if (!apiRes.ok) throw new Error('API error');

      const data = await apiRes.json();
      const raw = data.content?.[0]?.text || '';

      // Extract JSON (handle possible markdown code fences)
      let jsonStr = raw.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }

      const guide = JSON.parse(jsonStr);
      _aiCacheSet('topicDeepDive', topicName, guide);
      renderTopicDive(guide, topicName);
    } catch (e) {
      if (e && e.surfaced) return;  // error card already rendered in contentEl
      // Fallback: try to render what we can, or show error
      contentEl.innerHTML = '<div class="topic-dive-error">Could not generate topic guide. Please try again.<br><button class="btn btn-primary" style="margin-top:12px" onclick="showTopicDeepDive(\'' + escHtml(topicName).replace(/'/g, "\\'") + '\')">Retry</button></div>';
    }
  }

  function renderTopicDive(guide, topicName) {
    const contentEl = document.getElementById('topic-dive-content');

    // v7.50.x: decorative concept bullet emoji (🔹🔸💠🔷⚡🔶) removed per BRAND §9
    // (no emoji-as-icons). No suitable monoline glyph in the vocabulary for an
    // abstract "concept" bullet, so the icon slot is dropped rather than hand-rolled.
    const conceptCards = (guide.keyConcepts || []).map((c) => {
      return `<div class="td-concept-card">
        <div class="td-concept-body">
          <div class="td-concept-name">${escHtml(c.name)}</div>
          <div class="td-concept-detail">${escHtml(c.detail)}</div>
        </div>
      </div>`;
    }).join('');

    const examTips = (guide.examTips || []).map(t =>
      `<li>${escHtml(t)}</li>`
    ).join('');

    // Sec-P4/M6: AI ("Topic Deep Dive") guide body is untrusted content — built
    // here then passed through the DOMPurify backstop at assignment below.
    const aiGuideHtml = `
      <div class="td-section td-summary">
        <div class="td-section-body">
          <h3>Overview</h3>
          <p>${escHtml(guide.summary || '')}</p>
        </div>
      </div>

      <div class="td-section">
        <div class="td-section-body">
          <h3>Key Concepts</h3>
          <div class="td-concept-grid">${conceptCards}</div>
        </div>
      </div>

      <div class="td-section">
        <div class="td-section-body">
          <h3>How It Works</h3>
          <p>${escHtml(guide.howItWorks || '')}</p>
        </div>
      </div>

      ${guide.diagram ? `<div class="td-section td-diagram-section">
        <div class="td-section-body">
          <h3>Visual Diagram</h3>
          <pre class="td-diagram">${escHtml(guide.diagram)}</pre>
        </div>
      </div>` : ''}

      <div class="td-section td-scenario">
        <div class="td-section-body">
          <h3>Real-World Scenario</h3>
          <p>${escHtml(guide.scenario || '')}</p>
        </div>
      </div>

      <div class="td-section">
        <div class="td-section-body">
          <h3>Exam Tips &amp; Traps</h3>
          <ul class="td-tips-list">${examTips}</ul>
        </div>
      </div>

      <div class="td-section td-memory">
        <div class="td-section-body">
          <h3>Memory Trick</h3>
          <p class="td-memory-text">${escHtml(guide.memoryTrick || '')}</p>
        </div>
      </div>

    `;
    // Strict DOMPurify over the AI body; the terminal/lab sections are TRUSTED,
    // topic-catalog-derived static HTML carrying inline onclick launch buttons —
    // concatenated OUTSIDE sanitizeHTML so the handlers survive (M7 removes inline
    // handlers later). topicName originates from the curated cert pack, not user input.
    contentEl.innerHTML = sanitizeHTML(aiGuideHtml)
      + _renderTopicTerminalSection(topicName)
      + _renderTopicLabSection(topicName);
  }

  // v4.16 / #68 — "Try it in Terminal" static section appended to the
  // AI-generated topic dive. Only renders if the topic has curated commands.
  function _renderTopicTerminalSection(topicName) {
    const cmds = topicCommands[topicName];
    if (!cmds || cmds.length === 0) return '';
    const cards = cmds.map(c => _terminalCardHtml(c.cmd, c.note)).join('');
    return `<div class="td-section td-terminal">
      <div class="td-section-body">
        <h3>Try It In Terminal</h3>
        <p class="td-terminal-intro">Run these on macOS / iOS Terminal to see this topic live:</p>
        <div class="td-terminal-list">${cards}</div>
      </div>
    </div>`;
  }

  // v4.16 / #69 — Guided Lab callout. Shows a single button that opens a
  // full guided walkthrough page. Only renders if the topic has a lab.
  function _renderTopicLabSection(topicName) {
    const lab = guidedLabs[topicName];
    if (!lab) return '';
    const topicAttr = escHtml(topicName).replace(/'/g, '&#39;');
    return `<div class="td-section td-lab-callout">
      <div class="td-section-body">
        <h3>Guided Terminal Lab</h3>
        <p>Want to go deeper? There\'s a coached walkthrough for this topic — ${escHtml(lab.title)} (${escHtml(lab.duration)}).</p>
        <button type="button" class="btn btn-primary td-lab-btn" onclick="openGuidedLab('${topicAttr}')">🖥️ Start Guided Lab</button>
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════
  // GUIDED TERMINAL LAB PAGE (v4.16 / #69)
  // ══════════════════════════════════════════
  let guidedLabReturnPage = 'page-topic-dive';

  // ── Guided Terminal Lab data (relocated from features/port-drill.js
  //   in v4.99.38 — these labs are SHELL-side because openGuidedLab fires
  //   from Topic Deep Dive, NOT from Port Drill. They were colocated in
  //   the original PORT MASTERY section by historical accident.) ──
  // Guided Terminal Labs (v4.16 / #69) — structured, coached walkthroughs
  // a user runs alongside a Claude Code session. Keyed by topic name.
  // Multiple topics can share a lab (DNS lab serves both DNS topics, etc.).
  const _dnsLab = {
    title: 'DNS Records & Recursive Resolution',
    objective: '1.6',
    duration: '~15 min',
    intro: 'We\'ll walk through DNS record types and the recursive resolution chain using dig. Run each command, read what comes back, and the record types will stop being abstract.',
    steps: [
      { narration: 'Start with a basic lookup. This is the most common DNS query — hostname to IPv4 address.',             cmd: 'dig google.com',            expect: 'An "ANSWER SECTION" containing one or more A records pointing google.com at an IPv4 address.' },
      { narration: 'Now ask for the IPv6 version. AAAA (pronounced "quad-A") is the IPv6 equivalent of an A record.',      cmd: 'dig AAAA google.com',       expect: 'AAAA record(s) in the ANSWER SECTION showing an IPv6 address like 2607:f8b0:...' },
      { narration: 'MX records tell SMTP where to deliver mail for a domain. This is objective 1.6 — DNS record types.',   cmd: 'dig MX google.com',         expect: 'A list of mail exchangers with priority values. Lower priority wins.' },
      { narration: 'NS records list the authoritative nameservers — the servers Google designates as the source of truth for google.com.', cmd: 'dig NS google.com',          expect: 'Four ns*.google.com entries.' },
      { narration: 'TXT records hold arbitrary text. In practice they carry SPF, DKIM, and DMARC records for email security (ties into objective 4.3).', cmd: 'dig TXT google.com',        expect: 'Several TXT entries including one that starts with "v=spf1".' },
      { narration: '+trace makes dig walk the full recursive chain live: root (.) → .com → Google\'s authoritative nameservers. This is what happens every time you type a URL into a browser (unless the answer is cached).', cmd: 'dig +trace google.com',     expect: 'A multi-stage walk: 13 root nameservers → .com gTLD nameservers → ns*.google.com → final A record.' },
      { narration: 'Finally, the legacy tool. nslookup is still on the N10-009 exam, so make sure you\'ve seen it at least once.', cmd: 'nslookup google.com',       expect: 'A Non-authoritative answer with an IP address.' }
    ],
    wrap: 'Great — you\'ve now seen every DNS record type the exam will throw at you, and watched recursive resolution happen live. Head back to the app and fire the DNS drill to lock it in.'
  };
  const _routingLab = {
    title: 'Routing & Your Real Default Gateway',
    objective: '2.2 / 5.1',
    duration: '~15 min',
    intro: 'We\'ll trace how packets leave your machine and reach the internet — using YOUR real network, not a textbook diagram. Hop 1 of every traceroute from your machine is the router on your desk.',
    steps: [
      { narration: 'Pull your real default gateway. Write down the gateway IP — that\'s the router your packets hand off to.',                                                 cmd: 'route -n get default',       expect: 'A block of text including "gateway: x.x.x.x" — that\'s the router.' },
      { narration: 'Now look at the full routing table. Find the "default" entry (destination 0.0.0.0 or default). That\'s where packets go when nothing more specific matches.', cmd: 'netstat -rn',                expect: 'A table with destinations, gateways, flags, and interfaces. Look for the "default" row.' },
      { narration: 'ARP cache. Find the row with your gateway\'s IP — you\'ll see its MAC address. L2 adjacency: you reach the gateway by MAC, not IP, because it\'s on the same LAN.', cmd: 'arp -a',                     expect: 'Several lines like "? (192.168.1.1) at aa:bb:cc:... on en0". Your gateway should be one of them.' },
      { narration: 'Traceroute to Google. Every line is a router. Hop 1 = your default gateway. Hops 2-3 = your ISP. Later hops cross the public internet.',                    cmd: 'traceroute 8.8.8.8',         expect: '10-15 hops, each with three RTT measurements. Some hops may show * * * if they filter ICMP.' },
      { narration: 'Ping Google\'s DNS. TTL in the reply tells you roughly how many hops the packet has crossed: starting TTL (usually 64 or 128) minus the TTL you see = hop count.', cmd: 'ping -c 4 8.8.8.8',          expect: 'Four replies with round-trip times and a TTL value (usually around 117 from Google).' },
      { narration: 'Finally, ping your own gateway. TTL should be very close to the starting value (usually 64) — because it\'s 1 hop away.',                                   cmd: 'ping -c 3 $(route -n get default | awk \'/gateway/ {print $2}\')', expect: 'Three replies with sub-millisecond RTT and TTL of ~64. 0% packet loss.' }
    ],
    wrap: 'You\'ve now seen dynamic routing happen on your own network. Head back and drill the Routing Protocols topic.'
  };
  const _portsLab = {
    title: 'Ports & Listening Services',
    objective: '1.4 / 1.5',
    duration: '~15 min',
    intro: 'We\'ll see real protocols running on real ports — on your own machine and on the internet. After this lab, "port 443 = HTTPS" is muscle memory, not a flashcard.',
    steps: [
      { narration: 'First, see every port your own machine is listening on. Every LISTEN line is a service waiting for connections. Notice IPv4 (tcp4) and IPv6 (tcp6) variants.', cmd: 'netstat -an | grep LISTEN',                      expect: 'A list of local addresses in the form *.port or 127.0.0.1.port with state LISTEN.' },
      { narration: 'Same data, but with process names. Now you can see which app owns each listening port — ControlCenter on 7000, mdnsresponder on 5353, etc.',                  cmd: 'lsof -i -P -n | grep LISTEN',                    expect: 'Rows showing COMMAND, PID, USER, and the address:port with LISTEN.' },
      { narration: 'Now hit a live HTTPS server. Port 443, TLS-wrapped HTTP. The -I flag sends a HEAD request so you only get headers, not the full body.',                       cmd: 'curl -I https://example.com',                    expect: 'HTTP/2 200, a Content-Type line, and several other response headers.' },
      { narration: 'SMTP submission on port 587 with STARTTLS. This is what every modern email client uses to SEND mail. Watch the TLS handshake happen, then type QUIT to exit.', cmd: 'openssl s_client -connect smtp.gmail.com:587 -starttls smtp', expect: 'A cert chain dump, then a "250-smtp.gmail.com at your service" banner, waiting for input.' },
      { narration: 'Netcat scan — quickly check if specific ports are open on a remote host. scanme.nmap.org is nmap\'s official test server (free to scan, permitted by policy).', cmd: 'nc -zv scanme.nmap.org 22 80 443',               expect: 'Three lines indicating "succeeded" or "open" (or "refused" if one is closed).' },
      { narration: 'Full TCP connect scan on yourself. This is what an attacker sees from port scanning — every open listening port on your machine.',                            cmd: 'nmap -sT localhost',                             expect: 'A list of open ports with service names (e.g. 22/tcp ssh, 5353/tcp ...). Install nmap with brew install nmap if missing.' }
    ],
    wrap: 'Now fire the Port Drill mode — you\'ve seen these ports DO something, which makes them stick.'
  };
  const _tlsLab = {
    title: 'TLS Handshake & Secure Protocols',
    objective: '4.3',
    duration: '~15 min',
    intro: 'We\'ll peel back HTTPS and watch the TLS handshake happen: cert chain, SNI, cipher suite, the whole thing. After this lab, "PKI" is something you\'ve seen, not a textbook acronym.',
    steps: [
      { narration: 'Dump the full certificate chain for Google. You\'ll see the leaf cert, an intermediate CA, and the root — the chain of trust the N10-009 objectives describe. Hit Ctrl+C when you\'re done reading.', cmd: 'openssl s_client -connect google.com:443', expect: 'Several "Certificate chain" entries with subject (s:) and issuer (i:) lines, followed by the full leaf cert in PEM format, then "SSL-Session" details including Protocol (TLSv1.3) and Cipher.' },
      { narration: 'Now do the same thing with SNI — Server Name Indication. SNI lets one IP host many HTTPS sites by telling the server which hostname you want BEFORE the cert is picked. Different servername → potentially different cert.', cmd: 'openssl s_client -connect google.com:443 -servername example.com', expect: 'A different cert chain in the response because the server now selects the cert for example.com (or a default cert if that vhost isn\'t hosted there).' },
      { narration: 'curl with -v shows the TLS handshake inline, without all the openssl noise. Look for the "SSL connection using" line, the "Server certificate" block, and the cipher suite negotiated.', cmd: 'curl -vI https://example.com', expect: 'Verbose output including "ALPN: server accepted h2", "SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384", and cert subject/issuer lines, followed by HTTP/2 200 and response headers.' },
      { narration: 'Check when a cert expires and who issued it — without opening a browser. -dates prints validity window, -issuer shows the CA, -subject shows who the cert is for.', cmd: 'echo | openssl s_client -connect github.com:443 2>/dev/null | openssl x509 -noout -dates -issuer -subject', expect: 'Four lines: notBefore=..., notAfter=..., issuer=..., subject=... — all pulled from the live leaf certificate.' },
      { narration: 'badssl.com intentionally serves broken certs so you can practice recognizing them. Try the expired one — notice how openssl still shows you the handshake output even though a browser would block it.', cmd: 'echo | openssl s_client -connect expired.badssl.com:443 -servername expired.badssl.com 2>&1 | grep -E "verify|notAfter"', expect: 'A "verify error:num=10:certificate has expired" line and a notAfter date in the past. Great confirmation you can spot expired certs on the exam.' },
      { narration: 'Final step — the cipher suite. This is what the exam asks about under "secure protocols". The TLS 1.3 suite below is AES-256 in GCM mode with SHA-384 for the HMAC.', cmd: 'echo | openssl s_client -connect cloudflare.com:443 2>/dev/null | grep -E "Protocol|Cipher"', expect: 'Two lines: "Protocol  : TLSv1.3" and "Cipher    : TLS_AES_256_GCM_SHA384" (or similar).' }
    ],
    wrap: 'You\'ve now seen the TLS handshake, the cert chain, SNI, and cipher negotiation live. Head back and drill Securing TCP/IP and PKI — those topics will feel concrete now.'
  };
  const _arpLab = {
    title: 'ARP & Layer 2 Adjacency',
    objective: '2.1',
    duration: '~10 min',
    intro: 'ARP is how Layer 3 (IP) reaches Layer 2 (MAC). This lab makes the abstract "ARP resolves IP to MAC" sentence concrete by letting you watch your own ARP cache populate and disappear.',
    steps: [
      { narration: 'Your own MAC address. This is the L2 identity of your machine on the local network — 6 bytes, printed as hex. The first 3 bytes are the OUI (Organizationally Unique Identifier) and identify the vendor.', cmd: 'ifconfig en0 | grep ether', expect: 'A line like "ether a4:83:e7:xx:xx:xx". Write the first 3 bytes down — that\'s Apple\'s OUI block.' },
      { narration: 'Look up the OUI online to see the vendor. For Apple it should say "Apple, Inc." — this is how a switch or a network scanner identifies devices without ever resolving their IP.', cmd: 'echo "Paste your OUI at https://www.wireshark.org/tools/oui-lookup.html"', expect: 'The Wireshark lookup tool returns the vendor name for any valid OUI. Apple OUIs start with a4:83:e7, f0:18:98, etc.' },
      { narration: 'Look at the live ARP cache. Every row here is an IP-to-MAC mapping your machine has learned by asking "who has this IP?" and hearing the reply.', cmd: 'arp -a', expect: 'Several rows like "? (192.168.1.1) at aa:bb:cc:dd:ee:ff on en0 ifscope [ethernet]". Your router should be one of them.' },
      { narration: 'Ping a host you\'ve never talked to — any IP on your LAN that isn\'t the gateway. Your machine has to ARP for it BEFORE the ICMP can go out. The first ping is typically slower because of that extra ARP round trip.', cmd: 'ping -c 2 192.168.1.2', expect: 'One or two replies (or timeouts if nothing is at that address). Either way, the ARP request goes out on the wire first.' },
      { narration: 'Check the ARP cache again — the new entry is there now. ARP learned the MAC while trying to deliver your ICMP.', cmd: 'arp -a', expect: 'The same list as before plus (if the host responded) a new row for 192.168.1.2. If nothing responded, you might see "incomplete" or no new row.' },
      { narration: 'Finally, your default gateway\'s MAC. This is the single most important ARP entry on your machine — every packet bound for the public internet is sent to this MAC at Layer 2 first. "You reach the gateway by MAC, not IP" is the single-sentence L2 adjacency rule the exam loves.', cmd: 'arp -n $(route -n get default | awk \'/gateway/ {print $2}\')', expect: 'A single line showing the gateway\'s IP and MAC. This is the handoff point between your LAN and the rest of the world.' }
    ],
    wrap: 'ARP is no longer abstract. Head back and drill Switch Features & VLANs / Cabling & Topology — the L2 questions will make more sense.'
  };
  const _subnetLab = {
    title: 'Subnetting Your Own Network',
    objective: '1.4',
    duration: '~15 min',
    intro: 'We\'ll subnet YOUR real network instead of a textbook example. You\'ll pull your real IP and mask, compute the network, broadcast, and usable range, and confirm it matches what ipcalc says.',
    steps: [
      { narration: 'Pull your real IPv4 address and netmask. en0 is usually Wi-Fi on macOS; if nothing shows up, try en1 or run "ifconfig" with no args to find the right interface.', cmd: 'ifconfig en0 | grep "inet "', expect: 'A line like "inet 192.168.1.47 netmask 0xffffff00 broadcast 192.168.1.255". That netmask in hex is /24.' },
      { narration: 'Convert the hex mask to CIDR. 0xffffff00 = 255.255.255.0 = /24. 0xffff0000 = 255.255.0.0 = /16. Count the 1 bits in the mask — that\'s your prefix length. This is a classic exam question.', cmd: 'echo "0xffffff00 → 255.255.255.0 → /24  (24 one-bits in the mask)"', expect: 'The printed conversion. Practice this until hex-to-CIDR is instant: ff = 8 bits, so 3x ff = /24, 4x ff = /32.' },
      { narration: 'Now compute network and broadcast by hand using your real IP. For 192.168.1.47/24: network = 192.168.1.0, broadcast = 192.168.1.255, usable = .1 to .254 (2^8 - 2 = 254 hosts). Replace the numbers with YOUR IP.', cmd: 'echo "My IP: 192.168.1.47/24 → network 192.168.1.0, broadcast 192.168.1.255, usable 192.168.1.1-.254 (254 hosts)"', expect: 'Your own subnet math written out. This is exactly the format the exam wants.' },
      { narration: 'Check your work with ipcalc. brew install ipcalc if you don\'t have it. Pass it your real CIDR block — the output should match what you just wrote down.', cmd: 'ipcalc 192.168.1.0/24', expect: 'A colored table showing Address, Netmask, Wildcard, Network, Broadcast, HostMin, HostMax, and Hosts/Net. All fields should match your by-hand calculation.' },
      { narration: 'Now try a harder one. /26 gives you 4 subnets per /24 — each with 62 usable hosts. ipcalc will show you the block boundaries. This is the kind of variable-length mask the exam throws at you.', cmd: 'ipcalc 192.168.1.0/26', expect: 'A smaller block: network 192.168.1.0, broadcast 192.168.1.63, HostMin .1, HostMax .62, 62 hosts total. The next /26 block starts at 192.168.1.64.' },
      { narration: 'Optional IPv6 side. IPv6 doesn\'t do ARP (it uses NDP) and doesn\'t do subnetting the same way — prefixes are almost always /64 for LANs. Check your real IPv6 address.', cmd: 'ifconfig en0 | grep inet6', expect: 'One or more inet6 lines. A link-local address starts with fe80:: and only works on the local segment. A global address is routable on the public IPv6 internet.' }
    ],
    wrap: 'You\'ve now subnetted a real network with your own IP. Head back and grind the Subnetting Trainer — after this lab the drills feel a lot less abstract.'
  };
  const _monitoringLab = {
    title: 'Network Monitoring with netstat, lsof, and tcpdump',
    objective: '3.2',
    duration: '~15 min',
    intro: 'Monitoring is what happens AFTER you\'ve deployed the network and things start going wrong. This lab walks you through the four tools every ops team lives in: netstat for counters, lsof for connection-to-process mapping, nettop for live rates, and tcpdump for packet-level truth.',
    steps: [
      { narration: 'Protocol counters. netstat -s dumps per-protocol statistics — TCP retransmits, UDP checksum errors, ICMP drops. If a link is flaky, retransmits and errors climb here.', cmd: 'netstat -s | head -40', expect: 'Blocks labeled tcp:, udp:, ip:, icmp: with counters like "packets sent", "retransmitted", "bad checksums". Rising retransmit counts are the #1 sign of a lossy link.' },
      { narration: 'Every active network socket on your machine. This is netstat -an: all (a) connections, numeric (n) addresses — no DNS lookups, so it\'s fast.', cmd: 'netstat -an | head -30', expect: 'A table with Proto, Recv-Q, Send-Q, Local Address, Foreign Address, state. States include LISTEN (waiting), ESTABLISHED (active), TIME_WAIT (recently closed), CLOSE_WAIT (problem).' },
      { narration: 'lsof maps network sockets to processes. Now you can see WHICH app is responsible for each connection — the missing piece netstat doesn\'t give you on macOS.', cmd: 'lsof -i -P -n | head -20', expect: 'Rows with COMMAND (process name), PID, USER, NAME (the local:foreign address). Great for "why is port 5432 open? oh, postgres".' },
      { narration: 'Narrow to a specific port. This answers "who is listening on port 443?" in one command — way faster than grepping netstat.', cmd: 'lsof -i :443', expect: 'Zero or more rows showing processes with an active connection to or from port 443. If nothing prints, nothing on your machine is using 443 right now.' },
      { narration: 'Live throughput by process. nettop is the macOS equivalent of iftop — it shows bytes/sec per process, refreshed every second. Hit q to quit.', cmd: 'nettop -P -L 1', expect: 'A snapshot table with processes and their current bytes_in / bytes_out / packets_in / packets_out. -L 1 = one sample and exit so this doesn\'t hang your terminal.' },
      { narration: 'Finally, packet-level truth. tcpdump captures real packets on the wire. This filter grabs 10 DNS packets (port 53) on any interface. May prompt for sudo.', cmd: 'sudo tcpdump -i any -n -c 10 port 53', expect: 'Ten lines, each one a DNS query or reply: timestamp, source → destination, A? google.com (or similar). This is the ground truth every other tool is approximating.' }
    ],
    wrap: 'You\'ve just seen the four layers of network observability: counters (netstat -s), connection tables (netstat -an / lsof), live rates (nettop), and raw packets (tcpdump). Head back and drill Network Monitoring & Observability.'
  };
  const _troubleshootingLab = {
    title: 'The 7-Step Troubleshooting Methodology — Live',
    objective: '5.1',
    duration: '~20 min',
    intro: 'This is THE exam topic that gets graded as methodology, not trivia. You\'ll walk through all 7 CompTIA steps against a real (hypothetical) outage: "I can\'t reach google.com." No commands here will break your network permanently — we just query, we don\'t modify.',
    steps: [
      { narration: 'STEP 1 — Identify the problem. Reproduce it with a ping. "I can\'t reach google.com" is vague; "ping google.com returns cannot resolve host" is specific. Always reproduce before theorizing.', cmd: 'ping -c 2 google.com', expect: 'Either four reply lines (no problem) or "cannot resolve google.com: Unknown host" (the reproducible symptom). The exact error message is your starting data.' },
      { narration: 'STEP 2 — Establish a theory of probable cause. If ping by NAME fails, is it DNS or is it the whole network? Test raw IP to eliminate DNS as a variable. 8.8.8.8 is Google\'s public resolver — known-good, never changes.', cmd: 'ping -c 2 8.8.8.8', expect: 'Four reply lines. If THIS works but ping google.com didn\'t, the network is fine and the problem is DNS. If THIS fails too, the problem is upstream (gateway, ISP, airplane mode).' },
      { narration: 'STEP 3 — Test the theory. Ask a specific DNS server directly with nslookup. If Cloudflare\'s 1.1.1.1 can resolve it but your default resolver can\'t, your configured DNS is broken.', cmd: 'nslookup google.com 1.1.1.1', expect: 'A "Non-authoritative answer" block with google.com\'s IP addresses. This confirms DNS works GLOBALLY — the issue is localized to your machine\'s DNS config.' },
      { narration: 'STEP 3 (continued) — Confirm with your CURRENT resolver. No server argument = use whatever is in /etc/resolv.conf or System Settings. If this hangs or errors, your local DNS is the root cause.', cmd: 'nslookup google.com', expect: 'Either the same "Non-authoritative answer" (your DNS is fine, theory rejected, go back to step 2) or a timeout / "connection refused" (theory confirmed, DNS is broken).' },
      { narration: 'STEP 4 — Establish a plan of action. Plan in English BEFORE you type. "I\'ll change the DNS resolver on Wi-Fi to 1.1.1.1, retest, and if it works I\'ll also document why the original resolver failed." Write the plan down. The exam grades this step.', cmd: 'echo "Plan: 1) set DNS to 1.1.1.1  2) retest  3) verify  4) document root cause  5) set DNS back or keep new one"', expect: 'Your plan on screen. Yes, this is trivial — but on the exam "what do you do BEFORE implementing?" the answer is always "establish a plan".' },
      { narration: 'STEP 5 — Implement the solution. networksetup is the macOS way to change DNS from the CLI. Replace "Wi-Fi" with your interface name if different. SKIP this step if the outage is hypothetical — the rest of the lab still works.', cmd: 'networksetup -getdnsservers Wi-Fi', expect: 'Either a list of DNS servers (e.g. 192.168.1.1) or "There aren\'t any DNS Servers set on Wi-Fi." (meaning DHCP is handing them out). We\'re only READING here, not writing — -setdnsservers is the write command.' },
      { narration: 'STEP 6 — Verify full functionality. Retest the original failing command. If it works now, the solution is confirmed. If it doesn\'t, the theory was wrong — loop back to step 2.', cmd: 'ping -c 2 google.com', expect: 'Four reply lines (if the fix worked). This is the end-to-end confirmation the exam asks about — don\'t skip this step even when it feels redundant.' },
      { narration: 'STEP 7 — Document findings. Write down the symptom, root cause, fix, and verification. This is the step everyone skips and the exam ALWAYS tests. 30 seconds of typing saves 30 minutes the next time the same thing happens.', cmd: 'echo "INCIDENT: ping google.com failed → root cause: local DNS misconfig → fix: set resolver to 1.1.1.1 → verified: ping google.com OK → 2026-04-11"', expect: 'One line of incident documentation. In real ops this goes into a ticket, a wiki, or a runbook. On the exam: know that step 7 exists and what it\'s called.' }
    ],
    wrap: 'You\'ve just walked all 7 steps of the CompTIA methodology against a real command sequence. The exam scenario questions are now a template match — find the step in the question, name it, pick the next step. Head back and drill Troubleshooting Methodology.'
  };
  const guidedLabs = {
    'Network Naming (DNS & DHCP)':         _dnsLab,
    'DNS Records & DNSSEC':                _dnsLab,
    'Routing Protocols':                   _routingLab,
    'Port Numbers':                        _portsLab,
    'TCP/IP Applications':                 _portsLab,
    'Securing TCP/IP':                     _tlsLab,
    'PKI & Certificate Management':        _tlsLab,
    'Switch Features & VLANs':             _arpLab,
    'Cabling & Topology':                  _arpLab,
    'Subnetting & IP Addressing':          _subnetLab,
    'IPv6':                                _subnetLab,
    'Network Monitoring & Observability':  _monitoringLab,
    'Network Operations':                  _monitoringLab,
    'CompTIA Troubleshooting Methodology': _troubleshootingLab,
    'Network Troubleshooting & Tools':     _troubleshootingLab
  };

  // Copy a command to clipboard with visual feedback on the button.
  function copyCmd(event, cmd) {
    event.stopPropagation();
    event.preventDefault();
    navigator.clipboard.writeText(cmd).then(() => {
      const btn = event.currentTarget;
      if (!btn) return;
      const old = btn.textContent;
      btn.textContent = '\u2713';
      btn.classList.add('terminal-card-copied');
      setTimeout(() => {
        btn.textContent = old;
        btn.classList.remove('terminal-card-copied');
      }, 1200);
    }).catch(() => showErrorToast('Copy failed · select the command manually.'));
  }

  // Render a single terminal-card HTML block for a {cmd, note} object.
  function _terminalCardHtml(cmd, note) {
    const safeCmd = escHtml(cmd);
    const cmdAttr = escHtml(cmd).replace(/'/g, '&#39;');
    const noteHtml = note ? `<div class="terminal-card-note">${escHtml(note)}</div>` : '';
    return `<div class="terminal-card">
      <div class="terminal-card-head">
        <span class="terminal-card-prompt">$</span>
        <code class="terminal-card-cmd">${safeCmd}</code>
        <button type="button" class="terminal-card-copy" onclick="copyCmd(event, '${cmdAttr}')" aria-label="Copy command">&#128203;</button>
      </div>
      ${noteHtml}
    </div>`;
  }

  function openGuidedLab(topicName) {
    const lab = guidedLabs[topicName];
    if (!lab) { showErrorToast('No lab available for this topic yet.'); return; }

    // v4.42.5 (#72): Remember which page we came from so Back works. Previously
    // used a whitelist of page IDs — any page not in the list (new ones added
    // later) silently fell back to 'page-ports', which caused the v4.16.2 bug
    // where Back dumped users on a stale Topic Deep Dive. Now finds the active
    // page by class directly — any page can open a guided lab and Back will
    // return to it correctly. Defensive fallback to 'page-ports' still in place
    // for the edge case where no page carries the .active class yet.
    const activePage = document.querySelector('.page.active');
    const activeId = activePage && activePage.id;
    // Don't capture the lab page itself as the return target (edge case where
    // openGuidedLab is called from within the lab page — Back would then
    // re-open the current page instead of actually going back).
    guidedLabReturnPage = (activeId && activeId !== 'page-guided-lab') ? activeId : 'page-ports';

    const titleEl = document.getElementById('lab-title');
    const metaEl = document.getElementById('lab-meta');
    const introEl = document.getElementById('lab-intro');
    const stepsEl = document.getElementById('lab-steps');
    const wrapEl = document.getElementById('lab-wrap');

    if (!titleEl) return;

    // v4.54.16: italic-accent title matches the rest of the app's editorial heads
    titleEl.innerHTML = 'Lab \u00b7 <em>' + escHtml(lab.title) + '</em>';
    metaEl.innerHTML = `<span class="lab-meta-pill">Obj ${escHtml(lab.objective)}</span><span class="lab-meta-pill">${escHtml(lab.duration)}</span><span class="lab-meta-pill">${lab.steps.length} steps</span>`;
    introEl.innerHTML = `<p>${escHtml(lab.intro)}</p>`;

    stepsEl.innerHTML = lab.steps.map((s, i) => `
      <div class="lab-step">
        <div class="lab-step-head">
          <span class="lab-step-num">Step ${i + 1}</span>
          <span class="lab-step-count">of ${lab.steps.length}</span>
        </div>
        <p class="lab-step-narration">${escHtml(s.narration)}</p>
        ${_terminalCardHtml(s.cmd, null)}
        <div class="lab-step-expect"><strong>What you should see:</strong> ${escHtml(s.expect)}</div>
      </div>
    `).join('');

    wrapEl.innerHTML = `<div class="lab-wrap">${escHtml(lab.wrap)}</div>`;

    const backBtn = document.getElementById('lab-back-btn');
    if (backBtn) {
      backBtn.onclick = () => {
        // v4.99.7 — route through showPage so PRO_ONLY_PAGES gate fires, plus
        // sidebar/breadcrumb sync + a11y focus. Pre-v4.99.7 the direct .active
        // toggle bypassed every gate added in v4.99.5.
        showPage(guidedLabReturnPage.replace(/^page-/, ''));
      };
    }

    showPage('guided-lab');
  }

  // MVP-QUIZ-ONLY (Ship 2): Topology Builder (v1/v2/v3 + 3D + walkthroughs +
  // Coach v2) DELETED for the quiz-only MVP. Files removed:
  //   - features/topology-builder.js          (TB v1)
  //   - features/topology-builder-v2.{js,css} (TB v2)
  //   - features/topology-builder-v3.{js,css} (TB v3)
  //   - features/topology-builder-v3-walkthroughs.js
  //   - tb3d.js + vendor/three/*              (3D View + Three.js bundle)
  // TB v3 + Coach v2 are preserved on branch `feat/tb-v3-coach-v2` via

  // ══════════════════════════════════════════
  // FEATURE 3: PRE-QUIZ TOPIC BRIEF
  // ══════════════════════════════════════════
  async function fetchTopicBrief(key, topicName) {
    const tb = document.getElementById('topic-brief');
    const tbt = document.getElementById('topic-brief-text');
    if (!tb || !tbt) return;
    tb.classList.add('is-hidden');
    tbt.innerHTML = '';

    // v4.38.5 — cache hit renders instantly without an API call
    const cachedText = _aiCacheGet('topicBrief', topicName);
    if (cachedText) {
      tbt.innerHTML = escHtml(cachedText).replace(/\n/g, '<br>');
      tb.classList.remove('is-hidden');
      return;
    }

    // v4.38.5 — inject ground-truth port/OSI facts so briefs can't hallucinate
    const gtHint = _buildGtHint(topicName, topicName);
    const prompt = `Give a concise study brief for the CompTIA Network+ N10-009 topic: "${topicName}".
  ${gtHint}
  Include:
  - 3-4 key concepts to know (one line each)
  - 2 common exam traps for this topic
  - 1 memory trick

  Keep it under 120 words. Use plain text, no markdown. Number each section.`;
    try {
      const res = await _claudeFetch( {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model: CLAUDE_TEACHER_MODEL, max_tokens: MAX_TOKENS_TEACHER_BRIEF, messages: [{ role: 'user', content: prompt }] }),
        _errorSurface: { container: tb, onRetry: () => fetchTopicBrief(key, topicName) }
      });
      if (!res.ok) return;
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      if (text) {
        _aiCacheSet('topicBrief', topicName, text);
        tbt.innerHTML = escHtml(text).replace(/\n/g, '<br>');
        tb.classList.remove('is-hidden');
      }
    } catch(e) { /* silent fail — brief is a nice-to-have; surfaced errors already shown in container */ }
  }

  // ── Public API (window exposure) ─────────────────────────────────────────
  window.buildTopicDivePrompt          = buildTopicDivePrompt;
  window.showTopicDeepDive             = showTopicDeepDive;
  window.renderTopicDive               = renderTopicDive;
  window.openGuidedLab                 = openGuidedLab;
  window.copyCmd                       = copyCmd;
  window.fetchTopicBrief               = fetchTopicBrief;

  window._certanvilFeatures['topic-dive'] = {
    showTopicDeepDive: showTopicDeepDive,
    openGuidedLab: openGuidedLab,
    fetchTopicBrief: fetchTopicBrief,
  };
})();
