/**
 * GLM Client (z.ai) - OpenAI-compatible
 * Uses the OpenAI SDK configured with z.ai's base URL and API key.
 */
import OpenAI from 'openai';

const ZAI_API_KEY = import.meta.env.VITE_ZAI_API_KEY;
const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';

export const glmClient = new OpenAI({
  apiKey: ZAI_API_KEY,
  baseURL: ZAI_BASE_URL,
  dangerouslyAllowBrowser: true,
});

export function isGlmConfigured(): boolean {
  return Boolean(ZAI_API_KEY);
}
