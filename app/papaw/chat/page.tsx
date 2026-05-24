'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Message, BedtimeContext } from '@/types';
import { getProfileId, getSessionId, setSessionId } from '@/lib/storage';
import { ChatBubble } from '@/components/ChatBubble';
import { MessageInput } from '@/components/MessageInput';
import { PapawAvatar } from '@/components/PapawAvatar';
import { LoadingDots } from '@/components/LoadingDots';
import { BedtimeBackground } from '@/components/BedtimeBackground';
import { getBedtimeContext } from '@/lib/time';

interface DisplayMessage {
  id: string;
  role: 'child' | 'papaw';
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [profileId, setProfileIdState] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [bedtimeMode, setBedtimeMode] = useState<BedtimeContext>('bedtime');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBedtimeMode(getBedtimeContext(new Date()));
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Initialize
  useEffect(() => {
    const pid = getProfileId();
    if (!pid) {
      router.replace('/onboarding');
      return;
    }
    setProfileIdState(pid);

    const sid = getSessionId();
    if (sid) {
      setCurrentSessionId(sid);
    }

    // Load greeting message
    setMessages([
      {
        id: 'greeting',
        role: 'papaw',
        content: getGreetingMessage(),
        created_at: new Date().toISOString(),
      },
    ]);

    setIsInitializing(false);
  }, [router]);

  const getGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) {
      return 'Hai! 🌙 Udah mau bobo ya? Mau cerita dulu atau Papaw yang cerita?';
    }
    if (hour >= 18) {
      return 'Selamat malam! 🌆 Gimana hari ini? Mau cerita apa aja ke Papaw.';
    }
    if (hour >= 12) {
      return 'Hai! ☀️ Udah pulang sekolah ya? Ada cerita seru hari ini?';
    }
    return 'Selamat pagi! 🌅 Pagi-pagi semangat ya! Mau ngobrol apa?';
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!profileId || isLoading) return;

      const trimmed = text.trim();
      if (!trimmed) return;

      // Add child message to UI immediately
      const childMsg: DisplayMessage = {
        id: `child-${Date.now()}`,
        role: 'child',
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, childMsg]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId,
            message: trimmed,
            sessionId: currentSessionId,
            mode: 'free',
          }),
        });

        if (!res.ok) throw new Error('Chat failed');

        const data = await res.json();

        // Save session ID
        if (data.sessionId) {
          setCurrentSessionId(data.sessionId);
          setSessionId(data.sessionId);
        }

        // Add Papaw response
        const papawMsg: DisplayMessage = {
          id: `papaw-${Date.now()}`,
          role: 'papaw',
          content: data.response,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, papawMsg]);
      } catch {
        // Add error message
        const errorMsg: DisplayMessage = {
          id: `error-${Date.now()}`,
          role: 'papaw',
          content: 'Aduh, Papaw lagi error nih. Coba lagi ya! 🙏',
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [profileId, currentSessionId, isLoading]
  );

  if (isInitializing) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-papaw-bg">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <PapawAvatar size="md" />
          <LoadingDots />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden bg-papaw-bg">
      <BedtimeBackground mode={bedtimeMode} />

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-papaw-border/30 bg-papaw-bg/40 backdrop-blur-md sticky top-0 z-20">
          <Link
            href="/papaw"
            className="touch-target flex items-center justify-center w-10 h-10 rounded-xl bg-papaw-surface/50 text-text-secondary hover:text-text-primary hover:bg-papaw-surface transition-all"
          >
            ←
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <PapawAvatar size="sm" />
            <div>
              <h1 className="text-lg font-bold text-text-primary">Papaw</h1>
              <p className="text-xs text-text-muted">
                {isLoading ? 'Lagi mikir...' : 'Online'}
              </p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-in-up ${
                msg.role === 'child' ? 'justify-end' : 'justify-start'
              }`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <ChatBubble role={msg.role} content={msg.content} />
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-fade-in px-2.5">
              <div className="flex-shrink-0 mt-1">
                <PapawAvatar size="sm" />
              </div>
              <div className="chat-bubble chat-bubble-papaw bg-white/10 backdrop-blur-sm text-amber-50 rounded-3xl rounded-bl-lg shadow-lg shadow-black/10 border border-white/5 px-5 py-3.5">
                <LoadingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 border-t border-papaw-border/30 bg-papaw-bg/60 backdrop-blur-md p-4">
          <MessageInput
            onSend={sendMessage}
            disabled={isLoading}
            placeholder="Ketik pesan..."
          />
        </div>
      </div>
    </div>
  );
}
