/**
 * GLM Smoke Test
 * Quick verification that the GLM proxy is configured and can communicate with z.ai API.
 * Run with: curl -X POST http://localhost:3001/api/glm/chat -H "Content-Type: application/json" -d '{"model":"glm-4.7","messages":[{"role":"user","content":"Hello"}]}'
 */

async function main() {
  console.log('GLM Smoke Test');
  console.log('==============');

  // Check if proxy is running
  console.log('Checking proxy server health...');
  
  try {
    const healthRes = await fetch('http://localhost:3001/api/health');
    const health = await healthRes.json();
    
    if (!health.glm) {
      console.error('ERROR: ZAI_API_KEY is not configured in server/.env');
      process.exit(1);
    }
    
    console.log('✓ GLM API key is configured on proxy');
    console.log('Testing connection to z.ai API via proxy...');

    const response = await fetch('http://localhost:3001/api/glm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond briefly.' },
          { role: 'user', content: 'Say "GLM connection successful" and nothing else.' },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}`);
    }

    const data = await response.json();
    console.log('✓ Response received:', data.content);
    console.log('GLM smoke test PASSED');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('✗ GLM API call failed:', errorMessage);
    console.error('Make sure the proxy server is running: npm run server');
    process.exit(1);
  }
}

main();
