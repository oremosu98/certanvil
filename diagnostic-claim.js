// ══════════════════════════════════════════════════════════════════════════
// diagnostic-claim.js · v4.99.56 · D.5
// ══════════════════════════════════════════════════════════════════════════
// Cert app claim hook for the landing diagnostic flow.
//
// When a magic-link signup completes (D.5 stub form on /diagnostic
// /network-plus/results), Supabase auth redirects the user to the cert app
// with `?action=claim-diagnostic&token=<32-hex>`. This script:
//   1. Detects the action+token combo
//   2. Waits for SIGNED_IN (the magic link IS what just signed them in)
//   3. Calls supabase.rpc('claim_diagnostic_results', { p_token: token })
//   4. On success: toast + triggers cloud-store re-hydrate so the merged
//      profiles.metadata.diagnostic lands in localStorage
//   5. Strips URL params so the action doesn't re-fire on refresh
//
// Self-contained · no app.js / auth-state.js mutation. Silent no-op on any
// page load that doesn't have both URL params.
// ══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Read URL params once on script load
  var params;
  try { params = new URLSearchParams(window.location.search); }
  catch (_) { return; }

  var action = (params.get('action') || '').toLowerCase();
  var token = params.get('token');
  if (action !== 'claim-diagnostic' || !token || token.length < 16) return;

  // Don't re-trigger if we already saw this exact token this session
  var SESSION_KEY = 'certanvilClaimAttemptedTokens';
  var attempted;
  try {
    attempted = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
  } catch (_) { attempted = []; }
  if (Array.isArray(attempted) && attempted.indexOf(token) !== -1) {
    // Already attempted this session — just strip URL params and bail
    stripUrlParams();
    return;
  }

  // Wait for the Supabase client AND a signed-in session.
  // signInWithOtp landed us here, so SIGNED_IN should fire imminently —
  // but on a hard refresh of the URL with a token, getSession() may
  // return the existing session synchronously.
  var pollMs = 200;
  var pollAttempts = 0;
  var POLL_MAX_ATTEMPTS = 50;  // 10s budget

  function waitForReady() {
    var sb = window.certanvilSupabase;
    if (!sb || !sb.auth) {
      if (++pollAttempts > POLL_MAX_ATTEMPTS) return;
      setTimeout(waitForReady, pollMs);
      return;
    }

    sb.auth.getSession().then(function (r) {
      if (r && r.data && r.data.session && r.data.session.user) {
        doClaim(sb, token);
        return;
      }
      // Not signed in yet — listen for SIGNED_IN
      var unsubscribed = false;
      var listener = sb.auth.onAuthStateChange(function (ev, session) {
        if (unsubscribed) return;
        if ((ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') && session && session.user) {
          unsubscribed = true;
          // Use a microtask delay so the rest of the SIGNED_IN handlers
          // (auth-state.js + cloud-store hydrate) get to run first.
          setTimeout(function () { doClaim(sb, token); }, 60);
        }
      });
      // Bail after the budget — if SIGNED_IN never fires, the user isn't
      // authenticated and the RPC would fail with not_signed_in anyway.
      setTimeout(function () {
        if (!unsubscribed && listener && listener.data && listener.data.subscription) {
          try { listener.data.subscription.unsubscribe(); } catch (_) {}
        }
      }, 30000);
    }).catch(function () { /* silent */ });
  }

  function doClaim(sb, theToken) {
    // Mark attempted so we don't re-fire if the user refreshes mid-call
    try {
      var prev = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
      if (!Array.isArray(prev)) prev = [];
      if (prev.indexOf(theToken) === -1) prev.push(theToken);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(prev));
    } catch (_) {}

    sb.rpc('claim_diagnostic_results', { p_token: theToken }).then(function (r) {
      stripUrlParams();
      var row = (r && r.data && r.data[0]) ? r.data[0] : null;
      if (!row) {
        toast('Diagnostic claim failed — please contact support@certanvil.com', 'error');
        return;
      }
      if (row.ok && row.message === 'claimed') {
        var scoreText = row.scaled_score ? ' · baseline ' + row.scaled_score + '/900' : '';
        toast('✨ Your diagnostic results are saved to your profile' + scoreText, 'success');
        // Re-hydrate cloud-store so profiles.metadata.diagnostic lands in localStorage
        if (window.cloudStore && typeof window.cloudStore.hydrate === 'function') {
          try { window.cloudStore.hydrate().catch(function () {}); } catch (_) {}
        }
        return;
      }
      // ok=true + message='already_claimed' is a soft case (refresh + revisit URL)
      if (row.ok && row.message === 'already_claimed') {
        toast('Your diagnostic was already saved to this account.', 'info');
        return;
      }
      // ok=false cases
      if (row.message === 'expired') {
        toast('That diagnostic link expired (7-day limit). Re-take the diagnostic to save fresh results.', 'error');
        return;
      }
      if (row.message === 'not_signed_in') {
        toast('Couldn\'t save diagnostic — please refresh and try signing in again.', 'error');
        return;
      }
      if (row.message === 'not_found') {
        toast('That diagnostic link is invalid. Re-take the diagnostic to save fresh results.', 'error');
        return;
      }
      // Unknown
      toast('Diagnostic claim returned an unexpected state · ' + (row.message || 'unknown'), 'error');
    }).catch(function (err) {
      stripUrlParams();
      toast('Couldn\'t save diagnostic · ' + (err && err.message ? err.message : 'network error'), 'error');
    });
  }

  function stripUrlParams() {
    try {
      var url = new URL(window.location.href);
      url.searchParams.delete('action');
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
    } catch (_) {}
  }

  // Toast helper: use app.js's showToast if available, else fall back to a
  // minimal banner. app.js loads with defer; this script also loads with
  // defer (after auth-state.js), so showToast may or may not be in scope
  // by the time we toast — use the fallback to be safe.
  function toast(message, tone) {
    try {
      if (typeof window.showToast === 'function') {
        window.showToast(message);
        return;
      }
    } catch (_) {}
    // Fallback: minimal inline banner near the top of the page
    try {
      var el = document.createElement('div');
      el.setAttribute('role', 'status');
      el.style.cssText = [
        'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
        'z-index:99999', 'max-width:90vw', 'padding:12px 18px',
        'border-radius:10px', 'font:600 13px system-ui,sans-serif',
        'box-shadow:0 8px 24px rgba(0,0,0,.25)',
        tone === 'success' ? 'background:#15803d' :
          tone === 'error' ? 'background:#b91c1c' : 'background:#1f2937',
        'color:white',
      ].join(';');
      el.textContent = message;
      document.body.appendChild(el);
      setTimeout(function () {
        try { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; } catch (_) {}
        setTimeout(function () { try { el.remove(); } catch (_) {} }, 400);
      }, 5500);
    } catch (_) { /* document.body may be missing on extreme edge cases */ }
  }

  // Kick off as soon as the DOM is ready (Supabase client may still be loading)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForReady);
  } else {
    waitForReady();
  }
})();
