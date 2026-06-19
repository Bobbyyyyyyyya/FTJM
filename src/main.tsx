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
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 1000 * 60 * 60); // Every hour

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) return;
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available, show toast
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          }
        };
      };
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  };

  if (document.readyState === 'complete') {
    registerServiceWorker();
  } else {
    window.addEventListener('load', registerServiceWorker);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
