// ============================================================
// Papaw — LLM Abstraction Layer
// ============================================================

import { LLMProvider, LLMMessage, AnalysisResult, AnalysisSchema } from '@/types';

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
   * Send a chat conversation and get a response
   */
  async chat(messages: LLMMessage[], systemPrompt: string): Promise<string> {
    const provider = await getProvider();
    return provider.chat(messages, systemPrompt);
  },

  /**
   * Analyze content and return structured output
   */
  async analyze(content: string, schema: AnalysisSchema): Promise<AnalysisResult> {
    const provider = await getProvider();
    return provider.analyze(content, schema);
  },
};
