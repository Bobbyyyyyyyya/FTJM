/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { secureSupabaseStorage } from './encryption';
import { rateLimiter } from './rateLimiter';

// Main Supabase database & auth configuration
const MAIN_SUPABASE_URL = 'https://lahoorkdcopypnubnosl.supabase.co';
const MAIN_SUPABASE_KEY = 'sb_publishable_53DnrJekb2FrlxjduTP1BQ_KX43MYLy';

// Use the main Supabase instance by default (or environment variables if supplied)
const activeUrl = import.meta.env.VITE_SUPABASE_URL || MAIN_SUPABASE_URL;
const activeKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                  import.meta.env.VITE_SUPABASE_ANON_KEY || 
                  MAIN_SUPABASE_KEY;

if (!activeUrl || !activeKey) {
  console.warn('Supabase URL or Publishable Key is missing. Please check your environment variables.');
}

let firebaseUid: string | null = null;

export const setSupabaseFirebaseUid = (uid: string | null) => {
  firebaseUid = uid;
};

const clientCache: Record<string, SupabaseClient> = {};

// Cache structure to prevent excessive Supabase reads and egress
interface CacheItem {
  responseBody: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  timestamp: number;
}

const getCache: Record<string, CacheItem> = {};
const CACHE_TTL = 60000; // 60s memory cache for profiles/whitelist/nicknames to minimize egress

export const createSupabaseClient = (uid: string | null = null): SupabaseClient => {
  if (uid) {
    setSupabaseFirebaseUid(uid);
  }
  
  if (clientCache['default']) {
    return clientCache['default'];
  }

  const client = createClient(activeUrl, activeKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: secureSupabaseStorage,
      // @ts-ignore - ignore typing in case it complains
      lockSessionType: 'none',
    },
    global: {
      fetch: async (url, options) => {
        const urlStr = String(url);
        const method = options?.method || 'GET';
        const headers = new Headers(options?.headers);

        if (firebaseUid) {
          headers.set('x-firebase-uid', firebaseUid);
        }

        // Cache invalidation on mutation requests
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

        // Only cache eligible read-heavy GET requests
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

        return fetch(url, { ...options, headers }).then(async (response) => {
          // Clone response to parse byte size for egress tracking
          const clonedResponse = response.clone();
          let responseText = '';
          try {
            responseText = await clonedResponse.text();
          } catch (e) {
            // Body not text
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
              // Ignore cache write error
            }
          }
          return response;
        });
      }
    },
    realtime: {
      params: firebaseUid ? { 'x-firebase-uid': firebaseUid } : {}
    }
  });

  clientCache['default'] = client;
  return client;
};

let defaultSupabase: SupabaseClient | null = null;

export const invalidateSupabaseCache = (pattern?: string) => {
  if (!pattern) {
    Object.keys(getCache).forEach(k => delete getCache[k]);
  } else {
    Object.keys(getCache).forEach(k => {
      if (k.includes(pattern)) delete getCache[k];
    });
  }
};

export const resetSupabaseClients = async () => {
  try {
    if (defaultSupabase) {
      await defaultSupabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  } catch (e) {}

  for (const key of Object.keys(clientCache)) {
    try {
      await clientCache[key].auth.signOut({ scope: 'local' }).catch(() => {});
    } catch (e) {}
    delete clientCache[key];
  }

  firebaseUid = null;
  invalidateSupabaseCache();
};

export const supabase: SupabaseClient = (() => {
  if (!defaultSupabase) {
    defaultSupabase = createSupabaseClient(null);
  }
  return defaultSupabase;
})();


