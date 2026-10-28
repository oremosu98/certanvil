// Makes the Sign in with Apple client secret Supabase asks for (Auth → Providers → Apple → Secret Key).
// Run it yourself; the .p8 key never leaves this Mac:
//   node scripts/apple-client-secret.mjs /path/to/AuthKey_XXXXXXXXXX.p8
// Prints a JWT valid for 180 days (Apple's maximum is 6 months). Renew before it expires, or web Apple sign-in stops.
import { readFileSync } from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';

const TEAM_ID = 'SFMPU66W4U', KEY_ID = 'XPC9428TB4', CLIENT_ID = 'com.certanvil.web';
const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/apple-client-secret.mjs /path/to/AuthKey_' + KEY_ID + '.p8'); process.exit(1); }
const b64u = (b) => Buffer.from(b).toString('base64url');
const now = Math.floor(Date.now() / 1000), exp = now + 180 * 24 * 3600;
const input = b64u(JSON.stringify({ alg: 'ES256', kid: KEY_ID })) + '.' + b64u(JSON.stringify({ iss: TEAM_ID, iat: now, exp, aud: 'https://appleid.apple.com', sub: CLIENT_ID }));
const sig = sign('sha256', Buffer.from(input), { key: createPrivateKey(readFileSync(file)), dsaEncoding: 'ieee-p1363' });
console.log(input + '.' + b64u(sig));
console.error('\nValid until ' + new Date(exp * 1000).toDateString() + '. Paste the line above into Supabase.');
