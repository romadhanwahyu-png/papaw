// ============================================================
// Papaw — Whisper API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { WhisperRequest, WhisperResponse } from '@/types';
import {
  getProfileByParentKey,
  createWhisper,
  getPendingWhispers,
  markWhisperDelivered,
  getWhispers,
} from '@/lib/db-queries';
import { verifyParentKey } from '@/lib/parent-key';

export async function POST(request: NextRequest) {
  try {
    const body: WhisperRequest = await request.json();
    const { action, key, profileId, message, scheduledFor, whisperId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create': {
        if (!key || !message) {
          return NextResponse.json(
            { error: 'key and message are required' },
            { status: 400 }
          );
        }

        // Verify parent key
        const profile = await getProfileByParentKey(key);
        if (!profile) {
          return NextResponse.json(
            { error: 'Invalid parent key' },
            { status: 403 }
          );
        }

        // Verify key matches
        if (!verifyParentKey(key, profile.parent_view_key)) {
          return NextResponse.json(
            { error: 'Invalid parent key' },
            { status: 403 }
          );
        }

        const whisper = await createWhisper(
          profile.id,
          message,
          scheduledFor
        );

        const response: WhisperResponse = {
          success: true,
          whisper,
        };

        return NextResponse.json(response);
      }

      case 'pending': {
        if (!profileId) {
          return NextResponse.json(
            { error: 'profileId is required' },
            { status: 400 }
          );
        }

        const whispers = await getPendingWhispers(profileId);

        const response: WhisperResponse = {
          success: true,
          whispers,
        };

        return NextResponse.json(response);
      }

      case 'history': {
        if (!profileId) {
          return NextResponse.json(
            { error: 'profileId is required' },
            { status: 400 }
          );
        }

        const whispers = await getWhispers(profileId);

        const response: WhisperResponse = {
          success: true,
          whispers,
        };

        return NextResponse.json(response);
      }

      case 'mark-delivered': {
        if (!whisperId) {
          return NextResponse.json(
            { error: 'whisperId is required' },
            { status: 400 }
          );
        }

        await markWhisperDelivered(whisperId);

        const response: WhisperResponse = {
          success: true,
        };

        return NextResponse.json(response);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Whisper API Error]', error);
    return NextResponse.json(
      { error: 'Whisper failed to process.' },
      { status: 500 }
    );
  }
}
