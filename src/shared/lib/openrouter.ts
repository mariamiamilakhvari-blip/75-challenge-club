import { z } from 'zod';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatOptions = {
  maxTokens?: number;
  temperature?: number;
  reasoning?: boolean;
};

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/free';
const TIMEOUT_MS = 20_000;
const DEFAULT_MAX_TOKENS = 600;
const DEFAULT_TEMPERATURE = 0.7;

const ChatResponseSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable().optional() }) }))
    .min(1),
});

class OpenRouterClient {
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': '75 Challenge Club',
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
          messages,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          reasoning: { enabled: options.reasoning ?? false },
        }),
        signal: controller.signal,
      });
      if (!res.ok) return null;

      const parsed = ChatResponseSchema.safeParse(await res.json());
      if (!parsed.success) return null;

      const content = parsed.data.choices[0].message.content?.trim();
      return content ? content : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const openRouter = new OpenRouterClient();
export { OpenRouterClient };
