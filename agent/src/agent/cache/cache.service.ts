import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CacheService.name);
    private redis: Redis;

    constructor(private readonly configService: ConfigService) { }

    onModuleInit() {
        const redisUrl = this.configService.get<string>(
            'REDIS_URL',
            'redis://localhost:6379',
        );
        this.logger.log(`Connecting to Redis: ${redisUrl.split('@').pop()}`);

        this.redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3) {
                    this.logger.error('Redis connection failed, giving up');
                    return null;
                }
                return Math.min(times * 50, 2000);
            },
        });

        this.redis.on('error', (err) => {
            this.logger.error(`Redis Error: ${err.message}`);
        });

        this.redis.on('connect', () => {
            this.logger.log('Redis connected successfully');
        });
    }

    onModuleDestroy() {
        if (this.redis) {
            this.redis.disconnect();
        }
    }

    /**
     * Получает кэш или выполняет функцию `fallback` с сохранением результата
     */
    async getOrSet<T>(
        key: string,
        fallback: () => Promise<T>,
        ttlSeconds: number = 24 * 60 * 60, // 24h default
    ): Promise<T> {
        if (!this.redis || this.redis.status !== 'ready') {
            this.logger.warn(`Redis disconnected, bypassing cache for key: ${key}`);
            return fallback();
        }

        try {
            const cached = await this.redis.get(key);
            if (cached) {
                this.logger.log(`[Cache HIT] ${key}`);
                return JSON.parse(cached) as T;
            }
        } catch (err) {
            this.logger.error(`Failed to get cache for ${key}: ${(err as Error).message}`);
        }

        this.logger.log(`[Cache MISS] ${key}`);
        const result = await fallback();

        if (result && this.redis.status === 'ready') {
            try {
                await this.redis.set(key, JSON.stringify(result), 'EX', ttlSeconds);
                this.logger.log(`[Cache SET] ${key} TTL=${ttlSeconds}s`);
            } catch (err) {
                this.logger.error(`Failed to set cache for ${key}: ${(err as Error).message}`);
            }
        }

        return result;
    }

    /**
     * Инвалидация кэша по префиксу или ключу
     */
    async invalidate(key: string): Promise<void> {
        if (!this.redis || this.redis.status !== 'ready') return;
        try {
            if (key.endsWith('*')) {
                const keys = await this.redis.keys(key);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                    this.logger.log(`[Cache INVALIDATED PREFIX] ${key} (${keys.length} keys)`);
                }
            } else {
                await this.redis.del(key);
                this.logger.log(`[Cache INVALIDATED] ${key}`);
            }
        } catch (err) {
            this.logger.error(`Failed to invalidate cache ${key}: ${(err as Error).message}`);
        }
    }

    /**
     * Генерация детерминированного хэша
     */
    generateHash(data: any): string {
        const json = JSON.stringify(data);
        return crypto.createHash('md5').update(json).digest('hex');
    }
}
