import CryptoJS from 'crypto-js';

// Capture native localStorage bindings on module init to bypass global main.tsx web runtime proxy redirects,
// preventing circular dependency recursion (Stack Overflow / load failed).
const nativeGetItem = typeof window !== 'undefined' ? window.localStorage.getItem.bind(window.localStorage) : () => null;
const nativeSetItem = typeof window !== 'undefined' ? window.localStorage.setItem.bind(window.localStorage) : () => {};
const nativeRemoveItem = typeof window !== 'undefined' ? window.localStorage.removeItem.bind(window.localStorage) : () => {};
const nativeClear = typeof window !== 'undefined' ? window.localStorage.clear.bind(window.localStorage) : () => {};

// In een echte applicatie zou dit een omgevingsvariabele moeten zijn
// of dynamisch worden opgehaald via een beveiligd kanaal.
const CHAT_ENCRYPTION_KEY = (import.meta.env.VITE_ENCRYPTION_KEY as string) || 'w836mDIpEhFnugUrKLgroqOp026IEKspJrckVQf5g9M=';
const LEGACY_CHAT_ENCRYPTION_KEY = 'app-chat-secret-key-2024';

// Sleutel gebruikt voor het versleutelen van lokale tokens en gecachte data
const STORAGE_ENCRYPTION_KEY = 'app-secure-storage-key-token-2026';

/**
 * Helper to convert CryptoJS WordArray to Uint8Array safely for UTF-8 TextDecoder
 */
const wordArrayToUint8Array = (wordArray: CryptoJS.lib.WordArray): Uint8Array => {
  const l = wordArray.sigBytes;
  const words = wordArray.words;
  const result = new Uint8Array(l);
  let i = 0;
  let j = 0;
  while (true) {
    if (i === l) break;
    const w = words[j++];
    result[i++] = (w >> 24) & 0xff;
    if (i === l) break;
    result[i++] = (w >> 16) & 0xff;
    if (i === l) break;
    result[i++] = (w >> 8) & 0xff;
    if (i === l) break;
    result[i++] = w & 0xff;
  }
  return result;
};

/**
 * Encrypts a string message for general chat
 */
export const encryptGeneralChat = (text: string): string => {
  try {
    // We voegen een prefix toe zodat we weten dat dit een versleuteld general bericht is
    const encrypted = CryptoJS.AES.encrypt(text, CHAT_ENCRYPTION_KEY).toString();
    return `gc:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
};

/**
 * Decrypts an encrypted message for general chat or direct messages.
 * Robust against URL-encoded spaces, missing prefixes, and malformed binary noise.
 */
export const decryptGeneralChat = (cipherText: string): string => {
  try {
    if (!cipherText || typeof cipherText !== 'string') {
      return typeof cipherText === 'string' ? cipherText : '';
    }
    
    let cleanText = cipherText.trim();
    
    // Support removing possible extra wrapping quotes or escapes from some serialization/JSON layers
    if ((cleanText.startsWith('"') && cleanText.endsWith('"')) || (cleanText.startsWith("'") && cleanText.endsWith("'"))) {
      cleanText = cleanText.substring(1, cleanText.length - 1).trim();
    }
    if (cleanText.startsWith('\\"') && cleanText.endsWith('\\"')) {
      cleanText = cleanText.substring(2, cleanText.length - 2).trim();
    }

    const hasGcPrefix = cleanText.startsWith('gc:');
    let actualCipher = cleanText;
    while (actualCipher.startsWith('gc:')) {
      actualCipher = actualCipher.substring(3).trim();
    }

    // If the text does not have the 'gc:' prefix and does not begin with OpenSSL Salted Base64 'U2FsdGVkX1',
    // it is already clear plain text. Return it directly to prevent corrupting regular text!
    const looksLikeCipher = hasGcPrefix || actualCipher.startsWith('U2FsdGVkX1');
    if (!looksLikeCipher) {
      return cleanText;
    }

    // In transport, real-time broadcasts or URL decoding, '+' characters in Base64 can turn into spaces.
    // We normalize spaces back to '+' for standard Base64 decoding.
    const normalizedCipher = actualCipher.replace(/ /g, '+');
    const ciphersToTry = [normalizedCipher];
    if (normalizedCipher !== actualCipher) {
      ciphersToTry.push(actualCipher);
    }

    const keysToTry = [
      CHAT_ENCRYPTION_KEY,
      LEGACY_CHAT_ENCRYPTION_KEY
    ];

    for (const key of keysToTry) {
      for (const cipher of ciphersToTry) {
        try {
          const bytes = CryptoJS.AES.decrypt(cipher, key);
          if (!bytes || bytes.sigBytes <= 0) continue;

          // 1. Standard UTF-8 decoding
          try {
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (originalText && originalText.trim().length > 0) {
              return originalText;
            }
          } catch (e) {
            // ignore UTF-8 decode error and try TextDecoder fallback
          }

          // 2. Resilient TextDecoder UTF-8 fallback
          try {
            if (typeof TextDecoder !== 'undefined') {
              const u8 = wordArrayToUint8Array(bytes);
              const decoder = new TextDecoder('utf-8', { fatal: false });
              const decoded = decoder.decode(u8);
              // Ensure it does not contain unprintable binary control garbage
              if (decoded && decoded.trim().length > 0 && !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(decoded)) {
                return decoded;
              }
            }
          } catch (e) {
            // ignore
          }
        } catch (e) {
          // ignore decrypt failure on this key/cipher attempt
        }
      }
    }
    
    // If decryption completely failed, return the text without binary gibberish
    return hasGcPrefix ? cleanText : cipherText;
  } catch (error) {
    console.error('Decryption failed for:', cipherText, error);
    return typeof cipherText === 'string' ? cipherText : '';
  }
};

// HMAC security signature key for state / token validation
const STORAGE_HMAC_KEY = 'app-secure-storage-hmac-key-integrity-token-2026';

// Helper to sign and package encrypted values
const signAndWrap = (cipherText: string): string => {
  const hmac = CryptoJS.HmacSHA256(cipherText, STORAGE_HMAC_KEY).toString();
  return JSON.stringify({ data: cipherText, sig: hmac });
};

// Helper to confirm structure and verify HMAC signature
const verifyAndUnwrap = (rawStoredValue: string): string | null => {
  if (!rawStoredValue) return null;
  
  // Try to parse the signed structure
  if (rawStoredValue.startsWith('{"data":')) {
    try {
      const parsed = JSON.parse(rawStoredValue);
      if (parsed && typeof parsed === 'object' && parsed.data && parsed.sig) {
        const expectedHmac = CryptoJS.HmacSHA256(parsed.data, STORAGE_HMAC_KEY).toString();
        if (parsed.sig === expectedHmac) {
          return parsed.data;
        }
        console.error('[Security Warning] Data tampering detected in secure storage signature!');
        return null;
      }
    } catch (e) {
      // Fall through to legacy format
    }
  }
  
  // Return legacy unmodified raw value for non-wrapped state
  return rawStoredValue;
};

const memoryCache = new Map<string, string>();
const pendingWriteTimers = new Map<string, any>();

// Non-essential cache keys that can safely be evicted when local storage reaches quota limit
const EVICTABLE_CACHE_KEYS = [
  'cached_posts',
  'cached_conversations',
  'cached_customTheme',
  'cached_notifications',
  'cached_whitelist',
  'cached_nicknames',
  'cached_profile',
  'ftjm_audio_cache',
  'ftjm_media_cache',
  'cache_purged_v3.2'
];

/**
 * Frees up local storage space by purging large expendable cache entries
 */
const freeStorageSpace = () => {
  try {
    for (const key of EVICTABLE_CACHE_KEYS) {
      nativeRemoveItem(key);
    }

    // Inspect remaining keys and purge any legacy cached_ keys that aren't critical auth tokens
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToPurge: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('cached_') || k.startsWith('ftjm_temp_') || k.includes('cache'))) {
          if (!k.includes('auth') && !k.includes('sb-') && !k.includes('token')) {
            keysToPurge.push(k);
          }
        }
      }
      for (const k of keysToPurge) {
        nativeRemoveItem(k);
      }
    }
  } catch (err) {
    // Silently ignore cleanup errors
  }
};

// Check and purge oversized blobs on initial script load if storage is clogged
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && !k.includes('auth') && !k.includes('token') && !k.includes('sb-')) {
        const val = nativeGetItem(k);
        if (val && val.length > 300000) {
          nativeRemoveItem(k);
        }
      }
    }
  } catch {}
}

/**
 * Safely writes to native localStorage without throwing QuotaExceededError
 */
const safeNativeSetItem = (key: string, value: string): boolean => {
  // If the value is extraordinarily large (>350KB), avoid writing it to local storage to protect quota
  // It will remain accessible via memoryCache for the duration of the session
  if (value.length > 350000 && !key.includes('auth') && !key.includes('token') && !key.includes('sb-')) {
    return false;
  }

  try {
    nativeSetItem(key, value);
    return true;
  } catch (err: any) {
    const isQuotaError =
      err &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014 ||
        (typeof err.message === 'string' && err.message.toLowerCase().includes('quota')));

    if (isQuotaError) {
      // Free expendable caches and retry once
      freeStorageSpace();
      try {
        nativeSetItem(key, value);
        return true;
      } catch (retryErr) {
        // Storage is genuinely full; gracefully keep in memoryCache only
        return false;
      }
    }
    return false;
  }
};

const flushSingleKey = (key: string) => {
  const timer = pendingWriteTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    pendingWriteTimers.delete(key);
  }
  const value = memoryCache.get(key);
  if (value !== undefined) {
    try {
      const encrypted = CryptoJS.AES.encrypt(value, STORAGE_ENCRYPTION_KEY).toString();
      const signed = signAndWrap(encrypted);
      safeNativeSetItem(key, signed);
    } catch (e) {
      try {
        const signedFallback = signAndWrap(value);
        safeNativeSetItem(key, signedFallback);
      } catch {}
    }
  }
};

const flushAllPendingWrites = () => {
  pendingWriteTimers.forEach((timer, key) => {
    clearTimeout(timer);
    const value = memoryCache.get(key);
    if (value !== undefined) {
      try {
        const encrypted = CryptoJS.AES.encrypt(value, STORAGE_ENCRYPTION_KEY).toString();
        const signed = signAndWrap(encrypted);
        safeNativeSetItem(key, signed);
      } catch (e) {
        try {
          const signedFallback = signAndWrap(value);
          safeNativeSetItem(key, signedFallback);
        } catch {}
      }
    }
  });
  pendingWriteTimers.clear();
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushAllPendingWrites);
  window.addEventListener('pagehide', flushAllPendingWrites);
}

/**
 * Veilige localStorage schil om tokens en cache versleuteld op te slaan
 */
export const secureLocalStorage = {
  getItem: (key: string): string | null => {
    if (memoryCache.has(key)) {
      return memoryCache.get(key)!;
    }
    try {
      const raw = nativeGetItem(key);
      if (!raw) return null;
      
      const unwrapped = verifyAndUnwrap(raw);
      if (!unwrapped) return null;
      
      // Probeer te ontsleutelen met AES
      const bytes = CryptoJS.AES.decrypt(unwrapped, STORAGE_ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      let finalVal: string | null = null;
      if (!decrypted) {
        // Fallback: als het geen versleutelde data was maar platte tekst (oude cache)
        if (unwrapped.startsWith('{') || unwrapped.startsWith('[') || unwrapped === 'true' || unwrapped === 'false') {
          finalVal = unwrapped;
        }
      } else {
        finalVal = decrypted;
      }

      if (finalVal !== null) {
        memoryCache.set(key, finalVal);
      }
      return finalVal;
    } catch (e) {
      // Fallback naar onversleutelde waarde bij fouten
      const fallbackRaw = nativeGetItem(key);
      if (fallbackRaw) {
        const fallbackUnwrapped = verifyAndUnwrap(fallbackRaw);
        const val = fallbackUnwrapped || fallbackRaw;
        memoryCache.set(key, val);
        return val;
      }
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    memoryCache.set(key, value);
    if (pendingWriteTimers.has(key)) {
      clearTimeout(pendingWriteTimers.get(key));
    }
    const timer = setTimeout(() => {
      flushSingleKey(key);
    }, 150);
    pendingWriteTimers.set(key, timer);
  },

  removeItem: (key: string): void => {
    memoryCache.delete(key);
    if (pendingWriteTimers.has(key)) {
      clearTimeout(pendingWriteTimers.get(key));
      pendingWriteTimers.delete(key);
    }
    nativeRemoveItem(key);
  },

  clear: (): void => {
    memoryCache.clear();
    pendingWriteTimers.forEach(t => clearTimeout(t));
    pendingWriteTimers.clear();
    nativeClear();
  }
};

/**
 * Custom storage adapter voor Supabase Client Auth.
 * Hiermee worden de Supabase sessie en JWT tokens volledig AES-versleuteld opgeslagen.
 */
export const secureSupabaseStorage = {
  getItem: (key: string): string | null => {
    try {
      const raw = nativeGetItem(key);
      if (!raw) return null;
      
      const unwrapped = verifyAndUnwrap(raw);
      if (!unwrapped) return null;
      
      const bytes = CryptoJS.AES.decrypt(unwrapped, STORAGE_ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        // Fallback indien de token nog onversleuteld in de opslag stond (om te voorkomen dat actieve gebruikers uitloggen)
        if (unwrapped.startsWith('{') || unwrapped.startsWith('[')) {
          return unwrapped;
        }
        return null;
      }
      return decrypted;
    } catch (e) {
      const fallbackRaw = nativeGetItem(key);
      if (fallbackRaw) {
        const fallbackUnwrapped = verifyAndUnwrap(fallbackRaw);
        return fallbackUnwrapped || fallbackRaw;
      }
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      const encrypted = CryptoJS.AES.encrypt(value, STORAGE_ENCRYPTION_KEY).toString();
      const signed = signAndWrap(encrypted);
      safeNativeSetItem(key, signed);
    } catch (e) {
      try {
        const signedFallback = signAndWrap(value);
        safeNativeSetItem(key, signedFallback);
      } catch {}
    }
  },

  removeItem: (key: string): void => {
    nativeRemoveItem(key);
  }
};

// No aggressive auto-clear timers. Storage values are encrypted with AES and signed with HMAC for security.

