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

// Strict production shield: fully silence console outputs to prevent code and path leaks
if (import.meta.env.PROD) {
  const noop = () => {};
  window.console.log = noop;
  window.console.warn = noop;
  window.console.info = noop;
  window.console.debug = noop;
  window.console.error = noop;
}

if ('serviceWorker' in navigator) {
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
