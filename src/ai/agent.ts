import { stepCountIs, streamText } from 'ai';

import { google } from '@ai-sdk/google';
import { askDatabaseTool, searchRoomsTool } from './tools';
import { ollama } from 'ai-sdk-ollama';

const SYSTEM_PROMPT = `You are a helpful and knowledgeable hotel management assistant "RoomMaster AI".
You have access to a tool called 'askDatabase' that can answer questions about the hotel's data (bookings, rooms, customers, revenue, etc.).

Workflow:
1. Analyse the user's request.
2. If the request requires live data from the database (e.g. "how many bookings?", "available rooms?", "revenue today?"), CALL the 'askDatabase' tool.
3. The 'askDatabase' tool will return the raw data or a summary.
4. Use that data to construct a polite, professional, and helpful response to the user.

Do not make up data. Always rely on the tool for facts.

IMPORTANT: RENDER ROOM SUGGESTIONS
If the user asks to suggest rooms or check availability, ALWAYS uses the 'searchRooms' tool.
After the tool returns the room data, you must:
1. Provide a brief, engaging summary in text.
2. THEN, output the raw JSON array of rooms wrapped in these EXACT tags at the end of your message:
:::ROOMS_JSON_START:::
[ ... json array from tool ... ]
:::ROOMS_JSON_END:::

Example output:
"I found some great rooms for you! The Deluxe Suite is available for $200.
:::ROOMS_JSON_START:::
[{"id":"1","type":"Deluxe","price":200,"image":"..."}]
:::ROOMS_JSON_END:::
"
`;

// Tool configuration for streamText
const agentTools = {
  askDatabase: askDatabaseTool,
  searchRooms: searchRoomsTool
};

/**
 * Stream agent response for HTTP streaming (React Native mobile app).
 *
 * IMPORTANT: This function returns a StreamTextResult IMMEDIATELY (synchronously).
 * The StreamTextResult is a wrapper object containing:
 * - `textStream`: AsyncIterable that yields text chunks as they arrive from the AI
 * - `text`: Promise<string> that resolves to complete text (after stream is fully consumed)
 * - `pipeTextStreamToResponse(res)`: Method to pipe stream directly to Express/HTTP response
 *
 * The actual AI response is NOT available immediately - it streams over time.
 * How you consume this result determines the streaming behavior:
 *
 * For HTTP APIs (React Native): Use `result.pipeTextStreamToResponse(res)`
 * For CLI/Testing: Iterate over `result.textStream` with for-await-of
 *
 * @param messages - The history of messages in the conversation
 * @param customerId - Optional customer ID for context/logging
 * @returns StreamTextResult - wrapper object for consuming the stream
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function streamAgentResponse(messages: any[], customerId?: string) {
  console.log(
    `[Master Agent] Streaming response for ${messages.length} messages${
      customerId ? ` (Customer: ${customerId})` : ''
    }`
  );

  // streamText() returns IMMEDIATELY with a StreamTextResult object
  // The actual AI generation happens asynchronously in the background
  const result = streamText({
    // model: google('gemini-2.5-flash'),
    model: ollama('qwen3:4b'),
    tools: agentTools,
    stopWhen: stepCountIs(20),
    system: SYSTEM_PROMPT,
    messages
  });

  // Return the StreamTextResult immediately - consumer decides how to use it
  return result;
}

/**
 * Run master agent with console output (for CLI/testing ONLY).
 *
 * NOTE: This function is NOT used by the HTTP API controller.
 * The controller calls streamAgentResponse() directly and uses
 * pipeTextStreamToResponse() to stream to the HTTP response.
 *
 * This function consumes the stream by logging each chunk to console,
 * then waits for the complete text via result.text Promise.
 *
 * @param userPrompt - The user's message/question
 * @returns Promise resolving to the complete response text
 */
export async function runMasterAgent(userPrompt: string): Promise<string> {
  console.log(`[Master Agent] Received prompt: ${userPrompt}`);

  const messages: any[] = [{ role: 'user', content: userPrompt }];

  // Get the StreamTextResult (returns immediately)
  const result = streamAgentResponse(messages);

  // Consume the stream by iterating - each chunk is logged as it arrives
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
  console.log(); // New line after streaming completes

  // result.text is a Promise that resolves to the complete accumulated text
  // It resolves after the stream is fully consumed (which we just did above)
  return result.text;
}
