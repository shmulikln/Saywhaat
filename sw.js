const CACHE_NAME = 'say-whaaat-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest.json',
  '/icon.svg',
  '/data/words_en.json',
  '/data/words_he.json',
  '/data/words_pt.json',
  '/data/words_hi.json',
  '/data/words_ar.json',
  '/data/words_id.json',
  '/data/words_zh.json'
];

// On install, cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Navigation fallback: for any navigation request, serve index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Regular asset fetching
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});