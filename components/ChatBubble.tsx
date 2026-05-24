'use client';

import { useEffect, useRef } from 'react';
import { PapawAvatar } from './PapawAvatar';

interface ChatBubbleProps {
  role: 'child' | 'papaw';
  content: string;
  timestamp?: string;
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    // Trigger fade-in
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, []);

  const isChild = role === 'child';

  const formattedTime = (() => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  return (
    <div
      ref={bubbleRef}
      className={`flex items-end gap-2.5 w-full transition-all duration-500 ease-out ${
        isChild ? 'justify-end' : 'justify-start'
      }`}
      style={{
        opacity: 0,
        transform: 'translateY(12px)',
      }}
    >
      {/* Papaw avatar on the left */}
      {!isChild && (
        <div className="shrink-0 mb-1">
          <PapawAvatar size="sm" variant="night" />
        </div>
      )}

      <div className={`max-w-[75%] ${isChild ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Bubble */}
        <div
          className={`px-5 py-3.5 text-base leading-relaxed whitespace-pre-wrap break-words ${
            isChild
              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 rounded-3xl rounded-br-lg shadow-lg shadow-amber-500/20'
              : 'bg-white/10 backdrop-blur-sm text-amber-50 rounded-3xl rounded-bl-lg shadow-lg shadow-black/10 border border-white/5'
          }`}
        >
          {content}
        </div>

        {/* Timestamp */}
        {formattedTime && (
          <span
            className={`text-[11px] mt-1.5 px-2 opacity-50 ${
              isChild ? 'text-amber-200 text-right' : 'text-amber-100/80 text-left'
            }`}
          >
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
}
