// ============================================================
// Papaw — Profile API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { Language } from '@/types';
import { createProfile, getProfile, updateProfile } from '@/lib/db-queries';
import { buildPapaViewUrl } from '@/lib/parent-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, childName, language, profileId, updates } = body;

    // Default action is 'create' for backwards compatibility
    const resolvedAction = action || 'create';

    switch (resolvedAction) {
      case 'create': {
        if (!childName) {
          return NextResponse.json(
            { error: 'childName is required' },
            { status: 400 }
          );
        }

        const validLanguages: Language[] = ['id', 'en', 'mix'];
        const lang: Language = validLanguages.includes(language) ? language : 'mix';

        const profile = await createProfile(childName, lang);
        const papaViewUrl = buildPapaViewUrl(profile.parent_view_key);

        return NextResponse.json({
          success: true,
          profile,
          papaViewUrl,
        });
      }

      case 'get': {
        if (!profileId) {
          return NextResponse.json(
            { error: 'profileId is required' },
            { status: 400 }
          );
        }

        const profile = await getProfile(profileId);
        if (!profile) {
          return NextResponse.json(
            { error: 'Profile not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, profile });
      }

      case 'update': {
        if (!profileId || !updates) {
          return NextResponse.json(
            { error: 'profileId and updates are required' },
            { status: 400 }
          );
        }

        const profile = await updateProfile(profileId, updates);
        if (!profile) {
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, profile });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${resolvedAction}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Profile API Error]', error);
    return NextResponse.json(
      { error: 'Failed to process profile request.' },
      { status: 500 }
    );
  }
}
