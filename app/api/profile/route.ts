// ============================================================
// Papaw — Profile API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { Language, Gender, Profile } from '@/types';
import { createProfile, getProfile, updateProfile } from '@/lib/db-queries';
import { buildPapaViewUrl } from '@/lib/parent-key';

/**
 * Strip the parent_view_key before returning a profile to the client.
 * The key is the sole secret gating Papa View — it must never travel in a
 * general profile response. It is revealed only via the explicit `share-url`
 * action (and embedded in the one-time `papaViewUrl` at creation).
 */
type SafeProfile = Omit<Profile, 'parent_view_key'>;
function sanitizeProfile(profile: Profile): SafeProfile {
  const { parent_view_key: _omit, ...safe } = profile;
  void _omit;
  return safe;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, childName, language, gender, profileId, updates } = body;

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

        const validGenders: Gender[] = ['male', 'female', 'unspecified'];
        const gen: Gender = validGenders.includes(gender) ? gender : 'unspecified';

        const profile = await createProfile(childName, lang, gen);
        // The URL (which embeds the key) is returned once here so onboarding
        // can show the parent their Papa View link.
        const papaViewUrl = buildPapaViewUrl(profile.parent_view_key);

        return NextResponse.json({
          success: true,
          profile: sanitizeProfile(profile),
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

        return NextResponse.json({ success: true, profile: sanitizeProfile(profile) });
      }

      case 'share-url': {
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

        return NextResponse.json({
          success: true,
          papaViewUrl: buildPapaViewUrl(profile.parent_view_key),
        });
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

        return NextResponse.json({ success: true, profile: sanitizeProfile(profile) });
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
