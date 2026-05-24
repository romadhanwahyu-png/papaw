'use client';

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 px-5 py-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2.5 h-2.5 rounded-full bg-amber-400"
          style={{
            animation: 'loading-dot-bounce 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes loading-dot-bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
