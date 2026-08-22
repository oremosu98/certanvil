# Sec+ Threat Actors (obj 2.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Security+ objective 2.1 from 4 thin exemplars to 18 well-differentiated ones plus 2 retention concepts, covering all six threat actors and the actor-pair discriminations the exam leans on.

**Architecture:** Pure data change to `certs/secplus.js`. Fourteen exemplars append to the end of `questionExemplars`; the four existing 2.1 exemplars are rewritten in place; two entries append to `retentionGapConcepts`. No JavaScript logic changes anywhere.

**Tech Stack:** Vanilla JS cert-pack data. Node UAT harness (`tests/uat.js`). No build step for this change.

**Spec:** `docs/superpowers/specs/2026-08-22-secplus-threat-actors-design.md`

## Global Constraints

- **Exemplar entries MUST use the compact JSON-string form** — `{"type":"mcq","question":"...",...}` — with **no space after any colon**. The domain-distribution guard counts `"objective":"N.M"` by regex; a space breaks the match and the entry silently stops counting.
- **Every new exemplar carries** `"source":"curated-lesson-threat-actors"`, `"addedVersion":"8.14.0"`, `"addedDate":"2026-08-22"`.
- **`"topic":"Threat Actors & Motivations"`** and **`"objective":"2.1"`** on every new exemplar, spelled exactly — the ampersand is literal, not `&amp;`.
- **mcq** keys `"answer"` as a single letter string. **multi-select** keys `"answers"` as an array. Plural. This is the shape the runtime scorer reads.
- **Retention concepts use the JS object form** with single quotes (`{ label: '...', parentTopic: '...', objective: '2.1', keyword: '...' }`) — matching the surrounding array. They are deliberately *not* counted by the domain guard.
- **Do not modify** `domainWeights`, `topicDomains`, `topicResources`, `_pickExemplarsForTopic`, `_formatExemplarsForPrompt`, or any test file. If the guard fails, trim content — never widen the guard.
- **Target version:** 8.14.0. **Date stamp:** 2026-08-22.
- Explanations follow the house format: why the answer is right, then `(X) Wrong — …` for **every** distractor, then a memory trick or exam clue.

---

### Task 1: Rewrite the 4 existing 2.1 exemplars

The four existing entries are in the pre-v8.7.0 prose style and two are mis-tiered. Content and correct answers do not change — only the explanation prose and two `difficulty` values.

**Files:**
- Modify: `certs/secplus.js:571-574`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by later tasks. Independent.

- [ ] **Step 1: Record the baseline so the change is measurable**

Run:

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");const m=s.match(/"objective":"(\d+)\.\d+"/g)||[];const c={1:0,2:0,3:0,4:0,5:0};m.forEach(x=>c[x.match(/"objective":"(\d+)\./)[1]]++);console.log("total exemplars:",m.length);console.log("by domain:",JSON.stringify(c));console.log("2.1 count:",(s.match(/"objective":"2\.1"/g)||[]).length);'
```

Expected output:

```
total exemplars: 308
by domain: {"1":95,"2":59,"3":43,"4":67,"5":44}
2.1 count: 4
```

If these numbers differ, stop — the file has moved since the plan was written and the line numbers below are stale.

- [ ] **Step 2: Confirm the suite is green before touching anything**

Run: `cd "$HOME/Desktop/Dev Projects/certanvil" && npm run test:uat`
Expected: exits 0, no failures reported. Note the total assertion count — it should not drop in later steps.

- [ ] **Step 3: Replace line 571 (nation-state) — rewritten explanation, re-tiered to Exam Level**

Replace the whole line with:

```javascript
    {"type":"mcq","question":"A sophisticated attack against a defense contractor's network uses previously unknown zero-day vulnerabilities, maintains stealth presence for over a year, and exfiltrates classified design documents. Investigation attributes the operation to a foreign government's intelligence service. Which threat actor classification fits BEST?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Nation-state","B":"Organized crime","C":"Hacktivist","D":"Insider threat"},"answer":"A","explanation":"Three signals converge on nation-state: zero-days (expensive to discover or buy, spent only when the target justifies it), dwell time measured in years (patience only a funded programme can afford), and an objective that is intelligence rather than revenue. Attribution to a foreign intelligence service confirms it. (B) Wrong — organized crime monetises access; classified design documents have no ransom market, and a criminal group holding this access for a year without extracting payment would be leaving its entire business model unused. (C) Wrong — hacktivists want the attack to be seen; a year of silence is the opposite of the publicity that defines them. (D) Wrong — insider threats operate from legitimate access already held inside the organisation; this is an external intrusion. Exam clue: intelligence value + zero-days + long dwell = nation-state.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 4: Replace line 572 (hacktivist) — rewritten explanation, stays Foundational**

```javascript
    {"type":"mcq","question":"A group of attackers compromises a company's website and replaces the homepage with a manifesto criticizing the company's environmental record. They publish customer email addresses to a Pastebin to amplify the message. Which threat actor type and motivation fit BEST?","difficulty":"Foundational","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Hacktivist; philosophical/political beliefs","B":"Nation-state; espionage","C":"Organized crime; financial gain","D":"Insider threat; revenge"},"answer":"A","explanation":"Defacement plus a manifesto plus deliberate amplification is hacktivism in its most recognisable form. Every choice made here optimises for attention: the target was picked for what it represents, and the leak exists to make the message travel. (B) Wrong — espionage requires the victim never to notice; a defaced homepage announces the intrusion. (C) Wrong — organized crime would sell or ransom that customer list, not give it away for free. (D) Wrong — revenge-driven insiders act on internal access and rarely publish political manifestos on the corporate homepage. Exam clue: political or social cause plus a demand for attention = hacktivist.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 5: Replace line 573 (insider) — rewritten explanation, stays Foundational**

```javascript
    {"type":"mcq","question":"A system administrator with 8 years of company tenure is passed over for a promotion. Over the next month, they exfiltrate customer data via personal cloud accounts and disable two critical backup jobs before resigning. Which threat actor type fits?","difficulty":"Foundational","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Insider threat","B":"Hacktivist","C":"Shadow IT","D":"Unskilled attacker"},"answer":"A","explanation":"Everything needed for the attack was already granted: administrative rights, knowledge of which backup jobs mattered, and the standing access to use both. Add a grievance as motive and this is the textbook malicious insider. Note that nothing had to be broken into. (B) Wrong — hacktivism needs an ideological cause; a missed promotion is personal, not political. (C) Wrong — Shadow IT is unapproved technology adopted for convenience, usually without malice; sabotaging backups is deliberate harm. (D) Wrong — an eight-year administrator selecting specific backup jobs to disable is demonstrating skill, not lacking it. Exam clue: already had the access = insider.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 6: Replace line 574 (organized crime) — rewritten explanation, re-tiered to Exam Level**

```javascript
    {"type":"mcq","question":"A criminal group encrypts a hospital's electronic health records and demands $2 million in cryptocurrency for the decryption key, with a 72-hour deadline. They are well-funded, run a 'help desk' for victims, and have repeatedly targeted healthcare for the past 18 months. Which threat actor classification BEST applies?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Organized crime","B":"Hacktivist","C":"Unskilled attacker","D":"Nation-state"},"answer":"A","explanation":"The victim help desk is the giveaway. Running support for the people you are extorting is a business decision — it raises the payment rate — and it only makes sense for a group operating cybercrime as an ongoing commercial concern. Repeat targeting of one sector known to pay quickly is the same logic. (B) Wrong — hacktivists publicise a cause; there is no cause here, only an invoice. (C) Wrong — an unskilled attacker has no infrastructure to run negotiation, payment handling and support at this scale. (D) Wrong — nation-states pursue intelligence or strategic disruption; ransoming a hospital for cryptocurrency is revenue, not statecraft. Exam clue: money is the objective = organized crime.","source":"curated-secplus-phase3","addedVersion":"7.4.0","addedDate":"2026-05-27"},
```

- [ ] **Step 7: Verify the counts did not move and the suite is still green**

Run the Step 1 command again.
Expected: **identical output** — `total exemplars: 308`, same domain map, `2.1 count: 4`. This task changes prose and two difficulty values only; any change to these numbers means an entry was accidentally added or dropped.

Then run: `npm run test:uat`
Expected: exits 0. Assertion count matches the Step 2 baseline.

- [ ] **Step 8: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "refactor(secplus): rewrite obj 2.1 exemplars into house explanation format

The four existing Threat Actors exemplars were in the pre-v8.7.0 prose
style. Rewritten with per-distractor reasoning and an exam-clue closer,
matching the Obfuscation and Certificates lessons.

Nation-state and organized-crime items re-tiered Foundational -> Exam
Level. Neither is foundational as written; both require weighing several
attributes against each other.

Content and correct answers unchanged.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Add the two zero-coverage actors

Unskilled attacker and Shadow IT are named in objective 2.1 and have no exemplars at all. Two each — one plain identification, one testing the thing candidates get wrong.

**Files:**
- Modify: `certs/secplus.js` — insert immediately before the `questionExemplars` closing bracket at line 745

**Interfaces:**
- Consumes: nothing.
- Produces: the banner comment that Tasks 3 and 4 append beneath.

- [ ] **Step 1: Insert the banner and four entries before the closing `],` at line 745**

The line at 744 is the last Blockchain exemplar and ends with `},`. Insert after it:

```javascript
    // ── Threat Actors lesson (v8.14.0, 2026-08-22) — 14 entries covering obj 2.1 ──
    // Sourced from founder study notes built on the public SY0-701 objectives +
    // free Professor Messer material. Organised around actor-pair discrimination
    // rather than plain identification: the four pre-existing 2.1 exemplars were
    // all "read scenario, name the actor", and the exam leans harder on telling
    // two similar actors apart. Unskilled attacker and Shadow IT had zero coverage.
    {"type":"mcq","question":"A 17-year-old downloads a point-and-click exploitation tool from a public forum and runs it against a list of websites found by an automated scanner. Several are compromised. Asked afterwards what the flaw was, they cannot explain what the tool did or why it worked. Which threat actor classification fits BEST?","difficulty":"Foundational","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Organized crime","B":"Unskilled attacker","C":"Hacktivist","D":"Insider threat"},"answer":"B","explanation":"An unskilled attacker (formerly 'script kiddie') relies on tools, scripts and exploits written by other people, without the knowledge to build or adapt them. The inability to explain the vulnerability is the diagnostic detail — the tool had the capability, the operator did not. (A) Wrong — organized crime attacks to make money and picks targets accordingly; nothing here is monetised and the targets were whatever the scanner returned. (C) Wrong — hacktivism requires a political or ideological cause and targets chosen for what they represent; random hosts represent nothing. (D) Wrong — insider threats act from legitimate access already held inside the organisation; this attacker is entirely external. Memory: unskilled attacker = TOOLS AND TUTORIALS.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An attacker uses a commercial exploitation framework capable of chaining multiple zero-day exploits. Forensic review shows they ran only the default automated scan, misidentified the target operating system, and left the framework's default filenames and registry artefacts untouched. How should this attacker's sophistication BEST be assessed?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"High — the capability of the tool used is the measure of the attacker's sophistication","B":"Low — sophistication is assessed on the attacker's own capability, not the tool's","C":"High — access to a commercial exploitation framework implies nation-state sponsorship","D":"Sophistication cannot be assessed from forensic artefacts alone"},"answer":"B","explanation":"Sophistication is an attribute of the actor, not the software. Every detail here points the same way: default scan, wrong OS fingerprint, artefacts left in place. A capable operator tunes the tool and cleans up after it. (A) Wrong — this is the exact confusion the objective tests; powerful tooling is widely available for download and says nothing about who is holding it. (C) Wrong — commercial and open-source frameworks are sold to and downloaded by anyone, including penetration testers and hobbyists; possession implies no sponsorship. (D) Wrong — operational artefacts are precisely how analysts assess capability, and these ones are unambiguous. Memory: a powerful tool in unpractised hands is still an unskilled attacker.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"The sales department finds the company's approved CRM slow and hard to use. Using a departmental credit card, they subscribe to a third-party cloud CRM and begin uploading customer contact records to it. IT and security are never told. Which category BEST describes this situation?","difficulty":"Foundational","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Insider threat","B":"Shadow IT","C":"Organized crime","D":"Hacktivist"},"answer":"B","explanation":"Shadow IT is technology adopted and used inside an organisation without the knowledge or approval of IT and security. The motive here is ordinary — the approved tool is painful and people routed around it — which is what makes Shadow IT so common. (A) Wrong — insider threat centres on misuse of trusted access; these employees are using the data for its intended business purpose, just on an unapproved platform. Note the two categories can overlap in practice, but the defining fact here is the unsanctioned technology. (C) Wrong — no criminal actor and no financial crime is involved. (D) Wrong — nothing ideological is happening. Memory: Shadow IT = UNAPPROVED TECH.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A security manager argues that Shadow IT creates serious organisational risk even when every employee involved is well-intentioned and productive. Which statement BEST supports that argument?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Unapproved systems sit outside security monitoring, backup, patch management, access control and DLP coverage, so the organisation cannot protect or account for data it does not know exists","B":"Cloud services purchased by departments are inherently less secure than equivalent services purchased by IT","C":"Employees who adopt unapproved tools are statistically likely to become malicious insiders later","D":"Using unapproved software is a criminal offence in most jurisdictions"},"answer":"A","explanation":"The risk is a governance gap, not bad intent. Every control the organisation relies on assumes it knows where its data lives — monitoring, backups, patching, access reviews, DLP, and the compliance evidence built on them. Data on a system security has never heard of gets none of it, and will not appear in a breach assessment either. (B) Wrong — the platform may be perfectly well engineered; the problem is that nobody is governing it, not that it is inferior. (C) Wrong — invented claim, and it contradicts the premise that these employees are well-intentioned. (D) Wrong — this is a policy violation, not a crime. Memory: security cannot protect what it does not know exists.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
```

- [ ] **Step 2: Verify the count moved by exactly four and the file still parses**

Run:

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");const m=s.match(/"objective":"(\d+)\.\d+"/g)||[];const c={1:0,2:0,3:0,4:0,5:0};m.forEach(x=>c[x.match(/"objective":"(\d+)\./)[1]]++);console.log("total:",m.length,"2.1:",(s.match(/"objective":"2\.1"/g)||[]).length,"D2:",c[2]);' && node --check certs/secplus.js && echo "SYNTAX OK"
```

Expected:

```
total: 312 2.1: 8 D2: 63
SYNTAX OK
```

- [ ] **Step 3: Run the suite**

Run: `npm run test:uat`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.1 exemplars for unskilled attacker + Shadow IT

Both are named in SY0-701 objective 2.1 and had zero exemplar coverage.
Two each: one plain identification, one covering what candidates
actually get wrong -- that a sophisticated tool does not imply a
sophisticated attacker, and that Shadow IT is a governance gap rather
than a question of intent.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Add the five discriminator exemplars

The spine of the lesson. Each maps to one of the traps in the source notes.

**Files:**
- Modify: `certs/secplus.js` — append after the four entries added in Task 2

**Interfaces:**
- Consumes: the Task 2 banner block. Insert directly beneath its final entry.
- Produces: nothing consumed later.

- [ ] **Step 1: Append the five entries**

```javascript
    {"type":"mcq","question":"Two incidents are reported in the same week. In the first, an employee copies the customer database to a personal USB drive, intending to hand it to a competitor they are joining. In the second, a different employee starts keeping project files in a personal cloud account because the approved file share is slow. Which classification BEST fits each?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Both are insider threats","B":"Both are Shadow IT","C":"First is an insider threat; second is Shadow IT","D":"First is Shadow IT; second is an insider threat"},"answer":"C","explanation":"The first employee is deliberately misusing trusted access to harm the organisation — a malicious insider, and the USB drive is incidental to that. The second has introduced an unapproved system into the business, with no intent to harm; the risk is that corporate data now sits somewhere security cannot see, back up or govern. (A) Wrong — while the second employee does create insider risk in the broad sense, calling both the same thing loses the distinction the objective asks you to draw, and misdirects the response: one needs an investigation, the other needs a better approved tool. (B) Wrong — the USB drive is an exfiltration channel, not an unapproved system adopted to get work done; the second incident is the only one where a new platform entered the business. (D) Wrong — reversed. Memory: insider = a PERSON misusing access. Shadow IT = unapproved TECHNOLOGY.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"Two intrusions show near-identical technical sophistication: custom malware, months of undetected dwell time, careful anti-forensic cleanup. In the first, the intruders exfiltrate design specifications for a naval radar system and never contact the victim. In the second, the intruders exfiltrate a customer database, then email the company demanding payment to prevent its publication. Which pairing is correct?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"First: organized crime. Second: nation-state","B":"First: nation-state. Second: organized crime","C":"Both: nation-state","D":"Both: organized crime"},"answer":"B","explanation":"Sophistication cannot separate these two — that is the point of the question. Top-tier criminal groups and state programmes both field custom malware and long dwell times, so the tiebreak has to be motivation. Naval radar design specifications taken with no contact afterwards is intelligence collection. A payment demand is revenue. (A) Wrong — reversed. A customer database monetises immediately and has an obvious buyer; defence design specifications have no comparable resale path, and the silence after the theft is the tell that collection rather than payment was the objective. (C) Wrong — extortion would burn months of quiet access for a single payout, which is the opposite of how a collection operation is run. (D) Wrong — the radar intrusion has no revenue path on offer. The heuristic below is a tendency, not a law: state-sponsored operations that raise revenue do exist, and SY0-701 does not fence financial gain off from nation-states. Memory: money = crime, intelligence and geopolitics = state.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An environmental campaign group takes a mining company's public website offline for six hours with a DDoS and posts a statement about the company's emissions record. Separately, during an active armed conflict, sustained intrusions disable portions of a neighbouring country's electricity grid. Both sets of attackers are politically motivated. Which pairing is correct?","difficulty":"Hard","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"First: hacktivist. Second: nation-state","B":"First: nation-state. Second: hacktivist","C":"Both: hacktivist, since both are politically motivated","D":"Both: nation-state, since both target nationally significant industries"},"answer":"A","explanation":"Political motivation alone does not separate these actors — you have to weigh scale, resourcing, target class and objective. A six-hour DDoS plus a public statement against a symbolic target is low-cost, publicity-seeking disruption: hacktivism. Sustained intrusions disabling a national power grid during armed conflict is critical-infrastructure attack as an instrument of war, which requires state-level resources and is the canonical nation-state case. (B) Wrong — reversed. (C) Wrong — treats motivation as the only attribute and ignores resources, sophistication and target class, which is exactly what the objective asks you to compare. (D) Wrong — a mining company's public website is not critical national infrastructure. Memory: cause plus publicity = hacktivist; infrastructure plus conflict = nation-state.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An employee receives an email warning that their account expires today. They click the link, enter their credentials on a convincing spoofed portal, and an attacker uses those credentials to reach internal systems the same afternoon. The employee had no intent to harm the organisation and reports the email as soon as they realise. Which statement is correct?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"This is not an insider threat, because the employee had no malicious intent","B":"This is an insider threat — insider risk covers negligent and accidental actions by trusted users, not only deliberate ones","C":"This is Shadow IT, because the employee used a website IT had not approved","D":"This is a nation-state attack, because credential harvesting is characteristic of nation-states"},"answer":"B","explanation":"Insider threat is defined by position, not intention. A trusted user whose actions create risk to confidentiality, integrity or availability qualifies whether the cause is malice, negligence or an honest mistake — and accidental insiders account for a large share of real incidents, which is why awareness training is a control at all. (A) Wrong — this is the most commonly held misconception about the term; it would exclude the misdirected email, the lost laptop and the clicked link, which are the everyday cases. (C) Wrong — Shadow IT means adopting unapproved technology for business use; being deceived into visiting a phishing page is not adoption. (D) Wrong — credential phishing is used by every category of actor, from unskilled attackers upward; nothing here identifies a state. Memory: insider does not mean malicious.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A third-party maintenance contractor holds a valid VPN account and badge access at a manufacturing plant under a support agreement. The contractor copies proprietary process documentation and sells it to a competitor. HR confirms they were never employed by the company. Which classification fits BEST?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Not an insider threat, because the contractor was never an employee","B":"Insider threat — the defining attribute is legitimate trusted access, not employment status","C":"Unskilled attacker","D":"Shadow IT"},"answer":"B","explanation":"An insider is anyone granted legitimate, trusted access: employees, contractors, administrators, business partners and trusted third parties all qualify. This contractor used exactly the access the support agreement granted, which is why nothing had to be broken into and why perimeter controls would have had nothing to alert on. (A) Wrong — employment status is not the test, and treating it as one leaves a large category of trusted access outside the threat model, which is precisely how supply-chain and contractor incidents happen. (C) Wrong — no exploitation or tooling was involved; the access was granted. (D) Wrong — no unapproved technology is in play; the VPN and badge were both issued by the company. Memory: insider = TRUSTED ACCESS, whoever holds it.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
```

- [ ] **Step 2: Verify count and syntax**

Run the Task 2 Step 2 command.
Expected: `total: 317 2.1: 13 D2: 68` and `SYNTAX OK`.

- [ ] **Step 3: Run the suite**

Run: `npm run test:uat`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.1 actor-pair discrimination exemplars

Five exemplars covering the pairs candidates confuse: insider vs Shadow
IT, organized crime vs nation-state, hacktivist vs nation-state, and the
two misconceptions about the word insider -- that it implies malice, and
that it implies employment.

The four pre-existing 2.1 exemplars were all plain identification. The
exam asks 'which of these two similar actors' far more often.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Add the attribute and separation-model exemplars

Five entries: three on the comparison attributes the objective title names, two on separating actor from motivation from vector. Includes the topic's first two multi-select items.

**Files:**
- Modify: `certs/secplus.js` — append after the five entries added in Task 3

**Interfaces:**
- Consumes: the Task 3 block. Insert directly beneath its final entry.
- Produces: nothing. This is the last exemplar task.

- [ ] **Step 1: Append the five entries**

Note the two multi-select entries key `"answers"` as an **array**, and both carry an option **E**.

```javascript
    {"type":"multi-select","question":"(Choose TWO) Which threat actor categories are characteristically INTERNAL in origin?","difficulty":"Exam Level","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Insider threat","B":"Nation-state","C":"Shadow IT","D":"Organized crime","E":"Hacktivist"},"answers":["A","C"],"explanation":"A and C are the two internal categories. Insider threat is internal by definition — the actor already holds trusted access. Shadow IT is internal because the unapproved technology is introduced by the organisation's own staff, not by an outsider. (B) Wrong — nation-state actors operate from outside the trust boundary. (D) Wrong — organized crime is likewise external, even when it recruits an insider to get in. (E) Wrong — hacktivists attack from outside; an ideologically motivated employee who leaks documents is classified as an insider threat, not a hacktivist. Watch the qualifier: an external group can recruit an insider, and an insider can be acting for one of the external categories, but the question asks where each category characteristically originates. Memory: the two internal ones are the two that do not have to break in.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"multi-select","question":"(Choose TWO) Which statements accurately describe an unskilled attacker's resources and capability?","difficulty":"Hard","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"They typically operate on low resources — a personal machine, an internet connection, and freely available tools","B":"They generally cannot develop novel exploits themselves and depend on tools, scripts and public exploits written by others","C":"The tools they use are generally as unsophisticated as the attacker","D":"They are internal to the organisation they attack, by definition","E":"Their low sophistication means they cannot cause meaningful damage"},"answers":["A","B"],"explanation":"A and B are the two accurate statements, and together they are the definition: minimal resources, and dependence on capability built by other people. (C) Wrong — this inverts the distinction the objective draws. Freely downloadable frameworks are extremely sophisticated; the attacker is not. (D) Wrong — unskilled attackers are characteristically external; the internal categories are insider threat and Shadow IT. (E) Wrong, and dangerously so — an automated tool pointed at an unpatched internet-facing system does real damage regardless of who clicked run. Low sophistication describes the attacker's capability, not the size of the impact. Memory: assess the person, not the program.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"Which threat actor category is generally associated with the GREATEST combination of funding, personnel and technical capability?","difficulty":"Foundational","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Hacktivist","B":"Nation-state","C":"Unskilled attacker","D":"Shadow IT"},"answer":"B","explanation":"Nation-state actors sit at the top of the resource ordering: government budgets, full-time offensive teams, intelligence support, custom malware development, purchased zero-days, dedicated infrastructure, and the freedom to run an operation for years. Organized crime is the closest rival and can match them technically, but rarely on sustained intelligence support or on the freedom to run an operation with no revenue deadline. (A) Wrong — hacktivist resourcing is variable and usually modest, drawn from volunteers and commodity tooling. (C) Wrong — unskilled attackers are the low end of the scale by definition. (D) Wrong — Shadow IT is not an adversary with resources at all; it is unapproved technology inside the organisation. Rough ordering worth carrying: nation-state, then organized crime, then hacktivist, then unskilled — a tendency, not a law.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A criminal gang sends employees phishing emails, harvests credentials from the ones who respond, deploys ransomware across the network, and demands two million pounds. Which option correctly separates the threat actor, the motivation and the threat vector?","difficulty":"Hard","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"Actor: ransomware. Motivation: organized crime. Vector: financial gain","B":"Actor: organized crime. Motivation: financial gain. Vector: phishing email","C":"Actor: phishing email. Motivation: ransomware. Vector: organized crime","D":"Actor: organized crime. Motivation: phishing email. Vector: ransomware"},"answer":"B","explanation":"Three separate questions, deliberately conflated by exam wording. WHO is behind it — a criminal gang, so organized crime. WHY — a payment demand, so financial gain, with an element of blackmail. HOW did they get in — the phishing email, which is the vector. Ransomware is none of the three; it is the attack deployed after entry. (A) Wrong — names the malware as the actor and the actor as the motivation. (C) Wrong — every slot is filled with the wrong category. (D) Wrong — keeps the actor right but swaps motivation and vector, treating the entry method as the reason for the attack. Memory: actor = WHO, motivation = WHY, vector = HOW they got in.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A threat intelligence briefing describes an intrusion set as an APT. Which statement about the term is MOST accurate?","difficulty":"Hard","topic":"Threat Actors & Motivations","objective":"2.1","options":{"A":"It describes an adversary that is advanced, maintains persistent long-term access, and is a capable threat — strongly associated with nation-states, but not exclusively meaning nation-state","B":"It is a synonym for nation-state; the two terms are interchangeable","C":"It refers to a specific family of malware used in long-dwell intrusions","D":"It describes any intrusion that goes undetected for more than 24 hours"},"answer":"A","explanation":"Advanced, Persistent, Threat — capable techniques, long-term access maintained rather than a single smash-and-grab, and a genuinely capable adversary. Nation-states are the archetype, and well-resourced criminal groups increasingly meet the same bar. (B) Wrong — the association is strong but not a definition; treating them as synonyms leads analysts to assume state attribution the evidence does not support. (C) Wrong — APT describes the adversary and their campaign, not a malware family. Confusingly, named APT groups often have signature tooling, but the tool is not the APT. (D) Wrong — an invented threshold; persistence means sustained access maintained deliberately over months or years, not a detection delay. Memory: Advanced, Persistent, Threat — all three words are load-bearing.","source":"curated-lesson-threat-actors","addedVersion":"8.14.0","addedDate":"2026-08-22"},
```

- [ ] **Step 2: Verify the final exemplar counts and the guard math**

Run:

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e '
const s=require("fs").readFileSync("certs/secplus.js","utf8");
const m=s.match(/"objective":"(\d+)\.\d+"/g)||[];
const c={1:0,2:0,3:0,4:0,5:0};
m.forEach(x=>c[x.match(/"objective":"(\d+)\./)[1]]++);
const t={1:12,2:22,3:18,4:28,5:20},tol={1:19,2:10,3:10,4:10,5:10};
let ok=true;
for(const k of [1,2,3,4,5]){const p=c[k]/m.length*100,d=p-t[k];const pass=Math.abs(d)<=tol[k];if(!pass)ok=false;
console.log("D"+k+": "+String(c[k]).padStart(3)+"  "+p.toFixed(1)+"%  delta "+(d>=0?"+":"")+d.toFixed(1)+"pp  "+(pass?"OK":"FAIL"));}
console.log("total:",m.length,"| 2.1:",(s.match(/"objective":"2\.1"/g)||[]).length);
const d=s.match(/"topic":"Threat Actors & Motivations","objective":"2\.1"/g)||[];
console.log("2.1 topic-tagged:",d.length);
console.log("GUARD:",ok?"PASS":"FAIL");'
```

Expected:

```
D1:  95  29.5%  delta +17.5pp  OK
D2:  73  22.7%  delta +0.7pp  OK
D3:  43  13.4%  delta -4.6pp  OK
D4:  67  20.8%  delta -7.2pp  OK
D5:  44  13.7%  delta -6.3pp  OK
total: 322 | 2.1: 18
2.1 topic-tagged: 18
GUARD: PASS
```

`2.1 topic-tagged` must equal `2.1` — if it is lower, an entry has a malformed `topic` field and will never be selected by `_pickExemplarsForTopic`.

- [ ] **Step 3: Verify the difficulty spread and multi-select shape**

Run:

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node -e '
const s=require("fs").readFileSync("certs/secplus.js","utf8");
const rows=s.split("\n").filter(l=>l.includes(String.raw`"objective":"2.1"`));
const d={},ty={};
rows.forEach(l=>{const a=l.match(/"difficulty":"([^"]+)"/);const b=l.match(/"type":"([^"]+)"/);if(a)d[a[1]]=(d[a[1]]||0)+1;if(b)ty[b[1]]=(ty[b[1]]||0)+1;});
console.log("difficulty:",JSON.stringify(d));
console.log("type:",JSON.stringify(ty));
const ms=rows.filter(l=>l.includes(String.raw`"type":"multi-select"`));
console.log("multi-select using answers[] :",ms.filter(l=>/"answers":\[/.test(l)).length,"of",ms.length);'
```

Expected:

```
difficulty: {"Exam Level":9,"Foundational":5,"Hard":4}
type: {"mcq":16,"multi-select":2}
multi-select using answers[] : 2 of 2
```

Both multi-selects must report `answers[]`. A multi-select keyed `"answer"` renders a blank answer line in the prompt.

- [ ] **Step 4: Run the suite**

Run: `npm run test:uat`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.1 attribute + actor/motivation/vector exemplars

Three on the comparison attributes the objective title actually names --
internal vs external, resources, sophistication -- plus the separation of
threat actor from motivation from vector, and APT.

Includes the topic's first two multi-select items, both keyed answers[].

Closes the 2.1 lesson at 18 exemplars: 5 Foundational, 9 Exam Level,
4 Hard. Domain guard moves D2 from -2.8pp to +0.7pp and pulls D1 back
from +18.8pp to +17.5pp against its 19pp ceiling.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Add the two retention concepts

Different mechanism, different array, different object shape — single-quoted JS, not JSON strings.

**Files:**
- Modify: `certs/secplus.js` — append inside `retentionGapConcepts`. The last Certificates entry (`Public vs Private CA + chain of trust`) is at line 106; the array closes with `],` at line 107. Insert between them.

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Append the two entries after the last Certificates entry**

Note the escaped apostrophes (`\'`) — these are single-quoted JS strings, not JSON.

```javascript
    // ── Threat Actors lesson (v8.14.0, 2026-08-22) — 2 entries for obj 2.1 ──
    { label: 'The six threat actors and their one-word tells', parentTopic: 'Threat Actors & Motivations', objective: '2.1', keyword: 'SY0-701 2.1 names exactly six actors, and each has one clue that resolves most scenario questions on its own. NATION-STATE = GOVERNMENT (espionage, critical infrastructure, cyberwarfare; very high resources; long dwell; the archetype behind APT campaigns). UNSKILLED ATTACKER = TOOLS AND TUTORIALS (formerly "script kiddie"; runs other people\'s exploits without understanding them; low resources; motivations run to curiosity, recognition, chaos). HACKTIVIST = BELIEFS (political, social or ideological cause; wants publicity; defacement, DDoS, doxing and leaks; variable resources). INSIDER THREAT = TRUSTED ACCESS (employee, contractor, administrator or partner; motivations include revenge, money, espionage). ORGANIZED CRIME = MONEY (ransomware, fraud, extortion, credential and identity theft; run as a business with developers, launderers and even victim support desks; high resources). SHADOW IT = UNAPPROVED TECH (staff adopting tools IT has not sanctioned, usually for convenience rather than malice). Memorise the order as N-U-H-I-O-S. Two attributes to carry alongside: INTERNAL origin covers insider threat and Shadow IT only — the other four are characteristically external; and the rough resource ordering runs nation-state, then organized crime, then hacktivist, then unskilled, which is a tendency and not a rule. Two traps the exam leans on: a sophisticated TOOL does not make a sophisticated ATTACKER, and an insider need be neither malicious nor an employee — negligence counts, and so do contractors and trusted partners.' },
    { label: 'Threat actor vs motivation vs vector — three separate answers', parentTopic: 'Threat Actors & Motivations', objective: '2.1', keyword: 'Security+ deliberately blurs three distinct questions, and a scenario often supplies all three at once. THREAT ACTOR answers WHO is behind it — the person, group or entity. MOTIVATION answers WHY — the objective they are pursuing. THREAT VECTOR answers HOW THEY GOT IN — the route into the environment. The attack or malware deployed afterwards is a fourth thing again, and is none of the three. Worked example: a criminal gang phishes employees, steals credentials, deploys ransomware and demands two million pounds. Actor = organized crime. Motivation = financial gain, with blackmail. Vector = phishing email. Attack = ransomware. The motivations named in the objective are data exfiltration (stealing information), espionage (covert intelligence gathering), service disruption (taking systems offline), blackmail (pay or we release), financial gain (making money), philosophical or political beliefs (supporting a cause), ethical (security research and responsible disclosure), revenge (retaliation), disruption or chaos (damage for its own sake), and war (attacking another state\'s capabilities). Read the question wording carefully: "which threat actor", "what motivated", and "how did the attacker gain access" are three different questions with three different answers from the same scenario, and the wrong options are usually the right answers to the other two.' },
```

- [ ] **Step 2: Verify parse, count, and that the guard did NOT move**

Run:

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e '
const s=require("fs").readFileSync("certs/secplus.js","utf8");
console.log("retention entries:",(s.match(/parentTopic:/g)||[]).length);
console.log("2.1 retention:",(s.match(/objective: .2\.1./g)||[]).length);
console.log("guard-counted exemplars:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length);'
```

Expected:

```
retention entries: 38
2.1 retention: 2
guard-counted exemplars: 322
```

The exemplar count **must remain 322**. Retention concepts use the JS object form and are correctly invisible to the domain guard. If this number moved, the entries were written in the JSON-string form by mistake.

- [ ] **Step 3: Run the suite**

Run: `npm run test:uat`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): obj 2.1 retention concepts

Two entries: the six actors with their one-word tells (N-U-H-I-O-S, plus
the internal/external split and the resource ordering), and the
separation of threat actor from motivation from vector, which SY0-701
wording deliberately conflates.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Ship v8.14.0 and verify against the running app

**Files:**
- Modify: `package.json`, `CLAUDE.md` (both written by the bump script)
- Modify: `CHANGELOG.md` (manual row)

**Interfaces:**
- Consumes: all preceding tasks committed.
- Produces: the shipped release.

- [ ] **Step 1: Full suite plus E2E before shipping**

Run: `cd "$HOME/Desktop/Dev Projects/certanvil" && npm test`
Expected: exits 0. This runs `test:uat` then `test:e2e`.

If the visual-regression project is included in the run and reports diffs, **do not re-baseline**. Read the diff first. A red visual suite hiding a real conversion bug for ten days is the reason that rule exists.

- [ ] **Step 2: Bump the version**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
node scripts/bump-version.js 8.14.0 "Sec+ Threat Actors lesson (obj 2.1) — 14 new exemplars + 4 rewritten + 2 retention concepts"
```

This rewrites `package.json` and prepends a one-line row to the `CLAUDE.md` inline table.

- [ ] **Step 3: Add the CHANGELOG row**

Add directly beneath the `|---|---|` header line of the version table in `CHANGELOG.md`:

```markdown
| v8.14.0 | Sec+ Threat Actors (obj 2.1): 14 new exemplars covering unskilled attacker + Shadow IT + actor-pair discrimination, 4 existing rewritten to house format, 2 retention concepts. D2 59→73, guard D1 +18.8pp→+17.5pp |
```

- [ ] **Step 4: Confirm the version landed in both places**

Run:

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && grep -m1 '"version"' package.json && grep -m1 'v8.14.0' CLAUDE.md && grep -m1 'v8.14.0' CHANGELOG.md
```

Expected: three lines, each showing 8.14.0.

- [ ] **Step 5: Commit and push**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add package.json CLAUDE.md CHANGELOG.md
git commit -m "v8.14.0 — Sec+ Threat Actors lesson (obj 2.1)

18 exemplars on objective 2.1, up from 4. All six actors now covered;
unskilled attacker and Shadow IT had none. Spine is actor-pair
discrimination rather than plain identification.

Grows D2 per the 2026-07-27 decision that D1's balance guard is
saturated: D2 59 -> 73 (-2.8pp -> +0.7pp), and D1 eases from +18.8pp to
+17.5pp against its 19pp ceiling.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 6: Confirm CI is green**

Run: `cd "$HOME/Desktop/Dev Projects/certanvil" && gh run list --limit 3`
Expected: the run for this commit completes `success`. Wait for it rather than assuming.

- [ ] **Step 7: The acceptance test — confirm the generator actually reaches the new actors**

**This is the step that determines whether the change worked.** Exemplars only ever feed the generation prompt, so a bigger file and a green suite prove nothing about what a learner is asked.

On the live Sec+ surface, generate several batches of questions on **Threat Actors & Motivations** and record which actors appear as correct answers.

Expected: unskilled attacker and Shadow IT both appear across the sample. Before this change they could not — no exemplar mentioned either, and the picker draws its style references from this topic's exemplars first.

If they still never appear, the change has **not** achieved its goal. Do not tick this off on the basis of a green suite. Investigate `_pickExemplarsForTopic` selection for this topic before declaring the work done.

- [ ] **Step 8: Update Notion**

Tick off the milestones on **CertAnvil — Sec+ Threat Actors lesson (obj 2.1)** whose done-tests are now observably true. "It's live" needs Step 6 green. "My practice questions actually reach all six actors" needs Step 7 confirmed by eye — not inferred from the ship.

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| 14 new exemplars | Tasks 2 (4), 3 (5), 4 (5) |
| Rewrite 4 existing to house format | Task 1 |
| Re-tier nation-state + organized crime | Task 1, Steps 3 and 6 |
| 2 retention concepts | Task 5 |
| Final spread 5 / 9 / 4 | Task 4, Step 3 |
| 2 multi-select items | Task 4, Step 1, verified Step 3 |
| Compact JSON form for guard counting | Global Constraints, verified Task 4 Step 2 |
| Placement: rewrites in place, new appended under banner | Task 1 (in place), Task 2 (banner) |
| Balance guard passes unmodified | Task 4, Step 2 |
| Answer-key audit | Reviewer gate at each of Tasks 1–4 |
| Generation smoke test as real acceptance | Task 6, Step 7 |
| v8.14.0, Fast lane | Task 6 |

No spec requirement is unassigned.

**Placeholder scan:** No TBDs. Every code step carries the literal text to insert; every verification step carries a runnable command and its expected output.

**Consistency check:** Counts chain correctly — 308 baseline, unchanged after Task 1, 312 after Task 2, 317 after Task 3, 322 after Task 4, and still 322 after Task 5 since retention concepts are not guard-counted. Difficulty totals reconcile: Task 1 moves two entries Foundational → Exam Level, leaving 2 Foundational among the originals; Tasks 2–4 add 3 Foundational, 7 Exam Level, 4 Hard; final 5 / 9 / 4 as asserted in Task 4 Step 3.
