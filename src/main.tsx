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

if ('serviceWorker' in navigator) {
  const isDevPreview = typeof window !== 'undefined' && (
    window.location.hostname.endsWith('.run.app') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  if (isDevPreview) {
    console.log('[Dev] Running in Vite Dev/Preview environment. Active service workers will be unregistered to prevent stale caching.');
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[Dev] Dynamic Service Worker unregistered successfully.');
          }
        });
      }
    }).catch((err) => console.warn('[Dev] Failed to check registrations:', err));

    // Remove the manifest link to prevent the login redirect error / invalid JSON warning
    if (typeof document !== 'undefined') {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        manifestLink.remove();
        console.log('[Dev] Manifest link removed from developer workspace to prevent proxy redirect warnings.');
      }
    }
  } else {
    // Clear legacy caches once to fix corrupt audio streams and ensure clean offline states
    if (typeof window !== 'undefined' && 'caches' in window) {
      const PURGE_KEY = 'cache_purged_v3.2';
      if (!localStorage.getItem(PURGE_KEY)) {
        caches.keys().then((names) => {
          return Promise.all(names.map(name => caches.delete(name)));
        }).then(() => {
          localStorage.setItem(PURGE_KEY, 'true');
          console.log('[Cache] Legacy caches purged due to audio upgrade');
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

        // Check for updates periodically (every 10 minutes)
        const updateInterval = setInterval(() => {
          registration.update().catch(err => console.warn('Interval SW update failed:', err));
        }, 1000 * 60 * 10);

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
                // New content is available, show toast
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
