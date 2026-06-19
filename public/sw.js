const CACHE_NAME = 'ftjm-v3.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/assets/app-secure.js',
  '/assets/index.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use Promise.all with individually caught promises so a single 404/failure won't block the entire SW installation
      return Promise.all(
        ASSETS_TO_CACHE.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`[SW] Failed to cache asset: ${asset}`, err);
          });
        })
      );
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

  // Strictly avoid intercepting non-GET requests (Cache API only allows GET method)
  if (event.request.method !== 'GET') {
    return;
  }

  // Only intercept same-origin requests (exclude Supabase, external APIs, etc. to prevent fetch blocking)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Do NOT intercept audio/video media files as Service Workers require complex range headers for media player compatibility
  if (url.pathname.includes('/audio/') || 
      url.pathname.endsWith('.mp3') || 
      url.pathname.endsWith('.wav') || 
      url.pathname.endsWith('.ogg') || 
      url.pathname.endsWith('.m4a') ||
      url.pathname.endsWith('.webm') ||
      event.request.destination === 'audio' ||
      event.request.destination === 'video') {
    return;
  }

  // Network first for HTML/navigate requests to ensure updates are detected
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Safe and clean implementation of stale-while-revalidate without calling event.waitUntil asynchronously
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            // If network fails and we have a cached version, fallback to it
            if (cachedResponse) {
              return cachedResponse;
            }
            throw err;
          });

        // Immediately return cached page asset, letting network fetch update the cache in the background
        return cachedResponse || fetchPromise;
      });
    })
  );
});
