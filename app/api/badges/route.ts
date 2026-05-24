// ============================================================
// Papaw — Badges API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getBadges } from '@/lib/db-queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  try {
    const badges = await getBadges(profileId);
    return NextResponse.json({ success: true, badges });
  } catch (error) {
    console.error('[Badges API Error]', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
