import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { prismaBot } from '../prisma-bot';
import fs from 'fs';
import path from 'path';
import { google, GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { ollama } from 'ai-sdk-ollama';
export const sqlQueryTool = tool({
  description: 'Execute a raw SQL query against the database',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'The SQL query to execute. Example: SELECT * FROM "Room" WHERE status = \'AVAILABLE\' LIMIT 5;'
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
        model: google('gemini-3-flash-preview'),
        // model: ollama('qwen3:4b'),
        tools: {
          sqlQuery: sqlQueryTool
        },
        stopWhen: stepCountIs(5), // Allow up to 5 steps (think -> tool call -> tool result -> think -> response)
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
        // providerOptions: { ollama: { think: true } }

        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingLevel: 'medium'
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

export const searchRoomsTool = tool({
  description:
    'Search for available hotel rooms to suggest to the customer. Returns a structured list of available rooms with details (price, image, type).',
  inputSchema: z.object({
    maxPrice: z.number().optional().describe('Maximum price per night'),
    roomType: z
      .string()
      .optional()
      .describe('Preferred room type name (e.g. "Single", "Double", "Suite")'),
    guests: z
      .number()
      .optional()
      .describe('Number of guests/capacity needed (e.g. 4 for a family)'),
    checkIn: z
      .string()
      .optional()
      .describe(
        'Check-in date in YYYY-MM-DD format (if user says "tomorrow" or "weekend", convert to date)'
      ),
    checkOut: z.string().optional().describe('Check-out date in YYYY-MM-DD format'),
    limit: z.number().optional().default(5).describe('Number of rooms to return (default 5)')
  }),
  execute: async ({ maxPrice, roomType, guests, checkIn, checkOut, limit }) => {
    try {
      console.log('[SearchRooms] Searching...', {
        maxPrice,
        roomType,
        guests,
        checkIn,
        checkOut,
        limit
      });

      const whereClause: any = {
        status: 'AVAILABLE'
      };

      // Handle related filters
      if (roomType || maxPrice || guests) {
        whereClause.roomType = {};

        if (roomType) {
          whereClause.roomType.name = {
            contains: roomType,
            mode: 'insensitive'
          };
        }

        if (maxPrice) {
          whereClause.roomType.basePrice = {
            lte: maxPrice
          };
        }

        if (guests) {
          whereClause.roomType.capacity = {
            gte: guests // Capacity must be greater than or equal to guests
          };
        }
      }

      // Date Availability Logic
      // If dates are provided, ensure no overlapping bookings exist for this room
      if (checkIn && checkOut) {
        // Convert strings to Dates for comparison (Prisma expects date objects usually, or ISO strings)
        // Using ISO strings is safer for queryRaw, but findMany handles Dates well.
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        whereClause.bookingRooms = {
          none: {
            OR: [
              // Standard overlap check: (StartA <= EndB) and (EndA >= StartB)
              // Here: ExistingBooking.CheckIn < NewRequest.CheckOut AND ExistingBooking.CheckOut > NewRequest.CheckIn
              {
                AND: [
                  { checkInDate: { lt: checkOutDate } },
                  { checkOutDate: { gt: checkInDate } },
                  {
                    status: {
                      in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] // Only count active bookings
                    }
                  }
                ]
              }
            ]
          }
        };
      }

      const rooms = await prismaBot.room.findMany({
        where: whereClause,
        take: limit,
        include: {
          roomType: {
            include: {
              images: true // Schema: images RoomTypeImage[]
            }
          },
          images: true // Schema: images RoomImage[]
        },
        orderBy: {
          roomNumber: 'asc'
        }
      });

      // Transform to a clean format for the AI to return
      const simplifiedRooms = rooms.map((r) => {
        // Prefer room-specific image, fallback to room type image
        const mainImage = r.images[0]?.url || r.roomType?.images[0]?.url || '';

        return {
          id: r.id,
          roomNumber: r.roomNumber,
          type: r.roomType?.name || 'Standard',
          capacity: r.roomType?.capacity || 2,
          price: r.roomType?.basePrice ? Number(r.roomType.basePrice.toString()) : 0,
          description: '', // Schema does not have description on Room/RoomType easily accessible
          image: mainImage
        };
      });

      return JSON.stringify(simplifiedRooms);
    } catch (error) {
      console.error('[SearchRooms Error]', error);
      return `Error searching rooms: ${error}`;
    }
  }
});
