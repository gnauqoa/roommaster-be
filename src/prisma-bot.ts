import { PrismaClient } from '@prisma/client';
import config from './config/env';

declare global {
  var prismaBot: PrismaClient | undefined;
}

const prismaBot =
  global.prismaBot ||
  new PrismaClient({
    // @ts-ignore
    datasources: { db: { url: config.databaseUrlReadOnly } }
  });

if (config.env === 'development') global.prismaBot = prismaBot;

export default prismaBot;
