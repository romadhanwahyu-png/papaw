// ============================================================
// Papaw — Chat API Route
// ============================================================

import { NextRequest, NextResponse, after } from 'next/server';
import { ChatRequest, PapawContext, LLMMessage, Whisper } from '@/types';
import {
  getProfile,
  getActiveSession,
  createSession,
  getSession,
  getRecentMessages,
  saveMessage,
  incrementMessageCount,
  getPendingWhispers,
  hasDeliveredWhisperSince,
  markWhisperDelivered,
  getChildMemory,
} from '@/lib/db-queries';
import { llm, LLM_FALLBACK_MESSAGE, isRateLimitError } from '@/lib/llm';
import { buildPapawPrompt } from '@/lib/prompts';
import { runAnalysis } from '@/lib/analyze';
import { getBedtimeContext, formatTimeForPrompt, getDayName } from '@/lib/time';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { profileId, message, sessionId: requestedSessionId } = body;

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

    // 4. Load pending whispers — deliver at most ONE per session.
    // If a whisper was already delivered within this session window, don't
    // inject any more; otherwise offer only the oldest pending whisper.
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

    // 5. Build PapawContext
    const memoryFacts = await getChildMemory(profileId);
    const now = new Date();
    const context: PapawContext = {
      childName: profile.child_name,
      papawName: profile.papaw_name,
      language: profile.default_language,
      childGender: profile.child_gender,
      memoryFacts,
      bedtimeContext: getBedtimeContext(now),
      currentTime: formatTimeForPrompt(now),
      currentDay: getDayName(now),
      recentMessages: llmMessages,
      pendingWhispers: whispersForPrompt,
      missionState: null,
    };

    // 6. Build system prompt
    const systemPrompt = buildPapawPrompt(context);

    // 7. Stream the LLM response. We accumulate the full text so we can persist
    // it, mark whispers, and trigger analysis once the stream finishes.
    const activeSession = session;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let full = '';
        try {
          for await (const delta of llm.streamChat(llmMessages, systemPrompt)) {
            full += delta;
            controller.enqueue(encoder.encode(delta));
          }
        } catch (streamError) {
          if (isRateLimitError(streamError)) {
            console.error(
              '[Chat Stream Error] LLM rate/quota limit hit — falling back. Check the API quota/tier (note: each message also triggers a background analyze call).'
            );
          } else {
            console.error('[Chat Stream Error]', streamError);
          }
        }

        // If nothing streamed, emit the fallback so the child always sees text.
        if (!full) {
          full = LLM_FALLBACK_MESSAGE;
          controller.enqueue(encoder.encode(full));
        }
        controller.close();

        const isRealResponse = full !== LLM_FALLBACK_MESSAGE;

        try {
          const childMsg = await saveMessage(activeSession.id, 'child', message);
          await saveMessage(activeSession.id, 'papaw', full);
          await incrementMessageCount(activeSession.id);

          // Mark the offered whisper delivered only on a real response.
          if (isRealResponse && whispersForPrompt.length > 0) {
            for (const w of whispersForPrompt) {
              await markWhisperDelivered(w.id);
            }
          }

          // Background analysis after the response is flushed.
          if (isRealResponse) {
            after(() =>
              runAnalysis({
                messageId: childMsg.id,
                childMessage: message,
                papawResponse: full,
                profileId,
              })
            );
          }
        } catch (persistError) {
          console.error('[Chat Persist Error]', persistError);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Session-Id': activeSession.id,
      },
    });
  } catch (error) {
    console.error('[Chat API Error]', error);
    return NextResponse.json(
      { error: 'Something went wrong. Papaw will be back shortly.' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// GET /api/chat?sessionId=...&profileId=...
// Restore the recent messages for a session so the chat UI can rehydrate on
// reload. Validates that the session belongs to the given profile.
// ------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const profileId = searchParams.get('profileId');

    if (!sessionId || !profileId) {
      return NextResponse.json({ messages: [] });
    }

    const session = await getSession(sessionId);
    if (!session || session.profile_id !== profileId) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await getRecentMessages(sessionId, 30);
    return NextResponse.json({
      sessionId,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
    });
  } catch (error) {
    console.error('[Chat History API Error]', error);
    return NextResponse.json({ messages: [] });
  }
}
