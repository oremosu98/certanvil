// Account deletion, database half (supabase/migrations/20261029_account_deletion.sql), run in PGlite.
// Run: node --experimental-detect-module tests/deletion-db.test.mjs
//
// bootDb() loads, unchanged and in order: a stand-in prelude, the real supabase/schema.sql, the real migrations that
// create the tables the deletion touches, then the real 20261029_account_deletion.sql.
//
// Stand-ins in the prelude (Supabase provides these; PGlite does not). Nothing is edited out of the real files.
//   - roles anon, authenticated, service_role, supabase_auth_admin (NOLOGIN; grants and policies name them)
//   - schema auth and table auth.users (id, email, raw_user_meta_data, last_sign_in_at, created_at): only the
//     columns the real files and these tests use
//   - auth.uid(): reads the settable test.uid instead of the request JWT
// Every listed migration loads in PGlite with only these stand-ins; no statement needed stubbing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = [
  '20260506_phase_c_prime.sql', '20260509_phase_e_subscriptions.sql', '20260509_notify_signups.sql',
  '20260511_diagnostic_pending.sql', '20260511_web_vitals.sql', '20260531_phase5_admin_audit_log.sql',
  '20260718_client_errors.sql', '20260718_user_bug_reports.sql',
];
const PRELUDE = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create role supabase_auth_admin nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}',
    last_sign_in_at timestamptz, created_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable
    as $uid$ select nullif(current_setting('test.uid', true), '')::uuid $uid$;
`;

export async function bootDb() {
  const db = new PGlite();
  await db.exec(PRELUDE);
  const files = ['supabase/schema.sql', ...MIGRATIONS.map((f) => 'supabase/migrations/' + f), 'supabase/migrations/20261029_account_deletion.sql'];
  for (const f of files) {
    try { await db.exec(fs.readFileSync(path.join(ROOT, f), 'utf8')); }
    catch (e) { throw new Error(f + ': ' + e.message); }
  }
  return db;
}

// Runs one statement as the signed-in user uid (role authenticated), then drops back to the superuser.
export async function asUser(db, uid, sql, params = []) {
  await db.query("select set_config('test.uid', $1, false)", [uid || '']);
  await db.exec('set role authenticated');
  try { return await db.query(sql, params); }
  finally { await db.exec('reset role'); await db.query("select set_config('test.uid', '', false)"); }
}

const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b';
const db = await bootDb();
async function fresh() { // two new users per case; the cascade drops their profiles
  await db.exec('delete from auth.users');
  await db.query("insert into auth.users (id, email) values ($1, 'a@example.test'), ($2, 'b@example.test')", [A, B]);
}
const meta = async (id) => (await db.query('select metadata from public.profiles where id = $1', [id])).rows[0]?.metadata;
const setMeta = (id, m) => db.query('update public.profiles set metadata = $2 where id = $1', [id, JSON.stringify(m)]);
const signIn = (id, expr) => db.query('update auth.users set last_sign_in_at = ' + expr + ' where id = $1', [id]);
const mark = async (id) => (await asUser(db, id, 'select public.request_account_deletion() as at')).rows[0].at;

let n = 0, failed = 0;
const t = async (name, fn) => {
  try { await fresh(); await fn(); n++; console.log('  ok', name); }
  catch (e) { failed++; console.log('  FAIL', name, '\n    ', e.message); }
};

await t('request_account_deletion stamps the server time on the caller only, keeping other keys', async () => {
  await setMeta(A, { keep: 1, deletion_cancelled_at: '2026-10-01T00:00:00Z' });
  await setMeta(B, { other: 2 });
  const at = await mark(A);
  const m = await meta(A);
  assert.equal(m.keep, 1);
  assert.equal(m.deletion_cancelled_at, undefined, 'a fresh mark drops an old cancel notice');
  assert.ok(m.deletion_requested_at, 'mark set');
  assert.ok(Math.abs(new Date(m.deletion_requested_at) - Date.now()) < 5000, 'stamped within 5s of now');
  assert.equal(new Date(at).getTime(), new Date(m.deletion_requested_at).getTime(), 'returns the stamp it wrote');
  assert.deepEqual(await meta(B), { other: 2 });
});

await t('sign-in after the mark cancels it and sets deletion_cancelled_at', async () => {
  await setMeta(A, { keep: 1 });
  await mark(A);
  await signIn(A, "now() + interval '1 second'");
  const m = await meta(A);
  assert.equal(m.deletion_requested_at, undefined);
  assert.ok(m.deletion_cancelled_at, 'notice set');
  assert.equal(m.keep, 1);
});

await t('an update that leaves last_sign_in_at alone changes nothing', async () => {
  await signIn(A, "now() + interval '1 hour'"); // an earlier session, timed after the mark below
  await mark(A);
  const before = await meta(A);
  await db.query("update auth.users set email = 'a2@example.test' where id = $1", [A]);
  await db.query('update auth.users set last_sign_in_at = last_sign_in_at where id = $1', [A]); // a token refresh
  assert.deepEqual(await meta(A), before);
});

await t('a sign-in time from before the mark changes nothing', async () => {
  const at = await mark(A);
  const before = await meta(A);
  await db.query("update auth.users set last_sign_in_at = $2::timestamptz - interval '1 hour' where id = $1", [A, at]);
  assert.deepEqual(await meta(A), before);
});

await t('signing in with no profile row still succeeds', async () => {
  await db.query('delete from public.profiles where id = $1', [A]);
  const r = await signIn(A, 'now()');
  assert.equal(r.affectedRows, 1);
});

await t('a failure inside the cancel never blocks the sign-in', async () => {
  await mark(A);
  await db.exec("alter table public.profiles add constraint t_no_cancel check (not (metadata ? 'deletion_cancelled_at'))");
  try {
    const r = await signIn(A, "now() + interval '1 second'");
    assert.equal(r.affectedRows, 1, 'sign-in row still updated');
    assert.ok((await meta(A)).deletion_requested_at, 'mark untouched (the failed update rolled back)');
  } finally { await db.exec('alter table public.profiles drop constraint t_no_cancel'); }
});

await t('clear_deletion_notice removes only the notice key, only for the caller', async () => {
  await setMeta(A, { keep: 1, deletion_cancelled_at: '2026-10-29T00:00:00Z' });
  await setMeta(B, { keep: 2, deletion_cancelled_at: '2026-10-29T00:00:00Z' });
  await asUser(db, A, 'select public.clear_deletion_notice()');
  assert.deepEqual(await meta(A), { keep: 1 });
  assert.deepEqual(await meta(B), { keep: 2, deletion_cancelled_at: '2026-10-29T00:00:00Z' });
});

await t('anon cannot call either RPC', async () => {
  for (const fn of ['request_account_deletion', 'clear_deletion_notice']) {
    await db.query("select set_config('test.uid', $1, false)", [A]);
    await db.exec('set role anon');
    try { await assert.rejects(db.query('select public.' + fn + '()'), /permission denied/); }
    finally { await db.exec('reset role'); }
  }
  assert.equal((await meta(A)).deletion_requested_at, undefined);
});

await t('only authenticated holds EXECUTE on the RPCs and safe_timestamptz', async () => {
  for (const fn of ['public.request_account_deletion()', 'public.clear_deletion_notice()', 'public.safe_timestamptz(text)']) {
    const r = (await db.query(`select has_function_privilege('authenticated', $1, 'execute') au, has_function_privilege('anon', $1, 'execute') an,
      has_function_privilege('service_role', $1, 'execute') sr`, [fn])).rows[0];
    assert.deepEqual(r, { au: true, an: false, sr: false }, fn);
  }
});

await t('safe_timestamptz returns NULL on bad input instead of raising', async () => {
  const r = (await db.query("select public.safe_timestamptz('not a time') bad, public.safe_timestamptz(null) nul, public.safe_timestamptz('2026-10-29T12:00:00Z') ok")).rows[0];
  assert.equal(r.bad, null); assert.equal(r.nul, null);
  assert.equal(new Date(r.ok).toISOString(), '2026-10-29T12:00:00.000Z');
});

console.log('deletion-db: ' + n + '/' + (n + failed) + ' passed');
if (failed) process.exit(1);
