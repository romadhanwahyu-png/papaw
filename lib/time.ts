// ============================================================
// Papaw — Time & Bedtime Detection
// ============================================================

import { BedtimeContext } from '@/types';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Determine bedtime context based on current time
 * - bedtime: 8pm - 6am (wind down, gentle)
 * - evening: 6pm - 8pm (mention winding down)
 * - daytime: 6am - 6pm (normal energy)
 */
export function getBedtimeContext(now: Date): BedtimeContext {
  const hour = now.getHours();
  if (hour >= 20 || hour < 6) return 'bedtime';
  if (hour >= 18) return 'evening';
  return 'daytime';
}

/**
 * Format time for injection into Papaw's system prompt
 * e.g., "Jumat, 20:30 WIB"
 */
export function formatTimeForPrompt(now: Date): string {
  const day = DAYS_ID[now.getDay()];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${day}, ${hours}:${minutes} WIB`;
}

/**
 * Get the day name in Indonesian
 */
export function getDayName(now: Date): string {
  return DAYS_ID[now.getDay()];
}

/**
 * Check if a session has timed out (30 min idle)
 */
export function isSessionTimedOut(lastActivityAt: string, timeoutMinutes: number = 30): boolean {
  const lastActivity = new Date(lastActivityAt);
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes > timeoutMinutes;
}
