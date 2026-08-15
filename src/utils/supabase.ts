/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { secureSupabaseStorage } from './encryption';
import { rateLimiter } from './rateLimiter';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Publishable Key is missing. Please check your environment variables.');
}

let firebaseUid: string | null = null;

export const setSupabaseFirebaseUid = (uid: string | null) => {
  firebaseUid = uid;
};

const clientCache: Record<string, any> = {};

// Cache structure to prevent excessive Supabase reads and egress
interface CacheItem {
  responseBody: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  timestamp: number;
}

const getCache: Record<string, CacheItem> = {};
const CACHE_TTL = 45000; // 45 seconden cache voor profielen/whitelist/nicknames om egress drastisch te verminderen

export const createSupabaseClient = (uid: string | null = null) => {
  const cacheKey = uid || 'default';
  if (clientCache[cacheKey]) {
    return clientCache[cacheKey];
  }

  const client = createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: secureSupabaseStorage,
      lockSessionType: 'none',
    } as any,
    global: {
      fetch: (url, options) => {
        const urlStr = String(url);
        const method = options?.method || 'GET';

        // Check cache invalidatie bij schrijf-acties
        if (method !== 'GET') {
          if (urlStr.includes('/rest/v1/profiles')) {
            Object.keys(getCache).forEach(k => {
              if (k.includes('/rest/v1/profiles')) delete getCache[k];
            });
          }
          if (urlStr.includes('/rest/v1/whitelist')) {
            Object.keys(getCache).forEach(k => {
              if (k.includes('/rest/v1/whitelist')) delete getCache[k];
            });
          }
          if (urlStr.includes('/rest/v1/nicknames')) {
            Object.keys(getCache).forEach(k => {
              if (k.includes('/rest/v1/nicknames')) delete getCache[k];
            });
          }
        }

        // Alleen in aanmerking komende GET requests cachen
        const isEligibleForCache = method === 'GET' && (
          urlStr.includes('/rest/v1/profiles') ||
          urlStr.includes('/rest/v1/whitelist') ||
          urlStr.includes('/rest/v1/nicknames')
        );

        if (isEligibleForCache) {
          const cached = getCache[urlStr];
          if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return Promise.resolve(new Response(cached.responseBody, {
              status: cached.status,
              statusText: cached.statusText,
              headers: new Headers(cached.headers)
            }));
          }
        }

        const check = rateLimiter.logRequest(urlStr);
        if (!check.allowed) {
          console.error('[DDoS Shield Blocked]:', check.reason);
          return Promise.resolve(new Response(JSON.stringify({
            error: {
              message: check.reason || "Too Many Requests (Anti-DDoS Block)",
              code: "429"
            }
          }), {
            status: 429,
            statusText: "Too Many Requests",
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        const headers = new Headers(options?.headers);
        if (uid) {
          headers.set('x-firebase-uid', uid);
        }

        return fetch(url, { ...options, headers }).then(async (response) => {
          // Clone response to parse length for egress logging
          const clonedResponse = response.clone();
          let responseText = '';
          try {
            responseText = await clonedResponse.text();
          } catch (e) {
            // Unreadable response body
          }

          const byteSize = responseText.length || 0;
          const egressCheck = rateLimiter.logEgress(urlStr, byteSize);
          if (!egressCheck.allowed) {
            console.error('[Egress Block Active]:', egressCheck.reason);
            return new Response(JSON.stringify({
              error: {
                message: egressCheck.reason || "Egress Limit Exceeded",
                code: "429"
              }
            }), {
              status: 429,
              statusText: "Too Many Requests",
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (isEligibleForCache && response.ok) {
            try {
              const headersList: [string, string][] = [];
              response.headers.forEach((v, k) => {
                headersList.push([k, v]);
              });

              getCache[urlStr] = {
                responseBody: responseText,
                status: response.status,
                statusText: response.statusText,
                headers: headersList,
                timestamp: Date.now()
              };
            } catch (e) {
              // Geen crash veroorzaken als caching mislukt
            }
          }
          return response;
        });
      }
    },
    realtime: {
      params: uid ? { 'x-firebase-uid': uid } : {}
    }
  });

  clientCache[cacheKey] = client;
  return client;
};

let defaultSupabase: any = null;

export const invalidateSupabaseCache = (pattern?: string) => {
  if (!pattern) {
    Object.keys(getCache).forEach(k => delete getCache[k]);
  } else {
    Object.keys(getCache).forEach(k => {
      if (k.includes(pattern)) delete getCache[k];
    });
  }
};

export const supabase = (() => {
  if (!defaultSupabase) {
    defaultSupabase = createSupabaseClient(null);
  }
  return defaultSupabase;
})();
