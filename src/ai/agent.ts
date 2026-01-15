import { stepCountIs, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { askDatabaseTool } from './tools';

export async function runMasterAgent(userPrompt: string) {
  console.log(`[Master Agent] Received prompt: ${userPrompt}`);

  // streamText returns a StreamTextResult immediately
  const result = streamText({
    model: google('gemini-3-flash'),
    tools: {
      askDatabase: askDatabaseTool
    },
    stopWhen: stepCountIs(20), // Allow up to 5 steps for tool execution (agentic loop)
    system: `You are a helpful and knowledgeable hotel management assistant "RoomMaster AI".
You have access to a tool called 'askDatabase' that can answer questions about the hotel's data (bookings, rooms, customers, revenue, etc.).

Workflow:
1. Analyse the user's request.
2. If the request requires live data from the database (e.g. "how many bookings?", "available rooms?", "revenue today?"), CALL the 'askDatabase' tool.
3. The 'askDatabase' tool will return the raw data or a summary.
4. Use that data to construct a polite, professional, and helpful response to the user.

Do not make up data. Always rely on the tool for facts.
`,
    prompt: userPrompt
  });

  for await (const textPart of result.textStream) {
    console.log(textPart);
  }
  return result.text;
}
