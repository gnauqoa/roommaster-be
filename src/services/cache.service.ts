import { Injectable } from '@/core/decorators';
import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CacheService {
  private cache: NodeCache;

  constructor(private readonly prisma: PrismaClient) {
    // Default TTL: 5 minutes (300 seconds), check every 60 seconds
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  /**
   * Initialize app settings cache
   */
  async initAppSettings(): Promise<void> {
    const settings = await this.prisma.appSetting.findMany();
    for (const setting of settings) {
      this.cache.set(setting.key, setting.value, 0);
    }
    console.log(`Initialized AppSetting cache with ${settings.length} keys`);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in seconds (overrides default)
   */
  set(key: string, value: any, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Delete value from cache
   */
  del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Flush all data from cache
   */
  flushAll(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache stats
   */
  getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }
}

export default CacheService;
