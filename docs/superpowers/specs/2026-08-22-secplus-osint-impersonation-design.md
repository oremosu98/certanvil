# Sec+ OSINT & Impersonation (mixed-domain) — exemplar lesson pass

**Date:** 2026-08-22
**Cert pack:** `certs/secplus.js`
**Target version:** v8.17.0 (Fast lane — data only)
**Objectives:** SY0-701 2.2 (spoofing/impersonation), 5.5 (recon/OSINT — *not* 5.4; verified against the two live recon items), 4.6 (phishing-resistant MFA)
**Companion specs:** the v8.14.0 / v8.15.0 / v8.16.0 lessons, same method, same day. Shared machinery documented there; this spec states only what differs.

---

## Why this change — and why it is a DELTA pass

The founder's Impersonation and OSINT notes overlap heavily with content shipped v8.14.0–v8.16.0. A verbatim lesson would duplicate live exemplars. Verified coverage before authoring:

- **Impersonation:** keyed once (v8.16.0 courier item). Whaling/BEC/vishing/pretexting all keyed. **Spoofing: 5 mentions, keyed 0** — the genuine 2.2 gap.
- **Recon:** keyed 3×, **passive reconnaissance keyed twice** (both existing recon items land on it), all objective **5.5**. So "which recon type" and "job posting = OSINT" items would near-duplicate live content. The OSINT gaps that remain: OSINT as a *named term* (2 mentions, keyed 0), the OSINT→attack *feed*, defender-side OSINT, and technical (email-format) OSINT.
- **Phishing-resistant MFA / FIDO2 / passkeys: 0 mentions.** Clean gap, obj 4.6, and it completes the MFA-fatigue item shipped v8.15.0.

So this is the first **mixed-domain** pass, and the first to grow the under-target domains (D5 −7.2pp, D4 −7.2pp) rather than D2. It also carries the three queued v8.16.0 review-debt items.

This ship targets three under-served domains at once; the guard consequence is computed in Verification.

## Source and legal position

Nine items + both retention concepts from the founder's Impersonation + OSINT notes (public SY0-701 objectives + free Professor Messer material), tagged `curated-lesson-osint-impersonation`. The five review-debt items are authored from the public objectives, tagged `curated-review-debt`. §10 discipline; no paid-bank content.

## Scope

**In**
1. 9 lesson exemplars: 1 spoofing (2.2), 3 OSINT (5.5), 2 phishing-resistant MFA (4.6), plus 3 more spread across those (see table).
2. 5 review-debt items: file-based keyed, unsecure-wireless keyed, the true-"Both" pairing-template break (all 2.2 Attack Vectors), and the two remaining balancing items.
3. 2 retention concepts.
4. v8.17.0 bump + CHANGELOG.

**Out**
- Re-testing passive-vs-active recon as a bare "which type" item — already keyed twice at 5.5. New recon items must add an angle those two do not (the OSINT→attack feed; defender-side OSINT; technical OSINT), never the plain classification.
- The distractor-padding pass (deferred to the post-A/B generator-cue rebalance).
- Weights, maps, guard, picker, prompt functions, PBQs.

## Design — 14 items

| # | Item | Topic / Obj | Diff | Key | Source |
|---|---|---|---|---|---|
| 1 | Spoofing vs impersonation — forged `From:` header (the technical falsification) vs the act of pretending to be the CEO (the social technique); which term names the header manipulation | Social Engineering / 2.2 | Exam | B | lesson |
| 2 | WHO/STORY/SPOOF/PHISH decomposition — the Sarah/£40k BEC scenario, asked "which element is the SPOOFING" (single-element ask, mirrors the live pretexting-element item — NOT a pairing stem) | Social Engineering / 2.2 | Hard | C | lesson |
| 3 | OSINT as the named term — attacker compiles names, roles and an org chart purely from LinkedIn, the company site and a press release, before any contact; what is this activity called | Audits & Assessments / 5.5 | Foundational | A | lesson |
| 4 | OSINT feeds the attack — the Alex(CFO, overseas)/Maria(AP)/Vendor-X scenario; which PHASE the public-record research represents (reconnaissance/OSINT, distinct from the BEC that follows) | Audits & Assessments / 5.5 | Exam | D | lesson |
| 5 | Technical OSINT — attacker derives `first.last@company.com` from a known name + the format seen in a public breach/site; which reconnaissance technique | Audits & Assessments / 5.5 | Foundational | C | lesson |
| 6 | Defender-side OSINT — threat-intel team monitors paste sites and fake social profiles for leaked credentials and brand abuse; the point that OSINT is lawful and intent-neutral | Audits & Assessments / 5.5 | Exam | B | lesson |
| 7 | Phishing-resistant MFA — after an MFA-fatigue compromise (links to the v8.15.0 item), which authentication change most directly prevents recurrence (FIDO2 / passkeys) | Identity & Access Management / 4.6 | Exam | D | lesson |
| 8 | WHY FIDO2 resists phishing — the credential is cryptographically bound to the real site's origin, so there is nothing to read out over the phone, type into a lookalike page, or approve under pressure | Identity & Access Management / 4.6 | Hard | A | lesson |
| 9 | Impersonation across channels + deepfake — an AI-cloned CEO voice on a call demanding a transfer; the defence is out-of-band verification on a known-good channel, unchanged by the realism of the fake | Social Engineering / 2.2 | Exam | B | lesson |
| 10 | **File-based keyed** (debt) — a macro-enabled document opened from an internal shared drive, no message involved; anchors the transport rule from the other side (route ≠ message → object type decides) | Attack Vectors / 2.2 | Exam | C | debt |
| 11 | **Unsecure wireless keyed** (debt) — weak Wi-Fi security lets an attacker in the car park associate to the corporate WLAN; keyed as the VECTOR (not the evil-twin attack, which lives in Network Attacks) | Attack Vectors / 2.2 | Exam | A | debt |
| 12 | **The true-"Both" pairing break** (debt) — an email phish and a Teams-DM phish; keyed "Both are message-based vectors." First genuinely-correct "Both" key in the pack, ending the pool-wide 0-of-15 tell. Placed on letter D | Attack Vectors / 2.2 | Exam | D | debt |
| 13 | Spoofing reach (debt) — caller-ID spoofing on a vishing call; which technical element is the spoofing vs which is the vishing, reinforcing item 1 in a different channel | Social Engineering / 2.2 | Exam | B | debt |
| 14 | OSINT vs active recon boundary (debt) — a mixed action list (LinkedIn review THEN a port scan); which single step crossed into active recon. Adds the boundary angle the two live passive-recon items don't test | Audits & Assessments / 5.5 | Foundational | C | debt |

Letters: **A3 / B4 / C4 / D3** (≥3 D — item 12's true-"Both" key is deliberately D, and it is the first D-keyed "Both" in the pack). Spread: **3F / 9E / 2H.** All mcq.

### Domain distribution of the 14
2.2 ×7 (items 1, 2, 9, 10, 11, 12, 13), 5.5 ×5 (3, 4, 5, 6, 14), 4.6 ×2 (7, 8). The plan asserts these objective counts by script.

### The 2 retention concepts

1. **`The attack chain: OSINT → impersonation → pretexting → phishing`** (`parentTopic: 'Social Engineering'`, obj 2.2) — the founder's chain: OSINT *learns*, impersonation *pretends* (WHO), pretexting *explains* (STORY), spoofing *falsifies* (the technical identity — From:, caller ID, lookalike domain), phishing *delivers*. Includes the deepfake-credibility clause (AI voice/video raises believability, not the defence) and the reply-isn't-verification rule: replying "are you really the CEO?" still talks to the attacker — verify out-of-band on a channel and number you already hold.
2. **`OSINT: passive vs active, and intent-neutral`** (`parentTopic: 'Audits & Assessments'`, obj 5.5) — passive recon reads public sources without touching the target (LinkedIn, WHOIS, DNS, news, job postings); active recon interacts (port scan, service enumeration, probing). OSINT is overwhelmingly passive. It is lawful and intent-neutral: threat-intel and red teams use the same sources defenders do. The danger is aggregation — one profile, one post, one job advert each look harmless; combined they yield people + tech + timing + relationships, which is what makes the later impersonation convincing.

### Authoring rules

All binding rules from the prior specs, plus the two the v8.16.0 review earned:
- **Pool-level length gate**: correct option strictly longest in ≤ 6 of 14 (~40%).
- **No new pairing-template item** beyond item 12 — and item 12 exists specifically to break the template (true "Both" key, D-keyed), not to extend it. No mirror-reversal distractor on it.
- **Retention concepts authored AFTER the exemplar reviews** (the standing rule from v8.16.0 Task 4) — the plan orders the concept task last of the content tasks and its brief carries a diff-against-final-exemplar-prose check.

### Data contract

Compact JSON, no space after colons; `"addedVersion":"8.17.0"`, `"addedDate":"2026-08-22"`; all 14 mcq single-letter `"answer"`; lesson banner at the end of `questionExemplars` (closing `],` currently line 808). Retention concepts guard-invisible, JS object form, after the v8.16.0 pair (line 112, before `],` at 113 — re-verify at implementation; the count has moved).

## Verification

1. UAT green; `node --check`. Counts: total 345 → 359; A&A 7 → 12; SE topic grows by 5; IAM by 2; AV by 3; retention 42 → 44. Objective counts: 2.2 +7, 5.5 +5, 4.6 +2.
2. **Guard — the consequential check, computed exactly.** After +14 (2.2 ×7, 5.5 ×5, 4.6 ×2), total 359:
   - D1 = 95/359 = 26.5% (+14.5pp of 19) — OK
   - D2 = 103/359 = 28.7% (+6.7pp of 10) — OK, climbing
   - D3 = 43/359 = 12.0% (−6.0pp) — OK
   - D4 = 69/359 = 19.2% (**−8.8pp of −10**) — OK, the tightest number in the pack and the binding constraint. Only 2 items land in D4 while the pool grows by 14, so D4's deficit *widens* slightly even as absolute D4 count rises. **If any D4 item is cut or reassigned during implementation, recompute — D4 has ~4pp of floor headroom and no more.** This is the first ship where a domain FLOOR, not the D1/D2 ceiling, is the risk. GUARD: PASS (verified before spec commit).
   - D5 = 49/359 = 13.6% (−6.4pp, improved from −7.2pp) — OK
   - The plan's guard assertion is authoritative; these are estimates.
3. Length gate ≤ 6/14. Letters A3/B4/C4/D3 with item 12's "Both" key on D.
4. Adversarial per-task review; cross-check items 1/2/13 (spoofing) agree, and item 12's true-"Both" does not contradict the "Both is never keyed" observation elsewhere — it *ends* it, and the retention/other items must not re-assert the old tell.
5. **Acceptance (founder, post-ship, BYOK):** generate batches on Audits & Assessments and on Social Engineering; OSINT-as-term, defender OSINT, spoofing, and phishing-resistant MFA must surface.

## Rejected approaches

- **Re-testing passive-vs-active recon as a plain classification item:** already keyed twice at 5.5; would duplicate. Kept only the boundary angle (item 14) and the OSINT-specific angles the live pair omits.
- **A full impersonation lesson:** most of it shipped v8.14–v8.16; a delta pass avoids duplicating live exemplars.
- **Tagging the OSINT items 5.4:** wrong — the live recon items are 5.5, and consistency matters for the guard and the picker's same-domain tier. Corrected to 5.5.
- **Growing D2 again:** the guard analysis says D2 has ~21 slots and D4/D5 are the priority. This pass deliberately puts only debt items in D2 and its new content in D4/D5.
