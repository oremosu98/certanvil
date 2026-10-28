// Stage 5c (28 Oct 2026): revoke CertAnvil's Sign in with Apple grant when an Apple-linked account is deleted
// (Apple's token-revocation rule). The iOS app asks Apple for a fresh authorization code at delete time and posts it
// here with the user's Supabase access token. We check the caller, exchange the code with a client secret minted
// from the .p8 key, refuse unless the code's Apple ID is the account's own Apple identity, then revoke the refresh
// token. Nothing is stored. The deletion itself never waits on this: the app schedules it whatever we answer.
// Env: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (PEM, PKCS#8), SUPABASE_URL, SUPABASE_ANON_KEY.
import { logServerError } from './_lib/log-server-error.js';

export const config = { runtime: 'edge' };

const CLIENT_ID = 'com.certanvil.app';
const APPLE = 'https://appleid.apple.com';

function allowedOrigin(origin) {
  // certanvil.com and its cert subdomains; http://localhost:3140 is the founder's local test build (a bearer token is still required)
  return !!origin && (/^https:\/\/([a-z0-9-]+\.)?certanvil\.com$/.test(origin) || origin === 'http://localhost:3140');
}
function cors(req) {
  const h = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Vary': 'Origin' };
  const origin = req.headers.get('origin');
  if (allowedOrigin(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
function json(payload, status, req) {
  return new Response(JSON.stringify(payload), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, cors(req)) });
}
function log(result, status) {
  logServerError({ endpoint: 'apple-revoke', status, message: 'apple-revoke: ' + result });
}

function b64url(bytes) {
  let s = '';
  const a = bytes instanceof Uint8Array ? bytes : new TextEncoder().encode(bytes);
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function pemToDer(pem) {
  const b = atob(String(pem || '').replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

// The client secret Apple asks for: an ES256 JWT signed with the Sign in with Apple key, valid 5 minutes.
async function clientSecret(now) {
  const iat = Math.floor((now || Date.now()) / 1000);
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: process.env.APPLE_KEY_ID }));
  const body = b64url(JSON.stringify({ iss: process.env.APPLE_TEAM_ID, iat, exp: iat + 300, aud: APPLE, sub: CLIENT_ID }));
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(process.env.APPLE_PRIVATE_KEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(head + '.' + body));
  return head + '.' + body + '.' + b64url(new Uint8Array(sig));
}

// Revoke only when the code belongs to this account's own Apple identity.
function decideRevoke(codeSub, accountSub) {
  return codeSub && accountSub && codeSub === accountSub ? 'ok' : 'sub-mismatch';
}

function jwtSub(token) {
  try {
    const p = String(token || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(p + '==='.slice((p.length + 3) % 4))).sub || null;
  } catch (_) { return null; }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, req);

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) { log('unauthorized', 401); return json({ result: 'unauthorized' }, 401, req); }
  let body = null;
  try { body = await req.json(); } catch (_) { body = null; }
  const code = body && typeof body.code === 'string' ? body.code : '';
  if (!code) return json({ error: 'Missing code' }, 400, req);

  // Who is asking, and which Apple identity is theirs (the caller's own token returns their identities).
  const ures = await fetch(process.env.SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '', Authorization: 'Bearer ' + token }
  }).catch(() => null);
  if (!ures || ures.status !== 200) { log('unauthorized', 401); return json({ result: 'unauthorized' }, 401, req); }
  const user = await ures.json().catch(() => null);
  const ident = ((user && user.identities) || []).filter((i) => i && i.provider === 'apple')[0];
  const accountSub = ident ? (ident.id || (ident.identity_data && ident.identity_data.sub) || null) : null;

  try {
    const secret = await clientSecret();
    const ex = await fetch(APPLE + '/auth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: secret, code, grant_type: 'authorization_code' }).toString()
    });
    if (ex.status !== 200) { log('failed', 502); return json({ result: 'failed' }, 502, req); }
    const tok = await ex.json();
    if (decideRevoke(jwtSub(tok.id_token), accountSub) !== 'ok') { log('sub-mismatch', 409); return json({ result: 'sub-mismatch' }, 409, req); }
    if (!tok.refresh_token) { log('failed', 502); return json({ result: 'failed' }, 502, req); }
    const rv = await fetch(APPLE + '/auth/revoke', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: secret, token: tok.refresh_token, token_type_hint: 'refresh_token' }).toString()
    });
    if (rv.status !== 200) { log('failed', 502); return json({ result: 'failed' }, 502, req); }
    log('ok', 200);
    return json({ result: 'ok' }, 200, req);
  } catch (e) {
    log('failed', 502);
    return json({ result: 'failed' }, 502, req);
  }
}

export const _internal = { clientSecret, decideRevoke };
