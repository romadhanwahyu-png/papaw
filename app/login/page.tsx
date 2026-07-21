'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setProfileId } from '@/lib/storage';
import { BedtimeBackground } from '@/components/BedtimeBackground';
import { PapawAvatar } from '@/components/PapawAvatar';
import { useBedtime } from '@/lib/use-bedtime';

export default function LoginPage() {
  const router = useRouter();
  const bedtimeMode = useBedtime();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    const u = username.trim();
    if (!u || !pin) {
      setError('Isi username sama PIN-nya dulu ya');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username: u, pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.profileId) {
        setError(data.error || 'Username atau PIN salah');
        setLoading(false);
        return;
      }
      setProfileId(data.profileId);
      router.push('/papaw');
    } catch {
      setError('Oops, coba lagi ya!');
      setLoading(false);
    }
  }, [username, pin, loading, router]);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <BedtimeBackground mode={bedtimeMode} />

      <div className="relative z-10 min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center gap-8 animate-fade-in-up">
          <div className="animate-scale-in">
            <PapawAvatar size="lg" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-warm-cream">Masuk ke Papaw</h1>
            <p className="text-text-secondary text-lg">Pakai username &amp; PIN kamu 🌙</p>
          </div>

          <div className="w-full space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full px-6 py-4 rounded-2xl bg-papaw-surface border border-papaw-border text-text-primary text-lg text-center placeholder:text-text-muted papaw-input transition-all outline-none focus:bg-papaw-surface-hover"
              maxLength={20}
            />
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="PIN (4–6 angka)"
              className="w-full px-6 py-4 rounded-2xl bg-papaw-surface border border-papaw-border text-text-primary text-lg text-center tracking-[0.4em] placeholder:tracking-normal placeholder:text-text-muted papaw-input transition-all outline-none focus:bg-papaw-surface-hover"
              maxLength={6}
            />

            {error && (
              <p className="text-warm-orange text-center animate-fade-in text-sm">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="touch-target w-full py-4 rounded-2xl bg-warm-amber text-indigo-night font-bold text-xl transition-all duration-300 hover:bg-warm-amber-soft active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-indigo-night border-t-transparent rounded-full animate-spin" />
              ) : (
                'Masuk →'
              )}
            </button>
          </div>

          <Link
            href="/onboarding"
            className="text-text-muted hover:text-text-secondary transition-colors text-sm"
          >
            Belum punya? Buat baru
          </Link>
        </div>
      </div>
    </div>
  );
}
