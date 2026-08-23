# Sec+ Threat Vectors (obj 2.2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take `Attack Vectors & Surfaces` from 4 identification-only exemplars to 14 covering every named non-human 2.2 vector, close the two queued micro-gaps (keyed impersonation, ethical motivation), and land the cheap review-debt fixes.

**Architecture:** Pure data change to `certs/secplus.js` (plus lockstep edits in the two prior plan docs where debt-fix text also lives). Twelve exemplars append to `questionExemplars`; four existing entries rewritten in place; two retention concepts append; four debt substring fixes.

**Tech Stack:** Vanilla JS cert-pack data. Node UAT harness. No build step.

**Spec:** `docs/superpowers/specs/2026-08-22-secplus-threat-vectors-design.md`

## Global Constraints

- Compact JSON-string form, **no space after any colon** (the domain guard counts `"objective":"N.M"` by regex).
- The 10 lesson items carry `"source":"curated-lesson-threat-vectors"`; the 2 micro-items carry `"source":"curated-review-debt"`. All 12: `"addedVersion":"8.16.0"`, `"addedDate":"2026-08-22"`.
- Topics: items 1–10 `"topic":"Attack Vectors & Surfaces"` obj `"2.2"`; item 11 `"topic":"Social Engineering"` obj `"2.2"`; item 12 `"topic":"Threat Actors & Motivations"` obj `"2.1"`.
- All 12 mcq, single-letter `"answer"`. Letters fixed by plan: 1B 2D 3C 4A 5D 6A 7C 8B 9D 10B 11C 12A (A3/B3/C3/D3).
- Rewrites (Task 1): explanation prose only; questions, options, answers, difficulty, metadata byte-identical.
- Retention concepts: single-quoted JS object form, guard-invisible.
- **Pool-level length gate (new, binding):** the correct option may be the strictly longest in at most 5 of the 12 new items. Verified by script in Tasks 2 and 3; a failure is fixed by padding distractors, never trimming keys.
- Do not modify weights, maps, guard, picker, prompt functions, or tests. Guard trips → trim, never widen.
- House format: rationale → `(X) Wrong — …` per distractor → memory/exam-clue closer. Grounded in own stem; no absolutes the exam hedges; no cast reuse (existing casts: software-supplier update, USB car park, 47 EOL servers, network-mgmt default creds, plus all v8.14/v8.15 casts).
- **Target v8.16.0. Date 2026-08-22. Branch: main (Fast lane, founder-approved end-to-end).**

---

### Task 1: Rewrite the 4 existing Attack Vectors exemplars

**Files:**
- Modify: `certs/secplus.js:581-584`

- [ ] **Step 1: Baseline**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("total:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length,"| AV:",(s.match(/"topic":"Attack Vectors & Surfaces"/g)||[]).length,"| 2.2:",(s.match(/"objective":"2\.2"/g)||[]).length);' && npm run test:uat 2>&1 | grep "UAT:"
```

Expected: `total: 333 | AV: 4 | 2.2: 22` and `UAT: 5008/5008 ALL PASS`. Different → stop, lines are stale.

- [ ] **Step 2: Replace line 581 (supply chain / software provider)**

```javascript
    {"type":"mcq","question":"An attacker compromises a company's IT software supplier and embeds a backdoor in the supplier's update mechanism. Months later, when the company installs a routine update, the backdoor activates inside the company's network. Which attack vector class is this?","difficulty":"Exam Level","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Supply chain attack (software provider)","B":"Watering hole","C":"Removable device","D":"Default credentials"},"answer":"A","explanation":"The attacker never touched the company directly — they poisoned something the company already trusts and installs on schedule. SY0-701 breaks supply chain into MSP, vendor and supplier vectors, and a compromised software provider's update channel is the archetype: the victim's own change process delivers the payload. (B) Wrong — a watering hole compromises a website the targets merely visit; an update mechanism is a trusted delivery channel with install rights, which is what gives this class its reach. (C) Wrong — removable device requires physical media crossing the perimeter; everything here arrives over the vendor relationship. (D) Wrong — default credentials is an authentication weakness on the victim's own kit; no credential is used at all. Exam clue: the compromise travels through something you procure and trust = supply chain.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 3: Replace line 582 (USB drop) — carries the queued phishing-as-vector harmonisation**

```javascript
    {"type":"mcq","question":"During a security assessment, a USB drive labelled 'Q3 Bonus Calculations' is left in a company's parking lot. An employee picks it up and plugs it into their workstation. The drive auto-runs malware that beacons to an attacker-controlled server. Which attack vector is this?","difficulty":"Foundational","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Phishing","B":"Removable device","C":"Open service port","D":"Wireless"},"answer":"B","explanation":"The malware entered on portable storage plugged into the workstation — the removable-device vector, and the dropped-USB-with-a-tempting-label is its canonical operational pattern. Note that it bypasses every network control on the way in: nothing crossed the perimeter. (A) Wrong — phishing is the deception technique that rides message-based vectors; no message was delivered here, and the lure did its work as a printed label. (C) Wrong — an open service port is a network exposure reached remotely; this attack needed hands on a physical object. (D) Wrong — wireless is RF-borne ingress; the drive was carried in. Exam clue: malicious portable media = removable device, whatever the label says.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 4: Replace line 583 (unsupported systems)**

```javascript
    {"type":"mcq","question":"A vulnerability scan finds 47 production servers running an operating system version that the vendor stopped supporting 14 months ago. No security patches are available for any of them. Which attack-surface contribution does this represent?","difficulty":"Foundational","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Unsupported systems","B":"Default credentials","C":"Open service ports","D":"Removable device"},"answer":"A","explanation":"Past end of life, the vendor has stopped producing security updates — so every vulnerability discovered from now on stays open, and remediation shifts from patching to replacing, isolating or compensating. That permanence is why SY0-701 lists unsupported systems as its own category. (B) Wrong — default credentials is a configuration weakness (factory passwords never changed); nothing here concerns authentication. (C) Wrong — open service ports describe network exposure; the scan finding is about patch status, not what is listening. (D) Wrong — removable device is physical-media ingress. Exam clue: vendor no longer patches = unsupported system, and the fix is architectural, not a download.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 5: Replace line 584 (default credentials)**

```javascript
    {"type":"mcq","question":"A penetration tester gains access to an enterprise's network management system by logging in with vendor-published default credentials that were never changed during deployment. Which attack-surface category does this exploit?","difficulty":"Foundational","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Open service ports","B":"Default credentials","C":"Supply chain","D":"Bluetooth"},"answer":"B","explanation":"The way in was a factory username and password the vendor publishes in its own documentation — deployment should have changed them and did not. That is the default-credentials category, and network appliances, cameras and IoT devices are its classic homes. Note the attacker needed no exploit at all: the front door key was printed in the manual. (A) Wrong — an open port is how the login page was reachable, but reachability is not what was exploited; the credential was. (C) Wrong — supply chain means the vendor relationship itself is compromised; here the vendor did nothing wrong. (D) Wrong — Bluetooth is a short-range wireless vector, uninvolved. Exam clue: admin/admin still working = default credentials.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 6: Verify counts unchanged, suite green, commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("total:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length,"| AV:",(s.match(/"topic":"Attack Vectors & Surfaces"/g)||[]).length);' && npm run test:uat 2>&1 | grep "UAT:"
git add certs/secplus.js
git commit -m "refactor(secplus): rewrite Attack Vectors exemplars into house format

Four entries move to per-distractor + closer format. The USB item's
phishing rebuttal now uses the harmonised framing queued by the v8.15.0
review: phishing is the technique riding message-based vectors, stated
without asserting phishing is itself a vector category.

Questions, options, answers, difficulty, metadata unchanged.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected before commit: `total: 333 | AV: 4`, UAT 5008/5008.

---

### Task 2: Add lesson exemplars 1–6

**Files:**
- Modify: `certs/secplus.js` — insert before the `questionExemplars` closing `],` at line 788, beneath the last v8.15.0 entry (ends `DIS = DELIBERATE."` + metadata)

- [ ] **Step 1: Insert the banner and six entries**

```javascript
    // ── Threat Vectors lesson (v8.16.0, 2026-08-22) — 12 entries (10 vectors + 2 review-debt) ──
    // Founder notes (public SY0-701 objectives + free Professor Messer material),
    // covering the non-human half of obj 2.2; the human half shipped as v8.15.0.
    // Items 11-12 close the two micro-gaps queued by the v8.14.0/v8.15.0
    // whole-branch reviews (impersonation never keyed; ethical motivation absent).
    {"type":"mcq","question":"After an audit, a logistics firm disables eleven unused network services and closes their ports. Six months later an attacker still breaches the firm through a phishing email to a dispatcher. Which pairing correctly labels the two facts?","difficulty":"Foundational","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"The service closures reduced the threat vector; the email was the attack surface","B":"The service closures reduced the attack surface; the email was the threat vector used","C":"Both describe threat vectors","D":"Both describe the attack surface"},"answer":"B","explanation":"Attack surface is the whole set of points an attacker could try — every service, port, mailbox and person. A threat vector is the specific route actually used. Closing unused services removed entry points that were never used in the end; the breach travelled through one route that remained: a message to a human. Reducing the surface narrows the options; it does not eliminate the vectors that stay open. (A) Wrong — reversed. (C) Wrong — the eleven services were part of the surface, and closing them is surface reduction, which is how the objectives frame it; calling both facts vectors throws away the distinction being tested. (D) Wrong — the email names the route in, which is precisely what vector means. Memory: surface = every door and window; vector = the unlocked window they climbed through.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A stock-photo marketplace lets users upload graphics. An attacker uploads an SVG file with script embedded in its markup; when a moderator opens the file directly in her browser, the embedded script runs in the marketplace's own origin. Which threat vector class does this attack use?","difficulty":"Exam Level","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"File-based, because an upload is involved","B":"Message-based","C":"Removable device","D":"Image-based"},"answer":"D","explanation":"SVG is the reason image-based exists as its own SY0-701 category: unlike a flat bitmap, it is XML — structured markup that can carry links, references and script — and an application that processes it insecurely can be made to execute what it carries. The lure IS the image. (A) Wrong — the tempting near-miss. Transport only settles message-based versus not; once no message is involved, the object type decides — and the objectives name image-based for malicious content inside image formats, keeping file-based for documents, archives and executables. (B) Wrong — no message was sent to the victim; she opened the file in the course of her job. (C) Wrong — nothing physical was connected. Exam clue: script inside an image format that executes on processing = image-based.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A junior analyst runs a port scan against the company's public web server and reports TCP 443 open as a security finding requiring remediation. Which statement BEST describes the situation?","difficulty":"Exam Level","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"The analyst is right: any open port is an exploitable vulnerability","B":"The analyst is wrong, because a port serving patched TLS on a hardened server does not contribute to attack surface","C":"An open port is exposure rather than a vulnerability; the risk lives in unneeded ports and in the services behind open ones","D":"The finding should be closed by moving the service to a non-standard port number, which hides it from casual scanning and resolves the exposure"},"answer":"C","explanation":"A web server exists to answer on 443; the open port is the service working as designed. What deserves the analyst's attention is different: ports open with no business need, and the state of the software listening — an exposed service that is vulnerable or misconfigured turns ordinary exposure into an attack path. Each listening service adds to the attack surface, which is why unnecessary ones get closed. (A) Wrong — collapses exposure into vulnerability; if it were true, every functioning server would be a finding. (B) Wrong — a patched service still adds to the attack surface; exposure counts even when nothing is currently exploitable, which is why open ports merit inventory regardless of patch state. (D) Wrong — moving a port hides nothing from a full-range scan and relocates the exposure without changing the service behind it; obscurity is not remediation. Memory: open port = a doorway, not a break-in; count the doorways, harden what answers the door.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An architecture practice enables RDP on an internet-facing server so staff can reach CAD software from home, though a VPN was available. A vulnerability in the RDP service is later exploited from the internet. What most directly INCREASED the attack surface here?","difficulty":"Foundational","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Exposing RDP to the internet when the VPN already met the need","B":"The staff working from home","C":"The CAD software's licensing model","D":"Running the CAD software on an unsupported operating system"},"answer":"A","explanation":"Attack surface grows with every service reachable by an attacker, and internet-facing RDP is the textbook unnecessary exposure — remote access was already solvable through the VPN, which would have kept 3389 off the public internet entirely. The exploit that followed travelled through exposure that did not need to exist. (B) Wrong — remote work created the requirement, not the exposure; the choice of HOW to meet it did that. (C) Wrong — licensing is commercially interesting and security-irrelevant here. (D) Wrong — nothing in the scenario says the OS is out of support; unsupported-system findings need their own evidence, and the exploited weakness was reachable because the service was exposed. Exam clue: could the service have stayed unreachable from the internet? Then exposing it is what grew the surface.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A company runs two tools: a time-tracking agent installed on every laptop, and a payroll portal staff reach through a browser with nothing installed locally. A researcher reports a vulnerability in each. Which pairing correctly labels the two software exposure models?","difficulty":"Exam Level","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Time tracker: agentless. Payroll portal: client-based","B":"The distinction depends on which team operates each tool, not on where the code runs","C":"Both are agentless, because both are business applications","D":"Time tracker: client-based. Payroll portal: agentless"},"answer":"D","explanation":"SY0-701 splits vulnerable software by where it runs. Client-based means code installed on the endpoint — the time-tracking agent — so a flaw in it puts every laptop carrying it at risk, and fixing it means patching every install. Agentless means the user reaches a central service with only a browser — the payroll portal — so the vulnerable code lives server-side, and one compromise of the central application can affect every connecting user at once. Same word, software, two different blast patterns. (A) Wrong — reversed. (B) Wrong — ownership is irrelevant to the category; SY0-701 splits on where the code runs and how it is reached, and the portal installs nothing locally. (C) Wrong — same error from the other side; the agent is on every machine. Memory: client-based = installed on YOUR box; agentless = reached through the browser.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A hotel's ground-floor meeting room, bookable by the public, has live Ethernet wall jacks that connect directly to the hotel's internal corporate LAN. Which vector does this create, and which control MOST directly closes it?","difficulty":"Exam Level","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Unsecure wired network; 802.1X port-based network access control","B":"Unsecure wireless network; WPA3","C":"Open service port; a host firewall on each server","D":"Removable device; USB port lockdown"},"answer":"A","explanation":"Wired does not mean safe — it means the attacker needs to reach a socket, and a publicly bookable room hands them one. A live jack straight onto the corporate LAN is the unsecure wired network vector. 802.1X closes it by authenticating the connecting device or user BEFORE the switch port forwards traffic, so an unknown laptop in the meeting room gets no access to the corporate LAN. (B) Wrong — no radio is involved, and WPA3 protects Wi-Fi associations, not wall jacks. (C) Wrong — host firewalls narrow what a connected attacker can reach; the vector is being connected at all. (D) Wrong — nothing is plugged into a USB port; the plug goes into the wall. Exam clue: exposed Ethernet + who-can-plug-in = unsecure wired; the fix that names itself is 802.1X.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
```

- [ ] **Step 2: Verify — counts, length gate, suite**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e '
const s=require("fs").readFileSync("certs/secplus.js","utf8");
console.log("total:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length,"| AV:",(s.match(/"topic":"Attack Vectors & Surfaces"/g)||[]).length);
const rows=s.split("\n").filter(l=>l.includes(String.raw`"addedVersion":"8.16.0"`));
let longest=0;
rows.forEach(l=>{const e=JSON.parse(l.trim().replace(/,$/,""));const k=e.answer;const lens=Object.entries(e.options).map(([o,t])=>[o,t.length]);const max=Math.max(...lens.map(x=>x[1]));if(e.options[k].length===max&&lens.filter(x=>x[1]===max).length===1)longest++;});
console.log("new items:",rows.length,"| correct-is-strictly-longest:",longest,"(gate: <=5 of 12 at Task 3)");' && npm run test:uat 2>&1 | grep "UAT:"
```

Expected: `total: 339 | AV: 10`, new items 6, UAT green. The length count is informational here; the ≤5 gate binds at Task 3 when all 12 exist.

- [ ] **Step 3: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.2 vector exemplars 1-6

Vector-vs-attack-surface, image-based (first pack coverage), the
open-port-is-not-a-vulnerability trap, exposed RDP as surface growth,
client-based vs agentless (named in the objectives, zero coverage), and
the unsecure wired jack with 802.1X.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Add lesson exemplars 7–10 + the two review-debt micro-items

**Files:**
- Modify: `certs/secplus.js` — append beneath Task 2's last entry (ends `the fix that names itself is 802.1X.` + metadata), before the closing `],`

- [ ] **Step 1: Append the six entries**

```javascript
    {"type":"mcq","question":"A warehouse issues staff handheld inventory scanners that pair with terminals over Bluetooth. A security test finds the scanners run a Bluetooth implementation with a known exploitable flaw, reachable by an attacker parked outside the loading bay. Which vector category is this?","difficulty":"Foundational","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Unsecure wired network","B":"Supply chain compromise of the scanner vendor","C":"Unsecure network — Bluetooth","D":"Open service port"},"answer":"C","explanation":"SY0-701 groups unsecure networks into wireless, wired and Bluetooth, and this is the third: a short-range radio link whose weak implementation lets a nearby attacker connect, snoop or exploit. Range is the operational detail — the attacker must be close, and a loading bay with a car park delivers close. (A) Wrong — no cable or wall jack is involved. (B) Wrong — supply chain would mean the scanners arrived compromised from the vendor; here the shipped feature is merely weak, discovered in place. (D) Wrong — open service ports describe TCP/UDP exposure on a network host, not a radio pairing protocol. Memory: the unsecure-network vector has three legs — Wi-Fi, wall jack, Bluetooth.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"In one week, ransomware detonates inside dozens of small accounting firms across a region. Investigators find the firms share no software, no staff and no clients — but all outsource their IT to the same provider, whose remote-administration tool pushed the payload to every customer it managed. Which vector does this describe, and why is it so effective?","difficulty":"Hard","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Watering hole; the victims all visited one compromised site","B":"Supply chain via a managed service provider; one compromise inherits every customer's trusted access","C":"Default credentials; the firms shared factory passwords","D":"Unsecure wireless; the firms shared a regional network"},"answer":"B","explanation":"The one thing the victims share is the MSP — and an MSP holds standing administrative access into every customer it manages, which is exactly the access its remote-admin tooling used to push the payload. Compromise the provider once and the attacker inherits every customer's trust relationship: 1 attacker, 1 MSP, dozens of victims, no per-victim break-in required. The objectives name MSPs alongside vendors and suppliers under supply chain for this reason. (A) Wrong — nothing was visited; the payload was pushed through management channels. (C) Wrong — the stem gives no credential detail, and shared factory passwords would not explain the single common provider. (D) Wrong — firms sharing no software, staff or clients are not on a shared network; only the provider is common. Exam clue: many unrelated victims + one shared service provider = supply chain through the MSP.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"Two findings from one scan: server ALPHA misses a critical patch its vendor released last month; server BRAVO runs an application whose vendor ended all support two years ago, and a new critical flaw in it was published this week. Which pairing is correct?","difficulty":"Hard","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"ALPHA: unsupported system. BRAVO: vulnerable software","B":"Both: unsupported systems","C":"Both: vulnerable software, and the distinction carries no practical weight","D":"ALPHA: vulnerable software. BRAVO: unsupported system"},"answer":"D","explanation":"The categories split on whether a fix can exist. ALPHA is vulnerable software: the flaw is real but the remedy is sitting in the vendor's release notes — remediation is applying it. BRAVO is an unsupported system: support ended, so this week's flaw and every future one arrive with no patch coming, and remediation means upgrading, isolating or compensating around the application. (A) Wrong — reversed. (B) Wrong — ALPHA's vendor is active; missing an available patch is an operations failure, not end of life. (C) Wrong — the distinction is precisely the practical point: one finding closes with an update, the other cannot. Exam clue: patch available but unapplied = vulnerable software; no patch ever coming = unsupported.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A project manager receives a Microsoft Teams direct message from a colleague's genuine account — quietly compromised the day before — sharing a 'project tracker' link that leads to a credential-harvesting page. Which vector category delivered this attack?","difficulty":"Exam Level","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Image-based content embedded in the message preview","B":"Message-based — instant messaging","C":"Removable device","D":"Voice call"},"answer":"B","explanation":"Message-based covers email, SMS and instant messaging, and a Teams DM is the third of those. The compromised-real-account detail explains why the attack lands: every sender-trust habit the victim has — the right name, the shared history, the internal platform — reports nothing wrong, because the account is genuine even though the hand on the keyboard is not. (A) Wrong — the payload is a link, not content smuggled inside an image format. (C) Wrong — nothing physical is connected. (D) Wrong — no call takes place. Exam clue: Teams, Slack or DM delivery = message-based, exactly like email — the channel changed, the category did not.","source":"curated-lesson-threat-vectors","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A man in a courier uniform carrying a parcel walks confidently past a busy reception desk, through the office, and out with a laptop from an empty desk. No courier delivery was scheduled and the uniform was bought online. Which social engineering technique did his appearance exploit?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"Phishing","B":"Watering hole","C":"Impersonation","D":"Typosquatting"},"answer":"C","explanation":"The uniform and parcel are a claimed identity: couriers are expected, unremarkable and waved through, and pretending to BE one is impersonation — the WHO of social engineering, worn instead of spoken. Nobody challenged him because the identity he presented answers the question a receptionist would otherwise ask. (A) Wrong — phishing is fraudulent messaging; no message of any kind was sent. (B) Wrong — a watering hole compromises a website the targets frequent; this is a person in a lobby. (D) Wrong — typosquatting is a lookalike domain catching mistyped addresses; no domain or web address is involved. Memory: impersonation = WHO you pretend to be — and a uniform is the claim made in clothing.","source":"curated-review-debt","addedVersion":"8.16.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A security researcher discovers a serious flaw in a retailer's public API. The retailer runs a published bug-bounty programme whose scope covers the API; the researcher stays inside the programme's testing rules, reports the flaw privately through the programme, and receives the advertised reward. Which motivation classification BEST fits?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Ethical","B":"Financial gain, since money changed hands","C":"Espionage","D":"Service disruption"},"answer":"A","explanation":"SY0-701 lists ethical among the motivations precisely for this case: authorised security research conducted within agreed rules, aimed at getting flaws fixed rather than exploited. The defining facts are authorisation and disclosure — scope honoured, testing rules followed, report made privately through the sanctioned channel. (B) Wrong — the tempting reading, but the bounty is the programme's own advertised reward for doing exactly what it authorises; taking it does not convert sanctioned research into a profit-motivated attack. The exam separates the classifications on conduct, and every element of the conduct here is the authorised kind. (C) Wrong — nothing is covertly collected for a third party. (D) Wrong — nothing was taken offline; the point of the report is to prevent that. Memory: in scope + disclosed responsibly = ethical, bounty or no bounty.","source":"curated-review-debt","addedVersion":"8.16.0","addedDate":"2026-08-22"},
```

- [ ] **Step 2: Full verification — counts, letters, difficulty, sources, LENGTH GATE, guard**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e '
const s=require("fs").readFileSync("certs/secplus.js","utf8");
const m=s.match(/"objective":"(\d+)\.\d+"/g)||[];const c={1:0,2:0,3:0,4:0,5:0};
m.forEach(x=>c[x.match(/"objective":"(\d+)\./)[1]]++);
const t={1:12,2:22,3:18,4:28,5:20},tol={1:19,2:10,3:10,4:10,5:10};let ok=true;
for(const k of [1,2,3,4,5]){const p=c[k]/m.length*100;if(Math.abs(p-t[k])>tol[k])ok=false;}
console.log("total:",m.length,"| AV:",(s.match(/"topic":"Attack Vectors & Surfaces"/g)||[]).length,"| SE:",(s.match(/"topic":"Social Engineering"/g)||[]).length,"| 2.1:",(s.match(/"objective":"2\.1"/g)||[]).length,"| GUARD:",ok?"PASS":"FAIL");
const rows=s.split("\n").filter(l=>l.includes(String.raw`"addedVersion":"8.16.0"`));
const letters={},diff={},src={};let longest=0;
rows.forEach(l=>{const e=JSON.parse(l.trim().replace(/,$/,""));
letters[e.answer]=(letters[e.answer]||0)+1;diff[e.difficulty]=(diff[e.difficulty]||0)+1;src[e.source]=(src[e.source]||0)+1;
const max=Math.max(...Object.values(e.options).map(x=>x.length));
if(e.options[e.answer].length===max&&Object.values(e.options).filter(x=>x.length===max).length===1)longest++;});
console.log("n:",rows.length,"| letters:",JSON.stringify(letters),"| difficulty:",JSON.stringify(diff));
console.log("sources:",JSON.stringify(src));
console.log("LENGTH GATE: correct strictly longest in",longest,"of",rows.length,"—",longest<=5?"PASS":"FAIL");' && npm run test:uat 2>&1 | grep "UAT:"
```

Expected: `total: 345 | AV: 14 | SE: 19 | 2.1: 19 | GUARD: PASS`; `n: 12`; letters `{"B":3,"D":3,"C":3,"A":3}`; difficulty `{"Foundational":3,"Exam Level":7,"Hard":2}`; sources `{"curated-lesson-threat-vectors":10,"curated-review-debt":2}`; **LENGTH GATE PASS**; UAT green. A length-gate FAIL is fixed by padding distractors on the offending items — never by trimming keys — then re-running.

- [ ] **Step 3: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.2 vector exemplars 7-10 + two review-debt items

Bluetooth as the third unsecure-network leg, the MSP supply-chain
scaling item, vulnerable-vs-unsupported as a discrimination, and
message-based via a compromised Teams account.

Plus the two micro-gaps both whole-branch reviews queued: impersonation
finally keyed as a correct answer (courier-uniform walk-in), and the
ethical motivation (in-scope bug bounty) that actor-identification
stems can never reach.

Closes the lesson at 12 items: letters A3/B3/C3/D3, spread 3F/7E/2H,
pool length gate passed.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Add the 2 retention concepts

**Files:**
- Modify: `certs/secplus.js` — insert after the v8.15.0 phishing pair (line 112, ends `…is the class of control that dependably still works…' },`) and before the `],` at line 113

- [ ] **Step 1: Insert the banner and two entries**

```javascript
    // ── Threat Vectors lesson (v8.16.0, 2026-08-22) — 2 entries for obj 2.2 ──
    { label: 'Vector vs surface, and the four buckets', parentTopic: 'Attack Vectors & Surfaces', objective: '2.2', keyword: 'Four questions untangle most scenario stems. WHO attacked = threat actor. WHY = motivation. HOW did they reach you = threat vector. WHERE COULD they have = attack surface. The house picture holds the last two apart: every door, window, garage and chimney together is the attack surface; the one unlocked window the burglar actually used is the threat vector. Shrinking the surface (closing ports, removing services, decommissioning old systems) narrows the attacker\'s options without eliminating the routes that remain open. Then group the SY0-701 vector list into four recallable buckets. DELIVERY — something is sent or carried to you: messages (email, SMS, instant messaging), images (SVG carrying script), files (macro documents, archives, executables), voice calls, removable devices. TECHNOLOGY — a weakness waits to be found: vulnerable software (client-based = installed on the endpoint; agentless = reached through a browser, so the flaw lives centrally), unsupported systems past vendor end of life, unsecure networks (wireless, wired, Bluetooth — the wall jack counts), open service ports, default credentials. TRUST — something already trusted is turned: supply chain through MSPs, vendors and suppliers, and the watering-hole site your team already visits. HUMAN — the social-engineering family, held in the Social Engineering retention entries. One scenario often crosses buckets: a phishing email carrying a macro spreadsheet is DELIVERY twice over — message-based vector, file-based payload container.' },
    { label: 'Vector recognition tells + the two traps', parentTopic: 'Attack Vectors & Surfaces', objective: '2.2', keyword: 'The exam names the vector through one operational detail — learn the tells as reflexes. USB found in the car park = removable device. admin/admin still working = default credentials. Vendor stopped patching = unsupported system (remediation is architectural: replace, isolate, compensate — no download is coming). Unneeded RDP or SSH reachable from the internet = open service port growing the attack surface. Script inside an SVG executing on view = image-based. Teams, Slack or SMS delivery = message-based, exactly like email. Live Ethernet jack in a public room = unsecure wired (the fix that names itself: 802.1X port-based access control). Nearby attacker and a weak pairing protocol = unsecure Bluetooth. Many unrelated victims sharing one service provider = supply chain through the MSP, because one provider compromise inherits the admin access every customer already granted. Then the two traps. TRAP ONE: an open port is exposure, not a vulnerability — 443 open on a web server is the machine doing its job; risk concentrates in ports nobody needs and in vulnerable or misconfigured services behind open ones. TRAP TWO: vulnerable is not unsupported — vulnerable software has a patch available but unapplied (an operations failure, fixed by updating), while an unsupported system will never receive one (an architecture problem, fixed by upgrading or isolating). The remediation path is what the exam is really asking for.' },
```

- [ ] **Step 2: Verify guard-invisibility and suite; commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("retention:",(s.match(/parentTopic:/g)||[]).length,"| AV retention:",(s.match(/parentTopic: .Attack Vectors & Surfaces./g)||[]).length,"| guard-counted:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length);' && npm run test:uat 2>&1 | grep "UAT:"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.2 vector retention concepts

Vector-vs-surface with the four-bucket recall structure (delivery /
technology / trust / human), and the clue-to-vector tells plus the two
traps: open port is exposure not vulnerability, and vulnerable is not
unsupported -- the remediation path differs.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected: `retention: 42 | AV retention: 3 | guard-counted: 345` — exemplar count unchanged. (AV retention counts 3: one pre-existing entry + these two.)

---

### Task 5: Apply the 4 debt fixes

**Files:**
- Modify: `certs/secplus.js`
- Modify: `docs/superpowers/plans/2026-08-22-secplus-threat-actors.md` (fixes 1–2 text also lives there)
- Modify: `docs/superpowers/plans/2026-08-22-secplus-phishing.md` (fixes 3–4 text also lives there)

All are exact substring replacements, verified present exactly once per target file.

- [ ] **Step 1: FIX 1 — vector-slot naming, exemplar (pack + threat-actors plan)**

FIND: `"Actor: organized crime. Motivation: financial gain. Vector: phishing email"`
REPLACE: `"Actor: organized crime. Motivation: financial gain. Vector: email (the phishing message)"`

FIND: `the phishing email, which is the vector`
REPLACE: `the email that delivered it, which is the vector`

- [ ] **Step 2: FIX 2 — vector-slot naming, retention concept (pack + threat-actors plan)**

FIND: `Vector = phishing email`
REPLACE: `Vector = email (the phishing message)`

- [ ] **Step 3: FIX 3 — whaling cast re-skin (pack + phishing plan)**

FIND: `referencing her conference schedule, carrying a malicious 'itinerary update' attachment`
REPLACE: `referencing her recent earnings call, carrying a malicious 'board minutes' attachment`

- [ ] **Step 4: FIX 4 — typosquatting keyed rationale broadened (pack + phishing plan)**

FIND: `Registering a domain one keystroke from the real one to harvest mistyped traffic is typosquatting`
REPLACE: `Registering a lookalike domain one keystroke from the real one — caught by mistyping or misread at a glance — is typosquatting`

- [ ] **Step 5: Verify and commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && grep -rcF "Vector: phishing email" certs/secplus.js docs/superpowers/plans/2026-08-22-secplus-threat-actors.md; grep -cF "conference schedule, carrying a malicious" certs/secplus.js docs/superpowers/plans/2026-08-22-secplus-phishing.md; node --check certs/secplus.js && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("guard-counted:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length);' && npm run test:uat 2>&1 | grep "UAT:"
git add certs/secplus.js docs/superpowers/plans/2026-08-22-secplus-threat-actors.md docs/superpowers/plans/2026-08-22-secplus-phishing.md
git commit -m "fix(secplus): apply the cheap debt fixes queued by both whole-branch reviews

- 2.1's actor/motivation/vector item and retention concept now render
  the slot as 'email (the phishing message)', agreeing with the 2.2
  vector items instead of teaching the conflation they punish.
- Whaling-vs-BEC first incident re-skinned off the conference-lure
  template it shared with the CISO item.
- Typosquatting's keyed rationale broadened to match its own (D)
  rebuttal and the indicators multi-select.

Prior plan docs updated in lockstep. The distractor-padding pass stays
deferred to the combined generator-cue rebalance per the audit addendum.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected: all old-string greps 0; `guard-counted: 345` unchanged; UAT green.

---

### Task 6: Ship v8.16.0

- [ ] **Step 1:** `npm test` — full battery. E2E failures: triage against touched files (only `certs/secplus.js` + docs); pre-existing flakes reported, never fixed; never re-baseline visuals.
- [ ] **Step 2:** `node scripts/bump-version.js 8.16.0 "Sec+ Threat Vectors lesson (obj 2.2) — 12 new exemplars (10 vectors + 2 review-debt) + 4 rewritten + 2 retention concepts + queued debt fixes"`
- [ ] **Step 3:** CHANGELOG row beneath the `|---|---|` header:

```markdown
| v8.16.0 | Sec+ Threat Vectors (obj 2.2): 10 vector exemplars (image-based, open ports, client-vs-agentless, MSP, wired/Bluetooth, vector-vs-surface) + keyed impersonation + ethical motivation + 4 rewritten + 2 retention concepts + review-debt fixes. AV topic 4→14 |
```

- [ ] **Step 4:** Confirm 8.16.0 in `package.json`, `CLAUDE.md`, `CHANGELOG.md`.
- [ ] **Step 5:** Commit (message below) and push. **The founder's pre-existing `.github/workflows/vercel-incident-recovery.yml` edit is in the working tree — it is NOT part of this ship. Stash it, commit, restore it unstaged, and confirm in the report that `git stash list` is empty afterwards** (an earlier run orphaned a stash; do not repeat that).

```
v8.16.0 — Sec+ Threat Vectors lesson (obj 2.2)

Attack Vectors & Surfaces: 14 exemplars, up from 4. Every named
non-human 2.2 vector now covered, including first-ever image-based,
open-port, client-vs-agentless and MSP items. Both queued micro-gaps
closed (impersonation keyed, ethical motivation). Cheap debt fixes from
both prior whole-branch reviews landed; padding pass stays deferred to
the combined generator-cue rebalance.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

- [ ] **Step 6:** Wait for both CI workflows to CONCLUDE green (`gh run list`); BLOCKED on failure.
- [ ] **Step 7 (founder-only, BYOK, post-ship):** generate batches on Attack Vectors & Surfaces; image-based, open ports, client-vs-agentless and MSP must surface.
- [ ] **Step 8:** Notion per ledger conventions.

---

## Self-Review

**Spec coverage:** 10 lesson items (T2: 6, T3: 4) ✓ · 2 micro-items (T3) ✓ · 4 rewrites incl. :582 harmonisation (T1) ✓ · 2 retention concepts (T4) ✓ · 4 debt fixes in pack + prior plan docs (T5) ✓ · letters A3/B3/C3/D3 + spread 3F/7E/2H + sources 10/2 + length gate ≤5/12, all asserted (T3 Step 2) ✓ · v8.16.0 ship + stash discipline (T6) ✓.

**Placeholders:** none — all literal text present, all commands runnable with expected outputs.

**Consistency:** counts chain 333 → (T1) 333 → (T2) 339 → (T3) 345 → (T4) 345 → (T5) 345. AV 4 → 4 → 10 → 14. SE 18 → 19 (item 11). 2.1 18 → 19 (item 12). Retention 40 → 42. Vector-framing agreement checked across :780 (technique vs vector), rewritten :582 (harmonised), and new items 2/10 (image-based vs file-based; message-based scope) — all consistent. Casts distinct from all 15 existing 2.1/2.2 casts and from each other (logistics audit, stock-photo marketplace, e-commerce port scan, architecture RDP, HR time-tracker/payroll, hotel meeting room, warehouse scanners, regional accounting MSP, ALPHA/BRAVO servers, Teams project tracker, courier walk-in, bug-bounty API).
