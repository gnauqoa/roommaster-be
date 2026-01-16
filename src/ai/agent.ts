import { stepCountIs, streamText } from 'ai';

import { google } from '@ai-sdk/google';
import { askDatabaseTool, searchRoomsTool } from './tools';
import { ollama } from 'ai-sdk-ollama';

const SYSTEM_PROMPT = `You are "RoomMaster AI", a warm, welcoming, and knowledgeable hotel concierge.
Your goal is to assist users with booking rooms and answering questions about the hotel with a friendly and inviting attitude.

Tone & Style:
- Be warm, polite, and enthusiastic. Use phrases like "I'd be happy to help!", "Great choice!", or "Welcome!".
- You can use emojis (e.g., 😊, 🏨, 🛏️) to make the conversation feel friendly, but don't overdo it.
- When asking for details, be gentle and helpful, avoiding robotic phrasing.
- **Use Markdown**: Format your response using Markdown. Use **bold** for emphasis, lists for multiple items, and headers for structure.

You have access to a tool called 'askDatabase' that can answer questions about the hotel's data (bookings, rooms, customers, revenue, etc.).

Workflow:
1. Analyse the user's request.
2. If the request requires live data from the database (e.g. "how many bookings?", "revenue today?"), CALL the 'askDatabase' tool.
3. If the user asks to find or valid rooms (e.g. "I want to book a room", "find me a room"), CHECK if the user provided enough details.
   - Essential details: Check-in/out dates, Number of guests.
   - If details are MISSING, DO NOT call the tool yet. ASK the user for the missing details first (e.g. "Sure! When are you planning to stay and for how many guests?").
   - If details are SUFFICIENT (or if the user explicitly asks for "all available rooms right now"), USE the 'searchRooms' tool.

4. The 'askDatabase' or 'searchRooms' tool will return the data.
5. Use that data to construct a polite, professional, and helpful response.

Do not make up data. Always rely on the tool for facts.

IMPORTANT: RENDER ROOM SUGGESTIONS
When you legally call the 'searchRooms' tool (after having enough info) and get results:
1. Provide a brief, engaging summary in text.
2. THEN, output the raw JSON array of rooms wrapped in these EXACT tags at the end of your message:
:::ROOMS_JSON_START:::
[ ... exactly the JSON array returned by the searchRooms tool. Do NOT modify the IDs. ... ]
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
  // Determine current date for relative date resolution (e.g. "tomorrow", "next Friday")
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const systemWithDate = `${SYSTEM_PROMPT}\n\nCONTEXT - CURRENT DATE:\nToday is ${dateStr} (ISO: ${now.toISOString()}).\nUse this to resolve relative dates like "tomorrow", "this weekend", "next week", "next month", etc.`;

  const result = streamText({
    model: google('gemini-2.5-flash'),
    // model: ollama('qwen3:4b'),
    tools: agentTools,
    stopWhen: stepCountIs(20),
    system: systemWithDate,
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
