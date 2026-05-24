// ============================================================
// Papaw — Analyze API Route (Fire-and-Forget)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequest } from '@/types';
import { llm } from '@/lib/llm';
import { buildAnalyzerPrompt } from '@/lib/prompts';
import {
  updateMessageTags,
  updateTopicFrequency,
  saveHighlight,
} from '@/lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { messageId, childMessage, papawResponse, profileId } = body;

    if (!messageId || !childMessage || !profileId) {
      return NextResponse.json(
        { error: 'messageId, childMessage, and profileId are required' },
        { status: 400 }
      );
    }

    // Build analysis prompt
    const analyzerPrompt = buildAnalyzerPrompt(childMessage, papawResponse);

    // Call LLM analyze
    const result = await llm.analyze(analyzerPrompt, {
      description:
        'Analyze the child\'s message for topic tags, critical topics, and highlight-worthy moments. Return JSON with: topic_tags (string[]), is_critical (boolean), is_highlight ("curious_question" | "cute_moment" | "deep_thinking" | null), excerpt (string | null — a short quote if highlight-worthy).',
    });

    // Update message tags
    await updateMessageTags(messageId, result.topic_tags, result.is_critical);

    // Update topic frequency
    if (result.topic_tags.length > 0) {
      await updateTopicFrequency(profileId, result.topic_tags);
    }

    // Save highlight if detected
    if (result.is_highlight && result.excerpt) {
      await saveHighlight(
        profileId,
        messageId,
        result.is_highlight,
        result.excerpt
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analyze API Error]', error);
    // Non-critical — return success anyway to not break the flow
    return NextResponse.json({ success: true });
  }
}
