// ============================================================
// Papaw — Chat API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse, PapawContext, LLMMessage } from '@/types';
import {
  getProfile,
  getActiveSession,
  createSession,
  getSession,
  getRecentMessages,
  saveMessage,
  incrementMessageCount,
} from '@/lib/db-queries';
import { getPendingWhispers } from '@/lib/db-queries';
import { llm } from '@/lib/llm';
import { buildPapawPrompt } from '@/lib/prompts';
import { getBedtimeContext, formatTimeForPrompt, getDayName } from '@/lib/time';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { profileId, message, sessionId: requestedSessionId, mode } = body;

    if (!profileId || !message) {
      return NextResponse.json(
        { error: 'profileId and message are required' },
        { status: 400 }
      );
    }

    // 1. Load profile
    const profile = await getProfile(profileId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Get or create session (30min timeout)
    let session;
    if (requestedSessionId) {
      session = await getSession(requestedSessionId);
      if (!session) {
        session = await getActiveSession(profileId);
      }
    } else {
      session = await getActiveSession(profileId);
    }

    if (!session) {
      session = await createSession(profileId);
    }

    // 3. Load recent messages for context
    const recentMessages = await getRecentMessages(session.id, 10);
    const llmMessages: LLMMessage[] = recentMessages.map((msg) => ({
      role: msg.role === 'child' ? 'user' : 'model',
      content: msg.content,
    }));

    // Add current message
    llmMessages.push({ role: 'user', content: message });

    // 4. Load pending whispers
    const pendingWhispers = await getPendingWhispers(profileId);

    // 5. Build PapawContext
    const now = new Date();
    const context: PapawContext = {
      childName: profile.child_name,
      papawName: profile.papaw_name,
      language: profile.default_language,
      bedtimeContext: getBedtimeContext(now),
      currentTime: formatTimeForPrompt(now),
      currentDay: getDayName(now),
      recentMessages: llmMessages,
      pendingWhispers,
      missionState: null,
    };

    // 6. Build system prompt
    const systemPrompt = buildPapawPrompt(context);

    // 7. Call LLM
    const response = await llm.chat(llmMessages, systemPrompt);

    // 8. Save both messages to DB
    const childMsg = await saveMessage(session.id, 'child', message);
    await saveMessage(session.id, 'papaw', response);
    await incrementMessageCount(session.id);

    // 9. Fire-and-forget analyze (don't await)
    if (mode === 'free') {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: childMsg.id,
          childMessage: message,
          papawResponse: response,
          profileId,
        }),
      }).catch(() => {
        // Silently fail — analysis is non-critical
      });
    }

    // 10. Return response
    const chatResponse: ChatResponse = {
      response,
      sessionId: session.id,
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('[Chat API Error]', error);
    return NextResponse.json(
      { error: 'Something went wrong. Papaw will be back shortly.' },
      { status: 500 }
    );
  }
}
