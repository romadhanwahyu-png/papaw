'use client';

import type { CategoryInfo } from '@/types';

interface CategoryGridProps {
  categories: CategoryInfo[];
  onSelect: (category: CategoryInfo) => void;
}

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {categories.map((cat) => {
        const totalMissions = cat.missions.length;
        const isFullyComplete = cat.completedCount >= totalMissions && totalMissions > 0;
        const progressPercent =
          totalMissions > 0 ? Math.round((cat.completedCount / totalMissions) * 100) : 0;

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className="group relative flex flex-col items-center text-center rounded-3xl p-5 pb-4 transition-all duration-300 active:scale-95 cursor-pointer border border-white/8 hover:border-white/15 overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${cat.color}15 0%, ${cat.color}08 100%)`,
            }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${cat.color}20, transparent 70%)`,
              }}
            />

            {/* Completion badge */}
            {isFullyComplete && (
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-emerald-400 flex items-center justify-center shadow-md shadow-emerald-400/30">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#064e3b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            {/* Icon */}
            <div className="relative z-10 text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
              {cat.icon}
            </div>

            {/* Title */}
            <h3 className="relative z-10 text-amber-50 font-bold text-base leading-tight mb-1.5">
              {cat.title}
            </h3>

            {/* Mission count */}
            <span className="relative z-10 text-amber-200/50 text-xs font-medium">
              {cat.completedCount}/{totalMissions} misi
            </span>

            {/* Progress bar */}
            <div className="relative z-10 w-full mt-3 h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background: isFullyComplete
                    ? 'linear-gradient(90deg, #34d399, #10b981)'
                    : `linear-gradient(90deg, ${cat.color}, ${cat.color}cc)`,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
