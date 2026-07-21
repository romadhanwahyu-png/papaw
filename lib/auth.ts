// ============================================================
// Papaw — Lightweight auth (username + PIN)
// ============================================================
//
// Server-only. PINs are hashed with scrypt + a random per-profile salt and
// verified in constant time. Stored as "saltHex:hashHex". Never store or return
// a plaintext PIN.
//
// Note: a numeric PIN is low-entropy by design (kid-friendly). This is a
// lightweight recovery/login layer, not high-security auth — pair it with the
// per-IP rate limiting in proxy.ts. Consider per-account lockout later.

import crypto from 'crypto';

const KEY_LEN = 64;

/** Hash a PIN as "salt:hash". */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, KEY_LEN).toString('hex');
  return `${salt}:${hash}`;
}

/** Constant-time verify a PIN against a stored "salt:hash". */
export function verifyPin(pin: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(pin, salt, KEY_LEN);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

/** Lowercase + trim a username. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** 3–20 chars, lowercase letters/numbers/underscore. */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

/** 4–6 digit PIN. */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
