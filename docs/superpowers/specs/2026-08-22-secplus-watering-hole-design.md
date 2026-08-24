# Sec+ Watering Hole & Endpoint Controls — exemplar delta pass

**Date:** 2026-08-22
**Cert pack:** `certs/secplus.js`
**Target version:** v8.18.0 (Fast lane — data only)
**Objectives:** SY0-701 2.2 (watering hole discriminations, voice-call vector), 2.5 (mitigation), 4.5 (enterprise capability modification)
**Companion specs:** the v8.14.0–v8.17.0 lessons, same method, same day. Shared machinery documented there; this spec states only what differs.

---

## Why this change

Fifth lesson from founder notes, and — like v8.17.0 — a **delta pass**. Most of the watering-hole notes are already live. Measured before authoring:

- **Watering hole is keyed once** (the defence-contractor forum item), and four of its five discriminations are already tested: vs phishing (3 items), vs supply chain (3), vs spear phishing (1), plus target selectivity (1).
- **What is genuinely absent:** watering hole vs **drive-by download** (0 co-occurrences pack-wide) and vs **malvertising** (0). Both are named distinctions in the notes.
- **The entire defence angle is untested against watering hole** — but only two of the five controls are actually thin pack-wide: **EDR (4 mentions, 0 keyed)** and **web/URL filtering (1 mention, 0 keyed)**. Patch management (14 items, 3 keyed) and segmentation (9, 3 keyed) are already well covered and are deliberately NOT re-authored here.
- **Voice call is keyed 0 times anywhere in the pack** despite the v8.16.0 vector item's own explanation asserting "the phone call is the vector". One item closes it — and with it, **objective 2.2 becomes fully keyed**.

### The domain finding that shapes this ship

EDR and web filtering are **objective 4.5 bullets** ("modify enterprise capabilities to enhance security" — firewall, IDS/IPS, web filter, DNS filtering, email security, DLP, NAC, EDR/XDR). The pack's 4.5 currently holds **five items, all email security**; nothing on the rest of the bullet list.

That matters because D4 is the binding constraint. Modelled before writing:

| Split | D4 result |
|---|---|
| All 7 items in D2 | −8.8pp → **−9.1pp** (worse) |
| **4 in D2 + 3 in D4** | −8.8pp → **−8.3pp** (better) |

Runway: **24 further non-D4 items before the D4 floor breaches.** An all-D2 ship would spend roughly a third of that. The split makes this the first ship to *ease* the tightest constraint in the pack.

## Source and legal position

Five items + the retention concept from the founder's watering-hole notes (public SY0-701 objectives + free Professor Messer material), tagged `curated-lesson-watering-hole`. Two items close queued review debt and are authored from the public objectives, tagged `curated-review-debt`. §10 discipline; no paid-bank content.

## Scope

**In**
1. 7 new exemplars (4 in D2, 3 in D4) — table below.
2. 1 retention concept, `parentTopic: 'Social Engineering'`, obj 2.2.
3. Two queued v8.17.0 debt fixes: the recon-rule contradiction, and the item-325 topic re-file.
4. v8.18.0 bump + CHANGELOG.

**Out**
- Re-authoring patch management or segmentation as watering-hole defences — both already well covered (14 and 9 items); adding more would be redundant, and the notes' defence list is not a mandate to test every control.
- The distractor-padding pass and the letter-rotation pass (both audit-gated, pending the A/B test).
- Weights, maps, guard, picker, prompt functions, PBQs.

## Design — 7 items

| # | Item | Topic / Obj | Diff | Key | Source |
|---|---|---|---|---|---|
| 1 | Watering hole vs drive-by download — one incident, two labels: which names the target-selection STRATEGY and which the INFECTION MECHANISM. Keyed on the pairing that gets both right | Social Engineering / 2.2 | Exam | D | lesson |
| 2 | Watering hole vs malvertising — a poisoned ad network reaching whoever loads the ad, versus a niche site compromised BECAUSE these employees visit it. Discriminator is target selection, not the web delivery both share | Social Engineering / 2.2 | Exam | B | lesson |
| 3 | Why awareness training is the weak control here — the user is legitimately visiting a site they trust and have visited for years, so there is no suspicious signal to train against; the load falls on patching, EDR and web filtering | Mitigation Techniques / 2.5 | Hard | C | lesson |
| 4 | Voice call as a threat vector — an attacker phones an employee and talks them through disabling a control; the stem asks for the VECTOR, not the technique. Closes the last unkeyed 2.2 bullet | Attack Vectors & Surfaces / 2.2 | Foundational | A | debt |
| 5 | EDR keyed — after a watering-hole compromise of a trusted site, which control detects the exploit BEHAVIOUR on the endpoint given the site itself carried no reputation signal | Email & Web Security / 4.5 | Exam | C | lesson |
| 6 | Web/URL filtering keyed — blocking the compromised destination (or its redirect target) before the browser completes the request, and why it degrades gracefully when the compromise is fresh | Email & Web Security / 4.5 | Exam | D | lesson |
| 7 | EDR vs signature antivirus — why a never-seen browser exploit chain evades signature matching while behavioural detection still fires; makes item 5's control earn its keep | Email & Web Security / 4.5 | Hard | B | debt |

Letters: items 1–7 key **D, B, C, A, C, D, B** = **A1 / B2 / C2 / D2**. Every letter represented, none above 2. The plan asserts this by script.

Spread: **1F / 4E / 2H.** All mcq.

**Topic note:** items 5–7 use `Email & Web Security`, the pack's existing home for objective 4.5 (all five current 4.5 items sit there). Introducing a new topic for endpoint controls would fragment the picker's exact-match tier for a three-item block; if 4.5 grows past ~12 items a split becomes worth revisiting.

### The retention concept

`parentTopic: 'Social Engineering'`, `objective: '2.2'`, JS object form, appended after the v8.17.0 pair (retention array closes at line 119 — re-verify at implementation).

**`Watering hole vs drive-by vs malvertising vs phishing, and why awareness fails here`** — the four-way separation: PHISHING brings the bait to the victim; WATERING HOLE poisons a site the victim already visits and waits; DRIVE-BY DOWNLOAD is the infection mechanism (malware executes on visit) rather than a targeting strategy, so it frequently occurs *inside* a watering hole; MALVERTISING poisons an ad network and takes whoever loads the ad, so it lacks the target selection that defines a watering hole. Then the defence point: awareness training is comparatively weak against watering holes because the victim is doing something legitimate on a site they trust, so the burden shifts to technical controls — patching (shrinks the exploitable browser surface), EDR (catches the behaviour when the site's reputation tells you nothing), web filtering (blocks the destination), threat intelligence (surfaces newly compromised domains) and segmentation (limits what one compromised endpoint reaches). Closes with the memory line: *phishing finds you; a watering hole waits for you; a drive-by is how it lands.*

### Debt fixes riding along

1. **Recon-rule contradiction** (v8.17.0 final review, Important). Item 358 states active recon as *"put packets on the target's own infrastructure"*, but item 347's stem lists *"the corporate website"* as an OSINT source and its (B) rebuttal only addresses LinkedIn. A learner applying 358's rule literally answers (B) and is marked wrong by an explanation that never engages their reasoning. Fix: reframe on **probing for technical detail** rather than literal packet contact, in item 358's body and item 347's (B) rebuttal, plus a clause in the OSINT retention concept making ordinary browsing of a target's public site explicitly passive.
2. **Item-325 topic re-file** (v8.17.0 final review, Minor). The macro-attachment vector-classification item sits under `topic: 'Social Engineering'` while its direct counterpart (the shared-drive file-based item) sits under `Attack Vectors & Surfaces`. Topic drives the picker's exact-match tier, so a Social Engineering batch currently receives a vector-classification style reference. One-field change; objective stays 2.2, so the guard is unaffected.

### Authoring rules

All binding rules from the prior four specs. Enforced by script in the plan:
- **Pool length gate:** correct option strictly longest in ≤ 3 of 7 (~40%, the same ratio as prior lessons).
- **Every distractor re-verified wrong after any padding** — a v8.17.0 fix round made a padded FIDO2 distractor factually true.
- **All-item length re-check after ANY option edit**, not only edited items — a v8.17.0 fix relocated a length cue onto an unchecked item.
- **No new pairing-template item** (8 uses pack-wide) and no fifth use of the four-role element-isolation template (currently 4).
- **Persona/prop check across the whole pack** before using any name; cast must avoid LinkedIn, CEO-impersonation and car-park scenarios, all flagged as over-used.
- **Retention concept authored LAST**, after the exemplar reviews, diffed against both the final shipped exemplar prose AND every pre-existing concept in the same topic (the v8.17.0 extension of the standing rule).

### Data contract

Compact JSON, no space after colons; `"addedVersion":"8.18.0"`, `"addedDate":"2026-08-22"`; all 7 mcq single-letter `"answer"`; banner at the end of `questionExemplars` (closing `],` currently line 831). Retention concept guard-invisible, single-quoted JS object form.

## Verification

1. UAT green; `node --check`. Counts: total 359 → 366; 2.2 objective +3; 2.5 +1; 4.5 +3; retention 44 → 45.
2. **Guard, computed before spec commit:** D1 +14.0pp · D2 +7.2pp · D3 −6.3pp · **D4 −8.3pp (improved from −8.8)** · D5 −6.6pp — **PASS**. If any item is reassigned away from 4.5 during implementation, recompute: D4 has ~1.7pp of floor headroom.
3. Length gate ≤ 3 of 7; letters no worse than 3 of any one letter.
4. **Objective 2.2 completeness check:** after item 4, every named 2.2 bullet must be keyed at least once. Assert by script.
5. Adversarial per-task review; cross-check items 1–3 and the concept against the four live watering-hole items and the v8.15.0/v8.16.0 vector concepts.
6. **Acceptance (founder, post-ship, BYOK):** generate on Social Engineering and Email & Web Security; drive-by, malvertising, EDR and web filtering must surface.

## Rejected approaches

- **All seven items in D2:** simpler and single-topic, but pushes D4 to −9.1pp and spends a third of the 24-item runway before that floor breaches. The split is the whole point of the ship.
- **Re-authoring patch management and segmentation as watering-hole defences:** already well covered (14 and 9 items). The notes list five controls; only two are thin, and testing the other three would be redundancy dressed as coverage.
- **A new `Endpoint Security` topic for items 5–7:** would fragment the picker's exact-match tier for a three-item block. Revisit if 4.5 grows past ~12.
- **Deferring the voice-call item to a later ship:** it is one item and it completes objective 2.2 — the strongest single-item story available, and it costs nothing to include now.
