/**
 * Simple Dependency Injection Container
 * Provides NestJS-like DI pattern for Express applications
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = any> = new (...args: any[]) => T;

interface ProviderDefinition {
  token: string | symbol;
  useClass?: Constructor;
  useValue?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory?: (...args: any[]) => unknown;
  inject?: (string | symbol)[];
}

class Container {
  private providers = new Map<string | symbol, ProviderDefinition>();
  private instances = new Map<string | symbol, unknown>();

  /**
   * Register a provider in the container
   */
  register(definition: ProviderDefinition): void {
    this.providers.set(definition.token, definition);
  }

  /**
   * Register a class provider
   */
  registerClass<T>(token: string | symbol, useClass: Constructor<T>): void {
    this.providers.set(token, { token, useClass });
  }

  /**
   * Register a value provider
   */
  registerValue<T>(token: string | symbol, value: T): void {
    this.providers.set(token, { token, useValue: value });
    this.instances.set(token, value);
  }

  /**
   * Register a factory provider
   */
  registerFactory<T>(
    token: string | symbol,
    factory: (...args: unknown[]) => T,
    inject?: (string | symbol)[]
  ): void {
    this.providers.set(token, { token, useFactory: factory, inject });
  }

  /**
   * Resolve a dependency from the container
   */
  resolve<T>(token: string | symbol): T {
    // Return cached instance if exists
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    const provider = this.providers.get(token);
    if (!provider) {
      throw new Error(`No provider found for token: ${String(token)}`);
    }

    let instance: T;

    if (provider.useValue !== undefined) {
      instance = provider.useValue as T;
    } else if (provider.useFactory) {
      const deps = (provider.inject || []).map((dep) => this.resolve(dep));
      instance = provider.useFactory(...deps) as T;
    } else if (provider.useClass) {
      // Get constructor parameter types from metadata or use inject array
      const deps = (provider.inject || []).map((dep) => this.resolve(dep));
      instance = new provider.useClass(...deps) as T;
    } else {
      throw new Error(`Invalid provider definition for token: ${String(token)}`);
    }

    // Cache the instance (singleton by default)
    this.instances.set(token, instance);
    return instance;
  }

  /**
   * Check if a provider is registered
   */
  has(token: string | symbol): boolean {
    return this.providers.has(token);
  }

  /**
   * Clear all instances (useful for testing)
   */
  clearInstances(): void {
    this.instances.clear();
  }

  /**
   * Reset the container
   */
  reset(): void {
    this.providers.clear();
    this.instances.clear();
  }
}

// Export singleton container
export const container = new Container();

// Export tokens for type-safe dependency injection
export const TOKENS = {
  // Services
  PrismaClient: Symbol('PrismaClient'),
  AuthService: Symbol('AuthService'),
  TokenService: Symbol('TokenService'),
  EmailService: Symbol('EmailService'),
  EmployeeService: Symbol('EmployeeService'),
  CustomerService: Symbol('CustomerService'),
  RoomService: Symbol('RoomService'),
  ReservationService: Symbol('ReservationService'),
  StayRecordService: Symbol('StayRecordService'),
  FolioService: Symbol('FolioService'),
  ServiceService: Symbol('ServiceService'),
  HousekeepingService: Symbol('HousekeepingService'),
  InvoiceService: Symbol('InvoiceService'),
  InspectionService: Symbol('InspectionService'),
  CustomerTierService: Symbol('CustomerTierService'),
  ShiftService: Symbol('ShiftService'),
  NightlyService: Symbol('NightlyService'),
  ReportService: Symbol('ReportService'),

  // Controllers
  AuthController: Symbol('AuthController'),
  EmployeeController: Symbol('EmployeeController'),
  CustomerController: Symbol('CustomerController'),
  RoomController: Symbol('RoomController'),
  ReservationController: Symbol('ReservationController'),
  StayRecordController: Symbol('StayRecordController'),
  FolioController: Symbol('FolioController'),
  ServiceController: Symbol('ServiceController'),
  HousekeepingController: Symbol('HousekeepingController'),
  InvoiceController: Symbol('InvoiceController'),
  InspectionController: Symbol('InspectionController'),
  CustomerTierController: Symbol('CustomerTierController'),
  ShiftController: Symbol('ShiftController'),
  NightlyController: Symbol('NightlyController'),
  ReportController: Symbol('ReportController')
} as const;

export type TokenKey = keyof typeof TOKENS;

export default container;
