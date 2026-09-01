/**
 * Utility functions for client-side password hashing, salting, and session tokens
 */

const SYSTEM_SALT = 'NTSS_EG_SECURE_SALT_2026_';

export async function hashPasswordSHA256(password: string, username?: string): Promise<string> {
  if (!password) return '';
  const salt = username ? `${SYSTEM_SALT}${username.trim().toLowerCase()}_` : SYSTEM_SALT;
  const inputToHash = `${salt}${password}`;

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(inputToHash);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto error, falling back to simple hash', e);
  }

  // Fallback simple bitwise hash representation
  let hash = 0;
  for (let i = 0; i < inputToHash.length; i++) {
    const char = inputToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fallback_' + Math.abs(hash).toString(16);
}

/**
 * Plain SHA-256 without salt (for legacy hash matching during migration)
 */
export async function hashPlainSHA256(password: string): Promise<string> {
  if (!password) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto error, falling back to simple hash', e);
  }
  return 'plain_' + password;
}

export function generateClientSessionToken(userId: string, role: string): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `NTSS_SESS_${role}_${userId}_${rand}_${time}`;
}
