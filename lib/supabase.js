// ══════════════════════════════════════════════════════════════════════════
// CertAnvil cert app — Supabase client init (Phase C′)
// ══════════════════════════════════════════════════════════════════════════
// Loaded after the Supabase UMD CDN bundle. Exposes window.certanvilSupabase
// for cloud-store, auth-state, and migration modules.
//
// v4.89.8: cross-subdomain session sharing via cookie-backed storage
// adapter. Pre-fix: Supabase JS defaulted to localStorage for session
// storage, which is per-origin — so a session on certanvil.com was NOT
// visible to networkplus.certanvil.com despite the apex domain. The
// `cookieOptions.domain` config only affects PKCE verification cookies,
// not the session itself. Now we override `auth.storage` with a custom
// implementation that writes to cookies on `.certanvil.com` apex, so
// every subdomain sees the same session automatically.
//
// On localhost or any non-certanvil host we fall back to the default
// localStorage behavior (cookies wouldn't share anyway, no benefit).
//
// The publishable key is PUBLIC-SAFE — RLS policies in the database enforce
// that users only see/modify their own data. Service-role key (which bypasses
// RLS) is server-only and never ships to the browser.
// ══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  var SUPABASE_URL = 'https://appmuaqwuethndvalarl.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ZjmrS-j7ci6oSlsqu5gRJg_GDm4f4u0';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('[certanvil] Supabase UMD bundle not loaded — cloud features disabled');
    return;
  }

  // Apex cookie domain for cross-subdomain session sharing.
  // Production:    .certanvil.com (cookie shared apex + all subdomains)
  // Localhost dev: null            (default per-host cookies)
  var cookieDomain = null;
  try {
    var host = window.location.hostname;
    if (host === 'certanvil.com' || (host && host.endsWith('.certanvil.com'))) {
      cookieDomain = '.certanvil.com';
    }
  } catch (e) { /* ignore */ }

  // ── Cookie-backed storage adapter ──────────────────────────────────────
  // Implements the Supabase storage interface (getItem/setItem/removeItem)
  // backed by document.cookie. When cookieDomain is set (production), the
  // cookie writes include `Domain=.certanvil.com` so every subdomain sees
  // the same value. Falls back to localStorage on non-apex hosts.
  //
  // Cookie chunking: Supabase session JSON can be 2-4 KB; modern browsers
  // allow 4 KB per cookie. We split values >3500 bytes across `<key>.0`,
  // `<key>.1`, ... cookies to stay safely under the limit, and reassemble
  // on read. Most sessions fit in a single cookie.
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
      var maxAge = maxAgeSec != null ? maxAgeSec : (60 * 60 * 24 * 365); // 1 year
      var encoded = encodeURIComponent(value);
      document.cookie = encodeURIComponent(name) + '=' + encoded + '; Max-Age=' + maxAge + BASE_SUFFIX;
    }

    function deleteCookie(name) {
      document.cookie = encodeURIComponent(name) + '=; Max-Age=0' + BASE_SUFFIX;
    }

    return {
      getItem: function (key) {
        try {
          // Try single-cookie read first
          var single = readCookie(key);
          if (single !== null) return single;
          // Try chunked read (key.0, key.1, ...)
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
          // Clean up any prior chunks before writing fresh
          for (var i = 0; i < 100; i++) {
            if (readCookie(key + '.' + i) === null) break;
            deleteCookie(key + '.' + i);
          }
          if (value.length <= CHUNK_SIZE) {
            writeCookie(key, value);
            // Also clear any leftover single-key cookie if previously chunked
          } else {
            // Chunk and write
            deleteCookie(key); // clear single in case it existed
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
    detectSessionInUrl: true,  // picks up magic-link tokens from URL on landing redirects
    flowType: 'pkce',
  };

  // Use cookie storage on apex/subdomain hosts so the session is shared
  // across .certanvil.com. Localhost / vercel.app preview URLs keep
  // localStorage (cookies wouldn't share anyway).
  if (cookieDomain) {
    authOptions.storage = buildCookieStorage(cookieDomain);
    authOptions.storageKey = 'sb-certanvil-auth';  // single canonical key
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
