const CACHE_NAME = 'ftjm-v3.4';
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
      // Use Promise.all with custom request to bypass browser disk cache using cache: 'reload'
      return Promise.all(
        ASSETS_TO_CACHE.map((asset) => {
          // Bypassing browser disk/HTTP cache ensures we fetch the absolute freshest files from network during updates
          const request = new Request(asset, { cache: 'reload' });
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                return cache.put(asset, response).catch((putErr) => {
                  console.warn(`[SW] Cache.put failed during installation for "${asset}":`, putErr);
                });
              }
              throw new Error(`Response status ${response.status}`);
            })
            .catch((err) => {
              console.warn(`[SW] Failed to fetch and cache asset with reload bypass: ${asset}`, err);
              // Fallback to regular cache add in case browser is incompatible with Request/cache settings
              return cache.add(asset).catch((fallbackErr) => {
                console.error(`[SW] Regular cache fallback also failed for: ${asset}`, fallbackErr);
              });
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
      fetch(event.request).catch(() => {
        try {
          if (typeof caches !== 'undefined' && caches && typeof caches.match === 'function') {
            return caches.match(event.request);
          }
        } catch (e) {
          console.error('[SW] caches.match failed during navigation checkout:', e);
        }
        return new Response('Offline availability not cached.', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  // Failsafe in case 'caches' is blocked or undefined in iframe sandboxes
  if (typeof caches === 'undefined' || !caches || typeof caches.open !== 'function') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Safe and clean implementation of stale-while-revalidate without calling event.waitUntil asynchronously
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      if (!cache || typeof cache.match !== 'function') {
        return fetch(event.request);
      }
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              try {
                cache.put(event.request, networkResponse.clone()).catch((putErr) => {
                  console.warn(`[SW] Async cache.put rejected for "${event.request.url}":`, putErr);
                });
              } catch (e) {
                console.warn(`[SW] Error during async cache.put for "${event.request.url}":`, e);
              }
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

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
