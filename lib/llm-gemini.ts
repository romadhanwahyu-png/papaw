// ============================================================
// Papaw — Gemini LLM Provider
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMMessage, AnalysisResult, AnalysisSchema } from '@/types';

const FALLBACK_MESSAGE = 'Hmm, Papaw lagi mikir bentar nih. Coba tanya lagi yuk!';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private modelName = 'gemini-2.0-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Send chat messages and get a text response
   * Retries 1x with 1s backoff on failure
   */
  async chat(messages: LLMMessage[], systemPrompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
    });

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response.text();
      
      if (!response) {
        throw new Error('Empty response from Gemini');
      }
      
      return response;
    } catch (error) {
      console.error('Gemini chat error (attempt 1):', error);
      
      // Retry once with 1s backoff
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response.text();
        
        if (!response) {
          throw new Error('Empty response from Gemini (retry)');
        }
        
        return response;
      } catch (retryError) {
        console.error('Gemini chat error (attempt 2):', retryError);
        return FALLBACK_MESSAGE;
      }
    }
  }

  /**
   * Analyze content and return structured JSON output
   */
  async analyze(content: string, schema: AnalysisSchema): Promise<AnalysisResult> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `${schema.description}

Analyze the following conversation content and return a JSON object with these fields:
- "topic_tags": array of strings, relevant topics discussed (e.g., "sains", "sejarah", "alam", "tokoh_dunia", "teknologi", "fisika", "biologi", etc.). Use Bahasa Indonesia for topic names. Max 5 tags.
- "is_critical": boolean, true if the conversation touches sensitive topics like war, death, violence, religion, politics, or anything that a parent should know about.
- "is_highlight": one of "curious_question", "cute_moment", "deep_thinking", or null. Only mark as highlight if the child's message is genuinely notable.
- "excerpt": string or null, a short excerpt (max 100 chars) of the notable part if is_highlight is not null.

Content to analyze:
${content}

Return ONLY the JSON object, no other text.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      
      return {
        topic_tags: parsed.topic_tags || [],
        is_critical: parsed.is_critical || false,
        is_highlight: parsed.is_highlight || null,
        excerpt: parsed.excerpt || null,
      };
    } catch (error) {
      console.error('Gemini analyze error:', error);
      // Return safe defaults on failure
      return {
        topic_tags: [],
        is_critical: false,
        is_highlight: null,
        excerpt: null,
      };
    }
  }
}
