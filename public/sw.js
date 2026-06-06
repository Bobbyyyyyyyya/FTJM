const CACHE_NAME = 'ftjm-v3.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS schemes (skip chrome-extension, etc)
  if (!event.request.url.startsWith('http') && !event.request.url.startsWith('https')) {
    return;
  }

  // Only intercept same-origin requests (exclude Supabase, external APIs, etc. to prevent fetch blocking)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network first for HTML/navigate requests to ensure updates are detected
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache first for assets, but stale-while-revalidate for JS/CSS
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      });

      if (cachedResponse) {
        // Return cached immediately, let network update run in the background
        try {
          event.waitUntil(fetchPromise);
        } catch (e) {
          // Quiet fallback
        }
        return cachedResponse;
      }

      // If not in cache, return fetchPromise directly so the browser handles standard responses and native failures correctly
      return fetchPromise;
    })
  );
});
