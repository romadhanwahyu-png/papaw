'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfileId } from '@/lib/storage';
import { BedtimeBackground } from '@/components/BedtimeBackground';
import { PapawAvatar } from '@/components/PapawAvatar';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useBedtime } from '@/lib/use-bedtime';
import type { Profile, Language } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [childName, setChildName] = useState('');
  const [language, setLanguage] = useState<Language>('mix');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const bedtimeMode = useBedtime();
  const [message, setMessage] = useState('');
  const [papaViewUrl, setPapaViewUrl] = useState('');

  // Load Profile
  useEffect(() => {
    const profileId = getProfileId();
    if (!profileId) {
      router.replace('/onboarding');
      return;
    }

    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', profileId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setChildName(data.profile.child_name);
          setLanguage(data.profile.default_language);
        } else {
          router.replace('/onboarding');
        }
      })
      .catch((err) => {
        console.error('Error loading settings:', err);
      })
      .finally(() => setLoading(false));

    // Fetch the Papa View share URL separately — the parent key is only
    // returned by this explicit action, never in the general profile body.
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share-url', profileId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.papaViewUrl) {
          const path = data.papaViewUrl as string;
          setPapaViewUrl(
            typeof window !== 'undefined' && path.startsWith('/')
              ? `${window.location.origin}${path}`
              : path
          );
        }
      })
      .catch((err) => {
        console.error('Error loading Papa View link:', err);
      });
  }, [router]);

  // Save Settings
  const handleSave = useCallback(async () => {
    const profileId = getProfileId();
    if (!profileId || saving) return;

    const trimmed = childName.trim();
    if (!trimmed) {
      setMessage('Nama tidak boleh kosong! ⚠️');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          profileId,
          updates: {
            child_name: trimmed,
            default_language: language,
          },
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setMessage('Pengaturan berhasil disimpan! ✨');
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage('Gagal menyimpan, coba lagi ya! 🙏');
    } finally {
      setSaving(false);
    }
  }, [childName, language, saving]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-papaw-bg">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <PapawAvatar size="md" />
          <div className="w-6 h-6 border-2 border-warm-amber border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-papaw-bg text-amber-50">
      <BedtimeBackground mode={bedtimeMode} />

      <div className="relative z-10 min-h-dvh flex flex-col p-6 max-w-md mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/papaw"
            className="touch-target flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-xl transition-all hover:bg-white/8 active:scale-95 animate-fade-in"
          >
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-sans">Pengaturan</h1>
            <p className="text-sm text-amber-200/60">
              Ubah nama, bahasa, dan infokan link Papa! 🌙
            </p>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 space-y-6 animate-fade-in-up">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-200/50 uppercase tracking-wider block">
              Nama Panggilan Kamu
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-amber-50 text-base placeholder:text-amber-100/20 focus:bg-white/8 focus:border-amber-400/30 transition-all outline-none"
              placeholder="Masukkan nama panggilan..."
              maxLength={30}
            />
          </div>

          {/* Language Toggle Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-200/50 uppercase tracking-wider block">
              Bahasa Obrolan
            </label>
            <div>
              <LanguageToggle value={language} onChange={setLanguage} />
            </div>
          </div>

          {/* Papa View Link Display Card */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-200/50 uppercase tracking-wider block">
              Akses Papa View (Untuk Papa)
            </label>
            <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-amber-200/60 leading-relaxed">
                Tunjukkan QR / salin link ini dan berikan ke Papa supaya Papa bisa
                kirim bisikan dan memantau tumbuh kembang kamu!
              </p>
              <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center justify-between gap-3 overflow-hidden select-all cursor-pointer">
                <span className="text-xs font-mono text-amber-400/80 truncate select-all">
                  {papaViewUrl || 'Memuat link…'}
                </span>
                <button
                  disabled={!papaViewUrl}
                  onClick={() => {
                    navigator.clipboard.writeText(papaViewUrl);
                    alert('Link berhasil disalin! 📋');
                  }}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white/10 text-amber-100 font-semibold hover:bg-white/15 active:scale-95 disabled:opacity-40"
                >
                  Salin
                </button>
              </div>
            </div>
          </div>

          {/* Save Status Message */}
          {message && (
            <p className="text-center font-medium text-sm animate-fade-in text-warm-amber">
              {message}
            </p>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="touch-target w-full py-4 bg-warm-amber text-indigo-night font-bold text-base rounded-2xl transition-all shadow-lg hover:bg-warm-amber-soft active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-indigo-night border-t-transparent rounded-full animate-spin" />
            ) : (
              'Simpan Pengaturan ✨'
            )}
          </button>
        </main>
      </div>
    </div>
  );
}
