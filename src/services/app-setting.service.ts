import { PrismaClient } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import NodeCache from 'node-cache';
import {
  ConfigKey,
  TimeConfig,
  CheckInTimeConfig,
  CheckOutTimeConfig,
  DepositPercentageConfig
} from './app-setting.types';

@Injectable()
export class AppSettingService {
  private cache: NodeCache;

  constructor(private readonly prisma: PrismaClient) {
    // Cache for 5 minutes (300 seconds), check period every 60 seconds
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  /**
   * Get configuration value by key (with caching)
   */
  async getConfig(key: string): Promise<any> {
    // Check cache first
    const cached = this.cache.get(key);
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
    this.cache.set(key, config.value);
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
    this.cache.del(key);

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
   * Clear all cache
   */
  clearCache(): void {
    this.cache.flushAll();
  }

  /**
   * Initialize default configurations if they don't exist
   */
  async initializeDefaults(): Promise<void> {
    const defaults = [
      {
        key: ConfigKey.CHECKIN_TIME,
        value: { hour: 14, minute: 0, gracePeriodMinutes: 60 },
        description: 'Standard check-in time'
      },
      {
        key: ConfigKey.CHECKOUT_TIME,
        value: { hour: 12, minute: 0, gracePeriodMinutes: 60 },
        description: 'Standard check-out time'
      },
      {
        key: ConfigKey.DEPOSIT_PERCENTAGE,
        value: { percentage: 50 },
        description: 'Deposit percentage of total booking amount'
      }
    ];

    for (const config of defaults) {
      const existing = await this.prisma.appSetting.findUnique({
        where: { key: config.key }
      });

      if (!existing) {
        await this.prisma.appSetting.create({
          data: config
        });
      }
    }
  }
}

export default AppSettingService;
