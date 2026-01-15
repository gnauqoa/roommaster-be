import { sqlQueryTool, askDatabaseTool } from '../src/ai/tools';
import * as dotenv from 'dotenv';
import path from 'path';

// ensure env vars are loaded
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0]; // --sql or --ask
  const input = args.slice(1).join(' ');

  if (!mode || !input) {
    console.log('Usage:');
    console.log('  npx ts-node scripts/test-ai-tools.ts --sql "SELECT * FROM \\"Room\\" LIMIT 1"');
    console.log('  npx ts-node scripts/test-ai-tools.ts --ask "How many rooms are there?"');
    process.exit(1);
  }

  try {
    if (mode === '--sql') {
      console.log(`[Test] Executing SQL: ${input}`);
      const result = await sqlQueryTool.execute(
        { query: input },
        { toolCallId: 'test', messages: [] }
      );
      console.log('[Test] Result:');
      console.log(result);
    } else if (mode === '--ask') {
      console.log(`[Test] Asking Database: ${input}`);
      const result = await askDatabaseTool.execute(
        { question: input },
        { toolCallId: 'test', messages: [] }
      );
      console.log('[Test] Result:');
      console.log(result);
    } else {
      console.error('Unknown mode. Use --sql or --ask');
    }
  } catch (error) {
    console.error('[Test] Error:', error);
  }
}

main().catch(console.error);
