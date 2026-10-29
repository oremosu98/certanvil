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

    // Every `<key>.N` chunk cookie present, whatever its N (a missing .0 must not hide a later one).
    function chunkNames(key) {
      var prefix = encodeURIComponent(key) + '.', out = [];
      var parts = (document.cookie || '').split('; ');
      for (var i = 0; i < parts.length; i++) {
        var eq = parts[i].indexOf('='), name = eq < 0 ? parts[i] : parts[i].substring(0, eq);
        if (name.indexOf(prefix) === 0 && /^\d+$/.test(name.substring(prefix.length))) out.push(decodeURIComponent(name));
      }
      return out;
    }

    // v8.197.1: the cookie holds the URL-encoded value, so measure THAT against CHUNK_SIZE. Measuring the raw
    // length let an Apple/Google session (name, photo URL, provider tokens) encode past the 4096-byte cookie
    // limit, and the browser dropped it silently. Splits on code points so no chunk ends mid-character.
    function encodedChunks(value) {
      var out = [], cur = '', curLen = 0, chars = Array.from(value);
      for (var i = 0; i < chars.length; i++) {
        var n = encodeURIComponent(chars[i]).length;
        if (curLen + n > CHUNK_SIZE && cur) { out.push(cur); cur = ''; curLen = 0; }
        cur += chars[i]; curLen += n;
      }
      if (cur) out.push(cur);
      return out;
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
          var stale = chunkNames(key);
          for (var i = 0; i < stale.length; i++) deleteCookie(stale[i]);
          var chunks = encodedChunks(value);
          if (chunks.length <= 1) {
            writeCookie(key, value);
          } else {
            deleteCookie(key);
            for (var j = 0; j < chunks.length; j++) writeCookie(key + '.' + j, chunks[j]);
          }
        } catch (e) {
          console.warn('[certanvil] cookie storage write failed; falling back to localStorage', e);
          try { localStorage.setItem(key, value); } catch (e2) {}
        }
      },
      removeItem: function (key) {
        try {
          deleteCookie(key);
          var stale = chunkNames(key);
          for (var i = 0; i < stale.length; i++) deleteCookie(stale[i]);
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
