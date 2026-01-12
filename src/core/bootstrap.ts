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
  TransactionDetailsService,
  AppSettingService,
  ImageService,
  RoleService,
  PermissionService
} from '@/services';
import PricingRuleService from '@/services/pricing-rule.service';
import PricingCalculatorService from '@/services/pricing-calculator.service';
import CaslService from '@/services/casl.service';
import TemplateService from '@/services/template.service';
import EmailService from '@/services/email.service';
import CustomerRankService from '@/services/customer-rank.service';

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
        args[3] as PromotionService,
        args[4] as EmailService
      ),
    [
      TOKENS.PrismaClient,
      TOKENS.ActivityService,
      TOKENS.UsageServiceService,
      TOKENS.PromotionService,
      TOKENS.EmailService
    ]
  );

  container.registerFactory(
    TOKENS.TransactionDetailsService,
    (...args: unknown[]) => new TransactionDetailsService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.UsageServiceService,
    (...args: unknown[]) =>
      new UsageServiceService(
        args[0] as PrismaClient,
        args[1] as ActivityService,
        args[2] as AppSettingService
      ),
    [TOKENS.PrismaClient, TOKENS.ActivityService, TOKENS.AppSettingService]
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

  container.registerFactory(
    TOKENS.AppSettingService,
    (...args: unknown[]) => new AppSettingService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  container.registerFactory(
    TOKENS.CaslService,
    (...args: unknown[]) => new CaslService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  // Register TemplateService (no dependencies)
  container.registerFactory(TOKENS.TemplateService, () => new TemplateService(), []);

  // Register EmailService
  container.registerFactory(
    TOKENS.EmailService,
    (...args: unknown[]) => new EmailService(args[0] as TemplateService, args[1] as PrismaClient),
    [TOKENS.TemplateService, TOKENS.PrismaClient]
  );

  // Re-register BookingService with EmailService and RoomService dependencies
  container.registerFactory(
    TOKENS.BookingService,
    (...args: unknown[]) =>
      new BookingService(
        args[0] as PrismaClient,
        args[1] as TransactionService,
        args[2] as ActivityService,
        args[3] as AppSettingService,
        args[4] as EmailService,
        args[5] as RoomService
      ),
    [
      TOKENS.PrismaClient,
      TOKENS.TransactionService,
      TOKENS.ActivityService,
      TOKENS.AppSettingService,
      TOKENS.EmailService,
      TOKENS.RoomService
    ]
  );

  // Register PricingRuleService
  container.registerFactory(
    TOKENS.PricingRuleService,
    (...args: unknown[]) => new PricingRuleService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  // Register PricingCalculatorService
  container.registerFactory(
    TOKENS.PricingCalculatorService,
    (...args: unknown[]) => new PricingCalculatorService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  // Register CustomerRankService
  container.registerFactory(
    TOKENS.CustomerRankService,
    (...args: unknown[]) => new CustomerRankService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  // Register ImageService
  container.registerFactory(
    TOKENS.ImageService,
    (...args: unknown[]) => new ImageService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  // Register RoleService
  container.registerFactory(
    TOKENS.RoleService,
    (...args: unknown[]) => new RoleService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  // Register PermissionService
  container.registerFactory(
    TOKENS.PermissionService,
    (...args: unknown[]) => new PermissionService(args[0] as PrismaClient),
    [TOKENS.PrismaClient]
  );

  // Initialize default configurations
  const appSettingService = container.resolve<AppSettingService>(TOKENS.AppSettingService);
  appSettingService.initializeDefaults().catch((error) => {
    console.error('Failed to initialize default configurations:', error);
  });
}

export default bootstrap;
