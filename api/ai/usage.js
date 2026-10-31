// GET /api/ai/usage  (admin only)
// Today's app-wide AI call count and the daily limit, for the in-app admin view.
// Auth: the caller's own Supabase token is verified, then profiles.role is read with that
// same token (RLS), so no service key is needed. The counter row is admin-readable by RLS.
const { globalDailyLimit } = require('../_lib/ai-limits');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const url = process.env.SUPABASE_URL || '';
  const anon = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anon) return res.status(503).json({ error: 'not_configured' });

  const m = /^Bearer\s+(.+)$/i.exec((req.headers && (req.headers.authorization || req.headers.Authorization)) || '');
  if (!m) return res.status(401).json({ error: 'unauthorized' });
  const headers = { Authorization: 'Bearer ' + m[1], apikey: anon };

  try {
    const ur = await fetch(url + '/auth/v1/user', { headers });
    if (!ur.ok) return res.status(401).json({ error: 'unauthorized' });
    const user = await ur.json();
    if (!user || !user.id) return res.status(401).json({ error: 'unauthorized' });

    const pr = await fetch(url + '/rest/v1/profiles?select=role&id=eq.' + encodeURIComponent(user.id), { headers });
    if (!pr.ok) return res.status(502).json({ error: 'upstream' });
    const prof = await pr.json();
    if (!Array.isArray(prof) || !prof[0] || prof[0].role !== 'admin') return res.status(403).json({ error: 'forbidden' });

    const rr = await fetch(url + '/rest/v1/ai_proxy_rate_limit?select=call_count,window_start&key=eq.global%3Adaily', { headers });
    if (!rr.ok) return res.status(502).json({ error: 'upstream' });
    const rows = await rr.json();
    const row = Array.isArray(rows) ? rows[0] : null;

    // Mirror ai_rl_check_and_increment: the window is rolling, expired only when now - window_start > 1 day.
    const DAY = 86400000;
    const ws = row ? Date.parse(row.window_start) : NaN;
    const live = !Number.isNaN(ws) && Date.now() - ws <= DAY;
    const used = live ? Number(row.call_count) || 0 : 0;
    const resetsAt = live ? new Date(ws + DAY).toISOString() : null;

    return res.status(200).json({ used, limit: globalDailyLimit(), resetsAt });
  } catch (e) {
    return res.status(502).json({ error: 'upstream' });
  }
};
