// ============================================================
// Papaw — Language Helpers
// ============================================================

import { Language } from '@/types';

/**
 * UI labels for core strings in supported languages
 */
const labels: Record<string, Record<Language, string>> = {
  greeting_morning: {
    id: 'Selamat pagi',
    en: 'Good morning',
    mix: 'Selamat pagi',
  },
  greeting_afternoon: {
    id: 'Selamat siang',
    en: 'Good afternoon',
    mix: 'Hai',
  },
  greeting_evening: {
    id: 'Selamat malam',
    en: 'Good evening',
    mix: 'Selamat malam',
  },
  chat_placeholder: {
    id: 'Ketik pesan...',
    en: 'Type a message...',
    mix: 'Ketik pesan...',
  },
  send: {
    id: 'Kirim',
    en: 'Send',
    mix: 'Kirim',
  },
  explore: {
    id: 'Explore',
    en: 'Explore',
    mix: 'Explore',
  },
  badges: {
    id: 'Badge',
    en: 'Badges',
    mix: 'Badge',
  },
  settings: {
    id: 'Pengaturan',
    en: 'Settings',
    mix: 'Settings',
  },
  chat: {
    id: 'Ngobrol',
    en: 'Chat',
    mix: 'Ngobrol',
  },
  back: {
    id: 'Kembali',
    en: 'Back',
    mix: 'Kembali',
  },
  loading: {
    id: 'Papaw lagi mikir...',
    en: 'Papaw is thinking...',
    mix: 'Papaw lagi mikir...',
  },
  onboarding_name: {
    id: 'Hai! Siapa nama kamu?',
    en: 'Hi! What\'s your name?',
    mix: 'Hai! Siapa nama kamu?',
  },
  onboarding_language: {
    id: 'Mau ngobrol pakai bahasa apa?',
    en: 'What language do you want to use?',
    mix: 'Mau ngobrol pakai bahasa apa?',
  },
};

/**
 * Get a translated label
 */
export function getLabel(key: string, language: Language): string {
  return labels[key]?.[language] || labels[key]?.['mix'] || key;
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(hour: number, language: Language): string {
  if (hour < 12) return getLabel('greeting_morning', language);
  if (hour < 18) return getLabel('greeting_afternoon', language);
  return getLabel('greeting_evening', language);
}

/**
 * Language display names
 */
export const languageNames: Record<Language, string> = {
  id: '🇮🇩 Bahasa Indonesia',
  en: '🇬🇧 English',
  mix: '🔀 Mix (ID + EN)',
};

/**
 * Language instruction for LLM prompt
 */
export function getLanguageInstruction(language: Language): string {
  switch (language) {
    case 'id':
      return 'Respond fully in Bahasa Indonesia. Do not use English.';
    case 'en':
      return 'Respond fully in English. Do not use Bahasa Indonesia.';
    case 'mix':
      return 'Respond in a natural mix of Bahasa Indonesia and English, like a bilingual Indonesian family would speak. Default to Bahasa Indonesia for most things, but sprinkle in English naturally.';
  }
}
