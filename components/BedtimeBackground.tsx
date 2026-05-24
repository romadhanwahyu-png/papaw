'use client';

import { useMemo } from 'react';
import type { BedtimeContext } from '@/types';

interface BedtimeBackgroundProps {
  mode: BedtimeContext;
  children?: React.ReactNode;
}

// Generate deterministic star positions from a seed
function generateStars(count: number, seed: number) {
  const stars: { x: number; y: number; size: number; delay: number; duration: number }[] = [];
  let s = seed;
  const next = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: next() * 100,
      y: next() * 60, // Keep stars in upper 60% of screen
      size: 1 + next() * 2.5,
      delay: next() * 5,
      duration: 2 + next() * 4,
    });
  }
  return stars;
}

const gradients: Record<BedtimeContext, string> = {
  daytime:
    'linear-gradient(180deg, #fde68a 0%, #fbbf24 15%, #f59e0b 35%, #d97706 60%, #92400e 100%)',
  evening:
    'linear-gradient(180deg, #1e1b4b 0%, #312e81 20%, #4c1d95 40%, #7c2d12 70%, #ea580c 90%, #f59e0b 100%)',
  bedtime:
    'linear-gradient(180deg, #0c0a1d 0%, #1a1b3a 25%, #1e1b4b 50%, #1e1b4b 75%, #0c0a1d 100%)',
};

export function BedtimeBackground({ mode, children }: BedtimeBackgroundProps) {
  const showStars = mode === 'evening' || mode === 'bedtime';
  const starCount = mode === 'bedtime' ? 60 : 20;
  const showMoon = mode === 'bedtime';

  const stars = useMemo(() => generateStars(starCount, 42), [starCount]);

  return (
    <div
      className="fixed inset-0 overflow-hidden transition-all duration-[2000ms] ease-in-out"
      style={{ background: gradients[mode] }}
    >
      {/* Stars layer */}
      {showStars && (
        <div className="absolute inset-0" aria-hidden="true">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                animation: `star-twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Moon */}
      {showMoon && (
        <div className="absolute top-[6%] right-[12%]" aria-hidden="true">
          {/* Moon glow */}
          <div
            className="absolute -inset-8 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 50%, transparent 70%)',
              animation: 'moon-glow 6s ease-in-out infinite',
            }}
          />
          {/* Moon body */}
          <div
            className="relative w-20 h-20 rounded-full shadow-lg"
            style={{
              background:
                'radial-gradient(circle at 35% 35%, #fef3c7 0%, #fde68a 40%, #fbbf24 80%, #f59e0b 100%)',
              boxShadow:
                '0 0 40px rgba(251,191,36,0.15), 0 0 80px rgba(251,191,36,0.08)',
            }}
          >
            {/* Craters */}
            <div
              className="absolute w-4 h-4 rounded-full opacity-15"
              style={{
                background: 'radial-gradient(circle, #d97706, transparent)',
                top: '25%',
                left: '30%',
              }}
            />
            <div
              className="absolute w-2.5 h-2.5 rounded-full opacity-10"
              style={{
                background: 'radial-gradient(circle, #d97706, transparent)',
                top: '55%',
                left: '55%',
              }}
            />
            <div
              className="absolute w-3 h-3 rounded-full opacity-12"
              style={{
                background: 'radial-gradient(circle, #d97706, transparent)',
                top: '40%',
                left: '65%',
              }}
            />
          </div>
        </div>
      )}

      {/* Daytime warm shimmer overlay */}
      {mode === 'daytime' && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 60% 20%, rgba(255,255,255,0.3) 0%, transparent 60%)',
            animation: 'daytime-shimmer 8s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>

      <style jsx>{`
        @keyframes star-twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
        @keyframes moon-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.8;
          }
        }
        @keyframes daytime-shimmer {
          0%, 100% {
            opacity: 0.2;
            transform: translateY(0);
          }
          50% {
            opacity: 0.35;
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}
