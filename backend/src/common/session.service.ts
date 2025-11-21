import { Injectable } from '@nestjs/common';
import { CacheService } from '../common/cache.service';

@Injectable()
export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly SESSION_TTL = 86400; // 24 hours in seconds

  constructor(private cacheService: CacheService) {}

  async createSession(userId: string, sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${userId}`;
    await this.cacheService.setWithTTL(key, sessionId, this.SESSION_TTL);
  }

  async getSession(userId: string): Promise<string | null> {
    const key = `${this.SESSION_PREFIX}${userId}`;
    return await this.cacheService.get<string>(key);
  }

  async deleteSession(userId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${userId}`;
    await this.cacheService.delete(key);
  }
}