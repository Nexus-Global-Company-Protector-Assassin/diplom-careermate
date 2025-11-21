import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { RedisModule } from './redis.module';

@Module({
  imports: [RedisModule],
  providers: [PrismaService, ConfigService],
  exports: [PrismaService, RedisModule],
})
export class CommonServiceModule {}