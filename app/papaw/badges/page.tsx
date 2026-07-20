'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfileId } from '@/lib/storage';
import { BedtimeBackground } from '@/components/BedtimeBackground';
import { PapawAvatar } from '@/components/PapawAvatar';
import { BadgeCard } from '@/components/BadgeCard';
import { useBedtime } from '@/lib/use-bedtime';
import { missions as allMissions } from '@/lib/missions';
import type { Profile, Badge } from '@/types';

export default function BadgesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const bedtimeMode = useBedtime();

  // Fetch profile and earned badges
  useEffect(() => {
    const profileId = getProfileId();
    if (!profileId) {
      router.replace('/onboarding');
      return;
    }

    Promise.all([
      // Profile
      fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', profileId }),
      }).then((res) => res.json()),
      // Badges
      fetch(`/api/badges?profileId=${profileId}`).then((res) => res.json()),
    ])
      .then(([profileData, badgesData]) => {
        if (profileData.profile) {
          setProfile(profileData.profile);
        } else {
          router.replace('/onboarding');
        }
        if (badgesData.success && badgesData.badges) {
          setEarnedBadges(badgesData.badges);
        }
      })
      .catch((err) => {
        console.error('Error loading badges:', err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-papaw-bg">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <PapawAvatar size="md" />
          <div className="w-6 h-6 border-2 border-warm-amber border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Build the list of all available badges based on missions
  const allAvailableBadges = allMissions.map((m) => ({
    badgeKey: m.id,
    title: m.badgeTitle,
    icon: m.badgeIcon,
  }));

  const earnedMap = new Map(earnedBadges.map((b) => [b.badge_key, b]));

  return (
    <div className="relative min-h-dvh overflow-hidden bg-papaw-bg text-amber-50">
      <BedtimeBackground mode={bedtimeMode} />

      <div className="relative z-10 min-h-dvh flex flex-col p-6 max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/papaw"
            className="touch-target flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-xl transition-all hover:bg-white/8 active:scale-95"
          >
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-sans">Koleksi Lencana</h1>
            <p className="text-sm text-amber-200/60">
              Lencana kehormatan dari petualangan kamu! 🎖️
            </p>
          </div>
        </header>

        {/* Collection Summary */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-3xl p-5 text-center flex items-center justify-around">
          <div>
            <div className="text-3xl font-black text-warm-amber">
              {earnedBadges.length}
            </div>
            <div className="text-xs text-amber-200/50 uppercase tracking-wider font-semibold mt-1">
              Didapatkan
            </div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div>
            <div className="text-3xl font-black text-amber-200/40">
              {allAvailableBadges.length - earnedBadges.length}
            </div>
            <div className="text-xs text-amber-200/50 uppercase tracking-wider font-semibold mt-1">
              Tersisa
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <main className="flex-1 overflow-y-auto animate-fade-in-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-8">
            {allAvailableBadges.map((badgeDef) => {
              const earnedBadge = earnedMap.get(badgeDef.badgeKey);
              const isEarned = !!earnedBadge;

              // Construct a Badge object for BadgeCard component
              const badgeObject: Badge = {
                id: earnedBadge?.id || badgeDef.badgeKey,
                profile_id: profile.id,
                badge_key: badgeDef.badgeKey,
                title: badgeDef.title,
                icon: badgeDef.icon,
                earned_at: earnedBadge?.earned_at || '',
              };

              return (
                <BadgeCard
                  key={badgeDef.badgeKey}
                  badge={badgeObject}
                  isEarned={isEarned}
                />
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
