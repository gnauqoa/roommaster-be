import { runMasterAgent } from '../src/ai/agent';
import * as readline from 'readline';

/**
 * Validates that required environment variables are set.
 * These are required by src/config/env.ts and the AI SDK.
 */
function checkEnv() {
  const required = ['DATABASE_URL_READONLY', 'GOOGLE_GENERATIVE_AI_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(
      `Warning: The following environment variables seem to be missing: ${missing.join(', ')}`
    );
    console.warn('Ensure you have a .env file in the project root and it is loaded.');
  }
}

async function main() {
  // src/config/env.ts should automatically load .env when imported transitively
  // but we can check if it worked.
  if (!process.env.DATABASE_URL) {
    // Attempt to load .env if not already loaded (though importing agent -> tools -> prisma-bot -> config/env likely did it)
    require('dotenv').config();
  }

  checkEnv();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = process.argv[2];

  if (question) {
    await runAgent(question);
    rl.close();
    process.exit(0);
  } else {
    console.log('RoomMaster AI Agent Test Script');
    console.log('-------------------------------');
    console.log('Enter a prompt to test the agent (or "exit" to quit).');

    const ask = () => {
      rl.question('\nUser Prompt: ', async (input) => {
        if (input.toLowerCase() === 'exit') {
          rl.close();
          process.exit(0);
        }
        await runAgent(input);
        ask();
      });
    };
    ask();
  }
}

async function runAgent(prompt: string) {
  console.log(`\n[Test] Sending prompt: "${prompt}"...`);
  try {
    const response = await runMasterAgent(prompt);
    console.log('\n[Test] Final Response:\n');
    console.log(response);
  } catch (error: any) {
    console.error('\n[Test] Error:', error.message || error);
    if (error?.cause) console.error('Cause:', error.cause);

    // Log full error details for debugging
    console.error('Full Error Details:');
    console.dir(error, { depth: null, colors: true });
  }
}

main().catch(console.error);
