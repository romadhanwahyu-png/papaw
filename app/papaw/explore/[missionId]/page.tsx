'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getProfileId } from '@/lib/storage';
import { BedtimeBackground } from '@/components/BedtimeBackground';
import { PapawAvatar } from '@/components/PapawAvatar';
import { ChatBubble } from '@/components/ChatBubble';
import { MessageInput } from '@/components/MessageInput';
import { LoadingDots } from '@/components/LoadingDots';
import { getBedtimeContext } from '@/lib/time';
import { getMission } from '@/lib/missions';
import type { Profile, MissionDefinition, MissionState, BedtimeContext, Badge } from '@/types';

export default function MissionChatPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.missionId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [mission, setMission] = useState<MissionDefinition | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: 'child' | 'papaw'; content: string }[]>([]);
  const [missionState, setMissionState] = useState<MissionState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [bedtimeMode, setBedtimeMode] = useState<BedtimeContext>('bedtime');

  // Quiz interactive state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Completion / Badge Award
  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Sync background
  useEffect(() => {
    setBedtimeMode(getBedtimeContext(new Date()));
  }, []);

  // Initialize
  useEffect(() => {
    const profileId = getProfileId();
    if (!profileId) {
      router.replace('/onboarding');
      return;
    }

    const currentMission = getMission(missionId);
    if (!currentMission) {
      router.replace('/papaw/explore');
      return;
    }
    setMission(currentMission);

    // Get Profile & Start Mission Session
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', profileId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          // Start mission chat session
          return fetch('/api/mission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'start',
              profileId,
              missionId,
            }),
          });
        } else {
          router.replace('/onboarding');
          throw new Error('No profile');
        }
      })
      .then((res) => res?.json())
      .then((data) => {
        if (data) {
          setSessionId(data.sessionId);
          setMissionState(data.missionState);
          setMessages([
            {
              id: 'mission-start',
              role: 'papaw',
              content: data.response,
            },
          ]);
        }
      })
      .catch((err) => {
        console.error('Error starting mission:', err);
      })
      .finally(() => setIsInitializing(false));
  }, [missionId, router]);

  // Send Child Chat Message
  const sendMessage = useCallback(
    async (text: string) => {
      const profileId = getProfileId();
      if (!profileId || !sessionId || isLoading || !missionState) return;

      const trimmed = text.trim();
      if (!trimmed) return;

      // Add child's message immediately
      setMessages((prev) => [...prev, { id: `child-${Date.now()}`, role: 'child', content: trimmed }]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'step',
            profileId,
            sessionId,
            message: trimmed,
          }),
        });

        if (!res.ok) throw new Error('Failed to send message');

        const data = await res.json();
        setMissionState(data.missionState);

        // Add Papaw's response
        setMessages((prev) => [
          ...prev,
          {
            id: `papaw-${Date.now()}`,
            role: 'papaw',
            content: data.response,
          },
        ]);

        if (data.badge) {
          setEarnedBadge(data.badge);
        }
      } catch (err) {
        console.error('Chat error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'papaw',
            content: 'Aduh, Papaw ada kendala koneksi nih. Boleh diulang? 🙏',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, missionState]
  );

  // Submit Quiz Answer
  const handleQuizAnswer = useCallback(
    async (optionIndex: number) => {
      setSelectedAnswer(optionIndex);
      setShowExplanation(true);
    },
    []
  );

  // Progress to next quiz question or completion
  const handleNextQuizQuestion = useCallback(async () => {
    const profileId = getProfileId();
    if (!profileId || !sessionId || selectedAnswer === null || !missionState || !mission) return;

    setIsLoading(true);
    setSelectedAnswer(null);
    setShowExplanation(false);

    try {
      const res = await fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'step',
          profileId,
          sessionId,
          quizAnswer: selectedAnswer,
          message: 'Jawaban Kuis',
        }),
      });

      if (!res.ok) throw new Error('Failed to submit quiz');

      const data = await res.json();
      setMissionState(data.missionState);

      // Add response (quiz result explanation or final congrats)
      setMessages((prev) => [
        ...prev,
        {
          id: `quiz-step-${Date.now()}`,
          role: 'papaw',
          content: data.response,
        },
      ]);

      if (data.badge) {
        setEarnedBadge(data.badge);
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, selectedAnswer, missionState, mission]);

  if (isInitializing || !mission) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-papaw-bg">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <PapawAvatar size="md" />
          <LoadingDots />
        </div>
      </div>
    );
  }

  // Quiz active state details
  const isQuizPhase = missionState?.phase === 'quiz';
  const currentQuizIndex = missionState?.currentStep || 0;
  const currentQuestion = mission.quizQuestions[currentQuizIndex];

  // Completion modal details
  const isCompletePhase = missionState?.phase === 'complete';

  return (
    <div className="min-h-dvh flex flex-col bg-papaw-bg text-amber-50">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 border-b border-papaw-border/50 bg-papaw-bg/80 backdrop-blur-md sticky top-0 z-20">
        <Link
          href="/papaw/explore"
          className="touch-target flex items-center justify-center w-10 h-10 rounded-xl bg-papaw-surface/50 text-text-secondary hover:text-text-primary hover:bg-papaw-surface transition-all"
        >
          ←
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl">{mission.icon}</span>
          <div>
            <h1 className="text-base font-bold text-text-primary truncate max-w-[200px] sm:max-w-xs">
              {mission.title}
            </h1>
            <p className="text-xs text-text-muted">
              {isQuizPhase ? 'Fase Kuis Bedtime 📝' : 'Misi Petualangan 🗺️'}
            </p>
          </div>
        </div>
      </header>

      {/* Message & Conversation Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in-up ${
              msg.role === 'child' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'papaw' && (
              <div className="flex-shrink-0 mt-1">
                <PapawAvatar size="sm" />
              </div>
            )}
            <ChatBubble role={msg.role} content={msg.content} />
          </div>
        ))}

        {isLoading && !isQuizPhase && (
          <div className="flex gap-3 justify-start animate-fade-in">
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

      {/* Controls: Chat Input OR Bedtime Quiz Card */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-papaw-border/50 bg-papaw-bg/90 backdrop-blur-md p-4 z-10 max-w-2xl mx-auto rounded-t-3xl">
        {!isQuizPhase && !isCompletePhase ? (
          <MessageInput
            onSend={sendMessage}
            disabled={isLoading}
            placeholder="Yuk ketik jawaban kamu..."
          />
        ) : isQuizPhase && currentQuestion ? (
          /* QUIZ CARD SYSTEM */
          <div className="animate-fade-in-up p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between text-xs text-amber-200/50">
              <span>PERTANYAAN KUIS</span>
              <span>
                {currentQuizIndex + 1} dari {mission.quizQuestions.length}
              </span>
            </div>
            <h2 className="text-base font-bold text-amber-50 leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Answer Options */}
            <div className="grid gap-2">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedAnswer === oIdx;
                const isCorrect = oIdx === currentQuestion.correctIndex;
                const answered = selectedAnswer !== null;

                let optStyle = 'bg-white/5 border-white/10 text-amber-50 hover:bg-white/8';
                if (answered) {
                  if (isCorrect) {
                    optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200';
                  } else if (isSelected) {
                    optStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
                  } else {
                    optStyle = 'bg-white/3 border-white/5 text-amber-50/40 cursor-not-allowed';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => !answered && handleQuizAnswer(oIdx)}
                    disabled={answered}
                    className={`w-full py-3.5 px-4 rounded-xl text-left border font-medium text-sm transition-all flex items-center justify-between cursor-pointer active:scale-[0.98] ${optStyle}`}
                  >
                    <span>{opt}</span>
                    {answered && isCorrect && <span className="text-emerald-400">✔️</span>}
                    {answered && isSelected && !isCorrect && <span className="text-rose-400">❌</span>}
                  </button>
                );
              })}
            </div>

            {/* Explanation box */}
            {showExplanation && (
              <div className="animate-fade-in bg-amber-400/10 border border-amber-400/20 rounded-xl p-3.5 text-xs text-amber-200/80 leading-relaxed">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <span>💡</span> Penjelasan
                </div>
                {currentQuestion.explanation}

                <button
                  onClick={handleNextQuizQuestion}
                  disabled={isLoading}
                  className="w-full mt-3 py-2.5 rounded-lg bg-warm-amber text-indigo-night font-bold text-sm hover:bg-warm-amber-soft transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-indigo-night border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {currentQuizIndex < mission.quizQuestions.length - 1 ? 'Lanjut Kuis →' : 'Selesaikan Petualangan! 🏅'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* MISSION COMPLETED CELEBRATION COMPONENT */
          <div className="animate-fade-in-up p-5 text-center space-y-4">
            <h2 className="text-xl font-extrabold text-emerald-400">🎉 Misi Selesai! 🎉</h2>
            <p className="text-sm text-amber-200/80 leading-relaxed">
              Hebat banget! Kamu telah menyelesaikan petualangan sains/sejarah ini dan berhak mendapatkan lencana kehormatan!
            </p>
            <div className="flex justify-center">
              <Link
                href="/papaw/explore"
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-indigo-night font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer block w-full max-w-xs text-center"
              >
                Kembali ke Petualangan 🏅
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Premium Badge Earned Modal overlay */}
      {earnedBadge && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-indigo-950 to-indigo-900 border border-amber-400/30 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl shadow-amber-400/10 relative overflow-hidden">
            {/* Shimmer glitter particles background effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none" />

            <div className="space-y-2">
              <span className="text-xs font-bold tracking-widest text-warm-amber uppercase">
                LENCANA DITEMUKAN!
              </span>
              <h3 className="text-2xl font-black text-amber-50">
                Kamu Mendapatkan Lencana Baru!
              </h3>
            </div>

            {/* Premium Badge Display */}
            <div className="relative flex justify-center">
              {/* Spinning/glowing back ring */}
              <div className="absolute w-28 h-28 rounded-full bg-amber-400/20 animate-spin border-2 border-dashed border-amber-400/40" style={{ animationDuration: '10s' }} />
              {/* Badge Circle container */}
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-6xl shadow-xl shadow-amber-500/30 border-4 border-amber-200">
                {earnedBadge.icon}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-amber-200">{earnedBadge.title}</h4>
              <p className="text-xs text-amber-200/50">
                Telah dianugerahkan pada {new Date(earnedBadge.earned_at).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => setEarnedBadge(null)}
              className="w-full py-4 bg-warm-amber text-indigo-night font-bold text-base rounded-2xl transition-all shadow-lg hover:bg-warm-amber-soft active:scale-[0.97] cursor-pointer"
            >
              Simpan di Koleksi 🏅
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
