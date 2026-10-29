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
//   - Supabase's default privileges: new public functions are executable by anon, authenticated and service_role,
//     so every REVOKE in the migration is tested against the grants it has to undo
//   - supabase_auth_admin may read and update auth.users (GoTrue's role; it fires the sign-in trigger)
// Every listed migration loads in PGlite with only these stand-ins; no statement needed stubbing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = [
  '20260506_phase_c_prime.sql', '20260509_phase_e_subscriptions.sql', '20260509_notify_signups.sql',
  '20260511_diagnostic_pending.sql', '20260511_web_vitals.sql', '20260529_ai_proxy_rate_limit.sql', '20260531_phase5_admin_audit_log.sql',
  '20260718_client_errors.sql', '20260718_user_bug_reports.sql',
];
const PRELUDE = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create role supabase_auth_admin nologin;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}',
    last_sign_in_at timestamptz, created_at timestamptz default now());
  grant usage on schema auth to supabase_auth_admin;
  grant select, update on auth.users to supabase_auth_admin;
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

await t('a sign-in fired as supabase_auth_admin (as GoTrue does) still cancels', async () => {
  await mark(A);
  await db.exec('set role supabase_auth_admin');
  try { await signIn(A, "now() + interval '1 second'"); }
  finally { await db.exec('reset role'); }
  const m = await meta(A);
  assert.equal(m.deletion_requested_at, undefined, 'mark gone');
  assert.ok(m.deletion_cancelled_at, 'notice set');
});

await t('the cancel trigger waits at most 2s for a row lock', async () => {
  const r = (await db.query("select proconfig from pg_proc where oid = 'public.cancel_deletion_on_signin()'::regprocedure")).rows[0];
  assert.ok((r.proconfig || []).includes('lock_timeout=2s'), String(r.proconfig));
});

// ── The purge ────────────────────────────────────────────────────────────
// A: marked 8 days ago (due), auth email Simi@X.com, profile email Simi.Profile@X.com. B: marked 6 days ago.
// C: unmarked, other@x.com. D: an unparseable mark. Each has a row of every kind the purge touches.
const C = '00000000-0000-0000-0000-00000000000c', D = '00000000-0000-0000-0000-00000000000d';
const E = '00000000-0000-0000-0000-00000000000e';
const PURGE_TABLES = ['admin_audit_log', 'waitlist', 'notify_signups', 'diagnostic_pending', 'client_errors', 'user_bug_reports', 'ai_proxy_rate_limit'];
async function seedUser(id, email, markJson, listEmails = [email]) {
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, email]);
  if (markJson !== undefined) {
    await db.query("update public.profiles set metadata = metadata || jsonb_build_object('deletion_requested_at', " + markJson + ') where id = $1', [id]);
  }
  await db.query("insert into public.quiz_history (user_id, cert, score, total) values ($1, 'secplus', 3, 5)", [id]);
  await db.query("insert into public.cert_entitlements (user_id, cert) values ($1, 'secplus')", [id]); // writes an audit row
  await db.query('insert into public.subscriptions (user_id) values ($1)', [id]); // writes an audit row
  await db.query('insert into public.ai_usage (user_id, call_date, call_count) values ($1, current_date, 2)', [id]);
  await db.query('insert into public.web_vitals (user_id, lcp_ms) values ($1, 1200)', [id]);
  await db.query("insert into public.client_errors (fingerprint, type, message, user_id) values ('fp', 'error', 'boom', $1)", [id]);
  await db.query("insert into public.user_bug_reports (report_id, title, user_id) values ($2, 'broken', $1)", [id, 'r-' + id]);
  await db.query("insert into public.admin_audit_log (actor_id, action, target_table, target_op, target_id, old_data, new_data) values ($1, 'role_change', 'profiles', 'UPDATE', $2, '{\"role\":\"user\"}', '{\"role\":\"admin\"}')", [id, id]);
  await db.query("insert into public.ai_proxy_rate_limit (key, call_count) values ('user:' || $1, 7)", [id]);
  for (const [i, e] of listEmails.entries()) {
    await db.query("insert into public.waitlist (email, cert) values ($1, 'AZ-900')", [e]);
    await db.query("insert into public.notify_signups (email, cert) values ($1, 'CCNA')", [e]);
    await db.query("insert into public.diagnostic_pending (token, email, cert, results) values ($1, $2, 'secplus', '{}')", ['tok-' + id + '-' + i, e]);
  }
}
async function seed() {
  await db.exec('delete from auth.users; truncate ' + PURGE_TABLES.map((x) => 'public.' + x).join(', ') + ';');
  await seedUser(A, 'Simi@X.com', "now() - interval '8 days'", ['simi@x.com', 'SIMI.PROFILE@x.com']);
  await db.query("update public.profiles set email = 'Simi.Profile@X.com' where id = $1", [A]);
  await seedUser(B, 'b@x.com', "now() - interval '6 days'");
  await seedUser(C, 'other@x.com', undefined, ['other@x.com', 'xsimi@x.com']);
  await seedUser(D, 'd@x.com', "'not a date'::text");
  await db.query("insert into public.ai_proxy_rate_limit (key) values ('ip:abc'), ('global:daily')");
}
const purge = async () => (await db.query('select public.purge_deleted_accounts() as n')).rows[0].n;
const count = async (sql, params) => Number((await db.query('select count(*)::int as c from ' + sql, params)).rows[0].c);
const USER_TABLES = ['public.profiles where id = $1', 'public.quiz_history where user_id = $1', 'public.cert_entitlements where user_id = $1',
  'public.subscriptions where user_id = $1', 'public.ai_usage where user_id = $1', 'public.web_vitals where user_id = $1'];
// Every row any user owns, in a stable order: the before/after picture for "untouched" and "changes nothing".
async function dump(where = 'true') {
  const out = {};
  for (const tb of ['auth.users', 'public.profiles', 'public.quiz_history', 'public.cert_entitlements', 'public.subscriptions',
    'public.ai_usage', 'public.web_vitals', ...PURGE_TABLES.map((x) => 'public.' + x)]) {
    out[tb] = (await db.query('select to_jsonb(x) j from ' + tb + ' x where ' + where + ' order by to_jsonb(x)::text')).rows.map((r) => r.j);
  }
  return out;
}
// Rows mentioning any of these ids or emails anywhere (as a whole JSON string value, or a 'user:<id>' rate-limit
// key; case-insensitive).
const others = (ids, emails) => "(to_jsonb(x)::text ~* '\"(user:)?(" + [...ids, ...emails].join('|').replace(/\./g, '\\.') + ")\"')";

await t('the purge removes A and every cascaded row, and returns 1', async () => {
  await seed();
  assert.equal(await purge(), 1);
  assert.equal(await count('auth.users where id = $1', [A]), 0, 'auth.users');
  for (const tb of USER_TABLES) assert.equal(await count(tb, [A]), 0, tb);
  assert.equal(await count('public.ai_proxy_rate_limit where key = $1', ['user:' + A]), 0, "A's AI rate-limit row");
  assert.equal(await count("public.ai_proxy_rate_limit where key in ('ip:abc', 'global:daily')"), 2, 'non-user keys stay');
  assert.equal(await count('public.ai_proxy_rate_limit'), 5, 'B, C, D keep theirs');
});

await t('an account whose mark was cleared after the run started is skipped, not deleted', async () => {
  // A sign-in can commit between the purge reading its list and reaching an account. In one connection the
  // same thing happens when purging A (first, by id) clears E's mark: E is still on the list, so only the
  // locked re-check keeps E alive.
  await seed();
  await seedUser(E, 'e@x.com', "now() - interval '9 days'");
  await db.exec(`create function public.t_reclaim_e() returns trigger language plpgsql as $f$
    begin
      if old.id = '${A}' then
        update public.profiles set metadata = (metadata - 'deletion_requested_at')
          || jsonb_build_object('deletion_cancelled_at', now()) where id = '${E}';
      end if;
      return old;
    end $f$;
    create trigger t_reclaim_e after delete on public.profiles for each row execute function public.t_reclaim_e();`);
  try {
    const beforeE = (await dump(others([E], ['e@x.com'])));
    assert.equal(await purge(), 1, 'only A');
    assert.equal(await count('auth.users where id = $1', [A]), 0, 'A purged');
    const afterE = await dump(others([E], ['e@x.com']));
    assert.equal(afterE['auth.users'].length, 1, 'E kept');
    assert.ok(afterE['public.profiles'][0].metadata.deletion_cancelled_at, 'E reclaimed');
    afterE['public.profiles'] = beforeE['public.profiles'] = [];
    assert.deepEqual(afterE, beforeE, "E's other rows untouched");
  } finally { await db.exec('drop trigger t_reclaim_e on public.profiles; drop function public.t_reclaim_e();'); }
});

await t('the purge waits at most 5s for a row lock', async () => {
  const r = (await db.query("select proconfig from pg_proc where oid = 'public.purge_deleted_accounts()'::regprocedure")).rows[0];
  assert.ok((r.proconfig || []).includes('lock_timeout=5s'), String(r.proconfig));
});

await t("A's error and bug reports stay with user_id null", async () => {
  await seed();
  const before = await count('public.client_errors') + await count('public.user_bug_reports');
  await purge();
  assert.equal(await count('public.client_errors') + await count('public.user_bug_reports'), before, 'no report deleted');
  assert.equal(await count('public.client_errors where user_id = $1', [A]), 0);
  assert.equal(await count('public.user_bug_reports where user_id = $1', [A]), 0);
  assert.equal(await count('public.client_errors where user_id is null'), 1);
  assert.equal(await count("public.user_bug_reports where user_id is null and report_id = $1", ['r-' + A]), 1);
});

await t("A's waitlist, notify and diagnostic rows go by either email, case-insensitively", async () => {
  await seed();
  await purge();
  for (const tb of ['public.waitlist', 'public.notify_signups', 'public.diagnostic_pending']) {
    assert.equal(await count(tb + " where lower(email) in ('simi@x.com', 'simi.profile@x.com')"), 0, tb + ': A gone');
    assert.equal(await count(tb + " where email in ('other@x.com', 'xsimi@x.com', 'b@x.com', 'd@x.com')"), 4, tb + ': others stay');
  }
});

await t("A's audit rows stay with actor_id, target_id, old_data, new_data null; no new audit rows appear", async () => {
  await seed();
  // A as an admin acting on C: A's id goes, C's stays.
  await db.query("insert into public.admin_audit_log (actor_id, action, target_table, target_op, target_id, old_data, new_data) values ($1, 'role_change', 'profiles', 'UPDATE', $2, '{}', '{}')", [A, C]);
  const before = await count('public.admin_audit_log');
  // About A: A's role_change row, the subscription rows (target_id = A), the entitlement rows (A only inside
  // new_data.user_id; target_id is the entitlement's own id) and A acting on C.
  const aRows = await count('public.admin_audit_log x where ' + others([A], []));
  assert.ok(aRows >= 4, 'seed has audit rows about A: ' + aRows);
  assert.ok(await count("public.admin_audit_log x where action = 'entitlement_write' and target_id <> $1 and " + others([A], []), [A]) >= 1,
    'an entitlement row names A only inside its data');
  await db.exec('begin');
  try {
    await purge();
    // Same transaction, after the purge: an ordinary write is audited again (the flag does not leak).
    await db.query("insert into public.cert_entitlements (user_id, cert) values ($1, 'post-purge')", [C]);
  } finally { await db.exec('commit'); }
  assert.equal(await count('public.admin_audit_log'), before + 1, 'only the post-purge write was audited');
  assert.equal(await count('public.admin_audit_log x where ' + others([A, 'simi@x.com', 'simi.profile@x.com'], [])), 0, 'A appears in no audit row');
  assert.equal(await count('public.admin_audit_log where old_data is null and new_data is null'), aRows, 'the rows about A stay, stripped');
  assert.equal(await count("public.admin_audit_log where actor_id is null and target_id is null and action = 'role_change'"), 1, 'A on A: both ids gone');
  const cross = (await db.query("select * from public.admin_audit_log where target_id = $1 and action = 'role_change' and actor_id is null", [C])).rows;
  assert.equal(cross.length, 1, 'A acting on C: actor blanked, C kept');
  assert.equal(cross[0].old_data, null); assert.equal(cross[0].new_data, null);
  assert.equal(cross[0].target_table, 'profiles'); assert.equal(cross[0].target_op, 'UPDATE');
  assert.equal(await count("public.admin_audit_log where action in ('subscription_write', 'entitlement_write') and target_op = 'DELETE'"), 0, 'the cascade wrote no audit rows');
});

await t('B (6 days), C (unmarked) and D (unparseable) and all their rows are untouched', async () => {
  await seed();
  const where = others([B, C, D], ['b@x.com', 'other@x.com', 'xsimi@x.com', 'd@x.com']) + ' and not ' + others([A], []);
  const before = await dump(where);
  assert.ok(before['public.waitlist'].length === 4 && before['public.profiles'].length === 3, 'seed sanity');
  await purge();
  assert.deepEqual(await dump(where), before);
});

await t('a failing account does not stop the next one', async () => {
  await seed();
  await seedUser(E, 'e@x.com', "now() - interval '9 days'");
  await db.exec(`create function public.t_block_a() returns trigger language plpgsql as $f$
    begin if old.id = '${A}' then raise exception 'blocked for test'; end if; return old; end $f$;
    create trigger t_block_a before delete on public.profiles for each row execute function public.t_block_a();`);
  try {
    const beforeA = await dump(others([A], ['simi@x.com', 'simi.profile@x.com']));
    assert.equal(await purge(), 1);
    assert.equal(await count('auth.users where id = $1', [E]), 0, 'E purged');
    assert.deepEqual(await dump(others([A], ['simi@x.com', 'simi.profile@x.com'])), beforeA, 'A rolled back whole');
  } finally { await db.exec('drop trigger t_block_a on public.profiles; drop function public.t_block_a();'); }
});

await t('a second run purges 0 and changes nothing', async () => {
  await seed();
  assert.equal(await purge(), 1);
  const before = await dump();
  assert.equal(await purge(), 0);
  assert.deepEqual(await dump(), before);
});

await t('authenticated and service_role cannot execute the purge', async () => {
  await seed();
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const r = (await db.query("select has_function_privilege($1, 'public.purge_deleted_accounts()', 'execute') ok", [role])).rows[0];
    assert.equal(r.ok, false, role + ' holds EXECUTE');
    await db.exec('set role ' + role);
    try { await assert.rejects(db.query('select public.purge_deleted_accounts()'), /permission denied/, role); }
    finally { await db.exec('reset role'); }
  }
  assert.equal(await count('auth.users where id = $1', [A]), 1, 'nothing purged');
});

await t('a sign-in after the mark that the cancel trigger missed still keeps the account', async () => {
  // The trigger can miss a sign-in (its 2s lock wait timed out), or a stale whole-metadata write can put a
  // cancelled mark back. The purge's locked re-check compares the mark with last_sign_in_at itself.
  await db.query("update public.profiles set metadata = metadata || jsonb_build_object('deletion_requested_at', now() - interval '8 days') where id = $1", [A]);
  await db.exec('alter table auth.users disable trigger on_signin_cancel_deletion');
  try { await signIn(A, "now() - interval '2 days'"); }
  finally { await db.exec('alter table auth.users enable trigger on_signin_cancel_deletion'); }
  assert.ok((await meta(A)).deletion_requested_at, 'setup: the mark is still there');
  assert.equal(await purge(), 0);
  assert.equal(await count('auth.users where id = $1', [A]), 1, 'A kept');
  assert.equal(await count('public.profiles where id = $1', [A]), 1, "A's profile kept");
});

await t('running the migration re-stamps marks from before 29 Oct to now, once, and leaves newer marks alone', async () => {
  const file = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20261029_account_deletion.sql'), 'utf8');
  await setMeta(A, { keep: 1, deletion_requested_at: '2026-10-01T00:00:00Z' }); // an old-flow mark: would be due at once
  const atB = await mark(B); // a new-flow mark
  await db.exec(file);
  const a1 = (await meta(A)).deletion_requested_at;
  assert.ok(Math.abs(new Date(a1) - Date.now()) < 5000, 'A re-stamped to now: ' + a1);
  assert.equal((await meta(A)).keep, 1, 'other keys stay');
  assert.equal(new Date((await meta(B)).deletion_requested_at).getTime(), new Date(atB).getTime(), "B's mark untouched");
  assert.equal(await purge(), 0, 'nothing due straight after the migration');
  assert.equal(await count('auth.users where id = $1', [A]), 1, 'A kept');
  await db.exec(file);
  assert.equal((await meta(A)).deletion_requested_at, a1, 'a second run does not extend it again');
});

await t('running the migration cancels a pre-29 Oct mark when the person signed in after it', async () => {
  // The old flow never cleared a mark on sign-in; a later sign-in is the cancel the trigger would have made.
  const file = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20261029_account_deletion.sql'), 'utf8');
  await setMeta(A, { keep: 1, deletion_requested_at: '2026-10-01T00:00:00Z' });
  await db.exec('alter table auth.users disable trigger on_signin_cancel_deletion');
  try { await signIn(A, "'2026-10-05T00:00:00Z'"); }
  finally { await db.exec('alter table auth.users enable trigger on_signin_cancel_deletion'); }
  await db.exec(file);
  const m = await meta(A);
  assert.equal(m.deletion_requested_at, undefined, 'mark removed');
  assert.ok(Math.abs(new Date(m.deletion_cancelled_at) - Date.now()) < 5000, 'notice set to now: ' + m.deletion_cancelled_at);
  assert.equal(m.keep, 1, 'other keys stay');
  assert.equal(await purge(), 0);
  assert.equal(await count('auth.users where id = $1', [A]), 1, 'A kept');
  await db.exec(file);
  assert.deepEqual(await meta(A), m, 'a second run changes nothing');
});

// Last: it removes what every case above depends on.
await t('the rollback removes the trigger, the five functions and restores admin_audit_record', async () => {
  const file = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20261029_account_deletion.sql'), 'utf8');
  const at = file.lastIndexOf('\n-- ROLLBACK:');
  assert.ok(at > 0, 'ROLLBACK marker');
  const rollback = file.slice(file.indexOf('\n', at + 1) + 1).split('\n').map((l) => {
    assert.ok(l === '' || l.startsWith('--'), 'every rollback line is commented: ' + l);
    return l.replace(/^-- ?/, '');
  }).join('\n');
  await db.exec(rollback);
  assert.equal((await db.query("select count(*)::int c from pg_trigger where tgname = 'on_signin_cancel_deletion'")).rows[0].c, 0, 'trigger');
  for (const fn of ['purge_deleted_accounts()', 'cancel_deletion_on_signin()', 'request_account_deletion()', 'clear_deletion_notice()', 'safe_timestamptz(text)']) {
    assert.equal((await db.query('select to_regprocedure($1) p', ['public.' + fn])).rows[0].p, null, fn);
  }
  const original = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20260531_phase5_admin_audit_log.sql'), 'utf8').match(/as \$audit_fn\$([\s\S]*?)\$audit_fn\$/)[1];
  const live = (await db.query("select prosrc, prosecdef, proconfig from pg_proc where oid = 'public.admin_audit_record()'::regprocedure")).rows[0];
  assert.equal(live.prosrc, original, 'admin_audit_record body is the original, verbatim');
  assert.equal(live.prosecdef, true); assert.deepEqual(live.proconfig, ['search_path=public']);
  const before = await count('public.admin_audit_log');
  await db.exec("begin; select set_config('certanvil.purging', 'on', true);");
  try { await db.query('insert into public.subscriptions (user_id) values ($1)', [B]); }
  finally { await db.exec('commit'); }
  assert.ok(await count('public.admin_audit_log') > before, 'audited even with the flag on');
  assert.equal(await count("public.admin_audit_log where id > (select max(id) from public.admin_audit_log) - 5 and target_id = $1 and action = 'subscription_write' and target_op = 'INSERT'", [B]), 1);
});

console.log('deletion-db: ' + n + '/' + (n + failed) + ' passed');
if (failed) process.exit(1);
