// Suggest a cert, database half (supabase/migrations/20261031_cert_requests.sql), run in PGlite.
// Run: node --experimental-detect-module tests/cert-requests-db.test.mjs
//
// Loads the same stand-in prelude, schema and migrations as tests/deletion-db.test.mjs (Phase C′ brings is_admin()),
// then the real cert requests migration, unchanged. Checks the privacy and write rules, a re-paste, the ROLLBACK line
// and a re-apply after it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = ['supabase/schema.sql', 'supabase/migrations/20260506_phase_c_prime.sql'];
const FILE = 'supabase/migrations/20261031_cert_requests.sql';
const PRELUDE = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create role supabase_auth_admin nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}',
    last_sign_in_at timestamptz, created_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable
    as $uid$ select nullif(current_setting('test.uid', true), '')::uuid $uid$;
`;
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const rollbackSql = () => read(FILE).match(/^-- ROLLBACK:(.*)$/m)[1];

const db = new PGlite();
await db.exec(PRELUDE);
for (const f of [...BASE, FILE]) {
  try { await db.exec(read(f)); } catch (e) { throw new Error(f + ': ' + e.message); }
}

async function asUser(uid, sql, params = []) {
  await db.query("select set_config('test.uid', $1, false)", [uid]);
  await db.exec('set role authenticated');
  try { return await db.query(sql, params); }
  finally { await db.exec('reset role'); await db.query("select set_config('test.uid', '', false)"); }
}
const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b', ADM = '00000000-0000-0000-0000-0000000000ad';
async function fresh() {
  await db.exec('delete from auth.users');
  await db.query("insert into auth.users (id, email) values ($1, 'a@x.test'), ($2, 'b@x.test'), ($3, 'adm@x.test')", [A, B, ADM]);
  await db.query("update public.profiles set role = 'admin' where id = $1", [ADM]);
}
const ins = (uid, owner, key, label) => asUser(uid,
  'insert into public.cert_requests (user_id, exam_key, label, typed) values ($1, $2, $3, false) on conflict (user_id, exam_key) do nothing', [owner, key, label]);
const rejects = async (p) => { let threw = false; try { await p; } catch { threw = true; } assert.ok(threw, 'expected an error'); };

let n = 0, failed = 0;
const t = async (name, fn) => {
  try { await fresh(); await fn(); n++; console.log('  ok', name); }
  catch (e) { failed++; console.log('  FAIL', name, '\n    ', e.message); }
};

await t('a signed-in person adds their own request; a repeat is a silent no-op', async () => {
  await ins(A, A, 'ccna', 'CCNA');
  await ins(A, A, 'ccna', 'CCNA');
  assert.equal((await db.query('select count(*)::int c from public.cert_requests')).rows[0].c, 1);
});
await t('nobody can add a request in someone else\'s name', async () => { await rejects(ins(A, B, 'ccna', 'CCNA')); });
await t('a key that is not lowercase and trimmed is refused', async () => { await rejects(ins(A, A, ' CCNA', 'CCNA')); });
await t('counts are private: a person sees only their own rows and their own one-vote tally', async () => {
  await ins(A, A, 'ccna', 'CCNA'); await ins(B, B, 'ccna', 'CCNA');
  assert.equal((await asUser(A, 'select count(*)::int c from public.cert_requests')).rows[0].c, 1);
  assert.equal((await asUser(A, "select votes::int v from public.cert_request_tally where exam_key = 'ccna'")).rows[0].v, 1);
});
await t('an admin sees the whole tally', async () => {
  await ins(A, A, 'ccna', 'CCNA'); await ins(B, B, 'ccna', 'Cisco CCNA');
  const r = (await asUser(ADM, "select votes::int v, pending::int p from public.cert_request_tally where exam_key = 'ccna'")).rows[0];
  assert.deepEqual([r.v, r.p], [2, 2]);
});
await t('only an admin can mark people told, and only notified_at', async () => {
  await ins(A, A, 'ccna', 'CCNA');
  const own = await asUser(A, "update public.cert_requests set notified_at = now() where exam_key = 'ccna'");
  assert.equal(own.affectedRows, 0);
  const adm = await asUser(ADM, "update public.cert_requests set notified_at = now() where exam_key = 'ccna'");
  assert.equal(adm.affectedRows, 1);
  await rejects(asUser(ADM, "update public.cert_requests set label = 'x'"));
});
await t('nobody signed in can delete a request; deleting the account removes it', async () => {
  await ins(A, A, 'ccna', 'CCNA');
  await rejects(asUser(A, 'delete from public.cert_requests'));
  await db.query('delete from auth.users where id = $1', [A]);
  assert.equal((await db.query('select count(*)::int c from public.cert_requests')).rows[0].c, 0);
});
await t('a re-paste of the whole file is safe and keeps the rows', async () => {
  await ins(A, A, 'ccna', 'CCNA');
  await db.exec(read(FILE));
  assert.equal((await db.query('select count(*)::int c from public.cert_requests')).rows[0].c, 1);
});
await t('the ROLLBACK line removes the table and view, and the file applies again after it', async () => {
  await db.exec(rollbackSql());
  assert.equal((await db.query("select to_regclass('public.cert_requests') r, to_regclass('public.cert_request_tally') v")).rows[0].r, null);
  await db.exec(read(FILE));
  await ins(A, A, 'ccna', 'CCNA');
  assert.equal((await asUser(ADM, 'select count(*)::int c from public.cert_request_tally')).rows[0].c, 1);
});

console.log('cert-requests-db: ' + n + '/' + (n + failed) + ' passed');
if (failed) process.exit(1);
