// Monday email to the founder: what people asked for this week (Suggest a cert). Called by the Vercel cron in
// vercel.json (GET, 0 8 * * 1) with `Authorization: Bearer ${CRON_SECRET}`. Reads cert_request_tally with the service
// role and sends one Resend email to FOUNDER_EMAIL. With no new requests it still sends a short "0 new" note: a silent
// Monday is indistinguishable from a broken cron.
// Env: CRON_SECRET, FOUNDER_EMAIL, RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY (SUPABASE_URL optional, NOTIFY_FROM_EMAIL optional).
// FOUNDER_EMAIL falls back to NOTIFY_ADMIN_EMAIL, the address the landing project already sends signup notices to.
// Any of the four missing answers 503 and sends nothing.
import { missingEnv, unconfigured, jsonResponse, esc, safeEqual, bearer, supabaseUrl, svcHeaders, sendMail } from '../_lib/admin-mail.js';
import { logServerError } from '../_lib/log-server-error.js';

export const config = { runtime: 'edge' };

const ADMIN_URL = 'https://certanvil.com/admin';

// Subject, HTML and plain text from tally rows (already ordered). Pure, so it is tested directly.
export function buildDigest(rows) {
  const list = (rows || []).map(function (r) {
    return { label: String(r.label || r.exam_key || ''), votes: Number(r.votes) || 0, new7: Number(r.new_7d) || 0, typed: !!r.typed };
  });
  const n = list.reduce(function (s, r) { return s + r.new7; }, 0);
  const subject = 'Cert requests this week: ' + n + ' new';
  const top = list.slice(0, 3);
  const typedNew = list.filter(function (r) { return r.typed && r.new7 > 0; }).map(function (r) { return r.label; });
  const fmt = function (r) { return r.votes + (r.new7 > 0 ? ' (+' + r.new7 + ')' : ''); };

  if (!list.length) {
    return {
      n, subject,
      html: '<p>No new requests this week.</p><p><a href="' + ADMIN_URL + '">Open your dashboard</a></p>',
      text: 'No new requests this week.\n\nOpen your dashboard: ' + ADMIN_URL + '\n'
    };
  }
  let html = '<div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#2a2622">'
    + '<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a8178">Most asked</p>'
    + '<ol style="margin:4px 0 14px;padding-left:20px">'
    + top.map(function (r) { return '<li><b>' + esc(r.label) + '</b> · ' + esc(fmt(r)) + '</li>'; }).join('')
    + '</ol>';
  if (typedNew.length) {
    html += '<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a8178">New typed in</p>'
      + '<p style="margin:4px 0 14px">' + typedNew.map(esc).join(', ') + '</p>';
  }
  html += '<p style="margin:0">See them all on your <a href="' + ADMIN_URL + '">dashboard</a>.</p></div>';
  let text = 'Most asked\n' + top.map(function (r, i) { return (i + 1) + '. ' + r.label + ' · ' + fmt(r); }).join('\n') + '\n\n';
  if (typedNew.length) text += 'New typed in\n' + typedNew.join(', ') + '\n\n';
  text += 'See them all on your dashboard: ' + ADMIN_URL + '\n';
  return { n, subject, html, text };
}

function founderEmail() { return process.env.FOUNDER_EMAIL || process.env.NOTIFY_ADMIN_EMAIL || ''; }

export default async function handler(req) {
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, { Allow: 'GET' });
  const missing = missingEnv(['CRON_SECRET', 'RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (!founderEmail()) missing.push('FOUNDER_EMAIL');
  if (missing.length) return unconfigured(missing, 'cert-requests-digest');

  const token = bearer(req);
  if (!token || !(await safeEqual(token, process.env.CRON_SECRET))) return jsonResponse({ error: 'unauthorized' }, 401);

  // Ordering is requested explicitly: Postgres does not promise a view's ORDER BY survives a query on it.
  const res = await fetch(supabaseUrl() + '/rest/v1/cert_request_tally?select=exam_key,label,votes,new_7d,last_at,typed&order=votes.desc,last_at.desc',
    { headers: svcHeaders() }).catch(function () { return null; });
  if (!res || res.status !== 200) {
    await logServerError({ endpoint: 'cert-requests-digest', status: 502, message: 'cert-requests-digest: tally read failed ' + (res ? res.status : 'threw') });
    return jsonResponse({ error: 'tally-read-failed' }, 502);
  }
  const rows = await res.json().catch(function () { return null; });
  if (!Array.isArray(rows)) return jsonResponse({ error: 'tally-read-failed' }, 502);

  const d = buildDigest(rows);
  const sent = await sendMail({ to: [founderEmail()], subject: d.subject, html: d.html, text: d.text });
  if (!sent.ok) {
    await logServerError({ endpoint: 'cert-requests-digest', status: 502, message: 'cert-requests-digest: send failed' });
    return jsonResponse({ error: 'send-failed' }, 502);
  }
  return jsonResponse({ sent: true, n: d.n }, 200);
}
