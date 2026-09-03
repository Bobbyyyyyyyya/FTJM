import React from 'react';

/**
 * Enhanced React.lazy wrapper that gracefully recovers from dynamic chunk import failures.
 * If an asset chunk (e.g. secure-chunk-*.js) cannot be fetched due to a recent redeployment
 * or cache discrepancy, it reloads the page once to pull the fresh bundle.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<any>,
  exportName?: string
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const module = await importFn();
      return { default: exportName ? module[exportName] : (module.default || module) };
    } catch (error: any) {
      console.warn('[lazyWithRetry] Dynamic chunk import failed:', error);
      
      const errorMessage = (error?.message || '').toLowerCase();
      const isChunkLoadError = 
        errorMessage.includes('failed to fetch dynamically imported module') ||
        errorMessage.includes('dynamically imported module') ||
        errorMessage.includes('importing a module script failed') ||
        errorMessage.includes('error loading dynamically imported module') ||
        errorMessage.includes('loading chunk') ||
        errorMessage.includes('failed to fetch');

      if (isChunkLoadError && typeof window !== 'undefined') {
        const lastReload = sessionStorage.getItem('ftjm_chunk_retry_timestamp');
        const now = Date.now();
        // Prevent infinite reload loops (limit to once per 10 seconds)
        if (!lastReload || now - Number(lastReload) > 10000) {
          sessionStorage.setItem('ftjm_chunk_retry_timestamp', String(now));
          console.log('[lazyWithRetry] Refreshing page to fetch updated application version...');
          window.location.reload();
          return new Promise<never>(() => {});
        }
      }
      throw error;
    }
  });
}
