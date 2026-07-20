// ============================================================
// Papaw — Background Analysis (in-process)
// ============================================================
//
// Runs the LLM analyzer over a child message + Papaw response and persists
// topic tags, topic frequency, and highlights. Designed to be called via
// Next's `after()` so it runs reliably after the response is flushed —
// unlike the previous fire-and-forget self-fetch, which could be dropped
// when the serverless function froze.

import { llm } from './llm';
import { buildAnalyzerPrompt } from './prompts';
import {
  updateMessageTags,
  updateTopicFrequency,
  saveHighlight,
} from './db-queries';

export interface AnalyzeParams {
  messageId: string;
  childMessage: string;
  papawResponse: string;
  profileId: string;
}

const ANALYZER_SCHEMA_DESCRIPTION =
  "Analyze the child's message for topic tags, critical topics, and highlight-worthy moments. Return JSON with: topic_tags (string[]), is_critical (boolean), is_highlight (\"curious_question\" | \"cute_moment\" | \"deep_thinking\" | null), excerpt (string | null — a short quote if highlight-worthy).";

/**
 * Analyze one exchange and persist the results. Never throws — analysis is
 * non-critical and must not affect the user-facing flow.
 */
export async function runAnalysis(params: AnalyzeParams): Promise<void> {
  const { messageId, childMessage, papawResponse, profileId } = params;

  if (!messageId || !childMessage || !profileId) return;

  try {
    const analyzerPrompt = buildAnalyzerPrompt(childMessage, papawResponse);

    const result = await llm.analyze(analyzerPrompt, {
      description: ANALYZER_SCHEMA_DESCRIPTION,
    });

    await updateMessageTags(messageId, result.topic_tags, result.is_critical);

    if (result.topic_tags.length > 0) {
      await updateTopicFrequency(profileId, result.topic_tags);
    }

    if (result.is_highlight && result.excerpt) {
      await saveHighlight(profileId, messageId, result.is_highlight, result.excerpt);
    }
  } catch (error) {
    console.error('[Analyze Error]', error);
    // Swallow — non-critical.
  }
}
