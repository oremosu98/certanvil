// ══════════════════════════════════════════════════════════════════════════
// CertAnvil landing — service-worker kill switch
// ══════════════════════════════════════════════════════════════════════════
// The landing page does NOT need a service worker. But a leftover SW
// from a previous deploy (when the cert app lived at certanvil.com root)
// stayed registered in users' browsers and started intercepting requests
// to Supabase API calls — breaking the auth flow with "Failed to fetch".
//
// This file's whole job is to evict that rogue SW. The browser's update
// check sees a new sw.js, installs it, this script runs, unregisters
// itself and clears all caches. After one visit, the user's browser is
// SW-free for certanvil.com.
//
// Self-removing: on activate, calls registration.unregister() so the
// next page load has no controller and fetches go straight to network.
// ══════════════════════════════════════════════════════════════════════════

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Wipe all caches this origin has ever stored.
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) {}

    // Unregister this SW so future fetches go directly to the network.
    try { await self.registration.unregister(); } catch (_) {}

    // Tell every open tab to reload so they pick up an SW-free state.
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => {
        try { c.navigate(c.url); } catch (_) { try { c.postMessage({ type: 'sw-unregistered' }); } catch (_) {} }
      });
    } catch (_) {}
  })());
});

// Pass every fetch straight through. Don't cache anything. The kill
// switch should be totally invisible to network behaviour.
self.addEventListener('fetch', () => {
  // Intentionally do NOT call event.respondWith — this lets the browser
  // handle the request normally, bypassing the SW entirely.
});
