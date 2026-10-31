// Stage 5d: the reminder planner (features/ios-reminders.js planReminders), run in TZ=Europe/London so the
// clock-change weeks are real. Run: TZ=Europe/London node --experimental-detect-module tests/reminders-planner.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'features/ios-reminders.js'), 'utf8');
const m = src.match(/\/\/ <planner>([\s\S]*?)\/\/ <\/planner>/);
if (!m) { console.error('planner block not found'); process.exit(1); }
const planReminders = new Function(m[1] + '; return planReminders;')();

let n = 0; const t = (name, fn) => { fn(); n++; console.log('  ok', name); };
const at = (y, mo, d, h, mi, s) => new Date(y, mo - 1, d, h, mi, s || 0);
const base = { counts: [6, 0, 0, 3, 0, 0, 0], daysToExam: 7, certName: 'Security+', pro: false, studiedToday: false };
const ON = { on: true, time: '19:00' };
const plan = (now, d, s) => planReminders(now, s || ON, Object.assign({}, base, d || {}));
const local = (dt) => [dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes()];

t('7 items, ids 5001..5007, each at 19:00 local on consecutive days', () => {
  const r = plan(at(2026, 10, 29, 10, 0));
  assert.equal(r.length, 7);
  assert.deepEqual(r.map((x) => x.id), [5001, 5002, 5003, 5004, 5005, 5006, 5007]);
  r.forEach((x, k) => assert.equal(x.at.getTime(), new Date(2026, 9, 29 + k, 19, 0, 0, 0).getTime()));
  r.forEach((x) => assert.equal(x.title, 'CertAnvil'));
});
t('day 0 (exam in 7) is the countdown line, not the 6 reviews', () => {
  assert.equal(plan(at(2026, 10, 29, 10, 0))[0].body, 'Your Security+ exam is in 7 days. A quick session keeps you on track.');
});
t('day 3 shows "3 review cards are due. About 2 minutes."', () => {
  assert.equal(plan(at(2026, 10, 29, 10, 0))[3].body, '3 review cards are due. About 2 minutes.');
});
t('20 reviews estimate 10 minutes', () => {
  assert.equal(plan(at(2026, 10, 29, 10, 0), { counts: [0, 20, 0, 0, 0, 0, 0], daysToExam: null })[1].body, '20 review cards are due. About 10 minutes.');
});
t('days with no reviews and no countdown show the free practice line', () => {
  assert.equal(plan(at(2026, 10, 29, 10, 0))[1].body, 'Your 15 questions for today are waiting.');
});
t('Pro practice line never contains 15', () => {
  const r = plan(at(2026, 10, 29, 10, 0), { pro: true });
  assert.equal(r[1].body, 'Your daily practice is waiting.');
  r.forEach((x) => assert.ok(!/15/.test(x.body)));
});
t('exam in 1 day uses the tomorrow line; exam day and after have no countdown', () => {
  const r = plan(at(2026, 10, 29, 10, 0), { daysToExam: 2, counts: [0, 0, 0, 0, 0, 0, 0] });
  assert.equal(r[1].body, 'Your Security+ exam is tomorrow. One last warm-up?');
  assert.equal(r[2].body, 'Your 15 questions for today are waiting.');   // exam day
  assert.equal(r[3].body, 'Your 15 questions for today are waiting.');   // after
  assert.equal(r[0].body, 'Your 15 questions for today are waiting.');   // 2 days out is not a countdown day
});
t('countdown fires on 14, 7, 3 and 1 only', () => {
  const r = plan(at(2026, 10, 29, 10, 0), { daysToExam: 14, counts: [0, 0, 0, 0, 0, 0, 0] });
  assert.match(r[0].body, /in 14 days/);
  assert.ok(r.slice(1).every((x) => !/exam/.test(x.body)));
  const r2 = plan(at(2026, 10, 29, 10, 0), { daysToExam: 4, counts: [0, 0, 0, 0, 0, 0, 0] });
  assert.match(r2[1].body, /in 3 days/); assert.match(r2[3].body, /tomorrow/);
});
t('no exam date means no countdown on any day', () => {
  plan(at(2026, 10, 29, 10, 0), { daysToExam: null }).forEach((x) => assert.ok(!/exam/.test(x.body)));
});
t('studiedToday drops day 0; 6 items remain', () => {
  const r = plan(at(2026, 10, 29, 10, 0), { studiedToday: true });
  assert.equal(r.length, 6); assert.equal(r[0].id, 5002);
});
t('now = 18:59:30 with time 19:00 drops day 0 (under 60 s)', () => {
  const r = plan(at(2026, 10, 29, 18, 59, 30));
  assert.equal(r.length, 6); assert.equal(r[0].id, 5002);
});
t('now = 18:58:30 keeps day 0 (90 s ahead)', () => {
  assert.equal(plan(at(2026, 10, 29, 18, 58, 30))[0].id, 5001);
});
t('the October clock change keeps 19:00 local on both sides (25 Oct 2026)', () => {
  const r = plan(at(2026, 10, 23, 10, 0), { daysToExam: null });
  r.forEach((x) => assert.equal(x.at.getHours(), 19));
  assert.equal(r[2].at.getTime() - r[1].at.getTime(), 25 * 3600e3);   // 24 Oct → 25 Oct: the 25-hour day
});
t('the March clock change keeps 19:00 local on both sides (29 Mar 2026)', () => {
  const r = plan(at(2026, 3, 27, 10, 0), { daysToExam: null });
  r.forEach((x) => assert.equal(x.at.getHours(), 19));
  assert.equal(r[2].at.getTime() - r[1].at.getTime(), 23 * 3600e3);   // 28 Mar → 29 Mar: the 23-hour day
});
t('on: false gives nothing', () => {
  assert.deepEqual(planReminders(at(2026, 10, 29, 10, 0), { on: false, time: '19:00' }, base), []);
});
t('1 review uses the singular line', () => {
  assert.equal(plan(at(2026, 10, 29, 10, 0), { counts: [0, 1, 0, 0, 0, 0, 0], daysToExam: null })[1].body, '1 review card is due. About 2 minutes.');
});
t('a 07:30 time lands at 07:30', () => {
  const r = plan(at(2026, 10, 29, 6, 0), null, { on: true, time: '07:30' });
  assert.deepEqual([r[0].at.getHours(), r[0].at.getMinutes()], [7, 30]);
});

// ── Persona bundle T5: streak warnings, last call, drift ──
const NOW = at(2026, 10, 29, 10, 0);   // 29 Oct 2026, local day 2026-10-29
const noExam = { daysToExam: null, counts: [0, 0, 0, 0, 0, 0, 0] };
const alive = (extra) => Object.assign({ streak: { current: 5, lastDay: '2026-10-28' } }, noExam, extra || {});
t('streak alive, not studied: k=0 is the streak line, kind streak', () => {
  const r = plan(NOW, alive());
  assert.equal(r[0].body, 'Your 5-day streak ends tonight. One question keeps it.');
  assert.equal(r[0].extra.kind, 'streak');
  assert.equal(r[1].extra.kind, 'daily');
  assert.ok(r.slice(1).filter((x) => x.id < 5008).every((x) => !/streak/.test(x.body)));
});
t('studied today: k=1 carries the streak line, k>=2 does not', () => {
  const r = plan(NOW, alive({ studiedToday: true, streak: { current: 5, lastDay: '2026-10-29' } }));
  assert.equal(r[0].id, 5002);
  assert.equal(r[0].body, 'Your 5-day streak ends tonight. One question keeps it.');
  assert.ok(r.slice(1).filter((x) => x.id < 5008).every((x) => !/streak/.test(x.body)));
});
t('an ended streak (lastDay before yesterday) gets no streak line or last call', () => {
  const r = plan(NOW, alive({ streak: { current: 5, lastDay: '2026-10-26' } }));
  assert.ok(r.every((x) => !/streak/.test(x.body)));
  assert.ok(!r.some((x) => x.id === 5008));
});
t('last call: 21:00 tonight, id 5008, only when time < 21:00, now < 21:00 and not studied', () => {
  const r = plan(NOW, alive());
  const lc = r.find((x) => x.id === 5008);
  assert.equal(lc.body, 'Last call: your 5-day streak ends at midnight. One question keeps it.');
  assert.deepEqual(local(lc.at), [2026, 10, 29, 21, 0]);
  assert.equal(lc.extra.kind, 'streak');
  assert.ok(!plan(NOW, alive({ studiedToday: true })).some((x) => x.id === 5008));
  assert.ok(!plan(at(2026, 10, 29, 21, 0, 0), alive()).some((x) => x.id === 5008));
  assert.ok(!plan(NOW, alive(), { on: true, time: '21:30' }).some((x) => x.id === 5008));
  assert.ok(!plan(NOW, noExam).some((x) => x.id === 5008));
});
t('never more than 2 on one day', () => {
  const r = plan(NOW, alive({ lastStudyDay: '2026-10-28' }));
  const by = {}; r.forEach((x) => { const k = local(x.at).slice(0, 3).join('-'); by[k] = (by[k] || 0) + 1; });
  assert.ok(Object.values(by).every((c) => c <= 2));
  assert.equal(by['2026-10-29'], 2);
});
t('exam tomorrow wins over the streak line', () => {
  const r = plan(NOW, alive({ daysToExam: 1 }));
  assert.equal(r[0].body, 'Your Security+ exam is tomorrow. One last warm-up?');
});
t('drift: 3+ days since study, the daily line is "It\'s been N days"', () => {
  const r = plan(NOW, Object.assign({ lastStudyDay: '2026-10-26' }, noExam));   // 3 days ago
  assert.equal(r[0].body, 'It\'s been 3 days. A 5-minute warm-up gets you going again.');
  assert.equal(r[0].extra.kind, 'drift');
  assert.equal(r[1].body, 'It\'s been 4 days. A 5-minute warm-up gets you going again.');
});
t('under 3 days since study keeps the normal line', () => {
  const r = plan(NOW, Object.assign({ lastStudyDay: '2026-10-27' }, noExam));   // 2 days ago
  assert.equal(r[0].body, 'Your 15 questions for today are waiting.');
  assert.equal(r[1].body, 'It\'s been 3 days. A 5-minute warm-up gets you going again.');
});
t('drift nudges: ids 5009 and 5010 on day 10 and day 21 after the last study, at the chosen time', () => {
  const r = plan(NOW, Object.assign({ lastStudyDay: '2026-10-29', studiedToday: true }, noExam));
  const a = r.find((x) => x.id === 5009), b = r.find((x) => x.id === 5010);
  assert.equal(a.body, 'One question, about a minute. Your Security+ progress is still here.');
  assert.deepEqual(local(a.at), [2026, 11, 8, 19, 0]);   // 29 Oct + 10
  assert.deepEqual(local(b.at), [2026, 11, 19, 19, 0]);  // 29 Oct + 21
  assert.equal(a.extra.kind, 'drift');
});
t('no drift nudges without a last study day; none inside the 7-day window', () => {
  assert.ok(!plan(NOW, noExam).some((x) => x.id >= 5009));
  const r = plan(NOW, Object.assign({ lastStudyDay: '2026-10-22' }, noExam));   // day 10 = 1 Nov, 3 days away
  assert.ok(!r.some((x) => x.id === 5009));
  assert.ok(r.some((x) => x.id === 5010));
});
t('a review day counts as studied (studiedToday drops today\'s nag)', () => {
  const r = plan(NOW, Object.assign({ studiedToday: true }, noExam));
  assert.equal(r[0].id, 5002);
});
t('daily items always carry extra.kind', () => {
  plan(NOW).forEach((x) => assert.ok(['streak', 'daily', 'drift'].includes(x.extra.kind)));
});

console.log('reminders-planner: ' + n + '/' + n + ' passed');
