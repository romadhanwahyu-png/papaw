// ============================================================
// Papaw — Claude LLM Provider (@anthropic-ai/sdk)
// ============================================================
//
// Activate with LLM_PROVIDER=claude and ANTHROPIC_API_KEY (CLAUDE_API_KEY also
// accepted for backward compatibility). Model configurable via CLAUDE_MODEL.

import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMMessage, AnalysisResult, AnalysisSchema } from '@/types';
import { LLM_FALLBACK_MESSAGE, normalizeHistory, isRateLimitError } from './llm';

const FALLBACK_MESSAGE = LLM_FALLBACK_MESSAGE;
const MAX_TOKENS = 1024;

/** Map our LLMMessage[] to Anthropic's message format (model → assistant). */
function toAnthropicMessages(messages: LLMMessage[]): Anthropic.MessageParam[] {
  return normalizeHistory(messages).map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }));
}

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private modelName = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY (or CLAUDE_API_KEY) is not set. Required for LLM_PROVIDER=claude.'
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  async chat(messages: LLMMessage[], systemPrompt: string): Promise<string> {
    const anthropicMessages = toAnthropicMessages(messages);

    const call = async () => {
      const response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: anthropicMessages,
      });
      const block = response.content.find((b) => b.type === 'text');
      const text = block && block.type === 'text' ? block.text : '';
      if (!text) throw new Error('Empty response from Claude');
      return text;
    };

    try {
      return await call();
    } catch (error) {
      console.error('Claude chat error (attempt 1):', error);
      if (isRateLimitError(error)) {
        console.error('Claude rate/quota limit hit — skipping retry. Check the API quota/tier.');
        return FALLBACK_MESSAGE;
      }
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await call();
      } catch (retryError) {
        console.error('Claude chat error (attempt 2):', retryError);
        return FALLBACK_MESSAGE;
      }
    }
  }

  async *streamChat(messages: LLMMessage[], systemPrompt: string): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: this.modelName,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: toAnthropicMessages(messages),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  async analyze(content: string, schema: AnalysisSchema): Promise<AnalysisResult> {
    const prompt = `${schema.description}

Analyze the following conversation content and return a JSON object with these fields:
- "topic_tags": array of strings, relevant topics (Bahasa Indonesia), max 5.
- "is_critical": boolean, true for sensitive topics (war, death, violence, religion, politics) a parent should know about.
- "is_highlight": one of "curious_question", "cute_moment", "deep_thinking", or null.
- "excerpt": string or null, short excerpt (max 100 chars) if is_highlight is not null.

Content to analyze:
${content}

Return ONLY the JSON object, no other text.`;

    try {
      const response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: 512,
        system: 'You are a precise JSON generator. Output only valid JSON.',
        messages: [{ role: 'user', content: prompt }],
      });

      const block = response.content.find((b) => b.type === 'text');
      const text = block && block.type === 'text' ? block.text : '';
      // Strip any accidental markdown code fences before parsing.
      const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        topic_tags: parsed.topic_tags || [],
        is_critical: parsed.is_critical || false,
        is_highlight: parsed.is_highlight || null,
        excerpt: parsed.excerpt || null,
      };
    } catch (error) {
      console.error('Claude analyze error:', error);
      return {
        topic_tags: [],
        is_critical: false,
        is_highlight: null,
        excerpt: null,
      };
    }
  }
}
