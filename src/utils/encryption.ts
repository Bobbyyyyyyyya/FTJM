import CryptoJS from 'crypto-js';

// Capture native localStorage bindings on module init to bypass global main.tsx web runtime proxy redirects,
// preventing circular dependency recursion (Stack Overflow / load failed).
const nativeGetItem = typeof window !== 'undefined' ? window.localStorage.getItem.bind(window.localStorage) : () => null;
const nativeSetItem = typeof window !== 'undefined' ? window.localStorage.setItem.bind(window.localStorage) : () => {};
const nativeRemoveItem = typeof window !== 'undefined' ? window.localStorage.removeItem.bind(window.localStorage) : () => {};
const nativeClear = typeof window !== 'undefined' ? window.localStorage.clear.bind(window.localStorage) : () => {};

// In een echte applicatie zou dit een omgevingsvariabele moeten zijn
// of dynamisch worden opgehaald via een beveiligd kanaal.
const CHAT_ENCRYPTION_KEY = 'app-chat-secret-key-2024';

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
    if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('gc:')) {
      return cipherText;
    }
    
    const actualCipher = cipherText.substring(3);
    const bytes = CryptoJS.AES.decrypt(actualCipher, CHAT_ENCRYPTION_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!originalText) {
      return cipherText;
    }
    
    return originalText;
  } catch (error) {
    return cipherText;
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

/**
 * Veilige localStorage schil om tokens en cache versleuteld op te slaan
 */
export const secureLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      const raw = nativeGetItem(key);
      if (!raw) return null;
      
      const unwrapped = verifyAndUnwrap(raw);
      if (!unwrapped) return null;
      
      // Probeer te ontsleutelen met AES
      const bytes = CryptoJS.AES.decrypt(unwrapped, STORAGE_ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        // Fallback: als het geen versleutelde data was maar platte tekst (oude cache)
        if (unwrapped.startsWith('{') || unwrapped.startsWith('[') || unwrapped === 'true' || unwrapped === 'false') {
          return unwrapped;
        }
        return null;
      }
      return decrypted;
    } catch (e) {
      // Fallback naar onversleutelde waarde bij fouten
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
      // Sla de waarde AES-versleuteld op
      const encrypted = CryptoJS.AES.encrypt(value, STORAGE_ENCRYPTION_KEY).toString();
      const signed = signAndWrap(encrypted);
      nativeSetItem(key, signed);
    } catch (e) {
      console.error('Fout bij versleutelen local storage:', e);
      const signedFallback = signAndWrap(value);
      nativeSetItem(key, signedFallback);
    }
  },

  removeItem: (key: string): void => {
    nativeRemoveItem(key);
  },

  clear: (): void => {
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

