'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Profile, Language, BedtimeContext } from '@/types';
import { getProfileId } from '@/lib/storage';
import { getGreeting } from '@/lib/language';
import { BedtimeBackground } from '@/components/BedtimeBackground';
import { PapawAvatar } from '@/components/PapawAvatar';
import { getBedtimeContext } from '@/lib/time';

export default function PapawHubPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [bedtimeMode, setBedtimeMode] = useState<BedtimeContext>('bedtime');

  useEffect(() => {
    setBedtimeMode(getBedtimeContext(new Date()));
  }, []);

  useEffect(() => {
    const profileId = getProfileId();
    if (!profileId) {
      router.replace('/onboarding');
      return;
    }

    // Load profile
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', profileId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          const hour = new Date().getHours();
          setGreeting(
            getGreeting(hour, data.profile.default_language as Language)
          );
        } else {
          router.replace('/onboarding');
        }
      })
      .catch(() => {
        router.replace('/onboarding');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const getTimeEmoji = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) return '🌙';
    if (hour >= 18) return '🌆';
    if (hour >= 12) return '☀️';
    return '🌅';
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-papaw-bg">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <PapawAvatar size="lg" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const actionCards = [
    {
      title: 'Ngobrol',
      subtitle: 'Chat sama Papaw',
      icon: '💬',
      href: '/papaw/chat',
      gradient: 'from-amber-500/20 to-orange-500/10',
      borderColor: 'border-amber-500/30',
      delay: 'stagger-1',
    },
    {
      title: 'Explore',
      subtitle: 'Misi petualangan',
      icon: '🗺️',
      href: '/papaw/explore',
      gradient: 'from-blue-500/20 to-indigo-500/10',
      borderColor: 'border-blue-500/30',
      delay: 'stagger-2',
    },
    {
      title: 'Badge',
      subtitle: 'Koleksi badge kamu',
      icon: '🏅',
      href: '/papaw/badges',
      gradient: 'from-purple-500/20 to-pink-500/10',
      borderColor: 'border-purple-500/30',
      delay: 'stagger-3',
    },
  ];

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <BedtimeBackground mode={bedtimeMode} />

      <div className="relative z-10 min-h-dvh flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 pt-8">
          <div className="flex items-center gap-2 text-lg text-text-secondary">
            <span>{getTimeEmoji()}</span>
            <span>{greeting}</span>
          </div>
          <Link
            href="/papaw/settings"
            className="touch-target flex items-center justify-center w-12 h-12 rounded-xl bg-papaw-surface/50 border border-papaw-border/50 text-xl transition-all hover:bg-papaw-surface hover:border-papaw-border"
          >
            ⚙️
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 gap-8">
          {/* Papaw Avatar + Greeting */}
          <div className="flex flex-col items-center gap-5 animate-fade-in-up">
            <div className="animate-breathing">
              <PapawAvatar size="xl" />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="text-text-primary">Hai, </span>
                <span className="gradient-text-amber">{profile.child_name}!</span>
              </h1>
              <p className="text-text-secondary text-lg">
                Mau ngapain hari ini? 🌟
              </p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="w-full max-w-lg grid gap-4">
            {actionCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`${card.delay} opacity-0 animate-slide-up touch-target group`}
              >
                <div
                  className={`flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r ${card.gradient} border ${card.borderColor} transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] group-hover:border-opacity-60`}
                >
                  <div className="text-4xl flex-shrink-0 transition-transform group-hover:scale-110">
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-text-primary">
                      {card.title}
                    </h2>
                    <p className="text-text-secondary text-sm">
                      {card.subtitle}
                    </p>
                  </div>
                  <div className="text-text-muted text-xl transition-transform group-hover:translate-x-1">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
