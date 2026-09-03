const CACHE_NAME = 'ftjm-v4.0';

// Self install and immediately skip waiting to activate new version
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS GET schemes
  if (!event.request.url.startsWith('http') || event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Strictly skip dev, vite internals, ts/tsx modules, and backend APIs
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.jsx') ||
    url.searchParams.has('t') || // Vite timestamp queries
    url.searchParams.has('import')
  ) {
    return;
  }

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Do NOT intercept audio/video media files
  if (
    url.pathname.includes('/audio/') || 
    url.pathname.endsWith('.mp3') || 
    url.pathname.endsWith('.wav') || 
    url.pathname.endsWith('.ogg') || 
    url.pathname.endsWith('.m4a') ||
    url.pathname.endsWith('.webm') ||
    event.request.destination === 'audio' ||
    event.request.destination === 'video'
  ) {
    return;
  }

  // Network first for HTML/navigate requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        try {
          if (typeof caches !== 'undefined' && caches && typeof caches.match === 'function') {
            return caches.match('/index.html');
          }
        } catch (e) {}
        return new Response('Offline availability not cached.', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  // Failsafe if caches is blocked or undefined
  if (typeof caches === 'undefined' || !caches || typeof caches.open !== 'function') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-First strategy with Cache Fallback for all static assets:
  // Guarantees that newly deployed code & messages load instantly without stale cache traps
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const contentType = networkResponse.headers.get('content-type') || '';
          const isScriptOrStyle = event.request.destination === 'script' || 
                                  event.request.destination === 'style' || 
                                  url.pathname.endsWith('.js') || 
                                  url.pathname.endsWith('.css');
          
          // Never cache HTML when requesting scripts/styles
          if (!isScriptOrStyle || !contentType.includes('text/html')) {
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, networkResponse.clone()).catch(() => {});
              } catch (e) {}
            });
          }
        }
        return networkResponse;
      })
      .catch(() => {
        // If offline / network fails, return cached response
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Network error and not cached.', { status: 408, statusText: 'Request Timeout' });
        });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
