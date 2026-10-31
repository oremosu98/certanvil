---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-31
tags: [spec, mobile]
---
# Admin in the app, and a full bug-report loop

The founder studies in the app like any user and is also the only admin. Today admin lives only on
certanvil.com/admin, a desktop page. The founder agreed this design and approved the spec on 31 Oct. It has three parts:
reporting a problem from a phone, an Admin screen in the app, and telling the person when their
problem is fixed.

## The problems
- Admin needs a laptop. Nothing in the app shows how the app is doing, what people asked for, or what
  broke.
- **Phones can't report a problem.** The "Report an issue" button is in the desktop top bar only; the
  phone layout hides it, so the iOS app and mobile web have no way in. Errors are logged automatically
  (`client_errors`), but nobody can tell us what went wrong in their own words.
- Nobody hears back. A report goes into a table and the person never learns it was fixed.
- **Anyone can overwrite open reports** (found in the spec review, confirmed in PGlite on 31 Oct). The
  retry policy `user_bug_reports_update_own_open` lets anon and authenticated UPDATE any row whose
  status is 'open', so one bare `update ... set title = 'x'` rewrites every open report. Nobody can
  read reports, so nothing leaks, but reports can be wiped. This build closes it.
- The admin account is Pro, so the founder never sees what a Free user sees.

## The design

### 1. Report a problem (phones)
- **Entry points:** a "Report a problem" row in Settings, and a "Something wrong? Tell us" link on
  screens that show a failure (a quiz that can't load, a failed sync, the busy message).
- **The form:** "What happened?" (required) and "Steps, if you remember them" (optional). The app
  attaches the version, screen, cert, theme and device, as the desktop form already does.
- **Who hears back:** signed in, the form says "We'll email you when it's fixed." Signed out, it says
  "Sign in if you'd like to hear back."
- **After sending:** "Thanks, got it. Report #142." The number is the report's row number, returned by
  the new `submit_bug_report` RPC (below).
- **Offline:** it is queued and sent later (the existing retry queue), with "Saved. We'll send it when
  you're back online." A report that lands later from the queue shows no number; nothing is on screen
  for it by then.
- **One form, one queue:** the phone form reuses `features/reports.js` (its payload builder, submit and
  retry queue); only the sheet is new. Desktop keeps its top-bar button and drawer and gains the same
  "Thanks, got it. Report #N" line.
- **Who wrote it:** the queued payload keeps the signed-in user id from when the report was written.
  If a different person (or nobody) is signed in when it finally sends, the report is saved without a
  user id, so it can never email the wrong person.

### 2. The Admin screen
- **Entry:** an "Admin" row in My certs → More, next to Settings and Account, only when the signed-in
  profile has `role = 'admin'` (auth-state already loads the role; it sets `window._certanvilIsAdmin`
  for the hub). A small count shows open bug reports, fetched when the hub opens. "Open" means status
  `open` or `triaged` everywhere in this spec; nothing in the app sets `triaged`. Hidden for everyone else; the
  database refuses non-admins anyway (row-level security), so hiding the row is tidiness, not security.
- **Sections, top to bottom:**
  1. **Today:** Users (with "+N this week"), Active this week (profile updated in the last 7 days, the
     web dashboard's rule), AI used today ("212 of 614" with a bar), Errors today. AI comes from a new
     admin-only `GET /api/ai/usage` on the app project, which returns today's `global:daily` count (0
     when its window started before today) and the limit the server actually uses, so an
     `AI_GLOBAL_DAILY_LIMIT` override shows correctly.
  2. **Cert requests:** by votes, then most recent. Tapping one opens "Tell them it's live", confirmed
     in place, using the existing `notify-cert-live` endpoint and its 20-people-per-call loop.
  3. **Bug reports:** open reports, newest first. A report shows its title, what happened, the steps,
     version, screen, device, and whether the person can be emailed. Two actions:
     - **Fixed, tell them** (only when the reporter was signed in): sends the fixed email (below) and
       closes the report.
     - **Close quietly:** closes it with no email (duplicate, not a bug, or anonymous).
  4. **Errors:** the five most frequent error messages in the last 7 days, each with its count and the
     newest version it was seen on. Read only. Counted on the phone from the newest 500 rows; if there
     were more, the section says 'Based on the latest 500 errors.'
  5. **Preview as Free:** a switch. On, the app shows exactly what a Free user sees: locks, the
     15-a-day counter and upgrade prompts. A thin bar, "Previewing as Free · Switch back", sits at the
     top of every screen while it's on. It lives on this device only and survives a restart.
     - **One switch point.** The app decides Pro in two places: where `_quotaState` is set
       (`_refreshQuotaChip`) and auth-state's "admin counts as Pro". While previewing, both report Free
       with a daily limit of 15, so every screen that reads them (Home, hub, Drills, Sim Lab, Settings,
       reminders, the PBQ and Gauntlet caps) behaves as Free with no per-screen changes.
     - **The counter** shows questions answered today on this device, from history, because the server
       doesn't count for a Pro account.
     - **The one exception:** reaching 15 shows the Free "today's 15 are done" screen, with an extra
       "Keep going (admin preview)" link, so studying is never blocked. Pro-only features stay locked
       while previewing; switching back unlocks them.
     - The Free limit is 15 on the server too (`20260611_free_tier_15_questions`, audited ok 31 Oct).
  6. **Full dashboard on certanvil.com:** a link for the users table, cert packs and recent ships.
- Each section loads on its own. A failed section says "Couldn't load this. Retry." and the others
  still show. Offline: "You're offline. Admin needs a connection." with Retry.

### 3. Telling people it's fixed
- **The email** (from CertAnvil, Resend, one recipient per send):
  Subject: "Fixed: the problem you reported"
  Body: "You told us about '{title}'. It's fixed in the latest version of CertAnvil, so the next time you
  open it you'll have the fix. Thanks for taking the time to report it."
- Sent once per report. The endpoint stamps `fixed_notified_at` only if it is empty, then sends with a
  Resend idempotency key; if the send fails it clears the stamp so a retry works. A second tap gets
  409.
- Only for reports from signed-in people. Errors never trigger an email; people don't know they were
  recorded.
- **Monday email:** the existing Monday cert-requests email gains two short sections: open bug reports
  (count and the three newest titles) and the three most frequent errors this week (two more
  service-role reads). The "0 new" week still sends, and still lists open reports and errors.

## Data
- One migration (gated lane), on `user_bug_reports`:
  - **drop `user_bug_reports_update_own_open`** and revoke UPDATE from anon and authenticated. No
    client can change a report after it is sent.
  - **`submit_bug_report(p_report_id, p_title, p_description, p_steps, p_body, p_context, p_user_id)`**,
    SECURITY DEFINER, executable by anon and authenticated: inserts, or does nothing if that
    `report_id` already exists (so queue retries stay idempotent without UPDATE), and returns the
    row's `id`. `user_id` is stored only when `p_user_id = auth.uid()`; otherwise NULL. Same length
    limits as the table.
  - a `fixed_notified_at timestamptz` column.
  - a tested ROLLBACK block (restores the old policy, drops the function and column) and rows in
    `scripts/sql/migration-audit.sql`. Tested in PGlite like the deletion and cert-request migrations,
    including that anon can no longer overwrite a report.
- A new endpoint on the landing project, `api/admin/bug-report` (POST, Edge, admin checked on the
  server like `notify-cert-live`), with `action` `fixed` or `close`:
  - `close` sets `status = 'closed'`.
  - `fixed` gets the reporter's email from the auth admin API by `user_id`, sends the email, and sets
    `status = 'closed'` and `fixed_notified_at`.
  - Both write an `admin_audit_log` row (`target_op` 'UPDATE', new_data = the status and stamp).
  - Answers: 503 when settings are missing; 409 in this order: already closed, anonymous (for
    `fixed`), already notified; 404 for an unknown id.
- Everything else the screen reads is already admin-readable: `profiles`, `user_bug_reports`,
  `client_errors`, `cert_request_tally`.

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
