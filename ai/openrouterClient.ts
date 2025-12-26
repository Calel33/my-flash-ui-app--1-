/**
 * OpenRouter Client - OpenAI-compatible
 * Uses the OpenAI SDK configured with OpenRouter's base URL and API key.
 */
import OpenAI from 'openai';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

let openRouterClientInstance: OpenAI | null = null;

export function isOpenRouterConfigured(): boolean {
  return Boolean(OPENROUTER_API_KEY);
}

export function getOpenRouterClient(): OpenAI {
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY is not configured for OpenRouter provider.');
  }

  if (!openRouterClientInstance) {
    openRouterClientInstance = new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://flash-ui.app',
        'X-Title': 'Flash UI App',
      },
      dangerouslyAllowBrowser: true,
    });
  }

  return openRouterClientInstance;
}
