import OpenAI from 'openai';

let _ai: OpenAI | null = null;

// Lazy-initialize: server starts even without API key
export function getAI(): OpenAI {
  if (!_ai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set. Add it to your .env file.');
    }
    _ai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || 'https://llm.alem.ai/v1',
    });
  }
  return _ai;
}

// Proxy object so existing `ai.chat.completions.create(...)` calls still work
export const ai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getAI() as any)[prop];
  },
});

export const SYSTEM_MODEL = process.env.ALEM_AI_MODEL || 'alemllm';
