'use client';

import type { Badge } from '@/types';

interface BadgeCardProps {
  badge: Badge;
  isEarned: boolean;
}

export function BadgeCard({ badge, isEarned }: BadgeCardProps) {
  const earnedDate = (() => {
    if (!isEarned || !badge.earned_at) return '';
    try {
      return new Date(badge.earned_at).toLocaleDateString('id-ID', {
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
      className={`relative flex flex-col items-center text-center rounded-3xl p-5 transition-all duration-300 overflow-hidden border ${
        isEarned
          ? 'border-amber-400/20 bg-gradient-to-b from-amber-400/10 to-amber-400/3 hover:scale-105 cursor-default'
          : 'border-white/5 bg-white/3 grayscale opacity-50 cursor-default'
      }`}
    >
      {/* Shimmer effect for earned badges */}
      {isEarned && (
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl"
          aria-hidden="true"
        >
          <div
            className="absolute -top-full -left-full w-[200%] h-[200%]"
            style={{
              background:
                'linear-gradient(115deg, transparent 40%, rgba(251,191,36,0.08) 45%, rgba(251,191,36,0.15) 50%, rgba(251,191,36,0.08) 55%, transparent 60%)',
              animation: 'badge-shimmer 4s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Badge icon */}
      <div
        className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 ${
          isEarned
            ? 'bg-amber-400/15 shadow-inner'
            : 'bg-white/5'
        }`}
      >
        {isEarned ? (
          badge.icon
        ) : (
          <span className="text-amber-200/20 text-2xl font-bold">?</span>
        )}
      </div>

      {/* Title */}
      <h4
        className={`relative z-10 font-bold text-sm leading-tight mb-1 ${
          isEarned ? 'text-amber-100' : 'text-amber-200/30'
        }`}
      >
        {isEarned ? badge.title : '???'}
      </h4>

      {/* Date */}
      {isEarned && earnedDate && (
        <span className="relative z-10 text-[11px] text-amber-300/40 mt-0.5">
          {earnedDate}
        </span>
      )}

      <style jsx>{`
        @keyframes badge-shimmer {
          0% {
            transform: translate(-30%, -30%) rotate(0deg);
          }
          50% {
            transform: translate(30%, 30%) rotate(0deg);
          }
          100% {
            transform: translate(-30%, -30%) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
