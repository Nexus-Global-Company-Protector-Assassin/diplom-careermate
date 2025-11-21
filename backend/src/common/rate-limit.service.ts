import { Injectable } from '@nestjs/common';
import { CacheService } from '../common/cache.service';

@Injectable()
export class RateLimitService {
  private readonly RATE_LIMIT_PREFIX = 'rate:';
  private readonly DEFAULT_TTL = 60; // 1 minute in seconds

  constructor(private cacheService: CacheService) {}

  async increment(key: string, ttl: number = this.DEFAULT_TTL): Promise<number> {
    const fullKey = `${this.RATE_LIMIT_PREFIX}${key}`;
    return await this.cacheService.incrementRateLimit(fullKey, ttl);
  }

  async getLimit(key: string): Promise<number | null> {
    const fullKey = `${this.RATE_LIMIT_PREFIX}${key}`;
    return await this.cacheService.getRateLimit(fullKey);
  }

  async setLimit(key: string, value: number, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const fullKey = `${this.RATE_LIMIT_PREFIX}${key}`;
    await this.cacheService.setRateLimit(fullKey, value, ttl);
  }
}