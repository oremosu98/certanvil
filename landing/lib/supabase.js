// ══════════════════════════════════════════════════════════════════════════
// CertAnvil — Supabase client init
// ══════════════════════════════════════════════════════════════════════════
// Loaded AFTER the Supabase UMD CDN bundle (which sets window.supabase).
// Exposes window.certanvilSupabase for auth.js + future cert-app integration.
//
// The publishable key + project URL are PUBLIC-SAFE — they're meant to be
// exposed to the browser. Row-Level Security (RLS) policies in the database
// enforce that users can only read/write their own data. The service-role
// key (which bypasses RLS) is server-only and never ships to the browser.
//
// v4.89.8: cross-subdomain session sharing via cookie-backed storage
// adapter. Pre-fix: Supabase JS defaulted to localStorage, which is
// per-origin — so a session on certanvil.com was NOT visible to
// networkplus.certanvil.com despite sharing the apex domain. The
// cookieOptions config only affects PKCE verification, not session storage.
// Now we override `auth.storage` with a custom cookie-backed implementation
// that writes to `.certanvil.com` apex, so all subdomains see the same
// session automatically. See lib/supabase.js (cert app) for the matching
// implementation — both must use the same storage key + cookie domain.
// ══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  var SUPABASE_URL = 'https://appmuaqwuethndvalarl.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ZjmrS-j7ci6oSlsqu5gRJg_GDm4f4u0';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('[certanvil] Supabase UMD bundle not loaded — auth disabled');
    return;
  }

  var cookieDomain = null;
  try {
    var host = window.location.hostname;
    if (host === 'certanvil.com' || (host && host.endsWith('.certanvil.com'))) {
      cookieDomain = '.certanvil.com';
    }
  } catch (e) { /* ignore */ }

  // ── Cookie-backed storage adapter ──────────────────────────────────────
  // Mirrors lib/supabase.js (cert app). MUST stay in lockstep — the
  // chunking layout + storage key + cookie attributes are read on both
  // surfaces. See header comment in cert-app version for full design.
  function buildCookieStorage(domain) {
    var DOMAIN_SUFFIX = domain ? '; Domain=' + domain : '';
    var SECURE_SUFFIX = (location && location.protocol === 'https:') ? '; Secure' : '';
    var BASE_SUFFIX = '; Path=/' + DOMAIN_SUFFIX + SECURE_SUFFIX + '; SameSite=Lax';
    var CHUNK_SIZE = 3500;

    function readCookie(name) {
      var prefix = encodeURIComponent(name) + '=';
      var parts = (document.cookie || '').split('; ');
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].indexOf(prefix) === 0) {
          try { return decodeURIComponent(parts[i].substring(prefix.length)); }
          catch (e) { return parts[i].substring(prefix.length); }
        }
      }
      return null;
    }

    function writeCookie(name, value, maxAgeSec) {
      var maxAge = maxAgeSec != null ? maxAgeSec : (60 * 60 * 24 * 365);
      var encoded = encodeURIComponent(value);
      document.cookie = encodeURIComponent(name) + '=' + encoded + '; Max-Age=' + maxAge + BASE_SUFFIX;
    }

    function deleteCookie(name) {
      document.cookie = encodeURIComponent(name) + '=; Max-Age=0' + BASE_SUFFIX;
    }

    return {
      getItem: function (key) {
        try {
          var single = readCookie(key);
          if (single !== null) return single;
          var chunks = [];
          for (var i = 0; i < 100; i++) {
            var c = readCookie(key + '.' + i);
            if (c === null) break;
            chunks.push(c);
          }
          return chunks.length ? chunks.join('') : null;
        } catch (e) { return null; }
      },
      setItem: function (key, value) {
        try {
          for (var i = 0; i < 100; i++) {
            if (readCookie(key + '.' + i) === null) break;
            deleteCookie(key + '.' + i);
          }
          if (value.length <= CHUNK_SIZE) {
            writeCookie(key, value);
          } else {
            deleteCookie(key);
            var idx = 0;
            for (var pos = 0; pos < value.length; pos += CHUNK_SIZE) {
              writeCookie(key + '.' + idx, value.slice(pos, pos + CHUNK_SIZE));
              idx++;
            }
          }
        } catch (e) {
          console.warn('[certanvil] cookie storage write failed; falling back to localStorage', e);
          try { localStorage.setItem(key, value); } catch (e2) {}
        }
      },
      removeItem: function (key) {
        try {
          deleteCookie(key);
          for (var i = 0; i < 100; i++) {
            if (readCookie(key + '.' + i) === null) break;
            deleteCookie(key + '.' + i);
          }
        } catch (e) {
          try { localStorage.removeItem(key); } catch (e2) {}
        }
      },
    };
  }

  var authOptions = {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  };
  if (cookieDomain) {
    authOptions.storage = buildCookieStorage(cookieDomain);
    authOptions.storageKey = 'sb-certanvil-auth';
    authOptions.cookieOptions = { domain: cookieDomain };
  }

  var client;
  try {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: authOptions,
    });
  } catch (err) {
    console.error('[certanvil] Failed to init Supabase client:', err);
    return;
  }

  window.certanvilSupabase = client;
  window.certanvilSupabaseConfig = {
    url: SUPABASE_URL,
    cookieDomain: cookieDomain || null,
    storageKey: authOptions.storageKey || null,
  };
})();
