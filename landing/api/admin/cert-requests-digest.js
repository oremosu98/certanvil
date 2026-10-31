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
// Same rule as the app's topErrors (features/admin-data.js): group by message, count desc, then newest first.
export function topErrors(rows, k) {
  const map = {}, list = [];
  (rows || []).forEach(function (r) {
    const key = r.message;
    let e = map[key];
    if (!e) { e = map[key] = { message: key, count: 0, _t: '' }; list.push(e); }
    e.count++;
    if (String(r.created_at) >= e._t) e._t = String(r.created_at);
  });
  list.sort(function (a, b) { return b.count - a.count || b._t.localeCompare(a._t); });
  return list.slice(0, k == null ? 5 : k).map(function (e) { return { message: e.message, count: e.count }; });
}

const H = 'margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a8178';

// The bug and error sections. Returns { html, text } fragments, empty when the reads failed (extra is null).
function extraParts(extra) {
  if (!extra) return { html: '', text: '' };
  const titles = (extra.newestTitles || []).slice(0, 3);
  const errs = (extra.topErrors || []).slice(0, 3);
  const open = Number(extra.open) || 0;
  let html = '', text = '';
  if (extra.open != null) {
    html += '<p style="' + H + '">Open bug reports: ' + open + '</p>'
      + (titles.length ? '<ul style="margin:4px 0 14px;padding-left:20px">' + titles.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '<p style="margin:4px 0 14px">Nothing waiting.</p>');
    text += 'Open bug reports: ' + open + '\n' + (titles.length ? titles.map(function (t) { return '- ' + t; }).join('\n') : 'Nothing waiting.') + '\n\n';
  }
  if (extra.topErrors) {
    html += '<p style="' + H + '">Top errors this week</p>'
      + (errs.length ? '<ul style="margin:4px 0 14px;padding-left:20px">' + errs.map(function (e) { return '<li>' + e.count + '× ' + esc(e.message) + '</li>'; }).join('') + '</ul>' : '<p style="margin:4px 0 14px">None this week.</p>');
    text += 'Top errors this week\n' + (errs.length ? errs.map(function (e) { return e.count + '× ' + e.message; }).join('\n') : 'None this week.') + '\n\n';
  }
  return { html, text };
}

export function buildDigest(rows, extra) {
  const x = extraParts(extra);
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
      html: '<p>No new requests this week.</p>' + x.html + '<p><a href="' + ADMIN_URL + '">Open your dashboard</a></p>',
      text: 'No new requests this week.\n\n' + x.text + 'Open your dashboard: ' + ADMIN_URL + '\n'
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
  html += x.html + '<p style="margin:0">See them all on your <a href="' + ADMIN_URL + '">dashboard</a>.</p></div>';
  let text = 'Most asked\n' + top.map(function (r, i) { return (i + 1) + '. ' + r.label + ' · ' + fmt(r); }).join('\n') + '\n\n';
  if (typedNew.length) text += 'New typed in\n' + typedNew.join(', ') + '\n\n';
  text += x.text + 'See them all on your dashboard: ' + ADMIN_URL + '\n';
  return { n, subject, html, text };
}

// Two extra service-role reads. Each degrades to null on any failure so the cert-request part still goes out.
async function readExtra() {
  const base = supabaseUrl() + '/rest/v1/';
  const bugs = fetch(base + 'user_bug_reports?select=title&status=in.(open,triaged)&order=created_at.desc&limit=3',
    { headers: svcHeaders({ Prefer: 'count=exact' }) }).then(async function (r) {
    if (!r || (r.status !== 200 && r.status !== 206)) return null;
    const rows = await r.json().catch(function () { return null; });
    const m = /\/(\d+)$/.exec(r.headers.get('content-range') || '');
    if (!Array.isArray(rows) || !m) return null;
    return { open: Number(m[1]), newestTitles: rows.map(function (b) { return String(b.title || ''); }) };
  }).catch(function () { return null; });
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const errs = fetch(base + 'client_errors?select=message,version,created_at&created_at=gte.' + encodeURIComponent(since) + '&order=created_at.desc&limit=500',
    { headers: svcHeaders() }).then(async function (r) {
    if (!r || r.status !== 200) return null;
    const rows = await r.json().catch(function () { return null; });
    return Array.isArray(rows) ? topErrors(rows, 3) : null;
  }).catch(function () { return null; });
  const got = await Promise.all([bugs, errs]);
  if (!got[0] && !got[1]) return null;
  return { open: got[0] ? got[0].open : null, newestTitles: got[0] ? got[0].newestTitles : [], topErrors: got[1] };
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

  const d = buildDigest(rows, await readExtra());
  const sent = await sendMail({ to: [founderEmail()], subject: d.subject, html: d.html, text: d.text });
  if (!sent.ok) {
    await logServerError({ endpoint: 'cert-requests-digest', status: 502, message: 'cert-requests-digest: send failed' });
    return jsonResponse({ error: 'send-failed' }, 502);
  }
  return jsonResponse({ sent: true, n: d.n }, 200);
}
