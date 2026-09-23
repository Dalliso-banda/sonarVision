/*
 * Sonar Vision service worker.
 *
 * The point of this file: the app is useless without a network on first load,
 * because coco-ssd and the three face-api nets are fetched from a CDN. Outdoors
 * is exactly where there's no wifi, so everything gets cached on first run and
 * served cache-first afterwards.
 *
 * Serve this from the site root so its scope covers the whole app.
 */

const VERSION = 'sonar-vision-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const MODEL_CACHE = `${VERSION}-models`;

// Same-origin files the app needs to boot.
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/socket.io/socket.io.js',
];

// Cross-origin hosts whose responses are worth keeping. jsDelivr and the TFJS
// weight hosts all send CORS headers, so these are real cached responses rather
// than opaque ones, and can be checked for status before caching.
const CACHEABLE_HOSTS = [
  'cdn.jsdelivr.net',
  'storage.googleapis.com',
  'tfhub.dev',
  'www.kaggle.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      // addAll fails the whole install if any one asset 404s, so each is added
      // individually — a missing style.css shouldn't stop the models caching.
      .then((cache) => Promise.all(
        SHELL_ASSETS.map((url) => cache.add(url).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function isModelRequest(url) {
  return CACHEABLE_HOSTS.includes(url.hostname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache the socket.io transport — it must always hit the live server.
  if (url.pathname.startsWith('/socket.io/') && url.search) return;

  // Model weights and libraries: cache-first. They're versioned by URL, so a
  // stale copy is the correct copy.
  if (isModelRequest(url)) {
    event.respondWith(
      caches.open(MODEL_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          // Offline with nothing cached: let the app's own fallback paths run.
          return new Response('', { status: 504, statusText: 'Offline and uncached' });
        }
      })
    );
    return;
  }

  // App shell: network-first so edits show up, cache as the offline fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/index.html')))
    );
  }
});