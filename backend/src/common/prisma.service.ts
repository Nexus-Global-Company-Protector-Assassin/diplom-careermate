import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'warn',
        },
        {
          emit: 'event',
          level: 'info',
        },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    
    // Enable query logging in development
    if (process.env.NODE_ENV !== 'production') {
      this.$on('query', (e) => {
        console.log('Query: ', e.query);
        console.log('Params: ', e.params);
        console.log('Duration: ', e.duration + 'ms');
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}