// ============================================================
// Papaw — Profile API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { Language, Gender, Profile } from '@/types';
import {
  createProfile,
  getProfile,
  updateProfile,
  getProfileByUsername,
  isUsernameTaken,
  setProfileCredentials,
} from '@/lib/db-queries';
import { buildPapaViewUrl } from '@/lib/parent-key';
import {
  hashPin,
  verifyPin,
  normalizeUsername,
  isValidUsername,
  isValidPin,
} from '@/lib/auth';

/**
 * Strip server-only secrets before returning a profile to the client:
 * - parent_view_key: the sole secret gating Papa View (revealed only via the
 *   explicit `share-url` action / one-time `papaViewUrl` at creation).
 * - pin_hash: the login secret.
 */
type SafeProfile = Omit<Profile, 'parent_view_key' | 'pin_hash'>;
function sanitizeProfile(profile: Profile): SafeProfile {
  const { parent_view_key: _k, pin_hash: _p, ...safe } = profile;
  void _k;
  void _p;
  return safe;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, childName, language, gender, profileId, updates, username, pin } = body;

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

      case 'login': {
        if (!username || !pin) {
          return NextResponse.json(
            { error: 'username and pin are required' },
            { status: 400 }
          );
        }

        const profile = await getProfileByUsername(normalizeUsername(username));
        // Same generic message whether the username or the PIN is wrong.
        if (!profile || !verifyPin(String(pin), profile.pin_hash)) {
          return NextResponse.json(
            { error: 'Username atau PIN salah' },
            { status: 401 }
          );
        }

        return NextResponse.json({
          success: true,
          profileId: profile.id,
          profile: sanitizeProfile(profile),
        });
      }

      case 'set-credentials': {
        if (!profileId || !username || !pin) {
          return NextResponse.json(
            { error: 'profileId, username, and pin are required' },
            { status: 400 }
          );
        }

        const uname = normalizeUsername(username);
        if (!isValidUsername(uname)) {
          return NextResponse.json(
            { error: 'Username harus 3–20 huruf/angka (tanpa spasi)' },
            { status: 400 }
          );
        }
        if (!isValidPin(String(pin))) {
          return NextResponse.json(
            { error: 'PIN harus 4–6 angka' },
            { status: 400 }
          );
        }
        if (await isUsernameTaken(uname, profileId)) {
          return NextResponse.json(
            { error: 'Username sudah dipakai, coba yang lain' },
            { status: 409 }
          );
        }

        const profile = await setProfileCredentials(profileId, uname, hashPin(String(pin)));
        if (!profile) {
          return NextResponse.json(
            { error: 'Gagal menyimpan login' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, profile: sanitizeProfile(profile) });
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
