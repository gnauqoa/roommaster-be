import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { prismaBot } from '../prisma-bot';
import fs from 'fs';
import path from 'path';
import { google, GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';

export const sqlQueryTool = tool({
  description: 'Execute a raw SQL query against the database',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'The SQL query to execute. Example: SELECT * FROM "Room" WHERE status = \'Available\' LIMIT 5;'
      )
  }),
  execute: async ({ query }: { query: string }) => {
    console.log(`[SQL Tool] Executing: ${query}`);
    try {
      // Sanitize the query: Ensure PascalCase table names are quoted
      // This regex finds words in the table list that are NOT surrounded by quotes and quotes them.
      let sanitizedQuery = query;
      const tables = [
        'Employee',
        'Customer',
        'RoomType',
        'RoomTypeImage',
        'RoomTag',
        'RoomTypeTag',
        'Room',
        'RoomImage',
        'Booking',
        'PaymentImage',
        'BookingRoom',
        'BookingCustomer',
        'Transaction',
        'TransactionDetail',
        'Service',
        'ServiceImage',
        'ServiceUsage',
        'Activity',
        'Promotion',
        'CustomerPromotion',
        'UsedPromotion',
        'AppSetting',
        'Role',
        'Permission',
        'CalendarEvent',
        'PricingRule',
        'CustomerRank',
        'RolePermission'
      ];
      tables.forEach((table) => {
        // Regex: matches the table name word boundary, ensuring it's NOT preceded or followed by a double quote
        const regex = new RegExp(`(?<!")\\b${table}\\b(?!")`, 'gi');
        sanitizedQuery = sanitizedQuery.replace(regex, `"${table}"`);
      });
      if (query !== sanitizedQuery) {
        console.log(`[SQL Tool] Auto-quoted query: ${sanitizedQuery}`);
      }
      // $queryRawUnsafe allows passing a raw string string
      const result = await prismaBot.$queryRawUnsafe(sanitizedQuery);
      // Prisma returns BigInts which break JSON.stringify. Convert them.
      // We return the raw object; the SDK will handle stringification if needed,
      // but returning a string is safer for large numbers/BigInts.
      const cleanResult = JSON.parse(
        JSON.stringify(result, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );
      return JSON.stringify(cleanResult);
    } catch (error) {
      console.error('[SQL Error]', error);
      return `Database Error: ${error}. (Hint: Check table names)`;
    }
  }
});
export const askDatabaseTool = tool({
  description:
    'Ask a natural language question about the database. Generates SQL, executes it using the sqlQueryTool, and returns the answer.',
  inputSchema: z.object({
    question: z.string().describe("The user's question about the data")
  }),
  execute: async ({ question }: { question: string }) => {
    try {
      // 1. Read the Database Schema Context to give context to the LLM
      const schemaPath = path.join(process.cwd(), 'src', 'ai', 'database-schema.md');
      const schemaContext = fs.readFileSync(schemaPath, 'utf-8');
      // 2. Use generateText with tools to let the AI plan and execute the query
      const { text } = await generateText({
        model: google('gemini-3-flash'),
        tools: {
          sqlQuery: sqlQueryTool
        },
        stopWhen: stepCountIs(10), // Allow up to 5 steps (think -> tool call -> tool result -> think -> response)
        system: `You are a SQL expert and database assistant.
Your goal is to answer the user's question by querying the database.
Database Schema Summary:
${schemaContext}
Rules:
- You have access to a tool 'sqlQuery' that executes PostgreSQL queries.
- Generate valid PostgreSQL SQL based on the schema summary.
- Use explicit table names (e.g. "Room", "Booking") matching the schema descriptions.
- ALWAYS use the 'sqlQuery' tool to get the data. Do NOT make up data.
- Always use table aliases and prefix columns (e.g., r.id) when joining tables.
- After getting the data, return the query result immediately.
- If the query fails, try to fix it and run again.
`,
        prompt: question,
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingLevel: 'high'
            }
          } satisfies GoogleGenerativeAIProviderOptions
        }
      });
      return text;
    } catch (error) {
      console.error('[AskDB Error]', error);
      return `Error processing request: ${error}`;
    }
  }
});
