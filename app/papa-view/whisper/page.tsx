'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { WhisperComposer } from '@/components/WhisperComposer';
import type { Whisper } from '@/types';

function PapaWhisperComposerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get('k') || '';

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [profileId, setProfileId] = useState<string>('');
  const [childName, setChildName] = useState('');
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch whisper history
  const loadHistory = useCallback(async (pid: string) => {
    try {
      const res = await fetch('/api/whisper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'history', profileId: pid }),
      });
      const data = await res.json();
      if (data.success && data.whispers) {
        // Sort newest first
        setWhispers(
          data.whispers.sort(
            (a: Whisper, b: Whisper) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
      }
    } catch (err) {
      console.error('Failed to load whisper history:', err);
    }
  }, []);

  // Authenticate key and load data
  useEffect(() => {
    if (!key) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    fetch('/api/papa-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'summary', key }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setAuthorized(false);
        } else {
          setAuthorized(true);
          setProfileId(data.profileId);
          setChildName(data.childName);
          // Load whispers
          return loadHistory(data.profileId);
        }
      })
      .catch((err) => {
        console.error('Auth check failed:', err);
        setAuthorized(false);
      })
      .finally(() => setLoading(false));
  }, [key, loadHistory]);

  // Handle Whisper Send Callback
  const handleSendWhisper = useCallback(
    async (text: string, scheduledFor: string | null) => {
      if (!profileId || sending) return;

      setSending(true);
      setMessage('');

      try {
        const res = await fetch('/api/whisper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            key,
            message: text,
            scheduledFor,
          }),
        });

        if (!res.ok) throw new Error('Failed to create whisper');

        const data = await res.json();
        if (data.success) {
          setMessage('Bisikan berhasil dikirim! 💌');
          // Reload history
          await loadHistory(profileId);
        } else {
          throw new Error('Create whisper failed');
        }
      } catch (err) {
        console.error('Error creating whisper:', err);
        setMessage('Gagal mengirim bisikan, coba lagi ya! 🙏');
      } finally {
        setSending(false);
      }
    },
    [profileId, key, sending, loadHistory]
  );

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0b1e]">
        <div className="flex flex-col items-center gap-4 animate-fade-in text-indigo-200">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider opacity-60">MEMVERIFIKASI AKSES PAPA...</p>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0b1e] p-6 text-amber-50">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
          <div className="text-6xl animate-float">🔒</div>
          <h1 className="text-2xl font-black text-amber-300">Akses Terkunci</h1>
          <p className="text-sm text-amber-200/60 leading-relaxed">
            Link akses Papa View salah atau tidak memiliki izin. Silakan salin link yang valid dari menu pengaturan aplikasi Papaw di tablet Anak.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0a0b1e] text-amber-50 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-5 border-b border-white/5 bg-[#0a0b1e]/80 backdrop-blur-md sticky top-0 z-20 flex items-center gap-4">
        <Link
          href={`/papa-view?k=${key}`}
          className="touch-target flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-xl transition-all hover:bg-white/8 active:scale-95 cursor-pointer"
        >
          ←
        </Link>
        <div>
          <h1 className="text-base font-bold text-amber-300">Kirim Bisikan</h1>
          <p className="text-xs text-amber-200/50 mt-0.5">
            Bisikan Rahasia untuk <span className="font-bold text-amber-300">{childName}</span>
          </p>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-xl mx-auto w-full pb-12">
        {/* Whisper Composer Component */}
        <div className="animate-fade-in">
          <WhisperComposer onSend={handleSendWhisper} />
        </div>

        {/* Status Message */}
        {message && (
          <p className="text-center font-semibold text-sm animate-fade-in text-warm-amber">
            {message}
          </p>
        )}

        {/* Sent Whispers History Timeline */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-amber-200/50 uppercase tracking-wider">
            Riwayat Bisikan Papa 📜
          </h2>

          {whispers.length > 0 ? (
            <div className="space-y-3">
              {whispers.map((w) => {
                const hasDelivered = !!w.delivered_at;
                const isScheduledFuture =
                  w.scheduled_for && new Date(w.scheduled_for).getTime() > Date.now();

                let statusLabel = '⏳ Menunggu Terkirim';
                let statusColor = 'text-amber-200/40 bg-white/3 border-white/5';

                if (hasDelivered) {
                  statusLabel = `✔️ Terkirim ke Anak pada ${new Date(
                    w.delivered_at!
                  ).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`;
                  statusColor = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
                } else if (isScheduledFuture) {
                  statusLabel = `📅 Dijadwalkan untuk ${new Date(
                    w.scheduled_for!
                  ).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`;
                  statusColor = 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20';
                }

                return (
                  <div
                    key={w.id}
                    className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-3 animate-fade-in-up"
                  >
                    <p className="text-amber-50/90 text-sm leading-relaxed whitespace-pre-wrap italic">
                      &ldquo;{w.message}&rdquo;
                    </p>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                      <span className="text-[10px] text-amber-200/30">
                        Ditulis pada {new Date(w.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/3 border border-white/5 rounded-3xl p-6 text-center text-xs text-amber-200/30">
              Belum ada bisikan yang dikirim. Tulis bisikan pertama kamu di atas! ✨
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PapaWhisperComposerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0b1e]">
        <div className="flex flex-col items-center gap-4 text-indigo-200">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider opacity-60">MEMVERIFIKASI AKSES PAPA...</p>
        </div>
      </div>
    }>
      <PapaWhisperComposerPageContent />
    </Suspense>
  );
}
