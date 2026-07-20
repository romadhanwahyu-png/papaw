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
 * Normalize conversation history so it always begins with a 'user' turn.
 * Both Gemini and Claude require the first turn to be from the user; our stored
 * history can start with a Papaw ('model') message (e.g. a mission intro or a
 * saved greeting). Prepending a neutral user turn keeps the history valid.
 */
export function normalizeHistory(messages: LLMMessage[]): LLMMessage[] {
  if (messages.length > 0 && messages[0].role === 'model') {
    return [{ role: 'user', content: 'Halo Papaw!' }, ...messages];
  }
  return messages;
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
