// ============================================================
// Papaw — Claude LLM Provider (Swap-Ready Stub)
// ============================================================

import { LLMProvider, LLMMessage, AnalysisResult, AnalysisSchema } from '@/types';

/**
 * Claude provider — ready to implement when needed
 * Set LLM_PROVIDER=claude and CLAUDE_API_KEY to activate
 * 
 * Implementation would use @anthropic-ai/sdk
 * Estimated cost: ~$2/month for single child daily usage with Claude Haiku
 */
export class ClaudeProvider implements LLMProvider {
  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error(
        'CLAUDE_API_KEY is not set. To use Claude, install @anthropic-ai/sdk and set CLAUDE_API_KEY.'
      );
    }
  }

  async chat(messages: LLMMessage[], systemPrompt: string): Promise<string> {
    // TODO: Implement with @anthropic-ai/sdk
    // const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    // const response = await anthropic.messages.create({
    //   model: 'claude-3-haiku-20240307',
    //   max_tokens: 1024,
    //   system: systemPrompt,
    //   messages: messages.map(m => ({
    //     role: m.role === 'user' ? 'user' : 'assistant',
    //     content: m.content,
    //   })),
    // });
    // return response.content[0].text;
    
    throw new Error('Claude provider not yet implemented. Use LLM_PROVIDER=gemini for now.');
  }

  async analyze(content: string, schema: AnalysisSchema): Promise<AnalysisResult> {
    throw new Error('Claude provider not yet implemented. Use LLM_PROVIDER=gemini for now.');
  }
}
