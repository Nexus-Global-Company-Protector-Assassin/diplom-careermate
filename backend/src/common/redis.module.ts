import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { SessionService } from './session.service';
import { RateLimitService } from './rate-limit.service';

@Module({
  providers: [RedisService, CacheService, SessionService, RateLimitService, ConfigService],
  exports: [RedisService, CacheService, SessionService, RateLimitService],
})
export class RedisModule {}