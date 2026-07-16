# Core 2 (220-1202) PBQ Evidence — Redlib Deep Re-run

**Date:** 2026-07-16 · **Scope:** RESEARCH ONLY · **Route:** Redlib mirror via in-app Browser pane

---

## 1. Route + Method Log

**Route that worked:** `redlib.privacyredirect.com` via `mcp__Claude_Browser__preview_start {url}`, then
`navigate` / `get_page_text` / `javascript_tool`. No 403s, no degradation. reddit.com and WebSearch not attempted (known-dead per brief).

**Efficiency finding — CONFIRMED and re-confirmed.** Redlib search-result pages return entire post bodies.
A single `get_page_text` on a search page yielded 8–25 full posts. This is the correct primary instrument.

**Bulk enumeration — CONFIRMED.** `javascript_tool` evaluating
`[...document.querySelectorAll('.post')].map(p => ({t: title, dt: date, d: body.slice(0,700)}))`
returned title+date+body for ~25 posts in ONE call, and is strictly better than `get_page_text`
because it returns structured records and drops sidebar noise. Recommend this over `get_page_text`
for future search passes.

**Volume this pass:**
- **8 search passes:** `"220-1202" PBQ` (new) · `"Core 2" PBQ` (new, year) · `1202 PBQs were` (new, year) ·
  `Core 2 PBQ ticket permissions command prompt` · `Core 2 PBQ quarantine workstation services` ·
  `"220-1202"` (new, all) · `A+ PBQ drag and drop ticket malware removal order` ·
  `Core 2 PBQ Windows settings control panel simulation` · `PBQ ticketing system ticket queue A+` ·
  `passed core 2 PBQ experience` (new, month)
- **~110 post titles/bodies triaged** (heavy overlap between passes; ~55 unique)
- **2 comment trees opened** (selectively, per the 1-in-5 payoff rule) — 1 paid off richly
- **2 searches returned literally zero posts** — a meaningful negative signal (see §3)

**Comment-tree payoff:** 1 of 2. The single productive tree
(`/r/CompTIA/comments/1rr47ne/`) supplied the only new sitting of the whole pass, plus a
format contradiction and a format-absence report. Body-only reading would have missed all of it.
The brief's "comments rarely pay" heuristic held — but the exception was the highest-value item here.

---

## 2. Format Claims (type c) — Independent Sitting Counts

### FORMAT A — Interactive command-line / terminal PBQ, `help` enumerates available commands
**Independent sittings: 2** (baseline 1 → **+1**)

| # | User | Basis | Exam code | Post date | Confidence | URL |
|---|------|-------|-----------|-----------|-----------|-----|
| 1 | u/Klutzy-Astronaut-280 | Firsthand, own sitting | **220-1202, stated explicitly** | May 29 '26 | High | [/r/CompTIA/comments/…passed_a_core_2_today](https://redlib.privacyredirect.com/r/CompTIA/search?q=%22220-1202%22+PBQ) |
| 2 | **u/Mental_Tea_4084** | Firsthand, own sitting | **Core 2 inferred from thread topic — NOT stated** | Mar 12 '26 | **Medium** | [/r/CompTIA/comments/1rr47ne/](https://redlib.privacyredirect.com/r/CompTIA/comments/1rr47ne/does_the_a_core_2_allow_you_to_use_help_command/) |

Verbatim, read off the rendered page myself:
- Klutzy-Astronaut-280: *"if you get a command-line PBQ, try using the help command. It can show you the available commands for that environment/situation"*
- Mental_Tea_4084: *"Yes, my pbq let me type help to get a list of available commands"*

**Confidence caveat on #2:** the thread title is *"Does the A+ Core 2 allow you to use 'help' command?"*, so the reply is
contextually about Core 2, but the user never states an exam code. Counted at **medium** confidence.
If the project wants strict code-attestation, this drops back to 1 sitting.

### FORMAT A-adjacent — instructor testimony (NOT a sitting)
u/drushtx (r/CompTIA **MOD, IT Instructor** flair), Mar 11 '26, same thread:
*"The help command in PBQs only lists four commands that work in the sandbox. You can't do 'help command' to get info on command usage."*
This is **tier: instructor/authoritative, secondhand** — it corroborates that a *constrained-command terminal sandbox*
is the real 1202 exhibit shape, and adds the detail that the sandbox exposes a **small fixed command set (~4)**.
It is **not** counted as a sitting. Exam-code scope not stated (may span A+ generally).

### FORMAT B — Command PBQ via **drop-down selection**, not free typing
**Independent sittings: 0 counted (1 flagged, unresolvable)**

u/shaggs31 (flair: A+, Net+, Sec+, Project+, ITIL, Linux LPI, AWS), Mar 11 '26:
*"For me I don't remember anywhere that I had to physically type commands. Any commands involved would be in a drop down list to select."*

This **contradicts** Format A's interaction shape. But the user holds seven certs and never names an exam code — this
could be Net+, Sec+, or a prior A+ generation. **NOT counted.** Flagged as an open question: 1202 may ship both a
typed-terminal variant and a dropdown variant across forms.

### FORMAT C — Quarantine + per-workstation service toggles
**Independent sittings: 1 — UNCHANGED** (u/FRESH__LUMPIA, ~2026-07-12, baseline; not re-surfaced this pass)

### FORMAT D — Mock ticket-queue triage
**Independent sittings: 1 — UNCHANGED** (u/FRESH__LUMPIA — **SAME PERSON, SAME SITTING as Format C**)

---

## 3. Disposition of the 9 Claims

| # | Claim | Disposition | Δ sittings |
|---|-------|-------------|-----------|
| 1 | Quarantine + per-workstation service toggles | **UNRESOLVED** — targeted search returned no independent support. u/armbarassassin84's "quarentine for audio issues" remains the only echo and remains **NOT counted** (semantically odd, no format description). Still rests on one person. | 0 (still 1) |
| 2 | Mock ticket-queue triage | **UNRESOLVED, leaning weak.** Search `PBQ ticketing system ticket queue A+` (all-time) returned **"No posts were found."** Zero independent corroboration anywhere on the mirror. | 0 (still 1, same person as #1) |
| 3 | Terminal PBQ where `help` lists commands | **CONFIRMED (+1 sitting)** — plus independent instructor testimony sharpening the shape (fixed ~4-command sandbox). Now unambiguously the best-evidenced 1202 format. | **+1 → 2** |
| 4 | Windows settings navigation PBQ | **STILL ZERO.** Search `Core 2 PBQ Windows settings control panel simulation` returned **"No posts were found."** Nobody describes one. | 0 |
| 5 | Permissions / effective-access (NTFS/share) PBQ | **STILL ZERO firsthand.** No legitimate firsthand report surfaced. The only prior claim (dump-vendor Medium post) remains excluded. | 0 |
| 6 | Disk/partition or OS-deployment PBQ | **STILL ZERO.** Nearest miss: u/TossinPoland speculates about `diskpart` switches *while asking a question* — that is a hypothetical, not a sitting. Not counted. | 0 |
| 7 | Certificate / browser-warning PBQ | **STILL ZERO.** No mention in ~55 unique posts. | 0 |
| 8 | Malware-removal ORDERING PBQ | **ABSENCE CONFIRMED (+1 corroboration).** u/Loose_Client5116 (Core 2, May 10 '26) describes sequencing appearing as **MCQs, not PBQs**: *"a lot of it was dry questions, ie: 'what do you do NEXT:' and 'what's the first step you take?'"*. Parallel pattern from u/Pitch-Curious (A+ flair, Mar 16 '26) for commands: *"I just got a multiple choice… Nothing in PBQs."* | absence holds |
| 9 | PBQ count/structure per form | **REFINED.** Range **4–7 holds**; sample now ~10 sittings; **mode is now a 4/5 tie**, not a clean 5. See table below. | +2 count-only sittings |

**Claim 9 — 1202-era PBQ counts (type b, count-only):**

| User | Date | Exam basis | Questions | PBQs |
|------|------|-----------|-----------|------|
| u/NeatMycologist2064 | Jul 19 '25 | Core 2 (808) | — | ~4 |
| u/ZeroxHD | Aug 20 '25 | Core 2 | 77 | 4 |
| u/armbarassassin84 | Oct 19 '25 | **1202 stated** | — | 4 |
| u/sharkt0pus | Nov 08 '25 | Core 2 **1202 stated** | 75 | 4 |
| u/jonnyfuel | Jan 19 '26 | Core 2 | 75 | 6 |
| u/Jayy-Kayy | Apr 08 '26 | **1202 stated** | 75 | 5 |
| u/BlueWingsSoar | May 07 '26 | Core 2 | — | 5 |
| u/Loose_Client5116 | May 10 '26 | Core 2 | — | 7 |

Structure is stable at **75–77 questions**. `armbarassassin84` also notes *"people were posting how easy it was and only had 3 pbq"* — hearsay, a 3-PBQ form is **not** confirmed.

---

## 4. Topic-only (type b) — Kept Separate, NOT Format Evidence

- u/Klutzy-Astronaut-280 (1202, May 29 '26): "a few AI-related questions", "2 scenario-based questions" — topic, no exhibit shape.
- u/Loose_Client5116 (Core 2, May 10 '26): malware/spyware removal ordering, delivered as MCQ.
- u/PureFan673 (1202, Sep 06 '25): 77 questions, *"The PBQ's we're easy"* — no format, no count.
- u/magson1987 (Core 2, Mar 28 '26): *"found the PBQ's pretty straight forward"* — no format.
- u/Offensive_Stonks1 (1202, Nov 20 '25): *"PBQs weren't too bad and were manageable"* — no format.
- u/visualsarcasm (Core 2, ~Jul 5 '26): Windows/Linux commands *"ofc my exam didn't have much of that"* — negative topic signal.
- ~20 further "I Passed Core 2" posts (Jun–Jul '26) with **zero PBQ detail of any kind**.

---

## 5. Dedup Log

- **u/FRESH__LUMPIA** — supplies Format C **and** Format D. **ONE person, ONE sitting.** Counted as **1 sitting**, not 2. This is the baseline's original inflation error and it is preserved as corrected here.
- **u/redgroupclan** (Trifecta, ~Jun 20 '26) — the vivid *"first PBQ I got, I swear was glitched… the commands I was allowed to use weren't the kind that change anything"* sits **inside the Network+/subnetting paragraph**. This is a **Network+** PBQ, not Core 2. **EXCLUDED.** (Tempting false positive — it describes a constrained-command terminal, which would have looked like Format A corroboration.)
- **u/TossinPoland** — appears as both OP (asking) and commenter (*"i had to do some in the first test"* = **Core 1/1201**). Not a Core 2 sitting. **EXCLUDED.**
- **u/jonnyfuel** — two posts (Core 1 Jan 05, Core 2 Jan 19). Only the Core 2 post counted, count-only.
- **u/armbarassassin84**, **u/Klutzy-Astronaut-280**, **u/Composer1028** — each appeared in 2–3 search passes; deduped to one record.
- **u/shaggs31**, **u/drushtx**, **u/Pitch-Curious** — none counted as sittings (see §2).

---

## 6. Prior-Generation (220-1102) — Flagged, NEVER Counted

**None found with PBQ format detail this pass.** The searches skewed 2025-07→2026-07, which post-dates the
1102 retirement (2025-09-25) for nearly all hits. Pre-retirement hits (Jul–Sep '25) that mention Core 2
(NeatMycologist2064, ZeroxHD, PureFan673, Composer1028) all reference **1202 explicitly or by context** —
1202 launched 2025-03-25, so these are same-generation. **No 1102 contamination detected.**
Cross-generation risk in this pass is therefore **low** — but see §7 for the real risk, which is different.

---

## 7. Honest Statement of Remaining Sample Bias

1. **The dominant bias is survivorship-of-detail, not generation.** r/CompTIA's Core 2 culture is *"I passed! 🎉"* + a study-resource list. Of ~55 unique posts triaged, **fewer than 5 describe any PBQ exhibit at all.** The community's own NDA-caution (u/Delmarnam888: *"I was thinking of sharing my summary on what the 6 PBQs were but I'm not sure if that counts as oversharing"*) actively suppresses exactly the evidence we need. This is a **structural ceiling**, not a search failure.
2. **Single-source dependence is barely relieved.** Format C and D still rest entirely on u/FRESH__LUMPIA. One person's one sitting still supplies 2 of the 4 named formats.
3. **Format A's second sitting is inferred, not attested.** u/Mental_Tea_4084 never says "1202". Medium confidence.
4. **Direct contradiction is unresolved.** u/shaggs31 reports dropdown-select rather than typed commands. Either forms vary, or he's describing a different exam. Unknown.
5. **Mirror-monoculture.** One Redlib instance, one subreddit. No Discord, no CompTIA forums, no YouTube comments. Regional distribution unknown for every source (none stated region).
6. **Search-engine artifact.** Redlib relevance search dilutes badly on multi-word format queries (returns generic "I passed" posts). Two precise queries returned literal zero — which is informative, but I cannot distinguish "nobody said this" from "Redlib's index can't match this phrasing." Treat STILL-ZERO as *"unevidenced,"* not *"proven absent."*

---

## 8. VERDICT — Does the Core 2 Ranked List Change?

**YES — but modestly, and the change is a reordering, not an expansion.**

**The ranked list changes at the top.** The command-line/terminal `help`-enumerating PBQ moves from
*"1 sitting, tied on evidence"* to **2 independent sittings + independent instructor corroboration**, and is now
the **clear #1 best-evidenced 220-1202 PBQ format by a decisive margin.** It should be ranked first and
built first, with the sandbox modeled as a **small fixed command set (~4 commands) discoverable via `help`** —
that specific design detail is newly supported by u/drushtx.

**Everything below #1 is unchanged and should be explicitly demoted in confidence.** Quarantine/service-toggles
and ticket-queue triage each still rest on **one person's single sitting** — and after a deliberate, targeted
hunt (including an all-time zero-result search for ticket-queue), that is now a **tested and confirmed** weakness
rather than an untested assumption. That is a real epistemic upgrade even though the count didn't move.

**Formats 4–7 (Windows settings, permissions, disk/partition, certificate) remain STILL-ZERO** and must not be
presented as evidenced. **Claim 8's absence is confirmed** with a fresh corroborating sitting.

**Net: 2 → 3 independent format-reporting sittings. Core 2 is still thin.** The high-yield method was applied in
full and it worked — it just found that the well is genuinely shallow, because r/CompTIA's Core 2 posters
overwhelmingly do not describe their PBQs. **A confirmed "still thin" is the honest headline of this pass.**
