'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Language, Gender } from '@/types';
import { setProfileId, setLanguagePref } from '@/lib/storage';
import { languageNames } from '@/lib/language';
import { BedtimeBackground } from '@/components/BedtimeBackground';
import { PapawAvatar } from '@/components/PapawAvatar';
import { useBedtime } from '@/lib/use-bedtime';

type OnboardingStep = 'name' | 'language' | 'gender' | 'intro';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('name');
  const [childName, setChildName] = useState('');
  const [language, setLanguage] = useState<Language>('mix');
  const [gender, setGender] = useState<Gender>('unspecified');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const bedtimeMode = useBedtime();

  const handleNameSubmit = useCallback(() => {
    const trimmed = childName.trim();
    if (!trimmed) {
      setError('Nama kamu dong! 😊');
      return;
    }
    if (trimmed.length < 2) {
      setError('Hmm, yang lebih panjang dong namanya');
      return;
    }
    setError('');
    setStep('language');
  }, [childName]);

  const handleLanguageSelect = useCallback((lang: Language) => {
    setLanguage(lang);
    setStep('gender');
  }, []);

  const handleGenderSelect = useCallback((g: Gender) => {
    setGender(g);
    setStep('intro');
  }, []);

  const handleCreateProfile = useCallback(async () => {
    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: childName.trim(),
          language,
          gender,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create profile');
      }

      const data = await res.json();
      setProfileId(data.profile.id);
      setLanguagePref(language);

      // Navigate to main hub
      router.push('/papaw');
    } catch {
      setError('Oops, coba lagi ya!');
      setIsCreating(false);
    }
  }, [childName, language, gender, router]);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <BedtimeBackground mode={bedtimeMode} />

      <div className="relative z-10 min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Step: Name */}
          {step === 'name' && (
            <div className="animate-fade-in-up flex flex-col items-center gap-8">
              {/* Moon icon */}
              <div className="text-7xl animate-float">🌙</div>

              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-warm-cream">
                  Hai! Siapa nama kamu?
                </h1>
                <p className="text-text-secondary text-lg">
                  Papaw mau kenal kamu dulu 😊
                </p>
              </div>

              <div className="w-full space-y-4">
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => {
                    setChildName(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  placeholder="Ketik nama kamu..."
                  autoFocus
                  className="w-full px-6 py-4 rounded-2xl bg-papaw-surface border border-papaw-border text-text-primary text-xl text-center placeholder:text-text-muted papaw-input transition-all duration-300 focus:bg-papaw-surface-hover"
                  maxLength={30}
                />

                {error && (
                  <p className="text-warm-orange text-center animate-fade-in text-sm">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleNameSubmit}
                  disabled={!childName.trim()}
                  className="touch-target w-full py-4 rounded-2xl bg-warm-amber text-indigo-night font-bold text-xl transition-all duration-300 hover:bg-warm-amber-soft active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Lanjut →
                </button>

                <Link
                  href="/login"
                  className="block text-center text-text-muted hover:text-text-secondary transition-colors text-sm pt-1"
                >
                  Sudah pernah pakai Papaw? Masuk
                </Link>
              </div>
            </div>
          )}

          {/* Step: Language */}
          {step === 'language' && (
            <div className="animate-fade-in-up flex flex-col items-center gap-8">
              <div className="text-7xl animate-float">🗣️</div>

              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-warm-cream">
                  Hai {childName}!
                </h1>
                <p className="text-text-secondary text-lg">
                  Mau ngobrol pakai bahasa apa?
                </p>
              </div>

              <div className="w-full space-y-3">
                {(Object.entries(languageNames) as [Language, string][]).map(
                  ([lang, name]) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`touch-target w-full py-4 px-6 rounded-2xl border text-left text-lg font-semibold transition-all duration-300 active:scale-[0.97] ${
                        language === lang
                          ? 'bg-warm-amber/20 border-warm-amber text-warm-amber-soft'
                          : 'bg-papaw-surface border-papaw-border text-text-primary hover:bg-papaw-surface-hover hover:border-papaw-card-hover'
                      }`}
                    >
                      {name}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setStep('name')}
                className="text-text-muted hover:text-text-secondary transition-colors text-sm"
              >
                ← Kembali
              </button>
            </div>
          )}

          {/* Step: Gender */}
          {step === 'gender' && (
            <div className="animate-fade-in-up flex flex-col items-center gap-8">
              <div className="text-7xl animate-float">🧒</div>

              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-warm-cream">
                  {childName} anak...
                </h1>
                <p className="text-text-secondary text-lg">
                  Biar Papaw manggilnya pas 😊
                </p>
              </div>

              <div className="w-full space-y-3">
                {([
                  ['male', '👦 Laki-laki'],
                  ['female', '👧 Perempuan'],
                  ['unspecified', 'Nanti aja / rahasia'],
                ] as [Gender, string][]).map(([g, label]) => (
                  <button
                    key={g}
                    onClick={() => handleGenderSelect(g)}
                    className={`touch-target w-full py-4 px-6 rounded-2xl border text-left text-lg font-semibold transition-all duration-300 active:scale-[0.97] ${
                      gender === g
                        ? 'bg-warm-amber/20 border-warm-amber text-warm-amber-soft'
                        : 'bg-papaw-surface border-papaw-border text-text-primary hover:bg-papaw-surface-hover hover:border-papaw-card-hover'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('language')}
                className="text-text-muted hover:text-text-secondary transition-colors text-sm"
              >
                ← Kembali
              </button>
            </div>
          )}

          {/* Step: Papaw Intro */}
          {step === 'intro' && (
            <div className="animate-fade-in-up flex flex-col items-center gap-8">
              <div className="animate-scale-in">
                <PapawAvatar size="lg" />
              </div>

              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-warm-cream">
                  Kenalan dulu ya!
                </h1>

                <div className="glass rounded-2xl p-6 space-y-3 text-left">
                  <p className="text-text-primary text-lg leading-relaxed">
                    Hai <span className="text-warm-amber font-semibold">{childName}</span>! 👋
                  </p>
                  <p className="text-text-secondary leading-relaxed">
                    Aku <span className="text-warm-amber-soft font-semibold">Papaw</span> — companion
                    buat kamu. Kita bisa ngobrol, explore hal-hal seru bareng,
                    dan aku juga suka nitip pesan dari Papa. 🌙
                  </p>
                  <p className="text-text-secondary leading-relaxed">
                    Kapan aja mau cerita, tanya, atau main — Papaw ada di sini!
                  </p>
                </div>
              </div>

              {error && (
                <p className="text-warm-orange text-center animate-fade-in text-sm">
                  {error}
                </p>
              )}

              <button
                onClick={handleCreateProfile}
                disabled={isCreating}
                className="touch-target w-full py-4 rounded-2xl bg-warm-amber text-indigo-night font-bold text-xl transition-all duration-300 hover:bg-warm-amber-soft active:scale-[0.97] disabled:opacity-60"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-indigo-night border-t-transparent rounded-full animate-spin" />
                    Setting up...
                  </span>
                ) : (
                  'Mulai! 🚀'
                )}
              </button>

              <button
                onClick={() => setStep('language')}
                className="text-text-muted hover:text-text-secondary transition-colors text-sm"
              >
                ← Kembali
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
