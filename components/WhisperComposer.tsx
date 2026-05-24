'use client';

import { useState, useCallback } from 'react';

interface WhisperComposerProps {
  onSend: (message: string, scheduledFor: string | null) => void;
}

const MAX_CHARS = 500;

export function WhisperComposer({ onSend }: WhisperComposerProps) {
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const charCount = message.length;
  const canSend = message.trim().length > 0 && charCount <= MAX_CHARS;

  const getScheduledISO = useCallback((): string | null => {
    if (!showSchedule || !scheduledDate || !scheduledTime) return null;
    try {
      return new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    } catch {
      return null;
    }
  }, [showSchedule, scheduledDate, scheduledTime]);

  const handleSendClick = () => {
    if (!canSend) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (!canSend) return;
    onSend(message.trim(), getScheduledISO());
    setMessage('');
    setScheduledDate('');
    setScheduledTime('');
    setShowSchedule(false);
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <div className="relative rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 transition-all duration-300 focus-within:border-amber-400/25">
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💌</span>
        <h3 className="text-amber-100 font-bold text-base">Kirim Whisper</h3>
      </div>

      <p className="text-amber-200/40 text-sm mb-4 leading-relaxed">
        Tulis pesan rahasia untuk Mayka. Papaw akan menyampaikannya saat ngobrol nanti.
      </p>

      {/* Textarea */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tulis whisper di sini... ✨"
        rows={4}
        className="w-full bg-white/5 rounded-2xl px-4 py-3 text-amber-50 placeholder-amber-200/20 text-base leading-relaxed resize-none outline-none border border-white/5 focus:border-amber-400/20 transition-colors duration-300"
        maxLength={MAX_CHARS + 50} // Allow slight overflow for visual feedback
      />

      {/* Character count */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span
          className={`text-xs font-medium transition-colors duration-300 ${
            charCount > MAX_CHARS
              ? 'text-red-400'
              : charCount > MAX_CHARS * 0.8
                ? 'text-amber-400'
                : 'text-amber-200/30'
          }`}
        >
          {charCount}/{MAX_CHARS}
        </span>

        {/* Schedule toggle */}
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 cursor-pointer ${
            showSchedule
              ? 'bg-amber-400/15 text-amber-300'
              : 'text-amber-200/40 hover:text-amber-200/60 hover:bg-white/5'
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Jadwalkan
        </button>
      </div>

      {/* Schedule picker */}
      {showSchedule && (
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-amber-100 text-sm outline-none focus:border-amber-400/30 transition-colors duration-300"
          />
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-amber-100 text-sm outline-none focus:border-amber-400/30 transition-colors duration-300"
          />
        </div>
      )}

      {/* Send button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSendClick}
          disabled={!canSend}
          className={`px-6 py-3 rounded-2xl font-semibold text-base transition-all duration-300 active:scale-95 flex items-center gap-2 ${
            canSend
              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 cursor-pointer'
              : 'bg-white/5 text-amber-200/20 cursor-not-allowed'
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
          Kirim Whisper
        </button>
      </div>

      {/* Confirmation modal overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div
            className="bg-[#1a1b3a] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl"
            style={{
              animation: 'confirm-pop 0.3s ease-out',
            }}
          >
            <h4 className="text-amber-100 font-bold text-lg mb-2">Kirim whisper ini?</h4>
            <div className="bg-white/5 rounded-2xl p-4 mb-4">
              <p className="text-amber-50/80 text-sm leading-relaxed italic">
                &ldquo;{message.trim()}&rdquo;
              </p>
              {getScheduledISO() && (
                <p className="text-amber-300/50 text-xs mt-2">
                  📅 Dijadwalkan: {scheduledDate} pukul {scheduledTime}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl text-amber-200/60 hover:text-amber-100 hover:bg-white/5 transition-all duration-300 text-sm font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 font-semibold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-300 active:scale-95 cursor-pointer"
              >
                Ya, kirim! 💌
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes confirm-pop {
              from {
                opacity: 0;
                transform: scale(0.92) translateY(10px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
