// Bug report loop, database half (supabase/migrations/20261031_bug_reports_loop.sql), run in PGlite.
// Run: node --experimental-detect-module tests/bug-reports-db.test.mjs
//
// Loads the stand-in prelude, schema, Phase C′ (is_admin) and the original bug reports migration, then the real
// loop migration, unchanged. Checks the overwrite hole is closed, the submit RPC, the user_id rule, the length
// limits, admin read, a re-paste, the ROLLBACK line and a re-apply after it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = ['supabase/schema.sql', 'supabase/migrations/20260506_phase_c_prime.sql', 'supabase/migrations/20260718_user_bug_reports.sql'];
const FILE = 'supabase/migrations/20261031_bug_reports_loop.sql';
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
// Stand-in for Supabase's default table grants: the real project grants anon and authenticated everything on public tables.
await db.exec('grant usage on schema public to anon, authenticated; grant select, insert, update on public.user_bug_reports to anon, authenticated;');
// The migration's own REVOKE must win over that default, so re-run it the way a paste order would not: apply the file again.
await db.exec(read(FILE));

async function as(role, uid, sql, params = []) {
  await db.query("select set_config('test.uid', $1, false)", [uid || '']);
  await db.exec('set role ' + role);
  try { return await db.query(sql, params); }
  finally { await db.exec('reset role'); await db.query("select set_config('test.uid', '', false)"); }
}
const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b', ADM = '00000000-0000-0000-0000-0000000000ad';
async function fresh() {
  await db.exec('delete from public.user_bug_reports');
  await db.exec('delete from auth.users');
  await db.query("insert into auth.users (id, email) values ($1, 'a@x.test'), ($2, 'b@x.test'), ($3, 'adm@x.test')", [A, B, ADM]);
  await db.query("update public.profiles set role = 'admin' where id = $1", [ADM]);
}
const submit = (role, uid, rid, title, owner) => as(role, uid,
  'select public.submit_bug_report($1, $2, $3, $4, $5, $6::jsonb, $7::uuid) as id', [rid, title, 'd', 's', 'b', '{}', owner]);
const rows = async () => (await db.query('select * from public.user_bug_reports order by id')).rows;
const rejects = async (p) => { let threw = false; try { await p; } catch { threw = true; } assert.ok(threw, 'expected an error'); };

let n = 0, failed = 0;
const t = async (name, fn) => {
  try { await fresh(); await fn(); n++; console.log('  ok', name); }
  catch (e) { failed++; console.log('  FAIL', name, '\n    ', e.message); }
};

await t('anon can no longer overwrite reports', async () => {
  await submit('anon', null, 'rpt_1', 'original', null);
  let changed = 0;
  try { changed = (await as('anon', null, "update public.user_bug_reports set title = 'x'")).affectedRows; } catch { changed = 0; }
  assert.equal(changed, 0);
  assert.equal((await rows())[0].title, 'original');
});
await t('submit returns the id and a retry returns the same id', async () => {
  const a = (await submit('anon', null, 'rpt_1', 'first', null)).rows[0].id;
  const b = (await submit('anon', null, 'rpt_1', 'second', null)).rows[0].id;
  assert.equal(a, b);
  const r = await rows();
  assert.equal(r.length, 1);
  assert.equal(r[0].title, 'first');
});
await t('user_id is kept only for the caller', async () => {
  await submit('authenticated', A, 'rpt_a', 't', A);
  await submit('authenticated', A, 'rpt_b', 't', B);
  await submit('anon', null, 'rpt_c', 't', A);
  const by = Object.fromEntries((await rows()).map((r) => [r.report_id, r.user_id]));
  assert.equal(by.rpt_a, A);
  assert.equal(by.rpt_b, null);
  assert.equal(by.rpt_c, null);
});
await t('limits still apply', async () => {
  await rejects(submit('anon', null, 'rpt_long', 'x'.repeat(201), null));
  assert.equal((await rows()).length, 0);
});
await t('admin can read, nobody can update fixed_notified_at from a client', async () => {
  await submit('anon', null, 'rpt_1', 't', null);
  assert.equal((await as('authenticated', ADM, 'select count(*)::int c from public.user_bug_reports')).rows[0].c, 1);
  assert.equal((await as('authenticated', A, 'select count(*)::int c from public.user_bug_reports')).rows[0].c, 0);
  await rejects(as('authenticated', ADM, 'update public.user_bug_reports set fixed_notified_at = now()'));
  await rejects(as('authenticated', A, 'update public.user_bug_reports set fixed_notified_at = now()'));
});
await t('a direct client insert still works for older clients', async () => {
  await as('anon', null, "insert into public.user_bug_reports (report_id, title) values ('rpt_old', 'old client')");
  assert.equal((await rows()).length, 1);
});
await t('a re-paste of the whole file is safe and keeps the rows', async () => {
  await submit('anon', null, 'rpt_1', 't', null);
  await db.exec(read(FILE));
  assert.equal((await rows()).length, 1);
  await rejects(as('anon', null, "update public.user_bug_reports set title = 'x'"));
});
await t('the ROLLBACK line restores the old policy and drops the function and column, then the file applies again', async () => {
  await db.exec(rollbackSql());
  assert.equal((await db.query("select count(*)::int c from pg_policies where tablename='user_bug_reports' and policyname='user_bug_reports_update_own_open'")).rows[0].c, 1);
  assert.equal((await db.query("select count(*)::int c from pg_proc where proname='submit_bug_report'")).rows[0].c, 0);
  assert.equal((await db.query("select count(*)::int c from information_schema.columns where table_name='user_bug_reports' and column_name='fixed_notified_at'")).rows[0].c, 0);
  assert.equal((await db.query("select has_table_privilege('anon','public.user_bug_reports','UPDATE') p")).rows[0].p, true);
  await db.exec(read(FILE));
  assert.equal((await submit('anon', null, 'rpt_9', 't', null)).rows.length, 1);
  assert.equal((await db.query("select has_table_privilege('anon','public.user_bug_reports','UPDATE') p")).rows[0].p, false);
});

console.log('bug-reports-db: ' + n + '/' + (n + failed) + ' passed');
if (failed) process.exit(1);
