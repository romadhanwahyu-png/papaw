'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HighlightCard } from '@/components/HighlightCard';
import { TopicMap } from '@/components/TopicMap';
import type { Highlight, TodaySummary, WeekSummary, TopicFrequency } from '@/types';

function PapaViewDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get('k') || '';

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [childName, setChildName] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [topics, setTopics] = useState<{ topic: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Authenticate parent key and load initial data
  useEffect(() => {
    if (!key) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    // Authenticate and fetch stats
    Promise.all([
      // Summary (Today & Week)
      fetch('/api/papa-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summary', key }),
      }).then((res) => res.json()),
      // Highlights
      fetch('/api/papa-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'highlights', key, dateRange: 'week' }),
      }).then((res) => res.json()),
      // Topics
      fetch('/api/papa-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'topics', key }),
      }).then((res) => res.json()),
    ])
      .then(([summaryData, highlightsData, topicsData]) => {
        if (summaryData.error) {
          setAuthorized(false);
        } else {
          setAuthorized(true);
          setChildName(summaryData.childName || 'Anak');
          setTodaySummary(summaryData.today);
          setWeekSummary(summaryData.week);

          if (highlightsData.highlights) {
            setHighlights(highlightsData.highlights);
          }
          if (topicsData.topics) {
            // Map TopicFrequency to bubble charts
            setTopics(
              topicsData.topics.map((t: TopicFrequency) => ({
                topic: t.topic,
                count: t.count,
              }))
            );
          }
        }
      })
      .catch((err) => {
        console.error('Authentication or loading failed:', err);
        setAuthorized(false);
      })
      .finally(() => setLoading(false));
  }, [key]);

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

  // Unauthorized page
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
      <header className="px-6 py-5 border-b border-white/5 bg-[#0a0b1e]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤵</span>
            <h1 className="text-lg font-black tracking-wide text-amber-300">PAPA VIEW</h1>
          </div>
          <p className="text-xs text-amber-200/50 mt-0.5">
            Memantau Tumbuh Kembang <span className="text-amber-300 font-bold">{childName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Whisper Link */}
          <Link
            href={`/papa-view/whisper?k=${key}`}
            className="px-3.5 py-2 bg-amber-400 text-indigo-950 rounded-xl font-bold text-xs shadow-md shadow-amber-400/10 hover:bg-amber-300 transition-all cursor-pointer active:scale-95"
          >
            ✍️ Bisikan
          </Link>
          {/* History Link */}
          <Link
            href={`/papa-view/history?k=${key}`}
            className="px-3.5 py-2 bg-white/5 border border-white/10 text-amber-100 rounded-xl font-bold text-xs hover:bg-white/8 transition-all cursor-pointer active:scale-95"
          >
            📜 Riwayat
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 space-y-6 max-w-xl mx-auto w-full pb-12">
        {/* Tab Controls */}
        <div className="flex rounded-2xl bg-white/5 border border-white/10 p-1 gap-1">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-amber-400 text-[#0a0b1e] shadow-md shadow-amber-400/10'
                : 'text-amber-200/60 hover:text-amber-100'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'week'
                ? 'bg-amber-400 text-[#0a0b1e] shadow-md shadow-amber-400/10'
                : 'text-amber-200/60 hover:text-amber-100'
            }`}
          >
            Minggu Ini
          </button>
        </div>

        {/* Tab Content: Today Summary */}
        {activeTab === 'today' && todaySummary && (
          <div className="space-y-4 animate-fade-in">
            {/* Today Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-amber-300">
                  {todaySummary.sessionCount}
                </div>
                <div className="text-[10px] text-amber-200/40 font-bold uppercase tracking-wider mt-1">
                  Sesi
                </div>
              </div>
              <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-amber-300">
                  {todaySummary.messageCount}
                </div>
                <div className="text-[10px] text-amber-200/40 font-bold uppercase tracking-wider mt-1">
                  Pesan
                </div>
              </div>
              <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-amber-300">
                  {todaySummary.totalDurationMinutes}m
                </div>
                <div className="text-[10px] text-amber-200/40 font-bold uppercase tracking-wider mt-1">
                  Durasi
                </div>
              </div>
            </div>

            {/* Dominant Topics Today */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-amber-200/50 uppercase tracking-wider">
                Topik Dominan Hari Ini
              </h3>
              {todaySummary.dominantTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {todaySummary.dominantTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs font-medium text-amber-300"
                    >
                      🏷️ {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-200/30">Belum ada obrolan hari ini</p>
              )}
            </div>

            {/* Critical Topics Alert Box */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-rose-300/80 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🚨</span> Alasan Perhatian Khusus
                </h3>
                {todaySummary.criticalTopicAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-[10px] text-rose-300 font-bold">
                    {todaySummary.criticalTopicAlerts.length} Peringatan
                  </span>
                )}
              </div>

              {todaySummary.criticalTopicAlerts.length > 0 ? (
                <div className="space-y-2">
                  {todaySummary.criticalTopicAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-rose-300 font-bold text-[10px] tracking-wide uppercase">
                        <span>Pemicu: {alert.topic}</span>
                        <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-amber-50/80 italic leading-relaxed">
                        &ldquo;{alert.excerpt}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400/60 font-medium">
                  ✔️ Hari ini aman. Tidak ada topik sensitif (kesedihan mendalam, mimpi buruk) yang terdeteksi.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Week Summary */}
        {activeTab === 'week' && weekSummary && (
          <div className="space-y-4 animate-fade-in">
            {/* Week Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-amber-300">
                  {weekSummary.streakDays} Hari
                </div>
                <div className="text-[10px] text-amber-200/40 font-bold uppercase tracking-wider mt-1">
                  Obrolan Streak
                </div>
              </div>
              <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-amber-300">
                  {weekSummary.totalSessions} Sesi
                </div>
                <div className="text-[10px] text-amber-200/40 font-bold uppercase tracking-wider mt-1">
                  Obrolan Minggu Ini
                </div>
              </div>
            </div>

            {/* Trending Topics Week */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-amber-200/50 uppercase tracking-wider">
                Tren Topik Minggu Ini
              </h3>
              {weekSummary.trendingTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {weekSummary.trendingTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-400/20 text-xs font-medium text-indigo-300"
                    >
                      📈 {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-200/30">Belum ada data obrolan minggu ini</p>
              )}
            </div>

            {/* Premium Daily Activity Chart (styled HTML bars) */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-amber-200/50 uppercase tracking-wider">
                Keaktifan Obrolan Harian
              </h3>
              <div className="flex justify-between items-end h-28 pt-4 px-2">
                {weekSummary.dailyActivity.map((day, i) => {
                  const maxMsg = Math.max(...weekSummary.dailyActivity.map((d) => d.messageCount)) || 1;
                  const heightPct = Math.round((day.messageCount / maxMsg) * 100);

                  return (
                    <div key={i} className="flex flex-col items-center flex-1 space-y-1.5">
                      <div className="relative w-4 w-full flex flex-col justify-end h-16 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="w-full rounded-full bg-gradient-to-t from-amber-500 to-amber-300 transition-all duration-1000 ease-out"
                          style={{ height: `${day.messageCount > 0 ? Math.max(10, heightPct) : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-amber-200/40 font-bold uppercase">
                        {day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Packing Circles Topic Map */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold text-amber-200/50 uppercase tracking-wider">
            Peta Topik Minat Anak 🗺️
          </h2>
          <TopicMap topics={topics} />
        </div>

        {/* Cognitive Highlights quotes section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-amber-200/50 uppercase tracking-wider">
            Catatan Momen Menarik 💡
          </h2>
          {highlights.length > 0 ? (
            <div className="grid gap-3">
              {highlights.map((hl) => (
                <HighlightCard key={hl.id} highlight={hl} />
              ))}
            </div>
          ) : (
            <div className="bg-white/3 border border-white/5 rounded-3xl p-6 text-center text-xs text-amber-200/30">
              Belum ada quote menarik yang terdeteksi
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PapaViewDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0b1e]">
        <div className="flex flex-col items-center gap-4 text-indigo-200">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider opacity-60">MEMVERIFIKASI AKSES PAPA...</p>
        </div>
      </div>
    }>
      <PapaViewDashboardContent />
    </Suspense>
  );
}
