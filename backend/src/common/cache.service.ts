import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  constructor(private redisService: RedisService) {}

  // Generic cache methods
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.redisService.set(key, value, ttl);
  }

  async get<T>(key: string): Promise<T | null> {
    return await this.redisService.getJson<T>(key);
  }

  async delete(key: string): Promise<void> {
    await this.redisService.del(key);
  }

  async has(key: string): Promise<boolean> {
    return await this.redisService.exists(key);
  }

  async setWithTTL<T>(key: string, value: T, ttlInSeconds: number): Promise<void> {
    await this.redisService.set(key, value, ttlInSeconds);
  }

  // Specific cache methods for app features
  async setUserSession(userId: string, sessionId: string, ttl: number = 86400): Promise<void> {
    await this.redisService.setUserSession(userId, sessionId, ttl);
  }

  async getUserSession(userId: string): Promise<string | null> {
    return await this.redisService.getUserSession(userId);
  }

  async deleteSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.redisService.del(key);
  }

  async setRateLimit(key: string, value: number, ttl: number = 60): Promise<void> {
    await this.redisService.setRateLimit(key, value, ttl);
  }

  async getRateLimit(key: string): Promise<number | null> {
    return await this.redisService.getRateLimit(key);
  }

  async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    return await this.redisService.incrementRateLimit(key, ttl);
  }

  // Generic cache helpers for common use cases
  async cacheFunction<T>(
    cacheKey: string, 
    fn: () => Promise<T>, 
    ttl: number = 3600
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.setWithTTL(cacheKey, result, ttl);
    
    return result;
  }
}