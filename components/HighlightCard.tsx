'use client';

import type { Highlight, HighlightType } from '@/types';

interface HighlightCardProps {
  highlight: Highlight;
}

const typeConfig: Record<HighlightType, { emoji: string; label: string; accentClass: string }> = {
  curious_question: {
    emoji: '🤔',
    label: 'Curious',
    accentClass: 'from-blue-400/15 to-blue-400/5 border-blue-400/20',
  },
  cute_moment: {
    emoji: '😊',
    label: 'Cute',
    accentClass: 'from-pink-400/15 to-pink-400/5 border-pink-400/20',
  },
  deep_thinking: {
    emoji: '💭',
    label: 'Deep',
    accentClass: 'from-purple-400/15 to-purple-400/5 border-purple-400/20',
  },
};

export function HighlightCard({ highlight }: HighlightCardProps) {
  const config = typeConfig[highlight.highlight_type];

  const formattedDate = (() => {
    try {
      return new Date(highlight.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  })();

  return (
    <div
      className={`relative rounded-3xl p-5 border bg-gradient-to-br ${config.accentClass} transition-all duration-300 hover:scale-[1.02]`}
    >
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{config.emoji}</span>
        <span className="text-xs font-semibold text-amber-200/50 uppercase tracking-wider">
          {config.label}
        </span>
      </div>

      {/* Quotation */}
      <div className="relative pl-4">
        {/* Decorative quote mark */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-amber-400/20" />

        <p className="text-amber-50/90 text-base leading-relaxed italic">
          &ldquo;{highlight.excerpt}&rdquo;
        </p>
      </div>

      {/* Date */}
      <div className="mt-3 text-right">
        <span className="text-[11px] text-amber-300/30">{formattedDate}</span>
      </div>
    </div>
  );
}
