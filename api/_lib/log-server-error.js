// Fire-and-forget server-error telemetry → client_errors (type='server').
// NEVER awaited on the response path; never throws.
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars — no-ops cleanly
// when either is missing (safe on envs where the key hasn't been added yet).
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function logServerError(entry) {
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
module.exports = { logServerError };
