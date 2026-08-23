# Sec+ Phishing (obj 2.2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take Security+ objective 2.2 Social Engineering from 7 identification-only exemplars to 18 covering the discriminations and gaps the exam tests, plus 2 retention concepts and the 4 Threat Actors wording fixes queued by the v8.14.0 review.

**Architecture:** Pure data change to `certs/secplus.js` (plus lockstep text fixes in the v8.14.0 plan doc). Eleven exemplars append to `questionExemplars`; the seven existing Social Engineering entries are rewritten in place; two entries append to `retentionGapConcepts`; four substring fixes land in the Threat Actors lesson. No JS logic changes.

**Tech Stack:** Vanilla JS cert-pack data. Node UAT harness. No build step.

**Spec:** `docs/superpowers/specs/2026-08-22-secplus-phishing-design.md`

## Global Constraints

- **Compact JSON-string form, no space after any colon** — the domain guard counts `"objective":"N.M"` by regex; a space silently uncounts the entry.
- New exemplars carry `"source":"curated-lesson-phishing"` (10 items) or `"source":"curated-objectives-2.2"` (the misinformation item only), `"addedVersion":"8.15.0"`, `"addedDate":"2026-08-22"`.
- `"topic":"Social Engineering"` and `"objective":"2.2"` exactly, on every new exemplar.
- All 11 new items are **mcq** keying `"answer"` as a single letter. Letter distribution across the 11 is fixed by this plan: A×3, B×2, C×3, D×3 — the ≥3-D floor is a spec requirement.
- Rewrites (Task 1) change **explanation prose only** — questions, options, answers, difficulty, and original metadata (`curated-secplus-phase3` / `7.4.0` / `2026-05-27`) stay byte-identical. One exception, explicit in Task 1: the multi-select's `"answer":[` key is renamed `"answers":[`.
- Retention concepts use the single-quoted JS object form — invisible to the guard by design.
- **Do not modify** `domainWeights`, `topicDomains`, `topicResources`, `_pickExemplarsForTopic`, `_formatExemplarsForPrompt`, or any test file. Guard trips → trim, never widen (2026-07-27).
- House explanation format: answer rationale → `(X) Wrong — …` for EVERY distractor → memory trick or exam clue.
- Authoring rules (binding, from the spec): grounded in own stem; no absolutes the exam hedges; no grammar cues (correct options must not be systematically hedged/longest); no two new items sharing a target-industry + pretext template.
- **Target version 8.15.0. Date 2026-08-22. Branch: main (Fast lane, founder-approved).**

---

### Task 1: Rewrite the 7 existing Social Engineering exemplars

**Files:**
- Modify: `certs/secplus.js:544-550`

**Interfaces:**
- Consumes: nothing. Produces: nothing later tasks rely on.

- [ ] **Step 1: Baseline**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("total:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length,"| 2.2:",(s.match(/"objective":"2\.2"/g)||[]).length,"| SE topic:",(s.match(/"topic":"Social Engineering"/g)||[]).length);' && npm run test:uat 2>&1 | tail -2
```

Expected: `total: 322 | 2.2: 11 | SE topic: 7` and `UAT: 5008/5008 ALL PASS`. If different, stop — line numbers are stale.

- [ ] **Step 2: Replace line 544 (vishing helpdesk)**

```javascript
    {"type":"mcq","question":"An attacker calls the company helpdesk impersonating the CFO and demands an immediate password reset, citing an upcoming board meeting. The helpdesk technician complies without verifying the caller's identity. Which social engineering technique BEST describes this attack?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"Phishing","B":"Vishing","C":"Smishing","D":"Whaling"},"answer":"B","explanation":"The delivery channel decides the label, and the channel here is a phone call: voice-based social engineering is vishing. The impersonation and the board-meeting urgency are the manipulation inside the call, not the name of the technique. (A) Wrong — phishing names the email-borne form; when the stem specifies a call, CompTIA expects the channel-specific term. (C) Wrong — smishing is the SMS-borne form; no text message is involved. (D) Wrong — whaling describes an attack whose TARGET is a high-value executive; here the executive identity is being borrowed to pressure the helpdesk, which makes the technician the target. Memory: vishing = VOICE.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 3: Replace line 545 (BEC wire transfer)**

```javascript
    {"type":"mcq","question":"An accounts payable clerk receives an email appearing to be from the CEO requesting an urgent wire transfer of $90,000 to a new vendor. The email signature, formatting, and writing style match the CEO's prior correspondence. The clerk processes the transfer; the funds are unrecoverable. Which attack type is this?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"Spear phishing","B":"Whaling","C":"Business email compromise","D":"Pharming"},"answer":"C","explanation":"Business email compromise is the category CompTIA reserves for exactly this shape: a trusted business identity borrowed to push a fraudulent financial transaction through the people who approve payments. The studied mimicry of the CEO's style is what makes it work. (A) Wrong — spear phishing is the broader targeted-message technique BEC is built on; when the fraud is a business payment through an impersonated executive, BEC is the more specific answer. (B) Wrong — whaling makes the executive the victim; here the executive is the borrowed identity and the clerk is the victim. (D) Wrong — pharming redirects users to malicious sites through DNS or hosts-file manipulation; nothing here involves name resolution. Exam clue: executive identity + money moving = BEC.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 4: Replace line 546 (smishing IRS)**

```javascript
    {"type":"mcq","question":"A finance employee receives an SMS message reading: 'IRS notice: outstanding tax balance. Pay within 24 hours to avoid prosecution. Click https://irs-payment-secure.co/file'. The link leads to a credential-harvesting page. Which attack technique is this?","difficulty":"Foundational","topic":"Social Engineering","objective":"2.2","options":{"A":"Phishing","B":"Vishing","C":"Smishing","D":"Watering hole"},"answer":"C","explanation":"An SMS delivery channel makes this smishing — the SMS-borne form of phishing. The fear lever (prosecution, 24-hour deadline) and the harvesting page are standard phishing machinery; the text-message channel is what picks the term. (A) Wrong — phishing is the general email-borne form; when the stem names SMS, CompTIA expects the channel-specific label. (B) Wrong — vishing is voice; no call happens. (D) Wrong — a watering hole compromises a site the target population already visits and waits for them to arrive; this message was pushed directly to the victim. Memory: smishing = SMS.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 5: Replace line 547 (whaling CISO)**

```javascript
    {"type":"mcq","question":"A targeted attack against the CISO of a Fortune 500 company uses a highly customized email referencing the CISO's recent industry talk and including a malicious PDF attachment supposedly containing speaker feedback. Which classification BEST applies?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"Phishing","B":"Spear phishing","C":"Whaling","D":"Business email compromise"},"answer":"C","explanation":"Whaling is spear phishing whose target is a high-value executive, and both halves are present: the reconnaissance (the recent talk) makes it targeted, and the CISO makes it a whale. (A) Wrong — phishing without a qualifier is the mass, untargeted form; a message built around one person's conference appearance is the opposite of a mass blast. (B) Wrong — accurate but not BEST; when the researched target is an executive, whaling is the more specific term the exam wants (C-suite = whale is the whole mnemonic). (D) Wrong — BEC borrows an executive identity to defraud someone else, typically finance; here the executive IS the victim and no transaction is requested. Exam clue: who receives the attack decides whaling; whose name is borrowed decides BEC.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 6: Replace line 548 (pretexting contractor)**

```javascript
    {"type":"mcq","question":"An attacker contacts the IT helpdesk claiming to be a new contractor working on a security audit. They reference a real project name (gathered from LinkedIn) and request elevated access to verify firewall configurations. The story is fabricated but plausible. Which technique is the attacker using?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"Pretexting","B":"Tailgating","C":"Brand impersonation","D":"Typosquatting"},"answer":"A","explanation":"Pretexting is the fabricated-but-plausible story: contractor, real project name, credible business reason for elevated access. The researched detail is what sells the pretext — the stem even shows where it came from. (B) Wrong — tailgating is physical entry by following an authorised person through a controlled door; this attack never leaves the phone. (C) Wrong — brand impersonation mimics a known company's visual identity (its pages, logos, notifications); a fake individual with a fake job is not a brand. (D) Wrong — typosquatting registers lookalike domains to catch mistyped URLs; no domain is involved. Memory: pretexting = the STORY.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 7: Replace line 549 (watering hole)**

```javascript
    {"type":"mcq","question":"Threat actors compromise a developer forum frequented by employees of a specific defense contractor. They embed exploit code in the forum's JavaScript that targets only browsers connecting from that contractor's IP ranges. Which attack pattern is this?","difficulty":"Hard","topic":"Social Engineering","objective":"2.2","options":{"A":"Spear phishing","B":"Watering hole","C":"Supply chain attack","D":"Brand impersonation"},"answer":"B","explanation":"A watering hole poisons a third-party site the target population already frequents and waits for the prey to come to it — the IP-range filter is the tell that one organisation's visitors are the intended catch. No message is ever sent to a victim. (A) Wrong — spear phishing pushes a crafted message at the target; here the attacker pulls, letting routine browsing do the delivery. (C) Wrong — a supply chain attack compromises something the victim procures or depends on (a vendor, a component, an update channel); a public forum the employees merely read is not in the contractor's supply chain. (D) Wrong — brand impersonation copies a trusted company's identity; the forum is the real forum, genuinely compromised. Exam clue: attacker goes where the targets already gather = watering hole.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 8: Replace line 550 (indicators multi-select) — includes the `answer` → `answers` key fix**

The current entry keys its correct set as `"answer":["A","B"]` (singular key holding an array). The documented multi-select shape is `"answers"` plural — the runtime scorer's key. `_formatExemplarsForPrompt` reads both, which is why this never visibly broke. Normalise it now:

```javascript
    {"type":"multi-select","question":"Which TWO indicators in an email are MOST consistent with a phishing attempt?","difficulty":"Foundational","topic":"Social Engineering","objective":"2.2","options":{"A":"Sender domain 'paypa1-security.com'","B":"Reply-to address differs from sender domain","C":"Email contains the recipient's correct first name","D":"Message body is signed with a valid DKIM signature"},"answers":["A","B"],"explanation":"A and B are the two standard indicators. A typosquatted sender domain — the digit 1 standing in for the letter l in paypa1 — is a lookalike registered to survive a quick glance, and a Reply-to that quietly differs from the From domain routes responses to the attacker while the visible sender stays plausible. (C) Wrong — a correct first name once suggested legitimacy, but breached data and public profiles make personalisation routine in spear phishing; it no longer discriminates in either direction. (D) Wrong — a valid DKIM signature is evidence the message really did leave the claimed domain's mail infrastructure, which points toward legitimacy rather than away from it. Exam clue: check what the sender IS (domain, reply path), not how friendly the message sounds.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 9: Verify counts unchanged, key renamed, suite green**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("total:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length,"| 2.2:",(s.match(/"objective":"2\.2"/g)||[]).length,"| SE answer[ arrays on singular key:",(s.split("\n").filter(l=>l.includes(String.raw`"topic":"Social Engineering"`)&&/"answer":\[/.test(l)).length));' && npm run test:uat 2>&1 | tail -2
```

Expected: `total: 322 | 2.2: 11 | SE answer[ arrays on singular key: 0` and UAT 5008/5008.

- [ ] **Step 10: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "refactor(secplus): rewrite obj 2.2 exemplars into house explanation format

Seven Social Engineering exemplars move from pre-v8.7.0 prose to the
per-distractor + memory-closer format. Questions, options, answers,
difficulty, and original metadata unchanged.

One latent shape fix: the indicators multi-select keyed its correct set
as answer:[...] (singular key holding an array). The scorer's documented
key is answers plural; the prompt formatter read both, which is why it
never visibly broke. Normalised.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Add the 6 discriminator exemplars

**Files:**
- Modify: `certs/secplus.js` — insert before the `questionExemplars` closing `],` at line 768

**Interfaces:**
- Consumes: nothing. Produces: the banner comment Task 3 appends beneath.

- [ ] **Step 1: Insert the banner and six entries after the last existing exemplar (the APT item ending `all three words are load-bearing."…},`) and before the closing `],`**

```javascript
    // ── Phishing lesson (v8.15.0, 2026-08-22) — 11 entries covering obj 2.2 ──
    // Sourced from founder study notes (public SY0-701 objectives + free
    // Professor Messer material), except the misinformation item, authored
    // directly from the public Skills Measured doc and tagged separately.
    // Spine is discrimination between overlapping techniques; the existing
    // seven items are all single-technique identification.
    {"type":"mcq","question":"Two emails arrive at a company on the same morning. The first, sent to thousands of addresses, opens 'Dear customer' and warns that a streaming subscription payment failed. The second, sent only to one engineer, opens with her name, references the build server her team migrated last week, and attaches a 'migration checklist'. Which pairing is correct?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"First: spear phishing. Second: phishing","B":"Both: spear phishing, since both arrive by email","C":"First: phishing. Second: spear phishing","D":"Both: whaling, since a company is targeted"},"answer":"C","explanation":"The discriminator is research. The first message knows nothing about its recipients — a mass blast priced on volume, where the sender does not care that many recipients have no such subscription. The second was built from knowledge of one person and her team's recent work, which is what spear phishing means. (A) Wrong — reversed. (B) Wrong — the channel is shared but the targeting is not, and targeting is the axis the two terms divide. (D) Wrong — whaling requires the target to be a high-value executive; an engineer receiving a targeted message is spear phishing, and 'a company is involved' describes nearly every workplace attack. Memory: spear = SPECIFIC — the message knows something about you.","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"Incident one: a company's CFO receives a personally addressed email referencing her conference schedule, carrying a malicious 'itinerary update' attachment. Incident two: a payroll officer receives an email that claims to be FROM the CFO, instructing an urgent salary-system payment to a new account. Which pairing is correct?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"First: business email compromise. Second: whaling","B":"First: whaling. Second: vishing","C":"First: spear phishing only, since no money is involved","D":"First: whaling. Second: business email compromise"},"answer":"D","explanation":"Ask who the victim is and whose name is on the message. In the first incident the executive RECEIVES the attack — a researched lure aimed at a high-value target, which is whaling. In the second the executive's identity is BORROWED to move money through the person who can authorise it, which is BEC. (A) Wrong — reversed; it assigns each term to the other incident. (B) Wrong — the first half is right, but vishing is the voice channel and incident two is an email. (C) Wrong — whaling does not require a payment request; a malicious attachment aimed at an executive qualifies on target alone. Exam clue: executive as TARGET = whaling; executive as MASK = BEC.","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An attacker phones an employee: 'Hi, this is David from IT. We are migrating everyone to the new MFA platform this afternoon, so I need the six-digit code that just appeared on your phone to carry your account across.' The exam asks which element of this attack constitutes the PRETEXT. Which is it?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"The fabricated MFA-migration story that makes the request seem routine","B":"The claim to be David from IT","C":"The use of a phone call rather than an email","D":"The six-digit code the attacker is trying to obtain"},"answer":"A","explanation":"Pretexting is the invented scenario — the WHY that makes compliance feel normal. 'We are migrating MFA this afternoon' is that scenario. One call can stack several techniques, and this stem contains four separable elements the exam likes to pull apart. (B) Wrong — claiming to be David from IT is impersonation, the WHO; it answers a different question than the one asked. (C) Wrong — the phone call is the vector, and names the attack vishing; a channel is not a story. (D) Wrong — the code is the objective of the attack, the thing being stolen, not the manipulation used to steal it. Memory: impersonation = WHO you claim to be; pretexting = the STORY you tell.","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An employee receives an email carrying a macro-enabled spreadsheet named 'Q3-Bonus-Review.xlsm'. Opening it installs a remote-access trojan. A security analyst is asked to name the THREAT VECTOR in this incident. Which answer is correct?","difficulty":"Hard","topic":"Social Engineering","objective":"2.2","options":{"A":"Phishing","B":"The remote-access trojan","C":"The macro-enabled spreadsheet","D":"Email (message-based)"},"answer":"D","explanation":"Vector, technique, delivery mechanism and payload are four different answers hiding in one incident, and the stem asks for the vector — the route into the environment, which is the email message. SY0-701 classifies vectors by channel: message-based, image-based, file-based, voice, removable media. (A) Wrong — phishing is the social-engineering TECHNIQUE riding the vector; if the stem asked what kind of attack this is, phishing would be the answer. (B) Wrong — the trojan is the PAYLOAD, what executes after everything else succeeds. (C) Wrong — the spreadsheet is the file-based DELIVERY mechanism carried inside the message; a defensible answer only if the stem had asked how the payload was packaged. Exam clue: read which layer the question names — vector (route), technique (manipulation), delivery (container), payload (result).","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A payroll employee receives an email addressed to him by name, apparently from the company's CFO, referencing this month's payroll run and requesting an urgent transfer to a new vendor account before close of business. The exam asks for the classification that MOST SPECIFICALLY describes this attack. Which is it?","difficulty":"Hard","topic":"Social Engineering","objective":"2.2","options":{"A":"Spear phishing","B":"Business email compromise","C":"Impersonation","D":"Pretexting"},"answer":"B","explanation":"Every option names something genuinely present, which is the trap: the message is targeted (spear phishing), claims a false identity (impersonation), and tells a fabricated story (pretexting). MOST SPECIFICALLY is the operative phrase — BEC is the term that captures the whole shape at once: a trusted business identity used to push a fraudulent payment through the person who can execute it. The general-to-specific ladder runs phishing, spear phishing, BEC. (A) Wrong — true but one rung too general; it describes the targeting without the business-transaction fraud that completes the picture. (C) Wrong — names one component technique inside the attack. (D) Wrong — names another component; the urgent-payroll story is the pretext, not the classification. Exam clue: when several answers are technically present, the exam wants the term that covers the scenario most completely.","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"Attackers compromise the mailbox of a manufacturer's real steel supplier and read traffic for several weeks. When the supplier emails a genuine invoice for a delivered order, the attackers intercept it and re-send it from the same mailbox with one change: the payment account number. The manufacturer's finance team, replying to a thread they started, pays the attacker's account. Which control would MOST reliably have prevented the loss?","difficulty":"Hard","topic":"Social Engineering","objective":"2.2","options":{"A":"User training on spotting spoofed sender domains and lookalike addresses","B":"An email gateway rule quarantining messages that fail SPF and DKIM checks","C":"A secure email gateway scanning attachments for malware","D":"A standing policy that any change to supplier payment details is verified by phone using a number already on file"},"answer":"D","explanation":"This BEC variant defeats the usual controls because nothing about the email is fake: real mailbox, real thread, real invoice, authentication checks passing — only the account number changed. The control that still works is out-of-band verification of the CHANGE, over a channel the attacker does not hold, using contact details that predate the message. (A) Wrong — there is no spoofed domain or lookalike address to spot; the mail genuinely comes from the supplier. (B) Wrong — SPF and DKIM verify the sending infrastructure, and this mail really did leave the supplier's infrastructure, so it passes. (C) Wrong — the invoice is a clean document; the attack is in a number, not a payload. Exam clue: when the compromised party is the SENDER, only verification outside email catches the fraud.","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
```

- [ ] **Step 2: Verify**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("total:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length,"| 2.2:",(s.match(/"objective":"2\.2"/g)||[]).length,"| SE topic:",(s.match(/"topic":"Social Engineering"/g)||[]).length);' && npm run test:uat 2>&1 | tail -2
```

Expected: `total: 328 | 2.2: 17 | SE topic: 13`, UAT green.

- [ ] **Step 3: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.2 discriminator exemplars

Six items covering the pairs the exam separates: spear vs phishing,
whaling vs BEC, impersonation vs pretexting, vector vs technique vs
payload, the most-specific layered scenario, and the supplier
invoice-swap BEC where every standard control legitimately passes.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Add the 4 gap exemplars + the misinformation item

**Files:**
- Modify: `certs/secplus.js` — append directly beneath Task 2's last entry (ends `only verification outside email catches the fraud.`), before the closing `],`

**Interfaces:**
- Consumes: Task 2's banner block. No second banner.

- [ ] **Step 1: Append the five entries**

Note the final entry's distinct source tag — it is authored from the public objectives, not the founder's notes.

```javascript
    {"type":"mcq","question":"An attacker who has obtained a user's password begins logging in repeatedly during the evening. Each attempt pushes an approval notification to the user's phone. After the ninth prompt in twenty minutes, the user taps Approve to stop the interruptions, and the attacker gains access. Which attack is this?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"MFA fatigue","B":"Credential stuffing","C":"Brute force","D":"Session hijacking"},"answer":"A","explanation":"MFA fatigue — also called push bombing — weaponises annoyance: the attacker already holds the password and floods the second factor with approval prompts until the victim approves one just to make them stop. The manipulation targets the human, which is why it sits with social engineering. (B) Wrong — credential stuffing replays breached username-password pairs across many sites; here the password phase is already done and the attack is on the approval step. (C) Wrong — brute force guesses secrets by volume; nothing is being guessed. (D) Wrong — session hijacking steals an already-authenticated session token; no session exists until the victim taps Approve. Memory: repeated push prompts + a worn-down user = MFA fatigue.","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A user mistypes a bank's web address and lands on a site at a domain one letter different from the real one. The page she reaches is a faithful copy of the bank's login screen — logo, colours, layout and fonts all match. Which pairing correctly names the two techniques in play?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"Pharming (the domain) and watering hole (the page)","B":"Typosquatting (the domain) and pharming (the page)","C":"Typosquatting (the domain) and brand impersonation (the page)","D":"Brand impersonation (the domain) and typosquatting (the page)"},"answer":"C","explanation":"Two techniques, one destination. Registering a domain one keystroke from the real one to harvest mistyped traffic is typosquatting. Dressing the page in the bank's visual identity so the arriving victim sees nothing wrong is brand impersonation. They routinely travel together: one supplies the traffic, the other keeps it. (A) Wrong — pharming manipulates name resolution (DNS or hosts file) so a CORRECTLY typed address goes astray; this user mistyped. A watering hole is a genuine site compromised, not a fake one built. (B) Wrong — right about the domain, wrong about the page; no resolution tampering occurred. (D) Wrong — assigns each term to the other artefact. Memory: typosquatting owns the ADDRESS, brand impersonation owns the LOOK.","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A phishing page collects a victim's username and password, then immediately forwards the browser to the organisation's REAL login page, where the victim signs in successfully on their second attempt. From the attacker's point of view, what is the purpose of that redirect?","difficulty":"Foundational","topic":"Social Engineering","objective":"2.2","options":{"A":"It lets the malicious page bypass the organisation's MFA","B":"The victim concludes they mistyped their password, so the theft goes unreported and the credentials stay valid longer","C":"It removes the phishing page from the victim's browser history","D":"It transfers the victim's session cookie to the attacker"},"answer":"B","explanation":"The redirect is stagecraft. A failed login followed by a successful one is an everyday experience — the victim shrugs, assumes a typo, and never reports anything. Unreported means unreset: the stolen credentials keep working until something else raises an alarm. (A) Wrong — forwarding a browser does nothing to satisfy or bypass a second factor; MFA-focused phishing takes more machinery than a redirect. (C) Wrong — the phishing page remains in history like any visited page; redirects do not erase where the browser has been. (D) Wrong — the victim's real session begins on the legitimate site AFTER the theft; the fake page never holds a session cookie to pass on. Exam clue: the redirect buys TIME — suspicion suppressed is a password left unchanged.","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An employee opens an emailed link labelled 'updated holiday policy' and, without entering any credentials, unknowingly downloads a file that encrypts the department's shared drive overnight. The security team classifies the incident as a phishing attack. Why is that classification correct even though no login page was involved?","difficulty":"Foundational","topic":"Social Engineering","objective":"2.2","options":{"A":"Phishing describes the deceptive message that induces the harmful action; credential theft is only one of its possible objectives","B":"It is not correct — an attack without a fake login page is malvertising, not phishing","C":"Because ransomware always arrives by phishing","D":"Because any attack delivered by email is phishing by definition"},"answer":"A","explanation":"Phishing names the deception, not the prize. A fraudulent message engineered a click; what the click delivered — here a ransomware payload — is the objective, and objectives vary: credentials, malware installation, wire transfers, MFA codes, information. (B) Wrong — malvertising plants malicious content in advertising networks; this arrived as a direct message, which is squarely phishing territory. (C) Wrong — an overreach the exam would punish; ransomware also arrives through exposed remote access, exploited services and supply chains. (D) Wrong — also an overreach; email carries plenty of non-phishing attacks, and phishing itself runs over SMS, voice and instant messages. Exam clue: phishing = the fraudulent MESSAGE; what it steals or installs is a separate question.","source":"curated-lesson-phishing","addedVersion":"8.15.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"Two social media accounts share the same false claim that a bank is about to fail. The first account was created by an attacker who wrote the claim knowing it was false, intending to trigger a run on the bank. The second belongs to a customer who read the post, believed it, and shared it to warn friends. Which classification is correct?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"Both accounts are spreading disinformation","B":"The first is spreading misinformation; the second, disinformation","C":"The first is spreading disinformation; the second, misinformation","D":"Both accounts are spreading misinformation"},"answer":"C","explanation":"The content is identical; INTENT separates the terms. Disinformation is false information created or spread deliberately to deceive — the attacker authored the lie with a goal. Misinformation is false information passed on by someone who believes it — the customer deceives no one knowingly, yet still amplifies the harm. The pair matters operationally because influence campaigns seed disinformation precisely so that honest users will launder it into misinformation. (A) Wrong — the customer lacks intent to deceive, which disinformation requires. (B) Wrong — reversed. (D) Wrong — the attacker's deliberate fabrication is the defining case of disinformation. Memory: DIS = DELIBERATE.","source":"curated-objectives-2.2","addedVersion":"8.15.0","addedDate":"2026-08-22"},
```

- [ ] **Step 2: Full verification — counts, letters, difficulty, guard**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e '
const s=require("fs").readFileSync("certs/secplus.js","utf8");
const m=s.match(/"objective":"(\d+)\.\d+"/g)||[];const c={1:0,2:0,3:0,4:0,5:0};
m.forEach(x=>c[x.match(/"objective":"(\d+)\./)[1]]++);
const t={1:12,2:22,3:18,4:28,5:20},tol={1:19,2:10,3:10,4:10,5:10};let ok=true;
for(const k of [1,2,3,4,5]){const p=c[k]/m.length*100,d=p-t[k];if(Math.abs(d)>tol[k])ok=false;}
console.log("total:",m.length,"| 2.2:",(s.match(/"objective":"2\.2"/g)||[]).length,"| SE topic:",(s.match(/"topic":"Social Engineering"/g)||[]).length,"| GUARD:",ok?"PASS":"FAIL");
const rows=s.split("\n").filter(l=>l.includes(String.raw`"addedVersion":"8.15.0"`));
const letters={},diff={};
rows.forEach(l=>{const a=(l.match(/"answer":"([A-E])"/)||[])[1];if(a)letters[a]=(letters[a]||0)+1;const d=(l.match(/"difficulty":"([^"]+)"/)||[])[1];if(d)diff[d]=(diff[d]||0)+1;});
console.log("new-item letters:",JSON.stringify(letters),"| difficulty:",JSON.stringify(diff));
console.log("sources:",JSON.stringify(rows.reduce((o,l)=>{const x=(l.match(/"source":"([^"]+)"/)||[])[1];o[x]=(o[x]||0)+1;return o;},{})));' && npm run test:uat 2>&1 | tail -2
```

Expected: `total: 333 | 2.2: 22 | SE topic: 18 | GUARD: PASS`, `new-item letters: {"C":3,"D":3,"A":3,"B":2}` (order may vary), `difficulty: {"Exam Level":6,"Hard":3,"Foundational":2}`, `sources: {"curated-lesson-phishing":10,"curated-objectives-2.2":1}`, UAT green.

- [ ] **Step 3: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.2 gap exemplars — MFA fatigue, typosquatting, misinformation

MFA fatigue had zero coverage anywhere in the pack. Typosquatting vs
brand impersonation gets its own discriminator, the credential-harvest
redirect gets its why, and phishing-is-not-only-credentials closes the
founder's trap 7. The misinformation vs disinformation item is authored
from the public Skills Measured doc and tagged curated-objectives-2.2 to
keep provenance honest.

Closes the lesson at 11 new items: letters A3/B2/C3/D3 (the >=3-D floor
from the spec), spread 2F/6E/3H.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Add the 2 retention concepts

**Files:**
- Modify: `certs/secplus.js` — insert after the Threat Actors retention pair (line 109, ends `…the wrong options are usually the right answers to the other two.' },`) and before the array's closing `],` at line 110

**Interfaces:** none.

- [ ] **Step 1: Insert the banner and two entries**

```javascript
    // ── Phishing lesson (v8.15.0, 2026-08-22) — 2 entries for obj 2.2 ──
    { label: 'The phishing family: P-S-W-S-V-B, then WHO vs STORY', parentTopic: 'Social Engineering', objective: '2.2', keyword: 'Six variants, each resolved by one tell. PHISHING = PUBLIC: a mass blast priced on volume — "Dear customer", thousands of recipients, the sender does not care that most have no such account. SPEAR PHISHING = SPECIFIC: the message knows something about you (your name, your team, your supplier), because reconnaissance came first. WHALING = WEALTHY target: spear phishing whose recipient is an executive or other high-value target — the C-suite is the whale. SMISHING = SMS. VISHING = VOICE. BEC = BUSINESS MONEY: a trusted business identity (an executive, or a genuinely compromised supplier mailbox) borrowed to push a fraudulent transaction through the person who can approve it. Memorise the order as P-S-W-S-V-B. Then the two component techniques that appear INSIDE the variants: IMPERSONATION answers WHO the attacker claims to be ("I am David from IT"); PRETEXTING is the STORY that makes the request feel routine ("we are migrating MFA this afternoon"). One attack stacks several — a single call can be vishing + impersonation + pretexting at once. Two reading rules for the exam: (1) the delivery channel picks the variant name — the same lure is phishing by email, smishing by SMS, vishing by phone; (2) when several answers are technically present, pick the MOST SPECIFIC — the ladder runs phishing, then spear phishing, then whaling or BEC, and the question "who is the victim, whose name is borrowed?" separates those last two: executive as TARGET = whaling, executive as MASK = BEC.' },
    { label: 'The seven emotional levers and the out-of-band check', parentTopic: 'Social Engineering', objective: '2.2', keyword: 'Phishing works by making the target react emotionally instead of checking carefully. The seven levers: URGENCY ("within 15 minutes"), FEAR ("your account is compromised", "to avoid prosecution"), GREED ("you have received a refund"), AUTHORITY ("the CEO needs this now"), TRUST (a brand or colleague identity borrowed), CURIOSITY ("confidential salary list"), SYMPATHY ("please donate"). Spotting the lever is often faster than spotting the forgery — any message engineered to make you act before you think deserves a second look regardless of how clean it appears. The defence that defeats the whole family: OUT-OF-BAND VERIFICATION — confirm the request over a DIFFERENT channel the attacker does not control, using contact details you ALREADY HOLD, never ones supplied in the message ("call the CEO back on the number on file", not the number in the email signature). It matters most where technical checks legitimately pass: in the supplier invoice-swap BEC, the mail leaves the supplier\'s real mailbox, SPF and DKIM succeed, the invoice is genuine and only the account number changed — a standing rule that every change to payment details is verified by phone against numbers on file is the ONLY control in that scenario that still works. Related mechanical tells worth pairing with the levers: lookalike domains (typosquatting — paypa1 with a digit 1), pixel-perfect copied login pages (brand impersonation), a Reply-to that differs from the sender domain, and a post-theft redirect to the real site so the victim blames a typo and never reports.' },
```

- [ ] **Step 2: Verify — parse, count, guard-invisibility**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("retention:",(s.match(/parentTopic:/g)||[]).length,"| 2.2 retention:",(s.match(/parentTopic: .Social Engineering./g)||[]).length,"| guard-counted:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length);' && npm run test:uat 2>&1 | tail -2
```

Expected: `retention: 40 | 2.2 retention: 2 | guard-counted: 333` — the exemplar count must NOT move. UAT green.

- [ ] **Step 3: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.2 retention concepts

P-S-W-S-V-B with the one-word tells plus the WHO/STORY split, and the
seven emotional levers paired with out-of-band verification — including
the invoice-swap case where out-of-band is the only control that works.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Apply the 4 Threat Actors fixes

**Files:**
- Modify: `certs/secplus.js`
- Modify: `docs/superpowers/plans/2026-08-22-secplus-threat-actors.md` (same text lives there; must stay in lockstep)

**Interfaces:** none. All four are exact substring replacements; fixes 1, 2 and 4 appear once per file, fix 3 once in each file.

- [ ] **Step 1: FIX 1 — Shadow IT category denial (both files)**

FIND:
```
(D) Wrong — Shadow IT is not an adversary with resources at all; it is unapproved technology inside the organisation.
```
REPLACE:
```
(D) Wrong — Shadow IT is defined by unsanctioned technology, not offensive resourcing; it fields no funding or personnel directed at attacking anyone, so it cannot top a resource ranking.
```

- [ ] **Step 2: FIX 2 — insider-vs-Shadow-IT rationale made categorical (both files)**

FIND:
```
(A) Wrong — while the second employee does create insider risk in the broad sense, calling both the same thing loses the distinction the objective asks you to draw, and misdirects the response: one needs an investigation, the other needs a better approved tool.
```
REPLACE:
```
(A) Wrong — the second employee introduces an unapproved PLATFORM, which is what the Shadow IT category names; insider threat classifies misuse of granted access, and no access is being misused to cause harm here. One answer triggers an investigation, the other a better approved tool.
```

- [ ] **Step 3: FIX 3 — re-cast the hacktivist scenario off the environmental template (both files)**

FIND (stem fragment):
```
An environmental campaign group takes a mining company's public website offline for six hours with a DDoS and posts a statement about the company's emissions record.
```
REPLACE:
```
A press-freedom collective takes a media regulator's public website offline for six hours with a DDoS and posts a statement condemning a journalist's arrest.
```

FIND (explanation fragment):
```
(D) Wrong — a mining company's public website is not critical national infrastructure.
```
REPLACE:
```
(D) Wrong — a regulator's public-facing website is an announcements page, not critical national infrastructure.
```

Then check the same entry's remaining prose still reads correctly against the new cast (the phrases "a symbolic target" and "low-cost, publicity-seeking disruption" are cast-neutral and stay).

- [ ] **Step 4: FIX 4 — zero-day misnomer (both files)**

FIND:
```
chaining multiple zero-day exploits
```
REPLACE:
```
chaining multiple public exploits against unpatched systems
```

- [ ] **Step 5: Verify**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && grep -c "is not an adversary with resources at all\|does create insider risk in the broad sense\|environmental campaign group\|mining company\|chaining multiple zero-day exploits" certs/secplus.js docs/superpowers/plans/2026-08-22-secplus-threat-actors.md; node --check certs/secplus.js && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("guard-counted:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length);' && npm run test:uat 2>&1 | tail -2
```

Expected: grep reports 0 in both files; `guard-counted: 333` unchanged; UAT green.

- [ ] **Step 6: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js docs/superpowers/plans/2026-08-22-secplus-threat-actors.md
git commit -m "fix(secplus): apply the four 2.1 wording fixes queued by the v8.14.0 review

- Resource-ranking (D) no longer denies Shadow IT membership of the
  six-actor category its own stem asks about; it denies offensive
  resourcing, which was the real point.
- Insider-vs-Shadow-IT (A) rebuttal is now categorical (unapproved
  platform vs misuse of access) instead of conceding the option.
- The hacktivist discriminator re-cast to press-freedom vs media
  regulator, so the topic's two hacktivist scenarios stop sharing the
  environmental-cause-vs-polluter template.
- 'chaining multiple zero-day exploits' -> 'public exploits against
  unpatched systems'; a commercially packaged exploit is not a zero-day.

v8.14.0 plan doc updated in lockstep.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Ship v8.15.0

**Files:**
- Modify: `package.json`, `app.js`, `sw.js`, `index.html`, `CLAUDE.md` (all via bump script), `CHANGELOG.md` (manual row)

- [ ] **Step 1: Full battery** — `npm test` (UAT then Playwright chromium). E2E failures: triage against the touched files (only `certs/secplus.js` + two docs); pre-existing flakes are reported, never fixed or re-baselined here.

- [ ] **Step 2: Bump**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
node scripts/bump-version.js 8.15.0 "Sec+ Phishing lesson (obj 2.2) — 11 new exemplars + 7 rewritten + 2 retention concepts + four 2.1 wording fixes"
```

- [ ] **Step 3: CHANGELOG row** (beneath the `|---|---|` header):

```markdown
| v8.15.0 | Sec+ Phishing (obj 2.2): 11 new exemplars (discriminators, MFA fatigue, typosquatting, misinformation), 7 rewritten to house format, 2 retention concepts, 4 queued 2.1 wording fixes. D2 73→84 |
```

- [ ] **Step 4: Confirm version in package.json, CLAUDE.md, CHANGELOG.md** (grep each for 8.15.0).

- [ ] **Step 5: Commit and push**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add package.json CLAUDE.md CHANGELOG.md
git commit -m "v8.15.0 — Sec+ Phishing lesson (obj 2.2)

Obj 2.2 Social Engineering: 18 exemplars, up from 7. Discrimination
spine (spear/whaling/BEC/impersonation/pretexting), MFA fatigue's first
pack coverage, typosquatting vs brand impersonation, misinformation vs
disinformation, and the supplier invoice-swap BEC. Plus the four 2.1
wording fixes queued by the v8.14.0 whole-branch review.

D2 73 -> 84 (+3.2pp of 10pp tolerance); D1 eases to +16.5pp.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 6: Wait for CI** (`gh run list`) — both workflows must conclude `success`; report BLOCKED on failure, never fix in-flight.

- [ ] **Step 7 (founder-only, post-ship): generation smoke test** — generate live batches on Social Engineering; MFA fatigue, typosquatting/brand impersonation and misinformation must surface. BYOK — not automatable here. The Notion milestone stays open until the founder runs it.

- [ ] **Step 8: Notion** — tick "it's live" only after Step 6 is green and the orchestrator has independently verified prod content.

---

## Self-Review

**Spec coverage:** 11 new (T2: 6, T3: 5) ✓ · 7 rewrites incl. `answers` key fix (T1) ✓ · 2 retention (T4) ✓ · 4 TA fixes both files (T5) ✓ · letters A3/B2/C3/D3 with 3×D (T3 Step 2 asserts) ✓ · spread 2F/6E/3H (asserted) ✓ · sources 10+1 (asserted) ✓ · v8.15.0 ship (T6) ✓ · guard predicted D2 +3.2pp / D1 +16.5pp (T3 Step 2 verifies PASS) ✓.

**Placeholders:** none — every content step carries full literal text; every verify step carries a runnable command with expected output.

**Consistency:** counts chain 322 → (T1) 322 → (T2) 328 → (T3) 333 → (T4) 333 → (T5) 333. 2.2 chain 11 → 11 → 17 → 22. SE topic 7 → 7 → 13 → 18. Retention 38 → 40. Scenario-variety check: the 11 new stems use distinct casts (streaming blast/engineer build server, CFO conference/payroll, IT MFA call, bonus spreadsheet, payroll CFO transfer, steel supplier invoice, evening push prompts, mistyped bank domain, generic org login, holiday-policy ransomware, bank-run social posts) — no shared industry+pretext template, and none reuses a 2.1 scenario.
