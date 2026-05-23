// ============================================================
// Papaw — localStorage Wrapper
// ============================================================

const KEYS = {
  profileId: 'papaw_profile_id',
  language: 'papaw_language_pref',
  sessionId: 'papaw_session_id',
} as const;

function isClient(): boolean {
  return typeof window !== 'undefined';
}

// --- Profile ID ---
export function getProfileId(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(KEYS.profileId);
}

export function setProfileId(id: string): void {
  if (!isClient()) return;
  localStorage.setItem(KEYS.profileId, id);
}

export function clearProfileId(): void {
  if (!isClient()) return;
  localStorage.removeItem(KEYS.profileId);
}

// --- Language Preference ---
export function getLanguagePref(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(KEYS.language);
}

export function setLanguagePref(lang: string): void {
  if (!isClient()) return;
  localStorage.setItem(KEYS.language, lang);
}

// --- Session ID ---
export function getSessionId(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(KEYS.sessionId);
}

export function setSessionId(id: string): void {
  if (!isClient()) return;
  localStorage.setItem(KEYS.sessionId, id);
}

export function clearSessionId(): void {
  if (!isClient()) return;
  localStorage.removeItem(KEYS.sessionId);
}

// --- Clear All ---
export function clearAll(): void {
  if (!isClient()) return;
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
