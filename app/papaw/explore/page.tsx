'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfileId } from '@/lib/storage';
import { BedtimeBackground } from '@/components/BedtimeBackground';
import { PapawAvatar } from '@/components/PapawAvatar';
import { CategoryGrid } from '@/components/CategoryGrid';
import { MissionCard } from '@/components/MissionCard';
import { useBedtime } from '@/lib/use-bedtime';
import { categories as categoryMetadata, missions as allMissions } from '@/lib/missions';
import type { Profile, CategoryInfo, MissionDefinition, MissionCategory } from '@/types';

export default function ExplorePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<{ badge_key: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const bedtimeMode = useBedtime();
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);

  // Fetch profile and badges
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
          setBadges(badgesData.badges);
        }
      })
      .catch((err) => {
        console.error('Error fetching explore data:', err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Compute category completion details
  const getCategoryData = useCallback((): CategoryInfo[] => {
    const completedMissionIds = new Set(badges.map((b) => b.badge_key));

    return (Object.keys(categoryMetadata) as MissionCategory[]).map((catId) => {
      const meta = categoryMetadata[catId];
      const categoryMissions = allMissions.filter((m) => m.category === catId);
      const completedCount = categoryMissions.filter((m) =>
        completedMissionIds.has(m.id)
      ).length;

      return {
        ...meta,
        id: catId,
        missions: categoryMissions,
        completedCount,
      } as CategoryInfo;
    });
  }, [badges]);

  const handleSelectCategory = useCallback((cat: CategoryInfo) => {
    setSelectedCategory(cat);
  }, []);

  const handleStartMission = useCallback(
    (mission: MissionDefinition) => {
      router.push(`/papaw/explore/${mission.id}`);
    },
    [router]
  );

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

  const currentCategories = getCategoryData();
  const completedSet = new Set(badges.map((b) => b.badge_key));

  return (
    <div className="relative min-h-dvh overflow-hidden bg-papaw-bg text-amber-50">
      <BedtimeBackground mode={bedtimeMode} />

      <div className="relative z-10 min-h-dvh flex flex-col p-6 max-w-2xl mx-auto">
        {/* Navigation & Header */}
        {!selectedCategory ? (
          <>
            <header className="flex items-center gap-4 mb-8">
              <Link
                href="/papaw"
                className="touch-target flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-xl transition-all hover:bg-white/8 active:scale-95"
              >
                ←
              </Link>
              <div>
                <h1 className="text-2xl font-bold font-sans">Misi Petualangan</h1>
                <p className="text-sm text-amber-200/60">
                  Pilih petualangan seru hari ini! 🗺️
                </p>
              </div>
            </header>

            {/* Categories list */}
            <main className="flex-1 animate-fade-in-up">
              <CategoryGrid
                categories={currentCategories}
                onSelect={handleSelectCategory}
              />
            </main>
          </>
        ) : (
          <>
            <header className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className="touch-target flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-xl transition-all hover:bg-white/8 active:scale-95 cursor-pointer"
              >
                ←
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCategory.icon}</span>
                  <h1 className="text-2xl font-bold">{selectedCategory.title}</h1>
                </div>
                <p className="text-sm text-amber-200/60 mt-0.5">
                  {selectedCategory.description}
                </p>
              </div>
            </header>

            {/* Missions List */}
            <main className="flex-1 space-y-4 animate-fade-in-up">
              {selectedCategory.missions.map((mission, idx) => {
                const isCompleted = completedSet.has(mission.id);
                // First mission is never locked, subsequent ones are locked if the previous is not completed
                const isLocked = idx > 0 && !completedSet.has(selectedCategory.missions[idx - 1].id);

                return (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    isCompleted={isCompleted}
                    isLocked={isLocked}
                    onStart={handleStartMission}
                  />
                );
              })}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
