// tests/uat/529-cert-requests-admin.js
// Scope: persona bundle Task 15. The admin Cert requests section (landing/lib/admin.js + landing/admin.html), the Monday
// digest wiring (vercel.json cron) and the two endpoints' static guarantees. Behaviour of the endpoints themselves is in
// tests/api/*.test.mjs (fetch stubbed). Spec: 2026-10-30-ai-budget-fast-start-suggest-design.md §3
const fs = require('fs');
const path = require('path');
const { test, vm } = require('./_context');

(function () {
  console.log('\n\x1b[1m── Admin cert requests ──\x1b[0m');
  const ROOT = path.resolve(__dirname, '..', '..');
  const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const adminjs = rd('landing/lib/admin.js'), adminht = rd('landing/admin.html'), vercel = JSON.parse(rd('landing/vercel.json'));
  const digest = rd('landing/api/admin/cert-requests-digest.js'), notify = rd('landing/api/admin/notify-cert-live.js'), lib = rd('landing/api/_lib/admin-mail.js');

  // Run the real functions against a fake tbody.
  const names = ['escapeHtml', 'formatRelative', 'glyph', 'nextMonday', 'buildCertRequestsModel', 'renderMailPreview', 'renderCertRequests'];
  function fnSrc(n) { // _fnBody returns the body only; rebuild from the file text
    const i = adminjs.indexOf('function ' + n + '('); let d = 0, j = adminjs.indexOf('{', i);
    for (let k = j; k < adminjs.length; k++) { if (adminjs[k] === '{') d++; else if (adminjs[k] === '}' && --d === 0) return adminjs.slice(i, k + 1); }
    return '';
  }
  const els = {};
  const el = (id) => (els[id] = els[id] || { id, innerHTML: '', textContent: '', hidden: true });
  const ctx = vm.createContext({ document: { getElementById: el }, window: {}, Date, Math, Object, Array, String, Number, parseInt, isNaN });
  vm.runInContext('var elRequestsTbody = document.getElementById("requests-tbody"); function sanitizeRows(x){return x;}\n' + names.map(fnSrc).join('\n'), ctx);

  const tally = [
    { exam_key: 'ccna', label: 'CCNA', votes: 41, new_7d: 5, last_at: new Date().toISOString(), typed: false },
    { exam_key: 'itil 4', label: 'ITIL 4', votes: 6, new_7d: 2, last_at: new Date().toISOString(), typed: true },
    { exam_key: 'x', label: '<img src=x onerror=alert(1)>', votes: 1, new_7d: 1, last_at: new Date().toISOString(), typed: true },
  ];
  const raw = [
    { user_id: 'a', exam_key: 'ccna', label: 'CCNA', notified_at: null }, { user_id: 'b', exam_key: 'ccna', label: 'CCNA', notified_at: '2026-10-01' },
    { user_id: 'a', exam_key: 'itil 4', label: 'ITIL 4', notified_at: null }, { user_id: 'c', exam_key: 'itil 4', label: 'itil v4', notified_at: null },
  ];
  ctx.__d = { tally, raw };
  vm.runInContext('renderCertRequests(__d)', ctx);
  const html = els['requests-tbody'].innerHTML;

  test('admin rows: a typed label with <img onerror> is escaped, never a live tag', !/<img/i.test(html) && html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  test('admin rows: sorted as given (votes order kept), bar widths scale to the top row', html.indexOf('CCNA') < html.indexOf('ITIL 4') && html.includes('width:100%'));
  test('admin rows: the button carries the un-notified count for the confirm text', /data-key="ccna"[^>]*data-pending="1"/.test(html) && /data-key="itil 4"[^>]*data-pending="2"/.test(html));
  test('admin rows: typed rows show the Typed tag and the other ways it was written', html.includes('cr-tag">Typed') && html.includes('Also written: itil v4'));
  test('admin strip: totals, people, this week, exams, typed count',
    els['cr-total'].textContent === '48' && els['cr-people'].textContent === 'from 3 people' && els['cr-week'].textContent === '+8' && els['cr-exams'].textContent === '3' && els['cr-typed'].textContent === '2 typed in');
  test('admin mail preview: subject uses the week total and the typed-in line escapes labels', els['cr-mail-subject'].textContent === 'Cert requests this week: 8 new' && !/<img/i.test(els['cr-mail-body'].innerHTML));
  test('next email label is the coming Monday (Sat 31 Oct 2026 -> Mon 2 Nov)', vm.runInContext('nextMonday(new Date(Date.UTC(2026,9,31,12)))', ctx) === 'Mon 2 Nov');
  test('next email label: Monday before 08:00 UTC is today, after is next week',
    vm.runInContext('nextMonday(new Date(Date.UTC(2026,10,2,7)))', ctx) === 'Mon 2 Nov' && vm.runInContext('nextMonday(new Date(Date.UTC(2026,10,2,9)))', ctx) === 'Mon 9 Nov');

  test('admin.js: tally read asks for explicit order votes desc then last_at desc', /from\('cert_request_tally'\)[\s\S]{0,200}order\('votes', \{ ascending: false \}\)\.order\('last_at', \{ ascending: false \}\)/.test(adminjs));
  test('admin.js: confirm text, POST with the access token, inline sent text, button disabled in flight',
    adminjs.includes("'Email ' + n") && adminjs.includes("' that ' + label + ' is live?'") && adminjs.includes("'Bearer ' + token") && adminjs.includes('/api/admin/notify-cert-live') && adminjs.includes("'Sent to '") && adminjs.includes('btn.disabled = true'));
  test('admin.html: Cert requests section sits between Users and Cert packs',
    adminht.indexOf('id="users"') < adminht.indexOf('id="requests"') && adminht.indexOf('id="requests"') < adminht.indexOf('id="certs"'));
  test('vercel.json: Monday 08:00 cron for the digest', (vercel.crons || []).some((c) => c.path === '/api/admin/cert-requests-digest' && c.schedule === '0 8 * * 1'));
  test('digest: GET only, cron secret compared in constant time, explicit tally order, 503 list', digest.includes("req.method !== 'GET'") && digest.includes('safeEqual') && digest.includes('order=votes.desc,last_at.desc') && /CRON_SECRET[\s\S]{0,80}FOUNDER_EMAIL[\s\S]{0,80}RESEND_API_KEY/.test(digest));
  test('notify: POST only, admin checked server-side, exam_key validated, one recipient per email, stamped per row',
    notify.includes("req.method !== 'POST'") && notify.includes('requireAdmin(req)') && notify.includes('validExamKey(examKey)') && notify.includes('to: [email]') && !/['"]?b?cc['"]?\s*:/i.test(notify) && notify.includes("notified_at=is.null"));
  test('shared lib: constant-time compare folds every byte, no secrets in the source', lib.includes('diff |= x[i] ^ y[i]') && !/re_[A-Za-z0-9]{10,}/.test(lib + digest + notify));
  test('copy: no em dashes in the new endpoints or admin additions', !/—/.test(digest + notify + lib));
})();
