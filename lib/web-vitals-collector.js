// ══════════════════════════════════════════════════════════════════════════
// Web Vitals collector — Phase 6b (real-user performance telemetry)
// ══════════════════════════════════════════════════════════════════════════
//
// Captures Core Web Vitals (LCP / FCP / CLS / TTFB) from real user sessions
// and POSTs once per session to the `record_web_vitals` Supabase RPC. The
// data feeds an admin slicing query (p75 LCP by version, iOS vs Android,
// etc.) so we can validate that synthetic Lighthouse wins translate to real
// phones on cellular.
//
// Design decisions:
//   • Inline PerformanceObserver polyfill rather than vendoring the official
//     `web-vitals` npm library (3 KB). We capture 4 of the 5 metrics; INP is
//     deferred to Phase 6c when we have a real reason to optimise it. The
//     official library handles INP edge cases the polyfill doesn't, so
//     resurrecting that decision later is easy.
//   • Prod-only — skip localhost + preview branch deploys. Founder iteration
//     noise must not pollute the dataset.
//   • Signed-in only — `record_web_vitals` requires auth.uid(). Anon visitors
//     (landing-page bounces) are not part of the optimisation target.
//   • One write per session — fire on `visibilitychange: hidden` or `pagehide`
//     (whichever happens first), guarded against double-fire by a flag.
//   • Silent failure — telemetry must never break the app. All errors are
//     caught + ignored. We'd rather lose a datapoint than crash a session.
//   • No external network requests during boot — observers are passive,
//     RPC fires only on tab hide.
// ══════════════════════════════════════════════════════════════════════════

(function() {
  // ── Host gating ────────────────────────────────────────────────────────
  // Run only on canonical prod hosts. Preview branch deploys
  // (*-git-*.vercel.app) and localhost are explicitly excluded so we don't
  // pollute the dataset with founder iteration / branch-test traffic.
  function _isWebVitalsHost() {
    try {
      var h = (location && location.hostname) || '';
      if (!h) return false;
      if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')) return false;
      // Preview deploys carry the branch in the subdomain: name-git-branch-user.vercel.app
      if (h.indexOf('-git-') !== -1) return false;
      // Allowed: certanvil.com apex + subdomains, primary *.vercel.app deploy
      return h === 'certanvil.com'
          || h.indexOf('.certanvil.com') !== -1
          || h.indexOf('.vercel.app') !== -1;
    } catch (_) { return false; }
  }

  if (!_isWebVitalsHost()) return;

  // ── Module state ───────────────────────────────────────────────────────
  var _metrics = {
    lcp_ms: -1,   // -1 = "never observed" sentinel, matches RPC nullif() pattern
    fcp_ms: -1,
    cls: -1,
    ttfb_ms: -1,
    inp_ms: -1
  };
  var _flushed = false;

  // ── 1. Navigation Timing — TTFB ─────────────────────────────────────────
  try {
    var navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length && navEntries[0].responseStart > 0) {
      // TTFB = response start - request start (relative to navigation start
      // since responseStart is page-time origin).
      _metrics.ttfb_ms = Math.round(navEntries[0].responseStart);
    }
  } catch (_) {}

  // ── 2. PerformanceObserver — FCP ────────────────────────────────────────
  try {
    var fcpObserver = new PerformanceObserver(function(entryList) {
      var entries = entryList.getEntries();
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.name === 'first-contentful-paint') {
          _metrics.fcp_ms = Math.round(e.startTime);
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch (_) {}

  // ── 3. PerformanceObserver — LCP ────────────────────────────────────────
  // The LCP keeps changing as larger elements paint. We keep the LATEST value
  // observed before the page hides; that's the "final" LCP per W3C spec.
  try {
    var lcpObserver = new PerformanceObserver(function(entryList) {
      var entries = entryList.getEntries();
      if (entries.length) {
        var last = entries[entries.length - 1];
        _metrics.lcp_ms = Math.round(last.renderTime || last.loadTime || last.startTime);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_) {}

  // ── 4. PerformanceObserver — CLS ────────────────────────────────────────
  // Cumulative Layout Shift is a sum of every layout-shift event's value,
  // but only counting shifts not caused by user input. The spec also defines
  // "session windows" with a 1-second gap, but for our purposes the total
  // sum is good enough (matches Lighthouse's "good" threshold of 0.1).
  try {
    var clsValue = 0;
    var clsObserver = new PerformanceObserver(function(entryList) {
      var entries = entryList.getEntries();
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e.hadRecentInput) {
          clsValue += e.value;
        }
      }
      // Round to 4 decimal places to match column constraint.
      _metrics.cls = Math.round(clsValue * 10000) / 10000;
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (_) {}

  // ── Helpers — payload assembly ─────────────────────────────────────────
  function _activeCert() {
    try {
      if (typeof window.getCert === 'function') return window.getCert();
      if (window._certanvilActiveCert) return window._certanvilActiveCert;
    } catch (_) {}
    return null;
  }

  function _appVersion() {
    try {
      // Read from the module-scoped APP_VERSION exposed on window by app.js
      // boot. If unavailable, look at the version badge in DOM as fallback.
      if (typeof window.APP_VERSION === 'string') return window.APP_VERSION;
      var badge = document.getElementById('version-badge') || document.querySelector('[data-app-version]');
      if (badge) {
        var t = (badge.textContent || badge.getAttribute('data-app-version') || '').trim();
        // Strip leading 'v' if present
        return t.replace(/^v/, '');
      }
    } catch (_) {}
    return null;
  }

  function _connectionType() {
    try {
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn && conn.effectiveType) return conn.effectiveType;
    } catch (_) {}
    return null;
  }

  function _saveData() {
    try {
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn && typeof conn.saveData === 'boolean') return conn.saveData;
    } catch (_) {}
    return null;
  }

  function _pagePath() {
    try {
      // path + search, no host. Strip auth-related query params just in case.
      var p = (location.pathname || '/') + (location.search || '');
      // Don't log access tokens or session ids that might end up in URLs
      return p.replace(/([?&])(access_token|refresh_token|code)=[^&]*/g, '$1$2=…');
    } catch (_) { return '/'; }
  }

  function _shortUserAgent() {
    try {
      return (navigator.userAgent || '').slice(0, 200);
    } catch (_) { return null; }
  }

  function _buildPayload() {
    return {
      lcp_ms: _metrics.lcp_ms,
      fcp_ms: _metrics.fcp_ms,
      cls: _metrics.cls,
      ttfb_ms: _metrics.ttfb_ms,
      inp_ms: _metrics.inp_ms,  // Always -1 until Phase 6c
      app_version: _appVersion(),
      cert: _activeCert(),
      page_path: _pagePath(),
      viewport_w: window.innerWidth || 0,
      viewport_h: window.innerHeight || 0,
      connection_type: _connectionType(),
      save_data: _saveData(),
      user_agent_short: _shortUserAgent()
    };
  }

  // ── Flush — fire the RPC once per session ──────────────────────────────
  async function _flush() {
    if (_flushed) return;
    _flushed = true;
    try {
      // Need at least ONE non-sentinel metric to be worth recording.
      var hasData = (_metrics.lcp_ms >= 0) || (_metrics.fcp_ms >= 0)
                 || (_metrics.cls >= 0) || (_metrics.ttfb_ms >= 0);
      if (!hasData) return;

      // Wait for the Supabase client + an authenticated session.
      // window.certanvilSupabase is initialised in lib/supabase.js; auth state
      // resolves async after page load. If we hit pagehide before auth
      // resolves, skip — anonymous datapoint isn't useful and the RPC would
      // no-op anyway.
      if (!window.certanvilSupabase) return;
      var s = await window.certanvilSupabase.auth.getSession();
      var session = s && s.data && s.data.session;
      if (!session || !session.user) return;

      await window.certanvilSupabase.rpc('record_web_vitals', {
        payload: _buildPayload()
      });
    } catch (_) {
      // Silent failure — telemetry must never break the app.
    }
  }

  // ── Wire flush triggers ────────────────────────────────────────────────
  // Use both `visibilitychange: hidden` and `pagehide` because browsers
  // differ on which fires first (Safari prefers pagehide for true page
  // unloads, Chrome fires visibilitychange on tab-switch). The _flushed
  // guard prevents double-fire.
  function _onVisibilityChange() {
    if (document.visibilityState === 'hidden') _flush();
  }
  document.addEventListener('visibilitychange', _onVisibilityChange, { capture: true });
  window.addEventListener('pagehide', _flush, { capture: true });

  // Expose for testability / manual debug:
  //   window.__certanvilWebVitals.metrics  → current metric values
  //   window.__certanvilWebVitals.flush()  → force a flush
  window.__certanvilWebVitals = {
    metrics: _metrics,
    flush: _flush,
    buildPayload: _buildPayload
  };
})();
