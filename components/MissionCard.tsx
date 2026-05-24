'use client';

import type { MissionDefinition } from '@/types';

interface MissionCardProps {
  mission: MissionDefinition;
  isCompleted: boolean;
  isLocked: boolean;
  onStart: (mission: MissionDefinition) => void;
}

export function MissionCard({ mission, isCompleted, isLocked, onStart }: MissionCardProps) {
  const handleClick = () => {
    if (!isLocked) {
      onStart(mission);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={`group relative w-full text-left rounded-3xl p-5 transition-all duration-300 border overflow-hidden ${
        isLocked
          ? 'opacity-50 grayscale border-white/5 bg-white/3 cursor-not-allowed'
          : isCompleted
            ? 'border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 cursor-pointer active:scale-[0.97]'
            : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-amber-400/20 cursor-pointer active:scale-[0.97]'
      }`}
    >
      {/* Background glow on hover (available only) */}
      {!isLocked && !isCompleted && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-amber-400/5 to-transparent" />
      )}

      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div
          className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-300 ${
            isLocked
              ? 'bg-white/5'
              : isCompleted
                ? 'bg-emerald-400/15 group-hover:scale-105'
                : 'bg-amber-400/10 group-hover:scale-105'
          }`}
        >
          {isLocked ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-200/30"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            mission.icon
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-bold text-base leading-tight truncate ${
                isLocked
                  ? 'text-amber-100/40'
                  : isCompleted
                    ? 'text-emerald-200'
                    : 'text-amber-50'
              }`}
            >
              {mission.title}
            </h3>

            {/* Completed checkmark */}
            {isCompleted && (
              <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#064e3b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </div>

          <p
            className={`text-sm leading-relaxed ${
              isLocked ? 'text-amber-200/25' : 'text-amber-200/60'
            }`}
          >
            {mission.description}
          </p>

          {/* Steps indicator */}
          <div className="flex items-center gap-1.5 mt-3">
            {Array.from({ length: mission.totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
                  isCompleted
                    ? 'bg-emerald-400/60'
                    : isLocked
                      ? 'bg-white/5'
                      : 'bg-amber-400/15'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
