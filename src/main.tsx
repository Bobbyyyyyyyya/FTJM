import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { secureLocalStorage } from './utils/encryption';

// Enforce app-wide client storage security proxy
if (typeof window !== 'undefined') {
  const originalClear = window.localStorage.clear.bind(window.localStorage);
  window.localStorage.getItem = (key: string) => secureLocalStorage.getItem(key);
  window.localStorage.setItem = (key: string, value: string) => secureLocalStorage.setItem(key, value);
  window.localStorage.removeItem = (key: string) => secureLocalStorage.removeItem(key);
  window.localStorage.clear = () => originalClear();
}

// Strict production shield: silence standard logs only
if (import.meta.env.PROD) {
  const noop = () => {};
  window.console.log = noop;
  window.console.debug = noop;
}

// Auto-recover from stale dynamic module chunks after deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Dynamic import preload error detected, refreshing for newest bundle:', event);
    const lastReload = sessionStorage.getItem('ftjm_vite_preload_reload');
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 8000) {
      sessionStorage.setItem('ftjm_vite_preload_reload', String(now));
      window.location.reload();
    }
  });
}

if ('serviceWorker' in navigator) {
  const isDevPreview = typeof window !== 'undefined' && (
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  if (isDevPreview) {
    console.log('[Dev] Running in Vite Dev environment. Active service workers will be unregistered.');
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[Dev] Service Worker unregistered successfully.');
          }
        });
      }
    }).catch((err) => console.warn('[Dev] Failed to check registrations:', err));
  } else {
    // Clear legacy caches once to ensure clean updated state
    if (typeof window !== 'undefined' && 'caches' in window) {
      const PURGE_KEY = 'cache_purged_v4.0';
      if (!localStorage.getItem(PURGE_KEY)) {
        caches.keys().then((names) => {
          return Promise.all(names.map(name => caches.delete(name)));
        }).then(() => {
          localStorage.setItem(PURGE_KEY, 'true');
          console.log('[Cache] Stale caches purged for v4.0');
        }).catch((err) => console.warn('Cache purge failed:', err));
      }
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(registration => {
        console.log('SW registered: ', registration);
        
        // If there is a waiting Service Worker already, notify users immediately on page load
        if (registration.waiting) {
          console.log('[SW] Found waiting worker on load. Dispatching update available.');
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }

        // Check for updates frequently (every 30 seconds) so deployed updates are detected automatically
        const updateInterval = setInterval(() => {
          registration.update().catch(err => console.warn('Interval SW update failed:', err));
        }, 30000);

        // Check for updates when the user switches tabs, comes back, or unlocks screen
        const checkUpdate = () => {
          if (document.visibilityState === 'visible') {
            console.log('[SW] Tab visible/focused, querying for updates...');
            registration.update().catch(err => console.warn('SW update check failed:', err));
          }
        };

        document.addEventListener('visibilitychange', checkUpdate);
        window.addEventListener('focus', checkUpdate);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[SW] New version detected and ready. Dispatched update layout custom event.');
                // New content is available, show toast/notification
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              } else {
                console.log('[SW] App successfully cached for offline use.');
              }
            }
          };
        };
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    };

    // Safe controller change auto-reload fallback (only triggers if there was already an active controller)
    let refreshing = false;
    const hasExistingController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      if (!hasExistingController) {
        console.log('[SW] First-time controller activation. No reload needed.');
        return;
      }
      refreshing = true;
      console.log('[SW] Controller changed. Refreshing page to load new assets...');
      window.location.reload();
    });

    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker);
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
