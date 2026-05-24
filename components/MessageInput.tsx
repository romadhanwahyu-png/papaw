'use client';

import { useState, useRef, useCallback } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Ketik pesan...',
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, []);

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className="w-full">
      <div
        className={`flex items-end gap-3 rounded-3xl bg-white/8 backdrop-blur-md border border-white/10 px-4 py-3 transition-all duration-300 ${
          disabled
            ? 'opacity-50 pointer-events-none'
            : 'focus-within:border-amber-400/40 focus-within:bg-white/12 focus-within:shadow-lg focus-within:shadow-amber-500/5'
        }`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-amber-50 placeholder-amber-200/30 text-lg leading-relaxed resize-none outline-none min-h-[48px] py-2 scrollbar-thin"
          style={{ maxHeight: 160 }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
            canSend
              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400 cursor-pointer'
              : 'bg-white/5 text-amber-200/20 cursor-not-allowed'
          }`}
        >
          <svg
            width="24"
            height="24"
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
        </button>
      </div>
    </div>
  );
}
