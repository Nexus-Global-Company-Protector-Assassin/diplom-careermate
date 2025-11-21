import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis(configService.get<string>('REDIS_URL'));
  }

  async onModuleInit() {
    await this.redis.ping();
    console.log('Connected to Redis successfully');
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  // Basic cache methods
  async set(key: string, value: string | object, ttl?: number): Promise<'OK'> {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }

    if (ttl) {
      return await this.redis.set(key, value, 'EX', ttl);
    } else {
      return await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.error(`Error parsing JSON for key ${key}:`, error);
        return null;
      }
    }
    return null;
  }

  async del(key: string): Promise<number> {
    return await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.redis.expire(key, seconds);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  // Specific cache methods for required features
  async setUserSession(userId: string, sessionId: string, ttl: number = 86400): Promise<'OK'> {
    const key = `session:${userId}`;
    return await this.set(key, sessionId, ttl);
  }

  async getUserSession(userId: string): Promise<string | null> {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  async setRateLimit(key: string, value: number, ttl: number = 60): Promise<'OK'> {
    return await this.set(key, value.toString(), ttl);
  }

  async getRateLimit(key: string): Promise<number | null> {
    const value = await this.get(key);
    if (value !== null) {
      return parseInt(value, 10);
    }
    return null;
  }

  async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    const current = await this.get(key);
    let count = 1;

    if (current !== null) {
      count = parseInt(current, 10) + 1;
    }

    await this.set(key, count.toString(), ttl);
    return count;
  }
}