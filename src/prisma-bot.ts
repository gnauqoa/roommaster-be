import { PrismaClient } from '@prisma/client';
import config from './config/env';

// add prismaBot to the NodeJS global type
interface CustomNodeJsGlobal extends Global {
  prismaBot: PrismaClient;
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal;

export const prismaBot =
  global.prismaBot ||
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_READONLY } }
  });

if (config.env === 'development') global.prismaBot = prismaBot;
