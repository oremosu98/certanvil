// Fire-and-forget server-error telemetry → client_errors (type='server').
// Identical copy of api/_lib/log-server-error.js for the landing Vercel project
// (separate deployment — cannot share node_modules paths across projects).
// ESM export because landing/api/ uses Vercel Edge Runtime (not Node.js CJS).
// NEVER awaited on the response path; never throws.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function logServerError(entry) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) return;
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
    fetch(SUPABASE_URL + '/rest/v1/client_errors', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    }).catch(() => {});
  } catch (_) { /* reporting must never break serving */ }
}
