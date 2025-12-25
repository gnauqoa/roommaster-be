/**
 * Application Module Bootstrap
 * Registers all services and controllers in the DI container
 */

import { container, TOKENS } from './container';
import prisma from 'prisma';
import { PrismaClient } from '@prisma/client';
import {
  TokenService,
  AuthService,
  CustomerService,
  EmployeeService,
  BookingService,
  RoomTypeService,
  RoomService,
  HotelServiceService
} from 'services';

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
    TOKENS.BookingService,
    (...args: unknown[]) => new BookingService(args[0] as PrismaClient),
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
    TOKENS.HotelServiceService,
    (...args: unknown[]) => new HotelServiceService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
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
