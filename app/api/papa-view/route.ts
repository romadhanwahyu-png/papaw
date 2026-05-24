// ============================================================
// Papaw — Papa View API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { PapaViewRequest } from '@/types';
import {
  getProfileByParentKey,
  getTodaySummary,
  getWeekSummary,
  getHighlights,
  getTopicFrequency,
  getChatHistory,
} from '@/lib/db-queries';
import { verifyParentKey } from '@/lib/parent-key';

export async function POST(request: NextRequest) {
  try {
    const body: PapaViewRequest = await request.json();
    const { action, key, dateRange, page, limit } = body;

    if (!action || !key) {
      return NextResponse.json(
        { error: 'action and key are required' },
        { status: 400 }
      );
    }

    // Verify parent key for all actions
    const profile = await getProfileByParentKey(key);
    if (!profile) {
      return NextResponse.json(
        { error: 'Invalid parent key' },
        { status: 403 }
      );
    }

    if (!verifyParentKey(key, profile.parent_view_key)) {
      return NextResponse.json(
        { error: 'Invalid parent key' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'summary': {
        const today = await getTodaySummary(profile.id);
        const week = await getWeekSummary(profile.id);

        return NextResponse.json({
          profileId: profile.id,
          childName: profile.child_name,
          today,
          week,
        });
      }

      case 'highlights': {
        const highlights = await getHighlights(
          profile.id,
          dateRange || 'week'
        );

        return NextResponse.json({
          highlights,
        });
      }

      case 'topics': {
        const topics = await getTopicFrequency(profile.id);

        return NextResponse.json({
          topics,
        });
      }

      case 'history': {
        const messages = await getChatHistory(
          profile.id,
          page || 1,
          limit || 50
        );

        return NextResponse.json({
          messages,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Papa View API Error]', error);
    return NextResponse.json(
      { error: 'Papa View encountered an error.' },
      { status: 500 }
    );
  }
}
