import CryptoJS from 'crypto-js';

// In een echte applicatie zou dit een omgevingsvariabele moeten zijn
// of dynamisch worden opgehaald via een beveiligd kanaal.
const CHAT_ENCRYPTION_KEY = 'app-chat-secret-key-2024';

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
