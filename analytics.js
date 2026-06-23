// analytics.js — Certanvil product analytics wrapper (Phase 0)
// -----------------------------------------------------------------------------
// THE single chokepoint for behavioral analytics. Feature code must NEVER call
// PostHog (or any analytics vendor) directly — it calls window.certanvilAnalytics.
// This gives us one place to enforce event naming, attach identity, manage the
// session, and swap/disable the vendor.
//
// Design (see docs/plans/product-analytics-plan.md):
//   • Identity: anon_id (localStorage) → aliased to Supabase auth user id on sign-in.
//   • Session:  session_id rotates after 30 min idle; powers "first session" activation.
//   • Offline:  we rely on the PostHog SDK's built-in localStorage queue + retry,
//               and stamp each event's real client timestamp at fire time so
//               late-flushed events keep their true time (funnels stay honest).
//   • Privacy:  identity is the opaque Supabase UUID only. Never send email/name/
//               free-text answers. No third-party cookies (PWA doesn't need them).
//   • Safety:   with no PostHog key configured, the module runs in DRY-RUN mode —
//               it's a harmless no-op (console.debug in dev). Shipping this file
//               before the PostHog project exists cannot break the app.
//
// Phase 0 events: account_signed_up, session_started, quiz_started,
//                 quiz_completed, explanation_viewed.
// -----------------------------------------------------------------------------
(function () {
  'use strict';

  // ===========================================================================
  //  ┌─────────────────────────────────────────────────────────────────────┐
  //  │  LAUNCH SWITCH — analytics is OFF until this key is set.             │
  //  │                                                                       │
  //  │  While OFF (key = null): every event is a silent no-op. Safe to ship  │
  //  │  and live in the codebase with zero effect — correct while you're the │
  //  │  only user.                                                           │
  //  │                                                                       │
  //  │  TO GO LIVE AT LAUNCH: paste your PostHog project key below (the      │
  //  │  public "phc_..." key — it is publishable, safe to commit), or set    │
  //  │  window.CERTANVIL_POSTHOG_KEY from an inline <script> before this     │
  //  │  file loads. That single change switches the whole system on.         │
  //  └─────────────────────────────────────────────────────────────────────┘
  var LAUNCH_KEY = null; // ← paste 'phc_...' here at launch to switch analytics ON
  // ===========================================================================

  var POSTHOG_KEY  = LAUNCH_KEY || (typeof window !== 'undefined' && window.CERTANVIL_POSTHOG_KEY) || null;
  var POSTHOG_HOST = (typeof window !== 'undefined' && window.CERTANVIL_POSTHOG_HOST) || 'https://eu.i.posthog.com';
  // While OFF, stay completely silent. Set window.CERTANVIL_ANALYTICS_DEBUG = true
  // in the console to see what *would* be sent, without sending anything.
  var DEBUG_LOG = (typeof window !== 'undefined' && window.CERTANVIL_ANALYTICS_DEBUG === true);
  var SESSION_IDLE_MS = 30 * 60 * 1000; // 30 minutes
  var ANON_KEY = 'certanvil_anon_id';
  var SESSION_KEY = 'certanvil_session';
  var DRY_RUN = !POSTHOG_KEY;

  // Respect Do-Not-Track and an optional consent flag (wire to your privacy UI).
  var DNT = (typeof navigator !== 'undefined') &&
    (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1');
  var consentDenied = (typeof window !== 'undefined' && window.CERTANVIL_ANALYTICS_CONSENT === false);
  var DISABLED = DNT || consentDenied;

  // --- Small utilities --------------------------------------------------------
  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }

  function deviceType() {
    return (typeof matchMedia !== 'undefined' && matchMedia('(max-width: 768px)').matches) ? 'mobile' : 'desktop';
  }
  function isPwa() {
    return (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches) ||
      (typeof navigator !== 'undefined' && navigator.standalone === true);
  }

  // --- Identity ---------------------------------------------------------------
  function anonId() {
    var id = lsGet(ANON_KEY);
    if (!id) { id = uuid(); lsSet(ANON_KEY, id); }
    return id;
  }

  // --- Session ----------------------------------------------------------------
  // session = { id, last } persisted in localStorage so a returning tab within
  // the idle window continues the same session; a new session is "started" only
  // when there's no live session.
  function readSession() {
    try { return JSON.parse(lsGet(SESSION_KEY)) || null; } catch (_) { return null; }
  }
  function touchSession() {
    var now = Date.now();
    var s = readSession();
    var isNew = false;
    if (!s || (now - (s.last || 0)) > SESSION_IDLE_MS) {
      s = { id: uuid(), last: now };
      isNew = true;
    } else {
      s.last = now;
    }
    lsSet(SESSION_KEY, JSON.stringify(s));
    return { id: s.id, isNew: isNew };
  }

  // --- Super (default) properties attached to every event ---------------------
  function superProps() {
    return {
      app_version: (typeof window !== 'undefined' && window.APP_VERSION) || 'unknown',
      cert_track: (typeof window !== 'undefined' && window.CURRENT_CERT) || 'unknown',
      is_pwa: isPwa(),
      device_type: deviceType()
    };
  }

  // --- Vendor (PostHog) load — only when a key is present ----------------------
  function loadPostHog() {
    if (DRY_RUN || DISABLED) return;
    // Official PostHog snippet (trimmed): defines window.posthog and async-loads array.js.
    !function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split('.'); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; } (p = t.createElement('script')).type = 'text/javascript', p.async = !0, p.src = s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js', (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = 'posthog', u.people = u.people || [], u.toString = function (t) { var e = 'posthog'; return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e; }, u.people.toString = function () { return u.toString(1) + '.people (stub)'; }, o = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' '), n = 0; n < o.length; n++) g(u, o[n]); e._i.push([i, s, a]); }, e.__SV = 1); }(document, window.posthog || []);

    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,        // we send named events only — no DOM-click noise
      capture_pageview: false,   // PWA, not a multi-page site; we track surfaces explicitly
      persistence: 'localStorage',
      person_profiles: 'identified_only',
      bootstrap: { distinctID: anonId() }
    });
    window.posthog.register(superProps());
  }

  // --- Core emit --------------------------------------------------------------
  function emit(event, props) {
    var sess = touchSession();
    var payload = Object.assign({}, superProps(), props || {}, {
      session_id: sess.id,
      // Stamp the real client time at fire-time so offline/late sends stay honest.
      timestamp: new Date().toISOString()
    });

    if (DRY_RUN || DISABLED || typeof window.posthog === 'undefined' || !window.posthog.capture) {
      if (DEBUG_LOG && typeof console !== 'undefined' && console.debug) {
        console.debug('[analytics:dry-run]', event, payload);
      }
      return;
    }
    try { window.posthog.capture(event, payload); }
    catch (err) { if (console && console.warn) console.warn('[analytics] capture failed', err); }
  }

  // --- Public API -------------------------------------------------------------
  var api = {
    // Generic escape hatch — prefer the named helpers below.
    track: function (event, props) { emit(event, props); },

    // Call once when a user signs in. userId = Supabase auth.users.id (UUID).
    // Aliases the prior anon_id so pre-signup activity attaches to the account.
    identify: function (userId, personProps) {
      if (!userId) return;
      if (!DRY_RUN && !DISABLED && window.posthog && window.posthog.identify) {
        try {
          window.posthog.identify(userId, Object.assign({
            cert_track: (window.CURRENT_CERT || 'unknown')
          }, personProps || {}));
        } catch (_) {}
      } else if (DRY_RUN && DEBUG_LOG) {
        console && console.debug && console.debug('[analytics:dry-run] identify', userId, personProps || {});
      }
    },

    // Clear identity on sign-out.
    reset: function () {
      if (!DRY_RUN && !DISABLED && window.posthog && window.posthog.reset) {
        try { window.posthog.reset(); } catch (_) {}
      }
    },

    // ---- Phase 0 named events ----
    sessionStarted: function () {
      var sess = touchSession();
      if (sess.isNew) emit('session_started', {});
    },
    signedUp: function (method, referralSource) {
      emit('account_signed_up', {
        method: method || 'email',
        referral_source: referralSource || null
      });
    },
    quizStarted: function (p) {
      p = p || {};
      emit('quiz_started', {
        domain: p.domain || null,
        topic: p.topic || null,
        difficulty: p.difficulty || null,
        question_count: typeof p.questionCount === 'number' ? p.questionCount : null,
        quiz_mode: p.mode || 'practice'
      });
    },
    quizCompleted: function (p) {
      p = p || {};
      emit('quiz_completed', {
        domain: p.domain || null,
        topic: p.topic || null,
        score_pct: typeof p.scorePct === 'number' ? p.scorePct : null,
        question_count: typeof p.questionCount === 'number' ? p.questionCount : null,
        quiz_mode: p.mode || 'practice',
        duration_ms: typeof p.durationMs === 'number' ? p.durationMs : null
      });
    },
    explanationViewed: function (p) {
      p = p || {};
      emit('explanation_viewed', {
        domain: p.domain || null,
        topic: p.topic || null,
        was_incorrect: p.wasIncorrect === true,
        question_id: p.questionId || null
      });
    },

    // Diagnostics
    _state: function () {
      return { dryRun: DRY_RUN, disabled: DISABLED, anonId: anonId(), session: readSession() };
    }
  };

  // --- Boot -------------------------------------------------------------------
  loadPostHog();
  api.sessionStarted();

  // Best-effort: if auth state already knows the user at load, identify passively.
  try {
    if (window.certanvilAuthState && window.certanvilAuthState.userId) {
      api.identify(window.certanvilAuthState.userId);
    }
  } catch (_) {}

  window.certanvilAnalytics = api;
})();
