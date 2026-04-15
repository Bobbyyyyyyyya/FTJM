/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

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

export const createSupabaseClient = (uid: string | null = null) => {
  const cacheKey = uid || 'default';
  if (clientCache[cacheKey]) {
    return clientCache[cacheKey];
  }

  const client = createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, options) => {
        const headers = new Headers(options?.headers);
        if (uid) {
          headers.set('x-firebase-uid', uid);
        }
        return fetch(url, { ...options, headers });
      }
    },
    realtime: {
      headers: uid ? { 'x-firebase-uid': uid } : {}
    }
  });

  clientCache[cacheKey] = client;
  return client;
};

let defaultSupabase: any = null;

export const supabase = (() => {
  if (!defaultSupabase) {
    defaultSupabase = createSupabaseClient(null);
  }
  return defaultSupabase;
})();
