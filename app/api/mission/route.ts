// ============================================================
// Papaw — Mission API Route
// ============================================================

import { NextRequest, NextResponse, after } from 'next/server';
import { MissionRequest, MissionResponse, PapawContext, LLMMessage, Whisper } from '@/types';
import {
  getProfile,
  getSession,
  createSession,
  getRecentMessages,
  saveMessage,
  incrementMessageCount,
  updateSession,
  awardBadge,
  getPendingWhispers,
  hasDeliveredWhisperSince,
  markWhisperDelivered,
} from '@/lib/db-queries';
import { llm, LLM_FALLBACK_MESSAGE } from '@/lib/llm';
import { buildMissionPrompt } from '@/lib/prompts';
import { runAnalysis } from '@/lib/analyze';
import { getBedtimeContext, formatTimeForPrompt, getDayName } from '@/lib/time';
import {
  getMission,
  createMissionState,
  advanceMissionState,
  shouldAwardBadge,
} from '@/lib/missions';

export async function POST(request: NextRequest) {
  try {
    const body: MissionRequest = await request.json();
    const { action, profileId, missionId, message, sessionId, quizAnswer } = body;

    if (!profileId || !action) {
      return NextResponse.json(
        { error: 'profileId and action are required' },
        { status: 400 }
      );
    }

    const profile = await getProfile(profileId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    switch (action) {
      case 'start': {
        if (!missionId) {
          return NextResponse.json({ error: 'missionId is required' }, { status: 400 });
        }

        const mission = getMission(missionId);
        if (!mission) {
          return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
        }

        // Create initial mission state
        const missionState = createMissionState(missionId);

        // Create a new session for this mission
        const session = await createSession(profileId, missionState);

        // Offer at most the oldest pending whisper (fresh session → none delivered yet).
        const pendingWhispers = await getPendingWhispers(profileId);
        const whispersForPrompt: Whisper[] =
          pendingWhispers.length > 0 ? [pendingWhispers[0]] : [];

        // Build context
        const now = new Date();
        const context: PapawContext = {
          childName: profile.child_name,
          papawName: profile.papaw_name,
          language: profile.default_language,
          childGender: profile.child_gender,
          bedtimeContext: getBedtimeContext(now),
          currentTime: formatTimeForPrompt(now),
          currentDay: getDayName(now),
          recentMessages: [],
          pendingWhispers: whispersForPrompt,
          missionState,
        };

        const systemPrompt = buildMissionPrompt(context, mission, missionState);
        const introMessages: LLMMessage[] = [
          { role: 'user', content: `Aku mau belajar tentang ${mission.title}!` },
        ];

        const response = await llm.chat(introMessages, systemPrompt);

        await saveMessage(session.id, 'papaw', response);

        if (response !== LLM_FALLBACK_MESSAGE && whispersForPrompt.length > 0) {
          for (const w of whispersForPrompt) {
            await markWhisperDelivered(w.id);
          }
        }

        const missionResponse: MissionResponse = {
          response,
          sessionId: session.id,
          missionState,
        };

        return NextResponse.json(missionResponse);
      }

      case 'step': {
        if (!sessionId || !message) {
          return NextResponse.json(
            { error: 'sessionId and message are required for step' },
            { status: 400 }
          );
        }

        const session = await getSession(sessionId);
        if (!session || !session.mission_state) {
          return NextResponse.json(
            { error: 'Invalid session or no mission in progress' },
            { status: 400 }
          );
        }

        const currentMissionId = session.mission_state.missionId;
        const mission = getMission(currentMissionId);
        if (!mission) {
          return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
        }

        // Advance the state machine
        const newState = advanceMissionState(
          session.mission_state,
          mission,
          quizAnswer
        );

        // Update session with new state
        await updateSession(sessionId, { mission_state: newState } as never);

        // Load recent messages
        const recentMessages = await getRecentMessages(sessionId, 10);
        const llmMessages: LLMMessage[] = recentMessages.map((msg) => ({
          role: msg.role === 'child' ? 'user' : 'model',
          content: msg.content,
        }));
        llmMessages.push({ role: 'user', content: message });

        // Offer at most ONE whisper per session.
        const pendingWhispers = await getPendingWhispers(profileId);
        let whispersForPrompt: Whisper[] = [];
        if (pendingWhispers.length > 0) {
          const alreadyDelivered = await hasDeliveredWhisperSince(
            profileId,
            session.started_at
          );
          if (!alreadyDelivered) {
            whispersForPrompt = [pendingWhispers[0]];
          }
        }

        // Build context
        const now = new Date();
        const context: PapawContext = {
          childName: profile.child_name,
          papawName: profile.papaw_name,
          language: profile.default_language,
          childGender: profile.child_gender,
          bedtimeContext: getBedtimeContext(now),
          currentTime: formatTimeForPrompt(now),
          currentDay: getDayName(now),
          recentMessages: llmMessages,
          pendingWhispers: whispersForPrompt,
          missionState: newState,
        };

        const systemPrompt = buildMissionPrompt(context, mission, newState);
        const response = await llm.chat(llmMessages, systemPrompt);
        const isRealResponse = response !== LLM_FALLBACK_MESSAGE;

        // Save messages
        const childMsg = await saveMessage(sessionId, 'child', message);
        await saveMessage(sessionId, 'papaw', response);
        await incrementMessageCount(sessionId);

        // Mark delivered whisper + background analysis (real responses only).
        if (isRealResponse && whispersForPrompt.length > 0) {
          for (const w of whispersForPrompt) {
            await markWhisperDelivered(w.id);
          }
        }
        if (isRealResponse) {
          after(() =>
            runAnalysis({
              messageId: childMsg.id,
              childMessage: message,
              papawResponse: response,
              profileId,
            })
          );
        }

        // Check for badge award
        let badge;
        if (shouldAwardBadge(newState)) {
          badge = await awardBadge(
            profileId,
            mission.id,
            mission.badgeTitle,
            mission.badgeIcon
          );
        }

        const missionResponse: MissionResponse = {
          response,
          sessionId,
          missionState: newState,
          badge: badge || undefined,
        };

        return NextResponse.json(missionResponse);
      }

      case 'complete': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required for complete' },
            { status: 400 }
          );
        }

        const session = await getSession(sessionId);
        if (!session || !session.mission_state) {
          return NextResponse.json(
            { error: 'Invalid session or no mission in progress' },
            { status: 400 }
          );
        }

        const mission = getMission(session.mission_state.missionId);
        if (!mission) {
          return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
        }

        // Award badge
        const badge = await awardBadge(
          profileId,
          mission.id,
          mission.badgeTitle,
          mission.badgeIcon
        );

        // Build completion message
        const now = new Date();
        const context: PapawContext = {
          childName: profile.child_name,
          papawName: profile.papaw_name,
          language: profile.default_language,
          childGender: profile.child_gender,
          bedtimeContext: getBedtimeContext(now),
          currentTime: formatTimeForPrompt(now),
          currentDay: getDayName(now),
          recentMessages: [],
          pendingWhispers: [],
          missionState: session.mission_state,
        };

        const systemPrompt = buildMissionPrompt(
          context,
          mission,
          { ...session.mission_state, phase: 'complete' }
        );

        const response = await llm.chat(
          [{ role: 'user', content: 'Aku selesai!' }],
          systemPrompt
        );

        await saveMessage(sessionId, 'papaw', response);

        const missionResponse: MissionResponse = {
          response,
          sessionId,
          missionState: { ...session.mission_state, phase: 'complete' },
          badge: badge || undefined,
        };

        return NextResponse.json(missionResponse);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Mission API Error]', error);
    return NextResponse.json(
      { error: 'Mission encountered an error. Papaw will try again.' },
      { status: 500 }
    );
  }
}
