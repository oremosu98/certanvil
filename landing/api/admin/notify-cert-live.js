// "Mark live & tell them": emails everyone who asked for an exam, once, when its pack is added. POST { exam_key }
// with the admin's Supabase access token. The caller is verified here (token checked by Supabase, role read from
// profiles), never trusted from the client. Requesters with notified_at null are looked up one by one in the auth
// admin API, each gets their OWN email (never a shared To/CC), and notified_at is stamped per row only after that
// row's send succeeded. A retry therefore skips everyone already told. Returns { sent, failed, skipped }.
// Env: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY (SUPABASE_URL, NOTIFY_FROM_EMAIL optional). Missing one answers 503.
import { missingEnv, unconfigured, jsonResponse, esc, supabaseUrl, svcHeaders, requireAdmin, sendMail } from '../_lib/admin-mail.js';
import { logServerError } from '../_lib/log-server-error.js';

export const config = { runtime: 'edge' };

const APP_URL = 'https://certanvil.com';

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

export function buildEmail(label) {
  const l = String(label || 'Your exam');
  return {
    subject: l + ' is now on CertAnvil',
    html: '<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#2a2622">'
      + '<p>You asked for <b>' + esc(l) + '</b>. It is now on CertAnvil.</p>'
      + '<p><a href="' + APP_URL + '">Open CertAnvil</a> and add it from your certs.</p></div>',
    text: 'You asked for ' + l + '. It is now on CertAnvil.\n\nOpen CertAnvil and add it from your certs: ' + APP_URL + '\n'
  };
}

// Most common label among the rows (the tally view's own rule).
function commonLabel(rows) {
  const c = {};
  let best = '', n = 0;
  rows.forEach(function (r) { const l = String(r.label || ''); c[l] = (c[l] || 0) + 1; if (c[l] > n) { n = c[l]; best = l; } });
  return best;
}

export default async function handler(req) {
  const h = cors(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, h);
  const missing = missingEnv(['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']);
  if (missing.length) return jsonResponse({ error: 'not-configured', missing }, 503, h);

  const admin = await requireAdmin(req);
  if (!admin.ok) return jsonResponse({ error: admin.error }, admin.status, h);

  let body = null;
  try { body = await req.json(); } catch (_) { body = null; }
  const examKey = body && body.exam_key;
  if (!validExamKey(examKey)) return jsonResponse({ error: 'invalid-exam-key' }, 400, h);

  const q = await fetch(supabaseUrl() + '/rest/v1/cert_requests?select=id,user_id,label&notified_at=is.null&exam_key=eq.' + encodeURIComponent(examKey) + '&order=created_at.asc',
    { headers: svcHeaders() }).catch(function () { return null; });
  if (!q || q.status !== 200) return jsonResponse({ error: 'requests-read-failed' }, 502, h);
  const rows = await q.json().catch(function () { return null; });
  if (!Array.isArray(rows)) return jsonResponse({ error: 'requests-read-failed' }, 502, h);

  const mail = buildEmail(commonLabel(rows));
  let sent = 0, failed = 0, skipped = 0;
  // One at a time: Resend rate-limits bursts, and each row is stamped as soon as its own email is out.
  for (const row of rows) {
    const ur = await fetch(supabaseUrl() + '/auth/v1/admin/users/' + encodeURIComponent(row.user_id), { headers: svcHeaders() }).catch(function () { return null; });
    if (!ur) { failed++; continue; }
    if (ur.status === 404) { skipped++; continue; }
    if (ur.status !== 200) { failed++; continue; }
    const u = await ur.json().catch(function () { return null; });
    const email = u && typeof u.email === 'string' ? u.email.trim() : '';
    if (!email || email.indexOf('@') < 1) { skipped++; continue; }

    const ok = await sendMail({ to: [email], subject: mail.subject, html: mail.html, text: mail.text, idempotencyKey: 'cert-live-' + row.id });
    if (!ok) { failed++; continue; }
    // notified_at is null guard: a concurrent second click cannot restamp.
    const st = await fetch(supabaseUrl() + '/rest/v1/cert_requests?id=eq.' + encodeURIComponent(row.id) + '&notified_at=is.null',
      { method: 'PATCH', headers: svcHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }), body: JSON.stringify({ notified_at: new Date().toISOString() }) }).catch(function () { return null; });
    if (!st || !st.ok) {
      await logServerError({ endpoint: 'notify-cert-live', status: 502, message: 'notify-cert-live: sent but stamp failed for a request' });
    }
    sent++;
  }
  return jsonResponse({ sent, failed, skipped }, 200, h);
}
