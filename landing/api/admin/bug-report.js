// Admin bug-report actions: POST { action: 'close'|'fixed', ids: number[] (1..200), after? } with the admin's Supabase
// access token (verified server-side, never trusted from the client). 'close' closes open/triaged reports. 'fixed' emails
// each signed-in reporter once ("it's fixed") and then closes the report. Ids are walked in ascending order, at most 20
// rows or about 15 seconds per call; the reply is { closed, sent, skipped, failed, remaining, next, paused } and the
// caller keeps calling with after = next while remaining > 0 and not paused. Double-send guard: the row is claimed with
// fixed_notified_at (PATCH ... fixed_notified_at=is.null) before sending, the stamp is cleared again if the send fails,
// and Resend gets an idempotency key per report. A Resend 429 stops the batch (paused: true) and releases that claim.
// Env: SUPABASE_SERVICE_ROLE_KEY, plus RESEND_API_KEY for 'fixed'. Missing one answers 503.
import { missingEnv, unconfigured, jsonResponse, esc, cleanLabel, supabaseUrl, svcHeaders, requireAdmin, sendMail } from '../_lib/admin-mail.js';

export const config = { runtime: 'edge' };

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const JSONH = { 'Content-Type': 'application/json' };

export function buildFixedEmail(title) {
  let t = cleanLabel(title) || 'your report';
  const chars = Array.from(t);
  if (chars.length > 50) t = chars.slice(0, 50).join('') + '…';
  return {
    subject: 'Fixed: ' + t,
    html: '<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#2a2622">'
      + '<p>You reported \'' + esc(t) + '\'. It\'s fixed. Open CertAnvil and you\'ll have it. Thanks for telling us.</p>'
      + '<p>CertAnvil</p></div>',
    text: 'You reported \'' + t + '\'. It\'s fixed. Open CertAnvil and you\'ll have it. Thanks for telling us.\n\nCertAnvil\n'
  };
}

export default async function handler(req) {
  const h = cors(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, h);

  let body = null;
  try { body = await req.json(); } catch (_) { body = null; }
  const action = body && body.action;
  const need = action === 'fixed' ? ['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY'] : ['SUPABASE_SERVICE_ROLE_KEY'];
  const missing = missingEnv(need);
  if (missing.length) return unconfigured(missing, 'bug-report', h);

  const admin = await requireAdmin(req);
  if (!admin.ok) return jsonResponse({ error: admin.error }, admin.status, h);

  if (action !== 'close' && action !== 'fixed') return jsonResponse({ error: 'invalid-action' }, 400, h);
  const ids = body.ids;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 200 || !ids.every((i) => Number.isSafeInteger(i) && i > 0)) return jsonResponse({ error: 'invalid-ids' }, 400, h);
  const after = body.after == null || body.after === '' ? 0 : body.after;
  if (!Number.isSafeInteger(after) || after < 0) return jsonResponse({ error: 'invalid-cursor' }, 400, h);
  const idList = Array.from(new Set(ids)).sort((a, b) => a - b);

  const q = await fetch(supabaseUrl() + '/rest/v1/user_bug_reports?select=id,title,status,user_id,fixed_notified_at&id=in.(' + idList.join(',') + ')'
    + (after ? '&id=gt.' + after : '') + '&order=id.asc&limit=' + _tuning.batch,
    { headers: svcHeaders({ Prefer: 'count=exact' }) }).catch(function () { return null; });
  if (!q || (q.status !== 200 && q.status !== 206)) return jsonResponse({ error: 'reports-read-failed' }, 502, h);
  const rows = await q.json().catch(function () { return null; });
  if (!Array.isArray(rows)) return jsonResponse({ error: 'reports-read-failed' }, 502, h);
  const totalMatch = /\/(\d+)$/.exec(q.headers.get('content-range') || '');
  const total = totalMatch ? Number(totalMatch[1]) : rows.length;

  const patch = (qs, data, prefer) => fetch(supabaseUrl() + '/rest/v1/user_bug_reports?' + qs,
    { method: 'PATCH', headers: svcHeaders(Object.assign({ Prefer: prefer || 'return=representation' }, JSONH)), body: JSON.stringify(data) }).catch(function () { return null; });

  let closed = 0, sent = 0, skipped = 0, failed = 0, processed = 0, next = after, paused = false, lastSend = 0;
  const started = Date.now();

  if (action === 'close') {
    const open = rows.filter((r) => r.status === 'open' || r.status === 'triaged').map((r) => r.id);
    if (open.length) {
      const r = await patch('id=in.(' + open.join(',') + ')&status=in.(open,triaged)', { status: 'closed' });
      const upd = r && r.ok ? await r.json().catch(function () { return null; }) : null;
      closed = Array.isArray(upd) ? upd.length : 0;
      failed = open.length - closed;
    }
    skipped = rows.length - open.length;
    processed = rows.length;
    if (rows.length) next = rows[rows.length - 1].id;
  } else {
    const mailFor = {};
    for (const row of rows) {
      if (processed > 0 && Date.now() - started > _tuning.budgetMs) break;
      if (row.status === 'closed' || !row.user_id || row.fixed_notified_at) { skipped++; processed++; next = row.id; continue; }
      const claim = await patch('id=eq.' + row.id + '&fixed_notified_at=is.null', { fixed_notified_at: new Date().toISOString() });
      const got = claim && claim.ok ? await claim.json().catch(function () { return null; }) : null;
      if (!Array.isArray(got) || !got.length) { skipped++; processed++; next = row.id; continue; }
      const release = () => patch('id=eq.' + row.id, { fixed_notified_at: null }, 'return=minimal');

      const ur = await fetch(supabaseUrl() + '/auth/v1/admin/users/' + encodeURIComponent(row.user_id), { headers: svcHeaders() }).catch(function () { return null; });
      const u = ur && ur.status === 200 ? await ur.json().catch(function () { return null; }) : null;
      const email = u && typeof u.email === 'string' ? u.email.trim() : '';
      if (!email || email.indexOf('@') < 1) { await release(); (ur && ur.status === 404) ? skipped++ : failed++; processed++; next = row.id; continue; }

      if (_tuning.gapMs && lastSend) { const wait = _tuning.gapMs - (Date.now() - lastSend); if (wait > 0) await sleep(wait); }
      const mail = buildFixedEmail(row.title);
      const res = await sendMail({ to: [email], subject: mail.subject, html: mail.html, text: mail.text, idempotencyKey: 'bug-fixed:' + row.id });
      lastSend = Date.now();
      if (res.status === 429) { await release(); paused = true; break; }
      processed++; next = row.id;
      if (!res.ok) { await release(); failed++; continue; }
      await patch('id=eq.' + row.id, { status: 'closed' }, 'return=minimal');
      sent++; closed++;
    }
  }
  const remaining = Math.max(0, total - processed);

  await fetch(supabaseUrl() + '/rest/v1/admin_audit_log', {
    method: 'POST', headers: svcHeaders(Object.assign({ Prefer: 'return=minimal' }, JSONH)),
    body: JSON.stringify({ actor_id: admin.user.id, action: 'bug_report_' + action, target_table: 'user_bug_reports', target_op: 'UPDATE', target_id: null, new_data: { ids: idList, closed, sent } })
  }).catch(function () {});

  return jsonResponse({ closed, sent, skipped, failed, remaining, next, paused }, 200, h);
}
