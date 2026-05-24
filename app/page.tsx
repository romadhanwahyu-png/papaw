'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfileId } from '@/lib/storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const profileId = getProfileId();
    if (profileId) {
      router.replace('/papaw');
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-papaw-bg">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="text-6xl animate-breathing">🌙</div>
        <p className="text-text-secondary text-lg">Loading...</p>
      </div>
    </div>
  );
}
