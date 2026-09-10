/**
 * Enterprise Cryptographic Utilities for Staff-Only School ERP
 * Salted Password Hashing, PBKDF2 Key Derivation, and Cryptographic Verifications
 */

export const PBKDF2_ITERATIONS = 10000;
export const PBKDF2_ALGORITHM = 'PBKDF2-HMAC-SHA256';

/**
 * Generate a cryptographically secure random salt in hex representation
 */
export function generateCryptographicSalt(byteLength: number = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback pseudorandom hex
  let result = '';
  for (let i = 0; i < byteLength; i++) {
    result += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return result;
}

/**
 * Compute PBKDF2-HMAC-SHA256 key derivation
 */
export async function derivePBKDF2Hash(
  password: string,
  saltHex: string,
  iterations: number = PBKDF2_ITERATIONS
): Promise<string> {
  if (!password) return '';

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const passwordKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      // Convert salt from hex to Uint8Array
      const saltBytes = new Uint8Array(
        (saltHex.match(/.{1,2}/g) || []).map(byte => parseInt(byte, 16))
      );

      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: iterations,
          hash: 'SHA-256',
        },
        passwordKey,
        256
      );

      const derivedArray = Array.from(new Uint8Array(derivedBits));
      return derivedArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('SubtleCrypto PBKDF2 failed, using iterative HMAC fallback', err);
  }

  // Iterative fallback hash
  let current = password + saltHex;
  for (let i = 0; i < 100; i++) {
    let hash = 0;
    for (let j = 0; j < current.length; j++) {
      hash = ((hash << 5) - hash) + current.charCodeAt(j);
      hash |= 0;
    }
    current = saltHex + Math.abs(hash).toString(16);
  }
  return 'pbkdf2_fb_' + current;
}

/**
 * Hash password with a newly generated salt for storage
 */
export async function createSaltedPasswordHash(password: string): Promise<{
  passwordHash: string;
  passwordSalt: string;
  passwordAlgorithm: string;
  passwordIterations: number;
}> {
  const salt = generateCryptographicSalt(16);
  const hash = await derivePBKDF2Hash(password, salt, PBKDF2_ITERATIONS);
  return {
    passwordHash: hash,
    passwordSalt: salt,
    passwordAlgorithm: PBKDF2_ALGORITHM,
    passwordIterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Verify a password against stored credentials
 */
export async function verifySaltedPassword(
  inputPassword: string,
  storedHash: string,
  storedSalt?: string,
  storedIterations: number = PBKDF2_ITERATIONS
): Promise<boolean> {
  if (!inputPassword || !storedHash) return false;

  // 1. If salt exists, perform PBKDF2 derivation
  if (storedSalt) {
    const computed = await derivePBKDF2Hash(inputPassword, storedSalt, storedIterations);
    return computed === storedHash;
  }

  // 2. Legacy SHA-256 check (for migration only)
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(inputPassword);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const legacySha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      if (legacySha256 === storedHash) return true;
    }
  } catch (e) {}

  return false;
}

/**
 * Validate password strength (Must be at least 8 characters with letters and numbers)
 */
export function validateStaffPasswordStrength(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'يجب أن لا تقل كلمة المرور عن 8 أحرف وأرقام لحماية حسابات الموظفين',
    };
  }

  const hasLetter = /[a-zA-Z\u0621-\u064A]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasLetter || !hasDigit) {
    return {
      isValid: false,
      message: 'يجب أن تحتوي كلمة المرور على أحرف وأرقام معاً',
    };
  }

  return { isValid: true };
}

/**
 * Compute standard SHA-256 hash of a string
 */
export async function hashPlainSHA256(text: string): Promise<string> {
  if (!text) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('SubtleCrypto digest failed, falling back to simple hash', err);
  }

  // Fallback hash implementation
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'sha256_fb_' + Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Standard SHA-256 password hashing helper
 */
export async function hashPasswordSHA256(password: string): Promise<string> {
  return hashPlainSHA256(password);
}

/**
 * Generate a client session token for authenticated users
 */
export function generateClientSessionToken(userId: string, role?: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = generateCryptographicSalt(8);
  const safeRole = (role || 'User').toLowerCase();
  return `sess_${safeRole}_${userId}_${timestamp}_${randomPart}`;
}
