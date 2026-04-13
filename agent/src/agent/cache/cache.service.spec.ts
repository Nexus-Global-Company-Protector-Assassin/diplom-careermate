import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';

// Мокируем класс Redis
jest.mock('ioredis', () => {
    return function () {
        return {
            get: jest.fn(),
            setex: jest.fn(),
            on: jest.fn(),
        };
    };
});

describe('CacheService', () => {
    let service: CacheService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CacheService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key) => {
                            if (key === 'REDIS_URL') return 'redis://localhost:6379';
                            return null;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<CacheService>(CacheService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should generate consistent hash for same object', () => {
        const obj1 = { name: 'test', age: 25 };

        const hash1 = service.generateHash(obj1);
        const hash2 = service.generateHash(obj1);

        expect(hash1).toEqual(hash2);
        expect(hash1).toHaveLength(32);
    });

    it('should bypass cache if fallback getter is provided and redis fails', async () => {
        const mockGetter = jest.fn().mockResolvedValue({ data: 'hello' });
        const result = await service.getOrSet('test_key', mockGetter);

        expect(result).toEqual({ data: 'hello' });
        expect(mockGetter).toHaveBeenCalledTimes(1);
    });
});
