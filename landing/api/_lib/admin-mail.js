// Shared helpers for the two admin endpoints (cert-requests-digest, notify-cert-live): env, JSON replies, escaping,
// the server-side admin check, and one Resend send. Edge runtime, ESM. Every env var is read at call time so a missing
// one answers a clean 503 instead of a crash (ENVIRONMENT_STRATEGY.md: ship safely before the env is set).
// The landing project has no SUPABASE_URL env (30 Oct): fall back to the project's public URL, as notify.js does.

export function supabaseUrl() { return process.env.SUPABASE_URL || 'https://appmuaqwuethndvalarl.supabase.co'; }
export function serviceKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY || ''; }
export function fromAddress() { return 'CertAnvil <' + (process.env.NOTIFY_FROM_EMAIL || 'notify@certanvil.com') + '>'; }

// Names of the required env vars that are not set.
export function missingEnv(names) {
  return names.filter(function (n) { return !process.env[n]; });
}

export function jsonResponse(payload, status, extraHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, extraHeaders || {})
  });
}
// The 503 never names the missing vars (the answer is public-facing); they go to the server log instead.
export function unconfigured(missing, endpoint, extraHeaders) {
  try { console.error('[' + (endpoint || 'admin') + '] not configured, missing env: ' + missing.join(', ')); } catch (_) {}
  return jsonResponse({ error: 'not-configured' }, 503, extraHeaders);
}

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Constant-time string compare: hash both sides to equal length, then fold every byte difference.
export async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(a))),
    crypto.subtle.digest('SHA-256', enc.encode(String(b)))
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function bearer(req) {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

export function svcHeaders(extra) {
  const k = serviceKey();
  return Object.assign({ apikey: k, Authorization: 'Bearer ' + k }, extra || {});
}

// Who is the caller, and are they an admin? The JWT is verified by Supabase itself (/auth/v1/user), the role is read
// with the service key from profiles. Returns { ok:true, user } or { ok:false, status, error }.
export async function requireAdmin(req) {
  const token = bearer(req);
  if (!token) return { ok: false, status: 401, error: 'unauthorized' };
  const ures = await fetch(supabaseUrl() + '/auth/v1/user', {
    headers: { apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || serviceKey(), Authorization: 'Bearer ' + token }
  }).catch(function () { return null; });
  if (!ures || ures.status !== 200) return { ok: false, status: 401, error: 'unauthorized' };
  const user = await ures.json().catch(function () { return null; });
  if (!user || !user.id) return { ok: false, status: 401, error: 'unauthorized' };
  const pres = await fetch(supabaseUrl() + '/rest/v1/profiles?select=role&id=eq.' + encodeURIComponent(user.id), { headers: svcHeaders() })
    .catch(function () { return null; });
  if (!pres || pres.status !== 200) return { ok: false, status: 502, error: 'profile-lookup-failed' };
  const rows = await pres.json().catch(function () { return null; });
  if (!Array.isArray(rows) || !rows[0] || rows[0].role !== 'admin') return { ok: false, status: 403, error: 'forbidden' };
  return { ok: true, user };
}

// One Resend send, to exactly the addresses in `to`. Returns { ok, status } (status 0 when the call threw).
export async function sendMail({ to, subject, html, text, idempotencyKey }) {
  const headers = { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers,
      body: JSON.stringify({ from: fromAddress(), to: Array.isArray(to) ? to : [to], subject, html, text })
    });
    if (!r.ok) {
      // Resend's reason (name + message) goes to the server log so a failed send can be diagnosed; addresses are masked.
      const b = await r.json().catch(function () { return null; });
      const why = b ? (b.name || '') + ': ' + (b.message || '') : '';
      console.error('[admin-mail] resend ' + r.status + ' ' + why.replace(/[^\s<>"']+@[^\s<>"']+/g, '[email]').slice(0, 300));
    }
    return { ok: r.ok, status: r.status };
  } catch (e) { console.error('[admin-mail] resend call threw: ' + (e && e.name)); return { ok: false, status: 0 }; }
}

// A label that goes into an email: control characters (CR/LF included) and line separators become spaces, whitespace
// collapses, and it is capped at 120 code points. Used for the subject and the body.
export function cleanLabel(raw) {
  const s = String(raw == null ? '' : raw).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
  return Array.from(s).slice(0, 120).join('');
}
