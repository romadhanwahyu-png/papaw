// ============================================================
// Papaw — LLM Abstraction Layer
// ============================================================

import { LLMProvider, LLMMessage, AnalysisResult, AnalysisSchema } from '@/types';

/**
 * Shared fallback message returned by any provider when the LLM call fails.
 * Routes compare against this to avoid side effects (e.g. marking a Papa Whisper
 * as delivered) when Papaw didn't actually produce a real response.
 */
export const LLM_FALLBACK_MESSAGE = 'Hmm, Papaw lagi mikir bentar nih. Coba tanya lagi yuk!';

/**
 * Normalize conversation history for the LLM providers.
 *
 * Both Gemini and Claude require history that (a) begins with a 'user' turn and
 * (b) strictly alternates user/model. Our stored history can violate both — e.g.
 * a mission intro saved as a lone 'model' turn, or two 'model' turns in a row if
 * a fallback reply was persisted. Long/complex conversations are where these
 * edge cases pile up and get the whole request rejected (→ "Papaw lagi mikir").
 *
 * This merges consecutive same-role turns and guarantees a leading user turn.
 */
export function normalizeHistory(messages: LLMMessage[]): LLMMessage[] {
  const merged: LLMMessage[] = [];
  for (const msg of messages) {
    if (!msg.content) continue; // drop empties that would break alternation
    const prev = merged[merged.length - 1];
    if (prev && prev.role === msg.role) {
      prev.content = `${prev.content}\n\n${msg.content}`;
    } else {
      merged.push({ role: msg.role, content: msg.content });
    }
  }

  if (merged.length > 0 && merged[0].role === 'model') {
    merged.unshift({ role: 'user', content: 'Halo Papaw!' });
  }
  return merged;
}

/**
 * Heuristic: is this error a provider rate-limit / quota exhaustion?
 * Retrying these immediately just burns another request and fails again — the
 * usual cause of persistent fallbacks during a long, busy chat session.
 */
export function isRateLimitError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  );
}

/**
 * Get the active LLM provider based on environment config
 */
async function getProvider(): Promise<LLMProvider> {
  const provider = process.env.LLM_PROVIDER || 'gemini';

  switch (provider) {
    case 'gemini': {
      const { GeminiProvider } = await import('./llm-gemini');
      return new GeminiProvider();
    }
    case 'claude': {
      const { ClaudeProvider } = await import('./llm-claude');
      return new ClaudeProvider();
    }
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Main LLM interface — use this everywhere
 * Automatically selects provider based on LLM_PROVIDER env var
 */
export const llm = {
  /**
   * Send a chat conversation and get a full response (non-streaming).
   */
  async chat(messages: LLMMessage[], systemPrompt: string): Promise<string> {
    const provider = await getProvider();
    return provider.chat(messages, systemPrompt);
  },

  /**
   * Stream a chat response as text deltas.
   */
  async *streamChat(messages: LLMMessage[], systemPrompt: string): AsyncIterable<string> {
    const provider = await getProvider();
    yield* provider.streamChat(messages, systemPrompt);
  },

  /**
   * Analyze content and return structured output
   */
  async analyze(content: string, schema: AnalysisSchema): Promise<AnalysisResult> {
    const provider = await getProvider();
    return provider.analyze(content, schema);
  },
};
