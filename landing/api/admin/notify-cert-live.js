// "Mark live & tell them": emails everyone who asked for an exam, once, when its pack is added. POST { exam_key, label,
// after? } with the admin's Supabase access token. The caller is verified here (token checked by Supabase, role read from
// profiles), never trusted from the client. The label the admin confirmed must equal the tally view's label for that
// exam_key (409 otherwise), so the email can only carry text the admin saw. Requesters with notified_at null are handled
// in small batches (at most 20 people or about 15 seconds per call). Each person gets their OWN email (never a shared
// recipient list), and notified_at is stamped per row only after that row's send succeeded. `after` is the cursor from the
// last reply: rows are walked in id order, so people who could not be reached do not trap the caller in a loop. The reply
// is { sent, failed, skipped, remaining, next, paused }; the admin page keeps calling while remaining > 0 and not paused.
// A Resend 429 stops the batch early without marking anyone failed (paused: true), leaving the rest unstamped.
// Env: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY (SUPABASE_URL, NOTIFY_FROM_EMAIL optional). Missing one answers 503.
import { missingEnv, unconfigured, jsonResponse, esc, cleanLabel, supabaseUrl, svcHeaders, requireAdmin, sendMail } from '../_lib/admin-mail.js';
import { logServerError } from '../_lib/log-server-error.js';

export const config = { runtime: 'edge' };

const APP_URL = 'https://certanvil.com';
// Mutable so tests can run fast; production values are the defaults.
export const _tuning = { batch: 20, budgetMs: 15000, gapMs: 500 };

function allowedOrigin(origin) {
  return !!origin && (/^https:\/\/([a-z0-9-]+\.)?certanvil\.com$/.test(origin) || origin === 'http://localhost:3140');
}
function cors(req) {
  const h = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', Vary: 'Origin' };
  const origin = req.headers.get('origin');
  if (allowedOrigin(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

// Server-side check: already normalised (lowercase, trimmed), 1 to 80 characters. Mirrors the table's CHECK constraints.
export function validExamKey(k) {
  return typeof k === 'string' && k.length >= 1 && k.length <= 80 && k === k.toLowerCase().trim();
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function buildEmail(label) {
  const l = cleanLabel(label) || 'Your exam';
  return {
    subject: l + ' is now on CertAnvil',
    html: '<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#2a2622">'
      + '<p>You asked for <b>' + esc(l) + '</b>. It is now on CertAnvil.</p>'
      + '<p><a href="' + APP_URL + '">Open CertAnvil</a> and add it from your certs.</p></div>',
    text: 'You asked for ' + l + '. It is now on CertAnvil.\n\nOpen CertAnvil and add it from your certs: ' + APP_URL + '\n'
  };
}

export default async function handler(req) {
  const h = cors(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, h);
  const missing = missingEnv(['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']);
  if (missing.length) return unconfigured(missing, 'notify-cert-live', h);

  const admin = await requireAdmin(req);
  if (!admin.ok) return jsonResponse({ error: admin.error }, admin.status, h);

  let body = null;
  try { body = await req.json(); } catch (_) { body = null; }
  const examKey = body && body.exam_key;
  if (!validExamKey(examKey)) return jsonResponse({ error: 'invalid-exam-key' }, 400, h);
  if (typeof body.label !== 'string' || !body.label) return jsonResponse({ error: 'invalid-label' }, 400, h);
  const after = body.after == null || body.after === '' ? '' : String(body.after);
  if (after && !UUID.test(after)) return jsonResponse({ error: 'invalid-cursor' }, 400, h);

  // The label must be exactly the one the tally shows for this exam: the admin confirmed that text.
  const tr = await fetch(supabaseUrl() + '/rest/v1/cert_request_tally?select=label&exam_key=eq.' + encodeURIComponent(examKey), { headers: svcHeaders() }).catch(function () { return null; });
  if (!tr || tr.status !== 200) return jsonResponse({ error: 'tally-read-failed' }, 502, h);
  const trows = await tr.json().catch(function () { return null; });
  if (!Array.isArray(trows)) return jsonResponse({ error: 'tally-read-failed' }, 502, h);
  if (!trows.length) return jsonResponse({ error: 'unknown-exam' }, 404, h);
  if (trows[0].label !== body.label) return jsonResponse({ error: 'label-mismatch' }, 409, h);

  const q = await fetch(supabaseUrl() + '/rest/v1/cert_requests?select=id,user_id&notified_at=is.null&exam_key=eq.' + encodeURIComponent(examKey)
    + (after ? '&id=gt.' + after : '') + '&order=id.asc&limit=' + _tuning.batch,
    { headers: svcHeaders({ Prefer: 'count=exact' }) }).catch(function () { return null; });
  if (!q || (q.status !== 200 && q.status !== 206)) return jsonResponse({ error: 'requests-read-failed' }, 502, h);
  const rows = await q.json().catch(function () { return null; });
  if (!Array.isArray(rows)) return jsonResponse({ error: 'requests-read-failed' }, 502, h);
  const totalMatch = /\/(\d+)$/.exec(q.headers.get('content-range') || '');
  const total = totalMatch ? Number(totalMatch[1]) : rows.length;

  const mail = buildEmail(body.label);
  const started = Date.now();
  // Look everyone up at once (reads are cheap); the sends below go one at a time because Resend rate-limits bursts.
  const lookups = await Promise.all(rows.map(function (row) {
    return fetch(supabaseUrl() + '/auth/v1/admin/users/' + encodeURIComponent(row.user_id), { headers: svcHeaders() })
      .then(async function (ur) {
        if (ur.status === 404) return { skip: true };
        if (ur.status !== 200) return { fail: true };
        const u = await ur.json().catch(function () { return null; });
        const email = u && typeof u.email === 'string' ? u.email.trim() : '';
        return email && email.indexOf('@') > 0 ? { email } : { skip: true };
      }).catch(function () { return { fail: true }; });
  }));

  let sent = 0, failed = 0, skipped = 0, processed = 0, next = after, paused = false, lastSend = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i], lk = lookups[i];
    if (i > 0 && Date.now() - started > _tuning.budgetMs) break;   // out of time: the rest wait for the next call
    if (lk.skip) { skipped++; processed++; next = row.id; continue; }
    if (lk.fail) { failed++; processed++; next = row.id; continue; }
    if (_tuning.gapMs && lastSend) { const wait = _tuning.gapMs - (Date.now() - lastSend); if (wait > 0) await sleep(wait); }
    const res = await sendMail({ to: [lk.email], subject: mail.subject, html: mail.html, text: mail.text, idempotencyKey: 'cert-live-' + row.id });
    lastSend = Date.now();
    if (res.status === 429) { paused = true; break; }              // rate limited: not a failure, leave it unstamped
    processed++; next = row.id;
    if (!res.ok) { failed++; continue; }
    // notified_at is null guard: a concurrent second click cannot restamp.
    const st = await fetch(supabaseUrl() + '/rest/v1/cert_requests?id=eq.' + encodeURIComponent(row.id) + '&notified_at=is.null',
      { method: 'PATCH', headers: svcHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }), body: JSON.stringify({ notified_at: new Date().toISOString() }) }).catch(function () { return null; });
    if (!st || !st.ok) await logServerError({ endpoint: 'notify-cert-live', status: 502, message: 'notify-cert-live: sent but stamp failed for a request' });
    sent++;
  }
  const remaining = Math.max(0, total - processed);

  // Audit trail (admin_audit_log, Phase 5): who told whom about what. Fail-soft: an audit hiccup never hides a send.
  await fetch(supabaseUrl() + '/rest/v1/admin_audit_log', {
    method: 'POST', headers: svcHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify({ actor_id: admin.user.id, action: 'cert_live_notify', target_table: 'cert_requests', target_op: 'UPDATE', target_id: examKey, new_data: { sent, failed, skipped, remaining } })
  }).catch(function () {});

  return jsonResponse({ sent, failed, skipped, remaining, next, paused }, 200, h);
}
