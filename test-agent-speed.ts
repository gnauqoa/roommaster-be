import { runMasterAgent } from './src/ai/agent';
import { streamAgentResponse } from './src/ai/agent';

// Mock process.env if needed, assuming .env is loaded by the runner or I strictly need it.
// Ideally usage: npx tsx test-agent-speed.ts

async function main() {
  console.time('Response Time');
  try {
    const prompt = 'Recommend rooms for a family of 4';
    console.log(`Sending prompt: ${prompt}`);

    // We can use runMasterAgent which prints to stdout
    await runMasterAgent(prompt);
  } catch (error) {
    console.error('Error:', error);
  }
  console.timeEnd('Response Time');
}

main();
