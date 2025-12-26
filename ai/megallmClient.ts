/**
 * MegaLLM Client - OpenAI-compatible
 * Uses the OpenAI SDK configured with MegaLLM's base URL and API key.
 */
import OpenAI from 'openai';

const MEGALLM_API_KEY = import.meta.env.VITE_MEGALLM_API_KEY;
const MEGALLM_BASE_URL = 'https://ai.megallm.io/v1';

let megaClientInstance: OpenAI | null = null;

export function isMegaLLMConfigured(): boolean {
  return Boolean(MEGALLM_API_KEY);
}

export function getMegaLLMClient(): OpenAI {
  if (!MEGALLM_API_KEY) {
    throw new Error('VITE_MEGALLM_API_KEY is not configured for MegaLLM provider.');
  }

  if (!megaClientInstance) {
    megaClientInstance = new OpenAI({
      apiKey: MEGALLM_API_KEY,
      baseURL: MEGALLM_BASE_URL,
      dangerouslyAllowBrowser: true,
    });
  }

  return megaClientInstance;
}
