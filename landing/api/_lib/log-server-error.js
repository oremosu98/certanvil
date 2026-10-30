// Fire-and-forget server-error telemetry → client_errors (type='server').
// Identical copy of api/_lib/log-server-error.js for the landing Vercel project
// (separate deployment — cannot share node_modules paths across projects).
// ESM export because landing/api/ uses Vercel Edge Runtime (not Node.js CJS).
// Never throws. Returns the write's promise: on Edge an unawaited write can be dropped once the response is sent,
// so an endpoint whose log matters (apple-revoke) awaits it; others still fire and forget.
// The landing project has no SUPABASE_URL env (30 Oct): fall back to the project's public URL, as notify.js does,
// or nothing is ever written.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://appmuaqwuethndvalarl.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function logServerError(entry) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) return Promise.resolve();
    const row = {
      fingerprint: ('server|' + (entry.endpoint || '') + '|' + (entry.status || '') + '|' +
        String(entry.message || '').slice(0, 80)).slice(0, 300),
      type: 'server',
      message: String(entry.message || (entry.error && entry.error.message) || '').slice(0, 500),
      page: String(entry.endpoint || '').slice(0, 100),
      version: 'server',
      user_agent: '',
      user_id: null,
      extra: { error_id: entry.errorId || null, status: entry.status || null }
    };
    return fetch(SUPABASE_URL + '/rest/v1/client_errors', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    }).then(() => {}, () => {});
  } catch (_) { return Promise.resolve(); /* reporting must never break serving */ }
}
