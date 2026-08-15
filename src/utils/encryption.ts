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
 * Decrypts an encrypted message for general chat
 */
export const decryptGeneralChat = (cipherText: string): string => {
  try {
    if (!cipherText || typeof cipherText !== 'string') {
      return typeof cipherText === 'string' ? cipherText : '';
    }
    
    let cleanText = cipherText.trim();
    
    // Support removing possible extra wrapping quotes or escapes from some serialization/JSON layers
    if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
      cleanText = cleanText.substring(1, cleanText.length - 1).trim();
    }
    if (cleanText.startsWith("'") && cleanText.endsWith("'")) {
      cleanText = cleanText.substring(1, cleanText.length - 1).trim();
    }
    if (cleanText.startsWith('\\"') && cleanText.endsWith('\\"')) {
      cleanText = cleanText.substring(2, cleanText.length - 2).trim();
    }

    let actualCipher = cleanText;
    if (cleanText.startsWith('gc:')) {
      actualCipher = cleanText.substring(3).trim();
    }
    
    // 1. Attempt decryption with primary key
    try {
      const bytes = CryptoJS.AES.decrypt(actualCipher, CHAT_ENCRYPTION_KEY);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      
      // If we got a valid non-empty utf8 string, return it!
      if (originalText && originalText.trim().length > 0) {
        return originalText;
      }
      
      // Try Latin1 fallback in case of emojis or special character encoding
      const latinText = bytes.toString(CryptoJS.enc.Latin1);
      if (latinText && !latinText.includes('\ufffd') && latinText.trim().length > 0) {
        return latinText;
      }
    } catch (e) {
      // ignore and try legacy
    }

    // 2. Try legacy fallback key for old messages
    try {
      const bytes = CryptoJS.AES.decrypt(actualCipher, LEGACY_CHAT_ENCRYPTION_KEY);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      
      if (originalText && originalText.trim().length > 0) {
        return originalText;
      }
      
      const latinText = bytes.toString(CryptoJS.enc.Latin1);
      if (latinText && !latinText.includes('\ufffd') && latinText.trim().length > 0) {
        return latinText;
      }
    } catch (e) {
      // ignore and return original
    }
    
    return cipherText;
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
      nativeSetItem(key, signed);
    } catch (e) {
      console.error('Fout bij versleutelen local storage:', e);
      const signedFallback = signAndWrap(value);
      nativeSetItem(key, signedFallback);
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
        nativeSetItem(key, signed);
      } catch (e) {
        const signedFallback = signAndWrap(value);
        nativeSetItem(key, signedFallback);
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
      nativeSetItem(key, signed);
    } catch (e) {
      const signedFallback = signAndWrap(value);
      nativeSetItem(key, signedFallback);
    }
  },

  removeItem: (key: string): void => {
    nativeRemoveItem(key);
  }
};

// No aggressive auto-clear timers. Storage values are encrypted with AES and signed with HMAC for security.

