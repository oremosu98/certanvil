// ════════════════════════════════════════════════════
// features/ios-signin.js — Stage 5b (28 Oct 2026): sign in by email code inside the iOS app.
// The June E2E (feat/cert-ios-e2e @ a345d1da, HUD "5b ›") drawn for the real app: June's
// first-run and signed-out variants, one "Sign in or create your account" screen with the typo check, the 6-digit
// code screen and its errors, and the one-time toast when the account's free exam opens.
// Pure view functions first (UAT runs each body alone in a vm, so every one carries its
// own escape helper), then the one full-screen host #ios-signin (CA_NATIVE only).
// ════════════════════════════════════════════════════
(function () {
  'use strict';

  // m = {from: 'picker'|'firstrun'|'signedout'|'home'|..., cert, back (firstrun shows Back only when true), email, typo: {fix} | null, msg (a send failure), apple, google (Stage 5c: providers ready), providerErr: 'apple' | 'google'}
  function _isiSignInHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var BRAND_SM = '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M58 12 C42 6, 16 16, 14 34 C12 52, 22 62, 42 64" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><line x1="30" y1="84" x2="70" y2="16" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity="0.55"/><path d="M46 88 L64 50 L82 88 M53 74 L75 74" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2 1.6-3 1.7-3.05-0.93-1.36-2.38-1.55-2.9-1.57-1.23-0.12-2.4 0.72-3.03 0.72-0.62 0-1.59-0.7-2.62-0.68-1.35 0.02-2.6 0.78-3.29 1.99-1.4 2.43-0.36 6.02 1.0 7.99 0.67 0.96 1.46 2.05 2.5 2.0 1.0-0.04 1.38-0.65 2.6-0.65 1.21 0 1.56 0.65 2.62 0.63 1.08-0.02 1.77-0.98 2.43-1.95 0.77-1.11 1.08-2.19 1.1-2.25-0.02-0.01-2.11-0.81-2.13-3.22zM14.5 6.6c0.55-0.67 0.92-1.6 0.82-2.53-0.79 0.03-1.76 0.53-2.33 1.2-0.51 0.59-0.96 1.54-0.84 2.45 0.88 0.07 1.79-0.45 2.35-1.12z"/></svg>';
    var GOOGLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"/></svg>';   // Google's own G mark, unaltered (brand rules)
    var typo = m && m.typo, from = (m && m.from) || 'home', cert = m && m.cert ? '<b>' + e(m.cert) + '</b>' : '';
    var showBack = from === 'signedout' ? false : from === 'firstrun' ? !!(m && m.back === true) : !(m && m.back === false);
    var title = 'Sign in or create your account', sub = '<b>Free to start.</b> No password to remember.';
    if (from === 'firstrun') { title = 'Create your account to start'; sub = (cert ? 'Your ' + cert + ' progress' : 'Your progress') + ' is saved to it, so you keep it if you switch phones.'; }
    else if (from === 'signedout') { title = 'Sign in to keep studying'; sub = (cert ? 'Your ' + cert + ' progress' : 'Your progress') + ' is waiting in your account.'; }
    return '<div class="isi-screen isi-auth">'
      + '<div class="isi-top isi-rv">' + (showBack ? '<button class="isi-back" type="button" data-act="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg></button>' : '')
      + '<span class="isi-mark isi-mark-sm">' + BRAND_SM + '</span><span class="isi-brand-name">CertAnvil</span></div>'
      + '<h1 class="isi-title isi-rv">' + title + '</h1>'
      + '<p class="isi-sub isi-rv">' + sub + '</p>'
      + '<div class="isi-form isi-rv">'
      // 5c removes `hidden` (the provider and its divider stay out of the way until then)
      + '<button class="isi-apple" type="button" data-act="apple"' + (m && m.apple ? '' : ' hidden') + '>' + APPLE + 'Continue with Apple</button>'
      + (m && m.google ? '<button class="isi-google" type="button" data-act="google">' + GOOGLE + 'Continue with Google</button>' : '')
      + (m && m.providerErr ? '<p class="isi-perr" id="isi-perr" role="alert">' + (m.providerErr === 'google' ? 'Google' : 'Apple') + ' sign-in didn\'t finish. Try again, or use your email.</p>' : '')
      + '<div class="isi-field"><label for="isi-email">Email</label><input id="isi-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" value="' + e(m && m.email) + '"' + (typo ? ' aria-invalid="true"' : '') + '></div>'
      + (typo ? '<div class="isi-typo" role="alert"><p>Did you mean <b>' + e(typo.fix) + '</b>?</p><div class="isi-typo-row">'
          + '<button class="isi-primary" type="button" data-act="fix-yes">Yes, fix it</button><button class="isi-outline" type="button" data-act="fix-no">No, keep mine</button></div></div>'
        : '<button class="isi-primary" type="button" data-act="continue">Continue</button>')
      + '<p class="isi-msg err" id="isi-msg" role="alert">' + e(m && m.msg) + '</p>'
      + '<p class="isi-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"></rect><path d="M3 7l9 6 9-6"></path></svg>We\'ll email you a 6-digit code.</p>'
      + '</div>'
      + '<p class="isi-legal">By continuing you agree to our <a href="https://certanvil.com/terms" data-ext>Terms</a> and <a href="https://certanvil.com/privacy" data-ext>Privacy Policy</a>.</p>'
      + '</div>';
  }

  // m = {email, left (seconds until resend), msg, kind: '' | 'err' | 'ok', expired}
  function _isiCodeHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    m = m || {};
    var boxes = '';
    for (var i = 0; i < 6; i++) boxes += '<input inputmode="numeric" pattern="[0-9]*" maxlength="' + (i ? 1 : 6) + '"' + (i ? '' : ' autocomplete="one-time-code"') + ' aria-label="Digit ' + (i + 1) + '">';
    var resend = m.expired ? ''
      : '<p class="isi-resend" id="isi-resend">' + (m.left > 0 ? 'You can resend in <b>' + m.left + 's</b>.' : '<button class="isi-textbtn" type="button" data-act="resend">Resend code</button>') + '</p>';
    return '<div class="isi-screen isi-code">'
      + '<div class="isi-top isi-rv"><button class="isi-back" type="button" data-act="change" aria-label="Back to sign in"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg></button></div>'
      + '<span class="isi-env isi-rv" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5"></rect><path d="M3 7l9 6 9-6"></path></svg></span>'
      + '<h1 class="isi-title isi-rv">Check your email</h1>'
      + '<p class="isi-sub isi-rv">We sent a 6-digit code to <b>' + e(m.email) + '</b>.</p>'
      + '<div class="isi-boxes-wrap isi-rv"><div class="isi-boxes' + (m.kind === 'err' && !m.expired ? ' bad' : '') + '" id="isi-boxes" role="group" aria-label="6-digit code">' + boxes + '</div></div>'
      + '<p class="isi-msg' + (m.kind ? ' ' + m.kind : '') + '" id="isi-msg" role="alert" aria-live="polite">' + e(m.msg) + '</p>'
      + (m.expired ? '<button class="isi-primary" type="button" data-act="send-new">Send a new code</button>' : '')
      + resend
      + '<div class="isi-change isi-rv"><button class="isi-textbtn" type="button" data-act="change">Wrong email? Change it</button></div>'
      + '</div>';
  }

  function _isiToastHtml(certName) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    return '<div class="isi-toast" role="status"><span class="isi-toast-i" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg></span>'
      + '<span class="isi-toast-t">Your free exam on this account is <b>' + e(certName) + '</b>, so we\'ve opened it.</span></div>';
  }

  // The typo check (spec §Sign-in typo check): a domain one or two slips from a common provider (a swapped pair,
  // a missing, extra or wrong letter) gets "Did you mean". Real domains, and anything not close to a provider, pass.
  // Returns the fixed address, or null. (28 Oct: closeness replaced a fixed misspellings list, which missed htomail.com.)
  function _isiSuggest(v) {
    var COMMON = ['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'yahoo.com', 'yahoo.co.uk', 'icloud.com'];
    var REAL = ['mail.com', 'ymail.com', 'gmx.com', 'gmx.co.uk', 'live.com', 'live.co.uk', 'outlook.co.uk', 'me.com', 'mac.com', 'aol.com', 'aol.co.uk', 'msn.com',
      'proton.me', 'protonmail.com', 'btinternet.com', 'sky.com', 'virginmedia.com', 'talktalk.net', 'gmail.co.uk',
      'hotmail.fr', 'hotmail.de', 'hotmail.it', 'hotmail.es', 'outlook.de', 'outlook.fr', 'outlook.es', 'yahoo.fr', 'yahoo.de', 'yahoo.it', 'yahoo.es', 'gmx.de', 'web.de'];
    // edit distance where swapping two neighbouring letters counts as one slip (optimal string alignment)
    function dist(a, b) {
      var d = [], i, j;
      for (i = 0; i <= a.length; i++) { d[i] = [i]; }
      for (j = 0; j <= b.length; j++) { d[0][j] = j; }
      for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      return d[a.length][b.length];
    }
    var m = /^([^@\s]+)@([^@\s]+)$/.exec(String(v == null ? '' : v).trim().toLowerCase());
    if (!m) return null;
    var dom = m[2];
    if (COMMON.indexOf(dom) >= 0 || REAL.indexOf(dom) >= 0) return null;
    var best = null, bestD = 3;
    COMMON.forEach(function (c) {
      var d = dist(dom, c), allowed = c.length >= 9 ? 2 : 1;   // short names get one slip only
      if (d <= allowed && d < bestD) { best = c; bestD = d; }
    });
    return best ? m[1] + '@' + best : null;
  }


  // ── The host (#ios-signin, full screen, the iOS app only) ─────────────
  var PENDING = 'ca_signin_pending', CODE_TTL = 900000, RESEND_MS = 60000;
  var COPY = {
    wrong: "That code isn't right. Check it and try again.", expired: 'That code has expired.',
    rate: 'Give it a minute, then ask for a new code.', net: "Couldn't reach CertAnvil. Check your connection and try again.",
    sent: 'We sent a new code.', checking: 'Checking…',
    refused: "We couldn't send a code just now. Try again in a minute."   // Supabase answered but did not send (e.g. a 500)
  };
  var IS = window.iosSignIn = window.iosSignIn || {};
  var st = { view: null, from: null, email: '', typo: null }, timer = null, busy = false;

  function hostEl() { return document.getElementById('ios-signin'); }
  // Stage 5c: which providers this app can offer (native, plugin present, Google client IDs set)
  function providers() {
    var N = window.caNative, ok = !!(window.CA_NATIVE && N && N.socialReady);
    return { apple: ok && N.socialReady('apple'), google: ok && N.socialReady('google') };
  }
  function sb() { return window.certanvilSupabase || null; }
  // The Supabase chain loads after window.load, so an early tap waits for it (up to 10s) instead of doing nothing.
  function withClient(fn, fail) {
    var t0 = Date.now();
    (function tryNow() {
      var c = sb(); if (c) { fn(c); return; }
      if (Date.now() - t0 < 10000) setTimeout(tryNow, 200); else fail();
    })();
  }
  function readPending() {
    try { var p = JSON.parse(localStorage.getItem(PENDING) || 'null'); return p && p.email && Date.now() - p.sentAt < CODE_TTL ? p : null; } catch (_) { return null; }
  }
  // localStorage, not sessionStorage: iOS can end the app while the user reads Mail, and a cold launch starts a
  // new session (native-shell's ca_launched relies on that). The 15-minute TTL bounds it.
  function writePending(email, sentAt, from, cert, back) { try { localStorage.setItem(PENDING, JSON.stringify({ email: email, sentAt: sentAt, from: from || 'picker', cert: cert || null, back: back === true ? true : (back === false ? false : null) })); } catch (_) {} }
  function clearPending() { try { localStorage.removeItem(PENDING); } catch (_) {} }
  function sentAt() { var p = readPending(); return p ? p.sentAt : 0; }
  function leftSec() { return Math.max(0, Math.ceil((RESEND_MS - (Date.now() - sentAt())) / 1000)); }
  function isNet(err) { return !err || err.status === 0 || err.name === 'AuthRetryableFetchError' || err instanceof TypeError; }

  function show(view, extra) {
    var h = hostEl(); if (!h) return;
    st.view = view; clearInterval(timer);
    var pv = providers();
    if (view === 'signin') h.innerHTML = _isiSignInHtml({ from: st.from, cert: st.cert, back: st.back, email: st.email, typo: st.typo, msg: extra && extra.msg, apple: pv.apple, google: pv.google, providerErr: extra && extra.providerErr });
    else h.innerHTML = _isiCodeHtml(Object.assign({ email: st.email, left: leftSec(), msg: '', kind: '', expired: false }, extra || {}));
    h.hidden = false; document.documentElement.classList.add('isi-open');
    if (view === 'code') wireBoxes(extra && extra.keep);
    if (view === 'signin') { var i = document.getElementById('isi-email'); if (i && !st.typo) setTimeout(function () { try { i.focus(); } catch (_) {} }, 360); }
  }
  function close() {
    var h = hostEl(); clearInterval(timer); st.view = null;
    if (h) { h.hidden = true; h.innerHTML = ''; }
    document.documentElement.classList.remove('isi-open');
  }
  function say(text, kind) { var m = document.getElementById('isi-msg'); if (m) { m.textContent = text || ''; m.className = 'isi-msg' + (kind ? ' ' + kind : ''); } }
  function boxes() { return [].slice.call(document.querySelectorAll('#isi-boxes input')); }
  function code() { return boxes().map(function (i) { return i.value; }).join(''); }
  function tick() {
    var r = document.getElementById('isi-resend'); if (!r) return;
    var left = leftSec();
    if (left > 0) r.innerHTML = 'You can resend in <b>' + left + 's</b>.';
    else if (!r.querySelector('[data-act="resend"]')) { r.innerHTML = '<button class="isi-textbtn" type="button" data-act="resend">Resend code</button>'; clearInterval(timer); }
  }
  function wireBoxes(keep) {
    var ins = boxes();
    if (keep) keep.split('').forEach(function (d, k) { if (ins[k]) ins[k].value = d; });
    ins.forEach(function (inp, k) {
      inp.addEventListener('input', function () {
        var d = inp.value.replace(/\D/g, ''), box = document.getElementById('isi-boxes');
        if (box && box.classList.contains('bad')) { box.classList.remove('bad'); say(''); }
        if (d.length > 1) { inp.value = ''; d.slice(0, 6 - k).split('').forEach(function (c, j) { ins[k + j].value = c; }); }   // paste / one-time-code autofill
        else inp.value = d;
        var next = ins.filter(function (i) { return !i.value; })[0];
        if (next) { if (inp.value) next.focus(); } else { ins[5].focus(); submit(); }
      });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !inp.value && k > 0) { ins[k - 1].value = ''; ins[k - 1].focus(); } });
    });
    timer = setInterval(tick, 1000);
    // Focus the first box once the screen has settled, unless the user (or autofill) has already started.
    if (!keep) setTimeout(function () { try { if (ins.indexOf(document.activeElement) < 0 && !code()) ins[0].focus(); } catch (_) {} }, 360);
  }

  // Send a code (no emailRedirectTo: the email carries the code only). The code screen opens on success and on a
  // refusal for sending too soon (a code is already on its way); a network failure stays on the email.
  function send(email, resend) {
    if (busy) return;
    if (!sb()) { busy = true; withClient(function () { busy = false; send(email, resend); }, function () { busy = false; if (st.view === 'code') say(COPY.net, 'err'); else show('signin', { msg: COPY.net }); }); return; }
    var c = sb();
    busy = true; st.email = email; st.typo = null;
    var keepSent = readPending() && readPending().email === email ? sentAt() : 0;
    Promise.resolve().then(function () { return c.auth.signInWithOtp({ email: email }); }).then(function (r) {
      busy = false;
      var err = r && r.error;
      if (err && err.status === 429) { writePending(email, keepSent || Date.now(), st.from, st.cert, st.back); show('code', { msg: COPY.rate, kind: 'err' }); return; }
      if (err) { var m = isNet(err) ? COPY.net : COPY.refused; if (st.view === 'code') say(m, 'err'); else show('signin', { msg: m }); return; }
      writePending(email, Date.now(), st.from, st.cert, st.back);
      show('code', resend ? { msg: COPY.sent, kind: 'ok' } : {});
    }, function () { busy = false; if (st.view === 'code') say(COPY.net, 'err'); else show('signin', { msg: COPY.net }); });
  }
  function wrong() {
    var b = document.getElementById('isi-boxes'); if (!b) return;
    b.classList.remove('checking', 'shake'); void b.offsetWidth; b.classList.add('bad', 'shake');   // reflow so a second wrong code shakes again
    setTimeout(function () { b.classList.remove('shake'); }, 340);
    say(COPY.wrong, 'err'); boxes().forEach(function (i) { i.value = ''; }); boxes()[0].focus();
  }
  function submit() {
    var c = sb(), token = code(); if (busy || token.length < 6) return;
    if (!c) { busy = true; say(COPY.checking); withClient(function () { busy = false; submit(); }, function () { busy = false; say(COPY.net, 'err'); }); return; }
    busy = true;
    var b = document.getElementById('isi-boxes'); if (b) b.classList.add('checking'); say(COPY.checking);
    var y = IS._beforeVerify ? IS._beforeVerify() : null;   // Task 3: set the phone's pick aside first
    Promise.resolve().then(function () { return c.auth.verifyOtp({ email: st.email, token: token, type: 'email' }); }).then(function (r) {
      busy = false;
      var err = r && r.error;
      if (err) {
        if (IS._verifyFailed) IS._verifyFailed(y);
        if (isNet(err)) { if (b) b.classList.remove('checking'); say(COPY.net, 'err'); return; }
        // Supabase answers wrong and expired alike: the time since the last send decides.
        if (Date.now() - sentAt() > CODE_TTL || !readPending()) { show('code', { msg: COPY.expired, kind: 'err', expired: true, keep: token }); return; }
        wrong(); return;
      }
      clearPending();
      if (IS._afterVerify) IS._afterVerify(y); else close();
    }, function () { busy = false; if (IS._verifyFailed) IS._verifyFailed(y); if (b) b.classList.remove('checking'); say(COPY.net, 'err'); });
  }

  function onTap(ev) {
    var b = ev.target.closest && ev.target.closest('[data-act]'); if (!b || !hostEl().contains(b)) return;
    var a = b.getAttribute('data-act');
    if (a === 'back') { if (st.from === 'firstrun') { st.typo = null; if (IS._backToPicker) IS._backToPicker(); } else close(); }
    else if (a === 'signin') show('signin');
    else if (a === 'continue') {
      var i = document.getElementById('isi-email'), v = i ? i.value.trim() : '';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { if (i) { i.setAttribute('aria-invalid', 'true'); i.focus(); } return; }
      var fix = _isiSuggest(v);
      if (fix) { st.email = v; st.typo = { fix: fix }; show('signin'); return; }
      send(v.toLowerCase());
    }
    else if (a === 'fix-yes') send(st.typo.fix);
    else if (a === 'fix-no') send(st.email.toLowerCase());
    else if (a === 'change') { clearPending(); st.typo = null; show('signin'); }
    else if (a === 'apple' || a === 'google') IS._provider(a);
    else if (a === 'resend' || a === 'send-new') send(st.email, true);
  }

  // ── The lock rule (spec §After sign-in): the account's free exam wins ──
  // The hydrate only fills keys this device lacks, then flushes every local key up. So before verifyOtp the phone's
  // pick is set aside and the local copy removed: the hydrate then fills the account's value and the flush cannot
  // overwrite it. Supabase emits SIGNED_IN inside verifyOtp, so the hydrate listener goes on first.
  function freeKey() { return typeof STORAGE === 'object' && STORAGE.FREE_CERT_ID; }
  function localFree() { try { return freeKey() ? localStorage.getItem(freeKey()) : null; } catch (_) { return null; } }
  IS._beforeVerify = function () {
    var y = { local: localFree(), done: null, off: null };
    try { if (y.local) localStorage.removeItem(freeKey()); } catch (_) {}
    var cs = window.cloudStore;
    y.done = new Promise(function (res) {
      if (!cs || typeof cs.onStatusChange !== 'function') { res('none'); return; }
      var seen = false, t = setTimeout(function () { res('timeout'); }, IS._hydrateWait || 15000);
      y.off = cs.onStatusChange(function (status) {
        if (status === 'syncing') seen = true;
        else if (status === 'idle' && seen) { clearTimeout(t); res('ok'); }
        else if (status === 'error' && seen) { clearTimeout(t); res('error'); }
      });
    }).then(function (r) { if (y.off) y.off(); return r; });
    return y;
  };
  function restore(y) { try { if (y && y.local && !localFree()) localStorage.setItem(freeKey(), y.local); } catch (_) {} }
  IS._verifyFailed = function (y) { if (y && y.off) y.off(); restore(y); };
  // Same names as auth-state's cert switcher (it may not have loaded when the toast shows).
  var NAMES = { netplus: 'Network+', secplus: 'Security+', az900: 'Microsoft Azure Fundamentals', ai900: 'Microsoft Azure AI Fundamentals',
    sc900: 'Microsoft SC-900', clfc02: 'AWS Cloud Practitioner', 'aplus-core1': 'CompTIA A+ Core 1', 'aplus-core2': 'CompTIA A+ Core 2' };
  function certName(id) { return NAMES[id] || id; }
  function here() { return (typeof CURRENT_CERT === 'string' && CURRENT_CERT) || window.CURRENT_CERT || 'netplus'; }
  function hasData() { try { var h = JSON.parse(localStorage.getItem((typeof STORAGE === 'object' && STORAGE.HISTORY) || '') || '[]'); return Array.isArray(h) && h.length > 0; } catch (_) { return false; } }
  function open(id) { var F = window.iosFirstRun; document.documentElement.classList.add('isi-switching'); close(); if (F && F.goToCert) F.goToCert(id); }
  IS._afterVerify = function (y) {
    var N = window.caNative;
    return (y && y.done ? y.done : Promise.resolve('none')).then(function (r) {
      // No decision without a finished hydrate. Put the phone's pick back only when no hydrate can follow ('error'
      // never flushes; 'none' has no cloud store): after a 'timeout' the hydrate may still land and flush every local
      // key, so the key stays absent and that hydrate fills the account's value instead.
      if (r !== 'ok' || !N) { if (r !== 'timeout') restore(y); close(); return; }
      return Promise.all([N.chosen(), knownTier()]).then(function (a) {
        var c = a[0], tier = a[1];
        if (!tier) { close(); return; }   // spec §Pro: until the tier is known nothing changes
        var X = localFree(), Y = (y && y.local) || c.lockedCert || null;
        var pro = tier === 'pro';
        if (pro) {   // Pro: no lock; the account's cert, else this phone's choice
          return N.forget('lockedCert').then(function () {
            var to = X || c.chosenCert || (hasData() ? here() : null);
            if (!to) { close(); pickerNow('pro'); return; }
            return N.choose(to, { locked: false }).then(function () { if (to === here()) close(); else open(to); });
          });
        }
        if (X) {
          var switched = !!(Y && X !== Y);
          return N.choose(X, { locked: true }).then(function () { return switched ? N.set('lockToast', X) : null; }).then(function () {
            if (X === here()) { close(); if (switched) showToast(); else if (typeof renderIosHome === 'function') renderIosHome(); }
            else open(X);
          });
        }
        if (Y) {
          var O = window.onbFirstRun; if (O && O.persistFreeCert) O.persistFreeCert(Y);
          if (window.cloudStore && window.cloudStore.flushNow) window.cloudStore.flushNow().catch(function () {});
          if (!c.chosenCert) return N.choose(Y, { locked: true }).then(function () { if (Y === here()) close(); else open(Y); });
          close(); return;
        }
        // Neither: the last cert with data, else the picker.
        if (c.chosenCert) { close(); return; }
        if (hasData()) return N.choose(here(), { locked: true }).then(close);
        close(); pickerNow('free');
      });
    }).catch(function () { restore(y); close(); });
  };
  // The quota RPC (the tier) runs alongside the hydrate; wait for it briefly rather than guess.
  function knownTier() {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function look() {
        var q = window._quotaState, t = q && q.tier;
        if (t) { res(t); return; }
        if (Date.now() - t0 < (IS._tierWait || 3000)) setTimeout(look, 150); else res(null);
      })();
    });
  }
  function pickerNow(tier) { var F = window.iosFirstRun; if (F && F.picker) F.picker({ tier: tier, native: true }); }
  function showToast() {
    var N = window.caNative; if (!N || !N.take) return;
    N.take('lockToast').then(function (id) {
      if (!id) return;
      var d = document.createElement('div'); d.innerHTML = _isiToastHtml(certName(id));
      var t = d.firstChild; document.body.appendChild(t);
      setTimeout(function () { t.classList.add('open'); }, 450);
      setTimeout(function () { t.classList.add('out'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260); }, 5450);
    });
  }

  // ── Stage 5c: Sign in with Apple / Google (spec §App sign-in flow) ──
  // A raw nonce for Supabase and its SHA-256 for the native sheet (the plugin passes it to Apple/Google untouched).
  function _isiNonce() {
    var b = new Uint8Array(32); crypto.getRandomValues(b);
    var raw = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)).then(function (d) {
      return { raw: raw, hashed: Array.prototype.map.call(new Uint8Array(d), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('') };
    });
  }
  IS._nonce = _isiNonce;
  // Apple shares the name only on the very first authorization: keep it when the profile has none yet.
  function saveName(c, r) {
    var name = [r.givenName, r.familyName].filter(Boolean).join(' ').trim();
    if (!name) return;
    c.auth.getUser().then(function (u) {
      var usr = u && u.data && u.data.user, id = usr && usr.id; if (!id) return;
      var placeholder = String((usr.email || '').split('@')[0]);   // the signup trigger's default (supabase/schema.sql)
      return c.from('profiles').select('display_name').eq('id', id).single().then(function (p) {
        var cur = p && p.data && p.data.display_name;
        if (cur && cur !== placeholder) return;
        return c.from('profiles').update({ display_name: name }).eq('id', id);
      });
    }).catch(function () {});
  }
  IS._provider = function (name) {
    var N = window.caNative;
    if (busy || !N || !N.social) return Promise.resolve();
    busy = true;
    function failed() { busy = false; show('signin', { providerErr: name }); }
    var n;
    // Promise.resolve().then: a nonce that throws (no crypto.subtle) reaches the failure path below and frees busy
    return Promise.resolve().then(_isiNonce).then(function (x) { n = x; return N.social(name, { nonce: n.hashed }); }).then(function (r) {
      // Only now, with a token in hand, is the phone's pick set aside (a cancelled sheet never touches it).
      return new Promise(function (res) { withClient(res, function () { res(null); }); }).then(function (c) {
        if (!c) { failed(); return; }
        var y = IS._beforeVerify();
        return Promise.resolve().then(function () { return c.auth.signInWithIdToken({ provider: name, token: r.idToken, nonce: n.raw }); }).then(function (res) {
          busy = false;
          if (res && res.error) { IS._verifyFailed(y); failed(); return; }
          if (name === 'apple') saveName(c, r);
          return IS._afterVerify(y);
        }, function () { IS._verifyFailed(y); failed(); });
      });
    }, function (e) {
      busy = false;
      if (e && e.cancelled) return;   // cancel = silence
      failed();
    });
  };

  // Stage 5c: before an Apple-linked account is deleted, Apple confirms once more and landing/api/apple-revoke.js
  // revokes CertAnvil's grant (Apple's rule). Never rejects; the deletion goes ahead whatever this returns.
  var REVOKE_URL = 'https://certanvil.com/api/apple-revoke';
  function logRevoke(out) { try { if (typeof logError === 'function') logError('apple-revoke', 'apple-revoke: ' + out); } catch (_) {} }
  IS._appleRevoke = function () {
    var N = window.caNative, c = sb();
    if (!N || !N.social || !c) { logRevoke('failed (no client)'); return Promise.resolve('failed'); }
    var why = '';   // which step failed, for the log (v8.197.2): the outcome alone never said
    // The access token is read before the sheet: the user may take their time on Apple's sheet, and the timeout
    // below covers only the network call after it (a stuck network never holds up the deletion).
    return c.auth.getSession().then(function (s) {
      var t = s && s.data && s.data.session && s.data.session.access_token;
      return N.social('apple', {}).then(function (r) {
        if (!r.authorizationCode || !t) { why = !t ? 'no session' : 'no code'; return 'failed'; }
        var call = fetch(REVOKE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ code: r.authorizationCode }) })
          .then(function (res) {
            return res.json().then(function (j) { var out = (j && j.result) || 'failed'; if (out !== 'ok') why = 'server ' + res.status + ' ' + out; return out; },
              function () { why = 'server ' + res.status + ' not json'; return 'failed'; });
          }, function () { why = 'network'; return 'failed'; });
        return Promise.race([call, new Promise(function (r2) { setTimeout(function () { why = why || 'timeout'; r2('failed'); }, IS._revokeWait || 15000); })]);
      }, function (e) { if (e && e.cancelled) return 'cancelled'; why = 'sheet'; return 'failed'; });
    }).catch(function () { why = why || 'threw'; return 'failed'; }).then(function (out) {
      if (out !== 'ok' && out !== 'sub-mismatch') logRevoke(out + (why && out !== 'cancelled' ? ' (' + why + ')' : ''));   // the server logs ok / sub-mismatch itself
      return out;
    });
  };
  // true when this signed-in user has an Apple identity and the app can ask Apple
  IS._hasApple = function (user) {
    var N = window.caNative;
    return !!(window.CA_NATIVE && N && N.socialReady && N.socialReady('apple') && user && (user.identities || []).some(function (i) { return i && i.provider === 'apple'; }));
  };

  // o = {from: 'picker' | 'firstrun' | 'signedout' | 'home' | 'settings' | 'custom' | 'diagnostic', cert, back}
  // Task 3 (native-shell) sets IS._backToPicker, called when Back is tapped from 'firstrun'.
  IS.open = function (o) {
    st.from = (o && o.from) || 'home'; st.cert = o && o.cert; st.back = o && o.back; st.typo = null;
    var p = readPending();
    if (p) { st.email = p.email; show('code'); } else show('signin');
  };
  IS.close = close;
  // Every sign-in in the app comes here: the in-app screens in the iOS app, today's certanvil.com page on the web.
  IS.go = function (from) {
    if (window.CA_NATIVE) { IS.open({ from: from }); return; }
    var u = typeof window.buildSignInUrl === 'function' ? window.buildSignInUrl() : null;
    if (u) window.location.href = u;
  };
  IS._pending = readPending;

  function boot() {
    var h = hostEl(); if (!h || !window.CA_NATIVE) return;
    h.addEventListener('click', onTap);
    // The topbar pill and any certanvil.com sign-in link open the in-app screens instead of Safari.
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a.topbar-signin-pill, a[href^="https://certanvil.com/?action=signin"]') : null;
      if (!a) return;
      e.preventDefault(); e.stopPropagation(); IS.open({ from: 'home' });
    }, true);
    showToast();   // the one-time "we've opened your account's exam" note, on the page it opened
    var p = readPending();
    if (p) { st.from = p.from || 'picker'; st.cert = p.cert || undefined; st.back = p.back == null ? undefined : p.back; st.email = p.email; show('code'); }   // a relaunch or cert change mid-code comes back here
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window._isiSignInHtml = _isiSignInHtml; window._isiCodeHtml = _isiCodeHtml;
  window._isiToastHtml = _isiToastHtml; window._isiSuggest = _isiSuggest;
})();
