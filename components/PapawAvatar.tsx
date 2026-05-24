'use client';

import Image from 'next/image';

interface PapawAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'day' | 'night';
}

const sizeMap = {
  xs: 32,
  sm: 40,
  md: 80,
  lg: 120,
  xl: 160,
} as const;

export function PapawAvatar({ size = 'md', variant = 'night' }: PapawAvatarProps) {
  const px = sizeMap[size];
  const src = variant === 'night' ? '/papaw-avatar-night.png' : '/papaw-avatar.png';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: px, height: px }}
    >
      {/* Soft glow ring behind avatar */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            variant === 'night'
              ? 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(251,191,36,0.20) 0%, transparent 70%)',
          animation: 'papaw-breathe 4s ease-in-out infinite',
        }}
      />

      {/* Avatar image container */}
      <div
        className="relative rounded-full overflow-hidden border-2 border-amber-400/30 shadow-lg shadow-amber-500/10"
        style={{
          width: px,
          height: px,
          animation: 'papaw-breathe 4s ease-in-out infinite',
        }}
      >
        <Image
          src={src}
          alt="Papaw"
          width={px}
          height={px}
          className="object-cover w-full h-full"
          priority={size === 'lg'}
        />
      </div>

      {/* Keyframes injected via style tag */}
      <style jsx>{`
        @keyframes papaw-breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.04);
            opacity: 0.92;
          }
        }
      `}</style>
    </div>
  );
}
