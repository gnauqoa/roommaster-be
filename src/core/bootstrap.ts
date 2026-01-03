/**
 * Application Module Bootstrap
 * Registers all services and controllers in the DI container
 */

import { container, TOKENS } from './container';
import prisma from '@/prisma';
import { PrismaClient } from '@prisma/client';
import {
  TokenService,
  AuthService,
  CustomerService,
  EmployeeService,
  BookingService,
  RoomTypeService,
  RoomService,
  RoomTagService,
  ServiceService,
  UsageServiceService,
  TransactionService,
  ActivityService,
  PromotionService,
  TransactionDetailsService
} from '@/services';

/**
 * Bootstrap the application by registering all dependencies
 */
export function bootstrap(): void {
  // Register PrismaClient
  container.registerValue(TOKENS.PrismaClient, prisma);

  // Register Services with proper dependency injection
  container.registerFactory(
    TOKENS.TokenService,
    (...args: unknown[]) => new TokenService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.EmployeeService,
    (...args: unknown[]) => new EmployeeService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.CustomerService,
    (...args: unknown[]) => new CustomerService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.ActivityService,
    (...args: unknown[]) => new ActivityService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.RoomTypeService,
    (...args: unknown[]) => new RoomTypeService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.RoomService,
    (...args: unknown[]) => new RoomService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.RoomTagService,
    (...args: unknown[]) => new RoomTagService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.ServiceService,
    (...args: unknown[]) => new ServiceService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.PromotionService,
    (...args: unknown[]) =>
      new PromotionService(args[0] as PrismaClient, args[1] as ActivityService),
    [TOKENS.PrismaClient, TOKENS.ActivityService]
  );

  container.registerFactory(
    TOKENS.TransactionService,
    (...args: unknown[]) =>
      new TransactionService(
        args[0] as PrismaClient,
        args[1] as ActivityService,
        args[2] as UsageServiceService,
        args[3] as PromotionService
      ),
    [
      TOKENS.PrismaClient,
      TOKENS.ActivityService,
      TOKENS.UsageServiceService,
      TOKENS.PromotionService
    ]
  );

  container.registerFactory(
    TOKENS.TransactionDetailsService,
    (...args: unknown[]) => new TransactionDetailsService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.BookingService,
    (...args: unknown[]) =>
      new BookingService(
        args[0] as PrismaClient,
        args[1] as TransactionService,
        args[2] as ActivityService
      ),
    [TOKENS.PrismaClient, TOKENS.TransactionService, TOKENS.ActivityService]
  );

  container.registerFactory(
    TOKENS.UsageServiceService,
    (...args: unknown[]) =>
      new UsageServiceService(args[0] as PrismaClient, args[1] as ActivityService),
    [TOKENS.PrismaClient, TOKENS.ActivityService]
  );

  container.registerFactory(
    TOKENS.AuthService,
    (...args: unknown[]) =>
      new AuthService(
        args[0] as PrismaClient,
        args[1] as TokenService,
        args[2] as CustomerService,
        args[3] as EmployeeService
      ),
    [TOKENS.PrismaClient, TOKENS.TokenService, TOKENS.CustomerService, TOKENS.EmployeeService]
  );
}

export default bootstrap;
