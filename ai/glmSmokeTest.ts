/**
 * GLM Smoke Test
 * Quick verification that the GLM client is configured and can communicate with z.ai API.
 * Run with: npx vite-node ai/glmSmokeTest.ts
 */
import { glmClient, isGlmConfigured } from './glmClient';

async function main() {
  console.log('GLM Smoke Test');
  console.log('==============');

  if (!isGlmConfigured()) {
    console.error('ERROR: VITE_ZAI_API_KEY is not configured in .env.local');
    process.exit(1);
  }

  console.log('✓ GLM API key is configured');
  console.log('Testing connection to z.ai API...');

  try {
    const completion = await glmClient.chat.completions.create({
      model: 'glm-4.7',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Respond briefly.' },
        { role: 'user', content: 'Say "GLM connection successful" and nothing else.' },
      ],
      stream: false,
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content ?? '';
    console.log('✓ Response received:', response);
    console.log('GLM smoke test PASSED');
  } catch (error: any) {
    console.error('✗ GLM API call failed:', error.message);
    if (error.status) {
      console.error('  Status:', error.status);
    }
    process.exit(1);
  }
}

main();
