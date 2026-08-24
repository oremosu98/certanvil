# Sec+ OSINT & Impersonation (mixed-domain) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 14 exemplars spanning obj 2.2 (spoofing), 5.5 (OSINT), 4.6 (phishing-resistant MFA) — the first pass to grow the under-target domains — plus 2 retention concepts, closing the three v8.16.0 debt items and the OSINT/spoofing/FIDO2 gaps.

**Architecture:** Pure data change to `certs/secplus.js`. Fourteen exemplars append to `questionExemplars`; two retention concepts append. No rewrites (all items new). No JS logic changes.

**Tech Stack:** Vanilla JS cert-pack data. Node UAT harness. No build step.

**Spec:** `docs/superpowers/specs/2026-08-22-secplus-osint-impersonation-design.md`

## Global Constraints

- Compact JSON, **no space after any colon** (guard counts `"objective":"N.M"`).
- 9 items carry `"source":"curated-lesson-osint-impersonation"`; 5 carry `"source":"curated-review-debt"`. All 14: `"addedVersion":"8.17.0"`, `"addedDate":"2026-08-22"`.
- Topics/objectives exactly as the per-item blocks specify — three different topics are in play.
- All 14 mcq, single-letter `"answer"`. Letters fixed: **A3 / B4 / C4 / D3** (verified by script in Task 2).
- Retention concepts: single-quoted JS object form, guard-invisible.
- **Pool length gate:** correct option strictly longest in ≤ 6 of 14. Verified by script in Task 2; failure → pad distractors, never trim keys.
- **No new pairing-template item except item 12**, which exists to break the template: its key is a genuinely-correct "Both" option, D-keyed, with NO mirror-reversal distractor.
- Retention concepts (Task 3) run AFTER the exemplar review (Task 2) completes — the v8.16.0 standing rule; the concept brief carries a diff-against-final-exemplar-prose check.
- Do not modify weights, maps, guard, picker, prompt functions, tests. Guard trips → trim, never widen.
- House format: rationale → `(X) Wrong — …` per distractor → memory/exam-clue closer. Grounded in own stem; no absolutes.
- **Target v8.17.0. Date 2026-08-22. Branch: main (Fast lane, founder-approved end-to-end).** A pre-existing uncommitted `.github/workflows/vercel-incident-recovery.yml` edit is in the tree — never stage or touch it.

---

### Task 1: Add exemplars 1–7

**Files:** Modify `certs/secplus.js` — insert before the `questionExemplars` closing `],` (currently line 808, beneath the last v8.16.0 entry ending `in scope + disclosed responsibly = ethical, bounty or no bounty.` + metadata).

- [ ] **Step 1: Baseline**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("total:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length,"| AA:",(s.match(/"topic":"Audits & Assessments"/g)||[]).length);' && npm run test:uat 2>&1 | grep "UAT:"
```

Expected: `total: 345 | AA: 7` and `UAT: 5008/5008 ALL PASS`. Different → stop.

- [ ] **Step 2: Insert the banner and seven entries**

```javascript
    // ── OSINT & Impersonation lesson (v8.17.0, 2026-08-22) — 14 entries across obj 2.2/5.5/4.6 ──
    // Mixed-domain delta pass: founder Impersonation + OSINT notes, authoring only
    // the gaps left after v8.14-v8.16 (spoofing keyed 0; OSINT-as-term/defender/
    // technical; phishing-resistant MFA keyed 0). Items tagged curated-review-debt
    // close the three v8.16.0 whole-branch-review gaps (file-based keyed, unsecure
    // wireless keyed, and the true-"Both" key that ends the 0-of-15 pairing tell).
    {"type":"mcq","question":"An attacker crafts an email whose 'From' header is altered to read ceo@company.com so the message technically appears to originate from the CEO's address, then uses that message to pretend to be the CEO and request a transfer. Which term names the TECHNICAL falsification of the sender address specifically?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"Impersonation","B":"Spoofing","C":"Pretexting","D":"Whaling"},"answer":"B","explanation":"Spoofing is the falsification of technical identity information — here the From header, elsewhere a caller ID or a MAC address. The question asks specifically about the header manipulation, and that is spoofing. (A) Wrong — impersonation is the broader social act of pretending to be the CEO; spoofing is the technical means that supports it, and the stem asks for the means. (C) Wrong — pretexting is the fabricated story ('I need this transfer done'), not the forged address. (D) Wrong — whaling describes targeting an executive as the victim; here the executive is being imitated. Memory: spoofing = FAKE TECHNICAL IDENTITY; impersonation = WHO you pretend to be.","source":"curated-lesson-osint-impersonation","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"Sarah in accounting receives an email from ceo@company.com (the address was forged): 'I'm meeting investors and can't talk. Urgently transfer £40,000 to the attached account. Tell no one — this acquisition is confidential.' Of the elements present, which is the SPOOFING?","difficulty":"Hard","topic":"Social Engineering","objective":"2.2","options":{"A":"Claiming to be the CEO within the body of the message","B":"The confidential-acquisition story","C":"The forged sender address on the email","D":"The request to transfer £40,000"},"answer":"C","explanation":"One incident stacks four techniques, and the question isolates one. Spoofing is the forged sender address — the technical identity falsified to make the mail look like it came from the CEO. (A) Wrong — claiming to be the CEO is the impersonation, the WHO. (B) Wrong — the confidential-acquisition story is the pretext, the invented explanation that discourages checking. (D) Wrong — the transfer request is the goal of the attack (a likely BEC), not a technique. Memory: WHO = impersonation, STORY = pretexting, FAKE ADDRESS = spoofing, DELIVERY = phishing.","source":"curated-lesson-osint-impersonation","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"Before making any contact, an attacker compiles a target company's staff names, job titles, department structure and reporting lines entirely from LinkedIn profiles, the corporate website and a recent press release. What is this information-gathering activity called?","difficulty":"Foundational","topic":"Audits & Assessments","objective":"5.5","options":{"A":"Open-source intelligence (OSINT)","B":"Active reconnaissance","C":"Credential harvesting","D":"Privilege escalation on an already-compromised host"},"answer":"A","explanation":"OSINT is intelligence assembled from publicly accessible sources — social media, company sites, press releases, public records. No system was touched and nothing was stolen; the value is in correlating public facts into a usable profile. (B) Wrong — active reconnaissance interacts directly with the target's systems (port scans, service probes); reading LinkedIn touches nothing the target owns. (C) Wrong — credential harvesting steals usernames and passwords, a later attack stage, not information gathering. (D) Wrong — privilege escalation happens after access is gained. Memory: OSINT = open sources → intelligence, the homework before the attack.","source":"curated-lesson-osint-impersonation","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An attacker learns from LinkedIn that Alex is the CFO, from Instagram that Alex is overseas at a conference this week, and from a press release that the company just signed with Vendor X. He then emails the accounts-payable manager, posing as Alex, to rush a Vendor X payment. In this attack, what does the LinkedIn/Instagram/press-release research represent?","difficulty":"Exam Level","topic":"Audits & Assessments","objective":"5.5","options":{"A":"The delivery of the phishing payload","B":"The pretext given to the victim","C":"The impersonation of the CFO sustained throughout the whole email exchange","D":"The reconnaissance (OSINT) phase that precedes the attack"},"answer":"D","explanation":"The public-source research is the reconnaissance phase — OSINT gathered before contact, and it is what makes the later message convincing (real name, real absence, real vendor). It is distinct from the attack it enables. (A) Wrong — delivery is the email itself, which comes after the research. (B) Wrong — the pretext is the story inside that email ('I'm overseas, pay this'), built FROM the research but not the research. (C) Wrong — impersonating Alex is a technique used in the message; the question asks what the fact-gathering was. Exam clue: 'searched social media / reviewed public records' before contact = OSINT / reconnaissance.","source":"curated-lesson-osint-impersonation","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An attacker knows an employee is named Sarah Jones and observes from a public data breach and the company's own website that staff emails follow the first.last@company.com format. He derives sarah.jones@company.com to target her. Which reconnaissance technique is this?","difficulty":"Foundational","topic":"Audits & Assessments","objective":"5.5","options":{"A":"Active scanning of the mail server","B":"Password spraying","C":"OSINT-based email-format enumeration","D":"DNS poisoning of the company's public resolver"},"answer":"C","explanation":"Deriving an address from a publicly observable naming convention plus a known name is OSINT — technical open-source intelligence, gathered without touching the target. Email-format guessing is a standard precursor to a phishing campaign. (A) Wrong — nothing was scanned or probed; the format came from public sources, which keeps this passive. (B) Wrong — password spraying tries common passwords across accounts, a later authentication attack, not reconnaissance. (D) Wrong — DNS poisoning corrupts name resolution; no DNS is being altered here. Memory: name + public email pattern = OSINT email enumeration.","source":"curated-lesson-osint-impersonation","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A company's threat-intelligence team routinely searches paste sites, public breach dumps and social media for the company's leaked credentials, exposed data and fake profiles impersonating its brand. Which statement BEST characterises this activity?","difficulty":"Exam Level","topic":"Audits & Assessments","objective":"5.5","options":{"A":"It is illegal, because searching breach data is unauthorised access","B":"It is defensive OSINT — the same public sources attackers use, gathered here to reduce the organisation's own exposure","C":"It is active reconnaissance against the company's own systems","D":"It is only OSINT if an attacker does it; defenders performing it are conducting an audit"},"answer":"B","explanation":"OSINT is intent-neutral: the technique is gathering intelligence from public sources, and defenders use exactly the sources attackers do — to find leaks and brand abuse before they are exploited. (A) Wrong — reading already-public information is not unauthorised access; no protected system is entered. (C) Wrong — active reconnaissance interacts with systems; searching public sources touches none of the company's own. (D) Wrong — OSINT is defined by the source type, not the actor; the label does not change with who is searching. Exam clue: same public sources, different intent — OSINT is a technique, not a crime.","source":"curated-lesson-osint-impersonation","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"After an MFA-fatigue (push-bombing) attack succeeds — the attacker had the password and spammed approval prompts until the user tapped Approve — a company wants the change that most directly stops this from recurring. Which authentication change BEST achieves that?","difficulty":"Exam Level","topic":"Identity & Access Management","objective":"4.6","options":{"A":"Require users to change their passwords every 30 days","B":"Increase the length of the one-time passcodes sent by SMS","C":"Send push approvals to two separately enrolled devices instead of one for redundancy","D":"Adopt phishing-resistant MFA such as FIDO2 security keys or passkeys"},"answer":"D","explanation":"MFA fatigue works because a human can be worn down into approving a prompt. Phishing-resistant MFA removes the approvable prompt entirely: a FIDO2 key or passkey completes a cryptographic challenge bound to the real site, with nothing for the user to approve under pressure. (A) Wrong — the attacker already had the password; rotating it does not address the approval step being abused. (B) Wrong — a longer SMS code is still a code a fatigued or tricked user can hand over, and the attack targeted approvals, not code entry. (C) Wrong — two devices means two devices to spam; it multiplies the prompts rather than removing them. Memory: fatigue defeats approve-a-prompt MFA; FIDO2/passkeys have no prompt to approve.","source":"curated-lesson-osint-impersonation","addedVersion":"8.17.0","addedDate":"2026-08-22"},
```

- [ ] **Step 3: Verify counts, syntax, suite; commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("total:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length,"| AA:",(s.match(/"topic":"Audits & Assessments"/g)||[]).length,"| new:",(s.match(/"addedVersion":"8\.17\.0"/g)||[]).length);' && npm run test:uat 2>&1 | grep "UAT:"
git add certs/secplus.js
git commit -m "feat(secplus): OSINT/impersonation exemplars 1-7 (spoofing, OSINT, FIDO2)

Spoofing vs impersonation and the WHO/STORY/SPOOF/PHISH decomposition
(2.2, spoofing keyed 0 before this); OSINT as a named term, the
OSINT-feeds-the-attack phase, technical email-format OSINT, and
defender-side OSINT (5.5, distinct from the two live passive-recon
items); and phishing-resistant MFA after an MFA-fatigue compromise
(4.6, keyed 0, completes the v8.15.0 MFA-fatigue item).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected before commit: `total: 352 | AA: 10 | new: 7`, UAT green.

---

### Task 2: Add exemplars 8–14 (incl. the true-"Both" pairing break)

**Files:** Modify `certs/secplus.js` — append beneath Task 1's last entry (item 7, ending `FIDO2/passkeys have no prompt to approve.` + metadata), before the closing `],`.

- [ ] **Step 1: Append the seven entries**

```javascript
    {"type":"mcq","question":"A security lead is asked WHY FIDO2 security keys and passkeys are called 'phishing-resistant' when ordinary MFA is not. Which explanation is correct?","difficulty":"Hard","topic":"Identity & Access Management","objective":"4.6","options":{"A":"The credential is cryptographically bound to the real site's origin, so there is nothing for a user to read out, retype on a lookalike page, or approve under pressure","B":"They replace the password with a longer password that is harder to guess","C":"They send the one-time code over an encrypted channel instead of SMS","D":"They require the user to approve a push notification on a separate device"},"answer":"A","explanation":"Phishing-resistant means the authenticator itself refuses to be used against the wrong site: the key signs a challenge tied to the legitimate origin, so a lookalike domain gets no valid response, and there is no shared secret or approval a human could hand over. (B) Wrong — a passkey is not a longer password; the point is that no reusable secret exists to phish at all. (C) Wrong — encrypting an OTP still leaves a code the user can be tricked into entering on a fake page. (D) Wrong — an approvable push is exactly what MFA fatigue abuses; phishing-resistant methods remove the approval step, they do not add one. Memory: origin-bound credential = nothing to phish.","source":"curated-lesson-osint-impersonation","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An employee receives a phone call. The caller's voice is an AI-generated clone of the CEO, indistinguishable from the real one, instructing an immediate wire transfer. What is the appropriate defence, and does the realism of the fake change it?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"Ask the caller to confirm they are really the CEO before acting","B":"Verify the request out-of-band on a known-good channel; the realism of the deepfake does not change the defence","C":"Comply, because a voice that convincing must be genuine","D":"Enable caller-ID display so future spoofed calls are obvious"},"answer":"B","explanation":"Deepfakes raise the believability of impersonation, not the defence against it: you still confirm the request through a separate trusted channel — a call back on the CEO's number already on file, or an in-person check — which a cloned voice on the incoming call cannot satisfy. (A) Wrong — asking the caller to vouch for themselves still talks to the attacker; the confirmation must come from outside their channel. (C) Wrong — convincing is the whole point of a deepfake and is no evidence of authenticity. (D) Wrong — caller ID is itself spoofable and does not verify the human speaking. Memory: verify out-of-band on a number you already hold — realism does not earn trust.","source":"curated-lesson-osint-impersonation","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"An analyst opens a macro-enabled spreadsheet, 'Reconciliation-Q2.xlsm', from the finance team's internal shared drive. The macro was planted by an intruder days earlier and installs malware on open. No email, message or website was involved. Which threat vector category delivered this?","difficulty":"Exam Level","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Message-based","B":"Image-based","C":"File-based","D":"Watering hole"},"answer":"C","explanation":"The malicious object is a document carrying active content, and it reached the victim as a file on a shared drive — no message, so the object type settles the category as file-based. This is the mirror of the message-plus-attachment case: strip the message, and the vector is named by the object itself. (A) Wrong — message-based needs a delivering message (email, SMS, IM); there is none. (B) Wrong — image-based is malicious content inside an image format; a spreadsheet is a document. (D) Wrong — a watering hole compromises a website the target visits; nothing here is web-delivered. Exam clue: macro document / archive / executable, no message = file-based.","source":"curated-review-debt","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A company's guest Wi-Fi and its corporate WLAN share one access point secured only with weak, outdated encryption. An attacker sitting in the car park cracks it, associates to the corporate WLAN, and reaches internal systems. Which threat vector does the weak wireless security represent?","difficulty":"Exam Level","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Unsecure network — wireless","B":"Open service port","C":"Default credentials","D":"Removable device introduced physically on site"},"answer":"A","explanation":"Weak or outdated Wi-Fi security is the unsecure-network vector in its wireless form: the radio link is the route in, and poor encryption is what let an outsider in the car park onto the LAN. (B) Wrong — an open service port is a listening TCP/UDP service reached over an existing network path; the exposure here is the wireless link itself, before any service is reached. (C) Wrong — no factory credential is used; the weakness is the encryption. (D) Wrong — nothing physical is plugged in; ingress is over the air. Exam clue: weak Wi-Fi lets an outsider associate = unsecure wireless network vector (distinct from a named evil-twin attack, which builds a rogue AP).","source":"curated-review-debt","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"Incident one: an employee is phished by a fraudulent email link. Incident two: the same employee is phished the next day by a fraudulent link in a Microsoft Teams direct message. A trainer asks what the two incidents have in common at the vector level. Which answer is correct?","difficulty":"Exam Level","topic":"Attack Vectors & Surfaces","objective":"2.2","options":{"A":"Both are file-based vectors","B":"Neither is a threat vector; phishing is a technique","C":"They share nothing; email and chat are unrelated vectors","D":"Both are message-based vectors — email and instant messaging are the same vector category"},"answer":"D","explanation":"Message-based is the SY0-701 vector category that spans email, SMS and instant messaging, so a phishing link by email and one by a Teams DM are the same vector delivered over two channels. (A) Wrong — no file is the payload in either; both are links inside messages. (B) Wrong — a genuine trap, but phishing being the technique does not stop the delivery route from being a vector; the question asks about the vector level, and both messages ARE message-based vectors. (C) Wrong — email and chat are two channels of one category, which is the whole point. Exam clue: email, SMS and IM all sit under one heading — message-based.","source":"curated-review-debt","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"During a vishing call, an attacker sets the number shown on the victim's phone to the bank's real fraud-department line so the call appears legitimate, then talks the victim into reading out a one-time code. Which technical element of this attack is the SPOOFING?","difficulty":"Exam Level","topic":"Social Engineering","objective":"2.2","options":{"A":"The phone call as the delivery channel","B":"The falsified caller ID showing the bank's real number","C":"The story about fraud on the account","D":"Reading out the one-time passcode the bank supposedly just sent"},"answer":"B","explanation":"Spoofing is the falsified technical identity — here the caller ID set to display the bank's genuine number, which is what makes the call look trustworthy. (A) Wrong — the phone call is the vector, and it makes the attack vishing; a channel is not a spoof. (C) Wrong — the fraud story is the pretext, the invented reason to act. (D) Wrong — the code readout is the goal, the thing being stolen. Reinforces the header-spoofing case in a different channel. Memory: caller ID, From header, MAC address — falsifying any technical identifier is spoofing.","source":"curated-review-debt","addedVersion":"8.17.0","addedDate":"2026-08-22"},
    {"type":"mcq","question":"A penetration tester's activity log for one morning reads: reviewed the target's LinkedIn employees, read its public DNS and WHOIS records, skimmed recent news about the company, then ran an Nmap port scan against its public IP range. Which single step crossed from passive into ACTIVE reconnaissance?","difficulty":"Foundational","topic":"Audits & Assessments","objective":"5.5","options":{"A":"Reviewing LinkedIn employee profiles","B":"Reading public DNS and WHOIS records","C":"Running the Nmap port scan against the target's IP range","D":"Skimming recent news about the company"},"answer":"C","explanation":"Passive reconnaissance reads public sources without touching the target's systems; active reconnaissance sends traffic to them. The port scan is the one step that put packets on the target's own infrastructure, so it is where the morning crossed into active. (A), (B) and (D) are all public-source reads — LinkedIn, DNS/WHOIS databases and news sites are third-party, and querying them never touches the target's systems. Exam clue: knocking on the target's doors to see which open = active; everything read from the outside = passive.","source":"curated-review-debt","addedVersion":"8.17.0","addedDate":"2026-08-22"},
```

- [ ] **Step 2: Full verification — counts, letters, difficulty, sources, LENGTH GATE, guard, objective spread**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e '
const s=require("fs").readFileSync("certs/secplus.js","utf8");
const m=s.match(/"objective":"(\d+)\.\d+"/g)||[];const c={1:0,2:0,3:0,4:0,5:0};
m.forEach(x=>c[x.match(/"objective":"(\d+)\./)[1]]++);
const t={1:12,2:22,3:18,4:28,5:20},tol={1:19,2:10,3:10,4:10,5:10};let ok=true;
for(const k of [1,2,3,4,5]){const p=c[k]/m.length*100;if(Math.abs(p-t[k])>tol[k])ok=false;}
console.log("total:",m.length,"| AA:",(s.match(/"topic":"Audits & Assessments"/g)||[]).length,"| GUARD:",ok?"PASS":"FAIL");
const rows=s.split("\n").filter(l=>l.includes(String.raw`"addedVersion":"8.17.0"`));
const letters={},diff={},src={},obj={};let longest=0;
rows.forEach(l=>{const e=JSON.parse(l.trim().replace(/,$/,""));
letters[e.answer]=(letters[e.answer]||0)+1;diff[e.difficulty]=(diff[e.difficulty]||0)+1;src[e.source]=(src[e.source]||0)+1;obj[e.objective]=(obj[e.objective]||0)+1;
const max=Math.max(...Object.values(e.options).map(x=>x.length));
if(e.options[e.answer].length===max&&Object.values(e.options).filter(x=>x.length===max).length===1)longest++;});
console.log("n:",rows.length,"| letters:",JSON.stringify(letters),"| diff:",JSON.stringify(diff));
console.log("obj:",JSON.stringify(obj),"| src:",JSON.stringify(src));
console.log("LENGTH GATE:",longest,"of 14 —",longest<=6?"PASS":"FAIL");' && npm run test:uat 2>&1 | grep "UAT:"
```

Expected: `total: 359 | AA: 12 | GUARD: PASS`; `n: 14`; letters `{"B":4,"C":4,"A":3,"D":3}`; difficulty `{"Exam Level":9,"Hard":2,"Foundational":3}`; obj `{"2.2":7,"5.5":5,"4.6":2}`; sources `{"curated-lesson-osint-impersonation":9,"curated-review-debt":5}`; **LENGTH GATE PASS** (≤6); UAT green. A gate FAIL → pad distractors on the offending items, re-run.

- [ ] **Step 3: Commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil"
git add certs/secplus.js
git commit -m "feat(secplus): OSINT/impersonation exemplars 8-14 + the true-Both pairing break

Why FIDO2 resists phishing, the deepfake-voice out-of-band defence, and
the three v8.16.0 debt items: file-based keyed (shared-drive macro doc),
unsecure wireless keyed (car-park WLAN association), caller-ID spoofing,
the active-recon boundary, and — item 12 — the first genuinely-correct
'Both' key in the pack, ending the pool-wide 0-of-15 pairing tell.

Closes the lesson at 14: letters A3/B4/C4/D3, spread 3F/9E/2H, length
gate passed, obj 2.2 x7 / 5.5 x5 / 4.6 x2.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Add the 2 retention concepts

**Files:** Modify `certs/secplus.js` — insert after the v8.16.0 vector-concept pair (re-locate at implementation: find the `retentionGapConcepts` closing `],`; the last entry is `Vector recognition tells + the two traps`) before that `],`.

**RUN AFTER Task 2's review is clean.** Before inserting, read the final shipped prose of items 1, 2, 4, 7, 8, 9 and confirm each concept claim matches them (the v8.16.0 standing rule: concepts drift into absolutes the exemplar review already softened).

- [ ] **Step 1: Insert the banner and two entries**

```javascript
    // ── OSINT & Impersonation lesson (v8.17.0, 2026-08-22) — 2 entries ──
    { label: 'The attack chain: OSINT learns, impersonation pretends, pretexting explains, spoofing falsifies, phishing delivers', parentTopic: 'Social Engineering', objective: '2.2', keyword: 'Five roles the exam keeps separate, easiest read as a chain. OSINT LEARNS — public-source homework (LinkedIn, company site, press releases, WHOIS, breach dumps) that makes the later contact believable. IMPERSONATION PRETENDS — the WHO: claiming to be the CEO, IT, a vendor. PRETEXTING EXPLAINS — the STORY: the invented reason to act ("I am overseas and cannot call"). SPOOFING FALSIFIES — the technical identity: a forged From header, a faked caller ID, a lookalike domain. PHISHING DELIVERS — the fraudulent message that carries it all to the victim (email = phishing, SMS = smishing, voice = vishing). One incident routinely contains several: a spoofed CEO email (spoofing) impersonating the CEO (impersonation) with a confidential-acquisition story (pretexting) built from LinkedIn research (OSINT) asking for a wire transfer (a likely BEC). Two rules the exam rewards: deepfakes (AI-cloned voice or video) raise the CREDIBILITY of impersonation but never change the defence; and the defence is out-of-band verification — confirm the request through a separate channel and a contact detail you already hold, because replying "are you really the CEO?" on the same channel still talks to the attacker.' },
    { label: 'OSINT: passive vs active, and intent-neutral', parentTopic: 'Audits & Assessments', objective: '5.5', keyword: 'OSINT is intelligence from publicly accessible sources, and it is overwhelmingly PASSIVE reconnaissance: reading LinkedIn, WHOIS and DNS records, news, job postings and public records touches nothing the target owns. ACTIVE reconnaissance interacts with the target\'s own systems — a port scan, service enumeration, probing a web app — and that is the line a port scan crosses. Passive = looking from outside; active = knocking on the doors to see which open. Two exam points beyond the split. First, OSINT is intent-neutral and lawful: the technique is defined by the source type, not the actor, so a threat-intelligence team searching paste sites for leaked credentials and brand-abuse profiles is doing exactly the same OSINT an attacker does, for the opposite reason — same information, different intent. Second, the danger is AGGREGATION: one LinkedIn profile, one Instagram post, one job advert each look harmless, but combined they yield people + technologies + timing + relationships, and a job posting that lists the security stack (Entra ID, Sentinel, CrowdStrike, a named firewall) hands an attacker the environment for free. Public does not mean harmless.' },
```

- [ ] **Step 2: Verify guard-invisibility, suite; commit**

```bash
cd "$HOME/Desktop/Dev Projects/certanvil" && node --check certs/secplus.js && node -e 'const s=require("fs").readFileSync("certs/secplus.js","utf8");console.log("retention:",(s.match(/parentTopic:/g)||[]).length,"| guard-counted:",(s.match(/"objective":"(\d+)\.\d+"/g)||[]).length);' && npm run test:uat 2>&1 | grep "UAT:"
git add certs/secplus.js
git commit -m "feat(secplus): OSINT/impersonation retention concepts

The OSINT->impersonation->pretexting->spoofing->phishing chain with the
deepfake-credibility and out-of-band-verification rules; and OSINT as
passive-vs-active plus intent-neutral, with the aggregation danger.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected: `retention: 44 | guard-counted: 359` (exemplar count unchanged). UAT green.

---

### Task 4: Ship v8.17.0

- [ ] **Step 1:** `npm test` — full battery. E2E failures: triage against touched files (only `certs/secplus.js` + docs); pre-existing flakes reported, never fixed; never re-baseline visuals.
- [ ] **Step 2:** `node scripts/bump-version.js 8.17.0 "Sec+ OSINT & Impersonation mixed-domain lesson (obj 2.2/5.5/4.6) — 14 exemplars + 2 retention concepts + v8.16.0 debt items"`
- [ ] **Step 3:** CHANGELOG row beneath the `|---|---|` header:

```markdown
| v8.17.0 | Sec+ OSINT & Impersonation (obj 2.2/5.5/4.6): 14 exemplars — spoofing, OSINT-as-term + defender/technical OSINT, phishing-resistant MFA/FIDO2, + 3 review-debt items incl. the first true-"Both" key — + 2 retention concepts. First pass growing D4/D5 |
```

- [ ] **Step 4:** Confirm 8.17.0 in package.json, CLAUDE.md, CHANGELOG.md.
- [ ] **Step 5:** Commit (message below) and push. **STASH DISCIPLINE:** `git stash push -- .github/workflows/vercel-incident-recovery.yml` before committing, commit, `git stash pop` after; confirm in the report BOTH that the commit excludes it AND that `git stash list` shows no leftover from your stash. Stage all files the bump script changed (check `git status`) plus CHANGELOG.md.

```
v8.17.0 — Sec+ OSINT & Impersonation mixed-domain lesson

First mixed-domain, delta-only pass: obj 2.2 (spoofing), 5.5 (OSINT),
4.6 (phishing-resistant MFA). 14 exemplars + 2 retention concepts,
authoring only the gaps left after v8.14-v8.16 and closing the three
v8.16.0 review-debt items. First ship to grow the under-target domains
(D4/D5) rather than D2; D4 is the binding floor at -8.8pp of -10.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

- [ ] **Step 6:** Wait for both CI workflows to CONCLUDE green (`gh run list`); BLOCKED on failure.
- [ ] **Step 7 (founder-only, BYOK):** generate batches on Audits & Assessments and Social Engineering; OSINT-as-term, defender OSINT, spoofing, phishing-resistant MFA must surface.
- [ ] **Step 8:** Notion per ledger conventions.

---

## Self-Review

**Spec coverage:** 9 lesson items + 5 debt items = 14 (T1: 7, T2: 7) ✓ · 2 concepts (T3) ✓ · letters A3/B4/C4/D3 asserted ✓ · spread 3F/9E/2H asserted ✓ · obj 2.2×7/5.5×5/4.6×2 asserted ✓ · sources 9/5 asserted ✓ · length gate ≤6/14 asserted ✓ · item 12 true-"Both" D-keyed, no mirror distractor ✓ · guard PASS with D4 −8.8pp asserted ✓ · v8.17.0 ship + stash discipline (T4) ✓.

**Placeholders:** none — all literal text present, all commands runnable.

**Consistency:** counts chain 345 → (T1) 352 → (T2) 359 → (T3) 359. AA 7 → 10 → 12. Retention 42 → 44. Item-12's true-"Both" key does not contradict the pool observation — it *ends* it, and no other v8.17.0 item or concept re-asserts "Both is never keyed". Letters recomputed from the per-item keys: items 1-7 = B,C,A,D,C,B,D; items 8-14 = A,B,C,A,D,B,C → A3 (3,10,13), B4 (1,6,9,13→ recount by script), C4, D3. The Task 2 script is authoritative; if it reports anything other than A3/B4/C4/D3 the plan is wrong and must stop. Casts distinct across all 14 and from prior lessons (forged-From CEO, Sarah £40k, LinkedIn org-chart, Alex/Maria/Vendor-X, Sarah-Jones email format, threat-intel paste sites, MFA-fatigue remediation, FIDO2-why, deepfake CEO voice, Reconciliation xlsm, car-park WLAN, email+Teams phish pair, caller-ID vishing, pentester morning log).
