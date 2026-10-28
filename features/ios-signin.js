// ════════════════════════════════════════════════════
// features/ios-signin.js — Stage 5b (28 Oct 2026): sign in by email code inside the iOS app.
// The June E2E (feat/cert-ios-e2e @ a345d1da, HUD "5b ›") drawn for the real app: June's
// welcome, one "Sign in or create your account" screen with the typo check, the 6-digit
// code screen and its errors, and the one-time toast when the account's free exam opens.
// Pure view functions first (UAT runs each body alone in a vm, so every one carries its
// own escape helper), then the one full-screen host #ios-signin (CA_NATIVE only).
// ════════════════════════════════════════════════════
(function () {
  'use strict';

  // June's welcome (onboarding-native-welcome). 5c turns the line into "Sign in with Apple or email".
  function _isiWelcomeHtml() {
    var BRAND = '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M58 12 C42 6, 16 16, 14 34 C12 52, 22 62, 42 64" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>'
      + '<line x1="30" y1="84" x2="70" y2="16" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity="0.55"/>'
      + '<path d="M46 88 L64 50 L82 88 M53 74 L75 74" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<div class="isi-screen isi-welcome">'
      + '<div class="isi-brand isi-rv"><span class="isi-mark">' + BRAND + '</span><span class="isi-brand-name">CertAnvil</span></div>'
      + '<div class="isi-hero" aria-hidden="true"><div class="isi-gauge"><svg viewBox="0 0 232 232"><circle class="isi-g-track" cx="116" cy="116" r="110"></circle>'
      + '<circle class="isi-g-fill" cx="116" cy="116" r="110"></circle><g transform="rotate(198 116 116)"><line class="isi-g-tick" x1="116" y1="2" x2="116" y2="15"></line></g></svg>'
      + '<div class="isi-g-center"><div class="isi-g-num">735</div><div class="isi-g-of">out of 900</div>'
      + '<div class="isi-g-ready"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>Pass range</div></div></div>'
      + '<div class="isi-g-pass">Pass mark 720</div></div>'
      + '<div class="isi-copy isi-rv"><h1>Know when you\'re ready</h1><p>Real exam questions and a readiness score that climbs as you study, so exam day is never a guess.</p></div>'
      + '<div class="isi-cta isi-rv"><button class="isi-primary" type="button" data-act="start">Get started</button>'
      + '<div class="isi-cta-sub">Sign in with email</div>'
      + '<button class="isi-link" type="button" data-act="signin">Already have an account? <b>Sign in</b></button></div>'
      + '</div>';
  }

  // m = {email, typo: {fix} | null, msg (a send failure)}
  function _isiSignInHtml(m) {
    function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    var BRAND_SM = '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M58 12 C42 6, 16 16, 14 34 C12 52, 22 62, 42 64" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><line x1="30" y1="84" x2="70" y2="16" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity="0.55"/><path d="M46 88 L64 50 L82 88 M53 74 L75 74" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2 1.6-3 1.7-3.05-0.93-1.36-2.38-1.55-2.9-1.57-1.23-0.12-2.4 0.72-3.03 0.72-0.62 0-1.59-0.7-2.62-0.68-1.35 0.02-2.6 0.78-3.29 1.99-1.4 2.43-0.36 6.02 1.0 7.99 0.67 0.96 1.46 2.05 2.5 2.0 1.0-0.04 1.38-0.65 2.6-0.65 1.21 0 1.56 0.65 2.62 0.63 1.08-0.02 1.77-0.98 2.43-1.95 0.77-1.11 1.08-2.19 1.1-2.25-0.02-0.01-2.11-0.81-2.13-3.22zM14.5 6.6c0.55-0.67 0.92-1.6 0.82-2.53-0.79 0.03-1.76 0.53-2.33 1.2-0.51 0.59-0.96 1.54-0.84 2.45 0.88 0.07 1.79-0.45 2.35-1.12z"/></svg>';
    var typo = m && m.typo;
    return '<div class="isi-screen isi-auth">'
      + '<div class="isi-top isi-rv"><button class="isi-back" type="button" data-act="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg></button>'
      + '<span class="isi-mark isi-mark-sm">' + BRAND_SM + '</span><span class="isi-brand-name">CertAnvil</span></div>'
      + '<h1 class="isi-title isi-rv">Sign in or create your account</h1>'
      + '<p class="isi-sub isi-rv"><b>Free to start.</b> No password to remember.</p>'
      + '<div class="isi-form isi-rv">'
      // 5c removes `hidden` (the provider and its divider stay out of the way until then)
      + '<button class="isi-apple" type="button" data-act="apple" hidden>' + APPLE + 'Continue with Apple</button>'
      + '<div class="isi-field"><label for="isi-email">Email</label><input id="isi-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" value="' + e(m && m.email) + '"' + (typo ? ' aria-invalid="true"' : '') + '></div>'
      + (typo ? '<div class="isi-typo" role="alert"><p>Did you mean <b>' + e(typo.fix) + '</b>?</p><div class="isi-typo-row">'
          + '<button class="isi-primary" type="button" data-act="fix-yes">Yes, fix it</button><button class="isi-outline" type="button" data-act="fix-no">No, keep mine</button></div></div>'
        : '<button class="isi-primary" type="button" data-act="continue">Continue</button>')
      + '<p class="isi-msg err" id="isi-msg" role="alert">' + e(m && m.msg) + '</p>'
      + '<p class="isi-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"></rect><path d="M3 7l9 6 9-6"></path></svg>We\'ll email you a 6-digit code.</p>'
      + '</div>'
      + '<p class="isi-legal">By continuing you agree to our <a href="https://certanvil.com/terms">Terms</a> and <a href="https://certanvil.com/privacy">Privacy Policy</a>.</p>'
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

  // The common mistyped domains (spec §Sign-in typo check). Returns the fixed address, or null.
  function _isiSuggest(v) {
    var FIX = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
      'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'iclod.com': 'icloud.com', 'icoud.com': 'icloud.com' };
    var m = /^([^@\s]+)@([^@\s]+)$/.exec(String(v == null ? '' : v).trim().toLowerCase());
    return m && Object.prototype.hasOwnProperty.call(FIX, m[2]) ? m[1] + '@' + FIX[m[2]] : null;
  }

  // ── The host (#ios-signin, full screen, the iOS app only) ─────────────
  var PENDING = 'ca_signin_pending', CODE_TTL = 900000, RESEND_MS = 60000;
  var COPY = {
    wrong: "That code isn't right. Check it and try again.", expired: 'That code has expired.',
    rate: 'Give it a minute, then ask for a new code.', net: "Couldn't reach CertAnvil. Check your connection and try again.",
    sent: 'We sent a new code.', checking: 'Checking…'
  };
  var IS = window.iosSignIn = window.iosSignIn || {};
  var st = { view: null, from: null, email: '', typo: null }, timer = null, busy = false;

  function hostEl() { return document.getElementById('ios-signin'); }
  function sb() { return window.certanvilSupabase || null; }
  function readPending() {
    try { var p = JSON.parse(sessionStorage.getItem(PENDING) || 'null'); return p && p.email && Date.now() - p.sentAt < CODE_TTL ? p : null; } catch (_) { return null; }
  }
  function writePending(email, sentAt) { try { sessionStorage.setItem(PENDING, JSON.stringify({ email: email, sentAt: sentAt })); } catch (_) {} }
  function clearPending() { try { sessionStorage.removeItem(PENDING); } catch (_) {} }
  function sentAt() { var p = readPending(); return p ? p.sentAt : 0; }
  function leftSec() { return Math.max(0, Math.ceil((RESEND_MS - (Date.now() - sentAt())) / 1000)); }
  function isNet(err) { return !err || err.status === 0 || err.name === 'AuthRetryableFetchError' || err instanceof TypeError; }

  function show(view, extra) {
    var h = hostEl(); if (!h) return;
    st.view = view; clearInterval(timer);
    if (view === 'welcome') h.innerHTML = _isiWelcomeHtml();
    else if (view === 'signin') h.innerHTML = _isiSignInHtml({ email: st.email, typo: st.typo, msg: extra && extra.msg });
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
    if (!keep) setTimeout(function () { try { ins[0].focus(); } catch (_) {} }, 360);
  }

  // Send a code (no emailRedirectTo: the email carries the code only). The code screen opens on success and on a
  // refusal for sending too soon (a code is already on its way); a network failure stays on the email.
  function send(email, resend) {
    var c = sb(); if (!c || busy) return;
    busy = true; st.email = email; st.typo = null;
    var keepSent = readPending() && readPending().email === email ? sentAt() : 0;
    Promise.resolve().then(function () { return c.auth.signInWithOtp({ email: email }); }).then(function (r) {
      busy = false;
      var err = r && r.error;
      if (err && err.status === 429) { writePending(email, keepSent || Date.now()); show('code', { msg: COPY.rate, kind: 'err' }); return; }
      if (err) { if (st.view === 'code') say(COPY.net, 'err'); else show('signin', { msg: COPY.net }); return; }
      writePending(email, Date.now());
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
    var c = sb(), token = code(); if (!c || busy || token.length < 6) return;
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
    if (a === 'back') { if (st.from === 'welcome') { st.typo = null; show('welcome'); } else close(); }
    else if (a === 'signin') show('signin');
    else if (a === 'start') { close(); var F = window.iosFirstRun; if (F && F.picker) F.picker({ tier: (window._quotaState && window._quotaState.tier) === 'pro' ? 'pro' : 'free', native: true }); }
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
    else if (a === 'resend' || a === 'send-new') send(st.email, true);
  }

  // from: 'welcome' | 'home' | 'settings' | 'custom' | 'diagnostic'
  IS.open = function (o) {
    st.from = (o && o.from) || 'home'; st.typo = null;
    var p = readPending();
    if (p) { st.email = p.email; show('code'); } else show('signin');
  };
  IS.welcome = function () { st.from = 'welcome'; st.typo = null; show('welcome'); };
  IS.close = close;
  IS._pending = readPending;

  function boot() {
    var h = hostEl(); if (!h || !window.CA_NATIVE) return;
    h.addEventListener('click', onTap);
    var p = readPending();
    if (p) { st.from = 'welcome'; st.email = p.email; show('code'); }   // a relaunch or cert change mid-code comes back here
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window._isiWelcomeHtml = _isiWelcomeHtml; window._isiSignInHtml = _isiSignInHtml; window._isiCodeHtml = _isiCodeHtml;
  window._isiToastHtml = _isiToastHtml; window._isiSuggest = _isiSuggest;
})();
