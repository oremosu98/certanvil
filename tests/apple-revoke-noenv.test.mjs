// 30 Oct: the landing Vercel project has no SUPABASE_URL (only SUPABASE_SERVICE_ROLE_KEY + the Apple keys). With it
// unset, apple-revoke.js built 'undefined/auth/v1/user' (the fetch threw, every deletion revoke answered 401) and
// log-server-error.js wrote nothing. This suite runs the endpoint with production's env exactly and checks it
// reaches the project's Supabase for both. Run: node --experimental-detect-module tests/apple-revoke-noenv.test.mjs
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

const kp = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pkcs8 = Buffer.from(await webcrypto.subtle.exportKey('pkcs8', kp.privateKey)).toString('base64');
process.env.APPLE_TEAM_ID = 'TEAM123456';
process.env.APPLE_KEY_ID = 'KEY7654321';
process.env.APPLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\n' + pkcs8.match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----';
delete process.env.SUPABASE_URL; delete process.env.SUPABASE_ANON_KEY; delete process.env.SUPABASE_PUBLISHABLE_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';

const PROJECT = 'https://appmuaqwuethndvalarl.supabase.co';
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const idToken = (sub) => b64u({ alg: 'RS256' }) + '.' + b64u({ sub, aud: 'com.certanvil.app' }) + '.sig';
let calls = [];
globalThis.fetch = async (url, init = {}) => {
  url = String(url); calls.push({ url, init });
  if (!/^https:\/\//.test(url)) throw new TypeError('Invalid URL: ' + url);   // as Edge does for 'undefined/...'
  if (url === PROJECT + '/auth/v1/user') return new Response(JSON.stringify({ id: 'u1', identities: [{ provider: 'apple', id: 'apple-sub-1' }] }), { status: 200 });
  if (url.endsWith('/auth/token')) return new Response(JSON.stringify({ refresh_token: 'rt-1', id_token: idToken('apple-sub-1') }), { status: 200 });
  if (url.endsWith('/auth/revoke')) return new Response('', { status: 200 });
  if (url === PROJECT + '/rest/v1/client_errors') return new Response('', { status: 201 });
  return new Response('', { status: 404 });
};

const { default: handler } = await import('../landing/api/apple-revoke.js');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('  ok', name); };

await t('with no SUPABASE_URL the caller is checked against the project Supabase and the revoke goes through', async () => {
  calls = [];
  const res = await handler(new Request('https://certanvil.com/api/apple-revoke', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://networkplus.certanvil.com', Authorization: 'Bearer user-jwt' }, body: JSON.stringify({ code: 'c-1' }) }));
  assert.equal(res.status, 200); assert.deepEqual(await res.json(), { result: 'ok' });
  const u = calls.find((c) => c.url.endsWith('/auth/v1/user'));
  assert.equal(u && u.url, PROJECT + '/auth/v1/user');
  assert.equal(u.init.headers.Authorization, 'Bearer user-jwt');
});

await t('with no SUPABASE_URL the server still writes its own log row', async () => {
  const w = calls.filter((c) => c.url === PROJECT + '/rest/v1/client_errors').map((c) => JSON.parse(c.init.body).message);
  assert.deepEqual(w, ['apple-revoke: ok']);
});

console.log('apple-revoke-noenv: ' + n + '/2 passed');
