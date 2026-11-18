/* Coffee Shop service worker: makes the game work offline after the first visit.
   - The page itself: network first, so updates arrive; cached copy when offline.
   - Everything else from this site (scripts, styles, icons, music): cache first, then network.
   - Google Fonts: cached after first use.
   Bump VERSION to force old caches to be dropped. */
const VERSION = 'coffee-shop-v5';

/** Safari refuses page loads that a service worker answers with a redirected response
 *  (GitHub Pages redirects /coffee-shop to /coffee-shop/). Copy it into a fresh, non-redirected one. */
async function clean(res) {
  if (!res || !res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}
const CORE = ['./', './index.html', './manifest.webmanifest', './favicon.svg',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './music/playlist.json', './sfx/irasshaimase-1.mp3'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => Promise.all(CORE.map((url) =>
        fetch(url).then(clean).then((res) => (res.ok ? cache.put(url, res) : undefined)).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return; // let audio range requests go straight through
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(clean)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); }
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')).then(clean)),
    );
    return;
  }

  // playlist changes when the owner adds songs: prefer the network
  if (url.pathname.endsWith('/music/playlist.json')) {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req)),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    })),
  );
});
