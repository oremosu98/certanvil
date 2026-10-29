// v8.197.1 (29 Oct): the .certanvil.com session cookie must survive an Apple or Google session. Both copies of
// buildCookieStorage (lib/supabase.js and landing/lib/supabase.js) chunked by the raw length, but the cookie holds
// the URL-encoded value, so a Google session (name, photo URL, provider tokens) went past the browser's 4096-byte
// cookie limit and was silently dropped: the sign-in finished and the page came back signed out.
const { fs, path, ROOT, test } = require('./_context');
(function () {
  console.log('\n\x1b[1m── Session cookie (Apple / Google sessions) ──\x1b[0m');
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  // n identities: 6 is under 3500 characters but over 4096 once encoded (the old single-cookie drop);
  // 20 is chunked, and each old 3500-character chunk also encoded past 4096.
  const session = (n) => JSON.stringify({
    access_token: 'e'.repeat(1100), refresh_token: 'r'.repeat(12), provider_token: 'ya29.' + 'g'.repeat(250),
    user: { user_metadata: { full_name: 'Zoë Ñúñez 🙂', avatar_url: 'https://lh3.googleusercontent.com/a/' + 'x'.repeat(90) + '=s96-c' },
      identities: Array.from({ length: n }, (_, i) => ({ provider: 'google', identity_data: { sub: String(i % 10).repeat(21), name: 'Zoë "Z" Ñúñez', email: 'z@example.com', email_verified: true, phone_verified: false, iss: 'https://accounts.google.com', picture: 'https://example.com/' + 'y'.repeat(60) } })) }
  });
  const small = JSON.stringify({ access_token: 'e'.repeat(900), user: { email: 'a@b.test' } });
  for (const file of ['lib/supabase.js', 'landing/lib/supabase.js']) {
    const m = read(file).match(/function buildCookieStorage[\s\S]*?\n  }\n/);
    if (!m) { test(file + ': buildCookieStorage found', false); continue; }
    const jar = new Map();
    const doc = {
      get cookie() { return [...jar].map(([k, v]) => k + '=' + v).join('; '); },
      set cookie(s) {   // browser-like: name+value over 4096 bytes is silently dropped
        const kv = s.split(';')[0], i = kv.indexOf('='), k = kv.slice(0, i), v = kv.slice(i + 1);
        if (/Max-Age=0/.test(s)) { jar.delete(k); return; }
        if (Buffer.byteLength(k + v) > 4096) return;
        jar.set(k, v);
      }
    };
    const st = new Function('document', 'location', 'localStorage', m[0] + '; return buildCookieStorage;')(doc, { protocol: 'https:' }, { setItem() {}, removeItem() {} })('.certanvil.com');
    for (const n of [6, 20]) {
      const big = session(n);
      st.setItem('sb-certanvil-auth', big);
      test(file + ': an Apple/Google session of ' + big.length + ' characters (' + encodeURIComponent(big).length + ' encoded) round-trips through the cookies',
        st.getItem('sb-certanvil-auth') === big);
      test(file + ': every cookie for that session stays under the 4096-byte browser limit',
        jar.size >= 2 && [...jar].every(([k, v]) => Buffer.byteLength(k + v) <= 4096));
    }
    st.setItem('sb-certanvil-auth', small);
    test(file + ': a small session after a large one is one cookie, with no chunks left behind',
      st.getItem('sb-certanvil-auth') === small && jar.size === 1);
    st.removeItem('sb-certanvil-auth');
    test(file + ': sign-out clears the session cookie', jar.size === 0 && st.getItem('sb-certanvil-auth') === null);
  }
})();
