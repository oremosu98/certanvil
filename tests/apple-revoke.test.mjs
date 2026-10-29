// Stage 5c: landing/api/apple-revoke.js (Edge, ESM). Run: node --experimental-detect-module tests/apple-revoke.test.mjs
// fetch is stubbed: Supabase /auth/v1/user, Apple /auth/token + /auth/revoke, and the client_errors log.
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

const kp = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pkcs8 = Buffer.from(await webcrypto.subtle.exportKey('pkcs8', kp.privateKey)).toString('base64');
process.env.APPLE_TEAM_ID = 'TEAM123456';
process.env.APPLE_KEY_ID = 'KEY7654321';
process.env.APPLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\n' + pkcs8.match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----';
process.env.SUPABASE_URL = 'https://proj.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';

const mod = await import('../landing/api/apple-revoke.js');
const handler = mod.default, { clientSecret, decideRevoke } = mod._internal;

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const idToken = (sub) => b64u({ alg: 'RS256' }) + '.' + b64u({ sub, aud: 'com.certanvil.app' }) + '.sig';
let calls = [];
function stub({ user = { id: 'u1', identities: [{ provider: 'apple', id: 'apple-sub-1', identity_data: { sub: 'apple-sub-1' } }] }, userStatus = 200, appleSub = 'apple-sub-1', exchangeStatus = 200 } = {}) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith('/auth/v1/user')) return new Response(JSON.stringify(user), { status: userStatus });
    if (String(url).endsWith('/auth/token')) return exchangeStatus === 200
      ? new Response(JSON.stringify({ refresh_token: 'rt-1', id_token: idToken(appleSub) }), { status: 200 })
      : new Response(JSON.stringify({ error: 'invalid_grant' }), { status: exchangeStatus });
    if (String(url).endsWith('/auth/revoke')) return new Response('', { status: 200 });
    if (String(url).includes('/rest/v1/client_errors')) return new Response('', { status: 201 });
    return new Response('', { status: 404 });
  };
}
const req = (body, token = 'user-jwt', origin = 'https://networkplus.certanvil.com') => new Request('https://certanvil.com/api/apple-revoke', {
  method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', Origin: origin }, token ? { Authorization: 'Bearer ' + token } : {}), body: JSON.stringify(body) });
const tick = () => new Promise((r) => setTimeout(r, 20));
const logged = () => calls.filter((c) => c.url.includes('client_errors')).map((c) => JSON.parse(c.init.body).message);
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('  ok', name); };

await t('clientSecret is an ES256 JWT for com.certanvil.app, valid 10 minutes at most', async () => {
  const jwt = await clientSecret(Date.UTC(2026, 9, 28) );
  const [h, p, s] = jwt.split('.');
  const H = JSON.parse(Buffer.from(h, 'base64url')), P = JSON.parse(Buffer.from(p, 'base64url'));
  assert.equal(H.alg, 'ES256'); assert.equal(H.kid, 'KEY7654321');
  assert.equal(P.iss, 'TEAM123456'); assert.equal(P.sub, 'com.certanvil.app'); assert.equal(P.aud, 'https://appleid.apple.com');
  assert.ok(P.exp > P.iat && P.exp - P.iat <= 600);
  const ok = await webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, kp.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(h + '.' + p));
  assert.ok(ok, 'signature verifies with the key');
});

await t('decideRevoke matches only the same Apple sub', async () => {
  assert.equal(decideRevoke('a', 'a'), 'ok'); assert.equal(decideRevoke('a', 'b'), 'sub-mismatch'); assert.equal(decideRevoke('a', null), 'sub-mismatch');
});

await t('a matching Apple ID: exchange, then revoke the refresh token -> 200 ok', async () => {
  stub();
  const res = await handler(req({ code: 'c-1' }));
  assert.equal(res.status, 200); assert.deepEqual(await res.json(), { result: 'ok' });
  const rev = calls.find((c) => c.url === 'https://appleid.apple.com/auth/revoke');
  assert.ok(rev, 'revoke called');
  const form = new URLSearchParams(rev.init.body);
  assert.equal(form.get('token'), 'rt-1'); assert.equal(form.get('token_type_hint'), 'refresh_token'); assert.equal(form.get('client_id'), 'com.certanvil.app');
  const ex = new URLSearchParams(calls.find((c) => c.url === 'https://appleid.apple.com/auth/token').init.body);
  assert.equal(ex.get('grant_type'), 'authorization_code'); assert.equal(ex.get('code'), 'c-1');
  await tick(); assert.deepEqual(logged(), ['apple-revoke: ok']);
});

await t('a code for a different Apple ID is refused and nothing is revoked', async () => {
  stub({ appleSub: 'someone-else' });
  const res = await handler(req({ code: 'c-1' }));
  assert.equal(res.status, 409); assert.deepEqual(await res.json(), { result: 'sub-mismatch' });
  assert.ok(!calls.some((c) => c.url.endsWith('/auth/revoke')));
  await tick(); assert.deepEqual(logged(), ['apple-revoke: sub-mismatch']);
});

await t('no or invalid bearer -> 401 and no Apple call', async () => {
  stub();
  assert.equal((await handler(req({ code: 'c' }, null))).status, 401);
  stub({ userStatus: 401 });
  assert.equal((await handler(req({ code: 'c' }))).status, 401);
  assert.ok(!calls.some((c) => c.url.includes('appleid.apple.com')));
  await tick(); assert.deepEqual(logged(), ['apple-revoke: unauthorized']);
});

await t('Apple refuses the code -> 502 failed', async () => {
  stub({ exchangeStatus: 400 });
  const res = await handler(req({ code: 'c' }));
  assert.equal(res.status, 502); assert.deepEqual(await res.json(), { result: 'failed' });
  await tick(); assert.deepEqual(logged(), ['apple-revoke: failed']);
});

await t('CORS: a cert subdomain is allowed; other origins are not', async () => {
  stub();
  const ok = await handler(new Request('https://certanvil.com/api/apple-revoke', { method: 'OPTIONS', headers: { Origin: 'https://secplus.certanvil.com' } }));
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://secplus.certanvil.com');
  assert.match(ok.headers.get('access-control-allow-headers') || '', /Authorization/);
  const no = await handler(new Request('https://certanvil.com/api/apple-revoke', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }));
  assert.equal(no.headers.get('access-control-allow-origin'), null);
  const dev = await handler(new Request('https://certanvil.com/api/apple-revoke', { method: 'OPTIONS', headers: { Origin: 'http://localhost:3140' } }));
  assert.equal(dev.headers.get('access-control-allow-origin'), 'http://localhost:3140');
});

await t('the apikey falls back to SUPABASE_PUBLISHABLE_KEY (the name its sibling endpoints use)', async () => {
  const anon = process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_ANON_KEY; process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_x';
  try {
    stub();
    await handler(req({ code: 'c' }));
    assert.equal(calls.find((c) => c.url.endsWith('/auth/v1/user')).init.headers.apikey, 'sb_publishable_x');
  } finally { process.env.SUPABASE_ANON_KEY = anon; delete process.env.SUPABASE_PUBLISHABLE_KEY; }
});

console.log('apple-revoke: ' + n + '/8 passed');
