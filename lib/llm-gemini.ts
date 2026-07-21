// ============================================================
// Papaw — Gemini LLM Provider (@google/genai)
// ============================================================

import { GoogleGenAI } from '@google/genai';
import { LLMProvider, LLMMessage, AnalysisResult, AnalysisSchema } from '@/types';
import { LLM_FALLBACK_MESSAGE, normalizeHistory, isRateLimitError } from './llm';

const FALLBACK_MESSAGE = LLM_FALLBACK_MESSAGE;

/** Map our LLMMessage[] to the @google/genai `contents` format. */
function toContents(messages: LLMMessage[]) {
  return normalizeHistory(messages).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
}

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI;
  private modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Send chat messages and get a full text response.
   * Retries 1x with 1s backoff on failure.
   */
  async chat(messages: LLMMessage[], systemPrompt: string): Promise<string> {
    const contents = toContents(messages);

    const call = async () => {
      const result = await this.client.models.generateContent({
        model: this.modelName,
        contents,
        config: { systemInstruction: systemPrompt },
      });
      const text = result.text;
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    };

    try {
      return await call();
    } catch (error) {
      console.error('Gemini chat error (attempt 1):', error);
      // Don't retry quota/rate-limit errors — it just burns another request and
      // fails again. This is the usual cause of persistent "Papaw lagi mikir".
      if (isRateLimitError(error)) {
        console.error('Gemini rate/quota limit hit — skipping retry. Check the API quota/tier.');
        return FALLBACK_MESSAGE;
      }
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await call();
      } catch (retryError) {
        console.error('Gemini chat error (attempt 2):', retryError);
        return FALLBACK_MESSAGE;
      }
    }
  }

  /**
   * Stream a chat response as text deltas.
   */
  async *streamChat(messages: LLMMessage[], systemPrompt: string): AsyncIterable<string> {
    const contents = toContents(messages);

    const stream = await this.client.models.generateContentStream({
      model: this.modelName,
      contents,
      config: { systemInstruction: systemPrompt },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  }

  /**
   * Analyze content and return structured JSON output.
   */
  async analyze(content: string, schema: AnalysisSchema): Promise<AnalysisResult> {
    const prompt = `${schema.description}

Analyze the following conversation content and return a JSON object with these fields:
- "topic_tags": array of strings, relevant topics discussed (e.g., "sains", "sejarah", "alam", "tokoh_dunia", "teknologi", "fisika", "biologi", etc.). Use Bahasa Indonesia for topic names. Max 5 tags.
- "is_critical": boolean, true if the conversation touches sensitive topics like war, death, violence, religion, politics, or anything that a parent should know about.
- "is_highlight": one of "curious_question", "cute_moment", "deep_thinking", or null. Only mark as highlight if the child's message is genuinely notable.
- "excerpt": string or null, a short excerpt (max 100 chars) of the notable part if is_highlight is not null.
- "facts": array of strings, NEW durable facts about the CHILD worth remembering long-term (interests, friends, family, school, pets, hobbies, preferences, recurring things). Bahasa Indonesia, singkat (mis. "suka main game bola", "temannya bernama Ozil", "ikut les karate"). JANGAN masukkan fakta yang sudah diketahui, hal sepele/sekali lewat, atau ucapan si companion. Maksimal 3. Kosongkan [] kalau tidak ada yang baru.

Content to analyze:
${content}

Return ONLY the JSON object, no other text.`;

    try {
      const result = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const text = result.text;
      if (!text) throw new Error('Empty analyze response from Gemini');
      const parsed = JSON.parse(text);

      return {
        topic_tags: parsed.topic_tags || [],
        is_critical: parsed.is_critical || false,
        is_highlight: parsed.is_highlight || null,
        excerpt: parsed.excerpt || null,
        facts: parsed.facts || [],
      };
    } catch (error) {
      console.error('Gemini analyze error:', error);
      return {
        topic_tags: [],
        is_critical: false,
        is_highlight: null,
        excerpt: null,
        facts: [],
      };
    }
  }
}
