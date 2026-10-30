---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# My certs: the hub, built from the June drawing

From [[2026-10-30-persona-cert-stacker-gaps]] gap 8, phase 1. The founder approved it on 30 Oct with
six tweaks to the June hub and a folded Free view. It ships in the bundle.

## The design
The hub opens when you tap the cert name on Home. It follows `mockups/cert-ios-hub.html` in the June
E2E, with these changes:
1. **Studying, Passed, Not started** replace June's single "In progress" list. Not started means a cert
   with no practice yet. It gets a quiet "Start" row.
2. **Studying rows show readiness and the exam:** "684 / 900" on the right, and "Exam in 18 days" or
   "No date" under the name.
3. **Studying is sorted nearest exam first.** Certs with no date come last.
4. **Passed rows say "Scored 767"** from the logged result, or "No score logged".
5. **The top stats:** "Next exam: 18 days" replaces "8 certs". Passed and the streak stay.
6. **Old readiness says so:** "last studied 3 weeks ago" when the snapshot is more than 14 days old.
7. **Free:** one "Other certs" section with a single row, "Unlock every cert with Pro", listing the
   first three cert names "and more" (no count, so it doesn't go stale as certs are added). Tapping it
   opens the Pro sheet.

## Data
- Readiness comes from the per-cert snapshots, which already sync across certs.
- **Exam date per cert:** today the account stores one exam date, so certs overwrite each other.
  Exam dates become per cert, as do exam results ([[2026-10-30-exam-outcome-design]]). This touches
  the account-sync code, which is a protected area, so the whole bundle ships the careful way: a
  branch, a test copy of the site and database, then merge.
- An existing single exam date is kept as the date for the cert it was set on.

## Rejected approaches
- **June's "In progress" listing every cert as Active:** it lists certs never opened.
- **A count in the Free row ("all 7"):** goes stale as certs are added.
- **The full cross-cert overlap view (June phase 2):** later.

## Related
[[2026-10-30-persona-cert-stacker-gaps]] · [[2026-10-30-exam-outcome-design]] · [[Mobile MOC]]
