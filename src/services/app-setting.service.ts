import { PrismaClient } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import { CacheService } from './cache.service';
import {
  ConfigKey,
  TimeConfig,
  CheckInTimeConfig,
  CheckOutTimeConfig,
  DepositPercentageConfig,
  PenaltyServiceIdConfig,
  SurchargeServiceIdConfig
} from './app-setting.types';

@Injectable()
export class AppSettingService {
  constructor(private readonly prisma: PrismaClient, private readonly cacheService: CacheService) {}

  /**
   * Get configuration value by key (with caching)
   */
  async getConfig(key: string): Promise<any> {
    // Check cache first
    const cached = this.cacheService.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Fetch from DB
    const config = await this.prisma.appSetting.findUnique({
      where: { key }
    });

    if (!config) {
      throw new ApiError(httpStatus.NOT_FOUND, `Configuration '${key}' not found`);
    }

    // Cache the value
    this.cacheService.set(key, config.value, 0);
    return config.value;
  }

  /**
   * Set configuration value (invalidates cache)
   */
  async setConfig(key: string, value: any, description?: string): Promise<any> {
    const config = await this.prisma.appSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        description
      },
      update: {
        value,
        ...(description && { description })
      }
    });

    // Invalidate cache
    this.cacheService.del(key);

    return config;
  }

  /**
   * Get all configurations
   */
  async getAllConfigs(): Promise<any[]> {
    const configs = await this.prisma.appSetting.findMany({
      orderBy: { key: 'asc' }
    });

    return configs;
  }

  /**
   * Get check-in time configuration (cached)
   */
  async getCheckInTime(): Promise<CheckInTimeConfig> {
    const config = await this.getConfig(ConfigKey.CHECKIN_TIME);
    return config as CheckInTimeConfig;
  }

  /**
   * Get check-out time configuration (cached)
   */
  async getCheckOutTime(): Promise<CheckOutTimeConfig> {
    const config = await this.getConfig(ConfigKey.CHECKOUT_TIME);
    return config as CheckOutTimeConfig;
  }

  /**
   * Get deposit percentage configuration (cached)
   */
  async getDepositPercentage(): Promise<number> {
    const config = await this.getConfig(ConfigKey.DEPOSIT_PERCENTAGE);
    return (config as DepositPercentageConfig).percentage;
  }

  /**
   * Update check-in time configuration
   */
  async updateCheckInTime(config: TimeConfig): Promise<void> {
    await this.setConfig(ConfigKey.CHECKIN_TIME, config, 'Standard check-in time');
  }

  /**
   * Update check-out time configuration
   */
  async updateCheckOutTime(config: TimeConfig): Promise<void> {
    await this.setConfig(ConfigKey.CHECKOUT_TIME, config, 'Standard check-out time');
  }

  /**
   * Update deposit percentage configuration
   */
  async updateDepositPercentage(percentage: number): Promise<void> {
    if (percentage < 0 || percentage > 100) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Percentage must be between 0 and 100');
    }

    await this.setConfig(
      ConfigKey.DEPOSIT_PERCENTAGE,
      { percentage },
      'Deposit percentage of total booking amount'
    );
  }

  /**
   * Get penalty service ID (cached)
   */
  async getPenaltyServiceId(): Promise<string> {
    const config = await this.getConfig(ConfigKey.PENALTY_SERVICE_ID);
    return (config as PenaltyServiceIdConfig).serviceId;
  }

  /**
   * Get surcharge service ID (cached)
   */
  async getSurchargeServiceId(): Promise<string> {
    const config = await this.getConfig(ConfigKey.SURCHARGE_SERVICE_ID);
    return (config as SurchargeServiceIdConfig).serviceId;
  }

  /**
   * Set penalty service ID
   */
  async setPenaltyServiceId(serviceId: string): Promise<void> {
    await this.setConfig(
      ConfigKey.PENALTY_SERVICE_ID,
      { serviceId },
      'Penalty service ID for custom penalty charges'
    );
  }

  /**
   * Set surcharge service ID
   */
  async setSurchargeServiceId(serviceId: string): Promise<void> {
    await this.setConfig(
      ConfigKey.SURCHARGE_SERVICE_ID,
      { serviceId },
      'Surcharge service ID for custom surcharge fees'
    );
  }
}

export default AppSettingService;
