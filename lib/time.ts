// ============================================================
// Papaw — Time & Bedtime Detection
// ============================================================
//
// All time reasoning is done in Indonesia time (WIB, Asia/Jakarta) regardless
// of where the server runs. On Vercel the server clock is UTC, so using the
// raw Date getters would make Papaw think it's ~7 hours earlier than it is
// (e.g. greeting "selamat siang" at night). We derive WIB parts explicitly.

import { BedtimeContext } from '@/types';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Override-able for testing or if the family moves timezones.
const TIME_ZONE = process.env.APP_TIME_ZONE || 'Asia/Jakarta';

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

interface WibParts {
  hour: number;
  minute: number;
  weekday: number; // 0 = Minggu ... 6 = Sabtu
  day: number;     // 1..31
  month: number;   // 1..12
  year: number;
}

/** Extract date/time parts in WIB from any Date. */
function getWibParts(now: Date): WibParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
    weekday: WEEKDAY_INDEX[get('weekday')] ?? now.getUTCDay(),
    day: parseInt(get('day'), 10),
    month: parseInt(get('month'), 10),
    year: parseInt(get('year'), 10),
  };
}

/** Current hour (0–23) in WIB — useful for client-side greeting tiers. */
export function getWibHour(now: Date = new Date()): number {
  return getWibParts(now).hour;
}

/**
 * Determine bedtime context based on current WIB time
 * - bedtime: 8pm - 6am (wind down, gentle)
 * - evening: 6pm - 8pm (mention winding down)
 * - daytime: 6am - 6pm (normal energy)
 */
export function getBedtimeContext(now: Date): BedtimeContext {
  const { hour } = getWibParts(now);
  if (hour >= 20 || hour < 6) return 'bedtime';
  if (hour >= 18) return 'evening';
  return 'daytime';
}

/**
 * Format the full current date + time (WIB) for Papaw's system prompt.
 * e.g., "Senin, 20 Juli 2026, 21:30 WIB". Includes the YEAR so Papaw doesn't
 * fall back to its training-cutoff assumption about what year it is.
 */
export function formatTimeForPrompt(now: Date): string {
  const { hour, minute, weekday, day, month, year } = getWibParts(now);
  const hh = hour.toString().padStart(2, '0');
  const mm = minute.toString().padStart(2, '0');
  return `${DAYS_ID[weekday]}, ${day} ${MONTHS_ID[month - 1]} ${year}, ${hh}:${mm} WIB`;
}

/**
 * Get the day name in Indonesian (WIB)
 */
export function getDayName(now: Date): string {
  return DAYS_ID[getWibParts(now).weekday];
}

/**
 * Check if a session has timed out (30 min idle). Timezone-independent —
 * operates on absolute timestamps.
 */
export function isSessionTimedOut(lastActivityAt: string, timeoutMinutes: number = 30): boolean {
  const lastActivity = new Date(lastActivityAt);
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes > timeoutMinutes;
}
