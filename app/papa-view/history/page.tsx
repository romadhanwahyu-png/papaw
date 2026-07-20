'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Message } from '@/types';

interface GroupedMessages {
  date: string;
  list: Message[];
}

function ChatHistoryPageContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get('k') || '';

  const [authorized, setAuthorized] = useState<boolean | null>(key ? null : false);
  const [profileId, setProfileId] = useState<string>('');
  const [childName, setChildName] = useState('');
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages[]>([]);
  const [loading, setLoading] = useState(!!key);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Group messages by date
  const groupMessagesByDate = useCallback((messageList: Message[]): GroupedMessages[] => {
    const map = new Map<string, Message[]>();

    messageList.forEach((msg) => {
      try {
        const dateStr = new Date(msg.created_at).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const list = map.get(dateStr) || [];
        list.push(msg);
        map.set(dateStr, list);
      } catch {
        const list = map.get('Lainnya') || [];
        list.push(msg);
        map.set('Lainnya', list);
      }
    });

    return Array.from(map.entries()).map(([date, list]) => ({
      date,
      // Sort messages within a date ascending by timestamp
      list: list.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }));
  }, []);

  // Fetch chat history
  const loadHistory = useCallback(
    async (pid: string, targetPage: number, append: boolean = false) => {
      try {
        const res = await fetch('/api/papa-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'history',
            key,
            page: targetPage,
            limit: 30,
          }),
        });

        const data = await res.json();
        if (data.messages) {
          const newMessages: Message[] = data.messages;
          if (newMessages.length < 30) {
            setHasMore(false);
          }

          setGroupedMessages((prev) => {
            let combined = newMessages;
            if (append) {
              // Flatten existing groups back to list, combine, and re-group
              const existingList = prev.reduce<Message[]>(
                (acc, group) => [...acc, ...group.list],
                []
              );
              combined = [...existingList, ...newMessages];
            }
            return groupMessagesByDate(combined);
          });
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    },
    [key, groupMessagesByDate]
  );

  // Authenticate key and load initial data
  useEffect(() => {
    if (!key) return;

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
          // Load chat history
          return loadHistory(data.profileId, 1);
        }
      })
      .catch((err) => {
        console.error('Auth verification failed:', err);
        setAuthorized(false);
      })
      .finally(() => setLoading(false));
  }, [key, loadHistory]);

  // Load more pagination
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !profileId) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadHistory(profileId, nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  }, [page, hasMore, profileId, loadingMore, loadHistory]);

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
          <h1 className="text-base font-bold text-amber-300">Riwayat Obrolan</h1>
          <p className="text-xs text-amber-200/50 mt-0.5">
            Log Percakapan Lengkap <span className="font-bold text-amber-300">{childName}</span> & Papaw
          </p>
        </div>
      </header>

      {/* Main Chat Timeline */}
      <main className="flex-1 p-4 space-y-6 max-w-xl mx-auto w-full pb-12 overflow-y-auto">
        {groupedMessages.length > 0 ? (
          <div className="space-y-8">
            {groupedMessages.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                {/* Date Header Separator */}
                <div className="flex justify-center">
                  <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold uppercase tracking-wider text-amber-300/60">
                    📅 {group.date}
                  </span>
                </div>

                {/* Message Log List */}
                <div className="space-y-3">
                  {group.list.map((msg) => {
                    const isChild = msg.role === 'child';
                    const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1 w-full ${
                          isChild ? 'items-end' : 'items-start'
                        }`}
                      >
                        {/* Sender Label */}
                        <span className="text-[10px] font-bold text-amber-200/30 uppercase tracking-wide px-2 flex items-center gap-1">
                          <span>{isChild ? '👦 Anak' : '🦉 Papaw'}</span>
                          <span>•</span>
                          <span>{timeStr}</span>
                        </span>

                        {/* Content Card with optional critical highlight */}
                        <div
                          className={`px-4.5 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] border whitespace-pre-wrap ${
                            isChild
                              ? msg.is_critical_topic
                                ? 'bg-rose-500/10 border-rose-500 text-amber-50 shadow-lg shadow-rose-500/10'
                                : 'bg-white/5 border-white/10 text-amber-50'
                              : 'bg-indigo-950/40 border-indigo-900 text-indigo-100'
                          }`}
                        >
                          {msg.content}

                          {/* Render Topic tags on each bubble */}
                          {msg.topic_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-white/5">
                              {msg.topic_tags.map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                    msg.is_critical_topic
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-white/10 text-amber-200/60'
                                  }`}
                                >
                                  🏷️ {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Critical topic tag indicator */}
                          {msg.is_critical_topic && (
                            <div className="mt-2 text-[9px] font-extrabold text-rose-300 uppercase tracking-widest flex items-center gap-1.5">
                              <span>🚨</span> PERHATIAN KHUSUS UNTUK PAPA
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-amber-100 font-bold text-sm hover:bg-white/8 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Muat Percakapan Sebelumnya 📜'
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/3 border border-white/5 rounded-3xl p-8 text-center text-sm text-amber-200/30">
            Belum ada log percakapan yang terekam
          </div>
        )}
      </main>
    </div>
  );
}

export default function ChatHistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0b1e]">
        <div className="flex flex-col items-center gap-4 text-indigo-200">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider opacity-60">MEMVERIFIKASI AKSES PAPA...</p>
        </div>
      </div>
    }>
      <ChatHistoryPageContent />
    </Suspense>
  );
}
