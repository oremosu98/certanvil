---
up: "[[Mobile MOC]]"
type: spec
status: draft
cert: all
updated: 2026-10-31
tags: [spec, mobile]
---
# Admin in the app, and a full bug-report loop

The founder studies in the app like any user and is also the only admin. Today admin lives only on
certanvil.com/admin, a desktop page. The founder agreed this design on 31 Oct. It has three parts:
reporting a problem from a phone, an Admin screen in the app, and telling the person when their
problem is fixed.

## The problems
- Admin needs a laptop. Nothing in the app shows how the app is doing, what people asked for, or what
  broke.
- **Phones can't report a problem.** The "Report an issue" button is in the desktop top bar only; the
  phone layout hides it, so the iOS app and mobile web have no way in. Errors are logged automatically
  (`client_errors`), but nobody can tell us what went wrong in their own words.
- Nobody hears back. A report goes into a table and the person never learns it was fixed.
- The admin account is Pro, so the founder never sees what a Free user sees.

## The design

### 1. Report a problem (phones)
- **Entry points:** a "Report a problem" row in Settings, and a "Something wrong? Tell us" link on
  screens that show a failure (a quiz that can't load, a failed sync, the busy message).
- **The form:** "What happened?" (required) and "Steps, if you remember them" (optional). The app
  attaches the version, screen, cert, theme and device, as the desktop form already does.
- **Who hears back:** signed in, the form says "We'll email you when it's fixed." Signed out, it says
  "Sign in if you'd like to hear back."
- **After sending:** "Thanks, got it. Report #142." The number is the report's row number.
- **Offline:** it is queued and sent later (the existing retry queue), with "Saved. We'll send it when
  you're back online."
- Desktop keeps its top-bar button and drawer; it gains the same "Thanks, got it. Report #N" line.

### 2. The Admin screen
- **Entry:** an "Admin" row in My certs → More, next to Settings and Account, only when the signed-in
  profile has `role = 'admin'`. A small count shows open bug reports. Hidden for everyone else; the
  database refuses non-admins anyway (row-level security), so hiding the row is tidiness, not security.
- **Sections, top to bottom:**
  1. **Today:** Users (with "+N this week"), Active this week (profile updated in the last 7 days, the
     web dashboard's rule), AI used today ("212 of 614" with a bar; the `global:daily` counter against
     the app's daily limit), Errors today.
  2. **Cert requests:** by votes, then most recent. Tapping one opens "Tell them it's live", confirmed
     in place, using the existing `notify-cert-live` endpoint and its 20-people-per-call loop.
  3. **Bug reports:** open reports, newest first. A report shows its title, what happened, the steps,
     version, screen, device, and whether the person can be emailed. Two actions:
     - **Fixed, tell them** (only when the reporter was signed in): sends the fixed email (below) and
       closes the report.
     - **Close quietly:** closes it with no email (duplicate, not a bug, or anonymous).
  4. **Errors:** the five most frequent error messages in the last 7 days, each with its count and the
     newest version it was seen on. Read only.
  5. **Preview as Free:** a switch. On, the app shows exactly what a Free user sees: locks, the
     15-a-day counter and upgrade prompts. Studying is never blocked; the server still treats the
     account as Pro. A thin bar, "Previewing as Free · Switch back", sits at the top of every screen
     while it's on. It lives on this device only and survives a restart.
  6. **Full dashboard on certanvil.com:** a link for the users table, cert packs and recent ships.
- Each section loads on its own. A failed section says "Couldn't load this. Retry." and the others
  still show. Offline: "You're offline. Admin needs a connection." with Retry.

### 3. Telling people it's fixed
- **The email** (from CertAnvil, Resend, one recipient per send):
  Subject: "Fixed: the problem you reported"
  Body: "You told us about '{title}'. It's fixed in the latest version of CertAnvil, so the next time you
  open it you'll have the fix. Thanks for taking the time to report it."
- Sent once per report (an idempotency key and a stamp on the report); a second tap does nothing.
- Only for reports from signed-in people. Errors never trigger an email; people don't know they were
  recorded.
- **Monday email:** the existing Monday cert-requests email gains two short sections: open bug reports
  (count and the three newest titles) and the three most frequent errors this week.

## Data
- One migration (gated lane), `user_bug_reports`:
  - a `fixed_notified_at timestamptz` column, stamped when the fixed email is sent;
  - admins may UPDATE `status` only (a column-level grant plus an `is_admin()` policy), so "Close
    quietly" is a direct update and nothing else on a report can be changed from a client.
  - a tested ROLLBACK line and rows in `scripts/sql/migration-audit.sql`.
- A new endpoint on the landing project, `api/admin/bug-fixed` (POST, admin checked on the server like
  `notify-cert-live`): reads the reporter's email with the service role, sends the email, sets
  `status = 'closed'` and `fixed_notified_at`, writes an `admin_audit_log` row. Missing settings answer
  503; a report that is anonymous, already closed or already notified answers 409.
- Everything else the screen reads is already admin-readable: `profiles`, `user_bug_reports`,
  `client_errors`, `cert_request_tally`, `ai_proxy_rate_limit`. The report's number is its `id`, so
  the reporting form must read it back after the insert.

## Cross-platform
- **iOS app and mobile web:** the phone report form, the Admin screen and Preview as Free.
- **Desktop:** keeps its top-bar report button (plus the new "Report #N" line) and the account-menu link
  to the web dashboard. No desktop Admin screen; the web dashboard is the desktop one.
- **iOS specifics:** requests can be cut off when the app goes to the background, so every admin action
  shows its result only after the server answers, and the report queue covers sending. Touch targets at
  least 44pt, safe-area insets, no hover.
- **Accessibility:** the Free bar is announced once when turned on, and Admin sections are labelled
  regions.

## Out of scope
- Replying to a report in free text, or chatting with the reporter.
- Changing users, roles or cert packs from the phone (the web dashboard keeps those).
- An instant email to the founder for each new report (the founder chose the Monday summary instead).
- Server-enforced Free limits while previewing.

## Process
Draw the Admin screen, the phone report form, the "Report #N" confirmation and the Free bar into the
June E2E, run the five-stage visual pass, get founder approval, then plan and build on the gated lane.

## Rejected approaches
- **Open certanvil.com/admin inside the app:** a desktop table on a phone, and the iOS app would need its
  own sign-in for it.
- **A separate admin app:** too much for one admin.
- **A fifth "Admin" tab:** the founder's app would stop looking like a student's.
- **Admin inside the Account tab:** buried two taps deep.
- **Truly Free preview (server caps at 15):** it could lock the founder out of their own studying and
  touches the quota code.
- **Read-only reports:** the open list would never shrink.
- **Reply in free text from the app:** biggest build (wording, privacy, threading) for little gain at
  this size.
- **Instant email per new report:** declined by the founder in favour of the Monday summary.

## Related
[[ADR-002-rbac-admin-surface]] · [[2026-10-30-ai-budget-fast-start-suggest-design]] · [[2026-10-30-my-certs-hub-design]] · [[Mobile MOC]]
