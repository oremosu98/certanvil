// ══════════════════════════════════════════════════════════════════════════
// Phase E.1 + E.2 — Server-side AI proxy
// ══════════════════════════════════════════════════════════════════════════
// Vercel serverless function at https://networkplus.certanvil.com/api/ai/generate
// (and any other cert subdomain — cert-app is one Vercel deploy).
//
// What it does:
//   1. Verifies the request's Authorization Bearer token via Supabase's
//      /auth/v1/user endpoint. Rejects unauthenticated requests with 401.
//   2. If body opts in with `_metered: true`, calls consume_daily_quota()
//      on the user. Free over-quota → 429 with upgrade CTA. Pro → unlimited.
//      Validation/coaching/teacher calls SHOULD set _metered: false (or
//      omit it) since they're infrastructure, not user-facing questions.
//   3. Forwards the (sanitised) request body to Anthropic's /v1/messages
//      with the server-held ANTHROPIC_API_KEY. Pass-through response.
//
// Required Vercel env vars (set in the cert-app Vercel project):
//   - SUPABASE_URL                — your Supabase project URL
//   - SUPABASE_ANON_KEY           — publishable anon key (safe on server)
//   - ANTHROPIC_API_KEY           — server-held Claude key (NEVER on client)
//
// Zero runtime dependencies. Uses Node 18+ native fetch + Supabase REST API.
// ══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const ANTHROPIC_VERSION = '2023-06-01';
const FREE_DAILY_LIMIT = 20;  // mirrors consume_daily_quota's hardcoded limit

// ── Supabase helpers (REST, no SDK) ─────────────────────────────────────

async function verifyUser(token) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    }
  });
  if (!r.ok) return null;
  const user = await r.json();
  return user && user.id ? user : null;
}

async function consumeQuota(token, userId, count) {
  // RPC call. Returns true (allowed) or false (quota exceeded). The function
  // is security-definer so it bypasses RLS — anon key is fine here.
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consume_daily_quota`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uid: userId, q_count: count })
  });
  if (!r.ok) {
    const detail = await r.text();
    throw new Error(`Quota RPC failed (${r.status}): ${detail}`);
  }
  return await r.json();  // true | false
}

// ── Misc helpers ────────────────────────────────────────────────────────

function nextMidnightUtcIso() {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0
  )).toISOString();
}

function badJson(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
}

// ── Handler ─────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // Defensive: env vars must be set
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ANTHROPIC_API_KEY) {
    return badJson(res, 500, {
      error: 'server_misconfigured',
      message: 'Required env vars missing on the server. Contact support.'
    });
  }

  if (req.method !== 'POST') {
    return badJson(res, 405, { error: 'method_not_allowed' });
  }

  // ── 1. Verify JWT ───────────────────────────────────────────────────
  const authHeader = (req.headers && req.headers.authorization) || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return badJson(res, 401, {
      error: 'missing_auth',
      message: 'No Authorization header. You need to be signed in.'
    });
  }

  let user;
  try {
    user = await verifyUser(token);
  } catch (e) {
    return badJson(res, 502, {
      error: 'auth_check_failed',
      detail: String(e && e.message || e)
    });
  }
  if (!user) {
    return badJson(res, 401, {
      error: 'invalid_auth',
      message: 'Your session has expired. Sign in again.'
    });
  }
  const userId = user.id;

  // ── 2. Quota check (only if metered) ─────────────────────────────────
  // Convention: the client sets _metered: true for fetchQuestions calls
  // (the user-facing "I want a new question" flow). Validation, coaching,
  // and teacher calls leave it false/absent — they're infra costs.
  const isMetered = req && req.body && req.body._metered === true;

  if (isMetered) {
    let allowed;
    try {
      allowed = await consumeQuota(token, userId, 1);
    } catch (e) {
      return badJson(res, 500, {
        error: 'quota_check_failed',
        detail: String(e && e.message || e)
      });
    }
    if (allowed === false) {
      return badJson(res, 429, {
        error: 'quota_exceeded',
        message: 'You\'ve used your ' + FREE_DAILY_LIMIT + ' free questions today. Resets at midnight UTC, or upgrade to Pro for unlimited.',
        upgrade_url: 'https://certanvil.com/pricing',
        reset_at: nextMidnightUtcIso(),
        daily_limit: FREE_DAILY_LIMIT
      });
    }
  }

  // ── 3. Forward to Anthropic ──────────────────────────────────────────
  // Strip control fields so Anthropic doesn't reject the request.
  const body = Object.assign({}, req.body);
  delete body._metered;

  let upstreamRes;
  try {
    upstreamRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    return badJson(res, 502, {
      error: 'upstream_failure',
      detail: String(e && e.message || e)
    });
  }

  // Pass through Anthropic's response (status + body) as-is. The cert-app
  // already knows how to handle Anthropic's error shapes from the BYOK era.
  const text = await upstreamRes.text();
  res.status(upstreamRes.status);
  res.setHeader('Content-Type', 'application/json');
  res.send(text);
};
