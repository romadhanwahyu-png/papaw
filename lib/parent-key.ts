// ============================================================
// Papaw — Parent View Key Management
// ============================================================

/**
 * Generate a random 32-character key for Papa View access
 */
export function generateParentKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  const array = new Uint8Array(32);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    for (let i = 0; i < 32; i++) {
      key += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 32; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return key;
}

/**
 * Verify a parent key against the stored key
 * Uses constant-time comparison to prevent timing attacks
 */
export function verifyParentKey(provided: string, stored: string): boolean {
  if (!provided || !stored) return false;
  if (provided.length !== stored.length) return false;
  
  let result = 0;
  for (let i = 0; i < provided.length; i++) {
    result |= provided.charCodeAt(i) ^ stored.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Build the Papa View URL for a given key
 */
export function buildPapaViewUrl(key: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/papa-view?k=${key}`;
}
