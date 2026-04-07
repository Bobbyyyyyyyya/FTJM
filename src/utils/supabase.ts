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

export const createSupabaseClient = (uid: string | null = null) => {
  return createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }
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
};

export const supabase = createSupabaseClient();
