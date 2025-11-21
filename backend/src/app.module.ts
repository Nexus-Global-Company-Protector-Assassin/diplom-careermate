import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ResumesModule } from './resumes/resumes.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { AiModule } from './ai/ai.module';
import { DatabaseModule } from './common/database.module';
import { CommonServiceModule } from './common/common-service.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
    }),
    DatabaseModule,
    CommonServiceModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ResumesModule,
    JobsModule,
    ApplicationsModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}