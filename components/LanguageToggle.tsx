'use client';

import type { Language } from '@/types';

interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
}

const options: { value: Language; label: string; emoji: string }[] = [
  { value: 'id', label: 'ID', emoji: '🇮🇩' },
  { value: 'en', label: 'EN', emoji: '🇬🇧' },
  { value: 'mix', label: 'Mix', emoji: '🔀' },
];

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <div className="inline-flex items-center rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 p-1.5 gap-1">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold transition-all duration-300 active:scale-95 cursor-pointer select-none ${
              isActive
                ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-md shadow-amber-500/20'
                : 'text-amber-100/60 hover:text-amber-100 hover:bg-white/5'
            }`}
            aria-pressed={isActive}
          >
            <span className="text-lg" role="img" aria-label={opt.label}>
              {opt.emoji}
            </span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
